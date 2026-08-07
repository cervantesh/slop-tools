#!/usr/bin/env node
// Construye research/corpus.json consultando la API de GitHub via `gh`.
// Reproducible: las consultas estan declaradas aqui abajo y los SHA quedan fijados.
//
//   node research/build-corpus.mjs [--per 14]
//
// DISENO DEL CORPUS — tres grupos, no dos.
//
//   pos          marcados por generador (lovable-tagger, v0.dev, bolt.new).
//                Procedencia inequivoca: el marcador solo existe porque la
//                herramienta lo inyecta.
//   neg_stack    autoria humana, Tailwind, creados ANTES de 2022-11-30.
//                Control emparejado por stack. La fecha es la etiqueta: nada
//                anterior a ChatGPT pudo generarse con un LLM.
//   neg_classic  autoria humana comprobable, equipos conocidos, otro stack.
//
// La comparacion valida es pos vs neg_stack. pos vs neg_classic se reporta
// aparte y sirve para EXPONER que reglas solo estan detectando Tailwind
// moderno en vez de procedencia.

import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const PER = Number(process.argv[process.argv.indexOf('--per') + 1]) || 14
const CORTE = '2022-11-30' // lanzamiento publico de ChatGPT

const gh = (ruta) => {
  try { return JSON.parse(execFileSync('gh', ['api', ruta], { encoding: 'utf8', maxBuffer: 64e6 })) }
  catch { return null }
}
const buscar = (tipo, q, per = 100) =>
  gh(`search/${tipo}?q=${encodeURIComponent(q)}&per_page=${per}`)

const dormir = ms => new Promise(r => setTimeout(r, ms))

/* ── consultas declaradas ── */

const CONSULTAS = [
  // POSITIVOS. Marcadores que solo aparecen porque la herramienta los escribe.
  { clase: 'pos', gen: 'lovable', tipo: 'code',
    q: 'lovable-tagger in:file filename:package.json' },
  { clase: 'pos', gen: 'v0', tipo: 'code',
    q: '"v0.dev" in:file filename:README.md' },
  { clase: 'pos', gen: 'bolt', tipo: 'code',
    q: '"bolt.new" in:file filename:README.md' },

  // NEGATIVOS emparejados por stack. Tailwind + anteriores al corte.
  { clase: 'neg_stack', gen: 'humano-tailwind', tipo: 'repositories',
    q: `tailwindcss created:<${CORTE} stars:>120 fork:false` },
  { clase: 'neg_stack', gen: 'humano-tailwind', tipo: 'repositories',
    q: `tailwind language:TypeScript created:<${CORTE} stars:>60 fork:false` },
  { clase: 'neg_stack', gen: 'humano-tailwind', tipo: 'repositories',
    q: `tailwind language:JavaScript created:<${CORTE} stars:>40 fork:false` },
  { clase: 'neg_stack', gen: 'humano-tailwind', tipo: 'repositories',
    q: `tailwind created:2020-01-01..${CORTE} stars:>20 fork:false` },
  { clase: 'neg_stack', gen: 'humano-tailwind', tipo: 'code',
    q: `tailwindcss in:file filename:package.json` },
]

// NEGATIVOS clasicos: curados a mano. Autoria humana documentada y anteriores
// al corte por varios anos. No se dejan a merced de una consulta porque las
// busquedas de "design system" devuelven libros y listas.
const CURADOS = [
  // Sistemas de diseno con equipo y autoria documentada
  'alphagov/govuk-frontend', 'primer/css', 'carbon-design-system/carbon',
  'Shopify/polaris', 'adobe/spectrum-css', 'twbs/bootstrap',
  'ant-design/ant-design', 'mui/material-ui', 'elastic/eui',
  'microsoft/fluentui', 'uswds/uswds', 'palantir/blueprint',
  'segmentio/evergreen', 'Semantic-Org/Semantic-UI', 'IBM/carbon-components',
  // Productos y sitios reales con equipo de diseno conocido, anteriores al corte
  'tailwindlabs/tailwindcss.com', 'saadeghi/daisyui', 'themesberg/flowbite',
  'excalidraw/excalidraw', 'outline/outline', 'calcom/cal.com',
  'withastro/astro.build', 'vercel/commerce', 'supabase/supabase',
]

/* ── recoleccion ── */

