const fs = require("fs"), path = require("path");
const filePath = path.join(__dirname, "pages", "index.js");
let src = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

// ── 1. Reemplazar el bloque de <style> ──────────────────────────────────────
const OLD_STYLE_START = "      <style>{`";
const OLD_STYLE_END   = "      `}</style>";

const iStart = src.indexOf(OLD_STYLE_START);
const iEnd   = src.indexOf(OLD_STYLE_END) + OLD_STYLE_END.length;

if (iStart === -1 || iEnd === -1) { console.error("No encontré <style>"); process.exit(1); }

const NEW_STYLE = `      <style>{\`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html { color-scheme: dark; }

        /* ── Inputs y selects — dark theme ─────────────────────────── */
        select, input[type=text], input[type=number], input[type=date], textarea {
          background: #1a2a16 !important;
          color: #d6e8d0 !important;
          border: 1px solid #253b1f !important;
          border-radius: 8px;
        }
        select option { background: #1a2a16; color: #d6e8d0; }
        select:focus, input[type=text]:focus, input[type=number]:focus,
        input[type=date]:focus, textarea:focus {
          outline: 2px solid #5cb83a !important;
          outline-offset: 1px;
          border-color: #3c5c34 !important;
        }
        select:hover, input[type=text]:hover, input[type=number]:hover,
        input[type=date]:hover {
          border-color: #3c5c34 !important;
        }

        /* ── Scrollbar ──────────────────────────────────────────────── */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0d1a0b; }
        ::-webkit-scrollbar-thumb { background: #3c5c34; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #5cb83a; }
        * { scrollbar-width: thin; scrollbar-color: #3c5c34 #0d1a0b; }

        /* ── Botones ────────────────────────────────────────────────── */
        button { transition: opacity .14s, transform .1s, background .14s, box-shadow .14s; }
        button:hover:not(:disabled) { opacity: .88; }
        button:active:not(:disabled) { transform: scale(0.97); }
        button:disabled { opacity: .4; cursor: not-allowed; }

        /* ── Range inputs ───────────────────────────────────────────── */
        input[type=range] { accent-color: #5cb83a; }
        input[type=range]::-webkit-slider-thumb { width: 18px; height: 18px; }

        /* ── Details/summary ────────────────────────────────────────── */
        details > summary::-webkit-details-marker { display: none; }
        details > summary { cursor: pointer; }

        /* ── Animaciones de step ────────────────────────────────────── */
        .calfai-step { animation: stepIn .18s ease-out; }
        @keyframes stepIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Tabs scrollbar oculto ──────────────────────────────────── */
        .calfai-tabs::-webkit-scrollbar { display: none; }
        .calfai-tabs { -ms-overflow-style: none; scrollbar-width: none; }

        /* ── Layout grids ───────────────────────────────────────────── */
        .diag-grid { display: grid; gap: 0; }
        @media (min-width: 1200px) {
          .diag-grid { grid-template-columns: 440px 1fr; gap: 32px; align-items: start; }
          .diag-sticky { position: sticky; top: 80px; max-height: calc(100vh - 100px); overflow-y: auto; scrollbar-width: thin; }
        }
        .reco-grid { display: grid; gap: 0; }
        @media (min-width: 1200px) {
          .reco-grid { grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
        }

        /* ── Checkbox ───────────────────────────────────────────────── */
        input[type=checkbox] { accent-color: #5cb83a; width: 14px; height: 14px; }
      \`}</style>`;

src = src.slice(0, iStart) + NEW_STYLE + src.slice(iEnd);
console.log("✓ <style> reemplazado");

// ── 2. Mejorar el header ──────────────────────────────────────────────────
const OLD_HEADER = `      {/* Header sticky */}
      <div style={{ background:C.card, borderBottom:\`1px solid \${C.border}\`, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:1400, margin:"0 auto", padding:"10px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:C.font, fontSize:16, color:C.green, letterSpacing:2, fontWeight:700 }}>
            CALF AI<span style={{ color:C.textDim, fontSize:10, marginLeft:6 }}>v1</span>
          </div>`;

const NEW_HEADER = `      {/* Header sticky */}
      <div style={{ background:C.card, borderBottom:\`1px solid \${C.border}\`, position:"sticky", top:0, zIndex:50, boxShadow:C.sh.sm }}>
        <div style={{ maxWidth:1400, margin:"0 auto", padding:"12px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:C.font, fontSize:15, color:C.green, letterSpacing:3, fontWeight:700, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:18 }}>◈</span>
            CALF AI<span style={{ color:C.textFaint, fontSize:10, marginLeft:8, letterSpacing:1, fontWeight:400 }}>diagnóstico bovino</span>
          </div>`;

if (src.includes(OLD_HEADER)) {
  src = src.replace(OLD_HEADER, NEW_HEADER);
  console.log("✓ Header actualizado");
} else {
  console.warn("⚠ Header no encontrado — verificar manualmente");
}

// ── 3. Mejorar los tabs de navegación ────────────────────────────────────
const OLD_TABS_WRAP = `        {/* Tab nav horizontal */}
        <div className="calfai-tabs" style={{ maxWidth:1400, margin:"0 auto", display:"flex", overflowX:"auto", borderTop:\`1px solid \${C.border}\` }}>`;

