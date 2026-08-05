#!/usr/bin/env python3
"""Genera todos los PDFs del kit de visitas clínicas (fpdf2, sin Chrome).

Uso:
  cd SV.003-main/field-kit/clinic-visits
  python3 scripts/build_pdfs.py
"""
from __future__ import annotations

import csv
import re
import subprocess
import sys
from pathlib import Path

from fpdf import FPDF
from pypdf import PdfWriter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "pdf"

NAVY = (12, 45, 77)
BLUE = (38, 91, 147)
GREEN = (61, 155, 143)
MUTED = (90, 111, 130)
LIGHT = (244, 248, 251)


class KitPDF(FPDF):
    def __init__(self, title: str = ""):
        super().__init__(format="A4")
        self.doc_title = title
        self.set_auto_page_break(auto=True, margin=18)
        self.set_margins(16, 16, 16)

    def header(self):
        if self.page_no() == 1 and not self.doc_title:
            return
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*NAVY)
        self.cell(0, 6, "GUIAA  |  Kit visitas clinicas", ln=1)
        if self.doc_title:
            self.set_font("Helvetica", "", 9)
            self.set_text_color(*MUTED)
            self.cell(0, 5, self._latin(self.doc_title), ln=1)
        self.set_draw_color(*NAVY)
        self.set_line_width(0.6)
        self.line(16, self.get_y() + 1, 194, self.get_y() + 1)
        self.ln(6)

    def footer(self):
        self.set_y(-14)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 8, f"guiaa.vet  ·  p. {self.page_no()}", align="C")

    @staticmethod
    def _latin(text: str) -> str:
        # fpdf core fonts: keep latin-1 friendly
        replacements = {
            "—": "-",
            "–": "-",
            "→": "->",
            "×": "x",
            "≤": "<=",
            "≥": ">=",
            "“": '"',
            "”": '"',
            "‘": "'",
            "’": "'",
            "…": "...",
            "·": "-",
            "✅": "[OK]",
            "☐": "[ ]",
            "✓": "[OK]",
        }
        for a, b in replacements.items():
            text = text.replace(a, b)
        return text.encode("latin-1", "replace").decode("latin-1")

    def body(self, text: str):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*NAVY)
        self.multi_cell(0, 5.5, self._latin(text))
        self.ln(1)

    def bullet(self, text: str):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(*NAVY)
        # strip checkbox markdown
        clean = text.replace("[ ]", "").replace("[x]", "").replace("[X]", "").strip()
        self.multi_cell(0, 5.5, self._latin(f"- {clean}"))

    def quote(self, text: str):
        self.set_x(self.l_margin)
        self.set_fill_color(*LIGHT)
        self.set_font("Helvetica", "I", 10)
        self.set_text_color(*NAVY)
        self.multi_cell(0, 5.5, self._latin(text), fill=True)
        self.ln(2)

    def code_block(self, text: str):
        self.set_x(self.l_margin)
        self.set_fill_color(*LIGHT)
        self.set_font("Courier", "", 8)
        self.set_text_color(*NAVY)
        self.multi_cell(0, 4.5, self._latin(text), fill=True)
        self.ln(2)

    def h1(self, text: str):
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(*NAVY)
        self.multi_cell(0, 8, self._latin(text))
        self.ln(2)

    def h2(self, text: str):
        self.ln(2)
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(*BLUE)
        self.multi_cell(0, 7, self._latin(text))
        self.ln(1)

    def h3(self, text: str):
        self.ln(1)
        self.set_x(self.l_margin)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*GREEN)
        self.multi_cell(0, 6, self._latin(text))


