# Rúbrica general — 42 comprobaciones

Consolidada de cuatro fuentes publicadas (ver `sources.md`).

> **Si auditas una aplicación, esta rúbrica no basta.** Está construida sobre fuentes que
> miran webs de marketing. El bloque específico de producto —localización, microcopy,
> estados, fidelidad al dominio y confianza— está en **`producto.md`**, y son otras 27
> comprobaciones. Total del repositorio: **70**, de las cuales el escáner automatiza 58.

## Dos advertencias antes de usarla

**Los identificadores de este documento no son los del escáner.** Aquí `C3` es «rejilla de
tres tarjetas» y en `data/rules.json` es «radio y padding uniformes». Esta rúbrica es el mapa
conceptual de lo que dicen las fuentes; **el catálogo ejecutable y su espacio de nombres
viven en `data/rules.json`**. Cuando quieras el ID de una regla que falló, míralo ahí.

**Los pesos de estas tablas son los que sugieren las fuentes, no los medidos.** Varios se
corrigieron al medir sobre corpus etiquetado y hoy son distintos: `A1` bajó de 3 a 2, `C1` de
3 a 1, `D1` de 3 a 1, `E4` de 3 a 1, `D5` subió de 2 a 3, `B2` quedó en 0 y `F2` se eliminó
por disparar al revés. **Los pesos vigentes están en `data/rules.json`; el porqué de cada
cambio, en `research/RESULTADOS.md`.**

Cada comprobación indica:

- **Auto** — la ejecuta `slop-scan.mjs`.
- **Humano** — exige mirar.
- **Aplica a** — `landing` (web de marketing), `producto` (app), o `ambos`. Léelo: aplicar
  criterios de landing a una app operativa produce falsos positivos.
- **Peso** — 3 alto, 2 medio, 1 bajo, **según las fuentes** (ver advertencia arriba).

---

## A · Color y efectos

| # | Comprobación | Modo | Aplica a | Peso | Fuente |
| --- | --- | --- | --- | --- | --- |
| A1 | Gradiente morado→azul en hero, botones o fondo | Auto | ambos | 3 | vibecodekit, 925, sikora |
| A2 | Dark mode permanente como opción por defecto | Auto | landing | 2 | vibecodekit |
| A3 | Glassmorphism aplicado de forma indiscriminada | Auto | ambos | 2 | vibecodekit |
| A4 | Orbes o resplandor de acento detrás del hero | Auto | landing | 2 | vibecodekit |
| A5 | Neón sobre oscuro (cian/violeta) con bordes que brillan | Auto | ambos | 2 | vibecodekit |
| A6 | Paleta tímida: sin dominante ni acento claro | Humano | ambos | 2 | vibecodekit |

**A1** es el tell más citado de todas las fuentes. La razón está en `remediation.md`: el
morado-azul es la elección estadísticamente segura, pasa contraste y no exige teoría del
color.

---

## B · Tipografía

| # | Comprobación | Modo | Aplica a | Peso | Fuente |
| --- | --- | --- | --- | --- | --- |
| B1 | Inter, Poppins, Geist, Space Grotesk o Roboto como familia principal | Auto | ambos | 2 | vibecodekit, 925 |
| B2 | Una sola familia, sin pareja tipográfica intencionada | Auto | landing | 1 | vibecodekit |
| B3 | Una palabra suelta en serif itálica dentro de un titular sans | Humano | landing | 2 | vibecodekit |
| B4 | Etiquetas en mayúsculas por todas partes | Auto | ambos | 1 | vibecodekit |

---

## C · Layout y componentes

| # | Comprobación | Modo | Aplica a | Peso | Fuente |
| --- | --- | --- | --- | --- | --- |
| C1 | Borde gris plano de 1px en tarjetas | Auto | ambos | 3 | vibecodekit |
| C2 | Franja lateral de color de 3–4px para estados semánticos | Auto | ambos | 2 | vibecodekit, sikora |
| C3 | Rejilla automática de tres tarjetas de features | Humano | landing | 2 | vibecodekit, 925 |
| C4 | Badge o etiqueta justo encima del H1 en hero centrado | Humano | landing | 2 | vibecodekit |
| C5 | Esqueleto sin tocar: hero → cards → logos → precios → FAQ → footer | Humano | landing | 3 | vibecodekit |
| C6 | Bento grid como elección refleja | Humano | ambos | 1 | vibecodekit |
| C7 | Padding, radio y altura de tarjeta idénticos en todo | Humano | ambos | 2 | 925 |
| C8 | Anidamiento excesivo de tarjetas dentro de tarjetas | Humano | ambos | 1 | vibecodekit |

**C1** es descrito por vibecodekit como el indicador aislado más fiable. El escáner mide
densidad, no presencia: un borde plano no dice nada, cuarenta sí.

> Medido, no lo es. `C1` da **J = 0,00** en la banda controlada. Además pasó diez meses
> mirando sólo archivos CSS, donde un proyecto Tailwind no tiene bordes: hoy cuenta también
> `border border-gray-200` y está **pendiente de remedir**. Puede que la fuente tuviera razón
> y no lo supiéramos.

---

## D · Imagen

