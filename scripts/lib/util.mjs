// Recolección de archivos y utilidades compartidas.

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname, relative } from 'node:path'

const EXT = new Set(['.css', '.scss', '.sass', '.less', '.html', '.htm',
  '.jsx', '.tsx', '.js', '.ts', '.mjs', '.vue', '.svelte', '.astro'])
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next',
  'coverage', 'vendor', '.svelte-kit', '__snapshots__', '.slop'])

export function collect(root, dir = root, acc = []) {
  let entries
  try { entries = readdirSync(dir) } catch { return acc }
  for (const name of entries) {
    if (SKIP.has(name)) continue
    const p = join(dir, name)
    let st
    try { st = statSync(p) } catch { continue }
    if (st.isDirectory()) collect(root, p, acc)
    else if (EXT.has(extname(name)) && st.size < 4_000_000) {
      let text
      try { text = readFileSync(p, 'utf8') } catch { continue }
      acc.push({ path: p, rel: relative(root, p).replace(/\\/g, '/'), text, lines: text.split('\n') })
    }
  }
  return acc
}

// Los archivos de marcado cuentan como fuente de estilos: llevan CSS embebido en <style>.
export const esEstilo = f => /\.(css|scss|sass|less|html?|vue|svelte|astro)$/.test(f.rel)
export const esCodigo = f => /\.(jsx|tsx|js|ts|mjs|vue|svelte|astro|html?)$/.test(f.rel)

// Cuenta COINCIDENCIAS, no lineas. La distincion importa: cinco emojis en una
// sola linea son cinco, y un CSS minificado mete cien declaraciones en una. Si
// se cuentan lineas, cualquier umbral de densidad se evade agrupando selectores.
export function find(pattern, pool, cap = 6) {
  const out = []
  let total = 0
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')
  for (const f of pool) {
    for (let i = 0; i < f.lines.length; i++) {
      const hits = [...f.lines[i].matchAll(re)]
      if (!hits.length) continue
      total += hits.length
      if (out.length < cap) out.push({ file: f.rel, line: i + 1, text: f.lines[i].trim().slice(0, 120) })
    }
  }
  return { total, samples: out }
}

export const all = pool => pool.map(f => f.text).join('\n')

// Segundo sustrato: las clases de utilidad.
//
// Sin esto, cualquier comprobacion de estilo mira solo los archivos CSS — y en
// un proyecto Tailwind real no hay CSS. Medido sobre el corpus: ant-design
// tiene 1 archivo CSS y 1.985 de JSX. Diez reglas daban cero disparos en 71
// proyectos por esta razon, no porque el patron no estuviera presente.
// Ver research/RESULTADOS.md §3.2.
export function clasesUtilidad(codeFiles) {
  const trozos = []
  for (const f of codeFiles) {
    for (const m of f.text.matchAll(/class(?:Name)?\s*=\s*(?:["'`]([^"'`]{0,600})["'`]|\{`([^`]{0,600})`\})/g)) {
      trozos.push(m[1] || m[2] || '')
    }
  }
  return trozos.join(' ')
}

// Como `find`, pero sobre las clases de utilidad y con ubicacion aproximada.
export function findClases(pattern, codeFiles, cap = 6) {
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')
  const out = []
  let total = 0
  for (const f of codeFiles) {
    for (let i = 0; i < f.lines.length; i++) {
      const clases = [...f.lines[i].matchAll(/class(?:Name)?\s*=\s*(?:["'`]([^"'`]{0,600})["'`]|\{`([^`]{0,600})`\})/g)]
        .map(m => m[1] || m[2] || '').join(' ')
      if (!clases) continue
      const hits = [...clases.matchAll(re)]
      if (!hits.length) continue
      total += hits.length
      if (out.length < cap) out.push({ file: f.rel, line: i + 1, text: hits.slice(0, 3).map(h => h[0]).join(' ') })
    }
  }
  return { total, samples: out }
}

// Descarta lo que es código y no prosa dirigida a una persona.
export function esProsa(s) {
  if (!s || !/\s/.test(s)) return false
  if (!/[a-záéíóúñ]{3}/i.test(s)) return false
  if (/[{}<>=;()[\]|]|=>|\$\{|::|\/\//.test(s)) return false
  if (/^[\w./-]+$/.test(s)) return false
  if (/^(https?:|data:|\.\/|\/)/.test(s)) return false
  return true
}

// Localiza el número de línea de un índice de carácter dentro del texto completo.
export const lineaDe = (texto, idx) => texto.slice(0, idx).split('\n').length
