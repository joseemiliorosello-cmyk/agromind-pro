import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import {
  ComposedChart, Bar, Line, Area,   // FIX CRASH-1: Area agregado al import
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ═══════════════════════════════════════════════════════
// DATOS BASE
// ═══════════════════════════════════════════════════════
const HELADAS_PROV = {
  "Formosa":              { dia: 15, mes: 5 },
  "Chaco":                { dia:  1, mes: 5 },
  "Corrientes":           { dia:  1, mes: 5 },
  "Misiones":             { dia: 20, mes: 4 },
  "Entre Ríos":           { dia: 10, mes: 4 },
  "Santa Fe":             { dia: 10, mes: 4 },
  "Santiago del Estero":  { dia: 25, mes: 4 },
  "Salta":                { dia: 15, mes: 5 },
  "Buenos Aires":         { dia: 15, mes: 4 },
  "Córdoba":              { dia: 10, mes: 4 },
  "La Pampa":             { dia: 20, mes: 3 },
  "Mendoza":              { dia:  1, mes: 4 },
  "Neuquén / Río Negro":  { dia:  1, mes: 3 },
  "Patagonia Sur":        { dia:  1, mes: 2 },
  "Paraguay Oriental":         { dia: 15, mes: 5 },
  "Chaco Paraguayo":           { dia: 10, mes: 5 },
  "Santa Cruz / Beni (BO)":   { dia:  1, mes: 5 },
  "Tarija / Chaco (BO)":      { dia: 20, mes: 4 },
  "Mato Grosso do Sul (BR)":  { dia: 15, mes: 5 },
  "Mato Grosso / Goiás (BR)": { dia: 10, mes: 5 },
  "Rio Grande do Sul (BR)":   { dia:  1, mes: 4 },
  "Pantanal (BR)":             { dia: 20, mes: 5 },
};

const CLIMA_HIST = {
  "Corrientes":           [{t:28,p:130},{t:27,p:120},{t:25,p:110},{t:20,p:90},{t:16,p:70},{t:13,p:60},{t:13,p:55},{t:15,p:50},{t:18,p:80},{t:22,p:110},{t:25,p:120},{t:27,p:130}],
  "Chaco":                [{t:29,p:120},{t:28,p:110},{t:26,p:110},{t:21,p:80},{t:16,p:60},{t:13,p:50},{t:13,p:45},{t:15,p:45},{t:19,p:70},{t:23,p:100},{t:26,p:110},{t:28,p:120}],
  "Formosa":              [{t:30,p:120},{t:29,p:110},{t:27,p:110},{t:22,p:80},{t:17,p:55},{t:14,p:45},{t:14,p:40},{t:16,p:45},{t:20,p:70},{t:24,p:100},{t:27,p:110},{t:29,p:120}],
  "Misiones":             [{t:26,p:170},{t:26,p:160},{t:24,p:150},{t:19,p:130},{t:15,p:110},{t:13,p:90},{t:13,p:90},{t:14,p:100},{t:17,p:120},{t:21,p:150},{t:23,p:160},{t:25,p:170}],
  "Entre Ríos":           [{t:25,p:100},{t:24,p:90},{t:22,p:90},{t:17,p:70},{t:13,p:55},{t:10,p:45},{t:10,p:40},{t:12,p:45},{t:15,p:65},{t:19,p:90},{t:22,p:100},{t:24,p:100}],
  "Santiago del Estero":  [{t:28,p:90},{t:27,p:80},{t:25,p:80},{t:20,p:50},{t:15,p:30},{t:12,p:20},{t:12,p:15},{t:14,p:20},{t:18,p:40},{t:22,p:70},{t:25,p:80},{t:27,p:90}],
  "Salta":                [{t:24,p:140},{t:23,p:130},{t:22,p:110},{t:17,p:50},{t:13,p:20},{t:10,p:10},{t:10,p:10},{t:12,p:15},{t:16,p:30},{t:20,p:70},{t:22,p:110},{t:23,p:130}],
  "Buenos Aires":         [{t:24,p:90},{t:23,p:80},{t:21,p:90},{t:16,p:70},{t:12,p:55},{t:9,p:45},{t:9,p:40},{t:11,p:50},{t:13,p:65},{t:17,p:85},{t:20,p:90},{t:23,p:90}],
  "Córdoba":              [{t:25,p:100},{t:24,p:90},{t:22,p:90},{t:17,p:60},{t:13,p:35},{t:10,p:25},{t:10,p:20},{t:12,p:25},{t:15,p:45},{t:19,p:75},{t:22,p:90},{t:24,p:100}],
  "Santa Fe":             [{t:26,p:110},{t:25,p:100},{t:23,p:100},{t:18,p:70},{t:14,p:50},{t:11,p:40},{t:11,p:35},{t:13,p:40},{t:16,p:60},{t:20,p:90},{t:23,p:100},{t:25,p:110}],
  "La Pampa":             [{t:24,p:80},{t:23,p:70},{t:21,p:75},{t:15,p:55},{t:11,p:38},{t:8,p:28},{t:8,p:25},{t:10,p:30},{t:13,p:48},{t:17,p:72},{t:20,p:78},{t:22,p:80}],
  "Paraguay Oriental":         [{t:29,p:140},{t:29,p:130},{t:27,p:130},{t:22,p:100},{t:17,p:75},{t:14,p:60},{t:14,p:55},{t:16,p:55},{t:19,p:80},{t:23,p:110},{t:26,p:130},{t:28,p:140}],
  "Chaco Paraguayo":           [{t:31,p:110},{t:30,p:100},{t:28,p:100},{t:23,p:70},{t:18,p:45},{t:15,p:35},{t:15,p:30},{t:17,p:35},{t:21,p:60},{t:25,p:90},{t:28,p:100},{t:30,p:110}],
  "Santa Cruz / Beni (BO)":   [{t:27,p:200},{t:27,p:170},{t:26,p:130},{t:23,p:80},{t:19,p:40},{t:17,p:25},{t:17,p:20},{t:18,p:30},{t:21,p:65},{t:24,p:110},{t:26,p:160},{t:27,p:190}],
  "Tarija / Chaco (BO)":      [{t:24,p:130},{t:23,p:120},{t:22,p:100},{t:17,p:50},{t:13,p:20},{t:10,p:10},{t:10,p:10},{t:12,p:15},{t:15,p:35},{t:19,p:70},{t:22,p:100},{t:23,p:120}],
  "Mato Grosso do Sul (BR)":  [{t:27,p:180},{t:27,p:160},{t:26,p:120},{t:23,p:80},{t:19,p:50},{t:17,p:30},{t:17,p:25},{t:19,p:35},{t:22,p:70},{t:25,p:120},{t:26,p:150},{t:27,p:170}],
  "Mato Grosso / Goiás (BR)": [{t:26,p:220},{t:26,p:200},{t:25,p:160},{t:24,p:90},{t:22,p:35},{t:20,p:10},{t:20,p:8},{t:22,p:15},{t:24,p:60},{t:26,p:120},{t:26,p:180},{t:26,p:210}],
  "Rio Grande do Sul (BR)":   [{t:24,p:120},{t:23,p:110},{t:21,p:100},{t:16,p:80},{t:12,p:65},{t:10,p:55},{t:10,p:50},{t:12,p:60},{t:14,p:75},{t:18,p:95},{t:21,p:110},{t:23,p:120}],
  "Pantanal (BR)":             [{t:28,p:200},{t:28,p:180},{t:27,p:140},{t:25,p:80},{t:22,p:30},{t:20,p:10},{t:20,p:8},{t:21,p:20},{t:24,p:60},{t:26,p:110},{t:27,p:160},{t:28,p:190}],
};

const CLIMA_DEF = [{t:27,p:120},{t:26,p:110},{t:24,p:100},{t:20,p:80},{t:15,p:60},{t:12,p:50},{t:12,p:45},{t:14,p:50},{t:18,p:70},{t:22,p:95},{t:25,p:110},{t:26,p:120}];
const getClima = (prov) => CLIMA_HIST[prov] || CLIMA_DEF;

const MESES   = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_C = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const FENOLOGIAS = [
  { val:"menor_10", label:"<10% Flor.", emoji:"🌿", desc:"PB >10% · Dig >65% · CV 2.8%PV" },
  { val:"10_25",    label:"10–25%",     emoji:"🌾", desc:"PB 7–10% · Dig 60–65% · CV 2.4%PV" },
  { val:"25_50",    label:"25–50%",     emoji:"🍂", desc:"PB 5–7% · Dig 55–60% · CV 2.0%PV", warn:"⚠ Déficit proteico" },
  { val:"mayor_50", label:">50%",       emoji:"🪵", desc:"PB <5% · Dig <55% · CV 1.6%PV",     warn:"⚠ Déficit severo" },
];

const ESTADOS_REPROD = [
  "Gestación temprana (1–4 meses)",
  "Gestación media (5–7 meses)",
  "Preparto (último mes)",
  "Lactación con ternero al pie",
  "Vaca seca sin ternero",
];

const PROD_BASE = {
  "Pastizal natural NEA/Chaco": 8,
  "Megatérmicas C4 (gatton panic, brachiaria)": 14,
  "Pasturas templadas C3": 10,
  "Mixta gramíneas+leguminosas": 11,
  "Bosque nativo": 1.5,
  "Verdeo de invierno": 12,
};

const UTIL = 0.40;

const DISCLAIMER = "Las recomendaciones generadas por AgroMind Pro tienen carácter orientativo. No reemplazan el criterio profesional del ingeniero agrónomo o médico veterinario que asiste al establecimiento, quien deberá validar, ajustar e implementar cualquier decisión de manejo según las condiciones particulares de cada sistema productivo.";

const SUPUESTOS = [
  { icon:"🛰", titulo:"NDVI estimado, no satelital",       desc:"Calculado desde precipitación + zona + mes. La fenología de campo tiene prioridad sobre este dato." },
  { icon:"📊", titulo:"Clima histórico regional",           desc:"Meses fuera del actual usan promedios provinciales/regionales. Open-Meteo provee datos reales solo para el período reciente." },
  { icon:"🐄", titulo:"Recuperación CC — carga media",     desc:"Ajustada por EV/ha pero asume disponibilidad homogénea. Sequías o sobrecarga puntual reducen la recuperación real." },
  { icon:"📉", titulo:"Caída CC — promedio bibliográfico", desc:"0.4–0.6 pts/mes según CC inicial (Peruchena INTA 2003). Variación individual alta." },
  { icon:"🌡️", titulo:"Disparador C4 — estimado por zona", desc:"Fecha estimada por historial térmico provincial/regional. ENSO puede adelantar/atrasar 2–4 semanas." },
  { icon:"⚖️", titulo:"Modelo calibrado NEA/NOA/PY/BR/BO", desc:"Coeficientes Paruelo & Oesterheld (2000) para pastizales C4. Zonas fuera del área original pueden tener desvíos." },
];

// ═══════════════════════════════════════════════════════
// MODELO FORRAJERO
// ═══════════════════════════════════════════════════════
const factorT   = (t) => t >= 25 ? 1.0 : t >= 20 ? 0.80 : t >= 15 ? 0.45 : t >= 10 ? 0.15 : 0.05;
const factorP   = (p) => p >= 100 ? 1.0 : p >= 50 ? 0.85 : p >= 20 ? 0.60 : 0.30;
const factorN   = (ndvi) => Math.min(1.5, Math.max(0.5, 0.5 + parseFloat(ndvi || 0.45) * 1.2));
const modENSO   = (e) => e === "nino" ? 1.25 : e === "nina" ? 0.75 : 1.0;
const mcalKgAdj = (t, fenol) => {
  const base = t >= 25 ? 2.10 : t >= 20 ? 1.90 : t >= 15 ? 1.50 : t >= 10 ? 1.00 : 0.65;
  return base * ({ menor_10:1.00, "10_25":0.95, "25_50":0.85, mayor_50:0.72 }[fenol] || 1.00);
};
const fAprovFenol = (fenol) => ({ menor_10:1.00, "10_25":0.90, "25_50":0.75, mayor_50:0.55 }[fenol] || 1.00);
const cvMSFenol  = (fenol) => ({ menor_10:0.028, "10_25":0.024, "25_50":0.020, mayor_50:0.016 }[fenol] || 0.025);
const calcOfPasto = (veg, ndvi, temp, precip, enso, fenol) => {
  const pb = PROD_BASE[veg] || 8;
  const kgMs = Math.max(0, pb * factorN(ndvi) * factorT(temp) * factorP(precip * modENSO(enso)) * UTIL * fAprovFenol(fenol));
  return kgMs * mcalKgAdj(temp, fenol);
};

// ═══════════════════════════════════════════════════════
// GEOGRAFÍA
// ═══════════════════════════════════════════════════════
function dZona(lat, lon) {
  if (lat > -28 && lat <= -25 && lon > -56 && lon <= -53) return "NEA";
  if (lat > -27 && lat <= -20 && lon > -58 && lon <= -54) return "Paraguay Oriental";
  if (lat > -25 && lat <= -20 && lon > -63 && lon <= -58) return "Chaco Paraguayo";
  if (lat > -25 && lat <= -10 && lon > -54 && lon <= -44) return "Brasil (Cerrado)";
  if (lat > -35 && lat <= -25 && lon > -57 && lon <= -44) return "Brasil (Sur)";
  if (lat > -23 && lat <= -15 && lon > -65 && lon <= -57) return "Bolivia (Llanos)";
  if (lat > -32) return "NEA";
  if (lat > -38 && lat <= -32 && lon > -62) return "Pampa Húmeda";
  if (lat > -38 && lat <= -32 && lon <= -62 && lon > -67) return "Semiárido";
  if (lon <= -67 && lat > -35) return "Cuyo";
  if (lat <= -38) return "Patagonia";
  return "NEA";
}

function dProv(lat, lon) {
  if (lat > -28 && lat <= -25 && lon > -56 && lon <= -53) return "Misiones";
  if (lat > -27 && lat <= -20 && lon > -58 && lon <= -54) return "Paraguay Oriental";
  if (lat > -25 && lat <= -20 && lon > -63 && lon <= -58) return "Chaco Paraguayo";
  if (lat > -25 && lat <= -10 && lon > -54 && lon <= -44) return "Mato Grosso / Goiás (BR)";
  if (lat > -35 && lat <= -25 && lon > -57 && lon <= -44) return "Rio Grande do Sul (BR)";
  if (lat > -22 && lat <= -15 && lon > -63 && lon <= -58) return "Pantanal (BR)";
  if (lat > -24 && lat <= -15 && lon > -58 && lon <= -54) return "Mato Grosso do Sul (BR)";
  if (lat > -22 && lat <= -15 && lon > -65 && lon <= -63) return "Santa Cruz / Beni (BO)";
  if (lat > -23 && lat <= -20 && lon > -66 && lon <= -63) return "Tarija / Chaco (BO)";
  if (lat > -23 && lon <= -62) return "Salta";
  if (lat > -23 && lon > -62) return "Formosa";
  if (lat > -31 && lat <= -24 && lon > -66 && lon <= -63) return "Santiago del Estero";
  if (lat > -26.5 && lat <= -23 && lon > -62 && lon <= -58) return "Formosa";
  if (lat > -32 && lat <= -26 && lon > -59 && lon <= -53) return "Corrientes";
  if (lat > -29 && lat <= -22 && lon > -66 && lon <= -58) return "Chaco";
  if (lat > -32 && lat <= -28 && lon > -60 && lon <= -57) return "Corrientes";
  if (lat > -34 && lat <= -30 && lon > -60.5 && lon <= -57) return "Entre Ríos";
  if (lat > -34 && lat <= -28 && lon > -64 && lon <= -59) return "Santa Fe";
  if (lat > -36 && lat <= -29 && lon > -66 && lon <= -62) return "Córdoba";
  if (lat > -40 && lat <= -34 && lon > -63 && lon <= -56) return "Buenos Aires";
  if (lat > -40 && lat <= -34 && lon > -68 && lon <= -63) return "La Pampa";
  if (lon <= -67 && lat > -36) return "Mendoza";
  if (lat <= -38 && lat > -43) return "Neuquén / Río Negro";
  if (lat <= -43) return "Patagonia Sur";
  return "Chaco";
}

const ndviBase = {
  "NEA":0.55,"Pampa Húmeda":0.50,"NOA":0.42,"Cuyo":0.30,"Patagonia":0.28,
  "Patagonia Sur":0.25,"Neuquén / Río Negro":0.30,
  "Paraguay Oriental":0.58,"Chaco Paraguayo":0.48,
  "Mato Grosso / Goiás (BR)":0.55,"Mato Grosso do Sul (BR)":0.56,
  "Rio Grande do Sul (BR)":0.52,"Pantanal (BR)":0.50,
  "Santa Cruz / Beni (BO)":0.50,"Tarija / Chaco (BO)":0.44,
};

function diasHelada(prov, ndvi, tempActual) {
  const h = HELADAS_PROV[prov];
  if (!h) return 999;
  const n = parseFloat(ndvi) || 0.45;
  const aj = n > 0.55 ? 7 : n < 0.35 ? -7 : 0;
  const hoy = new Date();
  let fd = new Date(hoy.getFullYear(), h.mes, h.dia + aj);
  if (fd < hoy) {
    if (tempActual !== undefined && parseFloat(tempActual) < 15) return 0;
    fd = new Date(hoy.getFullYear() + 1, h.mes, h.dia + aj);
  }
  return Math.round((fd - hoy) / (1000 * 60 * 60 * 24));
}

function calcDisp(prov, ndvi, temp) {
  const dH = diasHelada(prov, ndvi, temp);
  const tN = parseFloat(temp) || 20;
  if (dH === 0 || tN < 15) return { tipo:"Invierno activo — C4 restringido", dias: 0 };
  const mc = new Date().getMonth();
  const hist = getClima(prov);
  let dT = 999;
  for (let i = 1; i <= 6; i++) {
    if (hist[(mc + i) % 12].t < 15) { dT = i * 30; break; }
  }
  return { tipo: "Disparador C4", dias: Math.min(dH, dT) };
}

const fmtFecha = (d) => {
  if (!d || isNaN(new Date(d))) return "—";
  return new Date(d).toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit", year:"2-digit" });
};
const semaforo = (v, bajo, alto) => v >= alto ? "#7ec850" : v >= bajo ? "#d4952a" : "#c04820";
const ccPond = (dist) => {
  let s = 0, t = 0;
  (dist || []).forEach(d => { const p = parseFloat(d.pct) || 0, c = parseFloat(d.cc) || 0; s += p * c; t += p; });
  return t > 0 ? s / t : 0;
};

// ═══════════════════════════════════════════════════════
// CADENA REPRODUCTIVA
// FIX TERNERO: mayo1 calculado correctamente según mes del parto
// ═══════════════════════════════════════════════════════
function calcCadena(iniServ, finServ) {
  if (!iniServ || !finServ) return null;
  const ini = new Date(iniServ + "T12:00:00");
  const fin = new Date(finServ + "T12:00:00");
  if (isNaN(ini) || isNaN(fin) || fin <= ini) return null;
  const diasServ = Math.round((fin - ini) / (1000 * 60 * 60 * 24));
  const partoTemp = new Date(ini); partoTemp.setDate(partoTemp.getDate() + 280);
  const partoTard = new Date(fin); partoTard.setDate(partoTard.getDate() + 280);
  const hoy = new Date();
  // FIX: diasParto puede ser negativo si ya pasó → lo dejamos como está para mostrar "hace X días"
  const diasPartoTemp = Math.round((partoTemp - hoy) / (1000 * 60 * 60 * 24));
  const diasPartoTard = Math.round((partoTard - hoy) / (1000 * 60 * 60 * 24));

  const GDP = { trad: 0.400, antic: 0.350, hiper: 0.250 };

  const calcTipo = (refParto, diasLact, gdpPost) => {
    const pvDest = Math.round(35 + 0.700 * diasLact);
    const desteT = new Date(refParto); desteT.setDate(desteT.getDate() + diasLact);
    // FIX TERNERO: mayo1 del año correcto según mes del destete
    // Si el destete es antes de mayo de su año → mayo1 es ese año
    // Si el destete es en mayo o después → mayo1 es el año siguiente
    const anoRef = desteT.getFullYear();
    const mayo1candidato = new Date(anoRef, 4, 1);
    const mayo1 = mayo1candidato > desteT ? mayo1candidato : new Date(anoRef + 1, 4, 1);
    const diasPost = Math.max(0, Math.round((mayo1 - desteT) / (1000 * 60 * 60 * 24)));
    const pvMayo = Math.round(pvDest + gdpPost * diasPost);
    const mesDeste = desteT.getMonth();
    const terneroOtono = mesDeste >= 4 && mesDeste <= 5;
    const destePostMayo = diasPost <= 0;
    return { desteT, pvDest, pvMayo, terneroOtono, diasLact, destePostMayo };
  };

  const tiposTrad  = calcTipo(partoTemp, 180, GDP.trad);
  const tiposAntic = calcTipo(partoTemp, 90,  GDP.antic);
  const tiposHiper = calcTipo(partoTemp, 50,  GDP.hiper);

  // Para "tardío" solo calculamos el destete del parto tardío (tradicional)
  const tipoTardTrad = calcTipo(partoTard, 180, GDP.trad);

  const tipos = {
    trad:  { desteTemp:tiposTrad.desteT,  desteTard:tipoTardTrad.desteT, pvDest:tiposTrad.pvDest,  pvMayo:tiposTrad.pvMayo,  terneroOtono:tiposTrad.terneroOtono,  diasLact:180, destePostMayo:tiposTrad.destePostMayo  },
    antic: { desteTemp:tiposAntic.desteT, desteTard:tipoTardTrad.desteT, pvDest:tiposAntic.pvDest, pvMayo:tiposAntic.pvMayo, terneroOtono:tiposAntic.terneroOtono, diasLact:90,  destePostMayo:tiposAntic.destePostMayo },
    hiper: { desteTemp:tiposHiper.desteT, desteTard:tipoTardTrad.desteT, pvDest:tiposHiper.pvDest, pvMayo:tiposHiper.pvMayo, terneroOtono:tiposHiper.terneroOtono, diasLact:50,  destePostMayo:tiposHiper.destePostMayo },
  };

  const terneroOtono  = tiposTrad.terneroOtono;
  const desteTemp     = tiposTrad.desteT;
  const desteTard     = tipoTardTrad.desteT;
  const destePostMayo = tiposTrad.destePostMayo;

  // Vaquillona nacida ~45d después del parto temprano
  const nacVaq = new Date(partoTemp); nacVaq.setDate(nacVaq.getDate() + 45);
  const anoNacVaq = nacVaq.getFullYear();
  const mayo1Inv = new Date(anoNacVaq, 4, 1) > nacVaq
    ? new Date(anoNacVaq, 4, 1)
    : new Date(anoNacVaq + 1, 4, 1);
  const edadMayo = Math.round((mayo1Inv - nacVaq) / (1000 * 60 * 60 * 24 * 30));
  const pvMayo1Inv = Math.round(35 + 0.700 * (mayo1Inv - nacVaq) / (1000 * 60 * 60 * 24));

  return {
    ini, fin, diasServ, partoTemp, partoTard, diasPartoTemp, diasPartoTard,
    tipos, terneroOtono, desteTemp, desteTard, destePostMayo,
    nacVaq, mayo1Inv, edadMayo, pvMayo1Inv,
  };
}

// ═══════════════════════════════════════════════════════
// CC — INTERPOLACIÓN Y TRAYECTORIA
// ═══════════════════════════════════════════════════════
const CC_PR = [
  {ccP:6.5,pr:95},{ccP:6.0,pr:88},{ccP:5.5,pr:75},{ccP:5.0,pr:55},
  {ccP:4.5,pr:35},{ccP:4.0,pr:15},{ccP:3.5,pr:5},
];
function interpCC(ccP) {
  if (ccP >= CC_PR[0].ccP) return { pr: CC_PR[0].pr };
  if (ccP <= CC_PR[CC_PR.length-1].ccP) return { pr: CC_PR[CC_PR.length-1].pr };
  for (let i = 0; i < CC_PR.length - 1; i++) {
    if (ccP <= CC_PR[i].ccP && ccP >= CC_PR[i+1].ccP) {
      const r = (ccP - CC_PR[i+1].ccP) / (CC_PR[i].ccP - CC_PR[i+1].ccP);
      return { pr: Math.round(CC_PR[i+1].pr + r * (CC_PR[i].pr - CC_PR[i+1].pr)) };
    }
  }
  return { pr: 15 };
}

function calcTrayectoriaCC(dist, cadena, destTrad, destAntic, destHiper, dDisp, supHa, vacasN) {
  const ccHoy = ccPond(dist);
  if (!ccHoy || !cadena) return null;
  const ha = parseFloat(supHa) || 100;
  const vN = parseFloat(vacasN) || 50;
  const cargaEV = vN / ha;
  const ajCarga = cargaEV > 0.8 ? -0.004 : cargaEV > 0.5 ? -0.002 : 0;
  const tR = Math.max(0.006, 0.013 + (0.45 - 0.35) * 0.04 + ajCarga);
  const tP = 0.007;
  const dD = Math.max(0, dDisp || 90);

  // FIX: usar Math.max(0,...) para que diasPartoTemp negativo no rompa
  const diasHastaParto = Math.max(0, cadena.diasPartoTemp || 0);
  const diasRecupPreParto = Math.min(diasHastaParto, dD);
  const diasPerdPreParto  = Math.max(0, diasHastaParto - dD);
  const ccParto = parseFloat(Math.min(9, Math.max(1,
    ccHoy + tR * diasRecupPreParto - tP * diasPerdPreParto
  )).toFixed(2));

  const pT = parseFloat(destTrad)  || 0;
  const pA = parseFloat(destAntic) || 0;
  const pH = parseFloat(destHiper) || 0;
  const tot = pT + pA + pH || 100;
  const mesesLact = (pT * (180/30) + pA * (90/30) + pH * (50/30)) / tot;

  const tasaCaida = ccParto >= 6 ? 0.40 : ccParto >= 5 ? 0.50 : 0.60;
  const caídaLact = Math.min(2.5, mesesLact * tasaCaida);
  const ccDestete = parseFloat(Math.max(1, ccParto - caídaLact).toFixed(2));
  const diasRecupServicio = Math.min(90, dD);
  const ccServ = parseFloat(Math.min(9, Math.max(1,
    ccDestete + tR * diasRecupServicio
  )).toFixed(2));

  return {
    ccHoy, ccParto, ccDestete, ccServ, pr: interpCC(ccServ).pr,
    mesesLact: mesesLact.toFixed(1), diasRecupPreParto, diasPerdPreParto,
    caídaLact: caídaLact.toFixed(2), diasRecupServicio,
  };
}

function calcDistCCServicio(dist, cadena, ndvi, prov, destTrad, destAntic, destHiper, supHa, vacasN, dDisp) {
  if (!dist || !cadena) return { grupos:[], caídaLact:"0", mesesLact:"0", diasLactPond:0 };
  const ndviN = parseFloat(ndvi) || 0.45;
  const ha = parseFloat(supHa) || 100;
  const vN2 = parseFloat(vacasN) || 50;
  const cargaEV = vN2 / ha;
  const ajCarga = cargaEV > 0.8 ? -0.004 : cargaEV > 0.5 ? -0.002 : 0;
  const tR = Math.max(0.006, 0.013 + (ndviN - 0.35) * 0.04 + ajCarga);
  const tP = 0.007;
  const dD = Math.max(0, dDisp || 90);
  const pTrad = parseFloat(destTrad) || 0, pAntic = parseFloat(destAntic) || 0, pHiper = parseFloat(destHiper) || 0;
  const totalD = pTrad + pAntic + pHiper || 100;
  const diasLactPond = (pTrad/totalD)*180 + (pAntic/totalD)*90 + (pHiper/totalD)*50;
  const mesesLact = diasLactPond / 30;
  const diasRecupPostDest = Math.min(90, dD);
  // FIX: diasPartoTemp puede ser negativo → Math.max(0,...)
  const diasHastaParto = Math.max(0, cadena.diasPartoTemp || 0);
  const diasRecupPreParto = Math.min(diasHastaParto, dD);
  const diasPerdPreParto  = Math.max(0, diasHastaParto - dD);
  const grupos = (dist || []).map(d => {
    const ccH = parseFloat(d.cc) || 0, pct = parseFloat(d.pct) || 0;
    if (!ccH || !pct) return null;
    const ccParto = parseFloat(Math.min(9, Math.max(1, ccH + tR*diasRecupPreParto - tP*diasPerdPreParto)).toFixed(2));
    const tc = ccParto >= 6 ? 0.40 : ccParto >= 5 ? 0.50 : 0.60;
    const ccDestete = parseFloat(Math.max(1, ccParto - Math.min(2.5, mesesLact*tc)).toFixed(2));
    const ccServ = parseFloat(Math.min(9, Math.max(1, ccDestete + tR*diasRecupPostDest)).toFixed(2));
    const pr = interpCC(ccServ).pr;
    const recDestete = ccServ < 4.5 ? "⚡ Hiperprecoz (50d)" : ccServ < 5.0 ? "🔶 Anticipado (90d)" : "🟢 Tradicional (180d)";
    const urgencia  = ccServ < 4.5 ? "urgente" : ccServ < 5.0 ? "importante" : "preventivo";
    return { ccHoy:ccH, pct, ccParto, ccDestete, ccServ, pr, recDestete, urgencia };
  }).filter(Boolean);
  return { grupos, caídaLact:(mesesLact*0.50).toFixed(2), mesesLact:mesesLact.toFixed(1), diasLactPond:Math.round(diasLactPond) };
}

// ═══════════════════════════════════════════════════════
// TERNEROS
// ═══════════════════════════════════════════════════════
function calcTerneros(vacasN, prenez, pctDestete, destTrad, destAntic, destHiper, cadena) {
  const vN = parseInt(vacasN) || 0;
  const terneros = Math.round(vN * ((parseFloat(prenez)||0)/100) * ((parseFloat(pctDestete)||0)/100));
  const pT = Math.max(0, parseFloat(destTrad)  || 0);
  const pA = Math.max(0, parseFloat(destAntic) || 0);
  const pH = Math.max(0, parseFloat(destHiper) || 0);
  const total = pT + pA + pH;
  if (!total || !terneros || !cadena?.tipos) return { terneros, pvMayoPond:0, detalle:[], alertaHiper:false };
  const pvTrad  = cadena.tipos.trad?.pvMayo  || 0;
  const pvAntic = cadena.tipos.antic?.pvMayo || 0;
  const pvHiper = cadena.tipos.hiper?.pvMayo || 0;
  const pvMayoPond = Math.round((pT*pvTrad + pA*pvAntic + pH*pvHiper) / total);
  const alertaHiper = pH > 30;
  const detalle = [
    { key:"trad",  label:"Tradicional", pct:pT/total, n:Math.round(terneros*pT/total), pvDest:cadena.tipos.trad?.pvDest||0, pvMayo:pvTrad  },
    { key:"antic", label:"Anticipado",  pct:pA/total, n:Math.round(terneros*pA/total), pvDest:cadena.tipos.antic?.pvDest||0, pvMayo:pvAntic },
    { key:"hiper", label:"Hiperprecoz", pct:pH/total, n:Math.round(terneros*pH/total), pvDest:cadena.tipos.hiper?.pvDest||0, pvMayo:pvHiper },
  ].filter(d => d.pct > 0);
  return { terneros, pvMayoPond, detalle, alertaHiper };
}

// ═══════════════════════════════════════════════════════
// VAQUILLONA 1° INVIERNO
// ═══════════════════════════════════════════════════════
const DIAS_TOTAL_VAQ1 = 120;
function calcVaq1(pvEntrada, pvAdulta, ndvi) {
  const pvE = parseFloat(pvEntrada) || 0;
  const pvA = parseFloat(pvAdulta) || 320;
  const ndviN = parseFloat(ndvi) || 0.45;
  if (!pvE || pvE < 50) return null;
  const objetivo = Math.round(pvA * 0.65);
  const necesita = objetivo - pvE;
  if (necesita <= 0) return {
    esc:"—", prot:0, energ:0, freq:"Sin suplementación",
    gdpReal:0, pvSal:pvE, pvAbr2Inv:Math.round(pvE + 0.450*120),
    deficit:false, mensaje:`✅ Ya supera el objetivo (${objetivo} kg)`,
  };
  const gdpNec = Math.round((necesita / DIAS_TOTAL_VAQ1) * 1000);
  const gdpReal = Math.min(500, Math.max(100, gdpNec));
  let esc, prot, energ, freq;
  if      (gdpReal <= 450 && ndviN >= 0.40) { esc="A";  prot=+(pvE*0.004 ).toFixed(2); energ=0;                     freq="3×/semana"; }
  else if (gdpReal <= 550 && ndviN >= 0.30) { esc="B";  prot=+(pvE*0.007 ).toFixed(2); energ=0;                     freq="Diario"; }
  else                                       { esc="C";  prot=+(pvE*0.0065).toFixed(2); energ=+(pvE*0.0035).toFixed(2); freq="Diario"; }
  if (esc === "B" && ndviN > 0.60) { esc="A+"; prot=+(pvE*0.006).toFixed(2); energ=0; freq="Diario"; }
  if (esc === "A" && ndviN < 0.30) { esc="B";  prot=+(pvE*0.007).toFixed(2); energ=0; freq="Diario"; }
  const pvSal = Math.round(pvE + gdpReal * DIAS_TOTAL_VAQ1 / 1000);
  return { esc, prot, energ, freq, gdpReal, pvSal, pvAbr2Inv:Math.round(pvSal + 0.300*210), deficit:pvSal < objetivo, objetivo };
}

// ═══════════════════════════════════════════════════════
// VAQUILLONA 2° INVIERNO
// ═══════════════════════════════════════════════════════
const DIAS_TOTAL_VAQ2 = 120;
function calcVaq2(pvEntrada, pvAdulta, ndvi) {
  const pvA = parseFloat(pvAdulta) || 320;
  const ndviN = parseFloat(ndvi) || 0.45;
  if (!pvEntrada || parseFloat(pvEntrada) < 80) {
    return { _aviso:"Sin PV entrada — usando 280 kg por defecto", ...calcVaq2("280", pvAdulta, ndvi) };
  }
  const pvE = parseFloat(pvEntrada);
  const pvMinEntore = Math.round(pvA * 0.75);
  if (pvE >= pvMinEntore) return { esc:"—", prot:0, energ:0, freq:"Sin suplementación", gdpReal:0, pvEntore:pvE, pvMinEntore, llegas:true };
  const gdpNec = Math.round(((pvMinEntore - pvE) / DIAS_TOTAL_VAQ2) * 1000);
  const gdpReal = Math.min(500, Math.max(100, gdpNec));
  let esc, prot, energ, freq;
  if      (gdpReal <= 400 && ndviN >= 0.40) { esc="A"; prot=+(pvE*0.004 ).toFixed(2); energ=0;                     freq="3×/semana"; }
  else if (gdpReal <= 500 && ndviN >= 0.30) { esc="B"; prot=+(pvE*0.007 ).toFixed(2); energ=0;                     freq="Diario"; }
  else                                       { esc="C"; prot=+(pvE*0.0065).toFixed(2); energ=+(pvE*0.0035).toFixed(2); freq="Diario"; }
  const pvEntore = Math.round(pvE + gdpReal * DIAS_TOTAL_VAQ2 / 1000);
  return { esc, prot, energ, freq, gdpReal, pvEntore, pvMinEntore, llegas:pvEntore >= pvMinEntore };
}

function reqEM(pv, cat) {
  const p = parseFloat(pv) || 0; if (!p) return null;
  const f = {
    "Gestación temprana (1–4 meses)":1.15, "Gestación media (5–7 meses)":1.20,
    "Preparto (último mes)":1.35, "Lactación con ternero al pie":1.90, "Vaca seca sin ternero":1.00,
    "vaca2serv":2.00, "vaq1inv":1.30, "vaq2inv":1.20,
  }[cat] || 1.10;
  return +(Math.pow(p, 0.75) * 0.077 * f).toFixed(1);
}

// ═══════════════════════════════════════════════════════
// FETCH SAT — Open-Meteo
// ═══════════════════════════════════════════════════════
async function fetchSat(lat, lon, zona, prov, enso, cb) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration&past_days=30&forecast_days=1&timezone=auto`;
    const d = await (await fetch(url)).json();
    if (!d?.daily?.precipitation_sum) throw new Error("Sin datos");
    const prec = d.daily.precipitation_sum || [];
    const tMax = d.daily.temperature_2m_max || [];
    const tMin = d.daily.temperature_2m_min || [];
    const et0  = d.daily.et0_fao_evapotranspiration || [];
    const p7  = Math.round(prec.slice(-7).reduce((a,b) => a+(b||0),0));
    const p30 = Math.round(prec.reduce((a,b) => a+(b||0),0));
    const et07 = Math.round(et0.slice(-7).reduce((a,b) => a+(b||0),0));
    const temp = parseFloat(((tMax.slice(-7).reduce((a,b)=>a+(b||0),0) + tMin.slice(-7).reduce((a,b)=>a+(b||0),0)) / (tMax.slice(-7).length*2)).toFixed(1));
    const m = modENSO(enso);
    const nb = ndviBase[zona] || 0.48;
    const ndviAdj = Math.min(0.95, Math.max(0.15, nb * (0.6 + p30/300) * m)).toFixed(2);
    const cond = ndviAdj > 0.60 ? "Excelente" : ndviAdj > 0.45 ? "Buena" : ndviAdj > 0.30 ? "Regular" : "Crítica";
    cb({ temp, tMax:Math.round(Math.max(...tMax.slice(-7))), tMin:Math.round(Math.min(...tMin.slice(-7))), p7, p30, deficit:Math.round(p30-et07*4.3), ndvi:ndviAdj, cond, et07 });
  } catch (e) { cb({ error:"No se pudieron obtener datos satelitales: "+e.message }); }
}

// ═══════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════
const SYS = `Actuás como asesor técnico experto en sistemas de cría bovina extensiva en NEA, NOA, Paraguay, Brasil y Bolivia. 20 años de campo en pasturas megatérmicas C4.

EJE CENTRAL: FECHA DE SERVICIO → CADENA REPRODUCTIVA
El inicio y fin de servicio determinan: fecha de parto, fecha de destete, CC disponible para recuperación, situación de la vaquillona en cada etapa.
Vaca que se preña al FINAL del servicio → parto tardío → destete en otoño → riesgo ternero al pie en época crítica → destete anticipado o hiperprecoz.

DESTETE: palanca principal para recuperación CC. Recuperación válida HASTA disparador (<15°C C4). Post-disparador: pérdida según NDVI.
NDVI: proxy actividad fotosintética (Paruelo & Oesterheld 2000). La fenología de campo es el dato primario.
DISPARADOR: temp <15°C — C4 frena crecimiento y calidad abruptamente.

CURVA CC→PREÑEZ (Peruchena INTA 2003): 6.5→95% | 6.0→88% | 5.5→75% | 5.0→55% | 4.5→35% | 4.0→15%
REQUERIMIENTOS (NASSEM 2010; Detmann et al. 2014): PV^0.75 × 0.077 × factor categoría.

MODELO OFERTA (Paruelo & Oesterheld 2000; Peruchena INTA 2003; UF/IFAS Sollenberger 2000):
PPNA = prodBase × factorN(NDVI,techo 1.5) × factorT(temp) × factorP(precip×ENSO) × UTIL 0.40 × fAprov(fenol)
Pastizal natural NEA: 8 kg MS/ha/día base | Megatérmicas C4: 14

VAQ 1°INV (mayo–agosto, 120 días): SIEMPRE requiere suplementación. NO mencionar creep feeding. Dosis en kg/día.
VAQ 2°INV: PV ≥ 0.75×PV adulta al entore. GDP mínimo 300 g/día.

5 SECCIONES OBLIGATORIAS — usar EXACTAMENTE estos emojis al inicio de cada sección:
1️⃣ DIAGNÓSTICO AMBIENTAL: zona, NDVI, temp REAL, disparador en días, ENSO, fechas servicio/parto/destete.
2️⃣ DIAGNÓSTICO POR CATEGORÍA: requerimientos Mcal vs oferta por categoría. CC ponderada. Balance con números.
3️⃣ DESTETE Y PROYECCIÓN CC: 3 tramos con números reales. CC actual → movilización → CC al servicio → preñez esperada. Alerta vaca tardía si aplica.
4️⃣ BALANCE OFERTA vs DEMANDA: oferta Mcal/día vs demanda total. Déficit o superávit. Meses críticos.
5️⃣ RECOMENDACIONES: lista priorizada semáforo 🔴🟡🟢. Suplementación con dosis exactas en kg/día.

AL FINAL siempre el DISCLAIMER completo.
Citar: (NASSEM,2010)·(Peruchena,INTA 2003)·(Detmann et al.,2014)·(Paruelo & Oesterheld,2000)·(Oesterheld et al.,1998)·(Rosello Brajovich et al.,INTA 2025)`;

// ═══════════════════════════════════════════════════════
// BUILD PROMPT
// ═══════════════════════════════════════════════════════
function buildPrompt(form, coords, sat, dispar, cadena, trayCC, curva, ccPondVal,
                     distCCServ, vaq1E, vaq2E, nVaqRepos, tcSave, usaPotreros, potreros) {
  const hoy = new Date().toLocaleDateString("es-AR",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  let t = `ANÁLISIS — FECHA: ${hoy}\n`;
  if (coords) t += `UBICACIÓN: ${coords.lat?.toFixed(4)}°S ${coords.lon?.toFixed(4)}°W · ${form.zona} · ${form.provincia}\n`;
  if (sat?.temp) t += `MET REAL: T${sat.temp}°C (Mx${sat.tMax}/Mn${sat.tMin}) · P7d:${sat.p7}mm P30d:${sat.p30}mm · Bal:${sat.deficit>0?"+":""}${sat.deficit}mm · NDVI:${sat.ndvi}(${sat.cond})\n`;
  t += `ENSO: ${form.enso==="nino"?"El Niño +25%":form.enso==="nina"?"La Niña −25%":"Neutro"}\n`;
  if (dispar) t += `DISPARADOR: ${dispar.tipo} ~${dispar.dias < 999 ? dispar.dias+"d" : "sin disparador próximo"}\n`;
  if (cadena) {
    t += `\nSERVICIO: ${fmtFecha(cadena.ini)} → ${fmtFecha(cadena.fin)} (${cadena.diasServ}d)\n`;
    t += `PARTO: temprano ${fmtFecha(cadena.partoTemp)} · tardío ${fmtFecha(cadena.partoTard)}\n`;
    t += `DESTETE: temprano ${fmtFecha(cadena.desteTemp)} · tardío ${fmtFecha(cadena.desteTard)}\n`;
    t += `MODALIDADES: Trad ${form.destTrad||0}% / Antic ${form.destAntic||0}% / Hiper ${form.destHiper||0}%\n`;
    if (cadena.terneroOtono) t += `⚠️ ALERTA CRÍTICA: VACA TARDÍA con ternero al pie en otoño — destete anticipado o hiperprecoz URGENTE\n`;
    if (cadena.destePostMayo) t += `⚠️ DESTETE TARDÍO: vacas de fin de servicio destetan después de mayo\n`;
    t += `Vaquillona: nace ~${fmtFecha(cadena.nacVaq)} · mayo 1°inv: ${fmtFecha(cadena.mayo1Inv)} (${cadena.edadMayo}m) · PV est: ${cadena.pvMayo1Inv}kg\n`;
  }
  t += `\nDIST CC: ${form.ccDist.map(d=>`${d.pct}%→CC${d.cc}`).join(" | ")} · Pond: ${ccPondVal.toFixed(1)}/9\n`;
  t += `PV adulta: ${form.pvVacaAdulta||"—"}kg · Estado: ${form.eReprod||"—"}\n`;
  if (form.pvVacaAdulta && form.eReprod) { const r=reqEM(form.pvVacaAdulta,form.eReprod); if(r) t+=`Req EM: ${r} Mcal/d\n`; }
  if (trayCC) t += `CC PARTO: ${trayCC.ccParto} · CC DESTETE: ${trayCC.ccDestete} · CC SERV: ${trayCC.ccServ} → Preñez: ${curva?.pr||"—"}%\n`;
  if (distCCServ?.grupos?.length) t += `GRUPOS: ${distCCServ.grupos.map(g=>`CC${g.ccHoy}(${g.pct}%)→serv${g.ccServ}:${g.pr}%:${g.recDestete}`).join(" | ")}\n`;
  t += `\nRODEO: ${form.vacasN||"—"} vacas · ${form.torosN||"—"} toros · Preñez hist ${form.prenez||"—"}%\n`;
  t += `2°SERV: N°${form.v2sN||"—"} · PV ${form.v2sPV||"—"}kg · Ternero: ${form.v2sTernero||"—"}\n`;
  t += `DIST CC 2°SERV: ${form.cc2sDist.map(d=>`${d.pct}%→CC${d.cc}`).join(" | ")} · Pond: ${ccPond(form.cc2sDist).toFixed(1)}/9\n`;
  if (usaPotreros && potreros.length) {
    const tot = potreros.reduce((s,p)=>s+(parseFloat(p.ha)||0),0);
    t += `\nPOTREROS: ${potreros.length} · ${tot}ha\n`;
    potreros.forEach((p,i)=>t+=`  P${i+1}: ${p.ha||"—"}ha · ${p.veg} · ${p.fenol||"—"}\n`);
  } else {
    const sT=parseFloat(form.supHa)||0, sM=parseFloat(form.pctMonte)||0, sN=parseFloat(form.pctNGan)||0;
    const sP=Math.max(0,100-sM-sN);
    t += `\nCAMPO: ${sT}ha · Pastizal ${Math.round(sT*sP/100)}ha (${sP.toFixed(0)}%) · Monte ${Math.round(sT*sM/100)}ha · No gan ${Math.round(sT*sN/100)}ha\n`;
  }
  t += `FORRAJE: ${form.fenologia||"—"} · ${form.vegetacion||"—"}\n`;
  t += `CARGA: ${form.supHa&&form.vacasN?((parseInt(form.vacasN)||0)/(parseFloat(form.supHa)||1)).toFixed(2):"—"} EV/ha\n`;
  t += `\nVAQ1 REPOS: ${form.pctReposicion||"—"}% × ${form.vacasN||"—"} = ${nVaqRepos} vaq · PV entrada: ${tcSave?.pvMayoPond||"—"}kg\n`;
  if (vaq1E && !vaq1E.mensaje) t += `ESC VAQ1: ${vaq1E.esc} · ${vaq1E.prot}kgProt${vaq1E.energ>0?"+"+vaq1E.energ+"kgMaíz":""} · ${vaq1E.freq} · GDP ${vaq1E.gdpReal}g/d → ${vaq1E.pvSal}kg · post-inv: ${vaq1E.pvAbr2Inv}kg\n`;
  t += `VAQ2: N°${form.vaq2N||"—"} · PV entrada: ${vaq1E?.pvAbr2Inv||form.vaq2PV||"—"}kg\n`;
  if (vaq2E && !vaq2E._aviso) t += `ESC VAQ2: ${vaq2E.esc} · GDP ${vaq2E.gdpReal}g/d → ${vaq2E.pvEntore}kg (mín ${vaq2E.pvMinEntore}kg)${!vaq2E.llegas?" ⚠️NO LLEGA":""}\n`;
  if (form.suplem) t += `Supl actual: ${form.suplem}\n`;
  if (form.consulta) t += `\nCONSULTA: ${form.consulta}\n`;
  t += "\n→ Exactamente 5 secciones con emojis numerados 1️⃣–5️⃣. NO repetir datos crudos, solo interpretación y acción.";
  return t;
}

// ═══════════════════════════════════════════════════════
// ESTILOS GLOBALES
// ═══════════════════════════════════════════════════════
if (typeof document !== "undefined" && !document.getElementById("agm-styles")) {
  const s = document.createElement("style");
  s.id = "agm-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
    body{margin:0;background:#08100a;overscroll-behavior:none;}
    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
    input[type=number]{-moz-appearance:textfield;}
    input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.6) sepia(1) hue-rotate(60deg);}
    ::-webkit-scrollbar{width:3px;}
    ::-webkit-scrollbar-thumb{background:rgba(126,200,80,.25);border-radius:2px;}
    .agm-enter{animation:agmIn .22s ease-out;}
    @keyframes agmIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
    .agm-pulse{animation:agmPulse 2s ease-in-out infinite;}
    @keyframes agmPulse{0%,100%{opacity:1;}50%{opacity:.45};}
    .agm-spin{animation:agmSpin 1s linear infinite;display:inline-block;}
    @keyframes agmSpin{to{transform:rotate(360deg);}}
    details>summary{list-style:none;}
    details>summary::-webkit-details-marker{display:none;}
  `;
  document.head.appendChild(s);
}

