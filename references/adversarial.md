# Panel adversarial — cómo pedir opinión sin que te mientan

Si vas a someter un diseño al juicio de varios modelos, el diseño del ejercicio importa más
que la elección de los modelos.

## El fallo por defecto

Preguntar «¿esto parece hecho por IA?» a varios modelos y contar los votos.

No funciona. Al formular la pregunta ya has sembrado la respuesta: el juez busca IA y la
encuentra. Si además los tres son de familias parecidas, comparten el sesgo y **la
unanimidad se lee como certeza cuando sólo es correlación de entrenamiento.**

## Resultado documentado

En una auditoría real con tres jueces de dos familias distintas:

| Fase | Confianza media |
| --- | --- |
| Ronda 1 — veredicto independiente | **89 / 100** |
| Ronda 2 — tras demoler su propio veredicto | **51 / 100** |

Seis de ocho indicios se cayeron. El motivo fue el mismo en todos: **eran predicciones de
«trabajo no revisado», no de «trabajo automático»**. No discriminaban entre las dos
hipótesis, luego no probaban nada sobre autoría.

La confianza sobre una proposición distinta —«un observador lo etiquetaría como IA»— apenas
se movió: 85. Ésa era la pregunta útil desde el principio.

## Protocolo

### Ronda 1 — a ciegas, sin bando asignado

- Misma evidencia para todos: capturas reales renderizadas, hoja de estilos, datos, y el
  documento de negocio si existe. Nunca tu propio resumen del artefacto.
- **No asignes postura.** «Defiende que sí» fabrica razonamiento motivado.
- Exige separar tres capas: sistema visual, copy y datos, arquitectura de producto. Pueden
  dar veredictos opuestos y mezclarlas hace el informe inservible.
- Exige que cada afirmación apunte a archivo y línea, o a un elemento visible. Prohibido «se
  siente genérico» sin referente.
- Pide explícitamente contra-evidencia. Un juez que sólo acusa no está juzgando.

### Verificación — obligatoria, la haces tú

Comprueba cada afirmación concreta contra el repositorio antes de aceptarla. Los modelos
alucinan números de línea y citas. Un informe que las repite sin comprobarlas hereda sus
errores y los presenta con tu firma.

### Ronda 2 — que demuelan su propio veredicto

Pásales esta hipótesis y pídeles que la batan:

> «Esto lo hizo un humano competente, con prisa, usando IA como herramienta de tecleo, y sin
> pasar una sola revisión de contenido. No es *diseñado por IA*. Es *construido rápido y no
> revisado*, que es como se ve el 90% de los MVP humanos de la historia.»

Y exige una salida estructurada:

- **Qué indicios caen** ante la hipótesis rival
- **Qué indicios siguen en pie**, y por qué la explicación humana falla justo ahí
- **Confianza revisada**, y a qué proposición exacta se aplica
- **¿Está bien planteada la pregunta?** Si no, que la reformulen

### Arbitraje — donde discrepen, busca el dato

Los desacuerdos entre jueces son lo más valioso del ejercicio: señalan justo donde la
evidencia es ambigua. Casi siempre son contrastables con un comando. Contrástalos tú en vez
de promediar opiniones.

## Preguntas que sí se pueden responder

| Pregunta | Respondible desde el artefacto |
| --- | --- |
| ¿La generó una IA? | **No.** IA sin revisión y humano sin revisión convergen. |
| ¿Un observador competente la etiquetará como IA? | **Sí.** |
| ¿Ejerció alguien juicio sobre esta salida? | **Sí**, y suele verse en una captura. |
| ¿Está alineada con el negocio que la empresa dice tener? | **Sí**, y es lo más caro de arreglar. |

Trabaja sobre las tres últimas. La primera consume la reunión sin cambiar nada.

## Cómo entregarlo

- **Separa las capas.** Puede que el sistema visual esté bien y el contenido no. Decirlo con
  precisión es lo que hace que el autor te escuche.
- **Nombra lo que está bien**, con el mismo detalle que lo que está mal.
- **Cierra con una prueba única** que un escéptico pueda verificar en diez segundos, y con un
  plan ordenado por retorno.
