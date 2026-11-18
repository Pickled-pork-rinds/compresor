"""
servidor.py — Servidor local de Huffly (sin dependencias, sólo Python)

Sirve la página web y el proxy de Project Gutenberg en tu computadora, igual
que como funcionará en Vercel. Con Live Server la búsqueda de Gutenberg
también funciona, pero la descarga del libro necesita este proxy.

Uso, desde la carpeta del proyecto:
    python python/servidor.py            → abre http://localhost:8000
    python python/servidor.py 8080       → usa otro puerto
    python python/servidor.py --no-abrir → no abre el navegador
"""
import importlib.util
import os
import sys
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# El proxy vive en api/gutenberg.py (el mismo archivo que usa Vercel)
_spec = importlib.util.spec_from_file_location("api_gutenberg", os.path.join(RAIZ, "api", "gutenberg.py"))
api = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(api)


class Manejador(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".hfz": "application/octet-stream",
    }

    def do_GET(self):
        if self.path.startswith("/api/gutenberg"):
            api.responder(self, self.path)
        else:
            super().do_GET()

    def end_headers(self):
        # Sin caché local: cada cambio que guardes se ve al recargar
        if not self.path.startswith("/api/"):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, formato, *args):
        sys.stderr.write("  %s\n" % (formato % args))


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    puerto = int(args[0]) if args else 8000
    servidor = ThreadingHTTPServer(("127.0.0.1", puerto), partial(Manejador, directory=RAIZ))
    url = f"http://localhost:{puerto}/"
    print(f"\n  Huffly está corriendo en {url}")
    print("  Proxy de Gutenberg en /api/gutenberg")
    print("  Detén el servidor con Ctrl + C\n")
    if "--no-abrir" not in sys.argv:
        webbrowser.open(url)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\n  Servidor detenido.")


if __name__ == "__main__":
    main()
