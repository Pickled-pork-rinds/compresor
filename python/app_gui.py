"""
app_gui.py — Huffly Desktop: interfaz gráfica (tkinter) del compresor Huffman
y del árbol de expansión mínima.

Ejecutar desde la carpeta del proyecto:
    python python/app_gui.py

Sólo usa la biblioteca estándar de Python (tkinter viene incluido en el
instalador oficial de python.org para Windows y macOS).

Pestañas
  1. Comprimir        abrir .txt (o buscar en Gutenberg), frecuencias, códigos,
                      métricas, guardar .hfz y verificar la integridad
  2. Árbol            construcción voraz del árbol, unión por unión
  3. Inspector        abrir un .hfz SIN el original, ver su estructura y
                      descomprimirlo
  4. Expansión mínima Kruskal y Prim paso a paso

Equipo: Erin Fernando Cuellar Gonzalez, Brian Ulises Vazquez Hernandez,
Francisco Javier Quintero Magaña y Juan Manuel Murillo Lopez.
Análisis de Algoritmos 2026B · CUCEI, Universidad de Guadalajara.
"""
import hashlib
import importlib.util
import os
import queue
import re
import sys
import threading
import time
import tkinter as tk
import tkinter.font as tkfont
from tkinter import filedialog, messagebox, ttk

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import huffman as H  # noqa: E402
import mst as M  # noqa: E402

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

EQUIPO = (
    "Erin Fernando Cuellar Gonzalez",
    "Brian Ulises Vazquez Hernandez",
    "Francisco Javier Quintero Magaña",
    "Juan Manuel Murillo Lopez",
)

# El buscador de Gutenberg es el mismo módulo que usa la versión web (api/)
try:
    _spec = importlib.util.spec_from_file_location("api_gutenberg", os.path.join(RAIZ, "api", "gutenberg.py"))
    GB = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(GB)
except Exception:  # pragma: no cover - si falta la carpeta api/
    GB = None

# --------------------------------------------------------------------------
# Paleta (la misma de la página web)
# --------------------------------------------------------------------------
C = {
    "bg": "#0b0930", "panel": "#15123f", "panel2": "#1d1958", "line": "#2c2770",
    "text": "#f3f1ff", "text2": "#bdbae3", "text3": "#8b88b9", "text4": "#5f5c8c",
    "violet": "#7b5cff", "violet2": "#a594ff", "blue": "#2f7bff", "cyan": "#57d2ff",
    "coral": "#ff6a4d", "coral2": "#ff8a5c", "mint": "#4ee3b5", "amber": "#ffc857", "rose": "#ff5d7a",
}
SEG = {"Firma": "id", "Versión": "id", "Modo": "id", "Codificador": "id", "Fecha": "meta",
       "Tamaño original": "meta", "CRC-32": "meta", "Bits válidos": "bits", "Relleno": "bits",
       "Largo del nombre": "name", "Nombre": "name", "Símbolos distintos": "table", "Anchos": "table",
       "Tabla de frecuencias": "table", "Datos comprimidos": "data"}
SEG_COLOR = {"id": "#a594ff", "meta": "#57a6ff", "bits": "#57d2ff", "name": "#e7a8ff", "table": "#ff9a7a", "data": "#4ee3b5"}
PIZARRON = "abbacabbcd"


def fuente(candidatas, tam, peso="normal"):
    disponibles = set(tkfont.families())
    for f in candidatas:
        if f in disponibles:
            return (f, tam, peso)
    return ("TkDefaultFont", tam, peso)


def seguro(texto):
    """Tk 8.6 no dibuja caracteres fuera del plano básico (emojis): se escriben como U+XXXX."""
    return re.sub(r"[^\u0000-￿]", lambda m: f"[U+{ord(m.group()):X}]", texto)


GUI_NOMBRES = {0x20: ("esp", "(espacio)"), 0x0A: ("\\n", "(salto de línea)"), 0x0D: ("\\r", "(retorno)"),
               0x09: ("\\t", "(tabulador)"), 0xA0: ("nbsp", "(espacio no separable)"), 0xFEFF: ("BOM", "(BOM)")}


def etiqueta(simbolo, modo, corta=False):
    """Nombre visible de un símbolo usando sólo caracteres que existen en cualquier fuente."""
    if simbolo in GUI_NOMBRES and (modo == "char" or simbolo < 0x80):
        return GUI_NOMBRES[simbolo][0 if corta else 1]
    return seguro(H.describir(simbolo, modo))


def miles(n):
    return f"{n:,}"


def pct(x):
    return f"{x * 100:.1f} %"


