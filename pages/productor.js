import React, { useState, useEffect } from "react";

// ─── TEMA — mismo dark que AgroMind Pro ──────────────────────────
const C = {
  bg:       "#0b1a0c",
  card:     "#111f12",
  card2:    "#162118",
  border:   "rgba(126,200,80,.18)",
  green:    "#7ec850",
  amber:    "#e8a030",
  red:      "#e05530",
  blue:     "#5aaff0",
  text:     "#d4ecd5",
  textDim:  "#8aab8b",
  textFaint:"#4a6b4b",
  font:     "'IBM Plex Mono', monospace",
  sans:     "'IBM Plex Sans', sans-serif",
};

// ─── PROVINCIAS NEA/NOA (las más comunes) ────────────────────────
const PROVINCIAS = [
  "Corrientes","Chaco","Formosa","Entre Ríos","Santa Fe",
  "Santiago del Estero","Salta","Córdoba","Buenos Aires","La Pampa",
  "Paraguay Oriental","Chaco Paraguayo",
  "Mato Grosso do Sul (BR)","Mato Grosso / Goiás (BR)",
  "Santa Cruz / Beni (BO)","Tarija / Chaco (BO)",
];

const BIOTIPOS = [
  "Brangus 3/8","Brangus 5/8",
  "Braford 3/8","Braford 5/8",
  "Hereford","Aberdeen Angus",
  "Nelore","Brahman","Indobrasil",
];

const PASTOS = [
  ["Pastizal natural NEA/Chaco", "Pastizal natural"],
  ["Megatérmicas C4 (gatton panic, brachiaria)", "Gatton panic / Brachiaria"],
  ["Pasturas templadas C3", "Pasturas templadas"],
  ["Mixta gramíneas+leguminosas", "Mixta gramíneas + leguminosas"],
  ["Bosque nativo", "Bosque nativo"],
];

const MESES_OPT = [
  ["01","Enero"],["02","Febrero"],["03","Marzo"],["04","Abril"],
  ["05","Mayo"],["06","Junio"],["07","Julio"],["08","Agosto"],
  ["09","Septiembre"],["10","Octubre"],["11","Noviembre"],["12","Diciembre"],
];

// ─── PASOS DEL FORMULARIO ────────────────────────────────────────
const PASOS = [
  { id:"campo",   label:"El campo",    icon:"🌾" },
  { id:"rodeo",   label:"El rodeo",    icon:"🐄" },
  { id:"manejo",  label:"Manejo",      icon:"📅" },
  { id:"sanidad", label:"Sanidad",     icon:"🩺" },
  { id:"listo",   label:"Listo",       icon:"✅" },
];

// ─── COMPONENTES UI ──────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim,
      letterSpacing:1, marginBottom:6, display:"flex", gap:4 }}>
      {children}
      {required && <span style={{ color:C.red }}>*</span>}
    </div>
  );
}

