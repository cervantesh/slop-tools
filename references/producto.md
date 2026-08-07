# Criterios de producto — lo que sí transfiere a una app

La rúbrica principal (`rubric.md`) viene de fuentes escritas sobre landing pages de
marketing. Este documento cubre el hueco: **criterios que sí aplican a una aplicación
operativa**, tomados de disciplinas maduras que llevan décadas evaluando producto y que
nadie ha conectado con la detección de diseño genérico.

La lógica es ésta: una app no se delata por el hero ni por el grid de tres tarjetas. Se
delata por el idioma, por el microcopy, por los estados que no son el camino feliz, y por no
modelar el negocio que dice servir.

Cada bloque indica **Auto** si `slop-scan.mjs` lo comprueba.

---

## L · Localización y lengua

La disciplina se llama LQA (*Localization Quality Assurance*) y tiene checklists maduras.
Es el bloque con más señal para cualquier producto que no esté en inglés.

| # | Comprobación | Modo |
| --- | --- | --- |
| L1 | Los marcadores de posición resuelven y **pluralizan**: `{count} opciones` nunca dice «1 opción» | **Auto** |
| L2 | Fechas, monedas y números salen de formateadores de plataforma, no de concatenación | **Auto** |
| L3 | Distribución de diacríticos entre archivos (peso 1: la premisa de autoría no aguanta) | **Auto** |
| L4 | Las cadenas se validaron **en su contexto de pantalla**, no en una hoja de cálculo | Humano |
| L5 | Revisión por hablante nativo **de la variante regional correcta** antes de publicar | Humano |
| L6 | Los formularios aceptan diacríticos sin fallar la validación | Humano |
| L7 | Expansión de texto: nada se trunca ni se solapa con la línea base de 375px | Humano |
| L8 | Escala tipográfica del sistema al 200% sin romper la interfaz | Humano |
| L9 | Región independiente del idioma: formato de 24h, sistema métrico, orden de clasificación | Humano |

### Por qué L5 importa más de lo que parece

El español de República Dominicana no es el de España ni el de México. Precios, formatos de
fecha, copy legal, horarios de soporte, métodos de pago y ejemplos **difieren aunque el
idioma sea el mismo**. Un hablante nativo de la variante equivocada no detecta el problema.

### Sobre L3

Es la única comprobación de este documento sin fuente externa, y la única inventada aquí.
Un texto sin acentos no prueba nada por sí solo: teclados sin distribución local y la
costumbre de escribir datos en ASCII son endémicos.

La hipótesis original era más fuerte: **distribución limpia por archivo = proceso
automático**. Medida sobre 19 proyectos humanos en español anteriores a ChatGPT, dispara en
el **26%** (IC95 12–49). Uno de cada cuatro equipos humanos deja exactamente esa huella —
datos en un archivo, interfaz en otro—.

Lo defendible se queda en: *hubo dos orígenes de texto distintos*. No dice quién o qué
estaba en cada uno. Peso 1. Detalle en `research/RESULTADOS.md` §L3.

---

## M · Microcopy y contenido

Del consenso de content design. Todos son humanos: exigen leer.

| # | Comprobación |
| --- | --- |
| M1 | Los botones usan verbos concretos: Guardar, Enviar, Continuar, Pagar — no «Aceptar» ni «Enviar» genérico |
| M2 | Los errores dicen **qué pasó y qué hacer**, en ese orden |
| M3 | Los estados vacíos explican qué va a aparecer ahí, no sólo «No hay nada» |
| M4 | Las instrucciones están junto a la acción, no escondidas en ayuda |
| M5 | El tono es consistente en todo el producto |
| M6 | No hay jerga de ingeniería en superficie de usuario |

**M6** es donde más productos se caen. Restos como una explicación del proveedor de
infraestructura, un aviso de que el login es simulado o una tarjeta de prueba visible son
señal inequívoca de que la salida nunca se revisó. `slop-scan` los detecta parcialmente en la
comprobación E7.

---

## E · Estados que no son el camino feliz

Un producto se delata en cuanto sale del recorrido de demo. Cinco estados por pantalla:

| # | Estado | Qué debe resolver |
| --- | --- | --- |
| E-a | Cargando | Esqueleto con la forma del contenido. El spinner sólo si la forma es impredecible |
| E-b | Vacío de primera vez | Invita: lleva acción primaria hacia el camino principal |
| E-c | Vacío por filtro | Deja corregir: repite qué filtros produjeron el vacío y ofrece deshacer el más restrictivo |
| E-d | Error | Qué pasó, qué hacer, una sola salida, y referencia para soporte |
| E-e | Sin permiso | Distingue permiso de aplicación (rol, sesión) de permiso de dispositivo (ubicación, avisos) |

