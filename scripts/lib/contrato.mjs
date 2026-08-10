// Contrato de diseño: lee lo que slop-init declaró y comprueba que el árbol
// lo respeta. Es el lint del sistema — la otra mitad de detectar slop.
//
// Fuente de verdad, en este orden:
//   1. .slop-init.json  (máquina; lo escribe slop-init)
//   2. tokens.css       (custom properties --e-*, --r-*, --display, colores)
//   3. DESIGN.md        (tabla y prosa del contrato)
//
// Las comprobaciones son de tipo `contrato`: NO puntúan procedencia ni
// defectos de calidad genéricos. Fallan si el proyecto se sale de su propia
// escala, paleta, pareja tipográfica o presupuesto de movimiento.

import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { px, TW_ESPACIO, TW_RADIO, TW_TEXTO } from './escala.mjs'
import { parseColor } from './color.mjs'
// OJO: no reutilizamos escalas() de escala.mjs para el lint del contrato.
// px() interpreta `var(--e-4)` como el numero 4 (casa con el 4 del token), y
// eso haria fallar todo sistema que use sus propias custom properties. Aqui
// solo cuentan literales y clases de utilidad con valor resuelto.

const PROHIBIDAS = new Set(['inter', 'poppins', 'geist', 'roboto', 'open sans', 'geist sans', 'geist mono'])
const FALLBACKS = new Set(['serif', 'sans-serif', 'monospace', 'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace', 'georgia', 'arial', 'helvetica', 'times', 'times new roman', 'courier', 'courier new', 'inherit', 'initial', 'unset', 'var'])

