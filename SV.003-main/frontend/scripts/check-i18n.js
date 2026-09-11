const fs = require("fs");
const path = require("path");

const localesDir = path.join(__dirname, "../src/i18n/locales");
const srcDir = path.join(__dirname, "../src");
const locales = ["en", "es"];
const namespaces = [
  "common",
  "landing",
  "auth",
  "clinic",
  "help",
  "speciesForms",
  "legal",
  "pdf",
];

function flattenKeys(obj, prefix = "") {
  const keys = [];
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const next = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) keys.push(...flattenKeys(v, next));
      else keys.push(next);
    }
  }
  return keys;
}

function getByPath(obj, keyPath) {
  return keyPath.split(".").reduce((acc, part) => (acc && acc[part] != null ? acc[part] : undefined), obj);
}

function walkFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", "build"].includes(entry.name)) walkFiles(full, acc);
    } else if (/\.(js|jsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

const loaded = {};
const allEnKeys = new Map();
const jsonErrors = [];
const parityIssues = [];

for (const ns of namespaces) {
  loaded[ns] = {};
  for (const loc of locales) {
    const filePath = path.join(localesDir, loc, `${ns}.json`);
    try {
      loaded[ns][loc] = JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (err) {
      jsonErrors.push({ file: filePath, error: err.message });
    }
  }
  if (!loaded[ns].en || !loaded[ns].es) continue;
  for (const key of flattenKeys(loaded[ns].en)) allEnKeys.set(`${ns}:${key}`, true);
  const enKeys = new Set(flattenKeys(loaded[ns].en));
  const esKeys = new Set(flattenKeys(loaded[ns].es));
  for (const key of enKeys) if (!esKeys.has(key)) parityIssues.push({ ns, key, missingIn: "es" });
  for (const key of esKeys) if (!enKeys.has(key)) parityIssues.push({ ns, key, missingIn: "en" });
}

function keyExists(rawKey) {
  if (rawKey.includes(":")) {
    const [ns, key] = rawKey.split(":", 2);
    return getByPath(loaded[ns]?.en, key) !== undefined;
  }
  return namespaces.some((ns) => getByPath(loaded[ns]?.en, rawKey) !== undefined);
}

const missing = new Map();
const tPattern = /\b(?:t|tSpecies|tClinic|tAuth|tLanding|tLegal|tPdf|i18n\.t)\s*\(\s*['"`]([^'"`]+)['"`]/g;

for (const file of walkFiles(srcDir)) {
  const content = fs.readFileSync(file, "utf8");
  for (const match of content.matchAll(tPattern)) {
    const raw = match[1];
    if (raw.includes("${") || raw.includes("{{") || raw.includes("+")) continue;
    if (!keyExists(raw)) {
      missing.set(raw, path.relative(srcDir, file));
    }
  }
}

// Empty or suspicious values in locale files
const emptyValues = [];
for (const ns of namespaces) {
  for (const loc of locales) {
    const data = loaded[ns]?.[loc];
    if (!data) continue;
    for (const key of flattenKeys(data)) {
      const val = getByPath(data, key);
      if (val === "" || val === "TODO" || val === "FIXME" || val === "undefined") {
        emptyValues.push({ ns, loc, key, val });
      }
    }
  }
}

console.log("=== i18n audit ===\n");
console.log(jsonErrors.length ? `JSON syntax errors: ${jsonErrors.length}` : "JSON syntax: OK");
console.log(parityIssues.length ? `ES/EN parity issues: ${parityIssues.length}` : "ES/EN parity: OK");

if (parityIssues.length) {
  parityIssues.slice(0, 15).forEach((i) => console.log(`  - ${i.ns}.${i.key} missing in ${i.missingIn}`));
}

if (missing.size) {
  console.log(`\nMissing translation keys: ${missing.size}`);
  [...missing.entries()].slice(0, 25).forEach(([key, file]) => console.log(`  - ${key} (${file})`));
  if (missing.size > 25) console.log(`  ... +${missing.size - 25} more`);
} else {
  console.log("Referenced keys: OK");
}

if (emptyValues.length) {
  console.log(`\nSuspicious empty/placeholder values: ${emptyValues.length}`);
  emptyValues.slice(0, 10).forEach((v) => console.log(`  - [${v.loc}/${v.ns}] ${v.key}`));
}

const totalKeys = [...namespaces].reduce((n, ns) => n + flattenKeys(loaded[ns]?.en || {}).length, 0);
console.log(`\nTotal keys per locale: ${totalKeys} across ${namespaces.length} namespaces`);

process.exit(jsonErrors.length || parityIssues.length || missing.size ? 1 : 0);
