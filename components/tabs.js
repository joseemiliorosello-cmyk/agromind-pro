"use client";

// ═══════════════════════════════════════════════════════════════════
// components/tabs.js
// Tabs del análisis: Cerebro, GEI, Recomendaciones, Informe, Simulador
// ═══════════════════════════════════════════════════════════════════

import { calcTrayectoriaCC, diagnosticarSistema } from "../lib/motor";
import { calcCerebro } from "../lib/cerebro";
import React from "react";
import { T as C } from "../lib/constantes"
const T = C;
const DISCLAIMER = "Las recomendaciones generadas por AgroMind Pro tienen carácter orientativo y deben ser validadas por un profesional veterinario o ingeniero agrónomo habilitado antes de su implementación. Los resultados dependen de la calidad y completitud de los datos ingresados.";

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
function TabCerebro({ motor, form, sat, potreros = [] }) {
  const cerebro    = React.useMemo(() => calcCerebro(motor, form, sat, potreros), [motor, form, sat, potreros]);
  const [expandida, setExpandida] = React.useState(null);
  const [pantalla,  setPantalla]  = React.useState("dx");  // "dx" | "rx"
  if (!cerebro) return null;

  const { diagnostico, prescripciones } = cerebro;
  const { alertaSat, diagnosticoSustentabilidad } = diagnostico;
  const { tarjetas, parrafo, resumen } = prescripciones;

  // ── Toggle pills A / B ───────────────────────────────────────────
  const nRx = tarjetas.length;
  const colToggle = (active) => ({
    padding: "5px 14px",
    borderRadius: 20,
    fontFamily: C.font,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.8,
    cursor: "pointer",
    border: "none",
    transition: "background .15s",
    background: active ? C.green : "transparent",
    color:      active ? "#fff"  : C.textFaint,
  });

  return (
    <div>

      {/* ── Toggle A / B ── */}
      <div style={{ display:"flex", alignItems:"center", background:C.card2,
        border:"1px solid "+C.border, borderRadius:24, padding:3,
        marginBottom:14, width:"fit-content" }}>
        <button style={colToggle(pantalla==="dx")} onClick={() => setPantalla("dx")}>
          🔍 Diagnóstico
        </button>
        <button style={colToggle(pantalla==="rx")} onClick={() => setPantalla("rx")}>
          → Plan{nRx > 0 ? ` (${nRx})` : ""}
        </button>
      </div>

      {/* ══ PANTALLA A — DIAGNÓSTICO ════════════════════════════ */}
      {pantalla === "dx" && (
        <div>

          {/* Sustentabilidad */}
          {diagnosticoSustentabilidad && (
            <div style={{ background:C.card2, border:"1px solid "+C.border,
              borderRadius:12, overflow:"hidden", marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:5,
                padding:"5px 12px", borderBottom:"1px solid "+C.border+"60",
                background:C.card }}>
                <div style={{ width:8, height:8, borderRadius:4,
                  background:diagnosticoSustentabilidad.color }} />
                <span style={{ fontFamily:C.font, fontSize:7, color:C.textFaint, letterSpacing:1.5 }}>
                  DIAGNÓSTICO DE SUSTENTABILIDAD
                </span>
              </div>
              <div style={{ padding:"12px 14px" }}>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:6 }}>
                  ¿Puede este sistema alcanzar ≥{resumen.metaPrenez}% preñez?
                </div>
                <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginBottom:8 }}>
                  <div style={{ fontFamily:C.sans, fontSize:11, color:C.text, lineHeight:1.5, flex:1 }}>
                    {diagnosticoSustentabilidad.resumen}
                  </div>
                  {resumen.prenez > 0 && (
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontFamily:C.font, fontSize:22, fontWeight:700, lineHeight:1,
                        color: resumen.prenez >= resumen.metaPrenez ? C.green : resumen.prenez >= 65 ? C.amber : C.red }}>
                        {resumen.prenez}%
                      </div>
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
                {diagnosticoSustentabilidad.factoresLimitantes?.length > 0 && (
                  <div style={{ borderTop:"1px solid "+C.border, paddingTop:6 }}>
                    {diagnosticoSustentabilidad.factoresLimitantes.map((f,i) => (
                      <div key={i} style={{ fontFamily:C.font, fontSize:8, color:C.amber, marginBottom:2 }}>
                        ▸ {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alerta satelital */}
          {alertaSat && (
            <div style={{ background:alertaSat.startsWith("✓") ? C.green+"0d" : C.amber+"0d",
              border:"1px solid "+(alertaSat.startsWith("✓") ? C.green+"30" : C.amber+"30"),
              borderRadius:8, padding:"8px 12px", marginBottom:10,
              display:"flex", gap:8, fontFamily:C.font, fontSize:9,
              color:alertaSat.startsWith("✓") ? C.green : C.amber }}>
              <span>🛰</span><span>{alertaSat}</span>
            </div>
          )}

          {/* Resumen técnico */}
          {parrafo && (
            <div style={{ background:C.card2, border:"1px solid "+C.border,
              borderRadius:10, padding:"10px 14px" }}>
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
      )}

      {/* ══ PANTALLA B — PRESCRIPCIONES ══════════════════════════ */}
      {pantalla === "rx" && (
        <div>

          <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:8 }}>
            PLAN DE ACCIÓN — {nRx > 0 ? nRx + " puntos identificados" : "sin limitantes críticos"}
          </div>

          {nRx === 0 && (
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
            const recoCol  = dim.prioridad === "URGENTE" ? C.red : dim.prioridad === "P1" ? C.amber : C.green;
            return (
              <div key={dim.id}
                onClick={() => setExpandida(abierta ? null : dim.id)}
                style={{ borderRadius:12, marginBottom:10, overflow:"hidden", cursor:"pointer",
                  border:"1px solid "+(abierta ? col+"60" : C.border) }}>

                {/* FILA 1: QUÉ PASA */}
                <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 14px 8px",
                  background:C.card2 }}>
                  <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{dim.icono}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3, flexWrap:"wrap" }}>
                      <span style={{ fontFamily:C.font, fontSize:7, color:C.textFaint, letterSpacing:1.2 }}>
                        🔍 QUÉ PASA
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
                    <div style={{ fontFamily:C.sans, fontSize:12, color:C.text, lineHeight:1.4, fontWeight:500 }}>
                      {dim.titulo}
                    </div>
                    {dim.impacto && !abierta && (
                      <div style={{ fontFamily:C.sans, fontSize:10, color:C.textFaint, lineHeight:1.4, marginTop:2 }}>
                        {dim.impacto.length > 90 ? dim.impacto.slice(0,90)+"…" : dim.impacto}
                      </div>
                    )}
                  </div>
                  <span style={{ fontFamily:C.font, fontSize:11, color:C.textFaint, flexShrink:0, marginTop:2 }}>
                    {abierta ? "▲" : "▼"}
                  </span>
                </div>

                {/* FILA 2: QUÉ HACER */}
                {dim.solucion && (
                  <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"8px 14px 10px",
                    background:recoCol+"10", borderTop:"2px solid "+recoCol+"40" }}>
                    <span style={{ fontFamily:C.font, fontSize:9, color:recoCol, fontWeight:700,
                      flexShrink:0, marginTop:1 }}>→</span>
                    <div style={{ flex:1 }}>
                      <span style={{ fontFamily:C.font, fontSize:7, color:recoCol, letterSpacing:1.2 }}>
                        QUÉ HACER
                      </span>
                      <div style={{ fontFamily:C.sans, fontSize:11, color:C.text, lineHeight:1.5, marginTop:2 }}>
                        {abierta ? dim.solucion : (dim.solucion.length > 100 ? dim.solucion.slice(0,100)+"…" : dim.solucion)}
                      </div>
                    </div>
                  </div>
                )}

                {/* DETALLE EXPANDIDO */}
                {abierta && (
                  <div style={{ padding:"10px 14px 14px", background:C.card,
                    borderTop:"1px solid "+C.border+"40" }}>
                    {dim.cuandoActuar && (
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                        <span style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>📅 CUÁNDO:</span>
                        <span style={{ fontFamily:C.font, fontSize:10, color:col, fontWeight:700 }}>{dim.cuandoActuar}</span>
                      </div>
                    )}
                    {(dim.tipoSupl || dim.cuantifica) && (
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
                    )}
                  </div>
                )}
              </div>
            );
          })}

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

