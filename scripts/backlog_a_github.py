"""
backlog_a_github.py — Carga docs/backlog.csv al repositorio y al tablero de GitHub.

Por cada historia de usuario:
  · crea una issue «HU-xx · Título» con la historia, los criterios de aceptación,
    el responsable y la estimación (si ya existe, no la duplica)
  · le pone la etiqueta de su épica y el milestone de su sprint
  · la agrega al tablero de GitHub Projects y llena Status, Priority, Size y Estimate
  · cierra las issues terminadas y reabre las que no lo están

Requisitos (una sola vez):
    1. Instalar GitHub CLI: https://cli.github.com   (Windows: winget install GitHub.cli)
    2. gh auth login
    3. gh auth refresh -s project        ← permiso para editar tableros

Uso, desde la carpeta del proyecto:
    python scripts/backlog_a_github.py --repo brianvazquez999/Tecnica_Voraz_Huffman --estado mitad
    python scripts/backlog_a_github.py --repo brianvazquez999/Tecnica_Voraz_Huffman --estado final
    python scripts/backlog_a_github.py --repo … --simular        ← sólo muestra lo que haría

Opciones:
    --proyecto N     número del tablero (está en su URL: …/projects/N). Si el dueño sólo
                     tiene un tablero, se detecta solo.
    --titulo-tablero "…"   además, le cambia el nombre al tablero.
    --estado         mitad = como quedó al terminar el Sprint 1; final = estado actual.
"""
import argparse
import csv
import json
import os
import subprocess
import sys
import tempfile

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


class Gh:
    """Ejecuta la CLI de GitHub (o sólo imprime los comandos con --simular)."""

    def __init__(self, simular):
        self.simular = simular
        self.contador = 0

    def correr(self, *args, leer=False, json_=False, puede_fallar=False):
        if self.simular and not leer:
            print("  $ gh " + " ".join(a if " " not in a else f'"{a}"' for a in args))
            self.contador += 1
            return {"id": f"SIMULADO_{self.contador}", "url": f"https://github.com/simulado/{self.contador}"} if json_ else f"https://github.com/simulado/issues/{self.contador}"
        r = subprocess.run(["gh", *args], capture_output=True, text=True, encoding="utf-8")
        if r.returncode != 0:
            if puede_fallar:
                return None
            raise SystemExit(f"\nError al ejecutar: gh {' '.join(args)}\n{r.stderr.strip()}")
        salida = r.stdout.strip()
        return json.loads(salida or "null") if json_ else salida


