"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession, signOut, signIn, SessionProvider } from "next-auth/react";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
// ═══════════════════════════════════════════════════════════════════
// AGROMIND PRO v16 — PARTE 1: MOTOR DEL MODELO
// ══════════════════════════════════════════════════════════════════
// ─── BIOTIPOS ─────────────────────────────────────────────────────
// Parámetros: movCC = movilización CC (1=Angus base) · recCC = recuperación
// umbralAnestro = CC mínima para ciclar · factReq = factor requerimiento energético
// Fuentes: Short et al. 1990; Neel et al. 2007; Peruchena INTA 2003; Balbuena 2001-2009
const BIOTIPOS = {
  // ── Cebú puro — dominante en NEA subtropical ───────────────────
  "Nelore":               { movCC:0.72, recCC:0.83, umbralAnestro:2.9, factReq:0.89, nombre:"Nelore (Zebu)" },
  "Brahman":              { movCC:0.70, recCC:0.85, umbralAnestro:2.8, factReq:0.90, nombre:"Brahman puro" },
  "Indobrasil":           { movCC:0.71, recCC:0.84, umbralAnestro:2.8, factReq:0.90, nombre:"Indobrasil" },
  "Gyr / Guzerat":        { movCC:0.71, recCC:0.83, umbralAnestro:2.8, factReq:0.89, nombre:"Gyr / Guzerat" },

  // ── Aberdeen Angus y cruces ─────────────────────────────────────
  "Aberdeen Angus":       { movCC:1.00, recCC:1.00, umbralAnestro:3.8, factReq:1.00, nombre:"Aberdeen Angus" },
  // F1 son los más comunes en NEA: heterosis máxima
  "F1 Nelore × Angus":    { movCC:0.85, recCC:0.93, umbralAnestro:3.2, factReq:0.94, nombre:"F1 Nelore × Angus (50% Cebú)" },
  "F1 Nelore × Hereford": { movCC:0.84, recCC:0.92, umbralAnestro:3.1, factReq:0.94, nombre:"F1 Nelore × Hereford (50% Cebú)" },
  "Brangus 3/8":          { movCC:0.82, recCC:0.92, umbralAnestro:3.2, factReq:0.95, nombre:"Brangus 3/8 Cebú (Angus×Brahman)" },
  "Brangus 5/8":          { movCC:0.88, recCC:0.96, umbralAnestro:3.4, factReq:0.98, nombre:"Brangus 5/8 Cebú (Angus×Brahman)" },

  // ── Hereford y cruces ──────────────────────────────────────────
  "Hereford":             { movCC:0.98, recCC:0.98, umbralAnestro:3.7, factReq:1.00, nombre:"Hereford" },
  // Bradford = Hereford × Brahman
  // 3/8 Cebú: heterosis máxima — mejor adaptación al calor que Hereford puro,
  // menor sensibilidad a fotoperíodo, umbral anestro intermedio.
  // Fuente: Short et al. 1990; Neel et al. 2007; Peruchena INTA 2003
  "Bradford 3/8":         { movCC:0.83, recCC:0.91, umbralAnestro:3.1, factReq:0.94, nombre:"Bradford 3/8 Cebú (Hereford×Brahman)" },
  "Bradford 5/8":         { movCC:0.87, recCC:0.95, umbralAnestro:3.3, factReq:0.97, nombre:"Bradford 5/8 Cebú (Hereford×Brahman)" },
  // Braford (mismo fenotipo pero denominación uruguaya/brasileña — parámetros idénticos)
  "Braford 3/8":          { movCC:0.83, recCC:0.91, umbralAnestro:3.1, factReq:0.94, nombre:"Braford 3/8 Cebú (Hereford×Cebú)" },
  "Braford 5/8":          { movCC:0.87, recCC:0.95, umbralAnestro:3.3, factReq:0.97, nombre:"Braford 5/8 Cebú (Hereford×Cebú)" },

  // ── Otras razas europeas ────────────────────────────────────────
  "Limousin":             { movCC:1.02, recCC:1.01, umbralAnestro:3.9, factReq:1.02, nombre:"Limousin" },
  "Charolais":            { movCC:1.01, recCC:1.00, umbralAnestro:3.8, factReq:1.02, nombre:"Charolais" },
  "Simmental":            { movCC:0.99, recCC:0.99, umbralAnestro:3.7, factReq:1.01, nombre:"Simmental" },

  // ── Razas adaptadas tropicales ──────────────────────────────────
  "Bonsmara":             { movCC:0.80, recCC:0.90, umbralAnestro:3.1, factReq:0.93, nombre:"Bonsmara (5/8 Afrikaner × Hereford/Shorthorn)" },
  "Simbrah":              { movCC:0.81, recCC:0.90, umbralAnestro:3.0, factReq:0.93, nombre:"Simbrah (Simmental×Brahman)" },
  "Senepol":              { movCC:0.84, recCC:0.92, umbralAnestro:3.2, factReq:0.94, nombre:"Senepol" },
  "Beefmaster":           { movCC:0.80, recCC:0.89, umbralAnestro:3.0, factReq:0.92, nombre:"Beefmaster" },

  // ── Cruza comercial ─────────────────────────────────────────────
  "Cruza comercial":      { movCC:0.88, recCC:0.93, umbralAnestro:3.3, factReq:0.96, nombre:"Cruza comercial (promedio)" },
};
const BIOTIPO_DEF = BIOTIPOS["Brangus 3/8"];
const getBiotipo = (k) => BIOTIPOS[k] || BIOTIPO_DEF;

// ─── SUPLEMENTOS ──────────────────────────────────────────────────
const SUPLEMENTOS = {
  "Expeller soja":      { pb:44,  em:2.80, degProt:65, degEner:75, precio:1.0, label:"Expeller soja" },
  "Expeller girasol":   { pb:36,  em:2.60, degProt:60, degEner:72, precio:0.7, label:"Expeller girasol" },
  "Expeller algodón":   { pb:36,  em:2.70, degProt:60, degEner:72, precio:0.75, label:"Expeller algodón" },
  "Semilla algodón":    { pb:23,  em:2.95, degProt:55, degEner:78, precio:0.9,  label:"Semilla de algodón (proteína bypass + grasa)" },
  "Urea tamponada":     { pb:280, em:0.00, degProt:100,degEner:0,  precio:1.2, label:"Urea tamponada" },
  "Maíz grano":         { pb:9,   em:3.30, degProt:50, degEner:82, precio:0.6, label:"Maíz grano" },
  "Sorgo grano":        { pb:10,  em:3.10, degProt:52, degEner:80, precio:0.5, label:"Sorgo grano" },
  "Rollo silaje maíz":  { pb:8,   em:2.50, degProt:58, degEner:68, precio:0.3, label:"Rollo/Silaje maíz" },
  "Pellet trigo":       { pb:16,  em:3.00, degProt:62, degEner:78, precio:0.8, label:"Pellet de trigo" },
  "Mix proteico-energ": { pb:28,  em:2.90, degProt:65, degEner:76, precio:0.9, label:"Mix proteico-energético" },
};
const getSupl = (k) => SUPLEMENTOS[k] || SUPLEMENTOS["Expeller girasol"];

// ─── PRODUCCIÓN BASE FORRAJERA ────────────────────────────────────
const PROD_BASE = {
  "Pastizal natural NEA/Chaco":                   14,
  "Megatérmicas C4 (gatton panic, brachiaria)":   22,
  "Pasturas templadas C3":                         16,
  "Mixta gramíneas+leguminosas":                   18,
  "Bosque nativo":                                  2.5,
  "Verdeo de invierno":                            20,
};

// ─── FACTORES AMBIENTALES ─────────────────────────────────────────
const UTIL        = 0.40;
const factorT     = (t) => t>=25?1.0 : t>=20?0.80 : t>=15?0.45 : t>=10?0.15 : 0.05;
const factorP     = (p) => p>=100?1.0 : p>=50?0.85 : p>=20?0.60 : 0.30;
const factorN     = (ndvi) => Math.min(1.5, Math.max(0.5, 0.5 + parseFloat(ndvi||0.45)*1.2));
const modENSO     = (e) => e==="nino"?1.25 : e==="nina"?0.75 : 1.0;

// ─── CLIMA HISTÓRICO POR PROVINCIA (T°C media, Precip mm/mes) ────
// ─── OFERTA MENSUAL CON VARIACIÓN ESTACIONAL ──────────────────────
// La oferta NO es plana: colapsa en invierno (T<15°C en gramíneas C4)
function calcOfertaMensualArray(veg, ndvi, provincia, enso, fenolActual) {
  const hist  = getClima(provincia || "Corrientes");
  const pb    = PROD_BASE[veg] || 8;
  const ndviN = parseFloat(ndvi) || 0.45;
  const modE  = modENSO(enso);
  const fenolMes = [
    "menor_10","menor_10","10_25","10_25",
    "25_50","mayor_50","mayor_50","mayor_50",
    "25_50","10_25","menor_10","menor_10"
  ];
  return hist.map((m, i) => {
    const t    = m.t || 20;
    const p    = (m.p || 60) * modE;
    const fenol= fenolMes[i];
    const kgMs = Math.max(0,
      pb * factorN(ndviN) * factorT(t) * factorP(p) * UTIL * fAprovFenol(fenol)
    );
    return +(kgMs * mcalKgAdj(t, fenol)).toFixed(2);
  });
}

const mcalKgAdj = (t, fenol) => {
  const base = t>=25?2.10 : t>=20?1.90 : t>=15?1.50 : t>=10?1.00 : 0.65;
  return base * ({menor_10:1.00,"10_25":0.95,"25_50":0.85,mayor_50:0.72}[fenol] || 1.00);
};
const fAprovFenol = (fenol) => ({menor_10:1.00,"10_25":0.90,"25_50":0.75,mayor_50:0.55}[fenol] || 1.00);
const pbPasto     = (fenol) => ({menor_10:12, "10_25":9, "25_50":6, mayor_50:4}[fenol] || 10);

// ─── OFERTA FORRAJERA ─────────────────────────────────────────────
function calcOfPasto(veg, ndvi, temp, precip, enso, fenol) {
  const pb   = PROD_BASE[veg] || 8;
  const kgMs = Math.max(0,
    pb * factorN(ndvi) * factorT(temp) * factorP(precip * modENSO(enso)) * UTIL * fAprovFenol(fenol)
  );
  return kgMs * mcalKgAdj(temp, fenol);
}

// ─── REQUERIMIENTOS ENERGÉTICOS ───────────────────────────────────
// NRC 2000; Detmann/NASSEM 2010
function reqEM(pv, cat, biotipo) {
  const p = parseFloat(pv) || 0;
  if (!p) return null;
  const bFact = biotipo ? getBiotipo(biotipo).factReq : 1.0;
  const f = {
    "Gestación temprana (1–4 meses)":  1.15,
    "Gestación media (5–7 meses)":     1.20,
    "Preparto (último mes)":           1.35,
    "Lactación con ternero al pie":    1.90,
    "Vaca seca sin ternero":           1.00,
    "Vaca 1° parto lactando":          2.10,
    vaq1inv: 1.30,
    vaq2inv: 1.20,
  }[cat] || 1.10;
  return +(Math.pow(p, 0.75) * 0.077 * f * bFact).toFixed(1);
}

// ─── SINCRONÍA RUMINAL ────────────────────────────────────────────
// Detmann/NASSEM 2010 — proteína degradable × energía fermentable
function evaluarSincronia(fenolPasto, supl, dosisKg) {
  if (!supl || !dosisKg) return null;
  const s       = getSupl(supl);
  const pbP     = pbPasto(fenolPasto);
  const pbTotal = (pbP * 10 + s.pb * dosisKg) / (10 + dosisKg);
  const emSuplTotal = s.em * dosisKg;
  const warnings = [];

  if (supl === "Urea tamponada" && fenolPasto === "mayor_50") {
    warnings.push({ nivel:"rojo", msg:"⚠️ RIESGO: Urea con pasto >50% floración — digestibilidad <55%. Energía fermentable insuficiente. Riesgo de intoxicación." });
  }
  if (supl === "Urea tamponada" && fenolPasto === "25_50") {
    warnings.push({ nivel:"ambar", msg:"Urea con pasto 25–50% floración — monitorear consumo. Combinar con fuente energética (maíz/sorgo)." });
  }
  if (pbTotal < 8 && s.pb < 20) {
    warnings.push({ nivel:"ambar", msg:`Proteína dietaria total estimada: ${pbTotal.toFixed(1)}% — por debajo del mínimo ruminal (8%). Aumentar dosis o cambiar fuente.` });
  }
  if (pbTotal > 18 && pbP > 10) {
    warnings.push({ nivel:"info", msg:`PB total estimada: ${pbTotal.toFixed(1)}% — posible exceso. Evaluar reducir dosis o cambiar a fuente energética.` });
  }
  return {
    pbTotal:    +pbTotal.toFixed(1),
    emSupl:     +emSuplTotal.toFixed(1),
    warnings,
    eficiente:  warnings.filter(w => w.nivel === "rojo").length === 0,
  };
}

// ─── APORTE ENERGÉTICO SUPLEMENTO ────────────────────────────────
function mcalSuplemento(supl, dosisKg) {
  if (!supl || !dosisKg) return 0;
  return getSupl(supl).em * dosisKg;
}

// ─── CONSUMO VOLUNTARIO DE PASTO ─────────────────────────────────
// Fuentes: Lippke 1980; Minson 1990
// CV: <10%flor→2.8%PV · 10-25%→2.4% · 25-50%→2.0% · >50%→1.6%PV
function calcConsumoPasto(pvVaca, fenol, temp) {
  const pv    = parseFloat(pvVaca) || 320;
  const t     = parseFloat(temp)   || 25;
  const cvPct = { menor_10:2.8, "10_25":2.4, "25_50":2.0, mayor_50:1.6 }[fenol] || 2.4;
  const dig   = { menor_10:68,  "10_25":63,  "25_50":58,  mayor_50:52  }[fenol] || 63;
  const pb    = pbPasto(fenol);
  // Ajuste temperatura: C4 se restringe con T<15°C
  const factT = t>=25?1.0 : t>=20?0.90 : t>=15?0.75 : 0.50;
  const kgMs  = +((pv * cvPct / 100) * factT).toFixed(1);
  const emKg  = mcalKgAdj(t, fenol);
  const emTotal = +(kgMs * emKg).toFixed(1);
  return { cv:cvPct, kgMs, dig, pb, emTotal };
}

// ─── ANESTRO POSPARTO ────────────────────────────────────────────
// Short et al. 1990; Neel et al. 2007
function calcAnestro(ccParto, ccMinLact, biotipo, primerParto) {
  const bt      = getBiotipo(biotipo || "Brangus 3/8");
  const umbral  = primerParto ? bt.umbralAnestro + 0.3 : bt.umbralAnestro;
  const defCC   = Math.max(0, umbral - ccParto);
  const defMin  = Math.max(0, 2.0 - ccMinLact);
  const baseDias = primerParto ? 70 : 50;
  const diasAnestro = Math.round(baseDias + defCC * 30 + defMin * 25);
  return { dias: diasAnestro, riesgo: diasAnestro > 55 };
}

// ─── INTERPOLACIÓN CC → PREÑEZ ────────────────────────────────────
// Peruchena INTA 2003; Selk 1988
// Tabla preñez vs CC al servicio — Peruchena INTA 2003, validada Balbuena INTA 2001-2009
// CC escala 1–9 / Rodeo cruza NEA/NOA (Brangus/Bradford base)
// CC 4.0 al servicio → ~70% preñez (referencia campo Bermejo, n=470 vientres)
// CC 5.0 → ~88% · CC 5.5 → ~93% · CC 6.0 → ~96%
const CC_PR = [
  {ccP:7.0,pr:98},{ccP:6.5,pr:97},{ccP:6.0,pr:96},{ccP:5.5,pr:93},
  {ccP:5.0,pr:88},{ccP:4.5,pr:80},{ccP:4.0,pr:70},{ccP:3.5,pr:50},{ccP:3.0,pr:28},{ccP:2.5,pr:10},
];
function interpCC(ccP) {
  if (ccP >= CC_PR[0].ccP)                    return { pr: CC_PR[0].pr };
  if (ccP <= CC_PR[CC_PR.length-1].ccP)       return { pr: CC_PR[CC_PR.length-1].pr };
  for (let i = 0; i < CC_PR.length-1; i++) {
    if (ccP <= CC_PR[i].ccP && ccP >= CC_PR[i+1].ccP) {
      const r = (ccP - CC_PR[i+1].ccP) / (CC_PR[i].ccP - CC_PR[i+1].ccP);
      return { pr: Math.round(CC_PR[i+1].pr + r * (CC_PR[i].pr - CC_PR[i+1].pr)) };
    }
  }
  return { pr: 20 };
}

// ─── TRAYECTORIA CC — MOTOR REAL (Peruchena INTA 2003 / Selk 1988) ──────
// FASE 1: HOY → PARTO
//   En invierno (C4 detenido): la vaca PIERDE CC — gestación avanzada con
//   pasto escaso consume reservas propias. Pérdida típica: −0.5 a −1.0 CC
//   En verano/otoño (C4 activo): puede mantenerse o subir ligeramente.
//   El suplemento preparto (supl3) modera la pérdida.
//
// FASE 2: PARTO → DESTETE (lactación)
//   Caída energética máxima: 0.5–0.8 CC/mes (nadir a los 45–60d posparto).
//   Bos indicus moviliza menos (movCC < 1) pero recupera más lento.
//   Suplemento en lactación (supl2) reduce la caída.
//
// FASE 3: DESTETE → PRÓXIMO SERVICIO
//   Verano-otoño post-destete: recuperación 0.3–0.5 CC/mes con buen pasto.
//   Invierno: recuperación lenta 0.1–0.2 CC/mes (requiere suplemento, supl1).
//   Objetivo mínimo servicio: CC 4.0 → 75% preñez (Peruchena 2003)
//
// La tasa de pérdida preparto depende del mes (temperatura / C4):
//   Mes con T > 20°C (C4 activo): CC baja 0.003/día (pasto disponible)
//   Mes con T < 15°C (C4 detenido): CC baja 0.006/día (sin pasto megatérmico)
//
function calcTrayectoriaCC(params) {
  const {
    dist, cadena, destTrad, destAntic, destHiper, supHa, vacasN,
    biotipo, primerParto,
    supl1, dosis1, supl2, dosis2, supl3, dosis3,
    provincia,
  } = params;

  const ccH = ccPond(dist);
  if (!ccH || !cadena) return null;

  const bt       = getBiotipo(biotipo);
  const ha       = parseFloat(supHa) || 100;
  const vN       = parseFloat(vacasN) || 50;
  const cargaEV  = vN / ha;
  const ajCarga  = cargaEV > 0.8 ? -0.05 : cargaEV > 0.5 ? -0.02 : 0;

  const hist = getClima(provincia || "Corrientes");

  // ── FASE 1: HOY → PARTO ──
  // Determinar la tasa de pérdida/ganancia por mes según temperatura
  // La vaca en gestación avanzada e invierno PIERDE CC, no gana
  const diasHastaParto = Math.max(0, cadena.diasPartoTemp || 0);
  const mcalSuplPreP   = mcalSuplemento(supl3, parseFloat(dosis3) || 0);
  // Suplemento preparto reduce pérdida: 0.5 Mcal/d ≈ −0.15 CC menos de pérdida
  const reducPerdPreP  = mcalSuplPreP > 0 ? Math.min(0.5, mcalSuplPreP * 0.08) : 0;

  // Simular mes a mes de hoy al parto
  const hoyMes = new Date().getMonth();
  let ccParto  = ccH;
  for (let d = 0; d < diasHastaParto; d++) {
    const mes = (hoyMes + Math.floor(d / 30)) % 12;
    const t   = hist[mes]?.t || 20;
    // Tasa diaria: invierno (C4 off) = pierde más; verano = pierde menos o se mantiene
    const tasaDia = t < 15 ? -0.007 : t < 20 ? -0.004 : -0.001;
    // Suplemento modera la pérdida (convierte pérdida en menor pérdida)
    ccParto += tasaDia + reducPerdPreP / Math.max(1, diasHastaParto);
  }
  ccParto = parseFloat(Math.min(9, Math.max(1, ccParto)).toFixed(2));

  // ── FASE 2: PARTO → DESTETE ──
  const pT = parseFloat(destTrad)  || 0;
  const pA = parseFloat(destAntic) || 0;
  const pH = parseFloat(destHiper) || 0;
  const tot = pT + pA + pH || 100;
  const mesesLact = (pT*(180/30) + pA*(90/30) + pH*(50/30)) / tot;

  // Caída CC en lactación: más intensa cuanto menor es la CC al parto
  // (la vaca que entra con CC alta tiene más reservas para movilizar)
  // Peruchena 2003: 0.5 CC/mes con CC parto ≥ 5.0; 0.4 con CC < 4.5
  // Caída CC por mes en lactación (Peruchena INTA 2003; calibrado campo NEA)
  // Bos indicus moviliza menos grasa que Bos taurus → tasaCaidaBase reducida
  // CC 5.5+ al parto: buen estado, pierde menos por mes
  // CC < 4.5 al parto: ya comprometida, pierde lo poco que tiene
  const tasaCaidaBase = ccParto >= 6.0 ? 0.28
    : ccParto >= 5.5 ? 0.32
    : ccParto >= 5.0 ? 0.36
    : ccParto >= 4.5 ? 0.40
    : 0.44;
  const tasaCaida  = tasaCaidaBase * bt.movCC;
  const mcalSuplLact = mcalSuplemento(supl2, parseFloat(dosis2) || 0);
  // En la práctica supl2 llega vacío (vacas no se suplementan con ternero al pie)
  // Se mantiene para simulación comparativa. La reducción real es por destete precoz.
  const reducCaida = mcalSuplLact > 0 ? Math.min(0.10, mcalSuplLact * 0.015) : 0;
  const caidaLact  = Math.min(2.5, mesesLact * (tasaCaida - reducCaida));
  const ccMinLact  = parseFloat(Math.max(1.0, ccParto - caidaLact).toFixed(2));
  const anestro    = calcAnestro(ccParto, ccMinLact, biotipo, primerParto);
  const ccDestete  = ccMinLact;

  // ── FASE 3: DESTETE → PRÓXIMO SERVICIO ──
  // Recuperación post-destete: depende del mes de destete y del pasto disponible
  // En verano: 0.4–0.5 CC/mes; en invierno: 0.1–0.2 CC/mes (requiere supl)
  const mesParto   = cadena.partoTemp ? cadena.partoTemp.getMonth() : 10;
  const mesDestete = (mesParto + Math.round(mesesLact)) % 12;
  const mesServ    = cadena.ini ? cadena.ini.getMonth() : (mesParto + 3) % 12;
  // Acotar a máximo 180 días (6 meses) — evita que ccServ llegue a valores imposibles
  // cuando el servicio queda muy lejos o la fecha no está cargada
  const diasRecupRaw = ((mesServ - mesDestete + 12) % 12) * 30;
  // Máximo 120 días (4 meses): intervalo destete-servicio real en NEA
  // Si no hay fecha de servicio cargada, la estimación automática (mesParto+3)
  // puede dar hasta 9 meses de recuperación → ccServ irreal.
  const diasRecup    = Math.min(120, Math.max(0, diasRecupRaw));

  const mcalSuplInv   = mcalSuplemento(supl1, parseFloat(dosis1) || 0);
  let   ccServ        = ccDestete;
  for (let d = 0; d < diasRecup; d++) {
    const mes = (mesDestete + Math.floor(d / 30)) % 12;
    const t   = hist[mes]?.t || 20;
    // Tasa de recuperación: verano con buen pasto C4 = 0.015/día; invierno = 0.004/día
    // Tasa diaria calibrada: verano C4 activo max 0.5 CC/mes = 0.017/día
    // pero acotada: el animal no puede ganar más de 1.5 CC en toda la recuperación
    const tasaRecup = t >= 25 ? 0.013 : t >= 20 ? 0.009 : t >= 15 ? 0.005 : 0.003;
    // Boost por suplemento invernal
    const boostSupl = mcalSuplInv > 0 ? Math.min(0.005, mcalSuplInv * 0.0015) : 0;
    ccServ += (tasaRecup + boostSupl + ajCarga / Math.max(1, diasRecup));
  }
  // No puede superar la CC al parto + 1.5 (techo fisiológico de recuperación post-parto)
  // Techo biológico real: la vaca no puede recuperar más de 1.0 CC en 4 meses
  // (en condiciones normales NEA: 0.3–0.5 CC/mes en verano con buen pasto)
  // Y no puede superar CC 6.0 en un sistema pastoril extensivo
  ccServ = parseFloat(Math.min(ccParto + 1.0, Math.min(6.0, Math.max(1, ccServ))).toFixed(2));

  const pr = interpCC(ccServ).pr;

  return {
    ccHoy:    ccH,
    ccParto,
    ccMinLact,
    ccDestete,
    ccServ,
    pr,
    mesesLact:    mesesLact.toFixed(1),
    caidaLact:    caidaLact.toFixed(2),
    anestro,
    tasaCaida:    tasaCaida.toFixed(3),
    reducCaida:   reducCaida.toFixed(3),
    diasHastaParto,
    diasRecup,
    mesParto, mesDestete, mesServ,
  };
}

// ─── DISTRIBUCIÓN CC POR GRUPO ───────────────────────────────────
// Calcula trayectoria individual para cada grupo de CC del rodeo
// y recomienda el tipo de destete óptimo para cada uno
// basado en Peruchena INTA 2003 y el motor de trayectoria real
function calcDistCC(params) {
  const {
    dist, cadena, destTrad, destAntic, destHiper,
    supHa, vacasN, biotipo, provincia,
    supl1, dosis1, supl2, dosis2, supl3, dosis3,
  } = params;

  if (!dist || !cadena) return { grupos:[], caidaLact:"0", mesesLact:"0", diasLactPond:0 };

  const bt      = getBiotipo(biotipo);
  const ha      = parseFloat(supHa) || 100;
  const vN      = parseFloat(vacasN) || 50;
  const cargaEV = vN / ha;
  const ajCarga = cargaEV > 0.8 ? -0.05 : cargaEV > 0.5 ? -0.02 : 0;
  const hist    = getClima(provincia || "Corrientes");

  const pTrad  = parseFloat(destTrad)  || 0;
  const pAntic = parseFloat(destAntic) || 0;
  const pHiper = parseFloat(destHiper) || 0;
  const totalD = pTrad + pAntic + pHiper || 100;
  const diasLactPond = (pTrad/totalD)*180 + (pAntic/totalD)*90 + (pHiper/totalD)*50;
  const mesesLact    = diasLactPond / 30;

  // Parámetros suplementación
  const mcalSuplLact = mcalSuplemento(supl2, parseFloat(dosis2) || 0);
  const mcalSuplInv  = mcalSuplemento(supl1, parseFloat(dosis1) || 0);
  const mcalSuplPreP = mcalSuplemento(supl3, parseFloat(dosis3) || 0);
  const reducPerdPreP = mcalSuplPreP > 0 ? Math.min(0.5, mcalSuplPreP * 0.08) : 0;
  const reducCaida    = mcalSuplLact > 0 ? Math.min(0.30, mcalSuplLact * 0.030) : 0;

  // Fechas clave
  const hoyMes    = new Date().getMonth();
  const mesParto  = cadena.partoTemp ? cadena.partoTemp.getMonth() : 10;
  const mesServ   = cadena.ini ? cadena.ini.getMonth() : (mesParto + 3) % 12;
  const diasHastaParto = Math.max(0, cadena.diasPartoTemp || 0);

  // Función: calcular CC al parto para un grupo dado su CC actual
  const calcCcParto = (ccHoy) => {
    let cc = ccHoy;
    for (let d = 0; d < diasHastaParto; d++) {
      const mes = (hoyMes + Math.floor(d / 30)) % 12;
      const t   = hist[mes]?.t || 20;
      const tasaDia = t < 15 ? -0.007 : t < 20 ? -0.004 : -0.001;
      cc += tasaDia + reducPerdPreP / Math.max(1, diasHastaParto);
    }
    return parseFloat(Math.min(9, Math.max(1, cc)).toFixed(2));
  };

  // Función: calcular CC al servicio dado ccDestete y mes de destete
  const calcCcServ = (ccDestete, mesDestete) => {
    const diasRecup = Math.max(0, ((mesServ - mesDestete + 12) % 12) * 30);
    let cc = ccDestete;
    for (let d = 0; d < diasRecup; d++) {
      const mes = (mesDestete + Math.floor(d / 30)) % 12;
      const t   = hist[mes]?.t || 20;
      const tasaRecup = t >= 25 ? 0.016 : t >= 20 ? 0.012 : t >= 15 ? 0.006 : 0.003;
      const boostSupl = mcalSuplInv > 0 ? Math.min(0.005, mcalSuplInv * 0.0015) : 0;
      cc += tasaRecup + boostSupl + ajCarga / Math.max(1, diasRecup);
    }
    return parseFloat(Math.min(9, Math.max(1, cc)).toFixed(2));
  };

  const grupos = (dist || []).map(d => {
    const ccHoy = parseFloat(d.cc) || 0;
    const pct   = parseFloat(d.pct) || 0;
    if (!ccHoy || !pct) return null;

    const ccParto = calcCcParto(ccHoy);
    const tasaCaidaBase = ccParto >= 6.0 ? 0.38 : ccParto >= 5.0 ? 0.45 : ccParto >= 4.5 ? 0.52 : 0.58;
    const tasaCaida  = tasaCaidaBase * bt.movCC;
    const caida      = Math.min(2.5, mesesLact * (tasaCaida - reducCaida));
    const ccMinLact  = parseFloat(Math.max(1.0, ccParto - caida).toFixed(2));
    const ccDestete  = ccMinLact;
    const anestro    = calcAnestro(ccParto, ccMinLact, biotipo, false);
    const mesDestete = (mesParto + Math.round(mesesLact)) % 12;
    const ccServ     = calcCcServ(ccDestete, mesDestete);
    const pr         = interpCC(ccServ).pr;

    // Recomendación de destete: qué modalidad necesita este grupo para llegar a CC 4.0 mínimo al servicio
    // Calcular ccServ con cada modalidad de destete
    const calcCcServModal = (diasLactModal) => {
      const caidaModal = Math.min(2.5, (diasLactModal/30) * (tasaCaida - reducCaida));
      const ccMinModal = Math.max(1.0, ccParto - caidaModal);
      const mesDestModal = (mesParto + Math.round(diasLactModal/30)) % 12;
      return calcCcServ(ccMinModal, mesDestModal);
    };
    const ccServHiper = calcCcServModal(50);
    const ccServAntic = calcCcServModal(90);
    const ccServTrad  = calcCcServModal(180);

    // Recomendación: el destete más tardío que igual llegue a CC ≥ 4.0 al servicio
    // (priorizar el bienestar del ternero — no destetarlos antes de lo necesario)
    let recDestete, urgencia, motivoDestete;
    if (ccServTrad >= 4.0) {
      recDestete = "🟢 Tradicional (180d)"; urgencia = "preventivo";
      motivoDestete = `CC serv. ${ccServTrad} con destete tradicional — OK`;
    } else if (ccServAntic >= 4.0) {
      recDestete = "🔶 Anticipado (90d)"; urgencia = "importante";
      motivoDestete = `Trad. daría CC ${ccServTrad} — Anticipado alcanza CC ${ccServAntic}`;
    } else {
      recDestete = "⚡ Hiperprecoz (50d)"; urgencia = "urgente";
      motivoDestete = `Solo hiperprecoz logra CC ${ccServHiper} al servicio (mín. 4.0)`;
    }

    return {
      ccHoy, pct, ccParto, ccMinLact, ccDestete, ccServ, pr,
      ccServHiper, ccServAntic, ccServTrad,
      recDestete, urgencia, motivoDestete, anestro,
      caida: +caida.toFixed(2),
      mesParto, mesDestete, mesServ,
    };
  }).filter(Boolean);

  return {
    grupos,
    caidaLact:    (mesesLact * 0.50).toFixed(2),
    mesesLact:    mesesLact.toFixed(1),
    diasLactPond: Math.round(diasLactPond),
  };
}

// ─── TERNEROS ─────────────────────────────────────────────────────
// PV al parto: 35 kg (promedio NEA/NOA, biotipo intermedio)
// GDP al pie de la madre: 700 g/d (Hereford/Angus cruzado · NEA)
//   Bos indicus puro puede ser 600 g/d, taurino puro 750–800 g/d
//   700 g/d es el estándar de campo para cruza comercial NEA
// GDP post-destete en pastizal hasta mayo: 400 g/d mínimo
//   (pastizal natural seco, sin suplementación)
//   Con mejora forrajera o suplementación puede llegar a 500–550 g/d
// Fuente: INTA EEA Mercedes · Peruchena 2003 · Bavera 2005
function calcTerneros(vacasN, prenez, pctDestete, destTrad, destAntic, destHiper, cadena) {
  const vN = parseInt(vacasN)        || 0;
  const pr = parseFloat(prenez)      || 0;
  const pd = parseFloat(pctDestete)  || 88;
  if (!vN || !pr) return null;

  const terneros = Math.round(vN * pr / 100 * pd / 100);
  const pT  = parseFloat(destTrad)  || 0;
  const pA  = parseFloat(destAntic) || 0;
  const pH  = parseFloat(destHiper) || 0;
  const tot = pT + pA + pH || 100;

  // GDP AL PIE DE LA MADRE (g/d) — los días que van con la vaca
  const GDP_MADRE = { trad:0.700, antic:0.700, hiper:0.700 };
  // GDP POST-DESTETE en pastizal (g/d) — desde destete hasta mayo
  const GDP_POST  = { trad:0.400, antic:0.400, hiper:0.400 };

  const partoRef = cadena?.partoTemp || new Date(new Date().getFullYear(), 9, 1);

  const calcMayo = (diasLact, gdpMadre, gdpPost) => {
    const dest = new Date(partoRef);
    dest.setDate(dest.getDate() + diasLact);
    const anoRef  = dest.getFullYear();
    let mayo1     = new Date(anoRef, 4, 1);
    if (mayo1 <= dest) mayo1 = new Date(anoRef + 1, 4, 1);
    const diasPost = Math.max(0, Math.round((mayo1 - dest) / (1000*60*60*24)));
    const pvDest   = Math.round(35 + gdpMadre * diasLact);
    return { pvDest, pvMayo: Math.round(pvDest + gdpPost * diasPost) };
  };

  const resTrad  = calcMayo(180, GDP_MADRE.trad,  GDP_POST.trad);
  const resAntic = calcMayo(90,  GDP_MADRE.antic, GDP_POST.antic);
  const resHiper = calcMayo(50,  GDP_MADRE.hiper, GDP_POST.hiper);

  const pvMayoPond = Math.round(
    (pT/tot)*resTrad.pvMayo + (pA/tot)*resAntic.pvMayo + (pH/tot)*resHiper.pvMayo
  );
  const alertaHiper = (pH / tot) > 0.30;
  const detalle = [
    { label:"Tradicional (180d)", pct:pT/tot, pvDest:resTrad.pvDest,  pvMayo:resTrad.pvMayo  },
    { label:"Anticipado (90d)",   pct:pA/tot, pvDest:resAntic.pvDest, pvMayo:resAntic.pvMayo },
    { label:"Hiperprecoz (50d)",  pct:pH/tot, pvDest:resHiper.pvDest, pvMayo:resHiper.pvMayo },
  ];
  return { terneros, pvMayoPond, alertaHiper, detalle };
}

// ─── VAQUILLONA 1° INVIERNO ───────────────────────────────────────
// Objetivo: 60% PV adulta en agosto (~90d mayo→agosto)
// NRC 2000; INTA Rafaela; Lippke 1980; Detmann 2010
// ─── DISPONIBILIDAD FORRAJERA (kgMS/ha) ──────────────────────────
// Tabla INTA EEA Colonia Benítez — Rosello Brajovich et al. 2025
// Cuadro 1: Estimación cantidad de pasto según altura × tipo
const TABLA_DISP_MS = {
  // [altCm]: { corto_denso:[min,max], alto_ralo:[min,max], alto_denso:[min,max] }
  10: { corto_denso:[1000,1200], alto_ralo:[600,800],   alto_denso:[800,1000]  },
  20: { corto_denso:[1800,2400], alto_ralo:[1000,1200], alto_denso:[1800,2400] },
  30: { corto_denso:[2700,3200], alto_ralo:[2000,3000], alto_denso:[3300,3700] },
  40: { corto_denso:[3000,5000], alto_ralo:[3000,5000], alto_denso:[4500,5000] },
};
function calcDisponibilidadMS(altPasto, tipoPasto) {
  const alt  = parseFloat(altPasto) || 20;
  const tipo = tipoPasto || "alto_denso";
  // Buscar la clave más cercana
  const claves = [10, 20, 30, 40];
  const clave  = claves.reduce((a, b) => Math.abs(b - alt) < Math.abs(a - alt) ? b : a);
  const rango  = TABLA_DISP_MS[clave]?.[tipo] || [1000, 2000];
  const msHa   = Math.round((rango[0] + rango[1]) / 2);
  // Clasificación por cantidad
  const nivel = msHa >= 2000 ? "alta" : msHa >= 1000 ? "media" : "baja";
  return { msHa, nivel, rango, alt, tipo };
}

