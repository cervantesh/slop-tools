# slop-tools

Base de conocimiento y auditor estático para responder con evidencia a una pregunta que
normalmente se responde con opiniones: **¿esto parece hecho por IA?**

Es una skill de Claude Code y, a la vez, una herramienta de línea de comandos que funciona
sola.

## Por qué existe

«Se ve hecho con IA» es una acusación difícil de discutir: quien la hace rara vez sabe
señalar qué se lo dice, y quien la recibe no puede refutar una impresión. La discusión se
queda en gustos y no cambia nada del producto.

Este repositorio convierte esa impresión en comprobaciones contrastables, con la procedencia
de cada una y —tan importante— **la salvedad de cuándo no aplican**.

| | Cuántas | Dónde |
| --- | --- | --- |
| Reglas declarativas | 28 | `data/rules.json` |
| Comprobaciones programáticas | 21 | `scripts/lib/` |
| **Automatizadas** | **49** | |
| Criterios de revisión humana | 66 | `references/rubric.md` + `references/producto.md` |

Las programáticas son las que no caben en un patrón: ratios de densidad, distribuciones entre
archivos, resolución de tokens de color y huellas estructurales.

## Uso rápido

```bash
node scripts/slop-scan.mjs ./src --brand "TuMarca" --profile producto
```

```
  PUNTUACIÓN  32/100 — Se identifica en diez segundos
  12 de 20 comprobaciones automáticas fallan

  ── Prueba del cambio de nombre (marca: "TuMarca") ──
  ✗ 16 titular(es) que funcionarían para un competidor
      components/ClientView.jsx:236  "Elige tu experiencia"
  ...
```

Opciones:

| Opción | Efecto |
| --- | --- |
| `--brand "Nombre"` | Activa la prueba del cambio de nombre |
| `--brand-colors "#hex,#hex"` | Exenta los colores legítimos de tu marca |
| `--profile landing\|producto\|ambos` | Filtra las comprobaciones que no aplican |
| `--genre editorial\|atmospheric\|modern-minimal\|playful` | Exenta reglas por decisión estética declarada |
| `--json` | Salida estructurada para CI |
| `--min-score N` | Sale con código 1 si baja del umbral |
| `--write-baseline` | Congela los hallazgos actuales como tolerados |
| `--since-baseline --fail-on-new-drift` | Falla **sólo** ante deriva nueva |
| `--log` | Guarda la macroestructura y avisa si el build repite la anterior |
| `--rules <ruta>` | Catálogo de reglas alternativo |

Sin dependencias. Sólo Node 18 o superior.

### El trinquete, que es lo que hace esto adoptable

Sobre una base de código existente, un gate que falla desde el primer día se desactiva el
segundo. El trinquete resuelve eso:

```bash
node scripts/slop-scan.mjs ./src --write-baseline          # una vez
node scripts/slop-scan.mjs ./src --since-baseline --fail-on-new-drift   # en CI
```

Tolera lo que ya había y falla sólo ante lo que se introduzca a partir de ahora. La identidad
de cada hallazgo excluye el número de línea, así que mover código no lo convierte en nuevo.

## Qué hay dentro

| Ruta | Contenido |
| --- | --- |
| `SKILL.md` | Punto de entrada como skill: procedimiento y cómo entregar el veredicto |
| `references/rubric.md` | Rúbrica general: 39 comprobaciones con fuente, peso y aplicabilidad |
| `references/producto.md` | Criterios que sí transfieren a una app: localización, microcopy, estados, dominio y confianza |
| `references/caveats.md` | **Léelo antes de dar un veredicto.** Cuándo la rúbrica se equivoca |
| `references/remediation.md` | Las 6 reglas correctivas y el orden de arreglo |
| `references/adversarial.md` | Cómo montar un panel de modelos que no se engañe a sí mismo |
| `references/sources.md` | Bibliografía anotada |
| `data/rules.json` | Catálogo declarativo: 28 reglas con patrón, umbral, porqué y arreglo |
| `scripts/slop-scan.mjs` | CLI y orquestación |
| `scripts/lib/checks.mjs` | Las 21 comprobaciones que exigen ratios o distribuciones |
| `scripts/lib/color.mjs` | OKLCH, resolución de tokens y puertas cromáticas |
| `scripts/lib/structure.mjs` | Huellas estructurales: nav, footer, cromo falso |
| `scripts/lib/baseline.mjs` | Trinquete y registro entre ejecuciones |
| `templates/revision-humana.md` | Las comprobaciones que exigen mirar, en dos partes: general y producto |
| `.github/workflows/slop-scan.yml` | Ejemplo de gate en integración continua |

## Las tres ideas que lo ordenan todo

**1 · Separa procedencia de detectabilidad.** «¿La generó una IA?» no es respondible desde el
artefacto: IA sin revisión y humano sin revisión convergen en la misma superficie. «¿Un
observador la etiquetará como IA?» sí lo es, y es lo único que importa comercialmente.

**2 · La mayoría de los indicios no discriminan.** Antes de anotar uno, pregúntate si un
humano con prisa produciría lo mismo. Si la respuesta es sí, no prueba autoría. Puede seguir
probando falta de calidad, que suele ser la conversación útil.

