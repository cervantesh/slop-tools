#!/usr/bin/env node
// Comprueba las tres promesas de slop-refine, en vez de creerselas.
//
//   1. RESUELVE lo que ya esta limpio, sin inventar trabajo.
//   2. SE PARA ante un hallazgo de confianza alta, en vez de seguir iterando.
//   3. NO SE CUELGA sin ruta — el borrador anterior heredaba el destino por
//      defecto '.', que en este repositorio son 213 proyectos de corpus.
//
//   node bench/verifica-refine.mjs

import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const AQUI = dirname(fileURLToPath(import.meta.url))
const REFINE = join(AQUI, '..', 'scripts', 'slop-refine.mjs')
const INIT = join(AQUI, '..', 'scripts', 'slop-init.mjs')

const correr = (args, permitirFallo = false) => {
  try {
    return { code: 0, out: execFileSync(process.execPath, [REFINE, ...args], { encoding: 'utf8', maxBuffer: 64e6, stdio: ['pipe', 'pipe', 'pipe'] }) }
  } catch (e) {
    if (!permitirFallo) throw e
    return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') }
  }
}

let fallos = 0
const comprobar = (ok, texto, detalle = '') => {
  console.log(`  ${ok ? 'ok' : ' x'} ${texto}${detalle ? ` — ${detalle}` : ''}`)
  if (!ok) fallos++
}

console.log('\n  verifica-refine\n')

/* 1 · resuelve lo limpio */
const dirLimpio = mkdtempSync(join(tmpdir(), 'refine-limpio-'))
correr([dirLimpio], true) // ignorado: solo para crear la ruta
execFileSync(process.execPath, [INIT, dirLimpio, '--seed', '4242'], { encoding: 'utf8' })
const limpio = JSON.parse(correr([dirLimpio, '--profile', 'landing', '--json', '--reset']).out)
comprobar(limpio.motivo === 'resuelto', 'resuelve un sistema recien generado', `motivo ${limpio.motivo}`)
comprobar(limpio.preguntas.length === 0, 'no inventa preguntas sobre algo limpio', `${limpio.preguntas.length} pregunta(s)`)
comprobar(limpio.alta.length === 0, 'cuenta cero hallazgos de confianza alta', `alta=${limpio.alta.length}`)

/* 2 · se para ante confianza alta */
const dirSucio = mkdtempSync(join(tmpdir(), 'refine-sucio-'))
mkdirSync(join(dirSucio, 'src'), { recursive: true })
// L2 es una de las reglas que sobrevive al conjunto reservado: moneda a mano.
writeFileSync(join(dirSucio, 'src', 'precios.js'),
  'export const a = "RD$ 4,800 por taller";\nexport const b = "US$ 12 al mes";\n', 'utf8')
const sucio = JSON.parse(correr([dirSucio, '--profile', 'producto', '--json', '--reset']).out)
comprobar(sucio.motivo === 'requiere_humano', 'se para ante un hallazgo de confianza alta', `motivo ${sucio.motivo}`)
comprobar(sucio.preguntas.length > 0, 'genera la pregunta correspondiente', `${sucio.preguntas.length} pregunta(s)`)
const p = sucio.preguntas[0]
comprobar(!!p?.por_que && !!p?.que_hacer, 'la pregunta trae el porque y el arreglo del catalogo')
comprobar(p?.donde?.length > 0, 'la pregunta trae ubicaciones concretas', (p?.donde || []).join(', '))

/* 3 · no se cuelga sin ruta */
const sinRuta = correr([], true)
comprobar(sinRuta.code === 2 && /falta la ruta/.test(sinRuta.out),
  'sin ruta se niega en vez de escanear el directorio actual', `salida ${sinRuta.code}`)

/* 4 · registrar una decision no rompe el estado */
if (p) {
  const resp = correr([dirSucio, '--apply-answer', p.id, '--answer-value', 'decidido en la revision'], true)
  comprobar(resp.code === 0 && /registrada/.test(resp.out), 'registra una decision humana')
  const est = JSON.parse(correr([dirSucio, '--status', '--json']).out)
  comprobar(est.decisiones?.length === 1, 'la decision queda en el historial', `${est.decisiones?.length ?? 0}`)
}

for (const d of [dirLimpio, dirSucio]) rmSync(d, { recursive: true, force: true })

console.log('')
if (fallos) { console.error(`verifica-refine: ${fallos} comprobacion(es) fallan`); process.exit(1) }
