# Validación empírica de las reglas

Primera medición de **qué reglas discriminan de verdad** entre diseño generado y diseño de
autoría humana. Hasta ahora las 49 comprobaciones del escáner estaban demostradas como
*existentes*, no como *discriminativas*, y sus pesos eran juicio, no medición.

**Resumen en una línea: de 49 reglas, 4 separan las clases con significación estadística tras
controlar el confundido de tamaño. Seis no disparan ni una vez en 71 proyectos reales. Una
dispara al revés.**

---

## 1 · Método

### Corpus

`corpus.json` — 99 proyectos con procedencia registrada y SHA fijado. Reconstruible con
`node research/fetch-corpus.mjs`. **Medidos: 71** (el resto se perdió por tamaño o por no
contener archivos legibles; ver §5).

| Clase | Medidos | Etiqueta |
| --- | --- | --- |
| `pos` | 26 | Marcador de generador presente: `lovable-tagger` en `package.json`, `v0.dev` o `bolt.new` en el README |
| `neg_stack` | 34 | Autoría humana, **Tailwind**, repositorio creado **antes de 2022-11-30** |
| `neg_classic` | 11 | Autoría humana documentada, equipos conocidos, otro stack |

La etiqueta negativa no depende del criterio de nadie: **nada creado antes del lanzamiento
público de ChatGPT pudo generarse con un LLM**. La fecha del repositorio lo prueba.

La positiva tampoco: `lovable-tagger` es un paquete que sólo existe porque Lovable lo
inyecta en el proyecto que genera.

### Los dos confundidos, y cómo se controlan

**Stack y época.** Casi todo lo generado es reciente y usa Tailwind. Un «detector» que sólo
detecte Tailwind de 2025 no vale nada. Por eso la comparación principal es **pos vs
neg_stack**: ambos Tailwind, separados sólo por la fecha. `neg_classic` se mide aparte y
sirve justamente para exponer qué reglas cambian de comportamiento al cambiar de stack.

**Tamaño de la base de código — el confundido dominante, y no lo esperaba.**

| Clase | Archivos de media | Reglas que disparan de media |
| --- | --- | --- |
| `neg_stack` | 47 | 6,3 |
| `pos` | 123 | 11,7 |
| `neg_classic` | 570 | 12,5 |

Más archivos, más superficie donde algo casa. Sin controlarlo, buena parte de la separación
medida sería sólo diferencia de tamaño.

Se controla recortando ambas clases a la **banda común de 20–200 archivos** (pos=20,
neg=23) y recalculando ahí. Todas las conclusiones de este informe salen de esa banda.

> **Un primer intento de control salió mal y conviene contarlo.** Estratifiqué por tercios de
> tamaño; el estrato «pequeño» quedó con pos=6, y con esa n las conclusiones se invirtieron
> respecto a la banda: `UX2` daba J = −0,30 por tercios y J = +0,46 en banda. Con seis
> proyectos no se concluye nada. Los tercios siguen en `medicion.json` como advertencia.

### Medida de separación

**J de Youden = TPR − FPR**, sobre pos vs neg_stack dentro de la banda.

Para un detector binario, J = sensibilidad + especificidad − 1: literalmente «cuánto mejor
que el azar», acotada en [−1, 1] y simétrica. Se prefiere al *lift* (TPR/FPR) porque el lift
explota cuando el FPR tiende a cero: una regla que dispara en 1 de 20 positivos y 0 de 23
negativos da lift infinito y J = 0,05. Con n de dos dígitas eso importa.

Cada tasa lleva **intervalo de Wilson al 95%**. Una regla sólo se considera separadora si los
intervalos de las dos clases **no se solapan**. Sin ese filtro, cualquier diferencia de
muestra pequeña parece un hallazgo.

Reproducir: `node research/measure.mjs`.

---

## 2 · Resultados

Ordenado por J en banda. `pos`/`neg` son tasas de disparo dentro de la banda.

