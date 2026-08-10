#!/usr/bin/env node
// slop-refine — bucle de refinamiento con humano en el lazo.
//
// Encadena escanear -> arreglar lo seguro -> volver a medir, y SE PARA cuando
// lo que queda exige una decision que la herramienta no puede tomar.
//
// LA REGLA QUE ORDENA ESTO. Solo se itera solo mientras el progreso sea
// medible y no queden hallazgos de CONFIANZA ALTA. Un hallazgo alta es uno
// cuya regla sobrevivio al conjunto reservado; ahi el juicio humano vale mas
// que otra pasada automatica, y seguir iterando seria fingir autonomia.
//
// Las preguntas al humano se construyen con el `why` y el `fix` que la propia
// regla declara en el catalogo. No hay tabla de consejos aparte: una tabla
// paralela se desincroniza del catalogo y acaba describiendo mal las reglas.
//
//   node scripts/slop-refine.mjs <ruta> [opciones]
//
//   --brand "Marca"      activa la prueba del cambio de nombre
//   --profile p          landing | producto | ambos   (por defecto producto)
//   --genre g            exenta reglas por decision estetica
//   --max-iter N         tope de iteraciones (por defecto 5)
//   --umbral N           puntuacion a partir de la cual se considera resuelto (80)
//   --auto-only          no genera preguntas: para en cuanto necesite humano
//   --status             imprime el estado guardado y sale
//   --apply-answer <id>  registra la respuesta a una pregunta
//   --answer-value "t"   valor de esa respuesta
//   --gen-questions      no aplica arreglos: solo mide y pregunta
//   --reset              descarta el estado y empieza de cero
//   --json               salida estructurada

import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const AQUI = dirname(fileURLToPath(import.meta.url))
const SCAN = join(AQUI, 'slop-scan.mjs')
const FIX = join(AQUI, 'slop-fix.mjs')

/* ── argumentos ── */

const argv = process.argv.slice(2)
const CON_VALOR = new Set(['--brand', '--profile', '--genre', '--max-iter', '--umbral', '--apply-answer', '--answer-value'])
const flag = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined }
const has = n => argv.includes(n)

if (has('--help') || has('-h')) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8')
    .split('\n').filter(l => l.startsWith('//')).map(l => l.replace(/^\/\/ ?/, '')).join('\n'))
  process.exit(0)
}

const posicional = argv.find((a, i) => !a.startsWith('--') && !CON_VALOR.has(argv[i - 1]))
if (!posicional) {
  // Sin ruta explicita esto escanearia el directorio actual entero. En este
  // repositorio eso son 213 proyectos de corpus y el proceso no termina.
  console.error('slop-refine: falta la ruta a analizar.\n  node scripts/slop-refine.mjs ./src --brand "TuMarca"')
  process.exit(2)
}

const SRC = resolve(posicional)
const BRAND = flag('--brand')
const PROFILE = flag('--profile') || 'producto'
const GENRE = flag('--genre')
const MAX_ITER = Number(flag('--max-iter') || 5)
const UMBRAL = Number(flag('--umbral') || 80)
const AUTO_ONLY = has('--auto-only')
const GEN_QUESTIONS = has('--gen-questions')
const STATUS = has('--status')
const RESPONDER = flag('--apply-answer')
const VALOR = flag('--answer-value')
const RESET = has('--reset')
const AS_JSON = has('--json')

const ESTADO = join(SRC, '.slop', 'refinamiento.json')

/* ── estado ── */

const nuevoEstado = () => ({
  _v: 1, ruta: SRC, iteracion: 0, estado: 'inicio',
  historial: [], preguntas: [], decisiones: [],
  umbrales: { puntuacion: UMBRAL, max_iteraciones: MAX_ITER },
})

function cargar() {
  if (RESET && existsSync(ESTADO)) rmSync(ESTADO, { force: true })
  if (!existsSync(ESTADO)) return nuevoEstado()
  try { return JSON.parse(readFileSync(ESTADO, 'utf8')) } catch { return nuevoEstado() }
}

function guardar(e) {
  mkdirSync(dirname(ESTADO), { recursive: true })
  writeFileSync(ESTADO, JSON.stringify(e, null, 2) + '\n', 'utf8')
}

/* ── invocacion de las herramientas hermanas ── */

// execFileSync con argumentos en array: sin shell, asi que las rutas con
// espacios no rompen nada y no hay inyeccion posible.
function correr(script, extra = []) {
  const args = [script, SRC, ...extra]
  if (BRAND) args.push('--brand', BRAND)
  if (PROFILE) args.push('--profile', PROFILE)
  if (GENRE) args.push('--genre', GENRE)
  try {
    return { ok: true, salida: execFileSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 64e6, stdio: ['pipe', 'pipe', 'pipe'] }) }
  } catch (e) {
    return { ok: false, error: (e.stderr || e.message || '').toString().trim().split('\n')[0], salida: e.stdout }
  }
}

