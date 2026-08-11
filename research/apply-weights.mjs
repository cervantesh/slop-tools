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

  // CUARTA MEDICION — corpus ampliado otra vez (banda pos=39, neg=76 frente a
  // 34/32) y primera medida de las 22 reglas portadas de impeccable.
  //
  // De las 21 portadas que puntuan o pueden puntuar, DOS separan. El resto no.
  // Ver research/RESULTADOS.md, seccion del porte.
  UX14: [2, 'J 0.27 en banda con intervalos separados: 28% frente a 1%. Es la octava J mas alta del catalogo entero y la mejor de todo lo portado. Sube de 1 a 2'],
  C6: [2, 'J 0.22 en banda con intervalos separados: 28% frente a 7%. El filete fino CON sombra ancha discrimina donde C1 —el filete a secas, J -0.01— no discriminaba. Sube de 1 a 2'],

  // Las que se midieron y no despegan. Entraron con peso 2 por parecerse a
  // tells conocidos; medidas, no lo son.
  B9: [1, 'J -0.05 en banda: la jerarquia plana dispara mas en proyectos humanos (0% frente a 5%). La hipotesis de impeccable no se sostiene sobre este corpus'],
  E8: [1, 'J 0.04 en banda (5% frente a 1%): los sintagmas de marketing casi no aparecen en repositorios de codigo, igual que le paso a P1 y P2'],
  K5: [1, 'J -0.00 en banda (3% frente a 3%). La prueba algoritmica del fondo crema alcanza mas que los cuatro hexes de AS9 y aun asi no separa: la estetica del papel crema sigue sin aparecer en el corpus'],
  D7: [1, 'J -0.03 en banda: cero disparos en generado y 3% en humano. La escena montada con primitivas SVG existe, pero no del lado que suponiamos'],

  // Una regla del nucleo pierde la separacion al ampliar el corpus.
  UX6: [2, 'J 0.09 en banda con intervalos solapados (56% frente a 47%), cuando en la medicion anterior daba 0.34 y separaba. Baja de 3 a 2. Es el riesgo que declaraba el informe: la J de una regla ajustada con n pequena encoge al ampliar la muestra'],

  // QUINTA REVISION — el sello de confianza no sobrevive a la reserva.
  //
  // Peso 3 significa "discriminante validado". Estas separan en la banda
  // completa pero se desploman fuera de muestra, asi que el 3 vende mas de lo
  // que la evidencia sostiene. Bajan UN escalon, no dos: la reserva es n=10
  // positivos / 20 negativos, y a esa escala el desplome es tan ruidoso como
  // la subida simetrica de B2 (-0.04 -> +0.35) que nadie propone ascender.
  // Descontar el ruido en una sola direccion seria elegir el resultado.
  // SEXTA MEDICION — la reserva pasa de 10/20 a 65/45 y desmiente tres de las
  // cinco demociones de la quinta. No cambio la regla: cambio la potencia con
  // que se la miraba. Los "desplomes" de D5, A3 y HM4 eran la varianza de una
  // reserva de diez positivos, que es justo lo que se argumento al negarse a
  // bajarlas dos escalones. Un escalon se pudo deshacer; dos habrian dejado el
  // catalogo sin sus mejores reglas por un artefacto de muestreo.
  D5: [3, 'Se revierte a 3. Con reserva 65/45 da 0.33 -> 0.27 y aguanta el criterio. El 0.31 -> 0.05 que motivo la bajada era ruido de una reserva de 10 positivos'],
  HM4: [2, 'Se revierte a 2. Con reserva 65/45 da 0.22 -> 0.20. El 0.33 -> 0.00 anterior no describia la regla, describia el tamano de la reserva'],
  UX14: [1, 'Se mantiene en 1: con la reserva ampliada sigue sin aguantar (0.37 -> 0.17, por debajo del 50% exigido). Es la unica de las cinco cuyo desplome resiste al aumento de n'],
}