| ID | Regla | peso | pos | neg | **J banda** | J bruta | ¿CI separa? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UX2 | Pastilla redondeada en todo | 1 | 85% | 39% | **0,46** | 0,34 | **sí** |
| L2 | Fechas y monedas escritas a mano | 2 | 85% | 43% | **0,42** | 0,35 | **sí** |
| D5 | Emojis donde correspondía un icono | 2 | 45% | 4% | **0,41** | 0,51 | **sí** |
| L1 | Plural sin resolver | 3 | 75% | 35% | 0,40 | 0,39 | no |
| UX6 | console.log olvidado | 2 | 55% | 17% | 0,38 | 0,33 | no |
| UX1 | Rejilla de tres tarjetas iguales | 2 | 70% | 35% | 0,35 | 0,39 | no |
| E7 | Restos de andamiaje | 3 | 100% | 65% | **0,35** | 0,35 | **sí** |
| UX7 | Estilos en línea | 1 | 35% | 9% | 0,26 | 0,30 | no |
| UX3 | Duración 300ms por defecto | 1 | 45% | 22% | 0,23 | 0,21 | no |
| UX11 | Tamaño de titular arbitrario | 1 | 35% | 13% | 0,22 | 0,27 | no |
| UX10 | Texto con gradiente | 2 | 35% | 17% | 0,18 | 0,19 | no |
| E6 | Nombres de relleno | 2 | 30% | 13% | 0,17 | 0,27 | no |
| AS1 | `transition: all` | 2 | 25% | 9% | 0,16 | 0,18 | no |
| E5 | Palabras vacías | 2 | 15% | 0% | 0,15 | 0,15 | no |
| **A1** | **Gradiente morado-azul** | **3** | 35% | 22% | **0,13** | 0,18 | no |
| E1 | Abuso del em dash | 2 | 10% | 0% | 0,10 | 0,12 | no |
| UX8 | Defaults de shadcn | 2 | 10% | 0% | 0,10 | 0,08 | no |
| B1 | Familia por defecto (Inter…) | 2 | 10% | 4% | 0,06 | 0,13 | no |
| UX9 | TODO/FIXME | 1 | 10% | 4% | 0,06 | 0,12 | no |
| A2 | Dark mode permanente | 2 | 10% | 4% | 0,06 | 0,09 | no |
| C2 | Franja lateral de color | 2 | 5% | 0% | 0,05 | 0,12 | no |
| E2 | Comillas curvas | 1 | 5% | 0% | 0,05 | 0,05 | no |
| C3 | Radio y padding uniformes | 2 | 5% | 0% | 0,05 | 0,04 | no |
| **E4** | **Copy duplicado** | **3** | 100% | 96% | **0,04** | 0,14 | no |
| **D1** | **Enlaces a bancos de imágenes** | **3** | 20% | 17% | **0,03** | 0,11 | no |
| **K2** | **Contraste bajo 4.5:1** | **3** | 5% | 4% | **0,01** | 0,12 | no |
| K1 | Neutros de croma cero | 2 | 5% | 4% | 0,01 | 0,09 | no |
| S3 | Cromo falso | 2 | 5% | 4% | 0,01 | 0,05 | no |
| **L3** | **Diacríticos sistemáticos** | **3** | 5% | 4% | **0,01** | 0,01 | no |
| T2 | Enlaces con texto vacío | 1 | 5% | 4% | 0,01 | 0,01 | no |
| A4 · **C1** · S1 · S4 | resplandor · **bordes planos** · nav · kicker | 2·**3**·2·1 | 0% | 0% | 0,00 | 0,04 | no |
| **A3 · A5 · AS2 · K3 · S2 · S5** | glassmorphism · neón · hover lift · **botón invisible** · footer · dashboard | 2·2·1·**3**·2·2 | 0% | 0% | 0,00 | 0,00 | no |
| K4 | Familias de tono | 1 | 5% | 9% | −0,04 | 0,02 | no |
| UX12 | Pila de avatares | 1 | 5% | 9% | −0,04 | −0,05 | no |
| **AS9** | **Monocultura de segundo orden** | **3** | 0% | 4% | **−0,04** | 0,01 | no |
| B4 | Etiquetas en mayúsculas | 1 | 0% | 4% | −0,04 | 0,01 | no |
| UX5 | z-index 9999 | 1 | 0% | 4% | −0,04 | −0,02 | no |
| UX4 | Curva de Material | 1 | 0% | 4% | −0,04 | −0,06 | no |
| B2 | Sin pareja tipográfica | 1 | 85% | 91% | −0,06 | −0,08 | no |
| T1 | Botón de icono sin etiqueta | 2 | 15% | 22% | −0,07 | 0,12 | no |
| **F2** | **Sin movimiento intencionado** | **1** | 30% | 61% | **−0,31** | −0,37 | **sí (invertida)** |

