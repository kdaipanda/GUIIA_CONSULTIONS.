/**
 * Genera variantes del hero desde public/VG1.mp4:
 * - VG1-mobile.mp4 (~720p, ligero)
 * - VG1-4k.mp4 (2× Lanczos + unsharp para monitores 2K/4K)
 *
 * Uso: node scripts/compress_hero_video.js
 *      node scripts/compress_hero_video.js --only=4k
 *      node scripts/compress_hero_video.js --only=mobile
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const publicDir = path.join(__dirname, "..", "public");
const input = path.join(publicDir, "VG1.mp4");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const only = onlyArg ? onlyArg.split("=")[1] : "all";

if (!fs.existsSync(input)) {
  console.error("No se encontró public/VG1.mp4");
  process.exit(1);
}

function runFfmpeg(label, args, output) {
  console.log(`Comprimiendo ${label}…`);
  const result = spawnSync(ffmpegPath, args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`ffmpeg falló (${label}) con código`, result.status);
    process.exit(result.status ?? 1);
  }
  const sizeMb = (fs.statSync(output).size / (1024 * 1024)).toFixed(2);
  console.log(`OK ${path.basename(output)} (${sizeMb} MB)`);
}

const mobileOut = path.join(publicDir, "VG1-mobile.mp4");
const fourKOut = path.join(publicDir, "VG1-4k.mp4");

if (only === "all" || only === "mobile") {
  runFfmpeg("móvil", [
    "-y",
    "-i",
    input,
    "-vf",
    "scale=-2:720",
    "-c:v",
    "libx264",
    "-crf",
    "28",
    "-preset",
    "medium",
    "-movflags",
    "+faststart",
    "-an",
    mobileOut,
  ], mobileOut);
}

if (only === "all" || only === "4k") {
  // 2× del master 1260×1080 → 2520×2160 (cubre 4K con object-cover)
  runFfmpeg("4K", [
    "-y",
    "-i",
    input,
    "-vf",
    "scale=2520:2160:flags=lanczos,unsharp=3:3:0.6:3:3:0.0",
    "-c:v",
    "libx264",
    "-profile:v",
    "high",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "20",
    "-preset",
    "medium",
    "-movflags",
    "+faststart",
    "-an",
    fourKOut,
  ], fourKOut);
}
