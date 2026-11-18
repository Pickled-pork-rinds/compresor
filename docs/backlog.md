# Backlog del producto (Scrum)

**Estado actual:** proyecto terminado. Avance: 115 de 115 puntos (100 %): las 32 historias y las 80 tareas del tablero están en Done.

## Objetivo del producto

Una aplicación web, publicada gratis, que comprime texto con el algoritmo de Huffman y permite entender cada paso: frecuencias, árbol voraz, códigos, archivo propio `.hfz`, inspección, descompresión y verificación. Incluye la versión en Python con interfaz gráfica y el laboratorio de árbol de expansión mínima.

## Equipo y roles

| Integrante | Rol Scrum | Áreas principales | Puntos |
|---|---|---|---:|
| Juan Manuel Murillo Lopez | Product Owner y desarrollador | Núcleo del algoritmo, versión en Python y documentación | 29 |
| Brian Ulises Vazquez Hernandez | Scrum Master y desarrollador | Repositorio y tablero, formato .hfz, proxy de Gutenberg y despliegue | 27 |
| Francisco Javier Quintero Magaña | Desarrollador | Interfaz web, animación del árbol y laboratorio de expansión mínima | 29 |
| Erin Fernando Cuellar Gonzalez | Desarrollador | Descompresión, inspector, verificación de integridad y pruebas | 30 |
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
| HU-19 | Inspector: estructura del archivo | Erin | 5 | P0 | Terminado (Done) |
| HU-20 | Inspector: frecuencias, códigos, árbol y bits | Erin | 3 | P0 | Terminado (Done) |
| HU-21 | Descompresión y verificación de integridad | Erin | 5 | P0 | Terminado (Done) |
| HU-22 | Proxy de Project Gutenberg en Python | Brian | 5 | P0 | Terminado (Done) |
| HU-23 | Búsqueda y descarga desde el estudio | Brian | 3 | P0 | Terminado (Done) |
| HU-24 | Kruskal y Prim: núcleo y pruebas | Francisco | 3 | P1 | Terminado (Done) |
| HU-25 | Laboratorio animado de expansión mínima | Francisco | 5 | P1 | Terminado (Done) |
| HU-26 | Aplicación de escritorio con tkinter | Juan | 8 | P1 | Terminado (Done) |
| HU-27 | Portada completa | Francisco | 3 | P2 | Terminado (Done) |
| HU-28 | Inicio de sesión opcional e historial | Francisco | 3 | P2 | Terminado (Done) |
| HU-29 | Despliegue en Vercel | Brian | 2 | P0 | Terminado (Done) |
| HU-30 | Pruebas mínimas con evidencias | Erin | 3 | P0 | Terminado (Done) |
| HU-31 | README y documentación final | Juan | 3 | P0 | Terminado (Done) |
| HU-32 | Reporte técnico en PDF | Brian | 3 | P0 | Terminado (Done) |

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
- **Responsable:** Juan Manuel Murillo Lopez
- **Resultado esperado:** countFrequencies() en js/huffman.js
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Cuenta bytes (0 a 255) y caracteres Unicode
  - [x] abbacabbcd da a = 3, b = 4, c = 2, d = 1
  - [x] Recorre el texto una sola vez: O(n)

### HU-03 · Cola de prioridad con desempate determinista

*Como desarrollador, quiero un montículo mínimo que ordene por frecuencia y, en empate, por orden de creación para que el compresor y el descompresor construyan exactamente el mismo árbol.*

- **Épica:** E1 Núcleo de Huffman · **Sprint 1** · **3 puntos** (M) · **P0**
- **Responsable:** Juan Manuel Murillo Lopez
- **Resultado esperado:** Clase MinHeap
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] push y pop en O(log n)
  - [x] En empate sale primero el nodo creado antes
  - [x] Pruebas automáticas del orden de salida

### HU-04 · Árbol de Huffman con técnica voraz

*Como estudiante, quiero que el árbol se construya uniendo siempre los dos nodos de menor frecuencia para aplicar la técnica voraz vista en clase.*

