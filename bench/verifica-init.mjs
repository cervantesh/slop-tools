#!/usr/bin/env node
// Comprueba las dos propiedades que slop-init promete, en vez de creerselas.
//
//   1. AUTOAPROBACION — lo que genera pasa el propio escaner con 100/100 de
//      procedencia. Una herramienta que genera lo que ella misma marcaria no
//      vale nada.
//   2. DIVERGENCIA — invocaciones distintas producen sistemas distintos. Si
//      generase siempre lo mismo habriamos creado la monocultura de tercer
//      orden, que es exactamente lo que avisa la regla AS9.
//
//   node bench/verifica-init.mjs [n]

import { mkdtempSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const AQUI = dirname(fileURLToPath(import.meta.url))
const INIT = join(AQUI, '..', 'scripts', 'slop-init.mjs')
const SCAN = join(AQUI, '..', 'scripts', 'slop-scan.mjs')
const N = Number(process.argv[2] || 8)

const correr = (script, args) => execFileSync(process.execPath, [script, ...args],
  { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })

console.log('\n  verifica-init\n')

const sistemas = []
let fallos = 0

for (let i = 0; i < N; i++) {
  const dir = mkdtempSync(join(tmpdir(), 'slop-init-'))
  const s = JSON.parse(correr(INIT, [dir, '--seed', String(1000 + i * 37), '--json']))
  const scan = JSON.parse(correr(SCAN, [dir, '--json', '--profile', 'landing']))
  rmSync(dir, { recursive: true, force: true })

  const proc = scan.checks.filter(c => c.tipo !== 'defecto' && c.failed)
  sistemas.push(s)
  if (scan.score < 100 || proc.length) {
    fallos++
    console.log(`  x semilla ${s.semilla}: ${scan.score}/100 · fallan ${proc.map(c => c.id).join(', ') || '(ninguna de procedencia)'}`)
  }
}

console.log(`  AUTOAPROBACION  ${N - fallos}/${N} sistemas pasan su propio escaner con 100/100\n`)

/* ── divergencia ── */

// Un eje binario no puede dar mas de dos valores: exigirle el 40% de N seria
// declararlo roto por definicion. El minimo esperado se acota al tamano real
// del repertorio.
const CARDINALIDAD = { esquema: 2, postura: 4, duracion: 5 }
const ejes = ['tono', 'display', 'texto', 'esquema', 'duracion', 'postura']
console.log('  DIVERGENCIA por eje')
let ejesPobres = 0
for (const eje of ejes) {
  const vistos = new Set(sistemas.map(s => String(s[eje])))
  const tope = Math.min(N, CARDINALIDAD[eje] ?? N)
  const minimo = Math.max(2, Math.ceil(tope * 0.4))
  const ok = vistos.size >= minimo
  if (!ok) ejesPobres++
  console.log(`  ${ok ? 'ok' : ' x'} ${eje.padEnd(10)} ${vistos.size} valor(es) distintos en ${N} invocaciones (minimo ${minimo})`)
}

// Dos sistemas identicos en los cuatro ejes visibles serian el fallo real.
const huellas = sistemas.map(s => `${s.tono}|${s.display}|${s.texto}|${s.esquema}`)
const repetidos = huellas.length - new Set(huellas).size
console.log(`\n  ${repetidos === 0 ? 'ok' : ' x'} ${repetidos} par(es) de sistemas identicos en tono, tipografia y esquema\n`)

if (fallos) {
  console.error('verifica-init: slop-init genera algo que su propio escaner marcaria')
  process.exit(1)
}
if (ejesPobres > 1) {
  console.error(`verifica-init: ${ejesPobres} ejes con divergencia pobre — el generador tiende a un unico sistema`)
  process.exit(1)
}