# --------------------------------------------------------------------------
# Aplicación
# --------------------------------------------------------------------------
class App:
    def __init__(self, root):
        self.root = root
        root.title("Huffly Desktop — Huffman y árbol de expansión mínima")
        root.geometry("1260x820")
        root.minsize(1020, 680)
        root.configure(bg=C["bg"])
        self.F = fuente(["Segoe UI", "SF Pro Text", "Helvetica Neue", "Inter", "DejaVu Sans"], 10)
        self.FB = (self.F[0], 10, "bold")
        self.FS = (self.F[0], 9)
        self.FT = (self.F[0], 17, "bold")
        self.FH = (self.F[0], 12, "bold")
        self.FM = fuente(["Cascadia Mono", "Consolas", "Menlo", "SF Mono", "DejaVu Sans Mono", "Courier New"], 10)
        self._estilos()

        # Estado compartido
        self.datos = None          # bytes del texto original
        self.nombre = ""
        self.analisis = None
        self.hfz = None            # bytes del último .hfz generado
        self.cola = queue.Queue()  # resultados de los hilos de trabajo

        self._encabezado()
        self.nb = ttk.Notebook(root)
        self.nb.pack(fill="both", expand=True, padx=16, pady=(4, 0))
        self.tab_comp = PestanaComprimir(self)
        self.tab_arbol = PestanaArbol(self)
        self.tab_insp = PestanaInspector(self)
        self.tab_mst = PestanaMST(self)
        self.nb.add(self.tab_comp.frame, text="  1 · Comprimir  ")
        self.nb.add(self.tab_arbol.frame, text="  2 · Árbol  ")
        self.nb.add(self.tab_insp.frame, text="  3 · Inspector  ")
        self.nb.add(self.tab_mst.frame, text="  4 · Expansión mínima  ")
        self._barra_estado()
        self.root.after(80, self._revisar_cola)

    # ------------------------------------------------------------------ estilo
    def _estilos(self):
        s = ttk.Style(self.root)
        s.theme_use("clam")
        s.configure(".", background=C["bg"], foreground=C["text2"], fieldbackground=C["panel2"],
                    bordercolor=C["line"], lightcolor=C["panel"], darkcolor=C["panel"], troughcolor=C["panel"],
                    focuscolor=C["violet"], font=self.F, insertcolor=C["text"])
        s.configure("TFrame", background=C["bg"])
        s.configure("Card.TFrame", background=C["panel"])
        s.configure("TLabel", background=C["bg"], foreground=C["text2"])
        s.configure("Card.TLabel", background=C["panel"], foreground=C["text2"])
        s.configure("Muted.TLabel", background=C["panel"], foreground=C["text3"], font=self.FS)
        s.configure("Value.TLabel", background=C["panel"], foreground=C["text"], font=self.FH)
        s.configure("Big.TLabel", background=C["panel"], foreground=C["mint"], font=(self.F[0], 15, "bold"))
        s.configure("H.TLabel", background=C["panel"], foreground=C["text"], font=self.FH)
        s.configure("TNotebook", background=C["bg"], borderwidth=0, tabmargins=(0, 6, 0, 0))
        s.configure("TNotebook.Tab", background=C["bg"], foreground=C["text3"], padding=(14, 8), borderwidth=0, font=self.FB)
        s.map("TNotebook.Tab", background=[("selected", C["panel"])], foreground=[("selected", C["text"])])
        s.configure("TButton", background=C["panel2"], foreground=C["text"], borderwidth=1, padding=(12, 6), relief="flat")
        s.map("TButton", background=[("disabled", C["panel"]), ("active", C["line"])], foreground=[("disabled", C["text4"])])
        s.configure("Accent.TButton", background=C["coral"], foreground="#230b05", font=self.FB, bordercolor=C["coral"])
        s.map("Accent.TButton", background=[("disabled", C["panel"]), ("active", C["coral2"])], foreground=[("disabled", C["text4"])])
        s.configure("Treeview", background=C["panel"], fieldbackground=C["panel"], foreground=C["text"], rowheight=25, borderwidth=0)
        s.configure("Treeview.Heading", background=C["panel2"], foreground=C["text3"], relief="flat", font=self.FS, padding=(6, 5))
        s.map("Treeview.Heading", background=[("active", C["line"])])
        s.map("Treeview", background=[("selected", "#30297a")], foreground=[("selected", C["text"])])
        s.configure("TCombobox", fieldbackground=C["panel2"], background=C["panel2"], foreground=C["text"], arrowcolor=C["text2"], padding=4)
        s.map("TCombobox", fieldbackground=[("readonly", C["panel2"])], foreground=[("readonly", C["text"])])
        s.configure("TEntry", fieldbackground=C["panel2"], foreground=C["text"], padding=6)
        s.configure("TSpinbox", fieldbackground=C["panel2"], foreground=C["text"], arrowcolor=C["text2"], padding=4)
        s.configure("TRadiobutton", background=C["panel"], foreground=C["text2"], indicatorcolor=C["panel2"])
        s.map("TRadiobutton", indicatorcolor=[("selected", C["violet"])], background=[("active", C["panel"])])
        s.configure("TCheckbutton", background=C["panel"], foreground=C["text2"], indicatorcolor=C["panel2"])
        s.map("TCheckbutton", indicatorcolor=[("selected", C["violet"])], background=[("active", C["panel"])])
        s.configure("Horizontal.TScale", background=C["panel"], troughcolor=C["panel2"])
        s.configure("Horizontal.TProgressbar", background=C["violet"], troughcolor=C["panel"], bordercolor=C["bg"])
        for o in ("Vertical", "Horizontal"):
            s.configure(f"{o}.TScrollbar", background=C["panel2"], troughcolor=C["bg"], arrowcolor=C["text3"], bordercolor=C["bg"])
        self.root.option_add("*TCombobox*Listbox.background", C["panel2"])
        self.root.option_add("*TCombobox*Listbox.foreground", C["text"])
        self.root.option_add("*TCombobox*Listbox.selectBackground", C["violet"])

    def _encabezado(self):
        top = tk.Frame(self.root, bg=C["bg"])
        top.pack(fill="x", padx=18, pady=(14, 8))
        logo = tk.Canvas(top, width=34, height=34, bg=C["bg"], highlightthickness=0)
        logo.pack(side="left")
        logo.create_rectangle(2, 2, 32, 32, fill=C["violet"], outline="")
        logo.create_line(17, 11, 10, 23, fill="white", width=2)
        logo.create_line(17, 11, 24, 23, fill="white", width=2)
        for x, y in ((17, 10), (10, 24), (24, 24)):
            logo.create_oval(x - 3.5, y - 3.5, x + 3.5, y + 3.5, fill="white", outline="")
        tk.Label(top, text="Huffly Desktop", bg=C["bg"], fg=C["text"], font=self.FT).pack(side="left", padx=(10, 12))
        tk.Label(top, text="Compresión de Huffman con técnica voraz y árbol de expansión mínima",
                 bg=C["bg"], fg=C["text3"], font=self.F).pack(side="left", pady=(4, 0))
        ttk.Button(top, text="Equipo", command=self.acerca_de).pack(side="right")

    def acerca_de(self):
        messagebox.showinfo(
            "Equipo",
            "Huffly — Huffman Web Compressor\n\n" + "\n".join(EQUIPO)
            + "\n\nAnálisis de Algoritmos · 2026B\nCUCEI, Universidad de Guadalajara",
            parent=self.root)

    def _barra_estado(self):
        barra = tk.Frame(self.root, bg=C["bg"])
        barra.pack(fill="x", padx=18, pady=8)
        self.estado = tk.Label(barra, text="Listo. Abre un .txt para empezar.", bg=C["bg"], fg=C["text3"], font=self.FS, anchor="w")
        self.estado.pack(side="left", fill="x", expand=True)
        self.progreso = ttk.Progressbar(barra, mode="indeterminate", length=160)

    def ocupado(self, texto):
        self.estado.config(text=texto, fg=C["text2"])
        self.progreso.pack(side="right")
        self.progreso.start(12)

    def listo(self, texto, color=None):
        self.progreso.stop()
        self.progreso.pack_forget()
        self.estado.config(text=texto, fg=color or C["text3"])

    # --------------------------------------------------------------- trabajo
    def en_segundo_plano(self, mensaje, trabajo, al_terminar):
        """Ejecuta `trabajo()` en un hilo para no congelar la ventana."""
        self.ocupado(mensaje)

        def correr():
            try:
                self.cola.put((al_terminar, trabajo(), None))
            except Exception as e:  # se muestra en la ventana principal
                self.cola.put((al_terminar, None, e))
        threading.Thread(target=correr, daemon=True).start()

    def _revisar_cola(self):
        try:
            while True:
                al_terminar, resultado, error = self.cola.get_nowait()
                if error:
                    self.listo(f"Error: {error}", C["rose"])
                    messagebox.showerror("Huffly", str(error))
                else:
                    al_terminar(resultado)
        except queue.Empty:
            pass
        self.root.after(80, self._revisar_cola)

    # ---------------------------------------------------------------- datos
    def cargar_texto(self, datos, nombre):
        if not datos:
            messagebox.showwarning("Huffly", "El archivo está vacío.")
            return
        self.datos, self.nombre = datos, nombre
        self.analisis = None
        self.hfz = None
        self.tab_comp.mostrar_documento()
        self.analizar()

    def analizar(self):
        modo = {"Automático": "auto", "Carácter Unicode": "char", "Byte": "byte"}[self.tab_comp.modo.get()]

        def trabajo():
            t0 = time.perf_counter()
            a = H.analizar(self.datos, modo)
            a["ms"] = (time.perf_counter() - t0) * 1000
            return a

        def listo(a):
            self.analisis = a
            self.hfz = None
            self.tab_comp.mostrar_analisis()
            self.tab_arbol.cargar(a["raiz"], a["pasos"], a["modo"], a["codigos"])
            self.listo(f"Analizado: {miles(a['total'])} símbolos, {len(a['entradas'])} distintos, en {a['ms']:.0f} ms.")
        self.en_segundo_plano("Analizando frecuencias…", trabajo, listo)


