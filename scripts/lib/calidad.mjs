// Eje de "calidad de sistema / higiene de producto" — distinto de procedencia
// y de contrato. No afirma buen diseño visual; mide señales estáticas de
// disciplina (a11y básica, estados, tokens, foco, reduced-motion) que un
// producto mantenido suele tener y el slop a menudo omite.
//
// failed = falta la señal buena o hay defecto de higiene.

import { lineaDe } from './util.mjs'

/**
 * @param {object} ctx { files, codeFiles, styleFiles, cssTexto }
 * @returns {{ score, checks, fallan, total }}
 */
export function comprobarCalidad(ctx) {
  const { files, codeFiles, styleFiles, cssTexto } = ctx
  const todo = files.map(f => f.text).join('\n')
  const codigo = codeFiles.map(f => f.text).join('\n')

  const checks = []

  // Q1 · prefers-reduced-motion cuando hay animación/transición
  {
    const anima = /@keyframes|transition\s*:|animation\s*:/i.test(cssTexto) || /transition-|animate-/i.test(codigo)
    const reduce = /prefers-reduced-motion/i.test(cssTexto) || /prefers-reduced-motion/i.test(codigo)
    const failed = anima && !reduce
    checks.push({
      id: 'Q1', tipo: 'calidad', cat: 'Motion', weight: 2, title: 'Animación sin prefers-reduced-motion',
      failed,
      detail: !anima ? 'sin animación declarada' : reduce ? 'hay alternativa reduced-motion' : 'hay motion y falta reduced-motion',
      fix: 'Añade @media (prefers-reduced-motion: reduce) acortando animation/transition.',
      samples: [],
    })
  }

  // Q2 · :focus-visible en estilos interactivos
  {
    const interactivo = /button|\.btn|role=["']button|type=["']submit/i.test(todo)
    const focus = /:focus-visible|:focus\b/i.test(cssTexto) || /focus-visible:|focus:/i.test(codigo)
    checks.push({
      id: 'Q2', tipo: 'calidad', cat: 'Accesibilidad', weight: 2, title: 'Sin estilo de foco visible',
      failed: interactivo && !focus,
      detail: !interactivo ? 'sin controles detectados' : focus ? 'hay :focus / focus-visible' : 'controles sin foco estilado',
      fix: 'Define :focus-visible en botones y enlaces (outline o anillo).',
      samples: [],
    })
  }

  // Q3 · Tokens de color (custom properties) — disciplina de sistema
  {
    const tokens = (cssTexto.match(/--[\w-]+\s*:\s*#|oklch\(|rgb\(/gi) || []).length
    const customProps = (cssTexto.match(/--[\w-]+\s*:/g) || []).length
    checks.push({
      id: 'Q3', tipo: 'calidad', cat: 'Color', weight: 2, title: 'Sin tokens de color reutilizables',
      failed: customProps < 3 && /#[0-9a-fA-F]{3,8}/.test(cssTexto),
      detail: `${customProps} custom properties · ${tokens} con color`,
      fix: 'Centraliza colores en :root o un tokens.css; evita hex sueltos por componente.',
      samples: [],
    })
  }

  // Q4 · lang en documento
  {
    const samples = []
    let ok = false
    for (const f of files) {
      if (/<html[^>]+lang\s*=/i.test(f.text) || /lang:\s*['"][a-z]{2}/i.test(f.text)) ok = true
      if (/<html\b(?![^>]*lang=)/i.test(f.text) && samples.length < 3) {
        samples.push({ file: f.rel, line: 1, text: '<html> sin lang' })
      }
    }
    // Solo falla si hay HTML de documento y ningún lang
    const hayHtml = files.some(f => /<html\b/i.test(f.text))
    checks.push({
      id: 'Q4', tipo: 'calidad', cat: 'Localizacion', weight: 2, title: 'Documento HTML sin lang',
      failed: hayHtml && !ok,
      detail: !hayHtml ? 'sin <html> en el árbol' : ok ? 'lang presente' : 'html sin atributo lang',
      fix: 'Añade lang="es" (o el locale real) en <html>.',
      samples,
    })
  }

  // Q5 · Imágenes sin alt (defecto a11y + calidad)
  {
    const samples = []
    let n = 0
    for (const f of codeFiles) {
      for (const m of f.text.matchAll(/<img\b([^>]*)>/gi)) {
        const attrs = m[1] || ''
        if (/\balt\s*=/i.test(attrs)) continue
        if (/aria-hidden\s*=\s*["']true["']/i.test(attrs)) continue
        n++
        if (samples.length < 5) samples.push({ file: f.rel, line: lineaDe(f.text, m.index), text: m[0].slice(0, 100) })
      }
    }
    checks.push({
      id: 'Q5', tipo: 'calidad', cat: 'Accesibilidad', weight: 3, title: 'Imágenes sin alt',
      failed: n > 0,
      detail: `${n} <img> sin alt`,
      fix: 'alt descriptivo, o alt="" + aria-hidden si es decorativa.',
      samples,
    })
  }

  // Q6 · Estados vacíos genéricos (producto)
  {
    const PAT = /["'`](no data|no results|nothing here|coming soon|no hay datos|no hay nada|sin resultados|pr[oó]ximamente|lorem ipsum)["'`]/gi
    const samples = []
    let n = 0
    for (const f of codeFiles) {
      for (const m of f.text.matchAll(PAT)) {
        n++
        if (samples.length < 5) samples.push({ file: f.rel, line: lineaDe(f.text, m.index), text: m[1] })
      }
    }
    checks.push({
      id: 'Q6', tipo: 'calidad', cat: 'Copy', weight: 2, title: 'Estado vacío o placeholder genérico',
      failed: n >= 2,
      detail: `${n} cadena(s) de vacío/placeholder genérico`,
      fix: 'Explica qué aparecerá y qué hacer (CTA). Evita "No hay datos" sin contexto.',
      samples,
    })
  }

  // Q7 · Mensajes de error opacos
  {
    const PAT = /["'`](error|something went wrong|oops|ha ocurrido un error|error inesperado|try again later)["'`]/gi
    const samples = []
    let n = 0
    for (const f of codeFiles) {
      for (const m of f.text.matchAll(PAT)) {
        n++
        if (samples.length < 5) samples.push({ file: f.rel, line: lineaDe(f.text, m.index), text: m[1] })
      }
    }
    checks.push({
      id: 'Q8', tipo: 'calidad', cat: 'Copy', weight: 1, title: 'Error opaco sin acción',
      // id Q8 reserved - use Q7
      failed: false,
      detail: 'placeholder',
      fix: '',
      samples: [],
    })
    // fix id
    checks.pop()
    checks.push({
      id: 'Q7', tipo: 'calidad', cat: 'Copy', weight: 1, title: 'Error opaco sin acción',
      failed: n >= 3,
      detail: `${n} mensaje(s) de error genérico`,
      fix: 'Di qué falló y qué puede hacer el usuario (reintentar, contactar, revisar campo).',
      samples,
    })
  }

  // Q8 · Jerarquía de headings (saltos h1→h3)
  {
    const samples = []
    let saltos = 0
    for (const f of codeFiles) {
      const niveles = [...f.text.matchAll(/<h([1-6])\b/gi)].map(m => ({ n: +m[1], i: m.index }))
      let prev = 0
      for (const h of niveles) {
        if (prev && h.n > prev + 1) {
          saltos++
          if (samples.length < 5) samples.push({ file: f.rel, line: lineaDe(f.text, h.i), text: `h${prev} → h${h.n}` })
        }
        prev = h.n
      }
    }
    checks.push({
      id: 'Q8', tipo: 'calidad', cat: 'Accesibilidad', weight: 1, title: 'Salto de nivel en headings',
      failed: saltos > 0,
      detail: `${saltos} salto(s) de nivel (p. ej. h1→h3)`,
      fix: 'No saltes niveles; usa CSS para el tamaño visual.',
      samples,
    })
  }

  const fallan = checks.filter(c => c.failed)
  const maxW = checks.reduce((a, c) => a + c.weight, 0)
  const lost = fallan.reduce((a, c) => a + c.weight, 0)
  const score = maxW ? Math.round(100 * (1 - lost / maxW)) : 100

  return {
    score,
    total: checks.length,
    fallan: fallan.length,
    checks,
    nota: 'Higiene estática de producto/a11y/sistema — no mide belleza ni UX completa. Sin render.',
  }
}

/**
 * Comprueba conceptos de dominio en el código (--dominio conceptos.txt).
 * Un concepto por línea; falla si < umbral aparecen.
 */
export function comprobarDominio(codeFiles, conceptos, { minRatio = 0.5 } = {}) {
  if (!conceptos?.length) return null
  const blob = codeFiles.map(f => f.text).join('\n').toLowerCase()
  const filas = conceptos.map(c => {
    const q = c.trim().toLowerCase()
    if (!q || q.startsWith('#')) return null
    const ok = blob.includes(q)
    return { concepto: c.trim(), presente: ok }
  }).filter(Boolean)
  const presentes = filas.filter(f => f.presente).length
  const ratio = filas.length ? presentes / filas.length : 1
  return {
    id: 'DOM1',
    tipo: 'calidad',
    cat: 'Estructura',
    title: 'Conceptos de dominio ausentes en el código',
    weight: 3,
    failed: ratio < minRatio,
    detail: `${presentes}/${filas.length} conceptos del negocio aparecen en el árbol (umbral ${Math.round(minRatio * 100)}%)`,
    fix: 'Modela en UI/copy/código los conceptos del plan de producto; si no están, el producto no es el negocio.',
    samples: filas.filter(f => !f.presente).slice(0, 8).map(f => ({ file: '(dominio)', line: 1, text: f.concepto })),
    filas,
    score: Math.round(ratio * 100),
  }
}
