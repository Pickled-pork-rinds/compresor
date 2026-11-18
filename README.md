# Huffly — Huffman Web Compressor

Compresor de texto con el **algoritmo de Huffman** (técnica voraz), con formato de archivo propio `.hfz`,
inspector, verificación de integridad, búsqueda en Project Gutenberg y un laboratorio del **árbol de
expansión mínima** (Kruskal y Prim). Incluye una versión web y una aplicación de escritorio en Python.

**Análisis de Algoritmos · 2026B** · CUCEI, Universidad de Guadalajara · Equipo Pickled Pork Rinds

![Portada de Huffly](docs/capturas/00-portada.jpg)

| | |
|---|---|
| Aplicación publicada | **https://compresor-two.vercel.app** |
| Repositorio | https://github.com/Pickled-pork-rinds/compresor |
| Tablero (GitHub Projects) | *https://github.com/orgs/Pickled-pork-rinds/projects/10* |
| Reporte técnico (PDF) | [docs/reporte-tecnico.pdf](docs/reporte-tecnico.pdf) |

## Integrantes

| Integrante | GitHub | Rol Scrum | Responsabilidades principales |
|---|---|---|---|
| Erin Fernando Cuellar Gonzalez | [@erincuellar2159](https://github.com/erincuellar2159) | Desarrollador | Descompresión, inspector, verificación de integridad y pruebas |
| Brian Ulises Vazquez Hernandez | [@brianvazquez999](https://github.com/brianvazquez999) | Scrum Master y desarrollador | Repositorio y tablero, formato `.hfz`, proxy de Gutenberg y despliegue |
| Francisco Javier Quintero Magaña | [@franciscoquintero2035-desk](https://github.com/franciscoquintero2035-desk) | Desarrollador | Interfaz web, animación del árbol y laboratorio de expansión mínima |
| Juan Manuel Murillo Lopez | [@juanmanuel782](https://github.com/juanmanuel782) | Product Owner y desarrollador | Núcleo del algoritmo, versión en Python (con interfaz gráfica) y documentación |

El reparto completo por historia de usuario y por tarea del tablero está en el [backlog](docs/backlog.md).
Los nombres del pie de página de la web se editan en `js/config.js`.

---

## Descripción

La aplicación sigue el flujo completo que pide la actividad:

```
BUSCAR LIBRO / SUBIR TXT → ANALIZAR → CONSTRUIR HUFFMAN → COMPRIMIR → INSPECCIONAR → DESCOMPRIMIR → VERIFICAR
```

| Paso | Qué hace la aplicación |
|---|---|
| 1. Fuente | Busca libros en Project Gutenberg por título, autor o palabra clave; también acepta un `.txt` local, ejemplos incluidos o texto escrito. |
| 2. Analizar | Cuenta la frecuencia de cada símbolo; muestra histograma, tabla y entropía. |
| 3. Árbol | Construye el árbol de Huffman con la cola de prioridad y anima cada unión voraz. |
| 4. Códigos | Muestra el código de cada símbolo, su camino en el árbol y cómo se codifica el texto. |
| 5. Comprimir | Genera un archivo `.hfz` real y muestra tamaño original, comprimido, ahorro, porcentaje, razón y símbolos distintos. |
| 6. Inspeccionar | Abre un `.hfz` **sin el `.txt` original**: volcado hexadecimal, campos del encabezado, frecuencias, códigos, árbol reconstruido y bits. |
| 7. Verificar | Descomprime y compara tamaño, CRC-32, SHA-256 y byte a byte; permite descargar `recuperado.txt`. |

Además, `mst.html` anima Kruskal y Prim, y `python/app_gui.py` ofrece lo mismo en una aplicación de escritorio.

## Algoritmo de Huffman

1. **Frecuencias.** Se recorre el texto una vez y se cuenta cada símbolo. `O(n)`.
2. **Cola de prioridad.** Cada símbolo es una hoja en un montículo mínimo ordenado por frecuencia.
3. **Decisión voraz.** Mientras haya más de un nodo, se sacan los **dos de menor frecuencia** y se unen bajo
   un padre cuya frecuencia es la suma. Con `k` símbolos distintos se hacen `k − 1` uniones: `O(k log k)`.
4. **Códigos.** El camino de la raíz a cada hoja da su código: izquierda `0`, derecha `1`. Ningún código es
   prefijo de otro, así que la decodificación no es ambigua.
5. **Empaquetado.** Los códigos se concatenan y se guardan de 8 en 8 bits.
6. **Descompresión.** Se reconstruye el árbol con la tabla de frecuencias y se recorre bit a bit; al llegar a
   una hoja se emite su símbolo y se vuelve a la raíz.

**Por qué la decisión voraz es óptima:** los dos símbolos menos frecuentes pueden ser hermanos en el nivel
más profundo de algún árbol óptimo; al unirlos, el problema se reduce a uno con un símbolo menos que tiene
la misma estructura. La longitud media del código queda siempre entre la entropía `H` y `H + 1`.

**Desempate determinista:** si dos nodos tienen la misma frecuencia, sale primero el que se creó antes. Así
el árbol que reconstruye el descompresor es exactamente el del compresor.

### Árbol de expansión mínima

- **Kruskal:** ordena las aristas por peso y acepta cada una que no forme ciclo (Unión-Búsqueda). `O(E log E)`.
- **Prim:** crece un solo árbol desde un vértice tomando la arista más barata de la frontera. La versión
  incluida revisa todas las aristas en cada paso, `O(V·E)`; con un montículo bajaría a `O(E log V)`.

## Formato propio `.hfz`

Especificación completa, con un ejemplo byte por byte: **[docs/formato-hfz.md](docs/formato-hfz.md)**.

```
"HFZ" | versión | banderas | codificador | fecha | tamaño original | CRC-32 | bits válidos | relleno
| largo del nombre | nombre | N | bytes por símbolo | bytes por frecuencia | tabla (símbolo, frecuencia)×N
| datos comprimidos
```

Guarda la información para reconstruir el árbol (tabla de frecuencias), la cantidad de bits válidos, el
tamaño original, un CRC-32 para la integridad y metadatos (nombre, fecha, programa que lo creó). No guarda
el texto original.

## Resultados de compresión

Medidos con el código de este repositorio (`node tests/medir.js <archivos>`). Los libros en inglés son
textos de Project Gutenberg (corpus de NLTK). En todos los casos el archivo recuperado fue idéntico byte a
byte, y las versiones web y Python generaron el mismo `.hfz`.

| Texto | Modo | Original | Comprimido | Ahorro | Reducción | Razón | Símbolos | Bits/símbolo (entropía) | Tiempo web |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Ejemplo del pizarrón | byte | 10 B | 51 B | −41 B | −410.0 % | 0.20 : 1 | 4 | 1.90 (1.85) | 2 ms |
| Pangrama en español | carácter | 195 B | 323 B | −128 B | −65.6 % | 0.60 : 1 | 44 | 4.68 (4.63) | 2 ms |
| Don Quijote, cap. I (fragmento) | carácter | 2.09 KB | 1.36 KB | 746 B | 34.8 % | 1.53 : 1 | 46 | 4.27 (4.23) | 2 ms |
| Alice in Wonderland | byte | 141.01 KB | 81.11 KB | 59.90 KB | 42.5 % | 1.74 : 1 | 73 | 4.59 (4.55) | 25 ms |
| Hamlet | byte | 159.06 KB | 91.95 KB | 67.11 KB | 42.2 % | 1.73 : 1 | 67 | 4.61 (4.57) | 16 ms |
| Moby Dick | byte | 1.19 MB | 695.04 KB | 518.82 KB | 42.7 % | 1.75 : 1 | 82 | 4.58 (4.54) | 118 ms |
| Biblia King James | byte | 4.13 MB | 2.37 MB | 1.77 MB | 42.7 % | 1.75 : 1 | 75 | 4.58 (4.54) | 409 ms |
| The Man Who Was Thursday (archivo nuevo, prueba 4) | byte | 313.01 KB | 176.64 KB | 136.38 KB | 43.6 % | 1.77 : 1 | 77 | 4.51 (4.47) | 59 ms |

Los textos muy cortos **crecen**: el encabezado guarda la tabla de frecuencias y pesa más que lo que se
ahorra. En los libros completos el encabezado es menor al 0.5 % del archivo y la reducción ronda el 42 %,
a unos 0.04 bits por símbolo de la entropía. (1 KB = 1 024 B.)

> Para agregar sus propias filas: en el paso 5 del estudio, el botón **Copiar resultados en Markdown**
> copia la fila lista para pegar aquí.

## Tecnologías

| Parte | Tecnología |
|---|---|
| Página web | HTML, JavaScript (sin frameworks), Tailwind CSS 4 (CDN), CSS propio en `css/styles.css` |
| Tipografía | Geist y Geist Mono (Google Fonts) |
| Algoritmos | JavaScript y Python implementados por el equipo, sin librerías de compresión |
| Proxy de Gutenberg | Python 3 (`api/gutenberg.py`), función serverless gratuita en Vercel |
| App de escritorio | Python 3 + tkinter (biblioteca estándar) |
| Datos de libros | [Project Gutenberg](https://www.gutenberg.org/) y la API [Gutendex](https://gutendex.com/) |
| Pruebas | Node.js (`tests/`) y `unittest` de Python (`python/test_huffman.py`) |

---

## Cómo ejecutar el proyecto

### Opción 1: Visual Studio Code + Live Server (para ver y editar la página)

1. Abre la carpeta del proyecto en VS Code (**Archivo → Abrir carpeta…**).
2. Instala la extensión **Live Server** (Ritwick Dey). VS Code la sugiere al abrir la carpeta.
3. Clic derecho en `index.html` → **Open with Live Server**.

Todo funciona, incluida la búsqueda en Gutenberg. La descarga automática de libros necesita el proxy
(opción 2 o Vercel); sin él, la app intenta un proxy público y, si falla, explica cómo descargar el `.txt`
a mano y subirlo.

> También puedes abrir `index.html` con doble clic: la página y los algoritmos funcionan sin servidor.
> Para descargar libros de Gutenberg sin contratiempos usa la opción 2.

### Opción 2: servidor local con Python (todo, incluido Gutenberg)

```bash
python python/servidor.py
```

Abre `http://localhost:8000`. Sirve la página y el proxy de Gutenberg. No necesita instalar nada.

### Opción 3: aplicación de escritorio

```bash
python python/app_gui.py
```

Cuatro pestañas: Comprimir, Árbol, Inspector y Expansión mínima. Abre y guarda los mismos `.hfz` que la web.

> En Windows, si `python` no se reconoce, usa `py`. En Linux, tkinter puede requerir `sudo apt install python3-tk`.

### Pruebas automáticas

```bash
node tests/huffman.test.js                  # núcleo JS: 16 pruebas
cd python && python -m unittest -v test_huffman   # núcleo Python + prueba cruzada con la versión web
node tests/medir.js mi-libro.txt             # métricas de cualquier archivo, en Markdown
```

## Deployment (gratis)

### Vercel (recomendado: incluye el proxy de Gutenberg)

1. Sube el proyecto a GitHub.
2. Entra a [vercel.com](https://vercel.com), crea una cuenta **Hobby** (gratis) con tu GitHub.
3. **Add New → Project →** importa el repositorio. Framework Preset: **Other**. Sin comandos de build.
4. **Deploy.** Vercel publica la página y convierte `api/gutenberg.py` en una función de Python.
5. Copia la URL (`https://…vercel.app`) al inicio de este README.
6. En `index.html`, cambia `og:image` por la URL completa de `assets/og.jpg`: las redes sociales sólo leen
   imágenes con dirección absoluta.

### GitHub Pages (alternativa)

**Settings → Pages → Deploy from a branch →** `main` / `(root)`. Funciona todo salvo el proxy: la búsqueda
usa Gutendex directamente y la descarga usa el proxy público de respaldo o el método manual.

## Inicio de sesión con Google (opcional)

Sin configurar nada, la app funciona como invitado. Para activar el botón de Google (gratis):

1. [Google Cloud Console](https://console.cloud.google.com/) → crea un proyecto.
2. **APIs y servicios → Pantalla de consentimiento de OAuth** → tipo *Externo*, llena nombre y correo.
3. **Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web.**
4. En **Orígenes de JavaScript autorizados** agrega `http://localhost:5500`, `http://localhost:8000` y la URL de Vercel.
5. Copia el *Client ID* en `googleClientId` dentro de `js/config.js`.

La sesión sólo personaliza la interfaz y el historial guardado en el navegador; no hay servidor de usuarios.

---

## Estructura del proyecto

```
huffly/
├── index.html              Portada: hero con demo en vivo, cómo funciona, formato, preguntas
├── app.html                Estudio: los 7 pasos del flujo y el inspector
├── mst.html                Laboratorio de árbol de expansión mínima
├── README.md
├── .gitignore  .vercelignore
├── .vscode/
│   └── extensions.json     Recomienda Live Server y Python
├── assets/
│   ├── favicon.svg
│   └── og.jpg              Imagen para compartir en redes
├── css/
│   └── styles.css          Sistema visual: colores, vidrio, botones, árbol, tablas
├── js/
│   ├── config.js           ← EDITAR: equipo, enlaces, Client ID de Google
│   ├── huffman.js          Núcleo de Huffman y formato .hfz
│   ├── mst.js              Kruskal, Prim y Unión-Búsqueda
│   ├── samples.js          Textos de ejemplo (dominio público)
│   ├── ui.js               Navegación, pie, sesión, avisos, utilidades
│   ├── tree-view.js        Dibujo del árbol en SVG (zoom, arrastre, animación)
│   ├── gutenberg.js        Búsqueda y descarga de Gutenberg con respaldos
│   ├── landing.js          Interactividad de la portada
│   ├── app.js              Lógica del estudio
│   └── mst-view.js         Lógica del laboratorio de expansión mínima
├── api/
│   └── gutenberg.py        Proxy de Gutenberg (función de Vercel y servidor local)
├── python/
│   ├── huffman.py          Núcleo de Huffman en Python (mismo formato .hfz)
│   ├── mst.py              Kruskal y Prim en Python
│   ├── app_gui.py          Aplicación de escritorio (tkinter)
│   ├── servidor.py         Servidor local con el proxy
│   └── test_huffman.py     Pruebas de Python
├── scripts/
│   └── backlog_a_github.py Carga el backlog como issues y tarjetas del tablero
├── tests/
│   ├── huffman.test.js     Pruebas del núcleo JS
│   ├── medir.js            Métricas de compresión en Markdown
│   └── fixtures/           Archivos .hfz creados por la web para la prueba cruzada
└── docs/
    ├── formato-hfz.md      Especificación del formato
    ├── pruebas.md          Las 4 pruebas mínimas con resultados y capturas
    ├── reporte-tecnico.pdf Reporte técnico de la actividad
    ├── backlog.md          Backlog Scrum: épicas, historias, puntos y sprints
    ├── backlog.csv         El mismo backlog en tabla (lo usa el script)
    └── capturas/           Capturas de funcionamiento (web, app de escritorio y pruebas)
```

### Dónde está cada cosa (para la defensa)

| Pregunta | Archivo y función |
|---|---|
| ¿Dónde se cuentan las frecuencias? | `js/huffman.js` → `countFrequencies()` · `python/huffman.py` → `frecuencias()` |
| ¿Dónde está la cola de prioridad? | `js/huffman.js` → clase `MinHeap` · Python usa `heapq` |
| ¿Dónde está la decisión voraz? | `buildTree()` / `construir_arbol()` |
| ¿Cómo se generan los códigos? | `buildCodes()` / `construir_codigos()` |
| ¿Cómo se empaquetan los bits? | `packBits()` / `empaquetar()` |
| ¿Cómo se escribe y lee el `.hfz`? | `compress()`, `parse()` / `comprimir()`, `leer_cabecera()` |
| ¿Cómo se verifica la integridad? | `decompress()` (CRC-32) y `renderVerify()` en `js/app.js` (SHA-256, byte a byte) |
| ¿Cómo se anima el árbol? | `js/tree-view.js` → `setStep()`; `js/app.js` → `setK()` |
| ¿Kruskal y Prim? | `js/mst.js` / `python/mst.py` |
| ¿Cómo se conecta con Gutenberg? | `js/gutenberg.js` (cliente) y `api/gutenberg.py` (proxy) |

## Organización del equipo

Trabajamos con Scrum en dos sprints de una semana. El [backlog](docs/backlog.md) tiene 8 épicas y 32
historias de usuario (115 puntos) con criterios de aceptación, responsable, prioridad y estado. En el tablero
cada historia se dividió en tareas de 1 a 3 puntos: **80 tareas (T-01 a T-80)**, 40 por sprint.

| Sprint | Objetivo | Puntos |
|---|---|---:|
| Sprint 1 | Comprimir un `.txt` de punta a punta: frecuencias, árbol, códigos y `.hfz` descargable, con la portada | 61 |
| Sprint 2 | Inspector, descompresión y verificación, Project Gutenberg, expansión mínima, app de escritorio y publicación | 54 |

El tablero de GitHub Projects usa las columnas Backlog → Ready → In progress → In review → Done
(equivalentes a Backlog → Por hacer → En progreso → En revisión → Terminado). Para cargarlo:

```bash
python scripts/backlog_a_github.py --repo Pickled-pork-rinds/compresor --estado final
```

## Pruebas y evidencias

Resultados y capturas en **[docs/pruebas.md](docs/pruebas.md)**; las imágenes están en `docs/capturas/`.

| Prueba | Entrada | Resultado |
|---|---|---|
| 1. Texto pequeño | `abbacabbcd` | Frecuencias, árbol y códigos iguales al cálculo a mano (19 bits) |
| 2. Libro de Project Gutenberg | *Alice's Adventures in Wonderland*, 141.01 KB | 81.11 KB, reducción de 42.5 % |
| 3. Integridad | El `.hfz` anterior, abierto solo en el inspector | Tamaño, CRC-32, SHA-256 y byte a byte idénticos |
| 4. Archivo nuevo | *The Man Who Was Thursday*, 313.01 KB | 176.64 KB, reducción de 43.6 %, recuperado idéntico |
| Extra | `.hfz` de la web abierto en la app de Python | Descomprimido idéntico |
| Automáticas | `node tests/huffman.test.js` y `unittest` | 16 + 11 pruebas correctas |

## Uso de IA y herramientas

| Herramienta | Para qué se usó | Cómo se validó |
|---|---|---|
| Claude (Anthropic) | Estructura inicial, código de la web y de Python, diseño visual y documentación | Pruebas automáticas (JS y Python), prueba cruzada byte a byte entre ambas versiones, revisión manual del flujo completo en navegador y en la app de escritorio |

> El equipo debe poder explicar cada función; la tabla «Dónde está cada cosa» sirve de guía.

## Limitaciones conocidas

- Textos muy cortos crecen al comprimirse, porque el encabezado guarda la tabla de frecuencias.
- El proxy en Vercel responde hasta 4.4 MB; libros más grandes se descargan a mano y se suben como `.txt`.
- La búsqueda depende de Gutendex; si no responde, el proxy usa el catálogo OPDS de gutenberg.org.
- El árbol se dibuja hasta 700 hojas; con más símbolos distintos, la tabla de códigos sigue completa.
- El formato v1 admite hasta 2³² bits de datos (512 MB comprimidos); en la práctica el límite es la memoria del navegador.
- El modo carácter requiere UTF-8 válido; cualquier otro archivo se comprime en modo byte.
- El inicio de sesión con Google no se verifica en un servidor: sólo personaliza la interfaz local.
- Los estilos de Tailwind se cargan desde un CDN, así que la página necesita internet la primera vez.
