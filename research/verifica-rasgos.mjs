#!/usr/bin/env node
// Comprueba que scripts/lib/rasgos.mjs produce EXACTAMENTE el mismo vector de
// once campos que el que se midio sobre el corpus.
//
// Importa porque data/genericidad-modelo.json —normalizacion y centroides— se
// ajusto sobre esas cifras. Si el escaner extrajera de otra forma, G estaria
// situando el proyecto en un espacio distinto del que define el modelo, y el
// percentil no significaria nada.
//
// Complementa a verifica-escala.mjs, que vigila el subconjunto del que depende
// el umbral de C4.
//
//   node research/verifica-rasgos.mjs [n]

import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collect } from '../scripts/lib/util.mjs'
import { rasgos, CAMPOS } from '../scripts/lib/rasgos.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const CORPUS = join(AQUI, '.corpus')
const REF = join(AQUI, 'genericidad.json')
const N = Number(process.argv[2] || 10)

if (!existsSync(REF)) { console.log('verifica-rasgos: falta genericidad.json'); process.exit(0) }
if (!existsSync(CORPUS)) {
  console.log('verifica-rasgos: corpus no reconstruido (node research/fetch-corpus.mjs). Nada que comparar.')
  process.exit(0)
}

const ref = JSON.parse(readFileSync(REF, 'utf8')).muestras
let comparados = 0, difieren = 0

for (const m of ref) {
  if (comparados >= N) break
  const dir = join(CORPUS, m.id)
  if (!existsSync(dir)) continue
  const f = rasgos(collect(dir))
  if (!f) continue
  comparados++
  for (const k of CAMPOS) {
    const mio = f[k] ?? 0
    const suyo = m[k] ?? 0
    if (Math.abs(mio - suyo) > 1e-9) {
      difieren++
      console.log(`  DIFIERE  ${m.id}  ${k}: esperado ${suyo}, obtenido ${mio}`)
    }
  }
}

console.log(`verifica-rasgos: ${comparados} proyecto(s) x ${CAMPOS.length} campos · ${difieren} discrepancia(s)`)
if (difieren) {
  console.error('El extractor de rasgos ya no coincide con el que ajusto el modelo de genericidad.')
  console.error('Regenera el modelo con research/exporta-modelo.mjs o revierte el cambio.')
  process.exit(1)
}
