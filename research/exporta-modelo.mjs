#!/usr/bin/env node
// Deriva data/genericidad-modelo.json desde las muestras ya medidas.
//
// El escaner no puede llevar el corpus encima: necesita solo la normalizacion
// (mu, sd), los dos centroides y la distribucion de G en la banda para poder
// situar un proyecto nuevo en un percentil.
//
//   node research/exporta-modelo.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CAMPOS, vector } from '../scripts/lib/rasgos.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const g = JSON.parse(readFileSync(join(AQUI, 'genericidad.json'), 'utf8'))
const muestras = g.muestras

const vs = muestras.map(m => ({ ...m, v: vector(m) }))
const mu = CAMPOS.map((_, i) => vs.reduce((a, m) => a + m.v[i], 0) / vs.length)
const sd = CAMPOS.map((_, i) => {
  const s = Math.sqrt(vs.reduce((a, m) => a + (m.v[i] - mu[i]) ** 2, 0) / vs.length)
  return s || 1
})
const z = v => v.map((x, i) => (x - mu[i]) / sd[i])
for (const m of vs) m.z = z(m.v)

const centroide = grupo => CAMPOS.map((_, i) => grupo.reduce((a, m) => a + m.z[i], 0) / (grupo.length || 1))
const POS = vs.filter(m => m.clase === 'pos')
const NEG = vs.filter(m => m.clase === 'neg_stack')

// Distribucion de G en la banda, para poder dar percentil.
const enBanda = m => m.archivos >= 20 && m.archivos < 200
const gs = vs.filter(enBanda).map(m => m.G).filter(x => typeof x === 'number').sort((a, b) => a - b)

const modelo = {
  _meta: {
    origen: 'research/genericidad.json',
    campos: CAMPOS,
    n: { total: vs.length, pos: POS.length, neg_stack: NEG.length },
    auc_banda: g.auc.pos_vs_neg_stack_banda,
    ic95_banda: g.auc.ic95_banda,
    advertencia: 'El limite inferior del IC roza 0,5. La metrica NO puntua: se reporta como descriptivo.',
  },
  mu, sd,
  centroidePos: centroide(POS),
  centroideNeg: centroide(NEG),
  distribucionBanda: gs,
}

const destino = join(AQUI, '..', 'data', 'genericidad-modelo.json')
writeFileSync(destino, JSON.stringify(modelo, null, 2) + '\n', 'utf8')
console.log(`modelo escrito · ${vs.length} muestras · ${gs.length} en banda · AUC ${modelo._meta.auc_banda.toFixed(3)}`)
