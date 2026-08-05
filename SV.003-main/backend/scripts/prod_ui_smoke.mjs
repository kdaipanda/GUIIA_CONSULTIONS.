/**
 * Smoke UI de producción GUIAA (Playwright).
 *
 * Uso (desde backend/):
 *   node scripts/prod_ui_smoke.mjs
 */
import { createRequire } from "module";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

const WEB = (process.env.WEB_BASE || "https://guiaa.vet").replace(/\/$/, "");
const API = (process.env.PROBE_API_BASE || "https://api.guiaa.vet").replace(/\/$/, "");
const EMAIL = process.env.SMOKE_DEV_EMAIL || "carlos.hernandez@vetmed.com";
const CEDULA = process.env.SMOKE_DEV_CEDULA || "87654321";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendPw = path.resolve(__dirname, "../../frontend/node_modules/playwright");

async function loadChromium() {
  const candidates = [
    path.join(frontendPw, "index.mjs"),
    path.join(frontendPw, "index.js"),
  ];
  for (const candidate of candidates) {
    try {
      const mod = await import(pathToFileURL(candidate).href);
      if (mod.chromium) return mod.chromium;
    } catch {
      /* try next */
    }
  }
  const require = createRequire(import.meta.url);
  try {
    const mod = require(path.join(frontendPw, "index.js"));
    if (mod.chromium) return mod.chromium;
  } catch {
    /* fall through */
  }
  throw new Error(
    "No se encontró playwright. Ejecuta: cd frontend && npm install --no-save playwright@1.62.1 && npx playwright install chromium",
  );
}

function check(label, ok, detail = "") {
  console.log(`  [${ok ? "OK" : "FAIL"}] ${label}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

async function main() {
  let failures = 0;
  console.log(`=== UI smoke @ ${WEB} ===\n`);

  const chromium = await loadChromium();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: "es-MX",
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  try {
    const land = await page.goto(`${WEB}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
    if (!check("Landing HTTP", !!land && land.ok(), String(land?.status()))) failures += 1;
    const brand = await page.locator("text=/GUIAA/i").first().isVisible().catch(() => false);
    if (!check("Landing muestra GUIAA", brand)) failures += 1;

    const loginNav = await page.goto(`${WEB}/login`, { waitUntil: "domcontentloaded", timeout: 45000 });
    if (!check("Login HTTP", !!loginNav && loginNav.ok(), String(loginNav?.status()))) failures += 1;
    const emailField = page
      .locator('input[type="email"], input[name="email"], input[placeholder*="mail" i]')
      .first();
    const hasEmail = await emailField.isVisible({ timeout: 10000 }).catch(() => false);
    if (!check("Formulario login (email)", hasEmail)) failures += 1;

    const logo = await page.goto(`${WEB}/GuiaaLogo-full.png`, { waitUntil: "load", timeout: 30000 });
    if (!check("Logo app", !!logo && logo.ok(), String(logo?.status()))) failures += 1;

    const offer = await page.goto(`${WEB}/email/oferta-friends40-whatsapp.png`, {
      waitUntil: "load",
      timeout: 30000,
    });
    if (!check("Imagen oferta WhatsApp", !!offer && offer.ok(), String(offer?.status()))) failures += 1;

    const loginRes = await page.request.post(`${API}/api/auth/login`, {
      data: { email: EMAIL, cedula_profesional: CEDULA },
      headers: { Origin: WEB, "Content-Type": "application/json" },
    });
    const loginOk = loginRes.ok();
    const loginBody = loginOk ? await loginRes.json() : {};
    if (!check("Login API (dev)", loginOk, String(loginRes.status()))) failures += 1;

    if (loginOk && loginBody.access_token) {
      const vetId = loginBody.id || loginBody.veterinarian?.id;
      const {
        access_token,
        token_type,
        expires_in,
        cedula_flow_nonce,
        cedula_flow_expires_in,
        refresh_token,
        ...profile
      } = loginBody;
      const nextProfile = {
        ...profile,
        id: vetId || profile.id,
        email: profile.email || EMAIL,
      };

      // Sembrar sesión antes de entrar a /app (initScript + evaluate)
      await context.addInitScript(
        ([token, vet]) => {
          window.localStorage.setItem("guiaa_access_token", token);
          window.localStorage.setItem("veterinarian", JSON.stringify(vet));
        },
        [access_token, nextProfile],
      );

      await page.goto(`${WEB}/login`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.evaluate(
        ([token, vet]) => {
          window.localStorage.setItem("guiaa_access_token", token);
          window.localStorage.setItem("veterinarian", JSON.stringify(vet));
        },
        [access_token, nextProfile],
      );

      const dash = await page.goto(`${WEB}/app/dashboard`, {
        waitUntil: "networkidle",
        timeout: 60000,
      });
      if (!check("Dashboard HTTP", !!dash && dash.ok(), String(dash?.status()))) failures += 1;
      await page.waitForTimeout(4000);
      const urlOk = !page.url().includes("/login");
      if (!check("Dashboard autenticado (no redirect login)", urlOk, page.url())) failures += 1;
      const shell = await page
        .locator(".clinic-shell, text=/Dashboard|GUIAA Diagnóstico|Consultas|Membres/i")
        .first()
        .isVisible()
        .catch(() => false);
      if (!check("Shell clínica visible", shell)) failures += 1;

      const admin = await page.goto(`${WEB}/app/admin`, {
        waitUntil: "networkidle",
        timeout: 60000,
      });
      if (!check("Admin HTTP", !!admin && admin.ok(), String(admin?.status()))) failures += 1;
      await page.waitForTimeout(5000);
      const adminTitle = await page
        .locator("text=/Administraci[oó]n GUIAA|Usuarios registrados|En línea|Fuera de línea/i")
        .first()
        .isVisible()
        .catch(() => false);
      if (!check("Admin GUIAA contenido", adminTitle)) failures += 1;
      const usersSection = await page.locator("text=/Usuarios registrados/i").first().isVisible().catch(() => false);
      if (!check("Sección usuarios", usersSection)) failures += 1;
    }

    const criticalConsole = consoleErrors.filter(
      (e) =>
        !/favicon|ResizeObserver|third-party|chrome-extension|Failed to load resource|net::ERR_/i.test(
          e,
        ),
    );
    if (
      !check(
        "Sin errores JS críticos",
        criticalConsole.length === 0,
        criticalConsole.slice(0, 3).join(" | "),
      )
    ) {
      failures += 1;
    }
  } finally {
    await browser.close();
  }

  console.log(`\nUI smoke: ${failures === 0 ? "OK" : `FAIL (${failures})`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
