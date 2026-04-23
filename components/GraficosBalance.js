// ═══════════════════════════════════════════════════════════════════
// components/GraficosBalance.js
// 4 graficos de balance por categoria:
//   1. General (todo el rodeo)
//   2. Vacas + V2S (con movilizacion CC)
//   3. Vaquillona 1° invierno (Mcal/dia + GDP)
//   4. Vaquillona 2° invierno (Mcal/dia + GDP)
// + toggle "antes/despues" con recomendaciones aplicadas
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
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

// ─── Simulacion simplificada de "con recomendaciones" ───
function aplicarRecomendaciones(form) {
  // Copia del form con ajustes estandar del cerebro:
  // 1. Destete anticipado si CC ponderada < 4.5 (retira gasto lactacion)
  // 2. Suplementacion proteica estandar vaq1 y vaq2 en invierno (0.5 kg/d expeller)
  // 3. Verdeo orientado a vaq1 si hay ha disponibles
  const f = { ...form };

  // Ajuste supl vaq1 (si no tiene, agregar)
  if (!f.supl_vaq1 || parseFloat(f.dosis_vaq1 || 0) < 0.3) {
    f.supl_vaq1 = "Expeller de girasol";
    f.dosis_vaq1 = "0.5";
  }
  if (!f.supl_vaq2 || parseFloat(f.dosis_vaq2 || 0) < 0.3) {
    f.supl_vaq2 = "Expeller de girasol";
    f.dosis_vaq2 = "0.5";
  }

  // Asegurar meses de suplementacion invernal (may-jun-jul-ago)
  f.suplMeses = ["4","5","6","7"];

  // Redireccionar verdeo a vaq1 si existe y esta como "todo"
  if (f.tieneVerdeo && (!f.verdeoDestinoVaq || f.verdeoDestinoVaq === "todo")) {
    f.verdeoDestinoVaq = "vaq1";
  }

  return f;
}

// ─── Helper: un grafico SVG con oferta apilada + demanda + balance ───
function GraficoMcal({ datos, titulo, subTitulo, mostrarMovCC, W = 340, H = 180 }) {
  const mesHoy = new Date().getMonth();
  const pad = 22;
  const colW = (W - pad * 2) / 12;
  const barW = colW - 3;

  const vals = datos.map(d => ({ up: d.oferta.total, down: d.demanda }));
  const maxUp = Math.max(1, ...vals.map(v => v.up));
  const maxDown = Math.max(1, ...vals.map(v => v.down));
  const maxAbs = Math.max(maxUp, maxDown);
  const midY = H / 2;
  const escala = (midY - 20) / maxAbs;

  return (
    <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ fontFamily: C.font, fontSize: 11, color: C.text, fontWeight: 700 }}>{titulo}</div>
        <div style={{ fontFamily: C.font, fontSize: 8, color: C.textFaint }}>{subTitulo}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* bandas invierno */}
        {[5, 6, 7].map(i => (
          <rect key={i} x={pad + i * colW} y={2} width={colW} height={H - 14} fill={C.amber + "08"} />
        ))}
        {/* mes hoy */}
        <rect x={pad + mesHoy * colW} y={2} width={colW} height={H - 14} fill={C.green + "10"} rx={2} />
        {/* linea cero */}
        <line x1={pad} y1={midY} x2={W - pad} y2={midY} stroke={C.textFaint} strokeWidth="0.6" strokeDasharray="2,3" />

        {datos.map((d, i) => {
          const x = pad + i * colW + 1.5;

          // Oferta apilada (hacia arriba)
          const hPasto = (d.oferta.pasto || 0) * escala;
          const hSupl = (d.oferta.suplemento || 0) * escala;
          const hVerdeo = (d.oferta.verdeo || 0) * escala;
          const hCC = (d.oferta.movilizacionCC || 0) * escala;

          let yCursor = midY;
          const segments = [];
          if (hPasto > 0) { yCursor -= hPasto; segments.push({ y: yCursor, h: hPasto, color: C.green }); }
          if (hSupl > 0)  { yCursor -= hSupl;  segments.push({ y: yCursor, h: hSupl,  color: C.blue }); }
          if (hVerdeo > 0){ yCursor -= hVerdeo;segments.push({ y: yCursor, h: hVerdeo,color: C.greenDark }); }
          if (mostrarMovCC && hCC > 0) { yCursor -= hCC; segments.push({ y: yCursor, h: hCC, color: C.orange }); }

          // Demanda (hacia abajo)
          const hDem = (d.demanda || 0) * escala;

          // Balance numerico arriba o abajo
          const bal = d.balance;
          const balAbs = Math.abs(bal);
          const balCol = bal >= 0 ? C.green : C.red;

          return (
            <g key={i}>
              {segments.map((s, idx) => (
                <rect key={idx} x={x} y={s.y} width={barW} height={Math.max(1, s.h)} fill={s.color} opacity={0.85} rx={1} />
              ))}
              <rect x={x} y={midY} width={barW} height={Math.max(1, hDem)} fill={C.red} opacity={0.6} rx={1} />

              {/* numero balance solo si hay espacio */}
              {barW > 14 && (
                <text x={x + barW / 2} y={bal >= 0 ? midY - (hPasto + hSupl + hVerdeo + (mostrarMovCC ? hCC : 0)) - 3 : midY + hDem + 9}
                  textAnchor="middle" style={{ fontFamily: C.font, fontSize: "6.5px", fill: balCol, fontWeight: 700 }}>
                  {bal >= 0 ? "+" : ""}{Math.round(bal)}
                </text>
              )}

              {/* label mes */}
              <text x={x + barW / 2} y={H - 2} textAnchor="middle"
                style={{ fontFamily: C.font, fontSize: "6.5px", fill: i === mesHoy ? C.green : [5,6,7].includes(i) ? C.amber : C.textFaint,
                  fontWeight: i === mesHoy || [5,6,7].includes(i) ? 700 : 400 }}>
                {MESES[i]}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Leyenda */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6, fontFamily: C.font, fontSize: 8, color: C.textDim }}>
        <span><span style={{ display: "inline-block", width: 8, height: 8, background: C.green, marginRight: 3 }} />Pasto</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, background: C.blue, marginRight: 3 }} />Suplemento</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, background: C.greenDark, marginRight: 3 }} />Verdeo</span>
        {mostrarMovCC && <span><span style={{ display: "inline-block", width: 8, height: 8, background: C.orange, marginRight: 3 }} />Movilizacion CC</span>}
        <span><span style={{ display: "inline-block", width: 8, height: 8, background: C.red, marginRight: 3 }} />Demanda</span>
      </div>
    </div>
  );
}

