# Huffly — Huffman Web Compressor

Compresor de texto con el **algoritmo de Huffman** (técnica voraz) y formato de archivo propio `.hfz`.

**Análisis de Algoritmos · 2026B** · CUCEI, Universidad de Guadalajara

> **Estado: Sprint 1 terminado, Sprint 2 en curso.** Ya funciona el flujo completo de compresión
> (texto → frecuencias → árbol → códigos → `.hfz`). Avance y reparto en el [backlog](docs/backlog.md).

| | |
|---|---|
| Repositorio |(https://github.com/Pickled-pork-rinds/compresor) |
| Aplicación publicada | *pendiente (Sprint 2, HU-29)* |

## Integrantes

| Integrante | Rol Scrum | Responsabilidades principales |
|---|---|---|
| Juan Manuel Murillo López | Product Owner y desarrollador | Núcleo del algoritmo, versión en Python y documentación |
| Brian Ulises Vazquez Hernandez | Scrum Master y desarrollador | Repositorio y tablero, formato `.hfz`, proxy de Gutenberg y despliegue |
| Francisco Javier Quintero Magaña | Desarrollador | Interfaz web, animación del árbol y laboratorio de expansión mínima |
| Erin Fernando Cuellar Gonzales | Desarrollador | Descompresión, inspector, verificación de integridad y pruebas |

## Qué funciona (Sprint 1)

| Paso | Qué hace la aplicación |
|---|---|
| 1. Fuente | Sube un `.txt` (por ejemplo, un libro descargado de Project Gutenberg), usa un ejemplo incluido o escribe tu texto. |
| 2. Analizar | Cuenta la frecuencia de cada símbolo; tabla, histograma y entropía. |
| 3. Árbol | Construye el árbol con una cola de prioridad y anima cada unión voraz. |
| 4. Códigos | Código de cada símbolo, su camino en el árbol y cómo se codifica el texto. |
| 5. Comprimir | Genera el `.hfz` y muestra tamaño original, comprimido, ahorro, porcentaje, razón y símbolos distintos. |

También están listos el núcleo en Python (`python/huffman.py`), que genera exactamente los mismos
archivos que la web, y la especificación del formato en [docs/formato-hfz.md](docs/formato-hfz.md).

## Sprint 2 (en curso)

Inspector de `.hfz` y verificación de integridad, búsqueda en Project Gutenberg, laboratorio de árbol de
expansión mínima, aplicación de escritorio en Python, despliegue en Vercel y documentación final.

## Cómo ejecutar

1. Abre la carpeta en Visual Studio Code e instala la extensión **Live Server**.
2. Clic derecho en `index.html` → **Open with Live Server**.

Pruebas automáticas:

```bash
node tests/huffman.test.js
cd python && python -m unittest -v test_huffman
```

## Algoritmo

1. **Frecuencias:** se recorre el texto una vez y se cuenta cada símbolo.
2. **Decisión voraz:** se sacan de la cola de prioridad los dos nodos de menor frecuencia y se unen bajo un
   padre con la suma, hasta que queda un solo árbol (`k − 1` uniones, `O(k log k)`).
3. **Códigos:** el camino de la raíz a cada hoja; izquierda `0`, derecha `1`.
4. **Empaquetado:** los códigos se concatenan y se guardan de 8 en 8 bits.

## Uso de IA

Usamos Claude (Anthropic) para la estructura inicial, el código y la documentación. Lo validamos con las
pruebas automáticas, la prueba cruzada entre la versión web y la de Python, y revisando el flujo completo
en el navegador. 
   
