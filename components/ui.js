"use client";

// -------------------------------------------------------------------
// components/ui.js
// Componentes UI reutilizables  sin lgica de negocio
// -------------------------------------------------------------------

import React from "react";
import { T } from "../lib/constantes";

// Alias
const C = T;

// --- HELPERS DE COLOR ---------------------------------------------
const smf      = (v, bajo, alto) => v >= alto ? "#7ec850" : v >= bajo ? "#e8a030" : "#e05530";
const smf2 = (v, ok, warn) => v >= ok ? C.green : v >= warn ? C.amber : C.red;
const mcalKgAdj = (t, fenol) => {
  const base = t>=25?2.10 : t>=20?1.90 : t>=15?1.50 : t>=10?1.00 : 0.65;
  return base * ({menor_10:1.00,"10_25":0.95,"25_50":0.85,mayor_50:0.72}[fenol] || 1.00);
};
const pbPasto     = (fenol) => ({menor_10:12, "10_25":9, "25_50":6, mayor_50:4}[fenol] || 10);
const fAprovFenol = (fenol) => ({menor_10:1.00,"10_25":0.90,"25_50":0.75,mayor_50:0.55}[fenol] || 1.00);


// --- PILL ---
const Pill = ({ children, color = T.green, bg }) => (
  <span style={{
    display:"inline-block", padding:"2px 9px", borderRadius:20,
    fontSize:11, fontFamily:T.font,
    color, background: bg || color + "22",
    border:`1px solid ${color}44`, letterSpacing:.5,
  }}>
    {children}
  </span>
);

// --- ALERTA ---
const Alerta = ({ tipo, children, style: st }) => {
  const cfg = {
    ok:    { bg:"rgba(126,200,80,.08)",  border:"rgba(126,200,80,.35)",  icon:"?", color:T.green },
    warn:  { bg:"rgba(232,160,48,.08)",  border:"rgba(232,160,48,.35)",  icon:"??", color:T.amber },
    error: { bg:"rgba(224,85,48,.08)",   border:"rgba(224,85,48,.35)",   icon:"??", color:T.red   },
    info:  { bg:"rgba(74,159,212,.08)",  border:"rgba(74,159,212,.25)",  icon:"??", color:T.blue  },
  };
  const s = cfg[tipo] || cfg.info;
  return (
    <div style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:10, padding:"10px 12px", marginBottom:8, ...st }}>
      <span style={{ fontFamily:T.fontSans, fontSize:12, color:s.color }}>{s.icon} {children}</span>
    </div>
  );
};

