#!/usr/bin/env node
// slop-gate — enforcement del proceso de punta a punta (opt-in, pero duro).
//
// Un solo comando para CI / pre-push:
//   1. Exige contrato si --require-contrato
//   2. Corre scan con min-score, contrato, baseline según flags
//   3. Escribe brief de remediación en .slop/REMEDIAR.md
//   4. Escribe .slop/last-gate.json con el veredicto
//   5. Exit 0 solo si todas las puertas pasan
//
//   node scripts/slop-gate.mjs <ruta>
//     [--profile producto] [--brand X] [--min-score 70]
//     [--require-contrato] [--contrato ruta]
//     [--since-baseline] [--fail-on-new-drift]
//     [--require-calidad 60] [--dominio file]
//     [--no-brief]

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { resolverRutaContrato } from './lib/contrato.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SCAN = join(AQUI, 'slop-scan.mjs')
const FIX = join(AQUI, 'slop-fix.mjs')

const argv = process.argv.slice(2)
const CON_VALOR = new Set([
  '--brand', '--brand-colors', '--profile', '--genre', '--min-score',
  '--contrato', '--require-calidad', '--dominio',
])
const flag = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined }
const has = n => argv.includes(n)

const posicional = argv.find((a, i) => !a.startsWith('--') && !CON_VALOR.has(argv[i - 1]))
const ROOT = resolve(posicional || '.')
const PROFILE = flag('--profile') || 'producto'
const BRAND = flag('--brand')
const BRAND_COLORS = flag('--brand-colors')
const GENRE = flag('--genre')
const MIN_SCORE = flag('--min-score') != null ? Number(flag('--min-score')) : 70
const REQUIRE_CONTRATO = has('--require-contrato')
const REQUIRE_CALIDAD = flag('--require-calidad') != null ? Number(flag('--require-calidad')) : null
const DOMINIO = flag('--dominio')
const NO_BRIEF = has('--no-brief')
const SINCE = has('--since-baseline')
const FAIL_NEW = has('--fail-on-new-drift')

const contratoIdx = argv.indexOf('--contrato')
let CONTRATO_ARG = null
if (contratoIdx >= 0) {
  const next = argv[contratoIdx + 1]
  CONTRATO_ARG = (next && !next.startsWith('--')) ? next : true
} else if (REQUIRE_CONTRATO || resolverRutaContrato(ROOT, true)) {
  CONTRATO_ARG = true
}

const puertas = []
const t0 = Date.now()

function puerta(id, ok, detalle) {
  puertas.push({ id, ok, detalle })
  console.log(`  ${ok ? 'ok' : 'x '} ${id.padEnd(22)} ${detalle}`)
}

console.log(`\n  slop-gate · ${ROOT}\n`)

// Puerta 0 · contrato requerido
if (REQUIRE_CONTRATO) {
  const dir = resolverRutaContrato(ROOT, CONTRATO_ARG ?? true)
  const ok = !!dir
  puerta('contrato-presente', ok, ok ? `encontrado en ${dir}` : 'falta DESIGN.md / tokens.css / .slop-init.json')
  if (!ok) {
    finish(1)
  }
}

// Puerta 1 · scan
const scanArgs = [SCAN, ROOT, '--json', '--profile', PROFILE]
if (BRAND) scanArgs.push('--brand', BRAND)
if (BRAND_COLORS) scanArgs.push('--brand-colors', BRAND_COLORS)
if (GENRE) scanArgs.push('--genre', GENRE)
if (CONTRATO_ARG != null) {
  scanArgs.push('--contrato')
  if (CONTRATO_ARG !== true) scanArgs.push(String(CONTRATO_ARG))
}
if (DOMINIO) scanArgs.push('--dominio', DOMINIO)
if (SINCE) scanArgs.push('--since-baseline')
if (FAIL_NEW) scanArgs.push('--fail-on-new-drift')
// min-score y fail-on-contrato los evaluamos nosotros para un informe unificado

let scan
try {
  const raw = execFileSync(process.execPath, scanArgs, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  scan = JSON.parse(raw)
} catch (e) {
  // fail-on-new-drift puede matar el proceso
  if (e.stdout) {
    try { scan = JSON.parse(e.stdout) } catch { scan = null }
  }
  if (!scan) {
    puerta('scan', false, e.message || 'scan falló')
    finish(1)
  }
  if (FAIL_NEW && e.status === 1) {
    puerta('baseline-deriva', false, 'hallazgos nuevos respecto al baseline')
  }
}

puerta('scan', true, `procedencia ${scan.score}/100 — ${scan.band}`)

const scoreOk = scan.score >= MIN_SCORE
puerta('min-score', scoreOk, `${scan.score} ${scoreOk ? '≥' : '<'} ${MIN_SCORE}`)

if (CONTRATO_ARG != null) {
  const cs = scan.resumen?.contrato?.score
  const fallan = scan.resumen?.contrato?.fallan ?? scan.contrato?.fallan
  const ok = cs === 100 || fallan === 0
  puerta('contrato-limpio', ok, cs != null ? `score ${cs}/100 · fallan ${fallan}` : 'sin informe de contrato')
}

if (REQUIRE_CALIDAD != null) {
  const q = scan.calidad?.score
  const ok = typeof q === 'number' && q >= REQUIRE_CALIDAD
  puerta('calidad-minima', ok, q != null ? `${q} ${ok ? '≥' : '<'} ${REQUIRE_CALIDAD}` : 'sin eje calidad')
}

if (scan.dominio) {
  puerta('dominio', !scan.dominio.failed, scan.dominio.detail)
}

// Puerta brief
if (!NO_BRIEF) {
  try {
    mkdirSync(join(ROOT, '.slop'), { recursive: true })
    const briefPath = join(ROOT, '.slop', 'REMEDIAR.md')
    const fixArgs = [FIX, ROOT, '--profile', PROFILE, '--out', briefPath]
    if (BRAND) fixArgs.push('--brand', BRAND)
    if (CONTRATO_ARG != null) {
      fixArgs.push('--contrato')
      if (CONTRATO_ARG !== true) fixArgs.push(String(CONTRATO_ARG))
    }
    try {
      execFileSync(process.execPath, fixArgs, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    } catch {
      // exit 1 si hay hallazgos — esperado
    }
    const ok = existsSync(briefPath)
    puerta('brief', ok, ok ? `.slop/REMEDIAR.md` : 'no se escribió el brief')
  } catch (e) {
    puerta('brief', false, e.message)
  }
}

const allOk = puertas.every(p => p.ok)
finish(allOk ? 0 : 1)

function finish(code) {
  const report = {
    ts: new Date().toISOString(),
    root: ROOT,
    ok: code === 0,
    ms: Date.now() - t0,
    minScore: MIN_SCORE,
    puertas,
    score: scan?.score ?? null,
    band: scan?.band ?? null,
    contratoScore: scan?.resumen?.contrato?.score ?? scan?.contrato?.score ?? null,
    calidadScore: scan?.calidad?.score ?? null,
  }
  try {
    mkdirSync(join(ROOT, '.slop'), { recursive: true })
    writeFileSync(join(ROOT, '.slop', 'last-gate.json'), JSON.stringify(report, null, 2) + '\n', 'utf8')
  } catch { /* ignore */ }

  console.log('')
  console.log(code === 0
    ? '  GATE PASS — proceso cumplido\n'
    : '  GATE FAIL — ver puertas y .slop/REMEDIAR.md\n')
  process.exit(code)
}
