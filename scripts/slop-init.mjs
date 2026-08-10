#!/usr/bin/env node
// slop-init — genera un punto de partida comprometido.
//
// POR QUE EXISTE. Las herramientas de las que salen nuestras reglas son
// GENERADORAS: hallmark tiene arquetipos con rotacion, ux-skill un bucle de
// pulido. Nosotros extrajimos sus puertas y construimos el termometro de un
// campo dedicado a encaminar. Esto es la otra mitad.
//
// EL REMEDIO NO ES UN PROMPT MEJOR, ES RESTRICCION DECLARADA. Un modelo sin
// direccion converge al promedio; con paleta, escala y pareja tipografica ya
// fijadas, no puede.
//
// DOS PROPIEDADES VERIFICABLES, NO PROMETIDAS:
//   1. la salida pasa el propio escaner con 100/100
//   2. dos invocaciones divergen — si generase siempre lo mismo habriamos
//      creado la monocultura de tercer orden, justo lo que avisa AS9
//
//   node scripts/slop-init.mjs <destino> [--seed N] [--json]

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

/* ── argumentos ── */

const argv = process.argv.slice(2)
const flag = n => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined }
const DESTINO = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--seed') || './sistema'
const AS_JSON = argv.includes('--json')
const SEED = flag('--seed') !== undefined ? Number(flag('--seed')) : null

// Generador reproducible: la misma semilla da el mismo sistema, semillas
// distintas dan sistemas distintos. Sin esto no se puede medir la divergencia.
// Ojo con xorshift: semillas contiguas producen primeros valores correlacionados.
// Sin mezclar la semilla y descartar los primeros pasos, diez invocaciones
// seguidas elegian EL MISMO tono — lo caza bench/verifica-init.mjs.
function rng(semilla) {
  let s = semilla >>> 0 || 1
  // Mezcla estilo splitmix32 antes de arrancar.
  s = Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0
  s = Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0
  s = (s ^ (s >>> 16)) >>> 0 || 1
  const paso = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 }
  for (let i = 0; i < 16; i++) paso()
  return paso
}
const semilla = SEED ?? ((Date.now() ^ (Math.random() * 1e9)) >>> 0)
const rand = rng(semilla)
const elige = a => a[Math.floor(rand() * a.length)]

/* ── repertorios ──
   Ninguno contiene las familias por defecto de las herramientas (Inter,
   Poppins, Geist, Roboto, Open Sans) NI el kit de segundo orden que prohibe
   AS9 (Fraunces, Playfair, Instrument Serif con papel crema y terracota). Las
   salidas de emergencia tienen su propia media, y esa ya es reconocible. */

const DISPLAY = ['Newsreader', 'Source Serif 4', 'Bitter', 'Crimson Pro', 'Literata', 'Zilla Slab', 'Petrona', 'Faustina']
const TEXTO = ['Public Sans', 'IBM Plex Sans', 'Work Sans', 'Karla', 'Figtree', 'Asap', 'Archivo']

// Tonos en grados OKLCH. Se excluye deliberadamente la banda 250-300, que es
// donde vive el indigo-violeta de A1.
const TONOS = [
  { nombre: 'ladrillo', H: 32 }, { nombre: 'ambar', H: 66 }, { nombre: 'oliva', H: 118 },
  { nombre: 'bosque', H: 148 }, { nombre: 'teal', H: 186 }, { nombre: 'acero', H: 222 },
  { nombre: 'ciruela', H: 348 }, { nombre: 'granate', H: 12 },
]

const RADIOS = [[2, 6, 14], [0, 4, 12], [3, 8, 18], [4, 10, 20], [1, 5, 16]]
// Cinco valores: muy por debajo del umbral de 14 de C4, que es lo que separa
// una escala de una dispersion.
const ESPACIOS = [[4, 8, 16, 24, 40], [4, 8, 12, 20, 32], [6, 12, 18, 30, 48], [8, 16, 24, 32, 56]]
// Escala de tipo. Suelo en 13px —por encima del suelo de legibilidad de B6— y
// razon extremo a extremo por encima de 3, muy lejos del 2 con que B9 marca una
// jerarquia plana. El sistema que generamos tiene que pasar nuestras reglas.
const TIPOS = [[13, 16, 21, 28, 37, 50], [14, 17, 22, 28, 36, 48], [14, 16, 20, 26, 34, 44], [15, 18, 23, 30, 40, 52]]
const DURACION = [120, 140, 160, 180, 200]
const CURVAS = ['cubic-bezier(.2,.7,.3,1)', 'cubic-bezier(.33,1,.68,1)', 'cubic-bezier(.16,1,.3,1)', 'cubic-bezier(.25,.8,.25,1)']
const POSTURA = ['sobria', 'calida', 'tecnica', 'editorial']

