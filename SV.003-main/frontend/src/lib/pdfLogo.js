import { rgb } from "pdf-lib";
import {
  GUIAA_TAGLINE_PRIMARY,
  GUIAA_TAGLINE_SECONDARY,
} from "../components/GuiaaBrandLockup";

export const PDF_LOGO_SOURCES = [
  "/GuiaaLogo-full.png",
  "/GuiaLogo-mark.png",
  "/GuiaLogo.png",
];

export const PDF_BRAND_COLOR = rgb(38 / 255, 91 / 255, 147 / 255);
export const PDF_MUTED_COLOR = rgb(0.35, 0.42, 0.52);
export const PDF_TAGLINE_COLOR = rgb(0.45, 0.5, 0.58);
export const PDF_LINE_COLOR = rgb(0.82, 0.88, 0.96);

export function toPdfAscii(text) {
  return String(text ?? "")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/decisión/gi, "decision")
    .replace(/[^\n\r\t\x20-\xFF]/g, "");
}

export async function fetchPdfAssetBytes(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
  return new Uint8Array(await response.arrayBuffer());
}

export async function embedGuiaaLogo(pdfDoc) {
  for (const url of PDF_LOGO_SOURCES) {
    try {
      return await pdfDoc.embedPng(await fetchPdfAssetBytes(url));
    } catch {
      /* siguiente fuente */
    }
  }
  return null;
}

export function measurePdfLogo(logoImage, { maxHeight = 34, maxWidth = 155 } = {}) {
  if (!logoImage) return { width: 0, height: 0 };
  const ratio = logoImage.width / logoImage.height;
  let height = maxHeight;
  let width = height * ratio;
  if (width > maxWidth) {
    width = maxWidth;
    height = width / ratio;
  }
  return { width, height };
}

/**
 * Dibuja logo + eslogan GUIAA. Devuelve la coordenada Y inferior del bloque.
 */
export function drawPdfBrandHeader(page, fonts, topY, logoImage, options = {}) {
  const margin = options.margin ?? 50;
  const subtitle = options.subtitle ?? null;
  const pageWidth = options.pageWidth ?? 595.28;

  const { width: logoW, height: logoH } = measurePdfLogo(logoImage);
  let y = topY;

  if (logoImage) {
    page.drawImage(logoImage, {
      x: margin,
      y: y - logoH,
      width: logoW,
      height: logoH,
    });
    y -= logoH + 8;
  } else {
    page.drawText("GUIAA", {
      x: margin,
      y: y - 14,
      size: 16,
      font: fonts.bold,
      color: PDF_BRAND_COLOR,
    });
    y -= 22;
  }

  page.drawText(toPdfAscii(GUIAA_TAGLINE_PRIMARY), {
    x: margin,
    y: y - 10,
    size: 8.5,
    font: fonts.regular,
    color: PDF_MUTED_COLOR,
  });
  y -= 12;

  page.drawText(toPdfAscii(GUIAA_TAGLINE_SECONDARY), {
    x: margin,
    y: y - 9,
    size: 7.5,
    font: fonts.regular,
    color: PDF_TAGLINE_COLOR,
  });
  y -= 16;

  if (subtitle) {
    page.drawText(toPdfAscii(subtitle), {
      x: margin,
      y: y - 10,
      size: 11,
      font: fonts.regular,
      color: PDF_MUTED_COLOR,
    });
    y -= 18;
  }

  page.drawLine({
    start: { x: margin, y: y },
    end: { x: pageWidth - margin, y: y },
    thickness: 1,
    color: PDF_LINE_COLOR,
  });

  return y - 14;
}
