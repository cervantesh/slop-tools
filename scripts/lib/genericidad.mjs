// Genericidad: "¿cuanto se parece esto al promedio de lo generado?"
//
// G = distancia al centroide humano − distancia al centroide generado, sobre el
// vector de once rasgos z-normalizado. Alto = mas cerca de lo generado.
//
// NO PUNTUA, Y ESO ES DELIBERADO. Medida sobre el corpus da AUC 0,665 en la
// banda controlada, con IC95 [0,501 · 0,830]: el limite inferior roza el azar.
// Separa, pero por un margen que un solo proyecto podria borrar. Darle peso en
// la puntuacion seria concederle una autoridad que no ha ganado.
//
// Para que sirve entonces:
//   · como descriptivo en el informe, con su intervalo a la vista
//   · para comparar salidas ENTRE SI, que no exige separacion absoluta
//     (es lo que necesitara slop-init para demostrar que diverge)

import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rasgos, vector } from './rasgos.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RUTA_MODELO = join(AQUI, '..', '..', 'data', 'genericidad-modelo.json')

let modelo = null
export function cargarModelo(ruta = RUTA_MODELO) {
  if (modelo) return modelo
  if (!existsSync(ruta)) return null
  try { modelo = JSON.parse(readFileSync(ruta, 'utf8')) } catch { modelo = null }
  return modelo
}

const dist = (a, b) => Math.sqrt(a.reduce((s, x, i) => s + (x - b[i]) ** 2, 0))

export function genericidad(files, ruta) {
  const M = cargarModelo(ruta)
  if (!M) return null
  const f = rasgos(files)
  if (!f) return null

  const v = vector(f)
  const z = v.map((x, i) => (x - M.mu[i]) / M.sd[i])
  const G = dist(z, M.centroideNeg) - dist(z, M.centroidePos)

  // Percentil dentro de la distribucion del corpus en banda.
  const d = M.distribucionBanda
  const menores = d.filter(x => x < G).length
  const percentil = d.length ? Math.round(100 * menores / d.length) : null

  // Fuera de la banda de tamano el numero no es comparable: los rasgos que mas
  // pesan son conteos de valores distintos, y crecen con el numero de archivos.
  const enBanda = f.archivos >= 20 && f.archivos < 200

  return {
    G, percentil, enBanda, archivos: f.archivos, rasgos: f,
    auc: M._meta.auc_banda, ic95: M._meta.ic95_banda,
    lectura: !enBanda
      ? `fuera de la banda de tamano (${f.archivos} archivos): el numero no es comparable`
      : percentil >= 75 ? 'se parece al promedio de lo generado'
      : percentil <= 25 ? 'se aleja del promedio de lo generado'
      : 'en la zona intermedia, sin senal clara',
  }
}
