// Comprobaciones programaticas: las que exigen ratios, distribuciones,
// resolucion de tokens o estado entre archivos, y por tanto no caben en un
// patron declarativo.

import { find, all, esProsa, lineaDe, clasesUtilidad, findClases } from './util.mjs'
import { neutrosPlanos, paresBajoContraste, botonInvisible, diversidadDeTono } from './color.mjs'
import { navPorDefecto, footerPorDefecto, cromoFalso, kickerEnDosColumnas, esqueletoDashboard } from './structure.mjs'

// Arreglo y estado de validacion de cada comprobacion programatica. Van aparte
// del cuerpo para que las funciones queden legibles; las cifras de `validado`
// salen de research/RESULTADOS.md, misma medicion que las declarativas.
const META = {
  A2: { fix: 'Ofrece alternativa clara o justifica el oscuro en el contrato de marca.', validado: { J_banda: 0.06, separa: false } },
  A3: { fix: 'Reserva el desenfoque para lo que de verdad flota sobre contenido.', validado: { J_banda: 0, separa: false, estado: 'no_medible' , revalidar: 'sustrato ampliado a clases de utilidad tras la medicion' } },
  B1: { fix: 'Empareja una display con una de texto. Inter como unica familia es el default de las herramientas.', validado: { J_banda: 0.06, separa: false } },
  B2: { fix: 'Una sola familia bien usada es disciplina en producto; en marca, empareja.', validado: { J_banda: -0.06, separa: false } },
  C1: { fix: 'Separa con espacio primero, luego con un escalon de luminancia del 3-5%. El filete gris es el ultimo recurso.', validado: { J_banda: 0, separa: false, estado: 'no_medible' , revalidar: 'sustrato ampliado a clases de utilidad tras la medicion' } },
  C3: { fix: 'Que el radio y el padding senalen la funcion del elemento en vez de ser constantes.', validado: { J_banda: 0.05, separa: false } },
  E4: { fix: 'Cinco descripciones distintas, o ninguna. Una repetida cinco veces es peor que el vacio.', validado: { J_banda: 0.04, separa: false } },
  L1: { fix: 'Resuelve el plural con un condicional o con Intl.PluralRules.', validado: { J_banda: 0.40, separa: false } },
  L3: { fix: 'Restaura los diacriticos en los archivos que salieron en ASCII plano.', validado: { J_banda: 0.01, separa: false, estado: 'no_medible' } },
  T1: { fix: 'Anade aria-label a todo boton que solo lleve icono.', validado: { J_banda: -0.07, separa: false } },
  T2: { fix: 'Que el texto del enlace diga a donde lleva, fuera de su contexto.', validado: { J_banda: 0.01, separa: false } },
  K1: { fix: 'Da a los neutros un croma minimo de 0.005: un gris con temperatura ancla la paleta.', validado: { J_banda: 0.01, separa: false } },
  K2: { fix: 'Sube el contraste a 4.5:1 en texto de lectura.', validado: { J_banda: 0.01, separa: false } },
  K3: { fix: 'Separa el texto del relleno al menos 5% en luminosidad.', validado: { J_banda: 0, separa: false, estado: 'no_medible' , revalidar: 'sustrato ampliado a clases de utilidad tras la medicion' } },
  K4: { fix: 'Acota a un dominante, un neutro y un acento. Los semanticos van aparte.', validado: { J_banda: -0.04, separa: false } },
  S1: { fix: 'Rompe el arquetipo: la navegacion no tiene por que ser wordmark-enlaces-boton.', validado: { J_banda: 0, separa: false, estado: 'no_medible' , revalidar: 'sustrato ampliado a clases de utilidad tras la medicion' } },
  S2: { fix: 'Agrupa el pie por lo que la gente busca, no por Product/Company/Resources/Legal.', validado: { J_banda: 0, separa: false, estado: 'no_medible' , revalidar: 'sustrato ampliado a clases de utilidad tras la medicion' } },
  S3: { fix: 'Captura real en vez de cromo de navegador dibujado a mano.', validado: { J_banda: 0.01, separa: false } },
  S4: { fix: 'Kicker y titular en una sola columna.', validado: { J_banda: 0, separa: false, estado: 'no_medible' , revalidar: 'sustrato ampliado a clases de utilidad tras la medicion' } },
  S5: { fix: 'Ordena el panel por la decision que toma quien lo usa, no por el esqueleto canonico.', validado: { J_banda: 0, separa: false, estado: 'no_medible' , revalidar: 'sustrato ampliado a clases de utilidad tras la medicion' } },
}

