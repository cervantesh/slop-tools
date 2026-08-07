#!/usr/bin/env node
// Comprueba que el núcleo de confianza se carga y marca bien ALTA vs DUDOSA.
//
//   node bench/verifica-nucleo.mjs

import { nucleoInfo, nivelConfianza, resumenConfianza } from '../scripts/lib/nucleo.mjs'
import { armarPlan } from '../scripts/lib/sello.mjs'

console.log('\n  verifica-nucleo\n')
let fallos = 0

const n = nucleoInfo()
const esperadas = ['UX2', 'L2', 'L1', 'UX6', 'D5', 'CS3']
for (const id of esperadas) {
  if (!n.alta.includes(id)) {
    console.log(`  x falta en ALTA: ${id}`)
    fallos++
  }
}
// C4 es famosa por caer en holdout
const c4 = nivelConfianza('C4', { separa: true, J_banda: 0.39 })
if (c4.nivel !== 'dudosa') {
  console.log(`  x C4 debia ser dudosa, es ${c4.nivel}`)
  fallos++
} else console.log('  ok C4         confianza dudosa (cae en reserva)')

const ux2 = nivelConfianza('UX2', { separa: true, J_banda: 0.45 })
if (ux2.nivel !== 'alta') {
  console.log(`  x UX2 debia ser alta, es ${ux2.nivel}`)
  fallos++
} else console.log('  ok UX2        confianza alta')

const fake = resumenConfianza([
  { id: 'UX2', title: 'pastilla', failed: true, tipo: 'procedencia', validado: { separa: true } },
  { id: 'C4', title: 'escala', failed: true, tipo: 'procedencia', validado: { separa: true } },
  { id: 'ZZ9', title: 'inventada', failed: true, tipo: 'procedencia', validado: null },
])
if (fake.fallan.alta.length !== 1 || fake.fallan.alta[0].id !== 'UX2') {
  console.log('  x resumenConfianza alta mal')
  fallos++
} else console.log('  ok resumen    ALTA/DUDOSA/sin_medir separados')

if (!n.alta.length) {
  console.log('  x nucleo vacio')
  fallos++
} else console.log(`  ok nucleo     ${n.alta.length} reglas ALTA · origen ${n.origen}`)

// El plan debe poner ALTA antes que dudosa
const plan = armarPlan({
  results: [
    { id: 'C4', title: 'escala', failed: true, weight: 3, cat: 'Layout', tipo: 'procedencia', validado: { separa: true, J_banda: 0.39 } },
    { id: 'UX2', title: 'pastilla', failed: true, weight: 3, cat: 'Layout', tipo: 'procedencia', validado: { separa: true, J_banda: 0.45 } },
    { id: 'E5', title: 'vacio', failed: true, weight: 1, cat: 'Copy', tipo: 'procedencia', validado: null },
  ],
})
const nombres = plan.capas.map(c => c.capa)
const iAlta = nombres.findIndex(c => /ALTA/i.test(c))
const iDud = nombres.findIndex(c => /dudosa/i.test(c))
const iRest = nombres.findIndex(c => /opcional|poca|nula/i.test(c))
if (iAlta < 0 || iDud < 0 || iAlta > iDud) {
  console.log('  x plan no ordena ALTA antes que dudosa:', nombres.join(' | '))
  fallos++
} else if (iRest >= 0 && iDud > iRest) {
  console.log('  x plan: resto antes que dudosa')
  fallos++
} else {
  console.log('  ok plan       orden ALTA → dudosa → resto')
}

console.log('')
if (fallos) {
  console.error(`verifica-nucleo: ${fallos} fallo(s)`)
  process.exit(1)
}
console.log('  verifica-nucleo: ok\n')
