#!/usr/bin/env node
// Comprueba que scripts/lib/escala.mjs cuenta EXACTAMENTE igual que la
// extraccion que produjo genericidad.json.
//
// Importa porque el umbral de la regla C4 (espaciados distintos >= 14) se
// ajusto sobre esas cifras. Si el escaner contara de otra forma, el umbral no
// significaria nada y la regla estaria midiendo otra cosa.
//
//   node research/verifica-escala.mjs [n]
//
// Sale con 1 si alguna cifra difiere. Si el corpus no esta reconstruido, avisa
// y sale con 0: no es un fallo, es que no hay nada que comparar.

import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collect, esEstilo } from '../scripts/lib/util.mjs'
import { escalas } from '../scripts/lib/escala.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const CORPUS = join(AQUI, '.corpus')
const REF = join(AQUI, 'genericidad.json')
const N = Number(process.argv[2] || 12)

if (!existsSync(REF)) { console.log('verifica-escala: falta genericidad.json'); process.exit(0) }
if (!existsSync(CORPUS)) {
  console.log('verifica-escala: corpus no reconstruido (node research/fetch-corpus.mjs). Nada que comparar.')
  process.exit(0)
}

const ref = JSON.parse(readFileSync(REF, 'utf8')).muestras
let comparados = 0, difieren = 0

for (const m of ref) {
  if (comparados >= N) break
  const dir = join(CORPUS, m.id)
  if (!existsSync(dir)) continue
  const files = collect(dir)
  if (!files.length) continue
  const css = files.filter(esEstilo).map(f => f.text).join('\n')
  const todo = files.map(f => f.text).join('\n')
  const { radios, espacios, tamanos } = escalas(css, todo)

  const mio = {
    espaciosDistintos: new Set(espacios).size,
    radiosDistintos: new Set(radios).size,
    tamanosDistintos: new Set(tamanos).size,
  }
  comparados++
  for (const k of Object.keys(mio)) {
    if (mio[k] !== m[k]) {
      difieren++
      console.log(`  DIFIERE  ${m.id}  ${k}: esperado ${m[k]}, obtenido ${mio[k]}`)
    }
  }
}

console.log(`verifica-escala: ${comparados} proyecto(s) comparados · ${difieren} discrepancia(s)`)
if (difieren) {
  console.error('El extractor del escaner ya no cuenta como el que midio el corpus.')
  console.error('El umbral de C4 deja de ser valido hasta remedir.')
  process.exit(1)
}
