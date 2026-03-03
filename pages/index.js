import { useState, useEffect } from "react";

const SYS = `Actuás como asesor técnico experto en sistemas de cría bovina extensiva con recría de hembras en Argentina. 20 años de campo en pasturas megatérmicas y ambientes de baja calidad forrajera, NEA y semiárido.

EJE CENTRAL DEL SISTEMA: EL DESTETE
El destete en FEBRERO es la palanca principal. NO el expeller, NO la suplementación.
Mecanismo: Destete Feb → caída −6–8 Mcal/día → rebrote otoñal → doble efecto → CC 5.5–6.0 al parto → pérdida 1.5 pts post-parto → CC 4.0 servicio → 75% preñez.
La recuperación de CC depende del pastizal y tamaño del animal, NO del suplemento.
El expeller NO puede compensar el costo de lactancia con ternero al pie.
Plan B: destete precoz o hiperprecoz inmediato.

VACA DE 2° SERVICIO — CATEGORÍA MÁS EXIGENTE
Triple demanda: LACTANDO + CRECIENDO + QUEDAR PREÑADA. ~20–22 Mcal/día requeridos.
Pastizal maduro aporta 5–8 Mcal → déficit estructural 12–17 Mcal/día.
REGLA ABSOLUTA: destete precoz es el MANEJO ESTÁNDAR, independientemente de la CC.
Incluso con CC 5.5, con ternero al pie en baja calidad, la biología no da.
Si el productor pregunta "¿y si está bien de CC?": destetar igual.
CC objetivo al servicio: ≥5.5 (el más exigente del sistema).

CURVA CC → PREÑEZ (NEA, datos campo):
Pérdida post-parto: 1.5 puntos sin suplementar. 1 punto CC = 60 Mcal EM.
CC 6.0 parto → 4.5 serv → ~88% | CC 5.5 → 4.0 → ~75% (OBJETIVO) | CC 5.0 → 3.5 → ~55% | CC 4.5 → 3.0 → ~35% | CC 4.0 → 2.5 → ~15%
LA PALANCA ESTÁ EN EL PARTO, NO EN EL SERVICIO.

FENOLOGÍA × CATEGORÍA:
<10% flor: PB >10%, dig >65% | 10–25%: PB 7–10% | 25–50%: PB 5–7%, déficit proteico | >50%: PB <5%, déficit severo.
Cuantificar siempre: Vaq 1°inv necesita PB 900–1100 g/día. Pasto >50% flor aporta ~200–250 g/día → déficit 650–900 g/día.

SUPLEMENTACIÓN:
Actúa DESPUÉS del destete para potenciar recuperación CC. NO para sostener vacas lactando.
Escenario A (buena cant + baja cal): proteico 0.7%PV, 3×/semana.
Escenario B (baja cant + baja cal): E+P 1%PV, diario.
Flushing vaq 2°inv: 0.8%PV diario, 25–30d pre-entore.

RECRÍA (NASSEM 2010):
Vaq 1°inv: ≥170 kg otoño, GDP 600 g/d, meta ≥280 kg. EM 14–16 Mcal/d, PB 900–1100 g/d.
Vaq 2°inv: ≥280 kg otoño, GDP 300 g/d, ≥320 kg servicio + flushing.

EMERGENCIA (Rosello Brajovich et al., INTA 2025):
Prioridades: 1.Recría 2.Preñadas 1°serv 3.Preñadas 2°serv 4.Preñadas flacas 5.Preñadas buena CC 6.Vacías.

ESTRUCTURA OBLIGATORIA — 7 SECCIONES:
1️⃣ DIAGNÓSTICO AMBIENTAL Y FORRAJERO
2️⃣ DIAGNÓSTICO POR CATEGORÍA — conectar fenología con requerimiento, cuantificar déficit PB y Mcal, identificar vaca 2°serv
3️⃣ ESTADO DEL DESTETE Y PROYECCIÓN CC — proyectar CC parto → CC serv → % preñez → terneros en riesgo
4️⃣ BALANCE OFERTA vs DEMANDA
5️⃣ EVALUACIÓN ESTRATÉGICA — PASO 1: destete. PASO 2: suplementación post-destete con dosis exacta. PASO 3: ajuste carga.
6️⃣ IMPACTO A 1–2 AÑOS
7️⃣ CONCLUSIÓN EJECUTIVA — eficiencia [BAJO/MEDIO/ALTO] · riesgo [BAJO/MODERADO/ALTO] · recomendación N°1 con número concreto

Citar: (NASSEM, 2010) · (Balbuena, INTA 2003) · (Peruchena, INTA 2003) · (Rosello Brajovich et al., INTA 2025).`;

