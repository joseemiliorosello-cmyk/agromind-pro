
"use client";

// ═══════════════════════════════════════════════════════════════════
// lib/motor.js — Motor de cálculo ganadero
// Solo funciones puras de cálculo — sin JSX, sin React components
// ═══════════════════════════════════════════════════════════════════

import { BIOTIPOS, getBiotipo, SUPLEMENTOS, PROD_BASE,
         CALIDAD_C4_CALIBRADA, ccPond, MESES_NOM, FORM_DEF } from "./constantes";
import React, { useState, useEffect } from "react";

// ─── HELPERS BASE ─────────────────────────────────────────────────

// ─── TODAS LAS CONSTANTES GLOBALES (sin TDZ) ────────────────────
const UTIL        = 0.40;
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
const MESES_F = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const ESC_LABELS = ["Base", "Escenario A", "Escenario B"];
const NDVI_ESTAC = {
  "NEA":           [1.00,0.98,0.92,0.80,0.68,0.55,0.48,0.52,0.65,0.80,0.92,0.98],
  "NOA":           [0.95,0.98,1.00,0.88,0.72,0.58,0.50,0.55,0.68,0.82,0.90,0.93],
  "Pampa Húmeda":  [1.00,0.97,0.90,0.82,0.78,0.72,0.70,0.75,0.82,0.90,0.96,1.00],
  "Paraguay Oriental": [1.00,0.98,0.93,0.82,0.70,0.58,0.50,0.55,0.67,0.80,0.92,0.98],
  "Chaco Paraguayo":   [1.00,0.97,0.90,0.78,0.65,0.52,0.45,0.50,0.63,0.78,0.90,0.97],
  "Brasil (Cerrado)":  [0.85,0.82,0.80,0.75,0.68,0.58,0.52,0.55,0.65,0.78,0.85,0.87],
  "Bolivia (Llanos)":  [0.90,0.92,0.95,0.88,0.75,0.60,0.52,0.55,0.65,0.78,0.86,0.90],
};
const TABLA_DISP_MS = {
  // [altCm]: { corto_denso:[min,max], alto_ralo:[min,max], alto_denso:[min,max] }
  10: { corto_denso:[1000,1200], alto_ralo:[600,800],   alto_denso:[800,1000]  },
  20: { corto_denso:[1800,2400], alto_ralo:[1000,1200], alto_denso:[1800,2400] },
  30: { corto_denso:[2700,3200], alto_ralo:[2000,3000], alto_denso:[3300,3700] },
  40: { corto_denso:[3000,5000], alto_ralo:[3000,5000], alto_denso:[4500,5000] },
};
const GDP_MIN_VAQ2 = 330; // g/d — mínimo invierno

function calcVaq2(pvEntradaVaq1Sal, pvAdulta, ndvi, disponMS, fenologia, suplReal, dosisRealKg) {
  const pvSal1 = parseFloat(pvEntradaVaq1Sal) || 0;
  const pva    = parseFloat(pvAdulta) || 320;
  if (!pvSal1) return { _aviso:"PV se calcula automáticamente desde la salida del 1° invierno." };
  // Vaq2: en invierno NEA el pasto solo da 120-250 g/d — suplementación recomendada para llegar al objetivo de entore
  // Sin suplemento llega a destino con déficit de PV irrecuperable antes del entore

  const pvMayo2Inv      = calcPvEntradaVaq2(pvSal1);
  const pvMinEntore     = Math.round(pva * 0.75);
  const diasInv         = 90;  // mayo → agosto (período suplementación invernal)
  const diasHastaEntore = 180; // mayo → noviembre
  const ndviN    = parseFloat(ndvi) || 0.45;
  const nivelMS  = disponMS?.nivel || "media";
  const calidadBaja = ["25_50","mayor_50"].includes(fenologia||"");

  // GDP real pastizal invierno NEA — dato campo: 0-100 g/d sin suplemento
  const ndviN2      = parseFloat(ndvi) || 0.45;
  const gdpPastoInv = nivelMS === "baja" ? 0 : nivelMS === "media" ? (ndviN2 > 0.45 ? 70 : 40) : 100;

  // Suplemento REAL del usuario — boost GDP por NRC 2000 + NASSEM 2010
  // Vaq2 tiene PV ~260-320 kg: costo de ganancia = 5.5 Mcal/kg (NRC 2000, mayor que Vaq1)
  // fenología invierno NEA: siempre 25_50 o mayor_50 → PB pasto < 7% → déficit proteico real
  const mcalSuplReal = suplReal ? mcalSuplemento(suplReal, dosisRealKg || 0) : 0;
  const sinSupl2     = mcalSuplReal === 0;
  const pbSuplV2    = suplReal ? (SUPLEMENTOS[suplReal]?.pb || 0) : 0;
  const pbPastoV2   = { menor_10:12, "10_25":9, "25_50":6, mayor_50:4 }[fenologia||"25_50"] || 6;
  const eficProtV2  = pbPastoV2 < 7 ? 0.55 : 0.42; // invierno NEA: casi siempre déficit proteico
  const eficEnerV2  = 0.62;
  const fracProtV2  = pbSuplV2 >= 30 ? 1.0 : pbSuplV2 >= 15 ? 0.70 : 0.25;
  const eficMixV2   = fracProtV2 * eficProtV2 + (1 - fracProtV2) * eficEnerV2;
  const COSTO_KG_VAQ2 = 5.5; // Mcal/kg ganancia Vaq2 (más pesada, mayor costo/kg que Vaq1)
  const boostSuplReal = mcalSuplReal > 0
    ? Math.min(500, Math.round(mcalSuplReal * eficMixV2 / (COSTO_KG_VAQ2 / 1000)))
    : 0;
  const gdpConSuplReal = gdpPastoInv + boostSuplReal;

  const gdpFaltante   = Math.max(0, GDP_MIN_VAQ2 - gdpConSuplReal);
  // PV agosto: usa GDP real (con o sin supl)
  const gdpInvReal    = sinSupl2 ? gdpPastoInv : gdpConSuplReal;
  const pvV2Agosto    = Math.round(pvMayo2Inv + gdpInvReal * diasInv / 1000);
  const gdpPrimavera  = sinSupl2 ? 280 : Math.min(450, gdpInvReal + 50); // g/d post-agosto: limitado por estado corporal acumulado
  const pvEntore      = Math.round(pvV2Agosto + gdpPrimavera * (diasHastaEntore - diasInv) / 1000);
  // llegas = llega al objetivo de entore SIN contar recuperación de primavera como "salvavidas"
  // El criterio real: GDP invernal ≥ GDP_MIN_VAQ2 Y pvEntore ≥ pvMinEntore
  const llegas        = gdpInvReal >= GDP_MIN_VAQ2 && pvEntore >= pvMinEntore;

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

  const esc = gdpFaltante > 150 ? "C" : gdpFaltante > 80 ? "B" : "A";

  // ── Entore anticipado ─────────────────────────────────────────
  // Si en agosto ya supera el 65% del PV adulto, puede entrar al servicio general
  // de ese mismo año (agosto–noviembre) en lugar de esperar al año siguiente.
  // Criterio: pvV2Agosto ≥ 65% PV adulto (Bavera 2005 — umbral mínimo de ciclicidad)
  // Beneficio: adelanta la producción un año completo
  const pvMinEntoreAntic = Math.round(pva * 0.65);
  const aptaEntoreAntic  = pvV2Agosto >= pvMinEntoreAntic;
  const pctPVAgosto      = Math.round(pvV2Agosto / pva * 100);

  return {
    esc, pvMayo2Inv, pvV2Agosto, pvEntore, pvMinEntore,
    gdpInv: gdpInvReal, gdpPastoInv, gdpPrimavera, llegas,
    aptaEntoreAntic, pvMinEntoreAntic, pctPVAgosto,
    protKg, energKg, fuenteEnerg, freq, freqDetalle, alertaAlgodon,
    nivelMS, gdpFaltante, sinSupl: sinSupl2, mcalSuplReal,
    mensajeBase: sinSupl2
      ? `⚠️ Sin suplemento: GDP pasto solo ${gdpPastoInv}g/d — invierno NEA sin intervención. PV agosto estimado ${pvV2Agosto}kg.`
      : gdpConSuplReal < GDP_MIN_VAQ2
      ? `⚠️ Suplemento insuficiente: con ${dosisRealKg}kg/d de ${suplReal} → GDP ${Math.round(gdpConSuplReal)}g/d. Mínimo necesario: ${GDP_MIN_VAQ2}g/d.`
      : `✓ Suplemento cubre el objetivo: GDP ${Math.round(gdpConSuplReal)}g/d en invierno.`,
    alertaSinSupl: sinSupl2
      ? `⚠️ Vaq2° sin suplemento invernal: con ${gdpPastoInv}g/d el PV agosto es ${pvV2Agosto}kg. Sin suplementar NO llega al entore a los 24 meses — pasa a 3° año con una categoría improductiva extra.`
      : null,
  };
}