// ─── VAQUILLONA 1° INVIERNO — motor completo ─────────────────────
// Reglas (Balbuena INTA 2003; Rosello Brajovich 2025; Detmann/NASSEM 2010):
//
// CANTIDAD alta (>2000 kgMS/ha) + CALIDAD baja (fenología >25% floración):
//   → Solo proteína: 0.5–0.7% PV · frecuencia 2–3x/semana (no diario)
//   → Fuente: expeller girasol/algodón/soja
//
// CANTIDAD baja (<1000 kgMS/ha):
//   → Proteína 0.7% PV + Energía 0.4% PV (sorgo/maíz molido) · DIARIO OBLIGATORIO
//   → Energía con almidón (maíz/sorgo) SIEMPRE diario — riesgo acidosis si intermitente
//
// Semilla de algodón como energía en Vaq1: máx 0.4% PV/día
//   → Si se supera: reduce digestibilidad fibra (Balbuena 2003)
//   → Ad libitum válido SOLO para Vaq2 (>280 kg PV)
//
// Urea: SIEMPRE diario — pico amonio si se da en bolo cada 2–3 días
function calcVaq1(pvEntrada, pvAdulta, ndvi, edadMayo, tipoDestete, disponMS, fenologia) {
  const pv   = parseFloat(pvEntrada) || 0;
  const pva  = parseFloat(pvAdulta)  || 320;
  if (!pv) return { mensaje:"Ingresá el PV de entrada para calcular suplementación." };

  // Objetivo Vaq1: ganar MÍNIMO 65 kg entre mayo e inicio de septiembre (122 días)
  // GDP mínimo = 65000g / 122d = 532 g/d
  // Este animal tiene TODO UN AÑO más hasta el entore (agosto → entore próximo año)
  // El invierno es crítico para evitar que quede retrasada en PV
  const DIAS_INV_VAQ1 = 122; // mayo (día 1) → inicio septiembre
  const gdpMinInv    = Math.round(65000 / DIAS_INV_VAQ1); // ≈ 533 g/d
  const objetivo     = Math.round(pv + 65); // PV objetivo al salir del invierno
  const diasInv      = DIAS_INV_VAQ1;
  const gdpNecesario = gdpMinInv;

  // Disponibilidad: cantidad (kgMS/ha) y calidad (fenología)
  const nivelMS    = disponMS?.nivel || "media";      // alta | media | baja
  const msHa       = disponMS?.msHa  || 1500;
  const fenol      = fenologia || "25_50";
  const calidadBaja = ["25_50","mayor_50"].includes(fenol);  // pasto encañado/maduro

  // GDP base en pastizal según CANTIDAD disponible y NDVI
  const ndviN    = parseFloat(ndvi) || 0.45;
  // CANTIDAD baja → GDP reducido independientemente del NDVI
  // GDP real en pastizal natural en invierno NEA (junio-agosto)
  // Aunque haya cantidad, el pasto viejo (lignina alta, dig <45%) + frío limita mucho
  // Valores calibrados con datos INTA EEA Colonia Benítez y Salta
  const gdpPasto = nivelMS === "baja"  ? 60   // <1000 kgMS/ha — hambre real
                 : nivelMS === "media" ? (ndviN > 0.45 ? 130 : 90)  // 1000–2000, muy limitado en frío
                 :                      (ndviN > 0.50 ? 180 : 140); // >2000, techo por temperatura

  const boostComp = tipoDestete === "hiper" ? 50 : tipoDestete === "antic" ? 25 : 0;
  const gdpBase   = gdpPasto + boostComp;

  // Vaq1 SIEMPRE necesita al menos proteína en invierno NEA
  // (pastizal natural <8% PB en invierno — por debajo del mínimo ruminal)
  // Solo si GDP pasto ya supera 722 g/d (raro) se puede omitir suplementación
  if (gdpBase >= gdpNecesario && nivelMS !== "baja" && !calidadBaja) {
    return {
      esc:"—",
      mensaje:`GDP pasto (${gdpBase}g/d) ≥ mínimo requerido (${gdpMinInv}g/d). Monitorear CC y PV mensualmente.`,
      nivelMS, msHa, gdpPasto,
    };
  }

  const gdpFaltante = gdpNecesario - gdpBase;

  // ── ESCENARIO A: Cantidad alta + calidad baja → solo proteína, intermitente
  // ── ESCENARIO B: Cantidad media + calidad baja → proteína, puede ser 2–3x/sem
  // ── ESCENARIO C: Cantidad baja → proteína + energía, DIARIO obligatorio
  let protKg, energKg, freq, freqDetalle, fuenteEnerg, advertencia;

  if (nivelMS === "baja") {
    // Pasto escaso: proteína + energía obligatorio
    protKg      = Math.round(pv * 0.007 * 10) / 10;  // 0.7% PV
    energKg     = Math.round(pv * 0.004 * 10) / 10;  // 0.4% PV
    freq        = "Diario";
    freqDetalle = "⚠️ DIARIO OBLIGATORIO — almidón (sorgo/maíz) provoca acidosis ruminal si se da en días alternos";
    fuenteEnerg = "Sorgo molido o maíz molido (NO semilla de algodón en Vaq1)";
    advertencia = nivelMS === "baja" ? `Disponibilidad crítica (${msHa} kgMS/ha). Evaluar rollo como fibra base.` : null;
  } else if (calidadBaja) {
    // Cantidad media/alta + calidad baja → solo proteína, puede ser intermitente
    protKg      = Math.round(pv * (gdpFaltante > 150 ? 0.007 : 0.005) * 10) / 10;
    energKg     = 0;
    freq        = "2–3 veces/semana";
    freqDetalle = "Proteína sola (sin almidón) puede darse 2–3x/semana. Balbuena INTA 2003";
    fuenteEnerg = null;
    advertencia = `Pasto encañado/maduro: cantidad disponible (${msHa} kgMS/ha) pero baja digestibilidad. Proteína activa la microbiota ruminal.`;
  } else {
    // Cantidad media, calidad normal
    protKg      = gdpFaltante <= 100 ? Math.round(pv*0.003*10)/10 : gdpFaltante <= 200 ? Math.round(pv*0.005*10)/10 : Math.round(pv*0.007*10)/10;
    energKg     = gdpFaltante > 200 ? Math.round(pv*0.003*10)/10 : 0;
    freq        = energKg > 0 ? "Diario" : "2–3 veces/semana";
    freqDetalle = energKg > 0 ? "Incluye energía con almidón → diario obligatorio" : "Solo proteína → puede ser 2–3x/semana";
    fuenteEnerg = energKg > 0 ? "Sorgo molido o maíz molido" : null;
    advertencia = null;
  }

  // Límite semilla de algodón Vaq1: máx 0.4% PV (Balbuena 2003)
  const limAlgVaq1 = Math.round(pv * 0.004 * 10) / 10;
  const alertaAlgodon = protKg > limAlgVaq1
    ? `⚠️ Si usás semilla de algodón: máx ${limAlgVaq1} kg/día (0.4% PV=${pv}kg) — superar reduce digestibilidad de fibra. Ad libitum solo en Vaq2° invierno.`
    : null;

  // GDP real con suplementación
  const gdpReal = Math.round(gdpBase + (protKg/(pv*0.003))*70 + (energKg > 0 ? 60 : 0));
  const pvSal   = Math.round(pv + gdpReal * diasInv / 1000);
  const pvAbr2Inv = Math.round(pvSal + 300 * 60 / 1000); // +60d a 300g/d hasta entrada 2°inv
  const esc     = nivelMS === "baja" ? "C" : gdpFaltante > 150 ? "B" : "A";
  const deficit = pvSal < objetivo;

  const nota = tipoDestete === "hiper"
    ? "⚡ Hiperprecoz: proteína crítica en primeros 30d. Iniciar suplementación inmediata al destete."
    : edadMayo && parseFloat(edadMayo) < 6
    ? "⚠️ Ternero muy joven al inicio del invierno. Aumentar dosis proteica."
    : null;

  return {
    esc, protKg, energKg, freq, freqDetalle, fuenteEnerg,
    gdpReal, pvSal, pvAbr2Inv, objetivo, deficit, nota,
    advertencia, alertaAlgodon,
    nivelMS, msHa, gdpPasto, calidadBaja,
  };
}

// ─── VAQUILLONA 2° INVIERNO ───────────────────────────────────────
// PV entrada 2°inv = PV salida Vaq1 (agosto) + GDP primavera-verano
// agosto → mayo siguiente = ~270d con GDP promedio 300g/d (campo)
// Objetivo: 75% PV adulta al entore (noviembre, ~180d desde mayo 2°inv)
// NRC 2000; INTA Rafaela
function calcPvEntradaVaq2(pvSalidaVaq1) {
  // agosto → mayo próximo = ~270 días
  const GDP_PRIMVERA = 300; // g/d promedio campo libre (gramíneas C4)
  const diasPrimVer  = 270;
  return Math.round((parseFloat(pvSalidaVaq1) || 0) + GDP_PRIMVERA * diasPrimVer / 1000);
}

// ─── VAQUILLONA 2° INVIERNO — GDP mínimo 300 g/d obligatorio ────
// Regla: Vaq2 SIEMPRE necesita suplementación en invierno NEA
// GDP mínimo invierno: 300 g/d (pastizal solo da 200-250 g/d sin suplemento)
// Objetivo entore (noviembre): 75% PV adulto
// Suplementación estratégica: semilla algodón ad libitum viable (>280 kg PV)
// Fuente: Balbuena INTA 2003; Rosello Brajovich 2025
// Vaq2° invierno: mínimo 330 g/d → garantiza 40 kg en 122 días
// SIEMPRE requiere suplementación — pasto solo da <200 g/d en invierno NEA
const GDP_MIN_VAQ2 = 330; // g/d — mínimo invierno, nunca sin suplementar

function calcVaq2(pvEntradaVaq1Sal, pvAdulta, ndvi, disponMS, fenologia) {
  const pvSal1 = parseFloat(pvEntradaVaq1Sal) || 0;
  const pva    = parseFloat(pvAdulta) || 320;
  if (!pvSal1) return { _aviso:"PV se calcula automáticamente desde la salida del 1° invierno." };
  // Vaq2 SIEMPRE necesita suplementación — pasto solo da 120-250 g/d en invierno NEA
  // Sin suplemento llega a destino con déficit de PV irrecuperable antes del entore

  const pvMayo2Inv      = calcPvEntradaVaq2(pvSal1);
  const pvMinEntore     = Math.round(pva * 0.75);
  const diasInv         = 90;  // mayo → agosto (período suplementación invernal)
  const diasHastaEntore = 180; // mayo → noviembre
  const ndviN    = parseFloat(ndvi) || 0.45;
  const nivelMS  = disponMS?.nivel || "media";
  const calidadBaja = ["25_50","mayor_50"].includes(fenologia||"");

  // GDP del pasto en invierno (base sin suplemento)
  const gdpPastoInv = nivelMS === "baja" ? 120 : nivelMS === "media" ? (ndviN > 0.45 ? 200 : 160) : 250;

  // Vaq2 SIEMPRE necesita suplementar — NO existe escenario "sin suplemento" en Vaq2
  // El faltante mínimo es GDP_MIN_VAQ2 independientemente del pasto
  const gdpFaltante   = Math.max(50, GDP_MIN_VAQ2 - gdpPastoInv);
  const pvV2Agosto    = Math.round(pvMayo2Inv + GDP_MIN_VAQ2 * diasInv / 1000);
  const gdpPrimavera  = 450; // g/d post-agosto con pasto disponible
  const pvEntore      = Math.round(pvV2Agosto + gdpPrimavera * (diasHastaEntore - diasInv) / 1000);
  const llegas        = pvEntore >= pvMinEntore;

  // Suplementación necesaria para lograr GDP_MIN_VAQ2
  // Si hay poca cantidad → proteína + energía (no semilla algodón en Vaq1, SÍ en Vaq2)
  let protKg, energKg, fuenteEnerg, freq, freqDetalle, alertaAlgodon;
  if (gdpFaltante > 0) {
    protKg  = Math.round(pvMayo2Inv * 0.005 * 10) / 10; // 0.5% PV como base
    // Semilla de algodón es viable ad libitum en Vaq2 (>280 kg PV)
    const usaSemAlg = pvMayo2Inv >= 280;
    if (usaSemAlg) {
      energKg      = Math.round(pvMayo2Inv * 0.004 * 10) / 10; // hasta consumo voluntario
      fuenteEnerg  = "Semilla de algodón (ad libitum — apta Vaq2° invierno >280 kg)";
      freq         = calidadBaja ? "Diario" : "2–3 veces/semana";
      freqDetalle  = calidadBaja ? "Calidad pasto baja → diario" : "Solo proteína/grasa → 2–3×/semana";
      alertaAlgodon = null; // ad libitum permitido en Vaq2
    } else {
      energKg     = nivelMS === "baja" ? Math.round(pvMayo2Inv * 0.003 * 10) / 10 : 0;
      fuenteEnerg = energKg > 0 ? "Sorgo molido o maíz molido (DIARIO — no intermitente)" : null;
      freq        = energKg > 0 ? "Diario" : "2–3 veces/semana";
      freqDetalle = energKg > 0 ? "Incluye almidón → diario obligatorio" : "Solo proteína → 2–3×/semana";
      alertaAlgodon = `Semilla algodón disponible a partir de ${280}kg PV — este animal tiene ${Math.round(pvMayo2Inv)}kg`;
    }
  } else {
    protKg = 0.3; energKg = 0;
    freq = "2–3 veces/semana"; freqDetalle = "Proteína mínima de mantenimiento";
    fuenteEnerg = null; alertaAlgodon = null;
  }

  const gdpConSupl = GDP_MIN_VAQ2;
  const esc = gdpFaltante > 150 ? "C" : gdpFaltante > 80 ? "B" : "A";

  return {
    esc, pvMayo2Inv, pvV2Agosto, pvEntore, pvMinEntore,
    gdpInv: gdpConSupl, gdpPrimavera, llegas,
    protKg, energKg, fuenteEnerg, freq, freqDetalle, alertaAlgodon,
    nivelMS, gdpPastoInv, gdpFaltante,
    mensajeBase: `Vaq2° requiere mínimo ${GDP_MIN_VAQ2}g/d en invierno — sin suplemento solo logra ${gdpPastoInv}g/d`,
  };
}

// ─── VACAS 2° SERVICIO — MOTOR COMPLETO ─────────────────────────
// Categoría crítica: crecimiento + lactación + gestación simultáneos
// Requerimientos NRC 2000: +10-15% sobre vaca adulta en lactación
// Umbral anestro: entre 1° parto (mayor) y adulta
function calcV2S(pvV2s, pvAdulta, ccActual, conTernero, biotipo, cadena) {
  const pv   = parseFloat(pvV2s)   || 0;
  const pva  = parseFloat(pvAdulta) || 320;
  const ccA  = parseFloat(ccActual) || 0;
  if (!pv || !ccA) return null;

  const bt       = getBiotipo(biotipo);
  // Tasa de movilización/recuperación ligeramente mayor que adulta (aún crecen)
  const tR = Math.max(0.007, 0.013 * bt.recCC * 0.95);
  const tP = 0.008; // pierden CC más rápido que adulta en lactación

  // Umbral anestro: entre 1°parto y adulta
  const umbralAnestro = bt.umbralAnestro + 0.15;

  // Días hasta próximo parto (desde cadena reproductiva principal)
  const diasHastaParto = cadena ? Math.max(0, cadena.diasPartoTemp || 90) : 90;

  // CC al 2° parto
  const ccParto2 = parseFloat(Math.min(8, Math.max(1.5,
    ccA + tR * Math.min(diasHastaParto, 90) - tP * Math.max(0, diasHastaParto - 90)
  )).toFixed(2));

  // Lactación: 2° parto → típicamente destete anticipado o hiperprecoz en V2S
  const mesesLact2 = conTernero ? 3.0 : 1.5; // con ternero al pie = 3 meses prom.
  const tasaCaida  = (ccParto2 >= 5 ? 0.55 : 0.65) * bt.movCC * 1.10; // +10% vs adulta
  const caidaLact2 = Math.min(2.5, mesesLact2 * tasaCaida);
  const ccMin2     = Math.max(1.5, ccParto2 - caidaLact2);

  // Días de anestro (más prolongado que adulta, menos que 1° parto)
  const defCC = Math.max(0, umbralAnestro - ccParto2);
  const defMin = Math.max(0, 2.2 - ccMin2);
  const diasAnestro = Math.round(60 + defCC * 32 + defMin * 28); // base 60d (entre 50d adulta y 70d 1°parto)
  const riesgoAnestro = diasAnestro > 60;

  // CC al servicio — acotar recuperación a días reales disponibles en cadena
  // Si hay poco tiempo entre destete y servicio, la vaca no recupera lo máximo teórico
  const diasRecup2 = cadena ? Math.max(0, Math.round(((cadena.ini ? cadena.ini.getTime() : Date.now()) - Date.now()) / 86400000) - diasHastaParto - Math.round(mesesLact2 * 30)) : 75;
  const diasRecupEfectivo = Math.min(75, Math.max(0, diasRecup2));
  const ccServ2 = parseFloat(Math.min(8, Math.max(1.5,
    ccMin2 + tR * diasRecupEfectivo
  )).toFixed(2));

  // Preñez en 2° servicio
  const prenez2 = interpCC(ccServ2).pr;

  // Requerimiento energético propio (NRC 2000: vaca 2° parto lactando = f*1.10 vs adulta)
  const reqV2s = reqEM(pv, "Vaca 1° parto lactando", biotipo); // usa factor 2.10 — el más alto

  // Déficit estimado con pasto actual
  return {
    ccActual: ccA,
    ccParto:  ccParto2,
    ccMin:    ccMin2,
    ccServ:   ccServ2,
    prenez:   prenez2,
    diasAnestro,
    riesgoAnestro,
    mesesLact: mesesLact2.toFixed(1),
    caidaLact: caidaLact2.toFixed(2),
    reqMcal:  reqV2s,
    conTernero,
    critico: ccParto2 < 4.5 || diasAnestro > 70 || prenez2 < 35,
  };
}

// ─── TABLA SUPERVIVENCIA (Rosello Brajovich et al. 2025 — INTA Colonia Benítez) ──
// Cuadro 2: Probabilidad supervivencia (%) × CC × estado preñez
// CC mapeada a escala 1–9: MuyFlaca≤3, Flaca=4, Regular=5, Buena≥6
const TABLA_SUPERV = {
  // estado: [MuyFlaca, Flaca, Regular, Buena]
  "Vacía":               [45, 50, 79, 99],
  "Preñez chica (cola)": [36, 41, 70, 90],
  "Preñez media (cuerpo)":[23, 28, 57, 77],
  "Preñez grande (cabeza)":[10, 14, 44, 64],
};
function ccACategSuperv(cc) {
  const c = parseFloat(cc) || 0;
  if (c <= 3.0) return 0; // Muy flaca
  if (c <= 4.0) return 1; // Flaca
  if (c <= 5.0) return 2; // Regular
  return 3;               // Buena (≥6 escala INTA, ≥5.5 escala 1–9)
}
function calcSupervivencia(cc, eReprod) {
  // Mapear estado reproductivo al índice de la tabla
  const estadoMap = {
    "Vaca seca sin ternero":           "Vacía",
    "Gestación temprana (1–4 meses)":  "Preñez chica (cola)",
    "Gestación media (5–7 meses)":     "Preñez media (cuerpo)",
    "Preparto (último mes)":           "Preñez grande (cabeza)",
    "Lactación con ternero al pie":    "Preñez media (cuerpo)",
    "Vaca 1° parto lactando":          "Preñez media (cuerpo)",
  };
  const estado = estadoMap[eReprod] || "Preñez media (cuerpo)";
  const fila   = TABLA_SUPERV[estado] || TABLA_SUPERV["Preñez media (cuerpo)"];
  const colIdx = ccACategSuperv(cc);
  const pct    = fila[colIdx];
  const riesgo = pct < 50 ? "critico" : pct < 70 ? "alto" : pct < 85 ? "medio" : "bajo";
  return { pct, estado, riesgo, colIdx };
}

// ─── CADENA REPRODUCTIVA ──────────────────────────────────────────
function calcCadena(iniServ, finServ) {
  if (!iniServ || !finServ) return null;
  const ini = new Date(iniServ + "T12:00:00");
  const fin = new Date(finServ + "T12:00:00");
  if (isNaN(ini) || isNaN(fin) || fin <= ini) return null;

  const diasServ    = Math.round((fin - ini) / (1000*60*60*24));
  const partoTemp   = new Date(ini); partoTemp.setDate(partoTemp.getDate() + 280);
  const partoTard   = new Date(fin); partoTard.setDate(partoTard.getDate() + 280);
  const hoy         = new Date();
  const diasPartoTemp = Math.round((partoTemp - hoy) / (1000*60*60*24));
  const diasPartoTard = Math.round((partoTard - hoy) / (1000*60*60*24));

  const GDP = { trad:0.400, antic:0.350, hiper:0.250 };
  const calcTipo = (refParto, diasLact, gdpPost) => {
    const pvDest  = Math.round(35 + 0.700 * diasLact);
    const desteT  = new Date(refParto); desteT.setDate(desteT.getDate() + diasLact);
    const anoRef  = desteT.getFullYear();
    const mayo1c  = new Date(anoRef, 4, 1);
    const mayo1   = mayo1c > desteT ? mayo1c : new Date(anoRef+1, 4, 1);
    const diasPost = Math.max(0, Math.round((mayo1 - desteT) / (1000*60*60*24)));
    const pvMayo  = Math.round(pvDest + gdpPost * diasPost);
    const mesDeste = desteT.getMonth();
    return { desteT, pvDest, pvMayo, terneroOtono: mesDeste >= 4 && mesDeste <= 5, diasLact };
  };

  const tiposTrad     = calcTipo(partoTemp, 180, GDP.trad);
  const tiposAntic    = calcTipo(partoTemp, 90,  GDP.antic);
  const tiposHiper    = calcTipo(partoTemp, 50,  GDP.hiper);
  const tipoTardTrad  = calcTipo(partoTard, 180, GDP.trad);

  const nacVaq    = new Date(partoTemp); nacVaq.setDate(nacVaq.getDate() + 45);
  const anoNacVaq = nacVaq.getFullYear();
  const mayo1Inv  = new Date(anoNacVaq, 4, 1) > nacVaq
    ? new Date(anoNacVaq, 4, 1)
    : new Date(anoNacVaq+1, 4, 1);
  const edadMayo   = Math.round((mayo1Inv - nacVaq) / (1000*60*60*24*30));
  const pvMayo1Inv = Math.round(35 + 0.700 * (mayo1Inv - nacVaq) / (1000*60*60*24));

  return {
    ini, fin, diasServ, partoTemp, partoTard, diasPartoTemp, diasPartoTard,
    terneroOtono: tiposTrad.terneroOtono,
    desteTemp:    tiposTrad.desteT,
    desteTard:    tipoTardTrad.desteT,
    tipos: {
      trad:  { desteTemp:tiposTrad.desteT,  desteTard:tipoTardTrad.desteT, pvDest:tiposTrad.pvDest,  pvMayo:tiposTrad.pvMayo,  terneroOtono:tiposTrad.terneroOtono,  diasLact:180 },
      antic: { desteTemp:tiposAntic.desteT, desteTard:tipoTardTrad.desteT, pvDest:tiposAntic.pvDest, pvMayo:tiposAntic.pvMayo, terneroOtono:tiposAntic.terneroOtono, diasLact:90  },
      hiper: { desteTemp:tiposHiper.desteT, desteTard:tipoTardTrad.desteT, pvDest:tiposHiper.pvDest, pvMayo:tiposHiper.pvMayo, terneroOtono:tiposHiper.terneroOtono, diasLact:50  },
    },
    nacVaq, mayo1Inv, edadMayo, pvMayo1Inv,
  };
}

// ═══════════════════════════════════════════════════════
// MÓDULO AGUA DE BEBIDA
// López et al. 2021, JAS 99(8):skab215
// Winchester & Morris 1956 / NRC 2000
// ═══════════════════════════════════════════════════════
const AGUA_CATEGORIAS = [
  { min:0,     max:1000,      label:"Excelente",     color:"#7ec850", riesgo:0, desc:"Sin restricción. Sin impacto en consumo ni performance." },
  { min:1000,  max:3000,      label:"Satisfactoria", color:"#a8d870", riesgo:1, desc:"Aceptable para todas las categorías. Impacto mínimo en DMI (<2%)." },
  { min:3000,  max:5000,      label:"Moderada",      color:"#e8a030", riesgo:2, desc:"Puede reducir DMI 2–5% y WI hasta 8%. Monitorear en lactación y gestación tardía." },
  { min:5000,  max:7000,      label:"Alta salinidad",color:"#d46820", riesgo:3, desc:"Reducción DMI 5–12%, WI 10–20%. Evitar en vaquillonas y lactación." },
  { min:7000,  max:10000,     label:"Problemática",  color:"#e05530", riesgo:4, desc:"Reducción severa DMI >12%. Contraindicada en categorías productivas." },
  { min:10000, max:Infinity,  label:"No apta",       color:"#c02010", riesgo:5, desc:"No usar en bovinos. Riesgo de intoxicación salina, diarrea, muerte." },
];
const TIPOS_SAL = {
  "NaCl dominante":    { factor:1.00, nota:"Efecto cuadrático. Tolerancia relativamente mayor." },
  "SO4 dominante":     { factor:1.35, nota:"⚠️ ATENCIÓN: Efecto lineal y más severo. Sulfatos reducen más DMI y WI que cloruros a igual TDS (López et al. 2021)." },
  "Mixta/Desconocida": { factor:1.15, nota:"Asumir efecto intermedio. Analizar muestra para caracterizar." },
};

function calcConsumoAgua(pvVaca, tempC, lactando) {
  // Winchester & Morris 1956 / NRC 2000 / Beede 1992
  // Base: ~0.066 L/kg PV/día a 25°C; ajuste exponencial por temperatura
  // Ajuste por categoría: lactando +50–60%, gestación tardía +20%
  const pv   = parseFloat(pvVaca) || 320;
  const t    = parseFloat(tempC)  || 25;
  // Consumo base a temperatura dada: aumenta marcadamente >25°C
  // Exponente 1.3 para reflejar mejor demanda en NEA/Chaco (38-42°C verano)
  const base = pv * 0.066 * Math.pow(Math.max(10, t) / 20, 1.3);
  const mult = lactando ? 1.60 : 1.0; // lactación eleva consumo 55–65% (NRC 2000/Beede 1992)
  // Mínimo 65L en período crítico de verano (NEA/Chaco >30°C)
  const resultado = Math.round(base * mult);
  return t >= 30 ? Math.max(65, resultado) : resultado;
}

function evaluarAgua(tds, tipoSal, pvVaca, tempC, lactando, enso) {
  if (!tds || tds <= 0) return null;
  const tdsN = parseFloat(tds);
  const cat  = AGUA_CATEGORIAS.find(c => tdsN >= c.min && tdsN < c.max) || AGUA_CATEGORIAS[AGUA_CATEGORIAS.length-1];
  const ts   = TIPOS_SAL[tipoSal] || TIPOS_SAL["Mixta/Desconocida"];
  const tdsEfectivo = tdsN * ts.factor;
  const catEfect    = AGUA_CATEGORIAS.find(c => tdsEfectivo >= c.min && tdsEfectivo < c.max) || AGUA_CATEGORIAS[AGUA_CATEGORIAS.length-1];

  // Reducción DMI (consumo de MS total: pasto + suplemento) y consumo de agua
  // López et al. 2021, JAS 99(8):skab215; Beede 1992
  let pctReducDMI = 0, pctReducWI = 0;
  if (tdsN > 3000) {
    pctReducDMI = Math.min(30, ((tdsN-3000)/1000) * 2.5 * ts.factor);
    pctReducWI  = Math.min(40, ((tdsN-3000)/1000) * 3.5 * ts.factor);
  }
  // La reducción de DMI se refleja directamente en consumo de pasto:
  // cuando el animal toma menos agua, reduce ingesta voluntaria de MS
  const pctReducPasto = pctReducDMI; // equivalente — 1:1 (López et al. 2021)
  const consumoEsperado = calcConsumoAgua(pvVaca, tempC, lactando);
  const alertaEnso = enso === "nina"
    ? "⚠️ La Niña: mayor concentración de sales esperada en aguadas superficiales. Revisar TDS periódicamente."
    : null;

  const warnings = [];
  if (cat.riesgo >= 3) {
    warnings.push({ nivel:"rojo",  msg:`TDS ${tdsN} mg/L (${cat.label}): ↓DMI −${pctReducDMI.toFixed(0)}% · ↓Pasto consumido −${pctReducPasto.toFixed(0)}% · ↓Agua −${pctReducWI.toFixed(0)}%. (López et al. 2021)` });
  } else if (cat.riesgo === 2) {
    warnings.push({ nivel:"ambar", msg:`TDS ${tdsN} mg/L (${cat.label}): reducción DMI y pasto consumido ≤5%. Monitorear en lactación y preparto.` });
  } else {
    warnings.push({ nivel:"verde", msg:`TDS ${tdsN} mg/L (${cat.label}): calidad adecuada para todas las categorías.` });
  }
  if (ts.factor > 1.1)  warnings.push({ nivel:"ambar", msg:ts.nota });
  if (alertaEnso)        warnings.push({ nivel:"ambar", msg:alertaEnso });
  if (parseFloat(tempC) > 32) {
    warnings.push({ nivel:"ambar", msg:`Temperatura ${tempC}°C: consumo estimado ${consumoEsperado}L/vaca/día. Asegurar caudal y acceso (mín. 5 cm lineal/vaca).` });
  }
  return { cat, catEfect, tdsN, tdsEfectivo, pctReducDMI, pctReducWI, pctReducPasto, consumoEsperado, warnings, tipoSal, ts };
}

// ═══════════════════════════════════════════════════════
// MÓDULO SANIDAD
// ═══════════════════════════════════════════════════════
const ENFERMEDADES_REPROD = [
  { nombre:"Aftosa (FMD)",                     impacto:"Caída producción láctea, cojeras, anorexia, reducción condición corporal. Erradicación obligatoria (SENASA). Puede causar abortos por fiebre.",           alerta:"alta"  },
  { nombre:"Brucelosis",                        impacto:"Aborto masivo al 7° mes. Zoonosis. Control oficial obligatorio — vacunación obligatoria en terneras 3–8 meses (Argentina).",                             alerta:"alta"  },
  { nombre:"IBR/DVB",                           impacto:"Abortos 5–30%, anovulación, repetición de celos. Reducción preñez hasta −15 pp. Vacunación recomendada pre-servicio.",                                   alerta:"alta"  },
  { nombre:"Leptospirosis",                     impacto:"Abortos tardíos, mortalidad neonatal, agalaxia. Frecuente en inundaciones NEA/Pantanal. Zoonosis.",                                                       alerta:"alta"  },
  { nombre:"Tricomoniasis/Campylobacteriosis",  impacto:"Repetición de celos, abortos tempranos, infertilidad persistente. El toro es el vector principal — ESAN obligatorio.",                                    alerta:"media" },
  { nombre:"Neospora caninum",                  impacto:"Abortos 5–20%, mortalidad neonatal. Perros como huéspedes definitivos. Sin vacuna disponible — control canino.",                                           alerta:"media" },
];

function evaluarSanidad(vacunas, brucelosis, aftosa, toros, historiaAbortos, programaSanit) {
  const alerts = [];
  if (!vacunas || vacunas === "no")
    alerts.push({ nivel:"rojo",  msg:"⚠️ Sin vacunación IBR/DVB: riesgo de reducción de preñez hasta −15 pp. Consultar médico veterinario." });
  if (brucelosis === "no")
    alerts.push({ nivel:"rojo",  msg:"⚠️ Sin vacunación Brucelosis: obligatoria en terneras 3–8 meses (SENASA RES.114/21). Riesgo de aborto masivo al 7° mes. Zoonosis." });
  if (aftosa === "no")
    alerts.push({ nivel:"rojo",  msg:"⚠️ Sin vacunación Aftosa: obligatoria en Argentina — Plan Nacional SENASA. Dos dosis anuales mínimo. Riesgo de brote y restricción de mercado." });
  if (toros === "sin_control")
    alerts.push({ nivel:"rojo",  msg:"Toros sin evaluación ESAN: tricomoniasis/campylobacteriosis no detectadas. El toro en CC 4.0 es tan crítico como la vaca en CC 3.5." });
  if (historiaAbortos === "si")
    alerts.push({ nivel:"ambar", msg:"Historia de abortos: diagnóstico diferencial IBR/DVB/Leptospira/Neospora/Brucelosis prioritario antes del próximo servicio." });
  if (programaSanit === "no" || !programaSanit)
    alerts.push({ nivel:"ambar", msg:"Sin programa sanitario estructurado. La sanidad es el techo del sistema." });
  return { alerts };
}

// ═══════════════════════════════════════════════════════
// HELPERS + GEOGRAFÍA
// ═══════════════════════════════════════════════════════
const ccPond = (dist) => {
  let s = 0, t = 0;
  (dist || []).forEach(d => { const p = parseFloat(d.pct)||0, c = parseFloat(d.cc)||0; s += p*c; t += p; });
  return t > 0 ? s / t : 0;
};
const fmtFecha = (d) => {
  if (!d || isNaN(new Date(d))) return "—";
  return new Date(d).toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit", year:"2-digit" });
};
const semaforo = (v, bajo, alto) => v >= alto ? "#7ec850" : v >= bajo ? "#d4952a" : "#c04820";
const smf      = (v, bajo, alto) => v >= alto ? "#7ec850" : v >= bajo ? "#e8a030" : "#e05530";

function validarManual(lat, lon) {
  if (isNaN(lat) || isNaN(lon))  return "Coordenadas inválidas — ingresá números.";
  if (lat < -60 || lat > 15)     return "Latitud fuera del rango de Sudamérica (-60 a +15).";
  if (lon < -85 || lon > -30)    return "Longitud fuera del rango de Sudamérica (-85 a -30).";
  return null;
}

// NDVI base por zona
const ndviBase = {
  "NEA":0.55,"Pampa Húmeda":0.50,"NOA":0.42,"Cuyo":0.30,
  "Patagonia":0.28,"Patagonia Sur":0.25,"Neuquén / Río Negro":0.30,
  "Paraguay Oriental":0.58,"Chaco Paraguayo":0.48,
  "Mato Grosso / Goiás (BR)":0.55,"Mato Grosso do Sul (BR)":0.56,
  "Rio Grande do Sul (BR)":0.52,"Pantanal (BR)":0.50,
  "Santa Cruz / Beni (BO)":0.50,"Tarija / Chaco (BO)":0.44,
};

