"use client";

// ═══════════════════════════════════════════════════════════════════
// components/dashboard.js
// Dashboard principal + Score + Gráficos de balance y CC
// ═══════════════════════════════════════════════════════════════════

import { calcCadena, calcFaseCiclo, mcalSuplemento } from "../lib/motor";
import { calcCerebro } from "../lib/cerebro";
import React from "react";
import { T, MESES_NOM } from "../lib/constantes"
const C = T;
import { Pill, smf, smf2 } from "./ui";

// ─── SCORERADAR ───────────────────────────────────────────────────
function ScoreRadar({ score }) {
  if (!score) return null;
  const { total, colorTotal, labelTotal, dim } = score;

  // SVG araña — 6 ejes radiales
  const W = 280, H = 280, cx = 140, cy = 145, R = 100;
  const n = dim.length;
  const angle = (i) => (Math.PI * 2 * i / n) - Math.PI / 2; // arriba = primer eje

  // Puntos del polígono de score real
  const pts = dim.map((d, i) => {
    const r = R * d.score / 100;
    return { x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) };
  });
  // Polígono exterior (100%)
  const ptsMax = dim.map((_, i) => ({
    x: cx + R * Math.cos(angle(i)),
    y: cy + R * Math.sin(angle(i)),
  }));
  // Polígono intermedio (50%)
  const ptsMid = dim.map((_, i) => ({
    x: cx + R * 0.5 * Math.cos(angle(i)),
    y: cy + R * 0.5 * Math.sin(angle(i)),
  }));

  const toPath = (ps) => ps.map((p, i) => (i === 0 ? "M" : "L") + p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ") + " Z";

  // Color de relleno según total
  const fillColor = total >= 75 ? "#7ec85030" : total >= 50 ? "#e8a03025" : "#e0553025";
  const strokeColor = total >= 75 ? C.green : total >= 50 ? C.amber : C.red;

  return (
    <div style={{ background:C.card2, border:"1px solid " + C.border, borderRadius:16, padding:16, marginBottom:14 }}>
      {/* Header con score total */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <div style={{ fontFamily:C.font, fontSize:38, fontWeight:700, color:colorTotal, lineHeight:1 }}>
            {total}
          </div>
          <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, letterSpacing:1 }}>/ 100</div>
        </div>
        <div>
          <div style={{ fontFamily:C.font, fontSize:13, color:C.text, fontWeight:700, marginBottom:4 }}>
            {labelTotal}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
            {dim.map(d => (
              <span key={d.id} style={{
                fontFamily:C.font, fontSize:8, color:d.color,
                background:d.color + "15", borderRadius:4, padding:"2px 6px"
              }}>
                {d.nombre} {d.score}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Radar SVG */}
      <svg viewBox={"0 0 " + W + " " + H} style={{ width:"100%", maxWidth:W, display:"block", margin:"0 auto" }}>
        {/* Grillas de fondo */}
        <path d={toPath(ptsMax)} fill="none" stroke={C.border} strokeWidth="1" />
        <path d={toPath(ptsMid)} fill="none" stroke={C.border} strokeWidth="0.5" strokeDasharray="3,3" />
        {/* Ejes radiales */}
        {ptsMax.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={C.border} strokeWidth="0.5" />
        ))}
        {/* Polígono de score */}
        <path d={toPath(pts)} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        {/* Puntos en los vértices */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill={dim[i].color} stroke={C.card2} strokeWidth={1.5} />
        ))}
        {/* Etiquetas de ejes */}
        {ptsMax.map((p, i) => {
          const pad = 14;
          const lx = cx + (R + pad) * Math.cos(angle(i));
          const ly = cy + (R + pad) * Math.sin(angle(i));
          const anchor = lx < cx - 5 ? "end" : lx > cx + 5 ? "start" : "middle";
          return (
            <g key={i}>
              <text x={lx} y={ly - 3} textAnchor={anchor}
                style={{ fontFamily:C.font, fontSize:"8px", fill:dim[i].color, fontWeight:700 }}>
                {dim[i].nombre}
              </text>
              <text x={lx} y={ly + 8} textAnchor={anchor}
                style={{ fontFamily:C.font, fontSize:"9px", fill:C.text }}>
                {dim[i].score}
              </text>
            </g>
          );
        })}
        {/* Centro */}
        <circle cx={cx} cy={cy} r={3} fill={strokeColor} />
      </svg>

      {/* Detalle por dimensión */}
      <div style={{ marginTop:8 }}>
        {dim.map(d => (
          <div key={d.id} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}>
            <div style={{ width:32, flexShrink:0, textAlign:"right", fontFamily:C.font, fontSize:10, color:d.color, fontWeight:700 }}>
              {d.score}
            </div>
            <div style={{ flex:1, height:4, background:C.border, borderRadius:2, overflow:"hidden" }}>
              <div style={{ width:d.score + "%", height:"100%", background:d.color, borderRadius:2, transition:"width 0.5s" }} />
            </div>
            <div style={{ width:70, flexShrink:0, fontFamily:C.font, fontSize:8, color:C.textFaint }}>
              {d.nombre}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GRAFICOBALANCE ───────────────────────────────────────────────────
function GraficoBalance({ form, sat, cadena, tray, motor }) {
  const [mes, setMes] = React.useState(null);         // mes seleccionado (null = año completo)
  const [capa, setCapa] = React.useState("rodeo");    // rodeo | categorias | correctores

  const MESES_C = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const MESES_F = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  // ── Extraer del motor (fuente única de verdad) ────────────────
  const bm       = motor?.balanceMensual;
  const nVacas   = motor?.nVacas  || 0;
  const nToros   = motor?.nToros  || 0;
  const nV2s     = motor?.nV2s    || 0;
  const nVaq2    = motor?.nVaq2   || 0;
  const nVaq1    = motor?.nVaq1   || 0;
  const pvVaca   = parseFloat(form?.pvVacaAdulta) || 320;
  const factC    = motor?.factorCarga  || 1;
  const factA    = motor?.factorAgua   || 1;
  const verdeoMcal  = motor?.verdeoAporteMcalMes || 0;
  const verdeoMesI  = motor?.verdeoMesInicio ?? 7;
  const tieneVerdeo = form?.tieneVerdeo === "si" && verdeoMcal > 0;

  // Verificar qué falta para un diagnóstico útil
  const faltaSupHa   = !form?.supHa || parseFloat(form.supHa) <= 0;
  const faltaVacas   = !form?.vacasN || parseInt(form.vacasN) <= 0;
  const faltaProv    = !form?.provincia;

  // Si no hay balance del motor aún, mostrar panel de datos faltantes
  const faltantes = [];
  if (faltaProv)  faltantes.push("provincia");
  if (faltaVacas) faltantes.push("cantidad de vacas");
  if (faltaSupHa) faltantes.push("superficie (ha)");
  const sinSupHa = faltaSupHa;
  const esDatoEstimado = faltantes.length > 0;

  if (!bm || bm.length === 0) {
    return (
      <div style={{ padding:20, background:C.card2, border:"1px solid "+C.amber+"40", borderRadius:12 }}>
        <div style={{ fontFamily:T.font, fontSize:11, color:T.text, marginBottom:10, fontWeight:700 }}>
          📊 Balance forrajero
        </div>
        <div style={{ fontFamily:T.font, fontSize:10, color:T.amber, marginBottom:8 }}>
          Completá estos datos para ver el balance energético:
        </div>
        {faltantes.map(f => (
          <div key={f} style={{ fontFamily:T.font, fontSize:10, color:T.amber, marginBottom:4 }}>
            ⚠ Falta: {f}
          </div>
        ))}
        <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, marginTop:8, lineHeight:1.6 }}>
          El balance compara la energía que ofrece el pasto (según NDVI, tipo y superficie)
          contra la demanda del rodeo (según categorías y estado fisiológico) mes a mes.
          Con estos datos el sistema puede calcular cuándo hay déficit y cuánto suplemento se necesita.
        </div>
      </div>
    );
  }

  // ── Construir datos por categoría ────────────────────────────
  // Cada mes: oferta pasto/cabeza vs requerimiento/cabeza, por categoría
  // Fuente: balanceMensual ya tiene todo calculado con estado fisiológico real
  const datos = bm.map((m, i) => {
    const ofBase    = nVacas + nToros + nV2s + nVaq2 + nVaq1 > 0
      ? m.ofPastoTotal / Math.max(1, nVacas + nToros + nV2s + nVaq2 + nVaq1) : 0;

    // Oferta real per cápita (Mcal/animal/día) para cada categoría
    // El pasto se distribuye proporcionalmente al requerimiento (competencia)
    const totalReq  = m.demanda || 1;
    const ofVaca  = totalReq > 0 ? (m.ofPastoTotal * (m.dVacas / totalReq)) / Math.max(1, nVacas)  : 0;
    const ofToro  = totalReq > 0 ? (m.ofPastoTotal * (m.dToros / totalReq)) / Math.max(1, nToros)  : 0;
    const ofV2s   = totalReq > 0 ? (m.ofPastoTotal * (m.dV2s   / totalReq)) / Math.max(1, nV2s)    : 0;
    const ofVaq2  = totalReq > 0 ? (m.ofPastoTotal * (m.dVaq2  / totalReq)) / Math.max(1, nVaq2)   : 0;
    const ofVaq1  = totalReq > 0 ? (m.ofPastoTotal * (m.dVaq1  / totalReq)) / Math.max(1, nVaq1)   : 0;

    // Requerimiento por cabeza
    const rqVaca  = nVacas > 0 ? m.dVacas / nVacas : 0;
    const rqToro  = nToros > 0 ? m.dToros / nToros : 0;
    const rqV2s   = nV2s   > 0 ? m.dV2s   / nV2s   : 0;
    const rqVaq2  = nVaq2  > 0 ? m.dVaq2  / nVaq2  : 0;
    const rqVaq1  = nVaq1  > 0 ? m.dVaq1  / nVaq1  : 0;

    // Gap por cabeza (negativo = déficit)
    const gVaca  = nVacas > 0 ? +(ofVaca  - rqVaca).toFixed(1)  : 0;
    const gToro  = nToros > 0 ? +(ofToro  - rqToro).toFixed(1)  : 0;
    const gV2s   = nV2s   > 0 ? +(ofV2s   - rqV2s).toFixed(1)   : 0;
    const gVaq2  = nVaq2  > 0 ? +(ofVaq2  - rqVaq2).toFixed(1)  : 0;
    const gVaq1  = nVaq1  > 0 ? +(ofVaq1  - rqVaq1).toFixed(1)  : 0;

    // Suplemento por categoría (Mcal/animal/día)
    // Suplemento solo aplica en los meses activos configurados por el usuario
    const suplMesesSet = new Set((form?.suplMeses || ["5","6","7"]).map(Number));
    const enMesSupl    = suplMesesSet.has(i);
    const sVaca  = 0; // vacas: herramienta = destete
    const sToro  = enMesSupl && nToros > 0 ? +(mcalSuplemento(form?.supl_toros, parseFloat(form?.dosis_toros)||0)).toFixed(1) : 0;
    const sV2s   = enMesSupl && nV2s   > 0 ? +(mcalSuplemento(form?.supl_v2s,   parseFloat(form?.dosis_v2s)  ||0)).toFixed(1) : 0;
    const sVaq2  = enMesSupl && nVaq2  > 0 ? +(mcalSuplemento(form?.supl_vaq2,  parseFloat(form?.dosis_vaq2) ||0)).toFixed(1) : 0;
    const sVaq1  = enMesSupl && nVaq1  > 0 ? +(mcalSuplemento(form?.supl_vaq1,  parseFloat(form?.dosis_vaq1) ||0)).toFixed(1) : 0;

    // Verdeo: aplica en los meses definidos, a la categoría destino
    const hayVerdeo = tieneVerdeo && i >= verdeoMesI && i <= verdeoMesI + 2;
    const vVaq1   = hayVerdeo && form?.verdeoDestinoVaq === "si" && nVaq1 > 0
      ? +(verdeoMcal / nVaq1).toFixed(1) : 0;
    // Si verdeo no va a vaq1 exclusivo, distribuye al rodeo
    const vRodeo  = hayVerdeo && form?.verdeoDestinoVaq !== "si"
      ? +(verdeoMcal / Math.max(1, nVacas + nToros + nV2s + nVaq2 + nVaq1)).toFixed(1) : 0;

    // Balance NETO por cabeza DESPUÉS de correctores
    const bnVaca  = nVacas > 0 ? +(gVaca  + sVaca  + (vRodeo || 0)).toFixed(1) : 0;
    const bnToro  = nToros > 0 ? +(gToro  + sToro  + (vRodeo || 0)).toFixed(1) : 0;
    const bnV2s   = nV2s   > 0 ? +(gV2s   + sV2s   + (vRodeo || 0)).toFixed(1) : 0;
    const bnVaq2  = nVaq2  > 0 ? +(gVaq2  + sVaq2  + (hayVerdeo ? (vVaq1 || vRodeo) : 0)).toFixed(1) : 0;
    const bnVaq1  = nVaq1  > 0 ? +(gVaq1  + sVaq1  + vVaq1 + (vRodeo || 0)).toFixed(1) : 0;

    return {
      mes: MESES_C[i], i,
      t: m.t,
      fenol: m.fenol,
      pbPas: m.pbPas,
      // Totales rodeo
      ofPasto: m.ofPastoTotal,
      ccAporte: m.ccAporte,
      suplTotal: m.suplAporte,
      verdeoTotal: m.verdeoAporte,
      demanda: m.demanda,
      balance: m.balance,
      deficit: m.deficit,
      // Por categoría — requerimiento
      rqVaca:  +rqVaca.toFixed(1),  rqToro:  +rqToro.toFixed(1),
      rqV2s:   +rqV2s.toFixed(1),   rqVaq2:  +rqVaq2.toFixed(1),
      rqVaq1:  +rqVaq1.toFixed(1),
      // Por categoría — oferta pasto disponible
      ofVaca:  +ofVaca.toFixed(1),   ofToro:  +ofToro.toFixed(1),
      ofV2s:   +ofV2s.toFixed(1),    ofVaq2:  +ofVaq2.toFixed(1),
      ofVaq1:  +ofVaq1.toFixed(1),
      // Gap puro (sin correctores)
      gVaca, gToro, gV2s, gVaq2, gVaq1,
      // Suplemento por categoría
      sVaca, sToro, sV2s, sVaq2, sVaq1,
      // Verdeo
      vVaq1, vRodeo,
      // Balance neto (con correctores)
      bnVaca, bnToro, bnV2s, bnVaq2, bnVaq1,
      // Fisiología
      estadoVaca: m.estadoVaca,
      esParto: m.esParto, esServIni: m.esServIni,
    };
  });

  // ── Mes seleccionado o promedio ───────────────────────────────
  const dMes = mes !== null ? datos[mes] : null;

  // ── Paleta de categorías ──────────────────────────────────────
  const CAT = [
    { id:"vaca",  label:"Vacas",        color:"#e8a030", n:nVacas, gKey:"gVaca",  bnKey:"bnVaca",  rqKey:"rqVaca",  ofKey:"ofVaca",  sKey:"sVaca",  nota:"Herramienta: destete" },
    { id:"v2s",   label:"V 2° serv.",   color:"#e05530", n:nV2s,   gKey:"gV2s",   bnKey:"bnV2s",   rqKey:"rqV2s",   ofKey:"ofV2s",   sKey:"sV2s"  },
    { id:"toro",  label:"Toros",        color:"#9b59b6", n:nToros, gKey:"gToro",  bnKey:"bnToro",  rqKey:"rqToro",  ofKey:"ofToro",  sKey:"sToro" },
    { id:"vaq2",  label:"Vaq 2° inv.",  color:"#4a9fd4", n:nVaq2,  gKey:"gVaq2",  bnKey:"bnVaq2",  rqKey:"rqVaq2",  ofKey:"ofVaq2",  sKey:"sVaq2" },
    { id:"vaq1",  label:"Vaq 1° inv.",  color:"#7ec850", n:nVaq1,  gKey:"gVaq1",  bnKey:"bnVaq1",  rqKey:"rqVaq1",  ofKey:"ofVaq1",  sKey:"sVaq1" },
  ].filter(c => c.n > 0);

  // ── Mes crítico para highlight ────────────────────────────────
  const peorMes = datos.reduce((a, b) => b.balance < a.balance ? b : a);
  const mesesDef = datos.filter(d => d.deficit);

  // ══════════════════════════════════════════════════════════════
  // SUB-COMPONENTES
  // ══════════════════════════════════════════════════════════════

  // Barra horizontal de gap: muestra oferta vs req
  const GapBar = ({ of, rq, supl, verdeo, color, label, n }) => {
    if (!n) return null;
    const pct   = rq > 0 ? Math.min(1, of / rq) : 1;
    const pctS  = rq > 0 && supl > 0 ? Math.min(1 - pct, supl / rq) : 0;
    const pctV  = rq > 0 && verdeo > 0 ? Math.min(1 - pct - pctS, verdeo / rq) : 0;
    const gap   = of - rq;
    const cubierto = pct + pctS + pctV;
    return (
      <div style={{ marginBottom:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
          <span style={{ fontFamily:T.font, fontSize:9, color }}>{label}</span>
          <span style={{ fontFamily:T.font, fontSize:9, color: gap >= 0 ? T.green : T.red, fontWeight:700 }}>
            {gap >= 0 ? "+" : ""}{gap.toFixed(1)} Mcal/cab/d
          </span>
        </div>
        <div style={{ height:10, borderRadius:5, background:`${T.border}`, overflow:"hidden", position:"relative" }}>
          {/* Pasto */}
          <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${pct*100}%`, background:color, borderRadius:"5px 0 0 5px" }} />
          {/* Suplemento */}
          {pctS > 0 && (
            <div style={{ position:"absolute", top:0, bottom:0, left:`${pct*100}%`, width:`${pctS*100}%`, background:"#4a9fd4" }} />
          )}
          {/* Verdeo */}
          {pctV > 0 && (
            <div style={{ position:"absolute", top:0, bottom:0, left:`${(pct+pctS)*100}%`, width:`${pctV*100}%`, background:"#7ec850", opacity:0.7 }} />
          )}
          {/* Línea de requerimiento */}
          <div style={{ position:"absolute", top:0, bottom:0, left:"100%", transform:"translateX(-1px)", width:2, background:T.red, opacity:0.6 }} />
        </div>
        <div style={{ display:"flex", gap:8, marginTop:2 }}>
          <span style={{ fontFamily:T.font, fontSize:7, color:T.textFaint }}>Pasto {(pct*100).toFixed(0)}%</span>
          {pctS > 0 && <span style={{ fontFamily:T.font, fontSize:7, color:"#4a9fd4" }}>+ supl {(pctS*100).toFixed(0)}%</span>}
          {pctV > 0 && <span style={{ fontFamily:T.font, fontSize:7, color:"#7ec850" }}>+ verdeo {(pctV*100).toFixed(0)}%</span>}
          <span style={{ fontFamily:T.font, fontSize:7, color:T.textFaint, marginLeft:"auto" }}>Req: {rq.toFixed(1)} Mcal</span>
        </div>
      </div>
    );
  };

  // Columna mensual del timeline
  const ColMes = ({ d, activo, onClick }) => {
    const isCrit = d.i === peorMes.i;
    return (
      <div onClick={onClick} style={{
        flex:1, cursor:"pointer", minWidth:0,
        borderRadius:6, padding:"4px 2px",
        background: activo ? `${T.green}15` : isCrit ? `${T.red}08` : "transparent",
        border: activo ? `1px solid ${T.green}40` : `1px solid transparent`,
        transition:"all .15s",
      }}>
        {/* Mini barras apiladas por categoría */}
        <div style={{ height:40, display:"flex", flexDirection:"column-reverse", gap:1 }}>
          {CAT.map(c => {
            const gap = d[c.bnKey];
            if (gap === 0) return null;
            const h = Math.min(36, Math.max(2, Math.abs(gap) * 2.5));
            return (
              <div key={c.id} style={{
                height:h, borderRadius:2,
                background: gap >= 0 ? c.color : T.red,
                opacity: gap >= 0 ? 0.75 : 0.9,
              }} />
            );
          })}
        </div>
        <div style={{ textAlign:"center", fontFamily:T.font, fontSize:7, color: d.deficit ? T.red : T.textFaint, marginTop:2 }}>
          {d.mes}
        </div>
        {(d.esParto || d.esServIni) && (
          <div style={{ textAlign:"center", fontSize:6, marginTop:1 }}>{d.esParto ? "🐄" : "🐂"}</div>
        )}
      </div>
    );
  };

  // Panel de detalle del mes seleccionado
  const DetalleMes = ({ d }) => {
    // Correctores que aplican este mes
    const haySuplMes = CAT.some(c => d[c.sKey] > 0);
    const hayVerdeoMes = d.vVaq1 > 0 || d.vRodeo > 0;

    return (
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:14, marginTop:10 }}>
        {/* Header mes */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:T.font, fontSize:13, color:T.text, fontWeight:700 }}>{MESES_F[d.i]}</div>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, marginTop:2 }}>
              {d.t}°C · PB pasto {d.pbPas}% · {d.estadoVaca}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:T.font, fontSize:18, fontWeight:700,
              color: d.balance >= 0 ? T.green : T.red }}>
              {d.balance >= 0 ? "+" : ""}{d.balance.toLocaleString()} Mcal
            </div>
            <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>balance neto rodeo/día</div>
          </div>
        </div>

        {/* Barras por categoría */}
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, letterSpacing:1, marginBottom:8 }}>
            OFERTA vs REQUERIMIENTO — Mcal/cabeza/día
          </div>
          {CAT.map(c => (
            <GapBar key={c.id}
              of={d[c.ofKey]}
              rq={d[c.rqKey]}
              supl={d[c.sKey]}
              verdeo={c.id === "vaq1" ? d.vVaq1 : d.vRodeo}
              color={c.color}
              label={c.label + (c.nota ? ` — ${c.nota}` : "")}
              n={c.n}
            />
          ))}
        </div>

        {/* Leyenda correctores */}
        {(haySuplMes || hayVerdeoMes) && (
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", padding:"6px 10px",
            background:`rgba(255,255,255,.03)`, borderRadius:8, border:`1px solid ${T.border}` }}>
            <span style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>Correctores activos este mes:</span>
            {haySuplMes && <span style={{ fontFamily:T.font, fontSize:8, color:"#4a9fd4" }}>● Suplemento</span>}
            {hayVerdeoMes && <span style={{ fontFamily:T.font, fontSize:8, color:"#7ec850" }}>● Verdeo</span>}
          </div>
        )}

        {/* Alerta vaca: recordatorio herramienta */}
        {d.gVaca < -1 && nVacas > 0 && (
          <div style={{ marginTop:8, padding:"6px 10px", background:`${T.amber}08`,
            border:`1px solid ${T.amber}25`, borderRadius:8,
            fontFamily:T.font, fontSize:9, color:T.amber }}>
            🔶 Vacas: déficit {Math.abs(d.gVaca).toFixed(1)} Mcal/cab. Herramienta = destete precoz, no suplemento con ternero al pie.
          </div>
        )}
      </div>
    );
  };

  // ── Vista del año completo: gráfico de área apilado ──────────
  const VistaAnual = () => {
    // Para el gráfico Recharts: datos con oferta+correctores vs requerimiento por categoría
    const dataChart = datos.map(d => ({
      mes: d.mes,
      // Oferta base del pasto (separada de correctores)
      pastoPuro:  +(d.ofPasto / Math.max(1, nVacas+nToros+nV2s+nVaq2+nVaq1)).toFixed(1),
      // Correctores
      supl:       CAT.reduce((s,c) => s + d[c.sKey], 0),
      verdeo:     d.verdeoTotal > 0 ? +(d.verdeoTotal / Math.max(1,nVacas+nToros+nV2s+nVaq2+nVaq1)).toFixed(1) : 0,
      // CC movilizada — APILADA encima de la oferta, SOLO en meses de lactación (hasta servicio)
      ccAporte:   d.enLact && d.ccAporte > 0 ? +(d.ccAporte / Math.max(1,nVacas)).toFixed(1) : 0,
      // Requerimiento promedio ponderado
      reqProm:    +(d.demanda / Math.max(1,nVacas+nToros+nV2s+nVaq2+nVaq1)).toFixed(1),
    }));

    return (
      <div style={{ background:T.card2, borderRadius:10, padding:14, border:`1px solid ${T.border}` }}>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, letterSpacing:1, marginBottom:4 }}>
          MCAL/ANIMAL EQUIVALENTE/DÍA — pasto + correctores vs requerimiento
        </div>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginBottom:10 }}>
          La franja naranja es CC movilizada — solo aparece durante la lactación (hasta el servicio)
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <ComposedChart data={dataChart} margin={{ top:4, right:8, left:-18, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
            <XAxis dataKey="mes" tick={{ fill:T.textFaint, fontSize:8 }} />
            <YAxis tick={{ fill:T.textFaint, fontSize:7 }} />
            <Tooltip
              contentStyle={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontFamily:T.font, fontSize:10 }}
              formatter={(v, n) => [v + " Mcal", n]}
            />
            {/* Pasto puro — base verde */}
            <Area type="monotone" dataKey="pastoPuro" name="Pasto" stackId="oferta"
              fill="#7ec850" fillOpacity={0.55} stroke="#7ec850" strokeWidth={1} />
            {/* Suplemento — azul apilado */}
            <Area type="monotone" dataKey="supl" name="Suplemento" stackId="oferta"
              fill="#4a9fd4" fillOpacity={0.65} stroke="#4a9fd4" strokeWidth={1} />
            {/* Verdeo — verde claro apilado */}
            {tieneVerdeo && (
              <Area type="monotone" dataKey="verdeo" name="Verdeo" stackId="oferta"
                fill="#a8e06a" fillOpacity={0.7} stroke="#a8e06a" strokeWidth={1} />
            )}
            {/* CC movilizada — naranja APILADA, solo lactación hasta servicio */}
            <Area type="monotone" dataKey="ccAporte" name="CC movilizada (lactación)" stackId="oferta"
              fill="#e8a030" fillOpacity={0.6} stroke="#e8a030" strokeWidth={1.5} />
            {/* Requerimiento — línea roja prominente */}
            <Line type="monotone" dataKey="reqProm" name="Requerimiento"
              stroke={T.red} strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // ── Vista por categoría: líneas de balance neto/cabeza ────────
  const VistaCategorias = () => {
    const dataChart = datos.map(d => {
      const row = { mes: d.mes };
      CAT.forEach(c => { row[c.id] = d[c.bnKey]; });
      return row;
    });

    return (
      <div style={{ background:T.card2, borderRadius:10, padding:14, border:`1px solid ${T.border}` }}>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, letterSpacing:1, marginBottom:4 }}>
          BALANCE NETO POR CATEGORÍA — Mcal/cabeza/día (con todos los correctores)
        </div>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginBottom:10 }}>
          Cero = requerimiento cubierto exacto. Negativo = déficit que la vaca/vaquillona paga con CC o GDP.
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <ComposedChart data={dataChart} margin={{ top:4, right:8, left:-18, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
            <XAxis dataKey="mes" tick={{ fill:T.textFaint, fontSize:8 }} />
            <YAxis tick={{ fill:T.textFaint, fontSize:7 }} />
            <ReferenceLine y={0} stroke={T.red} strokeWidth={1.5} strokeOpacity={0.5} />
            <Tooltip
              contentStyle={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontFamily:T.font, fontSize:10 }}
              formatter={(v, n) => [(v > 0 ? "+" : "") + v + " Mcal/cab", n]}
            />
            <Legend wrapperStyle={{ fontFamily:T.font, fontSize:8, color:T.textDim }} />
            {CAT.map(c => (
              <Line key={c.id} type="monotone" dataKey={c.id} name={c.label}
                stroke={c.color} strokeWidth={2} dot={false} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginTop:6 }}>
          ↑ Línea roja punteada = cero. Por encima = superávit. Por debajo = la categoría entra en déficit ese mes.
        </div>
      </div>
    );
  };

  // ── Vista correctores: qué resuelve cada uno ─────────────────
  const VistaCorrectores = () => {
    // Para cada mes con déficit: mostrar gap original vs qué cierra cada corrector
    const defData = datos.filter(d => d.deficit || (tieneVerdeo && d.i >= verdeoMesI && d.i <= verdeoMesI+2));
    if (defData.length === 0) return (
      <div style={{ padding:20, textAlign:"center", fontFamily:T.font, fontSize:11, color:T.green }}>
        ✅ Sin déficit — todos los meses el rodeo cubre sus requerimientos
      </div>
    );

    return (
      <div>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, letterSpacing:1, marginBottom:10 }}>
          ACCIÓN DE CORRECTORES EN MESES RELEVANTES
        </div>
        {datos.map((d, i) => {
          const hayCorrector = CAT.some(c => d[c.sKey] > 0) || d.vVaq1 > 0 || d.vRodeo > 0;
          if (!d.deficit && !hayCorrector) return null;

          // Balance sin correctores
          const defSinCorrec = d.ofPasto - d.demanda;
          // Balance con suplemento
          const conSupl      = defSinCorrec + d.suplTotal;
          // Balance con suplemento + verdeo
          const conSuplVerd  = conSupl + d.verdeoTotal;
          // Balance final (incluye CC movilizada si aplica)
          const balFinal     = d.balance;

          const barW = (v, max) => `${Math.min(100, Math.max(0, (v + Math.abs(Math.min(0,defSinCorrec))) / (Math.abs(defSinCorrec) + 1) * 100)).toFixed(0)}%`;

          return (
            <div key={i} style={{ marginBottom:10, background:T.card2,
              border:`1px solid ${d.deficit ? T.red+"30" : T.border}`, borderRadius:10, padding:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontFamily:T.font, fontSize:11, color:T.text, fontWeight:600 }}>{MESES_F[i]}</span>
                <span style={{ fontFamily:T.font, fontSize:9, color:T.textFaint }}>{d.t}°C · PB {d.pbPas}%</span>
              </div>

              {/* Cascada de correctores */}
              {[
                { label:"Solo pasto",              val:defSinCorrec, color:T.textFaint },
                { label:"+ Suplemento",            val:conSupl,      color:"#4a9fd4", show: d.suplTotal > 0 },
                { label:"+ Verdeo",                val:conSuplVerd,  color:"#7ec850", show: d.verdeoTotal > 0 },
                { label:"+ CC movilizada (vaca)",  val:balFinal,     color:"#e8a030", show: d.ccAporte > 0, nota:"— costo pagado por la vaca" },
              ].filter(r => r.show !== false).map((r, ri) => {
                const pct = Math.min(100, Math.max(0,
                  ((r.val - defSinCorrec) / (Math.abs(defSinCorrec) || 1)) * 100
                ));
                return (
                  <div key={ri} style={{ marginBottom:6 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                      <span style={{ fontFamily:T.font, fontSize:9, color:T.textFaint }}>
                        {r.label}{r.nota && <span style={{color:T.amber}}>{r.nota}</span>}
                      </span>
                      <span style={{ fontFamily:T.font, fontSize:10, fontWeight:700,
                        color: r.val >= 0 ? T.green : T.red }}>
                        {r.val >= 0 ? "+" : ""}{r.val.toLocaleString()} Mcal
                      </span>
                    </div>
                    <div style={{ height:6, borderRadius:3, background:T.border, overflow:"hidden" }}>
                      <div style={{
                        height:"100%",
                        width: r.val >= 0 ? "100%" : `${Math.max(2, (1 - Math.abs(r.val)/Math.abs(defSinCorrec||1))*100)}%`,
                        background: r.val >= 0 ? r.color : T.red,
                        borderRadius:3, opacity: r.val >= 0 ? 0.8 : 0.5,
                        transition:"width .3s",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER SIMPLIFICADO — solo lo que le sirve al productor
  // ══════════════════════════════════════════════════════════════
  return (
    <div>
      {/* ── 3 KPIs clave ──────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
        <div style={{ background: mesesDef.length === 0 ? `${T.green}08` : `${T.red}08`,
          border:`1px solid ${mesesDef.length === 0 ? T.green : T.red}30`,
          borderRadius:10, padding:"10px 6px", textAlign:"center" }}>
          <div style={{ fontFamily:T.font, fontSize:26, fontWeight:700,
            color: mesesDef.length === 0 ? T.green : T.red }}>{mesesDef.length}</div>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginTop:2 }}>meses con déficit</div>
        </div>
        <div style={{ background:T.card2, border:`1px solid ${T.border}`,
          borderRadius:10, padding:"10px 6px", textAlign:"center" }}>
          <div style={{ fontFamily:T.font, fontSize:26, fontWeight:700,
            color: peorMes.balance < -500 ? T.red : T.amber }}>
            {peorMes.balance < 0 ? peorMes.balance.toLocaleString() : "✓"}
          </div>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginTop:2 }}>Mcal/d peor mes ({peorMes.mes})</div>
        </div>
        <div style={{ background: tieneVerdeo ? `${T.green}08` : T.card2,
          border:`1px solid ${tieneVerdeo ? T.green : T.border}30`,
          borderRadius:10, padding:"10px 6px", textAlign:"center" }}>
          <div style={{ fontFamily:T.font, fontSize:26, fontWeight:700,
            color: tieneVerdeo ? T.green : T.textFaint }}>
            {tieneVerdeo ? "+" + (verdeoMcal * 3 / 1000).toFixed(0) + "k" : "—"}
          </div>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginTop:2 }}>
            {tieneVerdeo ? `Mcal verdeo (${MESES_C[verdeoMesI]}–${MESES_C[Math.min(11,verdeoMesI+2)]})` : "Sin verdeo"}
          </div>
        </div>
      </div>

      {/* ── Gráfico anual pasto+supl vs requerimiento ───────────── */}
      <VistaAnual />

      {/* ── Timeline: tocá un mes para ver detalle ──────────────── */}
      <div style={{ background:T.card2, borderRadius:10, padding:"10px 8px",
        border:`1px solid ${T.border}`, marginTop:12, marginBottom:2 }}>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginBottom:6 }}>
          Tocá un mes para ver el detalle ↓
        </div>
        <div style={{ display:"flex", gap:2 }}>
          {datos.map((d, i) => (
            <ColMes key={i} d={d} activo={mes === i}
              onClick={() => setMes(mes === i ? null : i)} />
          ))}
        </div>
      </div>
      {mes !== null && <DetalleMes d={datos[mes]} />}
    </div>
  );
}

// ─── TRAYECTORIAVAQUILLONA ───────────────────────────────────────────────────
function TrayectoriaVaquillona({ motor, form }) {
  if (!motor) return null;
  const { vaq1E, vaq2E, pvEntVaq1, pvEntradaVaq2 } = motor;
  if (!vaq1E && !vaq2E) return null;

  const pvVaca    = parseFloat(form.pvVacaAdulta) || 320;
  const pvV1ent   = pvEntVaq1 || Math.round(pvVaca * 0.40);
  const diasInv1  = 90; // mayo → agosto
  const diasInv2  = 90;

  // Vaq1: sin suplemento = GDP pasto solo (gdpPasto), con suplemento = gdpReal
  const gdpV1sinSupl = vaq1E?.gdpPasto || 50;   // pasto solo invierno NEA
  const gdpV1conSupl = vaq1E ? (vaq1E.sinSupl ? gdpV1sinSupl : (vaq1E.gdpReal || gdpV1sinSupl)) : gdpV1sinSupl;
  const pvV1sal_sin  = Math.round(pvV1ent + gdpV1sinSupl * diasInv1 / 1000);
  const pvV1sal_con  = Math.round(pvV1ent + gdpV1conSupl * diasInv1 / 1000);
  // +60d primavera a 280g/d hasta entrada 2°inv
  const pvV2ent_sin  = Math.round(pvV1sal_sin + 280 * 60 / 1000);
  const pvV2ent_con  = parseFloat(pvEntradaVaq2) || Math.round(pvV1sal_con + 280 * 60 / 1000);

  // Vaq2: sin suplemento = gdpPastoInv, con suplemento = gdpInv real
  const gdpV2sinSupl = vaq2E?.gdpPastoInv || 50;
  const gdpV2conSupl = vaq2E ? (vaq2E.sinSupl ? gdpV2sinSupl : (vaq2E.gdpInv || gdpV2sinSupl)) : gdpV2sinSupl;
  const gdpPrimV_sin = 280; // g/d primavera sin suplemento previo — limitado por estado
  const gdpPrimV_con = vaq2E?.gdpPrimavera || 350;
  const pvV2inv_sin  = Math.round(pvV2ent_sin + gdpV2sinSupl * diasInv2 / 1000);
  const pvV2inv_con  = vaq2E?.pvV2Agosto || Math.round(pvV2ent_con + gdpV2conSupl * diasInv2 / 1000);
  const pvEntore_sin = Math.round(pvV2inv_sin + gdpPrimV_sin * 90 / 1000);
  const pvEntore_con = vaq2E?.pvEntore    || Math.round(pvV2inv_con + gdpPrimV_con * 90 / 1000);
  const pvMinEntore  = vaq2E?.pvMinEntore || Math.round(pvVaca * 0.75);

  const etapas    = ["Destete", "Mayo\n(1° inv.)", "Agosto\n(sal.1°)", "Mayo\n(2° inv.)", "Agosto\n(sal.2°)", "Entore"];
  const pvSinSupl = [pvV1ent, pvV1ent, pvV1sal_sin, pvV2ent_sin, pvV2inv_sin, pvEntore_sin];
  const pvConSupl = [pvV1ent, pvV1ent, pvV1sal_con, pvV2ent_con, pvV2inv_con, pvEntore_con];

  // Si sin suplemento = con suplemento en todos los puntos → no mostrar línea duplicada
  const tieneSupl = pvSinSupl.some((v, i) => Math.abs(v - pvConSupl[i]) >= 5);

  const pvMin = Math.min(...pvSinSupl, ...pvConSupl, pvMinEntore) - 15;
  const pvMax = Math.max(...pvSinSupl, ...pvConSupl, pvMinEntore) + 15;
  const W = 320, H = 160, padL = 38, padR = 12, padT = 14, padB = 38;
  const gW = W - padL - padR;
  const gH = H - padT - padB;
  const n  = etapas.length;
  const xOf = (i) => padL + (i / (n-1)) * gW;
  const yOf = (pv) => padT + (1 - (pv - pvMin) / (pvMax - pvMin)) * gH;

  const pathSin = pvSinSupl.map((v,i) => `${i===0?"M":"L"}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ");
  const pathCon = pvConSupl.map((v,i) => `${i===0?"M":"L"}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ");
  const yEntore = yOf(pvMinEntore);

  return (
    <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginBottom:12 }}>
      <div style={{ fontFamily:C.font, fontSize:9, color:C.green, letterSpacing:1, marginBottom:8 }}>
        📈 TRAYECTORIA VAQUILLONA — DESTETE → ENTORE
      </div>
      <svg width={W} height={H} style={{ display:"block", overflow:"visible" }}>
        {/* Grilla horizontal */}
        {[0,0.25,0.5,0.75,1].map(f => {
          const pv = pvMin + f*(pvMax-pvMin);
          const y  = yOf(pv);
          return (
            <g key={f}>
              <line x1={padL} y1={y} x2={W-padR} y2={y} stroke={C.border} strokeWidth={0.5} />
              <text x={padL-4} y={y+3} textAnchor="end" fontSize={7} fill={C.textDim} fontFamily="monospace">
                {Math.round(pv)}
              </text>
            </g>
          );
        })}
        {/* Línea objetivo entore */}
        <line x1={padL} y1={yEntore} x2={W-padR} y2={yEntore}
          stroke="#e8a030" strokeWidth={1} strokeDasharray="4,3" />
        <text x={W-padR+2} y={yEntore+3} fontSize={7} fill="#e8a030" fontFamily="monospace">{pvMinEntore}kg</text>
        {/* Zonas invierno */}
        <rect x={xOf(1)} y={padT} width={xOf(2)-xOf(1)} height={gH} fill={C.blue} fillOpacity={0.04} />
        <rect x={xOf(3)} y={padT} width={xOf(4)-xOf(3)} height={gH} fill={C.blue} fillOpacity={0.04} />
        <text x={(xOf(1)+xOf(2))/2} y={padT+7} textAnchor="middle" fontSize={6.5} fill={C.blue} fillOpacity={0.5} fontFamily="monospace">INV 1</text>
        <text x={(xOf(3)+xOf(4))/2} y={padT+7} textAnchor="middle" fontSize={6.5} fill={C.blue} fillOpacity={0.5} fontFamily="monospace">INV 2</text>
        {/* Línea SIN suplemento — solo si hay diferencia real */}
        {tieneSupl && (
          <path d={pathSin} fill="none" stroke={C.red} strokeWidth={1.5} strokeDasharray="5,3" />
        )}
        {/* Línea CON suplemento */}
        <path d={pathCon} fill="none" stroke={C.green} strokeWidth={2} />
        {/* Puntos CON suplemento */}
        {pvConSupl.map((v,i) => (
          <circle key={i} cx={xOf(i)} cy={yOf(v)} r={3}
            fill={i===n-1 && v>=pvMinEntore ? C.green : C.card2}
            stroke={C.green} strokeWidth={1.5} />
        ))}
        {/* Etiquetas eje X */}
        {etapas.map((et, i) => {
          const lines = et.split("\n");
          return (
            <g key={i}>
              {lines.map((ln, j) => (
                <text key={j} x={xOf(i)} y={H - padB + 12 + j*9}
                  textAnchor="middle" fontSize={7} fill={C.textDim} fontFamily="monospace">
                  {ln}
                </text>
              ))}
            </g>
          );
        })}
        {/* Etiqueta PV en entore */}
        {(() => {
          const pvFin = pvConSupl[n-1];
          const ok    = pvFin >= pvMinEntore;
          return (
            <text x={xOf(n-1)} y={yOf(pvFin)-8} textAnchor="middle"
              fontSize={8} fill={ok ? C.green : C.red} fontFamily="monospace" fontWeight="bold">
              {pvFin}kg {ok ? "✓" : "✗"}
            </text>
          );
        })()}
      </svg>
      {/* Leyenda sin costos — limpia */}
      <div style={{ display:"flex", gap:14, marginTop:4 }}>
        {tieneSupl && (
          <div style={{ display:"flex", alignItems:"center", gap:4, fontFamily:"monospace", fontSize:8, color:C.red }}>
            <svg width={20} height={6}><line x1={0} y1={3} x2={20} y2={3} stroke={C.red} strokeWidth={1.5} strokeDasharray="4,2"/></svg>
            Sin suplemento
          </div>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:4, fontFamily:"monospace", fontSize:8, color:C.green }}>
          <svg width={20} height={6}><line x1={0} y1={3} x2={20} y2={3} stroke={C.green} strokeWidth={2}/></svg>
          Con suplemento
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4, fontFamily:"monospace", fontSize:8, color:"#e8a030" }}>
          <svg width={20} height={6}><line x1={0} y1={3} x2={20} y2={3} stroke="#e8a030" strokeWidth={1} strokeDasharray="3,2"/></svg>
          Mín. entore ({pvMinEntore}kg)
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARDESTABLECIMIENTO ───────────────────────────────────────────────────
function DashboardEstablecimiento({ motor, form, sat, score, confianza, onTab }) {
  const hoy     = new Date();
  const mesHoy  = hoy.getMonth();
  const MESES   = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const impactoCola = motor?.impactoCola ?? null;

  // Fase del ciclo
  const cadena    = motor?.cadena ?? (form.iniServ && form.finServ ? calcCadena(form.iniServ, form.finServ) : null);
  const faseCiclo = cadena ? calcFaseCiclo(cadena, form, {
    tempHoy: sat?.temp ? parseFloat(sat.temp) : null,
    ndviHoy: sat?.ndvi ? parseFloat(sat.ndvi) : null,
    p30Hoy:  sat?.p30  ? parseFloat(sat.p30)  : null,
    ccServ:  parseFloat(motor?.tray?.ccServ || 0),
    ccToros: parseFloat(form.torosCC || 0),
    prenez:  motor?.tray?.pr ?? 0,
    mesesDeficit: motor?.balanceMensual?.filter(m=>[5,6,7].includes(m.i)&&m.balance<0).length ?? 0,
    peorBalanceMcal: motor?.balanceMensual?.filter(m=>[5,6,7].includes(m.i)).reduce((mn,m)=>m.balance<(mn?.balance??0)?m:mn,null)?.balance ?? 0,
    pvVaca: parseFloat(form.pvVacaAdulta)||320,
    nVacas: parseFloat(form.vacasN)||0,
    vaq1SinCorr: motor?.vaq1E ? (motor.vaq1E?.gdpReal||0) < 200 : false,
    vaq2Llega: motor?.vaq2E?.llegas ?? true,
    pvVaq2Falta: motor?.vaq2E?.llegas ? 0 : (motor?.vaq2E?.pvMinEntore||0)-(motor?.vaq2E?.pvEntore||0),
    balanceMesActual: motor?.balanceMensual?.find(m=>m.i===mesHoy)?.balance ?? 0,
  }) : null;

  const tray     = motor?.tray;
  const balMen   = motor?.balanceMensual ?? [];
  const ccServ   = parseFloat(tray?.ccServ || 0);
  const prenez   = tray?.pr ?? null;
  const smf      = (v, ok, warn) => v >= ok ? C.green : v >= warn ? C.amber : C.red;

  // Balance invernal — semáforo de 3 meses
  const balInv = [5,6,7].map(i => {
    const b = balMen.find(m => m.i === i);
    return { mes: MESES[i], bal: b ? Math.round(b.balance) : null };
  });
  const mesesRojos = balInv.filter(b => b.bal !== null && b.bal < 0).length;

  // Puntos críticos del motor — máximo 3
  const cerebro = motor ? calcCerebro(motor, form, sat) : null;
  const tarjCrit = cerebro?.tarjetas?.filter(t => t.prioridad === "P1" || t.prioridad === "URGENTE")
    .slice(0,3) ?? [];

  return (
    <div>
      {/* ── HEADER: establecimiento + fecha ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
        <div>
          <div style={{ fontFamily:C.font, fontSize:16, color:C.text, fontWeight:700 }}>
            {form.nombreProductor || "Establecimiento"}
          </div>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginTop:2 }}>
            {[form.localidad, form.provincia, form.zona].filter(Boolean).join(" · ")} · {hoy.toLocaleDateString("es-AR",{day:"2-digit",month:"long",year:"numeric"})}
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, flexShrink:0 }}>
          {score && (
            <div style={{ textAlign:"center" }}>
              <div style={{ fontFamily:C.font, fontSize:32, fontWeight:700, color:score.colorTotal, lineHeight:1 }}>{score.total}</div>
              <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint, letterSpacing:1 }}>SCORE</div>
            </div>
          )}
          {/* ── Indicador real vs estimado ── */}
          {confianza && (
            <div style={{ textAlign:"center", padding:"3px 8px", borderRadius:6,
              background:confianza.color+"15", border:"1px solid "+confianza.color+"40" }}>
              <div style={{ fontFamily:C.font, fontSize:10, fontWeight:700, color:confianza.color, lineHeight:1 }}>
                {confianza.score}%
              </div>
              <div style={{ fontFamily:C.font, fontSize:7, color:confianza.color, letterSpacing:0.5, marginTop:1 }}>
                {confianza.label.toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Banner datos faltantes */}
      {confianza && confianza.faltantes.length > 0 && (
        <div style={{ background:C.amber+"10", border:"1px solid "+C.amber+"30",
          borderRadius:8, padding:"6px 12px", marginBottom:10,
          fontFamily:C.font, fontSize:9, color:C.amber }}>
          📊 Mejoraría el diagnóstico si cargás: {confianza.faltantes.slice(0,3).join(" · ")}
          {confianza.faltantes.length > 3 ? ` · +${confianza.faltantes.length-3} más` : ""}
        </div>
      )}

      {/* ── FASE DEL CICLO — la frase más importante ── */}
      {faseCiclo && faseCiclo.fase !== "SIN_FECHA" && (
        <div style={{ background:faseCiclo.color+"12", border:"1px solid "+faseCiclo.color+"40", borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:22 }}>{faseCiclo.icono}</span>
            <div>
              <div style={{ fontFamily:C.font, fontSize:9, color:faseCiclo.color, letterSpacing:1, marginBottom:2 }}>
                {faseCiclo.label.toUpperCase()}
                {faseCiclo.siguiente ? " · " + faseCiclo.siguiente.label + " en " + faseCiclo.siguiente.diasFaltan + "d" : ""}
              </div>
              <div style={{ fontFamily:C.font, fontSize:11, color:C.text, lineHeight:1.5 }}>
                {faseCiclo.descripcion.split(".")[0] + "."}
              </div>
            </div>
          </div>
        </div>
      )}
      {!faseCiclo && (
        <div style={{ background:C.amber+"10", border:"1px solid "+C.amber+"30", borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
          <div style={{ fontFamily:C.font, fontSize:10, color:C.amber }}>
            📅 Cargá las fechas de servicio para activar el diagnóstico contextual
          </div>
        </div>
      )}

      {/* ── 3 MÉTRICAS CLAVE ── */}
      {motor && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
          {/* CC al servicio */}
          <div style={{ background:C.card2, border:"1px solid "+C.border, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
            <div style={{ fontFamily:C.font, fontSize:22, fontWeight:700, color:ccServ>0?smf(ccServ,4.5,4.0):C.textFaint, lineHeight:1 }}>
              {ccServ > 0 ? ccServ.toFixed(1) : "—"}
            </div>
            <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint, marginTop:3 }}>CC SERVICIO</div>
            <div style={{ fontFamily:C.font, fontSize:7, color:ccServ>0?smf(ccServ,4.5,4.0):C.textFaint, marginTop:2 }}>
              {ccServ >= 4.5 ? "✓ óptima" : ccServ > 0 ? "⚠ baja" : "sin dato"}
            </div>
          </div>
          {/* Preñez estimada */}
          <div style={{ background:C.card2, border:"1px solid "+C.border, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
            <div style={{ fontFamily:C.font, fontSize:22, fontWeight:700, color:prenez!=null?smf(prenez,65,45):C.textFaint, lineHeight:1 }}>
              {prenez != null ? prenez + "%" : "—"}
            </div>
            <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint, marginTop:3 }}>PREÑEZ EST.</div>
            <div style={{ fontFamily:C.font, fontSize:7, color:prenez!=null?smf(prenez,65,45):C.textFaint, marginTop:2 }}>
              {prenez >= 75 ? "✓ muy buena" : prenez >= 55 ? "✓ aceptable" : prenez != null ? "⚠ baja" : "sin dato"}
            </div>
          </div>
          {/* Balance invernal */}
          <div style={{ background:C.card2, border:"1px solid "+C.border, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
            <div style={{ fontFamily:C.font, fontSize:22, fontWeight:700, color:mesesRojos===0?C.green:mesesRojos===1?C.amber:C.red, lineHeight:1 }}>
              {balInv[0].bal !== null ? mesesRojos + "/3" : "—"}
            </div>
            <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint, marginTop:3 }}>MESES DÉFICIT</div>
            <div style={{ display:"flex", gap:3, justifyContent:"center", marginTop:4 }}>
              {balInv.map((b,i) => (
                <div key={i} style={{ textAlign:"center" }}>
                  <div style={{ width:18, height:18, borderRadius:4,
                    background: b.bal === null ? C.border : b.bal >= 0 ? C.green+"30" : C.red+"30",
                    border:"1px solid "+(b.bal === null ? C.border : b.bal >= 0 ? C.green+"60" : C.red+"60"),
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <span style={{ fontFamily:C.font, fontSize:6, color:b.bal===null?C.textFaint:b.bal>=0?C.green:C.red }}>
                      {b.bal === null ? "?" : b.bal >= 0 ? "✓" : "✗"}
                    </span>
                  </div>
                  <div style={{ fontFamily:C.font, fontSize:6, color:C.textFaint, marginTop:1 }}>{b.mes}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── IMPACTO COLA DE PREÑEZ ── */}
      {impactoCola && impactoCola.kgDifPorTernero > 0 && (
        <div style={{ background:C.amber+"0d", border:"1px solid "+C.amber+"35",
          borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.amber, letterSpacing:1, marginBottom:6 }}>
            📈 IMPACTO DISTRIBUCIÓN DE PREÑEZ
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <div>
              <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginBottom:2 }}>
                Cabeza de parición estimada
              </div>
              <div style={{ fontFamily:C.font, fontSize:20, fontWeight:700,
                color: impactoCola.cabeza >= 55 ? C.green : impactoCola.cabeza >= 40 ? C.amber : C.red,
                lineHeight:1 }}>
                {impactoCola.cabeza}%
              </div>
              <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginTop:2 }}>
                objetivo: ≥60%
              </div>
            </div>
            <div>
              <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginBottom:2 }}>
                Peso prom. al destete
              </div>
              <div style={{ fontFamily:C.font, fontSize:20, fontWeight:700, color:C.text, lineHeight:1 }}>
                {impactoCola.pvPromDestete} kg
              </div>
              <div style={{ fontFamily:C.font, fontSize:8, color:C.green, marginTop:2 }}>
                con 60% cabeza: {impactoCola.pvPromObj} kg
              </div>
            </div>
          </div>
          {impactoCola.kgDifPorTernero > 0 && (
            <div style={{ marginTop:8, background:C.green+"0a", border:"1px solid "+C.green+"25",
              borderRadius:8, padding:"6px 10px" }}>
              <span style={{ fontFamily:C.font, fontSize:10, color:C.green }}>
                ↑ Subir cabeza al 60% → +{impactoCola.kgDifPorTernero} kg/ternero
                · +{impactoCola.kgDifTotal} kg en {impactoCola.terneros} terneros
              </span>
              <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginTop:2 }}>
                INTA Cuenca del Salado: cada mes de atraso en la preñez = −21 kg al destete
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PRONÓSTICO COMPACTO ── */}
      {sat?.pronostico?.length > 0 && (
        <div style={{ display:"flex", gap:3, marginBottom:12, overflowX:"auto", scrollbarWidth:"none" }}>
          {sat.pronostico.slice(0,5).map((d,i) => {
            const tmed = (d.tMax+d.tMin)/2;
            const ico  = d.lluvia>10?"💧":d.tMin<=2?"❄️":tmed>=30?"☀️":"🌤";
            return (
              <div key={i} style={{ flex:"0 0 auto", textAlign:"center", padding:"5px 7px",
                background: tmed<15?C.amber+"10":C.green+"08",
                border:"1px solid "+(tmed<15?C.amber+"30":C.border), borderRadius:8, minWidth:38 }}>
                <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>{d.dia}</div>
                <div style={{ fontSize:12 }}>{ico}</div>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.text, fontWeight:700 }}>{d.tMax}°</div>
                <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>{d.tMin}°</div>
              </div>
            );
          })}
          {sat?.helada7 && (
            <div style={{ display:"flex", alignItems:"center", padding:"5px 10px",
              background:C.amber+"10", border:"1px solid "+C.amber+"30", borderRadius:8, flexShrink:0 }}>
              <span style={{ fontFamily:C.font, fontSize:8, color:C.amber }}>❄️ Helada probable</span>
            </div>
          )}
        </div>
      )}

      {/* ── PUNTOS CRÍTICOS P1 — máximo 3 ── */}
      {tarjCrit.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.red, letterSpacing:1, marginBottom:6 }}>
            🔴 {tarjCrit.length} PUNTO{tarjCrit.length>1?"S":""} CRÍTICO{tarjCrit.length>1?"S":""} — ACCIÓN ANTES DEL SERVICIO
          </div>
          {tarjCrit.map((t,i) => (
            <div key={i} style={{ display:"flex", gap:10, padding:"10px 12px",
              background:C.red+"07", border:"1px solid "+C.red+"25", borderRadius:10, marginBottom:6 }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{t.icono}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:C.font, fontSize:11, color:"#c8e0c0", fontWeight:700, marginBottom:3 }}>{t.titulo}</div>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>{t.que?.slice(0,90)}{t.que?.length>90?"…":""}</div>
                {t.impacto && <div style={{ fontFamily:C.font, fontSize:9, color:C.green, marginTop:3 }}>💰 {t.impacto?.slice(0,80)}{t.impacto?.length>80?"…":""}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── BOTONES DE NAVEGACIÓN ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginTop:4 }}>
        <button onClick={()=>onTab("balance")} style={{ background:C.card2, border:"1px solid "+C.border, borderRadius:10, color:C.textDim, padding:"10px 8px", fontFamily:C.font, fontSize:10, cursor:"pointer" }}>
          📊 Ver Balance
        </button>
        <button onClick={()=>onTab("cerebro")} style={{ background:C.green+"15", border:"1px solid "+C.green+"40", borderRadius:10, color:C.green, padding:"10px 8px", fontFamily:C.font, fontSize:10, fontWeight:700, cursor:"pointer" }}>
          🧠 Ver Análisis IA
        </button>
      </div>
    </div>
  );
}

export {
  ScoreRadar, GraficoBalance,
  TrayectoriaVaquillona, DashboardEstablecimiento,
};
