# Changelog

## 1.4.0 — 2026-08-10

### Porte de impeccable (Apache-2.0) — reglas y doctrina

- **22 reglas portadas** de sus 59, con `research/DELTA-IMPECCABLE.md` escrito antes de
  tocar el catálogo: 20 ya estaban cubiertas, 13 se descartan (11 exigen navegador, 1 la
  refuta nuestra medición, 1 dispara sobre su propia excepción).
- **Medidas**: de las 21 que puntúan, **dos separan**. `C6` (filete fino con sombra ancha)
  entra en el núcleo validado y **gana J fuera de muestra**; `UX14` separa en banda y se
  desploma en holdout. Las otras 19 no discriminan. `research/RESULTADOS.md`.
- **`DS8`**: escala de tipo en el contrato, el único hueco que le quedaba. `slop-init`
  genera `--t-1..--t-6`.
- **`references/doctrina/`**: siete documentos de criterio, adaptados y **etiquetados como
  doctrina**. No puntúan y no generan reglas. Las reglas apuntan a ellos con el campo
  `doctrina`, que `slop-scan --plan` y `slop-fix` imprimen.
- **`NOTICE`** en la raíz, y en el paquete publicado.

### Correcciones que salieron por el camino

- **`parseTokensCss` se quedaba con la última definición de cada token de paleta.** En un
  sistema oscuro eso es el bloque de alternativa clara, así que el contrato describía la
  alternativa y `DS4` marcaba como ajena la paleta real. Fallaba en **todo esquema oscuro**;
  el test se libraba sólo porque su semilla daba claro.
- **El núcleo validado se regenera** (`research/exporta-nucleo.mjs`) en vez de escribirse a
  mano, y `bench/verifica-nucleo.mjs` ya no fija ids: comprueba consistencia. La lista había
  quedado obsoleta al ampliar el corpus.
- `UX6` baja de peso 3 a 2: pierde la separación con más muestra (J 0,34 → 0,09).

## 1.2.1 — 2026-08-07

### P13.1 — de “casi 4” a 4 real

- **visual:** motor `document` siempre (HTML a11y/estructura); Playwright solo suma screenshot.
- **gate --strict:** apply-safe → scan → visual → brief (proceso enforceado).
- **calidad Q1–Q14:** medida, labels, pareja tipográfica, rejilla 4, loading, main/skip.
- **stats:** sparkline, Δ vs anterior, alerta de regresión, `--stats --json`.
- **apply-safe:** también re-mapea padding/margin a la escala del contrato.
- `references/MADUREZ.md` + `hooks/pre-commit.sample`.

## 1.2.0 — 2026-08-07

### Madurez funcional (capacidades ≥ 4 en el núcleo)

- **Observabilidad local:** `.slop/history.jsonl` + `slop-scan --stats` (sin telemetría remota).
- **Enforcement de proceso:** `slop-gate` (min-score, contrato, calidad, brief, `last-gate.json`).
- **Eje calidad / a11y estática:** Q1–Q8 + `--dominio` + `--min-calidad` / `--fail-on-calidad`.
- **Contrato:** DS6 reduced-motion, DS7 focus-visible.
- **Init:** `tailwind.theme.mjs`, `index.html` con `lang`.
- **Remediación:** `slop-fix --apply-safe` (parches triviales).
- **Render opt-in:** `slop-visual` (Playwright si está; si no, skip honesto).

### Previo

- P1–P12: detección, validación, plan, init, holdout, L3, contrato, slop-fix.
