#!/usr/bin/env node
// Amplia research/corpus.json SIN tocar lo que ya hay.
//
//   node research/amplia-corpus.mjs [--per 40] [--paginas 4] [--dry]
//
// POR QUE UN SCRIPT APARTE Y NO --more EN build-corpus.mjs. Aquel reconstruye
// desde cero y vuelve a fijar el SHA de cada repositorio contra HEAD. Correrlo
// otra vez moveria los SHA de las 289 entradas ya medidas y la medicion vigente
// dejaria de ser reproducible. Aqui las entradas existentes se copian
// literalmente, SHA incluido, y solo se anaden ids que no estaban.
//
// QUE NO SE HACE. No se afloja ninguna etiqueta para llenar el cupo. Las clases
// son las mismas de build-corpus.mjs y se vuelven a verificar aqui:
//
//   pos        marcador de generador presente. El marcador solo existe porque
//              la herramienta lo escribe.
//   neg_stack  Tailwind + creado antes de 2022-11-30 + no fork + no archivado.
//
// Lo unico que cambia es la PROFUNDIDAD: se pagina la misma busqueda y se
// abren bandas de estrellas que la consulta original no alcanzaba. Ampliar la
// muestra ensanchando la definicion de la clase seria fabricar la n.

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const arg = n => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined }
const PER = Number(arg('--per')) || 40
const PAGINAS = Number(arg('--paginas')) || 4
const DRY = process.argv.includes('--dry')
const CORTE = '2022-11-30'

const gh = ruta => {
  try { return JSON.parse(execFileSync('gh', ['api', ruta], { encoding: 'utf8', maxBuffer: 64e6 })) }
  catch { return null }
}
const dormir = ms => new Promise(r => setTimeout(r, ms))

const corpus = JSON.parse(readFileSync(join(AQUI, 'corpus.json'), 'utf8'))
const yaEstan = new Set(corpus.entradas.map(e => e.repo))
console.error(`corpus actual: ${corpus.entradas.length} entradas`)

/* ── consultas de ampliacion ── */
//
// Mismas poblaciones que build-corpus.mjs, buscadas mas hondo. Las bandas de
// estrellas son disjuntas a proposito: sin cortar por banda, GitHub devuelve
// siempre los mismos repositorios mas populares y paginar no aporta nada.

const CONSULTAS = [
  // POSITIVOS — mismos tres generadores, todas sus formas de marcar.
  { clase: 'pos', gen: 'lovable', tipo: 'code', q: 'lovable-tagger in:file filename:package.json' },
  { clase: 'pos', gen: 'lovable', tipo: 'code', q: '"lovable.dev/projects" in:file filename:README.md' },
  { clase: 'pos', gen: 'lovable', tipo: 'code', q: '"Generated with Lovable" in:file' },
  { clase: 'pos', gen: 'v0', tipo: 'code', q: '"v0.dev" in:file filename:README.md' },
  { clase: 'pos', gen: 'v0', tipo: 'code', q: '"Built with v0" in:file' },
  { clase: 'pos', gen: 'v0', tipo: 'code', q: '"vercel.com/chat" in:file filename:README.md' },
  { clase: 'pos', gen: 'bolt', tipo: 'code', q: '"bolt.new" in:file filename:README.md' },
  { clase: 'pos', gen: 'bolt', tipo: 'code', q: '"bolt.new" in:file filename:package.json' },

  // NEGATIVOS emparejados por stack — bandas de estrellas disjuntas.
  { clase: 'neg_stack', gen: 'humano-tailwind', tipo: 'repositories', q: `tailwind created:<${CORTE} stars:10..25 fork:false` },
  { clase: 'neg_stack', gen: 'humano-tailwind', tipo: 'repositories', q: `tailwind created:<${CORTE} stars:26..60 fork:false` },
  { clase: 'neg_stack', gen: 'humano-tailwind', tipo: 'repositories', q: `tailwind created:<${CORTE} stars:61..150 fork:false` },
  { clase: 'neg_stack', gen: 'humano-tailwind', tipo: 'repositories', q: `tailwind created:<${CORTE} stars:151..400 fork:false` },
  { clase: 'neg_stack', gen: 'humano-tailwind', tipo: 'repositories', q: `tailwindcss created:<${CORTE} stars:5..20 fork:false` },
  { clase: 'neg_stack', gen: 'humano-tailwind', tipo: 'repositories', q: `tailwindcss language:TypeScript created:<${CORTE} stars:>10 fork:false` },
  { clase: 'neg_stack', gen: 'humano-tailwind', tipo: 'repositories', q: `tailwindcss language:JavaScript created:<${CORTE} stars:>10 fork:false` },
  { clase: 'neg_stack', gen: 'humano-tailwind', tipo: 'repositories', q: `tailwindcss language:Vue created:<${CORTE} stars:>5 fork:false` },
  { clase: 'neg_stack', gen: 'humano-tailwind', tipo: 'code', q: 'tailwindcss in:file filename:package.json' },
]

