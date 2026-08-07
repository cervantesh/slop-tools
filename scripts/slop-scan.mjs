#!/usr/bin/env node
// slop-scan — auditor estático de patrones "AI slop" en diseño web y de producto.
// Sin dependencias. Cuenta patrones nombrados por fuentes publicadas; no puntúa gusto.
// Uso:  node slop-scan.mjs <ruta> [--brand "Nombre"] [--profile landing|producto|ambos]
//                                 [--json] [--min-score N]

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname, relative, resolve } from 'node:path'

/* ─────────────────────────── argumentos ─────────────────────────── */

const argv = process.argv.slice(2)
const flag = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined }
const has = n => argv.includes(n)

const ROOT = resolve(argv.find(a => !a.startsWith('--') &&
  argv[argv.indexOf(a) - 1] !== '--brand' &&
  argv[argv.indexOf(a) - 1] !== '--profile' &&
  argv[argv.indexOf(a) - 1] !== '--min-score') || '.')
const BRAND = flag('--brand')
const PROFILE = flag('--profile') || 'ambos'
const AS_JSON = has('--json')
const MIN_SCORE = flag('--min-score') ? Number(flag('--min-score')) : null

/* ─────────────────────────── recolección ─────────────────────────── */

const EXT = new Set(['.css', '.scss', '.sass', '.less', '.html', '.htm',
  '.jsx', '.tsx', '.js', '.ts', '.mjs', '.vue', '.svelte', '.astro'])
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next',
  'coverage', 'vendor', '.svelte-kit', '__snapshots__'])

function collect(dir, acc = []) {
  let entries
  try { entries = readdirSync(dir) } catch { return acc }
  for (const name of entries) {
    if (SKIP.has(name)) continue
    const p = join(dir, name)
    let st
    try { st = statSync(p) } catch { continue }
    if (st.isDirectory()) collect(p, acc)
    else if (EXT.has(extname(name)) && st.size < 4_000_000) {
      let text
      try { text = readFileSync(p, 'utf8') } catch { continue }
      acc.push({ path: p, rel: relative(ROOT, p).replace(/\\/g, '/'), text, lines: text.split('\n') })
    }
  }
  return acc
}

const files = collect(ROOT)
// Los archivos de marcado cuentan como fuente de estilos: HTML, Vue, Svelte y Astro
// llevan CSS embebido en <style>, y omitirlos hace que las comprobaciones de estilo
// pasen en vacío sobre proyectos perfectamente auditables.
const styleFiles = files.filter(f => /\.(css|scss|sass|less|html?|vue|svelte|astro)$/.test(f.rel))
const codeFiles = files.filter(f => /\.(jsx|tsx|js|ts|mjs|vue|svelte|astro|html?)$/.test(f.rel))

/* ─────────────────────────── utilidades ─────────────────────────── */