// ─── Panel de diagnóstico directo del cerebro (sin Claude) ─────────
function PanelInformeCerebro({ cb, confianza }) {
  if (!cb) return null;
  const dx  = cb.diagnostico    || {};
  const px  = cb.prescripciones || {};
  const lim = px.limitantes     || [];
  const res = px.resumen        || {};

  const priorColor = { P1: T.red, P2: T.amber || "#e8a030", P3: T.textDim };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

      {/* Badge de confianza del diagnóstico */}
      {confianza && (
        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
          background:T.card2, borderRadius:10, padding:"10px 14px", border:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:36, height:36, borderRadius:"50%",
              background:`${confianza.color}22`, border:`2px solid ${confianza.color}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:T.font, fontSize:13, fontWeight:700, color:confianza.color }}>
              {confianza.score}
            </div>
            <div>
              <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, letterSpacing:1 }}>CONFIANZA</div>
              <div style={{ fontFamily:T.font, fontSize:12, fontWeight:700, color:confianza.color }}>{confianza.label}</div>
            </div>
          </div>
          {confianza.faltantes && confianza.faltantes.length > 0 && (
            <div style={{ fontFamily:T.fontSans, fontSize:10.5, color:T.textDim, flex:1, minWidth:160 }}>
              Completar para mayor precisión: {confianza.faltantes.slice(0, 3).join(", ")}
              {confianza.faltantes.length > 3 ? ` +${confianza.faltantes.length - 3}` : ""}
            </div>
          )}
        </div>
      )}

      {/* Resumen narrativo */}
      {dx.resumen && (
        <div style={{ background:T.card2, borderRadius:10, padding:"14px 16px", border:`1px solid ${T.border}` }}>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, letterSpacing:1, marginBottom:8 }}>
            DIAGNÓSTICO INTEGRADO
          </div>
          <div style={{ fontFamily:T.fontSans, fontSize:12.5, color:T.text, lineHeight:1.65 }}>
            {dx.resumen}
          </div>
          {dx.faseCiclo && (
            <div style={{ marginTop:8, fontFamily:T.font, fontSize:10, color:T.textDim,
              display:"flex", alignItems:"center", gap:6 }}>
              <span>{dx.faseCiclo.icono}</span>
              <span style={{ color:dx.faseCiclo.color || T.text, fontWeight:600 }}>
                {dx.faseCiclo.label || dx.faseCiclo.fase}
              </span>
              {dx.faseCiclo.descripcion && (
                <span style={{ color:T.textDim }}>— {dx.faseCiclo.descripcion}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Alertas climáticas */}
      {(dx.campoSeco || dx.callorExtremo || dx.faltaAgua) && (
        <div style={{ background:`${T.red}10`, border:`1px solid ${T.red}30`, borderRadius:10, padding:"10px 14px",
          display:"flex", flexDirection:"column", gap:4 }}>
          {dx.campoSeco     && <div style={{ fontFamily:T.fontSans, fontSize:12, color:T.red }}>⚠ Campo seco — impacto en oferta forrajera y consumo voluntario</div>}
          {dx.callorExtremo && <div style={{ fontFamily:T.fontSans, fontSize:12, color:T.red }}>⚠ Calor extremo — deprime consumo y fertilidad (NRC 2000)</div>}
          {dx.faltaAgua     && <div style={{ fontFamily:T.fontSans, fontSize:12, color:T.red }}>⚠ Agua crítica — reducción de DMI confirmada</div>}
        </div>
      )}

      {/* Proyección */}
      {res.prenez > 0 && (
        <div style={{ background:T.card2, borderRadius:10, padding:"14px 16px", border:`1px solid ${T.border}` }}>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, letterSpacing:1, marginBottom:10 }}>
            PROYECCIÓN
          </div>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
            <div>
              <div style={{ fontFamily:T.font, fontSize:10, color:T.textDim }}>Preñez actual</div>
              <div style={{ fontFamily:T.font, fontSize:22, color:T.text, fontWeight:700 }}>{res.prenez}%</div>
            </div>
            {res.prenezPot > res.prenez && (<>
              <div style={{ fontFamily:T.font, fontSize:18, color:T.textDim }}>→</div>
              <div>
                <div style={{ fontFamily:T.font, fontSize:10, color:T.textDim }}>Con mejoras</div>
                <div style={{ fontFamily:T.font, fontSize:22, color:T.green, fontWeight:700 }}>{res.prenezPot}%</div>
              </div>
              {res.ternerosDif > 0 && (
                <div style={{ background:`${T.green}15`, borderRadius:8, padding:"5px 12px", alignSelf:"center" }}>
                  <span style={{ fontFamily:T.font, fontSize:13, color:T.green, fontWeight:700 }}>+{res.ternerosDif} terneros</span>
                </div>
              )}
            </>)}
          </div>
          {res.ciclosAlColapso > 0 && (
            <div style={{ marginTop:10, fontFamily:T.fontSans, fontSize:11, color:T.red }}>
              ⚠ Sin corrección: en {res.ciclosAlColapso} ciclo{res.ciclosAlColapso > 1 ? "s" : ""} la CC al servicio colapsa a 3.5 y la preñez se derrumba
            </div>
          )}
        </div>
      )}

      {/* Limitantes jerarquizados */}
      {lim.length > 0 && (
        <div style={{ background:T.card2, borderRadius:10, padding:"14px 16px", border:`1px solid ${T.border}` }}>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, letterSpacing:1, marginBottom:10 }}>
            LIMITANTES JERARQUIZADOS
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {lim.slice(0, 8).map((l, i) => (
              <div key={i} style={{
                borderLeft:`3px solid ${priorColor[l.prioridad] || T.textDim}`,
                paddingLeft:12, paddingTop:4, paddingBottom:4,
              }}>
                <div style={{ display:"flex", gap:5, alignItems:"center", marginBottom:3 }}>
                  <span style={{ fontFamily:T.font, fontSize:9,
                    color: priorColor[l.prioridad] || T.textDim,
                    background:`${priorColor[l.prioridad] || T.textDim}18`,
                    borderRadius:4, padding:"1px 6px" }}>
                    {l.prioridad}
                  </span>
                  <span style={{ fontFamily:T.font, fontSize:9, color:T.textDim,
                    background:T.card, borderRadius:4, padding:"1px 6px" }}>
                    {l.categoria}
                  </span>
                </div>
                <div style={{ fontFamily:T.fontSans, fontSize:12.5, color:T.text, fontWeight:600, marginBottom:2 }}>
                  {l.titulo}
                </div>
                {l.impacto && (
                  <div style={{ fontFamily:T.fontSans, fontSize:11.5, color:T.textDim }}>
                    {l.impacto}
                  </div>
                )}
                {l.solucion && (
                  <div style={{ fontFamily:T.fontSans, fontSize:11.5, color:T.green, marginTop:2 }}>
                    → {l.solucion}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ventanas de acción — cuándo actuar */}
      {cb.diagnostico?.momento?.ventanas?.length > 0 && (
        <div style={{ background:T.card2, borderRadius:10, padding:"14px 16px", border:`1px solid ${T.border}` }}>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, letterSpacing:1, marginBottom:10 }}>
            VENTANAS DE ACCIÓN
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {cb.diagnostico.momento.ventanas.slice(0, 4).map((v, i) => {
              const urgCol = v.urgencia === "URGENTE" ? T.red : v.urgencia === "PRÓXIMO" ? T.amber || "#e8a030" : T.textDim;
              return (
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{ minWidth:72, fontFamily:T.font, fontSize:9, fontWeight:700,
                    color:urgCol, background:`${urgCol}18`, borderRadius:4, padding:"2px 7px",
                    textAlign:"center", marginTop:2, flexShrink:0 }}>
                    {v.urgencia}
                  </div>
                  <div>
                    <div style={{ fontFamily:T.font, fontSize:12, color:T.text, fontWeight:600 }}>
                      {v.accion}
                    </div>
                    <div style={{ fontFamily:T.fontSans, fontSize:11, color:T.textDim, marginTop:1 }}>
                      {v.detalle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Eficiencia reproductiva — cola de parición */}
      {cb.diagnostico?.eficiencia?.kgPerdidos > 5 && (
        <div style={{ background:`${T.amber || "#e8a030"}10`, border:`1px solid ${T.amber || "#e8a030"}30`,
          borderRadius:10, padding:"10px 14px" }}>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.amber || "#e8a030", letterSpacing:1, marginBottom:6 }}>
            EFICIENCIA REPRODUCTIVA
          </div>
          <div style={{ fontFamily:T.fontSans, fontSize:12, color:T.text, lineHeight:1.55 }}>
            {cb.diagnostico.eficiencia.conclusion}
          </div>
        </div>
      )}

      {/* Potreros individuales */}
      {cb.diagnostico?.potreros && !cb.diagnostico.potreros.sinDatos && (
        <details>
          <summary style={{ fontFamily:T.font, fontSize:10, color:T.textDim, letterSpacing:1,
            cursor:"pointer", padding:"10px 14px", background:T.card2,
            borderRadius:10, border:`1px solid ${T.border}`,
            listStyle:"none", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span>POTREROS — diagnóstico forrajero por lote</span>
            <span>&#9660;</span>
          </summary>
          <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:8 }}>
            {(cb.diagnostico?.potreros?.potrerosDx || []).map((p, i) => (
              <div key={i} style={{ background:T.card2, borderRadius:8, padding:"10px 14px",
                border:`1px solid ${T.border}`, borderLeft:`3px solid ${p.colorEstado}` }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4, flexWrap:"wrap" }}>
                  <span style={{ fontFamily:T.font, fontSize:11, fontWeight:700, color:T.text }}>
                    P{p.idx} — {p.ha} ha
                  </span>
                  <span style={{ fontFamily:T.fontSans, fontSize:10, color:p.colorEstado,
                    background:`${p.colorEstado}18`, borderRadius:4, padding:"1px 7px" }}>
                    {p.estado}
                  </span>
                  <span style={{ fontFamily:T.font, fontSize:10, color:T.textDim }}>
                    PB {p.pb}% · EM {p.em} Mcal/kg · ~{p.msHa} kg MS/ha
                  </span>
                </div>
                <div style={{ fontFamily:T.fontSans, fontSize:11, color:T.textDim }}>{p.veg}</div>
                <div style={{ fontFamily:T.fontSans, fontSize:11, color:T.text, marginTop:3 }}>→ {p.recom}</div>
              </div>
            ))}
            <div style={{ fontFamily:T.fontSans, fontSize:11, color:T.textDim,
              background:T.card2, borderRadius:8, padding:"8px 12px",
              border:`1px solid ${T.border}` }}>
              {cb.diagnostico?.potreros?.conclusion}
            </div>
          </div>
        </details>
      )}

      {/* Vaquillona */}
      {cb.diagnostico?.vaquillona && (cb.diagnostico.vaquillona.hayVaq1 || cb.diagnostico.vaquillona.hayVaq2) && (
        <details>
          <summary style={{ fontFamily:T.font, fontSize:10, color:T.textDim, letterSpacing:1,
            cursor:"pointer", padding:"10px 14px", background:T.card2,
            borderRadius:10, border:`1px solid ${T.border}`,
            listStyle:"none", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span>REPOSICIÓN — vaquillona 1° y 2° invierno</span>
            <span>&#9660;</span>
          </summary>
          <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:8 }}>
            {cb.diagnostico.vaquillona.vaq1 && (() => {
              const v = cb.diagnostico.vaquillona.vaq1;
              const col = !v.llega ? T.red : v.gdpReal < v.gdpMin ? T.amber || "#e8a030" : T.green;
              return (
                <div style={{ background:T.card2, borderRadius:8, padding:"10px 14px",
                  border:`1px solid ${T.border}`, borderLeft:`3px solid ${col}` }}>
                  <div style={{ fontFamily:T.font, fontSize:10, color:T.textDim, letterSpacing:1, marginBottom:6 }}>
                    VAQUILLONA 1° INVIERNO ({v.n} cab)
                  </div>
                  <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:6 }}>
                    <div>
                      <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim }}>GDP real</div>
                      <div style={{ fontFamily:T.font, fontSize:16, fontWeight:700, color:col }}>{v.gdpReal} g/d</div>
                      <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim }}>mín {v.gdpMin} g/d</div>
                    </div>
                    <div>
                      <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim }}>PV salida</div>
                      <div style={{ fontFamily:T.font, fontSize:16, fontWeight:700, color:col }}>{v.pvSalida} kg</div>
                      <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim }}>obj {v.pvObjetivo} kg</div>
                    </div>
                    <div style={{ alignSelf:"center", fontFamily:T.font, fontSize:12,
                      color:v.llega ? T.green : T.red, fontWeight:700 }}>
                      {v.llega ? "✓ Llega" : "✗ No llega"}
                    </div>
                  </div>
                  <div style={{ fontFamily:T.fontSans, fontSize:11, color:T.textDim, lineHeight:1.5 }}>
                    {v.conclusion}
                  </div>
                </div>
              );
            })()}
            {cb.diagnostico.vaquillona.vaq2 && (() => {
              const v = cb.diagnostico.vaquillona.vaq2;
              const col = !v.llega ? T.red : T.green;
              return (
                <div style={{ background:T.card2, borderRadius:8, padding:"10px 14px",
                  border:`1px solid ${T.border}`, borderLeft:`3px solid ${col}` }}>
                  <div style={{ fontFamily:T.font, fontSize:10, color:T.textDim, letterSpacing:1, marginBottom:6 }}>
                    VAQUILLONA 2° INVIERNO — ENTORE ({v.n} cab)
                  </div>
                  <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:6 }}>
                    <div>
                      <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim }}>PV al entore</div>
                      <div style={{ fontFamily:T.font, fontSize:16, fontWeight:700, color:col }}>{v.pvEntore} kg</div>
                      <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim }}>mín {v.pvMinEntore} kg</div>
                    </div>
                    <div>
                      <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim }}>% PV adulto</div>
                      <div style={{ fontFamily:T.font, fontSize:16, fontWeight:700, color:col }}>{v.pct}%</div>
                      <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim }}>mín 75%</div>
                    </div>
                    <div style={{ alignSelf:"center", fontFamily:T.font, fontSize:12,
                      color:v.llega ? T.green : T.red, fontWeight:700 }}>
                      {v.llega ? "✓ Llega" : "✗ No llega"}
                    </div>
                    {v.aptaEntoreAntic && (
                      <div style={{ alignSelf:"center", fontFamily:T.font, fontSize:11,
                        color:T.green, background:`${T.green}18`, borderRadius:6, padding:"2px 8px" }}>
                        Apta entore anticipado
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily:T.fontSans, fontSize:11, color:T.textDim, lineHeight:1.5 }}>
                    {v.conclusion}
                  </div>
                </div>
              );
            })()}
          </div>
        </details>
      )}

      {/* Aviso legal */}
      <div style={{ fontFamily:T.fontSans, fontSize:10, color:T.textDim, lineHeight:1.5,
        borderTop:`1px solid ${T.border}`, paddingTop:10, marginTop:4 }}>
        Las recomendaciones tienen carácter orientativo y no reemplazan el criterio del profesional que asiste al establecimiento.
      </div>
    </div>
  );
}

export {
  RenderInforme, SimuladorEscenarios,
  TabCerebro, PanelRecomendaciones, PanelInformeCerebro,
};