# --------------------------------------------------------------------------
# Utilidades de interfaz
# --------------------------------------------------------------------------
def tarjeta(padre, titulo=None, **kw):
    f = ttk.Frame(padre, style="Card.TFrame", padding=14, **kw)
    if titulo:
        ttk.Label(f, text=titulo, style="H.TLabel").pack(anchor="w", pady=(0, 8))
    return f


def tabla(padre, columnas, anchos, alto=12):
    marco = ttk.Frame(padre, style="Card.TFrame")
    tv = ttk.Treeview(marco, columns=columnas, show="headings", height=alto)
    for col, ancho in zip(columnas, anchos):
        tv.heading(col, text=col)
        tv.column(col, width=ancho, anchor="e" if col in ("Frecuencia", "%", "Longitud", "Bytes", "Peso") else "w", stretch=True)
    sb = ttk.Scrollbar(marco, orient="vertical", command=tv.yview)
    tv.configure(yscrollcommand=sb.set)
    tv.pack(side="left", fill="both", expand=True)
    sb.pack(side="right", fill="y")
    return marco, tv


# --------------------------------------------------------------------------
# 1. Comprimir
# --------------------------------------------------------------------------
class PestanaComprimir:
    def __init__(self, app):
        self.app = app
        self.frame = ttk.Frame(app.nb, padding=14)
        izq = ttk.Frame(self.frame, width=380)
        izq.pack(side="left", fill="y")
        izq.pack_propagate(False)
        der = ttk.Frame(self.frame)
        der.pack(side="left", fill="both", expand=True, padx=(14, 0))

        # Entrada
        t = tarjeta(izq, "Texto de entrada")
        t.pack(fill="x")
        fila = ttk.Frame(t, style="Card.TFrame")
        fila.pack(fill="x")
        ttk.Button(fila, text="Abrir .txt…", command=self.abrir).pack(side="left")
        ttk.Button(fila, text="Buscar en Gutenberg…", command=lambda: DialogoGutenberg(app)).pack(side="left", padx=6)
        ttk.Button(fila, text="Pizarrón", command=lambda: app.cargar_texto(PIZARRON.encode(), "pizarron.txt")).pack(side="left")
        self.doc = ttk.Label(t, text="Ningún texto cargado.", style="Muted.TLabel", wraplength=340, justify="left")
        self.doc.pack(anchor="w", pady=(10, 6))
        fila2 = ttk.Frame(t, style="Card.TFrame")
        fila2.pack(fill="x")
        ttk.Label(fila2, text="Un símbolo es:", style="Card.TLabel").pack(side="left")
        self.modo = ttk.Combobox(fila2, values=["Automático", "Carácter Unicode", "Byte"], state="readonly", width=17)
        self.modo.set("Automático")
        self.modo.pack(side="left", padx=8)
        self.modo.bind("<<ComboboxSelected>>", lambda e: app.datos and app.analizar())

        # Métricas
        m = tarjeta(izq, "Métricas")
        m.pack(fill="x", pady=12)
        self.valores = {}
        claves = ["Original", "Comprimido", "Ahorro", "Reducción", "Razón", "Símbolos distintos",
                  "Bits codificados", "Encabezado", "Longitud media", "Entropía"]
        rejilla = ttk.Frame(m, style="Card.TFrame")
        rejilla.pack(fill="x")
        for i, k in enumerate(claves):
            ttk.Label(rejilla, text=k, style="Muted.TLabel").grid(row=i, column=0, sticky="w", pady=2)
            v = ttk.Label(rejilla, text="—", style="Card.TLabel", font=app.FB)
            v.grid(row=i, column=1, sticky="e", pady=2)
            self.valores[k] = v
        rejilla.columnconfigure(1, weight=1)

        # Acciones
        a = tarjeta(izq, "Archivo .hfz")
        a.pack(fill="x")
        self.btn_comp = ttk.Button(a, text="Comprimir y guardar .hfz…", style="Accent.TButton", command=self.comprimir, state="disabled")
        self.btn_comp.pack(fill="x")
        ttk.Button(a, text="Descomprimir un .hfz…", command=self.descomprimir).pack(fill="x", pady=(8, 0))
        self.integridad = tk.Label(a, text="", bg=C["panel"], fg=C["text3"], font=app.FS, justify="left", anchor="w", wraplength=340)
        self.integridad.pack(fill="x", pady=(10, 0))

        # Derecha: histograma + tabla
        h = tarjeta(der, "Frecuencias")
        h.pack(fill="x")
        self.hist = tk.Canvas(h, height=150, bg=C["panel"], highlightthickness=0)
        self.hist.pack(fill="x")
        self.hist.bind("<Configure>", lambda e: self.dibujar_histograma())
        tt = tarjeta(der, "Tabla de códigos (clic en un encabezado para ordenar)")
        tt.pack(fill="both", expand=True, pady=(12, 0))
        cols = ("Símbolo", "Unicode", "Frecuencia", "%", "Código", "Longitud")
        marco, self.tv = tabla(tt, cols, (80, 90, 90, 70, 260, 70), alto=14)
        marco.pack(fill="both", expand=True)
        self.orden = ("Frecuencia", True)
        for col in cols:
            self.tv.heading(col, command=lambda c=col: self.ordenar(c))

    def abrir(self):
        ruta = filedialog.askopenfilename(title="Abrir un archivo de texto", filetypes=[("Texto", "*.txt"), ("Todos", "*.*")])
        if ruta:
            with open(ruta, "rb") as f:
                self.app.cargar_texto(f.read(), os.path.basename(ruta))

    def mostrar_documento(self):
        d = self.app.datos
        lineas = d.count(b"\n") + 1
        try:
            d.decode("utf-8")
            cod = "ASCII" if d.isascii() else "UTF-8"
        except UnicodeDecodeError:
            cod = "no es UTF-8 (se usará modo byte)"
        self.doc.config(text=f"{self.app.nombre}\n{H.formato_bytes(len(d))} ({miles(len(d))} bytes), {miles(lineas)} líneas, {cod}")
        for v in self.valores.values():
            v.config(text="—", foreground=C["text"])
        self.integridad.config(text="")

    def mostrar_analisis(self):
        a = self.app.analisis
        n = a["total"] or 1
        self.valores["Símbolos distintos"].config(text=miles(len(a["entradas"])))
        self.valores["Bits codificados"].config(text=miles(a["bits"]))
        self.valores["Longitud media"].config(text=f"{a['bits'] / n:.3f} bits")
        self.valores["Entropía"].config(text=f"{a['entropia']:.3f} bits")
        for k in ("Original", "Comprimido", "Ahorro", "Reducción", "Razón", "Encabezado"):
            self.valores[k].config(text="—")
        self.valores["Original"].config(text=H.formato_bytes(len(self.app.datos)))
        self.btn_comp.config(state="normal")
        self.llenar_tabla()
        self.dibujar_histograma()

    def llenar_tabla(self):
        a = self.app.analisis
        if not a:
            return
        col, desc = self.orden
        filas = list(a["entradas"])
        if col == "Símbolo" or col == "Unicode":
            filas.sort(key=lambda e: e[0], reverse=desc)
        elif col in ("Código", "Longitud"):
            filas.sort(key=lambda e: (len(a["codigos"][e[0]]), -e[1]), reverse=desc)
        else:
            filas.sort(key=lambda e: (e[1], -e[0]), reverse=desc)
        self.tv.delete(*self.tv.get_children())
        total = a["total"] or 1
        for s, f in filas[:800]:
            unicode = f"U+{s:04X}" if a["modo"] == "char" else f"0x{s:02X}"
            cod = a["codigos"][s]
            self.tv.insert("", "end", values=(etiqueta(s, a["modo"]), unicode, miles(f), f"{f / total * 100:.2f}",
                                              cod if len(cod) <= 40 else cod[:40] + "…", len(cod)))

    def ordenar(self, col):
        actual, desc = self.orden
        self.orden = (col, not desc if col == actual else col in ("Frecuencia", "%"))
        self.llenar_tabla()

    def dibujar_histograma(self):
        cv = self.hist
        cv.delete("all")
        a = self.app.analisis
        w = max(cv.winfo_width(), 200)
        h = 150
        if not a:
            cv.create_text(w / 2, h / 2, text="Las frecuencias aparecerán aquí.", fill=C["text4"], font=self.app.F)
            return
        top = sorted(a["entradas"], key=lambda e: (-e[1], e[0]))[:40]
        maximo = top[0][1]
        paso = w / len(top)
        for i, (s, f) in enumerate(top):
            alto = max(2, (f / maximo) * (h - 26))
            x0 = i * paso + 2
            color = C["cyan"] if i < 3 else C["violet"]
            cv.create_rectangle(x0, h - 18 - alto, x0 + paso - 4, h - 18, fill=color, outline="")
            txt = etiqueta(s, a["modo"], corta=True)
            cv.create_text(x0 + (paso - 4) / 2, h - 8, text=txt if len(txt) <= 2 else "·", fill=C["text3"], font=self.app.FM)

    def comprimir(self):
        app = self.app
        sugerido = os.path.splitext(app.nombre)[0] + ".hfz"
        ruta = filedialog.asksaveasfilename(title="Guardar archivo comprimido", initialfile=sugerido,
                                            defaultextension=".hfz", filetypes=[("Huffly comprimido", "*.hfz")])
        if not ruta:
            return

        def trabajo():
            t0 = time.perf_counter()
            archivo, a = H.comprimir(app.datos, app.nombre, analisis=app.analisis)
            with open(ruta, "wb") as f:
                f.write(archivo)
            return archivo, a, (time.perf_counter() - t0) * 1000

        def listo(res):
            archivo, a, ms = res
            app.hfz = archivo
            n, c = len(app.datos), len(archivo)
            ahorro = n - c
            self.valores["Original"].config(text=f"{H.formato_bytes(n)}  ({miles(n)} B)")
            self.valores["Comprimido"].config(text=f"{H.formato_bytes(c)}  ({miles(c)} B)")
            self.valores["Ahorro"].config(text=f"{H.formato_bytes(abs(ahorro))}  ({miles(ahorro)} B)")
            self.valores["Reducción"].config(text=pct(ahorro / n), foreground=C["mint"] if ahorro >= 0 else C["amber"])
            self.valores["Razón"].config(text=f"{n / c:.2f} : 1")
            self.valores["Encabezado"].config(text=f"{miles(a['tam_cabecera'])} B")
            app.listo(f"Guardado {os.path.basename(ruta)} en {ms:.0f} ms. Ábrelo en la pestaña Inspector.", C["mint"])
            app.tab_insp.cargar(archivo, os.path.basename(ruta))
        app.en_segundo_plano("Comprimiendo…", trabajo, listo)

    def descomprimir(self):
        ruta = filedialog.askopenfilename(title="Abrir un archivo .hfz", filetypes=[("Huffly comprimido", "*.hfz"), ("Todos", "*.*")])
        if ruta:
            with open(ruta, "rb") as f:
                self.app.tab_insp.cargar(f.read(), os.path.basename(ruta))
            self.app.nb.select(self.app.tab_insp.frame)


