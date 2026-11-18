"""
mst.py — Árbol de expansión mínima (Kruskal y Prim), técnica voraz.

Ambos devuelven una lista de PASOS para poder animarlos en la interfaz.
Grafo: dict {"nodos": [(x, y), ...], "aristas": [(id, a, b, peso), ...]}
"""
import math
import random


class DSU:
    """Unión-Búsqueda con compresión de caminos y unión por rango."""

    def __init__(self, n):
        self.p = list(range(n))
        self.r = [0] * n

    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]
            x = self.p[x]
        return x

    def union(self, a, b):
        a, b = self.find(a), self.find(b)
        if a == b:
            return False
        if self.r[a] < self.r[b]:
            a, b = b, a
        self.p[b] = a
        if self.r[a] == self.r[b]:
            self.r[a] += 1
        return True


def crear_grafo(n=9, semilla=1, ancho=640, alto=400):
    """Grafo aleatorio reproducible y conexo."""
    rnd = random.Random(semilla)
    pad = 36
    nodos, intentos = [], 0
    min_d = min(ancho, alto) / (math.sqrt(n) * 1.9)
    while len(nodos) < n and intentos < 5000:
        intentos += 1
        p = (pad + rnd.random() * (ancho - 2 * pad), pad + rnd.random() * (alto - 2 * pad))
        if all(math.hypot(q[0] - p[0], q[1] - p[1]) > min_d for q in nodos):
            nodos.append(p)

    def dist(i, j):
        return math.hypot(nodos[i][0] - nodos[j][0], nodos[i][1] - nodos[j][1])

    pares = set()
    for i in range(len(nodos)):
        cercanos = sorted((j for j in range(len(nodos)) if j != i), key=lambda j: dist(i, j))
        for j in cercanos[:3]:
            pares.add((min(i, j), max(i, j)))
    pares = sorted(pares)
    dsu = DSU(len(nodos))
    for a, b in pares:
        dsu.union(a, b)
    while True:  # garantizar conexidad
        mejor = None
        for i in range(len(nodos)):
            for j in range(i + 1, len(nodos)):
                if dsu.find(i) != dsu.find(j) and (mejor is None or dist(i, j) < mejor[0]):
                    mejor = (dist(i, j), i, j)
        if mejor is None:
            break
        pares.append((mejor[1], mejor[2]))
        dsu.union(mejor[1], mejor[2])
    aristas = [(k, a, b, max(1, round(dist(a, b) / 8))) for k, (a, b) in enumerate(pares)]
    return {"nodos": nodos, "aristas": aristas}


def kruskal(grafo):
    """Ordena aristas por peso y acepta la menor que NO forme ciclo."""
    ordenadas = sorted(grafo["aristas"], key=lambda e: (e[3], e[0]))
    dsu = DSU(len(grafo["nodos"]))
    pasos, total, tomadas = [], 0, 0
    for (id_, a, b, w) in ordenadas:
        ok = dsu.union(a, b)
        if ok:
            total += w
            tomadas += 1
        pasos.append({"arista": id_, "aceptada": ok, "total": total})
        if tomadas == len(grafo["nodos"]) - 1:
            break
    return {"ordenadas": ordenadas, "pasos": pasos, "total": total,
            "aristas_mst": [p["arista"] for p in pasos if p["aceptada"]]}


def prim(grafo, inicio=0):
    """Crece un único árbol desde `inicio` con la arista más barata hacia afuera."""
    n = len(grafo["nodos"])
    en_arbol = [False] * n
    en_arbol[inicio] = True
    pasos, total, cuenta = [], 0, 1
    while cuenta < n:
        mejor = None
        for e in grafo["aristas"]:
            if en_arbol[e[1]] == en_arbol[e[2]]:
                continue
            if mejor is None or (e[3], e[0]) < (mejor[3], mejor[0]):
                mejor = e
        if mejor is None:
            break
        nuevo = mejor[2] if en_arbol[mejor[1]] else mejor[1]
        en_arbol[nuevo] = True
        total += mejor[3]
        cuenta += 1
        pasos.append({"arista": mejor[0], "nodo": nuevo, "aceptada": True, "total": total})
    return {"pasos": pasos, "total": total, "inicio": inicio,
            "aristas_mst": [p["arista"] for p in pasos]}
