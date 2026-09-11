import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import i18n from "../i18n";
import { buildClinicalTimeline, getLabStudyLabel } from "./clinicalTimeline";
import {
  drawPdfBrandHeader,
  embedGuiaaLogo,
  PDF_BRAND_COLOR,
  PDF_LINE_COLOR,
} from "./pdfLogo";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 50;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

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
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^---+$/gm, "")
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
    if (!normalized) return;
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

    let current = words[0];
    for (let i = 1; i < words.length; i += 1) {
      const candidate = `${current} ${words[i]}`;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width <= maxWidth) {
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

class PdfWriter {
  constructor(pdfDoc, fonts) {
    this.pdfDoc = pdfDoc;
    this.fonts = fonts;
    this.page = pdfDoc.addPage([PAGE.width, PAGE.height]);
    this.y = PAGE.height - MARGIN;
  }

  ensureSpace(height) {
    if (this.y - height >= MARGIN) return;
    this.page = this.pdfDoc.addPage([PAGE.width, PAGE.height]);
    this.y = PAGE.height - MARGIN;
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
    this.ensureSpace(lines.length * lineHeight + 4);
    lines.forEach((line) => {
      this.page.drawText(line, {
        x: MARGIN + indent,
        y: this.y,
        size,
        font: activeFont,
        color,
      });
      this.y -= lineHeight;
    });
  }

  drawSectionTitle(title) {
    this.ensureSpace(28);
    this.y -= 8;
    this.page.drawText(title, {
      x: MARGIN,
      y: this.y,
      size: 13,
      font: this.fonts.bold,
      color: PDF_BRAND_COLOR,
    });
    this.y -= 10;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE.width - MARGIN, y: this.y },
      thickness: 1,
      color: PDF_LINE_COLOR,
    });
    this.y -= 16;
  }

  drawKeyValue(label, value) {
    const labelFont = this.fonts.bold;
    const valueFont = this.fonts.regular;
    const size = 10.5;
    const labelText = `${toPdfSafeText(label)}:`;
    const valueLines = wrapText(toPdfSafeText(value), valueFont, size, CONTENT_WIDTH - 150);
    const blockHeight = Math.max(1, valueLines.length) * (size + 3) + 6;
    this.ensureSpace(blockHeight);

    this.page.drawText(labelText, {
      x: MARGIN,
      y: this.y,
      size,
      font: labelFont,
      color: rgb(0.25, 0.32, 0.42),
    });

    valueLines.forEach((line, index) => {
      this.page.drawText(line, {
        x: MARGIN + 150,
        y: this.y - index * (size + 3),
        size,
        font: valueFont,
        color: rgb(0.12, 0.16, 0.22),
      });
    });
    this.y -= blockHeight;
  }

  drawBrandHeader(logoImage) {
    this.ensureSpace(96);
    this.y = drawPdfBrandHeader(
      this.page,
      this.fonts,
      this.y,
      logoImage,
      {
        pageWidth: PAGE.width,
        margin: MARGIN,
        subtitle: pdfT("consultation.brandSubtitle"),
      },
    );
  }
}

function appendConsultationDetail(writer, consultation, { veterinarian } = {}) {
  const formData = consultation?.form_data || {};
  const patientName =
    formData.nombre_mascota || consultation.nombre_mascota || pdfT("consultation.petDefault");
  const consultationId = formatConsultationId(consultation);
  const statusLabel =
    getConsultationStatusLabel(consultation.status);

  writer.drawLine(`${pdfT("consultation.folio")}: ${consultationId}`, { size: 11, font: "bold" });
  writer.drawLine(`${pdfT("consultation.pet")}: ${patientName}`, { size: 11 });
  writer.drawLine(`${pdfT("consultation.species")}: ${consultation.category || consultation.especie || "—"}`, {
    size: 11,
  });
  writer.drawLine(`${pdfT("consultation.status")}: ${statusLabel}`, { size: 11 });
  writer.drawLine(`${pdfT("consultation.date")}: ${formatDate(consultation.created_at)}`, { size: 11 });

  if (veterinarian?.nombre || veterinarian?.email) {
    writer.drawLine(
      `${pdfT("consultation.vet")}: ${veterinarian.nombre || "—"}${veterinarian.email ? ` (${veterinarian.email})` : ""}`,
      { size: 10.5, color: rgb(0.35, 0.42, 0.52) },
    );
  }

  writer.y -= 8;
  writer.drawSectionTitle(pdfT("consultation.sectionClinicalData"));
  const clinicalRows = collectClinicalFields(consultation);
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
  if (motivo) {
    writer.drawSectionTitle(pdfT("consultation.sectionReason"));
    writer.drawLine(motivo, { size: 10.5, lineHeight: 14 });
  }

  const extraSections = [
    [pdfT("consultation.sectionVitals"), consultation.parametros_vitales],
    [pdfT("consultation.sectionLab"), consultation.laboratorio_estudios],
    [pdfT("consultation.sectionEnvironment"), consultation.ambiente_manejo],
    [pdfT("consultation.sectionNotes"), consultation.notas_adicionales],
  ];

  extraSections.forEach(([title, value]) => {
    if (!value) return;
    writer.drawSectionTitle(title);
    writer.drawLine(String(value), { size: 10.5, lineHeight: 14 });
  });

  const analysis = cleanAnalysisText(consultation.analysis);
  if (analysis) {
    writer.drawSectionTitle(pdfT("consultation.sectionAnalysis"));
    writer.drawLine(analysis, { size: 10, lineHeight: 13.5 });
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
  writer.ensureSpace(24);
  writer.drawLine(pdfT("consultation.footerGenerated", { date: formatDate(new Date().toISOString()) }), {
    size: 9,
    color: rgb(0.5, 0.55, 0.62),
  });
  writer.drawLine(pdfT("consultation.footerDisclaimer"), {
    size: 9,
    color: rgb(0.5, 0.55, 0.62),
  });
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