/* ── color: OKLCH -> sRGB ── */

const aSRGB = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
function oklchAHex(L, C, Hdeg) {
  const h = Hdeg * Math.PI / 180
  const a = C * Math.cos(h), b = C * Math.sin(h)
  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3
  const r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_
  const g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_
  const bb = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_
  const hex = x => Math.max(0, Math.min(255, Math.round(aSRGB(x) * 255))).toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(bb)}`
}

/* ── decision ── */

const tono = elige(TONOS)
const display = elige(DISPLAY)
const texto = elige(TEXTO.filter(f => f !== display))
const radios = elige(RADIOS)
const espacios = elige(ESPACIOS)
const tipos = elige(TIPOS)
const duracion = elige(DURACION)
const curva = elige(CURVAS)
const postura = elige(POSTURA)
const claro = rand() > 0.35

// Neutro con croma real: un gris de croma cero falla K1 y aplana la paleta.
const tonoNeutro = (tono.H + 180) % 360
const paleta = claro
  ? {
      lienzo: oklchAHex(0.985, 0.006, tonoNeutro), superficie: oklchAHex(1, 0.003, tonoNeutro),
      tinta: oklchAHex(0.22, 0.02, tonoNeutro), apagado: oklchAHex(0.52, 0.015, tonoNeutro),
      filete: oklchAHex(0.9, 0.01, tonoNeutro), acento: oklchAHex(0.55, 0.14, tono.H),
      acentoSuave: oklchAHex(0.94, 0.04, tono.H), sobreAcento: oklchAHex(0.99, 0.01, tono.H),
    }
  : {
      lienzo: oklchAHex(0.19, 0.018, tonoNeutro), superficie: oklchAHex(0.24, 0.02, tonoNeutro),
      tinta: oklchAHex(0.96, 0.008, tonoNeutro), apagado: oklchAHex(0.68, 0.018, tonoNeutro),
      filete: oklchAHex(0.34, 0.022, tonoNeutro), acento: oklchAHex(0.72, 0.13, tono.H),
      acentoSuave: oklchAHex(0.3, 0.05, tono.H), sobreAcento: oklchAHex(0.16, 0.02, tono.H),
    }

const sistema = {
  semilla, postura, esquema: claro ? 'claro' : 'oscuro',
  tono: tono.nombre, tonoGrados: tono.H,
  display, texto, radios, espacios, tipos, duracion, curva, paleta,
}

/* ── archivos ── */

const tokens = `/* Sistema generado por slop-init · semilla ${semilla}
   Postura ${postura} · tono ${tono.nombre} (${tono.H} grados OKLCH) · esquema ${claro ? 'claro' : 'oscuro'}

   Esto es una RESTRICCION, no una sugerencia. Las decisiones estan tomadas para
   que las iteraciones siguientes no vuelvan al promedio. Si cambias un valor,
   cambia tambien DESIGN.md: un contrato que nadie mantiene no restringe nada. */

:root {
  color-scheme: ${claro ? 'light' : 'dark'};

  --lienzo: ${paleta.lienzo};
  --superficie: ${paleta.superficie};
  --tinta: ${paleta.tinta};
  --apagado: ${paleta.apagado};
  --filete: ${paleta.filete};

  --acento: ${paleta.acento};
  --acento-suave: ${paleta.acentoSuave};
  --sobre-acento: ${paleta.sobreAcento};

${espacios.map((v, i) => `  --e-${i + 1}: ${v}px;`).join('\n')}

  --r-chico: ${radios[0]}px;
  --r-medio: ${radios[1]}px;
  --r-grande: ${radios[2]}px;

${tipos.map((v, i) => `  --t-${i + 1}: ${v}px;`).join('\n')}

  --duracion: ${duracion}ms;
  --curva: ${curva};

  --display: "${display}", Georgia, serif;
  --texto: "${texto}", system-ui, sans-serif;
}

body {
  margin: 0;
  background: var(--lienzo);
  color: var(--tinta);
  font-family: var(--texto);
  font-size: var(--t-2);
  line-height: 1.55;
}

h1, h2, h3 { font-family: var(--display); letter-spacing: -0.015em; }
h1 { font-size: var(--t-6); line-height: 1.08; }
h2 { font-size: var(--t-5); line-height: 1.15; }
h3 { font-size: var(--t-4); line-height: 1.25; }

.medida { max-width: 66ch; }

.tarjeta {
  padding: var(--e-4);
  border-radius: var(--r-medio);
  background: var(--superficie);
  color: var(--tinta);
}

.tarjeta-clave {
  padding: var(--e-5);
  border-radius: var(--r-grande);
  background: var(--acento-suave);
  color: var(--tinta);
}

