import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public/landing");
const baseUrl = process.env.LANDING_CAPTURE_URL || "http://localhost:3000";

const SHOTS = [
  { selector: "#capture-consultation-species", file: "consultation-species.png" },
  { selector: "#capture-consultation-form", file: "consultation-form.png" },
  { selector: "#capture-dashboard", file: "dashboard.png" },
];

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await page.goto(`${baseUrl}/captura-landing`, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    await page.waitForSelector("#capture-consultation-species", { timeout: 30_000 });
    await page.waitForTimeout(800);

    for (const { selector, file } of SHOTS) {
      const target = page.locator(selector);
      await target.scrollIntoViewIfNeeded();
      await target.screenshot({ path: join(outDir, file) });
      console.log(`✓ ${file}`);
    }
  } finally {
    await browser.close();
  }

  console.log(`\nCapturas guardadas en ${outDir}`);
}

main().catch((error) => {
  console.error("\nError generando capturas:", error.message);
  console.error("\nAsegúrate de que el frontend esté corriendo: npm start");
  process.exit(1);
});
