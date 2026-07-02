const MAX_CEDULA_BYTES = 10 * 1024 * 1024;
const COMPRESS_THRESHOLD_BYTES = 1.5 * 1024 * 1024;
const MAX_IMAGE_EDGE = 2400;

const ACCEPTED_CEDULA_INPUT =
  "application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No pudimos leer el archivo seleccionado."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error(
          "No pudimos abrir la imagen. Usa JPG o PNG nítido, o exporta desde iPhone como JPG.",
        ),
      );
    image.src = src;
  });
}

function canvasToJpegBlob(canvas, quality = 0.88) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No pudimos comprimir la imagen. Intenta con otro archivo."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

async function compressRasterFile(file) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);

  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(image, 0, 0, width, height);

  const blob = await canvasToJpegBlob(canvas);
  if (blob.size >= file.size && file.type === "image/jpeg") {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "cedula";
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

/**
 * Prepara el archivo de cédula antes del upload: valida tamaño y comprime fotos grandes.
 */
export async function prepareCedulaFileForUpload(file) {
  if (!file) return null;

  if (file.size > MAX_CEDULA_BYTES) {
    throw new Error("El archivo supera 10MB. Comprime la imagen o usa PDF.");
  }

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (isPdf) {
    return file;
  }

  const isImage =
    file.type.startsWith("image/") ||
    /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || "");

  if (!isImage) {
    throw new Error("Formato no soportado. Sube PDF, JPG o PNG.");
  }

  if (file.size < COMPRESS_THRESHOLD_BYTES && file.type === "image/jpeg") {
    return file;
  }

  try {
    return await compressRasterFile(file);
  } catch {
    // El backend intentará normalizar HEIC y otros formatos.
    return file;
  }
}

export { ACCEPTED_CEDULA_INPUT, MAX_CEDULA_BYTES };