const normHex = raw => {
  const c = parseColor(raw)
  if (!c) return null
  const h = n => Math.round(n * 255).toString(16).padStart(2, '0')
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`
}

const numList = s => [...String(s).matchAll(/(-?[\d.]+)\s*px/gi)].map(m => Math.abs(parseFloat(m[1])))

/** Resuelve la ruta del contrato: directorio o archivo DESIGN.md / tokens.css / .slop-init.json */
export function resolverRutaContrato(raiz, explícito) {
  if (explícito === true || explícito === '') return resolve(raiz)
  if (explícito) {
    const p = resolve(explícito)
    if (!existsSync(p)) return null
    return statSync(p).isDirectory() ? p : dirname(p)
  }
  // Auto: si hay señal de contrato en la raíz del escaneo, actívalo.
  for (const f of ['.slop-init.json', 'DESIGN.md', 'tokens.css']) {
    if (existsSync(join(raiz, f))) return raiz
  }
  return null
}

export function cargarContrato(dir) {
  if (!dir || !existsSync(dir)) return null
  const jsonPath = join(dir, '.slop-init.json')
  if (existsSync(jsonPath)) {
    try {
      const j = JSON.parse(readFileSync(jsonPath, 'utf8'))
      return normalizar({
        origen: '.slop-init.json',
        dir,
        display: j.display,
        texto: j.texto,
        radios: j.radios || [],
        espacios: j.espacios || [],
        tipos: j.tipos || [],
        duracion: j.duracion,
        curva: j.curva,
        paleta: j.paleta || {},
        postura: j.postura,
        esquema: j.esquema,
        tono: j.tono,
        semilla: j.semilla,
      })
    } catch { /* cae a tokens */ }
  }

  const tokensPath = join(dir, 'tokens.css')
  if (existsSync(tokensPath)) {
    const t = parseTokensCss(readFileSync(tokensPath, 'utf8'))
    if (t) return { ...t, origen: 'tokens.css', dir }
  }

  const designPath = join(dir, 'DESIGN.md')
  if (existsSync(designPath)) {
    const d = parseDesignMd(readFileSync(designPath, 'utf8'))
    if (d) return { ...d, origen: 'DESIGN.md', dir }
  }
  return null
}

function normalizar(c) {
  const paletaHex = {}
  for (const [k, v] of Object.entries(c.paleta || {})) {
    const h = normHex(v)
    if (h) paletaHex[k] = h
  }
  // aliases CSS kebab vs camel
  const set = new Set(Object.values(paletaHex))
  return {
    ...c,
    espacios: (c.espacios || []).map(Number).filter(n => !Number.isNaN(n)),
    radios: (c.radios || []).map(Number).filter(n => !Number.isNaN(n)),
    tipos: (c.tipos || []).map(Number).filter(n => !Number.isNaN(n)),
    duracion: c.duracion != null ? Number(c.duracion) : null,
    paletaHex,
    paletaSet: set,
  }
}

function parseTokensCss(text) {
  const espacios = []
  for (const m of text.matchAll(/--e-\d+\s*:\s*([\d.]+)px/gi)) espacios.push(parseFloat(m[1]))
  const radios = []
  for (const m of text.matchAll(/--r-(?:chico|medio|grande)\s*:\s*([\d.]+)px/gi)) radios.push(parseFloat(m[1]))
  const tipos = []
  for (const m of text.matchAll(/--t-\d+\s*:\s*([\d.]+)px/gi)) tipos.push(parseFloat(m[1]))
  const dur = text.match(/--duracion\s*:\s*([\d.]+)ms/i)
  const display = text.match(/--display\s*:\s*"([^"]+)"/i)
  const texto = text.match(/--texto\s*:\s*"([^"]+)"/i)
  // Gana la PRIMERA definicion, que es la de :root. Un sistema oscuro emite
  // despues un bloque de alternativa clara que redefine los mismos tokens; si
  // ganara la ultima, el contrato quedaria describiendo la alternativa y no el
  // sistema, y DS4 marcaba como ajena la paleta real (la que va en
  // tailwind.theme.mjs). Fallaba en todo esquema oscuro por esta via.
  // Es el mismo criterio de primera-gana que ya usa recogerTokens.
  const paleta = {}
  for (const m of text.matchAll(/--(lienzo|superficie|tinta|apagado|filete|acento|acento-suave|sobre-acento)\s*:\s*(#[0-9a-fA-F]{3,8})/g)) {
    const key = m[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    if (!(key in paleta)) paleta[key] = m[2]
  }
  if (!espacios.length && !radios.length && !display) return null
  return normalizar({
    display: display?.[1],
    texto: texto?.[1],
    espacios,
    radios,
    tipos,
    duracion: dur ? parseFloat(dur[1]) : null,
    paleta,
  })
}

function parseDesignMd(text) {
  const esp = text.match(/Espaciado:\s*([^\n.]+)/i)
  const rad = text.match(/Radios:\s*([^\n,]+)/i)
  const tip = text.match(/Pareja intencionada:\s*\*\*([^*]+)\*\*\s+para titulares,\s*\*\*([^*]+)\*\*/i)
  const tipoEscala = text.match(/Escala de tipo:\s*([^\n.]+)/i)
  const mov = text.match(/Una duraci[oó]n\s*\((\d+)\s*ms\)/i)
  const paleta = {}
  for (const m of text.matchAll(/`(--[\w-]+)`\s*\|\s*`(#[0-9a-fA-F]{3,8})`/g)) {
    const name = m[1].replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    paleta[name] = m[2]
  }
  const espacios = esp ? numList(esp[1]) : []
  const radios = rad ? numList(rad[1]) : []
  if (!espacios.length && !radios.length && !tip) return null
  return normalizar({
    display: tip?.[1]?.trim(),
    texto: tip?.[2]?.trim(),
    espacios,
    radios,
    tipos: tipoEscala ? numList(tipoEscala[1]) : [],
    duracion: mov ? parseFloat(mov[1]) : null,
    paleta,
  })
}

/** Líneas de definición de custom properties: no cuentan como uso. */
function esDefinicionToken(linea) {
  return /^\s*--[\w-]+\s*:/.test(linea)
}

/**
 * Comprueba el árbol escaneado contra el contrato.
 * `files` es la lista de collect(); se ignora el propio directorio del contrato
 * solo para no marcar las definiciones de tokens.css como violaciones de color.
 */
