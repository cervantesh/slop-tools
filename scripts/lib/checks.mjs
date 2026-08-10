// Comprobaciones programaticas: las que exigen ratios, distribuciones,
// resolucion de tokens o estado entre archivos, y por tanto no caben en un
// patron declarativo.

import { find, all, esProsa, lineaDe, clasesUtilidad, findClases } from './util.mjs'
import { neutrosPlanos, paresBajoContraste, botonInvisible, diversidadDeTono, parseColor, oklch, resolver } from './color.mjs'
import { navPorDefecto, footerPorDefecto, cromoFalso, kickerEnDosColumnas, esqueletoDashboard } from './structure.mjs'
import { escalas } from './escala.mjs'
import { readFileSync as _leer } from 'node:fs'
import { dirname as _dir, join as _join } from 'node:path'
import { fileURLToPath as _url } from 'node:url'

// Evidencia empirica de cada comprobacion, generada por
// research/apply-weights.mjs desde research/medicion.json. Se carga en vez de
// copiarse a mano: copiar cifras de una medicion a un fichero fuente es como se
// desincronizan.
let VALIDACION = {}
try {
  const ruta = _join(_dir(_url(import.meta.url)), '..', '..', 'data', 'validacion.json')
  VALIDACION = JSON.parse(_leer(ruta, 'utf8')).reglas || {}
} catch { VALIDACION = {} }

// Arreglo y estado de validacion de cada comprobacion programatica. Van aparte
// del cuerpo para que las funciones queden legibles; las cifras de `validado`
// salen de research/RESULTADOS.md, misma medicion que las declarativas.
const META = {
  A2: { fix: 'Ofrece alternativa clara o justifica el oscuro en el contrato de marca.', doctrina: 'references/doctrina/color.md' },
  A3: { fix: 'Reserva el desenfoque para lo que de verdad flota sobre contenido.', doctrina: 'references/doctrina/color.md' },
  B1: { fix: 'Empareja una display con una de texto. Inter como unica familia es el default de las herramientas.', doctrina: 'references/doctrina/tipografia.md' },
  B2: { fix: 'Una sola familia bien usada es disciplina en producto; en marca, empareja.', doctrina: 'references/doctrina/tipografia.md' },
  C1: { fix: 'Separa con espacio primero, luego con un escalon de luminancia del 3-5%. El filete gris es el ultimo recurso.', doctrina: 'references/doctrina/composicion.md' },
  C3: { fix: 'Que el radio y el padding senalen la funcion del elemento en vez de ser constantes.', doctrina: 'references/doctrina/composicion.md' },
  C4: {
    fix: 'Declara una escala de espaciado y quedate en ella. Catorce valores distintos no es un sistema, es la escala de Tailwind usada a discrecion.',
    doctrina: 'references/doctrina/composicion.md',
    validado: {
      J_banda: 0.552, pos: 0.90, neg: 0.35, separa: true, insample: true,
      n: { pos: 20, neg: 23 },
      decision: 'J 0,55 con intervalos separados, la mas alta del catalogo. Pero el umbral se ajusto sobre la MISMA muestra que la valida: la cifra encogera fuera de muestra.',
    },
  },
  E4: { fix: 'Cinco descripciones distintas, o ninguna. Una repetida cinco veces es peor que el vacio.' },
  L1: { fix: 'Resuelve el plural con un condicional o con Intl.PluralRules.', doctrina: 'references/doctrina/microcopy.md' },
  L3: { fix: 'Restaura los diacriticos en los archivos que salieron en ASCII plano.', doctrina: 'references/doctrina/microcopy.md' },
  T1: { fix: 'Anade aria-label a todo boton que solo lleve icono.', doctrina: 'references/doctrina/microcopy.md' },
  T2: { fix: 'Que el texto del enlace diga a donde lleva, fuera de su contexto.', doctrina: 'references/doctrina/microcopy.md' },
  K1: { fix: 'Da a los neutros un croma minimo de 0.005: un gris con temperatura ancla la paleta.', doctrina: 'references/doctrina/color.md' },
  K2: { fix: 'Sube el contraste a 4.5:1 en texto de lectura.', doctrina: 'references/doctrina/color.md' },
  K3: { fix: 'Separa el texto del relleno al menos 5% en luminosidad.', doctrina: 'references/doctrina/color.md' },
  K4: { fix: 'Acota a un dominante, un neutro y un acento. Los semanticos van aparte.', doctrina: 'references/doctrina/color.md' },
  S1: { fix: 'Rompe el arquetipo: la navegacion no tiene por que ser wordmark-enlaces-boton.', doctrina: 'references/doctrina/direccion.md' },
  S2: { fix: 'Agrupa el pie por lo que la gente busca, no por Product/Company/Resources/Legal.', doctrina: 'references/doctrina/direccion.md' },
  S3: { fix: 'Captura real en vez de cromo de navegador dibujado a mano.', doctrina: 'references/doctrina/direccion.md' },
  S4: { fix: 'Kicker y titular en una sola columna.', doctrina: 'references/doctrina/suelo-de-oficio.md' },
  S5: { fix: 'Ordena el panel por la decision que toma quien lo usa, no por el esqueleto canonico.', doctrina: 'references/doctrina/direccion.md' },

  // Estas cinco salieron de hallmark sin `fix` declarado, asi que el escaner
  // imprimia «(sin arreglo declarado)». Se les da arreglo y puntero de criterio.
  HM1: { fix: 'Titular en redonda. La italica de display es recurso editorial, no enfasis por defecto.', doctrina: 'references/doctrina/tipografia.md' },
  HM7: { fix: 'Dos familias con roles distintos. Una tercera necesita un trabajo que solo ella pueda hacer.', doctrina: 'references/doctrina/tipografia.md' },
  HM8: { fix: 'Anade el bloque prefers-reduced-motion. Movimiento reducido es menos animacion y mas suave, no ninguna.', doctrina: 'references/doctrina/movimiento.md' },
  HM10: { fix: 'Medida de prosa entre 45 y 75 caracteres. El interlineado se ajusta inversamente a la medida.', doctrina: 'references/doctrina/tipografia.md' },
  HM12: { fix: 'Interlineado por encima de 1,0 en mayusculas: sin descendentes, las lineas chocan al partirse.', doctrina: 'references/doctrina/tipografia.md' },

  /* ── portadas de impeccable (Apache-2.0) ── */
  B7: { fix: 'Interlineado de 1,5 a 1,7 en texto de lectura. Por debajo de 1,3 las lineas se tocan.', doctrina: 'references/doctrina/tipografia.md' },
  B8: { fix: 'Alinea a la izquierda. Si el justificado es de marca, activa hyphens: auto y declara el idioma.', doctrina: 'references/doctrina/tipografia.md' },
  B9: { fix: 'Menos tamanos y mas distancia entre ellos: una razon de 1,25 como minimo entre escalones.', doctrina: 'references/doctrina/tipografia.md' },
  C5: { fix: 'Quita el borde o quita el radio. Los dos juntos hacen que el filete corte la curva.', doctrina: 'references/doctrina/composicion.md' },
  C6: { fix: 'Elige uno: borde definido o elevacion suave. Los dos a la vez es la firma, no el estilo.', doctrina: 'references/doctrina/composicion.md' },
  D7: { fix: 'Un visual a tamano de hero merece ilustracion, fotografia o grafico de datos real.', doctrina: 'references/doctrina/suelo-de-oficio.md' },
  K5: { fix: 'Elige el fondo desde la paleta. El crema por reflejo es el beis de la IA.', doctrina: 'references/doctrina/color.md' },
  S6: { fix: 'Borra el kicker. Si las palabras importan, van dentro del titular o en el cuerpo.', doctrina: 'references/doctrina/suelo-de-oficio.md' },
  S7: { fix: 'Que la jerarquia y el contenido lleven la secuencia; una pagina no numera sus propios capitulos.', doctrina: 'references/doctrina/suelo-de-oficio.md' },
  S8: { fix: 'Icono y titular en linea, o el icono suelto en el flujo sin su propia baldosa.', doctrina: 'references/doctrina/suelo-de-oficio.md' },
  UX15: { fix: 'Reserva la rejilla para lienzos, mapas o planos. En lo demas, superficie lisa.', doctrina: 'references/doctrina/suelo-de-oficio.md' },
}

