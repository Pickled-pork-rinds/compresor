# Plan de pruebas y evidencias

Las cuatro pruebas mínimas que pide la actividad, la prueba de compatibilidad con la app de escritorio y las
pruebas automáticas del código. Todas las capturas están en [`capturas/`](capturas/).

| # | Prueba | Entrada | Resultado |
|---|---|---|---|
| 1 | Texto pequeño | `abbacabbcd` (10 B) | Frecuencias, árbol y códigos coinciden con el cálculo a mano |
| 2 | Libro de Project Gutenberg | *Alice's Adventures in Wonderland* (141.01 KB) | 81.11 KB, reducción de 42.5 % |
| 3 | Integridad | El `.hfz` de la prueba 2 | Recuperado idéntico: tamaño, CRC-32, SHA-256 y byte a byte |
| 4 | Archivo no usado en el desarrollo | *The Man Who Was Thursday* (313.01 KB) | 176.64 KB, reducción de 43.6 %, recuperado idéntico |
| 5 | Web ↔ Python | `.hfz` creado en la web, abierto en `app_gui.py` | Python lo inspecciona y lo descomprime idéntico |

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
Archivo: 51 B (48 B de encabezado + 3 B de datos). Con un texto tan corto el archivo **crece**, porque el
encabezado guarda la tabla de frecuencias; la aplicación lo muestra como «Aumento 410.0 %».

**Resultado:** la aplicación calcula las mismas frecuencias, el mismo árbol y los mismos códigos que el
cálculo a mano.

| Frecuencias | Árbol | Códigos | Compresión |
|---|---|---|---|
| ![](capturas/01-pizarron-frecuencias.jpg) | ![](capturas/02-pizarron-arbol.jpg) | ![](capturas/03-pizarron-codigos.jpg) | ![](capturas/03b-pizarron-comprimir.jpg) |

## Prueba 2 · Libro de Project Gutenberg

**Entrada:** *Alice's Adventures in Wonderland*, de Lewis Carroll (Project Gutenberg, 144,395 bytes).

| Libro | Original | Comprimido | Ahorro | Reducción | Razón | Símbolos | Bits por símbolo (entropía) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Alice's Adventures in Wonderland | 141.01 KB (144,395 B) | 81.11 KB (83,060 B) | 59.90 KB (61,335 B) | 42.5 % | 1.74 : 1 | 73 | 4.59 (4.55) |

El encabezado ocupa 270 B (0.3 % del archivo). La compresión tardó 20 ms en el navegador.

![Métricas del libro](capturas/05-libro-metricas.jpg)

Otros libros de Project Gutenberg medidos con `node tests/medir.js`:

| Libro | Original | Comprimido | Reducción |
|---|---:|---:|---:|
| Hamlet | 159.06 KB | 91.95 KB | 42.2 % |
| Moby Dick | 1.19 MB | 695.04 KB | 42.7 % |
| Biblia King James | 4.13 MB | 2.37 MB | 42.7 % |

## Prueba 3 · Integridad

**Procedimiento:**

1. Comprimir el libro de la prueba 2 y descargar `alice-in-wonderland.hfz`.
2. En la misma sesión, «Abrir en el inspector» → **Descomprimir**: con el original abierto, la aplicación
   compara además byte a byte y con SHA-256.
3. En una página nueva, abrir **sólo** el `.hfz` en el inspector (sin el `.txt`), examinar su estructura y
   después descomprimir y descargar `alice-in-wonderland-recuperado.txt`.
4. Comparar el original y el recuperado fuera de la aplicación con `sha256sum` y `cmp`.

| Comprobación | Resultado |
|---|---|
| Tamaño recuperado = tamaño del encabezado | 144,395 B = 144,395 B |
| CRC-32 del recuperado = CRC-32 guardado | `0x62E98012` = `0x62E98012` |
| Comparación byte a byte con el original | 0 diferencias en 144,395 bytes |
| SHA-256 (aplicación y terminal) | `5ce9042c0d8536b072b61d4c7c4e6d70c72d9dbb5f3d816261326d9280749266` en ambos |

| Con el original abierto | Sólo con el `.hfz` |
|---|---|
| ![](capturas/07-verificacion.jpg) | ![](capturas/07b-verificacion-solo-hfz.jpg) |

Inspector con el `.hfz` solo (estructura, árbol reconstruido y bits):

| Estructura | Árbol | Bits |
|---|---|---|
| ![](capturas/06-inspector-estructura.jpg) | ![](capturas/06b-inspector-arbol.jpg) | ![](capturas/06c-inspector-bits.jpg) |

Comprobación externa:

![Hashes](capturas/08-hashes.jpg)

```bash
# Windows (PowerShell)
Get-FileHash alice-in-wonderland.txt, alice-in-wonderland-recuperado.txt -Algorithm SHA256
# macOS / Linux
sha256sum alice-in-wonderland.txt alice-in-wonderland-recuperado.txt
```

## Prueba 4 · Archivo no usado durante el desarrollo

**Entrada:** *The Man Who Was Thursday*, de G. K. Chesterton (Project Gutenberg). Nadie lo usó al programar.

| Archivo | Original | Comprimido | Ahorro | Reducción | Razón | Símbolos | ¿Idéntico? |
|---|---:|---:|---:|---:|---:|---:|---|
| the-man-who-was-thursday.txt | 313.01 KB (320,525 B) | 176.64 KB (180,877 B) | 136.38 KB | 43.6 % | 1.77 : 1 | 77 | Sí: 0 diferencias, SHA-256 `8b431a2a…c2f5493` |

| Métricas | Verificación |
|---|---|
| ![](capturas/09-archivo-nuevo.jpg) | ![](capturas/09b-archivo-nuevo-verificacion.jpg) |

En la revisión, el profesor puede dar cualquier otro `.txt`: se sube en el Paso 1 → Archivo local.

## Prueba 5 · Compatibilidad web ↔ Python (app de escritorio)

1. `alice-in-wonderland.hfz` (creado en la web) se abrió en `python python/app_gui.py` → pestaña Inspector.
2. **Descomprimir:** tamaño y CRC-32 coinciden; el texto recuperado es idéntico al libro.
3. La app de escritorio también comprimió el mismo libro y su `.hfz` se descomprimió idéntico.

| Comprimir (Python) | Inspector (Python) | Descompresión (Python) |
|---|---|---|
| ![](capturas/15-python-comprimir.jpg) | ![](capturas/10-python-inspector.jpg) | ![](capturas/10b-python-descomprimir.jpg) |

| Árbol (Python) | Expansión mínima (Python) |
|---|---|
| ![](capturas/16-python-arbol.jpg) | ![](capturas/17-python-mst.jpg) |

## Árbol de expansión mínima (web)

Kruskal y Prim sobre el mismo grafo llegan al mismo peso total.

| Kruskal | Prim |
|---|---|
| ![](capturas/12-mst-kruskal.jpg) | ![](capturas/13-mst-prim.jpg) |

## Pruebas automáticas

```bash
node tests/huffman.test.js
cd python && python -m unittest -v test_huffman
```

![Pruebas automáticas](capturas/11-pruebas-automaticas.jpg)

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

## Interfaz en celular

![Celular](capturas/14-celular.jpg)
