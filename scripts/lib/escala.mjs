// Extraccion de escalas — radios, espaciados y tamanos — desde CSS y desde
// clases de utilidad.
//
// POR QUE VIVE APARTE. El umbral de la regla C4 (espaciados distintos >= 14)
// se ajusto sobre las cifras que produce ESTE extractor al medir el corpus. Si
// el escaner contara de otra forma, el umbral no significaria nada. Una sola
// definicion, dos consumidores: research/genericity.mjs y scripts/lib/checks.mjs.
//
// Si tocas la extraccion, el umbral de C4 deja de ser valido hasta remedir.

export const TW_ESPACIO = { '0': 0, '0.5': 2, '1': 4, '1.5': 6, '2': 8, '2.5': 10, '3': 12, '3.5': 14, '4': 16, '5': 20, '6': 24, '7': 28, '8': 32, '9': 36, '10': 40, '11': 44, '12': 48, '14': 56, '16': 64, '20': 80, '24': 96, '28': 112, '32': 128 }
export const TW_RADIO = { none: 0, sm: 2, '': 4, md: 6, lg: 8, xl: 12, '2xl': 16, '3xl': 24, full: 9999 }
export const TW_TEXTO = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48, '6xl': 60, '7xl': 72, '8xl': 96, '9xl': 128 }

export const px = s => {
  const m = String(s).match(/(-?[\d.]+)\s*(px|rem|em)?/)
  if (!m) return null
  const v = parseFloat(m[1])
  return m[2] === 'rem' || m[2] === 'em' ? v * 16 : v
}

// `css` es el texto de los archivos de estilo; `todo` el de todos los archivos.
export function escalas(css, todo) {
  const radios = []
  for (const m of css.matchAll(/border-radius:\s*([^;}]+)/gi)) { const v = px(m[1]); if (v !== null) radios.push(v) }
  for (const m of todo.matchAll(/\brounded(?:-(none|sm|md|lg|xl|2xl|3xl|full))?\b/g)) radios.push(TW_RADIO[m[1] ?? ''] ?? 4)

  const espacios = []
  for (const m of css.matchAll(/(?:padding|margin|gap)(?:-\w+)?:\s*([^;}]+)/gi)) {
    for (const t of m[1].trim().split(/\s+/)) { const v = px(t); if (v !== null) espacios.push(Math.abs(v)) }
  }
  for (const m of todo.matchAll(/\b[pmg][xytrbl]?-(\d+(?:\.\d)?)\b/g)) { const v = TW_ESPACIO[m[1]]; if (v !== undefined) espacios.push(v) }

  const tamanos = []
  for (const m of css.matchAll(/font-size:\s*([^;}]+)/gi)) { const v = px(m[1]); if (v !== null) tamanos.push(v) }
  for (const m of todo.matchAll(/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g)) tamanos.push(TW_TEXTO[m[1]])

  return { radios, espacios, tamanos }
}

export const dominancia = arr => {
  if (arr.length < 8) return null
  const c = {}
  for (const v of arr) c[v] = (c[v] || 0) + 1
  return Math.max(...Object.values(c)) / arr.length
}
