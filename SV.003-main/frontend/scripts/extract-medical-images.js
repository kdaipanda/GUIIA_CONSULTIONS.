const fs = require("fs");
const appPath = "F:/Versiones/SV.003-main/SV.003-main/frontend/src/App.js";
const outPath = "F:/Versiones/SV.003-main/SV.003-main/frontend/src/pages/MedicalImagesPage.jsx";
const lines = fs.readFileSync(appPath, "utf8").split(/\r?\n/);
const start = lines.findIndex((l) => l.startsWith("const MedicalImageInterpretation"));
if (start === -1) {
  console.error("start not found");
  process.exit(1);
}
let endIdx = start;
let depth = 0;
for (let i = start; i < lines.length; i++) {
  const open = (lines[i].match(/\{/g) || []).length;
  const close = (lines[i].match(/\}/g) || []).length;
  depth += open - close;
  if (i > start && depth === 0 && lines[i].trim() === "};") {
    endIdx = i;
    break;
  }
}
const body = lines.slice(start + 1, endIdx).join("\n");
const header = [
  'import React, { useState, useEffect } from "react";',
  'import { Crown, FlaskConical } from "lucide-react";',
  'import { useVet } from "../context/VetContext";',
  'import { BACKEND_URL } from "../lib/backendUrl";',
  'import { getAuthHeaders } from "../lib/authHeaders";',
  'import { cleanClinicalDisplayText } from "../lib/consultationPdf";',
  'import { PatientSelector } from "../components/clinic/PatientSelector";',
  'import { Button } from "../components/ui/button";',
  'import { Textarea } from "../components/ui/textarea";',
  'import "./medicalImagesPage.css";',
  "",
  "export function MedicalImagesPage({ setView }) {",
  "",
].join("\n");
fs.writeFileSync(outPath, header + body + "\n}\n", "utf8");
console.log("extracted", endIdx - start + 1, "lines");
