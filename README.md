# slop-tools

Base de conocimiento y auditor estático para responder con evidencia a una pregunta que
normalmente se responde con opiniones: **¿esto parece hecho por IA?**

Es una skill de Claude Code y, a la vez, una herramienta de línea de comandos que funciona
sola.

## Por qué existe

«Se ve hecho con IA» es una acusación difícil de discutir: quien la hace rara vez sabe
señalar qué se lo dice, y quien la recibe no puede refutar una impresión. La discusión se
queda en gustos y no cambia nada del producto.

Este repositorio convierte esa impresión en **28 comprobaciones contrastables**, la mitad
automatizables, con la procedencia de cada una y —tan importante— **la salvedad de cuándo no
aplican**.

## Uso rápido

```bash
node scripts/slop-scan.mjs ./src --brand "TuMarca" --profile producto
```

```
  PUNTUACIÓN  35/100 — Se identifica en diez segundos
  9 de 16 comprobaciones automáticas fallan

  ── Prueba del cambio de nombre (marca: "TuMarca") ──
  ✗ 16 titular(es) que funcionarían para un competidor
      components/ClientView.jsx:236  "Elige tu experiencia"
  ...
```

Opciones:

| Opción | Efecto |
| --- | --- |
| `--brand "Nombre"` | Activa la prueba del cambio de nombre |
| `--profile landing\|producto\|ambos` | Filtra las comprobaciones que no aplican |
| `--json` | Salida estructurada para CI |
| `--min-score N` | Sale con código 1 si baja del umbral |

Sin dependencias. Sólo Node 18 o superior.

## Qué hay dentro

| Ruta | Contenido |
| --- | --- |
| `SKILL.md` | Punto de entrada como skill: procedimiento y cómo entregar el veredicto |
| `references/rubric.md` | Las 28 comprobaciones, con fuente, peso y aplicabilidad |
| `references/caveats.md` | **Léelo antes de dar un veredicto.** Cuándo la rúbrica se equivoca |
| `references/remediation.md` | Las 6 reglas correctivas y el orden de arreglo |
| `references/adversarial.md` | Cómo montar un panel de modelos que no se engañe a sí mismo |
| `references/sources.md` | Bibliografía anotada |
| `scripts/slop-scan.mjs` | El escáner |
| `templates/revision-humana.md` | Las 9 comprobaciones que exigen mirar |

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

## Limitaciones

- Análisis estático. No renderiza, no mide contraste real ni prueba interacción.
- Las fuentes están escritas sobre landing pages de marketing; `--profile producto` filtra lo
  que no transfiere, pero el juicio final es humano.
- La rúbrica es consenso de práctica profesional, no investigación. No existe trabajo
  académico equivalente para diseño de interfaz. Envejecerá con las modas.
- La puntuación es el punto de partida de una conversación, no un veredicto.

## Licencia

MIT.
