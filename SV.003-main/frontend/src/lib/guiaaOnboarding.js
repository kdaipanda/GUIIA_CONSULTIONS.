const POST_REGISTER_KEY = "guiaa_post_register";

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
