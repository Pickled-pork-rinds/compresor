"""
huffman.py — Núcleo del algoritmo de Huffman (técnica voraz) en Python. 
   
· Implementado a mano: NO usa zip, gzip, zlib ni otra librería de compresión.
  (binascii.crc32 sólo calcula una suma de verificación; no comprime nada.)
· Genera archivos .hfz idénticos byte a byte a los de la versión web
  (js/huffman.js): un archivo creado en el navegador se abre aquí y viceversa.
· El formato está documentado en docs/formato-hfz.md

Flujo:  bytes → símbolos → frecuencias → árbol (voraz) → códigos → bits
        → archivo .hfz → lectura → descompresión → verificación CRC-32

Regla de desempate (para reconstruir EXACTAMENTE el mismo árbol): se saca
primero el nodo de menor frecuencia y, si empatan, el que se creó antes.
"""
from __future__ import annotations

import heapq
import math
import struct
import time
from binascii import crc32 as _crc32

MAGIC = b"HFZ"
VERSION = 1
FLAG_CHAR = 0x01
CABECERA_FIJA = 28
CODIFICADORES = {1: "Huffly Web (JavaScript)", 2: "Huffly Desktop (Python)"}


def crc32(datos: bytes) -> int:
    return _crc32(datos) & 0xFFFFFFFF


class Nodo:
    """Nodo del árbol. Las hojas tienen `simbolo`; los internos, dos hijos."""

    __slots__ = ("id", "freq", "simbolo", "izq", "der", "paso", "unido_en")

    def __init__(self, id_, freq, simbolo=None, izq=None, der=None, paso=0):
        self.id = id_
        self.freq = freq
        self.simbolo = simbolo
        self.izq = izq
        self.der = der
        self.paso = paso          # en qué unión se creó (0 = hoja)
        self.unido_en = 0         # en qué unión pasó a tener padre

    @property
    def es_hoja(self) -> bool:
        return self.izq is None


# --------------------------------------------------------------------------
# 0) De bytes a símbolos
# --------------------------------------------------------------------------
def a_simbolos(datos: bytes, modo: str = "auto"):
    """Devuelve (modo, secuencia). 'char' = caracteres Unicode, 'byte' = bytes."""
    if modo == "char" or (modo == "auto" and not datos.isascii()):
        try:
            texto = datos.decode("utf-8")      # estricto; conserva el BOM
            return "char", [ord(c) for c in texto]
        except UnicodeDecodeError:
            if modo == "char":
                raise ValueError("El archivo no es UTF-8 válido. Usa el modo «byte».")
    return "byte", datos


# --------------------------------------------------------------------------
# 1) Frecuencias
# --------------------------------------------------------------------------
def frecuencias(secuencia) -> list:
    """Lista de (simbolo, frecuencia) ordenada por símbolo."""
    conteo = {}
    for s in secuencia:
        conteo[s] = conteo.get(s, 0) + 1
    return sorted(conteo.items())


# --------------------------------------------------------------------------
# 2) Árbol de Huffman — la decisión voraz: unir siempre los dos menores
# --------------------------------------------------------------------------
def construir_arbol(entradas):
    """Devuelve (raiz, pasos, hojas). Cada paso es (izq, der, nuevo)."""
    heap, hojas, id_ = [], [], 0
    for simbolo, freq in entradas:
        hoja = Nodo(id_, freq, simbolo=simbolo)
        hojas.append(hoja)
        heap.append((freq, id_, hoja))
        id_ += 1
    heapq.heapify(heap)
    pasos = []
    while len(heap) > 1:
        _, _, a = heapq.heappop(heap)      # el menor → rama 0
        _, _, b = heapq.heappop(heap)      # el segundo menor → rama 1
        nuevo = Nodo(id_, a.freq + b.freq, izq=a, der=b, paso=len(pasos) + 1)
        a.unido_en = b.unido_en = nuevo.paso
        pasos.append((a, b, nuevo))
        heapq.heappush(heap, (nuevo.freq, id_, nuevo))
        id_ += 1
    raiz = heap[0][2] if heap else None
    return raiz, pasos, hojas


