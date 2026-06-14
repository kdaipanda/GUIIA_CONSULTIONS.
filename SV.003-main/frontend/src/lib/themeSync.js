/**
 * Sincroniza tema legacy (data-theme + CSS vars en ThemeEnhancements)
 * con la clase `dark` de Tailwind/shadcn (tailwind.config darkMode: "class").
 */
export function applyDocumentTheme(mode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", mode);
  root.classList.toggle("dark", mode === "dark");
}

export function readStoredTheme() {
  try {
    const stored = localStorage.getItem("sv_theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    /* ignore */
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
}
