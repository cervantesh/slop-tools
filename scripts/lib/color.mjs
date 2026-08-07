// Resolución de tokens de color y puertas cromáticas.
// Implementa OKLCH (Ottosson) y el ratio de contraste de WCAG 2.
//
// NOTA HONESTA: no implementa APCA. Las fuentes que definen umbrales en Lc
// (hallmark: Lc>=60 cuerpo, Lc>=45 texto grande) exigen el algoritmo completo de
// APCA, que no es portable en cuarenta líneas. Aquí se usan el ratio de WCAG 2 y
// los pre-checks baratos en OKLCH que las propias fuentes describen como
// estáticamente calculables.

const NOMBRES = {
  white: '#ffffff', black: '#000000', red: '#ff0000', blue: '#0000ff',
  green: '#008000', gray: '#808080', grey: '#808080', silver: '#c0c0c0',
}

export function parseColor(raw) {
  if (!raw) return null
  let s = String(raw).trim().toLowerCase()
  if (NOMBRES[s]) s = NOMBRES[s]

  let m = s.match(/^#([0-9a-f]{3,8})$/)
  if (m) {
    let h = m[1]
    if (h.length === 3 || h.length === 4) h = h.split('').map(c => c + c).join('')
    if (h.length !== 6 && h.length !== 8) return null
    return {
      r: parseInt(h.slice(0, 2), 16) / 255,
      g: parseInt(h.slice(2, 4), 16) / 255,
      b: parseInt(h.slice(4, 6), 16) / 255,
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    }
  }

  m = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.%]+))?\s*\)$/)
  if (m) {
    const a = m[4] === undefined ? 1
      : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])
    return { r: +m[1] / 255, g: +m[2] / 255, b: +m[3] / 255, a }
  }
  return null
}

const aLineal = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

export function oklch(rgb) {
  const r = aLineal(rgb.r), g = aLineal(rgb.g), b = aLineal(rgb.b)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  return { L, C: Math.hypot(A, B), H: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360 }
}

const luminancia = rgb => 0.2126 * aLineal(rgb.r) + 0.7152 * aLineal(rgb.g) + 0.0722 * aLineal(rgb.b)

export function contraste(a, b) {
  const la = luminancia(a), lb = luminancia(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/* ── tokens ── */

export function recogerTokens(styleFiles) {
  const tokens = new Map()
  for (const f of styleFiles) {
    for (const m of f.text.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)[;}]/g)) {
      if (!tokens.has(m[1])) tokens.set(m[1], m[2].trim())
    }
  }
  return tokens
}

// Resuelve cadenas var(--a, var(--b, #fff)) hasta un color concreto.
export function resolver(valor, tokens, profundidad = 0) {
  if (!valor || profundidad > 8) return null
  const directo = parseColor(valor)
  if (directo) return directo
  const m = String(valor).match(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/)
  if (!m) return null
  if (tokens.has(m[1])) {
    const r = resolver(tokens.get(m[1]), tokens, profundidad + 1)
    if (r) return r
  }
  return m[2] ? resolver(m[2].trim(), tokens, profundidad + 1) : null
}

/* ── bloques de reglas CSS ── */

export function bloques(styleFiles) {
  const out = []
  for (const f of styleFiles) {
    for (const m of f.text.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
      const selector = m[1].trim().split('\n').pop().trim()
      if (!selector || selector.startsWith('@')) continue
      out.push({ file: f.rel, selector, cuerpo: m[2], indice: m.index, texto: f.text })
    }
  }
  return out
}

const decl = (cuerpo, prop) => {
  const m = cuerpo.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i'))
  return m ? m[1].trim() : null
}

/* ── puertas ── */

// Neutros de croma cero. Fuente: hallmark gate 22 (croma minimo 0.005).
// Exento en el genero modern-minimal, que los permite deliberadamente.
export function neutrosPlanos(tokens) {
  const hits = []
  for (const [nombre, valor] of tokens) {
    if (!/color|surface|bg|background|fg|ink|text|line|border|muted|neutral/i.test(nombre)) continue
    const rgb = resolver(valor, tokens)
    if (!rgb) continue
    const c = oklch(rgb)
    if (c.C < 0.005 && c.L > 0.02 && c.L < 0.98) {
      hits.push({ nombre, valor, L: c.L.toFixed(3), C: c.C.toFixed(4) })
    }
  }
  return hits
}

// Pares texto/fondo declarados en la MISMA regla, con contraste insuficiente.
export function paresBajoContraste(blks, tokens, umbral = 4.5) {
  const hits = []
  for (const b of blks) {
    const cFg = decl(b.cuerpo, 'color')
    const cBg = decl(b.cuerpo, 'background-color') || decl(b.cuerpo, 'background')
    if (!cFg || !cBg) continue
    const fg = resolver(cFg, tokens), bg = resolver(cBg.split(/\s+/)[0], tokens)
    if (!fg || !bg || bg.a < 0.9) continue
    const ratio = contraste(fg, bg)
    if (ratio < umbral) {
      hits.push({ file: b.file, selector: b.selector, ratio: ratio.toFixed(2), fg: cFg, bg: cBg })
    }
  }
  return hits
}

// Texto de boton indistinguible de su relleno.
// Fuente: hallmark gate 41 — falla si estan dentro de 5% de L Y 0.05 de croma.
export function botonInvisible(blks, tokens) {
  const hits = []
  for (const b of blks) {
    if (!/(^|[\s.#[])(btn|button|cta|action)/i.test(b.selector)) continue
    const cFg = decl(b.cuerpo, 'color')
    const cBg = decl(b.cuerpo, 'background-color') || decl(b.cuerpo, 'background')
    if (!cFg || !cBg) continue
    const fg = resolver(cFg, tokens), bg = resolver(cBg.split(/\s+/)[0], tokens)
    if (!fg || !bg) continue
    const a = oklch(fg), z = oklch(bg)
    if (Math.abs(a.L - z.L) < 0.05 && Math.abs(a.C - z.C) < 0.05) {
      hits.push({ file: b.file, selector: b.selector, dL: Math.abs(a.L - z.L).toFixed(3), dC: Math.abs(a.C - z.C).toFixed(3) })
    }
  }
  return hits
}

// Diversidad cromatica: cuantos tonos distintos maneja la paleta.
// Fuente: la regla de "maximo 3 tonos" de vibecodekit, hecha medible.
export function diversidadDeTono(tokens) {
  const tonos = []
  for (const [nombre, valor] of tokens) {
    const rgb = resolver(valor, tokens)
    if (!rgb) continue
    const c = oklch(rgb)
    if (c.C < 0.03) continue // neutro, no cuenta como tono
    tonos.push({ nombre, H: c.H })
  }
  const cubos = new Set(tonos.map(t => Math.round(t.H / 30)))
  return { tonos: tonos.length, familias: cubos.size, cubos: [...cubos].sort((a, b) => a - b) }
}