# --------------------------------------------------------------------------
# 3) Códigos binarios (izquierda = '0', derecha = '1')
# --------------------------------------------------------------------------
def construir_codigos(raiz) -> dict:
    codigos = {}
    if raiz is None:
        return codigos
    if raiz.es_hoja:                       # un solo símbolo distinto → '0'
        codigos[raiz.simbolo] = "0"
        return codigos
    pila = [(raiz, "")]
    while pila:
        nodo, cod = pila.pop()
        if nodo.es_hoja:
            codigos[nodo.simbolo] = cod
        else:
            pila.append((nodo.der, cod + "1"))
            pila.append((nodo.izq, cod + "0"))
    return codigos


def entropia(entradas, total) -> float:
    if not total:
        return 0.0
    return -sum((f / total) * math.log2(f / total) for _, f in entradas)


def analizar(datos: bytes, modo: str = "auto") -> dict:
    """Todo el análisis, sin generar el archivo (lo usa la interfaz)."""
    modo, secuencia = a_simbolos(datos, modo)
    entradas = frecuencias(secuencia)
    raiz, pasos, hojas = construir_arbol(entradas)
    codigos = construir_codigos(raiz)
    bits = sum(f * len(codigos[s]) for s, f in entradas)
    return {
        "modo": modo, "secuencia": secuencia, "entradas": entradas, "total": len(secuencia),
        "raiz": raiz, "pasos": pasos, "hojas": hojas, "codigos": codigos, "bits": bits,
        "entropia": entropia(entradas, len(secuencia)), "tam_original": len(datos),
    }


