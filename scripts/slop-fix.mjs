#!/usr/bin/env node
// slop-fix — brief de remediacion para un agente (o un humano con prisa).
//
// Corre el escanner con contrato, ordena el plan y emite un documento que se
// puede pegar en un agente de codigo: restricciones del sistema, pasos con
// archivo:linea, y el comando de verificacion al final.
//
//   node scripts/slop-fix.mjs <ruta>
//     [--brand "Marca"] [--profile landing|producto|ambos]
//     [--contrato [ruta]] [--genre g] [--brand-colors "#hex"]
//     [--out REMEDIAR.md] [--json] [--apply-safe]
//
//   --apply-safe  aplica solo parches triviales (Inter→tokens, 300ms, transition:all)
//                 y vuelve a escanear. No toca copy ni layout.
//
// Sin --contrato explicito, se activa si hay DESIGN.md / tokens / .slop-init.json
// en la raiz (o en --contrato). Sin contrato no inventa un sistema: pide
// slop-init o un DESIGN.md antes de tocar CSS de marca.

import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { resolverRutaContrato, cargarContrato } from './lib/contrato.mjs'
import { collect } from './lib/util.mjs'
import { applySafe } from './lib/apply-safe.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SCAN = join(AQUI, 'slop-scan.mjs')

const argv = process.argv.slice(2)
const CON_VALOR = new Set(['--brand', '--brand-colors', '--profile', '--genre', '--contrato', '--out'])
const flag = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined }
const has = n => argv.includes(n)

const posicional = argv.find((a, i) => !a.startsWith('--') && !CON_VALOR.has(argv[i - 1]))
const ROOT = resolve(posicional || '.')
const AS_JSON = has('--json')
const OUT = flag('--out')
const BRAND = flag('--brand')
const BRAND_COLORS = flag('--brand-colors')
const PROFILE = flag('--profile') || 'ambos'
const GENRE = flag('--genre')
const APPLY_SAFE = has('--apply-safe')

const contratoIdx = argv.indexOf('--contrato')
let CONTRATO_ARG = null
if (contratoIdx >= 0) {
  const next = argv[contratoIdx + 1]
  CONTRATO_ARG = (next && !next.startsWith('--')) ? next : true
} else if (resolverRutaContrato(ROOT, true)) {
  // Auto si hay contrato en la raiz: el brief sin restricciones es peligroso.
  CONTRATO_ARG = true
}

const scanArgs = [SCAN, ROOT, '--json', '--profile', PROFILE]
if (BRAND) scanArgs.push('--brand', BRAND)
if (BRAND_COLORS) scanArgs.push('--brand-colors', BRAND_COLORS)
if (GENRE) scanArgs.push('--genre', GENRE)
if (CONTRATO_ARG != null) {
  scanArgs.push('--contrato')
  if (CONTRATO_ARG !== true) scanArgs.push(String(CONTRATO_ARG))
}

function runScan() {
  try {
    const raw = execFileSync(process.execPath, scanArgs, {
      encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    })
    return JSON.parse(raw)
  } catch (e) {
    const out = e.stdout || e.message
    try { return JSON.parse(out) } catch {
      console.error('slop-fix: no se pudo ejecutar slop-scan')
      console.error(out)
      process.exit(2)
    }
  }
}

let scan = runScan()

// Contrato para apply-safe y reglas
const contratoDirEarly = CONTRATO_ARG != null
  ? resolverRutaContrato(ROOT, CONTRATO_ARG)
  : resolverRutaContrato(ROOT, true)
const contratoEarly = contratoDirEarly ? cargarContrato(contratoDirEarly) : null

let applyReport = null
if (APPLY_SAFE) {
  const files = collect(ROOT)
  applyReport = applySafe(ROOT, files, contratoEarly)
  scan = runScan()
}

const plan = scan.plan || { capas: [], totalHallazgos: 0, nameSwap: null }
const contratoDir = contratoDirEarly
const contratoObj = contratoEarly || (contratoDir ? cargarContrato(contratoDir) : null)
const designPath = contratoDir && existsSync(join(contratoDir, 'DESIGN.md'))
  ? join(contratoDir, 'DESIGN.md')
  : existsSync(join(ROOT, 'DESIGN.md'))
    ? join(ROOT, 'DESIGN.md')
    : null

const verificar = [
  `node scripts/slop-scan.mjs ${quote(relish(ROOT))} --profile ${PROFILE}` +
    (CONTRATO_ARG != null ? ' --contrato' + (CONTRATO_ARG !== true ? ' ' + quote(String(CONTRATO_ARG)) : '') + ' --fail-on-contrato' : '') +
    (BRAND ? ` --brand ${quote(BRAND)}` : ''),
]

function quote(s) {
  return /\s/.test(s) ? `"${s}"` : s
}
function relish(p) {
  // Prefer relative if under cwd
  try {
    const cwd = process.cwd()
    if (p.startsWith(cwd)) {
      const r = p.slice(cwd.length).replace(/^[\\/]/, '')
      return r || '.'
    }
  } catch { /* absolute */ }
  return p
}