- **Épica:** E1 Núcleo de Huffman · **Sprint 1** · **5 puntos** (L) · **P0**
- **Responsable:** Juan Manuel Murillo Lopez
- **Resultado esperado:** buildTree()
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Con k símbolos se hacen k − 1 uniones
  - [x] Cada unión queda registrada para poder animarla
  - [x] El ejemplo del pizarrón produce el árbol de clase

### HU-05 · Generación de códigos binarios

*Como usuario, quiero ver el código binario de cada símbolo para saber cuántos bits ocupa cada letra.*

- **Épica:** E1 Núcleo de Huffman · **Sprint 1** · **2 puntos** (S) · **P0**
- **Responsable:** Juan Manuel Murillo Lopez
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
- **Responsable:** Erin Fernando Cuellar Gonzalez
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
- **Responsable:** Erin Fernando Cuellar Gonzalez
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
- **Responsable:** Erin Fernando Cuellar Gonzalez
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
- **Responsable:** Juan Manuel Murillo Lopez
- **Resultado esperado:** python/huffman.py
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Genera el mismo .hfz que la web, byte por byte
  - [x] Abre los archivos creados en el navegador (prueba cruzada)
  - [x] Comprime un libro de 2.6 MB en menos de un segundo

### HU-18 · Pruebas automáticas del núcleo

*Como equipo, quiero pruebas que se ejecuten con un comando para detectar errores antes de entregar.*

- **Épica:** E8 Organización, calidad y publicación · **Sprint 1** · **3 puntos** (M) · **P0**
- **Responsable:** Erin Fernando Cuellar Gonzalez
- **Resultado esperado:** tests/huffman.test.js y python/test_huffman.py
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Casos: pizarrón, Unicode, Latin-1, vacío, un símbolo y los 256 bytes
  - [x] Archivos dañados, truncados y con versión desconocida
  - [x] JavaScript y Python en verde

### HU-19 · Inspector: estructura del archivo

*Como usuario, quiero abrir un .hfz sin el original y ver cómo está hecho para entender qué guarda antes de descomprimir.*

- **Épica:** E5 Inspector y verificación · **Sprint 2** · **5 puntos** (L) · **P0**
- **Responsable:** Erin Fernando Cuellar Gonzalez
- **Resultado esperado:** Paso 6 del estudio (estructura)
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Volcado hexadecimal coloreado por campo
  - [x] Tabla de campos con su tamaño y su valor
  - [x] Nombre, versión, tamaños, ahorro, porcentaje, símbolos y bits

### HU-20 · Inspector: frecuencias, códigos, árbol y bits

*Como estudiante, quiero ver la tabla, los códigos y el árbol reconstruidos desde el archivo para comprobar que no hace falta el texto original.*

- **Épica:** E5 Inspector y verificación · **Sprint 2** · **3 puntos** (M) · **P0**
- **Responsable:** Erin Fernando Cuellar Gonzalez
- **Resultado esperado:** Pestañas del inspector
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Tabla de frecuencias leída del encabezado
  - [x] Códigos y árbol reconstruidos con el mismo algoritmo
  - [x] Primeros bits de datos agrupados y el relleno marcado

### HU-21 · Descompresión y verificación de integridad

*Como usuario, quiero descomprimir de forma explícita y comprobar que el resultado es idéntico para confiar en el compresor.*

- **Épica:** E5 Inspector y verificación · **Sprint 2** · **5 puntos** (L) · **P0**
- **Responsable:** Erin Fernando Cuellar Gonzalez
- **Resultado esperado:** Paso 7 del estudio
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] El inspector no muestra el texto hasta pulsar «Descomprimir»
  - [x] Compara tamaño y CRC-32; SHA-256 y byte a byte si el original está abierto
  - [x] Descarga recuperado.txt

### HU-22 · Proxy de Project Gutenberg en Python

*Como usuario, quiero que la aplicación descargue libros de Gutenberg para no tener que bajarlos a mano.*