# --------------------------------------------------------------------------
# 4) Codificación y empaquetado de bits (primer bit = bit más significativo)
# --------------------------------------------------------------------------
def empaquetar(secuencia, codigos, bits_totales) -> bytes:
    if bits_totales == 0:
        return b""
    cadena = "".join(map(codigos.__getitem__, secuencia))
    relleno = (-bits_totales) % 8
    return int(cadena + "0" * relleno, 2).to_bytes((bits_totales + relleno) // 8, "big")


def _nombre_utf8(nombre: str) -> bytes:
    b = (nombre or "").encode("utf-8")
    while len(b) > 255:
        nombre = nombre[:-1]
        b = nombre.encode("utf-8")
    return b


def _bytes_para(maximo: int) -> int:
    if maximo <= 0xFF:
        return 1
    if maximo <= 0xFFFF:
        return 2
    if maximo <= 0xFFFFFF:
        return 3
    return 4


# --------------------------------------------------------------------------
# 5) Archivo .hfz
# --------------------------------------------------------------------------
def comprimir(datos: bytes, nombre: str = "", modo: str = "auto",
              codificador: int = 2, fecha: int | None = None, analisis: dict | None = None):
    """Devuelve (archivo_hfz, analisis)."""
    a = analisis or analizar(datos, modo)
    if a["bits"] > 0xFFFFFFFF:
        raise ValueError("El archivo es demasiado grande para el formato .hfz v1.")
    if len(a["entradas"]) > 0xFFFF:
        raise ValueError("Hay demasiados símbolos distintos para el formato .hfz v1.")
    fecha = int(time.time()) if fecha is None else fecha
    nombre_b = _nombre_utf8(nombre)
    ancho_sim = 3 if a["modo"] == "char" else 1
    ancho_freq = _bytes_para(max((f for _, f in a["entradas"]), default=0))
    cuerpo = empaquetar(a["secuencia"], a["codigos"], a["bits"])

    cab = bytearray(MAGIC)
    cab += struct.pack(">BBBIIIIBB", VERSION, FLAG_CHAR if a["modo"] == "char" else 0, codificador,
                       fecha, len(datos), crc32(datos), a["bits"], (-a["bits"]) % 8, len(nombre_b))
    cab += nombre_b
    cab += struct.pack(">HBB", len(a["entradas"]), ancho_sim, ancho_freq)
    for s, f in a["entradas"]:
        cab += s.to_bytes(ancho_sim, "big") + f.to_bytes(ancho_freq, "big")
    a["tam_cabecera"] = len(cab)
    a["tam_datos"] = len(cuerpo)
    return bytes(cab) + cuerpo, a


# --------------------------------------------------------------------------
# 6) Lectura: leer y validar el encabezado
# --------------------------------------------------------------------------
def leer_cabecera(archivo: bytes) -> dict:
    if len(archivo) < CABECERA_FIJA:
        raise ValueError(f"El archivo mide {len(archivo)} B; un .hfz mide al menos {CABECERA_FIJA} B.")
    if archivo[:3] != MAGIC:
        raise ValueError("No es un archivo .hfz: los primeros 3 bytes deberían ser «HFZ».")
    version, flags, codificador, fecha, tam, crc, bits, relleno, n_nombre = struct.unpack_from(">BBBIIIIBB", archivo, 3)
    if version != VERSION:
        raise ValueError(f"El archivo usa la versión {version}; este programa lee la versión {VERSION}.")
    if flags & ~FLAG_CHAR:
        raise ValueError("El encabezado tiene banderas desconocidas.")
    modo = "char" if flags & FLAG_CHAR else "byte"
    p = 24
    if p + n_nombre + 4 > len(archivo):
        raise ValueError("El encabezado está incompleto: falta el nombre o la tabla.")
    nombre = archivo[p:p + n_nombre].decode("utf-8", errors="replace")
    p += n_nombre
    n_sim, ancho_sim, ancho_freq = struct.unpack_from(">HBB", archivo, p)
    p += 4
    if ancho_sim != (3 if modo == "char" else 1):
        raise ValueError("El ancho de símbolo no coincide con el modo del archivo.")
    if not 1 <= ancho_freq <= 4:
        raise ValueError("El ancho de frecuencia debe estar entre 1 y 4 bytes.")
    if modo == "byte" and n_sim > 256:
        raise ValueError("En modo byte no puede haber más de 256 símbolos.")
    offset_tabla = p
    largo_tabla = n_sim * (ancho_sim + ancho_freq)
    if p + largo_tabla > len(archivo):
        raise ValueError("La tabla de frecuencias está incompleta.")
    entradas, total, previo = [], 0, -1
    for _ in range(n_sim):
        s = int.from_bytes(archivo[p:p + ancho_sim], "big")
        p += ancho_sim
        f = int.from_bytes(archivo[p:p + ancho_freq], "big")
        p += ancho_freq
        if s <= previo:
            raise ValueError("La tabla de símbolos no está en orden ascendente.")
        if f == 0:
            raise ValueError("La tabla contiene un símbolo con frecuencia 0.")
        if modo == "char" and (s > 0x10FFFF or 0xD800 <= s <= 0xDFFF):
            raise ValueError("La tabla contiene un carácter Unicode inválido.")
        previo = s
        total += f
        entradas.append((s, f))
    offset_datos = p
    largo_datos = len(archivo) - p
    if largo_datos != (bits + 7) // 8:
        raise ValueError(f"El bloque de datos mide {largo_datos} B, pero el encabezado declara {bits} bits.")
    if relleno != (-bits) % 8:
        raise ValueError("Los bits de relleno no coinciden con el total de bits.")
    if modo == "byte" and total != tam:
        raise ValueError("La suma de frecuencias no coincide con el tamaño original.")

    raiz, pasos, hojas = construir_arbol(entradas)     # mismo algoritmo voraz
    codigos = construir_codigos(raiz)
    if sum(f * len(codigos[s]) for s, f in entradas) != bits:
        raise ValueError("Los bits declarados no coinciden con el árbol reconstruido.")

    segmentos = [
        ("Firma", 0, 3, '"HFZ"'),
        ("Versión", 3, 1, str(version)),
        ("Modo", 4, 1, "carácter (bit 0 = 1)" if modo == "char" else "byte (bit 0 = 0)"),
        ("Codificador", 5, 1, CODIFICADORES.get(codificador, f"id {codificador}")),
        ("Fecha", 6, 4, time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(fecha))),
        ("Tamaño original", 10, 4, f"{tam} B"),
        ("CRC-32", 14, 4, f"0x{crc:08X}"),
        ("Bits válidos", 18, 4, str(bits)),
        ("Relleno", 22, 1, f"{relleno} bits"),
        ("Largo del nombre", 23, 1, f"{n_nombre} B"),
        ("Nombre", 24, n_nombre, nombre or "(vacío)"),
        ("Símbolos distintos", 24 + n_nombre, 2, str(n_sim)),
        ("Anchos", 26 + n_nombre, 2, f"símbolo {ancho_sim} B · frecuencia {ancho_freq} B"),
        ("Tabla de frecuencias", offset_tabla, largo_tabla, f"{n_sim} × {ancho_sim + ancho_freq} B"),
        ("Datos comprimidos", offset_datos, largo_datos, f"{largo_datos} B"),
    ]
    return {
        "version": version, "modo": modo, "codificador": codificador,
        "codificador_nombre": CODIFICADORES.get(codificador, f"Desconocido ({codificador})"),
        "fecha": fecha, "tam_original": tam, "crc": crc, "bits": bits, "relleno": relleno,
        "nombre": nombre, "simbolos": n_sim, "ancho_sim": ancho_sim, "ancho_freq": ancho_freq,
        "entradas": entradas, "total_simbolos": total, "offset_tabla": offset_tabla,
        "largo_tabla": largo_tabla, "offset_datos": offset_datos, "largo_datos": largo_datos,
        "tam_archivo": len(archivo), "raiz": raiz, "pasos": pasos, "hojas": hojas,
        "codigos": codigos, "segmentos": segmentos, "entropia": entropia(entradas, total),
    }


