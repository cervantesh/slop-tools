# Revisión humana

Las comprobaciones que no se pueden automatizar. El escáner ya cubrió el resto.

**Parte 1** aplica a cualquier artefacto. **Parte 2** sólo a aplicaciones — sáltala si
auditas una web de marketing.

**Artefacto:**
**Perfil:** landing / producto
**Revisor:**
**Fecha:**
**Puntuación del escáner:** ___ / 100

---

# Parte 1 · General

### 1 · Prueba del cambio de nombre

Sustituye la marca por la de un competidor en el titular principal. ¿Sigue funcionando?

- [ ] Pasa — el titular sólo tiene sentido para esta empresa
- [ ] Falla — funcionaría igual para cualquiera

Titular evaluado:

---

### 2 · Prueba del negocio

Abre el plan de negocio. Escoge sus cinco conceptos centrales y búscalos en el código y en la
interfaz.

| Concepto del negocio | ¿Aparece? | Dónde |
| --- | --- | --- |
| | | |
| | | |
| | | |
| | | |
| | | |

- [ ] Pasa — el producto modela lo que la empresa vende
- [ ] Falla — el producto modela el patrón genérico de la categoría

> Es el hallazgo más caro y ninguna herramienta automática lo detecta.

---

### 3 · Fotografía

- [ ] Hay fotografía propia
- [ ] Sólo banco de imágenes
- [ ] No hay ninguna, y el diseño contaba con ella para aportar calidez

---

### 4 · Ilustración e iconos

- [ ] Las ilustraciones tienen textura y asimetría propias
- [ ] Demasiado lisas, simétricas, con aspecto plástico
- [ ] Icono grande centrado sobre el titular como recurso repetido

---

### 5 · Jerarquía y variación

- [ ] Hay variación intencionada según la importancia de cada elemento
- [ ] Padding, radio y altura idénticos en todo
- [ ] Tarjetas dentro de tarjetas dentro de tarjetas

---

### 6 · Titulares y afirmaciones

- [ ] Concretos, con cifras, ejemplos o plazos
- [ ] Vagos: «tu plataforma todo en uno», «construye el futuro»
- [ ] Gramática impecable y cero personalidad

---

### 7 · Estados interactivos

Pasa el ratón, pulsa, tabula.

- [ ] Hover, foco, activo y deshabilitado están resueltos
- [ ] Hay hovers que no hacen nada
- [ ] Los botones saltan en vez de acelerar
- [ ] Foco de teclado invisible

---

### 8 · La prueba de los diez segundos

Enseña **una sola pantalla** a alguien que no conozca el proyecto y pídele que lea en voz
alta lo que ve. Anota literalmente lo primero que comente.

Pantalla:
Reacción:

---

# Parte 2 · Producto

Sáltala si auditas una landing. Detalle completo en `references/producto.md`.

### 9 · Lengua y variante regional

- [ ] Revisado por hablante nativo **de la variante correcta** del mercado objetivo
- [ ] Las cadenas se validaron en su pantalla, no en una hoja de cálculo
- [ ] Los formularios aceptan diacríticos sin fallar la validación
- [ ] Precios, fechas, teléfonos y copy legal siguen la convención local

Variante objetivo: _______________  ·  Revisor nativo: _______________

> Compartir idioma no es compartir mercado. Un revisor de la variante equivocada no ve el
> problema.

---

### 10 · Expansión y escala

- [ ] Nada se trunca ni se solapa a 375px
- [ ] La interfaz aguanta la escala tipográfica del sistema al 200%
- [ ] Ningún contenedor de texto tiene ancho fijo

---

### 11 · Microcopy

- [ ] Los botones usan verbos concretos, no «Aceptar» ni «Enviar» genérico
- [ ] Los errores dicen **qué pasó y qué hacer**, en ese orden
- [ ] Los vacíos explican qué va a aparecer ahí
- [ ] Las instrucciones están junto a la acción
- [ ] El tono es consistente en todo el producto
- [ ] **No hay jerga de ingeniería en superficie de usuario**

---

### 12 · Los cinco estados fuera del camino feliz

Provoca cada uno y mira qué pasa. Marca sólo los que estén **resueltos**.

| Estado | ¿Resuelto? | Notas |
| --- | --- | --- |
| Cargando | ☐ | |
| Vacío de primera vez — ¿invita? | ☐ | |
| Vacío por filtro — ¿deja corregir? | ☐ | |
| Error — ¿qué pasó, qué hacer, referencia? | ☐ | |
| Sin permiso — ¿distingue rol de dispositivo? | ☐ | |

> Los tres vacíos son problemas distintos. Un único componente genérico de «no hay datos»
> para los tres delata que nadie pensó en ninguno.

---

### 13 · Confianza — sólo si es un marketplace

No se evalúa si el backend lo implementa, sino **si el producto lo comunica**.

- [ ] Se ve **qué** se verifica de los proveedores, y dónde
- [ ] La regla de privacidad aparece en el momento en que importa, no en unos términos
- [ ] Las reseñas indican que la transacción existió
- [ ] Hay una salida clara cuando algo sale mal, no sólo un correo de soporte
- [ ] La política de cancelación se lee **antes** de pagar

> En servicios prestados en el domicilio del cliente, la confianza no es una característica:
> es la condición de existencia del negocio.

---

# Veredicto

**Puntuación automática:** ___ / 100
**Parte 1 — fallan:** ___ / 8
**Parte 2 — fallan:** ___ / 5

**Capa que falla más:** sistema visual / copy y datos / arquitectura de producto

**Lo primero a arreglar:**

**Lo que está bien y hay que decir:**

> Separa las capas, nombra lo que está bien, y cierra con una prueba que un escéptico pueda
> verificar en diez segundos.