function Field({ label, required, children, sub }) {
  return (
    <div style={{ marginBottom:16 }}>
      <Label required={required}>{label}</Label>
      {children}
      {sub && <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type="text" }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width:"100%", background:C.card2, border:"1px solid "+C.border,
        borderRadius:10, color:C.text, padding:"12px 14px",
        fontFamily:C.sans, fontSize:14, boxSizing:"border-box",
        outline:"none", WebkitAppearance:"none" }}
    />
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width:"100%", background:C.card2, border:"1px solid "+C.border,
        borderRadius:10, color: value ? C.text : C.textFaint,
        padding:"12px 14px", fontFamily:C.sans, fontSize:14,
        outline:"none", WebkitAppearance:"none", appearance:"none",
        backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238aab8b' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
        backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center",
        paddingRight:36 }}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function Toggle({ label, value, onChange, sub }) {
  return (
    <Field label={label} sub={sub}>
      <div style={{ display:"flex", gap:6 }}>
        {[["si","Sí ✓"],["no","No"]].map(([v,l]) => (
          <button key={v} onClick={() => onChange(v)}
            style={{ flex:1, padding:"10px 0", borderRadius:10, cursor:"pointer", border:"none",
              background: value === v ? (v==="si" ? C.green+"30" : C.red+"20") : C.card2,
              border: "1px solid " + (value === v ? (v==="si" ? C.green+"60" : C.red+"40") : C.border),
              color: value === v ? (v==="si" ? C.green : C.red) : C.textDim,
              fontFamily:C.font, fontSize:11, fontWeight: value === v ? 700 : 400 }}>
            {l}
          </button>
        ))}
      </div>
    </Field>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────────
export default function Productor() {
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState({
    nombreProductor: "",
    localidad: "",
    provincia: "",
    biotipo: "",
    vacasN: "",
    torosN: "",
    iniServ: "",
    finServ: "",
    vegetacion: "",
    supHa: "",
    sanAftosa: "",
    sanBrucelosis: "",
    sanToros: "",
    aguaFuente: "",
    consultaEspecifica: "",
  });
  const [link, setLink] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [errores, setErrores] = useState({});

  const set = (k, v) => setDatos(d => ({ ...d, [k]:v }));

  // Generar link con datos codificados en base64
  const generarLink = () => {
    const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(datos))));
    const url = window.location.origin + "/?productor=" + base64;
    setLink(url);
  };

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // fallback: seleccionar el texto
      const el = document.getElementById("link-text");
      if (el) { el.select(); document.execCommand("copy"); }
    }
  };

  const compartirWhatsApp = () => {
    const texto = "Hola! Te mando el link para completar el análisis del establecimiento con AgroMind Pro. " +
      "Son 2 minutos:\n\n" + link;
    window.open("https://wa.me/?text=" + encodeURIComponent(texto));
  };

  // Validar paso actual
  const validarPaso = () => {
    const e = {};
    if (paso === 0) {
      if (!datos.nombreProductor) e.nombreProductor = "Requerido";
      if (!datos.provincia)       e.provincia = "Requerido";
    }
    if (paso === 1) {
      if (!datos.vacasN)   e.vacasN = "Requerido";
      if (!datos.biotipo)  e.biotipo = "Requerido";
    }
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const avanzar = () => {
    if (!validarPaso()) return;
    if (paso === PASOS.length - 2) {
      generarLink();
    }
    setPaso(p => Math.min(p + 1, PASOS.length - 1));
  };

  const volver = () => {
    setErrores({});
    setPaso(p => Math.max(p - 1, 0));
  };

  // Selector de fechas de servicio
  const hoy = new Date();
  const anioAct = hoy.getFullYear();
  const ANIOS = [anioAct-1, anioAct, anioAct+1].map(a => [String(a), String(a)]);

  const getMes  = (v) => v ? v.slice(5,7) : "";
  const getAnio = (v) => v ? v.slice(0,4) : "";
  const setFecha = (campo, mes, anio) => {
    if (mes && anio) set(campo, anio + "-" + mes + "-01");
    else set(campo, "");
  };

  const iniMes  = getMes(datos.iniServ);
  const iniAnio = getAnio(datos.iniServ);
  const finMes  = getMes(datos.finServ);
  const finAnio = getAnio(datos.finServ);

  // Calcular días de servicio
  const diasServ = datos.iniServ && datos.finServ
    ? Math.round((new Date(datos.finServ+"T12:00:00") - new Date(datos.iniServ+"T12:00:00")) / 86400000)
    : null;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, paddingBottom:80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=IBM+Plex+Sans:wght@400;600;700&display=swap');
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        select, input, button, textarea { outline:none; }
        input::placeholder { color: #4a6b4b; }
        textarea::placeholder { color: #4a6b4b; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background:C.card, borderBottom:"1px solid "+C.border,
        padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontFamily:C.font, fontSize:13, color:C.green, letterSpacing:2, fontWeight:700 }}>
            🌾 AGROMIND
          </div>
          <div style={{ fontFamily:C.sans, fontSize:10, color:C.textFaint, marginTop:1 }}>
            Formulario del productor
          </div>
        </div>
        <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>
          {paso < PASOS.length - 1 ? `Paso ${paso + 1} de ${PASOS.length - 1}` : ""}
        </div>
      </div>

      {/* ── BARRA DE PROGRESO ── */}
      {paso < PASOS.length - 1 && (
        <div style={{ padding:"12px 20px 0" }}>
          <div style={{ height:3, background:C.card2, borderRadius:2, overflow:"hidden" }}>
            <div style={{ height:"100%", background:C.green,
              width: ((paso + 1) / (PASOS.length - 1) * 100) + "%",
              transition:"width 0.4s ease", borderRadius:2 }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
            {PASOS.slice(0,-1).map((p, i) => (
              <div key={p.id} style={{ fontFamily:C.font, fontSize:8,
                color: i <= paso ? C.green : C.textFaint, fontWeight: i === paso ? 700 : 400 }}>
                {p.icon} {p.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONTENIDO ── */}
      <div style={{ maxWidth:480, margin:"0 auto", padding:"20px 20px" }}>

        {/* PASO 0 — El campo */}
        {paso === 0 && (
          <div>
            <div style={{ fontFamily:C.font, fontSize:16, color:C.text, fontWeight:700, marginBottom:4 }}>
              El campo
            </div>
            <div style={{ fontFamily:C.sans, fontSize:12, color:C.textDim, marginBottom:20 }}>
              Datos básicos del establecimiento
            </div>

            <Field label="NOMBRE O RAZÓN SOCIAL" required>
              <TextInput value={datos.nombreProductor} onChange={v => set("nombreProductor",v)}
                placeholder="Estancia / Nombre del productor" />
              {errores.nombreProductor && (
                <div style={{ fontFamily:C.font, fontSize:9, color:C.red, marginTop:4 }}>⚠ {errores.nombreProductor}</div>
              )}
            </Field>

            <Field label="LOCALIDAD">
              <TextInput value={datos.localidad} onChange={v => set("localidad",v)}
                placeholder="Ej: Chavarría" />
            </Field>

            <Field label="PROVINCIA / REGIÓN" required>
              <Select value={datos.provincia} onChange={v => set("provincia",v)}
                placeholder="Seleccionar..."
                options={PROVINCIAS.map(p => [p,p])} />
              {errores.provincia && (
                <div style={{ fontFamily:C.font, fontSize:9, color:C.red, marginTop:4 }}>⚠ {errores.provincia}</div>
              )}
            </Field>

            <Field label="SUPERFICIE GANADERA (ha)">
              <TextInput value={datos.supHa} onChange={v => set("supHa",v)}
                placeholder="" type="number" />
            </Field>

            <Field label="TIPO DE PASTO PREDOMINANTE">
              <Select value={datos.vegetacion} onChange={v => set("vegetacion",v)}
                placeholder="Seleccionar..."
                options={PASTOS} />
            </Field>

            <Field label="FUENTE DE AGUA" sub="Importante para evaluar calidad del agua">
              <Select value={datos.aguaFuente} onChange={v => set("aguaFuente",v)}
                placeholder="Seleccionar..."
                options={[
                  ["Laguna o bañado", "Laguna o bañado"],
                  ["Pozo surgente", "Pozo surgente"],
                  ["Perforación con molino", "Perforación con molino"],
                  ["Aguada natural (arroyo/río)", "Aguada natural"],
                  ["Mixta", "Mixta"],
                ]} />
            </Field>
          </div>
        )}

        {/* PASO 1 — El rodeo */}
        {paso === 1 && (
          <div>
            <div style={{ fontFamily:C.font, fontSize:16, color:C.text, fontWeight:700, marginBottom:4 }}>
              El rodeo
            </div>
            <div style={{ fontFamily:C.sans, fontSize:12, color:C.textDim, marginBottom:20 }}>
              Composición del rodeo actual
            </div>

            <Field label="BIOTIPO" required>
              <Select value={datos.biotipo} onChange={v => set("biotipo",v)}
                placeholder="Seleccionar..."
                options={BIOTIPOS.map(b => [b,b])} />
              {errores.biotipo && (
                <div style={{ fontFamily:C.font, fontSize:9, color:C.red, marginTop:4 }}>⚠ {errores.biotipo}</div>
              )}
            </Field>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Field label="VACAS (cab)" required>
                <TextInput value={datos.vacasN} onChange={v => set("vacasN",v)}
                  placeholder="" type="number" />
                {errores.vacasN && (
                  <div style={{ fontFamily:C.font, fontSize:9, color:C.red, marginTop:4 }}>⚠ {errores.vacasN}</div>
                )}
              </Field>
              <Field label="TOROS (cab)">
                <TextInput value={datos.torosN} onChange={v => set("torosN",v)}
                  placeholder="" type="number" />
              </Field>
            </div>

            {datos.vacasN && datos.torosN && (
              <div style={{ background: parseFloat(datos.vacasN)/parseFloat(datos.torosN) > 30 ? C.amber+"10" : C.green+"08",
                border:"1px solid "+(parseFloat(datos.vacasN)/parseFloat(datos.torosN) > 30 ? C.amber+"40" : C.green+"30"),
                borderRadius:8, padding:"8px 12px", marginBottom:12 }}>
                <span style={{ fontFamily:C.font, fontSize:10,
                  color:parseFloat(datos.vacasN)/parseFloat(datos.torosN) > 30 ? C.amber : C.green }}>
                  Relación toro/vaca: {Math.round(parseFloat(datos.vacasN)/parseFloat(datos.torosN))}:1
                  {parseFloat(datos.vacasN)/parseFloat(datos.torosN) > 30 ? " ⚠ alta" : " ✓ adecuada"}
                </span>
              </div>
            )}

            <Field label="PREÑEZ DE LA ÚLTIMA TEMPORADA (%)"
              sub="Si no la mediste, dejá vacío">
              <TextInput value={datos.prenez||""} onChange={v => set("prenez",v)}
                placeholder="" type="number" />
            </Field>
          </div>
        )}

        {/* PASO 2 — Manejo */}
        {paso === 2 && (
          <div>
            <div style={{ fontFamily:C.font, fontSize:16, color:C.text, fontWeight:700, marginBottom:4 }}>
              Manejo reproductivo
            </div>
            <div style={{ fontFamily:C.sans, fontSize:12, color:C.textDim, marginBottom:20 }}>
              Fechas del servicio actual o último
            </div>

            <Field label="INICIO DEL SERVICIO">
              <div style={{ display:"flex", gap:6 }}>
                <select value={iniMes} onChange={e => setFecha("iniServ", e.target.value, iniAnio||String(anioAct))}
                  style={{ flex:2, background:C.card2, border:"1px solid "+C.border, borderRadius:10,
                    color:iniMes?C.text:C.textFaint, padding:"12px 10px", fontFamily:C.sans, fontSize:13,
                    outline:"none", WebkitAppearance:"none", appearance:"none" }}>
                  <option value="">Mes</option>
                  {MESES_OPT.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select value={iniAnio} onChange={e => setFecha("iniServ", iniMes||"10", e.target.value)}
                  style={{ flex:1, background:C.card2, border:"1px solid "+C.border, borderRadius:10,
                    color:iniAnio?C.text:C.textFaint, padding:"12px 10px", fontFamily:C.sans, fontSize:13,
                    outline:"none", WebkitAppearance:"none", appearance:"none" }}>
                  <option value="">Año</option>
                  {ANIOS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </Field>

            <Field label="FIN DEL SERVICIO">
              <div style={{ display:"flex", gap:6 }}>
                <select value={finMes} onChange={e => setFecha("finServ", e.target.value, finAnio||String(anioAct))}
                  style={{ flex:2, background:C.card2, border:"1px solid "+C.border, borderRadius:10,
                    color:finMes?C.text:C.textFaint, padding:"12px 10px", fontFamily:C.sans, fontSize:13,
                    outline:"none", WebkitAppearance:"none", appearance:"none" }}>
                  <option value="">Mes</option>
                  {MESES_OPT.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select value={finAnio} onChange={e => setFecha("finServ", finMes||"01", e.target.value)}
                  style={{ flex:1, background:C.card2, border:"1px solid "+C.border, borderRadius:10,
                    color:finAnio?C.text:C.textFaint, padding:"12px 10px", fontFamily:C.sans, fontSize:13,
                    outline:"none", WebkitAppearance:"none", appearance:"none" }}>
                  <option value="">Año</option>
                  {ANIOS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </Field>

            {diasServ !== null && (
              <div style={{ fontFamily:C.font, fontSize:9, marginBottom:16, marginTop:-8,
                color: diasServ < 60 || diasServ > 95 ? C.amber : C.green }}>
                {diasServ < 60 ? "⚠ Servicio corto (" + diasServ + " días)"
                  : diasServ > 95 ? "⚠ Servicio largo (" + diasServ + " días)"
                  : "✓ Servicio de " + diasServ + " días"}
              </div>
            )}

            <Field label="¿ALGUNA CONSULTA O SITUACIÓN PARTICULAR?"
              sub="Ej: hubo abortos, toros nuevos, inundación, cambio de pasturas...">
              <textarea value={datos.consultaEspecifica} onChange={e => set("consultaEspecifica",e.target.value)}
                placeholder="Opcional — escribí lo que el veterinario debería saber"
                rows={3}
                style={{ width:"100%", background:C.card2, border:"1px solid "+C.border,
                  borderRadius:10, color:C.text, padding:"12px 14px",
                  fontFamily:C.sans, fontSize:13, resize:"none",
                  boxSizing:"border-box", outline:"none" }} />
            </Field>
          </div>
        )}

        {/* PASO 3 — Sanidad */}
        {paso === 3 && (
          <div>
            <div style={{ fontFamily:C.font, fontSize:16, color:C.text, fontWeight:700, marginBottom:4 }}>
              Sanidad
            </div>
            <div style={{ fontFamily:C.sans, fontSize:12, color:C.textDim, marginBottom:20 }}>
              Estado sanitario del rodeo
            </div>

            <Toggle label="¿AFTOSA AL DÍA?" value={datos.sanAftosa}
              onChange={v => set("sanAftosa",v)}
              sub="Vacunación obligatoria SENASA" />

            {datos.sanAftosa === "no" && (
              <div style={{ background:C.red+"10", border:"1px solid "+C.red+"30",
                borderRadius:8, padding:"8px 12px", marginBottom:12, marginTop:-8 }}>
                <span style={{ fontFamily:C.font, fontSize:9, color:C.red }}>
                  ⚠ Vacunación obligatoria — informar al veterinario en la próxima visita
                </span>
              </div>
            )}

            <Toggle label="¿BRUCELOSIS AL DÍA?" value={datos.sanBrucelosis}
              onChange={v => set("sanBrucelosis",v)}
              sub="Vacunación obligatoria en terneras 3–8 meses" />

            <Toggle label="¿SE HIZO REVISIÓN DE TOROS ANTES DEL SERVICIO?"
              value={datos.sanToros === "con_control" ? "si" : datos.sanToros === "sin_control" ? "no" : ""}
              onChange={v => set("sanToros", v === "si" ? "con_control" : "sin_control")}
              sub="Condición corporal, aplomos y prepucio" />

            {datos.sanToros === "sin_control" && (
              <div style={{ background:C.amber+"10", border:"1px solid "+C.amber+"30",
                borderRadius:8, padding:"8px 12px", marginBottom:12, marginTop:-8 }}>
                <span style={{ fontFamily:C.font, fontSize:9, color:C.amber }}>
                  Un toro con problema no detectado puede dejar 15–20 vacas vacías sin que se note hasta el tacto
                </span>
              </div>
            )}

            <Toggle label="¿HUBO ABORTOS EN EL ÚLTIMO AÑO?" value={datos.sanAbortos}
              onChange={v => set("sanAbortos",v)} />

            {datos.sanAbortos === "si" && (
              <div style={{ background:C.amber+"10", border:"1px solid "+C.amber+"30",
                borderRadius:8, padding:"8px 12px", marginBottom:12, marginTop:-8 }}>
                <span style={{ fontFamily:C.font, fontSize:9, color:C.amber }}>
                  Informar al veterinario — requiere diagnóstico diferencial (IBR/DVB/Leptospira/Brucelosis)
                </span>
              </div>
            )}
          </div>
        )}

        {/* PASO 4 — Listo */}
        {paso === 4 && (
          <div>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
              <div style={{ fontFamily:C.font, fontSize:16, color:C.green, fontWeight:700, marginBottom:8 }}>
                ¡Listo, {datos.nombreProductor.split(" ")[0] || "productor"}!
              </div>
              <div style={{ fontFamily:C.sans, fontSize:12, color:C.textDim, lineHeight:1.6 }}>
                Tu información está lista para que el veterinario la cargue en AgroMind Pro.
              </div>
            </div>

            {/* Resumen de datos */}
            <div style={{ background:C.card2, border:"1px solid "+C.border,
              borderRadius:12, padding:16, marginBottom:20 }}>
              <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint,
                letterSpacing:1, marginBottom:10 }}>RESUMEN</div>
              {[
                ["Establecimiento", datos.nombreProductor],
                ["Ubicación", [datos.localidad, datos.provincia].filter(Boolean).join(", ")],
                ["Biotipo", datos.biotipo],
                ["Vacas", datos.vacasN ? datos.vacasN + " cab" : "—"],
                ["Toros", datos.torosN ? datos.torosN + " cab" : "—"],
                ["Servicio", datos.iniServ && datos.finServ
                  ? new Date(datos.iniServ+"T12:00:00").toLocaleDateString("es-AR",{month:"short",year:"numeric"}) + " → " +
                    new Date(datos.finServ+"T12:00:00").toLocaleDateString("es-AR",{month:"short",year:"numeric"})
                  : "—"],
                ["Aftosa", datos.sanAftosa === "si" ? "Al día ✓" : datos.sanAftosa === "no" ? "Sin vacunar ⚠" : "—"],
                ["Brucelosis", datos.sanBrucelosis === "si" ? "Al día ✓" : datos.sanBrucelosis === "no" ? "Sin vacunar ⚠" : "—"],
                ["Rev. toros", datos.sanToros === "con_control" ? "Con revisión ✓" : datos.sanToros === "sin_control" ? "Sin revisión ⚠" : "—"],
              ].map(([k,v]) => v ? (
                <div key={k} style={{ display:"flex", justifyContent:"space-between",
                  padding:"5px 0", borderBottom:"1px solid "+C.border+"80" }}>
                  <span style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>{k}</span>
                  <span style={{ fontFamily:C.sans, fontSize:11, color:C.text }}>{v}</span>
                </div>
              ) : null)}
            </div>

            {/* Link generado */}
            {link && (
              <div>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint,
                  letterSpacing:1, marginBottom:8 }}>
                  LINK PARA EL VETERINARIO
                </div>
                <div style={{ background:C.card, border:"1px solid "+C.border,
                  borderRadius:10, padding:"10px 14px", marginBottom:10,
                  wordBreak:"break-all" }}>
                  <input id="link-text" readOnly value={link}
                    style={{ width:"100%", background:"transparent", border:"none",
                      color:C.textDim, fontFamily:C.font, fontSize:9,
                      outline:"none", cursor:"text" }} />
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <button onClick={copiarLink}
                    style={{ padding:"13px 0", borderRadius:10, cursor:"pointer",
                      background: copiado ? C.green+"20" : C.card2,
                      border:"1px solid "+(copiado ? C.green+"60" : C.border),
                      color: copiado ? C.green : C.textDim,
                      fontFamily:C.font, fontSize:11, fontWeight:700 }}>
                    {copiado ? "✓ Copiado" : "📋 Copiar link"}
                  </button>
                  <button onClick={compartirWhatsApp}
                    style={{ padding:"13px 0", borderRadius:10, cursor:"pointer",
                      background:C.green, border:"none",
                      color:"#0b1a0c", fontFamily:C.font, fontSize:11, fontWeight:700 }}>
                    📲 Enviar por WhatsApp
                  </button>
                </div>

                <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint,
                  marginTop:12, textAlign:"center", lineHeight:1.6 }}>
                  El veterinario abre este link en AgroMind Pro y tus datos se cargan automáticamente.
                  No necesitás instalar nada.
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BOTONES DE NAVEGACIÓN ── */}
        {paso < PASOS.length - 1 && (
          <div style={{ display:"flex", gap:8, marginTop:20 }}>
            {paso > 0 && (
              <button onClick={volver}
                style={{ flex:1, padding:14, borderRadius:12, cursor:"pointer",
                  background:"transparent", border:"1px solid "+C.border,
                  color:C.textDim, fontFamily:C.font, fontSize:12 }}>
                ← Volver
              </button>
            )}
            <button onClick={avanzar}
              style={{ flex:2, padding:14, borderRadius:12, cursor:"pointer",
                background:C.green, border:"none",
                color:"#0b1a0c", fontFamily:C.font, fontSize:13, fontWeight:700 }}>
              {paso === PASOS.length - 2 ? "Generar link →" : "Continuar →"}
            </button>
          </div>
        )}

        {/* Volver a empezar */}
        {paso === PASOS.length - 1 && (
          <button onClick={() => { setPaso(0); setLink(""); setDatos({
            nombreProductor:"",localidad:"",provincia:"",biotipo:"",
            vacasN:"",torosN:"",iniServ:"",finServ:"",
            vegetacion:"",supHa:"",sanAftosa:"",sanBrucelosis:"",
            sanToros:"",aguaFuente:"",consultaEspecifica:"",prenez:"",sanAbortos:"",
          }); }}
            style={{ width:"100%", marginTop:16, padding:12, borderRadius:10, cursor:"pointer",
              background:"transparent", border:"1px solid "+C.border,
              color:C.textFaint, fontFamily:C.font, fontSize:11 }}>
            Nuevo establecimiento
          </button>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div style={{ textAlign:"center", padding:"0 20px 20px",
        fontFamily:C.font, fontSize:8, color:C.textFaint, lineHeight:1.8 }}>
        AgroMind Pro · Formulario del productor<br/>
        Los datos se codifican en el link — no se almacenan en ningún servidor
      </div>
    </div>
  );
}
