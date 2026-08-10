#!/usr/bin/env node
// Regenera data/nucleo-validado.json desde research/holdout.json.
//
//   node research/exporta-nucleo.mjs [--dry]
//
// POR QUE EXISTE. La copia empaquetada del nucleo se escribio a mano la primera
// vez, y al ampliar el corpus quedo describiendo un holdout que ya no era el
// vigente: seguia listando en ALTA reglas que habian dejado de aguantar fuera de
// muestra, y dejaba fuera una que habia empezado a aguantar. Es el mismo fallo
// que verifica-conteos existe para impedir, y por el mismo motivo: nadie se
// acuerda de actualizar a mano un archivo derivado.
//
// El criterio de ALTA no se decide aqui: se lee de scripts/lib/nucleo.mjs, que
// es quien lo aplica en tiempo de ejecucion. Una sola definicion.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = join(AQUI, '..')
const DRY = process.argv.includes('--dry')

const h = JSON.parse(readFileSync(join(AQUI, 'holdout.json'), 'utf8'))

// Mismo criterio que scripts/lib/nucleo.mjs: J en ajuste por encima de 0,15,
// y en reserva conserva al menos la mitad y sigue siendo positiva.
const CRITERIO = 'J_ajuste > 0,15 y J_reserva ≥ 50% de J_ajuste y J_reserva > 0'
const esAlta = f => f.J_ajuste > 0.15 && f.J_reserva > 0 && f.J_reserva >= f.J_ajuste / 2

const candidatas = h.filas.filter(f => f.J_ajuste > 0.15)
const alta = candidatas.filter(esAlta).map(f => f.id).sort()
const dudosa = candidatas.filter(f => !esAlta(f)).map(f => f.id).sort()

const salida = {
  _meta: {
    origen: 'research/holdout.json',
    generado_por: 'research/exporta-nucleo.mjs',
    generado: new Date().toISOString().slice(0, 10),
  },
  criterio: CRITERIO,
  n: h.n,
  alta,
  dudosa,
  filas: h.filas.map(f => ({
    id: f.id,
    J_ajuste: Number(f.J_ajuste.toFixed(3)),
    J_reserva: Number(f.J_reserva.toFixed(3)),
    caida: Number(f.caida.toFixed(3)),
  })),
}

console.log(`\n  exporta-nucleo\n`)
console.log(`  ajuste   pos=${h.n.ajuste.pos}  neg=${h.n.ajuste.neg}`)
console.log(`  reserva  pos=${h.n.reserva.pos}  neg=${h.n.reserva.neg}\n`)
console.log(`  ALTA (${alta.length}):    ${alta.join(', ') || '—'}`)
console.log(`  dudosa (${dudosa.length}):  ${dudosa.join(', ') || '—'}\n`)

if (DRY) console.log('  (--dry: no se escribe)\n')
else {
  writeFileSync(join(RAIZ, 'data', 'nucleo-validado.json'), JSON.stringify(salida, null, 2) + '\n', 'utf8')
  console.log('  escrito data/nucleo-validado.json\n')
}
