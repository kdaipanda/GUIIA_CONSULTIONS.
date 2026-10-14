import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import i18n from "../i18n";
import { cleanClinicalDisplayText } from "./consultationPdf";
import {
  PDF_BRAND_COLOR,
  PDF_LINE_COLOR,
  PDF_MUTED_COLOR,
  drawPdfBrandHeader,
  embedGuiaaLogo,
  measurePdfLogo,
} from "./pdfLogo";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;
const FOOTER_SAFE = 42;
const INK = rgb(0.11, 0.16, 0.22);
const LABEL = rgb(0.28, 0.36, 0.46);
const CARD = rgb(0.95, 0.97, 0.99);

const SPECIES = {
  perros: "Perro",
  gatos: "Gato",
  conejos: "Conejo",
  aves: "Ave",
  hamsters: "Hamster",
  cuyos: "Cuyo",
  hurones: "Huron",
  erizos: "Erizo",
  tortugas: "Tortuga",
  iguanas: "Iguana",
  patos_pollos: "Patos y pollos",
};

function pdfT(key, options) {
  return i18n.t(key, { ns: "pdf", ...options });
}

function pdfSafe(text) {
  return String(text ?? "")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2022/g, "-")
    .replace(/[^\n\r\t\x20-\xFF]/g, "");
}

function formatDate(value) {
  if (!value) return "";
  try {
    const locale = i18n.language?.startsWith("en") ? "en-US" : "es-MX";
    return new Date(value).toLocaleString(locale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function wrapText(text, font, fontSize, maxWidth) {
  const paragraphs = pdfSafe(text).split(/\r?\n/);
  const lines = [];
  paragraphs.forEach((paragraph, index) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      if (index < paragraphs.length - 1) lines.push("");
      return;
    }
    let current = words[0];
    for (let i = 1; i < words.length; i += 1) {
      const candidate = `${current} ${words[i]}`;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = words[i];
      }
    }
    lines.push(current);
  });
  return lines.length ? lines : [""];
}

