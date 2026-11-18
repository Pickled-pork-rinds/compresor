/* ==========================================================================
   tests/medir.js — Mide la compresión de uno o varios archivos
   Uso:  node tests/medir.js libro1.txt libro2.txt …
   Imprime una tabla en Markdown lista para pegar en el README.
   ========================================================================== */
const fs = require('fs');
const path = require('path');
const H = require('../js/huffman.js');

const archivos = process.argv.slice(2);
if (!archivos.length) {
  console.log('Uso: node tests/medir.js archivo1.txt [archivo2.txt …]');
  process.exit(1);
}
const f = (n) => n.toLocaleString('es-MX');
console.log('| Texto | Modo | Original | Comprimido | Ahorro | Reducción | Razón | Símbolos | Bits/símbolo (entropía) | Tiempo | Integridad |');
console.log('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|');
for (const ruta of archivos) {
  const bytes = new Uint8Array(fs.readFileSync(ruta));
  if (!bytes.length) continue;
  const t0 = performance.now();
  const r = H.compress(bytes, { name: path.basename(ruta) });
  const d = H.decompress(r.file);
  const ms = performance.now() - t0;
  let iguales = d.bytes.length === bytes.length;
  for (let i = 0; iguales && i < bytes.length; i++) if (d.bytes[i] !== bytes[i]) iguales = false;
  const a = r.analysis;
  const ahorro = bytes.length - r.file.length;
  const signo = ahorro < 0 ? '−' : '';
  console.log(`| ${path.basename(ruta)} | ${a.mode === 'char' ? 'carácter' : 'byte'} | ${H.formatBytes(bytes.length)} (${f(bytes.length)} B) | ${H.formatBytes(r.file.length)} (${f(r.file.length)} B) | ${signo}${H.formatBytes(Math.abs(ahorro))} | ${signo}${((Math.abs(ahorro) / bytes.length) * 100).toFixed(1)} % | ${(bytes.length / r.file.length).toFixed(2)} : 1 | ${a.entries.length} | ${(a.totalBits / a.total).toFixed(2)} (${a.entropy.toFixed(2)}) | ${Math.round(ms)} ms | ${d.crcOk && iguales ? 'idéntico' : 'FALLA'} |`);
}
