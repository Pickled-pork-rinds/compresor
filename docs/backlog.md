# Backlog del producto (Scrum)

**Estado actual:** Sprint 1 terminado (61 puntos), Sprint 2 en curso. Avance: 61 de 115 puntos (53 %).

## Objetivo del producto

Una aplicación web, publicada gratis, que comprime texto con el algoritmo de Huffman y permite entender cada paso: frecuencias, árbol voraz, códigos, archivo propio `.hfz`, inspección, descompresión y verificación. Incluye la versión en Python con interfaz gráfica y el laboratorio de árbol de expansión mínima.

## Equipo y roles

| Integrante | Rol Scrum | Áreas principales | Puntos |
|---|---|---|---:|
| Juan Manuel Murillo López | Product Owner y desarrollador | Núcleo del algoritmo, versión en Python y documentación | 29 |
| Brian Ulises Vazquez Hernandez | Scrum Master y desarrollador | Repositorio y tablero, formato .hfz, proxy de Gutenberg y despliegue | 27 |
| Francisco Javier Quintero Magaña | Desarrollador | Interfaz web, animación del árbol y laboratorio de expansión mínima | 29 |
| Erin Fernando Cuellar Gonzales | Desarrollador | Descompresión, inspector, verificación de integridad y pruebas | 30 |
| **Total** | | | **115** |

Cada integrante también revisa el trabajo de otro antes de pasarlo a «Terminado».

## Cómo trabajamos

- **Sprints de una semana:** planeación al inicio, revisión con demostración y retrospectiva al final.
- **Daily asíncrona:** cada quien escribe en el chat del equipo qué hizo, qué hará y si algo lo bloquea.
- **Tablero en GitHub Projects**, con límites de trabajo en curso:

| Columna del tablero | Equivale a | Límite |
|---|---|---:|
| Backlog | Backlog | 5 |
| Ready | Por hacer | — |
| In progress | En progreso | 3 |
| In review | En revisión | 5 |
| Done | Terminado | — |

### Definición de «Listo» (para pasar a Ready)

- La historia tiene el formato «Como… quiero… para…» y criterios de aceptación verificables.
- Está estimada en puntos y tiene responsable.
- No depende de otra historia que siga abierta.

### Definición de «Terminado» (para pasar a Done)

- Cumple todos sus criterios de aceptación.
- El código está en `main` con un commit descriptivo y las pruebas automáticas pasan.
- Funciona en computadora y en celular, sin errores en la consola.
- Otro integrante lo revisó (columna In review).
- Si cambia el formato o la forma de usar la app, la documentación está actualizada.

### Estimación

Puntos de historia en escala de Fibonacci (1, 2, 3, 5, 8), que en el tablero se registran en **Estimate**. Talla en **Size**: 1 = XS, 2 = S, 3 = M, 5 = L, 8 = XL. Prioridad en **Priority**: P0 = lo exige la actividad, P1 = importante, P2 = deseable.

## Épicas

| Épica | Objetivo | Historias | Puntos |
|---|---|---|---:|
| E1 Núcleo de Huffman | Convertir frecuencias en un árbol voraz y en códigos binarios. | HU-02, HU-03, HU-04, HU-05, HU-06 | 16 |
| E2 Formato .hfz | Guardar y recuperar un archivo comprimido real y documentado. | HU-07, HU-08, HU-09 | 11 |
| E3 Interfaz web | Que cualquier persona entienda y use el compresor desde el navegador. | HU-10, HU-11, HU-12, HU-13, HU-14, HU-15, HU-16, HU-27, HU-28 | 30 |
| E4 Versión en Python | Cumplir el entregable en Python con interfaz gráfica. | HU-17, HU-26 | 13 |
| E5 Inspector y verificación | Examinar un .hfz sin el original y comprobar la integridad. | HU-19, HU-20, HU-21 | 13 |
| E6 Project Gutenberg | Buscar y descargar libros reales desde la aplicación. | HU-22, HU-23 | 8 |
| E7 Árbol de expansión mínima | Mostrar Kruskal y Prim como otro ejemplo de técnica voraz. | HU-24, HU-25 | 8 |
| E8 Organización, calidad y publicación | Trabajar en equipo, probar, documentar y publicar gratis. | HU-01, HU-18, HU-29, HU-30, HU-31, HU-32 | 16 |

