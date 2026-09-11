import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import i18n from "../i18n";
import {
  drawPdfBrandHeader,
  embedGuiaaLogo,
  PDF_BRAND_COLOR,
  PDF_MUTED_COLOR,
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

function getInvoiceStatusLabel(status) {
  if (!status) return "—";
  const key = `invoiceStatus.${status}`;
  if (i18n.exists(key, { ns: "pdf" })) {
    return pdfT(key);
  }
  return status;
}

function getPaymentMethodLabel(method) {
  if (!method) return "";
  const key = `paymentMethods.${method}`;
  if (i18n.exists(key, { ns: "pdf" })) {
    return pdfT(key);
  }
  return method;
}

function toPdfSafeText(text) {
  return String(text ?? "")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/[^\n\r\t\x20-\xFF]/g, "");
}

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
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

function wrapText(text, font, fontSize, maxWidth) {
  const words = toPdfSafeText(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
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
  return lines;
}

function sanitizeFilename(value) {
  return (value || pdfT("invoice.filenameDefault"))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function downloadInvoicePdf(invoice, options = {}) {
  if (!invoice) return;

  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const logo = await embedGuiaaLogo(pdfDoc);
  const page = pdfDoc.addPage([PAGE.width, PAGE.height]);
  let y = drawPdfBrandHeader(
    page,
    { regular, bold },
    PAGE.height - MARGIN,
    logo,
    {
      pageWidth: PAGE.width,
      margin: MARGIN,
      subtitle: options.organizationName
        ? pdfT("invoice.subtitleOrg", { org: options.organizationName })
        : pdfT("invoice.subtitle"),
    },
  );

  const muted = PDF_MUTED_COLOR;
  const text = rgb(0.12, 0.16, 0.22);

  const folio = invoice.invoice_number || invoice.id?.slice(0, 8).toUpperCase() || "—";
  page.drawText(toPdfSafeText(`${pdfT("invoice.folio")}: ${folio}`), {
    x: PAGE.width - MARGIN - 140,
    y: PAGE.height - MARGIN - 14,
    size: 10,
    font: bold,
    color: text,
  });
  page.drawText(toPdfSafeText(formatDate(invoice.created_at)), {
    x: PAGE.width - MARGIN - 140,
    y: PAGE.height - MARGIN - 28,
    size: 9,
    font: regular,
    color: muted,
  });

  y -= 10;

  const drawRow = (label, value) => {
    page.drawText(toPdfSafeText(`${label}:`), {
      x: MARGIN,
      y,
      size: 10,
      font: bold,
      color: muted,
    });
    page.drawText(toPdfSafeText(value), {
      x: MARGIN + 120,
      y,
      size: 10,
      font: regular,
      color: text,
    });
    y -= 16;
  };

  drawRow(pdfT("invoice.recipient"), invoice.clients?.name || pdfT("invoice.publicGeneral"));
  if (invoice.patients?.name) drawRow(pdfT("invoice.pet"), invoice.patients.name);
  drawRow(pdfT("invoice.status"), getInvoiceStatusLabel(invoice.status));
  if (invoice.payment_method) {
    drawRow(pdfT("invoice.payment"), getPaymentMethodLabel(invoice.payment_method));
  }

  y -= 8;
  page.drawText(pdfT("invoice.lineItems"), { x: MARGIN, y, size: 12, font: bold, color: PDF_BRAND_COLOR });
  y -= 18;

  const colDesc = MARGIN;
  const colQty = PAGE.width - MARGIN - 180;
  const colPrice = PAGE.width - MARGIN - 110;
  const colTotal = PAGE.width - MARGIN - 50;

  page.drawText(pdfT("invoice.description"), { x: colDesc, y, size: 9, font: bold, color: muted });
  page.drawText(pdfT("invoice.qty"), { x: colQty, y, size: 9, font: bold, color: muted });
  page.drawText(pdfT("invoice.price"), { x: colPrice, y, size: 9, font: bold, color: muted });
  page.drawText(pdfT("invoice.total"), { x: colTotal, y, size: 9, font: bold, color: muted });
  y -= 12;

  for (const item of invoice.items || []) {
    const descLines = wrapText(item.description || pdfT("invoice.lineDefault"), regular, 9, colQty - colDesc - 8);
    descLines.forEach((line, index) => {
      page.drawText(line, {
        x: colDesc,
        y: y - index * 12,
        size: 9,
        font: regular,
        color: text,
      });
    });
    const rowH = Math.max(descLines.length * 12, 14);
    page.drawText(String(item.quantity ?? 1), {
      x: colQty,
      y: y,
      size: 9,
      font: regular,
      color: text,
    });
    page.drawText(formatMoney(item.unit_price), {
      x: colPrice,
      y,
      size: 9,
      font: regular,
      color: text,
    });
    page.drawText(formatMoney(item.line_total), {
      x: colTotal,
      y,
      size: 9,
      font: regular,
      color: text,
    });
    y -= rowH + 6;
    if (y < MARGIN + 80) break;
  }

  y -= 10;
  page.drawLine({
    start: { x: PAGE.width - MARGIN - 200, y },
    end: { x: PAGE.width - MARGIN, y },
    thickness: 1,
    color: rgb(0.82, 0.88, 0.96),
  });
  y -= 18;

  const totals = [
    [pdfT("invoice.subtotal"), formatMoney(invoice.subtotal)],
    [pdfT("invoice.tax", { rate: Number(invoice.tax_rate || 0) }), formatMoney(invoice.tax_amount)],
    [pdfT("invoice.total"), formatMoney(invoice.total)],
  ];
  totals.forEach(([label, value], index) => {
    page.drawText(toPdfSafeText(label), {
      x: PAGE.width - MARGIN - 200,
      y,
      size: index === 2 ? 11 : 10,
      font: index === 2 ? bold : regular,
      color: text,
    });
    page.drawText(toPdfSafeText(value), {
      x: PAGE.width - MARGIN - 70,
      y,
      size: index === 2 ? 11 : 10,
      font: index === 2 ? bold : regular,
      color: text,
    });
    y -= 16;
  });

  if (invoice.notes) {
    y -= 8;
    page.drawText(pdfT("invoice.notes"), { x: MARGIN, y, size: 10, font: bold, color: muted });
    y -= 14;
    wrapText(invoice.notes, regular, 9, CONTENT_WIDTH).forEach((line) => {
      page.drawText(line, { x: MARGIN, y, size: 9, font: regular, color: text });
      y -= 12;
    });
  }

  y = MARGIN + 20;
  page.drawText(toPdfSafeText(pdfT("invoice.disclaimer")), {
    x: MARGIN,
    y,
    size: 8,
    font: regular,
    color: muted,
  });

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilename(folio)}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
