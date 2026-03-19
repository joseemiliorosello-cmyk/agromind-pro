"use client";

// ═══════════════════════════════════════════════════════════════════
// pages/index.js — Calf AI
// Componente principal — importa todo de lib/ y components/
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from "react";
import { useSession, signOut, signIn, SessionProvider } from "next-auth/react";
import { T as C, FORM_DEF, MESES_NOM } from "../lib/constantes";
import { correrMotor, useMotor, calcCadena, calcConsumoAgua,
         calcDisp, diagnosticarSistema } from "../lib/motor";
import { calcCerebro, buildPromptFull, SYS_FULL } from "../lib/cerebro";
import { usePersistencia, PanelHistorial } from "../lib/persistencia";
import { Pill, Alerta, smf, smf2 } from "../components/ui";
import { DashboardEstablecimiento, ScoreRadar } from "../components/dashboard";
import { getPasoRenders } from "../components/pasos";

// ─── PASOS DE NAVEGACIÓN ─────────────────────────────────────────
const PASOS = [
  { id:"campo",    icon:"🐄", label:"Rodeo y CC"  },  // Ubicación + Rodeo + CC
  { id:"rodeo",    icon:"🌾", label:"El campo"    },  // Forraje + Suplementación + Categorías
  { id:"manejo",   icon:"🩺", label:"Sanidad"     },  // Sanidad
  { id:"analisis", icon:"⚡", label:"Análisis"    },  // Dashboard + Balance + Cerebro
];

