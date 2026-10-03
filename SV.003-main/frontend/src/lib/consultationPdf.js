import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import i18n from "../i18n";
import { buildClinicalTimeline, getLabStudyLabel } from "./clinicalTimeline";
import {
  drawPdfBrandHeader,
  embedGuiaaLogo,
  measurePdfLogo,
  PDF_BRAND_COLOR,
  PDF_LINE_COLOR,
  PDF_MUTED_COLOR,
} from "./pdfLogo";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 48;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;
const FOOTER_SAFE = 68;
const CARD = rgb(0.95, 0.97, 0.99);

const SPECIES_LABELS = {
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

function pdfLocale() {
  return i18n.language?.startsWith("en") ? "en-US" : "es-MX";
}

function getClinicalFieldLabels() {
  return pdfT("consultation.fields", { returnObjects: true }) || {};
}

function getConsultationStatusLabel(status) {
  if (!status) return pdfT("consultation.statusRegistered");
  const key = `status.${status}`;
  if (i18n.exists(key, { ns: "pdf" })) {
    return pdfT(key);
  }
  return status;
}

function toPdfSafeText(text) {
  return String(text ?? "")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/[^\n\r\t\x20-\xFF]/g, "");
}

function sanitizeFilename(value) {
  return (value || pdfT("consultation.filenameDefault"))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function formatConsultationId(consultation) {
  if (!consultation?.id) return "N/A";
  return `CONS-${consultation.id.slice(0, 8).toUpperCase()}`;
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(pdfLocale(), {
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

/** Normaliza análisis clínico que a veces llega como objeto desde la API o Supabase. */
export function coerceClinicalText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    for (const key of ["text", "analysis", "ai_analysis", "detailed_analysis", "content"]) {
      if (typeof value[key] === "string" && value[key].trim()) {
        return value[key];
      }
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function cleanClinicalDisplayText(text) {
  return coerceClinicalText(text)
    .replace(/AN[ÁA]LISIS\s+CL[ÍI]NICO\s+IA/gi, "ANÁLISIS CLÍNICO")
    .replace(/Análisis con IA/gi, "Análisis clínico")
    .replace(/interpretaci[óo]n.*\scon IA/gi, (match) => match.replace(/\scon IA/i, ""))
    .replace(/\(\s*IA\s*\)/gi, "")
    .replace(/\bIA\b/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Texto plano corto para tarjetas de historial (sin markdown crudo). */
export function clinicalTextPreview(text, maxLength = 150) {
  if (!text) return "";
  let plain = cleanClinicalDisplayText(text)
    .replace(/\\n/g, "\n")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/^---+$/gm, "")
    .replace(/^\*\*\*+$/gm, "")
    .replace(/^[-*•]\s+/gm, "")
    .replace(/^\d+[.)]\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength).trim()}…`;
}

function cleanAnalysisText(text) {
  return cleanClinicalDisplayText(text);
}

function collectClinicalFields(consultation) {
  const formData = consultation?.form_data || {};
  const seen = new Set();
  const rows = [];

  const addRow = (label, value) => {
    const normalized = value == null ? "" : String(value).trim();
    if (!normalized || normalized.toUpperCase() === "NO") return;
    const key = `${label}:${normalized}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ label, value: normalized });
  };

  const fieldLabels = getClinicalFieldLabels();

  Object.entries(fieldLabels).forEach(([field, label]) => {
    addRow(label, formData[field] ?? consultation[field]);
  });

  Object.entries(formData).forEach(([field, value]) => {
    if (fieldLabels[field]) return;
    if (value == null || value === "") return;
    if (typeof value === "object") return;
    const label = field
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    addRow(label, value);
  });

  return rows;
}

function wrapText(text, font, fontSize, maxWidth) {
  const paragraphs = toPdfSafeText(text).split(/\r?\n/);
  const lines = [];

  paragraphs.forEach((paragraph, index) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      if (index < paragraphs.length - 1) lines.push("");
      return;
    }

    const pieces = [];
    words.forEach((word) => {
      if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
        pieces.push(word);
        return;
      }
      let chunk = "";
      for (const char of word) {
        const next = chunk + char;
        if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
          chunk = next;
        } else {
          if (chunk) pieces.push(chunk);
          chunk = char;
        }
      }
      if (chunk) pieces.push(chunk);
    });

    let current = pieces[0];
    for (let i = 1; i < pieces.length; i += 1) {
      const candidate = `${current} ${pieces[i]}`;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width <= maxWidth) {
        current = candidate;
      } else {
        lines.push(current);
        current = pieces[i];
      }
    }
    lines.push(current);
  });

  return lines.length ? lines : [""];
}

