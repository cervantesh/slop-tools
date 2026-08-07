# Plan de trabajo

Todo lo que quedó abierto, en orden de ejecución. Cada punto dice qué lo motiva y de dónde
sale, para que nada dependa de acordarse de una conversación.

Estado: `[ ]` pendiente · `[~]` en curso · `[x]` hecho

---

## P1 · De detección a dirección `[x]`

> **Hecho.** El arreglo de cada regla se imprime, la salida lleva el sello de validación, las
> 20 comprobaciones programáticas tienen `fix` y su fila de `RESULTADOS.md`, y `--plan` emite
> el plan ordenado por peso × confianza ÷ esfuerzo. La prueba del cambio de nombre encabeza
> el plan.

**El problema.** Cada regla tiene `why` y `fix` en `data/rules.json`, y el escáner los carga
en memoria y **nunca los imprime**. Dice «C1 falla, 90 bordes planos» y se calla qué hacer.
La herramienta identifica y no encamina.

**Qué hacer.**

- Imprimir el arreglo de cada regla que falla.
- Mostrar el estado de validación en la salida — `validado J 0,41` frente a `no medible` —
  para que se vea qué hallazgos descansan en medición y cuáles en juicio.
- Modo `--plan`: coge los hallazgos, agrupa por capa, ordena por **peso × confianza de
  validación ÷ esfuerzo**, y emite el plan concreto con ubicaciones.
- Dar `fix` a las 20 comprobaciones programáticas, que no lo tienen.

**Por qué primero.** Los datos ya existen; es fontanería. Y es el hueco que convierte media
herramienta en herramienta.

---

## P2 · Las reglas que no pueden disparar `[x]`

> **Hecho, y el diagnóstico resultó ser uno solo para las diez.** No era que los patrones
> fueran malos: era que **todas las comprobaciones de estilo miraban únicamente archivos
> CSS**, y en un proyecto Tailwind no hay CSS. Medido sobre el corpus: `ant-design` tiene 1
> archivo CSS y 1.985 de JSX.
>
> Se añadió un segundo sustrato —las cadenas de clases de utilidad— y las diez reglas se
> reimplementaron sobre ambos: `A3` (`backdrop-blur`), `A4` (`bg-[radial-gradient`), `A5`
> (`shadow-[0_0_`), `AS2` (`hover:-translate-y-`), `C1` (`border border-gray-200`, la forma
> dominante), `K3` (`bg-slate-900 text-slate-900`), `S1` (`border-b`), `S4` (`grid-cols-2`).
> `S2` y `S5`, que buscaban marcado que un árbol de componentes no expone, pasan a anclarse
> en la forma del contenido: las cuatro etiquetas canónicas juntas, y nombres de componente
> además de nombres de clase.
>
> Ninguna se retiró: todas tenían patrón correcto y sustrato equivocado.
>
> Diez mutaciones nuevas en forma Tailwind. La suite pasa de 38 a **48/48** con la línea base
> intacta.
>
> **Consecuencia que hay que respetar:** sus cifras de `RESULTADOS.md` son anteriores al
> cambio y ya no les corresponden. Quedan marcadas `revalidar`, y la salida las muestra como
> *reimplementada, pendiente de medir* en vez de exhibir un número obsoleto. Entran en P6.

**El problema.** Diez reglas dan cero disparos en 71 proyectos: `A3`, `A5`, `AS2`, `K3`,
`S2`, `S5` nunca, y `A4`, `C1`, `S1`, `S4` sólo fuera de la banda. Están marcadas
`no_medible`, que es honesto pero provisional.

En al menos tres casos el fallo es de **mecanismo, no de corpus** (RESULTADOS §3.2):

- `S2` y `S5` buscan estructura HTML que un árbol de componentes React no expone al regex.
- `K3` exige `color` y `background` en la misma regla CSS, que en Tailwind no ocurre nunca.

**Qué hacer.** Para cada una, decidir con criterio explícito: reimplementar sobre el sustrato
correcto (clases de utilidad además de CSS), o retirar. Retirar por falta de oportunidad de
disparo sería el mismo error que aceptarlas sin medida — pero mantener una regla que no puede
disparar en el stack dominante es peso muerto que infla el denominador.

---

## P3 · La contradicción de `C3` `[x]`

