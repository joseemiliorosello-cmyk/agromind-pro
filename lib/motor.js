"use client";

// ═══════════════════════════════════════════════════════════════════
// lib/motor.js
// Motor de cálculo ganadero — funciones puras, sin estado React
// excepto useMotor que es un hook.
// Importar: import { correrMotor, useMotor, calcTrayectoriaCC, ... }
//           from "../lib/motor"
// ═══════════════════════════════════════════════════════════════════

import { BIOTIPOS, getBiotipo, SUPLEMENTOS, PROD_BASE,
         CALIDAD_C4_CALIBRADA, ccPond, MESES_NOM, FORM_DEF } from "./constantes";
import React, { useState, useEffect } from "react";

// ─── HELPERS DE MOTOR (getSupl, factores, clima) ─────────────────
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
    const verdeoAp = form.tieneVerdeo
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

// ─── ALGORITMOS CALIBRADOS Y EXTENDIDOS ──────────────────────────
// Tablas NRC 1974: clasificación de salinidad para ganado bovino

function calcImpactoAguaCalibrado(tds, tipoSal, pvVaca, temperatura) {
  if (!tds || tds <= 0) return { hayProblema: false, pctReducDMI: 0, conclusion: "Sin datos de agua." };

  // Umbrales NRC 2000 / OSU Extension para ganado bovino
  const UMBRALES = [
    { max: 1000,  nivel: "Excelente", reducDMI: 0,   riesgo: false, label: "agua de calidad óptima" },
    { max: 2999,  nivel: "Satisfactorio", reducDMI: 0, riesgo: false, label: "agua aceptable" },
    { max: 4999,  nivel: "Marginal", reducDMI: 5,   riesgo: true,  label: "puede causar leve reducción de ingesta" },
    { max: 6999,  nivel: "Riesgo",   reducDMI: 12,  riesgo: true,  label: "reducción de ingesta y GDP" },
    { max: 9999,  nivel: "Alto riesgo", reducDMI: 22, riesgo: true, label: "reducción severa de ingesta, abortos posibles" },
    { max: 99999, nivel: "Peligroso",   reducDMI: 35, riesgo: true, label: "tóxico — alta mortalidad" },
  ];

  const nivel = UMBRALES.find(u => tds <= u.max) || UMBRALES[UMBRALES.length - 1];

  // Ajuste por tipo de sal (sulfatos son más tóxicos que NaCl)
  // Patterson et al. 2003: sulfato → declinación cuadrática de GDP
  const factorTipoSal = {
    "sulfatos":    1.4,  // sulfatos mucho más dañinos
    "bicarbonatos":0.7,  // menos palatabilidad pero menos tóxico
    "cloruros":    1.0,  // referencia NaCl
    "mixto":       1.1,
    "nitrates":    1.3,
  }[tipoSal?.toLowerCase()] || 1.0;

  const pctReduccionReal = Math.min(40, nivel.reducDMI * factorTipoSal);

  // Impacto sobre consumo voluntario
  const cvTeorico  = pvVaca * 0.028; // kg MS/día al 2.8% PV
  const cvPerdido  = Math.round(cvTeorico * pctReduccionReal / 100 * 10) / 10;
  const cvReal     = Math.round((cvTeorico - cvPerdido) * 10) / 10;

  // Impacto con calor (agua salada + calor = efecto multiplicado)
  const temp = parseFloat(temperatura) || 20;
  const factCalor = temp > 30 ? 1.20 : temp > 25 ? 1.10 : 1.0;
  const pctReducFinal = Math.min(45, pctReduccionReal * factCalor);

  // Equivalente en suplemento: cuánto suplemento compensa esta pérdida
  const mcalPerdidas = cvPerdido * 2.05; // Mcal/día perdidas por ingesta reducida
  const kgSuplEquiv  = Math.round(mcalPerdidas / 2.5 * 10) / 10; // kg expeller girasol equiv

  let conclusion = `TDS ${tds.toLocaleString("es-AR")} ppm (${nivel.nivel}) — ${nivel.label}. `;

  if (nivel.riesgo) {
    conclusion += `Reduce consumo voluntario ${Math.round(pctReducFinal)}% → pierde ${cvPerdido} kg MS/vaca/día. `;
    conclusion += `Equivale a eliminar ${kgSuplEquiv} kg/vaca de suplemento diario. `;
    if (tipoSal === "sulfatos") {
      conclusion += `Sulfatos > 1000 ppm: riesgo de polioencefalomalacia en terneros (Patterson et al. 2003). `;
    }
    if (pctReducFinal > 20) {
      conclusion += `PRIORIDAD CRÍTICA: ningún plan nutricional funciona con este nivel de agua. Filtrar o cambiar la fuente antes que cualquier suplemento.`;
    } else {
      conclusion += `Mejorar la fuente aumentaría la respuesta a cualquier suplemento.`;
    }
  } else {
    conclusion += `Calidad adecuada — sin impacto significativo sobre el consumo voluntario.`;
  }

  return {
    tds, tipoSal, nivel: nivel.nivel,
    pctReducDMI: Math.round(pctReducFinal),
    cvPerdido, cvReal, mcalPerdidas: Math.round(mcalPerdidas * 10) / 10,
    kgSuplEquiv,
    hayProblema: nivel.riesgo,
    // Fuentes:
    // Umbrales NRC 1974 / NRC 2000 / Ray 1989 (Oregon State Extension)
    // Sulfatos: Patterson et al. 2003 (J. Anim. Sci. 79:2941-2948)
    // Factor calor: Sanchez et al. 1994 (citado en NASEM 2021)
    conclusion,
  };
}

// Cola preñez: cada mes de retraso en primer parto → -1 ternero total de vida

function calcPenalidadSanidad(form, motor) {
  const penalidades = [];
  let ppPrenezTotal = 0;
  let pctGdpPerdido = 0;

  // Brucelosis sin control
  if (form.sanBrucelosis !== "si") {
    penalidades.push({
      factor: "Brucelosis sin vacunar",
      ppPrenez: 8,
      detalle: "Riesgo de abortos en 7° mes. Infección activa → 2-8% abortos. Obligatorio SENASA Res. 114/21.",
      urgencia: "URGENTE",
    });
    ppPrenezTotal += 8;
  }

  // Abortos registrados
  if (form.sanAbortos === "si") {
    penalidades.push({
      factor: "Abortos registrados en el rodeo",
      ppPrenez: 12,
      detalle: "Abortos activos sin diagnóstico → agente causal desconocido. Brucella, IBR, Leptospira o TVB pendiente de diagnóstico.",
      urgencia: "URGENTE",
    });
    ppPrenezTotal += 12;
  }

  // Toros sin revisación
  if (form.sanToros !== "con_control") {
    penalidades.push({
      factor: "Toros sin revisación andrológica",
      ppPrenez: 10,
      detalle: "Toro con defecto no detectado puede dejar 15-20 vacas vacías silenciosamente. Revisación de campo: 30 min (Chenoweth 1994).",
      urgencia: "P1",
    });
    ppPrenezTotal += 10;
  }

  // Parasitosis externa/interna → GDP
  if (form.sanParasitoExt === "con_problema" || form.sanParasitoInt === "con_problema") {
    penalidades.push({
      factor: "Parasitosis activa",
      pctGdpPerdido: 20,
      ppPrenez: 3,
      detalle: "Parasitosis interna/externa → reduce GDP terneros 15-25% y CC vacas en lactación. Desparasitación estratégica mejora respuesta a suplemento.",
      urgencia: "P2",
    });
    ppPrenezTotal += 3;
    pctGdpPerdido += 20;
  }

  // Sin programa sanitario estructurado
  if (!form.sanPrograma) {
    penalidades.push({
      factor: "Sin programa sanitario estructurado",
      ppPrenez: 4,
      detalle: "Vacunaciones reactivas vs programa preventivo. Los costos de tratamiento superan el costo de prevención.",
      urgencia: "P3",
    });
    ppPrenezTotal += 4;
  }

  const prenezEst = motor?.tray?.pr || 0;
  const prenezConSanidad = Math.max(20, prenezEst - ppPrenezTotal);

  return {
    penalidades,
    ppPrenezTotal,
    pctGdpPerdido,
    prenezEst,
    prenezConSanidad,
    esCritico: ppPrenezTotal > 15 || penalidades.some(p => p.urgencia === "URGENTE"),
    // Fuentes:
    // Brucelosis: SENASA Res. 114/21, literatura INTA
    // Toros: Chenoweth 1994 (Vet. Clin. North Am. Food Anim. Pract.)
    // Parasitosis: Herrera et al. 2021 (INTA Colonia Benítez)
  };
}

