// ═══════════════════════════════════════════════════════════════════
// lib/gei.js — Cálculo de Gases de Efecto Invernadero (GEI)
// Módulo aislado: no depende de motor.js, solo de constantes.js
// ═══════════════════════════════════════════════════════════════════

import { SUPLEMENTOS, getClima } from "./constantes";

// ─── CONSTANTES GWP (IPCC AR6 2021) ─────────────────────────────
export const GWP_CH4 = 27.9;  // CH4 → CO2eq, IPCC AR6 2021 (GWP100 con feedback climático)
export const GWP100  = { CH4: 27.9, N2O: 273 };
export const AR6     = { GWP_CH4: 27.9, GWP_N2O: 273 };

/**
 * Fracción de energía bruta perdida como CH₄ (Ym).
 * IPCC 2019 Tier 2, Ec.10.21. Calibrado para forrajeras C4 NEA-Chaco.
 * Fuente: Gere et al. 2019 NZ J Agric Res 62(3):346; Gere et al. 2024 AFST 310:115929.
 */
export function calcYm(dig) {
  if (dig <= 50) return 7.8 / 100;
  if (dig <= 56) return 7.2 / 100;
  if (dig <= 62) return 6.5 / 100;
  if (dig <= 68) return 6.2 / 100;
  return 5.5 / 100;
}

/** Energía bruta del pasto (MJ/kg MS). IPCC 2019 Tabla 10.2. */
export function calcGE_kgMS(dig) {
  return dig >= 65 ? 18.45 : dig >= 58 ? 18.25 : 18.05;
}

/** CH₄ emitido por kg MS consumido (g/kg MS). */
export function calcCH4_kgMS(dig) {
  const Ym = calcYm(dig);
  const GE = calcGE_kgMS(dig);
  return +(Ym * GE * 1000 / 55.65).toFixed(2);
}

/**
 * Balance de CO₂ del pastizal (secuestro de carbono).
 * McSherry & Ritchie 2013 + IPCC 2006 Vol.4 Tabla 6.1.
 */
export function calcCO2PastizalAnual(veg, ndvi, supHa, cargaEV_ha, precipAnual, t_media) {
  const SOC_BASE_KGC_HA = {
    "Pastizal natural":             220,
    "Megatérmicas C4":              280,
    "Pasturas templadas C3":        200,
    "Mixta gramíneas+leguminosas":  250,
    "Bosque nativo":                350,
    "Verdeo de invierno":           100,
  }[veg] || 220;

  const ndviN    = parseFloat(ndvi) || 0.45;
  const factNDVI = Math.max(0.5, Math.min(1.5, ndviN / 0.45));
  const factPrecip = Math.max(0.7, Math.min(1.3, precipAnual / 1100));
  const factCarga  = cargaEV_ha > 1.2 ? -0.5
    : cargaEV_ha > 0.8 ? 0.7
    : cargaEV_ha > 0.4 ? 1.0
    : 0.8;

  const socKgC_ha  = SOC_BASE_KGC_HA * factNDVI * factPrecip * factCarga;
  const co2_ha     = socKgC_ha * 3.667;
  const co2_total  = co2_ha * (parseFloat(supHa) || 1);
  const incertidumbre = 0.40;

  return {
    socKgC_ha:   Math.round(socKgC_ha),
    CO2_ha:      Math.round(co2_ha),
    CO2_total:   Math.round(co2_total),
    CO2_min:     Math.round(co2_total * (1 - incertidumbre)),
    CO2_max:     Math.round(co2_total * (1 + incertidumbre)),
    esFuente:    co2_total < 0,
    incertidumbre,
    factCarga,
  };
}

// ─── Helpers internos ────────────────────────────────────────────
const consumoMSCat = (pv, catCV, dig, fenol, t) => {
  const pvN  = parseFloat(pv) || 320;
  const temp = parseFloat(t)  || 22;
  const pct  = catCV || ({ menor_10:2.8, "10_25":2.4, "25_50":2.0, mayor_50:1.6 }[fenol] || 2.2);
  const factT = temp >= 25 ? 1.0 : temp >= 20 ? 0.90 : temp >= 15 ? 0.75 : 0.50;
  return (pvN * pct / 100) * factT;
};

const digConSupl = (digPasto, pbSupl, dosisKg) => {
  if (!dosisKg || dosisKg <= 0) return digPasto;
  const efecto = pbSupl > 20 ? Math.min(8, dosisKg * 1.5) : Math.min(4, dosisKg * 0.8);
  return Math.min(72, digPasto + efecto);
};

/**
 * Calcula emisiones de GEI del rodeo (CH₄ entérico + balance pastizal).
 * Metodología: IPCC 2019 Tier 2 + GWP AR6 2021.
 * @param {object} form - Formulario del establecimiento
 * @param {object|null} motor - Resultado de correrMotor (opcional)
 * @param {object|null} tray - Trayectoria CC (opcional)
 * @param {object|null} sat - Datos satelitales (opcional)
 */