---

## 3 · Qué NO discrimina

Esta es la sección que importa. Un informe donde todas las reglas funcionan está mal hecho.

### 3.1 · Una regla dispara al revés

**`F2` — «Sin movimiento intencionado».** 30% en generado, **61% en humano**. Es la única
regla con intervalos separados apuntando en dirección contraria: es un detector de diseño
*humano*.

La causa es diagnosticable: la regla exige cero `@keyframes` y ≤2 `transition` **en archivos
de estilo**. Un proyecto Tailwind humano suele no tener CSS propio en absoluto — el
movimiento vive en clases de utilidad. La regla no mide ausencia de movimiento: mide
**ausencia de CSS**.

### 3.2 · Seis reglas no disparan ni una sola vez

`A3` glassmorphism · `A5` neón · `AS2` levantar tarjeta en hover · `K3` botón invisible ·
`S2` footer canónico · `S5` esqueleto de dashboard.

Cero disparos en 71 proyectos, en ambas clases. **No son reglas refutadas: son reglas no
medibles con este corpus.** `K3` necesita `color` y `background` en la misma regla CSS;
`S2`/`S5` buscan estructura HTML que un árbol de componentes React no expone al regex. La
distinción importa: refutar exige que la regla tenga oportunidad de disparar.

Añado `A4`, `C1`, `S1`, `S4`, que disparan en 1 solo proyecto del corpus completo y en
ninguno dentro de la banda.

### 3.3 · Reglas de peso 3 que no discriminan

Ocho de las trece reglas con el peso máximo no separan las clases:

| Regla | J banda | Lectura |
| --- | --- | --- |
| `E4` copy duplicado | 0,04 | Dispara en **100% de generado y 96% de humano**. Todo el mundo repite cadenas. Mide calidad, no procedencia. |
| `D1` bancos de imágenes | 0,03 | 20% vs 17%. Enlazar Unsplash es igual de común en ambas clases. |
| `K2` contraste | 0,01 | Poca potencia: exige CSS con `color`+`background` juntos. |
| `C1` bordes planos de 1px | 0,00 | La fuente lo llamaba «el indicador aislado más fiable». No dispara en la banda. |
| `K3` botón invisible | 0,00 | No medible (§3.2). |
| `AS9` monocultura de segundo orden | −0,04 | Cero disparos en generado. La estética crema/Fraunces/terracota no aparece en el corpus. |
| `L3` diacríticos | 0,01 | En *esta* medición (corpus EN): no medible. Después se midió en ES: 26% en humanos, peso 1 — §L3 abajo. |
| `A1` gradiente morado-azul | 0,13 | Ver abajo. |

### 3.4 · El indicio más citado de la literatura rinde poco

**`A1`, el gradiente morado-azul, es el tell que las cuatro fuentes originales citan con más
insistencia.** Medido: 35% en generado, 22% en humano, **J = 0,13**, intervalos solapados.

No es ruido puro, pero está lejos de justificar el peso 3 que le habíamos dado por consenso
de artículos de agencia.

### 3.5 · Lo que la evidencia contradice frontalmente

Las fuentes afirman que la IA produce **radios y espaciados uniformes** (925studios:
«identical padding, identical border radius, identical card heights throughout»).

Los datos dicen lo contrario. En la banda de tamaño controlada:

| Rasgo | AUC pos vs neg | Dirección |
| --- | --- | --- |
| Espaciados distintos | 0,767 | Generado tiene **más** variedad |
| Radios distintos | 0,753 | Generado tiene **más** variedad |
| Dominancia del radio principal | 0,277 | Generado es **menos** uniforme |

