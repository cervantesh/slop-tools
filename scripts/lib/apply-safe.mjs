// Aplicación segura de remediaciones triviales y reversibles.
// Solo toca patrones inequívocos; el resto queda para el agente humano.
//
// Qué aplica:
//   - Familias prohibidas → var(--texto) / var(--display) si hay contrato
//   - 300ms → var(--duracion) o la ms del contrato
//   - transition: all → transition: background, transform (acotado)
//
// Qué NO aplica: copy, layout, hex ambiguos, lógica de negocio.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const PROHIBIDAS = /(['"]?)(Inter|Poppins|Geist(?:\s+Sans)?|Roboto|Open Sans)\1/gi

/**
 * @returns {{ cambiados: { file, n }[], total }}
 */
export function applySafe(root, files, contrato) {
  const cambiados = []
  let total = 0
  const dur = contrato?.duracion != null ? `${contrato.duracion}ms` : 'var(--duracion)'

  for (const f of files) {
    if (!/\.(css|scss|jsx?|tsx?|html|vue|svelte)$/i.test(f.rel)) continue
    // No reescribir el manifiesto del contrato
    if (f.rel === 'tokens.css' || f.rel.endsWith('tailwind.theme.mjs')) continue
    let text = f.text
    const before = text
    text = text.replace(PROHIBIDAS, (m, q, name) => {
      const esDisplay = /serif|display|Newsreader|Literata|Playfair/i.test(text.slice(Math.max(0, text.indexOf(m) - 40), text.indexOf(m)))
      return `${q || ''}var(--${esDisplay ? 'display' : 'texto'})${q || ''}`
    })
    // Simplificar: siempre texto para families prohibidas en font-family
    text = text.replace(/font-family\s*:\s*[^;]*\b(Inter|Poppins|Geist|Roboto|Open Sans)\b[^;]*/gi,
      'font-family: var(--texto)')
    text = text.replace(/\b300\s*ms\b/gi, dur)
    text = text.replace(/transition\s*:\s*all\b/gi, 'transition: background, transform, opacity')
    if (text !== before) {
      const n = [...before].length // rough
      writeFileSync(join(root, f.rel), text, 'utf8')
      // count approximate replacements
      const diffs = countDiffs(before, text)
      cambiados.push({ file: f.rel, n: diffs })
      total += diffs
    }
  }
  return { cambiados, total }
}

function countDiffs(a, b) {
  // Contar líneas distintas
  const la = a.split('\n'), lb = b.split('\n')
  let n = 0
  const max = Math.max(la.length, lb.length)
  for (let i = 0; i < max; i++) if (la[i] !== lb[i]) n++
  return n || 1
}
