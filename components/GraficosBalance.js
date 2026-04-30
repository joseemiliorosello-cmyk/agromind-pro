// ═══════════════════════════════════════════════════════════════════
// components/GraficosBalance.js
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useRef } from "react";
import { balancePorCategoria, calcTrayectoriaCC, calcCadena } from "../lib/motor";
import { calcCerebro } from "../lib/cerebro";
import { T as C } from "../lib/constantes";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function aplicarRecomendaciones(form) {
  const f = { ...form };
  if (!f.supl_vaq1 || parseFloat(f.dosis_vaq1 || 0) < 0.3) {
    f.supl_vaq1 = "Expeller de girasol";
    f.dosis_vaq1 = "0.5";
  }
  if (!f.supl_vaq2 || parseFloat(f.dosis_vaq2 || 0) < 0.3) {
    f.supl_vaq2 = "Expeller de girasol";
    f.dosis_vaq2 = "0.5";
  }
  f.suplMeses = ["4","5","6","7"];
  if (f.tieneVerdeo && (!f.verdeoDestinoVaq || f.verdeoDestinoVaq === "todo")) {
    f.verdeoDestinoVaq = "vaq1";
  }
  return f;
}

// ─── Tooltip flotante ───
function Tooltip({ tip }) {
  if (!tip) return null;
  return (
    <div style={{
      position: "absolute",
      left: Math.min(tip.x, tip.containerW - 160),
      top: Math.max(4, tip.y - 68),
      background: C.text,
      color: "#e8f5e4",
      borderRadius: 7,
      padding: "6px 9px",
      fontFamily: C.font,
      fontSize: 8.5,
      lineHeight: 1.55,
      pointerEvents: "none",
      zIndex: 20,
      whiteSpace: "nowrap",
      boxShadow: "0 2px 8px rgba(0,0,0,.3)",
    }}>
      {tip.lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  );
}

// ─── Grafico Mcal oferta/demanda/balance ───
function GraficoMcal({ datos, titulo, subTitulo, mostrarMovCC, W = 340, H = 180 }) {
  const mesHoy = new Date().getMonth();
  const pad = 22;
  const colW = (W - pad * 2) / 12;
  const barW = colW - 3;
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const vals = datos.map(d => ({ up: d.oferta.total, down: d.demanda }));
  const maxUp   = Math.max(1, ...vals.map(v => v.up));
  const maxDown = Math.max(1, ...vals.map(v => v.down));
  const maxAbs  = Math.max(maxUp, maxDown);
  const midY    = H / 2;
  const escala  = (midY - 20) / maxAbs;

  const handleEnter = (e, i, d) => {
    if (!svgRef.current || !containerRef.current) return;
    const svgRect  = svgRef.current.getBoundingClientRect();
    const contRect = containerRef.current.getBoundingClientRect();
    const rel = svgRef.current.viewBox.baseVal;
    const scaleX = rel.width  / svgRect.width;
    const scaleY = rel.height / svgRect.height;
    const svgX = (e.clientX - svgRect.left) * scaleX;
    const svgY = (e.clientY - svgRect.top)  * scaleY;
    const pixX = svgX / scaleX;
    const pixY = svgY / scaleY;
    const bal  = d.balance;
    const lines = [
      `${MESES[i]}${[4,5,6].includes(i) ? " ❄" : ""}`,
      `Oferta:  ${d.oferta.total?.toFixed(1)} Mcal/d`,
      `  Pasto: ${d.oferta.pasto?.toFixed(1)}  Supl: ${(d.oferta.suplemento||0).toFixed(1)}`,
      d.oferta.verdeo > 0 ? `  Verdeo: ${d.oferta.verdeo.toFixed(1)}` : null,
      mostrarMovCC && d.oferta.movilizacionCC > 0 ? `  Mov.CC: ${d.oferta.movilizacionCC.toFixed(1)}` : null,
      `Demanda: ${d.demanda?.toFixed(1)} Mcal/d`,
      d.dTerneros > 0 ? `  Terneros: ${d.dTerneros?.toFixed(1)} Mcal/d` : null,
      `Balance: ${bal >= 0 ? "+" : ""}${bal?.toFixed(1)} Mcal/d`,
    ].filter(Boolean);
    setTooltip({ x: pixX + 8, y: pixY, lines, containerW: contRect.width });
  };

  return (
    <div ref={containerRef} style={{ position: "relative", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ fontFamily: C.font, fontSize: 11, color: C.text, fontWeight: 700 }}>{titulo}</div>
        <div style={{ fontFamily: C.font, fontSize: 8, color: C.textFaint }}>{subTitulo}</div>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}
        onMouseLeave={() => setTooltip(null)}>
        {[4, 5, 6].map(i => (
          <rect key={i} x={pad + i * colW} y={2} width={colW} height={H - 14} fill={C.amber + "1c"} />
        ))}
        <rect x={pad + mesHoy * colW} y={2} width={colW} height={H - 14} fill={C.green + "1e"} rx={2} />
        <line x1={pad} y1={midY} x2={W - pad} y2={midY} stroke={C.textFaint} strokeWidth="0.6" strokeDasharray="2,3" />

        {datos.map((d, i) => {
          const x = pad + i * colW + 1.5;
          const hPasto  = (d.oferta.pasto || 0) * escala;
          const hSupl   = (d.oferta.suplemento || 0) * escala;
          const hVerdeo = (d.oferta.verdeo || 0) * escala;
          const hCC     = (d.oferta.movilizacionCC || 0) * escala;
          let yCursor = midY;
          const segments = [];
          if (hPasto  > 0) { yCursor -= hPasto;  segments.push({ y: yCursor, h: hPasto,  color: C.green }); }
          if (hSupl   > 0) { yCursor -= hSupl;   segments.push({ y: yCursor, h: hSupl,   color: C.blue }); }
          if (hVerdeo > 0) { yCursor -= hVerdeo; segments.push({ y: yCursor, h: hVerdeo, color: C.greenDark }); }
          if (mostrarMovCC && hCC > 0) { yCursor -= hCC; segments.push({ y: yCursor, h: hCC, color: C.orange }); }
          const hDem = (d.demanda || 0) * escala;
          const bal  = d.balance;
          const balCol = bal >= 0 ? C.green : C.red;
          const totalUp = hPasto + hSupl + hVerdeo + (mostrarMovCC ? hCC : 0);

          return (
            <g key={i} style={{ cursor: "crosshair" }}
              onMouseEnter={e => handleEnter(e, i, d)}
            >
              {/* zona hover invisible que cubre toda la columna */}
              <rect x={x - 1} y={2} width={barW + 2} height={H - 14} fill="transparent" />
              {segments.map((s, idx) => (
                <rect key={idx} x={x} y={s.y} width={barW} height={Math.max(1, s.h)} fill={s.color} opacity={0.85} rx={1} />
              ))}
              <rect x={x} y={midY} width={barW} height={Math.max(1, hDem)} fill={C.red} opacity={0.6} rx={1} />
              {barW > 14 && (
                <text x={x + barW / 2} y={bal >= 0 ? midY - totalUp - 3 : midY + hDem + 9}
                  textAnchor="middle" style={{ fontFamily: C.font, fontSize: "6.5px", fill: balCol, fontWeight: 700 }}>
                  {bal >= 0 ? "+" : ""}{Math.round(bal)}
                </text>
              )}
              <text x={x + barW / 2} y={H - 2} textAnchor="middle"
                style={{ fontFamily: C.font, fontSize: "6.5px",
                  fill: i === mesHoy ? C.green : [4,5,6].includes(i) ? C.amber : C.textFaint,
                  fontWeight: i === mesHoy || [4,5,6].includes(i) ? 700 : 400 }}>
                {MESES[i]}
              </text>
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tooltip} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6, fontFamily: C.font, fontSize: 8, color: C.textDim }}>
        <span><span style={{ display: "inline-block", width: 8, height: 8, background: C.green,     marginRight: 3 }} />Pasto</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, background: C.blue,      marginRight: 3 }} />Suplemento</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, background: C.greenDark, marginRight: 3 }} />Verdeo</span>
        {mostrarMovCC && <span><span style={{ display: "inline-block", width: 8, height: 8, background: C.orange, marginRight: 3 }} />Movilizacion CC</span>}
        <span><span style={{ display: "inline-block", width: 8, height: 8, background: C.red,       marginRight: 3 }} />Demanda</span>
      </div>
    </div>
  );
}