// ─── CONFIANZA DEL DIAGNÓSTICO ───────────────────────────────────
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
  };

  // ── EFECTO: fetch satelital ────────────────────────────────────
  // Usa GPS si disponible; si no, usa centroide de la provincia seleccionada
  // → el clima llega siempre que el usuario haya elegido provincia
  useEffect(() => {
    const refCoords = coords || (form.provincia ? COORDS_PROV[form.provincia] : null);
    if (!refCoords) return;
    setSat(null);
    fetchSat(refCoords.lat, refCoords.lon, form.zona || "NEA", form.provincia, form.enso, setSat);
  }, [coords, form.enso, form.zona, form.provincia]);

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
  function buildPromptFull() {
    const hoy = new Date().toLocaleDateString("es-AR", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
    let t = "ANÁLISIS — " + hoy + "\n";

    // ── MARCADORES DE DATOS REALES vs ESTIMADOS ──────────────────
    // La IA debe saber qué datos son reales y cuáles son defaults del sistema
    t += "\n=== DATOS REALES INGRESADOS POR EL USUARIO ===\n";
    const reales = [];
    if (form.provincia)      reales.push("Provincia: " + form.provincia);
    if (form.biotipo)        reales.push("Biotipo: " + form.biotipo);
    if (form.vacasN)         reales.push("Vacas: " + form.vacasN + " cab");
    if (form.torosN)         reales.push("Toros: " + form.torosN + " cab");
    if (form.pvVacaAdulta)   reales.push("PV adulto: " + form.pvVacaAdulta + " kg (REAL)");
    if (form.supHa)          reales.push("Superficie: " + form.supHa + " ha (REAL)");
    if (form.iniServ && form.finServ) reales.push("Servicio: " + form.iniServ + " → " + form.finServ + " (REAL)");
    if (form.prenez)         reales.push("Preñez histórica: " + form.prenez + "% (REAL)");
    if (form.pctDestete)     reales.push("% Destete: " + form.pctDestete + "% (REAL)");
    if (form.torosCC)        reales.push("CC toros: " + form.torosCC + " (REAL - escala 1-9)");
    if ((parseFloat(form.destTrad)||0) + (parseFloat(form.destAntic)||0) + (parseFloat(form.destHiper)||0) > 0) {
      reales.push("Destete: " + (form.destTrad||0) + "% trad / " + (form.destAntic||0) + "% antic / " + (form.destHiper||0) + "% hiper (REAL)");
    }
    if (form.supl_vacas || form.supl1)  reales.push("Suplemento vacas: " + (form.supl_vacas||form.supl1) + " " + (form.dosis_vacas||form.dosis1||0) + "kg/d (REAL)");
    if (form.supl_vaq1)  reales.push("Suplemento Vaq1: " + form.supl_vaq1 + " " + (form.dosis_vaq1||0) + "kg/d (REAL)");
    if (form.supl_vaq2)  reales.push("Suplemento Vaq2: " + form.supl_vaq2 + " " + (form.dosis_vaq2||0) + "kg/d (REAL)");
    if (form.vaq1PV)     reales.push("PV Vaq1: " + form.vaq1PV + " kg (REAL - pesado en campo)");
    if (form.edadVaqMayo) reales.push("Edad Vaq1 en mayo: " + form.edadVaqMayo + " meses (REAL)");
    if (form.vaq2N)      reales.push("Vaq2: " + form.vaq2N + " cab (REAL)");
    if (form.v2sN)       reales.push("V2S: " + form.v2sN + " cab (REAL)");
    t += reales.length > 0 ? reales.join(" | ") + "\n" : "— ningún dato confirmado por el usuario —\n";

    t += "\n=== DATOS ESTIMADOS POR EL SISTEMA (NO ingresados por usuario) ===\n";
    const estimados = [];
    if (!form.pvVacaAdulta)  estimados.push("PV adulto: 320 kg (default NEA)");
    if (!form.supHa)         estimados.push("Superficie: no cargada — balance usa consumo voluntario");
    if (!form.prenez)        estimados.push("Preñez histórica: no cargada");
    if (!form.torosCC)       estimados.push("CC toros: no registrada");
    if ((parseFloat(form.destTrad)||0)+(parseFloat(form.destAntic)||0)+(parseFloat(form.destHiper)||0) === 0) {
      estimados.push("Destete: no cargado — motor usa Tradicional 100% como escenario base");
    }
    if (!form.vaq1PV)        estimados.push("PV Vaq1: estimado desde edad y biotipo, no pesado en campo");
    if (!form.supl_vacas && !form.supl1) estimados.push("Suplemento vacas: no cargado");
    if (!form.supl_vaq1)     estimados.push("Suplemento Vaq1: no cargado");
    t += estimados.length > 0 ? estimados.join(" | ") + "\n" : "— todos los datos fueron ingresados —\n";
    t += "\n";
    // Score sistémico del motor
    if (motor) {
      t += "SCORE SISTÉMICO: " + scoreRiesgo + "/100 (riesgo " + nivelRiesgo.toUpperCase() + ")\n";
      // Score nuevo por dimensiones
      const sc = calcScore(motor, form, null);
      if (sc) {
        t += "SCORE DIAGNÓSTICO TOTAL: " + sc.total + "/100 — " + sc.labelTotal + "\n";
        sc.dim.forEach(d => {
          t += "  · " + d.nombre + ": " + d.score + "/100 — " + d.descripcion + "\n";
        });
      }
      if (alertasMotor.length > 0) {
        t += "ALERTAS MOTOR (" + alertasMotor.length + "): " + alertasMotor.map(a=>a.tipo+": "+a.msg.slice(0,60)).join(" | ") + "\n";
      }
      if (cargaEV_ha) t += "CARGA REAL: " + cargaEV_ha + " EV/ha (factor oferta: " + motor.factorCarga + ")\n";
      // Diagnóstico de sustentabilidad — lo más importante para el cerebro
      const cerebTemp = calcCerebro(motorEfectivo || motor, form, sat);
      if (cerebTemp?.diagnosticoSustentabilidad) {
        const dx = cerebTemp.diagnosticoSustentabilidad;
        t += `\nDIAGNÓSTICO SUSTENTABILIDAD:\n`;
        t += `  ${dx.resumen}\n`;
        if (dx.ciclosAlColapso) t += `  ⏱ CICLOS AL COLAPSO SIN CORRECCIÓN: ${dx.ciclosAlColapso} (erosión CC: ${dx.erosionCCAnual}/año por déficit invernal)\n`;
        t += `  Preñez sustentable sin corrección: ${dx.prenezSustentable}% (meta: 75%)\n`;
        if (dx.factoresLimitantes?.length > 0) {
          t += `  Factores limitantes:\n`;
          dx.factoresLimitantes.forEach(f => t += `    · ${f}\n`);
        }
        // Cronograma temporal
        if (cerebTemp.cronograma?.length > 0) {
          t += `\nCRONOGRAMA TEMPORAL MES A MES:\n`;
          cerebTemp.cronograma.forEach(m => {
            if (m.riesgos?.length > 0) {
              t += `  ${m.mes}: ${m.riesgos.map(r => r.label).join(" · ")} (bal:${Math.round(m.bal)}M/d PB:${m.pbPas}%)\n`;
            }
          });
        }
      }
      if (motor.factorAgua < 1) t += "FACTOR AGUA: " + motor.factorAgua.toFixed(2) + " (agua salobre reduce oferta efectiva)\n";
      if (motor.verdeoAporteMcalMes > 0) t += "VERDEO APORTE: +" + motor.verdeoAporteMcalMes + " Mcal/día rodeo desde mes " + (motor.verdeoMesInicio+1) + "\n";
    }

    const locStr = [form.localidad, form.provincia, form.zona].filter(Boolean).join(" · ");
    if (coords) t += "UBICACIÓN: " + coords.lat?.toFixed(4) + "°S " + coords.lon?.toFixed(4) + "°W · " + locStr + "\n";
    else if (locStr) t += "UBICACIÓN: " + locStr + " (sin GPS)\n";
    if (sat?.temp) {
      t += "MET REAL: T" + sat.temp + "°C (Mx" + sat.tMax + "/Mn" + sat.tMin + ") · P7d:" + sat.p7 + "mm P30d:" + sat.p30 + "mm · Bal:" + (sat.deficit>0?"+":"") + sat.deficit + "mm · NDVI:" + sat.ndvi + "(" + sat.condForr + ")\n";
      if (sat.pronostico?.length > 0) {
        t += "PRONÓSTICO 7D: " + sat.pronostico.map(d => d.dia + " " + d.tMax + "/" + d.tMin + "°C" + (d.lluvia > 2 ? "+" + d.lluvia + "mm" : "")).join(" · ") + "\n";
        if (sat.helada7) t += "⚠ HELADA PROBABLE próximos 7 días — riesgo terneros recién nacidos\n";
        if (sat.lluviaProx7 > 30) t += "Lluvia acumulada próximos 7 días: " + sat.lluviaProx7 + "mm\n";
      }
    }

    t += "ENSO: " + (form.enso==="nino"?"El Niño +25%":form.enso==="nina"?"La Niña −25%":"Neutro") + " · BIOTIPO: " + (form.biotipo||"Brangus 3/8") + "\n";
    if (dispar) t += "DISPARADOR C4: " + (dispar.dias===0?"⛔ Invierno activo — C4 restringido":dispar.dias+" días hasta temp <15°C") + "\n";

    if (cadena) {
      t += `\nCRONOLOGÍA:\n`;
      t += `  Parto temp: ${fmtFecha(cadena.partoTemp)} (en ${cadena.diasPartoTemp}d)\n`;
      t += `  Parto tard: ${fmtFecha(cadena.partoTard)} · Destete temp: ${fmtFecha(cadena.desteTemp)} · Destete tard: ${fmtFecha(cadena.desteTard)}\n`;
      if (cadena.terneroOtono) t += `  ⚠️ ALERTA: Ternero al pie en otoño\n`;
    }

    if (sat && form.pvVacaAdulta && form.fenologia) {
      const cons = calcConsumoPasto(form.pvVacaAdulta, form.fenologia, sat.temp);
      t += `CONSUMO VOLUNTARIO: ${form.fenologia} → ${cons.kgMs}kg MS/d · Dig ${cons.dig}% · PB ${cons.pb}% · ${cons.emTotal} Mcal/v/d\n`;
    }

    t += `\nRODEO: ${form.vacasN||"—"} vacas · ${form.torosN||"—"} toros · PV ${form.pvVacaAdulta||"—"}kg`;
    t += ` · Preñez hist ${form.prenez||"—"}% · Dest ${form.pctDestete||"—"}%\n`;
    t += `Estado reprod: ${form.eReprod||"—"}${form.primerParto?" · ⚠️ Incluye vacas 1° parto":""}\n`;
    t += `Superficie: ${form.supHa||"—"} ha · Carga: ${form.vacasN&&form.supHa?(parseFloat(form.vacasN)/parseFloat(form.supHa)).toFixed(2):"—"} EV/ha\n`;

    const totalEV_p = (parseInt(form.vacasN)||0) + (parseInt(form.torosN)||0)*1.4 +
      (parseInt(form.vaq2N)||0)*0.7 + (parseInt(form.v2sN)||0)*0.9 +
      Math.round((parseInt(form.vacasN)||0)*(parseFloat(form.pctReposicion)||20)/100)*0.4;
    const haGan_p = parseFloat(form.supHa)||0;
    const cargaT  = haGan_p > 0 ? (totalEV_p/haGan_p).toFixed(2) : "—";
    t += `Carga ganadera real: ${cargaT} EV/ha (${Math.round(totalEV_p)} EV totales en ${haGan_p||"—"} ha)\n`;
    if (parseFloat(cargaT) > 1.0) t += `  ⚠️ Carga elevada — mayor presión sobre oferta forrajera invernal\n`;
    if (usaPotreros && potreros?.length) {
      const haTotal_p = potreros.reduce((s,p) => s+(parseFloat(p.ha)||0), 0);
      t += `POTREROS (${potreros.length}, total ${haTotal_p}ha):\n`;
      potreros.forEach((p, i) => {
        const disp_p = calcDisponibilidadMS(form.altPasto||"20", form.tipoPasto||"alto_denso");
        t += `  P${i+1}: ${p.ha||"—"}ha · ${p.veg} · ${p.fenol||"—"} · ~${disp_p.msHa||"—"}kgMS/ha\n`;
      });
    } else {
      const disp_p = calcDisponibilidadMS(form.altPasto, form.tipoPasto);
      t += `Vegetación: ${form.vegetacion||"—"} · Fenología: ${form.fenologia||"—"}`;
      if (disp_p.msHa) t += ` · Disponibilidad: ${disp_p.msHa}kgMS/ha (${disp_p.nivel})`;
      t += "\n";
    }

    if (evalAgua) {
      t += `\nAGUA (López et al. 2021): TDS ${evalAgua.tdsN} mg/L (${evalAgua.cat.label}) · ${form.aguaTipoSal}\n`;
      if (evalAgua.pctReducDMI > 0) t += `  ⚠️ DMI −${evalAgua.pctReducDMI.toFixed(0)}% · Consumo agua −${evalAgua.pctReducWI.toFixed(0)}%\n`;
    } else {
      t += `AGUA: Sin análisis TDS cargado\n`;
    }

    t += `\nSANIDAD:\n`;
    t += `  Aftosa: ${form.sanAftosa==="si"?"✅":"⚠️ Sin vacunar"} · Brucelosis: ${form.sanBrucelosis==="si"?"✅":"⚠️ Sin vacunar"} · IBR/DVB: ${form.sanVacunas==="si"?"✅":"⚠️ Sin vacunar"}\n`;
    t += "  Rev. toros: " + (form.sanToros==="con_control"?"✅":"⚠️ Sin revisión") + " · Abortos: " + (form.sanAbortos==="si"?"⚠️ Sí":"No") + " · Programa: " + (form.sanPrograma==="si"?"✅":"⚠️ No") + "\n";

    if (tray) {
      t += `\nTRAYECTORIA CC (rodeo promedio):\n`;
      t += `  HOY:${tray.ccHoy} → PARTO:${tray.ccParto} → SERV.:${tray.ccServ} (mín lactación: ${tray.ccMinLact})\n`;
      t += `  Preñez est.: ${tray.pr}% · Anestro: ${tray.anestro?.dias}d (${tray.anestro?.riesgo?"⚠️ riesgo":"✅ ok"}) · Caída lactación: −${tray.caidaLact} CC en ${tray.mesesLact} meses\n`;
      if (tray.recDestete) {
        t += `  RECOMENDACIÓN DESTETE: ${tray.recDestete.label} (${tray.recDestete.urgencia})\n`;
        if (tray.ccServAntic) t += `  CC serv. con anticipado: ${tray.ccServAntic} → preñez ${tray.prAntic}% (+${(tray.prAntic-tray.pr)||0}pp)\n`;
        if (tray.ccServHiper) t += `  CC serv. con hiperprecoz: ${tray.ccServHiper} → preñez ${tray.prHiper}% (+${(tray.prHiper-tray.pr)||0}pp)\n`;
      }
      t += `  Escenarios CC servicio: actual ${tray.ccServ} · con anticipado ${tray.ccServAntic||"—"} · con hiperprecoz ${tray.ccServHiper||"—"}\n`;
      t += `  Preñez escenarios: actual ${tray.pr}% · anticipado ${tray.prAntic||"—"}% · hiperprecoz ${tray.prHiper||"—"}%\n`;
      if (tray.recDestete) t += `  RECOMENDACIÓN DESTETE: ${tray.recDestete.label} — ${tray.recDestete.motivo||""}\n`;
    }

    // Suplementación por categoría
    const SUPL_CATS_PROMPT = [
      ["Vacas rodeo gral",  "supl_vacas",  "dosis_vacas"],
      ["Vaca 2° servicio",  "supl_v2s",    "dosis_v2s"],
      ["Toros",             "supl_toros",  "dosis_toros"],
      ["Vaq 2° inv.",       "supl_vaq2",   "dosis_vaq2"],
      ["Vaq 1° inv.",       "supl_vaq1",   "dosis_vaq1"],
      ["Ternero (destete)", "supl_ternero","dosis_ternero"],
    ];
    const suplLines = SUPL_CATS_PROMPT.filter(([,sk]) => form[sk])
      .map(([cat, sk, dk]) => {
        const d     = parseFloat(form[dk]) || 0;
        const m     = mcalSuplemento(form[sk], d).toFixed(1);
        const sInfo = SUPLEMENTOS[form[sk]];
        const pvMap = {
          supl_vacas:    parseFloat(form.pvVacaAdulta)||320,
          supl_v2s:      parseFloat(form.v2sPV)||(parseFloat(form.pvVacaAdulta)||320)*0.88,
          supl_toros:    parseFloat(form.pvToros)||(parseFloat(form.pvVacaAdulta)||320)*1.3,
          supl_vaq2:     parseFloat(pvEntradaVaq2)||Math.round((parseFloat(form.pvVacaAdulta)||320)*0.65),
          supl_vaq1:     parseFloat(form.vaq1PV)||Math.round((parseFloat(form.pvVacaAdulta)||320)*0.40),
          supl_ternero:  tcSave?.pvMayoPond||80,
        };
        const pv       = pvMap[sk] || 1;
        const pctPV    = ((d/pv)*100).toFixed(2);
        const pbDia    = sInfo ? Math.round((sInfo.pb/100)*d*1000) : 0;
        const tipo     = sInfo ? (sInfo.em >= 3.0 ? "Energético" : sInfo.pb >= 30 ? "Proteico" : "Energ-Prot.") : "—";
        const freq     = sInfo?.em >= 3.0 ? "Diario (almidón)" : "2–3×/semana";
        return `  ${cat}: ${form[sk]} (${tipo}) · ${d}kg/d · ${m}Mcal/d · PB:${pbDia}g/d · ${pctPV}%PV · ${freq}`;
      });
    if (suplLines.length > 0) t += `\nSUPLEMENTACIÓN POR CATEGORÍA:\n${suplLines.join("\n")}\n`;
    const mesesNom = {3:"Abr",4:"May",5:"Jun",6:"Jul",7:"Ago",8:"Sep",9:"Oct",10:"Nov"};
    const suplMesesStr = (form.suplMeses||["5","6","7"]).map(m=>mesesNom[Number(m)]||m).join("-");
    if (suplMesesStr) t += `\nCAMPAÑA SUPLEMENTACIÓN: ${suplMesesStr} (${form.suplMeses?.length||3} meses)\n`;
    if (form.sanParasitoExt || form.sanParasitoInt) {
      t += `Parásitos externos: ${form.sanParasitoExt||"no controlados"} · Internos: ${form.sanParasitoInt||"no controlados"}\n`;
    }

    // TOROS preparo de servicio
    if (form.torosCC) {
      const ccT = parseFloat(form.torosCC);
      const nT  = parseInt(form.torosN)||1;
      const nV  = parseInt(form.vacasN)||0;
      const relAT = nV&&nT ? Math.round(nV/nT) : 0;
      t += `\nTOROS CC: ${form.torosCC} · Lotes: ${form.torosLote==="distribuidos"?(form.torosLotes||"varios")+" lotes":"1 lote con vacas"} · T:V: ${relAT}:1\n`;
      if (ccT < 5.0) t += `  ⚠ Suplementar toros para llegar CC 5.5 al servicio\n`;
      if (relAT > 30) t += `  ⚠ Relación T:V > 30:1 — riesgo vacas no servidas\n`;
    }
    // Verdeos
    if (form.tieneVerdeo === "si" && form.verdeoHa) {
      t += `\nVERDEOS: ${form.verdeoHa}ha ${form.verdeoTipo||""} desde ${form.verdeoDisp||"ago"} para ${form.verdeoDestinoVaq||"rodeo"}\n`;
    }
    // Stock
    if (form.stockAlim && form.stockAlim.length > 0) {
      t += `\nSTOCK: ${form.stockAlim.filter(s=>s.toneladas).map(s=>s.alimento+": "+s.toneladas+"t").join(" | ")}\n`;
    }
    // Fecha CC y visitas
    if (form.fechaCC) {
      const dias = Math.round((new Date()-new Date(form.fechaCC))/86400000);
      t += `\nCC MEDIDA: ${form.fechaCC} (${dias}d atrás)${dias>30?" ⚠ ANTIGUA":""}\n`;
    }
    if (form.visitasCampo && form.visitasCampo.length > 0) {
      t += `\nVISITAS CAMPO: ${form.visitasCampo.slice(-3).map(v=>v.fecha+" CC"+v.cc+(v.obs?" "+v.obs:"")).join(" | ")}\n`;
    }

    if (dist?.grupos?.length) {
      t += `\nCC POR GRUPO (distribución por estado corporal):\n`;
      dist.grupos.forEach(g => {
        const sv = calcSupervivencia(g.ccHoy, form.eReprod);
        t += `  CC${g.ccHoy}(${g.pct}%): →parto${g.ccParto} →serv${g.ccServ} →${g.pr}%p · anestro${g.anestro?.dias}d · ${g.urgencia} · superv.${sv.pct}%(${sv.riesgo}) · ${g.recDestete}\n`;
      });
    }

    // Disponibilidad forrajera
    if (disponMS) t += `\nDISPONIBILIDAD PASTO: ${disponMS.msHa} kgMS/ha · nivel:${disponMS.nivel} (efectivo: ${disponMS.nivelEfectivo||disponMS.nivel}) · altura:${form.altPasto||"—"}cm · tipo:${form.tipoPasto||"—"}\n`;
    // Balance mensual del motor
    if (balanceMensual.length > 0) {
      const defMeses = balanceMensual.filter(m=>m.deficit).map(m=>m.mes);
      const peorMes  = balanceMensual.reduce((a,b)=>b.balance<a.balance?b:a, balanceMensual[0]);
      t += `BALANCE MENSUAL: ${defMeses.length > 0 ? "DÉFICIT en "+defMeses.join("-") : "SIN DÉFICIT (plan cubre todo el año)"}\n`;
      if (peorMes.deficit) t += `  Peor mes: ${peorMes.mes} · déficit ${peorMes.balance.toLocaleString()} Mcal/día · oferta ${peorMes.ofPasto} · demanda ${peorMes.demanda}\n`;
      t += `  Jun: ${balanceMensual[5]?.balance>=0?"+":""}${balanceMensual[5]?.balance} · Jul: ${balanceMensual[6]?.balance>=0?"+":""}${balanceMensual[6]?.balance} · Ago: ${balanceMensual[7]?.balance>=0?"+":""}${balanceMensual[7]?.balance} Mcal/d\n`;
    }

    // Política entore
    if (form.edadPrimerEntore) t += `ENTORE 1°: ${form.edadPrimerEntore} meses · objetivo PV mínimo ${Math.round((parseFloat(form.pvVacaAdulta)||320)*0.60)}kg (60% PV adulto)\n`;

    if (tcSave) t += `TERNEROS: ${tcSave.terneros} cab · PV mayo: ${tcSave.pvMayoPond}kg${tcSave.alertaHiper?" · ⚡ Hiperprecoz >30%":""}\n`;

    t += `VAQ1: ${nVaqRepos} cab (${form.pctReposicion||20}% repos)`;
    if (form.edadVaqMayo) t += ` · Edad mayo: ${form.edadVaqMayo}m · Destete: ${form.tipoDesteteVaq}`;
    if (form.vaq1PV) {
      t += ` · PV actual REGISTRADO: ${form.vaq1PV}kg (dato real del campo)`;
    } else if (motor?.pvEntVaq1 > 0) {
      t += ` · PV entrada estimado: ${motor.pvEntVaq1}kg (calculado desde ternero — NO registrado por usuario)`;
    }
    if (vaq1E && vaq1E.esc !== "—") t += `\n  Esc${vaq1E.esc}: Prot${vaq1E.prot}kg Energ${vaq1E.energ||0}kg ${vaq1E.freq} GDP${vaq1E.gdpReal}g/d → PV${vaq1E.pvSal}kg${vaq1E.nota ? " · " + vaq1E.nota : ""}`;
    t += "\n";

    if (form.vaq2N) {
      t += `VAQ2: ${form.vaq2N} cab`;
      if (vaq2E) {
        t += ` · PV entrada 2°inv: ${vaq2E.pvMayo2Inv||"—"}kg · GDP inv: ${vaq2E.gdpInv||300}g/d (pasto solo: ${vaq2E.gdpPastoInv||"—"}g/d)`;
        t += `\n  PV agosto: ${vaq2E.pvV2Agosto||"—"}kg · PV entore: ${vaq2E.pvEntore||"—"}kg (obj ${vaq2E.pvMinEntore||"—"}kg = 75% PV adulto) ${vaq2E.llegas ? "✅" : "⚠️ NO LLEGA AL OBJETIVO"}`;
        if (vaq2E.protKg) t += `\n  Supl. invernal mín.: ${vaq2E.protKg}kg/d proteína + ${vaq2E.energKg>0?vaq2E.energKg+"kg/d energía":vaq2E.fuenteEnerg||"S.Algodón ad lib"} · ${vaq2E.freq||"—"}`;
        if (vaq2E.aptaEntoreAntic) t += `\n  🚀 ENTORE ANTICIPADO: ${vaq2E.pvV2Agosto}kg agosto = ${vaq2E.pctPVAgosto}% PV adulto ≥65% umbral → evaluar servicio agosto–nov este año. Ganancia: un ciclo productivo adelantado.`;
        if (!vaq2E.llegas) t += `\n  ⚠️ No llega al objetivo — aumentar suplementación o evaluar entore tardío`;
      }
      t += "\n";
    }

    if (form.v2sN) {
      const ccV2sPond = (form.cc2sDist || []).reduce((s,g) => s + (parseFloat(g.cc)||0)*(parseFloat(g.pct)||0), 0) /
        Math.max(1, (form.cc2sDist||[]).reduce((s,g) => s + (parseFloat(g.pct)||0), 0));
      const conTern = form.v2sTernero === "si";
      const resV2s  = calcV2S(form.v2sPV, form.pvVacaAdulta, ccV2sPond || "4.2", conTern, form.biotipo, cadena);
      t += `V2S: ${form.v2sN} cab · PV${form.v2sPV||"—"}kg (${Math.round((parseFloat(form.v2sPV)||0)/(parseFloat(form.pvVacaAdulta)||320)*100)}% PV adulta) · CC pond ${ccV2sPond.toFixed(1)}\n`;
      t += `  Estado: ${conTern?"⚠️ Con ternero al pie — bloqueo LH activo":"Sin ternero"} · Biotipo: ${form.biotipo||"—"}\n`;
      if (resV2s) {
        t += `  Proyección V2S: CC parto ${resV2s.ccParto} → CC serv ${resV2s.ccServ} · Preñez ${resV2s.prenez}% · Anestro ${resV2s.diasAnestro}d\n`;
        t += `  Requerimiento triple estrés: ${resV2s.reqMcal||"—"} Mcal/vaca/día (NRC 2000)\n`;
        if (resV2s.critico) t += `  ⛔ GRUPO CRÍTICO: suplementación urgente + evaluar destete hiperprecoz\n`;
      }
      if (form.cc2sDist?.length > 1) {
        t += `  Distribución CC V2S:\n`;
        form.cc2sDist.forEach((g, i) => {
          if (parseFloat(g.pct) > 0) {
            const rG = calcV2S(form.v2sPV, form.pvVacaAdulta, g.cc, conTern, form.biotipo, cadena);
            t += `    Grupo ${i+1}: CC${g.cc} (${g.pct}%) → preñez ${rG?.prenez||"—"}% · anestro ${rG?.diasAnestro||"—"}d\n`;
          }
        });
      }
    }
    if (form.consultaEspecifica) t += `\nCONSULTA: ${form.consultaEspecifica}\n`;

    // ── GEI ──────────────────────────────────────────────────────
    const geiData = calcGEI(form, motor, tray, sat);
    if (geiData) {
      t += `\nGEI (IPCC 2019 Tier 2 + Gere et al. 2019/2024):\n`;
      t += `  CH₄ total base: ${geiData.totalCH4Base?.toLocaleString()} kg/año · Intensidad: ${geiData.intensBase} kg CO₂eq/kg PV\n`;
      t += `  GWP100: ${(geiData.totalCO2eqBase/1000)?.toFixed(0)} t CO₂eq/año · GWP* (rodeo estable): ${(geiData.totalCO2eqBaseSTAR/1000)?.toFixed(0)} t CO₂eq/año\n`;
      if (geiData.intensSupl && geiData.intensSupl < geiData.intensBase) {
        t += `  Con suplementación: ${geiData.intensSupl} kg CO₂eq/kg PV (↓${((1-geiData.intensSupl/geiData.intensBase)*100).toFixed(1)}% — mejora digestibilidad ↓Ym)\n`;
      }
      if (geiData.co2Pastizal?.CO2_total !== 0) {
        t += `  Captura CO₂ pastizal: ${geiData.co2Pastizal?.CO2_total > 0 ? "+" : ""}${(geiData.co2Pastizal?.CO2_total/1000)?.toFixed(1)} t CO₂/año (McSherry & Ritchie 2013 — incertidumbre ±40%)\n`;
      }
      t += `  Ym calibrado: ${geiData.dig}% digestibilidad · Referencia promedio nacional: ~25 kg CO₂eq/kg PV\n`;
    }

    // ── DIAGNÓSTICO CEREBRO (cuellos de botella) ─────────────────
    // ── CONCLUSIONES ALGORÍTMICAS PRE-CALCULADAS ─────────────────
    // Los algoritmos interpretativos ya razonaron — la IA recibe conclusiones verificadas
    const interp = interpretarSistemaCompleto(form, motor, sat, tray);
    if (interp) {
      t += `\n═══ ANÁLISIS INTERPRETATIVO DEL SISTEMA ═══\n`;
      if (interp.recurso?.conclusion) {
        const c4cal = CALIDAD_C4_CALIBRADA[form.fenologia||"mayor_50"];
        t += `RECURSO FORRAJERO: ${interp.recurso.conclusion}\n`;
        t += `  CALIDAD C4 CALIBRADA: DIG ${c4cal?.dig||"?"} · PB ${c4cal?.pb||"?"}% · ${c4cal?.mcalKg||"?"} Mcal/kg MS (Minson 1990, meta-análisis PMC 9311783)\n`;
      }
      if (interp.ccTiempo?.conclusion)   t += `TRAYECTORIA CC TEMPORAL: ${interp.ccTiempo.conclusion}\n`;
      if (interp.supl?.conclusion)       t += `SUPLEMENTACIÓN: ${interp.supl.conclusion}\n`;
      if (interp.verdeo?.conclusion)     t += `VERDEO: ${interp.verdeo.conclusion}\n`;
      if (interp.sanidad?.conclusion)    t += `SANIDAD REPRODUCTIVA: ${interp.sanidad.conclusion}\n`;
      if (interp.eficiencia?.conclusion) t += `EFICIENCIA REPRODUCTIVA: ${interp.eficiencia.conclusion}\n`;
      if (interp.agua?.hayProblema)      t += `AGUA: ${interp.agua.conclusion}\n`;
      if (interp.amplitud?.conclusion)   t += `AMPLITUD PARICIÓN Y MANEJO LACTANCIA: ${interp.amplitud.conclusion}\n`;
      if (interp.momento?.conclusion)    t += `MOMENTO ÓPTIMO DE ACCIÓN: ${interp.momento.conclusion}\n`;
      if (interp.amplitud?.conclusion)   t += `AMPLITUD DE PARICIÓN Y VIABILIDAD DEL DESTETE: ${interp.amplitud.conclusion}\n`;

      // Si el sistema está bien — oportunidades de mejora marginal
      const optim = cerebroData?.tarjetasOptim || [];
      if (optim.length > 0) {
        t += `\n═══ SISTEMA SOBRE LA META — OPORTUNIDADES DE MEJORA MARGINAL ═══\n`;
        t += `El sistema supera ≥75% preñez. El análisis busca el margen adicional — "sacar agua de las piedras".\n`;
        optim.forEach(o => {
          t += `\n[${o.potencia?.toUpperCase()||"?"} PRIORIDAD] ${o.titulo}\n`;
          t += `  IMPACTO: ${o.impacto}\n`;
          t += `  ACCIÓN: ${o.accion}\n`;
          if (o.mecanismo) t += `  MECANISMO: ${o.mecanismo}\n`;
          if (o.referencia) t += `  REF: ${o.referencia}\n`;
        });
      }
    }

    const cerebroData = calcCerebro(motor, form, sat);
    if (cerebroData) {
      t += `\n═══ DIAGNÓSTICO INTEGRAL DEL SISTEMA ═══\n`;

      // Sustentabilidad — la pregunta central
      const ds = cerebroData.diagnosticoSustentabilidad;
      if (ds) {
        t += `SUSTENTABILIDAD: ${ds.resumen}\n`;
        t += `  Preñez actual: ${ds.prenezActual||cerebroData.resumen?.prenez||"—"}% · Sustentable con recursos actuales: ${ds.prenezSustentable||"—"}% · Meta: ${ds.PRENEZ_OBJETIVO||75}%\n`;
        if (ds.ciclosAlColapso) t += `  ALERTA TEMPORAL: sin corrección el sistema colapsa en ${ds.ciclosAlColapso} ciclo${ds.ciclosAlColapso>1?"s":""} (erosión CC ${ds.erosionCCAnual?.toFixed(1)||"0.2"} puntos/año)\n`;
        if (ds.factoresLimitantes?.length > 0) t += `  Factores limitantes: ${ds.factoresLimitantes.join(" | ")}\n`;
      }

      // Preñez y terneros adicionales
      t += `\nPREÑEZ Y PRODUCCIÓN:\n`;
      t += `  Actual: ${cerebroData.resumen?.prenez||"—"}% → Potencial con correcciones: ${cerebroData.resumen?.prenezPot||"—"}%\n`;
      if (cerebroData.resumen?.ternerosDif > 0) {
        t += `  Terneros adicionales posibles: ${cerebroData.resumen.ternerosDif} cab si se corrigen los limitantes\n`;
      }

      // Parrafo ejecutivo del cerebro
      if (cerebroData.parrafo) t += `\nSITUACIÓN ACTUAL: ${cerebroData.parrafo}\n`;

      // Alertas satelitales
      if (cerebroData.alertaSat) t += `\nCONDICIÓN DEL CAMPO HOY (satélite): ${cerebroData.alertaSat}\n`;

      // Puntos críticos con TODO su contenido
      if (cerebroData.tarjetas?.length > 0) {
        t += `\nPUNTOS CRÍTICOS — ORDENADOS POR IMPACTO (${cerebroData.tarjetas.length} limitantes):\n`;
        cerebroData.tarjetas.forEach((c, idx) => {
          t += `\n[${c.prioridad}] ${c.titulo}\n`;
          if (c.impacto)       t += `  IMPACTO: ${c.impacto}\n`;
          if (c.solucion)      t += `  SOLUCIÓN: ${c.solucion}\n`;
          if (c.cuandoActuar)  t += `  CUÁNDO: ${c.cuandoActuar}\n`;
          if (c.cuantifica)    t += `  CANTIDAD: ${c.cuantifica}\n`;
          if (c.tipoSupl)      t += `  TIPO SUPLEMENTO: ${c.tipoSupl} (${c.tipoSupl==="P"?"Proteico — activa microflora, 2-3x/semana":c.tipoSupl==="E"?"Energético — almidón, DIARIO obligatorio":"Energético-Proteico — déficit mixto"})\n`;
        });
      }

      // Cronograma temporal mes a mes
      if (cerebroData.cronograma?.length > 0) {
        t += `\nCRONOGRAMA ANUAL (análisis mes a mes):\n`;
        cerebroData.cronograma.forEach(m => {
          const riesgosStr = m.riesgos.map(r => r.label).join(", ");
          if (riesgosStr || m.esActual) {
            t += `  ${m.mes}${m.esActual?" [HOY]":""}${m.esInv?" [INV]":""}: bal ${m.bal>0?"+":""}${Math.round(m.bal)}M/d · PB pasto ${m.pbPas||"—"}% · ${riesgosStr||"sin eventos"}\n`;
          }
        });
      }
    }

    return t;
  }

  // ── RUN ANALYSIS ──────────────────────────────────────────────
  async function runAnalysis() {
    setLoading(true); setResult(""); setTab("cerebro");
    let mi = 0;
    const iv = setInterval(() => { setLoadMsg(MSGS[mi % MSGS.length]); mi++; }, 2200);
    try {
      // Guardar en historial antes de analizar
      guardarEnHistorial(form, motorEfectivo, null);
      const prompt = buildPromptFull();
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
        ["CC hoy",      ccPondVal?.toFixed(1) || "—"],
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

  // ── DESCARGAR CSV ─────────────────────────────────────────────
  function descargarCSV() {
    const fecha   = new Date().toLocaleDateString("es-AR");
    const isoDate = new Date().toISOString().slice(0,10);
    const dispMS  = calcDisponibilidadMS(form.altPasto, form.tipoPasto);

    // ── FORMATO HORIZONTAL: fila 1 = headers, fila 2 = valores ──
    // Pegar cada análisis como nueva fila → base de datos acumulable en Excel
    const campos = [
      // ─ Identificación ─
      ["Fecha_analisis",            fecha],
      ["Productor",                 form.nombreProductor || ""],
      ["Localidad",                 form.localidad || ""],
      ["Provincia",                 form.provincia || ""],
      ["Zona",                      form.zona || ""],
      ["Lat",                       coords?.lat?.toFixed(4) || ""],
      ["Lon",                       coords?.lon?.toFixed(4) || ""],
      // ─ Rodeo ─
      ["Biotipo",                   form.biotipo || ""],
      ["Vacas_cab",                 form.vacasN || ""],
      ["Toros_cab",                 form.torosN || ""],
      ["PV_vaca_adulta_kg",         form.pvVacaAdulta || ""],
      ["Prenez_historica_pct",      form.prenez || ""],
      ["Destete_historico_pct",     form.pctDestete || ""],
      ["Estado_reproductivo",       form.eReprod || ""],
      ["Incluye_1er_parto",         form.primerParto ? "Si" : "No"],
      ["Ini_servicio",              form.iniServ || ""],
      ["Fin_servicio",              form.finServ || ""],
      ["Edad_primer_entore_meses",  form.edadPrimerEntore || ""],
      ["ENSO",                      form.enso || "neutro"],
      // ─ CC ─
      ["CC_ponderada_hoy",          ccPondVal?.toFixed(2) || ""],
      ["CC_parto_proyectada",       tray?.ccParto || ""],
      ["CC_min_lactacion",          tray?.ccMinLact || ""],
      ["CC_servicio",               tray?.ccServ || ""],
      ["Prenez_estimada_pct",       tray?.pr || ""],
      ["Dias_anestro",              tray?.anestro?.dias || ""],
      ["Meses_lactacion",           tray?.mesesLact || ""],
      // ─ Destete ─
      ["Pct_dest_tradicional_180d", form.destTrad  || "0"],
      ["Pct_dest_anticipado_90d",   form.destAntic || "0"],
      ["Pct_dest_hiperprecoz_50d",  form.destHiper || "0"],
      // ─ Forraje ─
      ["Sup_ganadera_ha",           form.supHa || ""],
      ["Pct_monte",                 form.pctMonte || "0"],
      ["Pct_no_ganadero",           form.pctNGan  || "0"],
      ["Vegetacion",                form.vegetacion || ""],
      ["Fenologia",                 form.fenologia || ""],
      ["Carga_EV_ha",               form.vacasN && form.supHa ? (parseFloat(form.vacasN)/parseFloat(form.supHa)).toFixed(2) : ""],
      ["Alt_pasto_cm",              form.altPasto || ""],
      ["Tipo_pasto",                form.tipoPasto || ""],
      ["Disp_MS_kgha",              dispMS?.msHa || ""],
      ["Nivel_disp_pasto",          dispMS?.nivel || ""],
      // ─ Clima satelital ─
      ["Temp_actual_C",             sat?.temp || ""],
      ["Temp_max_C",                sat?.tMax || ""],
      ["Temp_min_C",                sat?.tMin || ""],
      ["Lluvia_7d_mm",              sat?.p7   || ""],
      ["Lluvia_30d_mm",             sat?.p30  || ""],
      ["Balance_hidrico_mm",        sat?.deficit || ""],
      ["NDVI",                      sat?.ndvi || ""],
      ["Cond_forrajera",            sat?.condForr || ""],
      ["Lluvia_prox7d_mm",           sat?.lluviaProx7 ?? ""],
      ["Temp_media_prox7d_C",        sat?.tempMediaProx7 ?? ""],
      ["Helada_prox7d",              sat?.helada7 ? "Si" : sat ? "No" : ""],
      ["Pronostico_7d",              sat?.pronostico ? sat.pronostico.map(d=>d.dia+":"+d.tMax+"/"+d.tMin+"°C"+( d.lluvia>2?"+"+d.lluvia+"mm":"")).join(" | ") : ""],
      // ─ Suplementación ─
      ["Supl_gestacion",            form.supl1 || ""],
      ["Dosis_gestacion_kgd",       form.dosis1 || "0"],
      ["Supl_lactancia",            form.supl2 || ""],
      ["Dosis_lactancia_kgd",       form.dosis2 || "0"],
      ["Supl_preparto",             form.supl3 || ""],
      ["Dosis_preparto_kgd",        form.dosis3 || "0"],
      // ─ Agua ─
      ["TDS_mgL",                   form.aguaTDS || ""],
      ["Tipo_sal_agua",             form.aguaTipoSal || ""],
      ["Fuente_agua",               form.aguaFuente || ""],
      ["Reduccion_DMI_pct",         evalAgua?.pctReducDMI?.toFixed(1) || "0"],
      // ─ Suplementación por categoría ─
      ["Supl_v2s",                form.supl_v2s     || ""],
      ["Dosis_v2s_kgd",           form.dosis_v2s    || "0"],
      ["Supl2_v2s",               form.supl2_v2s    || ""],
      ["Dosis2_v2s_kgd",          form.dosis2_v2s   || "0"],
      ["Supl_toros",              form.supl_toros   || ""],
      ["Dosis_toros_kgd",         form.dosis_toros  || "0"],
      ["Supl2_toros",             form.supl2_toros  || ""],
      ["Dosis2_toros_kgd",        form.dosis2_toros || "0"],
      ["Supl_vaq2",               form.supl_vaq2    || ""],
      ["Dosis_vaq2_kgd",          form.dosis_vaq2   || "0"],
      ["Supl2_vaq2",              form.supl2_vaq2   || ""],
      ["Dosis2_vaq2_kgd",         form.dosis2_vaq2  || "0"],
      ["Supl_vaq1",               form.supl_vaq1    || ""],
      ["Dosis_vaq1_kgd",          form.dosis_vaq1   || "0"],
      ["Supl2_vaq1",              form.supl2_vaq1   || ""],
      ["Dosis2_vaq1_kgd",         form.dosis2_vaq1  || "0"],
      ["Supl_ternero",            form.supl_ternero || ""],
      ["Dosis_ternero_kgd",       form.dosis_ternero|| "0"],
      // ─ Sanidad ─
      ["San_aftosa",                form.sanAftosa    === "si" ? "Al_dia" : "Sin_vacunar"],
      ["San_brucelosis",            form.sanBrucelosis=== "si" ? "Al_dia" : "Sin_vacunar"],
      ["San_IBR_DVB",               form.sanVacunas   === "si" ? "Al_dia" : "Sin_vacunar"],
      ["Toros_revision",            form.sanToros     === "con_control" ? "Con_revision" : "Sin_revision"],
      ["Historia_abortos",          form.sanAbortos   === "si" ? "Si" : "No"],
      ["Programa_sanitario",        form.sanPrograma  === "si" ? "Si" : "No"],
      ["San_parasito_externo",      form.sanParasitoExt || ""],
      ["San_parasito_interno",      form.sanParasitoInt || ""],
      // ─ Vaquillona 1° ─
      ["Vaq1_cab",                  Math.round((parseInt(form.vacasN)||0)*(parseFloat(form.pctReposicion)||20)/100)],
      ["Pct_reposicion",            form.pctReposicion || "20"],
      ["Edad_vaq_mayo_meses",       form.edadVaqMayo || ""],
      ["Tipo_destete_vaq",          form.tipoDesteteVaq || ""],
      ["PV_entrada_vaq1_kg",        form.vaq1PV || tcSave?.pvMayoPond || ""],
      ["PV_salida_vaq1_kg",         vaq1E?.pvSal || ""],
      ["GDP_vaq1_gd",               vaq1E?.gdpReal || ""],
      ["Esc_supl_vaq1",             vaq1E?.esc || ""],
      ["Prot_vaq1_kgd",             vaq1E?.protKg || ""],
      ["Energ_vaq1_kgd",            vaq1E?.energKg || "0"],
      ["Freq_supl_vaq1",            vaq1E?.freq || ""],
      // ─ Vaquillona 2° ─
      ["Vaq2_cab",                  form.vaq2N || ""],
      ["PV_entrada_vaq2_kg",        pvEntradaVaq2 || ""],
      ["PV_entore_vaq2_kg",         vaq2E?.pvEntore || ""],
      ["Llega_objetivo_entore",     vaq2E?.llegas ? "Si" : vaq2E ? "No" : ""],
      // ─ V2S ─
      ["V2S_cab",                   form.v2sN || ""],
      ["V2S_PV_kg",                 form.v2sPV || ""],
      ["V2S_ternero_al_pie",        form.v2sTernero === "si" ? "Si" : "No"],
      // ─ Terneros ─
      ["Terneros_cab",              tcSave?.terneros || ""],
      ["PV_ternero_mayo_kg",        tcSave?.pvMayoPond || ""],
      // ─ Informe ─
      ["Consulta_especifica",       form.consultaEspecifica || ""],
      ["Tiene_informe_IA",          result ? "Si" : "No"],
      // ─ GEI ─
      ...(() => {
        const g = calcGEI(form, motor, tray, sat);
        if (!g) return [];
        return [
          ["GEI_CH4_total_kg_anio",   g.totalCH4Base || ""],
          ["GEI_intensidad_base",      g.intensBase || ""],
          ["GEI_intensidad_con_supl",  g.intensSupl || ""],
          ["GEI_GWP100_tCO2eq",        g.totalCO2eqBase ? (g.totalCO2eqBase/1000).toFixed(0) : ""],
          ["GEI_GWP_star_tCO2eq",      g.totalCO2eqBaseSTAR ? (g.totalCO2eqBaseSTAR/1000).toFixed(0) : ""],
          ["GEI_captura_CO2_t",        g.co2Pastizal?.CO2_total ? (g.co2Pastizal.CO2_total/1000).toFixed(1) : ""],
          ["GEI_dig_pct",              g.dig || ""],
        ];
      })(),
      // ─ Diagnóstico motor ─
      ...(() => {
        const cb = calcCerebro(motor, form, sat);
        if (!cb) return [];
        const p1 = cb.tarjetas?.filter(c=>c.prioridad==="URGENTE"||c.prioridad==="P1").map(c=>c.titulo).join(" | ") || "";
        const p2 = cb.tarjetas?.filter(c=>c.prioridad==="P2").map(c=>c.titulo).join(" | ") || "";
        return [
          ["Score_riesgo",             cb.resumen?.scoreRiesgo || ""],
          ["Nivel_riesgo",             cb.resumen?.nivelRiesgo || ""],
          ["Prenez_potencial_pct",     cb.resumen?.prenezPot || ""],
          ["Terneros_adicionales",     cb.resumen?.ternerosDif || ""],
          ["Valor_adicional_ARS",      cb.resumen?.valorDif || ""],
          ["Cuellos_P1",               p1],
          ["Cuellos_P2",               p2],
          ["Score_total",              (() => { const sc = calcScore(motor, form, null); return sc?.total ?? ""; })()],
          ["Score_CC",                 (() => { const sc = calcScore(motor, form, null); return sc?.dim?.find(d=>d.id==="cc")?.score ?? ""; })()],
          ["Score_Balance",            (() => { const sc = calcScore(motor, form, null); return sc?.dim?.find(d=>d.id==="balance")?.score ?? ""; })()],
          ["Score_Reproduccion",       (() => { const sc = calcScore(motor, form, null); return sc?.dim?.find(d=>d.id==="repro")?.score ?? ""; })()],
          ["Score_Vaquillona",         (() => { const sc = calcScore(motor, form, null); return sc?.dim?.find(d=>d.id==="vaq")?.score ?? ""; })()],
          ["Score_Sanidad",            (() => { const sc = calcScore(motor, form, null); return sc?.dim?.find(d=>d.id==="sanidad")?.score ?? ""; })()],
          ["Score_GEI",                (() => { const sc = calcScore(motor, form, null); return sc?.dim?.find(d=>d.id==="gei")?.score ?? ""; })()],
          ["Anos_recup_vaq1",          cb.anosRecupVaq1 || ""],
          ["Anos_recup_vaq2",          cb.anosRecupVaq2 || ""],
        ];
      })(),
      // ─ Balance invernal ─
      ["Balance_jun_mcal",           motor?.balanceMensual?.[5]?.balance || ""],
      ["Balance_jul_mcal",           motor?.balanceMensual?.[6]?.balance || ""],
      ["Balance_ago_mcal",           motor?.balanceMensual?.[7]?.balance || ""],
      ["Deficit_meses_invierno",     motor?.balanceMensual ? motor.balanceMensual.filter(m=>[5,6,7].includes(m.i)&&m.deficit).length : ""],
    ];

    const headers = campos.map(([h]) => h);
    const valores = campos.map(([, v]) => v);

    const escapeCSV = cel => {
      const s = String(cel ?? "").replace(/"/g, '""');
      return s.includes(";") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };

    // Punto y coma como separador — estándar Excel en Argentina/España/Latinoamérica
    const SEP = ";";
    // "sep=;" le dice a Excel en cualquier idioma que el separador es punto y coma
    const csvContent = ["sep=;", headers.map(escapeCSV).join(SEP), valores.map(escapeCSV).join(SEP)]
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type:"text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `calfai_${(form.nombreProductor||"datos").replace(/\s/g,"_")}_${isoDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ══════════════════════════════════════════════════════════════
  // PASOS DEL FORMULARIO
  // ══════════════════════════════════════════════════════════════


  // Conectar los renders de los pasos
  const { renderCampo, renderRodeoCompleto, renderManejo, renderAnalisis } =
    getPasoRenders({
      form, set, setDist: (k,v) => setForm(f=>({...f,[k]:v})),
      step, setStep, motor, motorEfectivo, tray, balanceMensual, sat,
      coords, setCoords, ccPondVal, evalAgua, sanidad, nVaqRepos, score,
      result, setResult, loading, setLoading, loadMsg, setLoadMsg,
      setTab, tab, confianza, scoreRiesgo, nivelRiesgo, colorRiesgo,
      cargaEV_ha, impactoCola, vaq1E, vaq2E, ccDesvio, dist,
      stockStatus, toroDxn, alertasMotor, modoForraje, setModoForraje,
      vistaSupl, setVistaSupl, usaPotreros, setUsaPotreros,
      potreros, setPotreros, runAnalysis,
      pvEntVaq1, pvSalidaVaq1, pvEntradaVaq2,
      nVacas, nToros, nV2s, nVaq1, nVaq2, cadena, disponMS,
      PASOS, C, cerebro: calcCerebro(motorEfectivo, form, sat),
    });

const RENDERS = [renderCampo, renderRodeoCompleto, renderManejo, renderAnalisis];

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
    <div style={{ minHeight:"100vh", background:C.bg, paddingBottom:80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=IBM+Plex+Sans:wght@400;600;700&display=swap');
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        select, input, button { outline:none; }
        input[type=range]::-webkit-slider-thumb { width:18px; height:18px; }
        details > summary::-webkit-details-marker { display:none; }
        @keyframes pulse { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.2)} }
      `}</style>

      {/* Header sticky */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"12px 16px", position:"sticky", top:0, zIndex:50, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontFamily:C.font, fontSize:14, color:C.green, letterSpacing:2, fontWeight:700 }}>
          🌾 CALF AI<span style={{ color:C.textDim, fontSize:10, marginLeft:6 }}>v1</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {ccPondVal > 0 && <Pill color={smf(ccPondVal,4.5,5.5)}>CC {ccPondVal.toFixed(1)}</Pill>}
          {evalAgua && evalAgua.cat.riesgo >= 2 && <Pill color={C.red}>💧{evalAgua.cat.label}</Pill>}
          {sanidad?.alerts?.length > 0 && <Pill color={C.red}>🩺{sanidad.alerts.length}</Pill>}
          <button onClick={()=>signOut()} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textDim, padding:"5px 10px", fontFamily:C.font, fontSize:10, cursor:"pointer" }}>
            salir
          </button>
          <button
            onClick={() => setShowHistorial(true)}
            style={{ background:"none", border:"1px solid "+C.border, borderRadius:8,
              padding:"6px 12px", fontFamily:C.font, fontSize:9, cursor:"pointer",
              color:C.textDim, display:"flex", alignItems:"center", gap:5 }}>
            📁 Establecimientos
          </button>
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

      {/* Título paso */}
      <div style={{ padding:"14px 16px 6px" }}>
        <div style={{ fontFamily:C.font, fontSize:11, color:C.green, letterSpacing:2, marginBottom:2 }}>
          {PASOS[step].icon} {PASOS[step].label.toUpperCase()}
        </div>
        {form.nombreProductor && <div style={{ fontFamily:C.sans, fontSize:12, color:C.textDim }}>{form.nombreProductor}</div>}
      </div>

      {/* Contenido del paso */}
      <div style={{ padding:"0 16px" }}>
        {RENDERS[step]?.()}
      </div>

      {/* Navbar inferior */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.card, borderTop:`1px solid ${C.border}`, display:"flex", zIndex:100, padding:"6px 0 env(safe-area-inset-bottom)" }}>
        {PASOS.map((p, i) => {
          // Alertas del motor por paso
          const dotColor = (() => {
            const step_alerts = alertasMotor.filter(a => {
              if (i === 2) return ["cc_serv_bajo","cc_desvio_campo"].includes(a.id);
              if (i === 4) return a.id?.startsWith("agua") || a.id?.startsWith("carga");
              if (i === 6) return a.id?.startsWith("stock") || a.id?.startsWith("nostock") || a.id?.startsWith("vaq");
              if (i === 7) return a.id?.startsWith("balance_inv") || a.id?.startsWith("cc_");
              return false;
            });
            if (step_alerts.some(a=>a.tipo==="P1")) return C.red;
            if (step_alerts.some(a=>a.tipo==="P2")) return C.amber;
            return null;
          })();
          return (
            <button key={i} onClick={()=>setStep(i)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", padding:"6px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:2, opacity: step===i ? 1 : 0.45, position:"relative" }}>
              <span style={{ fontSize:17 }}>{p.icon}</span>
              <span style={{ fontFamily:C.font, fontSize:7, color:step===i?C.green:C.textDim, letterSpacing:.5 }}>{p.label}</span>
              {step === i && <div style={{ width:16, height:2, borderRadius:1, background:C.green }} />}
              {dotColor && step !== i && (
                <span style={{ position:"absolute", top:2, right:"50%", marginRight:-12,
                  width:7, height:7, borderRadius:3.5, background:dotColor, border:`1.5px solid ${C.card}` }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <SessionProvider>
      <CalfAIPro />
    </SessionProvider>
  );
}


// ═══════════════════════════════════════════════════════════════════
// PERSISTENCIA Y HISTORIAL DE ESTABLECIMIENTOS
// Guarda el form automáticamente en localStorage.
// Permite recuperar sesiones anteriores por establecimiento.
// ═══════════════════════════════════════════════════════════════════

const STORAGE_KEY_FORM    = "calfai_form_draft";
const STORAGE_KEY_HIST    = "calfai_historial";
const MAX_HISTORIAL       = 20;

function usePersistencia(form, setForm) {
  // Guardar borrador automáticamente
  const guardarBorrador = React.useCallback(() => {
    try {
      const draft = { ...form, _guardadoEn: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY_FORM, JSON.stringify(draft));
    } catch(e) {}
  }, [form]);

  // Restaurar borrador al cargar
  const restaurarBorrador = React.useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FORM);
      if (!raw) return false;
      const draft = JSON.parse(raw);
      if (!draft || !draft.vacasN) return false;
      setForm(f => ({ ...f, ...draft }));
      return draft;
    } catch(e) { return false; }
  }, [setForm]);

  // Guardar en historial (visita completa)
  const guardarEnHistorial = React.useCallback((formData, motor, resultado) => {
    try {
      const raw  = localStorage.getItem(STORAGE_KEY_HIST);
      const hist = raw ? JSON.parse(raw) : [];
      const entrada = {
        id:           Date.now(),
        fecha:        new Date().toISOString(),
        productor:    formData.nombreProductor || "Sin nombre",
        localidad:    formData.localidad || formData.provincia || "",
        vacasN:       formData.vacasN,
        prenezEst:    motor?.tray?.pr || 0,
        ccServ:       motor?.tray?.ccServ || 0,
        mesesDeficit: [5,6,7].filter(i => (motor?.balanceMensual?.[i]?.balance ?? 0) < 0).length,
        nivelRiesgo:  motor?.nivelRiesgo || "—",
        colorRiesgo:  motor?.colorRiesgo || "#888",
        tieneResultado: !!resultado,
        form:         formData,  // snapshot completo del form
      };
      // Deduplicar por productor + fecha (mismo día = actualizar)
      const mismoProductor = hist.findIndex(h =>
        h.productor === entrada.productor &&
        h.fecha.slice(0,10) === entrada.fecha.slice(0,10)
      );
      if (mismoProductor >= 0) hist[mismoProductor] = entrada;
      else hist.unshift(entrada);
      // Limitar
      if (hist.length > MAX_HISTORIAL) hist.splice(MAX_HISTORIAL);
      localStorage.setItem(STORAGE_KEY_HIST, JSON.stringify(hist));
      return entrada.id;
    } catch(e) { return null; }
  }, []);

  // Leer historial
  const leerHistorial = React.useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HIST);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }, []);

  // Cargar visita anterior
  const cargarVisita = React.useCallback((entrada) => {
    try {
      if (entrada?.form) {
        setForm({ ...FORM_DEF, ...entrada.form });
        return true;
      }
      return false;
    } catch(e) { return false; }
  }, [setForm]);

  // Limpiar borrador
  const limpiarBorrador = React.useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY_FORM); } catch(e) {}
  }, []);

  return { guardarBorrador, restaurarBorrador, guardarEnHistorial,
           leerHistorial, cargarVisita, limpiarBorrador };
}

// Panel de historial — modal liviano
function PanelHistorial({ onCargar, onCerrar, C }) {
  const [hist, setHist] = React.useState([]);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HIST);
      setHist(raw ? JSON.parse(raw) : []);
    } catch(e) { setHist([]); }
  }, []);

  const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const fmtFecha = (iso) => {
    const d = new Date(iso);
    return `${d.getDate()} ${MESES_CORTO[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
      zIndex:999, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onCerrar}>
      <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:16,
        padding:"20px 20px 16px", width:"min(420px,94vw)", maxHeight:"80vh",
        overflowY:"auto", boxShadow:"0 8px 32px rgba(0,0,0,0.18)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          marginBottom:14 }}>
          <div style={{ fontFamily:C.font, fontSize:11, color:C.textFaint,
            letterSpacing:1 }}>ESTABLECIMIENTOS RECIENTES</div>
          <button onClick={onCerrar}
            style={{ background:"none", border:"none", color:C.textDim,
              fontSize:16, cursor:"pointer", padding:"2px 6px" }}>✕</button>
        </div>
        {hist.length === 0 ? (
          <div style={{ fontFamily:C.sans, fontSize:12, color:C.textDim,
            textAlign:"center", padding:"20px 0" }}>
            Sin establecimientos guardados aún
          </div>
        ) : hist.map((h,i) => (
          <div key={h.id} onClick={() => { onCargar(h); onCerrar(); }}
            style={{ padding:"10px 12px", borderRadius:10, marginBottom:6,
              background:C.card2, border:"1px solid "+C.border,
              cursor:"pointer", transition:"border-color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor=C.blue}
            onMouseLeave={e => e.currentTarget.style.borderColor=C.border}>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"flex-start" }}>
              <div>
                <div style={{ fontFamily:C.sans, fontSize:13, fontWeight:500,
                  color:C.text, marginBottom:2 }}>
                  {h.productor || "Sin nombre"}
                </div>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim }}>
                  {h.localidad && h.localidad + " · "}{fmtFecha(h.fecha)}
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontFamily:C.font, fontSize:18, fontWeight:700,
                  color: h.prenezEst >= 75 ? C.green : h.prenezEst >= 60 ? C.amber : C.red,
                  lineHeight:1 }}>{h.prenezEst || "—"}%</div>
                <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>
                  preñez · {h.vacasN || "?"} vac
                </div>
              </div>
            </div>
            {h.mesesDeficit > 0 && (
              <div style={{ marginTop:4, fontFamily:C.font, fontSize:8,
                color:C.amber }}>
                ⚡ déficit {h.mesesDeficit}/3 meses inv · CC serv {h.ccServ?.toFixed?.(1)||"—"}
              </div>
            )}
          </div>
        ))}
        <div style={{ marginTop:10, fontFamily:C.font, fontSize:8,
          color:C.textFaint, textAlign:"center" }}>
          Guardado localmente en este dispositivo
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// INDICADOR REAL vs ESTIMADO
// Calcula un score de confianza del diagnóstico según cuántos datos
// críticos fueron cargados vs cuántos son valores por defecto.
// ═══════════════════════════════════════════════════════════════════
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
