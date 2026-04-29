const fs = require("fs"), path = require("path");
const filePath = path.join(__dirname, "pages", "index.js");
let src = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

// 1. Botón ✕ eliminar fila de potrero
src = src.replace(
  `<button onClick={()=>setPotreros(ps=>ps.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontFamily:C.font, fontSize:12 }}>✕</button>`,
  `<button aria-label="Eliminar potrero" onClick={()=>setPotreros(ps=>ps.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontFamily:C.font, fontSize:12 }}>✕</button>`
);

// 2. Botón ✕ descartar borrador recuperado
src = src.replace(
  `<button onClick={() => setBorradorRecuperado(false)}\n              style={{ background:"none", border:"none", color:C.textFaint,\n                fontSize:14, cursor:"pointer", padding:"0 4px" }}>✕</button>`,
  `<button aria-label="Descartar aviso" onClick={() => setBorradorRecuperado(false)}\n              style={{ background:"none", border:"none", color:C.textFaint,\n                fontSize:14, cursor:"pointer", padding:"0 4px" }}>✕</button>`
);

// 3. Botón ✕ cerrar banner productora
src = src.replace(
  `<button onClick={() => setBannerProductor(null)}\n            style={{ background:"none", border:"none", color:C.textFaint,\n              cursor:"pointer", fontSize:16, flexShrink:0, padding:"0 4px" }}>✕</button>`,
  `<button aria-label="Cerrar aviso" onClick={() => setBannerProductor(null)}\n            style={{ background:"none", border:"none", color:C.textFaint,\n              cursor:"pointer", fontSize:16, flexShrink:0, padding:"0 4px" }}>✕</button>`
);

// 4. Agregar role="main" al contenedor principal de la app
// El div principal de Page() — buscar el wrapper exterior
src = src.replace(
  `<div style={{ minHeight:"100vh", background:C.bg, fontFamily:C.sans }}>`,
  `<main role="main" style={{ minHeight:"100vh", background:C.bg, fontFamily:C.sans }}>`
);
src = src.replace(
  // closing tag correspondiente — hay exactamente un </div> que cierra ese div al final del return
  // buscamos la secuencia específica al final del componente
  `    </div>\n  );\n}\n`,
  `    </main>\n  );\n}\n`
);

src = src.replace(/\n/g, "\r\n");
fs.writeFileSync(filePath, src, "utf8");
console.log("✓ a11y aplicado en index.js");