/* ── utilidades de las comprobaciones portadas ── */

// Croma en OKLCH por encima del umbral: separa un acento de un neutro. El
// valor 0.03 es el mismo suelo que usa K1 al reves (alli marca el defecto de
// croma cero, aqui exige que haya color).
function esCromatico(valor, tokens, minimo = 0.03) {
  const rgb = resolver(valor, tokens) || parseColor(valor)
  if (!rgb || rgb.a === 0) return false
  return oklch(rgb).C >= minimo
}

const SELECTOR_TITULAR = /(^|[\s,>+~])(h[1-6]|[.#][\w-]*(title|titulo|heading|display|hero|kicker|eyebrow|label|badge|chip)[\w-]*)\b/i

export function programaticas(ctx) {
  const { files, styleFiles, codeFiles, tokens, blks, cssTexto } = ctx
  const clases = clasesUtilidad(codeFiles)
  const textoTodo = all(files)

  return aplicarMeta([

    // La inversa de C3, y la unica regla del catalogo derivada de la medicion
    // en vez de la bibliografia. Las fuentes decian uniformidad; los datos
    // dicen dispersion: en la banda controlada, lo generado usa 14+ valores
    // distintos de espaciado el 90% de las veces frente al 35% de lo humano.
    //
    // Usa el extractor compartido de escala.mjs a proposito: el umbral se
    // ajusto sobre las cifras que produce ese extractor y no transfiere a otro.
    // research/verifica-escala.mjs comprueba que siguen coincidiendo.
    { id: 'C4', tipo: 'procedencia', cat: 'Layout', weight: 3, applies: 'ambos',
      title: 'Escala de espaciado dispersa',
      run() {
        const { espacios } = escalas(cssTexto, textoTodo)
        const distintos = new Set(espacios).size
        return { failed: distintos >= 14,
          detail: `${distintos} valores distintos de espaciado sobre ${espacios.length} declaraciones (umbral 14)` }
      } },

    { id: 'A2', tipo: 'procedencia', cat: 'Color', weight: 2, applies: 'landing', title: 'Dark mode permanente por defecto',
      exempt: ['atmospheric'],
      run() {
        const dark = /color-scheme:\s*dark\b/.test(cssTexto)
        const luz = /prefers-color-scheme:\s*light|\[data-theme=["']light|\.light\b/.test(cssTexto)
        return { failed: dark && !luz,
          detail: dark ? (luz ? 'oscuro con alternativa clara' : 'solo oscuro, sin alternativa') : 'no fija esquema oscuro' }
      } },

    { id: 'A3', tipo: 'procedencia', cat: 'Color', weight: 3, applies: 'ambos', title: 'Glassmorphism indiscriminado',
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

    { id: 'B1', tipo: 'procedencia', cat: 'Tipografia', weight: 2, applies: 'ambos', title: 'Familia por defecto de las herramientas de IA',
      run() {
        const m = cssTexto.match(/font-family:\s*["']?(Inter|Poppins|Geist|Space Grotesk|Roboto|Open Sans)\b/i)
        return { failed: !!m, detail: m ? `principal: ${m[1]}` : 'familia no estandar' }
      } },

    // Peso a 0: J -0.06. Dispara en el 85% de lo generado y el 91% de lo humano.
    // No discrimina en absoluto. Se conserva como observacion informativa porque
    // sigue siendo un criterio de diseno valido, pero no puntua.
    { id: 'B2', tipo: 'defecto', cat: 'Tipografia', weight: 1, applies: 'landing', title: 'Sin pareja tipografica',
      run() {
        // Tambien las familias declaradas en custom properties. Sin esto, un
        // sistema basado en tokens —donde `font-family` siempre es `var(--x)`—
        // parece no tener ninguna familia y la regla dispara al reves. Lo
        // descubrio slop-init auditandose a si mismo.
        const primera = v => v.split(',')[0].trim().replace(/["']/g, '').toLowerCase()
        const stacks = new Set([
          ...[...cssTexto.matchAll(/font-family:\s*([^;}]+)[;}]/g)].map(m => primera(m[1])),
          ...[...cssTexto.matchAll(/--[\w-]*(?:font|display|texto|type|serif|sans)[\w-]*\s*:\s*([^;}]+)[;}]/gi)].map(m => primera(m[1])),
        ].filter(s => s && !s.startsWith('var(') && s !== 'inherit' && !/^\d/.test(s)))
        return { failed: stacks.size <= 1, detail: `${stacks.size} familia(s): ${[...stacks].join(', ') || '—'}` }
      } },

    // Con expansion de shorthand. Sin esto, la regla se evade escribiendo
    // border-width/style/color por separado (patron de declaration-strict-value).
    // Peso bajado de 3 a 1: J 0.00 en la banda controlada. La fuente lo llamaba
    // "el indicador aislado mas fiable"; sobre proyectos Tailwind reales apenas
    // hay CSS donde pueda disparar. Ver research/RESULTADOS.md §3.3.
    { id: 'C1', tipo: 'procedencia', cat: 'Layout', weight: 1, applies: 'ambos', title: 'Borde gris plano de 1px',
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

    // RECLASIFICADA de procedencia a defecto.
    //
    // Codificaba la hipotesis de las fuentes —"la IA produce radios y
    // espaciados uniformes"— y la medicion la refuto con separacion fuerte:
    // AUC 0,277 en dominancia del radio, o sea que lo GENERADO es MENOS
    // uniforme. C3 mide J = 0,05: no dice nada sobre procedencia.
    //
    // No se elimina porque la uniformidad si es un criterio de disciplina de
    // sistema de diseno. Sigue reportandose, pero fuera de la puntuacion de
    // procedencia. La regla que si discrimina es su inversa, C4.
    // research/RESULTADOS.md §3.5
    { id: 'C3', tipo: 'defecto', cat: 'Layout', weight: 2, applies: 'ambos', title: 'Radio y padding uniformes',
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
    { id: 'E4', tipo: 'procedencia', cat: 'Copy', weight: 1, applies: 'ambos', title: 'Copy duplicado literalmente',
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
    { id: 'L1', tipo: 'procedencia', cat: 'Localizacion', weight: 3, applies: 'producto', title: 'Plural sin resolver junto a un contador',
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

    // PESO 3 -> 1. Premisa falsada: el ASCII irregular no es hábito humano
    // exclusivo ni el corte limpio por archivo prueba proceso automatico.
    // Sobre 19 proyectos humanos en espanol anteriores a ChatGPT dispara en el
    // 26%, IC95 [12-49]. Sin clase positiva no hay J; la tasa ya descalifica
    // el peso maximo. research/l3-espanol.mjs · research/RESULTADOS.md §L3
    { id: 'L3', tipo: 'procedencia', cat: 'Localizacion', weight: 1, applies: 'producto', title: 'Diacriticos repartidos de forma sistematica',
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
    { id: 'T1', tipo: 'defecto', cat: 'Accesibilidad', weight: 1, applies: 'producto', title: 'Botones de solo icono sin nombre accesible',
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
    { id: 'T2', tipo: 'defecto', cat: 'Copy', weight: 1, applies: 'ambos', title: 'Enlaces y botones con texto vacio',
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

    { id: 'K1', tipo: 'procedencia', cat: 'Color', weight: 2, applies: 'ambos', title: 'Neutros de croma cero',
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
    { id: 'K2', tipo: 'defecto', cat: 'Color', weight: 2, applies: 'ambos', title: 'Pares texto/fondo por debajo de 4.5:1',
      run() {
        const hits = paresBajoContraste(blks, tokens)
        return { failed: hits.length > 0,
          detail: `${hits.length} regla(s) con contraste insuficiente (WCAG 2, no APCA)`,
          samples: hits.slice(0, 5).map(h => ({ file: h.file, line: 1, text: `${h.selector} — ${h.ratio}:1` })) }
      } },

    // Cero disparos en 71 proyectos porque exigia `color` y `background` en la
    // misma regla CSS. En Tailwind el par vive en la cadena de clases:
    // `bg-slate-900 text-slate-900`. Se anade ese sustrato.
    { id: 'K3', tipo: 'defecto', cat: 'Color', weight: 1, applies: 'ambos', title: 'Texto de boton indistinguible del relleno',
      run() {
        const hits = botonInvisible(blks, tokens)
        const util = findClases(/\bbg-(black|white)\b(?=[^"']*\btext-\1\b)|\bbg-(\w+)-(\d{2,3})\b(?=[^"']*\btext-\2-\3\b)/i, codeFiles)
        const total = hits.length + util.total
        return { failed: total > 0,
          detail: `${total} caso(s): ${hits.length} en CSS + ${util.total} en clases (mismo color de fondo y de texto)`,
          samples: [...hits.slice(0, 3).map(h => ({ file: h.file, line: 1, text: `${h.selector} — dL=${h.dL} dC=${h.dC}` })), ...util.samples] }
      } },

    { id: 'K4', tipo: 'procedencia', cat: 'Color', weight: 1, applies: 'ambos', title: 'Paleta sin foco: demasiadas familias de tono',
      run() {
        const d = diversidadDeTono(tokens)
        return { failed: d.familias > 4,
          detail: `${d.tonos} tokens cromaticos en ${d.familias} familia(s) de tono (cubos de 30 grados)` }
      } },

    /* ── extraidas de hallmark tras la medicion ──
       Todas con peso 1 y sin validar contra el corpus. Se anaden porque son
       comprobaciones de DEFECTO —accesibilidad, rendimiento, legibilidad— cuyo
       valor no depende de que discriminen procedencia. No suben la puntuacion
       de deteccion; cierran huecos de calidad. */

    { id: 'HM1', tipo: 'defecto', cat: 'Tipografia', weight: 1, applies: 'ambos', title: 'Titulares en italica',
      run() {
        const hits = []
        for (const b of blks) {
          if (!/(^|[\s,>+~])(h[1-6]|[.#][\w-]*(title|heading|display|hero)[\w-]*)\b/i.test(b.selector)) continue
          if (!/font-style:\s*italic/i.test(b.cuerpo)) continue
          hits.push({ file: b.file, line: lineaDe(b.texto, b.indice), text: b.selector.slice(0, 80) })
        }
        return { failed: hits.length > 0,
          detail: `${hits.length} titular(es) en italica`,
          samples: hits.slice(0, 4) }
      } },

    { id: 'HM7', tipo: 'defecto', cat: 'Tipografia', weight: 1, applies: 'ambos', title: 'Mas de tres familias tipograficas',
      run() {
        const fam = new Set([...cssTexto.matchAll(/font-family:\s*([^;}]+)/gi)]
          .map(m => m[1].split(',')[0].trim().replace(/["']/g, '').toLowerCase())
          .filter(s => s && !s.startsWith('var(') && s !== 'inherit' && s !== 'initial'))
        return { failed: fam.size > 3,
          detail: `${fam.size} familia(s): ${[...fam].slice(0, 6).join(', ')}` }
      } },

    { id: 'HM8', tipo: 'defecto', cat: 'Motion', weight: 1, applies: 'ambos', title: 'Animacion sin alternativa de movimiento reducido',
      run() {
        const anima = find(/@keyframes|animation\s*:/i, styleFiles).total
        const respeta = /prefers-reduced-motion/i.test(cssTexto)
        return { failed: anima > 0 && !respeta,
          detail: anima ? `${anima} declaracion(es) de animacion, ${respeta ? 'con' : 'SIN'} bloque prefers-reduced-motion` : 'sin animacion' }
      } },

    // DESCARTADA · HM9 "sin overflow-x: clip en html y body" (hallmark gate 34).
    //
    // Se implemento y se retiro el mismo dia. Afirmaba un defecto a partir de la
    // AUSENCIA DE UNA PROFILAXIS: el gate original exige que no haya scroll
    // horizontal entre 320 y 1920px —cosa que solo se sabe renderizando— y
    // prescribe overflow-x: clip como arreglo. Marcar la falta del arreglo hace
    // disparar la regla en casi todo proyecto bien construido que sencillamente
    // no desborda.
    //
    // Es el modo de fallo de E4, medido: disparar en el 100% de una clase y el
    // 96% de la otra no es detectar, es ruido con peso.

    { id: 'HM10', tipo: 'defecto', cat: 'Tipografia', weight: 1, applies: 'ambos', title: 'Medida de prosa fuera de 45-75ch',
      run() {
        const fuera = []
        for (const m of cssTexto.matchAll(/max-width:\s*(\d+(?:\.\d+)?)ch/gi)) {
          const v = parseFloat(m[1])
          if (v < 45 || v > 75) fuera.push(`${v}ch`)
        }
        return { failed: fuera.length > 0,
          detail: fuera.length ? `${fuera.length} medida(s) fuera de rango: ${[...new Set(fuera)].slice(0, 5).join(', ')}` : 'sin medidas en ch fuera de rango' }
      } },

    { id: 'HM12', tipo: 'defecto', cat: 'Tipografia', weight: 1, applies: 'ambos', title: 'Mayusculas de display con interlineado bajo 1.0',
      run() {
        // Las mayusculas no tienen descendentes: por debajo de 1.0 las cabezas
        // de una linea chocan con la base de la anterior al partirse el titular.
        const hits = []
        for (const b of blks) {
          if (!/text-transform:\s*uppercase/i.test(b.cuerpo)) continue
          const m = b.cuerpo.match(/line-height:\s*(0?\.\d+)/i)
          if (m && parseFloat(m[1]) < 1) {
            hits.push({ file: b.file, line: lineaDe(b.texto, b.indice), text: `${b.selector.slice(0, 60)} — line-height ${m[1]}` })
          }
        }
        return { failed: hits.length > 0, detail: `${hits.length} bloque(s) en mayusculas con interlineado < 1.0`, samples: hits.slice(0, 4) }
      } },

    /* ── huellas estructurales ── */

    // El hairline puede venir del CSS o de la clase `border-b`.
    { id: 'S1', tipo: 'procedencia', cat: 'Estructura', weight: 2, applies: 'landing', title: 'Nav por defecto',
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
    { id: 'S2', tipo: 'procedencia', cat: 'Estructura', weight: 2, applies: 'landing', title: 'Footer de cuatro columnas canonicas',
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

    { id: 'S3', tipo: 'procedencia', cat: 'Estructura', weight: 2, applies: 'ambos', title: 'Cromo falso dibujado a mano',
      run() {
        const hits = cromoFalso(codeFiles, cssTexto)
        return { failed: hits.length > 0, detail: `${hits.length} senal(es) de navegador, movil o terminal simulados`, samples: hits.slice(0, 4) }
      } },

    { id: 'S4', tipo: 'procedencia', cat: 'Estructura', weight: 1, applies: 'landing', title: 'Kicker y titular en varias columnas',
      run() {
        const { hits } = kickerEnDosColumnas(codeFiles, cssTexto)
        const gridMulti = /grid-template-columns:\s*(?:repeat\(\s*[2-9]|[^;]*\b(?:1fr|auto)\b[^;]*\b(?:1fr|auto)\b)/i.test(cssTexto)
          || findClases(/\b(md:|lg:)?grid-cols-[2-9]\b/i, codeFiles).total > 0
        return { failed: hits.length > 0 && gridMulti,
          detail: hits.length ? `${hits.length} wrapper(s) con kicker + titular${gridMulti ? ' y rejilla multicolumna presente' : ''}` : 'sin coincidencias',
          samples: hits.slice(0, 4) }
      } },

    { id: 'S5', tipo: 'procedencia', cat: 'Estructura', weight: 2, applies: 'producto', title: 'Esqueleto de dashboard por defecto',
      run() {
        const p = esqueletoDashboard(codeFiles)
        return { failed: p.length >= 3,
          detail: p.length ? `${p.length}/4 senales: ${p.join(', ')}` : 'sin senales' }
      } },

    /* ── portadas de impeccable (Apache-2.0) ─────────────────────────────
       Se porta el CRITERIO y el umbral; la implementacion esta reescrita
       sobre nuestro motor estatico. La correspondencia id a id y el motivo
       de cada decision estan en research/DELTA-IMPECCABLE.md.

       Todas entran SIN VALIDAR: `validado` sigue siendo null hasta que
       research/measure.mjs produzca su fila. Que la fuente tenga 57.800
       estrellas no es evidencia de nada aqui. */

    // impeccable: tight-leading. Complementa HM12, que solo cubre mayusculas
    // de display por debajo de 1,0.
    { id: 'B7', tipo: 'defecto', cat: 'Tipografia', weight: 1, applies: 'ambos', title: 'Interlineado apretado en texto de lectura',
      run() {
        const hits = []
        for (const b of blks) {
          if (SELECTOR_TITULAR.test(b.selector)) continue
          // Solo el valor sin unidad: `line-height: 20px` depende del tamano de
          // fuente del elemento, que no conocemos sin renderizar.
          const m = b.cuerpo.match(/line-height:\s*(0?\.\d+|1(?:\.\d+)?)\s*(?:;|$|\})/i)
          if (!m) continue
          const v = parseFloat(m[1])
          if (v >= 1.3) continue
          hits.push({ file: b.file, line: lineaDe(b.texto, b.indice), text: `${b.selector.slice(0, 60)} — line-height ${m[1]}` })
        }
        return { failed: hits.length > 0,
          detail: `${hits.length} bloque(s) de texto con interlineado < 1,3`,
          samples: hits.slice(0, 4) }
      } },

    // impeccable: justified-text. La exencion importa: justificar CON
    // particion silabica esta bien hecho, y marcarlo seria marcar el arreglo.
    { id: 'B8', tipo: 'defecto', cat: 'Tipografia', weight: 1, applies: 'ambos', title: 'Texto justificado sin particion silabica',
      run() {
        const hits = []
        for (const b of blks) {
          if (!/text-align:\s*justify/i.test(b.cuerpo)) continue
          if (/hyphens:\s*auto/i.test(b.cuerpo)) continue
          hits.push({ file: b.file, line: lineaDe(b.texto, b.indice), text: b.selector.slice(0, 70) })
        }
        const util = findClases(/\btext-justify\b(?![^"']*\bhyphens-auto\b)/i, codeFiles)
        const total = hits.length + util.total
        return { failed: total > 0,
          detail: `${total} caso(s): ${hits.length} en CSS + ${util.total} en clases, ninguno con hyphens: auto`,
          samples: [...hits.slice(0, 3), ...util.samples] }
      } },

    // impeccable: flat-type-hierarchy. Reutiliza el extractor compartido de
    // escala.mjs, el mismo del que depende el umbral de C4.
    // MEDIDA: peso 2 -> 1. J -0.05 en banda; cero disparos en generado y 5% en
    // humano. La hipotesis de impeccable —que lo generado aplana la escala de
    // tipo— apunta al reves sobre este corpus, igual que le paso a la de
    // espaciado uniforme (C3). No se elimina: sigue siendo criterio valido.
    { id: 'B9', tipo: 'procedencia', cat: 'Tipografia', weight: 1, applies: 'ambos', title: 'Jerarquia tipografica plana',
      run() {
        const { tamanos } = escalas(cssTexto, textoTodo)
        const utiles = tamanos.filter(v => v >= 8 && v <= 200)
        const distintos = [...new Set(utiles.map(v => Math.round(v * 10) / 10))].sort((a, b) => a - b)
        if (distintos.length < 3) {
          return { failed: false, detail: `solo ${distintos.length} tamano(s) distinto(s): muestra insuficiente para juzgar la jerarquia` }
        }
        const razon = distintos[distintos.length - 1] / distintos[0]
        return { failed: razon < 2,
          detail: `${distintos.length} tamanos entre ${distintos[0]}px y ${distintos[distintos.length - 1]}px · razon ${razon.toFixed(2)} (umbral 2)` }
      } },

    // impeccable: border-accent-on-rounded. Es la cara que C2 no alcanza: C2
    // solo casa `border-left: 3-4px solid`, y aqui lo que delata es el choque
    // entre el filete recto y la esquina redonda.
    { id: 'C5', tipo: 'procedencia', cat: 'Layout', weight: 2, applies: 'ambos', title: 'Borde de acento sobre esquina redondeada',
      run() {
        const hits = []
        for (const b of blks) {
          const radio = b.cuerpo.match(/border-radius:\s*([^;}]+)/i)
          if (!radio || /^0\b/.test(radio[1].trim())) continue
          for (const m of b.cuerpo.matchAll(/border-(top|right|bottom|left)\s*:\s*([\d.]+)px\s+\w+\s+([^;}]+)/gi)) {
            if (parseFloat(m[2]) < 2) continue
            if (!esCromatico(m[3].trim(), tokens)) continue
            hits.push({ file: b.file, line: lineaDe(b.texto, b.indice),
              text: `${b.selector.slice(0, 50)} — border-${m[1].toLowerCase()} ${m[2]}px sobre radio ${radio[1].trim().slice(0, 14)}` })
            break
          }
        }
        return { failed: hits.length > 0,
          detail: `${hits.length} elemento(s) con filete de acento y esquina redondeada a la vez`,
          samples: hits.slice(0, 4) }
      } },

    // impeccable: gpt-thin-border-wide-shadow. No es C1 (filete gris a secas):
    // lo que es firma es la COMBINACION de borde definido y elevacion difusa,
    // dos decisiones que se contradicen.
    // MEDIDA: peso 1 -> 2. J 0.22 en banda CON INTERVALOS SEPARADOS, 28% frente
    // a 7%. Es una de las dos portadas que discriminan, y dice algo util: C1
    // —el filete gris a secas— da J -0.01, y la fuente lo llamaba el indicador
    // aislado mas fiable. Lo que separa no es el borde: es el borde CON la
    // sombra ancha, dos decisiones que se contradicen.
    { id: 'C6', tipo: 'procedencia', cat: 'Layout', weight: 2, applies: 'ambos', title: 'Filete de un pixel con sombra ancha',
      run() {
        const hits = []
        for (const b of blks) {
          const borde = b.cuerpo.match(/border(?:-\w+)?:\s*([\d.]+)px\s+(?:solid|dashed)/i)
          if (!borde || parseFloat(borde[1]) > 1.5) continue
          const sombra = b.cuerpo.match(/box-shadow:\s*([^;}]+)/i)
          if (!sombra) continue
          // Tercera longitud de la capa: el desenfoque.
          // El cero se escribe sin unidad (`0 8px 24px`), asi que `px` es opcional
          // en los dos primeros desplazamientos.
          const desenfoques = [...sombra[1].matchAll(/(?:^|,)\s*(?:(?:inset\s+)?)(?:[-\d.]+(?:px)?\s+){2}([\d.]+)px/g)].map(m => parseFloat(m[1]))
          const max = desenfoques.length ? Math.max(...desenfoques) : 0
          if (max < 16) continue
          hits.push({ file: b.file, line: lineaDe(b.texto, b.indice),
            text: `${b.selector.slice(0, 50)} — borde ${borde[1]}px con desenfoque ${max}px` })
        }
        const util = findClases(/\bborder\b(?=[^"']*\bshadow-(?:xl|2xl)\b)/i, codeFiles)
        const total = hits.length + util.total
        return { failed: total >= 3,
          detail: `${total} superficie(s) con filete fino y sombra ancha (${hits.length} en CSS + ${util.total} en clases, umbral 3)`,
          samples: [...hits.slice(0, 3), ...util.samples] }
      } },

    // impeccable: shape-assembled-illustration. Enteramente estatico y
    // sorprendentemente especifico: una escena montada con primitivas.
    // MEDIDA: peso 2 -> 1. J -0.03: cero disparos en generado, 3% en humano.
    { id: 'D7', tipo: 'procedencia', cat: 'Imagen', weight: 1, applies: 'landing', title: 'Ilustracion ensamblada con primitivas',
      run() {
        const hits = []
        for (const f of codeFiles) {
          for (const m of f.text.matchAll(/<svg\b([^>]*)>([\s\S]{0,20000}?)<\/svg>/gi)) {
            const [, attrs, cuerpo] = m
            const primitivas = (cuerpo.match(/<(rect|circle|ellipse|polygon)\b/gi) || []).length
            if (primitivas < 8) continue
            if ((cuerpo.match(/<(text|tspan)\b/gi) || []).length > 2) continue
            if (/<pattern\b/i.test(cuerpo)) continue
            // Tamano intrinseco: atributos width/height, si no el viewBox.
            const ancho = parseFloat((attrs.match(/\bwidth\s*=\s*["']?([\d.]+)/i) || [])[1])
            const alto = parseFloat((attrs.match(/\bheight\s*=\s*["']?([\d.]+)/i) || [])[1])
            const vb = (attrs.match(/viewBox\s*=\s*["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)/i) || [])
            const w = Number.isFinite(ancho) ? ancho : parseFloat(vb[1])
            const h = Number.isFinite(alto) ? alto : parseFloat(vb[2])
            if (!(w >= 200 && h >= 200)) continue
            const rellenos = new Set([...cuerpo.matchAll(/fill\s*=\s*["']([^"']+)["']/gi)]
              .map(x => x[1].trim().toLowerCase())
              .filter(v => v && v !== 'none' && v !== 'transparent' && v !== 'currentcolor'))
            if (rellenos.size < 3) continue
            hits.push({ file: f.rel, line: lineaDe(f.text, m.index),
              text: `svg ${w}x${h} — ${primitivas} primitivas, ${rellenos.size} rellenos` })
          }
        }
        return { failed: hits.length > 0,
          detail: `${hits.length} SVG en linea que monta una escena con primitivas`,
          samples: hits.slice(0, 4) }
      } },

    // impeccable: cream-palette. AS9 casa cuatro hexes concretos y da J ~ 0;
    // esto es la prueba algoritmica, que alcanza toda la familia del papel
    // crema en vez de cuatro puntos sueltos.
    // MEDIDA: peso 2 -> 1. J -0.00 (3% frente a 3%). Se porto justamente para
    // dar a AS9 una oportunidad real: AS9 casa cuatro hexes y esto casa toda la
    // familia del papel crema. Con la puerta ancha sigue sin separar, asi que la
    // estetica crema/serif/terracota no esta en el corpus — no es que no la
    // supieramos detectar.
    { id: 'K5', tipo: 'procedencia', cat: 'Color', weight: 1, applies: 'landing', title: 'Fondo crema por defecto',
      exempt: ['editorial'],
      run() {
        // Crema: claro, calido y poco saturado. r >= g >= b con una distancia
        // corta entre el rojo y el azul; si la distancia crece ya es ambar.
        const esCrema = rgb => {
          if (!rgb || rgb.a < 0.9) return false
          const [r, g, b] = [rgb.r * 255, rgb.g * 255, rgb.b * 255]
          return Math.min(r, g, b) >= 209 && r >= g && g >= b && (r - b) >= 6 && (r - b) <= 48
        }
        const hits = []
        for (const bl of blks) {
          if (!/^(body|html|:root|\.(?:app|page|layout|main|bg|fondo|lienzo)\b)/i.test(bl.selector)) continue
          const m = bl.cuerpo.match(/background(?:-color)?:\s*([^;}]+)/i)
          if (!m) continue
          const rgb = resolver(m[1].trim(), tokens) || parseColor(m[1].trim())
          if (!esCrema(rgb)) continue
          hits.push({ file: bl.file, line: lineaDe(bl.texto, bl.indice), text: `${bl.selector.slice(0, 40)} — ${m[1].trim().slice(0, 30)}` })
        }
        for (const [nombre, valor] of tokens) {
          if (!/(bg|background|lienzo|surface|canvas|paper|fondo)/i.test(nombre)) continue
          if (esCrema(resolver(valor, tokens) || parseColor(valor))) {
            hits.push({ file: '(tokens)', line: 1, text: `${nombre}: ${valor.slice(0, 30)}` })
          }
        }
        return { failed: hits.length > 0,
          detail: `${hits.length} superficie(s) de fondo en la banda del papel crema`,
          samples: hits.slice(0, 4) }
      } },

    // impeccable: kicker-above-heading + hero-eyebrow-chip, fundidas.
    // S4 exige ademas rejilla multicolumna, asi que el kicker suelto —el caso
    // comun— hoy se escapa entero.
    { id: 'S6', tipo: 'procedencia', cat: 'Estructura', weight: 2, applies: 'landing', title: 'Kicker en mayusculas sobre el titular',
      run() {
        // Las tres senales juntas: mayusculas, interletraje abierto y cuerpo
        // pequeno. Con dos de las tres dispara sobre etiquetas legitimas.
        const RE = /<(p|span|div|small)\b[^>]*class(?:Name)?=["'][^"']*\buppercase\b[^"']*["'][^>]*>[\s\S]{0,120}?<\/\1>\s*(?:<[^>]{0,120}>\s*)?<h[1-3]\b/gi
        const hits = []
        for (const f of codeFiles) {
          for (const m of f.text.matchAll(RE)) {
            const clases = (m[0].match(/class(?:Name)?=["']([^"']*)["']/) || [])[1] || ''
            if (!/\btracking-/.test(clases)) continue
            if (!/\btext-(xs|sm)\b/.test(clases)) continue
            hits.push({ file: f.rel, line: lineaDe(f.text, m.index), text: m[0].replace(/\s+/g, ' ').slice(0, 90) })
          }
        }
        return { failed: hits.length > 0,
          detail: `${hits.length} kicker(s) en mayusculas con interletraje abierto justo encima de un titular`,
          samples: hits.slice(0, 4) }
      } },

    // impeccable: numbered-section-labels. Exige DOS indices distintos: uno
    // solo puede ser un paso legitimo de un asistente por pasos.
    { id: 'S7', tipo: 'procedencia', cat: 'Estructura', weight: 1, applies: 'landing', title: 'Etiquetas numeradas de seccion',
      run() {
        const indices = new Set()
        const hits = []
        for (const f of codeFiles) {
          // El contexto va en lookahead a proposito: si se consume, la segunda
          // etiqueta numerada cae dentro de la coincidencia de la primera y la
          // regla nunca llega a ver dos indices.
          for (const m of f.text.matchAll(/>\s*(0[1-9]|[1-9]\d?)\s*<\/(?:span|small|em|strong|b|p|div)>(?=([\s\S]{0,200}))/g)) {
            if (!/<h[2-4]\b/i.test(m[2])) continue
            indices.add(m[1].replace(/^0/, ''))
            if (hits.length < 5) hits.push({ file: f.rel, line: lineaDe(f.text, m.index), text: `indice "${m[1]}" junto a un titular de seccion` })
          }
        }
        return { failed: hits.length >= 2 && indices.size >= 2,
          detail: `${hits.length} etiqueta(s) numerada(s) con ${indices.size} indice(s) distinto(s)`,
          samples: hits.slice(0, 4) }
      } },

    // impeccable: icon-tile-stack. La plantilla universal de tarjeta de
    // caracteristica. Umbral 2: una baldosa suelta puede ser deliberada, la
    // rejilla de baldosas identicas es la plantilla.
    { id: 'S8', tipo: 'procedencia', cat: 'Estructura', weight: 2, applies: 'landing', title: 'Baldosa de icono sobre el titular',
      run() {
        const hits = []
        for (const f of codeFiles) {
          // Mismo motivo que en S7: el contenido va en lookahead para que una
          // baldosa no se trague la siguiente. La senal es la repeticion.
          for (const m of f.text.matchAll(/<div\b[^>]*class(?:Name)?=["']([^"']*)["'][^>]*>(?=([\s\S]{0,400}))/gi)) {
            const clases = m[1]
            // Cuadrada y de tamano de icono: w-N h-N con N igual, o size-N.
            const cuadrada = /\bw-(\d{1,2})\b[^"']*\bh-\1\b/.test(clases) || /\bsize-(\d{1,2})\b/.test(clases)
            if (!cuadrada) continue
            const n = parseInt((clases.match(/\b(?:w|size)-(\d{1,2})\b/) || [])[1], 10)
            if (!(n >= 8 && n <= 24)) continue
            if (!/\brounded/.test(clases) || /\brounded-full\b/.test(clases)) continue
            if (!/\bbg-/.test(clases)) continue
            const dentro = m[2]
            if (!/<svg\b|<[A-Z]\w*Icon\b|\bIcon\b/.test(dentro)) continue
            if (!/<h[1-4]\b/i.test(dentro)) continue
            hits.push({ file: f.rel, line: lineaDe(f.text, m.index), text: clases.slice(0, 80) })
          }
        }
        return { failed: hits.length >= 2,
          detail: `${hits.length} baldosa(s) cuadrada con icono justo encima de un titular (umbral 2)`,
          samples: hits.slice(0, 4) }
      } },

    // impeccable: codex-grid-background. Las paradas de un pixel y la celda en
    // px tienen que estar en el MISMO bloque: por separado son un degradado
    // cualquiera y un tamano de fondo cualquiera.
    { id: 'UX15', tipo: 'procedencia', cat: 'Layout', weight: 1, applies: 'ambos', title: 'Fondo de rejilla decorativa',
      run() {
        const PARADA = /[\d.]+px\s*,\s*transparent\s+[\d.]+px|transparent\s+calc\(\s*100%\s*-\s*[\d.]+px/gi
        const CELDA = /background-size:\s*[^;}]*\d+px/i
        const hits = []
        const revisar = (texto, ref) => {
          const fondo = [...texto.matchAll(/background(?:-image)?:\s*([^;}]+)/gi)].map(m => m[1]).join(' ')
          if (!fondo) return
          const filetes = (fondo.match(PARADA) || []).length
          if (filetes < 2 || !CELDA.test(texto)) return
          hits.push({ ...ref, text: `${filetes} paradas de un pixel con celda en px` })
        }
        for (const b of blks) revisar(b.cuerpo, { file: b.file, line: lineaDe(b.texto, b.indice) })
        for (const f of codeFiles) {
          for (const m of f.text.matchAll(/style=["']([^"']{40,600})["']/gi)) {
            revisar(m[1], { file: f.rel, line: lineaDe(f.text, m.index) })
          }
        }
        return { failed: hits.length > 0,
          detail: `${hits.length} superficie(s) con rejilla dibujada a base de degradados de un pixel`,
          samples: hits.slice(0, 4) }
      } },
  ])
}

// Une cada comprobacion con su arreglo y su estado de validacion.
function aplicarMeta(lista) {
  // `validado` va al final a proposito: la evidencia medida gana siempre sobre
  // cualquier cifra que haya quedado escrita a mano en META.
  return lista.map(c => ({ ...c, ...(META[c.id] || {}), validado: VALIDACION[c.id] || null }))
}
