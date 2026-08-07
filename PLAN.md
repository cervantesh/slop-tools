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

## P3 · La contradicción de `C3` `[ ]`

**El problema.** Las fuentes afirman que lo generado tiene radios y espaciados **uniformes**.
La medición dice lo contrario, y con separación fuerte: AUC 0,277 en dominancia del radio,
0,753 en variedad de radios. **Lo generado es menos uniforme, no más** — esparce la escala de
Tailwind mientras el humano se concentra.

`C3` codifica la hipótesis refutada y sigue en el catálogo con peso 2.

**Qué hacer.** Invertir la regla, sustituirla por una de dispersión, o retirarla. No dejarla
como está: es la única comprobación del catálogo que mide lo contrario de lo que muestran los
datos, y RESULTADOS §6 no la tocó.

---

## P4 · Consistencia tras los cambios de peso `[ ]`

Los conteos de `README.md`, `SKILL.md` y `references/rubric.md` son anteriores a la
eliminación de `F2` y al recuento de reglas. Hoy son 48 comprobaciones, no 49. Ya pasó una
vez que un conteo mal quedó propagado por tres archivos.

Añadir además a `caveats.md` el hallazgo de §3.5: la bibliografía se equivoca en la
uniformidad, y conviene que quede escrito donde se leen las salvedades.

---

## P5 · Integrar la métrica de genericidad `[ ]`

`research/genericity.mjs` y `genericidad.json` existen y están medidos, pero **no están
conectados al escáner**. Es la respuesta al hueco que la investigación dejó abierto —
«¿existe una métrica cuantitativa de que esto se parece al promedio?»— y hoy vive aparte.

Decidir si entra como comprobación puntuable, como número informativo junto a la puntuación,
o se queda en investigación. Si entra, exige el mismo listón que el resto: medida de
separación y intervalo.

---

## P6 · Ampliar el corpus `[ ]`

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

## P7 · Los verticales sin cubrir `[ ]`

De la investigación quedaron dos huecos con cero afirmaciones verificadas:

- **Calidad de prosa** — alex, write-good, textlint, retext, Vale. Es donde vive la mitad del
  slop textual que ya intentamos medir, y no se verificó ni una regla.
- **Detectores de código generado** — qué señales usan y cuáles son estáticas.

Y una fuente sigue sin abrir: `anti-ui-slop` de skills.rest, HTTP 403. Es lo más parecido a
un competidor directo.

---

## P8 · `slop-init`, la mitad generativa `[ ]`

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