Un AUC de 0,277 es una separación fuerte en sentido inverso. La hipótesis de la uniformidad
no se sostiene sobre este corpus: los proyectos generados esparcen la escala de Tailwind
(`rounded-sm`, `rounded-lg`, `rounded-2xl`…) mientras los humanos se concentran en menos
valores. `C3`, que codifica la uniformidad, tiene J = 0,05.

---

## 4 · Qué sí discrimina

Cuatro reglas con intervalos separados tras controlar tamaño:

| Regla | pos | neg | J | Por qué es creíble |
| --- | --- | --- | --- | --- |
| **UX2** pastilla en todo | 85% | 39% | 0,46 | `rounded-full` a discreción. Precisión 65%. |
| **L2** fechas y monedas a mano | 85% | 43% | 0,42 | Concatenar `$` con un número en vez de usar `Intl`. Es un atajo, y los atajos se generan. |
| **D5** emojis como iconos | 45% | 4% | 0,41 | **Precisión 93%, lift 18**. El discriminador más limpio del catálogo. |
| **E7** restos de andamiaje | 100% | 65% | 0,35 | Recall perfecto, precisión 54%. Dispara siempre en generado, pero también en dos tercios del humano. |

Y seis más con J ≥ 0,22 que no alcanzan significación con esta n y merecen una segunda
medición con corpus mayor: `L1` (0,40), `UX6` (0,38), `UX1` (0,35), `UX7` (0,26),
`UX3` (0,23), `UX11` (0,22).

---

## 5 · Límites de la muestra

Declarados sin adornos, porque condicionan todo lo anterior.

- **n pequeña.** La banda controlada tiene **pos=20, neg=23**. Con esa muestra sólo se
  detectan efectos grandes. Que una regla no alcance significación **no prueba que no
  discrimine**: prueba que con 43 proyectos no se ve.
- **Pérdidas del corpus.** De 99 entradas del manifiesto se midieron 71: 24 saltadas por
  tamaño del repositorio, 13 sin archivos legibles tras podar, 4 fallos de descarga. Las
  pérdidas no son aleatorias: se pierden los repositorios grandes, que son sobre todo
  `neg_classic`.
- **`neg_classic` con n=11** no sostiene ninguna conclusión propia. Se reporta como contexto.
- **Sesgo de plataforma.** La clase positiva son proyectos generados **y publicados en
  GitHub**, que no son una muestra aleatoria de lo que estas herramientas producen.
- **Un solo idioma.** El corpus de *esta* medición es casi todo inglés; `L3` se midió
  después en un corpus ES aparte (§L3).
- **Autoría humana ≠ buen diseño.** La clase negativa está etiquetada por fecha, no por
  calidad. Contiene proyectos humanos mediocres, y debe ser así.
- **Una sola ejecución.** Sin repetición ni corpus de validación aparte. Los umbrales que se
  ajusten a partir de esta tabla corren riesgo de sobreajuste a estos 43 proyectos.

---

## 6 · Cambios propuestos

Cada uno cita su fila. Aplicados en el PR que acompaña a este informe.

### Subir peso

| Regla | de → a | Fila |
| --- | --- | --- |
| `D5` | 2 → 3 | J 0,41 · precisión 93% · lift 18 · CI separa |
| `L2` | 2 → 3 | J 0,42 · CI separa |
| `UX2` | 1 → 2 | J 0,46, el más alto · CI separa · precisión 65% |

`E7` y `L1` se quedan en 3: ya lo tenían y los datos lo respaldan.

### Bajar peso

| Regla | de → a | Fila |
| --- | --- | --- |
| `E4` | 3 → 1 | J 0,04 · dispara en 100% y 96% |
| `D1` | 3 → 1 | J 0,03 · 20% vs 17% |
| `A1` | 3 → 2 | J 0,13 · intervalos solapados |
| `C1` | 3 → 1 | J 0,00 en banda |
| `K2` | 3 → 2 | J 0,01, y poca potencia |
| `AS9` | 3 → 1 | J −0,04 · cero disparos en generado |
| `B2` | 1 → 0 | J −0,06 · dispara en 85% y 91% |
| `T1` | 2 → 1 | J −0,07 |

