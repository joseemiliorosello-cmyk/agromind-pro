"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession, signOut, signIn, SessionProvider } from "next-auth/react";
import { T as C, FORM_DEF, MESES_NOM, CALIDAD_C4_CALIBRADA, cc5 } from "../lib/constantes";
import { correrMotor, useMotor, calcCadena, calcConsumoAgua, calcDisp,
         calcScore, calcGEI, calcTrayectoriaCC, calcDisponibilidadMS,
         calcSupervivencia, calcV2S, mcalSuplemento, fetchSat,
         fmtFecha, dZona, dProv, smf, diagnosticarSistema,
         calcImpactoCola, calcFaseCiclo, calcConsumoPasto,
         getBiotipo, FENOLOGIAS } from "../lib/motor";
import { calcCerebro, buildPromptFull, SYS_FULL,
         interpretarSistemaCompleto } from "../lib/cerebro";
import { usePersistencia, PanelHistorial } from "../lib/persistencia";
import { Pill, Alerta, smf2, DistCC, Input, LoadingPanel,
         MetricCard, SelectF, Slider, Toggle, SuplSelector } from "../components/ui";
import { DashboardEstablecimiento } from "../components/dashboard";
import { getPasoRenders, GraficoCCEscenarios, PanelAgua, PanelGEI, PanelFaseCiclo } from "../components/pasos"
import GraficosBalance from "../components/GraficosBalance";
import { TabCerebro, PanelRecomendaciones, RenderInforme } from "../components/tabs";
import * as XLSX from "xlsx";

const MSGS = [
  "Analizando condición forrajera…",
  "Evaluando trayectoria CC…",
  "Calculando cadena reproductiva…",
  "Modelando anestro posparto…",
  "Simulando escenarios de suplementación…",
  "Generando recomendaciones…",
];

const SEC_EMOJIS = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣"];

const SEC_TITLES = ["Diagnóstico Ambiental","Diagnóstico por Categoría","Destete y Proyección CC","Balance Oferta vs Demanda","Recomendaciones"];

const DISCLAIMER = "Las recomendaciones generadas por AgroMind Pro tienen carácter orientativo. No reemplazan el criterio profesional del ingeniero agrónomo o médico veterinario que asiste al establecimiento, quien deberá validar, ajustar e implementar cualquier decisión de manejo según las condiciones particulares de cada sistema productivo.";

const PASOS = [
  { id:"zona",            label:"Datos de la zona" },
  { id:"rodeo",           label:"Rodeo y CC"       },
  { id:"potreros",        label:"Potreros"         },
  { id:"sanidad",         label:"Agua y sanidad"   },
  { id:"diagnostico",     label:"Diagnóstico"      },
  { id:"recomendaciones", label:"Recomendaciones"  },
];


function calcConfianzaDiagnostico(form, motor) {
  const checks = [
    // Datos críticos — peso 3
    { campo:"vacasN",      peso:3, label:"N° vacas",       ok: !!form.vacasN && parseFloat(form.vacasN) > 0 },
    { campo:"distribucionCC", peso:3, label:"CC del rodeo", ok: (form.distribucionCC||[]).some(d => parseFloat(d.pct)>0) },
    { campo:"iniServ",     peso:3, label:"Fechas servicio", ok: !!form.iniServ && !!form.finServ },
    { campo:"biotipo",     peso:2, label:"Biotipo",         ok: !!form.biotipo },
    // Datos importantes — peso 2
    { campo:"supHa",       peso:2, label:"Hectáreas",       ok: !!form.supHa && parseFloat(form.supHa) > 0 },
    { campo:"fenologia",   peso:2, label:"Fenología pasto", ok: !!form.fenologia },
    { campo:"destTrad",    peso:2, label:"Modalidad destete", ok: (parseFloat(form.destTrad)||0)+(parseFloat(form.destAntic)||0)+(parseFloat(form.destHiper)||0) === 100 },
    { campo:"pvVacaAdulta",peso:2, label:"PV vaca",         ok: !!form.pvVacaAdulta && parseFloat(form.pvVacaAdulta) > 0 },
    // Datos útiles — peso 1
    { campo:"sanVacunas",  peso:1, label:"Sanidad",         ok: !!form.sanVacunas },
    { campo:"aguaTDS",     peso:1, label:"Calidad agua",    ok: !!form.aguaTDS && parseFloat(form.aguaTDS) > 0 },
    { campo:"torosCC",     peso:1, label:"CC toros",        ok: !!form.torosCC && parseFloat(form.torosCC) > 0 },
    { campo:"vegetacion",  peso:1, label:"Tipo vegetación", ok: !!form.vegetacion },
    { campo:"enso",        peso:1, label:"ENSO/Clima",      ok: !!form.enso },
    { campo:"prenez",      peso:1, label:"Preñez histórica",ok: !!form.prenez && parseFloat(form.prenez) > 0 },
  ];

  const total    = checks.reduce((s,c) => s + c.peso, 0);
  const cargados = checks.reduce((s,c) => s + (c.ok ? c.peso : 0), 0);
  const score    = Math.round(cargados / total * 100);

  const faltantes = checks.filter(c => !c.ok && c.peso >= 2).map(c => c.label);

  const nivel = score >= 85 ? "alto" : score >= 60 ? "medio" : "bajo";
  const color = score >= 85 ? "#639922" : score >= 60 ? "#BA7517" : "#A32D2D";
  const label = score >= 85 ? "Alta confianza" : score >= 60 ? "Confianza media" : "Datos incompletos";

  return { score, nivel, color, label, faltantes, checks };
}


export default function Page() {
  return (
    <SessionProvider>
      <CalfAIPro />
    </SessionProvider>
  );
}

