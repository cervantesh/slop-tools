# Movimiento — qué justifica una animación

> **Doctrina, no evidencia.** Adaptado de `animate.md` y `overdrive.md` de
> [impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0, © 2025 Paul Bakaus). No
> está medido y no puntúa. Lee `../caveats.md` antes de aplicarlo a ciegas.

## Duraciones

| Qué | Duración |
| --- | --- |
| Respuesta inmediata a una acción | **100–150 ms** |
| Cambio de estado corriente | **150–300 ms** |
| Transición de maquetación, superposición o vista | **300–500 ms** |
| Entrada focal deliberadamente autorada | **500–800 ms** |

Dos reglas que valen más que la tabla:

- **La salida es más rápida que la entrada.** Siempre.
- **Una respuesta lenta se siente como latencia**, no como elegancia. Por encima de 300 ms en
  un botón, el usuario cree que la aplicación va lenta.

Curva de referencia para llegadas seguras: `cubic-bezier(0.16, 1, 0.3, 1)`. Y **nada de
rebote ni elástico por reflejo** (nuestra `HM3`). Distancias cortas: **10–20px, no 40px**.

Nuestro contrato ya fija esto de otra forma: `DS5` acota el movimiento a **una** duración
declarada, y `UX3` marca el `300ms` de fábrica. La tabla de arriba es para decidir cuál
declarar.

## La prueba que descarta casi todo

> **Un fundido-y-subida genérico, un levantamiento en hover, una capa de parallax o un reveal
> al hacer scroll no son una tesis.**

Es la formulación más directa de todo el material y coincide con lo que ya medimos: `AS2`
—levantar la tarjeta en hover— y `HM4` —`hover:scale-105` en todo— son reglas nuestras, y
`HM4` mide **J 0,24 separando**. El micro-gesto por defecto es real y se detecta.

## Qué justifica una animación

Sólo cinco trabajos, y si no hace ninguno, sobra:

1. Acusa recibo de una acción.
2. Hace legible un cambio de estado o una relación espacial.
3. Preserva la continuidad al navegar o al cambiar la maquetación.
4. Dirige la atención en un momento que lo merece.
5. Encarna el mundo visual elegido.

**Un momento autorado, no efectos repartidos.** Y nunca la misma entrada idéntica en cada
sección: el escalonado entre hermanos es correcto cuando una lista aparece **como lista**; no
se reinterpreta cada sección scrolleada como una lista escalonada. Acota el retardo total.

## Materiales, por lo que significan

Salir de `transform` y `opacity` cuando el significado lo pide:

- **Continuidad y relación** — elemento compartido, FLIP, transiciones de vista.
- **Foco y profundidad** — desenfoque acotado, filtros, `backdrop-filter`, sombra.
- **Revelado y composición** — máscaras, `clip-path`, oclusión.
- **Material y energía** — color, posición del degradado, textura, distorsión.
- **Estado y respuesta** — el cambio más pequeño que haga inequívocos causa y efecto.

## Higiene

- No animes propiedades que dirigen la maquetación —`width`, `height`, `top`, `left`,
  márgenes— salvo con motivo (nuestra `HM2`).
- `will-change` **sólo** durante una animación conocida.
- **El contenido es visible en el estado por defecto**, para que un script que falle no
  esconda la página. Esto es importante: el fallo contrario —contenido que sólo aparece si un
  reveal se ejecuta— es una de las reglas que descartamos por exigir navegador
  (`content-hidden-at-rest`), así que aquí sólo podemos pedirlo, no comprobarlo.
- Todo bucle no esencial **para cuando está fuera de pantalla u oculto**.
- **Movimiento reducido significa menos animaciones y más suaves, no ninguna**: la respuesta
  que confirma una acción tiene que seguir siendo legible. Nuestra `HM8` sólo comprueba que
  exista el bloque `prefers-reduced-motion`; vaciarlo del todo cumple la regla y falla el
  criterio.

## Las cuatro pruebas de salida

De `overdrive.md`, quitando su catálogo de APIs de navegador, que es referencia que caduca:

1. **Prueba de retirada.** Quítalo. ¿La experiencia se empobrece, o no lo nota nadie?
2. **Prueba de contexto.** ¿Tiene sentido para **esta** marca y **este** público? Un sistema
   de partículas en un portafolio creativo impresiona; **el mismo sistema en una pantalla de
   ajustes da vergüenza**. Pero una pantalla de ajustes con guardado optimista instantáneo y
   transiciones de estado animadas también es extraordinaria.
3. **Prueba de dispositivo.** Teléfono, tableta, portátil modesto. Objetivo **60fps**; si baja
   de 50, simplifica.
4. **Prueba de reacción.** Enséñaselo a alguien que no lo haya visto. ¿Reacciona?

Y la lista de «nunca» que hace de contrapeso:

> Nunca uses ambición técnica para tapar fundamentos de diseño débiles: arréglalos primero.
> Nunca superpongas varios momentos extraordinarios compitiendo — **el foco crea impacto, el
> exceso crea ruido**. Nunca sonido sin consentimiento explícito. La mejora progresiva no se
> negocia: sin el efecto, la experiencia tiene que seguir siendo buena.

## Si lo aplicas al pie de la letra

El criterio de retirada, llevado al extremo, elimina toda la animación de una interfaz — y una
interfaz sin ningún movimiento tampoco es neutra: comunica que nadie se ocupó. La regla real
es **un** momento autorado, no cero.