- **Épica:** E6 Project Gutenberg · **Sprint 2** · **5 puntos** (L) · **P0**
- **Responsable:** Brian Ulises Vazquez Hernandez
- **Resultado esperado:** api/gutenberg.py y python/servidor.py
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Busca por título, autor o palabra clave y descarga por número de libro
  - [x] Sólo consulta gutenberg.org: no es un proxy abierto
  - [x] Respaldo con el catálogo OPDS; funciona en Vercel y en local

### HU-23 · Búsqueda y descarga desde el estudio

*Como usuario, quiero buscar un libro y usarlo con un clic para comprimir textos reales y grandes.*

- **Épica:** E6 Project Gutenberg · **Sprint 2** · **3 puntos** (M) · **P0**
- **Responsable:** Brian Ulises Vazquez Hernandez
- **Resultado esperado:** js/gutenberg.js
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Resultados con autor, idioma y número de descargas
  - [x] Progreso de la descarga y opción de quitar la licencia
  - [x] Instrucciones claras si la descarga automática falla

### HU-24 · Kruskal y Prim: núcleo y pruebas

*Como estudiante, quiero implementaciones correctas de Kruskal y Prim para comparar dos algoritmos voraces.*

- **Épica:** E7 Árbol de expansión mínima · **Sprint 2** · **3 puntos** (M) · **P1**
- **Responsable:** Francisco Javier Quintero Magaña
- **Resultado esperado:** js/mst.js y python/mst.py
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Unión-Búsqueda con compresión de caminos
  - [x] Ambos obtienen el mismo peso en 300 grafos aleatorios
  - [x] Versión en JavaScript y en Python

### HU-25 · Laboratorio animado de expansión mínima

*Como estudiante, quiero ver Kruskal y Prim paso a paso para entender por qué la elección voraz es correcta.*

- **Épica:** E7 Árbol de expansión mínima · **Sprint 2** · **5 puntos** (L) · **P1**
- **Responsable:** Francisco Javier Quintero Magaña
- **Resultado esperado:** mst.html y js/mst-view.js
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Pseudocódigo con la línea actual resaltada
  - [x] Componentes por color en Kruskal y frontera en Prim
  - [x] Vértices arrastrables y grafos nuevos con un clic

### HU-26 · Aplicación de escritorio con tkinter

*Como profesor, quiero una interfaz gráfica en Python para cumplir el entregable de la actividad 5.*

- **Épica:** E4 Versión en Python · **Sprint 2** · **8 puntos** (XL) · **P1**
- **Responsable:** Juan Manuel Murillo Lopez
- **Resultado esperado:** python/app_gui.py
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Comprimir, guardar y descomprimir .hfz
  - [x] Árbol animado, inspector y laboratorio de expansión mínima
  - [x] Abre los archivos creados en la versión web

### HU-27 · Portada completa

*Como visitante, quiero ver todas las funciones, el formato interactivo y las preguntas frecuentes para conocer el producto sin abrir el estudio.*

- **Épica:** E3 Interfaz web · **Sprint 2** · **3 puntos** (M) · **P2**
- **Responsable:** Francisco Javier Quintero Magaña
- **Resultado esperado:** index.html (secciones finales)
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Tarjetas de funciones con datos reales
  - [x] Mapa de bytes del .hfz que se explica al pasar el cursor
  - [x] Preguntas frecuentes e imagen para compartir en redes

### HU-28 · Inicio de sesión opcional e historial

*Como usuario, quiero iniciar sesión con Google si quiero para guardar mi historial de compresiones.*

- **Épica:** E3 Interfaz web · **Sprint 2** · **3 puntos** (M) · **P2**
- **Responsable:** Francisco Javier Quintero Magaña
- **Resultado esperado:** js/ui.js (sesión e historial)
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Funciona como invitado si no hay Client ID configurado
  - [x] Historial guardado sólo en el navegador
  - [x] Cerrar sesión desde el menú de usuario

### HU-29 · Despliegue en Vercel

*Como profesor, quiero abrir la aplicación desde una URL pública para revisarla sin instalar nada.*

