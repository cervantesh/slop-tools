// Historial local de ejecuciones. Observabilidad sin telemetría remota:
// cada scan puede dejar un evento en <raiz>/.slop/history.jsonl.
// Nunca sale de la máquina. --stats lo resume.

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = root => join(root, '.slop')
const FILE = root => join(DIR(root), 'history.jsonl')

export function registrar(root, evento) {
  try {
    mkdirSync(DIR(root), { recursive: true })
    const fila = {
      ts: new Date().toISOString(),
      ...evento,
    }
    appendFileSync(FILE(root), JSON.stringify(fila) + '\n', 'utf8')
    return true
  } catch {
    return false
  }
}

export function leerHistorial(root, { max = 500 } = {}) {
  const ruta = FILE(root)
  if (!existsSync(ruta)) return []
  const lineas = readFileSync(ruta, 'utf8').split('\n').filter(Boolean)
  const slice = lineas.slice(-max)
  const out = []
  for (const l of slice) {
    try { out.push(JSON.parse(l)) } catch { /* línea corrupta */ }
  }
  return out
}

export function resumenHistorial(root) {
  const ev = leerHistorial(root)
  if (!ev.length) {
    return { n: 0, mensaje: 'sin historial en .slop/history.jsonl — corre un scan (por defecto se registra)' }
  }
  const scores = ev.map(e => e.score).filter(n => typeof n === 'number')
  const contratos = ev.map(e => e.contratoScore).filter(n => typeof n === 'number')
  const ultimo = ev[ev.length - 1]
  const primero = ev[0]
  const media = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null
  const tendencia = scores.length >= 2 ? scores[scores.length - 1] - scores[0] : 0
  return {
    n: ev.length,
    desde: primero.ts,
    hasta: ultimo.ts,
    score: {
      ultimo: ultimo.score ?? null,
      media: media(scores) != null ? Math.round(media(scores) * 10) / 10 : null,
      min: scores.length ? Math.min(...scores) : null,
      max: scores.length ? Math.max(...scores) : null,
      deltaPrimeroUltimo: tendencia,
    },
    contrato: {
      ultimo: ultimo.contratoScore ?? null,
      media: media(contratos) != null ? Math.round(media(contratos) * 10) / 10 : null,
    },
    ultimo,
    recientes: ev.slice(-8),
  }
}

export function imprimirStats(root) {
  const r = resumenHistorial(root)
  console.log(`\n  slop-stats · ${root}\n`)
  if (!r.n) {
    console.log(`  ${r.mensaje}\n`)
    return r
  }
  console.log(`  eventos   ${r.n}  (${r.desde?.slice(0, 10)} → ${r.hasta?.slice(0, 10)})`)
  console.log(`  score     último ${r.score.ultimo} · media ${r.score.media} · min ${r.score.min} · max ${r.score.max} · Δ ${r.score.deltaPrimeroUltimo >= 0 ? '+' : ''}${r.score.deltaPrimeroUltimo}`)
  if (r.contrato.media != null || r.contrato.ultimo != null) {
    console.log(`  contrato  último ${r.contrato.ultimo ?? '—'} · media ${r.contrato.media ?? '—'}`)
  }
  console.log('\n  recientes')
  for (const e of r.recientes) {
    const c = e.contratoScore != null ? ` · contrato ${e.contratoScore}` : ''
    const q = e.calidadScore != null ? ` · calidad ${e.calidadScore}` : ''
    console.log(`    ${e.ts?.slice(0, 19) || '?'}  ${e.score}/100${c}${q}  ${e.profile || ''}  ${e.ms != null ? e.ms + 'ms' : ''}`)
  }
  console.log('')
  return r
}

/** Prueba: escribe y lee un evento (para bench). */
export function roundtripPrueba(root) {
  const marca = `test-${Date.now()}`
  registrar(root, { score: 99, band: 'test', marca, tool: 'verifica-history' })
  const hit = leerHistorial(root).some(e => e.marca === marca)
  return hit
}