class PdfWriter {
  constructor(pdfDoc, fonts) {
    this.pdfDoc = pdfDoc;
    this.fonts = fonts;
    this.logoImage = null;
    this.page = pdfDoc.addPage([PAGE.width, PAGE.height]);
    this.y = PAGE.height - 36;
  }

  ensureSpace(height) {
    if (this.y - height >= FOOTER_SAFE) return;
    this.page = this.pdfDoc.addPage([PAGE.width, PAGE.height]);
    this.drawContinuationHeader();
  }

  drawContinuationHeader() {
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
    const title = "GUIAA Diagnostico";
    const titleW = this.fonts.bold.widthOfTextAtSize(title, 11);
    this.page.drawText(title, {
      x: PAGE.width - MARGIN - titleW,
      y: top - 14,
      size: 11,
      font: this.fonts.bold,
      color: PDF_BRAND_COLOR,
    });
    const lineY = top - Math.max(logoH, 16) - 8;
    this.page.drawLine({
      start: { x: MARGIN, y: lineY },
      end: { x: PAGE.width - MARGIN, y: lineY },
      thickness: 0.8,
      color: PDF_LINE_COLOR,
    });
    this.y = lineY - 18;
  }

  drawLine(text, options = {}) {
    const {
      size = 11,
      font = "regular",
      color = rgb(0.12, 0.16, 0.22),
      indent = 0,
      lineHeight = size + 4,
    } = options;
    const activeFont = this.fonts[font] || this.fonts.regular;
    const lines = wrapText(toPdfSafeText(text), activeFont, size, CONTENT_WIDTH - indent);
    lines.forEach((line) => {
      this.ensureSpace(lineHeight);
      if (line) {
        this.page.drawText(line, {
          x: MARGIN + indent,
          y: this.y,
          size,
          font: activeFont,
          color,
        });
      }
      this.y -= line ? lineHeight : 6;
    });
  }

