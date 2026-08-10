# Delta con `impeccable` — qué se porta y qué no

Análisis previo al porte de [`pbakaus/impeccable`](https://github.com/pbakaus/impeccable)
(Apache-2.0). Sus 59 reglas deterministas viven en
`.agents/skills/impeccable/scripts/detector/registry/antipatterns.mjs` y
`detector/rules/checks.mjs`.

**Este documento se escribió antes de añadir una sola regla.** Es la condición que impuso el
encargo y también la que impone el repositorio: sin delta, un porte de 59 reglas es un
catálogo duplicado con dos ids distintos para la misma comprobación.

---

## 1 · El criterio que decide casi todo: el motor

Impeccable tiene **cuatro motores**: regex sobre fuente, HTML+CSS estático, **navegador vivo**
(Puppeteer: rectángulos, `getComputedStyle`, `elementFromPoint`, `scrollWidth`, errores de
página) y contraste visual sobre captura.

`slop-scan` tiene **uno**: lectura estática de la fuente. `slop-visual` sí abre Playwright,
pero de forma opcional y sin ejecutar el catálogo de reglas.

Esto no es un detalle de implementación: **decide 11 de las 59**. Una regla que necesita saber
el ancho renderizado de un párrafo no se puede «portar peor»; se puede portar mal. Ese es el
modo de fallo que ya nos costó `HM9`, retirada el mismo día por afirmar un defecto a partir de
la ausencia de una profilaxis (`checks.mjs`, nota de HM9).

Un porte degradado sin la geometría no mide lo mismo que la regla original, y la cifra que
publicaríamos junto a él sería sobre otra cosa.

---

## 2 · Tabla completa, las 59

Columna «nuestro»: la comprobación de este repositorio que ya cubre el terreno.
Decisión: **portar** · **ya cubierta** · **descartar**.

### 2.1 · Ya cubiertas (17)

| impeccable | nuestro | Por qué no se duplica |
| --- | --- | --- |
| `side-tab` | `C2` franja lateral | `C2` sólo casa `border-left: 3–4px solid`; impeccable cubre las cuatro caras, `::before` absolutos y `box-shadow` inset. Más estrecha, sí, pero **`C2` está medida**: ampliar el patrón invalida su fila sin remedir. La parte que `C2` no puede alcanzar se porta aparte como `C5` (ver 2.2). |
| `overused-font` | `B1` familia por defecto | `B1` casa Inter/Poppins/Geist/Space Grotesk/Roboto/Open Sans. Impeccable añade Fraunces, Lato, Montserrat, Plus Jakarta, Instrument. Mismo argumento: ampliar `B1` mueve su tasa medida. Anotado como deuda, no como regla nueva. |
| `gradient-text` | `UX10` texto con gradiente | `bg-clip-text` / `background-clip: text`. Idéntica. |
| `ai-color-palette` | `A1` gradiente morado-azul | Idéntica en intención y en hexes. `A1` mide J 0,13: el tell más citado rinde poco (RESULTADOS §3.4). |
| `dark-glow` | `A5` neón sobre oscuro | Sombra cromática con desenfoque sobre fondo oscuro. Idéntica. |
| `radial-halo` | `A4` resplandor tras el hero | `A4` casa `radial-gradient(circle\|ellipse`. Cubre el halo. |
| `radial-spotlight-glow` | `A4` | Misma forma, distinta banda de alfa. El patrón de `A4` ya dispara sobre ella. Separarlas exigiría parsear las paradas del degradado para nada: ambas acaban en el mismo arreglo. |
| `italic-serif-display` | `HM1` titulares en itálica | `HM1` casa `font-style: italic` en selectores de titular. La restricción extra de impeccable (serif y ≥48px) sólo estrecha. `HM1` da **cero disparos en 123 proyectos**. |
| `em-dash-overuse` | `E1` abuso del em dash | Umbral 12 absoluto frente a «≥8 y ≥1 por 500 caracteres». Misma regla, distinta normalización. |
| `all-caps-body` | `B4` mayúsculas por todas partes | `text-transform: uppercase`, umbral 6. |
| `low-contrast` | `K2` pares bajo 4,5:1 | WCAG 2 sobre pares resueltos con tokens. Idéntica. |
| `line-length` | `HM10` medida fuera de 45–75ch | Impeccable lo mide renderizado; `HM10` lo mide sobre `max-width: Nch` declarado. Es el proxy estático del mismo criterio, y es el que podemos sostener. |
| `layout-transition` | `HM2` transición sobre layout | Idéntica. |
| `repeated-container-text` | `E4` copy duplicado | `E4` dispara en el **100% de lo generado y el 96% de lo humano**: todo el mundo repite cadenas. Añadir la variante «dentro de una tarjeta» no arregla eso. |
| `image-hover-transform` | `AS2` + `HM4` | `hover:-translate-y-*` y `hover:scale-1[01][05]`. Cubierto por dos reglas ya medidas. |
| `skipped-heading` | `V7` (motor documento) | `documento.mjs` ya recorre el outline y cuenta saltos de nivel. Está en `slop-visual`, no en `slop-scan`, pero está. |
| `oversized-h1` | `UX11` titular arbitrario | `UX11` casa `text-[NNpx]` y `font-size: 90–199px`. Lo que impeccable añade —titular **largo** a tamaño display— exige el texto renderizado del titular y su altura relativa al viewport. Esa mitad cae en 2.3. |

### 2.2 · Se portan (22 reglas nuestras desde 26 ids suyos)

| impeccable | nuestra | tipo | Motivo |
| --- | --- | --- | --- |
| `border-accent-on-rounded` | `C5` | procedencia | La cara que `C2` no alcanza: borde de acento ≥2px **con** `border-radius`. El choque entre filete recto y esquina redonda es la firma, no el filete. |
| `gpt-thin-border-wide-shadow` | `C6` | procedencia | Filete de 1px **y** sombra ancha difusa a la vez. No es `C1` (filete gris a secas): es la combinación, que es lo que la hace firma. |
| `flat-type-hierarchy` | `B9` | procedencia | Ratio entre el mayor y el menor tamaño de tipo < 2 con ≥3 tamaños. El extractor `escalas()` ya produce `tamanos`: sustrato listo. |
| `extreme-negative-tracking` | `B5` | **defecto** | Interletraje ≤ −0,05em cuesta legibilidad. Que aparezca en todo hero generado no lo convierte en prueba de autoría. |
| `tiny-text` + `undersized-ui-text` | `B6` | **defecto** | Una sola regla: suelo de legibilidad. Dos ids para «<12px» y «<11px funcional» es una distinción que sólo se sostiene con el DOM delante. |
| `tight-leading` | `B7` | **defecto** | `line-height` < 1,3 fuera de titulares. Complementa `HM12`, que sólo cubre mayúsculas de display bajo 1,0. |
| `justified-text` | `B8` | **defecto** | `text-align: justify` sin `hyphens: auto`. La exención importa: justificar con partición está bien hecho. |
| `cream-palette` | `K5` | procedencia | `AS9` casa cuatro hexes concretos de papel crema. La prueba algorítmica (mín ≥209, r≥g≥b, 6≤r−b≤48) alcanza toda la familia. `AS9` da J ≈ 0: la versión estrecha no encontró nada, la ancha merece una oportunidad. |
| `gray-on-color` | `K6` | **defecto** | Gris sobre fondo cromático. La vía Tailwind (`text-gray-N` + `bg-rose-N` en la misma cadena) es estática y es la que domina. |
| `marketing-buzzword` | `E8` | procedencia | `E5` casa **palabras** sueltas (seamless, leverage, cutting-edge). Esto son **sintagmas** («supercharge your», «best-in-class», «mission-critical»), que es otra población. Se mide la diafonía en el bench. |
| `aphoristic-cadence` | `E9` | procedencia | `P1` cubre «no sólo X sino Y». La forma fragmentaria —«Not a feature. A platform.», «X. Just Y.»— no la cubre nadie. Umbral 3: una vez es voz, tres veces es cadencia. |
| `theater-slop-phrase` | `E10` | procedencia | `\b(\w+)\s+theater\b`. Tic muy estrecho y sólo en inglés; se porta tal cual porque cuesta una línea y no puede hacer daño. |
| `repeating-stripes-gradient` | `A6` | procedencia | Presencia de `repeating-*-gradient`. |
| `codex-grid-background` | `UX15` | procedencia | Rejilla decorativa hecha con paradas de un píxel y celda en px. Cuenta dentro de un mismo bloque de declaración: programática. |
| `marquee` | `UX13` | procedencia | `<marquee>`, `animate-marquee` o animación infinita con `translateX` en porcentaje. |
| `pulsing-dot` | `UX14` | procedencia | `animate-ping`/`animate-pulse` **junto a** `rounded-full` en la misma cadena de clases. Sin la co-ocurrencia dispararía sobre todo esqueleto de carga, que es uso legítimo. |
| `shape-assembled-illustration` | `D7` | procedencia | SVG en línea con ≥8 primitivas, ≤2 textos, ≥200px y ≥3 rellenos distintos. Enteramente estático y sorprendentemente específico. |
| `broken-image` | `D6` | **defecto** | `<img>` con `src` vacío, `#` o ausente. |
| `kicker-above-heading` + `hero-eyebrow-chip` | `S6` | procedencia | Una sola regla. `S4` exige además rejilla multicolumna, así que el kicker suelto —el caso común— hoy se escapa. |
| `numbered-section-labels` | `S7` | procedencia | Índices numéricos junto a titulares de sección, ≥2 con índices distintos. |
| `icon-tile-stack` | `S8` | procedencia | Baldosa cuadrada redondeada con icono encima del titular. La plantilla universal de tarjeta de característica. |
| `design-system-font-size` | `DS8` | contrato | **Hueco real del contrato.** Tenemos `DS1` espaciado, `DS2` radio, `DS3` tipografía, `DS4` color, `DS5` duración. No hay escala de tamaños de tipo, y `escalas()` ya la extrae. |

### 2.3 · Se descartan (16)

**Exigen navegador (11).** No hay porte honesto sin geometría renderizada:

| impeccable | Qué necesita |
| --- | --- |
| `script-error` | `page.on('pageerror')` |
| `content-hidden-at-rest` | Opacidad efectiva tras correr los reveals |
| `text-occlusion` | `document.elementFromPoint` sobre una rejilla de muestreo |
| `edge-flush-cards` | `scrollWidth`, `scrollLeft` y rectángulos dentro del scroller |
| `first-viewport-column-overflow` | Alturas de columna contra la altura del viewport |
| `heading-rhythm` | Hueco renderizado encima y debajo de cada titular |
| `text-overflow` | `scrollWidth − clientWidth` |
| `body-text-viewport-edge` | `rect.left` contra el borde del viewport |
| `cramped-padding` | Padding contra el tamaño de fuente **por elemento**, y qué hijo aísla qué cara |
| `blinking-cursor` | Posición en página y tamaño del cursor para separar el caret decorativo del real |
| `nested-cards` | Anidamiento real del DOM. Un árbol JSX no lo expone a un regex de líneas |

Quedan anotadas en `PLAN.md` P16 como el argumento concreto para un motor de render: son
**11 reglas que no podemos escribir**, no once que no queremos.

**Ya cubiertas por el contrato (3).** `design-system-font` ≈ `DS3`, `design-system-color` ≈
`DS4`, `design-system-radius` ≈ `DS2`. Mismo mecanismo (declarar el sistema, marcar la deriva),
misma tolerancia. Sólo faltaba la escala de tipo, que sí se porta.

**Refutada por nuestra propia medición (1).**

`monotonous-spacing` codifica la hipótesis de que lo generado usa el mismo espaciado en todas
partes. **La medimos y apunta al revés:**

| Rasgo | AUC pos vs neg | Dirección |
| --- | --- | --- |
| Espaciados distintos | 0,767 | Lo generado tiene **más** variedad |
| Radios distintos | 0,753 | Lo generado tiene **más** variedad |
| Dominancia del radio principal | **0,277** | Lo generado es **menos** uniforme |

`research/RESULTADOS.md` §3.5. Un AUC de 0,277 es separación fuerte en sentido inverso.

Ya tenemos la regla: `C3` «radio y padding uniformes», **y ya está reclasificada a `defecto`**
por esta misma medición, con la nota en `checks.mjs`. La inversa —`C4`, escala dispersa— es la
que discrimina, y es la única regla del catálogo derivada de los datos en vez de la
bibliografía.

Así que `monotonous-spacing` no se porta: **portarla sería reintroducir como procedencia lo que
ya retiramos de la puntuación por refutado.** Queda dicho aquí, que es lo que pedía el encargo.

**Descartada por falso positivo garantizado (1).** `wide-tracking` (letter-spacing > 0,05em en
texto de lectura). Sin saber si el elemento es una etiqueta corta en mayúsculas —donde el
tracking ancho es el uso *correcto*— la regla dispara sobre su propia excepción. Impeccable lo
resuelve leyendo `text-transform` del elemento; nosotros sólo veríamos la clase suelta.

---

## 3 · Recuento

| | |
| --- | --- |
| Ids de impeccable examinados | 59 |
| Ya cubiertas por reglas existentes | 17 + 3 del contrato = **20** |
| Portadas | 26 ids → **22 reglas** (4 fusiones) |
| Descartadas | **13** (11 por motor, 1 refutada, 1 por falso positivo) |

Las 22 entran **sin validar**. Ninguna trae cifra en `validado` hasta que
`research/measure.mjs` la produzca sobre el corpus. La autoridad se gana midiendo, no citando
la fuente — y la fuente aquí tiene 57.800 estrellas, que es exactamente el tipo de argumento
que este repositorio no acepta.

## 4 · Clasificación `procedencia` / `defecto`

De las 22: **15 procedencia**, **6 defecto** (`B5`, `B6`, `B7`, `B8`, `K6`, `D6`) y 1 al
contrato (`DS8`).

El criterio no es «cuánto se parece a IA» sino **qué afirma la regla**. `B6` (texto de 9px) es
un fallo de legibilidad tanto si lo escribió un modelo como si lo escribió una persona: no
puede puntuar procedencia. Meterla en la puntuación inflaría el score con algo que no dice nada
sobre autoría — que es el error que este repositorio ya cometió con `E4`, `C1` y `HM8`, y que
sólo se vio al medir.

Impeccable clasifica varias de éstas como `slop`. Es una discrepancia deliberada y está aquí
para que se pueda discutir.