**3 · Lo más caro no lo ve ninguna rúbrica.** Que el producto no modele el negocio que la
empresa dice tener. Se detecta buscando los conceptos del plan en el código, y es una
búsqueda de treinta segundos.

## ¿Las reglas detectan de verdad?

Es la pregunta que ninguna herramienta del campo responde. Todo el corpus del que salen estas
reglas es autodescriptivo: cada proyecto publica su lista y ninguno publica una tasa de
acierto. Una regla así está demostrada como **existente**, no como **discriminativa**.

```bash
npm run bench
```

La suite parte de un proyecto limpio de referencia, le inyecta 38 patrones de slop conocidos
—uno por mecanismo— y comprueba que la regla objetivo dispara.

```
  LINEA BASE (proyecto limpio)   puntuacion 100/100
  Reglas que disparan sin slop:  ninguna

  RECALL  38/38 mutaciones detectadas (100%)
  Diafonia media: 0.1 reglas colaterales por mutacion
```

Mide tres cosas:

- **Línea base** — qué dispara sobre diseño limpio. Debe ser cero; si no, son falsos positivos.
- **Recall** — si el patrón está presente, ¿lo caza la regla?
- **Diafonía** — cuántas *otras* reglas se activan de rebote. Alta significa reglas que se
  solapan y por tanto puntúan dos veces lo mismo.

### Lo que encontró en su primera ejecución

Nueve defectos reales del escáner, incluidos dos de fondo:

- **Se contaban líneas, no coincidencias.** Cinco emojis en una línea contaban como uno, y
  cualquier umbral de densidad se evadía agrupando selectores o minificando el CSS. Llevaba
  ahí desde la primera versión.
- **La regla de plural disparaba sobre su propio arreglo.** La implementación correcta
  —un ternario que devuelve `${n} plazas` en la rama del plural— contiene literalmente el
  patrón que la regla busca.

Ninguno de los dos se veía leyendo el código. Aparecieron al medir.

### Y el corpus etiquetado: qué reglas discriminan de verdad

```bash
node research/build-corpus.mjs && node research/fetch-corpus.mjs && node research/measure.mjs
```

71 proyectos con procedencia registrada: generados con marcador inequívoco (`lovable-tagger`,
`v0.dev`, `bolt.new`) frente a repositorios humanos **creados antes del 2022-11-30** — nada
anterior a ChatGPT pudo generarse con un LLM, así que la fecha es la etiqueta.

**El resultado incomoda, y por eso vale.** De 49 reglas, **4 separan las clases con
significación** tras controlar el confundido de tamaño. Seis no disparan ni una vez. Una
disparaba al revés y se ha eliminado.

| | |
| --- | --- |
| Mejor discriminador | `D5` emojis como iconos — J 0,41 · precisión 93% · lift 18 |
| El tell más citado de la literatura | `A1` gradiente morado-azul — **J 0,13, no significativo** |
| Regla eliminada | `F2` — disparaba en 30% de generado y **61% de humano** |
| Hipótesis de las fuentes refutada | «la IA produce radios uniformes» — los datos dicen lo **contrario** |

El informe completo, con método, control de confundidos y límites de la muestra, está en
[`research/RESULTADOS.md`](research/RESULTADOS.md). Cada regla lleva ahora su fila estampada
en `data/rules.json` bajo `validado`.

### Genericidad: intento fallido, registrado

Se construyó una métrica continua de «cuánto se parece al promedio» y **no pasó la
validación**: AUC 0,665 con IC95 [0,501 – 0,830]. El intervalo roza el azar, así que no entra
en la puntuación. El registro honesto, con lo que sí dejó —que el constructo de *colorfulness*
no transfiere del render al código— está en
[`references/genericidad.md`](references/genericidad.md).

## Añadir una regla

Si es expresable como patrón, no se toca código: se añade una entrada a `data/rules.json`.

```json
{
  "id": "X1", "name": "Nombre corto", "category": "Color",
  "severity": "medium", "applies": "ambos", "weight": 2, "scope": "style",
  "pattern": "…", "flags": "i", "threshold": 3,
  "exempt": ["modern-minimal"],
  "why": "Por qué delata.",
  "fix": "Qué hacer en su lugar.",
  "source": "de dónde sale"
}
```

`scope` es `style`, `code` o `all`. `threshold` es el número de coincidencias a partir del
cual falla — para casi todo lo estilístico, **la señal es la densidad, no la presencia**.

## Limitaciones

- Análisis estático. No renderiza, no mide contraste real ni prueba interacción.
- **No implementa APCA.** Los umbrales en Lc de las fuentes exigen el algoritmo completo;
  aquí se usan el ratio de WCAG 2 y los pre-checks baratos en OKLCH.
- **Las puntuaciones no son comparables entre versiones.** Añadir comprobaciones cambia el
  denominador. Para seguir la evolución de un proyecto, usa el trinquete, no el número.
- Las fuentes están escritas sobre landing pages de marketing; `--profile producto` filtra lo
  que no transfiere, pero el juicio final es humano.
- La rúbrica es consenso de práctica profesional, no investigación. No existe trabajo
  académico equivalente para diseño de interfaz. Envejecerá con las modas.
- La puntuación es el punto de partida de una conversación, no un veredicto.

## Licencia

MIT.
