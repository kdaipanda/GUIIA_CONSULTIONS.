const fs = require("fs");
const appPath = "F:/Versiones/SV.003-main/SV.003-main/frontend/src/App.js";
let lines = fs.readFileSync(appPath, "utf8").split(/\r?\n/);
const start = lines.findIndex((l) => l.startsWith("// Medical Image Interpretation"));
const end = lines.findIndex((l) => l === "export default App;");
if (start === -1 || end === -1 || end <= start) {
  console.error("markers", start, end);
  process.exit(1);
}
lines = [...lines.slice(0, start), ...lines.slice(end)];
fs.writeFileSync(appPath, lines.join("\n"), "utf8");
console.log("removed medical images block");