Los tres vacíos son **problemas distintos** y tratarlos igual es el error más común. Un
producto con un único componente genérico de «no hay datos» para los tres casos está
señalando que nadie pensó en ninguno.

---

## D · Fidelidad al dominio

Sin fuente externa. Es la comprobación con más valor de todo el repositorio y no existe
herramienta que la haga.

**La prueba de los conceptos**: abre el plan de negocio, extrae sus cinco conceptos
centrales, y búscalos en el código.

```bash
rg -i "concepto1|concepto2|concepto3" src/
```

Si la estrategia dice una cosa y el término no aparece ni una vez en el producto, lo que se
construyó es el patrón genérico de la categoría, no el negocio.

Señales de que se importó una plantilla mental ajena:

| Señal | Qué delata |
| --- | --- |
| Seguimiento en mapa y ETA en minutos para un servicio **agendado** | Se copió el patrón de reparto a demanda |
| Selector «individual / pareja» en un producto de **evento de grupo** | No se modeló la unidad de compra real |
| Categorías equiprobables cuando la estrategia tiene un **ancla** declarada | El catálogo no refleja la prioridad comercial |
| Carrito y checkout genéricos donde el negocio exige **anticipo y fecha** | Plantilla de comercio electrónico |

Ninguna de estas es prueba de generación automática. Todas son prueba de que **nadie
contrastó el producto con la estrategia**, que suele salir más caro.

---

## T · Confianza, para marketplaces de servicios

Los seis pilares del marco de *trust & safety*. Aplican a cualquier producto que ponga en
contacto a dos partes, y con más razón si el servicio ocurre en el domicilio de alguien.

| Pilar | Pregunta | Qué debe existir en el producto |
| --- | --- | --- |
| **Identidad** | ¿Es quien dice ser? | Verificación por niveles: correo y teléfono al registro, método de pago en la primera transacción, documento oficial sólo cuando suben las apuestas |
| **Publicaciones** | ¿Lo que se ofrece es real? | Filtros previos automáticos, cola de revisión humana con puntuación de riesgo, y reporte de la comunidad. Los perfiles nuevos siempre pasan por cola humana |
| **Reseñas** | ¿Es fiable la reputación? | Sólo tras transacción verificada. Revelado ciego por ambas partes. Ponderación por antigüedad. Reputación también del que reseña |
| **Comunicación** | ¿Está la conversación protegida? | Datos de contacto ocultos antes de la transacción; se muestran nombre y zona, y se desenmascaran al confirmarse el pago |
| **Pagos** | ¿El dinero es real? | Reglas de velocidad, cola manual para primeras transacciones de importe alto, política de reembolso explícita |
| **Disputas** | ¿Qué pasa si algo sale mal? | Formulario estructurado por categoría en vez de un correo, plazo visible de respuesta, decisiones ancladas en evidencia |

### La comprobación de diseño, no de infraestructura

Lo relevante aquí **no es si el backend lo implementa**, sino si el producto lo **comunica**.
Un marketplace que verifica identidad y no lo enseña no obtiene confianza; sólo obtiene
coste.

Comprueba en la interfaz:

- [ ] ¿Se ve **qué** se verifica de los profesionales, y dónde?
- [ ] ¿Está visible la regla de privacidad en el momento en que importa, o escondida en unos términos?
- [ ] ¿Las reseñas indican que la transacción existió?
- [ ] ¿Hay una salida clara cuando algo va mal, o sólo un correo de soporte?
- [ ] ¿La política de cancelación se lee **antes** de pagar?

En servicios prestados en el domicilio del cliente, la confianza no es una característica:
es la condición de existencia del negocio. Un producto que no la diseña explícitamente está
incompleto por mucho que la interfaz esté pulida.

---

## Cómo combinarlo con la rúbrica principal

```bash
node scripts/slop-scan.mjs ./src --profile producto --brand "TuMarca"
```

El perfil `producto` ya excluye las comprobaciones de landing y activa el bloque L y T1.
El resto de este documento es revisión humana, y su sitio es
`templates/revision-humana.md`.

## Fuentes de este bloque

- **LQA** — QAwerk, *Mobile App Localization Testing: iOS & Android Checklist*; SimpleLocalize,
  *Design that speaks every language*.
- **Microcopy** — consenso de content design; recogido en varias guías de UX writing de 2026.
- **Confianza** — TechVinta, *Marketplace Trust & Safety Playbook: 6 Pillars*.
- **Estados** y **Fidelidad al dominio** — aportación propia, sin fuente externa equivalente.

Enlaces completos en `sources.md`.
