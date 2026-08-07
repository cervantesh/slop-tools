# Métrica de genericidad visual — resultado: **no entra**

Registro de un intento de convertir la rúbrica binaria en un número continuo: «esto se parece
al promedio en un 0,7». Se construyó, se validó contra el corpus etiquetado y **no alcanza el
listón para incorporarse al escáner**. El código queda en `research/genericity.mjs` para
volver a intentarlo con un corpus mayor.

---

## 1 · Qué dice la literatura, y por qué no sirve directamente

La búsqueda con vocabulario académico —no de herramientas— sí devuelve trabajo real, al
contrario que la búsqueda anterior:

| Trabajo | Qué aporta | Por qué no es aplicable aquí |
| --- | --- | --- |
| Reinecke et al., CHI 2013 | Predice la primera impresión estética a partir de dos constructos medibles: **colorfulness** y **complejidad visual**. 548 evaluadores, 450 sitios | Se computa sobre **capturas de pantalla** |
| LayoutGMN | Similitud estructural entre layouts vía redes de emparejamiento de grafos | Exige el grafo de la UI renderizada |
| Graph4GUI | Embeddings de elementos de UI con sus restricciones visuo-espaciales | Ídem |
| CLIP / SSIM como métricas de similitud visual | Distancia perceptual entre diseños | Exige imágenes y un modelo |

**El patrón es unánime: todo opera sobre el render, no sobre el código fuente.** Un escáner
estático sin dependencias no puede usar nada de esto tal cual.

Lo que sí se puede tomar prestado son los **constructos**. Reinecke no mide «cuánto se parece
al promedio», mide colorfulness y complejidad; ambos tienen análogos calculables sobre el
código: la distribución de la paleta y la variedad de las escalas.

## 2 · Qué se construyó

Once rasgos extraídos estáticamente, con extracción **cross-stack** (declaraciones CSS *y*
clases de utilidad de Tailwind, mapeadas a píxeles). Sin eso, un proyecto Tailwind saldría
vacío y la métrica estaría midiendo stack otra vez.

- *Colorfulness*: entropía de tono sobre 12 cubos en OKLCH, croma medio, desviación de croma,
  colores únicos.
- *Complejidad*: radios distintos, espaciados distintos, tamaños distintos, familias.
- *Disciplina*: dominancia del valor principal de radio y de espaciado, limpieza de escala
  (proporción de espaciados múltiplos de 4).

Puntuación: distancia z-normalizada al centroide de la clase generada menos la distancia al
centroide humano, **con centroides recalculados excluyendo la propia muestra**
(leave-one-out). Sin esa exclusión cada proyecto contribuye a su propio centroide y el AUC
sube solo.

## 3 · Resultado

| Comparación | AUC |
| --- | --- |
| pos vs neg_stack, sin control de tamaño | 0,684 |
| pos vs neg_classic | 0,427 (por debajo del azar) |
| **pos vs neg_stack, en banda 20–200 archivos** | **0,665** |
| IC 95% del anterior (Hanley-McNeil), n = 20/23 | **[0,501 – 0,830]** |

**El límite inferior del intervalo es 0,501.** Roza el azar por una milésima. Con esta
muestra no se puede afirmar que la métrica separe de forma fiable.

## 4 · Por qué no entra

1. **El intervalo toca el azar.** Un AUC cuyo IC empieza en 0,501 no es una base para puntuar
   el trabajo de nadie.
2. **Un AUC de 0,665 no es utilizable aunque fuera exacto.** Es un empujón direccional, no un
   clasificador. Publicarlo como «genericidad 0,7» daría una falsa impresión de precisión.
3. **La comparación contra `neg_classic` va por debajo del azar (0,427)**, lo que confirma que
   una parte de la señal sigue siendo tamaño y estilo de repositorio, no genericidad.

## 5 · Lo que sí dejó, y es el hallazgo más interesante

La discriminación univariante, dentro de la banda de tamaño controlada:

| Rasgo | AUC | Dirección |
| --- | --- | --- |
| Espaciados distintos | 0,767 | generado tiene **más** variedad |
| Radios distintos | 0,753 | generado tiene **más** variedad |
| Dominancia del radio principal | 0,277 | generado es **menos** uniforme |
| Tamaños distintos | 0,672 | generado tiene más |
| Colores únicos | 0,639 | generado tiene más |
| Croma medio | 0,603 | generado algo más saturado |
| **Entropía de tono** | **0,528** | **inútil** |
| **Limpieza de escala** | **0,439** | **inútil, y algo invertida** |

Dos conclusiones:

**El constructo de *colorfulness* no transfiere del render al código.** La entropía de tono da
0,528, indistinguible del azar. Reinecke la mide sobre píxeles, donde pesa el área que cada
color ocupa; en el código todos los literales de color pesan igual, y esa diferencia destruye
la señal.

**La hipótesis de la uniformidad, que sostienen todas las fuentes, está invertida en los
datos.** Las guías afirman que la IA produce radios y espaciados idénticos. Medido: los
proyectos generados usan *más* valores distintos y son *menos* dominados por un valor único.
La explicación plausible es que esparcen la escala de Tailwind (`rounded-sm`, `rounded-lg`,
`rounded-2xl`…) mientras un equipo humano se ata a dos o tres valores. La regla `C3`, que
codifica la uniformidad, mide J = 0,05.

Si alguna vez hay una métrica de genericidad viable, **no va a construirse sobre color, y va
a apuntar al revés de lo que dice la bibliografía**.

## 6 · Qué haría falta para reintentarlo

- **n mucho mayor**: con 20 vs 23 sólo se ven efectos enormes. Objetivo ≥ 150 por clase.
- **Corpus de validación aparte**, para que los umbrales no se ajusten a los mismos datos que
  los evalúan.
- **Ponderar por uso, no por aparición**: contar cuántas veces se usa cada valor de escala en
  vez de cuántos valores distintos existen. Es el análogo del área que ocupa un color en el
  render, y es lo que falta para que el constructo de Reinecke transfiera.
- **Normalizar por tamaño dentro del propio rasgo**, en vez de recortar la muestra a una
  banda.

Reproducir: `node research/genericity.mjs`. Un proyecto suelto:
`node research/genericity.mjs <ruta>`.
