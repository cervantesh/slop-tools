// Comprobaciones programaticas: las que exigen ratios, distribuciones,
// resolucion de tokens o estado entre archivos, y por tanto no caben en un
// patron declarativo.

import { find, all, esProsa, lineaDe } from './util.mjs'
import { neutrosPlanos, paresBajoContraste, botonInvisible, diversidadDeTono } from './color.mjs'
import { navPorDefecto, footerPorDefecto, cromoFalso, kickerEnDosColumnas, esqueletoDashboard } from './structure.mjs'

export function programaticas(ctx) {
  const { styleFiles, codeFiles, tokens, blks, cssTexto } = ctx

  return [

    { id: 'A2', cat: 'Color', weight: 2, applies: 'landing', title: 'Dark mode permanente por defecto',
      exempt: ['atmospheric'],
      run() {
        const dark = /color-scheme:\s*dark\b/.test(cssTexto)
        const luz = /prefers-color-scheme:\s*light|\[data-theme=["']light|\.light\b/.test(cssTexto)
        return { failed: dark && !luz,
          detail: dark ? (luz ? 'oscuro con alternativa clara' : 'solo oscuro, sin alternativa') : 'no fija esquema oscuro' }
      } },

    { id: 'A3', cat: 'Color', weight: 2, applies: 'ambos', title: 'Glassmorphism indiscriminado',
      run() {
        const r = find(/backdrop-filter\s*:/i, styleFiles)
        const archivos = new Set(r.samples.map(s => s.file)).size
        return { failed: r.total >= 4,
          detail: `${r.total} declaraciones en ${archivos}+ archivo(s)`,
          nota: archivos > 1 && r.total / Math.max(archivos, 1) < 2
            ? 'las coincidencias se reparten entre archivos: puede ser un token repetido, no densidad'
            : null,
          samples: r.samples }
      } },

    { id: 'B1', cat: 'Tipografia', weight: 2, applies: 'ambos', title: 'Familia por defecto de las herramientas de IA',
      run() {
        const m = cssTexto.match(/font-family:\s*["']?(Inter|Poppins|Geist|Space Grotesk|Roboto|Open Sans)\b/i)
        return { failed: !!m, detail: m ? `principal: ${m[1]}` : 'familia no estandar' }
      } },

    { id: 'B2', cat: 'Tipografia', weight: 1, applies: 'landing', title: 'Sin pareja tipografica',
      run() {
        const stacks = new Set([...cssTexto.matchAll(/font-family:\s*([^;]+);/g)]
          .map(m => m[1].split(',')[0].trim().replace(/["']/g, '').toLowerCase())
          .filter(s => s && !s.startsWith('var(') && s !== 'inherit'))
        return { failed: stacks.size <= 1, detail: `${stacks.size} familia(s): ${[...stacks].join(', ') || '—'}` }
      } },

    // Con expansion de shorthand. Sin esto, la regla se evade escribiendo
    // border-width/style/color por separado (patron de declaration-strict-value).
    { id: 'C1', cat: 'Layout', weight: 3, applies: 'ambos', title: 'Borde gris plano de 1px',
      run() {
        const corto = find(/border(-(top|right|bottom|left))?:\s*1px\s+solid/i, styleFiles)
        let largo = 0
        const muestrasLargo = []
        for (const b of blks) {
          if (/border(-\w+)?-width:\s*1px/i.test(b.cuerpo) && /border(-\w+)?-style:\s*solid/i.test(b.cuerpo)) {
            largo++
            if (muestrasLargo.length < 3) muestrasLargo.push({ file: b.file, line: lineaDe(b.texto, b.indice), text: b.selector })
          }
        }
        const total = corto.total + largo
        const radios = find(/border-radius\s*:/i, styleFiles).total || 1
        const ratio = total / radios
        return { failed: total >= 15 && ratio > 0.2,
          detail: `${total} bordes planos (${corto.total} shorthand + ${largo} longhand) frente a ${radios} radios · ratio ${ratio.toFixed(2)}`,
          samples: [...corto.samples, ...muestrasLargo] }
      } },

    { id: 'C3', cat: 'Layout', weight: 2, applies: 'ambos', title: 'Radio y padding uniformes',
      run() {
        const dominancia = (re) => {
          const vals = [...cssTexto.matchAll(re)].map(m => m[1].trim())
          if (vals.length < 10) return null
          const cuenta = {}
          for (const v of vals) cuenta[v] = (cuenta[v] || 0) + 1
          const top = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0]
          return { total: vals.length, distintos: Object.keys(cuenta).length, top: top[0], ratio: top[1] / vals.length }
        }
        const r = dominancia(/border-radius:\s*([^;]+);/gi)
        const p = dominancia(/(?:^|[;{])\s*padding:\s*([^;]+);/gi)
        const uniforme = [r, p].filter(x => x && x.ratio > 0.6)
        return { failed: uniforme.length > 0,
          detail: [r && `radios: ${r.distintos} distintos, dominante "${r.top}" al ${(r.ratio * 100) | 0}%`,
                   p && `padding: ${p.distintos} distintos, dominante "${p.top}" al ${(p.ratio * 100) | 0}%`]
            .filter(Boolean).join(' · ') || 'muestra insuficiente' }
      } },

    { id: 'E4', cat: 'Copy', weight: 3, applies: 'ambos', title: 'Copy duplicado literalmente',
      run() {
        const seen = new Map()
        for (const f of codeFiles) {
          for (let i = 0; i < f.lines.length; i++) {
            for (const m of f.lines[i].matchAll(/>([^<>{}]{30,200})<|["'`]([^"'`\n]{30,200})["'`]/g)) {
              const s = (m[1] || m[2] || '').trim()
              if (!esProsa(s)) continue
              if (!seen.has(s)) seen.set(s, [])
              seen.get(s).push({ file: f.rel, line: i + 1, text: s.slice(0, 90) })
            }
          }
        }
        const dups = [...seen.entries()].filter(([, v]) => v.length >= 2)
        return { failed: dups.length > 0, detail: `${dups.length} cadena(s) repetida(s)`,
          samples: dups.slice(0, 6).map(([s, v]) => ({ file: v[0].file, line: v[0].line, text: `x${v.length} — "${s.slice(0, 78)}"` })) }
      } },

    { id: 'F2', cat: 'Motion', weight: 1, applies: 'ambos', title: 'Sin movimiento intencionado',
      run() {
        const kf = find(/@keyframes/i, styleFiles).total
        const tr = find(/transition\s*:/i, styleFiles).total
        return { failed: kf === 0 && tr <= 2, detail: `${kf} keyframes, ${tr} transiciones` }
      } },

    /* ── localizacion ── */

    { id: 'L1', cat: 'Localizacion', weight: 3, applies: 'producto', title: 'Plural sin resolver junto a un contador',
      run() {
        const r = find(/\{[^}]{1,40}\}\s+[a-zaeiouñáéíóú]{3,}s\b/i, codeFiles)
        return { failed: r.total > 0, detail: `${r.total} contador(es) sin pluralizar`, samples: r.samples }
      } },

    { id: 'L3', cat: 'Localizacion', weight: 3, applies: 'producto', title: 'Diacriticos repartidos de forma sistematica',
      run() {
        const ES = /\b(de|la|el|los|las|para|con|tu|servicio|usuario|nombre|precio)\b/i
        const stats = []
        for (const f of codeFiles) {
          const prosa = [...f.text.matchAll(/["'`]([^"'`\n]{15,})["'`]|>([^<>{}\n]{15,})</g)]
            .map(m => (m[1] || m[2] || '')).join(' ')
          if (prosa.length < 200 || !ES.test(prosa)) continue
          stats.push({ rel: f.rel, no: (f.text.match(/[^\x00-\x7F]/g) || []).length })
        }
        const ceros = stats.filter(s => s.no === 0)
        const conAcentos = stats.filter(s => s.no >= 5)
        const failed = ceros.length > 0 && conAcentos.length > 0
        return { failed,
          detail: failed
            ? `${ceros.length} archivo(s) con prosa espanola y CERO acentos frente a ${conAcentos.length} plenamente acentuado(s): reparto sistematico, no habito de teclado`
            : `${stats.length} archivo(s) con prosa espanola; sin bifurcacion`,
          samples: ceros.slice(0, 5).map(s => ({ file: s.rel, line: 1, text: '0 caracteres no ASCII' })) }
      } },

    { id: 'T1', cat: 'Accesibilidad', weight: 2, applies: 'producto', title: 'Botones de solo icono sin nombre accesible',
      run() {
        const out = []
        let total = 0
        for (const f of codeFiles) {
          for (const m of f.text.matchAll(/<button\b([^>]*)>([\s\S]{0,400}?)<\/button>/g)) {
            const [, attrs, inner] = m
            if (/aria-label|title=/.test(attrs)) continue
            const texto = inner.replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, '').trim()
            const icono = /<svg|<[A-Z]\w+\s|Icon\b/.test(inner)
            if (icono && texto.replace(/[^a-záéíóúñ]/gi, '').length < 2) {
              total++
              if (out.length < 5) out.push({ file: f.rel, line: lineaDe(f.text, m.index), text: inner.trim().replace(/\s+/g, ' ').slice(0, 70) })
            }
          }
        }
        return { failed: total > 0, detail: `${total} boton(es) sin nombre accesible`, samples: out }
      } },

    // Semilla y normalizacion de jsx-a11y/anchor-ambiguous-text.
    // Ojo: la regla original casa la cadena COMPLETA. Aqui se amplia a la
    // cadena completa tras normalizar, que es el mismo perfil de falsos
    // positivos; ampliarlo a subcadena dispararia los FP.
    { id: 'T2', cat: 'Copy', weight: 1, applies: 'ambos', title: 'Enlaces y botones con texto vacio',
      run() {
        const VACIAS = new Set(['click here', 'here', 'link', 'a link', 'learn more',
          'clic aqui', 'aqui', 'enlace', 'saber mas', 'leer mas', 'ver mas', 'mas informacion'])
        const norm = s => s.trim().replace(/\s+/g, ' ')
          .replace(/[,.?¿!‽¡;:]/g, '')
          .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
        const out = []
        for (const f of codeFiles) {
          for (const m of f.text.matchAll(/<(a|button|Link)\b[^>]*>([^<]{2,40})<\/\1>/g)) {
            if (VACIAS.has(norm(m[2]))) out.push({ file: f.rel, line: lineaDe(f.text, m.index), text: m[2].trim() })
          }
        }
        return { failed: out.length > 0, detail: `${out.length} destino(s) sin texto util`, samples: out.slice(0, 5) }
      } },

    /* ── color resuelto sobre tokens ── */

    { id: 'K1', cat: 'Color', weight: 2, applies: 'ambos', title: 'Neutros de croma cero',
      exempt: ['modern-minimal'],
      run() {
        const hits = neutrosPlanos(tokens)
        return { failed: hits.length >= 3,
          detail: `${hits.length} token(es) neutros con croma < 0.005 sobre ${tokens.size} tokens`,
          samples: hits.slice(0, 5).map(h => ({ file: '(tokens)', line: 1, text: `${h.nombre}: ${h.valor} — C=${h.C}` })) }
      } },

    { id: 'K2', cat: 'Color', weight: 3, applies: 'ambos', title: 'Pares texto/fondo por debajo de 4.5:1',
      run() {
        const hits = paresBajoContraste(blks, tokens)
        return { failed: hits.length > 0,
          detail: `${hits.length} regla(s) con contraste insuficiente (WCAG 2, no APCA)`,
          samples: hits.slice(0, 5).map(h => ({ file: h.file, line: 1, text: `${h.selector} — ${h.ratio}:1` })) }
      } },

    { id: 'K3', cat: 'Color', weight: 3, applies: 'ambos', title: 'Texto de boton indistinguible del relleno',
      run() {
        const hits = botonInvisible(blks, tokens)
        return { failed: hits.length > 0,
          detail: `${hits.length} boton(es) con texto dentro de 5% L y 0.05 C del fondo`,
          samples: hits.slice(0, 5).map(h => ({ file: h.file, line: 1, text: `${h.selector} — dL=${h.dL} dC=${h.dC}` })) }
      } },

    { id: 'K4', cat: 'Color', weight: 1, applies: 'ambos', title: 'Paleta sin foco: demasiadas familias de tono',
      run() {
        const d = diversidadDeTono(tokens)
        return { failed: d.familias > 4,
          detail: `${d.tonos} tokens cromaticos en ${d.familias} familia(s) de tono (cubos de 30 grados)` }
      } },

    /* ── huellas estructurales ── */

    { id: 'S1', cat: 'Estructura', weight: 2, applies: 'landing', title: 'Nav por defecto',
      run() {
        const { hits, hairline } = navPorDefecto(codeFiles, cssTexto)
        return { failed: hits.length > 0 && hairline,
          detail: hits.length ? `${hits.length} nav con 3-6 enlaces + boton${hairline ? ' y hairline de 1px' : ' (sin hairline)'}` : 'sin nav canonico',
          samples: hits.slice(0, 4) }
      } },

    { id: 'S2', cat: 'Estructura', weight: 2, applies: 'landing', title: 'Footer de cuatro columnas canonicas',
      run() {
        const hits = footerPorDefecto(codeFiles)
        return { failed: hits.length > 0, detail: `${hits.length} footer(s) con columnas Product/Company/Resources/Legal`, samples: hits.slice(0, 3) }
      } },

    { id: 'S3', cat: 'Estructura', weight: 2, applies: 'ambos', title: 'Cromo falso dibujado a mano',
      run() {
        const hits = cromoFalso(codeFiles, cssTexto)
        return { failed: hits.length > 0, detail: `${hits.length} senal(es) de navegador, movil o terminal simulados`, samples: hits.slice(0, 4) }
      } },

    { id: 'S4', cat: 'Estructura', weight: 1, applies: 'landing', title: 'Kicker y titular en varias columnas',
      run() {
        const { hits, gridMulti } = kickerEnDosColumnas(codeFiles, cssTexto)
        return { failed: hits.length > 0 && gridMulti,
          detail: hits.length ? `${hits.length} wrapper(s) con kicker + titular${gridMulti ? ' y rejilla multicolumna presente' : ''}` : 'sin coincidencias',
          samples: hits.slice(0, 4) }
      } },

    { id: 'S5', cat: 'Estructura', weight: 2, applies: 'producto', title: 'Esqueleto de dashboard por defecto',
      run() {
        const p = esqueletoDashboard(codeFiles)
        return { failed: p.length >= 3,
          detail: p.length ? `${p.length}/4 senales: ${p.join(', ')}` : 'sin senales' }
      } },
  ]
}