> **Hecho, y resuelto en dos movimientos en vez de uno.**
>
> `C3` no se elimina: se **reclasifica de procedencia a defecto**. La uniformidad de escala
> sigue siendo disciplina de sistema de diseño válida, pero con J = 0,05 no dice nada sobre
> quién lo hizo, y no tenía por qué seguir puntuando procedencia.
>
> En su lugar entra **`C4` · Escala de espaciado dispersa**, que codifica lo que los datos sí
> muestran: en la banda controlada, lo generado usa 14 o más valores distintos de espaciado
> el **90%** de las veces, frente al **35%** de lo humano. **J = 0,552 con intervalos
> separados — la más alta del catálogo**, por encima de `UX2` (0,46).
>
> Es la primera regla derivada de la medición y no de la bibliografía.
>
> **Dos cautelas que van escritas en la propia regla:**
>
> 1. El umbral se ajustó sobre la misma muestra que lo valida. La cifra encogerá fuera de
>    muestra, así que la salida no dice «validado» sino *«J 0,552 en muestra, sin validar
>    fuera»*, y su confianza en el orden del plan es 0,7 y no 1.
> 2. El umbral sólo vale si el escáner cuenta igual que el extractor que midió el corpus. Se
>    movió la extracción a `scripts/lib/escala.mjs` como definición única, y
>    `research/verifica-escala.mjs` comprueba que las cifras siguen coincidiendo —12
>    proyectos, cero discrepancias—. Si alguien toca la extracción, el test lo dice.

**El problema.** Las fuentes afirman que lo generado tiene radios y espaciados **uniformes**.
La medición dice lo contrario, y con separación fuerte: AUC 0,277 en dominancia del radio,
0,753 en variedad de radios. **Lo generado es menos uniforme, no más** — esparce la escala de
Tailwind mientras el humano se concentra.

`C3` codifica la hipótesis refutada y sigue en el catálogo con peso 2.

**Qué hacer.** Invertir la regla, sustituirla por una de dispersión, o retirarla. No dejarla
como está: es la única comprobación del catálogo que mide lo contrario de lo que muestran los
datos, y RESULTADOS §6 no la tocó.

---

## P4 · Consistencia tras los cambios de peso `[x]`

> **Hecho, y la lección no es corregir los números: es hacer que fallen solos.**
>
> `bench/verifica-conteos.mjs` extrae los conteos reales del código, los compara con los que
> afirma la documentación y falla si difieren. Entra en `npm test` junto a `verifica-escala`.
> Es la tercera vez que derivan; ya no depende de que alguien se acuerde.
>
> Corregido lo obsoleto: 32 declarativas, 26 programáticas, 42 filas de rúbrica, descripción
> del paquete. Pero el verificador destapó tres cosas peores que un conteo:
>
> - **Los pesos de `rubric.md` eran los de las fuentes, no los medidos.** Con `A1` en 3 cuando
>   ya era 2 y `C1` en 3 cuando ya era 1, el documento contradecía al catálogo justo en el
>   punto que más importa. Lleva advertencia arriba y puntero a la fuente de verdad.
> - **Los IDs de `rubric.md` no son los del escáner.** Ahí `C3` es «rejilla de tres tarjetas»
>   y en el catálogo es «radio y padding uniformes». El documento afirmaba tener el espacio de
>   identificadores completo en un solo sitio, y era falso.
> - **`F2` seguía listada como viva** tras eliminarse por disparar al revés. Queda tachada con
>   el porqué, porque la fuente sigue afirmándola.
>
> Y `caveats.md` recoge ya, con cifras, las tres cosas en que la bibliografía se equivoca.

**El problema original.** Los conteos de `README.md`, `SKILL.md` y `references/rubric.md`
eran anteriores a la eliminación de `F2` y al recuento de reglas.

---

## P5 · Integrar la métrica de genericidad `[x]`

