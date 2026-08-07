#!/usr/bin/env node
// Aplica a data/rules.json los cambios de peso que la medicion justifica, y
// estampa en cada regla la evidencia que los respalda.
//
//   node research/apply-weights.mjs [--dry]
//
// Las decisiones se declaran aqui, no se derivan automaticamente: bajar un peso
// porque J < 0.1 seria una regla arbitraria mas. Cada entrada cita su fila.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const DRY = process.argv.includes('--dry')

const medicion = JSON.parse(readFileSync(join(AQUI, 'medicion.json'), 'utf8'))
const rutaReglas = join(AQUI, '..', 'data', 'rules.json')
const catalogo = JSON.parse(readFileSync(rutaReglas, 'utf8'))

const fila = id => medicion.filas.find(f => f.id === id)

// id -> [peso nuevo, motivo]
const DECISIONES = {
  D5: [3, 'J 0.41 en banda, precision 93%, lift 18, intervalos separados: el discriminador mas limpio del catalogo'],
  L2: [3, 'J 0.42 en banda, intervalos separados'],
  UX2: [2, 'J 0.46 en banda, la mas alta, intervalos separados; precision 65% aconseja 2 y no 3'],
  A1: [2, 'J 0.13 e intervalos solapados: el tell mas citado de la bibliografia rinde poco'],
  D1: [1, 'J 0.03 en banda (20% frente a 17%): enlazar bancos de imagenes es igual de comun en ambas clases'],
  AS9: [1, 'J -0.04: cero disparos en la clase generada. La estetica crema/serif/terracota no aparece en el corpus'],
}

// Reglas sin oportunidad de disparar en este corpus. No se eliminan: eliminar
// por falta de oportunidad seria el mismo error que aceptarlas sin medida.
const NO_MEDIBLES = {
  A4: 'cero disparos en la banda; exige un hero con resplandor radial',
  A5: 'cero disparos en 71 proyectos',
  AS2: 'cero disparos en 71 proyectos; el hover vive en clases de utilidad, no en CSS',
}

let cambiados = 0, marcados = 0
for (const r of catalogo.rules) {
  const f = fila(r.id)
  if (f) {
    r.validado = {
      corpus: 'research/corpus.json',
      n: { pos: medicion.banda_comun.n_pos, neg: medicion.banda_comun.n_neg },
      J_banda: Number((f.J_banda ?? 0).toFixed(3)),
      pos: Number((f.pos_banda ?? 0).toFixed(3)),
      neg: Number((f.neg_banda ?? 0).toFixed(3)),
      separa: f.solapan_banda === false,
    }
  }
  if (NO_MEDIBLES[r.id]) { r.validado = { ...(r.validado || {}), estado: 'no_medible', nota: NO_MEDIBLES[r.id] }; marcados++ }
  if (DECISIONES[r.id]) {
    const [nuevo, motivo] = DECISIONES[r.id]
    if (r.weight !== nuevo) {
      console.log(`  ${r.id}: peso ${r.weight} -> ${nuevo}`)
      console.log(`      ${motivo}`)
      r.weight = nuevo
      cambiados++
    }
    r.validado = { ...(r.validado || {}), decision: motivo }
  }
}

catalogo._meta.validacion = {
  informe: 'research/RESULTADOS.md',
  medido: medicion._meta.n,
  banda: medicion.banda_comun,
  nota: 'El campo validado de cada regla trae su fila de la tabla. Ausencia de validado = regla no presente en la medicion.',
}

if (DRY) console.log('\n(--dry: no se escribe)')
else writeFileSync(rutaReglas, JSON.stringify(catalogo, null, 2) + '\n', 'utf8')
console.log(`\n${cambiados} pesos cambiados · ${marcados} marcadas no medibles · ${catalogo.rules.length} reglas con evidencia estampada`)