const brief = {
  root: scan.root,
  score: scan.score,
  band: scan.band,
  generadosEn: new Date().toISOString(),
  nucleo: scan.nucleo || null,
  confianza_hallazgos: scan.confianza_hallazgos || null,
  contrato: contratoObj
    ? {
        origen: contratoObj.origen,
        display: contratoObj.display,
        texto: contratoObj.texto,
        espacios: contratoObj.espacios,
        radios: contratoObj.radios,
        duracion: contratoObj.duracion,
        paleta: contratoObj.paletaHex || contratoObj.paleta,
        designMd: designPath,
      }
    : null,
  nameSwap: plan.nameSwap,
  capas: plan.capas,
  orden: plan.orden || null,
  totalHallazgos: plan.totalHallazgos,
  resumen: scan.resumen,
  verificar,
  applySafe: applyReport,
  reglasAgente: REGLAS_AGENTE(contratoObj, designPath),
}

function REGLAS_AGENTE(c, design) {
  const r = [
    'ORDEN: 1) hallazgos ★ ALTA  2) dudosa  3) sin medir  4) contrato  5) calidad. No empieces por CSS dudoso si hay ALTA de copy.',
    'Un veredicto de «parece slop» solo con fallos ★ ALTA. Las dudosas son higiene, no prueba de IA.',
    'Contenido y datos antes que CSS. Ninguna correccion visual arregla un titular intercambiable.',
    'No inventes paleta, tipografia, escala ni duraciones. Si el sistema debe cambiar, edita DESIGN.md y tokens primero, luego el codigo.',
    'Cada cambio debe anclarse a un hallazgo del plan (id + archivo:linea). Prohibido "mejorar el look" sin referente.',
    'Tras los cambios, ejecuta el comando de verificacion. No declares listo sin score de contrato 100 (si hay contrato) y sin regresar hallazgos ALTA que tocaste.',
    'Si un hallazgo es de tipo defecto/calidad, arreglalo sin reetiquetarlo como "slop".',
    'No toques lo que no falla. El trinquete y el plan miden deriva, no un rediseño completo.',
  ]
  if (c) {
    r.unshift(
      `Restriccion activa: pareja ${c.display} / ${c.texto}; escala ${c.espacios.join('·')}px; radios ${c.radios.join('·')}px` +
        (c.duracion != null ? `; movimiento ${c.duracion}ms` : '') + '.',
    )
    if (design) r.unshift(`Lee el contrato completo en ${design} antes de editar estilos.`)
  } else {
    r.unshift(
      'No hay DESIGN.md / tokens / .slop-init.json. Si vas a tocar sistema visual, corre antes: node scripts/slop-init.mjs <destino> y adopta ese contrato, o declara uno. Sin restriccion, convergeras al promedio.',
    )
  }
  return r
}

