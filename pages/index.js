"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession, signOut, signIn, SessionProvider } from "next-auth/react";
import { T as C, FORM_DEF, MESES_NOM, CALIDAD_C4_CALIBRADA, cc5, SUPLEMENTOS } from "../lib/constantes";
import { correrMotor, calcCadena, calcConsumoAgua, calcDisp,
         calcScore, calcTrayectoriaCC, calcDisponibilidadMS,
         calcSupervivencia, calcV2S, mcalSuplemento, fetchSat,
         fmtFecha, dZona, dProv, smf, diagnosticarSistema,
         calcImpactoCola, calcFaseCiclo, calcConsumoPasto,
         getBiotipo, FENOLOGIAS, ccAPrenez } from "../lib/motor";
import { calcCerebro, buildPromptBiblio, SYS_BIBLIO } from "../lib/cerebro";
import { useMotor } from "../lib/useMotor";
import { usePersistencia, PanelHistorial, calcConfianzaDiagnostico } from "../lib/persistencia";
import { Pill, Alerta, smf2, DistCC, Input, LoadingPanel,
         MetricCard, SelectF, Slider, Toggle, SuplSelector, Toast } from "../components/ui";
import { getPasoRenders, GraficoCCEscenarios, PanelAgua, PanelFaseCiclo } from "../components/pasos"
import GraficosBalance from "../components/GraficosBalance";
import { TabCerebro, PanelRecomendaciones, RenderInforme, PanelInformeCerebro } from "../components/tabs";
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
  { id:"diagnostico",     label:"Balance y CC"     },
  { id:"recomendaciones", label:"Plan de acción"   },
];



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
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [loadMsg,     setLoadMsg]     = useState("");
  const [result,      setResult]      = useState("");
  const [cerebroResult, setCerebroResult] = useState(null);
  const [biblioResult,  setBiblioResult]  = useState("");
  const [biblioLoading, setBiblioLoading] = useState(false);
  const [tab,         setTab]         = useState("resumen");
  const [modoForraje, setModoForraje] = useState("general");
  const [usaPotreros, setUsaPotreros] = useState(true);
  const [potreros,    setPotreros]    = useState([{ ha:"", veg:"Pastizal natural", fenol:"menor_10" }]);
  const [vistaSupl,   setVistaSupl]   = useState("cuadrantes");
  const [bannerProductor, setBannerProductor] = useState(null); // datos autocargados del productor
  const [showHistorial,   setShowHistorial]   = React.useState(false);
  const [borradorRecuperado, setBorradorRecuperado] = React.useState(false);
  const [toasts, setToasts] = React.useState([]);
  const showToast = React.useCallback((msg, tipo = "ok", duration = 3400) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, tipo }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

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
      // Derivar zona desde provincia si el productor no la envió
      if (!datos.zona && datos.provincia) {
        const ZONA_PROV = {
          "Corrientes":"NEA","Chaco":"NEA","Formosa":"NEA","Misiones":"NEA","Entre Ríos":"NEA",
          "Salta":"NOA","Jujuy":"NOA","Tucumán":"NOA","Santiago del Estero":"NOA","Catamarca":"NOA",
          "Buenos Aires":"Pampa Húmeda","Santa Fe":"Pampa Húmeda","Córdoba":"Pampa Húmeda","La Pampa":"Pampa Húmeda",
          "Paraguay Oriental":"Paraguay Oriental","Chaco Paraguayo":"Chaco Paraguayo",
          "Mato Grosso do Sul (BR)":"Brasil (Cerrado)","Mato Grosso / Goiás (BR)":"Brasil (Cerrado)",
          "Santa Cruz / Beni (BO)":"Bolivia (Llanos)","Tarija / Chaco (BO)":"Bolivia (Llanos)",
        };
        const zonaDerivada = ZONA_PROV[datos.provincia];
        if (zonaDerivada) updates.zona = zonaDerivada;
      }

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

  const tray = motor?.tray ?? null;

  const dist           = motor?.dist           ?? null;
  const balanceMensual = motor?.balanceMensual ?? [];
  const toroDxn        = motor?.toroDxn        ?? null;
  const stockStatus    = motor?.stockStatus    ?? {};
  const alertasMotor   = motor?.alertas        ?? [];
  const scoreRiesgo    = motor?.scoreRiesgo    ?? 0;
  const nivelRiesgo    = motor?.nivelRiesgo    ?? "—";
  const colorRiesgo    = motor?.colorRiesgo    ?? C.textDim;
  const cargaEV_ha     = motor?.cargaEV_ha     ?? null;
  const impactoCola    = motor?.impactoCola    ?? null;
  const vaq1E          = motor?.vaq1E          ?? null;
  const vaq2E          = motor?.vaq2E          ?? null;
  const ccDesvio       = motor?.ccDesvio       ?? null;

  // Preñez: usar dato real si el técnico lo ingresó; estimar solo como fallback
  const prenezReal     = form.prenez ? parseFloat(form.prenez) : null;
  const prenezEst      = tray?.pr ?? null;
  const prenezDisplay  = prenezReal ?? prenezEst ?? null;
  const prenezFuente   = prenezReal !== null ? "hist." : "est.";

  // Variables del motor faltantes — restauradas
  const ccPondVal      = motor?.ccPondVal      ?? 0;
  const cadena         = motor?.cadena         ?? calcCadena(form.iniServ, form.finServ);
  const disponMS       = motor?.disponMS       ?? null;
  const ndviN          = motor?.ndviN          ?? (sat?.ndvi || 0.45);
  const tcSave         = motor?.tcSave         ?? null;
  const pvSalidaVaq1   = motor?.pvSalidaVaq1   ?? 0;
  const pvEntradaVaq2  = motor?.pvEntradaVaq2  ?? null;
  const evalAgua       = motor?.evalAgua       ?? null;
  const sanidad        = motor?.sanidad        ?? null;
  const baseParams     = motor?.baseParams     ?? {};
  const nVacas         = motor?.nVacas         ?? (parseInt(form.vacasN) || 0);
  const nToros         = motor?.nToros         ?? (parseInt(form.torosN) || 0);
  const nV2s           = motor?.nV2s           ?? (parseInt(form.v2sN)   || 0);
  const nVaq1          = motor?.nVaq1          ?? 0;
  const nVaq2          = motor?.nVaq2          ?? 0;
  const totalEV        = motor?.totalEV        ?? 0;
  const pvEntVaq1      = motor?.pvEntVaq1      ?? 0;
  const ofertaMensual  = motor?.ofertaMensual  ?? [];
  const verdeoAporteMcalMes = motor?.verdeoAporteMcalMes ?? 0;
  const verdeoMesInicio     = motor?.verdeoMesInicio     ?? 7;
  const suplRodeoMcalDia    = motor?.suplRodeoMcalDia    ?? 0;
  const demandaAlim    = motor?.demandaAlim    ?? null;
  const visitasCampo   = motor?.visitasCampo   ?? [];
  const factorAgua     = motor?.factorAgua     ?? 1.0;
  const factorCarga    = motor?.factorCarga    ?? 1.0;
  const confianza      = React.useMemo(() =>
    calcConfianzaDiagnostico(form, motor), [form, motor]);

  const cerebroMemo    = useMemo(() => {
    if (!motor) return null;
    try { return calcCerebro(motor, form, sat, potreros); } catch { return null; }
  }, [motor, form, sat, potreros]);

  const score          = React.useMemo(() =>
    motor ? calcScore(motor, form, null) : null,
  [motor, form]);
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
    "Misiones":                 { lat:-27.0, lon:-55.0 },
    "Jujuy":                    { lat:-24.2, lon:-65.3 },
    "Tucumán":                  { lat:-26.8, lon:-65.2 },
    "Catamarca":                { lat:-28.5, lon:-65.8 },
  };

  // ── EFECTO: fetch satelital ────────────────────────────────────
  // Usa GPS si disponible; si no, usa centroide de la provincia seleccionada
  // → el clima llega siempre que el usuario haya elegido provincia
  useEffect(() => {
    const refCoords = coords || (form.provincia ? COORDS_PROV[form.provincia] : null);
    if (!refCoords) return;
    setSat(null);
    fetchSat(refCoords.lat, refCoords.lon, form.zona || "NEA", form.provincia, form.enso, (data) => {
      setSat(data);
    });
  }, [coords, form.enso, form.zona, form.provincia]);

  // ── Keyboard navigation ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "select" || tag === "textarea") return;
      if (e.key === "ArrowLeft"  && step > 0) { e.preventDefault(); setStep(s => s - 1); }
      if (e.key === "ArrowRight" && step < PASOS.length - 1) { e.preventDefault(); setStep(s => s + 1); }
      const n = parseInt(e.key);
      if (!isNaN(n) && n >= 1 && n <= PASOS.length) setStep(n - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step]);

  // ── GPS — distancia mínima al centroide de provincia ─────────
  function nearestProv(lat, lon) {
    let best = "Corrientes", minD = Infinity;
    for (const [prov, c] of Object.entries(COORDS_PROV)) {
      const d = (lat - c.lat) ** 2 + (lon - c.lon) ** 2;
      if (d < minD) { minD = d; best = prov; }
    }
    return best;
  }
  async function gpsClick() {
    if (!navigator.geolocation) {
      showToast("GPS no disponible en este navegador", "error");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const la = +pos.coords.latitude.toFixed(5);
        const lo = +pos.coords.longitude.toFixed(5);
        setCoords({ lat:la, lon:lo });
        set("zona",      dZona(la, lo));
        const prov = nearestProv(la, lo);
        set("provincia", prov);
        // Reverse geocoding para obtener localidad
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${la}&lon=${lo}&format=json&accept-language=es&zoom=10`);
          const d = await r.json();
          const addr = d.address || {};
          // Orden de preferencia: ciudad > pueblo > aldea > municipio > localidad > paraje > departamento > provincia
          const loc = addr.city || addr.town || addr.village || addr.hamlet
                   || addr.locality || addr.municipality || addr.suburb
                   || addr.county || addr.state_district || "";
          const locFinal = loc || d.display_name?.split(",")[0]?.trim() || "";
          if (locFinal) {
            set("localidad", locFinal);
            showToast(`📍 ${locFinal} · ${prov}`, "ok");
          } else {
            showToast(`📍 ${prov} (${la.toFixed(3)}°, ${lo.toFixed(3)}°)`, "ok");
          }
        } catch(e) {
          showToast(`📍 ${prov} (${la.toFixed(3)}°, ${lo.toFixed(3)}°)`, "ok");
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        const msg = err.code === 1 ? "Permiso GPS denegado — activalo en Configuración del navegador"
                  : err.code === 3 ? "GPS tardó demasiado — intentá al aire libre"
                  : "No se pudo obtener la ubicación";
        showToast(msg, "error", 6000);
      },
      { timeout:15000, enableHighAccuracy:false }
    );
  }

  // ── BUILD PROMPT ──────────────────────────────────────────────

  // ── RUN ANALYSIS ──────────────────────────────────────────────
  async function runAnalysis() {
    setLoading(true); setResult(""); setCerebroResult(null); setBiblioResult(""); setStep(5);
    let mi = 0;
    const iv = setInterval(() => { setLoadMsg(MSGS[mi % MSGS.length]); mi++; }, 800);
    try {
      guardarEnHistorial(form, motor, null, potreros, sat);
      setCerebroResult(cerebroMemo);

      // Notificar al owner (fire & forget)
      const resumenCerebro = cerebroMemo?.diagnostico?.resumen || "";
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
          prenezEst:    (prenezDisplay !== null ? prenezDisplay : "—") + "% (" + prenezFuente + ")",
          condForr:     sat?.condForr,
          aguaTDS:      form.aguaTDS || "ND",
          resumenInforme: resumenCerebro.slice(0, 600),
        }),
      }).catch(() => {});

    } catch (e) {
      setResult("❌ Error: " + e.message);
    } finally {
      clearInterval(iv);
      setLoading(false);
    }
  }

  async function runBiblio() {
    if (!cerebroResult) return;
    setBiblioLoading(true); setBiblioResult("");
    try {
      const prompt = buildPromptBiblio(cerebroResult);
      const res  = await fetch("/api/analyze", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ prompt, systemPrompt: SYS_BIBLIO }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");
      setBiblioResult(data.result);
    } catch (e) {
      setBiblioResult("❌ " + e.message);
    } finally {
      setBiblioLoading(false);
    }
  }

  // ── DESCARGAR PDF ─────────────────────────────────────────────
  function descargarPDF() {
    const gen = (jsPDF) => { try {
      const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
      const W = 210, ML = 14, MR = 14, AU = W - ML - MR;
      let y = 14;
      const salto = (n = 5) => { y += n; };
      const chk   = (n = 15) => { if (y + n > 284) { doc.addPage(); y = 14; } };
      const txt   = (s) => String(s||"").replace(/[^\x20-\xFF]/g, " ").replace(/\s{2,}/g, " ").trim();
      const G  = [45,106,31],  Gl = [230,248,230], Gd = [20,40,22];
      const R  = [204,60,40],  Rl = [255,242,240];
      const Am = [200,140,20], Al = [255,250,230];
      const Bl = [50,100,180], Bll= [230,240,255];
      const Gr = [100,100,100];
      const thBg = [40,80,42]; const thTxt = [255,255,255];

      // ── helpers ──────────────────────────────────────────────────
      const seccion = (titulo, fillRGB = Gd, textRGB = [255,255,255], h = 8) => {
        chk(h + 4);
        doc.setFillColor(...fillRGB);
        doc.roundedRect(ML, y, AU, h, 2, 2, "F");
        doc.setFontSize(8.5); doc.setFont("helvetica","bold"); doc.setTextColor(...textRGB);
        doc.text(titulo, ML+4, y + h/2 + 1.5);
        salto(h + 4);
      };
      const subsec = (titulo, colorRGB = G) => {
        chk(7);
        doc.setDrawColor(...colorRGB); doc.setLineWidth(0.4);
        doc.line(ML, y, ML+5, y);
        doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(...colorRGB);
        doc.text(titulo.toUpperCase(), ML+7, y+0.5);
        salto(5);
      };
      const dato = (label, valor, col = Gr) => {
        chk(5);
        doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(...Gr);
        doc.text(txt(label)+":", ML, y);
        doc.setFont("helvetica","bold"); doc.setTextColor(...col);
        doc.text(txt(valor), ML+52, y);
        salto(4.5);
      };
      const dato2 = (l1,v1,l2,v2) => {
        chk(5);
        const hw = AU/2;
        doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(...Gr);
        doc.text(txt(l1)+":", ML, y);
        doc.setFont("helvetica","bold"); doc.setTextColor(...Gd);
        doc.text(txt(v1), ML+40, y);
        doc.setFont("helvetica","normal"); doc.setTextColor(...Gr);
        doc.text(txt(l2)+":", ML+hw, y);
        doc.setFont("helvetica","bold"); doc.setTextColor(...Gd);
        doc.text(txt(v2), ML+hw+40, y);
        salto(4.5);
      };
      const parrafo = (texto, indent=0, color=Gd, fs=7.5) => {
        const lines = doc.splitTextToSize(txt(texto), AU-indent);
        lines.forEach(ln => { chk(5); doc.setFontSize(fs); doc.setFont("helvetica","normal"); doc.setTextColor(...color); doc.text(ln, ML+indent, y); salto(4.5); });
      };
      const kpiRow = (items) => {
        const kW = AU/items.length;
        items.forEach(([label,val,col=[45,140,60]], ki) => {
          const kx = ML+ki*kW;
          doc.setFillColor(245,250,245); doc.roundedRect(kx,y,kW-2,15,2,2,"F");
          doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(110,110,110);
          doc.text(txt(label), kx+kW/2-1, y+4.5, {align:"center"});
          doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(...col);
          doc.text(txt(val), kx+kW/2-1, y+11.5, {align:"center"});
        });
        salto(18);
      };
      const barChart = (values, labels, h, zero, scaleLabel="Mcal/d") => {
        chk(h+10);
        const n = values.length;
        const bW = AU/n;
        const absMax = Math.max(1, ...values.map(Math.abs));
        const scale  = (h/2 - 2) / absMax;
        const zy     = y + h/2;
        doc.setDrawColor(200,200,200); doc.setLineWidth(0.15);
        doc.line(ML, zy, ML+AU, zy);
        values.forEach((v, i) => {
          const bx  = ML + i*bW + 0.5;
          const bH  = Math.max(0.3, Math.abs(v)*scale);
          const by  = v >= 0 ? zy - bH : zy;
          const col = v >= 0 ? [29,158,117] : [220,65,65];
          if (zero && zero.includes(i)) { doc.setFillColor(255,250,230); doc.rect(ML+i*bW, y, bW, h, "F"); }
          doc.setFillColor(...col); doc.rect(bx, by, bW-1, bH, "F");
          if (labels) {
            doc.setFontSize(4.5); doc.setFont("helvetica","normal"); doc.setTextColor(120,120,120);
            doc.text(labels[i]||"", ML+i*bW+bW/2, y+h+3, {align:"center"});
          }
          if (Math.abs(v) > absMax*0.05) {
            doc.setFontSize(4); doc.setTextColor(...col);
            const vStr = (v>=0?"+":"")+Math.round(v);
            doc.text(vStr, bx+bW/2-1, v>=0?by-1:by+bH+3, {align:"center"});
          }
        });
        if (scaleLabel) {
          doc.setFontSize(4.5); doc.setTextColor(160,160,160);
          doc.text(scaleLabel, ML+AU, y, {align:"right"});
        }
        salto(h+7);
      };
      const ccChart = (ccLine, mesParto, mesDestete, mesServ, h=28) => {
        chk(h+8);
        const PL=12,PR=4,PT=3,PB=8, DW=AU-PL-PR, DH=h-PT-PB;
        const LO=2.5, HI=7.0;
        const yCC = cc => y+PT+DH-((Math.min(HI,Math.max(LO,cc))-LO)/(HI-LO))*DH;
        const xM  = i  => ML+PL+(i/11)*DW;
        [3.0,3.5,4.0,4.5,5.0,5.5,6.0,6.5].forEach(v => {
          const gy = yCC(v); const isKey = v===4.5||v===5.0;
          doc.setDrawColor(isKey?180:220, isKey?180:220, isKey?220:220); doc.setLineWidth(isKey?0.25:0.12);
          if (isKey) doc.setLineDashPattern([1,1],0);
          doc.line(ML+PL, gy, ML+PL+DW, gy);
          doc.setLineDashPattern([],0);
          doc.setFontSize(4); doc.setFont("helvetica","normal");
          doc.setTextColor(isKey?150:180, isKey?100:180, isKey?40:180);
          doc.text(v.toFixed(1), ML+PL-1.5, gy+1.2, {align:"right"});
        });
        const xJun=ML+PL+(5/11)*DW, xAgo=ML+PL+(7/11)*DW;
        doc.setFillColor(255,250,225); doc.rect(xJun, y+PT, xAgo-xJun, DH, "F");
        const col = (ccLine[mesServ%12]||4.5) >= 5.0 ? G : (ccLine[mesServ%12]||4.5) >= 4.5 ? Am : R;
        doc.setDrawColor(...col); doc.setLineWidth(1.0);
        for (let i=0;i<11;i++) doc.line(xM(i),yCC(ccLine[i]),xM(i+1),yCC(ccLine[i+1]));
        [[mesParto,"P"],[mesDestete,"D"],[mesServ,"S"]].forEach(([mi,lbl]) => {
          const cc = ccLine[mi%12]; const xi=xM(mi%12), yi=yCC(cc);
          doc.setFillColor(...col); doc.circle(xi,yi,1.2,"F");
          doc.setFontSize(4.5); doc.setFont("helvetica","bold"); doc.setTextColor(...col);
          doc.text(lbl, xi, yi-2.5, {align:"center"});
        });
        ["E","F","M","A","M","J","J","A","S","O","N","D"].forEach((m,i) => {
          doc.setFontSize(4.5); doc.setFont("helvetica","normal"); doc.setTextColor(130,130,130);
          doc.text(m, xM(i), y+PT+DH+PB-1, {align:"center"});
        });
        doc.setFontSize(5); doc.setTextColor(100,100,100);
        doc.text(`P=Parto  D=Destete  S=Servicio  |  Invierno=fondo ambar  |  Umbrales: CC4.5 (amarillo)  CC5.0 (verde)`, ML+PL, y+PT+DH+PB+2.5);
        salto(h+7);
      };
      const tarjeta = (titulo, impacto, solucion, cuando, prioridad) => {
        const isP1 = prioridad==="P1"||prioridad==="URGENTE";
        const isP2 = prioridad==="P2";
        const [fillC,borderC,titC] = isP1?[Rl,R,R]:isP2?[Al,Am,Am]:[Gl,G,G];
        chk(22);
        doc.setFillColor(...fillC);
        doc.roundedRect(ML, y, AU, 3, 0.5, 0.5, "F");
        doc.setFillColor(255,255,255);
        doc.roundedRect(ML, y+3, AU, 1, 0,0,"F");
        doc.setFillColor(...fillC);
        doc.roundedRect(ML, y, AU, 1, 0.5,0.5,"F");
        // Borde izquierdo de color
        doc.setFillColor(...borderC); doc.rect(ML, y, 2.5, 99, "F");
        // Fondo total
        doc.setFillColor(...fillC); doc.roundedRect(ML, y, AU, 99, 1,1,"F");
        doc.setFillColor(...borderC); doc.rect(ML, y, 2.5, 99, "F");
        // Título
        chk(8);
        doc.setFillColor(...fillC); doc.roundedRect(ML, y, AU, 8, 1,1,"F");
        doc.setFillColor(...borderC); doc.rect(ML, y, 2.5, 8,"F");
        doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(...titC);
        doc.text(`[${prioridad}] ${txt(titulo)}`, ML+5, y+5.5, {maxWidth:AU-8});
        salto(10);
        if (impacto) {
          doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(...Gd);
          doc.splitTextToSize(txt(impacto), AU-8).slice(0,2).forEach(ln => { chk(4); doc.text(ln, ML+5, y); salto(4); });
        }
        if (solucion) {
          doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...Bl);
          doc.splitTextToSize("Como: "+txt(solucion), AU-8).slice(0,2).forEach(ln => { chk(4); doc.text(ln, ML+5, y); salto(4); });
        }
        if (cuando) {
          doc.setFontSize(6.5); doc.setFont("helvetica","italic"); doc.setTextColor(...Gr);
          chk(4); doc.text("Cuando: "+txt(cuando), ML+5, y, {maxWidth:AU-8}); salto(4);
        }
        salto(3);
      };

      // ── DATOS DERIVADOS ──────────────────────────────────────────
      const cerebPDF  = cerebroMemo;
      const scoreData = motor ? calcScore(motor, form, null) : null;
      const nVacas    = parseInt(form.vacasN)||0;
      const cadena    = motor?.cadena ?? null;
      const faseCicloPDF = cadena ? (() => { try { return calcFaseCiclo(cadena, form, { ccServ: parseFloat(tray?.ccServ||0), mesesDeficit: (motor?.balanceMensual??[]).filter(m=>[5,6,7].includes(m.i)&&m.balance<0).length }); } catch(e){return null;} })() : null;
      const MESES12 = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
      const dispMS  = calcDisponibilidadMS(form.altPasto, form.tipoPasto);

      // ════════════════════════════════════════════════════════════
      // SECCIÓN 1 — PORTADA + DATOS DEL ESTABLECIMIENTO
      // ════════════════════════════════════════════════════════════
      doc.setFillColor(...Gd);
      doc.roundedRect(ML, y, AU, 16, 3, 3, "F");
      doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text("AGROMIND PRO — Informe Tecnico de Cria", ML+5, y+8);
      doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(180,220,180);
      doc.text(`${txt(form.nombreProductor)||"Establecimiento"} · ${txt(form.localidad)||txt(form.provincia)||""} · ${new Date().toLocaleDateString("es-AR")} · Biotipo: ${txt(form.biotipo)||"—"}`, ML+5, y+13);
      salto(20);

      // KPIs fila 1
      const prenezPDF = tray?.pr ?? null;
      const scoreTot  = scoreData?.total ?? null;
      const ccServPDF = tray?.ccServ || 0;
      kpiRow([
        ["CC al Servicio", ccServPDF>0 ? ccServPDF.toFixed(1) : "—", ccServPDF>=5?G:ccServPDF>=4.5?Am:R],
        ["Prenez estimada", prenezPDF!==null ? prenezPDF+"%" : "—", prenezPDF>=75?G:prenezPDF>=55?Am:R],
        ["Score sistema", scoreTot!==null ? scoreTot+"/100" : "—", scoreTot>=75?G:scoreTot>=50?Am:R],
        ["Anestro", tray?.anestro?.dias ? tray.anestro.dias+"d" : "—", tray?.anestro?.dias<=45?G:tray?.anestro?.dias<=75?Am:R],
        ["NDVI", sat?.ndvi || "—", sat?.ndviDelta>0?G:sat?.ndviDelta>-0.08?Am:R],
      ]);

      // Momento del ciclo
      if (faseCicloPDF && faseCicloPDF.fase !== "SIN_FECHA") {
        chk(12);
        const [fcR,fcG,fcB] = (faseCicloPDF.color||"#3d7a2f").match(/[\da-fA-F]{2}/g)?.map(h=>parseInt(h,16))??G;
        doc.setFillColor(fcR+Math.round((255-fcR)*0.85), fcG+Math.round((255-fcG)*0.85), fcB+Math.round((255-fcB)*0.85));
        doc.roundedRect(ML,y,AU,9,2,2,"F");
        doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(fcR,fcG,fcB);
        const sigTxt = faseCicloPDF.siguiente ? `  |  Prox: ${txt(faseCicloPDF.siguiente.label)} en ${faseCicloPDF.siguiente.diasFaltan}d` : "";
        doc.text(`Momento del ciclo: ${txt(faseCicloPDF.label||"").toUpperCase()}${sigTxt}`, ML+3, y+5.5, {maxWidth:AU-6});
        salto(12);
        if (faseCicloPDF.descripcion) { parrafo(faseCicloPDF.descripcion.split(".")[0]+".", 0, Gr, 7); }
      }

      // Datos del campo — 2 columnas
      seccion("DATOS DEL ESTABLECIMIENTO", Gd);
      dato2("Productor",       form.nombreProductor||"—",       "Localidad",    form.localidad||form.provincia||"—");
      dato2("Zona",            form.zona||"—",                  "Provincia",    form.provincia||"—");
      dato2("Coordenadas GPS", coords ? `${coords.lat.toFixed(4)}°, ${coords.lon.toFixed(4)}°` : "Sin GPS", "ENSO",  form.enso||"neutro");
      dato2("Superficie total (ha)", form.supHa||"—",           "Superficie gan. (ha)", form.supHa ? Math.round(parseFloat(form.supHa)*(1-((parseFloat(form.pctMonte)||0)+(parseFloat(form.pctNGan)||0))/100))+"" : "—");
      dato2("Vegetacion",      form.vegetacion||"—",            "Fenologia",    {menor_10:"Rebrote <10%","10_25":"Crecimiento 10-25%","25_50":"Maduracion 25-50%",mayor_50:"Encaniado >50%"}[form.fenologia]||form.fenologia||"—");
      dato2("Monte (%)",       form.pctMonte||"0",              "No ganadero (%)", form.pctNGan||"0");
      dato2("Vacas",           form.vacasN||"—",                "Toros",        form.torosN||"—");
      dato2("PV vaca (kg)",    form.pvVacaAdulta||"—",          "Biotipo",      form.biotipo||"—");
      dato2("Prenez historica (%)", form.prenez||"—",           "Destete historico (%)", form.pctDestete||"—");
      dato2("Carga (EV/ha)",   motor?.cargaEV_ha ? motor.cargaEV_ha.toFixed(2) : "—", "Disp. MS (kg/ha)", dispMS?.msHa||"—");
      salto(2);

      // Datos satelitales
      if (sat && !sat.error) {
        seccion("CAMPO HOY — CLIMA Y NDVI ESTIMADO", [30,80,50]);
        dato2("Temperatura media 7d",""+sat.temp+"C",   "Lluvia 30d",sat.p30+" mm");
        dato2("Lluvia 90d",          sat.p90+" mm",      "Balance hidrico 30d",(sat.deficit>=0?"+":"")+sat.deficit+" mm");
        dato2("NDVI estimado",       sat.ndvi+" ("+txt(sat.condForr)+")", "NDVI vs historico", (sat.ndviDelta>=0?"+":"")+sat.ndviDelta+" ("+txt(sat.ndviCateg)+")");
        dato2("Lluvia proximos 7d",  sat.lluviaProx7+" mm", "Temp. media prox 7d", sat.tempMediaProx7+"C");
        if (sat.helada7) { chk(5); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...R); doc.text("Alerta: helada probable en proximos 7 dias", ML, y); salto(5); }
        salto(2);
      }

      // ════════════════════════════════════════════════════════════
      // SECCIÓN 2 — DIAGNÓSTICO
      // ════════════════════════════════════════════════════════════
      seccion("DIAGNOSTICO DEL SISTEMA", Gd);

      // Score por dimensiones — barras visuales
      if (scoreData) {
        chk(8);
        doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(...G);
        doc.text(`Score global: ${scoreData.total}/100 — ${txt(scoreData.labelTotal)}`, ML, y); salto(6);
        scoreData.dim.forEach(d => {
          chk(7);
          const bW = (AU-50) * Math.min(1, d.score/100);
          const col = d.score>=75?G:d.score>=50?Am:R;
          doc.setFillColor(235,240,235); doc.roundedRect(ML+50, y-4, AU-50, 5, 1,1,"F");
          doc.setFillColor(...col); doc.roundedRect(ML+50, y-4, Math.max(2,bW), 5, 1,1,"F");
          doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(...Gr);
          doc.text(txt(d.nombre)+":", ML, y);
          doc.setFont("helvetica","bold"); doc.setTextColor(...col);
          doc.text(""+d.score+"/100", ML+44, y, {align:"right"});
          if (d.desc) {
            doc.setFontSize(5.5); doc.setFont("helvetica","normal"); doc.setTextColor(140,140,140);
            doc.text(txt(d.desc), ML+50+Math.min(bW+2,AU-56), y, {maxWidth:60});
          }
          salto(6);
        });
        salto(3);
      }

      // Diagnóstico texto
      const dxResumen = cerebPDF?.diagnostico?.resumen;
      if (dxResumen) {
        chk(10);
        doc.setFillColor(...Gl);
        doc.roundedRect(ML, y, AU, 6, 1,1,"F");
        doc.setFontSize(7.5); doc.setFont("helvetica","bold"); doc.setTextColor(...G);
        doc.text("Conclusion tecnica:", ML+3, y+4.5);
        salto(8);
        parrafo(dxResumen, 0, Gd, 7.5);
        salto(2);
      }

      // Sustentabilidad
      const dxS = cerebPDF?.diagnostico?.diagnosticoSustentabilidad;
      if (dxS) {
        if (dxS.ciclosAlColapso && dxS.ciclosAlColapso <= 4) {
          chk(8);
          doc.setFillColor(...Rl);
          doc.roundedRect(ML,y,AU,6,1,1,"F");
          doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...R);
          doc.text(`SUSTENTABILIDAD: ${txt(dxS.resumen||"")} — Ciclos al colapso sin correccion: ${dxS.ciclosAlColapso}`, ML+3, y+4, {maxWidth:AU-6});
          salto(9);
        }
        if (dxS.factoresLimitantes?.length) {
          chk(6); doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(...Gr);
          parrafo("Factores limitantes: "+dxS.factoresLimitantes.join(" · "), 0, Gr, 7);
        }
        salto(2);
      }

      // ── Trayectoria CC ──────────────────────────────────────────
      if (tray?.ccHoy && tray?.ccParto && tray?.ccServ) {
        subsec("Trayectoria de Condicion Corporal — Ciclo Anual", G);
        const mesParto  = typeof tray.mesParto==="number" ? tray.mesParto : 2;
        const mesesLact = Math.ceil(parseFloat(tray.mesesLact)||6);
        const mesDestete= (mesParto+mesesLact)%12;
        const mesServCC = typeof tray.mesServ==="number" ? tray.mesServ : (mesDestete+2)%12;
        const ccH=parseFloat(tray.ccHoy)||3.5, ccP=parseFloat(tray.ccParto)||ccH, ccM=parseFloat(tray.ccMinLact)||ccP, ccS=parseFloat(tray.ccServ)||ccM;
        const LO=2.5, HI=7.0;
        const ccLine = Array.from({length:12},(_,i) => {
          let cc;
          if (i<mesParto)     cc = ccH +(ccP-ccH)*(i/Math.max(1,mesParto));
          else if (i<mesDestete||mesDestete<=mesParto) cc = ccP+(ccM-ccP)*Math.min(1,(i-mesParto)/Math.max(1,mesesLact));
          else if (i<mesServCC||mesServCC<mesDestete)  cc = ccM+(ccS-ccM)*Math.min(1,(i-mesDestete)/Math.max(1,(mesServCC-mesDestete+12)%12||3));
          else cc = ccS+(ccH-ccS)*Math.min(1,(i-mesServCC)/Math.max(1,12-mesServCC));
          return Math.max(LO,Math.min(HI,cc));
        });
        ccChart(ccLine, mesParto, mesDestete, mesServCC, 30);
        dato2("CC tacto hoy", ccH.toFixed(1), "CC al parto", ccP.toFixed(1));
        dato2("CC min. lactacion", ccM.toFixed(1), "CC al servicio", ccS.toFixed(1));
        dato2("Prenez estimada", (tray.pr||0)+"%", "Dias anestro", (tray.anestro?.dias||"—")+"d");
        salto(3);
      }

      // ════════════════════════════════════════════════════════════
      // SECCIÓN 3 — BALANCE FORRAJERO
      // ════════════════════════════════════════════════════════════
      seccion("BALANCE FORRAJERO ANUAL", Gd);

      if (motor?.balanceMensual) {
        const bals = motor.balanceMensual.map(m => m.balance||0);
        const dems = motor.balanceMensual.map(m => m.demanda||0);
        const ofer = motor.balanceMensual.map(m => (m.ofPastoTotal||0)+(m.ofSuplTotal||0));
        const mDef = motor.balanceMensual.filter(m=>[5,6,7].includes(m.i)&&m.balance<0).length;
        const peorBMes = [5,6,7].reduce((mn,i)=>bals[i]<bals[mn]?i:mn, 5);

        // Tabla 12 meses
        subsec("Balance mensual (Demanda vs Oferta vs Balance)", G);
        chk(28);
        const colW = AU/6;
        [[0,1,2,3,4,5],[6,7,8,9,10,11]].forEach(fila => {
          fila.forEach((mi,ci) => {
            const bm   = motor.balanceMensual[mi];
            const bv   = bm ? Math.round(bm.balance)  : null;
            const dem  = bm ? Math.round(bm.demanda)  : null;
            const ofr  = bm ? Math.round((bm.ofPastoTotal||0)+(bm.ofSuplTotal||0)) : null;
            const bx   = ML+ci*colW;
            const esInv= [5,6,7].includes(mi);
            const col  = bv===null?Gr:bv>=0?G:R;
            doc.setFillColor(esInv?255:248, esInv?248:252, esInv?225:248);
            doc.roundedRect(bx, y, colW-1.5, 18, 1,1,"F");
            if (esInv) { doc.setDrawColor(...Am); doc.setLineWidth(0.3); doc.roundedRect(bx, y, colW-1.5, 18, 1,1,"S"); }
            doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(60,60,60);
            doc.text(MESES12[mi], bx+(colW-1.5)/2, y+4.5, {align:"center"});
            doc.setFontSize(5.5); doc.setFont("helvetica","normal"); doc.setTextColor(120,120,120);
            if (dem!==null) doc.text("D:"+dem, bx+(colW-1.5)/2, y+8.5, {align:"center"});
            if (ofr!==null) doc.text("O:"+ofr, bx+(colW-1.5)/2, y+12, {align:"center"});
            doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(...col);
            doc.text(bv!==null?(bv>=0?"+":"")+bv:"—", bx+(colW-1.5)/2, y+17, {align:"center"});
          });
          salto(20);
        });
        doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(110,110,110);
        doc.text("D=Demanda  O=Oferta  Balance=Mcal/d  |  Fondo ambar = meses invernales", ML, y); salto(5);
        if (mDef>0) {
          doc.setTextColor(...R); doc.setFont("helvetica","bold");
          doc.text(`Invierno: ${mDef}/3 meses en deficit — peor mes: ${MESES12[peorBMes]} (${Math.round(bals[peorBMes])} Mcal/d)`, ML, y); salto(5);
        } else {
          doc.setTextColor(...G); doc.setFont("helvetica","bold");
          doc.text("Invierno: sin deficit — balance positivo los 3 meses criticos", ML, y); salto(5);
        }
        salto(2);

        // Gráfico de barras balance mensual
        subsec("Grafico de balance mensual", G);
        barChart(bals, ["E","F","M","A","M","J","J","A","S","O","N","D"], 24, [5,6,7], "Mcal/d");

        // Balance por categoría — tabla invierno
        if (motor.vaq1E || motor.vaq2E) {
          subsec("Balance por categoria — invierno (Jun/Jul/Ago)", G);
          chk(35);
          const cats = [
            ["Vacas",         motor.balanceMensual[6]?.ofPastoPerVacasV2s, motor.balanceMensual[6]?.demanda,  null],
            ["Vaq 1er inv.",  motor.balanceMensual[6]?.ofPastoPerVaq1,      motor.vaq1E?.gdpNecesario ? motor.vaq1E.gdpNecesario/10 : null, motor.vaq1E?.gdpReal],
            ["Vaq 2do inv.",  motor.balanceMensual[6]?.ofPastoPerVaq2,      motor.vaq2E?.gdpNecesario ? motor.vaq2E.gdpNecesario/10 : null, motor.vaq2E?.gdpReal],
          ].filter(([,o]) => o !== undefined && o !== null);
          const cW3 = AU/(cats.length||1);
          const hdrs = ["Categoria","Oferta pasto (Mcal/d)","Demanda (Mcal/d)","GDP real (g/d)"];
          // encabezado
          [["Categoria",60],["Oferta pasto",40],["Dem./GDP nec.",40],["GDP real",40]].forEach(([h,w],i) => {
            doc.setFillColor(...thBg); doc.rect(ML+i*38, y, 38, 6, "F");
            doc.setFontSize(6); doc.setFont("helvetica","bold"); doc.setTextColor(...thTxt);
            doc.text(h, ML+i*38+19, y+4, {align:"center"});
          });
          salto(7);
          const catRows = [
            ["Vacas",       motor.balanceMensual[6]?.ofPastoPerVacasV2s, "—", "—"],
            ["Vaq. 1er inv",motor.balanceMensual[6]?.ofPastoPerVaq1, motor.vaq1E?.gdpNecesario, motor.vaq1E?.gdpReal],
            ["Vaq. 2do inv",motor.balanceMensual[6]?.ofPastoPerVaq2, motor.vaq2E?.gdpNecesario, motor.vaq2E?.gdpReal],
          ];
          catRows.forEach(([cat, oferta, dem, gdp], ri) => {
            doc.setFillColor(ri%2===0?248:255, ri%2===0?252:255, ri%2===0?248:255);
            doc.rect(ML, y, AU, 6, "F");
            const vals = [cat, oferta!==null&&oferta!==undefined?Math.round(oferta):"—", dem!==null&&dem!==undefined?dem+"":"—", gdp!==null&&gdp!==undefined?gdp+" g/d":"—"];
            vals.forEach((v,i) => {
              const isOk = i===3 && typeof gdp==="number" && typeof dem==="number" && gdp>=dem*0.85;
              doc.setFontSize(6.5); doc.setFont("helvetica", i===0?"bold":"normal");
              doc.setTextColor(isOk?G[0]:typeof gdp==="number"&&i===3&&gdp<(dem||0)*0.85?R[0]:60, isOk?G[1]:60, isOk?G[2]:60);
              doc.text(txt(v)+"", ML+i*38+19, y+4, {align:"center"});
            });
            salto(7);
          });
          salto(2);
        }
      }

      // ════════════════════════════════════════════════════════════
      // SECCIÓN 4 — VAQUILLONA
      // ════════════════════════════════════════════════════════════
      const hayVaq = motor?.vaq1E || motor?.vaq2E;
      if (hayVaq) {
        seccion("VAQUILLONA — BALANCE Y PROGRESION", Gd);
        const pvAd = parseFloat(form.pvVacaAdulta)||380;

        // Vaq 1er invierno
        if (motor.vaq1E) {
          const v1 = motor.vaq1E;
          const v1Dx = (cerebPDF?.vaquillona||[]).find(d=>d.cat==="vaq1");
          subsec("1er Invierno (recria)", G);
          dato2("PV entrada 1er inv.", (motor.pvEntVaq1||"—")+" kg", "GDP pasto", (v1.gdpPasto||0)+" g/d");
          dato2("Supl. aporte GDP",    (v1.gdpSuplAporte||0)+" g/d","GDP real",  (v1.gdpReal||0)+" g/d (min "+(v1.gdpNecesario||300)+" g/d)");
          dato2("PV salida invierno",  (v1.pvSal||"—")+" kg",       "Objetivo 1er entore", Math.round(pvAd*0.65)+" kg");
          const v1ok = (v1.pvSal||0) >= Math.round(pvAd*0.40);
          chk(7); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...(v1ok?G:R));
          doc.text(v1ok?"Estado: LLEGA al objetivo de recria":"Estado: NO llega — suplementar", ML, y); salto(6);
          if (v1Dx?.escenario) { parrafo(v1Dx.escenario, 0, Gd, 7); salto(1); }
          if (v1Dx?.recomendacion) { parrafo("Rec: "+v1Dx.recomendacion, 0, Bl, 7); }
          salto(3);
        }

        // Vaq 2do invierno
        if (motor.vaq2E) {
          const v2 = motor.vaq2E;
          const v2Dx = (cerebPDF?.vaquillona||[]).find(d=>d.cat==="vaq2");
          subsec("2do Invierno (hacia el entore)", G);
          if (v2.gdpVeranoProm) {
            dato2("GDP promedio verano", v2.gdpVeranoProm+" g/d", "Ganancia estacion", (v2.gananciaVerano||0)+" kg");
          }
          dato2("PV entrada 2do inv.", (v2.pvMayo2Inv||motor.pvEntradaVaq2||"—")+" kg", "GDP real inv.", (v2.gdpReal||v2.gdpInv||0)+" g/d");
          dato2("PV al entore",        (v2.pvEntore||"—")+" kg",       "PV minimo entore",  (v2.pvMinEntore||"—")+" kg ("+Math.round(pvAd*0.65)+"kg=65% PVA)");
          dato2("GDP con supl.",        (v2.gdpConSuplReal||v2.gdpReal||0)+" g/d", "Llega al entore", v2.llegas?"SI":"NO");
          chk(7); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(...(v2.llegas?G:R));
          doc.text(v2.llegas?"Estado: LLEGA al peso de entore":"Estado: NO llega — revisar suplementacion", ML, y); salto(6);
          if (v2Dx?.escenario) { parrafo(v2Dx.escenario, 0, Gd, 7); salto(1); }
          if (v2Dx?.recomendacion) { parrafo("Rec: "+v2Dx.recomendacion, 0, Bl, 7); }
          salto(3);

          // Gráfico de progresión PV vaquillona
          const etapas = [
            ["Destete",       motor.pvEntVaq1||150],
            ["Ent.1er inv.",  motor.pvEntVaq1||150],
            ["Sal.1er inv.",  motor.vaq1E?.pvSal||170],
            ["Ent.2do inv.",  motor.pvEntradaVaq2||200],
            ["Al entore",     v2.pvEntore||230],
            ["Adulta",        pvAd],
          ];
          const pvVals = etapas.map(([,v])=>v);
          const pvMin  = Math.min(...pvVals)-10, pvMax = Math.max(pvAd+20,...pvVals);
          const nPts   = etapas.length;
          const chH    = 28, chPL=12, chPR=4, chPT=3, chPB=10;
          const chDW   = AU-chPL-chPR, chDH=chH-chPT-chPB;
          subsec("Progresion de Peso Vivo — Vaquillona", G);
          chk(chH+8);
          const yPV  = v => y+chPT+chDH-((Math.min(pvMax,Math.max(pvMin,v))-pvMin)/(pvMax-pvMin))*chDH;
          const xPt  = i => ML+chPL+(i/(nPts-1))*chDW;
          // grid
          [100,150,200,250,300,350].filter(v=>v>pvMin&&v<pvMax).forEach(v => {
            const gy=yPV(v);
            doc.setDrawColor(220,220,220); doc.setLineWidth(0.1); doc.line(ML+chPL,gy,ML+chPL+chDW,gy);
            doc.setFontSize(4); doc.setTextColor(180,180,180); doc.text(""+v,ML+chPL-1.5,gy+1,{align:"right"});
          });
          // línea objetivo
          const pvObj65 = Math.round(pvAd*0.65);
          const yObj = yPV(pvObj65);
          doc.setDrawColor(...Am); doc.setLineWidth(0.3); doc.setLineDashPattern([1.5,1],0);
          doc.line(ML+chPL,yObj,ML+chPL+chDW,yObj);
          doc.setLineDashPattern([],0);
          doc.setFontSize(4.5); doc.setTextColor(...Am); doc.text("Objetivo entore "+pvObj65+"kg", ML+chPL+chDW+1, yObj+1);
          // línea PV
          doc.setDrawColor(...G); doc.setLineWidth(1.0);
          for (let i=0;i<nPts-1;i++) doc.line(xPt(i),yPV(pvVals[i]),xPt(i+1),yPV(pvVals[i+1]));
          // puntos y etiquetas
          pvVals.forEach((v,i) => {
            const isOk = v >= pvObj65;
            doc.setFillColor(...(isOk?G:R)); doc.circle(xPt(i),yPV(v),1.5,"F");
            doc.setFontSize(4.5); doc.setFont("helvetica","normal"); doc.setTextColor(60,60,60);
            doc.text(""+v+"kg", xPt(i), yPV(v)-3, {align:"center"});
            doc.setFontSize(4); doc.setTextColor(120,120,120);
            doc.text(etapas[i][0], xPt(i), y+chPT+chDH+chPB-1, {align:"center"});
          });
          salto(chH+8);
        }

        // Suplementación vaquillona
        const suplVaq1 = form.supl_vaq1 ? `${form.supl_vaq1} ${form.dosis_vaq1} kg/d` : "Sin suplemento";
        const suplVaq2 = form.supl_vaq2 ? `${form.supl_vaq2} ${form.dosis_vaq2} kg/d` : "Sin suplemento";
        dato2("Supl. Vaquillona 1er inv.", suplVaq1, "Supl. Vaquillona 2do inv.", suplVaq2);
        salto(3);
      }

      // ════════════════════════════════════════════════════════════
      // SECCIÓN 5 — SUPLEMENTACIÓN ACTUAL POR CATEGORÍA
      // ════════════════════════════════════════════════════════════
      const catSupl = [
        ["Vacas",            form.supl_vacas,   form.dosis_vacas,   form.supl2_vacas,  form.dosis2_vacas],
        ["V2S",              form.supl_v2s,     form.dosis_v2s,     form.supl2_v2s,    form.dosis2_v2s],
        ["Toros",            form.supl_toros,   form.dosis_toros,   form.supl2_toros,  form.dosis2_toros],
        ["Vaquillona 2inv.", form.supl_vaq2,    form.dosis_vaq2,    form.supl2_vaq2,   form.dosis2_vaq2],
        ["Vaquillona 1inv.", form.supl_vaq1,    form.dosis_vaq1,    form.supl2_vaq1,   form.dosis2_vaq1],
        ["Ternero",          form.supl_ternero, form.dosis_ternero, form.supl2_ternero,form.dosis2_ternero],
      ].filter(([,s1,,s2]) => s1||s2);
      if (catSupl.length) {
        seccion("SUPLEMENTACION ACTUAL POR CATEGORIA", [30,60,100]);
        chk(8);
        [["Categoria",38],["Suplemento 1",50],["Dosis 1",28],["Suplemento 2",50],["Dosis 2",28]].forEach(([h,w],i,arr) => {
          const ox = ML+arr.slice(0,i).reduce((a,[,w2])=>a+w2,0);
          doc.setFillColor(...thBg); doc.rect(ox, y, w, 6, "F");
          doc.setFontSize(6); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
          doc.text(h, ox+w/2, y+4, {align:"center"});
        });
        salto(7);
        catSupl.forEach(([cat,s1,d1,s2,d2],ri) => {
          chk(6);
          doc.setFillColor(ri%2===0?248:255, ri%2===0?252:255, ri%2===0?248:255);
          const rw = AU;
          doc.rect(ML,y,rw,6,"F");
          const vals = [cat, s1||"—", (s1?(d1||0)+" kg/d":"—"), s2||"—", (s2?(d2||0)+" kg/d":"—")];
          const ws   = [38,50,28,50,28];
          vals.forEach((v,i) => {
            const ox = ML+ws.slice(0,i).reduce((a,w)=>a+w,0);
            doc.setFontSize(6.5); doc.setFont("helvetica",i===0?"bold":"normal"); doc.setTextColor(60,60,60);
            doc.text(txt(v), ox+ws[i]/2, y+4, {align:"center"});
          });
          salto(7);
        });
        salto(3);
      }

      // ════════════════════════════════════════════════════════════
      // SECCIÓN 6 — PROPUESTAS DE MEJORA
      // ════════════════════════════════════════════════════════════
      const tarjetas = cerebPDF?.prescripciones?.tarjetas || [];
      if (tarjetas.length) {
        seccion("PROPUESTAS DE MEJORA — PLAN DE ACCION", [160,50,20]);
        const p1 = tarjetas.filter(t=>t.prioridad==="P1"||t.prioridad==="URGENTE");
        const p2 = tarjetas.filter(t=>t.prioridad==="P2");
        const p3 = tarjetas.filter(t=>t.prioridad==="P3");
        if (p1.length) { subsec("CRITICO — Accion inmediata antes del proximo servicio", R); p1.forEach(t=>tarjeta(t.titulo||"",t.impacto||"",t.solucion||"",t.cuandoActuar||"","P1")); }
        if (p2.length) { subsec("IMPORTANTE — Implementar este ciclo", Am); p2.forEach(t=>tarjeta(t.titulo||"",t.impacto||"",t.solucion||"",t.cuandoActuar||"","P2")); }
        if (p3.length) { subsec("OPTIMIZACION — Para el siguiente ciclo", G); p3.forEach(t=>tarjeta(t.titulo||"",t.impacto||"",t.solucion||"",t.cuandoActuar||"","P3")); }
      }

      // ════════════════════════════════════════════════════════════
      // SECCIÓN 7 — ESCENARIOS Y RESULTADOS ESPERADOS
      // ════════════════════════════════════════════════════════════
      seccion("ESCENARIOS Y RESULTADOS ESPERADOS", Gd);

      // Tabla escenarios destete
      if (tray) {
        subsec("Impacto del manejo de destete en prenez y terneros", G);
        const ccS2    = tray.ccServ||0;
        const prBase  = tray.pr||0;
        const escs = [
          { l:"Manejo actual",     cc:+ccS2.toFixed(1),  pr:prBase,                            col:R  },
          { l:"Destete anticipado 90d",cc:+(tray.ccServAntic||Math.min(9,ccS2+0.4)).toFixed(1),pr:tray.prAntic||ccAPrenez(tray.ccServAntic||ccS2+0.4), col:Am },
          { l:"Destete hiperprecoz 50d",cc:+(tray.ccServHiper||Math.min(9,ccS2+0.7)).toFixed(1),pr:tray.prHiper||ccAPrenez(tray.ccServHiper||ccS2+0.7),col:G },
        ];
        chk(30);
        const eW = AU/3-2;
        escs.forEach((e,i) => {
          const ex=ML+i*(eW+3); const diff=e.pr-prBase;
          doc.setFillColor(248,252,248); doc.roundedRect(ex,y,eW,32,2,2,"F");
          doc.setFillColor(...e.col); doc.roundedRect(ex,y,eW,5,2,2,"F"); doc.rect(ex,y+3,eW,2,"F");
          doc.setFontSize(6); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
          doc.text(e.l, ex+eW/2, y+3.8, {align:"center",maxWidth:eW-2});
          doc.setFontSize(14); doc.setFont("helvetica","bold"); doc.setTextColor(...e.col);
          doc.text(e.pr+"%", ex+eW/2, y+16, {align:"center"});
          doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(80,80,80);
          doc.text("CC serv: "+e.cc, ex+eW/2, y+21.5, {align:"center"});
          if (diff>0&&nVacas>0) {
            doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(...e.col);
            doc.text("+"+diff+"pp = +"+Math.round(nVacas*diff/100*0.95)+" terneros", ex+eW/2, y+27, {align:"center"});
          } else if (i===0) {
            doc.setFontSize(6.5); doc.setFont("helvetica","normal"); doc.setTextColor(...Gr);
            doc.text("Base actual", ex+eW/2, y+27, {align:"center"});
          }
        });
        salto(36);

        // Tabla resumen de mejora
        subsec("Tabla resumen de resultados por escenario", G);
        chk(20);
        const hdrs2 = ["Escenario","CC serv.","Prenez","Terneros/100 vacas","Diferencia vs actual"];
        const cws2  = [55,22,20,38,35];
        hdrs2.forEach((h,i) => {
          const ox=ML+cws2.slice(0,i).reduce((a,w)=>a+w,0);
          doc.setFillColor(...thBg); doc.rect(ox,y,cws2[i],6,"F");
          doc.setFontSize(5.5); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
          doc.text(h, ox+cws2[i]/2, y+4, {align:"center"});
        });
        salto(7);
        const terBase = Math.round(nVacas*prBase/100*0.95);
        escs.forEach(({l,cc,pr,col},ri) => {
          chk(6); doc.setFillColor(ri%2===0?248:255,ri%2===0?252:255,ri%2===0?248:255);
          doc.rect(ML,y,AU,6,"F");
          const tern = Math.round(nVacas*pr/100*0.95);
          const diff = tern-terBase;
          const row = [l, cc+"", pr+"%", ""+tern, ri===0?"Base":(diff>0?"+"+diff:""+diff)+" terneros"];
          row.forEach((v,i) => {
            const ox=ML+cws2.slice(0,i).reduce((a,w)=>a+w,0);
            doc.setFontSize(6.5); doc.setFont("helvetica",i===0||i===4?"bold":"normal");
            doc.setTextColor(...(i===4&&diff>0?G:i===4&&diff<0?R:Gd));
            doc.text(txt(v), ox+cws2[i]/2, y+4.5, {align:"center"});
          });
          salto(7);
        });
        salto(3);
      }

      // Amplitud de parición
      if (cadena && cadena.diasServ > 0) {
        subsec("Analisis del servicio", G);
        const dS = cadena.diasServ;
        const [dLab,dCol] = dS<=60?["Concentrado — optimo",[45,140,60]]:dS<=90?["Optimo",[45,140,60]]:dS<=120?["Aceptable",[200,140,20]]:dS<=179?["Excesivo",[200,80,20]]:["Servicio continuo",[180,40,20]];
        dato2("Duracion del servicio", dS+" dias  →  "+dLab, "Meta recomendada", "60-90 dias");
        if (dS > 90) {
          chk(8);
          doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(...Gr);
          const recSrv = dS>=180?"Sin estacionar. Meta: reducir a 120d y luego a 90d. Cada mes que dura el servicio distribuye partos y dificulta el manejo.":"Acortar "+Math.round(dS-90)+"d adicionales concentra partos. La cola de paricion pierde "+Math.round((dS-90)/30)+" semanas de recuperacion antes del servicio.";
          parrafo(recSrv, 0, Gr, 7);
        }
        salto(3);
      }

      // ════════════════════════════════════════════════════════════
      // SECCIÓN FINAL — SANIDAD + AGUA + AVISO LEGAL
      // ════════════════════════════════════════════════════════════
      seccion("SANIDAD", [40,100,50]);
      const sanLinea = [
        "Aftosa: "+(form.sanAftosa==="si"?"Al dia":"SIN VACUNAR"),
        "Brucelosis: "+(form.sanBrucelosis==="si"?"Al dia":"SIN VACUNAR"),
        "IBR/DVB: "+(form.sanVacunas==="si"?"Al dia":"SIN VACUNAR"),
        "Rev. toros: "+(form.sanToros==="con_control"?"Con revision":"SIN REVISION"),
        "Abortos: "+(form.sanAbortos==="si"?"Si":"No"),
        "Programa San.: "+(form.sanPrograma==="si"?"Si":"No"),
      ].join("  ·  ");
      parrafo(sanLinea, 0, Gd, 7.5);
      salto(3);

      if (form.aguaTDS || form.aguaFuente) {
        seccion("CALIDAD DEL AGUA", [40,80,160]);
        const evalAguaPDF = evalAgua;
        const aguaLinea = [
          form.aguaTDS     ? "TDS: "+form.aguaTDS+" mg/L" : "",
          form.aguaTipoSal ? "Tipo sal: "+txt(form.aguaTipoSal) : "",
          form.aguaFuente  ? "Fuente: "+txt(form.aguaFuente) : "",
          evalAguaPDF?.label   ? "Estado: "+txt(evalAguaPDF.label) : "",
          evalAguaPDF?.pctReducDMI>0 ? "Reduccion DMI: "+evalAguaPDF.pctReducDMI.toFixed(1)+"%" : "",
        ].filter(Boolean).join("  ·  ");
        parrafo(aguaLinea, 0, Gd, 7.5);
        salto(3);
      }

      // Disclaimer
      chk(16);
      doc.setDrawColor(200,180,100); doc.setLineWidth(0.3); doc.line(ML, y, ML+AU, y); salto(5);
      doc.setFontSize(6.5); doc.setFont("helvetica","italic"); doc.setTextColor(140,120,50);
      doc.splitTextToSize("AVISO LEGAL: "+txt(DISCLAIMER), AU).forEach(ln => { chk(4); doc.text(ln,ML,y); salto(3.5); });
      salto(3);
      doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(160,160,160);
      doc.text("Referencias: Peruchena 2003 · Selk 1988 · Short et al. 1990 · NASSEM 2010 · NRC 2000 · Detmann/NASSEM 2010", ML, y); salto(4);

      // Numeración páginas
      const tot = doc.getNumberOfPages();
      for (let p=1;p<=tot;p++) {
        doc.setPage(p);
        doc.setFontSize(6); doc.setFont("helvetica","normal"); doc.setTextColor(180,180,180);
        doc.text("AGROMIND PRO — Informe Tecnico de Cria", ML, 293);
        doc.text(`Pag. ${p}/${tot}`, W-MR, 293, {align:"right"});
      }

      doc.save(`agromind_${(form.nombreProductor||"informe").replace(/\s/g,"_")}_${new Date().toISOString().slice(0,10)}.pdf`);
      showToast("PDF generado correctamente", "ok");
    } catch(pdfErr) { console.error("PDF error:", pdfErr); showToast("Error al generar el PDF. Intentá de nuevo.", "error", 5000); }
    };

    import('jspdf').then(({ jsPDF }) => gen(jsPDF)).catch(() => showToast("Error al cargar jsPDF. Intentá de nuevo.", "error", 5000));
  }

  // ── DESCARGAR EXCEL ───────────────────────────────────────────
  function descargarCSV() { descargarExcel(); } // alias para botones existentes

  function descargarExcel() {
    const fecha   = new Date().toLocaleDateString("es-AR");
    const isoDate = new Date().toISOString().slice(0,10);
    const dispMS  = calcDisponibilidadMS(form.altPasto, form.tipoPasto);
    const cb      = cerebroMemo;
    const sc      = calcScore(motor, form, null);

    // Datos derivados reutilizables
    const cadenaXL = motor?.cadena ?? (form.iniServ && form.finServ ? calcCadena(form.iniServ, form.finServ) : null);
    const diasServXL = cadenaXL?.diasServ || 0;
    const diagDurXL = diasServXL <= 0 ? "Sin fechas"
                    : diasServXL <= 90 ? "Optimo (<=90d)"
                    : diasServXL <= 120 ? "Aceptable (91-120d)"
                    : diasServXL <= 179 ? "Excesivo (121-179d)"
                    : "Servicio continuo (>=180d)";
    const nVacasXL = parseInt(form.vacasN) || 0;
    const nTorosXL = parseInt(form.torosN) || 0;
    const relToro  = nVacasXL > 0 && nTorosXL > 0 ? +(nVacasXL / nTorosXL).toFixed(1) : "";
    // Autonomia forrajera: dias disponibles con la oferta actual
    const mesHoyXL = new Date().getMonth();
    const demHoyMcal = motor?.balanceMensual?.find(m => m.i === mesHoyXL)?.demanda || 0;
    const supGanXL = (parseFloat(form.supHa)||0) * (1 - ((parseFloat(form.pctMonte)||0) + (parseFloat(form.pctNGan)||0)) / 100);
    const dispMSTotalXL = (dispMS?.msHa || 0) * supGanXL; // kg MS total disponible hoy
    const EM_MEDIA = 2.2; // Mcal/kg MS media pastizal NEA
    const demKgMSDia = demHoyMcal / EM_MEDIA;
    const autonomiaDiasXL = demKgMSDia > 0 && dispMSTotalXL > 0 ? Math.round(dispMSTotalXL / demKgMSDia) : null;

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
      ["Autonomia forrajera (dias)", autonomiaDiasXL ?? ""],
      ["Relacion toro:vaca", relToro],
      ["", "", "", ""],
      ["CLIMA SATELITAL", "", "", ""],
      ["Temperatura actual (C)", sat?.temp || ""],
      ["Temp max (C)",       sat?.tMax || ""],
      ["Temp min (C)",       sat?.tMin || ""],
      ["Lluvia 7d (mm)",     sat?.p7   || ""],
      ["Lluvia 30d (mm)",    sat?.p30  || ""],
      ["Lluvia 90d (mm)",    sat?.p90  || ""],
      ["Balance hidrico (mm)", sat?.deficit || ""],
      ["NDVI",               sat?.ndvi || ""],
      ["NDVI historico referencia", sat?.ndviHist ?? ""],
      ["NDVI delta vs historico",   sat?.ndviDelta ?? ""],
      ["NDVI categoria",            sat?.ndviCateg || ""],
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
      ["PV entrada vaq1 (kg)",   form.vaq1PV || tcSave?.pvMayoPond || ""],
      ["PV salida vaq1 (kg)",   vaq1E?.pvSal || ""],
      ["GDP vaq1 con supl (g/d)", vaq1E?.gdpReal || ""],
      ["GDP vaq1 sin supl (g/d)", vaq1E?.gdpPasto || ""],
      ["PV objetivo entore vaq1 (kg)", motor?.pvEntVaq1 ? Math.round(parseFloat(form.pvVacaAdulta||380)*0.40) : ""],
      ["Llega objetivo vaq1",   vaq1E ? (vaq1E.pvSal >= Math.round(parseFloat(form.pvVacaAdulta||380)*0.40) ? "Si" : "No") : ""],
      ["", "", "", ""],
      ["VAQUILLONA 2 INVIERNO", "", "", ""],
      ["Vaq2 (cab)",            form.vaq2N || ""],
      ["PV entrada vaq2 mayo (kg)", pvEntradaVaq2 || ""],
      ["PV vaq2 agosto (kg)",   vaq2E?.pvV2Agosto || ""],
      ["PV al entore (kg)",     vaq2E?.pvEntore || ""],
      ["PV minimo entore (kg)", vaq2E?.pvMinEntore || ""],
      ["Llega objetivo entore", vaq2E?.llegas ? "Si" : vaq2E ? "No" : ""],
      ["Deficit PV entore (kg)", vaq2E && !vaq2E.llegas ? (vaq2E.pvMinEntore||0)-(vaq2E.pvEntore||0) : 0],
      ["Lluvia 90d (mm)",        sat?.p90 || ""],
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
      ["Mes","Oferta (Mcal/d)","Demanda (Mcal/d)","Balance (Mcal/d)","Deficit","% Cobertura","Carga ajustada","Terneros (Mcal/d)","Demanda (kg MS/d)","Balance (kg MS/d)"],
    ];
    if (motor?.balanceMensual) {
      motor.balanceMensual.forEach(m => {
        const demKgMS = m.demanda != null ? +(m.demanda / EM_MEDIA).toFixed(1) : "";
        const balKgMS = m.balance != null ? +(m.balance / EM_MEDIA).toFixed(1) : "";
        hoja2.push([
          MESES_XL[m.i] || m.i,
          m.oferta  != null ? +m.oferta.toFixed(1)  : "",
          m.demanda != null ? +m.demanda.toFixed(1) : "",
          m.balance != null ? +m.balance.toFixed(1) : "",
          m.deficit ? "SI" : "No",
          m.cobertura != null ? +(m.cobertura * 100).toFixed(0) : "",
          m.cargaAjustada != null ? +m.cargaAjustada.toFixed(2) : "",
          m.dTerneros != null ? +m.dTerneros.toFixed(1) : "",
          demKgMS,
          balKgMS,
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
      ["Score riesgo",         motor?.scoreRiesgo || ""],
      ["Nivel riesgo",         motor?.nivelRiesgo || ""],
      ["Prenez potencial (%)", cb?.prescripciones?.resumen?.prenezPot || ""],
      ["Terneros adicionales", cb?.prescripciones?.resumen?.ternerosDif || ""],
      ["", "", ""],
      ["PUNTOS CRITICOS", "", ""],
    ];
    if (cb?.prescripciones?.tarjetas) {
      cb.prescripciones.tarjetas.forEach(t => {
        hoja3.push([t.prioridad || "", t.titulo || "", t.descripcion || ""]);
      });
    }
    hoja3.push(["", "", ""]);
    hoja3.push(["BALANCE INVERNAL", "", ""]);
    hoja3.push(["Balance junio (Mcal/d)",  motor?.balanceMensual?.[5]?.balance != null ? +motor.balanceMensual[5].balance.toFixed(1) : ""]);
    hoja3.push(["Balance julio (Mcal/d)",  motor?.balanceMensual?.[6]?.balance != null ? +motor.balanceMensual[6].balance.toFixed(1) : ""]);
    hoja3.push(["Balance agosto (Mcal/d)", motor?.balanceMensual?.[7]?.balance != null ? +motor.balanceMensual[7].balance.toFixed(1) : ""]);
    hoja3.push(["Meses en deficit (jun-ago)", motor?.mesesDeficit ?? ""]);
    if (result) {
      hoja3.push(["", "", ""]);
      hoja3.push(["INFORME IA", "", ""]);
      hoja3.push([result.replace(/\n/g, " | "), "", ""]);
    }

    // Hoja 4: Servicio y Reproducción
    const hojaRepro = [
      ["SERVICIO Y REPRODUCCION — CALFAI", "", ""],
      ["Fecha consulta:", fecha, ""],
      ["", "", ""],
      ["SERVICIO", "", ""],
      ["Inicio servicio",           form.iniServ || ""],
      ["Fin servicio",              form.finServ || ""],
      ["Duracion (dias)",           diasServXL || ""],
      ["Diagnostico duracion",      diagDurXL],
      ["Fecha parto temprano",      cadenaXL?.partoTemp ? new Date(cadenaXL.partoTemp).toLocaleDateString("es-AR") : ""],
      ["Fecha parto tardio",        cadenaXL?.partoTard ? new Date(cadenaXL.partoTard).toLocaleDateString("es-AR") : ""],
      ["Servicio continuo",         cadenaXL?.esContinuo ? "Si" : diasServXL > 0 ? "No" : ""],
      ["", "", ""],
      ["REPRODUCCION", "", ""],
      ["Prenez cargada (%)",        form.prenez || ""],
      ["Prenez estimada (%)",       tray?.pr || ""],
      ["Prenez usada (%)",          prenezDisplay ?? ""],
      ["Fuente prenez",             prenezFuente],
      ["Tasa senalada hist. (%)",   form.pctDestete || ""],
      ["Dias de anestro (prom)",    tray?.anestro?.dias || ""],
      ["Meses de lactacion",        tray?.mesesLact || ""],
      ["", "", ""],
      ["DESTETE", "", ""],
      ["Destete recomendado",       tray?.recDestete || ""],
      ["Destete tardias (>120d)",   tray?.recDesteTardio?.tipo || ""],
      ["% Trad 180d",               form.destTrad  || "0"],
      ["% Anticipado 90d",          form.destAntic || "0"],
      ["% Hiperprecoz 50d",         form.destHiper || "0"],
      ["CC al servicio trad",       tray?.ccServTrad?.toFixed(2) || ""],
      ["CC al servicio anticipado", tray?.ccServAntic?.toFixed(2) || ""],
      ["CC al servicio hiperprecoz",tray?.ccServHiper?.toFixed(2) || ""],
      ["Prenez con trad (%)",       tray?.pr || ""],
      ["Prenez con anticipado (%)", tray?.prAntic || ""],
      ["Prenez con hiperprecoz (%)",tray?.prHiper || ""],
    ];

    // Hoja 5: Recomendaciones
    const hoja5 = [
      ["RECOMENDACIONES — CALFAI", "", "", "", ""],
      ["Fecha consulta:", fecha, "", "", ""],
      ["", "", "", "", ""],
      ["Prioridad", "Area", "Accion", "Descripcion / Que hacer", "Cuando"],
    ];
    if (cb?.prescripciones?.tarjetas) {
      cb.prescripciones.tarjetas.filter(t => ["P1","P2","URGENTE"].includes(t.prioridad)).forEach(t => {
        hoja5.push([
          t.prioridad  || "",
          t.area       || "",
          t.titulo     || "",
          t.que        || t.descripcion || "",
          t.cuando     || t.fecha      || "",
        ]);
      });
    }

    // ── HOJA HISTORIAL — única hoja, variables como columnas, visitas como filas ──
    const FENOL_NOM_XL = { menor_10:"Rebrote", "10_25":"Crecimiento", "25_50":"Maduracion", mayor_50:"Encanado" };

    const histVisitas = leerHistorial();
    const hoyIso = isoDate;
    const potrerosAct = potreros || [];
    const currentAlreadyInHist = histVisitas.some(h =>
      h.productor === (form.nombreProductor || "") && h.fecha?.slice(0,10) === hoyIso
    );
    const todasVisitas = currentAlreadyInHist ? histVisitas : [
      { id: Date.now(), fecha: new Date().toISOString(), productor: form.nombreProductor || "", form,
        prenezEst: tray?.pr, ccServ: tray?.ccServ, mesesDeficit: motor?.balanceMensual
          ? [4,5,6].filter(i => (motor.balanceMensual[i]?.balance ?? 0) < 0).length : 0,
        nivelRiesgo: "—", potreros: potrerosAct },
      ...histVisitas,
    ];

    // Calcular numero maximo de potreros para dimensionar encabezados
    const maxPots = Math.max(1, ...todasVisitas.map(e => (e.potreros || []).length));
    const potHeaders = [];
    for (let pi = 1; pi <= maxPots; pi++) {
      potHeaders.push(`P${pi} Ha`, `P${pi} Vegetacion`, `P${pi} Fenologia`, `P${pi} Alt pasto (cm)`, `P${pi} Tipo pasto`, `P${pi} Disp MS (kg/ha)`);
    }

    const HEADERS_WIDE = [
      "Fecha","Productor","Localidad","Provincia",
      "Vacas (cab)","Toros (cab)","V2S (cab)","Vaq2 (cab)",
      "PV vaca adulta (kg)","Biotipo","% Reposicion",
      "Inicio servicio","Fin servicio","Duracion servicio (d)",
      "CC ponderada hoy","CC parto","CC min lactacion","CC al servicio",
      "Prenez est (%)","Anestro (d)","Meses lactacion",
      "% Destete trad 180d","% Destete anticip 90d","% Destete hiperprecoz 50d",
      "Sup ganadera (ha)","Carga (EV/ha)","Tiene verdeo","Verdeo (ha)",
      "Supl V2S","Dosis V2S (kg/d)","Supl Vaq2","Dosis Vaq2 (kg/d)","Supl Vaq1","Dosis Vaq1 (kg/d)",
      "Meses suplementacion","Meses deficit inv (Jun-Ago)","Nivel riesgo","ENSO",
      "Lluvia 30d (mm)","NDVI","Condicion forrajera",
      "Score total","Score CC","Score balance","Score repro",
      ...potHeaders,
    ];

    const filas = todasVisitas.map(entrada => {
      const f = entrada.form || {};
      const fCadena = f.iniServ && f.finServ ? (() => { try { return calcCadena(f.iniServ, f.finServ); } catch { return null; } })() : null;
      const fTray = (() => {
        try {
          return calcTrayectoriaCC({
            dist: f.distribucionCC, cadena: fCadena,
            destTrad: f.destTrad, destAntic: f.destAntic, destHiper: f.destHiper,
            supHa: f.supHa, vacasN: f.vacasN, biotipo: f.biotipo, primerParto: f.primerParto,
            supl1: f.supl1 || "", dosis1: f.dosis1 || "0", supl2: "", dosis2: "0",
            supl3: f.supl3 || "", dosis3: f.dosis3 || "0", provincia: f.provincia,
          });
        } catch { return null; }
      })();
      const ccPond = (() => {
        const dist = f.distribucionCC || [];
        const { s, t } = dist.reduce((acc, g) => {
          const p = parseFloat(g.pct) || 0, c = parseFloat(g.cc) || 0;
          return { s: acc.s + p * c, t: acc.t + p };
        }, { s: 0, t: 0 });
        return t > 0 ? +(s / t).toFixed(2) : "";
      })();
      const nVac = parseInt(f.vacasN) || 0;
      const nTor = parseInt(f.torosN) || 0;
      const supHa = parseFloat(f.supHa) || 0;
      const cargaEVha = nVac > 0 && supHa > 0 ? +(nVac / supHa).toFixed(2) : "";
      const diasServF = fCadena?.diasServ || 0;
      const scF = (() => { try { return calcScore(null, f, null); } catch { return null; } })();
      const cbF = (() => { try { return calcCerebro(null, f, null); } catch { return null; } })();
      const entPotreros = entrada.potreros || [];
      const potCols = [];
      for (let pi = 0; pi < maxPots; pi++) {
        const p = entPotreros[pi];
        if (p) {
          const esPast = (p.veg || "").includes("Pastizal");
          const dispP  = esPast && p.altPasto ? calcDisponibilidadMS(p.altPasto, p.tipoPasto || "corto_denso") : null;
          potCols.push(
            parseFloat(p.ha) || "",
            p.veg || "",
            FENOL_NOM_XL[p.fenol] || p.fenol || "",
            parseFloat(p.altPasto) || "",
            p.tipoPasto || "",
            dispP ? Math.round(dispP.msHa) : "",
          );
        } else {
          potCols.push("","","","","","");
        }
      }

      return [
        entrada.fecha?.slice(0,10) || fecha,
        f.nombreProductor || entrada.productor || "",
        f.localidad || "",
        f.provincia || "",
        nVac || "",
        nTor || "",
        parseInt(f.v2sN) || "",
        parseInt(f.vaq2N) || "",
        parseFloat(f.pvVacaAdulta) || "",
        f.biotipo || "",
        parseFloat(f.pctReposicion) || 20,
        f.iniServ || "",
        f.finServ || "",
        diasServF || "",
        ccPond,
        fTray?.ccParto?.toFixed ? +fTray.ccParto.toFixed(2) : (entrada.ccServ || ""),
        fTray?.ccMinLact?.toFixed ? +fTray.ccMinLact.toFixed(2) : "",
        fTray?.ccServ?.toFixed ? +fTray.ccServ.toFixed(2) : (entrada.ccServ || ""),
        fTray?.pr || entrada.prenezEst || "",
        fTray?.anestro?.dias || "",
        fTray?.mesesLact || "",
        parseFloat(f.destTrad) || 0,
        parseFloat(f.destAntic) || 0,
        parseFloat(f.destHiper) || 0,
        supHa || "",
        cargaEVha,
        f.tieneVerdeo === "si" ? "Si" : "No",
        f.tieneVerdeo === "si" ? (parseFloat(f.verdeoHa) || "") : "",
        f.supl_v2s || "",
        parseFloat(f.dosis_v2s) || 0,
        f.supl_vaq2 || "",
        parseFloat(f.dosis_vaq2) || 0,
        f.supl_vaq1 || "",
        parseFloat(f.dosis_vaq1) || 0,
        (f.suplMeses || ["5","6","7"]).length,
        typeof entrada.mesesDeficit === "number" ? entrada.mesesDeficit : "",
        cbF?.resumen?.nivelRiesgo || entrada.nivelRiesgo || "",
        f.enso || "neutro",
        entrada.sat?.p30 ?? "",
        entrada.sat?.ndvi ?? "",
        entrada.sat?.condForr || "",
        scF?.total || "",
        scF?.dim?.find(d=>d.id==="cc")?.score || "",
        scF?.dim?.find(d=>d.id==="balance")?.score || "",
        scF?.dim?.find(d=>d.id==="repro")?.score || "",
        ...potCols,
      ];
    });

    const wsHistorial = XLSX.utils.aoa_to_sheet([HEADERS_WIDE, ...filas]);
    wsHistorial["!freeze"] = { xSplit: 0, ySplit: 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsHistorial, "Historial");
    XLSX.writeFile(wb, `calfai_historial_${isoDate}.xlsx`);
    showToast(`Excel generado: ${todasVisitas.length} visita${todasVisitas.length!==1?"s":""} ✓`, "ok");
  }

  // ══════════════════════════════════════════════════════════════
  // PASOS DEL FORMULARIO
  // ══════════════════════════════════════════════════════════════

  // ── PASO 0: UBICACIÓN ─────────────────────────────────────────
  const renderUbicacion = () => (
    <div>
      {/* GPS — siempre visible, acción principal */}
      <div style={{ background: coords ? `${C.green}0d` : `${C.card2}`,
        border:`1px solid ${coords ? C.green+"40" : C.border}`,
        borderRadius:12, padding:"12px 14px", marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
          <div style={{ flex:1 }}>
            {coords ? (
              <div>
                <div style={{ fontFamily:C.font, fontSize:10, color:C.green, fontWeight:700, marginBottom:2 }}>
                  📍 {form.localidad || form.provincia || "Ubicación detectada"}
                  {form.provincia && form.localidad ? ` · ${form.provincia}` : ""}
                </div>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>
                  {coords.lat.toFixed(4)}°, {coords.lon.toFixed(4)}° · toca para actualizar
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontFamily:C.font, fontSize:11, color:C.text, fontWeight:600, marginBottom:2 }}>
                  Detectar ubicación automáticamente
                </div>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>
                  Autodetecta provincia y localidad · o elegí manualmente abajo
                </div>
              </div>
            )}
          </div>
          <button onClick={gpsClick} disabled={gpsLoading} style={{
            padding:"10px 16px", borderRadius:10, cursor:"pointer", flexShrink:0,
            background: coords ? `${C.green}20` : C.green,
            border:`1px solid ${C.green}`,
            fontFamily:C.font, fontSize:11, fontWeight:700,
            color: coords ? C.green : "#fff",
            opacity: gpsLoading ? 0.6 : 1,
          }}>
            {gpsLoading ? "…" : coords ? "🔄" : "📍 GPS"}
          </button>
        </div>
      </div>
      {sat && !sat.error && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, margin:"10px 0" }}>
          <MetricCard label="TEMPERATURA" value={sat.temp+"°C"}  color={C.amber} />
          <MetricCard label="NDVI (estimado)" value={sat.ndvi}
            color={sat.ndviDelta > 0 ? C.green : sat.ndviDelta > -0.08 ? C.amber : C.red}
            sub={`${sat.condForr||""} · ref ${sat.ndviHist ?? "—"} · ${sat.ndviCateg ?? "proxy"}`} />
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

        return (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontFamily:C.font, fontSize:12, color:C.textDim, letterSpacing:1, marginBottom:8 }}>
              📅 FECHAS DE SERVICIO
            </div>
            {finAnioCorr !== finAnio && finMes && iniMes && (
              <div style={{ background:C.blue+"10", border:"1px solid "+C.blue+"30", borderRadius:8,
                padding:"6px 10px", marginBottom:8 }}>
                <span style={{ fontFamily:C.font, fontSize:11, color:C.blue }}>
                  ℹ El fin del servicio cruza el año — ajustado a {finAnioCorr} automáticamente
                </span>
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:6 }}>
              {/* Inicio */}
              <div>
                <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint, marginBottom:4 }}>INICIO</div>
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
                <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint, marginBottom:4 }}>FIN</div>
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
            {!form.iniServ && (
              <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint, marginTop:4 }}>
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
        <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint, letterSpacing:1, marginBottom:6 }}>
          ¿CUÁNDO SE HIZO EL TACTO?
        </div>

        {/* ── Selector de escala CC — crítico para la conversión correcta ── */}
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint, letterSpacing:1, marginBottom:5 }}>
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
            <div style={{ fontFamily:C.font, fontSize:11, color:C.blue, marginTop:6 }}>
              ℹ Los valores que ingresás se convierten automáticamente a escala 1-9 para los cálculos.
              Ej: CC 3.0 (1-5) = CC 5.4 (1-9)
            </div>
          )}
        </div>

        <div style={{ fontFamily:C.font, fontSize:11, color:C.textDim, lineHeight:1.6, marginBottom:8 }}>
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
      </div>
      <div style={{ fontFamily:C.font, fontSize:12, color:C.textDim, letterSpacing:1, marginBottom:6 }}>CC AL TACTO (pre-parto) — distribución por grupo (escala 1–9 INTA)</div>
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
        <div style={{ fontFamily:C.font, fontSize:12, color:C.textDim, letterSpacing:1, marginBottom:4 }}>MODALIDAD DE DESTETE</div>
        <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint, marginBottom:10, lineHeight:1.6 }}>
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

    </div>
  );

  // ── PASO 3: CATEGORÍAS ────────────────────────────────────────
  const renderCategorias = () => (
    <div>


      {/* Vaquillona 1° invierno */}
      <details open style={{ marginBottom:10 }}>
        <summary style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", cursor:"pointer", listStyle:"none", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:C.font, fontSize:11, color:C.green, fontWeight:600 }}>🐄 VAQ. 1° INVIERNO · {nVaqRepos} vaquillas</span>
        </summary>
        <div style={{ background:C.card2, borderRadius:"0 0 12px 12px", padding:14, border:`1px solid ${C.border}`, borderTop:"none" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <Input label="% REPOSICIÓN" value={form.pctReposicion} onChange={v=>set("pctReposicion",v)} placeholder="" type="number" />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <Input label="PV ACTUAL VAQ1 (kg)"
              value={form.vaq1PV} onChange={v=>set("vaq1PV",v)} placeholder="" type="number"
              sub="Peso real hoy — calibra GDP necesaria" />
            <Input label="EDAD AL 1° MAYO (meses)"
              value={form.edadVaqMayo} onChange={v=>set("edadVaqMayo",v)} placeholder="" type="number"
              sub="Define objetivo de entore" />
          </div>
        </div>
      </details>

      {/* Panel unificado Vaq2 — trayectoria y datos de entrada */}
      {true && (
        <details open style={{ marginBottom:10 }}>
          <summary style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", cursor:"pointer", listStyle:"none", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:C.font, fontSize:11, color:C.blue, fontWeight:600 }}>
              🐂 VAQ. 2° INVIERNO · {form.vaq2N?`${form.vaq2N} cab.`:"Ingresar cantidad"}
            </span>
          </summary>
          <div style={{ background:C.card2, borderRadius:"0 0 12px 12px", padding:14, border:`1px solid ${C.border}`, borderTop:"none" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <Input label="CANTIDAD" value={form.vaq2N} onChange={v=>set("vaq2N",v)} placeholder="" type="number" />
              <Input label="PV ACTUAL VAQ2 (kg)" value={form.vaq2PV} onChange={v=>set("vaq2PV",v)} placeholder="" type="number"
                sub="Peso real hoy" />
            </div>
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
            <span style={{ marginLeft:"auto", fontFamily:C.font, fontSize:9, color: C.amber }}>
              {form.v2sTernero === "si" ? "⚠ Con ternero al pie" : "Sin ternero"}
            </span>
          )}
        </summary>
        <div style={{ background:C.card2, borderRadius:"0 0 12px 12px", padding:14, border:`1px solid ${C.border}`, borderTop:"none" }}>

          {/* Banner categoría crítica */}
          <div style={{ background:"rgba(232,160,48,.06)", border:"1px solid rgba(232,160,48,.25)", borderRadius:10, padding:"10px 12px", marginBottom:14 }}>
            <div style={{ fontFamily:C.font, fontSize:11, color:C.amber, letterSpacing:1, marginBottom:4 }}>⚠ CATEGORÍA DE MAYOR RIESGO DEL RODEO</div>
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
          <div style={{ fontFamily:C.font, fontSize:11, color:C.textDim, letterSpacing:1, marginBottom:8 }}>
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
      "Pastizal natural":         { cat:"pastizal", label:"Pastizal natural",              emoji:"🌿", fenologia:true,  altura:true,  pb:14,  desc:"Calidad variable por fenología · estimación por altura" },
      "Megatérmicas C4":          { cat:"c4",       label:"Megatérmicas C4",               emoji:"🌱", fenologia:true,  altura:false, pb:22,  desc:"Alta producción en verano · baja en invierno · fenología aplica" },
      "Pasturas templadas C3":    { cat:"c3",       label:"Pasturas templadas C3",          emoji:"🌾", fenologia:false, altura:false, pb:16,  desc:"Producción más estable · sin fenología estacional marcada" },
      "Mixta gramíneas+legum.":   { cat:"mixta",    label:"Mixta gramíneas + leguminosas",  emoji:"🌱", fenologia:false, altura:false, pb:18,  desc:"PB alta por leguminosas · buena calidad todo el año" },
      "Bosque nativo / monte":    { cat:"monte",    label:"Bosque nativo / monte",          emoji:"🌳", fenologia:false, altura:false, pb:2.5, desc:"Baja oferta · valor en sombra y refugio · no suplementa" },
      "Verdeo de invierno":       { cat:"verdeo",   label:"Verdeo de invierno",             emoji:"🌾", fenologia:false, altura:false, pb:18,  desc:"Avena · raigrás · melilotus — pastoreo 3 meses" },
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
        <div style={{ fontFamily:C.font, fontSize:11, color:C.green, letterSpacing:1, marginBottom:10 }}>
          🗺️ POTREROS — cargá cada potrero o lote
        </div>

        {potreros.map((p, i) => {
          const rec = RECURSOS[p.veg] || RECURSOS["Pastizal natural"];
          const esPastizal = rec.cat === "pastizal";
          const esVerdeo   = rec.cat === "verdeo";
          const esC4oPatizal = rec.cat === "c4" || rec.cat === "pastizal";
          const disp = esPastizal && p.altPasto ? calcDisponibilidadMS(p.altPasto, p.tipoPasto||"corto_denso") : null;

          return (
            <div key={i} style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <span style={{ fontFamily:C.font, fontSize:12, color:C.green, fontWeight:600 }}>Potrero {i+1}</span>
                {potreros.length > 1 && (
                  <button aria-label="Eliminar potrero" onClick={()=>setPotreros(ps=>ps.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontFamily:C.font, fontSize:12 }}>✕</button>
                )}
              </div>

              {/* Hectáreas */}
              <Input label="HECTÁREAS" value={p.ha} onChange={v=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],ha:v};return n;})} placeholder="100" type="number" />

              {/* Tipo de recurso */}
              <div style={{ marginBottom:10 }}>
                <div style={{ fontFamily:C.font, fontSize:11, color:C.textDim, letterSpacing:1, marginBottom:6 }}>TIPO DE RECURSO FORRAJERO</div>
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
                  <div style={{ fontFamily:C.font, fontSize:11, color:C.textDim, letterSpacing:1, marginBottom:6 }}>FENOLOGÍA ACTUAL</div>
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
                  <div style={{ fontFamily:C.font, fontSize:11, color:C.textDim, letterSpacing:1, marginBottom:6 }}>📏 DISPONIBILIDAD (método INTA — altura × tipo)</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                    <Input label="ALTURA PASTO (cm)" value={p.altPasto||""} onChange={v=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],altPasto:v};return n;})} placeholder="20" type="number" sub="Promedio caminando el potrero" />
                    <div>
                      <div style={{ fontFamily:C.font, fontSize:11, color:C.textDim, letterSpacing:1, marginBottom:5 }}>TIPO DE PASTO</div>
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

              {/* Tipo y disponibilidad — solo verdeo */}
              {esVerdeo && (
                <div style={{ marginBottom:8 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <SelectF label="ESPECIE" value={p.verdeoTipo||"Avena / Raigrás / Melilotus"}
                      onChange={v=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],verdeoTipo:v};return n;})}
                      options={[
                        ["Avena / Raigrás / Melilotus","Avena · Raigrás · Melilotus"],
                        ["Melilotus","Melilotus (leguminosa)"],
                        ["Raigrás anual","Raigrás anual"],
                        ["Triticale","Triticale"],
                        ["Gramínea + leguminosa","Gramínea + leguminosa"],
                      ]} />
                    <SelectF label="DISPONIBLE DESDE" value={p.verdeoDisp||"agosto"}
                      onChange={v=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],verdeoDisp:v};return n;})}
                      options={[
                        ["junio","Junio"],["julio","Julio"],["agosto","Agosto"],["septiembre","Septiembre"],
                      ]} />
                  </div>
                  <SelectF label="DESTINADO A" value={p.verdeoDestino||"si"}
                    onChange={v=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],verdeoDestino:v};return n;})}
                    options={[
                      ["si","Vaquillona 1° inv. (prioridad)"],["vaq2","Vaquillona 2° inv."],
                      ["v2s","Vaca 2° servicio"],["todo","Rodeo general"],
                    ]} />
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
              <div key={i} style={{ fontFamily:C.font, fontSize:11, color:C.textDim, marginTop:4 }}>
                Potrero {i+1}: {p.ha} ha · {(RECURSOS[p.veg]||{}).label||p.veg}
                {p.altPasto && ` · ${p.altPasto}cm altura`}
              </div>
            ) : null)}
          </div>
        )}

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
          <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint, letterSpacing:1, marginBottom:8 }}>
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
              <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint, marginTop:8 }}>
                {meses.length === 0
                  ? "⚠ Sin meses seleccionados — el suplemento no aplica en el balance"
                  : `${meses.length} mes${meses.length>1?"es":""}: ${rango} · ${meses.length * 30}d aprox`}
              </div>
            );
          })()}
        </div>
        {/* ══ SUPLEMENTACIÓN — solo categorías que lo necesitan ══ */}
        <div style={{ fontFamily:C.font, fontSize:12, color:C.textDim, letterSpacing:1, marginBottom:10 }}>
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
                    <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint }}>PV prom. mayo-agosto: {cat.pv} kg</div>
                  </div>
                </div>
                {tieneSupl && (
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontFamily:C.font, fontSize:11, color:cat.color, fontWeight:700 }}>{mcalTot.toFixed(1)} Mcal/d</div>
                    <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint }}>{Math.round(pbTot)} g PB/d</div>
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
                        <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint, textAlign:"right", lineHeight:1.4, minWidth:52 }}>
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
            <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint, letterSpacing:1, marginBottom:10 }}>
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
                    <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint }}>{mcal.toFixed(1)} Mcal · {Math.round(pb)}g PB</div>
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
              <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint,
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
                        <span style={{ fontFamily:C.font, fontSize:10, color:C.textFaint }}>
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

        {/* ══ MANEJO DE LACTANCIA — vacas de cría ══ */}
        <details style={{ marginTop:16 }}>
          <summary style={{ fontFamily:C.font, fontSize:10, color:C.green, letterSpacing:1, cursor:"pointer", padding:"8px 0", listStyle:"none", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:12 }}>▶</span> 🐄 MANEJO DE LACTANCIA — destete por grupo CC
          </summary>
          <div style={{ background:`${C.green}06`, border:`1px solid ${C.green}25`, borderRadius:14, padding:14, marginTop:8 }}>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:8, fontFamily:C.font, fontSize:8, color:C.textDim }}>
              <span><span style={{ color:C.red }}>⚡</span> Hiperprecoz — CC &lt;4.0 · crítico</span>
              <span><span style={{ color:C.amber }}>🔶</span> Anticipado — CC 4.0–4.9 · borderline</span>
              <span><span style={{ color:C.green }}>🟢</span> Tradicional — CC ≥5.0 · óptimo</span>
            </div>
            <div style={{ fontFamily:C.sans, fontSize:11, color:C.textDim, lineHeight:1.5, marginBottom:12 }}>
              El ternero al pie consume <strong style={{color:C.text}}>6–8 Mcal/día</strong> = más que cualquier suplemento posible.
              La herramienta para mejorar CC de la vaca es <strong style={{color:C.green}}>controlar cuándo y cómo se retira ese costo</strong>.
            </div>

            {distCC.filter(g=>parseFloat(g.cc)&&parseFloat(g.pct)>0).length > 0 ? (
              <div>
                {distCC.filter(g=>parseFloat(g.cc)&&parseFloat(g.pct)>0).map((g,i)=>{
                  const cc   = parseFloat(g.cc);
                  const pct  = parseFloat(g.pct);
                  const nVac = Math.round((parseInt(form.vacasN)||0)*pct/100);
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
                  const prenezProy = ccAPrenez(ccProyServ);
                  return (
                    <div key={i} style={{ background:C.card2, border:`1px solid ${herramienta.color}30`, borderRadius:10, padding:12, marginBottom:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                        <div>
                          <span style={{ fontFamily:C.font, fontSize:11, color:C.text, fontWeight:700 }}>CC {cc} · {pct}% del rodeo</span>
                          <span style={{ fontFamily:C.font, fontSize:10, color:C.textFaint, marginLeft:8 }}>({nVac} vacas)</span>
                        </div>
                        <span style={{ fontFamily:C.font, fontSize:9, color:herramienta.color, background:`${herramienta.color}15`, border:`1px solid ${herramienta.color}30`, borderRadius:6, padding:"3px 8px" }}>{herramienta.label}</span>
                      </div>
                      <div style={{ fontFamily:C.sans, fontSize:10, color:C.textDim, lineHeight:1.4, marginBottom:8 }}>{herramienta.razon}</div>
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
            <div style={{ background:`${C.red}06`, border:`1px solid ${C.red}20`, borderRadius:8, padding:10, marginTop:8 }}>
              <div style={{ fontFamily:C.font, fontSize:8, color:C.red, letterSpacing:1, marginBottom:6 }}>⚡ ¿POR QUÉ NO SUPLEMENTAR VACAS CON TERNERO AL PIE?</div>
              <div style={{ fontFamily:C.sans, fontSize:11, color:C.text, marginBottom:8, lineHeight:1.5 }}>
                La lactación le cuesta a la vaca <strong style={{color:C.red}}>6–8 Mcal/día</strong> extras. Para compensar ese gasto con suplemento necesitarías darle <strong style={{color:C.red}}>{(6.5/2.6).toFixed(1)} kg/día de expeller</strong> — más caro e ineficiente.
              </div>
              <div style={{ fontFamily:C.sans, fontSize:11, color:C.green, lineHeight:1.5 }}>
                ✅ <strong>La herramienta correcta es el destete:</strong> al retirar el ternero, la vaca elimina ese gasto de 6–8 Mcal/día y retoma el ciclo en <strong>7–14 días</strong>.
              </div>
            </div>
          </div>
        </details>


    </div>
    );
  };

  // ── PASO 7: SANIDAD ───────────────────────────────────────────
  const renderSanidad = () => (
    <div>
      <div style={{ fontFamily:C.font, fontSize:10, color:C.amber, letterSpacing:1, marginBottom:4 }}>🩺 SANIDAD REPRODUCTIVA</div>
      <div style={{ fontFamily:C.font, fontSize:11, color:C.textDim, marginBottom:16 }}>
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
          <div style={{ fontFamily:C.font, fontSize:11, color:C.textDim, letterSpacing:1, marginBottom:8 }}>ALERTAS SANITARIAS</div>
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
    step, setStep, motor, motor, tray, balanceMensual, sat,
    coords, setCoords, ccPondVal, evalAgua, sanidad, nVaqRepos, score,
    result, setResult, loading, setLoading, loadMsg, setLoadMsg,
    setTab, tab, confianza, scoreRiesgo, nivelRiesgo, colorRiesgo,
    cargaEV_ha, impactoCola, vaq1E, vaq2E, ccDesvio, dist,
    stockStatus, toroDxn, alertasMotor, modoForraje, setModoForraje,
    vistaSupl, setVistaSupl, usaPotreros, setUsaPotreros,
    potreros, setPotreros, runAnalysis,
    pvEntVaq1, pvSalidaVaq1, pvEntradaVaq2,
    nVacas, nToros, nV2s, nVaq1, nVaq2, cadena, disponMS, tcSave,
    PASOS, C, cerebro: cerebroMemo,
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
    if (!form.vacasN && !motor) return (
      <div style={{ padding:"60px 24px", textAlign:"center", maxWidth:440, margin:"0 auto" }}>
        <div style={{ fontSize:36, marginBottom:16, opacity:0.4 }}>◈</div>
        <div style={{ fontFamily:C.font, fontSize:14, color:C.textDim, marginBottom:8, letterSpacing:.5 }}>
          Todavía no hay datos para diagnosticar
        </div>
        <div style={{ fontFamily:C.fontSans, fontSize:12, color:C.textFaint, lineHeight:1.7, marginBottom:24 }}>
          Completá al menos los pasos <strong style={{ color:C.textDim }}>Rodeo y CC</strong> y <strong style={{ color:C.textDim }}>Potreros</strong> para que el motor calcule el balance y la cadena reproductiva.
        </div>
        <button onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          style={{ padding:"10px 22px", borderRadius:8, cursor:"pointer",
            background:C.green+"18", border:`1px solid ${C.green}40`,
            fontFamily:C.font, fontSize:12, color:C.green }}>
          Ir a Rodeo y CC →
        </button>
      </div>
    );

    const DG = "#1D9E75";
    const DR = "#E24B4A";
    const DA = "#F39C12";
    const GR = "#94A3B8";
    const SD = <span style={{ color:GR, fontStyle:"italic" }}>sin datos</span>;

    const kpiCol = (val, g, a) => (val === null || val === undefined) ? GR : val >= g ? DG : val >= a ? DA : DR;

    const ccHoy    = ccPondVal > 0 ? ccPondVal : null;
    const ccServ   = tray?.ccServ ? parseFloat(tray.ccServ) : null;
    const anestro  = tray?.anestro?.dias ?? null;
    const mDef     = motor ? balanceMensual.filter(m => [5,6,7].includes(m.i) && (m.balance ?? 0) < 0).length : null;
    const gdpVaq1  = vaq1E?.gdpReal ?? null;
    const llegaV2  = vaq2E ? vaq2E.llegas : null;

    const haTotal        = parseFloat(form.supHa) || null;
    const cabezasTotales = nVacas + nToros + nV2s + nVaq1 + nVaq2;

    const KPI = ({ label, value, color, unit }) => (
      <div style={{ background:color+"18", border:`1px solid ${color}40`,
        borderRadius:8, padding:"10px 14px", minWidth:96, flex:"1 1 96px" }}>
        <div style={{ fontFamily:C.font, fontSize:9, color:GR, letterSpacing:.8, marginBottom:4 }}>{label}</div>
        <div style={{ fontFamily:C.font, fontSize:16, fontWeight:700, color }}>
          {(value !== null && value !== undefined) ? value : "—"}
          {unit && (value !== null && value !== undefined) &&
            <span style={{ fontSize:10, fontWeight:400, marginLeft:2 }}>{unit}</span>}
        </div>
      </div>
    );

    const FR = ({ label, value }) => (
      <div style={{ display:"flex", justifyContent:"space-between", gap:8,
        padding:"3px 0", borderBottom:`1px solid ${C.border}30` }}>
        <span style={{ fontFamily:C.fontSans, fontSize:11, color:C.textDim, flexShrink:0 }}>{label}</span>
        <span style={{ fontFamily:C.fontSans, fontSize:11, color:C.text, textAlign:"right", maxWidth:"55%" }}>
          {(value !== null && value !== undefined && value !== "") ? value : SD}
        </span>
      </div>
    );

    const suplCat = (s, d) => {
      const sup = form[s]; const dos = parseFloat(form[d]) || 0;
      return (sup && dos) ? `${sup} · ${dos} kg/d` : null;
    };

    const secSum = { padding:"8px 14px", cursor:"pointer", fontFamily:C.font,
      fontSize:10, color:C.text, letterSpacing:.5, listStyle:"none", userSelect:"none" };

    return (
      <div>
        {/* ── BLOQUE 0 — Cabecera ── */}
        <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:10,
          padding:"10px 18px", marginBottom:16,
          display:"flex", flexWrap:"wrap", gap:"4px 20px", alignItems:"center" }}>
          {form.nombreProductor && (
            <span style={{ fontFamily:C.font, fontSize:13, fontWeight:700, color:C.text }}>
              {form.nombreProductor}
            </span>
          )}
          {[
            form.localidad,
            form.provincia,
            form.zona,
            form.biotipo,
            haTotal && `${haTotal.toLocaleString()} ha`,
            cargaEV_ha && `${cargaEV_ha.toFixed(2)} EV/ha`,
            cabezasTotales > 0 && `${cabezasTotales} cabezas`,
            (form.iniServ || form.finServ) && `Serv. ${form.iniServ || "?"}–${form.finServ || "?"}`,
          ].filter(Boolean).map((item, i) => (
            <span key={i} style={{ fontFamily:C.fontSans, fontSize:11, color:C.textDim }}>{item}</span>
          ))}
        </div>

        {/* ── BLOQUE 1 — KPIs ── */}
        {motor && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            <KPI label="CC HOY" value={ccHoy?.toFixed(1)} color={kpiCol(ccHoy, 5.0, 4.5)} />
            <KPI label="CC SERVICIO" value={ccServ?.toFixed(1)} color={kpiCol(ccServ, 5.0, 4.5)} />
            <KPI label="ANESTRO" value={anestro} unit="días"
              color={anestro === null ? GR : anestro <= 60 ? DG : anestro <= 90 ? DA : DR} />
            <KPI label={`PREÑEZ ${prenezFuente}`} value={prenezDisplay} unit="%" color={kpiCol(prenezDisplay, 90, 70)} />
            <KPI label="CARGA" value={cargaEV_ha?.toFixed(2)} unit="EV/ha" color={GR} />
            <KPI label="MESES DÉFICIT" value={mDef}
              color={mDef === null ? GR : mDef === 0 ? DG : mDef === 1 ? DA : DR} />
            {gdpVaq1 !== null && (
              <KPI label="GDP VAQ1" value={gdpVaq1} unit="g/d" color={kpiCol(gdpVaq1, 500, 200)} />
            )}
            {llegaV2 !== null && (
              <KPI label="VAQ2 ENTORE" value={llegaV2 ? "Llega" : "No llega"} color={llegaV2 ? DG : DR} />
            )}
          </div>
        )}

        {/* ── BLOQUE 2 + 3 ── */}
        <div className="diag-grid">
          {/* BLOQUE 2 — Panel datos cargados (sticky) */}
          <div className="diag-sticky">
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
              <div style={{ padding:"10px 14px", borderBottom:`1px solid ${C.border}`,
                fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1 }}>
                DATOS CARGADOS
              </div>

              <details open style={{ borderBottom:`1px solid ${C.border}` }}>
                <summary style={secSum}>RODEO</summary>
                <div style={{ padding:"4px 14px 10px" }}>
                  <FR label="Vacas"          value={nVacas || null} />
                  <FR label="Toros"          value={nToros || null} />
                  <FR label="V2S"            value={nV2s   || null} />
                  <FR label="Vaq2"           value={nVaq2  || null} />
                  <FR label="Vaq1"           value={nVaq1  || null} />
                  <FR label="Biotipo"        value={form.biotipo} />
                  <FR label="PV vaca adulta" value={form.pvVacaAdulta ? `${form.pvVacaAdulta} kg` : null} />
                  <FR label="% Reposición"   value={form.pctReposicion ? `${form.pctReposicion}%` : null} />
                </div>
              </details>

              <details open style={{ borderBottom:`1px solid ${C.border}` }}>
                <summary style={secSum}>CICLO REPRODUCTIVO</summary>
                <div style={{ padding:"4px 14px 10px" }}>
                  <FR label="Inicio servicio"   value={form.iniServ} />
                  <FR label="Fin servicio"       value={form.finServ} />
                  <FR label="Preñez ingresada"   value={form.prenez ? `${form.prenez}%` : null} />
                  <FR label="CC hoy (prom.)"     value={ccHoy?.toFixed(2)} />
                  <FR label="Fecha CC"           value={form.fechaCC} />
                  <FR label="Estado reproductivo" value={form.eReprod} />
                  {form.ccAnterior && (
                    <FR label="CC anterior" value={`${form.ccAnterior}${form.fechaCCAnterior ? ` (${form.fechaCCAnterior})` : ""}`} />
                  )}
                </div>
              </details>

              <details open style={{ borderBottom:`1px solid ${C.border}` }}>
                <summary style={secSum}>FORRAJE</summary>
                <div style={{ padding:"4px 14px 10px" }}>
                  <FR label="Superficie"   value={form.supHa ? `${form.supHa} ha` : null} />
                  <FR label="Vegetación"   value={form.vegetacion} />
                  <FR label="Fenología"    value={form.fenologia} />
                  <FR label="% Monte"      value={form.pctMonte ? `${form.pctMonte}%` : null} />
                  {form.tieneVerdeo === "si"
                    ? <>
                        <FR label="Verdeo" value={`${form.verdeoTipo}${form.verdeoHa ? ` · ${form.verdeoHa} ha` : ""}`} />
                        <FR label="Disponible desde" value={form.verdeoDisp} />
                      </>
                    : <FR label="Verdeo" value={null} />
                  }
                </div>
              </details>

              <details>
                <summary style={secSum}>SUPLEMENTO</summary>
                <div style={{ padding:"4px 14px 10px" }}>
                  <FR label="Vacas"  value={suplCat("supl_vacas","dosis_vacas") || suplCat("supl1","dosis1")} />
                  <FR label="Vaq1"   value={suplCat("supl_vaq1","dosis_vaq1")} />
                  <FR label="Vaq2"   value={suplCat("supl_vaq2","dosis_vaq2")} />
                  <FR label="Toros"  value={suplCat("supl_toros","dosis_toros")} />
                </div>
              </details>
            </div>
          </div>

          {/* BLOQUE 3 — Gráficos */}
          <div>
            {motor && <GraficosBalance form={form} sat={sat} cadena={cadena} tray={tray} motor={motor} usaPotreros={usaPotreros} potreros={potreros} />}
          </div>
        </div>

        {/* ── Botón plan de acción ── */}
        {motor && (
          <div style={{ marginTop:32, padding:"18px 20px",
            background:C.green+"0E", border:`1px solid ${C.green}30`,
            borderRadius:12, display:"flex", alignItems:"center",
            justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
            <div>
              <div style={{ fontFamily:C.font, fontSize:12, color:C.green, fontWeight:600, marginBottom:3 }}>
                ¿Querés el plan de acción completo?
              </div>
              <div style={{ fontFamily:C.fontSans, fontSize:11, color:C.textDim, lineHeight:1.5 }}>
                El paso siguiente genera el análisis IA con planes de acción, dosis y cronograma.
              </div>
            </div>
            <button onClick={() => { setStep(5); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              style={{ padding:"10px 22px", borderRadius:8, cursor:"pointer",
                background:C.green, border:"none",
                fontFamily:C.font, fontSize:12, fontWeight:700, color:"#fff",
                flexShrink:0 }}>
              Ver Plan de acción →
            </button>
          </div>
        )}
      </div>
    );
  };
  const renderRecomendaciones = () => (
    <div className="reco-grid">
      <div className="diag-sticky">
        {/* Cerebro estructurado (cálculo local) */}
        <TabCerebro motor={motor} form={form} sat={sat} potreros={potreros} />
      </div>

      <div>
      {/* Diagnóstico cerebro */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 18px" }}>
        <div style={{ fontFamily:C.font, fontSize:11, color:C.textDim, letterSpacing:1, marginBottom:12 }}>
          DIAGNÓSTICO — análisis algorítmico del sistema
        </div>
        {!cerebroResult && !loading && !result && (
          <button onClick={runAnalysis} style={{
            width:"100%", padding:"14px", borderRadius:10, cursor:"pointer",
            background:C.green, border:"none",
            fontFamily:C.font, fontSize:13, fontWeight:700, color:"#fff",
          }}>
            Generar diagnóstico
          </button>
        )}
        {loading && <LoadingPanel msg={loadMsg} />}
        {result && result.startsWith("❌") && (
          <div style={{ background:C.red+"10", border:`1px solid ${C.red}40`,
            borderRadius:10, padding:"16px 18px", textAlign:"center" }}>
            <div style={{ fontFamily:C.fontSans, fontSize:13, color:C.red, marginBottom:12, lineHeight:1.5 }}>
              {result.replace("❌ ", "")}
            </div>
            <button onClick={runAnalysis} style={{
              padding:"9px 20px", borderRadius:8, cursor:"pointer",
              background:C.green, border:"none",
              fontFamily:C.font, fontSize:12, fontWeight:700, color:"#fff",
            }}>
              Reintentar
            </button>
          </div>
        )}
        {form.zona && form.zona !== "NEA" && (
          <div style={{ background:`#e8a03018`, border:`1px solid #e8a03060`, borderRadius:10,
            padding:"10px 14px", fontFamily:C.fontSans, fontSize:12, color:"#e8a030", marginBottom:4 }}>
            ⚠ Sistema calibrado para NEA/Chaco — los resultados para otras zonas son orientativos y requieren validación local.
          </div>
        )}
        {cerebroResult && (
          <>
            <PanelInformeCerebro cb={cerebroResult} C={C} confianza={confianza} />
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

            {/* Bibliografía opcional vía Claude */}
            <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:8 }}>
                RESPALDO BIBLIOGRÁFICO (opcional)
              </div>
              <div style={{ fontFamily:C.fontSans, fontSize:10.5, color:C.textDim,
                background:C.card2, borderRadius:8, padding:"7px 12px", marginBottom:8,
                borderLeft:`3px solid ${C.textDim}` }}>
                ⚠ Las citas son generadas por IA y pueden contener errores o referencias inexistentes. Verificar toda fuente antes de usar en informes técnicos.
              </div>
              {!biblioResult && !biblioLoading && (
                <button onClick={runBiblio} style={{
                  width:"100%", padding:"10px", borderRadius:10, cursor:"pointer",
                  background:"transparent", border:`1px solid ${C.border}`,
                  fontFamily:C.font, fontSize:11, color:C.textDim,
                }}>
                  Consultar evidencia científica con Claude
                </button>
              )}
              {biblioLoading && (
                <div style={{ fontFamily:C.fontSans, fontSize:12, color:C.textDim, padding:"10px 0", textAlign:"center" }}>
                  Consultando literatura...
                </div>
              )}
              {biblioResult && !biblioResult.startsWith("❌") && (
                <details open style={{ marginTop:6 }}>
                  <summary style={{ fontFamily:C.font, fontSize:10, color:C.textDim,
                    cursor:"pointer", padding:"8px 12px", background:C.card2,
                    borderRadius:8, border:`1px solid ${C.border}`,
                    listStyle:"none", display:"flex", alignItems:"center",
                    justifyContent:"space-between" }}>
                    <span>Evidencia científica — Claude Sonnet</span>
                    <span>&#9660;</span>
                  </summary>
                  <div style={{ marginTop:6 }}>
                    <RenderInforme texto={biblioResult} />
                  </div>
                </details>
              )}
              {biblioResult && biblioResult.startsWith("❌") && (
                <div style={{ fontFamily:C.fontSans, fontSize:11, color:C.red, marginTop:6 }}>
                  {biblioResult}
                </div>
              )}
            </div>

            <button onClick={runAnalysis} style={{
              marginTop:10, width:"100%", padding:10, borderRadius:10,
              cursor:"pointer", background:"transparent",
              border:`1px solid ${C.border}`,
              fontFamily:C.font, fontSize:11, color:C.textDim,
            }}>
              Actualizar diagnóstico
            </button>
          </>
        )}
      </div>
      {/* ── Sección de descarga ── */}
      {motor && (
        <div style={{ marginTop:20, background:C.card2, border:`1px solid ${C.border}`,
          borderRadius:12, padding:"16px 18px" }}>
          <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:12 }}>
            EXPORTAR INFORME
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <button onClick={descargarPDF} style={{
              flex:1, minWidth:140, padding:"12px 16px", borderRadius:10, cursor:"pointer",
              background:C.green+"18", border:`1px solid ${C.green}40`,
              fontFamily:C.font, fontSize:12, color:C.green, fontWeight:600,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
              📄 Descargar PDF
              <span style={{ fontFamily:C.fontSans, fontSize:10, color:C.textDim, fontWeight:400 }}>informe técnico A4</span>
            </button>
            <button onClick={descargarExcel} style={{
              flex:1, minWidth:140, padding:"12px 16px", borderRadius:10, cursor:"pointer",
              background:C.blue+"18", border:`1px solid ${C.blue}40`,
              fontFamily:C.font, fontSize:12, color:C.blue, fontWeight:600,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}>
              📊 Descargar Excel
              <span style={{ fontFamily:C.fontSans, fontSize:10, color:C.textDim, fontWeight:400 }}>hoja única consolidada</span>
            </button>
          </div>
        </div>
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
      <div style={{ marginBottom:48, textAlign:"center" }}>
        <div style={{ fontFamily:C.font, fontSize:13, color:C.textFaint, letterSpacing:4, marginBottom:16, textTransform:"uppercase" }}>Diagnóstico bovino</div>
        <div style={{ fontFamily:C.font, fontSize:42, color:C.green, letterSpacing:6, fontWeight:700, lineHeight:1 }}>CALF AI</div>
        <div style={{ width:48, height:2, background:C.green+"44", margin:"16px auto 0" }} />
      </div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"32px 40px", textAlign:"center", boxShadow:C.sh.lg }}>
        <div style={{ fontFamily:C.sans, fontSize:14, color:C.textDim, marginBottom:24, lineHeight:1.6 }}>
          Ingresá con tu cuenta institucional para<br/>acceder al sistema de diagnóstico
        </div>
        <button onClick={()=>signIn("google")} style={{
          background:C.green, color:C.card, padding:"13px 32px", borderRadius:10,
          border:"none", fontFamily:C.sans, fontSize:14, fontWeight:700, cursor:"pointer",
          letterSpacing:".3px", boxShadow:`0 4px 16px ${C.green}44`,
        }}>
          Iniciar sesión con Google
        </button>
        <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint, marginTop:20 }}>
          AgroMind Pro · v2025
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html { color-scheme: dark; }

        /* ── Inputs y selects — dark theme ─────────────────────────── */
        select, input[type=text], input[type=number], input[type=date], textarea {
          background: #1a2a16 !important;
          color: #d6e8d0 !important;
          border: 1px solid #253b1f !important;
          border-radius: 8px;
        }
        select option { background: #1a2a16; color: #d6e8d0; }
        select:focus, input[type=text]:focus, input[type=number]:focus,
        input[type=date]:focus, textarea:focus {
          outline: 2px solid #5cb83a !important;
          outline-offset: 1px;
          border-color: #3c5c34 !important;
        }
        select:hover, input[type=text]:hover, input[type=number]:hover,
        input[type=date]:hover {
          border-color: #3c5c34 !important;
        }

        /* ── Scrollbar ──────────────────────────────────────────────── */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0d1a0b; }
        ::-webkit-scrollbar-thumb { background: #3c5c34; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #5cb83a; }
        * { scrollbar-width: thin; scrollbar-color: #3c5c34 #0d1a0b; }

        /* ── Botones ────────────────────────────────────────────────── */
        button { transition: opacity .14s, transform .1s, background .14s, box-shadow .14s; }
        button:hover:not(:disabled) { opacity: .88; }
        button:active:not(:disabled) { transform: scale(0.97); }
        button:disabled { opacity: .4; cursor: not-allowed; }

        /* ── Range inputs ───────────────────────────────────────────── */
        input[type=range] { accent-color: #5cb83a; }
        input[type=range]::-webkit-slider-thumb { width: 18px; height: 18px; }

        /* ── Details/summary ────────────────────────────────────────── */
        details > summary::-webkit-details-marker { display: none; }
        details > summary { cursor: pointer; }

        /* ── Animaciones de step ────────────────────────────────────── */
        .calfai-step { animation: stepIn .18s ease-out; }
        @keyframes stepIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

        /* ── Toast ─────────────────────────────────────────────────── */
        @keyframes toastIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }

        /* ── Tabs scrollbar oculto ──────────────────────────────────── */
        .calfai-tabs::-webkit-scrollbar { display: none; }
        .calfai-tabs { -ms-overflow-style: none; scrollbar-width: none; }

        /* ── Layout grids ───────────────────────────────────────────── */
        .diag-grid { display: grid; gap: 0; }
        @media (min-width: 1200px) {
          .diag-grid { grid-template-columns: 440px 1fr; gap: 32px; align-items: start; }
          .diag-sticky { position: sticky; top: 80px; max-height: calc(100vh - 100px); overflow-y: auto; scrollbar-width: thin; }
        }
        .reco-grid { display: grid; gap: 0; }
        @media (min-width: 1200px) {
          .reco-grid { grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
        }

        /* ── Checkbox ───────────────────────────────────────────────── */
        input[type=checkbox] { accent-color: #5cb83a; width: 14px; height: 14px; }
      `}</style>

      {/* Header sticky */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:50, boxShadow:C.sh.sm }}>
        <div style={{ maxWidth:1400, margin:"0 auto", padding:"12px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:C.font, fontSize:15, color:C.green, letterSpacing:3, fontWeight:700, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:18 }}>◈</span>
            CALF AI<span style={{ color:C.textFaint, fontSize:10, marginLeft:8, letterSpacing:1, fontWeight:400 }}>diagnóstico bovino</span>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {ccPondVal > 0 && <Pill color={smf(ccPondVal,4.5,5.5)}>CC {ccPondVal.toFixed(1)}</Pill>}
            {evalAgua && evalAgua.cat.riesgo >= 2 && <Pill color={C.red}>Agua: {evalAgua.cat.label}</Pill>}
            {sanidad?.alerts?.length > 0 && <Pill color={C.red}>Sanidad: {sanidad.alerts.length} alertas</Pill>}
            {form.nombreProductor && <span style={{ fontFamily:C.font, fontSize:10, color:C.textDim }}>{form.nombreProductor}</span>}
            <button onClick={()=>signOut()} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textDim, padding:"5px 10px", fontFamily:C.font, fontSize:10, cursor:"pointer" }}>
              Salir
            </button>
            <span style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, border:`1px solid ${C.border}60`, padding:"2px 7px", borderRadius:4, letterSpacing:.4 }}>← → 1-6</span>
            {motor && (
              <>
                <button onClick={descargarExcel}
                  title="Descargar Excel con todos los datos"
                  style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:8,
                    padding:"6px 11px", fontFamily:C.font, fontSize:10, cursor:"pointer",
                    color:C.textDim, display:"flex", alignItems:"center", gap:4 }}>
                  📊 Excel
                </button>
                <button onClick={descargarPDF}
                  title="Descargar informe PDF"
                  style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:8,
                    padding:"6px 11px", fontFamily:C.font, fontSize:10, cursor:"pointer",
                    color:C.textDim, display:"flex", alignItems:"center", gap:4 }}>
                  📄 PDF
                </button>
              </>
            )}
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
        <div className="calfai-tabs" style={{ maxWidth:1400, margin:"0 auto", display:"flex", overflowX:"auto", borderTop:`1px solid ${C.border}`, padding:"0 20px", alignItems:"stretch" }}>
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
            const secLabel = i === 0 ? "DATOS" : i === 4 ? "RESULTADOS" : null;
            return (
              <React.Fragment key={i}>
                {secLabel && (
                  <div style={{ display:"flex", alignItems:"center", paddingLeft: i === 0 ? 0 : 10,
                    marginLeft: i === 0 ? 0 : 6, borderLeft: i === 0 ? "none" : `1px solid ${C.border}` }}>
                    <span style={{ fontFamily:C.font, fontSize:8, color:C.textFaint,
                      letterSpacing:1.5, whiteSpace:"nowrap" }}>
                      {secLabel}
                    </span>
                  </div>
                )}
                <button onClick={() => { setStep(i); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{
                  flex:"0 0 auto", padding:"13px 18px",
                  background: active ? C.green+"16" : "none", border:"none",
                  borderBottom: active ? `2px solid ${C.green}` : "2px solid transparent",
                  color: active ? C.green : C.textDim,
                  fontFamily:C.font, fontSize:13,
                  fontWeight: active ? 600 : 400,
                  cursor:"pointer", whiteSpace:"nowrap",
                  position:"relative", letterSpacing: active ? ".3px" : 0,
                  transition:"background .15s, color .15s",
                }}>
                  <span style={{ opacity:0.45, fontSize:10, marginRight:5, fontWeight:400 }}>{i+1}</span>
                  {p.label}
                  {dotColor && !active && (
                    <span style={{ position:"absolute", top:6, right:8,
                      width:6, height:6, borderRadius:3, background:dotColor }} />
                  )}
                </button>
              </React.Fragment>
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
            <button aria-label="Descartar aviso" onClick={() => setBorradorRecuperado(false)}
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
            <div style={{ fontFamily:C.font, fontSize:11, color:C.textDim, marginTop:2 }}>
              {bannerProductor.campos} campos precargados desde el formulario del productor · Revisá y completá lo que falta
            </div>
          </div>
          <button aria-label="Cerrar aviso" onClick={() => setBannerProductor(null)}
            style={{ background:"none", border:"none", color:C.textFaint,
              cursor:"pointer", fontSize:16, flexShrink:0, padding:"0 4px" }}>✕</button>
        </div>
      )}

      {/* Contenido del paso */}
      <div style={{ maxWidth:1400, margin:"0 auto", padding:"32px 28px 64px" }}>
        <div key={step} className="calfai-step">
          {RENDERS[step]?.()}
        </div>
      </div>

      {/* Toast notifications */}
      <Toast toasts={toasts} />
    </div>
  );
}
