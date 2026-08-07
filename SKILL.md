---
name: slop-tools
description: Detecta si un diseño visual o web parece generado por IA ("AI slop") y explica por qué. Base de conocimiento con 66 comprobaciones de procedencia contrastada —rúbrica general más un bloque específico de producto con localización, microcopy, estados, fidelidad al dominio y confianza— y un escáner estático que audita CSS/JSX/HTML y devuelve un informe puntuado. Úsalo cuando alguien pregunte si un diseño "se ve hecho con IA", "parece plantilla", "parece genérico", "AI slop", "looks AI-generated", antes de enseñar un producto a un cliente, o como control de calidad previo a un release.
---

# slop-tools

Herramienta para responder con evidencia a una pregunta que normalmente se responde con
opiniones: **¿esto parece hecho por IA?**

## La distinción que ordena todo el análisis

No confundas dos preguntas que parecen la misma:

| Pregunta | ¿Respondible? |
| --- | --- |
| ¿La generó una IA? | **No** desde el artefacto. IA sin revisión y humano sin revisión convergen en la misma superficie. |
| ¿Un observador la etiquetará como IA? | **Sí**, y es lo único que importa comercialmente. |
| ¿Ejerció alguien juicio sobre esta salida? | **Sí**, y suele ser demostrable en una captura. |

Trabaja siempre sobre la segunda y la tercera. La primera es indecidible y discutirla
consume la reunión entera sin cambiar nada.

## Procedimiento

### 1. La prueba del cambio de nombre — 10 segundos, hazla primero

Sustituye el nombre de la marca por el de un competidor en el titular principal. Si el texto
sigue leyéndose perfecto, el contenido es genérico. Es la comprobación con mejor relación
señal/esfuerzo de toda la rúbrica y no requiere criterio de diseño.

```bash
node scripts/slop-scan.mjs <ruta> --brand "<nombre de marca>"
```

### 2. Escaneo automático

Ejecuta las comprobaciones verificables por código:

```bash
node scripts/slop-scan.mjs <ruta>                                    # informe
node scripts/slop-scan.mjs <ruta> --json                             # para CI
node scripts/slop-scan.mjs <ruta> --min-score 70                     # umbral duro
node scripts/slop-scan.mjs <ruta> --genre modern-minimal             # exenta por estética
node scripts/slop-scan.mjs <ruta> --brand-colors "#5E6AD2"           # exenta la marca
node scripts/slop-scan.mjs <ruta> --plan                             # que hacer y en que orden
```

**Para entregar un veredicto usa `--plan`, no la puntuación.** Ordena por peso × confianza de
validación ÷ esfuerzo, y cada hallazgo lleva su sello: `validado J 0,41` descansa en medición
sobre corpus etiquetado; `no medible` es una regla que no tuvo ocasión de disparar. Decirlo
en la entrega es la diferencia entre un peritaje y una lista de opiniones.

El escáner **no puntúa gusto**. Sólo cuenta patrones nombrados por las fuentes: 28 reglas
declarativas en `data/rules.json` más 21 comprobaciones programáticas que exigen ratios,
distribuciones, resolución de tokens de color o análisis estructural.

**Sobre código existente, usa el trinquete en vez del umbral.** Un gate que falla desde el
primer día se desactiva el segundo:

```bash
node scripts/slop-scan.mjs <ruta> --write-baseline
node scripts/slop-scan.mjs <ruta> --since-baseline --fail-on-new-drift
```

### 3. Revisión humana

Lo que no es automatizable está en `templates/revision-humana.md`. Son nueve
comprobaciones y caben en una página.

### 4. Si es una app, usa el bloque de producto

`references/producto.md`. Las rúbricas publicadas miran webs de marketing y dejan un hueco:
una aplicación no se delata por el hero, se delata por el idioma, el microcopy, los estados
que no son el camino feliz, y por no modelar el negocio que dice servir.

### 5. Aplica las salvedades antes de dar un veredicto

**Léelas siempre**: `references/caveats.md`. Las rúbricas publicadas están escritas sobre
*landing pages de marketing*, no sobre producto. Varias comprobaciones no transfieren a una
app, y aplicarlas a ciegas produce falsos positivos que destruyen tu credibilidad ante el
equipo de diseño.

## Cómo entregar el veredicto

Tres reglas, aprendidas de hacerlo mal:

1. **Separa las capas.** Sistema visual, copy y datos, y arquitectura de producto pueden dar
   veredictos opuestos. Un informe que las mezcla no es accionable.
2. **Incluye la contra-evidencia.** Busca activamente lo que está bien y dilo. Un informe que
   sólo acusa no se lee como peritaje: se lee como ataque, y el autor deja de escuchar.
3. **Ancla cada afirmación.** Archivo y línea, o elemento visible en una captura. Prohibido
   "se siente genérico" sin referente.

## Advertencia sobre paneles de modelos

Si vas a pedir opinión a varios modelos, **no te quedes en la primera ronda**. Al preguntar
"¿parece IA?" el modelo encuentra IA. En una prueba documentada, tres jueces coincidieron con
confianza media de 89/100; al obligarlos a demoler su propio veredicto contra la hipótesis
rival —*"humano con prisa y sin revisar"*— la confianza cayó a 51/100 y seis de ocho indicios
se descartaron por no discriminar entre ambas hipótesis.

La hipótesis rival que debes hacerles batir siempre está en `references/adversarial.md`.

## Archivos

| Ruta | Contenido |
| --- | --- |
| `references/rubric.md` | Rúbrica general: 39 comprobaciones con fuente, peso y aplicabilidad |
| `references/producto.md` | **Para apps.** Localización, microcopy, estados, fidelidad al dominio y confianza |
| `references/caveats.md` | Cuándo cada comprobación NO aplica |
| `references/remediation.md` | Las 6 reglas correctivas y el orden de arreglo |
| `references/adversarial.md` | Cómo montar un panel que no se engañe a sí mismo |
| `references/sources.md` | Bibliografía anotada con lo que aporta cada fuente |
| `data/rules.json` | Catálogo declarativo. Añadir una regla no exige tocar código |
| `scripts/slop-scan.mjs` | CLI y orquestación |
| `scripts/lib/` | Comprobaciones programáticas, color OKLCH, estructura y trinquete |
| `templates/revision-humana.md` | Las comprobaciones que exigen ojo humano |
