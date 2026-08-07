#!/usr/bin/env node
// slop-scan — auditor estatico de patrones "AI slop" en diseno web y de producto.
// Sin dependencias. Cuenta patrones nombrados por fuentes publicadas; no puntua gusto.
//
//   node slop-scan.mjs <ruta> [--brand "Marca"] [--brand-colors "#hex,#hex"]
//                             [--profile landing|producto|ambos] [--genre <g>]
//                             [--json] [--min-score N]
//                             [--write-baseline] [--since-baseline] [--fail-on-new-drift]
//                             [--log]
//                             [--contrato [ruta]] [--fail-on-contrato]
//                             [--stats] [--no-history] [--dominio file]
//                             [--min-calidad N] [--fail-on-calidad]
//
//   --contrato   lint del sistema de diseño (DESIGN.md / tokens.css / .slop-init.json).
//   --fail-on-contrato  sale 1 si el contrato tiene fallos (para CI).
//   --stats      resume .slop/history.jsonl y sale (observabilidad local).
//   --no-history no registra esta ejecución en el historial.
//   --dominio    archivo de conceptos de negocio (uno por línea).
//   --min-calidad / --fail-on-calidad  umbral del eje de higiene de producto.

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { collect, esEstilo, esCodigo, all, esProsa, lineaDe } from './lib/util.mjs'
import { recogerTokens, bloques } from './lib/color.mjs'
import { programaticas } from './lib/checks.mjs'
import { firmaMacro } from './lib/structure.mjs'
import { genericidad } from './lib/genericidad.mjs'
import { resolverRutaContrato, cargarContrato, comprobarContrato } from './lib/contrato.mjs'
import { sello, armarPlan } from './lib/sello.mjs'
import { comprobarCalidad, comprobarDominio } from './lib/calidad.mjs'
import { registrar, imprimirStats } from './lib/history.mjs'
import * as bl from './lib/baseline.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const t0 = Date.now()

/* ── argumentos ── */

const argv = process.argv.slice(2)
const CON_VALOR = new Set([
  '--brand', '--brand-colors', '--profile', '--genre', '--min-score', '--rules',
  '--contrato', '--dominio', '--min-calidad',
])
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
const PLAN = has('--plan')
const MIN_SCORE = flag('--min-score') ? Number(flag('--min-score')) : null
const WRITE_BASELINE = has('--write-baseline')
const SINCE_BASELINE = has('--since-baseline')
const FAIL_NEW = has('--fail-on-new-drift')
const WRITE_LOG = has('--log')
const FAIL_CONTRATO = has('--fail-on-contrato')
const STATS = has('--stats')
const NO_HISTORY = has('--no-history')
const DOMINIO_PATH = flag('--dominio')
const MIN_CALIDAD = flag('--min-calidad') != null ? Number(flag('--min-calidad')) : null
const FAIL_CALIDAD = has('--fail-on-calidad')
// --contrato sin valor (o con valor que es otro flag) = auto en ROOT
const contratoFlagIdx = argv.indexOf('--contrato')
let CONTRATO_ARG = null
if (contratoFlagIdx >= 0) {
  const next = argv[contratoFlagIdx + 1]
  CONTRATO_ARG = (next && !next.startsWith('--')) ? next : true
} else if (FAIL_CONTRATO) {
  // Fallar en CI implica activar el lint del contrato.
  CONTRATO_ARG = true
}

if (STATS) {
  imprimirStats(ROOT, { json: AS_JSON })
  process.exit(0)
}

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
  validado: r.validado || null,
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

// Descriptivo, nunca puntuable. Ver scripts/lib/genericidad.mjs.
const gen = genericidad(files)

/* ── contrato de diseño (lint del sistema; no puntúa procedencia) ── */

