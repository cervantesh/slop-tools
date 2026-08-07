#!/usr/bin/env node
// slop-bench — mide si las reglas del escaner DETECTAN de verdad lo que dicen detectar.
//
// El problema que resuelve: todo el corpus del que salen nuestras reglas es
// autodescriptivo. Cada herramienta publica su lista y ninguna publica una tasa
// de acierto. Sin esto, una regla esta demostrada como EXISTENTE, no como
// DISCRIMINATIVA.
//
// Metodo (mutacion): se parte de un proyecto limpio de referencia, se le inyecta
// un patron de slop conocido, y se comprueba que la regla objetivo dispara.
//   - recall     : la regla objetivo dispara cuando el patron esta presente
//   - base       : que dispara sobre el proyecto limpio (falsos positivos)
//   - diafonia   : cuantas OTRAS reglas se activan por la misma mutacion
//
// Uso:  node bench/slop-bench.mjs [--json] [--keep]

import { cpSync, mkdtempSync, readFileSync, writeFileSync, appendFileSync, rmSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const AQUI = dirname(fileURLToPath(import.meta.url))
const ESCANER = join(AQUI, '..', 'scripts', 'slop-scan.mjs')
const FIXTURE = join(AQUI, 'fixtures', 'limpio')
const MUTACIONES = JSON.parse(readFileSync(join(AQUI, 'mutations.json'), 'utf8')).mutations

const AS_JSON = process.argv.includes('--json')
const KEEP = process.argv.includes('--keep')

function escanear(dir) {
  const salida = execFileSync(process.execPath, [ESCANER, dir, '--json', '--profile', 'ambos'],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  const j = JSON.parse(salida)
  return { score: j.score, fallan: new Set(j.checks.filter(c => c.failed).map(c => c.id)) }
}

function preparar() {
  const dir = mkdtempSync(join(tmpdir(), 'slop-bench-'))
  cpSync(FIXTURE, dir, { recursive: true })
  return dir
}

function aplicar(dir, mut) {
  const destino = join(dir, mut.file)
  if (mut.mode === 'create' || (mut.mode === 'overwrite')) writeFileSync(destino, mut.content, 'utf8')
  else appendFileSync(destino, '\n' + mut.content + '\n', 'utf8')
}

/* ── linea base ── */

const dirBase = preparar()
const base = escanear(dirBase)
if (!KEEP) rmSync(dirBase, { recursive: true, force: true })

/* ── una pasada por mutacion ── */

const filas = []
for (const mut of MUTACIONES) {
  // Algunas entradas existen solo para servir de companera de otra.
  if (mut.soloCompanera) continue
  const dir = preparar()
  // Algunas mutaciones necesitan una companera (p. ej. el nav y su hairline).
  if (mut.conMutacion) {
    const compa = MUTACIONES.find(m => m.id === mut.conMutacion)
    if (compa) aplicar(dir, compa)
  }
  aplicar(dir, mut)
  let r
  try { r = escanear(dir) } catch (e) { r = { score: null, fallan: new Set(), error: e.message.slice(0, 120) } }
  if (!KEEP) rmSync(dir, { recursive: true, force: true })

  const detectada = r.fallan.has(mut.rule)
  const nuevas = [...r.fallan].filter(id => !base.fallan.has(id) && id !== mut.rule)
  filas.push({
    id: mut.id, regla: mut.rule, desc: mut.desc,
    detectada, diafonia: nuevas, score: r.score, error: r.error || null,
  })
}

/* ── agregados ── */

// Una regla se considera cubierta si CUALQUIERA de sus mutaciones la dispara,
// pero se reporta cada mutacion por separado: una regla que solo caza una de
// sus dos formas (shorthand si, longhand no) es exactamente la fuga que
// buscamos.
const total = filas.length
const aciertos = filas.filter(f => f.detectada).length
const recall = total ? aciertos / total : 0
const reglasCubiertas = new Set(filas.filter(f => f.detectada).map(f => f.regla))
const reglasProbadas = new Set(filas.map(f => f.regla))
const diafoniaMedia = total ? filas.reduce((a, f) => a + f.diafonia.length, 0) / total : 0

if (AS_JSON) {
  console.log(JSON.stringify({
    base: { score: base.score, disparan: [...base.fallan] },
    recall, aciertos, total,
    reglasProbadas: [...reglasProbadas].sort(),
    reglasSinCubrir: [...reglasProbadas].filter(r => !reglasCubiertas.has(r)).sort(),
    diafoniaMedia, filas,
  }, null, 2))
} else {
  console.log('\n  slop-bench · suite de mutacion\n')
  console.log(`  LINEA BASE (proyecto limpio)   puntuacion ${base.score}/100`)
  console.log(`  Reglas que disparan sin slop:  ${base.fallan.size ? [...base.fallan].join(', ') : 'ninguna'}`)
  if (base.fallan.size) console.log('  ^ son falsos positivos de base: o se corrige la regla, o se corrige la referencia')
  console.log('')
  console.log(`  RECALL  ${aciertos}/${total} mutaciones detectadas (${(recall * 100).toFixed(0)}%)`)
  console.log(`  Diafonia media: ${diafoniaMedia.toFixed(1)} reglas colaterales por mutacion\n`)

  const fallos = filas.filter(f => !f.detectada)
  if (fallos.length) {
    console.log('  ── NO detectadas ──')
    for (const f of fallos) {
      console.log(`  x ${f.id}  esperaba ${f.regla}  —  ${f.desc}`)
      if (f.error) console.log(`      error: ${f.error}`)
    }
    console.log('')
  }

  console.log('  ── Detectadas ──')
  for (const f of filas.filter(x => x.detectada)) {
    const d = f.diafonia.length ? `  · colateral: ${f.diafonia.join(',')}` : ''
    console.log(`  ok ${f.id.padEnd(12)} ${f.regla.padEnd(6)} ${f.score}/100${d}`)
  }
  console.log('')
}

if (base.fallan.size > 0 || aciertos < total) process.exit(1)