async function fetchSat(lat, lon, zona, prov, enso, cb) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration&past_days=30&forecast_days=1&timezone=auto`;
    const d   = await (await fetch(url)).json();
    if (!d?.daily?.precipitation_sum) throw new Error("Sin datos");

    const prec = d.daily.precipitation_sum || [];
    const tMax = d.daily.temperature_2m_max || [];
    const tMin = d.daily.temperature_2m_min || [];
    const et0  = d.daily.et0_fao_evapotranspiration || [];

    const p7   = Math.round(prec.slice(-7).reduce((a,b)=>a+(b||0),0));
    const p30  = Math.round(prec.reduce((a,b)=>a+(b||0),0));
    const et07 = Math.round(et0.slice(-7).reduce((a,b)=>a+(b||0),0));
    const temp = parseFloat((
      (tMax.slice(-7).reduce((a,b)=>a+(b||0),0) + tMin.slice(-7).reduce((a,b)=>a+(b||0),0))
      / (Math.max(1, tMax.slice(-7).length) * 2)
    ).toFixed(1));

    const m       = modENSO(enso);
    const nb      = ndviBase[zona] || 0.48;
    const ndviAdj = Math.min(0.95, Math.max(0.15, nb * (0.6 + p30/300) * m)).toFixed(2);
    const cond    = ndviAdj > 0.60 ? "Excelente" : ndviAdj > 0.45 ? "Buena" : ndviAdj > 0.30 ? "Regular" : "Crítica";

    cb({ temp, tMax:Math.round(Math.max(...tMax.slice(-7))), tMin:Math.round(Math.min(...tMin.slice(-7))),
         p7, p30, deficit:Math.round(p30 - et07*4.3), ndvi:ndviAdj, condForr:cond, et07 });
  } catch (e) {
    cb({ error:"No se pudieron obtener datos satelitales: " + e.message });
  }
}

const HELADAS_PROV = {
  "Formosa":{dia:15,mes:5},"Chaco":{dia:1,mes:5},"Corrientes":{dia:1,mes:5},
  "Misiones":{dia:20,mes:4},"Entre Ríos":{dia:10,mes:4},"Santa Fe":{dia:10,mes:4},
  "Santiago del Estero":{dia:25,mes:4},"Salta":{dia:15,mes:5},
  "Buenos Aires":{dia:15,mes:4},"Córdoba":{dia:10,mes:4},"La Pampa":{dia:20,mes:3},
  "Mendoza":{dia:1,mes:4},"Neuquén / Río Negro":{dia:1,mes:3},"Patagonia Sur":{dia:1,mes:2},
  "Paraguay Oriental":{dia:15,mes:5},"Chaco Paraguayo":{dia:10,mes:5},
  "Santa Cruz / Beni (BO)":{dia:1,mes:5},"Tarija / Chaco (BO)":{dia:20,mes:4},
  "Mato Grosso do Sul (BR)":{dia:15,mes:5},"Mato Grosso / Goiás (BR)":{dia:10,mes:5},
  "Rio Grande do Sul (BR)":{dia:1,mes:4},"Pantanal (BR)":{dia:20,mes:5},
};

const CLIMA_HIST = {
  "Corrientes":          [{t:28,p:130},{t:27,p:120},{t:25,p:110},{t:20,p:90},{t:16,p:70},{t:13,p:60},{t:13,p:55},{t:15,p:50},{t:18,p:80},{t:22,p:110},{t:25,p:120},{t:27,p:130}],
  "Chaco":               [{t:29,p:120},{t:28,p:110},{t:26,p:110},{t:21,p:80},{t:16,p:60},{t:13,p:50},{t:13,p:45},{t:15,p:45},{t:19,p:70},{t:23,p:100},{t:26,p:110},{t:28,p:120}],
  "Formosa":             [{t:30,p:120},{t:29,p:110},{t:27,p:110},{t:22,p:80},{t:17,p:55},{t:14,p:45},{t:14,p:40},{t:16,p:45},{t:20,p:70},{t:24,p:100},{t:27,p:110},{t:29,p:120}],
  "Entre Ríos":          [{t:25,p:100},{t:24,p:90},{t:22,p:90},{t:17,p:70},{t:13,p:55},{t:10,p:45},{t:10,p:40},{t:12,p:45},{t:15,p:65},{t:19,p:90},{t:22,p:100},{t:24,p:100}],
  "Santiago del Estero": [{t:28,p:90},{t:27,p:80},{t:25,p:80},{t:20,p:50},{t:15,p:30},{t:12,p:20},{t:12,p:15},{t:14,p:20},{t:18,p:40},{t:22,p:70},{t:25,p:80},{t:27,p:90}],
  "Salta":               [{t:24,p:140},{t:23,p:130},{t:22,p:110},{t:17,p:50},{t:13,p:20},{t:10,p:10},{t:10,p:10},{t:12,p:15},{t:16,p:30},{t:20,p:70},{t:22,p:110},{t:23,p:130}],
  "Buenos Aires":        [{t:24,p:90},{t:23,p:80},{t:21,p:90},{t:16,p:70},{t:12,p:55},{t:9,p:45},{t:9,p:40},{t:11,p:50},{t:13,p:65},{t:17,p:85},{t:20,p:90},{t:23,p:90}],
  "Córdoba":             [{t:25,p:100},{t:24,p:90},{t:22,p:90},{t:17,p:60},{t:13,p:35},{t:10,p:25},{t:10,p:20},{t:12,p:25},{t:15,p:45},{t:19,p:75},{t:22,p:90},{t:24,p:100}],
  "Santa Fe":            [{t:26,p:110},{t:25,p:100},{t:23,p:100},{t:18,p:70},{t:14,p:50},{t:11,p:40},{t:11,p:35},{t:13,p:40},{t:16,p:60},{t:20,p:90},{t:23,p:100},{t:25,p:110}],
  "La Pampa":            [{t:24,p:80},{t:23,p:70},{t:21,p:75},{t:15,p:55},{t:11,p:38},{t:8,p:28},{t:8,p:25},{t:10,p:30},{t:13,p:48},{t:17,p:72},{t:20,p:78},{t:22,p:80}],
  "Paraguay Oriental":   [{t:29,p:140},{t:29,p:130},{t:27,p:130},{t:22,p:100},{t:17,p:75},{t:14,p:60},{t:14,p:55},{t:16,p:55},{t:19,p:80},{t:23,p:110},{t:26,p:130},{t:28,p:140}],
  "Chaco Paraguayo":     [{t:31,p:110},{t:30,p:100},{t:28,p:100},{t:23,p:70},{t:18,p:45},{t:15,p:35},{t:15,p:30},{t:17,p:35},{t:21,p:60},{t:25,p:90},{t:28,p:100},{t:30,p:110}],
  "Mato Grosso do Sul (BR)":   [{t:27,p:180},{t:27,p:160},{t:26,p:120},{t:23,p:80},{t:19,p:50},{t:17,p:30},{t:17,p:25},{t:19,p:35},{t:22,p:70},{t:25,p:120},{t:26,p:150},{t:27,p:170}],
  "Mato Grosso / Goiás (BR)":  [{t:26,p:220},{t:26,p:200},{t:25,p:160},{t:24,p:90},{t:22,p:35},{t:20,p:10},{t:20,p:8},{t:22,p:15},{t:24,p:60},{t:26,p:120},{t:26,p:180},{t:26,p:210}],
  "Pantanal (BR)":             [{t:28,p:200},{t:28,p:180},{t:27,p:140},{t:25,p:80},{t:22,p:30},{t:20,p:10},{t:20,p:8},{t:21,p:20},{t:24,p:60},{t:26,p:110},{t:27,p:160},{t:28,p:190}],
};
const CLIMA_DEF = [{t:27,p:120},{t:26,p:110},{t:24,p:100},{t:20,p:80},{t:15,p:60},{t:12,p:50},{t:12,p:45},{t:14,p:50},{t:18,p:70},{t:22,p:95},{t:25,p:110},{t:26,p:120}];
const getClima  = (prov) => CLIMA_HIST[prov] || CLIMA_DEF;

const MESES   = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_C = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function diasHelada(prov, ndvi, tempActual) {
  const h = HELADAS_PROV[prov]; if (!h) return 999;
  const n = parseFloat(ndvi) || 0.45;
  const aj = n > 0.55 ? 7 : n < 0.35 ? -7 : 0;
  const hoy = new Date();
  let fd = new Date(hoy.getFullYear(), h.mes, h.dia + aj);
  if (fd < hoy) {
    if (tempActual !== undefined && parseFloat(tempActual) < 15) return 0;
    fd = new Date(hoy.getFullYear()+1, h.mes, h.dia + aj);
  }
  return Math.round((fd - hoy) / (1000*60*60*24));
}

function calcDisp(prov, ndvi, temp) {
  const dH = diasHelada(prov, ndvi, temp);
  const tN = parseFloat(temp) || 20;
  if (dH === 0 || tN < 15) return { tipo:"Invierno activo — C4 restringido", dias:0 };
  const mc   = new Date().getMonth();
  const hist = getClima(prov);
  let dT = 999;
  for (let i = 1; i <= 6; i++) { if (hist[(mc+i)%12].t < 15) { dT = i*30; break; } }
  return { tipo:"Disparador C4", dias:Math.min(dH, dT) };
}

function dZona(lat, lon) {
  if (lat>-28&&lat<=-25&&lon>-56&&lon<=-53) return "NEA";
  if (lat>-27&&lat<=-20&&lon>-58&&lon<=-54) return "Paraguay Oriental";
  if (lat>-25&&lat<=-20&&lon>-63&&lon<=-58) return "Chaco Paraguayo";
  if (lat>-25&&lat<=-10&&lon>-54&&lon<=-44) return "Brasil (Cerrado)";
  if (lat>-32) return "NEA";
  if (lat>-38&&lat<=-32&&lon>-62) return "Pampa Húmeda";
  return "NEA";
}

function dProv(lat, lon) {
  if (lat>-27&&lat<=-20&&lon>-58&&lon<=-54) return "Paraguay Oriental";
  if (lat>-25&&lat<=-20&&lon>-63&&lon<=-58) return "Chaco Paraguayo";
  if (lat>-24&&lat<=-15&&lon>-58&&lon<=-54) return "Mato Grosso do Sul (BR)";
  if (lat>-22&&lat<=-15&&lon>-65&&lon<=-63) return "Santa Cruz / Beni (BO)";
  if (lat>-23&&lat<=-20&&lon>-66&&lon<=-63) return "Tarija / Chaco (BO)";
  if (lat>-23&&lon<=-62) return "Salta";
  if (lat>-23&&lon>-62)  return "Formosa";
  if (lat>-32&&lat<=-26&&lon>-59&&lon<=-53) return "Corrientes";
  if (lat>-29&&lat<=-22&&lon>-66&&lon<=-58) return "Chaco";
  if (lat>-34&&lat<=-30&&lon>-60.5&&lon<=-57) return "Entre Ríos";
  if (lat>-34&&lat<=-28&&lon>-64&&lon<=-59)   return "Santa Fe";
  if (lat>-36&&lat<=-29&&lon>-66&&lon<=-62)   return "Córdoba";
  if (lat>-40&&lat<=-34&&lon>-63&&lon<=-56)   return "Buenos Aires";
  if (lat>-40&&lat<=-34&&lon>-68&&lon<=-63)   return "La Pampa";
  return "Chaco";
}

const DISCLAIMER = "Las recomendaciones generadas por AgroMind Pro tienen carácter orientativo. No reemplazan el criterio profesional del ingeniero agrónomo o médico veterinario que asiste al establecimiento, quien deberá validar, ajustar e implementar cualquier decisión de manejo según las condiciones particulares de cada sistema productivo.";
// ═══════════════════════════════════════════════════════════════════
// AGROMIND PRO v16 — PARTE 2: COMPONENTES UI
// ═══════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════
// MOTOR DE INFERENCIA v16 — SISTEMA DE PROPAGACIÓN CAUSAL
// ═══════════════════════════════════════════════════════════════════
// Diseño: cada nodo del grafo produce {valor, fuente, confianza, alertas[]}
// El motor propaga cambios en cascada: una entrada modifica N salidas
// Todas las variables del sistema son derivadas de este único cálculo
// ═══════════════════════════════════════════════════════════════════

// ─── NODOS DEL GRAFO ──────────────────────────────────────────────
// Nivel 0 (inputs crudos): form, sat, coords
// Nivel 1 (derivados directos): cadena, disponMS, ccPondVal, ndviN, cargaEV
// Nivel 2 (calculados): tray, dist, vaq1E, vaq2E, tcSave, evalAgua
// Nivel 3 (agregados): balanceMensual, demandaStock, alertasMotor
// Nivel 4 (salidas): recomendaciones, prompt, UI state

function correrMotor(form, sat, potreros, usaPotreros) {
  const alertas = [];   // alertas generadas por el motor
  const trazas  = {};   // trazabilidad: qué afecta a qué

  const addAlerta = (id, tipo, msg, impacto, fuente) => {
    alertas.push({ id, tipo, msg, impacto, fuente, ts: Date.now() });
  };

  // ════════════════════════════════════════════════════════════════
  // NIVEL 1 — VARIABLES PRIMARIAS
  // ════════════════════════════════════════════════════════════════

  // ── 1.1 Cadena reproductiva ──────────────────────────────────
  const cadena = calcCadena(form.iniServ, form.finServ);

  // ── 1.2 NDVI y clima efectivo ───────────────────────────────
  const ndviN   = parseFloat(sat?.ndvi || 0.45);
  const tempHoy = parseFloat(sat?.temp || 22);
  const p30     = parseFloat(sat?.p30  || 80);
  const enso    = form.enso || "neutro";

  // Impacto del agua salobre en disponibilidad real de pasto
  const evalAgua = form.aguaTDS
    ? evaluarAgua(form.aguaTDS, form.aguaTipoSal, form.pvVacaAdulta, tempHoy,
        form.eReprod === "Lactación con ternero al pie", enso)
    : null;
  const factorAgua = evalAgua ? Math.max(0.5, 1 - evalAgua.pctReducDMI / 100) : 1.0;

  if (evalAgua && evalAgua.pctReducDMI > 15) {
    addAlerta("agua_dmi", "P1",
      `Agua salobre (TDS ${evalAgua.tdsN} mg/L) reduce consumo de pasto −${evalAgua.pctReducDMI.toFixed(0)}%`,
      `Equivale a eliminar ${(evalAgua.pctReducDMI/100 * 2.8 * (parseFloat(form.pvVacaAdulta)||320) * 0.024).toFixed(1)} kg MS/vaca/día`,
      "evaluarAgua()");
  }

  // ── 1.3 Disponibilidad forrajera + efecto agua ───────────────
  // Si hay potreros cargados, usar promedio ponderado por ha
  let disponMSBase;
  if (usaPotreros && potreros && potreros.length > 0) {
    const potrerosConDatos = potreros.filter(p => parseFloat(p.ha) > 0);
    const haTotal = potrerosConDatos.reduce((s,p) => s+(parseFloat(p.ha)||0), 0);
    if (haTotal > 0 && potrerosConDatos.some(p => p.altPasto)) {
      // Promedio ponderado de disponibilidad
      let msHaPond = 0;
      potrerosConDatos.forEach(p => {
        const ha = parseFloat(p.ha)||0;
        const d = calcDisponibilidadMS(p.altPasto||"20", p.tipoPasto||"corto_denso");
        msHaPond += d.msHa * (ha / haTotal);
      });
      const nivel = msHaPond >= 2000 ? "alta" : msHaPond >= 1000 ? "media" : "baja";
      disponMSBase = { msHa: Math.round(msHaPond), nivel, rango:[Math.round(msHaPond*0.8), Math.round(msHaPond*1.2)] };
    } else {
      // Usar la vegetación del primer potrero como base
      disponMSBase = calcDisponibilidadMS(form.altPasto||"20", form.tipoPasto||"corto_denso");
    }
  } else {
    disponMSBase = calcDisponibilidadMS(form.altPasto, form.tipoPasto);
  }
  // La calidad del agua REDUCE la disponibilidad efectiva (menos consumo)
  const disponMS = {
    ...disponMSBase,
    msHaEfectivo: Math.round(disponMSBase.msHa * factorAgua),
    factorAgua,
    nivelEfectivo: disponMSBase.msHa * factorAgua >= 2000 ? "alta"
                 : disponMSBase.msHa * factorAgua >= 1000 ? "media" : "baja",
  };

  // ── 1.4 Oferta mensual con variación estacional ──────────────
  const ofertaMensual = calcOfertaMensualArray(
    form.vegetacion || "Pastizal natural NEA/Chaco",
    ndviN, form.provincia || "Corrientes", enso, form.fenologia
  ).map(v => +(v * factorAgua).toFixed(2)); // agua reduce oferta real

  // ── 1.5 Carga ganadera real en EV/ha ─────────────────────────
  const nVacas  = parseInt(form.vacasN)  || 0;
  const nToros  = parseInt(form.torosN)  || 0;
  const nV2s    = parseInt(form.v2sN)    || 0;
  const nVaq2   = parseInt(form.vaq2N)   || 0;
  const nVaq1   = Math.round(nVacas * (parseFloat(form.pctReposicion)||20) / 100);
  const supHa   = parseFloat(form.supHa) || 0;
  const EV_FACT = { vacas:1.0, toros:1.4, v2s:1.1, vaq2:0.7, vaq1:0.4 };
  const totalEV = nVacas*EV_FACT.vacas + nToros*EV_FACT.toros + nV2s*EV_FACT.v2s
                + nVaq2*EV_FACT.vaq2   + nVaq1*EV_FACT.vaq1;
  const cargaEV_ha = supHa > 0 ? +(totalEV / supHa).toFixed(2) : null;

  // Efecto de la carga sobre la oferta: sobrecarga degrada el pasto
  const factorCarga = cargaEV_ha === null ? 1.0
    : cargaEV_ha > 1.2 ? 0.70   // sobrecarga severa
    : cargaEV_ha > 0.8 ? 0.88   // sobrecarga moderada
    : cargaEV_ha > 0.5 ? 0.97   // carga óptima alta
    : 1.0;                        // subganadera o sin dato

  if (cargaEV_ha && cargaEV_ha > 1.2) {
    addAlerta("carga_alta", "P1",
      `Carga ${cargaEV_ha} EV/ha — sobrecarga severa · oferta real reducida −30%`,
      `Cada EV extra sobre 0.8 EV/ha deteriora la pastura y reduce el período de recuperación`,
      "cargaEV");
  } else if (cargaEV_ha && cargaEV_ha > 0.8) {
    addAlerta("carga_mod", "P2",
      `Carga ${cargaEV_ha} EV/ha — moderada · considerar ajuste antes de invierno`,
      `Reducir vientres falladas o ajustar categorías antes de junio`,
      "cargaEV");
  }

  const ofertaAjustada = ofertaMensual.map(v => +(v * factorCarga).toFixed(2));

  // ── 1.6 Verdeo como módulo de oferta extra ────────────────────
  let verdeoAporteMcalMes = 0; // Mcal/día adicionales del verdeo
  let verdeoMesInicio = 7; // agosto por defecto
  if (form.tieneVerdeo === "si" && form.verdeoHa) {
    const haV      = parseFloat(form.verdeoHa) || 0;
    const msHaV    = 2800; // kg MS/ha avena/raigrás
    const mcalKgV  = 2.0;
    const utilV    = 0.45;
    const map      = { junio:5, julio:6, agosto:7, septiembre:8 };
    verdeoMesInicio = map[form.verdeoDisp||"agosto"] || 7;
    // Mcal/día en los 3 meses de disponibilidad (90 días)
    verdeoAporteMcalMes = +(haV * msHaV * mcalKgV * utilV / 90).toFixed(0);
    trazas.verdeo = { ha:haV, msHa:msHaV, aporteMcalDia:verdeoAporteMcalMes, desde:verdeoMesInicio };
  }

  // ════════════════════════════════════════════════════════════════
  // NIVEL 2 — CÁLCULOS POR CATEGORÍA (propagados)
  // ════════════════════════════════════════════════════════════════

  // ── 2.1 Terneros ─────────────────────────────────────────────
  const tcSave = calcTerneros(
    form.vacasN, form.prenez, form.pctDestete,
    form.destTrad, form.destAntic, form.destHiper, cadena
  );

  // ── 2.2 Vaquillona 1° invierno ───────────────────────────────
  // PV de entrada: prioridad al PV de ternero calculado; luego manual
  const pvEntVaq1 = tcSave?.pvMayoPond || parseFloat(form.vaq1PV) || 0;
  const vaq1E = calcVaq1(pvEntVaq1, form.pvVacaAdulta, ndviN,
    form.edadVaqMayo, form.tipoDesteteVaq, disponMS, form.fenologia);

  // Vaq1 con verdeo: mejora GDP dramatically
  if (form.tieneVerdeo === "si" && form.verdeoHa && form.verdeoDestinoVaq === "si") {
    const boost = Math.min(600, verdeoAporteMcalMes / (nVaq1 || 1) * 80); // ~80 g GDP por Mcal extra
    if (vaq1E && vaq1E.gdpReal) {
      vaq1E._gdpConVerdeo = Math.round(vaq1E.gdpReal + boost);
      vaq1E._pvSalConVerdeo = Math.round(pvEntVaq1 + vaq1E._gdpConVerdeo * 0.090);
    }
  }

  // ── 2.3 Vaquillona 2° invierno ───────────────────────────────
  // PV entrada vaq2: sale del PV agosto de vaq1 → primavera → entrada vaq2
  const pvSalidaVaq1 = vaq1E?.pvSal ? String(vaq1E.pvSal) : "";
  const pvEntradaVaq2 = form.vaq2PV || pvSalidaVaq1 || "";
  const vaq2E = calcVaq2(pvEntradaVaq2, form.pvVacaAdulta, ndviN, disponMS, form.fenologia);

  if (vaq2E && !vaq2E.llegas) {
    addAlerta("vaq2_objetivo", "P1",
      `Vaq2° NO llega al objetivo: PV entore proyectado ${vaq2E.pvEntore}kg vs mínimo ${vaq2E.pvMinEntore}kg (75% PV adulto)`,
      `Si entra al servicio con <75% PV adulto: reducción fertilidad, mayor anestro, riesgo de no gestación`,
      "calcVaq2()");
  }

  // ── 2.4 Trayectoria CC (vacas adultas) ───────────────────────
  // baseParams para calcTrayectoriaCC — el suplemento preparto (sin ternero)
  // es el único momento eficiente para suplementar vacas (Selk 1988)
  // Se modela como apoyo a CC al parto en los meses previos al parto
  const suplPrepartoProt = form.supl_v2s || ""; // usar protocolo V2S como proxy preparto
  const dosisPreparto    = form.dosis_v2s || "0";
  const baseParams  = {
    dist: form.distribucionCC,
    cadena,
    destTrad: form.destTrad, destAntic: form.destAntic, destHiper: form.destHiper,
    supHa: form.supHa, vacasN: form.vacasN,
    biotipo: form.biotipo, primerParto: form.primerParto,
    provincia: form.provincia,
    ndvi: ndviN,
    supl1: suplPrepartoProt, dosis1: dosisPreparto,
    supl2: "", dosis2: "0",
    supl3: "", dosis3: "0",
  };
  const tray = calcTrayectoriaCC(baseParams);
  const dist = calcDistCC({ ...baseParams, ndvi: ndviN, prov: form.provincia });
  const ccPondVal = ccPond(form.distribucionCC);

  // ── 2.5 Propagación: destete óptimo → CC al servicio ────────
  // Si la CC proyectada al servicio < 4.5 Y no hay destete precoz → alerta propagada
  if (tray && parseFloat(tray.ccServ) < 4.5) {
    const ccDeficit = (4.5 - parseFloat(tray.ccServ)).toFixed(2);
    const pctHiper = (parseFloat(form.destHiper)||0);
    const pctAntic = (parseFloat(form.destAntic)||0);
    if (pctHiper < 30 && pctAntic < 40) {
      addAlerta("cc_serv_bajo", "P1",
        `CC al servicio proyectada ${tray.ccServ} — déficit −${ccDeficit} vs mínimo 4.5. Destete precoz insuficiente (Hiperprecoz ${pctHiper}% · Anticipado ${pctAntic}%)`,
        `Con CC ${tray.ccServ} al servicio: preñez estimada ${tray.pr}% vs ${Math.round(tray.pr + parseFloat(ccDeficit)*15)}% con corrección`,
        "calcTrayectoriaCC() → interpCC()");
    }
  }

  // ── 2.6 Balance energético mensual DETALLADO ─────────────────
  // Estado fisiológico real por fecha de cadena reproductiva
  const pvVaca  = parseFloat(form.pvVacaAdulta) || 320;
  const bt      = getBiotipo(form.biotipo);
  const MCAL_CC = 56; // Mcal/punto CC

  // Fechas clave de la cadena
  const mesParto   = cadena?.partoTemp  ? cadena.partoTemp.getMonth()  : 9;  // default oct
  const mesServIni = cadena?.ini        ? cadena.ini.getMonth()        : 11; // default dic
  const mesServFin = cadena?.fin        ? cadena.fin.getMonth()        : 2;
  const mesesLactN = parseFloat(tray?.mesesLact  || 3);
  const caidaCC    = parseFloat(tray?.caidaLact   || 1.2);
  const mesDestete = (mesParto + Math.round(mesesLactN)) % 12;

  // Suplemento por categoría — Mcal/día × nAnimales
  // VACAS: NO se incluyen en el cálculo de suplemento del balance general
  // Su herramienta es el manejo del ternero (destete), no el suplemento
  // El único suplemento eficiente en vacas es PREPARTO (sin ternero al pie)
  // y ese se modela en calcTrayectoriaCC como ajuste de CC al parto
  const suplCats = [
    { sk:"supl_v2s",    dk:"dosis_v2s",    n:nV2s   }, // triple estrés: sí suplemento
    { sk:"supl_toros",  dk:"dosis_toros",  n:nToros }, // preparo servicio: sí suplemento
    { sk:"supl_vaq2",   dk:"dosis_vaq2",   n:nVaq2  }, // recría: sí suplemento
    { sk:"supl_vaq1",   dk:"dosis_vaq1",   n:nVaq1  }, // 1° invierno: sí suplemento, respuesta máxima
  ];
  // Duración campaña de suplementación: 90d=3 meses, 120d=4 meses, 150d=5 meses
  // Esto define en qué meses del año aplica el suplemento en el balance mensual
  const diasSuplInv    = parseInt(form.diasSuplInv) || 90;
  const mesesSuplInv   = Math.round(diasSuplInv / 30); // 3, 4 o 5
  // Meses donde aplica: siempre centrado en jun-ago (5,6,7)
  // 3 meses: [5,6,7]; 4 meses: [4,5,6,7]; 5 meses: [4,5,6,7,8]
  const suplMesInicio  = mesesSuplInv >= 5 ? 4 : mesesSuplInv >= 4 ? 4 : 5;
  const suplMesFin     = mesesSuplInv >= 5 ? 8 : mesesSuplInv >= 4 ? 7 : 7;
  // Conjunto de meses donde aplica el suplemento
  const MESES_SUPL = new Set(Array.from({length: suplMesFin - suplMesInicio + 1}, (_, k) => suplMesInicio + k));

  const suplRodeoMcalDia = suplCats.reduce((acc,c) => {
    const s = SUPLEMENTOS[form[c.sk]];
    const d = parseFloat(form[c.dk]) || 0;
    return acc + (s ? s.em*d*c.n : 0);
  }, 0);
  // Fracción anual del suplemento (para cálculo de costos e intensidad GEI)
  const fracSuplAnual  = diasSuplInv / 365;

  // Suplemento desglosado por categoría (para el gráfico de demanda vs solución)
  const suplDetalle = suplCats.reduce((acc,c) => {
    const s = SUPLEMENTOS[form[c.sk]];
    const d = parseFloat(form[c.dk]) || 0;
    acc[c.sk] = s ? +(s.em*d*c.n).toFixed(0) : 0;
    return acc;
  }, {});

  // Fenología real mes a mes (C4 NEA)
  const fenolMes = [
    "menor_10","menor_10","10_25","10_25",
    "25_50","mayor_50","mayor_50","mayor_50",
    "25_50","10_25","menor_10","menor_10"
  ];

  const MESES_NOM = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const hist = getClima(form.provincia || "Corrientes");

  const balanceMensual = MESES_NOM.map((mes, i) => {
    const climM  = hist[i] || { t:22, p:80 };
    const t      = climM.t;
    const fenol  = fenolMes[i];
    const pbPas  = pbPasto(fenol);
    const dig    = { menor_10:68, "10_25":63, "25_50":58, mayor_50:52 }[fenol] || 63;

    // Estado fisiológico REAL de las vacas este mes (basado en cadena reproductiva)
    const mesesDesdeP  = (i - mesParto + 12) % 12;
    const enLact       = mesesDesdeP < Math.ceil(mesesLactN);
    const enPrepartO   = !enLact && mesesDesdeP >= 8;  // 2 meses antes del parto
    const enServ       = (i - mesServIni + 12) % 12 <= (mesServFin - mesServIni + 12) % 12;
    const estadoVaca   = enLact    ? "Lactación con ternero al pie"
                       : enPrepartO ? "Preparto (último mes)"
                       : mesesDesdeP <= 2 ? "Gestación temprana (1–4 meses)"
                       : "Gestación media (5–7 meses)";

    // Requerimientos reales por estado fisiológico
    const reqVacaI = reqEM(pvVaca,       estadoVaca,                    form.biotipo) || 14;
    const reqToroI = reqEM(pvVaca*1.3,   "Vaca seca sin ternero",       form.biotipo) || 14;
    const reqV2sI  = reqEM(pvVaca*0.88,  "Vaca 1° parto lactando",      form.biotipo) || 20;
    const pvVaq2p  = parseFloat(pvEntradaVaq2) || Math.round(pvVaca*0.65);
    const pvVaq1p  = pvEntVaq1 || Math.round(pvVaca*0.40);
    const reqVaq2I = reqEM(pvVaq2p, "vaq2inv", form.biotipo) || 10;
    const reqVaq1I = reqEM(pvVaq1p, "vaq1inv", form.biotipo) || 7;

    const dVacas = nVacas * reqVacaI;
    const dToros = nToros * reqToroI;
    const dV2s   = nV2s   * reqV2sI;
    const dVaq2  = nVaq2  * reqVaq2I;
    const dVaq1  = nVaq1  * reqVaq1I;
    const demanda = dVacas + dToros + dV2s + dVaq2 + dVaq1;

    // Calidad-cantidad del pasto: consumo voluntario real (Lippke 1980)
    const cvPct    = { menor_10:2.8, "10_25":2.4, "25_50":2.0, mayor_50:1.6 }[fenol] || 2.4;
    const factTcv  = t>=25?1.0 : t>=20?0.90 : t>=15?0.75 : 0.50;
    const kgMsVaca = pvVaca * cvPct/100 * factTcv * factorAgua;
    const mcalKg   = mcalKgAdj(t, fenol);
    const ofPastoVaca  = +(kgMsVaca * mcalKg).toFixed(1);
    const ofPastoTotal = +(ofPastoVaca * Math.max(1,totalEV) * factorCarga).toFixed(0);

    // CC movilizada en lactación
    const ccAporte = enLact
      ? Math.round(caidaCC * MCAL_CC * nVacas / Math.max(1, mesesLactN*30)) : 0;

    // Verdeo
    const verdeoAp = form.tieneVerdeo
      ? (i >= verdeoMesInicio && i <= verdeoMesInicio+2 ? verdeoAporteMcalMes : 0) : 0;

    // Suplemento: solo aplica en los meses de invierno configurados
    const suplAp = MESES_SUPL.has(i) ? suplRodeoMcalDia : 0;
    const ofertaTotal = ofPastoTotal + ccAporte + suplAp + verdeoAp;
    const balance     = ofertaTotal - demanda;

    // Cuánto suplemento resolvería el déficit (Mcal/animal/día)
    const defMcal     = balance < 0 ? Math.abs(balance) : 0;
    const solExpGir   = defMcal > 0 ? +(defMcal / 2.6 / Math.max(1,nVacas)).toFixed(2) : 0;
    const solSorgo    = defMcal > 0 ? +(defMcal / 3.1 / Math.max(1,nVacas)).toFixed(2) : 0;
    const solDestete  = defMcal > 0 ? +(defMcal / (nVacas*3.0) * 100).toFixed(0) : 0; // % más a hiperprecoz

    return {
      mes, i,
      // Oferta
      ofPastoTotal:+ofPastoTotal, ofPastoVaca, ccAporte,
      suplAporte:+suplAp.toFixed(0),
      verdeoAporte:+verdeoAp,
      ofertaTotal:+ofertaTotal.toFixed(0),
      // Demanda
      dVacas:+dVacas.toFixed(0), dToros:+dToros.toFixed(0),
      dV2s:+dV2s.toFixed(0), dVaq2:+dVaq2.toFixed(0), dVaq1:+dVaq1.toFixed(0),
      demanda:+demanda.toFixed(0),
      // Balance
      balance:+balance.toFixed(0), deficit:balance<0,
      defMcal:+defMcal.toFixed(0),
      // Calidad pasto
      t, fenol, pbPas, dig, kgMsVaca:+kgMsVaca.toFixed(1),
      // Fisiología
      estadoVaca, enLact, enServ, enPrepartO,
      reqVacaI:+reqVacaI.toFixed(1),
      // Soluciones calculadas
      solExpGir, solSorgo, solDestete,
      // Hitos reproductivos
      esParto:   i===mesParto,
      esServIni: i===mesServIni,
      esDestete: i===mesDestete,
    };
  });

  // Alertas de balance invernal (jun=5, jul=6, ago=7)
  const deficitInv = [5,6,7].filter(i => balanceMensual[i]?.deficit);
  if (deficitInv.length > 0) {
    const peorDef = Math.min(...deficitInv.map(i => balanceMensual[i].balance));
    addAlerta("balance_inv", deficitInv.length === 3 ? "P1" : "P2",
      `Déficit invernal en ${deficitInv.length}/3 meses clave — peor mes: ${peorDef.toLocaleString()} Mcal/día`,
      `Sin corrección: caída CC estimada ${(-peorDef / MCAL_CC / nVacas * 30).toFixed(1)} unidades adicionales sobre lo proyectado`,
      "balanceMensual invernal");
  }

  // ── 2.7 Stock vs demanda (propagado) ──────────────────────────
  const stockStatus = {};
  const stockAlim   = form.stockAlim || [];
  const DIAS_PLAN   = 90; // días de suplementación invierno
  const cats_stock  = [
    // vacas: sin suplemento de balance — su herramienta es el destete
    { sk:"supl_v2s",    dk:"dosis_v2s",    n:nV2s    },
    { sk:"supl_toros",  dk:"dosis_toros",  n:nToros  },
    { sk:"supl_vaq2",   dk:"dosis_vaq2",   n:nVaq2   },
    { sk:"supl_vaq1",   dk:"dosis_vaq1",   n:nVaq1   },
  ];
  const demandaAlim = {};
  cats_stock.forEach(c => {
    const alim = form[c.sk]; if (!alim || !c.n) return;
    const d    = parseFloat(form[c.dk]) || 0; if (!d) return;
    demandaAlim[alim] = (demandaAlim[alim] || 0) + d * c.n * DIAS_PLAN;
  });
  Object.entries(demandaAlim).forEach(([alim, kgNec]) => {
    const item    = stockAlim.find(s => s.alimento === alim);
    const stockKg = item ? parseFloat(item.toneladas) * 1000 : 0;
    const semanas = kgNec > 0 ? Math.floor(stockKg / (kgNec / (DIAS_PLAN / 7))) : 0;
    const suficiente = stockKg >= kgNec;
    stockStatus[alim] = { kgNecesario:+kgNec.toFixed(0), stockKg, semanas, suficiente,
      deficit: suficiente ? 0 : +(kgNec - stockKg).toFixed(0) };
    if (!suficiente && stockKg > 0) {
      addAlerta(`stock_${alim}`, "P2",
        `Stock de ${alim} insuficiente — tenés ${(stockKg/1000).toFixed(1)}t, necesitás ${(kgNec/1000).toFixed(1)}t (faltan ${((kgNec-stockKg)/1000).toFixed(1)}t)`,
        `El plan de suplementación se corta en la semana ${semanas} del invierno`,
        "stockAlim vs demandaAlim");
    } else if (!suficiente && stockKg === 0) {
      addAlerta(`nostock_${alim}`, "P2",
        `Sin stock registrado de ${alim} — el plan requiere ${(kgNec/1000).toFixed(1)}t para el invierno completo`,
        `Comprar antes del inicio de suplementación`,
        "stockAlim");
    }
  });

  // ── 2.8 Sanidad ───────────────────────────────────────────────
  const sanidad = evaluarSanidad(
    form.sanVacunas, form.sanBrucelosis, form.sanAftosa,
    form.sanToros, form.sanAbortos, form.sanPrograma
  );

  // ── 2.9 Diagnóstico toros ─────────────────────────────────────
  const ccToros     = parseFloat(form.torosCC) || null;
  const relacionAT  = nVacas && nToros ? Math.round(nVacas / nToros) : 0;
  const toroDxn     = ccToros ? {
    cc:         ccToros,
    esOk:       ccToros >= 5.0,
    diasParaOk: ccToros < 5.0 ? Math.round((5.5 - ccToros) / 0.018) : 0,
    kgSupl:     +(pvVaca * 1.3 * 0.003).toFixed(1),
    relAT:      relacionAT,
    relAT_ok:   relacionAT <= 25,
  } : null;

  // ── 2.10 Proyección visitas de campo ─────────────────────────
  const visitasCampo = form.visitasCampo || [];
  let ccDesvio = null;
  if (visitasCampo.length > 0 && ccPondVal > 0) {
    const ultima = visitasCampo[visitasCampo.length - 1];
    const ccUlt  = parseFloat(ultima.cc);
    if (ccUlt) {
      ccDesvio = +(ccUlt - ccPondVal).toFixed(2);
      if (Math.abs(ccDesvio) > 0.5) {
        const tipo = ccDesvio < 0 ? "P1" : "P3";
        addAlerta("cc_desvio_campo", tipo,
          `CC observada en campo (${ccUlt}) difiere ${ccDesvio > 0 ? "+" : ""}${ccDesvio} del plan base (${ccPondVal})`,
          ccDesvio < 0
            ? "La CC real está por debajo del plan — revisar suplementación y disponibilidad de pasto"
            : "La CC real supera el plan — condición mejor de lo esperado",
          `Visita ${ultima.fecha}`);
      }
    }
  }

  // ════════════════════════════════════════════════════════════════
  // NIVEL 3 — RESUMEN EJECUTIVO DEL MOTOR
  // ════════════════════════════════════════════════════════════════

  const alertasP1 = alertas.filter(a => a.tipo === "P1");
  const alertasP2 = alertas.filter(a => a.tipo === "P2");
  const alertasP3 = alertas.filter(a => a.tipo === "P3");

  // Score de riesgo sistémico (0–100)
  // Combina: preñez proyectada, balance invernal, CC al servicio, stock, sanidad
  const scorePreñez  = Math.max(0, Math.min(35, (tray?.pr || 0) * 0.35));
  const scoreBalance = deficitInv.length === 0 ? 25 : deficitInv.length === 1 ? 15 : deficitInv.length === 2 ? 8 : 0;
  const scoreCC      = (parseFloat(tray?.ccServ||0) >= 4.5) ? 20 : (parseFloat(tray?.ccServ||0) >= 4.0) ? 12 : 5;
  const scoreStock   = Object.values(stockStatus).every(s => s.suficiente) ? 10 : Object.values(stockStatus).some(s => !s.suficiente) ? 5 : 10;
  const scoreSanidad = sanidad?.alertas?.length === 0 ? 10 : sanidad?.alertas?.length <= 2 ? 6 : 2;
  const scoreRiesgo  = Math.round(scorePreñez + scoreBalance + scoreCC + scoreStock + scoreSanidad);

  const nivelRiesgo  = scoreRiesgo >= 75 ? "bajo"
    : scoreRiesgo >= 50 ? "moderado"
    : scoreRiesgo >= 30 ? "alto" : "critico";

  const colorRiesgo  = { bajo:"#7ec850", moderado:"#e8a030", alto:"#e05530", critico:"#c0392b" }[nivelRiesgo];

  return {
    // Nivel 1
    cadena, disponMS, ndviN, tempHoy, p30, enso,
    evalAgua, factorAgua, factorCarga, cargaEV_ha,
    ofertaMensual: ofertaAjustada,
    verdeoAporteMcalMes, verdeoMesInicio,
    nVacas, nToros, nV2s, nVaq2, nVaq1, totalEV,
    // Nivel 2
    tcSave, pvEntVaq1, vaq1E, pvSalidaVaq1, pvEntradaVaq2, vaq2E,
    tray, dist, ccPondVal, baseParams,
    balanceMensual, suplRodeoMcalDia,
    sanidad, toroDxn, stockStatus, demandaAlim,
    ccDesvio, visitasCampo,
    // Nivel 3
    alertas, alertasP1, alertasP2, alertasP3,
    scoreRiesgo, nivelRiesgo, colorRiesgo,
    trazas,
  };
}

// ─── HOOK DEL MOTOR ───────────────────────────────────────────────
// Corre el motor completo con debounce para no bloquear UI en cada keystroke
function useMotor(form, sat, potreros, usaPotreros) {
  const [estado, setEstado] = React.useState(null);

  React.useEffect(() => {
    // Debounce 80ms — el motor corre muy rápido pero esperamos un frame
    const timer = setTimeout(() => {
      try {
        const resultado = correrMotor(form, sat, potreros, usaPotreros);
        setEstado(resultado);
      } catch(e) {
        console.warn("Motor error:", e);
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [form, sat, potreros, usaPotreros]);

  // Primer run sincrónico
  React.useLayoutEffect(() => {
    try {
      setEstado(correrMotor(form, sat, potreros, usaPotreros));
    } catch(e) {}
  }, []); // eslint-disable-line

  return estado;
}



// ─── DESIGN TOKENS ───────────────────────────────────────────────
const T = {
  bg:       "#0b1a0c",
  card:     "#111f12",
  card2:    "#162018",
  border:   "rgba(126,200,80,.14)",
  green:    "#7ec850",
  greenD:   "#4a9e28",
  amber:    "#e8a030",
  red:      "#e05530",
  blue:     "#4a9fd4",
  purple:   "#9b6fe0",
  text:     "#e8f5e0",
  textDim:  "#8aaa80",
  textFaint:"#4a6048",
  font:     "'IBM Plex Mono', 'Courier New', monospace",
  fontSans: "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
  sans:     "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
  radius:   14,
  r:        14,
};
const C = T;

const ESC_COLORS = ["#7ec850", "#e8a030", "#4a9fd4"];
const ESC_NAMES  = ["Base", "Esc. A", "Esc. B"];

// ─── PILL ─────────────────────────────────────────────────────────
const Pill = ({ children, color = T.green, bg }) => (
  <span style={{
    display:"inline-block", padding:"2px 9px", borderRadius:20,
    fontSize:11, fontFamily:T.font,
    color, background: bg || color + "22",
    border:`1px solid ${color}44`, letterSpacing:.5,
  }}>
    {children}
  </span>
);

// ─── KPI ──────────────────────────────────────────────────────────
const Kpi = ({ label, value, unit = "", color = T.green, sub }) => (
  <div style={{ background:T.card2, borderRadius:T.radius, padding:"12px 14px", border:`1px solid ${T.border}` }}>
    <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, letterSpacing:1.5, marginBottom:4 }}>{label}</div>
    <div style={{ fontFamily:T.font, fontSize:22, fontWeight:700, color, lineHeight:1 }}>
      {value}<span style={{ fontSize:12, color:T.textDim, marginLeft:3 }}>{unit}</span>
    </div>
    {sub && <div style={{ fontFamily:T.fontSans, fontSize:10, color:T.textFaint, marginTop:3 }}>{sub}</div>}
  </div>
);

// ─── METRIC CARD ─────────────────────────────────────────────────
const MetricCard = ({ label, value, color = T.green, sub, style: st }) => (
  <div style={{ background:T.card2, borderRadius:T.radius, padding:"10px 12px", border:`1px solid ${T.border}`, ...st }}>
    <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, letterSpacing:1, marginBottom:3 }}>{label}</div>
    <div style={{ fontFamily:T.font, fontSize:18, fontWeight:700, color, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontFamily:T.fontSans, fontSize:10, color:T.textFaint, marginTop:2 }}>{sub}</div>}
  </div>
);

// ─── ALERTA ───────────────────────────────────────────────────────
// tipos: ok | warn | error | info
const Alerta = ({ tipo, children, style: st }) => {
  const cfg = {
    ok:    { bg:"rgba(126,200,80,.08)",  border:"rgba(126,200,80,.35)",  icon:"✅", color:T.green },
    warn:  { bg:"rgba(232,160,48,.08)",  border:"rgba(232,160,48,.35)",  icon:"⚠️", color:T.amber },
    error: { bg:"rgba(224,85,48,.08)",   border:"rgba(224,85,48,.35)",   icon:"🔴", color:T.red   },
    info:  { bg:"rgba(74,159,212,.08)",  border:"rgba(74,159,212,.25)",  icon:"ℹ️", color:T.blue  },
  };
  const s = cfg[tipo] || cfg.info;
  return (
    <div style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:10, padding:"10px 12px", marginBottom:8, ...st }}>
      <span style={{ fontFamily:T.fontSans, fontSize:12, color:s.color }}>{s.icon} {children}</span>
    </div>
  );
};

// ─── ALERT BOX ────────────────────────────────────────────────────
// niveles: rojo | ambar | verde | info
const AlertBox = ({ nivel, children }) => {
  const cfg = {
    rojo:  { bg:"rgba(224,85,48,.08)",   border:"rgba(224,85,48,.35)",   icon:"🔴", color:T.red   },
    ambar: { bg:"rgba(232,160,48,.08)",  border:"rgba(232,160,48,.35)",  icon:"⚠️", color:T.amber },
    verde: { bg:"rgba(126,200,80,.08)",  border:"rgba(126,200,80,.35)",  icon:"✅", color:T.green },
    info:  { bg:"rgba(74,159,212,.08)",  border:"rgba(74,159,212,.25)",  icon:"ℹ️", color:T.blue  },
  };
  const s = cfg[nivel] || cfg.info;
  return (
    <div style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:10, padding:"10px 12px", marginBottom:8 }}>
      <span style={{ fontFamily:T.fontSans, fontSize:12, color:s.color }}>{s.icon} {children}</span>
    </div>
  );
};

// ─── SEMAFORO ────────────────────────────────────────────────────
const Semaforo = ({ valor, bajo, alto, label, unit = "" }) => {
  const c = valor >= alto ? T.green : valor >= bajo ? T.amber : T.red;
  return <Kpi label={label} value={valor} unit={unit} color={c} />;
};

// ─── SLIDER ──────────────────────────────────────────────────────
const Slider = ({ label, value, min, max, step = 0.1, onChange, unit = "", color = T.green }) => (
  <div style={{ marginBottom:14 }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
      <span style={{ fontFamily:T.fontSans, fontSize:12, color:T.textDim }}>{label}</span>
      <span style={{ fontFamily:T.font, fontSize:13, color, fontWeight:700 }}>{value}{unit}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      style={{ width:"100%", accentColor:color, cursor:"pointer", height:4 }}
    />
    <div style={{ display:"flex", justifyContent:"space-between" }}>
      <span style={{ fontFamily:T.font, fontSize:9, color:T.textFaint }}>{min}{unit}</span>
      <span style={{ fontFamily:T.font, fontSize:9, color:T.textFaint }}>{max}{unit}</span>
    </div>
  </div>
);

// ─── TOGGLE ──────────────────────────────────────────────────────
const Toggle = ({ label, value, onChange }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
    <span style={{ fontFamily:T.fontSans, fontSize:13, color:T.text }}>{label}</span>
    <div
      onClick={() => onChange(!value)}
      style={{ width:44, height:24, borderRadius:12, background:value ? T.green : "rgba(255,255,255,.1)", cursor:"pointer", position:"relative", transition:"all .2s" }}
    >
      <div style={{ position:"absolute", top:3, left:value ? 22 : 3, width:18, height:18, borderRadius:9, background:"white", transition:"all .2s" }} />
    </div>
  </div>
);

// ─── BTN SEL ──────────────────────────────────────────────────────
const BtnSel = ({ active, onClick, children, style: st }) => (
  <button onClick={onClick} style={{
    padding:"10px 14px", borderRadius:10, cursor:"pointer", textAlign:"left",
    background: active ? `${T.green}15` : T.card2,
    border:     `1px solid ${active ? T.green : T.border}`,
    color:      active ? T.green : T.textDim,
    fontFamily: T.fontSans, fontSize:12, fontWeight: active ? 700 : 400,
    width:"100%", ...st,
  }}>
    {children}
  </button>
);

// ─── DIST CC ─────────────────────────────────────────────────────
function DistCC({ dist, onChange, label }) {
  const addRow = () => onChange([...(dist || []), { cc:"4.5", pct:"" }]);
  const delRow = (i) => onChange((dist || []).filter((_, j) => j !== i));
  const upd    = (i, k, v) => { const n = [...(dist||[])]; n[i] = { ...n[i], [k]:v }; onChange(n); };
  const total  = (dist || []).reduce((s, d) => s + (parseFloat(d.pct)||0), 0);

  return (
    <div>
      {label && <div style={{ fontFamily:T.font, fontSize:10, color:T.textDim, letterSpacing:1, marginBottom:8 }}>{label}</div>}
      {(dist || []).map((d, i) => (
        <div key={i} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, marginBottom:3 }}>CC</div>
            <select
              value={d.cc} onChange={e => upd(i, "cc", e.target.value)}
              style={{ width:"100%", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"9px 10px", fontFamily:T.font, fontSize:13 }}
            >
              {["3.0","3.5","4.0","4.5","5.0","5.5","6.0","6.5","7.0"].map(v => (
                <option key={v} value={v}>CC {v}</option>
              ))}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, marginBottom:3 }}>% del rodeo</div>
            <input
              type="number" value={d.pct} onChange={e => upd(i, "pct", e.target.value)}
              placeholder="%" style={{ width:"100%", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"9px 10px", fontFamily:T.font, fontSize:13, boxSizing:"border-box" }}
            />
          </div>
          <button onClick={() => delRow(i)} style={{ background:"none", border:"none", color:T.red, cursor:"pointer", fontSize:16, padding:"0 4px", marginTop:14 }}>✕</button>
        </div>
      ))}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4 }}>
        <button onClick={addRow} style={{ background:`${T.green}08`, border:`1px solid ${T.border}`, borderRadius:8, color:T.green, padding:"7px 14px", fontFamily:T.font, fontSize:11, cursor:"pointer" }}>
          + Agregar grupo
        </button>
        <span style={{ fontFamily:T.font, fontSize:11, color: total === 100 ? T.green : T.amber }}>
          {total}%{total !== 100 ? " ⚠" : ""}
        </span>
      </div>
    </div>
  );
}

// ─── LOADING PANEL ───────────────────────────────────────────────
function LoadingPanel({ msg }) {
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

// ─── INPUT ────────────────────────────────────────────────────────
function Input({ label, value, onChange, placeholder, type = "text", sub, warn, id }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:5 }}>{label}</div>}
      <input
        id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width:"100%", background:C.card2, border:`1px solid ${warn ? "rgba(232,160,48,.5)" : C.border}`, borderRadius:10, color:C.text, padding:"12px 14px", fontFamily:C.sans, fontSize:14, boxSizing:"border-box" }}
      />
      {sub  && <div style={{ fontFamily:C.sans, fontSize:10, color:C.textFaint, marginTop:4 }}>{sub}</div>}
      {warn && <div style={{ fontFamily:C.sans, fontSize:10, color:C.amber,    marginTop:4 }}>⚠ {warn}</div>}
    </div>
  );
}

// ─── SELECT F ────────────────────────────────────────────────────
function SelectF({ label, value, onChange, options, groups, sub }) {
  // options = [[val, label], ...] plana
  // groups  = [{ label:"Grupo", opts:[[val,label],...] }, ...]
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:5 }}>{label}</div>}
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{ width:"100%", background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, padding:"12px 14px", fontFamily:C.sans, fontSize:14 }}
      >
        {groups
          ? groups.map(g => (
              <optgroup key={g.label} label={g.label}>
                {g.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </optgroup>
            ))
          : options.map(([v, l]) => <option key={v} value={v}>{l}</option>)
        }
      </select>
      {sub && <div style={{ fontFamily:C.sans, fontSize:10, color:C.textFaint, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

// ─── SUPL SELECTOR ───────────────────────────────────────────────
function SuplSelector({ label, supl, dosis, onSuplChange, onDosisChange, fenolPasto, color = T.green }) {
  const s    = SUPLEMENTOS[supl];
  const sinc = supl && dosis > 0 ? evaluarSincronia(fenolPasto, supl, dosis) : null;
  const mcal = mcalSuplemento(supl, dosis);

  return (
    <div style={{ background:T.card2, borderRadius:T.radius, padding:14, border:`1px solid ${T.border}`, marginBottom:12 }}>
      <div style={{ fontFamily:T.font, fontSize:10, color, letterSpacing:1, marginBottom:10 }}>{label}</div>
      <select
        value={supl || ""} onChange={e => onSuplChange(e.target.value)}
        style={{ width:"100%", background:T.card, border:`1px solid ${T.border}`, borderRadius:8, color:T.text, padding:"10px 12px", fontFamily:T.fontSans, fontSize:13, marginBottom:10 }}
      >
        <option value="">— Sin suplemento —</option>
        {Object.keys(SUPLEMENTOS).map(k => (
          <option key={k} value={k}>{SUPLEMENTOS[k].label} (PB {SUPLEMENTOS[k].pb}% | {SUPLEMENTOS[k].em} Mcal/kg)</option>
        ))}
      </select>

      <div style={{ display: supl ? "block" : "none" }}>
  <Slider label="Dosis kg/vaca/día" value={dosis} min={0.1} max={5} step={0.1} onChange={onDosisChange} unit=" kg" color={color} />
</div>

     <div style={{ display: (supl && dosis > 0) ? "flex" : "none", gap:8, flexWrap:"wrap", marginBottom:8 }}>
  <Pill color={T.blue}>+{mcal.toFixed(1)} Mcal/v/d</Pill>
  <Pill color={color}>PB {s.pb}%</Pill>
  {sinc && <Pill color={sinc.eficiente ? T.green : T.red}>{sinc.eficiente ? "✓ Sincronía OK" : "⚠ Riesgo sincronía"}</Pill>}
</div>

      {sinc && sinc.warnings.map((w, i) => <AlertBox key={i} nivel={w.nivel}>{w.msg}</AlertBox>)}
    </div>
  );
}

// ─── PANEL AGUA + SANIDAD ────────────────────────────────────────
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
          Fuente: López et al. 2021, JAS 99(8). TDS {">"} 3.000 mg/L reduce DMI y consumo de agua significativamente.
        </div>
      </div>

      <Input label="TDS TOTAL — SÓLIDOS DISUELTOS (mg/L)" value={form.aguaTDS} onChange={v => set("aguaTDS", v)}
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
                <Pill color={C.red}>DMI −{evalAgua.pctReducDMI.toFixed(0)}%</Pill>
                <Pill color={C.red}>Pasto consumido −{evalAgua.pctReducPasto.toFixed(0)}%</Pill>
                <Pill color={C.amber}>Agua ingerida −{evalAgua.pctReducWI.toFixed(0)}%</Pill>
                {evalAgua.ts.factor > 1.1 && <Pill color={C.red}>SO4: ×{evalAgua.ts.factor}</Pill>}
              </div>
            )}
          </div>
          {evalAgua.warnings.map((w, i) => (
            <Alerta key={i} tipo={w.nivel === "rojo" ? "error" : w.nivel === "ambar" ? "warn" : "ok"}>{w.msg}</Alerta>
          ))}
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginTop:4 }}>Fuente: López et al. 2021, JAS 99(8):skab215</div>
        </div>
      )}

      {/* Sanidad */}
      <div style={{ marginTop:20 }}>
        <div style={{ fontFamily:C.font, fontSize:10, color:C.amber, letterSpacing:1, marginBottom:12 }}>🩺 SANIDAD — ASPECTOS REPRODUCTIVOS</div>
        <div style={{ fontFamily:C.sans, fontSize:11, color:C.textDim, marginBottom:12, lineHeight:1.6 }}>
          La sanidad es el techo del sistema. Sin ella, cualquier mejora nutricional tiene rendimiento marginal.
        </div>

        <Toggle label="💉 ¿Vacunación Aftosa al día?"        value={form.sanAftosa     === "si"}           onChange={v => set("sanAftosa",     v ? "si" : "no")} />
        {form.sanAftosa === "no" && <Alerta tipo="error">Aftosa sin vacunar — obligatoria (SENASA). Dos dosis anuales mínimo. Riesgo de brote y clausura comercial.</Alerta>}

        <Toggle label="💉 ¿Vacunación Brucelosis al día?"    value={form.sanBrucelosis === "si"}           onChange={v => set("sanBrucelosis", v ? "si" : "no")} />
        {form.sanBrucelosis === "no" && <Alerta tipo="error">Brucelosis sin vacunar — obligatoria en terneras 3–8 meses (SENASA RES.114/21). Zoonosis. Riesgo de aborto masivo al 7° mes.</Alerta>}

        <Toggle label="💉 ¿Vacunación IBR/DVB al día?"       value={form.sanVacunas  === "si"}           onChange={v => set("sanVacunas",   v ? "si" : "no")} />
        <div style={{ marginTop:12 }}>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.blue, letterSpacing:1, marginBottom:8 }}>🦟 CONTROL PARASITARIO</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <SelectF label="PARÁSITOS EXTERNOS (garrapatas)" value={form.sanParasitoExt||""} onChange={v=>set("sanParasitoExt",v)} options={[
              ["no","No realiza control"],
              ["si_1","1 tratamiento/año"],
              ["si_2","2–3 tratamientos/año"],
              ["si_completo","Control completo (baño + pour-on)"],
            ]} />
            <SelectF label="PARÁSITOS INTERNOS" value={form.sanParasitoInt||""} onChange={v=>set("sanParasitoInt",v)} options={[
              ["no","No realiza control"],
              ["si_1","1 tratamiento/año (destete)"],
              ["si_2","2 tratamientos/año"],
              ["si_rotacion","Rotación de principios activos"],
            ]} />
          </div>
          {(form.sanParasitoExt==="no" || form.sanParasitoInt==="no") && (
            <Alerta tipo="warn" style={{marginTop:8}}>
              Sin control parasitario: reducción GDP 15-25% · mayor susceptibilidad invierno (INTA EEA Colonia Benítez 2025)
            </Alerta>
          )}
        </div>
        {form.sanVacunas === "no" && <Alerta tipo="error">IBR/DVB sin vacunar: riesgo de reducción de preñez hasta −15 pp.</Alerta>}

        <Toggle label="🐂 ¿Toros con evaluación ESAN?"       value={form.sanToros    === "con_control"}   onChange={v => set("sanToros",     v ? "con_control" : "sin_control")} />
        {form.sanToros === "sin_control" && <Alerta tipo="error">Toros sin ESAN: tricomoniasis/campylobacteriosis no detectadas.</Alerta>}

        <Toggle label="📋 ¿Historia de abortos en el rodeo?" value={form.sanAbortos  === "si"}            onChange={v => set("sanAbortos",   v ? "si" : "no")} />
        {form.sanAbortos === "si" && <Alerta tipo="warn">Historia de abortos: diagnóstico diferencial IBR/DVB/Leptospira/Brucelosis/Neospora prioritario.</Alerta>}

        <Toggle label="📋 ¿Programa sanitario estructurado?" value={form.sanPrograma === "si"}            onChange={v => set("sanPrograma",  v ? "si" : "no")} />

        {/* Tabla de enfermedades */}
        <div style={{ background:C.card2, borderRadius:12, padding:12, border:`1px solid ${C.border}`, marginTop:12 }}>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1, marginBottom:8 }}>ENFERMEDADES REPRODUCTIVAS — REFERENCIA</div>
          {ENFERMEDADES_REPROD.map((e, i) => (
            <div key={i} style={{ borderBottom: i < ENFERMEDADES_REPROD.length-1 ? `1px solid ${C.border}` : "none", padding:"8px 0" }}>
              <div style={{ fontFamily:C.sans, fontSize:12, color: e.alerta === "alta" ? C.red : C.amber, fontWeight:600 }}>{e.nombre}</div>
              <div style={{ fontFamily:C.sans, fontSize:11, color:C.textDim, marginTop:2 }}>{e.impacto}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── GRÁFICO CC ESCENARIOS ────────────────────────────────────────
function GraficoCCEscenarios({ escenarios, cadena, mesesLact, form, sat }) {
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
    const ofTotal = calcOfPasto(form?.vegetacion || "Pastizal natural NEA/Chaco", ndviI, h.t, h.p, enso, fenolMs) * sup * Math.max(0, 100-pctM-pctN) / 100;
    const ofVaca  = nTotal > 0 ? ofTotal / nTotal : calcOfPasto(form?.vegetacion || "Pastizal natural NEA/Chaco", ndviI, h.t, h.p, enso, fenolMs) * 0.024 * pvVaca;
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
        TRAYECTORIA CC ANUAL — ● = inicio servicio
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
            <span style={{ fontFamily:T.font, fontSize:8, color:T.green }}>▓ Pasto</span>
            <span style={{ fontFamily:T.font, fontSize:8, color:T.amber }}>▓ CC movilizada</span>
            <span style={{ fontFamily:T.font, fontSize:8, color:T.blue  }}>▓ Suplemento</span>
            <span style={{ fontFamily:T.font, fontSize:8, color:T.red   }}>── Requerimiento</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GRÁFICO BALANCE ENERGÉTICO + DEMANDA POR CATEGORÍA ──────────
// ═══════════════════════════════════════════════════════════════════
// BALANCE ENERGÉTICO v2 — por categoría + correcciones en cascada
// Lógica: oferta base → gap por categoría → cuánto cierra cada corrector
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// MÓDULO GEI — Balance CH₄ / CO₂ en sistemas pastoriles bovinos
// ═══════════════════════════════════════════════════════════════════
// Fuentes:
//  McGinn et al. 2014 (J.Env.Quality) — emisión CH4 entérico y flujo CO2 pastizal
//  Wang et al. 2023 (Nature Comms)    — límites del secuestro por suelos
//  Li et al. 2021 (Nature Comms)      — balance CH4+N2O+CO2 con manejo
//  Gere et al. 2024 (Animals)         — CH4 en pastoreo extensivo NEA/trópico
//  Soussana et al. (Agric.Ecosyst.)   — balance GEI sistema pastoril completo
//  IPCC Tier 2 / FAO-GLEAM            — factores por categoría y sistema
// ═══════════════════════════════════════════════════════════════════

// ── Factores de emisión CH₄ entérico (g CH₄/kg MS consumida) ─────
// IPCC Tier 2 + Gere et al. 2024 calibrado pastoreo extensivo C4/NEA
// La digestibilidad del pasto MODIFICA la emisión:
//   alta dig (>65%) → menor CH4/kg MS (fermentación más eficiente)
//   baja dig (<55%) → mayor CH4/kg MS (fibra no digerible → más metano)
// Fórmula base: CH4 = Ym × GE / 55.65 (IPCC) donde Ym = fracción metanogénica
// Ym calibrado por digestibilidad (Benchaar et al.; Kennedy et al.)
const GEI_YM = (dig) => {
  // Ym: 5.5-8% de la energía bruta → mayor con pasto de baja digestibilidad
  if (dig >= 68) return 0.055;  // pasto tierno <10% floración — muy eficiente
  if (dig >= 63) return 0.062;  // 10-25% floración — normal
  if (dig >= 58) return 0.071;  // 25-50% floración — encañando
  return 0.082;                  // >50% floración — muy ineficiente (Gere 2024)
};

// Energía bruta por kg MS ajustada por digestibilidad
const GEI_GE_KGMS = (dig) => {
  // GE ≈ 18.45 MJ/kg MS pasto (IPCC) — ajuste menor por calidad
  return dig >= 65 ? 18.45 : dig >= 58 ? 18.20 : 18.00; // MJ/kg MS
};

// CH₄ g/kg MS consumida por categoría y digestibilidad
function calcCH4_kgMS(dig) {
  const Ym = GEI_YM(dig);
  const GE = GEI_GE_KGMS(dig);
  // CH4 (MJ/dia) = Ym × GE × consumo → CH4 (g/kg MS) = Ym × GE × 1000/55.65
  return +(Ym * GE * 1000 / 55.65).toFixed(2); // g CH4/kg MS
}

// Factor de conversión GWP100: CH₄ = 28× CO₂eq (IPCC AR6, excl. retroalimentación)
// Wang et al. 2023 usa 27-34x — usamos 28 (AR6 fossil-methane eq)
const GWP_CH4 = 28;

// ── Consumo voluntario de MS por categoría (kg MS/cabeza/día) ────
// Ajustado por digestibilidad (Lippke 1980; Minson 1990)
function consumoMSCat(pv, cat, dig, fenol, t) {
  const cvPct = { menor_10:2.8, "10_25":2.4, "25_50":2.0, mayor_50:1.6 }[fenol] || 2.4;
  const factT = t >= 25 ? 1.0 : t >= 20 ? 0.90 : t >= 15 ? 0.75 : 0.50;
  // Factor de categoría sobre el CV base (proporcional al requerimiento relativo)
  const factCat = {
    vaca_lact: 1.10,   // lactación: máximo consumo
    vaca_seca: 0.90,
    v2s:       1.05,
    toro:      1.00,
    vaq2:      0.85,
    vaq1:      0.70,
  }[cat] || 1.0;
  return +(pv * cvPct / 100 * factT * factCat).toFixed(2);
}

// ── Efecto del suplemento sobre la emisión por kg MS ─────────────
// Suplemento proteico de alta digestibilidad → dilución de la fibra indigestible
// → mejora digestibilidad total de la dieta → menor Ym efectivo
// Beauchemin et al. 2009; Benchaar 2020
function digConSupl(digBase, pbSupl, dosisSupl, consumoBase) {
  if (!dosisSupl || dosisSupl <= 0) return digBase;
  // Digestibilidad del suplemento proteico: 75-82%
  const digSupl = pbSupl > 30 ? 80 : 72;
  const totalMS = consumoBase + dosisSupl;
  const digMix  = (digBase * consumoBase + digSupl * dosisSupl) / totalMS;
  return Math.min(82, +digMix.toFixed(1));
}

// ── Ineficiencias productivas → CH₄ "sin retorno" ─────────────────
// Vaca vacía emite CH₄ sin producir ternero → ineficiencia productiva absoluta
// IPCC/FAO GLEAM: el CH₄ de vaca vacía es 100% "no productive emission"
// Vaquillona que entra al servicio con >24 meses: 8-12 meses extra de emisión
// sin producción (Wang et al. 2023 — ruminant non-productive fraction)
function calcIneficiencias(nVacas, prenezPct, nVaq1, edadEntoreReal) {
  const vacasVacias     = Math.round(nVacas * (1 - (prenezPct || 50) / 100));
  // CH₄ anual de vaca vacía (IPCC Tier 2, sistema extensivo 320kg):
  // ~ 55 kg CH₄/año × GWP28 = 1540 kg CO₂eq/año por vaca vacía
  const ch4VacaVaciaAnual = 55; // kg CH₄/año (IPCC 2019, Tier 2, cat. vaca cría)
  const co2eqVacasVacias = vacasVacias * ch4VacaVaciaAnual * GWP_CH4;

  // Vaquillona entorando tarde (>24 meses → pasa a 36 meses)
  // Meses extra improductivos: 36 - 24 = 12 meses = 0.5 año adicional de CH₄
  const edadObj   = 24; // meses ideal (INTA — entore a los 24 meses)
  const demora    = Math.max(0, (edadEntoreReal || 36) - edadObj); // meses extra
  const fracInefi = demora / 12; // fracción de año adicional improductivo
  // CH₄ vaquillona: ~35 kg/año (IPCC, categoría reposición 200-280kg)
  const ch4VaqAnual = 35; // kg CH₄/año
  const co2eqVaqTarde = nVaq1 * ch4VaqAnual * fracInefi * GWP_CH4;

  return {
    vacasVacias,
    prenezPct: prenezPct || 50,
    ch4VacaVaciaAnual,
    co2eqVacasVacias: Math.round(co2eqVacasVacias),
    demora,
    fracInefi: +fracInefi.toFixed(2),
    co2eqVaqTarde: Math.round(co2eqVaqTarde),
    totalCO2eqInefi: Math.round(co2eqVacasVacias + co2eqVaqTarde),
  };
}

// ── Balance CO₂ del pastizal (secuestro/emisión neta) ─────────────
// McGinn et al. 2014: pastizal manejado puede ser neutro o sumidero débil
// Soussana et al.: secuestro 0.1-0.6 tC/ha/año según manejo
// Wang et al. 2023: ADVERTENCIA — no asumir secuestro permanente
//
// CO₂ flux depende de:
//   - tipo de vegetación (C3 mayor secuestro invernal que C4)
//   - NDVI (proxy de productividad primaria neta)
//   - precipitación
//   - carga animal (degradación vs regeneración)
//   - temperatura (respiración del suelo)
//
// Usamos modelo simplificado calibrado con McGinn 2014 y Soussana:
// NPP neta = producción - respiración heterotrófica - pisoteo
function calcCO2PastizalAnual(veg, ndvi, supHa, cargaEV_ha, precipAnual, t_media) {
  // Producción primaria neta (kgC/ha/año) base por vegetación
  // Calibrado con datos NEA (Chaco húmedo, Corrientes, Formosa)
  const NPP_BASE = {
    "Pastizal natural NEA/Chaco":                   600,  // kgC/ha/año — pastizal nativo
    "Megatérmicas C4 (gatton panic, brachiaria)":   900,  // C4 alta productividad
    "Pasturas templadas C3":                         750,  // C3 moderada
    "Mixta gramíneas+leguminosas":                   820,  // mixtura, mejor ciclo N
    "Bosque nativo":                                1200,  // bosque = máximo secuestro
    "Verdeo de invierno":                            550,  // anual, ciclo corto
  }[veg] || 600;

  // NDVI modifica la NPP: NDVI alto → mayor productividad
  const ndviN  = parseFloat(ndvi) || 0.45;
  const factN  = 0.5 + ndviN * 1.1; // NDVI 0.3 → 0.83; NDVI 0.7 → 1.27

  // Precipitación: relación lineal por encima de 400mm/año (Li et al. 2021)
  const precN  = Math.max(0.6, Math.min(1.4, precipAnual / 1000));

  // Respiración heterotrófica: ~50% de la NPP en sistemas tropicales
  // Wang et al. 2023: R_het = 0.45-0.55 × NPP según T° y humedad
  const Rh_frac = t_media > 25 ? 0.55 : t_media > 20 ? 0.50 : 0.45;

  // NEP = NPP - R_het (kgC/ha/año, > 0 = secuestro neto)
  const NPP_real = NPP_BASE * factN * precN;
  const NEP      = NPP_real * (1 - Rh_frac);

  // Efecto de la carga: sobrecarga → pérdida de cobertura → mayor respiración
  // Li et al. 2021: pastizales degradados por sobrecarga → fuente neta de CO₂
  const factCarga = cargaEV_ha > 1.2 ? -0.3   // degradado: pierde carbono
    : cargaEV_ha > 0.8 ? 0.0     // neutro: balance cero
    : cargaEV_ha > 0.4 ? 0.15    // óptimo: secuestro moderado
    : 0.25;                        // subganadera: máximo secuestro

  const CO2_ha_anual = (NEP + NPP_real * factCarga) * 3.667; // kgC → kgCO2
  // Total del establecimiento
  const CO2_total = CO2_ha_anual * (supHa || 1);

  return {
    NPP_real:  Math.round(NPP_real),
    NEP:       Math.round(NEP),
    factCarga,
    CO2_ha:    Math.round(CO2_ha_anual),  // kgCO2eq/ha/año (> 0 = secuestro)
    CO2_total: Math.round(CO2_total),      // total establecimiento (> 0 = secuestro)
    esFuente:  CO2_total < 0,              // < 0 = fuente de CO2
  };
}

// ── MOTOR GEI PRINCIPAL ──────────────────────────────────────────
// Calcula balance completo CH₄ vs CO₂ para el sistema
function calcGEI(form, motor, tray, sat) {
  const nVacas  = motor?.nVacas  || parseInt(form.vacasN)  || 0;
  const nToros  = motor?.nToros  || parseInt(form.torosN)  || 0;
  const nV2s    = motor?.nV2s    || parseInt(form.v2sN)    || 0;
  const nVaq2   = motor?.nVaq2   || parseInt(form.vaq2N)   || 0;
  const nVaq1   = motor?.nVaq1   || Math.round(nVacas * (parseFloat(form.pctReposicion)||20)/100);
  const pvVaca  = parseFloat(form.pvVacaAdulta) || 320;
  const ndvi    = parseFloat(sat?.ndvi) || parseFloat(form.ndvi) || 0.45;
  const supHa   = parseFloat(form.supHa) || 100;
  const cargaEV = motor?.cargaEV_ha || (nVacas / supHa);
  const prenez  = tray?.pr || parseFloat(form.prenez) || 50;

  // Clima anual
  const hist        = getClima(form.provincia || "Corrientes");
  const precipAnual = hist.reduce((s, m) => s + (m.p || 80), 0);
  const t_media     = +(hist.reduce((s, m) => s + (m.t || 22), 0) / 12).toFixed(1);

  // ── FIX 1: Digestibilidad MES A MES (no foto fija de fenología actual) ────────
  // La fenología del pasto C4/NEA varía a lo largo del año:
  // verano = pasto encañado (dig baja, más CH4/kg MS)
  // invierno = pasto restringido o verdeo (dig alta, menos CH4/kg MS)
  // Usar un único valor de fenología actual para todo el año inflaría el CH4
  // invernal o subestimaría el CH4 estival según el momento de carga del form.
  // Solución: iterar los 12 meses con fenología real y promediar ponderado.
  const FENOL_MES = [
    "menor_10","menor_10","10_25","10_25",
    "25_50","mayor_50","mayor_50","mayor_50",
    "25_50","10_25","menor_10","menor_10",
  ];
  const DIG_FENOL = { menor_10:68, "10_25":63, "25_50":58, mayor_50:52 };

  // Verdeo: si hay verdeo de invierno, meses 5-7 (jun-ago) tienen dig 72
  const tieneVerdeo = form.tieneVerdeo === "si" && parseFloat(form.verdeoHa) > 0;
  const verdeoMesI  = { junio:5, julio:6, agosto:7, septiembre:8 }[form.verdeoDisp||"agosto"] || 7;

  const digMensual = FENOL_MES.map((f, i) => {
    if (tieneVerdeo && i >= verdeoMesI && i <= verdeoMesI + 2) return 72; // verdeo avena/raigrás
    return DIG_FENOL[f];
  });

  // CH4/kg MS mensual por temperatura y digestibilidad
  const ch4MensualBase = digMensual.map((d, i) => ({
    dig:  d,
    fenol: FENOL_MES[i],
    t:     hist[i]?.t || 22,
    ch4KgMs: calcCH4_kgMS(d),
  }));

  // Digestibilidad promedio ponderada anual (para mostrar en UI)
  const digPromAnual = Math.round(digMensual.reduce((s, d) => s + d, 0) / 12);

  // ── FIX 2: lookup correcto de suplemento por categoría ────────────────────────
  // El form usa claves: supl_v2s, supl_toros, supl_vaq2, supl_vaq1
  // Las vacas adultas NO tienen suplemento por diseño (herramienta = destete)
  const SUPL_KEY = {
    vaca: null,          // sin suplemento
    v2s:  "supl_v2s",
    toro: "supl_toros",  // con "s" — forma correcta del field
    vaq2: "supl_vaq2",
    vaq1: "supl_vaq1",
  };
  const DOSIS_KEY = {
    vaca: null,
    v2s:  "dosis_v2s",
    toro: "dosis_toros",
    vaq2: "dosis_vaq2",
    vaq1: "dosis_vaq1",
  };

  const CATS_BASE = [
    { id:"vaca", label:"Vacas adultas",     n:nVacas, pv:pvVaca,        catCV:"vaca_lact" },
    { id:"v2s",  label:"V. 2° servicio",    n:nV2s,   pv:pvVaca * 0.88, catCV:"v2s"       },
    { id:"toro", label:"Toros",             n:nToros, pv:pvVaca * 1.30, catCV:"toro"      },
    { id:"vaq2", label:"Vaq. 2° invierno",  n:nVaq2,  pv:pvVaca * 0.65, catCV:"vaq2"      },
    { id:"vaq1", label:"Vaq. 1° invierno",  n:nVaq1,  pv:pvVaca * 0.40, catCV:"vaq1"      },
  ].filter(c => c.n > 0).map(c => {
    const suplKey  = SUPL_KEY[c.id];
    const dosisKey = DOSIS_KEY[c.id];
    return {
      ...c,
      suplNombre: suplKey ? (form[suplKey] || null) : null,
      suplPb:     suplKey ? (SUPLEMENTOS[form[suplKey]]?.pb || 0) : 0,
      suplDosis:  dosisKey ? (parseFloat(form[dosisKey]) || 0) : 0,
    };
  });

  // ── Calcular CH₄ por categoría: promedio mensual real ─────────────────────────
  // Para cada categoría: iterar los 12 meses, calcular CH4/día ese mes,
  // acumular y dividir por 365. Esto da el CH4 anual real con variación estacional.
  const catData = CATS_BASE.map(c => {
    // CH4 mensual base (sin suplemento)
    let ch4DiaBaseAcum = 0;
    let ch4DiaSuplAcum = 0;
    let digSuplPromAcum = 0;
    let cvBaseAcum = 0;

    ch4MensualBase.forEach(m => {
      const diasMes = 30; // aproximación uniforme — suficiente para el promedio anual
      const cvBase  = consumoMSCat(c.pv, c.catCV, m.dig, m.fenol, m.t);
      // Con suplemento: la dosis aplica todo el año (si fue cargada)
      const digS    = digConSupl(m.dig, c.suplPb, c.suplDosis, cvBase);
      const ch4S    = calcCH4_kgMS(digS);
      const cvS     = c.suplDosis > 0
        ? +(cvBase * (digS > m.dig + 3 ? 1.12 : 1.05) + c.suplDosis).toFixed(2)
        : cvBase;

      ch4DiaBaseAcum += cvBase * m.ch4KgMs * diasMes;
      ch4DiaSuplAcum += cvS   * ch4S       * diasMes;
      digSuplPromAcum += digS * diasMes;
      cvBaseAcum      += cvBase * diasMes;
    });

    // Promedios anuales
    const ch4DiaBase = +(ch4DiaBaseAcum / 360).toFixed(1); // g CH4/cab/día promedio anual
    const ch4DiaSupl = +(ch4DiaSuplAcum / 360).toFixed(1);
    const digConSProm = +(digSuplPromAcum / 360).toFixed(1);
    const cvBaseProm  = +(cvBaseAcum / 360).toFixed(2);

    // Eficiencia de emisión representativa: g CH4 por kg MS, promedio anual
    const eficBase = cvBaseProm > 0 ? +(ch4DiaBase / cvBaseProm).toFixed(2) : 0;
    const eficSupl = cvBaseProm > 0 && c.suplDosis > 0
      ? +(ch4DiaSupl / (cvBaseProm + c.suplDosis * 0.9)).toFixed(2) : eficBase;

    // CH₄ total rodeo/año (kg/año) — 365 días exactos
    const ch4AnoBase = Math.round(ch4DiaBase * c.n * 365 / 1000);
    const ch4AnoSupl = Math.round(ch4DiaSupl * c.n * 365 / 1000);

    // ── FIX 3: GWP correcto ────────────────────────────────────────────────────
    // GWP100 biogénico AR6 = 27.9 ≈ 28 (igual que fósil en AR6, a diferencia del AR5)
    // GWP* (métrica dinámica, Allen et al. 2018) para rodeo estable ≈ 4-8×
    // Mostramos ambos para que el usuario entienda la diferencia
    const co2eqBase_gwp28  = ch4AnoBase * GWP_CH4;    // GWP100 AR6
    const co2eqSupl_gwp28  = ch4AnoSupl * GWP_CH4;
    const GWP_STAR = 4.5; // promedio conservador para rodeo estable (Allen 2018)
    const co2eqBase_star   = ch4AnoBase * GWP_STAR;   // GWP* — rodeo sin crecimiento
    const co2eqSupl_star   = ch4AnoSupl * GWP_STAR;

    return {
      ...c,
      digPromAnual, digConSProm,
      cvBaseProm,
      ch4DiaBase, ch4DiaSupl,
      ch4AnoBase, ch4AnoSupl,
      co2eqBase: co2eqBase_gwp28,
      co2eqSupl: co2eqSupl_gwp28,
      co2eqBase_star, co2eqSupl_star,
      delta: ch4AnoSupl - ch4AnoBase,
      mejora: ch4DiaSuplAcum < ch4DiaBaseAcum,
      eficBase: +eficBase.toFixed(1),
      eficSupl: +eficSupl.toFixed(1),
    };
  });

  // ── INEFICIENCIAS PRODUCTIVAS ─────────────────────────────────────────────────
  // ── FIX 4: ineficiencias como FRACCIÓN del total, no suma adicional ───────────
  // Las vacas vacías y las vaquillones tardías YA están incluidas en el CH4 total
  // de catData. La ineficiencia se expresa como:
  //   (a) CO2eq improductivo = fracción del total de esa categoría sin retorno económico
  //   (b) Intensidad de emisión = kg CO2eq / kg PV producido (el número más honesto)
  // No se suma al balance neto — sería doble contabilidad.
  const edadEntoreReal = motor?.vaq1E?.pvSal >= 220 ? 24
    : motor?.vaq1E?.pvSal >= 200 ? 28 : 36;

  // Fracción improductiva de las vacas: vacías emiten pero no generan ternero
  const vacasVacias     = Math.round(nVacas * (1 - prenez / 100));
  const pctInefiVacas   = nVacas > 0 ? vacasVacias / nVacas : 0;
  const catVaca         = catData.find(c => c.id === "vaca");
  const co2eqVacasVacias = catVaca ? Math.round(catVaca.co2eqBase * pctInefiVacas) : 0;

  // Fracción improductiva de la vaquillona: meses adicionales antes del primer parto
  const edadObj         = 24; // meses — INTA
  const demora          = Math.max(0, edadEntoreReal - edadObj);
  const fracInefiVaq    = demora > 0 ? demora / (edadEntoreReal || 36) : 0;
  const catVaq1         = catData.find(c => c.id === "vaq1");
  const co2eqVaqTarde   = catVaq1 ? Math.round(catVaq1.co2eqBase * fracInefiVaq) : 0;

  // Total improductivo: es una PARTICIÓN del total, no una suma nueva
  const totalCH4Base   = catData.reduce((s, c) => s + c.ch4AnoBase, 0);
  const totalCH4Supl   = catData.reduce((s, c) => s + c.ch4AnoSupl, 0);
  const totalCO2eqBase = totalCH4Base * GWP_CH4;
  const totalCO2eqSupl = totalCH4Supl * GWP_CH4;
  const totalCO2eqBaseSTAR = totalCH4Base * 4.5;
  const totalCO2eqSuplSTAR = totalCH4Supl * 4.5;

  const totalCO2eqInefi = co2eqVacasVacias + co2eqVaqTarde;
  const pctInefi        = totalCO2eqBase > 0
    ? +((totalCO2eqInefi / totalCO2eqBase) * 100).toFixed(1) : 0;

  const inefi = {
    vacasVacias,
    prenezPct:          prenez,
    ch4VacaVaciaAnual:  catVaca ? Math.round(catVaca.ch4AnoBase / Math.max(1, nVacas)) : 55,
    co2eqVacasVacias,
    demora,
    fracInefiVaq:       +fracInefiVaq.toFixed(2),
    co2eqVaqTarde,
    totalCO2eqInefi,
    pctInefi,
    edadEntoreReal,
    // Nota: estos valores son SUBCONJUNTO del total, no adicionales
    esSubconjunto: true,
  };

  // ── BALANCE CO₂ PASTIZAL ──────────────────────────────────────────────────────
  const co2Pastizal = calcCO2PastizalAnual(
    form.vegetacion || "Pastizal natural NEA/Chaco",
    ndvi, supHa, cargaEV, precipAnual, t_media
  );

  // ── BALANCE NETO CORRECTO: solo CH4 total - secuestro pastizal ────────────────
  // Las ineficiencias NO se suman al balance neto — ya están en el CH4 total.
  // El balance neto es una ecuación de flujo físico, no de eficiencia económica.
  const balanceNetoBase = totalCO2eqBase - co2Pastizal.CO2_total;
  const balanceNetoSupl = totalCO2eqSupl - co2Pastizal.CO2_total;

  // ── INTENSIDAD: la métrica más honesta ────────────────────────────────────────
  // kg CO2eq / kg PV producido = emisiones totales / producción real de carne
  // Este número ya captura la ineficiencia reproductiva implícitamente:
  //   si la preñez baja, producís menos PV con las mismas emisiones → intensidad sube
  const ternerosAnual  = Math.round(nVacas * prenez / 100);
  const pvTernero      = Math.round(pvVaca * 0.45);
  const kgPVProducido  = ternerosAnual * pvTernero;
  const intensBase     = kgPVProducido > 0
    ? +(totalCO2eqBase / kgPVProducido).toFixed(1) : null;
  const intensSupl     = kgPVProducido > 0
    ? +(totalCO2eqSupl / kgPVProducido).toFixed(1) : null;
  const intensBase_star = kgPVProducido > 0
    ? +(totalCO2eqBaseSTAR / kgPVProducido).toFixed(1) : null;

  return {
    catData,
    inefi,
    co2Pastizal,
    digMensual,
    totalCH4Base, totalCH4Supl,
    totalCO2eqBase, totalCO2eqSupl,
    totalCO2eqBaseSTAR, totalCO2eqSuplSTAR,
    balanceNetoBase, balanceNetoSupl,
    ternerosAnual, kgPVProducido,
    intensBase, intensSupl, intensBase_star,
    dig: digPromAnual, ndvi, supHa, cargaEV, precipAnual, t_media,
    edadEntoreReal,
    reduccionCO2eq: totalCO2eqBase - totalCO2eqSupl,
    pctReduccion:   totalCO2eqBase > 0
      ? +((1 - totalCO2eqSupl / totalCO2eqBase) * 100).toFixed(1) : 0,
  };
}

// ══════════════════════════════════════════════════════════════════
// COMPONENTE VISUAL — Panel GEI
// ══════════════════════════════════════════════════════════════════
function PanelGEI({ form, motor, tray, sat }) {
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
      {/* Comparación clave: CH4/kg MS sin vs con */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:14, marginBottom:12 }}>
        <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, letterSpacing:1, marginBottom:10 }}>
          EFICIENCIA DE EMISIÓN — g CH₄ por kg MS consumida
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
          Mayor dig → menor Ym (fracción metanogénica) → menor CH₄/kg MS · Gere et al. 2024; IPCC Tier 2
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
              Con supl: {gei.totalCH4Supl.toLocaleString()} kg (−{(gei.totalCH4Base - gei.totalCH4Supl).toLocaleString()} kg)
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
          BALANCE NETO SISTEMA (CH₄ rodeo − secuestro pastizal)
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
            Con suplementación: −{gei.pctReduccion}% emisiones · {(gei.reduccionCO2eq/1000).toFixed(1)} t CO₂eq/año
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
              <div style={{ fontFamily:T.font, fontSize:8, color:G.ch4, letterSpacing:1, marginBottom:4 }}>SIN RECOMENDACIÓN</div>
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
                {c.suplDosis > 0 ? "CON SUPLEMENTACIÓN" : "SIN SUPL. CARGADO"}
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
              Ym {GEI_YM(c.digPromAnual).toFixed(3)} → {GEI_YM(c.digConSProm).toFixed(3)} · Gere et al. 2024; Beauchemin et al. 2009
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
            <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginBottom:3 }}>PRECIPITACIÓN ANUAL</div>
            <div style={{ fontFamily:T.font, fontSize:22, fontWeight:700, color:G.co2 }}>{Math.round(gei.precipAnual)} mm</div>
            <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>Temperatura media: {gei.t_media}°C</div>
          </div>
        </div>

        <div style={{ background:T.card2, border:`1px solid ${T.border}`, borderRadius:12, padding:14, marginBottom:10 }}>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, letterSpacing:1, marginBottom:8 }}>
            PRODUCTIVIDAD PRIMARIA NETA (NPP)
          </div>
          {[
            ["Vegetación", form.vegetacion || "Pastizal natural NEA/Chaco", T.text],
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
          ⚠ Bosque nativo: mayor secuestro, pero la conversión a pasturas lo convierte en fuente neta permanente.
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
            Mejorar preñez de {inf.prenezPct}% a 70%: −{Math.round(inf.vacasVacias * 0.3 * inf.ch4VacaVaciaAnual * GWP_CH4 / 1000)} t CO₂eq/año.
            Wang et al. 2023: la ineficiencia reproductiva es la mayor fuente de emisiones "no productivas" en sistemas extensivos.
          </div>
        </div>

        {/* Vaquillona con entore tardío */}
        <div style={{ background:`${G.ch4}08`, border:`1px solid ${G.ch4}30`, borderRadius:12, padding:14, marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ fontFamily:T.font, fontSize:11, color:G.ch4, fontWeight:700 }}>
              🐮 Vaquillona entore tardío — meses improductivos
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
            <span style={{ fontFamily:T.font, fontSize:8, color:G.mejor }}>● {(100 - inf.pctInefi).toFixed(1)}% productivo</span>
            <span style={{ fontFamily:T.font, fontSize:8, color:G.inefi }}>● {inf.pctInefi}% sin retorno económico</span>
          </div>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, lineHeight:1.6 }}>
            ⚠ Estos {(inf.totalCO2eqInefi/1000).toFixed(1)} t CO₂eq son una <em>partición</em> del total de {(gei.totalCO2eqBase/1000).toFixed(0)} t —
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
          nota={gei.pctReduccion > 0 ? `Con supl: −${gei.pctReduccion}%` : null}
        />
        <KpiGEI
          label="CO₂ PASTIZAL"
          valor={`${gei.co2Pastizal.CO2_total > 0 ? "+" : ""}${(gei.co2Pastizal.CO2_total/1000).toFixed(1)}`}
          unit="t/año"
          color={gei.co2Pastizal.CO2_total > 0 ? G.co2 : G.inefi}
          sub={gei.co2Pastizal.CO2_total > 0 ? "secuestro neto" : "fuente neta"}
          nota={`NDVI ${gei.ndvi.toFixed(2)} · ${gei.supHa} ha`}
        />
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:4, marginBottom:12 }}>
        {[
          ["resumen",     "📊 Resumen"],
          ["categorias",  "🐄 Categorías"],
          ["pastizal",    "🌿 Pastizal"],
          ["inefi",       "⚠ Inefic."],
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
        Gere et al. 2024 (Animals) · Soussana et al. (Agric.Ecosyst.Env.) · IPCC 2019 Tier 2 · FAO-GLEAM 2.0 · 
        GWP100 CH₄ = 28 (IPCC AR6, fossil methane equivalent)
      </div>
    </div>
  );
}


function GraficoBalance({ form, sat, cadena, tray, motor }) {
  const [mes, setMes] = React.useState(null);         // mes seleccionado (null = año completo)
  const [capa, setCapa] = React.useState("rodeo");    // rodeo | categorias | correctores

  const MESES_C = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const MESES_F = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  // ── Extraer del motor (fuente única de verdad) ────────────────
  const bm       = motor?.balanceMensual;
  const nVacas   = motor?.nVacas  || 0;
  const nToros   = motor?.nToros  || 0;
  const nV2s     = motor?.nV2s    || 0;
  const nVaq2    = motor?.nVaq2   || 0;
  const nVaq1    = motor?.nVaq1   || 0;
  const pvVaca   = parseFloat(form?.pvVacaAdulta) || 320;
  const factC    = motor?.factorCarga  || 1;
  const factA    = motor?.factorAgua   || 1;
  const verdeoMcal  = motor?.verdeoAporteMcalMes || 0;
  const verdeoMesI  = motor?.verdeoMesInicio ?? 7;
  const tieneVerdeo = form?.tieneVerdeo === "si" && verdeoMcal > 0;

  if (!bm) return (
    <div style={{ padding:24, textAlign:"center", fontFamily:T.font, fontSize:11, color:T.textFaint }}>
      Completá los datos del rodeo para ver el balance energético
    </div>
  );

  // ── Construir datos por categoría ────────────────────────────
  // Cada mes: oferta pasto/cabeza vs requerimiento/cabeza, por categoría
  // Fuente: balanceMensual ya tiene todo calculado con estado fisiológico real
  const datos = bm.map((m, i) => {
    const ofBase    = nVacas + nToros + nV2s + nVaq2 + nVaq1 > 0
      ? m.ofPastoTotal / Math.max(1, nVacas + nToros + nV2s + nVaq2 + nVaq1) : 0;

    // Oferta real per cápita (Mcal/animal/día) para cada categoría
    // El pasto se distribuye proporcionalmente al requerimiento (competencia)
    const totalReq  = m.demanda || 1;
    const ofVaca  = totalReq > 0 ? (m.ofPastoTotal * (m.dVacas / totalReq)) / Math.max(1, nVacas)  : 0;
    const ofToro  = totalReq > 0 ? (m.ofPastoTotal * (m.dToros / totalReq)) / Math.max(1, nToros)  : 0;
    const ofV2s   = totalReq > 0 ? (m.ofPastoTotal * (m.dV2s   / totalReq)) / Math.max(1, nV2s)    : 0;
    const ofVaq2  = totalReq > 0 ? (m.ofPastoTotal * (m.dVaq2  / totalReq)) / Math.max(1, nVaq2)   : 0;
    const ofVaq1  = totalReq > 0 ? (m.ofPastoTotal * (m.dVaq1  / totalReq)) / Math.max(1, nVaq1)   : 0;

    // Requerimiento por cabeza
    const rqVaca  = nVacas > 0 ? m.dVacas / nVacas : 0;
    const rqToro  = nToros > 0 ? m.dToros / nToros : 0;
    const rqV2s   = nV2s   > 0 ? m.dV2s   / nV2s   : 0;
    const rqVaq2  = nVaq2  > 0 ? m.dVaq2  / nVaq2  : 0;
    const rqVaq1  = nVaq1  > 0 ? m.dVaq1  / nVaq1  : 0;

    // Gap por cabeza (negativo = déficit)
    const gVaca  = nVacas > 0 ? +(ofVaca  - rqVaca).toFixed(1)  : 0;
    const gToro  = nToros > 0 ? +(ofToro  - rqToro).toFixed(1)  : 0;
    const gV2s   = nV2s   > 0 ? +(ofV2s   - rqV2s).toFixed(1)   : 0;
    const gVaq2  = nVaq2  > 0 ? +(ofVaq2  - rqVaq2).toFixed(1)  : 0;
    const gVaq1  = nVaq1  > 0 ? +(ofVaq1  - rqVaq1).toFixed(1)  : 0;

    // Suplemento por categoría (Mcal/animal/día)
    const sVaca  = 0; // vacas: herramienta = destete
    const sToro  = nToros > 0 ? +(mcalSuplemento(form?.supl_toros, parseFloat(form?.dosis_toros)||0)).toFixed(1) : 0;
    const sV2s   = nV2s   > 0 ? +(mcalSuplemento(form?.supl_v2s,   parseFloat(form?.dosis_v2s)  ||0)).toFixed(1) : 0;
    const sVaq2  = nVaq2  > 0 ? +(mcalSuplemento(form?.supl_vaq2,  parseFloat(form?.dosis_vaq2) ||0)).toFixed(1) : 0;
    const sVaq1  = nVaq1  > 0 ? +(mcalSuplemento(form?.supl_vaq1,  parseFloat(form?.dosis_vaq1) ||0)).toFixed(1) : 0;

    // Verdeo: aplica en los meses definidos, a la categoría destino
    const hayVerdeo = tieneVerdeo && i >= verdeoMesI && i <= verdeoMesI + 2;
    const vVaq1   = hayVerdeo && form?.verdeoDestinoVaq === "si" && nVaq1 > 0
      ? +(verdeoMcal / nVaq1).toFixed(1) : 0;
    // Si verdeo no va a vaq1 exclusivo, distribuye al rodeo
    const vRodeo  = hayVerdeo && form?.verdeoDestinoVaq !== "si"
      ? +(verdeoMcal / Math.max(1, nVacas + nToros + nV2s + nVaq2 + nVaq1)).toFixed(1) : 0;

    // Balance NETO por cabeza DESPUÉS de correctores
    const bnVaca  = nVacas > 0 ? +(gVaca  + sVaca  + (vRodeo || 0)).toFixed(1) : 0;
    const bnToro  = nToros > 0 ? +(gToro  + sToro  + (vRodeo || 0)).toFixed(1) : 0;
    const bnV2s   = nV2s   > 0 ? +(gV2s   + sV2s   + (vRodeo || 0)).toFixed(1) : 0;
    const bnVaq2  = nVaq2  > 0 ? +(gVaq2  + sVaq2  + (hayVerdeo ? (vVaq1 || vRodeo) : 0)).toFixed(1) : 0;
    const bnVaq1  = nVaq1  > 0 ? +(gVaq1  + sVaq1  + vVaq1 + (vRodeo || 0)).toFixed(1) : 0;

    return {
      mes: MESES_C[i], i,
      t: m.t,
      fenol: m.fenol,
      pbPas: m.pbPas,
      // Totales rodeo
      ofPasto: m.ofPastoTotal,
      ccAporte: m.ccAporte,
      suplTotal: m.suplAporte,
      verdeoTotal: m.verdeoAporte,
      demanda: m.demanda,
      balance: m.balance,
      deficit: m.deficit,
      // Por categoría — requerimiento
      rqVaca:  +rqVaca.toFixed(1),  rqToro:  +rqToro.toFixed(1),
      rqV2s:   +rqV2s.toFixed(1),   rqVaq2:  +rqVaq2.toFixed(1),
      rqVaq1:  +rqVaq1.toFixed(1),
      // Por categoría — oferta pasto disponible
      ofVaca:  +ofVaca.toFixed(1),   ofToro:  +ofToro.toFixed(1),
      ofV2s:   +ofV2s.toFixed(1),    ofVaq2:  +ofVaq2.toFixed(1),
      ofVaq1:  +ofVaq1.toFixed(1),
      // Gap puro (sin correctores)
      gVaca, gToro, gV2s, gVaq2, gVaq1,
      // Suplemento por categoría
      sVaca, sToro, sV2s, sVaq2, sVaq1,
      // Verdeo
      vVaq1, vRodeo,
      // Balance neto (con correctores)
      bnVaca, bnToro, bnV2s, bnVaq2, bnVaq1,
      // Fisiología
      estadoVaca: m.estadoVaca,
      esParto: m.esParto, esServIni: m.esServIni,
    };
  });

  // ── Mes seleccionado o promedio ───────────────────────────────
  const dMes = mes !== null ? datos[mes] : null;

  // ── Paleta de categorías ──────────────────────────────────────
  const CAT = [
    { id:"vaca",  label:"Vacas",        color:"#e8a030", n:nVacas, gKey:"gVaca",  bnKey:"bnVaca",  rqKey:"rqVaca",  ofKey:"ofVaca",  sKey:"sVaca",  nota:"Herramienta: destete" },
    { id:"v2s",   label:"V 2° serv.",   color:"#e05530", n:nV2s,   gKey:"gV2s",   bnKey:"bnV2s",   rqKey:"rqV2s",   ofKey:"ofV2s",   sKey:"sV2s"  },
    { id:"toro",  label:"Toros",        color:"#9b59b6", n:nToros, gKey:"gToro",  bnKey:"bnToro",  rqKey:"rqToro",  ofKey:"ofToro",  sKey:"sToro" },
    { id:"vaq2",  label:"Vaq 2° inv.",  color:"#4a9fd4", n:nVaq2,  gKey:"gVaq2",  bnKey:"bnVaq2",  rqKey:"rqVaq2",  ofKey:"ofVaq2",  sKey:"sVaq2" },
    { id:"vaq1",  label:"Vaq 1° inv.",  color:"#7ec850", n:nVaq1,  gKey:"gVaq1",  bnKey:"bnVaq1",  rqKey:"rqVaq1",  ofKey:"ofVaq1",  sKey:"sVaq1" },
  ].filter(c => c.n > 0);

  // ── Mes crítico para highlight ────────────────────────────────
  const peorMes = datos.reduce((a, b) => b.balance < a.balance ? b : a);
  const mesesDef = datos.filter(d => d.deficit);

  // ══════════════════════════════════════════════════════════════
  // SUB-COMPONENTES
  // ══════════════════════════════════════════════════════════════

  // Barra horizontal de gap: muestra oferta vs req
  const GapBar = ({ of, rq, supl, verdeo, color, label, n }) => {
    if (!n) return null;
    const pct   = rq > 0 ? Math.min(1, of / rq) : 1;
    const pctS  = rq > 0 && supl > 0 ? Math.min(1 - pct, supl / rq) : 0;
    const pctV  = rq > 0 && verdeo > 0 ? Math.min(1 - pct - pctS, verdeo / rq) : 0;
    const gap   = of - rq;
    const cubierto = pct + pctS + pctV;
    return (
      <div style={{ marginBottom:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
          <span style={{ fontFamily:T.font, fontSize:9, color }}>{label}</span>
          <span style={{ fontFamily:T.font, fontSize:9, color: gap >= 0 ? T.green : T.red, fontWeight:700 }}>
            {gap >= 0 ? "+" : ""}{gap.toFixed(1)} Mcal/cab/d
          </span>
        </div>
        <div style={{ height:10, borderRadius:5, background:`${T.border}`, overflow:"hidden", position:"relative" }}>
          {/* Pasto */}
          <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${pct*100}%`, background:color, borderRadius:"5px 0 0 5px" }} />
          {/* Suplemento */}
          {pctS > 0 && (
            <div style={{ position:"absolute", top:0, bottom:0, left:`${pct*100}%`, width:`${pctS*100}%`, background:"#4a9fd4" }} />
          )}
          {/* Verdeo */}
          {pctV > 0 && (
            <div style={{ position:"absolute", top:0, bottom:0, left:`${(pct+pctS)*100}%`, width:`${pctV*100}%`, background:"#7ec850", opacity:0.7 }} />
          )}
          {/* Línea de requerimiento */}
          <div style={{ position:"absolute", top:0, bottom:0, left:"100%", transform:"translateX(-1px)", width:2, background:T.red, opacity:0.6 }} />
        </div>
        <div style={{ display:"flex", gap:8, marginTop:2 }}>
          <span style={{ fontFamily:T.font, fontSize:7, color:T.textFaint }}>Pasto {(pct*100).toFixed(0)}%</span>
          {pctS > 0 && <span style={{ fontFamily:T.font, fontSize:7, color:"#4a9fd4" }}>+ supl {(pctS*100).toFixed(0)}%</span>}
          {pctV > 0 && <span style={{ fontFamily:T.font, fontSize:7, color:"#7ec850" }}>+ verdeo {(pctV*100).toFixed(0)}%</span>}
          <span style={{ fontFamily:T.font, fontSize:7, color:T.textFaint, marginLeft:"auto" }}>Req: {rq.toFixed(1)} Mcal</span>
        </div>
      </div>
    );
  };

  // Columna mensual del timeline
  const ColMes = ({ d, activo, onClick }) => {
    const isCrit = d.i === peorMes.i;
    return (
      <div onClick={onClick} style={{
        flex:1, cursor:"pointer", minWidth:0,
        borderRadius:6, padding:"4px 2px",
        background: activo ? `${T.green}15` : isCrit ? `${T.red}08` : "transparent",
        border: activo ? `1px solid ${T.green}40` : `1px solid transparent`,
        transition:"all .15s",
      }}>
        {/* Mini barras apiladas por categoría */}
        <div style={{ height:40, display:"flex", flexDirection:"column-reverse", gap:1 }}>
          {CAT.map(c => {
            const gap = d[c.bnKey];
            if (gap === 0) return null;
            const h = Math.min(36, Math.max(2, Math.abs(gap) * 2.5));
            return (
              <div key={c.id} style={{
                height:h, borderRadius:2,
                background: gap >= 0 ? c.color : T.red,
                opacity: gap >= 0 ? 0.75 : 0.9,
              }} />
            );
          })}
        </div>
        <div style={{ textAlign:"center", fontFamily:T.font, fontSize:7, color: d.deficit ? T.red : T.textFaint, marginTop:2 }}>
          {d.mes}
        </div>
        {(d.esParto || d.esServIni) && (
          <div style={{ textAlign:"center", fontSize:6, marginTop:1 }}>{d.esParto ? "🐄" : "🐂"}</div>
        )}
      </div>
    );
  };

  // Panel de detalle del mes seleccionado
  const DetalleMes = ({ d }) => {
    // Correctores que aplican este mes
    const haySuplMes = CAT.some(c => d[c.sKey] > 0);
    const hayVerdeoMes = d.vVaq1 > 0 || d.vRodeo > 0;

    return (
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:14, marginTop:10 }}>
        {/* Header mes */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div>
            <div style={{ fontFamily:T.font, fontSize:13, color:T.text, fontWeight:700 }}>{MESES_F[d.i]}</div>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, marginTop:2 }}>
              {d.t}°C · PB pasto {d.pbPas}% · {d.estadoVaca}
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontFamily:T.font, fontSize:18, fontWeight:700,
              color: d.balance >= 0 ? T.green : T.red }}>
              {d.balance >= 0 ? "+" : ""}{d.balance.toLocaleString()} Mcal
            </div>
            <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>balance neto rodeo/día</div>
          </div>
        </div>

        {/* Barras por categoría */}
        <div style={{ marginBottom:10 }}>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, letterSpacing:1, marginBottom:8 }}>
            OFERTA vs REQUERIMIENTO — Mcal/cabeza/día
          </div>
          {CAT.map(c => (
            <GapBar key={c.id}
              of={d[c.ofKey]}
              rq={d[c.rqKey]}
              supl={d[c.sKey]}
              verdeo={c.id === "vaq1" ? d.vVaq1 : d.vRodeo}
              color={c.color}
              label={c.label + (c.nota ? ` — ${c.nota}` : "")}
              n={c.n}
            />
          ))}
        </div>

        {/* Leyenda correctores */}
        {(haySuplMes || hayVerdeoMes) && (
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", padding:"6px 10px",
            background:`rgba(255,255,255,.03)`, borderRadius:8, border:`1px solid ${T.border}` }}>
            <span style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>Correctores activos este mes:</span>
            {haySuplMes && <span style={{ fontFamily:T.font, fontSize:8, color:"#4a9fd4" }}>● Suplemento</span>}
            {hayVerdeoMes && <span style={{ fontFamily:T.font, fontSize:8, color:"#7ec850" }}>● Verdeo</span>}
          </div>
        )}

        {/* Alerta vaca: recordatorio herramienta */}
        {d.gVaca < -1 && nVacas > 0 && (
          <div style={{ marginTop:8, padding:"6px 10px", background:`${T.amber}08`,
            border:`1px solid ${T.amber}25`, borderRadius:8,
            fontFamily:T.font, fontSize:9, color:T.amber }}>
            🔶 Vacas: déficit {Math.abs(d.gVaca).toFixed(1)} Mcal/cab. Herramienta = destete precoz, no suplemento con ternero al pie.
          </div>
        )}
      </div>
    );
  };

  // ── Vista del año completo: gráfico de área apilado ──────────
  const VistaAnual = () => {
    // Para el gráfico Recharts: datos con oferta+correctores vs requerimiento por categoría
    const dataChart = datos.map(d => ({
      mes: d.mes,
      // Oferta base del pasto (separada de correctores)
      pastoPuro:  +(d.ofPasto / Math.max(1, nVacas+nToros+nV2s+nVaq2+nVaq1)).toFixed(1),
      // Correctores
      supl:       CAT.reduce((s,c) => s + d[c.sKey], 0),
      verdeo:     d.verdeoTotal > 0 ? +(d.verdeoTotal / Math.max(1,nVacas+nToros+nV2s+nVaq2+nVaq1)).toFixed(1) : 0,
      // CC movilizada — esto es el costo, no un recurso: lo mostramos diferente
      ccCosto:    d.ccAporte > 0 ? +(d.ccAporte / Math.max(1,nVacas)).toFixed(1) : 0,
      // Requerimiento promedio ponderado
      reqProm:    +(d.demanda / Math.max(1,nVacas+nToros+nV2s+nVaq2+nVaq1)).toFixed(1),
    }));

    return (
      <div style={{ background:T.card2, borderRadius:10, padding:14, border:`1px solid ${T.border}` }}>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, letterSpacing:1, marginBottom:4 }}>
          MCAL/ANIMAL EQUIVALENTE/DÍA — pasto + correctores vs requerimiento
        </div>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginBottom:10 }}>
          La franja naranja es CC movilizada — la vaca financiando el déficit con sus reservas
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <ComposedChart data={dataChart} margin={{ top:4, right:8, left:-18, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
            <XAxis dataKey="mes" tick={{ fill:T.textFaint, fontSize:8 }} />
            <YAxis tick={{ fill:T.textFaint, fontSize:7 }} />
            <Tooltip
              contentStyle={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontFamily:T.font, fontSize:10 }}
              formatter={(v, n) => [v + " Mcal", n]}
            />
            {/* Pasto puro — base verde */}
            <Area type="monotone" dataKey="pastoPuro" name="Pasto" stackId="oferta"
              fill="#7ec850" fillOpacity={0.55} stroke="#7ec850" strokeWidth={1} />
            {/* Suplemento — azul apilado */}
            <Area type="monotone" dataKey="supl" name="Suplemento" stackId="oferta"
              fill="#4a9fd4" fillOpacity={0.65} stroke="#4a9fd4" strokeWidth={1} />
            {/* Verdeo — verde claro apilado */}
            {tieneVerdeo && (
              <Area type="monotone" dataKey="verdeo" name="Verdeo" stackId="oferta"
                fill="#a8e06a" fillOpacity={0.7} stroke="#a8e06a" strokeWidth={1} />
            )}
            {/* CC movilizada — naranja, SEPARADA (no stackId) — es el costo, no la oferta */}
            <Area type="monotone" dataKey="ccCosto" name="CC movilizada (costo)"
              fill="#e8a030" fillOpacity={0.3} stroke="#e8a030" strokeWidth={1.5} strokeDasharray="4 2" />
            {/* Requerimiento — línea roja prominente */}
            <Line type="monotone" dataKey="reqProm" name="Requerimiento" 
              stroke={T.red} strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // ── Vista por categoría: líneas de balance neto/cabeza ────────
  const VistaCategorias = () => {
    const dataChart = datos.map(d => {
      const row = { mes: d.mes };
      CAT.forEach(c => { row[c.id] = d[c.bnKey]; });
      return row;
    });

    return (
      <div style={{ background:T.card2, borderRadius:10, padding:14, border:`1px solid ${T.border}` }}>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, letterSpacing:1, marginBottom:4 }}>
          BALANCE NETO POR CATEGORÍA — Mcal/cabeza/día (con todos los correctores)
        </div>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginBottom:10 }}>
          Cero = requerimiento cubierto exacto. Negativo = déficit que la vaca/vaquillona paga con CC o GDP.
        </div>
        <ResponsiveContainer width="100%" height={190}>
          <ComposedChart data={dataChart} margin={{ top:4, right:8, left:-18, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
            <XAxis dataKey="mes" tick={{ fill:T.textFaint, fontSize:8 }} />
            <YAxis tick={{ fill:T.textFaint, fontSize:7 }} />
            <ReferenceLine y={0} stroke={T.red} strokeWidth={1.5} strokeOpacity={0.5} />
            <Tooltip
              contentStyle={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontFamily:T.font, fontSize:10 }}
              formatter={(v, n) => [(v > 0 ? "+" : "") + v + " Mcal/cab", n]}
            />
            <Legend wrapperStyle={{ fontFamily:T.font, fontSize:8, color:T.textDim }} />
            {CAT.map(c => (
              <Line key={c.id} type="monotone" dataKey={c.id} name={c.label}
                stroke={c.color} strokeWidth={2} dot={false} />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginTop:6 }}>
          ↑ Línea roja punteada = cero. Por encima = superávit. Por debajo = la categoría entra en déficit ese mes.
        </div>
      </div>
    );
  };

  // ── Vista correctores: qué resuelve cada uno ─────────────────
  const VistaCorrectores = () => {
    // Para cada mes con déficit: mostrar gap original vs qué cierra cada corrector
    const defData = datos.filter(d => d.deficit || (tieneVerdeo && d.i >= verdeoMesI && d.i <= verdeoMesI+2));
    if (defData.length === 0) return (
      <div style={{ padding:20, textAlign:"center", fontFamily:T.font, fontSize:11, color:T.green }}>
        ✅ Sin déficit — todos los meses el rodeo cubre sus requerimientos
      </div>
    );

    return (
      <div>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, letterSpacing:1, marginBottom:10 }}>
          ACCIÓN DE CORRECTORES EN MESES RELEVANTES
        </div>
        {datos.map((d, i) => {
          const hayCorrector = CAT.some(c => d[c.sKey] > 0) || d.vVaq1 > 0 || d.vRodeo > 0;
          if (!d.deficit && !hayCorrector) return null;

          // Balance sin correctores
          const defSinCorrec = d.ofPasto - d.demanda;
          // Balance con suplemento
          const conSupl      = defSinCorrec + d.suplTotal;
          // Balance con suplemento + verdeo
          const conSuplVerd  = conSupl + d.verdeoTotal;
          // Balance final (incluye CC movilizada si aplica)
          const balFinal     = d.balance;

          const barW = (v, max) => `${Math.min(100, Math.max(0, (v + Math.abs(Math.min(0,defSinCorrec))) / (Math.abs(defSinCorrec) + 1) * 100)).toFixed(0)}%`;

          return (
            <div key={i} style={{ marginBottom:10, background:T.card2,
              border:`1px solid ${d.deficit ? T.red+"30" : T.border}`, borderRadius:10, padding:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontFamily:T.font, fontSize:11, color:T.text, fontWeight:600 }}>{MESES_F[i]}</span>
                <span style={{ fontFamily:T.font, fontSize:9, color:T.textFaint }}>{d.t}°C · PB {d.pbPas}%</span>
              </div>

              {/* Cascada de correctores */}
              {[
                { label:"Solo pasto",              val:defSinCorrec, color:T.textFaint },
                { label:"+ Suplemento",            val:conSupl,      color:"#4a9fd4", show: d.suplTotal > 0 },
                { label:"+ Verdeo",                val:conSuplVerd,  color:"#7ec850", show: d.verdeoTotal > 0 },
                { label:"+ CC movilizada (vaca)",  val:balFinal,     color:"#e8a030", show: d.ccAporte > 0, nota:"— costo pagado por la vaca" },
              ].filter(r => r.show !== false).map((r, ri) => {
                const pct = Math.min(100, Math.max(0,
                  ((r.val - defSinCorrec) / (Math.abs(defSinCorrec) || 1)) * 100
                ));
                return (
                  <div key={ri} style={{ marginBottom:6 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                      <span style={{ fontFamily:T.font, fontSize:9, color:T.textFaint }}>
                        {r.label}{r.nota && <span style={{color:T.amber}}>{r.nota}</span>}
                      </span>
                      <span style={{ fontFamily:T.font, fontSize:10, fontWeight:700,
                        color: r.val >= 0 ? T.green : T.red }}>
                        {r.val >= 0 ? "+" : ""}{r.val.toLocaleString()} Mcal
                      </span>
                    </div>
                    <div style={{ height:6, borderRadius:3, background:T.border, overflow:"hidden" }}>
                      <div style={{
                        height:"100%",
                        width: r.val >= 0 ? "100%" : `${Math.max(2, (1 - Math.abs(r.val)/Math.abs(defSinCorrec||1))*100)}%`,
                        background: r.val >= 0 ? r.color : T.red,
                        borderRadius:3, opacity: r.val >= 0 ? 0.8 : 0.5,
                        transition:"width .3s",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ══════════════════════════════════════════════════════════════
  return (
    <div>
      {/* ── KPIs ──────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
        <div style={{ background: mesesDef.length === 0 ? `${T.green}08` : `${T.red}08`,
          border:`1px solid ${mesesDef.length === 0 ? T.green : T.red}25`,
          borderRadius:10, padding:"8px 6px", textAlign:"center" }}>
          <div style={{ fontFamily:T.font, fontSize:22, fontWeight:700,
            color: mesesDef.length === 0 ? T.green : T.red }}>{mesesDef.length}</div>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>meses con déficit</div>
        </div>
        <div style={{ background:`${T.card2}`, border:`1px solid ${T.border}`,
          borderRadius:10, padding:"8px 6px", textAlign:"center" }}>
          <div style={{ fontFamily:T.font, fontSize:22, fontWeight:700,
            color: peorMes.balance < -500 ? T.red : T.amber }}>
            {peorMes.balance < 0 ? peorMes.balance.toLocaleString() : "0"}
          </div>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>Mcal/d peor mes ({peorMes.mes})</div>
        </div>
        <div style={{ background: tieneVerdeo ? `${T.green}08` : `${T.card2}`,
          border:`1px solid ${tieneVerdeo ? T.green : T.border}25`,
          borderRadius:10, padding:"8px 6px", textAlign:"center" }}>
          <div style={{ fontFamily:T.font, fontSize:22, fontWeight:700,
            color: tieneVerdeo ? T.green : T.textFaint }}>
            {tieneVerdeo ? "+" + (verdeoMcal * 3 / 1000).toFixed(0) + "k" : "—"}
          </div>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>
            {tieneVerdeo ? `Mcal verdeo (${MESES_C[verdeoMesI]}–${MESES_C[Math.min(11,verdeoMesI+2)]})` : "Sin verdeo cargado"}
          </div>
        </div>
      </div>

      {/* ── Tabs de vista ───────────────────────────────────────── */}
      <div style={{ display:"flex", gap:4, marginBottom:10 }}>
        {[
          ["rodeo",       "⚡ Rodeo"],
          ["categorias",  "🐄 Categorías"],
          ["correctores", "🔧 Correctores"],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setCapa(k)} style={{
            flex:1, padding:"7px 4px", borderRadius:8, cursor:"pointer",
            fontFamily:T.font, fontSize:9,
            background: capa === k ? `${T.green}20` : "transparent",
            border:`1px solid ${capa === k ? T.green : T.border}`,
            color: capa === k ? T.green : T.textDim,
          }}>{l}</button>
        ))}
      </div>

      {/* ── Timeline mensual (siempre visible) ──────────────────── */}
      <div style={{ background:T.card2, borderRadius:10, padding:"10px 8px",
        border:`1px solid ${T.border}`, marginBottom:10 }}>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, marginBottom:6 }}>
          Tocá un mes para ver el detalle por categoría ↓
        </div>
        <div style={{ display:"flex", gap:2 }}>
          {datos.map((d, i) => (
            <ColMes key={i} d={d} activo={mes === i}
              onClick={() => setMes(mes === i ? null : i)} />
          ))}
        </div>
      </div>

      {/* ── Detalle mes seleccionado ─────────────────────────────── */}
      {mes !== null && <DetalleMes d={datos[mes]} />}

      {/* ── Gráfico según capa ───────────────────────────────────── */}
      <div style={{ marginTop:10 }}>
        {capa === "rodeo"       && <VistaAnual />}
        {capa === "categorias"  && <VistaCategorias />}
        {capa === "correctores" && <VistaCorrectores />}
      </div>

      {/* ── Nota epistemológica ──────────────────────────────────── */}
      <div style={{ marginTop:10, padding:"6px 10px", background:`rgba(255,255,255,.02)`,
        border:`1px solid ${T.border}`, borderRadius:8 }}>
        <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint, lineHeight:1.6 }}>
          🔬 Oferta distribuida por requerimiento relativo · CC movilizada = costo pagado por la vaca, no recurso disponible · 
          Vacas: herramienta de corrección = destete (libera 6–8 Mcal/día), no suplemento con ternero al pie · 
          Vaquillona/V2S/Toros: suplemento proteico activa rumen (Detmann/NASSEM 2010)
        </div>
      </div>
    </div>
  );
}


// ─── TARJETA ESCENARIO ────────────────────────────────────────────
function TarjetaEscenario({ idx, esc, color, activo, onToggle }) {
  const ESC_LABELS = ["Base", "Escenario A", "Escenario B"];
  return (
    <div onClick={onToggle} style={{
      flex:1, padding:"10px 8px", borderRadius:10, cursor:"pointer", textAlign:"center",
      background: activo ? color+"20" : "transparent",
      border:`1px solid ${activo ? color : "#333"}`,
      opacity: activo ? 1 : 0.5,
    }}>
      <div style={{ fontFamily:"monospace", fontSize:9, color, letterSpacing:1, marginBottom:2 }}>{ESC_LABELS[idx]}</div>
      <div style={{ fontFamily:"monospace", fontSize:11, color, fontWeight:700 }}>
        {esc.tray?.ccServ ?? "—"}
      </div>
      <div style={{ fontFamily:"sans-serif", fontSize:9, color:"#888", marginTop:2 }}>CC servicio</div>
    </div>
  );
}

// ─── SIMULADOR ESCENARIOS ─────────────────────────────────────────
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
    destTrad:parseFloat(form.destTrad)||0, destAntic:parseFloat(form.destAntic)||0, destHiper:parseFloat(form.destHiper)||100,
  });
  const [escB, setEscB] = useState({
    supl1:"Expeller soja", dosis1:0.5, supl2:"Expeller soja", dosis2:0.8, supl3:"", dosis3:0,
    destTrad:0, destAntic:0, destHiper:100,
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

// ─── RENDER INFORME ───────────────────────────────────────────────
const SEC_EMOJIS = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣"];
const SEC_TITLES = ["Diagnóstico Ambiental","Diagnóstico por Categoría","Destete y Proyección CC","Balance Oferta vs Demanda","Recomendaciones"];

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
          <details key={i} open={i === 0 || i === 4} style={{ marginBottom:8 }}>
            <summary style={{ background:s.bg, border:`1px solid ${s.border}`, borderRadius:12, padding:"12px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:10, userSelect:"none", listStyle:"none" }}>
              <span style={{ fontSize:18 }}>{SEC_EMOJIS[i]}</span>
              <span style={{ fontFamily:T.fontSans, fontSize:13, color:T.text, fontWeight:600, flex:1 }}>{SEC_TITLES[i]}</span>
              <div style={{ width:8, height:8, borderRadius:"50%", background:s.dot }} />
            </summary>
            <div
              style={{ background:"rgba(0,0,0,.25)", border:`1px solid ${T.border}`, borderTop:"none", borderRadius:"0 0 12px 12px", padding:14, fontFamily:T.fontSans, fontSize:13, color:T.text, lineHeight:1.75 }}
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
// ═══════════════════════════════════════════════════════════════════
// AGROMIND PRO v16 — PARTE 3: APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

// ─── CONSTANTES UI ───────────────────────────────────────────────
const FENOLOGIAS = [
  { val:"menor_10", label:"<10% Flor.", emoji:"🌿", desc:"PB >10% · Dig >65%" },
  { val:"10_25",    label:"10–25%",     emoji:"🌾", desc:"PB 7–10% · Dig 60–65%" },
  { val:"25_50",    label:"25–50%",     emoji:"🍂", desc:"PB 5–7% · Dig 55–60%",  warn:"⚠ Déficit proteico" },
  { val:"mayor_50", label:">50%",       emoji:"🪵", desc:"PB <5% · Dig <55%",     warn:"⚠ Déficit severo"   },
];

const MSGS = [
  "Analizando condición forrajera…",
  "Evaluando trayectoria CC…",
  "Calculando cadena reproductiva…",
  "Modelando anestro posparto…",
  "Simulando escenarios de suplementación…",
  "Generando recomendaciones…",
];

const PASOS = [
  { id:"ubicacion",  icon:"📍", label:"Ubicación"  },
  { id:"rodeo",      icon:"🐄", label:"Rodeo"      },
  { id:"cc",         icon:"📊", label:"CC"         },
  { id:"categorias", icon:"🐮", label:"Categ."     },
  { id:"forraje",    icon:"🌾", label:"Forraje"    },
  { id:"agua",       icon:"💧", label:"Agua"       },
  { id:"supl",       icon:"💊", label:"Suplemento" },
  { id:"analisis",   icon:"⚡", label:"Análisis"   },
];

// ─── FORM DEFAULT ────────────────────────────────────────────────
// ─── MOTOR DE RECOMENDACIONES ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════
// CEREBRO TÉCNICO v19 — árbol de decisión causal
// Lógica: 1) identifica cuellos de botella reales por categoría
//         2) establece relaciones causales entre problemas
//         3) genera recomendación con dosis + alimento + momento
// ═══════════════════════════════════════════════════════════════════

// ── Elige el mejor suplemento proteico disponible en el stock ──────
function elegirSuplProteico(form, pbMinNecesario) {
  const candidatos = ["Expeller soja","Expeller girasol","Expeller algodón","Semilla algodón","Pellet trigo","Mix proteico-energ"];
  const stock = (form.stockAlim || []).map(s => s.alimento);
  // Primero buscar en stock, sino elegir por relación PB/precio
  const enStock = candidatos.filter(c => stock.includes(c) && SUPLEMENTOS[c]?.pb >= pbMinNecesario);
  if (enStock.length > 0) return SUPLEMENTOS[enStock[0]];
  // Mejor opción por defecto para proteína: girasol (PB 36%, costo 0.7)
  return SUPLEMENTOS["Expeller girasol"];
}

function elegirSuplEnergetico(form) {
  const stock = (form.stockAlim || []).map(s => s.alimento);
  const enStock = ["Sorgo grano","Maíz grano","Rollo silaje maíz"].find(c => stock.includes(c));
  if (enStock) return SUPLEMENTOS[enStock];
  return SUPLEMENTOS["Sorgo grano"];
}

// ── Calcula kg/día de suplemento proteico para cubrir deficit de PB ─
// Lógica NASSEM: la proteína activa el rumen, mejora digestión de fibra
// Meta: llevar PB dieta a ≥8% (mínimo ruminal) o ≥10% (crecimiento)
function calcDosisProtein(pvKg, pbPasto, pbMeta, suplObj) {
  // Consumo voluntario MS estimado según fenología
  const cvMS    = pvKg * 0.022; // kg MS/día (2.2% PV, ajustado invierno)
  const pbActMS = cvMS * (pbPasto / 100); // proteína actual en kg/día
  const pbMetaMS= cvMS * (pbMeta  / 100); // proteína meta en kg/día
  const defPB   = Math.max(0, pbMetaMS - pbActMS); // déficit proteína kg/día
  const kgSupl  = defPB / (suplObj.pb / 100) / (suplObj.degProt / 100);
  return Math.max(0.2, Math.min(2.0, +kgSupl.toFixed(2)));
}

function diagnosticarSistema(motor, form) {
  if (!motor) return null;

  const {
    tray, dist, vaq1E, vaq2E, tcSave,
    balanceMensual, stockStatus, sanidad, toroDxn,
    evalAgua, cargaEV_ha, factorAgua, factorCarga,
    verdeoAporteMcalMes, verdeoMesInicio,
    nVacas, nToros, nV2s, nVaq2, nVaq1, totalEV,
    ccPondVal, cadena, ccDesvio,
    pvEntVaq1, pvEntradaVaq2,
  } = motor;

  const pvVaca  = parseFloat(form.pvVacaAdulta) || 320;
  const bt      = getBiotipo(form.biotipo);
  const fenol   = form.fenologia || "menor_10";

  // ── PB y digestibilidad del pasto según fenología ─────────────────
  const PB_PASTO  = { menor_10:12, "10_25":9, "25_50":6, mayor_50:4  }[fenol] || 9;
  const DIG_PASTO = { menor_10:68, "10_25":63,"25_50":58, mayor_50:52 }[fenol] || 63;
  const DISP_MS   = motor.disponMS?.msHa || 1500;
  const esCalidadBaja  = PB_PASTO <= 8;   // por debajo del mínimo ruminal
  const esCantidadBaja = DISP_MS < 1000;  // < 1000 kgMS/ha = escaso

  // ── Indicadores base ───────────────────────────────────────────────
  const ind = {
    prenez:        tray?.pr              ?? null,
    ccHoy:         ccPondVal             ?? null,
    ccParto:       parseFloat(tray?.ccParto   || 0),
    ccMinLact:     parseFloat(tray?.ccMinLact || 0),
    ccServ:        parseFloat(tray?.ccServ    || 0),
    anestro:       tray?.anestro?.dias   ?? null,
    caidaCC:       parseFloat(tray?.caidaLact || 0),
    mesesLact:     parseFloat(tray?.mesesLact || 0),
    pvVaq1Sal:     vaq1E?.pvSal          ?? null,
    gdpVaq1:       vaq1E?.gdpReal        ?? null,
    pvVaq2Entore:  vaq2E?.pvEntore       ?? null,
    llegazVaq2:    vaq2E?.llegas         ?? null,
    defMesesInv:   balanceMensual.filter(m=>[5,6,7].includes(m.i)&&m.deficit).length,
    peorBalance:   Math.min(...balanceMensual.map(m=>m.balance)),
    stockOk:       Object.values(stockStatus).every(s=>s.suficiente),
    relacionAT:    (nVacas && nToros) ? Math.round(nVacas/nToros) : null,
    ccToros:       parseFloat(form.torosCC) || null,
    sanidadAlerts: sanidad?.alertas?.length ?? 0,
    cargaEV_ha,
    factorAgua,
    pvVaq1Entrada: pvEntVaq1,
    PB_PASTO, DIG_PASTO, DISP_MS,
    esCalidadBaja, esCantidadBaja,
  };

  // ═══════════════════════════════════════════════════════════════════
  // ÁRBOL DE DECISIÓN — por categoría, causal
  // ═══════════════════════════════════════════════════════════════════

  const cuellos   = []; // limitantes principales identificados
  const planes    = []; // planes de acción concretos por categoría

  // ────────────────────────────────────────────────────────────────
  // CATEGORÍA A: VACA ADULTA + V2S
  // Regla: con ternero al pie → herramienta = DESTETE, no suplemento
  // Solo suplemento eficiente en PREPARTO (sin ternero)
  // ────────────────────────────────────────────────────────────────

  const pctH = parseFloat(form.destHiper) || 0;
  const pctA = parseFloat(form.destAntic) || 0;

  // Cuello 1: CC al servicio baja
  if (ind.ccServ > 0 && ind.ccServ < 4.5) {
    const defCC    = +(4.5 - ind.ccServ).toFixed(1);
    const prenezAct= interpCC(ind.ccServ).pr;
    const prenezObj= interpCC(4.5).pr;
    const causas   = [];
    if (ind.ccParto < 4.5) causas.push(`CC al parto baja (${ind.ccParto})`);
    if (ind.mesesLact > 3)  causas.push(`lactación prolongada (${ind.mesesLact} meses)`);
    if (esCalidadBaja)      causas.push(`pasto encañado (PB ${PB_PASTO}%)`);
    if (esCantidadBaja)     causas.push(`disponibilidad escasa (${DISP_MS} kgMS/ha)`);

    cuellos.push({
      id: "cc_serv",
      categoria: "Vaca adulta",
      icono: "🐄",
      prioridad: "P1",
      titulo: `CC al servicio baja — ${ind.ccServ} (necesita ≥4.5)`,
      impacto: `Preñez actual: ~${prenezAct}% → con CC 4.5+: ~${prenezObj}% (+${prenezObj-prenezAct}pp)`,
      causas,
      causaRaiz: ind.ccParto < 4.5 ? "cc_parto" : ind.mesesLact > 3 ? "lactacion" : "forraje",
    });

    // Plan vacas: destete SIEMPRE primero
    const pctHnec = Math.min(70, Math.max(30, Math.round(defCC * 45)));
    // Preparto: suplemento SÍ eficiente (sin ternero)
    const suplPre = elegirSuplProteico(form, 30);
    const kgPrep  = +(defCC * 56 / (60 * suplPre.em)).toFixed(2);

    planes.push({
      id: "plan_vacas",
      categoria: "Vaca adulta",
      icono: "🐄",
      prioridad: "P1",
      cuelloId: "cc_serv",
      pasos: [
        {
          orden: 1,
          tipo: "manejo",
          titulo: "Destete hiperprecoz — herramienta principal",
          detalle: `Retirar ternero antes de los 50 días en vacas CC <4.5`,
          porque: `Con ternero al pie la vaca gasta 6–8 Mcal/día en lactación. Ningún suplemento cubre ese costo. El destete elimina ese gasto y la vaca retoma ciclos en 7–14 días (Wiltbank 1990). Libera ${pctHnec * nVacas / 100 * 3}+ Mcal/día del sistema.`,
          cantidad: `${pctHnec}% del rodeo — vacas CC <4.5`,
          momento: "Abril–Mayo, antes del invierno",
        },
        {
          orden: 2,
          tipo: "suplemento",
          titulo: `Preparto — ${suplPre.label}`,
          detalle: `${kgPrep} kg/vaca/día · últimos 60 días de gestación`,
          porque: `ÚNICA ventana eficiente para suplementar la vaca: todavía no tiene ternero al pie → 1 kg ${suplPre.label} = ${suplPre.em} Mcal netas que van a CC. Objetivo: llegar al parto con CC ≥4.5.`,
          alimento: suplPre.label,
          kgDia: kgPrep,
          pbAportada: +(kgPrep * suplPre.pb / 100).toFixed(0) + " g PB/día",
          costoRelativo: suplPre.precio,
          momento: "Últimos 60 días gestación (sin ternero al pie)",
          diasTotal: 60,
          noHacer: "NO suplementar vacas en lactación con ternero al pie — ineficiente",
        },
      ],
      proyeccion: {
        base:    { ccServ: ind.ccServ,   prenez: prenezAct  },
        conPlan: { ccServ: Math.min(5.5, +(ind.ccServ + defCC*0.65).toFixed(1)), prenez: Math.min(85, prenezAct + Math.round((prenezObj-prenezAct)*0.65)) },
      },
    });
  }

  // Cuello 2: CC al parto baja (raíz de CC servicio)
  if (ind.ccParto > 0 && ind.ccParto < 4.5) {
    cuellos.push({
      id: "cc_parto",
      categoria: "Vaca adulta",
      icono: "🐄",
      prioridad: "P1",
      titulo: `CC al parto baja — ${ind.ccParto} (necesita ≥4.5)`,
      impacto: `Cada 0.5 CC al parto = 25 días menos de anestro posparto`,
      causas: ["Déficit energético en gestación tardía","Sin suplementación preparto"],
      causaRaiz: "forraje_invierno",
      generaProblema: "cc_serv",
    });
  }

  // ────────────────────────────────────────────────────────────────
  // CATEGORÍA B: VAQUILLONA 1° INVIERNO
  // Sin ternero → suplemento proteico SÍ eficiente
  // Árbol: ¿cuánto pasto? ¿qué calidad? → dosis y fuente
  // ────────────────────────────────────────────────────────────────

  if (nVaq1 > 0 && vaq1E && !vaq1E.mensaje) {
    const pvAgosto  = vaq1E.pvSal ?? 0;
    const pvObjAgo  = 220;
    const deficitPV = pvObjAgo - pvAgosto;
    const defGDP    = Math.max(0, vaq1E.gdpReal ? 250 - vaq1E.gdpReal : 120);
    const pvVaq1    = pvEntVaq1 || Math.round(pvVaca * 0.40);

    if (deficitPV > 0 || esCalidadBaja || esCantidadBaja) {
      // Identificar cuello por árbol de decisión forrajero
      let cuelloCausa, descripcionCuello;
      if (!esCalidadBaja && !esCantidadBaja) {
        cuelloCausa = "gp_pasto_ok";
        descripcionCuella = "Pasto suficiente y buena calidad — revisar PV entrada";
      } else if (!esCantidadBaja && esCalidadBaja) {
        cuelloCausa = "calidad_baja";
        descripcionCuello = `Buena cantidad (${DISP_MS} kgMS/ha) pero calidad baja (PB ${PB_PASTO}%) — pasto encañado`;
      } else if (esCantidadBaja && !esCalidadBaja) {
        cuelloCausa = "cantidad_baja";
        descripcionCuello = `Pasto escaso (${DISP_MS} kgMS/ha) pero buena calidad — falta volumen`;
      } else {
        cuelloCausa = "ambos";
        descripcionCuello = `Pasto escaso (${DISP_MS} kgMS/ha) Y baja calidad (PB ${PB_PASTO}%) — déficit doble`;
      }

      cuellos.push({
        id: "vaq1_peso",
        categoria: "Vaquillona 1° invierno",
        icono: "🐮",
        prioridad: deficitPV > 20 ? "P1" : "P2",
        titulo: deficitPV > 0
          ? `Vaq1 no llega a ${pvObjAgo} kg en agosto — proyecta ${pvAgosto} kg (falta ${deficitPV} kg)`
          : `Vaq1 en riesgo — calidad forrajera insuficiente`,
        impacto: deficitPV > 0
          ? `Sin corrección: no alcanza peso de entore para el servicio del año siguiente`
          : `GDP comprometido por PB pasto bajo`,
        causas: [descripcionCuello],
        causaRaiz: cuelloCausa,
      });

      // Plan Vaq1 — según árbol calidad/cantidad
      const suplProt  = elegirSuplProteico(form, 25);
      const suplEnerg = elegirSuplEnergetico(form);

      // Dosis proteína: cubrir déficit PB hasta 10% (meta crecimiento)
      const kgProt  = calcDosisProtein(pvVaq1, PB_PASTO, 10, suplProt);
      // Dosis energía: solo si hay escasez de pasto
      const kgEnerg = esCantidadBaja ? Math.max(0.3, Math.min(1.5,
        +(deficitPV / 90 / 0.3).toFixed(2))) : 0;

      const gdpConPlan = Math.min(500, (vaq1E.gdpReal || 130) + (kgProt * 150) + (kgEnerg * 100));
      const pvConPlan  = Math.round(pvVaq1 + gdpConPlan * 0.090);

      let descripcionPlan;
      if (cuelloCausa === "calidad_baja") {
        descripcionPlan = `Buena cantidad pero pasto encañado (PB ${PB_PASTO}%): la proteína activa la microflora ruminal y mejora la digestión de la fibra disponible. GDP puede mejorar ${Math.round(kgProt * 150)}g/día con solo ${kgProt} kg de ${suplProt.label} (Detmann/NASSEM 2010).`;
      } else if (cuelloCausa === "cantidad_baja") {
        descripcionPlan = `Pasto escaso: necesitás tanto proteína como energía para cubrir el déficit. La proteína sola no alcanza cuando no hay volumen de pasto. ${kgEnerg} kg de ${suplEnerg.label} aporta la energía faltante.`;
      } else if (cuelloCausa === "ambos") {
        descripcionPlan = `Doble déficit — cantidad y calidad bajas. Plan combinado: proteína para activar el rumen + energía para cubrir la demanda de mantenimiento y crecimiento. Sin este plan la vaquillona no llega al peso de entore.`;
      } else {
        descripcionPlan = `Revisar PV de entrada — con pasto de buena calidad y cantidad suficiente, la falla puede estar en el PV inicial o en el biotipo.`;
      }

      const pasosVaq1 = [];
      pasosVaq1.push({
        orden: 1,
        tipo: "suplemento",
        titulo: `Proteína — ${suplProt.label}`,
        detalle: `${kgProt} kg/cabeza/día`,
        porque: descripcionPlan,
        alimento: suplProt.label,
        kgDia: kgProt,
        pbAportada: +(kgProt * suplProt.pb / 100 * 1000).toFixed(0) + " g PB/día",
        pctPV: +((kgProt / pvVaq1) * 100).toFixed(2) + "% PV",
        frecuencia: esCalidadBaja && !esCantidadBaja ? "2–3 veces por semana (proteína activa el rumen, no necesita ser diario)" : "Diario",
        momento: "Mayo–Agosto (90 días)",
        diasTotal: 90,
        costoRelativo: suplProt.precio,
      });

      if (esCantidadBaja && kgEnerg > 0) {
        pasosVaq1.push({
          orden: 2,
          tipo: "suplemento",
          titulo: `Energía — ${suplEnerg.label}`,
          detalle: `${kgEnerg} kg/cabeza/día`,
          porque: `Pasto escaso: la proteína sola no compensa cuando no hay volumen. ${suplEnerg.label} aporta ${+(kgEnerg * suplEnerg.em).toFixed(1)} Mcal/día adicionales.`,
          alimento: suplEnerg.label,
          kgDia: kgEnerg,
          frecuencia: "Diario junto con proteína",
          momento: "Mayo–Agosto",
          diasTotal: 90,
          costoRelativo: suplEnerg.precio,
        });
      }

      planes.push({
        id: "plan_vaq1",
        categoria: "Vaquillona 1° invierno",
        icono: "🐮",
        prioridad: deficitPV > 20 ? "P1" : "P2",
        cuelloId: "vaq1_peso",
        pasos: pasosVaq1,
        proyeccion: {
          base:    { pvAgosto, gdpReal: vaq1E.gdpReal || 130 },
          conPlan: { pvAgosto: pvConPlan, gdpReal: Math.round(gdpConPlan) },
        },
      });
    }
  }

  // ────────────────────────────────────────────────────────────────
  // CATEGORÍA C: VAQUILLONA 2° INVIERNO
  // ────────────────────────────────────────────────────────────────

  if (nVaq2 > 0 && vaq2E && !vaq2E.llegas) {
    const pvFalta   = vaq2E.pvMinEntore - vaq2E.pvEntore;
    const suplProt  = elegirSuplProteico(form, 25);
    const kgProt2   = calcDosisProtein(pvEntradaVaq2 || Math.round(pvVaca * 0.65), PB_PASTO, 12, suplProt);
    const kgEnerg2  = esCantidadBaja ? Math.max(0.5, Math.min(2.0, +(pvFalta / 90 / 0.25).toFixed(2))) : 0;

    cuellos.push({
      id: "vaq2_entore",
      categoria: "Vaquillona 2° invierno",
      icono: "🐂",
      prioridad: "P2",
      titulo: `Vaq2 no llega al entore — ${vaq2E.pvEntore} kg vs ${vaq2E.pvMinEntore} kg necesario (75% PV adulto)`,
      impacto: `Entore con bajo PV garantiza baja preñez y perpetúa el problema en el rodeo`,
      causas: [
        esCalidadBaja ? `Pasto encañado (PB ${PB_PASTO}%)` : null,
        esCantidadBaja ? `Pasto escaso (${DISP_MS} kgMS/ha)` : null,
        `Déficit de ${pvFalta} kg para el objetivo`,
      ].filter(Boolean),
    });

    planes.push({
      id: "plan_vaq2",
      categoria: "Vaquillona 2° invierno",
      icono: "🐂",
      prioridad: "P2",
      cuelloId: "vaq2_entore",
      pasos: [
        {
          orden: 1,
          tipo: "suplemento",
          titulo: `Proteína — ${suplProt.label}`,
          detalle: `${kgProt2} kg/cabeza/día`,
          porque: `Vaq2 en triple estrés (crecimiento + gestación anterior + lactación). PB pasto ${PB_PASTO}% insuficiente para el nivel de exigencia. ${suplProt.label} (PB ${suplProt.pb}%) lleva la dieta al mínimo de crecimiento activo (12% PB).`,
          alimento: suplProt.label,
          kgDia: kgProt2,
          frecuencia: esCalidadBaja && !esCantidadBaja ? "2–3 veces/semana" : "Diario",
          momento: "Mayo–entore (90–120 días)",
        },
        ...(kgEnerg2 > 0 ? [{
          orden: 2,
          tipo: "suplemento",
          titulo: `Energía — ${elegirSuplEnergetico(form).label}`,
          detalle: `${kgEnerg2} kg/cabeza/día`,
          porque: `Pasto escaso + déficit de ${pvFalta} kg: la proteína sola no alcanza para cubrir el gap de peso.`,
          alimento: elegirSuplEnergetico(form).label,
          kgDia: kgEnerg2,
          frecuencia: "Diario",
          momento: "Mayo–entore",
        }] : []),
      ],
      proyeccion: {
        base:    { pvEntore: vaq2E.pvEntore,       llega: false },
        conPlan: { pvEntore: vaq2E.pvMinEntore, llega: true  },
      },
    });
  }

  // ────────────────────────────────────────────────────────────────
  // CATEGORÍA D: TOROS
  // ────────────────────────────────────────────────────────────────

  if (ind.ccToros && ind.ccToros < 5.0) {
    const suplToro = elegirSuplProteico(form, 30);
    const kgToro   = +(pvVaca * 1.3 * 0.003).toFixed(1);
    const dias     = Math.round((5.5 - ind.ccToros) / 0.018);

    cuellos.push({
      id: "toros_cc",
      categoria: "Toros",
      icono: "🐂",
      prioridad: ind.ccToros < 4.0 ? "P1" : "P2",
      titulo: `Toros con CC baja — ${ind.ccToros} (necesitan ≥5.0 al servicio)`,
      impacto: `Toro CC <5.0: libido reducida y calidad espermática comprometida → −10 a −15pp preñez por lote`,
      causas: ["Subnutrición invernal", esCalidadBaja ? `Pasto encañado (PB ${PB_PASTO}%)` : ""].filter(Boolean),
    });

    planes.push({
      id: "plan_toros",
      categoria: "Toros",
      icono: "🐂",
      prioridad: ind.ccToros < 4.0 ? "P1" : "P2",
      cuelloId: "toros_cc",
      pasos: [{
        orden: 1,
        tipo: "suplemento",
        titulo: `Preparo servicio — ${suplToro.label}`,
        detalle: `${kgToro} kg/toro/día por ${dias} días`,
        porque: `Un toro en CC <5.0 reduce silenciosamente la preñez del lote entre 10–15pp. El costo del suplemento es <3% del valor de los terneros no nacidos.`,
        alimento: suplToro.label,
        kgDia: kgToro,
        frecuencia: "Diario",
        momento: `${dias} días antes del inicio de servicio`,
        diasTotal: dias,
        objetivo: "Llegar al servicio con CC ≥5.5",
      }],
      proyeccion: {
        base:    { ccToros: ind.ccToros, fertilidad: "comprometida" },
        conPlan: { ccToros: 5.5,         fertilidad: "óptima" },
      },
    });
  }

  // ────────────────────────────────────────────────────────────────
  // PROBLEMAS SISTÉMICOS (no por categoría)
  // ────────────────────────────────────────────────────────────────

  // Relación toro:vaca
  if (ind.relacionAT && ind.relacionAT > 25) {
    cuellos.push({
      id: "relacion_at",
      categoria: "Toros",
      icono: "🐂",
      prioridad: "P2",
      titulo: `Relación toro:vaca alta — ${ind.relacionAT}:1 (máximo 25:1)`,
      impacto: `Cobertura incompleta de celos cortos (Bos indicus 6–12h) → −6pp preñez por ciclo sin cubrir`,
      causas: [`${nVacas} vacas / ${nToros} toros = ${ind.relacionAT}:1`],
    });
  }

  // Agua
  if (evalAgua && evalAgua.pctReducDMI > 10) {
    const kgMsPerd = +(evalAgua.pctReducDMI/100 * pvVaca * 0.024).toFixed(1);
    cuellos.push({
      id: "agua",
      categoria: "Sistémico",
      icono: "💧",
      prioridad: "P1",
      titulo: `Agua salada — TDS ${evalAgua.tdsN} mg/L reduce consumo de MS ${evalAgua.pctReducDMI.toFixed(0)}%`,
      impacto: `Equivale a eliminar ${kgMsPerd} kg MS/vaca/día = reducción de CC y producción`,
      causas: [`TDS ${evalAgua.tdsN} mg/L > 3000 mg/L límite para bovinos`],
    });
  }

  // Sanidad
  if (form.sanAftosa === "no")  cuellos.push({ id:"san_aftosa",  categoria:"Sanidad", icono:"🔴", prioridad:"P1", titulo:"Sin vacunación Aftosa — obligatorio SENASA", impacto:"Clausura establecimiento + pérdida trazabilidad exportación", causas:[] });
  if (form.sanBrucelosis==="no") cuellos.push({ id:"san_brucela", categoria:"Sanidad", icono:"🔴", prioridad:"P1", titulo:"Sin vacunación Brucelosis — obligatorio SENASA", impacto:"Abortos hasta 30% al 7° mes gestación", causas:[] });
  if (form.sanToros==="sin_control") cuellos.push({ id:"san_toros_esan", categoria:"Sanidad", icono:"🔴", prioridad:"P1", titulo:"Toros sin ESAN pre-servicio", impacto:"Trichomonas/Campylobacter: infecta 15–40% rodeo silenciosamente", causas:[] });

  // Stock insuficiente
  Object.entries(stockStatus).forEach(([alim, st]) => {
    if (!st.suficiente && st.kgNecesario > 0) {
      const faltanT = +((st.kgNecesario - st.stockKg)/1000).toFixed(1);
      cuellos.push({
        id: `stock_${alim}`,
        categoria: "Stock",
        icono: "📦",
        prioridad: "P2",
        titulo: `Stock insuficiente — ${alim}: faltan ${faltanT}t`,
        impacto: `Plan de suplementación se corta en semana ${st.semanas} del invierno`,
        causas: [`Tenés ${(st.stockKg/1000).toFixed(1)}t, necesitás ${(st.kgNecesario/1000).toFixed(1)}t`],
      });
    }
  });

  // ── Ordenar por prioridad ──────────────────────────────────────
  const ord = { P1:0, P2:1, P3:2 };
  cuellos.sort((a,b) => (ord[a.prioridad]??3) - (ord[b.prioridad]??3));
  planes.sort((a,b)  => (ord[a.prioridad]??3) - (ord[b.prioridad]??3));

  // ── Proyección final si se aplica todo ────────────────────────
  const prenezFinal = Math.min(93, (ind.prenez ?? 50) +
    planes.reduce((s, p) => {
      const g = p.proyeccion?.conPlan?.prenez && p.proyeccion?.base?.prenez
        ? Math.max(0, p.proyeccion.conPlan.prenez - p.proyeccion.base.prenez) : 0;
      return s + g * 0.7;
    }, 0));

  return {
    ind,
    cuellos,   // limitantes identificados con causa raíz
    planes,    // planes de acción concretos por categoría
    proyeccion: {
      prenez:          Math.round(prenezFinal),
      gananciaPreñez:  Math.round(prenezFinal - (ind.prenez ?? 50)),
    },
    // compatibilidad con código existente
    recs: planes.flatMap(p => p.pasos.map(paso => ({
      id: `${p.id}_${paso.orden}`,
      prioridad: p.prioridad,
      categoria: p.categoria,
      icono: p.icono,
      accion: paso.titulo + " — " + paso.detalle,
      porque: paso.porque,
      mesCritico: paso.momento,
      solucion: { tipo:"supl", alimento: paso.alimento, kgDia: paso.kgDia },
      impactoBase: p.proyeccion?.base,
      impactoConRec: p.proyeccion?.conPlan,
    }))),
  };
}


// ─── PANEL RECOMENDACIONES v19 ────────────────────────────────────
function PanelRecomendaciones({ motor, form }) {
  const dx = React.useMemo(() => diagnosticarSistema(motor, form), [motor, form]);
  const [planAbierto, setPlanAbierto] = React.useState(null);
  const [pasoAbierto, setPasoAbierto] = React.useState({});

  if (!dx) return (
    <div style={{ padding:20, textAlign:"center", fontFamily:T.font, fontSize:11, color:T.textFaint }}>
      Completá los datos del rodeo para ver el diagnóstico
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





const FORM_DEF = {
  // ── Ubicación ──────────────────────────────────────────────────
  nombreProductor:"", zona:"NEA", provincia:"Corrientes", localidad:"",
  // ── Rodeo ──────────────────────────────────────────────────────
  biotipo:"Brangus 3/8", primerParto:false,
  vacasN:"", torosN:"", pvVacaAdulta:"320",
  eReprod:"Gestación media (5–7 meses)", prenez:"", pctDestete:"88",
  iniServ:"", finServ:"",
  edadPrimerEntore:"24",
  // ── Vaquillona ─────────────────────────────────────────────────
  edadVaqMayo:"", tipoDesteteVaq:"hiper",
  // ── Disponibilidad forrajera ───────────────────────────────────
  altPasto:"20", tipoPasto:"alto_denso",
  // Verdeos de invierno (nuevo v15)
  tieneVerdeo:"no", verdeoHa:"", verdeoTipo:"Avena/Cebadilla", verdeoDisp:"agosto",
  diasSuplInv:"90",   // duración campaña de suplementación invernal (días)
  diasDesdeCC:"hoy",  // antigüedad de la medición de CC
  verdeoDestinoVaq:"si",   // ¿se reserva para vaquillona?
  // ── Categorías ─────────────────────────────────────────────────
  v2sN:"", v2sPV:"", v2sTernero:"",
  cc2sDist:[{ cc:"5.0", pct:"50" },{ cc:"4.5", pct:"50" }],
  pctReposicion:"20", vaq1PV:"", vaq2N:"", vaq2PV:"",
  // ── CC ─────────────────────────────────────────────────────────
  distribucionCC:[{ cc:"5.5", pct:"20" },{ cc:"5.0", pct:"50" },{ cc:"4.5", pct:"30" }],
  fechaCC:"",            // fecha en que se midió la CC (nueva v15)
  // ── Destete ────────────────────────────────────────────────────
  destTrad:"0", destAntic:"0", destHiper:"100",
  // ── Toros — diagnóstico preparo de servicio (nuevo v15) ────────
  torosLote:"si",        // ¿están todos en un lote o distribuidos?
  torosLotes:"",         // cantidad de lotes si distribuidos
  torosCC:"4.5",         // CC toros hoy (promedio)
  torosBCS_ok:"",        // % con CC ≥ 5.0 (condición óptima de servicio)
  // ── Forraje ────────────────────────────────────────────────────
  vegetacion:"Pastizal natural NEA/Chaco", fenologia:"menor_10",
  supHa:"", pctMonte:"10", pctNGan:"5",
  // ── Suplementación por categoría (sin duplicados) ──────────────
  supl1:"", dosis1:"0", supl2:"", dosis2:"0", supl3:"", dosis3:"0",
  supl_vacas:"",  dosis_vacas:"0",
  supl_v2s:"",    dosis_v2s:"0",
  supl_toros:"",  dosis_toros:"0",
  supl_vaq2:"",   dosis_vaq2:"0",
  supl_vaq1:"",   dosis_vaq1:"0",
  supl_ternero:"",dosis_ternero:"0",
  // ── Stock de alimentos (nuevo v15) ─────────────────────────────
  stockAlim:[],  // [{ alimento, toneladas }]
  // ── Sanidad ────────────────────────────────────────────────────
  sanVacunas:"si", sanBrucelosis:"si", sanAftosa:"si",
  sanToros:"con_control", sanAbortos:"no", sanPrograma:"si",
  sanParasitoExt:"", sanParasitoInt:"",
  // ── ENSO ───────────────────────────────────────────────────────
  enso:"neutro",
  // ── Agua ───────────────────────────────────────────────────────
  aguaTDS:"", aguaTipoSal:"Mixta/Desconocida", aguaFuente:"",
  // ── Visitas de campo (seguimiento temporal — nuevo v15) ────────
  visitasCampo:[],  // [{ fecha, ccObservada, observacion }]
  // ── Consulta ───────────────────────────────────────────────────
  consultaEspecifica:"",
};

// ─── SYSTEM PROMPT ───────────────────────────────────────────────
const SYS_FULL = `Sos un asesor técnico ganadero con 20 años de campo en cría bovina extensiva en NEA, NOA, Paraguay, Bolivia y Brasil. Conocés cada establecimiento como si lo hubieras caminado. Tu análisis es directo, preciso y útil para el productor real — no un resumen genérico.

REGLAS DE ESCRITURA — OBLIGATORIAS:
- Escribí como si le hablaras al productor cara a cara. Claro, técnico pero sin jerga innecesaria.
- Cada sección empieza con una frase diagnóstica contundente. No empieces con "En base a los datos..."
- Usá números concretos siempre: Mcal, kg MS, días, porcentajes. Nunca digas "puede haber déficit" — calculá y decí cuánto.
- Cuando hay un problema grave, decilo sin rodeos: "Esto está mal y hay que corregirlo antes del servicio."
- Las recomendaciones tienen que tener ACCIÓN + DOSIS + MOMENTO + POR QUÉ. No des opciones vagas.
- Largo mínimo por sección: 120 palabras. El informe completo mínimo 700 palabras.
- Citas bibliográficas integradas en el texto, no al final como lista.

MODELO TÉCNICO v14:
- DISPARADOR C4: T<15°C detiene crecimiento megatérmico. Es el momento crítico del sistema — coordinar toda la estrategia alrededor de este evento.
- CONSUMO VOLUNTARIO (Lippke 1980; Minson 1990): fenología define kg MS/vaca/día → <10% flor: 2.8%PV · 10-25%: 2.4% · 25-50%: 2.0% · >50%: 1.6%PV. Digestibilidad decrece 0.5 unidades/semana de floración avanzada.
- REQUERIMIENTOS: modelar por estado fisiológico real. Lactación pico = 18–22 Mcal/día para 320kg. Gestación tardía = 14–16 Mcal. Nunca promediar sin indicar el mes crítico.
- AGUA (López et al. 2021, JAS 99:skab215): TDS >3.000mg/L reduce DMI. SO₄ más deletéreo que NaCl. En NEA/Chaco, laguna estacional puede cuadruplicar TDS en agosto-septiembre.
- BIOTIPO (Short 1990; Neel 2007): Bos indicus moviliza CC más lentamente, recupera más despacio, umbral anestro 0.5–1.0 CC menor que taurino. Adaptar expectativas de preñez en consecuencia.
- CC PARTO (Selk 1988): cada 0.5 unidades CC al parto = 25 días menos de anestro = +8–12 pp preñez. Ventana crítica: últimos 60 días gestación.
- DESTETE HIPERPRECOZ (Wiltbank 1990): elimina bloqueo LH en 7–14 días. Efecto en CC en 45 días. Herramienta de rescate para vacas CC <4.5.
- SUPLEMENTACIÓN PROTEICA INVERNAL (Detmann/NASSEM 2010): pasto >50% floración = PB <4% → por debajo del mínimo ruminal. 0.3–0.5 kg/día expeller girasol libera la digestión de fibra disponible. Diario obligatorio.
- SANIDAD: techo del sistema. Aftosa + Brucelosis = obligatorio legal. IBR/DVB = −15 pp preñez si sin vacunar. Toros sin ESAN = tricomoniasis silenciosa en hasta 40% del rodeo.

5 SECCIONES OBLIGATORIAS — emojis exactos al inicio de cada título:
1️⃣ DIAGNÓSTICO AMBIENTAL
Situación climática real del establecimiento hoy. Temperatura, NDVI, lluvia, ENSO. Estado del disparador C4 y qué significa para este momento del año. Calidad del agua si hay datos. Cronología del servicio/parto y su relación con el momento forrajero.

2️⃣ DIAGNÓSTICO POR CATEGORÍA
ORDEN OBLIGATORIO — de más crítica a menos crítica, siempre:
1. Vaquillona 1° invierno: ¿llega al 60% PV adulto en agosto? PV actual vs objetivo, GDP necesario vs GDP del pasto, escenario de suplementación.
2. Vaquillona 2° invierno: ¿llega al 75% PV adulto al entore? Estado actual, suplementación estratégica, semilla de algodón si corresponde.
3. Vaca de 2° servicio (V2S): la categoría más exigente — crecimiento + lactación + gestación simultáneos. Requerimiento Mcal/día real, déficit, riesgo de anestro prolongado, impacto en preñez.
4. Vacas adultas según CC: requerimiento Mcal/día por estado fisiológico, oferta del pasto, déficit o superávit, grupos críticos.
5. Toros: condición corporal al servicio, suplementación si necesario.
Para cada categoría: Requerimiento Mcal/día vs oferta pasto. Déficit numérico exacto. Proteína bruta del pasto vs requerimiento.

3️⃣ DESTETE Y PROYECCIÓN CC
Analizar CADA GRUPO DE CC por separado (no promediar). Para cada grupo:
- CC hoy → CC parto → CC mínima lactación → CC servicio
- Mcal movilizadas durante lactación (caída CC × 56 Mcal/punto)
- Días de anestro según biotipo y CC al parto
- Preñez esperada según CC al servicio
- Recomendación de destete específica para ese grupo: Tradicional 180d / Anticipado 90d / Hiperprecoz 50d
Identificar el mes de mayor riesgo de cada grupo. Qué pasa si no se actúa (pérdida de preñez en pp).

4️⃣ BALANCE ENERGÉTICO
Mes a mes: oferta forrajera (Mcal/vaca/día) + CC movilizada + suplemento vs demanda real. Identificar los 2–3 meses más críticos con déficit exacto en Mcal. Costo estimado de suplementación para cubrir ese déficit. Disponibilidad de pasto en kgMS/ha y cómo condiciona la decisión (cantidad vs calidad).

5️⃣ RECOMENDACIONES CONCRETAS
ORDEN OBLIGATORIO por categoría prioritaria:
🔴/🟡/🟢 1. VAQUILLONA 1° INVIERNO — suplementación con dosis, fuente, frecuencia (2–3x/sem si solo proteína, diario si incluye energía con almidón)
🔴/🟡/🟢 2. VAQUILLONA 2° INVIERNO — estrategia nutricional para llegar al entore en peso
🔴/🟡/🟢 3. VACA 2° SERVICIO — manejo separado, suplementación específica, destete precoz si CC < 4.5
🔴/🟡/🟢 4. VACAS POR GRUPO DE CC — destete recomendado por grupo (no genérico para todo el rodeo), suplementación si necesario
🔴/🟡/🟢 5. SANIDAD y otros
Para cada recomendación: QUÉ hacer · CUÁNTO (dosis exacta en kg/vaca/día o % PV) · CUÁNDO (mes exacto) · POR QUÉ (consecuencia si no se hace en pp preñez o kg ganados).
Al final: cronograma mensual de acciones para los próximos 6 meses.

Citar integrado en texto: Peruchena INTA 2003 · Selk 1988 · Detmann/NASSEM 2010 · Short et al. 1990 · Neel et al. 2007 · Lippke 1980 · Minson 1990 · López et al. 2021 JAS · NRC 2000 · Wiltbank 1990

INSTRUCCIONES ESTRUCTURA — INCUMPLIRLAS ES ERROR:
- Usar EXACTAMENTE los títulos con sus emojis: 1️⃣ DIAGNÓSTICO AMBIENTAL · 2️⃣ DIAGNÓSTICO POR CATEGORÍA · 3️⃣ DESTETE Y PROYECCIÓN CC · 4️⃣ BALANCE ENERGÉTICO · 5️⃣ RECOMENDACIONES CONCRETAS
- En 2️⃣ SIEMPRE incluir subsección "TOROS — PREPARO SERVICIO" aunque la CC sea buena. Si CC toros < 5.0: calcular días necesarios para llegar a CC 5.5 y protocolo de suplementación.
- En 4️⃣ mencionar si hay verdeos disponibles y cómo cambia el balance invernal.
- En 5️⃣ el cronograma mensual DEBE tener un renglón por cada mes de los próximos 6 meses con formato: "MES: acción específica — categoría — resultado esperado"
- Si hay datos de stock: comparar demanda del plan vs stock disponible y alertar déficit.
- Si hay visitas de campo: comparar CC observada vs proyección y ajustar recomendaciones.`;

// ─── APP PRINCIPAL ────────────────────────────────────────────────
export default function Page() {
  return (
    <SessionProvider>
      <AgroMindPro />
    </SessionProvider>
  );
}

function AgroMindPro() {
  const { data: session } = useSession();

  // Estado principal
  const [form,        setForm]        = useState(FORM_DEF);
  const [step,        setStep]        = useState(0);
  const [sat,         setSat]         = useState(null);
  const [coords,      setCoords]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [loadMsg,     setLoadMsg]     = useState("");
  const [result,      setResult]      = useState("");
  const [tab,         setTab]         = useState("recomendaciones");
  const [modoForraje, setModoForraje] = useState("general");
  const [usaPotreros, setUsaPotreros] = useState(true); // siempre potreros
  const [potreros,    setPotreros]    = useState([{ ha:"", veg:"Pastizal natural NEA/Chaco", fenol:"menor_10" }]);
  const [vistaSupl,   setVistaSupl]   = useState("cuadrantes"); // cuadrantes | resumen

  const set     = (k, v) => setForm(f => ({ ...f, [k]:v }));
  const setDist = (k, v) => setForm(f => ({ ...f, [k]:v }));

  // ── MOTOR DE INFERENCIA v16 ──────────────────────────────────
  // Un único hook que propaga todos los cambios en cascada
  const motor = useMotor(form, sat, potreros, usaPotreros);

  // Desestructurar el estado del motor (con fallbacks seguros)
  const cadena         = motor?.cadena         ?? calcCadena(form.iniServ, form.finServ);
  const disponMS       = motor?.disponMS       ?? calcDisponibilidadMS(form.altPasto, form.tipoPasto);
  const ccPondVal      = motor?.ccPondVal      ?? ccPond(form.distribucionCC);
  const ndviN          = motor?.ndviN          ?? (sat?.ndvi || 0.45);
  const tcSave         = motor?.tcSave         ?? null;
  const vaq1E          = motor?.vaq1E          ?? null;
  const pvSalidaVaq1   = motor?.pvSalidaVaq1   ?? "";
  const pvEntradaVaq2  = motor?.pvEntradaVaq2  ?? "";
  const vaq2E          = motor?.vaq2E          ?? null;
  const evalAgua       = motor?.evalAgua       ?? null;
  const sanidad        = motor?.sanidad        ?? null;
  const baseParams     = motor?.baseParams     ?? {};
  const tray           = motor?.tray           ?? null;
  const dist           = motor?.dist           ?? null;
  const balanceMensual = motor?.balanceMensual ?? [];
  const toroDxn        = motor?.toroDxn        ?? null;
  const stockStatus    = motor?.stockStatus    ?? {};
  const alertasMotor   = motor?.alertas        ?? [];
  const scoreRiesgo    = motor?.scoreRiesgo    ?? 0;
  const nivelRiesgo    = motor?.nivelRiesgo    ?? "—";
  const colorRiesgo    = motor?.colorRiesgo    ?? C.textDim;
  const cargaEV_ha     = motor?.cargaEV_ha     ?? null;

  const dispar     = sat && form.provincia ? calcDisp(form.provincia, sat.ndvi, sat.temp) : null;
  const nVaqRepos  = motor?.nVaq1 ?? Math.round((parseInt(form.vacasN)||0) * (parseFloat(form.pctReposicion)||20) / 100);

  // ── EFECTO: fetch satelital al cambiar coords / enso ──────────
  useEffect(() => {
    if (!coords) return;
    setSat(null);
    fetchSat(coords.lat, coords.lon, form.zona, form.provincia, form.enso, setSat);
    // Asegurar que si el fetch demora, se muestra el spinner
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
    let t = `ANÁLISIS — ${hoy}\n`;
    // Score sistémico del motor
    if (motor) {
      t += `SCORE SISTÉMICO: ${scoreRiesgo}/100 (riesgo ${nivelRiesgo.toUpperCase()})\n`;
      if (alertasMotor.length > 0) {
        t += `ALERTAS MOTOR (${alertasMotor.length}): ${alertasMotor.map(a=>a.tipo+": "+a.msg.slice(0,60)).join(" | ")}\n`;
      }
      if (cargaEV_ha) t += `CARGA REAL: ${cargaEV_ha} EV/ha (factor oferta: ${motor.factorCarga})\n`;
      if (motor.factorAgua < 1) t += `FACTOR AGUA: ${motor.factorAgua.toFixed(2)} (agua salobre reduce oferta efectiva)\n`;
      if (motor.verdeoAporteMcalMes > 0) t += `VERDEO APORTE: +${motor.verdeoAporteMcalMes} Mcal/día rodeo desde mes ${motor.verdeoMesInicio+1}\n`;
    }

    const locStr = [form.localidad, form.provincia, form.zona].filter(Boolean).join(" · ");
    if (coords) t += `UBICACIÓN: ${coords.lat?.toFixed(4)}°S ${coords.lon?.toFixed(4)}°W · ${locStr}\n`;
    else if (locStr) t += `UBICACIÓN: ${locStr} (sin GPS)\n`;
    if (sat?.temp) t += `MET REAL: T${sat.temp}°C (Mx${sat.tMax}/Mn${sat.tMin}) · P7d:${sat.p7}mm P30d:${sat.p30}mm · Bal:${sat.deficit>0?"+":""}${sat.deficit}mm · NDVI:${sat.ndvi}(${sat.condForr})\n`;

    t += `ENSO: ${form.enso==="nino"?"El Niño +25%":form.enso==="nina"?"La Niña −25%":"Neutro"} · BIOTIPO: ${form.biotipo||"Brangus 3/8"}\n`;
    if (dispar) t += `DISPARADOR C4: ${dispar.dias===0?"⛔ Invierno activo — C4 restringido":dispar.dias+" días hasta temp <15°C"}\n`;

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
    t += `  Toros ESAN: ${form.sanToros==="con_control"?"✅":"⚠️ Sin evaluación"} · Abortos: ${form.sanAbortos==="si"?"⚠️ Sí":"No"} · Programa: ${form.sanPrograma==="si"?"✅":"⚠️ No"}\n`;

    if (tray) {
      t += `\nTRAYECTORIA CC (rodeo promedio):\n`;
      t += `  HOY:${tray.ccHoy} → PARTO:${tray.ccParto} → SERV.:${tray.ccServ} (mín lactación: ${tray.ccMinLact})\n`;
      t += `  Preñez est.: ${tray.pr}% · Anestro: ${tray.anestro?.dias}d (${tray.anestro?.riesgo?"⚠️ riesgo":"✅ ok"}) · Caída lactación: −${tray.caidaLact} CC en ${tray.mesesLact} meses\n`;
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
          supl_toros:    (parseFloat(form.pvVacaAdulta)||320)*1.3,
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
      t += `\nCC POR GRUPO (supervivencia Rosello Brajovich 2025):\n`;
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
    if (vaq1E && vaq1E.esc !== "—") t += `\n  Esc${vaq1E.esc}: Prot${vaq1E.prot}kg Energ${vaq1E.energ||0}kg ${vaq1E.freq} GDP${vaq1E.gdpReal}g/d → PV${vaq1E.pvSal}kg${vaq1E.nota ? " · " + vaq1E.nota : ""}`;
    t += "\n";

    if (form.vaq2N) {
      t += `VAQ2: ${form.vaq2N} cab`;
      if (vaq2E) {
        t += ` · PV entrada 2°inv: ${vaq2E.pvMayo2Inv||"—"}kg · GDP inv: ${vaq2E.gdpInv||300}g/d (pasto solo: ${vaq2E.gdpPastoInv||"—"}g/d)`;
        t += `\n  PV agosto: ${vaq2E.pvV2Agosto||"—"}kg · PV entore: ${vaq2E.pvEntore||"—"}kg (obj ${vaq2E.pvMinEntore||"—"}kg = 75% PV adulto) ${vaq2E.llegas ? "✅" : "⚠️ NO LLEGA AL OBJETIVO"}`;
        if (vaq2E.protKg) t += `\n  Supl. invernal mín.: ${vaq2E.protKg}kg/d proteína + ${vaq2E.energKg>0?vaq2E.energKg+"kg/d energía":vaq2E.fuenteEnerg||"S.Algodón ad lib"} · ${vaq2E.freq||"—"}`;
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

    return t;
  }

  // ── RUN ANALYSIS ──────────────────────────────────────────────
  async function runAnalysis() {
    setLoading(true); setResult(""); setTab("diagnostico");
    let mi = 0;
    const iv = setInterval(() => { setLoadMsg(MSGS[mi % MSGS.length]); mi++; }, 2200);
    try {
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
      doc.text("AGROMIND PRO v16 - Informe Tecnico Ganadero", ML+4, y+9);
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

      // Secciones
      const partes    = result.split(/(?=\d️⃣)/);
      const SEC_COLORS_PDF = ["#2d6a1f","#2d6a1f","#d4952a","#d4952a","#c04820"];
      SEC_EMOJIS.forEach((em, si) => {
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
        `Toros ESAN: ${form.sanToros==="con_control"?"Con evaluacion":"SIN EVALUACION"}`,
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
        doc.text("AgroMind Pro v14 · INTA Colonia Benitez 2025 · Peruchena 2003 · Selk 1988 · Short et al. 1990 · NASSEM 2010", ML, 292);
        doc.text(`${p}/${tot}`, W-MR, 292, { align:"right" });
      }

      doc.save(`agromind_${(form.nombreProductor||"informe").replace(/\s/g,"_")}_${new Date().toISOString().slice(0,10)}.pdf`);
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
      ["Toros_ESAN",                form.sanToros     === "con_control" ? "Con_evaluacion" : "Sin_evaluacion"],
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
    a.download = `agromind_${(form.nombreProductor||"datos").replace(/\s/g,"_")}_${isoDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ══════════════════════════════════════════════════════════════
  // PASOS DEL FORMULARIO
  // ══════════════════════════════════════════════════════════════

  // ── PASO 0: UBICACIÓN ─────────────────────────────────────────
  const renderUbicacion = () => (
    <div>
      {/* Dos opciones bien visibles: GPS o manual */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        <button onClick={gpsClick} style={{
          background: coords ? C.green : `${C.green}15`,
          color: coords ? "#0b1a0c" : C.green,
          padding:"14px 10px", borderRadius:12, border:`1px solid ${coords?C.green:C.border}`,
          fontFamily:C.sans, fontSize:12, fontWeight:700, cursor:"pointer", textAlign:"center"
        }}>
          <div style={{ fontSize:22, marginBottom:4 }}>📍</div>
          {coords ? "GPS activo" : "Usar GPS"}
        </button>
        <div style={{
          background:`${C.blue}08`, borderRadius:12, border:`1px solid ${C.blue}25`,
          padding:"14px 10px", textAlign:"center"
        }}>
          <div style={{ fontSize:22, marginBottom:4 }}>🗺️</div>
          <div style={{ fontFamily:C.sans, fontSize:12, color:C.blue, fontWeight:600 }}>Sin GPS</div>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginTop:2 }}>Seleccioná provincia abajo</div>
        </div>
      </div>
      {coords && (
        <Alerta tipo="ok">
          GPS: {form.zona} · {form.provincia} {form.localidad ? `· ${form.localidad}` : ""}
          <span style={{ opacity:0.6, fontSize:10 }}> ({coords.lat.toFixed(3)}°, {coords.lon.toFixed(3)}°)</span>
        </Alerta>
      )}
      {!coords && (
        <div style={{ fontFamily:C.font, fontSize:9, color:C.blue, marginBottom:8, padding:"8px 12px", background:`${C.blue}06`, border:`1px solid ${C.blue}20`, borderRadius:8 }}>
          ✅ <strong>Sin GPS funciona igual.</strong> Seleccioná <strong>Zona</strong> y <strong>Provincia</strong> abajo — el sistema usa datos climáticos históricos de esa región.
          El GPS solo agrega temperatura y NDVI en tiempo real del satélite.
        </div>
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
      <SelectF label="ZONA" value={form.zona} onChange={v=>set("zona",v)} options={[
        ["NEA","NEA"],["Pampa Húmeda","Pampa Húmeda"],["NOA","NOA"],
        ["Paraguay Oriental","Paraguay Oriental"],["Chaco Paraguayo","Chaco Paraguayo"],
        ["Brasil (Cerrado)","Brasil (Cerrado)"],["Bolivia (Llanos)","Bolivia (Llanos)"],
      ]} />
      <SelectF label="PROVINCIA / REGIÓN" value={form.provincia} onChange={v=>set("provincia",v)} options={[
        ["Corrientes","Corrientes"],["Chaco","Chaco"],["Formosa","Formosa"],
        ["Entre Ríos","Entre Ríos"],["Santa Fe","Santa Fe"],
        ["Santiago del Estero","Santiago del Estero"],["Salta","Salta"],
        ["Buenos Aires","Buenos Aires"],["Córdoba","Córdoba"],["La Pampa","La Pampa"],
        ["Paraguay Oriental","Paraguay Oriental"],["Chaco Paraguayo","Chaco Paraguayo"],
        ["Mato Grosso do Sul (BR)","Mato Grosso do Sul (BR)"],
        ["Santa Cruz / Beni (BO)","Santa Cruz / Beni (BO)"],
      ]} />
      <SelectF label="ENSO" value={form.enso} onChange={v=>set("enso",v)} options={[
        ["neutro","Neutro"],["nino","El Niño (+25% oferta)"],["nina","La Niña (−25% oferta)"],
      ]} />
      <Input label="PRODUCTOR / ESTABLECIMIENTO" value={form.nombreProductor} onChange={v=>set("nombreProductor",v)} placeholder="Nombre del establecimiento" />
      <Input id="campo-localidad" label="LOCALIDAD / PARAJE" value={form.localidad} onChange={v=>set("localidad",v)} placeholder="Ej: Charata, Clorinda, Concepción…" sub="Para contexto geográfico en el informe" />

      {/* ── MÓDULO DIAGNÓSTICO TOROS ── */}
      {parseInt(form.torosN) > 0 && (
        <div style={{ background:C.card2, border:`1px solid ${C.blue}30`, borderRadius:12, padding:14, marginTop:4 }}>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.blue, letterSpacing:1, marginBottom:10 }}>🐂 DIAGNÓSTICO PREPARO DE SERVICIO — TOROS</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <SelectF label="CC TOROS (promedio actual)" value={form.torosCC||"4.5"} onChange={v=>set("torosCC",v)} options={[
              ["3.0","CC 3.0 — Muy flaco 🔴"],["3.5","CC 3.5 — Flaco 🔴"],
              ["4.0","CC 4.0 — Regular ⚠"],["4.5","CC 4.5 — Aceptable"],
              ["5.0","CC 5.0 — Óptimo ✓"],["5.5","CC 5.5 — Muy bueno ✓"],["6.0","CC 6.0 — Exceso"],
            ]} />
            <SelectF label="DISTRIBUCIÓN EN LOTES" value={form.torosLote||"si"} onChange={v=>set("torosLote",v)} options={[
              ["si","Todos en 1 lote con las vacas"],
              ["distribuidos","Distribuidos en varios lotes"],
            ]} />
          </div>
          {form.torosLote === "distribuidos" && (
            <Input label="CANTIDAD DE LOTES (con toros)" value={form.torosLotes||""} onChange={v=>set("torosLotes",v)} placeholder="Ej: 3" type="number" sub="Verificar que cada lote tiene al menos 1 toro" />
          )}
          {/* Diagnóstico automático */}
          {(() => {
            const ccT = parseFloat(form.torosCC) || 4.5;
            const nT  = parseInt(form.torosN) || 0;
            const nV  = parseInt(form.vacasN) || 0;
            const nLotes = parseInt(form.torosLotes) || 1;
            const relAT  = form.torosLote === "distribuidos" && nLotes > 1
              ? Math.round(nV / nT) + ` (promedio — verificar ${nLotes} lotes individualmente)`
              : nV > 0 && nT > 0 ? Math.round(nV / nT) + ":1" : "—";
            const diasHastaServ = cadena?.diasPartoTemp ? Math.max(0, Math.round(cadena.diasPartoTemp / 30)) : null;
            const diasNeeded    = Math.max(0, Math.round((5.5 - ccT) / 0.018)); // 0.018 CC/día con suplementación
            return (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:8 }}>
                  <div style={{ background:`${C.blue}08`, borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                    <div style={{ fontFamily:C.font, fontSize:18, color:ccT>=5.0?C.green:ccT>=4.5?C.amber:C.red, fontWeight:700 }}>{ccT}</div>
                    <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>CC actual</div>
                  </div>
                  <div style={{ background:`${C.blue}08`, borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                    <div style={{ fontFamily:C.font, fontSize:14, color:C.blue, fontWeight:700 }}>{relAT}</div>
                    <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>Relación toro:vaca</div>
                  </div>
                  <div style={{ background:`${C.blue}08`, borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                    <div style={{ fontFamily:C.font, fontSize:18, color:ccT>=5.0?C.green:C.red, fontWeight:700 }}>
                      {ccT >= 5.0 ? "✓" : `−${diasNeeded}d`}
                    </div>
                    <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>{ccT>=5.0?"Listo serv.":"días para CC 5.5"}</div>
                  </div>
                </div>
                {ccT < 5.0 && (
                  <Alerta tipo="warn">
                    🐂 Toros CC {ccT} → objetivo CC 5.5 al servicio. Necesitan suplementación proteica ({((parseFloat(form.pvVacaAdulta)||320)*1.3*0.003).toFixed(1)} kg/día expeller girasol) por {diasNeeded} días antes del entore. Un toro flaco reduce la detección de celo y fertilidad espermática.
                  </Alerta>
                )}
                {parseInt(form.vacasN)/parseInt(form.torosN) > 30 && (
                  <Alerta tipo="warn">
                    Relación toro:vaca &gt; 30:1 — riesgo de vacas no servidas en los primeros 21 días. Revisar ESAN y libido antes del servicio.
                  </Alerta>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );

  // ── PASO 1: RODEO ─────────────────────────────────────────────
  const renderRodeo = () => (
    <div>
      <SelectF label="BIOTIPO" value={form.biotipo} onChange={v=>set("biotipo",v)}
        groups={[
          { label:"── Cebú puro (NEA tropical) ──", opts:[
            ["Nelore",           "Nelore (Zebu)  ← base NEA/BR"],
            ["Brahman",          "Brahman puro"],
            ["Indobrasil",       "Indobrasil"],
            ["Gyr / Guzerat",    "Gyr / Guzerat"],
          ]},
          { label:"── F1 — cruza comercial más común ──", opts:[
            ["F1 Nelore × Angus",    "F1 Nelore × Angus  ← heterosis máxima"],
            ["F1 Nelore × Hereford", "F1 Nelore × Hereford"],
          ]},
          { label:"── Brangus (Angus × Brahman) ──", opts:[
            ["Brangus 3/8",      "Brangus 3/8 Cebú  ← más común AR"],
            ["Brangus 5/8",      "Brangus 5/8 Cebú"],
          ]},
          { label:"── Braford / Bradford (Hereford × Cebú) ──", opts:[
            ["Braford 3/8",      "Braford 3/8  ← UY/BR/AR"],
            ["Braford 5/8",      "Braford 5/8"],
            ["Bradford 3/8",     "Bradford 3/8  (AR — Hereford×Brahman)"],
            ["Bradford 5/8",     "Bradford 5/8"],
          ]},
          { label:"── Británicas puras (sur, templado) ──", opts:[
            ["Aberdeen Angus",   "Aberdeen Angus"],
            ["Hereford",         "Hereford"],
          ]},
          { label:"── Europeas continentales ──────", opts:[
            ["Limousin",         "Limousin"],
            ["Charolais",        "Charolais"],
            ["Simmental",        "Simmental"],
            ["Simbrah",          "Simbrah (Simmental×Brahman)"],
          ]},
          { label:"── Tropicales adaptadas ─────────", opts:[
            ["Bonsmara",         "Bonsmara"],
            ["Senepol",          "Senepol"],
            ["Beefmaster",       "Beefmaster"],
          ]},
          { label:"── Sin dato / promedio ──────────", opts:[
            ["Cruza comercial",  "Cruza comercial (promedio)"],
          ]},
        ]}
        sub="Bradford/Braford = Hereford × Brahman · Brangus = Angus × Brahman"
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
        <Input label="VACAS"  value={form.vacasN}  onChange={v=>set("vacasN",v)}  placeholder="200" type="number" />
        <Input label="TOROS"  value={form.torosN}  onChange={v=>set("torosN",v)}  placeholder="8"   type="number" />
      </div>
      <Input label="PV VACA ADULTA (kg)"    value={form.pvVacaAdulta} onChange={v=>set("pvVacaAdulta",v)} placeholder="320" type="number" />
      <Input label="PREÑEZ HISTÓRICA (%)"   value={form.prenez}       onChange={v=>set("prenez",v)}       placeholder="75"  type="number" />
      <Input label="% DESTETE HISTÓRICO"    value={form.pctDestete}   onChange={v=>set("pctDestete",v)}   placeholder="88"  type="number" />
      <SelectF label="ESTADO REPRODUCTIVO ACTUAL" value={form.eReprod} onChange={v=>set("eReprod",v)} options={[
        "Gestación temprana (1–4 meses)","Gestación media (5–7 meses)","Preparto (último mes)",
        "Lactación con ternero al pie","Vaca seca sin ternero",
      ].map(e=>[e,e])} />
      <Input label="SERVICIO — INICIO" value={form.iniServ} onChange={v=>set("iniServ",v)} type="date" />
      <Input label="SERVICIO — FIN"    value={form.finServ} onChange={v=>set("finServ",v)} type="date" />
      <SelectF label="EDAD AL PRIMER ENTORE (política del establecimiento)"
        value={form.edadPrimerEntore}
        onChange={v=>set("edadPrimerEntore",v)}
        sub="Estándar zona semiárida NEA/NOA: 24 meses. 18 meses requiere condición corporal ≥ 5.5 al entore."
        options={[
          ["13","13 meses — muy temprano (riesgo alta tasa V2S)"],
          ["15","15 meses — temprano (requiere manejo nutricional preciso)"],
          ["15","15 meses — muy temprano (solo razas precoses con CC ≥5.5)"],
          ["18","18 meses — temprano (requiere CC ≥5.5 y buena recría)"],
          ["24","24 meses — estándar NEA/NOA zona semiárida ← recomendado"],
          ["27","27 meses — tardío (mayor certeza, más costo recría)"],
          ["27","27 meses — muy tardío"],
        ]}
      />
      {form.edadPrimerEntore && (
        <div style={{ background:C.card2, borderRadius:10, padding:10, marginBottom:12, border:`1px solid ${C.border}` }}>
          {(() => {
            const meses = parseInt(form.edadPrimerEntore) || 18;
            const pvMin = Math.round((parseFloat(form.pvVacaAdulta)||320) * 0.60);
            const color = meses <= 15 ? C.amber : meses >= 24 ? C.blue : C.green;
            const msg   = meses <= 13
              ? "⚠️ Entore muy temprano — alta probabilidad de vacas 2° servicio problemáticas el año siguiente si no llegan al 60% PV"
              : meses <= 15
              ? "Entore temprano — requiere que la vaquillona llegue a " + pvMin + "kg al servicio. Suplementación invierno crítica."
              : meses <= 18
              ? "Entore estándar NEA — objetivo: " + pvMin + "kg al servicio (60% PV adulto)"
              : "Entore tardío — menor riesgo reproductivo pero mayor costo de recría. Vaquillona llega con más reservas.";
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
        <Input label="EDAD AL 1° MAYO (meses)" value={form.edadVaqMayo} onChange={v=>set("edadVaqMayo",v)} placeholder="8" type="number" sub="Define PV esperado y GDP necesario." />
        <SelectF label="TIPO DESTETE DE ORIGEN" value={form.tipoDesteteVaq} onChange={v=>set("tipoDesteteVaq",v)} options={[
          ["hiper","⚡ Hiperprecoz (50d) — mayor GDP compensatorio"],
          ["antic","🔶 Anticipado (90d)"],
          ["trad", "🟢 Tradicional (180d) — GDP estándar"],
        ]} />
      </div>
    </div>
  );

  // ── PASO 2: CC ────────────────────────────────────────────────
  const renderCC = () => (
    <div>
      {/* Antigüedad de la medición — selector simple */}
      <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:12, marginBottom:12 }}>
        <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:8 }}>
          ¿CUÁNDO MEDISTE LA CC?
        </div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[["hoy","Esta semana","ok"],["15","Hace 15d","ok"],["30","Hace 30d","warn"],["60","Hace 60d","warn"],["90","3+ meses","error"]].map(([val,lbl,tipo]) => {
            const sel = (form.diasDesdeCC||"hoy") === val;
            const col = {ok:C.green,warn:C.amber,error:C.red}[tipo];
            return (
              <button key={val} onClick={() => set("diasDesdeCC", val)} style={{
                padding:"6px 10px", borderRadius:8, cursor:"pointer",
                fontFamily:C.font, fontSize:9, fontWeight:sel?700:400,
                background: sel ? col+"18" : "transparent",
                border:`1px solid ${sel ? col : C.border}`,
                color: sel ? col : C.textDim,
              }}>{lbl}</button>
            );
          })}
        </div>
        {(() => {
          const v = form.diasDesdeCC||"hoy";
          const dias = v==="hoy"?3:parseInt(v)||0;
          if (dias<=15) return (
            <div style={{ fontFamily:C.font, fontSize:9, color:C.green, marginTop:6 }}>✓ CC considerada actual — análisis confiable</div>
          );
          const bt = getBiotipo(form.biotipo);
          const caida = (dias/30 * 0.40 * bt.movCC).toFixed(1);
          return (
            <Alerta tipo={dias>=60?"error":"warn"} style={{marginTop:6}}>
              CC medida hace ~{dias} días. En lactación puede haber caído hasta −{caida} CC.
              {dias>=60?" Medirla nuevamente da mayor precisión al análisis.":" Aceptable si el rodeo está seco o en gestación."}
            </Alerta>
          );
        })()}
      </div>
      <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:12 }}>DISTRIBUCIÓN CC DEL RODEO</div>
      <DistCC dist={form.distribucionCC} onChange={v=>setDist("distribucionCC",v)} label="" />

      {ccPondVal > 0 && tray && (
        <div style={{ marginTop:14 }}>
          {/* Trayectoria completa CC */}
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1, marginBottom:8 }}>
            TRAYECTORIA CC PROYECTADA
          </div>

          {/* Flecha visual de trayectoria */}
          <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 10px", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap", justifyContent:"space-between" }}>
              {[
                { label:"HOY",   val:ccPondVal.toFixed(1), color:smf(ccPondVal,4.5,5.5) },
                { label:"PARTO", val:tray.ccParto,         color:smf(parseFloat(tray.ccParto),4.5,5.0) },
                { label:"MÍN.",  val:tray.ccMinLact,       color:smf(parseFloat(tray.ccMinLact),3.5,4.5) },
                { label:"SERV.", val:tray.ccServ,          color:smf(parseFloat(tray.ccServ),4.5,5.0) },
              ].map((item, i, arr) => (
                <React.Fragment key={item.label}>
                  <div style={{ textAlign:"center", minWidth:42 }}>
                    <div style={{ fontFamily:C.font, fontSize:18, fontWeight:700, color:item.color, lineHeight:1 }}>{item.val}</div>
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
            <MetricCard label="CC AL PARTO"
              value={tray.ccParto}
              color={smf(parseFloat(tray.ccParto),4.5,5.0)}
              sub={parseFloat(tray.ccParto)<4.5?"⚠ Riesgo anestro prolongado":parseFloat(tray.ccParto)>=5.0?"✓ Óptimo":"Aceptable"} />
            <MetricCard label="CC MÍN. LACTACIÓN"
              value={tray.ccMinLact}
              color={smf(parseFloat(tray.ccMinLact),3.5,4.0)}
              sub={`Caída: −${tray.caidaLact} unidades CC`} />
            <MetricCard label="CC AL SERVICIO"
              value={tray.ccServ}
              color={smf(parseFloat(tray.ccServ),4.5,5.0)}
              sub={parseFloat(tray.ccServ)>=5.0?"→ Preñez ≥88%":parseFloat(tray.ccServ)>=4.5?"→ Preñez 80–87%":parseFloat(tray.ccServ)>=4.0?"→ Preñez ~70%":parseFloat(tray.ccServ)>=3.5?"→ Preñez ~50% ⚠":""+"→ Preñez <30% 🔴"} />
            <MetricCard label="PREÑEZ ESTIMADA"
              value={tray.pr+"%"}
              color={smf(tray.pr,35,55)}
              sub={`Anestro posparto: ${tray.anestro?.dias}d`} />
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
                <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>Supervivencia: Rosello Brajovich et al. 2025</div>
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
                    <div style={{ padding:"8px 12px", display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                      {[["PARTO",g.ccParto,4.5,5.0],["MÍN.",g.ccMinLact,3.5,4.0],["SERV.",g.ccServ,4.5,5.0]].map(([l,v,b,a])=>(
                        <div key={l} style={{ textAlign:"center" }}>
                          <div style={{ fontFamily:C.font, fontSize:15, fontWeight:700, color:smf(parseFloat(v),b,a) }}>{v}</div>
                          <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>{l}</div>
                        </div>
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
      <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:12 }}>MODALIDAD DE DESTETE</div>
      <Slider label="🟢 Tradicional (180d)" value={parseFloat(form.destTrad)||0}  min={0} max={100} step={10} onChange={v=>set("destTrad",v)}  unit="%" color={C.green} />
      <Slider label="🔶 Anticipado (90d)"   value={parseFloat(form.destAntic)||0} min={0} max={100} step={10} onChange={v=>set("destAntic",v)} unit="%" color={C.amber} />
      <Slider label="⚡ Hiperprecoz (50d)"  value={parseFloat(form.destHiper)||0} min={0} max={100} step={10} onChange={v=>set("destHiper",v)} unit="%" color={C.red}   />
      {(parseFloat(form.destTrad)||0)+(parseFloat(form.destAntic)||0)+(parseFloat(form.destHiper)||0) !== 100 && (
        <Alerta tipo="warn">La suma debe ser 100% (actual: {(parseFloat(form.destTrad)||0)+(parseFloat(form.destAntic)||0)+(parseFloat(form.destHiper)||0)}%)</Alerta>
      )}

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
            <Input label="% REPOSICIÓN" value={form.pctReposicion} onChange={v=>set("pctReposicion",v)} placeholder="20" type="number" />
            <MetricCard label="VAQUILLAS" value={nVaqRepos} color={C.green} />
          </div>
          {tcSave?.pvMayoPond > 0 && (
            <div style={{ background:`${C.green}08`, border:`1px solid ${C.green}25`, borderRadius:10, padding:10, marginBottom:10 }}>
              <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, marginBottom:3 }}>PV entrada mayo 1°inv</div>
              <div style={{ fontFamily:C.font, fontSize:22, color:C.green, fontWeight:700 }}>{tcSave.pvMayoPond} kg</div>
            </div>
          )}
          {vaq1E && vaq1E.mensaje && <Alerta tipo="ok">{vaq1E.mensaje}</Alerta>}
          {vaq1E && !vaq1E.mensaje && (
            <div style={{ padding:"8px 12px", background:`${C.green}06`, border:`1px solid ${C.green}20`, borderRadius:8, marginBottom:8 }}>
              <div style={{ fontFamily:C.font, fontSize:9, color:C.green }}>
                📊 GDP proyectado: <strong>{vaq1E.gdpReal} g/día</strong> · PV agosto: <strong>{vaq1E.pvSal} kg</strong>
              </div>
              <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginTop:2 }}>
                Proyección <em>solo con pasto</em> — sin suplemento cargado todavía
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

      {/* Vaquillona 2° invierno */}
      <details open style={{ marginBottom:10 }}>
        <summary style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", cursor:"pointer", listStyle:"none", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:C.font, fontSize:11, color:C.green, fontWeight:600 }}>🐂 VAQ. 2° INVIERNO · {form.vaq2N?`${form.vaq2N} cab.`:"Ingresar cantidad"}</span>
        </summary>
        <div style={{ background:C.card2, borderRadius:"0 0 12px 12px", padding:14, border:`1px solid ${C.border}`, borderTop:"none" }}>
          {vaq2E?._aviso && <Alerta tipo="warn">{vaq2E._aviso}</Alerta>}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <Input label="CANTIDAD"    value={form.vaq2N}  onChange={v=>set("vaq2N",v)}  placeholder="30"  type="number" />
            <MetricCard label="PV ENTRADA (kg)" value={pvEntradaVaq2||"—"} color={C.green} sub="Auto desde Vaq1" />
          </div>
          {vaq2E && !vaq2E._aviso && (
            <div>
              {vaq2E.pvMayo2Inv > 0 && (
                <div style={{ background:`${C.blue}08`, border:`1px solid ${C.blue}25`, borderRadius:10, padding:10, marginBottom:10 }}>
                  <div style={{ fontFamily:C.font, fontSize:9, color:C.blue, letterSpacing:1, marginBottom:3 }}>PV MAYO 2° INVIERNO (agosto + 270d × 300g/d)</div>
                  <div style={{ fontFamily:C.font, fontSize:20, color:C.blue, fontWeight:700 }}>{vaq2E.pvMayo2Inv} kg</div>
                  <div style={{ fontFamily:C.sans, fontSize:10, color:C.textFaint, marginTop:2 }}>Entrada real al 2° invierno</div>
                </div>
              )}
              {vaq2E && (
                <div style={{ padding:"8px 12px", background:`${C.blue}06`, border:`1px solid ${C.blue}20`, borderRadius:8 }}>
                  <div style={{ fontFamily:C.font, fontSize:9, color:C.blue }}>
                    📊 PV entrada: <strong>{pvEntradaVaq2||"—"} kg</strong> · PV entore proyectado: <strong style={{color:vaq2E.llegas?C.green:C.red}}>{vaq2E.pvEntore||"—"} kg</strong>
                    {vaq2E.llegas
                      ? <span style={{color:C.green}}> ✓ Llega al objetivo</span>
                      : <span style={{color:C.red}}> ⚠ No llega a {vaq2E.pvMinEntore} kg</span>}
                  </div>
                  <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginTop:2 }}>
                    Proyección <em>solo con pasto</em> — cargá suplemento en el paso siguiente
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </details>

      {/* Vacas 2° servicio */}
      <details style={{ marginBottom:10 }}>
        <summary style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", cursor:"pointer", listStyle:"none", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontFamily:C.font, fontSize:11, color:C.amber, fontWeight:600 }}>
            🔄 VACAS 2° SERVICIO · {form.v2sN ? `${form.v2sN} cab.` : "Ingresar cantidad"}
          </span>
          {form.v2sN && (
            <span style={{ marginLeft:"auto", fontFamily:C.font, fontSize:9,
              color: (() => {
                const r = calcV2S(form.v2sPV, form.pvVacaAdulta, form.cc2sDist?.[0]?.cc || "4.2", form.v2sTernero === "si", form.biotipo, cadena);
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
            <Input label="CANTIDAD (cab)" value={form.v2sN}  onChange={v=>set("v2sN",v)}  placeholder="20"  type="number" />
            <Input label="PV ACTUAL (kg)" value={form.v2sPV} onChange={v=>set("v2sPV",v)} placeholder="310" type="number"
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
                      <MetricCard label={deficit > 0 ? "DÉFICIT ACTUAL" : "BALANCE"}
                        value={deficit > 0 ? "−"+deficit.toFixed(1)+" Mcal" : "✓ OK"}
                        color={deficit > 0 ? C.red : C.green}
                        sub={deficit > 0 ? `Oferta pasto: ${oferta.toFixed(1)} Mcal` : "Sin déficit"} />
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
      "Pastizal natural NEA/Chaco":                 { cat:"pastizal", label:"Pastizal natural NEA/Chaco",        emoji:"🌿", fenologia:true,  altura:true,  pb:14, desc:"Calidad variable por fenología · estimación por altura" },
      "Megatérmicas C4 (gatton panic, brachiaria)": { cat:"c4",       label:"Megatérmicas C4 (gatton, brachia)",emoji:"🌱", fenologia:true,  altura:false, pb:22, desc:"Alta producción en verano · baja en invierno · fenología aplica" },
      "Pasturas templadas C3":                      { cat:"c3",       label:"Pasturas templadas C3",             emoji:"🌾", fenologia:false, altura:false, pb:16, desc:"Producción más estable · sin fenología estacional marcada" },
      "Mixta gramíneas+leguminosas":                { cat:"mixta",    label:"Mixta gramíneas + leguminosas",     emoji:"🌱", fenologia:false, altura:false, pb:18, desc:"PB alta por leguminosas · buena calidad todo el año" },
      "Bosque nativo / monte":                      { cat:"monte",    label:"Bosque nativo / monte",             emoji:"🌳", fenologia:false, altura:false, pb:2.5, desc:"Baja oferta · valor en sombra y refugio · no suplementa" },
      "Verdeo de invierno":                         { cat:"verdeo",   label:"Verdeo de invierno",                emoji:"🌾", fenologia:false, altura:false, pb:20, desc:"Avena/raigrás/triticale · PB alta · no requiere supl proteica" },
    };

    const haPot   = potreros.reduce((s,p)=>s+(parseFloat(p.ha)||0), 0);
    const haTotal = parseFloat(form.supHa) || haPot || 0;
    const cargaEV = haTotal > 0 ? ((parseInt(form.vacasN)||0) / haTotal).toFixed(2) : "—";
    const colorCarga = parseFloat(cargaEV) > 1.2 ? C.red : parseFloat(cargaEV) > 0.8 ? C.amber : C.green;

    return (
      <div>
        {/* ── Superficie total y carga ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          <Input label="SUPERFICIE GANADERA TOTAL (ha)" value={form.supHa} onChange={v=>set("supHa",v)} placeholder="500" type="number" sub="Superficie efectivamente pastoreada" />
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
          const rec = RECURSOS[p.veg] || RECURSOS["Pastizal natural NEA/Chaco"];
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

        <button onClick={()=>setPotreros(ps=>[...ps,{ha:"",veg:"Pastizal natural NEA/Chaco",fenol:"menor_10",altPasto:"",tipoPasto:"corto_denso"}])}
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
                <SelectF label="TIPO" value={form.verdeoTipo||"Avena/Cebadilla"} onChange={v=>set("verdeoTipo",v)} options={[
                  ["Avena/Cebadilla","Avena / Cebadilla"],["Raigrás","Raigrás anual"],
                  ["Triticale","Triticale"],["Consociado","Gramínea + leguminosa"],
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
  const renderAgua = () => <PanelAgua form={form} set={set} sat={sat} />;

  // ── PASO 6: SUPLEMENTACIÓN ────────────────────────────────────
  const renderSuplementacion = () => {
    // PV promedio por categoría (mayo-agosto)
    const pvVacaS   = parseFloat(form.pvVacaAdulta) || 320;
    const pvV2sS    = parseFloat(form.v2sPV) || Math.round(pvVacaS * 0.88);
    const pvToroS   = Math.round(pvVacaS * 1.3);
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
    const DURAC_SUPL = [
      ["90",  "90 días — jun-ago (mínimo)"],
      ["120", "120 días — may-ago (recomendado)"],
      ["150", "150 días — may-sep (intensivo)"],
      ["180", "180 días — abr-sep (completo)"],
    ];

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
        {/* ── Duración campaña de suplementación — afecta balance y costos ── */}
        <div style={{ background:T.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 14px", marginBottom:12, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, flexShrink:0 }}>
            DURACIÓN CAMPAÑA INVERNAL
          </div>
          <div style={{ display:"flex", gap:6, flex:1, flexWrap:"wrap" }}>
            {DURAC_SUPL.map(([val, lbl]) => (
              <button key={val} onClick={() => set("diasSuplInv", val)} style={{
                padding:"5px 10px", borderRadius:8, cursor:"pointer",
                fontFamily:C.font, fontSize:9,
                background: (form.diasSuplInv||"90") === val ? `${C.green}20` : "transparent",
                border:`1px solid ${(form.diasSuplInv||"90") === val ? C.green : C.border}`,
                color: (form.diasSuplInv||"90") === val ? C.green : C.textDim,
              }}>{val}d</button>
            ))}
          </div>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>
            {DURAC_SUPL.find(([v]) => v === (form.diasSuplInv||"90"))?.[1] || "90 días — jun-ago"}
          </div>
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
            alertas.push({ tipo:"warn", msg:"Vaq2° SIEMPRE necesita suplementación — sin ella solo logra 120-200 g/d en invierno NEA" });
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

        {/* ── STOCK DE ALIMENTOS ── */}
        {(() => {
          const stockAlim = form.stockAlim || [];
          const ALIM_NOMBRES = [
            "Expeller girasol","Expeller soja","Expeller algodón",
            "Sorgo grano","Maíz grano","Semilla algodón","Pellet trigo",
            "Rollo silaje maíz","Urea tamponada",
          ];
          // Calcular demanda total del plan (kg/día × 90 días invierno)
          const CATS_STOCK = [
            // vacas: NO van aquí — herramienta = destete, no suplemento
            // suplemento preparto (sin ternero) se modela en trayectoria CC
            { sK:"supl_v2s",   dK:"dosis_v2s",   n: parseInt(form.v2sN)||0   },
            { sK:"supl_toros", dK:"dosis_toros", n: parseInt(form.torosN)||0 },
            { sK:"supl_vaq2",  dK:"dosis_vaq2",  n: parseInt(form.vaq2N)||0  },
            { sK:"supl_vaq1",  dK:"dosis_vaq1",  n: Math.round((parseInt(form.vacasN)||0)*(parseFloat(form.pctReposicion)||20)/100) },
            { sK:"supl_ternero",dK:"dosis_ternero",n:0 },
          ];
          const demandaPorAlim = {};
          CATS_STOCK.forEach(c => {
            const alim = form[c.sK];
            if (!alim || !c.n) return;
            const dosis = parseFloat(form[c.dK]) || 0;
            if (!dosis) return;
            if (!demandaPorAlim[alim]) demandaPorAlim[alim] = 0;
            demandaPorAlim[alim] += dosis * c.n * 90; // 90 días invierno
          });

          return (
            <div style={{ background:C.card2, border:`1px solid ${C.amber}30`, borderRadius:12, padding:14, marginBottom:12 }}>
              <div style={{ fontFamily:C.font, fontSize:9, color:C.amber, letterSpacing:1, marginBottom:10 }}>
                📦 STOCK DE ALIMENTOS — Plan invierno (90 días)
              </div>
              {/* Tabla demanda */}
              {Object.keys(demandaPorAlim).length > 0 && (
                <div style={{ marginBottom:10 }}>
                  <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginBottom:6 }}>DEMANDA CALCULADA DEL PLAN</div>
                  {Object.entries(demandaPorAlim).map(([alim, kgTotal]) => {
                    const stockItem = stockAlim.find(s => s.alimento === alim);
                    const stockKg   = stockItem ? parseFloat(stockItem.toneladas) * 1000 : 0;
                    const deficit   = stockKg > 0 ? kgTotal - stockKg : null;
                    return (
                      <div key={alim} style={{
                        display:"flex", justifyContent:"space-between", alignItems:"center",
                        padding:"6px 10px", borderRadius:8, marginBottom:4,
                        background: deficit !== null && deficit > 0 ? `${C.red}08` : `${C.green}06`,
                        border:`1px solid ${deficit !== null && deficit > 0 ? C.red+"25" : C.green+"20"}`,
                      }}>
                        <span style={{ fontFamily:C.font, fontSize:10, color:C.text }}>{alim}</span>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontFamily:C.font, fontSize:11, color:C.amber, fontWeight:700 }}>
                            {(kgTotal/1000).toFixed(1)} t necesarias
                          </div>
                          {deficit !== null && (
                            <div style={{ fontFamily:C.font, fontSize:9, color: deficit > 0 ? C.red : C.green }}>
                              {deficit > 0 ? `⚠ Faltan ${(deficit/1000).toFixed(1)} t` : `✓ Stock suficiente (+${(Math.abs(deficit)/1000).toFixed(1)} t extra)`}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Ingreso de stock */}
              <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginBottom:8 }}>STOCK DISPONIBLE HOY (toneladas)</div>
              <div style={{ fontFamily:C.sans, fontSize:10, color:C.textDim, marginBottom:10, lineHeight:1.4 }}>
                🔸 Resaltados = usados en tu plan · Los demás también pueden cargarse
              </div>
              {ALIM_NOMBRES.map(alim => {
                const item = stockAlim.find(s => s.alimento === alim) || { alimento:alim, toneladas:"" };
                const demanda = demandaPorAlim[alim];
                const stockKg = item.toneladas ? parseFloat(item.toneladas) * 1000 : 0;
                const deficit = demanda && stockKg > 0 ? demanda - stockKg : null;
                return (
                  <div key={alim} style={{
                    display:"flex", alignItems:"center", gap:8, marginBottom:8,
                    padding:"8px 10px", borderRadius:8,
                    background: demanda ? `${C.amber}08` : "transparent",
                    border:`1px solid ${demanda ? C.amber+"30" : C.border}`,
                  }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:C.font, fontSize:10, color: demanda ? C.text : C.textFaint, fontWeight: demanda ? 600 : 400 }}>{alim}</div>
                      {demanda && <div style={{ fontFamily:C.font, fontSize:8, color:C.amber }}>Necesitás {(demanda/1000).toFixed(1)} t</div>}
                      {deficit !== null && <div style={{ fontFamily:C.font, fontSize:8, color: deficit > 0 ? C.red : C.green }}>{deficit > 0 ? `⚠ Faltan ${(deficit/1000).toFixed(1)} t` : `✓ Stock OK`}</div>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                      <input
                        type="number" step="0.5" min="0"
                        value={item.toneladas}
                        onChange={e => {
                          const val = e.target.value;
                          const newStock = [...(form.stockAlim||[]).filter(s => s.alimento !== alim)];
                          if (val) newStock.push({ alimento:alim, toneladas:val });
                          set("stockAlim", newStock);
                        }}
                        placeholder="0.0"
                        style={{ width:70, background:C.card, border:`1px solid ${demanda ? C.amber+"60" : C.border}`,
                          borderRadius:6, color:C.text, padding:"6px 8px", fontFamily:C.font, fontSize:12 }}
                      />
                      <span style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>t</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}


      </div>
    );
  };

  // ── PASO 7: ANÁLISIS ──────────────────────────────────────────
  const renderAnalisis = () => (
    <div>
      {/* ── SEMÁFORO DIAGNÓSTICO — simple y directo ── */}
      {motor && (() => {
        const nP1 = alertasMotor.filter(a=>a.tipo==="P1").length;
        const nP2 = alertasMotor.filter(a=>a.tipo==="P2").length;
        const colSem = nP1 > 0 ? C.red : nP2 > 0 ? C.amber : C.green;
        const textoSem = nP1 > 0
          ? `${nP1} problema${nP1>1?"s":""} urgente${nP1>1?"s":""} que afectan la preñez`
          : nP2 > 0
          ? `${nP2} punto${nP2>1?"s":""} a corregir antes del servicio`
          : "Sistema dentro de parámetros técnicos";
        const prenezActual = tray?.pr ?? null;
        const ccServActual = tray?.ccServ ?? null;
        return (
          <div style={{ background:`${colSem}08`, border:`1px solid ${colSem}30`, borderRadius:14, padding:14, marginBottom:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <div style={{ width:14, height:14, borderRadius:"50%", background:colSem, flexShrink:0, boxShadow:`0 0 8px ${colSem}60` }} />
              <div style={{ fontFamily:C.sans, fontSize:13, color:C.text, fontWeight:600, flex:1 }}>{textoSem}</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              <div style={{ textAlign:"center", padding:"8px 4px", background:`${C.card}`, borderRadius:8 }}>
                <div style={{ fontFamily:C.font, fontSize:18, fontWeight:700, color:prenezActual>=55?C.green:prenezActual>=35?C.amber:C.red }}>{prenezActual ?? "—"}%</div>
                <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>preñez estimada</div>
              </div>
              <div style={{ textAlign:"center", padding:"8px 4px", background:`${C.card}`, borderRadius:8 }}>
                <div style={{ fontFamily:C.font, fontSize:18, fontWeight:700, color:parseFloat(ccServActual)>=4.5?C.green:C.red }}>{ccServActual ?? "—"}</div>
                <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>CC al servicio</div>
              </div>
              <div style={{ textAlign:"center", padding:"8px 4px", background:`${C.card}`, borderRadius:8 }}>
                <div style={{ fontFamily:C.font, fontSize:18, fontWeight:700, color:nP1>0?C.red:nP2>0?C.amber:C.green }}>{nP1+nP2}</div>
                <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>correcciones</div>
              </div>
            </div>
          </div>
        );
      })()}

      {!result && !loading && (
        <button onClick={runAnalysis} style={{ width:"100%", background:C.green, color:"#0b1a0c", padding:16, borderRadius:14, border:"none", fontFamily:C.font, fontSize:14, fontWeight:700, cursor:"pointer", letterSpacing:1, marginBottom:16 }}>
          ⚡ GENERAR ANÁLISIS TÉCNICO
        </button>
      )}
      {loading && <LoadingPanel msg={loadMsg} />}
      {result && !loading && (
        <div>
          {/* 3 tabs simplificados */}
          <div style={{ display:"flex", gap:6, marginBottom:14 }}>
            {[["acciones","🎯 Acciones"],["balance","📊 Balance"],["gei","🌿 GEI"],["seguimiento","📅 Campo"]].map(([k,l]) => (
              <button key={k} onClick={()=>setTab(k)} style={{
                flex:1, padding:"10px 6px", borderRadius:10, cursor:"pointer",
                background: tab===k ? C.green : "transparent",
                border:     tab===k ? `1px solid ${C.green}` : `1px solid ${C.border}`,
                color:      tab===k ? "#0b1a0c" : C.textDim,
                fontFamily: C.font, fontSize:10, fontWeight: tab===k ? 700 : 400,
              }}>{l}</button>
            ))}
          </div>

          {/* TAB ACCIONES — recomendaciones + informe expandible */}
          {tab === "acciones" && (
            <div>
              <PanelRecomendaciones motor={motor} form={form} />
              {/* Informe IA — expandible si existe, botón generarlo si no */}
              {result ? (
                <details style={{ marginTop:12 }}>
                  <summary style={{ fontFamily:C.font, fontSize:10, color:C.textFaint, cursor:"pointer", padding:"8px 12px", background:C.card2, borderRadius:8, border:`1px solid ${C.border}`, listStyle:"none" }}>
                    📄 Ver informe completo del asesor IA ▼
                  </summary>
                  <div style={{ marginTop:8 }}>
                    <RenderInforme texto={result} />
                  </div>
                </details>
              ) : (
                <button onClick={runAnalysis} style={{ width:"100%", background:`${C.green}15`, border:`1px solid ${C.green}40`, borderRadius:10, color:C.green, padding:13, fontFamily:C.font, fontSize:12, cursor:"pointer", marginTop:12, fontWeight:700, letterSpacing:1 }}>
                  ⚡ GENERAR INFORME IA
                </button>
              )}
              {/* PDF y CSV siempre disponibles */}
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <button onClick={descargarPDF} style={{ flex:2, background:`${C.blue}12`, border:`1px solid ${C.blue}35`, borderRadius:10, color:C.blue, padding:13, fontFamily:C.sans, fontSize:13, cursor:"pointer" }}>⬇ PDF</button>
                <button onClick={descargarCSV} style={{ flex:1, background:`${C.green}10`, border:`1px solid ${C.green}35`, borderRadius:10, color:C.green, padding:13, fontFamily:C.sans, fontSize:13, cursor:"pointer" }}>📊 CSV</button>
              </div>
              {result && (
                <button onClick={runAnalysis} style={{ width:"100%", background:`${C.green}06`, border:`1px solid ${C.border}`, borderRadius:10, color:C.textDim, padding:11, fontFamily:C.sans, fontSize:12, cursor:"pointer", marginTop:8 }}>🔄 Regenerar informe</button>
              )}
            </div>
          )}

          {/* TAB BALANCE — gráficos energéticos + CC grupos */}
          {tab === "balance" && (
            <div>
              <GraficoBalance form={form} sat={sat} cadena={cadena} tray={tray} motor={motor} />
              <div style={{ marginTop:14 }}>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1, marginBottom:8 }}>CC POR GRUPO AL SERVICIO</div>
                {dist?.grupos?.map((g, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:C.card2, borderRadius:10, padding:"10px 14px", marginBottom:6, border:`1px solid ${C.border}` }}>
                    <span style={{ fontFamily:C.font, fontSize:12, color:C.text, minWidth:36 }}>CC{g.ccHoy}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim }}>Parto {g.ccParto} → Mín {g.ccMinLact || "—"} → Serv {g.ccServ}</div>
                      <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>{g.pct}% del rodeo · {Math.round((parseInt(form.vacasN)||0)*parseFloat(g.pct)/100)} vacas</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:C.font, fontSize:16, fontWeight:700, color:smf(parseFloat(g.pr),60,80) }}>{g.pr}%</div>
                      <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>preñez est.</div>
                    </div>
                    <div style={{ fontFamily:C.sans, fontSize:9, color:g.urgencia==="urgente"?C.red:g.urgencia==="importante"?C.amber:C.green, textAlign:"center", minWidth:60 }}>{g.recDestete}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:12 }}>
                <SimuladorEscenarios form={form} cadena={cadena} baseParams={baseParams} sat={sat} />
              </div>
            </div>
          )}
          {tab === "gei" && (
            <PanelGEI form={form} motor={motor} tray={tray} sat={sat} />
          )}
          {tab === "seguimiento" && (
            <div>
              {/* ── Visitas de campo ── */}
              <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginBottom:12 }}>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.green, letterSpacing:1, marginBottom:10 }}>📅 REGISTRAR VISITA DE CAMPO</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  <Input label="FECHA" value={form._visitaFecha||""} onChange={v=>set("_visitaFecha",v)} type="date" />
                  <Input label="CC OBSERVADA (prom. rodeo)" value={form._visitaCC||""} onChange={v=>set("_visitaCC",v)} type="number" placeholder="4.5" />
                </div>
                <Input label="OBSERVACIÓN" value={form._visitaObs||""} onChange={v=>set("_visitaObs",v)} placeholder="Ej: vacas con buena cobertura, pasto escaso en potrero N…" />
                <button onClick={() => {
                  if (!form._visitaFecha) return;
                  const nueva = { fecha:form._visitaFecha, cc:form._visitaCC||"", obs:form._visitaObs||"" };
                  set("visitasCampo", [...(form.visitasCampo||[]), nueva]);
                  set("_visitaFecha",""); set("_visitaCC",""); set("_visitaObs","");
                }} style={{ width:"100%", background:`${C.green}15`, border:`1px solid ${C.green}40`, borderRadius:8, color:C.green, padding:10, fontFamily:C.font, fontSize:11, cursor:"pointer", marginTop:4 }}>
                  + Registrar visita
                </button>
              </div>
              {(form.visitasCampo||[]).length > 0 && (
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1, marginBottom:8 }}>HISTORIAL</div>
                  {[...(form.visitasCampo||[])].reverse().map((v, i) => {
                    const ccObsN = parseFloat(v.cc);
                    const diff   = ccObsN && ccPondVal ? (ccObsN - ccPondVal).toFixed(2) : null;
                    return (
                      <div key={i} style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:12, marginBottom:6 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontFamily:C.font, fontSize:11, color:C.text, fontWeight:600 }}>
                            {new Date(v.fecha+"T12:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"short",year:"numeric"})}
                          </span>
                          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                            {v.cc && <span style={{ fontFamily:C.font, fontSize:11, color:parseFloat(v.cc)>=4.5?C.green:C.red, fontWeight:700 }}>CC {v.cc}</span>}
                            {diff && <span style={{ fontFamily:C.font, fontSize:9, color:parseFloat(diff)>=0?C.green:C.amber }}>({parseFloat(diff)>=0?"+":""}{diff} vs plan)</span>}
                          </div>
                        </div>
                        {v.obs && <div style={{ fontFamily:C.sans, fontSize:11, color:C.textDim }}>{v.obs}</div>}
                        <button onClick={()=>set("visitasCampo",(form.visitasCampo||[]).filter((_,j)=>j!==(form.visitasCampo.length-1-i)))}
                          style={{ background:"none",border:"none",color:C.textFaint,cursor:"pointer",fontFamily:C.font,fontSize:9,marginTop:4 }}>✕ eliminar</button>
                      </div>
                    );
                  })}
                  {(form.visitasCampo||[]).filter(v=>v.cc).length >= 2 && (
                    <div style={{ background:C.card2, borderRadius:10, padding:14, border:`1px solid ${C.border}` }}>
                      <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1, marginBottom:8 }}>CC OBSERVADA vs PLAN</div>
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart data={(form.visitasCampo||[]).filter(v=>v.cc).map(v=>({
                          fecha:new Date(v.fecha+"T12:00:00").toLocaleDateString("es-AR",{day:"2-digit",month:"short"}),
                          ccObservada:parseFloat(v.cc), ccPlan:ccPondVal,
                        }))}>
                          <XAxis dataKey="fecha" tick={{fill:C.textFaint,fontSize:8}} />
                          <YAxis domain={[3,7]} tick={{fill:C.textFaint,fontSize:8}} />
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                          <Tooltip contentStyle={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,fontFamily:C.font,fontSize:10}} />
                          <Legend wrapperStyle={{fontFamily:C.font,fontSize:9}} />
                          <Line dataKey="ccObservada" name="CC campo" stroke={C.green} strokeWidth={2} dot={{r:4}} />
                          <Line dataKey="ccPlan" name="CC plan base" stroke={C.amber} strokeDasharray="5 3" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
              {/* Lista de compras semanal */}
              {(() => {
                const CATS_R = [
                  // vacas: herramienta = destete, no suplemento
                  { sK:"supl_v2s",     dK:"dosis_v2s",     n:parseInt(form.v2sN)||0     },
                  { sK:"supl_toros",   dK:"dosis_toros",   n:parseInt(form.torosN)||0   },
                  { sK:"supl_vaq2",    dK:"dosis_vaq2",    n:parseInt(form.vaq2N)||0    },
                  { sK:"supl_vaq1",    dK:"dosis_vaq1",    n:Math.round((parseInt(form.vacasN)||0)*(parseFloat(form.pctReposicion)||20)/100) },
                ];
                const demSem = {};
                CATS_R.forEach(c => {
                  const alim = form[c.sK]; if (!alim||!c.n) return;
                  const d = parseFloat(form[c.dK])||0; if (!d) return;
                  if (!demSem[alim]) demSem[alim] = 0;
                  demSem[alim] += d * c.n * 7;
                });
                if (Object.keys(demSem).length === 0) return (
                  <div style={{ fontFamily:C.sans, fontSize:12, color:C.textFaint, textAlign:"center", padding:20 }}>
                    Cargá el plan de suplementación en el paso 6 para ver la lista de compras
                  </div>
                );
                return (
                  <div style={{ background:`${C.green}06`, border:`1px solid ${C.green}25`, borderRadius:12, padding:14 }}>
                    <div style={{ fontFamily:C.font, fontSize:9, color:C.green, letterSpacing:1, marginBottom:10 }}>
                      🛒 LISTA DE COMPRAS — Necesidades semanales del plan
                    </div>
                    {Object.entries(demSem).map(([alim, kgSem]) => {
                      const stockItem = (form.stockAlim||[]).find(s=>s.alimento===alim);
                      const stockKg   = stockItem ? parseFloat(stockItem.toneladas)*1000 : null;
                      const semanas   = stockKg ? Math.floor(stockKg/kgSem) : null;
                      return (
                        <div key={alim} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6, padding:"8px 12px", background:C.card, borderRadius:8, border:`1px solid ${semanas!==null&&semanas<4?C.red+"30":C.border}` }}>
                          <div>
                            <div style={{ fontFamily:C.font, fontSize:10, color:C.text, fontWeight:600 }}>{alim}</div>
                            {semanas !== null && (
                              <div style={{ fontFamily:C.font, fontSize:8, color:semanas<4?C.red:C.green }}>
                                {semanas < 4 ? `⚠ Stock para ${semanas} semanas — reabastecer urgente` : `✓ Stock para ${semanas} semanas`}
                              </div>
                            )}
                            {semanas === null && <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>Sin stock registrado</div>}
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontFamily:C.font, fontSize:14, color:C.amber, fontWeight:700 }}>{(kgSem/1000).toFixed(2)} t/sem</div>
                            <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>{Math.round(kgSem)} kg/semana</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

        {/* ══ PROYECCIÓN VAQ1 y VAQ2 post suplementación ══ */}
        {(vaq1E || vaq2E) && (
          <div style={{ marginTop:16 }}>
            <div style={{ fontFamily:C.font, fontSize:9, color:C.green, letterSpacing:1, marginBottom:10 }}>
              📊 PROYECCIÓN CON SUPLEMENTACIÓN CARGADA
            </div>

            {/* Vaq1 */}
            {vaq1E && !vaq1E.mensaje && (
              <div style={{ background:`${C.amber}08`, border:`1px solid ${C.amber}30`, borderRadius:10, padding:12, marginBottom:10 }}>
                <div style={{ fontFamily:C.font, fontSize:10, color:C.amber, marginBottom:6, fontWeight:600 }}>
                  🐮 VAQUILLONA 1° INVIERNO
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  <MetricCard label="GDP PROYECTADO" value={(vaq1E.gdpReal||"—")+" g/d"} color={C.green} />
                  <MetricCard label="PV AGOSTO" value={(vaq1E.pvSal||"—")+" kg"} color={(vaq1E.pvSal||0)>=220?C.green:C.amber}
                    sub={(vaq1E.pvSal||0)>=220?"✓ Supera objetivo":"< 220 kg objetivo"} />
                </div>
                {/* Entore anticipado si supera 65% PV adulto */}
                {(vaq1E.pvSal||0) >= Math.round((parseFloat(form.pvVacaAdulta)||320)*0.65) ? (
                  <div style={{ background:`${C.green}10`, border:`1px solid ${C.green}30`, borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ fontFamily:C.font, fontSize:9, color:C.green, fontWeight:700, marginBottom:4 }}>
                      ✅ Supera 65% PV adulto — EVALUAR ENTORE ANTICIPADO
                    </div>
                    <div style={{ fontFamily:C.sans, fontSize:11, color:C.text, lineHeight:1.5 }}>
                      Con {vaq1E.pvSal} kg en agosto ya está en condición para entore. Adelantar el servicio a <strong>agosto–septiembre</strong> de este año en lugar de esperar al servicio general del año siguiente. Ganás un ciclo productivo completo.
                    </div>
                  </div>
                ) : (
                  <Alerta tipo="warn">
                    Proyecta {vaq1E.pvSal} kg en agosto — revisar dosis de suplementación
                  </Alerta>
                )}
              </div>
            )}

            {/* Vaq2 — dos cuadrantes: agosto y entore */}
            {vaq2E && (
              <div style={{ background:`${C.blue}08`, border:`1px solid ${C.blue}30`, borderRadius:10, padding:12 }}>
                <div style={{ fontFamily:C.font, fontSize:10, color:C.blue, marginBottom:8, fontWeight:600 }}>
                  🐂 VAQUILLONA 2° INVIERNO
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  {/* Cuadrante agosto */}
                  <div style={{ background:C.card, borderRadius:8, padding:"10px 12px", border:`1px solid ${C.border}` }}>
                    <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, letterSpacing:1, marginBottom:4 }}>PESO AGOSTO</div>
                    <div style={{ fontFamily:C.font, fontSize:18, fontWeight:700,
                      color:(vaq2E.pvV2Agosto||0) >= Math.round((parseFloat(form.pvVacaAdulta)||320)*0.72) ? C.green : C.amber }}>
                      {vaq2E.pvV2Agosto || pvEntradaVaq2 || "—"} kg
                    </div>
                    <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>
                      obj: {Math.round((parseFloat(form.pvVacaAdulta)||320)*0.72)} kg (72% PV adulto)
                    </div>
                  </div>
                  {/* Cuadrante entore */}
                  <div style={{ background:C.card, borderRadius:8, padding:"10px 12px", border:`1px solid ${vaq2E.llegas?C.green:C.red}40` }}>
                    <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, letterSpacing:1, marginBottom:4 }}>PESO ENTORE</div>
                    <div style={{ fontFamily:C.font, fontSize:18, fontWeight:700, color:vaq2E.llegas?C.green:C.red }}>
                      {vaq2E.pvEntore||"—"} kg
                    </div>
                    <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>
                      obj: {vaq2E.pvMinEntore} kg (75% PV adulto)
                    </div>
                  </div>
                </div>
                {vaq2E.llegas ? (
                  <div style={{ padding:"6px 10px", background:`${C.green}10`, borderRadius:6, fontFamily:C.font, fontSize:9, color:C.green }}>
                    ✅ Llega al objetivo de entore con esta suplementación
                  </div>
                ) : (
                  <Alerta tipo="error">
                    No llega a {vaq2E.pvMinEntore} kg para el entore — revisar dosis de suplementación
                  </Alerta>
                )}
              </div>
            )}
          </div>
        )}
    </div>
  );

  const RENDERS = [renderUbicacion, renderRodeo, renderCC, renderCategorias, renderForraje, renderAgua, renderSuplementacion, renderAnalisis];

  // ══════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ══════════════════════════════════════════════════════════════
  if (!session) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ fontFamily:C.font, fontSize:28, color:C.green, marginBottom:8, letterSpacing:2 }}>🌾 AGROMIND</div>
      <div style={{ fontFamily:C.sans, fontSize:13, color:C.textDim, marginBottom:32 }}>PRO · v18</div>
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
          🌾 AGROMIND<span style={{ color:C.textDim, fontSize:10, marginLeft:6 }}>v14</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {ccPondVal > 0 && <Pill color={smf(ccPondVal,4.5,5.5)}>CC {ccPondVal.toFixed(1)}</Pill>}
          {evalAgua && evalAgua.cat.riesgo >= 2 && <Pill color={C.red}>💧{evalAgua.cat.label}</Pill>}
          {sanidad.alerts.length > 0 && <Pill color={C.red}>🩺{sanidad.alerts.length}</Pill>}
          <button onClick={()=>signOut()} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textDim, padding:"5px 10px", fontFamily:C.font, fontSize:10, cursor:"pointer" }}>
            salir
          </button>
        </div>
      </div>

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
