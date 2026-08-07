#!/usr/bin/env node
// Metrica cuantitativa de genericidad visual, y su validacion contra el corpus.
//
//   node research/genericity.mjs            # valida contra el corpus
//   node research/genericity.mjs <ruta>     # puntua un proyecto suelto
//
// FUNDAMENTO. La literatura de estetica web (Reinecke et al., CHI 2013, 548
// evaluadores sobre 450 sitios) predice la primera impresion a partir de dos
// constructos: COLORFULNESS y COMPLEJIDAD VISUAL. Ambos se miden alli sobre
// capturas de pantalla. Aqui se reconstruyen sobre el codigo fuente, que es lo
// unico que un escaner estatico puede leer:
//
//   colorfulness  -> entropia de la paleta y dispersion de croma en OKLCH
//   complejidad   -> diversidad de escalas: radios, espaciados, tamanos,
//                    familias, y limpieza de escala
//
// A eso se anade la distancia al centroide del corpus generado, que es la
// operacionalizacion directa de "esto se parece al promedio".
//
// EXTRACCION CROSS-STACK. Si las escalas se leyeran solo del CSS, un proyecto
// Tailwind saldria vacio y la metrica estaria midiendo stack. Se extrae de
// ambos: declaraciones CSS y clases de utilidad.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collect, esEstilo } from '../scripts/lib/util.mjs'
import { parseColor, oklch } from '../scripts/lib/color.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))

/* ── escala de Tailwind, para poder comparar entre stacks ── */

const TW_ESPACIO = { '0': 0, '0.5': 2, '1': 4, '1.5': 6, '2': 8, '2.5': 10, '3': 12, '3.5': 14, '4': 16, '5': 20, '6': 24, '7': 28, '8': 32, '9': 36, '10': 40, '11': 44, '12': 48, '14': 56, '16': 64, '20': 80, '24': 96, '28': 112, '32': 128 }
const TW_RADIO = { none: 0, sm: 2, '': 4, md: 6, lg: 8, xl: 12, '2xl': 16, '3xl': 24, full: 9999 }
const TW_TEXTO = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60, '7xl': 72, '8xl': 96, '9xl': 128 }

