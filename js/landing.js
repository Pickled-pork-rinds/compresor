/* ==========================================================================
   js/landing.js — Interactividad de la portada (index.html) 
   --------------------------------------------------------------------------
   Todo lo que se ve aquí se calcula en vivo con js/huffman.js: los bits del
   titular, el mockup, el ejemplo del pizarrón y el mapa de bytes son reales.
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, fmtInt } = window.UI;
  const H = window.Huffman;
  const CFG = window.HUFFLY_CONFIG || {};
  const enc = new TextEncoder();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PALETTE = ['#a594ff', '#57d2ff', '#4ee3b5', '#ffc857', '#ff8a6b', '#e7a8ff', '#7aa7ff', '#9ef0d0', '#ffd9a0', '#c4b8ff', '#8fd3ff', '#ffb3c7'];

  const colorMap = (analysis) => {
    const m = new Map();
    [...analysis.entries].sort((a, b) => b.freq - a.freq || a.sym - b.sym).forEach((e, i) => m.set(e.sym, PALETTE[i % PALETTE.length]));
    return m;
  };
  const glyph = (sym, mode) => esc(H.symbolInfo(sym, mode).glyph);
  const pct = (x) => `${(x * 100).toFixed(1)} %`;

  /* ------------------------------------------------------------------------
     1) El titular, codificado con su propio árbol de Huffman
     ------------------------------------------------------------------------ */
  function heroBits() {
    const title = $('#hero-title').textContent.trim();
    const bytes = enc.encode(title);
    const a = H.analyze(bytes);
    let html = '';
    for (const s of a.seq) {
      html += '<span class="sep"></span>';
      for (const b of a.codes.get(s)) html += `<span class="b${b}">${b}</span>`;
    }
    const box = $('#hero-bits');
    box.innerHTML = html;
    if (!reduce) box.classList.add('typing');
    $('#hero-bits-cap').innerHTML = `Este titular en Huffman: <span class="text-[var(--text-2)]">${a.totalBits} bits</span> en lugar de ${bytes.length * 8}.`;
  }

  /* ------------------------------------------------------------------------
     2) Mockup: comprime en vivo lo que escribas
     ------------------------------------------------------------------------ */
  function mockup() {
    const input = $('#mock-input');
    const svg = $('#mock-tree');
    let timer = null;
    let anim = null;

    function render(animate) {
      const text = input.value.length ? input.value : ' ';
      const bytes = enc.encode(text);
      const a = H.analyze(bytes);
      const colors = colorMap(a);

      const top = [...a.entries].sort((x, y) => y.freq - x.freq || x.sym - y.sym).slice(0, 6);
      const max = top.length ? top[0].freq : 1;
      $('#mock-freq').innerHTML = top
        .map((e) => `<div class="fbar"><span class="g" style="color:${colors.get(e.sym)}">${glyph(e.sym, a.mode)}</span><span class="track"><span class="fill block" style="width:${(e.freq / max) * 100}%;background:${colors.get(e.sym)}"></span></span><span class="n">${e.freq}</span></div>`)
        .join('');

      const setStep = window.miniTree(svg, a.tree, a.mode, { w: 260, h: 150, r: 11 });
      clearInterval(anim);
      if (animate && !reduce && a.steps.length) {
        let k = 0;
        setStep(0);
        anim = setInterval(() => {
          setStep(++k);
          if (k >= a.steps.length) clearInterval(anim);
        }, Math.max(110, 1100 / a.steps.length));
      } else {
        setStep(Infinity);
      }

      let bits = '';
      for (const s of a.seq) bits += `<span style="color:${colors.get(s)}">${a.codes.get(s)}</span> `;
      $('#mock-bits').innerHTML = bits;
      $('#mock-bitcount').textContent = `${a.totalBits} bits`;
      const orig = bytes.length * 8;
      $('#m-orig').textContent = fmtInt(orig);
      $('#m-huff').textContent = fmtInt(a.totalBits);
      $('#m-save').textContent = pct(1 - a.totalBits / orig);

      // Las dos tarjetas flotantes también son reales
      const r = H.compress(bytes, { name: 'demo.txt' });
      const d = H.decompress(r.file);
      $('#chip-crc').textContent = d.crcOk ? `CRC-32 0x${d.crc.toString(16).toUpperCase().padStart(8, '0')}` : 'CRC-32 distinto';
      const maxLen = Math.max(...a.entries.map((e) => e.code.length));
      $('#chip-tree').textContent = `Árbol de ${a.entries.length * 2 - 1} nodos`;
      $('#chip-tree-sub').textContent = `código más largo: ${maxLen} ${maxLen === 1 ? 'bit' : 'bits'}`;
    }

    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => render(false), 60);
    });
    render(true);

    // Inclinación 3D sutil siguiendo al cursor (sólo con mouse)
    const wrap = $('#mock-wrap');
    const card = $('#mockup');
    if (!reduce && window.matchMedia('(pointer: fine)').matches) {
      wrap.addEventListener('pointermove', (e) => {
        const r = wrap.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', `${x * 6}deg`);
        card.style.setProperty('--rx', `${-y * 5}deg`);
      });
      wrap.addEventListener('pointerleave', () => {
        card.style.setProperty('--ry', '0deg');
        card.style.setProperty('--rx', '0deg');
      });
    }
  }

  /* ------------------------------------------------------------------------
     3) Cinta de clásicos
     ------------------------------------------------------------------------ */
  function marquee() {
    const titles = ['Don Quijote de la Mancha', 'Frankenstein', 'Moby Dick', 'Orgullo y prejuicio', 'Drácula', 'La Odisea', 'Alicia en el país de las maravillas', 'Las aventuras de Sherlock Holmes', 'Fortunata y Jacinta', 'Romeo y Julieta', 'La Divina Comedia'];
    const row = titles.map((t) => `<span>${esc(t)}</span>`).join('');
    $('#marquee').innerHTML = row + row;
  }

  /* ------------------------------------------------------------------------
     4) Cómo funciona: el ejemplo del pizarrón en cuatro pasos
     ------------------------------------------------------------------------ */
  function howItWorks() {
    const TEXT = 'abbacabbcd';
    const bytes = enc.encode(TEXT);
    const a = H.analyze(bytes);
    const file = H.compress(bytes, { name: 'pizarron.txt' });
    const colors = colorMap(a);
    const ranked = [...a.entries].sort((x, y) => y.freq - x.freq || x.sym - y.sym);
    const maxF = ranked[0].freq;
    const g = (s) => glyph(s, a.mode);
    const chip = (s, extra = '') => `<span class="sym ${extra}" style="color:${colors.get(s)};border-color:${colors.get(s)}55">${g(s)}</span>`;
    const alive = (k) =>
      [...a.leaves, ...a.steps.map((s) => s.node)]
        .filter((n) => n.step <= k && (n.mergedAt === 0 || n.mergedAt > k))
        .sort((x, y) => x.freq - y.freq || x.id - y.id);
    const qchip = (n, cls = '') => (n.left ? `<span class="q is-node ${cls}">${n.freq}</span>` : `<span class="q ${cls}"><span style="color:${cls ? 'inherit' : colors.get(n.sym)}">${g(n.sym)}</span><em>${n.freq}</em></span>`);
    const label = (n) => (n.left ? `nodo (${n.freq})` : `${g(n.sym)} (${n.freq})`);
    const arrowSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-[var(--text-4)] shrink-0"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

    const stages = [
      () => `
        <div class="flex flex-wrap gap-1.5">${[...a.seq].map((s) => chip(s, 'h-10 min-w-10 text-[17px]')).join('')}</div>
        <div class="mt-8 space-y-3.5">
          ${ranked.map((e) => `
            <div class="grid grid-cols-[34px_1fr_84px] items-center gap-4">
              ${chip(e.sym)}
              <div class="h-2.5 rounded-full bg-white/5 overflow-hidden"><div class="grow h-full rounded-full" style="--w:${(e.freq / maxF) * 100}%;background:${colors.get(e.sym)}"></div></div>
              <span class="text-[13.5px] text-right tabular-nums"><b class="text-[var(--text-1)] font-semibold">${e.freq}</b> de ${a.total}</span>
            </div>`).join('')}
        </div>
        <p class="mt-8 text-[14.5px] text-[var(--text-3)] max-w-prose leading-relaxed">Estas cuatro frecuencias son todo lo que el algoritmo necesita, y lo único que el archivo .hfz guarda para reconstruir el árbol.</p>`,

      () => `
        <ol class="space-y-3">
          ${a.steps.map((st, i) => {
            const q = alive(i);
            return `
            <li class="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-3.5 sm:p-4">
              <div class="flex items-center justify-between gap-3 mb-3">
                <span class="text-[13px] font-medium text-[var(--text-1)]">Unión ${i + 1} de ${a.steps.length}</span>
                <span class="text-[12.5px] text-[var(--text-3)]">${label(st.a)} + ${label(st.b)} = ${st.node.freq}</span>
              </div>
              <div class="queue max-h-none items-center">
                ${q.map((n) => qchip(n, n === st.a || n === st.b ? 'is-next' : '')).join('')}
                ${arrowSvg}
                <span class="q is-made">${st.node.freq}</span>
              </div>
            </li>`;
          }).join('')}
        </ol>
        <p class="mt-6 text-[14.5px] text-[var(--text-3)] max-w-prose leading-relaxed">En cada unión se toman los dos nodos más ligeros de la cola de prioridad, sin reconsiderar decisiones anteriores. Esa es la técnica voraz, y para Huffman produce el código óptimo.</p>`,

      () => `
        <div class="grid md:grid-cols-[1.1fr_1fr] gap-6 items-center">
          <div class="mini-card p-3"><svg id="how-tree" class="mini-tree w-full h-auto" role="img" aria-label="Árbol de Huffman de abbacabbcd"></svg></div>
          <div class="tbl-wrap max-h-none">
            <table class="tbl">
              <thead><tr><th>Símbolo</th><th class="num">Veces</th><th>Código</th><th class="num">Bits</th></tr></thead>
              <tbody>
                ${[...a.entries].sort((x, y) => x.code.length - y.code.length || y.freq - x.freq).map((e) => `
                  <tr><td>${chip(e.sym)}</td><td class="num">${e.freq}</td><td><span class="code">${e.code.split('').map((b) => `<span class="b${b}">${b}</span>`).join('')}</span></td><td class="num">${e.freq} × ${e.code.length} = ${e.freq * e.code.length}</td></tr>`).join('')}
                <tr><td colspan="3" class="text-[var(--text-1)] font-medium">Total</td><td class="num text-[var(--text-1)] font-semibold">${a.totalBits}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <p class="mt-6 text-[14.5px] text-[var(--text-3)] max-w-prose leading-relaxed">La <span class="mono text-[var(--text-2)]">b</span> es la más frecuente y queda a un paso de la raíz: un solo bit. Ningún código es el principio de otro, así que al leer los bits nunca hay ambigüedad.</p>`,

      () => {
        const bits = [...a.seq].map((s) => a.codes.get(s)).join('');
        const padded = bits.padEnd(Math.ceil(bits.length / 8) * 8, '0');
        const bytesOut = [];
        for (let i = 0; i < padded.length; i += 8) bytesOut.push(padded.slice(i, i + 8));
        return `
        <div class="tape">${[...a.seq].map((s) => `<div class="tok"><b style="color:${colors.get(s)}">${g(s)}</b><span>${a.codes.get(s)}</span></div>`).join('')}</div>
        <div class="mt-7 text-[13px] text-[var(--text-3)]">Guardados en bytes</div>
        <div class="mt-2.5 flex flex-wrap gap-2.5">
          ${bytesOut.map((b, i) => `
            <div class="bytebox">
              <div class="code text-[15px]">${b.split('').map((x, j) => (i * 8 + j >= bits.length ? `<span class="pad">${x}</span>` : `<span class="b${x}">${x}</span>`)).join('')}</div>
              <div class="mono text-[12px] text-[var(--text-3)] mt-1">0x${parseInt(b, 2).toString(16).toUpperCase().padStart(2, '0')}</div>
            </div>`).join('')}
        </div>
        <p class="mt-2.5 text-[12.5px] text-[var(--text-4)]">Los ceros subrayados son relleno: el encabezado indica que sólo ${a.totalBits} bits son válidos.</p>
        <div class="mt-7 grid sm:grid-cols-2 gap-3">
          <div class="stat"><div class="k">Con 8 bits por letra</div><div class="v">${bytes.length * 8} bits</div><div class="s">${bytes.length} bytes</div></div>
          <div class="stat stat-hero"><div class="k">Con Huffman</div><div class="v">${a.totalBits} bits</div><div class="s">${bytesOut.length} bytes, ${pct(1 - a.totalBits / (bytes.length * 8))} menos</div></div>
        </div>
        <p class="mt-5 text-[13.5px] text-[var(--text-3)] max-w-prose leading-relaxed">El archivo real añade ${file.headerLen} bytes de encabezado con la tabla de frecuencias. En un texto tan corto pesan más que el ahorro; en un libro completo son casi nada.</p>`;
      },
    ];

    const stage = $('#stage');
    const tabs = $$('#steps .step-tab');
    function show(i, focus) {
      tabs.forEach((t, j) => {
        t.classList.toggle('is-active', i === j);
        t.setAttribute('aria-selected', String(i === j));
        t.tabIndex = i === j ? 0 : -1;
      });
      stage.innerHTML = `<div class="stage-fade">${stages[i]()}</div>`;
      if (i === 2) {
        const set = window.miniTree($('#how-tree'), a.tree, a.mode, { w: 300, h: 210, r: 14, labels: true, freqs: true });
        set(Infinity);
      }
      requestAnimationFrame(() => $$('.grow', stage).forEach((el) => { el.style.width = el.style.getPropertyValue('--w'); }));
      if (focus) tabs[i].focus();
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => show(i));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); show((i + 1) % tabs.length, true); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); show((i + tabs.length - 1) % tabs.length, true); }
      });
    });
    show(0);
    return file;
  }

  /* ------------------------------------------------------------------------
     5) Mapa de bytes del archivo .hfz (sección de formato)
     ------------------------------------------------------------------------ */
  const CATEGORY = { magic: 'id', version: 'id', flags: 'id', encoder: 'id', created: 'meta', size: 'meta', crc: 'meta', bits: 'bits', padding: 'bits', namelen: 'name', name: 'name', count: 'table', widths: 'table', table: 'table', data: 'data' };

  function hexCells(file, header) {
    const owner = new Array(file.length);
    header.segments.forEach((s, i) => { for (let k = s.start; k < s.start + s.len; k++) owner[k] = i; });
    return Array.from(file, (b, k) => {
      const seg = header.segments[owner[k]];
      return `<span class="hexcell seg-${CATEGORY[seg.key]}" data-seg="${owner[k]}" title="${esc(seg.label)}: byte ${k}">${b.toString(16).toUpperCase().padStart(2, '0')}</span>`;
    }).join('');
  }

  function formatSection(file) {
    const h = H.parse(file);
    const map = $('#fmt-hex');
    const fields = $('#fmt-fields');
    const desc = $('#fmt-desc');
    map.innerHTML = hexCells(file, h);
    fields.innerHTML = h.segments.map((s, i) => `
      <div class="field-row" data-seg="${i}" tabindex="0">
        <span class="seg-swatch seg-${CATEGORY[s.key]}"></span>
        <span class="truncate">${esc(s.label)} <span class="text-[var(--text-4)]">${s.len} B</span></span>
        <span class="v">${esc(s.value)}</span>
      </div>`).join('');
    $('#fmt-size').textContent = `${file.length} bytes en total`;

    const focus = (i) => {
      const on = i != null;
      map.classList.toggle('is-focus', on);
      $$('.hexcell', map).forEach((c) => c.classList.toggle('is-on', on && +c.dataset.seg === i));
      $$('.field-row', fields).forEach((r) => r.classList.toggle('is-on', on && +r.dataset.seg === i));
      if (on) {
        const s = h.segments[i];
        desc.innerHTML = `<span class="text-[var(--text-1)] font-medium">${esc(s.label)}</span> <span class="mono text-[12px] text-[var(--text-4)]">bytes ${s.start}–${s.start + Math.max(s.len, 1) - 1}</span><br><span class="text-[var(--text-3)]">${esc(s.desc)}</span>`;
      }
    };
    const pick = (e) => {
      const el = e.target.closest('[data-seg]');
      focus(el ? +el.dataset.seg : null);
    };
    map.addEventListener('pointerover', pick);
    fields.addEventListener('pointerover', pick);
    fields.addEventListener('focusin', pick);
    map.addEventListener('pointerleave', () => focus(null));
    fields.addEventListener('pointerleave', () => focus(null));

    const repo = (CFG.repositorio || '').replace(/\/$/, '');
    $('#spec-link').href = repo ? `${repo}/blob/main/docs/formato-hfz.md` : 'docs/formato-hfz.md';

  }

  document.addEventListener('DOMContentLoaded', () => {
    heroBits();
    mockup();
    marquee();
    const file = howItWorks();
    formatSection(file.file);
  });
})(); 
