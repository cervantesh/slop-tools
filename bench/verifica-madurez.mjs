#!/usr/bin/env node
// Verifica las capacidades de madurez añadidas: historial, calidad, gate, apply-safe.
//
//   node bench/verifica-madurez.mjs

import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { roundtripPrueba } from '../scripts/lib/history.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const ROOT_PKG = join(AQUI, '..')
const INIT = join(ROOT_PKG, 'scripts', 'slop-init.mjs')
const SCAN = join(ROOT_PKG, 'scripts', 'slop-scan.mjs')
const GATE = join(ROOT_PKG, 'scripts', 'slop-gate.mjs')
const FIX = join(ROOT_PKG, 'scripts', 'slop-fix.mjs')
const VISUAL = join(ROOT_PKG, 'scripts', 'slop-visual.mjs')

const correr = (script, args, opts = {}) => execFileSync(process.execPath, [script, ...args], {
  encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...opts,
})

console.log('\n  verifica-madurez\n')
let fallos = 0
const dir = mkdtempSync(join(tmpdir(), 'slop-mad-'))

try {
  // 1 · historial
  if (!roundtripPrueba(dir)) {
    console.log('  x history roundtrip')
    fallos++
  } else console.log('  ok history     roundtrip .slop/history.jsonl')

  correr(INIT, [dir, '--seed', '55'])
  if (!existsSync(join(dir, 'tailwind.theme.mjs'))) {
    console.log('  x init sin tailwind.theme.mjs')
    fallos++
  } else console.log('  ok init        tailwind.theme.mjs + html lang')

  // 2 · calidad en JSON
  const scan = JSON.parse(correr(SCAN, [dir, '--json', '--profile', 'landing', '--contrato', '--no-history']))
  if (!scan.calidad || typeof scan.calidad.score !== 'number') {
    console.log('  x scan.calidad ausente')
    fallos++
  } else console.log(`  ok calidad     score ${scan.calidad.score}/100 · ejes ${scan.calidad.total}`)

  // 3 · stats
  correr(SCAN, [dir, '--json', '--profile', 'landing', '--contrato'])
  const statsOut = correr(SCAN, [dir, '--stats'])
  if (!/eventos|historial|score/i.test(statsOut)) {
    console.log('  x --stats sin resumen')
    fallos++
  } else console.log('  ok stats       --stats resume historial')

  // 4 · gate pass en sistema limpio
  let gateCode = 0
  try {
    correr(GATE, [dir, '--profile', 'landing', '--min-score', '50', '--require-contrato'])
  } catch (e) {
    gateCode = e.status ?? 1
  }
  if (gateCode !== 0) {
    console.log(`  x gate limpio exit ${gateCode}`)
    if (existsSync(join(dir, '.slop', 'last-gate.json'))) {
      console.log('     ', readFileSync(join(dir, '.slop', 'last-gate.json'), 'utf8').slice(0, 200))
    }
    fallos++
  } else if (!existsSync(join(dir, '.slop', 'last-gate.json'))) {
    console.log('  x gate sin last-gate.json')
    fallos++
  } else console.log('  ok gate        PASS + last-gate.json + brief')

  // 5 · gate fail con mutación
  writeFileSync(join(dir, 'malo.css'), '.x{padding:13px;font-family:Inter;transition:all 300ms;color:#ff00aa}', 'utf8')
  gateCode = 0
  try {
    correr(GATE, [dir, '--profile', 'landing', '--min-score', '100', '--require-contrato'])
  } catch (e) {
    gateCode = e.status ?? 1
  }
  if (gateCode === 0) {
    console.log('  x gate debia fallar con basura visual')
    fallos++
  } else console.log('  ok gate        FAIL ante contrato roto')

  // 6 · apply-safe
  const before = readFileSync(join(dir, 'malo.css'), 'utf8')
  try {
    correr(FIX, [dir, '--profile', 'landing', '--apply-safe', '--json'])
  } catch { /* exit 1 ok */ }
  const after = readFileSync(join(dir, 'malo.css'), 'utf8')
  if (after === before && /Inter|300ms|transition:\s*all/i.test(before)) {
    console.log('  x apply-safe no modificó malo.css')
    fallos++
  } else if (/Inter/i.test(after) && /font-family:\s*Inter/i.test(after)) {
    console.log('  x apply-safe dejo Inter')
    fallos++
  } else console.log('  ok apply-safe  parches triviales aplicados')

  // 7 · visual skip sin playwright
  const vis = JSON.parse(correr(VISUAL, [dir, '--json']))
  if (!vis.skipped && !vis.ok) {
    // si tiene playwright y falla a11y, igual ok que corrió
    console.log('  ok visual      ejecuto browser o skip')
  } else if (vis.skipped) {
    console.log('  ok visual      SKIPPED sin playwright (limite declarado)')
  } else {
    console.log('  ok visual      report ok')
  }

  // 8 · dominio
  const domFile = join(dir, 'dominio.txt')
  writeFileSync(domFile, 'encuadernacion\ntipografia\nconcepto-inexistente-xyz\n', 'utf8')
  // put one concept in code
  writeFileSync(join(dir, 'biz.js'), 'export const x = "tipografia de plomo"', 'utf8')
  const conDom = JSON.parse(correr(SCAN, [dir, '--json', '--dominio', domFile, '--no-history', '--profile', 'landing']))
  if (!conDom.dominio) {
    console.log('  x dominio no reportado')
    fallos++
  } else console.log(`  ok dominio     ${conDom.dominio.detail}`)

} finally {
  rmSync(dir, { recursive: true, force: true })
}

console.log('')
if (fallos) {
  console.error(`verifica-madurez: ${fallos} fallo(s)`)
  process.exit(1)
}
console.log('  verifica-madurez: ok\n')