## Sprint 1: 61 puntos

**Objetivo:** Comprimir un .txt de punta a punta: frecuencias, árbol, códigos y un archivo .hfz descargable, con la portada lista.

| ID | Historia | Responsable | Puntos | Prioridad | Estado |
|---|---|---|---:|---|---|
| HU-01 | Configurar repositorio, tablero y convenciones | Brian | 2 | P0 | Terminado (Done) |
| HU-02 | Conteo de frecuencias | Juan | 3 | P0 | Terminado (Done) |
| HU-03 | Cola de prioridad con desempate determinista | Juan | 3 | P0 | Terminado (Done) |
| HU-04 | Árbol de Huffman con técnica voraz | Juan | 5 | P0 | Terminado (Done) |
| HU-05 | Generación de códigos binarios | Juan | 2 | P0 | Terminado (Done) |
| HU-06 | Empaquetado de bits | Brian | 3 | P0 | Terminado (Done) |
| HU-07 | Diseño y documentación del formato .hfz | Brian | 3 | P0 | Terminado (Done) |
| HU-08 | Escritura del archivo .hfz | Brian | 3 | P0 | Terminado (Done) |
| HU-09 | Lectura, validación y descompresión | Erin | 5 | P0 | Terminado (Done) |
| HU-10 | Sistema visual y componentes | Francisco | 3 | P1 | Terminado (Done) |
| HU-11 | Portada con demostración en vivo | Francisco | 5 | P1 | Terminado (Done) |
| HU-12 | Cargar texto: archivo, ejemplos o escrito | Francisco | 2 | P0 | Terminado (Done) |
| HU-13 | Análisis de frecuencias | Erin | 3 | P0 | Terminado (Done) |
| HU-14 | Animación de la construcción del árbol | Francisco | 5 | P0 | Terminado (Done) |
| HU-15 | Códigos, camino en el árbol y cinta de codificación | Erin | 3 | P1 | Terminado (Done) |
| HU-16 | Compresión y métricas | Brian | 3 | P0 | Terminado (Done) |
| HU-17 | Núcleo de Huffman en Python compatible con la web | Juan | 5 | P0 | Terminado (Done) |
| HU-18 | Pruebas automáticas del núcleo | Erin | 3 | P0 | Terminado (Done) |

## Sprint 2: 54 puntos

**Objetivo:** Inspeccionar, descomprimir y verificar; integrar Project Gutenberg; laboratorio de expansión mínima; app de escritorio; publicar en Vercel.

| ID | Historia | Responsable | Puntos | Prioridad | Estado |
|---|---|---|---:|---|---|
| HU-19 | Inspector: estructura del archivo | Erin | 5 | P0 | En progreso (In progress) |
| HU-20 | Inspector: frecuencias, códigos, árbol y bits | Erin | 3 | P0 | Por hacer (Ready) |
| HU-21 | Descompresión y verificación de integridad | Erin | 5 | P0 | Por hacer (Ready) |
| HU-22 | Proxy de Project Gutenberg en Python | Brian | 5 | P0 | En progreso (In progress) |
| HU-23 | Búsqueda y descarga desde el estudio | Brian | 3 | P0 | Por hacer (Ready) |
| HU-24 | Kruskal y Prim: núcleo y pruebas | Francisco | 3 | P1 | En revisión (In review) |
| HU-25 | Laboratorio animado de expansión mínima | Francisco | 5 | P1 | Por hacer (Ready) |
| HU-26 | Aplicación de escritorio con tkinter | Juan | 8 | P1 | En progreso (In progress) |
| HU-27 | Portada completa | Francisco | 3 | P2 | Backlog (Backlog) |
| HU-28 | Inicio de sesión opcional e historial | Francisco | 3 | P2 | Backlog (Backlog) |
| HU-29 | Despliegue en Vercel | Brian | 2 | P0 | Por hacer (Ready) |
| HU-30 | Pruebas mínimas con evidencias | Erin | 3 | P0 | Backlog (Backlog) |
| HU-31 | README y documentación final | Juan | 3 | P0 | Backlog (Backlog) |
| HU-32 | Reporte técnico en PDF | Brian | 3 | P0 | Backlog (Backlog) |

