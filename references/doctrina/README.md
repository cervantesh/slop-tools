# Doctrina — criterio de oficio

> **Esto es doctrina, no evidencia.** Criterio de diseño adaptado de
> [impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0, copyright 2025 Paul
> Bakaus). **No está medido sobre ningún corpus y no puntúa.** Ninguna regla del escáner
> sale de aquí. Antes de aplicarlo a ciegas, lee `caveats.md`.

## Por qué existe esta carpeta y por qué está separada

El resto del repositorio afirma cosas y las mide. `data/rules.json` no dice que el gradiente
morado delate generación: dice que dispara en el 35% de lo generado y el 22% de lo humano,
con J = 0,13 e intervalos solapados, y de ahí sale su peso.

**Esto no es eso.** Esto es criterio: taxonomías, umbrales de oficio y pruebas de decisión
que alguien con experiencia considera acertadas. Es útil —cuando una regla dispara, el
`fix` de una línea muchas veces no basta— pero **no tiene el mismo estatuto**.

Mezclarlo sería destruir el argumento entero del repositorio. Si el gusto no medido entrase
con el mismo peso que `UX2` o `L2` —que sobrevivieron al conjunto reservado— dejaríamos de
poder distinguir lo que sabemos de lo que nos parece.

Por eso:

- **La doctrina no genera reglas.** No entra en la puntuación ni en el score.
- Si de leerla sale una **hipótesis comprobable**, se convierte en regla aparte, entra
  **sin validar** y se mide como todas las demás.
- Donde la doctrina contradiga la medición, **gana la medición**, y el conflicto se deja
  escrito. Ya pasó: impeccable sostiene que lo generado usa espaciado uniforme y nuestra
  medición dice lo contrario con separación fuerte (`research/RESULTADOS.md` §3.5). No se
  portó ese criterio.

## Qué hay aquí

| Documento | De qué trata | Origen |
| --- | --- | --- |
| `suelo-de-oficio.md` | El mínimo verificable: qué se comprueba y qué se rechaza | `craft-floor.md` |
| `direccion.md` | Comprometerse con una dirección y no volver a la media | `new-work.md` |
| `composicion.md` | Orden de lectura, agrupación, ritmo, densidad, extremos | `layout.md`, `bolder.md` |
| `color.md` | Roles de color, contraste, superficies, modo oscuro | `colorize.md`, `quieter.md` |
| `tipografia.md` | Medida, interlineado, roles, familias de reflejo | `typeset.md`, `new-work.md` |
| `movimiento.md` | Duraciones, curvas, qué justifica una animación | `animate.md`, `overdrive.md` |
| `microcopy.md` | Estados, errores, formularios, voz y traducción | `clarify.md` |

**Siete documentos, no cuarenta.** Impeccable reparte su criterio en ~40 archivos de
referencia, pero al triarlos por sustancia la mayoría resultó ser andamiaje de su propia
herramienta (rutas, scripts, códigos de salida, subagentes), guías de plataforma iOS y
Android, o alias obsoletos —`craft.md` son 78 palabras que sólo redirigen—. El triaje
completo, documento a documento, está en `research/DELTA-IMPECCABLE.md` §5.

## Qué NO se portó, y por qué

- **El procedimiento.** Sus documentos invocan sus scripts, sus rutas `.impeccable/` y sus
  subagentes. Nada de eso transfiere.
- **Los catálogos de API de navegador** (`overdrive.md`). Es referencia factual que caduca,
  no criterio.
- **Los protocolos de entrevista** (`shape.md`). Criterio de herramienta de briefing, no de
  diseño.
- **`harden.md` y `optimize.md`.** Correctos y portables, pero son doctrina de industria
  —WCAG, Core Web Vitals, web.dev— sin juicio propio. Citar la fuente primaria es mejor que
  copiarla parafraseada.
- **`critique.md`.** Su mitad de referencia es buena —heurísticas de Nielsen puntuadas de 0 a
  4, severidades P0–P3, carga cognitiva, personas— pero es material de manual, y aquí ya lo
  cubren `rubric.md` y `adversarial.md`. Se queda fuera una idea suya que sí merece
  recogerse, y está en `README` de este directorio por eso: **la evaluación de diseño debe
  cerrarse ANTES de que entren los hallazgos del detector**, porque una lista de fallos
  deterministas ancla el juicio aunque sea correcta.
- **`distill.md`.** Minimalismo genérico; sus únicos aportes con filo (la lista de «nunca» y
  cuatro topes numéricos) están recogidos en `composicion.md` y `color.md`.

## Una cosa que aprendimos leyéndolos

**Cada prohibición fuerte de este material viene con su contrapeso.** El veto al kicker está
marcado como el único que ningún encargo puede recuperar, precisamente porque los demás sí.
La salida estándar existe para que la presión anti-defecto no acorrale a quien decide.
«Silencioso sin intención colapsa en genérico» protege contra aplicar demasiado bien el
consejo de bajar el volumen.

Doctrina sin contrapeso sobrecorrige, y sobrecorregir produce su propia media. Está copiado
ese hábito a propósito: aquí cada documento cierra con lo que se rompe si se aplica al pie de
la letra.
