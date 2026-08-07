#!/usr/bin/env node
// Detecta que proyectos del corpus tienen interfaz en espanol.
//
// POR QUE. `L3` es especifica del espanol; el corpus general es casi todo ingles.
// Este script inventaria cuantos proyectos ya tienen prosa ES antes de ampliar
// (corpus-es.mjs) y medir (l3-espanol.mjs). Resultado vigente: 19 humanos,
// premisas falsada, peso 1 — research/RESULTADOS.md §L3.
//
//   node research/idioma.mjs

import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collect } from '../scripts/lib/util.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const CORPUS = join(AQUI, '.corpus')
const corpus = JSON.parse(readFileSync(join(AQUI, 'corpus.json'), 'utf8')).entradas

if (!existsSync(CORPUS)) { console.log('corpus no reconstruido'); process.exit(0) }

// Palabras funcionales que no aparecen en ingles y son frecuentes en cualquier
// interfaz en espanol. Se cuentan sobre prosa entrecomillada o texto de nodo,
// no sobre identificadores.
const ES = /\b(el|la|los|las|una|unos|por|para|con|sin|desde|hasta|tu|su|nuestro|cuenta|contrasena|contraseña|usuario|correo|buscar|guardar|enviar|cerrar|sesion|sesión|ajustes|precio|servicio|inicio)\b/gi

const filas = []
for (const e of corpus) {
  const dir = join(CORPUS, e.id)
  if (!existsSync(dir)) continue
  let files
  try { files = collect(dir) } catch { continue }
  if (!files.length) continue

  const prosa = []
  for (const f of files) {
    for (const m of f.text.matchAll(/["'`]([^"'`\n]{12,160})["'`]|>([^<>{}\n]{12,160})</g)) {
      const s = (m[1] || m[2] || '').trim()
      if (/[{}<>=;()[\]|]|=>|\$\{|::|\/\//.test(s)) continue
      if (!/\s/.test(s)) continue
      prosa.push(s)
    }
  }
  const texto = prosa.join(' ')
  if (texto.length < 400) continue
  const hits = (texto.match(ES) || []).length
  const densidad = hits / (texto.split(/\s+/).length || 1)
  filas.push({ id: e.id, clase: e.clase, palabras: texto.split(/\s+/).length, hits, densidad })
}

filas.sort((a, b) => b.densidad - a.densidad)
const esEspanol = f => f.densidad >= 0.03 && f.hits >= 12
const espanoles = filas.filter(esEspanol)

console.log(`\n  ${filas.length} proyectos con prosa suficiente\n`)
console.log('  Con interfaz en espanol:')
for (const f of espanoles) {
  console.log(`  ${f.clase.padEnd(12)} ${f.id.padEnd(40)} densidad ${(f.densidad * 100).toFixed(1)}%  (${f.hits} marcas)`)
}
const porClase = {}
for (const f of espanoles) porClase[f.clase] = (porClase[f.clase] || 0) + 1
console.log(`\n  total ${espanoles.length}: ${Object.entries(porClase).map(([k, v]) => `${k}=${v}`).join(' · ') || 'ninguno'}`)
console.log('\n  Para evaluar L3 hacen falta ambas clases. Con menos de 8 por clase, cualquier')
console.log('  cifra seria anecdota.\n')

writeFileSync(join(AQUI, 'idioma.json'),
  JSON.stringify({ _meta: { umbral: 'densidad >= 0.03 y >= 12 marcas' }, espanoles, todos: filas.slice(0, 40) }, null, 2) + '\n', 'utf8')
