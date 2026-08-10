# Tipografía — roles antes que tamaños

> **Doctrina, no evidencia.** Adaptado de `typeset.md` y `new-work.md` de
> [impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0, © 2025 Paul Bakaus). No
> está medido y no puntúa. Lee `../caveats.md` antes de aplicarlo a ciegas.

## Los números

| Qué | Valor |
| --- | --- |
| Medida de prosa | **45–75 caracteres** (`HM10` usa esta horquilla; el original pide 65–75) |
| Suelo del cuerpo | **16px / 1rem** |
| Suelo de texto funcional | **11px** — enlaces, botones, celdas, etiquetas (`B6`) |
| Interlineado de lectura | **1,5–1,7**; por debajo de **1,3** las líneas se tocan (`B7`) |
| Display | por debajo de **6rem** |
| Suelo de interletraje | **−0,04em**; entre −0,02 y −0,03em suele leerse mejor (`B5` marca −0,05) |

Dos matices que evitan aplicarlos mal:

- **El interlineado se ajusta inversamente a la medida**: líneas más anchas piden más aire.
  Y se ajusta a la familia, al idioma y al contraste, **no a una razón universal**.
- **Añadir un tamaño a la escala del contrato no arregla la legibilidad**, sólo blanquea el
  token. Es exactamente la escapatoria que `DS8` existe para cerrar.

## Roles, no una colección de valores

Cinco: **titular, cuerpo, etiqueta, metadato, dato**. Las preguntas de diagnóstico:

- ¿Hay una escala de roles deliberada, **o una colección de valores arbitrarios**?
- ¿Hay tamaños o pesos **adyacentes demasiado próximos para hacer trabajos distintos**?
- ¿Las familias encajan con el producto, **o son defaults sin examinar**? **¿Es necesaria cada
  familia?**

Y la prueba de salida: **los roles primario, secundario, cuerpo y metadato se reconocen sin
leer el texto.**

> Aquí hay que declarar un choque con nuestra propia medición. `B9` porta la idea de que una
> escala con escalones demasiado próximos delata generación, y **medida da 0% en generado
> frente a 5% en humano**: apunta al revés. El criterio sigue siendo bueno —una jerarquía
> plana se lee peor— pero como **defecto de oficio, no como indicio de autoría**.

## Reglas de composición

- Combina tamaño, peso, espacio y tono **en vez de pedirle al tamaño que lo haga todo**.
- **Espaciado entre párrafos O sangría de primera línea**, no las dos: juntas marcan el mismo
  límite dos veces.
- No metas una segunda familia sin un rol que **sólo ella** pueda cumplir.
- En modo oscuro, el texto pide compensación en tres ejes: **algo más de interlineado, algo
  más de interletraje y un escalón más de peso** cuando la familia lo necesita.

## Las familias de reflejo

De `new-work.md`, y es la lista más útil del material porque describe adónde va un modelo
cuando huye del default:

> Fraunces · Playfair Display · Cormorant · Lora · Crimson · Newsreader · Syne · Space
> Grotesk · Space Mono · IBM Plex · Inter como display · DM Sans · DM Serif · Outfit · Plus
> Jakarta Sans · Instrument Sans

Elegir una de éstas exige una razón que ninguna otra familia pueda satisfacer, y **la
asociación temática nunca es esa razón**: que un proyecto de libros quiera una serif, una
librería quiera lettering y una empresa técnica quiera una mono son precisamente las
asociaciones que esta lista existe para romper.

> Contraste con lo medido: nuestra `B1` cubre Inter, Poppins, Geist, Space Grotesk, Roboto y
> Open Sans, y mide J 0,08 — no separa. Las familias de reflejo son un criterio de oficio
> razonable; **como detector de procedencia, no ha rendido**. No se amplió `B1` con esta lista
> precisamente para no mover una regla ya medida sin remedir.

Y algo que sí es un fallo y no una preferencia: **la fuente instalada más parecida es un
fallo, no un plan B**. Impact, Arial Black o la sans de la plataforma como display significan
que la familia elegida no llegó.

## Entrega

- ¿Se cargan sólo los recursos que se usan?
- ¿Las métricas de reserva, la estrategia de carga y los ajustes de fuente variable evitan
  **texto invisible y reflujo brusco**?

## Extremos que rompen una tipografía

Titulares largos · expansión por traducción —el español crece un 20–25% sobre el inglés—
zoom al 200% · contenedores estrechos · pesos que faltan · la familia de reserva.

## Si lo aplicas al pie de la letra

Una escala perfecta de cinco roles con una familia impecable puede seguir siendo la misma
página que todas las demás. La tipografía **ejecuta** una dirección; no la elige. Y entre
respetar la escala y que el titular diga algo, gana el titular.