//   "About 20% difference exists between these two periods" (AN190/IFAS)

function calcReqEMCategoriaV2(cat, form, mes) {
  const pv     = parseFloat(cat.pv) || 300;
  const pvMet  = Math.pow(pv, 0.75); // peso metabólico

  // Coeficiente NEm base según biotipo (BR-CORTE 2016 / Chizzotti 2019)
  const biotipo = form.biotipo || "Brangus 3/8";
  const pctIndicusMap = {
    "Nelore puro":         1.00,
    "Brahman puro":        1.00,
    "Brangus 3/8":         0.375,
    "Braford 3/8":         0.375,
    "Bradford 5/8":        0.625,
    "Brangus 5/8":         0.625,
    "Cruzado F1":          0.50,
    "Aberdeen Angus":      0.00,
    "Hereford":            0.00,
    "Shorthorn":           0.00,
    "Compuesto taurus":    0.00,
  };
  const pctIndicus = pctIndicusMap[biotipo] ?? 0.375;

  // NEm base interpolado linealmente entre taurus (0.086) e indicus (0.077)
  // Chizzotti et al. 2019: "Bos taurus indicus presents 10% to 8% lower NEm"
  const nemBase = 0.086 - (0.086 - 0.077) * pctIndicus; // Mcal/kg PV^0.75/día

  // Factor de actividad en pastoreo extensivo (NRC 2000)
  // "the difference in maintenance requirements for grazing cattle could be 10–50%"
  // Para pastizal extensivo NEA: +25% sobre base confinamiento
  const factGrazing = 1.25;

  // Factor de fase fisiológica
  const fase = cat.fase || "mantenimiento";
  const factFase = {
    mantenimiento:  1.00,
    gestacion_1:    1.00,  // sin efecto hasta mes 7 de gestación
    gestacion_3:    1.10,  // último tercio +10% por feto
    lactacion:      1.20,  // +20% NEm durante lactación (NRC 2000 / AN190 IFAS)
    crecimiento:    1.00,  // crecimiento calculado aparte como NEg
  }[fase] || 1.00;

  // NEm diario base en Mcal/día
  const nemDia = nemBase * pvMet * factGrazing * factFase;

  // NEg: energía neta de crecimiento para categorías en desarrollo
  // NRC 2000: NEg = 0.0557 × PV^0.75 × GDP^1.097 × (1 / Ef)
  // Ef para C4 pastizal (TDN ~55%): ~0.28
  let negDia = 0;
  const gdpObj = cat.gdpObj || 0; // g/día objetivo
  if (gdpObj > 0 && fase === "crecimiento") {
    const ef = 0.28; // eficiencia energética neta para ganancia en dieta tropical
    negDia = 0.0557 * pvMet * Math.pow(gdpObj/1000, 1.097) / ef;
  }

  // NEp: energía neta de preñez — último tercio de gestación
  // NRC 2000: NEp = (0.00318 × DíasGest - 0.0352) × (CBW/0.95) / 0.13
  // Simplificado: ~2.0–2.5 Mcal/día en mes 8–9
  const diasGest = cat.diasGest || 0;
  let nepDia = 0;
  if (diasGest > 190) {
    nepDia = Math.max(0, (0.00318 * diasGest - 0.0352) * (40 / 0.95) / 0.13);
    nepDia = Math.min(nepDia, 2.5); // máximo razonable
  }

  // NEl: energía neta de lactación
  // NRC 2000: NEl = kg_leche × (0.0929 × %grasa + 0.0547 × %proteina + 0.0395 × %lactosa)
  // Para Brangus/cruza tropical: ~4 kg/día pico, grasa 4.5%, prot 3.5%, lactosa 4.8%
  let nelDia = 0;
  const btMilk = getBiotipo?.(biotipo);
  const leche = btMilk?.leche || 4.0; // kg/día
  if (fase === "lactacion") {
    nelDia = leche * (0.0929 * 4.5 + 0.0547 * 3.5 + 0.0395 * 4.8);
    nelDia = Math.max(nelDia, 0);
  }

  // Total EM diario (Mcal/día)
  // Conversión: EM = NE / km donde km ≈ 0.62–0.65 para pasturas tropicales
  const km = 0.63; // eficiencia ME→NE para mantenimiento en C4 (Detmann/NASSEM 2010)
  const emTotal = (nemDia + negDia + nepDia + nelDia) / km;

  // Factor de estrés calórico (reduce consumo voluntario pero aumenta req de mantenimiento)
  // NRC 2000: "heat stress reduces dry matter intake"
  // >35°C: +5% NEm por termorregulación
  const tempMes = parseFloat(form._tempMes || 20);
  const factCalor = tempMes > 35 ? 1.05 : 1.0;

  return {
    nemDia: Math.round(nemDia * 100) / 100,
    negDia: Math.round(negDia * 100) / 100,
    nepDia: Math.round(nepDia * 100) / 100,
    nelDia: Math.round(nelDia * 100) / 100,
    emTotal: Math.round(emTotal * factCalor * 100) / 100,
    pvMet: Math.round(pvMet),
    nemBase: Math.round(nemBase * 1000) / 1000,
    pctIndicus: Math.round(pctIndicus * 100),
    // Referencias:
    // nemBase: BR-CORTE (Valadares Filho et al. 2016) + Chizzotti et al. 2019
    // factGrazing: NRC 2000 (10-50% adicional en pastoreo extensivo, usado 25%)
    // factLactacion: NRC 2000 / AN190 IFAS (20% adicional durante lactación)
  };
}

// Función lineal calibrada para pastizal natural NEA:
function ndviABiomasa(ndvi, supHa, altPasto, tipoPasto) {
  if (!ndvi || ndvi <= 0) return null;

  // Relación NDVI → % cobertura verde (r=0.95, Miranda et al. 2014)
  const pctVerde = Math.min(95, Math.max(5, (ndvi - 0.15) / (0.75 - 0.15) * 90 + 5));

  // Biomasa total estimada según tipo de vegetación
  // Pastizal natural NEA/Cerrado: 2500–4000 kg MS/ha en verano, 600–1200 en invierno
  const biomasaBase = {
    "Pastizal natural":         { verano: 3200, invierno: 900 },
    "Pastizal degradado":       { verano: 1800, invierno: 500 },
    "Brachiaria spp.":          { verano: 4500, invierno: 1200 },
    "Gatton panic / Buffel":    { verano: 3800, invierno: 800 },
    "Pasto miel / Setaria":     { verano: 3500, invierno: 1000 },
    "Mixto gramínea-leguminosa":{ verano: 3200, invierno: 900 },
  }[tipoPasto] || { verano: 3000, invierno: 850 };

  // Interpolar según NDVI: 0.35 → invierno, 0.70 → verano
  const t = Math.max(0, Math.min(1, (ndvi - 0.35) / (0.70 - 0.35)));
  const kgMsHa = biomasaBase.invierno + t * (biomasaBase.verano - biomasaBase.invierno);

  // Capacidad de cosecha del animal: 50% disponible de la biomasa total
  // (pisoteo, rechazo, inaccesible por altura)
  const utilizable = kgMsHa * 0.50;

  // Efecto altura del pasto sobre la ingesta selectiva
  const alt = parseFloat(altPasto) || 20;
  const factAlt = alt < 5 ? 0.65 : alt < 10 ? 0.80 : alt < 20 ? 0.95 : 1.0;

  return {
    ndvi, pctVerde: Math.round(pctVerde),
    kgMsHa:    Math.round(kgMsHa),
    utilizable: Math.round(utilizable * factAlt),
    kgMsTotal:  Math.round(utilizable * factAlt * (supHa || 1)),
    // Fuentes:
    // Miranda et al. 2014 (Cerrado biomass): ~7 t/ha total biomass
    // Ferreira et al. 2011 (MODIS-NDVI): variación 130% verano-invierno
    // Utilización 50%: estándar manejo extensivo pastizal natural
  };
}

