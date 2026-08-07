#!/usr/bin/env node
// Corre el escaner sobre el corpus etiquetado y emite la tabla por regla.
//
//   node research/measure.mjs [--out research/medicion.json]
//
// MEDIDA DE SEPARACION. Se reporta la J de Youden (TPR - FPR) como medida
// principal, y el lift (TPR/FPR) como secundaria.
//
// Por que J y no lift: para un detector binario, J = sensibilidad +
// especificidad - 1, o sea "cuanto mejor que el azar", acotada en [-1, 1] y
// simetrica. El lift es mas intuitivo pero explota cuando FPR tiende a cero con
// muestras pequenas: una regla que dispara en 1 de 30 positivos y 0 de 30
// negativos da lift infinito y J = 0,033. Con n≈30 eso importa.
//
// Se acompana de intervalos de Wilson al 95%: con n≈30 una diferencia de
// rates sin intervalo no significa nada.

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = join(AQUI, '..')
const ESCANER = join(RAIZ, 'scripts', 'slop-scan.mjs')
const arg = n => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : undefined }
const SALIDA = arg('--out') || join(AQUI, 'medicion.json')

const corpus = JSON.parse(readFileSync(join(AQUI, 'corpus.json'), 'utf8'))

/* ── estadistica ── */

// Intervalo de Wilson al 95%. Mejor que el normal con n pequeno y p extremo.
function wilson(exitos, n, z = 1.96) {
  if (n === 0) return [0, 0]
  const p = exitos / n
  const d = 1 + z * z / n
  const centro = (p + z * z / (2 * n)) / d
  const margen = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
  return [Math.max(0, centro - margen), Math.min(1, centro + margen)]
}

/* ── ejecucion del escaner ── */

const porProyecto = []
for (const e of corpus.entradas) {
  const dir = join(AQUI, '.corpus', e.id)
  if (!existsSync(join(dir, '.listo'))) continue
  let salida
  try {
    salida = JSON.parse(execFileSync('node', [ESCANER, dir, '--json', '--profile', 'ambos'],
      { encoding: 'utf8', maxBuffer: 256e6, timeout: 180_000 }))
  } catch (err) {
    console.error(`  fallo ${e.id}: ${String(err.message).slice(0, 80)}`)
    continue
  }
  porProyecto.push({
    id: e.id, clase: e.clase, generador: e.generador, stack: e.stack,
    score: salida.score, archivos: salida.filesScanned, tokens: salida.tokens,
    dispara: Object.fromEntries(salida.checks.map(c => [c.id, !!c.failed])),
    titulos: Object.fromEntries(salida.checks.map(c => [c.id, c.title])),
    pesos: Object.fromEntries(salida.checks.map(c => [c.id, c.weight])),
  })
  process.stderr.write('.')
}
console.error(`\n${porProyecto.length} proyectos medidos`)

const grupo = c => porProyecto.filter(p => p.clase === c)
const POS = grupo('pos'), NEG_S = grupo('neg_stack'), NEG_C = grupo('neg_classic')
const NEG_TODOS = [...NEG_S, ...NEG_C]

const IDS = [...new Set(porProyecto.flatMap(p => Object.keys(p.dispara)))].sort()
const titulo = id => porProyecto.find(p => p.titulos[id])?.titulos[id] || id
const peso = id => porProyecto.find(p => p.pesos[id] !== undefined)?.pesos[id]

const tasa = (grupo, id) => {
  const n = grupo.length
  const k = grupo.filter(p => p.dispara[id]).length
  return { k, n, p: n ? k / n : 0, ic: wilson(k, n) }
}

const filas = IDS.map(id => {
  const pos = tasa(POS, id)
  const negS = tasa(NEG_S, id)
  const negC = tasa(NEG_C, id)
  const negT = tasa(NEG_TODOS, id)

  // Comparacion valida: pos vs neg_stack (emparejado por Tailwind).
  const J = pos.p - negS.p
  const lift = negS.p > 0 ? pos.p / negS.p : (pos.p > 0 ? Infinity : 0)
  const vp = pos.k, fp = negS.k
  const precision = (vp + fp) > 0 ? vp / (vp + fp) : null

  // Cuanto de la separacion se debe a stack/epoca y no a procedencia:
  // si la regla separa mucho de neg_classic pero poco de neg_stack, esta
  // midiendo Tailwind moderno.
  const J_classic = pos.p - negC.p
  const efectoStack = J_classic - J

  return {
    id, titulo: titulo(id), peso: peso(id),
    pos: pos.p, pos_k: pos.k, pos_n: pos.n, pos_ic: pos.ic,
    neg_stack: negS.p, neg_stack_k: negS.k, neg_stack_n: negS.n, neg_stack_ic: negS.ic,
    neg_classic: negC.p, neg_classic_k: negC.k, neg_classic_n: negC.n,
    neg_todos: negT.p,
    J, lift, precision, J_classic, efectoStack,
    // Se solapan los intervalos de confianza? Si si, no hay evidencia de separacion.
    solapan: !(pos.ic[0] > negS.ic[1] || negS.ic[0] > pos.ic[1]),
  }
}).sort((a, b) => b.J - a.J)

/* ── control del confundido de TAMANO ──
   Es el confundido dominante y no es opcional: mas archivos = mas superficie
   donde algo casa. En la primera pasada neg_stack promediaba 47 archivos con
   6,3 reglas disparando y pos 123 con 11,7. Sin estratificar, buena parte de
   la J medida seria solo diferencia de tamano.

   Se estratifica por numero de archivos y se recalcula J dentro de cada
   estrato. Solo se considera informativo el estrato donde ambas clases tienen
   al menos 6 proyectos. */

