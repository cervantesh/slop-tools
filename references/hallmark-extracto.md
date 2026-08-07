# hallmark — extracto completo

**No hace falta volver a abrirlo.** Este archivo contiene todo lo aprovechable de
[`Nutlope/hallmark`](https://github.com/nutlope/hallmark): sus 58 gates clasificados uno a
uno, los umbrales numéricos, la autocrítica de seis ejes, los cuatro géneros con sus
exenciones y el catálogo completo de arquetipos.

hallmark **no es un escáner**: es Markdown que instruye al agente que diseña. Actúa *antes*,
al generar; este repositorio actúa *después*, al auditar. Por eso no se absorbe como
herramienta — se le extrae el conocimiento y se cierra.

---

## 1 · Umbrales numéricos

La parte más portable, y la que conviene tener a mano aunque no esté automatizada.

| Concepto | Umbral | Gate |
| --- | --- | --- |
| Croma mínimo de neutros (OKLCH) | **≥ 0,005** — el gris puro se lee plano | 22 |
| Superficie del acento en el viewport | **≤ ~5%** por área | 23 |
| Escala de espaciado | múltiplos de **4px**, con nombre | 24 |
| Medida de prosa | **45–75ch** | 25 |
| Familias tipográficas | **máximo 3** (display + texto + un outlier) | 37 |
| Outlier tipográfico | **máximo 2 usos** en la página | 38 |
| Contraste de texto de lectura | WCAG **4,5:1** / APCA **Lc ≥ 60** | 40 |
| Contraste de texto grande, iconos y foco | WCAG **3:1** / APCA **Lc ≥ 45** | 40 |
| Pre-check barato de contraste | `\|L_texto − L_fondo\| < 50%` en OKLCH ⇒ probable fallo | 40 |
| Texto de botón frente a su relleno | falla si difieren **< 5% L y < 0,05 C** | 41 |
| Interlineado de display en mayúsculas | **≥ 1,0**; recomendado 1,02–1,08 | 55 |
| Altura mínima de campo y botón | **44px**, y ambos iguales en el mismo formulario | 39 |
| Retardo de tooltip | hover **800–1000 ms**, foco **0 ms** | 17 |
| Padding inferior del hero | **≥ 1,3×** el superior | 44 |
| Viewport de comprobación del hero | **1280×800**, no sólo 1440×900 | 44 |

---

## 2 · Los 58 gates, clasificados

Cuatro estados: **cubierto** ya por una regla nuestra · **añadido** en esta extracción ·
**humano** porque exige render o juicio · **descartado** con motivo.

### Visual (1–7)

| # | Qué comprueba | Estado |
| --- | --- | --- |
| 1 | Familia display por defecto (Inter, Roboto, Poppins…) | cubierto · `B1` |
| 2 | Gradiente morado-azul, incluido titular con `background-clip: text` | cubierto · `A1` + `UX10` |
| 3 | Rejilla de tres tarjetas iguales con icono sobre titular | cubierto · `UX1` |
| 4 | Tarjeta anidada dentro de otra tarjeta | humano · `C8` de la rúbrica |
| 5 | Franja lateral gruesa de color en tarjeta | cubierto · `C2` |
| 6 | Hero centrado en todo, `min-height: 100vh` | humano — exige render |
| 7 | `#000` o `#fff` puros como color base | humano — exento en modern-minimal |

### Estructural (8–9)

| # | Qué comprueba | Estado |
| --- | --- | --- |
| 8 | Reutiliza plantilla genérica, o repite la macroestructura del build anterior | cubierto · `--log` |
| 9 | Secciones separadas sólo por espacio igual, sin filete ni cambio de color | humano |

### Microinteracciones (10–19)

| # | Qué comprueba | Estado |
| --- | --- | --- |
| 10 | `transition: all` | cubierto · `AS1` |
| 11 | `hover:scale-105` uniforme en elementos sin relación | **añadido · `HM4`** |
| 12 | Easing con sobreimpulso en cambios de estado de interfaz | **añadido · `HM3`** |
| 13 | Más de un efecto de hover a la vez | humano |
| 14 | Animar `width`, `height`, `top`, `left`, `margin`, `padding` | **añadido · `HM2`** |
| 15 | El anillo de foco aparece con transición en vez de al instante | humano |
| 16 | Toast de éxito para algo que el usuario ya ve | humano |
| 17 | Retardo de tooltip igual en hover y en foco | humano |
| 18 | Contenido que rota solo sin pausa al hover y al foco (WCAG 2.2.2) | humano |
| 19 | Nombre de relleno o cliché de startup (Acme, Nexus, Seamless) | cubierto · `E6` + `E5` |

### Variedad (20–21)

| # | Qué comprueba | Estado |
| --- | --- | --- |
| 20 | Falta el sello de macroestructura en el CSS | descartado — es de generación, no de auditoría |
| 21 | Cayó por defecto en la macroestructura «Specimen» | descartado — ídem |

### Implementación (22–27)

| # | Qué comprueba | Estado |
| --- | --- | --- |
| 22 | Neutro con croma cero | cubierto · `K1` |
| 23 | El acento cubre más del ~5% del viewport | humano — exige área renderizada |
| 24 | Espaciado fuera de la escala nombrada | parcial · `UX11`; ver `remediation.md` para rhythmguard |
| 25 | Medida de prosa fuera de 45–75ch | **añadido · `HM10`** |
| 26 | Falta `:focus-visible`, `:active` o `:disabled` | humano — parcial en la rúbrica |
| 27 | Animación sin alternativa `prefers-reduced-motion` | **añadido · `HM8`** |

### Enriquecimiento del hero (28–31)

| # | Qué comprueba | Estado |
| --- | --- | --- |
| 28 | Vídeo con autoplay sin `poster`, o `loading="lazy"` en el LCP | humano |
| 29 | Fondo abstracto con más de un acento o mesh animado | parcial · `A4` |
| 30 | Mezcla de librerías de iconos, o emoji como icono | cubierto · `D5` |
| 31 | Lottie por defecto donde bastaba un SVG | descartado — poca señal |

### Diversificación (32–33)

| # | Qué comprueba | Estado |
| --- | --- | --- |
| 32 | Mismo arquetipo que el build anterior sin cambiar ninguna perilla | parcial · `--log` |
| 33 | SVG decorativo sin `aria-label` ni `aria-hidden` | parcial · `T1` cubre botones |

### Seguridad de maquetación (34–36)

| # | Qué comprueba | Estado |
| --- | --- | --- |
| 34 | Scroll horizontal entre 320 y 1920px | **descartado — ver §6** |
| 35 | Efectos decorativos sobre texto mal colocados | humano — el propio gate dice que la comprobación es visual |
| 36 | Barras interactivas sin `align-items: center` | humano |

### Disciplina tipográfica (37–38a)

| # | Qué comprueba | Estado |
| --- | --- | --- |
| 37 | Más de tres familias tipográficas | **añadido · `HM7`** |
| 38 | El outlier usado en más de dos sitios | humano |
| 38a | **Titulares en itálica** — que la fuente llama uno de los tells principales | **añadido · `HM1`** |

### Campos de formulario (39)

| # | Qué comprueba | Estado |
| --- | --- | --- |
| 39 | `border-width` que cambia entre estados; foco hecho con `border` en vez de `outline`; altura de campo distinta de la del botón; hueco de texto de ayuda que colapsa; deshabilitado señalado sólo con `opacity` | humano — está en `producto.md` |

### Contraste (40–41)

| # | Qué comprueba | Estado |
| --- | --- | --- |
| 40 | Umbrales de contraste contra el fondo computado | cubierto · `K2` |
| 41 | Texto de botón ≈ relleno; falta `--color-accent-ink`; sección oscura con tinta oscura | cubierto · `K3` |

### Cromo de nav, footer y hero (42–45)

| # | Qué comprueba | Estado |
| --- | --- | --- |
| 42 | Nav por defecto: wordmark + 4-5 enlaces + botón + filete de 1px | cubierto · `S1` |
| 43 | Footer por defecto: cuatro columnas Product/Company/Resources/Legal | cubierto · `S2` |
| 44 | El hero no cabe en el pliegue a 1280×800 | humano |
| 45 | Decoración sin anclaje semántico en el contenido | humano |

### Honestidad, cromo y tokens (46–49)

| # | Qué comprueba | Estado |
| --- | --- | --- |
| 46 | **Métrica inventada** que nadie aportó | **añadido · `HM5`** |
| 47 | Cromo redibujado a mano: navegador, móvil, terminal, IDE falsos | cubierto · `S3` |
| 48 | Color o fuente fuera de los tokens declarados | humano |
| 49 | Texto de botón o enlace que parte en dos líneas | humano — exige render |

### Responsividad (50–57)

| # | Qué comprueba | Estado |
| --- | --- | --- |
| 50 | Pista `1fr` con imagen sin `minmax(0, 1fr)` | humano — pero es el arreglo de un carácter más rentable que existe |
| 51 | Titulares de display sin `overflow-wrap: anywhere` | humano |
| 52 | Cabecera de sección a dos columnas sin colapso móvil | parcial · `S4` |
| 53 | Pestañas por radio en `position: absolute` que provocan salto de scroll | humano |
| 54 | **Eyebrow al lado del titular** en la misma fila | cubierto · `S4` |
| 55 | Display en mayúsculas con interlineado < 1,0 | **añadido · `HM12`** |
| 56 | Dos elementos `sticky` a `top: 0` que se solapan | humano |
| 57 | ADN estudiado descartado por un tema de catálogo | descartado — es de generación |

---

## 3 · La autocrítica de seis ejes

Se puntúa **antes** de barrer los gates, de 1 a 5. Menos de 3 en cualquier eje obliga a una
pasada de revisión antes de seguir. Dos pasadas es normal; tres significa que el brief está
mal, no el diseño.

| Eje | Qué se puntúa |
| --- | --- |
| **Filosofía** | ¿Hay un *porqué*, una posición que la página toma? ¿O sólo hay maquetación? |
| **Jerarquía** | ¿Se distingue en dos segundos qué es primario, secundario y terciario? |
| **Ejecución** | ¿Los detalles —grosor de filete, huella del acento, foco, contraste— están en especificación? |
| **Especificidad** | ¿Parece *este* encargo, o una página que podría ser de cualquiera? |
| **Contención** | ¿Se ha quitado todo lo que no se gana su sitio? |
| **Variedad** | ¿Comparte huella estructural con una salida anterior? Se puntúa por **distancia estructural**, no visual: cambiar el color no es variedad |

Es la mejor pieza de hallmark que **no** es mecanizable, y encaja como rúbrica de revisión
humana. El eje de Especificidad es, además, la versión de generación de nuestra prueba del
cambio de nombre.

---

## 4 · Los cuatro géneros y sus exenciones

Los géneros existen como **supresor explícito de falsos positivos**: una regla legítima para
un producto es ruido para otro. Es el mecanismo que este repositorio adoptó como
`--genre`.

| Género | Qué exime |
| --- | --- |
| **editorial** | Hero centrado y estrecho, siempre que el eyebrow o la CTA salgan del eje. Es el único que puede caer en «Specimen», y sólo si el brief lo pide |
| **atmospheric** | Gradientes radiales **de fondo** — nunca en texto ni en botones. Hero centrado cuando el lienzo es el diseño. Florituras de acento hasta ~20–30% del lienzo, fijas y sin animar |
| **modern-minimal** | `#fff` puro como papel y neutros de croma cero — la escuela Stripe / ElevenLabs |
| **playful** | Hero centrado cuando el lienzo es el diseño |

Ninguno exime del gradiente en texto. Ninguno exime del contraste.

---

## 5 · Catálogo de arquetipos

Sirve como **catálogo de formas canónicas**: lo que un generador produce por defecto y las
alternativas que existen. Útil al auditar para nombrar lo que se está viendo.

**Navegación (13).** `n1` wordmark + 2 enlaces · `n1b` SaaS de tres secciones *(el defecto de
la IA)* · `n2` chip flotante · `n3` raíl lateral · `n4` oculta tras ⌘K · `n5` píldora flotante ·
`n6` cabecera de periódico · `n7` losa brutalista · `n8` comando de terminal · `n9` mínima
alineada al borde · `n10` metamorfosis al hacer scroll · `n11` mega-menú · `n12` banner que se
retrae · `n13` píldora cmdk en línea

**Footers (8).** `ft1` con mástil · `ft2` filete en línea de una sola fila · `ft3` índice por
categorías · `ft4` denso tipográfico · `ft5` declaración · `ft6` cierre de carta · `ft7`
newsletter primero · `ft8` marquesina

**Heroes (9).** `h1` marquesina · `h2` díptico partido · `h3` guiado por cita · `h4` guiado por
cifra · `h5` carta · `h6` pliegue fotográfico · `h7` vídeo recortado por el borde del viewport ·
`h8` maqueta con marco de navegador · `h9` ilustración propia como pieza central

**Cabeceras de sección (5).** `s1` numerada en margen izquierdo · `s2` colgante · `s3` fijada
pegajosa · `s4` en línea sin salto · `s5` anclada abajo

**Bloques de contenido (6).** `f1` bento · `f2` pila con scroll pegajoso · `f3` ficha técnica
tabular · `f4` secuencia de pasos · `f5` captura anotada · `f6` rejilla de tarjetas de producto

**Componentes (8).** `c1` chip contorneado · `c2` formulario en línea como CTA · `c3` enlace
tipográfico · `c4` barra inferior pegajosa · `t1` cita destacada con marginalia · `t2` muro de
logos con filete · `t3` cita única enorme · `t4` tira de cifras numeradas

---

## 6 · Lo que se descartó, y por qué

**Gate 34 — recorte horizontal.** Se implementó como `HM9` y se retiró el mismo día.
Afirmaba un defecto a partir de la **ausencia de una profilaxis**: el gate original exige que
no haya scroll horizontal entre 320 y 1920px —cosa que sólo se sabe renderizando— y prescribe
`overflow-x: clip` como arreglo. Marcar la falta del arreglo hace disparar la regla en casi
todo proyecto bien construido que sencillamente no desborda. Es el modo de fallo de `E4`,
que la medición documentó: disparar en el 100% de una clase y el 96% de la otra no es
detectar, es ruido con peso.

**Gates 20, 21, 57 — sellos y temas.** Son instrucciones para el agente que genera. No hay
nada que auditar en un proyecto ajeno.

**Gate 31 — Lottie.** Poca señal, y penaliza una decisión técnica legítima.

**Los umbrales que exigen render** —huella del acento, hero en el pliegue, texto partido en
dos líneas, scroll horizontal— quedan en la rúbrica humana. Un escáner estático no puede
medirlos y fingir que sí sería peor que no tenerlos.

---

## 7 · Advertencia sobre las cifras de hallmark

**El repositorio se contradice a sí mismo** en varios sitios: 57 gates en el README y 58 en el
archivo; 3% de huella de acento en `color.md` y ~5% en el gate 23; 20 temas en un sitio y 21
en otro.

Las cifras de la tabla de §1 son las del archivo de gates, que es el documento operativo.
Cualquiera que las use debería saber que la fuente no es internamente consistente.

**Y ninguno de estos umbrales está validado.** hallmark no publica tasa de acierto, ni corpus
etiquetado, ni estudio. Las diez reglas que se añadieron desde aquí llevan peso 1 y
`validado: no_medido` por ese motivo: son comprobaciones de **defecto** —accesibilidad,
rendimiento, legibilidad, honestidad— cuyo valor no depende de que discriminen procedencia.

## 8 · Reglas añadidas desde esta extracción

| ID | Qué detecta | Gate |
| --- | --- | --- |
| `HM1` | Titulares en itálica | 38a |
| `HM2` | Transición sobre propiedades de layout | 14 |
| `HM3` | Easing con rebote en cambios de estado | 12 |
| `HM4` | `hover:scale` uniforme en todo | 11 |
| `HM5` | Métrica inventada | 46 |
| `HM7` | Más de tres familias tipográficas | 37 |
| `HM8` | Animación sin `prefers-reduced-motion` | 27 |
| `HM10` | Medida de prosa fuera de 45–75ch | 25 |
| `HM12` | Mayúsculas de display con interlineado < 1,0 | 55 |

`HM6`, `HM9` y `HM11` se implementaron y se descartaron. Los identificadores no se reutilizan
para que el historial siga siendo legible.

> **`HM8` encontró un defecto en nuestro propio banco de pruebas.** El proyecto «limpio» de
> referencia declaraba `@keyframes` sin ningún bloque `prefers-reduced-motion`. Llevaba ahí
> desde que se creó el banco, y ninguna de las 48 mutaciones lo veía.