const C = {
  bg:"#08100a", card:"#0f1a10", border:"rgba(126,200,80,.14)", borderAct:"rgba(126,200,80,.35)",
  green:"#7ec850", greenDim:"rgba(126,200,80,.55)",
  amber:"#d4952a", amberDim:"rgba(212,149,42,.55)",
  red:"#c04820",   redDim:"rgba(192,72,32,.55)",
  blue:"#4a9fd4",
  text:"#d8ecd0", textDim:"#8aaa7a", textFaint:"rgba(160,190,140,.32)",
  font:"'JetBrains Mono',monospace",
};

const T = {
  inp: {
    width:"100%", background:"rgba(0,0,0,.40)", border:`1px solid ${C.border}`,
    borderRadius:10, color:C.text, padding:"14px 12px",
    fontSize:16, fontFamily:C.font, boxSizing:"border-box", outline:"none",
  },
  lbl: {
    fontFamily:C.font, fontSize:11, color:C.textDim, textTransform:"uppercase",
    letterSpacing:1.2, display:"block", marginBottom:6,
  },
  card: { background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:16, marginBottom:12 },
};

function BtnSel({ active, color, onClick, children, style={} }) {
  const cl = color || C.green;
  return (
    <button onClick={onClick} style={{
      background: active ? `${cl}18` : "rgba(0,0,0,.28)",
      border:`1.5px solid ${active ? cl : C.border}`,
      borderRadius:12, color: active ? cl : C.textDim,
      padding:"13px 8px", fontFamily:C.font, fontSize:13, cursor:"pointer",
      textAlign:"center", width:"100%", display:"block",
      transition:"all .15s", lineHeight:1.3, ...style,
    }}>{children}</button>
  );
}