export function programaticas(ctx) {
  const { styleFiles, codeFiles, tokens, blks, cssTexto } = ctx
  const clases = clasesUtilidad(codeFiles)

  return aplicarMeta([

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
        const css = find(/backdrop-filter\s*:/i, styleFiles)
        const util = findClases(/\bbackdrop-blur(-\w+)?\b/i, codeFiles)
        const r = { total: css.total + util.total, samples: [...css.samples, ...util.samples] }
        const archivos = new Set(r.samples.map(s => s.file)).size
        return { failed: r.total >= 4,
          detail: `${r.total} (${css.total} en CSS + ${util.total} en clases) en ${archivos}+ archivo(s)`,
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

    // Peso a 0: J -0.06. Dispara en el 85% de lo generado y el 91% de lo humano.
    // No discrimina en absoluto. Se conserva como observacion informativa porque
    // sigue siendo un criterio de diseno valido, pero no puntua.
    { id: 'B2', cat: 'Tipografia', weight: 0, applies: 'landing', title: 'Sin pareja tipografica',
      run() {
        const stacks = new Set([...cssTexto.matchAll(/font-family:\s*([^;]+);/g)]
          .map(m => m[1].split(',')[0].trim().replace(/["']/g, '').toLowerCase())
          .filter(s => s && !s.startsWith('var(') && s !== 'inherit'))
        return { failed: stacks.size <= 1, detail: `${stacks.size} familia(s): ${[...stacks].join(', ') || '—'}` }
      } },

    // Con expansion de shorthand. Sin esto, la regla se evade escribiendo
    // border-width/style/color por separado (patron de declaration-strict-value).
    // Peso bajado de 3 a 1: J 0.00 en la banda controlada. La fuente lo llamaba
    // "el indicador aislado mas fiable"; sobre proyectos Tailwind reales apenas
    // hay CSS donde pueda disparar. Ver research/RESULTADOS.md §3.3.
    { id: 'C1', cat: 'Layout', weight: 1, applies: 'ambos', title: 'Borde gris plano de 1px',
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
        // Tercera forma, la dominante en Tailwind: `border border-gray-200`.
        const util = findClases(/\bborder(-[trbl])?\b(?=[^"']*\bborder-(gray|slate|zinc|neutral|stone)-\d{2,3}\b)/i, codeFiles)
        const total = corto.total + largo + util.total
        const radios = find(/border-radius\s*:/i, styleFiles).total
          + findClases(/\brounded(-\w+)?\b/i, codeFiles).total || 1
        const ratio = total / radios
        return { failed: total >= 15 && ratio > 0.2,
          detail: `${total} bordes planos (${corto.total} shorthand + ${largo} longhand + ${util.total} en clases) frente a ${radios} radios · ratio ${ratio.toFixed(2)}`,
          samples: [...corto.samples, ...muestrasLargo, ...util.samples] }
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
        // El terminador puede ser ; o }: la ultima declaracion de un bloque
        // suele ir sin punto y coma, y minificada siempre.
        const r = dominancia(/border-radius:\s*([^;}]+)[;}]/gi)
        const p = dominancia(/(?:^|[;{])\s*padding:\s*([^;}]+)[;}]/gi)
        const uniforme = [r, p].filter(x => x && x.ratio > 0.6)
        return { failed: uniforme.length > 0,
          detail: [r && `radios: ${r.distintos} distintos, dominante "${r.top}" al ${(r.ratio * 100) | 0}%`,
                   p && `padding: ${p.distintos} distintos, dominante "${p.top}" al ${(p.ratio * 100) | 0}%`]
            .filter(Boolean).join(' · ') || 'muestra insuficiente' }
      } },

    // Peso bajado de 3 a 1: J 0.04 en banda. Dispara en el 100% de los proyectos
    // generados Y en el 96% de los humanos. Repetir cadenas es universal; mide
    // calidad, no procedencia. Ver research/RESULTADOS.md §3.3.
    { id: 'E4', cat: 'Copy', weight: 1, applies: 'ambos', title: 'Copy duplicado literalmente',
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

    // ELIMINADA · F2 "Sin movimiento intencionado"
    //
    // Unica regla del catalogo con intervalos separados apuntando AL REVES:
    // disparaba en el 30% de los proyectos generados y en el 61% de los humanos
    // (J = -0.31). Era un detector de diseno humano.
    //
    // Causa diagnosticada: exigia cero @keyframes y <=2 transition EN ARCHIVOS DE
    // ESTILO. Un proyecto Tailwind humano no suele tener CSS propio — el
    // movimiento vive en clases de utilidad. No medía ausencia de movimiento:
    // medía ausencia de CSS.
    //
    // research/RESULTADOS.md §3.1

    /* ── localizacion ── */

    // Ojo con el falso positivo que descubrio la suite de mutacion: la
    // implementacion CORRECTA del plural —un ternario que devuelve
    // `${n} plazas` en la rama del plural— contiene literalmente el patron.
    // Solo cuenta si en esa linea no hay condicional ni ayudante de plural.
    { id: 'L1', cat: 'Localizacion', weight: 3, applies: 'producto', title: 'Plural sin resolver junto a un contador',
      run() {
        const PATRON = /\{[^}]{1,40}\}\s+[a-záéíóúñ]{3,}s\b/i
        const RESUELVE = /\?|===\s*1|==\s*1|\bplural|\bcount\s*===|\bIntl\.PluralRules/
        const out = []
        let total = 0
        for (const f of codeFiles) {
          for (let i = 0; i < f.lines.length; i++) {
            const hits = [...f.lines[i].matchAll(new RegExp(PATRON.source, 'gi'))]
            if (!hits.length || RESUELVE.test(f.lines[i])) continue
            total += hits.length
            if (out.length < 5) out.push({ file: f.rel, line: i + 1, text: f.lines[i].trim().slice(0, 110) })
          }
        }
        return { failed: total > 0, detail: `${total} contador(es) sin pluralizar`, samples: out }
      } },

    // MANTIENE peso 3 pese a J 0.01: NO ESTA REFUTADA, esta SIN EVALUAR. La regla
    // es especifica del espanol y el corpus de validacion es casi todo ingles, asi
    // que nunca tuvo oportunidad de disparar. Bajarle el peso por eso seria
    // confundir "no medido" con "no funciona".
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

    // Peso bajado de 2 a 1: J -0.07 en banda. Dispara algo mas en proyectos
    // humanos que generados. Sigue siendo un defecto real de accesibilidad, pero
    // no dice nada sobre procedencia.
    { id: 'T1', cat: 'Accesibilidad', weight: 1, applies: 'producto', title: 'Botones de solo icono sin nombre accesible',
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

    // Peso bajado de 3 a 2: J 0.01, y con poca potencia — exige `color` y
    // `background` en la misma regla CSS, que un proyecto Tailwind casi nunca
    // tiene. No refutada: poco medible. Sigue valiendo como control de a11y.
    { id: 'K2', cat: 'Color', weight: 2, applies: 'ambos', title: 'Pares texto/fondo por debajo de 4.5:1',
      run() {
        const hits = paresBajoContraste(blks, tokens)
        return { failed: hits.length > 0,
          detail: `${hits.length} regla(s) con contraste insuficiente (WCAG 2, no APCA)`,
          samples: hits.slice(0, 5).map(h => ({ file: h.file, line: 1, text: `${h.selector} — ${h.ratio}:1` })) }
      } },

    // Cero disparos en 71 proyectos porque exigia `color` y `background` en la
    // misma regla CSS. En Tailwind el par vive en la cadena de clases:
    // `bg-slate-900 text-slate-900`. Se anade ese sustrato.
    { id: 'K3', cat: 'Color', weight: 3, applies: 'ambos', title: 'Texto de boton indistinguible del relleno',
      run() {
        const hits = botonInvisible(blks, tokens)
        const util = findClases(/\bbg-(black|white)\b(?=[^"']*\btext-\1\b)|\bbg-(\w+)-(\d{2,3})\b(?=[^"']*\btext-\2-\3\b)/i, codeFiles)
        const total = hits.length + util.total
        return { failed: total > 0,
          detail: `${total} caso(s): ${hits.length} en CSS + ${util.total} en clases (mismo color de fondo y de texto)`,
          samples: [...hits.slice(0, 3).map(h => ({ file: h.file, line: 1, text: `${h.selector} — dL=${h.dL} dC=${h.dC}` })), ...util.samples] }
      } },

    { id: 'K4', cat: 'Color', weight: 1, applies: 'ambos', title: 'Paleta sin foco: demasiadas familias de tono',
      run() {
        const d = diversidadDeTono(tokens)
        return { failed: d.familias > 4,
          detail: `${d.tonos} tokens cromaticos en ${d.familias} familia(s) de tono (cubos de 30 grados)` }
      } },

    /* ── huellas estructurales ── */

    // El hairline puede venir del CSS o de la clase `border-b`.
    { id: 'S1', cat: 'Estructura', weight: 2, applies: 'landing', title: 'Nav por defecto',
      run() {
        const { hits } = navPorDefecto(codeFiles, cssTexto)
        const hairline = /border-bottom:\s*1px\s+solid/i.test(cssTexto)
          || findClases(/\bborder-b\b/i, codeFiles).total > 0
        return { failed: hits.length > 0 && hairline,
          detail: hits.length ? `${hits.length} nav con 3-6 enlaces + boton${hairline ? ' y hairline' : ' (sin hairline)'}` : 'sin nav canonico',
          samples: hits.slice(0, 4) }
      } },

    // Cero disparos: exigia <footer> con encabezados en h3-h6, y un arbol de
    // componentes no lo expone al regex — las columnas suelen salir de un
    // .map() sobre datos. Se ancla en las cuatro etiquetas canonicas juntas,
    // que es la forma del contenido y no su marcado.
    { id: 'S2', cat: 'Estructura', weight: 2, applies: 'landing', title: 'Footer de cuatro columnas canonicas',
      run() {
        const hits = footerPorDefecto(codeFiles)
        const CANON = [/\bproducto?\b/i, /\b(company|empresa|compa)/i, /\b(resources|recursos)\b/i, /\blegal\b/i]
        const porContenido = []
        for (const f of codeFiles) {
          const cuantas = CANON.filter(re => re.test(f.text)).length
          if (cuantas === 4) porContenido.push({ file: f.rel, line: 1, text: 'las cuatro etiquetas canonicas en el mismo archivo' })
        }
        const total = hits.length + porContenido.length
        return { failed: total > 0,
          detail: `${total} footer(s) canonico(s): ${hits.length} por marcado + ${porContenido.length} por contenido`,
          samples: [...hits.slice(0, 2), ...porContenido.slice(0, 2)] }
      } },

    { id: 'S3', cat: 'Estructura', weight: 2, applies: 'ambos', title: 'Cromo falso dibujado a mano',
      run() {
        const hits = cromoFalso(codeFiles, cssTexto)
        return { failed: hits.length > 0, detail: `${hits.length} senal(es) de navegador, movil o terminal simulados`, samples: hits.slice(0, 4) }
      } },

    { id: 'S4', cat: 'Estructura', weight: 1, applies: 'landing', title: 'Kicker y titular en varias columnas',
      run() {
        const { hits } = kickerEnDosColumnas(codeFiles, cssTexto)
        const gridMulti = /grid-template-columns:\s*(?:repeat\(\s*[2-9]|[^;]*\b(?:1fr|auto)\b[^;]*\b(?:1fr|auto)\b)/i.test(cssTexto)
          || findClases(/\b(md:|lg:)?grid-cols-[2-9]\b/i, codeFiles).total > 0
        return { failed: hits.length > 0 && gridMulti,
          detail: hits.length ? `${hits.length} wrapper(s) con kicker + titular${gridMulti ? ' y rejilla multicolumna presente' : ''}` : 'sin coincidencias',
          samples: hits.slice(0, 4) }
      } },

    { id: 'S5', cat: 'Estructura', weight: 2, applies: 'producto', title: 'Esqueleto de dashboard por defecto',
      run() {
        const p = esqueletoDashboard(codeFiles)
        return { failed: p.length >= 3,
          detail: p.length ? `${p.length}/4 senales: ${p.join(', ')}` : 'sin senales' }
      } },  ])
}

// Une cada comprobacion con su arreglo y su estado de validacion.
function aplicarMeta(lista) {
  return lista.map(c => ({ ...c, ...(META[c.id] || {}) }))
}
