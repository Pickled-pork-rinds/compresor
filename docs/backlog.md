# Backlog para GitHub Projects

Columnas del tablero: **Backlog → Por hacer → En progreso → En revisión → Terminado**.
Cada tarjeta: qué se hará, responsable, resultado esperado y estado. Repartan las tareas para que el
historial de commits muestre la participación de ambos.

| # | Tarea | Responsable | Resultado esperado (definición de terminado) |
|---:|---|---|---|
| 1 | Crear repositorio, tablero y README inicial | Integrante 1 | Repo público con README, tablero con 5 columnas |
| 2 | Conteo de frecuencias | Integrante 1 | `countFrequencies()` correcto para bytes y caracteres Unicode |
| 3 | Cola de prioridad (montículo mínimo) | Integrante 2 | `MinHeap` con desempate por orden de creación |
| 4 | Árbol de Huffman (técnica voraz) | Integrante 1 | `buildTree()` produce el árbol del pizarrón |
| 5 | Generación de códigos | Integrante 2 | `abbacabbcd` → `b=0, a=10, d=110, c=111` |
| 6 | Empaquetado de bits | Integrante 1 | 19 bits → `8B C7 C0` |
| 7 | Diseño del formato `.hfz` | Ambos | `docs/formato-hfz.md` con todos los campos |
| 8 | Escritura y lectura del `.hfz` | Integrante 2 | `compress()` y `parse()` con validaciones |
| 9 | Descompresor y verificación CRC-32 | Integrante 1 | Recupera el original idéntico; detecta archivos dañados |
| 10 | Inspector | Integrante 2 | Muestra encabezado, tabla, códigos, árbol y bits antes de descomprimir |
| 11 | Integración con Gutenberg (proxy + cliente) | Integrante 1 | Buscar y descargar un libro desde la app |
| 12 | Interfaz: portada y estudio | Integrante 2 | Flujo completo navegable en escritorio y celular |
| 13 | Animación del árbol | Integrante 1 | Paso a paso con cola de prioridad visible |
| 14 | Árbol de expansión mínima (Kruskal y Prim) | Integrante 2 | Laboratorio animado, mismo peso en ambos |
| 15 | Versión Python con GUI | Ambos | `app_gui.py` comprime, inspecciona y abre `.hfz` de la web |
| 16 | Pruebas automáticas y prueba cruzada | Integrante 1 | `tests/` y `python/test_huffman.py` en verde |
| 17 | Pruebas mínimas con capturas | Integrante 2 | `docs/pruebas.md` completo con capturas |
| 18 | Deployment en Vercel | Integrante 1 | URL pública funcionando, incluida la descarga de libros |
| 19 | Documentación final y uso de IA | Ambos | README con todas las secciones; reporte PDF |

## Sugerencia de commits

Hagan commits pequeños por tarea (por ejemplo `feat: cola de prioridad con desempate`,
`docs: especificación del formato hfz`, `test: prueba cruzada web-python`), en lugar de uno solo al final.
