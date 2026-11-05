# Formato de archivo `.hfz` (versión 1)

Un archivo `.hfz` contiene todo lo necesario para reconstruir el texto original **sin** tener el `.txt`:
qué es un símbolo, cuántas veces aparece cada uno (con eso se reconstruye el árbol), cuántos bits son
válidos y una huella CRC-32 para comprobar la integridad. No guarda el texto original: sólo los códigos
de Huffman empaquetados.

Todos los números enteros se guardan en **big-endian** (el byte más significativo primero).

## Estructura

```
┌──────────────────────── ENCABEZADO ────────────────────────┐┌──── DATOS ────┐
│ identificación │ metadatos │ bits │ nombre │ tabla de frecuencias ││ bits empaquetados │
└────────────────────────────────────────────────────────────┘└───────────────┘
```

| Desplazamiento | Bytes | Campo | Descripción |
|---:|---:|---|---|
| 0 | 3 | Firma | Siempre `48 46 5A` = `"HFZ"`. Identifica el formato. |
| 3 | 1 | Versión | `1`. Un lector debe rechazar versiones que no conoce. |
| 4 | 1 | Banderas | Bit 0: modo de símbolos (`0` = byte, `1` = carácter Unicode). Bits 1–7 reservados, en 0. |
| 5 | 1 | Codificador | Programa que creó el archivo: `1` = Huffly Web (JavaScript), `2` = Huffly Desktop (Python). |
| 6 | 4 | Fecha | Momento de la compresión, en segundos desde 1970 (Unix, UTC). |
| 10 | 4 | Tamaño original | Bytes del archivo `.txt` original. |
| 14 | 4 | CRC-32 | CRC-32 (IEEE 802.3) del archivo original, para verificar la integridad. |
| 18 | 4 | Bits válidos | Cantidad total de bits de datos. Indica dónde terminan los datos reales. |
| 22 | 1 | Relleno | Ceros añadidos al final del último byte: `(8 − bits mod 8) mod 8`. |
| 23 | 1 | L | Longitud en bytes del nombre original (0 a 255). |
| 24 | L | Nombre | Nombre del archivo original, en UTF-8. |
| 24+L | 2 | N | Número de símbolos distintos (filas de la tabla). |
| 26+L | 1 | S | Bytes por símbolo: `1` en modo byte, `3` en modo carácter (hasta U+10FFFF). |
| 27+L | 1 | F | Bytes por frecuencia: el mínimo (1 a 4) que alcanza para la frecuencia más alta. |
| 28+L | N·(S+F) | Tabla | N pares `(símbolo, frecuencia)` en orden ascendente de símbolo. |
| 28+L+N·(S+F) | ⌈bits/8⌉ | Datos | Los códigos de Huffman concatenados. El primer bit va en el bit más significativo del primer byte. |

El encabezado mide `28 + L + N·(S+F)` bytes.

## Modos de símbolo

- **Modo byte** (`bandera = 0`): cada byte del archivo (0–255) es un símbolo. Funciona con cualquier
  archivo, esté en UTF-8, Latin-1 o cualquier otra codificación.
- **Modo carácter** (`bandera = 1`): cada carácter Unicode es un símbolo, así que «á», «ñ» o «¿» cuentan
  como uno solo. Sólo se usa si el archivo es UTF-8 válido. Al descomprimir, los caracteres se vuelven a
  codificar en UTF-8; como la entrada era UTF-8 válido (incluido el BOM si lo tenía), los bytes son idénticos.

En modo automático se elige carácter si el texto es UTF-8 válido y tiene algún carácter fuera de ASCII;
en cualquier otro caso, byte (para un texto ASCII ambos modos dan el mismo árbol, y el modo byte tiene
un encabezado más pequeño).

## Cómo se reconstruye el árbol

El lector usa **el mismo algoritmo voraz** que el compresor, con la misma regla de desempate:

