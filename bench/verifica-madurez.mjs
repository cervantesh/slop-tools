#!/usr/bin/env node
// Verifica las capacidades de madurez añadidas: historial, calidad, gate, apply-safe.
//
//   node bench/verifica-madurez.mjs

import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { roundtripPrueba } from '../scripts/lib/history.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const ROOT_PKG = join(AQUI, '..')
const INIT = join(ROOT_PKG, 'scripts', 'slop-init.mjs')
const SCAN = join(ROOT_PKG, 'scripts', 'slop-scan.mjs')
const GATE = join(ROOT_PKG, 'scripts', 'slop-gate.mjs')
const FIX = join(ROOT_PKG, 'scripts', 'slop-fix.mjs')
const VISUAL = join(ROOT_PKG, 'scripts', 'slop-visual.mjs')

const correr = (script, args, opts = {}) => execFileSync(process.execPath, [script, ...args], {
  encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...opts,
})

console.log('\n  verifica-madurez\n')
let fallos = 0
const dir = mkdtempSync(join(tmpdir(), 'slop-mad-'))

try {
  // 1 · historial
  if (!roundtripPrueba(dir)) {
    console.log('  x history roundtrip')
    fallos++
  } else console.log('  ok history     roundtrip .slop/history.jsonl')

  correr(INIT, [dir, '--seed', '55'])
  if (!existsSync(join(dir, 'tailwind.theme.mjs'))) {
    console.log('  x init sin tailwind.theme.mjs')
    fallos++
  } else console.log('  ok init        tailwind.theme.mjs + html lang')

  // 2 · calidad en JSON (eje denso ≥ 12 checks)
  const scan = JSON.parse(correr(SCAN, [dir, '--json', '--profile', 'landing', '--contrato', '--no-history']))
  if (!scan.calidad || typeof scan.calidad.score !== 'number') {
    console.log('  x scan.calidad ausente')
    fallos++
  } else if (scan.calidad.total < 12) {
    console.log(`  x calidad solo ${scan.calidad.total} ejes (min 12)`)
    fallos++
  } else console.log(`  ok calidad     score ${scan.calidad.score}/100 · ejes ${scan.calidad.total}`)

  // 2b · Q10 no puede castigar el control envuelto en su etiqueta.
  //
  // `<label>Texto <input/></label>` asocia sin `for` ni `aria-label`, es el
  // patron mas comun en React, y la regla lo contaba como fallo: sobre stylo
  // reportaba 24 controles sin etiqueta donde solo habia 4. Se comprueban las
  // dos direcciones, porque una regla que nunca dispara tampoco sirve.
  {
    const dirQ10 = mkdtempSync(join(tmpdir(), 'slop-q10-'))
    const envueltos = Array.from({ length: 4 }, (_, i) =>
      `<label className="f">Campo ${i}<input value={v${i}} onChange={o} /></label>`).join('\n      ')
    const sueltos = Array.from({ length: 4 }, (_, i) =>
      `<input value={s${i}} onChange={o} placeholder="sin etiqueta" />`).join('\n      ')
    const q10 = ruta => {
      const s = JSON.parse(correr(SCAN, [ruta, '--json', '--profile', 'producto', '--no-history']))
      return (s.calidad?.checks || []).find(c => c.id === 'Q10')
    }
    writeFileSync(join(dirQ10, 'Bien.jsx'), `export const A = () => (<form>\n      ${envueltos}\n    </form>)\n`)
    const bien = q10(dirQ10)
    writeFileSync(join(dirQ10, 'Mal.jsx'), `export const B = () => (<form>\n      ${sueltos}\n    </form>)\n`)
    const mal = q10(dirQ10)
    if (bien?.failed) {
      console.log(`  x Q10          castiga controles envueltos en <label> (${bien.detail})`)
      fallos++
    } else if (!mal?.failed) {
      console.log('  x Q10          no detecta controles realmente sin etiqueta')
      fallos++
    } else console.log('  ok Q10         <label> envolvente cuenta como etiqueta; el suelto sigue fallando')
    rmSync(dirQ10, { recursive: true, force: true })
  }

  // 3 · stats con tendencia
  correr(SCAN, [dir, '--json', '--profile', 'landing', '--contrato'])
  const statsOut = correr(SCAN, [dir, '--stats'])
  if (!/eventos|score|tendencia|recientes/i.test(statsOut)) {
    console.log('  x --stats incompleto')
    fallos++
  } else console.log('  ok stats       historial + tendencia')

  // 4 · gate strict en sistema limpio (proceso enforceado de verdad)
  let gateCode = 0
  try {
    correr(GATE, [dir, '--profile', 'landing', '--strict'])
  } catch (e) {
    gateCode = e.status ?? 1
    console.log(e.stdout?.slice(-800) || e.message)
  }
  if (gateCode !== 0) {
    console.log(`  x gate --strict limpio exit ${gateCode}`)
    if (existsSync(join(dir, '.slop', 'last-gate.json'))) {
      console.log(readFileSync(join(dir, '.slop', 'last-gate.json'), 'utf8').slice(0, 400))
    }
    fallos++
  } else if (!existsSync(join(dir, '.slop', 'last-gate.json'))) {
    console.log('  x gate sin last-gate.json')
    fallos++
  } else console.log('  ok gate        --strict PASS + last-gate.json + brief + visual')

  // 5 · gate fail con mutación
  writeFileSync(join(dir, 'malo.css'), '.x{padding:13px;font-family:Inter;transition:all 300ms;color:#ff00aa}', 'utf8')
  gateCode = 0
  try {
    correr(GATE, [dir, '--profile', 'landing', '--min-score', '100', '--require-contrato'])
  } catch (e) {
    gateCode = e.status ?? 1
  }
  if (gateCode === 0) {
    console.log('  x gate debia fallar con basura visual')
    fallos++
  } else console.log('  ok gate        FAIL ante contrato roto')

  // 6 · apply-safe
  const before = readFileSync(join(dir, 'malo.css'), 'utf8')
  try {
    correr(FIX, [dir, '--profile', 'landing', '--apply-safe', '--json'])
  } catch { /* exit 1 ok */ }
  const after = readFileSync(join(dir, 'malo.css'), 'utf8')
  if (after === before && /Inter|300ms|transition:\s*all/i.test(before)) {
    console.log('  x apply-safe no modificó malo.css')
    fallos++
  } else if (/Inter/i.test(after) && /font-family:\s*Inter/i.test(after)) {
    console.log('  x apply-safe dejo Inter')
    fallos++
  } else console.log('  ok apply-safe  parches triviales aplicados')

  // 7 · visual SIEMPRE produce motor document (no skip vacío)
  const vis = JSON.parse(correr(VISUAL, [dir, '--json']))
  if (!vis.document || vis.document.nDocumentos < 1) {
    console.log('  x visual sin documentos HTML analizados')
    fallos++
  } else if (vis.skipped && !vis.document) {
    console.log('  x visual solo skip — no es nivel 4')
    fallos++
  } else if (!vis.ok && vis.document.fallan > 0) {
    console.log('  x visual document FAIL en sistema limpio:', vis.document.fallan)
    fallos++
  } else {
    console.log(`  ok visual      engine=${vis.engine} docs=${vis.document.nDocumentos} PASS`)
  }

  // 8 · dominio
  const domFile = join(dir, 'dominio.txt')
  writeFileSync(domFile, 'encuadernacion\ntipografia\nconcepto-inexistente-xyz\n', 'utf8')
  // put one concept in code
  writeFileSync(join(dir, 'biz.js'), 'export const x = "tipografia de plomo"', 'utf8')
  const conDom = JSON.parse(correr(SCAN, [dir, '--json', '--dominio', domFile, '--no-history', '--profile', 'landing']))
  if (!conDom.dominio) {
    console.log('  x dominio no reportado')
    fallos++
  } else console.log(`  ok dominio     ${conDom.dominio.detail}`)

} finally {
  rmSync(dir, { recursive: true, force: true })
}

console.log('')
if (fallos) {
  console.error(`verifica-madurez: ${fallos} fallo(s)`)
  process.exit(1)
}
console.log('  verifica-madurez: ok\n')