## Historias de usuario

### HU-01 · Configurar repositorio, tablero y convenciones

*Como equipo, quiero un repositorio y un tablero compartidos para organizar el trabajo y que se vea el avance de cada quien.*

- **Épica:** E8 Organización, calidad y publicación · **Sprint 1** · **2 puntos** (S) · **P0**
- **Responsable:** Brian Ulises Vazquez Hernandez
- **Resultado esperado:** Repositorio y tablero en GitHub
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Repositorio público con README inicial
  - [x] Tablero con Backlog, Ready, In progress, In review y Done
  - [x] Convención de commits: feat, fix, docs, test

### HU-02 · Conteo de frecuencias

*Como usuario, quiero saber cuántas veces aparece cada símbolo de mi texto para entender qué se puede comprimir.*

- **Épica:** E1 Núcleo de Huffman · **Sprint 1** · **3 puntos** (M) · **P0**
- **Responsable:** Juan Manuel Murillo López
- **Resultado esperado:** countFrequencies() en js/huffman.js
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Cuenta bytes (0 a 255) y caracteres Unicode
  - [x] abbacabbcd da a = 3, b = 4, c = 2, d = 1
  - [x] Recorre el texto una sola vez: O(n)

### HU-03 · Cola de prioridad con desempate determinista

*Como desarrollador, quiero un montículo mínimo que ordene por frecuencia y, en empate, por orden de creación para que el compresor y el descompresor construyan exactamente el mismo árbol.*

- **Épica:** E1 Núcleo de Huffman · **Sprint 1** · **3 puntos** (M) · **P0**
- **Responsable:** Juan Manuel Murillo López
- **Resultado esperado:** Clase MinHeap
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] push y pop en O(log n)
  - [x] En empate sale primero el nodo creado antes
  - [x] Pruebas automáticas del orden de salida

### HU-04 · Árbol de Huffman con técnica voraz

*Como estudiante, quiero que el árbol se construya uniendo siempre los dos nodos de menor frecuencia para aplicar la técnica voraz vista en clase.*

- **Épica:** E1 Núcleo de Huffman · **Sprint 1** · **5 puntos** (L) · **P0**
- **Responsable:** Juan Manuel Murillo López
- **Resultado esperado:** buildTree()
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Con k símbolos se hacen k − 1 uniones
  - [x] Cada unión queda registrada para poder animarla
  - [x] El ejemplo del pizarrón produce el árbol de clase

### HU-05 · Generación de códigos binarios

*Como usuario, quiero ver el código binario de cada símbolo para saber cuántos bits ocupa cada letra.*

- **Épica:** E1 Núcleo de Huffman · **Sprint 1** · **2 puntos** (S) · **P0**
- **Responsable:** Juan Manuel Murillo López
- **Resultado esperado:** buildCodes()
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Izquierda = 0 y derecha = 1
  - [x] Si hay un solo símbolo distinto, su código es 0
  - [x] abbacabbcd da b = 0, a = 10, d = 110, c = 111

### HU-06 · Empaquetado de bits

*Como usuario, quiero que los códigos se guarden de 8 en 8 bits para que el archivo realmente pese menos que el original.*

- **Épica:** E1 Núcleo de Huffman · **Sprint 1** · **3 puntos** (M) · **P0**
- **Responsable:** Brian Ulises Vazquez Hernandez
- **Resultado esperado:** packBits()
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] El primer bit va en el bit más significativo del primer byte
  - [x] Los 19 bits del pizarrón quedan como 8B C7 C0
  - [x] El relleno del último byte queda registrado

### HU-07 · Diseño y documentación del formato .hfz

*Como profesor, quiero un formato propio documentado para evaluar qué guarda el archivo y cómo se reconstruye.*

- **Épica:** E2 Formato .hfz · **Sprint 1** · **3 puntos** (M) · **P0**
- **Responsable:** Brian Ulises Vazquez Hernandez
- **Resultado esperado:** docs/formato-hfz.md
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Incluye firma y versión, tamaño original, bits válidos, relleno y CRC-32
  - [x] Guarda la tabla de frecuencias, nunca el texto original
  - [x] Documento con un ejemplo explicado byte por byte