.accion {
  padding: var(--e-2) var(--e-3);
  border: 0;
  border-radius: var(--r-chico);
  background: var(--acento);
  color: var(--sobre-acento);
  font-family: var(--texto);
  font-weight: 600;
  transition: background var(--duracion) var(--curva), transform var(--duracion) var(--curva);
}

.accion:hover { transform: translateY(-1px); }
.accion:focus-visible { outline: 3px solid var(--acento); outline-offset: 2px; }

@keyframes aparecer { from { opacity: 0; } to { opacity: 1; } }
.aviso { animation: aparecer var(--duracion) var(--curva) both; }

${claro ? '' : `/* Un sistema oscuro por defecto sigue debiendo una alternativa clara.
   Sin esto la propia herramienta lo marca, y con razon. */
@media (prefers-color-scheme: light) {
  :root {
    --lienzo: ${oklchAHex(0.985, 0.006, tonoNeutro)};
    --superficie: ${oklchAHex(1, 0.003, tonoNeutro)};
    --tinta: ${oklchAHex(0.22, 0.02, tonoNeutro)};
    --apagado: ${oklchAHex(0.52, 0.015, tonoNeutro)};
    --filete: ${oklchAHex(0.9, 0.01, tonoNeutro)};
    --acento: ${oklchAHex(0.55, 0.14, tono.H)};
    --acento-suave: ${oklchAHex(0.94, 0.04, tono.H)};
    --sobre-acento: ${oklchAHex(0.99, 0.01, tono.H)};
  }
}

`}/* Toda animacion necesita su alternativa. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`

const design = `# Contrato de diseno

Generado por \`slop-init\` con semilla **${semilla}**. Es la fuente unica de verdad: toda
iteracion de interfaz se ajusta a lo que dice este archivo, y cambiar el sistema significa
cambiar primero este archivo.

## Postura

**${postura}**, esquema ${claro ? 'claro' : 'oscuro'}, tono dominante **${tono.nombre}**
(${tono.H} grados en OKLCH).

## Color

Un dominante, un neutro con temperatura y un acento. Nada mas.

| Token | Valor | Uso |
| --- | --- | --- |
| \`--lienzo\` | \`${paleta.lienzo}\` | Fondo de pagina |
| \`--superficie\` | \`${paleta.superficie}\` | Tarjetas y paneles |
| \`--tinta\` | \`${paleta.tinta}\` | Texto principal |
| \`--apagado\` | \`${paleta.apagado}\` | Texto secundario |
| \`--filete\` | \`${paleta.filete}\` | Divisores, ultimo recurso |
| \`--acento\` | \`${paleta.acento}\` | La unica accion primaria |

Los neutros llevan croma ${claro ? '0,006' : '0,018'}, no cero: un gris con temperatura ancla
la paleta. Los colores semanticos van aparte y no cuentan como tono.

## Tipografia

Pareja intencionada: **${display}** para titulares, **${texto}** para texto.

No se usa Inter, Poppins, Geist, Roboto ni Open Sans — son las familias por defecto de las
herramientas. Tampoco el kit de papel crema con serif display y acento terracota: es la
estetica a la que converge el primer arreglo, y ya se reconoce igual que el morado.

## Escala

Espaciado: ${espacios.map(v => `${v}px`).join(' · ')}. **Cinco valores, no catorce.** La
dispersion de escala es el discriminador mas fuerte que conocemos entre diseno generado y
diseno con criterio.

Radios: ${radios.map(v => `${v}px`).join(' · ')}, y cada uno significa algo — chico para
controles, medio para tarjetas, grande para superficies clave.

Escala de tipo: ${tipos.map(v => `${v}px`).join(' · ')}. El suelo esta en ${tipos[0]}px porque por
debajo de 12px el texto deja de leerse en pantallas densas, y la razon entre extremos es
${(tipos[tipos.length - 1] / tipos[0]).toFixed(1)} para que la jerarquia se vea sin tener que
anunciarla. Anadir un escalon a esta lista no es gratis: legitima el tamano en todo el arbol.

## Movimiento

Una duracion (${duracion}ms) y una curva (\`${curva}\`). No 300ms, que es el valor que sale de
fabrica en todas las herramientas, ni la curva de Material.

Toda animacion tiene su bloque de \`prefers-reduced-motion\`.

## Separacion

Primero espacio en blanco. Si no basta, un escalon de luminancia. El filete gris de 1px es el
ultimo recurso, no el primero.

## Como comprobar que esto se respeta

Anti-slop (parece plantilla?) y **contrato** (respeta *este* sistema?):

\`\`\`bash
node scripts/slop-scan.mjs . --profile landing --contrato
node scripts/slop-scan.mjs . --profile landing --contrato --fail-on-contrato
\`\`\`

\`--contrato\` lee \`.slop-init.json\` (o \`tokens.css\` / este archivo) y comprueba
escala, radios, tipografia, paleta y movimiento. No mezcla esa nota con la de
procedencia: un proyecto puede estar limpio de slop y aun asi traicionar su
propio contrato.
`

const demo = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sistema ${postura} · ${tono.nombre}</title>
  <link rel="stylesheet" href="tokens.css" />
</head>
<body>
<main class="medida">
  <h1>Un titular que solo tiene sentido para este proyecto</h1>
  <p>
    Sustituye este texto por el tuyo. Si al cambiar el nombre de la marca por el de un
    competidor la frase sigue funcionando, todavia no dice nada.
  </p>
  <article class="tarjeta">
    <h2>Una tarjeta</h2>
    <p>Separada por espacio y por un escalon de luminancia, no por un filete gris.</p>
    <button class="accion">Accion principal</button>
  </article>
  <article class="tarjeta-clave">
    <h2>La que importa</h2>
    <p>Ocupa mas y lleva mas radio porque pesa mas. La jerarquia se ve sin leer.</p>
  </article>
</main>
</body>
</html>
`

// Puente a Tailwind: el contrato como theme.extend para no perder la restriccion
// al salir del CSS plano. No es un proyecto Tailwind completo: es el mapa.
const tw = `/** @type {import('tailwindcss').Config} */
/* Generado por slop-init · semilla ${semilla} · no editar a ciegas: cambia DESIGN.md primero */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        lienzo: '${paleta.lienzo}',
        superficie: '${paleta.superficie}',
        tinta: '${paleta.tinta}',
        apagado: '${paleta.apagado}',
        filete: '${paleta.filete}',
        acento: '${paleta.acento}',
        'acento-suave': '${paleta.acentoSuave}',
        'sobre-acento': '${paleta.sobreAcento}',
      },
      fontFamily: {
        display: ['${display}', 'Georgia', 'serif'],
        sans: ['${texto}', 'system-ui', 'sans-serif'],
      },
      spacing: {
${espacios.map((v, i) => `        'e${i + 1}': '${v}px',`).join('\n')}
      },
      borderRadius: {
        chico: '${radios[0]}px',
        medio: '${radios[1]}px',
        grande: '${radios[2]}px',
      },
      transitionDuration: {
        DEFAULT: '${duracion}ms',
      },
      transitionTimingFunction: {
        sistema: '${curva}',
      },
    },
  },
  plugins: [],
}
`

mkdirSync(DESTINO, { recursive: true })
writeFileSync(join(DESTINO, 'tokens.css'), tokens, 'utf8')
writeFileSync(join(DESTINO, 'DESIGN.md'), design, 'utf8')
writeFileSync(join(DESTINO, 'index.html'), demo, 'utf8')
writeFileSync(join(DESTINO, 'tailwind.theme.mjs'), tw, 'utf8')

/* ── registro de divergencia ── */
// Patron tomado de .hallmark/log.json: si dos invocaciones seguidas producen
// las mismas decisiones, el generador no esta divergiendo y hay que decirlo.
let repite = null
const rutaLog = join(DESTINO, '.slop-init.json')
try {
  if (existsSync(rutaLog)) {
    const previo = JSON.parse(readFileSync(rutaLog, 'utf8'))
    const igual = previo.tono === sistema.tono && previo.display === sistema.display
      && previo.esquema === sistema.esquema
    repite = { igual, anterior: { tono: previo.tono, display: previo.display, esquema: previo.esquema } }
  }
  writeFileSync(rutaLog, JSON.stringify(sistema, null, 2) + '\n', 'utf8')
} catch { /* el registro es opcional */ }

if (AS_JSON) {
  console.log(JSON.stringify({ ...sistema, destino: DESTINO, repite }, null, 2))
} else {
  console.log(`\n  slop-init · ${DESTINO}\n`)
  console.log(`  semilla     ${semilla}`)
  console.log(`  postura     ${postura} · esquema ${claro ? 'claro' : 'oscuro'}`)
  console.log(`  tono        ${tono.nombre} (${tono.H} grados)`)
  console.log(`  tipografia  ${display} / ${texto}`)
  console.log(`  espaciado   ${espacios.join(' · ')}`)
  console.log(`  radios      ${radios.join(' · ')}`)
  console.log(`  movimiento  ${duracion}ms · ${curva}\n`)
  console.log('  tokens.css · DESIGN.md · index.html · tailwind.theme.mjs\n')
  if (repite?.igual) {
    console.log('  AVISO: mismas decisiones que la invocacion anterior en este destino.')
    console.log('  Un generador que no diverge reproduce la monocultura que intenta evitar.\n')
  }
  console.log(`  Comprobar:  node scripts/slop-scan.mjs ${DESTINO} --profile landing --contrato\n`)
}