function escanear() {
  const r = correr(SCAN, ['--json'])
  if (!r.ok && !r.salida) throw new Error(`slop-scan fallo: ${r.error}`)
  const texto = r.salida || ''
  const i = texto.indexOf('{')
  if (i < 0) throw new Error('slop-scan no devolvio JSON')
  return JSON.parse(texto.slice(i))
}

// Solo tiene sentido si el proyecto declara un contrato: sin el, slop-fix no
// sabe a que tipografia ni a que duracion normalizar.
function arreglarSeguros() {
  const r = correr(FIX, ['--apply-safe'])
  return r.ok
    ? { aplicado: true, salida: r.salida }
    : { aplicado: false, motivo: r.error || 'slop-fix no pudo ejecutarse' }
}

/* ── preguntas ── */

// Ojo con la forma del JSON: `nucleo.alta` es el CATALOGO de reglas de
// confianza alta —las que sobrevivieron al conjunto reservado—, no las que
// fallan. Las que fallan estan en `nucleo.fallan_alta`. Confundirlos hacia que
// un proyecto impecable pareciera tener ocho problemas.
const fallanAlta = scan => scan.nucleo?.fallan_alta ?? []
const fallanDudosa = scan => {
  const dudosa = new Set(scan.nucleo?.dudosa || [])
  return (scan.checks || []).filter(c => c.failed && c.tipo === 'procedencia' && dudosa.has(c.id)).map(c => c.id)
}

// Se construyen desde el propio catalogo. Cada pregunta lleva el porque y el
// arreglo que la regla declara, y sus ubicaciones concretas.
function preguntasDe(scan) {
  const alta = new Set(fallanAlta(scan))
  return (scan.checks || [])
    .filter(c => c.failed && c.tipo === 'procedencia' && alta.has(c.id))
    .map(c => ({
      id: `${c.id}-${(c.detail || '').length}`,
      regla: c.id,
      titulo: c.title,
      confianza: 'alta',
      sello: c.sello || null,
      por_que: c.why || null,
      que_hacer: c.fix || null,
      donde: (c.samples || []).slice(0, 3).map(s => `${s.file}:${s.line}`),
      estado: 'pendiente',
    }))
}

/* ── modos que no iteran ── */

const estado = cargar()

if (STATUS) {
  if (AS_JSON) console.log(JSON.stringify(estado, null, 2))
  else {
    console.log(`\n  slop-refine · ${estado.ruta}`)
    console.log(`  estado ${estado.estado} · iteracion ${estado.iteracion}\n`)
    if (estado.historial.length) {
      console.log('  iter  puntuacion  nucleo  alta  dudosa  accion')
      for (const h of estado.historial) {
        console.log(`  ${String(h.iteracion).padStart(4)}  ${String(h.puntuacion).padStart(10)}  ${String(h.nucleo ?? '-').padStart(6)}  ${String(h.alta).padStart(4)}  ${String(h.dudosa).padStart(6)}  ${h.accion}`)
      }
    }
    const pend = estado.preguntas.filter(p => p.estado === 'pendiente')
    if (pend.length) {
      console.log(`\n  ${pend.length} pregunta(s) pendiente(s):`)
      for (const p of pend) console.log(`    ${p.id.padEnd(12)} ${p.titulo}`)
    }
    console.log('')
  }
  process.exit(0)
}

if (RESPONDER) {
  if (!VALOR) { console.error('slop-refine: --apply-answer exige --answer-value'); process.exit(2) }
  const p = estado.preguntas.find(x => x.id === RESPONDER)
  if (!p) { console.error(`slop-refine: no hay pregunta ${RESPONDER}`); process.exit(2) }
  p.estado = 'respondida'
  estado.decisiones.push({ pregunta: RESPONDER, regla: p.regla, valor: VALOR, iteracion: estado.iteracion })
  estado.estado = 'respuesta_registrada'
  guardar(estado)
  console.log(`slop-refine: registrada la decision sobre ${p.regla}.`)
  console.log('  La respuesta queda en el historial; el cambio en el codigo lo haces tu o slop-fix.')
  console.log('  Vuelve a ejecutar slop-refine para medir el efecto.')
  process.exit(0)
}

/* ── bucle ── */

const hitos = []
let scan = escanear()
let previa = null
let motivo = null

