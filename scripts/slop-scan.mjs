#!/usr/bin/env node
// slop-scan — auditor estatico de patrones "AI slop" en diseno web y de producto.
// Sin dependencias. Cuenta patrones nombrados por fuentes publicadas; no puntua gusto.
//
//   node slop-scan.mjs <ruta> [--brand "Marca"] [--brand-colors "#hex,#hex"]
//                             [--profile landing|producto|ambos] [--genre <g>]
//                             [--json] [--min-score N]
//                             [--write-baseline] [--since-baseline] [--fail-on-new-drift]
//                             [--log]

import { readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { collect, esEstilo, esCodigo, all, esProsa, lineaDe } from './lib/util.mjs'
import { recogerTokens, bloques } from './lib/color.mjs'
import { programaticas } from './lib/checks.mjs'
import { firmaMacro } from './lib/structure.mjs'
import * as bl from './lib/baseline.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))

/* ── argumentos ── */

const argv = process.argv.slice(2)
const CON_VALOR = new Set(['--brand', '--brand-colors', '--profile', '--genre', '--min-score', '--rules'])
const flag = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined }
const has = n => argv.includes(n)

const posicional = argv.find((a, i) => !a.startsWith('--') && !CON_VALOR.has(argv[i - 1]))
const ROOT = resolve(posicional || '.')
const BRAND = flag('--brand')
const BRAND_COLORS = (flag('--brand-colors') || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
const PROFILE = flag('--profile') || 'ambos'
const GENRE = flag('--genre') || null
const RULES_PATH = flag('--rules') || join(AQUI, '..', 'data', 'rules.json')
const AS_JSON = has('--json')
const MIN_SCORE = flag('--min-score') ? Number(flag('--min-score')) : null
const WRITE_BASELINE = has('--write-baseline')
const SINCE_BASELINE = has('--since-baseline')
const FAIL_NEW = has('--fail-on-new-drift')
const WRITE_LOG = has('--log')

if (FAIL_NEW && !SINCE_BASELINE) {
  console.error('slop-scan: --fail-on-new-drift requiere --since-baseline')
  process.exit(2)
}

/* ── contexto ── */

const files = collect(ROOT)
const styleFiles = files.filter(esEstilo)
const codeFiles = files.filter(esCodigo)
const cssTexto = all(styleFiles)
const tokens = recogerTokens(styleFiles)
const blks = bloques(styleFiles)
const ctx = { files, styleFiles, codeFiles, cssTexto, tokens, blks }

/* ── reglas declarativas ── */

let CATALOGO = { rules: [] }
try { CATALOGO = JSON.parse(readFileSync(RULES_PATH, 'utf8')) }
catch (e) { console.error(`slop-scan: no se pudo leer el catalogo de reglas (${RULES_PATH}): ${e.message}`); process.exit(2) }

const marcaPermitida = linea => BRAND_COLORS.some(c => linea.toLowerCase().includes(c))

function correrDeclarativa(regla) {
  const pool = regla.scope === 'style' ? styleFiles : regla.scope === 'code' ? codeFiles : files
  const re = new RegExp(regla.pattern, (regla.flags || '') + 'g')
  const samples = []
  let total = 0, exentas = 0
  for (const f of pool) {
    for (let i = 0; i < f.lines.length; i++) {
      // Todas las coincidencias de la linea, no solo la primera: los umbrales de
      // densidad se evaden agrupando selectores o minificando.
      const hits = [...f.lines[i].matchAll(re)]
      if (!hits.length) continue
      if (marcaPermitida(f.lines[i])) { exentas += hits.length; continue }
      total += hits.length
      const m = hits[0]
      if (samples.length < 5) {
        // Se muestra el fragmento que caso, no el prefijo de la linea: en lineas
        // largas el prefijo esconde justo la evidencia.
        const l = f.lines[i]
        const ini = Math.max(0, m.index - 32)
        const frag = (ini > 0 ? '…' : '') + l.slice(ini, m.index + m[0].length + 32).trim() + (m.index + m[0].length + 32 < l.length ? '…' : '')
        samples.push({ file: f.rel, line: i + 1, text: frag.slice(0, 120), match: m[0].slice(0, 40) })
      }
    }
  }
  const umbral = regla.threshold ?? 1
  return {
    failed: total >= umbral,
    detail: `${total} coincidencia(s)${umbral > 1 ? ` (umbral ${umbral})` : ''}${exentas ? ` · ${exentas} exenta(s) por color de marca` : ''}`,
    samples,
  }
}

/* ── ejecucion ── */

const declarativas = CATALOGO.rules.map(r => ({
  id: r.id, cat: r.category, title: r.name, weight: r.weight ?? 2,
  applies: r.applies || 'ambos', exempt: r.exempt || [], why: r.why, fix: r.fix, source: r.source,
  origen: 'json', run: () => correrDeclarativa(r),
}))

const todas = [...declarativas, ...programaticas(ctx).map(c => ({ ...c, origen: 'js', title: c.title }))]

const aplica = c => (PROFILE === 'ambos' || c.applies === 'ambos' || c.applies === PROFILE)
const exenta = c => GENRE && (c.exempt || []).includes(GENRE)

const activas = todas.filter(c => aplica(c) && !exenta(c))
const exentasPorGenero = todas.filter(c => aplica(c) && exenta(c))

const results = activas.map(c => {
  let r
  try { r = c.run() } catch (e) { r = { failed: false, detail: 'error: ' + e.message } }
  return { ...c, ...r }
})

/* ── prueba del cambio de nombre ── */

function nameSwap() {
  if (!BRAND) return null
  const marca = BRAND.toLowerCase()
  const cand = []
  for (const f of codeFiles) {
    for (const m of f.text.matchAll(/<h[12][^>]*>([^<]{18,160})<|["'`]([^"'`\n]{18,160})["'`]/g)) {
      const s = (m[1] || m[2] || '').trim()
      if (!esProsa(s) || s.toLowerCase().includes(marca)) continue
      if (!/\b(servicio|plataforma|experiencia|profesional|reserva|solucion|calidad|confianza|mejor|futuro|todo|belleza|domicilio)\b/i.test(s)) continue
      cand.push({ file: f.rel, line: lineaDe(f.text, m.index), text: s.slice(0, 110) })
    }
  }
  const uniq = [...new Map(cand.map(c => [c.text, c])).values()]
  return { failed: uniq.length > 0, count: uniq.length, samples: uniq.slice(0, 8) }
}
const swap = nameSwap()

/* ── puntuacion ── */

const maxW = results.reduce((a, r) => a + r.weight, 0) + (swap ? 3 : 0)
const lostW = results.filter(r => r.failed).reduce((a, r) => a + r.weight, 0) + (swap?.failed ? 3 : 0)
const score = maxW ? Math.round(100 * (1 - lostW / maxW)) : 100
const band = score >= 85 ? 'Limpio'
  : score >= 70 ? 'Restos localizados'
  : score >= 50 ? 'Se identificara'
  : 'Se identifica en diez segundos'

/* ── baseline y registro ── */

let baselineInfo = null
if (WRITE_BASELINE) {
  const n = bl.escribirBaseline(ROOT, results)
  baselineInfo = { escrito: n }
}
const baseline = SINCE_BASELINE ? bl.leerBaseline(ROOT) : null
const nuevos = SINCE_BASELINE ? bl.nuevosHallazgos(results, baseline) : null

const firma = firmaMacro(codeFiles, tokens)
const repite = WRITE_LOG ? bl.repiteMacroestructura(ROOT, firma) : null
if (WRITE_LOG) bl.escribirLog(ROOT, firma, score, `slop-scan ${score}/100 · ${band}`)

/* ── salida ── */

if (AS_JSON) {
  console.log(JSON.stringify({
    root: ROOT, profile: PROFILE, genre: GENRE, brand: BRAND || null,
    score, band, filesScanned: files.length, tokens: tokens.size,
    checks: results.map(({ id, cat, title, weight, failed, detail, samples, origen, source }) =>
      ({ id, cat, title, weight, failed, detail, origen, source, samples: samples || [] })),
    exemptedByGenre: exentasPorGenero.map(c => c.id),
    nameSwap: swap, baseline: baselineInfo, newFindings: nuevos, macro: firma, repeatsPrevious: repite,
  }, null, 2))
} else {
  const fallan = results.filter(r => r.failed)
  const pasan = results.filter(r => !r.failed)
  console.log(`\n  slop-scan · ${ROOT}`)
  console.log(`  perfil: ${PROFILE}${GENRE ? ` · genero: ${GENRE}` : ''} · ${files.length} archivos · ${tokens.size} tokens de CSS`)
  console.log(`  ${declarativas.length} reglas declarativas + ${todas.length - declarativas.length} programaticas\n`)
  console.log(`  PUNTUACION  ${score}/100 — ${band}`)
  console.log(`  ${fallan.length} de ${results.length} comprobaciones fallan`)
  if (exentasPorGenero.length) console.log(`  ${exentasPorGenero.length} exenta(s) por genero "${GENRE}": ${exentasPorGenero.map(c => c.id).join(', ')}`)
  console.log('')

  if (swap) {
    console.log(`  ── Prueba del cambio de nombre (marca: "${BRAND}") ──`)
    if (swap.failed) {
      console.log(`  x ${swap.count} titular(es) que funcionarian para un competidor:`)
      for (const s of swap.samples) console.log(`      ${s.file}:${s.line}  "${s.text}"`)
    } else console.log('  ok  sin titulares intercambiables')
    console.log('')
  }

  if (repite) {
    console.log('  ── Comparacion con la ejecucion anterior ──')
    console.log(repite.igual
      ? '  x  macroestructura IDENTICA a la anterior: el generador no esta divergiendo'
      : '  ok macroestructura distinta de la anterior')
    console.log('')
  }

  if (fallan.length) {
    console.log('  ── Fallan ──')
    for (const r of fallan) {
      console.log(`  x ${r.id} · ${r.title}  [peso ${r.weight}${r.source ? ` · ${r.source}` : ''}]`)
      console.log(`      ${r.detail}`)
      if (r.nota) console.log(`      nota: ${r.nota}`)
      for (const s of (r.samples || []).slice(0, 3)) console.log(`      ${s.file}:${s.line}  ${s.text}`)
    }
    console.log('')
  }

  console.log('  ── Pasan ──')
  for (const r of pasan) console.log(`  ok ${r.id} · ${r.title} — ${r.detail}`)

  if (baselineInfo) console.log(`\n  Baseline escrito: ${baselineInfo.escrito} hallazgo(s) tolerados en .slop/baseline.json`)
  if (nuevos) {
    console.log(`\n  ── Deriva nueva desde el baseline: ${nuevos.length} ──`)
    for (const n of nuevos.slice(0, 10)) console.log(`      ${n.id} · ${n.file}:${n.line}  ${n.text}`)
    if (!baseline) console.log('      (no hay baseline previo: todo cuenta como nuevo)')
  }

  console.log('\n  Las comprobaciones que exigen ojo humano estan en templates/revision-humana.md')
  console.log('  Antes de dar un veredicto, lee references/caveats.md\n')
}

/* ── codigos de salida ── */

if (FAIL_NEW && nuevos && nuevos.length > 0) {
  console.error(`slop-scan: ${nuevos.length} hallazgo(s) NUEVOS respecto al baseline`)
  process.exit(1)
}
if (MIN_SCORE !== null && score < MIN_SCORE) {
  console.error(`slop-scan: ${score} por debajo del umbral ${MIN_SCORE}`)
  process.exit(1)
}