  drawSectionTitle(title) {
    this.ensureSpace(32);
    this.y -= 8;
    this.page.drawText(toPdfSafeText(title), {
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

  drawKeyValue(label, value) {
    const size = 10;
    const labelText = toPdfSafeText(label);
    const labelW = Math.min(168, this.fonts.bold.widthOfTextAtSize(`${labelText}  `, size));
    const valueLines = wrapText(toPdfSafeText(value), this.fonts.regular, size, CONTENT_WIDTH - labelW - 8);
    const lineHeight = size + 4;
    valueLines.forEach((line, index) => {
      this.ensureSpace(lineHeight);
      if (index === 0) {
        this.page.drawText(labelText, {
          x: MARGIN,
          y: this.y,
          size,
          font: this.fonts.bold,
          color: rgb(0.28, 0.36, 0.46),
        });
      }
      this.page.drawText(line, {
        x: MARGIN + labelW + 6,
        y: this.y,
        size,
        font: this.fonts.regular,
        color: rgb(0.12, 0.16, 0.22),
      });
      this.y -= lineHeight;
    });
    this.y -= 2;
  }

  drawPair(leftLabel, leftValue, rightLabel, rightValue) {
    const size = 10;
    const col = CONTENT_WIDTH / 2;
    this.ensureSpace(18);
    const draw = (label, value, x) => {
      const labelText = `${toPdfSafeText(label)}  `;
      this.page.drawText(labelText, {
        x,
        y: this.y,
        size,
        font: this.fonts.bold,
        color: rgb(0.28, 0.36, 0.46),
      });
      const offset = this.fonts.bold.widthOfTextAtSize(labelText, size);
      const max = Math.max(40, col - offset - 10);
      const valueText = wrapText(toPdfSafeText(value || "—"), this.fonts.regular, size, max)[0] || "—";
      this.page.drawText(valueText, {
        x: x + offset,
        y: this.y,
        size,
        font: this.fonts.regular,
        color: rgb(0.12, 0.16, 0.22),
      });
    };
    draw(leftLabel, leftValue, MARGIN);
    if (rightLabel) draw(rightLabel, rightValue, MARGIN + col);
    this.y -= 16;
  }

  drawBrandHeader(logoImage) {
    this.logoImage = logoImage;
    this.y = drawPdfBrandHeader(this.page, this.fonts, this.y, logoImage, {
      pageWidth: PAGE.width,
      margin: MARGIN,
      subtitle: pdfT("consultation.brandSubtitle"),
    });
  }

  stampFooters() {
    const pages = this.pdfDoc.getPages();
    const total = pages.length;
    pages.forEach((page, index) => {
      page.drawLine({
        start: { x: MARGIN, y: 40 },
        end: { x: PAGE.width - MARGIN, y: 40 },
        thickness: 0.6,
        color: PDF_LINE_COLOR,
      });
      page.drawText(toPdfSafeText(pdfT("consultation.footerBrand")), {
        x: MARGIN,
        y: 26,
        size: 8,
        font: this.fonts.regular,
        color: PDF_MUTED_COLOR,
      });
      const pageLabel = toPdfSafeText(pdfT("consultation.page", { current: index + 1, total }));
      const width = this.fonts.regular.widthOfTextAtSize(pageLabel, 8);
      page.drawText(pageLabel, {
        x: PAGE.width - MARGIN - width,
        y: 26,
        size: 8,
        font: this.fonts.regular,
        color: PDF_MUTED_COLOR,
      });
    });
  }
}

function formatClinicalAnalysis(raw) {
  const source = cleanAnalysisText(raw);
  if (!source) return [];

  const text = source
    .replace(/\r/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1$2")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const blocks = [];
  text.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line || /^[-_*]{3,}$/.test(line)) {
      if (blocks.length && blocks[blocks.length - 1].kind !== "gap") {
        blocks.push({ kind: "gap" });
      }
      return;
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      blocks.push({ kind: "heading", text: heading[1].replace(/[*_#]+/g, "").trim() });
      return;
    }

    const bullet = line.match(/^(?:[-•]|\d+[.)])\s+(.+)$/);
    if (bullet) {
      const marker = line.match(/^\d+[.)]/) ? line.match(/^\d+[.)]/)[0] : "•";
      blocks.push({
        kind: "bullet",
        text: `${marker}  ${bullet[1].replace(/[*_#]+/g, "").trim()}`,
      });
      return;
    }

    blocks.push({
      kind: "text",
      text: line.replace(/[*_#]+/g, "").replace(/\s{2,}/g, " ").trim(),
    });
  });

  return blocks.filter((block, index) => block.kind !== "gap" || index !== 0);
}

function appendConsultationDetail(writer, consultation, { veterinarian } = {}) {
  const formData = consultation?.form_data || {};
  const patientName =
    formData.nombre_mascota || consultation.nombre_mascota || pdfT("consultation.petDefault");
  const consultationId = formatConsultationId(consultation);
  const statusLabel = getConsultationStatusLabel(consultation.status);
  const speciesKey = consultation.category || consultation.especie || formData.especie || "";
  const species = SPECIES_LABELS[speciesKey] || speciesKey || "—";

  writer.ensureSpace(92);
  const cardTop = writer.y;
  const cardHeight = 88;
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
  writer.drawPair(pdfT("consultation.folio"), consultationId, pdfT("consultation.date"), formatDate(consultation.created_at));
  writer.drawPair(pdfT("consultation.pet"), patientName, pdfT("consultation.species"), species);
  writer.drawPair(pdfT("consultation.owner"), formData.nombre_dueño || formData.nombre_dueno || "—", pdfT("consultation.breed"), formData.raza || "—");
  writer.drawPair(pdfT("consultation.status"), statusLabel, pdfT("consultation.vet"), veterinarian?.nombre || "—");
  writer.y = cardTop - cardHeight - 12;

  const identity = new Set([
    "nombre_mascota",
    "nombre_dueño",
    "nombre_dueno",
    "especie",
    "raza",
    "fecha",
  ]);
  const clinicalRows = collectClinicalFields(consultation).filter((row) => {
    const key = Object.keys(getClinicalFieldLabels()).find(
      (field) => getClinicalFieldLabels()[field] === row.label,
    );
    return !identity.has(key || "");
  });

  writer.drawSectionTitle(pdfT("consultation.sectionClinicalData"));
  if (clinicalRows.length) {
    clinicalRows.forEach(({ label, value }) => writer.drawKeyValue(label, value));
  } else {
    writer.drawLine(pdfT("consultation.noStructuredData"), {
      size: 10.5,
      color: rgb(0.45, 0.5, 0.58),
    });
  }

  const motivo =
    consultation.detalle_paciente ||
    formData.motivo_consulta ||
    consultation.motivo_consulta ||
    "";
  if (motivo && String(motivo).trim().toUpperCase() !== "NO") {
    writer.drawSectionTitle(pdfT("consultation.sectionReason"));
    writer.drawLine(motivo, { size: 10.5, lineHeight: 15 });
  }

  const extraSections = [
    [pdfT("consultation.sectionVitals"), consultation.parametros_vitales],
    [pdfT("consultation.sectionLab"), consultation.laboratorio_estudios],
    [pdfT("consultation.sectionEnvironment"), consultation.ambiente_manejo],
    [pdfT("consultation.sectionNotes"), consultation.notas_adicionales],
  ];

  extraSections.forEach(([title, value]) => {
    if (!value || String(value).trim().toUpperCase() === "NO") return;
    writer.drawSectionTitle(title);
    writer.drawLine(String(value), { size: 10.5, lineHeight: 15 });
  });

  const analysis = formatClinicalAnalysis(consultation.analysis);
  if (analysis.length) {
    writer.drawSectionTitle(pdfT("consultation.sectionAnalysis"));
    analysis.forEach((block) => {
      if (block.kind === "heading") {
        writer.ensureSpace(78);
        writer.drawSectionTitle(block.text);
        return;
      }
      if (block.kind === "gap") {
        writer.ensureSpace(10);
        writer.y -= 6;
        return;
      }
      writer.drawLine(block.text, {
        size: block.kind === "bullet" ? 10.5 : 10.5,
        lineHeight: 15,
        indent: block.kind === "bullet" ? 14 : 0,
      });
    });
  }

  if (consultation.rating) {
    writer.y -= 4;
    writer.drawLine(pdfT("consultation.rating", { rating: consultation.rating }), {
      size: 10,
      color: rgb(0.35, 0.42, 0.52),
    });
  }
}

function appendPdfFooter(writer) {
  writer.y -= 8;
  writer.drawLine(pdfT("consultation.footerGenerated", { date: formatDate(new Date().toISOString()) }), {
    size: 9,
    color: rgb(0.5, 0.55, 0.62),
  });
  writer.drawLine(pdfT("consultation.footerDisclaimer"), {
    size: 9,
    color: rgb(0.5, 0.55, 0.62),
  });
  writer.stampFooters();
}

function triggerPdfDownload(pdfBytes, filename) {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadConsultationPdf(consultation, { veterinarian } = {}) {
  if (!consultation?.id) {
    throw new Error(pdfT("consultation.invalid"));
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle("GUIAA Diagnostico");
  pdfDoc.setAuthor("GUIAA");
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const writer = new PdfWriter(pdfDoc, { regular, bold });
  const logoImage = await embedGuiaaLogo(pdfDoc);

  const formData = consultation.form_data || {};
  const patientName =
    formData.nombre_mascota || consultation.nombre_mascota || pdfT("consultation.petDefault");
  const consultationId = formatConsultationId(consultation);

  writer.drawBrandHeader(logoImage);
  appendConsultationDetail(writer, consultation, { veterinarian });
  appendPdfFooter(writer);

  const pdfBytes = await pdfDoc.save();
  triggerPdfDownload(
    pdfBytes,
    `ficha-clinica-${sanitizeFilename(consultationId)}-${sanitizeFilename(patientName)}.pdf`,
  );
}

export async function downloadUserConsultationsHistoryPdf(
  user,
  consultations,
  { generatedBy } = {},
) {
  if (!user?.id && !user?.email) {
    throw new Error(pdfT("consultation.userInvalid"));
  }

  const sorted = [...(consultations || [])].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
  );

  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const writer = new PdfWriter(pdfDoc, { regular, bold });
  const logoImage = await embedGuiaaLogo(pdfDoc);

  writer.drawBrandHeader(logoImage);
  writer.drawLine(pdfT("consultation.historyTitle"), { size: 14, font: "bold" });
  writer.drawLine(`${pdfT("consultation.vet")}: ${user.nombre || "—"}`, { size: 11 });
  writer.drawLine(`${pdfT("consultation.email")}: ${user.email || "—"}`, { size: 11 });
  writer.drawLine(pdfT("consultation.consultationsRegistered", { count: sorted.length }), {
    size: 10.5,
    color: rgb(0.35, 0.42, 0.52),
  });
  if (generatedBy?.nombre || generatedBy?.email) {
    writer.drawLine(
      pdfT("consultation.exportedBy", {
        name: generatedBy.nombre || "—",
        email: generatedBy.email ? ` (${generatedBy.email})` : "",
      }),
      { size: 10, color: rgb(0.35, 0.42, 0.52) },
    );
  }

  writer.y -= 8;

  if (!sorted.length) {
    writer.drawSectionTitle(pdfT("consultation.consultationsSection"));
    writer.drawLine(pdfT("consultation.noConsultations"), {
      size: 10.5,
      color: rgb(0.45, 0.5, 0.58),
    });
  } else {
    sorted.forEach((consultation, index) => {
      writer.drawSectionTitle(
        pdfT("consultation.consultationOf", { current: index + 1, total: sorted.length }),
      );
      appendConsultationDetail(writer, consultation, { veterinarian: user });
      if (index < sorted.length - 1) {
        writer.y -= 10;
      }
    });
  }

  appendPdfFooter(writer);

  const pdfBytes = await pdfDoc.save();
  const userLabel = sanitizeFilename(user.nombre || user.email || "usuario");
  triggerPdfDownload(pdfBytes, `historial-consultas-${userLabel}.pdf`);
}

export async function downloadPatientHistoryPdf(patient, consultations, { veterinarian, medicalImages = [] } = {}) {
  if (!patient?.name) {
    throw new Error(pdfT("consultation.patientInvalid"));
  }

  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const writer = new PdfWriter(pdfDoc, { regular, bold });
  const logoImage = await embedGuiaaLogo(pdfDoc);

  writer.drawBrandHeader(logoImage);
  writer.drawLine(pdfT("consultation.patientHistoryTitle"), { size: 14, font: "bold" });
  writer.drawLine(`${pdfT("consultation.pet")}: ${patient.name}`, { size: 11 });
  writer.drawLine(`${pdfT("consultation.species")}: ${patient.species || "—"}`, { size: 11 });
  writer.drawLine(`${pdfT("consultation.breed")}: ${patient.breed || "—"}`, { size: 11 });
  if (patient.clients?.name) {
    writer.drawLine(`${pdfT("consultation.owner")}: ${patient.clients.name}`, { size: 11 });
  }
  writer.drawLine(pdfT("consultation.cdsConsultations", { count: (consultations || []).length }), {
    size: 10.5,
    color: rgb(0.35, 0.42, 0.52),
  });
  if (medicalImages.length) {
    writer.drawLine(pdfT("consultation.labInterpretations", { count: medicalImages.length }), {
      size: 10.5,
      color: rgb(0.35, 0.42, 0.52),
    });
  }

  writer.y -= 8;
  writer.drawSectionTitle(pdfT("consultation.unifiedHistory"));

  const timeline = buildClinicalTimeline(consultations, medicalImages);

  if (!timeline.length) {
    writer.drawLine(pdfT("consultation.noRecords"), {
      size: 10.5,
      color: rgb(0.45, 0.5, 0.58),
    });
  } else {
    timeline.forEach((item, index) => {
      if (item.kind === "consultation") {
        const consultation = item.consultation;
        const folio = formatConsultationId(consultation);
        const statusLabel = getConsultationStatusLabel(consultation.status);
        const motivo =
          consultation.detalle_paciente ||
          consultation.motivo_consulta ||
          consultation.form_data?.motivo_consulta ||
          pdfT("consultation.noReason");
        const analysisPreview = cleanAnalysisText(consultation.analysis).slice(0, 280);

        writer.drawLine(
          `${index + 1}. ${pdfT("consultation.consultationEntry")} ${folio} — ${formatDate(consultation.created_at)}`,
          { size: 11, font: "bold" },
        );
        writer.drawLine(`${pdfT("consultation.status")}: ${statusLabel}`, { size: 10.5 });
        writer.drawLine(`${pdfT("consultation.reason")}: ${toPdfSafeText(motivo).slice(0, 200)}`, {
          size: 10.5,
          lineHeight: 13,
        });
        if (analysisPreview) {
          writer.drawLine(
            `${pdfT("consultation.diagnosis")}: ${toPdfSafeText(analysisPreview)}${consultation.analysis?.length > 280 ? "…" : ""}`,
            { size: 10, lineHeight: 12.5, color: rgb(0.35, 0.42, 0.52) },
          );
        }
        item.linkedStudies.forEach((study) => {
          writer.drawLine(
            `  ↳ ${getLabStudyLabel(study)} — ${formatDate(study.created_at)}`,
            { size: 10, font: "bold", color: rgb(0.28, 0.38, 0.52) },
          );
          if (study.analysis) {
            writer.drawLine(`    ${toPdfSafeText(String(study.analysis).slice(0, 220))}`, {
              size: 9.5,
              lineHeight: 12,
              color: rgb(0.35, 0.42, 0.52),
            });
          }
        });
      } else {
        const study = item.study;
        writer.drawLine(
          `${index + 1}. ${pdfT("consultation.labEntry")} ${getLabStudyLabel(study)} — ${formatDate(study.created_at)}`,
          { size: 11, font: "bold" },
        );
        if (study.analysis) {
          writer.drawLine(toPdfSafeText(String(study.analysis).slice(0, 240)), {
            size: 10,
            lineHeight: 12.5,
            color: rgb(0.35, 0.42, 0.52),
          });
        }
      }
      writer.y -= 6;
    });
  }

  if (veterinarian?.nombre || veterinarian?.email) {
    writer.y -= 4;
    writer.drawLine(
      `${pdfT("consultation.vet")}: ${veterinarian.nombre || "—"}${veterinarian.email ? ` (${veterinarian.email})` : ""}`,
      { size: 10, color: rgb(0.35, 0.42, 0.52) },
    );
  }

  writer.ensureSpace(24);
  writer.drawLine(pdfT("consultation.footerGenerated", { date: formatDate(new Date().toISOString()) }), {
    size: 9,
    color: rgb(0.5, 0.55, 0.62),
  });
  writer.drawLine(pdfT("consultation.footerDisclaimer"), {
    size: 9,
    color: rgb(0.5, 0.55, 0.62),
  });

  const pdfBytes = await pdfDoc.save();
  triggerPdfDownload(pdfBytes, `historia-clinica-${sanitizeFilename(patient.name)}.pdf`);
}