### HU-08 · Escritura del archivo .hfz

*Como usuario, quiero descargar un archivo comprimido real para guardarlo y compartirlo.*

- **Épica:** E2 Formato .hfz · **Sprint 1** · **3 puntos** (M) · **P0**
- **Responsable:** Brian Ulises Vazquez Hernandez
- **Resultado esperado:** compress()
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Encabezado + datos con la estructura documentada
  - [x] Guarda nombre original y fecha como metadatos
  - [x] Ancho de frecuencia mínimo (1 a 4 bytes) para ahorrar espacio

### HU-09 · Lectura, validación y descompresión

*Como usuario, quiero recuperar exactamente mi texto desde el .hfz para no depender del .txt original.*

- **Épica:** E2 Formato .hfz · **Sprint 1** · **5 puntos** (L) · **P0**
- **Responsable:** Erin Fernando Cuellar Gonzales
- **Resultado esperado:** parse() y decompress()
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Rechaza firma o versión desconocidas y archivos truncados
  - [x] Reconstruye el árbol sólo con la tabla de frecuencias
  - [x] El CRC-32 coincide en 300 pruebas aleatorias de ida y vuelta

### HU-10 · Sistema visual y componentes

*Como usuario, quiero una interfaz clara y consistente para concentrarme en el algoritmo y no en descifrar la página.*

- **Épica:** E3 Interfaz web · **Sprint 1** · **3 puntos** (M) · **P1**
- **Responsable:** Francisco Javier Quintero Magaña
- **Resultado esperado:** css/styles.css
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Paleta, tipografía y espaciado definidos como tokens
  - [x] Botones, tarjetas de vidrio, tablas y formularios reutilizables
  - [x] Foco visible y respeto a «movimiento reducido»

### HU-11 · Portada con demostración en vivo

*Como visitante, quiero entender en segundos qué hace la aplicación para decidir si quiero usarla.*

- **Épica:** E3 Interfaz web · **Sprint 1** · **5 puntos** (L) · **P1**
- **Responsable:** Francisco Javier Quintero Magaña
- **Resultado esperado:** index.html y js/landing.js
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Barra fija con llamada a la acción
  - [x] Maqueta que comprime en vivo lo que escribo
  - [x] Sección «cómo funciona» con el ejemplo del pizarrón
  - [x] Se adapta a celular, tableta y computadora

### HU-12 · Cargar texto: archivo, ejemplos o escrito

*Como usuario, quiero subir un .txt, elegir un ejemplo o escribir mi propio texto para empezar a comprimir sin complicaciones.*

- **Épica:** E3 Interfaz web · **Sprint 1** · **2 puntos** (S) · **P0**
- **Responsable:** Francisco Javier Quintero Magaña
- **Resultado esperado:** Paso 1 del estudio
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Arrastrar y soltar un .txt de cualquier tamaño
  - [x] Ejemplos de dominio público incluidos
  - [x] Vista previa con tamaño, líneas y codificación detectada

### HU-13 · Análisis de frecuencias

*Como estudiante, quiero ver la tabla y el histograma de frecuencias para relacionarlos con el árbol que se va a construir.*

- **Épica:** E3 Interfaz web · **Sprint 1** · **3 puntos** (M) · **P0**
- **Responsable:** Erin Fernando Cuellar Gonzales
- **Resultado esperado:** Paso 2 del estudio
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Tabla que se puede buscar y ordenar
  - [x] Histograma de los símbolos más frecuentes
  - [x] Entropía y modo de símbolo (carácter o byte)

### HU-14 · Animación de la construcción del árbol

*Como estudiante, quiero ver cada unión voraz paso a paso para entender cómo se forma el árbol.*

- **Épica:** E3 Interfaz web · **Sprint 1** · **5 puntos** (L) · **P0**
- **Responsable:** Francisco Javier Quintero Magaña
- **Resultado esperado:** js/tree-view.js y paso 3 del estudio
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Reproducir, pausar, avanzar, retroceder y ajustar la velocidad
  - [x] Cola de prioridad visible con los dos menores resaltados
  - [x] Narración de cada unión; zoom y arrastre del árbol