function extraer(dir) {
  const files = collect(dir)
  if (!files.length) return null
  const style = files.filter(esEstilo)
  const todo = files.map(f => f.text).join('\n')
  const css = style.map(f => f.text).join('\n')

  /* color */
  const colores = []
  for (const m of todo.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]{5,40}\)/g)) {
    const c = parseColor(m[0])
    if (c && c.a > 0.5) colores.push(oklch(c))
  }
  const cromaticos = colores.filter(c => c.C >= 0.03)
  const cubos = new Array(12).fill(0)
  for (const c of cromaticos) cubos[Math.floor(c.H / 30) % 12]++
  const total = cromaticos.length || 1
  let H = 0
  for (const n of cubos) { if (n) { const p = n / total; H -= p * Math.log2(p) } }
  const entropiaTono = H / Math.log2(12) // 0..1
  const cromaMedio = cromaticos.length ? cromaticos.reduce((a, c) => a + c.C, 0) / cromaticos.length : 0
  const cromaDesv = cromaticos.length
    ? Math.sqrt(cromaticos.reduce((a, c) => a + (c.C - cromaMedio) ** 2, 0) / cromaticos.length) : 0

  /* escalas: CSS + utilidades */
  const px = s => { const m = String(s).match(/(-?[\d.]+)\s*(px|rem|em)?/); if (!m) return null
    const v = parseFloat(m[1]); return m[2] === 'rem' || m[2] === 'em' ? v * 16 : v }

  const radios = []
  for (const m of css.matchAll(/border-radius:\s*([^;}]+)/gi)) { const v = px(m[1]); if (v !== null) radios.push(v) }
  for (const m of todo.matchAll(/\brounded(?:-(none|sm|md|lg|xl|2xl|3xl|full))?\b/g)) radios.push(TW_RADIO[m[1] ?? ''] ?? 4)

  const espacios = []
  for (const m of css.matchAll(/(?:padding|margin|gap)(?:-\w+)?:\s*([^;}]+)/gi)) {
    for (const t of m[1].trim().split(/\s+/)) { const v = px(t); if (v !== null) espacios.push(Math.abs(v)) }
  }
  for (const m of todo.matchAll(/\b[pmg][xytrbl]?-(\d+(?:\.\d)?)\b/g)) { const v = TW_ESPACIO[m[1]]; if (v !== undefined) espacios.push(v) }

  const tamanos = []
  for (const m of css.matchAll(/font-size:\s*([^;}]+)/gi)) { const v = px(m[1]); if (v !== null) tamanos.push(v) }
  for (const m of todo.matchAll(/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g)) tamanos.push(TW_TEXTO[m[1]])

  const familias = new Set()
  for (const m of css.matchAll(/font-family:\s*([^;}]+)/gi)) {
    const f = m[1].split(',')[0].trim().replace(/["']/g, '').toLowerCase()
    if (f && !f.startsWith('var(') && f !== 'inherit') familias.add(f)
  }
  for (const m of todo.matchAll(/["'\s](Inter|Poppins|Geist|Roboto|Open Sans|Montserrat|Lato|Playfair Display|Fraunces|Instrument Serif|Space Grotesk|DM Sans|Manrope)["'\s,]/g)) familias.add(m[1].toLowerCase())

  const dominancia = arr => {
    if (arr.length < 8) return null
    const c = {}; for (const v of arr) c[v] = (c[v] || 0) + 1
    return Math.max(...Object.values(c)) / arr.length
  }
  const limpieza = espacios.length >= 8
    ? espacios.filter(v => v % 4 === 0).length / espacios.length : null

  return {
    archivos: files.length,
    entropiaTono, cromaMedio, cromaDesv,
    coloresUnicos: new Set(colores.map(c => `${c.L.toFixed(2)}|${c.C.toFixed(2)}|${(c.H / 15) | 0}`)).size,
    radiosDistintos: new Set(radios).size, radioDominancia: dominancia(radios),
    espaciosDistintos: new Set(espacios).size, espacioDominancia: dominancia(espacios),
    tamanosDistintos: new Set(tamanos).size,
    familias: familias.size,
    limpiezaEscala: limpieza,
  }
}

/* ── vector numerico ── */

const CAMPOS = ['entropiaTono', 'cromaMedio', 'cromaDesv', 'coloresUnicos',
  'radiosDistintos', 'radioDominancia', 'espaciosDistintos', 'espacioDominancia',
  'tamanosDistintos', 'familias', 'limpiezaEscala']

const vector = f => CAMPOS.map(k => (f[k] === null || f[k] === undefined || Number.isNaN(f[k]) ? 0 : f[k]))

/* ── modo proyecto suelto ── */

const posicional = process.argv[2]
if (posicional && !posicional.startsWith('--')) {
  const f = extraer(posicional)
  console.log(JSON.stringify(f, null, 2))
  process.exit(0)
}

/* ── validacion contra el corpus ── */

const corpus = JSON.parse(readFileSync(join(AQUI, 'corpus.json'), 'utf8'))
const muestras = []
for (const e of corpus.entradas) {
  const dir = join(AQUI, '.corpus', e.id)
  if (!existsSync(join(dir, '.listo'))) continue
  const f = extraer(dir)
  if (!f) continue
  muestras.push({ id: e.id, clase: e.clase, f, v: vector(f) })
  process.stderr.write('.')
}
console.error(`\n${muestras.length} proyectos con vector`)

const POS = muestras.filter(m => m.clase === 'pos')
const NEG = muestras.filter(m => m.clase === 'neg_stack')
const NEGC = muestras.filter(m => m.clase === 'neg_classic')

// z-normalizacion sobre todo el corpus
const mu = CAMPOS.map((_, i) => muestras.reduce((a, m) => a + m.v[i], 0) / muestras.length)
const sd = CAMPOS.map((_, i) => {
  const s = Math.sqrt(muestras.reduce((a, m) => a + (m.v[i] - mu[i]) ** 2, 0) / muestras.length)
  return s || 1
})
const z = v => v.map((x, i) => (x - mu[i]) / sd[i])
for (const m of muestras) m.z = z(m.v)

const centroide = grupo => CAMPOS.map((_, i) => grupo.reduce((a, m) => a + m.z[i], 0) / (grupo.length || 1))
const dist = (a, b) => Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0))

// Puntuacion con centroides recalculados EXCLUYENDO la propia muestra.
// Sin esto, cada proyecto contribuye a su propio centroide y el AUC sube solo.
function puntuarLOO(m) {
  const p = centroide(POS.filter(x => x.id !== m.id))
  const n = centroide(NEG.filter(x => x.id !== m.id))
  return dist(m.z, n) - dist(m.z, p) // alto = mas cerca del centroide generado
}
for (const m of muestras) m.G = puntuarLOO(m)

function auc(pos, neg) {
  let mejor = 0, empates = 0
  for (const a of pos) for (const b of neg) { if (a.G > b.G) mejor++; else if (a.G === b.G) empates++ }
  const total = pos.length * neg.length
  return total ? (mejor + empates / 2) / total : 0.5
}

const aucStack = auc(POS, NEG)
const aucClassic = auc(POS, NEGC)

/* CONTROL DE TAMANO. Los tres rasgos que mas separan —radios, espacios y
   tamanos DISTINTOS— son conteos, y un conteo de valores distintos crece con el
   numero de archivos. Sin restringir a la banda de solapamiento, la metrica
   estaria midiendo lo mismo que ya contaminaba las reglas. */
const BANDA = { min: 20, max: 200 }
const enBanda = m => m.f.archivos >= BANDA.min && m.f.archivos < BANDA.max
const POS_B = POS.filter(enBanda), NEG_B = NEG.filter(enBanda)
const aucBanda = auc(POS_B, NEG_B)

// Intervalo de confianza del AUC (Hanley y McNeil, 1982). Con n de dos digitas
// un AUC puntual sin intervalo no autoriza a concluir nada.
function icAuc(A, n1, n2) {
  if (!n1 || !n2) return [0, 1]
  const Q1 = A / (2 - A), Q2 = 2 * A * A / (1 + A)
  const se = Math.sqrt((A * (1 - A) + (n1 - 1) * (Q1 - A * A) + (n2 - 1) * (Q2 - A * A)) / (n1 * n2))
  return [Math.max(0, A - 1.96 * se), Math.min(1, A + 1.96 * se)]
}
const icBanda = icAuc(aucBanda, POS_B.length, NEG_B.length)

const aucRasgoBanda = i => {
  let mejor = 0, empates = 0
  for (const a of POS_B) for (const b of NEG_B) { if (a.v[i] > b.v[i]) mejor++; else if (a.v[i] === b.v[i]) empates++ }
  const t = POS_B.length * NEG_B.length
  return t ? (mejor + empates / 2) / t : 0.5
}

// Discriminacion univariante de cada rasgo, tambien por AUC.
const aucRasgo = i => {
  let mejor = 0, empates = 0
  for (const a of POS) for (const b of NEG) { if (a.v[i] > b.v[i]) mejor++; else if (a.v[i] === b.v[i]) empates++ }
  const t = POS.length * NEG.length
  return t ? (mejor + empates / 2) / t : 0.5
}
const rasgos = CAMPOS.map((k, i) => ({
  campo: k, auc: aucRasgo(i), auc_banda: aucRasgoBanda(i),
  separacion: Math.abs(aucRasgo(i) - 0.5) * 2,
  separacion_banda: Math.abs(aucRasgoBanda(i) - 0.5) * 2,
})).sort((a, b) => b.separacion_banda - a.separacion_banda)

const salida = {
  _meta: {
    fundamento: 'Reinecke et al. CHI 2013 (colorfulness + complejidad visual), reconstruido sobre codigo fuente',
    n: { pos: POS.length, neg_stack: NEG.length, neg_classic: NEGC.length },
    validacion: 'AUC con centroides leave-one-out',
  },
  auc: {
    pos_vs_neg_stack: aucStack,
    pos_vs_neg_classic: aucClassic,
    pos_vs_neg_stack_banda: aucBanda,
    ic95_banda: icBanda,
    n_banda: { pos: POS_B.length, neg: NEG_B.length },
  },
  rasgos,
  muestras: muestras.map(({ id, clase, G, f }) => ({ id, clase, G, ...f })),
}
writeFileSync(join(AQUI, 'genericidad.json'), JSON.stringify(salida, null, 2), 'utf8')

console.log(`\n  AUC pos vs neg_stack (sin control de tamano):  ${aucStack.toFixed(3)}`)
console.log(`  AUC pos vs neg_classic (con confundido):       ${aucClassic.toFixed(3)}`)
console.log(`  AUC en banda ${BANDA.min}-${BANDA.max} archivos (pos=${POS_B.length} neg=${NEG_B.length}):  ${aucBanda.toFixed(3)}`)
console.log(`  IC95 del AUC en banda (Hanley-McNeil):         [${icBanda[0].toFixed(3)}, ${icBanda[1].toFixed(3)}]`)
console.log(`  ${icBanda[0] <= 0.5 ? '=> el intervalo toca 0.5: NO se puede afirmar separacion' : '=> separacion significativa'}\n`)
console.log('  Discriminacion univariante por rasgo:')
console.log('  campo                   AUC    AUC_banda   sep_banda')
for (const r of rasgos) console.log(`  ${r.campo.padEnd(22)} ${r.auc.toFixed(3)}    ${r.auc_banda.toFixed(3)}       ${r.separacion_banda.toFixed(3)}`)
console.log('\n  AUC 0.5 = azar. Guardado en research/genericidad.json\n')
