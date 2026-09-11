/**
 * Normaliza valores de sexo del expediente o consulta a macho/hembra.
 */
export function normalizePetSex(value) {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return "";
  if (v === "m" || v === "male" || v === "macho" || v.startsWith("mach")) return "macho";
  if (v === "f" || v === "female" || v === "hembra" || v.startsWith("hemb")) return "hembra";
  return v;
}
