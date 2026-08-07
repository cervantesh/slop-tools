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

## Herramientas de las que se copiaron reglas y arquitectura

Encontradas en una investigación multi-agente con verificación adversarial (25 afirmaciones
sometidas a voto, 21 confirmadas, 4 refutadas).

### ux-skill — Laith0003, MIT
<https://github.com/Laith0003/ux-skill>

**El único escáner anti-slop ejecutable y determinista que existe.** 152 reglas regex
declaradas en `data/anti-patterns.json`, ejecutadas por runners finos en Python y Bash, sin
llamadas a un modelo.

Lo que se copió: **la arquitectura**, no las reglas. Separar el catálogo declarativo del
motor es lo que permite añadir una comprobación sin tocar código. De su catálogo se
importaron doce reglas delta (`UX1`–`UX12`), atribuidas por su ID original.

Documenta además puertas numéricas duras con rechazo: por debajo de 65 se rechaza la salida
salvo `--force`, y un bucle que itera hasta 90 o meseta o cinco rondas.

> Cualificación: se verificó la DOCUMENTACIÓN, no el código del motor. «Documenta las puertas
> 65/90/80» es la afirmación correcta, no «las implementa».

### hallmark — Nutlope, MIT
<https://github.com/nutlope/hallmark>

**No es un escáner: es Markdown.** Pero contiene los umbrales numéricos más portables del
corpus: croma mínimo 0.005 en OKLCH para neutros, medida de prosa 45–75ch, máximo 3 familias
tipográficas, escala de 4px, y el test de botón invisible —falla si el texto está dentro de
5% de luminosidad **y** 0.05 de croma del relleno—.

De aquí salen tres cosas del escáner: las puertas cromáticas `K1`–`K3`, las huellas
estructurales `S1`–`S4`, y **el mecanismo de géneros como supresor de falsos positivos**
(`--genre`), que es la respuesta al problema de que una regla legítima para un producto sea
ruido para otro.

> Cualificación: el repositorio se contradice a sí mismo — 3% de acento en un archivo y ~5%
> en otro, 57 gates en el README y 58 en SKILL.md. Copiar umbrales de ahí exige leer las dos
> versiones.

### anti-ai-slop — Vinayak-Shukla-03, MIT
<https://github.com/Vinayak-Shukla-03/anti-ai-slop>

Seis archivos, ningún ejecutable. Aporta `AS1` (`transition: all`) y `AS2` (levantar la
tarjeta en hover), pero sobre todo **`AS9`, la única regla publicada que ataca el
envejecimiento**: prohíbe también el kit alternativo —papel crema, serif display, acento
terracota— porque es hacia donde converge el primer arreglo. La monocultura de segundo orden.

> Es un proyecto DISTINTO del `anti-ui-slop` de skills.rest, que sigue devolviendo 403.
> Confundirlos sería un error.

### stylelint-plugin-rhythmguard — PetriLahdelma, MIT
<https://github.com/PetriLahdelma/stylelint-plugin-rhythmguard>

De aquí sale **el trinquete de baseline**, verificado a nivel de código fuente
(`src/cli/audit.js`, 2309 líneas): una auditoría que sólo falla ante hallazgos nuevos y
tolera la deriva preexistente. Es el mecanismo que hace adoptable un gate sobre código
legado.

### stylelint-declaration-strict-value — AndyOGo
<https://github.com/AndyOGo/stylelint-declaration-strict-value>

Su `expandShorthand` reveló **una fuga real en nuestra comprobación C1**: buscar
`border: 1px solid` se evade escribiendo `border-width` y `border-style` por separado. C1
ahora expande shorthands.

### eslint-plugin-i18next y eslint-plugin-jsx-a11y
<https://github.com/edvardchen/eslint-plugin-i18next> ·
<https://github.com/jsx-eslint/eslint-plugin-jsx-a11y>

Del primero, el patrón de contención de falsos positivos: **puerta gruesa de ámbito**
(`jsx-text-only` por defecto) **más allowlists finas**. Del segundo, la semilla de
`anchor-ambiguous-text` y su función de normalización, que son la comprobación `T2`.

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

## Estado de esa advertencia: parcialmente resuelta

Lo anterior sigue siendo cierto de la **bibliografía**, pero ya no del repositorio. En
`research/RESULTADOS.md` hay una medición propia sobre 71 proyectos etiquetados, con tasas de
disparo por clase, control de dos confundidos e intervalos de confianza.

Es, hasta donde alcanza esta revisión, **la única tasa de discriminación publicada del
campo**. También es pequeña (n = 20 vs 23 en la banda controlada) y contradice a varias de las
fuentes que este mismo documento cataloga — en particular la hipótesis de la uniformidad de
radios y espaciados, que los datos invierten.

## Lo que la investigación NO encontró

Dos preguntas quedaron sin una sola afirmación verificada, y conviene tratarlas como huecos
abiertos, no como vacíos:

1. **Detectores de código o contenido generado por IA** con señales medibles estáticamente.
2. **Métricas cuantitativas de genericidad visual** — entropía de paleta, hashing perceptual
   de capturas, similitud contra un corpus de plantillas. Es el hueco de más valor: convertiría
   la rúbrica binaria en algo medible. Probablemente exige vocabulario académico
   (arXiv/CHI/UIST: *design similarity*, *webpage aesthetics prediction*, *template detection*)
   en vez de vocabulario de herramientas.

Tampoco se verificó nada sobre axe-core, pa11y, alex, write-good, textlint, retext ni Vale.
Toda la vertiente de calidad de prosa sigue sin cubrir por evidencia.

## Nota sobre la calidad de la bibliografía

**Todo el corpus es autodescriptivo.** Cada herramienta es la fuente primaria de su propia
lista de reglas, lo cual es autoritativo para *qué reglas tiene* pero no aporta ninguna
validación de eficacia: no hay ni un benchmark, ni un estudio, ni una tasa de falsos
positivos medida, ni un corpus etiquetado en toda la evidencia recogida. **Las reglas están
demostradas como existentes, no como discriminativas.**

La adopción también es baja donde importa: rhythmguard tenía 578 descargas semanales y seis
meses de vida; stylelint-magic-numbers, cuatro estrellas y un mantenedor; anti-ai-slop, nueve
estrellas. Sólo hallmark y los plugins de ESLint tienen adopción real. **Copiar reglas, no
depender de paquetes** — que es exactamente lo que hace este repositorio.

Casi todo lo publicado sobre esto son artículos de agencias y de blogs de producto, no
investigación. Hay trabajo académico sobre detección de imágenes generadas —análisis
espectral, atención en frecuencia— pero **nada equivalente para diseño de interfaz**. La
rúbrica es, por tanto, consenso de práctica profesional, no ciencia. Trátala como tal:
útil, contrastable, y sujeta a envejecer con las modas.
