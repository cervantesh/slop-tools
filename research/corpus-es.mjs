#!/usr/bin/env node
// Amplia el corpus con proyectos de interfaz en ESPANOL. Construyo el sustrato
// que midio `L3` (research/l3-espanol.mjs): 19 humanos pre-ChatGPT, 0 generados.
// Premisa falsada; peso 1. Ver research/RESULTADOS.md §L3.
//
// El corpus general no sirve: research/idioma.mjs encontro cero proyectos en
// espanol entre 120. No es que no se pudiera medir; es que ese corpus no puede.
//
// ESTRATEGIA. La etiqueta de clase se mantiene igual que en el corpus general
// —marcador de generador para `pos`, fecha anterior al corte para `neg_stack`—
// y el idioma se comprueba DESPUES, sobre el contenido descargado, con el mismo
// detector de research/idioma.mjs. Buscar por idioma en la consulta sesgaria la
// muestra hacia proyectos que hablan de si mismos en espanol.
//
//   node research/corpus-es.mjs [--por 30]

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const POR = Number(process.argv[process.argv.indexOf('--por') + 1]) || 30
const CORTE = '2022-11-30'

// Misma forma que research/build-corpus.mjs: la ruta va codificada en la URL.
// Pasar `-f q=...` como argumentos sueltos falla silenciosamente desde Node en
// Windows, y el catch se lo traga.
const gh = (ruta) => {
  try { return JSON.parse(execFileSync('gh', ['api', ruta], { encoding: 'utf8', maxBuffer: 64e6 })) }
  catch { return null }
}
const buscar = (tipo, q, per) => gh(`search/${tipo}?q=${encodeURIComponent(q)}&per_page=${per}`)

const CONSULTAS = [
  // pos — marcador de generador. El idioma se filtra despues.
  { clase: 'pos', gen: 'lovable', tipo: 'code', q: 'lovable-tagger in:file filename:package.json' },
  { clase: 'pos', gen: 'v0', tipo: 'code', q: '"v0.dev" in:file filename:README.md' },
  // neg_stack — humanos anteriores al corte, con senales de hispanohablante.
  { clase: 'neg_stack', gen: 'humano-es', tipo: 'repositories', q: `tailwind created:<${CORTE} fork:false "iniciar sesion" in:readme` },
  { clase: 'neg_stack', gen: 'humano-es', tipo: 'repositories', q: `tailwind created:<${CORTE} fork:false "espanol" in:readme` },
  { clase: 'neg_stack', gen: 'humano-es', tipo: 'repositories', q: `react created:<${CORTE} fork:false stars:>3 "aplicacion web" in:readme` },
  { clase: 'neg_stack', gen: 'humano-es', tipo: 'repositories', q: `javascript created:<${CORTE} fork:false stars:>5 "usuarios" in:readme language:JavaScript` },
]

const ruta = join(AQUI, 'corpus.json')
const corpus = JSON.parse(readFileSync(ruta, 'utf8'))
const ya = new Set(corpus.entradas.map(e => e.repo))
const nuevas = []

for (const c of CONSULTAS) {
  const res = buscar(c.tipo, c.q, POR)
  if (!res?.items) { process.stderr.write('!'); continue }
  const repos = [...new Set(res.items.map(it => it.repository?.full_name || it.full_name).filter(Boolean))]

  for (const repo of repos) {
    if (ya.has(repo)) continue
    const info = gh(`repos/${repo}`)
    if (!info) continue
    const meta = {
      creado: info.created_at, empujado: info.pushed_at,
      estrellas: info.stargazers_count, kb: info.size, rama: info.default_branch,
    }
    // La etiqueta negativa depende de la fecha, no del criterio de nadie.
    if (c.clase === 'neg_stack' && meta.creado >= CORTE) continue
    const commit = gh(`repos/${repo}/commits/${meta.rama}`)
    const sha = commit?.sha
    if (!sha) continue
    ya.add(repo)
    nuevas.push({
      id: repo.replace('/', '__'), repo, clase: c.clase, generador: c.gen,
      procedencia: c.clase === 'pos'
        ? `marcador de generador (${c.gen})`
        : `creado ${meta.creado.slice(0, 10)}, anterior al corte ${CORTE}`,
      consulta: c.q, sha, rama: meta.rama,
      creado: meta.creado.slice(0, 10), empujado: meta.empujado.slice(0, 10),
      estrellas: meta.estrellas, kb: meta.kb,
      candidato_es: true,
    })
    process.stderr.write('.')
  }
}

corpus.entradas.push(...nuevas)
corpus._meta.consultas_es = CONSULTAS
writeFileSync(ruta, JSON.stringify(corpus, null, 2) + '\n', 'utf8')
console.error('')
console.log(`candidatos anadidos: ${nuevas.length} · corpus: ${corpus.entradas.length}`)
console.log('Siguiente: node research/fetch-corpus.mjs && node research/idioma.mjs')
