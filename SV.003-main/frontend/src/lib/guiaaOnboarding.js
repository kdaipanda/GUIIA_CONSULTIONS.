const POST_REGISTER_KEY = "guiaa_post_register";
const NEW_USER_DIAGNOSTICO_PREFIX = "guiaa_new_user_diagnostico_";

export function markPostRegisterOnboarding() {
  try {
    sessionStorage.setItem(POST_REGISTER_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumePostRegisterOnboarding() {
  try {
    if (sessionStorage.getItem(POST_REGISTER_KEY) === "1") {
      sessionStorage.removeItem(POST_REGISTER_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Marca que el usuario recién registrado debe entrar a GUIAA Diagnóstico al autenticarse. */
export function markNewUserDiagnosticoRedirect(vetId) {
  markPostRegisterOnboarding();
  if (!vetId) return;
  try {
    localStorage.setItem(`${NEW_USER_DIAGNOSTICO_PREFIX}${vetId}`, "1");
  } catch {
    /* ignore */
  }
}

/** Consumir redirección única a GUIAA Diagnóstico (registro reciente o primer ingreso). */
export function consumeNewUserDiagnosticoRedirect(vetId) {
  if (consumePostRegisterOnboarding()) {
    return true;
  }
  if (!vetId) return false;
  try {
    const key = `${NEW_USER_DIAGNOSTICO_PREFIX}${vetId}`;
    if (localStorage.getItem(key) === "1") {
      localStorage.removeItem(key);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