let informeContrato = null
if (CONTRATO_ARG != null) {
  const dirC = resolverRutaContrato(ROOT, CONTRATO_ARG)
  if (!dirC) {
    console.error('slop-scan: --contrato: no se encontró DESIGN.md, tokens.css ni .slop-init.json')
    process.exit(2)
  }
  const contrato = cargarContrato(dirC)
  if (!contrato) {
    console.error(`slop-scan: --contrato: no se pudo cargar el contrato en ${dirC}`)
    process.exit(2)
  }
  informeContrato = comprobarContrato(contrato, files)
}

/* ── puntuacion ── */

// La puntuacion la forman SOLO las reglas de procedencia. Las de defecto
// —accesibilidad, rendimiento, legibilidad— se reportan aparte.
//
// Sin esta separacion habia una contradiccion: se afirmaba que el marcador mide
// "cuanto se parece a lo generado" mientras comprobaciones de calidad pura, sin
// discriminacion medida, le restaban puntos. Un proyecto humano con mal
// contraste bajaba en un marcador de procedencia, que es justo lo que este
// repositorio acusa a otras herramientas de hacer.
const procedencia = results.filter(r => r.tipo !== 'defecto' && r.tipo !== 'calidad')
const defectos = results.filter(r => r.tipo === 'defecto')

const maxW = procedencia.reduce((a, r) => a + r.weight, 0) + (swap ? 3 : 0)
const lostW = procedencia.filter(r => r.failed).reduce((a, r) => a + r.weight, 0) + (swap?.failed ? 3 : 0)
const score = maxW ? Math.round(100 * (1 - lostW / maxW)) : 100
const band = score >= 85 ? 'Limpio'
  : score >= 70 ? 'Restos localizados'
  : score >= 50 ? 'Se identificara'
  : 'Se identifica en diez segundos'

/* ── calidad de producto / a11y estática (eje aparte) ── */

const informeCalidad = comprobarCalidad(ctx)
let informeDominio = null
if (DOMINIO_PATH) {
  const rutaDom = resolve(DOMINIO_PATH)
  if (!existsSync(rutaDom)) {
    console.error(`slop-scan: --dominio no existe: ${rutaDom}`)
    process.exit(2)
  }
  const conceptos = readFileSync(rutaDom, 'utf8').split(/\r?\n/)
  informeDominio = comprobarDominio(codeFiles, conceptos)
  if (informeDominio) informeCalidad.checks.push(informeDominio)
  // Recalcular score de calidad incluyendo dominio
  const fallanQ = informeCalidad.checks.filter(c => c.failed)
  const maxQ = informeCalidad.checks.reduce((a, c) => a + c.weight, 0)
  const lostQ = fallanQ.reduce((a, c) => a + c.weight, 0)
  informeCalidad.score = maxQ ? Math.round(100 * (1 - lostQ / maxQ)) : 100
  informeCalidad.fallan = fallanQ.length
  informeCalidad.total = informeCalidad.checks.length
}

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

const planArmado = armarPlan({
  results, nameSwap: swap, contrato: informeContrato, calidad: informeCalidad,
})

/* ── historial local (observabilidad) ── */
if (!NO_HISTORY && !STATS) {
  registrar(ROOT, {
    tool: 'slop-scan',
    score, band, profile: PROFILE, genre: GENRE,
    contratoScore: informeContrato?.score ?? null,
    calidadScore: informeCalidad?.score ?? null,
    fallanProc: procedencia.filter(r => r.failed).length,
    fallanDef: defectos.filter(r => r.failed).length,
    fallanContrato: informeContrato?.fallan ?? 0,
    fallanCalidad: informeCalidad?.fallan ?? 0,
    files: files.length,
    ms: Date.now() - t0,
  })
}