def parse_md_to_pdf(md_path: Path, pdf_path: Path, title: str) -> None:
    pdf = KitPDF(title=title)
    pdf.add_page()
    pdf.h1(title)

    lines = md_path.read_text(encoding="utf-8").splitlines()
    in_code = False
    code_buf: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.strip().startswith("```"):
            if in_code:
                pdf.code_block("\n".join(code_buf))
                code_buf = []
                in_code = False
            else:
                in_code = True
            i += 1
            continue
        if in_code:
            code_buf.append(line)
            i += 1
            continue

        # skip first H1 if duplicates title
        if line.startswith("# ") and i < 3:
            i += 1
            continue
        if line.startswith("## "):
            pdf.h2(line[3:].strip())
        elif line.startswith("### "):
            pdf.h3(line[4:].strip())
        elif line.startswith("> "):
            quote_lines = [line[2:]]
            i += 1
            while i < len(lines) and lines[i].startswith("> "):
                quote_lines.append(lines[i][2:])
                i += 1
            pdf.quote("\n".join(quote_lines))
            continue
        elif re.match(r"^[-*] \[[ xX]\] ", line):
            pdf.bullet(line[2:].strip())
        elif re.match(r"^[-*] ", line):
            pdf.bullet(line[2:].strip())
        elif re.match(r"^\d+\. ", line):
            pdf.body(line.strip())
        elif line.strip().startswith("|") and "|" in line[1:]:
            # collect table
            table_lines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_lines.append(lines[i])
                i += 1
            render_md_table(pdf, table_lines)
            continue
        elif line.strip() == "---":
            pdf.ln(2)
        elif line.strip():
            # strip markdown bold/links lightly
            text = re.sub(r"\*\*(.+?)\*\*", r"\1", line)
            text = re.sub(r"`(.+?)`", r"\1", text)
            text = re.sub(r"\[(.+?)\]\(.+?\)", r"\1", text)
            pdf.body(text)
        else:
            pdf.ln(1)
        i += 1

    pdf.output(str(pdf_path))


def render_md_table(pdf: KitPDF, table_lines: list[str]) -> None:
    rows = []
    for line in table_lines:
        if re.match(r"^\|\s*-+", line):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        rows.append(cells)
    if not rows:
        return
    cols = max(len(r) for r in rows)
    usable = 178
    col_w = usable / cols
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_fill_color(238, 244, 249)
    pdf.set_text_color(*NAVY)
    pdf.set_x(pdf.l_margin)
    for cell in rows[0] + [""] * (cols - len(rows[0])):
        pdf.cell(col_w, 6, pdf._latin(cell)[:40], border=1, fill=True)
    pdf.ln()
    pdf.set_font("Helvetica", "", 8)
    for row in rows[1:]:
        y0 = pdf.get_y()
        if y0 > 270:
            pdf.add_page()
        pdf.set_x(pdf.l_margin)
        for cell in row + [""] * (cols - len(row)):
            pdf.cell(col_w, 6, pdf._latin(cell)[:40], border=1)
        pdf.ln()
    pdf.set_x(pdf.l_margin)
    pdf.ln(2)


def csv_to_pdf(csv_path: Path, pdf_path: Path, title: str) -> None:
    pdf = KitPDF(title=title)
    pdf.add_page()
    pdf.h1(title)
    pdf.body("Plantilla imprimible. Completa a mano o digitaliza al final del dia.")

    with csv_path.open(encoding="utf-8", newline="") as fh:
        rows = list(csv.reader(fh))
    if not rows:
        pdf.output(str(pdf_path))
        return

    header = rows[0]
    data = rows[1:]
    while len(data) < 14:
        data.append([""] * len(header))

    # Landscape-ish narrow cols on portrait: use smaller font, wrap header
    usable = 178
    col_w = usable / len(header)
    pdf.set_font("Helvetica", "B", 7)
    pdf.set_fill_color(238, 244, 249)
    for h in header:
        pdf.cell(col_w, 8, pdf._latin(h)[:18], border=1, fill=True, align="C")
    pdf.ln()
    pdf.set_font("Helvetica", "", 7)
    for row in data:
        if pdf.get_y() > 275:
            pdf.add_page()
            pdf.set_font("Helvetica", "B", 7)
            for h in header:
                pdf.cell(col_w, 8, pdf._latin(h)[:18], border=1, fill=True, align="C")
            pdf.ln()
            pdf.set_font("Helvetica", "", 7)
        for i, h in enumerate(header):
            val = row[i] if i < len(row) else ""
            pdf.cell(col_w, 9, pdf._latin(val)[:18], border=1)
        pdf.ln()
    pdf.output(str(pdf_path))


