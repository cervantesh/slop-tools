#!/usr/bin/env node
// Reconstruye el corpus en research/.corpus/ a partir del manifiesto.
// El corpus NO se comitea: se reconstruye desde los SHA fijados.
//
//   node research/fetch-corpus.mjs [--max-kb 80000] [--only pos]

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const DESTINO = join(AQUI, '.corpus')
const arg = n => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined }
const MAX_KB = Number(arg('--max-kb')) || 80_000
const SOLO = arg('--only')

const corpus = JSON.parse(readFileSync(join(AQUI, 'corpus.json'), 'utf8'))
const token = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim()

mkdirSync(DESTINO, { recursive: true })

// Se conserva solo lo que el escaner puede leer. Un repo de 80 MB deja unos
// pocos cientos de KB utiles.
const UTIL = /\.(css|scss|sass|less|html?|jsx|tsx|js|ts|mjs|vue|svelte|astro)$/i
const PODAR = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', 'coverage', 'vendor', 'test', 'tests', '__tests__', 'e2e', 'fixtures'])

function podar(dir) {
  let vivos = 0
  for (const nombre of readdirSync(dir)) {
    const p = join(dir, nombre)
    let st
    try { st = statSync(p) } catch { continue }
    if (st.isDirectory()) {
      if (PODAR.has(nombre)) { rmSync(p, { recursive: true, force: true }); continue }
      const n = podar(p)
      if (n === 0) rmSync(p, { recursive: true, force: true })
      vivos += n
    } else if (UTIL.test(nombre) && st.size < 4_000_000) vivos++
    else rmSync(p, { force: true })
  }
  return vivos
}

let ok = 0, saltados = 0, fallidos = 0
const estado = []

for (const e of corpus.entradas) {
  if (SOLO && e.clase !== SOLO) continue
  const dir = join(DESTINO, e.id)
  if (existsSync(join(dir, '.listo'))) { ok++; continue }
  if (e.kb > MAX_KB) { saltados++; estado.push({ id: e.id, estado: 'saltado_por_tamano', kb: e.kb }); continue }

  try {
    const url = `https://codeload.github.com/${e.repo}/tar.gz/${e.sha}`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'slop-tools' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const tgz = join(DESTINO, `${e.id}.tgz`)
    writeFileSync(tgz, Buffer.from(await res.arrayBuffer()))
    mkdirSync(dir, { recursive: true })
    execFileSync('tar', ['-xzf', tgz, '-C', dir, '--strip-components=1'], { stdio: 'ignore' })
    rmSync(tgz, { force: true })
    const vivos = podar(dir)
    if (vivos < 3) { rmSync(dir, { recursive: true, force: true }); estado.push({ id: e.id, estado: 'sin_archivos_utiles' }); saltados++; continue }
    writeFileSync(join(dir, '.listo'), String(vivos))
    estado.push({ id: e.id, estado: 'ok', archivos: vivos })
    ok++
    process.stderr.write('.')
  } catch (err) {
    fallidos++
    estado.push({ id: e.id, estado: 'error', error: String(err.message) })
    process.stderr.write('x')
  }
}

writeFileSync(join(AQUI, '.corpus-estado.json'), JSON.stringify(estado, null, 2), 'utf8')
console.error(`\n\nlistos ${ok} · saltados ${saltados} · fallidos ${fallidos}`)
