// Trinquete de baseline y registro entre ejecuciones.
//
// Patron tomado de stylelint-plugin-rhythmguard: una auditoria que solo FALLA
// ante hallazgos NUEVOS y tolera la deriva preexistente. Es el unico mecanismo
// verificado que hace adoptable un gate sobre codigo legado — un control que
// falla desde el primer dia se desactiva el segundo.
//
// Y de hallmark: .hallmark/log.json guarda la macroestructura de cada build
// para exigir que el siguiente diverja.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DIR = '.slop'
const BASELINE = 'baseline.json'
const LOG = 'log.json'

const rutaDe = (root, archivo) => join(root, DIR, archivo)

// Identidad estable de un hallazgo: no incluye el numero de linea, para que
// mover codigo no lo convierta en "nuevo".
export const claveHallazgo = (id, m) => `${id}::${m.file}::${(m.text || '').replace(/\s+/g, ' ').trim().slice(0, 60)}`

export function leerBaseline(root) {
  const p = rutaDe(root, BASELINE)
  if (!existsSync(p)) return null
  try { return JSON.parse(readFileSync(p, 'utf8')) } catch { return null }
}

export function escribirBaseline(root, resultados) {
  const claves = []
  for (const r of resultados) {
    if (!r.failed) continue
    for (const m of r.samples || []) claves.push(claveHallazgo(r.id, m))
  }
  const datos = { _v: 1, claves: [...new Set(claves)].sort() }
  mkdirSync(join(root, DIR), { recursive: true })
  writeFileSync(rutaDe(root, BASELINE), JSON.stringify(datos, null, 2), 'utf8')
  return datos.claves.length
}

// Hallazgos que no estaban en el baseline.
export function nuevosHallazgos(resultados, baseline) {
  if (!baseline) return null
  const previas = new Set(baseline.claves || [])
  const nuevos = []
  for (const r of resultados) {
    if (!r.failed) continue
    for (const m of r.samples || []) {
      const k = claveHallazgo(r.id, m)
      if (!previas.has(k)) nuevos.push({ id: r.id, title: r.title, ...m })
    }
  }
  return nuevos
}

/* ── registro entre ejecuciones ── */

export function leerLog(root) {
  const p = rutaDe(root, LOG)
  if (!existsSync(p)) return null
  try { return JSON.parse(readFileSync(p, 'utf8')) } catch { return null }
}

export function escribirLog(root, firma, score, sello) {
  const previo = leerLog(root)
  const entradas = (previo?.entradas || []).slice(-9)
  entradas.push({ firma, score, sello })
  mkdirSync(join(root, DIR), { recursive: true })
  writeFileSync(rutaDe(root, LOG), JSON.stringify({ _v: 1, entradas }, null, 2), 'utf8')
}

// ¿Este build es indistinguible del anterior?
export function repiteMacroestructura(root, firma) {
  const log = leerLog(root)
  const ultima = log?.entradas?.[log.entradas.length - 1]
  if (!ultima?.firma) return null
  const igual = ultima.firma.secuencia === firma.secuencia && ultima.firma.conteo === firma.conteo
  return { igual, anterior: ultima.firma }
}
