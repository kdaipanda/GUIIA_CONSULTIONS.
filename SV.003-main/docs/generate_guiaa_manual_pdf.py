#!/usr/bin/env python3
"""Genera el manual PDF de funciones del sistema GUIAA."""
from __future__ import annotations

import platform
from datetime import date
from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "GUIAA-Funciones-Sistema.pdf"
LOGO = ROOT.parent / "frontend" / "public" / "GuiaaLogo-full.png"

NAVY = (12, 45, 77)
BLUE = (38, 91, 147)
GREEN = (61, 155, 143)
GRAY = (100, 116, 139)
LIGHT = (241, 245, 249)


def resolve_fonts(pdf: FPDF) -> tuple[str, str]:
    if platform.system() == "Windows":
        fonts_dir = Path("C:/Windows/Fonts")
        regular = fonts_dir / "arial.ttf"
        bold = fonts_dir / "arialbd.ttf"
        if regular.exists() and bold.exists():
            pdf.add_font("Guiaa", "", str(regular))
            pdf.add_font("Guiaa", "B", str(bold))
            return "Guiaa", "Guiaa"
    pdf.set_font("Helvetica", "", 11)
    return "Helvetica", "Helvetica"


class GuiaaManualPDF(FPDF):
    def __init__(self) -> None:
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_auto_page_break(auto=True, margin=18)
        self.regular, self.bold = resolve_fonts(self)
        self._section_num = 0

    def header(self) -> None:
        if self.page_no() == 1:
            return
        self.set_font(self.regular, "", 8)
        self.set_text_color(*GRAY)
        self.cell(0, 6, "GUIAA - Manual de funciones del sistema", align="L")
        self.cell(0, 6, f"Página {self.page_no()}", align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*BLUE)
        self.line(10, 14, 200, 14)
        self.ln(4)

    def footer(self) -> None:
        self.set_y(-12)
        self.set_font(self.regular, "", 8)
        self.set_text_color(*GRAY)
        self.cell(0, 8, "https://guiaa.vet  |  soporte@guiaa.vet", align="C")

    def cover(self) -> None:
        self.add_page()
        if LOGO.exists():
            self.image(str(LOGO), x=55, y=28, w=100)
        self.ln(72)
        self.set_font(self.bold, "B", 26)
        self.set_text_color(*NAVY)
        self.multi_cell(0, 12, "Manual de funciones", align="C")
        self.ln(2)
        self.set_font(self.regular, "", 16)
        self.set_text_color(*BLUE)
        self.multi_cell(0, 9, "Plataforma clínica GUIAA para médicos veterinarios", align="C")
        self.ln(8)
        self.set_font(self.regular, "", 11)
        self.set_text_color(*GRAY)
        self.multi_cell(
            0,
            6,
            "Soporte a la decisión clínica (CDS L4/L5), consultorio integrado, "
            "multiespecie e inventario. Documento orientado a MVZ certificados.",
            align="C",
        )
        self.ln(20)
        self.set_fill_color(*LIGHT)
        self.rect(30, 175, 150, 28, style="F")
        self.set_xy(35, 180)
        self.set_font(self.regular, "", 10)
        self.set_text_color(*NAVY)
        self.multi_cell(
            140,
            5,
            f"Versión del documento: {date.today().strftime('%d/%m/%Y')}\n"
            "Producto: GUIAA (guiaa.vet)\n"
            "Audiencia: médicos veterinarios certificados",
        )

    def section(self, title: str) -> None:
        self._section_num += 1
        self.ln(4)
        self.set_font(self.bold, "B", 14)
        self.set_text_color(*NAVY)
        self.multi_cell(0, 8, f"{self._section_num}. {title}", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*GREEN)
        self.line(10, self.get_y(), 55, self.get_y())
        self.ln(4)

    def sub(self, title: str) -> None:
        self.ln(2)
        self.set_font(self.bold, "B", 11)
        self.set_text_color(*BLUE)
        self.multi_cell(0, 6, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def body(self, text: str) -> None:
        self.set_font(self.regular, "", 10)
        self.set_text_color(30, 41, 59)
        self.multi_cell(0, 5.5, text, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def bullets(self, items: list[str]) -> None:
        self.set_font(self.regular, "", 10)
        self.set_text_color(30, 41, 59)
        for item in items:
            self.multi_cell(0, 5.5, f"  •  {item}", new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def table(self, headers: list[str], rows: list[list[str]], col_widths: list[int]) -> None:
        self.set_font(self.bold, "B", 9)
        self.set_fill_color(*NAVY)
        self.set_text_color(255, 255, 255)
        for header, width in zip(headers, col_widths):
            self.cell(width, 7, header, border=1, fill=True, align="C")
        self.ln()
        self.set_font(self.regular, "", 8)
        self.set_text_color(30, 41, 59)
        fill = False
        for row in rows:
            if fill:
                self.set_fill_color(*LIGHT)
            else:
                self.set_fill_color(255, 255, 255)
            line_height = 6
            x_start = self.get_x()
            y_start = self.get_y()
            max_h = line_height
            cell_lines: list[list[str]] = []
            for text, width in zip(row, col_widths):
                lines = self.multi_cell(width, line_height, text, dry_run=True, output="LINES")
                cell_lines.append(lines)
                max_h = max(max_h, line_height * len(lines))
            if y_start + max_h > 280:
                self.add_page()
                y_start = self.get_y()
            x = x_start
            for lines, width in zip(cell_lines, col_widths):
                self.rect(x, y_start, width, max_h, style="FD" if fill else "D")
                self.set_xy(x + 1, y_start + 1)
                for line in lines:
                    self.cell(width - 2, line_height, line)
                    self.set_xy(x + 1, self.get_y())
                x += width
            self.set_xy(x_start, y_start + max_h)
            fill = not fill
        self.ln(3)


def build_pdf() -> Path:
    pdf = GuiaaManualPDF()
    pdf.cover()
    pdf.add_page()

    pdf.section("Introducción")
    pdf.body(
        "GUIAA es una plataforma web para médicos veterinarios certificados que integra "
        "soporte a la decisión clínica (CDS), expediente, agenda, inventario y ventas "
        "en un solo entorno. El sistema está diseñado para consultorio fijo y visitas "
        "externas desde navegador (tablet o laptop), con verificación de cédula profesional "
        "al registrarse."
    )
    pdf.body(
        "Importante: GUIAA es una herramienta de apoyo clínico. El criterio diagnóstico "
        "y terapéutico final siempre corresponde al médico veterinario responsable."
    )

    pdf.section("Acceso, registro y seguridad")
    pdf.sub("Registro MVZ")
    pdf.bullets([
        "Registro exclusivo para médicos veterinarios con verificación de cédula profesional.",
        "Inicio de sesión con correo y contraseña (autenticación JWT).",
        "Hasta 3 consultas de prueba sin membresía activa (periodo trial).",
        "Perfil del MVZ: datos personales, membresía, consultas restantes y configuración.",
    ])
    pdf.sub("Seguridad HTTP y datos")
    pdf.bullets([
        "Comunicación cifrada HTTPS entre navegador, API (api.guiaa.vet) y Supabase.",
        "Cabeceras de seguridad: HSTS, CSP, X-Frame-Options, Permissions-Policy.",
        "Sesiones con token Bearer; rutas clínicas protegidas por plan de membresía.",
        "Controles de acceso por cuenta profesional en expedientes y consultas.",
    ])

    pdf.section("GUIAA Diagnóstico (CDS)")
    pdf.body(
        "Módulo central de consulta clínica con flujo estructurado en tres pasos: "
        "Datos del paciente, Motivo de consulta y Diagnóstico / plan terapéutico."
    )
    pdf.sub("Flujo clínico en 6 etapas")
    pdf.bullets([
        "Paciente y especie: dueño, raza, peso, antecedentes por categoría veterinaria.",
        "Anamnesis: motivo de consulta y signos referidos con campos adaptados.",
        "Examen físico: hallazgos clínicos en secuencia documentada.",
        "Razonamiento CDS: hipótesis con soporte L4 (estructuración) y L5 (planes basados en evidencia).",
        "Plan terapéutico: tratamiento, seguimiento y recomendaciones al propietario.",
        "Expediente: historia longitudinal disponible en la siguiente visita.",
    ])
    pdf.sub("Funciones de consulta")
    pdf.bullets([
        "Formularios específicos por especie (11 categorías multiespecie).",
        "Parámetros vitales, laboratorio, ambiente/manejo y notas adicionales.",
        "Exportación PDF de la consulta completa.",
        "Historial de consultas con búsqueda y reapertura de casos.",
        "Vinculación con paciente, dueño y cita de agenda.",
        "Paleta de comandos rápida: Ctrl+K (Cmd+K en Mac) para navegar módulos.",
    ])

    pdf.section("Especies soportadas")
    species = [
        "Perros", "Gatos", "Conejos", "Aves", "Hámsters", "Cuyos",
        "Hurones", "Erizos", "Tortugas", "Iguanas", "Patos y Pollos",
    ]
    pdf.body(
        "Cada especie activa un formulario veterinario dedicado. "
        "El plan Básica limita consultas a perros y gatos; "
        "Profesional y Premium habilitan las 11 categorías."
    )
    pdf.bullets(species)

    pdf.section("Consultorio integrado")
    modules = [
        ("Dashboard", "Resumen operativo: citas del día, ingresos, consultas CDS, stock bajo y accesos rápidos."),
        ("Dueños (Clientes)", "Registro de tutores, contactos y vínculo con mascotas, consultas y ventas."),
        ("Mascotas (Pacientes)", "Expediente por paciente, antecedentes e inicio de consulta desde la ficha."),
        ("Agenda", "Citas programadas, estados y solicitudes de cita en línea desde portal público."),
        ("Historial", "Listado completo de consultas CDS anteriores con reapertura y calificación."),
        ("Configuración", "Datos del consultorio, equipo y preferencias (roles owner/admin)."),
    ]
    for name, desc in modules:
        pdf.sub(name)
        pdf.body(desc)

    pdf.section("Inventario, ventas y reportes")
    pdf.body("Disponibles en membresía Profesional y Premium (no incluidos en plan Básica).")
    pdf.sub("Inventario")
    pdf.bullets([
        "Catálogo de productos, insumos y medicamentos.",
        "Control de stock con alertas de stock bajo.",
        "Movimientos de entrada/salida y valor de inventario.",
        "Descuento automático de stock al emitir ventas (opcional).",
    ])
    pdf.sub("Ventas (facturación clínica)")
    pdf.bullets([
        "Recibos y cobros clínicos vinculados a dueño y paciente.",
        "Líneas de producto del inventario o servicios libres.",
        "Sin emisión de CFDI fiscal (recibos clínicos internos).",
        "Métodos de pago y notas por recibo.",
    ])
    pdf.sub("Reportes")
    pdf.bullets([
        "KPIs del consultorio por periodo (consultas, ingresos, ventas).",
        "Productos más vendidos y movimientos de inventario.",
        "Indicadores de actividad clínica del equipo.",
    ])

    pdf.section("Funciones Premium")
    pdf.body("Exclusivas del plan Premium.")
    pdf.sub("Manejo Experto")
    pdf.body(
        "Consulta acelerada: el MVZ describe el caso clínico primero (motivo y observaciones) "
        "y completa los datos de la mascota después. Ideal para urgencias o visitas externas."
    )
    pdf.sub("Onboarding guiado prioritario")
    pdf.body(
        "Acompañamiento preferente al activar la cuenta Premium para dominar la plataforma "
        "desde la primera consulta."
    )

    pdf.section("Herramientas y soporte")
    pdf.sub("Herramientas clínicas")
    pdf.bullets([
        "Calculadora de dosis (peso, mg/kg, concentración).",
        "Enlaces a referencias: Plumb's, Merck Veterinary Manual, VIN.",
    ])
    pdf.sub("Onboarding y soporte")
    pdf.bullets([
        "Recorrido guiado al primer acceso (Dashboard, diagnóstico, agenda, inventario).",
        "Chat de soporte integrado para dudas de la plataforma.",
        "Tickets de soporte con historial (prioridad normal/alta).",
    ])

    pdf.section("Membresías y planes")
    pdf.body(
        "Facturación mensual o anual (+ IVA). Precios en pesos mexicanos (MXN). "
        "Recarga opcional: 10 consultas extra por $350 MXN sin cambiar de plan."
    )
    pdf.table(
        ["Plan", "Precio/mes", "Consultas", "Alcance principal"],
        [
            ["Básica", "$950", "30/mes (300/año)", "Perros y gatos + CDS core"],
            ["Profesional", "$1,250", "35/mes (350/año)", "Multiespecie + inventario + ventas + reportes"],
            ["Premium", "$2,200", "150/mes (1500/año)", "Todo Profesional + Manejo Experto + onboarding prioritario"],
        ],
        [28, 28, 38, 86],
    )

    pdf.sub("Matriz de acceso por plan")
    pdf.table(
        ["Función", "Básica", "Profesional", "Premium", "Trial"],
        [
            ["CDS, expediente, agenda, panel, PDF", "Sí", "Sí", "Sí", "Sí"],
            ["Multiespecie (11 categorías)", "No", "Sí", "Sí", "Sí"],
            ["Inventario", "No", "Sí", "Sí", "Sí"],
            ["Ventas / recibos", "No", "Sí", "Sí", "Sí"],
            ["Reportes clínicos", "No", "Sí", "Sí", "Sí"],
            ["Manejo Experto", "No", "No", "Sí", "No"],
            ["Onboarding prioritario", "No", "No", "Sí", "No"],
        ],
        [52, 18, 28, 22, 60],
    )
    pdf.body("* Trial: hasta 3 consultas de prueba sin membresía; acceso multiespecie limitado al periodo de prueba.")

    pdf.sub("Funciones incluidas en todos los planes pagados")
    pdf.bullets([
        "GUIAA Diagnóstico con soporte CDS L4 / L5.",
        "Expediente e historial clínico.",
        "Clientes, pacientes y agenda.",
        "Panel clínico con métricas de consulta.",
        "Exportación PDF de consultas.",
    ])

    pdf.section("Administración de plataforma")
    pdf.body(
        "Rol reservado a administradores GUIAA: gestión de usuarios, revisión de cédulas, "
        "estadísticas globales, tickets de soporte y organizaciones."
    )

    pdf.section("Contacto")
    pdf.bullets([
        "Sitio web: https://guiaa.vet",
        "API: https://api.guiaa.vet",
        "Soporte: soporte@guiaa.vet",
        "Registro MVZ: https://guiaa.vet/registro",
    ])

    pdf.output(str(OUTPUT))
    return OUTPUT


if __name__ == "__main__":
    path = build_pdf()
    print(f"PDF generado: {path}")
