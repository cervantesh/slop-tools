# Dirección — comprometerse y no volver a la media

> **Doctrina, no evidencia.** Adaptado de `new-work.md` de
> [impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0, © 2025 Paul Bakaus). No
> está medido y no puntúa. Lee `../caveats.md` antes de aplicarlo a ciegas.
>
> El original mezcla criterio con el andamiaje de su herramienta —sus scripts, sus rutas, sus
> subagentes, su página de decisión—. Aquí está sólo el criterio. La mitad procedimental no
> se portó porque describe órganos que no tenemos.

`remediation.md` ya dice el porqué: sin una restricción declarada, un modelo converge al
promedio de millones de plantillas. Este documento es el nivel siguiente — **cómo se decide
la restricción**, no cómo se escribe.

## Por qué llegó a existir el problema

Un encargo empieza en uno de cuatro estados, y confundirlos es el primer error:

| Estado | Qué manda |
| --- | --- |
| Rediseño | Nada se hereda salvo el contenido y las afirmaciones |
| Mundo establecido | Se hereda entero. Una sección dentro de una superficie establecida hereda esa superficie |
| Marca incompleta | Se hereda lo que hay y se completa, no se sustituye |
| Sin autoridad visual | Hay que decidir de cero |

Y una precisión que evita mucho daño: **que no exista `DESIGN.md` no borra una identidad
coherente que ya esté en el código.**

## Para qué vino quien mira

Cuatro modos, y determinan cuánta libertad expresiva hay:

- **Persuadir** — hay que aclarar quién debe actuar, qué debe creer y qué prueba real puede
  ganarse esa creencia.
- **Operar** — la expresión **nunca** puede tapar la tarea, el estado o una affordance
  conocida.
- **Leer** — comprensión y orientación intactas por encima de todo.
- **Experimentar** — la obra manda desde el primer viewport.

Persuadir y experimentar tienen permiso para las estrategias audaces. Operar y leer, no. Esto
es lo mismo que hace nuestro `--profile landing|producto`, pero con más grano.

## Las tres estéticas de reflejo

La aportación más específica del material, y la más útil, porque describe fallos del propio
modelo y no principios generales. Cuando un modelo huye del promedio, aterriza en uno de
estos tres sitios:

1. **Papel crema, serif de alto contraste, acento terracota o rojo señal.**
2. **Casi negro con un acento neón y bordes que brillan.**
3. **Editorial de periódico: filetes capilares, serif en itálica de display, etiquetas mono
   pequeñas con interletraje abierto.**

Y la prueba de calibración, que es lo que hay que retener:

> **Si alguien pudiera adivinar tu estética sabiendo sólo la categoría, o sabiendo la
> categoría más lo que estás evitando, rehazla hasta que ninguna de las dos respuestas sea
> obvia.**

Corolarios que cierran las escapatorias: aterrizar en crema y serif para un tema de libros es
**el default disfrazado del tema**; una restricción negativa veta *esos recursos*, no la
exuberancia; y un mundo fijado por el encargo fija el mundo, no su versión más suave.

> **Esto choca con nuestra medición y hay que decirlo.** La primera estética es exactamente
> nuestra regla `AS9` («monocultura de segundo orden»), y `AS9` mide **J ≈ 0**: no aparece en
> el corpus. Puede ser que la regla sea estrecha —casa cuatro hexes y tres familias— o que la
> estética sea posterior al corpus. Por eso se portó `K5`, la prueba algorítmica del fondo
> crema, que sí puede encontrarla. Hasta que haya cifra, esto es una hipótesis con buena
> pinta, no un hecho.

## Derivar en vez de elegir

Antes de decidir, lista **siete** sistemas visuales, artefactos, lugares o rituales que el
público conozca de memoria. Con tres reglas:

- Nombra el default de la categoría **y su opuesto previsible**, y deja los dos fuera de los
  siete. El opuesto previsible es tan default como el default.
