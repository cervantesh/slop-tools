// Vector de rasgos visuales de un proyecto: los once campos con los que se
// mide la genericidad.
//
// Mismo compromiso que escala.mjs: esta es la UNICA definicion. El modelo de
// genericidad (`data/genericidad-modelo.json`) se ajusto sobre las cifras que
// produce este extractor, asi que contar de otra forma invalida el modelo.
// `research/verifica-rasgos.mjs` comprueba que sigue coincidiendo con las
// cifras almacenadas del corpus.
//
// FUNDAMENTO. La literatura de estetica web (Reinecke et al., CHI 2013)
// predice la primera impresion con dos constructos —colorfulness y complejidad
// visual— medidos alli sobre capturas. Aqui se reconstruyen sobre el codigo,
// que es lo unico que un escaner estatico puede leer.

import { esEstilo } from './util.mjs'
import { parseColor, oklch } from './color.mjs'
import { escalas, dominancia } from './escala.mjs'

export const CAMPOS = ['entropiaTono', 'cromaMedio', 'cromaDesv', 'coloresUnicos',
  'radiosDistintos', 'radioDominancia', 'espaciosDistintos', 'espacioDominancia',
  'tamanosDistintos', 'familias', 'limpiezaEscala']

export const FAMILIAS_CONOCIDAS = /["'\s](Inter|Poppins|Geist|Roboto|Open Sans|Montserrat|Lato|Playfair Display|Fraunces|Instrument Serif|Space Grotesk|DM Sans|Manrope)["'\s,]/g

export function rasgos(files) {
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
  const entropiaTono = H / Math.log2(12)
  const cromaMedio = cromaticos.length ? cromaticos.reduce((a, c) => a + c.C, 0) / cromaticos.length : 0
  const cromaDesv = cromaticos.length
    ? Math.sqrt(cromaticos.reduce((a, c) => a + (c.C - cromaMedio) ** 2, 0) / cromaticos.length) : 0

  /* escalas — extractor compartido */
  const { radios, espacios, tamanos } = escalas(css, todo)

  const familias = new Set()
  for (const m of css.matchAll(/font-family:\s*([^;}]+)/gi)) {
    const f = m[1].split(',')[0].trim().replace(/["']/g, '').toLowerCase()
    if (f && !f.startsWith('var(') && f !== 'inherit') familias.add(f)
  }
  for (const m of todo.matchAll(FAMILIAS_CONOCIDAS)) familias.add(m[1].toLowerCase())

  const limpiezaEscala = espacios.length >= 8
    ? espacios.filter(v => v % 4 === 0).length / espacios.length : null

  return {
    archivos: files.length,
    entropiaTono, cromaMedio, cromaDesv,
    coloresUnicos: new Set(colores.map(c => `${c.L.toFixed(2)}|${c.C.toFixed(2)}|${(c.H / 15) | 0}`)).size,
    radiosDistintos: new Set(radios).size, radioDominancia: dominancia(radios),
    espaciosDistintos: new Set(espacios).size, espacioDominancia: dominancia(espacios),
    tamanosDistintos: new Set(tamanos).size,
    familias: familias.size,
    limpiezaEscala,
  }
}

export const vector = f => CAMPOS.map(k =>
  (f[k] === null || f[k] === undefined || Number.isNaN(f[k]) ? 0 : f[k]))
