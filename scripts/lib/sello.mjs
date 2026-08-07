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
    detail: r.detail || null,
    sello: extras.sello || s.etiqueta,
    confianza: extras.confianza ?? s.confianza,
    nivel: extras.nivel ?? s.nivel,
    prioridad: extras.prioridad ?? Number(prioridad(r).toFixed(3)),
    samples: (r.samples || []).slice(0, 5),
  }
}

export function armarPlan({ results, nameSwap, contrato, calidad }) {
  const fallan = (results || []).filter(r => r.failed).sort((a, b) => prioridad(b) - prioridad(a))
  const porCapa = new Map()
  for (const r of fallan) {
    const capa = CAPA[r.cat] || 'Otros'
    if (!porCapa.has(capa)) porCapa.set(capa, [])
    porCapa.get(capa).push(r)
  }
  const capas = [...porCapa.entries()]
    .sort((a, b) => b[1].reduce((s, r) => s + prioridad(r), 0) - a[1].reduce((s, r) => s + prioridad(r), 0))
    .map(([capa, items]) => ({
      capa,
      peso: items.reduce((s, r) => s + r.weight, 0),
      items: items.map(r => itemDe(r)),
    }))

  const contratoFallos = (contrato?.checks || []).filter(c => c.failed).map(c => itemDe(
    { ...c, tipo: 'contrato' },
    { sello: 'contrato de diseño', confianza: 0.9, prioridad: c.weight },
  ))
  if (contratoFallos.length) {
    capas.push({
      capa: 'Contrato de diseño',
      peso: contratoFallos.reduce((s, r) => s + r.weight, 0),
      items: contratoFallos,
    })
  }

  const calidadFallos = (calidad?.checks || []).filter(c => c.failed).map(c => itemDe(
    { ...c, tipo: 'calidad' },
    { sello: 'calidad / a11y', confianza: 0.85, prioridad: c.weight },
  ))
  if (calidadFallos.length) {
    capas.push({
      capa: 'Calidad y producto',
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
  }
}
