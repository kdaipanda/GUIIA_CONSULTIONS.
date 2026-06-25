/**
 * Genera VG1-mobile.mp4 (~4 MB) desde public/VG1.mp4 para el hero en móvil.
 * Uso: node scripts/compress_hero_video.js
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const publicDir = path.join(__dirname, "..", "public");
const input = path.join(publicDir, "VG1.mp4");
const output = path.join(publicDir, "VG1-mobile.mp4");

if (!fs.existsSync(input)) {
  console.error("No se encontró public/VG1.mp4");
  process.exit(1);
}

const args = [
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
  output,
];

console.log("Comprimiendo hero video para móvil…");
const result = spawnSync(ffmpegPath, args, { stdio: "inherit" });

if (result.status !== 0) {
  console.error("ffmpeg falló con código", result.status);
  process.exit(result.status ?? 1);
}

const sizeMb = (fs.statSync(output).size / (1024 * 1024)).toFixed(2);
console.log(`OK VG1-mobile.mp4 (${sizeMb} MB)`);
