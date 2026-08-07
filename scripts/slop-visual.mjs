#!/usr/bin/env node
// slop-visual — capa de documento + render opcional.
//
// SIEMPRE corre el motor `document` (HTML estático del árbol): lang, h1, alt,
// labels, landmarks, outline. Eso es el nivel productivo sin dependencias.
//
// Si Playwright está instalado, AÑADE screenshot y re-chequeo en DOM vivo.
// Si no, no "skips" el trabajo: reporta document mode (antes se salía vacío).
//
//   node scripts/slop-visual.mjs <ruta|url> [--out dir] [--json] [--fail]

import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { analizarArbolHtml } from './lib/documento.mjs'

const argv = process.argv.slice(2)
const has = n => argv.includes(n)
const flag = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined }
const target = argv.find(a => !a.startsWith('--') && argv[argv.indexOf(a) - 1] !== '--out') || '.'
const OUT = resolve(flag('--out') || join(resolve(target.startsWith('http') ? process.cwd() : target), '.slop', 'visual'))
const AS_JSON = has('--json')
const FAIL = has('--fail')

async function main() {
  mkdirSync(OUT, { recursive: true })
  const report = {
    ts: new Date().toISOString(),
    target,
    document: null,
    playwright: null,
    ok: false,
  }

  // ── motor document (siempre, si no es URL remota) ──
  if (!/^https?:/i.test(target)) {
    const root = resolve(target)
    report.document = analizarArbolHtml(root)
  } else {
    report.document = {
      engine: 'document',
      nDocumentos: 0,
      docs: [],
      fallan: 0,
      ok: true,
      limite: 'URL remota: el motor document no aplica; se intenta Playwright.',
    }
  }

  // ── Playwright opcional ──
  let playwright
  try {
    playwright = await import('playwright')
  } catch {
    report.playwright = { available: false, skipped: true, motivo: 'paquete playwright no instalado' }
  }

  if (playwright) {
    try {
      const { chromium } = playwright
      let url = target
      if (!/^https?:/i.test(target)) {
        const p = resolve(target)
        const html = existsSync(join(p, 'index.html')) ? join(p, 'index.html')
          : existsSync(p) && /\.html?$/i.test(p) ? p : null
        if (!html) throw new Error('sin index.html para Playwright')
        url = pathToFileURL(html).href
      }
      const browser = await chromium.launch({ headless: true })
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 })
      const shot = join(OUT, 'screenshot.png')
      await page.screenshot({ path: shot, fullPage: true })
      const dom = await page.evaluate(() => {
        const lang = document.documentElement.lang || ''
        const imgs = [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt') && i.getAttribute('aria-hidden') !== 'true').length
        const botones = [...document.querySelectorAll('button')].filter(b => {
          const t = (b.innerText || '').trim()
          const ar = b.getAttribute('aria-label') || b.getAttribute('title')
          return t.length < 1 && !ar
        }).length
        return { lang, imgsSinAlt: imgs, botonesSinNombre: botones, h1: document.querySelectorAll('h1').length, title: document.title }
      })
      await browser.close()
      const hall = []
      if (!dom.lang) hall.push({ id: 'PV1', title: 'lang vacío en DOM vivo', failed: true })
      if (dom.imgsSinAlt) hall.push({ id: 'PV2', title: `${dom.imgsSinAlt} img sin alt (DOM)`, failed: true })
      if (dom.botonesSinNombre) hall.push({ id: 'PV3', title: `${dom.botonesSinNombre} button sin nombre (DOM)`, failed: true })
      report.playwright = {
        available: true, skipped: false, url, screenshot: shot, dom,
        hallazgos: hall, fallan: hall.length, ok: hall.length === 0,
      }
    } catch (e) {
      report.playwright = { available: true, skipped: true, motivo: e.message }
    }
  }

  // ok global: document debe pasar si hubo docs; playwright solo suma si corrió
  const docOk = !report.document || report.document.nDocumentos === 0
    ? (report.playwright && !report.playwright.skipped ? report.playwright.ok : report.document?.nDocumentos === 0)
    : report.document.ok
  const pwOk = !report.playwright || report.playwright.skipped || report.playwright.ok
  report.ok = Boolean(docOk && pwOk)
  report.engine = report.playwright && !report.playwright.skipped
    ? 'document+playwright'
    : 'document'

  writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2) + '\n', 'utf8')

  if (AS_JSON) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(`\n  slop-visual · ${target}`)
    console.log(`  motor ${report.engine} · out ${OUT}`)
    if (report.document) {
      console.log(`  document: ${report.document.nDocumentos} html · fallan ${report.document.fallan} · ${report.document.ok ? 'ok' : 'FAIL'}`)
      for (const d of report.document.docs || []) {
        for (const h of d.hallazgos || []) {
          if (h.failed) console.log(`    x ${h.id} · ${d.file}: ${h.title}`)
        }
      }
      if (report.document.limite) console.log(`  ${report.document.limite}`)
    }
    if (report.playwright?.available && !report.playwright.skipped) {
      console.log(`  playwright: screenshot ${report.playwright.screenshot} · ${report.playwright.ok ? 'ok' : 'FAIL'}`)
    } else if (report.playwright?.skipped) {
      console.log(`  playwright: no usado (${report.playwright.motivo})`)
    }
    console.log(`  veredicto ${report.ok ? 'PASS' : 'FAIL'}\n`)
  }

  if (FAIL && !report.ok) process.exit(1)
  // sin --fail: exit 0 tras informe (CI usa --fail o gate)
  process.exit(0)
}

main().catch(e => {
  console.error('slop-visual:', e.message)
  process.exit(2)
})
