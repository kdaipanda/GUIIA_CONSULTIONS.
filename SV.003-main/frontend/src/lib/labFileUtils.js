const MAX_LAB_FILE_BYTES = 12 * 1024 * 1024;

export function fileToBase64Payload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

export function validateLabUploadFile(file) {
  if (!file) return "Selecciona un archivo";
  if (file.size > MAX_LAB_FILE_BYTES) {
    return "El archivo es demasiado grande. Máximo 12 MB.";
  }
  const isPdf = file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/");
  if (!isPdf && !isImage) {
    return "Formato no soportado. Usa PDF, JPG o PNG.";
  }
  return null;
}

export function labFileLabel(file) {
  if (!file) return "";
  if (file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf")) {
    return `PDF: ${file.name}`;
  }
  return `Imagen: ${file.name}`;
}