/** Literales de espaciado/radio usados en el arbol (sin var(--token)). */
function usosEscala(files) {
  const espacios = []
  const radios = []
  for (const f of files) {
    for (const line of f.lines) {
      if (esDefinicionToken(line)) continue
      // Quitar var(...) para que px no "lea" el indice del token.
      const sinVar = line.replace(/var\([^)]*\)/gi, ' ')
      for (const m of sinVar.matchAll(/(?:padding|margin|gap)(?:-\w+)?:\s*([^;}{]+)/gi)) {
        for (const t of m[1].trim().split(/\s+/)) {
          const v = px(t)
          if (v !== null) espacios.push(Math.abs(v))
        }
      }
      for (const m of sinVar.matchAll(/border-radius:\s*([^;}{]+)/gi)) {
        const v = px(m[1])
        if (v !== null) radios.push(v)
      }
      // Utilidades Tailwind con valor conocido (no arbitrarias).
      for (const m of line.matchAll(/\b[pmg][xytrbl]?-(\d+(?:\.\d)?)\b/g)) {
        const v = TW_ESPACIO[m[1]]
        if (v !== undefined) espacios.push(v)
      }
      for (const m of line.matchAll(/\brounded(?:-(none|sm|md|lg|xl|2xl|3xl|full))?\b/g)) {
        radios.push(TW_RADIO[m[1] ?? ''] ?? 4)
      }
      // Arbitrarias: p-[13px], rounded-[11px]
      for (const m of line.matchAll(/\b[pmg][xytrbl]?-\[(\d+(?:\.\d)?)px\]/g)) espacios.push(parseFloat(m[1]))
      for (const m of line.matchAll(/\brounded-\[(\d+(?:\.\d)?)px\]/g)) radios.push(parseFloat(m[1]))
    }
  }
  return { espacios, radios }
}

