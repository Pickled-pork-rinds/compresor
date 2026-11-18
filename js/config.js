/* ==========================================================================
   js/config.js — Configuración del proyecto (EDITA ESTE ARCHIVO)
   --------------------------------------------------------------------------
   Todo lo que cambia de un equipo a otro está aquí: nombres, enlaces y
   claves opcionales. Las demás partes del código leen estos valores.
   ========================================================================== */
window.HUFFLY_CONFIG = {
  nombre: 'Huffly',
  materia: 'Análisis de Algoritmos',
  ciclo: '2026B',
  institucion: 'CUCEI, Universidad de Guadalajara',

  // Integrantes del equipo (aparecen en el pie de página de las 3 páginas)
  equipo: ['Juan Manuel Murillo López', 'Integrante 2'],

  // Enlaces del proyecto
  repositorio: 'https://github.com/juanmanuel782/huffly',
  tablero: '', // URL de GitHub Projects (opcional, se muestra en el pie)

  // Inicio de sesión con Google (opcional y gratuito).
  // Pega aquí tu "Client ID" de Google Cloud. Si lo dejas vacío, el botón
  // explica que la cuenta es opcional y la app funciona como invitado.
  // Instrucciones: README.md → "Inicio de sesión con Google".
  googleClientId: '',

  // Project Gutenberg
  // apiBase: dónde vive el proxy en Python (api/gutenberg.py).
  //   ''  → el mismo servidor que sirve la página (Vercel o python/servidor.py)
  apiBase: '',
  gutendex: 'https://gutendex.com/books/',
  // Proxies públicos de respaldo para descargar el .txt cuando no hay proxy
  // propio (por ejemplo en GitHub Pages). Puedes borrarlos si no los quieres.
  proxiesCors: ['https://api.allorigins.win/raw?url='],
};
