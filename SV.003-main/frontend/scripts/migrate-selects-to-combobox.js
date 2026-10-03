const fs = require("fs");
const path = require("path");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "build") continue;
      walk(p, out);
    } else if (/\.(jsx?|tsx?)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function findLastImportIndex(lines) {
  let lastImport = -1;
  let inMulti = false;
  for (let j = 0; j < Math.min(lines.length, 120); j += 1) {
    const line = lines[j];
    if (/^import\s/.test(line)) {
      lastImport = j;
      inMulti = line.includes("{") && !line.includes("}");
      if (line.includes("} from") || (line.includes("from ") && line.includes(";"))) {
        inMulti = false;
      }
    } else if (inMulti) {
      lastImport = j;
      if (line.includes("} from") || (line.includes("from ") && line.includes(";"))) {
        inMulti = false;
      }
    } else if (lastImport >= 0) {
      break;
    }
  }
  return lastImport;
}

function importPathFor(file) {
  const relFromSrc = path.relative(path.join(process.cwd(), "src"), file);
  const dir = path.dirname(relFromSrc);
  const parts = dir === "." ? [] : dir.split(path.sep);
  const up = parts.length === 0 ? "./" : "../".repeat(parts.length);
  return `${up}components/ui/combobox`.replace(/\\/g, "/");
}

const files = walk(path.join(process.cwd(), "src"));
let changedFiles = 0;
let replaced = 0;

for (const file of files) {
  if (file.includes(`${path.sep}ui${path.sep}combobox`)) continue;
  let src = fs.readFileSync(file, "utf8");
  if (!/<select\b/.test(src)) continue;

  const before = src;
  const count = (before.match(/<select\b/g) || []).length;
  src = src.replace(/<select(\s|>)/g, "<FormCombobox$1");
  src = src.replace(/<\/select>/g, "</FormCombobox>");
  if (src === before) continue;

  const hasImport =
    /from\s+['"][^'"]*components\/ui\/combobox['"]/.test(src) ||
    /from\s+['"]@\/components\/ui\/combobox['"]/.test(src);

  if (!hasImport) {
    const imp = `import { FormCombobox } from "${importPathFor(file)}";`;
    const lines = src.split("\n");
    const lastImport = findLastImportIndex(lines);
    if (lastImport >= 0) {
      lines.splice(lastImport + 1, 0, imp);
      src = lines.join("\n");
    } else {
      src = `${imp}\n${src}`;
    }
  }

  fs.writeFileSync(file, src);
  changedFiles += 1;
  replaced += count;
  console.log(`updated ${path.relative(process.cwd(), file)} (${count})`);
}

console.log(`DONE files=${changedFiles} selects=${replaced}`);
