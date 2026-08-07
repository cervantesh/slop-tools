#!/usr/bin/env node
// Comprueba que el lint del contrato (scan --contrato) hace lo que promete:
//
//   1. Un sistema recien generado por slop-init respeta su propio contrato
//      (score 100, cero fallos).
//   2. Si alguien mete espaciado, radio, color, tipo o ms fuera del contrato,
//      el lint falla y --fail-on-contrato sale con codigo 1.
//
//   node bench/verifica-contrato.mjs

import { mkdtempSync, rmSync, writeFileSync, readFileSync, appendFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const AQUI = dirname(fileURLToPath(import.meta.url))
const INIT = join(AQUI, '..', 'scripts', 'slop-init.mjs')
const SCAN = join(AQUI, '..', 'scripts', 'slop-scan.mjs')

const correr = (script, args, opts = {}) => execFileSync(process.execPath, [script, ...args], {
  encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...opts,
})

console.log('\n  verifica-contrato\n')

const dir = mkdtempSync(join(tmpdir(), 'slop-contrato-'))
let fallos = 0

try {
  correr(INIT, [dir, '--seed', '4242'])

  // 1 · Autoaprobacion del contrato
  const limpio = JSON.parse(correr(SCAN, [dir, '--json', '--contrato', '--profile', 'landing']))
  const c = limpio.contrato
  if (!c) {
    console.log('  x no se genero informe de contrato')
    fallos++
  } else if (c.fallan !== 0 || c.score !== 100) {
    console.log(`  x sistema limpio: score ${c.score}, fallan ${c.fallan}`)
    for (const h of c.checks.filter(x => x.failed)) console.log(`      ${h.id}: ${h.detail}`)
    fallos++
  } else {
    console.log(`  ok autoaprobacion  score ${c.score}/100 · 0 fallos · origen ${c.origen}`)
  }

  // 2 · Mutacion: romper cada eje del contrato
  const mut = join(dir, 'roto.css')
  writeFileSync(mut, `
/* violaciones deliberadas del contrato */
.extra {
  padding: 13px;
  margin: 7px;
  border-radius: 11px;
  font-family: Inter, sans-serif;
  color: #ff00aa;
  transition: all 300ms ease;
}
`, 'utf8')

  const roto = JSON.parse(correr(SCAN, [dir, '--json', '--contrato', '--profile', 'landing']))
  const ids = new Set(roto.contrato.checks.filter(x => x.failed).map(x => x.id))
  const esperados = ['DS1', 'DS2', 'DS3', 'DS4', 'DS5']
  const faltan = esperados.filter(id => !ids.has(id))
  if (faltan.length) {
    console.log(`  x mutacion: no dispararon ${faltan.join(', ')} (dispararon: ${[...ids].join(', ') || 'ninguno'})`)
    fallos++
  } else {
    console.log(`  ok mutacion      disparan ${esperados.join(', ')}`)
  }

  // 3 · --fail-on-contrato sale 1
  let codigo = 0
  try {
    correr(SCAN, [dir, '--contrato', '--fail-on-contrato', '--profile', 'landing'], { stdio: 'pipe' })
  } catch (e) {
    codigo = e.status ?? e.code ?? 1
  }
  if (codigo !== 1) {
    console.log(`  x --fail-on-contrato debia salir 1, salio ${codigo}`)
    fallos++
  } else {
    console.log('  ok --fail-on-contrato  exit 1 con hallazgos')
  }

  // 4 · Parser DESIGN.md si no hay .slop-init.json (borrar json, seguir con md+css)
  const jsonPath = join(dir, '.slop-init.json')
  const backup = readFileSync(jsonPath, 'utf8')
  rmSync(jsonPath)
  // Quitar mutacion para no fallar por ella
  rmSync(mut)
  const viaMd = JSON.parse(correr(SCAN, [dir, '--json', '--contrato', '--profile', 'landing']))
  if (!viaMd.contrato || viaMd.contrato.origen === '.slop-init.json') {
    console.log(`  x fallback sin json: origen=${viaMd.contrato?.origen}`)
    fallos++
  } else if (viaMd.contrato.fallan !== 0) {
    console.log(`  x fallback ${viaMd.contrato.origen}: fallan ${viaMd.contrato.fallan}`)
    for (const h of viaMd.contrato.checks.filter(x => x.failed)) console.log(`      ${h.id}: ${h.detail}`)
    fallos++
  } else {
    console.log(`  ok fallback        origen ${viaMd.contrato.origen} · score ${viaMd.contrato.score}/100`)
  }
  writeFileSync(jsonPath, backup, 'utf8')
} finally {
  rmSync(dir, { recursive: true, force: true })
}

console.log('')
if (fallos) {
  console.error(`verifica-contrato: ${fallos} fallo(s)`)
  process.exit(1)
}
console.log('  verifica-contrato: ok\n')