function calcOfertaMensualCalibrada(form, sat, mes) {
  const fenol   = form.fenologia || "mayor_50";
  const calidad = CALIDAD_C4_CALIBRADA[fenol] || CALIDAD_C4_CALIBRADA.mayor_50;
  const supHa   = parseFloat(form.supHa) || 0;
  const pctMonte= parseFloat(form.pctMonte) || 30; // % superficie con monte (menor productividad)
  const pctNGan  = parseFloat(form.pctNGan)  || 0;  // % no ganadero

  // Superficie efectiva para pastoreo
  const supEfectiva = supHa * (1 - pctMonte/100 * 0.5) * (1 - pctNGan/100);

  // NDVI: usar sat si disponible, si no usar histórico mensual
  const ndviReal = parseFloat(sat?.ndvi) || null;
  const ndviHist = {
    0: 0.65, 1: 0.68, 2: 0.60, 3: 0.50, 4: 0.42,
    5: 0.38, 6: 0.35, 7: 0.36, 8: 0.40, 9: 0.48,
    10: 0.57, 11: 0.62
  }[mes] || 0.45;
  const ndvi = ndviReal ?? ndviHist;

  // Biomasa disponible
  const biomasa = ndviABiomasa(ndvi, supEfectiva, form.altPasto, form.tipoPasto);
  const kgMsDisp = biomasa?.kgMsTotal || 0;

  // Oferta energética total del pasto (Mcal/día)
  const mcalDia = kgMsDisp / 30 * calidad.mcalKg; // mensual → diario

  // Límite por consumo voluntario real (factor PB)
  // Detmann/NASSEM 2010: cuando PB < 7%, consumo voluntario cae 20-45%
  const factCV = calidad.pb >= 10 ? 1.00 : calidad.pb >= 7 ? 0.80 : 0.55;
  const mcalDisponible = mcalDia * factCV;

  return {
    ndvi,
    kgMsHa:    biomasa?.kgMsHa || 0,
    kgMsDisp,
    mcalDia:   Math.round(mcalDia),
    mcalDisponible: Math.round(mcalDisponible),
    dig:       calidad.dig,
    pb:        calidad.pb,
    mcalKg:    calidad.mcalKg,
    fenolLabel: calidad.label,
    factCV,
    supEfectiva: Math.round(supEfectiva),
    // Fuentes oferta:
    // Calibración NDVI→biomasa: Miranda et al. 2014, Ferreira et al. 2011
    // Mcal/kg MS por fenología: Minson 1990 + PMC 9311783 meta-análisis C4
    // Factor consumo voluntario: Detmann/NASSEM 2010 (PB<7% → microflora paralizada)
  };
}

// Retorna: { tipo, label, opciones:[{nombre,dosis,freq,motivo,efectoCV}], impactoCV }
function recomendarSuplemento(fenologia, pbPasto, disponMS, deficitMcal, pvKg, form, categoria) {
  const stock     = (form?.stockAlim || []).map(s => s.alimento);
  const inHay     = (n) => stock.includes(n);

  // Diagnosticar el tipo de déficit
  const defProt   = pbPasto < 7;    // déficit proteico → colapso microbiano
  const defEnerg  = deficitMcal > 0; // déficit energético neto del balance
  const pastoEsc  = disponMS < 1200; // pasto escaso (<1200 kgMS/ha)

  // Clasificar: P, E, o EP
  const tipo = defProt && !pastoEsc ? "P"   // pasto OK en cantidad pero poca proteína
             : defProt && pastoEsc  ? "EP"  // poco pasto Y baja proteína → ambos
             : defEnerg             ? "EP"  // déficit energético → refuerzo mixto
                                    : "P";  // default: siempre hay algo de déficit proteico en C4

  // CV actual y potencial con corrección proteica
  const cvBase    = pvKg * 0.022; // kg MS/día sin corrección
  const boostCV   = defProt ? Math.min(0.8, cvBase * 0.35) : 0; // +35% con proteína (NASSEM)
  const cvCorr    = +(cvBase + boostCV).toFixed(1);
  const impactoCV = defProt
    ? `+${Math.round(boostCV*1000)}g MS/día adicional de pasto consumido al corregir PB (Detmann 2010)`
    : defEnerg
    ? `Cubre ${Math.round(deficitMcal)} Mcal/día de déficit sin modificar el pasto`
    : "";

  // Armar opciones según tipo y stock disponible
  const opciones = [];

  if (tipo === "P" || tipo === "EP") {
    // Proteico preferido: girasol (disponible en NEA), alternativa: soja o algodón
    const prot1 = inHay("Expeller soja")    ? "Expeller soja"
                : inHay("Expeller algodón") ? "Expeller algodón"
                :                             "Expeller girasol";
    const s1    = SUPLEMENTOS[prot1];
    const dosis1 = calcDosisProtein(pvKg, pbPasto, defProt ? 8 : 10, s1);
    const freq1  = "2–3 veces/semana (proteico — no diario)";
    opciones.push({
      nombre:   prot1,
      tipo:     "P",
      dosis:    dosis1,
      freq:     freq1,
      pb:       s1.pb,
      em:       s1.em,
      motivo:   defProt
        ? `PB pasto ${pbPasto}% <7% → microflora colapsa → digestión fibra cae. ${prot1} (PB ${s1.pb}%) activa el rumen`
        : `Refuerzo proteico para categoría ${categoria||"rodeo"}`,
      efectoCV: defProt ? `CV pasto sube ${Math.round(boostCV*1000)}g MS/día` : "",
    });
  }

  if (tipo === "E" || tipo === "EP") {
    // Energético: sorgo preferido (diario), alternativa maíz
    const ener1 = inHay("Maíz grano")      ? "Maíz grano"
                : inHay("Sorgo grano")     ? "Sorgo grano"
                : inHay("Afrechillo trigo")? "Afrechillo trigo"
                :                            "Sorgo grano";
    const s2    = SUPLEMENTOS[ener1];
    // Dosis: cubrir déficit Mcal con este alimento
    const dosis2 = deficitMcal > 0
      ? Math.max(0.3, Math.min(2.5, +(deficitMcal / s2.em / Math.max(1, pvKg>0?1:1)).toFixed(1)))
      : 0.5;
    opciones.push({
      nombre:   ener1,
      tipo:     "E",
      dosis:    dosis2,
      freq:     "Diario obligatorio (almidón — riesgo acidosis si intermitente)",
      pb:       s2.pb,
      em:       s2.em,
      motivo:   `Déficit energético ${deficitMcal > 0 ? Math.abs(Math.round(deficitMcal)) + " Mcal/día" : "moderado"} — ${ener1} (${s2.em} Mcal/kg EM)`,
      efectoCV: "",
    });
  }

  // Semilla de algodón como alternativa EP solo para Vaq2 y vacas adultas (no Vaq1)
  if ((tipo === "EP" || tipo === "P") && categoria !== "vaq1" && inHay("Semilla algodón")) {
    const s3 = SUPLEMENTOS["Semilla algodón"];
    opciones.push({
      nombre:  "Semilla algodón",
      tipo:    "EP",
      dosis:   Math.min(1.5, pvKg * 0.005),
      freq:    "Ad libitum o 2–3 veces/semana",
      pb:      s3.pb,
      em:      s3.em,
      motivo:  "Alternativa EP local: proteína bypass + energía grasa. Ad libitum válido en Vaq2 >280kg",
      efectoCV: defProt ? `CV pasto sube ${Math.round(boostCV*0.7*1000)}g MS/día` : "",
    });
  }

  return { tipo, opciones, impactoCV, cvBase, cvCorr, defProt, defEnerg, pastoEsc };
}

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