const NEW_TABS_WRAP = `        {/* Tab nav horizontal */}
        <div className="calfai-tabs" style={{ maxWidth:1400, margin:"0 auto", display:"flex", overflowX:"auto", borderTop:\`1px solid \${C.border}\`, padding:"0 20px" }}>`;

if (src.includes(OLD_TABS_WRAP)) {
  src = src.replace(OLD_TABS_WRAP, NEW_TABS_WRAP);
  console.log("✓ Tabs wrapper actualizado");
}

const OLD_TAB_BTN = `              <button key={i} onClick={()=>setStep(i)} style={{
                flex:"0 0 auto", padding:"10px 20px",
                background:"none", border:"none",
                borderBottom: active ? \`2px solid \${C.green}\` : "2px solid transparent",
                color: active ? C.green : C.textDim,
                fontFamily:C.font, fontSize:13,
                fontWeight: active ? 700 : 400,
                cursor:"pointer", whiteSpace:"nowrap",
                position:"relative",
              }}>`;

const NEW_TAB_BTN = `              <button key={i} onClick={()=>setStep(i)} style={{
                flex:"0 0 auto", padding:"13px 22px",
                background: active ? C.green+"16" : "none", border:"none",
                borderBottom: active ? \`2px solid \${C.green}\` : "2px solid transparent",
                color: active ? C.green : C.textDim,
                fontFamily:C.font, fontSize:13,
                fontWeight: active ? 600 : 400,
                cursor:"pointer", whiteSpace:"nowrap",
                position:"relative", letterSpacing: active ? ".3px" : 0,
                transition:"background .15s, color .15s",
              }}>`;

if (src.includes(OLD_TAB_BTN)) {
  src = src.replace(OLD_TAB_BTN, NEW_TAB_BTN);
  console.log("✓ Tab buttons actualizados");
}

// ── 4. Más breathing room en el contenedor de step content ───────────────
const OLD_STEP_WRAP = `      <div style={{ maxWidth:1400, margin:"0 auto", padding:"24px 20px 48px" }}>`;
const NEW_STEP_WRAP = `      <div style={{ maxWidth:1400, margin:"0 auto", padding:"32px 28px 64px" }}>`;

if (src.includes(OLD_STEP_WRAP)) {
  src = src.replace(OLD_STEP_WRAP, NEW_STEP_WRAP);
  console.log("✓ Step content wrapper actualizado");
}

// ── 5. Pantalla de login mejorada ─────────────────────────────────────────
const OLD_LOGIN = `  if (!session) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ fontFamily:C.font, fontSize:28, color:C.green, marginBottom:8, letterSpacing:2 }}>🌾 CALF AI</div>
      <div style={{ fontFamily:C.sans, fontSize:13, color:C.textDim, marginBottom:32 }}>Diagnóstico de cría bovina</div>
      <button onClick={()=>signIn("google")} style={{ background:C.green, color:"#0b1a0c", padding:"14px 28px", borderRadius:12, border:"none", fontFamily:C.sans, fontSize:15, fontWeight:700, cursor:"pointer" }}>
        Iniciar sesión con Google
      </button>
    </div>
  );`;

const NEW_LOGIN = `  if (!session) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ marginBottom:48, textAlign:"center" }}>
        <div style={{ fontFamily:C.font, fontSize:13, color:C.textFaint, letterSpacing:4, marginBottom:16, textTransform:"uppercase" }}>Diagnóstico bovino</div>
        <div style={{ fontFamily:C.font, fontSize:42, color:C.green, letterSpacing:6, fontWeight:700, lineHeight:1 }}>CALF AI</div>
        <div style={{ width:48, height:2, background:C.green+"44", margin:"16px auto 0" }} />
      </div>
      <div style={{ background:C.card, border:\`1px solid \${C.border}\`, borderRadius:16, padding:"32px 40px", textAlign:"center", boxShadow:C.sh.lg }}>
        <div style={{ fontFamily:C.sans, fontSize:14, color:C.textDim, marginBottom:24, lineHeight:1.6 }}>
          Ingresá con tu cuenta institucional para<br/>acceder al sistema de diagnóstico
        </div>
        <button onClick={()=>signIn("google")} style={{
          background:C.green, color:C.card, padding:"13px 32px", borderRadius:10,
          border:"none", fontFamily:C.sans, fontSize:14, fontWeight:700, cursor:"pointer",
          letterSpacing:".3px", boxShadow:\`0 4px 16px \${C.green}44\`,
        }}>
          Iniciar sesión con Google
        </button>
        <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint, marginTop:20 }}>
          INTA · AgroMind Pro · v2025
        </div>
      </div>
    </div>
  );`;

if (src.includes(OLD_LOGIN)) {
  src = src.replace(OLD_LOGIN, NEW_LOGIN);
  console.log("✓ Login screen actualizado");
} else {
  console.warn("⚠ Login screen no encontrado");
}

src = src.replace(/\n/g, "\r\n");
fs.writeFileSync(filePath, src, "utf8");
console.log("✓ index.js guardado");