- **Épica:** E8 Organización, calidad y publicación · **Sprint 2** · **2 puntos** (S) · **P0**
- **Responsable:** Brian Ulises Vazquez Hernandez
- **Resultado esperado:** URL pública en el README
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Publicación gratuita conectada a GitHub
  - [x] El proxy responde en /api/gutenberg
  - [x] Se actualiza sola con cada push a main

### HU-30 · Pruebas mínimas con evidencias

*Como profesor, quiero evidencia de las cuatro pruebas mínimas para comprobar que la aplicación funciona con textos nuevos.*

- **Épica:** E8 Organización, calidad y publicación · **Sprint 2** · **3 puntos** (M) · **P0**
- **Responsable:** Erin Fernando Cuellar Gonzalez
- **Resultado esperado:** docs/pruebas.md
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Texto pequeño, libro de Gutenberg, integridad y archivo nuevo
  - [x] Capturas en docs/capturas
  - [x] Resultados anotados en docs/pruebas.md

### HU-31 · README y documentación final

*Como profesor, quiero un README completo para entender el proyecto, ejecutarlo y evaluarlo.*

- **Épica:** E8 Organización, calidad y publicación · **Sprint 2** · **3 puntos** (M) · **P0**
- **Responsable:** Juan Manuel Murillo Lopez
- **Resultado esperado:** README.md
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Todas las secciones que pide la actividad
  - [x] Resultados de compresión, uso de IA y limitaciones
  - [x] Tabla de «dónde está cada cosa» para la defensa

### HU-32 · Reporte técnico en PDF

*Como profesor, quiero un reporte breve según la Guía de Reportes para evaluar el análisis del algoritmo.*

- **Épica:** E8 Organización, calidad y publicación · **Sprint 2** · **3 puntos** (M) · **P0**
- **Responsable:** Brian Ulises Vazquez Hernandez
- **Resultado esperado:** Reporte PDF
- **Estado:** Terminado (Done)
- **Criterios de aceptación:**
  - [x] Sigue la Guía de Reportes
  - [x] Incluye resultados, capturas y conclusiones
  - [x] Entregado en PDF

## Tareas del tablero (T-01 a T-80)

En GitHub Projects cada historia se dividió en tareas de 1 a 3 puntos: 40 por sprint. Todas tienen responsable, estimación, prioridad y criterios de aceptación.