const FENOLOGIAS = [
  { id: "f1", val: "menor_10", label: "<10% Floración", desc: "PB >10% · Dig >65% · CV alto", warn: "" },
  { id: "f2", val: "10_25", label: "10–25% Floración", desc: "PB 7–10% · Dig 60–65%", warn: "" },
  { id: "f3", val: "25_50", label: "25–50% Floración", desc: "PB 5–7% · Inicio lignificación", warn: "⚠ Déficit proteico — 2°serv y recría" },
  { id: "f4", val: "mayor_50", label: ">50% Floración", desc: "PB <5% · Lignificación avanzada", warn: "🔴 Déficit proteico severo" },
];

const CC_PRENEZ = [
  { ccP: 6.5, ccS: 5.0, pr: 95 }, { ccP: 6.0, ccS: 4.5, pr: 88 },
  { ccP: 5.5, ccS: 4.0, pr: 75 }, { ccP: 5.0, ccS: 3.5, pr: 55 },
  { ccP: 4.5, ccS: 3.0, pr: 35 }, { ccP: 4.0, ccS: 2.5, pr: 15 },
  { ccP: 3.5, ccS: 2.0, pr: 5 },
];

function interpCurva(ccP) {
  const t = CC_PRENEZ;
  if (ccP >= t[0].ccP) return { ccS: t[0].ccS, pr: t[0].pr };
  if (ccP <= t[t.length - 1].ccP) return { ccS: t[t.length - 1].ccS, pr: t[t.length - 1].pr };
  for (let i = 0; i < t.length - 1; i++) {
    if (ccP <= t[i].ccP && ccP >= t[i + 1].ccP) {
      const r = (ccP - t[i + 1].ccP) / (t[i].ccP - t[i + 1].ccP);
      return {
        ccS: +(t[i + 1].ccS + r * (t[i].ccS - t[i + 1].ccS)).toFixed(1),
        pr: Math.round(t[i + 1].pr + r * (t[i].pr - t[i + 1].pr)),
      };
    }
  }
  return { ccS: 2.5, pr: 15 };
}

function calcCCAlParto(cc, dias, estadoDestete, pastoCal) {
  if (!cc || !dias) return null;
  if (estadoDestete === "no_ternero") {
    return Math.max(1.0, cc - 0.010 * dias);
  }
  if (["ok_feb","ok_mar","precoz","tard_abr"].includes(estadoDestete)) {
    const tasa = { excelente: 0.022, bueno: 0.016, regular: 0.009, malo: 0.004 }[pastoCal] || 0.013;
    return Math.min(9.0, cc + tasa * dias);
  }
  return cc;
}