const candidatos = []
const vistos = new Set(yaEstan)

for (const c of CONSULTAS) {
  let tomados = 0
  for (let pagina = 1; pagina <= PAGINAS && tomados < PER; pagina++) {
    const r = gh(`search/${c.tipo}?q=${encodeURIComponent(c.q)}&per_page=100&page=${pagina}`)
    await dormir(2400) // limite de la API de busqueda: 30/min
    if (!r?.items?.length) break
    const repos = c.tipo === 'code' ? r.items.map(i => i.repository.full_name) : r.items.map(i => i.full_name)
    for (const nombre of [...new Set(repos)]) {
      if (vistos.has(nombre) || tomados >= PER) continue
      vistos.add(nombre)
      candidatos.push({ nombre, clase: c.clase, gen: c.gen, consulta: c.q })
      tomados++
    }
  }
  console.error(`  ${c.clase}/${c.gen}: +${tomados}  · ${c.q.slice(0, 56)}`)
}

console.error(`\ncandidatos nuevos: ${candidatos.length}`)
if (DRY) process.exit(0)

/* ── enriquecido, con las mismas verificaciones de clase ── */

const nuevas = []
let descartados = { fork: 0, archivado: 0, tamano: 0, sin_sha: 0, fecha: 0, sin_tailwind: 0 }

for (const c of candidatos) {
  const meta = gh(`repos/${c.nombre}`)
  if (!meta) { descartados.sin_sha++; continue }
  if (meta.fork) { descartados.fork++; continue }
  if (meta.archived) { descartados.archivado++; continue }
  if (meta.size > 120_000) { descartados.tamano++; continue }

  const rama = meta.default_branch
  const commits = gh(`repos/${c.nombre}/commits?sha=${rama}&per_page=1`)
  const sha = commits?.[0]?.sha
  if (!sha) { descartados.sin_sha++; continue }

  let pkg = null
  const raw = gh(`repos/${c.nombre}/contents/package.json?ref=${sha}`)
  if (raw?.content) { try { pkg = JSON.parse(Buffer.from(raw.content, 'base64').toString('utf8')) } catch {} }
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) }
  const nombres = Object.keys(deps).join(' ')
  const stack = {
    tailwind: /tailwindcss/.test(nombres),
    radix: /@radix-ui/.test(nombres),
    next: /(^|\s)next(@|\s|$)/.test(nombres) || 'next' in deps,
    vite: 'vite' in deps,
    react: 'react' in deps,
  }

  const creado = meta.created_at.slice(0, 10)
  // Las mismas dos comprobaciones que definen la clase negativa. No se relajan.
  if (c.clase.startsWith('neg') && creado >= CORTE) { descartados.fecha++; continue }
  if (c.clase === 'neg_stack' && !stack.tailwind) { descartados.sin_tailwind++; continue }

  nuevas.push({
    id: c.nombre.replace('/', '__'),
    repo: c.nombre,
    clase: c.clase,
    generador: c.gen,
    procedencia: c.clase === 'pos'
      ? `marcador de ${c.gen} presente en el repositorio`
      : `creado ${creado}, anterior al corte ${CORTE}; autoria humana`,
    consulta: c.consulta,
    sha, rama, creado,
    empujado: meta.pushed_at.slice(0, 10),
    estrellas: meta.stargazers_count,
    kb: meta.size,
    stack,
    ampliacion: true, // marca la tanda: permite medir la reserva antes y despues
  })
  process.stderr.write('.')
}

const todas = [...corpus.entradas, ...nuevas]
  .sort((a, b) => a.clase.localeCompare(b.clase) || a.repo.localeCompare(b.repo))

corpus._meta.ampliaciones = [...(corpus._meta.ampliaciones || []), {
  generado_por: 'research/amplia-corpus.mjs',
  anadidas: nuevas.length,
  total: todas.length,
  consultas: CONSULTAS,
  nota: 'Entradas previas copiadas literalmente con su SHA: la medicion anterior sigue siendo reproducible.',
}]
corpus.entradas = todas

writeFileSync(join(AQUI, 'corpus.json'), JSON.stringify(corpus, null, 2), 'utf8')

const cuenta = {}
for (const e of nuevas) cuenta[e.clase] = (cuenta[e.clase] || 0) + 1
console.error(`\n\n+${nuevas.length} entradas nuevas · corpus ahora ${todas.length}`)
for (const [k, v] of Object.entries(cuenta)) console.error(`  ${k}: +${v}`)
console.error(`  descartados: ${JSON.stringify(descartados)}`)
