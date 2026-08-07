#!/usr/bin/env node
// Mide `L3` sobre los proyectos en espanol del corpus.
//
// RESULTADO. 19 humanos ES pre-ChatGPT, 0 generados (marcador de generador e
// interfaz ES no coexisten en GitHub publico). Dispara en 5/19 = 26%, IC95
// 12-49. Premisa falsada; peso 3 -> 1. Sin clase positiva no hay J.
// Evidencia en data/validacion.json (estado premisas_falsada).
//
// LO QUE MIDE. Tasa sobre codigo humano en espanol — la poblacion donde la
// regla podria hacer dano. Una tasa alta ahi es ruido aunque no haya recall.
//
//   node research/l3-espanol.mjs

import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const AQUI = dirname(fileURLToPath(import.meta.url))
const CORPUS = join(AQUI, '.corpus')
const SCAN = join(AQUI, '..', 'scripts', 'slop-scan.mjs')

const idioma = JSON.parse(readFileSync(join(AQUI, 'idioma.json'), 'utf8'))
const espanoles = idioma.espanoles || []

if (!espanoles.length) { console.log('no hay proyectos en espanol detectados'); process.exit(0) }

const filas = []
for (const p of espanoles) {
  const dir = join(CORPUS, p.id)
  if (!existsSync(dir)) continue
  let scan
  try {
    scan = JSON.parse(execFileSync(process.execPath, [SCAN, dir, '--json', '--profile', 'producto'],
      { encoding: 'utf8', maxBuffer: 64e6 }))
  } catch { continue }
  const l3 = scan.checks.find(c => c.id === 'L3')
  filas.push({ id: p.id, clase: p.clase, densidad: p.densidad, dispara: !!l3?.failed, detalle: l3?.detail })
  process.stderr.write('.')
}
process.stderr.write('\n')

const porClase = {}
for (const f of filas) {
  porClase[f.clase] ??= { n: 0, k: 0 }
  porClase[f.clase].n++
  if (f.dispara) porClase[f.clase].k++
}

const wilson = (k, n) => {
  if (!n) return [0, 0]
  const z = 1.96, p = k / n, d = 1 + z * z / n
  const c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)]
}

console.log('\n  L3 sobre proyectos en espanol\n')
for (const [clase, v] of Object.entries(porClase)) {
  const [lo, hi] = wilson(v.k, v.n)
  console.log(`  ${clase.padEnd(12)} dispara en ${v.k}/${v.n} = ${(100 * v.k / v.n).toFixed(0)}%  IC95 [${(lo * 100).toFixed(0)}-${(hi * 100).toFixed(0)}]`)
}
console.log('')
for (const f of filas.filter(x => x.dispara)) console.log(`  x ${f.id}  ${f.detalle}`)
console.log(`\n  Sin clase positiva en espanol no hay J. Esto es tasa sobre codigo humano,`)
console.log('  que acota el dano de la regla pero no prueba que discrimine.\n')

writeFileSync(join(AQUI, 'l3-espanol.json'), JSON.stringify({ porClase, filas }, null, 2) + '\n', 'utf8')