const ESTRATOS = [
  { nombre: 'pequeno', min: 0, max: 60 },
  { nombre: 'medio', min: 60, max: 200 },
  { nombre: 'grande', min: 200, max: Infinity },
]
const enEstrato = (p, e) => p.archivos >= e.min && p.archivos < e.max

const estratificado = ESTRATOS.map(e => {
  const pos = POS.filter(p => enEstrato(p, e))
  const neg = NEG_S.filter(p => enEstrato(p, e))
  const informativo = pos.length >= 6 && neg.length >= 6
  const porRegla = {}
  if (informativo) {
    for (const id of IDS) {
      const tp = pos.filter(p => p.dispara[id]).length / pos.length
      const fp = neg.filter(p => p.dispara[id]).length / neg.length
      porRegla[id] = { pos: tp, neg: fp, J: tp - fp }
    }
  }
  return { estrato: e.nombre, rango: `${e.min}-${e.max === Infinity ? 'inf' : e.max}`, n_pos: pos.length, n_neg: neg.length, informativo, porRegla }
})

/* Banda comun de solapamiento. Los tercios dejan estratos demasiado finos
   (pos=6). Se recorta a la banda donde ambas distribuciones de tamano coexisten
   y se recalcula J ahi: es una sola comparacion con mas muestra que cualquiera
   de los estratos. */
const BANDA = { min: 20, max: 200 }
const enBanda = p => p.archivos >= BANDA.min && p.archivos < BANDA.max
const POS_B = POS.filter(enBanda), NEG_B = NEG_S.filter(enBanda)

for (const f of filas) {
  const tp = POS_B.length ? POS_B.filter(p => p.dispara[f.id]).length / POS_B.length : null
  const fp = NEG_B.length ? NEG_B.filter(p => p.dispara[f.id]).length / NEG_B.length : null
  f.pos_banda = tp
  f.neg_banda = fp
  f.J_banda = (tp === null || fp === null) ? null : tp - fp
  // Cuanto de la J bruta se evapora al igualar tamano.
  f.caida_por_tamano = f.J_banda === null ? null : f.J - f.J_banda
  f.solapan_banda = (tp === null || fp === null) ? true : (() => {
    const a = wilson(POS_B.filter(p => p.dispara[f.id]).length, POS_B.length)
    const b = wilson(NEG_B.filter(p => p.dispara[f.id]).length, NEG_B.length)
    return !(a[0] > b[1] || b[0] > a[1])
  })()
}
filas.sort((a, b) => (b.J_banda ?? -9) - (a.J_banda ?? -9))

const salida = {
  _meta: {
    generado: 'research/measure.mjs',
    n: { pos: POS.length, neg_stack: NEG_S.length, neg_classic: NEG_C.length },
    medida_principal: 'J de Youden (TPR - FPR) sobre pos vs neg_stack',
    nota_confundido_stack: 'efectoStack = J(pos vs neg_classic) - J(pos vs neg_stack). Positivo grande = la regla mide stack/epoca.',
    nota_confundido_tamano: 'J_estratificado se calcula dentro del estrato de tamano informativo. Si J bruta es alta y J_estratificado ~0, la regla mide tamano de la base de codigo.',
    tamano_medio: {
      pos: POS.reduce((a, p) => a + p.archivos, 0) / (POS.length || 1),
      neg_stack: NEG_S.reduce((a, p) => a + p.archivos, 0) / (NEG_S.length || 1),
      neg_classic: NEG_C.reduce((a, p) => a + p.archivos, 0) / (NEG_C.length || 1),
    },
  },
  banda_comun: { rango: BANDA, n_pos: POS_B.length, n_neg: NEG_B.length },
  estratificado,
  filas,
  proyectos: porProyecto.map(({ titulos, pesos, ...r }) => r),
}
writeFileSync(SALIDA, JSON.stringify(salida, null, 2), 'utf8')

/* ── tabla ── */

const pct = x => (x * 100).toFixed(0).padStart(3) + '%'
const num = (x, d = 2) => (x === Infinity ? '  inf' : x.toFixed(d).padStart(5))

console.log(`\n  n: pos=${POS.length}  neg_stack=${NEG_S.length}  neg_classic=${NEG_C.length}`)
console.log(`  archivos de media: pos=${(salida._meta.tamano_medio.pos).toFixed(0)}  neg_stack=${(salida._meta.tamano_medio.neg_stack).toFixed(0)}  neg_classic=${(salida._meta.tamano_medio.neg_classic).toFixed(0)}`)
for (const s of estratificado) console.log(`  estrato ${s.estrato} (${s.rango} archivos): pos=${s.n_pos} neg=${s.n_neg}${s.informativo ? '  <- informativo' : ''}`)
console.log('')
console.log(`  banda comun ${BANDA.min}-${BANDA.max} archivos: pos=${POS_B.length} neg=${NEG_B.length}\n`)
console.log('  ID     peso  pos   neg_s    J     posB  negB   J_banda  caida  sepB?')
console.log('  ' + '-'.repeat(80))
for (const f of filas) {
  const jb = f.J_banda === null ? '   —' : num(f.J_banda)
  const cd = f.caida_por_tamano === null ? '   —' : num(f.caida_por_tamano)
  console.log(`  ${f.id.padEnd(6)} ${String(f.peso ?? '-').padStart(3)}  ${pct(f.pos)}  ${pct(f.neg_stack)}  ${num(f.J)}   ${pct(f.pos_banda ?? 0)}  ${pct(f.neg_banda ?? 0)}   ${jb}  ${cd}    ${f.solapan_banda ? 'no' : 'SI'}`)
}
console.log(`\n  "sep?" = los intervalos de Wilson al 95% NO se solapan.`)
console.log(`  "J_tam" = J recalculada dentro del estrato de tamano informativo.`)
console.log(`  Guardado en ${SALIDA}\n`)