const vistos = new Set()
const candidatos = []

for (const c of CONSULTAS) {
  const r = buscar(c.tipo, c.q)
  await dormir(2200) // limite de la API de busqueda: 30/min
  if (!r?.items) { console.error(`  sin resultados: ${c.q}`); continue }
  const repos = c.tipo === 'code'
    ? r.items.map(i => i.repository.full_name)
    : r.items.map(i => i.full_name)
  let tomados = 0
  for (const nombre of [...new Set(repos)]) {
    if (vistos.has(nombre) || tomados >= PER) continue
    vistos.add(nombre)
    candidatos.push({ nombre, clase: c.clase, gen: c.gen, consulta: c.q })
    tomados++
  }
  console.error(`  ${c.clase}/${c.gen}: ${tomados} candidatos`)
}

for (const nombre of CURADOS) {
  if (vistos.has(nombre)) continue
  vistos.add(nombre)
  candidatos.push({ nombre, clase: 'neg_classic', gen: 'curado', consulta: 'curado a mano' })
}

/* ── enriquecido y filtrado ── */

const entradas = []
for (const c of candidatos) {
  const curado = c.gen === 'curado'
  const meta = gh(`repos/${c.nombre}`)
  if (!meta || meta.fork) continue
  // Los curados no se filtran por archivado ni por tamano: que Semantic-UI este
  // archivado o que Bootstrap pese 200 MB no los hace menos humanos. La poda al
  // descargar deja solo los archivos legibles.
  if (!curado && (meta.archived || meta.size > 120_000)) continue

  const rama = meta.default_branch
  const commits = gh(`repos/${c.nombre}/commits?sha=${rama}&per_page=1`)
  const sha = commits?.[0]?.sha
  if (!sha) continue

  // Deteccion de stack: hace falta para el control del confundido.
  let pkg = null
  const raw = gh(`repos/${c.nombre}/contents/package.json?ref=${sha}`)
  if (raw?.content) {
    try { pkg = JSON.parse(Buffer.from(raw.content, 'base64').toString('utf8')) } catch {}
  }
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) }
  const nombres = Object.keys(deps).join(' ')
  const stack = {
    tailwind: /tailwindcss/.test(nombres),
    radix: /@radix-ui/.test(nombres),
    next: /(^|\s)next(@|\s|$)/.test(nombres) || 'next' in deps,
    vite: 'vite' in deps,
    react: 'react' in deps,
  }

  // El corte temporal es la etiqueta de la clase negativa: verificarlo.
  const creado = meta.created_at.slice(0, 10)
  if (c.clase.startsWith('neg') && creado >= CORTE) continue
  if (c.clase === 'neg_stack' && !stack.tailwind) continue

  entradas.push({
    id: c.nombre.replace('/', '__'),
    repo: c.nombre,
    clase: c.clase,
    generador: c.gen,
    procedencia: c.clase === 'pos'
      ? `marcador de ${c.gen} presente en el repositorio`
      : `creado ${creado}, anterior al corte ${CORTE}; autoria humana`,
    consulta: c.consulta,
    sha,
    rama,
    creado,
    empujado: meta.pushed_at.slice(0, 10),
    estrellas: meta.stargazers_count,
    kb: meta.size,
    stack,
  })
  process.stderr.write('.')
}

const corpus = {
  _meta: {
    version: 1,
    generado_por: 'research/build-corpus.mjs',
    corte_temporal: CORTE,
    nota: 'La comparacion valida es pos vs neg_stack (emparejado por Tailwind). pos vs neg_classic mide ademas epoca y stack.',
    consultas: CONSULTAS,
    curados: CURADOS,
  },
  entradas: entradas.sort((a, b) => a.clase.localeCompare(b.clase) || a.repo.localeCompare(b.repo)),
}

mkdirSync(AQUI, { recursive: true })
writeFileSync(join(AQUI, 'corpus.json'), JSON.stringify(corpus, null, 2), 'utf8')

const cuenta = {}
for (const e of entradas) cuenta[e.clase] = (cuenta[e.clase] || 0) + 1
console.error(`\n\ncorpus.json: ${entradas.length} entradas`)
for (const [k, v] of Object.entries(cuenta)) console.error(`  ${k}: ${v}`)
console.error(`  con tailwind: ${entradas.filter(e => e.stack.tailwind).length}`)