# --------------------------------------------------------------------------
# 7) Descompresión
# --------------------------------------------------------------------------
def _tabla_por_bytes(raiz):
    """Para cada nodo interno y cada byte posible precalcula qué símbolos
    salen al recorrer esos 8 bits y en qué nodo termina. Así se decodifica un
    byte completo por paso en lugar de un bit (mucho más rápido en Python)."""
    internos, indice, pila = [], {}, [raiz]
    while pila:
        n = pila.pop()
        if not n.es_hoja:
            indice[id(n)] = len(internos)
            internos.append(n)
            pila.append(n.der)
            pila.append(n.izq)
    tabla = []
    for inicio in internos:
        for byte in range(256):
            nodo, salida = inicio, []
            for k in range(7, -1, -1):
                nodo = nodo.der if (byte >> k) & 1 else nodo.izq
                if nodo.es_hoja:
                    salida.append(nodo.simbolo)
                    nodo = raiz
            tabla.append((salida, indice[id(nodo)]))
    return tabla


def descomprimir(archivo: bytes):
    """Devuelve (datos, cabecera, crc_ok)."""
    cab = leer_cabecera(archivo)
    raiz, n = cab["raiz"], cab["total_simbolos"]
    salida = []
    if raiz is not None:
        if raiz.es_hoja:
            salida = [raiz.simbolo] * n
        else:
            cuerpo = archivo[cab["offset_datos"]:]
            if len(cab["entradas"]) <= 2048:
                tabla, estado = _tabla_por_bytes(raiz), 0
                for byte in cuerpo:
                    simbolos, estado = tabla[estado * 256 + byte]
                    salida.extend(simbolos)
            else:                                   # alfabetos enormes: bit a bit
                nodo = raiz
                for byte in cuerpo:
                    for k in range(7, -1, -1):
                        nodo = nodo.der if (byte >> k) & 1 else nodo.izq
                        if nodo.es_hoja:
                            salida.append(nodo.simbolo)
                            nodo = raiz
            if len(salida) < n:
                raise ValueError("Los bits terminaron a la mitad de un código: el archivo está dañado.")
            del salida[n:]                          # lo que sobra es el relleno
    if cab["modo"] == "byte":
        datos = bytes(salida)
    else:
        datos = "".join(map(chr, salida)).encode("utf-8")
    return datos, cab, crc32(datos) == cab["crc"]


# --------------------------------------------------------------------------
# Utilidades de presentación
# --------------------------------------------------------------------------
_NOMBRES = {0x20: ("␣", "espacio"), 0x0A: ("↵", "salto de línea"), 0x0D: ("␍", "retorno de carro"),
            0x09: ("⇥", "tabulador"), 0xA0: ("⍽", "espacio no separable"), 0xFEFF: ("BOM", "marca de orden de bytes")}


def describir(simbolo: int, modo: str) -> str:
    if simbolo in _NOMBRES and (modo == "char" or simbolo < 0x80):
        return _NOMBRES[simbolo][0]
    if modo == "byte" and simbolo >= 0x80:
        return f"0x{simbolo:02X}"
    if simbolo < 0x20 or simbolo == 0x7F or 0x80 <= simbolo < 0xA0:
        return f"U+{simbolo:04X}"
    return chr(simbolo)


def formato_bytes(n: int) -> str:
    if n < 1024:
        return f"{n} B"
    if n < 1024 * 1024:
        return f"{n / 1024:.2f} KB"
    return f"{n / (1024 * 1024):.2f} MB"


def vista_bits(archivo: bytes, cab: dict, max_bits: int = 256) -> str:
    n = min(cab["bits"], max_bits)
    cuerpo = archivo[cab["offset_datos"]:cab["offset_datos"] + (n + 7) // 8]
    cadena = "".join(f"{b:08b}" for b in cuerpo)[:n]
    return " ".join(cadena[i:i + 8] for i in range(0, len(cadena), 8))
      
