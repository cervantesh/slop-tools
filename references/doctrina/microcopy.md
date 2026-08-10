# Microcopy — estados, errores y voz

> **Doctrina, no evidencia.** Adaptado de `clarify.md` de
> [impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0, © 2025 Paul Bakaus). No
> está medido y no puntúa. Lee `../caveats.md` antes de aplicarlo a ciegas.

De todo el material portado, éste es el que más gana al traerse al español: sus reglas de
localización importan más aquí que en el original, porque el español se expande un **20–25%**
sobre el inglés y porque `L1`, `L2` y `L3` —nuestras reglas de localización— son de las que
más han rendido al medirse.

Se lee **el camino completo de la interacción**, no cadenas sueltas.

## Jerarquía del mensaje

Cuatro huecos, en este orden, para cualquier estado:

1. **El único dato que hace falta ahora.**
2. **La acción disponible a continuación.**
3. Contexto de apoyo, **sólo si cambia la decisión**.
4. El tono que corresponde al momento.

Y la regla que borra la mitad de la interfaz: **cada idea se dice una vez.** Si el titular ya
explica el estado, la introducción aporta información nueva **o desaparece**.

## Acciones

- La etiqueta describe **lo que va a pasar**, no el gesto que lo dispara. «Guardar cambios»,
  no «Pulsa aquí».
- **El mismo sustantivo y el mismo verbo para el mismo concepto** en todo el producto.
- Destructivas: nombra el objeto y la consecuencia. **Prefiere deshacer a confirmar** cuando
  la recuperación es segura. Si hace falta confirmar, la acción va nombrada en el mensaje **y
  en el botón** — nunca `Sí`, `No`, `Aceptar` ni `Enviar`.

`T2` ya mide la versión detectable de esto: enlaces y botones cuyo texto no dice adónde
llevan.

## Formularios

- **Los *placeholders* son ejemplos, no etiquetas.** Desaparecen justo cuando hacen falta.
- Los requisitos de formato y de elegibilidad van **antes** de enviar, no en el error.
- Explica por qué se pide un dato sólo cuando no es obvio.
- La validación dice **qué hay que corregir y cómo**, sin culpar a quien escribe.

## Errores: la prueba de las tres partes

Un mensaje de error tiene que decir:

1. **Qué falló.**
2. **Por qué**, cuando se sabe y sirve de algo.
3. **Cómo recuperarse**, o qué alternativa queda.

Y dos prohibiciones: no expongas códigos internos como mensaje principal, y **no prometas una
causa o una solución que el sistema no puede conocer**.

Sobre el tono: privacidad, pagos, borrado, pérdida de acceso y trabajo bloqueado se tratan en
serio. **La calidez se agradece; los chistes no.**

## Estados

- **Cargando.** Nombra la operación real y da una expectativa honesta cuando la espera es
  larga. **Nunca inventes progreso.**
- **Vacío.** Distingue **cinco** situaciones que suelen colapsarse en una sola pantalla:
  primer uso · sin resultados · filtros activos · sin permisos · fallo. Sólo la primera
  merece personalidad, y aun así **después** de dejar clara la siguiente acción.
- **Éxito.** Menciona la consecuencia siguiente sólo si cambia lo que hay que hacer. El éxito
  rutinario es breve.
- **Texto de ayuda.** Responde a una pregunta implícita en vez de repetir el control.

## Voz y traducción

> **La voz se mantiene; el tono se adapta al momento.**

- **Escribe mensajes completos y traducibles**, no fragmentos concatenados. Concatenar rompe
  el orden de palabras en cuanto cambia el idioma.
- Mantén variables y números estructurados para que se puedan reordenar. Es exactamente lo
  que miden `L1` (plural sin resolver junto a un contador) y `L2` (fechas y monedas a mano),
  **las dos con J alta y `L2` dentro del núcleo**. Aquí la doctrina y la medición coinciden,
  y conviene decirlo porque no es lo habitual.
- **Deja sitio para la expansión** en vez de abreviar por adelantado.
- `alt` vacío para lo decorativo.
- **No varíes las palabras por efecto literario dentro de una interfaz.** Sinónimos que en
  prosa dan riqueza, en una interfaz dan la impresión de dos cosas distintas.

## Verificación

Comprensión sin conocimiento interno del producto · accionabilidad · exactitud factual ·
lectura a los anchos objetivo y con **zoom al 200%** · pluralización y valores dinámicos ·
nombres accesibles y cambios de estado anunciados.

Prueba de cierre:

> **Tan corto como pueda ser sin quitar significado ni vía de recuperación.**

## Si lo aplicas al pie de la letra

«Cada idea se dice una vez» y «tan corto como pueda ser» empujan hacia interfaces mudas.
El contrapeso está en el punto 3 de la jerarquía: el contexto que **cambia la decisión** no
es redundancia, y quitarlo es un error más caro que repetir una frase.

Y una advertencia de alcance que trae el original: **pregunta antes de cambiar afirmaciones
factuales, significado legal o un término que pueda ser del dominio.** Un microcopy más claro
que dice algo falso es peor que uno confuso que dice la verdad.