function Alerta({ tipo, children }) {
  const cfg = {
    warn:  { bg:"rgba(212,149,42,.08)", border:"rgba(212,149,42,.25)", color:C.amber, icon:"⚠️" },
    error: { bg:"rgba(192,72,32,.08)",  border:"rgba(192,72,32,.25)",  color:C.red,   icon:"🔴" },
    ok:    { bg:"rgba(126,200,80,.08)", border:"rgba(126,200,80,.25)", color:C.green, icon:"✅" },
    info:  { bg:"rgba(74,159,212,.08)", border:"rgba(74,159,212,.25)", color:C.blue,  icon:"ℹ️" },
  }[tipo] || { bg:"rgba(255,255,255,.04)", border:C.border, color:C.textDim, icon:"·" };
  return (
    <div style={{ background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:10,
      padding:"10px 12px", fontFamily:C.font, fontSize:12, color:cfg.color,
      lineHeight:1.55, marginBottom:8, display:"flex", gap:8, alignItems:"flex-start" }}>
      <span style={{flexShrink:0}}>{cfg.icon}</span><span>{children}</span>
    </div>
  );
}

function SecTitle({ icon, label, color }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
      <span style={{fontSize:16}}>{icon}</span>
      <span style={{ fontFamily:C.font, fontSize:11, color:color||C.green,
        fontWeight:600, letterSpacing:1.5, textTransform:"uppercase" }}>{label}</span>
      <div style={{ flex:1, height:1, background:C.border }}/>
    </div>
  );
}

