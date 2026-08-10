# Salvedades — cuándo la rúbrica se equivoca

Léelo antes de dar un veredicto. Aplicar la rúbrica a ciegas produce falsos positivos, y un
falso positivo delante del equipo de diseño te cuesta la credibilidad para el resto de la
auditoría.

## El sesgo de origen: son rúbricas de landing page

Las cuatro fuentes están escritas sobre **webs de marketing**, no sobre producto. Se nota en
lo que dan por hecho: que hay un hero, un grid de tres features, una sección de precios y un
footer. Una app operativa no tiene nada de eso.

Comprobaciones que **no transfieren** a producto:

| Comprobación | Por qué falla en una app |
| --- | --- |
| A2 · Dark mode por defecto | Hay categorías enteras —finanzas, música, herramientas de desarrollo, servicios nocturnos— donde el oscuro es la elección correcta y está justificada en el contrato de marca. Que una herramienta de IA también lo prefiera no lo invalida. |
| B2 · Sin pareja tipográfica | Una sola familia bien usada es disciplina en producto. La pareja display + texto es un recurso editorial. |
| C3, C4, C5 · Esqueleto de landing | Una app no tiene hero ni FAQ. La comprobación no aplica, no es que la pase. |
| G2 · Precios ocultos | Criterio de sitio comercial. |
| G3 · Testimonios sin enlace | Ídem. |

Usa `--profile producto` para excluirlas. El escáner las filtra por ti, pero el juicio sobre
las comprobaciones humanas es tuyo.

## Comprobaciones que envejecen mal

Varias señalan **modas**, no generación automática:

- **Glassmorphism** y **bento grids** fueron tendencia humana antes de que ninguna herramienta
  los produjera por defecto. Que hoy correlacionen con IA es un accidente temporal.
- **Inter** es una tipografía excelente y gratuita, diseñada para interfaces. Su uso masivo
  precede a las herramientas generativas.
- El **em dash** es puntuación correcta. La señal está en la densidad anómala, no en su
  presencia. Por eso el umbral del escáner es 12, no 1.

Trátalas como indicios de segundo orden. Nunca construyas un veredicto sobre ellas solas.

## Limitaciones conocidas del escáner

- **Análisis estático.** No renderiza, no mide contraste real ni prueba interacción. Las
  comprobaciones de estados hover, foco y vacío son necesariamente humanas.
- **Los conteos se inflan en bundles con estilos repetidos.** Si el proyecto son fichas HTML
  autocontenidas que repiten los mismos tokens en cada archivo, un `backdrop-filter` que en
  realidad es una decisión se cuenta veinte veces. Mira siempre las muestras: si todas
  apuntan a la misma línea de archivos distintos, es una decisión, no una densidad.
- **CSS-in-JS y utilidades de Tailwind** se detectan sólo parcialmente. El escáner reconoce
  clases de gradiente de Tailwind, pero no resuelve valores calculados en tiempo de
  ejecución.

## Trampas al importar reglas de otras herramientas

Detectadas verificando fuente por fuente. Todas son formas de copiar algo que parece un
umbral y no lo es:

- **Los valores de ejemplo del README no son los defaults.** En `stylelint-magic-numbers`,
  `acceptedNumbers: [0, 0.25, 0.5, 1, 1.5, 2]` es un ejemplo; el código usa `|| []`, así que
  de fábrica **todo literal numérico viola**.
- **Los patrones de cadena pueden ir anclados por dentro.** `eslint-plugin-i18next` envuelve
  todo patrón en `^…$`. Copiar `[A-Z_-]+` sin anclar casa con cualquier cadena que contenga
  una mayúscula y silencia casi todos los hallazgos reales.
- **Las listas de términos pueden no normalizarse.** En `anchor-ambiguous-text`, la opción
  `words` del usuario no pasa por la normalización, así que una entrada con mayúsculas nunca
  casa. Hay que pre-minusculizar.
- **Las blocklists de color necesitan tabla de alias.** Buscar `#6366f1` falla ante la forma
  mucho más común `bg-indigo-500`. Y el mismo valor puede ser la marca legítima de alguien:
  la propia fuente que lo declara slop lista el índigo real de Linear. Por eso existe
  `--brand-colors`.
- **Expandir shorthands puede ser un fallback, no una regla.** En
  `declaration-strict-value`, la expansión sólo actúa cuando no hay coincidencia exacta de
  propiedad.

## Donde la bibliografía se equivoca, medido

No es una sospecha: es el resultado de medir las reglas de las fuentes contra un corpus
etiquetado. Tres correcciones que conviene tener presentes al leer cualquiera de esos
artículos.

**La uniformidad de escala está invertida.** Las fuentes afirman que lo generado tiene
«padding idéntico, radio idéntico, alturas de tarjeta idénticas». Medido en la banda de
tamaño controlada, ocurre lo contrario y con separación fuerte:

| Rasgo | AUC | Dirección |
| --- | --- | --- |
| Espaciados distintos | 0,767 | lo generado tiene **más** variedad |
| Radios distintos | 0,753 | lo generado tiene **más** variedad |
| Dominancia del radio principal | 0,277 | lo generado es **menos** uniforme |

Lo generado esparce la escala de Tailwind (`rounded-sm`, `rounded-lg`, `rounded-2xl`…)
mientras lo humano se concentra en menos valores. Lo que discrimina no es la uniformidad sino
**escaparse de la escala por los extremos**.

**El indicio más citado rinde poco.** El gradiente morado-azul, que las cuatro fuentes
repiten como el tell principal, mide **J = 0,13** con intervalos solapados: 35% en generado
frente a 22% en humano. No es ruido, pero no justificaba el peso máximo que le habíamos dado
por consenso de artículos.

