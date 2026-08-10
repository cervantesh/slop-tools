# Suelo de oficio — el mínimo que se comprueba en el resultado

> **Doctrina, no evidencia.** Adaptado de `craft-floor.md` de
> [impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0, © 2025 Paul Bakaus). No
> está medido y no puntúa. Lee `../caveats.md` antes de aplicarlo a ciegas.

Un encargo fijado o el mundo visual ya comprometido **manda sobre todo lo que sigue**. Tu
costumbre, no.

Y cada punto es una comprobación **sobre lo construido**, no sobre la intención. Se mira el
valor computado, no lo que uno creía haber escrito.

## Lo que se verifica

**Contraste.** Texto de lectura y *placeholder* a **4,5:1** o más; texto grande a **3:1**.
Sobre superficies de color, el texto secundario se tiñe del propio tono del fondo o del color
de primer plano. **Nunca gris neutro.**

**Profundidad.** Una sombra lleva desplazamiento y desenfoque suave. Un halo de color con
desplazamiento cero no es profundidad, es adorno.

**Espaciado.** Grupos apretados, separaciones generosas, y **más aire encima de un titular
que debajo**. Un titular pertenece a lo que introduce; si está más cerca del bloque anterior,
cada sección parece el pie de foto de la anterior.

**Tipo.** Medida de **65–75ch**, display por debajo de **6rem**, suelo de interletraje en
**−0,04em**, escalones de tamaño y peso evidentes.

**Movimiento.** **Un momento autorado**, no efectos repartidos ni la misma entrada idéntica
en cada sección. Salida exponencial partiendo de un estado ya visible.

**Estados.** Hover, deshabilitado, cargando, error, vacío. Los cinco.

**Superficies del navegador.** Selección de texto, cursor, barras de scroll, anillo de foco,
desplazamiento del subrayado y cifras tabulares salen con valores por defecto que no
pertenecen a ningún sistema de diseño. Tematízalos desde la paleta.

> Esto último es, según la fuente, **la señal más barata de que una página se construyó en
> vez de ensamblarse, y la que los modelos se saltan con más fiabilidad.** Nos parece la
> observación más aprovechable de todo el material, y no la hemos convertido en regla porque
> comprobarla exige resolver la cascada sobre pseudo-elementos. Queda como hipótesis
> pendiente.

## Lo que se rechaza

Distinción importante, y es de la fuente: **casi todo esto son los defaults de la categoría,
no vetos.** Las palabras del propio encargo pueden ganarse cualquiera de ellos. Reconocerlo
significa **reescribir el elemento, no suavizarlo**.

**Andamiajes de página.** Rejillas de tarjetas idénticas —la tarjeta es el contenedor
perezoso, y **anidar tarjetas está siempre mal**—. La plantilla de métrica de hero (número
grande, etiqueta pequeña, tres cifras de apoyo, acento). Números de sección 01/02/03 salvo
que la secuencia lleve información. Modal sin necesidad real de interrumpir.

**El kicker sobre el titular es la excepción: es veto, no default.** Ningún encargo se lo
gana de vuelta. El titular carga con su propio peso; si las palabras del kicker importan, van
dentro del titular o en el cuerpo.

**Hábitos de superficie.** Texto con degradado —el énfasis se hace con peso o con tamaño—.
Cristal y desenfoque como decoración. Borde lateral de color por encima de 1px. Sombra dura
sin desenfoque fuera de un mundo que de verdad sea neobrutalista: es disfraz, no sistema de
elevación. Monoespaciada como disfraz de «técnico» en vez de para código, datos o medida.
Familias de sistema como display (Impact, Arial Black, la sans de la plataforma): **la fuente
instalada más parecida es un fallo, no un plan B**. Glifos Unicode o emoji haciendo de
sistema de iconos.

**Ilustración de verdad o ninguna.** El límite es preciso y vale la pena: se veta el SVG que
imita una imagen, nunca el SVG que hace geometría. Geometría son formas que una sesión puede
especificar exactamente.

## Dónde esto ya es regla aquí

| Criterio | Regla |
| --- | --- |
| Kicker sobre titular | `S6` |
| Números de sección | `S7` |
| Baldosa de icono sobre titular | `S8` |
| Texto con degradado | `UX10` |
| Halo de color con desplazamiento cero | `A5` |
| Borde lateral de color | `C2`, `C5` |
| Filete fino con sombra ancha | `C6` |
| Emoji en vez de iconos | `D5` |
| Escena montada con primitivas SVG | `D7` |
| Interletraje por debajo de −0,05em | `B5` |
| Medida de prosa fuera de 45–75ch | `HM10` |

## Dónde este suelo choca con lo que medimos

**«Anidar tarjetas está siempre mal»** no es regla aquí porque detectar anidamiento exige el
DOM y nuestro escáner lee la fuente. No está descartado por falso: está descartado por no
comprobable. Igual que **«más aire encima del titular que debajo»**, que exige geometría
renderizada.

Y una discrepancia de fondo: el suelo pide **medida 65–75ch**, mientras `HM10` usa **45–75ch**.
Nos quedamos con la nuestra, que es la horquilla clásica y la que ya estaba medida contra el
corpus.

## Si lo aplicas al pie de la letra

El suelo sostiene la mecánica; **no elige la dirección**. Un proyecto que pasa los doce
puntos y no ha decidido nada sigue siendo genérico — con buen contraste. Ver `direccion.md`.

Y la regla de desempate de la fuente, que suscribimos: **entre refinado y comprometido,
comprométete.**
