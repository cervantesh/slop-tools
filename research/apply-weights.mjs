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
//
// SEGUNDA MEDICION (corpus ampliado a 123 proyectos medidos; banda pos=34,
// neg=32, frente a 20/23 de la primera). Seis reglas separan ahora, no cuatro.
const DECISIONES = {
  // Separan con intervalos disjuntos en la banda.
  UX2: [3, 'J 0.45 en banda con intervalos separados y n mayor; sube de 2 a 3'],
  L2: [3, 'J 0.45 en banda, intervalos separados, confirmada con n mayor'],
  C4: [3, 'J 0.39 en banda con intervalos separados. Ajustada en muestra dio 0.55; fuera de muestra encoge a 0.39 y SIGUE separando'],
  L1: [3, 'J 0.36 en banda, intervalos separados. En la primera medicion tenia J alta sin significacion: era falta de n, no falta de senal'],
  UX6: [3, 'J 0.34 en banda, intervalos separados. Igual que L1: la primera medicion no tenia potencia para verla'],
  D5: [3, 'J 0.26 en banda, intervalos separados. Precision alta y tasa negativa del 3%'],
  A3: [3, 'J 0.24 en banda con intervalos separados: 24% frente a 0%. Daba cero disparos hasta que se anadio el sustrato de clases de utilidad'],

  // Dejan de separar o no despegan.
  E7: [2, 'J 0.25 pero los intervalos vuelven a solaparse con n mayor: dispara en el 94% de lo generado y el 69% de lo humano'],
  K3: [1, 'Ya puede disparar (24% frente a 18%) tras el cambio de sustrato, y con oportunidad real da J 0.02'],
  A1: [2, 'J 0.13 e intervalos solapados: el tell mas citado de la bibliografia rinde poco'],
  D1: [1, 'J 0.02 en banda: enlazar bancos de imagenes es igual de comun en ambas clases'],
  AS9: [1, 'J -0.00: la estetica crema/serif/terracota no aparece en el corpus'],
  T1: [1, 'J -0.08: dispara mas en diseno humano'],
  HM8: [1, 'J -0.17 con intervalos separados apuntando al reves: es un detector de diseno humano, como lo fue F2'],

  // C1 cierra su pregunta abierta.
  C1: [1, 'Con el sustrato de clases ya dispara (16% frente a 15%) y da J -0.01. La fuente lo llamaba el indicador aislado mas fiable; medido con oportunidad real, no lo es'],

  // TERCERA MEDICION — las ocho reglas de prosa y codigo entraron sin medir.
  CS3: [2, 'J 0.28 en banda (50% frente a 22%), la mas alta de las nuevas. Intervalos solapados, pero sube de 1 a 2'],
  P4: [2, 'J 0.18 en banda con 0% de falsos positivos: dispara en el 18% de lo generado y en ninguno humano'],
  P1: [1, 'J 0.00 en banda: la prosa de marketing casi no existe en repositorios de codigo'],
  P2: [1, 'J 0.00 en banda, mismo motivo que P1'],
  P3: [1, 'J 0.03 en banda'],
  CS1: [1, 'J 0.00 y dispara mas en humano fuera de banda. El comentario narrativo no aparece en el codigo publicado'],
  CS2: [1, 'J -0.10: el catch vacio es MAS comun en codigo humano. Se reclasifica a defecto'],
}

// Comprobaciones que miden calidad, no procedencia. Salen de la puntuacion.
const A_DEFECTO = {
  CS2: 'J -0.10: dispara mas en diseno humano. Un catch vacio es un defecto real, pero no dice quien escribio el codigo',
  CS3: 'silenciar el comprobador de tipos es deuda tecnica; que correlacione con generacion no lo convierte en prueba de autoria',
}

// Reglas sin oportunidad de disparar en este corpus. No se eliminan: eliminar
// por falta de oportunidad seria el mismo error que aceptarlas sin medida.
const NO_MEDIBLES = {
  A4: 'cero disparos en la banda; exige un hero con resplandor radial',
  HM1: 'cero disparos en 123 proyectos',
  L3: 'especifica del espanol y el corpus es casi todo ingles: sigue sin evaluar',
}

// Las comprobaciones programaticas viven en codigo, no en el catalogo. Su
// evidencia se exporta a un JSON que checks.mjs carga en tiempo de ejecucion,
// para que nadie tenga que copiar cifras a mano de una medicion a un fichero
// fuente — que es exactamente como se desincronizan.
const validacionExterna = {}
for (const f of medicion.filas) {
  validacionExterna[f.id] = {
    corpus: 'research/corpus.json',
    n: { pos: medicion.banda_comun.n_pos, neg: medicion.banda_comun.n_neg },
    J_banda: Number((f.J_banda ?? 0).toFixed(3)),
    pos: Number((f.pos_banda ?? 0).toFixed(3)),
    neg: Number((f.neg_banda ?? 0).toFixed(3)),
    separa: f.solapan_banda === false,
  }
}
for (const [id, nota] of Object.entries(NO_MEDIBLES)) {
  if (validacionExterna[id]) { validacionExterna[id].estado = 'no_medible'; validacionExterna[id].nota = nota }
}
for (const [id, [, motivo]] of Object.entries(DECISIONES)) {
  if (validacionExterna[id]) validacionExterna[id].decision = motivo
}
if (!DRY) {
  writeFileSync(join(AQUI, '..', 'data', 'validacion.json'),
    JSON.stringify({ _meta: { origen: 'research/medicion.json', generado_por: 'research/apply-weights.mjs' }, reglas: validacionExterna }, null, 2) + '\n', 'utf8')
}

for (const r of catalogo.rules) {
  if (A_DEFECTO[r.id]) { r.tipo = 'defecto'; r.motivo_defecto = A_DEFECTO[r.id] }
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
