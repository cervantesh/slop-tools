// Núcleo de confianza: no todas las reglas pesan igual.
//
// Del holdout (research/holdout.json): de las reglas con J>0,15 en ajuste,
// "alta" = conserva al menos la mitad de J en reserva y J_reserva > 0.
// Eso es lo único que este repositorio defiende dentro y fuera de muestra.
//
// data/nucleo-validado.json es la copia empaquetada (para npm sin research/).

import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = join(AQUI, '..', '..')

let CACHE = null

function cargar() {
  if (CACHE) return CACHE

  // Preferir holdout fresco; si no, el JSON empaquetado.
  const holdoutPath = join(RAIZ, 'research', 'holdout.json')
  const empaquetado = join(RAIZ, 'data', 'nucleo-validado.json')

  let filas = []
  let origen = null
  let n = null

  if (existsSync(holdoutPath)) {
    try {
      const h = JSON.parse(readFileSync(holdoutPath, 'utf8'))
      filas = h.filas || []
      n = h.n
      origen = 'research/holdout.json'
    } catch { /* cae a empaquetado */ }
  }
  if (!filas.length && existsSync(empaquetado)) {
    try {
      const p = JSON.parse(readFileSync(empaquetado, 'utf8'))
      filas = (p.alta || []).map(id => ({ id, _soloLista: true }))
      // reconstruir mapa desde lista si no hay J
      origen = 'data/nucleo-validado.json'
      n = p.n || null
      CACHE = {
        origen,
        n,
        porId: Object.fromEntries((p.filas || []).map(f => [f.id, f])),
        alta: new Set(p.alta || []),
        dudosa: new Set(p.dudosa || []),
        criterio: p.criterio || 'holdout: J_ajuste>0.15 y J_reserva >= mitad y >0',
      }
      return CACHE
    } catch { /* vacio */ }
  }

  const porId = {}
  const alta = new Set()
  const dudosa = new Set()
  for (const f of filas) {
    porId[f.id] = f
    if (f._soloLista) continue
    if (f.J_ajuste > 0.15 && f.J_reserva > 0 && f.J_reserva >= f.J_ajuste * 0.5) {
      alta.add(f.id)
    } else if (f.J_ajuste > 0.15) {
      dudosa.add(f.id)
    }
  }

  CACHE = {
    origen: origen || 'ninguno',
    n,
    porId,
    alta,
    dudosa,
    criterio: 'J_ajuste > 0,15 y J_reserva ≥ 50% de J_ajuste y J_reserva > 0',
  }
  return CACHE
}

/**
 * Nivel de confianza empírica de una regla de procedencia.
 * @returns {{ nivel: 'alta'|'dudosa'|'baja'|'sin_medir'|'otro', etiqueta: string, detalle: string, factor: number }}
 */
export function nivelConfianza(id, validado) {
  const { alta, dudosa, porId } = cargar()
  const h = porId[id]

  if (alta.has(id)) {
    const jr = h?.J_reserva != null ? Number(h.J_reserva).toFixed(2) : '?'
    return {
      nivel: 'alta',
      etiqueta: 'confianza alta',
      detalle: `aguanta fuera de muestra (J reserva ${jr})`,
      factor: 1.15,
    }
  }
  if (dudosa.has(id)) {
    const ja = h?.J_ajuste != null ? Number(h.J_ajuste).toFixed(2) : '?'
    const jr = h?.J_reserva != null ? Number(h.J_reserva).toFixed(2) : '?'
    return {
      nivel: 'dudosa',
      etiqueta: 'confianza dudosa',
      detalle: `en muestra J ${ja}, en reserva J ${jr} — no te fíes solo de esta`,
      factor: 0.55,
    }
  }

  const v = validado
  if (!v) {
    return { nivel: 'sin_medir', etiqueta: 'sin medir', detalle: 'no hay medición de separación', factor: 0.4 }
  }
  if (v.estado === 'no_medible') {
    return { nivel: 'sin_medir', etiqueta: 'no medible', detalle: v.nota || 'sin oportunidad de disparo', factor: 0.3 }
  }
  if (v.estado === 'premisas_falsada') {
    return { nivel: 'baja', etiqueta: 'premisa falsada', detalle: 'no usar como prueba de autoría', factor: 0.25 }
  }
  if (v.separa) {
    return {
      nivel: 'dudosa',
      etiqueta: 'confianza media',
      detalle: 'separa en muestra, sin prueba de holdout o no listada en el núcleo',
      factor: 0.75,
    }
  }
  if (v.J_banda != null && v.J_banda < 0) {
    return { nivel: 'baja', etiqueta: 'apunta al revés', detalle: 'dispara más en humano', factor: 0.2 }
  }
  return {
    nivel: 'baja',
    etiqueta: 'poca separación',
    detalle: 'medida, no separa clases con claridad',
    factor: 0.45,
  }
}

export function nucleoInfo() {
  const c = cargar()
  return {
    origen: c.origen,
    criterio: c.criterio,
    n_holdout: c.n,
    alta: [...c.alta].sort(),
    dudosa: [...c.dudosa].sort(),
  }
}

/**
 * Resume hallazgos de procedencia por nivel de confianza.
 */
export function resumenConfianza(results) {
  const info = nucleoInfo()
  const buckets = { alta: [], dudosa: [], baja: [], sin_medir: [], otro: [] }
  for (const r of results || []) {
    if (r.tipo === 'defecto' || r.tipo === 'calidad' || r.tipo === 'contrato') continue
    if (!r.failed) continue
    const t = nivelConfianza(r.id, r.validado)
    const bucket = buckets[t.nivel] ? t.nivel : 'otro'
    buckets[bucket].push({ id: r.id, title: r.title, ...t })
  }
  return {
    nucleo: info,
    fallan: {
      alta: buckets.alta,
      dudosa: buckets.dudosa,
      baja: buckets.baja,
      sin_medir: buckets.sin_medir,
      otro: buckets.otro,
    },
    veredicto_seguro: buckets.alta.length > 0,
    aviso: buckets.alta.length === 0 && (buckets.dudosa.length + buckets.baja.length + buckets.sin_medir.length) > 0
      ? 'Solo fallan reglas de confianza baja o dudosa: no digas «es IA» solo con eso.'
      : null,
  }
}

/** Factor para el plan: multiplica la confianza del sello. */
export function factorPlan(id, validado) {
  return nivelConfianza(id, validado).factor
}
