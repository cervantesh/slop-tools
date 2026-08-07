// Huellas estructurales. Eje tomado de hallmark (gates 42, 43, 47, 54).
//
// El principio que hay que respetar al portarlas: la regla se ancla en la FORMA
// DEL CONTENIDO, no en una allowlist de nombres de clase. Un detector que busque
// class="navbar" falla en cuanto alguien la llama "header-shell".

import { lineaDe } from './util.mjs'

const muestra = (f, idx, txt) => ({ file: f.rel, line: lineaDe(f.text, idx), text: txt.replace(/\s+/g, ' ').slice(0, 100) })

// Nav por defecto: wordmark a la izquierda, 4-5 enlaces en linea, boton a la
// derecha, hairline de 1px abajo.
export function navPorDefecto(codeFiles, cssTexto) {
  const hits = []
  const hairline = /border-bottom:\s*1px\s+solid/i.test(cssTexto)
  for (const f of codeFiles) {
    for (const m of f.text.matchAll(/<(nav|header)\b[^>]*>([\s\S]{0,3000}?)<\/\1>/gi)) {
      const inner = m[2]
      const enlaces = (inner.match(/<(a|Link|NavLink)\b/gi) || []).length
      const botones = (inner.match(/<(button|Button)\b/gi) || []).length
      if (enlaces >= 3 && enlaces <= 6 && botones >= 1) {
        hits.push({ ...muestra(f, m.index, m[0].slice(0, 100)), meta: `${enlaces} enlaces + ${botones} boton(es)${hairline ? ' + hairline 1px' : ''}` })
      }
    }
  }
  return { hits, hairline }
}

// Footer por defecto: cuatro columnas Product/Company/Resources/Legal.
export function footerPorDefecto(codeFiles) {
  const COLS = /\b(product|producto|company|empresa|resources|recursos|legal|soporte|support|company)\b/i
  const hits = []
  for (const f of codeFiles) {
    for (const m of f.text.matchAll(/<footer\b[^>]*>([\s\S]{0,6000}?)<\/footer>/gi)) {
      const inner = m[1]
      const encabezados = [...inner.matchAll(/<(h[3-6]|strong|span)\b[^>]*>([^<]{3,24})</gi)]
        .map(x => x[2].trim()).filter(t => COLS.test(t))
      const unicos = new Set(encabezados.map(t => t.toLowerCase()))
      if (unicos.size >= 3) {
        hits.push({ ...muestra(f, m.index, [...unicos].join(' · ')), meta: `${unicos.size} columnas canonicas` })
      }
    }
  }
  return hits
}

// Cromo falso dibujado a mano: barra de navegador con puntos semaforo, marco de
// movil con notch, terminal o IDE simulados.
export function cromoFalso(codeFiles, cssTexto) {
  const hits = []
  const semaforo = /(#ff5f5[67]|#febc2e|#28c840|#ff605c|#ffbd44|#00ca4e)/i
  for (const f of codeFiles) {
    for (const m of f.text.matchAll(/\b(class(Name)?=["'][^"']*\b(window-chrome|browser-bar|browser-mock|traffic-lights?|mac-?dots|notch|device-frame|phone-frame|terminal-window|fake-browser|url-pill)\b)/gi)) {
      hits.push({ ...muestra(f, m.index, m[0]), meta: 'nombre de cromo simulado' })
    }
  }
  if (semaforo.test(cssTexto)) {
    hits.push({ file: '(css)', line: 1, text: 'colores de puntos semaforo de macOS', meta: 'paleta de cromo simulado' })
  }
  return hits
}

// Kicker + heading resueltos en varias columnas.
// Gate 54: cualquier wrapper que contenga un eyebrow/kicker Y un heading debe
// resolver a una sola columna. Se ancla en la forma del contenido.
export function kickerEnDosColumnas(codeFiles, cssTexto) {
  const gridMulti = /grid-template-columns:\s*(?:repeat\(\s*[2-9]|[^;]*\b(?:1fr|auto)\b[^;]*\b(?:1fr|auto)\b)/i.test(cssTexto)
  const hits = []
  for (const f of codeFiles) {
    for (const m of f.text.matchAll(/<(div|section|header)\b[^>]*>([\s\S]{0,800}?)<\/\1>/gi)) {
      const inner = m[2]
      const tieneKicker = /class(Name)?=["'][^"']*\b(eyebrow|kicker|overline|label|badge|pill|section-label)\b/i.test(inner)
      const tieneHeading = /<h[1-3]\b/i.test(inner)
      if (tieneKicker && tieneHeading) {
        hits.push({ ...muestra(f, m.index, m[0].slice(0, 100)), meta: gridMulti ? 'con rejilla multicolumna en la hoja' : 'candidato' })
      }
    }
  }
  return { hits, gridMulti }
}

// Esqueleto de dashboard por defecto, la variante mejor especificada de
// anti-ai-slop: sidebar oscuro, fila de 4 KPI, dos columnas, donut, tabla.
// Ampliado tras dar cero disparos en 71 proyectos: buscaba nombres de clase
// propios y en Tailwind no existen. Se apoya tambien en nombres de componente
// y de datos, que es donde vive la estructura en un arbol de React.
export function esqueletoDashboard(codeFiles) {
  const señales = {
    sidebar: /class(Name)?=["'][^"']*\b(sidebar|side-nav|drawer)\b|<Sidebar\b|\bSidebar\s*[=({]/i,
    kpis: /class(Name)?=["'][^"']*\b(kpi|stat-card|metric-card|stats-row)\b|<(StatCard|MetricCard|KpiCard)\b|\b(kpis|metrics|stats)\s*[:=]\s*\[/i,
    donut: /\b(donut|doughnut|pie-?chart|PieChart|DoughnutChart)\b/i,
    actividad: /\b(recent-?activity|actividad-?reciente|activity-?feed|RecentActivity)\b/i,
  }
  const presentes = []
  const texto = codeFiles.map(f => f.text).join('\n')
  for (const [k, re] of Object.entries(señales)) if (re.test(texto)) presentes.push(k)
  return presentes
}

// Firma de macroestructura para comparar entre ejecuciones.
// Patron tomado de .hallmark/log.json: si dos builds consecutivos producen la
// misma firma, el generador no esta divergiendo.
export function firmaMacro(codeFiles, tokens) {
  const secciones = []
  for (const f of codeFiles) {
    for (const m of f.text.matchAll(/<(section|nav|footer|header|main|aside)\b/gi)) secciones.push(m[1].toLowerCase())
  }
  const familias = [...new Set([...String([...tokens.values()].join(' ')).matchAll(/font-family[^;]*/gi)].map(x => x[0]))]
  return {
    secuencia: secciones.slice(0, 40).join('>'),
    conteo: secciones.length,
    tokens: tokens.size,
    familias: familias.length,
  }
}
