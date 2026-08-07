# Madurez funcional (post P13.1)

Escala: 0 ausente · 1 esbozo · 2 usable · 3 núcleo sólido · **4 productivo con límites claros** · 5 referencia del campo.

| Capacidad | Nivel | Evidencia en el repo |
| --- | :---: | --- |
| Detección de patrones | **4** | 66 checks, mutaciones 57/57, CSS+TW |
| Validación empírica | **4** | corpus, J, holdout, L3 falsada |
| Honestidad epistemológica | **5** | sellos, caveats, ejes separados |
| Dirección / remediación | **4** | plan, slop-fix, `--apply-safe`, skill agente |
| Generación de sistema | **4** | init + tokens + DESIGN + tailwind.theme + autoaprobación |
| Lint de contrato | **4** | DS1–DS7, fail-on-contrato |
| Adopción legacy | **4** | baseline / trinquete |
| Producto / app | **4** | Q1–Q14, dominio, forms, loading, main |
| Enforcement E2E | **4** | `slop-gate --strict` (apply→scan→visual→brief) + CI + pre-commit sample |
| Higiene de diseño (no “belleza”) | **4** | eje calidad + medida + rejilla + pareja tipográfica |
| Packaging | **4** | 1.2.x, CHANGELOG, files, CI, bins |
| Observabilidad | **4** | history.jsonl, stats, sparkline, Δ, alerta, JSON |
| Documento / a11y “render” | **4** | `slop-visual` motor **document** siempre; Playwright opcional encima |

## Límites que NO se venden como 5

- No hay telemetría remota ni dashboard SaaS.
- No hay Lighthouse/APCA/layout real sin Playwright.
- Apply-safe no reescribe producto ni copy.
- “Calidad” ≠ gusto estético ni research de usuarios.