function renderMarkdown(b) {
  const L = []
  L.push('# Brief de remediacion (slop-fix)')
  L.push('')
  L.push(`Generado: ${b.generadosEn}`)
  L.push(`Raiz: \`${b.root}\``)
  L.push(`Procedencia: **${b.score}/100** — ${b.band}`)
  if (b.nucleo?.score != null) {
    L.push(`Núcleo (solo confianza ALTA): **${b.nucleo.score}/100** · reglas \`${(b.nucleo.alta || []).join(', ')}\``)
  }
  if (b.resumen?.contrato) {
    L.push(`Contrato: **${b.resumen.contrato.score}/100** (${b.resumen.contrato.fallan} fallos · ${b.resumen.contrato.origen})`)
  } else if (!b.contrato) {
    L.push('Contrato: *ninguno cargado*')
  }
  L.push(`Hallazgos en el plan: **${b.totalHallazgos}**`)
  if (b.orden) L.push(`Orden: ${b.orden}`)
  L.push('')

  if (b.confianza_hallazgos?.fallan) {
    const f = b.confianza_hallazgos.fallan
    L.push('## De qué fiarte')
    L.push('')
    L.push(`- **★ ALTA (haz primero):** ${(f.alta || []).map(x => x.id).join(', ') || '(ninguna)'}`)
    L.push(`- **Dudosa (después):** ${(f.dudosa || []).map(x => x.id).join(', ') || '(ninguna)'}`)
    const baja = [...(f.baja || []), ...(f.sin_medir || [])].map(x => x.id)
    if (baja.length) L.push(`- **Baja / sin medir:** ${baja.join(', ')}`)
    if (b.confianza_hallazgos.aviso) L.push(`- ⚠ ${b.confianza_hallazgos.aviso}`)
    L.push('')
  }

  L.push('## Reglas para el agente')
  L.push('')
  for (const reg of b.reglasAgente) L.push(`- ${reg}`)
  L.push('')

  if (b.contrato) {
    L.push('## Contrato de diseno (restriccion, no sugerencia)')
    L.push('')
    if (b.contrato.designMd) L.push(`Fuente: \`${b.contrato.designMd}\` (${b.contrato.origen})`)
    else L.push(`Origen: ${b.contrato.origen}`)
    L.push('')
    L.push(`| Eje | Valor |`)
    L.push(`| --- | --- |`)
    L.push(`| Display | ${b.contrato.display || '—'} |`)
    L.push(`| Texto | ${b.contrato.texto || '—'} |`)
    L.push(`| Escala | ${(b.contrato.espacios || []).join(' · ') || '—'} |`)
    L.push(`| Radios | ${(b.contrato.radios || []).join(' · ') || '—'} |`)
    L.push(`| Movimiento | ${b.contrato.duracion != null ? b.contrato.duracion + 'ms' : '—'} |`)
    if (b.contrato.paleta && typeof b.contrato.paleta === 'object') {
      L.push('')
      L.push('Paleta (usa tokens, no hex sueltos):')
      L.push('')
      for (const [k, v] of Object.entries(b.contrato.paleta)) {
        L.push(`- \`${k}\`: \`${v}\``)
      }
    }
    L.push('')
  }

  if (b.nameSwap) {
    L.push('## 0 · Antes de nada — prueba del cambio de nombre')
    L.push('')
    L.push(`${b.nameSwap.count} titular(es) funcionarian para un competidor. Arregla el copy **antes** del sistema visual.`)
    L.push('')
    for (const s of b.nameSwap.samples) {
      L.push(`- \`${s.file}:${s.line}\` — "${s.text}"`)
    }
    L.push('')
  }

  if (!b.capas.length && !b.nameSwap) {
    L.push('## Plan')
    L.push('')
    L.push('Sin hallazgos de procedencia ni de contrato. No reescribas el diseno.')
    L.push('')
  } else {
    let n = 0
    for (const capa of b.capas) {
      n++
      L.push(`## ${n} · ${capa.capa}`)
      L.push('')
      if (capa.nota) L.push(`> ${capa.nota}`)
      if (capa.nota) L.push('')
      L.push(`${capa.items.length} hallazgo(s) · peso acumulado ${capa.peso}`)
      L.push('')
      for (const item of capa.items) {
        const badge = item.nivel === 'alta' ? ' ★ ALTA'
          : item.nivel === 'dudosa' ? ' · dudosa'
          : item.nivel === 'baja' || item.nivel === 'sin_medir' ? ' · baja/sin medir'
          : ''
        L.push(`### ${item.id} · ${item.title}${badge}`)
        L.push('')
        L.push(`- Tipo: \`${item.tipo}\` · sello: ${item.sello}`)
        if (item.detail) L.push(`- Detalle: ${item.detail}`)
        if (item.why) L.push(`- Por que: ${item.why}`)
        L.push(`- **Que hacer:** ${item.fix || 'Ver references/remediation.md'}`)
        if (item.samples?.length) {
          L.push('- Donde:')
          for (const s of item.samples) {
            L.push(`  - \`${s.file}:${s.line}\` — \`${(s.text || '').replace(/`/g, "'").slice(0, 100)}\``)
          }
        }
        L.push('')
      }
    }
  }

  if (b.applySafe) {
    L.push('## Apply-safe (ya ejecutado)')
    L.push('')
    L.push(`${b.applySafe.total} cambio(s) en ${b.applySafe.cambiados.length} archivo(s): familias prohibidas → tokens, 300ms → duración del contrato, \`transition: all\` acotado.`)
    for (const c of b.applySafe.cambiados) L.push(`- \`${c.file}\` (${c.n} línea(s))`)
    L.push('')
  }

  L.push('## Verificar (obligatorio al terminar)')
  L.push('')
  L.push('```bash')
  for (const cmd of b.verificar) L.push(cmd)
  L.push('```')
  L.push('')
  L.push('Criterio de hecho: el comando sale 0; si hay contrato, score de contrato 100; no reintroducir hallazgos que este brief listo.')
  L.push('')
  L.push('Referencias: `references/remediation.md`, `references/caveats.md`, `templates/revision-humana.md`.')
  L.push('')
  return L.join('\n')
}

const md = renderMarkdown(brief)

if (AS_JSON) {
  const payload = { ...brief, markdown: md }
  if (OUT) writeFileSync(resolve(OUT), JSON.stringify(payload, null, 2) + '\n', 'utf8')
  else console.log(JSON.stringify(payload, null, 2))
} else {
  if (OUT) {
    writeFileSync(resolve(OUT), md, 'utf8')
    console.log(`\n  slop-fix · escrito ${resolve(OUT)}`)
    console.log(`  procedencia ${brief.score}/100 · hallazgos ${brief.totalHallazgos}` +
      (brief.resumen?.contrato ? ` · contrato ${brief.resumen.contrato.score}/100` : ''))
    console.log('')
  } else {
    console.log(md)
  }
}

// Codigo de salida: 1 si hay trabajo pendiente (util en scripts).
if (brief.totalHallazgos > 0 || brief.nameSwap) process.exitCode = 1