| Tarea | Historia | Responsable | Puntos | Prioridad | Sprint | Estado |
|---|---|---|---:|---|---|---|
| T-01 · Crear el repositorio público con README inicial | HU-01 | Brian Ulises Vazquez Hernandez | 1 | P0 | Sprint 1 | Done |
| T-02 · Configurar el tablero con columnas y campos | HU-01 | Brian Ulises Vazquez Hernandez | 1 | P0 | Sprint 1 | Done |
| T-03 · Definir la convención de commits y el .gitignore | HU-01 | Erin Fernando Cuellar Gonzalez | 1 | P1 | Sprint 1 | Done |
| T-04 · Contar frecuencias por byte | HU-02 | Juan Manuel Murillo Lopez | 1 | P0 | Sprint 1 | Done |
| T-05 · Contar frecuencias por carácter Unicode | HU-02 | Juan Manuel Murillo Lopez | 2 | P0 | Sprint 1 | Done |
| T-06 · Implementar el montículo mínimo | HU-03 | Juan Manuel Murillo Lopez | 2 | P0 | Sprint 1 | Done |
| T-07 · Desempate determinista por orden de creación | HU-03 | Juan Manuel Murillo Lopez | 1 | P0 | Sprint 1 | Done |
| T-08 · Construir el árbol uniendo los dos nodos menores | HU-04 | Juan Manuel Murillo Lopez | 2 | P0 | Sprint 1 | Done |
| T-09 · Registrar cada unión para animarla | HU-04 | Francisco Javier Quintero Magaña | 1 | P1 | Sprint 1 | Done |
| T-10 · Generar los códigos recorriendo el árbol | HU-05 | Juan Manuel Murillo Lopez | 2 | P0 | Sprint 1 | Done |
| T-11 · Caso especial: un solo símbolo distinto | HU-05 | Erin Fernando Cuellar Gonzalez | 1 | P1 | Sprint 1 | Done |
| T-12 · Empaquetar los bits de 8 en 8 | HU-06 | Brian Ulises Vazquez Hernandez | 2 | P0 | Sprint 1 | Done |
| T-13 · Registrar el relleno del último byte | HU-06 | Brian Ulises Vazquez Hernandez | 1 | P0 | Sprint 1 | Done |
| T-14 · Calcular el CRC-32 del texto original | HU-07 | Brian Ulises Vazquez Hernandez | 2 | P0 | Sprint 1 | Done |
| T-15 · Escribir la especificación del formato .hfz | HU-07 | Brian Ulises Vazquez Hernandez | 2 | P0 | Sprint 1 | Done |
| T-16 · Ejemplo byte por byte del pizarrón en el documento | HU-07 | Juan Manuel Murillo Lopez | 1 | P1 | Sprint 1 | Done |
| T-17 · Escribir el encabezado y la tabla de frecuencias | HU-08 | Brian Ulises Vazquez Hernandez | 2 | P0 | Sprint 1 | Done |
| T-18 · Usar el ancho mínimo para las frecuencias | HU-08 | Brian Ulises Vazquez Hernandez | 1 | P1 | Sprint 1 | Done |
| T-19 · Leer y validar el encabezado del .hfz | HU-09 | Erin Fernando Cuellar Gonzalez | 2 | P0 | Sprint 1 | Done |
| T-20 · Reconstruir el árbol y decodificar los bits | HU-09 | Erin Fernando Cuellar Gonzalez | 2 | P0 | Sprint 1 | Done |
| T-21 · Verificar el CRC-32 al descomprimir | HU-09 | Erin Fernando Cuellar Gonzalez | 1 | P0 | Sprint 1 | Done |
| T-22 · Definir paleta, tipografía y tokens de diseño | HU-10 | Francisco Javier Quintero Magaña | 1 | P1 | Sprint 1 | Done |
| T-23 · Crear componentes reutilizables | HU-10 | Francisco Javier Quintero Magaña | 2 | P1 | Sprint 1 | Done |
| T-24 · Barra de navegación fija y pie de página | HU-11 | Francisco Javier Quintero Magaña | 1 | P1 | Sprint 1 | Done |
| T-25 · Hero con maqueta que comprime en vivo | HU-11 | Francisco Javier Quintero Magaña | 3 | P1 | Sprint 1 | Done |
| T-26 · Sección «cómo funciona» con el pizarrón | HU-11 | Francisco Javier Quintero Magaña | 2 | P1 | Sprint 1 | Done |
| T-27 · Diseño responsivo | HU-11 | Francisco Javier Quintero Magaña | 1 | P1 | Sprint 1 | Done |
| T-28 · Subir un .txt arrastrando y soltando | HU-12 | Erin Fernando Cuellar Gonzalez | 1 | P0 | Sprint 1 | Done |
| T-29 · Ejemplos incluidos y texto escrito a mano | HU-12 | Francisco Javier Quintero Magaña | 1 | P0 | Sprint 1 | Done |
| T-30 · Tabla de frecuencias con búsqueda y orden | HU-13 | Erin Fernando Cuellar Gonzalez | 2 | P0 | Sprint 1 | Done |
| T-31 · Histograma y entropía | HU-13 | Erin Fernando Cuellar Gonzalez | 1 | P1 | Sprint 1 | Done |
| T-32 · Dibujar el árbol en SVG | HU-14 | Francisco Javier Quintero Magaña | 2 | P0 | Sprint 1 | Done |
| T-33 · Controles de la animación | HU-14 | Juan Manuel Murillo Lopez | 1 | P0 | Sprint 1 | Done |
| T-34 · Tabla de códigos y camino en el árbol | HU-15 | Erin Fernando Cuellar Gonzalez | 2 | P1 | Sprint 1 | Done |
| T-35 · Tarjetas de métricas de compresión | HU-16 | Brian Ulises Vazquez Hernandez | 2 | P0 | Sprint 1 | Done |
| T-36 · Descargar el .hfz y copiar resultados | HU-16 | Brian Ulises Vazquez Hernandez | 1 | P1 | Sprint 1 | Done |
| T-37 · Portar el núcleo a python/huffman.py | HU-17 | Juan Manuel Murillo Lopez | 2 | P0 | Sprint 1 | Done |
| T-38 · Prueba cruzada entre la web y Python | HU-17 | Juan Manuel Murillo Lopez | 2 | P0 | Sprint 1 | Done |
| T-39 · Pruebas automáticas en JavaScript | HU-18 | Erin Fernando Cuellar Gonzalez | 2 | P0 | Sprint 1 | Done |
| T-40 · Pruebas automáticas en Python | HU-18 | Erin Fernando Cuellar Gonzalez | 1 | P0 | Sprint 1 | Done |
| T-41 · Volcado hexadecimal coloreado por campo | HU-19 | Erin Fernando Cuellar Gonzalez | 2 | P0 | Sprint 2 | Done |
| T-42 · Tabla de campos del encabezado | HU-19 | Erin Fernando Cuellar Gonzalez | 2 | P0 | Sprint 2 | Done |
| T-43 · Resumen del archivo en el inspector | HU-19 | Juan Manuel Murillo Lopez | 1 | P1 | Sprint 2 | Done |
| T-44 · Pestaña de frecuencias leídas del encabezado | HU-20 | Erin Fernando Cuellar Gonzalez | 1 | P0 | Sprint 2 | Done |
| T-45 · Pestaña de códigos y árbol reconstruido | HU-20 | Erin Fernando Cuellar Gonzalez | 1 | P0 | Sprint 2 | Done |
| T-46 · Pestaña de bits con el relleno marcado | HU-20 | Erin Fernando Cuellar Gonzalez | 1 | P1 | Sprint 2 | Done |
| T-47 · Botón «Descomprimir» y texto recuperado | HU-21 | Erin Fernando Cuellar Gonzalez | 2 | P0 | Sprint 2 | Done |
| T-48 · Verificación de integridad | HU-21 | Erin Fernando Cuellar Gonzalez | 2 | P0 | Sprint 2 | Done |
| T-49 · Descargar recuperado.txt | HU-21 | Juan Manuel Murillo Lopez | 1 | P1 | Sprint 2 | Done |
| T-50 · Buscar libros en Gutendex desde Python | HU-22 | Brian Ulises Vazquez Hernandez | 2 | P0 | Sprint 2 | Done |
| T-51 · Descargar el .txt por número de libro | HU-22 | Brian Ulises Vazquez Hernandez | 1 | P0 | Sprint 2 | Done |
| T-52 · Respaldo con el catálogo OPDS | HU-22 | Brian Ulises Vazquez Hernandez | 1 | P1 | Sprint 2 | Done |
| T-53 · Servidor local python/servidor.py | HU-22 | Juan Manuel Murillo Lopez | 1 | P1 | Sprint 2 | Done |
| T-54 · Mostrar resultados de búsqueda en el estudio | HU-23 | Brian Ulises Vazquez Hernandez | 1 | P0 | Sprint 2 | Done |
| T-55 · Progreso de descarga, licencia y errores | HU-23 | Brian Ulises Vazquez Hernandez | 2 | P0 | Sprint 2 | Done |
| T-56 · Kruskal con unión-búsqueda en JavaScript | HU-24 | Francisco Javier Quintero Magaña | 1 | P1 | Sprint 2 | Done |
| T-57 · Prim con cola de prioridad en JavaScript | HU-24 | Francisco Javier Quintero Magaña | 1 | P1 | Sprint 2 | Done |
| T-58 · python/mst.py y pruebas con grafos aleatorios | HU-24 | Juan Manuel Murillo Lopez | 1 | P1 | Sprint 2 | Done |
| T-59 · Dibujar el grafo con vértices arrastrables | HU-25 | Francisco Javier Quintero Magaña | 2 | P1 | Sprint 2 | Done |
| T-60 · Animación de Kruskal con componentes por color | HU-25 | Francisco Javier Quintero Magaña | 1 | P1 | Sprint 2 | Done |
| T-61 · Animación de Prim con la frontera | HU-25 | Francisco Javier Quintero Magaña | 1 | P1 | Sprint 2 | Done |
| T-62 · Pseudocódigo con la línea actual resaltada | HU-25 | Francisco Javier Quintero Magaña | 1 | P1 | Sprint 2 | Done |
| T-63 · App de escritorio: ventana y pestaña Comprimir | HU-26 | Juan Manuel Murillo Lopez | 2 | P1 | Sprint 2 | Done |
| T-64 · App de escritorio: árbol paso a paso | HU-26 | Juan Manuel Murillo Lopez | 2 | P1 | Sprint 2 | Done |
| T-65 · App de escritorio: pestaña Inspector | HU-26 | Juan Manuel Murillo Lopez | 1 | P1 | Sprint 2 | Done |
| T-66 · App de escritorio: pestaña Expansión mínima | HU-26 | Juan Manuel Murillo Lopez | 1 | P2 | Sprint 2 | Done |
| T-67 · Búsqueda de Gutenberg en la app de escritorio | HU-26 | Brian Ulises Vazquez Hernandez | 1 | P2 | Sprint 2 | Done |
| T-68 · Compatibilidad de .hfz entre web y escritorio | HU-26 | Erin Fernando Cuellar Gonzalez | 1 | P1 | Sprint 2 | Done |
| T-69 · Portada: tarjetas de funciones con datos reales | HU-27 | Francisco Javier Quintero Magaña | 1 | P2 | Sprint 2 | Done |
| T-70 · Portada: mapa de bytes interactivo del .hfz | HU-27 | Francisco Javier Quintero Magaña | 1 | P2 | Sprint 2 | Done |
| T-71 · Portada: preguntas frecuentes e imagen para redes | HU-27 | Francisco Javier Quintero Magaña | 1 | P2 | Sprint 2 | Done |
| T-72 · Inicio de sesión con Google y modo invitado | HU-28 | Francisco Javier Quintero Magaña | 2 | P2 | Sprint 2 | Done |
| T-73 · Historial de compresiones en el navegador | HU-28 | Juan Manuel Murillo Lopez | 1 | P2 | Sprint 2 | Done |
| T-74 · Importar el repo en Vercel y publicar | HU-29 | Brian Ulises Vazquez Hernandez | 1 | P0 | Sprint 2 | Done |
| T-75 · Comprobar el proxy en Vercel y poner la URL | HU-29 | Brian Ulises Vazquez Hernandez | 1 | P0 | Sprint 2 | Done |
| T-76 · Ejecutar las pruebas mínimas | HU-30 | Erin Fernando Cuellar Gonzalez | 1 | P0 | Sprint 2 | Done |
| T-77 · Capturas de evidencia | HU-30 | Erin Fernando Cuellar Gonzalez | 1 | P0 | Sprint 2 | Done |
| T-78 · Resultados en docs/pruebas.md | HU-30 | Erin Fernando Cuellar Gonzalez | 1 | P0 | Sprint 2 | Done |
| T-79 · README y documentación final | HU-31 | Juan Manuel Murillo Lopez | 3 | P0 | Sprint 2 | Done |
| T-80 · Reporte técnico en PDF | HU-32 | Brian Ulises Vazquez Hernandez | 3 | P0 | Sprint 2 | Done |

## Cargar el backlog al tablero de GitHub

`scripts/backlog_a_github.py` crea una *issue* por historia (con etiqueta de épica y milestone de sprint), la agrega al tablero y llena **Status**, **Priority**, **Size** y **Estimate**. Lo corre quien tenga permiso de escritura en el repositorio y en el tablero:

```bash
gh auth login                 # una sola vez
gh auth refresh -s project    # permiso para editar tableros
python scripts/backlog_a_github.py --repo Pickled-pork-rinds/compresor --estado final
```

Con `--estado final` usa la columna `estado_final` del CSV y cierra las issues terminadas. Se puede correr varias veces: no duplica historias, sólo actualiza sus campos. Con `--simular` muestra lo que haría sin tocar GitHub.