function CalfAIPro() {
  const { data: session } = useSession();

  // Estado principal
  const [form,        setForm]        = useState(FORM_DEF);
  const [step,        setStep]        = useState(0);
  const [sat,         setSat]         = useState(null);
  const [coords,      setCoords]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [loadMsg,     setLoadMsg]     = useState("");
  const [result,      setResult]      = useState("");
  const [tab,         setTab]         = useState("resumen");
  const [modoForraje, setModoForraje] = useState("general");
  const [usaPotreros, setUsaPotreros] = useState(true);
  const [potreros,    setPotreros]    = useState([{ ha:"", veg:"Pastizal natural", fenol:"menor_10" }]);
  const [vistaSupl,   setVistaSupl]   = useState("cuadrantes");
  const [bannerProductor, setBannerProductor] = useState(null); // datos autocargados del productor
  const [showHistorial,   setShowHistorial]   = React.useState(false);
  const [borradorRecuperado, setBorradorRecuperado] = React.useState(false);

  // ── Hook de persistencia ─────────────────────────────────────
  const { guardarBorrador, restaurarBorrador, guardarEnHistorial,
          leerHistorial, cargarVisita, limpiarBorrador } = usePersistencia(form, setForm);

  // Guardar borrador automáticamente (debounce 8s)
  React.useEffect(() => {
    if (!form.vacasN) return;
    const t = setTimeout(guardarBorrador, 8000);
    return () => clearTimeout(t);
  }, [form]);

  // Recuperar borrador al cargar
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const draft = restaurarBorrador();
    if (draft && draft.vacasN) setBorradorRecuperado(true);
  }, []);

  const set     = (k, v) => setForm(f => ({ ...f, [k]:v }));
  const setDist = (k, v) => setForm(f => ({ ...f, [k]:v }));

  // ── LEER DATOS DEL PRODUCTOR DESDE URL ───────────────────────
  // El formulario del productor genera: /?productor=BASE64
  // Al abrir Calf AI con ese link, los datos se autocargan
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const enc = params.get("productor");
      if (!enc) return;
      const datos = JSON.parse(decodeURIComponent(escape(atob(enc))));
      if (!datos || typeof datos !== "object") return;

      // Mapear los campos del formulario del productor al form completo
      const campos = [
        "nombreProductor","localidad","provincia","biotipo",
        "vacasN","torosN","iniServ","finServ","prenez",
        "vegetacion","supHa","sanAftosa","sanBrucelosis",
        "sanToros","sanAbortos","aguaFuente","consultaEspecifica",
      ];
      const updates = {};
      campos.forEach(k => { if (datos[k] !== undefined && datos[k] !== "") updates[k] = datos[k]; });

      if (Object.keys(updates).length > 0) {
        setForm(f => ({ ...f, ...updates }));
        setBannerProductor({
          nombre: datos.nombreProductor || "productor",
          campos: Object.keys(updates).length,
        });
        // Saltar al paso análisis si hay datos suficientes
        if (datos.vacasN && datos.provincia) setStep(7);
        // Limpiar el parámetro de la URL sin recargar
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    } catch (e) {
      console.warn("Error leyendo datos del productor:", e);
    }
  }, []);

  // ── MOTOR DE INFERENCIA v1 ──────────────────────────────────
  // Un único hook que propaga todos los cambios en cascada
  const motor = useMotor(form, sat, potreros, usaPotreros);

  // Desestructurar via motorEfectivo (ver abajo — incluye fallback síncrono)
  // Las variables individuales se declaran después de motorEfectivo
  // tray: usar motor como fuente primaria
  // Si motor aún no corrió (null), calcular tray directamente desde form
  // Esto elimina el flash de "sin datos" al cargar la página
  const tray = motor?.tray ?? (() => {
    if (!form.distribucionCC?.length) return null;
    try {
      const cadenaCalc = form.iniServ && form.finServ ? calcCadena(form.iniServ, form.finServ) : null;
      return calcTrayectoriaCC({
        dist: form.distribucionCC,
        cadena: cadenaCalc,
        destTrad: form.destTrad, destAntic: form.destAntic, destHiper: form.destHiper,
        supHa: form.supHa, vacasN: form.vacasN,
        biotipo: form.biotipo, primerParto: form.primerParto,
        provincia: form.provincia,
        supl1: form.supl1||"", dosis1: form.dosis1||"0",
        supl2: "", dosis2: "0",
        supl3: form.supl3||"", dosis3: form.dosis3||"0",
      });
    } catch(e) { return null; }
  })();
  // motorEfectivo: si el hook aún no corrió (null), calcular síncronamente
  // El motor es <5ms — el delay del useEffect es el problema de los "—"
  const motorEfectivo = motor ?? (() => {
    // Solo requiere vacasN y biotipo — provincia tiene fallback "Corrientes" en motor
    if (!form.vacasN || !form.biotipo) return null;
    try { return correrMotor(form, sat, potreros, usaPotreros); }
    catch(e) { return null; }
  })();

  const dist           = motorEfectivo?.dist           ?? null;
  const balanceMensual = motorEfectivo?.balanceMensual ?? [];
  const toroDxn        = motorEfectivo?.toroDxn        ?? null;
  const stockStatus    = motorEfectivo?.stockStatus    ?? {};
  const alertasMotor   = motorEfectivo?.alertas        ?? [];
  const scoreRiesgo    = motorEfectivo?.scoreRiesgo    ?? 0;
  const nivelRiesgo    = motorEfectivo?.nivelRiesgo    ?? "—";
  const colorRiesgo    = motorEfectivo?.colorRiesgo    ?? C.textDim;
  const cargaEV_ha     = motorEfectivo?.cargaEV_ha     ?? null;
  const impactoCola    = motorEfectivo?.impactoCola    ?? null;
  const vaq1E          = motorEfectivo?.vaq1E          ?? null;
  const vaq2E          = motorEfectivo?.vaq2E          ?? null;
  const ccDesvio       = motorEfectivo?.ccDesvio       ?? null;

  // Variables del motor faltantes — restauradas
  const ccPondVal      = motorEfectivo?.ccPondVal      ?? 0;
  const cadena         = motorEfectivo?.cadena         ?? calcCadena(form.iniServ, form.finServ);
  const disponMS       = motorEfectivo?.disponMS       ?? null;
  const ndviN          = motorEfectivo?.ndviN          ?? (sat?.ndvi || 0.45);
  const tcSave         = motorEfectivo?.tcSave         ?? null;
  const pvSalidaVaq1   = motorEfectivo?.pvSalidaVaq1   ?? 0;
  const pvEntradaVaq2  = motorEfectivo?.pvEntradaVaq2  ?? null;
  const evalAgua       = motorEfectivo?.evalAgua       ?? null;
  const sanidad        = motorEfectivo?.sanidad        ?? null;
  const baseParams     = motorEfectivo?.baseParams     ?? {};
  const nVacas         = motorEfectivo?.nVacas         ?? (parseInt(form.vacasN) || 0);
  const nToros         = motorEfectivo?.nToros         ?? (parseInt(form.torosN) || 0);
  const nV2s           = motorEfectivo?.nV2s           ?? (parseInt(form.v2sN)   || 0);
  const nVaq1          = motorEfectivo?.nVaq1          ?? 0;
  const nVaq2          = motorEfectivo?.nVaq2          ?? 0;
  const totalEV        = motorEfectivo?.totalEV        ?? 0;
  const pvEntVaq1      = motorEfectivo?.pvEntVaq1      ?? 0;
  const ofertaMensual  = motorEfectivo?.ofertaMensual  ?? [];
  const verdeoAporteMcalMes = motorEfectivo?.verdeoAporteMcalMes ?? 0;
  const verdeoMesInicio     = motorEfectivo?.verdeoMesInicio     ?? 7;
  const suplRodeoMcalDia    = motorEfectivo?.suplRodeoMcalDia    ?? 0;
  const demandaAlim    = motorEfectivo?.demandaAlim    ?? null;
  const visitasCampo   = motorEfectivo?.visitasCampo   ?? [];
  const factorAgua     = motorEfectivo?.factorAgua     ?? 1.0;
  const factorCarga    = motorEfectivo?.factorCarga    ?? 1.0;
  const confianza      = React.useMemo(() =>
    calcConfianzaDiagnostico(form, motorEfectivo), [form, motorEfectivo]);

  const score          = React.useMemo(() =>
    motorEfectivo ? calcScore(motorEfectivo, form, null) : null,
  [motorEfectivo, form]);
  const dispar     = sat && form.provincia ? calcDisp(form.provincia, sat.ndvi, sat.temp) : null;
  const nVaqRepos  = motor?.nVaq1 ?? (Math.round((parseInt(form.vacasN) || 0)) * (parseFloat(form.pctReposicion)||20) / 100);

  // Coordenadas de referencia por provincia — permite traer clima sin GPS
  const COORDS_PROV = {
    "Corrientes":               { lat:-28.5, lon:-58.8 },
    "Chaco":                    { lat:-26.9, lon:-60.0 },
    "Formosa":                  { lat:-24.9, lon:-59.4 },
    "Entre Ríos":               { lat:-31.7, lon:-60.5 },
    "Santa Fe":                 { lat:-31.0, lon:-60.7 },
    "Santiago del Estero":      { lat:-27.8, lon:-64.3 },
    "Salta":                    { lat:-24.8, lon:-65.4 },
    "Buenos Aires":             { lat:-36.6, lon:-60.3 },
    "Córdoba":                  { lat:-32.1, lon:-63.5 },
    "La Pampa":                 { lat:-37.1, lon:-65.4 },
    "Paraguay Oriental":        { lat:-25.3, lon:-57.6 },
    "Chaco Paraguayo":          { lat:-22.5, lon:-60.0 },
    "Mato Grosso do Sul (BR)":  { lat:-20.5, lon:-55.0 },
    "Mato Grosso / Goiás (BR)": { lat:-15.0, lon:-52.0 },
    "Santa Cruz / Beni (BO)":   { lat:-16.5, lon:-62.0 },
    "Tarija / Chaco (BO)":      { lat:-22.0, lon:-63.5 },
    "Rio Grande do Sul (BR)":   { lat:-30.0, lon:-53.0 },
    "Pantanal (BR)":            { lat:-17.0, lon:-57.5 },
    "Misiones":                 { lat:-27.4, lon:-55.9 },
    "Jujuy":                    { lat:-24.2, lon:-65.3 },
    "Tucumán":                  { lat:-26.8, lon:-65.2 },
    "Catamarca":                { lat:-28.5, lon:-65.8 },
  };

  // ── EFECTO: fetch satelital ────────────────────────────────────
  // Usa GPS si disponible; si no, usa centroide de la provincia seleccionada
  // → el clima llega siempre que el usuario haya elegido provincia
  useEffect(() => {
    console.log("[fetchSat] trigger — provincia:", form.provincia, "coords:", coords);
    const refCoords = coords || (form.provincia ? COORDS_PROV[form.provincia] : null);
    if (!refCoords) { console.log("[fetchSat] sin coords — abortando"); return; }
    setSat(null);
    fetchSat(refCoords.lat, refCoords.lon, form.zona || "NEA", form.provincia, form.enso, (data) => {
      console.log("[fetchSat] respuesta:", data);
      setSat(data);
    });
  }, [coords, form.enso, form.zona, form.provincia, form.localidad]);

  // ── GPS ───────────────────────────────────────────────────────
  async function gpsClick() {
    if (!navigator.geolocation) { setSat({ error:"GPS no disponible" }); return; }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const la = +pos.coords.latitude.toFixed(5);
        const lo = +pos.coords.longitude.toFixed(5);
        setCoords({ lat:la, lon:lo });
        set("zona",      dZona(la, lo));
        set("provincia", dProv(la, lo));
        // Reverse geocoding para obtener localidad automáticamente
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${la}&lon=${lo}&format=json&accept-language=es`);
          const d = await r.json();
          const addr = d.address || {};
          // Prioridad: city > town > village > county > municipality
          const loc = addr.city || addr.town || addr.village || addr.county || addr.municipality || addr.state_district || "";
          if (loc) set("localidad", loc);
        } catch(e) { /* silencioso — el usuario puede escribir la localidad */ }
      },
      () => setSat({ error:"No se pudo obtener ubicación" }),
      { timeout:8000 }
    );
  }

  // ── BUILD PROMPT ──────────────────────────────────────────────

  // ── RUN ANALYSIS ──────────────────────────────────────────────
  async function runAnalysis() {
    setLoading(true); setResult(""); setStep(5);
    let mi = 0;
    const iv = setInterval(() => { setLoadMsg(MSGS[mi % MSGS.length]); mi++; }, 2200);
    try {
      // Guardar en historial antes de analizar
      guardarEnHistorial(form, motorEfectivo, null);
      const cerebroData = calcCerebro(motorEfectivo, form, sat);
      prompt = buildPromptFull(motorEfectivo, form, sat, cerebroData, potreros);
      const res  = await fetch("/api/analyze", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ prompt, systemPrompt:SYS_FULL }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");
      setResult(data.result);

      // Notificar al owner (fire & forget)
      fetch("/api/notify-owner", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          productor:    form.nombreProductor || "Sin nombre",
          fecha:        new Date().toLocaleDateString("es-AR"),
          zona:         form.zona,
          vacas:        form.vacasN,
          ccPond:       ccPondVal?.toFixed(2),
          ccServ:       tray?.ccServ,
          prenezEst:    (tray?.pr || "—") + "%",
          condForr:     sat?.condForr,
          aguaTDS:      form.aguaTDS || "ND",
          resumenInforme: (data.result || "").slice(0, 600),
        }),
      }).catch(() => {});

    } catch (e) {
      setResult("❌ Error: " + e.message);
    } finally {
      clearInterval(iv);
      setLoading(false);
    }
  }

  // ── DESCARGAR PDF ─────────────────────────────────────────────
  function descargarPDF() {
    const gen = (jsPDF) => { try {
      const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
      const W = 210, ML = 15, MR = 15, AU = W - ML - MR;
      let y = 15;
      const salto = (n = 5) => { y += n; };
      const chk   = (n = 15) => { if (y + n > 285) { doc.addPage(); y = 15; } };

      // Header
      doc.setFillColor(45, 106, 31);
      doc.roundedRect(ML, y, AU, 14, 3, 3, "F");
      doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text("CALF AI — Informe Técnico de Cría", ML+4, y+9);
      salto(18);

      // Subtítulo
      doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(80,80,80);
      doc.text(`${form.nombreProductor||"—"} · ${form.zona||form.provincia||"—"} · ${new Date().toLocaleDateString("es-AR")} · Biotipo: ${form.biotipo||"—"}`, ML, y);
      salto(4);
      doc.setDrawColor(45,106,31); doc.setLineWidth(0.5); doc.line(ML, y, ML+AU, y);
      salto(7);

      // KPIs
      const kpis = [
        ["CC hoy",      ccPondVal > 0 ? ccPondVal.toFixed(1) : "sin dato"],
        ["CC serv.",    tray?.ccServ  || "—"],
        ["Preñez est.", (tray?.pr     || "—") + "%"],
        ["Anestro",     (tray?.anestro?.dias || "—") + "d"],
        ["Agua",        form.aguaTDS ? (form.aguaTDS + "mg/L") : "ND"],
      ];
      const kW = AU / kpis.length;
      kpis.forEach(([l, v], ki) => {
        const kx = ML + ki * kW;
        doc.setFillColor(240,248,235); doc.roundedRect(kx, y, kW-2, 14, 2, 2, "F");
        doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(100,100,100);
        doc.text(l, kx + kW/2-1, y+5, { align:"center" });
        doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(45,106,31);
        doc.text(String(v), kx + kW/2-1, y+11, { align:"center" });
      });
      salto(20);


      // ── SCORE POR DIMENSIÓN ──────────────────────────────────────────
      const scoreData = motor ? calcScore(motor, form, null) : null;
      if (scoreData) {
        chk(30);
        doc.setFillColor(20, 40, 22);
        doc.roundedRect(ML, y, AU, 9, 2, 2, "F");
        doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
        doc.text("SCORE: " + scoreData.total + "/100 — " + scoreData.labelTotal, ML+4, y+6);
        salto(12);
        const dimW = AU / scoreData.dim.length;
        scoreData.dim.forEach((d, di) => {
          const dx = ML + di * dimW;
          const col = d.score >= 75 ? [126,200,80] : d.score >= 50 ? [232,160,48] : [224,85,48];
          doc.setFillColor(240,245,240);
          doc.roundedRect(dx, y, dimW-2, 14, 1, 1, "F");
          doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(100,100,100);
          doc.text(d.nombre, dx + (dimW-2)/2, y+5, { align:"center", maxWidth: dimW-4 });
          doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(col[0],col[1],col[2]);
          doc.text(String(d.score), dx + (dimW-2)/2, y+11, { align:"center" });
        });
        salto(18);
      }

      // ── PUNTOS CRÍTICOS DEL MOTOR ────────────────────────────────────
      const cerebPDF = motor ? calcCerebro(motor, form, sat) : null;
      const critiPDF = cerebPDF ? (cerebPDF.tarjetas||[]).filter(t => t.prioridad==="P1"||t.prioridad==="URGENTE").slice(0,3) : [];
      if (critiPDF.length > 0) {
        chk(15);
        doc.setFillColor(224, 85, 48);
        doc.roundedRect(ML, y, AU, 8, 2, 2, "F");
        doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
        doc.text("PUNTOS CRÍTICOS — ACCIÓN ANTES DEL SERVICIO", ML+4, y+5.5);
        salto(11);
        critiPDF.forEach(t => {
          chk(12);
          doc.setFillColor(255,245,242);
          doc.roundedRect(ML, y, AU, 8, 1, 1, "F");
          doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(180,60,30);
          doc.text("▶ " + t.titulo, ML+3, y+5.5, { maxWidth: AU-6 });
          salto(10);
          if (t.que) {
            doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(60,60,60);
            doc.splitTextToSize(t.que.slice(0,120), AU-6).slice(0,2).forEach(ln => {
              chk(4); doc.text("  " + ln, ML+3, y); salto(4);
            });
          }
          salto(2);
        });
        salto(3);
      }

      // ── BALANCE INVERNAL ─────────────────────────────────────────────
      if (motor && motor.balanceMensual) {
        chk(20);
        doc.setFillColor(230,248,230);
        doc.roundedRect(ML, y, AU, 8, 2, 2, "F");
        doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(45,106,31);
        doc.text("BALANCE INVERNAL (Jun–Jul–Ago)", ML+4, y+5.5);
        salto(11);
        const MESES_PDF2 = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
        [5,6,7].forEach((mi, ci) => {
          const bm = motor.balanceMensual.find(m => m.i === mi);
          const bv = bm ? Math.round(bm.balance) : null;
          const bx = ML + ci * (AU/3);
          const col = bv === null ? [180,180,180] : bv >= 0 ? [45,106,31] : [200,60,40];
          doc.setFillColor(245,250,245);
          doc.roundedRect(bx, y, AU/3-3, 12, 1, 1, "F");
          doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(100,100,100);
          doc.text(MESES_PDF2[mi], bx + (AU/3-3)/2, y+4.5, { align:"center" });
          doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(col[0],col[1],col[2]);
          doc.text(bv !== null ? (bv >= 0 ? "+" : "") + bv + " Mcal" : "—", bx + (AU/3-3)/2, y+10, { align:"center" });
        });
        salto(16);
      }

      // ── NDVI Y CAMPO ─────────────────────────────────────────────────────
      if (sat?.ndvi || sat?.temp || sat?.p30) {
        chk(20);
        doc.setFillColor(30,80,50);
        doc.roundedRect(ML, y, AU, 7, 2, 2, "F");
        doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
        doc.text("CAMPO HOY — NDVI Y CLIMA", ML+4, y+5);
        salto(10);
        const ndviCol = (sat.ndvi||0) < 0.35 ? [200,60,40] : (sat.ndvi||0) < 0.50 ? [200,140,20] : [45,140,60];
        doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(...ndviCol);
        doc.text("NDVI: "+(sat.ndvi||"—")+" ("+(sat.condForr||"—")+")  |  Temp: "+(sat.temp||"—")+"°C  |  Lluvia 30d: "+(sat.p30||"—")+"mm", ML, y); salto(5);
        doc.setTextColor(60,60,60);
        const fenNom = {menor_10:"Rebrote",["10_25"]:"Crecimiento","25_50":"Maduración",mayor_50:"Encañado"}[form.fenologia]||form.fenologia||"—";
        doc.text("Vegetación: "+(form.vegetacion||"—")+"  |  Fenología: "+fenNom, ML, y); salto(8);
      }

      // ── ESCENARIOS ────────────────────────────────────────────────────────
      if (tray) {
        chk(35);
        doc.setFillColor(30,80,50);
        doc.roundedRect(ML, y, AU, 7, 2, 2, "F");
        doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
        doc.text("ESCENARIOS — IMPACTO DEL DESTETE EN PREÑEZ", ML+4, y+5);
        salto(10);
        const ccS2 = tray?.ccServ || 0;
        const prB2 = tray?.pr || 0;
        const nV2p = parseInt(form.vacasN)||0;
        const iP2 = (cc) => { const CPR2=[{cc:5.5,pr:93},{cc:5,pr:88},{cc:4.5,pr:80},{cc:4,pr:70},{cc:3.5,pr:50},{cc:3,pr:28}]; const c=Math.min(9,Math.max(1,cc)); if(c>=CPR2[0].cc)return CPR2[0].pr; if(c<=CPR2[CPR2.length-1].cc)return CPR2[CPR2.length-1].pr; for(let i=0;i<CPR2.length-1;i++){if(c<=CPR2[i].cc&&c>=CPR2[i+1].cc){const r=(c-CPR2[i+1].cc)/(CPR2[i].cc-CPR2[i+1].cc);return Math.round(CPR2[i+1].pr+r*(CPR2[i].pr-CPR2[i+1].pr));}} return 20; };
        const escs2 = [
          { l:"Sin cambios", cc:+ccS2.toFixed(1), pr:prB2, col:[180,60,40] },
          { l:"Anticipado 90d", cc:+Math.min(9,ccS2+0.4).toFixed(1), pr:iP2(ccS2+0.4), col:[200,140,20] },
          { l:"Hiperprecoz 50d", cc:+Math.min(9,ccS2+0.7).toFixed(1), pr:iP2(ccS2+0.7), col:[45,140,60] },
        ];
        const eW2 = AU/3-2;
        escs2.forEach((e,i) => {
          const ex2=ML+i*(eW2+3); const diff2=e.pr-prB2;
          doc.setFillColor(245,245,240); doc.roundedRect(ex2,y,eW2,24,2,2,"F");
          doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(100,100,100);
          doc.text(e.l, ex2+eW2/2, y+5, {align:"center",maxWidth:eW2-2});
          doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(...e.col);
          doc.text(e.pr+"%", ex2+eW2/2, y+14, {align:"center"});
          doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(80,80,80);
          doc.text("CC serv. "+e.cc, ex2+eW2/2, y+19.5, {align:"center"});
          if(diff2>0&&nV2p>0){doc.setTextColor(...e.col); doc.text("+"+diff2+"pp = +"+Math.round(nV2p*diff2/100*.95)+" tern.", ex2+eW2/2, y+24, {align:"center"});}
        });
        salto(30);
      }

      // ── VAQUILLONA ────────────────────────────────────────────────────────
      if (motorEfectivo?.vaq1E && !motorEfectivo.vaq1E.mensaje) {
        chk(20);
        doc.setFillColor(30,80,50);
        doc.roundedRect(ML, y, AU, 7, 2, 2, "F");
        doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
        doc.text("VAQUILLONA", ML+4, y+5);
        salto(10);
        const v1x=motorEfectivo.vaq1E; const pvAd=parseFloat(form.pvVacaAdulta)||380;
        const obj1x=Math.round(pvAd*0.40); const ok1x=(v1x.pvSal||0)>=obj1x;
        doc.setFontSize(7.5); doc.setFont("helvetica","normal");
        doc.setTextColor(ok1x?45:180,ok1x?140:60,ok1x?60:40);
        doc.text("1°inv: PV entrada "+(motorEfectivo.pvEntVaq1||"ND")+"kg → GDP "+(v1x.gdpPasto||0)+"g/d → PV salida "+(v1x.pvSal||0)+"kg (obj "+obj1x+"kg) "+(ok1x?"✓":"⚠ no llega"), ML, y, {maxWidth:AU}); salto(5);
        if(motorEfectivo?.vaq2E){
          const v2x=motorEfectivo.vaq2E; const ok2x=v2x.llegas;
          doc.setTextColor(ok2x?45:180,ok2x?140:60,ok2x?60:40);
          doc.text("2°inv: PV entore "+(v2x.pvEntore||0)+"kg (mín "+(v2x.pvMinEntore||0)+"kg) "+(ok2x?"✓":"⚠ no llega")+" · Flushing 25d pre-serv.: siempre", ML, y, {maxWidth:AU}); salto(5);
        }
        salto(4);
      }

      // ── INFORME IA (si existe) ───────────────────────────────────────
      // Secciones
      const partes    = result ? result.split(/(?=\d️⃣)/) : [];
      if (!result) {
        chk(12);
        doc.setFontSize(8); doc.setFont("helvetica","italic"); doc.setTextColor(150,150,150);
        doc.text("Informe de análisis IA no generado — generalo desde el tab Cerebro.", ML, y);
        salto(10);
      }
      const SEC_COLORS_PDF = ["#2d6a1f","#2d6a1f","#d4952a","#d4952a","#c04820"];
      SEC_EMOJIS.forEach((em, si) => {
        if (!result) return;
        const parte = partes.find(p => p.startsWith(em));
        if (!parte) return;
        chk(20);
        const [r, g, b] = SEC_COLORS_PDF[si].match(/\w\w/g).map(h => parseInt(h, 16));

        doc.setFillColor(r, g, b);
        doc.roundedRect(ML, y, AU, 9, 2, 2, "F");
        doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
        doc.text(`${si+1}. ${SEC_TITLES[si]}`, ML+4, y+6);
        salto(12);
        const txt = parte.replace(em,"").trim()
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2300}-\u{23FF}]/gu, "")
          .replace(/[🔴🟡🟢⚡⚠️✅📊🌡🛰📉⚖️💧🩺🐄🫀📏]/gu, "");
        doc.setFontSize(8.5); doc.setFont("helvetica","normal"); doc.setTextColor(44,62,45);
        doc.splitTextToSize(txt, AU).forEach(ln => { chk(5); doc.text(ln, ML, y); salto(4.5); });
        salto(3);
      });

      // Bloque sanidad + agua
      chk(30);
      doc.setFillColor(240,248,235);
      doc.roundedRect(ML, y, AU, 9, 2, 2, "F");
      doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(45,106,31);
      doc.text("SANIDAD", ML+3, y+6);
      salto(12);
      doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(44,62,45);
      const sanLinea = [
        `Aftosa: ${form.sanAftosa==="si"?"Al dia":"SIN VACUNAR"}`,
        `Brucelosis: ${form.sanBrucelosis==="si"?"Al dia":"SIN VACUNAR"}`,
        `IBR/DVB: ${form.sanVacunas==="si"?"Al dia":"SIN VACUNAR"}`,
        "Rev. toros: " + (form.sanToros==="con_control"?"Con revision":"SIN REVISION"),
        `Abortos: ${form.sanAbortos==="si"?"Si":"No"}`,
        `Programa: ${form.sanPrograma==="si"?"Si":"No"}`,
      ].join("  ·  ");
      doc.splitTextToSize(sanLinea, AU).forEach(ln => { chk(5); doc.text(ln, ML, y); salto(4.5); });
      salto(4);

      // Bloque agua
      if (form.aguaTDS || form.aguaFuente) {
        chk(20);
        doc.setFillColor(230,240,255);
        doc.roundedRect(ML, y, AU, 9, 2, 2, "F");
        doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(50,80,160);
        doc.text("CALIDAD DEL AGUA", ML+3, y+6);
        salto(12);
        doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(44,62,45);
        const aguaLinea = [
          form.aguaTDS     ? `TDS: ${form.aguaTDS} mg/L` : "",
          form.aguaTipoSal ? `Tipo sal: ${form.aguaTipoSal}` : "",
          form.aguaFuente  ? `Fuente: ${form.aguaFuente}` : "",
          evalAgua?.pctReducDMI > 0 ? `Reduccion DMI: ${evalAgua.pctReducDMI.toFixed(1)}%` : "",
        ].filter(Boolean).join("  ·  ");
        doc.splitTextToSize(aguaLinea, AU).forEach(ln => { chk(5); doc.text(ln, ML, y); salto(4.5); });
        salto(4);
      }

      // Disclaimer
      chk(20);
      doc.setDrawColor(200,180,100); doc.setLineWidth(0.3); doc.line(ML, y, ML+AU, y);
      salto(5);
      doc.setFontSize(7); doc.setFont("helvetica","italic"); doc.setTextColor(150,130,60);
      doc.splitTextToSize("AVISO LEGAL: " + DISCLAIMER, AU).forEach(ln => { chk(4); doc.text(ln, ML, y); salto(3.5); });

      // Numeración páginas
      const tot = doc.getNumberOfPages();
      for (let p = 1; p <= tot; p++) {
        doc.setPage(p);
        doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(180,180,180);
        doc.text("Calf AI · Peruchena 2003 · Selk 1988 · Short et al. 1990 · NASSEM 2010 · NRC 2000", ML, 292);
        doc.text(`${p}/${tot}`, W-MR, 292, { align:"right" });
      }

      doc.save(`calfai_${(form.nombreProductor||"informe").replace(/\s/g,"_")}_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch(pdfErr) { console.error("PDF error:", pdfErr); alert("Error generando PDF. Intentá de nuevo."); }
    };

    if (window.jspdf?.jsPDF) {
      gen(window.jspdf.jsPDF);
    } else {
      const s = document.createElement("script");
      s.src     = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      s.onload  = () => gen(window.jspdf.jsPDF);
      document.head.appendChild(s);
    }
  }

  // ── DESCARGAR EXCEL ───────────────────────────────────────────
  function descargarCSV() { descargarExcel(); } // alias para botones existentes

  function descargarExcel() {
    const fecha   = new Date().toLocaleDateString("es-AR");
    const isoDate = new Date().toISOString().slice(0,10);
    const dispMS  = calcDisponibilidadMS(form.altPasto, form.tipoPasto);
    const cb      = calcCerebro(motor, form, sat);
    const sc      = calcScore(motor, form, null);

    // Hoja 1: Datos del establecimiento
    const hoja1 = [
      ["CONSULTA TECNICA - CALFAI", "", "", ""],
      ["Fecha de consulta", fecha, "", ""],
      ["", "", "", ""],
      ["IDENTIFICACION", "", "", ""],
      ["Productor",          form.nombreProductor || ""],
      ["Localidad",          form.localidad || ""],
      ["Provincia",          form.provincia || ""],
      ["Zona",               form.zona || ""],
      ["Latitud",            coords?.lat?.toFixed(4) || ""],
      ["Longitud",           coords?.lon?.toFixed(4) || ""],
      ["", "", "", ""],
      ["RODEO GENERAL", "", "", ""],
      ["Biotipo",            form.biotipo || ""],
      ["Vacas (cab)",        form.vacasN || ""],
      ["Toros (cab)",        form.torosN || ""],
      ["PV vaca adulta (kg)", form.pvVacaAdulta || ""],
      ["Prenez historica (%)", form.prenez || ""],
      ["Destete historico (%)", form.pctDestete || ""],
      ["Estado reproductivo", form.eReprod || ""],
      ["Incluye 1er parto",  form.primerParto ? "Si" : "No"],
      ["Inicio servicio",    form.iniServ || ""],
      ["Fin servicio",       form.finServ || ""],
      ["Edad primer entore (meses)", form.edadPrimerEntore || ""],
      ["ENSO",               form.enso || "neutro"],
      ["", "", "", ""],
      ["CONDICION CORPORAL", "", "", ""],
      ["CC ponderada hoy",   ccPondVal?.toFixed(2) || ""],
      ["CC al parto (proyectada)", tray?.ccParto || ""],
      ["CC minima lactacion", tray?.ccMinLact || ""],
      ["CC al servicio",     tray?.ccServ || ""],
      ["Prenez estimada (%)", tray?.pr || ""],
      ["Dias de anestro",    tray?.anestro?.dias || ""],
      ["Meses de lactacion", tray?.mesesLact || ""],
      ["", "", "", ""],
      ["DESTETE", "", "", ""],
      ["% Destete tradicional 180d", form.destTrad  || "0"],
      ["% Destete anticipado 90d",   form.destAntic || "0"],
      ["% Destete hiperprecoz 50d",  form.destHiper || "0"],
      ["", "", "", ""],
      ["FORRAJE Y CAMPO", "", "", ""],
      ["Superficie ganadera (ha)", form.supHa || ""],
      ["% Monte",            form.pctMonte || "0"],
      ["% No ganadero",      form.pctNGan  || "0"],
      ["Vegetacion",         form.vegetacion || ""],
      ["Fenologia",          form.fenologia || ""],
      ["Carga (EV/ha)",      form.vacasN && form.supHa ? (parseFloat(form.vacasN)/parseFloat(form.supHa)).toFixed(2) : ""],
      ["Altura pasto (cm)",  form.altPasto || ""],
      ["Tipo pasto",         form.tipoPasto || ""],
      ["Disponibilidad MS (kg/ha)", dispMS?.msHa || ""],
      ["Nivel disponibilidad", dispMS?.nivel || ""],
      ["", "", "", ""],
      ["CLIMA SATELITAL", "", "", ""],
      ["Temperatura actual (C)", sat?.temp || ""],
      ["Temp max (C)",       sat?.tMax || ""],
      ["Temp min (C)",       sat?.tMin || ""],
      ["Lluvia 7d (mm)",     sat?.p7   || ""],
      ["Lluvia 30d (mm)",    sat?.p30  || ""],
      ["Balance hidrico (mm)", sat?.deficit || ""],
      ["NDVI",               sat?.ndvi || ""],
      ["Condicion forrajera", sat?.condForr || ""],
      ["Lluvia prox 7d (mm)", sat?.lluviaProx7 ?? ""],
      ["Temp media prox 7d (C)", sat?.tempMediaProx7 ?? ""],
      ["Helada prox 7d",     sat?.helada7 ? "Si" : sat ? "No" : ""],
      ["", "", "", ""],
      ["SUPLEMENTACION POR CATEGORIA", "", "", ""],
      ["Suplemento V2S",        form.supl_v2s     || ""],
      ["Dosis V2S (kg/d)",      form.dosis_v2s    || "0"],
      ["Suplemento 2 V2S",      form.supl2_v2s    || ""],
      ["Dosis 2 V2S (kg/d)",    form.dosis2_v2s   || ""],
      ["Suplemento Toros",      form.supl_toros   || ""],
      ["Dosis Toros (kg/d)",    form.dosis_toros  || "0"],
      ["Suplemento 2 Toros",    form.supl2_toros  || ""],
      ["Dosis 2 Toros (kg/d)",  form.dosis2_toros || ""],
      ["Suplemento Vaq2",       form.supl_vaq2    || ""],
      ["Dosis Vaq2 (kg/d)",     form.dosis_vaq2   || "0"],
      ["Suplemento 2 Vaq2",     form.supl2_vaq2   || ""],
      ["Dosis 2 Vaq2 (kg/d)",   form.dosis2_vaq2  || ""],
      ["Suplemento Vaq1",       form.supl_vaq1    || ""],
      ["Dosis Vaq1 (kg/d)",     form.dosis_vaq1   || "0"],
      ["Suplemento 2 Vaq1",     form.supl2_vaq1   || ""],
      ["Dosis 2 Vaq1 (kg/d)",   form.dosis2_vaq1  || ""],
      ["Suplemento Ternero",    form.supl_ternero || ""],
      ["Dosis Ternero (kg/d)",  form.dosis_ternero|| "0"],
      ["", "", "", ""],
      ["AGUA Y SANIDAD", "", "", ""],
      ["TDS agua (mg/L)",    form.aguaTDS || ""],
      ["Tipo sal agua",      form.aguaTipoSal || ""],
      ["Fuente agua",        form.aguaFuente || ""],
      ["Reduccion DMI (%)",  evalAgua?.pctReducDMI?.toFixed(1) || "0"],
      ["Aftosa",             form.sanAftosa    === "si" ? "Al dia" : "Sin vacunar"],
      ["Brucelosis",         form.sanBrucelosis=== "si" ? "Al dia" : "Sin vacunar"],
      ["IBR/DVB",            form.sanVacunas   === "si" ? "Al dia" : "Sin vacunar"],
      ["Revision toros",     form.sanToros     === "con_control" ? "Con revision" : "Sin revision"],
      ["Historia abortos",   form.sanAbortos   === "si" ? "Si" : "No"],
      ["Programa sanitario", form.sanPrograma  === "si" ? "Si" : "No"],
      ["Parasito externo",   form.sanParasitoExt || ""],
      ["Parasito interno",   form.sanParasitoInt || ""],
      ["", "", "", ""],
      ["VAQUILLONA 1 INVIERNO", "", "", ""],
      ["Vaq1 (cab)",         Math.round((parseInt(form.vacasN)||0)*(parseFloat(form.pctReposicion)||20)/100)],
      ["% Reposicion",       form.pctReposicion || "20"],
      ["Edad en mayo (meses)", form.edadVaqMayo || ""],
      ["Tipo destete vaq",   form.tipoDesteteVaq || ""],
      ["PV entrada vaq1 (kg)", form.vaq1PV || tcSave?.pvMayoPond || ""],
      ["PV salida vaq1 (kg)", vaq1E?.pvSal || ""],
      ["GDP vaq1 (g/d)",     vaq1E?.gdpReal || ""],
      ["", "", "", ""],
      ["VAQUILLONA 2 INVIERNO", "", "", ""],
      ["Vaq2 (cab)",         form.vaq2N || ""],
      ["PV entrada vaq2 (kg)", pvEntradaVaq2 || ""],
      ["PV al entore (kg)",  vaq2E?.pvEntore || ""],
      ["Llega objetivo entore", vaq2E?.llegas ? "Si" : vaq2E ? "No" : ""],
      ["", "", "", ""],
      ["V2S", "", "", ""],
      ["V2S (cab)",          form.v2sN || ""],
      ["V2S PV (kg)",        form.v2sPV || ""],
      ["V2S ternero al pie", form.v2sTernero === "si" ? "Si" : "No"],
      ["", "", "", ""],
      ["TERNEROS", "", "", ""],
      ["Terneros (cab)",     tcSave?.terneros || ""],
      ["PV ternero mayo (kg)", tcSave?.pvMayoPond || ""],
      ["", "", "", ""],
      ["Consulta especifica", form.consultaEspecifica || ""],
    ];

    // Hoja 2: Balance mensual
    const MESES_XL = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const hoja2 = [
      ["BALANCE ENERGETICO MENSUAL", form.nombreProductor || "Establecimiento", "", "", "", "", ""],
      ["Fecha consulta:", fecha, "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["Mes","Oferta (Mcal/d)","Demanda (Mcal/d)","Balance (Mcal/d)","Deficit","% Cobertura","Carga ajustada"],
    ];
    if (motor?.balanceMensual) {
      motor.balanceMensual.forEach(m => {
        hoja2.push([
          MESES_XL[m.i] || m.i,
          m.oferta  != null ? +m.oferta.toFixed(1)  : "",
          m.demanda != null ? +m.demanda.toFixed(1) : "",
          m.balance != null ? +m.balance.toFixed(1) : "",
          m.deficit ? "SI" : "No",
          m.cobertura != null ? +(m.cobertura * 100).toFixed(0) : "",
          m.cargaAjustada != null ? +m.cargaAjustada.toFixed(2) : "",
        ]);
      });
    }

    // Hoja 3: Diagnostico
    const hoja3 = [
      ["DIAGNOSTICO TECNICO - CALFAI", "", ""],
      ["Fecha consulta:", fecha, ""],
      ["", "", ""],
      ["SCORES", "", ""],
      ["Score total",        sc?.total ?? ""],
      ["Score CC",           sc?.dim?.find(d=>d.id==="cc")?.score ?? ""],
      ["Score Balance",      sc?.dim?.find(d=>d.id==="balance")?.score ?? ""],
      ["Score Reproduccion", sc?.dim?.find(d=>d.id==="repro")?.score ?? ""],
      ["Score Vaquillona",   sc?.dim?.find(d=>d.id==="vaq")?.score ?? ""],
      ["Score Sanidad",      sc?.dim?.find(d=>d.id==="sanidad")?.score ?? ""],
      ["", "", ""],
      ["ANALISIS CEREBRO", "", ""],
      ["Score riesgo",       cb?.resumen?.scoreRiesgo || ""],
      ["Nivel riesgo",       cb?.resumen?.nivelRiesgo || ""],
      ["Prenez potencial (%)", cb?.resumen?.prenezPot || ""],
      ["Terneros adicionales", cb?.resumen?.ternerosDif || ""],
      ["Valor adicional",    cb?.resumen?.valorDif || ""],
      ["Anos recupero Vaq1", cb?.anosRecupVaq1 || ""],
      ["Anos recupero Vaq2", cb?.anosRecupVaq2 || ""],
      ["", "", ""],
      ["PUNTOS CRITICOS", "", ""],
    ];
    if (cb?.tarjetas) {
      cb.tarjetas.forEach(t => {
        hoja3.push([t.prioridad || "", t.titulo || "", t.descripcion || ""]);
      });
    }
    hoja3.push(["", "", ""]);
    hoja3.push(["BALANCE INVERNAL", "", ""]);
    hoja3.push(["Balance junio (Mcal/d)",  motor?.balanceMensual?.[5]?.balance != null ? +motor.balanceMensual[5].balance.toFixed(1) : ""]);
    hoja3.push(["Balance julio (Mcal/d)",  motor?.balanceMensual?.[6]?.balance != null ? +motor.balanceMensual[6].balance.toFixed(1) : ""]);
    hoja3.push(["Balance agosto (Mcal/d)", motor?.balanceMensual?.[7]?.balance != null ? +motor.balanceMensual[7].balance.toFixed(1) : ""]);
    hoja3.push(["Meses en deficit (jun-ago)", motor?.balanceMensual ? motor.balanceMensual.filter(m=>[5,6,7].includes(m.i)&&m.deficit).length : ""]);
    if (result) {
      hoja3.push(["", "", ""]);
      hoja3.push(["INFORME IA", "", ""]);
      hoja3.push([result.replace(/\n/g, " | "), "", ""]);
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hoja1), "Establecimiento");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hoja2), "Balance mensual");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hoja3), "Diagnostico");
    XLSX.writeFile(wb, `calfai_${(form.nombreProductor||"datos").replace(/\s/g,"_")}_${isoDate}.xlsx`);
  }

  // ══════════════════════════════════════════════════════════════
  // PASOS DEL FORMULARIO
  // ══════════════════════════════════════════════════════════════

  // ── PASO 0: UBICACIÓN ─────────────────────────────────────────
  const renderUbicacion = () => (
    <div>
      {/* GPS opcional — provincia es lo que importa */}
      {!coords && (
        <div style={{ background:`${C.green}08`, border:`1px solid ${C.green}30`, borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
          <div style={{ fontFamily:C.sans, fontSize:12, color:C.green, fontWeight:700, marginBottom:4 }}>
            📌 Seleccioná Zona y Provincia abajo — es todo lo que necesitás
          </div>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, lineHeight:1.6 }}>
            El análisis usa datos climáticos históricos por provincia (temperatura, precipitación, estacionalidad).
            El GPS es opcional: solo agrega temperatura y NDVI del satélite en tiempo real.
          </div>
          <button onClick={gpsClick} style={{
            marginTop:8, padding:"6px 12px", borderRadius:8,
            background:"transparent", border:`1px solid ${C.green}40`,
            fontFamily:C.font, fontSize:9, color:C.green, cursor:"pointer"
          }}>
            📍 Activar GPS igual (para datos satelitales en tiempo real)
          </button>
        </div>
      )}
      {coords && (
        <Alerta tipo="ok">
          📍 GPS activo: {form.zona} · {form.provincia} {form.localidad ? `· ${form.localidad}` : ""}
          <span style={{ opacity:0.6, fontSize:10 }}> ({coords.lat.toFixed(3)}°, {coords.lon.toFixed(3)}°)</span>
        </Alerta>
      )}
      {sat && !sat.error && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, margin:"10px 0" }}>
          <MetricCard label="TEMPERATURA" value={sat.temp+"°C"}  color={C.amber} />
          <MetricCard label="NDVI"        value={sat.ndvi}        color={C.green} sub={sat.condForr} />
          <MetricCard label="LLUVIA 30D"  value={sat.p30+"mm"}   color={C.blue} />
          <MetricCard label="BALANCE"     value={(sat.deficit>0?"+":"")+sat.deficit+"mm"} color={sat.deficit>0?C.green:C.red} />
        </div>
      )}
      {sat?.error && <Alerta tipo="warn">{sat.error}</Alerta>}
      {/* Zona + Provincia vinculadas */}
      {(() => {
        const PROVS_POR_ZONA = {
          "NEA":              ["Corrientes","Chaco","Formosa","Misiones","Entre Ríos"],
          "NOA":              ["Salta","Jujuy","Tucumán","Santiago del Estero","Catamarca"],
          "Pampa Húmeda":     ["Buenos Aires","Santa Fe","Córdoba","Entre Ríos","La Pampa"],
          "Paraguay Oriental":["Paraguay Oriental"],
          "Chaco Paraguayo":  ["Chaco Paraguayo"],
          "Brasil (Cerrado)": ["Mato Grosso do Sul (BR)","Mato Grosso / Goiás (BR)","Pantanal (BR)"],
          "Bolivia (Llanos)": ["Santa Cruz / Beni (BO)","Tarija / Chaco (BO)"],
        };
        const zonaActual  = form.zona || "";
        const provsFiltro = zonaActual ? (PROVS_POR_ZONA[zonaActual] || []) : Object.values(PROVS_POR_ZONA).flat();
        const handleZona  = (v) => {
          set("zona", v);
          // Si la provincia actual no corresponde a la nueva zona → resetear a vacío
          // El usuario elige la provincia — no auto-seleccionar
          const nuevasProvs = PROVS_POR_ZONA[v] || [];
          if (form.provincia && !nuevasProvs.includes(form.provincia)) {
            set("provincia", "");
          }
        };
        return (
          <>
            <SelectF label="ZONA" value={form.zona} onChange={handleZona}
              placeholder="Seleccioná la zona..."
              options={[
                ["NEA","NEA — Corrientes · Chaco · Formosa · Misiones"],
                ["NOA","NOA — Salta · Jujuy · Tucumán · Stgo. del Estero"],
                ["Pampa Húmeda","Pampa Húmeda — Bs.As · Santa Fe · Córdoba"],
                ["Paraguay Oriental","Paraguay Oriental"],
                ["Chaco Paraguayo","Chaco Paraguayo"],
                ["Brasil (Cerrado)","Brasil — Cerrado / Pantanal"],
                ["Bolivia (Llanos)","Bolivia — Llanos orientales"],
              ]} />
            <SelectF label="PROVINCIA / REGIÓN" value={form.provincia}
              onChange={v=>set("provincia",v)}
              placeholder={zonaActual ? "Seleccioná provincia de " + zonaActual + "..." : "← Primero elegí la zona"}
              options={provsFiltro.map(p=>[p,p])} />
          </>
        );
      })()}
      <SelectF label="ENSO" value={form.enso} onChange={v=>set("enso",v)} options={[
        ["neutro","Neutro — año promedio"],["nino","El Niño (+25% oferta forrajera)"],["nina","La Niña (−25% oferta forrajera)"],
      ]} />
      <Input label="PRODUCTOR / ESTABLECIMIENTO" value={form.nombreProductor} onChange={v=>set("nombreProductor",v)} placeholder="Nombre del establecimiento" />
      <Input id="campo-localidad" label="PARAJE / CAMPO (opcional)" value={form.localidad} onChange={v=>set("localidad",v)} placeholder="Ej: Charata, El Pintado, La Fidelidad…" sub="Solo para el informe — no afecta el cálculo" />

      {/* Toros: ver diagnóstico en Sanidad */}
    </div>
  );

  // ── PASO 1: RODEO ─────────────────────────────────────────────
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
      <Toggle label="¿Incluye vacas de 1° parto?" value={form.primerParto} onChange={v=>set("primerParto",v)} />
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
        <Input label="% DESTETE HISTÓRICO"  value={form.pctDestete} onChange={v=>set("pctDestete",v)} placeholder="" type="number" />
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
                  ℹ El fin del servicio cruza el año — ajustado a {finAnioCorr} automáticamente
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
                {warnServ ? "⚠ " + warnServ : "✓ Servicio de " + diasServ + " días — " + (diasServ <= 90 ? "óptimo para NEA" : "ajustar si es posible")}
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
              : "⚠️ Entore tardío (sin suplementación) — la vaquillona queda como categoría extra un año completo. Costo real: menor índice reproductivo + más carga sin producción.";
            return <div style={{ fontFamily:C.sans, fontSize:11, color, lineHeight:1.4 }}>{msg}</div>;
          })()}
        </div>
      )}
      {cadena && (
        <div style={{ background:C.card2, borderRadius:10, padding:12, border:`1px solid ${C.border}`, marginBottom:12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {[["Parto temprano",fmtFecha(cadena.partoTemp)],["Parto tardío",fmtFecha(cadena.partoTard)],
              ["Destete temp.",fmtFecha(cadena.desteTemp)],["Destete tard.",fmtFecha(cadena.desteTard)]].map(([l,v])=>(
              <div key={l}>
                <div style={{ fontFamily:C.font, fontSize:8, color:C.textDim }}>{l}</div>
                <div style={{ fontFamily:C.sans, fontSize:12, color:C.text, fontWeight:600 }}>{v}</div>
              </div>
            ))}
          </div>
          {cadena.terneroOtono && <Alerta tipo="error" style={{ marginTop:8 }}>⚠️ Ternero al pie en otoño — destete anticipado URGENTE</Alerta>}
        </div>
      )}
      <div style={{ background:`${C.amber}08`, border:`1px solid ${C.amber}30`, borderRadius:12, padding:14, marginTop:4 }}>
        <div style={{ fontFamily:C.font, fontSize:10, color:C.amber, letterSpacing:1, marginBottom:10 }}>🐄 VAQUILLONA — DATOS PARA SUPLEMENTACIÓN</div>
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
          ¿CUÁNDO SE HIZO EL TACTO?
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
              ℹ Los valores que ingresás se convierten automáticamente a escala 1-9 para los cálculos.
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
            // ¿Ya pasó el tacto este año? Meses pasados = info confiable
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
          ⚠ Los valores son un ejemplo típico NEA — editá con los datos reales del tacto
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
        <Slider label="🟢 Tradicional (180d)" value={parseFloat(form.destTrad)||0}  min={0} max={100} step={10} onChange={v=>set("destTrad",v)}  unit="%" color={C.green} />
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
              <Pill color={tray.anestro?.riesgo ? C.red : C.green}>⏱ Anestro {tray.anestro?.dias}d</Pill>
              <Pill color={C.textDim}>📉 Caída lact. −{tray.caidaLact} CC</Pill>
              <Pill color={C.blue}>🍼 {tray.mesesLact}m lactación</Pill>
            </div>
          </div>

          {/* Cards individuales con contexto */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            <MetricCard label="CC TACTO = CC PARTO"
              value={tray.ccParto}
              color={smf(parseFloat(tray.ccParto),4.5,5.0)}
              sub={parseFloat(tray.ccParto)<4.5?"⚠ Riesgo anestro prolongado":parseFloat(tray.ccParto)>=5.0?"✓ Óptimo (escala 1-9)":"Aceptable"} />
            <MetricCard label="CC MÍN. EN LACTACIÓN"
              value={tray.ccMinLact}
              color={smf(parseFloat(tray.ccMinLact),3.5,4.0)}
              sub={`Piso al que cae en lactación (−${tray.caidaLact} CC)`} />
            <MetricCard label="CC AL SERVICIO"
              value={tray.ccServ}
              color={smf(parseFloat(tray.ccServ),4.5,5.0)}
              sub={parseFloat(tray.ccServ)>=5.0?"→ Preñez ≥88%":parseFloat(tray.ccServ)>=4.5?"→ Preñez 80–87%":parseFloat(tray.ccServ)>=4.0?"→ Preñez ~70%":parseFloat(tray.ccServ)>=3.5?"→ Preñez ~50% ⚠":""+"→ Preñez <30% 🔴"} />
            <MetricCard label="PREÑEZ RODEO (CC PROM.)"
              value={tray.pr+"%"}
              color={smf(tray.pr,35,55)}
              sub={dist?.grupos?.length > 1 ? "CC promedio — preñez real por grupo ↓" : `Anestro posparto: ${tray.anestro?.dias}d`} />
          </div>

          {/* Alerta anestro */}
          <Alerta tipo={tray.anestro?.riesgo?"error":"ok"}>
            Anestro posparto: <strong>{tray.anestro?.dias} días</strong> — {tray.anestro?.riesgo
              ? "⚠️ RIESGO: puede no ciclar durante el servicio → revisar CC al parto y destete"
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
                        ["CC MÍN. LACTACIÓN", g.ccMinLact, 3.5, 4.0, "piso durante la lactación"],
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
            <Input label="% REPOSICIÓN" value={form.pctReposicion} onChange={v=>set("pctReposicion",v)} placeholder="" type="number" />
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
                  PV objetivo: <strong style={{color:C.text}}>&ge; {obj220} kg</strong>
                  {llegaObj
                    ? <span style={{color:C.green}}> ✓ Proyectado {pvAgosto} kg</span>
                    : <span style={{color:C.amber}}> ⚠ Proyectado {pvAgosto} kg — ajustar suplementación</span>}
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
                {vaq2E.llegas?"✓ Llega al entore":"⚠ No llega al objetivo"}
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
                          {vaq2E.llegas ? "✅ llega" : `⚠ falta ${(vaq2E.pvMinEntore||0)-(vaq2E.pvEntore||0)} kg`}
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
              {form.v2sTernero === "si" ? "⚠ Con ternero al pie" : "Sin ternero"}
            </span>
          )}
        </summary>
        <div style={{ background:C.card2, borderRadius:"0 0 12px 12px", padding:14, border:`1px solid ${C.border}`, borderTop:"none" }}>

          {/* Banner categoría crítica */}
          <div style={{ background:"rgba(232,160,48,.06)", border:"1px solid rgba(232,160,48,.25)", borderRadius:10, padding:"10px 12px", marginBottom:14 }}>
            <div style={{ fontFamily:C.font, fontSize:9, color:C.amber, letterSpacing:1, marginBottom:4 }}>⚠ CATEGORÍA DE MAYOR RIESGO DEL RODEO</div>
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
            DISTRIBUCIÓN CC VACAS 2° SERVICIO (por grupo)
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
            label="¿Tienen ternero al pie durante el 2° servicio?"
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
                        sub={r.ccParto < 4.5 ? "⚠ Riesgo" : "OK"} />
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
                        value={deficit > 0 ? "−"+deficit.toFixed(1)+" Mcal" : "Cubre req."}
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
              {parseFloat(cargaEV)>1.2?"⚠ Sobrecarga":parseFloat(cargaEV)>0.8?"Carga media":"✓ Carga adecuada"}
            </div>
          </div>
        </div>

        {/* ── Potreros ── */}
        <div style={{ fontFamily:C.font, fontSize:9, color:C.green, letterSpacing:1, marginBottom:10 }}>
          🗺️ POTREROS — cargá cada potrero o lote
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

  // ── PASO 6: SUPLEMENTACIÓN ────────────────────────────────────
  const renderSuplAgua = ({ showAgua = true } = {}) => {
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
      { key:"vaq2",    label:"Vaquillona 2° inv.",     icon:"🟡", pv:pvVaq2S,  color:C.amber,  supl1k:"supl_vaq2",    dos1k:"dosis_vaq2",    supl2k:"supl2_vaq2",   dos2k:"dosis2_vaq2",
        razon:"Objetivo: PV entore ≥75% PV adulto. Sin suplemento: 120–200 g/d GDP — no llega." },
      { key:"vaq1",    label:"Vaquillona 1° inv.",     icon:"🟢", pv:pvVaq1S,  color:"#7ec850",supl1k:"supl_vaq1",    dos1k:"dosis_vaq1",    supl2k:"supl2_vaq1",   dos2k:"dosis2_vaq1",
        razon:"Sin ternero, en crecimiento activo. Respuesta marginal máxima al suplemento del sistema." },
      { key:"ternero", label:"Ternero post-destete",   icon:"🐮", pv:pvTernS,  color:C.textDim,supl1k:"supl_ternero", dos1k:"dosis_ternero", supl2k:"supl2_ternero",dos2k:"dosis2_ternero",
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
        {showAgua && _aguaSection}
        {showAgua && <div style={{ height:1, background:C.border, margin:"16px 0" }} />}
        {/* ── Meses de suplementación — selector exacto ── */}
        <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:8 }}>
            MESES DE SUPLEMENTACIÓN — seleccioná los meses que aplicás
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
                  ? "⚠ Sin meses seleccionados — el suplemento no aplica en el balance"
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
                  ? { tipo:"hiperprecoz", label:"⚡ Hiperprecoz (≤50 días)", color:C.red,
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
                  : { tipo:"tradicional", label:"🟢 Tradicional (180 días)", color:C.green,
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
              ⚡ ¿POR QUÉ NO SUPLEMENTAR VACAS CON TERNERO AL PIE?
            </div>
            <div style={{ fontFamily:C.sans, fontSize:11, color:C.text, marginBottom:8, lineHeight:1.5 }}>
              La lactación le cuesta a la vaca <strong style={{color:C.red}}>6–8 Mcal/día</strong> extras. Para compensar ese gasto con suplemento necesitarías darle <strong style={{color:C.red}}>{(6.5/2.6).toFixed(1)} kg/día de expeller</strong> — más caro e ineficiente. Además, mientras el ternero esté al pie, la vaca no cicla por el estímulo del amamantamiento (bloqueo LH).
            </div>
            <div style={{ fontFamily:C.sans, fontSize:11, color:C.green, lineHeight:1.5 }}>
              ✅ <strong>La herramienta correcta es el destete:</strong> al retirar el ternero, la vaca elimina ese gasto de 6–8 Mcal/día y retoma el cicio en <strong>7–14 días</strong>. Ningún suplemento logra eso.
            </div>
          </div>
        </div>

        {/* ══ PANEL 2: SUPLEMENTACIÓN — solo categorías que lo necesitan ══ */}
        <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:10 }}>
          💊 SUPLEMENTACIÓN — V2S · TOROS · VAQUILLONA 1° y 2°
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
                    {alim?.nota && <div style={{ fontFamily:C.font, fontSize:8, color:C.amber, marginTop:3 }}>ℹ {alim.nota}</div>}
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
              RESUMEN SUPLEMENTACIÓN — costo y Mcal total por categoría
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
      <div style={{ fontFamily:C.font, fontSize:10, color:C.amber, letterSpacing:1, marginBottom:4 }}>🩺 SANIDAD REPRODUCTIVA</div>
      <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, marginBottom:16 }}>
        La sanidad es el techo del sistema. Sin ella, cualquier mejora nutricional tiene rendimiento marginal.
      </div>

      {/* Vacunas obligatorias */}
      <Toggle label="💉 ¿Vacunación Aftosa al día?"        value={form.sanAftosa     === "si"} onChange={v => set("sanAftosa",     v ? "si" : "no")} />
      {form.sanAftosa === "no" && <Alerta tipo="error">Aftosa sin vacunar — obligatoria (SENASA). Dos dosis anuales mínimo. Riesgo de brote y clausura comercial.</Alerta>}

      <Toggle label="💉 ¿Vacunación Brucelosis al día?"    value={form.sanBrucelosis === "si"} onChange={v => set("sanBrucelosis", v ? "si" : "no")} />
      {form.sanBrucelosis === "no" && <Alerta tipo="error">Brucelosis sin vacunar — obligatoria en terneras 3–8 meses (SENASA RES.114/21). Zoonosis. Riesgo de aborto masivo al 7° mes.</Alerta>}

      <Toggle label="💉 ¿Vacunación IBR/DVB al día?"       value={form.sanVacunas  === "si"} onChange={v => set("sanVacunas",   v ? "si" : "no")} />
      {form.sanVacunas === "no" && <Alerta tipo="error">IBR/DVB sin vacunar: riesgo de reducción de preñez hasta −15 pp.</Alerta>}

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
      <Toggle label="🐂 ¿Toros con revisión pre-servicio?"  value={form.sanToros    === "con_control"} onChange={v => set("sanToros",     v ? "con_control" : "sin_control")} />
      {form.sanToros === "sin_control" && <Alerta tipo="error">Toros sin revisión pre-servicio: un toro con lesión no detectada puede dejar 15–20 vacas vacías sin que nadie lo note hasta el tacto.</Alerta>}

      <Toggle label="📋 ¿Historia de abortos en el rodeo?" value={form.sanAbortos  === "si"} onChange={v => set("sanAbortos",   v ? "si" : "no")} />
      {form.sanAbortos === "si" && <Alerta tipo="warn">Historia de abortos: diagnóstico diferencial IBR/DVB/Leptospira/Brucelosis/Neospora prioritario.</Alerta>}

      <Toggle label="📋 ¿Programa sanitario estructurado?" value={form.sanPrograma === "si"} onChange={v => set("sanPrograma",  v ? "si" : "no")} />
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


  // ── Conectar renders de pasos ──────────────────────────────────
  const {
    renderCampo, renderRodeoCompleto, renderManejo,
  } = getPasoRenders({
    form, set, setDist: (k,v) => setForm(f=>({...f,[k]:v})),
    gpsClick,
    step, setStep, motor, motorEfectivo, tray, balanceMensual, sat,
    coords, setCoords, ccPondVal, evalAgua, sanidad, nVaqRepos, score,
    result, setResult, loading, setLoading, loadMsg, setLoadMsg,
    setTab, tab, confianza, scoreRiesgo, nivelRiesgo, colorRiesgo,
    cargaEV_ha, impactoCola, vaq1E, vaq2E, ccDesvio, dist,
    stockStatus, toroDxn, alertasMotor, modoForraje, setModoForraje,
    vistaSupl, setVistaSupl, usaPotreros, setUsaPotreros,
    potreros, setPotreros, runAnalysis,
    pvEntVaq1, pvSalidaVaq1, pvEntradaVaq2,
    nVacas, nToros, nV2s, nVaq1, nVaq2, cadena, disponMS, tcSave,
    PASOS, C, cerebro: calcCerebro(motorEfectivo, form, sat),
  });

  // ── 6 pasos de planilla de carga ───────────────────────────────
  const renderZona         = renderUbicacion;
  const renderRodeoCC      = () => (
    <div>
      {renderRodeo()}
      <div style={{ height:1, background:C.border, margin:"20px 0" }} />
      {renderCC()}
      <div style={{ height:1, background:C.border, margin:"20px 0" }} />
      {renderCategorias()}
    </div>
  );
  const renderPotreros     = () => (
    <div>
      {renderForraje()}
      <div style={{ height:1, background:C.border, margin:"20px 0" }} />
      {renderSuplAgua({ showAgua: false })}
    </div>
  );
  const renderAguaSanidad  = () => (
    <div>
      <PanelAgua form={form} set={set} sat={sat} />
      <div style={{ height:1, background:C.border, margin:"20px 0" }} />
      {renderSanidad()}
    </div>
  );
  const renderDiagnostico  = () => {
    const scoreD = motor ? calcScore(motor, form, calcFaseCiclo(motor?.cadena ?? calcCadena(form.iniServ, form.finServ), form)) : null;
    if (!form.vacasN && !motor) return (
      <div style={{ padding:40, textAlign:"center", fontFamily:C.font, fontSize:11, color:C.textDim }}>
        Completá los pasos anteriores para ver el diagnóstico.
      </div>
    );
    return (
      <div>
        <DashboardEstablecimiento
          motor={motorEfectivo} form={form} sat={sat} score={scoreD}
          confianza={confianza} onTab={(t) => t === "cerebro" && setStep(5)}
        />
        <div style={{ height:1, background:C.border, margin:"20px 0" }} />
        {motor && <GraficosBalance form={form} sat={sat} cadena={cadena} tray={tray} motor={motor} />}
      </div>
    );
  };
  const renderRecomendaciones = () => (
    <div>
      {/* Cerebro estructurado (cálculo local) */}
      <TabCerebro motor={motorEfectivo} form={form} sat={sat} />

      <div style={{ height:1, background:C.border, margin:"24px 0" }} />

      {/* Análisis IA */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 18px" }}>
        <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1, marginBottom:12 }}>
          INFORME IA — diagnóstico completo del sistema con recomendaciones personalizadas
        </div>
        {!result && !loading && (
          <button onClick={runAnalysis} style={{
            width:"100%", padding:"14px", borderRadius:10, cursor:"pointer",
            background:C.green, border:"none",
            fontFamily:C.font, fontSize:13, fontWeight:700, color:"#fff",
          }}>
            Generar informe con IA
          </button>
        )}
        {loading && <LoadingPanel msg={loadMsg} />}
        {result && (
          <>
            <RenderInforme texto={result} />
            <details style={{ marginTop:12 }}>
              <summary style={{ fontFamily:C.font, fontSize:10, color:C.textDim,
                cursor:"pointer", padding:"10px 14px", background:C.card2,
                borderRadius:10, border:`1px solid ${C.border}`,
                listStyle:"none", display:"flex", alignItems:"center",
                justifyContent:"space-between" }}>
                <span>Planes de acción con dosis y fundamento</span>
                <span>&#9660;</span>
              </summary>
              <div style={{ marginTop:6 }}>
                <PanelRecomendaciones motor={motor} form={form} />
              </div>
            </details>
            <button onClick={runAnalysis} style={{
              marginTop:10, width:"100%", padding:10, borderRadius:10,
              cursor:"pointer", background:"transparent",
              border:`1px solid ${C.border}`,
              fontFamily:C.font, fontSize:11, color:C.textDim,
            }}>
              Regenerar informe
            </button>
          </>
        )}
      </div>
    </div>
  );

  const RENDERS = [
    renderZona, renderRodeoCC, renderPotreros,
    renderAguaSanidad, renderDiagnostico, renderRecomendaciones,
  ];

  // ══════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ══════════════════════════════════════════════════════════════
  if (!session) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ fontFamily:C.font, fontSize:28, color:C.green, marginBottom:8, letterSpacing:2 }}>🌾 CALF AI</div>
      <div style={{ fontFamily:C.sans, fontSize:13, color:C.textDim, marginBottom:32 }}>Diagnóstico de cría bovina</div>
      <button onClick={()=>signIn("google")} style={{ background:C.green, color:"#0b1a0c", padding:"14px 28px", borderRadius:12, border:"none", fontFamily:C.sans, fontSize:15, fontWeight:700, cursor:"pointer" }}>
        Iniciar sesión con Google
      </button>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=IBM+Plex+Sans:wght@400;600;700&display=swap');
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        select, input, button { outline:none; }
        input[type=range]::-webkit-slider-thumb { width:18px; height:18px; }
        details > summary::-webkit-details-marker { display:none; }
        @keyframes pulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.2)} }
        .calfai-tabs::-webkit-scrollbar { display:none; }
        .calfai-tabs { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>

      {/* Header sticky */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"10px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:C.font, fontSize:14, color:C.green, letterSpacing:2, fontWeight:700 }}>
            CALF AI<span style={{ color:C.textDim, fontSize:10, marginLeft:6 }}>v1</span>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {ccPondVal > 0 && <Pill color={smf(ccPondVal,4.5,5.5)}>CC {ccPondVal.toFixed(1)}</Pill>}
            {evalAgua && evalAgua.cat.riesgo >= 2 && <Pill color={C.red}>Agua: {evalAgua.cat.label}</Pill>}
            {sanidad?.alerts?.length > 0 && <Pill color={C.red}>Sanidad: {sanidad.alerts.length} alertas</Pill>}
            {form.nombreProductor && <span style={{ fontFamily:C.font, fontSize:10, color:C.textDim }}>{form.nombreProductor}</span>}
            <button onClick={()=>signOut()} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textDim, padding:"5px 10px", fontFamily:C.font, fontSize:10, cursor:"pointer" }}>
              Salir
            </button>
            <button
              onClick={() => setShowHistorial(true)}
              style={{ background:C.green+"15", border:"1px solid "+C.green+"30", borderRadius:8,
                padding:"6px 12px", fontFamily:C.font, fontSize:10, cursor:"pointer",
                color:C.green }}>
              Establecimientos
            </button>
          </div>
        </div>

        {/* Tab nav horizontal */}
        <div className="calfai-tabs" style={{ maxWidth:1100, margin:"0 auto", display:"flex", overflowX:"auto", borderTop:`1px solid ${C.border}` }}>
          {PASOS.map((p, i) => {
            const dotColor = (() => {
              const step_alerts = alertasMotor.filter(a => {
                if (i === 1) return ["cc_serv_bajo","cc_desvio_campo"].includes(a.id);
                if (i === 3) return a.id?.startsWith("agua") || a.id?.startsWith("carga");
                if (i === 4) return a.id?.startsWith("balance_inv") || a.id?.startsWith("cc_");
                return false;
              });
              if (step_alerts.some(a=>a.tipo==="P1")) return C.red;
              if (step_alerts.some(a=>a.tipo==="P2")) return C.amber;
              return null;
            })();
            const active = step === i;
            return (
              <button key={i} onClick={()=>setStep(i)} style={{
                flex:"0 0 auto", padding:"10px 20px",
                background:"none", border:"none",
                borderBottom: active ? `2px solid ${C.green}` : "2px solid transparent",
                color: active ? C.green : C.textDim,
                fontFamily:C.font, fontSize:11,
                fontWeight: active ? 700 : 400,
                cursor:"pointer", whiteSpace:"nowrap",
                position:"relative",
              }}>
                {p.label}
                {dotColor && !active && (
                  <span style={{ position:"absolute", top:6, right:8,
                    width:6, height:6, borderRadius:3, background:dotColor }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Banner: borrador recuperado ── */}
      {borradorRecuperado && !bannerProductor && (
        <div style={{ background:C.blue+"12", border:"1px solid "+C.blue+"40",
          borderRadius:0, padding:"8px 16px", display:"flex", alignItems:"center",
          justifyContent:"space-between", gap:10 }}>
          <div style={{ fontFamily:C.font, fontSize:10, color:C.blue }}>
            📋 Borrador recuperado — continuás donde dejaste
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => { limpiarBorrador(); setForm(FORM_DEF); setBorradorRecuperado(false); }}
              style={{ background:"none", border:"1px solid "+C.border, borderRadius:6,
                padding:"3px 10px", fontFamily:C.font, fontSize:9, cursor:"pointer",
                color:C.textDim }}>
              Nuevo
            </button>
            <button onClick={() => setBorradorRecuperado(false)}
              style={{ background:"none", border:"none", color:C.textFaint,
                fontSize:14, cursor:"pointer", padding:"0 4px" }}>✕</button>
          </div>
        </div>
      )}

      {/* ── Modal historial ── */}
      {showHistorial && (
        <PanelHistorial
          onCargar={(h) => { cargarVisita(h); setShowHistorial(false); setBorradorRecuperado(false); }}
          onCerrar={() => setShowHistorial(false)}
          C={C} />
      )}

      {/* ── Banner: datos del productor autocargados ── */}
      {bannerProductor && (
        <div style={{ background:C.green+"12", border:"1px solid "+C.green+"40",
          borderRadius:0, padding:"10px 16px", display:"flex", alignItems:"center",
          justifyContent:"space-between", gap:10 }}>
          <div>
            <div style={{ fontFamily:C.font, fontSize:10, color:C.green, fontWeight:700 }}>
              ✓ Datos de {bannerProductor.nombre} cargados automáticamente
            </div>
            <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, marginTop:2 }}>
              {bannerProductor.campos} campos precargados desde el formulario del productor · Revisá y completá lo que falta
            </div>
          </div>
          <button onClick={() => setBannerProductor(null)}
            style={{ background:"none", border:"none", color:C.textFaint,
              cursor:"pointer", fontSize:16, flexShrink:0, padding:"0 4px" }}>✕</button>
        </div>
      )}

      {/* Contenido del paso */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 20px 48px" }}>
        {RENDERS[step]?.()}
      </div>
    </div>
  );
}
