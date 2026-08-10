# Composición — orden de lectura, agrupación y ritmo

> **Doctrina, no evidencia.** Adaptado de `layout.md` y `bolder.md` de
> [impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0, © 2025 Paul Bakaus). No
> está medido y no puntúa. Lee `../caveats.md` antes de aplicarlo a ciegas.

## La prueba de los ojos entornados

Desenfoca el detalle —entorna los ojos, o aplica un desenfoque de 8px a la captura—:

> **¿Se sigue distinguiendo el elemento primario, el secundario y los grupos principales, y
> en ese orden?**

Si con el detalle borrado todo pesa lo mismo, la jerarquía la estaba haciendo el contenido, no
la composición. Es la prueba más barata que existe y la que más veces basta.

## Seis ejes para diagnosticar

Cuando algo no funciona pero no se sabe qué, se recorre esta lista en orden:

1. **Orden de lectura.** ¿Lo primero que se ve es lo primero que importa?
2. **Agrupación.** ¿Lo relacionado está cerca y lo distinto separado, **o hay contenedores
   compensando una proximidad débil?** Un borde que agrupa lo que el espacio debería haber
   agrupado es un parche.
3. **Ritmo.** ¿Hay variación con sentido, **o un mismo valor de espaciado repetido hasta que
   todo pesa igual?**
4. **Estructura.** ¿Las tarjetas, columnas o secciones repetidas son de verdad equivalentes,
   **o son el default del framework?**
5. **Densidad.** ¿El aire corresponde a la importancia?
6. **Extremos.** Contenido largo, estados vacíos, superposiciones, elementos pegajosos, áreas
   seguras, objetivos táctiles pequeños.

## Reglas de trabajo

- **Proximidad antes que contenedor.** Primero espacio; sólo si no basta, un escalón de
  luminancia; sólo si no basta, elevación. El borde es el último recurso. (Es la misma
  escalera que ya prescribe `remediation.md`.)
- **Escala declarada, no valores sueltos.** Una base de 4 unidades da los escalones
  intermedios útiles que una escala sólo de 8 se salta.
- **La variación no es un objetivo.** La repetición sirve al reconocimiento; se rompe cuando
  cambia el contenido o la prioridad, no para animar la página.
- **El orden de foco y el del DOM coinciden con el visual.** Teclado, táctil y tecnología
  asistiva leen lo mismo que el ojo.
- Los objetivos táctiles siguen siendo usables aunque su marca visible sea pequeña.

## Cuando hay que subir el volumen de una sección

De `bolder.md`, y es criterio poco obvio:

**Una sección plana suele ser una que se está saltando los recursos más fuertes del propio
sistema.** No le faltan efectos: le falta usar lo que la página ya usa —display a tamaño
completo, los dispositivos estructurales, el motivo de firma, la densidad—.

Por eso el reflejo de añadir efectos es **lo contrario** de subir el volumen. Y la señal de
que se ha hecho bien: **la versión más audaz se parece MÁS a la misma marca, no menos.**

Dos reglas que lo sostienen:

- **Comprométete y luego aclara.** Las medias tintas se leen como ruido. Se hace el
  movimiento decisivo entero y se calla todo lo de alrededor. **Si todos los elementos
  subieron de volumen, la sección quedó más plana.**
- **«Todo lo demás se queda» es literal.** No se añaden colores, familias, radios ni sombras
  que la superficie no tuviera ya.

### La prueba del esqueleto

> Quita el texto de la sección y mira la estructura desnuda. ¿El esqueleto sigue diciendo qué
> es esta sección y por qué importa, sólo con jerarquía y con los recursos del sistema? **Si
> sólo funciona cuando vuelven las palabras, la audacia estaba en el cuerpo de letra.**

## Topes que conviene conocer

De `distill.md`, lo poco suyo con filo:

- Una acción primaria. Pocas secundarias. Todo lo demás terciario u oculto.
- Si un componente tiene doce variantes, probablemente tres cubren el 90% de los casos.
- Elige izquierda o centro y quédate ahí.
- **Nunca anides tarjetas.** Para una maquetación básica no hacen falta tarjetas: bastan
  espacio y alineación.

## Si lo aplicas al pie de la letra

Simplificar tiene su propio modo de fallo, y la fuente lo dice mejor que nosotros:
**misterio no es minimalismo.** Quitar hasta que algo deja de estar claro no es haber
simplificado. Y la complejidad del dominio manda: un panel de control clínico que parece una
app de notas no ha ganado nada.

Tampoco «entornar los ojos» decide sola. Una página puede pasar la prueba con una jerarquía
perfectamente legible **y no haber decidido nada**. Para eso está `direccion.md`.
