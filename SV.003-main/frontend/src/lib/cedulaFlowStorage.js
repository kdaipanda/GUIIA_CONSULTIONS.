const STORAGE_KEY = "guiaa_cedula_flow";

/** Persiste el flujo de cédula (sin archivo ni contraseña en texto plano). */
export function saveCedulaFlow(flow) {
  try {
    if (!flow) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    const { file, login_password, ...safe } = flow;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadCedulaFlow() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function clearCedulaFlow() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
