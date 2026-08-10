# Color — roles, no muestrario

> **Doctrina, no evidencia.** Adaptado de `colorize.md` y `quieter.md` de
> [impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0, © 2025 Paul Bakaus). No
> está medido y no puntúa. Lee `../caveats.md` antes de aplicarlo a ciegas.

## Construye roles, no una bolsa de muestras

La idea central, y la que más cambia un sistema: el color no se elige como paleta, se asigna
como **roles**.

| Rol | Qué resuelve |
| --- | --- |
| Lienzo y superficies elevadas | Dónde está el suelo y qué flota sobre él |
| Texto primario y secundario | Jerarquía de lectura |
| Acción, foco y selección | Qué se puede tocar y qué está tocado |
| Bordes y separadores | División sin peso |
| Éxito, aviso, error, información | Semántica, y **fuera** de la cuenta de tonos de marca |
| Categorías o escalas de datos | Codificación, no decoración |

Una paleta que no puede responder «¿cuál es aquí el rol de superficie elevada?» todavía es un
muestrario.

## Contraste, que es lo no negociable

| Qué | Mínimo |
| --- | --- |
| Texto de lectura y *placeholder* | **4,5:1** |
| Texto grande | **3:1** |
| Controles, iconos y anillos de foco | **3:1** |

Y la regla que más se incumple sin darse cuenta: **sobre fondo cromático, el texto secundario
se deriva del propio tono del fondo o del color de primer plano. Nunca gris neutro.** El gris
está calibrado contra neutros; sobre color se lee desvaído aunque el ratio pase.

## Cómo se comporta un color fuerte

- **El color más fuerte se queda con una región o un rol deliberados**, en vez de repartirse
  en acentos pequeños por toda la página.
- **La acción primaria no gasta su color en decoración.** Si el acento está en seis sitios,
  ya no señala dónde hay que pulsar.
- El tono sale del significado del producto y de la dirección visual, **nunca de la
  asociación por categoría** (salud → verde, finanzas → azul).

## Modo oscuro

**No se invierte el tema claro.** Se diseña la elevación de superficies y el contraste
explícitamente. Un tema claro invertido produce superficies que no se distinguen entre sí y
sombras que ya no significan nada, porque en oscuro la elevación se lee con luminancia, no
con sombra.

Y de `direccion.md`: claro u oscuro no es un default. Escribe una frase de escena física
—quién usa esto, dónde, con qué luz— y deja que decida.

## Rampas en OKLCH

Al construir una escala, varía la luminosidad y **reduce el croma cerca del blanco y del
negro**. Mantener croma alto en los extremos sólo para que la matemática quede uniforme
produce los tonos flúor que delatan una rampa generada.

Prefiere colores explícitos a cadenas de capas translúcidas: con alfa, el contraste pasa a
depender del contexto y deja de poder comprobarse.

Para datos, que el color **no sea la única codificación**: luminosidad, forma, etiqueta o
patrón además del tono.

## Bajar el volumen sin apagarlo

De `quieter.md`, que es el documento con más números del original:

- Saturación plena → **70–85%**.
- Pesos: **900 → 600**, **700 → 500**.
- **Grises con temperatura**, cálidos o fríos, en vez de gris puro. (Es nuestra `K1`, y es la
  única de esta sección que sí está medida: J 0,08 en banda, no separa.)
- Jerarquía con peso, tamaño y espacio **en vez de** con color y negrita.

Y su lista de «nunca», que es la parte que impide que el consejo se vuelva daño:

> Nunca dejes todo del mismo tamaño y peso. Nunca quites todo el color —silencioso no es
> escala de grises—. Nunca elimines la personalidad entera. Nunca sacrifiques usabilidad.
> Nunca lo hagas todo pequeño y ligero: hacen falta anclas.
>
> **Silencioso sin intención colapsa en genérico.** Piensa en lujo, no en pereza.

## El conflicto de los porcentajes, resuelto

`colorize.md` **rechaza** explícitamente las reglas de porcentaje fijo: la distribución debe
seguir el encargo y el mundo elegido. `quieter.md` prescribe la «regla del 10%». Y nuestro
`remediation.md` propone 60/30/10.

**Se resuelve así:** 60/30/10 es un punto de partida razonable **mientras no haya dirección
comprometida**. En cuanto la hay, manda la estrategia de color de `direccion.md` —contenida,
comprometida, paleta completa o empapada—. Un 10% de acento dentro de una estrategia empapada
significa que no se eligió ninguna.

## Si lo aplicas al pie de la letra

La prueba de salida, que es la que importa:

> **El resultado se reconoce como este producto, no como «un tratamiento colorido».**

Un sistema puede cumplir los seis roles, pasar todos los contrastes y seguir siendo
intercambiable. Eso no es un fallo de esta doctrina: es que el color no decide la dirección.