def one_pager_pdf(pdf_path: Path) -> None:
    pdf = FPDF(format="A4")
    pdf.set_auto_page_break(False)
    pdf.add_page()
    pdf.set_fill_color(*NAVY)
    pdf.rect(0, 0, 210, 28, "F")
    pdf.set_xy(14, 8)
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(100, 12, "GUIAA")
    pdf.set_font("Helvetica", "", 10)
    pdf.set_xy(14, 18)
    pdf.cell(120, 6, "Software clinico para medicos veterinarios")

    qr = ROOT / "qr" / "generated" / "register.png"
    if qr.exists():
        pdf.image(str(qr), x=168, y=6, w=28, h=28)

    pdf.set_xy(14, 36)
    pdf.set_text_color(*NAVY)
    pdf.set_font("Helvetica", "B", 15)
    pdf.multi_cell(140, 7, "Consulta mas clara. Historial en orden. Apoyo clinico cuando lo necesitas.")

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*MUTED)
    pdf.set_x(14)
    pdf.multi_cell(
        150,
        5.5,
        "GUIAA ayuda a MVZ en Latinoamerica a documentar consultas multiespecie, "
        "organizar pacientes y agenda, y usar apoyo a la decision clinica (CDS) "
        "sin perder el criterio profesional.",
    )

    boxes = [
        ("Consulta multiespecie", "Flujo para la practica real, no solo perro y gato."),
        ("Apoyo a la decision", "Sugerencias clinicas; decide el veterinario."),
        ("Clinica en un lugar", "Pacientes, citas, inventario y ventas segun plan."),
        ("Hecho para LATAM", "Espanol claro, tono profesional, listo para consultorio."),
    ]
    y = 78
    for i, (t, d) in enumerate(boxes):
        x = 14 if i % 2 == 0 else 108
        if i % 2 == 0 and i > 0:
            y += 32
        pdf.set_fill_color(*LIGHT)
        pdf.set_draw_color(*GREEN)
        pdf.rect(x, y, 88, 28, "DF")
        pdf.set_xy(x + 3, y + 3)
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(*BLUE)
        pdf.cell(80, 6, t)
        pdf.set_xy(x + 3, y + 11)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(*NAVY)
        pdf.multi_cell(82, 5, d)

    pdf.set_fill_color(*NAVY)
    pdf.rect(14, 150, 182, 28, "F")
    pdf.set_xy(18, 155)
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(120, 7, "Prueba gratis: 3 consultas")
    pdf.set_xy(18, 163)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(120, 6, "Registrate en guiaa.vet y pruebalo con casos reales.")
    pdf.set_fill_color(*GREEN)
    pdf.set_xy(150, 157)
    pdf.set_text_color(*NAVY)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(40, 12, "guiaa.vet", align="C", fill=True)

    pdf.set_xy(14, 188)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(*BLUE)
    pdf.cell(0, 7, "Como empezar hoy", ln=1)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*NAVY)
    for n, step in enumerate(
        [
            "Escanea el QR o entra a guiaa.vet",
            "Crea tu cuenta de veterinario",
            "Completa tu primera consulta de prueba",
            "Si te sirve, elige el plan de tu consultorio",
        ],
        1,
    ):
        pdf.cell(0, 6, f"{n}. {step}", ln=1)

    pdf.set_y(255)
    pdf.set_draw_color(*MUTED)
    pdf.line(14, 254, 196, 254)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*MUTED)
    pdf.set_xy(14, 257)
    pdf.cell(90, 5, "Preciso · Confiable · Humano")
    pdf.cell(90, 5, "Campana visitas clinicas · guiaa.vet", align="R")
    pdf.output(str(pdf_path))


