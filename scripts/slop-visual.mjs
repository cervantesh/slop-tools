#!/usr/bin/env node
// slop-visual — capa de render OPCIONAL.
//
// Madurez honesta: el núcleo de slop-tools es estático. Si Playwright está
// instalado en el entorno, abre la URL o el HTML local, captura screenshot y
// corre chequeos de a11y ligeros en el DOM renderizado (lang, imágenes sin alt,
// botones sin nombre). Si no hay Playwright, sale 0 con informe "skipped" —
// no finge un browser.
//
//   node scripts/slop-visual.mjs <ruta-html-o-url> [--out dir] [--json]

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { fileURLToPath } from 'node:url'

const argv = process.argv.slice(2)
const has = n => argv.includes(n)
const flag = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined }
const target = argv.find(a => !a.startsWith('--')) || '.'
const OUT = resolve(flag('--out') || join(process.cwd(), '.slop', 'visual'))
const AS_JSON = has('--json')

async function main() {
  let playwright
  try {
    playwright = await import('playwright')
  } catch {
    const skip = {
      ok: true,
      skipped: true,
      motivo: 'Playwright no instalado. npm i -D playwright && npx playwright install chromium',
      limite: 'Sin browser, usa slop-scan (a11y estática Q1–Q8). Este binario es opt-in.',
    }
    if (AS_JSON) console.log(JSON.stringify(skip, null, 2))
    else {
      console.log('\n  slop-visual · SKIPPED\n')
      console.log(`  ${skip.motivo}`)
      console.log(`  ${skip.limite}\n`)
    }
    process.exit(0)
  }

  const { chromium } = playwright
  let url = target
  if (!/^https?:/i.test(target)) {
    const p = resolve(target)
    const html = existsSync(p) && p.endsWith('.html') ? p
      : existsSync(join(p, 'index.html')) ? join(p, 'index.html')
      : null
    if (!html) {
      console.error('slop-visual: pasa una URL o un directorio con index.html')
      process.exit(2)
    }
    url = pathToFileURL(html).href
  }

  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => page.goto(url))
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
    const h1 = document.querySelectorAll('h1').length
    return { lang, imgsSinAlt: imgs, botonesSinNombre: botones, h1, title: document.title }
  })

  await browser.close()

  const hallazgos = []
  if (!dom.lang) hallazgos.push({ id: 'V1', title: 'html sin lang', failed: true })
  if (dom.imgsSinAlt > 0) hallazgos.push({ id: 'V2', title: `${dom.imgsSinAlt} img sin alt`, failed: true })
  if (dom.botonesSinNombre > 0) hallazgos.push({ id: 'V3', title: `${dom.botonesSinNombre} button sin nombre`, failed: true })
  if (dom.h1 !== 1) hallazgos.push({ id: 'V4', title: `h1 count=${dom.h1} (esperado 1)`, failed: dom.h1 === 0 })

  const report = {
    ok: hallazgos.filter(h => h.failed).length === 0,
    skipped: false,
    url,
    screenshot: shot,
    dom,
    hallazgos,
    limite: 'No es Lighthouse ni APCA. Solo DOM renderizado + screenshot.',
  }
  writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2) + '\n')

  if (AS_JSON) console.log(JSON.stringify(report, null, 2))
  else {
    console.log(`\n  slop-visual · ${url}`)
    console.log(`  screenshot ${shot}`)
    console.log(`  lang=${dom.lang || '(vacío)'} · img sin alt=${dom.imgsSinAlt} · botones sin nombre=${dom.botonesSinNombre} · h1=${dom.h1}`)
    for (const h of hallazgos) console.log(`  ${h.failed ? 'x' : 'ok'} ${h.id} · ${h.title}`)
    console.log(`  ${report.limite}\n`)
  }
  process.exit(report.ok ? 0 : 1)
}

main().catch(e => {
  console.error('slop-visual:', e.message)
  process.exit(2)
})