# --------------------------------------------------------------------------
# 2. Árbol (dibujo + animación de las uniones)
# --------------------------------------------------------------------------
class PestanaArbol:
    def __init__(self, app):
        self.app = app
        self.frame = ttk.Frame(app.nb, padding=14)
        self.raiz = None
        self.pasos = []
        self.k = 0
        self.escala = 1.0
        self.anim = None

        controles = tarjeta(self.frame)
        controles.pack(fill="x")
        fila = ttk.Frame(controles, style="Card.TFrame")
        fila.pack(fill="x")
        for texto, cmd in (("«", lambda: self.ir(0)), ("‹", lambda: self.ir(self.k - 1))):
            ttk.Button(fila, text=texto, width=3, command=lambda c=cmd: (self.pausar(), c())).pack(side="left", padx=(0, 4))
        self.btn_play = ttk.Button(fila, text="Reproducir", style="Accent.TButton", command=self.alternar)
        self.btn_play.pack(side="left", padx=4)
        for texto, cmd in (("›", lambda: self.ir(self.k + 1)), ("»", lambda: self.ir(len(self.pasos)))):
            ttk.Button(fila, text=texto, width=3, command=lambda c=cmd: (self.pausar(), c())).pack(side="left", padx=(4, 0))
        self.barra = ttk.Scale(fila, from_=0, to=1, orient="horizontal", command=lambda v: self.ir(int(float(v)), desde_barra=True))
        self.barra.pack(side="left", fill="x", expand=True, padx=12)
        self.lbl_k = ttk.Label(fila, text="0 / 0", style="Card.TLabel", width=9)
        self.lbl_k.pack(side="left")
        ttk.Button(fila, text="−", width=3, command=lambda: self.zoom(1 / 1.25)).pack(side="left", padx=(10, 2))
        ttk.Button(fila, text="+", width=3, command=lambda: self.zoom(1.25)).pack(side="left")
        self.narr = tk.Label(controles, text="Abre un texto en la pestaña Comprimir para construir su árbol.",
                             bg=C["panel"], fg=C["text2"], font=app.F, anchor="w", justify="left", wraplength=1100)
        self.narr.pack(fill="x", pady=(10, 0))

        lienzo = ttk.Frame(self.frame, style="Card.TFrame")
        lienzo.pack(fill="both", expand=True, pady=(12, 0))
        self.cv = tk.Canvas(lienzo, bg="#0c0a2c", highlightthickness=0)
        sx = ttk.Scrollbar(lienzo, orient="horizontal", command=self.cv.xview)
        sy = ttk.Scrollbar(lienzo, orient="vertical", command=self.cv.yview)
        self.cv.configure(xscrollcommand=sx.set, yscrollcommand=sy.set)
        sy.pack(side="right", fill="y")
        sx.pack(side="bottom", fill="x")
        self.cv.pack(fill="both", expand=True)
        self.cv.bind("<ButtonPress-1>", lambda e: self.cv.scan_mark(e.x, e.y))
        self.cv.bind("<B1-Motion>", lambda e: self.cv.scan_dragto(e.x, e.y, gain=1))

    def cargar(self, raiz, pasos, modo, codigos):
        self.pausar()
        self.raiz, self.pasos, self.modo, self.codigos = raiz, pasos, modo, codigos
        self.barra.configure(to=max(1, len(pasos)))
        self.dibujar()
        self.ir(len(pasos))

    def _layout(self):
        pos, profundidad, hoja = {}, 0, [0]
        dx, dy = 44 * self.escala, 70 * self.escala

        def recorrer(n, d):
            nonlocal profundidad
            profundidad = max(profundidad, d)
            if n.es_hoja:
                pos[n] = (40 + hoja[0] * dx, 40 + d * dy)
                hoja[0] += 1
                return
            recorrer(n.izq, d + 1)
            recorrer(n.der, d + 1)
            pos[n] = ((pos[n.izq][0] + pos[n.der][0]) / 2, 40 + d * dy)
        sys.setrecursionlimit(max(2000, sys.getrecursionlimit()))
        recorrer(self.raiz, 0)
        return pos, 80 + (hoja[0] - 1) * dx, 90 + profundidad * dy

    def dibujar(self):
        cv = self.cv
        cv.delete("all")
        self.items = {}   # nodo → (ids del nodo, ids de las aristas hacia sus hijos)
        if self.raiz is None:
            return
        if len(self.pasos) + 1 > 700:
            cv.create_text(40, 40, anchor="nw", fill=C["text3"], font=self.app.F,
                           text="El árbol tiene demasiadas hojas para dibujarlo con claridad.")
            return
        pos, ancho, alto = self._layout()
        r = 15 * self.escala
        fm = (self.app.FM[0], max(7, int(10 * self.escala)))
        pila = [self.raiz]
        while pila:
            n = pila.pop()
            x, y = pos[n]
            aristas = []
            if not n.es_hoja:
                for hijo, bit in ((n.izq, "0"), (n.der, "1")):
                    hx, hy = pos[hijo]
                    aristas.append(cv.create_line(x, y + r, hx, hy - r, fill="#3b3580", width=1.5))
                    aristas.append(cv.create_text((x + hx) / 2 + (8 if bit == "1" else -8) * self.escala, (y + hy) / 2,
                                                  text=bit, fill=C["text4"], font=fm))
                    pila.append(hijo)
                ids = [cv.create_oval(x - r, y - r, x + r, y + r, fill=C["panel2"], outline="#5a54a8", width=1.4),
                       cv.create_text(x, y, text=str(n.freq), fill=C["text"], font=fm)]
            else:
                g = etiqueta(n.simbolo, self.modo, corta=True)
                ids = [cv.create_oval(x - r, y - r, x + r, y + r, fill=C["violet"], outline="#c9bdff", width=1.2),
                       cv.create_text(x, y, text=g if len(g) <= 3 else g[:3], fill="white", font=(fm[0], fm[1], "bold")),
                       cv.create_text(x, y + r + 9 * self.escala, text=str(n.freq), fill=C["text3"], font=fm)]
            self.items[n] = (ids, aristas)
        cv.configure(scrollregion=(0, 0, ancho, alto))

    def ir(self, k, desde_barra=False):
        if self.raiz is None:
            return
        self.k = max(0, min(len(self.pasos), k))
        actual = self.pasos[self.k - 1] if self.k > 0 else None
        siguiente = self.pasos[self.k] if self.k < len(self.pasos) else None
        for n, (ids, aristas) in getattr(self, "items", {}).items():
            visible = n.paso <= self.k
            for i in ids:
                self.cv.itemconfigure(i, state="normal" if visible else "hidden")
            for i in aristas:
                self.cv.itemconfigure(i, state="normal" if visible else "hidden")
            borde = C["coral"] if actual and n is actual[2] else C["amber"] if siguiente and n in siguiente[:2] else ("#c9bdff" if n.es_hoja else "#5a54a8")
            self.cv.itemconfigure(ids[0], outline=borde, width=3 if borde in (C["coral"], C["amber"]) else 1.3)
        if not desde_barra:
            self.barra.set(self.k)
        self.lbl_k.config(text=f"{self.k} / {len(self.pasos)}")
        nombre = lambda n: f"nodo ({n.freq})" if not n.es_hoja else f"«{etiqueta(n.simbolo, self.modo)}» ({n.freq})"
        if not self.pasos:
            t = "Sólo hay un símbolo distinto: el árbol es una hoja y su código es 0."
        elif self.k == 0:
            t = f"Inicio: hay {len(self.pasos) + 1} hojas en la cola de prioridad. En ámbar, los dos nodos que se unirán primero."
        else:
            a, b, nuevo = actual
            t = f"Unión {self.k} de {len(self.pasos)}: se sacan {nombre(a)} y {nombre(b)}, los dos más ligeros, y se crea un nodo de {nuevo.freq} (borde coral)."
            if self.k == len(self.pasos):
                t += f" Árbol completo: la raíz suma {nuevo.freq}."
        self.narr.config(text=t)

    def alternar(self):
        if self.anim:
            self.pausar()
        else:
            if self.k >= len(self.pasos):
                self.ir(0)
            self.btn_play.config(text="Pausar")
            self._tick()

    def _tick(self):
        if self.k >= len(self.pasos):
            self.pausar()
            return
        self.ir(self.k + 1)
        self.anim = self.app.root.after(max(40, 2400 // max(1, len(self.pasos))) if len(self.pasos) > 30 else 450, self._tick)

    def pausar(self):
        if self.anim:
            self.app.root.after_cancel(self.anim)
        self.anim = None
        self.btn_play.config(text="Reproducir")

    def zoom(self, f):
        self.escala = max(0.4, min(2.2, self.escala * f))
        self.dibujar()
        self.ir(self.k)


# --------------------------------------------------------------------------
# 3. Inspector
# --------------------------------------------------------------------------
class PestanaInspector:
    def __init__(self, app):
        self.app = app
        self.frame = ttk.Frame(app.nb, padding=14)
        self.archivo = None
        self.recuperado = None

        arriba = tarjeta(self.frame)
        arriba.pack(fill="x")
        fila = ttk.Frame(arriba, style="Card.TFrame")
        fila.pack(fill="x")
        ttk.Button(fila, text="Abrir .hfz…", command=self.abrir).pack(side="left")
        self.btn_desc = ttk.Button(fila, text="Descomprimir", style="Accent.TButton", command=self.descomprimir, state="disabled")
        self.btn_desc.pack(side="left", padx=8)
        self.btn_guardar = ttk.Button(fila, text="Guardar recuperado.txt…", command=self.guardar, state="disabled")
        self.btn_guardar.pack(side="left")
        self.titulo = ttk.Label(arriba, text="Abre un archivo .hfz: el inspector no necesita el .txt original.", style="Muted.TLabel")
        self.titulo.pack(anchor="w", pady=(10, 0))

        cuerpo = ttk.Frame(self.frame)
        cuerpo.pack(fill="both", expand=True, pady=(12, 0))
        izq = tarjeta(cuerpo, "Encabezado")
        izq.pack(side="left", fill="both", expand=True)
        marco, self.tv = tabla(izq, ("Campo", "Bytes", "Valor"), (170, 60, 260), alto=15)
        marco.pack(fill="both", expand=True)
        der = tarjeta(cuerpo, "Volcado hexadecimal y bits")
        der.pack(side="left", fill="both", expand=True, padx=(12, 0))
        self.txt = tk.Text(der, bg=C["panel"], fg=C["text2"], font=app.FM, relief="flat", wrap="none", height=18,
                           insertbackground=C["text"], selectbackground=C["violet"], borderwidth=0, highlightthickness=0)
        self.txt.pack(fill="both", expand=True)
        for k, color in SEG_COLOR.items():
            self.txt.tag_configure(k, foreground=color)
        self.txt.tag_configure("off", foreground=C["text4"])
        self.txt.tag_configure("b1", foreground=C["cyan"])
        self.txt.tag_configure("b0", foreground=C["text3"])
        self.txt.tag_configure("titulo", foreground=C["text"], font=(app.FM[0], app.FM[1], "bold"))
        self.txt.tag_configure("ok", foreground=C["mint"], font=(app.FM[0], app.FM[1], "bold"))
        self.txt.tag_configure("mal", foreground=C["rose"], font=(app.FM[0], app.FM[1], "bold"))

    def abrir(self):
        ruta = filedialog.askopenfilename(title="Abrir un archivo .hfz", filetypes=[("Huffly comprimido", "*.hfz"), ("Todos", "*.*")])
        if ruta:
            with open(ruta, "rb") as f:
                self.cargar(f.read(), os.path.basename(ruta))

    def cargar(self, archivo, nombre):
        try:
            cab = H.leer_cabecera(archivo)
        except ValueError as e:
            messagebox.showerror("Huffly", f"No se pudo abrir «{nombre}»:\n{e}")
            return
        self.archivo, self.nombre, self.cab = archivo, nombre, cab
        self.recuperado = None
        n, c = cab["tam_original"], len(archivo)
        self.titulo.config(text=seguro(
            f"{nombre}   ·   {H.formato_bytes(c)} ({miles(c)} B)   ·   original {H.formato_bytes(n)}   ·   "
            f"ahorro {miles(n - c)} B ({pct((n - c) / n) if n else '—'})   ·   {cab['simbolos']} símbolos   ·   {miles(cab['bits'])} bits"))
        self.tv.delete(*self.tv.get_children())
        for nombre_campo, ini, largo, valor in cab["segmentos"]:
            self.tv.insert("", "end", values=(nombre_campo, largo, seguro(valor)))
        self._volcado()
        self.btn_desc.config(state="normal")
        self.btn_guardar.config(state="disabled")
        self.app.listo(f"Inspector: {nombre} es un .hfz válido (versión {cab['version']}, modo {'carácter' if cab['modo'] == 'char' else 'byte'}).")

    def _volcado(self):
        t, cab, archivo = self.txt, self.cab, self.archivo
        t.config(state="normal")
        t.delete("1.0", "end")
        dueño = {}
        for nombre_campo, ini, largo, _ in cab["segmentos"]:
            for k in range(ini, ini + largo):
                dueño[k] = SEG[nombre_campo]
        limite = min(len(archivo), (cab["offset_datos"] + 48 + 15) // 16 * 16, 640)
        t.insert("end", "Volcado hexadecimal (colores = campos del encabezado)\n\n", "titulo")
        for fila in range(0, limite, 16):
            t.insert("end", f"{fila:06X}  ", "off")
            for k in range(fila, min(fila + 16, limite)):
                t.insert("end", f"{archivo[k]:02X} ", dueño.get(k, "data"))
            t.insert("end", "\n")
        if len(archivo) > limite:
            t.insert("end", f"… y {miles(len(archivo) - limite)} bytes más de datos\n", "off")
        t.insert("end", "\nPrimeros bits de datos comprimidos\n\n", "titulo")
        for i, grupo in enumerate(H.vista_bits(archivo, cab, 384).split()):
            if i % 8 == 0:
                t.insert("end", f"{i * 8:5d}  ", "off")
            for b in grupo:
                t.insert("end", b, "b" + b)
            t.insert("end", " " if i % 8 != 7 else "\n")
        t.insert("end", f"\n\nRelleno al final del último byte: {cab['relleno']} bits\n", "off")
        t.config(state="disabled")

    def descomprimir(self):
        archivo = self.archivo

        def trabajo():
            t0 = time.perf_counter()
            datos, cab, ok = H.descomprimir(archivo)
            return datos, cab, ok, (time.perf_counter() - t0) * 1000

        def listo(res):
            datos, cab, ok, ms = res
            self.recuperado = datos
            orig = self.app.datos if self.app.datos is not None and len(self.app.datos) == len(datos) and H.crc32(self.app.datos) == cab["crc"] else None
            t = self.txt
            t.config(state="normal")
            t.insert("1.0", "\n")
            lineas = [("Descompresión en %.0f ms" % ms, "titulo")]
            lineas.append((f"{'OK   ' if len(datos) == cab['tam_original'] else 'FALLA'} Tamaño: {miles(len(datos))} B = {miles(cab['tam_original'])} B", "ok" if len(datos) == cab["tam_original"] else "mal"))
            lineas.append((f"{'OK   ' if ok else 'FALLA'} CRC-32: 0x{H.crc32(datos):08X} = 0x{cab['crc']:08X}", "ok" if ok else "mal"))
            if orig is not None:
                difs = sum(1 for a, b in zip(orig, datos) if a != b)
                lineas.append((f"{'OK   ' if difs == 0 else 'FALLA'} Byte a byte con el original abierto: {difs} diferencias", "ok" if difs == 0 else "mal"))
                igual = hashlib.sha256(orig).hexdigest() == hashlib.sha256(datos).hexdigest()
                lineas.append((f"{'OK   ' if igual else 'FALLA'} SHA-256 idéntico: {hashlib.sha256(datos).hexdigest()[:24]}…", "ok" if igual else "mal"))
            else:
                lineas.append((f"SHA-256 del recuperado: {hashlib.sha256(datos).hexdigest()[:24]}…", "off"))
            texto = datos.decode("utf-8", errors="replace")
            muestra = seguro(re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "·", texto[:3000]))
            for linea, tag in reversed(lineas + [("", "off"), ("Texto recuperado (primeros 3,000 caracteres):", "titulo"), (muestra, "off"), ("", "off"), ("─" * 60, "off")]):
                t.insert("1.0", linea + "\n", tag)
            t.config(state="disabled")
            t.see("1.0")
            self.btn_guardar.config(state="normal")
            self.app.listo("Recuperado idéntico: tamaño y CRC-32 coinciden." if ok else "El archivo está dañado: el CRC-32 no coincide.",
                           C["mint"] if ok else C["rose"])
        self.app.en_segundo_plano("Descomprimiendo…", trabajo, listo)

    def guardar(self):
        base = os.path.splitext(self.cab["nombre"] or self.nombre)[0]
        ruta = filedialog.asksaveasfilename(title="Guardar texto recuperado", initialfile=f"{base}-recuperado.txt",
                                            defaultextension=".txt", filetypes=[("Texto", "*.txt")])
        if ruta:
            with open(ruta, "wb") as f:
                f.write(self.recuperado)
            self.app.listo(f"Guardado {os.path.basename(ruta)}.", C["mint"])


# --------------------------------------------------------------------------
# 4. Árbol de expansión mínima
# --------------------------------------------------------------------------
class PestanaMST:
    ANCHO, ALTO = 760, 460

    def __init__(self, app):
        self.app = app
        self.frame = ttk.Frame(app.nb, padding=14)
        self.k = 0
        self.anim = None
        self.arrastre = None

        controles = tarjeta(self.frame)
        controles.pack(fill="x")
        fila = ttk.Frame(controles, style="Card.TFrame")
        fila.pack(fill="x")
        self.algo = tk.StringVar(value="kruskal")
        ttk.Radiobutton(fila, text="Kruskal", value="kruskal", variable=self.algo, command=self.calcular).pack(side="left")
        ttk.Radiobutton(fila, text="Prim", value="prim", variable=self.algo, command=self.calcular).pack(side="left", padx=(8, 16))
        ttk.Label(fila, text="Vértices", style="Card.TLabel").pack(side="left")
        self.n = tk.IntVar(value=9)
        ttk.Spinbox(fila, from_=4, to=16, textvariable=self.n, width=4, command=lambda: self.nuevo(self.semilla)).pack(side="left", padx=6)
        ttk.Label(fila, text="Inicio (Prim)", style="Card.TLabel").pack(side="left", padx=(12, 0))
        self.inicio = ttk.Combobox(fila, state="readonly", width=4)
        self.inicio.pack(side="left", padx=6)
        self.inicio.bind("<<ComboboxSelected>>", lambda e: self.calcular())
        ttk.Button(fila, text="Nuevo grafo", command=lambda: self.nuevo(int(time.time() * 1000) % 100000)).pack(side="left", padx=10)
        for texto, cmd in (("«", lambda: self.ir(0)), ("‹", lambda: self.ir(self.k - 1))):
            ttk.Button(fila, text=texto, width=3, command=lambda c=cmd: (self.pausar(), c())).pack(side="left", padx=2)
        self.btn_play = ttk.Button(fila, text="Reproducir", style="Accent.TButton", command=self.alternar)
        self.btn_play.pack(side="left", padx=4)
        for texto, cmd in (("›", lambda: self.ir(self.k + 1)), ("»", lambda: self.ir(len(self.res["pasos"])))):
            ttk.Button(fila, text=texto, width=3, command=lambda c=cmd: (self.pausar(), c())).pack(side="left", padx=2)
        self.narr = tk.Label(controles, text="", bg=C["panel"], fg=C["text2"], font=app.F, anchor="w", justify="left", wraplength=1100)
        self.narr.pack(fill="x", pady=(10, 0))

        cuerpo = ttk.Frame(self.frame)
        cuerpo.pack(fill="both", expand=True, pady=(12, 0))
        lado = tarjeta(cuerpo, "Aristas")
        lado.pack(side="right", fill="y")
        marco, self.tv = tabla(lado, ("Estado", "Arista", "Peso"), (70, 90, 60), alto=18)
        marco.pack(fill="both", expand=True)
        self.total = ttk.Label(lado, text="", style="Value.TLabel")
        self.total.pack(anchor="w", pady=(10, 0))
        self.tv.tag_configure("in", foreground=C["mint"])
        self.tv.tag_configure("out", foreground=C["rose"])
        self.tv.tag_configure("cur", foreground=C["amber"])
        lienzo = tarjeta(cuerpo)
        lienzo.pack(side="left", fill="both", expand=True, padx=(0, 12))
        self.cv = tk.Canvas(lienzo, width=self.ANCHO, height=self.ALTO, bg="#0c0a2c", highlightthickness=0)
        self.cv.pack(fill="both", expand=True)
        self.cv.bind("<ButtonPress-1>", self._agarrar)
        self.cv.bind("<B1-Motion>", self._mover)
        self.cv.bind("<ButtonRelease-1>", lambda e: setattr(self, "arrastre", None))
        self.semilla = 90
        self.nuevo(90)

    letra = staticmethod(lambda i: chr(65 + i))

    def nuevo(self, semilla):
        self.semilla = semilla
        try:
            n = max(4, min(16, int(self.n.get())))
        except (tk.TclError, ValueError):
            n = 9
        self.g = M.crear_grafo(n, semilla, self.ANCHO, self.ALTO)
        self.g["nodos"] = [list(p) for p in self.g["nodos"]]
        self.inicio.configure(values=[self.letra(i) for i in range(len(self.g["nodos"]))])
        self.inicio.set("A")
        self.calcular()

    def calcular(self):
        self.pausar()
        ini = ord(self.inicio.get() or "A") - 65
        self.res = M.kruskal(self.g) if self.algo.get() == "kruskal" else M.prim(self.g, ini)
        self.ini = ini
        self.ir(0)

    def dibujar(self, en_arbol, fuera, actual, componentes):
        cv = self.cv
        cv.delete("all")
        nodos = self.g["nodos"]
        for (id_, a, b, w) in self.g["aristas"]:
            (x1, y1), (x2, y2) = nodos[a], nodos[b]
            if id_ == actual:
                color, ancho, dash = C["amber"], 4, ()
            elif id_ in en_arbol:
                color, ancho, dash = C["mint"], 4, ()
            elif id_ in fuera:
                color, ancho, dash = C["rose"], 1.5, (5, 5)
            else:
                color, ancho, dash = "#3b3580", 2, ()
            cv.create_line(x1, y1, x2, y2, fill=color, width=ancho, dash=dash)
            mx, my = (x1 + x2) / 2, (y1 + y2) / 2
            cv.create_rectangle(mx - 14, my - 9, mx + 14, my + 9, fill="#120f3b", outline=color)
            cv.create_text(mx, my, text=str(w), fill=color if color != "#3b3580" else C["text3"], font=self.app.FM)
        for i, (x, y) in enumerate(nodos):
            relleno = componentes.get(i, C["panel2"])
            borde = C["coral"] if self.algo.get() == "prim" and i == self.ini else "#c9bdff"
            cv.create_oval(x - 17, y - 17, x + 17, y + 17, fill=relleno, outline=borde, width=3 if borde == C["coral"] else 1.5, tags=("nodo", f"v{i}"))
            cv.create_text(x, y, text=self.letra(i), fill="white", font=(self.app.FM[0], 11, "bold"), tags=("nodo", f"v{i}"))

    def ir(self, k):
        pasos = self.res["pasos"]
        self.k = max(0, min(len(pasos), k))
        hechos = pasos[:self.k]
        en_arbol = {p["arista"] for p in hechos if p["aceptada"]}
        fuera = {p["arista"] for p in hechos if not p["aceptada"]}
        actual = hechos[-1]["arista"] if hechos else None
        aristas = {e[0]: e for e in self.g["aristas"]}
        colores = ["#7b5cff", "#2f9bff", "#22c39a", "#e8a33d", "#e05ab0", "#5fbf3f", "#9b5cff", "#d9c23d"]
        componentes = {}
        if self.algo.get() == "kruskal":
            dsu = M.DSU(len(self.g["nodos"]))
            for a in en_arbol:
                dsu.union(aristas[a][1], aristas[a][2])
            grupos = {}
            for v in range(len(self.g["nodos"])):
                grupos.setdefault(dsu.find(v), []).append(v)
            for i, miembros in enumerate(g for g in grupos.values() if len(g) > 1):
                for v in miembros:
                    componentes[v] = colores[i % len(colores)]
        else:
            for v in {self.ini, *[p["nodo"] for p in hechos]}:
                componentes[v] = C["violet"]
        self.dibujar(en_arbol, fuera, actual, componentes)

        self.tv.delete(*self.tv.get_children())
        orden = self.res["ordenadas"] if "ordenadas" in self.res else sorted(self.g["aristas"], key=lambda e: (e[3], e[0]))
        for (id_, a, b, w) in orden:
            estado, tag = "", ""
            if id_ == actual:
                estado, tag = "actual", "cur"
            elif id_ in en_arbol:
                estado, tag = "en árbol", "in"
            elif id_ in fuera:
                estado, tag = "ciclo", "out"
            self.tv.insert("", "end", values=(estado, f"{self.letra(a)}–{self.letra(b)}", w), tags=(tag,))
        total = hechos[-1]["total"] if hechos else 0
        self.total.config(text=f"Peso: {total}   ·   aristas: {len(en_arbol)} / {len(self.g['nodos']) - 1}")

        L = self.letra
        if not hechos:
            t = ("Kruskal revisa las aristas de menor a mayor peso y acepta cada una que no forme un ciclo."
                 if self.algo.get() == "kruskal" else f"Prim empieza en {L(self.ini)} y en cada paso toma la arista más barata que sale del árbol.")
        else:
            p = hechos[-1]
            _, a, b, w = aristas[p["arista"]]
            if self.algo.get() == "kruskal":
                t = (f"Arista {L(a)}–{L(b)} (peso {w}): une dos componentes distintas, se acepta. Peso acumulado: {total}."
                     if p["aceptada"] else f"Arista {L(a)}–{L(b)} (peso {w}): sus extremos ya están conectados, formaría un ciclo y se descarta.")
            else:
                t = f"Se agrega {L(p['nodo'])} mediante {L(a)}–{L(b)} (peso {w}), la más barata de la frontera. Peso acumulado: {total}."
            if self.k == len(pasos):
                otro = M.prim(self.g, self.ini)["total"] if self.algo.get() == "kruskal" else M.kruskal(self.g)["total"]
                t += f"  Listo: peso mínimo {self.res['total']} (el otro algoritmo obtiene {otro})."
        self.narr.config(text=t)

    def alternar(self):
        if self.anim:
            self.pausar()
        else:
            if self.k >= len(self.res["pasos"]):
                self.ir(0)
            self.btn_play.config(text="Pausar")
            self._tick()

    def _tick(self):
        if self.k >= len(self.res["pasos"]):
            self.pausar()
            return
        self.ir(self.k + 1)
        self.anim = self.app.root.after(700, self._tick)

    def pausar(self):
        if self.anim:
            self.app.root.after_cancel(self.anim)
        self.anim = None
        self.btn_play.config(text="Reproducir")

    def _agarrar(self, e):
        cerca = self.cv.find_overlapping(e.x - 2, e.y - 2, e.x + 2, e.y + 2)
        for item in cerca:
            for tag in self.cv.gettags(item):
                if tag.startswith("v"):
                    self.arrastre = int(tag[1:])
                    return

    def _mover(self, e):
        if self.arrastre is None:
            return
        self.g["nodos"][self.arrastre] = [max(20, min(self.ANCHO - 20, e.x)), max(20, min(self.ALTO - 20, e.y))]
        self.ir(self.k)


# --------------------------------------------------------------------------
# Diálogo de búsqueda en Project Gutenberg
# --------------------------------------------------------------------------
class DialogoGutenberg:
    def __init__(self, app):
        if GB is None:
            messagebox.showerror("Huffly", "No se encontró api/gutenberg.py. Descarga el libro desde gutenberg.org y ábrelo con «Abrir .txt…».")
            return
        self.app = app
        self.res = []
        w = self.w = tk.Toplevel(app.root, bg=C["bg"])
        w.title("Buscar en Project Gutenberg")
        w.geometry("820x520")
        w.transient(app.root)
        cont = tarjeta(w)
        cont.pack(fill="both", expand=True, padx=14, pady=14)
        fila = ttk.Frame(cont, style="Card.TFrame")
        fila.pack(fill="x")
        self.q = ttk.Entry(fila, width=40)
        self.q.pack(side="left", fill="x", expand=True)
        self.q.insert(0, "Cervantes")
        self.q.bind("<Return>", lambda e: self.buscar())
        self.idioma = ttk.Combobox(fila, state="readonly", width=12, values=["Todos", "es", "en", "fr", "pt", "it", "de"])
        self.idioma.set("es")
        self.idioma.pack(side="left", padx=8)
        ttk.Button(fila, text="Buscar", style="Accent.TButton", command=self.buscar).pack(side="left")
        marco, self.tv = tabla(cont, ("ID", "Título", "Autor", "Idioma", "Frecuencia"), (60, 330, 220, 60, 80), alto=13)
        self.tv.heading("Frecuencia", text="Descargas")
        marco.pack(fill="both", expand=True, pady=10)
        fila2 = ttk.Frame(cont, style="Card.TFrame")
        fila2.pack(fill="x")
        self.limpiar = tk.BooleanVar(value=False)
        ttk.Checkbutton(fila2, text="Quitar el encabezado y la licencia de Gutenberg", variable=self.limpiar).pack(side="left")
        ttk.Button(fila2, text="Descargar y usar", style="Accent.TButton", command=self.descargar).pack(side="right")
        self.estado = ttk.Label(cont, text="", style="Muted.TLabel")
        self.estado.pack(anchor="w", pady=(8, 0))

    def buscar(self):
        q = self.q.get().strip()
        idioma = "" if self.idioma.get() == "Todos" else self.idioma.get()
        self.estado.config(text="Buscando…")

        def listo(res):
            self.res = res["resultados"]
            self.tv.delete(*self.tv.get_children())
            for b in self.res:
                self.tv.insert("", "end", iid=str(b["id"]), values=(b["id"], seguro(b["titulo"]), seguro(", ".join(b["autores"])),
                                                                    " ".join(b["idiomas"]), miles(b["descargas"])))
            self.estado.config(text=f"{len(self.res)} libros con texto plano. Fuente: {res['fuente']}.")
            self.app.listo("Búsqueda terminada.")
        self.app.en_segundo_plano("Consultando Project Gutenberg…", lambda: GB.buscar(q, idioma), listo)

    def descargar(self):
        sel = self.tv.selection()
        if not sel:
            self.estado.config(text="Selecciona un libro de la lista.")
            return
        libro = next(b for b in self.res if str(b["id"]) == sel[0])
        GB.MAX_BYTES = 200_000_000   # en escritorio no aplica el límite de Vercel

        def trabajo():
            datos, _ = GB.texto(libro["id"])
            if self.limpiar.get():
                texto = datos.decode("utf-8", errors="strict")
                ini = re.search(r"\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG E-?BOOK[^\n]*\n", texto, re.I)
                fin = re.search(r"\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG E-?BOOK", texto, re.I)
                if ini:
                    datos = texto[ini.end():fin.start() if fin else None].strip().encode("utf-8") + b"\n"
            return datos

        def listo(datos):
            nombre = re.sub(r"[^a-z0-9]+", "-", libro["titulo"].lower()).strip("-")[:40] or "libro"
            self.w.destroy()
            self.app.cargar_texto(datos, f"{nombre}-{libro['id']}.txt")
        self.estado.config(text="Descargando…")
        self.app.en_segundo_plano(f"Descargando «{libro['titulo']}»…", trabajo, listo)


def main():
    if sys.platform == "win32":
        try:  # texto nítido en pantallas de alta resolución de Windows
            import ctypes
            ctypes.windll.shcore.SetProcessDpiAwareness(1)
        except Exception:
            pass
    root = tk.Tk()
    App(root)
    root.mainloop()


if __name__ == "__main__":
    main()
