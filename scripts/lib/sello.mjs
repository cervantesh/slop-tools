// Estado epistemico de cada comprobacion: lo medido frente a lo opinado.
// Usado por slop-scan (salida humana) y slop-fix (orden del plan).

import { nivelConfianza } from './nucleo.mjs'

export const ESFUERZO = {
  Copy: 1, Localizacion: 1, Imagen: 2, Calidad: 2,
  Color: 2, Tipografia: 2, Motion: 2, Accesibilidad: 2,
  Layout: 3, Estructura: 3,
}

export const CAPA = {
  Copy: 'Contenido y datos', Localizacion: 'Contenido y datos',
  Imagen: 'Imagen', Accesibilidad: 'Accesibilidad',
  Color: 'Sistema visual', Tipografia: 'Sistema visual', Layout: 'Sistema visual',
  Motion: 'Sistema visual', Estructura: 'Arquitectura', Calidad: 'Higiene del codigo',
}

export function sello(c) {
  const v = c.validado
  const tier = (c.id && c.tipo !== 'defecto' && c.tipo !== 'calidad' && c.tipo !== 'contrato')
    ? nivelConfianza(c.id, v)
    : null

  let base
  if (!v) base = { etiqueta: 'sin medir', confianza: 0.4 }
  else if (v.revalidar) base = { etiqueta: 'reimplementada, pendiente de medir', confianza: 0.4 }
  else if (v.estado === 'no_medible') base = { etiqueta: 'no medible', confianza: 0.3 }
  else if (v.estado === 'premisas_falsada') {
    const tasa = v.tasa_humano != null ? Math.round(v.tasa_humano * 100) : '?'
    base = { etiqueta: `premisas falsada (${tasa}% en humanos ES)`, confianza: 0.3 }
  } else if (v.insample) {
    base = {
      etiqueta: `J ${String(v.J_banda).replace('.', ',')} en muestra, sin validar fuera`,
      confianza: 0.7,
    }
  } else if (v.separa) {
    base = { etiqueta: `validado J ${String(v.J_banda).replace('.', ',')}`, confianza: 1 }
  } else {
    base = {
      etiqueta: `medido J ${String(v.J_banda).replace('.', ',')}, no separa`,
      confianza: 0.6,
    }
  }

  if (tier) {
    // El holdout manda sobre el optimismo del sello in-sample.
    const confianza = tier.nivel === 'alta' ? Math.max(base.confianza, 0.95)
      : tier.nivel === 'dudosa' ? Math.min(base.confianza, 0.55)
      : tier.nivel === 'baja' ? Math.min(base.confianza, 0.4)
      : base.confianza
    return {
      etiqueta: `${tier.etiqueta} · ${base.etiqueta}`,
      confianza,
      nivel: tier.nivel,
      detalle_nivel: tier.detalle,
    }
  }
  return { ...base, nivel: null, detalle_nivel: null }
}

/** Prioridad de remediacion: peso × confianza ÷ esfuerzo (confianza ya refleja holdout). */
export function prioridad(r) {
  const s = sello(r)
  return (r.weight * s.confianza) / (ESFUERZO[r.cat] || 2)
}

/**
 * Ordena hallazgos en capas accionables. Incluye contrato al final si falla.
 * @returns {{ capas: { capa, peso, items }[], nameSwap, contrato }}
 */
function itemDe(r, extras = {}) {
  const s = sello(r)
  return {
    id: r.id,
    title: r.title,
    weight: r.weight,
    tipo: r.tipo || 'procedencia',
    cat: r.cat,
    why: r.why || null,
    fix: r.fix || null,
    // Puntero a doctrina: el `fix` de una regla es una linea, y hay arreglos
    // que no caben en una linea. Cuando existe, apunta al documento de
    // references/doctrina/ que desarrolla el criterio.
    doctrina: r.doctrina || null,
    detail: r.detail || null,
    sello: extras.sello || s.etiqueta,
    confianza: extras.confianza ?? s.confianza,
    nivel: extras.nivel ?? s.nivel,
    prioridad: extras.prioridad ?? Number(prioridad(r).toFixed(3)),
    samples: (r.samples || []).slice(0, 5),
  }
}

export function armarPlan({ results, nameSwap, contrato, calidad }) {
  // El plan se ordena por CONFIANZA primero (no solo por categoría visual):
  // 1) ALTA (holdout)  2) dudosa  3) baja/sin medir  4) contrato  5) calidad
  const fallan = (results || []).filter(r => r.failed)
  const items = fallan.map(r => itemDe(r)).sort((a, b) => b.prioridad - a.prioridad)

  const esAlta = i => i.nivel === 'alta'
  const esDudosa = i => i.nivel === 'dudosa'
  const esResto = i => !esAlta(i) && !esDudosa(i)

  const capas = []
  const pushGrupo = (capa, lista, nota) => {
    if (!lista.length) return
    capas.push({
      capa,
      nota: nota || null,
      peso: lista.reduce((s, r) => s + r.weight, 0),
      items: lista,
    })
  }

  pushGrupo(
    'Primero · confianza ALTA',
    items.filter(esAlta),
    'Estas aguantan fuera de muestra. Arréglalas primero; son las que sí sostienen «parece slop».',
  )
  pushGrupo(
    'Después · confianza dudosa',
    items.filter(esDudosa),
    'Se ven bien en muestra y se caen en holdout. Útiles como higiene, no como veredicto de IA.',
  )
  pushGrupo(
    'Opcional · poca o nula medición',
    items.filter(esResto),
    'Sin prueba fuerte de separación. No construyas el informe solo con estas.',
  )

  // Dentro de cada grupo de procedencia, sub-ordenar por capa de trabajo
  // (contenido antes que CSS) manteniendo el grupo de confianza.
  for (const capa of capas) {
    capa.items.sort((a, b) => {
      const ea = ESFUERZO[a.cat] || 2, eb = ESFUERZO[b.cat] || 2
      if (ea !== eb) return ea - eb
      return b.prioridad - a.prioridad
    })
  }

  const contratoFallos = (contrato?.checks || []).filter(c => c.failed).map(c => itemDe(
    { ...c, tipo: 'contrato' },
    { sello: 'contrato de diseño', confianza: 0.9, nivel: 'contrato', prioridad: c.weight },
  ))
  if (contratoFallos.length) {
    capas.push({
      capa: 'Contrato de diseño',
      nota: 'Fidelidad a DESIGN.md / tokens — no es prueba de autoría.',
      peso: contratoFallos.reduce((s, r) => s + r.weight, 0),
      items: contratoFallos,
    })
  }

  const calidadFallos = (calidad?.checks || []).filter(c => c.failed).map(c => itemDe(
    { ...c, tipo: 'calidad' },
    { sello: 'calidad / a11y', confianza: 0.85, nivel: 'calidad', prioridad: c.weight },
  ))
  if (calidadFallos.length) {
    capas.push({
      capa: 'Calidad y producto',
      nota: 'Higiene y a11y — arreglar sí; no confundir con «hecho por IA».',
      peso: calidadFallos.reduce((s, r) => s + r.weight, 0),
      items: calidadFallos,
    })
  }

  return {
    nameSwap: nameSwap?.failed
      ? { count: nameSwap.count, samples: (nameSwap.samples || []).slice(0, 8) }
      : null,
    capas,
    totalHallazgos: fallan.length + contratoFallos.length + calidadFallos.length,
    orden: 'confianza (ALTA → dudosa → resto) · luego esfuerzo de capa · luego peso',
  }
}
