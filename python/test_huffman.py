"""
test_huffman.py — Pruebas de la versión en Python.

Ejecutar desde la carpeta python/: 
    python -m unittest -v test_huffman

Incluye la prueba cruzada: los archivos de tests/fixtures/*.hfz fueron
creados por la versión web (JavaScript) y deben abrirse aquí, y Python debe
generar exactamente los mismos bytes.
"""
import os
import random
import unittest
 
import huffman as H

FIXTURES = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "tests", "fixtures")
FECHA = 1767225600  # misma fecha fija que usa tests/huffman.test.js


def ida_y_vuelta(prueba, datos, **kw):
    archivo, a = H.comprimir(datos, "x.txt", **kw)
    recuperado, cab, ok = H.descomprimir(archivo)
    prueba.assertTrue(ok, "CRC distinto")
    prueba.assertEqual(recuperado, datos)
    return archivo, a, cab


class PruebasHuffman(unittest.TestCase):
    def test_pizarron(self):
        a = H.analizar(b"abbacabbcd")
        c = a["codigos"]
        self.assertEqual(a["modo"], "byte")
        self.assertEqual([c[ord("b")], c[ord("a")], c[ord("d")], c[ord("c")]], ["0", "10", "110", "111"])
        self.assertEqual(a["bits"], 19)
        self.assertEqual(len(a["pasos"]), 3)

    def test_modo_caracter(self):
        a = H.analizar("¿Año? ñandú 🙂".encode("utf-8"))
        self.assertEqual(a["modo"], "char")
        self.assertEqual(a["total"], 13)

    def test_latin1_cae_a_byte(self):
        _, a, _ = ida_y_vuelta(self, bytes([0x41, 0xF1, 0x6F, 0x20, 0xE9, 0x0A]))
        self.assertEqual(a["modo"], "byte")

    def test_bom_crlf_emoji(self):
        datos = b"\xef\xbb\xbf" + "Había una vez…\r\n\tñandú 🙂 «fin»\n".encode("utf-8")
        _, a, _ = ida_y_vuelta(self, datos)
        self.assertEqual(a["modo"], "char")

    def test_vacio_y_unico(self):
        ida_y_vuelta(self, b"")
        _, a, _ = ida_y_vuelta(self, b"a" * 12)
        self.assertEqual(a["bits"], 12)

    def test_aleatorios(self):
        rnd = random.Random(7)
        for _ in range(200):
            k = rnd.randint(1, 255)
            datos = bytes(int(rnd.random() ** 2 * k) for _ in range(rnd.randint(0, 1500)))
            ida_y_vuelta(self, datos)

    def test_codigos_largos(self):
        datos = bytearray()
        for b in range(256):
            datos += bytes([b]) * (2 ** b if b < 18 else 1)
        ida_y_vuelta(self, bytes(datos))

    def test_danado(self):
        archivo, a = H.comprimir(b"hola mundo, hola huffman", "h.txt")
        malo = bytearray(archivo)
        malo[a["tam_cabecera"]] ^= 0x80          # un bit de datos real
        try:
            _, _, ok = H.descomprimir(bytes(malo))
            detectado = not ok
        except ValueError:
            detectado = True
        self.assertTrue(detectado)
        with self.assertRaises(ValueError):
            H.leer_cabecera(b"esto no es un archivo hfz de verdad")
        with self.assertRaises(ValueError):
            H.leer_cabecera(archivo[:-1])


class PruebaCruzada(unittest.TestCase):
    """Python debe leer los .hfz del navegador y producir los mismos bytes."""

    def test_fixtures_de_javascript(self):
        nombres = [n for n in os.listdir(FIXTURES) if n.endswith(".txt")]
        self.assertTrue(nombres, "Faltan los archivos de tests/fixtures")
        for nombre in nombres:
            with open(os.path.join(FIXTURES, nombre), "rb") as f:
                original = f.read()
            with open(os.path.join(FIXTURES, nombre[:-4] + ".hfz"), "rb") as f:
                hfz_js = f.read()
            recuperado, cab, ok = H.descomprimir(hfz_js)
            self.assertTrue(ok, nombre)
            self.assertEqual(recuperado, original, nombre)
            self.assertEqual(cab["codificador"], 1)
            hfz_py, _ = H.comprimir(original, nombre, codificador=1, fecha=FECHA)
            self.assertEqual(hfz_py, hfz_js, f"{nombre}: Python y JavaScript generaron bytes distintos")


if __name__ == "__main__":
    unittest.main(verbosity=2)
