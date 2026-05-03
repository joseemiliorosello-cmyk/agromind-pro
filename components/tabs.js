"use client";

// ═══════════════════════════════════════════════════════════════════
// components/tabs.js
// Tabs del análisis: Cerebro, GEI, Recomendaciones, Informe, Simulador
// ═══════════════════════════════════════════════════════════════════

import { calcTrayectoriaCC, diagnosticarSistema } from "../lib/motor";
import { calcCerebro, analizarMargenOptimizacion } from "../lib/cerebro";
import React from "react";
import { T as C, MESES_NOM } from "../lib/constantes"
const T = C;
const DISCLAIMER = "Las recomendaciones generadas por AgroMind Pro tienen carácter orientativo y deben ser validadas por un profesional veterinario o ingeniero agrónomo habilitado antes de su implementación. Los resultados dependen de la calidad y completitud de los datos ingresados.";
import { Pill, Alerta, smf } from "./ui";

const SEC_EMOJIS = ["1️⃣","2️⃣","3️⃣","4️⃣"];
const SEC_TITLES = ["Diagnóstico integrado","Puntos críticos","Escenarios de mejora","Plan de acción"];

// ─── RENDERINFORME ───────────────────────────────────────────────────
function RenderInforme({ texto }) {
  if (!texto) return null;
  const partes    = texto.split(/(?=\d️⃣)/);
  const secciones = SEC_EMOJIS.map(em => {
    const p = partes.find(x => x.startsWith(em));
    return p ? p.replace(em, "").trim() : "";
  });
  const getStatus = (s) => {
    const l = s.toLowerCase();
    if (l.includes("🔴") || l.includes("urgente")) return "rojo";
    if (l.includes("⚠")  || l.includes("déficit")) return "ambar";
    if (l.includes("✅"))                           return "verde";
    return "info";
  };
  const rr  = t => t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");
  const cfg = {
    rojo:  { bg:"rgba(224,85,48,.06)",  border:"rgba(224,85,48,.20)",  dot:T.red     },
    ambar: { bg:"rgba(232,160,48,.06)", border:"rgba(232,160,48,.20)", dot:T.amber   },
    verde: { bg:"rgba(126,200,80,.06)", border:"rgba(126,200,80,.20)", dot:T.green   },
    info:  { bg:"rgba(255,255,255,.02)",border:T.border,               dot:T.textDim },
  };

  return (
    <div>
      {secciones.map((sec, i) => {
        if (!sec) return null;
        const st = getStatus(sec);
        const s  = cfg[st];
        return (
          <details key={i} open={i === 0} style={{ marginBottom:8 }}>
            <summary style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:"12px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:10, userSelect:"none", listStyle:"none" }}>
              <span style={{ fontSize:18 }}>{SEC_EMOJIS[i]}</span>
              <span style={{ fontFamily:T.fontSans, fontSize:13, color:T.text, fontWeight:600, flex:1 }}>{SEC_TITLES[i]}</span>
              <div style={{ width:8, height:8, borderRadius:"50%", background:s.dot }} />
            </summary>
            <div
              style={{ background:T.card2, border:`1px solid ${T.border}`, borderTop:"none", borderRadius:"0 0 12px 12px", padding:14, fontFamily:T.fontSans, fontSize:13, color:T.text, lineHeight:1.75 }}
              dangerouslySetInnerHTML={{ __html: rr(sec) }}
            />
          </details>
        );
      })}
      <div style={{ background:"rgba(232,160,48,.04)", border:"1px solid rgba(232,160,48,.12)", borderRadius:10, padding:10, marginTop:8 }}>
        <div style={{ fontFamily:T.fontSans, fontSize:10, color:T.textDim, lineHeight:1.6 }}>{DISCLAIMER}</div>
      </div>
    </div>
  );
}

