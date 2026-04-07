"use client";

// ═══════════════════════════════════════════════════════════════════
// components/dashboard.js
// Dashboard principal + Score + Gráficos de balance y CC
// ═══════════════════════════════════════════════════════════════════

import { calcCadena, calcFaseCiclo, mcalSuplemento } from "../lib/motor";
import { calcCerebro } from "../lib/cerebro";
import React from "react";
import { BarChart, Bar, LineChart, Line, ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
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
// ─── GRÁFICO 1: BALANCE RODEO COMPLETO ─────────────────────────────────────
// Oferta total vs Demanda total — 12 meses
// Barras apiladas: pasto + CC movilizada + suplemento + verdeo
// Línea roja: demanda total
// Zona sombreada: invierno (jun-ago)
function GraficoBalanceRodeo({ motor, form }) {
  const bm = motor?.balanceMensual;
  if (!bm || bm.length === 0) return null;
  const MN = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const mesHoy = new Date().getMonth();

  const datos = bm.map((m,i) => ({
    mes: MN[i],
    pasto:  Math.max(0, m.ofPastoTotal || 0),
    cc:     Math.max(0, m.ccAporte || 0),
    supl:   Math.max(0, m.suplAporte || 0),
    verdeo: Math.max(0, m.verdeoAporte || 0),
    demanda: m.demanda || 0,
    balance: m.balance || 0,
    deficit: m.balance < 0,
    inv: [5,6,7].includes(i),
    esHoy: i === mesHoy,
    esParto: m.esParto,
    esServ:  m.esServIni,
  }));

  const defInv = [5,6,7].filter(i => bm[i]?.balance < 0);

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontFamily:T.font, fontSize:10, color:T.textFaint, letterSpacing:1, marginBottom:6 }}>
        BALANCE RODEO COMPLETO — Mcal/día
      </div>
      {defInv.length > 0 && (
        <div style={{ background:C.red+"12", border:"1px solid "+C.red+"30", borderRadius:6, padding:"6px 10px", marginBottom:8, fontFamily:T.font, fontSize:10, color:C.red }}>
          ⚠ Déficit invernal en {defInv.map(i=>MN[i]).join("+")} — {Math.round(Math.abs(Math.min(...defInv.map(i=>bm[i].balance))))} Mcal/día peor mes
        </div>
      )}
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={datos} margin={{top:4,right:4,left:-20,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
          <XAxis dataKey="mes" tick={{fill:C.textFaint,fontSize:9,fontFamily:T.font}} />
          <YAxis tick={{fill:C.textFaint,fontSize:9,fontFamily:T.font}} />
          <Tooltip contentStyle={{background:C.card,border:"1px solid "+C.border,borderRadius:8,fontFamily:T.font,fontSize:10}}
            formatter={(v,n)=>[Math.round(v)+" Mcal",n]} />
          <Bar dataKey="pasto"  name="Pasto"      stackId="of" fill="#378ADD" fillOpacity={0.8} />
          <Bar dataKey="cc"     name="CC mob."    stackId="of" fill={C.green} fillOpacity={0.7} />
          <Bar dataKey="supl"   name="Suplemento" stackId="of" fill="#97C459" fillOpacity={0.9} />
          <Bar dataKey="verdeo" name="Verdeo"     stackId="of" fill="#1D9E75" fillOpacity={0.9} />
          <Line dataKey="demanda" name="Demanda" type="monotone" stroke={C.red} strokeWidth={2} strokeDasharray="5 3" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:4,justifyContent:"center"}}>
        {[["Pasto","#378ADD"],["CC mob.",C.green],["Supl","#97C459"],["Verdeo","#1D9E75"],["Demanda",C.red]].map(([l,c])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:3,fontFamily:T.font,fontSize:8,color:T.textFaint}}>
            <div style={{width:8,height:8,borderRadius:2,background:c}} />{l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GRÁFICO 2: VACA ADULTA — CC Y DESTETE ──────────────────────────────────
// Muestra la trayectoria CC mes a mes
// Líneas: actual / con anticipado / con hiperprecoz
// Marcadores: parto, destete, servicio
// Regla: CC parto mínima 5.5, CC servicio mínima 4.5
function GraficoVacaCC({ motor, form, tray }) {
  if (!tray || !motor?.balanceMensual) return null;
  const MN = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const bm = motor.balanceMensual;

  // Reconstruir trayectoria CC mes a mes
  const mesHoy = new Date().getMonth();
  const mesParto = bm.findIndex(m => m.esParto) ?? -1;
  const mesServ  = bm.findIndex(m => m.esServIni) ?? -1;
  const ccHoy = tray.ccHoy || 0;
  const ccParto = tray.ccParto || 0;
  const ccMinLact = tray.ccMinLact || 0;
  const ccServ = tray.ccServ || 0;

  // Simplificar: puntos clave de la trayectoria
  const puntos = bm.map((m,i) => {
    const mDP = (i - (mesParto >= 0 ? mesParto : 9) + 12) % 12;
    let ccEst;
    if (i === mesHoy) ccEst = ccHoy;
    else if (mesParto >= 0 && i === mesParto) ccEst = ccParto;
    else if (mesParto >= 0 && mDP === 3) ccEst = ccMinLact;
    else if (mesServ >= 0 && i === mesServ) ccEst = ccServ;
    else ccEst = null;

    // Con destete anticipado
    const ccAnt = ccServ + 0.4;
    // Con hiperprecoz
    const ccHip = ccServ + 0.7;

    return {
      mes: MN[i],
      ccActual: ccEst,
      // Líneas referenciales de mínimos
      minParto: 5.5,
      minServ: 4.5,
      esParto: m.esParto,
      esServ:  m.esServIni,
      esDestete: m.esDestete,
    };
  });

  // Datos simplificados — solo los puntos clave
  const datosTray = [
    { punto: "Hoy",       cc: ccHoy,    minRef: null },
    { punto: "Al parto",  cc: ccParto,  minRef: 5.5, ok: ccParto >= 5.5 },
    { punto: "Min. lact", cc: ccMinLact,minRef: 3.5, ok: ccMinLact >= 3.5 },
    { punto: "Al serv.",  cc: ccServ,   minRef: 4.5, ok: ccServ >= 4.5 },
    { punto: "+Anticip.", cc: Math.min(9,ccServ+0.4), minRef: 4.5, ok: true },
    { punto: "+Hiper.",   cc: Math.min(9,ccServ+0.7), minRef: 4.5, ok: true },
  ];

  const maxCC = 7;

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontFamily:T.font, fontSize:10, color:T.textFaint, letterSpacing:1, marginBottom:6 }}>
        TRAYECTORIA CC — VACAS ADULTAS
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:4, marginBottom:8 }}>
        {datosTray.map((d,i) => {
          const col = d.minRef && d.cc < d.minRef ? C.red : d.minRef && d.cc >= d.minRef ? C.green : C.amber;
          const pct = Math.round(d.cc/maxCC*100);
          return (
            <div key={i} style={{ background:C.card2, borderRadius:6, padding:"6px 4px", textAlign:"center",
              border:"1px solid "+(d.minRef && d.cc < d.minRef ? C.red+"40" : C.border) }}>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginBottom:3 }}>{d.punto}</div>
              <div style={{ fontFamily:T.font, fontSize:15, fontWeight:700, color:col, lineHeight:1 }}>{d.cc.toFixed(1)}</div>
              {d.minRef && (
                <div style={{ fontFamily:T.font, fontSize:7, color:d.ok?C.green:C.red, marginTop:2 }}>
                  {d.ok ? "✓" : "< "+d.minRef}
                </div>
              )}
              <div style={{ height:3, background:C.card, borderRadius:2, marginTop:4 }}>
                <div style={{ height:"100%", width:pct+"%", background:col, borderRadius:2 }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, marginBottom:4 }}>
        Impacto del destete en preñez — Peruchena INTA 2003
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
        {[
          { l:"Sin cambios", cc:ccServ,              pr:tray.pr||0, col:ccServ<4.5?C.red:C.amber },
          { l:"Anticipado 90d", cc:+(Math.min(9,ccServ+0.4)).toFixed(1), pr:tray.prAntic||0, col:C.amber },
          { l:"Hiperprecoz 50d",cc:+(Math.min(9,ccServ+0.7)).toFixed(1), pr:tray.prHiper||0, col:C.green },
        ].map((e,i) => {
          const nV = parseInt(form?.vacasN)||0;
          const diff = e.pr - (tray.pr||0);
          return (
            <div key={i} style={{ background:C.card2, borderRadius:6, padding:"8px 6px", textAlign:"center",
              border:"1px solid "+(i===2?C.green+"40":C.border) }}>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginBottom:4 }}>{e.l}</div>
              <div style={{ fontFamily:T.font, fontSize:18, fontWeight:700, color:e.col }}>{e.pr}%</div>
              <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint }}>CC {e.cc}</div>
              {diff > 0 && nV > 0 && (
                <div style={{ fontFamily:T.font, fontSize:8, color:C.green, marginTop:2 }}>
                  +{diff}pp · +{Math.round(nV*diff/100*0.95)} terneros
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── GRÁFICO 3: VAQUILLONA 1° Y 2° INVIERNO ─────────────────────────────────
// GDP mensual vs objetivo 400g/día (1°inv) y 300g/día (2°inv)
// Peso acumulado y proyección al entore
// Reglas: 400g/d en 1°inv, 300g/d en 2°inv, 75% PV adulto al entore
function GraficoVaquillona({ motor, form }) {
  const vaq1 = motor?.vaq1E;
  const vaq2 = motor?.vaq2E;
  if (!vaq1 && !vaq2) return null;

  const pvAdulto = parseFloat(form?.pvVacaAdulta) || 380;
  const bm = motor?.balanceMensual || [];
  const MN = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // GDP mensual de vaquillona desde el balance
  const gdpMensual = bm.map((m,i) => ({
    mes: MN[i],
    gdpPasto: m.gdpVaq1Mes || 0,
    gdpConSupl: m.gdpVaq1Mes || 0, // con suplemento activo
    obj1: 400,
    obj2: 300,
    inv: [5,6,7].includes(i),
  }));

  const pvEnt1 = motor.pvEntVaq1 || 0;
  const pvSal1 = motor.pvSalidaVaq1 || 0;
  const pvObj1 = Math.round(pvAdulto * 0.40);
  const ok1 = pvSal1 >= pvObj1;

  const pvEnt2 = motor.pvEntradaVaq2 || 0;
  const pvEntore = vaq2?.pvEntore || 0;
  const pvObj2 = Math.round(pvAdulto * 0.75);
  const ok2 = vaq2?.llegas ?? (pvEntore >= pvObj2);

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontFamily:T.font, fontSize:10, color:T.textFaint, letterSpacing:1, marginBottom:6 }}>
        VAQUILLONA — TRAYECTORIA Y OBJETIVOS
      </div>

      {/* Indicadores clave */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
        <div style={{ background:C.card2, borderRadius:8, padding:"10px 8px",
          border:"1px solid "+(ok1?C.green+"40":C.red+"40") }}>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, marginBottom:4 }}>1° INVIERNO</div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
            <div>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>PV entrada</div>
              <div style={{ fontFamily:T.font, fontSize:14, fontWeight:700, color:T.text }}>{pvEnt1} kg</div>
            </div>
            <div style={{ fontFamily:T.font, fontSize:14, color:T.textFaint }}>→</div>
            <div>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>PV salida</div>
              <div style={{ fontFamily:T.font, fontSize:14, fontWeight:700, color:ok1?C.green:C.red }}>{pvSal1} kg</div>
            </div>
            <div>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>Objetivo</div>
              <div style={{ fontFamily:T.font, fontSize:14, fontWeight:700, color:T.textFaint }}>{pvObj1} kg</div>
            </div>
          </div>
          <div style={{ fontFamily:T.font, fontSize:8, color:ok1?C.green:C.red, marginTop:4 }}>
            GDP: {vaq1?.gdpPasto||0}g/d pasto · {vaq1?.gdpReal||0}g/d con supl
            {!ok1 && " · ⚠ DÉFICIT "+Math.abs(pvObj1-pvSal1)+"kg — irreversible"}
          </div>
        </div>
        <div style={{ background:C.card2, borderRadius:8, padding:"10px 8px",
          border:"1px solid "+(ok2?C.green+"40":C.red+"40") }}>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, marginBottom:4 }}>2° INVIERNO → ENTORE</div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
            <div>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>PV entrada</div>
              <div style={{ fontFamily:T.font, fontSize:14, fontWeight:700, color:T.text }}>{pvEnt2} kg</div>
            </div>
            <div style={{ fontFamily:T.font, fontSize:14, color:T.textFaint }}>→</div>
            <div>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>PV entore</div>
              <div style={{ fontFamily:T.font, fontSize:14, fontWeight:700, color:ok2?C.green:C.red }}>{pvEntore} kg</div>
            </div>
            <div>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>Mínimo</div>
              <div style={{ fontFamily:T.font, fontSize:14, fontWeight:700, color:T.textFaint }}>{pvObj2} kg</div>
            </div>
          </div>
          <div style={{ fontFamily:T.font, fontSize:8, color:ok2?C.green:C.red, marginTop:4 }}>
            {ok2 ? "✓ Llega al entore en condición" : "⚠ No llega — revisar peso en abril-mayo"}
            {" · Flushing: siempre 25d pre-serv."}
          </div>
        </div>
      </div>

      {/* Gráfico GDP mensual */}
      <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, marginBottom:4 }}>
        GDP mensual (g/día) — línea roja = mínimo 400g/d
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <ComposedChart data={gdpMensual} margin={{top:4,right:4,left:-20,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
          <XAxis dataKey="mes" tick={{fill:C.textFaint,fontSize:9,fontFamily:T.font}} />
          <YAxis tick={{fill:C.textFaint,fontSize:9,fontFamily:T.font}} domain={[0,700]} />
          <Tooltip contentStyle={{background:C.card,border:"1px solid "+C.border,borderRadius:8,fontFamily:T.font,fontSize:10}}
            formatter={(v,n)=>[Math.round(v)+"g/d",n]} />
          <Bar dataKey="gdpPasto" name="GDP pasto" fill="#378ADD" fillOpacity={0.7}
            label={false} />
          <Line dataKey="obj1" name="Mínimo 400g/d" stroke={C.red} strokeWidth={1.5}
            strokeDasharray="4 3" dot={false} />
        </ComposedChart>
      </ResponsiveContainer>

      {(!ok1) && (
        <div style={{ marginTop:6, padding:"6px 10px", background:C.red+"12",
          border:"1px solid "+C.red+"30", borderRadius:6, fontFamily:T.font, fontSize:9, color:C.red }}>
          ⚠ Sin los {Math.abs(pvObj1-pvSal1)}kg este invierno, la vaquillona llega al 2° invierno retrasada y no alcanza el 75% PV al entore de 2 años. El déficit del 1° invierno es IRREVERSIBLE — Balbuena INTA 2003.
        </div>
      )}
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL: los 3 gráficos ───────────────────────────────────
function GraficoBalance({ form, sat, cadena, tray, motor }) {
  const bm = motor?.balanceMensual;
  if (!bm || bm.length === 0) {
    return (
      <div style={{ padding:16, background:C.card2, border:"1px solid "+C.amber+"40", borderRadius:8 }}>
        <div style={{ fontFamily:T.font, fontSize:10, color:C.amber }}>
          Completá los datos del rodeo para ver el balance energético
        </div>
      </div>
    );
  }
  return (
    <div>
      <GraficoBalanceRodeo motor={motor} form={form} />
      <GraficoVacaCC motor={motor} form={form} tray={tray} />
      <GraficoVaquillona motor={motor} form={form} />
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
