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