export function comprobarContrato(contrato, files) {
  if (!contrato) return null

  const { espacios: usadosEsp, radios: usadosRad } = usosEscala(files)

  const escalaSet = new Set(contrato.espacios)
  const radioSet = new Set(contrato.radios)
  // 0 es siempre legítimo (reset / none). outline/offset no entran: no son escala.
  escalaSet.add(0)
  radioSet.add(0)

  const hallazgos = []

  // DS1 · Espaciado fuera de escala
  {
    const fuera = [...new Set(usadosEsp.filter(v => !escalaSet.has(v)))].sort((a, b) => a - b)
    // Muestras: literales en CSS y clases TW que resuelven fuera
    const samples = muestrasEspacio(files, escalaSet)
    hallazgos.push({
      id: 'DS1',
      cat: 'Layout',
      title: 'Espaciado fuera de la escala del contrato',
      weight: 3,
      tipo: 'contrato',
      failed: fuera.length > 0,
      detail: fuera.length
        ? `${fuera.length} valor(es) fuera de escala: ${fuera.slice(0, 12).join('px, ')}px · permitidos: ${contrato.espacios.join(' · ')}`
        : `todos los espaciados caen en la escala (${contrato.espacios.join(' · ')})`,
      samples,
      fix: `Usa solo la escala del contrato (${contrato.espacios.map(v => v + 'px').join(', ')}) o var(--e-*). Si el sistema debe cambiar, edita DESIGN.md y tokens primero.`,
    })
  }

  // DS2 · Radios fuera de jerarquía
  {
    const fuera = [...new Set(usadosRad.filter(v => v < 9990 && !radioSet.has(v)))].sort((a, b) => a - b)
    hallazgos.push({
      id: 'DS2',
      cat: 'Layout',
      title: 'Radio fuera de la jerarquía del contrato',
      weight: 2,
      tipo: 'contrato',
      failed: fuera.length > 0,
      detail: fuera.length
        ? `${fuera.length} radio(s) fuera: ${fuera.slice(0, 10).join('px, ')}px · permitidos: ${contrato.radios.join(' · ')}`
        : `radios dentro de la jerarquía (${contrato.radios.join(' · ')})`,
      samples: muestrasRadio(files, radioSet),
      fix: `Usa --r-chico / --r-medio / --r-grande (${contrato.radios.join(' / ')}px) en vez de radios sueltos.`,
    })
  }

  // DS3 · Tipografía
  {
    const samples = []
    let prohibidas = 0
    let ajenas = 0
    const permitidas = new Set(
      [contrato.display, contrato.texto].filter(Boolean).map(s => s.toLowerCase()),
    )
    for (const f of files) {
      for (let i = 0; i < f.lines.length; i++) {
        const line = f.lines[i]
        // font-family: ... y font-['...'] de Tailwind arbitrario
        const fams = []
        for (const m of line.matchAll(/font-family\s*:\s*([^;}{]+)/gi)) {
          for (const part of m[1].split(',')) {
            const name = part.replace(/["']/g, '').trim().toLowerCase()
            if (name && !name.startsWith('var(')) fams.push(name)
          }
        }
        for (const m of line.matchAll(/font-\[['"]([^'"]+)['"]\]/g)) fams.push(m[1].toLowerCase())
        for (const name of fams) {
          const base = name.replace(/\s+variable$/, '').trim()
          if (FALLBACKS.has(base) || permitidas.has(base)) continue
          if (PROHIBIDAS.has(base)) {
            prohibidas++
            if (samples.length < 5) samples.push({ file: f.rel, line: i + 1, text: line.trim().slice(0, 110) })
          } else if (base.length > 1) {
            ajenas++
            if (samples.length < 5) samples.push({ file: f.rel, line: i + 1, text: line.trim().slice(0, 110) })
          }
        }
      }
    }
    const failed = prohibidas > 0 || ajenas > 0
    hallazgos.push({
      id: 'DS3',
      cat: 'Tipografia',
      title: 'Tipografía fuera de la pareja del contrato',
      weight: 3,
      tipo: 'contrato',
      failed,
      detail: failed
        ? `${prohibidas} familia(s) prohibida(s) (defaults de herramientas) · ${ajenas} ajena(s) al contrato (${contrato.display} / ${contrato.texto})`
        : `pareja del contrato: ${contrato.display} / ${contrato.texto}`,
      samples,
      fix: `Usa var(--display) y var(--texto), o las familias ${contrato.display} y ${contrato.texto}. Inter/Poppins/Geist/Roboto/Open Sans están fuera a propósito.`,
    })
  }

  // DS4 · Colores hex literales fuera de paleta (no var())
  {
    const samples = []
    let n = 0
    const permitidos = new Set([...contrato.paletaSet, '#ffffff', '#000000', '#fff', '#000'])
    // Normalizar cortos
    for (const h of [...permitidos]) {
      const nrm = normHex(h)
      if (nrm) permitidos.add(nrm)
    }
    for (const f of files) {
      // El fichero que DEFINE la paleta no se audita como uso.
      if (f.rel === 'tokens.css' || f.rel.endsWith('/tokens.css') || f.rel.endsWith('\\tokens.css')) continue
      for (let i = 0; i < f.lines.length; i++) {
        const line = f.lines[i]
        if (esDefinicionToken(line)) continue
        for (const m of line.matchAll(/#([0-9a-fA-F]{3,8})\b/g)) {
          const hex = normHex('#' + m[1])
          if (!hex) continue
          if (permitidos.has(hex)) continue
          // Casi blanco / casi negro de utilidad
          if (hex === '#ffffff' || hex === '#000000') continue
          n++
          if (samples.length < 5) samples.push({ file: f.rel, line: i + 1, text: line.trim().slice(0, 110) })
        }
      }
    }
    hallazgos.push({
      id: 'DS4',
      cat: 'Color',
      title: 'Color literal fuera de la paleta del contrato',
      weight: 2,
      tipo: 'contrato',
      failed: n > 0,
      detail: n
        ? `${n} hex literal(es) que no están en la paleta del contrato`
        : 'sin hex sueltos fuera de la paleta (o no hay literales)',
      samples,
      fix: 'Sustituye el hex por un token del contrato (--lienzo, --acento, …). Si el color es nuevo, decláralo primero en DESIGN.md y tokens.css.',
    })
  }

  // DS5 · Duración de movimiento
  {
    const samples = []
    let n = 0
    const permitida = contrato.duracion
    for (const f of files) {
      if (f.rel === 'tokens.css' || f.rel.endsWith('/tokens.css') || f.rel.endsWith('\\tokens.css')) continue
      for (let i = 0; i < f.lines.length; i++) {
        const line = f.lines[i]
        if (esDefinicionToken(line)) continue
        if (/prefers-reduced-motion/i.test(line)) continue
        for (const m of line.matchAll(/(\d+(?:\.\d+)?)\s*ms\b/gi)) {
          const v = parseFloat(m[1])
          if (v <= 1) continue // reduced-motion hacks
          if (permitida != null && Math.abs(v - permitida) < 0.5) continue
          n++
          if (samples.length < 5) samples.push({ file: f.rel, line: i + 1, text: line.trim().slice(0, 110) })
        }
      }
    }
    hallazgos.push({
      id: 'DS5',
      cat: 'Motion',
      title: 'Duración de movimiento fuera del presupuesto del contrato',
      weight: 2,
      tipo: 'contrato',
      failed: n > 0,
      detail: n
        ? `${n} duración(es) ≠ ${permitida ?? '?'}ms del contrato`
        : permitida != null
          ? `movimiento acotado a ${permitida}ms`
          : 'contrato sin duración declarada',
      samples,
      fix: permitida != null
        ? `Usa var(--duracion) o ${permitida}ms. El 300ms de fábrica es justo lo que hay que evitar.`
        : 'Declara una duración en el contrato y úsala.',
    })
  }

  // DS6 · reduced-motion si el contrato declara movimiento
  {
    const todo = files.map(f => f.text).join('\n')
    const tieneMotion = contrato.duracion != null
    const reduce = /prefers-reduced-motion/i.test(todo)
    hallazgos.push({
      id: 'DS6',
      cat: 'Motion',
      title: 'Contrato con movimiento sin prefers-reduced-motion',
      weight: 2,
      tipo: 'contrato',
      failed: tieneMotion && !reduce,
      detail: !tieneMotion ? 'contrato sin duración' : reduce ? 'reduced-motion presente' : 'falta bloque reduced-motion',
      samples: [],
      fix: 'El contrato declara movimiento: incluye @media (prefers-reduced-motion: reduce).',
    })
  }

  // DS7 · focus-visible si hay controles en el árbol
  {
    const todo = files.map(f => f.text).join('\n')
    const controles = /<button|type=["']submit|\.accion\b/i.test(todo)
    const focus = /:focus-visible|focus-visible:/i.test(todo)
    hallazgos.push({
      id: 'DS7',
      cat: 'Accesibilidad',
      title: 'Controles sin :focus-visible en el sistema',
      weight: 1,
      tipo: 'contrato',
      failed: controles && !focus,
      detail: !controles ? 'sin controles' : focus ? 'focus-visible presente' : 'controles sin focus-visible',
      samples: [],
      fix: 'Añade :focus-visible a botones/acciones del sistema (tokens o componentes base).',
    })
  }

  // DS8 · Tamaño de tipo fuera de la escala
  //
  // Portado de impeccable (`design-system-font-size`, Apache-2.0). Era el único
  // hueco real de nuestro contrato: teníamos escala de espaciado (DS1), de radio
  // (DS2), pareja tipográfica (DS3), paleta (DS4) y duración (DS5), pero ningún
  // control sobre la rampa de tamaños — que es justo donde la deriva se cuela sin
  // que nadie la vea, porque cada `text-[15px]` parece inofensivo por separado.
  //
  // Tolerancia ±0,5px, la misma que usa la fuente. De `clamp()` sólo se juzgan
  // los extremos: el tramo intermedio es fluido por diseño y no es un escalón.
  if (contrato.tipos && contrato.tipos.length) {
    const dentro = v => contrato.tipos.some(t => Math.abs(t - v) <= 0.5)
    const { valores, samples } = usosTipo(files, dentro)
    const fuera = [...new Set(valores)].sort((a, b) => a - b)
    hallazgos.push({
      id: 'DS8',
      cat: 'Tipografia',
      title: 'Tamaño de tipo fuera de la escala del contrato',
      weight: 2,
      tipo: 'contrato',
      failed: fuera.length > 0,
      detail: fuera.length
        ? `${fuera.length} tamaño(s) fuera de la rampa: ${fuera.slice(0, 10).join('px, ')}px · permitidos: ${contrato.tipos.join(' · ')}`
        : `todos los tamaños caen en la rampa (${contrato.tipos.join(' · ')})`,
      samples,
      fix: `Usa var(--t-*) o uno de los escalones declarados (${contrato.tipos.map(v => v + 'px').join(', ')}). Si de verdad falta un escalón, decláralo en DESIGN.md antes de usarlo — añadirlo después legitima el tamaño en todo el árbol.`,
    })
  }

  const fallan = hallazgos.filter(h => h.failed)
  const maxW = hallazgos.reduce((a, h) => a + h.weight, 0)
  const lostW = fallan.reduce((a, h) => a + h.weight, 0)
  const score = maxW ? Math.round(100 * (1 - lostW / maxW)) : 100

  return {
    origen: contrato.origen,
    dir: contrato.dir,
    resumen: {
      display: contrato.display,
      texto: contrato.texto,
      espacios: contrato.espacios,
      radios: contrato.radios,
      duracion: contrato.duracion,
      semilla: contrato.semilla ?? null,
    },
    score,
    total: hallazgos.length,
    fallan: fallan.length,
    checks: hallazgos,
  }
}

/**
 * Tamaños de tipo literales usados en el árbol que caen fuera de la rampa.
 * Sólo se juzgan px y rem: `em`, `%` y `calc()` dependen del contexto del
 * elemento y afirmarlos sin renderizar sería adivinar.
 */
function usosTipo(files, dentro) {
  const valores = []
  const samples = []
  const anota = (v, f, i, line) => {
    if (v === null || !Number.isFinite(v) || dentro(v)) return
    valores.push(v)
    if (samples.length < 5) samples.push({ file: f.rel, line: i + 1, text: line.trim().slice(0, 110) })
  }
  for (const f of files) {
    for (let i = 0; i < f.lines.length; i++) {
      const line = f.lines[i]
      if (esDefinicionToken(line)) continue
      const sinVar = line.replace(/var\([^)]*\)/gi, ' ')
      for (const m of sinVar.matchAll(/font-size:\s*([^;}{]+)/gi)) {
        const bruto = m[1].trim()
        const clamp = bruto.match(/clamp\(\s*([^,]+),[^,]+,\s*([^)]+)\)/i)
        if (clamp) { anota(px(clamp[1]), f, i, line); anota(px(clamp[2]), f, i, line); continue }
        if (/em\b|%|calc\(/i.test(bruto) && !/rem\b/i.test(bruto)) continue
        anota(px(bruto), f, i, line)
      }
      // Utilidades de Tailwind con valor conocido, y las arbitrarias.
      for (const m of line.matchAll(/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g)) anota(TW_TEXTO[m[1]], f, i, line)
      for (const m of line.matchAll(/\btext-\[(\d+(?:\.\d+)?)(px|rem)\]/g)) anota(m[2] === 'rem' ? parseFloat(m[1]) * 16 : parseFloat(m[1]), f, i, line)
    }
  }
  return { valores, samples }
}

function muestrasEspacio(files, escalaSet) {
  const samples = []
  for (const f of files) {
    for (let i = 0; i < f.lines.length; i++) {
      const line = f.lines[i]
      if (esDefinicionToken(line)) continue
      const sinVar = line.replace(/var\([^)]*\)/gi, ' ')
      let hit = false
      for (const m of sinVar.matchAll(/(?:padding|margin|gap)(?:-\w+)?:\s*([^;}{]+)/gi)) {
        for (const t of m[1].trim().split(/\s+/)) {
          const v = px(t)
          if (v !== null && !escalaSet.has(Math.abs(v))) hit = true
        }
      }
      for (const m of line.matchAll(/\b[pmg][xytrbl]?-(\d+(?:\.\d)?)\b/g)) {
        const v = TW_ESPACIO[m[1]]
        if (v !== undefined && !escalaSet.has(v)) hit = true
      }
      for (const m of line.matchAll(/\b[pmg][xytrbl]?-\[(\d+(?:\.\d)?)px\]/g)) {
        if (!escalaSet.has(parseFloat(m[1]))) hit = true
      }
      if (hit && samples.length < 5) samples.push({ file: f.rel, line: i + 1, text: line.trim().slice(0, 110) })
    }
  }
  return samples
}

function muestrasRadio(files, radioSet) {
  const samples = []
  for (const f of files) {
    for (let i = 0; i < f.lines.length; i++) {
      const line = f.lines[i]
      if (esDefinicionToken(line)) continue
      const sinVar = line.replace(/var\([^)]*\)/gi, ' ')
      let hit = false
      for (const m of sinVar.matchAll(/border-radius:\s*([^;}{]+)/gi)) {
        const v = px(m[1])
        if (v !== null && v < 9990 && !radioSet.has(v)) hit = true
      }
      for (const m of line.matchAll(/\brounded(?:-(none|sm|md|lg|xl|2xl|3xl|full))?\b/g)) {
        const v = TW_RADIO[m[1] ?? ''] ?? 4
        if (v < 9990 && !radioSet.has(v)) hit = true
      }
      for (const m of line.matchAll(/\brounded-\[(\d+(?:\.\d)?)px\]/g)) {
        if (!radioSet.has(parseFloat(m[1]))) hit = true
      }
      if (hit && samples.length < 5) samples.push({ file: f.rel, line: i + 1, text: line.trim().slice(0, 110) })
    }
  }
  return samples
}