function calcV2S(pvV2s, pvAdulta, ccActual, conTernero, biotipo, cadena) {
  const pv   = parseFloat(pvV2s)   || 0;
  const pva  = parseFloat(pvAdulta) || 320;
  const ccA  = parseFloat(ccActual) || 0;
  if (!pv || !ccA) return null;

  const bt       = getBiotipo(biotipo);
  // Tasa de recuperación CC post-destete — NRC 2000 / Peruchena 2003
  // Basada en superávit energético estimado post-destete y costo CC:
  //   Verano NEA (destete ene-mar): superávit ~3 Mcal/día → 3/56 = 0.054 CC/día
  //   Primavera (oct-nov): superávit ~2.5 Mcal/día → 0.045 CC/día
  //   Invierno: no aplica — V2S no desteta en invierno
  // El mes de destete ≈ mesParto + mesesLact (cálculo posterior), asumimos verano
  // Factor biotipo: bt.recCC (Bos indicus recupera más lento → 0.83-0.85 × taurino)
  // Techo: máximo 1.5 CC/mes = 0.050 CC/día en sistema pastoril extensivo
  const tR = Math.min(0.050, Math.max(0.015, 0.054 * bt.recCC)); // CC/día post-destete

  // Umbral anestro: entre 1°parto y adulta
  const umbralAnestro = bt.umbralAnestro + 0.15;

  // CC al tacto = CC al parto (mismo principio que rodeo de cría)
  // La vaca 2° servicio también se mide al tacto preparto — sin proyección
  const ccParto2 = parseFloat(Math.min(8, Math.max(1.5, ccA)).toFixed(2));

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
  // Tiempo de recuperación desde destete hasta servicio
  // Con CC tacto=CC parto, el parto ya ocurrió o está próximo — calcular desde hoy
  const diasHastaServ = cadena?.ini ? Math.max(0, Math.round((cadena.ini.getTime() - Date.now()) / 86400000)) : 90;
  const diasRecup2 = Math.max(0, diasHastaServ - Math.round(mesesLact2 * 30));
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

function evaluarSanidad(vacunas, brucelosis, aftosa, toros, historiaAbortos, programaSanit, cadena) {
  // Calendario sanitario NEA — conectado a la cadena reproductiva real
  // Fuentes: SENASA RES.114/21 (Brucelosis); Plan Nacional Aftosa SENASA;
  //          Giraudo et al. 2003 INTA Rafaela (IBR/DVB preparto);
  //          Moreno et al. 2006 INTA Mercedes (ESAN pre-servicio)
  const alerts = [];
  const tareas = []; // tareas con fecha concreta según cadena

  // Fecha de servicio — referencia para calcular cuándo vacunar
  const iniServDate = cadena?.ini || null;
  const diasHastaServ = iniServDate
    ? Math.max(0, Math.round((iniServDate - Date.now()) / 86400000))
    : null;

  // Fecha de parto — referencia para IBR preparto
  const partoDate = cadena?.partoTemp || null;
  const diasHastaParto = partoDate
    ? Math.max(0, Math.round((partoDate - Date.now()) / 86400000))
    : null;

  // Helper: formatear fecha objetivo
  const fmtTarget = (dias) => {
    if (dias === null) return "antes del servicio";
    const d = new Date(Date.now() + dias * 86400000);
    return d.toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit" });
  };

  // ── IBR/DVB ────────────────────────────────────────────────────
  // Giraudo et al. 2003: aplicar 45–60d antes del servicio → máxima respuesta inmune
  if (!vacunas || vacunas === "no") {
    const diasVacIBR = diasHastaServ !== null ? Math.max(0, diasHastaServ - 45) : null;
    alerts.push({ nivel:"rojo",
      msg:"Sin vacunación IBR/DVB — reduce preñez hasta −15 pp (Giraudo et al. 2003)." });
    tareas.push({
      vacuna: "IBR/DVB",
      urgencia: diasHastaServ !== null && diasHastaServ < 60 ? "URGENTE" : "PROGRAMAR",
      fecha: fmtTarget(diasVacIBR),
      diasRestantes: diasVacIBR,
      instruccion: `Vacunar ${diasHastaServ !== null ? "antes del " + fmtTarget(diasVacIBR) + " (45d previos al servicio)" : "45–60 días antes del servicio"}. Refuerzo anual.`,
      porque: "IBR/DVB causa abortos y falla reproductiva silenciosa. La inmunidad activa tarda 3–4 semanas.",
    });
  } else {
    tareas.push({
      vacuna: "IBR/DVB",
      urgencia: "OK",
      fecha: "—",
      diasRestantes: null,
      instruccion: "Verificar que no hayan pasado más de 12 meses desde la última dosis.",
      porque: "",
    });
  }

  // ── AFTOSA ─────────────────────────────────────────────────────
  if (aftosa === "no") {
    alerts.push({ nivel:"rojo",
      msg:"Sin vacunación Aftosa — OBLIGATORIA (Plan Nacional SENASA). Riesgo de clausura y pérdida de trazabilidad exportación." });
    tareas.push({
      vacuna: "Aftosa",
      urgencia: "URGENTE",
      fecha: "INMEDIATO",
      diasRestantes: 0,
      instruccion: "Vacunar AHORA — no es opcional. Dos dosis anuales mínimo. Notificar a SENASA.",
      porque: "Obligatorio por ley. Sin aftosa no podés comercializar.",
    });
  }

  // ── BRUCELOSIS ─────────────────────────────────────────────────
  if (brucelosis === "no") {
    alerts.push({ nivel:"rojo",
      msg:"Sin vacunación Brucelosis terneras — OBLIGATORIA (SENASA RES.114/21). Aborto hasta 30% al 7° mes. Zoonosis humana." });
    tareas.push({
      vacuna: "Brucelosis",
      urgencia: "URGENTE",
      fecha: "Terneras 3–8 meses",
      diasRestantes: 0,
      instruccion: "Vacunar terneras hembras entre 3–8 meses de edad con RB51 o B19. Solo por veterinario habilitado.",
      porque: "Zoonosis — riesgo humano. Aborto masivo al 7° mes. Obligatoria SENASA.",
    });
  }

  // ── LEPTOSPIROSIS ──────────────────────────────────────────────
  // Moriena et al. 2008 (INTA Corrientes): alta prevalencia en NEA por anegamientos
  // Vacunar 30–45d antes del servicio
  const diasVacLepto = diasHastaServ !== null ? Math.max(0, diasHastaServ - 35) : null;
  tareas.push({
    vacuna: "Leptospirosis",
    urgencia: diasHastaServ !== null && diasHastaServ < 50 ? "PROGRAMAR" : "CALENDARIO",
    fecha: fmtTarget(diasVacLepto),
    diasRestantes: diasVacLepto,
    instruccion: `Vacunar ${diasHastaServ !== null ? "antes del " + fmtTarget(diasVacLepto) : "30–45 días antes del servicio"} con bacterina polivalente. Alta prevalencia en inundaciones NEA.`,
    porque: "Leptospira causa abortos tardíos y mortinatos. Serovares Pomona e Icterohaemorrhagiae prevalentes en NEA.",
  });

  // ── CARBUNCLO / CLOSTRIDIOSIS ──────────────────────────────────
  // Esquema: vacuna multivalente (Clostridium chauvoei, septicum, etc.)
  // Aplicar antes de las lluvias (oct o antes del inicio de pastoreo)
  tareas.push({
    vacuna: "Carbunclo + Clostridiosis",
    urgencia: "CALENDARIO",
    fecha: "Antes de octubre (inicio lluvias NEA)",
    diasRestantes: null,
    instruccion: "Vacuna multivalente (mínimo: Cl. chauvoei + Cl. septicum + Cl. novyi). Anual, antes del período de lluvias.",
    porque: "Carbunclo sintomático frecuente en NEA con lluvias intensas. Mortalidad súbita sin síntomas previos.",
  });

  // ── ESAN TOROS ─────────────────────────────────────────────────
  if (toros === "sin_control") {
    const diasEsan = diasHastaServ !== null ? Math.max(0, diasHastaServ - 30) : null;
    alerts.push({ nivel:"rojo",
      msg:`Toros sin ESAN — Trichomonas/Campylobacter infectan 15–40% del rodeo silenciosamente (Moreno et al. 2006).` });
    tareas.push({
      vacuna: "ESAN pre-servicio",
      urgencia: diasHastaServ !== null && diasHastaServ < 45 ? "URGENTE" : "PROGRAMAR",
      fecha: fmtTarget(diasEsan),
      diasRestantes: diasEsan,
      instruccion: `ESAN completo (capacidad libidinal + aptitud reproductiva + frotis prepucial Trichomonas/Campy). Mínimo 30 días antes del servicio. ${diasHastaServ !== null ? "Fecha objetivo: "+fmtTarget(diasEsan)+"." : ""}`,
      porque: "Un toro con Trichomonas infecta el 30–40% de las vacas sin mostrar síntomas. No hay tratamiento — descarte.",
    });
  }

  // ── HISTORIA DE ABORTOS ────────────────────────────────────────
  if (historiaAbortos === "si") {
    alerts.push({ nivel:"ambar",
      msg:"Historia de abortos — diagnóstico diferencial prioritario: IBR/DVB/Leptospira/Neospora/Brucelosis." });
    tareas.push({
      vacuna: "Diagnóstico abortos",
      urgencia: "PROGRAMAR",
      fecha: "Antes del próximo servicio",
      diasRestantes: diasHastaServ,
      instruccion: "Remitir fetos abortados y placenta a laboratorio (INTA, SENASA). PCR/serología para Neospora, IBR, Leptospira. No asumir causa sin diagnóstico.",
      porque: "Neospora caninum causa hasta 25% de abortos en NEA (Suárez et al. 2012, INTA). Sin diagnóstico no hay solución.",
    });
  }

  // ── PROGRAMA SANITARIO ────────────────────────────────────────
  if (programaSanit === "no" || !programaSanit) {
    alerts.push({ nivel:"ambar", msg:"Sin programa sanitario estructurado. La sanidad es el techo del sistema — ninguna mejora nutricional compensa enfermedades activas." });
  }

  // Ordenar tareas: URGENTE → PROGRAMAR → CALENDARIO → OK
  const ordUrgencia = { URGENTE:0, PROGRAMAR:1, CALENDARIO:2, OK:3 };
  tareas.sort((a,b) => (ordUrgencia[a.urgencia]??9) - (ordUrgencia[b.urgencia]??9));

  return { alerts, tareas };
}

function validarManual(lat, lon) {
  if (isNaN(lat) || isNaN(lon))  return "Coordenadas inválidas — ingresá números.";
  if (lat < -60 || lat > 15)     return "Latitud fuera del rango de Sudamérica (-60 a +15).";
  if (lon < -85 || lon > -30)    return "Longitud fuera del rango de Sudamérica (-85 a -30).";
  return null;
}

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

function correrMotor(form, sat, potreros, usaPotreros) {
  // DEBUG — remover en producción
  if (typeof window !== "undefined" && window.__calfDebug) {
    console.log("[Motor] inicio →", {
      provincia: form.provincia,
      vacasN: form.vacasN,
      biotipo: form.biotipo,
      distribucionCC: form.distribucionCC,
      iniServ: form.iniServ,
      finServ: form.finServ,
    });
  }
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
    form.vegetacion || "Pastizal natural",
    ndviN, form.provincia || "Corrientes", enso, form.fenologia,
    form.zona || "NEA"
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
  // factorCarga base (sin suplemento)
  const factorCargaBase = cargaEV_ha === null ? 1.0
    : cargaEV_ha > 1.2 ? 0.70
    : cargaEV_ha > 0.8 ? 0.88
    : cargaEV_ha > 0.5 ? 0.97
    : 1.0;
  // En meses con suplemento activo, la fracción del requerimiento que viene del pasto
  // es menor → la presión sobre la pastura se reduce. Estimamos qué % del req total
  // cubre el suplemento y escalamos la carga efectiva proporcionalmente.
  // Referencia: Lippke 1980 — "substitution rate" suplemento-pastoreo
  // suplRodeoMcalDia se declara más adelante — calcular aquí de forma provisional
  // para determinar factorCargaSusp (cuánto alivia el suplemento la presión sobre el pasto)
  const suplMcalTotalDia = (() => {
    const cats = [
      { sk:"supl_vacas", dk:"dosis_vacas", n:nVacas },
      { sk:"supl_toros", dk:"dosis_toros", n:nToros },
      { sk:"supl_v2s",   dk:"dosis_v2s",   n:nV2s   },
      { sk:"supl_vaq2",  dk:"dosis_vaq2",  n:nVaq2  },
      { sk:"supl_vaq1",  dk:"dosis_vaq1",  n:nVaq1  },
    ];
    return cats.reduce((acc,c) => {
      const s = SUPLEMENTOS[form[c.sk]];
      const d = parseFloat(form[c.dk]) || 0;
      return acc + (s ? s.em*d*c.n : 0);
    }, 0);
  })();
  // requerimiento medio del rodeo sin suplemento (estimado como promedio anual)
  const reqRodeoEstim = (nVacas*14 + nToros*20 + nV2s*16 + nVaq2*10 + nVaq1*7) || 1;
  const fracSuplReq = Math.min(0.35, suplMcalTotalDia / reqRodeoEstim); // máx 35% sustitución
  // factorCarga efectivo para meses sin/con suplemento
  const factorCargaSusp = Math.min(1.0, factorCargaBase + fracSuplReq * 0.3); // suplemento alivia presión
  const factorCarga = factorCargaBase; // base (para meses sin suplemento)

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
    const haV   = parseFloat(form.verdeoHa) || 0;
    // Parámetros según tipo de verdeo — NEA/NOA campo real
    // Fuente: INTA EEA Concepción del Uruguay; Romero 2008; Formoso 2010
    const tipoV = form.verdeoTipo || "Avena / Raigrás / Melilotus";
    const VERDEO_PARAMS = {
      "Avena / Raigrás / Melilotus": { msHa:2800, mcalKg:2.10, pb:18, util:0.50 },
      "Raigrás anual":               { msHa:3200, mcalKg:2.20, pb:20, util:0.52 },
      "Triticale":                   { msHa:3000, mcalKg:2.05, pb:14, util:0.48 },
      "Melilotus":                   { msHa:2200, mcalKg:2.15, pb:22, util:0.55 }, // leguminosa — PB alta
      "Gramínea + leguminosa":       { msHa:2600, mcalKg:2.18, pb:20, util:0.52 },
    };
    const vp = VERDEO_PARAMS[tipoV] || VERDEO_PARAMS["Avena / Raigrás / Melilotus"];
    const map = { junio:5, julio:6, agosto:7, septiembre:8 };
    verdeoMesInicio = map[form.verdeoDisp||"agosto"] || 7;
    // Mcal/día en los meses de disponibilidad (90 días ≈ 3 meses)
    verdeoAporteMcalMes = +(haV * vp.msHa * vp.mcalKg * vp.util / 90).toFixed(0);
    trazas.verdeo = {
      ha:haV, tipo:tipoV, msHa:vp.msHa, pb:vp.pb,
      mcalKg:vp.mcalKg, aporteMcalDia:verdeoAporteMcalMes, desde:verdeoMesInicio,
    };
  }

  // ════════════════════════════════════════════════════════════════
  // NIVEL 2 — CÁLCULOS POR CATEGORÍA (propagados)
  // ════════════════════════════════════════════════════════════════

  // ── 2.1 Terneros ─────────────────────────────────────────────
  const tcSave = calcTerneros(
    form.vacasN, form.prenez, form.pctDestete,
    form.destTrad, form.destAntic, form.destHiper, cadena
  );

  // PV de entrada: prioridad 1) dato manual, 2) calculado de tcSave, 3) ESTIMADO por biotipo+edad
  const pvEntVaq1Estimado = (() => {
    // Estimar PV mayo a partir de biotipo + edad en mayo + tipo de pasto
    const edadMes  = parseFloat(form.edadVaqMayo) || 8;   // meses en mayo
    const pvAdulta = parseFloat(form.pvVacaAdulta) || 320;
    const bt       = getBiotipo(form.biotipo);
    // Peso al nacimiento NEA: ~32-36 kg según biotipo
    const pvNac    = Math.round(pvAdulta * 0.09);
    // Crecimiento promedio pre-mayo: 450-550 g/d con la madre + post-destete campo
    // Ajuste por tipo de pasto — en pastizal natural limita vs megatérmicas
    const gdpPreMayo = form.vegetacion?.includes("Megatérmicas") ? 500
      : form.vegetacion?.includes("Mixta") ? 480
      : form.vegetacion?.includes("Bosque") ? 380
      : 430; // pastizal natural NEA
    const diasTotal = edadMes * 30.4;
    return Math.round(pvNac + gdpPreMayo * diasTotal / 1000);
  })();

  const pvEntVaq1 = parseFloat(form.vaq1PV) || tcSave?.pvMayoPond || pvEntVaq1Estimado;
  const pvEntVaq1EsFallback = !form.vaq1PV && !tcSave?.pvMayoPond; // para marcar en UI
  const suplVaq1Real  = form.supl_vaq1  || "";
  const dosisVaq1Real = parseFloat(form.dosis_vaq1) || 0;
  // Tipo de destete de origen: derivado del mix real cargado por el usuario.
  // El boostComp en calcVaq1 modela crecimiento compensatorio post-destete precoz.
  // Si hay hiperprecoz (≥30% del mix): tipo "hiper"; anticipado (≥40%): tipo "antic"; si no: "trad"
  const pctHiper_tern = parseFloat(form.destHiper) || 0;
  const pctAntic_tern = parseFloat(form.destAntic) || 0;
  const tipoDesteteDerivado = pctHiper_tern >= 30 ? "hiper"
    : pctAntic_tern >= 40 ? "antic"
    : "trad";
  const vaq1E = calcVaq1(pvEntVaq1, form.pvVacaAdulta, ndviN,
    form.edadVaqMayo, tipoDesteteDerivado, disponMS, form.fenologia,
    suplVaq1Real, dosisVaq1Real);

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
  const suplVaq2Real  = form.supl_vaq2  || "";
  const dosisVaq2Real = parseFloat(form.dosis_vaq2) || 0;
  const vaq2E = calcVaq2(pvEntradaVaq2, form.pvVacaAdulta, ndviN, disponMS, form.fenologia,
    suplVaq2Real, dosisVaq2Real);

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
  // Suplemento preparto real (supl3/dosis3) — campo propio en el paso Suplementación.
  // CORRECCIÓN: no usar supl_v2s como proxy; son protocolos distintos.
  // supl3 = suplemento en las últimas 4–6 semanas de gestación (sin ternero al pie).
  // Su efecto: boost CC al parto vía supl3 en calcTrayectoriaCC (fase preparto).
  const suplPrepartoProt = form.supl3 || "";
  const dosisPreparto    = form.dosis3 || "0";
  const baseParams  = {
    dist: form.distribucionCC,
    cadena,
    destTrad: form.destTrad, destAntic: form.destAntic, destHiper: form.destHiper,
    supHa: form.supHa, vacasN: form.vacasN,
    biotipo: form.biotipo, primerParto: form.primerParto,
    provincia: form.provincia,
    ndvi: ndviN,
    mesTacto: form.mesTacto || "abr",  // mes en que se midió la CC (para anclar trayectoria)
    supl1: form.supl1 || "",  dosis1: form.dosis1 || "0",  // invierno — recuperación CC
    supl2: "",                dosis2: "0",                  // lactación — herramienta = destete
    supl3: suplPrepartoProt,  dosis3: dosisPreparto,        // preparto — boost CC parto
  };
  const tray = calcTrayectoriaCC(baseParams);
  const dist = calcDistCC({ ...baseParams, ndvi: ndviN, prov: form.provincia });
  const ccPondVal = ccPond(form.distribucionCC);

  // ── Impacto cola de preñez — DESPUÉS de tray (usa tray?.grupos) ──
  const prenezParaImpacto = tray?.grupos?.[0]?.pr ?? parseFloat(form.prenez) ?? 0;
  const cabezaEstimada    = tray?.grupos?.[0]?.pr != null
    ? Math.round(prenezParaImpacto * 0.55) : null;
  const impactoCola = prenezParaImpacto > 0
    ? calcImpactoCola(prenezParaImpacto, cabezaEstimada, form.vacasN, form.pctDestete,
        cadena?.diasServ ? Math.round(cadena.diasServ/30) : 3)
    : null;

  // ── 2.5 Propagación: destete óptimo → CC al servicio ────────
  // Si la CC proyectada al servicio < 4.5 Y no hay destete precoz → alerta propagada
  // Alerta: sin manejo de lactancia (destete=0% en todos)
  const totDest = (parseFloat(form.destTrad)||0)+(parseFloat(form.destAntic)||0)+(parseFloat(form.destHiper)||0);
  if (totDest === 0) {
    addAlerta("sin_destete", "P1",
      "Sin modalidad de destete definida — el sistema asume Tradicional 180d (escenario más conservador)",
      `Con lactación 180d y CC ${ccPondVal.toFixed(1)} al parto: caída estimada ${tray?.caidaLact} CC → CC mínima ${tray?.ccMinLact} → preñez ${tray?.pr}%. Cargá el tipo de destete para ver el escenario real.`,
      "form.destTrad/destAntic/destHiper = 0");
  }

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

  // Alerta: sin suplemento en vaquillona
  if (vaq1E && vaq1E.alertaSinSupl) {
    addAlerta("vaq1_sin_supl", "P1",
      vaq1E.alertaSinSupl,
      `Sin suplemento invernal: GDP ${vaq1E.gdpPasto}g/d → PV agosto ${vaq1E.pvSal}kg. Con suplemento recomendado llegaría a ${vaq1E.pvSalRecom}kg.`,
      "calcVaq1() sinSupl=true");
  }
  if (vaq2E && vaq2E.alertaSinSupl) {
    addAlerta("vaq2_sin_supl", "P1",
      vaq2E.alertaSinSupl,
      `Vaquillona que no llega al entore a los 24 meses entra como categoría extra improductiva, retrasa la vaca 2° servicio y reduce la eficiencia global del rodeo.`,
      "calcVaq2() sinSupl=true");
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
    { sk:"supl_vacas",  dk:"dosis_vacas",  n:nVacas },  // vacas adultas
    { sk:"supl_v2s",    dk:"dosis_v2s",    n:nV2s   },  // V2S: triple estrés
    { sk:"supl_toros",  dk:"dosis_toros",  n:nToros },  // toros: preparo servicio
    { sk:"supl_vaq2",   dk:"dosis_vaq2",   n:nVaq2  },  // vaquillona 2° inv
    { sk:"supl_vaq1",   dk:"dosis_vaq1",   n:nVaq1  },  // vaquillona 1° inv: respuesta máxima
    // supl1: general — aplica al rodeo completo si no hay carga por categoría
    { sk:"supl1", dk:"dosis1",
      n: !(form.supl_vacas||form.supl_v2s||form.supl_vaq1||form.supl_vaq2||form.supl_toros)
         ? (nVacas+nV2s+nVaq1+nVaq2+nToros) : 0 },
  ];
  // Meses de suplementación configurados por el usuario (0=ene … 11=dic)
  const suplMesesArr = (form.suplMeses || ["5","6","7"]).map(Number);
  const MESES_SUPL   = new Set(suplMesesArr);
  const fracSuplAnual = MESES_SUPL.size / 12;

  const suplRodeoMcalDia = suplCats.reduce((acc,c) => {
    const s = SUPLEMENTOS[form[c.sk]];
    const d = parseFloat(form[c.dk]) || 0;
    return acc + (s ? s.em*d*c.n : 0);
  }, 0);
  // Fracción anual del suplemento (para cálculo de costos e intensidad GEI)

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

    // V2S: estado fisiológico propio — primer parto, mayor anestro posparto
    // NRC 2000: V2S tiene +10% req base por crecimiento propio además del estado reproductivo
    // Bavera 2006: anestro posparto en V2S ≈ 25% mayor que vacas adultas
    // → lactación efectiva más prolongada en términos de requerimiento (ternero + propio)
    const mesesLactV2s = Math.min(mesesLactN + 1, 7); // lactación +1 mes vs vaca adulta (primer parto)
    const enLactV2s    = (i - mesParto + 12) % 12 < mesesLactV2s;
    const estadoV2s    = enLactV2s ? "Lactación con ternero al pie"
                       : ((i - mesParto + 12) % 12 >= 9) ? "Preparto (último mes)"
                       : "Gestación media (5–7 meses)";
    // CC real V2S si está cargada — sino usar estimación por PV
    const ccV2sReal = (() => {
      const dist = form.cc2sDist || [];
      let s=0, t=0;
      dist.forEach(d => { const p=parseFloat(d.pct)||0, c=parseFloat(d.cc)||0; s+=p*c; t+=p; });
      return t>0 ? s/t : 0;
    })();
    // Factor ajuste requerimiento por CC: baja CC → vaca más delgada → requiere más por movilización
    const factCCV2s = ccV2sReal > 0 && ccV2sReal < 4.0 ? 1.08 : 1.0;
    const reqV2sI  = +((reqEM(parseFloat(form.v2sPV)||pvVaca*0.88, estadoV2s, form.biotipo) || 14) * 1.10 * factCCV2s).toFixed(1);
    const reqVacaI = reqEM(pvVaca,     estadoVaca, form.biotipo) || 14;
    const reqToroI = reqEM(pvVaca*1.3, "Vaca seca sin ternero", form.biotipo) || 14;
    const pvVaq1p  = pvEntVaq1 || Math.round(pvVaca*0.40);
    const pvVaq2p  = parseFloat(pvEntradaVaq2) || Math.round(pvVaca*0.65);
    const reqVaq2I = reqEM(pvVaq2p, "vaq2inv", form.biotipo) || 10;
    const reqVaq1I = reqEM(pvVaq1p, "vaq1inv", form.biotipo) || 7;

    const dVacas = nVacas * reqVacaI;
    const dToros = nToros * reqToroI;
    const dV2s   = nV2s   * reqV2sI;
    const dVaq2  = nVaq2  * reqVaq2I;
    const dVaq1  = nVaq1  * reqVaq1I;
    const demanda = dVacas + dToros + dV2s + dVaq2 + dVaq1;

    // Oferta pasto real por categoría — Lippke 1980; Minson 1990
    // CORRECCIÓN: calcular consumo voluntario con PV real de CADA categoría,
    // no multiplicar ofPastoVaca (Mcal/vaca) por totalEV (dimensionalmente incorrecto).
    // El consumo voluntario (CV) es función de PV, fenología y temperatura.
    // Mcal/día por categoría = PV × (cvPct/100) × factTcv × factorAgua × mcalKg
    const cvPct    = { menor_10:2.8, "10_25":2.4, "25_50":2.0, mayor_50:1.6 }[fenol] || 2.4;
    const factTcv  = t>=25?1.0 : t>=20?0.90 : t>=15?0.75 : 0.50;
    const mcalKg   = mcalKgAdj(t, fenol);
    // Función local: Mcal/día de pasto para n animales de PV dado
    const ofCat = (pv, n) => n > 0
      ? +(pv * cvPct/100 * factTcv * factorAgua * mcalKg * n).toFixed(1)
      : 0;
    const pvToro   = parseFloat(form.pvToros) || Math.round(pvVaca * 1.30);
    const pvV2sR   = pvVaca * 0.88;
    const pvVaq2R  = parseFloat(pvEntradaVaq2) || Math.round(pvVaca * 0.65);
    const pvVaq1R  = pvEntVaq1 || Math.round(pvVaca * 0.40);
    const ofPastoVacas = ofCat(pvVaca,  nVacas);
    const ofPastoToros = ofCat(pvToro,  nToros);
    const ofPastoV2s   = ofCat(pvV2sR,  nV2s);
    const ofPastoVaq2  = ofCat(pvVaq2R, nVaq2);
    const ofPastoVaq1  = ofCat(pvVaq1R, nVaq1);
    // Para referencia individual (vaca adulta, usado en UI)
    const kgMsVaca    = pvVaca * cvPct/100 * factTcv * factorAgua;
    const ofPastoVaca = +(kgMsVaca * mcalKg).toFixed(1);
    const ofPastoTotal = +((ofPastoVacas + ofPastoToros + ofPastoV2s + ofPastoVaq2 + ofPastoVaq1) * factorCarga).toFixed(0);

    // ── GDP vaquillona mensual (este mes, no el promedio invernal fijo) ──
    // Usa NDVI estacional del mes i para reflejar calidad real del pasto
    const ndviI   = ndviMes(i, ndviN, form.zona || "NEA");
    const pbPasI  = pbPasto(fenol);
    // GDP pasto: limitado por PB (<7% → colapso microbiano), temperatura y NDVI
    const factPbI = pbPasI >= 8 ? 1.0 : pbPasI >= 6 ? 0.55 : 0.20;
    const factTI  = t >= 20 ? 1.0 : t >= 15 ? 0.60 : t >= 10 ? 0.25 : 0.05;
    const factNI  = Math.min(1.3, Math.max(0.3, ndviI / 0.45));
    // Base NEA pastizal natural invierno: 80 g/d máximo con buena fenología
    const gdpPastoMesVaq = Math.round(80 * factPbI * factTI * factNI);
    // Con suplemento proteico activo este mes: boost sobre GDP pasto
    const suplActivo = MESES_SUPL.has(i);
    const mcalSuplVaq1 = suplActivo && form.supl_vaq1
      ? (SUPLEMENTOS[form.supl_vaq1]?.em || 0) * (parseFloat(form.dosis_vaq1) || 0) : 0;
    const mcalSuplVaq2 = suplActivo && form.supl_vaq2
      ? (SUPLEMENTOS[form.supl_vaq2]?.em || 0) * (parseFloat(form.dosis_vaq2) || 0) : 0;
    const pbSuplV1 = SUPLEMENTOS[form.supl_vaq1]?.pb || 0;
    const pbSuplV2 = SUPLEMENTOS[form.supl_vaq2]?.pb || 0;
    const eficV1 = pbPasI < 7 ? 0.55 : 0.42;
    const eficV2 = pbPasI < 7 ? 0.55 : 0.42;
    const boostVaq1 = mcalSuplVaq1 > 0 ? Math.min(400, Math.round(mcalSuplVaq1 * eficV1 / 0.005)) : 0;
    const boostVaq2 = mcalSuplVaq2 > 0 ? Math.min(400, Math.round(mcalSuplVaq2 * eficV2 / 0.005)) : 0;
    const gdpVaq1Mes = gdpPastoMesVaq + boostVaq1;
    const gdpVaq2Mes = gdpPastoMesVaq + boostVaq2;

    // CC movilizada en lactación
    const ccAporte = enLact
      ? Math.round(caidaCC * MCAL_CC * nVacas / Math.max(1, mesesLactN*30)) : 0;

    // Verdeo
    const verdeoAp = form.tieneVerdeo
      ? (i >= verdeoMesInicio && i <= verdeoMesInicio+2 ? verdeoAporteMcalMes : 0) : 0;

    // Suplemento: solo aplica en los meses de invierno configurados
    const suplAp = MESES_SUPL.has(i) ? suplRodeoMcalDia : 0;
    // Carga efectiva: en meses con suplemento el pasto tiene menos presión
    const factCargaMes = MESES_SUPL.has(i) ? factorCargaSusp : factorCarga;
    const ofPastoTotalMes = +((ofPastoVacas + ofPastoToros + ofPastoV2s + ofPastoVaq2 + ofPastoVaq1) * factCargaMes).toFixed(0);

    // ── BOOST CONSUMO VOLUNTARIO por suplemento proteico ─────────
    // Detmann/NASSEM 2010: cuando PB pasto <8%, proteína desbloquea microflora ruminal
    // → el animal come más pasto además de lo que aporta el suplemento
    // Se aplica solo en meses con suplementación activa
    let boostPastoMcal = 0;
    if (MESES_SUPL.has(i) && suplRodeoMcalDia > 0) {
      const suplPrinc = SUPLEMENTOS[form.supl_vacas] || SUPLEMENTOS[form.supl1];
      if (suplPrinc && suplPrinc.tipo === "P" && pbPas < 9) {
        // Dosis total del rodeo en kg
        const dosisTot = (parseFloat(form.dosis_vacas) || parseFloat(form.dosis1) || 0) * nVacas;
        const kgMsBoost = boostConsumoPasto(pbPas, suplPrinc.pb, dosisTot / Math.max(1, nVacas));
        // Convertir kg MS extra a Mcal usando el valor energético del pasto este mes
        boostPastoMcal = Math.round(kgMsBoost * nVacas * mcalKg * factCargaMes);
      }
    }

    const ofertaTotal = ofPastoTotalMes + boostPastoMcal + ccAporte + suplAp + verdeoAp;
    const balance     = ofertaTotal - demanda;

    // Cuánto suplemento resolvería el déficit (Mcal/animal/día)
    const defMcal     = balance < 0 ? Math.abs(balance) : 0;
    const solExpGir   = defMcal > 0 ? +(defMcal / 2.6 / Math.max(1,nVacas)).toFixed(2) : 0;
    const solSorgo    = defMcal > 0 ? +(defMcal / 3.1 / Math.max(1,nVacas)).toFixed(2) : 0;
    const solDestete  = defMcal > 0 ? +(defMcal / (nVacas*3.0) * 100).toFixed(0) : 0; // % más a hiperprecoz

    return {
      mes, i,
      // Oferta
      ofPastoTotal:+ofPastoTotalMes, ofPastoVaca, ccAporte,
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
      // GDP vaquillona real este mes (NDVI estacional + fenología + suplemento)
      gdpVaq1Mes, gdpVaq2Mes, gdpPastoMesVaq,
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
    form.sanToros, form.sanAbortos, form.sanPrograma, cadena
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

  // ── DIAGNÓSTICO POR KPI — sin score arbitrario ──────────────────
  // Un score compuesto con pesos sin validación empírica puede enmascarar problemas críticos.
  // (ej: preñez 50% + balance perfecto = "moderado" cuando debería ser "crítico")
  // En cambio: KPIs individuales semaforizados + listado P1 como driver principal.
  const prenezProyectada = tray?.pr || 0;
  const ccServProyectada = parseFloat(tray?.ccServ || 0);
  const mesesDeficit     = deficitInv.length; // 0-3 meses con déficit invernal

  // Nivel de riesgo: lo determina el PEOR KPI individual (enfoque conservador)
  // Si hay cualquier P1 → al menos "alto"
  // Si hay P1 crítico (preñez<50% o CC<3.5) → "critico"
  const hayP1Critico = alertasP1.some(a =>
    a.id === "cc_serv_bajo" && ccServProyectada < 3.5 ||
    a.id === "balance_inv"  && mesesDeficit === 3 ||
    prenezProyectada < 40
  );
  const nivelRiesgo = hayP1Critico ? "critico"
    : alertasP1.length > 0         ? "alto"
    : alertasP2.length > 1         ? "moderado"
    : "bajo";

  const colorRiesgo  = { bajo:"#7ec850", moderado:"#e8a030", alto:"#e05530", critico:"#c0392b" }[nivelRiesgo];

  // KPIs del sistema para el dashboard
  const kpisSistema = {
    prenez:  { valor: prenezProyectada, umbralOk:75, umbralWarn:60, label:"Preñez proyectada", unit:"%" },
    ccServ:  { valor: ccServProyectada, umbralOk:4.5, umbralWarn:4.0, label:"CC al servicio", unit:"" },
    balInv:  { valor: 3 - mesesDeficit, umbralOk:3, umbralWarn:1, label:"Meses OK invierno", unit:"/3" },
    alertasP1: { valor: alertasP1.length, umbralOk:0, umbralWarn:1, label:"Alertas P1", unit:"", invertido:true },
  };
  // scoreRiesgo mantenido como alias para no romper UI existente
  const scoreRiesgo = nivelRiesgo === "bajo" ? 85
    : nivelRiesgo === "moderado" ? 60
    : nivelRiesgo === "alto" ? 35 : 15;

  // DEBUG temporal — activar con window.__calfDebug = true en consola
  if (typeof window !== "undefined" && window.__calfDebug) {
    console.log("[Motor.return]", {
      tray: tray ? {ccHoy:tray.ccHoy, ccParto:tray.ccParto, ccServ:tray.ccServ, pr:tray.pr} : null,
      ccPondVal,
      balanceMensual_len: balanceMensual?.length,
      balanceJul: balanceMensual?.[6]?.balance,
      balanceJun: balanceMensual?.[5]?.balance,
      cadena: cadena ? "ok" : "NULL",
      form_vacasN: form.vacasN,
      form_provincia: form.provincia,
      form_distribucionCC: form.distribucionCC,
    });
  }

  return {
    // Nivel 1
    cadena, disponMS, ndviN, tempHoy, p30, enso,
    evalAgua, factorAgua, factorCarga, cargaEV_ha,
    ofertaMensual: ofertaAjustada,
    verdeoAporteMcalMes, verdeoMesInicio,
    nVacas, nToros, nV2s, nVaq2, nVaq1, totalEV,
    // Nivel 2
    tcSave, pvEntVaq1, vaq1E, pvSalidaVaq1, pvEntradaVaq2, vaq2E,
    impactoCola,
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

function useMotor(form, sat, potreros, usaPotreros) {
  const [estado, setEstado] = React.useState(null);

  React.useEffect(() => {
    // Debounce 80ms — el motor corre muy rápido pero esperamos un frame
    const timer = setTimeout(() => {
      try {
        const resultado = correrMotor(form, sat, potreros, usaPotreros);
        setEstado(resultado);
      } catch(e) {
        console.error("Motor error:", e?.message || e, e?.stack?.split("\n")[1]);
        setEstado(null);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [form, sat, potreros, usaPotreros]);

  // Primer run sincrónico
  React.useLayoutEffect(() => {
    try {
      const r = correrMotor(form, sat, potreros, usaPotreros);
      if (r) setEstado(r);
    } catch(e) { console.error("Motor init error:", e?.message || e, e?.stack?.split("\n")[1]); }
  }, []); // eslint-disable-line

  return estado;
}

async function fetchSat(lat, lon, zona, prov, enso, cb) {
  try {
    // past_days=30 para historial climático + forecast_days=7 para pronóstico
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon +
      "&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration" +
      "&past_days=30&forecast_days=7&timezone=auto";
    const d   = await (await fetch(url)).json();
    if (!d?.daily?.precipitation_sum) throw new Error("Sin datos");

    const fechas = d.daily.time || [];
    const prec   = d.daily.precipitation_sum || [];
    const tMax   = d.daily.temperature_2m_max || [];
    const tMin   = d.daily.temperature_2m_min || [];
    const et0    = d.daily.et0_fao_evapotranspiration || [];

    // Con past_days=30 + forecast_days=7 el array tiene 38 días
    // Los últimos 7 son el pronóstico (índices -7 en adelante desde el final, pero
    // necesitamos separar pasado de futuro por la fecha de hoy)
    const hoyStr  = new Date().toISOString().slice(0,10);
    const idxHoy  = fechas.indexOf(hoyStr);
    const idxCut  = idxHoy >= 0 ? idxHoy : fechas.length - 7; // índice donde termina el pasado

    // Datos históricos (pasado + hoy)
    const precPas = prec.slice(0, idxCut + 1);
    const tMaxPas = tMax.slice(0, idxCut + 1);
    const tMinPas = tMin.slice(0, idxCut + 1);
    const et0Pas  = et0.slice(0, idxCut + 1);

    // Pronóstico (días futuros — excluye hoy)
    const precFut   = prec.slice(idxCut + 1);
    const tMaxFut   = tMax.slice(idxCut + 1);
    const tMinFut   = tMin.slice(idxCut + 1);
    const fechasFut = fechas.slice(idxCut + 1);

    // Métricas históricas
    const p7   = Math.round(precPas.slice(-7).reduce((a,b)=>a+(b||0),0));
    const p30  = Math.round(precPas.reduce((a,b)=>a+(b||0),0));
    const et07 = Math.round(et0Pas.slice(-7).reduce((a,b)=>a+(b||0),0));
    const tMaxArr7 = tMaxPas.slice(-7);
    const tMinArr7 = tMinPas.slice(-7);
    const temp = parseFloat((
      (tMaxArr7.reduce((a,b)=>a+(b||0),0) + tMinArr7.reduce((a,b)=>a+(b||0),0))
      / (Math.max(1, tMaxArr7.length) * 2)
    ).toFixed(1));

    // Pronóstico 7 días — array de objetos {fecha, tMax, tMin, lluvia, descripcion}
    const DIAS_NOM = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
    const pronostico = fechasFut.slice(0,7).map((f, i) => {
      const tm  = Math.round(tMaxFut[i] ?? 25);
      const tn  = Math.round(tMinFut[i] ?? 15);
      const ll  = Math.round(precFut[i] ?? 0);
      const tmed = (tm + tn) / 2;
      const fecha = new Date(f + "T12:00:00");
      const diaNom = DIAS_NOM[fecha.getDay()];
      const desc = ll > 10 ? "Lluvia" : ll > 2 ? "Llovizna" : tmed >= 25 ? "Cálido" : tmed >= 15 ? "Templado" : "Frío";
      return { fecha: f, dia: diaNom, tMax: tm, tMin: tn, lluvia: ll, desc };
    });

    // Resumen pronóstico para el motor
    const lluviaProx7  = pronostico.reduce((a,d) => a + d.lluvia, 0);
    const tempMediaProx7 = pronostico.length
      ? parseFloat((pronostico.reduce((a,d) => a + (d.tMax+d.tMin)/2, 0) / pronostico.length).toFixed(1))
      : temp;
    const helada7 = pronostico.some(d => d.tMin <= 2);

    const m       = modENSO(enso);
    const nb      = ndviBase[zona] || 0.48;
    const ndviAdj = Math.min(0.95, Math.max(0.15, nb * (0.6 + p30/300) * m)).toFixed(2);
    const cond    = ndviAdj > 0.60 ? "Excelente" : ndviAdj > 0.45 ? "Buena" : ndviAdj > 0.30 ? "Regular" : "Crítica";

    cb({
      // Actuales
      temp, tMax: Math.round(Math.max(...(tMaxArr7.length ? tMaxArr7 : [temp+5]))),
      tMin: Math.round(Math.min(...(tMinArr7.length ? tMinArr7 : [temp-5]))),
      p7, p30, deficit: Math.round(p30 - et07*4.3), ndvi: ndviAdj, condForr: cond, et07,
      // Pronóstico
      pronostico, lluviaProx7, tempMediaProx7, helada7,
      // Contexto
      prov, enso, zona,
    });
  } catch (e) {
    cb({ error: "No se pudieron obtener datos satelitales: " + e.message });
  }
}

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

function calcDosisProtein(pvKg, pbPasto, pbMeta, suplObj) {
  // Consumo voluntario MS estimado según fenología
  const cvMS    = pvKg * 0.022; // kg MS/día (2.2% PV, ajustado invierno)
  const pbActMS = cvMS * (pbPasto / 100); // proteína actual en kg/día
  const pbMetaMS= cvMS * (pbMeta  / 100); // proteína meta en kg/día
  const defPB   = Math.max(0, pbMetaMS - pbActMS); // déficit proteína kg/día
  const kgSupl  = defPB / (suplObj.pb / 100) / (suplObj.degProt / 100);
  return Math.max(0.2, Math.min(2.0, +kgSupl.toFixed(2)));
}

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

function calcYm(dig) {
  // Ym (fracción de pérdida de energía bruta como CH₄) — IPCC 2019 Tier 2, Ec.10.21
  // Calibrado para forrajeras C4 NEA-Chaco (Gere et al. 2019, NZ J. Agric. Res. 62(3):346;
  // Gere et al. 2024, Anim. Feed Sci. Technol. 310:115929)
  // Relación inversa dig↑ → Ym↓ (r = −0.69, p<0.001 en Gere et al. 2019)
  // Valores por rango de digestibilidad (% MS):
  //   dig ≤50%: 7.8% — C4 degradado/sequía
  //   dig 51-56%: 7.2% — C4 invierno NEA (pastizal nativo, encañado)
  //   dig 57-62%: 6.5% — C4 transición primavera temprana
  //   dig 63-68%: 6.2% — C4 primavera/verano activo
  //   dig 69-74%: 5.5% — Verdeo avena/raigrás o C4 +suplemento
  //   dig >74%:   5.5% — piso IPCC 2019 Tier 2 para Bos indicus
  // El efecto del suplemento proteico (Beauchemin et al. 2009; Benchaar 2020)
  // se captura a través de digConSupl(): mejora la digestibilidad total → Ym baja
  if (dig <= 50) return 7.8 / 100;
  if (dig <= 56) return 7.2 / 100;
  if (dig <= 62) return 6.5 / 100;
  if (dig <= 68) return 6.2 / 100;
  return 5.5 / 100; // ≥69% — rango verdeo/suplementado; piso IPCC
}

function calcGE_kgMS(dig) {
  // IPCC 2019, Tabla 10.2: GE pasto = 18.45 MJ/kg MS
  // Ajuste ±0.3 MJ según calidad (Moe & Tyrrell 1979, citado en IPCC)
  return dig >= 65 ? 18.45 : dig >= 58 ? 18.25 : 18.05; // MJ/kg MS
}

function calcCH4_kgMS(dig) {
  const Ym = calcYm(dig);
  const GE = calcGE_kgMS(dig);
  // CH₄ (g/kg MS) = Ym × GE(MJ/kgMS) × 1000(g/kg CH₄) / 55.65(MJ/kg CH₄)
  // Derivado de Ec.10.21: EF = GEI_anual × Ym/100 / 55.65
  return +(Ym * GE * 1000 / 55.65).toFixed(2);
}

function calcCO2PastizalAnual(veg, ndvi, supHa, cargaEV_ha, precipAnual, t_media) {
  // Rango base de secuestro de C según tipo de vegetación
  // McSherry & Ritchie 2013 + IPCC 2006 Vol.4 Tabla 6.1
  const SOC_BASE_KGC_HA = {
    "Pastizal natural":                 220, // kg C/ha/año — pastizal nativo C4
    "Megatérmicas C4": 280, // C4 implantada, mayor productividad
    "Pasturas templadas C3":                       200, // C3 subtropical
    "Mixta gramíneas+leguminosas":                 250, // fijación N mejora ciclo C
    "Bosque nativo":                               350, // mayor biomasa aérea+raíz
    "Verdeo de invierno":                          100, // cultivo anual, menor acumulación
  }[veg] || 220;

  // Modificador NDVI: proxy de productividad primaria neta
  // NDVI 0.3 = pastizal degradado; NDVI 0.7 = pastizal exuberante
  const ndviN   = parseFloat(ndvi) || 0.45;
  const factNDVI = Math.max(0.5, Math.min(1.5, ndviN / 0.45));

  // Modificador precipitación: relación agua-productividad
  // IPCC 2006: precipitación explica ~40% de la variación en SOC
  const factPrecip = Math.max(0.7, Math.min(1.3, precipAnual / 1100));

  // Modificador carga animal — McSherry & Ritchie 2013
  // Pastoreo moderado (0.4-0.8 EV/ha) → efecto neutro a levemente positivo
  // Sobrecarga (>1.2 EV/ha) → pérdida neta de SOC
  const factCarga = cargaEV_ha > 1.2 ? -0.5  // degradado: pérdida neta
    : cargaEV_ha > 0.8 ? 0.7               // leve sobrecarga
    : cargaEV_ha > 0.4 ? 1.0               // pastoreo moderado — óptimo
    : 0.8;                                  // subganadera: no estimula tanto

  const socKgC_ha   = SOC_BASE_KGC_HA * factNDVI * factPrecip * factCarga;
  const co2_ha      = socKgC_ha * 3.667; // kgC → kgCO₂
  const co2_total   = co2_ha * (parseFloat(supHa) || 1);
  const incertidumbre = 0.40; // ±40% — McSherry & Ritchie 2013

  return {
    socKgC_ha:     Math.round(socKgC_ha),
    CO2_ha:        Math.round(co2_ha),
    CO2_total:     Math.round(co2_total),
    CO2_min:       Math.round(co2_total * (1 - incertidumbre)),
    CO2_max:       Math.round(co2_total * (1 + incertidumbre)),
    esFuente:      co2_total < 0,
    incertidumbre,
    factCarga,
  };
}

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
  fetchSat, fmtFecha, smf,
};