// Devuelve { total, dim: [{id, nombre, score, color, descripcion, peso}] }
function calcScore(motor, form, faseCiclo) {
  if (!motor) return null;

  const { tray, vaq1E, vaq2E, balanceMensual, sanidad } = motor;
  const ccServ       = parseFloat(tray?.ccServ   || 0);
  const prenez       = tray?.pr    ?? 0;
  const anestro      = tray?.anestro?.dias ?? 90;
  const ccToros      = parseFloat(form.torosCC || 0);
  const vaq2Llega    = vaq2E?.llegas ?? true;
  const vaq1Ok       = !vaq1E || (vaq1E?.gdpReal || 0) >= 400;
  const mesesDef     = balanceMensual.filter(m => [5,6,7].includes(m.i) && m.balance < 0).length;
  const peorBal      = balanceMensual.filter(m=>[5,6,7].includes(m.i)).reduce((min,m)=>m.balance<(min?.balance??0)?m:min,null)?.balance ?? 0;
  const fase         = faseCiclo?.fase || "SIN_FECHA";

  // ── 1. CC al servicio (25%) ───────────────────────────────────
  // Óptimo ≥5.0, aceptable ≥4.5, crítico <4.0
  let scoreCC = 0;
  let descCC  = "";
  if (ccServ <= 0) {
    scoreCC = 50; descCC = "Sin dato de CC al servicio";
  } else if (ccServ >= 5.0) {
    scoreCC = 100; descCC = "CC óptima al servicio (≥5.0)";
  } else if (ccServ >= 4.5) {
    scoreCC = 75 + (ccServ - 4.5) / 0.5 * 25;
    descCC = "CC aceptable — margen ajustado para biotipos Bos taurus";
  } else if (ccServ >= 4.0) {
    scoreCC = 40 + (ccServ - 4.0) / 0.5 * 35;
    descCC = "CC baja al servicio — preñez comprometida ~8-12pp por cada 0.5 puntos menos";
  } else {
    scoreCC = Math.max(0, (ccServ - 2.0) / 2.0 * 40);
    descCC = "CC crítica — anestro prolongado, preñez severamente reducida";
  }
  // Ajuste contextual: si estamos en PARTO o PRE_PARTO, penalizar menos (la CC se va a mover)
  if (fase === "PARTO" || fase === "PRE_PARTO") scoreCC = Math.min(100, scoreCC * 1.1);

  // ── 2. Balance forrajero invernal (20%) ──────────────────────
  let scoreBal = 0;
  let descBal  = "";
  if (mesesDef === 0) {
    scoreBal = 95; descBal = "Balance invernal positivo — oferta cubre demanda los 3 meses críticos";
  } else if (mesesDef === 1) {
    const deficit = Math.abs(peorBal);
    scoreBal = deficit < 5 ? 70 : deficit < 15 ? 50 : 35;
    descBal = "Un mes con déficit invernal — manejable con suplemento o ajuste de carga";
  } else if (mesesDef === 2) {
    const deficit = Math.abs(peorBal);
    scoreBal = deficit < 10 ? 40 : 20;
    descBal = "Dos meses con déficit — pérdida de CC invernal significativa sin intervención";
  } else {
    const deficit = Math.abs(peorBal);
    scoreBal = deficit < 15 ? 20 : 5;
    descBal = "Déficit invernal los 3 meses — las vacas pierden CC, el servicio empieza comprometido";
  }

  // ── 3. Reproducción (20%) ────────────────────────────────────
  // Combina: preñez proyectada + anestro + CC toros
  let scoreRepro = 0;
  let descRepro  = "";
  const prenezScore = prenez >= 75 ? 100 : prenez >= 60 ? 80 : prenez >= 45 ? 55 : prenez >= 30 ? 30 : 10;
  const anestroScore = anestro <= 45 ? 100 : anestro <= 60 ? 80 : anestro <= 90 ? 55 : anestro <= 120 ? 30 : 10;
  const toroScore = ccToros <= 0 ? 70 : ccToros >= 5.5 ? 100 : ccToros >= 5.0 ? 80 : ccToros >= 4.5 ? 55 : 30;
  scoreRepro = Math.round(prenezScore * 0.5 + anestroScore * 0.3 + toroScore * 0.2);
  descRepro = "Preñez " + prenez + "% · Anestro " + anestro + "d" + (ccToros > 0 ? " · Toros CC " + ccToros : "");

  // ── 4. Vaquillona de reposición (15%) ────────────────────────
  let scoreVaq = 0;
  let descVaq  = "";
  const gdpV1  = vaq1E?.gdpReal || 0;
  if (!vaq1E && !vaq2E) {
    scoreVaq = 60; descVaq = "Sin datos de vaquillona cargados";
  } else {
    const v1Score = !vaq1E ? 75 : gdpV1 >= 533 ? 100 : gdpV1 >= 400 ? 75 : gdpV1 >= 250 ? 45 : 20;
    const v2Score = !vaq2E ? 75 : vaq2Llega ? 100 : Math.max(10, 100 - (vaq2E.pvMinEntore - vaq2E.pvEntore) * 2);
    scoreVaq = Math.round(v1Score * 0.5 + v2Score * 0.5);
    descVaq = (vaq1E ? "Vaq1 GDP " + gdpV1 + "g/d" : "Sin Vaq1") +
              (vaq2E ? " · Vaq2 " + (vaq2Llega ? "llega al entore" : "no llega (" + Math.round(vaq2E.pvEntore||0) + "/" + Math.round(vaq2E.pvMinEntore||0) + "kg)") : "");
  }

  // ── 5. Sanidad (15%) ────────────────────────────────────────
  let scoreSan = 100;
  let descSan  = "";
  const alerts = sanidad?.alerts || [];
  const alertasRojas = alerts.filter(a => a.nivel === "rojo").length;
  const alertasAmbar = alerts.filter(a => a.nivel === "ambar").length;
  scoreSan = Math.max(0, 100 - alertasRojas * 25 - alertasAmbar * 10);
  if (form.sanAftosa !== "si") scoreSan = Math.max(0, scoreSan - 20);
  if (form.sanBrucelosis !== "si") scoreSan = Math.max(0, scoreSan - 15);
  descSan = alertasRojas > 0
    ? alertasRojas + " alerta" + (alertasRojas > 1 ? "s" : "") + " sanitaria" + (alertasRojas > 1 ? "s" : "") + " crítica" + (alertasRojas > 1 ? "s" : "")
    : alertasAmbar > 0 ? alertasAmbar + " observación" + (alertasAmbar > 1 ? "es" : "") + " sanitaria" + (alertasAmbar > 1 ? "s" : "")
    : "Sin alertas sanitarias activas";

  // ── 6. GEI — eficiencia emisiones (5%) ──────────────────────
  // Intensidad: kg CO2e / kg PV producido. Mejor = menos emisiones por kg
  let scoreGEI = 60; // default si no hay datos
  let descGEI  = "Sin datos suficientes para calcular eficiencia GEI";
  const gei = calcGEI(form, motor, motor?.tray, null);
  if (gei) {
    const intens = parseFloat(gei.intensBase || 0);
    // Referencia NEA: 25–35 kg CO2e/kg PV (promedio sistemas extensivos)
    // Bueno: <25, aceptable: 25–35, alto: 35–50, crítico: >50
    scoreGEI = intens <= 0 ? 60 : intens < 20 ? 100 : intens < 25 ? 85 : intens < 35 ? 65 : intens < 50 ? 40 : 20;
    descGEI = intens > 0 ? "Intensidad: " + intens.toFixed(1) + " kg CO₂e/kg PV producido" : "Sin producción calculada";
  }

  // ── TOTAL PONDERADO ──────────────────────────────────────────
  const dim = [
    { id:"cc",      nombre:"CC al servicio",    score:Math.round(scoreCC),    peso:25, descripcion:descCC,    color:scoreCC>=75?C.green:scoreCC>=50?C.amber:C.red },
    { id:"balance", nombre:"Balance invernal",   score:Math.round(scoreBal),   peso:20, descripcion:descBal,   color:scoreBal>=75?C.green:scoreBal>=50?C.amber:C.red },
    { id:"repro",   nombre:"Reproducción",       score:Math.round(scoreRepro), peso:20, descripcion:descRepro, color:scoreRepro>=75?C.green:scoreRepro>=50?C.amber:C.red },
    { id:"vaq",     nombre:"Vaquillona",         score:Math.round(scoreVaq),   peso:15, descripcion:descVaq,   color:scoreVaq>=75?C.green:scoreVaq>=50?C.amber:C.red },
    { id:"sanidad", nombre:"Sanidad",            score:Math.round(scoreSan),   peso:15, descripcion:descSan,   color:scoreSan>=75?C.green:scoreSan>=50?C.amber:C.red },
    { id:"gei",     nombre:"Eficiencia GEI",     score:Math.round(scoreGEI),   peso:5,  descripcion:descGEI,   color:scoreGEI>=75?C.green:scoreGEI>=50?C.amber:C.red },
  ];
  const total = Math.round(dim.reduce((s,d) => s + d.score * d.peso / 100, 0));
  const colorTotal = total >= 75 ? C.green : total >= 50 ? C.amber : C.red;
  const labelTotal = total >= 80 ? "Sistema bien manejado" : total >= 65 ? "Sistema con oportunidades" : total >= 50 ? "Sistema con limitantes importantes" : "Sistema en situación crítica";

  return { total, colorTotal, labelTotal, dim };
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
    peorBalance:   balanceMensual.length > 0 ? Math.min(...balanceMensual.map(m=>m.balance||0)) : 0,
    stockOk:       Object.values(stockStatus).every(s=>s.suficiente),
    relacionAT:    (nVacas && nToros) ? Math.round(nVacas/nToros) : null,
    ccToros:       parseFloat(form.torosCC) || null,
    sanidadAlerts: sanidad?.alerts?.length ?? 0,
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
        descripcionCuello = "Pasto suficiente y buena calidad — revisar PV entrada";
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
  if (form.sanToros==="sin_control") cuellos.push({ id:"san_toros_rev", categoria:"Sanidad", icono:"🔴", prioridad:"P1", titulo:"Toros sin revisión pre-servicio", impacto:"Toro con lesión no detectada puede dejar 15–20 vacas vacías silenciosamente", causas:[] });

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
    { id:"toro", label:"Toros",             n:nToros, pv:parseFloat(form.pvToros)||Math.round(pvVaca*1.30), catCV:"toro" },
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

    // Meses con suplemento activo (índice 0=ene…11=dic)
    const suplMesesSet = new Set(
      Array.isArray(form.suplMeses)
        ? form.suplMeses.map(m => parseInt(m))
        : [5, 6, 7] // default jun-jul-ago
    );

    ch4MensualBase.forEach((m, mesIdx) => {
      const diasMes   = 30;
      const cvBase    = consumoMSCat(c.pv, c.catCV, m.dig, m.fenol, m.t);

      // Suplemento solo en los meses seleccionados por el usuario
      const haySuplEsteMes = c.suplDosis > 0 && suplMesesSet.has(mesIdx);

      // Con suplemento: mayor digestibilidad → menor Ym → menos CH4/kg MS
      // Sin suplemento ese mes: usar la digestibilidad base del pasto
      const digS  = haySuplEsteMes ? digConSupl(m.dig, c.suplPb, c.suplDosis, cvBase) : m.dig;
      const ch4S  = calcCH4_kgMS(digS); // baja si digS > m.dig
      // Consumo voluntario: suplemento puede aumentar levemente el total
      // pero la EFICIENCIA (g CH4/kg MS) baja porque mejor Ym
      const cvS   = haySuplEsteMes
        ? +(cvBase * (digS > m.dig + 3 ? 1.05 : 1.02) + c.suplDosis).toFixed(2)
        : cvBase;

      ch4DiaBaseAcum  += cvBase * m.ch4KgMs * diasMes;
      ch4DiaSuplAcum  += cvS   * ch4S       * diasMes;
      digSuplPromAcum += digS  * diasMes;
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

    // GWP100 AR6 (IPCC 2021): GWP₁₀₀ CH₄ = 27.9 ≈ 28
    // GWP* (Allen et al. 2018, npj Clim Atmos Sci 1:16): métrica para gases de vida corta
    // GWP* mide la contribución al CALENTAMIENTO de un FLUJO de emisión, no de una masa.
    // Para rodeo ESTABLE (sin crecimiento de stock): GWP*_efectivo ≈ 0 a largo plazo
    //   porque el CH₄ emitido hoy reemplaza al CH₄ que se oxidó hace ~12 años.
    // Para rodeo CRECIENTE: GWP* > GWP100 (el flujo creciente SÍ agrega calentamiento).
    // Usamos una aproximación conservadora para comunicación:
    //   Rodeo estable: mostramos GWP100 como límite superior y nota explicativa
    //   No usamos un GWP* "promedio" — sería scientificamente incorrecto.
    const co2eqBase_gwp28  = ch4AnoBase * GWP_CH4;
    const co2eqSupl_gwp28  = ch4AnoSupl * GWP_CH4;
    // Para rodeo estable: el calentamiento real es ~0 (Allen 2018)
    // Expresamos como fracción del GWP100 para dar contexto, no como factor fijo
    const co2eqBase_star   = 0;  // rodeo estable → contribución al calentamiento ≈ 0
    const co2eqSupl_star   = 0;

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
    form.vegetacion || "Pastizal natural",
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

//   - Total de kg de ternero producidos y la diferencia
function calcImpactoCola(prenezTotal, cabezaPct, vacasN, pctDestete, mesesServicio) {
  const vN  = parseInt(vacasN)        || 0;
  const pr  = parseFloat(prenezTotal) || 0;
  const pd  = parseFloat(pctDestete)  || 88;
  const ms  = Math.min(4, mesesServicio || 3); // meses de servicio (máx 4)
  if (!vN || !pr) return null;

  // Distribución de preñez por mes de servicio
  // Con una cabeza de parición dada, el resto se distribuye en los meses siguientes
  // Patrón típico NEA: 50-60% mes 1, 25-30% mes 2, resto mes 3-4
  const cabeza = Math.min(pr, Math.max(10, cabezaPct || Math.round(pr * 0.55)));
  const resto  = pr - cabeza;
  const mes2   = Math.min(resto, Math.round(resto * 0.55));
  const mes3   = Math.min(resto - mes2, Math.round(resto * 0.35));
  const mes4   = Math.max(0, resto - mes2 - mes3);

  // Peso al destete por mes de preñez (base: destete tradicional 180d, GDP 700g/d)
  // Parto mes 1 → destete ~septiembre-octubre → 180d × 700g/d + 35kg nacer = 161 kg
  // Cada mes de atraso = 21 kg menos (30d × 700g/d)
  const PV_BASE_DESTETE = 161; // kg, ternero de vaca preñada en mes 1 del servicio
  const KG_POR_MES_ATRASO = 21; // INTA Maresca 2022: 20-25 kg

  const pvMes = [
    PV_BASE_DESTETE,
    PV_BASE_DESTETE - KG_POR_MES_ATRASO,
    PV_BASE_DESTETE - KG_POR_MES_ATRASO * 2,
    PV_BASE_DESTETE - KG_POR_MES_ATRASO * 3,
  ];

  const distPct  = [cabeza, mes2, mes3, mes4];
  const terneros = Math.round(vN * pr / 100 * pd / 100);

  // Peso promedio ponderado al destete
  const pvProm = distPct.reduce((s, p, i) => s + (p / Math.max(1, pr)) * pvMes[i], 0);

  // Escenario objetivo: cabeza ≥ 60%
  const cabezaObj = Math.min(pr, 60);
  const restoObj  = pr - cabezaObj;
  const pvPromObj = cabezaObj/pr * pvMes[0] + (restoObj/pr) * pvMes[1];

  const kgDifPorTernero = Math.round(pvPromObj - pvProm);
  const kgDifTotal      = Math.round(kgDifPorTernero * terneros);

  // Cabeza de parición óptima si la preñez total >= 60%
  const cabezaOptima    = pr >= 60 ? cabeza >= 60 : null;

  return {
    cabeza:           Math.round(cabeza),
    pvPromDestete:    Math.round(pvProm),
    pvPromObj:        Math.round(pvPromObj),
    kgDifPorTernero,
    kgDifTotal,
    terneros,
    cabezaOptima,
    distPct:          distPct.map(p => Math.round(p)),
    pvMes,
    // Mensaje para el dashboard
    msg: kgDifPorTernero > 0
      ? `Subir cabeza de parición de ${Math.round(cabeza)}% a 60%: +${kgDifPorTernero} kg/ternero (+${kgDifTotal} kg total)`
      : cabeza >= 60
        ? `Cabeza de parición ${Math.round(cabeza)}% — distribución de preñez óptima`
        : null,
  };
}

//         balanceMesActual }
function calcFaseCiclo(cadena, form, ctx) {
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);

  // Sin fechas cargadas → fase indefinida
  if (!cadena?.ini || !cadena?.fin) {
    return {
      fase: "SIN_FECHA",
      label: "Sin fechas de servicio",
      icono: "📅",
      color: "#888",
      diasEnFase: 0,
      descripcion: "Cargá las fechas de inicio y fin de servicio para activar el diagnóstico contextual.",
      acciones: ["Ir al paso Ubicación y cargar las fechas de servicio"],
      siguiente: null,
    };
  }

  // Contexto del rodeo — valores reales si están, defaults si no
  const {
    tempHoy        = null,
    ndviHoy        = null,
    p30Hoy         = null,
    ccServ         = 0,
    ccToros        = 0,
    prenez         = 0,
    mesesDeficit   = 0,
    peorBalanceMcal= 0,
    pvVaca         = 320,
    nVacas         = 0,
    vaq1SinCorr    = false,
    vaq2Llega      = true,
    pvVaq2Falta    = 0,
    balanceMesActual = 0,
  } = ctx || {};

  const frio     = tempHoy !== null && tempHoy < 15;
  const calor    = tempHoy !== null && tempHoy >= 28;
  const pastoB   = ndviHoy !== null && ndviHoy < 0.40;
  const seco     = p30Hoy  !== null && p30Hoy  < 50;
  const deficit  = balanceMesActual < 0;
  const ccBaja   = ccServ > 0 && ccServ < 4.5;
  const torosBajos = ccToros > 0 && ccToros < 5.0;

  // Helpers de texto climático reutilizables
  const climaStr = () => {
    const parts = [];
    if (frio)   parts.push(`${tempHoy}°C — C4 dormido`);
    if (pastoB) parts.push(`NDVI ${ndviHoy?.toFixed(2)} — pasto escaso`);
    if (seco)   parts.push(`lluvia 30d: ${p30Hoy}mm — seco`);
    if (deficit) parts.push(`déficit ${Math.abs(balanceMesActual)} Mcal/día hoy`);
    return parts.length ? ` (${parts.join(" · ")})` : "";
  };

  const ini       = new Date(cadena.ini);
  const fin       = new Date(cadena.fin);
  const partoIni  = new Date(cadena.partoTemp);
  const partoFin  = new Date(cadena.partoTard);
  const tactoIni  = new Date(fin); tactoIni.setDate(tactoIni.getDate() + 58);
  const tactoFin  = new Date(fin); tactoFin.setDate(tactoFin.getDate() + 80);
  const preServIni= new Date(ini); preServIni.setDate(preServIni.getDate() - 45);
  const prePartoIni = new Date(partoIni); prePartoIni.setDate(prePartoIni.getDate() - 35);
  const postPartoFin= new Date(partoFin); postPartoFin.setDate(postPartoFin.getDate() + 30);
  const iniProx   = new Date(ini); iniProx.setFullYear(iniProx.getFullYear() + 1);
  const preServProxIni = new Date(iniProx); preServProxIni.setDate(preServProxIni.getDate() - 45);

  const dias = (a, b) => Math.round((b - a) / 86400000);
  const fmtD = (d) => d.toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit" });

  let fase, label, icono, color, diasEnFase, descripcion, acciones, siguiente;

  if (hoy >= ini && hoy <= fin) {
    fase        = "SERVICIO";
    label       = "Servicio activo";
    icono       = "🐂";
    color       = "#4a9fd4";
    diasEnFase  = dias(ini, hoy);
    const diasRestServ = dias(hoy, fin);
    const pctServ = Math.round(diasEnFase / Math.max(1, dias(ini, fin)) * 100);
    // Descripción con datos reales del rodeo
    const cabeza = pctServ < 35
      ? `Las vacas de \"cabeza\" (las que ciclaron en los primeros 21 días) ya deberían estar preñadas.`
      : pctServ < 70
      ? `Se completaron aproximadamente ${pctServ}% de los ciclos — \"cabeza\" preñada, \"cuerpo\" en curso.`
      : `Últimos días de servicio — quedan ${diasRestServ} días. Solo quedan los ciclos de \"cola\".`;
    descripcion =
      `Servicio en curso — día ${diasEnFase + 1} de ${dias(ini, fin)} días (${pctServ}% completado)${climaStr()}. ` +
      cabeza +
      (ccBaja ? ` CC al servicio ${ccServ} — por debajo de 4.5: vacas con ternero al pie están en desventaja reproductiva.` : "") +
      (torosBajos ? ` Toros con CC ${ccToros} — rendimiento reducido (libido y eyaculado comprometidos).` : "");
    acciones = [
      `Controlar que los toros están trabajando — pintura de lomo o collares detectores de celo`,
      ccBaja
        ? `CC ${ccServ}: aplicar destete precoz a vacas con ternero al pie — cada día cuenta`
        : `Vacas en servicio con buen estado (CC ${ccServ}) — mantener el manejo actual`,
      torosBajos
        ? `Toros CC ${ccToros}: suplementar ahora — libido recupera con la CC en 3–4 semanas`
        : `Confirmar relación toro/vaca — máximo 25 vacas por toro en campo abierto`,
      diasRestServ < 30
        ? `Preparar retiro de toros: ${fmtD(fin)} — anunciar el cierre del servicio al personal`
        : `Planificar reserva de potreros para invierno — cerrar en febrero antes del pisoteo otoñal`,
    ].filter(Boolean);
    siguiente = { label: "Retiro toros", diasFaltan: diasRestServ };

  } else if (hoy > fin && hoy < tactoIni) {
    fase        = "POST_SERVICIO";
    label       = "Post-servicio";
    icono       = "📋";
    color       = "#888";
    diasEnFase  = dias(fin, hoy);
    const diasAlTacto = dias(hoy, tactoIni);
    descripcion =
      `Toros retirados hace ${diasEnFase} días. Las vacas están en gestación temprana — el embrión se está implantando. ` +
      `En ${diasAlTacto} días se puede hacer el tacto rectal (mínimo 58 días post-retiro). ` +
      (pastoB ? `NDVI ${ndviHoy?.toFixed(2)} — pasto limitado: las vacías van a competir con las preñadas. Anticipar el descarte.` :
       `Es momento de reservar potreros y preparar el balance forrajero para el invierno.`);
    acciones = [
      `Revisión de toros después del servicio — CC, aplomos, prepucio, lesiones de monta`,
      `Reservar potreros: cerrar los mejores para el invierno antes de que se pisooteen en otoño`,
      `Calcular cuántas vacas vacías entran al invierno — cada vaca vacía gasta pasto que necesita una preñada`,
      diasAlTacto < 20
        ? `Tacto en ${diasAlTacto} días — coordinar veterinario y manga YA`
        : `Preparar manga para tacto en ${fmtD(tactoIni)}`,
    ];
    siguiente = { label: "Tacto rectal", diasFaltan: diasAlTacto };

  } else if (hoy >= tactoIni && hoy <= tactoFin) {
    fase        = "TACTO";
    label       = "Período de tacto";
    icono       = "🔬";
    color       = "#e8a030";
    diasEnFase  = dias(tactoIni, hoy);
    const diasRestTacto = dias(hoy, tactoFin);
    descripcion =
      `Momento más importante del año para la gestión del rodeo. ` +
      `Diagnóstico de preñez a todo el vientre — sin excepciones. ` +
      `Las vacas vacías que coman pasto este invierno no producen un ternero y le quitan energía a las preñadas que la necesitan para llegar bien al parto. ` +
      (mesesDeficit > 0
        ? `Con ${mesesDeficit} mes${mesesDeficit > 1 ? "es" : ""} de déficit forrajero proyectado, cada vaca vacía que quede es pasto que falta.`
        : `El balance forrajero cierra — pero el objetivo sigue siendo no cargar vacas improductivas en invierno.`);
    acciones = [
      `Diagnosticar preñez a TODO el rodeo — sin excepciones`,
      `Vacas vacías gordas → venta inmediata (precio alto otoño, antes que baje)`,
      `Vacas vacías flacas → analizar invernada si el precio del suplemento lo justifica`,
      `Boqueo simultáneo — CUT a preñadas con dentición límite; descarte a vacías`,
      mesesDeficit > 1
        ? `Déficit invernal proyectado — calcular cuántas cabezas descartar para no suplementar`
        : `Calcular cuántas vaquillonas de reposición entran al próximo servicio`,
    ];
    siguiente = { label: "Gestación media", diasFaltan: diasRestTacto };

  } else if (hoy > tactoFin && hoy < prePartoIni) {
    fase        = "GESTACION_MEDIA";
    label       = "Gestación media";
    icono       = "🌿";
    color       = "#7ec850";
    diasEnFase  = dias(tactoFin, hoy);
    const diasAlPreparto = dias(hoy, prePartoIni);
    const mesActual = hoy.getMonth();
    const esInviernoAhora = mesActual >= 4 && mesActual <= 7;
    descripcion =
      `Las vacas preñadas están en gestación ${Math.round(dias(fin, hoy) / 30) + 2}–${Math.round(dias(fin, hoy) / 30) + 3} meses. ` +
      (esInviernoAhora
        ? `Es el período de menor requerimiento nutricional de la vaca preñada seca — tolera restricción planificada${climaStr()}. `
        : `Período de relativa tranquilidad del rodeo. `) +
      (vaq1SinCorr
        ? `Atención: la vaquillona de primer invierno está ganando por debajo del mínimo — esta es la ventana para suplementar. `
        : "") +
      (!vaq2Llega
        ? `La vaquillona de segundo invierno no llega al peso de entore — le faltan ${pvVaq2Falta} kg. Suplementar ahora. `
        : "") +
      `En ${diasAlPreparto} días empieza el preparto — la única ventana donde el suplemento en vacas adultas tiene retorno real.`;
    acciones = [
      esInviernoAhora
        ? `Suplemento en vacas adultas ahora NO es eficiente — reservar el recurso para el preparto (${fmtD(prePartoIni)})`
        : `Mantener el monitoreo del estado corporal del rodeo`,
      vaq1SinCorr
        ? `Vaquillona 1° invierno — suplementar AHORA: 0.3–0.5 kg expeller/día (PB <8% → colapso microbiano)`
        : `Pesar vaquillona de reposición — confirmar que va a llegar al peso de entore`,
      !vaq2Llega
        ? `Vaquillona 2° invierno — le faltan ${pvVaq2Falta} kg para el entore: suplementar con proteína + energía`
        : `Vaquillona 2° invierno en camino — confirmar peso al inicio del servicio`,
      `Preparar suelos y siembra de verdeos de invierno si corresponde`,
    ];
    siguiente = { label: "Preparto", diasFaltan: diasAlPreparto };

  } else if (hoy >= prePartoIni && hoy < partoIni) {
    fase        = "PRE_PARTO";
    label       = "Preparto";
    icono       = "⚡";
    color       = "#e8a030";
    diasEnFase  = dias(prePartoIni, hoy);
    const diasAlParto = dias(hoy, partoIni);
    descripcion =
      `Últimas semanas antes del primer parto esperado (${fmtD(partoIni)}) — ${diasAlParto} días. ` +
      `ÚNICA ventana del año donde el suplemento en vacas adultas tiene retorno real: ` +
      `sin ternero al pie, cada Mcal extra va a CC, calostro y arranque del ternero. ` +
      (frio
        ? "Con " + tempHoy + "°C el pasto no aporta energía suficiente" + (deficit ? " — hay un déficit de " + Math.abs(balanceMesActual) + " Mcal/día" : "") + ". El suplemento preparto es indispensable."
        : ccBaja
        ? `CC al servicio fue ${ccServ} — si las vacas llegaron al parto con CC <4.5 el anestro posparto va a ser más largo.`
        : `Las vacas preñadas tienen la oportunidad de llegar bien al parto con suplemento ahora.`);
    acciones = [
      `Suplementar vacas preñadas: 0.5–0.8 kg expeller/vaca/día — única ventana eficiente en adultas`,
      `Separar \"cabeza de parición\" a potrero de parición — parirán en ~${diasAlParto} días`,
      torosBajos
        ? `Toros CC ${ccToros}: suplementar YA — tienen ${diasAlParto + dias(partoIni, ini)} días hasta el servicio`
        : `Confirmar CC de toros — objetivo ≥5.5 al inicio del servicio`,
      `Tener disponibles: oxitocina, antibiótico, yodo ombligos, guantes de parto`,
    ];
    siguiente = { label: "Inicio de parición", diasFaltan: diasAlParto };

  } else if (hoy >= partoIni && hoy <= postPartoFin) {
    fase        = "PARTO";
    label       = "Parición en curso";
    icono       = "🐄";
    color       = "#e05530";
    diasEnFase  = dias(partoIni, hoy);
    const pctParto = Math.min(100, Math.round(diasEnFase / Math.max(1, dias(partoIni, partoFin)) * 100));
    const diasRestParto = dias(hoy, partoFin);
    descripcion =
      `Parición activa — ${pctParto < 35 ? "\"cabeza\" de parición" : pctParto < 70 ? "cuerpo de parición" : "\"cola\" de parición"}` +
      ` (día ${diasEnFase + 1}, ~${pctParto}% del total esperado)${climaStr()}. ` +
      `Máximo requerimiento del año: lactación temprana + gestación nueva entrando. ` +
      (frio
        ? `El frío (${tempHoy}°C) aumenta el requerimiento de mantenimiento — las vacas necesitan más energía que en un invierno suave. `
        : "") +
      (deficit
        ? `Hay déficit forrajero de ${Math.abs(balanceMesActual)} Mcal/día — las vacas están movilizando CC para producir leche. `
        : "") +
      `Cada ternero perdido o vaca que sale del parto con CC <3.5 es una preñez en riesgo para el próximo servicio.`;
    acciones = [
      `Recorrer potreros de parición 1–2 veces/día — terneros abandonados, distocias, hipotermia`,
      `Curar ombligos con yodo al nacimiento — onfalitis es la causa #1 de mortalidad neonatal`,
      pctParto > 50
        ? `\"Cola de parición\" (últimas ${diasRestParto} días): marcar para destete precoz — tienen menos tiempo para recuperar CC`
        : `Registrar fecha de parto por vaca — la cabeza tiene más tiempo para recuperar antes del servicio`,
      frio
        ? `Frío y recién nacidos: revisar hipotermia en las primeras 2 horas — calostro en la primera hora es crítico`
        : `Confirmar que todos los terneros mamaron calostro en la primera hora de vida`,
      deficit
        ? `Déficit forrajero ahora: considerar suplemento proteico a vacas paridas — recuperan CC más rápido`
        : `Monitorear CC de vacas paridas — marcar las que bajan de 3.5`,
    ];
    siguiente = { label: "Post-parto", diasFaltan: diasRestParto };

  } else if (hoy > postPartoFin && hoy < preServIni) {
    fase        = "POST_PARTO";
    label       = "Post-parto";
    icono       = "🍼";
    color       = "#7ec850";
    diasEnFase  = dias(postPartoFin, hoy);
    const diasAlPreServ = dias(hoy, preServIni);
    const diasAlServ    = dias(hoy, ini);
    descripcion =
      `Parición terminada. Las vacas están en lactación tardía${climaStr()}. ` +
      `Tienen ${diasAlServ} días para recuperar CC antes del servicio (${fmtD(ini)}). ` +
      (ccBaja
        ? `CC al servicio proyectada: ${ccServ} — por debajo de 4.5. ` +
          `Este es el período donde el destete precoz tiene mayor impacto: sin ternero al pie la vaca recupera CC en 45–60 días. `
        : `CC proyectada al servicio: ${ccServ > 0 ? ccServ : "—"} — ` +
          (ccServ >= 4.5 ? `dentro del rango óptimo. Mantener el manejo.` : `monitorear semanalmente.`));
    acciones = [
      `Evaluar CC de todo el rodeo — base para decidir intensidad del destete`,
      ccBaja
        ? `Vacas CC <4.0: destete hiperprecoz AHORA — quedan ${diasAlPreServ} días de margen`
        : `Vacas CC 4.0–4.5: destete anticipado si quedan <60 días para el servicio`,
      torosBajos
        ? `Toros CC ${ccToros}: iniciar preparo YA — ${diasAlServ} días hasta el servicio`
        : `Confirmar CC de toros ≥5.0 para inicio de preparo`,
      vaq1SinCorr || !vaq2Llega
        ? `Pesar vaquillonas — confirmar estado antes del servicio`
        : `Preparar lotes para el inicio del servicio`,
    ];
    siguiente = { label: "Pre-servicio", diasFaltan: diasAlPreServ };

  } else if (hoy >= preServIni && hoy < ini) {
    fase        = "PRE_SERVICIO";
    label       = "Pre-servicio";
    icono       = "🎯";
    color       = "#4a9fd4";
    diasEnFase  = dias(preServIni, hoy);
    const diasAlServ = dias(hoy, ini);
    descripcion =
      `Faltan ${diasAlServ} días para el inicio del servicio (${fmtD(ini)})${climaStr()}. ` +
      `La CC que tienen las vacas HOY es prácticamente la CC con la que van a entrar al servicio. ` +
      (ccBaja
        ? `CC proyectada: ${ccServ} — por debajo de 4.5. Con ${diasAlServ} días queda una ventana estrecha para el destete hiperprecoz. `
        : `CC proyectada: ${ccServ > 0 ? ccServ : "—"} — ` + (ccServ >= 4.5 ? `buena posición para el servicio.` : `monitorear.`)) +
      (torosBajos
        ? ` Toros CC ${ccToros} — el preparo necesita empezar YA para llegar a 5.5 al inicio del servicio.`
        : "");
    acciones = [
      `Revisión de toros: CC, aplomos, prepucio, libido — mínimo 35 días antes del servicio`,
      torosBajos
        ? `Toros CC ${ccToros}: suplementar ${diasAlServ < 30 ? "URGENTE" : "ahora"} — ${Math.round(diasAlServ * 0.5 * 1.3 / 1000)} kg expeller total por toro`
        : `CC de toros ≥5.0 — confirmar antes del ingreso al servicio`,
      ccBaja && diasAlServ > 14
        ? `Última oportunidad: destete hiperprecoz en vacas CC <4.5 — ${diasAlServ} días para recuperar`
        : `Organizar los lotes para el inicio del servicio — separar categorías`,
      `Pesar vaquillonas — confirmar que llegan al 75% PV adulto (${Math.round(pvVaca * 0.75)} kg)`,
    ];
    siguiente = { label: "Inicio de servicio", diasFaltan: diasAlServ };

  } else {
    fase        = "CICLO_CERRADO";
    label       = "Ciclo anterior cerrado";
    icono       = "🔄";
    color       = "#888";
    diasEnFase  = 0;
    descripcion = "Las fechas de servicio cargadas corresponden a un ciclo ya cerrado. Actualizalas para el próximo ciclo.";
    acciones    = ["Actualizar las fechas de servicio al próximo ciclo"];
    siguiente   = null;
  }

  const mesHoy = hoy.getMonth();
  const esInviernoCritico = mesHoy >= 5 && mesHoy <= 7;
  const esParicion = fase === "PARTO";
  const esServicio = fase === "SERVICIO";

  return {
    fase, label, icono, color, diasEnFase, descripcion, acciones, siguiente,
    esInviernoCritico, esParicion, esServicio,
    fechaServIni: ini.toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit" }),
    fechaServFin: fin.toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit" }),
    fechaParto:   partoIni.toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit" }),
  };
}

// ─── EXPORTS ──────────────────────────────────────────────────────
export {
  calcOfertaMensualArray, calcOfPasto, reqEM, evaluarSincronia,
  mcalSuplemento, calcConsumoPasto, calcAnestro, interpCC,
  calcTrayectoriaCC, calcDistCC, calcTerneros, calcDisponibilidadMS,
  calcVaq1, calcPvEntradaVaq2, calcVaq2, calcV2S,
  ccACategSuperv, calcSupervivencia, calcCadena, calcConsumoAgua,
  evaluarAgua, evaluarSanidad, validarManual, diasHelada,
  calcDisp, dZona, dProv, correrMotor, useMotor,
  calcImpactoAguaCalibrado, calcPenalidadSanidad,
  calcReqEMCategoriaV2, ndviABiomasa, calcOfertaMensualCalibrada,
  recomendarSuplemento, calcDosisProtein,
  calcScore, diagnosticarSistema, calcGEI, calcImpactoCola, calcFaseCiclo,
};