> **Hecho, y la decisión importante fue no darle peso.**
>
> La métrica responde al hueco que la investigación dejó abierto —«¿existe algo que mida que
> esto se parece al promedio?»— y es la operacionalización directa: distancia al centroide de
> lo generado menos distancia al humano, sobre un vector de once rasgos z-normalizado.
>
> **Medida, da AUC 0,665 con IC95 [0,501 · 0,830].** El límite inferior roza el azar: separa,
> pero por un margen que un solo proyecto podría borrar. El plan exigía «el mismo listón que
> el resto», y con ese listón **no entra como comprobación puntuable**. Se reporta como
> descriptivo, con su intervalo a la vista y la frase de por qué no puntúa.
>
> Comportamiento sensato en los dos extremos: stylo sale en percentil 85, el proyecto limpio
> de referencia en el 9.
>
> **Dos piezas de infraestructura que deja:**
>
> - `data/genericidad-modelo.json` — normalización, centroides y distribución del corpus, para
>   que el escáner no tenga que llevar 71 proyectos encima. Se regenera con
>   `research/exporta-modelo.mjs`.
> - `scripts/lib/rasgos.mjs` — el extractor de los once campos como definición única, con
>   `research/verifica-rasgos.mjs` comprobando que sigue coincidiendo con las cifras del
>   corpus: 10 proyectos × 11 campos, cero discrepancias. Mismo patrón que `escala.mjs`.
>
> **Y queda lista la pieza que P8 necesitaba.** Comparar salidas entre sí no exige separación
> absoluta, así que la métrica sirve para lo que no servía la puntuación: medir si `slop-init`
> genera siempre lo mismo.

`research/genericity.mjs` y `genericidad.json` existen y están medidos, pero **no están
conectados al escáner**. Es la respuesta al hueco que la investigación dejó abierto —
«¿existe una métrica cuantitativa de que esto se parece al promedio?»— y hoy vive aparte.

Decidir si entra como comprobación puntuable, como número informativo junto a la puntuación,
o se queda en investigación. Si entra, exige el mismo listón que el resto: medida de
separación y intervalo.

---

## P6 · Ampliar el corpus `[x]`

> **Hecho.** Corpus de 99 a 164 entradas, 123 proyectos medidos, banda de pos=20/neg=23 a
> **pos=34/neg=32**. Separan **siete** reglas, no cuatro. Detalle en `research/RESULTADOS.md`.
>
> - **`C4` cumplió su predicción**: ajustada en muestra daba 0,552, fuera encoge a **0,386** y
>   sigue separando.
> - **`A3` pasó de «no medible» a validada** (24% frente a 0%) gracias al sustrato de P2. Un
>   «no medible» puede ser falta de oportunidad, no falta de señal.
> - **`L1` y `UX6` salieron del limbo**: era falta de n.
> - **`C1` y `K3` quedan refutadas con oportunidad real** — ya disparan y dan J −0,01 y 0,02.
> - `E7` pierde significación; `HM8` apunta al revés.
> - La evidencia de las programáticas se exporta a `data/validacion.json` y se carga en
>   ejecución: deja de copiarse a mano.
>
> **Residuo declarado:** `L3` sigue sin evaluar (corpus en inglés), no hay conjunto reservado
> formal, y `neg_classic` sigue en n=11.

## P7 · Los verticales sin cubrir `[x]`

> **Hecho.** Ocho reglas nuevas de los dos verticales que la investigación dejó vacíos.
>
> **Prosa** — de *Wikipedia: Signs of AI writing* y `textlint-rule-preset-ai-writing`:
> `P1` paralelismo negativo («no sólo X, sino también Y»), `P2` verbos de relleno en vez de
> ser o tener, `P3` atribución vaga, `P4` emoji como viñeta, `P5` negrita como prefijo de
> viñeta.
>
> **Código generado** — `CS1` comentarios que narran la línea siguiente, `CS2` excepciones
> tragadas, `CS3` tipos silenciados.
>
> Cada una con su mutación: la suite pasa de 49 a **57/57**. Todas entran marcadas *sin medir*
> y se validarán en la próxima medición: no se les da autoridad por venir de una fuente.
>
> **`anti-ui-slop` de skills.rest sigue inaccesible** tras un segundo intento. No hay mirror,
> paquete ni caché. Queda como la única fuente citada que nunca se pudo abrir.

Tres carencias declaradas en RESULTADOS §5, por orden de rendimiento:

1. **Corpus en español.** `L3` —diacríticos sistemáticos— conserva peso 3 y está **sin
   evaluar** porque el corpus es casi todo inglés. Es nuestra regla más específica y no
   sabemos si vale.
