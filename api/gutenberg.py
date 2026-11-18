"""
api/gutenberg.py — Proxy de Project Gutenberg

Por qué existe: gutenberg.org no permite que otra página web descargue sus
libros directamente desde el navegador (no envía cabeceras CORS). Este
pequeño servidor hace la petición y le devuelve el resultado a la página.

Se usa de dos formas, con el mismo código:
  1. En Vercel (gratis): cualquier archivo en api/ se publica como función.
     URL: https://tu-proyecto.vercel.app/api/gutenberg?accion=buscar&q=quijote
  2. En tu computadora: python/servidor.py lo importa y lo sirve en local.

Rutas
  ?accion=buscar&q=<texto>&idioma=<es|en|...>  → JSON con resultados
  ?accion=texto&id=<número>                    → el .txt del libro

Sólo descarga de gutenberg.org y sólo por número de libro: no es un proxy
abierto que alguien pueda usar para pedir cualquier URL.
"""
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from http.server import BaseHTTPRequestHandler

GUTENDEX = "https://gutendex.com/books/"
AGENTE = "Huffly/1.0 (proyecto academico de compresion Huffman)"
TIEMPO = 15                # segundos por petición
MAX_BYTES = 4_400_000      # Vercel limita las respuestas a 4.5 MB


class LibroGrande(Exception):
    pass


def _pedir(url, limite=None):
    req = urllib.request.Request(url, headers={"User-Agent": AGENTE, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=TIEMPO) as r:
        return r.read(limite + 1) if limite else r.read()


def autor_legible(nombre):
    """'Cervantes Saavedra, Miguel de' → 'Miguel de Cervantes Saavedra'"""
    m = re.match(r"^([^,]+),\s*([^,(]+)", nombre or "")
    return f"{m.group(2).strip()} {m.group(1).strip()}" if m else nombre


def _normalizar(libro):
    formatos = libro.get("formats") or {}
    clave = next((k for k in formatos if k.startswith("text/plain")), None)
    return {
        "id": libro.get("id"),
        "titulo": libro.get("title", ""),
        "autores": [autor_legible(a.get("name", "")) for a in libro.get("authors") or []],
        "idiomas": libro.get("languages") or [],
        "descargas": libro.get("download_count") or 0,
        "txt": formatos.get(clave) if clave else None,
    }


def buscar(q, idioma=""):
    q = (q or "").strip()[:120]
    if not q:
        raise ValueError("Escribe un título, autor o palabra clave.")
    params = {"search": q, "mime_type": "text/plain"}
    if idioma and re.fullmatch(r"[a-z]{2}", idioma):
        params["languages"] = idioma
    try:
        datos = json.loads(_pedir(GUTENDEX + "?" + urllib.parse.urlencode(params)))
        res = [_normalizar(b) for b in datos.get("results", [])]
        return {"fuente": "gutendex", "resultados": [r for r in res if r["txt"]]}
    except Exception:
        # Respaldo: el catálogo OPDS oficial de gutenberg.org
        return {"fuente": "opds", "resultados": _buscar_opds(q)}


def _buscar_opds(q):
    url = "https://www.gutenberg.org/ebooks/search.opds/?" + urllib.parse.urlencode({"query": q})
    raiz = ET.fromstring(_pedir(url))
    ns = {"a": "http://www.w3.org/2005/Atom"}
    salida = []
    for e in raiz.findall("a:entry", ns):
        ident = None
        for enlace in [e.findtext("a:id", default="", namespaces=ns)] + [l.get("href", "") for l in e.findall("a:link", ns)]:
            m = re.search(r"/ebooks/(\d+)", enlace or "")
            if m:
                ident = int(m.group(1))
                break
        if ident is None:
            continue
        autor = (e.findtext("a:content", default="", namespaces=ns) or "").strip()
        salida.append({
            "id": ident,
            "titulo": (e.findtext("a:title", default="", namespaces=ns) or "").strip(),
            "autores": [autor] if autor else [],
            "idiomas": [],
            "descargas": 0,
            "txt": f"https://www.gutenberg.org/cache/epub/{ident}/pg{ident}.txt",
        })
    return salida


def texto(id_libro):
    """Devuelve (bytes, url) del .txt del libro."""
    try:
        i = int(id_libro)
    except (TypeError, ValueError):
        raise ValueError("El identificador del libro debe ser un número.")
    if not 0 < i < 10_000_000:
        raise ValueError("Identificador de libro fuera de rango.")
    urls = [
        f"https://www.gutenberg.org/cache/epub/{i}/pg{i}.txt",
        f"https://www.gutenberg.org/ebooks/{i}.txt.utf-8",
        f"https://www.gutenberg.org/files/{i}/{i}-0.txt",
        f"https://www.gutenberg.org/files/{i}/{i}.txt",
    ]
    for url in urls:
        try:
            datos = _pedir(url, MAX_BYTES)
        except Exception:
            continue
        if len(datos) > MAX_BYTES:
            raise LibroGrande(f"https://www.gutenberg.org/ebooks/{i}")
        inicio = datos[:300].lstrip().lower()
        if inicio.startswith(b"<!doctype") or inicio.startswith(b"<html"):
            continue
        return datos, url
    raise LookupError(f"El libro #{i} no tiene una versión en texto plano disponible.")


def responder(h, ruta):
    """Atiende /api/gutenberg con cualquier BaseHTTPRequestHandler `h`."""
    def enviar(codigo, cuerpo, tipo, extra=None):
        h.send_response(codigo)
        h.send_header("Content-Type", tipo)
        h.send_header("Access-Control-Allow-Origin", "*")
        h.send_header("Cache-Control", "public, max-age=3600, s-maxage=86400" if codigo == 200 else "no-store")
        for k, v in (extra or {}).items():
            h.send_header(k, v)
        h.send_header("Content-Length", str(len(cuerpo)))
        h.end_headers()
        h.wfile.write(cuerpo)

    def json_(codigo, obj):
        enviar(codigo, json.dumps(obj, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")

    qs = urllib.parse.parse_qs(urllib.parse.urlparse(ruta).query)
    accion = qs.get("accion", [""])[0]
    try:
        if accion == "buscar":
            json_(200, buscar(qs.get("q", [""])[0], qs.get("idioma", [""])[0]))
        elif accion == "texto":
            datos, url = texto(qs.get("id", [""])[0])
            enviar(200, datos, "text/plain; charset=utf-8", {"X-Gutenberg-Url": url})
        else:
            json_(400, {"error": "Usa ?accion=buscar&q=… o ?accion=texto&id=…"})
    except LibroGrande as e:
        json_(413, {"error": "El libro pasa del límite de 4.4 MB del servidor. Descárgalo a mano y súbelo.", "manual": str(e)})
    except ValueError as e:
        json_(400, {"error": str(e)})
    except LookupError as e:
        json_(404, {"error": str(e)})
    except Exception as e:  # red caída, Gutenberg no responde, etc.
        json_(502, {"error": f"No se pudo contactar a Project Gutenberg: {e}"})


class handler(BaseHTTPRequestHandler):
    """Punto de entrada que Vercel ejecuta para /api/gutenberg."""

    def do_GET(self):
        responder(self, self.path)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.end_headers()
