const fs = require("fs"), path = require("path");
const filePath = path.join(__dirname, "pages", "index.js");
let src = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

// 1. Actualizar import de persistencia para incluir calcConfianzaDiagnostico
src = src.replace(
  `import { usePersistencia, PanelHistorial } from "../lib/persistencia";`,
  `import { usePersistencia, PanelHistorial, calcConfianzaDiagnostico } from "../lib/persistencia";`
);

// 2. Eliminar la función duplicada (lines 49-81 aprox)
const START = "\nfunction calcConfianzaDiagnostico(form, motor) {";
const END   = "\n\n\nexport default function Page()";

const iStart = src.indexOf(START);
const iEnd   = src.indexOf(END);

if (iStart === -1) { console.error("ERROR: no encontré START"); process.exit(1); }
if (iEnd   === -1) { console.error("ERROR: no encontré END");   process.exit(1); }

src = src.slice(0, iStart) + "\n\nexport default function Page()" + src.slice(iEnd + END.length);

console.log(`✓ Eliminados ${iEnd - iStart} chars de función duplicada`);

src = src.replace(/\n/g, "\r\n");
fs.writeFileSync(filePath, src, "utf8");
console.log("✓ index.js actualizado");
