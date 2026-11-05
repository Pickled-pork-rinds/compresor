/* ==========================================================================
   js/app.js — Estudio de compresión (app.html) 
   --------------------------------------------------------------------------
   Flujo:  1 Fuente → 2 Analizar → 3 Árbol → 4 Códigos → 5 Comprimir
   El estado vive en el objeto S. Cada paso desbloquea el siguiente.
   Los cálculos los hace js/huffman.js; aquí sólo se muestran.
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, icon, fmtInt, fmtNum, toast, download, copy, segmented } = window.UI;
  const H = window.Huffman;
  const SAMPLES = window.HUFFLY_SAMPLES || [];
  const enc = new TextEncoder();
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const STEPS = [
    { id: 'fuente', label: 'Fuente' },
    { id: 'analizar', label: 'Analizar' },
    { id: 'arbol', label: 'Árbol' },
    { id: 'codigos', label: 'Códigos' },
    { id: 'comprimir', label: 'Comprimir' },
  ];
  const MAX_TREE = 700; // con más hojas el dibujo deja de ser legible
  const S = { doc: null, analysis: null, compressed: null, picked: null, done: new Set(), view: 'fuente' };

  /* ------------------------------------------------------------------------
     Utilidades de presentación
     ------------------------------------------------------------------------ */
  const pct = (x, d = 1) => `${fmtNum(x * 100, d)} %`;
  const baseName = (name) => (name || 'archivo').replace(/\.[^./\\]+$/, '') || 'archivo';
  const info = (sym, mode) => H.symbolInfo(sym, mode);
  const symChip = (sym, mode) => {
    const i = info(sym, mode);
    return `<span class="sym${i.special ? ' is-special' : ''}"${i.name ? ` title="${esc(i.name)}"` : ''}>${esc(i.glyph)}</span>`;
  };
  const codeHtml = (code, max = 36) => {
    const shown = code.length > max ? code.slice(0, max) : code;
    let s = '';
    for (const b of shown) s += `<span class="b${b}">${b}</span>`;
    return `<span class="code" title="${code}">${s}${code.length > max ? '<span class="text-[var(--text-4)]">…</span>' : ''}</span>`;
  };
  const stat = (k, v, s, cls = '') => `<div class="stat ${cls}"><div class="k">${k}</div><div class="v">${v}</div>${s ? `<div class="s">${s}</div>` : ''}</div>`;
  const nodeLabel = (n, mode) => (n.left ? `nodo&nbsp;(${fmtInt(n.freq)})` : `«${esc(info(n.sym, mode).glyph)}»&nbsp;(${fmtInt(n.freq)})`);
  const pause = () => new Promise((r) => setTimeout(r, 30));
  const decodeForDisplay = (bytes) => H.decodeUtf8(bytes) ?? new TextDecoder('windows-1252').decode(bytes);

  async function busy(btn, label, fn) {
    const old = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>${label}`;
    await pause();
    try {
      return await fn();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Ocurrió un error inesperado.', 'err');
    } finally {
      btn.disabled = false;
      btn.innerHTML = old;
    }
  }

  /* ------------------------------------------------------------------------
     Riel de pasos, bloqueo de paneles y navegación
     ------------------------------------------------------------------------ */
  function renderRail() {
    $('#rail').innerHTML =
      '<div class="rail-line"></div><div class="rail-progress" id="rail-progress"></div>' +
      STEPS.map((s, i) => `<a href="#${s.id}" class="rail-step relative" data-step="${s.id}" data-n="${i + 1}"><span class="dot">${i + 1}</span><span>${s.label}</span></a>`).join('');
    $('#stepper-m').innerHTML = STEPS.map((s, i) => `<a href="#${s.id}" data-step="${s.id}" data-n="${i + 1}"><span class="dot mono text-[11px]">${i + 1}</span>${s.label}</a>`).join('');
  }

  function updateRail() {
    $$('[data-step]').forEach((el) => {
      const done = S.done.has(el.dataset.step);
      el.classList.toggle('is-done', done);
      el.classList.toggle('is-current', S.view === el.dataset.step);
      const dot = $('.dot', el);
      if (dot) dot.innerHTML = done ? icon('check', 12) : el.dataset.n;
    });
    const steps = $$('#rail .rail-step');
    let last = -1;
    STEPS.forEach((s, i) => { if (S.done.has(s.id)) last = i; });
    const prog = $('#rail-progress');
    if (prog && steps.length) prog.style.height = last <= 0 ? '0px' : `${steps[last].offsetTop - steps[0].offsetTop}px`;
    const cur = $(`#stepper-m [data-step="${S.view}"]`);
    const box = $('#stepper-m');
    if (cur && box.scrollWidth > box.clientWidth) box.scrollTo({ left: cur.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
  }

  function scrollSpy() {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          S.view = en.target.id;
          updateRail();
        }
      });
    }, { rootMargin: '-30% 0px -65% 0px' });
    STEPS.forEach((s) => io.observe($('#' + s.id)));
  }

  const panel = (id) => $('#' + id);
  function unlock(id) {
    const p = panel(id);
    const l = $('[data-locked]', p);
    const b = $('[data-body]', p);
    if (l) l.hidden = true;
    if (b) b.hidden = false;
  }
  function lock(id) {
    const p = panel(id);
    const l = $('[data-locked]', p);
    const b = $('[data-body]', p);
    if (l) l.hidden = false;
    if (b) b.hidden = true;
    S.done.delete(id);
  }
  function complete(id) {
    S.done.add(id);
    updateRail();
  }
  function go(id) {
    requestAnimationFrame(() => panel(id).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }));
  }

  function docMini() {
    const el = $('#doc-mini');
    if (!S.doc) {
      el.innerHTML = '<div class="text-[var(--text-3)]">Ningún texto cargado.</div>';
      return;
    }
    const n = S.doc.bytes.length;
    let html = `<div class="mini-label">Texto actual</div>
      <div class="mt-1.5 font-medium text-[var(--text-1)] truncate" title="${esc(S.doc.name)}">${esc(S.doc.name)}</div>
      <div class="text-[var(--text-3)]">${H.formatBytes(n)}</div>`;
    if (S.compressed) {
      const c = S.compressed.file.length;
      html += `<div class="mt-3 pt-3 border-t border-[var(--line)] space-y-1">
        <div class="flex justify-between gap-2"><span class="text-[var(--text-3)]">Archivo .hfz</span><span class="text-[var(--text-1)] tabular-nums">${H.formatBytes(c)}</span></div>
        <div class="flex justify-between gap-2"><span class="text-[var(--text-3)]">Reducción</span><span class="tabular-nums" style="color:${c <= n ? 'var(--mint)' : 'var(--amber)'}">${pct((n - c) / n)}</span></div>
      </div>`;
    }
    el.innerHTML = html;
  }

  function resetFrom(step) {
    const order = STEPS.map((s) => s.id);
    order.slice(order.indexOf(step)).forEach(lock);
    updateRail();
  }

  /* ------------------------------------------------------------------------
     1. Fuente
     ------------------------------------------------------------------------ */
  let srcTabs;

  function initSource() {
    srcTabs = segmented($('#src-tabs'), (v) => $$('[data-src]').forEach((el) => { el.hidden = el.dataset.src !== v; }));

    // Archivo local
    const fileIn = $('#file-in');
    fileIn.addEventListener('change', () => {
      if (fileIn.files[0]) readTxt(fileIn.files[0]);
      fileIn.value = '';
    });
    dropzone($('#drop'), readTxt);

    // Ejemplos
    $('#samples').innerHTML = SAMPLES.map((s) => `
      <button type="button" class="text-left rounded-[16px] border border-[var(--line)] bg-white/[0.025] p-4 hover:bg-white/[0.05] hover:border-[var(--line-strong)] transition" data-sample="${s.id}">
        <span class="block font-semibold text-[var(--text-1)]">${esc(s.titulo)}</span>
        <span class="block mt-1 text-[13.5px] text-[var(--text-3)] leading-snug">${esc(s.detalle)}</span>
        <span class="block mt-3 mono text-[12px] text-[var(--text-4)]">${esc(s.archivo)}, ${fmtInt(enc.encode(s.texto).length)} B</span>
      </button>`).join('');
    $('#samples').addEventListener('click', (e) => {
      const b = e.target.closest('[data-sample]');
      if (!b) return;
      const s = SAMPLES.find((x) => x.id === b.dataset.sample);
      setDoc({ name: s.archivo, bytes: enc.encode(s.texto), origin: 'Ejemplo incluido', detail: s.detalle });
    });

    // Texto propio
    const ta = $('#own-text');
    ta.addEventListener('input', () => { $('#own-count').textContent = `${fmtInt([...ta.value].length)} caracteres`; });
    $('#own-use').addEventListener('click', () => setDoc({ name: 'texto-propio.txt', bytes: enc.encode(ta.value), origin: 'Texto escrito', detail: '' }));

    $('#btn-analyze').addEventListener('click', (e) => busy(e.currentTarget, 'Analizando…', analyze));
    $('#mode').addEventListener('change', () => { if (S.analysis) resetFrom('analizar'); updateHint(); });
  }

  function dropzone(zone, onFile) {
    ['dragenter', 'dragover'].forEach((t) => zone.addEventListener(t, (e) => {
      e.preventDefault();
      zone.classList.add('is-over');
    }));
    ['dragleave', 'drop'].forEach((t) => zone.addEventListener(t, (e) => {
      e.preventDefault();
      zone.classList.remove('is-over');
    }));
    zone.addEventListener('drop', (e) => {
      const f = e.dataTransfer && e.dataTransfer.files[0];
      if (f) onFile(f);
    });
  }

  async function readTxt(file) {
    if (/\.hfz$/i.test(file.name)) {
      toast('Ese archivo ya está comprimido. Elige un .txt.', 'err');
      return;
    }
    if (file.size > 60 * 1024 * 1024) {
      toast('El archivo pasa de 60 MB. Para esta demostración usa uno más pequeño.', 'err');
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    setDoc({ name: file.name, bytes, origin: 'Archivo local', detail: 'Subido desde tu equipo.' });
  }

  function setDoc(doc) {
    if (!doc.bytes.length) {
      toast('El texto está vacío. Escribe o elige algo con al menos un carácter.', 'err');
      return;
    }
    stopPlay();
    S.doc = doc;
    S.analysis = null;
    S.compressed = null;
    S.picked = null;
    S.done = new Set(['fuente']);
    ['analizar', 'arbol', 'codigos', 'comprimir'].forEach(lock);

    const text = H.decodeUtf8(doc.bytes);
    doc.text = text;
    doc.ascii = H.isAscii(doc.bytes);
    doc.enc = text === null ? 'no es UTF-8 válido' : doc.ascii ? 'ASCII' : 'UTF-8';
    let lines = 1;
    for (let i = 0; i < doc.bytes.length; i++) if (doc.bytes[i] === 10) lines++;
    const shown = (text ?? decodeForDisplay(doc.bytes.subarray(0, 12000))).slice(0, 2500);
    const total = text ? text.length : doc.bytes.length;

    $('#doc-card').hidden = false;
    $('#doc-name').textContent = doc.name;
    $('#doc-meta').innerHTML = `<span class="inline-flex flex-wrap gap-x-3 gap-y-0.5"><span>${H.formatBytes(doc.bytes.length)}</span><span>${fmtInt(doc.bytes.length)} bytes</span><span>${fmtInt(lines)} líneas</span><span>${doc.enc}</span><span>${esc(doc.origin)}</span></span>`;
    $('#doc-preview').textContent = shown + (total > shown.length ? `\n\n[… ${fmtInt(total - shown.length)} caracteres más]` : '');
    const mode = $('#mode');
    mode.value = 'auto';
    mode.querySelector('[value="char"]').disabled = text === null;
    updateHint();
    docMini();
    updateRail();
    requestAnimationFrame(() => $('#doc-card').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }));
  }

  function updateHint() {
    if (!S.doc) return;
    const m = $('#mode').value;
    let t;
    if (m === 'byte') t = 'Cada byte es un símbolo: la «ñ» en UTF-8 cuenta como dos.';
    else if (m === 'char') t = 'Cada carácter Unicode es un símbolo: la «ñ» cuenta como uno.';
    else if (S.doc.text === null) t = 'No es UTF-8 válido: se usará el modo byte, que funciona con cualquier archivo.';
    else if (S.doc.ascii) t = 'Sólo tiene caracteres ASCII: carácter y byte coinciden, se usará el modo byte.';
    else t = 'Tiene acentos o símbolos fuera de ASCII: se usará el modo carácter.';
    $('#doc-hint').textContent = t;
  }

  /* ------------------------------------------------------------------------
     2. Analizar
     ------------------------------------------------------------------------ */
  const FT = { sort: 'freq', dir: -1, q: '' };

  function analyze() {
    const t0 = performance.now();
    const a = H.analyze(S.doc.bytes, $('#mode').value);
    a.ms = performance.now() - t0;
    S.analysis = a;
    S.compressed = null;
    S.picked = null;
    resetFrom('analizar');
    unlock('analizar');
    renderAnalysis();
    complete('analizar');
    docMini();
    go('analizar');
  }

  function renderAnalysis() {
    const a = S.analysis;
    const n = S.doc.bytes.length;
    $('#an-stats').innerHTML =
      stat('Tamaño', H.formatBytes(n), `${fmtInt(n)} bytes`) +
      stat('Símbolos en el texto', fmtInt(a.total), a.mode === 'char' ? 'caracteres' : 'bytes') +
      stat('Símbolos distintos', fmtInt(a.entries.length), 'hojas del árbol') +
      stat('Entropía', `${fmtNum(a.entropy, 3)}`, 'bits por símbolo, el mínimo teórico') +
      stat('Modo', a.mode === 'char' ? 'Carácter' : 'Byte', a.mode === 'char' ? 'Unicode en UTF-8' : 'valores de 0 a 255');

    const cabe = Math.max(12, Math.min(40, Math.floor(($('#histo').clientWidth || 800) / 11)));
    const top = [...a.entries].sort((x, y) => y.freq - x.freq || x.sym - y.sym).slice(0, cabe);
    const max = top.length ? top[0].freq : 1;
    $('#histo-title').textContent = `Los ${top.length} símbolos más frecuentes`;
    $('#histo').innerHTML = top.map((e) => {
      const i = info(e.sym, a.mode);
      const lab = i.glyph.length > 2 ? '·' : i.glyph;
      return `<div class="col" title="${esc(i.glyph)}${i.name ? ` (${esc(i.name)})` : ''}: ${fmtInt(e.freq)} veces, ${pct(e.freq / a.total, 2)}"><div class="bar" style="height:${Math.max(1.5, (e.freq / max) * 100)}%"></div><span class="lab">${esc(lab)}</span></div>`;
    }).join('');
    renderFreqTable();
  }

  function matches(e, mode, q) {
    if (!q) return true;
    const i = info(e.sym, mode);
    const hex = H.hexSym(e.sym, mode).toLowerCase();
    const ql = q.toLowerCase();
    return i.glyph === q || i.glyph.toLowerCase() === ql || (i.name && i.name.includes(ql)) || hex.includes(ql);
  }

  function renderFreqTable() {
    const a = S.analysis;
    const rows = a.entries.filter((e) => matches(e, a.mode, FT.q));
    rows.sort((x, y) => (FT.sort === 'freq' ? (x.freq - y.freq) * FT.dir || x.sym - y.sym : (x.sym - y.sym) * FT.dir));
    const max = Math.max(...a.entries.map((e) => e.freq));
    const LIMIT = 600;
    $('#freq-tbl tbody').innerHTML = rows.slice(0, LIMIT).map((e) => `
      <tr><td>${symChip(e.sym, a.mode)}</td><td class="mono text-[12.5px] text-[var(--text-3)]">${H.hexSym(e.sym, a.mode)}</td>
      <td class="num text-[var(--text-1)]">${fmtInt(e.freq)}</td><td class="num">${pct(e.freq / a.total, 2)}</td>
      <td><div class="minibar"><i style="width:${(e.freq / max) * 100}%"></i></div></td></tr>`).join('');
    $('#freq-count').textContent = `${fmtInt(rows.length)} de ${fmtInt(a.entries.length)} símbolos${rows.length > LIMIT ? `, se muestran ${LIMIT}` : ''}`;
  }

  function initAnalysis() {
    $('#freq-q').addEventListener('input', (e) => {
      FT.q = e.target.value.trim();
      if (S.analysis) renderFreqTable();
    });
    $$('#freq-tbl [data-sort]').forEach((b) => b.addEventListener('click', () => {
      if (FT.sort === b.dataset.sort) FT.dir *= -1;
      else {
        FT.sort = b.dataset.sort;
        FT.dir = FT.sort === 'freq' ? -1 : 1;
      }
      renderFreqTable();
    }));
    $('#btn-tree').addEventListener('click', buildTree);
  }

  /* ------------------------------------------------------------------------
     3. Árbol (animación de las uniones voraces)
     ------------------------------------------------------------------------ */
  let tv = null;
  const T = { k: 0, n: 0, timer: null, playing: false };
  const DELAYS = [1100, 760, 520, 360, 250, 170, 110, 70, 40, 18];

  function buildTree() {
    const a = S.analysis;
    stopPlay();
    resetFrom('arbol');
    unlock('arbol');
    complete('arbol');
    if (!tv) tv = new window.TreeView($('#tree-stage'), { onPick: onTreePick });
    if (a.entries.length > MAX_TREE) {
      tv.setTree(null);
      $('#tree-stage .tree-hint').textContent = `El árbol tiene ${fmtInt(a.entries.length)} hojas: es demasiado grande para dibujarlo con claridad. La cola, la narración y la tabla de códigos sí están completas.`;
    } else {
      tv.setTree(a.tree, a.mode, a.steps);
      tv.codes = a.codes;
      $('#tree-stage .tree-hint').textContent = 'Arrastra para mover. Rueda o pellizco para acercar.';
    }
    T.n = a.steps.length;
    const scrub = $('#t-scrub');
    scrub.max = T.n;
    setK(0);
    go('arbol');
    if (T.n) setTimeout(() => play(true), reduce ? 50 : 650);
  }

  function aliveAt(k) {
    const a = S.analysis;
    return [...a.leaves, ...a.steps.map((s) => s.node)]
      .filter((n) => n.step <= k && (n.mergedAt === 0 || n.mergedAt > k))
      .sort((x, y) => x.freq - y.freq || x.id - y.id);
  }

  function setK(k) {
    T.k = Math.max(0, Math.min(T.n, k));
    const a = S.analysis;
    if (tv && a.entries.length <= MAX_TREE) tv.setStep(T.k);
    const scrub = $('#t-scrub');
    scrub.value = T.k;
    scrub.style.setProperty('--p', `${T.n ? (T.k / T.n) * 100 : 100}%`);
    $('#t-count').textContent = `${T.k} / ${T.n}`;
    $('#t-first').disabled = $('#t-prev').disabled = T.k === 0;
    $('#t-next').disabled = $('#t-last').disabled = T.k === T.n;

    const list = aliveAt(T.k);
    const LIMIT = 90;
    $('#queue').innerHTML = list.slice(0, LIMIT).map((n, i) => {
      const next = T.k < T.n && i < 2 ? ' is-next' : '';
      return n.left ? `<span class="q is-node${next}">${fmtInt(n.freq)}</span>` : `<span class="q${next}">${esc(info(n.sym, a.mode).glyph)}<em>${fmtInt(n.freq)}</em></span>`;
    }).join('') + (list.length > LIMIT ? `<span class="q">+${list.length - LIMIT}</span>` : '');
    $('#q-count').textContent = `${fmtInt(list.length)} ${list.length === 1 ? 'nodo' : 'nodos'}`;

    let t;
    if (T.n === 0) t = `Sólo hay un símbolo distinto: el árbol es una sola hoja y su código es <b>0</b>.`;
    else if (T.k === 0) t = `Inicio: la cola tiene <b>${fmtInt(a.entries.length)}</b> hojas, una por símbolo, ordenadas por frecuencia. Reproduce o avanza para unir los dos menores.`;
    else {
      const st = a.steps[T.k - 1];
      t = `Unión <b>${T.k}</b> de ${T.n}: se sacan ${nodeLabel(st.a, a.mode)} y ${nodeLabel(st.b, a.mode)}, los dos más ligeros, y se crea un nodo con frecuencia <b>${fmtInt(st.node.freq)}</b>.`;
      if (T.k === T.n) t += ` El árbol está completo: la raíz suma <b>${fmtInt(a.total)}</b>, el total de símbolos del texto.`;
    }
    $('#narration').innerHTML = t;
  }

  function setPlayIcon() {
    const b = $('#t-play');
    b.innerHTML = icon(T.playing ? 'pause' : 'play', 17);
    b.setAttribute('aria-label', T.playing ? 'Pausar' : 'Reproducir');
  }

  function play(auto) {
    if (T.k >= T.n) setK(0);
    stopPlay();
    T.playing = true;
    setPlayIcon();
    const tick = () => {
      if (T.k >= T.n) {
        stopPlay();
        return;
      }
      setK(T.k + 1);
      const base = DELAYS[+$('#t-speed').value - 1];
      T.timer = setTimeout(tick, auto && T.n > 60 ? base * 0.45 : base);
    };
    T.timer = setTimeout(tick, 160);
  }

  function stopPlay() {
    clearTimeout(T.timer);
    T.playing = false;
    setPlayIcon();
  }

  function onTreePick(sym) {
    const a = S.analysis;
    if (!a) return;
    if (S.done.has('codigos')) pickSymbol(sym, true);
    else {
      tv.highlight(sym);
      toast(`«${info(sym, a.mode).glyph}»: código ${a.codes.get(sym)}`);
    }
  }

  function initTree() {
    setPlayIcon();
    $('#t-play').addEventListener('click', () => (T.playing ? stopPlay() : play(false)));
    $('#t-first').addEventListener('click', () => { stopPlay(); setK(0); });
    $('#t-prev').addEventListener('click', () => { stopPlay(); setK(T.k - 1); });
    $('#t-next').addEventListener('click', () => { stopPlay(); setK(T.k + 1); });
    $('#t-last').addEventListener('click', () => { stopPlay(); setK(T.n); });
    $('#t-scrub').addEventListener('input', (e) => { stopPlay(); setK(+e.target.value); });
    document.addEventListener('keydown', (e) => {
      if (S.view !== 'arbol' || !S.analysis || e.target.closest('input, textarea, select, button')) return;
      if (e.key === 'ArrowRight') { stopPlay(); setK(T.k + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { stopPlay(); setK(T.k - 1); e.preventDefault(); }
      if (e.key === ' ') { T.playing ? stopPlay() : play(false); e.preventDefault(); }
    });
    $('#btn-codes').addEventListener('click', () => {
      stopPlay();
      setK(T.n);
      renderCodes();
      unlock('codigos');
      complete('codigos');
      go('codigos');
    });
  }

  /* ------------------------------------------------------------------------
     4. Códigos
     ------------------------------------------------------------------------ */
  let codeQ = '';

  function renderCodes() {
    const a = S.analysis;
    const L = a.total ? a.totalBits / a.total : 0;
    const lens = a.entries.map((e) => e.code.length);
    $('#code-stats').innerHTML =
      stat('Longitud media', fmtNum(L, 3), 'bits por símbolo') +
      stat('Entropía', fmtNum(a.entropy, 3), 'bits por símbolo, el límite') +
      stat('Eficiencia', L ? pct(a.entropy / L) : '—', 'qué tan cerca del límite') +
      stat('Códigos', `${Math.min(...lens)} a ${Math.max(...lens)}`, 'bits, el más corto y el más largo');
    renderCodeTable();
    const first = Array.from(a.seq.subarray ? a.seq.subarray(0, 60) : a.seq.slice(0, 60));
    $('#tape').innerHTML = first.map((s) => `<div class="tok"><b>${esc(info(s, a.mode).glyph)}</b><span>${a.codes.get(s)}</span></div>`).join('') +
      (a.total > 60 ? `<div class="tok"><b>…</b><span>${fmtInt(a.totalBits)} bits</span></div>` : '');
    if (S.picked != null) pickSymbol(S.picked, false);
  }

  function renderCodeTable() {
    const a = S.analysis;
    const rows = a.entries.filter((e) => matches(e, a.mode, codeQ)).sort((x, y) => y.freq - x.freq || x.sym - y.sym);
    $('#code-tbl tbody').innerHTML = rows.slice(0, 600).map((e) => `
      <tr data-sym="${e.sym}" class="cursor-pointer${e.sym === S.picked ? ' is-picked' : ''}" tabindex="0">
        <td>${symChip(e.sym, a.mode)}</td><td class="num">${fmtInt(e.freq)}</td><td>${codeHtml(e.code)}</td>
        <td class="num">${e.code.length}</td><td class="num">${fmtInt(e.freq * e.code.length)}</td></tr>`).join('');
  }

  function pickSymbol(sym, scrollRow) {
    const a = S.analysis;
    S.picked = sym;
    $$('#code-tbl tbody tr').forEach((tr) => tr.classList.toggle('is-picked', +tr.dataset.sym === sym));
    if (scrollRow) {
      const tr = $(`#code-tbl tbody tr[data-sym="${sym}"]`);
      if (tr) tr.scrollIntoView({ block: 'nearest' });
    }
    if (tv) tv.highlight(sym);
    const code = a.codes.get(sym);
    const e = a.entries.find((x) => x.sym === sym);
    let n = a.tree;
    const parts = [`<span class="q is-node">raíz ${fmtInt(n.freq)}</span>`];
    const bits = code.length > 22 ? null : code;
    if (bits && n.left) {
      for (const b of bits) {
        n = b === '1' ? n.right : n.left;
        parts.push(`<span class="code text-[13px]"><span class="b${b}">${b}</span></span>`);
        parts.push(n.left ? `<span class="q is-node">${fmtInt(n.freq)}</span>` : `<span class="q is-next">${esc(info(n.sym, a.mode).glyph)}<em>${fmtInt(n.freq)}</em></span>`);
      }
    }
    const g = esc(info(sym, a.mode).glyph);
    $('#path-box').innerHTML = `
      ${bits ? `<div class="queue max-h-none items-center">${parts.join('')}</div>` : `<div class="queue max-h-none">${codeHtml(code, 80)}</div>`}
      <p class="mt-3 text-[var(--text-3)]">«<span class="text-[var(--text-1)]">${g}</span>» aparece ${fmtInt(e.freq)} veces y su código mide ${code.length} ${code.length === 1 ? 'bit' : 'bits'}: aporta <span class="text-[var(--text-1)]">${fmtInt(e.freq * code.length)}</span> bits al archivo.</p>`;
  }

  function initCodes() {
    $('#code-q').addEventListener('input', (e) => {
      codeQ = e.target.value.trim();
      if (S.analysis) renderCodeTable();
    });
    const tbody = $('#code-tbl tbody');
    tbody.addEventListener('click', (e) => {
      const tr = e.target.closest('tr[data-sym]');
      if (tr) pickSymbol(+tr.dataset.sym, false);
    });
    tbody.addEventListener('keydown', (e) => {
      const tr = e.target.closest('tr[data-sym]');
      if (tr && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        pickSymbol(+tr.dataset.sym, false);
      }
    });
    $('#btn-compress').addEventListener('click', (e) => busy(e.currentTarget, 'Comprimiendo…', compress));
  }

  /* ------------------------------------------------------------------------
     5. Comprimir
     ------------------------------------------------------------------------ */
  function compress() {
    const t0 = performance.now();
    const r = H.compress(S.doc.bytes, { analysis: S.analysis, name: S.doc.name });
    r.ms = performance.now() - t0;
    r.name = `${baseName(S.doc.name)}.hfz`;
    S.compressed = r;
    renderCompress();
    unlock('comprimir');
    complete('comprimir');
    docMini();
    go('comprimir');
  }

  function renderCompress() {
    const r = S.compressed;
    const a = S.analysis;
    const n = S.doc.bytes.length;
    const c = r.file.length;
    const saved = n - c;
    const L = a.totalBits / a.total;
    $('#metrics').innerHTML =
      stat('Original', H.formatBytes(n), `${fmtInt(n)} bytes`) +
      stat('Comprimido', H.formatBytes(c), `${fmtInt(c)} bytes`) +
      stat(saved >= 0 ? 'Ahorro' : 'Crecimiento', H.formatBytes(Math.abs(saved)), `${fmtInt(Math.abs(saved))} bytes`) +
      stat(saved >= 0 ? 'Reducción' : 'Aumento', pct(Math.abs(saved) / n), `razón de compresión ${fmtNum(n / c, 2)}\u00a0:\u00a01`, saved >= 0 ? 'stat-hero' : 'stat-warn') +
      stat('Símbolos distintos', fmtInt(a.entries.length), a.mode === 'char' ? 'caracteres Unicode' : 'valores de byte') +
      stat('Bits codificados', fmtInt(a.totalBits), `${fmtInt(r.dataLen)} bytes de datos`) +
      stat('Encabezado', `${fmtInt(r.headerLen)} B`, `${pct(r.headerLen / c)} del archivo`) +
      stat('Tiempo', `${fmtNum(r.ms + (a.ms || 0), 0)} ms`, 'análisis y compresión en tu navegador');

    const max = Math.max(n, c);
    const w = (x) => `${Math.max(0.4, (x / max) * 100)}%`;
    $('#sizes').innerHTML = `
      <div>
        <div class="flex justify-between gap-3 text-[13.5px]"><span>Texto original</span><span class="mono text-[var(--text-1)]">${H.formatBytes(n)}</span></div>
        <div class="split mt-2"><i style="width:${w(n)};background:var(--violet)"></i></div>
      </div>
      <div>
        <div class="flex justify-between gap-3 text-[13.5px]"><span>${esc(r.name)}</span><span class="mono text-[var(--text-1)]">${H.formatBytes(c)}</span></div>
        <div class="split mt-2"><i style="width:${w(r.headerLen)};background:var(--seg-table)"></i><i style="width:${w(r.dataLen)};background:var(--seg-data)"></i></div>
        <div class="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-[var(--text-3)]">
          <span class="inline-flex items-center gap-2"><span class="seg-swatch seg-table"></span>Encabezado ${fmtInt(r.headerLen)} B</span>
          <span class="inline-flex items-center gap-2"><span class="seg-swatch seg-data"></span>Datos ${fmtInt(r.dataLen)} B</span>
        </div>
      </div>
      ${saved < 0 ? `<p class="text-[13px] text-[var(--amber)] leading-relaxed">El archivo creció porque el encabezado (${fmtInt(r.headerLen)} B) pesa más que lo que ahorran los códigos. Con textos más largos ocurre lo contrario.</p>` : ''}`;

    const orig = (n * 8) / a.total;
    const fixed = Math.max(1, Math.ceil(Math.log2(a.entries.length)));
    const rows = [
      { k: a.mode === 'char' ? 'Original en UTF-8' : 'Original, 8 bits por byte', v: orig, c: 'var(--violet)' },
      { k: 'Código de longitud fija', v: fixed, c: 'var(--blue)' },
      { k: 'Huffman', v: L, c: 'var(--coral)' },
      { k: 'Entropía, el límite', v: a.entropy, c: 'var(--mint)' },
    ];
    const top = Math.max(...rows.map((x) => x.v));
    $('#cmp').innerHTML = rows.map((x) => `
      <div class="cmp-row"><span class="${x.k === 'Huffman' ? 'text-[var(--text-1)] font-medium' : ''}">${x.k}</span><div class="track"><div class="fill" style="width:${(x.v / top) * 100}%;background:${x.c}"></div></div><span class="val">${fmtNum(x.v, 2)}</span></div>`).join('');

    $('#btn-download').innerHTML = `${icon('download', 17)}Descargar ${esc(r.name)}`;
    $('#btn-md').innerHTML = `${icon('copy', 17)}Copiar resultados en Markdown`;
  }

  function markdownRow() {
    const r = S.compressed;
    const a = S.analysis;
    const n = S.doc.bytes.length;
    const c = r.file.length;
    const both = (x) => `${H.formatBytes(x)} (${fmtInt(x)} B)`;
    return [
      '| Archivo | Original | Comprimido | Ahorro | Reducción | Razón | Símbolos distintos | Modo |',
      '|---|---|---|---|---|---|---|---|',
      `| ${S.doc.name} | ${both(n)} | ${both(c)} | ${both(n - c)} | ${pct((n - c) / n)} | ${fmtNum(n / c, 2)} : 1 | ${a.entries.length} | ${a.mode === 'char' ? 'carácter' : 'byte'} |`,
    ].join('\n');
  }

  function initCompress() {
    $('#btn-download').addEventListener('click', () => {
      download(S.compressed.file, S.compressed.name);
      toast(`${S.compressed.name} descargado`, 'ok');
    });
    $('#btn-md').addEventListener('click', async () => {
      await copy(markdownRow());
      toast('Resultados copiados. Pégalos en tu README.', 'ok');
    });
  }

  /* ------------------------------------------------------------------------
     Arranque
     ------------------------------------------------------------------------ */
  function icons() {
    $$('[data-icon-inline]').forEach((el) => { el.innerHTML = icon(el.dataset.iconInline, el.classList.contains('icon-tile') ? 18 : 17); });
    $$('[data-icon]').forEach((el) => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon, 16)));
  }

  document.addEventListener('DOMContentLoaded', () => {
    icons();
    renderRail();
    initSource();
    initAnalysis();
    initTree();
    initCodes();
    initCompress();
    updateRail();
    scrollSpy();

    // Desde la portada, «Mira el árbol crecer» abre el árbol del Quijote
    if (location.hash === '#arbol') {
      const s = SAMPLES.find((x) => x.id === 'quijote');
      if (s) {
        setDoc({ name: s.archivo, bytes: enc.encode(s.texto), origin: 'Ejemplo incluido', detail: s.detalle });
        analyze();
        setTimeout(buildTree, 250);
      }
    }
  });
})();