// ─── Grafico GDP para vaquillonas ───
// objetivoVerano + objetivoInvierno: dos líneas estacionales (vaq1)
// objetivoGDP: línea única (vaq2 u otros)
const MESES_INV = new Set([4, 5, 6]);
function objMes(i, objetivoVerano, objetivoInvierno, objetivoGDP) {
  if (objetivoVerano !== undefined) return MESES_INV.has(i) ? objetivoInvierno : objetivoVerano;
  return objetivoGDP || 0;
}

function GraficoGDP({ datos, titulo, objetivoGDP, objetivoVerano, objetivoInvierno, subTitulo, W = 340, H = 160 }) {
  const mesHoy = new Date().getMonth();
  const pad = 22;
  const colW = (W - pad * 2) / 12;
  const gdps = datos.map(d => d.gdp || 0);
  const allObjs = objetivoVerano !== undefined
    ? [objetivoVerano, objetivoInvierno]
    : [objetivoGDP || 0];
  const maxG = Math.max(800, ...gdps.map(Math.abs), ...allObjs);
  const minG = Math.min(-200, ...gdps);
  const rango = maxG - minG;
  const midY = H - 30;
  const dual = objetivoVerano !== undefined;

  return (
    <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div style={{ fontFamily: C.font, fontSize: 11, color: C.text, fontWeight: 700 }}>{titulo}</div>
        <div style={{ fontFamily: C.font, fontSize: 8, color: C.textFaint }}>{subTitulo}</div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {/* bandas invierno */}
        {[5,6,7].map(i => (
          <rect key={i} x={pad + i * colW} y={10} width={colW} height={midY - 10} fill={C.amber + "08"} />
        ))}
        {/* mes hoy */}
        <rect x={pad + mesHoy * colW} y={10} width={colW} height={midY - 10} fill={C.green + "10"} rx={2} />

        {/* líneas objetivo */}
        {dual ? (() => {
          const yV = midY - ((objetivoVerano - minG) / rango) * (midY - 15);
          const yI = midY - ((objetivoInvierno - minG) / rango) * (midY - 15);
          // tramo verano: meses 0-3 (izq) y 7-11 (der)
          const xInvIni = pad + 4 * colW;
          const xInvFin = pad + 7 * colW;
          return (
            <g>
              {/* tramo verano izquierdo (ene-abr) */}
              <line x1={pad} y1={yV} x2={xInvIni} y2={yV} stroke={C.green} strokeWidth="0.8" strokeDasharray="4,3" opacity={0.7} />
              {/* tramo invierno (may-jul) */}
              <line x1={xInvIni} y1={yI} x2={xInvFin} y2={yI} stroke={C.amber} strokeWidth="0.8" strokeDasharray="4,3" opacity={0.9} />
              {/* tramo verano derecho (ago-dic) */}
              <line x1={xInvFin} y1={yV} x2={W - pad} y2={yV} stroke={C.green} strokeWidth="0.8" strokeDasharray="4,3" opacity={0.7} />
              <text x={W - pad - 2} y={yV - 2} textAnchor="end" style={{ fontFamily: C.font, fontSize: "6.5px", fill: C.green }}>
                verano {objetivoVerano} g/d
              </text>
              <text x={xInvIni + (xInvFin - xInvIni) / 2} y={yI - 2} textAnchor="middle" style={{ fontFamily: C.font, fontSize: "6.5px", fill: C.amber }}>
                inv {objetivoInvierno} g/d
              </text>
            </g>
          );
        })() : objetivoGDP ? (() => {
          const yObj = midY - ((objetivoGDP - minG) / rango) * (midY - 15);
          return (
            <g>
              <line x1={pad} y1={yObj} x2={W - pad} y2={yObj} stroke={C.amber} strokeWidth="0.8" strokeDasharray="4,3" />
              <text x={W - pad - 2} y={yObj - 2} textAnchor="end" style={{ fontFamily: C.font, fontSize: "7px", fill: C.amber }}>
                objetivo {objetivoGDP} g/d
              </text>
            </g>
          );
        })() : null}

        {/* barras GDP */}
        {datos.map((d, i) => {
          const gdp = d.gdp || 0;
          const obj = objMes(i, objetivoVerano, objetivoInvierno, objetivoGDP);
          const y0 = midY - ((0 - minG) / rango) * (midY - 15);
          const yG = midY - ((gdp - minG) / rango) * (midY - 15);
          const col = gdp >= obj ? C.green : gdp >= 0 ? C.amber : C.red;
          const x = pad + i * colW + 1.5;
          const barW = colW - 3;
          return (
            <g key={i}>
              <rect x={x} y={Math.min(y0, yG)} width={barW} height={Math.abs(yG - y0)} fill={col} opacity={0.85} rx={1} />
              {barW > 14 && (
                <text x={x + barW / 2} y={yG - 3} textAnchor="middle"
                  style={{ fontFamily: C.font, fontSize: "6.5px", fill: col, fontWeight: 700 }}>
                  {gdp}
                </text>
              )}
              <text x={x + barW / 2} y={H - 2} textAnchor="middle"
                style={{ fontFamily: C.font, fontSize: "6.5px", fill: i === mesHoy ? C.green : [5,6,7].includes(i) ? C.amber : C.textFaint }}>
                {MESES[i]}
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ fontFamily: C.font, fontSize: 8, color: C.textDim, marginTop: 4 }}>
        {dual
          ? "GDP proyectada mes a mes. Verde = cumple obj. verano (500 g/d) · Ámbar = cumple obj. invierno (200 g/d) · Rojo = déficit."
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

  // Aviso si no hay potreros cargados
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
          subTitulo={`${datos.general.label}`}
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
            titulo={`Vaquillona 1° invierno · ${datos.vaq1.nAnimales} cabezas`}
            subTitulo={`${datos.vaq1.pv} kg PV · objetivo llegar al entore`}
            objetivoVerano={500}
            objetivoInvierno={200}
          />
        ) : (
          <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10, fontFamily: C.font, fontSize: 9, color: C.textDim }}>
            Vaquillona 1° invierno — sin animales registrados. Configurá el % de reposición en el paso Rodeo.
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
                titulo={`Vaquillona 2° invierno · ${datos.vaq2.nAnimales} cabezas`}
                subTitulo={`${datos.vaq2.pv} kg PV · min entore ${vaq2E?.pvMinEntore ?? "—"} kg`}
                objetivoGDP={llegaEntore ? 400 : gdpMinNecesario}
              />
            </>
          );
        })() : (
          <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10, fontFamily: C.font, fontSize: 9, color: C.textDim }}>
            Vaquillona 2° invierno — sin animales registrados. Cargá la cantidad en el paso Rodeo.
          </div>
        )
      ) : null}

      <div style={{ fontFamily: C.font, fontSize: 8, color: C.textFaint, marginTop: 8, textAlign: "center" }}>
        Metodo: balance por categoria con consumo real (Rosello et al. 2025, Detmann 2010, NRC 2000).
      </div>
    </div>
  );
}