"use client"; // v2
import { BarChart, Bar, LineChart, Line, ComposedChart, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

// ═══════════════════════════════════════════════════════════════════
// components/pasos.js
// Renders de los pasos del formulario.
// Cada función recibe el scope completo de CalfAIPro como argumento.
// Uso: const renders = getPasoRenders(scope);
// ═══════════════════════════════════════════════════════════════════

import React from "react";
import { T as C, MESES_NOM, FORM_DEF, getBiotipo, BIOTIPOS, SUPLEMENTOS, UBICACIONES } from "../lib/constantes"
const T = C;
import { calcCadena, calcFaseCiclo, fmtFecha, FENOLOGIAS, GWP_CH4, GWP100, AR6,
         calcConsumoAgua, evaluarAgua, calcDisponibilidadMS,
         calcConsumoPasto, calcGEI, calcOfPasto, calcScore,
         calcV2S, diagnosticarSistema, getClima, mcalSuplemento,
         reqEM, calcYm, calcGE_kgMS, calcCH4_kgMS } from "../lib/motor";
import { DistCC, Input, SelectF, Slider, SuplSelector, Alerta, Pill, MetricCard, Toggle,
         smf, smf2, pbPasto, mcalKgAdj } from "./ui";
import { DashboardEstablecimiento, GraficoBalance,
         TrayectoriaVaquillona, ScoreRadar } from "./dashboard";
import { TabCerebro, RenderInforme, SimuladorEscenarios,
         PanelRecomendaciones } from "./tabs";

// getPasoRenders: fábrica que crea las funciones de render con acceso al scope
// Uso dentro de CalfAIPro:
//   const { renderCampo, renderRodeoCompleto, renderManejo, renderAnalisis }
//         = getPasoRenders({ form, set, setDist, motor, tray, ... });

// ─── COMPONENTES AUXILIARES ──────────────────────────────────────

function LoadingPanel({msg }) {
  const T = C;
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

function PanelAgua({ form, set, sat }) {
  const enLact       = form.eReprod === "Lactación con ternero al pie";
  const evalAgua     = form.aguaTDS ? evaluarAgua(form.aguaTDS, form.aguaTipoSal, form.pvVacaAdulta, sat?.temp || 25, enLact, form.enso) : null;
  const consumoBase  = calcConsumoAgua(form.pvVacaAdulta, sat?.temp || 25, enLact);

  return (
    <div>
      {/* Header agua */}
      <div style={{ background:`${C.blue}10`, border:`1px solid ${C.blue}30`, borderRadius:12, padding:12, marginBottom:14 }}>
        <div style={{ fontFamily:C.font, fontSize:10, color:C.blue, letterSpacing:1, marginBottom:4 }}>💧 AGUA DE BEBIDA</div>
        <div style={{ fontFamily:C.sans, fontSize:12, color:C.textDim, lineHeight:1.6 }}>
          Agua salobre o con alta concentración de sólidos disueltos reduce el consumo de materia seca y el rendimiento productivo.
        </div>
      </div>

      <Input label="TDS TOTAL — SÔLIDOS DISUELTOS (mg/L)" value={form.aguaTDS} onChange={v => set("aguaTDS", v)}
        placeholder="Ej: 1500" type="number" sub="Analítica: laboratorio INTA/SENASA o tiras reactivas de campo" />

      {!form.aguaTDS && (
        <div style={{ background:"rgba(74,159,212,.06)", border:"1px solid rgba(74,159,212,.2)", borderRadius:8, padding:10, marginBottom:12 }}>
          <div style={{ fontFamily:C.sans, fontSize:11, color:C.blue }}>Sin TDS cargado — se asume calidad aceptable ({"<"}1.000 mg/L).</div>
        </div>
      )}

      <SelectF label="TIPO DE SAL DOMINANTE" value={form.aguaTipoSal} onChange={v => set("aguaTipoSal", v)}
        options={[
          ["NaCl dominante",    "NaCl (cloruros) — agua costera/subterránea"],
          ["SO4 dominante",     "SO4 (sulfatos) — Chaco/Santiago del Estero"],
          ["Mixta/Desconocida", "Mixta / Sin analizar (factor conservador)"],
        ]}
      />

      <Input label="FUENTE DE AGUA" value={form.aguaFuente} onChange={v => set("aguaFuente", v)} placeholder="Pozo, laguna, arroyo, represa…" />

      {/* Consumo estimado */}
      <div style={{ background:C.card2, borderRadius:12, padding:12, border:`1px solid ${C.border}`, marginBottom:12 }}>
        <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1, marginBottom:8 }}>CONSUMO DE AGUA ESTIMADO</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <MetricCard label="HOY (T actual)"     value={consumoBase + "L"} color={C.blue}  sub={`${sat?.temp || "—"}°C · ${enLact ? "Lactando" : "Gestación"}`} />
          <MetricCard label="EN VERANO (35°C)"   value={calcConsumoAgua(form.pvVacaAdulta, 35, enLact) + "L"} color={C.amber} sub="Pico de demanda anual" />
        </div>
        <div style={{ fontFamily:C.sans, fontSize:10, color:C.textFaint, marginTop:8 }}>
          Winchester & Morris 1956 / NRC 2000. Mín. 5 cm lineal de bebedero/vaca.
        </div>
      </div>

      {/* Resultado evaluación */}
      {evalAgua && (
        <div>
          <div style={{ background:`${evalAgua.cat.color}15`, border:`1px solid ${evalAgua.cat.color}50`, borderRadius:12, padding:12, marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontFamily:C.font, fontSize:14, fontWeight:700, color:evalAgua.cat.color }}>{evalAgua.cat.label}</span>
              <span style={{ fontFamily:C.font, fontSize:11, color:C.text }}>{evalAgua.tdsN.toLocaleString()} mg/L</span>
            </div>
            <div style={{ fontFamily:C.sans, fontSize:11, color:C.textDim, marginTop:4, lineHeight:1.5 }}>{evalAgua.cat.desc}</div>
            {evalAgua.pctReducDMI > 0 && (
              <div style={{ marginTop:8, display:"flex", gap:8, flexWrap:"wrap" }}>
                <Pill color={C.red}>DMI →{evalAgua.pctReducDMI.toFixed(0)}%</Pill>
                <Pill color={C.red}>Pasto consumido →{evalAgua.pctReducPasto.toFixed(0)}%</Pill>
                <Pill color={C.amber}>Agua ingerida →{evalAgua.pctReducWI.toFixed(0)}%</Pill>
                {evalAgua.ts.factor > 1.1 && <Pill color={C.red}>SO4: ×{evalAgua.ts.factor}</Pill>}
              </div>
            )}
          </div>
          {evalAgua.warnings.map((w, i) => (
            <Alerta key={i} tipo={w.nivel === "rojo" ? "error" : w.nivel === "ambar" ? "warn" : "ok"}>{w.msg}</Alerta>
          ))}
        </div>
      )}

    </div>
  );
}

function GraficoCCEscenarios({ escenarios, cadena, mesesLact, form, sat }) {
  const T = C;
  const MESES_C    = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const ESC_NAMES  = (escenarios || []).map(e => e.label || "Escenario");
  const ESC_COLORS = (escenarios || []).map(e => e.color || "#7ec850");
  const mesP    = cadena?.partoTemp ? cadena.partoTemp.getMonth() : 10;
  // mesServ = mes real de inicio de servicio (de cadena.ini), no derivado del parto
  const mesServ = cadena?.ini ? cadena.ini.getMonth() : (mesP + 3) % 12;

  // ── Panel 1: Trayectoria CC ──
  // Ciclo correcto:
  //   Hoy → Parto:           CC sube (recuperación preparto)
  //   Parto → Destete:       CC cae (lactación, moviliza reservas endógenas)
  //   Destete → Servicio:    CC mínima / leve recuperación (ccMinLact → ccServ)
  //   Servicio → fin de año: CC sigue subiendo (gestación + recuperación)
  const dataMeses = MESES_C.map((mes, mi) => {
    const obj = { mes };
    escenarios.forEach((esc, ei) => {
      if (!esc.tray) return;
      const { ccHoy, ccParto, ccMinLact, ccServ } = esc.tray;
      // mesDestN = mes aproximado de destete
      const mesesLactN = Math.ceil(parseFloat(mesesLact) || 6);
      const mesDestN   = (mesP + mesesLactN) % 12;
      // mesRecup = mes servicio (punto donde se llega a ccServ)
      const mesRecupN  = mesServ;

      let cc;
      if (mesP > mesServ) {
        // Caso normal NEA: parto nov/oct, servicio dic/ene
        // Hoy(0) → Parto → Destete → Servicio → fin año
        if      (mi < mesP)                         cc = ccHoy    + (ccParto   - ccHoy)    * (mi / Math.max(1, mesP));
        else if (mi < mesDestN || mesDestN <= mesP)  cc = ccParto  + (ccMinLact - ccParto)  * Math.min(1, (mi - mesP) / Math.max(1, mesesLactN));
        else if (mi <= mesRecupN || mesRecupN < mesDestN) cc = ccMinLact + (ccServ - ccMinLact) * Math.min(1, (mi - mesDestN) / Math.max(1, (mesRecupN - mesDestN + 12) % 12 || 3));
        else    cc = ccServ + (ccHoy - ccServ) * Math.min(1, (mi - mesRecupN) / Math.max(1, 12 - mesRecupN));
      } else {
        // Caso parto temprano (ene-mar): parto → destete → servicio → recuperación → parto siguiente
        if      (mi < mesP)      cc = ccHoy + (ccParto - ccHoy) * (mi / Math.max(1, mesP));
        else if (mi < mesDestN)  cc = ccParto + (ccMinLact - ccParto) * ((mi - mesP) / Math.max(1, mesesLactN));
        else if (mi < mesRecupN) cc = ccMinLact + (ccServ - ccMinLact) * ((mi - mesDestN) / Math.max(1, mesRecupN - mesDestN || 2));
        else                     cc = ccServ + (ccHoy - ccServ) * Math.min(1, (mi - mesRecupN) / Math.max(1, 12 - mesRecupN));
      }
      obj[ESC_NAMES[ei]] = +Math.max(1, Math.min(9, cc)).toFixed(2);
    });
    return obj;
  });

  const CustomDot = (props) => {
    const { cx, cy, index, dataKey } = props;
    if (index === mesServ) {
      const fillColor = ESC_COLORS[ESC_NAMES.indexOf(dataKey)];
      if (!fillColor) return null;
      return <circle cx={cx} cy={cy} r={5} fill={fillColor} stroke={T.bg} strokeWidth={1.5} />;
    }
    return null;
  };

  // ── Panel 2: Requerimientos vs Aportes (Mcal/vaca/día) ──
  // Usa escenario base (escenarios[0]) o el primero activo
  const escBase = escenarios[0];
  const hist        = form ? getClima(form.provincia || "Corrientes") : [];
  const mc          = new Date().getMonth();
  const enso        = form?.enso || "neutro";
  const pT          = parseFloat(form?.destTrad)  || 0;
  const pA          = parseFloat(form?.destAntic) || 0;
  const pH          = parseFloat(form?.destHiper) || 0;
  const totD        = pT + pA + pH || 100;
  const mesesLactGraf = Math.max(1.5, (pT*(180/30) + pA*(90/30) + pH*(50/30)) / totD);
  const pvVaca      = parseFloat(form?.pvVacaAdulta) || 320;
  const nTotal      = Math.max(1, parseInt(form?.vacasN) || 0);
  const ndviN       = parseFloat(sat?.ndvi || 0.45);
  const mcalSuplDia = mcalSuplemento(escBase?.supl2, parseFloat(escBase?.dosis2) || 0);
  const tray        = escBase?.tray;

  const dataBal = hist.length > 0 ? MESES_C.map((mes, i) => {
    const h      = i === mc && sat ? { t:parseFloat(sat.temp)||hist[i].t, p:parseFloat(sat.p30)||hist[i].p } : hist[i];
    const ndviI  = i === mc ? ndviN : 0.45;
    const fenolMs = i === mc ? (form?.fenologia || "menor_10")
      : h.t < 15 ? "mayor_50" : h.t < 20 ? "25_50" : h.t < 25 ? "10_25" : "menor_10";
    const sup    = parseFloat(form?.supHa)    || 100;
    const pctM   = parseFloat(form?.pctMonte) || 0;
    const pctN   = parseFloat(form?.pctNGan)  || 0;
    const ofTotal = calcOfPasto(form?.vegetacion || "Pastizal natural", ndviI, h.t, h.p, enso, fenolMs) * sup * Math.max(0, 100-pctM-pctN) / 100;
    const ofVaca  = nTotal > 0 ? ofTotal / nTotal : calcOfPasto(form?.vegetacion || "Pastizal natural", ndviI, h.t, h.p, enso, fenolMs) * 0.024 * pvVaca;
    const enLact  = i >= mesP && i < mesP + Math.ceil(mesesLactGraf);
    const eRep    = enLact ? "Lactación con ternero al pie" : i === ((mesP-1+12)%12) ? "Preparto (último mes)" : "Gestación media (5–7 meses)";
    const demVaca = reqEM(pvVaca, eRep, form?.biotipo) || 13;
    const ccMcal  = enLact && tray ? Math.min(5, parseFloat(tray.caidaLact||0) * 5.6 / mesesLactGraf) : 0;
    const suplMcal = enLact ? mcalSuplDia : 0;
    const deficit  = Math.max(0, demVaca - (ofVaca + ccMcal + suplMcal));
    return {
      mes,
      pasto:   +Math.min(ofVaca, demVaca).toFixed(1),   // aporte pasto (capped)
      ccComp:  +ccMcal.toFixed(1),
      supl:    +suplMcal.toFixed(1),
      demanda: +demVaca.toFixed(1),
      deficit: +deficit.toFixed(1),
    };
  }) : [];

  const hasBal = dataBal.length > 0;

  return (
    <div>
      {/* ── Trayectoria CC ── */}
      <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, marginBottom:4, letterSpacing:1 }}>
        TRAYECTORIA CC ANUAL — ★ = inicio servicio
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={dataMeses} margin={{ top:4, right:4, left:-28, bottom:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(126,200,80,.06)" />
          <XAxis dataKey="mes" tick={{ fill:T.textDim, fontSize:9, fontFamily:T.font }} />
          <YAxis domain={[2,8]} ticks={[2,3,4,5,6,7]} tick={{ fill:T.textDim, fontSize:9, fontFamily:T.font }} />
          <Tooltip contentStyle={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontFamily:T.font, fontSize:11 }}
            formatter={(v, n) => [`CC ${parseFloat(v).toFixed(1)}`, n]} />
          <ReferenceLine y={5.0} stroke="rgba(126,200,80,.30)" strokeDasharray="4 2"
            label={{ value:"CC 5.0 → 55% preñez", fill:"rgba(126,200,80,.55)", fontSize:8, fontFamily:T.font, position:"insideTopRight" }} />
          <ReferenceLine y={4.5} stroke="rgba(224,85,48,.30)"  strokeDasharray="4 2"
            label={{ value:"CC 4.5 → 35%",        fill:"rgba(224,85,48,.55)",  fontSize:8, fontFamily:T.font, position:"insideBottomRight" }} />
          {escenarios.map((esc, ei) => esc.tray && (
            <Line key={ei} type="monotone" dataKey={ESC_NAMES[ei]} stroke={ESC_COLORS[ei]}
              strokeWidth={2.5} dot={<CustomDot />} activeDot={{ r:4, fill:ESC_COLORS[ei] }}
              name={ESC_NAMES[ei]} />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* ── Requerimientos vs Aportes ── */}
      {hasBal && (
        <div style={{ marginTop:14 }}>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, marginBottom:4, letterSpacing:1 }}>
            REQUERIMIENTOS vs APORTES — Mcal/vaca/día (escenario base)
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={dataBal} margin={{ top:4, right:4, left:-28, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(126,200,80,.06)" />
              <XAxis dataKey="mes" tick={{ fill:T.textDim, fontSize:9, fontFamily:T.font }} />
              <YAxis tick={{ fill:T.textDim, fontSize:9, fontFamily:T.font }} domain={[0,"auto"]} />
              <Tooltip
                contentStyle={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontFamily:T.font, fontSize:11 }}
                formatter={(v, n) => [v.toFixed(1)+" Mcal", n]}
              />
              {/* Aportes apilados */}
              <Area type="monotone" dataKey="pasto"   name="Pasto (oferta)"   stackId="of" fill="rgba(126,200,80,.22)" stroke={T.green} strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="ccComp"  name="CC movilizada"    stackId="of" fill="rgba(232,160,48,.22)" stroke={T.amber} strokeWidth={1}   dot={false} strokeDasharray="4 2" />
              <Area type="monotone" dataKey="supl"    name="Suplemento"       stackId="of" fill="rgba(74,159,212,.22)" stroke={T.blue}  strokeWidth={1.5} dot={false} />
              {/* Requerimiento como línea roja */}
              <Line  type="monotone" dataKey="demanda" name="Requerimiento"   stroke={T.red}   strokeWidth={2} strokeDasharray="6 3" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          {/* Leyenda compacta */}
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:6, justifyContent:"center" }}>
            <span style={{ fontFamily:T.font, fontSize:8, color:T.green }}>■ Pasto</span>
            <span style={{ fontFamily:T.font, fontSize:8, color:T.amber }}>■ CC movilizada</span>
            <span style={{ fontFamily:T.font, fontSize:8, color:T.blue  }}>■ Suplemento</span>
            <span style={{ fontFamily:T.font, fontSize:8, color:T.red   }}>── Requerimiento</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PanelGEI({form, motor, tray, sat }) {
  const T = C;
  const gei = React.useMemo(() => calcGEI(form, motor, tray, sat), [form, motor, tray, sat]);
  const [vista, setVista] = React.useState("resumen"); // resumen | categorias | pastizal | inefi

  if (!gei) return null;

  // Colores específicos GEI
  const G = {
    ch4:    "#e8a030",   // naranja = metano (calor)
    co2:    "#4a9fd4",   // azul = CO2/secuestro
    inefi:  "#e05530",   // rojo = ineficiencia
    mejor:  "#7ec850",   // verde = mejora
    neutro: "#8aaa80",
  };

  // ── KPIs superiores ───────────────────────────────────────────
  const KpiGEI = ({ label, valor, unit, color, sub, nota }) => (
    <div style={{ background:T.card2, border:`1px solid ${color}25`, borderRadius:12, padding:"10px 12px" }}>
      <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, letterSpacing:1, marginBottom:3 }}>{label}</div>
      <div style={{ fontFamily:T.font, fontSize:18, fontWeight:700, color, lineHeight:1 }}>
        {typeof valor === "number" ? valor.toLocaleString() : valor}
        <span style={{ fontSize:10, color:T.textFaint, marginLeft:4 }}>{unit}</span>
      </div>
      {sub  && <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, marginTop:3 }}>{sub}</div>}
      {nota && <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginTop:2 }}>{nota}</div>}
    </div>
  );

  // ── Vista resumen ────────────────────────────────────────────
  const VistaResumen = () => (
    <div>
      {/* KPI principal — métrica para el productor */}
      {gei.intensBase && (() => {
        // Promedio nacional cría bovina extensiva: 25-35 kg CO2eq/kg PV (FAO-GLEAM 2022)
        const promedioNacional = 30;
        const mejor = gei.intensBase < promedioNacional;
        return (
          <div style={{ background:mejor ? `${G.mejor}10` : `${G.ch4}10`,
            border:`1px solid ${mejor ? G.mejor : G.ch4}35`, borderRadius:14,
            padding:"14px 16px", marginBottom:14 }}>
            <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, letterSpacing:1, marginBottom:6 }}>
              HUELLA DE CARBONO — INTENSIDAD DE EMISIÔN
            </div>
            <div style={{ display:"flex", alignItems:"flex-end", gap:12, flexWrap:"wrap" }}>
              <div>
                <div style={{ fontFamily:T.font, fontSize:28, fontWeight:700,
                  color: mejor ? G.mejor : G.ch4, lineHeight:1 }}>
                  {gei.intensBase}
                </div>
                <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, marginTop:3 }}>
                  kg CO₂eq por kg PV producido
                </div>
              </div>
              <div style={{ fontFamily:T.font, fontSize:10, color:T.textFaint, alignSelf:"center" }}>vs</div>
              <div>
                <div style={{ fontFamily:T.font, fontSize:18, fontWeight:700, color:T.textDim, lineHeight:1 }}>
                  {promedioNacional}
                </div>
                <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, marginTop:3 }}>
                  promedio nacional (FAO-GLEAM)
                </div>
              </div>
              <div style={{ marginLeft:"auto", textAlign:"right" }}>
                <div style={{ fontFamily:T.font, fontSize:11, fontWeight:700,
                  color: mejor ? G.mejor : G.ch4 }}>
                  {mejor ? `${Math.round((1 - gei.intensBase/promedioNacional)*100)}% mejor` : `${Math.round((gei.intensBase/promedioNacional - 1)*100)}% encima`}
                </div>
                <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>del promedio</div>
              </div>
            </div>
            {gei.intensSupl && gei.intensSupl < gei.intensBase && (
              <div style={{ marginTop:8, padding:"4px 10px", background:`${G.mejor}15`,
                borderRadius:6, fontFamily:T.font, fontSize:9, color:G.mejor }}>
                Con suplementación: {gei.intensSupl} kg CO₂eq/kg PV
                · mejora →{((1 - gei.intensSupl/gei.intensBase)*100).toFixed(1)}%
              </div>
            )}
            <div style={{ marginTop:6, fontFamily:T.font, fontSize:8, color:T.textFaint, lineHeight:1.5 }}>
              GWP100 AR6 (IPCC, 2021) · CH₄ entérico por categoría, IPCC (2019) Tier 2, Ec.10.21
              · Ym calibrado: Gere et al. (2019), NZ J. Agric. Res. · Terneros producidos: {gei.ternerosAnual}
            </div>
          </div>
        );
      })()}
      {/* Comparación clave: CH4/kg MS sin vs con */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:14, marginBottom:12 }}>
        <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, letterSpacing:1, marginBottom:10 }}>
          EFICIENCIA DE EMISIÔN — g CH₄ por kg MS consumida
        </div>
        {gei.catData.map(c => {
          const mejora  = c.eficSupl < c.eficBase;
          const deltaPct= c.eficBase > 0 ? ((c.eficSupl - c.eficBase) / c.eficBase * 100).toFixed(1) : 0;
          return (
            <div key={c.id} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3, alignItems:"center" }}>
                <span style={{ fontFamily:T.font, fontSize:10, color:T.text }}>{c.label}</span>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <span style={{ fontFamily:T.font, fontSize:10, color:G.ch4 }}>{c.eficBase} g/kg MS</span>
                  {c.suplDosis > 0 && (
                    <>
                      <span style={{ color:T.textFaint, fontSize:9 }}>→</span>
                      <span style={{ fontFamily:T.font, fontSize:10, color:mejora ? G.mejor : G.inefi, fontWeight:700 }}>
                        {c.eficSupl} g/kg MS
                        <span style={{ fontSize:8, marginLeft:3 }}>({deltaPct > 0 ? "+" : ""}{deltaPct}%)</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
              {/* Barra doble */}
              <div style={{ position:"relative", height:8, borderRadius:4, background:`${T.border}` }}>
                <div style={{
                  position:"absolute", left:0, top:0, bottom:0,
                  width:`${Math.min(100, c.eficBase / 30 * 100)}%`,
                  background:G.ch4, borderRadius:4, opacity:0.6,
                }} />
                {c.suplDosis > 0 && (
                  <div style={{
                    position:"absolute", left:0, top:0, bottom:0,
                    width:`${Math.min(100, c.eficSupl / 30 * 100)}%`,
                    background:mejora ? G.mejor : G.inefi, borderRadius:4, opacity:0.85,
                    border:`1px solid ${mejora ? G.mejor : G.inefi}`,
                  }} />
                )}
              </div>
              {c.suplDosis > 0 && (
                <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginTop:2 }}>
                  Supl {c.suplDosis} kg/d · dig promedio anual {c.digPromAnual}% → {c.digConSProm.toFixed(1)}% con supl · CV {c.cvBaseProm} → {c.suplDosis + c.cvBaseProm} kg MS/d
                  {c.suplPb > 0 && ` · ${SUPLEMENTOS[form["supl_"+c.id]]?.label || "supl."} PB ${c.suplPb}%`}
                </div>
              )}
            </div>
          );
        })}
        <div style={{ marginTop:8, padding:"6px 10px", background:`rgba(255,255,255,.02)`, borderRadius:8, border:`1px solid ${T.border}`, fontFamily:T.font, fontSize:8, color:T.textFaint }}>
          Digestibilidad actual del pasto: {gei.dig}% (fenología {form.fenologia || "10_25"}) · 
          IPCC (2019) Tier 2, Ec.10.21: EF = GEI × Ym/100 / 55.65 · Ym calibrado: Gere et al. (2019), NZ J. Agric. Res. · Suplemento ↑dig → ↓Ym → ↓CH₄
        </div>
      </div>

      {/* Balance neto */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
        <div style={{ background:T.card2, border:`1px solid ${G.ch4}25`, borderRadius:12, padding:12 }}>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, letterSpacing:1, marginBottom:6 }}>CH₄ RODEO/AÑO</div>
          <div style={{ fontFamily:T.font, fontSize:20, fontWeight:700, color:G.ch4 }}>
            {gei.totalCH4Base.toLocaleString()} kg
          </div>
          {/* FIX 3 en acción: mostrar GWP28 Y GWP* para que el usuario entienda la diferencia */}
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, marginTop:3 }}>
            GWP100: {(gei.totalCO2eqBase / 1000).toFixed(0)} t CO₂eq
          </div>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>
            GWP* (rodeo estable): {(gei.totalCO2eqBaseSTAR / 1000).toFixed(0)} t CO₂eq
          </div>
          {gei.totalCH4Supl < gei.totalCH4Base && (
            <div style={{ fontFamily:T.font, fontSize:9, color:G.mejor, marginTop:4 }}>
              Con supl: {gei.totalCH4Supl.toLocaleString()} kg (→{(gei.totalCH4Base - gei.totalCH4Supl).toLocaleString()} kg)
            </div>
          )}
        </div>
        <div style={{ background:T.card2, border:`1px solid ${gei.co2Pastizal.esFuente ? G.inefi : G.co2}25`, borderRadius:12, padding:12 }}>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, letterSpacing:1, marginBottom:6 }}>
            CO₂ PASTIZAL/AÑO
          </div>
          <div style={{ fontFamily:T.font, fontSize:20, fontWeight:700,
            color: gei.co2Pastizal.esFuente ? G.inefi : G.co2 }}>
            {gei.co2Pastizal.CO2_total > 0 ? "+" : ""}
            {(gei.co2Pastizal.CO2_total / 1000).toFixed(1)} t
          </div>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, marginTop:3 }}>
            {gei.co2Pastizal.esFuente ? "fuente neta" : "secuestro neto"}
          </div>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginTop:2 }}>
            {gei.co2Pastizal.CO2_ha > 0 ? "+" : ""}{gei.co2Pastizal.CO2_ha} kgCO₂/ha/año
          </div>
        </div>
      </div>

      {/* Balance neto sistema */}
      <div style={{
        background: gei.balanceNetoBase > 0 ? `${G.ch4}08` : `${G.mejor}08`,
        border:`1px solid ${gei.balanceNetoBase > 0 ? G.ch4 : G.mejor}30`,
        borderRadius:12, padding:14, marginBottom:12,
      }}>
        <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, letterSpacing:1, marginBottom:8 }}>
          BALANCE NETO SISTEMA (CH₄ rodeo → secuestro pastizal)
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
          <div>
            <div style={{ fontFamily:T.font, fontSize:24, fontWeight:700,
              color: gei.balanceNetoBase > 0 ? G.ch4 : G.mejor }}>
              {(gei.balanceNetoBase / 1000).toFixed(1)} t CO₂eq/año
            </div>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, marginTop:3 }}>
              {gei.balanceNetoBase > 0 ? "emisor neto" : "sumidero neto"}
            </div>
          </div>
          {gei.intensBase && (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:T.font, fontSize:16, fontWeight:700, color:T.text }}>
                {gei.intensBase} kg CO₂eq
              </div>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>por kg PV producido</div>
            </div>
          )}
        </div>
        {gei.pctReduccion > 0 && (
          <div style={{ marginTop:8, padding:"4px 8px", background:`${G.mejor}12`, borderRadius:6,
            fontFamily:T.font, fontSize:9, color:G.mejor }}>
            Con suplementación: →{gei.pctReduccion}% emisiones · {(gei.reduccionCO2eq/1000).toFixed(1)} t CO₂eq/año
            {gei.intensSupl && ` · Intensidad: ${gei.intensSupl} kg CO₂eq/kg PV`}
          </div>
        )}
      </div>

      {/* Nota GWP — contexto para el ganadero */}
      <div style={{ padding:"8px 12px", background:`${G.ch4}06`, border:`1px solid ${G.ch4}20`, borderRadius:8,
        fontFamily:T.font, fontSize:8, color:T.textFaint, lineHeight:1.6 }}>
        <strong style={{ color:T.textDim }}>GWP100 vs GWP*:</strong> GWP100=28 es el estándar del inventario
        nacional (Kioto/París). GWP* (Allen 2018) es más adecuado para rodeos estables: un rodeo que
        no crece tiene calentamiento efectivo cercano a cero. Si tu rodeo es constante en número,
        el impacto real es 5-6× menor que el que muestra el GWP100. ·
        Wang et al. 2023 (Nature Comms): el secuestro por suelos no puede compensar emisiones a escala global;
        el offset mostrado es potencial y sujeto a saturación en 20-50 años.
      </div>
    </div>
  );

  // ── Vista categorías: tabla detallada ─────────────────────────
  const VistaCateg = () => (
    <div>
      <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, letterSpacing:1, marginBottom:10 }}>
        CH₄ ENTÉRICO POR CATEGORÍA — g CH₄/kg MS promedio anual · GWP100 y GWP*
      </div>
      {gei.catData.map(c => (
        <div key={c.id} style={{ background:T.card2, border:`1px solid ${T.border}`,
          borderRadius:12, padding:12, marginBottom:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ fontFamily:T.font, fontSize:11, color:T.text, fontWeight:600 }}>
              {c.label} <span style={{ color:T.textFaint, fontWeight:400 }}>({c.n} cab.)</span>
            </div>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint }}>
              {c.pv} kg PV · dig anual {c.digPromAnual}%{c.suplDosis > 0 ? ` → ${c.digConSProm.toFixed(1)}% con supl` : ""}
            </div>
          </div>
          {/* Comparativa SIN / CON */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <div style={{ background:`${G.ch4}08`, borderRadius:8, padding:"8px 10px", border:`1px solid ${G.ch4}20` }}>
              <div style={{ fontFamily:T.font, fontSize:8, color:G.ch4, letterSpacing:1, marginBottom:4 }}>SIN RECOMENDACIÔN</div>
              <div style={{ fontFamily:T.font, fontSize:14, fontWeight:700, color:G.ch4 }}>{c.eficBase} g CH₄/kg MS</div>
              <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, marginTop:3 }}>{c.ch4DiaBase} g/cab/día</div>
              <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim }}>{c.ch4AnoBase.toLocaleString()} kg CH₄/año</div>
              <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint }}>{(c.co2eqBase/1000).toFixed(1)} t CO₂eq</div>
            </div>
            <div style={{
              background: c.suplDosis > 0 ? `${c.mejora ? G.mejor : G.inefi}08` : `${T.card}`,
              borderRadius:8, padding:"8px 10px",
              border:`1px solid ${c.suplDosis > 0 ? (c.mejora ? G.mejor : G.inefi) : T.border}20`
            }}>
              <div style={{ fontFamily:T.font, fontSize:8,
                color: c.suplDosis > 0 ? (c.mejora ? G.mejor : G.inefi) : T.textFaint,
                letterSpacing:1, marginBottom:4 }}>
                {c.suplDosis > 0 ? "CON SUPLEMENTACIÔN" : "SIN SUPL. CARGADO"}
              </div>
              {c.suplDosis > 0 ? (
                <>
                  <div style={{ fontFamily:T.font, fontSize:14, fontWeight:700,
                    color:c.mejora ? G.mejor : G.inefi }}>{c.eficSupl} g CH₄/kg MS</div>
                  <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, marginTop:3 }}>{c.ch4DiaSupl} g/cab/día</div>
                  <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim }}>{c.ch4AnoSupl.toLocaleString()} kg CH₄/año</div>
                  <div style={{ fontFamily:T.font, fontSize:9,
                    color:c.mejora ? G.mejor : G.inefi, fontWeight:700 }}>
                    {c.delta > 0 ? "+" : ""}{c.delta.toLocaleString()} kg ({c.mejora ? "↓ mejora" : "↑ aumenta"})
                  </div>
                </>
              ) : (
                <div style={{ fontFamily:T.font, fontSize:10, color:T.textFaint, marginTop:8 }}>
                  Cargá suplemento en el paso anterior para ver el impacto
                </div>
              )}
            </div>
          </div>
          {c.suplDosis > 0 && (
            <div style={{ marginTop:6, fontFamily:T.font, fontSize:8, color:T.textFaint, lineHeight:1.5 }}>
              Mecanismo: suplemento {SUPLEMENTOS[form["supl_"+c.id]]?.label || "proteico"} (PB {c.suplPb}%, dig {c.suplDosis > 0 ? "80" : "—"}%) 
              diluyó la fibra indigestible → dig dieta promedio {c.digPromAnual}% → {c.digConSProm.toFixed(1)}% → 
              Ym {calcYm(c.digPromAnual).toFixed(3)} → {calcYm(c.digConSProm).toFixed(3)} · Gere et al. (2019); Beauchemin et al. (2009)
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // ── Vista pastizal: CO₂ y factores ───────────────────────────
  const VistaPastizal = () => {
    const p = gei.co2Pastizal;
    const ndviColor = gei.ndvi > 0.6 ? G.mejor : gei.ndvi > 0.4 ? G.ch4 : G.inefi;
    return (
      <div>
        <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, letterSpacing:1, marginBottom:10 }}>
          DEMANDA/SECUESTRO DE CO₂ — Pastizal · Pasturas · Bosque nativo
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
          <div style={{ background:T.card2, border:`1px solid ${ndviColor}25`, borderRadius:12, padding:12 }}>
            <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginBottom:3 }}>NDVI</div>
            <div style={{ fontFamily:T.font, fontSize:22, fontWeight:700, color:ndviColor }}>{gei.ndvi.toFixed(2)}</div>
            <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>
              {gei.ndvi > 0.6 ? "Alta biomasa — buen secuestro" : gei.ndvi > 0.4 ? "Biomasa moderada" : "Baja biomasa — secuestro reducido"}
            </div>
          </div>
          <div style={{ background:T.card2, border:`1px solid ${T.border}`, borderRadius:12, padding:12 }}>
            <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginBottom:3 }}>PRECIPITACIÔN ANUAL</div>
            <div style={{ fontFamily:T.font, fontSize:22, fontWeight:700, color:G.co2 }}>{Math.round(gei.precipAnual)} mm</div>
            <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>Temperatura media: {gei.t_media}°C</div>
          </div>
        </div>

        <div style={{ background:T.card2, border:`1px solid ${T.border}`, borderRadius:12, padding:14, marginBottom:10 }}>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, letterSpacing:1, marginBottom:8 }}>
            PRODUCTIVIDAD PRIMARIA NETA (NPP)
          </div>
          {[
            ["Vegetación", form.vegetacion || "Pastizal natural", T.text],
            ["NPP real ajustada", p.NPP_real + " kgC/ha/año", G.co2],
            ["NEP (secuestro neto)", p.NEP + " kgC/ha/año", p.NEP > 0 ? G.mejor : G.inefi],
            ["Efecto carga animal", p.factCarga > 0 ? "+" + (p.factCarga * 100).toFixed(0) + "% (secuestro adicional)" : p.factCarga === 0 ? "Neutral" : (p.factCarga * 100).toFixed(0) + "% (degrada)", p.factCarga > 0 ? G.mejor : p.factCarga === 0 ? T.textFaint : G.inefi],
            ["CO₂ total ha/año", (p.CO2_ha > 0 ? "+" : "") + p.CO2_ha + " kgCO₂eq", p.CO2_ha > 0 ? G.mejor : G.inefi],
            ["CO₂ total establecimiento", (p.CO2_total > 0 ? "+" : "") + (p.CO2_total/1000).toFixed(1) + " t CO₂eq/año", p.CO2_total > 0 ? G.mejor : G.inefi],
          ].map(([k, v, col]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between",
              padding:"5px 0", borderBottom:`1px solid ${T.border}30` }}>
              <span style={{ fontFamily:T.font, fontSize:9, color:T.textFaint }}>{k}</span>
              <span style={{ fontFamily:T.font, fontSize:10, color:col, fontWeight:600 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ padding:"8px 12px", background:`${G.co2}06`, border:`1px solid ${G.co2}20`,
          borderRadius:8, fontFamily:T.font, fontSize:8, color:T.textFaint, lineHeight:1.6 }}>
          Modelo basado en: McGinn et al. 2014 · Soussana et al. (Agric.Ecosyst.) · Li et al. 2021 (Nature Comms).
          NPP calibrada para NEA/Chaco húmedo. Respiración heterotrófica = f(T°, humedad).
          Efecto de carga: sobrecarga &gt;1.2 EV/ha → pérdida de carbono del suelo (Li et al. 2021).
          ⚠️ Bosque nativo: mayor secuestro, pero la conversión a pasturas lo convierte en fuente neta permanente.
        </div>
      </div>
    );
  };

  // ── Vista ineficiencias ───────────────────────────────────────
  const VistaInefi = () => {
    const inf = gei.inefi;
    return (
      <div>
        <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, letterSpacing:1, marginBottom:10 }}>
          INEFICIENCIAS PRODUCTIVAS — CH₄ emitido sin retorno económico
        </div>

        {/* Vacas vacías */}
        <div style={{ background:`${G.inefi}08`, border:`1px solid ${G.inefi}30`, borderRadius:12, padding:14, marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ fontFamily:T.font, fontSize:11, color:G.inefi, fontWeight:700 }}>
              🐄 Vacas vacías — CH₄ sin ternero
            </div>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint }}>
              Preñez actual: {inf.prenezPct}%
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:8 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontFamily:T.font, fontSize:20, fontWeight:700, color:G.inefi }}>{inf.vacasVacias}</div>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>vacas vacías</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontFamily:T.font, fontSize:20, fontWeight:700, color:G.ch4 }}>
                {inf.ch4VacaVaciaAnual}kg
              </div>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>CH₄/vaca/año</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontFamily:T.font, fontSize:20, fontWeight:700, color:G.inefi }}>
                {(inf.co2eqVacasVacias/1000).toFixed(1)}t
              </div>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>CO₂eq/año</div>
            </div>
          </div>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, lineHeight:1.5 }}>
            Una vaca vacía emite ~55 kg CH₄/año (IPCC Tier 2, extensivo) = 1.540 kg CO₂eq sin producir ternero.
            Mejorar preñez de {inf.prenezPct}% a 70%: →{Math.round(inf.vacasVacias * 0.3 * inf.ch4VacaVaciaAnual * GWP_CH4 / 1000)} t CO₂eq/año.
            Wang et al. 2023: la ineficiencia reproductiva es la mayor fuente de emisiones "no productivas" en sistemas extensivos.
          </div>
        </div>

        {/* Vaquillona con entore tardío */}
        <div style={{ background:`${G.ch4}08`, border:`1px solid ${G.ch4}30`, borderRadius:12, padding:14, marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ fontFamily:T.font, fontSize:11, color:G.ch4, fontWeight:700 }}>
              🐃 Vaquillona entore tardío — meses improductivos
            </div>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint }}>
              Edad entore proyectada: {gei.edadEntoreReal} meses
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:8 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontFamily:T.font, fontSize:20, fontWeight:700,
                color: gei.edadEntoreReal > 24 ? G.inefi : G.mejor }}>
                {gei.edadEntoreReal} m
              </div>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>edad real entore</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontFamily:T.font, fontSize:20, fontWeight:700, color:G.ch4 }}>{inf.demora}</div>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>meses extra</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontFamily:T.font, fontSize:20, fontWeight:700,
                color: inf.co2eqVaqTarde > 0 ? G.ch4 : G.mejor }}>
                {inf.co2eqVaqTarde > 0 ? (inf.co2eqVaqTarde/1000).toFixed(1) + "t" : "✓ 0"}
              </div>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>CO₂eq extra</div>
            </div>
          </div>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, lineHeight:1.5 }}>
            Objetivo INTA: entore a los 24 meses. Cada mes de demora = ~2.9 kg CH₄ = 81 kg CO₂eq adicionales por vaquillona.
            {inf.demora > 0
              ? ` Con suplementación invernal y verdeo, la vaquillona puede llegar a entorarse a los 24 meses — eliminando ${(inf.co2eqVaqTarde/1000).toFixed(1)} t CO₂eq/año de emisiones improductivas.`
              : " ✅ La vaquillona llega al peso para entore a los 24 meses con el plan actual."}
          </div>
        </div>

        {/* Total ineficiencias */}
        <div style={{ background:`${G.inefi}06`, border:`1px solid ${G.inefi}20`, borderRadius:10, padding:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <span style={{ fontFamily:T.font, fontSize:10, color:T.textDim }}>
              Fracción improductiva del total
            </span>
            <span style={{ fontFamily:T.font, fontSize:18, fontWeight:700, color:G.inefi }}>
              {inf.pctInefi}% = {(inf.totalCO2eqInefi / 1000).toFixed(1)} t CO₂eq/año
            </span>
          </div>
          {/* Barra de composición: productivo vs improductivo */}
          <div style={{ height:10, borderRadius:5, background:`${T.border}`, overflow:"hidden", marginBottom:6 }}>
            <div style={{ height:"100%", width:`${100 - inf.pctInefi}%`, background:G.mejor, borderRadius:"5px 0 0 5px", display:"inline-block" }} />
            <div style={{ height:"100%", width:`${inf.pctInefi}%`, background:G.inefi, display:"inline-block" }} />
          </div>
          <div style={{ display:"flex", gap:12, marginBottom:6 }}>
            <span style={{ fontFamily:T.font, fontSize:8, color:G.mejor }}>★ {(100 - inf.pctInefi).toFixed(1)}% productivo</span>
            <span style={{ fontFamily:T.font, fontSize:8, color:G.inefi }}>★ {inf.pctInefi}% sin retorno económico</span>
          </div>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, lineHeight:1.6 }}>
            ⚠️ Estos {(inf.totalCO2eqInefi/1000).toFixed(1)} t CO₂eq son una <em>partición</em> del total de {(gei.totalCO2eqBase/1000).toFixed(0)} t —
            no se suman al balance. Son la fracción que emite el rodeo sin producir ternero ni carne.
            Reducirla con manejo (preñez, entore temprano) mejora la intensidad de emisión
            sin cambiar el total de animales. Acuerdo de París / FAO-GLEAM: prioridad de reducción en sistemas extensivos.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
        <div style={{ fontFamily:T.font, fontSize:11, color:T.text, fontWeight:700 }}>
          🌿 BALANCE DE GASES DE EFECTO INVERNADERO
        </div>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>
          CH₄ entérico · CO₂ pastizal · Ineficiencias productivas
        </div>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:12 }}>
        <KpiGEI
          label="CH₄ TOTAL RODEO"
          valor={gei.totalCH4Base.toLocaleString()}
          unit="kg/año"
          color={G.ch4}
          sub={`${(gei.totalCO2eqBase/1000).toFixed(0)} t CO₂eq (GWP28)`}
          nota={gei.pctReduccion > 0 ? `Con supl: →${gei.pctReduccion}%` : null}
        />
        <KpiGEI
          label="CO₂ PASTIZAL"
          valor={`${gei.co2Pastizal.CO2_total > 0 ? "+" : ""}${(gei.co2Pastizal.CO2_total/1000).toFixed(1)}`}
          unit="t/año"
          color={gei.co2Pastizal.CO2_total > 0 ? G.co2 : G.inefi}
          sub={gei.co2Pastizal.CO2_total > 0 ? "secuestro neto" : "fuente neta"}
          nota={`NDVI ${gei.ndvi.toFixed(2)} · ${gei.supHa} ha · incertidumbre ±40%`}
        />
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:4, marginBottom:12 }}>
        {[
          ["resumen",     "📊 Resumen"],
          ["categorias",  "🐄 Categorías"],
          ["pastizal",    "🌿 Pastizal"],
          ["inefi",       "⚠️ Inefic."],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setVista(k)} style={{
            flex:1, padding:"7px 3px", borderRadius:8, cursor:"pointer",
            fontFamily:T.font, fontSize:8,
            background: vista === k ? `${G.ch4}20` : "transparent",
            border:`1px solid ${vista === k ? G.ch4 : T.border}`,
            color: vista === k ? G.ch4 : T.textDim,
          }}>{l}</button>
        ))}
      </div>

      {vista === "resumen"    && <VistaResumen />}
      {vista === "categorias" && <VistaCateg />}
      {vista === "pastizal"   && <VistaPastizal />}
      {vista === "inefi"      && <VistaInefi />}

      {/* ── Pie de referencia ───────────────────────────────────── */}
      <div style={{ marginTop:10, padding:"6px 10px", background:`rgba(255,255,255,.02)`,
        border:`1px solid ${T.border}`, borderRadius:8,
        fontFamily:T.font, fontSize:7, color:T.textFaint, lineHeight:1.7 }}>
        McGinn et al. 2014 (J.Env.Quality) · Wang et al. 2023 (Nature Comms) · Li et al. 2021 (Nature Comms) · 
        IPCC (2019) Tier 2, Ec.10.21 · Gere et al. (2019) NZ J. Agric. Res. · McSherry & Ritchie (2013) Global Change Biology · IPCC AR6 GWP₀══=28 · 
        GWP100 CH₄ = 28 (IPCC AR6, fossil methane equivalent)
      </div>
    </div>
  );
}