### HU-15 · Códigos, camino en el árbol y cinta de codificación

*Como estudiante, quiero ver el código de cada símbolo y su camino desde la raíz para comprobar por qué los frecuentes usan menos bits.*

- **Épica:** E3 Interfaz web · **Sprint 1** · **3 puntos** (M) · **P1**
- **Responsable:** Erin Fernando Cuellar Gonzales
- **Resultado esperado:** Paso 4 del estudio
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Tabla con longitud y bits aportados por símbolo
  - [x] Camino raíz → hoja resaltado al elegir un símbolo
  - [x] Longitud media comparada con la entropía

### HU-16 · Compresión y métricas

*Como usuario, quiero ver cuánto espacio ahorré para evaluar la eficiencia de la compresión.*

- **Épica:** E3 Interfaz web · **Sprint 1** · **3 puntos** (M) · **P0**
- **Responsable:** Brian Ulises Vazquez Hernandez
- **Resultado esperado:** Paso 5 del estudio
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Original y comprimido en bytes y en KB o MB
  - [x] Ahorro, porcentaje de reducción, razón y símbolos distintos
  - [x] Descargar el .hfz y copiar los resultados en Markdown

### HU-17 · Núcleo de Huffman en Python compatible con la web

*Como profesor, quiero una implementación en Python para cumplir el lenguaje que pide la actividad.*

- **Épica:** E4 Versión en Python · **Sprint 1** · **5 puntos** (L) · **P0**
- **Responsable:** Juan Manuel Murillo López
- **Resultado esperado:** python/huffman.py
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Genera el mismo .hfz que la web, byte por byte
  - [x] Abre los archivos creados en el navegador (prueba cruzada)
  - [x] Comprime un libro de 2.6 MB en menos de un segundo

### HU-18 · Pruebas automáticas del núcleo

*Como equipo, quiero pruebas que se ejecuten con un comando para detectar errores antes de entregar.*

- **Épica:** E8 Organización, calidad y publicación · **Sprint 1** · **3 puntos** (M) · **P0**
- **Responsable:** Erin Fernando Cuellar Gonzales
- **Resultado esperado:** tests/huffman.test.js y python/test_huffman.py
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Casos: pizarrón, Unicode, Latin-1, vacío, un símbolo y los 256 bytes
  - [x] Archivos dañados, truncados y con versión desconocida
  - [x] JavaScript y Python en verde

### HU-19 · Inspector: estructura del archivo

*Como usuario, quiero abrir un .hfz sin el original y ver cómo está hecho para entender qué guarda antes de descomprimir.*

- **Épica:** E5 Inspector y verificación · **Sprint 2** · **5 puntos** (L) · **P0**
- **Responsable:** Erin Fernando Cuellar Gonzales
- **Resultado esperado:** Paso 6 del estudio (estructura)
- **Estado:** En progreso (In progress)
- **Criterios de aceptación:**
  - [ ] Volcado hexadecimal coloreado por campo
  - [ ] Tabla de campos con su tamaño y su valor
  - [ ] Nombre, versión, tamaños, ahorro, porcentaje, símbolos y bits

### HU-20 · Inspector: frecuencias, códigos, árbol y bits

*Como estudiante, quiero ver la tabla, los códigos y el árbol reconstruidos desde el archivo para comprobar que no hace falta el texto original.*

- **Épica:** E5 Inspector y verificación · **Sprint 2** · **3 puntos** (M) · **P0**
- **Responsable:** Erin Fernando Cuellar Gonzales
- **Resultado esperado:** Pestañas del inspector
- **Estado:** Por hacer (Ready)
- **Criterios de aceptación:**
  - [ ] Tabla de frecuencias leída del encabezado
  - [ ] Códigos y árbol reconstruidos con el mismo algoritmo
  - [ ] Primeros bits de datos agrupados y el relleno marcado

### HU-21 · Descompresión y verificación de integridad

*Como usuario, quiero descomprimir de forma explícita y comprobar que el resultado es idéntico para confiar en el compresor.*

