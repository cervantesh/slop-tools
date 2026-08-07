# Remediación — qué arreglar y en qué orden

## Por qué ocurre

Un modelo de lenguaje predice el token más probable. Para código, lo más probable suele ser
correcto. Para decisiones de diseño, **lo más probable es la media estadística de millones de
plantillas** — y la media de todas las landing pages es un hero centrado, un botón azul y
tres tarjetas.

No es un fallo del modelo: es su funcionamiento. Sin una dirección comprometida que lo
restrinja, converge al promedio. De ahí se deduce la corrección: **el remedio no es prompt
mejor, es restricción declarada.**

## Las seis reglas correctivas

Adaptadas de vibecodekit, que es la fuente con propuesta constructiva más desarrollada.

### 1. Comprométete con una estética y escríbela

Fija paleta, tipografías, radios, textura y movimiento en un `DESIGN.md` en la raíz, como
fuente única de verdad. Sin ese archivo, cada iteración vuelve al promedio.

> Cuidado con el reverso: un `DESIGN.md` que enumera ocho sistemas de referencia y ninguna
> decisión propia no es una restricción, es un moodboard. Y si está redactado como
> instrucción a un ejecutor —«toda iteración debe leer este archivo antes de cambiar
> pantallas»— es un prompt de sistema, no un contrato de marca.

### 2. Tres tonos como máximo

Un dominante (~60%), un neutro (~30%), un acento afilado (~10%). Amplía con tintes y sombras
del mismo tono, nunca con hues nuevos. Los colores semánticos —error, aviso, éxito— viven
aparte y no cuentan en los tres.

### 3. Pareja tipográfica de verdad

Evita Inter, Roboto y Open Sans como titular. Empareja una display con una de texto de forma
intencionada. Jerarquía por peso. Escala matemática: ×1,25 para aplicaciones, ×1,333 para
editorial. Texto de lectura nunca por debajo de 16px.

### 4. Tarjetas sin borde por defecto

Separa contenido en este orden: primero espacio en blanco; si no basta, un salto de
luminancia del 3–5% en el fondo; si no basta, elevación suave. **El borde gris plano de 1px
es el último recurso, no el primero.**

### 5. Rejilla de 8

Todo el espaciado en múltiplos de 8, con 4 como medio paso. La jerarquía se comunica con
proximidad: espacio interior del componente < espacio entre componentes < espacio entre
secciones. Si esos tres valores son iguales, la página se lee plana.

### 6. Verifica contraste con APCA

Mide con APCA en vez del ratio de WCAG 2. Objetivos: Lc ≥ 75 para texto de lectura, ≥ 45 para
texto grande o en negrita, ≥ 30 para elementos de interfaz no textuales.

## Orden de arreglo

Este orden importa y es contraintuitivo: **el CSS va el último.**

### Primero — contenido e idioma · horas

Es lo que un observador percibe en los primeros diez segundos y lo más barato de todo.

- Revisión por hablante nativo de todo el texto visible, incluidos los datos.
- Copy diferenciado donde hoy se repite. Ninguna descripción es mejor que cinco iguales.
- Eliminar restos de andamiaje: `dummy`, `MVP`, tarjetas de prueba, correos `.demo`, nombres
  de relleno, explicaciones de infraestructura dirigidas al usuario final.
- Corregir concordancias rotas por plantilla: «1 opciones».

### Segundo — imagen · días

- Sustituir enlaces a bancos de imágenes por fotografía propia. Seis fotos reales bastan.
- Si el contrato de diseño le asigna a la fotografía la función de aportar calidez, sin ella
  el producto no es «minimalista»: está incompleto.

### Tercero — alineación con el negocio · semanas, y es decisión de negocio

- Buscar los conceptos del plan en el código. Los que no aparezcan son el trabajo pendiente.
- Reconstruir el flujo principal alrededor de lo que la empresa vende de verdad, no del
  patrón genérico de su categoría.

Esto no es maquillaje y no debería decidirlo quien hace la auditoría.

### Cuarto — deuda del sistema visual · continuo

- Colapsar hojas de estilo sedimentadas por iteración: eliminar bloques marcados como
  superados y temas anteriores enterrados bajo el actual.
- Reducir la deriva: si el contrato promete tres radios y hay diecinueve, el contrato no
  existe.

No cambia lo que se ve hoy. Cambia que la próxima iteración no vuelva a sedimentar encima.

## La comprobación final

Vuelve a hacer la prueba del cambio de nombre. Si el titular sigue funcionando para un
competidor, nada de lo anterior ha resuelto el problema de fondo.
