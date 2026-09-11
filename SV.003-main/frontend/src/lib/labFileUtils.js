import i18n from "../i18n";

const MAX_LAB_FILE_BYTES = 12 * 1024 * 1024;

function labT(key, options) {
  return i18n.t(`labFile.${key}`, { ns: "clinic", ...options });
}

export function fileToBase64Payload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error(labT("readError")));
    reader.readAsDataURL(file);
  });
}

export function validateLabUploadFile(file) {
  if (!file) return labT("selectFile");
  if (file.size > MAX_LAB_FILE_BYTES) {
    return labT("tooLarge");
  }
  const isPdf = file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf");
  const isImage = file.type.startsWith("image/");
  if (!isPdf && !isImage) {
    return labT("unsupported");
  }
  return null;
}

export function labFileLabel(file) {
  if (!file) return "";
  if (file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf")) {
    return labT("pdfLabel", { name: file.name });
  }
  return labT("imageLabel", { name: file.name });
}
