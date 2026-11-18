/* ==========================================================================
   js/gutenberg.js — Búsqueda y descarga de libros de Project Gutenberg
   --------------------------------------------------------------------------
   Por qué hay varias rutas: gutenberg.org no permite que otra página web
   descargue sus .txt directamente (no envía cabeceras CORS). Por eso:

   Búsqueda
     1. /api/gutenberg (nuestro proxy en Python: Vercel o python/servidor.py)
     2. API pública Gutendex directamente desde el navegador
   Descarga del .txt
     1. /api/gutenberg (proxy propio, la ruta recomendada)
     2. gutenberg.org directo (por si algún día habilitan CORS)
     3. proxies públicos de respaldo (configurables en js/config.js)
     4. Si todo falla, se ofrece el enlace para descargarlo a mano y subirlo
   ========================================================================== */
(function () {
  'use strict';
  const CFG = window.HUFFLY_CONFIG || {};
  const sinServidor = location.protocol === 'file:';
  let apiDisponible = sinServidor ? false : null; // null = aún no se sabe

  const api = (params) => `${(CFG.apiBase || '').replace(/\/$/, '')}/api/gutenberg?${new URLSearchParams(params)}`;

  function autorLegible(nombre) {
    // "Cervantes Saavedra, Miguel de" → "Miguel de Cervantes Saavedra"
    const m = /^([^,]+),\s*([^,(]+)/.exec(nombre || '');
    return m ? `${m[2].trim()} ${m[1].trim()}` : nombre;
  }

  function normalizar(libro) {
    const formatos = libro.formats || {};
    const clave = Object.keys(formatos).find((k) => k.startsWith('text/plain'));
    return {
      id: libro.id,
      titulo: libro.title,
      autores: (libro.authors || []).map((a) => autorLegible(a.name)),
      idiomas: libro.languages || [],
      descargas: libro.download_count || 0,
      txt: clave ? formatos[clave] : null,
    };
  }

  async function pedir(url, ms) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(url, { signal: ctl.signal });
      if (!r.ok) {
        const e = new Error(`HTTP ${r.status}`);
        e.status = r.status;
        throw e;
      }
      return r;
    } finally {
      clearTimeout(t);
    }
  }

  const sinApi = (e) => e.status === 404 || e.status === 405 || e.name === 'TypeError';

  async function buscar(q, idioma) {
    if (apiDisponible !== false) {
      try {
        const r = await pedir(api({ accion: 'buscar', q, idioma: idioma || '' }), 20000);
        const data = await r.json();
        apiDisponible = true;
        return { via: data.fuente === 'opds' ? 'catálogo de Gutenberg' : 'Gutendex (vía servidor)', resultados: data.resultados || [] };
      } catch (e) {
        if (sinApi(e)) apiDisponible = false;
      }
    }
    const url = new URL(CFG.gutendex || 'https://gutendex.com/books/');
    url.searchParams.set('search', q);
    url.searchParams.set('mime_type', 'text/plain');
    if (idioma) url.searchParams.set('languages', idioma);
    const r = await pedir(url.toString(), 20000);
    const data = await r.json();
    return { via: 'Gutendex', resultados: (data.results || []).map(normalizar).filter((b) => b.txt) };
  }

  async function leerBytes(url, alProgreso, ms = 60000) {
    const r = await pedir(url, ms);
    const total = +r.headers.get('content-length') || 0;
    if (!r.body || !r.body.getReader) return new Uint8Array(await r.arrayBuffer());
    const reader = r.body.getReader();
    const partes = [];
    let recibidos = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      partes.push(value);
      recibidos += value.length;
      if (alProgreso) alProgreso(recibidos, total);
    }
    const out = new Uint8Array(recibidos);
    let p = 0;
    for (const parte of partes) {
      out.set(parte, p);
      p += parte.length;
    }
    return out;
  }

  function pareceHtml(bytes) {
    const inicio = new TextDecoder().decode(bytes.subarray(0, 300)).trim().toLowerCase();
    return inicio.startsWith('<!doctype') || inicio.startsWith('<html');
  }

  async function descargar(libro, alProgreso) {
    const directo = `https://www.gutenberg.org/cache/epub/${libro.id}/pg${libro.id}.txt`;
    const rutas = [];
    if (apiDisponible !== false) rutas.push({ via: 'servidor del proyecto', url: api({ accion: 'texto', id: libro.id }) });
    rutas.push({ via: 'gutenberg.org', url: directo });
    for (const p of CFG.proxiesCors || []) rutas.push({ via: 'proxy público', url: p + encodeURIComponent(libro.txt || directo) });
    let ultimo = null;
    for (const ruta of rutas) {
      try {
        const bytes = await leerBytes(ruta.url, alProgreso);
        if (bytes.length < 200 || pareceHtml(bytes)) throw new Error('La respuesta no es un texto de Gutenberg.');
        return { bytes, via: ruta.via };
      } catch (e) {
        ultimo = e;
        if (ruta.url.includes('/api/gutenberg') && sinApi(e)) apiDisponible = false;
      }
    }
    const err = new Error('No se pudo descargar el libro automáticamente.');
    err.manual = `https://www.gutenberg.org/ebooks/${libro.id}`;
    err.causa = ultimo;
    throw err;
  }

  /* Quita el encabezado y la licencia que Gutenberg agrega a cada libro */
  function soloObra(texto) {
    const ini = texto.search(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG E-?BOOK[^\n]*/i);
    const fin = texto.search(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG E-?BOOK/i);
    if (ini < 0) return null;
    const desde = texto.indexOf('\n', ini) + 1;
    return texto.slice(desde, fin > desde ? fin : undefined).replace(/^\s+/, '').replace(/\s+$/, '\n');
  }

  window.Gutenberg = { buscar, descargar, soloObra, autorLegible, estado: () => apiDisponible };
})();