export function getPasoRenders(scope) {
  // Destructurar el scope para que los renders lo usen
  const {
    form, set, setDist, step, setStep,
    motor, motorEfectivo, tray, balanceMensual, sat, coords, setCoords,
    ccPondVal, evalAgua, sanidad, nVaqRepos, score,
    result, setResult, loading, setLoading, loadMsg, setLoadMsg, setTab, tab,
    cerebro, confianza, scoreRiesgo, nivelRiesgo, colorRiesgo,
    cargaEV_ha, impactoCola, vaq1E, vaq2E, ccDesvio,
    dist, stockStatus, toroDxn, alertasMotor,
    modoForraje, setModoForraje, vistaSupl, setVistaSupl,
    usaPotreros, setUsaPotreros, potreros, setPotreros,
    runAnalysis, calcConfianzaDiagnostico,
    pvEntVaq1, pvSalidaVaq1, pvEntradaVaq2,
    nVacas, nToros, nV2s, nVaq1, nVaq2,
    cadena, disponMS, evalAgua: ea,
    PASOS, gpsClick, tcSave,
  } = scope;

const renderUbicacion = () => {
  const paises = Object.keys(UBICACIONES);
  const zonas  = form.pais ? Object.keys(UBICACIONES[form.pais] || {}) : [];
  const provs  = (form.pais && form.zona) ? Object.keys(UBICACIONES[form.pais]?.[form.zona] || {}) : [];
  const locs   = (form.pais && form.zona && form.provincia)
    ? Object.keys(UBICACIONES[form.pais]?.[form.zona]?.[form.provincia] || {})
    : [];
  const handlePais = (v) => { set("pais",v); set("zona",""); set("provincia",""); set("localidad",""); };
  const handleZona = (v) => { set("zona",v); set("provincia",""); set("localidad",""); };
  const handleProv = (v) => { set("provincia",v); set("localidad",""); };
  const handleLoc  = (v) => {
    set("localidad", v);
    const c = UBICACIONES[form.pais]?.[form.zona]?.[form.provincia]?.[v];
    if (c) setCoords({ lat:c[0], lon:c[1] });
  };
  return (
    <div>
      {sat && !sat.error && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
          <MetricCard label="TEMPERATURA" value={sat.temp+"°C"} color={C.amber} />
          <MetricCard label="NDVI" value={sat.ndvi} color={C.green} sub={sat.condForr} />
          <MetricCard label="LLUVIA 30D" value={sat.p30+"mm"} color={"#4a9eff"} />
          <MetricCard label="BALANCE" value={(sat.deficit>0?"+":"")+sat.deficit+"mm"} color={sat.deficit>0?C.green:C.red} />
        </div>
      )}
      {sat?.error && <Alerta tipo="warn">{sat.error}</Alerta>}
      {coords && <Alerta tipo="ok">📍 {form.localidad||form.provincia} · {coords.lat?.toFixed(3)}°, {coords.lon?.toFixed(3)}°</Alerta>}
      {!coords && (
        <button onClick={gpsClick} style={{ padding:"6px 14px", borderRadius:8, cursor:"pointer",
          background:"transparent", border:`1px solid ${C.green}40`,
          fontFamily:C.font, fontSize:9, color:C.green, marginBottom:8, display:"block" }}>
          📍 Activar GPS (datos satelitales en tiempo real)
        </button>
      )}
      <SelectF label="PAÍS" value={form.pais} onChange={handlePais}
        placeholder="Seleccioná el país..."
        options={paises.map(p=>[p,p])} />
      {form.pais && (
        <SelectF label="ZONA AGROECOLÓGICA" value={form.zona} onChange={handleZona}
          placeholder="Seleccioná la zona..."
          options={zonas.map(z=>[z,z])} />
      )}
      {form.zona && (
        <SelectF label="PROVINCIA / DEPARTAMENTO" value={form.provincia} onChange={handleProv}
          placeholder="Seleccioná la provincia..."
          options={provs.map(p=>[p,p])} />
      )}
      {form.provincia && locs.length > 0 && (
        <SelectF label="LOCALIDAD MÁS CERCANA" value={form.localidad} onChange={handleLoc}
          placeholder="Seleccioná la localidad..."
          options={locs.map(l=>[l,l])} />
      )}
      <SelectF label="ENSO" value={form.enso} onChange={v=>set("enso",v)} options={[
        ["neutro","Neutro — año promedio"],
        ["nino","El Niño (+25% oferta forrajera)"],
        ["nina","La Niña (−25% oferta forrajera)"],
      ]} />
      <Input label="PRODUCTOR / ESTABLECIMIENTO" value={form.nombreProductor}
        onChange={v=>set("nombreProductor",v)} placeholder="Nombre del productor o establecimiento" />
    </div>
  );

  // ── PASO 1: RODEO ─────────────────────────────────────────────
}
  const renderRodeo = () => (
    <div>
      <SelectF label="BIOTIPO" value={form.biotipo} onChange={v=>set("biotipo",v)}
        placeholder="Seleccioná el biotipo..."
        groups={[
          { label:"── Cebú puro ─────────────────", opts:[
            ["Nelore",       "Nelore"],
            ["Brahman",      "Brahman"],
            ["Indobrasil",   "Indobrasil"],
          ]},
          { label:"── Braford (Hereford × Cebú) ──", opts:[
            ["Braford 3/8",  "Braford 3/8"],
            ["Braford 5/8",  "Braford 5/8"],
          ]},
          { label:"── Brangus (Angus × Brahman) ──", opts:[
            ["Brangus 3/8",  "Brangus 3/8"],
            ["Brangus 5/8",  "Brangus 5/8"],
          ]},
          { label:"── Británicas puras ─────────────", opts:[
            ["Hereford",       "Hereford"],
            ["Aberdeen Angus", "Aberdeen Angus"],
          ]},
        ]}
        
      />
      {form.biotipo && (
        <div style={{ background:C.card2, borderRadius:10, padding:10, marginBottom:12, border:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            <Pill color={C.green}>Mov CC ×{getBiotipo(form.biotipo).movCC}</Pill>
            <Pill color={C.blue}>Rec CC ×{getBiotipo(form.biotipo).recCC}</Pill>
            <Pill color={C.amber}>Umbral anestro CC{getBiotipo(form.biotipo).umbralAnestro}</Pill>
          </div>
        </div>
      )}
      <Toggle label="┬┐Incluye vacas de 1° parto?" value={form.primerParto} onChange={v=>set("primerParto",v)} />
      {form.primerParto && <Alerta tipo="warn">1° parto: requerimientos +10% · Umbral anestro +0.3 CC</Alerta>}
      <div style={{ height:12 }} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <Input label="VACAS"  value={form.vacasN}  onChange={v=>set("vacasN",v)}  placeholder="" type="number" />
        <Input label="TOROS"  value={form.torosN}  onChange={v=>set("torosN",v)}  placeholder="" type="number" />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <Input label="PV VACA ADULTA (kg)" value={form.pvVacaAdulta} onChange={v=>set("pvVacaAdulta",v)} placeholder="" type="number" />
        <Input label="PV TOROS (kg)"       value={form.pvToros}      onChange={v=>set("pvToros",v)}      placeholder="" type="number" />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:0 }}>
        <Input label="PREÑEZ HISTÓRICA (%)" value={form.prenez} onChange={v=>set("prenez",v)} placeholder="" type="number" />
        <Input label="% DESTETE HISTÔRICO"  value={form.pctDestete} onChange={v=>set("pctDestete",v)} placeholder="" type="number" />
      </div>
      <SelectF label="ESTADO REPRODUCTIVO ACTUAL" value={form.eReprod} onChange={v=>set("eReprod",v)}
        placeholder="Seleccioná el estado..."
        options={[
        "Gestación temprana (1–4 meses)","Gestación media (5–7 meses)","Preparto (último mes)",
        "Lactación con ternero al pie","Vaca seca sin ternero",
      ].map(e=>[e,e])} />

      {/* Fechas de servicio — selectores mes/año en lugar de date picker (evita bugs iOS) */}
      {(() => {
        const MESES_OPT = [
          ["01","Enero"],["02","Febrero"],["03","Marzo"],["04","Abril"],
          ["05","Mayo"],["06","Junio"],["07","Julio"],["08","Agosto"],
          ["09","Septiembre"],["10","Octubre"],["11","Noviembre"],["12","Diciembre"],
        ];
        const hoy = new Date();
        const anioAct = hoy.getFullYear();
        const ANIOS = [anioAct-1, anioAct, anioAct+1].map(a => [String(a), String(a)]);

        // Parsear y formatear: form.iniServ = "2025-10-01"
        const getMes  = (v) => v ? v.slice(5,7) : "";
        const getAnio = (v) => v ? v.slice(0,4) : "";
        const setFecha = (campo, mes, anio) => {
          if (mes && anio) set(campo, anio + "-" + mes + "-01");
          else set(campo, "");
        };

        // Auto-corregir año de fin cuando el mes de fin < mes de inicio (servicio cruza año)
        // Ej: inicio oct 2026, fin feb 2026 → fin debe ser feb 2027
        const autoCorregirAnioFin = (iniM, iniA, finM, finA) => {
          if (!iniM || !iniA || !finM || !finA) return finA;
          const ini = new Date(iniA + "-" + iniM + "-01T12:00:00");
          const fin = new Date(finA + "-" + finM + "-01T12:00:00");
          if (fin <= ini) {
            // fin está antes que ini — año de fin debe ser ini+1
            return String(parseInt(iniA) + 1);
          }
          return finA;
        };

        const iniMes  = getMes(form.iniServ);
        const iniAnio = getAnio(form.iniServ);
        const finMes  = getMes(form.finServ);
        const finAnio = getAnio(form.finServ);

        // Año corregido para fin (si fin < ini, fin es año siguiente)
        // La auto-corrección se aplica directamente al cambiar el mes de fin
        const finAnioCorr = autoCorregirAnioFin(iniMes, iniAnio, finMes, finAnio || String(anioAct));

        const cadenaCalc = form.iniServ && form.finServ ? calcCadena(form.iniServ, form.finServ) : null;
        const diasServ   = cadenaCalc?.diasServ;
        const warnServ   = diasServ != null && (diasServ < 60 || diasServ > 95)
          ? (diasServ < 60 ? "Servicio muy corto (" + diasServ + "d) — pocas vacas preñadas en la cabeza" : "Servicio largo (" + diasServ + "d) — cola de preñez pesada, terneros más livianos")
          : null;

        return (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:8 }}>
              📅 FECHAS DE SERVICIO
            </div>
            {finAnioCorr !== finAnio && finMes && iniMes && (
              <div style={{ background:C.blue+"10", border:"1px solid "+C.blue+"30", borderRadius:8,
                padding:"6px 10px", marginBottom:8 }}>
                <span style={{ fontFamily:C.font, fontSize:9, color:C.blue }}>
                  ℹ️ El fin del servicio cruza el año — ajustado a {finAnioCorr} automáticamente
                </span>
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:6 }}>
              {/* Inicio */}
              <div>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginBottom:4 }}>INICIO</div>
                <div style={{ display:"flex", gap:4 }}>
                  <select value={iniMes} onChange={e => setFecha("iniServ", e.target.value, iniAnio||String(anioAct))}
                    style={{ flex:2, background:C.card2, border:"1px solid "+C.border, borderRadius:8, color:C.text, padding:"10px 8px", fontFamily:C.font, fontSize:12 }}>
                    <option value="">Mes</option>
                    {MESES_OPT.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <select value={iniAnio} onChange={e => setFecha("iniServ", iniMes||"10", e.target.value)}
                    style={{ flex:1, background:C.card2, border:"1px solid "+C.border, borderRadius:8, color:C.text, padding:"10px 8px", fontFamily:C.font, fontSize:12 }}>
                    <option value="">Año</option>
                    {ANIOS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              {/* Fin */}
              <div>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginBottom:4 }}>FIN</div>
                <div style={{ display:"flex", gap:4 }}>
                  <select value={finMes} onChange={e => setFecha("finServ", e.target.value, autoCorregirAnioFin(iniMes, iniAnio||String(anioAct), e.target.value, finAnio||String(anioAct)))}
                    style={{ flex:2, background:C.card2, border:"1px solid "+C.border, borderRadius:8, color:C.text, padding:"10px 8px", fontFamily:C.font, fontSize:12 }}>
                    <option value="">Mes</option>
                    {MESES_OPT.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <select value={finAnioCorr} onChange={e => setFecha("finServ", finMes||"01", e.target.value)}
                    style={{ flex:1, background:C.card2, border:"1px solid "+C.border, borderRadius:8, color:C.text, padding:"10px 8px", fontFamily:C.font, fontSize:12 }}>
                    <option value="">Año</option>
                    {ANIOS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
            {diasServ != null && (
              <div style={{ fontFamily:C.font, fontSize:9, color: warnServ ? C.amber : C.green, marginTop:4 }}>
                {warnServ ? "⚠️ " + warnServ : "✓ Servicio de " + diasServ + " días — " + (diasServ <= 90 ? "óptimo para NEA" : "ajustar si es posible")}
              </div>
            )}
            {!form.iniServ && (
              <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginTop:4 }}>
                Típico NEA: inicio octubre, fin enero (90 días)
              </div>
            )}
          </div>
        );
      })()}
      <SelectF label="EDAD AL PRIMER ENTORE"
        value={form.edadPrimerEntore}
        onChange={v=>set("edadPrimerEntore",v)}
        
        options={[
          ["15","15 meses"],
          ["18","18 meses"],
          ["24","24 meses"],
          ["36","36 meses"],
        ]}
      />
      {form.edadPrimerEntore && (
        <div style={{ background:C.card2, borderRadius:10, padding:10, marginBottom:12, border:`1px solid ${C.border}` }}>
          {(() => {
            const meses = parseInt(form.edadPrimerEntore) || 18;
            const pvMin = Math.round((parseFloat(form.pvVacaAdulta)||320) * 0.60);
            const color = meses <= 15 ? C.amber : meses >= 24 ? C.blue : C.green;
            const msg   = meses <= 15
              ? "⚡ Entore precoz — requiere recría intensiva: suplementar AMBOS inviernos + pasto de calidad. Objetivo: " + pvMin + " kg con CC ≥5.5 al servicio."
              : meses <= 18
              ? "🔶 Entore temprano — 2 inviernos suplementados obligatorios. Objetivo: " + pvMin + " kg al servicio (60% PV adulto)."
              : meses <= 24
              ? "✅ Objetivo con suplementación — sin suplemento invernal la mayoría llega a 36 meses. Ahorro: 1 año de categoría improductiva en campo."
              : "⚠️´©Å Entore tardío (sin suplementación) — la vaquillona queda como categoría extra un año completo. Costo real: menor índice reproductivo + más carga sin producción.";
            return <div style={{ fontFamily:C.sans, fontSize:11, color, lineHeight:1.4 }}>{msg}</div>;
          })()}
        </div>
      )}
      {cadena && (
        <div style={{ background:C.card2, borderRadius:10, padding:12, border:`1px solid ${C.border}`, marginBottom:12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {[["Parto temprano",fmtFecha(cadena.partoTemp)],["Parto tardío",fmtFecha(cadena.partoTard)],
              ["Destete temp.",fmtFecha((cadena.tipos?.[form.destTipo || (form.destHiper>0?"hiper":form.destAntic>0?"antic":"trad")]?.desteTemp) || cadena.desteTemp)],
              ["Destete tard.",fmtFecha((cadena.tipos?.[form.destTipo || (form.destHiper>0?"hiper":form.destAntic>0?"antic":"trad")]?.desteTard) || cadena.desteTard)]].map(([l,v])=>(
              <div key={l}>
                <div style={{ fontFamily:C.font, fontSize:8, color:C.textDim }}>{l}</div>
                <div style={{ fontFamily:C.sans, fontSize:12, color:C.text, fontWeight:600 }}>{v}</div>
              </div>
            ))}
          </div>
          {cadena.terneroOtono && <Alerta tipo="error" style={{ marginTop:8 }}>⚠️´©Å Ternero al pie en otoño — destete anticipado URGENTE</Alerta>}
        </div>
      )}
      <div style={{ background:`${C.amber}08`, border:`1px solid ${C.amber}30`, borderRadius:12, padding:14, marginTop:4 }}>
        <div style={{ fontFamily:C.font, fontSize:10, color:C.amber, letterSpacing:1, marginBottom:10 }}>🐄 VAQUILLONA — DATOS PARA SUPLEMENTACIÔN</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <Input label="EDAD AL 1° MAYO (meses)" value={form.edadVaqMayo} onChange={v=>set("edadVaqMayo",v)} placeholder="" type="number" sub="Define GDP necesario" />
          <Input label="PV ACTUAL VAQ1 (kg)" value={form.vaq1PV} onChange={v=>set("vaq1PV",v)} placeholder="" type="number" sub="Si no lo sabés, dejá vacío" />
        </div>

      </div>
    </div>
  );

  // ── PASO 2: CC ────────────────────────────────────────────────
  const renderCC = () => (
    <div>
      {/* Contexto de la medición — tacto pre-parto */}
      <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:12, marginBottom:12 }}>
        <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:6 }}>
          ┬┐CUÁNDO SE HIZO EL TACTO?
        </div>

        {/* ── Selector de escala CC — crítico para la conversión correcta ── */}
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:5 }}>
            ESCALA DE CC QUE USÁS
          </div>
          <div style={{ display:"flex", gap:6 }}>
            {[["9","1 a 9 — INTA / Wagner-Selk (Brangus, Braford, Cebú)"],["5","1 a 5 — Lowman (Hereford, Angus, razas británicas)"]].map(([val,lbl]) => {
              const sel = (form.escalaCC||"9") === val;
              return (
                <button key={val} onClick={() => set("escalaCC", val)}
                  style={{ flex:1, padding:"8px 6px", borderRadius:8, cursor:"pointer", textAlign:"left",
                    fontFamily:C.font, fontSize:9, fontWeight:sel?700:400, lineHeight:1.4,
                    background: sel ? C.green+"15" : "transparent",
                    border:"1px solid "+(sel ? C.green+"60" : C.border),
                    color: sel ? C.green : C.textDim }}>
                  <span style={{ fontSize:13, display:"block", marginBottom:2 }}>
                    {val === "9" ? "1 — 9" : "1 — 5"}
                  </span>
                  {lbl.split("— ")[1]}
                </button>
              );
            })}
          </div>
          {form.escalaCC === "5" && (
            <div style={{ fontFamily:C.font, fontSize:9, color:C.blue, marginTop:6 }}>
              ℹ️ Los valores que ingresás se convierten automáticamente a escala 1-9 para los cálculos.
              Ej: CC 3.0 (1-5) = CC 5.4 (1-9)
            </div>
          )}
        </div>

        <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, lineHeight:1.6, marginBottom:8 }}>
          La CC se mide al tacto, 60–90 días antes del parto. Como la vaca preñada sin ternero al pie no moviliza reservas,
          esta CC <strong style={{color:C.text}}>es prácticamente la CC al parto</strong>.
          Ingresala en escala {form.escalaCC === "5" ? "1–5 (Lowman)" : "1–9 (INTA/Wagner-Selk)"}.
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[["feb","Feb"],["mar","Mar"],["abr","Abr"],["may","May"],["jun","Jun"],["otro","Otro mes"]].map(([val,lbl]) => {
            const sel = (form.mesTacto||"abr") === val;
            // ┬┐Ya pasó el tacto este año? Meses pasados = info confiable
            const mesTactoN = {feb:1,mar:2,abr:3,may:4,jun:5,otro:3}[val];
            const mesHoy = new Date().getMonth();
            const yaFue = mesTactoN <= mesHoy;
            return (
              <button key={val} onClick={() => set("mesTacto", val)} style={{
                padding:"6px 10px", borderRadius:8, cursor:"pointer",
                fontFamily:C.font, fontSize:9, fontWeight:sel?700:400,
                background: sel ? `${C.green}18` : "transparent",
                border:`1px solid ${sel ? C.green : C.border}`,
                color: sel ? C.green : C.textDim,
              }}>{lbl}</button>
            );
          })}
        </div>
        {(() => {
          const mes = form.mesTacto || "abr";
          const mesTactoN = {feb:1,mar:2,abr:3,may:4,jun:5,otro:3}[mes];
          const mesHoy = new Date().getMonth();
          const diasDesde = Math.max(0, (mesHoy - mesTactoN) * 30);
          const bt = getBiotipo(form.biotipo);
          if (diasDesde <= 90) {
            return (
              <div style={{ fontFamily:C.font, fontSize:9, color:C.green, marginTop:6 }}>
                ✓ Tacto en {mes === "otro" ? "otro mes" : mes.charAt(0).toUpperCase()+mes.slice(1)} — CC pre-parto válida como referencia
              </div>
            );
          }
          const caidaEst = (diasDesde/30 * 0.40 * bt.movCC).toFixed(1);
          return (
            <Alerta tipo="warn" style={{marginTop:6}}>
              Han pasado ~{Math.round(diasDesde/30)} meses desde el tacto. Si el rodeo ya parió y está en lactación,
              la CC actual puede ser {caidaEst} unidades menor que la ingresada. Considerá medir nuevamente o ajustar el valor.
            </Alerta>
          );
        })()}
      </div>
      <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:6 }}>CC AL TACTO (pre-parto) — distribución por grupo (escala 1–9 INTA)</div>
      <div style={{ background:C.amber+"10", border:"1px solid "+C.amber+"30", borderRadius:8,
        padding:"8px 12px", marginBottom:10 }}>
        <div style={{ fontFamily:C.font, fontSize:9, color:C.amber }}>
          ⚠️ Los valores son un ejemplo típico NEA — editá con los datos reales del tacto
        </div>
        <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginTop:3 }}>
          CC promedio actual: {ccPondVal > 0
            ? (form.escalaCC === "5"
                ? ccPondVal.toFixed(1) + " (escala 1-9) = " + cc5(ccPondVal) + " (escala 1-5)"
                : ccPondVal.toFixed(1))
            : "—"} · La suma de % debe ser 100
        </div>
      </div>
      <DistCC
        dist={form.distribucionCC}
        escala={form.escalaCC || "9"}
        nVacas={form.vacasN}
        onChange={v => {
          // Si el usuario usa escala 1-5, convertir los valores a 1-9 antes de guardar
          if ((form.escalaCC || "9") === "5") {
            const convertido = v.map(d => ({
              ...d,
              cc: d.cc ? String(Math.min(9, Math.round(parseFloat(d.cc) * 1.8 * 10) / 10)) : d.cc
            }));
            setDist("distribucionCC", convertido);
          } else {
            setDist("distribucionCC", v);
          }
        }}
        label="" />

      {/* ── DESTETE — el productor ya lo tiene definido ── */}
      <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", marginTop:14 }}>
        <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:4 }}>MODALIDAD DE DESTETE</div>
        <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginBottom:10, lineHeight:1.6 }}>
          El tipo de destete define la <strong style={{color:C.text}}>caída de CC</strong> post-parto y el intervalo parto-celo.
          La suma debe ser 100%.
        </div>
        <Slider label="🐄 Tradicional (180d)" value={parseFloat(form.destTrad)||0}  min={0} max={100} step={10} onChange={v=>set("destTrad",v)}  unit="%" color={C.green} />
        <Slider label="🔶 Anticipado (90d)"   value={parseFloat(form.destAntic)||0} min={0} max={100} step={10} onChange={v=>set("destAntic",v)} unit="%" color={C.amber} />
        <Slider label="⚡ Hiperprecoz (50d)"  value={parseFloat(form.destHiper)||0} min={0} max={100} step={10} onChange={v=>set("destHiper",v)} unit="%" color={C.red}   />
        {(parseFloat(form.destTrad)||0)+(parseFloat(form.destAntic)||0)+(parseFloat(form.destHiper)||0) !== 100 && (
          <Alerta tipo="warn">
            Suma: {(parseFloat(form.destTrad)||0)+(parseFloat(form.destAntic)||0)+(parseFloat(form.destHiper)||0)}% — debe ser 100%
          </Alerta>
        )}
        {(parseFloat(form.destHiper)||0) > 30 && (
          <Alerta tipo="warn">Hiperprecoz {">"} 30% — planificar suplementación proteica inmediata post-destete (ternero {"<"} 60 kg).</Alerta>
        )}
      </div>

      {tray && (
        <div style={{ marginTop:14 }}>
          {/* Trayectoria completa CC */}
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1, marginBottom:8 }}>
            TRAYECTORIA CC PROYECTADA
          </div>

          {/* Flecha visual de trayectoria — CC tacto = CC parto */}
          <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 10px", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap", justifyContent:"space-between" }}>
              {[
                { label:"TACTO/PARTO", val:tray.ccParto,   color:smf(parseFloat(tray.ccParto),4.5,5.0) },
                { label:"MÍN. LACT.",  val:tray.ccMinLact, color:smf(parseFloat(tray.ccMinLact),3.5,4.5) },
                { label:"SERVICIO",    val:tray.ccServ,    color:smf(parseFloat(tray.ccServ),4.5,5.0) },
              ].map((item, i, arr) => (
                <React.Fragment key={item.label}>
                  <div style={{ textAlign:"center", minWidth:52 }}>
                    <div style={{ fontFamily:C.font, fontSize:20, fontWeight:700, color:item.color, lineHeight:1 }}>{item.val}</div>
                    <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginTop:2 }}>{item.label}</div>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ color:C.textFaint, fontSize:14, flexShrink:0 }}>→</div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div style={{ marginTop:10, paddingTop:8, borderTop:`1px solid ${C.border}`, display:"flex", gap:6, flexWrap:"wrap" }}>
              <Pill color={smf(tray.pr,35,55)}>🐄 Preñez {tray.pr}%</Pill>
              <Pill color={tray.anestro?.riesgo ? C.red : C.green}>► Anestro {tray.anestro?.dias}d</Pill>
              <Pill color={C.textDim}>­ƒôë Caída lact. →{tray.caidaLact} CC</Pill>
              <Pill color={C.blue}>­ƒì╝ {tray.mesesLact}m lactación</Pill>
            </div>
          </div>

          {/* Cards individuales con contexto */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            <MetricCard label="CC TACTO = CC PARTO"
              value={tray.ccParto}
              color={smf(parseFloat(tray.ccParto),4.5,5.0)}
              sub={parseFloat(tray.ccParto)<4.5?"⚠️ Riesgo anestro prolongado":parseFloat(tray.ccParto)>=5.0?"✓ Ôptimo (escala 1-9)":"Aceptable"} />
            <MetricCard label="CC MÍN. EN LACTACIÔN"
              value={tray.ccMinLact}
              color={smf(parseFloat(tray.ccMinLact),3.5,4.0)}
              sub={`Piso al que cae en lactación (→${tray.caidaLact} CC)`} />
            <MetricCard label="CC AL SERVICIO"
              value={tray.ccServ}
              color={smf(parseFloat(tray.ccServ),4.5,5.0)}
              sub={parseFloat(tray.ccServ)>=5.0?"→ Preñez ≥88%":parseFloat(tray.ccServ)>=4.5?"→ Preñez 80–87%":parseFloat(tray.ccServ)>=4.0?"→ Preñez ~70%":parseFloat(tray.ccServ)>=3.5?"→ Preñez ~50% ⚠️":""+"→ Preñez <30% 🔴"} />
            <MetricCard label="PREÑEZ RODEO (CC PROM.)"
              value={tray.pr+"%"}
              color={smf(tray.pr,35,55)}
              sub={dist?.grupos?.length > 1 ? "CC promedio — preñez real por grupo ↓" : `Anestro posparto: ${tray.anestro?.dias}d`} />
          </div>

          {/* Alerta anestro */}
          <Alerta tipo={tray.anestro?.riesgo?"error":"ok"}>
            Anestro posparto: <strong>{tray.anestro?.dias} días</strong> — {tray.anestro?.riesgo
              ? "⚠️´©Å RIESGO: puede no ciclar durante el servicio → revisar CC al parto y destete"
              : "✅ OK — debería ciclar dentro del período de servicio"}
          </Alerta>

          {/* Por grupos — CC, preñez Y supervivencia */}
          {dist?.grupos?.length >= 1 && (
            <div style={{ marginTop:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1 }}>POR GRUPO DE CC</div>
                
              </div>
              {dist.grupos.map((g, i) => {
                // Sin supervivencia en este panel — solo CC y preñez
                return (
                  <div key={i} style={{ borderRadius:10, marginBottom:8, overflow:"hidden",
                    border:`1px solid ${g.pr<35?"rgba(224,85,48,.25)":g.pr<55?"rgba(232,160,48,.25)":"rgba(126,200,80,.20)"}` }}>
                    {/* Header fila */}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"8px 12px", background:g.pr<35?"rgba(224,85,48,.07)":g.pr<55?"rgba(232,160,48,.06)":"rgba(126,200,80,.05)" }}>
                      <span style={{ fontFamily:C.font, fontSize:11, color:C.text, fontWeight:600 }}>
                        CC {g.ccHoy} · {g.pct}% del rodeo
                      </span>
                      <div style={{ display:"flex", gap:6 }}>
                        <Pill color={smf(parseFloat(g.pr),60,80)}>🐄 {g.pr}% preñez</Pill>
                        <Pill color={smf(parseFloat(g.ccServ),4.0,5.0)}>CC serv. {g.ccServ}</Pill>
                      </div>
                    </div>
                    {/* Trayectoria */}
                    <div style={{ padding:"8px 12px", display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                      {[
                        ["CC PARTO", g.ccParto, 4.5, 5.0, "CC hoy → parto"],
                        ["CC MÍN. LACTACIÔN", g.ccMinLact, 3.5, 4.0, "piso durante la lactación"],
                        ["CC SERVICIO", g.ccServ, 4.5, 5.0, "al entrar al servicio"],
                      ].map(([l,v,b,a,tooltip], idx) => (
                        <React.Fragment key={l}>
                          {idx > 0 && <div style={{ color:C.textFaint, fontSize:12 }}>→</div>}
                          <div style={{ textAlign:"center" }}>
                            <div style={{ fontFamily:C.font, fontSize:14, fontWeight:700, color:smf(parseFloat(v),b,a) }}>{v}</div>
                            <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint, maxWidth:60 }}>{l}</div>
                          </div>
                        </React.Fragment>
                      ))}
                      <div style={{ flex:1, fontFamily:C.font, fontSize:9, color:C.textFaint, textAlign:"right" }}>
                        {g.recDestete}
                      </div>
                    </div>
                    {/* Destete urgente si CC serv < 4.0 */}
                    {parseFloat(g.ccServ) < 4.0 && (
                      <div style={{ padding:"6px 12px", background:"rgba(224,85,48,.08)", borderTop:"1px solid rgba(224,85,48,.20)" }}>
                        <span style={{ fontFamily:C.sans, fontSize:11, color:C.red }}>
                          CC serv. {g.ccServ} &lt; 4.0 mínimo — preñez comprometida · {g.recDestete}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {ccPondVal > 0 && !tray && (
        <Alerta tipo="info" style={{ marginTop:10 }}>
          Ingresá fechas de servicio (Paso Rodeo) para ver la proyección completa de CC.
        </Alerta>
      )}
    </div>
  );

  // ── PASO 3: CATEGORÍAS ────────────────────────────────────────
  const renderCategorias = () => (
    <div>

      {tcSave && (
        <div style={{ background:C.card2, borderRadius:12, padding:12, border:`1px solid ${C.border}`, marginBottom:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <MetricCard label="TERNEROS DESTETADOS" value={tcSave.terneros}    color={C.green} />
            <MetricCard label="PV POND. MAYO (kg)"  value={tcSave.pvMayoPond} color={C.amber} sub="Entrada 1°inv" />
          </div>
          {tcSave.alertaHiper && <Alerta tipo="warn" style={{ marginTop:10 }}>Hiperprecoz {">"} 30% — suplementación proteica inmediata post-destete.</Alerta>}
          {/* Info GDP */}
          <div style={{ marginTop:8, padding:"6px 10px", borderRadius:8, background:`${C.blue}08`, border:`1px solid ${C.blue}18` }}>
            <div style={{ fontFamily:C.font, fontSize:9, color:C.blue, marginBottom:2 }}>BASE DE CÁLCULO · NRC 2000 + INTA Colonia Benítez</div>
            <div style={{ fontFamily:C.sans, fontSize:10, color:C.textDim }}>
              Nacimiento: 35 kg · Al pie: 700 g/d · Post-destete campo: 400 g/d hasta mayo
            </div>
          </div>
          {tcSave.detalle?.map((d, i) => d.pct > 0 ? (
            <div key={i} style={{ marginTop:6, borderTop:`1px solid ${C.border}`, paddingTop:6 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontFamily:C.font, fontSize:11 }}>
                <span style={{ color:C.textDim }}>{d.label} ({Math.round(d.pct*100)}%)</span>
                <span style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ color:C.amber, fontSize:10 }}>dest: {d.pvDest}kg</span>
                  <span style={{ color:C.textFaint, fontSize:9 }}>→</span>
                  <span style={{ color:C.green, fontWeight:700 }}>mayo: {d.pvMayo}kg</span>
                </span>
              </div>
            </div>
          ) : null)}
        </div>
      )}

      {/* Vaquillona 1° invierno */}
      <details open style={{ marginBottom:10 }}>
        <summary style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", cursor:"pointer", listStyle:"none", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:C.font, fontSize:11, color:C.green, fontWeight:600 }}>🐄 VAQ. 1° INVIERNO · {nVaqRepos} vaquillas</span>
        </summary>
        <div style={{ background:C.card2, borderRadius:"0 0 12px 12px", padding:14, border:`1px solid ${C.border}`, borderTop:"none" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <Input label="% REPOSICIÔN" value={form.pctReposicion} onChange={v=>set("pctReposicion",v)} placeholder="" type="number" />
            <MetricCard label="VAQUILLAS" value={nVaqRepos} color={C.green} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <Input label="PV ACTUAL VAQ1 (kg)"
              value={form.vaq1PV} onChange={v=>set("vaq1PV",v)} placeholder="" type="number"
              sub="Peso real hoy — calibra GDP necesaria" />
            <Input label="EDAD AL 1° MAYO (meses)"
              value={form.edadVaqMayo} onChange={v=>set("edadVaqMayo",v)} placeholder="" type="number"
              sub="Define objetivo de entore" />
          </div>
          {tcSave?.pvMayoPond > 0 ? (
            <div style={{ background:C.green+"08", border:"1px solid "+C.green+"25", borderRadius:10, padding:10, marginBottom:10 }}>
              <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, marginBottom:3 }}>PV entrada mayo 1°inv — calculado del destete</div>
              <div style={{ fontFamily:C.font, fontSize:22, color:C.green, fontWeight:700 }}>{tcSave.pvMayoPond} kg</div>
            </div>
          ) : vaq1E?.pvEntrada > 0 ? (
            <div style={{ background:(vaq1E.pvFuenteDato==="real" ? C.green : C.amber)+"08",
              border:"1px solid "+(vaq1E.pvFuenteDato==="real" ? C.green : C.amber)+"25",
              borderRadius:10, padding:10, marginBottom:10 }}>
              <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, marginBottom:3 }}>
                PV mayo 1°inv — {vaq1E.pvFuenteDato === "real" ? "dato real" : vaq1E.pvFuenteDato === "estimado_por_edad" ? "estimado por edad" : "estimado (40% PV adulto)"}
              </div>
              <div style={{ fontFamily:C.font, fontSize:22,
                color:vaq1E.pvFuenteDato==="real" ? C.green : C.amber, fontWeight:700 }}>
                {vaq1E.pvEntrada} kg
              </div>
              {vaq1E.pvFuenteDato !== "real" && (
                <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginTop:3 }}>
                  ↑ Ingresá el PV real en el campo "PV ACTUAL VAQ1" para mayor precisión
                </div>
              )}
            </div>
          ) : null}
          {vaq1E && vaq1E.mensaje && <Alerta tipo="ok">{vaq1E.mensaje}</Alerta>}
          {vaq1E && vaq1E.alertaSinSupl && <Alerta tipo="error">{vaq1E.alertaSinSupl}</Alerta>}
          {vaq1E && !vaq1E.sinSupl && vaq1E.alertaSinSupl === null && vaq1E.mcalSuplReal > 0 && (parseFloat(vaq1E.gdpConSuplReal) < 400) && (
            <Alerta tipo="warn">Suplemento cargado pero GDP estimado {Math.round(vaq1E.gdpConSuplReal)}g/d — insuficiente para el objetivo de recría.</Alerta>
          )}
          {vaq1E && !vaq1E.mensaje && (
            <div style={{ padding:"10px 12px", background:`${C.card}`, border:`1px solid ${C.border}`, borderRadius:8, marginBottom:8 }}>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:6 }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:C.font, fontSize:18, fontWeight:700, color:C.amber, lineHeight:1 }}>
                    {vaq1E.gdpPasto} g/d
                  </div>
                  <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginTop:2 }}>GDP solo pasto</div>
                </div>
                <div style={{ color:C.textFaint, fontSize:14, alignSelf:"center" }}>→</div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:C.font, fontSize:18, fontWeight:700, color:C.green, lineHeight:1 }}>
                    {vaq1E.gdpReal} g/d
                  </div>
                  <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginTop:2 }}>GDP con suplemento*</div>
                </div>
                <div style={{ color:C.textFaint, fontSize:14, alignSelf:"center" }}>→</div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:C.font, fontSize:18, fontWeight:700, color:vaq1E.pvSal>=220?C.green:C.amber, lineHeight:1 }}>
                    {vaq1E.pvSal} kg
                  </div>
                  <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginTop:2 }}>PV agosto est.</div>
                </div>
              </div>
              <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, borderTop:`1px solid ${C.border}`, paddingTop:4 }}>
                * GDP con suplemento = estimación al cargar suplemento en el paso siguiente.
                Sin suplementar, el pasto C4 en invierno da {vaq1E.gdpPasto} g/día — el objetivo de recría no se cumple con pasto solo.
              </div>
            </div>
          )}
          {vaq1E && !vaq1E.mensaje && (() => {
            const pvAdulta = parseFloat(form.pvVacaAdulta)||320;
            const pvAgosto = vaq1E.pvSal || 0;
            const obj220   = 220;
            const pct65    = Math.round(pvAdulta * 0.65);
            const llegaObj = pvAgosto >= obj220;
            const llegaPct65 = pvAgosto >= pct65;
            return (
              <div style={{ marginTop:8, padding:"10px 12px", borderRadius:8, background:`${C.blue}08`, border:`1px solid ${C.blue}20` }}>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.blue, marginBottom:4 }}>OBJETIVO AGOSTO</div>
                <div style={{ fontFamily:C.sans, fontSize:11, color:C.textDim, marginBottom:6 }}>
                  PV objetivo: <strong style={{color:C.text}}>≥ {obj220} kg</strong>
                  {llegaObj
                    ? <span style={{color:C.green}}> ✓ Proyectado {pvAgosto} kg</span>
                    : <span style={{color:C.amber}}> ⚠️ Proyectado {pvAgosto} kg — ajustar suplementación</span>}
                </div>
                {llegaPct65 && (
                  <div style={{ padding:"6px 10px", borderRadius:6, background:`${C.green}12`, border:`1px solid ${C.green}30` }}>
                    <div style={{ fontFamily:C.font, fontSize:9, color:C.green, fontWeight:700, marginBottom:2 }}>✅ APTA ENTORE ANTICIPADO</div>
                    <div style={{ fontFamily:C.sans, fontSize:10, color:C.textDim }}>
                      {pvAgosto} kg en agosto = {Math.round(pvAgosto/(parseFloat(form.pvVacaAdulta)||320)*100)}% PV adulto. Evaluá entore anticipado en agosto–septiembre.
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </details>

      {/* Panel unificado Vaq2 — trayectoria y datos de entrada */}
      {(vaq2E || pvEntradaVaq2) && (
        <details open style={{ marginBottom:10 }}>
          <summary style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", cursor:"pointer", listStyle:"none", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:C.font, fontSize:11, color:C.blue, fontWeight:600 }}>
              🐂 VAQ. 2° INVIERNO · {form.vaq2N?`${form.vaq2N} cab.`:"Ingresar cantidad"}
            </span>
            {vaq2E && (
              <span style={{ marginLeft:"auto", fontFamily:C.font, fontSize:9, color:vaq2E.llegas?C.green:C.red }}>
                {vaq2E.llegas?"✓ Llega al entore":"⚠️ No llega al objetivo"}
              </span>
            )}
          </summary>
          <div style={{ background:C.card2, borderRadius:"0 0 12px 12px", padding:14, border:`1px solid ${C.border}`, borderTop:"none" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <Input label="CANTIDAD" value={form.vaq2N} onChange={v=>set("vaq2N",v)} placeholder="" type="number" />
              <Input label="PV ACTUAL VAQ2 (kg)" value={form.vaq2PV} onChange={v=>set("vaq2PV",v)} placeholder="" type="number"
                sub="Peso real hoy" />
            </div>
            {vaq2E?.alertaSinSupl && <Alerta tipo="error">{vaq2E.alertaSinSupl}</Alerta>}
            {vaq2E && (
              <div>
                {/* Trayectoria sin suplemento vs con suplemento */}
                <div style={{ background:`${C.card}`, border:`1px solid ${C.border}`, borderRadius:10, padding:12, marginBottom:10 }}>
                  <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1, marginBottom:10 }}>TRAYECTORIA PV — INVIERNO 2°</div>
                  {/* Sin suplemento */}
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontFamily:C.font, fontSize:8, color:C.red, marginBottom:4 }}>SIN SUPLEMENTO</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontFamily:C.font, fontSize:14, fontWeight:700, color:C.text }}>{pvEntradaVaq2||"—"} kg</div>
                        <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>mayo</div>
                      </div>
                      <div style={{ color:C.red, fontSize:10 }}>→ {vaq2E.gdpPastoInv||0}g/d →</div>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontFamily:C.font, fontSize:14, fontWeight:700, color:C.red }}>
                          {Math.round((parseFloat(pvEntradaVaq2)||0) + (vaq2E.gdpPastoInv||0) * 90 / 1000)} kg
                        </div>
                        <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>agosto</div>
                      </div>
                      <div style={{ color:C.textFaint, fontSize:10 }}>→ {vaq2E.gdpPrimavera||280}g/d →</div>
                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontFamily:C.font, fontSize:14, fontWeight:700, color:vaq2E.llegas?C.green:C.red }}>
                          {Math.round((parseFloat(pvEntradaVaq2)||0) + (vaq2E.gdpPastoInv||0)*90/1000 + (vaq2E.gdpPrimavera||280)*60/1000)} kg
                        </div>
                        <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>entore nov</div>
                      </div>
                      <div style={{ fontFamily:C.font, fontSize:8, color:C.red, marginLeft:"auto" }}>
                        obj: {vaq2E.pvMinEntore} kg
                      </div>
                    </div>
                  </div>
                  {/* Con suplemento — solo si tiene suplemento cargado */}
                  {!vaq2E.sinSupl && (
                    <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:10 }}>
                      <div style={{ fontFamily:C.font, fontSize:8, color:C.green, marginBottom:4 }}>CON SUPLEMENTO CARGADO</div>
                      <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontFamily:C.font, fontSize:14, fontWeight:700, color:C.text }}>{pvEntradaVaq2||"—"} kg</div>
                          <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>mayo</div>
                        </div>
                        <div style={{ color:C.green, fontSize:10 }}>→ {Math.round(vaq2E.gdpInv||0)}g/d →</div>
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontFamily:C.font, fontSize:14, fontWeight:700, color:C.green }}>{vaq2E.pvV2Agosto||"—"} kg</div>
                          <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>agosto</div>
                        </div>
                        <div style={{ color:C.textFaint, fontSize:10 }}>→ {vaq2E.gdpPrimavera||280}g/d →</div>
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontFamily:C.font, fontSize:14, fontWeight:700, color:vaq2E.llegas?C.green:C.red }}>{vaq2E.pvEntore||"—"} kg</div>
                          <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>entore nov</div>
                        </div>
                        <div style={{ fontFamily:C.font, fontSize:8, color:vaq2E.llegas?C.green:C.amber, marginLeft:"auto" }}>
                          {vaq2E.llegas ? "✅ llega" : `⚠️ falta ${(vaq2E.pvMinEntore||0)-(vaq2E.pvEntore||0)} kg`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {!vaq2E.llegas && !vaq2E.sinSupl && (
                  <Alerta tipo="error">No llega a {vaq2E.pvMinEntore} kg — ajustá la dosis de suplemento</Alerta>
                )}
                {vaq2E.llegas && (
                  <div style={{ padding:"6px 10px", background:`${C.green}10`, borderRadius:8, fontFamily:C.font, fontSize:9, color:C.green }}>
                    ✅ Con esta suplementación llega al entore a los {form.edadPrimerEntore||24} meses
                  </div>
                )}
                {/* Entore anticipado — si supera 65% PV adulto en agosto */}
                {vaq2E.aptaEntoreAntic && (
                  <div style={{ marginTop:8, padding:"10px 12px", background:"rgba(126,200,80,.08)",
                    border:"1px solid rgba(126,200,80,.30)", borderRadius:10 }}>
                    <div style={{ fontFamily:C.font, fontSize:9, color:C.green, fontWeight:700, marginBottom:4 }}>
                      🚀 OPORTUNIDAD: ENTORE ANTICIPADO POSIBLE
                    </div>
                    <div style={{ fontFamily:C.sans, fontSize:10, color:C.textDim, lineHeight:1.5, marginBottom:6 }}>
                      En agosto proyecta <strong style={{color:C.green}}>{vaq2E.pvV2Agosto} kg</strong> ({vaq2E.pctPVAgosto}% PV adulto) — supera el umbral del 65% ({vaq2E.pvMinEntoreAntic} kg) necesario para ciclar y quedar preñada ese mismo año.
                    </div>
                    <div style={{ fontFamily:C.sans, fontSize:10, color:C.text, lineHeight:1.5, marginBottom:4 }}>
                      <strong>Recomendación:</strong> integrarlas al servicio general de <strong>agosto–noviembre</strong> de este año en lugar de esperar al ciclo del año siguiente. Ganás <strong>un ciclo productivo completo</strong> — una ternera más sin aumentar la carga animal.
                    </div>
                    <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>
                      Bavera 2005 · umbral ciclicidad: ≥65% PV adulto al servicio
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </details>
      )}

      {/* Vacas 2° servicio */}
      <details style={{ marginBottom:10 }}>
        <summary style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", cursor:"pointer", listStyle:"none", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:C.font, fontSize:11, color:C.amber, fontWeight:600 }}>
            🔄 VACAS 2° SERVICIO · {form.v2sN ? `${form.v2sN} cab.` : "Ingresar cantidad"}
          </span>
          {form.v2sN && (
            <span style={{ marginLeft:"auto", fontFamily:C.font, fontSize:9,
              color: (() => {
                const ccV2sPondUI = form.cc2sDist?.length
                  ? (form.cc2sDist.reduce((s,g)=>s+(parseFloat(g.cc)||0)*(parseFloat(g.pct)||0),0) /
                     Math.max(1, form.cc2sDist.reduce((s,g)=>s+(parseFloat(g.pct)||0),0)))
                  : 4.2;
                const r = calcV2S(form.v2sPV, form.pvVacaAdulta, ccV2sPondUI.toFixed(1), form.v2sTernero === "si", form.biotipo, cadena);
                return r?.critico ? C.red : C.amber;
              })()
            }}>
              {form.v2sTernero === "si" ? "⚠️ Con ternero al pie" : "Sin ternero"}
            </span>
          )}
        </summary>
        <div style={{ background:C.card2, borderRadius:"0 0 12px 12px", padding:14, border:`1px solid ${C.border}`, borderTop:"none" }}>

          {/* Banner categoría crítica */}
          <div style={{ background:"rgba(232,160,48,.06)", border:"1px solid rgba(232,160,48,.25)", borderRadius:10, padding:"10px 12px", marginBottom:14 }}>
            <div style={{ fontFamily:C.font, fontSize:9, color:C.amber, letterSpacing:1, marginBottom:4 }}>⚠️ CATEGORÍA DE MAYOR RIESGO DEL RODEO</div>
            <div style={{ fontFamily:C.sans, fontSize:11, color:C.textDim, lineHeight:1.5 }}>
              Las V2S tienen el triple estrés fisiológico más exigente: <strong style={{color:C.text}}>están creciendo</strong> (2°–3° año, aún no llegaron al PV adulto), 
              <strong style={{color:C.text}}> amamantando</strong> (bloqueo LH activo si tienen ternero) 
              y deben <strong style={{color:C.text}}>quedar preñadas</strong> nuevamente. 
              Sus requerimientos energéticos superan a las vacas adultas en un 10–15% (NRC 2000).
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            <Input label="CANTIDAD (cab)" value={form.v2sN}  onChange={v=>set("v2sN",v)}  placeholder="" type="number" />
            <Input label="PV ACTUAL (kg)" value={form.v2sPV} onChange={v=>set("v2sPV",v)} placeholder="" type="number"
              sub={form.pvVacaAdulta ? `PV adulta: ${form.pvVacaAdulta}kg · V2S típicamente 85-92% del adulto` : ""} />
          </div>

          {/* Distribución CC de las V2S — 2 grupos */}
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1, marginBottom:8 }}>
            DISTRIBUCIÔN CC VACAS 2° SERVICIO (por grupo)
          </div>
          {(form.cc2sDist || [{ cc:"5.0", pct:"50" }, { cc:"4.5", pct:"50" }]).map((g, i) => (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:8, marginBottom:8, alignItems:"end" }}>
              <Input label={`CC GRUPO ${i+1}`} value={g.cc}
                onChange={v => { const d=[...(form.cc2sDist||[{cc:"5.0",pct:"50"},{cc:"4.5",pct:"50"}])]; d[i]={...d[i],cc:v}; set("cc2sDist",d); }}
                placeholder="4.5" type="number" />
              <Input label="% del grupo" value={g.pct}
                onChange={v => { const d=[...(form.cc2sDist||[{cc:"5.0",pct:"50"},{cc:"4.5",pct:"50"}])]; d[i]={...d[i],pct:v}; set("cc2sDist",d); }}
                placeholder="50" type="number" />
              <div style={{ fontFamily:C.font, fontSize:11, color:C.textDim, paddingBottom:10 }}>%</div>
            </div>
          ))}
          {(() => {
            const d = form.cc2sDist || [];
            const total = d.reduce((s,g) => s + (parseFloat(g.pct)||0), 0);
            if (total !== 100 && d.length > 0) return <Alerta tipo="warn">Suma: {total}% (debe ser 100%)</Alerta>;
            return null;
          })()}

          <Toggle
            label="┬┐Tienen ternero al pie durante el 2° servicio?"
            value={form.v2sTernero === "si"}
            onChange={v => set("v2sTernero", v ? "si" : "no")}
          />
          {form.v2sTernero === "si" && (
            <Alerta tipo="warn">Ternero al pie: bloqueo LH activo · Anestro +10–20 días extra · Evaluar destete anticipado o hiperprecoz urgente</Alerta>
          )}

          {/* Diagnóstico real por grupo usando calcV2S */}
          {form.v2sN && form.v2sPV && (
            <div style={{ marginTop:12 }}>
              {(form.cc2sDist || [{cc:"4.5",pct:"100"}]).filter(g => parseFloat(g.cc) && parseFloat(g.pct) > 0).map((g, i) => {
                const r = calcV2S(form.v2sPV, form.pvVacaAdulta, g.cc, form.v2sTernero === "si", form.biotipo, cadena);
                if (!r) return null;
                const nG = Math.round((parseInt(form.v2sN)||0) * (parseFloat(g.pct)||0) / 100);
                // Calcular déficit con pasto actual
                const cons   = calcConsumoPasto(form.v2sPV, form.fenologia || "menor_10", sat?.temp || 25);
                const oferta = cons?.emTotal || 0;
                const deficit = Math.max(0, (r.reqMcal || 0) - oferta);
                return (
                  <div key={i} style={{ background:r.critico ? "rgba(224,85,48,.06)" : "rgba(232,160,48,.06)",
                    border:`1px solid ${r.critico ? "rgba(224,85,48,.25)" : "rgba(232,160,48,.20)"}`,
                    borderRadius:10, padding:12, marginBottom:10 }}>
                    <div style={{ fontFamily:C.font, fontSize:10, color:r.critico ? C.red : C.amber, marginBottom:8, display:"flex", justifyContent:"space-between" }}>
                      <span>GRUPO {i+1} · CC {g.cc} · {nG} vac. ({g.pct}%)</span>
                      {r.critico && <span style={{ background:"rgba(224,85,48,.15)", padding:"2px 8px", borderRadius:6, fontSize:9 }}>🔴 CRÍTICO</span>}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:10 }}>
                      <MetricCard label="CC PARTO"
                        value={r.ccParto}
                        color={r.ccParto >= 4.5 ? C.green : r.ccParto >= 4.0 ? C.amber : C.red}
                        sub={r.ccParto < 4.5 ? "⚠️ Riesgo" : "OK"} />
                      <MetricCard label="CC SERVICIO"
                        value={r.ccServ}
                        color={r.ccServ >= 5.0 ? C.green : r.ccServ >= 4.5 ? C.amber : C.red} />
                      <MetricCard label="PREÑEZ"
                        value={r.prenez + "%"}
                        color={r.prenez >= 55 ? C.green : r.prenez >= 35 ? C.amber : C.red} />
                      <MetricCard label="ANESTRO"
                        value={r.diasAnestro + "d"}
                        color={r.diasAnestro <= 55 ? C.green : r.diasAnestro <= 75 ? C.amber : C.red} />
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:8 }}>
                      <MetricCard label="REQ. ENERGÉTICO"
                        value={(r.reqMcal || "—") + " Mcal/d"}
                        color={C.amber}
                        sub="NRC 2000 — triple estrés" />
                      <MetricCard label={deficit > 0 ? "DÉFICIT PASTO HOY" : "PASTO HOY"}
                        value={deficit > 0 ? "→"+deficit.toFixed(1)+" Mcal" : "Cubre req."}
                        color={deficit > 0 ? C.red : r.prenez < 55 ? C.amber : C.green}
                        sub={deficit > 0 ? `Oferta: ${oferta.toFixed(1)} Mcal · req: ${(r.reqMcal||0).toFixed(1)}` : r.prenez < 55 ? "Pasto OK · CC baja el riesgo" : "Sin déficit energético"} />
                    </div>
                    {/* Recomendaciones específicas por grupo */}
                    {r.critico && (
                      <div style={{ marginTop:6 }}>
                        {r.ccParto < 4.5 && (
                          <Alerta tipo="error">CC parto {r.ccParto} — preñez proyectada {r.prenez}%. Suplementar en preparto: 0.5–0.8 kg expeller soja/día + destete inmediato si tiene ternero.</Alerta>
                        )}
                        {r.diasAnestro > 70 && form.v2sTernero === "si" && (
                          <Alerta tipo="error">Anestro proyectado {r.diasAnestro}d con ternero al pie — NO va a llegar al servicio. Destete hiperprecoz urgente: recupera ciclos en 7–14 días (Wiltbank 1990).</Alerta>
                        )}
                        {deficit > 3 && (
                          <Alerta tipo="error">Déficit de {deficit.toFixed(1)} Mcal/día — para cubrirlo: {(deficit/2.6).toFixed(1)} kg expeller girasol o {(deficit/3.3).toFixed(1)} kg maíz/vaca/día.</Alerta>
                        )}
                      </div>
                    )}
                    {!r.critico && (
                      <Alerta tipo="ok">CC y anestro en rango aceptable para este grupo. Monitorear suplementación y destete según momento del servicio.</Alerta>
                    )}
                  </div>
                );
              })}

              {/* Resumen total V2S */}
              {(() => {
                const grupos = (form.cc2sDist || []).filter(g => parseFloat(g.cc) && parseFloat(g.pct) > 0);
                if (grupos.length === 0) return null;
                const prenezPond = grupos.reduce((s, g) => {
                  const r = calcV2S(form.v2sPV, form.pvVacaAdulta, g.cc, form.v2sTernero === "si", form.biotipo, cadena);
                  return s + (r?.prenez || 0) * (parseFloat(g.pct) / 100);
                }, 0);
                const color = prenezPond >= 55 ? C.green : prenezPond >= 35 ? C.amber : C.red;
                return (
                  <div style={{ background:`${color}10`, border:`1px solid ${color}30`, borderRadius:10, padding:"10px 14px" }}>
                    <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, marginBottom:4 }}>PREÑEZ PONDERADA V2S</div>
                    <div style={{ fontFamily:C.font, fontSize:24, fontWeight:700, color }}>
                      {Math.round(prenezPond)}%
                      <span style={{ fontSize:11, color:C.textDim, marginLeft:8, fontWeight:400 }}>
                        {parseInt(form.v2sN)||0} vacas · {Math.round((parseInt(form.v2sN)||0) * prenezPond / 100)} preñadas esperadas
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {!form.v2sN && (
            <div style={{ textAlign:"center", padding:"16px 0", fontFamily:C.fontSans, fontSize:11, color:C.textFaint }}>
              Ingresá la cantidad de V2S para ver el diagnóstico completo
            </div>
          )}
        </div>
      </details>
    </div>
  );

  // ── PASO 4: FORRAJE ───────────────────────────────────────────
  const renderForraje = () => {
    // Tipos de recurso forrajero con sus propiedades
    const RECURSOS = {
      "Pastizal natural":                 { cat:"pastizal", label:"Pastizal natural",        emoji:"🌿", fenologia:true,  altura:true,  pb:14, desc:"Calidad variable por fenología · estimación por altura" },
      "Megatérmicas C4": { cat:"c4",       label:"Megatérmicas C4",emoji:"🌱", fenologia:true,  altura:false, pb:22, desc:"Alta producción en verano · baja en invierno · fenología aplica" },
      "Pasturas templadas C3":                      { cat:"c3",       label:"Pasturas templadas C3",             emoji:"🌾", fenologia:false, altura:false, pb:16, desc:"Producción más estable · sin fenología estacional marcada" },
      "Mixta gramíneas+leguminosas":                { cat:"mixta",    label:"Mixta gramíneas + leguminosas",     emoji:"🌱", fenologia:false, altura:false, pb:18, desc:"PB alta por leguminosas · buena calidad todo el año" },
      "Bosque nativo / monte":                      { cat:"monte",    label:"Bosque nativo / monte",             emoji:"🌳", fenologia:false, altura:false, pb:2.5, desc:"Baja oferta · valor en sombra y refugio · no suplementa" },
      "Verdeo de invierno":                         { cat:"verdeo",   label:"Verdeo de invierno",                emoji:"🌾", fenologia:false, altura:false, pb:20, desc:"Avena / Raigrás / Melilotus · PB alta · no requiere supl proteica" },
    };

    const haPot   = potreros.reduce((s,p)=>s+(parseFloat(p.ha)||0), 0);
    const haTotal = parseFloat(form.supHa) || haPot || 0;
    const cargaEV = haTotal > 0 ? ((parseInt(form.vacasN)||0) / haTotal).toFixed(2) : "—";
    const colorCarga = parseFloat(cargaEV) > 1.2 ? C.red : parseFloat(cargaEV) > 0.8 ? C.amber : C.green;

    return (
      <div>
        {/* ── Superficie total y carga ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          <Input label="SUPERFICIE GANADERA TOTAL (ha)" value={form.supHa} onChange={v=>set("supHa",v)} placeholder="" type="number" sub="Superficie efectivamente pastoreada" />
          <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 14px" }}>
            <div style={{ fontFamily:C.font, fontSize:8, color:C.textDim, letterSpacing:1, marginBottom:4 }}>CARGA EV/HA</div>
            <div style={{ fontFamily:C.font, fontSize:22, fontWeight:700, color:colorCarga }}>{cargaEV}</div>
            <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>
              {parseFloat(cargaEV)>1.2?"⚠️ Sobrecarga":parseFloat(cargaEV)>0.8?"Carga media":"✓ Carga adecuada"}
            </div>
          </div>
        </div>

        {/* ── Potreros ── */}
        <div style={{ fontFamily:C.font, fontSize:9, color:C.green, letterSpacing:1, marginBottom:10 }}>
          🗺´©Å POTREROS — cargá cada potrero o lote
        </div>

        {potreros.map((p, i) => {
          const rec = RECURSOS[p.veg] || RECURSOS["Pastizal natural"];
          const esPastizal = rec.cat === "pastizal";
          const esC4oPatizal = rec.cat === "c4" || rec.cat === "pastizal";
          const disp = esPastizal && p.altPasto ? calcDisponibilidadMS(p.altPasto, p.tipoPasto||"corto_denso") : null;

          return (
            <div key={i} style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <span style={{ fontFamily:C.font, fontSize:12, color:C.green, fontWeight:600 }}>Potrero {i+1}</span>
                {potreros.length > 1 && (
                  <button onClick={()=>setPotreros(ps=>ps.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontFamily:C.font, fontSize:12 }}>✕</button>
                )}
              </div>

              {/* Hectáreas */}
              <Input label="HECTÁREAS" value={p.ha} onChange={v=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],ha:v};return n;})} placeholder="100" type="number" />

              {/* Tipo de recurso */}
              <div style={{ marginBottom:10 }}>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1, marginBottom:6 }}>TIPO DE RECURSO FORRAJERO</div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {Object.entries(RECURSOS).map(([key, r]) => (
                    <button key={key} onClick={()=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],veg:key};return n;})}
                      style={{
                        padding:"8px 12px", borderRadius:8, cursor:"pointer", textAlign:"left",
                        background: p.veg===key ? `${C.green}15` : "transparent",
                        border:`1px solid ${p.veg===key ? C.green : C.border}`,
                        display:"flex", alignItems:"center", gap:8
                      }}>
                      <span style={{ fontSize:16 }}>{r.emoji}</span>
                      <div>
                        <div style={{ fontFamily:C.font, fontSize:10, color:p.veg===key?C.green:C.text, fontWeight:p.veg===key?700:400 }}>{r.label}</div>
                        <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>{r.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fenología — solo C4 y pastizal */}
              {esC4oPatizal && (
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1, marginBottom:6 }}>FENOLOGÍA ACTUAL</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                    {FENOLOGIAS.map(f => (
                      <button key={f.val} onClick={()=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],fenol:f.val};return n;})}
                        style={{
                          padding:"8px", borderRadius:8, cursor:"pointer", textAlign:"left",
                          background: p.fenol===f.val ? `${C.green}15` : "transparent",
                          border:`1px solid ${p.fenol===f.val ? C.green : C.border}`,
                        }}>
                        <div style={{ fontSize:14, marginBottom:2 }}>{f.emoji}</div>
                        <div style={{ fontFamily:C.font, fontSize:9, color:p.fenol===f.val?C.green:C.text, fontWeight:600 }}>{f.label}</div>
                        {f.warn && <div style={{ fontFamily:C.font, fontSize:8, color:C.amber }}>{f.warn}</div>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Altura y tipo de pasto — solo pastizal */}
              {esPastizal && (
                <div style={{ marginBottom:8 }}>
                  <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1, marginBottom:6 }}>📏 DISPONIBILIDAD (método INTA — altura × tipo)</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                    <Input label="ALTURA PASTO (cm)" value={p.altPasto||""} onChange={v=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],altPasto:v};return n;})} placeholder="20" type="number" sub="Promedio caminando el potrero" />
                    <div>
                      <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1, marginBottom:5 }}>TIPO DE PASTO</div>
                      <select value={p.tipoPasto||"corto_denso"} onChange={e=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],tipoPasto:e.target.value};return n;})}
                        style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, padding:"10px", fontFamily:C.sans, fontSize:12 }}>
                        <option value="corto_denso">Cortos densos (pasto horqueta, grama)</option>
                        <option value="alto_ralo">Altos ralos (Paspalum, Elionorus)</option>
                        <option value="alto_denso">Altos densos (paja colorada, paja amarilla)</option>
                      </select>
                    </div>
                  </div>
                  {disp && (
                    <div style={{ padding:"8px 10px", borderRadius:8, background:`${disp.nivel==="baja"?C.red:disp.nivel==="media"?C.amber:C.green}10`, border:`1px solid ${disp.nivel==="baja"?C.red:disp.nivel==="media"?C.amber:C.green}30` }}>
                      <div style={{ fontFamily:C.font, fontSize:10, fontWeight:700, color:disp.nivel==="baja"?C.red:disp.nivel==="media"?C.amber:C.green }}>
                        {disp.msHa} kgMS/ha · {disp.nivel.toUpperCase()}
                      </div>
                      <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>Rango: {disp.rango[0]}–{disp.rango[1]} kgMS/ha</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button onClick={()=>setPotreros(ps=>[...ps,{ha:"",veg:"Pastizal natural",fenol:"menor_10",altPasto:"",tipoPasto:"corto_denso"}])}
          style={{ width:"100%", background:`${C.green}06`, border:`1px solid ${C.border}`, borderRadius:10, color:C.green, padding:12, fontFamily:C.sans, fontSize:12, cursor:"pointer", marginBottom:14 }}>
          + Agregar potrero
        </button>

        {/* ── Resumen total ── */}
        {haPot > 0 && (
          <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:12, marginBottom:12 }}>
            <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, letterSpacing:1, marginBottom:6 }}>RESUMEN</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <MetricCard label="HA CARGADAS" value={haPot+" ha"} color={C.green} />
              <MetricCard label="CARGA EV/HA" value={cargaEV} color={colorCarga} />
            </div>
            {potreros.map((p,i) => p.ha ? (
              <div key={i} style={{ fontFamily:C.font, fontSize:9, color:C.textDim, marginTop:4 }}>
                Potrero {i+1}: {p.ha} ha · {(RECURSOS[p.veg]||{}).label||p.veg}
                {p.altPasto && ` · ${p.altPasto}cm altura`}
              </div>
            ) : null)}
          </div>
        )}

        {/* ── Verdeos de invierno ── */}
        <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontFamily:C.font, fontSize:9, color:C.green, letterSpacing:1 }}>🌾 VERDEOS DE INVIERNO</div>
            <div style={{ display:"flex", gap:6 }}>
              {[["no","No tengo"],["si","Tengo"]].map(([v,l]) => (
                <button key={v} onClick={()=>set("tieneVerdeo",v)} style={{
                  padding:"4px 12px", borderRadius:16, cursor:"pointer", fontFamily:C.font, fontSize:9,
                  background: form.tieneVerdeo===v ? `${C.green}20` : "transparent",
                  border:`1px solid ${form.tieneVerdeo===v ? C.green : C.border}`,
                  color: form.tieneVerdeo===v ? C.green : C.textFaint,
                }}>{l}</button>
              ))}
            </div>
          </div>
          {form.tieneVerdeo === "si" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                <Input label="SUPERFICIE (ha)" value={form.verdeoHa||""} onChange={v=>set("verdeoHa",v)} placeholder="50" type="number" />
                <SelectF label="TIPO" value={form.verdeoTipo||"Avena / Raigrás / Melilotus"} onChange={v=>set("verdeoTipo",v)} options={[
                  ["Avena / Raigrás / Melilotus","Avena · Raigrás · Melilotus (invierno clásico)"],
                  ["Melilotus","Melilotus (leguminosa — PB 22% — NEA)"],
                  ["Raigrás anual","Raigrás anual"],
                  ["Triticale","Triticale"],
                  ["Gramínea + leguminosa","Gramínea + leguminosa consociada"],
                ]} />
              </div>
              <SelectF label="DESTINADO PARA" value={form.verdeoDestinoVaq||"si"} onChange={v=>set("verdeoDestinoVaq",v)} options={[
                ["si","Vaquillona 1° inv. (prioridad)"],["v2s","Vaca 2° servicio"],
                ["todo","Rodeo general"],["ternero","Destete precoz"],
              ]} />
            </div>
          )}
        </div>
      </div>
    );
  };

    // ── PASO 5: AGUA ──────────────────────────────────────────────
  // Agua ahora va dentro de renderSuplAgua (fusionado)
  const _panelAgua = () => <PanelAgua form={form} set={set} sat={sat} />;

  // ── PASO 6: SUPLEMENTACIÔN ────────────────────────────────────
  const renderSuplAgua = () => {
    // ── Agua de bebida (movida desde paso independiente) ──
    const _aguaSection = _panelAgua();

    // PV promedio por categoría (mayo-agosto)
    const pvVacaS   = parseFloat(form.pvVacaAdulta) || 320;
    const pvV2sS    = parseFloat(form.v2sPV) || Math.round(pvVacaS * 0.88);
    const pvToroS   = parseFloat(form.pvToros) || Math.round(pvVacaS * 1.3);
    // Vaq2: promedio del período mayo→entore (entrada + 75% PV adulto) / 2
    const pvVaq2Ent = parseFloat(pvEntradaVaq2) || Math.round(pvVacaS * 0.65);
    const pvVaq2Obj = Math.round((parseFloat(form.pvVacaAdulta)||320) * 0.75);
    const pvVaq2S   = Math.round((pvVaq2Ent + pvVaq2Obj) / 2);
    // Vaq1: promedio mayo-agosto con ganancia esperada 70kg (entrada + 35kg promedio)
    const pvVaq1Ent = parseFloat(form.vaq1PV || tcSave?.pvMayoPond) || Math.round(pvVacaS * 0.40);
    const pvVaq1S   = Math.round(pvVaq1Ent + 35);
    const pvTernS   = tcSave?.pvMayoPond || 80;

    // ── CATÁLOGO DE ALIMENTOS con clasificación y valores nutricionales ──
    const ALIMS = {
      // PROTEICOS
      "Expeller soja":     { tipo:"Proteico",       pb:44, em:2.80, label:"Expeller soja (PB 44%)", color:"#7ec850" },
      "Expeller girasol":  { tipo:"Proteico",       pb:36, em:2.60, label:"Expeller girasol (PB 36%)", color:"#7ec850" },
      "Expeller algodón":  { tipo:"Proteico",       pb:36, em:2.70, label:"Expeller algodón (PB 36%)", color:"#7ec850" },
      "Urea tamponada":    { tipo:"Proteico",       pb:280,em:0.00, label:"Urea tamponada (PB 280%)", color:"#7ec850", nota:"Máx 80g/animal/día · siempre con energía" },
      // ENERGÉTICOS
      "Maíz grano":        { tipo:"Energetico",     pb:9,  em:3.30, label:"Maíz grano (PB 9%)", color:"#e8a030" },
      "Sorgo grano":       { tipo:"Energetico",     pb:10, em:3.10, label:"Sorgo grano (PB 10%)", color:"#e8a030" },
      "Rollo silaje maíz": { tipo:"Energetico",     pb:8,  em:2.50, label:"Rollo/Silaje maíz (PB 8%)", color:"#e8a030" },
      // ENERGÉTICO-PROTEICOS
      "Semilla algodón":   { tipo:"EnergProteico",  pb:23, em:2.95, label:"Semilla algodón (PB 23%)", color:"#4a9fd4", nota:"Proteína bypass + grasa · ad libitum solo Vaq2°" },
      "Pellet trigo":      { tipo:"EnergProteico",  pb:16, em:3.00, label:"Pellet de trigo (PB 16%)", color:"#4a9fd4" },
    };
    const gruposTipo = [
      { id:"Proteico",      label:"Proteico",       desc:"Activan microbiota ruminal — clásicos de invierno NEA", alims:["Expeller girasol","Expeller algodón","Expeller soja","Urea tamponada"] },
      { id:"Energetico",    label:"Energético",     desc:"Almidón — DIARIO OBLIGATORIO (evitar acidosis)", alims:["Sorgo grano","Maíz grano","Rollo silaje maíz"] },
      { id:"EnergProteico", label:"Energético-Proteico", desc:"Combinan ambos efectos — flexibilidad de manejo", alims:["Semilla algodón","Pellet trigo"] },
    ];

    // Categorías que SÍ llevan suplemento — solo las que lo necesitan por biología
    // VACAS DE CRÍA: NO van aquí — su herramienta es el manejo del ternero (destete)
    // Suplementar vaca con ternero al pie es costoso e ineficiente: el ternero
    // consume 6–8 Mcal/día que ningún suplemento puede compensar (Wiltbank 1990)
    // Selector duración suplementación invernal
    const CATS = [
      { key:"v2s",     label:"Vaca 2° servicio",      icon:"⚡", pv:pvV2sS,   color:C.red,    supl1k:"supl_v2s",     dos1k:"dosis_v2s",     supl2k:"supl2_v2s",    dos2k:"dosis2_v2s",
        razon:"Triple estrés: crecimiento + lactación + preñez. SÍ necesita soporte nutricional adicional al pasto." },
      { key:"toros",   label:"Toros — preparo servicio", icon:"🐂", pv:pvToroS, color:C.blue, supl1k:"supl_toros",   dos1k:"dosis_toros",   supl2k:"supl2_toros",  dos2k:"dosis2_toros",
        razon:"CC objetivo: 5.5 al servicio. Sin condición: menor libido, peor calidad espermática." },
      { key:"vaq2",    label:"Vaquillona 2° inv.",     icon:"⚠", pv:pvVaq2S,  color:C.amber,  supl1k:"supl_vaq2",    dos1k:"dosis_vaq2",    supl2k:"supl2_vaq2",   dos2k:"dosis2_vaq2",
        razon:"Objetivo: PV entore ≥75% PV adulto. Sin suplemento: 120–200 g/d GDP — no llega." },
      { key:"vaq1",    label:"Vaquillona 1° inv.",     icon:"🐄", pv:pvVaq1S,  color:"#7ec850",supl1k:"supl_vaq1",    dos1k:"dosis_vaq1",    supl2k:"supl2_vaq1",   dos2k:"dosis2_vaq1",
        razon:"Sin ternero, en crecimiento activo. Respuesta marginal máxima al suplemento del sistema." },
      { key:"ternero", label:"Ternero post-destete",   icon:"🐃", pv:pvTernS,  color:C.textDim,supl1k:"supl_ternero", dos1k:"dosis_ternero", supl2k:"supl2_ternero",dos2k:"dosis2_ternero",
        razon:"Solo si hiperprecoz (<50d): proteína inmediata post-destete para continuar crecimiento." },
    ];

    const getAlimInfo = (nombre) => ALIMS[nombre] || null;
    const calcPctPV   = (dosis, pv) => pv > 0 && dosis > 0 ? (dosis / pv * 100).toFixed(2) : "—";
    const calcFreq    = (a1, a2) => {
      const tieneAlmidon = [a1,a2].some(a => a && ALIMS[a]?.tipo === "Energetico");
      if (!a1 && !a2) return { txt:"—", color:C.textFaint };
      if (tieneAlmidon) return { txt:"DIARIO obligatorio", color:C.red, nota:"Almidón → acidosis si intermitente" };
      return { txt:"2–3 veces/semana", color:C.green, nota:"Solo proteico/energ-prot → puede ser interdiario" };
    };

    // ── Motor de manejo de lactancia por CC ─────────────────────────
    // Calcula la herramienta óptima para cada grupo de CC del rodeo
    const distCC = form.distribucionCC || [];
    const ccPondS = distCC.reduce((s,g)=>{const p=parseFloat(g.pct)||0,c=parseFloat(g.cc)||0;return{s:s.s+p*c,t:s.t+p}},{s:0,t:0});
    const ccProm  = ccPondS.t>0 ? ccPondS.s/ccPondS.t : 0;
    const pctHiper= parseFloat(form.destHiper)||0;
    const pctAntic= parseFloat(form.destAntic)||0;
    const pctTrad = parseFloat(form.destTrad)||0;
    // Costo energético del ternero al pie por día (Short 1990 / Wiltbank 1990)
    const costoTernero_Mcal = 6.5; // Mcal/día que demanda la lactación
    // Recuperación CC al quitar ternero: ~0.3 CC/mes sin suplemento
    const recupCCSinTernero = 0.3;
    // Días hasta el próximo servicio
    const diasServicio = cadena?.ini ? Math.max(0,Math.round((new Date(cadena.ini)-new Date())/86400000)) : 120;

    return (
      <div>
        {/* ── Agua de bebida ── */}
        {_aguaSection}
        <div style={{ height:1, background:"rgba(255,255,255,.06)", margin:"16px 0" }} />
        {/* ── Meses de suplementación — selector exacto ── */}
        <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:8 }}>
            MESES DE SUPLEMENTACIÔN — seleccioná los meses que aplicás
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {[["4","May"],["5","Jun"],["6","Jul"],["7","Ago"],["8","Sep"],["9","Oct"],["10","Nov"],["3","Abr"]].map(([idx,lbl]) => {
              const sel = (form.suplMeses||["5","6","7"]).includes(idx);
              return (
                <button key={idx} onClick={() => {
                  const cur = form.suplMeses||["5","6","7"];
                  const next = sel ? cur.filter(m=>m!==idx) : [...cur, idx].sort((a,b)=>Number(a)-Number(b));
                  set("suplMeses", next);
                }} style={{
                  padding:"7px 12px", borderRadius:8, cursor:"pointer",
                  fontFamily:C.font, fontSize:10, fontWeight:sel?700:400,
                  background: sel ? `${C.green}18` : "transparent",
                  border:`1px solid ${sel ? C.green : C.border}`,
                  color: sel ? C.green : C.textDim,
                }}>{lbl}</button>
              );
            })}
          </div>
          {(() => {
            const meses = form.suplMeses||["5","6","7"];
            const nombM = {3:"Abr",4:"May",5:"Jun",6:"Jul",7:"Ago",8:"Sep",9:"Oct",10:"Nov"};
            const rango = meses.length > 0
              ? meses.map(m=>nombM[Number(m)]||m).join(" · ")
              : "ninguno seleccionado";
            return (
              <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginTop:8 }}>
                {meses.length === 0
                  ? "⚠️ Sin meses seleccionados — el suplemento no aplica en el balance"
                  : `${meses.length} mes${meses.length>1?"es":""}: ${rango} · ${meses.length * 30}d aprox`}
              </div>
            );
          })()}
        </div>
        {/* ══ PANEL 1: MANEJO DE LACTANCIA — herramienta principal para vacas ══ */}
        <div style={{ background:`${C.green}06`, border:`1px solid ${C.green}25`, borderRadius:14, padding:14, marginBottom:16 }}>
          <div style={{ fontFamily:C.font, fontSize:10, color:C.green, letterSpacing:1, marginBottom:4 }}>
            🐄 MANEJO DE LACTANCIA — HERRAMIENTA PRINCIPAL DEL SISTEMA
          </div>
          <div style={{ fontFamily:C.sans, fontSize:11, color:C.textDim, lineHeight:1.5, marginBottom:12 }}>
            El ternero al pie consume <strong style={{color:C.text}}>6–8 Mcal/día</strong> = más que cualquier suplemento posible.
            La herramienta para mejorar CC de la vaca es <strong style={{color:C.green}}>controlar cuándo y cómo se retira ese costo</strong>.
          </div>

          {/* Diagnóstico por grupo CC */}
          {distCC.filter(g=>parseFloat(g.cc)&&parseFloat(g.pct)>0).length > 0 ? (
            <div>
              {distCC.filter(g=>parseFloat(g.cc)&&parseFloat(g.pct)>0).map((g,i)=>{
                const cc   = parseFloat(g.cc);
                const pct  = parseFloat(g.pct);
                const nVac = Math.round((parseInt(form.vacasN)||0)*pct/100);
                const bt   = getBiotipo(form.biotipo);

                // Herramienta recomendada por CC
                const herramienta = cc < 4.0
                  ? { tipo:"hiperprecoz", label:"⚡ Hiperprecoz (≥50 días)", color:C.red,
                      razon:"CC crítica — anestro garantizado con ternero al pie. Retirar ternero libera 6–8 Mcal/día → ciclado en 7–14 días (Wiltbank 1990)",
                      ccRecup: +(recupCCSinTernero * (diasServicio/30)).toFixed(1) }
                  : cc < 4.5
                  ? { tipo:"anticipado", label:"🔶 Anticipado (90 días)", color:C.amber,
                      razon:"CC borderline — con ternero al pie no va a llegar al servicio ciclando. Destete anticipado + recuperación en pasto otoñal.",
                      ccRecup: +(recupCCSinTernero * 0.7 * (diasServicio/30)).toFixed(1) }
                  : cc < 5.0
                  ? { tipo:"anticipado_opcional", label:"🔶 Anticipado según marcha (90d)", color:C.amber,
                      razon:"CC aceptable — si el pasto falla o el invierno avanza, destete anticipado como seguro.",
                      ccRecup: +(recupCCSinTernero * 0.5 * (diasServicio/30)).toFixed(1) }
                  : { tipo:"tradicional", label:"🐄 Tradicional (180 días)", color:C.green,
                      razon:"CC buena — puede sostener lactancia completa y llegar al servicio en condición.",
                      ccRecup: 0 };

                const ccProyServ = Math.min(7, cc + herramienta.ccRecup - (herramienta.tipo==="tradicional"?0.8:0.3));
                const prenezProy = (() => {
                  if (ccProyServ>=5.5) return 93;
                  if (ccProyServ>=5.0) return 88;
                  if (ccProyServ>=4.5) return 80;
                  if (ccProyServ>=4.0) return 70;
                  if (ccProyServ>=3.5) return 50;
                  return 28;
                })();

                return (
                  <div key={i} style={{
                    background:C.card2, border:`1px solid ${herramienta.color}30`,
                    borderRadius:10, padding:12, marginBottom:8
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div>
                        <span style={{ fontFamily:C.font, fontSize:11, color:C.text, fontWeight:700 }}>CC {cc} · {pct}% del rodeo</span>
                        <span style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginLeft:8 }}>({nVac} vacas)</span>
                      </div>
                      <span style={{ fontFamily:C.font, fontSize:9, color:herramienta.color,
                        background:`${herramienta.color}15`, border:`1px solid ${herramienta.color}30`,
                        borderRadius:6, padding:"3px 8px" }}>{herramienta.label}</span>
                    </div>
                    <div style={{ fontFamily:C.sans, fontSize:10, color:C.textDim, lineHeight:1.4, marginBottom:8 }}>
                      {herramienta.razon}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                      <div style={{ background:`${herramienta.color}10`, borderRadius:7, padding:"6px 8px", textAlign:"center" }}>
                        <div style={{ fontFamily:C.font, fontSize:16, fontWeight:700, color:herramienta.color }}>{cc}</div>
                        <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>CC HOY</div>
                      </div>
                      <div style={{ background:`${C.green}10`, borderRadius:7, padding:"6px 8px", textAlign:"center" }}>
                        <div style={{ fontFamily:C.font, fontSize:16, fontWeight:700, color:C.green }}>{ccProyServ.toFixed(1)}</div>
                        <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>CC SERV. PROY.</div>
                      </div>
                      <div style={{ background:`${prenezProy>=80?C.green:prenezProy>=50?C.amber:C.red}10`, borderRadius:7, padding:"6px 8px", textAlign:"center" }}>
                        <div style={{ fontFamily:C.font, fontSize:16, fontWeight:700, color:prenezProy>=80?C.green:prenezProy>=50?C.amber:C.red }}>{prenezProy}%</div>
                        <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>PREÑEZ EST.</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontFamily:C.sans, fontSize:11, color:C.textFaint, textAlign:"center", padding:12 }}>
              Ingresá la distribución de CC en el paso 2 para ver el plan por grupo
            </div>
          )}

          {/* Costo real del ternero al pie */}
          <div style={{ background:`${C.red}06`, border:`1px solid ${C.red}20`, borderRadius:8, padding:10, marginTop:8 }}>
            <div style={{ fontFamily:C.font, fontSize:8, color:C.red, letterSpacing:1, marginBottom:6 }}>
              ⚡ ┬┐POR QUÉ NO SUPLEMENTAR VACAS CON TERNERO AL PIE?
            </div>
            <div style={{ fontFamily:C.sans, fontSize:11, color:C.text, marginBottom:8, lineHeight:1.5 }}>
              La lactación le cuesta a la vaca <strong style={{color:C.red}}>6–8 Mcal/día</strong> extras. Para compensar ese gasto con suplemento necesitarías darle <strong style={{color:C.red}}>{(6.5/2.6).toFixed(1)} kg/día de expeller</strong> — más caro e ineficiente. Además, mientras el ternero esté al pie, la vaca no cicla por el estímulo del amamantamiento (bloqueo LH).
            </div>
            <div style={{ fontFamily:C.sans, fontSize:11, color:C.green, lineHeight:1.5 }}>
              ✅ <strong>La herramienta correcta es el destete:</strong> al retirar el ternero, la vaca elimina ese gasto de 6–8 Mcal/día y retoma el cicio en <strong>7–14 días</strong>. Ningún suplemento logra eso.
            </div>
          </div>
        </div>

        {/* ══ PANEL 2: SUPLEMENTACIÔN — solo categorías que lo necesitan ══ */}
        <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:10 }}>
          💊 SUPLEMENTACIÔN — V2S · TOROS · VAQUILLONA 1° y 2°
        </div>
        <div style={{ fontFamily:C.sans, fontSize:11, color:C.textDim, marginBottom:12, lineHeight:1.5 }}>
          Estas categorías SÍ responden al suplemento porque no tienen el costo del ternero al pie
          o están en crecimiento activo donde la respuesta marginal justifica la inversión.
        </div>

        <div style={{ display:"flex", gap:6, marginBottom:12 }}>
          {[["cuadrantes","📋 Plan por categoría"],["resumen","📊 Resumen rodeo"]].map(([k,l]) => (
            <button key={k} onClick={()=>setVistaSupl(k)} style={{
              flex:1, padding:"7px 4px", borderRadius:8, cursor:"pointer", fontFamily:C.font, fontSize:10,
              background: vistaSupl===k ? C.green+"20" : "transparent",
              border: `1px solid ${vistaSupl===k ? C.green : C.border}`,
              color: vistaSupl===k ? C.green : C.textDim,
            }}>{l}</button>
          ))}
        </div>

        {vistaSupl === "cuadrantes" && CATS.map(cat => {
          const s1 = form[cat.supl1k] || "";
          const d1 = parseFloat(form[cat.dos1k]) || 0;
          const s2 = form[cat.supl2k] || "";
          const d2 = parseFloat(form[cat.dos2k]) || 0;
          const a1 = getAlimInfo(s1);
          const a2 = getAlimInfo(s2);
          const mcal1 = a1 ? a1.em * d1 : 0;
          const mcal2 = a2 ? a2.em * d2 : 0;
          const pb1   = a1 ? (a1.pb / 100) * d1 * 1000 : 0;
          const pb2   = a2 ? (a2.pb / 100) * d2 * 1000 : 0;
          const mcalTot = mcal1 + mcal2;
          const pbTot   = pb1 + pb2;
          const pctPV1  = calcPctPV(d1, cat.pv);
          const pctPV2  = calcPctPV(d2, cat.pv);
          const freq    = calcFreq(s1, s2);
          const tieneSupl = d1 > 0 || d2 > 0;

          // Alertas específicas
          const alertas = [];
          if (cat.key === "vaq1" && s1 === "Semilla algodón" && d1 > cat.pv * 0.004)
            alertas.push({ tipo:"error", msg:`Semilla algodón Vaq1: máx ${(cat.pv*0.004).toFixed(1)}kg (0.4% PV) — superar daña digestibilidad` });
          if (cat.key === "vaq2" && !tieneSupl)
            alertas.push({ tipo:"warn", msg:"Vaq2 sin suplemento: verificar si llega al objetivo de entore (" + Math.round(parseFloat(form.pvVacaAdulta||320)*0.75) + " kg)" });
          if (cat.key === "toros" && (s1 === "Semilla algodón" || s2 === "Semilla algodón")) {
            const dosAlg = s1==="Semilla algodón" ? d1 : d2;
            if (dosAlg > cat.pv * 0.003)
              alertas.push({ tipo:"warn", msg:`Toros: semilla algodón máx 0.3% PV = ${(cat.pv*0.003).toFixed(1)}kg/d (Balbuena INTA 2003)` });
          }
          if ([s1,s2].includes("Urea tamponada") && ![s1,s2].some(s => ALIMS[s]?.tipo === "Energetico"))
            alertas.push({ tipo:"warn", msg:"Urea debe suministrarse siempre junto con fuente energética (riesgo de toxicidad)" });

          return (
            <div key={cat.key} style={{
              background:C.card2, border:`1px solid ${cat.color}25`,
              borderRadius:12, padding:14, marginBottom:10
            }}>
              {/* ── Encabezado categoría ── */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <span style={{ fontSize:16 }}>{cat.icon}</span>
                  <div>
                    <div style={{ fontFamily:C.font, fontSize:12, color:C.text, fontWeight:700 }}>{cat.label}</div>
                    <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>PV prom. mayo-agosto: {cat.pv} kg</div>
                  </div>
                </div>
                {tieneSupl && (
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:C.font, fontSize:11, color:cat.color, fontWeight:700 }}>{mcalTot.toFixed(1)} Mcal/d</div>
                    <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>{Math.round(pbTot)} g PB/d</div>
                  </div>
                )}
              </div>

              {/* ── CUADRANTE 1: Tipo de alimento (chips) ── */}
              <div style={{ marginBottom:10 }}>
                <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, letterSpacing:1, marginBottom:6 }}>
                  TIPO DE ALIMENTO
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {gruposTipo.map(g => {
                    const activo = [...(s1?[s1]:[]),...(s2?[s2]:[])].some(s => ALIMS[s]?.tipo === g.id);
                    return (
                      <div key={g.id} style={{
                        padding:"5px 10px", borderRadius:20, fontFamily:C.font, fontSize:9,
                        background: activo ? `${cat.color}18` : "transparent",
                        border: `1px solid ${activo ? cat.color : C.border}`,
                        color: activo ? cat.color : C.textFaint,
                      }}>
                        <div style={{ fontWeight: activo ? 700 : 400 }}>{g.label}</div>
                        {activo && <div style={{ fontSize:7, marginTop:1 }}>{g.desc}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── CUADRANTE 2+3: Alimentos con dosis ── */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
                {[
                  { label:"ALIMENTO PRINCIPAL", suplKey:cat.supl1k, dosKey:cat.dos1k, suplVal:s1, dosVal:d1, alim:a1, pctPV:pctPV1 },
                  { label:"COMPLEMENTO",         suplKey:cat.supl2k, dosKey:cat.dos2k, suplVal:s2, dosVal:d2, alim:a2, pctPV:pctPV2 },
                ].map(({label, suplKey, dosKey, suplVal, dosVal, alim, pctPV}) => (
                  <div key={label}>
                    <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, letterSpacing:1, marginBottom:5 }}>{label}</div>
                    <select value={suplVal} onChange={e=>set(suplKey, e.target.value)} style={{
                      width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:8,
                      color:C.text, padding:"7px 9px", fontFamily:C.sans, fontSize:10, cursor:"pointer", marginBottom:6
                    }}>
                      <option value="">— Sin suplemento —</option>
                      {gruposTipo.map(g => (
                        <optgroup key={g.id} label={g.label.toUpperCase()}>
                          {g.alims.map(nombre => {
                            const a = ALIMS[nombre];
                            return <option key={nombre} value={nombre}>{a.label} | {a.em} Mcal/kg</option>;
                          })}
                        </optgroup>
                      ))}
                    </select>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <input type="number" step="0.1" min="0" max="8" value={dosVal||""} onChange={e=>set(dosKey, e.target.value)}
                        style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:8,
                          color:C.text, padding:"7px 9px", fontFamily:C.font, fontSize:14, boxSizing:"border-box" }}
                        placeholder="0.0 kg/d"
                      />
                      {alim && dosVal > 0 && (
                        <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, textAlign:"right", lineHeight:1.4, minWidth:52 }}>
                          <div style={{ color:cat.color, fontWeight:700 }}>{pctPV}% PV</div>
                          <div>{(alim.em * dosVal).toFixed(1)} Mcal</div>
                          <div style={{ color:alim.tipo==="Proteico"?"#7ec850":alim.tipo==="Energetico"?C.amber:C.blue, fontSize:8 }}>{alim.tipo}</div>
                        </div>
                      )}
                    </div>
                    {alim?.nota && <div style={{ fontFamily:C.font, fontSize:8, color:C.amber, marginTop:3 }}>ℹ️ {alim.nota}</div>}
                  </div>
                ))}
              </div>

              {/* ── CUADRANTE 4: Resultados ── */}
              {tieneSupl && (
                <div style={{ borderTop:`1px solid ${cat.color}20`, paddingTop:10 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 }}>
                    <div style={{ background:`${cat.color}08`, borderRadius:8, padding:"6px 4px", textAlign:"center" }}>
                      <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>% PV TOTAL</div>
                      <div style={{ fontFamily:C.font, fontSize:14, color:cat.color, fontWeight:700 }}>
                        {cat.pv>0 ? ((d1+d2)/cat.pv*100).toFixed(2) : "—"}%
                      </div>
                    </div>
                    <div style={{ background:`${cat.color}08`, borderRadius:8, padding:"6px 4px", textAlign:"center" }}>
                      <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>TOTAL kg/d</div>
                      <div style={{ fontFamily:C.font, fontSize:14, color:cat.color, fontWeight:700 }}>{(d1+d2).toFixed(1)}</div>
                    </div>
                    <div style={{ background:`${cat.color}08`, borderRadius:8, padding:"6px 4px", textAlign:"center" }}>
                      <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>Mcal/día</div>
                      <div style={{ fontFamily:C.font, fontSize:14, color:cat.color, fontWeight:700 }}>{mcalTot.toFixed(1)}</div>
                    </div>
                    <div style={{ background:`${cat.color}08`, borderRadius:8, padding:"6px 4px", textAlign:"center" }}>
                      <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>g PB/día</div>
                      <div style={{ fontFamily:C.font, fontSize:14, color:cat.color, fontWeight:700 }}>{Math.round(pbTot)}</div>
                    </div>
                  </div>
                  {/* Frecuencia */}
                  <div style={{ marginTop:8, padding:"6px 10px", borderRadius:8, background:`${freq.color}10`, border:`1px solid ${freq.color}25` }}>
                    <span style={{ fontFamily:C.font, fontSize:9, color:freq.color, fontWeight:700 }}>{freq.txt}</span>
                    {freq.nota && <span style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginLeft:8 }}>{freq.nota}</span>}
                  </div>
                </div>
              )}

              {/* Alertas */}
              {alertas.map((al, i) => (
                <Alerta key={i} tipo={al.tipo} style={{marginTop:6}}>{al.msg}</Alerta>
              ))}
            </div>
          );
        })}

        {/* ── VISTA RESUMEN RODEO ── */}
        {vistaSupl === "resumen" && (
          <div>
            <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:10 }}>
              RESUMEN SUPLEMENTACIÔN — costo y Mcal total por categoría
            </div>
            {CATS.map(cat => {
              const d1 = parseFloat(form[cat.dos1k]) || 0;
              const d2 = parseFloat(form[cat.dos2k]) || 0;
              const a1 = getAlimInfo(form[cat.supl1k]);
              const a2 = getAlimInfo(form[cat.supl2k]);
              const mcal = (a1?a1.em*d1:0) + (a2?a2.em*d2:0);
              const pb   = (a1?(a1.pb/100)*d1*1000:0) + (a2?(a2.pb/100)*d2*1000:0);
              const pct  = cat.pv > 0 && (d1+d2)>0 ? ((d1+d2)/cat.pv*100).toFixed(2) : null;
              if (!pct) return null;
              return (
                <div key={cat.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"8px 12px", borderRadius:10, marginBottom:6, background:C.card2, border:`1px solid ${cat.color}20` }}>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <span>{cat.icon}</span>
                    <div>
                      <div style={{ fontFamily:C.font, fontSize:10, color:C.text, fontWeight:600 }}>{cat.label}</div>
                      <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>
                        {[form[cat.supl1k], form[cat.supl2k]].filter(Boolean).join(" + ")}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:C.font, fontSize:11, color:cat.color, fontWeight:700 }}>{pct}% PV · {(d1+d2).toFixed(1)} kg/d</div>
                    <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>{mcal.toFixed(1)} Mcal · {Math.round(pb)}g PB</div>
                  </div>
                </div>
              );
            }).filter(Boolean)}
          </div>
        )}

        {/* ── NECESIDADES DE CAMPAÑA ── */}
        {(() => {
          const mesesSupl = (form.suplMeses || ["5","6","7"]).map(Number);
          const diasSupl  = mesesSupl.length * 30;
          if (diasSupl === 0) return null;

          // Calcular kg necesarios por alimento para toda la campaña
          const CATS_NECES = [
            { sK:"supl_vacas",   dK:"dosis_vacas",   n:parseInt(form.vacasN)||0,  label:"Vacas" },
            { sK:"supl_v2s",     dK:"dosis_v2s",     n:parseInt(form.v2sN)||0,    label:"V2S" },
            { sK:"supl_toros",   dK:"dosis_toros",   n:parseInt(form.torosN)||0,  label:"Toros" },
            { sK:"supl_vaq2",    dK:"dosis_vaq2",    n:parseInt(form.vaq2N)||0,   label:"Vaq2" },
            { sK:"supl_vaq1",    dK:"dosis_vaq1",    n:Math.round((parseInt(form.vacasN)||0)*(parseFloat(form.pctReposicion)||20)/100), label:"Vaq1" },
          ];

          // Agrupar por alimento
          const necesPorAlim = {};
          const detallePorAlim = {};
          CATS_NECES.forEach(c => {
            const alim = form[c.sK];
            const dos  = parseFloat(form[c.dK]) || 0;
            if (!alim || !dos || !c.n) return;
            const kgTotal = dos * c.n * diasSupl;
            if (!necesPorAlim[alim]) { necesPorAlim[alim] = 0; detallePorAlim[alim] = []; }
            necesPorAlim[alim] += kgTotal;
            detallePorAlim[alim].push({ cat:c.label, n:c.n, dos, kgTotal });
          });

          const alims = Object.keys(necesPorAlim);
          if (alims.length === 0) return null;

          return (
            <div style={{ background:C.card2, border:"1px solid "+C.border,
              borderRadius:12, padding:"12px 14px", marginTop:8 }}>
              <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint,
                letterSpacing:1, marginBottom:10 }}>
                📦 NECESIDADES DE CAMPAÑA — {diasSupl} días ·{" "}
                {mesesSupl.map(m=>["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][m]).join("·")}
              </div>
              {alims.map(alim => {
                const kgTotal = necesPorAlim[alim];
                const tnTotal = (kgTotal / 1000).toFixed(1);
                const detalle = detallePorAlim[alim];
                const sInfo   = SUPLEMENTOS[alim];
                const tipo    = sInfo?.tipo === "P" ? "Proteico" : sInfo?.tipo === "E" ? "Energético" : "Energ-Proteico";
                const colTipo = sInfo?.tipo === "P" ? C.green : sInfo?.tipo === "E" ? C.amber : C.blue;
                return (
                  <div key={alim} style={{ marginBottom:10, padding:"10px 12px",
                    background:C.card, borderRadius:10,
                    border:"1px solid "+colTipo+"25" }}>
                    <div style={{ display:"flex", justifyContent:"space-between",
                      alignItems:"flex-start", marginBottom:6 }}>
                      <div>
                        <div style={{ fontFamily:C.font, fontSize:11, color:C.text,
                          fontWeight:700 }}>{alim}</div>
                        <div style={{ fontFamily:C.font, fontSize:8, color:colTipo,
                          marginTop:1 }}>{tipo} · PB {sInfo?.pb||"—"}% · {sInfo?.em||"—"} Mcal/kg</div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ fontFamily:C.font, fontSize:20, fontWeight:700,
                          color:colTipo, lineHeight:1 }}>{tnTotal} t</div>
                        <div style={{ fontFamily:C.font, fontSize:8,
                          color:C.textFaint }}>para la campaña</div>
                      </div>
                    </div>
                    {/* Desglose por categoría */}
                    {detalle.map((d,i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between",
                        padding:"3px 0", borderTop:"1px solid "+C.border+"60" }}>
                        <span style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>
                          {d.cat} ({d.n} cab × {d.dos} kg/d)
                        </span>
                        <span style={{ fontFamily:C.font, fontSize:9, color:C.text }}>
                          {(d.kgTotal/1000).toFixed(1)} t · {Math.round(d.dos*d.n)} kg/día
                        </span>
                      </div>
                    ))}
                    {/* Frecuencia de suministro */}
                    {sInfo?.tipo === "E" && (
                      <div style={{ fontFamily:C.font, fontSize:8, color:C.red,
                        marginTop:4, fontWeight:700 }}>
                        ⚡ DIARIO obligatorio — almidón puede causar acidosis si se da en bolo
                      </div>
                    )}
                    {sInfo?.tipo === "P" && (
                      <div style={{ fontFamily:C.font, fontSize:8, color:C.green,
                        marginTop:4 }}>
                        ✓ 2–3 veces/semana — activa microflora ruminal, no requiere diario
                      </div>
                    )}
                  </div>
                );
              })}
              <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint,
                marginTop:4, borderTop:"1px solid "+C.border, paddingTop:6 }}>
                Total campaña: {(Object.values(necesPorAlim).reduce((s,v)=>s+v,0)/1000).toFixed(1)} t ·{" "}
                {Object.values(necesPorAlim).reduce((s,v)=>s+v,0)/diasSupl|0} kg/día promedio ·{" "}
                Comprá antes del {["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][Math.max(0,mesesSupl[0]-1)||0]}
              </div>
            </div>
          );
        })()}



      </div>
    );
  };

  // ── PASO 7: SANIDAD ───────────────────────────────────────────
  const renderSanidad = () => (
    <div>
      <div style={{ fontFamily:C.font, fontSize:10, color:C.amber, letterSpacing:1, marginBottom:4 }}>🏥 SANIDAD REPRODUCTIVA</div>
      <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, marginBottom:16 }}>
        La sanidad es el techo del sistema. Sin ella, cualquier mejora nutricional tiene rendimiento marginal.
      </div>

      {/* Vacunas obligatorias */}
      <Toggle label="💉 ┬┐Vacunación Aftosa al día?"        value={form.sanAftosa     === "si"} onChange={v => set("sanAftosa",     v ? "si" : "no")} />
      {form.sanAftosa === "no" && <Alerta tipo="error">Aftosa sin vacunar — obligatoria (SENASA). Dos dosis anuales mínimo. Riesgo de brote y clausura comercial.</Alerta>}

      <Toggle label="💉 ┬┐Vacunación Brucelosis al día?"    value={form.sanBrucelosis === "si"} onChange={v => set("sanBrucelosis", v ? "si" : "no")} />
      {form.sanBrucelosis === "no" && <Alerta tipo="error">Brucelosis sin vacunar — obligatoria en terneras 3–8 meses (SENASA RES.114/21). Zoonosis. Riesgo de aborto masivo al 7° mes.</Alerta>}

      <Toggle label="💉 ┬┐Vacunación IBR/DVB al día?"       value={form.sanVacunas  === "si"} onChange={v => set("sanVacunas",   v ? "si" : "no")} />
      {form.sanVacunas === "no" && <Alerta tipo="error">IBR/DVB sin vacunar: riesgo de reducción de preñez hasta →15 pp.</Alerta>}

      {/* Parásitos */}
      <SelectF label="PARÁSITOS EXTERNOS (garrapatas)" value={form.sanParasitoExt||""} onChange={v=>set("sanParasitoExt",v)} options={[
        ["", "— seleccionar —"],
        ["controlado", "Controlado (baños / pour-on al día)"],
        ["parcial",    "Control parcial (irregular)"],
        ["no",         "Sin control"],
      ]} />
      <SelectF label="PARÁSITOS INTERNOS" value={form.sanParasitoInt||""} onChange={v=>set("sanParasitoInt",v)} options={[
        ["", "— seleccionar —"],
        ["controlado", "Controlado (dosificación estratégica)"],
        ["parcial",    "Control parcial"],
        ["no",         "Sin control"],
      ]} />
      {(form.sanParasitoExt==="no" || form.sanParasitoInt==="no") && (
        <Alerta tipo="warn">Parásitos sin control: pérdida de GDP y supresión inmune. En NEA, garrapata transmite Babesia/Anaplasma — riesgo de mortalidad en animales no inmunizados.</Alerta>
      )}

      {/* Toros y programa */}
      <Toggle label="🐂 ┬┐Toros con revisión pre-servicio?"  value={form.sanToros    === "con_control"} onChange={v => set("sanToros",     v ? "con_control" : "sin_control")} />
      {form.sanToros === "sin_control" && <Alerta tipo="error">Toros sin revisión pre-servicio: un toro con lesión no detectada puede dejar 15–20 vacas vacías sin que nadie lo note hasta el tacto.</Alerta>}

      <Toggle label="📋 ┬┐Historia de abortos en el rodeo?" value={form.sanAbortos  === "si"} onChange={v => set("sanAbortos",   v ? "si" : "no")} />
      {form.sanAbortos === "si" && <Alerta tipo="warn">Historia de abortos: diagnóstico diferencial IBR/DVB/Leptospira/Brucelosis/Neospora prioritario.</Alerta>}

      <Toggle label="📋 ┬┐Programa sanitario estructurado?" value={form.sanPrograma === "si"} onChange={v => set("sanPrograma",  v ? "si" : "no")} />
      {form.sanPrograma === "no" && <Alerta tipo="warn">Sin programa sanitario estructurado. La sanidad es el techo del sistema — ninguna mejora nutricional compensa enfermedades activas.</Alerta>}

      {/* Resumen alertas si hay motor */}
      {motor && sanidad?.alerts?.length > 0 && (
        <div style={{ marginTop:16 }}>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1, marginBottom:8 }}>ALERTAS SANITARIAS</div>
          {sanidad.alerts.map((a,i) => (
            <Alerta key={i} tipo={a.nivel==="rojo"?"error":"warn"}>{a.msg}</Alerta>
          ))}
        </div>
      )}
    </div>
  );

  // ── PASO 8: ANÁLISIS ──────────────────────────────────────────
  const renderAnalisis = () => {
    const score = motor ? calcScore(motor, form, calcFaseCiclo(motor?.cadena ?? calcCadena(form.iniServ, form.finServ), form)) : null;


      {/* ── DIAGNÔSTICO TOROS — preparo servicio ── */}
      {parseInt(form.torosN) > 0 && (
        <div style={{ background:C.card2, border:"1px solid "+C.blue+"30",
          borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.blue, letterSpacing:1, marginBottom:10 }}>
            🐂 TOROS — PREPARO DE SERVICIO ({form.torosN} cab · relación {form.vacasN && form.torosN ? Math.round(parseFloat(form.vacasN)/parseFloat(form.torosN))+"V:1T" : "—"})
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <SelectF label="CC TOROS (escala 1–9)" value={form.torosCC||""}
              onChange={v=>set("torosCC",v)}
              placeholder="CC actual..."
              options={[
                ["3.0","CC 3.0 — Muy flaco 🔴"],["3.5","CC 3.5 — Flaco 🔴"],
                ["4.0","CC 4.0 — Regular ⚠️"],["4.5","CC 4.5 — Aceptable"],
                ["5.0","CC 5.0 — Buena ✓"],["5.5","CC 5.5 — Ôptimo ✅"],
                ["6.0","CC 6.0 — Excelente"],
              ]} />
            <div>
              <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginBottom:4 }}>
                RELACIÔN TOROS:VACAS
              </div>
              <div style={{ fontFamily:C.font, fontSize:18, fontWeight:700,
                color: form.vacasN && form.torosN && parseFloat(form.vacasN)/parseFloat(form.torosN) > 30 ? C.red : C.green }}>
                {form.vacasN && form.torosN ? Math.round(parseFloat(form.vacasN)/parseFloat(form.torosN)) + ":1" : "—"}
              </div>
              <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>
                Ôptimo: ≥25:1 · Máx: 30:1
              </div>
            </div>
          </div>
          {form.torosCC && parseFloat(form.torosCC) < 5.0 && (
            <Alerta tipo="warn">
              CC {form.torosCC} — objetivo ≥5.5 al servicio ·{" "}
              {Math.round((5.5-parseFloat(form.torosCC))/0.018)} días de preparo necesarios
            </Alerta>
          )}
          {form.vacasN && form.torosN && parseFloat(form.vacasN)/parseFloat(form.torosN) > 30 && (
            <Alerta tipo="error">
              Relación {Math.round(parseFloat(form.vacasN)/parseFloat(form.torosN))}:1 — insuficiente. Agregar toros o dividir el rodeo.
            </Alerta>
          )}
        </div>
      )}
    return (
    <div>

      {/* ══ 5 TABS: Resumen · Diagnóstico · Balance · GEI · Cerebro ══ */}
      <div>
          <div style={{ display:"flex", gap:3, marginBottom:12, overflowX:"auto", scrollbarWidth:"none" }}>
            {[["resumen","🏅"],["diagnostico","🔍"],["balance","📊"],["gei","🌿"],["cerebro","🧠"]].map(([k,l]) => (
              <button key={k} onClick={()=>setTab(k)} style={{
                flex:"0 0 auto", padding:"10px 12px", borderRadius:10, cursor:"pointer",
                background: tab===k ? C.green : "transparent",
                border:     tab===k ? "1px solid " + C.green : "1px solid " + C.border,
                color:      tab===k ? "#0b1a0c" : C.textDim,
                fontFamily: C.font, fontSize:13, fontWeight: tab===k ? 700 : 400,
              }}>{l}</button>
            ))}
          </div>

          {/* ═══ TAB RESUMEN — dashboard del establecimiento ═══ */}
          {tab === "resumen" && (
            <DashboardEstablecimiento
              motor={motorEfectivo} form={form} sat={sat} score={score}
              confianza={confianza} onTab={setTab}
            />
          )}

          {/* ═══ TAB DIAGNÔSTICO ═══ */}
          {tab === "diagnostico" && (
            <div>
              {/* ── Banner de puntos críticos — visible aunque el motor sea null ── */}
              {(() => {
                // Detectar puntos críticos desde el formulario solo, sin necesitar motor
                const criticos = [];
                const oport = [];

                // Sanidad — datos disponibles desde el formulario siempre
                if (form.sanAftosa !== "si")      criticos.push({ ico:"🔴", txt:"Aftosa sin vacuna — obligatorio legal" });
                if (form.sanBrucelosis !== "si")  criticos.push({ ico:"🔴", txt:"Brucelosis sin vacuna — obligatorio legal + riesgo zoonótico" });
                if (form.sanVacunas !== "si")     oport.push({ ico:"⚠", txt:"Sin vacuna IBR/DVB — puede reducir preñez 15pp" });
                if (form.sanToros !== "con_control") criticos.push({ ico:"🔴", txt:"Toros sin revisión pre-servicio" });
                if (form.sanAbortos === "si")     oport.push({ ico:"⚠", txt:"Historia de abortos — requiere diagnóstico diferencial" });
                if (form.sanPrograma !== "si")    oport.push({ ico:"⚠", txt:"Sin programa sanitario estructurado" });

                // CC — si se cargó
                const cc = parseFloat(form.distribucionCC ? Object.entries(form.distribucionCC||{}).reduce((s,[k,v])=>s+parseFloat(k||0)*(parseFloat(v)||0),0)/Math.max(1,Object.values(form.distribucionCC||{}).reduce((s,v)=>s+(parseFloat(v)||0),0)) : 0);
                if (cc > 0 && cc < 4.0)  criticos.push({ ico:"🔴", txt:"CC promedio " + cc.toFixed(1) + " — crítica para el servicio (óptimo ≥4.5)" });
                else if (cc > 0 && cc < 4.5) oport.push({ ico:"⚠", txt:"CC promedio " + cc.toFixed(1) + " — por debajo del óptimo al servicio" });

                // Fechas de servicio
                const cadenaForm = calcCadena(form.iniServ, form.finServ);
                if (!form.iniServ || !form.finServ) oport.push({ ico:"⚠", txt:"Sin fechas de servicio — el diagnóstico contextual no puede activarse" });
                else if (cadenaForm?.diasServ > 90) oport.push({ ico:"⚠", txt:"Servicio de " + cadenaForm.diasServ + " días — cola de preñez pesada (óptimo 75–90d)" });

                // Relación toro:vaca
                const relTV = parseFloat(form.vacasN||0) / Math.max(1, parseFloat(form.torosN||1));
                if (form.torosN && relTV > 30) criticos.push({ ico:"🔴", txt:"Relación toros:vacas " + Math.round(relTV) + ":1 — riesgo de vacas no servidas en los primeros 21 días" });

                // Forraje — si hay datos de ubicación
                if (sat?.ndvi && parseFloat(sat.ndvi) < 0.35) criticos.push({ ico:"🔴", txt:"NDVI " + sat.ndvi + " — pasto escaso ahora (" + (sat.condForr||"crítico") + ")" });
                else if (sat?.ndvi && parseFloat(sat.ndvi) < 0.45) oport.push({ ico:"⚠", txt:"NDVI " + sat.ndvi + " — condición forrajera regular" });

                // Si no hay ningún dato cargado aún
                const sinDatos = !form.vacasN && !form.biotipo && !form.iniServ;

                if (sinDatos) return (
                  <div style={{ background:C.card2, border:"1px dashed "+C.border, borderRadius:12, padding:16, marginBottom:12, textAlign:"center" }}>
                    <div style={{ fontFamily:C.font, fontSize:26, marginBottom:8 }}>🔍</div>
                    <div style={{ fontFamily:C.font, fontSize:12, color:C.text, fontWeight:700, marginBottom:4 }}>
                      Completá los pasos del formulario para ver el diagnóstico
                    </div>
                    <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint }}>
                      Con solo la ubicación ya podés ver el clima y el estado forrajero actual
                    </div>
                  </div>
                );

                if (criticos.length === 0 && oport.length === 0 && !motor) return (
                  <div style={{ background:C.green+"08", border:"1px solid "+C.green+"30", borderRadius:12, padding:12, marginBottom:12 }}>
                    <div style={{ fontFamily:C.font, fontSize:10, color:C.green }}>
                      ✅ Los datos cargados no muestran alertas críticas visibles. Completá los pasos de CC y forraje para el diagnóstico completo.
                    </div>
                  </div>
                );

                return (criticos.length > 0 || oport.length > 0) && (
                  <div style={{ marginBottom:12 }}>
                    {criticos.length > 0 && (
                      <div style={{ background:C.red+"08", border:"1px solid "+C.red+"25", borderRadius:12, padding:"10px 14px", marginBottom:8 }}>
                        <div style={{ fontFamily:C.font, fontSize:9, color:C.red, letterSpacing:1, marginBottom:8 }}>
                          🔴 PUNTOS CRÍTICOS DETECTADOS ({criticos.length})
                        </div>
                        {criticos.map((c,i) => (
                          <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:5 }}>
                            <span style={{ fontSize:12 }}>{c.ico}</span>
                            <span style={{ fontFamily:C.font, fontSize:10, color:C.text, lineHeight:1.5 }}>{c.txt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {oport.length > 0 && (
                      <div style={{ background:C.amber+"08", border:"1px solid "+C.amber+"25", borderRadius:12, padding:"10px 14px" }}>
                        <div style={{ fontFamily:C.font, fontSize:9, color:C.amber, letterSpacing:1, marginBottom:8 }}>
                          ⚠ OPORTUNIDADES DE MEJORA ({oport.length})
                        </div>
                        {oport.map((c,i) => (
                          <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:5 }}>
                            <span style={{ fontSize:12 }}>{c.ico}</span>
                            <span style={{ fontFamily:C.font, fontSize:10, color:C.text, lineHeight:1.5 }}>{c.txt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!motor && (
                      <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginTop:8, textAlign:"center" }}>
                        Completá los pasos de CC, Forraje y Categorías para el diagnóstico completo con balance forrajero y proyección de preñez
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Fase del ciclo */}
              {motor?.cadena && <PanelFaseCiclo faseCiclo={calcFaseCiclo(motor.cadena, form,
                { tempHoy: sat?.temp ? parseFloat(sat.temp) : null,
                  ndviHoy: sat?.ndvi ? parseFloat(sat.ndvi) : null,
                  p30Hoy:  sat?.p30  ? parseFloat(sat.p30)  : null,
                  ccServ:  parseFloat(motor.tray?.ccServ || 0),
                  ccToros: parseFloat(form.torosCC || 0),
                  prenez:  motor.tray?.pr ?? 0,
                  mesesDeficit: motor.balanceMensual?.filter(m=>[5,6,7].includes(m.i)&&m.balance<0).length ?? 0,
                  peorBalanceMcal: motor.balanceMensual?.filter(m=>[5,6,7].includes(m.i)).reduce((mn,m)=>m.balance<(mn?.balance??0)?m:mn,null)?.balance ?? 0,
                  pvVaca:  parseFloat(form.pvVacaAdulta)||320,
                  nVacas:  parseFloat(form.vacasN)||0,
                  vaq1SinCorr: motor.vaq1E ? (motor.vaq1E?.gdpReal||0) < 200 : false,
                  vaq2Llega: motor.vaq2E?.llegas ?? true,
                  pvVaq2Falta: motor.vaq2E?.llegas ? 0 : (motor.vaq2E?.pvMinEntore||0)-(motor.vaq2E?.pvEntore||0),
                  balanceMesActual: motor.balanceMensual?.find(m=>m.i===new Date().getMonth())?.balance ?? 0,
                }
              )} />}

              {/* Tabla completa de parámetros con interpretación */}
              {(() => {
                const dx = diagnosticarSistema(motor, form);
                const MESES_C2 = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
                const smf2 = (v, ok, warn) => v >= ok ? C.green : v >= warn ? C.amber : C.red;

                // Secciones de diagnóstico
                const secciones = [
                  {
                    titulo: "­ƒôì Establecimiento",
                    filas: [
                      ["Productor",      form.nombreProductor || "—",                      null, ""],
                      ["Ubicación",      (form.localidad||"") + " · " + (form.provincia||"—"), null, ""],
                      ["Zona",           form.zona || "—",                                  null, ""],
                      ["Superficie",     form.supHa ? form.supHa + " ha" : "—",            null, ""],
                      ["Clima hoy",      sat?.temp ? sat.temp + "°C · NDVI " + sat.ndvi + " · Lluvia 30d " + sat.p30 + "mm" : "Sin datos satelitales", null, ""],
                    ]
                  },
                  {
                    titulo: "🐄 Rodeo",
                    filas: [
                      ["Biotipo",        form.biotipo || "—",                               null, ""],
                      ["Vacas",          (form.vacasN||"—") + " cab",                       null, ""],
                      ["Toros",          (form.torosN||"—") + " cab · CC " + (form.torosCC||"—"), form.torosCC ? smf2(parseFloat(form.torosCC),5.0,4.5) : null, form.torosCC < 4.5 ? "CC baja — revisar 35d antes del servicio" : ""],
                      ["Relación T:V",   form.vacasN && form.torosN ? Math.round(parseFloat(form.vacasN)/parseFloat(form.torosN)) + ":1" : "—", form.vacasN && form.torosN && parseFloat(form.vacasN)/parseFloat(form.torosN) > 30 ? C.amber : C.green, parseFloat(form.vacasN||0)/parseFloat(form.torosN||1) > 30 ? "Relación alta — riesgo de vacas no servidas" : "Relación adecuada"],
                      ["PV adulto",      form.pvVacaAdulta ? form.pvVacaAdulta + " kg" : "—", null, ""],
                      ["Preñez hist.",   form.prenez ? form.prenez + "%" : "—",             null, ""],
                      ["% Destete hist.",form.pctDestete ? form.pctDestete + "%" : "—",     null, ""],
                      ["Estado reprod.", form.eReprod || "—",                               null, ""],
                    ]
                  },
                  {
                    titulo: "📊 Condición corporal",
                    filas: [
                      ["CC ponderada hoy",    ccPondVal > 0 ? ccPondVal.toFixed(1) : "—",   ccPondVal > 0 ? smf2(ccPondVal, 4.5, 4.0) : null, ccPondVal <= 0 ? "Cargá la distribución CC en el paso 1" : ""],
                      ["CC proyectada parto", tray?.ccParto ? tray.ccParto.toFixed(1) : "—", tray?.ccParto ? smf2(tray.ccParto, 4.5, 4.0) : null, tray?.ccParto < 4.0 ? "Parto con CC baja → mayor anestro posparto" : ""],
                      ["CC mínima lactación", tray?.ccMinLact ? tray.ccMinLact.toFixed(1) : "—", tray?.ccMinLact ? smf2(tray.ccMinLact, 3.5, 3.0) : null, tray?.ccMinLact < 3.0 ? "Mínima crítica — mobilización excesiva" : ""],
                      ["CC al servicio",      tray?.ccServ ? tray.ccServ.toFixed(1) : "—",  tray?.ccServ ? smf2(tray.ccServ, 4.5, 4.0) : null, tray?.ccServ < 4.5 ? "⚠️ " + (tray?.recDestete?.label || "Por debajo del óptimo → revisar manejo de lactancia") : "✓ Ôptima"],
                      ["Con destete anticip.", tray?.ccServAntic ? tray.ccServAntic.toFixed(1) : "—", tray?.ccServAntic ? smf2(tray.ccServAntic, 4.5, 4.0) : null, tray?.gananciaPrAntic > 0 ? "+" + tray.gananciaPrAntic + "pp preñez vs situación actual" : ""],
                      ["Con hiperprecoz",      tray?.ccServHiper ? tray.ccServHiper.toFixed(1) : "—", tray?.ccServHiper ? smf2(tray.ccServHiper, 4.5, 4.0) : null, tray?.gananciaPrHiper > 0 ? "+" + tray.gananciaPrHiper + "pp preñez" : ""],
                    ]
                  },
                  {
                    titulo: "­ƒö¼ Reproducción",
                    filas: [
                      ["Preñez estimada",  tray?.pr != null ? tray.pr + "%" : "—",         tray?.pr != null ? smf2(tray.pr, 65, 45) : null, tray?.pr < 45 ? "Preñez baja — revisar CC, toros y anestro" : tray?.pr >= 75 ? "Excelente" : "Aceptable"],
                      ["Anestro posparto", tray?.anestro ? tray.anestro.dias + " días" : "—", tray?.anestro ? smf2(1/(tray.anestro.dias||90), 1/60, 1/90) : null, tray?.anestro?.dias > 90 ? "Anestro prolongado — clave para biotipo " + (form.biotipo||"") : ""],
                      ["Meses lactación",  tray?.mesesLact ? tray.mesesLact + " meses" : "—", null, ""],
                      ["Ini. servicio",    form.iniServ ? new Date(form.iniServ+"T12:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"}) : "—", null, ""],
                      ["Fin servicio",     form.finServ ? new Date(form.finServ+"T12:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"}) : "—", null, ""],
                      ["Duración servicio", cadena?.diasServ ? cadena.diasServ + " días" : "—", cadena?.diasServ ? (cadena.diasServ >= 75 && cadena.diasServ <= 90 ? C.green : C.amber) : null, cadena?.diasServ > 90 ? "Servicio largo → cola de preñez pesada" : ""],
                      ["Cabeza de parición", impactoCola ? impactoCola.cabeza + "%" : "—", impactoCola ? (impactoCola.cabeza >= 55 ? C.green : impactoCola.cabeza >= 40 ? C.amber : C.red) : null, impactoCola && impactoCola.cabeza < 55 ? "Subir al 60% → +" + impactoCola.kgDifPorTernero + " kg/ternero" : ""],
                      ["Peso dest. estimado", impactoCola ? impactoCola.pvPromDestete + " kg" : "—", null, impactoCola && impactoCola.kgDifPorTernero > 0 ? "Con 60% cabeza: " + impactoCola.pvPromObj + " kg (+"+impactoCola.kgDifPorTernero+" kg)" : ""],
                      ["Kg totales destete", impactoCola ? Math.round(impactoCola.pvPromDestete * impactoCola.terneros) + " kg" : "—", null, impactoCola && impactoCola.kgDifTotal > 0 ? "Potencial sin capturar: +" + impactoCola.kgDifTotal + " kg" : ""],
                    ]
                  },
                  {
                    titulo: "🌾 Forraje y balance",
                    filas: [
                      ["Vegetación",      form.vegetacion || "—",                           null, ""],
                      ["Fenología",       form.fenologia  || "—",                           null, ""],
                      ["NDVI hoy",        sat?.ndvi ? sat.ndvi + " (" + (sat.condForr||"—") + ")" : "—", sat?.ndvi ? smf2(parseFloat(sat.ndvi), 0.50, 0.35) : null, sat?.ndvi < 0.35 ? "Pasto escaso — confirmar con recorrida" : ""],
                      ["Balance jun",     balanceMensual[5]?.balance != null ? (balanceMensual[5].balance > 0 ? "+" : "") + Math.round(balanceMensual[5].balance) + " Mcal/día" : "—", balanceMensual[5]?.balance != null ? (balanceMensual[5].balance >= 0 ? C.green : C.red) : null, ""],
                      ["Balance jul",     balanceMensual[6]?.balance != null ? (balanceMensual[6].balance > 0 ? "+" : "") + Math.round(balanceMensual[6].balance) + " Mcal/día" : "—", balanceMensual[6]?.balance != null ? (balanceMensual[6].balance >= 0 ? C.green : C.red) : null, ""],
                      ["Balance ago",     balanceMensual[7]?.balance != null ? (balanceMensual[7].balance > 0 ? "+" : "") + Math.round(balanceMensual[7].balance) + " Mcal/día" : "—", balanceMensual[7]?.balance != null ? (balanceMensual[7].balance >= 0 ? C.green : C.red) : null, ""],
                      ["Carga EV/ha",     cargaEV_ha ? cargaEV_ha.toFixed(2) : "—",        null, ""],
                    ]
                  },
                  {
                    titulo: "🐃 Vaquillona",
                    filas: [
                      ["Reposición",      nVaqRepos + " cab (" + (form.pctReposicion||20) + "%)", null, ""],
                      ["Vaq1 — GDP inv.", vaq1E ? (vaq1E.gdpReal || 0) + " g/día" : "Sin datos", vaq1E ? smf2(vaq1E.gdpReal||0, 400, 250) : null, vaq1E && (vaq1E.gdpReal||0) < 400 ? "Por debajo del objetivo (533g/d) — suplemento proteico" : ""],
                      ["Vaq1 — PV salida",vaq1E?.pvSal ? vaq1E.pvSal + " kg" : "—",         null, ""],
                      ["Vaq2 — llega entore", vaq2E ? (vaq2E.llegas ? "Sí (" + Math.round(vaq2E.pvEntore||0) + "kg)" : "No (" + Math.round(vaq2E.pvEntore||0) + "/" + Math.round(vaq2E.pvMinEntore||0) + "kg)") : "Sin datos", vaq2E ? (vaq2E.llegas ? C.green : C.red) : null, vaq2E && !vaq2E.llegas ? "Entore comprometido — suplementar o postergar" : ""],
                    ]
                  },
                  {
                    titulo: "🏥 Sanidad",
                    filas: [
                      ["Aftosa",          form.sanAftosa    === "si" ? "Al día ✓" : "Sin vacunar", form.sanAftosa    === "si" ? C.green : C.red, form.sanAftosa !== "si" ? "Obligatorio legal" : ""],
                      ["Brucelosis",      form.sanBrucelosis=== "si" ? "Al día ✓" : "Sin vacunar", form.sanBrucelosis=== "si" ? C.green : C.red, form.sanBrucelosis !== "si" ? "Obligatorio legal + riesgo zoonótico" : ""],
                      ["IBR/DVB",         form.sanVacunas   === "si" ? "Al día ✓" : "Sin vacunar", form.sanVacunas   === "si" ? C.green : C.amber, form.sanVacunas !== "si" ? "→15pp preñez si sin vacunar (Gnemmi 2001)" : ""],
                      ["Rev. toros",      form.sanToros === "con_control" ? "Con revisión ✓" : "Sin revisión", form.sanToros === "con_control" ? C.green : C.red, form.sanToros !== "con_control" ? "Toro con lesión no detectada = 15-20 vacas vacías" : ""],
                      ["Historia abortos",form.sanAbortos   === "si" ? "Sí — investigar" : "No", form.sanAbortos === "si" ? C.amber : C.green, form.sanAbortos === "si" ? "Requiere diagnóstico etiológico" : ""],
                      ["Programa sanit.", form.sanPrograma  === "si" ? "Sí ✓" : "No", form.sanPrograma  === "si" ? C.green : C.amber, form.sanPrograma !== "si" ? "Sin programa estructurado — sanidad es el techo del sistema" : ""],
                    ]
                  },
                ];

                return (
                  <div>
                    {secciones.map(sec => (
                      <div key={sec.titulo} style={{ marginBottom:12 }}>
                        <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:6 }}>
                          {sec.titulo}
                        </div>
                        <div style={{ background:C.card2, border:"1px solid " + C.border, borderRadius:10, overflow:"hidden" }}>
                          {sec.filas.map(([label, valor, color, interp], fi) => (
                            <div key={fi} style={{
                              display:"flex", alignItems:"flex-start", gap:8, padding:"7px 12px",
                              borderBottom: fi < sec.filas.length-1 ? "1px solid " + C.border : "none",
                              background: fi % 2 === 0 ? "transparent" : C.card + "40",
                            }}>
                              <div style={{ flex:"0 0 130px", fontFamily:C.font, fontSize:9, color:C.textFaint }}>{label}</div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontFamily:C.font, fontSize:10, color:color || C.text, fontWeight: color ? 700 : 400 }}>
                                  {valor}
                                </div>
                                {interp && <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginTop:1 }}>{interp}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Alertas P1/P2 */}
                    {alertasMotor.length > 0 && (
                      <div style={{ marginTop:8 }}>
                        <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:6 }}>⚠️ ALERTAS DEL SISTEMA</div>
                        {alertasMotor.map((a,i) => (
                          <div key={i} style={{ display:"flex", gap:8, padding:"8px 12px", background:(a.tipo==="P1"?C.red:C.amber)+"08", border:"1px solid "+(a.tipo==="P1"?C.red:C.amber)+"25", borderRadius:8, marginBottom:5 }}>
                            <span style={{ fontFamily:C.font, fontSize:8, color:a.tipo==="P1"?C.red:C.amber, fontWeight:700, flexShrink:0 }}>{a.tipo}</span>
                            <span style={{ fontFamily:C.font, fontSize:10, color:C.text }}>{a.msg}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Subtab visitas de campo */}
                    <details style={{ marginTop:12 }}>
                      <summary style={{ fontFamily:C.font, fontSize:10, color:C.textDim, cursor:"pointer", padding:"10px 14px", background:C.card2, borderRadius:10, border:"1px solid " + C.border, listStyle:"none", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <span>📅 Visitas de campo</span><span>▼</span>
                      </summary>
                      <div style={{ marginTop:6 }}>
                        <div style={{ background:C.card2, border:"1px solid " + C.border, borderRadius:10, padding:12, marginBottom:8 }}>
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                            <Input label="FECHA" value={form._visitaFecha||""} onChange={v=>set("_visitaFecha",v)} type="date" />
                            <Input label="CC OBSERVADA" value={form._visitaCC||""} onChange={v=>set("_visitaCC",v)} type="number" placeholder="4.5" />
                          </div>
                          <Input label="OBSERVACIÔN" value={form._visitaObs||""} onChange={v=>set("_visitaObs",v)} placeholder="Vacas con buena cobertura, pasto escaso en potrero N…" />
                          <button onClick={() => {
                            if (!form._visitaFecha) return;
                            const nueva = { fecha:form._visitaFecha, cc:form._visitaCC||"", obs:form._visitaObs||"" };
                            set("visitasCampo", [...(form.visitasCampo||[]), nueva]);
                            set("_visitaFecha",""); set("_visitaCC",""); set("_visitaObs","");
                          }} style={{ width:"100%", background:C.green+"15", border:"1px solid "+C.green+"40", borderRadius:8, color:C.green, padding:10, fontFamily:C.font, fontSize:11, cursor:"pointer", marginTop:6 }}>
                            + Registrar visita
                          </button>
                        </div>
                        {(form.visitasCampo||[]).length > 0 && (
                          <div>
                            {[...(form.visitasCampo||[])].reverse().slice(0,5).map((v,i) => (
                              <div key={i} style={{ padding:"8px 12px", background:C.card2, border:"1px solid "+C.border, borderRadius:8, marginBottom:4 }}>
                                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                                  <span style={{ fontFamily:C.font, fontSize:10, color:C.text }}>{v.fecha}</span>
                                  {v.cc && <span style={{ fontFamily:C.font, fontSize:10, color:C.amber }}>CC {v.cc}</span>}
                                </div>
                                {v.obs && <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>{v.obs}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ═══ TAB BALANCE ═══ */}
          {tab === "balance" && (() => {
            const MESES_C = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
            const mesHoy  = new Date().getMonth();
            // Usar balanceMensual del scope raíz (siempre tiene fallback [])
            // No usar motor?.balanceMensual que puede ser undefined entre renders
            const bm = balanceMensual; // del scope: motor?.balanceMensual ?? []

            // ── Datos mínimos para el balance ─────────────────────────
            const faltaMin = [];
            if (!form.provincia) faltaMin.push("provincia");
            if (!form.vacasN)    faltaMin.push("cantidad de vacas");
            if (!form.biotipo)   faltaMin.push("biotipo");

            if (!bm || bm.length === 0) {
              if (faltaMin.length > 0) {
                return (
                  <div style={{ background:C.card2, border:"1px solid "+C.amber+"40",
                    borderRadius:12, padding:"20px 16px", textAlign:"center" }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>📊</div>
                    <div style={{ fontFamily:C.font, fontSize:11, color:C.amber, marginBottom:8, fontWeight:700 }}>
                      Completá para ver el balance
                    </div>
                    {faltaMin.map(f => (
                      <div key={f} style={{ fontFamily:C.font, fontSize:10, color:C.amber, marginBottom:4 }}>⚠️ Falta: {f}</div>
                    ))}
                  </div>
                );
              }
              // Motor cargando → spinner
              return (
                <div style={{ padding:40, textAlign:"center" }}>
                  <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:12 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width:8, height:8, borderRadius:4, background:C.green,
                        animation:"pulse 1.2s ease-in-out "+(i*0.2)+"s infinite" }} />
                    ))}
                  </div>
                  <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint }}>
                    Calculando balance...
                  </div>
                  <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginTop:6 }}>
                    Para debug: escribí <code>window.__calfDebug=true</code> en consola (F12) y recargá
                  </div>
                </div>
              );
            }

            const vals      = bm.map(m => m.balance ?? 0);
            const maxAbs    = Math.max(1, ...vals.map(Math.abs));
            // Si todos los valores son 0 o muy pequeños → faltan datos de rodeo
            const sinDatosRodeo = maxAbs < 5 && !form.vacasN;
            const invM      = [5,6,7].map(i => ({ mes:MESES_C[i], i, bal: bm[i]?.balance ?? null }));
            const defCnt    = invM.filter(m => m.bal !== null && m.bal < 0).length;
            const W = 340, H = 140, padX = 20, colW = (W - padX*2) / 12;
            const barW      = colW - 3;
            const midY      = H / 2 - 8;
            const suplMeses = (form.suplMeses || ["5","6","7"]).map(Number);
            const haySupl   = bm.some(m => (m.suplAporte||0) > 0);
            const maxSuplMes= Math.max(0, ...bm.map(m => m.suplAporte||0));

            return (
              <div>
                {/* ── Aviso si faltan datos críticos ── */}
                {sinDatosRodeo && (
                  <div style={{ background:C.amber+"0d", border:"1px solid "+C.amber+"30",
                    borderRadius:8, padding:"8px 12px", marginBottom:10,
                    fontFamily:C.font, fontSize:9, color:C.amber }}>
                    ⚠️ Cargá la cantidad de vacas y el biotipo en el Paso 0 para ver el balance completo
                  </div>
                )}
                {/* ── Panel diagnóstico del suplemento ── */}
                <div style={{ background: haySupl ? C.blue+"0d" : C.amber+"0d",
                  border:"1px solid "+(haySupl ? C.blue+"30" : C.amber+"30"),
                  borderRadius:10, padding:"8px 12px", marginBottom:10,
                  display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ fontFamily:C.font, fontSize:9,
                      color:haySupl?C.blue:C.amber, fontWeight:700, marginBottom:2 }}>
                      {haySupl
                        ? "💊 Suplemento activo — " + suplMeses.map(m=>MESES_C[m]).join(" · ")
                        : "⚠️ Meses seleccionados pero sin suplemento cargado por categoría"}
                    </div>
                    <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>
                      {haySupl
                        ? "Aporte máx: " + Math.round(maxSuplMes) + " Mcal/día · " + suplMeses.length + " mes" + (suplMeses.length>1?"es":"") + " · barra azul = aporte del suplemento"
                        : "Paso 1 → Suplementación → cargá tipo y dosis por categoría para ver el efecto en el balance"}
                    </div>
                  </div>
                  {haySupl && (
                    <div style={{ fontFamily:C.font, fontSize:20, fontWeight:700,
                      color:C.blue, flexShrink:0, marginLeft:8 }}>
                      +{Math.round(maxSuplMes)}M
                    </div>
                  )}
                </div>

                {/* ── BALANCE MENSUAL — Recharts ── */}
                <div style={{ background:C.card2, border:"1px solid "+C.border, borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
                  <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:4 }}>
                    BALANCE ENERGÉTICO MENSUAL — Mcal/día · oferta vs demanda rodeo
                  </div>
                  {/* Panel diagnóstico suplemento */}
                  <div style={{ background: haySupl ? "#4a9fd410" : C.amber+"0d", border:"1px solid "+(haySupl?"#4a9fd430":C.amber+"30"), borderRadius:8, padding:"6px 10px", marginBottom:8, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ fontFamily:C.font, fontSize:9, color:haySupl?"#4a9fd4":C.amber, fontWeight:700 }}>
                      {haySupl ? `💊 Suplemento activo — ${suplMeses.map(m=>["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][m]).join(" · ")}` : "⚠️ Sin suplemento cargado para los meses invernales"}
                    </div>
                    {haySupl && <div style={{ fontFamily:C.font, fontSize:14, fontWeight:700, color:"#4a9fd4" }}>+{Math.round(maxSuplMes)}M</div>}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={bm.map(m => ({
                      mes: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][m.i],
                      pasto: Math.max(0, Math.min(m.ofPastoTotal||0, m.demanda||0)),
                      cc: Math.max(0, m.ccAporte||0),
                      supl: Math.max(0, m.suplAporte||0),
                      verdeo: Math.max(0, m.verdeoAporte||0),
                      demanda: m.demanda||0,
                      balance: m.balance||0,
                      inv: [5,6,7].includes(m.i) ? (m.demanda||0) : 0,
                    }))} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                      <XAxis dataKey="mes" tick={{ fill:C.textFaint, fontSize:9, fontFamily:C.font }} />
                      <YAxis tick={{ fill:C.textFaint, fontSize:9, fontFamily:C.font }} />
                      <Tooltip
                        contentStyle={{ background:C.card, border:"1px solid "+C.border, borderRadius:8, fontFamily:C.font, fontSize:10 }}
                        formatter={(v,n) => [Math.round(v)+" Mcal", n]}
                      />
                      <Bar dataKey="inv" fill={C.amber+"15"} stackId="bg" barSize={0} />
                      <Bar dataKey="pasto"  name="Pasto"       stackId="of" fill="#378ADD" fillOpacity={0.85} radius={[0,0,0,0]} />
                      <Bar dataKey="cc"     name="CC mob."     stackId="of" fill={C.green}  fillOpacity={0.7} />
                      <Bar dataKey="supl"   name="Suplemento"  stackId="of" fill="#4a9fd4"  fillOpacity={0.9} />
                      <Bar dataKey="verdeo" name="Verdeo"      stackId="of" fill="#97C459"  fillOpacity={0.9} />
                      <Line dataKey="demanda" name="Demanda" type="monotone" stroke={C.red} strokeWidth={2} strokeDasharray="5 3" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  {/* Leyenda */}
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:6, justifyContent:"center" }}>
                    {[["Pasto","#378ADD"],["CC mob.",C.green],["Suplemento","#4a9fd4"],["Verdeo","#97C459"],["Demanda",C.red]].map(([l,c])=>(
                      <div key={l} style={{ display:"flex", alignItems:"center", gap:4, fontFamily:C.font, fontSize:8, color:C.textFaint }}>
                        <div style={{ width:10, height:10, borderRadius:2, background:c }} />{l}
                      </div>
                    ))}
                  </div>
                  {/* Tarjetas invernales */}
                  <div style={{ display:"flex", gap:6, marginTop:10 }}>
                    {invM.map(({ mes, bal }) => {
                      const ok  = bal !== null && bal >= 0;
                      const col = bal === null ? C.textFaint : ok ? C.green : C.red;
                      return (
                        <div key={mes} style={{ flex:1, background:col+"10", border:"1px solid "+col+"40", borderRadius:8, padding:"6px 4px", textAlign:"center" }}>
                          <div style={{ fontFamily:C.font, fontSize:9, color:col, fontWeight:700 }}>{mes}</div>
                          <div style={{ fontFamily:C.font, fontSize:12, color:col, fontWeight:700, marginTop:2 }}>
                            {bal !== null ? (bal>0?"+":"")+Math.round(bal) : "—"}
                          </div>
                          <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>Mcal/d</div>
                          <div style={{ fontFamily:C.font, fontSize:7, color:col, marginTop:2, fontWeight:700 }}>
                            {bal === null ? "sin dato" : ok ? "✓" : "DÉFICIT"}
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ flex:1.4, background:(defCnt===0?C.green:defCnt===1?C.amber:C.red)+"10", border:"1px solid "+(defCnt===0?C.green:defCnt===1?C.amber:C.red)+"40", borderRadius:8, padding:"6px 8px" }}>
                      <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>INVIERNO</div>
                      <div style={{ fontFamily:C.font, fontSize:18, fontWeight:700, lineHeight:1, color:defCnt===0?C.green:defCnt===1?C.amber:C.red }}>
                        {defCnt===0 ? "✓" : defCnt+"/3"}
                      </div>
                      <div style={{ fontFamily:C.font, fontSize:8, color:defCnt===0?C.green:C.red, marginTop:3 }}>
                        {defCnt===0 ? "Sin déficit" : "meses c/déficit"}
                      </div>
                    </div>
                  </div>
                  {(!form.supHa) && (
                    <div style={{ fontFamily:C.font, fontSize:8, color:C.amber, marginTop:6 }}>
                      ⚠️ Sin superficie cargada — agreg á ha para mayor precisión
                    </div>
                  )}
                </div>

                {/* ── GRÁFICO DETALLADO (GraficoBalance) ── */}
                <GraficoBalance form={form} sat={sat} cadena={cadena} tray={tray} motor={motor} />

                {/* ── TRAYECTORIA CC ── */}
                <TrayectoriaVaquillona motor={motor} form={form} />

                {/* ── ESCENARIOS CC ── */}
                {tray && cadena && (
                  <GraficoCCEscenarios
                    escenarios={[
                      { label:"Sin cambios", tray:tray, color:C.amber },
                      { label:"Con destete precoz",
                        tray:{...tray, ccMinLact:Math.min((tray.ccMinLact||3.5)+0.3, tray.ccParto||4.5)},
                        color:C.green },
                    ]}
                    cadena={cadena} mesesLact={tray.mesesLact || 6} form={form} sat={sat}
                  />
                )}

                {/* ── GRÁFICO: ENERGÍA POR FUENTE (apilado) ── */}
                {bm.length === 12 && (() => {
                  const W=340, H=160, padX=18, padY=14, colW=(W-padX*2)/12;
                  // Calcular máximo para escalar
                  const maxOf = Math.max(1, ...bm.map(m => (m.ofPastoTotal||0)+(m.suplAporte||0)+(m.verdeoAporte||0)+(m.ccAporte||0)));
                  const maxDem = Math.max(1, ...bm.map(m => m.demanda||0));
                  const maxY = Math.max(maxOf, maxDem) * 1.1;
                  const MESES_C = ["E","F","M","A","M","J","J","A","S","O","N","D"];
                  const yOf = (v) => padY + (H - padY*2) * (1 - v / maxY);
                  const yH = H - padY;
                  return (
                    <div style={{ background:C.card2, border:"1px solid "+C.border, borderRadius:12, padding:"12px 14px", marginTop:10 }}>
                      <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:4 }}>
                        ENERGÍA POR FUENTE — Mcal/día · de dónde viene la oferta cada mes
                      </div>
                      <div style={{ display:"flex", gap:12, marginBottom:8, flexWrap:"wrap" }}>
                        {[
                          ["Pasto C4",  "#378ADD"],
                          ["CC vaca",   "#7ec850"],
                          ["Suplemento","#4a9fd4"],
                          ["Verdeo",    "#97C459"],
                          ["Demanda",   "#e8a030"],
                        ].map(([l,c]) => (
                          <div key={l} style={{ display:"flex", alignItems:"center", gap:4, fontFamily:C.font, fontSize:8, color:C.textFaint }}>
                            <div style={{ width:8, height:8, borderRadius:1, background:c }} />
                            {l}
                          </div>
                        ))}
                      </div>
                      <svg viewBox={"0 0 "+W+" "+H} style={{ width:"100%", display:"block" }}>
                        {/* Fondo invierno */}
                        {[5,6,7].map(i => (
                          <rect key={i} x={padX+i*colW} y={padY} width={colW} height={H-padY*2} fill={C.amber+"08"} />
                        ))}
                        {/* Línea cero */}
                        <line x1={padX} y1={yH} x2={W-padX} y2={yH} stroke={C.textFaint} strokeWidth="0.5" />

                        {/* Barras apiladas por fuente */}
                        {bm.map((m, i) => {
                          const x   = padX + i * colW + 1;
                          const bw  = colW - 2;
                          const pasto  = m.ofPastoTotal || 0;
                          const cc     = Math.max(0, m.ccAporte || 0);
                          const supl   = m.suplAporte   || 0;
                          const verd   = m.verdeoAporte || 0;
                          const total  = pasto + cc + supl + verd;
                          // Apilar desde abajo
                          let yBase = yH;
                          const capas = [
                            { v: pasto, c: "#378ADD" },
                            { v: cc,    c: "#7ec850" },
                            { v: supl,  c: "#4a9fd4" },
                            { v: verd,  c: "#97C459" },
                          ];
                          return (
                            <g key={i}>
                              {capas.map((cap, ci) => {
                                if (cap.v <= 0) return null;
                                const h = Math.max(0, (H - padY*2) * cap.v / maxY);
                                yBase -= h;
                                return <rect key={ci} x={x} y={yBase} width={bw} height={h} fill={cap.c+"cc"} />;
                              })}
                              {/* Etiqueta mes */}
                              <text x={x+bw/2} y={H-2} textAnchor="middle"
                                style={{ fontFamily:C.font, fontSize:"6px",
                                  fill: i===new Date().getMonth() ? C.green : [5,6,7].includes(i) ? C.amber : C.textFaint,
                                  fontWeight: [5,6,7].includes(i) ? "700" : "400" }}>
                                {MESES_C[i]}
                              </text>
                            </g>
                          );
                        })}

                        {/* Línea de demanda */}
                        <polyline
                          points={bm.map((m,i) => `${padX+i*colW+colW/2},${yOf(m.demanda||0)}`).join(" ")}
                          fill="none" stroke={C.amber} strokeWidth="1.5" strokeDasharray="3,2"
                        />
                        {/* Leyenda demanda */}
                        <text x={W-padX-2} y={padY+8} textAnchor="end"
                          style={{ fontFamily:C.font, fontSize:"6px", fill:C.amber }}>── demanda</text>
                      </svg>
                    </div>
                  );
                })()}

                {/* ── GRÁFICO: CC + PREÑEZ COMPARADO (sin corrección vs con corrección) ── */}
                {tray && (() => {
                  const fases = ["Tacto/Parto","Mín. Lact.","Destete","Servicio"];
                  const sinCorr = [tray.ccParto||0, tray.ccMinLact||0, tray.ccDestete||0, tray.ccServ||0];
                  const conAntic = [tray.ccParto||0, Math.min((tray.ccMinLact||0)+0.4, tray.ccParto||0), (tray.ccDestete||0)+0.3, tray.ccServAntic||tray.ccServ||0];
                  const conHiper = [tray.ccParto||0, Math.min((tray.ccMinLact||0)+0.7, tray.ccParto||0), (tray.ccDestete||0)+0.5, tray.ccServHiper||tray.ccServ||0];
                  const allVals = [...sinCorr, ...conAntic, ...conHiper];
                  const minCC = Math.max(0, Math.min(...allVals) - 0.5);
                  const maxCC = Math.min(9, Math.max(...allVals) + 0.5);
                  const W=340, H=140, padL=28, padR=12, padT=14, padB=20;
                  const gW = W - padL - padR;
                  const gH = H - padT - padB;
                  const xOf = (i) => padL + i * gW / (fases.length - 1);
                  const yOf = (v) => padT + gH * (1 - (v - minCC) / (maxCC - minCC));
                  const path = (arr) => arr.map((v,i) => `${i===0?"M":"L"}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(" ");

                  // Preñez estimada por CC al servicio
                  const interpPrenez = (cc) => cc >= 5.5 ? 93 : cc >= 5.0 ? 88 : cc >= 4.5 ? 80 : cc >= 4.0 ? 70 : cc >= 3.5 ? 50 : 28;
                  const prSin   = interpPrenez(tray.ccServ || 0);
                  const prAntic = interpPrenez(tray.ccServAntic || tray.ccServ || 0);
                  const prHiper = interpPrenez(tray.ccServHiper || tray.ccServ || 0);
                  const hayCambio = prAntic > prSin || prHiper > prSin;

                  return (
                    <div style={{ background:C.card2, border:"1px solid "+C.border, borderRadius:12, padding:"12px 14px", marginTop:10 }}>
                      <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:4 }}>
                        TRAYECTORIA CC — escenarios de corrección y efecto en preñez
                      </div>
                      <div style={{ display:"flex", gap:12, marginBottom:6, flexWrap:"wrap" }}>
                        {[["Sin corrección",C.red],["Dest. anticipado",C.amber],["Hiperprecoz",C.green]].map(([l,c]) => (
                          <div key={l} style={{ display:"flex", alignItems:"center", gap:4, fontFamily:C.font, fontSize:8, color:C.textFaint }}>
                            <div style={{ width:16, height:2, background:c }} />{l}
                          </div>
                        ))}
                      </div>
                      <svg viewBox={"0 0 "+W+" "+H} style={{ width:"100%", display:"block" }}>
                        {/* Zona mínima 4.5 */}
                        <rect x={padL} y={yOf(4.5)} width={gW} height={H-padB-yOf(4.5)}
                          fill={C.red+"08"} />
                        <line x1={padL} y1={yOf(4.5)} x2={W-padR} y2={yOf(4.5)}
                          stroke={C.red} strokeWidth="0.8" strokeDasharray="3,3" />
                        <text x={W-padR-2} y={yOf(4.5)-3} textAnchor="end"
                          style={{ fontFamily:C.font, fontSize:"6px", fill:C.red }}>mín 4.5</text>

                        {/* Eje Y */}
                        {[3.5,4.0,4.5,5.0,5.5].filter(v => v >= minCC && v <= maxCC).map(v => (
                          <g key={v}>
                            <line x1={padL-3} y1={yOf(v)} x2={padL} y2={yOf(v)} stroke={C.textFaint} strokeWidth="0.5" />
                            <text x={padL-5} y={yOf(v)+3} textAnchor="end"
                              style={{ fontFamily:C.font, fontSize:"6px", fill:C.textFaint }}>{v.toFixed(1)}</text>
                          </g>
                        ))}

                        {/* Líneas de escenarios */}
                        <path d={path(sinCorr)}  fill="none" stroke={C.red}   strokeWidth="2" />
                        <path d={path(conAntic)}  fill="none" stroke={C.amber} strokeWidth="1.5" strokeDasharray="5,3" />
                        <path d={path(conHiper)}  fill="none" stroke={C.green} strokeWidth="1.5" strokeDasharray="5,3" />

                        {/* Puntos al servicio con preñez */}
                        {[
                          { v:sinCorr[3],  pr:prSin,   c:C.red,   label:"Sin corr." },
                          { v:conAntic[3], pr:prAntic, c:C.amber, label:"Anticipado" },
                          { v:conHiper[3], pr:prHiper, c:C.green, label:"Hiperprecoz" },
                        ].map((sc, i) => (
                          <g key={i}>
                            <circle cx={xOf(3)} cy={yOf(sc.v)} r={4} fill={sc.c} />
                            <text x={xOf(3)+6+i*2} y={yOf(sc.v)+(i-1)*12}
                              style={{ fontFamily:C.font, fontSize:"7px", fill:sc.c, fontWeight:"700" }}>
                              {sc.pr}%
                            </text>
                          </g>
                        ))}

                        {/* Etiquetas fases */}
                        {fases.map((f, i) => (
                          <text key={i} x={xOf(i)} y={H-4} textAnchor="middle"
                            style={{ fontFamily:C.font, fontSize:"6.5px", fill:C.textFaint }}>
                            {f}
                          </text>
                        ))}
                      </svg>
                      {hayCambio && (
                        <div style={{ fontFamily:C.font, fontSize:9, color:C.green, marginTop:6 }}>
                          ✓ Con destete anticipado: preñez {prAntic}% (+{prAntic-prSin}pp) · Con hiperprecoz: {prHiper}% (+{prHiper-prSin}pp)
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── GRÁFICO: EFECTO DEL SUPLEMENTO EN GDP VAQUILLONA ── */}
                {motor?.vaq1E && (() => {
                  const gdpSin  = motor.vaq1E.gdpReal   || 0;
                  const gdpCon  = motor.vaq1E.gdpRecom  || 300;
                  const gdpObj  = 300;
                  const pvIni   = motor.pvEntVaq1        || Math.round((parseFloat(form.pvVacaAdulta)||320)*0.40);
                  const pvObj   = Math.round((parseFloat(form.pvVacaAdulta)||320)*0.65);
                  // Proyectar PV mes a mes Mayo→Agosto (4 meses)
                  const meses   = ["May","Jun","Jul","Ago"];
                  const pvSin   = meses.map((_,i) => Math.round(pvIni + gdpSin/1000*30*(i+1)));
                  const pvCon   = meses.map((_,i) => Math.round(pvIni + gdpCon/1000*30*(i+1)));
                  const pvMax   = Math.max(pvObj + 20, ...pvCon);
                  const pvMin   = pvIni - 10;
                  const W=340, H=130, padL=32, padR=12, padT=10, padB=18;
                  const gW = W-padL-padR, gH = H-padT-padB;
                  const n   = meses.length;
                  const xOf = (i) => padL + i * gW / (n-1);
                  const yOf = (v) => padT + gH * (1 - (v-pvMin)/(pvMax-pvMin));
                  const llegaSin = pvSin[n-1] >= pvObj;
                  const llegaCon = pvCon[n-1] >= pvObj;
                  return (
                    <div style={{ background:C.card2, border:"1px solid "+C.border, borderRadius:12, padding:"12px 14px", marginTop:10 }}>
                      <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:4 }}>
                        VAQUILLONA 1° INV — PV proyectado May→Ago con y sin suplemento
                      </div>
                      <div style={{ display:"flex", gap:12, marginBottom:6 }}>
                        {[["Sin supl.",C.red],["Con supl.",C.green],["Obj. entore",C.amber]].map(([l,c]) => (
                          <div key={l} style={{ display:"flex", alignItems:"center", gap:4, fontFamily:C.font, fontSize:8, color:C.textFaint }}>
                            <div style={{ width:16, height:2, background:c }} />{l}
                          </div>
                        ))}
                      </div>
                      <svg viewBox={"0 0 "+W+" "+H} style={{ width:"100%", display:"block" }}>
                        {/* Línea objetivo */}
                        <line x1={padL} y1={yOf(pvObj)} x2={W-padR} y2={yOf(pvObj)}
                          stroke={C.amber} strokeWidth="1" strokeDasharray="4,3" />
                        <text x={W-padR-2} y={yOf(pvObj)-3} textAnchor="end"
                          style={{ fontFamily:C.font, fontSize:"6px", fill:C.amber }}>{pvObj}kg (entore)</text>

                        {/* Zona deficit */}
                        <rect x={padL} y={yOf(pvObj)} width={gW} height={H-padB-yOf(pvObj)}
                          fill={C.red+"06"} />

                        {/* Eje Y */}
                        {[pvMin+10, Math.round((pvMin+pvMax)/2), pvMax-10].map(v => (
                          <g key={v}>
                            <text x={padL-4} y={yOf(v)+3} textAnchor="end"
                              style={{ fontFamily:C.font, fontSize:"6px", fill:C.textFaint }}>{Math.round(v)}</text>
                          </g>
                        ))}

                        {/* Línea sin suplemento */}
                        <polyline points={pvSin.map((v,i)=>`${xOf(i)},${yOf(v)}`).join(" ")}
                          fill="none" stroke={C.red} strokeWidth="2" />
                        {pvSin.map((v,i) => <circle key={i} cx={xOf(i)} cy={yOf(v)} r={3} fill={C.red} />)}

                        {/* Línea con suplemento */}
                        <polyline points={pvCon.map((v,i)=>`${xOf(i)},${yOf(v)}`).join(" ")}
                          fill="none" stroke={C.green} strokeWidth="2" />
                        {pvCon.map((v,i) => <circle key={i} cx={xOf(i)} cy={yOf(v)} r={3} fill={C.green} />)}

                        {/* PV agosto — resultado */}
                        <text x={xOf(n-1)+4} y={yOf(pvSin[n-1])+3}
                          style={{ fontFamily:C.font, fontSize:"7px", fill:C.red, fontWeight:"700" }}>
                          {pvSin[n-1]}kg {llegaSin?"✓":"✗"}
                        </text>
                        <text x={xOf(n-1)+4} y={yOf(pvCon[n-1])-4}
                          style={{ fontFamily:C.font, fontSize:"7px", fill:C.green, fontWeight:"700" }}>
                          {pvCon[n-1]}kg {llegaCon?"✓":"✗"}
                        </text>

                        {/* Etiquetas eje X */}
                        {meses.map((m,i) => (
                          <text key={i} x={xOf(i)} y={H-3} textAnchor="middle"
                            style={{ fontFamily:C.font, fontSize:"7px", fill:C.textFaint }}>{m}</text>
                        ))}
                      </svg>
                      <div style={{ fontFamily:C.font, fontSize:9, marginTop:6,
                        color: llegaCon ? C.green : C.red }}>
                        GDP sin supl: {gdpSin} g/d · Con supl: {gdpCon} g/d ·
                        {llegaCon ? ` ✓ Llega al entore (${pvCon[n-1]} kg)` : ` ✗ No llega al entore sin corrección (${pvCon[n-1]} kg vs ${pvObj} kg objetivo)`}
                      </div>
                    </div>
                  );
                })()}

              </div>
            );
          })()}


          {/* ═══ TAB GEI ═══ */}
          {tab === "gei" && (
            <PanelGEI form={form} motor={motor} tray={tray} sat={sat} />
          )}

          {/* ═══ TAB CEREBRO ═══ */}
          {tab === "cerebro" && (
            <div>

              {/* ── 1. RESUMEN DE DATOS CARGADOS — qué sabe el sistema ── */}
              <div style={{ background:C.card2, border:"1px solid "+C.border,
                borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint,
                  letterSpacing:1, marginBottom:8 }}>
                  DATOS CARGADOS — lo que alimenta el análisis
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 12px" }}>
                  {[
                    ["Establecimiento", form.nombreProductor || "—"],
                    ["Provincia", form.provincia || "⚠️ sin dato"],
                    ["Biotipo", form.biotipo || "⚠️ sin dato"],
                    ["Vacas", form.vacasN ? form.vacasN+" cab" : "⚠️ sin dato"],
                    ["PV adulto", form.pvVacaAdulta ? form.pvVacaAdulta+" kg" : "estimado 320 kg *"],
                    ["CC ponderada", motor?.ccPondVal > 0 ? motor.ccPondVal.toFixed(1)+" (escala 1-9)" : "⚠️ sin dato"],
                    ["Servicio", (form.iniServ && form.finServ)
                      ? new Date(form.iniServ+"T12:00").toLocaleDateString("es-AR",{month:"short"})+" → "+
                        new Date(form.finServ+"T12:00").toLocaleDateString("es-AR",{month:"short",year:"2-digit"})
                      : "⚠️ sin fechas"],
                    ["Superficie", form.supHa ? form.supHa+" ha" : "estimada *"],
                    ["Vegetación", form.vegetacion || "⚠️ sin dato"],
                    ["NDVI hoy", sat?.ndvi ? sat.ndvi+" ("+sat.condForr+")" : "sin GPS/provincia"],
                    ["Supl. cargado", (form.supl1||form.supl_vacas) ? "Sí" : "No"],
                    ["Vaquillona", (form.edadVaqMayo||form.vaq1PV) ? "Con datos" : "Sin datos *"],
                  ].map(([k,v]) => (
                    <div key={k} style={{ display:"flex", justifyContent:"space-between",
                      padding:"3px 0", borderBottom:"1px solid "+C.border+"50" }}>
                      <span style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>{k}</span>
                      <span style={{ fontFamily:C.font, fontSize:9,
                        color: v.includes("⚠️") ? C.amber : v.includes("*") ? C.textDim : C.text }}>
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                {(!form.pvVacaAdulta || !form.supHa || !form.edadVaqMayo) && (
                  <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginTop:6 }}>
                    * Datos marcados se estimaron con valores típicos NEA — cargalos para mayor precisión
                  </div>
                )}
              </div>

              {/* ── 2. BALANCE INVERNAL — mini gráfico siempre visible ── */}
              {motor?.balanceMensual?.length > 0 && (() => {
                const bm = motor.balanceMensual;
                const MESES_C2 = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
                const mesHoyC  = new Date().getMonth();
                const vals2    = bm.map(m => m.balance ?? 0);
                const maxAbs2  = Math.max(1, ...vals2.map(Math.abs));
                const W2=320, H2=90, pad2=16, barW2=(W2-pad2*2)/12-2;
                return (
                  <div style={{ background:C.card2, border:"1px solid "+C.border,
                    borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
                    <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint,
                      letterSpacing:1, marginBottom:6 }}>
                      BALANCE FORRAJERO MENSUAL (Mcal/día)
                    </div>
                    <svg viewBox={"0 0 "+W2+" "+H2} style={{ width:"100%", display:"block" }}>
                      <line x1={pad2} y1={H2/2} x2={W2-pad2} y2={H2/2}
                        stroke={C.border} strokeWidth="1" />
                      {bm.map((m,i) => {
                        const x2   = pad2 + i*((W2-pad2*2)/12);
                        const pct2 = Math.min(1, Math.abs(m.balance??0)/maxAbs2);
                        const pos2 = (m.balance??0) >= 0;
                        const bH2  = Math.max(2, pct2*(H2/2-8));
                        const y2   = pos2 ? H2/2-bH2 : H2/2;
                        const col2 = pos2 ? C.green : C.red;
                        const cur2 = i === mesHoyC;
                        return (
                          <g key={i}>
                            {cur2 && <rect x={x2-1} y={4} width={barW2+4} height={H2-10}
                              fill={C.green+"08"} rx={2} />}
                            <rect x={x2+1} y={y2} width={barW2} height={bH2}
                              fill={col2+(cur2?"ff":"88")} rx={2} />
                            <text x={x2+barW2/2} y={H2-2} textAnchor="middle"
                              style={{ fontFamily:C.font, fontSize:"6px",
                                fill: cur2 ? C.green : C.textFaint }}>
                              {MESES_C2[i]}
                            </text>
                          </g>
                        );
                      })}
                      <text x={pad2} y={10} style={{ fontFamily:C.font, fontSize:"7px", fill:C.green }}>
                        ▓ Superávit
                      </text>
                      <text x={W2-pad2} y={H2-10} textAnchor="end"
                        style={{ fontFamily:C.font, fontSize:"7px", fill:C.red }}>
                        ▼ Déficit
                      </text>
                    </svg>
                    <div style={{ display:"flex", gap:4, marginTop:6 }}>
                      {[5,6,7].map(i => {
                        const b2 = bm[i];
                        const ok2 = (b2?.balance??0) >= 0;
                        const MESES_C2b = ["Jun","Jul","Ago"];
                        return (
                          <div key={i} style={{ flex:1, background:(ok2?C.green:C.red)+"12",
                            border:"1px solid "+(ok2?C.green:C.red)+"40",
                            borderRadius:6, padding:"4px 6px", textAlign:"center" }}>
                            <div style={{ fontFamily:C.font, fontSize:8,
                              color:ok2?C.green:C.red, fontWeight:700 }}>
                              {MESES_C2b[i-5]}
                            </div>
                            <div style={{ fontFamily:C.font, fontSize:9,
                              color:ok2?C.green:C.red, fontWeight:700 }}>
                              {b2 ? (b2.balance>0?"+":"")+Math.round(b2.balance) : "—"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ── 3. TARJETAS POR DIMENSIÔN — estado del sistema ── */}
              <TabCerebro motor={motor} form={form} sat={sat} />

              {/* ── 4. INFORME IA ── */}
              <div style={{ marginTop:14 }}>
                {!result && !loading && (
                  <div>
                    <button onClick={runAnalysis}
                      style={{ width:"100%", background:C.green, color:"#0b1a0c",
                        padding:16, borderRadius:14, border:"none",
                        fontFamily:C.font, fontSize:14, fontWeight:700,
                        cursor:"pointer", letterSpacing:1, marginBottom:8 }}>
                      ⚡ GENERAR INFORME TÉCNICO COMPLETO
                    </button>
                    <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, textAlign:"center" }}>
                      La IA analiza score, fase del ciclo, balance, vaquillona y sanidad —
                      produce el diagnóstico integrado con cuantificación de mejoras
                    </div>
                  </div>
                )}
                {loading && <LoadingPanel msg={loadMsg} />}
                {result && !loading && (
                  <div>
                    {/* ── Gráfico de balance integrado con el informe ── */}
                    {motor?.balanceMensual?.length > 0 && (() => {
                      const bm = motor.balanceMensual;
                      const MC = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
                      const mH = new Date().getMonth();
                      const vs = bm.map(m => m.balance ?? 0);
                      const mx = Math.max(1, ...vs.map(Math.abs));
                      const W=320, H=80, px=16, bw=(W-px*2)/12-2;
                      const midY = H/2 - 6;
                      return (
                        <div style={{ background:C.card2, border:"1px solid "+C.border,
                          borderRadius:10, padding:"10px 14px", marginBottom:10 }}>
                          <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint,
                            letterSpacing:1, marginBottom:5 }}>
                            BALANCE FORRAJERO — base del diagnóstico IA
                          </div>
                          <svg viewBox={"0 0 "+W+" "+H} style={{ width:"100%", display:"block" }}>
                            {[5,6,7].map(i => (
                              <rect key={i} x={px+i*(W-px*2)/12} y={2} width={(W-px*2)/12}
                                height={H-12} fill={C.amber+"06"} />
                            ))}
                            <rect x={px+mH*(W-px*2)/12} y={2} width={(W-px*2)/12}
                              height={H-12} fill={C.green+"10"} rx={2} />
                            <line x1={px} y1={midY} x2={W-px} y2={midY}
                              stroke={C.textFaint} strokeWidth="0.5" strokeDasharray="2,3" />
                            {bm.map((m,i) => {
                              const v = m.balance??0, pos = v>=0;
                              const bH = Math.max(2, Math.min(1,Math.abs(v)/mx)*(midY-8));
                              const x = px+i*(W-px*2)/12+1;
                              const y = pos ? midY-bH : midY;
                              const col = pos ? C.green : C.red;
                              const cur = i===mH;
                              return (
                                <g key={i}>
                                  <rect x={x} y={y} width={bw} height={bH}
                                    fill={col+(cur?"ee":"99")} rx={1} />
                                  <text x={x+bw/2} y={H-2} textAnchor="middle"
                                    style={{ fontFamily:C.font, fontSize:"5px",
                                      fill:cur?C.green:[5,6,7].includes(i)?C.amber:C.textFaint,
                                      fontWeight:cur?"700":"400" }}>
                                    {MC[i]}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                          <div style={{ display:"flex", gap:4, marginTop:5 }}>
                            {[5,6,7].map(i => {
                              const b = bm[i], ok = (b?.balance??0)>=0;
                              const col = b?.balance!=null?(ok?C.green:C.red):C.textFaint;
                              return (
                                <div key={i} style={{ flex:1, background:col+"10",
                                  border:"1px solid "+col+"30", borderRadius:5,
                                  padding:"3px 4px", textAlign:"center" }}>
                                  <div style={{ fontFamily:C.font, fontSize:7, color:col, fontWeight:700 }}>
                                    {MC[i]}: {b?.balance!=null?(b.balance>0?"+":"")+Math.round(b.balance):"—"} M
                                  </div>
                                </div>
                              );
                            })}
                            <div style={{ flex:1.2, background:C.card, borderRadius:5,
                              padding:"3px 6px" }}>
                              <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>CC serv</div>
                              <div style={{ fontFamily:C.font, fontSize:9, fontWeight:700,
                                color:tray?.ccServ?(tray.ccServ>=4.5?C.green:tray.ccServ>=4.0?C.amber:C.red):C.textFaint }}>
                                {tray?.ccServ||"—"}
                              </div>
                            </div>
                            <div style={{ flex:1.2, background:C.card, borderRadius:5,
                              padding:"3px 6px" }}>
                              <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>Preñez</div>
                              <div style={{ fontFamily:C.font, fontSize:9, fontWeight:700,
                                color:tray?.pr?(tray.pr>=65?C.green:tray.pr>=45?C.amber:C.red):C.textFaint }}>
                                {tray?.pr ? tray.pr+"%" : "—"}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <RenderInforme texto={result} />
                    <details style={{ marginTop:12 }}>
                      <summary style={{ fontFamily:C.font, fontSize:10, color:C.textDim,
                        cursor:"pointer", padding:"10px 14px", background:C.card2,
                        borderRadius:10, border:"1px solid "+C.border,
                        listStyle:"none", display:"flex", alignItems:"center",
                        justifyContent:"space-between" }}>
                        <span>🎯 Planes de acción detallados con dosis y fundamento</span>
                        <span>▼</span>
                      </summary>
                      <div style={{ marginTop:6 }}>
                        <PanelRecomendaciones motor={motor} form={form} />
                      </div>
                    </details>
                    <div style={{ display:"flex", gap:8, marginTop:12 }}>
                      <button onClick={() => { descargarPDF(); setTimeout(descargarCSV,800); }}
                        style={{ flex:2, background:C.green, color:"#0b1a0c", padding:13,
                          borderRadius:10, border:"none", fontFamily:C.font, fontSize:13,
                          fontWeight:700, cursor:"pointer" }}>
                        📱 Compartir (PDF + CSV)
                      </button>
                      <button onClick={descargarPDF}
                        style={{ flex:1, background:C.blue+"12", border:"1px solid "+C.blue+"35",
                          borderRadius:10, color:C.blue, padding:13,
                          fontFamily:C.font, fontSize:12, cursor:"pointer" }}>
                        PDF
                      </button>
                      <button onClick={descargarCSV}
                        style={{ flex:1, background:C.green+"10", border:"1px solid "+C.green+"35",
                          borderRadius:10, color:C.green, padding:13,
                          fontFamily:C.font, fontSize:12, cursor:"pointer" }}>
                        CSV
                      </button>
                    </div>
                    <button onClick={runAnalysis}
                      style={{ width:"100%", background:C.green+"06",
                        border:"1px solid "+C.border, borderRadius:10,
                        color:C.textDim, padding:10, fontFamily:C.font,
                        fontSize:12, cursor:"pointer", marginTop:8 }}>
                      🔄 Regenerar informe
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
    </div>
    );
  };


  // ── PASOS REDISEÑADOS ─────────────────────────────────────────
  // Flujo del técnico en campo:
  // Paso 0: Lo que ves al llegar — ubicación + el rodeo + CC (los 3 datos que cambian todo)
  // Paso 1: El campo — forraje, suplementación, agua (lo que tiene disponible)
  // Paso 2: Manejo y sanidad — destete, toros, vacunas

  const renderCampo = () => (
    <div>
      <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:10 }}>
        UBICACIÔN Y RODEO — datos mínimos para el diagnóstico
      </div>
      {renderUbicacion()}
      <div style={{ height:1, background:C.border, margin:"16px 0" }} />
      <div style={{ fontFamily:C.font, fontSize:9, color:C.green, letterSpacing:1, marginBottom:6 }}>
        🐄 EL RODEO
      </div>
      {renderRodeo()}
      <div style={{ height:1, background:C.border, margin:"16px 0" }} />
      <div style={{ fontFamily:C.font, fontSize:9, color:C.green, letterSpacing:1, marginBottom:6 }}>
        📊 CONDICIÔN CORPORAL — escala 1-9 INTA
      </div>
      {renderCC()}
    </div>
  );

  // Paso 1 — El campo: Forraje + Suplementación + Agua
  const renderRodeoCompleto = () => (
    <div>
      <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:10 }}>
        FORRAJE Y SUPLEMENTACIÔN — qué come el rodeo y cuánto pasto tiene
      </div>
      {renderForraje()}
      <div style={{ height:1, background:C.border, margin:"16px 0" }} />
      {renderSuplAgua()}
      <div style={{ height:1, background:C.border, margin:"16px 0" }} />
      <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:10 }}>
        CATEGORÍAS — vaquillona y V2S (opcional, enriquece el diagnóstico)
      </div>
      {renderCategorias()}
    </div>
  );

  // Paso 2 — Manejo: Sanidad
  const renderManejo = () => (
    <div>
      {renderSanidad()}
    </div>
  );


  return {
    renderCampo, renderRodeoCompleto,
    renderManejo, renderAnalisis,
  };
}

function PanelFaseCiclo({ faseCiclo }) {
  const T = C;
  if (!faseCiclo || faseCiclo.fase === "SIN_FECHA") return null;
  return (
    <div style={{ background:faseCiclo.color+"12", border:"1px solid "+faseCiclo.color+"40",
      borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:22 }}>{faseCiclo.icono}</span>
        <div>
          <div style={{ fontFamily:"monospace", fontSize:9, color:faseCiclo.color, letterSpacing:1, marginBottom:2 }}>
            {faseCiclo.label?.toUpperCase()}
            {faseCiclo.siguiente ? " · " + faseCiclo.siguiente.label + " en " + faseCiclo.siguiente.diasFaltan + "d" : ""}
          </div>
          <div style={{ fontFamily:"monospace", fontSize:11, color:"#e8e8e8", lineHeight:1.5 }}>
            {faseCiclo.descripcion?.split(".")[0] + "."}
          </div>
        </div>
      </div>
    </div>
  );
}
export { GraficoCCEscenarios, PanelAgua, PanelGEI, PanelFaseCiclo, LoadingPanel };
