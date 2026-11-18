/* ==========================================================================
   js/mst.js — Árbol de expansión mínima (Kruskal y Prim), técnica voraz
   --------------------------------------------------------------------------
   Ambos algoritmos devuelven una lista de PASOS para poder animarlos.
   Grafo: { nodes:[{x,y}], edges:[{id,a,b,w}] }  (no dirigido, conexo)
   ========================================================================== */
(function (root) {
  'use strict';

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Unión-Búsqueda (Union-Find) con compresión de caminos y unión por rango */
  class DSU {
    constructor(n) { this.p = Array.from({ length: n }, (_, i) => i); this.r = new Array(n).fill(0); }
    find(x) { while (this.p[x] !== x) { this.p[x] = this.p[this.p[x]]; x = this.p[x]; } return x; }
    union(a, b) {
      a = this.find(a); b = this.find(b);
      if (a === b) return false;
      if (this.r[a] < this.r[b]) [a, b] = [b, a];
      this.p[b] = a;
      if (this.r[a] === this.r[b]) this.r[a]++;
      return true;
    }
  }

  /* Grafo aleatorio reproducible y siempre conexo */
  function makeGraph(n, seed, width, height) {
    const rnd = mulberry32(seed);
    const pad = 36, nodes = [];
    let guard = 0;
    while (nodes.length < n && guard++ < 5000) {
      const p = { x: pad + rnd() * (width - 2 * pad), y: pad + rnd() * (height - 2 * pad) };
      const minD = Math.min(width, height) / (Math.sqrt(n) * 1.9);
      if (nodes.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > minD)) nodes.push(p);
    }
    const dist = (i, j) => Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
    const key = (i, j) => (i < j ? i + '-' + j : j + '-' + i);
    const seen = new Set(), pairs = [];
    const add = (i, j) => {
      const k = key(i, j);
      if (i === j || seen.has(k)) return;
      seen.add(k);
      pairs.push([Math.min(i, j), Math.max(i, j)]);
    };
    for (let i = 0; i < nodes.length; i++) {
      const near = nodes.map((_, j) => j).filter((j) => j !== i).sort((a, b) => dist(i, a) - dist(i, b));
      near.slice(0, 3).forEach((j) => add(i, j));
    }
    // Garantizar conexidad: unir componentes con la arista más corta entre ellas
    const dsu = new DSU(nodes.length);
    pairs.forEach(([a, b]) => dsu.union(a, b));
    for (;;) {
      let best = null;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (dsu.find(i) !== dsu.find(j) && (!best || dist(i, j) < best.d)) best = { i, j, d: dist(i, j) };
        }
      }
      if (!best) break;
      add(best.i, best.j); dsu.union(best.i, best.j);
    }
    const edges = pairs.map(([a, b], id) => ({ id, a, b, w: Math.max(1, Math.round(dist(a, b) / 8)) }));
    return { nodes, edges };
  }

  /* Kruskal: ordenar aristas por peso y aceptar la menor que NO forme ciclo */
  function kruskal(graph) {
    const sorted = [...graph.edges].sort((x, y) => x.w - y.w || x.id - y.id);
    const dsu = new DSU(graph.nodes.length);
    const steps = [];
    let total = 0, taken = 0;
    for (const e of sorted) {
      const ok = dsu.union(e.a, e.b);
      if (ok) { total += e.w; taken++; }
      steps.push({ edge: e.id, accepted: ok, total });
      if (taken === graph.nodes.length - 1) break;
    }
    return { sorted, steps, total, mstEdges: steps.filter((s) => s.accepted).map((s) => s.edge) };
  }

  /* Prim: crecer un único árbol desde `start`, tomando siempre la arista más
     barata que conecta el árbol con un vértice nuevo */
  function prim(graph, start = 0) {
    const n = graph.nodes.length;
    const inTree = new Array(n).fill(false);
    const steps = [];
    inTree[start] = true;
    let total = 0, count = 1;
    while (count < n) {
      let best = null;
      for (const e of graph.edges) {
        if (inTree[e.a] === inTree[e.b]) continue;
        if (!best || e.w < best.w || (e.w === best.w && e.id < best.id)) best = e;
      }
      if (!best) break; // grafo no conexo (no debería pasar)
      const nuevo = inTree[best.a] ? best.b : best.a;
      inTree[nuevo] = true; total += best.w; count++;
      steps.push({ edge: best.id, node: nuevo, accepted: true, total });
    }
    return { steps, total, start, mstEdges: steps.map((s) => s.edge) };
  }

  const api = { makeGraph, kruskal, prim, DSU };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MST = api;
})(typeof window !== 'undefined' ? window : globalThis);