`L3` se dejó en peso 3 *en este PR* por no medible en inglés. Tras el corpus ES (§L3)
bajó a peso 1: premisa falsada (26% en humanos pre-ChatGPT).

### Eliminar

| Regla | Motivo |
| --- | --- |
| `F2` | J −0,31 con intervalos separados. Detecta *ausencia de CSS*, no ausencia de movimiento. Es un detector de diseño humano. |

### No tocar, pero marcar

Las seis reglas que nunca disparan (`A3`, `A5`, `AS2`, `K3`, `S2`, `S5`) más `A4`, `S1`,
`S4` se marcan `"validado": "no_medible"` en `data/rules.json`. No se eliminan: eliminar por
falta de oportunidad de disparo sería el mismo error que aceptarlas sin medida.

---

## 7 bis · Segunda ronda

Se volvió a medir tras dos cambios que invalidaban las cifras de la primera pasada.

### Cambio 1 — se separó procedencia de defecto

Había una contradicción de fondo: el marcador decía medir «cuánto se parece a lo generado»,
pero comprobaciones de calidad pura —contraste, nombre accesible, movimiento reducido— le
restaban puntos. Un proyecto humano con mal contraste bajaba en un marcador de procedencia.

Ahora cada regla lleva `tipo`:

| Tipo | Cuántas | Efecto |
| --- | --- | --- |
| `procedencia` | 43 | Forman la puntuación |
| `defecto` | 14 | Se reportan aparte y **no puntúan** |

El criterio: **el propósito clasifica, la evidencia promueve.** Una regla de calidad con
J ≥ 0,20 o intervalos separados cuenta como procedencia, porque demostró llevar señal —así
`UX6` (console.log olvidado, J 0,38) sigue puntuando pese a ser un defecto de código.

**La separación evitó un daño real.** `HM8` —animación sin `prefers-reduced-motion`— mide
J = **−0,16**: dispara en el 10% de lo generado y en el **26% de lo humano**. Los proyectos
generados suelen incluir el bloque porque está en el material del que aprendieron; los
humanos con prisa lo omiten. Como señal de procedencia está invertida; como comprobación de
accesibilidad sigue siendo válida. Clasificada como defecto, no contamina la puntuación.

### Cambio 2 — el sustrato se amplió a clases de utilidad

Varias reglas sólo miraban declaraciones CSS. En un proyecto Tailwind el estilo vive en
clases de utilidad, así que no tenían ocasión de disparar. Al ampliar el sustrato,
**cinco reglas pasaron de no medibles a medibles**, y el resultado se reparte:

| Regla | Antes | Ahora | Lectura |
| --- | --- | --- | --- |
| `A3` glassmorphism | 0% / 0% | **20% / 0%** · J **0,20** | Rescatada: sí discrimina |
| `S1` nav por defecto | 0% / 0% | 20% / 4% · J 0,16 | Rescatada, señal moderada |
| `S5` esqueleto de dashboard | 0% / 0% | 10% / 0% · J 0,10 | Rescatada, señal débil |
| `K3` botón invisible | 0% / 0% | 20% / **26%** · J **−0,06** | Medible, y **no discrimina** |
| `C1` bordes planos | 0% / 0% | 20% / 22% · J −0,02 | Medible, y **no discrimina** |

Es un resultado honesto en las dos direcciones: ampliar el sustrato no fue una forma de
inflar el catálogo, porque dos de las cinco quedaron refutadas en cuanto tuvieron
oportunidad de disparar.

### Las nueve reglas extraídas de hallmark, medidas por primera vez

| Regla | pos | neg | J banda | Veredicto |
| --- | --- | --- | --- | --- |
| `HM4` hover-scale uniforme | 25% | 0% | **0,25** | La mejor del lote. Peso 1 → 2 |
| `HM2` transición sobre layout | 10% | 4% | 0,06 | Débil |
| `HM12`, `HM5`, `HM1`, `HM3` | ≤4% | ≤4% | 0,00 | Sin oportunidad de disparar en este corpus |
| `HM7` más de tres familias | 0% | 4% | −0,04 | Sin señal |
| `HM10` medida de prosa | 0% | 4% | −0,04 | Sin señal |
| `HM8` sin movimiento reducido | 10% | 26% | **−0,16** | **Invertida** — ver arriba |

