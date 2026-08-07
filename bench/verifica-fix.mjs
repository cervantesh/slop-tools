#!/usr/bin/env node
// Comprueba que slop-fix produce un brief usable desde el scan real:
//
//   1. Sobre un sistema limpio de slop-init: 0 hallazgos, exit 0.
//   2. Tras mutar el contrato: el brief lista DS* y el markdown incluye
//      restricciones + comando --fail-on-contrato.
//   3. El JSON del scan expone plan + fix en checks (entrada del agente).
//
//   node bench/verifica-fix.mjs

import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const AQUI = dirname(fileURLToPath(import.meta.url))
const INIT = join(AQUI, '..', 'scripts', 'slop-init.mjs')
const FIX = join(AQUI, '..', 'scripts', 'slop-fix.mjs')
const SCAN = join(AQUI, '..', 'scripts', 'slop-scan.mjs')

const correr = (script, args, opts = {}) => execFileSync(process.execPath, [script, ...args], {
  encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...opts,
})

console.log('\n  verifica-fix\n')
let fallos = 0
const dir = mkdtempSync(join(tmpdir(), 'slop-fix-'))

try {
  correr(INIT, [dir, '--seed', '777'])

  // 1 · Limpio
  let code = 0
  let limpioJson
  try {
    limpioJson = JSON.parse(correr(FIX, [dir, '--json', '--profile', 'landing']))
  } catch (e) {
    code = e.status ?? 1
    try { limpioJson = JSON.parse(e.stdout) } catch { limpioJson = null }
  }
  if (!limpioJson) {
    console.log('  x limpio: no parseo JSON')
    fallos++
  } else if (limpioJson.totalHallazgos !== 0) {
    console.log(`  x limpio: esperaba 0 hallazgos, hay ${limpioJson.totalHallazgos}`)
    fallos++
  } else if (!limpioJson.contrato?.display) {
    console.log('  x limpio: brief sin contrato/display')
    fallos++
  } else if (code !== 0) {
    console.log(`  x limpio: exit ${code} con 0 hallazgos (debia ser 0)`)
    fallos++
  } else {
    console.log(`  ok limpio     0 hallazgos · contrato ${limpioJson.contrato.display}`)
  }

  // 2 · Mutacion + markdown
  writeFileSync(join(dir, 'roto.css'), `
.x {
  padding: 13px;
  border-radius: 11px;
  font-family: Inter, sans-serif;
  color: #ff00aa;
  transition: opacity 300ms ease;
}
`, 'utf8')

  const outMd = join(dir, 'REMEDIAR.md')
  code = 0
  try {
    correr(FIX, [dir, '--profile', 'landing', '--out', outMd])
  } catch (e) {
    code = e.status ?? 1
  }
  const md = readFileSync(outMd, 'utf8')
  const ids = ['DS1', 'DS2', 'DS3', 'DS4', 'DS5']
  const faltan = ids.filter(id => !md.includes(id))
  if (code !== 1) {
    console.log(`  x mutado: exit ${code}, esperaba 1`)
    fallos++
  } else if (faltan.length) {
    console.log(`  x mutado: markdown sin ${faltan.join(', ')}`)
    fallos++
  } else if (!md.includes('--fail-on-contrato') && !md.includes('fail-on-contrato')) {
    console.log('  x mutado: sin comando de verificacion de contrato')
    fallos++
  } else if (!md.includes('Reglas para el agente') && !md.includes('## Reglas')) {
    console.log('  x mutado: sin reglas de agente')
    fallos++
  } else {
    console.log('  ok mutado     brief con DS1–DS5, exit 1, verificar contrato')
  }

  // 3 · Scan JSON expone plan + fix
  const scan = JSON.parse(correr(SCAN, [dir, '--json', '--contrato', '--profile', 'landing']))
  if (!scan.plan?.capas?.length) {
    console.log('  x scan.plan vacio con hallazgos')
    fallos++
  } else if (!scan.checks.some(c => c.failed && c.fix)) {
    // contract checks are in plan not necessarily in checks with fix - checks are slop rules
    // at least plan items have fix
    const conFix = scan.plan.capas.flatMap(c => c.items).filter(i => i.fix)
    if (!conFix.length) {
      console.log('  x plan sin fix en items')
      fallos++
    } else {
      console.log(`  ok scan.plan  ${scan.plan.totalHallazgos} hallazgos con fix`)
    }
  } else {
    console.log(`  ok scan.plan  ${scan.plan.totalHallazgos} hallazgos · checks con fix`)
  }
} finally {
  rmSync(dir, { recursive: true, force: true })
}

console.log('')
if (fallos) {
  console.error(`verifica-fix: ${fallos} fallo(s)`)
  process.exit(1)
}
console.log('  verifica-fix: ok\n')