**Y una regla detectaba lo contrario de lo que decía.** «Sin movimiento intencionado»
disparaba en el 61% del diseño humano y el 30% del generado. Exigía cero `@keyframes` en
archivos de estilo, y un proyecto Tailwind humano no tiene CSS propio: medía ausencia de CSS.

> La lección general, y aplica a cualquier regla que copies de un artículo: **una regla puede
> estar midiendo el stack en vez del origen.** Si la clase negativa usa otra tecnología que la
> positiva, cualquier diferencia técnica se lee como diferencia de autoría.

## El techo de lo que podemos afirmar

Los intervalos de confianza que acompañan a cada regla miden **el error de muestreo de una
tasa**. No miden que hayamos elegido qué reglas mirar *después* de ver los datos, que es la
fuente de optimismo más grande de todo el proceso.

La partición en conjunto reservado lo pone en números: **de 24 reglas con J > 0,15, sólo 8
conservan al menos la mitad de su fuerza en proyectos que no participaron en ninguna decisión
de peso.**

Las que aguantan con margen —`UX2`, `L2`, `C4`, `C6`, `CS3`, `E7`, `P4`, `S1`— son, hoy, lo
único defendible dentro y fuera de la muestra. Todo lo demás merece la coletilla «medido,
pendiente de confirmar».

> **La lista de arriba cambió al ampliar el corpus, y ese cambio dice más que la lista.**
> `L1`, `UX6` y `D5` estaban en ella y ya no están: `D5`, que era «el discriminador más
> limpio del catálogo» con lift 18, cae de 0,31 en ajuste a 0,05 en reserva. `C4`, que era el
> ejemplo canónico de regla que se cae fuera de muestra, ahora aguanta (0,43 → 0,30).
>
> No es que antes estuviéramos equivocados y ahora acertemos. Es que **con esta n, la
> pertenencia al núcleo es inestable**, y conviene tratarla como una estimación ruidosa y no
> como una credencial.

> Ojo con leerlo al revés: la reserva tiene pos=10 y neg=20. Con esa n, una regla puede
> moverse medio punto por azar, y **no es una refutación de dieciséis reglas**. Es una
> advertencia sobre la confianza agregada, no un veredicto regla a regla.

## La regla propia que no sobrevive

`L3` —diacríticos repartidos de forma sistemática— era la única comprobación inventada aquí
y la última sin medición. Su premisa: el ASCII irregular es hábito humano; el corte limpio
por archivo es proceso automático.

Sobre **19 proyectos humanos en español anteriores a ChatGPT** dispara en el **26%**
(IC95 12–49). Cinco equipos de personas dejan la misma huella que la regla atribuye a un
proceso automático. Sin clase positiva en español no hay J; la tasa ya descalifica el peso 3.

Lo defendible: *hubo dos orígenes de texto*. No *quién* escribió cada uno. Peso 1.
Detalle en `research/RESULTADOS.md` §L3.

## Las puntuaciones no son comparables entre versiones

Añadir comprobaciones cambia el denominador. Un proyecto que sacaba 32 puede sacar 53 sin
haber cambiado una línea, sólo porque el catálogo creció y pasa las nuevas.

Para seguir la evolución de un proyecto usa el **trinquete de baseline**, que mide deriva
nueva, no la puntuación absoluta.

## El error de razonamiento más frecuente

**Confundir "mal hecho" con "hecho por máquina".**

Una decisión de producto equivocada no tiene firma de autor. Si el catálogo no encaja con el
negocio, eso prueba que nadie validó el producto contra la estrategia — no prueba quién
tecleó. En una auditoría documentada, ése fue el motivo por el que seis de ocho indicios se
cayeron al someterlos a la hipótesis rival.

La regla: **antes de anotar un indicio, pregúntate si un humano con prisa produciría lo
mismo.** Si la respuesta es sí, el indicio no discrimina y no vale como evidencia de autoría.
Puede seguir valiendo como defecto de calidad, que es otra conversación y normalmente la más
útil.

## Lo que la rúbrica no ve, y suele ser lo más caro

Ninguna comprobación detecta que **el producto no sea el negocio**. Un artefacto puede sacar
90/100 —tipografía propia, fotografía real, copy pulido— y seguir modelando una cosa distinta
de la que la empresa vende.

Eso se detecta de una sola forma: leyendo el plan de negocio y buscando sus conceptos en el
código. Si la estrategia dice "quinceañeras" y el término no aparece ni una vez, ninguna
rúbrica visual te va a salvar.

Hazlo siempre. Es una búsqueda de treinta segundos y es el hallazgo con más valor de toda la
auditoría.

## Sobre la ausencia de acentos y otros indicios de idioma

Un texto en español sin diacríticos **no** prueba generación automática por sí solo: teclados
sin distribución local y hábitos de escribir datos en ASCII son endémicos.

Lo que sí discrimina es la **distribución**. Si el ASCII es irregular —acentos en unos sitios
y no en otros dentro del mismo archivo— es hábito humano. Si es un corte limpio por archivo
—cero caracteres no ASCII en unos, plenamente acentuados en otros— hay un proceso
sistemático detrás.

Es contrastable en un comando:

```bash
# cuenta caracteres no ASCII por archivo
for f in $(git ls-files '*.js' '*.jsx'); do
  printf '%-50s %s\n' "$f" "$(grep -o '[^\x00-\x7F]' "$f" | wc -l)"
done
```

Y aun así, prueba **proceso**, no autor.