function isHeading(line) {
  const clean = line.replace(/^#+\s*/, "").replace(/\*/g, "").trim();
  if (!clean || clean.length > 72) return false;
  if (/^#{1,3}\s/.test(line)) return true;
  return /^(resumen ejecutivo|recomendaciones|pronostico|pronóstico|señales de alerta|senales de alerta)/i.test(
    clean,
  );
}

function plainAnalysis(text) {
  return cleanClinicalDisplayText(text)
    .replace(/\*\*/g, "")
    .replace(/^---+$/gm, "")
    .trim();
}

function fieldLabel(key, labels) {
  if (labels[key]) return labels[key];
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function usefulFormRows(formData, labels) {
  const skip = new Set([
    "nombre_mascota",
    "nombre_dueño",
    "especie",
    "raza",
    "sexo",
    "edad",
    "peso",
    "detalle_paciente",
    "motivo_consulta",
    "fecha",
  ]);
  const rows = [];
  Object.entries(formData || {}).forEach(([key, value]) => {
    if (skip.has(key) || value == null) return;
    const text = String(value).trim();
    if (!text || text.toUpperCase() === "NO") return;
    rows.push({ label: fieldLabel(key, labels), value: text });
  });
  return rows.slice(0, 24);
}

class OwnerPdf {
  constructor(pdfDoc, fonts, logoImage) {
    this.pdfDoc = pdfDoc;
    this.fonts = fonts;
    this.logoImage = logoImage;
    this.page = null;
    this.y = 0;
    this.first = true;
    this.newPage();
  }

  newPage() {
    this.page = this.pdfDoc.addPage([PAGE.width, PAGE.height]);
    if (this.first) {
      this.y = PAGE.height - 36;
      this.y = drawPdfBrandHeader(this.page, this.fonts, this.y, this.logoImage, {
        pageWidth: PAGE.width,
        margin: MARGIN,
        subtitle: pdfT("ownerConsulta.subtitle"),
      });
      this.first = false;
      return;
    }
    const { width: logoW, height: logoH } = measurePdfLogo(this.logoImage, {
      maxHeight: 22,
      maxWidth: 110,
    });
    const top = PAGE.height - 28;
    if (this.logoImage) {
      this.page.drawImage(this.logoImage, {
        x: MARGIN,
        y: top - logoH,
        width: logoW,
        height: logoH,
      });
    }
    const title = "GUIAA Consulta";
    const titleW = this.fonts.bold.widthOfTextAtSize(title, 11);
    this.page.drawText(title, {
      x: PAGE.width - MARGIN - titleW,
      y: top - 14,
      size: 11,
      font: this.fonts.bold,
      color: PDF_BRAND_COLOR,
    });
    const lineY = top - logoH - 8;
    this.page.drawLine({
      start: { x: MARGIN, y: lineY },
      end: { x: PAGE.width - MARGIN, y: lineY },
      thickness: 0.8,
      color: PDF_LINE_COLOR,
    });
    this.y = lineY - 18;
  }

  ensure(height) {
    if (this.y - height >= FOOTER_SAFE) return;
    this.newPage();
  }

  title(text) {
    this.ensure(32);
    this.y -= 6;
    this.page.drawText(pdfSafe(text), {
      x: MARGIN,
      y: this.y,
      size: 13,
      font: this.fonts.bold,
      color: PDF_BRAND_COLOR,
    });
    this.y -= 8;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE.width - MARGIN, y: this.y },
      thickness: 1,
      color: PDF_LINE_COLOR,
    });
    this.y -= 16;
  }

  paragraph(text, { size = 10.5, indent = 0, color = INK, gap = 4 } = {}) {
    const lines = wrapText(text, this.fonts.regular, size, CONTENT_WIDTH - indent);
    const lineHeight = size + 4;
    lines.forEach((line) => {
      this.ensure(lineHeight);
      if (line) {
        this.page.drawText(line, {
          x: MARGIN + indent,
          y: this.y,
          size,
          font: this.fonts.regular,
          color,
        });
      }
      this.y -= line ? lineHeight : 6;
    });
    this.y -= gap;
  }

  pairRow(leftLabel, leftValue, rightLabel, rightValue) {
    const size = 10;
    const col = CONTENT_WIDTH / 2;
    const rowH = 16;
    this.ensure(rowH + 2);
    const draw = (label, value, x) => {
      const labelText = `${pdfSafe(label)}  `;
      this.page.drawText(labelText, {
        x,
        y: this.y,
        size,
        font: this.fonts.bold,
        color: LABEL,
      });
      const offset = this.fonts.bold.widthOfTextAtSize(labelText, size);
      const max = col - offset - 12;
      const valueText = wrapText(value || "—", this.fonts.regular, size, max)[0] || "—";
      this.page.drawText(valueText, {
        x: x + offset,
        y: this.y,
        size,
        font: this.fonts.regular,
        color: INK,
      });
    };
    draw(leftLabel, leftValue, MARGIN);
    if (rightLabel) {
      draw(rightLabel, rightValue, MARGIN + col);
    }
    this.y -= rowH;
  }

  keyValue(label, value) {
    const size = 10;
    const labelText = pdfSafe(label);
    const labelW = Math.min(150, this.fonts.bold.widthOfTextAtSize(labelText, size) + 8);
    const lines = wrapText(value, this.fonts.regular, size, CONTENT_WIDTH - labelW);
    const lineHeight = size + 3.5;
    this.ensure(lines.length * lineHeight + 4);
    lines.forEach((line, index) => {
      if (index === 0) {
        this.page.drawText(labelText, {
          x: MARGIN,
          y: this.y,
          size,
          font: this.fonts.bold,
          color: LABEL,
        });
      }
      this.page.drawText(line, {
        x: MARGIN + labelW,
        y: this.y,
        size,
        font: this.fonts.regular,
        color: INK,
      });
      this.y -= lineHeight;
    });
    this.y -= 2;
  }

  stampFooters() {
    const pages = this.pdfDoc.getPages();
    const total = pages.length;
    pages.forEach((page, index) => {
      const y = 26;
      page.drawLine({
        start: { x: MARGIN, y: 40 },
        end: { x: PAGE.width - MARGIN, y: 40 },
        thickness: 0.6,
        color: PDF_LINE_COLOR,
      });
      page.drawText(pdfSafe(pdfT("ownerConsulta.footer")), {
        x: MARGIN,
        y,
        size: 8,
        font: this.fonts.regular,
        color: PDF_MUTED_COLOR,
      });
      const pageLabel = pdfSafe(
        pdfT("ownerConsulta.page", { current: index + 1, total }),
      );
      const width = this.fonts.regular.widthOfTextAtSize(pageLabel, 8);
      page.drawText(pageLabel, {
        x: PAGE.width - MARGIN - width,
        y,
        size: 8,
        font: this.fonts.regular,
        color: PDF_MUTED_COLOR,
      });
    });
  }
}