// Descarta lo que es código y no prosa dirigida a una persona. Sin esto, el detector
// de copy duplicado señala expresiones JSX y la prueba del cambio de nombre se llena
// de ruido.
function esProsa(s) {
  if (!s || !/\s/.test(s)) return false
  if (!/[a-záéíóúñ]{3}/i.test(s)) return false
  if (/[{}<>=;()[\]|]|=>|\$\{|::|\/\//.test(s)) return false
  if (/^[\w./-]+$/.test(s)) return false
  if (/^(https?:|data:|\.\/|\/)/.test(s)) return false
  return true
}

// Busca un patrón y devuelve las coincidencias con su ubicación.
function find(pattern, pool = files, cap = 8) {
  const out = []
  let total = 0
  for (const f of pool) {
    for (let i = 0; i < f.lines.length; i++) {
      const m = f.lines[i].match(pattern)
      if (m) {
        total++
        if (out.length < cap) out.push({ file: f.rel, line: i + 1, text: f.lines[i].trim().slice(0, 120) })
      }
    }
  }
  return { total, samples: out }
}

const all = pool => pool.map(f => f.text).join('\n')

/* ─────────────────────────── comprobaciones ─────────────────────────── */
// kind: 'count' usa umbral; 'flag' es presencia/ausencia.

const CHECKS = [

  { id: 'A1', cat: 'Color', weight: 3, applies: 'ambos',
    title: 'Gradiente morado→azul',
    run() {
      const tw = find(/\b(from|via|to)-(indigo|violet|purple|fuchsia)-\d{3}\b/, codeFiles)
      const css = find(/(linear|radial)-gradient\([^)]*#(6|7|8)[0-9a-f]{2}(f|e|d)[0-9a-f]{2}/i, styleFiles)
      const total = tw.total + css.total
      return { failed: total > 0, detail: `${total} coincidencias`, samples: [...tw.samples, ...css.samples] }
    } },

  { id: 'A2', cat: 'Color', weight: 2, applies: 'landing',
    title: 'Dark mode permanente por defecto',
    run() {
      const dark = /color-scheme:\s*dark\b/.test(all(styleFiles))
      const hasLight = /prefers-color-scheme:\s*light|\[data-theme=["']light|\.light\b/.test(all(styleFiles))
      return { failed: dark && !hasLight, detail: dark ? (hasLight ? 'oscuro con alternativa clara' : 'sólo oscuro, sin alternativa') : 'no declara esquema oscuro fijo' }
    } },

  { id: 'A3', cat: 'Color', weight: 2, applies: 'ambos',
    title: 'Glassmorphism indiscriminado',
    run() {
      const r = find(/backdrop-filter\s*:/, styleFiles)
      return { failed: r.total >= 4, detail: `${r.total} declaraciones`, samples: r.samples }
    } },

  { id: 'A4', cat: 'Color', weight: 2, applies: 'landing',
    title: 'Resplandor de acento tras el hero',
    run() {
      const r = find(/radial-gradient\(\s*(circle|ellipse)/, styleFiles)
      return { failed: r.total > 0, detail: `${r.total} coincidencias`, samples: r.samples }
    } },

  { id: 'A5', cat: 'Color', weight: 2, applies: 'ambos',
    title: 'Neón sobre oscuro con bordes que brillan',
    run() {
      const r = find(/box-shadow:[^;]*(0\s+0\s+\d{2,}px)[^;]*(#[0-9a-f]{6}|rgba)/i, styleFiles)
      return { failed: r.total >= 3, detail: `${r.total} sombras de resplandor`, samples: r.samples }
    } },

  { id: 'B1', cat: 'Tipografía', weight: 2, applies: 'ambos',
    title: 'Familia por defecto de las herramientas de IA',
    run() {
      const m = all(styleFiles).match(/font-family:\s*["']?(Inter|Poppins|Geist|Space Grotesk|Roboto|Open Sans)\b/i)
      return { failed: !!m, detail: m ? `principal: ${m[1]}` : 'familia no estándar de IA' }
    } },

  { id: 'B2', cat: 'Tipografía', weight: 1, applies: 'landing',
    title: 'Sin pareja tipográfica',
    run() {
      const stacks = new Set([...all(styleFiles).matchAll(/font-family:\s*([^;]+);/g)]
        .map(m => m[1].split(',')[0].trim().replace(/["']/g, '').toLowerCase())
        .filter(s => s && !s.startsWith('var(') && s !== 'inherit'))
      return { failed: stacks.size <= 1, detail: `${stacks.size} familia(s): ${[...stacks].join(', ') || '—'}` }
    } },

  { id: 'B4', cat: 'Tipografía', weight: 1, applies: 'ambos',
    title: 'Etiquetas en mayúsculas por todas partes',
    run() {
      const r = find(/text-transform:\s*uppercase/, styleFiles)
      return { failed: r.total >= 6, detail: `${r.total} declaraciones`, samples: r.samples }
    } },

  { id: 'C1', cat: 'Layout', weight: 3, applies: 'ambos',
    title: 'Borde gris plano de 1px en tarjetas',
    run() {
      const r = find(/border(-\w+)?:\s*1px solid/, styleFiles)
      const radius = find(/border-radius\s*:/, styleFiles).total || 1
      const ratio = r.total / radius
      return { failed: r.total >= 15 && ratio > 0.2,
        detail: `${r.total} bordes planos frente a ${radius} radios (ratio ${ratio.toFixed(2)})`,
        samples: r.samples }
    } },

  { id: 'C2', cat: 'Layout', weight: 2, applies: 'ambos',
    title: 'Franja lateral de color de 3–4px',
    run() {
      const r = find(/border-left:\s*[34]px solid/, styleFiles)
      return { failed: r.total > 0, detail: `${r.total} coincidencias`, samples: r.samples }
    } },

  { id: 'D1', cat: 'Imagen', weight: 3, applies: 'ambos',
    title: 'Enlaces a bancos de imágenes',
    run() {
      const r = find(/(images\.)?(unsplash|pexels|pixabay)\.com/i, files)
      return { failed: r.total > 0, detail: `${r.total} enlaces`, samples: r.samples }
    } },

  { id: 'D5', cat: 'Imagen', weight: 2, applies: 'ambos',
    title: 'Emojis donde correspondería un icono',
    run() {
      const r = find(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, codeFiles)
      return { failed: r.total >= 5, detail: `${r.total} emojis en marcado`, samples: r.samples }
    } },

  { id: 'E1', cat: 'Copy', weight: 2, applies: 'ambos',
    title: 'Abuso del em dash',
    run() {
      const r = find(/—/, codeFiles)
      return { failed: r.total >= 12, detail: `${r.total} em dashes`, samples: r.samples }
    } },

  { id: 'E2', cat: 'Copy', weight: 1, applies: 'ambos',
    title: 'Comillas curvas sin tocar',
    run() {
      const r = find(/[‘’“”]/, codeFiles)
      return { failed: r.total >= 10, detail: `${r.total} comillas tipográficas`, samples: r.samples }
    } },

  { id: 'E4', cat: 'Copy', weight: 3, applies: 'ambos',
    title: 'Copy duplicado literalmente',
    run() {
      const seen = new Map()
      for (const f of codeFiles) {
        for (let i = 0; i < f.lines.length; i++) {
          for (const m of f.lines[i].matchAll(/>([^<>{}]{30,200})<|["'`]([^"'`\n]{30,200})["'`]/g)) {
            const s = (m[1] || m[2] || '').trim()
            if (!esProsa(s)) continue
            if (!seen.has(s)) seen.set(s, [])
            seen.get(s).push({ file: f.rel, line: i + 1, text: s.slice(0, 90) })
          }
        }
      }
      const dups = [...seen.entries()].filter(([, v]) => v.length >= 2)
      return { failed: dups.length > 0,
        detail: `${dups.length} cadena(s) repetida(s)`,
        samples: dups.slice(0, 6).map(([s, v]) => ({ file: v[0].file, line: v[0].line, text: `×${v.length} — "${s.slice(0, 80)}"` })) }
    } },

  { id: 'E5', cat: 'Copy', weight: 2, applies: 'ambos',
    title: 'Densidad de palabras vacías',
    run() {
      const r = find(/\b(seamless|innovador|innovative|leverage|potenciar|sinergia|synergy|end-to-end|revoluciona|delve into|experiencia única|all-in-one|todo en uno)\b/i, codeFiles)
      return { failed: r.total >= 3, detail: `${r.total} apariciones`, samples: r.samples }
    } },

  { id: 'E6', cat: 'Copy', weight: 2, applies: 'ambos',
    title: 'Nombres de relleno',
    run() {
      const r = find(/\b(John Smith|Jane Doe|Sarah Johnson|John Doe|Usuario Demo|[A-ZÁÉÍÓÚ][a-záéíóú]+ (Cliente|Usuario|Demo|Test|Admin|Ejemplo))\b/, codeFiles)
      return { failed: r.total > 0, detail: `${r.total} nombres`, samples: r.samples }
    } },

  { id: 'E7', cat: 'Copy', weight: 3, applies: 'producto',
    title: 'Restos de andamiaje visibles al usuario',
    run() {
      // `placeholder=` es un atributo legítimo de HTML: sólo cuenta como resto de
      // andamiaje cuando aparece como palabra suelta en el texto.
      const r = find(/\b(lorem ipsum|dummy|placeholder(?!\s*=)|\bMVP\b|4242[\s-]?4242|4111[\s-]?1111|5555[\s-]?5555|@example\.com|\.demo\b)/i, codeFiles)
      return { failed: r.total > 0, detail: `${r.total} restos`, samples: r.samples }
    } },

  { id: 'F2', cat: 'Motion', weight: 1, applies: 'ambos',
    title: 'Sin movimiento intencionado',
    run() {
      const kf = find(/@keyframes/, styleFiles).total
      const tr = find(/transition\s*:/, styleFiles).total
      return { failed: kf === 0 && tr <= 2, detail: `${kf} keyframes, ${tr} transiciones` }
    } },
]

/* ─────────────── prueba del cambio de nombre (G1) ─────────────── */

function nameSwap() {
  if (!BRAND) return null
  const brand = BRAND.toLowerCase()
  const candidates = []
  for (const f of codeFiles) {
    for (let i = 0; i < f.lines.length; i++) {
      for (const m of f.lines[i].matchAll(/<h[12][^>]*>([^<]{18,160})<|["'`]([^"'`\n]{18,160})["'`]/g)) {
        const s = (m[1] || m[2] || '').trim()
        if (!esProsa(s)) continue
        if (s.toLowerCase().includes(brand)) continue
        if (!/\b(belleza|servicio|plataforma|experiencia|profesional|reserva|domicilio|solución|calidad|confianza|mejor|futuro|todo)\b/i.test(s)) continue
        candidates.push({ file: f.rel, line: i + 1, text: s.slice(0, 110) })
      }
    }
  }
  const uniq = [...new Map(candidates.map(c => [c.text, c])).values()]
  return { failed: uniq.length > 0, count: uniq.length, samples: uniq.slice(0, 10) }
}

/* ─────────────────────────── ejecución ─────────────────────────── */

const active = CHECKS.filter(c => PROFILE === 'ambos' || c.applies === 'ambos' || c.applies === PROFILE)
const results = active.map(c => {
  let r
  try { r = c.run() } catch (e) { r = { failed: false, detail: 'error: ' + e.message } }
  return { ...c, ...r }
})

const swap = nameSwap()
const maxW = results.reduce((a, r) => a + r.weight, 0) + (swap ? 3 : 0)
const lostW = results.filter(r => r.failed).reduce((a, r) => a + r.weight, 0) + (swap?.failed ? 3 : 0)
const score = maxW ? Math.round(100 * (1 - lostW / maxW)) : 100

const band = score >= 85 ? 'Limpio'
  : score >= 70 ? 'Restos localizados'
  : score >= 50 ? 'Se identificará'
  : 'Se identifica en diez segundos'

if (AS_JSON) {
  console.log(JSON.stringify({
    root: ROOT, profile: PROFILE, brand: BRAND || null, score, band,
    filesScanned: files.length,
    checks: results.map(({ id, cat, title, weight, failed, detail, samples }) =>
      ({ id, cat, title, weight, failed, detail, samples: samples || [] })),
    nameSwap: swap,
  }, null, 2))
} else {
  const failed = results.filter(r => r.failed)
  const passed = results.filter(r => !r.failed)
  console.log(`\n  slop-scan · ${ROOT}`)
  console.log(`  perfil: ${PROFILE} · ${files.length} archivos · ${styleFiles.length} de estilos\n`)
  console.log(`  PUNTUACIÓN  ${score}/100 — ${band}`)
  console.log(`  ${failed.length} de ${results.length} comprobaciones automáticas fallan\n`)

  if (swap) {
    console.log(`  ── Prueba del cambio de nombre (marca: "${BRAND}") ──`)
    if (swap.failed) {
      console.log(`  ✗ ${swap.count} titular(es) que no mencionan la marca y funcionarían para un competidor:`)
      for (const s of swap.samples) console.log(`      ${s.file}:${s.line}  "${s.text}"`)
    } else console.log('  ✓ sin titulares intercambiables detectados')
    console.log('')
  }

  if (failed.length) {
    console.log('  ── Fallan ──')
    for (const r of failed) {
      console.log(`  ✗ ${r.id} · ${r.title}  [peso ${r.weight}]`)
      console.log(`      ${r.detail}`)
      for (const s of (r.samples || []).slice(0, 4)) console.log(`      ${s.file}:${s.line}  ${s.text}`)
    }
    console.log('')
  }
  console.log('  ── Pasan ──')
  for (const r of passed) console.log(`  ✓ ${r.id} · ${r.title} — ${r.detail}`)
  console.log('\n  Las comprobaciones que exigen ojo humano están en templates/revision-humana.md')
  console.log('  Antes de dar un veredicto, lee references/caveats.md\n')
}

if (MIN_SCORE !== null && score < MIN_SCORE) {
  console.error(`slop-scan: ${score} por debajo del umbral ${MIN_SCORE}`)
  process.exit(1)
}