2. **Más n para las seis reglas en el limbo.** `L1` (J 0,40), `UX6` (0,38), `UX1` (0,35),
   `UX7` (0,26), `UX3` (0,23), `UX11` (0,22) tienen J alta y no alcanzan significación con
   pos=20. No es que no discriminen: es que con 43 proyectos no se ve.
3. **Corpus de validación aparte.** Los pesos se ajustaron mirando estos 43 proyectos. Sin un
   conjunto reservado, no sabemos cuánto de la mejora es sobreajuste.

Y recuperar las pérdidas: 24 repositorios saltados por tamaño, que son sobre todo
`neg_classic`, lo que sesga la clase negativa hacia proyectos pequeños.

---


---

## P8 · `slop-init`, la mitad generativa `[x]`

> **Hecho.** `node scripts/slop-init.mjs <destino> [--seed N]` genera un punto de partida
> comprometido: paleta de tres tonos en OKLCH con neutros de croma real, pareja tipográfica,
> escala de cinco espaciados, jerarquía de tres radios, presupuesto de movimiento, y el
> `DESIGN.md` que lo declara.
>
> Los repertorios excluyen a la vez las familias por defecto de las herramientas —Inter,
> Poppins, Geist, Roboto, Open Sans— **y el kit de segundo orden que prohíbe `AS9`**: papel
> crema con serif display y acento terracota. La banda 250–300° de OKLCH, donde vive el
> índigo-violeta de `A1`, queda fuera del repertorio de tonos.
>
> **Las dos propiedades se comprueban, no se prometen.** `bench/verifica-init.mjs` está en
> `npm test`:
>
> - **Autoaprobación** — 10 de 10 sistemas generados pasan el propio escáner con 100/100 de
>   procedencia. Una herramienta que genera lo que ella misma marcaría no vale nada.
> - **Divergencia** — seis tonos, seis display, cinco texto distintos en diez invocaciones, y
>   cero pares idénticos. El mínimo esperado se acota a la cardinalidad real de cada eje: a un
>   eje binario no se le puede exigir el 40% de N.
>
> **Y el verificador encontró dos fallos reales del generador antes de que nadie lo usara:**
>
> 1. **Diez invocaciones elegían el mismo tono.** Semillas contiguas en xorshift producen
>    primeros valores correlacionados. Arreglado mezclando la semilla y descartando los
>    primeros pasos. Sin el test, `slop-init` habría sido exactamente la monocultura que
>    existe para evitar.
> 2. **Los sistemas oscuros disparaban `A2`** por declarar `color-scheme: dark` sin
>    alternativa. Ahora emiten su bloque `prefers-color-scheme: light`. No es esquivar la
>    comprobación: es que la comprobación tenía razón.
>
> **Bonus de dogfooding:** auditarse a sí mismo destapó un falso positivo de `B2`. La regla
> contaba familias sólo en `font-family`, así que un sistema basado en tokens —donde siempre
> es `var(--texto)`— parecía no tener ninguna. Ahora también lee las custom properties.

**El problema de fondo.** Las herramientas de las que copiamos son **generadoras** —hallmark
tiene catorce arquetipos de navegación con rotación sin repetición— y nosotros extrajimos
sólo sus puertas. Construimos el termómetro de un campo entero dedicado a encaminar.

**Qué haría.** Generar un punto de partida comprometido: paleta acotada con croma real,
pareja tipográfica que no sea Inter, escala de espaciado, jerarquía de radios, presupuesto de
movimiento, y el `DESIGN.md` que los declara.

Con dos propiedades verificables, no prometidas:

- **Que pase su propio escáner con 100/100**, como el proyecto limpio del banco de pruebas.
- **Que diverja entre invocaciones.** Si genera siempre lo mismo, hemos creado la monocultura
  de tercer orden — exactamente contra lo que avisa `AS9`. Y ahora tenemos con qué medirlo:
  la métrica de genericidad de P5 aplicada a nuestras propias salidas.

Va el último porque depende de P5 para poder demostrar que funciona.

---

## Fuera de plan, anotado

- Cinco archivos de `research/` entraron en un commit mío por `git add -A` sin que yo los
  hubiera leído. Están revisados a posteriori y son coherentes, pero queda dicho.
- La distinción de `SKILL.md` sigue en pie y ningún punto de este plan la resuelve: incluso
  `D5` con lift 18 mide **detectabilidad**, no **procedencia**.