// Comprobaciones que miden calidad, no procedencia. Salen de la puntuacion.
//
// QUINTA REVISION — arbitraje adversarial (ver research/ARBITRAJE.md). Veinte
// identificadores dejan de votar. Ninguno se borra: el patron sigue en el
// catalogo y sigue apareciendo en --plan y en slop-fix como consejo de arreglo.
// Lo que se retira es el VOTO, no el detector.
//
// El argumento que zanjo los tres bloques: "no refutada" no es lo mismo que
// "sigue puntuando". Una regla que no ha tenido oportunidad de fallar no puede
// alegar en contra del proyecto escaneado.
const A_DEFECTO = {
  CS2: 'J -0.10: dispara mas en diseno humano. Un catch vacio es un defecto real, pero no dice quien escribio el codigo',
  CS3: 'silenciar el comprobador de tipos es deuda tecnica; que correlacione con generacion no lo convierte en prueba de autoria',

  // NO SE REPITE LA CIFRA AQUI. Estas frases llevaban la J escrita a mano y la
  // sexta medicion las dejo obsoletas de golpe: el corpus paso de 213 a 644
  // proyectos y A6, por ejemplo, cambio de -0.013 a +0.034. La cifra viva viaja
  // en el bloque `validado` de cada regla, que se regenera; aqui va el MOTIVO,
  // que es lo que no caduca al remedir. Es el mismo fallo de copiar numeros a
  // mano que ya costo tres correcciones en este repositorio.

  // No separan pese a tener oportunidad real de disparar. Sus tasas en ambas
  // clases son indistinguibles; el signo de la J es ruido de muestreo.
  A6: 'no separa: tasas indistinguibles entre generado y humano, con muy pocos disparos en ambas clases',
  B4: 'no separa, y lo poco que hace apunta al reves: dispara mas en proyectos humanos',
  E2: 'no separa: tasas practicamente iguales en las dos clases',
  UX4: 'no separa y apunta al reves: la curva de Material aparece mas en diseno humano',
  UX12: 'no separa: tasas indistinguibles',
  AS9: 'no separa. La estetica crema/serif/terracota apenas aparece en el corpus',

  // Entraron con peso 2 por parecerse a tells conocidos. Medidas con
  // oportunidad real, no lo son. Bajarlas a peso 1 se descarto por cosmetico:
  // seguirian votando sobre evidencia que no existe.
  C2: 'no separa. Entro con peso 2 por parecerse a un tell conocido; medida, no lo es',
  UX8: 'no separa: la diferencia entre clases cabe dentro del intervalo',
  AS1: 'no separa, y dispara mucho en ambas clases: la forma mas cara de no discriminar',
  E9: 'la cadencia aforistica es prosa de landing y el corpus son repositorios de codigo',

  // Sin oportunidad, o casi. Se conservan enteras —el patron puede valer el dia
  // que el corpus incluya paginas de aterrizaje— pero no votan mientras no
  // hayan tenido ocasion de equivocarse.
  HM5: 'apenas tiene oportunidad de disparar en este corpus: sin ocasion de equivocarse no hay evidencia que alegar',
  P1: 'la prosa de marketing casi no existe en repositorios de codigo',
  P2: 'mismo motivo que P1: no hay prosa de landing en el corpus',
  CS1: 'el comentario narrativo no aparece en el codigo publicado',
  C5: 'exige un filete de acento y un radio en el mismo bloque CSS, y en un proyecto Tailwind eso vive en clases: casi nunca tiene ocasion de disparar',
  S8: 'exige la baldosa, el icono y el titular dentro de la misma ventana de 400 caracteres del arbol JSX',
}

// Reglas sin oportunidad de disparar en este corpus. No se eliminan: eliminar
// por falta de oportunidad seria el mismo error que aceptarlas sin medida.
const NO_MEDIBLES = {
  A4: 'cero disparos en la banda; exige un hero con resplandor radial',
  HM1: 'cero disparos en 123 proyectos',
  // Portadas que no tuvieron NINGUNA oportunidad de disparar: cero en ambas
  // clases. No se les baja el peso — bajarlo por falta de oportunidad seria el
  // mismo error que aceptarlas sin medida.
  C5: 'cero disparos en ambas clases; exige un filete de acento y un radio declarados en el mismo bloque CSS, y en un proyecto Tailwind eso vive en clases',
  S8: 'cero disparos en ambas clases; exige la baldosa, el icono y el titular dentro de la misma ventana de 400 caracteres del arbol JSX',
  E9: 'cero disparos en ambas clases; la cadencia aforistica es prosa de landing y el corpus son repositorios de codigo',
}

// Mediciones que no salen de la banda inglesa de medicion.json. Se estampan
// tal cual en validacion.json para que el escanner no siga diciendo "sin
// evaluar" cuando ya hay cifra. research/l3-espanol.mjs
const MEDICIONES_ESPECIALES = {
  L3: {
    corpus: 'research/l3-espanol.json',
    n: { humanos_es: 19, generados_es: 0 },
    tasa_humano: 0.26,
    ic95: [0.12, 0.49],
    estado: 'premisas_falsada',
    decision: 'Dispara en 5/19 (26%, IC95 12-49) de proyectos humanos en espanol anteriores a ChatGPT. La premisa (corte limpio por archivo = proceso automatico) queda falsada sobre su propia poblacion: uno de cada cuatro humanos deja la misma huella. Sin clase positiva no hay J. Peso 3->1 en checks.mjs.',
  },
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
for (const [id, evidencia] of Object.entries(MEDICIONES_ESPECIALES)) {
  // Sustituyen la fila inglesa (casi cero disparos) por la medicion que si aplica.
  // No se fusionan: las tasas de la banda general no describen esta regla.
  validacionExterna[id] = { ...evidencia }
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