function triggerDownload(bytes, filename) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadOwnerConsultaPdf(consultation) {
  const formData = consultation?.form_data || consultation?.payload?.form_data || {};
  const analysis = plainAnalysis(consultation?.analysis || "");
  if (!analysis && !formData.nombre_mascota) {
    throw new Error(pdfT("ownerConsulta.invalid"));
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle("GUIAA Consulta");
  pdfDoc.setAuthor("GUIAA");
  pdfDoc.setSubject("Orientacion clinica informativa");
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };
  const logo = await embedGuiaaLogo(pdfDoc);
  const writer = new OwnerPdf(pdfDoc, fonts, logo);
  const labels = pdfT("consultation.fields", { returnObjects: true }) || {};

  const pet = formData.nombre_mascota || pdfT("consultation.petDefault");
  const speciesKey = consultation?.category || formData.especie || "";
  const species = SPECIES[speciesKey] || speciesKey || "—";
  const folio = consultation?.id
    ? `GC-${String(consultation.id).slice(0, 8).toUpperCase()}`
    : "GC";

  writer.ensure(78);
  const cardTop = writer.y;
  const cardHeight = 104;
  writer.page.drawRectangle({
    x: MARGIN,
    y: cardTop - cardHeight,
    width: CONTENT_WIDTH,
    height: cardHeight,
    color: CARD,
    borderColor: PDF_LINE_COLOR,
    borderWidth: 0.8,
  });
  writer.y = cardTop - 16;
  writer.pairRow(pdfT("ownerConsulta.folio"), folio, pdfT("ownerConsulta.date"), formatDate(consultation?.created_at || new Date().toISOString()));
  writer.pairRow(pdfT("ownerConsulta.pet"), pet, pdfT("ownerConsulta.species"), species);
  writer.pairRow(
    pdfT("ownerConsulta.owner"),
    formData.nombre_dueño || consultation?.owner_name || "—",
    pdfT("ownerConsulta.breed"),
    formData.raza || "—",
  );
  writer.pairRow(pdfT("ownerConsulta.sex"), formData.sexo || "—", pdfT("ownerConsulta.age"), formData.edad || "—");
  writer.pairRow(pdfT("ownerConsulta.weight"), formData.peso ? `${formData.peso} kg` : "—", "", "");
  writer.y = cardTop - cardHeight - 14;

  const extra = usefulFormRows(formData, labels);
  if (extra.length) {
    writer.title(pdfT("ownerConsulta.sectionPet"));
    extra.forEach((row) => writer.keyValue(row.label, row.value));
  }

  const motivo = (consultation?.detalle_paciente || formData.detalle_paciente || formData.motivo_consulta || "").trim();
  if (motivo) {
    writer.title(pdfT("ownerConsulta.sectionReason"));
    writer.paragraph(motivo, { size: 11, gap: 8 });
  }

  if (analysis) {
    writer.title(pdfT("ownerConsulta.sectionGuidance"));
    plainAnalysis(analysis)
      .split(/\n/)
      .forEach((raw) => {
        const line = raw.trim();
        if (!line) {
          writer.y -= 4;
          return;
        }
        if (isHeading(line)) {
          writer.title(line.replace(/^#+\s*/, ""));
          return;
        }
        const bullet = /^[-•]\s+/.test(line);
        writer.paragraph(bullet ? line.replace(/^[-•]\s+/, "") : line, {
          size: 10.5,
          indent: bullet ? 12 : 0,
          gap: 2,
        });
      });
  }

  writer.y -= 8;
  const disclaimer = pdfT("ownerConsulta.disclaimer");
  const disclaimerLines = wrapText(disclaimer, fonts.regular, 8.5, CONTENT_WIDTH - 16);
  const boxH = disclaimerLines.length * 12 + 14;
  writer.ensure(boxH + 6);
  writer.page.drawRectangle({
    x: MARGIN,
    y: writer.y - boxH,
    width: CONTENT_WIDTH,
    height: boxH,
    color: rgb(1, 0.98, 0.95),
    borderColor: rgb(0.9, 0.78, 0.55),
    borderWidth: 0.7,
  });
  let textY = writer.y - 16;
  disclaimerLines.forEach((line) => {
    writer.page.drawText(line, {
      x: MARGIN + 8,
      y: textY,
      size: 8.5,
      font: fonts.regular,
      color: rgb(0.35, 0.28, 0.16),
    });
    textY -= 12;
  });

  writer.stampFooters();
  const bytes = await pdfDoc.save();
  const safePet = pdfSafe(pet)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  triggerDownload(bytes, `GUIAA-Consulta-${safePet || "mascota"}.pdf`);
}
