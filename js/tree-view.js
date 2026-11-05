/* ==========================================================================
   js/tree-view.js — Dibujo del árbol de Huffman en SVG
   --------------------------------------------------------------------------
   TreeView: árbol interactivo del estudio
     · arrastrar para mover, rueda o pellizco para acercar
     · setStep(k) muestra el bosque después de k uniones voraces
     · highlight(símbolo) ilumina el camino raíz → hoja (su código)
   miniTree: versión compacta y fija para la portada
   ========================================================================== */
(function (root) {
  'use strict';
  const DX = 44; // separación horizontal entre hojas
  const DY = 68; // separación entre niveles
  const R = 16; // radio de los nodos
  let uid = 0;

  /* Coordenadas: las hojas se reparten de izquierda a derecha en el orden del
     recorrido; cada nodo interno queda centrado sobre sus dos hijos. */
  function layout(tree) {
    const pos = new Map();
    const parent = new Map();
    let leaf = 0;
    let depth = 0;
    (function walk(n, d) {
      depth = Math.max(depth, d);
      if (!n.left) {
        pos.set(n, { x: leaf++ * DX, y: d * DY });
        return;
      }
      parent.set(n.left, n);
      parent.set(n.right, n);
      walk(n.left, d + 1);
      walk(n.right, d + 1);
      pos.set(n, { x: (pos.get(n.left).x + pos.get(n.right).x) / 2, y: d * DY });
    })(tree, 0);
    return { pos, parent, width: Math.max(0, (leaf - 1) * DX), height: depth * DY, leaves: leaf, depth };
  }

  function allNodes(tree) {
    const out = [];
    const stack = [tree];
    while (stack.length) {
      const n = stack.pop();
      out.push(n);
      if (n.left) stack.push(n.right, n.left);
    }
    return out;
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const curve = (a, b) => {
    const my = (a.y + b.y) / 2;
    return `M${a.x},${a.y + R}C${a.x},${my} ${b.x},${my} ${b.x},${b.y - R}`;
  };

  class TreeView {
    constructor(stage, opts = {}) {
      this.stage = stage;
      this.onPick = opts.onPick || null;
      this.gid = 'tLeaf' + ++uid;
      this.view = { s: 1, tx: 0, ty: 0 };
      this.userMoved = false;
      const I = root.UI ? root.UI.icon : () => '';
      stage.classList.add('tree-stage');
      stage.innerHTML = `
        <svg role="img" aria-label="Árbol de Huffman">
          <defs><radialGradient id="${this.gid}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#9d86ff"/><stop offset="1" stop-color="#3b3ad6"/></radialGradient></defs>
          <g class="vp"><g class="edges"></g><g class="nodes"></g></g>
        </svg>
        <div class="tree-tools">
          <button class="t-btn" type="button" data-z="in" aria-label="Acercar">${I('zoomIn', 17)}</button>
          <button class="t-btn" type="button" data-z="out" aria-label="Alejar">${I('zoomOut', 17)}</button>
          <button class="t-btn" type="button" data-z="fit" aria-label="Ajustar a la vista">${I('fit', 17)}</button>
        </div>
        <div class="tree-hint">Arrastra para mover. Rueda o pellizco para acercar.</div>
        <div class="tree-tip" hidden></div>`;
      this.svg = stage.querySelector('svg');
      this.vp = stage.querySelector('.vp');
      this.gEdges = stage.querySelector('.edges');
      this.gNodes = stage.querySelector('.nodes');
      this.tip = stage.querySelector('.tree-tip');
      this._bind();
      if ('ResizeObserver' in window) {
        new ResizeObserver(() => { if (this.tree && !this.userMoved) this.fit(); }).observe(stage);
      }
    }

    setTree(tree, mode, steps) {
      this.tree = tree;
      this.mode = mode;
      this.steps = steps || [];
      this.userMoved = false;
      this.gEdges.innerHTML = '';
      this.gNodes.innerHTML = '';
      this.nodeEls = new Map();
      this.edgeEls = new Map();
      this.leafBySym = new Map();
      if (!tree) return;
      const L = (this.L = layout(tree));
      const H = root.Huffman;
      const nodes = (this.nodes = allNodes(tree));
      let edges = '';
      let gnodes = '';
      for (const n of nodes) {
        const p = L.pos.get(n);
        if (n.left) {
          for (const [child, bit] of [[n.left, 0], [n.right, 1]]) {
            const c = L.pos.get(child);
            const lx = (p.x + c.x) / 2 + (bit ? 9 : -9);
            const ly = (p.y + c.y) / 2;
            edges += `<g data-e="${child.id}"><path class="t-edge" d="${curve(p, c)}"/><text class="t-elab" x="${lx}" y="${ly}">${bit}</text></g>`;
          }
          gnodes += `<g class="t-node" data-n="${n.id}" transform="translate(${p.x},${p.y})"><circle r="${R}"/><text>${n.freq > 99999 ? (n.freq / 1000).toFixed(0) + 'k' : n.freq}</text></g>`;
        } else {
          const info = H.symbolInfo(n.sym, mode);
          const g = info.glyph.length > 2 ? `<text class="g" style="font-size:8.5px">${esc(info.glyph)}</text>` : `<text class="g">${esc(info.glyph)}</text>`;
          gnodes += `<g class="t-node leaf" data-n="${n.id}" transform="translate(${p.x},${p.y})"><circle r="${R}" fill="url(#${this.gid})"/>${g}<text class="f" y="${R + 11}">${n.freq}</text></g>`;
          this.leafBySym.set(n.sym, n);
        }
      }
      this.gEdges.innerHTML = edges;
      this.gNodes.innerHTML = gnodes;
      const byId = new Map(nodes.map((n) => [n.id, n]));
      this.byId = byId;
      this.gNodes.querySelectorAll('[data-n]').forEach((el) => this.nodeEls.set(byId.get(+el.dataset.n), el));
      this.gEdges.querySelectorAll('[data-e]').forEach((el) => this.edgeEls.set(byId.get(+el.dataset.e), el));
      this.k = Infinity;
      this.fit();
    }

    /* Bosque después de k uniones. k = Infinity → árbol completo sin marcas */
    setStep(k) {
      if (!this.tree) return;
      this.k = k;
      const cur = Number.isFinite(k) && k > 0 ? this.steps[k - 1] : null;
      const next = Number.isFinite(k) && k < this.steps.length ? this.steps[k] : null;
      for (const [n, el] of this.nodeEls) {
        const visible = n.step <= k;
        el.classList.toggle('t-hidden', !visible);
        el.classList.toggle('t-new', !!cur && n === cur.node);
        el.classList.toggle('t-pair', !!next && (n === next.a || n === next.b));
      }
      for (const [child, el] of this.edgeEls) {
        const parent = this.L.parent.get(child);
        el.classList.toggle('t-hidden', parent.step > k);
        el.querySelector('path').classList.toggle('t-new', !!cur && parent === cur.node);
      }
    }

    highlight(sym, focus) {
      if (!this.tree) return;
      this.gNodes.querySelectorAll('.t-path').forEach((e) => e.classList.remove('t-path'));
      this.gEdges.querySelectorAll('.t-path').forEach((e) => e.classList.remove('t-path'));
      if (sym == null) return;
      let n = this.leafBySym.get(sym);
      if (!n) return;
      const leaf = n;
      while (n) {
        this.nodeEls.get(n)?.classList.add('t-path');
        const e = this.edgeEls.get(n);
        if (e) e.querySelectorAll('path, text').forEach((x) => x.classList.add('t-path'));
        n = this.L.parent.get(n);
      }
      if (focus) this.focus(leaf);
    }

    focus(node) {
      const p = this.L.pos.get(node);
      const W = this.stage.clientWidth;
      const H = this.stage.clientHeight;
      const s = Math.max(this.view.s, 0.9);
      this.view = { s, tx: W / 2 - p.x * s, ty: H / 2 - p.y * s };
      this.userMoved = true;
      this._apply(true);
    }

    fit() {
      if (!this.L) return;
      const W = this.stage.clientWidth;
      const H = this.stage.clientHeight;
      if (!W || !H) return;
      const bw = this.L.width + 2 * R + 24;
      const bh = this.L.height + 2 * R + 34;
      const s = Math.max(0.12, Math.min((W - 32) / bw, (H - 56) / bh, 1.35));
      this.view = { s, tx: (W - this.L.width * s) / 2, ty: Math.max(28, (H - (this.L.height + 14) * s) / 2) };
      this._apply(true);
    }

    zoom(f, cx, cy) {
      const W = this.stage.clientWidth;
      const H = this.stage.clientHeight;
      cx = cx == null ? W / 2 : cx;
      cy = cy == null ? H / 2 : cy;
      const s = Math.min(4, Math.max(0.08, this.view.s * f));
      const k = s / this.view.s;
      this.view = { s, tx: cx - (cx - this.view.tx) * k, ty: cy - (cy - this.view.ty) * k };
      this.userMoved = true;
      this._apply();
    }

    _apply(animate) {
      this.vp.style.transition = animate ? 'transform .5s cubic-bezier(.2,.8,.2,1)' : 'none';
      this.vp.setAttribute('transform', `translate(${this.view.tx},${this.view.ty}) scale(${this.view.s})`);
      this.vp.style.transform = `translate(${this.view.tx}px,${this.view.ty}px) scale(${this.view.s})`;
    }

    _bind() {
      const st = this.stage;
      const pts = new Map();
      let moved = false;
      let pinch = null;
      st.addEventListener('click', (e) => {
        const b = e.target.closest('[data-z]');
        if (!b) return;
        if (b.dataset.z === 'in') this.zoom(1.3);
        else if (b.dataset.z === 'out') this.zoom(1 / 1.3);
        else {
          this.userMoved = false;
          this.fit();
        }
      });
      st.addEventListener('wheel', (e) => {
        if (!this.tree) return;
        e.preventDefault();
        const r = st.getBoundingClientRect();
        this.zoom(Math.exp(-e.deltaY * 0.0016), e.clientX - r.left, e.clientY - r.top);
      }, { passive: false });
      st.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.tree-tools')) return;
        st.setPointerCapture(e.pointerId);
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        moved = false;
        if (pts.size === 2) {
          const [a, b] = [...pts.values()];
          pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: this.view.s };
        }
      });
      st.addEventListener('pointermove', (e) => {
        if (pts.has(e.pointerId)) {
          const prev = pts.get(e.pointerId);
          const cur = { x: e.clientX, y: e.clientY };
          pts.set(e.pointerId, cur);
          if (pts.size === 2 && pinch) {
            const [a, b] = [...pts.values()];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            const r = st.getBoundingClientRect();
            this.zoom((pinch.s * (d / pinch.d)) / this.view.s, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
          } else {
            const dx = cur.x - prev.x;
            const dy = cur.y - prev.y;
            if (Math.abs(dx) + Math.abs(dy) > 1) moved = true;
            this.view.tx += dx;
            this.view.ty += dy;
            this.userMoved = true;
            st.classList.add('is-dragging');
            this._apply();
          }
          this.tip.hidden = true;
          return;
        }
        this._hover(e);
      });
      const end = (e) => {
        if (!pts.has(e.pointerId)) return;
        pts.delete(e.pointerId);
        if (pts.size < 2) pinch = null;
        st.classList.remove('is-dragging');
        if (!moved && e.type === 'pointerup') {
          const g = e.target.closest && e.target.closest('.t-node.leaf');
          if (g && this.onPick) this.onPick(this.byId.get(+g.dataset.n).sym);
        }
      };
      st.addEventListener('pointerup', end);
      st.addEventListener('pointercancel', end);
      st.addEventListener('pointerleave', () => { this.tip.hidden = true; });
    }

    _hover(e) {
      const g = e.target.closest && e.target.closest('.t-node');
      if (!g || g.classList.contains('t-hidden')) {
        this.tip.hidden = true;
        return;
      }
      const n = this.byId.get(+g.dataset.n);
      const H = root.Huffman;
      let html;
      if (n.left) {
        html = `<b>Nodo interno</b><br>frecuencia ${n.freq}<br>creado en la unión ${n.step}`;
      } else {
        const info = H.symbolInfo(n.sym, this.mode);
        const code = this.codes ? this.codes.get(n.sym) : '';
        html = `<b>${esc(info.glyph)}</b>${info.name ? ` <span class="muted">${esc(info.name)}</span>` : ''}<br>aparece ${n.freq} veces${code ? `<br>código <span class="code">${code}</span>` : ''}`;
      }
      const r = this.stage.getBoundingClientRect();
      this.tip.innerHTML = html;
      this.tip.hidden = false;
      const x = Math.min(e.clientX - r.left + 14, r.width - 190);
      const y = Math.min(e.clientY - r.top + 14, r.height - 80);
      this.tip.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  /* ------------------------------------------------------------------------
     miniTree: árbol compacto dentro de un rectángulo w × h (portada)
     Devuelve una función setStep(k) para animar la construcción.
     ------------------------------------------------------------------------ */
  function miniTree(svg, tree, mode, opts = {}) {
    const w = opts.w || 260;
    const h = opts.h || 170;
    const r = opts.r || 11;
    const gid = 'mLeaf' + ++uid;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    if (!tree) {
      svg.innerHTML = '';
      return () => {};
    }
    const L = layout(tree);
    const pad = r + 4;
    const sx = L.width ? (w - 2 * pad) / L.width : 0;
    const sy = L.height ? Math.min((h - 2 * pad - 10) / L.height, 46) : 0;
    const offX = L.width ? pad : w / 2;
    const offY = pad + (L.height ? (h - 2 * pad - 10 - L.height * sy) / 2 : (h - 2 * pad) / 2);
    const P = (n) => {
      const p = L.pos.get(n);
      return { x: offX + p.x * sx, y: offY + p.y * sy };
    };
    const nodes = allNodes(tree);
    const H = root.Huffman;
    let edges = '';
    let circles = '';
    for (const n of nodes) {
      const p = P(n);
      if (n.left) {
        for (const [c, bit] of [[n.left, 0], [n.right, 1]]) {
          const q = P(c);
          edges += `<g data-s="${n.step}"><line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>${opts.labels ? `<text class="edge-l" x="${(p.x + q.x) / 2 + (bit ? 7 : -7)}" y="${(p.y + q.y) / 2}">${bit}</text>` : ''}</g>`;
        }
        circles += `<g data-s="${n.step}"><circle cx="${p.x}" cy="${p.y}" r="${r * 0.82}"/>${opts.freqs ? `<text x="${p.x}" y="${p.y}" style="font-size:${r * 0.8}px">${n.freq}</text>` : ''}</g>`;
      } else {
        const glyph = H.symbolInfo(n.sym, mode).glyph;
        circles += `<g class="leaf" data-s="0"><circle cx="${p.x}" cy="${p.y}" r="${r}" fill="url(#${gid})"/><text x="${p.x}" y="${p.y}" ${glyph.length > 2 ? 'style="font-size:7px"' : ''}>${esc(glyph)}</text></g>`;
      }
    }
    svg.innerHTML = `<defs><radialGradient id="${gid}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#9d86ff"/><stop offset="1" stop-color="#3b3ad6"/></radialGradient></defs><g>${edges}</g><g>${circles}</g>`;
    const groups = Array.from(svg.querySelectorAll('[data-s]'));
    return (k) => groups.forEach((g) => { g.style.opacity = +g.dataset.s <= k ? 1 : 0; });
  }

  root.TreeView = TreeView;
  root.miniTree = miniTree;
  root.treeLayout = layout;
})(window);