De nueve reglas importadas, **una lleva señal**. Es la tasa que cabía esperar y es el
argumento para no seguir importando catálogos ajenos sin medirlos.

### Ajustes aplicados en esta ronda

| Regla | de → a | Motivo |
| --- | --- | --- |
| `HM4` | 1 → 2 | J 0,25, medida por primera vez |
| `K3` | 3 → 1 | J −0,06 ya siendo medible |
| `B2` | 0 → 1 | El peso 0 era un parche; como defecto no puntúa igualmente |

### Sesgo del corpus que esto destapa

**El corpus es Tailwind por construcción.** La clase positiva son salidas de lovable, v0 y
bolt, que usan Tailwind por defecto; la negativa se seleccionó *exigiendo* Tailwind para
emparejar el stack. 62 de los 99 proyectos del manifiesto lo llevan.

Eso significa que **las reglas que dependen del sustrato de clases de utilidad se están
midiendo sobre una población que les es favorable**. `A3` con J 0,20 lo es sobre proyectos
Tailwind; sobre una población general con CSS-in-JS, módulos CSS o estilos de componente su
rendimiento es desconocido.

No invalida la medición —el emparejamiento por stack era necesario para controlar el
confundido de época— pero acota a qué población se puede extrapolar: **proyectos web
modernos con Tailwind**, que es donde vive el problema hoy, y no más allá.

## 7 · Lo que esto no responde

Sigue en pie la distinción que abre `SKILL.md`: incluso una regla con J alta mide
**detectabilidad**, no **procedencia**. `D5` con lift 18 dice «esto se parece mucho a lo que
sale de un generador», no «esto lo generó una máquina». El benchmark no resuelve esa
distinción — la cuantifica.

---

# Segunda medición — corpus ampliado

Primera medición: 71 proyectos, banda pos=20 neg=23. **Ésta: 123 proyectos, banda pos=34
neg=32.** El corpus pasó de 99 a 164 entradas declaradas.

`n: pos=50 · neg_stack=62 · neg_classic=11`

## Lo que cambia

**Separan siete reglas, no cuatro.** Tres de ellas por motivos distintos, y los tres importan.

| Regla | J banda | pos | neg | Lectura |
| --- | --- | --- | --- | --- |
| `UX2` pastilla en todo | 0,45 | 82% | 38% | confirmada con más n |
| `L2` fechas y monedas a mano | 0,45 | 85% | 41% | confirmada |
| **`C4` escala dispersa** | **0,39** | 82% | 44% | **el umbral se ajustó sobre el corpus anterior; fuera de esa muestra encoge de 0,55 a 0,39 y sigue separando** |
| **`L1` plural sin resolver** | **0,36** | 71% | 34% | **estaba en el limbo: era falta de n, no falta de señal** |
| **`UX6` console.log olvidado** | **0,34** | 53% | 19% | **igual que L1** |
| `D5` emojis como iconos | 0,26 | 29% | 3% | confirmada |
| **`A3` glassmorphism** | **0,24** | 24% | 0% | **daba cero disparos hasta añadir el sustrato de clases de utilidad** |

### La predicción que se cumplió

`C4` se ajustó en muestra y se marcó «sin validar fuera» precisamente porque su J iba a
encoger. Encogió de **0,552 a 0,386** — y siguió separando. Es la primera vez que este
repositorio hace una predicción cuantitativa sobre sí mismo y la comprueba.

### El sustrato equivocado escondía un discriminador real

`A3` figuraba como «no medible» con cero disparos en 71 proyectos. No era que el glassmorphism
no apareciera: era que lo buscábamos en archivos CSS que en Tailwind no existen. Con el
sustrato corregido dispara en el **24% de lo generado y el 0% de lo humano**, y separa.

Esto obliga a leer con cuidado cualquier «no medible»: puede ser ausencia de señal o ausencia
de oportunidad, y sólo se distinguen arreglando el mecanismo.