1. Se crea una hoja por cada fila de la tabla, en el orden en que aparecen (ascendente por símbolo).
   Cada nodo recibe un número de creación consecutivo.
2. Mientras haya más de un nodo en la cola de prioridad, se sacan los dos de menor frecuencia; si dos
   nodos tienen la misma frecuencia, sale primero el que se creó antes.
3. El primero que sale es el hijo izquierdo (bit `0`) y el segundo, el derecho (bit `1`).
4. Si sólo hay un símbolo distinto, su código es `0` (un bit por símbolo).

Como la regla es determinista, el árbol reconstruido es exactamente el del compresor, y los archivos
de la versión web y de la de Python son idénticos byte a byte.

## Validaciones del lector

Antes de descomprimir, el lector (`parse()` en la web, `leer_cabecera()` en Python) comprueba:

- la firma `HFZ` y la versión;
- que no haya banderas desconocidas y que `S` coincida con el modo;
- que la tabla esté completa, ordenada, sin frecuencias en cero y sin caracteres Unicode inválidos;
- que el bloque de datos mida exactamente `⌈bits/8⌉` bytes y que el relleno sea coherente;
- en modo byte, que la suma de frecuencias sea igual al tamaño original;
- que la suma de `frecuencia × longitud del código` sea igual a los bits válidos declarados.

Después de descomprimir se comparan el tamaño recuperado y el CRC-32 con los del encabezado.

## Ejemplo completo: `abbacabbcd`

Frecuencias: `a = 3`, `b = 4`, `c = 2`, `d = 1`. Códigos: `b = 0`, `a = 10`, `d = 110`, `c = 111`.
Bits: `10 0 0 10 111 10 0 0 111 110` = 19 bits.

Archivo `pizarron.hfz` (51 bytes):

| Desplazamiento | Bytes | Campo | Contenido (hex) | Significado |
|---:|---:|---|---|---|
| 0 | 3 | Firma | `48 46 5A` | "HFZ" |
| 3 | 1 | Versión | `01` | 1 |
| 4 | 1 | Banderas | `00` | modo byte |
| 5 | 1 | Codificador | `01` | Huffly Web |
| 6 | 4 | Fecha | `69 55 B9 00` | 2026-01-01 00:00:00 UTC |
| 10 | 4 | Tamaño original | `00 00 00 0A` | 10 B |
| 14 | 4 | CRC-32 | `E4 74 D0 67` | 0xE474D067 |
| 18 | 4 | Bits válidos | `00 00 00 13` | 19 |
| 22 | 1 | Relleno | `05` | 5 bits |
| 23 | 1 | L | `0C` | 12 B |
| 24 | 12 | Nombre | `70 69 7A 61 72 72 6F 6E 2E 74 78 74` | pizarron.txt |
| 36 | 2 | N | `00 04` | 4 símbolos |
| 38 | 2 | S, F | `01 01` | 1 B por símbolo, 1 B por frecuencia |
| 40 | 8 | Tabla | `61 03 62 04 63 02 64 01` | a:3, b:4, c:2, d:1 |
| 48 | 3 | Datos | `8B C7 C0` | `10001011 11000111 110·····` |

En un texto tan corto el encabezado (48 B) pesa más que el original (10 B). En un libro es una fracción
mínima: Alicia en el país de las maravillas (141 KB) lleva 264 B de encabezado (0.32 % del archivo) y
Moby Dick (1.19 MB) se comprime a 695 KB con un encabezado de 378 B (0.05 %).

## Dónde está en el código

| Qué | JavaScript (`js/huffman.js`) | Python (`python/huffman.py`) |
|---|---|---|
| Escribir el archivo | `compress()` | `comprimir()` |
| Leer y validar el encabezado | `parse()` | `leer_cabecera()` |
| Descomprimir y verificar | `decompress()` | `descomprimir()` |
| Árbol (regla de desempate) | `buildTree()` | `construir_arbol()` |
