#!/usr/bin/env node
// Comprueba que el núcleo de confianza se carga y marca bien ALTA vs DUDOSA.
//
//   node bench/verifica-nucleo.mjs

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { nucleoInfo, nivelConfianza, resumenConfianza } from '../scripts/lib/nucleo.mjs'
import { armarPlan } from '../scripts/lib/sello.mjs'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')

console.log('\n  verifica-nucleo\n')
let fallos = 0

const n = nucleoInfo()

// NO se fija una lista de ids esperados.
//
// La habia, y quedo obsoleta en cuanto el corpus crecio: exigia en ALTA a `L1`,
// `UX6` y `D5`, que dejaron de aguantar fuera de muestra, y daba por dudosa a
// `C4`, que empezo a aguantar. Un test que codifica el RESULTADO de una medicion
// convierte cada medicion nueva en un test roto, y la tentacion entonces es
// tocar el test en vez de leer el hallazgo.
//
// Lo que se comprueba es la CONSISTENCIA: que la copia empaquetada describa el
// mismo holdout que hay en research/, aplicando el mismo criterio.
const holdout = JSON.parse(readFileSync(join(RAIZ, 'research', 'holdout.json'), 'utf8'))
const empaquetado = JSON.parse(readFileSync(join(RAIZ, 'data', 'nucleo-validado.json'), 'utf8'))
const esAlta = f => f.J_ajuste > 0.15 && f.J_reserva > 0 && f.J_reserva >= f.J_ajuste / 2
const altaReal = holdout.filas.filter(f => f.J_ajuste > 0.15).filter(esAlta).map(f => f.id).sort()

const dif = [
  ...altaReal.filter(id => !empaquetado.alta.includes(id)).map(id => `falta ${id}`),
  ...empaquetado.alta.filter(id => !altaReal.includes(id)).map(id => `sobra ${id}`),
]
if (dif.length) {
  console.log(`  x data/nucleo-validado.json no cuadra con research/holdout.json: ${dif.join(', ')}`)
  console.log('     regenera con: node research/exporta-nucleo.mjs')
  fallos++
} else {
  console.log(`  ok nucleo     copia empaquetada al dia (${altaReal.length} en ALTA)`)
}

// Una regla con J alta en ajuste que NO aguanta en reserva tiene que salir como
// dudosa, sea cual sea. Se toma del propio archivo en vez de nombrarla.
const caida = holdout.filas.find(f => f.J_ajuste > 0.15 && !esAlta(f))
if (caida) {
  const nivel = nivelConfianza(caida.id, { separa: true, J_banda: caida.J_ajuste })
  if (nivel.nivel !== 'dudosa') {
    console.log(`  x ${caida.id} cae en reserva (${caida.J_ajuste.toFixed(2)} -> ${caida.J_reserva.toFixed(2)}) y debia ser dudosa, es ${nivel.nivel}`)
    fallos++
  } else console.log(`  ok ${caida.id.padEnd(10)} confianza dudosa (cae en reserva)`)
}

const ux2 = nivelConfianza('UX2', { separa: true, J_banda: 0.45 })
if (ux2.nivel !== 'alta') {
  console.log(`  x UX2 debia ser alta, es ${ux2.nivel}`)
  fallos++
} else console.log('  ok UX2        confianza alta')

// La dudosa se toma del holdout vigente, no se nombra a mano: es lo que rompio
// la version anterior de este test.
const fake = resumenConfianza([
  { id: 'UX2', title: 'pastilla', failed: true, tipo: 'procedencia', validado: { separa: true } },
  { id: caida?.id || 'L1', title: 'cae en reserva', failed: true, tipo: 'procedencia', validado: { separa: true } },
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
