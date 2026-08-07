# Fuentes

Bibliografía anotada. Consultadas en agosto de 2026.

## Primarias

### vibecodekit — *AI Slop Design: Why AI-Generated UI Looks Generic*
<https://vibecodekit.dev/ai-slop-design>

**La más completa y la única con propuesta constructiva desarrollada.** Aporta tres cosas que
las demás no tienen:

1. Explicación de causa raíz: el modelo predice el token más probable, y en diseño «lo más
   probable» es la media estadística de millones de plantillas.
2. Catálogo de tells por categoría — color, tarjetas, tipografía, layout, dark mode, imagen y
   movimiento.
3. Seis reglas correctivas concretas, recogidas en `remediation.md`.

Es la fuente de los pesos altos de la rúbrica: gradiente morado-azul, borde gris plano de 1px
—que califica como el indicador aislado más fiable— y dark mode por defecto.

### 925studios — *AI Slop Web Design: Complete Guide*
<https://www.925studios.co/blog/ai-slop-web-design-guide>

Buena taxonomía por capas. Aporta sobre todo la observación de **uniformidad**: padding,
radio y altura de tarjeta idénticos en todo, frente a los sistemas de diseño reales que crean
jerarquía con variación intencionada. También la ausencia de micro-interacciones. No propone
sistema de puntuación.

### GrowthGuys — *How to Spot an AI Slop Website in 60 Seconds*
<https://growthguys.tech/blog/genuine-website-vs-ai-slop.html>

La más operativa. **De aquí sale la prueba del cambio de nombre**, que es la comprobación con
mejor relación señal/esfuerzo de toda la rúbrica. Sus criterios de confianza —precios
visibles, teléfono, testimonios enlazados— son de sitio comercial y no transfieren a
producto.

### Mateusz Sikora — *Top 10 Signs a Website Was Built by AI*
<https://sikora.software/blog/ai-website-design>

Aporta los indicios de superficie textual: abuso del em dash, comillas curvas sin tocar desde
el pegado, emojis sustituyendo iconos, nombres genéricos en testimonios, y la simetría rígida
con tarjetas de longitud idéntica.

## Consultadas sin poder extraer

### anti-ui-slop
<https://skills.rest/skill/anti-ui-slop>

Herramienta de análisis estático sobre HTML, CSS, JSX/TSX, Vue, Svelte y Tailwind, con una
distinción interesante entre violaciones objetivas de calidad —contraste bajo, imágenes
rotas, texto diminuto— y tells dependientes de contexto. **Devolvió HTTP 403 al intentar
leerla**, así que sus reglas no están incorporadas a esta rúbrica. Merece una segunda
visita: es lo más parecido a un competidor directo de `slop-scan`.

### Nick Babich — *How To Spot AI-Generated Design* (UX Planet)
<https://uxplanet.org/how-to-spot-ai-generated-design-697aaabe76c8>

Redirige a un muro de registro de Medium. Del extracto accesible: la tesis de que el diseño
generado es **ultra-convencional**, con jerarquía visual y elementos funcionales muy
predecibles.

## Bloque de producto

Fuentes de `producto.md`. Ninguna trata de detección de IA: son disciplinas maduras de
evaluación de producto que cubren exactamente el hueco que dejan las rúbricas de landing.

### QAwerk — *Mobile App Localization Testing: iOS & Android Checklist*
<https://qawerk.com/blog/mobile-app-localization-testing/>

La checklist de LQA más completa de las consultadas. Aporta: resolución de marcadores de
posición y pluralización, formateadores de plataforma para fecha y moneda, expansión de
texto sobre línea base de 375px, escala tipográfica al 200%, independencia entre región e
idioma, y validación en contexto de pantalla frente a hoja de cálculo.

### SimpleLocalize — *Design that speaks every language*
<https://simplelocalize.io/blog/posts/ui-localization-best-practices/>

Complementa con el lado de diseño: sin contenedores de ancho fijo, botones que crecen sin
truncar, texto que no se solapa con iconos, y soporte tipográfico real de los diacríticos.
De aquí sale también la advertencia sobre variantes regionales del español.

### TechVinta — *Marketplace Trust & Safety Playbook: 6 Pillars*
<https://techvinta.com/blog/marketplace-trust-and-safety-playbook>

Los seis pilares —identidad, publicaciones, reseñas, comunicación, pagos y disputas— con
elementos concretos por pilar. Escrito desde infraestructura; en `producto.md` está
reinterpretado como comprobaciones de **lo que la interfaz comunica**, que es lo que
determina si el usuario confía.

### Guías de UX writing y content design, 2026
Consenso recogido de varias fuentes secundarias. Los criterios de microcopy —verbos en los
botones, errores que dicen qué pasó y qué hacer, vacíos que explican qué aparecerá— son
patrimonio común de la disciplina y no de un autor concreto.

## Aportaciones propias, sin fuente externa

Marcadas como tales en la rúbrica:

- **E7 · Restos de andamiaje visibles al usuario.** Tarjetas de prueba, correos `.demo`,
  párrafos explicando la infraestructura de despliegue al usuario final. Aparece
  repetidamente en auditorías reales y ninguna fuente lo recoge. Señal muy fuerte de que la
  salida nunca se revisó.
- **El protocolo adversarial** de `adversarial.md`, con sus cifras medidas.
- **La prueba de distribución de diacríticos** de `caveats.md`: distinguir ASCII irregular
  (hábito humano) de corte limpio por archivo (proceso sistemático).

## Nota sobre la calidad de la bibliografía

Casi todo lo publicado sobre esto son artículos de agencias y de blogs de producto, no
investigación. Hay trabajo académico sobre detección de imágenes generadas —análisis
espectral, atención en frecuencia— pero **nada equivalente para diseño de interfaz**. La
rúbrica es, por tanto, consenso de práctica profesional, no ciencia. Trátala como tal:
útil, contrastable, y sujeta a envejecer con las modas.