def leave_behind_pdf(pdf_path: Path) -> None:
    pdf = FPDF(format="A4")
    pdf.set_auto_page_break(False)
    pdf.add_page()
    qr = ROOT / "qr" / "generated" / "register.png"
    # 4 cards 2x2
    positions = [(14, 20), (110, 20), (14, 90), (110, 90)]
    for x, y in positions:
        pdf.set_fill_color(*NAVY)
        pdf.rect(x, y, 86, 55, "F")
        pdf.set_xy(x + 5, y + 6)
        pdf.set_font("Helvetica", "B", 16)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(50, 8, "GUIAA")
        pdf.set_xy(x + 5, y + 16)
        pdf.set_font("Helvetica", "", 9)
        pdf.multi_cell(48, 4.5, "Software clinico veterinario.\n3 consultas de prueba gratis.")
        pdf.set_fill_color(*GREEN)
        pdf.set_xy(x + 5, y + 38)
        pdf.set_text_color(*NAVY)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(28, 7, "guiaa.vet", fill=True, align="C")
        if qr.exists():
            pdf.image(str(qr), x=x + 56, y=y + 12, w=24, h=24)
    pdf.set_xy(14, 160)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*MUTED)
    pdf.multi_cell(0, 5, "Recorta las 4 tarjetas. Imprime a color. QR = registro con UTM clinic_visit.")
    pdf.output(str(pdf_path))


DOCS = [
    ("00-indice-kit", ROOT / "README.md", "Indice del kit"),
    ("01-playbook-del-dia", ROOT / "PLAYBOOK.md", "Playbook del dia"),
    ("02-checklist-fisico", ROOT / "checklist-fisico.md", "Checklist fisico"),
    ("03-pitch-90-segundos", ROOT / "scripts" / "pitch-90s.md", "Pitch 90 segundos"),
    ("04-pitch-3-minutos", ROOT / "scripts" / "pitch-3min.md", "Pitch 3 minutos"),
    ("05-discovery", ROOT / "scripts" / "discovery-questions.md", "Preguntas discovery"),
    ("06-objeciones", ROOT / "scripts" / "objections.md", "Objeciones"),
    ("07-demo-tablet", ROOT / "scripts" / "demo-checklist.md", "Demo tablet"),
    ("08-followup-whatsapp", ROOT / "scripts" / "whatsapp-followup.md", "Follow-up WhatsApp"),
    ("09-icp-clinicas", ROOT / "territory" / "icp-clinics.md", "ICP clinicas"),
    ("10-qr-y-utms", ROOT / "qr" / "urls.md", "QR y UTMs"),
    ("11-compliance-mx", ROOT / "compliance" / "mx-claims.md", "Compliance MX"),
]


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    qr = ROOT / "qr" / "generated" / "register.png"
    if not qr.exists():
        subprocess.check_call([sys.executable, str(ROOT / "scripts" / "generate_qr.py")])

    generated: list[Path] = []
    for slug, path, title in DOCS:
        out = OUT / f"{slug}.pdf"
        parse_md_to_pdf(path, out, title)
        generated.append(out)
        print(f"OK {out.name}")

    one = OUT / "12-one-pager-imprimible.pdf"
    one_pager_pdf(one)
    generated.append(one)
    print(f"OK {one.name}")

    card = OUT / "13-tarjeta-leave-behind.pdf"
    leave_behind_pdf(card)
    generated.append(card)
    print(f"OK {card.name}")

    for slug, path, title in [
        ("14-plantilla-ruta", ROOT / "territory" / "route-template.csv", "Plantilla de ruta"),
        ("15-bitacora-visitas", ROOT / "territory" / "visit-log.csv", "Bitacora de visitas"),
    ]:
        out = OUT / f"{slug}.pdf"
        csv_to_pdf(path, out, title)
        generated.append(out)
        print(f"OK {out.name}")

    master = OUT / "GUIAA-kit-visitas-clinicas-COMPLETO.pdf"
    writer = PdfWriter()
    for pdf in generated:
        writer.append(str(pdf))
    with master.open("wb") as fh:
        writer.write(fh)
    print(f"\nMaster: {master} ({master.stat().st_size // 1024} KB)")
    print(f"Total: {len(generated) + 1} PDFs en {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
