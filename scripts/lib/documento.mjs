// Análisis de documento HTML sin browser.
// Es el modo por defecto de slop-visual: siempre produce un informe accionable
// sobre archivos .html del árbol (estructura, a11y, landmarks). Playwright,
// si existe, solo AÑADE screenshot y re-chequeo en DOM vivo.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

function listHtml(root, acc = [], base = root) {
  let entries = []
  try { entries = readdirSync(root) } catch { return acc }
  for (const name of entries) {
    if (name === 'node_modules' || name === '.git' || name === '.slop') continue
    const p = join(root, name)
    let st
    try { st = statSync(p) } catch { continue }
    if (st.isDirectory()) listHtml(p, acc, base)
    else if (/\.html?$/i.test(name)) acc.push(p)
  }
  return acc
}

function stripScripts(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<!--[\s\S]*?-->/g, '')
}

/**
 * Analiza un HTML como documento (sin ejecutar JS).
 */
export function analizarHtml(html, { rel = 'index.html' } = {}) {
  const text = stripScripts(html)
  const hallazgos = []
  const samples = (id, msg, extra = {}) => hallazgos.push({ id, title: msg, failed: true, file: rel, ...extra })

  const lang = (text.match(/<html[^>]*\blang\s*=\s*["']([^"']+)["']/i) || [])[1] || ''
  if (!/<html\b/i.test(text)) {
    // fragmento: no exigir lang de documento
  } else if (!lang) {
    samples('V1', 'html sin atributo lang')
  }

  const title = (text.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1]?.trim() || ''
  if (/<html\b/i.test(text) && title.length < 3) samples('V5', 'title ausente o vacío')

  // imgs sin alt
  let imgsSinAlt = 0
  for (const m of text.matchAll(/<img\b([^>]*)>/gi)) {
    const a = m[1] || ''
    if (/\balt\s*=/i.test(a)) continue
    if (/aria-hidden\s*=\s*["']true["']/i.test(a)) continue
    imgsSinAlt++
  }
  if (imgsSinAlt) samples('V2', `${imgsSinAlt} img sin alt`, { count: imgsSinAlt })

  // botones vacíos
  let botonesVacios = 0
  for (const m of text.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)) {
    const attrs = m[1] || '', inner = m[2] || ''
    if (/aria-label\s*=|title\s*=/i.test(attrs)) continue
    const t = inner.replace(/<[^>]+>/g, '').trim()
    if (t.length < 1 && !/<svg/i.test(inner)) botonesVacios++
    if (t.length < 1 && /<svg/i.test(inner) && !/aria-label|title=/i.test(attrs)) botonesVacios++
  }
  if (botonesVacios) samples('V3', `${botonesVacios} button sin nombre accesible`, { count: botonesVacios })

  // h1
  const h1 = [...text.matchAll(/<h1\b/gi)].length
  if (/<html\b/i.test(text) && h1 === 0) samples('V4', 'documento sin h1')
  if (h1 > 1) samples('V6', `${h1} elementos h1 (se espera 1)`, { count: h1 })

  // saltos de heading
  const hs = [...text.matchAll(/<h([1-6])\b/gi)].map(m => +m[1])
  let prev = 0, saltos = 0
  for (const n of hs) {
    if (prev && n > prev + 1) saltos++
    prev = n
  }
  if (saltos) samples('V7', `${saltos} salto(s) de nivel en headings`)

  // main landmark
  const main = /<main\b/i.test(text)
  if (/<html\b/i.test(text) && !main) samples('V8', 'documento sin <main>')

  // labels en inputs
  let inputsSinLabel = 0
  for (const m of text.matchAll(/<input\b([^>]*)>/gi)) {
    const a = m[1] || ''
    if (/type\s*=\s*["']hidden["']/i.test(a)) continue
    if (/aria-label\s*=|aria-labelledby\s*=|title\s*=/i.test(a)) continue
    const id = (a.match(/\bid\s*=\s*["']([^"']+)["']/i) || [])[1]
    if (id && new RegExp(`<label[^>]+for=["']${id}["']`, 'i').test(text)) continue
    // input dentro de label
    inputsSinLabel++
  }
  // reducir FP: si no hay forms, no contar
  if (/<form\b/i.test(text) && inputsSinLabel > 0) {
    samples('V9', `${inputsSinLabel} input en formulario sin label/aria-label detectable`, { count: inputsSinLabel })
  }

  // outline estructura
  const outline = hs.map((n, i) => `${'#'.repeat(n)} h${n}`).slice(0, 20)

  const failed = hallazgos.filter(h => h.failed).length
  return {
    file: rel,
    lang: lang || null,
    title: title || null,
    h1,
    outline,
    main,
    hallazgos,
    fallan: failed,
    ok: failed === 0,
  }
}

/**
 * Escanea un directorio o archivo HTML.
 */
export function analizarArbolHtml(root) {
  const rutas = existsSync(root) && /\.html?$/i.test(root)
    ? [root]
    : listHtml(root)
  const docs = []
  for (const p of rutas) {
    let html
    try { html = readFileSync(p, 'utf8') } catch { continue }
    const rel = relative(root, p).replace(/\\/g, '/') || p
    docs.push(analizarHtml(html, { rel: rel.startsWith('..') ? p : rel }))
  }
  const fallan = docs.reduce((s, d) => s + d.fallan, 0)
  return {
    engine: 'document',
    nDocumentos: docs.length,
    docs,
    fallan,
    ok: docs.length > 0 && fallan === 0,
    limite: docs.length
      ? 'Análisis de HTML estático (sin ejecutar JS ni layout). Playwright añade screenshot si está instalado.'
      : 'No hay .html en el árbol — nada que analizar en modo documento.',
  }
}