// --- SLIDER ---
const Slider = ({ label, value, min, max, step = 0.1, onChange, unit = "", color = T.green }) => (
  <div style={{ marginBottom:14 }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
      <span style={{ fontFamily:T.fontSans, fontSize:12, color:T.textDim }}>{label}</span>
      <span style={{ fontFamily:T.font, fontSize:13, color, fontWeight:700 }}>{value}{unit}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      style={{ width:"100%", accentColor:color, cursor:"pointer", height:4 }}
    />
    <div style={{ display:"flex", justifyContent:"space-between" }}>
      <span style={{ fontFamily:T.font, fontSize:9, color:T.textFaint }}>{min}{unit}</span>
      <span style={{ fontFamily:T.font, fontSize:9, color:T.textFaint }}>{max}{unit}</span>
    </div>
  </div>
);

// --- DISTCC ---
function DistCC({ dist, onChange, label, nVacas }) {
  const [modo, setModo] = React.useState("pct");
  const totalVacas = parseFloat(nVacas) || 0;
  const opcionesCC = ["3.0","3.5","4.0","4.5","5.0","5.5","6.0","6.5","7.0","7.5","8.0"];

  const updCab = (i, v) => {
    const cab = parseFloat(v) || 0;
    const pct = totalVacas > 0 ? Math.round(cab / totalVacas * 100) : 0;
    const n = [...(dist||[])];
    n[i] = { ...n[i], pct: String(pct), _cab: String(cab) };
    onChange(n);
  };
  const mostrarCab = (d) => {
    if (d._cab) return d._cab;
    const pct = parseFloat(d.pct) || 0;
    return totalVacas > 0 ? String(Math.round(pct * totalVacas / 100)) : "";
  };

  const addRow = () => onChange([...(dist || []), { cc:"4.5", pct:"" }]);
  const delRow = (i) => onChange((dist || []).filter((_, j) => j !== i));
  const upd = (i, k, v) => {
    const n = [...(dist||[])];
    n[i] = { ...n[i], [k]: v };
    onChange(n);
  };
  const total = (dist || []).reduce((s, d) => s + (parseFloat(d.pct)||0), 0);
  const totalCab = (dist || []).reduce((s, d) => s + (parseFloat(mostrarCab(d))||0), 0);

  return (
    <div>
      {label && <div style={{ fontFamily:T.font, fontSize:10, color:T.textDim, letterSpacing:1, marginBottom:8 }}>{label}</div>}
      <div style={{ display:"flex", gap:6, marginBottom:10 }}>
        {[["pct","% del rodeo"],["cab","N animales"]].map(([m,lbl]) => (
          <button key={m} onClick={() => setModo(m)}
            style={{ background: modo===m ? T.blue+"20" : "none",
              border:"1px solid "+(modo===m ? T.blue : T.border), borderRadius:6,
              padding:"4px 10px", fontFamily:T.font, fontSize:9, cursor:"pointer",
              color: modo===m ? T.blue : T.textDim }}>
            {lbl}
          </button>
        ))}
        {modo === "cab" && totalVacas === 0 && (
          <span style={{ fontFamily:T.font, fontSize:8, color:T.amber, alignSelf:"center" }}>
            Carg el nmero de vacas primero
          </span>
        )}
      </div>
      {(dist || []).map((d, i) => (
        <div key={i} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
          <div style={{ flex:1.2 }}>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, marginBottom:3 }}>CC (escala 1-9)</div>
            <select value={d.cc} onChange={e => upd(i, "cc", e.target.value)}
              style={{ width:"100%", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"9px 10px", fontFamily:T.font, fontSize:13 }}>
              {opcionesCC.map(v => {
                const n = parseFloat(v);
                const ref = n >= 7.0 ? "Exceso" : n >= 6.0 ? "Llena" : n >= 5.5 ? "Muy buena" : n >= 5.0 ? "Buena ✓" : n >= 4.5 ? "Aceptable" : n >= 4.0 ? "Baja ⚠" : "Critica";
                return <option key={v} value={v}>CC {v}  {ref}</option>;
              })}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, marginBottom:3 }}>
              {modo === "cab" ? `Cabezas${totalVacas>0?" / "+totalVacas:""}` : "% del rodeo"}
            </div>
            {modo === "cab" ? (
              <input type="number" value={mostrarCab(d)} onChange={e => updCab(i, e.target.value)}
                placeholder="cab" style={{ width:"100%", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"9px 10px", fontFamily:T.font, fontSize:13, boxSizing:"border-box" }} />
            ) : (
              <input type="number" value={d.pct} onChange={e => upd(i, "pct", e.target.value)}
                placeholder="%" style={{ width:"100%", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"9px 10px", fontFamily:T.font, fontSize:13, boxSizing:"border-box" }} />
            )}
          </div>
          <div style={{ width:36, textAlign:"center", flexShrink:0, marginTop:14 }}>
            <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, lineHeight:1.2 }}>
              {modo === "cab"
                ? (parseFloat(d.pct) > 0 ? parseFloat(d.pct).toFixed(0)+"%" : "")
                : (totalVacas > 0 && parseFloat(d.pct) > 0 ? Math.round(parseFloat(d.pct)*totalVacas/100)+"v" : "")}
            </div>
          </div>
          <button onClick={() => delRow(i)} style={{ background:"none", border:"none", color:T.red, cursor:"pointer", fontSize:16, padding:"0 4px", marginTop:14 }}>✕</button>
        </div>
      ))}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4 }}>
        <button onClick={addRow} style={{ background:`${T.green}08`, border:`1px solid ${T.border}`, borderRadius:8, color:T.green, padding:"7px 14px", fontFamily:T.font, fontSize:11, cursor:"pointer" }}>
          + Agregar grupo
        </button>
        <span style={{ fontFamily:T.font, fontSize:11,
          color: modo==="cab"
            ? (totalVacas > 0 ? (Math.abs(totalCab - totalVacas) <= 2 ? T.green : T.amber) : T.textDim)
            : (total === 100 ? T.green : T.amber) }}>
          {modo === "cab"
            ? (totalVacas > 0 ? totalCab+" / "+totalVacas+"v" : totalCab+"v")
            : total+"%"}{(modo==="pct"&&total!==100)||( modo==="cab"&&totalVacas>0&&Math.abs(totalCab-totalVacas)>2) ? " ?" : ""}
        </span>
      </div>
      {total === 0 && (
        <div style={{ background:T.amber+"15", border:"1px solid "+T.amber+"40", borderRadius:6, padding:"8px 10px", marginBottom:8, fontFamily:T.font, fontSize:10, color:T.amber }}>
          ? Ingres el % de vacas en cada grupo de CC  la suma debe ser 100%.
        </div>
      )}
      {total > 0 && total !== 100 && (
        <div style={{ background:T.amber+"10", border:"1px solid "+T.amber+"30", borderRadius:6, padding:"6px 10px", marginBottom:6, fontFamily:T.font, fontSize:10, color:T.amber }}>
          Suma actual: {total}%  complet hasta 100%
        </div>
      )}
      {total === 100 && (
        <div style={{ fontFamily:T.font, fontSize:10, color:T.green, marginBottom:6 }}>
          ✓ CC ponderada del rodeo: <strong>{
            ((dist||[]).reduce((s,d)=>s+(parseFloat(d.pct)||0)*(parseFloat(d.cc)||0),0)/100).toFixed(1)
          }</strong> (escala 1-9)
        </div>
      )}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 10px", marginTop:8 }}>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, letterSpacing:1, marginBottom:5 }}>
          REFERENCIA ESCALA 19 INTA EEA Colonia Bentez  Stahringer 2003
        </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:3 }}>
          {[
            ["\u2264 3.0","Critica","Costillas y vertebras visibles",T.red],
            ["4.0","Baja","Costillas palpables con presion leve",T.amber],
            ["4.5","Aceptable","Costillas palpables con presion firme",T.amber],
            ["5.0","Buena \u2713","Costillas no visibles \u2014 optima al servicio",T.green],
            ["5.5","Muy buena","Algo de grasa en costillas",T.green],
            ["6.0","Llena","Grasa visible en cadera",T.textDim],
            ["\u2265 7.0","Exceso","Grasa acumulada \u2014 improductiva",T.textDim],
            ["-","-","-",T.textFaint],
          ].map(([cc,est,desc,color]) => (
            <div key={cc+est} style={{ padding:"3px 4px", borderRadius:4, background:color+"10" }}>
              <div style={{ fontFamily:T.font, fontSize:9, color:color, fontWeight:700 }}>{cc}</div>
              <div style={{ fontFamily:T.font, fontSize:8, color:color }}>{est}</div>
              <div style={{ fontFamily:T.font, fontSize:7, color:T.textFaint, lineHeight:1.3 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- LOADINGPANEL ---
function LoadingPanel({ msg }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 20px" }}>
      <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:16 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:8, height:8, borderRadius:4, background:T.green,
            animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`,
          }} />
        ))}
      </div>
      <div style={{ fontFamily:T.font, fontSize:12, color:T.green, letterSpacing:1 }}>{msg}</div>
    </div>
  );
}

// --- INPUT ---
function Input({ label, value, onChange, placeholder, type = "text", sub, warn, id }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:5 }}>{label}</div>}
      <input
        id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", background:C.card2, border:`1px solid ${warn ? "rgba(232,160,48,.5)" : C.border}`, borderRadius:10, color:C.text, padding:"12px 14px", fontFamily:C.sans, fontSize:14, boxSizing:"border-box" }}
      />
      {sub  && <div style={{ fontFamily:C.sans, fontSize:10, color:C.textFaint, marginTop:4 }}>{sub}</div>}
      {warn && <div style={{ fontFamily:C.sans, fontSize:10, color:C.amber,    marginTop:4 }}>? {warn}</div>}
    </div>
  );
}

// --- SELECTF ---
function SelectF({ label, value, onChange, options, groups, sub, placeholder }) {
  // options = [[val, label], ...] plana
  // groups  = [{ label:"Grupo", opts:[[val,label],...] }, ...]
  // placeholder = opcin vaca inicial
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:5 }}>{label}</div>}
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{ width:"100%", background:C.card2, border:`1px solid ${C.border}`, borderRadius:10,
          color: value ? C.text : C.textFaint,
          padding:"12px 14px", fontFamily:C.sans, fontSize:14 }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {groups
          ? groups.map(g => (
              <optgroup key={g.label} label={g.label}>
                {g.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </optgroup>
            ))
          : (options||[]).map(([v, l]) => <option key={v} value={v}>{l}</option>)
        }
      </select>
      {sub && <div style={{ fontFamily:C.sans, fontSize:10, color:C.textFaint, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

// --- SUPLSELECTOR ---
function SuplSelector({ label, supl, dosis, onSuplChange, onDosisChange, fenolPasto, color = T.green }) {
  const s    = SUPLEMENTOS[supl];
  const sinc = supl && dosis > 0 ? evaluarSincronia(fenolPasto, supl, dosis) : null;
  const mcal = mcalSuplemento(supl, dosis);

  return (
    <div style={{ background:T.card2, borderRadius:T.radius, padding:14, border:`1px solid ${T.border}`, marginBottom:12 }}>
      <div style={{ fontFamily:T.font, fontSize:10, color, letterSpacing:1, marginBottom:10 }}>{label}</div>
      <select
        value={supl || ""} onChange={e => onSuplChange(e.target.value)}
        style={{ width:"100%", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"10px 12px", fontFamily:T.fontSans, fontSize:13, marginBottom:10 }}
      >
        <option value=""> Sin suplemento </option>
        {Object.keys(SUPLEMENTOS).map(k => (
          <option key={k} value={k}>{SUPLEMENTOS[k].label} (PB {SUPLEMENTOS[k].pb}% | {SUPLEMENTOS[k].em} Mcal/kg)</option>
        ))}
      </select>

      <div style={{ display: supl ? "block" : "none" }}>
  <Slider label="Dosis kg/vaca/da" value={dosis} min={0.1} max={5} step={0.1} onChange={onDosisChange} unit=" kg" color={color} />
</div>

     <div style={{ display: (supl && dosis > 0) ? "flex" : "none", gap:8, flexWrap:"wrap", marginBottom:8 }}>
  <Pill color={T.blue}>+{mcal.toFixed(1)} Mcal/v/d</Pill>
  <Pill color={color}>PB {s.pb}%</Pill>
  {sinc && <Pill color={sinc.eficiente ? T.green : T.red}>{sinc.eficiente ? "? Sincrona OK" : "? Riesgo sincrona"}</Pill>}
</div>

      {sinc && sinc.warnings.map((w, i) => <Alerta key={i} nivel={w.nivel}>{w.msg}</Alerta>)}
    </div>
  );
}

// --- METRICCARD ---
const MetricCard = ({ label, value, color = T.green, sub, style: st }) => (
  <div style={{ background:T.card2, borderRadius:T.radius, padding:"10px 12px", border:`1px solid ${T.border}`, ...st }}>
    <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, letterSpacing:1, marginBottom:3 }}>{label}</div>
    <div style={{ fontFamily:T.font, fontSize:18, fontWeight:700, color, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontFamily:T.fontSans, fontSize:10, color:T.textFaint, marginTop:2 }}>{sub}</div>}
  </div>
);

// --- TOGGLE ---
const Toggle = ({ label, value, onChange }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
    <span style={{ fontFamily:T.fontSans, fontSize:13, color:T.text }}>{label}</span>
    <div
      onClick={() => onChange(!value)}
      style={{ width:44, height:24, borderRadius:12, background:value ? T.green : "rgba(255,255,255,.1)", cursor:"pointer", position:"relative", transition:"all .2s" }}
    >
      <div style={{ position:"absolute", top:3, left:value ? 22 : 3, width:18, height:18, borderRadius:9, background:"white", transition:"all .2s" }} />
    </div>
  </div>
);


export {
  Pill, Alerta, Slider, DistCC, LoadingPanel, Input, SelectF, SuplSelector,
  smf, smf2, mcalKgAdj, pbPasto, fAprovFenol, MetricCard, Toggle,
};
