# Arbitraje adversarial: qué deja de votar y por qué

Quinta revisión del catálogo. Veinte comprobaciones dejan de puntuar, cinco
bajan de peso, ninguna se borra. Este documento recoge el razonamiento, no sólo
el resultado — incluidos los argumentos que perdieron y los errores del
proponente, porque la decisión no se entiende sin ellos.

## Cómo se tomó

La propuesta inicial se sometió a dos revisores externos con **papeles opuestos
asignados**: uno debía defender que la poda se quedaba corta, el otro que era
excesiva. Los dos con acceso de sólo lectura al repositorio y con el mandato
explícito de perder el caso si la evidencia no acompañaba.

Ninguno defendió su papel hasta el final. La fiscalía rechazó parte de su propia
petición y la defensa concedió el caso. Eso es señal de que el resultado lo fijó
la medición y no el reparto de papeles.

## La propuesta inicial, y por qué estaba mal planteada

Se propusieron tres bloques:

1. Seis reglas con J negativa que aún puntuaban → reclasificar.
2. Cuatro con peso 2 sin señal → bajar a peso 1.
3. Cinco sin oportunidad de disparar → **no tocar**.

El argumento del bloque 1 era que esas seis «penalizan al diseñador humano».
**Es falso.** Sus J negativas se apoyan en entre uno y cinco disparos sobre 76
proyectos humanos: `A6` es 0 de 39 contra 1 de 76. A esos conteos el intervalo de
Wilson cubre el cero con holgura. No son detectores invertidos — son reglas que
no informan. El desenlace es el mismo, el motivo no, y el motivo es lo que queda
escrito en `motivo_defecto`.

El bloque 2 se quedaba corto: bajar de 2 a 1 es cosmético, siguen votando sobre
evidencia que no existe.

El bloque 3 estaba directamente equivocado, y en la dirección incómoda: **los dos
revisores rechazaron la postura del repositorio**, que hasta ahora era dejar
intactas las reglas sin oportunidad de disparar. El argumento que zanjó el punto:

> «No refutada» no es lo mismo que «sigue puntuando». Una regla que no ha tenido
> ocasión de equivocarse no puede alegar en contra del proyecto escaneado.

La postura anterior —*eliminar por falta de oportunidad sería el mismo error que
aceptarlas sin medida*— sigue siendo correcta **contra el borrado**. No lo era
contra el voto. Las dos cosas se habían confundido.

## El punto en disputa: cuánto bajar el núcleo

Cinco reglas mantienen su separación en la banda completa pero se desploman en
la reserva:

| id | ajuste | reserva |
|---|---|---|
| `D5` | 0,31 | 0,05 |
| `L1` | 0,38 | 0,10 |
| `A3` | 0,29 | 0,10 |
| `UX14` | 0,34 | 0,05 |
| `HM4` | 0,33 | 0,00 |

Un revisor votó bajarlas dos escalones (3→1); el otro, uno solo (3→2). **Se
adoptó un escalón**, por una razón que ninguno de los dos había puesto sobre la
mesa y que salió de mirar la reserva en la otra dirección:

| id | ajuste | reserva |
|---|---|---|
| `B2` | −0,04 | **+0,35** |
| `UX9` | −0,04 | **+0,20** |

La reserva es n=10 positivos / 20 negativos. Si es lo bastante fiable para hundir
a `UX14`, es lo bastante fiable para ascender a `B2` — y ascender a `B2` sería
absurdo, porque 0,35 sobre 10 positivos son tres o cuatro proyectos. **El ruido
se descuenta en las dos direcciones o en ninguna.** Descontarlo sólo donde
conviene es elegir el resultado.

De ahí el criterio: la reserva basta para retirar un **sello de confianza**, no
para retirar la **señal**. Un escalón, no dos.

## El fallo que apareció al verificar

Al comprobar que la reclasificación había surtido efecto, no lo había: el escáner
seguía contando esas reglas como procedencia.

El mapeador de reglas declarativas de `scripts/slop-scan.mjs` copiaba `id`,
`cat`, `title`, `weight`, `applies`, `exempt`, `why`, `fix`, `doctrina`, `source`
y `validado` — **y no `tipo`**. Toda regla del catálogo llegaba a la puntuación
como procedencia dijera lo que dijera su ficha.

Consecuencia: `CS2` y `CS3` llevaban votando desde que se reclasificaron, con su
`motivo_defecto` escrito al lado y sin ningún efecto. Diez reglas declarativas en
esa situación. La distinción `procedencia` / `defecto` estaba documentada, medida
y razonada, y **no estaba conectada** en la mitad declarativa del catálogo.

Es el mismo fallo de clase que ya había aparecido dos veces en este repositorio:
contar líneas en vez de coincidencias, y leer `nucleo.alta` como «las que fallan»
cuando era el catálogo. Una cifra correcta que nunca llega a donde decide.

El arreglo lleva comentario en el sitio, porque el campo se volverá a olvidar.

## Resultado

- **44** comprobaciones puntúan, de 87. Antes de esta revisión votaban 74, y 10
  de ellas no debían.