for (let i = 1; i <= MAX_ITER; i++) {
  estado.iteracion = i
  const alta = fallanAlta(scan).length
  const dudosa = fallanDudosa(scan).length
  const resuelto = scan.score >= UMBRAL && alta === 0

  hitos.push({ iteracion: i, puntuacion: scan.score, nucleo: scan.nucleo?.score ?? null, alta, dudosa, accion: 'medido' })

  if (resuelto) { motivo = 'resuelto'; break }

  // Progreso: si una pasada de arreglos no mueve la puntuacion, insistir no la
  // va a mover. Se para y se pregunta.
  if (previa !== null && scan.score <= previa) { motivo = 'sin_progreso'; break }
  previa = scan.score

  if (alta > 0) { motivo = 'requiere_humano'; break }
  if (GEN_QUESTIONS) { motivo = 'solo_preguntas'; break }

  const fix = arreglarSeguros()
  hitos[hitos.length - 1].accion = fix.aplicado ? 'arreglos_seguros' : `sin_arreglos (${fix.motivo})`
  if (!fix.aplicado) { motivo = 'sin_arreglos_aplicables'; break }

  scan = escanear()
  if (i === MAX_ITER) motivo = 'tope_iteraciones'
}
motivo ??= 'tope_iteraciones'

const preguntas = (motivo === 'requiere_humano' || motivo === 'solo_preguntas') && !AUTO_ONLY ? preguntasDe(scan) : []
const yaRespondidas = new Set(estado.decisiones.map(d => d.pregunta))
for (const p of preguntas) if (yaRespondidas.has(p.id)) p.estado = 'respondida'

estado.historial.push(...hitos)
estado.preguntas = preguntas
estado.estado = motivo
guardar(estado)

/* ── salida ── */

const resumen = {
  ruta: SRC, motivo, iteraciones: hitos.length,
  puntuacion: scan.score, nucleo: scan.nucleo?.score ?? null,
  alta: fallanAlta(scan), dudosa: fallanDudosa(scan),
  preguntas, historial: hitos, estado: ESTADO,
}

if (AS_JSON) { console.log(JSON.stringify(resumen, null, 2)); process.exit(0) }

const TITULO = {
  resuelto: 'Resuelto',
  requiere_humano: 'Parado: quedan hallazgos de confianza alta',
  sin_progreso: 'Parado: los arreglos automaticos ya no mueven la puntuacion',
  sin_arreglos_aplicables: 'Parado: no hay arreglos automaticos disponibles',
  solo_preguntas: 'Parado a peticion: solo medir y preguntar',
  tope_iteraciones: 'Parado: tope de iteraciones',
}

console.log(`\n  slop-refine · ${SRC}\n`)
console.log('  iter  puntuacion  nucleo  alta  dudosa  accion')
for (const h of hitos) {
  console.log(`  ${String(h.iteracion).padStart(4)}  ${String(h.puntuacion).padStart(10)}  ${String(h.nucleo ?? '-').padStart(6)}  ${String(h.alta).padStart(4)}  ${String(h.dudosa).padStart(6)}  ${h.accion}`)
}
console.log(`\n  ${TITULO[motivo]}`)
console.log(`  puntuacion ${scan.score}/100 · nucleo ${scan.nucleo?.score ?? '-'}/100\n`)

if (preguntas.length) {
  console.log(`  ── ${preguntas.length} decision(es) que no puede tomar la herramienta ──\n`)
  for (const p of preguntas) {
    console.log(`  ${p.id} · ${p.regla} — ${p.titulo}${p.sello ? `  [${p.sello}]` : ''}`)
    if (p.por_que) console.log(`      Por que delata: ${p.por_que}`)
    if (p.que_hacer) console.log(`      Que hacer:      ${p.que_hacer}`)
    if (p.donde.length) console.log(`      Donde:          ${p.donde.join(', ')}`)
    console.log('')
  }
  console.log('  Estas reglas sobrevivieron al conjunto reservado: son las unicas que este')
  console.log('  repositorio puede defender dentro y fuera de muestra. Por eso se paran aqui')
  console.log('  en vez de intentar otra pasada automatica.\n')
  console.log(`  Registrar una decision:`)
  console.log(`    node scripts/slop-refine.mjs ${posicional} --apply-answer ${preguntas[0].id} --answer-value "lo que decidiste"`)
  console.log(`  Ver el estado:`)
  console.log(`    node scripts/slop-refine.mjs ${posicional} --status\n`)
} else if (motivo === 'resuelto') {
  console.log('  Siguiente paso: congela el resultado y vigila la deriva.')
  console.log(`    node scripts/slop-scan.mjs ${posicional} --write-baseline`)
  console.log(`    node scripts/slop-scan.mjs ${posicional} --since-baseline --fail-on-new-drift\n`)
}
