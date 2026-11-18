/* ==========================================================================
   js/mst-view.js — Laboratorio de árbol de expansión mínima (mst.html)
   --------------------------------------------------------------------------
   Dibuja el grafo en SVG y reproduce los pasos que calculan js/mst.js:
   · Kruskal: aristas ordenadas; cada una se acepta o se descarta (ciclo)
   · Prim: el árbol crece desde un vértice; se muestra la frontera
   ========================================================================== */
(function () {
  'use strict';
  const { $, $$, esc, icon, segmented, fmtInt } = window.UI;
  const M = window.MST;
  const W = 720;
  const Hh = 430;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DELAYS = [1600, 1150, 850, 640, 480, 360, 260, 180, 110, 60];
  const HUES = [262, 200, 160, 30, 330, 120, 280, 50, 185, 0, 225, 95, 300, 15, 140, 245];
  const L = (i) => String.fromCharCode(65 + i);

  const PSEUDO = {
    kruskal: [
      'ordenar las aristas de menor a mayor peso',
      'para cada arista (u, v) en ese orden:',
      '  si u y v están en componentes distintas:',
      '    agregar (u, v) al árbol',
      '    unir las componentes de u y v',
      '  si no: descartarla, formaría un ciclo',
    ],
    prim: [
      'empezar con el vértice inicial en el árbol',
      'mientras falten vértices por conectar:',
      '  tomar la arista más barata de la frontera',
      '  agregarla junto con su vértice nuevo',
    ],
  };
  const COMPLEXITY = {
    kruskal: 'Ordenar cuesta O(E log E) y cada consulta a Unión-Búsqueda es casi constante. Total: O(E log E).',
    prim: 'Esta versión revisa todas las aristas en cada paso: O(V·E). Con un montículo de prioridad baja a O(E log V).',
  };

  const S = { algo: 'kruskal', n: 9, seed: 7, start: 0, graph: null, run: null, k: 0, timer: null, playing: false };

  /* ------------------------------------------------------------------------
     Grafo
     ------------------------------------------------------------------------ */
  function newGraph(seed) {
    S.seed = seed;
    S.graph = M.makeGraph(S.n, seed, W, Hh);
    if (S.start >= S.graph.nodes.length) S.start = 0;
    $('#g-start').innerHTML = S.graph.nodes.map((_, i) => `<option value="${i}"${i === S.start ? ' selected' : ''}>${L(i)}</option>`).join('');
    drawGraph();
    compute();
  }

  function compute() {
    stop();
    S.run = S.algo === 'kruskal' ? M.kruskal(S.graph) : M.prim(S.graph, S.start);
    S.other = S.algo === 'kruskal' ? M.prim(S.graph, S.start) : M.kruskal(S.graph);
    const scrub = $('#m-scrub');
    scrub.max = S.run.steps.length;
    $('#pseudo').innerHTML = PSEUDO[S.algo].map((l, i) => `<li class="px-2 py-1 rounded-md whitespace-pre-wrap transition-colors" data-line="${i}"><span class="text-[var(--text-4)] mr-2">${i + 1}</span>${esc(l)}</li>`).join('');
    $('#code-title').textContent = `Pseudocódigo de ${S.algo === 'kruskal' ? 'Kruskal' : 'Prim'}`;
    $('#complexity').textContent = COMPLEXITY[S.algo];
    $('#start-wrap').hidden = S.algo !== 'prim';
    setK(0);
  }

  function drawGraph() {
    const g = S.graph;
    $('#g').innerHTML =
      '<g id="edges">' +
      g.edges.map((e) => `<g class="g-edge" data-e="${e.id}"><line/><rect class="w-bg" width="28" height="19" rx="6"/><text>${e.w}</text></g>`).join('') +
      '</g><g id="nodes">' +
      g.nodes.map((n, i) => `<g class="g-node" data-v="${i}"><circle r="17"/><text>${L(i)}</text></g>`).join('') +
      '</g>';
    place();
  }

  function place() {
    const g = S.graph;
    $$('#g .g-edge').forEach((el) => {
      const e = g.edges[+el.dataset.e];
      const a = g.nodes[e.a];
      const b = g.nodes[e.b];
      const line = el.querySelector('line');
      line.setAttribute('x1', a.x);
      line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x);
      line.setAttribute('y2', b.y);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      el.querySelector('rect').setAttribute('x', mx - 14);
      el.querySelector('rect').setAttribute('y', my - 9.5);
      el.querySelector('text').setAttribute('x', mx);
      el.querySelector('text').setAttribute('y', my);
    });
    $$('#g .g-node').forEach((el) => {
      const n = g.nodes[+el.dataset.v];
      el.setAttribute('transform', `translate(${n.x},${n.y})`);
    });
  }

  /* ------------------------------------------------------------------------
     Estado después de k pasos
     ------------------------------------------------------------------------ */
  function setK(k) {
    const run = S.run;
    const g = S.graph;
    S.k = Math.max(0, Math.min(run.steps.length, k));
    const done = run.steps.slice(0, S.k);
    const cur = S.k > 0 ? run.steps[S.k - 1] : null;
    const inTree = new Set(done.filter((s) => s.accepted).map((s) => s.edge));
    const out = new Set(done.filter((s) => !s.accepted).map((s) => s.edge));
    const total = cur ? cur.total : 0;

    // Componentes (Kruskal) o vértices del árbol (Prim)
    const dsu = new M.DSU(g.nodes.length);
    done.filter((s) => s.accepted).forEach((s) => dsu.union(g.edges[s.edge].a, g.edges[s.edge].b));
    const treeNodes = new Set([S.start, ...done.map((s) => s.node).filter((x) => x != null)]);
    let frontier = [];
    if (S.algo === 'prim') {
      frontier = g.edges.filter((e) => treeNodes.has(e.a) !== treeNodes.has(e.b)).sort((x, y) => x.w - y.w || x.id - y.id);
    }

    $$('#g .g-edge').forEach((el) => {
      const id = +el.dataset.e;
      el.classList.toggle('is-in', inTree.has(id));
      el.classList.toggle('is-out', out.has(id));
      el.classList.toggle('is-current', !!cur && cur.edge === id);
      el.classList.toggle('is-frontier', S.algo === 'prim' && S.k < run.steps.length && frontier.some((e) => e.id === id));
    });
    $$('#g .g-node').forEach((el) => {
      const v = +el.dataset.v;
      const circle = el.querySelector('circle');
      el.classList.toggle('is-start', S.algo === 'prim' && v === S.start);
      if (S.algo === 'prim') {
        el.classList.toggle('is-tree', treeNodes.has(v));
        circle.style.fill = '';
      } else {
        el.classList.remove('is-tree');
        const root = dsu.find(v);
        const size = g.nodes.filter((_, i) => dsu.find(i) === root).length;
        circle.style.fill = size > 1 ? `hsl(${HUES[root % HUES.length]} 70% 52%)` : '';
      }
    });

    // Lista lateral
    const list = $('#edge-list');
    if (S.algo === 'kruskal') {
      $('#list-title').textContent = 'Aristas ordenadas por peso';
      const pos = new Map(run.steps.map((s, i) => [s.edge, i]));
      list.innerHTML = run.sorted.map((e) => {
        const i = pos.get(e.id);
        let cls = '';
        let ico = '·';
        if (i != null && i < S.k) {
          cls = run.steps[i].accepted ? 'is-in' : 'is-out';
          ico = run.steps[i].accepted ? '✓' : '✕';
        }
        if (cur && cur.edge === e.id) cls += ' is-current';
        if (i == null) cls += ' opacity-40';
        return `<li class="${cls}" data-e="${e.id}"><span class="ico">${ico}</span><span>${L(e.a)}–${L(e.b)}</span><span>${e.w}</span></li>`;
      }).join('');
      $('#list-count').textContent = `${run.sorted.length} aristas`;
    } else {
      $('#list-title').textContent = S.k < run.steps.length ? 'Frontera: aristas que salen del árbol' : 'Aristas del árbol';
      const rows = S.k < run.steps.length ? frontier : g.edges.filter((e) => inTree.has(e.id)).sort((x, y) => x.w - y.w);
      list.innerHTML = rows.map((e, i) => {
        const next = S.k < run.steps.length && i === 0;
        return `<li class="${next ? 'is-current' : inTree.has(e.id) ? 'is-in' : ''}"><span class="ico">${next ? '→' : inTree.has(e.id) ? '✓' : '·'}</span><span>${L(e.a)}–${L(e.b)}</span><span>${e.w}</span></li>`;
      }).join('') || '<li class="opacity-60"><span class="ico">·</span><span>Sin aristas</span><span></span></li>';
      $('#list-count').textContent = `${rows.length}`;
    }
    const curLi = $('#edge-list .is-current');
    if (curLi) curLi.scrollIntoView({ block: 'nearest' });

    // Pseudocódigo: líneas que se ejecutaron en este paso
    let lines = [0];
    if (cur) lines = S.algo === 'kruskal' ? (cur.accepted ? [2, 3, 4] : [2, 5]) : [2, 3];
    $$('#pseudo [data-line]').forEach((li) => {
      const on = lines.includes(+li.dataset.line);
      li.style.background = on ? 'rgba(255, 200, 87, 0.12)' : '';
      li.style.color = on ? 'var(--amber)' : '';
    });

    // Narración
    const nEdges = g.nodes.length - 1;
    let t;
    if (!cur) {
      t = S.algo === 'kruskal'
        ? `Las <b>${g.edges.length}</b> aristas están ordenadas de menor a mayor peso. Kruskal las revisa en ese orden y acepta cada una que no forme un ciclo.`
        : `Prim empieza en <b>${L(S.start)}</b>. En cada paso toma la arista más barata que conecta el árbol con un vértice nuevo.`;
    } else {
      const e = g.edges[cur.edge];
      if (S.algo === 'kruskal') {
        t = cur.accepted
          ? `Arista <b>${L(e.a)}–${L(e.b)}</b> de peso <b>${e.w}</b>: une dos componentes distintas, así que se acepta. Peso acumulado: <b>${total}</b>.`
          : `Arista <b>${L(e.a)}–${L(e.b)}</b> de peso <b>${e.w}</b>: sus extremos ya están conectados, formaría un ciclo y se descarta.`;
      } else {
        t = `Se agrega <b>${L(cur.node)}</b> mediante <b>${L(e.a)}–${L(e.b)}</b> (peso <b>${e.w}</b>), la arista más barata de la frontera. Peso acumulado: <b>${total}</b>.`;
      }
      if (S.k === run.steps.length) t += ` Listo: el árbol tiene <b>${nEdges}</b> aristas y pesa <b>${run.total}</b>.`;
    }
    $('#g-narr').innerHTML = t;

    // Transporte y estadísticas
    const scrub = $('#m-scrub');
    scrub.value = S.k;
    scrub.style.setProperty('--p', `${run.steps.length ? (S.k / run.steps.length) * 100 : 0}%`);
    $('#m-count').textContent = `${S.k} / ${run.steps.length}`;
    $('#m-first').disabled = $('#m-prev').disabled = S.k === 0;
    $('#m-next').disabled = $('#m-last').disabled = S.k === run.steps.length;
    const allW = g.edges.reduce((s, e) => s + e.w, 0);
    const finished = S.k === run.steps.length;
    $('#g-stats').innerHTML = `
      <div class="stat"><div class="k">Peso acumulado</div><div class="v">${fmtInt(total)}</div><div class="s">de ${fmtInt(allW)} si se usaran todas</div></div>
      <div class="stat"><div class="k">Aristas en el árbol</div><div class="v">${inTree.size} / ${nEdges}</div><div class="s">${S.algo === 'kruskal' ? `${out.size} descartadas por formar ciclo` : `${treeNodes.size} de ${g.nodes.length} vértices`}</div></div>
      <div class="stat ${finished ? 'stat-hero' : ''}"><div class="k">${S.algo === 'kruskal' ? 'Prim' : 'Kruskal'} llega a</div><div class="v">${fmtInt(S.other.total)}</div><div class="s">${S.other.total === run.total ? 'el mismo peso mínimo' : 'otro peso: revisa el grafo'}</div></div>`;
  }

  /* ------------------------------------------------------------------------
     Reproducción
     ------------------------------------------------------------------------ */
  function setPlayIcon() {
    const b = $('#m-play');
    b.innerHTML = icon(S.playing ? 'pause' : 'play', 17);
    b.setAttribute('aria-label', S.playing ? 'Pausar' : 'Reproducir');
  }
  function play() {
    if (S.k >= S.run.steps.length) setK(0);
    stop();
    S.playing = true;
    setPlayIcon();
    const tick = () => {
      if (S.k >= S.run.steps.length) {
        stop();
        return;
      }
      setK(S.k + 1);
      S.timer = setTimeout(tick, reduce ? 300 : DELAYS[+$('#m-speed').value - 1]);
    };
    S.timer = setTimeout(tick, 200);
  }
  function stop() {
    clearTimeout(S.timer);
    S.playing = false;
    setPlayIcon();
  }

  /* ------------------------------------------------------------------------
     Arrastrar vértices
     ------------------------------------------------------------------------ */
  function enableDrag() {
    const svg = $('#g');
    let drag = null;
    const toSvg = (e) => {
      const p = svg.createSVGPoint();
      p.x = e.clientX;
      p.y = e.clientY;
      return p.matrixTransform(svg.getScreenCTM().inverse());
    };
    svg.addEventListener('pointerdown', (e) => {
      const node = e.target.closest('.g-node');
      if (!node) return;
      drag = +node.dataset.v;
      svg.setPointerCapture(e.pointerId);
      node.style.cursor = 'grabbing';
    });
    svg.addEventListener('pointermove', (e) => {
      if (drag == null) return;
      const p = toSvg(e);
      const n = S.graph.nodes[drag];
      n.x = Math.max(20, Math.min(W - 20, p.x));
      n.y = Math.max(20, Math.min(Hh - 20, p.y));
      place();
    });
    const end = () => {
      if (drag == null) return;
      $$('#g .g-node').forEach((el) => { el.style.cursor = ''; });
      drag = null;
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('#m-first').innerHTML = icon('first', 17);
    $('#m-prev').innerHTML = icon('prev', 17);
    $('#m-next').innerHTML = icon('next', 17);
    $('#m-last').innerHTML = icon('last', 17);
    $('#g-new').innerHTML = `${icon('shuffle', 15)}Nuevo grafo`;
    setPlayIcon();

    segmented($('#algo-tabs'), (v) => {
      S.algo = v;
      compute();
    });
    $('#g-n').addEventListener('input', (e) => {
      S.n = +e.target.value;
      $('#g-n-val').textContent = S.n;
      newGraph(S.seed);
    });
    $('#g-start').addEventListener('change', (e) => {
      S.start = +e.target.value;
      compute();
    });
    $('#g-new').addEventListener('click', () => newGraph(1 + Math.floor(Math.random() * 100000)));
    $('#m-play').addEventListener('click', () => (S.playing ? stop() : play()));
    $('#m-first').addEventListener('click', () => { stop(); setK(0); });
    $('#m-prev').addEventListener('click', () => { stop(); setK(S.k - 1); });
    $('#m-next').addEventListener('click', () => { stop(); setK(S.k + 1); });
    $('#m-last').addEventListener('click', () => { stop(); setK(S.run.steps.length); });
    $('#m-scrub').addEventListener('input', (e) => { stop(); setK(+e.target.value); });
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, select, button')) return;
      if (e.key === 'ArrowRight') { stop(); setK(S.k + 1); }
      if (e.key === 'ArrowLeft') { stop(); setK(S.k - 1); }
    });
    enableDrag();
    newGraph(90);
  });
})();