export function calcGEI(form, motor, tray, sat) {
  const nVacas = motor?.nVacas  || parseInt(form.vacasN)  || 0;
  const nToros = motor?.nToros  || parseInt(form.torosN)  || 0;
  const nV2s   = motor?.nV2s    || parseInt(form.v2sN)    || 0;
  const nVaq2  = motor?.nVaq2   || parseInt(form.vaq2N)   || 0;
  const nVaq1  = motor?.nVaq1   || Math.round(nVacas * (parseFloat(form.pctReposicion)||20)/100);
  const pvVaca = parseFloat(form.pvVacaAdulta) || 320;
  const ndvi   = parseFloat(sat?.ndvi) || parseFloat(form.ndvi) || 0.45;
  const supHa  = parseFloat(form.supHa) || 100;
  const cargaEV = motor?.cargaEV_ha || (nVacas / supHa);
  const prenez  = tray?.pr || parseFloat(form.prenez) || 50;

  const hist        = getClima(form.provincia || "Corrientes");
  const precipAnual = hist.reduce((s, m) => s + (m.p || 80), 0);
  const t_media     = +(hist.reduce((s, m) => s + (m.t || 22), 0) / 12).toFixed(1);

  const FENOL_MES = [
    "menor_10","menor_10","10_25","10_25",
    "25_50","mayor_50","mayor_50","mayor_50",
    "25_50","10_25","menor_10","menor_10",
  ];
  const DIG_FENOL = { menor_10:68, "10_25":63, "25_50":58, mayor_50:52 };

  const tieneVerdeo = form.tieneVerdeo === "si" && parseFloat(form.verdeoHa) > 0;
  const verdeoMesI  = { junio:5, julio:6, agosto:7, septiembre:8 }[form.verdeoDisp||"agosto"] || 7;

  const digMensual = FENOL_MES.map((f, i) => {
    if (tieneVerdeo && i >= verdeoMesI && i <= verdeoMesI + 2) return 72;
    return DIG_FENOL[f];
  });

  const ch4MensualBase = digMensual.map((d, i) => ({
    dig: d, fenol: FENOL_MES[i], t: hist[i]?.t || 22, ch4KgMs: calcCH4_kgMS(d),
  }));

  const digPromAnual = Math.round(digMensual.reduce((s, d) => s + d, 0) / 12);

  const SUPL_KEY  = { vaca:null, v2s:"supl_v2s", toro:"supl_toros", vaq2:"supl_vaq2", vaq1:"supl_vaq1" };
  const DOSIS_KEY = { vaca:null, v2s:"dosis_v2s", toro:"dosis_toros", vaq2:"dosis_vaq2", vaq1:"dosis_vaq1" };

  const CATS_BASE = [
    { id:"vaca", label:"Vacas adultas",    n:nVacas, pv:pvVaca,          catCV:"vaca_lact" },
    { id:"v2s",  label:"V. 2° servicio",   n:nV2s,   pv:pvVaca * 0.88,   catCV:"v2s"       },
    { id:"toro", label:"Toros",            n:nToros, pv:parseFloat(form.pvToros)||Math.round(pvVaca*1.30), catCV:"toro" },
    { id:"vaq2", label:"Vaq. 2° invierno", n:nVaq2,  pv:pvVaca * 0.65,   catCV:"vaq2"      },
    { id:"vaq1", label:"Vaq. 1° invierno", n:nVaq1,  pv:pvVaca * 0.40,   catCV:"vaq1"      },
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

  const catData = CATS_BASE.map(c => {
    let ch4DiaBaseAcum = 0, ch4DiaSuplAcum = 0, digSuplPromAcum = 0, cvBaseAcum = 0;
    const suplMesesSet = new Set(
      Array.isArray(form.suplMeses)
        ? form.suplMeses.map(m => parseInt(m))
        : [5, 6, 7]
    );

    ch4MensualBase.forEach((m, mesIdx) => {
      const diasMes = 30;
      const cvBase  = consumoMSCat(c.pv, c.catCV, m.dig, m.fenol, m.t);
      const haySuplEsteMes = c.suplDosis > 0 && suplMesesSet.has(mesIdx);
      const digS = haySuplEsteMes ? digConSupl(m.dig, c.suplPb, c.suplDosis) : m.dig;
      const ch4S = calcCH4_kgMS(digS);
      const cvS  = haySuplEsteMes
        ? +(cvBase * (digS > m.dig + 3 ? 1.05 : 1.02) + c.suplDosis).toFixed(2)
        : cvBase;
      ch4DiaBaseAcum  += cvBase * m.ch4KgMs * diasMes;
      ch4DiaSuplAcum  += cvS   * ch4S       * diasMes;
      digSuplPromAcum += digS  * diasMes;
      cvBaseAcum      += cvBase * diasMes;
    });

    const ch4DiaBase   = +(ch4DiaBaseAcum  / 360).toFixed(1);
    const ch4DiaSupl   = +(ch4DiaSuplAcum  / 360).toFixed(1);
    const digConSProm  = +(digSuplPromAcum  / 360).toFixed(1);
    const cvBaseProm   = +(cvBaseAcum       / 360).toFixed(2);
    const eficBase     = cvBaseProm > 0 ? +(ch4DiaBase / cvBaseProm).toFixed(2) : 0;
    const eficSupl     = cvBaseProm > 0 && c.suplDosis > 0
      ? +(ch4DiaSupl / (cvBaseProm + c.suplDosis * 0.9)).toFixed(2) : eficBase;
    const ch4AnoBase   = Math.round(ch4DiaBase * c.n * 365 / 1000);
    const ch4AnoSupl   = Math.round(ch4DiaSupl * c.n * 365 / 1000);
    const co2eqBase    = ch4AnoBase * GWP_CH4;
    const co2eqSupl    = ch4AnoSupl * GWP_CH4;

    return {
      ...c, digPromAnual, digConSProm, cvBaseProm,
      ch4DiaBase, ch4DiaSupl, ch4AnoBase, ch4AnoSupl,
      co2eqBase, co2eqSupl, co2eqBase_star:0, co2eqSupl_star:0,
      delta: ch4AnoSupl - ch4AnoBase,
      mejora: ch4DiaSuplAcum < ch4DiaBaseAcum,
      eficBase: +eficBase.toFixed(1), eficSupl: +eficSupl.toFixed(1),
    };
  });

  const edadEntoreReal = motor?.vaq1E?.pvSal >= 220 ? 24 : motor?.vaq1E?.pvSal >= 200 ? 28 : 36;
  const vacasVacias    = Math.round(nVacas * (1 - prenez / 100));
  const catVaca        = catData.find(c => c.id === "vaca");
  const co2eqVacasVacias = catVaca ? Math.round(catVaca.co2eqBase * (nVacas > 0 ? vacasVacias / nVacas : 0)) : 0;
  const demora         = Math.max(0, edadEntoreReal - 24);
  const fracInefiVaq   = demora > 0 ? demora / (edadEntoreReal || 36) : 0;
  const catVaq1        = catData.find(c => c.id === "vaq1");
  const co2eqVaqTarde  = catVaq1 ? Math.round(catVaq1.co2eqBase * fracInefiVaq) : 0;

  const totalCH4Base       = catData.reduce((s, c) => s + c.ch4AnoBase, 0);
  const totalCH4Supl       = catData.reduce((s, c) => s + c.ch4AnoSupl, 0);
  const totalCO2eqBase     = totalCH4Base * GWP_CH4;
  const totalCO2eqSupl     = totalCH4Supl * GWP_CH4;
  const totalCO2eqBaseSTAR = totalCH4Base * 4.5;
  const totalCO2eqSuplSTAR = totalCH4Supl * 4.5;
  const totalCO2eqInefi    = co2eqVacasVacias + co2eqVaqTarde;

  const co2Pastizal    = calcCO2PastizalAnual(form.vegetacion || "Pastizal natural", ndvi, supHa, cargaEV, precipAnual, t_media);
  const balanceNetoBase = totalCO2eqBase - co2Pastizal.CO2_total;
  const balanceNetoSupl = totalCO2eqSupl - co2Pastizal.CO2_total;
  const ternerosAnual   = Math.round(nVacas * prenez / 100);
  const kgPVProducido   = ternerosAnual * Math.round(pvVaca * 0.45);
  const intensBase      = kgPVProducido > 0 ? +(totalCO2eqBase / kgPVProducido).toFixed(1) : null;
  const intensSupl      = kgPVProducido > 0 ? +(totalCO2eqSupl / kgPVProducido).toFixed(1) : null;
  const intensBase_star = kgPVProducido > 0 ? +(totalCO2eqBaseSTAR / kgPVProducido).toFixed(1) : null;

  return {
    catData,
    inefi: {
      vacasVacias, prenezPct: prenez,
      ch4VacaVaciaAnual: catVaca ? Math.round(catVaca.ch4AnoBase / Math.max(1, nVacas)) : 55,
      co2eqVacasVacias, demora,
      fracInefiVaq: +fracInefiVaq.toFixed(2), co2eqVaqTarde,
      totalCO2eqInefi,
      pctInefi: totalCO2eqBase > 0 ? +((totalCO2eqInefi / totalCO2eqBase) * 100).toFixed(1) : 0,
      edadEntoreReal, esSubconjunto: true,
    },
    co2Pastizal, digMensual,
    totalCH4Base, totalCH4Supl,
    totalCO2eqBase, totalCO2eqSupl,
    totalCO2eqBaseSTAR, totalCO2eqSuplSTAR,
    balanceNetoBase, balanceNetoSupl,
    ternerosAnual, kgPVProducido,
    intensBase, intensSupl, intensBase_star,
    dig: digPromAnual, ndvi, supHa, cargaEV, precipAnual, t_media,
    edadEntoreReal,
    reduccionCO2eq: totalCO2eqBase - totalCO2eqSupl,
    pctReduccion: totalCO2eqBase > 0
      ? +((1 - totalCO2eqSupl / totalCO2eqBase) * 100).toFixed(1) : 0,
  };
}
