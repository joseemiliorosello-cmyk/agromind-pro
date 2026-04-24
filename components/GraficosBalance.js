// ═══════════════════════════════════════════════════════════════════
// components/GraficosBalance.js
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useRef } from "react";
import { balancePorCategoria } from "../lib/motor";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const C = {
  bg: "#f0f5ee",
  card: "#ffffff",
  card2: "#f5faf3",
  border: "#cce0c4",
  text: "#182c12",
  textDim: "#486840",
  textFaint: "#7aa070",
  green: "#2e7818",
  greenDark: "#1e5810",
  blue: "#1e68a8",
  orange: "#a06810",
  red: "#b82810",
  amber: "#a06810",
  font: "'IBM Plex Mono', monospace",
};

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
      `${MESES[i]}${[5,6,7].includes(i) ? " ❄" : ""}`,
      `Oferta:  ${d.oferta.total?.toFixed(1)} Mcal/d`,
      `  Pasto: ${d.oferta.pasto?.toFixed(1)}  Supl: ${(d.oferta.suplemento||0).toFixed(1)}`,
      d.oferta.verdeo > 0 ? `  Verdeo: ${d.oferta.verdeo.toFixed(1)}` : null,
      mostrarMovCC && d.oferta.movilizacionCC > 0 ? `  Mov.CC: ${d.oferta.movilizacionCC.toFixed(1)}` : null,
      `Demanda: ${d.demanda?.toFixed(1)} Mcal/d`,
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
        {[5, 6, 7].map(i => (
          <rect key={i} x={pad + i * colW} y={2} width={colW} height={H - 14} fill={C.amber + "08"} />
        ))}
        <rect x={pad + mesHoy * colW} y={2} width={colW} height={H - 14} fill={C.green + "10"} rx={2} />
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
                  fill: i === mesHoy ? C.green : [5,6,7].includes(i) ? C.amber : C.textFaint,
                  fontWeight: i === mesHoy || [5,6,7].includes(i) ? 700 : 400 }}>
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
      `${MESES[i]}${[5,6,7].includes(i) ? " ❄" : ""}`,
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
        {[5,6,7].map(i => (
          <rect key={i} x={pad + i * colW} y={10} width={colW} height={midY - 10} fill={C.amber + "08"} />
        ))}
        <rect x={pad + mesHoy * colW} y={10} width={colW} height={midY - 10} fill={C.green + "10"} rx={2} />

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
          const y0  = midY - ((0   - minG) / rango) * (midY - 15);
          const yG  = midY - ((gdp - minG) / rango) * (midY - 15);
          const col = gdp >= obj ? C.green : gdp >= 0 ? C.amber : C.red;
          const x   = pad + i * colW + 1.5;
          const bW  = colW - 3;
          return (
            <g key={i} style={{ cursor: "crosshair" }}
              onMouseEnter={e => handleEnter(e, i, d)}
            >
              <rect x={x - 1} y={10} width={bW + 2} height={midY - 10} fill="transparent" />
              <rect x={x} y={Math.min(y0, yG)} width={bW} height={Math.abs(yG - y0)} fill={col} opacity={0.85} rx={1} />
              {bW > 14 && (
                <text x={x + bW / 2} y={yG - 3} textAnchor="middle"
                  style={{ fontFamily: C.font, fontSize: "6.5px", fill: col, fontWeight: 700 }}>
                  {gdp}
                </text>
              )}
              <text x={x + bW / 2} y={H - 2} textAnchor="middle"
                style={{ fontFamily: C.font, fontSize: "6.5px",
                  fill: i === mesHoy ? C.green : [5,6,7].includes(i) ? C.amber : C.textFaint }}>
                {MESES[i]}
              </text>
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tooltip} />
      <div style={{ fontFamily: C.font, fontSize: 8, color: C.textDim, marginTop: 4 }}>
        {dual
          ? "GDP proyectada mes a mes. Verde = cumple obj. verano (500 g/d) · Ambar = cumple obj. invierno (200 g/d) · Rojo = deficit."
          : "GDP proyectada mes a mes. Linea punteada = objetivo. Barras verdes = cumple, amarillas = parcial, rojas = deficit."}
      </div>
    </div>
  );
}

// ─── Componente principal ───
export default function GraficosBalance({ form, sat, cadena, tray, motor }) {
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

  if (!datos) {
    return (
      <div style={{ padding: 20, textAlign: "center", fontFamily: C.font, fontSize: 10, color: C.textDim }}>
        Cargando balance por categoria...
      </div>
    );
  }

  const sinPotreros = !form.usaPotreros || !(form.potreros || []).length;

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
        <div style={{ background: C.amber + "15", border: `1px solid ${C.amber}40`, borderRadius: 8, padding: "6px 10px", marginBottom: 10, fontFamily: C.font, fontSize: 9, color: C.amber }}>
          Estimacion sin asignacion de potreros a categorias — carga los potreros en el paso "El campo" para balance preciso.
        </div>
      )}

      {conReco && (
        <div style={{ background: C.green + "10", border: `1px solid ${C.green}30`, borderRadius: 8, padding: "6px 10px", marginBottom: 10, fontFamily: C.font, fontSize: 9, color: C.green }}>
          Proyeccion con ajustes estandar: suplementacion proteica vaq1 y vaq2 en invierno + verdeo orientado a recria.
        </div>
      )}

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

      {datos.vaq1 ? (
        datos.vaq1.nAnimales > 0 ? (
          <GraficoGDP
            datos={datos.vaq1.meses}
            titulo={`Vaquillona 1 inv · ${datos.vaq1.nAnimales} cabezas`}
            subTitulo={`${datos.vaq1.pv} kg PV · objetivo llegar al entore`}
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
                <div style={{ background: C.green + "18", border: `1px solid ${C.green}40`, borderRadius: 8, padding: "6px 10px", marginBottom: 6, fontFamily: C.font, fontSize: 9, color: C.green }}>
                  Llega al entore con peso proyectado ({vaq2E.pvEntore} kg / min {vaq2E.pvMinEntore} kg)
                </div>
              ) : vaq2E ? (
                <div style={{ background: C.amber + "18", border: `1px solid ${C.amber}40`, borderRadius: 8, padding: "6px 10px", marginBottom: 6, fontFamily: C.font, fontSize: 9, color: C.amber }}>
                  No llega al entore — falta {vaq2E.pvMinEntore - vaq2E.pvEntore} kg · necesita &ge; {gdpMinNecesario} g/d promedio
                </div>
              ) : null}
              <GraficoGDP
                datos={datos.vaq2.meses}
                titulo={`Vaquillona 2 inv · ${datos.vaq2.nAnimales} cabezas`}
                subTitulo={`${datos.vaq2.pv} kg PV · min entore ${vaq2E?.pvMinEntore ?? "—"} kg`}
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

      <div style={{ fontFamily: C.font, fontSize: 8, color: C.textFaint, marginTop: 8, textAlign: "center" }}>
        Metodo: balance por categoria con consumo real (Rosello et al. 2025, Detmann 2010, NRC 2000).
      </div>
    </div>
  );
}