def leer_csv(ruta):
    with open(ruta, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def cuerpo(h, terminado):
    marca = "x" if terminado else " "
    criterios = "\n".join(f"- [{marca}] {c.strip()}" for c in h["criterios"].split("|"))
    return (
        f"**Historia**\n\n{h['historia']}\n\n"
        f"**Criterios de aceptación**\n\n{criterios}\n\n"
        f"**Resultado esperado:** {h['resultado_esperado']}\n\n"
        f"**Responsable:** {h['responsable']}\n\n"
        f"**Estimación:** {h['puntos']} puntos ({h['tamano']}) · **Prioridad:** {h['prioridad']} · "
        f"**{h['sprint']}** · **Épica:** {h['epica']}\n"
    )


def main():
    ap = argparse.ArgumentParser(description="Carga el backlog al repositorio y al tablero de GitHub.")
    ap.add_argument("--repo", required=True, help="usuario/repositorio, por ejemplo brianvazquez999/Tecnica_Voraz_Huffman")
    ap.add_argument("--owner", help="dueño del tablero (por defecto, el dueño del repositorio)")
    ap.add_argument("--proyecto", type=int, help="número del tablero de GitHub Projects")
    ap.add_argument("--estado", choices=["mitad", "final"], default="mitad")
    ap.add_argument("--csv", default=os.path.join(RAIZ, "docs", "backlog.csv"))
    ap.add_argument("--titulo-tablero", help="nuevo nombre para el tablero")
    ap.add_argument("--simular", action="store_true", help="mostrar los comandos sin ejecutarlos")
    a = ap.parse_args()

    owner = a.owner or a.repo.split("/")[0]
    gh = Gh(a.simular)
    historias = leer_csv(a.csv)
    columna = "estado_mitad" if a.estado == "mitad" else "estado_final"
    print(f"\nBacklog: {len(historias)} historias · estado «{a.estado}» · repo {a.repo}\n")

    if not a.simular:
        gh.correr("auth", "status", leer=True)
        gh.correr("repo", "view", a.repo, "--json", "name", leer=True)

    # 1. Etiquetas de épica
    print("1. Etiquetas de épica")
    for etiqueta, color in sorted({(h["etiqueta"], h["color_etiqueta"]) for h in historias}):
        epica = next(h["epica"] for h in historias if h["etiqueta"] == etiqueta)
        gh.correr("label", "create", etiqueta, "--repo", a.repo, "--color", color, "--description", epica, "--force")

    # 2. Milestones por sprint
    print("2. Milestones de sprint")
    existentes = set()
    if not a.simular:
        existentes = {m["title"] for m in gh.correr("api", f"repos/{a.repo}/milestones?state=all&per_page=100", leer=True, json_=True)}
    for sprint in sorted({h["sprint"] for h in historias}):
        if sprint not in existentes:
            objetivo = next(h["objetivo_sprint"] for h in historias if h["sprint"] == sprint)
            gh.correr("api", f"repos/{a.repo}/milestones", "-f", f"title={sprint}", "-f", f"description={objetivo}", json_=True)

    # 3. Issues (una por historia, sin duplicar)
    print("3. Issues")
    actuales = {}
    if not a.simular:
        for i in gh.correr("issue", "list", "--repo", a.repo, "--state", "all", "--limit", "1000",
                           "--json", "number,title,url,state", leer=True, json_=True):
            actuales[i["title"].split(" ")[0]] = i
    urls = {}
    for h in historias:
        titulo = f"{h['id']} · {h['titulo']}"
        terminado = h[columna] == "Done"
        with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as f:
            f.write(cuerpo(h, terminado))
            ruta = f.name
        if h["id"] in actuales:
            # Ya existe: sólo se actualiza el texto (criterios marcados según el estado)
            urls[h["id"]] = actuales[h["id"]]["url"]
            gh.correr("issue", "edit", urls[h["id"]], "--body-file", ruta)
            os.unlink(ruta)
            continue
        base = ["issue", "create", "--repo", a.repo, "--title", titulo, "--body-file", ruta,
                "--label", h["etiqueta"], "--milestone", h["sprint"]]
        url = None
        if h["usuario_github"]:
            url = gh.correr(*base, "--assignee", h["usuario_github"], puede_fallar=True)
            if url is None:
                print(f"   aviso: no se pudo asignar a {h['usuario_github']} (¿es colaborador del repo?); se crea sin asignar")
        if url is None:
            url = gh.correr(*base)
        os.unlink(ruta)
        urls[h["id"]] = url.strip().splitlines()[-1]
        print(f"   creada {titulo}")

    # 4. Tablero de GitHub Projects
    print("4. Tablero")
    numero = a.proyecto
    if numero is None:
        if a.simular:
            numero = 1
        else:
            proyectos = gh.correr("project", "list", "--owner", owner, "--format", "json", leer=True, json_=True)["projects"]
            abiertos = [p for p in proyectos if not p.get("closed")]
            if len(abiertos) != 1:
                lista = "\n".join(f"   {p['number']}: {p['title']}" for p in abiertos) or "   (ninguno)"
                raise SystemExit(f"\n{owner} tiene {len(abiertos)} tableros. Indica cuál con --proyecto N:\n{lista}")
            numero = abiertos[0]["number"]
    if a.titulo_tablero:
        gh.correr("project", "edit", str(numero), "--owner", owner, "--title", a.titulo_tablero)
    if a.simular:
        proyecto_id, campos, en_tablero = "SIMULADO", {}, {}
    else:
        proyecto_id = gh.correr("project", "view", str(numero), "--owner", owner, "--format", "json", leer=True, json_=True)["id"]
        campos = {c["name"]: c for c in gh.correr("project", "field-list", str(numero), "--owner", owner,
                                                  "--format", "json", "--limit", "100", leer=True, json_=True)["fields"]}
        en_tablero = {}
        for item in gh.correr("project", "item-list", str(numero), "--owner", owner, "--format", "json",
                              "--limit", "1000", leer=True, json_=True)["items"]:
            url = (item.get("content") or {}).get("url")
            if url:
                en_tablero[url] = item["id"]

    faltan = [c for c in ("Status", "Priority", "Size", "Estimate") if c not in campos]
    if faltan and not a.simular:
        print(f"   aviso: el tablero no tiene los campos {', '.join(faltan)}; se omiten")

    def opcion(campo, nombre):
        for o in campos[campo].get("options", []):
            if o["name"].lower() == nombre.lower():
                return o["id"]
        print(f"   aviso: el campo {campo} no tiene la opción «{nombre}»")
        return None

    for h in historias:
        url = urls[h["id"]]
        item = en_tablero.get(url)
        if item is None:
            item = gh.correr("project", "item-add", str(numero), "--owner", owner, "--url", url, "--format", "json", json_=True)["id"]
        valores = [("Status", h[columna]), ("Priority", h["prioridad"]), ("Size", h["tamano"])]
        for campo, valor in valores:
            if a.simular or campo in campos:
                oid = "SIMULADO" if a.simular else opcion(campo, valor)
                if oid:
                    gh.correr("project", "item-edit", "--id", item, "--project-id", proyecto_id,
                              "--field-id", "SIMULADO" if a.simular else campos[campo]["id"], "--single-select-option-id", oid)
        if a.simular or "Estimate" in campos:
            gh.correr("project", "item-edit", "--id", item, "--project-id", proyecto_id,
                      "--field-id", "SIMULADO" if a.simular else campos["Estimate"]["id"], "--number", h["puntos"])
        print(f"   {h['id']}: {h[columna]}")

    # 5. Cerrar lo terminado y reabrir lo pendiente
    print("5. Cierre de issues terminadas")
    for h in historias:
        terminado = h[columna] == "Done"
        estado_actual = actuales.get(h["id"], {}).get("state", "OPEN")
        if terminado and estado_actual != "CLOSED":
            gh.correr("issue", "close", urls[h["id"]], "--reason", "completed")
        elif not terminado and estado_actual == "CLOSED":
            gh.correr("issue", "reopen", urls[h["id"]])

    hechos = sum(int(h["puntos"]) for h in historias if h[columna] == "Done")
    total = sum(int(h["puntos"]) for h in historias)
    print(f"\nListo: {len(historias)} historias en el tablero, {hechos} de {total} puntos terminados.")
    if a.simular:
        print("(Simulación: no se cambió nada en GitHub.)")


if __name__ == "__main__":
    main()