if (PLAN) {
  console.log(`\n  PLAN DE REMEDIACION · ${ROOT}`)
  console.log(`  Puntuacion ${score}/100 — ${band} · ${planArmado.totalHallazgos} hallazgo(s)\n`)

  if (planArmado.nameSwap) {
    console.log('  ANTES DE NADA · prueba del cambio de nombre')
    console.log(`  ${planArmado.nameSwap.count} titular(es) funcionarian igual para un competidor. Ninguna`)
    console.log('  correccion de sistema visual arregla eso.')
    for (const s of planArmado.nameSwap.samples.slice(0, 3)) console.log(`      ${s.file}:${s.line}  "${s.text}"`)
    console.log('')
  }

  let paso = 0
  for (const capa of planArmado.capas) {
    paso++
    console.log(`  ${paso} · ${capa.capa.toUpperCase()}   ${capa.items.length} hallazgo(s) · peso ${capa.peso}`)
    for (const r of capa.items) {
      console.log(`\n      ${r.id} · ${r.title}   [${r.sello}]`)
      if (r.why) console.log(`      Por que delata: ${r.why}`)
      console.log(`      Que hacer:      ${r.fix || '(sin arreglo declarado — ver references/remediation.md)'}`)
      const d = (r.samples || []).slice(0, 3).map(s => `${s.file}:${s.line}`).join(', ')
      if (d) console.log(`      Donde:          ${d}${(r.samples || []).length > 3 ? ' y mas' : ''}`)
    }
    console.log('')
  }

  console.log('  El orden sale de peso x confianza de validacion / esfuerzo estimado.')
  console.log('  La confianza viene de research/RESULTADOS.md; el esfuerzo es heuristico por categoria.')
  console.log('  Para un brief de agente (contrato + pasos + verificar): node scripts/slop-fix.mjs <ruta>')
  console.log('  Lo que exige ojo humano no esta aqui: templates/revision-humana.md\n')

} else if (AS_JSON) {
  console.log(JSON.stringify({
    root: ROOT, profile: PROFILE, genre: GENRE, brand: BRAND || null,
    score, band, filesScanned: files.length, tokens: tokens.size,
    checks: results.map(r => {
      const s = sello(r)
      return {
        id: r.id, tipo: r.tipo || 'procedencia', cat: r.cat, title: r.title, weight: r.weight,
        failed: r.failed, detail: r.detail, origen: r.origen, source: r.source,
        why: r.why || null, fix: r.fix || null, validado: r.validado || null,
        sello: s.etiqueta, confianza: s.confianza,
        samples: r.samples || [],
      }
    }),
    plan: planArmado,
    resumen: {
      procedencia: { total: procedencia.length, fallan: procedencia.filter(r => r.failed).length },
      defecto: { total: defectos.length, fallan: defectos.filter(r => r.failed).length },
      contrato: informeContrato
        ? { total: informeContrato.total, fallan: informeContrato.fallan, score: informeContrato.score, origen: informeContrato.origen }
        : null,
      calidad: { total: informeCalidad.total, fallan: informeCalidad.fallan, score: informeCalidad.score },
    },
    contrato: informeContrato,
    calidad: informeCalidad,
    dominio: informeDominio,
    exemptedByGenre: exentasPorGenero.map(c => c.id),
    nameSwap: swap, genericidad: gen, baseline: baselineInfo, newFindings: nuevos, macro: firma, repeatsPrevious: repite,
    ms: Date.now() - t0,
  }, null, 2))
} else {
  const fallan = results.filter(r => r.failed)
  const pasan = results.filter(r => !r.failed)
  console.log(`\n  slop-scan · ${ROOT}`)
  console.log(`  perfil: ${PROFILE}${GENRE ? ` · genero: ${GENRE}` : ''} · ${files.length} archivos · ${tokens.size} tokens de CSS`)
  console.log(`  ${declarativas.length} reglas declarativas + ${todas.length - declarativas.length} programaticas\n`)
  console.log(`  PUNTUACION  ${score}/100 — ${band}`)
  console.log(`  procedencia: ${procedencia.filter(r => r.failed).length} de ${procedencia.length} fallan  (forman la puntuacion)`)
  console.log(`  defecto:     ${defectos.filter(r => r.failed).length} de ${defectos.length} fallan  (calidad, NO puntuan)`)
  if (informeContrato) {
    console.log(`  contrato:    ${informeContrato.fallan} de ${informeContrato.total} fallan  (sistema de diseño · ${informeContrato.score}/100 · ${informeContrato.origen})`)
  }
  console.log(`  calidad:     ${informeCalidad.fallan} de ${informeCalidad.total} fallan  (higiene producto/a11y · ${informeCalidad.score}/100)`)
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

  if (gen) {
    console.log('  ── Genericidad (descriptivo, NO puntua) ──')
    console.log(`  G = ${gen.G.toFixed(2)}${gen.percentil !== null ? ` · percentil ${gen.percentil} del corpus` : ''}`)
    console.log(`  ${gen.lectura}`)
    console.log(`  AUC ${gen.auc.toFixed(3)} IC95 [${gen.ic95[0].toFixed(3)} · ${gen.ic95[1].toFixed(3)}] — el limite inferior roza el azar,`)
    console.log('  por eso este numero se reporta y no se puntua.')
    console.log('')
  }

  if (informeContrato) {
    const r = informeContrato.resumen
    console.log('  ── Contrato de diseño (lint del sistema, NO puntua procedencia) ──')
    console.log(`  origen ${informeContrato.origen} · score ${informeContrato.score}/100 · ${informeContrato.fallan}/${informeContrato.total} fallan`)
    if (r.display) console.log(`  pareja  ${r.display} / ${r.texto} · escala ${r.espacios.join('·')} · radios ${r.radios.join('·')}${r.duracion != null ? ` · ${r.duracion}ms` : ''}`)
    for (const c of informeContrato.checks) {
      console.log(`  ${c.failed ? 'x' : 'ok'} ${c.id} · ${c.title} — ${c.detail}`)
      if (c.failed) {
        for (const s of (c.samples || []).slice(0, 3)) console.log(`      ${s.file}:${s.line}  ${s.text}`)
        if (c.fix) console.log(`      → ${c.fix}`)
      }
    }
    console.log('')
  }

  if (informeCalidad) {
    console.log('  ── Calidad / a11y estática (NO es gusto ni UX completa; NO puntúa procedencia) ──')
    console.log(`  score ${informeCalidad.score}/100 · ${informeCalidad.fallan}/${informeCalidad.total} fallan · ${informeCalidad.nota}`)
    for (const c of informeCalidad.checks) {
      console.log(`  ${c.failed ? 'x' : 'ok'} ${c.id} · ${c.title} — ${c.detail}`)
      if (c.failed) {
        for (const s of (c.samples || []).slice(0, 3)) console.log(`      ${s.file}:${s.line}  ${s.text}`)
        if (c.fix) console.log(`      → ${c.fix}`)
      }
    }
    console.log('')
  }

  if (fallan.length) {
    console.log('  ── Fallan ──')
    for (const r of fallan) {
      console.log(`  x ${r.id} · ${r.title}  [peso ${r.weight} · ${sello(r).etiqueta}]`)
      console.log(`      ${r.detail}`)
      if (r.nota) console.log(`      nota: ${r.nota}`)
      for (const s of (r.samples || []).slice(0, 3)) console.log(`      ${s.file}:${s.line}  ${s.text}`)
      // El arreglo estaba en el catalogo y no llegaba nunca a la salida.
      if (r.fix) console.log(`      → ${r.fix}`)
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
if (FAIL_CONTRATO && informeContrato && informeContrato.fallan > 0) {
  console.error(`slop-scan: ${informeContrato.fallan} hallazgo(s) de contrato de diseño`)
  process.exit(1)
}
if ((FAIL_CALIDAD || MIN_CALIDAD != null) && informeCalidad) {
  const umbral = MIN_CALIDAD != null ? MIN_CALIDAD : 100
  if (informeCalidad.score < umbral) {
    console.error(`slop-scan: calidad ${informeCalidad.score} por debajo de ${umbral}`)
    process.exit(1)
  }
}
if (MIN_SCORE !== null && score < MIN_SCORE) {
  console.error(`slop-scan: ${score} por debajo del umbral ${MIN_SCORE}`)
  process.exit(1)
}
