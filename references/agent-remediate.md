# Skill de remediación — para agentes de código

Carga esto cuando el usuario pida **arreglar** slop, aplicar el plan de `slop-scan`,
respetar un `DESIGN.md`, o “hacer que deje de parecer IA” **cambiando código**.

No es un veredicto de auditoría: es un procedimiento de ejecución.

## Entrada obligatoria

Antes de editar nada, genera el brief (fuente de verdad del trabajo):

```bash
node scripts/slop-fix.mjs <ruta-del-proyecto> --profile producto --out REMEDIAR.md
# con marca:
node scripts/slop-fix.mjs <ruta> --brand "Nombre" --profile producto --out REMEDIAR.md
# contrato en otro directorio (p. ej. el de slop-init):
node scripts/slop-fix.mjs <ruta> --contrato ./sistema --out REMEDIAR.md
```

Lee `REMEDIAR.md` completo. Ese archivo ya trae:

1. Restricciones del contrato (si existe)
2. Orden de capas (contenido → … → sistema visual → contrato)
3. Cada hallazgo con **id**, **arreglo**, **archivo:línea**
4. Comando de verificación

Si no hay contrato y vas a tocar CSS de marca, **para** y corre:

```bash
node scripts/slop-init.mjs ./sistema
```

Adopta ese sistema (o uno declarado por el humano). Sin restricción, convergerás al promedio.

## Reglas de ejecución

1. **Sigue el orden del brief.** No empieces por el gradiente si hay titulares intercambiables o `L1`/`L2`/`E7`.
2. **No inventes tokens.** Colores, tipografías, espaciados y ms salen del contrato. Cambiar el sistema = editar `DESIGN.md` + `tokens.css` / `.slop-init.json` primero.
3. **Un hallazgo, un cambio anclado.** Cada diff debe poder citarse como “cierra `UX2` en `Card.jsx:40`”.
4. **No rediseñes lo que no falla.** El plan no es un moodboard.
5. **Defecto ≠ slop.** Accesibilidad y calidad se arreglan como calidad; no los uses para acusar autoría.
6. **Cierra con el comando de verificar** del brief. Si sale ≠ 0, sigue. Si el contrato no llega a 100, sigue.
7. **Caveats.** Si el perfil es `producto`, no “arregles” husos de landing que el perfil ya excluye. Lee `references/caveats.md` si dudas.

## Qué no hacer

- Sustituir Inter por otra default de herramienta (Poppins, Geist, Roboto, Open Sans).
- Introducir 300ms, `transition: all`, o hex sueltos fuera de paleta.
- Ampliar la escala de espaciado “porque queda mejor” sin actualizar el contrato.
- Declarar “listo” solo con la puntuación de procedencia si el contrato sigue roto.

## Salida al humano

Al terminar, reporta:

- Hallazgos cerrados (ids)
- Hallazgos que requieren humano (copy de negocio, fotos, dominio) y por qué
- Salida del comando de verificación (procedencia + contrato)

## Relación con el resto del repo

| Pieza | Rol |
| --- | --- |
| `slop-scan --plan` | Plan legible en terminal |
| `slop-fix` | Brief para agente + `--out` |
| `slop-scan --contrato` | Lint del sistema |
| `references/remediation.md` | Principios (las 6 reglas, orden macro) |
| `SKILL.md` | Auditoría / veredicto |
| Este archivo | Ejecución del arreglo |
