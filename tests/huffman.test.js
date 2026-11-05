/* ==========================================================================
   tests/huffman.test.js — Pruebas del núcleo de Huffman 
   Ejecutar desde la raíz del proyecto:   node tests/huffman.test.js
   Regenerar archivos de prueba cruzada:  node tests/huffman.test.js --fixtures
   ========================================================================== */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const H = require('../js/huffman.js');

const enc = new TextEncoder();
const FECHA = 1767225600; // 2026-01-01 00:00:00 UTC (fija para comparar con Python)
let total = 0;
function prueba(nombre, fn) {
  fn();
  total++;
  console.log('  ✔ ' + nombre);
}
const idaYVuelta = (bytes, opts) => {
  const r = H.compress(bytes, { name: 'x.txt', ...opts });
  const d = H.decompress(r.file);
  assert.ok(d.crcOk, 'CRC distinto');
  assert.ok(d.sizeOk, 'tamaño distinto');
  assert.deepStrictEqual(Buffer.from(d.bytes), Buffer.from(bytes));
  return { r, d };
};

console.log('\nHuffman');

prueba('ejemplo del pizarrón: abbacabbcd → 19 bits', () => {
  const a = H.analyze(enc.encode('abbacabbcd'));
  const c = (ch) => a.codes.get(ch.charCodeAt(0));
  assert.strictEqual(a.mode, 'byte');
  assert.deepStrictEqual([c('b'), c('a'), c('d'), c('c')], ['0', '10', '110', '111']);
  assert.strictEqual(a.totalBits, 19);
  assert.strictEqual(a.steps.length, 3); // 4 símbolos → 3 uniones
});

prueba('modo carácter: á, ñ, ¿ y emoji cuentan como un símbolo', () => {
  const a = H.analyze(enc.encode('¿Año? ñandú 🙂'));
  assert.strictEqual(a.mode, 'char');
  assert.strictEqual(a.total, 13);
  assert.ok(a.codes.has('ñ'.codePointAt(0)));
  assert.ok(a.codes.has('🙂'.codePointAt(0)));
});

prueba('texto ASCII usa modo byte (encabezado más pequeño)', () => {
  assert.strictEqual(H.analyze(enc.encode('hola mundo')).mode, 'byte');
});

prueba('UTF-8 inválido (Latin-1) cae a modo byte y se recupera igual', () => {
  const latin1 = Uint8Array.from([0x41, 0xf1, 0x6f, 0x20, 0xe9, 0x0a]); // "Año é" en Latin-1
  const { r } = idaYVuelta(latin1);
  assert.strictEqual(r.analysis.mode, 'byte');
});

prueba('ida y vuelta idéntica: acentos, BOM, CRLF, tabuladores, emoji', () => {
  const t = Uint8Array.from([0xef, 0xbb, 0xbf, ...enc.encode('Había una vez…\r\n\tñandú 🙂 «fin»\n')]);
  const { r } = idaYVuelta(t);
  assert.strictEqual(r.analysis.mode, 'char');
});

prueba('archivo vacío', () => {
  const { r } = idaYVuelta(new Uint8Array(0));
  assert.strictEqual(r.file.length, H.FIXED_HEADER + 5);
});

prueba('un solo símbolo repetido usa 1 bit por símbolo', () => {
  const { r } = idaYVuelta(enc.encode('aaaaaaaaaaaa'));
  assert.strictEqual(r.analysis.totalBits, 12);
});

prueba('los 256 bytes con frecuencias muy desiguales (códigos largos)', () => {
  const arr = [];
  for (let b = 0; b < 256; b++) for (let k = 0; k < (b < 22 ? 2 ** b : 1); k++) arr.push(b);
  const { r } = idaYVuelta(Uint8Array.from(arr));
  const maxLen = Math.max(...r.analysis.entries.map((e) => e.code.length));
  assert.ok(maxLen > 20, 'debería haber códigos de más de 20 bits');
});

prueba('300 entradas aleatorias (ida y vuelta)', () => {
  let seed = 7;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < 300; i++) {
    const len = Math.floor(rnd() * 2000);
    const k = 1 + Math.floor(rnd() * 255);
    idaYVuelta(new Uint8Array(len).map(() => Math.floor(rnd() ** 2 * k)));
  }
});

prueba('texto Unicode aleatorio (ida y vuelta en modo carácter)', () => {
  const alfabeto = Array.from('abcdefghijklmnñopqrstuvwxyz áéíóúü¿?¡!.,;\n—«»€😀🙂👍漢字');
  let seed = 3;
  const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296;
  for (let i = 0; i < 100; i++) {
    let s = '';
    const len = Math.floor(rnd() * 800);
    for (let j = 0; j < len; j++) s += alfabeto[Math.floor(rnd() ** 1.6 * alfabeto.length)];
    idaYVuelta(enc.encode(s));
  }
});