- **Épica:** E5 Inspector y verificación · **Sprint 2** · **5 puntos** (L) · **P0**
- **Responsable:** Erin Fernando Cuellar Gonzales
- **Resultado esperado:** Paso 7 del estudio
- **Estado:** Por hacer (Ready)
- **Criterios de aceptación:**
  - [ ] El inspector no muestra el texto hasta pulsar «Descomprimir»
  - [ ] Compara tamaño y CRC-32; SHA-256 y byte a byte si el original está abierto
  - [ ] Descarga recuperado.txt

### HU-22 · Proxy de Project Gutenberg en Python

*Como usuario, quiero que la aplicación descargue libros de Gutenberg para no tener que bajarlos a mano.*

- **Épica:** E6 Project Gutenberg · **Sprint 2** · **5 puntos** (L) · **P0**
- **Responsable:** Brian Ulises Vazquez Hernandez
- **Resultado esperado:** api/gutenberg.py y python/servidor.py
- **Estado:** En progreso (In progress)
- **Criterios de aceptación:**
  - [ ] Busca por título, autor o palabra clave y descarga por número de libro
  - [ ] Sólo consulta gutenberg.org: no es un proxy abierto
  - [ ] Respaldo con el catálogo OPDS; funciona en Vercel y en local

### HU-23 · Búsqueda y descarga desde el estudio

*Como usuario, quiero buscar un libro y usarlo con un clic para comprimir textos reales y grandes.*

- **Épica:** E6 Project Gutenberg · **Sprint 2** · **3 puntos** (M) · **P0**
- **Responsable:** Brian Ulises Vazquez Hernandez
- **Resultado esperado:** js/gutenberg.js
- **Estado:** Por hacer (Ready)
- **Criterios de aceptación:**
  - [ ] Resultados con autor, idioma y número de descargas
  - [ ] Progreso de la descarga y opción de quitar la licencia
  - [ ] Instrucciones claras si la descarga automática falla

### HU-24 · Kruskal y Prim: núcleo y pruebas

*Como estudiante, quiero implementaciones correctas de Kruskal y Prim para comparar dos algoritmos voraces.*

- **Épica:** E7 Árbol de expansión mínima · **Sprint 2** · **3 puntos** (M) · **P1**
- **Responsable:** Francisco Javier Quintero Magaña
- **Resultado esperado:** js/mst.js y python/mst.py
- **Estado:** En revisión (In review)
- **Criterios de aceptación:**
  - [ ] Unión-Búsqueda con compresión de caminos
  - [ ] Ambos obtienen el mismo peso en 300 grafos aleatorios
  - [ ] Versión en JavaScript y en Python

### HU-25 · Laboratorio animado de expansión mínima

*Como estudiante, quiero ver Kruskal y Prim paso a paso para entender por qué la elección voraz es correcta.*

- **Épica:** E7 Árbol de expansión mínima · **Sprint 2** · **5 puntos** (L) · **P1**
- **Responsable:** Francisco Javier Quintero Magaña
- **Resultado esperado:** mst.html y js/mst-view.js
- **Estado:** Por hacer (Ready)
- **Criterios de aceptación:**
  - [ ] Pseudocódigo con la línea actual resaltada
  - [ ] Componentes por color en Kruskal y frontera en Prim
  - [ ] Vértices arrastrables y grafos nuevos con un clic

### HU-26 · Aplicación de escritorio con tkinter

*Como profesor, quiero una interfaz gráfica en Python para cumplir el entregable de la actividad 5.*

- **Épica:** E4 Versión en Python · **Sprint 2** · **8 puntos** (XL) · **P1**
- **Responsable:** Juan Manuel Murillo López
- **Resultado esperado:** python/app_gui.py
- **Estado:** En progreso (In progress)
- **Criterios de aceptación:**
  - [ ] Comprimir, guardar y descomprimir .hfz
  - [ ] Árbol animado, inspector y laboratorio de expansión mínima
  - [ ] Abre los archivos creados en la versión web

### HU-27 · Portada completa

*Como visitante, quiero ver todas las funciones, el formato interactivo y las preguntas frecuentes para conocer el producto sin abrir el estudio.*

- **Épica:** E3 Interfaz web · **Sprint 2** · **3 puntos** (M) · **P2**
- **Responsable:** Francisco Javier Quintero Magaña
- **Resultado esperado:** index.html (secciones finales)
- **Estado:** Backlog (Backlog)
- **Criterios de aceptación:**
  - [ ] Tarjetas de funciones con datos reales
  - [ ] Mapa de bytes del .hfz que se explica al pasar el cursor
  - [ ] Preguntas frecuentes e imagen para compartir en redes