| # | Comprobación | Modo | Aplica a | Peso | Fuente |
| --- | --- | --- | --- | --- | --- |
| D1 | Enlaces a bancos de imágenes (Unsplash, Pexels, Pixabay) | Auto | ambos | 3 | 925, sikora |
| D2 | Foto de equipo diverso mirando un portátil en oficina impecable | Humano | landing | 3 | 925, growthguys |
| D3 | Ilustración demasiado lisa, simétrica, con aspecto plástico | Humano | ambos | 2 | 925 |
| D4 | Icono grande centrado sobre el titular | Humano | ambos | 1 | vibecodekit |
| D5 | Emojis donde correspondería un icono | Auto | ambos | 2 | sikora |
| D6 | Ausencia total de fotografía propia | Humano | ambos | 3 | sikora |

---

## E · Copy y contenido

| # | Comprobación | Modo | Aplica a | Peso | Fuente |
| --- | --- | --- | --- | --- | --- |
| E1 | Abuso del em dash | Auto | ambos | 2 | sikora, 925 |
| E2 | Comillas tipográficas curvas sin tocar desde el pegado | Auto | ambos | 1 | sikora, 925 |
| E3 | Titulares vagos: "Construye el futuro", "Tu plataforma todo en uno" | Humano | landing | 3 | 925, growthguys |
| E4 | Tarjetas con longitud y estructura idénticas, o copy literalmente duplicado | Auto | ambos | 3 | sikora |
| E5 | Densidad de palabras vacías: "seamless", "innovador", "potenciar", "sinergia" | Auto | ambos | 2 | growthguys |
| E6 | Nombres de relleno en testimonios o datos | Auto | ambos | 2 | sikora, growthguys |
| E7 | Restos de andamiaje: lorem, dummy, TODO, MVP, tarjetas de prueba | Auto | producto | 3 | — |
| E8 | Afirmaciones sin cifras, ejemplos ni plazos concretos | Humano | landing | 3 | growthguys |
| E9 | Gramática perfecta y cero personalidad | Humano | ambos | 2 | 925 |

**E7** no está en las fuentes: se añadió tras encontrarse repetidamente en auditorías
reales. Restos como una tarjeta de prueba `4242` o un párrafo explicando el despliegue al
usuario final son señal fortísima de que la salida nunca se revisó.

---

## F · Interacción y movimiento

| # | Comprobación | Modo | Aplica a | Peso | Fuente |
| --- | --- | --- | --- | --- | --- |
| F1 | Estados hover que no hacen nada | Humano | ambos | 2 | 925, vibecodekit |
| ~~F2~~ | ~~La misma animación de entrada en todos los elementos, o ninguna~~ | **eliminada** | — | — | 925, vibecodekit |
| F3 | Botones que saltan en vez de acelerar | Humano | ambos | 1 | 925 |

**`F2` se eliminó del escáner.** Medida, disparaba en el 30% de lo generado y el **61% de lo
humano** (J = −0,31, intervalos separados): era un detector de diseño humano. La causa es
diagnosticable — exigía cero `@keyframes` en archivos de estilo, y un proyecto Tailwind
humano no tiene CSS propio. No medía ausencia de movimiento: medía **ausencia de CSS**.
Se deja tachada aquí porque la fuente sigue afirmándola.

---

## G · Especificidad y confianza

| # | Comprobación | Modo | Aplica a | Peso | Fuente |
| --- | --- | --- | --- | --- | --- |
| G1 | **Prueba del cambio de nombre** | Auto* | ambos | 3 | growthguys |
| G2 | Precios ocultos tras "consultar" | Humano | landing | 2 | growthguys |
| G3 | Testimonios con avatar genérico y sin enlace a perfil real | Humano | landing | 2 | growthguys |

`Auto*` — el escáner extrae los titulares que **no** mencionan la marca y te los devuelve
como candidatos. El juicio final es tuyo.

---

---

## Bloque de producto — las que el escáner también ejecuta

Documentadas por extenso en `producto.md`. Se listan aquí para que el espacio de
identificadores esté completo en un solo sitio.

| # | Comprobación | Modo | Aplica a | Peso | Fuente |
| --- | --- | --- | --- | --- | --- |
| L1 | Plural sin resolver junto a un contador: «1 opciones» | Auto | producto | 3 | QAwerk |
| L2 | Fechas y monedas concatenadas en vez de formateadas | Auto | producto | 2 | QAwerk |
| L3 | Diacríticos repartidos de forma sistemática entre archivos | Auto | producto | 3 | propia |
| T1 | Botones de solo icono sin nombre accesible | Auto | producto | 2 | LQA / a11y |

Las otras comprobaciones de `producto.md` —revisión por hablante nativo de la variante
regional, microcopy, los cinco estados fuera del camino feliz, la prueba de los conceptos del
negocio y los seis pilares de confianza— son humanas y viven en
`templates/revision-humana.md`.

---

## Interpretación de la puntuación

El escáner puntúa sólo las comprobaciones automáticas, ponderadas por peso y filtradas por
perfil (`--profile landing|producto|ambos`).

| Puntuación | Lectura |
| --- | --- |
| 85–100 | Limpio. Si aun así "parece IA", el problema está en las comprobaciones humanas. |
| 70–84 | Restos localizados. Corregibles en horas. |
| 50–69 | Se identificará. Requiere una pasada de contenido y de sistema. |
| < 50 | Se identifica en los primeros diez segundos. |

**La puntuación no es un veredicto.** Es el punto de partida de la conversación con el
equipo. Un producto puede sacar 90 y seguir sin parecerse en nada a su negocio, que es un
problema peor y ninguna rúbrica lo detecta.
