#!/usr/bin/env node
// Comprueba que los conteos que afirma la documentacion coinciden con la
// realidad del codigo.
//
// POR QUE EXISTE. Los conteos han derivado tres veces: rubric.md se titulaba
// "28 comprobaciones" mientras listaba 39; README y SKILL siguieron diciendo
// 28+21 despues de que fueran 32+26. Ningun documento miente a proposito —
// simplemente nadie puede acordarse de actualizar cinco archivos cada vez que
// entra una regla.
//
// La solucion no es prometer acordarse: es que falle el test.
//
//   node bench/verifica-conteos.mjs

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = join(AQUI, '..')
const leer = p => readFileSync(join(RAIZ, p), 'utf8')

/* ── realidad ── */

const reglas = JSON.parse(leer('data/rules.json')).rules
const checks = leer('scripts/lib/checks.mjs')

const real = {
  declarativas: reglas.length,
  programaticas: (checks.match(/\{\s*id: '[A-Z]+\d+'/g) || []).length,
  rubricaGeneral: (leer('references/rubric.md').match(/^\| [A-Z]+\d+ \|/gm) || []).length,
}
real.automaticas = real.declarativas + real.programaticas

/* ── lo que afirma la documentacion ── */

// Cada afirmacion declara que numero deberia aparecer y en que frase.
const afirmaciones = [
  { archivo: 'README.md', patron: /Catálogo declarativo: (\d+) reglas/, esperado: real.declarativas, que: 'reglas declarativas' },
  { archivo: 'README.md', patron: /Las (\d+) comprobaciones que exigen ratios/, esperado: real.programaticas, que: 'comprobaciones programaticas' },
  { archivo: 'SKILL.md', patron: /(\d+) reglas\s*\n?declarativas en `data\/rules\.json`/, esperado: real.declarativas, que: 'reglas declarativas' },
  { archivo: 'SKILL.md', patron: /más (\d+) comprobaciones programáticas/, esperado: real.programaticas, que: 'comprobaciones programaticas' },
  { archivo: 'references/rubric.md', patron: /^# Rúbrica general — (\d+) comprobaciones/m, esperado: real.rubricaGeneral, que: 'filas de la rubrica general' },
]

let fallos = 0
console.log('\n  verifica-conteos\n')
console.log(`  reales:  ${real.declarativas} declarativas + ${real.programaticas} programaticas = ${real.automaticas} automaticas`)
console.log(`           ${real.rubricaGeneral} filas en la rubrica general\n`)

for (const a of afirmaciones) {
  const texto = leer(a.archivo)
  const m = texto.match(a.patron)
  if (!m) {
    console.log(`  ?  ${a.archivo}: no se encontro la afirmacion sobre ${a.que}`)
    fallos++
    continue
  }
  const dicho = Number(m[1])
  if (dicho !== a.esperado) {
    console.log(`  x  ${a.archivo}: dice ${dicho} ${a.que}, son ${a.esperado}`)
    fallos++
  } else {
    console.log(`  ok ${a.archivo}: ${dicho} ${a.que}`)
  }
}

console.log('')
if (fallos) {
  console.error(`verifica-conteos: ${fallos} conteo(s) desactualizado(s)`)
  process.exit(1)
}