- 20 identificadores pasan a `defecto` con su cifra citada:
  `A6 B4 E2 UX4 UX12 AS9 · C2 UX8 AS1 E9 · HM5 P1 P2 CS1 C5 S8 · B9 D7 C1 K5`
- `D5` `L1` `A3` → peso 2 · `UX14` `HM4` → peso 1
- Núcleo intacto: `UX2 L2 C4 C6 E7 P4 S1`
- Cero reglas eliminadas. Todas siguen apareciendo en `--plan` y en `slop-fix`
  como consejo de arreglo, que es donde una regla con J 0 puede seguir teniendo
  razón.

## Condición de reversión

Volver a puntuar exige **medición nueva**, no criterio:

1. Banda con n_pos ≥ 30 y n_neg ≥ 50, **al menos 5 disparos en la clase
   positiva**, y J_banda ≥ 0,15 con intervalos separados; **o** una reserva de
   ≥ 20 positivos / ≥ 30 negativos con J_reserva ≥ 0,15.
2. Recuperar peso exige además J_reserva ≥ 50 % de J_ajuste, con J_reserva > 0.
3. Una regla hoy sin oportunidad que llegue a tenerla y mida J ≤ 0 **se queda en
   `defecto`**: pasa de «sin medir» a «refutada», que es peor, no mejor.

## Addendum: la reserva se amplió, y desmintió tres de las cinco demociones

El apartado anterior cerraba diciendo que la reserva de 10/20 era frágil por
construcción y que ampliarla era lo único que cerraba el asunto. Se amplió: el
corpus pasó de 289 a **771 entradas** etiquetadas y de 213 a **644** medibles, y
la reserva de 10/20 a **65 positivos / 45 negativos**.

El resultado contradice al documento que estás leyendo.

| id | reserva 10/20 | reserva 65/45 | veredicto |
|---|---|---|---|
| `D5` | 0,31 → 0,05 | 0,33 → **0,27** | aguanta · se revierte a peso 3 |
| `A3` | 0,29 → 0,10 | 0,32 → **0,30** | aguanta · se revierte a peso 3 |
| `HM4` | 0,33 → 0,00 | 0,22 → **0,20** | aguanta · se revierte a peso 2 |
| `L1` | 0,38 → 0,10 | 0,36 → 0,18 | sigue sin aguantar · se queda en 2 |
| `UX14` | 0,34 → 0,05 | 0,37 → 0,17 | sigue sin aguantar · se queda en 1 |

Tres de los cinco «desplomes» eran la varianza de una reserva de diez positivos.
No describían la regla: describían el tamaño de la muestra con que se la miraba.

**Esto vindica el criterio, no lo refuta.** La decisión de bajar *un* escalón y
no dos se tomó precisamente porque `B2` subía de −0,04 a +0,35 en esa misma
reserva y ascenderla habría sido absurdo. Un escalón se ha podido deshacer; dos
habrían dejado el catálogo sin tres de sus mejores reglas por un artefacto de
muestreo. `B2`, por cierto, se quedó en 0,06 → 0,11: aquel +0,35 también era
ruido, como se sospechaba.

### Lo que además se cae

`C6` se presentó en el porte de impeccable como **la única regla del catálogo que
ganaba fuera de muestra** (0,20 → 0,25). Con la reserva ampliada mide 0,14 → 0,10
y ni siquiera alcanza el umbral de 0,15 para entrar en la comparación. Aquella
afirmación se apoyaba en tres proyectos.

### Lo que se confirma

Las **veinte reclasificaciones aguantan enteras**. Ninguna alcanza el umbral de
reversión (J ≥ 0,15 con intervalos separados) sobre el corpus triplicado. Las que
apuntaban al revés siguen apuntando al revés y ahora con intervalos separados:
`B9` da −0,073 y `C1` −0,063, o sea que son detectores de diseño humano, no de
procedencia.

El núcleo validado pasa de 8 reglas a **14**: `L2` `UX2` `E7` `C4` `UX1` `UX3`
`UX10` `D5` `A3` `UX7` `A1` `HM4` `P4` `UX6`.

### La lección de método

Las cifras de este documento estuvieron un día en vigor y tres de sus cinco
decisiones eran ruido. No por un error de cálculo: por falta de potencia, que
estaba declarada al pie y aun así se usó para decidir. La conclusión no es
«no decidir con poca n» —a veces no hay más— sino **mover lo mínimo que la
evidencia sostiene, y volver cuando haya más**.

Por eso mismo los `motivo_defecto` de las veinte reclasificadas ya no llevan la
cifra escrita a mano: al remedir quedaron obsoletos de golpe (`A6` pasó de −0,013
a +0,034). El motivo no caduca al remedir; el número sí, y para eso está el
bloque `validado`, que se regenera.

## Lo que sigue sin resolver

`neg_classic` sigue en 4 proyectos dentro de la banda: la comparación contra
otros stacks no tiene potencia. Y 85 repositorios descargados se quedaron sin
archivos legibles tras la poda, un sesgo de selección que nadie ha medido.
