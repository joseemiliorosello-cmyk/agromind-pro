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
// ═══════════════════════════════════════════════════════════════════

// ─── BIOTIPOS ─────────────────────────────────────────────────────
const BIOTIPOS = {
  // ── Cebú puro ──────────────────────────────────────────────────
  "Brahman":              { movCC:0.70, recCC:0.85, umbralAnestro:2.8, factReq:0.90, nombre:"Brahman puro" },
  "Nelore":               { movCC:0.72, recCC:0.83, umbralAnestro:2.9, factReq:0.89, nombre:"Nelore" },
  "Indobrasil":           { movCC:0.71, recCC:0.84, umbralAnestro:2.8, factReq:0.90, nombre:"Indobrasil" },

  // ── Aberdeen Angus y cruces ─────────────────────────────────────
  "Aberdeen Angus":       { movCC:1.00, recCC:1.00, umbralAnestro:3.8, factReq:1.00, nombre:"Aberdeen Angus" },
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
// Fuente: SMN Argentina / datos normales 1991-2020
const CLIMA_HIST = {
  "Corrientes":  [{t:28,p:140},{t:27,p:130},{t:26,p:120},{t:22,p:100},{t:18,p:70},{t:14,p:50},{t:14,p:40},{t:16,p:50},{t:19,p:80},{t:23,p:110},{t:26,p:130},{t:28,p:140}],
  "Chaco":       [{t:29,p:130},{t:28,p:120},{t:27,p:110},{t:23,p:90}, {t:19,p:60},{t:15,p:35},{t:14,p:30},{t:16,p:40},{t:20,p:70},{t:25,p:100},{t:27,p:120},{t:29,p:130}],
  "Formosa":     [{t:30,p:135},{t:29,p:125},{t:28,p:115},{t:24,p:95}, {t:20,p:60},{t:15,p:32},{t:15,p:28},{t:17,p:38},{t:21,p:70},{t:26,p:100},{t:28,p:120},{t:30,p:135}],
  "Entre Ríos":  [{t:25,p:110},{t:24,p:100},{t:22,p:100},{t:18,p:90}, {t:14,p:70},{t:11,p:55},{t:10,p:45},{t:12,p:60},{t:15,p:80},{t:19,p:90}, {t:22,p:100},{t:25,p:110}],
  "Santa Fe":    [{t:26,p:115},{t:25,p:105},{t:23,p:105},{t:19,p:90}, {t:15,p:65},{t:12,p:50},{t:11,p:40},{t:13,p:55},{t:16,p:80},{t:20,p:95}, {t:24,p:110},{t:26,p:115}],
  "Santiago del Estero":[{t:30,p:90},{t:29,p:85},{t:28,p:80},{t:24,p:60},{t:19,p:40},{t:15,p:20},{t:14,p:15},{t:16,p:25},{t:20,p:50},{t:25,p:70},{t:28,p:85},{t:30,p:90}],
  "Salta":       [{t:25,p:180},{t:24,p:160},{t:23,p:120},{t:20,p:60}, {t:16,p:20},{t:13,p:10},{t:12,p:8}, {t:14,p:12},{t:18,p:30},{t:22,p:80}, {t:24,p:140},{t:25,p:170}],
  "Buenos Aires":[{t:23,p:90}, {t:22,p:85}, {t:20,p:95}, {t:16,p:90}, {t:12,p:70},{t:9, p:60},{t:8, p:55},{t:10,p:65},{t:13,p:75},{t:17,p:80}, {t:20,p:90}, {t:23,p:90}],
  "Córdoba":     [{t:25,p:95}, {t:24,p:90}, {t:22,p:95}, {t:17,p:75}, {t:13,p:50},{t:10,p:35},{t:9, p:30},{t:11,p:45},{t:15,p:65},{t:19,p:80}, {t:22,p:95}, {t:25,p:95}],
  "La Pampa":    [{t:23,p:70}, {t:22,p:65}, {t:20,p:75}, {t:15,p:60}, {t:11,p:40},{t:8, p:25},{t:7, p:22},{t:9, p:35},{t:12,p:50},{t:17,p:65}, {t:20,p:70}, {t:23,p:70}],
};

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
  const diasRecup  = Math.max(0, ((mesServ - mesDestete + 12) % 12) * 30);

  const mcalSuplInv   = mcalSuplemento(supl1, parseFloat(dosis1) || 0);
  let   ccServ        = ccDestete;
  for (let d = 0; d < diasRecup; d++) {
    const mes = (mesDestete + Math.floor(d / 30)) % 12;
    const t   = hist[mes]?.t || 20;
    // Tasa de recuperación: verano con buen pasto C4 = 0.015/día; invierno = 0.004/día
    const tasaRecup = t >= 25 ? 0.016 : t >= 20 ? 0.012 : t >= 15 ? 0.006 : 0.003;
    // Boost por suplemento invernal
    const boostSupl = mcalSuplInv > 0 ? Math.min(0.005, mcalSuplInv * 0.0015) : 0;
    ccServ += (tasaRecup + boostSupl + ajCarga / Math.max(1, diasRecup));
  }
  ccServ = parseFloat(Math.min(9, Math.max(1, ccServ)).toFixed(2));

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

  // CC al servicio
  const ccServ2 = parseFloat(Math.min(8, Math.max(1.5,
    ccMin2 + tR * 75
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
  const base = pv * 0.066 * Math.pow(Math.max(10, t) / 20, 1.1);
  const mult = lactando ? 1.55 : 1.0; // lactación eleva consumo 50–60% (NRC 2000)
  return Math.round(base * mult);
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
  const disponMSBase = calcDisponibilidadMS(form.altPasto, form.tipoPasto);
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
  const suplRodeoMcalDia = suplCats.reduce((acc,c) => {
    const s = SUPLEMENTOS[form[c.sk]];
    const d = parseFloat(form[c.dk]) || 0;
    return acc + (s ? s.em*d*c.n : 0);
  }, 0);

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
    const verdeoAp = tieneVerdeo
      ? (i >= verdeoMesInicio && i <= verdeoMesInicio+2 ? verdeoAporteMcalMes : 0) : 0;

    const ofertaTotal = ofPastoTotal + ccAporte + suplRodeoMcalDia + verdeoAp;
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
      suplAporte:+suplRodeoMcalDia.toFixed(0),
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
function Input({ label, value, onChange, placeholder, type = "text", sub, warn }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:5 }}>{label}</div>}
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
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

      {supl && (
        <Slider label="Dosis kg/vaca/día" value={dosis} min={0.1} max={5} step={0.1} onChange={onDosisChange} unit=" kg" color={color} />
      )}

      {supl && dosis > 0 && (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
          <Pill color={T.blue}>+{mcal.toFixed(1)} Mcal/v/d</Pill>
          <Pill color={color}>PB {s.pb}%</Pill>
          {sinc && <Pill color={sinc.eficiente ? T.green : T.red}>{sinc.eficiente ? "✓ Sincronía OK" : "⚠ Riesgo sincronía"}</Pill>}
        </div>
      )}

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
function GraficoBalance({ form, sat, cadena, tray, motor }) {
  const [vista, setVista] = React.useState("balance"); // balance | demanda | grupos
  const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const MESES_FULL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  // ── Oferta mensual con variación estacional REAL ──────────────────
  const ofertaArr = React.useMemo(() => calcOfertaMensualArray(
    form.vegetacion || "Pastizal natural NEA/Chaco",
    sat?.ndvi || 0.45,
    form.provincia || "Corrientes",
    form.enso || "neutro",
    form.fenologia
  ), [form.vegetacion, sat?.ndvi, form.provincia, form.enso, form.fenologia]);

  // ── Número de animales por categoría ────────────────────────────
  const nVacas  = motor?.nVacas ?? (parseInt(form.vacasN)   || 0);
  const nToros  = motor?.nToros ?? (parseInt(form.torosN)   || 0);
  const nV2s    = motor?.nV2s   ?? (parseInt(form.v2sN)     || 0);
  const nVaq2   = motor?.nVaq2  ?? (parseInt(form.vaq2N)    || 0);
  const nVaq1   = motor?.nVaq1  ?? Math.round(nVacas * (parseFloat(form.pctReposicion)||20)/100);
  const factAgua  = motor?.factorAgua  ?? 1.0;
  const factCargaG= motor?.factorCarga ?? 1.0;
  const pvVaq1G   = motor?.pvEntVaq1   ?? (parseFloat(form.vaq1PV) || Math.round((parseFloat(form.pvVacaAdulta)||320)*0.40));

  // Factores EV (equivalente vaca) por categoría
  const EV = { vacas:1.0, toros:1.4, v2s:1.1, vaq2:0.7, vaq1:0.4 };

  // ── Requerimientos Mcal/día por categoría ────────────────────────
  const pvVaca  = parseFloat(form.pvVacaAdulta) || 320;
  const reqVaca = (mes) => {
    // Varía con el mes según estado fisiológico (parto ≈ oct, serv ≈ dic-feb)
    const m = mes % 12;
    if (m >= 9 && m <= 11) return reqEM(pvVaca, "Lactación con ternero al pie", form.biotipo) || 18; // oct-dic lactación
    if (m >= 0 && m <= 2)  return reqEM(pvVaca, "Gestación media (5–7 meses)", form.biotipo) || 14;  // ene-mar gestación
    if (m >= 6 && m <= 8)  return reqEM(pvVaca, "Preparto (último mes)", form.biotipo) || 15;         // jul-sep preparto
    return reqEM(pvVaca, "Vaca seca sin ternero", form.biotipo) || 12;
  };
  const reqToro = reqEM(pvVaca * 1.3, "Vaca seca sin ternero", form.biotipo) || 14;
  const reqV2s  = reqEM(pvVaca * 0.88, "Vaca 1° parto lactando", form.biotipo) || 20;
  const pvVaq2  = parseFloat(form.vaq2PV) || Math.round(pvVaca * 0.65);
  const pvVaq1  = parseFloat(form.vaq1PV) || Math.round(pvVaca * 0.40);
  const reqVaq2 = reqEM(pvVaq2, "vaq2inv", form.biotipo) || 10;
  const reqVaq1 = reqEM(pvVaq1, "vaq1inv", form.biotipo) || 7;

  // ── Suplemento total rodeo Mcal/día ─────────────────────────────
  // Vacas: NO tienen suplemento de balance (herramienta = destete)
  // V2S/Toros/Vaq1/Vaq2: SÍ tienen suplemento porque sin ternero al pie
  const suplMcalDia = React.useMemo(() => {
    const cats = [
      { sK:"supl_v2s",     dK:"dosis_v2s",     n:nV2s    },
      { sK:"supl_toros",   dK:"dosis_toros",   n:nToros  },
      { sK:"supl_vaq2",    dK:"dosis_vaq2",    n:nVaq2   },
      { sK:"supl_vaq1",    dK:"dosis_vaq1",    n:nVaq1   },
    ];
    return cats.reduce((acc, c) => {
      const s = SUPLEMENTOS[form[c.sK]]; 
      const d = parseFloat(form[c.dK]) || 0;
      return acc + (s ? s.em * d * c.n : 0);
    }, 0);
  }, [form, nV2s, nToros, nVaq2, nVaq1]);

  // ── CC movilizada durante lactación (solo meses oct-dic) ────────
  const ccPondVal2 = ccPond(form.distribucionCC);
  const MCAL_CC = 5.6; // Mcal por 0.1 unidades CC = 56 Mcal/punto (NEA cruza)
  const mesesLactacion = parseFloat(tray?.mesesLact || 3);
  const caidaCC = parseFloat(tray?.caidaLact || 1.2);
  const ccMcalDia = nVacas > 0 ? (caidaCC * MCAL_CC * 10 / (mesesLactacion * 30)) * nVacas : 0;

  // ── Construir datos mensuales ────────────────────────────────────
  const dataMensual = MESES.map((mes, i) => {
    const supHa   = parseFloat(form.supHa) || 1;
    // Oferta pasto = Mcal/vaca/día × N vacas equivalentes totales
    const totalEV = nVacas*EV.vacas + nToros*EV.toros + nV2s*EV.v2s + nVaq2*EV.vaq2 + nVaq1*EV.vaq1;
    const ofertaVaca = ofertaArr[i] || 0;
    // Consumo voluntario real ajustado por factores del motor
    const fenolMes = ["menor_10","menor_10","10_25","10_25","25_50","mayor_50","mayor_50","mayor_50","25_50","10_25","menor_10","menor_10"][i];
    const cvPct  = {menor_10:2.8,"10_25":2.4,"25_50":2.0,mayor_50:1.6}[fenolMes]||2.4;
    const pbPasG = {menor_10:12,"10_25":9,"25_50":6,mayor_50:4}[fenolMes]||9;
    const digG   = {menor_10:68,"10_25":63,"25_50":58,mayor_50:52}[fenolMes]||63;
    const ofertaTotal = ofertaVaca * Math.max(1, totalEV) * factCargaG * factAgua;
    // CC movilizada solo en lactación (oct=9, nov=10, dic=11)
    const ccAporte  = (i >= 9 && i <= 11) ? ccMcalDia : 0;
    // Demanda por categoría
    const dVacas = nVacas * reqVaca(i);
    const dToros = nToros * reqToro;
    const dV2s   = nV2s   * reqV2s;
    const dVaq2  = nVaq2  * reqVaq2;
    const dVaq1  = nVaq1  * reqVaq1;
    const demanda = dVacas + dToros + dV2s + dVaq2 + dVaq1;
    const balance = ofertaTotal + ccAporte + suplMcalDia - demanda;
    return {
      mes, i,
      ofertaTotal: +ofertaTotal.toFixed(0),
      ccAporte:    +ccAporte.toFixed(0),
      suplAporte:  +suplMcalDia.toFixed(0),
      demanda:     +demanda.toFixed(0),
      dVacas:      +dVacas.toFixed(0),
      dToros:      +dToros.toFixed(0),
      dV2s:        +dV2s.toFixed(0),
      dVaq2:       +dVaq2.toFixed(0),
      dVaq1:       +dVaq1.toFixed(0),
      balance:     +balance.toFixed(0),
      deficit:     balance < 0,
      fenolMes, pbPasG, digG, cvPct,
    };
  });

  // ── Identificar meses críticos ───────────────────────────────────
  const mesesDeficit = dataMensual.filter(d => d.deficit);
  const peorMes = dataMensual.reduce((a, b) => b.balance < a.balance ? b : a, dataMensual[0]);
  const balanceInv = [5,6,7].reduce((s,i) => s + (dataMensual[i]?.balance||0), 0); // jun-ago

  // ── Grupos CC ────────────────────────────────────────────────────
  const distGrupos = form.distribucionCC || [];

  const COLORES = {
    oferta:"#7ec850", cc:"#e8a030", supl:"#4a9fd4", demanda:"#e05530",
    vacas:"#e8a030", toros:"#9b59b6", v2s:"#e05530", vaq2:"#4a9fd4", vaq1:"#7ec850",
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display:"flex", gap:4, marginBottom:12, flexWrap:"wrap" }}>
        {[["balance","⚡ Balance"],["calidad","🌿 Calidad"],["demanda","📊 Demanda"],["grupos","🐄 Grupos CC"]].map(([k,l]) => (
          <button key={k} onClick={()=>setVista(k)} style={{
            flex:1, padding:"6px 4px", borderRadius:8, cursor:"pointer", fontFamily:T.font, fontSize:9,
            minWidth:60,
            background: vista===k ? `${T.green}20` : "transparent",
            border:`1px solid ${vista===k ? T.green : T.border}`,
            color: vista===k ? T.green : T.textDim,
          }}>{l}</button>
        ))}
      </div>

      {/* ── SEMÁFORO DE BALANCE ────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:12 }}>
        <div style={{ background: mesesDeficit.length===0 ? `${T.green}10` : `${T.red}10`,
          border:`1px solid ${mesesDeficit.length===0 ? T.green : T.red}25`, borderRadius:10, padding:"8px 6px", textAlign:"center" }}>
          <div style={{ fontFamily:T.font, fontSize:20, color: mesesDeficit.length===0 ? T.green : T.red, fontWeight:700 }}>
            {mesesDeficit.length}
          </div>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>meses déficit</div>
        </div>
        <div style={{ background:`${T.red}10`, border:`1px solid ${T.red}25`, borderRadius:10, padding:"8px 6px", textAlign:"center" }}>
          <div style={{ fontFamily:T.font, fontSize:20, color: peorMes.balance < -500 ? T.red : T.amber, fontWeight:700 }}>
            {peorMes.balance < 0 ? peorMes.balance.toLocaleString() : "0"}
          </div>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>Mcal peor mes ({peorMes.mes})</div>
        </div>
        <div style={{ background: balanceInv >= 0 ? `${T.green}10` : `${T.red}10`,
          border:`1px solid ${balanceInv >= 0 ? T.green : T.red}25`, borderRadius:10, padding:"8px 6px", textAlign:"center" }}>
          <div style={{ fontFamily:T.font, fontSize:20, color: balanceInv >= 0 ? T.green : T.red, fontWeight:700 }}>
            {(balanceInv/1000).toFixed(1)}k
          </div>
          <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>Mcal Jun–Ago total</div>
        </div>
      </div>

      {/* ── VISTA BALANCE ─────────────────────────────────────── */}
      {vista === "balance" && (
        <div>
          <div style={{ background:T.card2, borderRadius:10, padding:14, border:`1px solid ${T.border}`, marginBottom:10 }}>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, letterSpacing:1, marginBottom:10 }}>
              BALANCE ENERGÉTICO MENSUAL — Mcal/día (oferta total − demanda total)
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={dataMensual} margin={{ top:5, right:10, left:-10, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                <XAxis dataKey="mes" tick={{ fill:T.textFaint, fontSize:9 }} />
                <YAxis tick={{ fill:T.textFaint, fontSize:8 }} />
                <Tooltip
                  contentStyle={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontFamily:T.font, fontSize:10 }}
                  formatter={(v, n) => [`${v.toLocaleString()} Mcal`, n]}
                />
                <Legend wrapperStyle={{ fontFamily:T.font, fontSize:9, color:T.textDim }} />
                <Bar dataKey="ofertaTotal" name="Pasto" stackId="oferta" fill={COLORES.oferta} opacity={0.8} radius={[0,0,0,0]} />
                <Bar dataKey="ccAporte"   name="CC movilizada" stackId="oferta" fill={COLORES.cc} opacity={0.75} />
                <Bar dataKey="suplAporte" name="Suplemento" stackId="oferta" fill={COLORES.supl} opacity={0.8} />
                <Line dataKey="demanda" name="Demanda" stroke={COLORES.demanda} strokeWidth={2} dot={false} type="monotone" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {/* Barra de balance mes a mes */}
          <div style={{ background:T.card2, borderRadius:10, padding:14, border:`1px solid ${T.border}` }}>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, letterSpacing:1, marginBottom:8 }}>BALANCE NETO Mcal/día</div>
            <div style={{ display:"flex", gap:3, alignItems:"flex-end", height:60 }}>
              {dataMensual.map((d) => {
                const max = Math.max(...dataMensual.map(x => Math.abs(x.balance)), 1);
                const h   = Math.round(Math.abs(d.balance) / max * 56);
                return (
                  <div key={d.mes} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                    <div style={{ width:"100%", height:h, borderRadius:3,
                      background: d.balance >= 0 ? T.green : T.red, opacity:0.8 }} />
                    <div style={{ fontFamily:T.font, fontSize:7, color:d.balance>=0?T.green:T.red }}>{d.mes}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── VISTA CALIDAD ────────────────────────────────────── */}
      {vista === "calidad" && (
        <div>
          {/* Tabla calidad mes a mes */}
          <div style={{ background:T.card2, borderRadius:10, padding:12, border:`1px solid ${T.border}`, marginBottom:10 }}>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, letterSpacing:1, marginBottom:10 }}>
              CALIDAD FORRAJERA MENSUAL — Fenología · Proteína · Digestibilidad · Consumo voluntario
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:T.font, fontSize:9 }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                    {["Mes","Temp","Fenol","PB%","Dig%","CV%PV","Mcal/v/d","Balance"].map(h=>(
                      <th key={h} style={{ padding:"4px 6px", textAlign:"left", color:T.textFaint, fontWeight:400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataMensual.map(d=>{
                    const fenolLabel = {menor_10:"<10% flor","10_25":"10–25%","25_50":"25–50%",mayor_50:">50% flor"}[d.fenolMes]||"—";
                    const colFenol = {menor_10:T.green,"10_25":T.green,"25_50":T.amber,mayor_50:T.red}[d.fenolMes]||T.textDim;
                    const colBal   = d.deficit ? T.red : T.green;
                    return (
                      <tr key={d.mes} style={{ borderBottom:`1px solid ${T.border}30` }}>
                        <td style={{ padding:"5px 6px", color:T.text, fontWeight: d.esParto||d.esServIni?"700":"400" }}>
                          {d.mes}{d.esParto?" 🐄":""}{d.esServIni?" 🐂":""}
                        </td>
                        <td style={{ padding:"5px 6px", color:parseFloat(d.t)<15?T.red:T.textDim }}>{d.t?.toFixed(0)||"—"}°C</td>
                        <td style={{ padding:"5px 6px", color:colFenol }}>{fenolLabel}</td>
                        <td style={{ padding:"5px 6px", color:d.pbPasG<=6?T.red:d.pbPasG<=9?T.amber:T.green }}>{d.pbPasG||"—"}%</td>
                        <td style={{ padding:"5px 6px", color:T.textDim }}>{d.digG||"—"}%</td>
                        <td style={{ padding:"5px 6px", color:T.textDim }}>{d.cvPct||"—"}%</td>
                        <td style={{ padding:"5px 6px", color:T.text }}>{d.ofertaTotal?.toLocaleString()||"—"}</td>
                        <td style={{ padding:"5px 6px", color:colBal, fontWeight:700 }}>{d.balance>=0?"+":""}{d.balance?.toLocaleString()||"—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {/* Leyenda */}
          <div style={{ background:T.card2, borderRadius:8, padding:10, border:`1px solid ${T.border}`, display:"flex", gap:8, flexWrap:"wrap" }}>
            <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>
              PB: proteína bruta mínima ruminal = 7–8% · Dig: digestibilidad real · CV: consumo voluntario · 🐄 parto · 🐂 servicio
            </div>
          </div>
        </div>
      )}

      {/* ── VISTA DEMANDA ─────────────────────────────────────── */}
      {vista === "demanda" && (
        <div style={{ background:T.card2, borderRadius:10, padding:14, border:`1px solid ${T.border}` }}>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, letterSpacing:1, marginBottom:10 }}>
            DEMANDA POR CATEGORÍA — Mcal/día (barras apiladas)
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dataMensual} margin={{ top:5, right:10, left:-10, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="mes" tick={{ fill:T.textFaint, fontSize:9 }} />
              <YAxis tick={{ fill:T.textFaint, fontSize:8 }} />
              <Tooltip
                contentStyle={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontFamily:T.font, fontSize:10 }}
                formatter={(v, n) => [`${v.toLocaleString()} Mcal`, n]}
              />
              <Legend wrapperStyle={{ fontFamily:T.font, fontSize:9 }} />
              <Bar dataKey="dVaq1"  name="Vaq 1° inv"  stackId="a" fill={COLORES.vaq1}  />
              <Bar dataKey="dVaq2"  name="Vaq 2° inv"  stackId="a" fill={COLORES.vaq2}  />
              <Bar dataKey="dV2s"   name="V 2° serv"   stackId="a" fill={COLORES.v2s}   />
              <Bar dataKey="dVacas" name="Vacas"        stackId="a" fill={COLORES.vacas} />
              <Bar dataKey="dToros" name="Toros"        stackId="a" fill={COLORES.toros} />
              <Line dataKey="ofertaTotal" name="Oferta pasto" stroke={COLORES.oferta} strokeWidth={2} dot={false} strokeDasharray="6 3" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── VISTA GRUPOS CC ───────────────────────────────────── */}
      {vista === "grupos" && (
        <div style={{ background:T.card2, borderRadius:10, padding:14, border:`1px solid ${T.border}` }}>
          <div style={{ fontFamily:T.font, fontSize:9, color:T.textDim, letterSpacing:1, marginBottom:10 }}>
            TRAYECTORIA CC POR GRUPO
          </div>
          {distGrupos.length === 0 && (
            <div style={{ fontFamily:T.fontSans, fontSize:12, color:T.textFaint, textAlign:"center", padding:20 }}>
              Ingresá la distribución de CC en el paso 2
            </div>
          )}
          <ResponsiveContainer width="100%" height={220}>
            <LineChart margin={{ top:5, right:10, left:-10, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="mes" type="category" allowDuplicatedCategory={false}
                tick={{ fill:T.textFaint, fontSize:9 }} />
              <YAxis domain={[2, 7]} tick={{ fill:T.textFaint, fontSize:8 }} />
              <Tooltip contentStyle={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, fontFamily:T.font, fontSize:10 }} />
              <Legend wrapperStyle={{ fontFamily:T.font, fontSize:9 }} />
              {distGrupos.map((g, gi) => {
                const ccH = parseFloat(g.cc) || 5;
                const bt  = getBiotipo(form.biotipo);
                // Calcular trayectoria mensual simplificada para visualización
                const puntos = MESES.map((mes, i) => {
                  let cc = ccH;
                  if (i >= 9) cc = Math.max(2, ccH - (i-8) * 0.18 * bt.movCC); // oct: baja en lactación
                  if (i >= 0 && i <= 2) cc = Math.max(2, ccH - 1.2 * bt.movCC + (i * 0.15 * bt.recCC)); // recuperación
                  return { mes, cc: +cc.toFixed(2) };
                });
                const col = ["#7ec850","#4a9fd4","#e8a030","#e05530","#9b59b6"][gi % 5];
                return (
                  <Line key={gi} data={puntos} dataKey="cc"
                    name={`CC ${g.cc} (${g.pct}%)`}
                    stroke={col} strokeWidth={2} dot={false} type="monotone" />
                );
              })}
              {/* Línea umbral anestro */}
              <ReferenceLine y={getBiotipo(form.biotipo).umbralAnestro} stroke={T.red}
                strokeDasharray="4 4" label={{ value:"Umbral anestro", fill:T.red, fontSize:8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
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
// Genera recomendaciones priorizadas (P1/P2/P3) con acción, impacto y fundamento
// ─── CEREBRO TÉCNICO v18 — motor diagnóstico central ──────────────
// ═══════════════════════════════════════════════════════════════════
// CEREBRO TÉCNICO v18
// Función pura: recibe TODO el estado del motor → produce diagnóstico
// completo con indicadores actuales + proyección con recomendaciones
// Cada recomendación sabe exactamente cuánto mejora cada indicador
// ═══════════════════════════════════════════════════════════════════

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

  // ── INDICADORES ACTUALES (línea de base) ──────────────────────────
  const ind = {
    prenez:        tray?.pr              ?? null,
    ccHoy:         ccPondVal             ?? null,
    ccParto:       parseFloat(tray?.ccParto  || 0),
    ccMinLact:     parseFloat(tray?.ccMinLact|| 0),
    ccServ:        parseFloat(tray?.ccServ   || 0),
    anestro:       tray?.anestro?.dias   ?? null,
    caidaCC:       parseFloat(tray?.caidaLact|| 0),
    mesesLact:     parseFloat(tray?.mesesLact|| 0),
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
    cargaEV_ha:    cargaEV_ha,
    factorAgua:    factorAgua,
    pvVaq1Entrada: pvEntVaq1,
  };

  // ── RECOMENDACIONES con impacto cuantificado ─────────────────────
  const recs = [];

  const addRec = (id, prioridad, categoria, icono, accion, impactoBase, impactoConRec, porque, mesCritico, solucion) => {
    recs.push({ id, prioridad, categoria, icono, accion,
      impactoBase, impactoConRec, porque, mesCritico, solucion });
  };

  // ════════════════════════════════════════
  // 1. BALANCE ENERGÉTICO — el eje central
  // ════════════════════════════════════════

  if (ind.defMesesInv > 0) {
    const peorMes = balanceMensual.filter(m=>[5,6,7].includes(m.i)&&m.deficit)
      .reduce((a,b) => b.balance<a.balance ? b : a);
    const defMcalDia   = Math.abs(peorMes.balance);
    // Impacto en CC: 56 Mcal = 1 punto CC, a lo largo del mes crítico
    const caidaCCExtra = +(defMcalDia * 30 / (56 * Math.max(1,nVacas))).toFixed(2);
    const ccServSinRec = +(ind.ccServ - caidaCCExtra).toFixed(1);
    const prenezSinRec = interpCC(ccServSinRec).pr;
    const prenezConRec = ind.prenez ?? 0;
    // Para vacas: destete anticipado libera ~6.5 Mcal/vaca/día = más que cualquier suplemento
    const pctHNec = Math.min(60, Math.max(20, Math.round(caidaCCExtra * 80)));
    // Para vaq1/v2s/toros: sí suplemento
    const nNoVacas  = (nVaq1||0) + (nVaq2||0) + (nV2s||0) + (nToros||0);
    const kgExpVaq  = nNoVacas>0 ? +(defMcalDia / 2.6 / nNoVacas).toFixed(2) : 0;
    addRec(
      "balance_inv", "P1", "Balance energético invernal", "⚡",
      `Vacas CC <4.5: destete anticipado/hiperprecoz ${pctHNec}% · Vaq1/V2S/Toros: ${kgExpVaq>0?kgExpVaq+' kg expeller/cabeza/día':'suplementar según categoría'}`,
      { prenez: prenezSinRec, ccServ: ccServSinRec, caidaCC: caidaCCExtra, label:"Sin corrección invernal" },
      { prenez: prenezConRec, ccServ: ind.ccServ,   caidaCC: 0,            label:"Con manejo correcto" },
      `Déficit de ${defMcalDia.toLocaleString()} Mcal/día en ${peorMes.mes} (T≈${peorMes.t?.toFixed(0)||"—"}°C, C4 paralizado). `+
      `Para VACAS CON TERNERO: la herramienta es el destete — libera 6–8 Mcal/día de golpe, el suplemento nunca llega a eso. `+
      `Para VAQ1/V2S/TOROS sin ternero: ahí sí aplica el suplemento proteico porque la proteína activa el rumen y mejora la digestión de la fibra disponible (Detmann/NASSEM 2010). `+
      `Sin corrección: la vaca llega al servicio con ${caidaCCExtra} CC menos → −${prenezConRec-prenezSinRec}pp preñez (Peruchena INTA 2003).`,
      peorMes.mes,
      { tipo:"combinado", acciones:[
        `VACAS CC <4.5: destete anticipado/hiperprecoz ${pctHNec}% del rodeo (libera 6–8 Mcal/día)`,
        `VAQ1° invierno: expeller girasol/algodón 0.3–0.5 kg/día · frecuencia 2–3×/semana`,
        `VAQ2° / V2S: expeller según cálculo vaquillona · objetivo PV entore`,
        `TOROS: expeller girasol hasta CC 5.5 · ${+(pvVaca*1.3*0.003).toFixed(1)} kg/día`,
      ]}
    );
  }

  // ════════════════════════════════════════
  // 2. CC AL PARTO — ventana crítica
  // ════════════════════════════════════════

  if (ind.ccParto > 0 && ind.ccParto < 4.5) {
    const deficit   = +(4.5 - ind.ccParto).toFixed(1);
    const diasMenos = Math.round(deficit * 30);
    const prenezNow = interpCC(ind.ccServ).pr;
    const ccServMej = +(ind.ccServ + deficit * 0.6).toFixed(1);
    const prenezMej = interpCC(ccServMej).pr;
    // Preparto: única ventana donde suplementar la vaca ES eficiente
    // No tiene ternero al pie → sin el costo de lactación → 1 kg expeller = 2.6 Mcal netas
    // 56 Mcal = 1 CC · ganancia target = deficit CC en 60 días
    const kgExpGir  = +(deficit * 56 / (60 * 2.6)).toFixed(2);
    addRec(
      "cc_parto", "P1", "CC al parto — ventana preparto", "🐄",
      `Suplementar PREPARTO (últimos 60d de gestación, sin ternero): ${kgExpGir} kg expeller girasol/vaca/día`,
      { ccParto: ind.ccParto, ccServ: ind.ccServ, prenez: prenezNow, anestro: ind.anestro, label:"CC parto actual" },
      { ccParto: 4.5,         ccServ: ccServMej,  prenez: prenezMej, anestro: Math.max(30,(ind.anestro??60)-diasMenos), label:"Con preparto correcto" },
      `CC al parto proyectada: ${ind.ccParto} — ${deficit} unidades debajo del mínimo. `+
      `ATENCIÓN: el preparto (últimas 8 semanas de gestación) es la ÚNICA ventana donde suplementar la vaca es energéticamente eficiente — porque todavía NO tiene ternero al pie. `+
      `Sin ese costo, 1 kg de expeller = 2.6 Mcal netas que van directo a CC. `+
      `Con ternero al pie ya no funciona: el ternero consume 6–8 Mcal/día, más que cualquier dosis posible. `+
      `Cada 0.5 CC al parto = 25 días menos de anestro posparto (Selk 1988). `+
      `Esta CC se forma en gestación tardía — no se puede recuperar en lactación.`,
      fmtFecha(cadena?.partoTemp) ?? "Parto próximo",
      { tipo:"supl", alimento:"Expeller girasol", kgDia:kgExpGir,
        momento:"Últimos 60 días de gestación (sin ternero al pie)",
        nota:"Esta es la ÚNICA ventana eficiente para suplementar la vaca" }
    );
  }

  // ════════════════════════════════════════
  // 3. CC AL SERVICIO — resultado final
  // ════════════════════════════════════════

  if (ind.ccServ > 0 && ind.ccServ < 4.5) {
    const deficit   = +(4.5 - ind.ccServ).toFixed(1);
    const prenezAct = interpCC(ind.ccServ).pr;
    const prenezObj = interpCC(4.5).pr;
    const pctHipNec = Math.min(70, Math.max(30, Math.round(deficit * 50)));
    // CC recuperada por destete en días disponibles hasta el servicio
    const diasDisp  = cadena?.ini ? Math.max(0, Math.round((new Date(cadena.ini)-new Date())/86400000)) : 90;
    const ccRecupDest = +(0.3 * (diasDisp/30) * (pctHipNec/100)).toFixed(1);
    const ccServConDest = Math.min(6.0, +(ind.ccServ + ccRecupDest).toFixed(1));
    const prenezConDest = interpCC(ccServConDest).pr;
    addRec(
      "cc_serv", "P1", "CC al servicio — manejo lactancia", "📅",
      `Destete hiperprecoz/anticipado ${pctHipNec}% vacas CC <4.5 + suplemento preparto (sin ternero)`,
      { ccServ: ind.ccServ, prenez: prenezAct, anestro: ind.anestro, label:"Sin cambio de manejo" },
      { ccServ: ccServConDest, prenez: prenezConDest, anestro: Math.max(30,(ind.anestro??70)-25), label:`Con destete ${pctHipNec}%` },
      `CC al servicio proyectada: ${ind.ccServ} → preñez estimada ${prenezAct}%. `+
      `Las tres palancas reales para mejorar CC al servicio son:
`+
      `1. DESTETE PRECOZ (herramienta principal): elimina 6–8 Mcal/día de costo de lactación. `+
      `En 7–14 días la vaca reinicia ciclos (Wiltbank 1990). Es la única palanca que cambia la ecuación de fondo.
`+
      `2. PREPARTO (único momento de suplemento eficiente en vacas): sin ternero al pie, 1 kg expeller = 2.6 Mcal netas → CC al parto más alta → anestro más corto.
`+
      `3. FECHA DE SERVICIO: ajustar el inicio del servicio para dar más tiempo de recuperación post-parto.
`+
      `Suplementar vacas con ternero al pie en lactación plena NO funciona — el ternero consume más que cualquier dosis posible.`,
      fmtFecha(cadena?.ini) ?? "Inicio servicio",
      { tipo:"combinado", acciones:[
        `Destete hiperprecoz ≤50d: vacas CC <4.0 → mínimo ${Math.max(20,Math.round(pctHipNec*0.6))}% del rodeo`,
        `Destete anticipado 90d: vacas CC 4.0–4.5 → ${Math.min(40,Math.round(pctHipNec*0.4))}% adicional`,
        `Suplemento PREPARTO (últimas 8 semanas gestación, sin ternero): ${+(deficit*56/(60*2.6)).toFixed(2)} kg expeller/vaca/día`,
        `NO suplementar vacas en lactación con ternero al pie — ineficiente`,
      ]}
    );
  }

  // ════════════════════════════════════════
  // 4. DESTETE — herramienta de rescate
  // ════════════════════════════════════════

  const pctH = parseFloat(form.destHiper)||0;
  const pctA = parseFloat(form.destAntic)||0;
  if (ind.ccParto < 4.8 && pctH < 30) {
    const pctHObj  = Math.min(70, Math.max(30, Math.round((4.8-ind.ccParto)*60)));
    const redReq   = 3.0 * (pctHObj/100) * nVacas; // Mcal/día liberadas del rodeo
    const ccRecup  = +(redReq * 45 / (56 * nVacas)).toFixed(2); // CC recuperada en 45 días
    const ccServNuevo = +(ind.ccServ + ccRecup).toFixed(1);
    const prenezNueva = interpCC(ccServNuevo).pr;
    addRec(
      "destete", pctH < 10 ? "P1" : "P2", "Manejo destete", "🔶",
      `Destete hiperprecoz al ${pctHObj}% del rodeo — vacas CC <4.5 al parto`,
      { ccServ: ind.ccServ, prenez: ind.prenez, pctHiper: pctH, label:"Sin destete precoz" },
      { ccServ: ccServNuevo, prenez: prenezNueva, pctHiper: pctHObj, label:`Con ${pctHObj}% hiperprecoz` },
      `El amamantamiento suprime LH y mantiene anestro. Retirar el ternero antes de los 50 días elimina este bloqueo en 7–14 días (Wiltbank 1990). Libera ~3 Mcal/vaca/día → en 45 días recupera ${ccRecup} unidades CC → servicio con CC ${ccServNuevo} → preñez +${prenezNueva-ind.prenez}pp. Herramienta de mayor impacto/costo del sistema.`,
      `Abril–Mayo (antes del invierno)`,
      { tipo:"manejo", accion:`Destete hiperprecoz al ${pctHObj}% — vacas CC <4.5`, diasOpt:50 }
    );
  }

  // ════════════════════════════════════════
  // 5. VAQUILLONA 1° INVIERNO
  // ════════════════════════════════════════

  if (vaq1E && !vaq1E.mensaje) {
    const pvEntore = vaq1E.pvSal ?? 0;
    const pvMinEnt = Math.round(pvVaca * 0.60);
    const deficit  = pvMinEnt - pvEntore;
    if (deficit > 0) {
      const kgProt  = +(deficit / (vaq1E.gdpReal||130) * vaq1E.protKg).toFixed(2);
      const gdpConS = Math.min(350, (vaq1E.gdpReal||130) + 80);
      const pvConS  = Math.round((pvEntVaq1||0) + gdpConS * 0.122);
      addRec(
        "vaq1", "P1", "Vaquillona 1° invierno", "🐄",
        `Suplementar ${vaq1E.protKg} kg/día proteína + ${vaq1E.energKg>0?vaq1E.energKg+' kg energía':''} — objetivo PV entore ${pvMinEnt} kg`,
        { pvEntore, gdp:vaq1E.gdpReal, llegas:false, label:"Sin suplemento" },
        { pvEntore:pvConS, gdp:gdpConS, llegas:pvConS>=pvMinEnt, label:"Con plan actual" },
        `PV al entore proyectado: ${pvEntore} kg — déficit ${deficit} kg vs mínimo ${pvMinEnt} kg (60% PV adulto). Una vaquillona que entra al servicio con <60% PV adulto: mayor tasa de anestro, menor tasa de concepción, y si queda preñada → vaca problema en su 2° servicio. El costo de un invierno sin suplementar se paga 2 temporadas.`,
        "Jun–Ago",
        { tipo:"supl", alimento:"Expeller girasol", kgDia:vaq1E.protKg,
          energetico: vaq1E.energKg > 0 ? { alimento:"Sorgo molido", kgDia:vaq1E.energKg } : null }
      );
    }
  }

  // ════════════════════════════════════════
  // 6. VAQUILLONA 2° SERVICIO
  // ════════════════════════════════════════

  if (vaq2E && !vaq2E.llegas) {
    const pvFaltante = vaq2E.pvMinEntore - vaq2E.pvEntore;
    const kgExpGir   = +(pvFaltante / (90*0.25) / Math.max(1,nVaq2)).toFixed(2); // 90 días supl, 250g GDP/kg supl
    addRec(
      "vaq2", "P2", "Vaquillona 2° servicio", "🔶",
      `Suplementar vaq2: ${kgExpGir} kg expeller/día — objetivo PV entore ${vaq2E.pvMinEntore} kg`,
      { pvEntore: vaq2E.pvEntore, llegas: false, label:"Sin corrección" },
      { pvEntore: vaq2E.pvMinEntore, llegas: true, label:"Con suplemento" },
      `Vaq2 proyectada: ${vaq2E.pvEntore} kg — necesita ${vaq2E.pvMinEntore} kg (75% PV adulto). La vaquillona de 2° servicio está en triple estrés (crecimiento + preñez + lactación anterior). Entrar al servicio liviana garantiza baja preñez y perpetúa el problema de recría.`,
      "Preparto vaq2",
      { tipo:"supl", alimento:"Expeller girasol", kgDia:kgExpGir }
    );
  }

  // ════════════════════════════════════════
  // 7. TOROS — preparo de servicio
  // ════════════════════════════════════════

  if (ind.ccToros && ind.ccToros < 5.0) {
    const deficit  = +(5.5 - ind.ccToros).toFixed(1);
    const dias     = Math.round(deficit / 0.018);
    const kgSupl   = +(pvVaca * 1.3 * 0.003).toFixed(1);
    addRec(
      "toros_cc", ind.ccToros < 4.0 ? "P1" : "P2", "Toros — preparo de servicio", "🐂",
      `Suplementar toros: ${kgSupl} kg expeller girasol/día por ${dias} días`,
      { ccToros: ind.ccToros, libido:"reducida", fertilidad:"comprometida", label:"Toros actuales" },
      { ccToros: 5.5, libido:"óptima", fertilidad:"máxima", label:`Toros en ${dias} días` },
      `Toro CC ${ind.ccToros}: pérdida de libido y calidad espermática documentada por debajo de CC 5.0 (Peruchena INTA 2003). Un toro mal nutrido en servicio puede reducir preñez del lote un 10–15% sin que se note hasta el diagnóstico. El costo del suplemento es menor al 3% del valor de los terneros que no nacen.`,
      fmtFecha(cadena?.ini) ?? "Inicio servicio",
      { tipo:"supl", alimento:"Expeller girasol", kgDia:kgSupl, dias, objetivo:"CC 5.5" }
    );
  }

  if (ind.relacionAT && ind.relacionAT > 30) {
    addRec(
      "relacion_at", "P2", "Relación toro:vaca", "🐂",
      `Ajustar relación a ≤25 vacas/toro — agregar ${Math.ceil(nVacas/25)-nToros} toro(s)`,
      { relacionAT: ind.relacionAT, cobertura:"incompleta", label:"Relación actual" },
      { relacionAT: 25, cobertura:"óptima", label:"Con ajuste" },
      `Con ${ind.relacionAT} vacas/toro en servicio continuo extensivo: el toro no alcanza a detectar todos los celos, especialmente los de corta duración en Bos indicus (6–12h vs 18h en taurinos). Cada vaca no servida en el 1° ciclo reduce preñez del lote ~6 pp (INTA Corrientes 2018).`,
      fmtFecha(cadena?.ini) ?? "Inicio servicio",
      { tipo:"manejo", accion:`Agregar ${Math.max(1,Math.ceil(nVacas/25)-nToros)} toro(s) evaluado(s) ESAN` }
    );
  }

  // ════════════════════════════════════════
  // 8. CALIDAD DEL PASTO — acción correcta según categoría
  // VACAS: herramienta = destete, NO suplemento
  // VAQUILLONA: SÍ suplemento proteico
  // ════════════════════════════════════════

  const esInvOtoño = ["25_50","mayor_50"].includes(fenol);
  const pbPastoActual = { menor_10:12, "10_25":9, "25_50":6, mayor_50:4 }[fenol];
  const digActual     = { menor_10:68, "10_25":63, "25_50":58, mayor_50:52 }[fenol];

  if (esInvOtoño) {
    // ── Para VACAS CON TERNERO AL PIE: el pasto de baja calidad
    //    empeora el balance pero la solución es SIEMPRE el destete
    const pctH = parseFloat(form.destHiper)||0;
    const pctA = parseFloat(form.destAntic)||0;
    if (pctH < 30 && pctA < 40 && pbPastoActual <= 6) {
      addRec(
        "calidad_pasto_vacas", "P1", "Calidad forrajera — vacas", "🌾",
        `Pasto >50% floración (PB ${pbPastoActual}%, dig ${digActual}%) + ternero al pie = déficit energético irresoluble sin destete`,
        { pbPasto: pbPastoActual, digestibilidad: digActual, herramienta:"suplemento (ineficiente)", label:"Con ternero al pie" },
        { pbPasto: pbPastoActual, digestibilidad: digActual, herramienta:"destete anticipado/hiperprecoz", label:"Ternero retirado" },
        `Con pasto de PB ${pbPastoActual}% y ternero al pie, la vaca tiene un déficit de 6–8 Mcal/día que ningún suplemento puede cubrir. Suplementar una vaca en lactación plena con pasto >50% floración cuesta 2.5 kg expeller/día para recuperar 1 Mcal neta — ineficiente. La herramienta correcta es retirar el ternero (hiperprecoz ≤50d o anticipado 90d): elimina el bloqueo LH en 7–14 días y libera los 6–8 Mcal/día de golpe (Wiltbank 1990).`,
        fenol==="mayor_50"?"Jun–Ago":"May–Jun",
        { tipo:"manejo", accion:`Destete hiperprecoz/anticipado en vacas CC <4.5 — mínimo ${Math.max(30,100-pctH-pctA)}% del rodeo` }
      );
    }

    // ── Para VAQUILLONA 1° invierno: SÍ suplemento proteico ──────
    // Vaq1 no tiene ternero → la proteína activa el rumen y mejora GDP directamente
    if (nVaq1 > 0) {
      const tieneVaq1Supl = !!(form.supl_vaq1 && parseFloat(form.dosis_vaq1)>0);
      if (!tieneVaq1Supl && pbPastoActual <= 9) {
        addRec(
          "calidad_pasto_vaq1", "P2", "Calidad forrajera — vaquillona 1°", "🟢",
          `Vaquillona 1° invierno: pasto PB ${pbPastoActual}% — agregar proteína ruminal (0.3–0.5 kg expeller girasol/día)`,
          { pbPasto: pbPastoActual, gdpEstim: vaq1E?.gdpReal??130, label:"Sin suplemento" },
          { pbTotal: Math.min(12, pbPastoActual+4), gdpEstim: Math.min(320,(vaq1E?.gdpReal??130)+120), label:"Con expeller girasol" },
          `Vaquillona sin ternero al pie → el suplemento proteico activa la microflora ruminal y mejora directamente la digestión de la fibra del pasto disponible (+15–20% consumo voluntario MS). GDP puede mejorar 100–150 g/día con solo 0.4 kg expeller. Respuesta marginal máxima del sistema (Detmann/NASSEM 2010).`,
          "Jun–Ago",
          { tipo:"supl", alimento:"Expeller girasol", kgDia:0.4, objetivo:"PB dieta >8%, GDP >250 g/d" }
        );
      }
    }
  }

  // ════════════════════════════════════════
  // 9. AGUA
  // ════════════════════════════════════════

  if (evalAgua && evalAgua.pctReducDMI > 10) {
    const kgMsPerdido = +(evalAgua.pctReducDMI/100 * pvVaca * 0.024).toFixed(1);
    const mcalPerdidas= +(kgMsPerdido * 2.0).toFixed(1);
    const ccMesPerd   = +(mcalPerdidas * 30 / 56).toFixed(2);
    addRec(
      "agua", "P1", "Agua de bebida", "💧",
      `Mejorar acceso a agua dulce o instalar bebedero con fuente diferente (TDS actual: ${evalAgua.tdsN} mg/L)`,
      { dmi: -evalAgua.pctReducDMI, kgMsPerd: kgMsPerdido, ccMesPerd, label:"Con agua actual" },
      { dmi: 0, kgMsPerd: 0, ccMesPerd: 0, label:"Con agua de calidad" },
      `TDS ${evalAgua.tdsN} mg/L reduce consumo voluntario de MS un ${evalAgua.pctReducDMI.toFixed(0)}% (López et al. 2021, JAS 99:skab215). Equivale a eliminar ${kgMsPerdido} kg MS/vaca/día = ${mcalPerdidas} Mcal/día = ${ccMesPerd} CC perdida por mes. En NEA/Chaco la laguna estacional puede duplicar TDS en agosto-septiembre — momento crítico del sistema.`,
      "Ago–Sep",
      { tipo:"infraestructura", accion:"Bebedero con fuente de baja TDS (<1500 mg/L)" }
    );
  }

  // ════════════════════════════════════════
  // 10. CARGA ANIMAL
  // ════════════════════════════════════════

  if (cargaEV_ha && cargaEV_ha > 0.8) {
    const exceso    = +(cargaEV_ha - 0.7).toFixed(2);
    const ofertaRec = +(1 - factorCarga).toFixed(2);
    const mcalPerd  = balanceMensual.reduce((s,m)=>s + Math.max(0,m.ofPastoTotal*ofertaRec/12),0);
    addRec(
      "carga", "P2", "Carga animal", "📐",
      `Reducir carga en ${Math.round(exceso*totalEV)} EV — considerar vender vacías antes del servicio`,
      { cargaEV: cargaEV_ha, factorOferta: factorCarga, label:"Carga actual" },
      { cargaEV: 0.7, factorOferta: 1.0, label:"Con ajuste de carga" },
      `Carga ${cargaEV_ha} EV/ha — por encima de la capacidad de pastoreo sostenible (~0.7 EV/ha NEA campo natural). La sobrecarga reduce la oferta forrajera real en un ${Math.round((1-factorCarga)*100)}% por pisoteo, rechazo y degradación de la pastura. El efecto no se ve inmediatamente pero acumula degradación estructural del pastizal.`,
      "Abril–Mayo",
      { tipo:"manejo", accion:`Vender/mover ${Math.round(exceso*totalEV)} animales equivalentes antes del invierno` }
    );
  }

  // ════════════════════════════════════════
  // 11. STOCK ALIMENTOS
  // ════════════════════════════════════════

  Object.entries(stockStatus).forEach(([alim, st]) => {
    if (!st.suficiente && st.kgNecesario > 0) {
      const faltanT = +((st.kgNecesario - st.stockKg)/1000).toFixed(1);
      addRec(
        `stock_${alim}`, "P2", `Stock — ${alim}`, "📦",
        `Comprar ${faltanT}t de ${alim} antes del inicio de suplementación`,
        { stock:+(st.stockKg/1000).toFixed(1), semanas: st.semanas, label:"Stock actual" },
        { stock:+(st.kgNecesario/1000).toFixed(1), semanas:13, label:"Stock completo" },
        `Con el stock actual de ${alim} (${(st.stockKg/1000).toFixed(1)}t) el plan de suplementación se corta en la semana ${st.semanas} del invierno. Faltan ${faltanT}t. Si el plan se corta a mitad del invierno el impacto en CC equivale a no haber suplementado: se pierde la inversión previa y la CC cae bruscamente.`,
        "Antes de mayo",
        { tipo:"compra", alimento:alim, toneladas:faltanT }
      );
    }
  });

  // ════════════════════════════════════════
  // 12. SANIDAD
  // ════════════════════════════════════════

  if (form.sanAftosa === "no")
    addRec("san_aftosa","P1","Sanidad — Aftosa","🔴",
      "Vacunar todo el rodeo contra Aftosa — 2 dosis anuales (mayo y noviembre)",
      { riesgo:"mercado cerrado", multa:"SENASA", label:"Sin vacunar" },
      { riesgo:"cumplimiento", trazabilidad:"ok", label:"Vacunado" },
      "Obligatorio Ley 3959 y Plan Nacional SENASA. Sin vacunación el establecimiento puede ser clausurado y pierde trazabilidad de exportación.",
      "Urgente",{ tipo:"sanitario", accion:"Vacunación Aftosa bimestral" });

  if (form.sanBrucelosis === "no")
    addRec("san_brucela","P1","Sanidad — Brucelosis","🔴",
      "Vacunar terneras 3–8 meses con B19 o RB51 — registro SENASA obligatorio",
      { abortos:"hasta 30% al 7° mes", label:"Sin vacunar" },
      { abortos:"controlados", label:"Vacunado" },
      "Zoonosis de denuncia obligatoria. SENASA RES.114/21. Abortos por Brucella ocurren al 7° mes — pérdida directa de ternero + vaca reinseminar.",
      "Urgente",{ tipo:"sanitario", accion:"Vacunación B19 terneras 3–8 meses" });

  if (form.sanToros === "sin_control")
    addRec("san_toros","P1","Sanidad — Toros","🔴",
      "Evaluación ESAN pre-servicio — descartar Tricomoniasis y Campylobacteriosis",
      { preñez:"−10 a −20 pp por toro enfermo", label:"Sin control" },
      { preñez:"protegida", label:"Con ESAN" },
      "Un toro con Trichomonas o Campylobacter infecta silenciosamente al 15–40% del rodeo por temporada. No tiene síntomas evidentes — solo baja preñez al diagnóstico.",
      "60 días antes del servicio",{ tipo:"sanitario", accion:"ESAN + cultivo genital toros" });

  if (form.sanVacunas === "no")
    addRec("san_vacunas","P2","Sanidad — IBR/DVB","🟡",
      "Vacunar IBR/DVB pre-servicio — 60–30 días antes del toro",
      { preñez:"−10 a −15 pp por IBR activo", label:"Sin vacunar" },
      { preñez:"protegida", label:"Vacunado" },
      "IBR y DVB causan anovulación, repetición de celos y abortos tempranos. El costo de la vacuna es <2% del valor de un ternero no nacido por baja preñez.",
      "60 días antes del servicio",{ tipo:"sanitario", accion:"Vacuna IBR/DVB × 2 dosis" });

  // ════════════════════════════════════════
  // 13. VERDEO — oportunidad
  // ════════════════════════════════════════

  if (form.tieneVerdeo === "si" && form.verdeoHa && form.verdeoDestinoVaq !== "si") {
    addRec(
      "verdeo_destino","P3","Forraje — Verdeos","🌱",
      `Asignar el verdeo (${form.verdeoHa} ha) prioritariamente a vaquillona 1° invierno`,
      { gdpVaq1:vaq1E?.gdpReal??130, label:"Verdeo sin destino definido" },
      { gdpVaq1:Math.min(850,((vaq1E?.gdpReal??130)+500)), label:"Vaquillona en verdeo" },
      `La vaquillona en verdeo de avena/raigrás puede ganar 700–900 g/día vs 130–180 g/día en pastizal natural en invierno. Es la categoría con mayor respuesta marginal. Permite llegar al entore sin suplemento individual.`,
      "Jun–Ago",
      { tipo:"manejo", accion:"Reservar lote verdeo para vaquillona 1°" }
    );
  }

  // ════════════════════════════════════════
  // RANKING FINAL — mayor impacto en preñez
  // ════════════════════════════════════════

  const orden = { P1:0, P2:1, P3:2 };
  recs.sort((a,b) => {
    const pa = orden[a.prioridad]??3, pb2 = orden[b.prioridad]??3;
    if (pa !== pb2) return pa - pb2;
    // Dentro de prioridad: ordenar por ganancia de preñez
    const ganA = a.impactoConRec?.prenez && a.impactoBase?.prenez ? a.impactoConRec.prenez-a.impactoBase.prenez : 0;
    const ganB = b.impactoConRec?.prenez && b.impactoBase?.prenez ? b.impactoConRec.prenez-b.impactoBase.prenez : 0;
    return ganB - ganA;
  });

  // ── Proyección "con todo aplicado" ──────────────────────────────
  // Estima cuánto mejora cada indicador si se aplican todas las recomendaciones
  const prenezFinal = Math.min(93, (ind.prenez??50)
    + recs.reduce((s,r) => {
      const ganP = r.impactoConRec?.prenez && r.impactoBase?.prenez
        ? Math.max(0, r.impactoConRec.prenez - r.impactoBase.prenez) : 0;
      return s + ganP * 0.7; // 70% de efectividad real de campo
    }, 0));

  const ccServFinal = Math.min(6.0, (ind.ccServ??4.0)
    + recs.filter(r=>r.impactoConRec?.ccServ).reduce((s,r)=>
      s + Math.max(0,(r.impactoConRec.ccServ??0)-(r.impactoBase?.ccServ??0))*0.7, 0));

  return {
    ind,           // indicadores base
    recs,          // recomendaciones rankeadas con impacto
    balanceMensual,
    proyeccion: {  // si se aplica todo
      prenez:   Math.round(prenezFinal),
      ccServ:   +ccServFinal.toFixed(1),
      gananciaPreñez: Math.round(prenezFinal - (ind.prenez??50)),
    },
  };
}


// ─── PANEL RECOMENDACIONES ─────────────────────────────────────────
// Ahora recibe `motor` completo — cerebro conectado a todo
function PanelRecomendaciones({ motor, form }) {
  const dx = React.useMemo(() => diagnosticarSistema(motor, form), [motor, form]);
  const [expandido, setExpandido] = React.useState(null);
  const [modoVista, setModoVista] = React.useState("recs"); // "recs" | "impacto"

  if (!dx) return (
    <div style={{ padding:20, textAlign:"center", fontFamily:T.font, fontSize:11, color:T.textFaint }}>
      Completá los datos del rodeo para ver el diagnóstico
    </div>
  );

  const { ind, recs, proyeccion } = dx;
  const P1 = recs.filter(r=>r.prioridad==="P1");
  const P2 = recs.filter(r=>r.prioridad==="P2");
  const P3 = recs.filter(r=>r.prioridad==="P3");

  const colP = { P1:T.red, P2:T.amber, P3:T.blue };
  const bgP  = { P1:"rgba(224,85,48,.07)", P2:"rgba(232,160,48,.06)", P3:"rgba(74,159,212,.05)" };
  const lblP = { P1:"URGENTE", P2:"IMPORTANTE", P3:"MONITOREAR" };

  // ── Card de recomendación ──────────────────────────────────────
  const RecCard = ({ rec, idx }) => {
    const key  = `${rec.id}-${idx}`;
    const open = expandido === key;
    const col  = colP[rec.prioridad];
    const ganPreñez = rec.impactoConRec?.prenez && rec.impactoBase?.prenez
      ? Math.round(rec.impactoConRec.prenez - rec.impactoBase.prenez) : null;

    return (
      <div onClick={()=>setExpandido(open?null:key)} style={{
        background: open ? bgP[rec.prioridad] : T.card2,
        border:`1px solid ${open ? col+"60" : T.border}`,
        borderRadius:12, marginBottom:8, cursor:"pointer", overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"12px 14px" }}>
          <div style={{ fontSize:18, lineHeight:1, paddingTop:1, flexShrink:0 }}>{rec.icono}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, flexWrap:"wrap" }}>
              <span style={{ fontFamily:T.font, fontSize:8, color:col,
                background:`${col}18`, border:`1px solid ${col}35`,
                borderRadius:4, padding:"2px 7px", letterSpacing:.8 }}>{rec.prioridad} · {lblP[rec.prioridad]}</span>
              <span style={{ fontFamily:T.font, fontSize:8, color:T.textDim }}>{rec.categoria.toUpperCase()}</span>
              {ganPreñez > 0 && (
                <span style={{ fontFamily:T.font, fontSize:8, color:T.green,
                  background:`${T.green}15`, border:`1px solid ${T.green}30`,
                  borderRadius:4, padding:"2px 7px" }}>+{ganPreñez}pp preñez</span>
              )}
              {rec.mesCritico && (
                <span style={{ fontFamily:T.font, fontSize:8, color:T.textFaint,
                  background:"rgba(255,255,255,.04)", border:`1px solid ${T.border}`,
                  borderRadius:4, padding:"2px 7px" }}>📅 {rec.mesCritico}</span>
              )}
            </div>
            <div style={{ fontFamily:T.fontSans, fontSize:12, color:T.text, lineHeight:1.4, fontWeight:500 }}>
              {rec.accion}
            </div>
          </div>
          <div style={{ fontFamily:T.font, fontSize:11, color:T.textFaint, flexShrink:0 }}>{open?"▲":"▼"}</div>
        </div>

        {/* Expandido */}
        {open && (
          <div style={{ borderTop:`1px solid ${T.border}`, padding:"12px 14px", display:"flex", flexDirection:"column", gap:10 }}>
            {/* Comparativa SIN/CON */}
            {rec.impactoBase && rec.impactoConRec && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div style={{ background:"rgba(224,85,48,.07)", border:"1px solid rgba(224,85,48,.2)", borderRadius:8, padding:"10px 12px" }}>
                  <div style={{ fontFamily:T.font, fontSize:8, color:T.red, letterSpacing:1, marginBottom:6 }}>
                    ✗ {rec.impactoBase.label?.toUpperCase() || "SIN CORRECCIÓN"}
                  </div>
                  {Object.entries(rec.impactoBase).filter(([k])=>k!=="label").map(([k,v])=>(
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                      <span style={{ fontFamily:T.font, fontSize:9, color:T.textDim }}>{k}</span>
                      <span style={{ fontFamily:T.font, fontSize:10, color:T.red, fontWeight:700 }}>{typeof v==="number"?(Number.isInteger(v)?v:v.toFixed?.(1)):v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background:"rgba(126,200,80,.07)", border:"1px solid rgba(126,200,80,.2)", borderRadius:8, padding:"10px 12px" }}>
                  <div style={{ fontFamily:T.font, fontSize:8, color:T.green, letterSpacing:1, marginBottom:6 }}>
                    ✓ {rec.impactoConRec.label?.toUpperCase() || "CON CORRECCIÓN"}
                  </div>
                  {Object.entries(rec.impactoConRec).filter(([k])=>k!=="label").map(([k,v])=>(
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                      <span style={{ fontFamily:T.font, fontSize:9, color:T.textDim }}>{k}</span>
                      <span style={{ fontFamily:T.font, fontSize:10, color:T.green, fontWeight:700 }}>{typeof v==="number"?(Number.isInteger(v)?v:v.toFixed?.(1)):v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Fundamento */}
            <div style={{ background:"rgba(255,255,255,.02)", border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 12px" }}>
              <div style={{ fontFamily:T.font, fontSize:8, color:T.textDim, letterSpacing:1, marginBottom:4 }}>🔬 FUNDAMENTO TÉCNICO</div>
              <div style={{ fontFamily:T.fontSans, fontSize:11, color:T.textDim, lineHeight:1.5 }}>{rec.porque}</div>
            </div>
            {/* Solución concreta */}
            {rec.solucion && (
              <div style={{ background:`${col}08`, border:`1px solid ${col}25`, borderRadius:8, padding:"8px 12px" }}>
                <div style={{ fontFamily:T.font, fontSize:8, color:col, letterSpacing:1, marginBottom:4 }}>🎯 ACCIÓN CONCRETA</div>
                {rec.solucion.tipo==="supl" && (
                  <div style={{ fontFamily:T.fontSans, fontSize:11, color:T.text, lineHeight:1.6 }}>
                    <strong>{rec.solucion.alimento}</strong>: {rec.solucion.kgDia ?? rec.solucion.kgVacaDia} kg/vaca/día
                    {rec.solucion.momento && <span style={{color:T.textDim}}> · {rec.solucion.momento}</span>}
                    {rec.solucion.alternativa && <div style={{color:T.textDim,fontSize:10,marginTop:2}}>Alternativa: {rec.solucion.alternativa} ({rec.solucion.kgAlt} kg)</div>}
                    {rec.solucion.energetico && <div style={{color:T.blue,fontSize:10,marginTop:2}}>+ Energético: {rec.solucion.energetico.alimento} {rec.solucion.energetico.kgDia} kg/día</div>}
                  </div>
                )}
                {rec.solucion.tipo==="combinado" && (
                  <div>{rec.solucion.acciones?.map((a,i)=>(
                    <div key={i} style={{ fontFamily:T.fontSans, fontSize:11, color:T.text, marginBottom:3 }}>
                      {i+1}. {a}
                    </div>
                  ))}</div>
                )}
                {rec.solucion.tipo==="manejo" && (
                  <div style={{ fontFamily:T.fontSans, fontSize:11, color:T.text }}>{rec.solucion.accion}</div>
                )}
                {rec.solucion.tipo==="compra" && (
                  <div style={{ fontFamily:T.fontSans, fontSize:11, color:T.text }}>
                    Comprar <strong>{rec.solucion.toneladas}t</strong> de {rec.solucion.alimento} antes de mayo
                  </div>
                )}
                {rec.solucion.tipo==="sanitario" && (
                  <div style={{ fontFamily:T.fontSans, fontSize:11, color:T.text }}>{rec.solucion.accion}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const Grupo = ({ titulo, items, color }) => items.length===0 ? null : (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <div style={{ flex:1, height:1, background:`${color}30` }} />
        <span style={{ fontFamily:T.font, fontSize:8, color, letterSpacing:1 }}>{titulo} ({items.length})</span>
        <div style={{ flex:1, height:1, background:`${color}30` }} />
      </div>
      {items.map((r,i)=><RecCard key={r.id||i} rec={r} idx={i} />)}
    </div>
  );

  return (
    <div>
      {/* ── Proyección si se aplica todo ── */}
      {proyeccion.gananciaPreñez > 0 && (
        <div style={{ background:`${T.green}08`, border:`1px solid ${T.green}30`,
          borderRadius:14, padding:14, marginBottom:16, display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ textAlign:"center", minWidth:60 }}>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, marginBottom:2 }}>HOY</div>
            <div style={{ fontFamily:T.font, fontSize:24, color:T.red, fontWeight:700 }}>{ind.prenez??'—'}%</div>
            <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>preñez</div>
          </div>
          <div style={{ flex:1, textAlign:"center" }}>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, marginBottom:4 }}>
              {recs.filter(r=>r.prioridad!=="P3").length} correcciones
            </div>
            <div style={{ height:2, background:`linear-gradient(90deg,${T.red},${T.green})`, borderRadius:1 }} />
            <div style={{ fontFamily:T.font, fontSize:9, color:T.green, marginTop:4 }}>
              +{proyeccion.gananciaPreñez}pp potencial
            </div>
          </div>
          <div style={{ textAlign:"center", minWidth:60 }}>
            <div style={{ fontFamily:T.font, fontSize:9, color:T.textFaint, marginBottom:2 }}>OBJETIVO</div>
            <div style={{ fontFamily:T.font, fontSize:24, color:T.green, fontWeight:700 }}>{proyeccion.prenez}%</div>
            <div style={{ fontFamily:T.font, fontSize:8, color:T.textFaint }}>preñez</div>
          </div>
        </div>
      )}

      {/* Contadores */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:14 }}>
        {[["P1",P1.length,T.red,"Urgentes"],["P2",P2.length,T.amber,"Importantes"],["P3",P3.length,T.blue,"Monitorear"]].map(([p,n,c,l])=>(
          <div key={p} style={{ background:`${c}10`, border:`1px solid ${c}30`, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
            <div style={{ fontFamily:T.font, fontSize:22, color:c, fontWeight:700, lineHeight:1 }}>{n}</div>
            <div style={{ fontFamily:T.fontSans, fontSize:10, color:c, marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      {recs.length===0 ? (
        <div style={{ background:`${T.green}06`, border:`1px solid ${T.green}20`, borderRadius:14, padding:20, textAlign:"center" }}>
          <div style={{ fontSize:28, marginBottom:8 }}>✅</div>
          <div style={{ fontFamily:T.font, fontSize:13, color:T.green }}>Sistema dentro de parámetros técnicos</div>
        </div>
      ) : (
        <>
          <Grupo titulo="ACCIONES URGENTES"     items={P1} color={T.red}   />
          <Grupo titulo="ACCIONES IMPORTANTES"  items={P2} color={T.amber} />
          <Grupo titulo="MONITOREAR"            items={P3} color={T.blue}  />
        </>
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
  const [usaPotreros, setUsaPotreros] = useState(false);
  const [potreros,    setPotreros]    = useState([{ ha:"", veg:"Pastizal natural NEA/Chaco", fenol:"menor_10" }]);

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
      ["Supl_vacas",              form.supl_vacas   || ""],
      ["Dosis_vacas_kgd",         form.dosis_vacas  || "0"],
      ["Supl_vacas",             form.supl_vacas   || ""],
      ["Dosis_vacas_kgd",         form.dosis_vacas  || "0"],
      ["Supl2_vacas",             form.supl2_vacas  || ""],
      ["Dosis2_vacas_kgd",        form.dosis2_vacas || "0"],
      ["Supl_v2s",               form.supl_v2s     || ""],
      ["Dosis_v2s_kgd",           form.dosis_v2s    || "0"],
      ["Supl2_v2s",               form.supl2_v2s    || ""],
      ["Dosis2_v2s_kgd",          form.dosis2_v2s   || "0"],
      ["Supl2_v2s",               form.supl2_v2s    || ""],
      ["Dosis2_v2s_kgd",          form.dosis2_v2s   || "0"],
      ["Supl_vacas",              form.supl_vacas   || ""],
      ["Dosis_vacas_kgd",         form.dosis_vacas  || "0"],
      ["Supl2_vacas",             form.supl2_vacas  || ""],
      ["Dosis2_vacas_kgd",        form.dosis2_vacas || "0"],
      ["Dosis_v2s_kgd",           form.dosis_v2s    || "0"],
      ["Supl_toros",              form.supl_toros   || ""],
      ["Dosis_toros_kgd",         form.dosis_toros  || "0"],
      ["Supl_vaq2",               form.supl_vaq2    || ""],
      ["Dosis_vaq2_kgd",          form.dosis_vaq2   || "0"],
      ["Supl_vaq1",               form.supl_vaq1    || ""],
      ["Dosis_vaq1_kgd",          form.dosis_vaq1   || "0"],
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
      ["Supl_vaq1",                form.supl_vaq1    || ""],
      ["Dosis_vaq1_kgd",           form.dosis_vaq1   || "0"],
      ["Supl2_vaq1",               form.supl2_vaq1   || ""],
      ["Dosis2_vaq1_kgd",          form.dosis2_vaq1  || "0"],
      ["Supl_vaq2",                form.supl_vaq2    || ""],
      ["Dosis_vaq2_kgd",           form.dosis_vaq2   || "0"],
      ["Supl2_vaq2",               form.supl2_vaq2   || ""],
      ["Dosis2_vaq2_kgd",          form.dosis2_vaq2  || "0"],
      ["Supl_toros",               form.supl_toros   || ""],
      ["Dosis_toros_kgd",          form.dosis_toros  || "0"],
      ["Supl2_toros",              form.supl2_toros  || ""],
      ["Dosis2_toros_kgd",         form.dosis2_toros || "0"],
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
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    };

    const csvContent = [headers, valores]
      .map(fila => fila.map(escapeCSV).join(","))
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
          background:`${C.blue}10`, borderRadius:12, border:`1px solid ${C.blue}30`,
          padding:"14px 10px", textAlign:"center"
        }}>
          <div style={{ fontSize:22, marginBottom:4 }}>✏️</div>
          <div style={{ fontFamily:C.sans, fontSize:12, color:C.blue, fontWeight:600 }}>Cargar manual</div>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginTop:2 }}>Ingresá zona y localidad abajo</div>
        </div>
      </div>
      {coords && (
        <Alerta tipo="ok">
          GPS: {form.zona} · {form.provincia} {form.localidad ? `· ${form.localidad}` : ""}
          <span style={{ opacity:0.6, fontSize:10 }}> ({coords.lat.toFixed(3)}°, {coords.lon.toFixed(3)}°)</span>
        </Alerta>
      )}
      {!coords && (
        <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, marginBottom:8, padding:"6px 10px", background:`${C.green}06`, border:`1px solid ${C.border}`, borderRadius:8 }}>
          Sin GPS — seleccioná provincia y escribí la localidad para obtener datos climáticos
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
      <Input label="LOCALIDAD / PARAJE" value={form.localidad} onChange={v=>set("localidad",v)} placeholder="Ej: Charata, Clorinda, Concepción…" sub="Para contexto geográfico en el informe" />

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
          { label:"── Cebú puro ──────────────────", opts:[
            ["Brahman",          "Brahman puro"],
            ["Nelore",           "Nelore"],
            ["Indobrasil",       "Indobrasil"],
          ]},
          { label:"── Brangus (Angus × Brahman) ──", opts:[
            ["Brangus 3/8",      "Brangus 3/8 Cebú  ← más común NEA"],
            ["Brangus 5/8",      "Brangus 5/8 Cebú"],
          ]},
          { label:"── Bradford / Braford (Hereford × Brahman) ──", opts:[
            ["Bradford 3/8",     "Bradford 3/8 Cebú  ← Hereford×Brahman"],
            ["Bradford 5/8",     "Bradford 5/8 Cebú"],
            ["Braford 3/8",      "Braford 3/8 Cebú  (UY/BR)"],
            ["Braford 5/8",      "Braford 5/8 Cebú  (UY/BR)"],
          ]},
          { label:"── Hereford puro ───────────────", opts:[
            ["Hereford",         "Hereford"],
          ]},
          { label:"── Aberdeen Angus puro ─────────", opts:[
            ["Aberdeen Angus",   "Aberdeen Angus"],
          ]},
          { label:"── Otras europeas ─────────────", opts:[
            ["Limousin",         "Limousin"],
            ["Charolais",        "Charolais"],
            ["Simmental",        "Simmental"],
          ]},
          { label:"── Razas tropicales adaptadas ──", opts:[
            ["Bonsmara",         "Bonsmara"],
            ["Simbrah",          "Simbrah (Simmental×Brahman)"],
            ["Senepol",          "Senepol"],
            ["Beefmaster",       "Beefmaster"],
          ]},
          { label:"── General ──────────────────────", opts:[
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
      {/* Fecha de medición */}
      <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:12, marginBottom:12 }}>
        <Input label="FECHA DE MEDICIÓN DE CC" value={form.fechaCC||""} onChange={v=>set("fechaCC",v)} type="date"
          sub="¿Cuándo midiste la CC? Si fue hace más de 30 días, la CC real hoy puede diferir."
        />
        {form.fechaCC && (() => {
          const diasDesdeMed = Math.round((new Date() - new Date(form.fechaCC)) / 86400000);
          if (diasDesdeMed < 0) return null;
          const bt = getBiotipo(form.biotipo);
          const caida = (diasDesdeMed / 30 * 0.40 * bt.movCC).toFixed(2); // aprox 0.4CC/mes en lactación
          if (diasDesdeMed > 30) {
            return (
              <Alerta tipo="warn">
                Medición hace {diasDesdeMed} días — en lactación la CC puede haber caído hasta −{caida} unidades. 
                Recomendamos reverificar CC actual para que el análisis sea preciso.
              </Alerta>
            );
          }
          return (
            <div style={{ fontFamily:C.font, fontSize:9, color:C.green, marginTop:4 }}>
              ✓ Medición reciente ({diasDesdeMed} días) — CC considerada actual
            </div>
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
          {vaq1E && (vaq1E.mensaje
            ? <Alerta tipo="ok">{vaq1E.mensaje}</Alerta>
            : (
              <div style={{ background:`${C.amber}08`, border:`1px solid ${C.amber}30`, borderRadius:10, padding:12 }}>
                <div style={{ fontFamily:C.font, fontSize:10, color:C.amber, marginBottom:8 }}>ESC {vaq1E.esc} — SUPLEMENTACIÓN VAQ1</div>
                {/* Cantidad + calidad de pasto */}
                {vaq1E.nivelMS && (
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                    <Pill color={vaq1E.nivelMS==="baja"?C.red:vaq1E.nivelMS==="media"?C.amber:C.green}>
                      Pasto {vaq1E.msHa} kgMS/ha ({vaq1E.nivelMS})
                    </Pill>
                    <Pill color={vaq1E.calidadBaja?C.amber:C.green}>
                      {vaq1E.calidadBaja?"Calidad baja (encañado)":"Calidad adecuada"}
                    </Pill>
                  </div>
                )}
                {/* Tarjetas suplementación Vaq1 — formato claro */}
                <div style={{ background:`${C.card}`, borderRadius:10, padding:10, marginBottom:8, border:`1px solid ${C.amber}20` }}>
                  <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, letterSpacing:1, marginBottom:8 }}>PLAN DE SUPLEMENTACIÓN</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    <div style={{ borderRadius:8, background:`${C.amber}10`, padding:"8px 10px" }}>
                      <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginBottom:2 }}>SUPLEMENTO PROTEICO</div>
                      <div style={{ fontFamily:C.font, fontSize:16, fontWeight:700, color:C.amber }}>{vaq1E.protKg} kg/día</div>
                      <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>Expeller girasol/algodón/soja</div>
                      {vaq1E.alertaAlgodon && <div style={{ fontFamily:C.font, fontSize:8, color:C.red, marginTop:3 }}>⚠ Máx {Math.round((parseFloat(form.vaq1PV||tcSave?.pvMayoPond||100))*0.004*10)/10}kg si semilla algodón</div>}
                    </div>
                    <div style={{ borderRadius:8, background:`${vaq1E.energKg>0?C.blue:C.card}10`, padding:"8px 10px" }}>
                      <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginBottom:2 }}>SUPLEMENTO ENERGÉTICO</div>
                      {vaq1E.energKg > 0
                        ? <><div style={{ fontFamily:C.font, fontSize:16, fontWeight:700, color:C.blue }}>{vaq1E.energKg} kg/día</div>
                            <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>{vaq1E.fuenteEnerg||"Sorgo/maíz molido"}</div></>
                        : <><div style={{ fontFamily:C.font, fontSize:12, fontWeight:600, color:C.textDim }}>No requerido</div>
                            <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>Con pasto de buena calidad</div></>
                      }
                    </div>
                    <div style={{ borderRadius:8, background:`${vaq1E.freq==="Diario"?C.red:C.green}10`, padding:"8px 10px", gridColumn:"1/-1" }}>
                      <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginBottom:2 }}>FRECUENCIA DE SUMINISTRO</div>
                      <div style={{ fontFamily:C.font, fontSize:14, fontWeight:700, color:vaq1E.freq==="Diario"?C.red:C.green }}>{vaq1E.freq}</div>
                      <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>{vaq1E.freqDetalle}</div>
                    </div>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div style={{ borderRadius:8, background:`${C.green}10`, padding:"8px 10px" }}>
                    <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginBottom:2 }}>GDP ESTIMADO</div>
                    <div style={{ fontFamily:C.font, fontSize:16, fontWeight:700, color:C.green }}>{vaq1E.gdpReal} g/día</div>
                    <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>+{Math.round(vaq1E.gdpReal*122/1000)} kg en 122 días</div>
                  </div>
                  <div style={{ borderRadius:8, background:`${vaq1E.deficit?C.red:C.green}10`, padding:"8px 10px" }}>
                    <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginBottom:2 }}>PV AL SALIR DEL INVIERNO</div>
                    <div style={{ fontFamily:C.font, fontSize:16, fontWeight:700, color:vaq1E.deficit?C.red:C.green }}>{vaq1E.pvSal} kg</div>
                    <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>
                      {vaq1E.deficit ? `⚠ Gana ${vaq1E.pvSal-(parseFloat(form.vaq1PV||tcSave?.pvMayoPond)||0)}kg — falta ${vaq1E.objetivo-vaq1E.pvSal}kg vs obj. +65kg` : `✓ Gana +${Math.round(vaq1E.pvSal-(parseFloat(form.vaq1PV||tcSave?.pvMayoPond)||0))}kg — alcanza objetivo`}
                    </div>
                  </div>
                </div>
                {vaq1E.advertencia && <Alerta tipo="warn" style={{ marginTop:8 }}>{vaq1E.advertencia}</Alerta>}
                {vaq1E.alertaAlgodon && <Alerta tipo="warn" style={{ marginTop:6 }}>{vaq1E.alertaAlgodon}</Alerta>}
                {vaq1E.nota && <Alerta tipo="info" style={{ marginTop:6 }}>{vaq1E.nota}</Alerta>}
                {/* Objetivo entore vinculado a política del establecimiento */}
                {form.edadPrimerEntore && (
                  <div style={{ marginTop:8, padding:"8px 12px", borderRadius:8, background:`${C.blue}08`, border:`1px solid ${C.blue}20` }}>
                    <div style={{ fontFamily:C.font, fontSize:9, color:C.blue, marginBottom:2 }}>OBJETIVO ENTORE ({form.edadPrimerEntore} meses)</div>
                    <div style={{ fontFamily:C.sans, fontSize:11, color:C.textDim }}>
                      PV mínimo al entore: <strong style={{color:C.text}}>{Math.round((parseFloat(form.pvVacaAdulta)||320)*0.60)} kg</strong> (60% PV adulto) — 
                      {vaq1E.pvSal >= Math.round((parseFloat(form.pvVacaAdulta)||320)*0.60)
                        ? <span style={{color:C.green}}> ✓ Llega al objetivo con esta suplementación</span>
                        : <span style={{color:C.red}}> ✗ No llega al objetivo — ajustar dosis o evaluar entore tardío</span>}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
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
              {/* Vaq2 SIEMPRE muestra suplementación mínima */}
                {vaq2E.mensajeBase && <Alerta tipo="warn" style={{marginBottom:8}}>{vaq2E.mensajeBase}</Alerta>}
                {vaq2E.esc === "—"
                ? <Alerta tipo="ok">Pasto suficiente para GDP mínimo, pero suplementar proteína 2–3×/sem para asegurar {300}g/d</Alerta>
                : (
                  <div style={{ background:`${C.amber}08`, border:`1px solid ${C.amber}30`, borderRadius:10, padding:12 }}>
                    <div style={{ fontFamily:C.font, fontSize:10, color:C.amber, marginBottom:8 }}>ESC {vaq2E.esc} — SUPLEMENTACIÓN VAQ2 INVIERNO</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                      <MetricCard label="PROTEÍNA"   value={(vaq2E.protKg||"—")+"kg/d"} color={C.amber}
                        sub="Expeller girasol/algodón/soja" />
                      <MetricCard label="ENERGÍA"    value={vaq2E.energKg>0?(vaq2E.energKg+"kg/d"):"S.Algodón ad lib"} color={C.blue}
                        sub={vaq2E.fuenteEnerg||"Sin energía adicional"} />
                      <MetricCard label="FRECUENCIA" value={vaq2E.freq||"—"} color={vaq2E.freq==="Diario"?C.red:C.green}
                        style={{gridColumn:"1/-1"}} sub={vaq2E.freqDetalle||""} />
                      <MetricCard label="GDP INV."   value={(vaq2E.gdpInv||300)+"g/d"} color={C.green}
                        sub="Mínimo 300 g/d garantizado" />
                      <MetricCard label="PV AGOSTO"  value={(vaq2E.pvV2Agosto||"—")+"kg"} color={C.blue}
                        sub="Salida invierno" />
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      <MetricCard label="PV ENTORE"  value={vaq2E.pvEntore+"kg"} color={vaq2E.llegas?C.green:C.red}
                        sub="Proyección noviembre" />
                      <MetricCard label="OBJETIVO"   value={vaq2E.pvMinEntore+"kg"} color={C.textDim}
                        sub="75% PV adulto" />
                    </div>
                    {vaq2E.alertaAlgodon && <Alerta tipo="info" style={{marginTop:6}}>{vaq2E.alertaAlgodon}</Alerta>}
                    {!vaq2E.llegas && <Alerta tipo="error" style={{ marginTop:8 }}>No alcanza peso mínimo de entore — aumentar suplementación o revisar fecha de entore</Alerta>}
                  </div>
                )
              }
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
  const renderForraje = () => (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <BtnSel active={modoForraje==="general"}   onClick={()=>{setModoForraje("general");  setUsaPotreros(false);}} style={{ padding:"12px 10px" }}>
          <div style={{ fontSize:18, marginBottom:4 }}>🏠</div>
          <div style={{ fontFamily:C.font, fontSize:11, fontWeight:600, marginBottom:2 }}>Campo completo</div>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>Simple y rápido</div>
        </BtnSel>
        <BtnSel active={modoForraje==="potreros"}  onClick={()=>{setModoForraje("potreros"); setUsaPotreros(true);}} style={{ padding:"12px 10px" }}>
          <div style={{ fontSize:18, marginBottom:4 }}>🗺️</div>
          <div style={{ fontFamily:C.font, fontSize:11, fontWeight:600, marginBottom:2 }}>Por potreros</div>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>Más detallado</div>
        </BtnSel>
      </div>

      {modoForraje === "general" && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <Input label="SUPERFICIE TOTAL (ha)" value={form.supHa} onChange={v=>set("supHa",v)} placeholder="500" type="number" />
            <div>
              <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:5 }}>CARGA EV/HA</div>
              <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px", fontFamily:C.font, fontSize:16,
                color: form.supHa&&form.vacasN ? smf(2-(parseInt(form.vacasN)||0)/(parseFloat(form.supHa)||1),0.5,1.5) : C.textDim }}>
                {form.supHa && form.vacasN && parseFloat(form.supHa)>0 ? ((parseInt(form.vacasN)||0)/parseFloat(form.supHa)).toFixed(2) : "—"}
              </div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
            <Input label="% MONTE / PALMAR" value={form.pctMonte} onChange={v=>set("pctMonte",v)} placeholder="10" type="number" />
            <Input label="% NO GANADERO"    value={form.pctNGan}  onChange={v=>set("pctNGan",v)}  placeholder="5"  type="number" />
          </div>
          <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:8 }}>VEGETACIÓN PRINCIPAL</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
            {Object.keys(PROD_BASE).map(v => (
              <BtnSel key={v} active={form.vegetacion===v} onClick={()=>set("vegetacion",v)} style={{ padding:"10px 14px" }}>{v}</BtnSel>
            ))}
          </div>
          <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, letterSpacing:1, marginBottom:8 }}>FENOLOGÍA ACTUAL</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
            {FENOLOGIAS.map(f => (
              <button key={f.val} onClick={()=>set("fenologia",f.val)} style={{
                padding:"10px 8px", borderRadius:10, cursor:"pointer", textAlign:"left",
                background: form.fenologia===f.val ? `${C.green}15` : C.card2,
                border:`1px solid ${form.fenologia===f.val ? C.green : C.border}`,
              }}>
                <div style={{ fontSize:16, marginBottom:2 }}>{f.emoji}</div>
                <div style={{ fontFamily:C.sans, fontSize:11, color:C.text, fontWeight:600 }}>{f.label}</div>
                <div style={{ fontFamily:C.sans, fontSize:9,  color:C.textDim }}>{f.desc}</div>
                {f.warn && <div style={{ fontFamily:C.sans, fontSize:9, color:C.amber, marginTop:2 }}>{f.warn}</div>}
              </button>
            ))}
          </div>
          {/* ── DISPONIBILIDAD FORRAJERA — CANTIDAD (método INTA altura × tipo) ── */}
          <div style={{ background:C.card2, borderRadius:12, padding:14, border:`1px solid ${C.border}`, marginBottom:14 }}>
            <div style={{ fontFamily:C.font, fontSize:9, color:C.green, letterSpacing:1, marginBottom:8 }}>
              📏 DISPONIBILIDAD (CANTIDAD DE PASTO)
            </div>
            <div style={{ fontFamily:C.sans, fontSize:10, color:C.textDim, marginBottom:10, lineHeight:1.5 }}>
              Caminá el potrero y estimá la altura promedio del pasto — Método INTA (Rosello Brajovich et al. 2025)
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <Input label="ALTURA PASTO (cm)" value={form.altPasto} onChange={v=>set("altPasto",v)} placeholder="20" type="number"
                sub="Promedio caminando el potrero" />
              <SelectF label="TIPO DE PASTO" value={form.tipoPasto} onChange={v=>set("tipoPasto",v)} options={[
                ["corto_denso","Cortos densos (pasto horqueta, grama)"],
                ["alto_ralo",  "Altos ralos (Paspalum, Elionorus)"],
                ["alto_denso", "Altos densos (paja colorada, paja amarilla)"],
              ]} />
            </div>
            {(() => {
              const disp = calcDisponibilidadMS(form.altPasto, form.tipoPasto);
              const col  = disp.nivel==="alta" ? C.green : disp.nivel==="media" ? C.amber : C.red;
              return (
                <div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                    <MetricCard label="DISPONIBILIDAD" value={disp.msHa+" kgMS/ha"} color={col}
                      sub={`Rango: ${disp.rango[0]}–${disp.rango[1]} kgMS/ha`} />
                    <MetricCard label="NIVEL" value={disp.nivel.toUpperCase()} color={col}
                      sub={disp.nivel==="baja"?"< 1000 kgMS/ha":disp.nivel==="media"?"1000–2000 kgMS/ha":"> 2000 kgMS/ha"} />
                  </div>
                  {disp.nivel==="baja" && (
                    <Alerta tipo="error">
                      Disponibilidad crítica — suplementar proteína + energía DIARIO para todas las categorías. Evaluar rollo como fibra base.
                    </Alerta>
                  )}
                  {disp.nivel==="media" && ["25_50","mayor_50"].includes(form.fenologia) && (
                    <Alerta tipo="warn">
                      Cantidad media + calidad baja (encañado) — suplementar proteína 2–3×/semana para activar microbiota ruminal
                    </Alerta>
                  )}
                  {disp.nivel==="alta" && ["25_50","mayor_50"].includes(form.fenologia) && (
                    <Alerta tipo="warn">
                      Mucho pasto pero encañado — alta fibra, baja digestibilidad. Proteína 0.5% PV/día 2–3×/semana mejora aprovechamiento.
                    </Alerta>
                  )}
                </div>
              );
            })()}
          </div>

          {form.fenologia && form.pvVacaAdulta && sat && !sat.error && (function ConsumoVoluntario() {
            const cons = calcConsumoPasto(form.pvVacaAdulta, form.fenologia, sat.temp || 25);
            return (
              <div style={{ background:`${C.green}06`, border:`1px solid ${C.green}20`, borderRadius:10, padding:10 }}>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.green, letterSpacing:1, marginBottom:6 }}>CONSUMO VOLUNTARIO (T={sat.temp}°C)</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <Pill color={C.green}>{cons.kgMs}kg MS/vaca/d</Pill>
                  <Pill color={C.green}>{cons.emTotal} Mcal/v/d</Pill>
                  <Pill color={C.amber}>Dig {cons.dig}%</Pill>
                  <Pill color={C.red}>PB pasto {cons.pb}%</Pill>
                </div>
                {cons.pb < 8 && <Alerta tipo="warn" style={{ marginTop:8 }}>PB pasto {cons.pb}% — por debajo del mínimo ruminal (8%). Suplementación proteica crítica.</Alerta>}
              </div>
            );
          })()}
        </>
      )}

      {/* ── MÓDULO VERDEOS DE INVIERNO ── */}
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
              <SelectF label="TIPO DE VERDEO" value={form.verdeoTipo||"Avena/Cebadilla"} onChange={v=>set("verdeoTipo",v)} options={[
                ["Avena/Cebadilla","Avena / Cebadilla"],
                ["Raigrás","Raigrás anual"],
                ["Triticale","Triticale"],
                ["Colza","Colza forrajera"],
                ["Consociado","Consociado (gramínea + leguminosa)"],
              ]} />
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <SelectF label="DISPONIBLE PARA PASTOREO" value={form.verdeoDisp||"agosto"} onChange={v=>set("verdeoDisp",v)} options={[
                ["junio","Desde junio"],["julio","Desde julio"],
                ["agosto","Desde agosto"],["septiembre","Desde septiembre"],
              ]} />
              <SelectF label="DESTINADO PARA" value={form.verdeoDestinoVaq||"si"} onChange={v=>set("verdeoDestinoVaq",v)} options={[
                ["si","Vaquillona 1° inv. (prioridad)"],
                ["v2s","Vaca 2° servicio (prioritario)"],
                ["todo","Rodeo general"],
                ["ternero","Destete precoz"],
              ]} />
            </div>
            {form.verdeoHa && parseFloat(form.verdeoHa) > 0 && (() => {
              const ha   = parseFloat(form.verdeoHa);
              const msHa = 2800; // kg MS/ha promedio avena/raigrás invierno
              const msTotal = Math.round(ha * msHa);
              const mcalTotal = Math.round(msTotal * 2.0 * 0.40); // 2.0 Mcal/kg × 40% aprovechamiento
              const diasDisp = 90; // jun-ago
              const vacasEq  = Math.round(mcalTotal / diasDisp / 14); // 14 Mcal/vaca/día
              return (
                <div style={{ marginTop:10, background:`${C.green}06`, border:`1px solid ${C.green}20`, borderRadius:8, padding:10 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontFamily:C.font, fontSize:16, color:C.green, fontWeight:700 }}>{(msTotal/1000).toFixed(0)}t</div>
                      <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>MS total estimada</div>
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontFamily:C.font, fontSize:16, color:C.green, fontWeight:700 }}>{mcalTotal.toLocaleString()}</div>
                      <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>Mcal disponibles inv.</div>
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <div style={{ fontFamily:C.font, fontSize:16, color:C.green, fontWeight:700 }}>{vacasEq}</div>
                      <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>vacas equiv. 90 días</div>
                    </div>
                  </div>
                  <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginTop:6 }}>
                    Avena/raigrás: PB ~14–18% · EM 2.0–2.2 Mcal/kg MS · suplementación proteica puede no ser necesaria
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {modoForraje === "potreros" && (
        <>
          {potreros.map((p, i) => (
            <div key={i} style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <span style={{ fontFamily:C.font, fontSize:12, color:C.green, fontWeight:600 }}>Potrero {i+1}</span>
                <button onClick={()=>setPotreros(ps=>ps.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontFamily:C.font, fontSize:12 }}>✕</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                <Input label="Hectáreas" value={p.ha} onChange={v=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],ha:v};return n;})} placeholder="100" type="number" />
                <div>
                  <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, marginBottom:5 }}>Fenología</div>
                  <select value={p.fenol} onChange={e=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],fenol:e.target.value};return n;})}
                    style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, padding:"10px", fontFamily:C.sans, fontSize:13 }}>
                    {FENOLOGIAS.map(f=><option key={f.val} value={f.val}>{f.emoji} {f.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div style={{ fontFamily:C.font, fontSize:10, color:C.textDim, marginBottom:5 }}>Vegetación</div>
                <select value={p.veg} onChange={e=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],veg:e.target.value};return n;})}
                  style={{ width:"100%", background:C.card, border:`1px solid ${C.border}`, borderRadius:8, color:C.text, padding:"10px", fontFamily:C.sans, fontSize:13 }}>
                  {Object.keys(PROD_BASE).map(v=><option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          ))}
          <button onClick={()=>setPotreros(ps=>[...ps,{ha:"",veg:"Pastizal natural NEA/Chaco",fenol:"menor_10"}])}
            style={{ width:"100%", background:`${C.green}06`, border:`1px solid ${C.border}`, borderRadius:10, color:C.green, padding:12, fontFamily:C.sans, fontSize:12, cursor:"pointer", marginBottom:10 }}>
            + Agregar potrero
          </button>
        </>
      )}
    </div>
  );

  // ── PASO 5: AGUA ──────────────────────────────────────────────
  const renderAgua = () => <PanelAgua form={form} set={set} sat={sat} />;

  // ── PASO 6: SUPLEMENTACIÓN ────────────────────────────────────
  const renderSuplementacion = () => {
    // PV promedio por categoría (mayo-agosto)
    const pvVacaS   = parseFloat(form.pvVacaAdulta) || 320;
    const pvV2sS    = parseFloat(form.v2sPV) || Math.round(pvVacaS * 0.88);
    const pvToroS   = Math.round(pvVacaS * 1.3);
    const pvVaq2S   = parseFloat(pvEntradaVaq2) || Math.round(pvVacaS * 0.65);
    const pvVaq1S   = parseFloat(form.vaq1PV || tcSave?.pvMayoPond) || Math.round(pvVacaS * 0.40);
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

    const [vistaSupl, setVistaSupl] = React.useState("cuadrantes"); // cuadrantes | resumen

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
            <div style={{ fontFamily:C.font, fontSize:8, color:C.red, letterSpacing:1, marginBottom:4 }}>
              ⚡ COSTO ENERGÉTICO DEL TERNERO AL PIE
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
              {[
                ["6–8 Mcal/día", "costo lactación"],
                [`${(6.5/2.6).toFixed(1)} kg expeller`, "equivalente suplemento"],
                ["7–14 días", "para ciclar tras destete"],
              ].map(([v,l])=>(
                <div key={l} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:C.font, fontSize:12, color:C.text, fontWeight:700 }}>{v}</div>
                  <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily:C.sans, fontSize:10, color:C.textDim, marginTop:8, lineHeight:1.4 }}>
              Ningún plan de suplementación puede compensar este déficit mientras el ternero esté al pie.
              El suplemento para vacas con ternero al pie es dinero mal gastado — la herramienta es el destete.
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
              <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, marginBottom:6 }}>STOCK DISPONIBLE HOY</div>
              {ALIM_NOMBRES.map(alim => {
                const item = stockAlim.find(s => s.alimento === alim) || { alimento:alim, toneladas:"" };
                const demanda = demandaPorAlim[alim];
                return (
                  <div key={alim} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <div style={{ flex:1, fontFamily:C.font, fontSize:9, color: demanda ? C.text : C.textFaint }}>{alim}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:4, width:120 }}>
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
                        style={{ width:65, background:C.card, border:`1px solid ${demanda ? C.amber+"50" : C.border}`,
                          borderRadius:6, color:C.text, padding:"5px 7px", fontFamily:C.font, fontSize:11 }}
                      />
                      <span style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>t</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* ── SANIDAD PARASITARIA ── */}
        <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:14, marginBottom:14, marginTop:4 }}>
          <div style={{ fontFamily:C.font, fontSize:9, color:C.blue, letterSpacing:1, marginBottom:10 }}>🩺 SANIDAD PARASITARIA</div>
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

      </div>
    );
  };

  // ── PASO 7: ANÁLISIS ──────────────────────────────────────────
  const renderAnalisis = () => (
    <div>
      {/* ── PANEL SCORE SISTÉMICO (siempre visible) ── */}
      {motor && (
        <div style={{ marginBottom:14 }}>
          {/* Score de riesgo */}
          <div style={{ background:C.card2, border:`1px solid ${colorRiesgo}35`, borderRadius:14, padding:14, marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <div>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:4 }}>SCORE SISTÉMICO v16</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                  <span style={{ fontFamily:C.font, fontSize:36, color:colorRiesgo, fontWeight:700, lineHeight:1 }}>{scoreRiesgo}</span>
                  <span style={{ fontFamily:C.font, fontSize:10, color:colorRiesgo }}>/ 100</span>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:C.font, fontSize:14, color:colorRiesgo, fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>
                  Riesgo {nivelRiesgo}
                </div>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginTop:2 }}>
                  {alertasMotor.filter(a=>a.tipo==="P1").length} urgente · {alertasMotor.filter(a=>a.tipo==="P2").length} importante
                </div>
              </div>
            </div>
            {/* Barra de score */}
            <div style={{ height:6, borderRadius:3, background:`${C.border}`, overflow:"hidden" }}>
              <div style={{ width:`${scoreRiesgo}%`, height:"100%", borderRadius:3,
                background:`linear-gradient(90deg, ${C.red}, ${C.amber} 50%, ${C.green})`,
                transition:"width .6s ease" }} />
            </div>
            {/* Sub-scores */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:4, marginTop:10 }}>
              {[
                ["Preñez",  tray?.pr ? Math.round(tray.pr*0.35) : 0,  35],
                ["Balance", balanceMensual.filter(m=>!m.deficit).length >= 10 ? 25 : 8, 25],
                ["CC serv", parseFloat(tray?.ccServ||0)>=4.5?20:8, 20],
                ["Stock",   Object.values(stockStatus).length===0||Object.values(stockStatus).every(s=>s.suficiente)?10:5, 10],
                ["Sanidad", sanidad?.alertas?.length===0?10:6, 10],
              ].map(([lbl, val, max]) => (
                <div key={lbl} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:C.font, fontSize:11, color:val>=max*0.7?C.green:val>=max*0.4?C.amber:C.red, fontWeight:700 }}>
                    {val}<span style={{ fontSize:7, color:C.textFaint }}>/{max}</span>
                  </div>
                  <div style={{ fontFamily:C.font, fontSize:7, color:C.textFaint }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Alertas del motor propagadas */}
          {alertasMotor.length > 0 && (
            <div>
              <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, letterSpacing:1, marginBottom:6 }}>
                ALERTAS DEL SISTEMA ({alertasMotor.length})
              </div>
              {alertasMotor.map((al, i) => (
                <div key={i} style={{
                  display:"flex", gap:8, alignItems:"flex-start",
                  padding:"8px 12px", borderRadius:9, marginBottom:5,
                  background: al.tipo==="P1" ? "rgba(224,85,48,.08)" : al.tipo==="P2" ? "rgba(232,160,48,.06)" : "rgba(74,159,212,.05)",
                  border: `1px solid ${al.tipo==="P1"?C.red+"30":al.tipo==="P2"?C.amber+"30":C.blue+"25"}`,
                }}>
                  <span style={{ fontFamily:C.font, fontSize:8, color:al.tipo==="P1"?C.red:al.tipo==="P2"?C.amber:C.blue,
                    background:`${al.tipo==="P1"?C.red:al.tipo==="P2"?C.amber:C.blue}18`,
                    border:`1px solid ${al.tipo==="P1"?C.red:al.tipo==="P2"?C.amber:C.blue}35`,
                    borderRadius:4, padding:"2px 6px", flexShrink:0, marginTop:1 }}>{al.tipo}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:C.sans, fontSize:11, color:C.text, lineHeight:1.4 }}>{al.msg}</div>
                    <div style={{ fontFamily:C.font, fontSize:9, color:C.textFaint, marginTop:2 }}>📈 {al.impacto}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Propagaciones clave: conexiones entre variables */}
          <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:10, marginTop:6 }}>
            <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint, letterSpacing:1, marginBottom:8 }}>CONEXIONES CAUSALES ACTIVAS</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {[
                motor?.factorAgua < 1 && { txt:`Agua → −${((1-motor.factorAgua)*100).toFixed(0)}% pasto`, col:C.red },
                motor?.factorCarga < 1 && { txt:`Carga → −${((1-motor.factorCarga)*100).toFixed(0)}% oferta`, col:C.amber },
                motor?.verdeoAporteMcalMes > 0 && { txt:`Verdeo → +${motor.verdeoAporteMcalMes} Mcal/d inv.`, col:C.green },
                motor?.ccDesvio !== null && motor.ccDesvio !== 0 && { txt:`Campo ${motor.ccDesvio>0?"+":""}${motor.ccDesvio} vs plan`, col:motor.ccDesvio<0?C.red:C.green },
                tray?.reducCaida > 0 && { txt:`Supl vacas → −${tray.reducCaida} CC caída`, col:C.blue },
                vaq1E?._gdpConVerdeo && { txt:`Verdeo → Vaq1 +${vaq1E._gdpConVerdeo-vaq1E.gdpReal}g/d GDP`, col:C.green },
                pvSalidaVaq1 && vaq2E && { txt:`Vaq1 PV${vaq1E?.pvSal}kg → Vaq2 entrada`, col:C.blue },
                cargaEV_ha && { txt:`${cargaEV_ha} EV/ha real`, col:cargaEV_ha>0.8?C.amber:C.green },
              ].filter(Boolean).map((item, i) => (
                <span key={i} style={{
                  fontFamily:C.font, fontSize:9, color:item.col,
                  background:`${item.col}12`, border:`1px solid ${item.col}30`,
                  borderRadius:12, padding:"3px 9px"
                }}>{item.txt}</span>
              ))}
              {[motor?.factorAgua < 1, motor?.factorCarga < 1, motor?.verdeoAporteMcalMes > 0,
                tray?.reducCaida > 0, pvSalidaVaq1, cargaEV_ha].every(v => !v) && (
                <span style={{ fontFamily:C.font, fontSize:9, color:C.textFaint }}>
                  Completá los datos para ver las conexiones causales activas
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <button onClick={runAnalysis} style={{ width:"100%", background:C.green, color:"#0b1a0c", padding:16, borderRadius:14, border:"none", fontFamily:C.font, fontSize:14, fontWeight:700, cursor:"pointer", letterSpacing:1, marginBottom:16 }}>
          ⚡ GENERAR ANÁLISIS TÉCNICO
        </button>
      )}
      {loading && <LoadingPanel msg={loadMsg} />}
      {result && !loading && (
        <div>
          <div style={{ display:"flex", gap:6, marginBottom:14, overflowX:"auto", paddingBottom:4 }}>
            {[["recomendaciones","💡 Recomend."],["diagnostico","📋 Diagnóst."],["simulador","🔬 Simulador"],["balance","⚡ Balance"],["seguimiento","📅 Seguim."]].map(([k,l]) => (
              <button key={k} onClick={()=>setTab(k)} style={{
                flexShrink:0, padding:"8px 14px", borderRadius:20, cursor:"pointer",
                background: tab===k ? C.green : "rgba(255,255,255,.04)",
                border:     tab===k ? `1px solid ${C.green}` : `1px solid ${C.border}`,
                color:      tab===k ? "#0b1a0c" : C.textDim,
                fontFamily: C.sans, fontSize:12, fontWeight: tab===k ? 700 : 400,
              }}>{l}</button>
            ))}
          </div>
          {tab === "recomendaciones" && (
            <PanelRecomendaciones motor={motor} form={form} />
          )}
          {tab === "diagnostico" && (
            <div>
              <RenderInforme texto={result} />
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                <button onClick={descargarPDF} style={{ flex:2, background:`${C.blue}12`, border:`1px solid ${C.blue}35`, borderRadius:10, color:C.blue, padding:13, fontFamily:C.sans, fontSize:13, cursor:"pointer" }}>
                  ⬇ PDF
                </button>
                <button onClick={descargarCSV} style={{ flex:1, background:`${C.green}10`, border:`1px solid ${C.green}35`, borderRadius:10, color:C.green, padding:13, fontFamily:C.sans, fontSize:13, cursor:"pointer" }}>
                  📊 CSV
                </button>
              </div>
              <button onClick={runAnalysis} style={{ width:"100%", background:`${C.green}06`, border:`1px solid ${C.border}`, borderRadius:10, color:C.textDim, padding:11, fontFamily:C.sans, fontSize:12, cursor:"pointer", marginTop:8 }}>
                🔄 Regenerar análisis
              </button>
            </div>
          )}
          {tab === "simulador" && (
            <SimuladorEscenarios form={form} cadena={cadena} baseParams={baseParams} sat={sat} />
          )}
          {tab === "balance" && (
            <div>
              <GraficoBalance form={form} sat={sat} cadena={cadena} tray={tray} motor={motor} />
              <div style={{ marginTop:14 }}>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim, letterSpacing:1, marginBottom:8 }}>CC POR GRUPO AL SERVICIO</div>
                {dist?.grupos?.map((g, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, background:C.card2, borderRadius:10, padding:"10px 14px", marginBottom:6, border:`1px solid ${C.border}` }}>
                    <span style={{ fontFamily:C.font, fontSize:12, color:C.text, minWidth:36 }}>CC{g.ccHoy}</span>
                    <span style={{ flex:1, fontFamily:C.font, fontSize:9, color:C.textDim }}>{g.pct}% · →parto {g.ccParto} →serv {g.ccServ}</span>
                    <span style={{ fontFamily:C.font, fontSize:14, fontWeight:700, color:smf(parseFloat(g.pr),60,80) }}>{g.pr}%</span>
                    <span style={{ fontFamily:C.sans, fontSize:10, color:g.urgencia==="urgente"?C.red:g.urgencia==="importante"?C.amber:C.green }}>{g.recDestete}</span>
                  </div>
                ))}
              </div>
            </div>
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