// ─── Grafico GDP vaquillonas ───
const MESES_INV = new Set([4, 5, 6]);
function objMes(i, objetivoVerano, objetivoInvierno, objetivoGDP) {
  if (objetivoVerano !== undefined) return MESES_INV.has(i) ? objetivoInvierno : objetivoVerano;
  return objetivoGDP || 0;
}

function GraficoGDP({ datos, titulo, objetivoGDP, objetivoVerano, objetivoInvierno, subTitulo, W = 340, H = 160 }) {
  const mesHoy = new Date().getMonth();
  const pad = 22;
  const colW = (W - pad * 2) / 12;
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);

  const gdps = datos.map(d => d.gdp || 0);
  const allObjs = objetivoVerano !== undefined
    ? [objetivoVerano, objetivoInvierno]
    : [objetivoGDP || 0];
  const maxG  = Math.max(800, ...gdps.map(Math.abs), ...allObjs);
  const minG  = Math.min(-200, ...gdps);
  const rango = maxG - minG;
  const midY  = H - 30;
  const dual  = objetivoVerano !== undefined;
  const y0    = midY - ((0 - minG) / rango) * (midY - 15);

  const handleEnter = (e, i, d) => {
    if (!svgRef.current || !containerRef.current) return;
    const svgRect  = svgRef.current.getBoundingClientRect();
    const contRect = containerRef.current.getBoundingClientRect();
    const rel = svgRef.current.viewBox.baseVal;
    const pixX = (e.clientX - svgRect.left) * (rel.width  / svgRect.width);
    const pixY = (e.clientY - svgRect.top)  * (rel.height / svgRect.height);
    const gdp = d.gdp || 0;
    const obj = objMes(i, objetivoVerano, objetivoInvierno, objetivoGDP);
    const cumple = gdp >= obj;
    const lines = [
      `${MESES[i]}${[4,5,6].includes(i) ? " ❄" : ""}`,
      `GDP:      ${gdp} g/d`,
      `Objetivo: ${obj} g/d`,
      cumple ? "Estado:   cumple ✓" : `Estado:   deficit (${gdp - obj} g/d)`,
    ];
    setTooltip({ x: pixX / (rel.width / contRect.width) + 8, y: pixY / (rel.height / contRect.height), lines, containerW: contRect.width });
  };

  return (
    <div ref={containerRef} style={{ position: "relative", background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ fontFamily: C.font, fontSize: 11, color: C.text, fontWeight: 700 }}>{titulo}</div>
        <div style={{ fontFamily: C.font, fontSize: 8, color: C.textFaint }}>{subTitulo}</div>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}
        onMouseLeave={() => setTooltip(null)}>
        {[4,5,6].map(i => (
          <rect key={i} x={pad + i * colW} y={10} width={colW} height={midY - 10} fill={C.amber + "1c"} />
        ))}
        <rect x={pad + mesHoy * colW} y={10} width={colW} height={midY - 10} fill={C.green + "1e"} rx={2} />

        {/* línea cero */}
        <line x1={pad} y1={y0} x2={W - pad} y2={y0} stroke={C.textFaint} strokeWidth="0.5" strokeDasharray="1,2" opacity={0.6} />
        <text x={pad - 2} y={y0 + 3} textAnchor="end"
          style={{ fontFamily: C.font, fontSize: "6px", fill: C.textFaint }}>0</text>

        {/* líneas objetivo */}
        {dual ? (() => {
          const yV = midY - ((objetivoVerano  - minG) / rango) * (midY - 15);
          const yI = midY - ((objetivoInvierno - minG) / rango) * (midY - 15);
          const xInvIni = pad + 4 * colW;
          const xInvFin = pad + 7 * colW;
          return (
            <g>
              <line x1={pad}      y1={yV} x2={xInvIni} y2={yV} stroke={C.green} strokeWidth="0.8" strokeDasharray="4,3" opacity={0.7} />
              <line x1={xInvIni} y1={yI} x2={xInvFin}  y2={yI} stroke={C.amber} strokeWidth="0.8" strokeDasharray="4,3" opacity={0.9} />
              <line x1={xInvFin} y1={yV} x2={W - pad}  y2={yV} stroke={C.green} strokeWidth="0.8" strokeDasharray="4,3" opacity={0.7} />
              <text x={W - pad - 2} y={yV - 2} textAnchor="end"
                style={{ fontFamily: C.font, fontSize: "6.5px", fill: C.green }}>
                verano {objetivoVerano} g/d
              </text>
              <text x={xInvIni + (xInvFin - xInvIni) / 2} y={yI - 2} textAnchor="middle"
                style={{ fontFamily: C.font, fontSize: "6.5px", fill: C.amber }}>
                inv {objetivoInvierno} g/d
              </text>
            </g>
          );
        })() : objetivoGDP ? (() => {
          const yObj = midY - ((objetivoGDP - minG) / rango) * (midY - 15);
          return (
            <g>
              <line x1={pad} y1={yObj} x2={W - pad} y2={yObj} stroke={C.amber} strokeWidth="0.8" strokeDasharray="4,3" />
              <text x={W - pad - 2} y={yObj - 2} textAnchor="end"
                style={{ fontFamily: C.font, fontSize: "7px", fill: C.amber }}>
                objetivo {objetivoGDP} g/d
              </text>
            </g>
          );
        })() : null}

        {/* barras GDP */}
        {datos.map((d, i) => {
          const gdp = d.gdp || 0;
          const obj = objMes(i, objetivoVerano, objetivoInvierno, objetivoGDP);
          const yG  = midY - ((gdp - minG) / rango) * (midY - 15);
          const col = gdp >= obj ? C.green : gdp >= 0 ? C.amber : C.red;
          const x   = pad + i * colW + 1.5;
          const bW  = colW - 3;
          const barTop = Math.min(y0, yG);
          const barH  = Math.abs(yG - y0);
          return (
            <g key={i} style={{ cursor: "crosshair" }}
              onMouseEnter={e => handleEnter(e, i, d)}
            >
              <rect x={x - 1} y={10} width={bW + 2} height={midY - 10} fill="transparent" />
              <rect x={x} y={barTop} width={bW} height={Math.max(1, barH)} fill={col} opacity={0.85} rx={1} />
              {bW > 14 && (
                <text x={x + bW / 2} y={gdp >= 0 ? barTop - 2 : barTop + barH + 8}
                  textAnchor="middle"
                  style={{ fontFamily: C.font, fontSize: "6.5px", fill: col, fontWeight: 700 }}>
                  {gdp}
                </text>
              )}
              <text x={x + bW / 2} y={H - 2} textAnchor="middle"
                style={{ fontFamily: C.font, fontSize: "6.5px",
                  fill: i === mesHoy ? C.green : [4,5,6].includes(i) ? C.amber : C.textFaint }}>
                {MESES[i]}
              </text>
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tooltip} />
      <div style={{ fontFamily: C.font, fontSize: 8, color: C.textDim, marginTop: 4 }}>
        {dual
          ? "GDP proyectada · verde: cumple obj. estacional · ámbar: positivo pero bajo obj. · rojo: pérdida de peso · Obj. verano (ago–abr): 500 g/d · Obj. invierno (may–jul): 200 g/d"
          : "GDP proyectada · línea = objetivo · verde: cumple · ámbar: positivo bajo obj. · rojo: pérdida de peso"}
      </div>
    </div>
  );
}

// ─── Trayectoria CC ───
function TrayectoriaCC({ form, motor }) {
  const trayFull = useMemo(() => {
    if (!form?.distribucionCC?.length) return null;
    try {
      const cadena = form.iniServ && form.finServ ? calcCadena(form.iniServ, form.finServ) : null;
      return calcTrayectoriaCC({
        dist: form.distribucionCC, cadena,
        destTrad: form.destTrad, destAntic: form.destAntic, destHiper: form.destHiper,
        supHa: form.supHa, vacasN: form.vacasN,
        biotipo: form.biotipo, primerParto: form.primerParto,
        supl1: form.supl1 || "", dosis1: form.dosis1 || "0",
        supl2: "", dosis2: "0",
        supl3: form.supl3 || "", dosis3: form.dosis3 || "0",
        provincia: form.provincia,
      });
    } catch(e) { return null; }
  }, [form]);

  const [tooltip, setTooltip] = useState(null);
  const containerRef = useRef(null);

  if (!trayFull) return null;

  const { ccHoy, ccParto, ccMinLact, ccServ, ccServAntic, ccServHiper,
          mesParto, mesDestete, mesServ, mesesLact } = trayFull;

  const W = 680, H = 190;
  const PL = 30, PR = 8, PT = 10, PB = 26;
  const drawW = W - PL - PR;
  const drawH = H - PT - PB;
  const CC_MIN = 3.0, CC_MAX = 6.5;
  const colW = drawW / 12;
  const mesHoy = new Date().getMonth();

  const yCC  = (cc) => PT + drawH - ((cc - CC_MIN) / (CC_MAX - CC_MIN)) * drawH;
  const xMes = (i)  => PL + i * colW + colW / 2;

  const mesesLactN = Math.ceil(parseFloat(mesesLact) || 6);
  const mesDestN   = (mesParto + mesesLactN) % 12;
  const mesServN   = typeof mesServ === "number" ? mesServ : (mesDestN + 2) % 12;

  function interpCC(ccH, ccP, ccML, ccS, mi) {
    let cc;
    if (mesParto > mesServN) {
      if      (mi < mesParto)                              cc = ccH  + (ccP  - ccH)  * (mi / Math.max(1, mesParto));
      else if (mi < mesDestN || mesDestN <= mesParto)      cc = ccP  + (ccML - ccP)  * Math.min(1, (mi - mesParto)  / Math.max(1, mesesLactN));
      else if (mi <= mesServN || mesServN < mesDestN)      cc = ccML + (ccS  - ccML) * Math.min(1, (mi - mesDestN)  / Math.max(1, (mesServN - mesDestN + 12) % 12 || 3));
      else                                                  cc = ccS  + (ccH  - ccS)  * Math.min(1, (mi - mesServN)  / Math.max(1, 12 - mesServN));
    } else {
      if      (mi < mesParto)  cc = ccH  + (ccP  - ccH)  * (mi / Math.max(1, mesParto));
      else if (mi < mesDestN)  cc = ccP  + (ccML - ccP)  * ((mi - mesParto) / Math.max(1, mesesLactN));
      else if (mi < mesServN)  cc = ccML + (ccS  - ccML) * ((mi - mesDestN) / Math.max(1, mesServN - mesDestN || 2));
      else                      cc = ccS  + (ccH  - ccS)  * Math.min(1, (mi - mesServN) / Math.max(1, 12 - mesServN));
    }
    return Math.max(CC_MIN, Math.min(CC_MAX, cc));
  }

  const lineActual = Array.from({ length:12 }, (_, i) =>
    interpCC(ccHoy, ccParto, ccMinLact, ccServ, i)
  );
  const pts = lineActual.map((cc, i) => `${xMes(i)},${yCC(cc)}`).join(" ");
  const lineColor = ccServ >= 5.0 ? C.green : ccServ >= 4.5 ? C.amber : C.red;

  const y50 = yCC(5.0), y45 = yCC(4.5), y40 = yCC(4.0);

  const handleHover = (e, i) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({
      x: Math.min(e.clientX - rect.left + 8, rect.width - 150),
      y: Math.max(4, e.clientY - rect.top - 64),
      lines: [
        MESES[i] + ([4,5,6].includes(i) ? " ❄" : ""),
        `CC: ${lineActual[i].toFixed(2)}`,
        i === mesParto  ? "Parto"   : null,
        i === mesDestN  ? "Destete" : null,
        i === mesServN  ? "Inicio servicio" : null,
      ].filter(Boolean),
    });
  };

  return (
    <div ref={containerRef} style={{ position:"relative", background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px", marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:5 }}>
        <div style={{ fontFamily:C.font, fontSize:11, color:C.text, fontWeight:700 }}>
          Trayectoria CC — ciclo anual proyectado
        </div>
        <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>
          {ccHoy?.toFixed(1)} hoy → {ccParto?.toFixed(1)} parto → {ccMinLact?.toFixed(1)} min → {ccServ?.toFixed(1)} servicio
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", display:"block" }}
        onMouseLeave={() => setTooltip(null)}>

        {/* Threshold bands */}
        <rect x={PL} y={PT}  width={drawW} height={y40 - PT}  fill={C.green + "1e"} />
        <rect x={PL} y={y50} width={drawW} height={y45 - y50} fill={C.green + "16"} />
        <rect x={PL} y={y45} width={drawW} height={y40 - y45} fill={C.amber + "1e"} />
        <rect x={PL} y={y40} width={drawW} height={PT + drawH - y40} fill={C.red + "18"} />

        {/* Month tints */}
        {[4,5,6].map(i => <rect key={i} x={PL + i*colW} y={PT} width={colW} height={drawH} fill={C.amber+"06"} />)}
        <rect x={PL + mesHoy*colW} y={PT} width={colW} height={drawH} fill={C.green+"12"} />

        {/* Threshold lines */}
        {[{y:y50,c:C.green,l:"5.0"},{y:y45,c:C.amber,l:"4.5"},{y:y40,c:C.red,l:"4.0"}].map(t => (
          <g key={t.l}>
            <line x1={PL} y1={t.y} x2={W-PR} y2={t.y} stroke={t.c} strokeWidth={0.7} strokeDasharray="4,3" opacity={0.55}/>
            <text x={PL-3} y={t.y+3} textAnchor="end" style={{ fontFamily:C.font, fontSize:"6.5px", fill:t.c, fontWeight:"600" }}>{t.l}</text>
          </g>
        ))}

        {/* Event vertical markers */}
        {[{m:mesParto,l:"Parto",c:C.green},{m:mesDestN,l:"Dest.",c:C.amber},{m:mesServN,l:"Serv.",c:C.blue}]
          .filter(e => e.m !== null && e.m !== undefined)
          .map(e => (
            <g key={e.l}>
              <line x1={xMes(e.m)} y1={PT} x2={xMes(e.m)} y2={H-PB} stroke={e.c} strokeWidth={0.8} strokeDasharray="3,2" opacity={0.65}/>
              <text x={xMes(e.m)} y={H-PB+12} textAnchor="middle" style={{ fontFamily:C.font, fontSize:"6.5px", fill:e.c, fontWeight:"600" }}>{e.l}</text>
            </g>
          ))
        }

        {/* Trajectory polyline */}
        <polyline points={pts} fill="none" stroke={lineColor} strokeWidth={2.2} opacity={0.9} strokeLinejoin="round"/>

        {/* Hover rectangles + key-point dots */}
        {lineActual.map((cc, i) => {
          const isKey = [mesParto, mesDestN, mesServN, mesHoy].includes(i);
          return (
            <g key={i} style={{ cursor:"crosshair" }} onMouseEnter={e => handleHover(e, i)}>
              <rect x={PL + i*colW} y={PT} width={colW} height={drawH} fill="transparent"/>
              {isKey && <circle cx={xMes(i)} cy={yCC(cc)} r={3.5} fill={lineColor} stroke={C.card} strokeWidth={1.2}/>}
            </g>
          );
        })}

        {/* Scenario dots at mesServN */}
        {[
          { cc:ccServAntic, off:-8, color:C.blue,   label:`A ${ccServAntic?.toFixed(1)}` },
          { cc:ccServHiper, off: 8, color:C.purple,  label:`H ${ccServHiper?.toFixed(1)}` },
        ].filter(s => s.cc && mesServN !== null).map(s => (
          <g key={s.label}>
            <circle cx={xMes(mesServN) + s.off} cy={yCC(s.cc)} r={3} fill={s.color+"80"} stroke={s.color} strokeWidth={0.8}/>
            <text x={xMes(mesServN) + s.off + (s.off > 0 ? 6 : -6)} y={yCC(s.cc)+3}
              textAnchor={s.off > 0 ? "start" : "end"}
              style={{ fontFamily:C.font, fontSize:"6px", fill:s.color }}>{s.label}</text>
          </g>
        ))}

        {/* Month labels */}
        {MESES.map((mes, i) => (
          <text key={i} x={xMes(i)} y={H-2} textAnchor="middle"
            style={{ fontFamily:C.font, fontSize:"6.5px",
              fill: i === mesHoy ? C.green : [4,5,6].includes(i) ? C.amber : C.textFaint,
              fontWeight: i === mesHoy || [4,5,6].includes(i) ? "700" : "400" }}>
            {MESES[i]}
          </text>
        ))}
      </svg>

      {tooltip && (
        <div style={{ position:"absolute", left:tooltip.x, top:tooltip.y,
          background:C.text, color:"#e8f5e4", borderRadius:6, padding:"5px 9px",
          fontFamily:C.font, fontSize:8.5, lineHeight:1.55,
          pointerEvents:"none", zIndex:20, whiteSpace:"nowrap",
          boxShadow:"0 2px 8px rgba(0,0,0,.3)" }}>
          {tooltip.lines.map((l,i) => <div key={i}>{l}</div>)}
        </div>
      )}

      <div style={{ display:"flex", gap:12, marginTop:5, fontFamily:C.font, fontSize:8, color:C.textDim }}>
        <span style={{ color:lineColor }}>● Actual: CC serv {ccServ?.toFixed(1)}</span>
        {ccServAntic && <span style={{ color:C.blue }}>● Anticipado 90d: {ccServAntic?.toFixed(1)}</span>}
        {ccServHiper && <span style={{ color:C.purple }}>● Hiperprecoz 50d: {ccServHiper?.toFixed(1)}</span>}
        <span style={{ marginLeft:"auto", color:C.textFaint }}>Bandas: ≥5.0 óptimo · ≥4.5 aceptable · &lt;4.0 crítico</span>
      </div>
    </div>
  );
}

// ─── Distribución de partos: actual vs servicio recomendado 90d ───
function GraficoDistribucionPartos({ cadena }) {
  if (!cadena?.partoTemp || !cadena?.partoTard || !cadena?.diasServ) return null;

  const diasServ = cadena.diasServ;
  const W = 680, H = 130;
  const PL = 30, PR = 8, PT = 14, PB = 22;
  const drawW = W - PL - PR;
  const drawH = H - PT - PB;
  const colW = drawW / 12;

  // Distribución actual: partos uniformes en [mesPartoTemprano, mesPartoTardio]
  const mesInicio = new Date(cadena.partoTemp).getMonth();
  const mesFin    = new Date(cadena.partoTard).getMonth();
  const mesesParto = diasServ > 0 ? Math.ceil(diasServ / 30) : 3;

  const dist = Array(12).fill(0);
  for (let k = 0; k < mesesParto; k++) {
    dist[(mesInicio + k) % 12] += 1 / mesesParto;
  }

  // Distribución recomendada: 90 días desde el mismo inicio de partos
  const mesesRec = 3;
  const distRec = Array(12).fill(0);
  for (let k = 0; k < mesesRec; k++) {
    distRec[(mesInicio + k) % 12] += 1 / mesesRec;
  }

  const maxVal = Math.max(...dist, ...distRec, 0.01);
  const yVal = (v) => PT + drawH - (v / maxVal) * drawH;
  const xMes = (i) => PL + i * colW;
  const barW = colW * 0.38;
  const mesHoy = new Date().getMonth();

  const diagDur = diasServ <= 90 ? "Optimo" : diasServ <= 120 ? "Aceptable" : diasServ <= 179 ? "Excesivo" : "Continuo";
  const diagCol = diasServ <= 90 ? C.green : diasServ <= 120 ? C.amber : C.red;

  return (
    <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <div style={{ fontFamily: C.font, fontSize: 11, color: C.text, fontWeight: 700 }}>
          Distribución de partos — actual vs recomendado 90d
        </div>
        <div style={{ fontFamily: C.font, fontSize: 8, color: diagCol, fontWeight: 700 }}>
          Servicio actual: {diasServ}d — {diagDur}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* mes actual highlight */}
        <rect x={xMes(mesHoy)} y={PT} width={colW} height={drawH} fill={C.green + "1a"} />

        {Array.from({ length: 12 }, (_, i) => {
          const hAct = drawH * (dist[i] / maxVal);
          const hRec = drawH * (distRec[i] / maxVal);
          const xAct = xMes(i) + colW * 0.08;
          const xRec = xMes(i) + colW * 0.54;
          return (
            <g key={i}>
              {/* Barra actual */}
              {dist[i] > 0 && (
                <rect x={xAct} y={yVal(dist[i])} width={barW} height={Math.max(1, hAct)}
                  fill={diagCol} opacity={0.75} rx={1} />
              )}
              {/* Barra recomendada */}
              {distRec[i] > 0 && (
                <rect x={xRec} y={yVal(distRec[i])} width={barW} height={Math.max(1, hRec)}
                  fill={C.blue} opacity={0.60} rx={1} />
              )}
              <text x={xMes(i) + colW / 2} y={H - 6} textAnchor="middle"
                style={{ fontFamily: C.font, fontSize: "6.5px",
                  fill: i === mesHoy ? C.green : C.textFaint,
                  fontWeight: i === mesHoy ? "700" : "400" }}>
                {MESES[i]}
              </text>
            </g>
          );
        })}

        {/* Línea base */}
        <line x1={PL} y1={PT + drawH} x2={W - PR} y2={PT + drawH} stroke={C.textFaint} strokeWidth={0.5} />
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4, fontFamily: C.font, fontSize: 8, color: C.textDim }}>
        <span><span style={{ display: "inline-block", width: 8, height: 8, background: diagCol, marginRight: 3, opacity: 0.75 }} />Actual ({diasServ}d)</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, background: C.blue, marginRight: 3, opacity: 0.60 }} />Recomendado (90d)</span>
        {diasServ > 90 && (
          <span style={{ marginLeft: "auto", color: C.amber }}>
            Acortar a 90d concentra partos en {mesesRec} meses: +sincronia pasto · +preñez en la vaca de cola
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Cronograma anual ───
function CronogramaAnual({ motor, form, sat }) {
  const cerebro = useMemo(() => {
    if (!motor) return null;
    try { return calcCerebro(motor, form, sat); }
    catch(e) { console.error("CronogramaAnual:", e); return null; }
  }, [motor, form, sat]);

  if (!cerebro?.cronograma) return null;

  const { cronograma, calendarioAcciones } = cerebro;
  const { hitos = [] } = calendarioAcciones || {};

  const W = 680, H = 156;
  const PL = 8, PR = 8;
  const LABEL_H = 18;
  const BAR_H = 72;
  const EVENT_Y = LABEL_H + BAR_H + 6;
  const colW = (W - PL - PR) / 12;

  const bals = cronograma.map(m => m.bal);
  const maxAbs = Math.max(30, ...bals.map(Math.abs));
  const zeroY = LABEL_H + BAR_H / 2;
  const barScale = (BAR_H / 2 - 4) / maxAbs;

  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px", marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
        <div style={{ fontFamily:C.font, fontSize:11, color:C.text, fontWeight:700 }}>Cronograma anual del rodeo</div>
        <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>balance Mcal/d · hitos del ciclo · suplementación</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", display:"block" }}>
        {cronograma.map((m, i) => {
          const x0 = PL + i * colW;
          const cx = x0 + colW / 2;
          const bgFill = m.esInv ? C.amber + "1a" : m.esActual ? C.green + "26" : "transparent";
          const barH = Math.max(2, Math.abs(m.bal) * barScale);
          const barY = m.bal >= 0 ? zeroY - barH : zeroY;
          const barColor = m.bal >= 0 ? C.green : m.bal > -30 ? C.amber : C.red;
          const labelFill = m.esActual ? C.green : m.esPasado ? C.textFaint : m.esInv ? C.orange : C.textDim;

          return (
            <g key={i}>
              <rect x={x0} y={LABEL_H} width={colW} height={BAR_H + 32} fill={bgFill} />
              {m.esActual && (
                <rect x={x0+0.5} y={LABEL_H} width={colW-1} height={BAR_H+32}
                  fill="none" stroke={C.green} strokeWidth={0.8} strokeDasharray="3,2" />
              )}
              <line x1={x0} y1={zeroY} x2={x0+colW} y2={zeroY} stroke={C.border} strokeWidth={0.5} />
              <rect x={cx - colW*0.28} y={barY} width={colW*0.56} height={barH}
                fill={barColor} opacity={0.82} rx={1.5} />
              {(m.esSupl || m.esVerdeo) && (
                <rect x={x0+1.5} y={H - 17} width={colW-3} height={7} rx={2}
                  fill={(m.esVerdeo ? C.green : C.orange) + "50"}
                  stroke={m.esVerdeo ? C.green : C.orange} strokeWidth={0.6} />
              )}
              <text x={cx} y={LABEL_H - 3} textAnchor="middle"
                style={{ fontFamily:C.font, fontSize:"8.5px", fill:labelFill,
                  fontWeight: m.esActual || m.esInv ? "700" : "400" }}>
                {MESES[i]}
              </text>
              {Math.abs(m.bal) >= maxAbs * 0.28 && (
                <text x={cx} y={m.bal >= 0 ? barY - 2 : barY + barH + 9}
                  textAnchor="middle"
                  style={{ fontFamily:C.font, fontSize:"6px", fill:barColor, fontWeight:"700" }}>
                  {m.bal >= 0 ? "+" : ""}{Math.round(m.bal)}
                </text>
              )}
            </g>
          );
        })}

        {hitos.map((h, idx) => {
          if (h.mes === null || h.mes === undefined) return null;
          const cx = PL + h.mes * colW + colW / 2;
          const y = EVENT_Y + 3;
          const abbr = { "Parto":"Par","Destete":"Des","Servicio":"Ser" }[h.label] || h.label.slice(0,3);
          return (
            <g key={idx}>
              <circle cx={cx} cy={y + 5} r={7} fill={h.color + "28"} stroke={h.color} strokeWidth={1} />
              <text x={cx} y={y + 9} textAnchor="middle"
                style={{ fontFamily:C.font, fontSize:"6.5px", fill:h.color, fontWeight:"700" }}>
                {abbr}
              </text>
              <text x={cx} y={y + 22} textAnchor="middle"
                style={{ fontFamily:C.font, fontSize:"6px", fill:h.color }}>
                {h.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginTop:5, fontFamily:C.font, fontSize:8, color:C.textDim }}>
        <span><span style={{ display:"inline-block", width:8, height:8, background:C.green, marginRight:3, borderRadius:1 }} />Superávit</span>
        <span><span style={{ display:"inline-block", width:8, height:8, background:C.red, marginRight:3, borderRadius:1 }} />Déficit</span>
        <span><span style={{ display:"inline-block", width:8, height:8, background:C.orange+"50", border:`1px solid ${C.orange}`, marginRight:3, borderRadius:1 }} />Supl.</span>
        <span><span style={{ display:"inline-block", width:8, height:8, background:C.green+"50", border:`1px solid ${C.green}`, marginRight:3, borderRadius:1 }} />Verdeo</span>
        <span style={{ marginLeft:"auto", color:C.textFaint }}>Fondo ámbar=invierno · borde verde=hoy</span>
      </div>
    </div>
  );
}

// ─── Trayectoria PV Vaquillona ───
// Shows CON vs SIN supplementation weight trajectory from May yr1 to Nov yr2.
// X axis: 5 proportional key dates (real days). Y axis: PV (kg).
function GraficoTrayectoriaVaq({ vaq1E, vaq2E }) {
  if (!vaq1E || !vaq2E || !vaq1E.pvEntrada || !vaq2E.pvMayo2Inv) return null;

  // ── Build key points ──────────────────────────────────────────
  const DIAS_INV1 = 122;  // may → sep
  const DIAS_VER  = 270;  // sep yr1 → may yr2
  const DIAS_INV2 = 90;   // may → ago
  const DIAS_ENT  = 90;   // ago → nov (primavera hacia entore)
  const TOTAL     = DIAS_INV1 + DIAS_VER + DIAS_INV2 + DIAS_ENT; // 572

  const pvIni   = vaq1E.pvEntrada;
  const pvMin   = vaq2E.pvMinEntore;

  // CON supl
  const pvSepCon  = vaq1E.pvSal;
  const pvMayCon  = vaq2E.pvMayo2Inv;
  const pvAgoCon  = vaq2E.pvV2Agosto;
  const pvNovCon  = vaq2E.pvEntore;

  // SIN supl — derived from motor exports
  const gdpP1     = vaq1E.gdpPasto || 0;
  const gdpP2     = vaq2E.gdpPastoInv || 0;
  const gdpP3     = 280; // primavera sin supl (matches calcVaq2 constant)
  const pvSepSin  = Math.round(pvIni + gdpP1 * DIAS_INV1 / 1000);
  // calcPvEntradaVaq2 adds a fixed ~92 kg regardless of start PV
  const ganVer    = pvMayCon - pvSepCon; // same summer gain for both paths
  const pvMaySin  = Math.round(pvSepSin + ganVer);
  const pvAgoSin  = Math.round(pvMaySin + gdpP2 * DIAS_INV2 / 1000);
  const pvNovSin  = Math.round(pvAgoSin + gdpP3 * DIAS_ENT  / 1000);

  // ── SVG coords ───────────────────────────────────────────────
  const W = 680, H = 150;
  const PL = 36, PR = 60, PT = 10, PB = 30;
  const dW = W - PL - PR, dH = H - PT - PB;

  const xDays = [0, DIAS_INV1, DIAS_INV1 + DIAS_VER, DIAS_INV1 + DIAS_VER + DIAS_INV2, TOTAL];
  const xPct  = xDays.map(d => d / TOTAL);
  const xPos  = xPct.map(p => PL + p * dW);

  const pvCon = [pvIni, pvSepCon, pvMayCon, pvAgoCon, pvNovCon];
  const pvSin = [pvIni, pvSepSin, pvMaySin, pvAgoSin, pvNovSin];
  const allPv = [...pvCon, ...pvSin, pvMin];
  const pvLo  = Math.floor(Math.min(...allPv) / 10) * 10 - 10;
  const pvHi  = Math.ceil( Math.max(...allPv) / 10) * 10 + 10;
  const yPV   = (v) => PT + dH - ((v - pvLo) / (pvHi - pvLo)) * dH;
  const yMin  = yPV(pvMin);

  const ptsCon = pvCon.map((v, i) => `${xPos[i].toFixed(1)},${yPV(v).toFixed(1)}`).join(" ");
  const ptsSin = pvSin.map((v, i) => `${xPos[i].toFixed(1)},${yPV(v).toFixed(1)}`).join(" ");

  const HITOS = [
    { label: "May Año 1", sub: "destete" },
    { label: "Sep", sub: "fin 1° inv" },
    { label: "May Año 2", sub: "ini 2° inv" },
    { label: "Ago", sub: "fin 2° inv" },
    { label: "Nov", sub: "entore" },
  ];

  // Y-axis ticks
  const pvRange = pvHi - pvLo;
  const step    = pvRange <= 80 ? 20 : pvRange <= 160 ? 40 : 60;
  const yTicks  = [];
  for (let v = Math.ceil(pvLo / step) * step; v <= pvHi; v += step) yTicks.push(v);

  const llegaCon  = pvNovCon >= pvMin;
  const llegaSin  = pvNovSin >= pvMin;

  return (
    <div style={{ position: "relative", marginBottom: 12, background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 10px 6px" }}>
      <div style={{ fontFamily: C.font, fontSize: 9, color: C.textDim, letterSpacing: 1, marginBottom: 4 }}>
        TRAYECTORIA PESO VIVO — RECRÍA VAQUILLONA (1° y 2° INVIERNO)
      </div>
      <div style={{ position: "relative", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", maxWidth: W }}>
          {/* invierno backgrounds */}
          {[
            [xPos[0], xPos[1]],
            [xPos[2], xPos[3]],
          ].map(([x1, x2], i) => (
            <rect key={i} x={x1} y={PT} width={x2 - x1} height={dH}
              fill={C.amber + "14"} />
          ))}

          {/* y-axis ticks + grid */}
          {yTicks.map(v => {
            const y = yPV(v);
            return (
              <g key={v}>
                <line x1={PL} x2={W - PR} y1={y} y2={y} stroke={C.border} strokeWidth={0.6} />
                <text x={PL - 3} y={y + 3} textAnchor="end"
                  style={{ fontFamily: C.font, fontSize: "7px", fill: C.textFaint }}>{v}</text>
              </g>
            );
          })}

          {/* pvMinEntore reference */}
          <line x1={PL} x2={W - PR} y1={yMin} y2={yMin}
            stroke={C.amber} strokeWidth={1} strokeDasharray="4,3" />
          <text x={W - PR + 3} y={yMin + 3}
            style={{ fontFamily: C.font, fontSize: "7px", fill: C.amber }}>
            {pvMin} kg
          </text>
          <text x={W - PR + 3} y={yMin + 10}
            style={{ fontFamily: C.font, fontSize: "6px", fill: C.amber + "cc" }}>
            mín
          </text>

          {/* SIN supl — red dashed */}
          <polyline points={ptsSin} fill="none"
            stroke={C.red} strokeWidth={1.5} strokeDasharray="5,3" />

          {/* CON supl — green solid */}
          <polyline points={ptsCon} fill="none"
            stroke={C.green} strokeWidth={2} />

          {/* Dots CON */}
          {pvCon.map((v, i) => (
            <circle key={i} cx={xPos[i]} cy={yPV(v)} r={3} fill={C.green} />
          ))}
          {/* Dots SIN */}
          {pvSin.map((v, i) => (
            <circle key={i} cx={xPos[i]} cy={yPV(v)} r={2.5} fill="none"
              stroke={C.red} strokeWidth={1.2} />
          ))}

          {/* PV labels at end (Nov) */}
          <text x={xPos[4] + 3} y={yPV(pvNovCon) + 3}
            style={{ fontFamily: C.font, fontSize: "7.5px", fill: llegaCon ? C.green : C.amber, fontWeight: "700" }}>
            {pvNovCon}
          </text>
          <text x={xPos[4] + 3} y={yPV(pvNovSin) + 3}
            style={{ fontFamily: C.font, fontSize: "7.5px", fill: llegaSin ? C.green : C.red + "dd" }}>
            {pvNovSin}
          </text>

          {/* X-axis hitos */}
          {HITOS.map((h, i) => (
            <g key={i}>
              <line x1={xPos[i]} x2={xPos[i]} y1={PT} y2={PT + dH}
                stroke={C.border} strokeWidth={0.6} strokeDasharray={i > 0 ? "2,3" : "none"} />
              <text x={xPos[i]} y={H - PB + 11} textAnchor="middle"
                style={{ fontFamily: C.font, fontSize: "7px", fill: C.textDim }}>
                {h.label}
              </text>
              <text x={xPos[i]} y={H - PB + 20} textAnchor="middle"
                style={{ fontFamily: C.font, fontSize: "6px", fill: C.textFaint }}>
                {h.sub}
              </text>
            </g>
          ))}
        </svg>
      </div>
      {/* Legend */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontFamily: C.font, fontSize: 8, color: C.textDim, marginTop: 3 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <svg width={18} height={8}><line x1={0} y1={4} x2={18} y2={4} stroke={C.green} strokeWidth={2} /></svg>
          Con suplementación · {pvNovCon} kg
          {llegaCon
            ? <span style={{ color: C.green }}> ✓ llega al entore</span>
            : <span style={{ color: C.amber }}> ⚠ falta {pvMin - pvNovCon} kg</span>}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <svg width={18} height={8}><line x1={0} y1={4} x2={18} y2={4} stroke={C.red} strokeWidth={1.5} strokeDasharray="4,2" /></svg>
          Sin suplementación · {pvNovSin} kg
          {llegaSin
            ? <span style={{ color: C.green }}> ✓ llega</span>
            : <span style={{ color: C.red }}> ✗ no llega ({pvMin - pvNovSin} kg)</span>}
        </span>
        <span style={{ color: C.textFaint }}>Fondo ámbar = invierno · línea ámbar = peso mínimo entore ({pvMin} kg)</span>
      </div>
    </div>
  );
}

// ─── Componente principal ───
export default function GraficosBalance({ form, sat, cadena, tray, motor, usaPotreros, potreros }) {
  const [conReco, setConReco] = useState(false);

  const formActivo = useMemo(() => conReco ? aplicarRecomendaciones(form) : form, [form, conReco]);

  const datos = useMemo(() => {
    if (!motor) return null;
    const safe = (cat) => {
      try { return balancePorCategoria(motor, formActivo, sat, cat); }
      catch(e) { console.error(`GraficosBalance error [${cat}]:`, e); return null; }
    };
    return {
      general:   safe("general"),
      vacas_v2s: safe("vacas_v2s"),
      vaq1:      safe("vaq1"),
      vaq2:      safe("vaq2"),
    };
  }, [motor, formActivo, sat]);

  const todosNull = datos && !datos.general && !datos.vacas_v2s && !datos.vaq1 && !datos.vaq2;
  if (!datos || todosNull) {
    return (
      <div style={{ padding:"48px 24px", textAlign:"center",
        background:C.card2, borderRadius:12, border:`1px solid ${C.border}` }}>
        <div style={{ fontSize:28, opacity:0.3, marginBottom:12 }}>📊</div>
        <div style={{ fontFamily:C.font, fontSize:12, color:C.textDim, marginBottom:6, letterSpacing:.4 }}>
          Sin datos de balance
        </div>
        <div style={{ fontFamily:C.fontSans, fontSize:11, color:C.textFaint, lineHeight:1.6, maxWidth:260, margin:"0 auto" }}>
          Completá el rodeo (número de vacas y CC) y los potreros para ver el balance oferta/demanda.
        </div>
      </div>
    );
  }

  const sinPotreros = !usaPotreros || !(potreros || []).length;

  return (
    <div>
      {/* Toggle antes/despues */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <button onClick={() => setConReco(false)} style={{
          flex: 1, padding: "7px 10px", borderRadius: 8, cursor: "pointer",
          background: !conReco ? C.textDim + "25" : "transparent",
          border: `1px solid ${!conReco ? C.textDim : C.border}`,
          color: !conReco ? C.text : C.textDim,
          fontFamily: C.font, fontSize: 10, fontWeight: !conReco ? 700 : 400,
        }}>
          Situacion actual
        </button>
        <button onClick={() => setConReco(true)} style={{
          flex: 1, padding: "7px 10px", borderRadius: 8, cursor: "pointer",
          background: conReco ? C.green + "25" : "transparent",
          border: `1px solid ${conReco ? C.green : C.border}`,
          color: conReco ? C.green : C.textDim,
          fontFamily: C.font, fontSize: 10, fontWeight: conReco ? 700 : 400,
        }}>
          Con recomendaciones aplicadas
        </button>
      </div>

      {sinPotreros && (
        <div style={{ background: C.amber + "28", border: `1px solid ${C.amber}40`, borderRadius: 8, padding: "6px 10px", marginBottom: 10, fontFamily: C.font, fontSize: 9, color: C.amber }}>
          Estimacion sin asignacion de potreros a categorias — carga los potreros en el paso "El campo" para balance preciso.
        </div>
      )}

      {conReco && (
        <div style={{ background: C.green + "1e", border: `1px solid ${C.green}30`, borderRadius: 8, padding: "6px 10px", marginBottom: 10, fontFamily: C.font, fontSize: 9, color: C.green }}>
          Proyeccion con ajustes estandar: suplementacion proteica vaq1 y vaq2 en invierno + verdeo orientado a recria.
        </div>
      )}

      <TrayectoriaCC form={form} motor={motor} />

      {datos.general && (
        <GraficoMcal
          datos={datos.general.meses}
          titulo={`General · ${datos.general.nAnimales} cabezas`}
          subTitulo={datos.general.label}
          mostrarMovCC={true}
        />
      )}

      {datos.vacas_v2s && (
        <GraficoMcal
          datos={datos.vacas_v2s.meses}
          titulo={`Vacas + V2S · ${datos.vacas_v2s.nAnimales} cabezas`}
          subTitulo={`${datos.vacas_v2s.pv} kg PV · con movilizacion CC`}
          mostrarMovCC={true}
        />
      )}

      <GraficoTrayectoriaVaq vaq1E={motor?.vaq1E} vaq2E={motor?.vaq2E} />

      {datos.vaq1 ? (
        datos.vaq1.nAnimales > 0 ? (
          <GraficoGDP
            datos={datos.vaq1.meses}
            titulo={`Vaquillona 1° invierno · ${datos.vaq1.nAnimales} cabezas`}
            subTitulo={`${datos.vaq1.pv} kg PV · recría hacia entore`}
            objetivoVerano={500}
            objetivoInvierno={200}
          />
        ) : (
          <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10, fontFamily: C.font, fontSize: 9, color: C.textDim }}>
            Vaquillona 1 invierno — sin animales registrados. Configurá el % de reposición en el paso Rodeo.
          </div>
        )
      ) : null}

      {datos.vaq2 ? (
        datos.vaq2.nAnimales > 0 ? (() => {
          const vaq2E = motor?.vaq2E;
          const llegaEntore = vaq2E?.llegas;
          const gdpMinNecesario = vaq2E
            ? Math.ceil((vaq2E.pvMinEntore - vaq2E.pvMayo2Inv) * 1000 / (12 * 30))
            : 400;
          return (
            <>
              {llegaEntore ? (
                <div style={{ background: C.green + "2c", border: `1px solid ${C.green}40`, borderRadius: 8, padding: "6px 10px", marginBottom: 6, fontFamily: C.font, fontSize: 9, color: C.green }}>
                  Llega al entore con peso proyectado ({vaq2E.pvEntore} kg / min {vaq2E.pvMinEntore} kg)
                </div>
              ) : vaq2E ? (
                <div style={{ background: C.amber + "2c", border: `1px solid ${C.amber}40`, borderRadius: 8, padding: "6px 10px", marginBottom: 6, fontFamily: C.font, fontSize: 9, color: C.amber }}>
                  No llega al entore — falta {vaq2E.pvMinEntore - vaq2E.pvEntore} kg · necesita &ge; {gdpMinNecesario} g/d promedio
                </div>
              ) : null}
              <GraficoGDP
                datos={datos.vaq2.meses}
                titulo={`Vaquillona 2° invierno · ${datos.vaq2.nAnimales} cabezas`}
                subTitulo={`${datos.vaq2.pv} kg PV · mín entore ${vaq2E?.pvMinEntore ?? "—"} kg`}
                objetivoGDP={llegaEntore ? 400 : gdpMinNecesario}
              />
            </>
          );
        })() : (
          <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10, fontFamily: C.font, fontSize: 9, color: C.textDim }}>
            Vaquillona 2 invierno — sin animales registrados. Cargá la cantidad en el paso Rodeo.
          </div>
        )
      ) : null}

      <GraficoDistribucionPartos cadena={cadena} />

      <CronogramaAnual motor={motor} form={form} sat={sat} />

      <div style={{ fontFamily: C.font, fontSize: 8, color: C.textFaint, marginTop: 8, textAlign: "center" }}>
        Metodo: balance por categoria con consumo real (Rosello et al. 2025, Detmann 2010, NRC 2000).
      </div>
    </div>
  );
}
