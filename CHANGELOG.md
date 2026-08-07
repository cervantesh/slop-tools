# Changelog

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
