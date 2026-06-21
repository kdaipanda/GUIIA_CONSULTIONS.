/**
 * Genera PNG en public/landing/ desde la UI real de /captura-landing.
 *
 * Uso:
 *   1. npm start  (en otra terminal)
 *   2. npm run capture:landing
 */
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const runner = join(__dirname, "capture-landing-screenshots.runner.mjs");
const frontendRoot = join(__dirname, "..");

const install = spawnSync("npx", ["playwright", "install", "chromium"], {
  stdio: "inherit",
  shell: true,
  cwd: frontendRoot,
});

if (install.status !== 0) {
  process.exit(install.status ?? 1);
}

const run = spawnSync("node", [runner], {
  stdio: "inherit",
  shell: true,
  cwd: frontendRoot,
});

process.exit(run.status ?? 0);