### HU-28 · Inicio de sesión opcional e historial

*Como usuario, quiero iniciar sesión con Google si quiero para guardar mi historial de compresiones.*

- **Épica:** E3 Interfaz web · **Sprint 2** · **3 puntos** (M) · **P2**
- **Responsable:** Francisco Javier Quintero Magaña
- **Resultado esperado:** js/ui.js (sesión e historial)
- **Estado:** Backlog (Backlog)
- **Criterios de aceptación:**
  - [ ] Funciona como invitado si no hay Client ID configurado
  - [ ] Historial guardado sólo en el navegador
  - [ ] Cerrar sesión desde el menú de usuario

### HU-29 · Despliegue en Vercel

*Como profesor, quiero abrir la aplicación desde una URL pública para revisarla sin instalar nada.*

- **Épica:** E8 Organización, calidad y publicación · **Sprint 2** · **2 puntos** (S) · **P0**
- **Responsable:** Brian Ulises Vazquez Hernandez
- **Resultado esperado:** URL pública en el README
- **Estado:** Por hacer (Ready)
- **Criterios de aceptación:**
  - [ ] Publicación gratuita conectada a GitHub
  - [ ] El proxy responde en /api/gutenberg
  - [ ] Se actualiza sola con cada push a main

### HU-30 · Pruebas mínimas con evidencias

*Como profesor, quiero evidencia de las cuatro pruebas mínimas para comprobar que la aplicación funciona con textos nuevos.*

- **Épica:** E8 Organización, calidad y publicación · **Sprint 2** · **3 puntos** (M) · **P0**
- **Responsable:** Erin Fernando Cuellar Gonzales
- **Resultado esperado:** docs/pruebas.md
- **Estado:** Backlog (Backlog)
- **Criterios de aceptación:**
  - [ ] Texto pequeño, libro de Gutenberg, integridad y archivo nuevo
  - [ ] Capturas en docs/capturas
  - [ ] Resultados anotados en docs/pruebas.md

### HU-31 · README y documentación final

*Como profesor, quiero un README completo para entender el proyecto, ejecutarlo y evaluarlo.*

- **Épica:** E8 Organización, calidad y publicación · **Sprint 2** · **3 puntos** (M) · **P0**
- **Responsable:** Juan Manuel Murillo López
- **Resultado esperado:** README.md
- **Estado:** Backlog (Backlog)
- **Criterios de aceptación:**
  - [ ] Todas las secciones que pide la actividad
  - [ ] Resultados de compresión, uso de IA y limitaciones
  - [ ] Tabla de «dónde está cada cosa» para la defensa

### HU-32 · Reporte técnico en PDF

*Como profesor, quiero un reporte breve según la Guía de Reportes para evaluar el análisis del algoritmo.*

- **Épica:** E8 Organización, calidad y publicación · **Sprint 2** · **3 puntos** (M) · **P0**
- **Responsable:** Brian Ulises Vazquez Hernandez
- **Resultado esperado:** Reporte PDF
- **Estado:** Backlog (Backlog)
- **Criterios de aceptación:**
  - [ ] Sigue la Guía de Reportes
  - [ ] Incluye resultados, capturas y conclusiones
  - [ ] Entregado en PDF

## Cargar el backlog al tablero de GitHub

`scripts/backlog_a_github.py` crea una *issue* por historia (con etiqueta de épica y milestone de sprint), la agrega al tablero y llena **Status**, **Priority**, **Size** y **Estimate**. Lo corre quien tenga permiso de escritura en el repositorio y en el tablero:

```bash
gh auth login                 # una sola vez
gh auth refresh -s project    # permiso para editar tableros
python scripts/backlog_a_github.py --repo brianvazquez999/Tecnica_Voraz_Huffman --estado mitad
```

Con `--estado final` usa la columna `estado_final` del CSV y cierra las issues terminadas. Se puede correr varias veces: no duplica historias, sólo actualiza sus campos. Con `--simular` muestra lo que haría sin tocar GitHub.
