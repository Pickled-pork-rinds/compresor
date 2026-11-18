# Plan de pruebas y evidencias

Las cuatro pruebas mínimas que pide la actividad, más las pruebas automáticas del código.
Guarden sus capturas en `docs/capturas/` con los nombres sugeridos.

## Pruebas automáticas

```bash
node tests/huffman.test.js
cd python && python -m unittest -v test_huffman
```

| Prueba | Qué comprueba |
|---|---|
| Ejemplo del pizarrón | `abbacabbcd` produce `b=0, a=10, d=110, c=111` y 19 bits, con 3 uniones |
| Modo carácter | «á», «ñ», «¿» y emojis cuentan como un solo símbolo |
| UTF-8 inválido | Un archivo Latin-1 cae al modo byte y se recupera idéntico |
| BOM, CRLF, tabuladores | Se conservan byte por byte |
| Casos borde | Archivo vacío, un solo símbolo repetido, los 256 bytes posibles, códigos de más de 20 bits |
| Aleatorios | 300 entradas de bytes y 100 textos Unicode, ida y vuelta |
| Rendimiento | 3 MB comprimidos y descomprimidos en menos de medio segundo |
| Archivos dañados | Detecta un bit alterado, una firma incorrecta, un archivo truncado y una versión desconocida |
| Encabezado | Todos los campos que pide la consigna; los segmentos cubren el archivo completo |
| Optimalidad | La longitud media queda entre la entropía `H` y `H + 1`, y nunca supera un código fijo |
| Prueba cruzada | Python abre los `.hfz` de la web (`tests/fixtures/`) y genera exactamente los mismos bytes |
| Expansión mínima | Kruskal y Prim dan el mismo peso en 300 grafos; grafo clásico de peso 16 |

Resultado de la última ejecución: **16 pruebas JS correctas · 11 pruebas Python correctas**.

---

## Prueba 1 · Texto pequeño (verificable a mano)

**Entrada:** ejemplo del pizarrón, `abbacabbcd` (10 bytes). En el estudio: Ejemplos → «Ejemplo del pizarrón».

| Símbolo | Frecuencia | Código | Bits |
|---|---:|---|---:|
| b | 4 | `0` | 4 |
| a | 3 | `10` | 6 |
| c | 2 | `111` | 6 |
| d | 1 | `110` | 3 |
| **Total** | **10** | | **19** |

Uniones voraces: `d(1) + c(2) = 3`, después `a(3) + nodo(3) = 6`, después `b(4) + nodo(6) = 10`.

Bits: `10 0 0 10 111 10 0 0 111 110` → bytes `8B C7 C0` (los últimos 5 bits son relleno).
Archivo: 51 B (48 B de encabezado + 3 B de datos). Ver el detalle en [formato-hfz.md](formato-hfz.md).

Capturas: `capturas/01-pizarron-frecuencias.png`, `capturas/02-pizarron-arbol.png`, `capturas/03-pizarron-codigos.png`

## Prueba 2 · Libro de Project Gutenberg

**Entrada:** un libro buscado desde la aplicación (Paso 1 → Project Gutenberg).

| Libro | ID | Original | Comprimido | Ahorro | Reducción | Símbolos |
|---|---:|---:|---:|---:|---:|---:|
| *completar con su libro* | | | | | | |

Referencia medida con textos de Project Gutenberg (corpus de NLTK):

| Libro | Original | Comprimido | Reducción |
|---|---:|---:|---:|
| Alice in Wonderland | 141.01 KB | 81.11 KB | 42.5 % |
| Moby Dick | 1.19 MB | 695.04 KB | 42.7 % |
| Biblia King James | 4.13 MB | 2.37 MB | 42.7 % |

Capturas: `capturas/04-gutenberg-busqueda.png`, `capturas/05-libro-metricas.png`

## Prueba 3 · Integridad

**Procedimiento:** comprimir el libro de la prueba 2 → descargar el `.hfz` → recargar la página → abrir el
`.hfz` en el inspector (sin el original) → Descomprimir → descargar `recuperado.txt`.

**Comprobaciones de la aplicación:**

- tamaño recuperado = tamaño declarado en el encabezado;
- CRC-32 del recuperado = CRC-32 guardado;
- si el original está abierto en la misma sesión: comparación byte a byte y SHA-256 idénticos.

**Comprobación externa** (fuera de la aplicación):

```bash
# Windows (PowerShell)
Get-FileHash original.txt, original-recuperado.txt -Algorithm SHA256
# macOS / Linux
shasum -a 256 original.txt original-recuperado.txt
```

Los dos hashes deben ser iguales.

Capturas: `capturas/06-inspector-estructura.png`, `capturas/07-verificacion.png`, `capturas/08-hashes.png`

## Prueba 4 · Archivo no usado durante el desarrollo

**Entrada:** un `.txt` que nadie del equipo haya usado antes (por ejemplo, el que proporcione el profesor).

| Archivo | Original | Comprimido | Reducción | Modo | ¿Idéntico? |
|---|---:|---:|---:|---|---|
| *completar* | | | | | |

Capturas: `capturas/09-archivo-nuevo.png`

## Prueba extra · Compatibilidad web ↔ Python

1. Comprimir un texto en la web y descargar el `.hfz`.
2. Abrirlo en `python python/app_gui.py` → pestaña Inspector → Descomprimir.
3. Hacer lo inverso: comprimir en Python y abrir en el inspector web.

Capturas: `capturas/10-python-inspector.png`