function MetricCard({ label, value, color, sub, style={} }) {
  return (
    <div style={{ textAlign:"center", background:"rgba(0,0,0,.35)", borderRadius:12,
      padding:"12px 6px", border:`1px solid ${C.border}`, ...style }}>
      <div style={{ fontFamily:C.font, fontSize:11, color:C.textDim, marginBottom:4, lineHeight:1.2 }}>{label}</div>
      <div style={{ fontFamily:C.font, fontSize:18, color:color||C.text, fontWeight:700, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

function DistCC({ dist, onChange, label }) {
  const suma = dist.reduce((s,d) => s + (parseFloat(d.pct)||0), 0);
  const ok = Math.abs(suma - 100) < 1;
  return (
    <div>
      {label && <div style={T.lbl}>{label}</div>}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:6 }}>
        {dist.map((d,i) => (
          <div key={i} style={{ background:"rgba(0,0,0,.3)", borderRadius:10,
            padding:"10px 8px", border:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, marginBottom:5, textAlign:"center" }}>CC {d.cc}</div>
            <input type="number" inputMode="decimal" value={d.cc}
              onChange={e=>onChange(dist.map((x,j)=>j===i?{...x,cc:e.target.value}:x))}
              style={{...T.inp,padding:"8px 6px",fontSize:14,textAlign:"center",marginBottom:6}} placeholder="5.0"/>
            <input type="number" inputMode="decimal" value={d.pct}
              onChange={e=>onChange(dist.map((x,j)=>j===i?{...x,pct:e.target.value}:x))}
              style={{...T.inp,padding:"8px 6px",fontSize:14,textAlign:"center"}} placeholder="%"/>
          </div>
        ))}
      </div>
      <div style={{ textAlign:"right", fontFamily:C.font, fontSize:11, color:ok?C.greenDim:C.red }}>
        Σ {suma.toFixed(0)}% {ok ? "✓" : "← debe sumar 100%"}
      </div>
    </div>
  );
}

function getGPS_safe(onSuccess, onError) {
  if (!navigator.geolocation) { onError("Tu dispositivo no soporta geolocalización."); return; }
  navigator.geolocation.getCurrentPosition(
    p => onSuccess(p.coords.latitude, p.coords.longitude),
    e => {
      const msgs = {
        1:"Permiso denegado. Habilitá la ubicación en Ajustes del navegador.",
        2:"No se pudo determinar la ubicación. Intentá de nuevo o ingresá manualmente.",
        3:"Tiempo de espera agotado. Intentá de nuevo o ingresá manualmente.",
      };
      onError(msgs[e.code] || "Error de GPS");
    },
    { timeout:10000, maximumAge:60000 },
  );
}

function validarManual(lat, lon) {
  if (isNaN(lat) || isNaN(lon)) return "Coordenadas inválidas";
  if (lat > -15 || lat < -55) return "Latitud fuera del rango de cobertura (−15° a −55°)";
  if (lon > -44 || lon < -74) return "Longitud fuera del rango de cobertura (−44° a −74°)";
  return null;
}

function SelectorUbicacion({ onSelect }) {
  const [q,setQ]=useState("");
  const [res,setRes]=useState([]);
  const [loading,setLoading]=useState(false);
  useEffect(()=>{
    if (q.length < 3) { setRes([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await (await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=es`
        )).json();
        setRes(data || []);
      } catch { setRes([]); }
      finally { setLoading(false); }
    }, 400);
    return () => clearTimeout(t);
  },[q]);
  return (
    <div style={{ position:"relative", marginBottom:8 }}>
      <div style={{ position:"relative" }}>
        <input value={q} onChange={e=>setQ(e.target.value)}
          placeholder="Buscar ciudad o establecimiento (AR/PY/BR/BO)..."
          style={T.inp}/>
        {loading && <span style={{ position:"absolute", right:12, top:"50%",
          transform:"translateY(-50%)", color:C.green, fontSize:16 }} className="agm-spin">⟳</span>}
      </div>
      {res.length > 0 && (
        <div style={{ position:"absolute", zIndex:100, width:"100%",
          background:"#0d1f0a", border:`1px solid ${C.borderAct}`, borderRadius:10,
          marginTop:4, overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,.65)" }}>
          {res.map((r,i)=>(
            <button key={i} onMouseDown={()=>{
              onSelect(parseFloat(r.lat), parseFloat(r.lon), r.display_name?.split(",")[0]);
              setQ(r.display_name?.split(",").slice(0,2).join(", ")); setRes([]);
            }} style={{ display:"block", width:"100%", textAlign:"left", background:"none",
              border:"none", borderBottom: i<res.length-1?`1px solid rgba(126,200,80,.07)`:"none",
              padding:"12px 14px", fontFamily:C.font, fontSize:12, color:C.text, cursor:"pointer", lineHeight:1.4 }}>
              <div style={{fontWeight:600}}>📍 {r.display_name?.split(",")[0]}</div>
              <div style={{fontSize:10, color:C.textDim, marginTop:2}}>{r.display_name?.split(",").slice(1,3).join(",")}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GraficoBalance({ form, sat, cadena, trayCC, usaPotreros, potreros }) {
  if (!sat || sat.error || !cadena) return null;
  const prov   = form.provincia || "Corrientes";
  const hist   = getClima(prov);
  const mc     = new Date().getMonth();
  const mesP   = cadena.partoTemp ? cadena.partoTemp.getMonth() : 10;
  const enso   = form.enso || "neutro";
  const pT=parseFloat(form.destTrad)||0, pA=parseFloat(form.destAntic)||0, pH=parseFloat(form.destHiper)||0;
  const totD = pT+pA+pH || 100;
  const mesesLactGraf = Math.max(1.5,(pT*(180/30)+pA*(90/30)+pH*(50/30))/totD);
  const pvVaca = parseFloat(form.pvVacaAdulta) || 320;
  const vN=parseInt(form.vacasN)||0, v2N=parseInt(form.v2sN)||0;
  const q1N=Math.round(vN*(parseFloat(form.pctReposicion)||0)/100);
  const q2N=parseInt(form.vaq2N)||0;
  const nTotal = Math.max(1,vN+v2N+q1N+q2N);

  const datos = MESES_C.map((mes,i) => {
    const h = i===mc && sat ? {t:parseFloat(sat.temp)||hist[i].t,p:parseFloat(sat.p30)||hist[i].p} : hist[i];
    const ndviI = i===mc ? parseFloat(sat.ndvi||0.45) : 0.45;
    const fenolMs = i===mc?(form.fenologia||"menor_10"):(h.t<15?"mayor_50":h.t<20?"25_50":h.t<25?"10_25":"menor_10");
    let ofTotal=0;
    if (usaPotreros && potreros?.length) {
      potreros.forEach(p=>{const ha=parseFloat(p.ha)||0;if(!ha||!p.veg)return;
        ofTotal+=calcOfPasto(p.veg,ndviI,h.t,h.p,enso,i===mc?p.fenol||"menor_10":fenolMs)*ha;});
    } else {
      const sup=parseFloat(form.supHa)||100,pctM=parseFloat(form.pctMonte)||0,pctN=parseFloat(form.pctNGan)||0;
      ofTotal=calcOfPasto(form.vegetacion||"Pastizal natural NEA/Chaco",ndviI,h.t,h.p,enso,fenolMs)*sup*Math.max(0,100-pctM-pctN)/100;
    }
    const ofVaca = ofTotal/nTotal;
    const enLact = i>=mesP && i<mesP+Math.ceil(mesesLactGraf);
    const eRep = enLact?"Lactación con ternero al pie":i===((mesP-1+12)%12)?"Preparto (último mes)":"Gestación media (5–7 meses)";
    const demVaca = reqEM(pvVaca,eRep)||13;
    const ccMcal = enLact&&trayCC ? Math.min(5,parseFloat(trayCC.caídaLact||0)*5.6/mesesLactGraf) : 0;
    const ofTotalV = ofVaca+ccMcal;
    const deficit = Math.max(0,demVaca-ofTotalV);
    return {mes,oferta:Math.round(ofVaca*10)/10,ccComp:Math.round(ccMcal*10)/10,
      demanda:Math.round(demVaca*10)/10,deficit:Math.round(deficit*10)/10,bajo15:h.t<15,esActual:i===mc};
  });
  const defMeses = datos.filter(d=>d.deficit>0);

  return (
    <div>
      <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,marginBottom:2,letterSpacing:1}}>
        BALANCE ENERGÉTICO — Mcal/vaca/día
      </div>
      <div style={{fontFamily:C.font,fontSize:9,color:C.textFaint,marginBottom:10,lineHeight:1.5}}>
        {MESES[mc]}: datos reales Open-Meteo · Resto: promedio histórico · NDVI estimado
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={datos} margin={{top:4,right:4,left:-22,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(126,200,80,.06)"/>
          <XAxis dataKey="mes" tick={{fill:C.textDim,fontSize:9,fontFamily:C.font}}/>
          <YAxis tick={{fill:C.textDim,fontSize:9,fontFamily:C.font}} domain={[0,"auto"]}/>
          <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontFamily:C.font,fontSize:11}}
            formatter={(v,n)=>[v.toFixed(1)+" Mcal/v/d",n]}/>
          <Legend wrapperStyle={{fontFamily:C.font,fontSize:9,paddingTop:4}}/>
          <Area type="monotone" dataKey="oferta" name="Oferta pasto"
            fill="rgba(126,200,80,.18)" stroke={C.green} strokeWidth={2} dot={false}/>
          <Area type="monotone" dataKey="ccComp" name="CC movilizada"
            fill="rgba(212,149,42,.20)" stroke={C.amber} strokeWidth={1} dot={false} strokeDasharray="4 2"/>
          <Bar dataKey="deficit" name="Déficit" fill={C.red} opacity={0.50} radius={[3,3,0,0]}/>
          <Line type="monotone" dataKey="demanda" name="Demanda vaca"
            stroke={C.red} strokeWidth={2} strokeDasharray="6 3" dot={false}/>
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:8}}>
        {datos.map((d,i)=>(
          <div key={i} style={{fontFamily:C.font,fontSize:8,textAlign:"center",padding:"3px 5px",borderRadius:4,
            background:d.esActual?"rgba(126,200,80,.15)":d.bajo15?"rgba(192,72,32,.10)":d.deficit>0?"rgba(192,72,32,.06)":"transparent",
            border:d.esActual?`1px solid ${C.green}`:d.bajo15?"1px solid rgba(192,72,32,.25)":d.deficit>0?"1px solid rgba(192,72,32,.15)":"1px solid transparent",
            color:d.esActual?C.green:d.bajo15?C.red:d.deficit>0?C.amber:C.textFaint}}>
            {d.mes}
          </div>
        ))}
      </div>
      {defMeses.length>0?(
        <div style={{marginTop:10,background:"rgba(192,72,32,.05)",border:"1px solid rgba(192,72,32,.18)",borderRadius:10,padding:12}}>
          <div style={{fontFamily:C.font,fontSize:11,color:C.red,marginBottom:6}}>
            ⚠️ {defMeses.length} mes{defMeses.length>1?"es":""} con déficit — suplementación proteica necesaria
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:6}}>
            {defMeses.map((d,i)=>(
              <div key={i} style={{background:"rgba(192,72,32,.08)",borderRadius:8,padding:"6px 8px",fontFamily:C.font,fontSize:10}}>
                <div style={{color:C.red,fontWeight:600}}>{d.mes}</div>
                <div style={{color:"#e09070",marginTop:2}}>−{d.deficit.toFixed(1)} Mcal/v</div>
              </div>
            ))}
          </div>
        </div>
      ):(
        <div style={{marginTop:8,background:"rgba(126,200,80,.05)",border:"1px solid rgba(126,200,80,.15)",
          borderRadius:8,padding:"8px 12px",fontFamily:C.font,fontSize:10,color:C.green}}>
          ✅ Balance positivo todo el año
        </div>
      )}
    </div>
  );
}

function parseSecciones(texto) {
  const porEmoji = texto.split(/(?=\d️⃣)/);
  if (porEmoji.length >= 4) return porEmoji;
  const porNumero = texto.split(/(?=\n[1-5][.)]\s)/);
  if (porNumero.length >= 4) return porNumero;
  return porEmoji;
}

function detectStatus(texto) {
  if (!texto) return "neutral";
  const t = texto.toLowerCase();
  if (t.includes("🔴") || t.includes("urgente") || t.includes("alerta crítica")) return "error";
  if (t.includes("⚠") || t.includes("déficit severo") || t.includes("no llega") || t.includes("crítico")) return "warn";
  if (t.includes("✅") || t.includes("superávit") || t.includes("óptimo") || t.includes("excelente")) return "ok";
  return "neutral";
}

const SEC_EMOJIS  = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣"];
const SEC_TITLES  = ["Diagnóstico Ambiental","Diagnóstico por Categoría","Destete y Proyección CC","Balance Oferta vs Demanda","Recomendaciones"];
const STATUS_STYLE = {
  ok:      { bg:"rgba(126,200,80,.07)", border:"rgba(126,200,80,.20)", dot:C.green },
  warn:    { bg:"rgba(212,149,42,.07)", border:"rgba(212,149,42,.20)", dot:C.amber },
  error:   { bg:"rgba(192,72,32,.07)",  border:"rgba(192,72,32,.20)",  dot:C.red   },
  neutral: { bg:"rgba(255,255,255,.03)",border:C.border,               dot:C.textDim },
};

function RenderInforme({ texto }) {
  if (!texto) return null;
  const partes = parseSecciones(texto);
  const secciones = SEC_EMOJIS.map(em => {
    const p = partes.find(x => x.startsWith(em));
    return p ? p.replace(em,"").trim() : "";
  });
  const rr = t => t.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>");
  return (
    <div>
      {secciones.map((sec,i) => {
        if (!sec) return null;
        const sc = STATUS_STYLE[detectStatus(sec)];
        return (
          <details key={i} open={i===0||i===4} style={{marginBottom:8}}>
            <summary style={{ background:sc.bg, border:`1px solid ${sc.border}`, borderRadius:12,
              padding:"12px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:10, userSelect:"none" }}>
              <span style={{fontSize:18}}>{SEC_EMOJIS[i]}</span>
              <span style={{fontFamily:C.font,fontSize:12,color:C.text,fontWeight:600,flex:1}}>{SEC_TITLES[i]}</span>
              <div style={{width:8,height:8,borderRadius:"50%",background:sc.dot,flexShrink:0}}/>
            </summary>
            <div style={{ background:"rgba(0,0,0,.25)", border:`1px solid ${C.border}`, borderTop:"none",
              borderRadius:"0 0 12px 12px", padding:14, fontFamily:C.font, fontSize:13,
              color:C.text, lineHeight:1.75 }} dangerouslySetInnerHTML={{__html:rr(sec)}}/>
          </details>
        );
      })}
      <div style={{ background:"rgba(212,149,42,.04)", border:`1px solid rgba(212,149,42,.12)`,
        borderRadius:10, padding:12, fontFamily:C.font, fontSize:10, color:C.amberDim, lineHeight:1.6 }}>
        ⚠️ {DISCLAIMER}
      </div>
    </div>
  );
}

function LoadingPanel({ msg }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 16px", gap:16 }}>
      <div style={{ width:44, height:44, borderRadius:"50%",
        border:`3px solid ${C.border}`, borderTop:`3px solid ${C.green}` }} className="agm-spin"/>
      <div style={{ fontFamily:C.font, fontSize:12, color:C.green, letterSpacing:1, textAlign:"center" }} className="agm-pulse">
        {msg || "Procesando..."}
      </div>
      <div style={{ fontFamily:C.font, fontSize:10, color:C.textFaint, textAlign:"center", maxWidth:260, lineHeight:1.6 }}>
        Integrando datos satelitales, trayectoria CC y escenarios de suplementación
      </div>
    </div>
  );
}

function NavBar({ step, total, pasos, onStep, canNext, onNext, onPrev, canAnalizar }) {
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0,
      paddingBottom:"calc(10px + env(safe-area-inset-bottom,0px))",
      background:"rgba(8,15,9,.96)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
      borderTop:`1px solid ${C.border}`, zIndex:50 }}>
      <div style={{ display:"flex", justifyContent:"center", gap:5, padding:"10px 16px 6px", position:"relative" }}>
        {Array.from({length:total}).map((_,i) => (
          <button key={i} onClick={()=>onStep(i)} style={{ background:"none", border:"none", padding:"4px 3px", cursor:"pointer" }}>
            <div style={{ width:i===step?24:8, height:4, borderRadius:2,
              background:i<step?C.green:i===step?C.green:"rgba(126,200,80,.18)", transition:"all .2s" }}/>
          </button>
        ))}
        {canAnalizar && step < total-1 && (
          <button onClick={()=>onStep(total-1)} style={{
            position:"absolute", right:16, top:-2,
            background:`${C.green}18`, border:`1px solid ${C.green}`, borderRadius:8,
            color:C.green, padding:"5px 10px", fontFamily:C.font, fontSize:10, cursor:"pointer", fontWeight:600,
          }}>⚡ Analizar</button>
        )}
      </div>
      <div style={{ display:"flex", gap:8, padding:"0 16px 4px" }}>
        <button onClick={onPrev} disabled={step===0} style={{
          flex:1, background:"rgba(0,0,0,.3)", border:`1px solid ${C.border}`,
          borderRadius:12, color:step===0?C.textFaint:C.textDim,
          padding:"13px", fontFamily:C.font, fontSize:13, cursor:step===0?"default":"pointer",
        }}>← Anterior</button>
        {step < total-1 && (
          <button onClick={onNext} style={{
            flex:2, background:canNext?`${C.green}15`:"rgba(0,0,0,.2)",
            border:`1.5px solid ${canNext?C.green:C.border}`, borderRadius:12,
            color:canNext?C.green:C.textFaint, padding:"13px",
            fontFamily:C.font, fontSize:13, fontWeight:600, cursor:canNext?"pointer":"default",
          }}>{pasos[step+1]?.split(" ").slice(1).join(" ")||"Siguiente"} →</button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// FORMULARIO INICIAL
// ═══════════════════════════════════════════════════════
const FORM0 = {
  nombreProductor:"", zona:"", provincia:"", enso:"neutro",
  iniServ:"", finServ:"",
  destTrad:"100", destAntic:"0", destHiper:"0",
  vacasN:"", torosN:"", pvVacaAdulta:"", eReprod:"", prenez:"", pctDestete:"88",
  ccDist:[{cc:"5.5",pct:"20"},{cc:"5.0",pct:"50"},{cc:"4.5",pct:"30"}],
  v2sN:"", v2sPV:"", v2sTernero:"",
  cc2sDist:[{cc:"5.0",pct:"40"},{cc:"4.5",pct:"40"},{cc:"4.0",pct:"20"}],
  pctReposicion:"20", vaq1PV:"", vaq2N:"", vaq2PV:"",
  supHa:"", pctMonte:"0", pctNGan:"0",
  vegetacion:"Pastizal natural NEA/Chaco", fenologia:"menor_10",
  suplem:"", consulta:"",
};
const PASOS = ["📍 Ubicación","📅 Servicio","🐄 Rodeo","⚙️ Categorías","🌾 Forraje","⚡ Analizar"];

// ═══════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// FIX CRASH-2: localStorage reemplazado por estado en memoria
// ═══════════════════════════════════════════════════════
export default function AgroMindPro() {
  const { data:session, status } = useSession();
  const [step,setStep] = useState(0);
  const [form,setForm] = useState(FORM0);
  const [coords,setCoords] = useState(null);
  const [sat,setSat] = useState(null);
  const [satLoading,setSatLoading] = useState(false);
  const [gpsLoading,setGpsLoading] = useState(false);
  const [manualLat,setManualLat] = useState("");
  const [manualLon,setManualLon] = useState("");
  const [result,setResult] = useState("");
  const [loading,setLoading] = useState(false);
  const [loadMsg,setLoadMsg] = useState("");
  // FIX CRASH-2: sin localStorage — estado en memoria para evitar crash en ambientes restrictivos
  const [productores,setProductores] = useState([]);
  const [modoForraje,setModoForraje] = useState("general");
  const [usaPotreros,setUsaPotreros] = useState(false);
  const [potreros,setPotreros] = useState([{ha:"",veg:"Pastizal natural NEA/Chaco",fenol:"menor_10"}]);
  const scrollRef = useRef(null);

  // FIX CRASH-2: carga segura de localStorage con fallback a memoria
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const d = localStorage.getItem("agm_prod");
        if (d) setProductores(JSON.parse(d));
      }
    } catch (e) {
      // localStorage no disponible — continúa sin historial persistente
      console.warn("localStorage no disponible, historial solo en memoria");
    }
  }, []);

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  // ── Derivados ─────────────────────────────────────────
  const cadena = useMemo(() => calcCadena(form.iniServ, form.finServ), [form.iniServ, form.finServ]);

  const dispar = useMemo(() => {
    if (!form.provincia || !sat || sat.error) return null;
    return calcDisp(form.provincia, sat.ndvi, sat.temp);
  }, [form.provincia, sat]);

  const dDisp = dispar?.dias ?? 90;
  const ccPondVal = ccPond(form.ccDist);
  const curva = useMemo(() => interpCC(ccPondVal), [ccPondVal]);

  const trayCC = useMemo(() => calcTrayectoriaCC(
    form.ccDist, cadena, form.destTrad, form.destAntic, form.destHiper,
    dDisp, form.supHa, form.vacasN,
  ), [form.ccDist, cadena, form.destTrad, form.destAntic, form.destHiper,
      dDisp, form.supHa, form.vacasN]);

  const distCCServ = useMemo(() => calcDistCCServicio(
    form.ccDist, cadena, sat?.ndvi, form.provincia,
    form.destTrad, form.destAntic, form.destHiper, form.supHa, form.vacasN, dDisp,
  ), [form.ccDist, cadena, sat?.ndvi, form.provincia,
      form.destTrad, form.destAntic, form.destHiper, form.supHa, form.vacasN, dDisp]);

  const tcSave = useMemo(() => calcTerneros(
    form.vacasN, form.prenez, form.pctDestete,
    form.destTrad, form.destAntic, form.destHiper, cadena,
  ), [form.vacasN, form.prenez, form.pctDestete,
      form.destTrad, form.destAntic, form.destHiper, cadena]);

  const pvEntradaVaq1 = tcSave?.pvMayoPond || parseFloat(form.vaq1PV) || 0;
  const vaq1E = useMemo(() => calcVaq1(pvEntradaVaq1, form.pvVacaAdulta, sat?.ndvi),
    [pvEntradaVaq1, form.pvVacaAdulta, sat?.ndvi]);

  const pvEntradaVaq2 = vaq1E?.pvAbr2Inv || parseFloat(form.vaq2PV) || 0;
  const vaq2E = useMemo(() => calcVaq2(pvEntradaVaq2, form.pvVacaAdulta, sat?.ndvi),
    [pvEntradaVaq2, form.pvVacaAdulta, sat?.ndvi]);

  const nVaqRepos = Math.round((parseInt(form.vacasN)||0) * (parseFloat(form.pctReposicion)||0) / 100);
  const canAnalizar = !!coords && !!cadena && !!form.vacasN && !!form.pvVacaAdulta;

  function applyLoc(la, lo, nombre) {
    const zona = dZona(la, lo), prov = dProv(la, lo);
    setCoords({ lat:la, lon:lo, src:nombre });
    setForm(f => ({...f, zona, provincia:prov}));
    setSatLoading(true);
    fetchSat(la, lo, zona, prov, form.enso, d => { setSat(d); setSatLoading(false); });
  }

  useEffect(() => { scrollRef.current?.scrollTo({top:0, behavior:"smooth"}); }, [step]);

  function saveProductor(informe) {
    const r = {
      nombre_productor:form.nombreProductor||"Sin nombre",
      fecha_consulta:new Date().toISOString().slice(0,10),
      zona_productiva:form.zona, provincia:form.provincia,
      latitud:coords?.lat||"", longitud:coords?.lon||"",
      condicion_enso:form.enso,
      temperatura_media_7d_C:sat?.temp||"", ndvi_estimado:sat?.ndvi||"", condicion_forrajera:sat?.cond||"",
      fecha_inicio_servicio:form.iniServ, fecha_fin_servicio:form.finServ, dias_servicio:cadena?.diasServ||"",
      fecha_destete_temprano:cadena?fmtFecha(cadena.desteTemp):"",
      fecha_destete_tardio:cadena?fmtFecha(cadena.desteTard):"",
      alerta_ternero_otono:cadena?.terneroOtono?"SI":"NO",
      alerta_destete_post_mayo:cadena?.destePostMayo?"SI":"NO",
      numero_vacas:form.vacasN, peso_vivo_vaca_adulta_kg:form.pvVacaAdulta,
      prenez_pct:form.prenez, pctDestete:form.pctDestete,
      destete_tradicional_pct:form.destTrad||"0",
      destete_anticipado_pct:form.destAntic||"0",
      destete_hiperprecoz_pct:form.destHiper||"0",
      cc_ponderada_hoy:ccPondVal.toFixed(1),
      cc_parto_estimada:trayCC?.ccParto||"",
      cc_servicio_estimada:trayCC?.ccServ||"",
      prenez_estimada_pct:curva?.pr||"",
      pv_ponderado_mayo_kg:tcSave?.pvMayoPond||"",
      escenario_supl_1inv:vaq1E?`Esc_${vaq1E.esc} GDP${vaq1E.gdpReal}g/d`:"",
      escenario_supl_2inv:vaq2E?`Esc_${vaq2E.esc} GDP${vaq2E.gdpReal}g/d`:"",
      superficie_total_ha:form.supHa, vegetacion_principal:form.vegetacion, fenologia_actual:form.fenologia,
      carga_ev_ha:form.supHa&&form.vacasN?((parseInt(form.vacasN)||0)/(parseFloat(form.supHa)||1)).toFixed(2):"",
      informe_resumen:(informe||"").slice(0,800),
    };
    const upd = [r, ...productores.filter(p=>p.nombre_productor!==form.nombreProductor)].slice(0,50);
    setProductores(upd);
    // FIX CRASH-2: escritura segura
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("agm_prod", JSON.stringify(upd));
      }
    } catch (e) {
      console.warn("No se pudo guardar en localStorage");
    }
  }

  const MSGS = [
    "Procesando fechas reproductivas...", "Calculando trayectoria CC...",
    "Evaluando escenario vaquillona...", "Calibrando oferta forrajera...",
    "Integrando datos satelitales...", "Redactando informe técnico...",
    "Generando tabla de recomendaciones...",
  ];

  async function runAnalysis() {
    setLoading(true); setResult("");
    let mi = 0;
    const iv = setInterval(() => { setLoadMsg(MSGS[mi % MSGS.length]); mi++; }, 2200);
    try {
      const prompt = buildPrompt(form, coords, sat, dispar, cadena, trayCC, curva, ccPondVal,
        distCCServ, vaq1E, vaq2E, nVaqRepos, tcSave, usaPotreros, potreros);
      const res = await fetch("/api/analyze", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ prompt, systemPrompt:SYS }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error del servidor");
      setResult(data.result);
      saveProductor(data.result);
    } catch (e) { setResult("❌ Error: " + e.message); }
    finally { clearInterval(iv); setLoading(false); }
  }

  // ══════════════════════════════════════
  // RENDERS DE PASOS
  // ══════════════════════════════════════
  function renderPaso() {

    // ── PASO 0 — UBICACIÓN ─────────────────────────────
    if (step === 0) return (
      <div className="agm-enter">
        <details style={{marginBottom:12}}>
          <summary style={{ background:"rgba(212,149,42,.07)", border:"1px solid rgba(212,149,42,.22)",
            borderRadius:12, padding:"12px 14px", cursor:"pointer",
            display:"flex", alignItems:"center", gap:8 }}>
            <span>⚠️</span>
            <span style={{fontFamily:C.font,fontSize:11,color:C.amber,fontWeight:600}}>SUPUESTOS Y LIMITACIONES</span>
            <span style={{marginLeft:"auto",fontFamily:C.font,fontSize:10,color:C.textDim}}>ver ▾</span>
          </summary>
          <div style={{ background:"rgba(212,149,42,.03)", border:"1px solid rgba(212,149,42,.12)",
            borderTop:"none", borderRadius:"0 0 12px 12px", padding:14 }}>
            {SUPUESTOS.map((s,i) => (
              <div key={i} style={{ display:"flex", gap:10, marginBottom:10, paddingBottom:10,
                borderBottom:i<SUPUESTOS.length-1?"1px solid rgba(212,149,42,.08)":"none" }}>
                <span style={{fontSize:16,flexShrink:0}}>{s.icon}</span>
                <div>
                  <div style={{fontFamily:C.font,fontSize:11,color:C.amber,fontWeight:600,marginBottom:2}}>{s.titulo}</div>
                  <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,lineHeight:1.55}}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </details>

        <div style={T.card}>
          <div style={T.lbl}>Establecimiento</div>
          <input value={form.nombreProductor} onChange={e=>set("nombreProductor",e.target.value)}
            placeholder="Nombre del productor o establecimiento" style={T.inp}/>
        </div>

        <div style={T.card}>
          <SecTitle icon="📍" label="Ubicación"/>
          <SelectorUbicacion onSelect={(la,lo,n)=>applyLoc(la,lo,n)}/>
          <div style={{fontFamily:C.font,fontSize:10,color:C.textFaint,marginBottom:8}}>
            Cobertura: Argentina · Paraguay · Brasil · Bolivia
          </div>
          <button onClick={()=>{
            setGpsLoading(true);
            getGPS_safe(
              (la,lo)=>{ setGpsLoading(false); applyLoc(la,lo,"GPS"); },
              err=>{ setGpsLoading(false); alert(err); },
            );
          }} style={{ width:"100%", background:"rgba(126,200,80,.06)", border:"1px solid rgba(126,200,80,.2)",
            color:C.green, borderRadius:10, padding:"13px", fontFamily:C.font, fontSize:13, cursor:"pointer", marginBottom:8 }}>
            {gpsLoading ? "⟳ Localizando..." : "📍 Usar mi ubicación (GPS)"}
          </button>

          <details>
            <summary style={{fontFamily:C.font,fontSize:11,color:C.textDim,cursor:"pointer",padding:"4px 0"}}>
              Ingresar coordenadas manualmente
            </summary>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:8,marginTop:10}}>
              <div>
                <div style={T.lbl}>Latitud</div>
                <input type="number" inputMode="decimal" value={manualLat}
                  onChange={e=>setManualLat(e.target.value)} placeholder="-27.45" style={T.inp}/>
              </div>
              <div>
                <div style={T.lbl}>Longitud</div>
                <input type="number" inputMode="decimal" value={manualLon}
                  onChange={e=>setManualLon(e.target.value)} placeholder="-59.12" style={T.inp}/>
              </div>
              <div style={{display:"flex",alignItems:"flex-end"}}>
                <button onClick={()=>{
                  const la=parseFloat(manualLat), lo=parseFloat(manualLon);
                  const err=validarManual(la,lo);
                  if(err){alert(err);return;}
                  applyLoc(la,lo,"Manual");
                }} style={{ background:"rgba(126,200,80,.1)", border:"1px solid rgba(126,200,80,.25)",
                  borderRadius:10, color:C.green, padding:"13px 12px", fontFamily:C.font, fontSize:12, cursor:"pointer" }}>
                  Fijar
                </button>
              </div>
            </div>
            <div style={{fontFamily:C.font,fontSize:10,color:C.textFaint,marginTop:6}}>
              Rango: lat −15 a −55 · lon −44 a −74
            </div>
          </details>

          {coords && (
            <div style={{ marginTop:10, background:"rgba(126,200,80,.06)",
              border:"1px solid rgba(126,200,80,.2)", borderRadius:10, padding:"10px 14px" }}>
              <div style={{fontFamily:C.font,fontSize:12,color:C.green,marginBottom:3}}>
                ✅ <strong>{form.zona}</strong> · {form.provincia}
              </div>
              <div style={{fontFamily:C.font,fontSize:10,color:C.textDim}}>
                {coords.lat?.toFixed(4)}° S · {coords.lon?.toFixed(4)}° W · {coords.src}
              </div>
            </div>
          )}

          {satLoading && (
            <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center",marginTop:10}}>
              <span className="agm-spin" style={{color:C.green,fontSize:16}}>⟳</span>
              <span style={{fontFamily:C.font,fontSize:11,color:C.green}}>Descargando datos satelitales...</span>
            </div>
          )}
          {sat?.error && <Alerta tipo="warn">{sat.error}</Alerta>}
          {sat && !sat.error && (
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:12}}>
                {[{l:"Temp.",v:sat.temp+"°C",c:C.amber},{l:"Lluvia 30d",v:sat.p30+"mm",c:C.blue},
                  {l:"Balance",v:(sat.deficit>0?"+":"")+sat.deficit,c:sat.deficit<-30?C.red:C.amber},
                  {l:"NDVI",v:sat.ndvi,c:C.green}
                ].map(({l,v,c}) => <MetricCard key={l} label={l} value={v} color={c}/>)}
              </div>
              <div style={{textAlign:"center",fontFamily:C.font,fontSize:10,color:C.textDim,marginTop:6}}>
                Condición: <span style={{color:C.green}}>{sat.cond}</span>
              </div>
            </>
          )}
          {dispar && dispar.dias < 60 && sat && !sat.error && (
            <Alerta tipo={dispar.dias===0?"error":"warn"} style={{marginTop:8}}>
              {dispar.dias===0
                ?"🌨 Invierno activo — pastizal C4 restringido ahora"
                :`⏱ ${dispar.tipo} en ~${dispar.dias} días — iniciar estrategia de suplementación`}
            </Alerta>
          )}
        </div>

        <div style={T.card}>
          <SecTitle icon="🌊" label="Condición ENSO"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[["neutro","⚪ Neutro",C.textDim],["nino","🌊 El Niño",C.blue],["nina","🔴 La Niña",C.red]].map(([v,l,co])=>(
              <BtnSel key={v} active={form.enso===v} color={co} onClick={()=>set("enso",v)}>{l}</BtnSel>
            ))}
          </div>
        </div>
      </div>
    );

    // ── PASO 1 — SERVICIO ──────────────────────────────
    if (step === 1) {
      const sumDest = (parseFloat(form.destTrad)||0)+(parseFloat(form.destAntic)||0)+(parseFloat(form.destHiper)||0);
      const sumOk = Math.abs(sumDest - 100) < 1;
      const fechaErr = form.iniServ && form.finServ &&
        new Date(form.finServ+"T12:00:00") <= new Date(form.iniServ+"T12:00:00")
        ? "El fin debe ser posterior al inicio" : null;
      return (
        <div className="agm-enter">
          <div style={T.card}>
            <SecTitle icon="📅" label="Fechas de Servicio"/>
            <div style={{fontFamily:C.font,fontSize:11,color:C.amberDim,marginBottom:12}}>
              NEA estándar: noviembre → enero/febrero (3–3,5 meses)
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div>
                <div style={T.lbl}>Inicio servicio</div>
                <input type="date" value={form.iniServ} onChange={e=>set("iniServ",e.target.value)} style={T.inp}/>
              </div>
              <div>
                <div style={{...T.lbl,color:fechaErr?C.red:C.textDim}}>Fin servicio</div>
                <input type="date" value={form.finServ} onChange={e=>set("finServ",e.target.value)}
                  style={{...T.inp,borderColor:fechaErr?C.red:C.border}}/>
                {fechaErr && <div style={{fontFamily:C.font,fontSize:10,color:C.red,marginTop:4}}>{fechaErr}</div>}
              </div>
            </div>
            {cadena && !fechaErr && (
              <div style={{ background:"rgba(126,200,80,.06)", border:"1px solid rgba(126,200,80,.15)",
                borderRadius:12, padding:12 }}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  {[{l:"Días servicio",v:cadena.diasServ+"d"},{l:"Parto temprano",v:fmtFecha(cadena.partoTemp)},
                    {l:"Parto tardío",v:fmtFecha(cadena.partoTard)},{l:"Destete trad.",v:fmtFecha(cadena.desteTemp)}
                  ].map(({l,v}) => (
                    <div key={l} style={{background:"rgba(0,0,0,.25)",borderRadius:8,padding:"8px 10px"}}>
                      <div style={{fontFamily:C.font,fontSize:9,color:C.textDim,marginBottom:2}}>{l}</div>
                      <div style={{fontFamily:C.font,fontSize:13,color:C.green}}>{v}</div>
                    </div>
                  ))}
                </div>
                {cadena.terneroOtono && <Alerta tipo="error">
                  ⚠️ VACA TARDÍA — ternero al pie en otoño. Considerar destete anticipado o hiperprecoz.
                </Alerta>}
                {cadena.destePostMayo && <Alerta tipo="warn">
                  ⚠️ Vacas tardías destetan después de mayo — terneros entran al 1° invierno con el PV de destete sin crecimiento adicional.
                </Alerta>}
              </div>
            )}
          </div>

          <div style={T.card}>
            <SecTitle icon="🍼" label="Modalidades de Destete"/>
            <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,marginBottom:12}}>
              Indicar % del rodeo por modalidad · deben sumar 100%
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {[{k:"destTrad",l:"Tradicional",sub:"~180d",c:C.green},
                {k:"destAntic",l:"Anticipado",sub:"~90d",c:C.amber},
                {k:"destHiper",l:"Hiperprecoz",sub:"~50d",c:C.blue}
              ].map(({k,l,sub,co}) => (
                <div key={k} style={{background:"rgba(0,0,0,.3)",borderRadius:10,padding:"10px 8px",border:`1px solid ${C.border}`}}>
                  <div style={{fontFamily:C.font,fontSize:11,color:co||C.green,marginBottom:3,textAlign:"center"}}>{l}</div>
                  <div style={{fontFamily:C.font,fontSize:9,color:C.textFaint,marginBottom:6,textAlign:"center"}}>{sub}</div>
                  <input type="number" inputMode="decimal" value={form[k]}
                    onChange={e=>set(k,e.target.value)}
                    style={{...T.inp,textAlign:"center",padding:"10px 6px",fontSize:16}} placeholder="0"/>
                </div>
              ))}
            </div>
            <div style={{textAlign:"right",fontFamily:C.font,fontSize:11,
              color:sumOk?C.greenDim:C.red,marginTop:6}}>
              Σ {sumDest.toFixed(0)}% {sumOk?"✓":"← debe sumar 100%"}
            </div>
          </div>
        </div>
      );
    }

    // ── PASO 2 — RODEO ─────────────────────────────────
    if (step === 2) return (
      <div className="agm-enter">
        <div style={T.card}>
          <SecTitle icon="🐄" label="Datos del Rodeo"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[{k:"vacasN",l:"N° vacas",ph:"150"},{k:"torosN",l:"N° toros",ph:"5"},
              {k:"pvVacaAdulta",l:"PV vaca adulta (kg)",ph:"320"},{k:"prenez",l:"Preñez hist. (%)",ph:"80"},
              {k:"pctDestete",l:"% Destete",ph:"88"}
            ].map(({k,l,ph}) => (
              <div key={k}>
                <div style={T.lbl}>{l}</div>
                <input type="number" inputMode="decimal" value={form[k]}
                  onChange={e=>set(k,e.target.value)} placeholder={ph} style={T.inp}/>
              </div>
            ))}
            <div>
              <div style={T.lbl}>Estado reproductivo</div>
              <select value={form.eReprod} onChange={e=>set("eReprod",e.target.value)}
                style={{...T.inp,appearance:"none",WebkitAppearance:"none"}}>
                <option value="">Seleccionar...</option>
                {ESTADOS_REPROD.map(e=><option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={T.card}>
          <SecTitle icon="⚖️" label="Distribución CC Rodeo"/>
          <DistCC dist={form.ccDist} onChange={v=>set("ccDist",v)}/>
          {trayCC && (
            <div style={{marginTop:14}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:8}}>
                {[{l:"CC parto",v:trayCC.ccParto,b:4.5,a:5.0},
                  {l:"CC destete",v:trayCC.ccDestete,b:4.0,a:4.5},
                  {l:"CC servicio",v:trayCC.ccServ,b:4.5,a:5.0}
                ].map(({l,v,b,a}) => (
                  <MetricCard key={l} label={l} value={v} color={semaforo(parseFloat(v),b,a)}
                    sub={l==="CC servicio"?`→ ${interpCC(parseFloat(v)).pr}% preñez`:""}/>
                ))}
              </div>
              <div style={{fontFamily:C.font,fontSize:10,color:C.textFaint,textAlign:"center"}}>
                Meses lact.: {trayCC.mesesLact} · Caída CC: −{trayCC.caídaLact} pts
              </div>
            </div>
          )}

          {distCCServ?.grupos?.length > 0 && (
            <div style={{marginTop:14}}>
              <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,marginBottom:8,letterSpacing:1}}>
                PROYECCIÓN POR GRUPO CC
              </div>
              {distCCServ.grupos.map((g,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                  padding:"10px 12px", marginBottom:6, background:"rgba(0,0,0,.25)",
                  borderRadius:8, border:`1px solid ${C.border}` }}>
                  <div>
                    <span style={{fontFamily:C.font,fontSize:14,color:C.text,fontWeight:600}}>CC {g.ccHoy}</span>
                    <span style={{fontFamily:C.font,fontSize:11,color:C.textDim,marginLeft:8}}>{g.pct}% rodeo</span>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontFamily:C.font,fontSize:12,color:semaforo(parseFloat(g.ccServ),4.5,5.0)}}>
                      Serv: CC {g.ccServ} → {g.pr}%
                    </div>
                    <div style={{fontFamily:C.font,fontSize:11,color:C.amber}}>{g.recDestete}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {tcSave && (
          <div style={T.card}>
            <SecTitle icon="🐮" label="Terneros Proyectados"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <MetricCard label="Terneros destetados" value={tcSave.terneros} color={C.green}/>
              <MetricCard label="PV pond. mayo (kg)" value={tcSave.pvMayoPond} color={C.amber} sub="Entrada 1° inv."/>
            </div>
            {tcSave.alertaHiper && <Alerta tipo="warn" style={{marginTop:10}}>
              Destete hiperprecoz {">"} 30% del rodeo — terneros de ~50d requieren suplementación proteica. GDP estimado sin supl: 250 g/d.
            </Alerta>}
          </div>
        )}
      </div>
    );

    // ── PASO 3 — CATEGORÍAS ────────────────────────────
    // FIX VAQ2: vaquillona 2° invierno siempre visible y obligatoria (igual que vaca 2° servicio)
    if (step === 3) return (
      <div className="agm-enter">

        {/* Vaca 2° servicio */}
        <details open={!!form.v2sN} style={{marginBottom:12}}>
          <summary style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12,
            padding:"12px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:8, userSelect:"none" }}>
            <span>🔁</span>
            <span style={{fontFamily:C.font,fontSize:11,color:C.green,fontWeight:600,letterSpacing:1}}>
              VACA 2° SERVICIO {form.v2sN?`· ${form.v2sN} cab.`:"· (opcional)"}
            </span>
          </summary>
          <div style={{...T.card,borderRadius:"0 0 12px 12px",marginBottom:0,borderTop:"none"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div><div style={T.lbl}>Cantidad</div>
                <input type="number" inputMode="numeric" value={form.v2sN}
                  onChange={e=>set("v2sN",e.target.value)} placeholder="—" style={T.inp}/></div>
              <div><div style={T.lbl}>PV (kg)</div>
                <input type="number" inputMode="decimal" value={form.v2sPV}
                  onChange={e=>set("v2sPV",e.target.value)} placeholder="320" style={T.inp}/></div>
            </div>
            <div style={T.lbl}>Ternero al pie</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              {[["si","Con ternero"],["no","Sin ternero"]].map(([v,l])=>(
                <BtnSel key={v} active={form.v2sTernero===v} onClick={()=>set("v2sTernero",v)}>{l}</BtnSel>
              ))}
            </div>
            <DistCC dist={form.cc2sDist} onChange={v=>set("cc2sDist",v)} label="Distribución CC 2° servicio"/>
          </div>
        </details>

        {/* Vaquillona 1° invierno */}
        <details open style={{marginBottom:12}}>
          <summary style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12,
            padding:"12px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:8, userSelect:"none" }}>
            <span>🐄</span>
            <span style={{fontFamily:C.font,fontSize:11,color:C.green,fontWeight:600,letterSpacing:1}}>
              VAQUILLONA 1° INVIERNO · {nVaqRepos} vaquillas
            </span>
          </summary>
          <div style={{...T.card,borderRadius:"0 0 12px 12px",marginBottom:0,borderTop:"none"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div><div style={T.lbl}>% Reposición</div>
                <input type="number" inputMode="decimal" value={form.pctReposicion}
                  onChange={e=>set("pctReposicion",e.target.value)} placeholder="20" style={T.inp}/></div>
              <MetricCard label="Vaquillas" value={nVaqRepos} color={C.green}/>
            </div>
            {tcSave && (
              <div style={{ background:"rgba(126,200,80,.06)", border:"1px solid rgba(126,200,80,.15)",
                borderRadius:10, padding:10, marginBottom:10 }}>
                <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,marginBottom:3}}>PV entrada mayo 1°inv (ponderado)</div>
                <div style={{fontFamily:C.font,fontSize:22,color:C.green,fontWeight:700}}>{tcSave.pvMayoPond} kg</div>
              </div>
            )}
            {vaq1E && (vaq1E.mensaje
              ? <Alerta tipo="ok">{vaq1E.mensaje}</Alerta>
              : <div style={{ background:"rgba(212,149,42,.06)", border:"1px solid rgba(212,149,42,.2)", borderRadius:10, padding:12 }}>
                  <div style={{fontFamily:C.font,fontSize:10,color:C.amber,marginBottom:8,letterSpacing:1}}>
                    ESC {vaq1E.esc} — SUPLEMENTACIÓN
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <MetricCard label="Proteína" value={vaq1E.prot+"kg/d"} color={C.amber}/>
                    <MetricCard label="Energía"  value={vaq1E.energ>0?vaq1E.energ+"kg/d":"—"} color={C.blue}/>
                    <MetricCard label="Frecuencia" value={vaq1E.freq} color={C.textDim} style={{gridColumn:"1/-1"}}/>
                    <MetricCard label="GDP" value={vaq1E.gdpReal+"g/d"} color={C.green}/>
                    <MetricCard label="PV ago." value={vaq1E.pvSal+"kg"}
                      color={vaq1E.deficit?C.red:C.green} sub={vaq1E.deficit?`⚠ Falta ${vaq1E.objetivo-vaq1E.pvSal}kg`:"✓ Alcanza objetivo"}/>
                  </div>
                  {vaq1E.pvAbr2Inv && <div style={{marginTop:8,fontFamily:C.font,fontSize:11,color:C.textDim}}>
                    PV entrada 2°inv (abril): <span style={{color:C.green,fontWeight:600}}>{vaq1E.pvAbr2Inv} kg</span>
                  </div>}
                </div>
            )}
          </div>
        </details>

        {/* FIX VAQ2: vaquillona 2° invierno — SIEMPRE ABIERTA, campo cantidad OBLIGATORIO */}
        <details open style={{marginBottom:12}}>
          <summary style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12,
            padding:"12px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:8, userSelect:"none" }}>
            <span>🐂</span>
            <span style={{fontFamily:C.font,fontSize:11,color:C.green,fontWeight:600,letterSpacing:1}}>
              VAQUILLONA 2° INVIERNO · {form.vaq2N ? `${form.vaq2N} cab.` : "Ingresar cantidad"}
            </span>
            {/* Indicador visual de que es requerido */}
            {!form.vaq2N && (
              <span style={{fontFamily:C.font,fontSize:9,color:C.amber,marginLeft:"auto",
                background:"rgba(212,149,42,.12)",border:"1px solid rgba(212,149,42,.3)",
                borderRadius:4,padding:"2px 6px"}}>requerido</span>
            )}
          </summary>
          <div style={{...T.card,borderRadius:"0 0 12px 12px",marginBottom:0,borderTop:"none"}}>
            {vaq2E?._aviso && <Alerta tipo="warn">{vaq2E._aviso}</Alerta>}
            <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,marginBottom:10,lineHeight:1.6}}>
              Vaquillona nacida en la temporada actual que enfrenta su segundo invierno antes del entore.
              El PV de entrada se calcula automáticamente desde la vaquillona 1° invierno.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <div style={{...T.lbl,color:!form.vaq2N?C.amber:C.textDim}}>
                  Cantidad {!form.vaq2N && <span style={{color:C.amber}}>*</span>}
                </div>
                <input type="number" inputMode="numeric" value={form.vaq2N}
                  onChange={e=>set("vaq2N",e.target.value)}
                  placeholder="Ej: 30"
                  style={{...T.inp, borderColor:!form.vaq2N?"rgba(212,149,42,.4)":C.border}}/>
              </div>
              <div>
                <div style={T.lbl}>PV entrada (kg)</div>
                <div style={{...T.inp, background:"rgba(126,200,80,.06)", color:C.green,
                  fontWeight:600, display:"flex", alignItems:"center"}}>
                  {pvEntradaVaq2 || "—"}
                  {vaq1E?.pvAbr2Inv && <span style={{fontFamily:C.font,fontSize:9,color:C.textDim,marginLeft:6}}>(de vaq1)</span>}
                </div>
              </div>
            </div>
            {vaq2E && !vaq2E._aviso && (vaq2E.esc==="—"
              ? <Alerta tipo="ok">Sin suplementación necesaria — ya supera el peso mínimo de entore ({vaq2E.pvMinEntore}kg)</Alerta>
              : <div style={{background:"rgba(212,149,42,.06)",border:"1px solid rgba(212,149,42,.2)",borderRadius:10,padding:12}}>
                  <div style={{fontFamily:C.font,fontSize:10,color:C.amber,marginBottom:8}}>ESC {vaq2E.esc} — HACIA ENTORE</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    <MetricCard label="GDP"      value={vaq2E.gdpReal+"g/d"}  color={C.green}/>
                    <MetricCard label="PV entore" value={vaq2E.pvEntore+"kg"} color={vaq2E.llegas?C.green:C.red}/>
                    <MetricCard label="PV mín."  value={vaq2E.pvMinEntore+"kg"} color={C.textDim}/>
                  </div>
                  {!vaq2E.llegas && <Alerta tipo="error" style={{marginTop:8}}>
                    ⚠️ No alcanza el peso mínimo de entore ({vaq2E.pvMinEntore}kg) — revisar suplementación
                  </Alerta>}
                </div>
            )}
          </div>
        </details>
      </div>
    );

    // ── PASO 4 — FORRAJE ───────────────────────────────
    if (step === 4) return (
      <div className="agm-enter">
        <div style={T.card}>
          <SecTitle icon="🌾" label="Oferta Forrajera"/>
          <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,marginBottom:12,lineHeight:1.6}}>
            ¿Cómo querés ingresar la oferta de pasto?
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <BtnSel active={modoForraje==="general"}
              onClick={()=>{setModoForraje("general");setUsaPotreros(false);}}
              style={{padding:"14px 10px",textAlign:"left"}}>
              <div style={{fontSize:20,marginBottom:6}}>🏠</div>
              <div style={{fontFamily:C.font,fontSize:12,fontWeight:600,marginBottom:3}}>Campo completo</div>
              <div style={{fontFamily:C.font,fontSize:9,color:modoForraje==="general"?C.textDim:C.textFaint,lineHeight:1.4}}>
                Superficie total + tipo de vegetación. Simple y rápido.
              </div>
            </BtnSel>
            <BtnSel active={modoForraje==="potreros"}
              onClick={()=>{setModoForraje("potreros");setUsaPotreros(true);}}
              style={{padding:"14px 10px",textAlign:"left"}}>
              <div style={{fontSize:20,marginBottom:6}}>🗺️</div>
              <div style={{fontFamily:C.font,fontSize:12,fontWeight:600,marginBottom:3}}>Por potreros</div>
              <div style={{fontFamily:C.font,fontSize:9,color:modoForraje==="potreros"?C.textDim:C.textFaint,lineHeight:1.4}}>
                Cada potrero con su ha y vegetación. Más detallado.
              </div>
            </BtnSel>
          </div>
        </div>

        {modoForraje==="general" && (<>
          <div style={T.card}>
            <SecTitle icon="📐" label="Superficie y Composición"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <div style={T.lbl}>Superficie total (ha)</div>
                <input type="number" inputMode="decimal" value={form.supHa}
                  onChange={e=>set("supHa",e.target.value)} placeholder="500" style={T.inp}/>
              </div>
              <div>
                <div style={T.lbl}>Carga EV/ha</div>
                <div style={{...T.inp,background:"rgba(0,0,0,.3)",fontWeight:600,display:"flex",alignItems:"center",
                  color:form.supHa&&form.vacasN?semaforo(2-(parseInt(form.vacasN)||0)/(parseFloat(form.supHa)||1),0.5,1.5):C.textDim}}>
                  {form.supHa&&form.vacasN&&parseFloat(form.supHa)>0
                    ?((parseInt(form.vacasN)||0)/parseFloat(form.supHa)).toFixed(2):"—"}
                </div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[{k:"pctMonte",l:"% Monte / palmar"},{k:"pctNGan",l:"% No ganadero"}].map(({k,l})=>(
                <div key={k}><div style={T.lbl}>{l}</div>
                  <input type="number" inputMode="decimal" value={form[k]}
                    onChange={e=>set(k,e.target.value)} placeholder="0" style={T.inp}/></div>
              ))}
            </div>
          </div>
          <div style={T.card}>
            <SecTitle icon="🌿" label="Tipo de Vegetación Principal"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr",gap:8}}>
              {Object.keys(PROD_BASE).map(v=>(
                <BtnSel key={v} active={form.vegetacion===v} onClick={()=>set("vegetacion",v)}
                  style={{textAlign:"left",padding:"12px 14px"}}>{v}</BtnSel>
              ))}
            </div>
          </div>
          <div style={T.card}>
            <SecTitle icon="🌱" label="Estado Fenológico Actual"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {FENOLOGIAS.map(f=>(
                <BtnSel key={f.val} active={form.fenologia===f.val} onClick={()=>set("fenologia",f.val)}
                  style={{textAlign:"left",padding:"12px 10px"}}>
                  <div style={{fontSize:18,marginBottom:4}}>{f.emoji}</div>
                  <div style={{fontFamily:C.font,fontSize:12,fontWeight:600}}>{f.label}</div>
                  <div style={{fontFamily:C.font,fontSize:9,color:C.textFaint,marginTop:2,lineHeight:1.4}}>{f.desc}</div>
                  {f.warn && <div style={{fontFamily:C.font,fontSize:9,color:C.amber,marginTop:3}}>{f.warn}</div>}
                </BtnSel>
              ))}
            </div>
          </div>
        </>)}

        {modoForraje==="potreros" && (<>
          <div style={{...T.card,background:"rgba(126,200,80,.04)",border:"1px solid rgba(126,200,80,.15)"}}>
            <div style={{fontFamily:C.font,fontSize:10,color:C.green,marginBottom:4}}>
              📋 Modo potreros — ingresá cada potrero por separado
            </div>
            <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,lineHeight:1.6}}>
              Cada potrero suma su oferta (ha × producción según vegetación y estado fenológico).
            </div>
          </div>
          {potreros.map((p,i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontFamily:C.font,fontSize:12,color:C.green,fontWeight:600}}>Potrero {i+1}</span>
                <button onClick={()=>setPotreros(ps=>ps.filter((_,j)=>j!==i))}
                  style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontFamily:C.font,fontSize:11,padding:"4px 8px"}}>
                  ✕ Eliminar
                </button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div><div style={T.lbl}>Hectáreas</div>
                  <input type="number" inputMode="decimal" value={p.ha}
                    onChange={e=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],ha:e.target.value};return n;})}
                    style={T.inp} placeholder="100"/></div>
                <div><div style={T.lbl}>Fenología</div>
                  <select value={p.fenol} onChange={e=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],fenol:e.target.value};return n;})}
                    style={{...T.inp,appearance:"none"}}>
                    {FENOLOGIAS.map(f=><option key={f.val} value={f.val}>{f.emoji} {f.label}</option>)}
                  </select></div>
              </div>
              <div><div style={T.lbl}>Vegetación</div>
                <select value={p.veg} onChange={e=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],veg:e.target.value};return n;})}
                  style={{...T.inp,appearance:"none"}}>
                  {Object.keys(PROD_BASE).map(v=><option key={v} value={v}>{v}</option>)}
                </select></div>
            </div>
          ))}
          <button onClick={()=>setPotreros(ps=>[...ps,{ha:"",veg:"Pastizal natural NEA/Chaco",fenol:"menor_10"}])}
            style={{width:"100%",background:"rgba(126,200,80,.06)",border:`1px solid ${C.border}`,
              borderRadius:10,color:C.green,padding:"13px",fontFamily:C.font,fontSize:12,cursor:"pointer",marginBottom:10}}>
            + Agregar potrero
          </button>
          {potreros.length>0 && potreros.some(p=>p.ha) && (
            <div style={{background:"rgba(126,200,80,.05)",border:"1px solid rgba(126,200,80,.15)",
              borderRadius:8,padding:"8px 12px",fontFamily:C.font,fontSize:10,color:C.textDim}}>
              Total: <strong style={{color:C.green}}>
                {potreros.reduce((s,p)=>s+(parseFloat(p.ha)||0),0)} ha
              </strong> · {potreros.filter(p=>p.ha).length} potrero{potreros.filter(p=>p.ha).length>1?"s":""}
            </div>
          )}
        </>)}

        {sat && !sat.error && cadena && (
          <div style={T.card}>
            <SecTitle icon="📊" label="Balance Energético"/>
            <GraficoBalance form={form} sat={sat} cadena={cadena} trayCC={trayCC}
              usaPotreros={usaPotreros} potreros={potreros}/>
          </div>
        )}
      </div>
    );

    // ── PASO 5 — ANALIZAR ──────────────────────────────
    if (step === 5) return (
      <div className="agm-enter">
        <div style={T.card}>
          <SecTitle icon="📋" label="Resumen del Caso"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[
              {l:"Ubicación",v:form.zona||"—"},
              {l:"Rodeo",v:form.vacasN?form.vacasN+" vacas":"—"},
              {l:"Servicio",v:cadena?fmtFecha(cadena.ini)+" → "+fmtFecha(cadena.fin):"—"},
              {l:"CC pond.",v:ccPondVal.toFixed(1)+"/9"},
              {l:"Preñez est.",v:curva?.pr?curva.pr+"%":"—",c:curva?.pr?semaforo(curva.pr,55,75):C.textDim},
              {l:"NDVI",v:sat?.ndvi||"—"},
            ].map(({l,v,c})=>(
              <div key={l} style={{background:"rgba(0,0,0,.25)",borderRadius:8,padding:"8px 10px"}}>
                <div style={{fontFamily:C.font,fontSize:9,color:C.textDim,marginBottom:2}}>{l}</div>
                <div style={{fontFamily:C.font,fontSize:13,color:c||C.text,fontWeight:600}}>{v}</div>
              </div>
            ))}
          </div>
          {cadena?.terneroOtono && <Alerta tipo="error">
            ⚠️ VACA TARDÍA — el informe incluirá recomendación de destete urgente.
          </Alerta>}
          <div style={{marginBottom:10}}>
            <div style={T.lbl}>Suplementación actual (opcional)</div>
            <input value={form.suplem} onChange={e=>set("suplem",e.target.value)}
              placeholder="Ej: urea 50g/día, harina girasol 200g/día..." style={T.inp}/>
          </div>
          <div>
            <div style={T.lbl}>Consulta específica (opcional)</div>
            <textarea value={form.consulta} onChange={e=>set("consulta",e.target.value)}
              placeholder="¿Hay alguna situación particular a contemplar?"
              rows={3} style={{...T.inp,resize:"none",lineHeight:1.5}}/>
          </div>
        </div>

        <button onClick={runAnalysis} disabled={loading} style={{
          width:"100%",
          background: loading ? "rgba(0,0,0,.3)" : `${C.green}18`,
          border:`2px solid ${loading?C.border:C.green}`, borderRadius:14,
          color: loading?C.textDim:C.green, padding:"18px", fontFamily:C.font,
          fontSize:15, fontWeight:700, cursor:loading?"default":"pointer",
          letterSpacing:1, transition:"all .2s", marginBottom:16,
        }}>
          {loading ? "Analizando..." : "⚡ GENERAR ANÁLISIS TÉCNICO"}
        </button>

        {loading && <LoadingPanel msg={loadMsg}/>}

        {result && !loading && (
          <div>
            <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,letterSpacing:1,marginBottom:10,textAlign:"center"}}>
              INFORME TÉCNICO — {new Date().toLocaleDateString("es-AR")}
            </div>
            <RenderInforme texto={result}/>
            <button onClick={()=>{
              const a=document.createElement("a");
              a.href=URL.createObjectURL(new Blob([result],{type:"text/plain;charset=utf-8"}));
              a.download=`agromind_${(form.nombreProductor||"informe").replace(/\s/g,"_")}_${new Date().toISOString().slice(0,10)}.txt`;
              a.click();
            }} style={{width:"100%",background:"rgba(74,159,212,.08)",border:"1px solid rgba(74,159,212,.25)",
              borderRadius:10,color:C.blue,padding:"13px",fontFamily:C.font,fontSize:12,cursor:"pointer",marginTop:8}}>
              ⬇ Descargar informe (.txt)
            </button>
          </div>
        )}

        {productores.length > 0 && (
          <details style={{marginTop:16}}>
            <summary style={{fontFamily:C.font,fontSize:11,color:C.textDim,cursor:"pointer",padding:"10px 0"}}>
              📁 Historial ({productores.length} registros)
            </summary>
            <div style={{marginTop:8}}>
              {productores.slice(0,5).map((p,i)=>(
                <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
                  padding:"10px 12px", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{fontFamily:C.font,fontSize:12,color:C.text}}>{p.nombre_productor}</div>
                    <div style={{fontFamily:C.font,fontSize:10,color:C.textDim}}>{p.fecha_consulta} · {p.zona_productiva}</div>
                  </div>
                  <div style={{fontFamily:C.font,fontSize:12,color:C.green}}>{p.prenez_estimada_pct?p.prenez_estimada_pct+"%":"—"}</div>
                </div>
              ))}
              <button onClick={()=>{
                const bom="﻿";
                const cols=Object.keys(productores[0]||{});
                const esc=v=>`"${String(v||"").replace(/"/g,'""')}"`;
                const csv=[cols.join(","),...productores.map(p=>cols.map(c=>esc(p[c])).join(","))].join("\n");
                const a=document.createElement("a");
                a.href=URL.createObjectURL(new Blob([bom+csv],{type:"text/csv;charset=utf-8"}));
                a.download=`agromind_${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
              }} style={{width:"100%",background:"rgba(0,0,0,.3)",border:`1px solid ${C.border}`,
                borderRadius:10,color:C.textDim,padding:"11px",fontFamily:C.font,fontSize:11,cursor:"pointer"}}>
                ⬇ Exportar CSV ({productores.length} registros)
              </button>
            </div>
          </details>
        )}
      </div>
    );
  }

  const canNext = [
    !!coords,
    !!(form.iniServ && form.finServ && cadena &&
       Math.abs((parseFloat(form.destTrad)||0)+(parseFloat(form.destAntic)||0)+(parseFloat(form.destHiper)||0)-100)<1),
    !!(form.vacasN && form.pvVacaAdulta && ccPond(form.ccDist)>0),
    true,
    !!(form.supHa && form.vegetacion && form.fenologia),
    true,
  ];

  if (status === "loading") return (
    <div style={{minHeight:"100dvh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontFamily:C.font,fontSize:13,color:C.green}} className="agm-pulse">Iniciando...</div>
    </div>
  );

  if (!session) return (
    <div style={{minHeight:"100dvh",background:C.bg,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:32}}>
      <div style={{width:64,height:64,borderRadius:18,background:`${C.green}12`,
        border:`1px solid ${C.green}22`,display:"flex",alignItems:"center",
        justifyContent:"center",fontSize:32,marginBottom:20}}>🌾</div>
      <div style={{fontFamily:C.font,fontSize:22,color:C.green,fontWeight:700,letterSpacing:2,marginBottom:4}}>AGROMIND</div>
      <div style={{fontFamily:C.font,fontSize:14,color:C.amber,letterSpacing:3,marginBottom:32}}>PRO</div>
      <div style={{fontFamily:C.font,fontSize:12,color:C.textDim,textAlign:"center",marginBottom:32,
        lineHeight:1.8,maxWidth:280}}>
        Asesoría técnica ganadera con inteligencia artificial<br/>
        NEA · NOA · Paraguay · Brasil · Bolivia
      </div>
      <button onClick={()=>signIn("google")} style={{
        background:`${C.green}12`,border:`1.5px solid ${C.green}`,borderRadius:14,
        color:C.green,padding:"16px 32px",fontFamily:C.font,fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:1,
      }}>INGRESAR CON GOOGLE</button>
    </div>
  );

  return (
    <div style={{minHeight:"100dvh",background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{ position:"sticky",top:0,zIndex:40,background:"rgba(8,15,9,.95)",
        backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
        borderBottom:`1px solid ${C.border}`,padding:"12px 16px",
        display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:8,background:`${C.green}18`,
            border:`1px solid ${C.green}28`,display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:14}}>🌾</div>
          <div>
            <div style={{fontFamily:C.font,fontSize:13,color:C.green,fontWeight:700,letterSpacing:1}}>
              AGROMIND<span style={{color:C.amber}}>PRO</span>
            </div>
            {form.nombreProductor && (
              <div style={{fontFamily:C.font,fontSize:9,color:C.textDim,marginTop:1}}>{form.nombreProductor}</div>
            )}
          </div>
        </div>
        <button onClick={()=>signOut()} style={{ background:"none", border:`1px solid ${C.border}`,
          borderRadius:8, color:C.textDim, padding:"6px 10px", fontFamily:C.font, fontSize:11, cursor:"pointer" }}>
          Salir
        </button>
      </div>

      <div ref={scrollRef} style={{
        flex:1, overflowY:"auto",
        padding:`16px 16px calc(120px + env(safe-area-inset-bottom,0px))`,
        maxWidth:600, margin:"0 auto", width:"100%",
      }}>
        <div style={{ fontFamily:C.font, fontSize:11, color:C.textDim,
          letterSpacing:2, marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{fontSize:14}}>{PASOS[step].split(" ")[0]}</span>
          <span>{PASOS[step].split(" ").slice(1).join(" ").toUpperCase()}</span>
          <span style={{color:C.textFaint}}>— {step+1}/{PASOS.length}</span>
        </div>
        {renderPaso()}
      </div>

      <NavBar step={step} total={PASOS.length} pasos={PASOS} onStep={setStep}
        canNext={canNext[step]}
        onNext={()=>setStep(s=>Math.min(s+1,PASOS.length-1))}
        onPrev={()=>setStep(s=>Math.max(s-1,0))}
        canAnalizar={canAnalizar}/>
    </div>
  );
}