- Como mucho **un** candidato puede ser la metáfora literal del tema.
- **Si más de tres de los siete comparten familia de material**, la derivación se paró en el
  artefacto más obvio. Sigue hasta que la lista cubra al menos tres familias.

Dos preguntas que la desatascan: ¿qué aspecto tendría esto como objeto físico? ¿Qué aspecto
tenía su mundo antes de que existiera la web?

## Estrategia de color

Cuatro, y se elige una, no se mezclan:

| Estrategia | Qué es | Cuándo |
| --- | --- | --- |
| **Contenida** | Neutros más un acento | El default cuando se viene a operar o a leer |
| **Comprometida** | Un color saturado ocupa el **30–60%** de la superficie | Persuadir, experimentar |
| **Paleta completa** | 3–4 roles con nombre | Cuando el contenido tiene categorías reales |
| **Empapada** | La superficie **es** el color | Experimentar, y sabiendo lo que se hace |

La regla que las hace funcionar: **el color se compromete a escala de página** — regiones
enteras, no acentos pequeños repartidos sobre un fondo neutro.

Y una que corrige un reflejo muy común: **claro u oscuro no es nunca un default.** Escribe una
frase de escena física —quién usa esto, dónde, con qué luz— y deja que la frase decida.

> `remediation.md` propone tres tonos en proporción 60/30/10. La fuente rechaza
> explícitamente las reglas de porcentaje fijo. **Se resuelve así:** 60/30/10 es un punto de
> partida razonable cuando no hay dirección comprometida; en cuanto la hay, manda la
> estrategia elegida. Un 10% de acento dentro de una estrategia empapada es no haberla
> elegido.

## El primer viewport es una tesis

No una cabecera. La prueba:

> **Si alguien se fuera después de una sola pantalla, ¿qué describiría una hora después? Si
> la respuesta honesta es un ánimo, el concepto todavía no se ha comprometido.**

Es la misma familia que nuestra **prueba del cambio de nombre** (`SKILL.md`): si cambias el
nombre del producto por el de un competidor y nada chirría, no había dirección. Una mira hacia
el recuerdo y la otra hacia la sustitución, pero preguntan lo mismo.

## Reproducir un comp

Cuando existe una maqueta aprobada, la reproducción va primero y **la comparación manda sobre
tu convicción**. Existen **exactamente tres concesiones**:

1. Tipografías — la familia obtenible más cercana.
2. Iconos — coincidencia exacta salvo que ya haya librería elegida.
3. Defectos genuinos del comp, como erratas.

Y el aviso que explica por qué se escribe esto: **los calificativos «sutil», «contenido», «de
bajo contraste», y los recuentos redondeados a la baja hasta una fracción cómoda, son la
forma en que un material aprobado se muere entre la aprobación y la construcción.**

## Cuándo parar

- **Dos rondas de acabado es el techo** de una ejecución desatendida, y los arreglos se
  agrupan entre rondas en vez de pedir captura por retoque.
- **Para en cuanto una ronda no resuelva nada.**
- Una tabla con hallazgos materiales abiertos **no se anuncia como aprobado**.
- Tras **dos descartes seguidos** de la dirección propuesta, deja de proponer y pregunta qué
  cualidad falta.
- El gusto nunca es motivo para descartar por tu cuenta; un hecho comprobable, sí.

Esto es lo mismo que hace `slop-refine` con el humano en el lazo, y con el mismo techo. La
diferencia es que allí el presupuesto lo pone la persona; aquí se declara por defecto.

## Si lo aplicas al pie de la letra

La huida del default tiene su propia media. Una página que evita las tres estéticas de reflejo
**por evitarlas** es reconocible igual, sólo que como «lo que hace alguien que leyó esta
lista». Por eso la prueba de calibración incluye la categoría **más lo que evitas**: las dos
respuestas tienen que fallar.

Y la salida honesta: el estándar de la categoría, ejecutado en serio y sin ironía, es una
opción legítima. Nunca la recomiendes tú. Pero si quien decide la pide, se ejecuta a máxima
fidelidad — no como concesión.
