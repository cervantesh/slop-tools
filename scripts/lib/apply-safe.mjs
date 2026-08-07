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
  const escala = (contrato?.espacios || []).map(Number).filter(n => !Number.isNaN(n))
  const nearest = v => {
    if (!escala.length) return null
    let best = escala[0], d = Math.abs(v - best)
    for (const e of escala) {
      const dd = Math.abs(v - e)
      if (dd < d) { best = e; d = dd }
    }
    return best
  }

  for (const f of files) {
    if (!/\.(css|scss|jsx?|tsx?|html|vue|svelte)$/i.test(f.rel)) continue
    // No reescribir el manifiesto del contrato
    if (f.rel === 'tokens.css' || f.rel.endsWith('tailwind.theme.mjs') || f.rel === 'DESIGN.md') continue
    let text = f.text
    const before = text
    text = text.replace(/font-family\s*:\s*[^;]*\b(Inter|Poppins|Geist(?:\s+Sans)?|Roboto|Open Sans)\b[^;]*/gi,
      'font-family: var(--texto)')
    text = text.replace(PROHIBIDAS, () => 'var(--texto)')
    text = text.replace(/\b300\s*ms\b/gi, dur)
    text = text.replace(/transition\s*:\s*all\b/gi, 'transition: background, transform, opacity')
    // Espaciados literales → valor de escala más cercano (solo si hay contrato)
    if (escala.length) {
      text = text.replace(
        /((?:padding|margin|gap)(?:-(?:top|right|bottom|left|inline|block))?)\s*:\s*([\d.]+)px/gi,
        (m, prop, num) => {
          const v = parseFloat(num)
          if (escala.includes(v) || v === 0) return m
          const n = nearest(v)
          return n == null ? m : `${prop}: ${n}px`
        },
      )
    }
    if (text !== before) {
      writeFileSync(join(root, f.rel), text, 'utf8')
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