export default function AgroMind() {
  const [form, setForm] = useState({
    estadoDestete: "", pastoCal: "", pVacas: "", ccActual: "", diasParto: "",
    v2sN: "", v2sPV: "", v2sCC: "", v2sTernero: "",
    zona: "", mes: "", clima: "", vegetacion: "", supHa: "", dispFor: "", fenologia: "",
    vacasN: "", eReprod: "", ternerosN: "", torosN: "", prenezHist: "",
    vaq1N: "", vaq1PV: "", vaq1GDP: "",
    vaq2N: "", vaq2PV: "", diasEntore: "", tendPeso: "",
    suplem: "", dosis: "", consulta: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [result, setResult] = useState("");
  const [ccParto, setCcParto] = useState(null);
  const [curva, setCurva] = useState(null);
  const [alerta2serv, setAlerta2serv] = useState("");
  const [tab, setTab] = useState("analisis");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const cc = parseFloat(form.ccActual);
    const dias = parseInt(form.diasParto);
    if (!isNaN(cc) && cc > 0 && dias > 0) {
      const parto = calcCCAlParto(cc, dias, form.estadoDestete, form.pastoCal);
      setCcParto(parto ? parseFloat(parto.toFixed(2)) : null);
      setCurva(parto ? interpCurva(parto) : null);
    } else {
      setCcParto(null); setCurva(null);
    }
  }, [form.ccActual, form.diasParto, form.estadoDestete, form.pastoCal]);

  useEffect(() => {
    const pv = parseFloat(form.v2sPV);
    const cc = parseFloat(form.v2sCC);
    if (form.v2sTernero === "si") {
      let msg = "🔴 VACA 2°SERV + TERNERO AL PIE — Destete precoz obligatorio independientemente de la CC.\n";
      msg += "Triple demanda: ~20–22 Mcal/día requeridos vs 5–8 Mcal del pastizal maduro. El expeller no cierra esa brecha.";
      if (pv > 0 && pv < 380) msg += `\n⚠️ Peso ${pv} kg <380 — riesgo máximo. Destete hiperprecoz inmediato.`;
      setAlerta2serv(msg);
    } else setAlerta2serv("");
  }, [form.v2sTernero, form.v2sPV, form.v2sCC]);

  const buildPrompt = () => {
    let t = "Análisis técnico completo de este sistema ganadero:\n\n";
    t += `DESTETE: ${form.estadoDestete} · Pastizal post-destete: ${form.pastoCal}\n`;
    t += `CC actual: ${form.ccActual}/9 · Días al parto: ${form.diasParto} · PV vaca: ${form.pVacas} kg\n`;
    if (ccParto) t += `CC proyectada al parto: ${ccParto}/9 → CC serv: ${curva?.ccS} → Preñez estimada: ${curva?.pr}%\n`;
    if (form.estadoDestete === "no_ternero") t += "⚠️ TERNERO AÚN AL PIE — déficit activo 6–8 Mcal/día\n";
    t += `\nVACA 2°SERV: N° ${form.v2sN} · PV ${form.v2sPV} kg · CC ${form.v2sCC}/9 · Ternero: ${form.v2sTernero}\n`;
    if (form.v2sTernero === "si") t += "⚠️ ALERTA: destete precoz obligatorio — triple demanda imposible\n";
    t += `\nAMBIENTE: Zona ${form.zona} · Mes ${form.mes} · Clima ${form.clima}\n`;
    t += `Vegetación: ${form.vegetacion} · Fenología: ${form.fenologia} · Superficie: ${form.supHa} ha\n`;
    t += `\nVACAS: N° ${form.vacasN} · Estado ${form.eReprod} · Terneros ${form.ternerosN} · Preñez hist ${form.prenezHist}%\n`;
    t += `VAQ 1°INV: N° ${form.vaq1N} · PV ${form.vaq1PV} kg · GDP ${form.vaq1GDP} g/d\n`;
    t += `VAQ 2°INV: N° ${form.vaq2N} · PV ${form.vaq2PV} kg · Días entore ${form.diasEntore} · Tendencia ${form.tendPeso}\n`;
    if (form.suplem) t += `Suplementación: ${form.suplem} · Dosis ${form.dosis} kg/an/d\n`;
    if (form.consulta) t += `\nCONSULTA: ${form.consulta}\n`;
    t += "\nEstructura 7 secciones. Destete como eje. Proyectar CC parto → preñez → terneros. Vaca 2°serv: categoría crítica. Dosis exactas con fórmulas.";
    return t;
  };

  const MSGS = [
    "Evaluando estado del destete...", "Proyectando CC al parto y servicio...",
    "Calculando impacto en preñez y terneros...", "Analizando vaca 2°servicio...",
    "Conectando fenología con requerimiento por categoría...",
    "Calculando dosis exactas...", "Redactando informe técnico...",
  ];

  const runAnalysis = async () => {
    setLoading(true); setResult(""); let mi = 0;
    const iv = setInterval(() => { setLoadMsg(MSGS[mi % MSGS.length]); mi++; }, 2000);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: buildPrompt(), systemPrompt: SYS }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setResult(data.result);
    } catch (e) {
      setResult("❌ Error: " + e.message);
    } finally {
      clearInterval(iv); setLoading(false);
    }
  };

  const renderResult = (t) => t
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/(1️⃣|2️⃣|3️⃣|4️⃣|5️⃣|6️⃣|7️⃣)\s*([^\n]+)/g, '<div class="sec-head">$1 $2</div>')
    .replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');

  const inp = "w-full bg-black/40 border border-lime-900/30 rounded px-3 py-2 text-sm text-stone-200 focus:outline-none focus:border-lime-500";
  const lbl = "block text-xs font-mono text-stone-500 uppercase tracking-widest mb-1";
  const sel = inp + " appearance-none";

  const semDestete = () => {
    const m = { ok_feb: ["border-lime-500 bg-lime-900/10","✅","Feb — Óptimo"], ok_mar: ["border-lime-500 bg-lime-900/10","✅","Mar — Aceptable"], tard_abr: ["border-amber-500 bg-amber-900/10","⚠️","Tardío — Abril"], no_ternero: ["border-red-600 bg-red-900/10","🔴","Ternero al pie"], precoz: ["border-amber-500 bg-amber-900/10","⚡","Precoz activo"], planif: ["border-amber-500 bg-amber-900/10","📋","Planificando"] };
    return m[form.estadoDestete] || ["border-stone-700","📅","—"];
  };
  const [sdCls, sdIco, sdLbl] = semDestete();

  const prenezColor = !curva ? "text-stone-500" : curva.pr >= 75 ? "text-lime-400" : curva.pr >= 55 ? "text-amber-400" : "text-red-400";
  const ccPartoColor = !ccParto ? "text-stone-500" : ccParto >= 5.5 ? "text-lime-400" : ccParto >= 5.0 ? "text-amber-400" : "text-red-400";

  return (
    <div style={{background:"#0c1208",minHeight:"100vh",color:"#ede8d8",fontFamily:"Georgia,serif"}}>
      <div style={{maxWidth:900,margin:"0 auto",padding:"0 16px 80px"}}>

        {/* HEADER */}
        <div style={{borderBottom:"1px solid rgba(126,200,80,.1)",paddingBottom:16,marginBottom:20,paddingTop:24,display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:48,height:48,background:"linear-gradient(145deg,#7ec850,#a3d96e)",clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🐄</div>
            <div>
              <div style={{fontFamily:"'Georgia',serif",fontSize:"1.8rem",color:"#7ec850",letterSpacing:4,lineHeight:1}}>AgroMind Pro</div>
              <div style={{fontFamily:"monospace",fontSize:".55rem",color:"#7a9668",letterSpacing:2,marginTop:4}}>SISTEMA EXPERTO · CRÍA BOVINA EXTENSIVA · ARGENTINA</div>
            </div>
          </div>
          <div style={{fontFamily:"monospace",fontSize:".6rem",color:"#7ec850",background:"rgba(126,200,80,.06)",border:"1px solid rgba(126,200,80,.2)",borderRadius:3,padding:"6px 12px"}}>● ACTIVO · Gemini Flash</div>
        </div>

        {/* KPI BAR */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:7,marginBottom:16}}>
          {[
            ["Zona", form.zona?.split(" ")[0] || "—", ""],
            ["CC Actual", form.ccActual ? form.ccActual+"/9" : "—", ""],
            ["CC Parto", ccParto ? ccParto+"/9" : "—", ccPartoColor],
            ["CC Serv.", curva ? curva.ccS+"/9" : "—", prenezColor],
            ["Preñez Est.", curva ? curva.pr+"%" : "—", prenezColor],
            ["Destete", sdLbl, ""],
          ].map(([l,v,c]) => (
            <div key={l} style={{background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:5,padding:"8px 6px",textAlign:"center"}}>
              <div style={{fontFamily:"monospace",fontSize:".48rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,marginBottom:3}}>{l}</div>
              <div style={{fontFamily:"monospace",fontSize:"1rem",color:c||"#7ec850",fontWeight:600}}>{v}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{display:"flex",borderBottom:"1px solid rgba(126,200,80,.09)",marginBottom:18,gap:2}}>
          {[["analisis","⚡ Análisis"],["marco","🧠 Marco Técnico"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{background:"transparent",border:"none",borderBottom: tab===id?"2px solid #7ec850":"2px solid transparent",color:tab===id?"#7ec850":"#7a9668",fontFamily:"monospace",fontSize:".57rem",letterSpacing:1.5,textTransform:"uppercase",padding:"8px 14px",cursor:"pointer",marginBottom:-1}}>
              {label}
            </button>
          ))}
        </div>

        {tab === "analisis" && (
          <div>
            {/* DESTETE */}
            <div style={{background:"rgba(212,149,42,.04)",border:"1px solid rgba(212,149,42,.28)",borderRadius:8,padding:18,marginBottom:14}}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#d4952a",marginBottom:6}}>📅 DESTETE — EJE DEL SISTEMA</div>
              <div style={{fontFamily:"monospace",fontSize:".52rem",color:"rgba(212,149,42,.6)",lineHeight:1.7,marginBottom:14}}>
                Plan A: Destete en febrero → −6–8 Mcal/día + rebrote otoñal → recuperación CC al parto.<br/>
                La recuperación depende del pastizal y tamaño del animal. El expeller no reemplaza el destete.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:10}}>
                <div><label className={lbl} style={{fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:4}}>Estado del Destete</label>
                  <select value={form.estadoDestete} onChange={e=>set("estadoDestete",e.target.value)} style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.15)",borderRadius:4,color:"#ede8d8",padding:"7px 10px",fontSize:".82rem",fontFamily:"Georgia,serif"}}>
                    <option value="">Seleccionar...</option>
                    <option value="ok_feb">✅ Realizado en Febrero</option>
                    <option value="ok_mar">✅ Realizado en Marzo</option>
                    <option value="tard_abr">⚠️ Tardío — Abril</option>
                    <option value="no_ternero">🔴 No — ternero al pie</option>
                    <option value="precoz">⚡ Destete precoz activo</option>
                    <option value="planif">📋 Planificando</option>
                  </select></div>
                <div><label style={{fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:4}}>Pastizal Post-destete</label>
                  <select value={form.pastoCal} onChange={e=>set("pastoCal",e.target.value)} style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.15)",borderRadius:4,color:"#ede8d8",padding:"7px 10px",fontSize:".82rem",fontFamily:"Georgia,serif"}}>
                    <option value="">—</option>
                    <option value="excelente">Excelente — rebrote abundante</option>
                    <option value="bueno">Bueno — rebrote normal</option>
                    <option value="regular">Regular — rebrote escaso</option>
                    <option value="malo">Malo — sin rebrote</option>
                  </select></div>
                <div><label style={{fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:4}}>CC Actual (1–9)</label>
                  <input type="number" value={form.ccActual} onChange={e=>set("ccActual",e.target.value)} placeholder="Ej: 4.5" min="1" max="9" step=".5" style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.15)",borderRadius:4,color:"#ede8d8",padding:"7px 10px",fontSize:".82rem",fontFamily:"Georgia,serif"}}/></div>
                <div><label style={{fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:4}}>Días al Parto</label>
                  <input type="number" value={form.diasParto} onChange={e=>set("diasParto",e.target.value)} placeholder="Ej: 90" style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.15)",borderRadius:4,color:"#ede8d8",padding:"7px 10px",fontSize:".82rem",fontFamily:"Georgia,serif"}}/></div>
                <div><label style={{fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:4}}>Peso Vaca (kg)</label>
                  <input type="number" value={form.pVacas} onChange={e=>set("pVacas",e.target.value)} placeholder="Ej: 380" style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.15)",borderRadius:4,color:"#ede8d8",padding:"7px 10px",fontSize:".82rem",fontFamily:"Georgia,serif"}}/></div>
              </div>

              {/* CC Proyección inline */}
              {ccParto && curva && (
                <div style={{marginTop:14,background:"rgba(0,0,0,.25)",border:"1px solid rgba(126,200,80,.2)",borderRadius:6,padding:"12px 14px",fontFamily:"monospace",fontSize:".65rem",lineHeight:2}}>
                  <span style={{color:"#7ec850"}}>▸ PROYECCIÓN: </span>
                  CC parto: <strong style={{color: ccParto>=5.5?"#7ec850":ccParto>=5.0?"#d4952a":"#c04820"}}>{ccParto}/9</strong>
                  {" → "} CC serv: <strong style={{color: curva.pr>=75?"#7ec850":curva.pr>=55?"#d4952a":"#c04820"}}>{curva.ccS}/9</strong>
                  {" → "} Preñez estimada: <strong style={{color: curva.pr>=75?"#7ec850":curva.pr>=55?"#d4952a":"#c04820"}}>{curva.pr}%</strong>
                  {curva.pr < 75 && <span style={{color:"#c04820"}}> · ⚠️ {Math.round((75-curva.pr)/100*(parseInt(form.vacasN)||100))} terneros bajo objetivo 75%</span>}
                  <br/><span style={{color:"#3e5230"}}>Pérdida post-parto: 1.5 pts (NEA campo) · 1 pto CC = 60 Mcal EM</span>
                </div>
              )}
              {form.estadoDestete === "no_ternero" && (
                <div style={{marginTop:10,background:"rgba(192,72,32,.07)",border:"1px solid rgba(192,72,32,.3)",borderRadius:5,padding:"10px 12px",fontFamily:"monospace",fontSize:".63rem",color:"#e09070"}}>
                  🔴 TERNERO AL PIE — 6–8 Mcal/día consumidos en lactancia no recuperan CC. <strong style={{color:"#c04820"}}>Destete precoz: única solución real.</strong>
                </div>
              )}
            </div>

            {/* VACA 2° SERVICIO */}
            <div style={{background:"rgba(136,102,204,.04)",border:"1px solid rgba(136,102,204,.28)",borderRadius:8,padding:18,marginBottom:14}}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#8866cc",marginBottom:6}}>⚠️ VACA DE 2° SERVICIO — CATEGORÍA CRÍTICA</div>
              <div style={{fontFamily:"monospace",fontSize:".52rem",color:"rgba(136,102,204,.6)",lineHeight:1.7,marginBottom:14}}>
                Triple demanda: Lactando + Creciendo + Quedar preñada. ~20–22 Mcal/día requeridos.<br/>
                <strong style={{color:"#8866cc"}}>Destete precoz = manejo estándar, independientemente de la CC.</strong> Incluso con CC 5.5, la biología no da.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
                {[["v2sN","N° Cabezas","Ej: 30","number"],["v2sPV","Peso Prom (kg)","Ej: 340","number"],["v2sCC","CC Actual (1–9)","Ej: 4.5","number"]].map(([k,l,p,t]) => (
                  <div key={k}><label style={{fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:4}}>{l}</label>
                    <input type={t} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={p} style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.15)",borderRadius:4,color:"#ede8d8",padding:"7px 10px",fontSize:".82rem",fontFamily:"Georgia,serif"}}/></div>
                ))}
                <div><label style={{fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:4}}>¿Ternero al Pie?</label>
                  <select value={form.v2sTernero} onChange={e=>set("v2sTernero",e.target.value)} style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.15)",borderRadius:4,color:"#ede8d8",padding:"7px 10px",fontSize:".82rem",fontFamily:"Georgia,serif"}}>
                    <option value="">—</option>
                    <option value="si">Sí — ternero al pie</option>
                    <option value="precoz">Destete precoz realizado</option>
                    <option value="no">No — ya destetado</option>
                  </select></div>
              </div>
              {alerta2serv && (
                <div style={{marginTop:10,background:"rgba(192,72,32,.07)",border:"1px solid rgba(192,72,32,.3)",borderRadius:5,padding:"10px 12px",fontFamily:"monospace",fontSize:".63rem",color:"#e09070",whiteSpace:"pre-line"}}>{alerta2serv}</div>
              )}
            </div>

            {/* OFERTA */}
            <div style={{background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:8,padding:18,marginBottom:14}}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#7ec850",marginBottom:14}}>🌾 OFERTA FORRAJERA</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:10,marginBottom:14}}>
                {[["zona","Zona",["","Pampa Húmeda","NEA","NOA","Semiárido Pampeano","Mesopotamia","Cuyo","Patagonia"]],
                  ["mes","Mes",["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]],
                  ["clima","Condición Climática",["","Seco (déficit hídrico)","Normal","Húmedo (exceso)","Post-sequía","Niña activa","Niño activo"]],
                  ["vegetacion","Vegetación",["","Pastizal natural NEA/Chaco","Megatérmicas (gatton panic, brachiaria)","Pasturas templadas","Mixta gramíneas+leguminosas","Monte bajo / sabana","Verdeo de invierno"]],
                ].map(([k,l,opts]) => (
                  <div key={k}><label style={{fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:4}}>{l}</label>
                    <select value={form[k]} onChange={e=>set(k,e.target.value)} style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.15)",borderRadius:4,color:"#ede8d8",padding:"7px 10px",fontSize:".82rem",fontFamily:"Georgia,serif"}}>
                      {opts.map(o=><option key={o} value={o}>{o||"Seleccionar..."}</option>)}
                    </select></div>
                ))}
                <div><label style={{fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:4}}>Superficie (ha)</label>
                  <input type="number" value={form.supHa} onChange={e=>set("supHa",e.target.value)} placeholder="Ej: 500" style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.15)",borderRadius:4,color:"#ede8d8",padding:"7px 10px",fontSize:".82rem",fontFamily:"Georgia,serif"}}/></div>
              </div>
              <div style={{fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Estado Fenológico</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                {FENOLOGIAS.map(f => (
                  <div key={f.id} onClick={() => set("fenologia", f.val)} style={{border: form.fenologia===f.val?"1px solid #7ec850":"1px solid rgba(126,200,80,.12)",borderRadius:6,padding:"10px 12px",cursor:"pointer",background:form.fenologia===f.val?"rgba(126,200,80,.08)":"rgba(0,0,0,.15)"}}>
                    <div style={{fontFamily:"monospace",fontSize:".85rem",color:"#7ec850",letterSpacing:1}}>{f.label}</div>
                    <div style={{fontSize:".77rem",marginTop:3}}>{f.desc}</div>
                    {f.warn && <div style={{fontFamily:"monospace",fontSize:".52rem",color:"#c04820",marginTop:3}}>{f.warn}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* DEMANDA */}
            <div style={{background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:8,padding:18,marginBottom:14}}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#7ec850",marginBottom:14}}>🐮 DEMANDA ANIMAL</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
                {[["vacasN","N° Vacas Adultas","Ej: 150"],["ternerosN","N° Terneros al Pie","Ej: 120"],["torosN","N° Toros","Ej: 8"],["prenezHist","Preñez Último Año %","Ej: 72"],["vaq1N","Vaq 1°inv N°","Ej: 40"],["vaq1PV","Vaq 1°inv PV (kg)","Ej: 185"],["vaq1GDP","Vaq 1°inv GDP (g/d)","Obj: 600"],["vaq2N","Vaq 2°inv N°","Ej: 35"],["vaq2PV","Vaq 2°inv PV (kg)","Ej: 290"],["diasEntore","Días al Entore","Ej: 45"]].map(([k,l,p]) => (
                  <div key={k}><label style={{fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:4}}>{l}</label>
                    <input type="number" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={p} style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.15)",borderRadius:4,color:"#ede8d8",padding:"7px 10px",fontSize:".82rem",fontFamily:"Georgia,serif"}}/></div>
                ))}
                <div><label style={{fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:4}}>Tendencia Vaq 2°inv</label>
                  <select value={form.tendPeso} onChange={e=>set("tendPeso",e.target.value)} style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.15)",borderRadius:4,color:"#ede8d8",padding:"7px 10px",fontSize:".82rem",fontFamily:"Georgia,serif"}}>
                    <option value="">—</option><option>Ganando peso</option><option>Peso estable</option><option>Perdiendo peso</option>
                  </select></div>
                <div><label style={{fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:4}}>Suplementación Actual</label>
                  <select value={form.suplem} onChange={e=>set("suplem",e.target.value)} style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.15)",borderRadius:4,color:"#ede8d8",padding:"7px 10px",fontSize:".82rem",fontFamily:"Georgia,serif"}}>
                    <option value="">Sin suplementar</option><option>Expeller proteico</option><option>Grano energético</option><option>Semilla de algodón</option><option>Mixtura E+P</option><option>Núcleo mineral</option>
                  </select></div>
              </div>
            </div>

            {/* CONSULTA */}
            <div style={{background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:8,padding:18,marginBottom:14}}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#7ec850",marginBottom:10}}>💬 CONSULTA ESPECÍFICA</div>
              <textarea value={form.consulta} onChange={e=>set("consulta",e.target.value)} placeholder="Describí la situación o pregunta técnica puntual..." rows={4} style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.15)",borderRadius:4,color:"#ede8d8",padding:"10px 12px",fontSize:".85rem",fontFamily:"Georgia,serif",lineHeight:1.7,resize:"vertical"}}/>
            </div>

            {/* BOTONES */}
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
              <button onClick={runAnalysis} disabled={loading} style={{background: loading?"#3e5230":"#7ec850",color:"#070d03",border:"none",borderRadius:4,padding:"12px 28px",fontFamily:"monospace",fontSize:"1rem",letterSpacing:2.5,cursor:loading?"not-allowed":"pointer",fontWeight:700}}>
                {loading ? "⏳ PROCESANDO..." : "⚡ ANALIZAR SISTEMA"}
              </button>
              <button onClick={()=>setForm({estadoDestete:"",pastoCal:"",pVacas:"",ccActual:"",diasParto:"",v2sN:"",v2sPV:"",v2sCC:"",v2sTernero:"",zona:"",mes:"",clima:"",vegetacion:"",supHa:"",dispFor:"",fenologia:"",vacasN:"",eReprod:"",ternerosN:"",torosN:"",prenezHist:"",vaq1N:"",vaq1PV:"",vaq1GDP:"",vaq2N:"",vaq2PV:"",diasEntore:"",tendPeso:"",suplem:"",dosis:"",consulta:""})} style={{background:"transparent",border:"1px solid rgba(122,150,104,.2)",borderRadius:4,color:"#7a9668",padding:"12px 16px",fontFamily:"monospace",fontSize:".62rem",cursor:"pointer"}}>
                LIMPIAR
              </button>
            </div>

            {loading && (
              <div style={{background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:8,padding:18,marginBottom:14,display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontFamily:"monospace",fontSize:".6rem",color:"#7ec850",whiteSpace:"nowrap"}}>PROCESANDO</div>
                <div style={{flex:1,height:2,background:"rgba(126,200,80,.07)",borderRadius:1,overflow:"hidden",position:"relative"}}>
                  <div style={{position:"absolute",top:0,left:0,width:"40%",height:"100%",background:"#7ec850",borderRadius:1,animation:"scan 1.2s ease-in-out infinite"}}/>
                </div>
                <div style={{fontFamily:"monospace",fontSize:".6rem",color:"#7a9668",whiteSpace:"nowrap"}}>{loadMsg}</div>
              </div>
            )}

            {result && (
              <div style={{background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:8,padding:22,marginTop:8}}>
                <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:3,color:"#7ec850",marginBottom:14,paddingBottom:10,borderBottom:"1px solid rgba(126,200,80,.09)"}}>INFORME TÉCNICO DIAGNÓSTICO</div>
                <div style={{fontSize:".87rem",lineHeight:1.9}} dangerouslySetInnerHTML={{__html: renderResult(result)}}/>
              </div>
            )}
          </div>
        )}

        {tab === "marco" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
            {[
              ["📅 Destete — La Palanca Central","#d4952a","rgba(212,149,42,.3)","Destete en febrero = caída −6–8 Mcal/día + rebrote otoñal = recuperación CC. La velocidad depende del pastizal y el tamaño del animal, no del suplemento. El expeller actúa después del destete para potenciar, no para reemplazar.","Balbuena INTA (2003) · Datos campo NEA"],
              ["⚠️ Vaca de 2° Servicio","#8866cc","rgba(136,102,204,.35)","Triple demanda: lactando + creciendo + quedar preñada. ~20–22 Mcal/día requeridos. Pastizal maduro aporta 5–8 Mcal → déficit 12–17 Mcal. El destete precoz es el manejo ESTÁNDAR, no una medida de emergencia. Independientemente de la CC.",""],
              ["📊 Curva CC → Preñez","#7ec850","rgba(126,200,80,.2)","CC 5.5 parto → 4.0 serv → 75% (objetivo) · CC 5.0 → 3.5 → 55% · CC 4.5 → 3.0 → 35% · CC 4.0 → 2.5 → 15%. Pérdida post-parto NEA: 1.5 puntos. La palanca está en el parto, no en el servicio.","Datos campo NEA confirmados"],
              ["🌾 Fenología × Categoría","#7ec850","rgba(126,200,80,.15)",">50% floración → PB <5%. Vaq 1°inv necesita PB 900–1100 g/día. Pasto maduro aporta ~200–250 g/día → déficit 650–900 g/día. Esto es lo que el asesor promedio no calcula.","Peruchena INTA (2003)"],
              ["📚 Fuentes Técnicas","#3a8fb5","rgba(58,143,181,.25)","NASSEM (2010) — recría hembras · Balbuena INTA Colonia Benítez (2003) · Peruchena INTA Corrientes (2003) · Fernández Mayer INTA Bordenave (2008) · Rosello Brajovich et al. INTA EEA CB (2025) · NRC Beef Cattle (2000)",""],
            ].map(([title,color,border,body,src]) => (
              <div key={title} style={{background:"#141a09",border:`1px solid ${border}`,borderRadius:8,padding:16}}>
                <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color,marginBottom:8}}>{title}</div>
                <p style={{fontSize:".8rem",color:"#7a9668",lineHeight:1.7}}>{body}</p>
                {src && <div style={{fontFamily:"monospace",fontSize:".52rem",color:"#3a8fb5",marginTop:8}}>{src}</div>}
              </div>
            ))}
          </div>
        )}

      </div>
      <style>{`@keyframes scan{0%{left:-40%}100%{left:110%}} select option{background:#1a2210}`}</style>
    </div>
  );
}