// ─── SIMULADORESCENARIOS ───────────────────────────────────────────────────
function SimuladorEscenarios({ form, cadena, baseParams, sat }) {
  const [escActivo, setEscActivo] = useState([true, true, false]);
  const fenol = form.fenologia || "menor_10";

  const escBase = useMemo(() => ({
    supl1:form.supl1, dosis1:parseFloat(form.dosis1)||0,
    supl2:form.supl2, dosis2:parseFloat(form.dosis2)||0,
    supl3:form.supl3, dosis3:parseFloat(form.dosis3)||0,
  }), [form.supl1, form.supl2, form.supl3, form.dosis1, form.dosis2, form.dosis3]);

  const [escA, setEscA] = useState({
    supl1:form.supl1||"Expeller girasol", dosis1:parseFloat(form.dosis1)||0.3,
    supl2:"Expeller girasol", dosis2:0.5, supl3:"", dosis3:0,
    destTrad:parseFloat(form.destTrad)||0, destAntic:parseFloat(form.destAntic)||0, destHiper:parseFloat(form.destHiper)||0,
  });
  const [escB, setEscB] = useState({
    supl1:"Expeller soja", dosis1:0.5, supl2:"Expeller soja", dosis2:0.8, supl3:"", dosis3:0,
    destTrad:0, destAntic:0, destHiper:0,
  });

  const calcEsc = (extra) => calcTrayectoriaCC({ ...baseParams, ...extra });
  const esc0 = { ...escBase, tray: calcEsc(escBase) };
  const esc1 = { ...escA,    tray: calcEsc(escA)    };
  const esc2 = { ...escB,    tray: calcEsc(escB)    };
  const escenarios  = [esc0, esc1, esc2];
  const mesesLact   = esc0.tray?.mesesLact || "6";
  const updA = (k, v) => setEscA(e => ({ ...e, [k]:v }));
  const updB = (k, v) => setEscB(e => ({ ...e, [k]:v }));

  return (
    <div>
      {/* Tarjetas */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {escenarios.map((e, i) => (
          <TarjetaEscenario key={i} idx={i} esc={e} color={ESC_COLORS[i]}
            activo={escActivo[i]} onToggle={() => setEscActivo(a => a.map((v,j) => j===i ? !v : v))} />
        ))}
      </div>

      {/* Gráfico CC */}
      <div style={{ background:T.card2, borderRadius:T.radius, padding:14, border:`1px solid ${T.border}`, marginBottom:12 }}>
        <GraficoCCEscenarios
          escenarios={escenarios.filter((_, i) => escActivo[i])}
          cadena={cadena} mesesLact={mesesLact}
          form={form} sat={sat}
        />
      </div>

      {/* Tabla comparación */}
      <div style={{ background:T.card2, borderRadius:T.radius, border:`1px solid ${T.border}`, overflow:"hidden", marginBottom:16 }}>
        <div style={{ padding:"10px 14px", background:"rgba(0,0,0,.2)", fontFamily:T.font, fontSize:9, color:T.textDim, letterSpacing:1 }}>COMPARACIÓN DE RESULTADOS</div>
        {[
          ["CC al servicio",    "ccServ",      ""],
          ["% Preñez estimada", "pr",           "%"],
          ["Anestro posparto",  "anestro.dias", "d"],
          ["CC mín lactancia",  "ccMinLact",    ""],
        ].map(([lbl, key, u]) => (
          <div key={lbl} style={{ display:"flex", borderBottom:`1px solid ${T.border}` }}>
            <div style={{ flex:2, padding:"10px 14px", fontFamily:T.fontSans, fontSize:11, color:T.textDim }}>{lbl}</div>
            {escenarios.map((e, i) => {
              let val = "—";
              if (e.tray) {
                if (key.includes(".")) {
                  const [p, s] = key.split(".");
                  val = e.tray[p]?.[s] ?? "—";
                } else {
                  val = e.tray[key] ?? "—";
                }
              }
              const isP    = key === "pr";
              const numVal = parseFloat(val) || 0;
              const co     = isP ? (numVal>=55?T.green:numVal>=35?T.amber:T.red) : ESC_COLORS[i];
              return <div key={i} style={{ flex:1, padding:"10px 8px", fontFamily:T.font, fontSize:12, color:co, fontWeight:700, textAlign:"center" }}>{val}{u}</div>;
            })}
          </div>
        ))}
      </div>

      {/* Config Esc A */}
      <details style={{ marginBottom:12 }}>
        <summary style={{ fontFamily:T.font, fontSize:11, color:ESC_COLORS[1], padding:"12px 14px", background:T.card2, borderRadius:T.radius, border:`1px solid ${T.border}`, cursor:"pointer", listStyle:"none", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span>⚙️ Configurar {ESC_NAMES[1]}</span>
          <span style={{ fontSize:9, color:T.textDim }}>Preñez: {esc1.tray?.pr||"—"}%</span>
        </summary>
        <div style={{ background:T.card2, borderRadius:`0 0 ${T.radius}px ${T.radius}px`, padding:14, border:`1px solid ${T.border}`, borderTop:"none" }}>
          <SuplSelector label="SUPL. GESTACIÓN/INVIERNO" supl={escA.supl1} dosis={escA.dosis1} onSuplChange={v=>updA("supl1",v)} onDosisChange={v=>updA("dosis1",v)} fenolPasto={fenol} color={ESC_COLORS[1]} />
          <SuplSelector label="SUPL. LACTANCIA"          supl={escA.supl2} dosis={escA.dosis2} onSuplChange={v=>updA("supl2",v)} onDosisChange={v=>updA("dosis2",v)} fenolPasto={fenol} color={ESC_COLORS[1]} />
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, letterSpacing:1, marginBottom:8 }}>MANEJO DESTETE</div>
          <Slider label="Hiperprecoz (50d) %" value={escA.destHiper} min={0} max={100} step={10} onChange={v=>updA("destHiper",v)} unit="%" color={ESC_COLORS[1]} />
          <Slider label="Anticipado (90d) %"  value={escA.destAntic} min={0} max={100} step={10} onChange={v=>updA("destAntic",v)} unit="%" color={ESC_COLORS[1]} />
        </div>
      </details>

      {/* Config Esc B */}
      <details style={{ marginBottom:12 }}>
        <summary style={{ fontFamily:T.font, fontSize:11, color:ESC_COLORS[2], padding:"12px 14px", background:T.card2, borderRadius:T.radius, border:`1px solid ${T.border}`, cursor:"pointer", listStyle:"none", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span>⚙️ Configurar {ESC_NAMES[2]}</span>
          <span style={{ fontSize:9, color:T.textDim }}>Preñez: {esc2.tray?.pr||"—"}%</span>
        </summary>
        <div style={{ background:T.card2, borderRadius:`0 0 ${T.radius}px ${T.radius}px`, padding:14, border:`1px solid ${T.border}`, borderTop:"none" }}>
          <SuplSelector label="SUPL. GESTACIÓN/INVIERNO" supl={escB.supl1} dosis={escB.dosis1} onSuplChange={v=>updB("supl1",v)} onDosisChange={v=>updB("dosis1",v)} fenolPasto={fenol} color={ESC_COLORS[2]} />
          <SuplSelector label="SUPL. LACTANCIA"          supl={escB.supl2} dosis={escB.dosis2} onSuplChange={v=>updB("supl2",v)} onDosisChange={v=>updB("dosis2",v)} fenolPasto={fenol} color={ESC_COLORS[2]} />
          <Slider label="Hiperprecoz (50d) %" value={escB.destHiper} min={0} max={100} step={10} onChange={v=>updB("destHiper",v)} unit="%" color={ESC_COLORS[2]} />
          <Slider label="Anticipado (90d) %"  value={escB.destAntic} min={0} max={100} step={10} onChange={v=>updB("destAntic",v)} unit="%" color={ESC_COLORS[2]} />
        </div>
      </details>
    </div>
  );
}

// ─── TABCEREBRO ───────────────────────────────────────────────────
function TabCerebro({ motor, form, sat }) {
  const cerebro    = React.useMemo(() => calcCerebro(motor, form, sat), [motor, form, sat]);
  const [expandida, setExpandida] = React.useState(null);
  if (!cerebro) return null;

  const {
    parrafo, tarjetas, resumen, contextoClima, calendarioAcciones,
    faseCiclo, alertaSat, cronograma, diagnosticoSustentabilidad,
  } = cerebro;
  const mesHoy = new Date().getMonth();
  const MESES_C = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const tray    = motor?.tray;
  const balMen  = motor?.balanceMensual ?? [];

  return (
    <div>

      {/* ══ DIAGNÓSTICO DE SUSTENTABILIDAD ══════════════════════ */}
      {diagnosticoSustentabilidad && (
        <div style={{ background:C.card2, border:"1px solid "+C.border,
          borderRadius:12, overflow:"hidden", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5,
            padding:"5px 12px", borderBottom:"1px solid "+C.border+"60",
            background:C.card }}>
            <span style={{ fontSize:10 }}>🔍</span>
            <span style={{ fontFamily:C.font, fontSize:7, color:C.textFaint, letterSpacing:1.5 }}>DIAGNÓSTICO</span>
          </div>
          <div style={{ padding:"12px 14px" }}>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:6 }}>
            Sustentabilidad — ¿puede este sistema alcanzar ≥{resumen.metaPrenez}% preñez?
          </div>
          {/* Semáforo y resumen */}
          <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:8 }}>
            <div style={{ width:12, height:12, borderRadius:6, flexShrink:0,
              background:diagnosticoSustentabilidad.color, marginTop:2 }} />
            <div style={{ fontFamily:C.sans, fontSize:11, color:C.text, lineHeight:1.5, flex:1 }}>
              {diagnosticoSustentabilidad.resumen}
            </div>
            {resumen.prenez > 0 && (
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontFamily:C.font, fontSize:22, fontWeight:700,
                  color: resumen.prenez >= resumen.metaPrenez ? C.green : resumen.prenez >= 65 ? C.amber : C.red,
                  lineHeight:1 }}>{resumen.prenez}%</div>
                <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>preñez est.</div>
                {resumen.gapPrenez > 0 && (
                  <div style={{ fontFamily:C.font, fontSize:8, color:C.amber }}>
                    −{resumen.gapPrenez}pp de meta
                  </div>
                )}
                {diagnosticoSustentabilidad.ciclosAlColapso && (
                  <div style={{ fontFamily:C.font, fontSize:8, color:C.red, marginTop:2, fontWeight:700 }}>
                    ⏱ {diagnosticoSustentabilidad.ciclosAlColapso} ciclo{diagnosticoSustentabilidad.ciclosAlColapso>1?"s":""} sin corrección
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Factores limitantes */}
          {diagnosticoSustentabilidad.factoresLimitantes.length > 0 && (
            <div style={{ borderTop:"1px solid "+C.border, paddingTop:6 }}>
              {diagnosticoSustentabilidad.factoresLimitantes.map((f,i) => (
                <div key={i} style={{ fontFamily:C.font, fontSize:8, color:C.amber,
                  marginBottom:2 }}>▸ {f}</div>
              ))}
            </div>
          )}
          {/* Alerta satelital */}
          {alertaSat && (
            <div style={{ marginTop:6, fontFamily:C.font, fontSize:8,
              color:alertaSat.startsWith("✓") ? C.green : C.amber }}>
              🛰 {alertaSat}
            </div>
          )}
          </div>
        </div>
      )}

      {/* ══ CRONOGRAMA DE RIESGOS — línea de tiempo ════════════ */}
      {/* Banner alerta satelital */}
      {alertaSat && (
        <div style={{ background:alertaSat.startsWith("✓") ? C.green+"0d" : C.amber+"0d",
          border:"1px solid "+(alertaSat.startsWith("✓") ? C.green+"30" : C.amber+"30"),
          borderRadius:8, padding:"8px 12px", marginBottom:10,
          display:"flex", gap:8, fontFamily:C.font, fontSize:9,
          color:alertaSat.startsWith("✓") ? C.green : C.amber }}>
          <span>🛰</span><span>{alertaSat}</span>
        </div>
      )}

      {cronograma && cronograma.length > 0 && (() => {
        const W = 340, H = 110, padX = 14;
        const colW = (W - padX * 2) / 12;
        // Calcular nivel de riesgo por mes (0=ok, 1=alerta, 2=crítico)
        const riskLevel = cronograma.map(m => {
          const hasUrgente = m.riesgos.some(r => r.tipo === "deficit");
          const hasAlerta  = m.riesgos.some(r => r.tipo === "leve" || r.tipo === "accion");
          return hasUrgente ? 2 : hasAlerta ? 1 : 0;
        });
        return (
          <div style={{ background:C.card2, border:"1px solid "+C.border, borderRadius:12,
            padding:"12px 14px", marginBottom:12, overflowX:"auto" }}>
            <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:8 }}>
              🗓 LÍNEA DE TIEMPO — riesgos y acciones en el año
            </div>
            <svg viewBox={"0 0 "+W+" "+H} style={{ width:"100%", display:"block", minWidth:300 }}>
              {/* Fondos */}
              {[5,6,7].map(i => (
                <rect key={i} x={padX+i*colW} y={2} width={colW} height={H-20}
                  fill={C.amber+"08"} />
              ))}
              {/* Mes actual */}
              <rect x={padX+mesHoy*colW} y={2} width={colW} height={H-20}
                fill={C.green+"12"} rx={2} />
              {/* Barras de riesgo */}
              {cronograma.map((m, i) => {
                const col = riskLevel[i] === 2 ? C.red : riskLevel[i] === 1 ? C.amber : C.green;
                const alpha = riskLevel[i] === 2 ? "50" : riskLevel[i] === 1 ? "35" : "15";
                const bH = riskLevel[i] === 2 ? 28 : riskLevel[i] === 1 ? 18 : 8;
                return (
                  <rect key={i} x={padX+i*colW+1} y={H-20-bH} width={colW-2} height={bH}
                    fill={col+alpha} rx={2}
                    stroke={riskLevel[i]>0 ? col+"60" : "none"} strokeWidth="0.5" />
                );
              })}
              {/* Íconos de hitos y acciones */}
              {cronograma.map((m, i) =>
                m.riesgos.slice(0, 2).map((r, ei) => (
                  <text key={i+"-"+ei}
                    x={padX + i*colW + colW/2}
                    y={10 + ei * 16}
                    textAnchor="middle"
                    style={{ fontSize:"9px" }}>
                    {r.tipo === "hito" ? (r.label === "Parición" ? "🐄" : r.label === "Servicio" ? "🐂" : "🍼")
                     : r.tipo === "deficit" ? "⚡"
                     : r.tipo === "accion"  ? "⚠"
                     : r.tipo === "recurso" ? "🌾"
                     : "•"}
                  </text>
                ))
              )}
              {/* Etiquetas mes */}
              {cronograma.map((m, i) => (
                <text key={i} x={padX+i*colW+colW/2} y={H-5} textAnchor="middle"
                  style={{ fontFamily:C.font, fontSize:"6px",
                    fill: i === mesHoy ? C.green : m.esInv ? C.amber : C.textFaint,
                    fontWeight: i === mesHoy || m.esInv ? "700" : "400" }}>
                  {m.mes}
                </text>
              ))}
              {/* Leyenda */}
              <text x={padX} y={H-14} style={{ fontFamily:C.font, fontSize:"5.5px", fill:C.red }}>■ déficit</text>
              <text x={padX+28} y={H-14} style={{ fontFamily:C.font, fontSize:"5.5px", fill:C.amber }}>■ acción</text>
              <text x={padX+56} y={H-14} style={{ fontFamily:C.font, fontSize:"5.5px", fill:C.green }}>■ ok</text>
              <text x={W-padX} y={H-14} textAnchor="end" style={{ fontFamily:C.font, fontSize:"5.5px", fill:C.amber }}>▐ invierno</text>
            </svg>
            {/* Detalle de meses con eventos */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:6 }}>
              {cronograma.filter(m => m.riesgos.length > 0).map(m => (
                <div key={m.i} style={{ background:C.card, border:"1px solid "+C.border,
                  borderRadius:6, padding:"4px 8px", minWidth:70 }}>
                  <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint, marginBottom:1 }}>{m.mes}</div>
                  {m.riesgos.map((r,j) => (
                    <div key={j} style={{ fontFamily:C.font, fontSize:8, color:r.color }}>{r.label}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ══ PUNTOS CRÍTICOS — razonamiento por categoría ═══════ */}
      <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:8 }}>
        PUNTOS LIMITANTES — {tarjetas.length > 0 ? tarjetas.length + " identificados" : "sin limitantes críticos"}
      </div>

      {tarjetas.length === 0 && (
        <div style={{ background:C.green+"0a", border:"1px solid "+C.green+"30",
          borderRadius:10, padding:"12px 14px", marginBottom:12,
          fontFamily:C.sans, fontSize:11, color:C.green }}>
          ✓ Sistema sin limitantes críticos. Monitorear CC en agosto.
        </div>
      )}

      {tarjetas.map(dim => {
        const abierta  = expandida === dim.id;
        const colP     = { URGENTE:C.red, P1:C.amber, P2:C.blue, P3:C.textFaint };
        const col      = colP[dim.prioridad] || C.textFaint;
        return (
          <div key={dim.id}
            onClick={() => setExpandida(abierta ? null : dim.id)}
            style={{ background:C.card2, border:"1px solid "+(abierta ? col+"60" : C.border),
              borderRadius:12, marginBottom:8, overflow:"hidden", cursor:"pointer",
              transition:"border-color 0.2s" }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px" }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{dim.icono}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:C.font, fontSize:7, color:C.textFaint,
                    letterSpacing:1.2, display:"flex", alignItems:"center", gap:3 }}>
                    🔍 DIAGNÓSTICO
                  </span>
                  <span style={{ fontFamily:C.font, fontSize:8, color:col,
                    background:col+"18", borderRadius:4, padding:"1px 6px", letterSpacing:.5 }}>
                    {dim.prioridad} · {dim.categoria}
                  </span>
                  {dim.cuandoActuar && (
                    <span style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>
                      📅 {dim.cuandoActuar}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily:C.sans, fontSize:12, color:C.text,
                  lineHeight:1.4, fontWeight:500 }}>
                  {dim.titulo}
                </div>
              </div>
              <span style={{ fontFamily:C.font, fontSize:12, color:C.textFaint, flexShrink:0 }}>
                {abierta ? "▲" : "▼"}
              </span>
            </div>
            {/* Detalle expandido */}
            {abierta && (
              <div style={{ padding:"0 14px 14px", borderTop:"1px solid "+C.border+"60" }}>
                {/* Impacto */}
                <div style={{ marginBottom:8, paddingTop:10 }}>
                  <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginBottom:3 }}>
                    IMPACTO EN EL SISTEMA
                  </div>
                  <div style={{ fontFamily:C.sans, fontSize:11, color:col, lineHeight:1.5 }}>
                    {dim.impacto}
                  </div>
                </div>
                {/* Solución — RECOMENDACIÓN card */}
                {(() => {
                  const recoCol = dim.prioridad === "URGENTE" ? "#E24B4A" : "#1D9E75";
                  return (
                    <div style={{ borderTop:"1px solid "+recoCol+"30",
                      borderRight:"1px solid "+recoCol+"30",
                      borderBottom:"1px solid "+recoCol+"30",
                      borderLeft:"4px solid "+recoCol,
                      borderRadius:"0 8px 8px 0",
                      background:recoCol+"08", padding:"8px 10px", marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:4 }}>
                        <span style={{ color:recoCol, fontSize:11, fontWeight:700 }}>→</span>
                        <span style={{ fontFamily:C.font, fontSize:7, color:recoCol, letterSpacing:1.2 }}>
                          RECOMENDACIÓN
                        </span>
                      </div>
                      <div style={{ fontFamily:C.sans, fontSize:11, color:C.text, lineHeight:1.5 }}>
                        {dim.solucion}
                      </div>
                    </div>
                  );
                })()}
                {/* Cuándo actuar */}
                {dim.cuandoActuar && (
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                    <span style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>📅 CUÁNDO:</span>
                    <span style={{ fontFamily:C.font, fontSize:9, color:col, fontWeight:700 }}>{dim.cuandoActuar}</span>
                  </div>
                )}
                {/* Tipo suplemento + cuantificación */}
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {dim.tipoSupl && (
                    <div style={{ fontFamily:C.font, fontSize:8, fontWeight:700,
                      background: dim.tipoSupl==="P" ? C.green+"20" : dim.tipoSupl==="E" ? C.amber+"20" : C.blue+"20",
                      color:       dim.tipoSupl==="P" ? C.green : dim.tipoSupl==="E" ? C.amber : C.blue,
                      border:`1px solid ${dim.tipoSupl==="P" ? C.green+"40" : dim.tipoSupl==="E" ? C.amber+"40" : C.blue+"40"}`,
                      borderRadius:5, padding:"2px 8px" }}>
                      {dim.tipoSupl==="P" ? "PROTEICO" : dim.tipoSupl==="E" ? "ENERGÉTICO" : "E+PROTEICO"}
                    </div>
                  )}
                  {dim.cuantifica && (
                    <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>
                      📦 {dim.cuantifica}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Parrafo ejecutivo */}
      {parrafo && (
        <div style={{ background:C.card2, border:"1px solid "+C.border,
          borderRadius:10, padding:"10px 14px", marginTop:8 }}>
          <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint,
            letterSpacing:1, marginBottom:6 }}>RESUMEN TÉCNICO</div>
          <div style={{ fontFamily:C.sans, fontSize:11, color:C.textDim, lineHeight:1.6 }}>
            {parrafo}
          </div>
          {resumen.ternerosDif > 0 && (
            <div style={{ marginTop:8, fontFamily:C.font, fontSize:10, color:C.green }}>
              ✓ Con las acciones recomendadas: +{resumen.ternerosDif} terneros vs situación actual
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// ─── PANELRECOMENDACIONES ───────────────────────────────────────────────────
function PanelRecomendaciones({ motor, form }) {
  const dx = React.useMemo(() => diagnosticarSistema(motor, form), [motor, form]);
  const [planAbierto, setPlanAbierto] = React.useState(null);
  const [pasoAbierto, setPasoAbierto] = React.useState({});

  if (!motor) return (
    <div style={{ padding:20, textAlign:"center" }}>
      <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:8 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width:6, height:6, borderRadius:3, background:T.green,
            animation:"pulse 1.2s ease-in-out "+(i*0.2)+"s infinite" }} />
        ))}
      </div>
      <div style={{ fontFamily:T.font, fontSize:10, color:T.textFaint }}>Calculando planes...</div>
    </div>
  );

  if (!dx) return (
    <div style={{ padding:16, textAlign:"center", fontFamily:T.font, fontSize:10, color:T.textFaint }}>
      Cargá biotipo, vacas y CC para ver los planes de acción
    </div>
  );

  const { cuellos, planes, proyeccion, ind } = dx;
  const P1 = cuellos.filter(c => c.prioridad === "P1");
  const P2 = cuellos.filter(c => c.prioridad === "P2");

  const colP  = { P1: T.red, P2: T.amber, P3: T.blue };
  const bgP   = { P1: `${T.red}08`, P2: `${T.amber}06`, P3: `${T.blue}05` };

  // ── Flecha de causalidad ──────────────────────────────────────────
  const CausaChip = ({ texto }) => (
    <span style={{ fontFamily:T.font, fontSize:9, color:T.textDim,
      background:`rgba(255,255,255,.04)`, border:`1px solid ${T.border}`,
      borderRadius:6, padding:"2px 8px", display:"inline-block" }}>
      {texto}
    </span>
  );

  // ── Bloque cuello de botella ──────────────────────────────────────
  const CuelloCard = ({ c }) => (
    <div style={{
      padding:"10px 14px", borderRadius:10, marginBottom:6,
      background: bgP[c.prioridad],
      border:`1px solid ${colP[c.prioridad]}30`,
      display:"flex", gap:10, alignItems:"flex-start"
    }}>
      <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{c.icono}</span>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3, flexWrap:"wrap" }}>
          <span style={{ fontFamily:T.font, fontSize:8, color:colP[c.prioridad],
            background:`${colP[c.prioridad]}18`, borderRadius:4, padding:"1px 6px", letterSpacing:.5 }}>
            {c.prioridad} · {c.categoria}
          </span>
        </div>
        <div style={{ fontFamily:T.fontSans, fontSize:12, color:T.text, lineHeight:1.4, fontWeight:500 }}>
          {c.titulo}
        </div>
        <div style={{ fontFamily:T.font, fontSize:9, color:T.green, marginTop:3 }}>
          📈 {c.impacto}
        </div>
        {c.causas?.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginTop:5 }}>
            {c.causas.map((causa, i) => <CausaChip key={i} texto={causa} />)}
          </div>
        )}
      </div>
    </div>
  );

  // ── Paso de plan ──────────────────────────────────────────────────
  const PasoCard = ({ paso, planId, color }) => {
    const key  = `${planId}_${paso.orden}`;
    const open = pasoAbierto[key];
    return (
      <div style={{
        background: T.card2, border:`1px solid ${T.border}`,
        borderRadius:10, marginBottom:8, overflow:"hidden"
      }}>
        {/* Header siempre visible */}
        <div onClick={() => setPasoAbierto(prev => ({...prev, [key]: !open}))}
          style={{ display:"flex", gap:10, padding:"12px 14px", cursor:"pointer", alignItems:"flex-start" }}>
          <div style={{ width:22, height:22, borderRadius:"50%", background:`${color}20`,
            border:`1px solid ${color}40`, display:"flex", alignItems:"center", justifyContent:"center",
            flexShrink:0, fontFamily:T.font, fontSize:10, color, fontWeight:700 }}>
            {paso.orden}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:T.font, fontSize:11, color:T.text, fontWeight:600, marginBottom:2 }}>
              {paso.titulo}
            </div>
            <div style={{ fontFamily:T.fontSans, fontSize:12, color, fontWeight:700 }}>
              {paso.detalle}
            </div>
            {paso.frecuencia && (
              <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, marginTop:2 }}>
                🕐 {paso.frecuencia} · {paso.momento}
              </div>
            )}
          </div>
          <span style={{ fontFamily:T.font, fontSize:10, color:T.textFaint }}>{open ? "▲" : "▼"}</span>
        </div>

        {/* Expandido — fundamento + datos */}
        {open && (
          <div style={{ borderTop:`1px solid ${T.border}`, padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
            {/* Por qué */}
            <div style={{ background:`rgba(255,255,255,.02)`, border:`1px solid ${T.border}`, borderRadius:8, padding:"10px 12px" }}>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textDim, letterSpacing:1, marginBottom:4 }}>🔬 POR QUÉ ESTA ACCIÓN</div>
              <div style={{ fontFamily:T.fontSans, fontSize:11, color:T.textDim, lineHeight:1.6 }}>{paso.porque}</div>
            </div>
            {/* Datos del suplemento */}
            {paso.alimento && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:6 }}>
                {[
                  paso.kgDia      && ["kg/día",        paso.kgDia + " kg"],
                  paso.pbAportada && ["PB aportada",   paso.pbAportada],
                  paso.pctPV      && ["% del PV",      paso.pctPV],
                  paso.diasTotal  && ["Duración",      paso.diasTotal + " días"],
                  paso.objetivo   && ["Objetivo",      paso.objetivo],
                  paso.noHacer    && ["⚠ No hacer",   paso.noHacer],
                ].filter(Boolean).map(([label, valor], i) => (
                  <div key={i} style={{ background:`${color}08`, borderRadius:6, padding:"6px 8px" }}>
                    <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>{label}</div>
                    <div style={{ fontFamily:T.font, fontSize:11, color: label.includes("⚠") ? T.red : color, fontWeight:600 }}>{valor}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Plan de acción por categoría ─────────────────────────────────
  const PlanCard = ({ plan }) => {
    const open  = planAbierto === plan.id;
    const color = colP[plan.prioridad];
    const base  = plan.proyeccion?.base;
    const conP  = plan.proyeccion?.conPlan;

    return (
      <div style={{ border:`1px solid ${color}35`, borderRadius:12, marginBottom:10, overflow:"hidden" }}>
        {/* Header del plan */}
        <div onClick={() => setPlanAbierto(open ? null : plan.id)}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
            background: open ? `${color}08` : "transparent", cursor:"pointer" }}>
          <span style={{ fontSize:18 }}>{plan.icono}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:T.font, fontSize:10, color, fontWeight:700, marginBottom:2 }}>
              {plan.prioridad} · {plan.categoria}
            </div>
            <div style={{ fontFamily:T.font, fontSize:11, color:T.text }}>
              {plan.pasos.length} acción{plan.pasos.length > 1 ? "es" : ""}
              {plan.pasos[0]?.alimento ? ` — ${plan.pasos.map(p=>p.alimento).filter(Boolean).join(" + ")}` : ""}
            </div>
          </div>
          {/* Proyección compacta SIN/CON */}
          {base && conP && (() => {
            const claves = Object.keys(base).filter(k => k !== "label" && k !== "llega" && k !== "fertilidad");
            const clave  = claves[0];
            if (!clave) return null;
            const vB = base[clave], vC = conP[clave];
            const mejor = typeof vB === "number" ? vC > vB : vC;
            return (
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, marginBottom:2 }}>
                  {clave.replace(/_/g," ")}
                </div>
                <div style={{ fontFamily:T.font, fontSize:11 }}>
                  <span style={{ color:T.red }}>{typeof vB==="boolean"?(vB?"Sí":"No"):vB}</span>
                  <span style={{ color:T.textFaint }}> → </span>
                  <span style={{ color:T.green }}>{typeof vC==="boolean"?(vC?"Sí":"No"):vC}</span>
                </div>
              </div>
            );
          })()}
          <span style={{ fontFamily:T.font, fontSize:12, color:T.textFaint, flexShrink:0 }}>{open ? "▲" : "▼"}</span>
        </div>

        {/* Pasos expandidos */}
        {open && (
          <div style={{ borderTop:`1px solid ${T.border}`, padding:14 }}>
            {/* Comparativa base vs con plan */}
            {base && conP && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
                <div style={{ background:`${T.red}08`, border:`1px solid ${T.red}20`, borderRadius:8, padding:"8px 10px" }}>
                  <div style={{ fontFamily:T.font, fontSize:8, color:T.red, letterSpacing:1, marginBottom:4 }}>SIN PLAN</div>
                  {Object.entries(base).filter(([k])=>k!=="label").map(([k,v])=>(
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                      <span style={{ fontFamily:T.font, fontSize:9, color:T.textDim }}>{k.replace(/_/g," ")}</span>
                      <span style={{ fontFamily:T.font, fontSize:10, color:T.red, fontWeight:700 }}>
                        {typeof v==="boolean"?(v?"Sí":"No"):typeof v==="number"?(Number.isInteger(v)?v:v.toFixed(1)):String(v)}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ background:`${T.green}08`, border:`1px solid ${T.green}20`, borderRadius:8, padding:"8px 10px" }}>
                  <div style={{ fontFamily:T.font, fontSize:8, color:T.green, letterSpacing:1, marginBottom:4 }}>CON PLAN</div>
                  {Object.entries(conP).filter(([k])=>k!=="label").map(([k,v])=>(
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                      <span style={{ fontFamily:T.font, fontSize:9, color:T.textDim }}>{k.replace(/_/g," ")}</span>
                      <span style={{ fontFamily:T.font, fontSize:10, color:T.green, fontWeight:700 }}>
                        {typeof v==="boolean"?(v?"Sí":"No"):typeof v==="number"?(Number.isInteger(v)?v:v.toFixed(1)):String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {plan.pasos.map(paso => (
              <PasoCard key={paso.orden} paso={paso} planId={plan.id} color={color} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* ── Proyección global ─────────────────────────────────── */}
      {proyeccion.gananciaPreñez > 0 && (
        <div style={{ background:`${T.green}08`, border:`1px solid ${T.green}25`,
          borderRadius:12, padding:14, marginBottom:16, display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ textAlign:"center", minWidth:55 }}>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, marginBottom:2 }}>HOY</div>
            <div style={{ fontFamily:T.font, fontSize:26, color:T.red, fontWeight:700, lineHeight:1 }}>{ind.prenez ?? "—"}%</div>
            <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>preñez</div>
          </div>
          <div style={{ flex:1, textAlign:"center" }}>
            <div style={{ height:2, background:`linear-gradient(90deg,${T.red},${T.green})`, borderRadius:1, marginBottom:4 }} />
            <div style={{ fontFamily:T.font, fontSize:9, color:T.green }}>
              +{proyeccion.gananciaPreñez}pp aplicando {planes.length} plan{planes.length>1?"es":""}
            </div>
          </div>
          <div style={{ textAlign:"center", minWidth:55 }}>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, marginBottom:2 }}>OBJETIVO</div>
            <div style={{ fontFamily:T.font, fontSize:26, color:T.green, fontWeight:700, lineHeight:1 }}>{proyeccion.prenez}%</div>
            <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>preñez</div>
          </div>
        </div>
      )}

      {/* ── BLOQUE 1: Cuellos de botella ───────────────────────── */}
      {cuellos.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, letterSpacing:1, marginBottom:8 }}>
            🔍 LIMITANTES IDENTIFICADOS — {P1.length} urgente{P1.length!==1?"s":""} · {P2.length} importante{P2.length!==1?"s":""}
          </div>
          {cuellos.map(c => <CuelloCard key={c.id} c={c} />)}
        </div>
      )}

      {/* ── BLOQUE 2: Planes de acción ──────────────────────────── */}
      {planes.length > 0 && (
        <div>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, letterSpacing:1, marginBottom:8 }}>
            🎯 PLANES DE ACCIÓN — tocá cada uno para ver la dosis y el fundamento
          </div>
          {planes.map(p => <PlanCard key={p.id} plan={p} />)}
        </div>
      )}

      {cuellos.length === 0 && (
        <div style={{ background:`${T.green}06`, border:`1px solid ${T.green}20`, borderRadius:14, padding:20, textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>✅</div>
          <div style={{ fontFamily:T.font, fontSize:13, color:T.green }}>Sistema dentro de parámetros técnicos</div>
        </div>
      )}
    </div>
  );
}

export {
  RenderInforme, SimuladorEscenarios,
  TabCerebro, PanelRecomendaciones,
};