### Dos preguntas abiertas que se cierran

`C1` —el «indicador aislado más fiable» según la fuente— ya puede disparar (16% frente a 15%)
y da **J = −0,01**. Con oportunidad real, no discrimina. La duda que dejamos escrita en
`rubric.md` queda resuelta en contra de la fuente.

`K3` igual: dispara en el 24% frente al 18%, **J = 0,02**.

### Una regla pierde la significación

`E7` restos de andamiaje baja a J 0,25 con los intervalos otra vez solapados: dispara en el
**94% de lo generado y el 69% de lo humano**. Sigue siendo útil como señal de calidad, pero
ya no separa. Peso 3 → 2.

### Y otra apunta al revés

`HM8` da **J = −0,17 con intervalos separados**: dispara más en diseño humano. Mismo perfil
que `F2`, que se eliminó por esto. Peso a 1 mientras se diagnostica.

## Lo que esta medición NO resolvió

> Actualizado tras el holdout y la medición de `L3` en español (secciones más abajo).

- **`L3` ya no está «sin evaluar».** Se midió sobre 19 humanos en español: dispara en el
  26%. Premisa falsada; peso 3 → 1. Sigue sin clase positiva, así que no hay J.
- **El conjunto reservado ya existe** (`research/holdout.mjs`). De 21 reglas con J > 0,15
  en ajuste, 8 aguantan la mitad en reserva. La reserva es pequeña (pos=9, neg=7): techo
  honesto, no veredicto regla a regla.
- **`neg_classic` sigue en n=11.** Se pierden los repositorios grandes al descargar.

## Reproducir

```bash
node research/build-corpus.mjs --per 26
node research/fetch-corpus.mjs
node research/measure.mjs
node research/apply-weights.mjs
```

La evidencia de cada comprobación programática se exporta a `data/validacion.json`, que
`checks.mjs` carga en tiempo de ejecución. Ninguna cifra se copia a mano de una medición a un
fichero fuente: así es como se desincronizan.

---

# Conjunto reservado — cuánto sobrevive fuera de donde decidimos

Los pesos del catálogo se ajustaron mirando la tabla completa. Una regla puede parecer buena
porque acertó justo en esos proyectos. `research/holdout.mjs` parte la banda en **70% ajuste
y 30% reserva** con un hash determinista del identificador del repositorio, y recalcula J en
cada mitad. **La reserva no participó en ninguna decisión de peso.**

`ajuste pos=25 neg=25 · reserva pos=9 neg=7`

## El resultado

**De 21 reglas con J > 0,15 en ajuste, sólo 8 conservan al menos la mitad en reserva.**

| Regla | J ajuste | J reserva | Aguanta |
| --- | --- | --- | --- |
| `UX2` pastilla en todo | 0,44 | 0,46 | sí |
| `L2` fechas y monedas a mano | 0,44 | 0,49 | sí |
| **`C4` escala dispersa** | **0,44** | **0,17** | **no** |
| `L1` plural sin resolver | 0,40 | 0,27 | sí |
| `UX6` console.log | 0,32 | 0,41 | sí |
| `UX3` duración 300ms | 0,32 | **−0,38** | no |
| `UX1` rejilla de tres | 0,32 | **−0,16** | no |
| `D5` emojis como iconos | 0,28 | 0,22 | sí |
| `E7` restos de andamiaje | 0,28 | 0,14 | sí |
| **`A3` glassmorphism** | **0,28** | **0,11** | **no** |
| `CS3` tipos silenciados | 0,24 | 0,41 | sí |
| `A1` gradiente morado-azul | 0,20 | **−0,21** | no |

## Cómo hay que leer esto

**No es una refutación de trece reglas.** La reserva tiene **pos=9, neg=7**: con esa muestra
la J de una regla puede moverse medio punto por azar. `UX3` pasando de +0,32 a −0,38 no
significa que detecte diseño humano; significa que con siete negativos no se puede decir nada
de `UX3`.

