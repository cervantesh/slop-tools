#!/usr/bin/env node
// Particion ajuste / reserva: cuanto de lo que medimos sobrevive fuera de los
// proyectos con los que decidimos.
//
// EL PROBLEMA QUE RESUELVE. Los pesos del catalogo se ajustaron mirando la
// tabla completa. Una regla puede parecer buena porque acertó justo en esos
// proyectos. Sin un conjunto que no haya participado en ninguna decision, no
// sabemos cuanto de la separacion es senal y cuanto es memoria.
//
// METODO. Particion determinista por hash del identificador del repositorio —
// misma particion en cada ejecucion, sin sembrar nada a mano — en 70% ajuste y
// 30% reserva, dentro de la banda de tamano de 20 a 200 archivos. Se recalcula
// J en cada mitad y se compara.
//
//   node research/holdout.mjs [--json]

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const m = JSON.parse(readFileSync(join(AQUI, 'medicion.json'), 'utf8'))
const AS_JSON = process.argv.includes('--json')

// FNV-1a: barato, determinista y sin dependencias.
function hash(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h
}

const BANDA = { min: 20, max: 200 }
const enBanda = p => p.archivos >= BANDA.min && p.archivos < BANDA.max
const proyectos = m.proyectos.filter(enBanda).filter(p => p.clase === 'pos' || p.clase === 'neg_stack')

// 30% a reserva. El corte sobre el hash es fijo: cambiarlo seria elegir la
// particion que mas conviene, que es la trampa que esto viene a evitar.
const esReserva = p => (hash(p.id) % 100) < 30
const ajuste = proyectos.filter(p => !esReserva(p))
const reserva = proyectos.filter(esReserva)

const tasa = (grupo, clase, id) => {
  const g = grupo.filter(p => p.clase === clase)
  if (!g.length) return null
  return g.filter(p => p.dispara?.[id]).length / g.length
}
const J = (grupo, id) => {
  const p = tasa(grupo, 'pos', id), n = tasa(grupo, 'neg_stack', id)
  return p === null || n === null ? null : p - n
}

const ids = [...new Set(m.filas.map(f => f.id))]
const filas = ids.map(id => {
  const ja = J(ajuste, id), jr = J(reserva, id)
  return {
    id,
    titulo: m.filas.find(f => f.id === id)?.titulo || '',
    J_ajuste: ja, J_reserva: jr,
    caida: ja === null || jr === null ? null : ja - jr,
  }
}).filter(f => f.J_ajuste !== null)
  .sort((a, b) => (b.J_ajuste ?? 0) - (a.J_ajuste ?? 0))

const n = {
  ajuste: { pos: ajuste.filter(p => p.clase === 'pos').length, neg: ajuste.filter(p => p.clase === 'neg_stack').length },
  reserva: { pos: reserva.filter(p => p.clase === 'pos').length, neg: reserva.filter(p => p.clase === 'neg_stack').length },
}

// Se considera que aguanta si conserva al menos la mitad de su J y no cambia de
// signo. Es un criterio grueso a proposito: con esta n, exigir mas seria fingir
// precision.
const aguanta = f => f.J_reserva !== null && f.J_ajuste > 0.15 && f.J_reserva >= f.J_ajuste * 0.5

if (AS_JSON) {
  console.log(JSON.stringify({ n, banda: BANDA, filas }, null, 2))
} else {
  console.log('\n  holdout · particion determinista por hash del repositorio\n')
  console.log(`  ajuste   pos=${n.ajuste.pos}  neg=${n.ajuste.neg}`)
  console.log(`  reserva  pos=${n.reserva.pos}  neg=${n.reserva.neg}\n`)
  console.log('  ID      J ajuste  J reserva   caida   aguanta')
  console.log('  ' + '-'.repeat(52))
  for (const f of filas.slice(0, 18)) {
    const fmt = x => (x === null ? '  n/a ' : (x >= 0 ? ' ' : '') + x.toFixed(2))
    console.log(`  ${f.id.padEnd(7)} ${fmt(f.J_ajuste).padStart(7)}   ${fmt(f.J_reserva).padStart(8)}  ${fmt(f.caida).padStart(6)}    ${f.J_ajuste > 0.15 ? (aguanta(f) ? 'si' : 'NO') : '—'}`)
  }
  const fuertes = filas.filter(f => f.J_ajuste > 0.15)
  const sobreviven = fuertes.filter(aguanta)
  console.log(`\n  De ${fuertes.length} reglas con J > 0,15 en ajuste, ${sobreviven.length} conservan al menos la mitad en reserva.`)
  console.log('  La reserva no participo en ninguna decision de peso.\n')
}

writeFileSync(join(AQUI, 'holdout.json'), JSON.stringify({ n, banda: BANDA, filas }, null, 2) + '\n', 'utf8')
