// Estado epistemico de cada comprobacion: lo medido frente a lo opinado.
// Usado por slop-scan (salida humana) y slop-fix (orden del plan).

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
  if (!v) return { etiqueta: 'sin medir', confianza: 0.4 }
  if (v.revalidar) return { etiqueta: 'reimplementada, pendiente de medir', confianza: 0.4 }
  if (v.estado === 'no_medible') return { etiqueta: 'no medible', confianza: 0.3 }
  if (v.estado === 'premisas_falsada') {
    const tasa = v.tasa_humano != null ? Math.round(v.tasa_humano * 100) : '?'
    return { etiqueta: `premisas falsada (${tasa}% en humanos ES)`, confianza: 0.3 }
  }
  if (v.insample) {
    return {
      etiqueta: `J ${String(v.J_banda).replace('.', ',')} en muestra, sin validar fuera`,
      confianza: 0.7,
    }
  }
  if (v.separa) {
    return { etiqueta: `validado J ${String(v.J_banda).replace('.', ',')}`, confianza: 1 }
  }
  return {
    etiqueta: `medido J ${String(v.J_banda).replace('.', ',')}, no separa`,
    confianza: 0.6,
  }
}

/** Prioridad de remediacion: peso × confianza ÷ esfuerzo. */
export function prioridad(r) {
  return (r.weight * sello(r).confianza) / (ESFUERZO[r.cat] || 2)
}

/**
 * Ordena hallazgos en capas accionables. Incluye contrato al final si falla.
 * @returns {{ capas: { capa, peso, items }[], nameSwap, contrato }}
 */
export function armarPlan({ results, nameSwap, contrato }) {
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
      items: items.map(r => ({
        id: r.id,
        title: r.title,
        weight: r.weight,
        tipo: r.tipo || 'procedencia',
        cat: r.cat,
        why: r.why || null,
        fix: r.fix || null,
        detail: r.detail || null,
        sello: sello(r).etiqueta,
        confianza: sello(r).confianza,
        prioridad: Number(prioridad(r).toFixed(3)),
        samples: (r.samples || []).slice(0, 5),
      })),
    }))

  const contratoFallos = (contrato?.checks || []).filter(c => c.failed).map(c => ({
    id: c.id,
    title: c.title,
    weight: c.weight,
    tipo: 'contrato',
    cat: c.cat,
    why: null,
    fix: c.fix || null,
    detail: c.detail || null,
    sello: 'contrato de diseño',
    confianza: 0.9,
    prioridad: c.weight,
    samples: (c.samples || []).slice(0, 5),
  }))

  if (contratoFallos.length) {
    capas.push({
      capa: 'Contrato de diseño',
      peso: contratoFallos.reduce((s, r) => s + r.weight, 0),
      items: contratoFallos,
    })
  }

  return {
    nameSwap: nameSwap?.failed
      ? { count: nameSwap.count, samples: (nameSwap.samples || []).slice(0, 8) }
      : null,
    capas,
    totalHallazgos: fallan.length + contratoFallos.length,
  }
}
