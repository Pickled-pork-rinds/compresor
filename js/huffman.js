/* ==========================================================================
   js/huffman.js — Núcleo del algoritmo de Huffman (técnica voraz) 
   --------------------------------------------------------------------------
   · Implementado a mano: NO usa zip, gzip ni ninguna librería de compresión.
   · Funciona en el navegador (window.Huffman) y en Node (module.exports).
   · Produce archivos .hfz idénticos byte a byte a los de python/huffman.py.

   Flujo:  bytes → símbolos → frecuencias → árbol (voraz) → códigos → bits
           → archivo .hfz → lectura → descompresión → verificación CRC-32

   Modo de símbolos
   · "char": cada carácter Unicode es un símbolo (á, ñ, ¿ cuentan como uno).
             Se usa si el texto es UTF-8 válido y tiene caracteres no ASCII.
   · "byte": cada byte (0–255) es un símbolo. Funciona con cualquier archivo.

   Regla de desempate (para que el árbol se pueda reconstruir EXACTAMENTE):
   se saca primero el nodo de menor frecuencia y, si empatan, el que se creó
   antes (id menor). Las hojas se crean en orden ascendente de símbolo.
   El formato completo está documentado en docs/formato-hfz.md  
   ========================================================================== */
(function (root) {
  'use strict';

  const MAGIC = [0x48, 0x46, 0x5a]; // "HFZ"
  const VERSION = 1;
  const FLAG_CHAR = 0x01;
  const FIXED_HEADER = 28; // bytes del encabezado sin contar nombre ni tabla
  const ENCODERS = { 1: 'Huffly Web (JavaScript)', 2: 'Huffly Desktop (Python)' };

  /* ------------------------------------------------------------------------
     CRC-32 (IEEE 802.3). Sólo sirve para verificar integridad; no comprime.
     ------------------------------------------------------------------------ */
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  /* ------------------------------------------------------------------------
     Cola de prioridad: montículo binario mínimo.
     push y pop cuestan O(log n).
     ------------------------------------------------------------------------ */
  class MinHeap {
    constructor() { this.a = []; }
    get size() { return this.a.length; }
    static less(x, y) { return x.freq < y.freq || (x.freq === y.freq && x.id < y.id); }
    push(node) {
      const a = this.a;
      a.push(node);
      let i = a.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (!MinHeap.less(a[i], a[p])) break;
        [a[i], a[p]] = [a[p], a[i]];
        i = p;
      }
    }
    pop() {
      const a = this.a;
      const top = a[0];
      const last = a.pop();
      if (a.length) {
        a[0] = last;
        let i = 0;
        for (;;) {
          const l = 2 * i + 1;
          const r = l + 1;
          let m = i;
          if (l < a.length && MinHeap.less(a[l], a[m])) m = l;
          if (r < a.length && MinHeap.less(a[r], a[m])) m = r;
          if (m === i) break;
          [a[i], a[m]] = [a[m], a[i]];
          i = m;
        }
      }
      return top;
    }
  }

  /* ------------------------------------------------------------------------
     0) De bytes a símbolos
     ------------------------------------------------------------------------ */
  function isAscii(bytes) {
    for (let i = 0; i < bytes.length; i++) if (bytes[i] > 0x7f) return false;
    return true;
  }

  function decodeUtf8(bytes) {
    try {
      // fatal: rechaza UTF-8 inválido · ignoreBOM: conserva el BOM si existe
      return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    } catch (e) {
      return null;
    }
  }

  function toSymbols(bytes, mode = 'auto') {
    if (mode === 'char' || (mode === 'auto' && !isAscii(bytes))) {
      const text = decodeUtf8(bytes);
      if (text !== null) {
        const seq = new Uint32Array(text.length);
        let n = 0;
        for (let i = 0; i < text.length; i++) {
          const cp = text.codePointAt(i);
          seq[n++] = cp;
          if (cp > 0xffff) i++; // par sustituto: ya se leyó completo
        }
        return { mode: 'char', seq: seq.subarray(0, n) };
      }
      if (mode === 'char') throw new Error('El archivo no es UTF-8 válido. Usa el modo «byte».');
    }
    return { mode: 'byte', seq: bytes };
  }

  /* ------------------------------------------------------------------------
     1) Frecuencias: cuántas veces aparece cada símbolo. O(n)
     ------------------------------------------------------------------------ */
  function countFrequencies(seq) {
    const map = new Map();
    for (let i = 0; i < seq.length; i++) {
      const s = seq[i];
      map.set(s, (map.get(s) || 0) + 1);
    }
    return Array.from(map, ([sym, freq]) => ({ sym, freq })).sort((a, b) => a.sym - b.sym);
  }

  /* ------------------------------------------------------------------------
     2) Árbol de Huffman — la decisión voraz
     En cada paso se sacan de la cola los DOS nodos de menor frecuencia y se
     unen bajo un padre cuya frecuencia es la suma. Elegir siempre los dos
     menores es óptimo localmente y, para Huffman, también globalmente.
     Con k símbolos distintos se hacen k − 1 uniones: O(k log k).
     `steps` guarda cada unión para poder animarla.
     ------------------------------------------------------------------------ */
  function buildTree(entries) {
    const heap = new MinHeap();
    const leaves = [];
    let id = 0;
    for (const e of entries) {
      const leaf = { id: id++, freq: e.freq, sym: e.sym, left: null, right: null, step: 0, mergedAt: 0 };
      leaves.push(leaf);
      heap.push(leaf);
    }
    const steps = [];
    while (heap.size > 1) {
      const a = heap.pop(); // el menor → rama 0
      const b = heap.pop(); // el segundo menor → rama 1
      const node = { id: id++, freq: a.freq + b.freq, sym: null, left: a, right: b, step: steps.length + 1, mergedAt: 0 };
      a.mergedAt = b.mergedAt = node.step;
      steps.push({ a, b, node });
      heap.push(node);
    }
    return { root: heap.size ? heap.pop() : null, steps, leaves };
  }

  /* ------------------------------------------------------------------------
     3) Códigos: camino desde la raíz (izquierda = 0, derecha = 1).
     Si sólo hay un símbolo distinto, se le asigna "0" (1 bit).
     ------------------------------------------------------------------------ */
  function buildCodes(tree) {
    const codes = new Map();
    if (!tree) return codes;
    if (!tree.left) {
      codes.set(tree.sym, '0');
      return codes;
    }
    const stack = [[tree, '']];
    while (stack.length) {
      const [n, code] = stack.pop();
      if (!n.left) codes.set(n.sym, code);
      else {
        stack.push([n.right, code + '1']);
        stack.push([n.left, code + '0']);
      }
    }
    return codes;
  }

  function entropy(entries, total) {
    if (!total) return 0;
    let h = 0;
    for (const e of entries) {
      const p = e.freq / total;
      h -= p * Math.log2(p);
    }
    return h;
  }

  /* Análisis completo sin generar archivo (lo usa la interfaz paso a paso) */
  function analyze(bytes, mode = 'auto') {
    const { mode: m, seq } = toSymbols(bytes, mode);
    const entries = countFrequencies(seq);
    const { root: tree, steps, leaves } = buildTree(entries);
    const codes = buildCodes(tree);
    let totalBits = 0;
    for (const e of entries) {
      e.code = codes.get(e.sym);
      totalBits += e.freq * e.code.length;
    }
    return {
      mode: m, seq, entries, total: seq.length, tree, steps, leaves, codes, totalBits,
      entropy: entropy(entries, seq.length), byteLength: bytes.length,
    };
  }

  /* ------------------------------------------------------------------------
     4) Codificación: concatenar los códigos y empaquetarlos en bytes
     (el primer bit va en el bit más significativo del primer byte).
     ------------------------------------------------------------------------ */
  function packBits(seq, codes, totalBits) {
    const out = new Uint8Array(Math.ceil(totalBits / 8));
    let pos = 0;
    let last = -1;
    let code = '';
    for (let i = 0; i < seq.length; i++) {
      const s = seq[i];
      if (s !== last) { code = codes.get(s); last = s; }
      for (let k = 0; k < code.length; k++) {
        if (code.charCodeAt(k) === 49) out[pos >> 3] |= 0x80 >> (pos & 7); // '1'
        pos++;
      }
    }
    return out;
  }

  function utf8Name(name) {
    const enc = new TextEncoder();
    let chars = Array.from(String(name || ''));
    let bytes = enc.encode(chars.join(''));
    while (bytes.length > 255) {
      chars = chars.slice(0, -1);
      bytes = enc.encode(chars.join(''));
    }
    return bytes;
  }

  function bytesFor(max) {
    if (max <= 0xff) return 1;
    if (max <= 0xffff) return 2;
    if (max <= 0xffffff) return 3;
    return 4;
  }

  /* ------------------------------------------------------------------------
     5) Archivo .hfz (ver docs/formato-hfz.md)
     ------------------------------------------------------------------------ */
  function compress(bytes, opts = {}) {
    const a = opts.analysis || analyze(bytes, opts.mode || 'auto');
    if (a.totalBits > 0xffffffff) throw new Error('El archivo es demasiado grande para el formato .hfz v1.');
    if (a.entries.length > 0xffff) throw new Error('Hay demasiados símbolos distintos para el formato .hfz v1.');
    const encoder = opts.encoder || 1;
    const created = opts.created != null ? opts.created : Math.floor(Date.now() / 1000);
    const nameBytes = utf8Name(opts.name);
    const symBytes = a.mode === 'char' ? 3 : 1;
    let maxFreq = 0;
    for (const e of a.entries) if (e.freq > maxFreq) maxFreq = e.freq;
    const freqBytes = bytesFor(maxFreq);
    const data = packBits(a.seq, a.codes, a.totalBits);
    const headerLen = FIXED_HEADER + nameBytes.length + a.entries.length * (symBytes + freqBytes);
    const file = new Uint8Array(headerLen + data.length);
    const dv = new DataView(file.buffer);
    const crc = crc32(bytes);

    file.set(MAGIC, 0);
    file[3] = VERSION;
    file[4] = a.mode === 'char' ? FLAG_CHAR : 0;
    file[5] = encoder;
    dv.setUint32(6, created);
    dv.setUint32(10, bytes.length);
    dv.setUint32(14, crc);
    dv.setUint32(18, a.totalBits);
    file[22] = (8 - (a.totalBits % 8)) % 8;
    file[23] = nameBytes.length;
    file.set(nameBytes, 24);
    let p = 24 + nameBytes.length;
    dv.setUint16(p, a.entries.length); p += 2;
    file[p++] = symBytes;
    file[p++] = freqBytes;
    for (const e of a.entries) {
      for (let k = symBytes - 1; k >= 0; k--) file[p++] = Math.floor(e.sym / 2 ** (8 * k)) & 0xff;
      for (let k = freqBytes - 1; k >= 0; k--) file[p++] = Math.floor(e.freq / 2 ** (8 * k)) & 0xff;
    }
    file.set(data, p);
    return { file, analysis: a, headerLen, dataLen: data.length, crc, originalSize: bytes.length };
  }

  /* ------------------------------------------------------------------------
     6) Lectura y validación del encabezado
     ------------------------------------------------------------------------ */
  function parse(input) {
    const file = input instanceof Uint8Array ? input : new Uint8Array(input);
    const fail = (msg) => { throw new Error(msg); };
    if (file.length < FIXED_HEADER) fail(`El archivo mide ${file.length} B; un .hfz mide al menos ${FIXED_HEADER} B.`);
    if (file[0] !== MAGIC[0] || file[1] !== MAGIC[1] || file[2] !== MAGIC[2]) {
      fail('No es un archivo .hfz: los primeros 3 bytes deberían ser «HFZ».');
    }
    const version = file[3];
    if (version !== VERSION) fail(`El archivo usa la versión ${version} del formato; esta aplicación lee la versión ${VERSION}.`);
    const flags = file[4];
    if (flags & ~FLAG_CHAR) fail('El encabezado tiene banderas desconocidas.');
    const mode = flags & FLAG_CHAR ? 'char' : 'byte';
    const dv = new DataView(file.buffer, file.byteOffset, file.byteLength);
    const encoder = file[5];
    const created = dv.getUint32(6);
    const originalSize = dv.getUint32(10);
    const crc = dv.getUint32(14);
    const totalBits = dv.getUint32(18);
    const padding = file[22];
    const nameLen = file[23];
    let p = 24;
    if (p + nameLen + 4 > file.length) fail('El encabezado está incompleto: falta el nombre o la tabla.');
    const name = new TextDecoder().decode(file.subarray(p, p + nameLen));
    p += nameLen;
    const symbolCount = dv.getUint16(p); p += 2;
    const symBytes = file[p++];
    const freqBytes = file[p++];
    if (symBytes !== (mode === 'char' ? 3 : 1)) fail('El ancho de símbolo no coincide con el modo del archivo.');
    if (freqBytes < 1 || freqBytes > 4) fail('El ancho de frecuencia debe estar entre 1 y 4 bytes.');
    if (mode === 'byte' && symbolCount > 256) fail('En modo byte no puede haber más de 256 símbolos.');
    const tableOffset = p;
    const tableLen = symbolCount * (symBytes + freqBytes);
    if (p + tableLen > file.length) fail('La tabla de frecuencias está incompleta.');

    const entries = [];
    let totalSymbols = 0;
    let prev = -1;
    for (let i = 0; i < symbolCount; i++) {
      let sym = 0;
      for (let k = 0; k < symBytes; k++) sym = sym * 256 + file[p++];
      let freq = 0;
      for (let k = 0; k < freqBytes; k++) freq = freq * 256 + file[p++];
      if (sym <= prev) fail('La tabla de símbolos no está en orden ascendente.');
      if (freq === 0) fail('La tabla contiene un símbolo con frecuencia 0.');
      if (mode === 'char' && (sym > 0x10ffff || (sym >= 0xd800 && sym <= 0xdfff))) fail('La tabla contiene un carácter Unicode inválido.');
      prev = sym;
      totalSymbols += freq;
      entries.push({ sym, freq });
    }
    const dataOffset = p;
    const dataLen = file.length - p;
    const expectedData = Math.ceil(totalBits / 8);
    if (dataLen !== expectedData) fail(`El bloque de datos mide ${dataLen} B, pero el encabezado declara ${totalBits} bits (${expectedData} B).`);
    if (padding !== (8 - (totalBits % 8)) % 8) fail('Los bits de relleno no coinciden con el total de bits.');
    if (mode === 'byte' && totalSymbols !== originalSize) fail('La suma de frecuencias no coincide con el tamaño original.');

    // Reconstrucción: el mismo algoritmo voraz con las mismas frecuencias
    const { root: tree, steps, leaves } = buildTree(entries);
    const codes = buildCodes(tree);
    let expectedBits = 0;
    for (const e of entries) {
      e.code = codes.get(e.sym);
      expectedBits += e.freq * e.code.length;
    }
    if (expectedBits !== totalBits) fail('Los bits declarados no coinciden con el árbol reconstruido.');

    const segments = [
      { key: 'magic', label: 'Firma', start: 0, len: 3, value: '"HFZ"', desc: 'Identifica el archivo como .hfz.' },
      { key: 'version', label: 'Versión', start: 3, len: 1, value: String(version), desc: 'Versión del formato.' },
      { key: 'flags', label: 'Modo', start: 4, len: 1, value: mode === 'char' ? 'carácter (bit 0 = 1)' : 'byte (bit 0 = 0)', desc: 'Qué es un símbolo: un carácter Unicode o un byte.' },
      { key: 'encoder', label: 'Codificador', start: 5, len: 1, value: ENCODERS[encoder] || `id ${encoder}`, desc: 'Programa que creó el archivo.' },
      { key: 'created', label: 'Fecha', start: 6, len: 4, value: new Date(created * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC', desc: 'Momento de la compresión (Unix, segundos).' },
      { key: 'size', label: 'Tamaño original', start: 10, len: 4, value: `${originalSize} B`, desc: 'Bytes del .txt original.' },
      { key: 'crc', label: 'CRC-32', start: 14, len: 4, value: '0x' + crc.toString(16).toUpperCase().padStart(8, '0'), desc: 'Huella del original para verificar la integridad.' },
      { key: 'bits', label: 'Bits válidos', start: 18, len: 4, value: String(totalBits), desc: 'Cuántos bits del bloque de datos son reales.' },
      { key: 'padding', label: 'Relleno', start: 22, len: 1, value: `${padding} bits`, desc: 'Ceros añadidos al final del último byte.' },
      { key: 'namelen', label: 'Largo del nombre', start: 23, len: 1, value: `${nameLen} B`, desc: 'Longitud del nombre original.' },
      { key: 'name', label: 'Nombre', start: 24, len: nameLen, value: name || '(vacío)', desc: 'Nombre del archivo original (UTF-8).' },
      { key: 'count', label: 'Símbolos distintos', start: 24 + nameLen, len: 2, value: String(symbolCount), desc: 'Filas de la tabla de frecuencias.' },
      { key: 'widths', label: 'Anchos', start: 26 + nameLen, len: 2, value: `símbolo ${symBytes} B · frecuencia ${freqBytes} B`, desc: 'Bytes por símbolo y por frecuencia en la tabla.' },
      { key: 'table', label: 'Tabla de frecuencias', start: tableOffset, len: tableLen, value: `${symbolCount} × ${symBytes + freqBytes} B`, desc: 'Con ella se reconstruye el árbol sin el .txt original.' },
      { key: 'data', label: 'Datos comprimidos', start: dataOffset, len: dataLen, value: `${dataLen} B`, desc: 'Los códigos de Huffman empaquetados, bit a bit.' },
    ];

    return {
      version, flags, mode, encoder, encoderName: ENCODERS[encoder] || `Desconocido (${encoder})`, created,
      originalSize, crc, totalBits, padding, name, symbolCount, symBytes, freqBytes, entries, totalSymbols,
      tableOffset, tableLen, dataOffset, dataLen, fileSize: file.length, headerLen: dataOffset,
      tree, steps, leaves, codes, segments,
      entropy: entropy(entries, totalSymbols),
    };
  }

  /* ------------------------------------------------------------------------
     7) Descompresión: recorrer el árbol bit a bit (0 = izquierda, 1 = derecha)
     y emitir el símbolo al llegar a una hoja. Después se verifica el CRC-32.
     ------------------------------------------------------------------------ */
  function codePointsToString(cps) {
    let s = '';
    const CHUNK = 0x2000;
    for (let i = 0; i < cps.length; i += CHUNK) {
      s += String.fromCodePoint.apply(null, cps.subarray(i, i + CHUNK));
    }
    return s;
  }

  function decompress(input) {
    const file = input instanceof Uint8Array ? input : new Uint8Array(input);
    const h = parse(file);
    const n = h.totalSymbols;
    const out = h.mode === 'byte' ? new Uint8Array(n) : new Uint32Array(n);
    const tree = h.tree;
    if (tree) {
      if (!tree.left) {
        out.fill(tree.sym);
      } else {
        let node = tree;
        let o = 0;
        const base = h.dataOffset;
        for (let pos = 0; pos < h.totalBits; pos++) {
          const bit = (file[base + (pos >> 3)] >> (7 - (pos & 7))) & 1;
          node = bit ? node.right : node.left;
          if (node.left === null) {
            out[o++] = node.sym;
            node = tree;
          }
        }
        if (o !== n || node !== tree) throw new Error('Los bits terminaron a la mitad de un código: el archivo está dañado.');
      }
    }
    const bytes = h.mode === 'byte' ? out : new TextEncoder().encode(codePointsToString(out));
    const crc = crc32(bytes);
    return { bytes, header: h, crc, crcOk: crc === h.crc, sizeOk: bytes.length === h.originalSize };
  }

  /* ------------------------------------------------------------------------
     Utilidades de presentación
     ------------------------------------------------------------------------ */
  const NAMES = {
    0x20: ['␣', 'espacio'], 0x0a: ['↵', 'salto de línea'], 0x0d: ['␍', 'retorno de carro'],
    0x09: ['⇥', 'tabulador'], 0xa0: ['⍽', 'espacio no separable'], 0xfeff: ['BOM', 'marca de orden de bytes'],
    0x2014: ['—', 'raya'], 0x201c: ['“', 'comilla de apertura'], 0x201d: ['”', 'comilla de cierre'],
  };

  function symbolInfo(sym, mode) {
    if (NAMES[sym] && (mode === 'char' || sym < 0x80)) return { glyph: NAMES[sym][0], name: NAMES[sym][1], special: true };
    if (mode === 'byte' && sym >= 0x80) {
      return { glyph: '0x' + sym.toString(16).toUpperCase().padStart(2, '0'), name: 'byte de un carácter multibyte o extendido', special: true };
    }
    if (sym < 0x20 || sym === 0x7f || (sym >= 0x80 && sym < 0xa0)) {
      return { glyph: 'U+' + sym.toString(16).toUpperCase().padStart(4, '0'), name: 'carácter de control', special: true };
    }
    return { glyph: String.fromCodePoint(sym), name: '', special: false };
  }

  function hexSym(sym, mode) {
    return mode === 'char' ? 'U+' + sym.toString(16).toUpperCase().padStart(4, '0') : '0x' + sym.toString(16).toUpperCase().padStart(2, '0');
  }

  function formatBytes(n) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  }

  /** Primeros `maxBits` bits del bloque de datos, en grupos de 8 */
  function bitPreview(file, h, maxBits = 256) {
    const n = Math.min(h.totalBits, maxBits);
    const groups = [];
    for (let i = 0; i < n; i += 8) {
      let s = '';
      for (let k = 0; k < 8 && i + k < n; k++) {
        const pos = i + k;
        s += (file[h.dataOffset + (pos >> 3)] >> (7 - (pos & 7))) & 1;
      }
      groups.push(s);
    }
    return groups;
  }

  const api = {
    MAGIC, VERSION, FLAG_CHAR, FIXED_HEADER, ENCODERS, MinHeap,
    crc32, isAscii, decodeUtf8, toSymbols, countFrequencies, buildTree, buildCodes, entropy, analyze,
    packBits, compress, parse, decompress, codePointsToString, symbolInfo, hexSym, formatBytes, bitPreview,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Huffman = api;
})(typeof window !== 'undefined' ? window : globalThis);