prueba('libro sintético de 3 MB en modo carácter (rendimiento)', () => {
  const frase = enc.encode('En un lugar de la Mancha, de cuyo nombre no quiero acordarme… ¿qué será? ');
  const t = new Uint8Array(3_000_000);
  for (let i = 0; i < t.length; i += frase.length) t.set(frase.subarray(0, Math.min(frase.length, t.length - i)), i);
  // cortar en un límite de carácter válido
  let fin = t.length;
  while (fin > 0 && (t[fin - 1] & 0xc0) === 0x80) fin--;
  if (t[fin - 1] >= 0xc0) fin--;
  const libro = t.subarray(0, fin);
  const t0 = Date.now();
  idaYVuelta(libro);
  console.log(`      3 MB comprimidos y descomprimidos en ${Date.now() - t0} ms`);
});

prueba('detecta archivo dañado, firma incorrecta y archivo truncado', () => {
  const r = H.compress(enc.encode('hola mundo, hola huffman'), { name: 'h.txt' });
  // Se invierte un bit de datos real (no uno de relleno, que nadie lee)
  const malo = r.file.slice();
  malo[r.headerLen] ^= 0x80;
  let detectado;
  try {
    detectado = !H.decompress(malo).crcOk;
  } catch (e) {
    detectado = true; // o los bits terminan a la mitad de un código
  }
  assert.ok(detectado, 'el daño debe detectarse');
  assert.throws(() => H.parse(enc.encode('esto no es un archivo hfz de verdad')), /HFZ/);
  assert.throws(() => H.parse(r.file.slice(0, r.file.length - 1)), /bloque de datos/);
  const otraVersion = r.file.slice();
  otraVersion[3] = 9;
  assert.throws(() => H.parse(otraVersion), /versión/);
});

prueba('el encabezado declara todos los campos que pide la consigna', () => {
  const t = enc.encode('abbacabbcd');
  const r = H.compress(t, { name: 'pizarron.txt', created: FECHA });
  const h = H.parse(r.file);
  assert.strictEqual(h.version, 1);
  assert.strictEqual(h.originalSize, 10);
  assert.strictEqual(h.totalBits, 19);
  assert.strictEqual(h.padding, 5);
  assert.strictEqual(h.name, 'pizarron.txt');
  assert.strictEqual(h.symbolCount, 4);
  assert.strictEqual(h.crc, H.crc32(t));
  const suma = h.segments.reduce((s, x) => s + x.len, 0);
  assert.strictEqual(suma, r.file.length, 'los segmentos deben cubrir el archivo completo');
});

prueba('Huffman nunca usa más bits que un código de longitud fija', () => {
  const t = enc.encode('mississippi river runs through the middle of the mississippi valley');
  const a = H.analyze(t);
  assert.ok(a.totalBits <= a.total * Math.ceil(Math.log2(a.entries.length)));
  assert.ok(a.totalBits / a.total >= a.entropy - 1e-9, 'no puede bajar de la entropía');
  assert.ok(a.totalBits / a.total < a.entropy + 1, 'debe quedar a menos de 1 bit de la entropía');
});

console.log(`\n${total} pruebas correctas\n`);

/* ---- Archivos para la prueba cruzada con Python (tests/fixtures) ---- */
if (process.argv.includes('--fixtures')) {
  const dir = path.join(__dirname, 'fixtures');
  fs.mkdirSync(dir, { recursive: true });
  const casos = {
    'pizarron.txt': enc.encode('abbacabbcd'),
    'espanol.txt': Uint8Array.from([0xef, 0xbb, 0xbf, ...enc.encode('¿Qué día es hoy?\r\nEl niño comió piña y jamón.\n¡Olé! «Fin» — 🙂\n')]),
    'latin1.txt': Uint8Array.from([0x41, 0xf1, 0x6f, 0x20, 0x6e, 0x75, 0x65, 0x76, 0x6f, 0x0a, 0xe9, 0xe8]),
    'vacio.txt': new Uint8Array(0),
    'unico.txt': enc.encode('zzzzzzzzzzzzzzzzzz'),
  };
  for (const [nombre, bytes] of Object.entries(casos)) {
    fs.writeFileSync(path.join(dir, nombre), bytes);
    const r = H.compress(bytes, { name: nombre, created: FECHA, encoder: 1 });
    fs.writeFileSync(path.join(dir, nombre.replace(/\.txt$/, '.hfz')), r.file);
  }
  console.log('Archivos de prueba cruzada escritos en tests/fixtures/');
}