**Sí es una advertencia sobre nuestra propia confianza.** El patrón agregado —ocho de
veintiuna— indica que las decisiones de peso llevan más optimismo dentro de muestra del que
sugerían los intervalos de Wilson. Los intervalos miden el error de muestreo de una tasa; no
miden que hayamos elegido qué reglas mirar después de ver los datos.

**Dos casos que conviene mirar de frente:**

- **`C4` cae de 0,44 a 0,17.** Sobrevivió a la ampliación del corpus —de 0,552 a 0,386— y no
  sobrevive a la partición. Es la regla que este repositorio derivó de sus propios datos, y
  es justo la que más riesgo de sobreajuste tenía. Mantiene el peso 3 porque la caída puede
  ser ruido con n=16, pero queda marcada.
- **`A3` cae de 0,28 a 0,11.** Fue el hallazgo de P2 —el sustrato equivocado escondía un
  discriminador— y en reserva se queda a la mitad.

Las cuatro que aguantan con margen —`UX2`, `L2`, `L1`, `UX6`— más `D5` y `CS3` son, hoy, lo
único que este repositorio puede defender con evidencia dentro y fuera de la muestra.

## Lo que esto no arregla

La reserva es demasiado pequeña para adjudicar reglas individuales. Para eso hace falta un
corpus mayor, y esa sigue siendo la inversión con más retorno de todo el proyecto. Lo que la
partición sí da desde hoy es un **techo honesto a lo que podemos afirmar**.

Reproducir: `node research/holdout.mjs`

---

# `L3` en español — la regla propia que no sobrevive

`L3` era la única comprobación del catálogo sin medición, y la única inventada aquí. Su
premisa: **el ASCII irregular es hábito humano; el corte limpio por archivo es proceso
automático.**

## Construir el corpus que faltaba

El corpus general no servía: `research/idioma.mjs` encontró **cero proyectos en español entre
120**. No era que no la hubiéramos medido — es que ese corpus no podía.

`research/corpus-es.mjs` añadió 125 candidatos y tras descargar quedaron **19 proyectos
humanos en español**, todos anteriores al corte de 2022-11-30.

**Y cero generados.** El marcador de generador y la interfaz en español no coexisten en
GitHub público: lo que sale de Lovable, v0 y Bolt y llega a un repositorio está en inglés.
Sin clase positiva no hay J, y ese hueco no se cierra buscando más.

## Lo que sí se pudo medir, y lo que dice

Sobre la población que la regla existe para juzgar:

| Clase | Dispara | Tasa | IC95 |
| --- | --- | --- | --- |
| Humano, español, pre-ChatGPT | 5 / 19 | **26%** | 12–49% |

Cinco proyectos escritos por personas **antes de que existiera ChatGPT** presentan
exactamente el patrón que la regla considera prueba de proceso automático: unos archivos con
prosa española y cero acentos, otros plenamente acentuados.

**La premisa está falsada sobre su propia población.** El corte limpio por archivo ocurre
también en código humano, y no poco: uno de cada cuatro.

`L3` baja de peso **3 a 1**.

## La consecuencia que hay que decir en voz alta

Este repositorio nació de una auditoría en la que `L3` se usó como **árbitro**. Tres modelos
discreparon sobre si los diacríticos perdidos delataban máquina; se midió la distribución, se
encontró el corte limpio por archivo y se concluyó que había «un proceso sistemático».

Esa conclusión era más fuerte de lo que la evidencia permitía. El corte limpio distingue
*proceso* de *hábito irregular* —eso sigue en pie— pero **no distingue proceso automático de
proceso humano**: un equipo que escribe los datos en un archivo y la interfaz en otro produce
la misma huella.

La afirmación defendible se queda en: *hubo dos orígenes de texto distintos*. Quién o qué
estaba en cada uno, esta regla no lo dice.

## Qué haría falta

Una clase positiva en español exige generar los artefactos uno mismo con las herramientas, lo
que introduce su propio sesgo —serían nuestros prompts, no una muestra del mundo— o encontrar
una fuente de proyectos generados fuera de GitHub. Ninguna de las dos es una tarde de trabajo.

Reproducir: `node research/corpus-es.mjs && node research/fetch-corpus.mjs && node research/idioma.mjs && node research/l3-espanol.mjs`
