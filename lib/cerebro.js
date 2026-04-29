"use client";
import { CITAS, NIVELES_EVIDENCIA, bibliotecaParaPrompt, citaCompleta, agruparPorNivel } from "./citas.js";


// ═══════════════════════════════════════════════════════════════════
// lib/cerebro.js
// Capa de interpretación — lee motor + form + sat y produce
// conclusiones algorítmicas + recomendaciones técnicas.
// ═══════════════════════════════════════════════════════════════════

import { SUPLEMENTOS, MESES_NOM, CALIDAD_C4_CALIBRADA } from "./constantes";
import { recomendarSuplemento, calcFaseCiclo, calcImpactoCola, getBiotipo, interpCC, calcPenalidadSanidad } from "./motor";
import { getClima } from "./constantes";

function interpretarRecursoForrajero(form, motor, sat) {
  const fenol    = form.fenologia || "mayor_50";
  const PB       = { menor_10:12, "10_25":9, "25_50":6, mayor_50:4 }[fenol] || 6;
  const dispMS   = motor.disponMS?.msHa || 0;
  const ndvi     = parseFloat(sat?.ndvi) || motor.ndviN || null;
  const veg      = form.vegetacion || "Pastizal natural";
  const supHa    = parseFloat(form.supHa) || 0;
  const pvVaca   = parseFloat(form.pvVacaAdulta) || 320;

  // Tipo de déficit
  const esCalidad  = PB < 7;
  const esCantidad = dispMS > 0 && dispMS < 1200;
  const esMixto    = esCalidad && esCantidad;

  // Consumo voluntario teórico vs real
  const cvTeorico = pvVaca * 0.028; // kg MS/día al 2.8% PV
  const factPB    = PB >= 10 ? 1.0 : PB >= 7 ? 0.80 : 0.55;
  const cvReal    = Math.round(cvTeorico * factPB * 10) / 10;
  const cvPerdido = Math.round((cvTeorico - cvReal) * 10) / 10;

  // Oferta total estimada en verano/invierno
  const ofVerano = motor.balanceMensual?.[0]?.ofPastoTotal || 0; // enero
  const ofInv    = motor.balanceMensual?.[6]?.ofPastoTotal || 0; // julio

  // NDVI contexto
  const ndviCtx = ndvi !== null
    ? (ndvi < 0.35 ? `NDVI ${ndvi.toFixed(2)} — campo seco, por debajo del umbral mínimo productivo`
      : ndvi > 0.65 ? `NDVI ${ndvi.toFixed(2)} — excelente cobertura vegetal`
      : `NDVI ${ndvi.toFixed(2)} — cobertura moderada`)
    : null;

  let conclusion = `${veg} · PB ${PB}% · `;

  if (esMixto) {
    conclusion += `déficit MIXTO (calidad y cantidad). `;
    conclusion += `Pasto encañado paraliza microflora ruminal (Detmann/NASSEM 2010) — `;
    conclusion += `el animal no puede digerir la fibra aunque haya. `;
    conclusion += `Consumo voluntario real: ${cvReal} kg MS/vaca/día vs teórico ${cvTeorico.toFixed(1)} — pierde ${cvPerdido} kg/día. `;
    conclusion += `Suplemento ENERGÉTICO-PROTEICO resuelve ambos déficits.`;
  } else if (esCalidad) {
    conclusion += `déficit de CALIDAD — cantidad disponible pero no aprovechable. `;
    conclusion += `PB ${PB}% bloquea la microflora ruminal (mínimo 7-8% para funcionar). `;
    conclusion += `Con ${cvPerdido} kg MS/vaca/día no aprovechados, el suplemento PROTEICO `;
    conclusion += `desbloquea la digestión de fibra disponible y puede recuperar hasta ${Math.round(cvPerdido*0.8*10)/10} kg/día extra.`;
  } else if (esCantidad) {
    conclusion += `déficit de CANTIDAD — pasto escaso (${dispMS} kg MS/ha). `;
    conclusion += `Suplemento ENERGÉTICO compensa la energía faltante. `;
    conclusion += `Con diario obligatorio para evitar acidosis.`;
  } else {
    conclusion += `recurso forrajero adecuado. `;
    if (ofVerano > 0) conclusion += `Oferta estimada verano: ${ofVerano} Mcal/d. `;
    conclusion += `Monitorear NDVI mensual para anticipar cambios.`;
  }

  if (ndviCtx) conclusion += ` ${ndviCtx}.`;
  if (supHa > 0) conclusion += ` Superficie: ${supHa} ha.`;

  return {
    tipo:        esMixto ? "EP" : esCalidad ? "P" : esCantidad ? "E" : "ok",
    PB, dispMS, cvReal, cvPerdido,
    esCalidad, esCantidad, esMixto,
    conclusion,
  };
}

function interpretarCCEnTiempo(tray, balanceMensual, mesesDeficit) {
  if (!tray) return null;

  const ccHoy       = tray.ccHoy       || 0;
  const ccParto     = tray.ccParto     || 0;
  const ccMinLact   = tray.ccMinLact   || 0;
  const ccServ      = tray.ccServ      || 0;
  const ccServAntic = tray.ccServAntic || 0;
  const ccServHiper = tray.ccServHiper || 0;
  const mesesLact   = parseFloat(tray.mesesLact) || 6;
  const caidaLact   = parseFloat(tray.caidaLact) || 0;
  const prenez      = tray.pr          || 0;
  const prAntic     = tray.prAntic     || prenez;
  const prHiper     = tray.prHiper     || prenez;
  const anestro     = tray.anestro?.dias || 0;

  // Erosión anual por déficit invernal
  const erosionAnual = mesesDeficit >= 2 ? 0.35 : mesesDeficit === 1 ? 0.15 : 0;
  const ciclosAlColapso = erosionAnual > 0 && ccServ > 3.5
    ? Math.max(1, Math.ceil((ccServ - 3.5) / erosionAnual)) : null;

  // Ganancia al actuar
  const ppGananciaAntic = Math.max(0, prAntic - prenez);
  const ppGananciaHiper = Math.max(0, prHiper - prenez);
  const mejorEscenario  = ccServHiper > ccServAntic ? "hiperprecoz" : "anticipado";
  const mejorCC         = mejorEscenario === "hiperprecoz" ? ccServHiper : ccServAntic;
  const mejorPP         = mejorEscenario === "hiperprecoz" ? ppGananciaHiper : ppGananciaAntic;

  let conclusion = "";

  // Trayectoria
  conclusion += `CC tacto ${ccHoy.toFixed(1)} → parto ${ccParto.toFixed(1)} → `;
  conclusion += `mínima lactación ${ccMinLact.toFixed(1)} (caída ${caidaLact} puntos en ${mesesLact.toFixed(0)} meses) → `;
  conclusion += `servicio ${ccServ.toFixed(1)}. `;

  // Estado al servicio
  if (ccServ < 4.0) {
    conclusion += `CC CRÍTICA al servicio — preñez ${prenez}%, anestro prolongado ${anestro}d (Short et al. 1990). `;
  } else if (ccServ < 4.5) {
    conclusion += `CC por debajo del umbral 4.5 — preñez ${prenez}%, vulnerable a variaciones climáticas. `;
  } else {
    conclusion += `CC adecuada al servicio — preñez proyectada ${prenez}%. `;
  }

  // Escenarios de destete
  if (mejorPP > 0) {
    conclusion += `Con destete ${mejorEscenario}: CC sube a ${mejorCC.toFixed(1)} → preñez ${prenez + mejorPP}% (+${mejorPP}pp). `;
  }

  // Proyección temporal
  if (ciclosAlColapso) {
    conclusion += `ALERTA: déficit invernal erosiona ${erosionAnual} CC/año — `;
    conclusion += `en ${ciclosAlColapso} ciclo${ciclosAlColapso > 1 ? "s" : ""} sin corrección `;
    conclusion += `la CC al servicio llega a 3.5 y la preñez colapsa a <50%.`;
  } else {
    conclusion += `Sin déficit invernal persistente — CC puede mantenerse estable ciclo a ciclo.`;
  }

  return {
    ccServ, ccServAntic, ccServHiper, prenez, prAntic, prHiper,
    caidaLact, mesesLact, anestro, erosionAnual, ciclosAlColapso,
    mejorEscenario, mejorCC, mejorPP, ppGananciaAntic, ppGananciaHiper,
    conclusion,
  };
}

function interpretarSuplementacion(form, motor, recursoForrajero) {
  const suplMeses = (form.suplMeses || ["5","6","7"]).map(Number);
  const diasCamp  = suplMeses.length * 30;
  const MESES     = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const mesIni    = suplMeses.length > 0 ? Math.min(...suplMeses) : 5;
  const mesFin    = suplMeses.length > 0 ? Math.max(...suplMeses) : 7;
  const pbPasto   = recursoForrajero?.PB || 6;
  const tipoNeces = recursoForrajero?.tipo || "P";

  // Categorías con suplemento cargado
  const cats = [
    { label:"Vacas",  supl: form.supl_vacas || form.supl1, dosis: parseFloat(form.dosis_vacas||form.dosis1||0), n: parseInt(form.vacasN)||0 },
    { label:"V2S",    supl: form.supl_v2s,   dosis: parseFloat(form.dosis_v2s||0),   n: parseInt(form.v2sN)||0 },
    { label:"Vaq1",   supl: form.supl_vaq1,  dosis: parseFloat(form.dosis_vaq1||0),  n: motor.nVaq1||0 },
    { label:"Vaq2",   supl: form.supl_vaq2,  dosis: parseFloat(form.dosis_vaq2||0),  n: parseInt(form.vaq2N)||0 },
    { label:"Toros",  supl: form.supl_toros, dosis: parseFloat(form.dosis_toros||0), n: parseInt(form.torosN)||0 },
  ].filter(c => c.supl && c.dosis > 0 && c.n > 0);

  // Calcular boost proteico si el suplemento activa microflora
  const boostDesc = pbPasto < 7 && cats.some(c => SUPLEMENTOS[c.supl]?.tipo === "P")
    ? `Con PB pasto ${pbPasto}%, el suplemento proteico activa microflora ruminal → el animal aprovecha la fibra disponible (Detmann/NASSEM 2010). Efecto adicional: +0.8 kg MS pasto consumida por kg de suplemento proteico.`
    : "";

  // Total kg campaña
  const kgTotalCamp = cats.reduce((s, c) => s + c.dosis * c.n * diasCamp, 0);

  let conclusion = "";

  if (cats.length === 0) {
    conclusion += `Sin suplementación cargada para la campaña ${MESES[mesIni]}–${MESES[mesFin]}. `;
    if (tipoNeces === "P") {
      conclusion += `Con PB pasto ${pbPasto}%, la microflora ruminal está por debajo del umbral mínimo. `;
      conclusion += `SIN suplemento proteico: CC vacas pierde 0.3–0.4 puntos extra en invierno, `;
      conclusion += `vaquillona 1° inv GDP cae a 40–60 g/d (no llega al entore). `;
      conclusion += `RECOMENDACIÓN: proteico 0.4–0.5 kg/cab/día 2–3 veces/semana.`;
    } else if (tipoNeces === "E") {
      conclusion += `Déficit energético sin compensar — la CC cae y el GDP queda limitado. `;
      conclusion += `RECOMENDACIÓN: energético (sorgo/maíz) diario para evitar acidosis.`;
    } else {
      conclusion += `Monitorear disponibilidad forrajera. Sin suplemento por ahora.`;
    }
  } else {
    conclusion += `Suplementación activa ${MESES[mesIni]}–${MESES[mesFin]} (${diasCamp}d): `;
    cats.forEach(c => {
      const s = SUPLEMENTOS[c.supl];
      const tipo = s?.tipo || "?";
      const freq = tipo === "E" ? "DIARIO" : "2–3×/sem";
      const kgCat = Math.round(c.dosis * c.n * diasCamp / 100) / 10;
      conclusion += `${c.label} [${tipo}] ${c.dosis} kg ${c.supl} · ${freq} · ${kgCat} tn. `;
    });
    conclusion += `Total campaña: ${(kgTotalCamp/1000).toFixed(1)} tn. `;

    // ¿Está bien elegido el tipo?
    const tiposCargados = [...new Set(cats.map(c => SUPLEMENTOS[c.supl]?.tipo).filter(Boolean))];
    if (tipoNeces === "P" && !tiposCargados.includes("P") && !tiposCargados.includes("EP")) {
      conclusion += `⚠ INCONSISTENCIA: pasto PB ${pbPasto}% requiere proteico pero el suplemento cargado no activa microflora. `;
    } else if (tipoNeces === "E" && tiposCargados.includes("E")) {
      conclusion += `Tipo correcto para el recurso actual. `;
    }

    if (boostDesc) conclusion += boostDesc;
  }

  return {
    cats, diasCamp, mesIni, mesFin, kgTotalCamp, tipoNeces, boostDesc,
    haySupl: cats.length > 0,
    conclusion,
  };
}

function interpretarVerdeo(form, motor) {
  if (form.tieneVerdeo !== "si" || !parseFloat(form.verdeoHa)) {
    return { tieneVerdeo: false, conclusion: "Sin verdeo de invierno cargado." };
  }

  const ha        = parseFloat(form.verdeoHa) || 0;
  const tipo      = form.verdeoTipo || "Avena / Raigrás / Melilotus";
  const dest      = form.verdeoDestinoVaq || "si";
  const nVaq1     = motor.nVaq1 || 0;
  const nV2s      = parseInt(form.v2sN) || 0;
  const pvVaq1    = motor.pvEntVaq1 || Math.round((parseFloat(form.pvVacaAdulta)||320)*0.40);

  // Parámetros por tipo
  const PARAMS = {
    "Avena / Raigrás / Melilotus": { msHa:2800, mcalKg:2.10, pb:18, util:0.50 },
    "Melilotus":                   { msHa:2200, mcalKg:2.15, pb:22, util:0.55 },
    "Raigrás anual":               { msHa:3200, mcalKg:2.20, pb:20, util:0.52 },
    "Triticale":                   { msHa:3000, mcalKg:2.05, pb:14, util:0.48 },
    "Gramínea + leguminosa":       { msHa:2600, mcalKg:2.18, pb:20, util:0.52 },
  };
  const p = PARAMS[tipo] || PARAMS["Avena / Raigrás / Melilotus"];

  // Oferta total del verdeo
  const kgMsTotales = Math.round(ha * p.msHa * p.util);
  const mcalDia     = Math.round(ha * p.msHa * p.mcalKg * p.util / 90); // 90 días

  // GDP en verdeo vs pastizal
  const gdpVerdeo   = 350; // g/d referencia campo
  const gdpPastizal = motor.vaq1E?.gdpReal || 45;

  // Capacidad: cuántas categorías puede recibir el verdeo
  const consumoVaq1 = pvVaq1 * 0.028 * nVaq1; // kg MS/día
  const consumoV2s  = (parseFloat(form.pvVacaAdulta)||320) * 0.88 * 0.028 * nV2s;
  const diasVerdeoVaq1 = consumoVaq1 > 0 ? Math.round(kgMsTotales / consumoVaq1) : 0;
  const diasVerdeoV2s  = consumoV2s  > 0 ? Math.round(kgMsTotales / consumoV2s)  : 0;

  let conclusion = `${ha} ha de ${tipo} (PB ${p.pb}% · ${p.msHa} kg MS/ha · util ${Math.round(p.util*100)}%). `;
  conclusion += `Oferta total: ${kgMsTotales.toLocaleString("es-AR")} kg MS · ${mcalDia} Mcal/día durante 90 días. `;

  if (dest === "si" || dest === "todo") {
    if (nVaq1 > 0) {
      conclusion += `Para ${nVaq1} vaquillona 1° inv: ${diasVerdeoVaq1} días disponibles. `;
      conclusion += `GDP en verdeo ~${gdpVerdeo} g/d vs ${gdpPastizal} g/d en pastizal — `;
      conclusion += `${Math.round(gdpVerdeo/Math.max(1,gdpPastizal))}x mayor. `;
      if (diasVerdeoVaq1 >= 60) {
        conclusion += `RECOMENDACIÓN: destinar vaquillona 1° inv al verdeo — elimina necesidad de suplemento proteico adicional.`;
      } else {
        conclusion += `Verdeo no suficiente para toda la campaña — complementar con suplemento proteico en los meses restantes.`;
      }
    }
  } else if (dest === "v2s") {
    conclusion += `Destinado a V2S (${nV2s} cab): ${diasVerdeoV2s} días. `;
    conclusion += `PB ${p.pb}% alivia el anestro posparto y mejora la recuperación de CC.`;
  }

  return {
    ha, tipo, pb: p.pb, mcalDia, kgMsTotales, gdpVerdeo, gdpPastizal,
    diasVerdeoVaq1, diasVerdeoV2s, tieneVerdeo: true,
    conclusion,
  };
}

function interpretarSanidadReproductiva(form, motor) {
  const ccToros    = parseFloat(form.torosCC) || 0;
  const nToros     = parseInt(form.torosN) || 0;
  const nVacas     = parseInt(form.vacasN) || 0;
  const relAT      = nToros > 0 ? Math.round(nVacas / nToros) : null;
  const diasServ   = motor.cadena?.diasServ || null;
  const diasHastaServ = motor.cadena?.ini
    ? Math.max(0, Math.round((new Date(motor.cadena.ini) - new Date()) / 86400000)) : null;

  const sinAftosa   = form.sanAftosa     !== "si";
  const sinBruc     = form.sanBrucelosis !== "si";
  const sinRevToros = form.sanToros      !== "con_control";
  const hayAbortos  = form.sanAbortos    === "si";

  let issues = [];
  let conclusion = "";

  // Vacunas obligatorias
  if (sinAftosa)   issues.push("⚠ Aftosa sin vacunar — obligatorio SENASA, riesgo de clausura comercial");
  if (sinBruc)     issues.push("⚠ Brucelosis incompleta — aborto masivo en 7° mes, zoonosis (SENASA RES.114/21)");
  if (hayAbortos)  issues.push("⚠ Abortos registrados — diagnóstico urgente de agente causal antes del próximo servicio");
  if (sinRevToros) issues.push("⚠ Sin revisación andrológica de toros — riesgo silencioso: 15-20 vacas vacías sin diagnóstico hasta el tacto");

  // Toros — CC y timing
  if (ccToros > 0) {
    const diasPreparo = Math.round((5.5 - ccToros) / 0.018);
    if (ccToros < 5.0) {
      const urgente = diasHastaServ !== null && diasHastaServ < diasPreparo + 15;
      issues.push(`${urgente ? "⚡ URGENTE" : "→"} Toros CC ${ccToros.toFixed(1)} — necesitan ${diasPreparo}d de preparo para llegar a CC 5.5 al servicio`);
    } else {
      conclusion += `Toros CC ${ccToros.toFixed(1)} — condición adecuada para el servicio. `;
    }
  }

  // Relación toro:vaca
  if (relAT !== null) {
    if (relAT > 35) issues.push(`⚠ Relación ${relAT}:1 toro:vaca — por encima del límite recomendado (25-30:1)`);
    else conclusion += `Relación toro:vaca ${relAT}:1 — dentro del rango adecuado. `;
  }

  if (issues.length === 0 && !conclusion) {
    conclusion = "Sanidad reproductiva en orden. Continuar con el calendario programado.";
  } else {
    conclusion = issues.join(". ") + (conclusion ? ". " + conclusion : "");
  }

  // Agregar penalidades calibradas sobre preñez y GDP
  const penal = calcPenalidadSanidad(form, motor);

  return {
    sinAftosa, sinBruc, sinRevToros, hayAbortos,
    ccToros, relAT, diasHastaServ,
    nIssues: issues.length,
    penalidades: penal.penalidades,
    ppPrenezTotal: penal.ppPrenezTotal,
    esCritico: penal.esCritico,
    conclusion: penal.esCritico
      ? conclusion + ` IMPACTO ESTIMADO EN PREÑEZ: −${penal.ppPrenezTotal}pp`
      : conclusion,
  };
}

function interpretarEficienciaReproductiva(form, motor, tray) {
  const impactoCola  = motor.impactoCola || null;
  const prenez       = tray?.pr          || 0;
  const prenezHist   = parseFloat(form.prenez) || 0;
  const mesesLact    = parseFloat(tray?.mesesLact) || 6;
  const anestro      = tray?.anestro?.dias || 0;
  const diasServ     = motor.cadena?.diasServ || 90;
  const nVacas       = parseInt(form.vacasN) || 0;

  // Cola de parición — impacto en kg ternero
  const kgPerdidos  = impactoCola?.kgPerdidosCola || 0;
  const kgExtra     = impactoCola?.kgExtraHiperprecoz || 0;
  const nCab        = Math.round(nVacas * prenez / 100);
  const kgSistemaCola = Math.round(kgPerdidos * nCab);

  // Gap preñez actual vs histórica
  const gapHistorico = prenezHist > 0 ? prenezHist - prenez : 0;

  let conclusion = "";

  // Anestro posparto
  if (anestro > 60) {
    conclusion += `Anestro posparto ${anestro}d — por encima del óptimo (≤60d para preñez en servicio de ${diasServ}d). `;
    conclusion += `Con anestro actual y servicio de ${diasServ}d: ${Math.max(0, Math.round(100*(1-anestro/diasServ)))}% de las vacas ciclan antes del cierre. `;
  } else if (anestro > 0) {
    conclusion += `Anestro ${anestro}d — dentro del rango aceptable para el servicio planificado. `;
  }

  // Cola de parición
  if (kgPerdidos > 5 && nCab > 0) {
    conclusion += `Cola de parición: servicio ${diasServ}d genera parición extendida — terneros tardíos llegan ${Math.round(kgPerdidos)} kg más livianos al destete (Maresca/INTA 2022). `;
    conclusion += `Impacto total en el rodeo: ${kgSistemaCola.toLocaleString("es-AR")} kg MS perdidos. `;
    conclusion += `Acortando el servicio a 60d: terneros ${Math.round(kgExtra)} kg más pesados al destete, sin cambiar el rodeo.`;
  }

  // Gap histórico
  if (gapHistorico > 5) {
    conclusion += ` Preñez actual ${prenez}% vs histórica ${prenezHist}% — brecha de ${Math.round(gapHistorico)}pp. Revisar si el deterioro es progresivo (balance invernal) o puntual (año climático).`;
  } else if (gapHistorico < -5) {
    conclusion += ` Preñez actual ${prenez}% superior al histórico ${prenezHist}% — mejora positiva. Identificar qué cambió para sostenerlo.`;
  }

  if (!conclusion) conclusion = "Eficiencia reproductiva dentro de parámetros normales para el sistema.";

  return {
    prenez, prenezHist, gapHistorico, anestro, diasServ,
    kgPerdidos, kgExtra, kgSistemaCola,
    conclusion,
  };
}

function interpretarAgua(form, motor) {
  const tds     = parseFloat(form.aguaTDS) || 0;
  const evalAg  = motor.evalAgua || null;
  const pvVaca  = parseFloat(form.pvVacaAdulta) || 320;
  const nVacas  = parseInt(form.vacasN) || 0;

  if (!tds || tds <= 0 || !evalAg) {
    return { hayProblema: false, conclusion: "Sin datos de calidad de agua. Carga TDS para diagnóstico completo." };
  }

  const pctReduc  = evalAg.pctReducDMI || 0;
  const kgPerdido = Math.round(pctReduc / 100 * 2.8 * pvVaca * 0.024 * 10) / 10;
  const hayProblem = pctReduc > 10;

  let conclusion = `Agua TDS ${tds.toLocaleString("es-AR")} mg/L (${form.aguaTipoSal || "tipo mixto"}). `;

  if (pctReduc > 25) {
    conclusion += `CRÍTICO — reduce consumo voluntario ${Math.round(pctReduc)}% → pierde ${kgPerdido} kg MS/vaca/día. `;
    conclusion += `Equivale a eliminar TODO el suplemento planeado. `;
    conclusion += `NINGÚN plan nutricional funciona con esta agua. `;
    conclusion += `Filtrar o cambiar la fuente ES LA PRIMERA PRIORIDAD — antes que cualquier suplemento.`;
  } else if (pctReduc > 10) {
    conclusion += `Reduce consumo ${Math.round(pctReduc)}% → pierde ${kgPerdido} kg MS/vaca/día. `;
    conclusion += `Impacto acumulado en ${nVacas} vacas: ${Math.round(kgPerdido * nVacas)} kg MS/día no consumida. `;
    conclusion += `Filtrar o mejorar la fuente mejora la respuesta a cualquier suplemento.`;
  } else {
    conclusion += `Calidad aceptable — impacto mínimo sobre el consumo voluntario.`;
  }

  return {
    tds, pctReduc, kgPerdido, hayProblema: hayProblem,
    conclusion,
  };
}

function interpretarMomentoOptimo(form, motor, tray, sat) {
  const mesHoy       = new Date().getMonth();
  const MESES        = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const cadena       = motor.cadena || null;
  const mesServR     = cadena?.ini ? new Date(cadena.ini).getMonth() : null;
  const mesParto     = cadena?.partoTemp ? cadena.partoTemp.getMonth() : null;
  const diasHastaServ = cadena?.ini
    ? Math.max(0, Math.round((new Date(cadena.ini) - new Date()) / 86400000)) : null;

  const ccServ       = tray?.ccServ || 0;
  const mesesDeficit = [5,6,7].filter(i => (motor.balanceMensual?.[i]?.balance ?? 0) < 0).length;
  const ndvi         = parseFloat(sat?.ndvi) || null;

  // Ventanas críticas de acción
  const ventanas = [];

  // Ventana suplemento — comprar antes de mayo
  if (mesesDeficit > 0) {
    const mesCompra = 3; // abril
    const diasParaCompra = ((mesCompra - mesHoy + 12) % 12) * 30;
    ventanas.push({
      mes: mesCompra,
      urgencia: diasParaCompra < 45 ? "URGENTE" : "PLANIFICAR",
      accion: "Comprar suplemento para campaña invernal",
      detalle: `${mesesDeficit}/3 meses con déficit — comprar antes de ${MESES[mesCompra]} para tener stock en junio`,
    });
  }

  // Ventana destete
  if (ccServ < 4.5 && mesServR !== null) {
    const mesDestete = (mesServR - 3 + 12) % 12;
    const diasParaDest = ((mesDestete - mesHoy + 12) % 12) * 30;
    ventanas.push({
      mes: mesDestete,
      urgencia: diasParaDest < 30 ? "URGENTE" : diasParaDest < 90 ? "PRÓXIMO" : "PLANIFICAR",
      accion: `Destete ${tray?.recDestete?.tipo === "hiperprecoz" ? "hiperprecoz" : "anticipado"}`,
      detalle: `CC ${ccServ.toFixed(1)} al servicio — actuar ${MESES[mesDestete]} para llegar en condición`,
    });
  }

  // Ventana preparo toros
  if (parseFloat(form.torosCC) > 0 && parseFloat(form.torosCC) < 5.0 && mesServR !== null) {
    const diasPreparo = Math.round((5.5 - parseFloat(form.torosCC)) / 0.018);
    const mesPrep = ((mesServR - Math.ceil(diasPreparo/30)) + 12) % 12;
    ventanas.push({
      mes: mesPrep,
      urgencia: diasHastaServ !== null && diasHastaServ < diasPreparo + 15 ? "URGENTE" : "PLANIFICAR",
      accion: "Iniciar preparo toros",
      detalle: `CC ${form.torosCC} → 5.5 al servicio — ${diasPreparo}d de preparo`,
    });
  }

  // Ordenar por urgencia y proximidad
  const urgOrd = { URGENTE:0, PRÓXIMO:1, PLANIFICAR:2 };
  ventanas.sort((a, b) => {
    const ua = urgOrd[a.urgencia] ?? 3;
    const ub = urgOrd[b.urgencia] ?? 3;
    if (ua !== ub) return ua - ub;
    return ((a.mes - mesHoy + 12) % 12) - ((b.mes - mesHoy + 12) % 12);
  });

  // Contexto climático actual
  let ctxClima = "";
  if (ndvi !== null) {
    if ([5,6,7].includes(mesHoy) && ndvi < 0.40) {
      ctxClima = `NDVI ${ndvi.toFixed(2)} en invierno — campo por debajo del promedio histórico. Suplementación más crítica que en años normales.`;
    } else if (ndvi > 0.65) {
      ctxClima = `NDVI ${ndvi.toFixed(2)} — excelente condición forrajera actual. Aprovechar para mejorar CC antes del invierno.`;
    }
  }

  let conclusion = `Hoy: ${MESES[mesHoy]}. `;
  if (mesServR !== null) conclusion += `Servicio: ${MESES[mesServR]}${diasHastaServ !== null ? " (" + diasHastaServ + "d)" : ""}. `;
  if (mesParto !== null) conclusion += `Parición: ${MESES[mesParto]}. `;

  if (ventanas.length > 0) {
    conclusion += `Ventanas de acción: `;
    ventanas.slice(0, 3).forEach((v, i) => {
      conclusion += `${i+1}) [${v.urgencia}] ${v.accion} → ${MESES[v.mes]}: ${v.detalle}. `;
    });
  } else {
    conclusion += `Sin acciones críticas urgentes en los próximos 3 meses.`;
  }

  if (ctxClima) conclusion += ctxClima;

  return { mesHoy, mesServR, mesParto, diasHastaServ, ventanas, ctxClima, conclusion };
}

function interpretarAmplitudParicion(form, motor, tray) {
  const cadena = motor.cadena;
  if (!cadena) return {
    conclusion: "Sin fechas de servicio — cargá las fechas para analizar la amplitud de parición.",
    viable: null,
  };

  const diasServ    = cadena.diasServ || 0;
  const partoTemp   = cadena.partoTemp;
  const partoTard   = cadena.partoTard;
  const mesServIni  = cadena.ini ? new Date(cadena.ini).getMonth() : null;
  const MESES       = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // Destete real según modalidad cargada
  const destTrad  = parseFloat(form.destTrad)  || 0;
  const destAntic = parseFloat(form.destAntic) || 0;
  const destHiper = parseFloat(form.destHiper) || 0;
  const tot = destTrad + destAntic + destHiper;

  // Modalidad dominante del rodeo
  const modalidad = destTrad >= 50 ? "tradicional" : destAntic >= 40 ? "anticipado" : "hiperprecoz";
  const diasLactModal = modalidad === "tradicional" ? 180 : modalidad === "anticipado" ? 90 : 50;

  // Vaca que parió EN LA CABEZA (partoTemp): tiene diasServ + 280 días de ventaja
  // Vaca que parió AL FINAL (partoTard): desteta diasServ días después que la primera
  // Diferencia de recuperación entre cabeza y cola:
  const diasRecupCabeza = partoTemp && mesServIni !== null
    ? Math.max(0, Math.round((cadena.ini - new Date(partoTemp.getTime() + diasLactModal*86400000)) / 86400000))
    : null;
  const diasRecupCola = partoTard && mesServIni !== null
    ? Math.max(0, Math.round((cadena.ini - new Date(partoTard.getTime() + diasLactModal*86400000)) / 86400000))
    : null;

  // CC al servicio según posición en la parición (Short 1990: 0.3-0.5 CC/mes)
  const tasaRecup = 0.013; // CC/día recuperación promedio
  const ccMinLact = tray?.ccMinLact || 3.0;
  const ccServCabeza = diasRecupCabeza !== null
    ? Math.min(tray?.ccServ || 4.5, +(ccMinLact + diasRecupCabeza * tasaRecup).toFixed(2))
    : null;
  const ccServCola = diasRecupCola !== null
    ? Math.max(1.5, +(ccMinLact + Math.max(0, diasRecupCola) * tasaRecup).toFixed(2))
    : null;

  // Preñez estimada por posición
  const interpPrenez = (cc) => cc >= 5.5 ? 93 : cc >= 5.0 ? 88 : cc >= 4.5 ? 80 : cc >= 4.0 ? 70 : cc >= 3.5 ? 50 : 28;
  const prenezCabeza = ccServCabeza !== null ? interpPrenez(ccServCabeza) : null;
  const prenezCola   = ccServCola   !== null ? interpPrenez(ccServCola)   : null;

  // ¿Es viable el destete tradicional para la vaca tardía?
  const colaConProblema = diasRecupCola !== null && diasRecupCola < 45;
  const brechaCCCabezaCola = ccServCabeza !== null && ccServCola !== null
    ? Math.round((ccServCabeza - ccServCola) * 10) / 10 : null;

  // Recomendación según amplitud
  let recAmplitud = "";
  if (diasServ > 90) {
    recAmplitud = diasServ > 120
      ? `Servicio de ${diasServ}d — parición muy extendida (${MESES[partoTemp?.getMonth()]}–${MESES[partoTard?.getMonth()]}). `
      : `Servicio de ${diasServ}d — parición extendida. `;
  }

  let conclusion = "";

  // Diagnóstico por categoría
  conclusion += `VAQUILLONA 1° y 2° inv: sin ternero al pie → el déficit se corrige con SUPLEMENTACIÓN o PASTURAS DE CALIDAD (verdeo/proteico). `;
  conclusion += `El manejo de la lactancia NO aplica — la solución es nutrición externa. `;
  conclusion += `GDP objetivo: ≥300 g/d para llegar al entore en 24 meses. `;

  if (diasServ > 0) {
    conclusion += `
VACAS ADULTAS y V2S: el déficit se corrige con MANEJO DEL TERNERO, no con suplemento. `;
    conclusion += `Con destete ${modalidad} (${diasLactModal}d): `;

    if (ccServCabeza !== null) {
      conclusion += `vaca que parió en la cabeza → CC servicio ${ccServCabeza.toFixed(1)} → preñez ${prenezCabeza}%. `;
    }
    if (ccServCola !== null && brechaCCCabezaCola !== null) {
      conclusion += `vaca que parió al final → CC servicio ${ccServCola.toFixed(1)} → preñez ${prenezCola}% `;
      conclusion += `(${brechaCCCabezaCola} CC menos que la cabeza = ${Math.round((prenezCabeza||0)-(prenezCola||0))}pp menos de preñez). `;
    }

    if (colaConProblema && modalidad === "tradicional") {
      conclusion += `⚠ PROBLEMA: con servicio de ${diasServ}d y destete tradicional, `;
      conclusion += `la vaca tardía desteta apenas ${Math.max(0,diasRecupCola)}d antes del próximo servicio — `;
      conclusion += `tiempo insuficiente para recuperar CC. `;
      conclusion += `SOLUCIÓN: destete anticipado (90d) en vacas tardías `;
      conclusion += `o acortar el servicio a ≤75d para concentrar la parición.`;
    } else if (modalidad === "anticipado" || modalidad === "hiperprecoz") {
      conclusion += `Con destete ${modalidad}, incluso las vacas tardías tienen `;
      conclusion += `${Math.max(0,diasRecupCola)}d para recuperar CC antes del servicio. `;
      if (diasRecupCola !== null && diasRecupCola > 45) {
        conclusion += `Tiempo suficiente para recuperar ≥0.5 CC con buen pasto.`;
      }
    }
  }

  return {
    diasServ, modalidad, diasLactModal,
    diasRecupCabeza, diasRecupCola,
    ccServCabeza, ccServCola,
    prenezCabeza, prenezCola,
    brechaCCCabezaCola,
    colaConProblema,
    conclusion,
  };
}

function interpretarSistemaCompleto(form, motor, sat, tray) {
  if (!motor || !form) return null;

  const recurso    = interpretarRecursoForrajero(form, motor, sat);
  const ccTiempo   = interpretarCCEnTiempo(tray, motor.balanceMensual, [5,6,7].filter(i=>(motor.balanceMensual?.[i]?.balance??0)<0).length);
  const supl       = interpretarSuplementacion(form, motor, recurso);
  const verdeo     = interpretarVerdeo(form, motor);
  const sanidad    = interpretarSanidadReproductiva(form, motor);
  const eficiencia = interpretarEficienciaReproductiva(form, motor, tray);
  const agua       = interpretarAgua(form, motor);
  const momento    = interpretarMomentoOptimo(form, motor, tray, sat);

  const amplitud   = interpretarAmplitudParicion(form, motor, tray);
  return { recurso, ccTiempo, supl, verdeo, sanidad, eficiencia, agua, momento, amplitud };
}

function analizarMargenOptimizacion(form, motor, tray, interp) {
  const prenez       = tray?.pr || 0;
  const ccServ       = tray?.ccServ || 0;
  const mesesDeficit = [5,6,7].filter(i => (motor.balanceMensual?.[i]?.balance??0) < 0).length;
  const diasServ     = motor.cadena?.diasServ || 90;
  const nVacas       = parseInt(form.vacasN) || 0;
  const pvVaca       = parseFloat(form.pvVacaAdulta) || 320;
  const pctDestete   = parseFloat(form.pctDestete) || 90;
  const MESES        = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const mesServR     = motor.cadena?.ini ? new Date(motor.cadena.ini).getMonth() : null;

  const oportunidades = [];

  // ── 1. COLA DE PARICIÓN — el limitante silencioso más frecuente ──
  // Impacto cola (Maresca/INTA): cada mes de retraso en parición
  // → ternero más liviano al destete. Con servicio > 75 días, la cola pierde.
  const kgPerdidosCola  = motor.impactoCola?.kgPerdidosCola || 0;
  const kgExtraAcortar  = motor.impactoCola?.kgExtraHiperprecoz || 0;
  if (diasServ > 75) {
    const kgGanancia = Math.round(kgPerdidosCola * nVacas * prenez / 100 * 0.95);
    oportunidades.push({
      id:       "acortar_servicio",
      potencia: kgGanancia > 5000 ? "alta" : kgGanancia > 2000 ? "media" : "baja",
      titulo:   `Acortar servicio a 60d — parición concentrada en la cabeza`,
      impacto:  `+${Math.round(kgPerdidosCola)} kg/ternero en cola → +${kgGanancia.toLocaleString("es-AR")} kg MS totales en el rodeo`,
      accion:   `Retirar toros a los 60d de iniciado el servicio (${mesServR !== null ? MESES[(mesServR+2)%12] : "2 meses después"}). Sin cambios en el rodeo.`,
      mecanismo:"Terneros de la cabeza de parición llegan ${Math.round(kgPerdidosCola)} kg más pesados al destete que los de la cola. El servicio largo distribuye parición en 4–5 meses.",
      referencia:"Maresca et al. (INTA) / impactoCola calculado por el motor",
    });
  }

  // ── 2. CC al servicio — margen de mejora ≥ 0.3 puntos ──────────
  // Si ccServ está entre 4.5 y 5.0, subir a 5.0 sube preñez ~9pp
  // "Sacar agua" = exprimir la última mejora que sea costo-efectiva
  if (ccServ >= 4.5 && ccServ < 5.2) {
    const ccObjetivo  = 5.0;
    const ppMejora    = Math.round((ccObjetivo - ccServ) * 18);
    const ternerosEx  = Math.round(nVacas * ppMejora / 100);
    if (ppMejora > 0) {
      oportunidades.push({
        id:       "cc_mejora_marginal",
        potencia: ppMejora >= 5 ? "alta" : "media",
        titulo:   `CC ${ccServ.toFixed(1)} → 5.0 — margen reproductivo disponible`,
        impacto:  `+${ppMejora}pp preñez → +${ternerosEx} terneros sobre la base actual`,
        accion:   ccServ < 4.8
          ? `Destete anticipado selectivo en vacas CC 4.5–4.8 — no es urgente pero deja margen para años climáticamente adversos`
          : `CC buena — sostener con manejo de carga y pastoreo rotativo. Buffer para años malos.`,
        mecanismo:"Con CC 5.0 al servicio la preñez se estabiliza en el máximo sostenible del biotipo. Cada 0.1 CC adicional sobre 4.5 suma 1.8pp de preñez (Short et al. 1990).",
        referencia:"Short R.E. et al. (1990). J. Anim. Sci. 68:799-811.",
      });
    }
  }

  // ── 3. CARGA GANADERA — ajuste fino ────────────────────────────
  // Si la carga es moderada pero el NDVI muestra campo degradado o seco
  const cargaEV   = motor.cargaEV_ha || 0;
  const ndvi      = parseFloat(form._ndviHoy) || motor.ndviN || null;
  const campoSeco = ndvi !== null && ndvi < 0.38;
  if (cargaEV > 0 && (cargaEV > 0.9 || campoSeco)) {
    oportunidades.push({
      id:       "ajuste_carga",
      potencia: campoSeco ? "alta" : "media",
      titulo:   `Carga ${cargaEV.toFixed(2)} EV/ha${campoSeco ? " + campo seco" : ""} — ajuste preventivo`,
      impacto:  campoSeco
        ? "NDVI bajo → reducir carga 15–20% previene deterioro acelerado del pastizal y protege la CC"
        : "Carga alta → el pastizal no recupera entre pastoreos → calidad cae → CC cae en 2–3 ciclos",
      accion:   `Diferir 1 potrero en invierno. Pastoreo rotativo con 35–45 días de descanso en C4. En años Niña: descarga anticipada.`,
      mecanismo:"La oferta forrajera de calidad (PB > 8%) es la variable más costo-efectiva del sistema. Mantenerla es más barato que suplementar.",
      referencia:"Peruchena C.O. (2003). Manejo CC rodeos de cría NEA. INTA Colonia Benítez.",
    });
  }

  // ── 4. EFICIENCIA DE CONVERSIÓN — vaquillona como inversión ────
  // Un sistema con buena preñez debe también optimizar la reposición
  const nVaq1       = motor.nVaq1 || 0;
  const gdpVaq1     = motor.vaq1E?.gdpReal || 0;
  const llegaVaq1   = motor.pvSalidaVaq1 >= Math.round(pvVaca * 0.65);
  if (nVaq1 > 0 && gdpVaq1 >= 200 && llegaVaq1) {
    // Ya llega — el margen es llegar más temprano (24 meses vs 30)
    oportunidades.push({
      id:       "entore_temprano_vaq1",
      potencia: "media",
      titulo:   `Vaquillona 1°inv en condición — analizar entore a 24 meses`,
      impacto:  `Entore a 24 meses (vs 30): 1 ternero adelantado por vaquillona × ${nVaq1} cab = ${nVaq1} terneros adicionales en el ciclo`,
      accion:   `Verificar PV al servicio: debe superar ${Math.round(pvVaca * 0.65)} kg (65% PV adulto = ${Math.round(pvVaca * 0.65)} kg). Si lo alcanza a los 18–20 meses → entore temprano viable.`,
      mecanismo:"Cada ciclo de parición ganado en la vida productiva de la vaquillona equivale a 1 ternero por cabeza de vida útil. Sin costo adicional si la nutrición está cubierta.",
      referencia:"Bavera G.A. (2005). FAV UNRC.",
    });
  }

  // ── 5. VERDEO — maximizar el uso si hay buen sistema ──────────
  if (form.tieneVerdeo === "si" && parseFloat(form.verdeoHa) > 0) {
    const verdeoHa = parseFloat(form.verdeoHa) || 0;
    const v2sN     = parseInt(form.v2sN) || 0;
    // ¿El verdeo se está usando de la mejor manera?
    const destActual = form.verdeoDestinoVaq || "si";
    if (v2sN > 0 && destActual !== "v2s") {
      oportunidades.push({
        id:       "verdeo_v2s",
        potencia: "alta",
        titulo:   `${verdeoHa} ha de verdeo — priorizar V2S reduce anestro posparto`,
        impacto:  `V2S con acceso a verdeo de alta PB: anestro posparto se reduce 15–20 días → preñez en primer servicio +8–12pp`,
        accion:   `Destinar parte del verdeo (al menos 30%) a V2S en el período posparto inmediato (primeros 60 días). La PB alta del verdeo es clave en este momento crítico.`,
        mecanismo:"PB verdeo 14–22% vs PB pastizal invierno 4% → V2S necesita proteína urgente para reactivar ciclos. La lactación sumada al crecimiento propio la pone en déficit proteico.",
        referencia:"Balbuena O. (2003). Nutrición y recría NEA. INTA EEA El Colorado.",
      });
    }
  }

  // ── 6. SANIDAD SUBCLÍNICA — cuando todo parece bien ────────────
  // "Las fallas son de los temas simples" — revisación andrológica,
  // BVD subclínico, parasitosis larvaria que no se ve en el campo
  const sinRevAndr  = form.sanToros !== "con_control";
  const sinBVD      = !form.sanVacunas || !String(form.sanVacunas).includes("BVD");
  if (sinRevAndr && prenez >= 75) {
    oportunidades.push({
      id:       "revision_andrológica",
      potencia: "media",
      titulo:   `Revisación andrológica pendiente — riesgo silencioso con buenos números`,
      impacto:  `Con preñez 75%+ un toro con defecto no detectado puede bajar la preñez 10–15pp en 1 servicio y no se detecta hasta el tacto siguiente`,
      accion:   `Revisación clínica de campo antes de cada servicio: CC, aplomos, prepucio, libido observable. 30 minutos. Costo: mínimo.`,
      mecanismo:"Los sistemas buenos se deterioran por fallas puntuales no monitoreadas. El toro es la variable de mayor impacto que menos se controla.",
      referencia:"Chenoweth P.J. (1994). Vet. Clin. North Am. Food Anim. Pract. 10(3).",
    });
  }

  // ── 7. ENSO / CLIMA — anticipar el próximo año ─────────────────
  const enso = form.enso || "neutro";
  if (enso === "nina") {
    oportunidades.push({
      id:       "enso_nina_prep",
      potencia: "alta",
      titulo:   `Niña proyectada — preparar el sistema para déficit hídrico`,
      impacto:  `Años Niña en NEA: déficit forrajero 20–35% vs promedio histórico. Sistema con buena preñez hoy puede colapsar en 1 ciclo si no se ajusta.`,
      accion:   `Adelantar descarga: vender vacas no preñadas del tacto anterior en lugar de invernada. Comprar suplemento antes de mayo. Diferir potreros desde marzo.`,
      mecanismo:"El ENSO es el predictor de largo plazo más confiable del Chaco húmedo. Actuar en año Niña antes del invierno es la decisión más costo-efectiva.",
      referencia:"IRI Columbia University. ENSO outlook actualizado.",
    });
  } else if (enso === "nino") {
    oportunidades.push({
      id:       "enso_nino_oportunidad",
      potencia: "media",
      titulo:   `Niño proyectado — ventana de aumento de carga o mejora CC`,
      impacto:  `Años Niño en NEA: exceso de pasto → oportunidad de mejorar CC sin costo en suplemento, o aumentar carga transitoriamente`,
      accion:   `Diferir potreros para verano. Si CC está bien, aprovechar la condición forrajera para mejorar la carga animal en el período verde. Cuidado con el exceso de humedad en partos.`,
      mecanismo:"El Niño genera excedentes forrajeros que si no se capitalizan se pierden por senescencia del pasto.",
      referencia:"",
    });
  }

  // Ordenar por potencia
  const ordPot = { alta:0, media:1, baja:2 };
  oportunidades.sort((a,b) => (ordPot[a.potencia]??3) - (ordPot[b.potencia]??3));

  const hayOportunidades = oportunidades.length > 0;
  const parrafoOptim = hayOportunidades
    ? `Sistema sobre la meta de preñez. ${oportunidades.length} oportunidad${oportunidades.length>1?"es":""} de mejora marginal identificada${oportunidades.length>1?"s":""}. El diferencial técnico está en los detalles: ${oportunidades.slice(0,2).map(o=>o.titulo).join(" · ")}.`
    : `Sistema optimizado. Sin oportunidades de mejora marginal inmediata. Mantener el monitoreo mensual de CC y NDVI.`;

  return {
    oportunidades,
    hayOportunidades,
    parrafoOptim,
    esSistemaOptimizable: prenez >= 75 && oportunidades.some(o => o.potencia === "alta"),
  };
}

function calcCerebro(motor, form, sat) {
  if (!motor) return null;

  // ═══════════════════════════════════════════════════════════════
  // NODO ARAÑA — consume TODAS las variables disponibles
  // Estructura: datos crudos → indicadores → análisis temporal → recomendaciones
  // ═══════════════════════════════════════════════════════════════

  // ── CAPA 1: TODAS las variables del motor ──────────────────────
  const tray             = motor.tray           || null;
  const balanceMensual   = motor.balanceMensual || [];
  const vaq1E            = motor.vaq1E          || null;
  const vaq2E            = motor.vaq2E          || null;
  const tcSave           = motor.tcSave         || null;
  const impactoCola      = motor.impactoCola    || null;
  const sanidad          = motor.sanidad        || null;
  const evalAgua         = motor.evalAgua       || null;
  const cadena           = motor.cadena         || null;
  const disponMS         = motor.disponMS       || null;
  const ofertaMensual    = motor.ofertaMensual  || [];
  const nVacas           = motor.nVacas         || 0;
  const nToros           = motor.nToros         || 0;
  const nV2s             = motor.nV2s           || 0;
  const nVaq1            = motor.nVaq1          || 0;
  const nVaq2            = motor.nVaq2          || 0;
  const totalEV          = motor.totalEV        || 0;
  const ccPondVal        = motor.ccPondVal      || 0;
  const pvEntVaq1        = motor.pvEntVaq1      || 0;
  const pvSalidaVaq1     = motor.pvSalidaVaq1   || 0;
  const pvEntradaVaq2    = motor.pvEntradaVaq2  || null;
  const cargaEV_ha       = motor.cargaEV_ha     || null;
  const factorAgua       = motor.factorAgua     || 1.0;
  const factorCarga      = motor.factorCarga    || 1.0;
  const verdeoAporteMes  = motor.verdeoAporteMcalMes || 0;
  const verdeoMesIni     = motor.verdeoMesInicio ?? 7;
  const suplRodeoMcal    = motor.suplRodeoMcalDia || 0;
  const alertasMotor     = motor.alertas        || [];
  const alertasP1        = motor.alertasP1      || [];
  const scoreRiesgo      = motor.scoreRiesgo    || 0;
  const ndviN            = motor.ndviN          || null;
  const tempMotor        = motor.tempHoy        || null;
  const p30Motor         = motor.p30            || null;

  // ── CAPA 2: TODAS las variables del form ──────────────────────
  const pvVaca           = parseFloat(form.pvVacaAdulta) || 320;
  const pvToros          = parseFloat(form.pvToros) || Math.round(pvVaca * 1.3);
  const nVacasN          = parseFloat(form.vacasN) || nVacas || 0;
  const biotipo          = form.biotipo || "Brangus 3/8";
  const bt               = getBiotipo(biotipo);
  const zona             = form.zona || "NEA";
  const provincia        = form.provincia || "";
  const vegetacion       = form.vegetacion || "Pastizal natural";
  const fenologia        = form.fenologia || "menor_10";
  const supHa            = parseFloat(form.supHa) || 0;
  const altPasto         = form.altPasto || "20";
  const tipoPasto        = form.tipoPasto || "";
  // Destete
  const destTrad         = parseFloat(form.destTrad)  || 0;
  const destAntic        = parseFloat(form.destAntic) || 0;
  const destHiper        = parseFloat(form.destHiper) || 0;
  // Suplementación
  const suplMeses        = (form.suplMeses || ["5","6","7"]).map(Number);
  const suplVacas        = form.supl_vacas || form.supl1 || "";
  const dosisVacas       = parseFloat(form.dosis_vacas) || parseFloat(form.dosis1) || 0;
  const suplV2s          = form.supl_v2s || "";
  const dosisV2s         = parseFloat(form.dosis_v2s) || 0;
  const suplVaq1         = form.supl_vaq1 || "";
  const dosisVaq1        = parseFloat(form.dosis_vaq1) || 0;
  const suplVaq2         = form.supl_vaq2 || "";
  const dosisVaq2        = parseFloat(form.dosis_vaq2) || 0;
  const suplToros        = form.supl_toros || "";
  const dosisToros       = parseFloat(form.dosis_toros) || 0;
  const suplPreparto     = form.supl3 || "";
  const dosisPreparto    = parseFloat(form.dosis3) || 0;
  // Verdeo
  const tieneVerdeo      = form.tieneVerdeo === "si";
  const verdeoHa         = parseFloat(form.verdeoHa) || 0;
  const verdeoTipo       = form.verdeoTipo || "Avena / Raigrás / Melilotus";
  const verdeoDisp       = form.verdeoDisp || "agosto";
  const verdeoDestVaq    = form.verdeoDestinoVaq || "si";
  // Categorías
  const pctRepos         = parseFloat(form.pctReposicion) || 20;
  const ccToros          = parseFloat(form.torosCC) || 0;
  const primerParto      = !!form.primerParto;
  // Sanidad
  const sanAftosa        = form.sanAftosa === "si";
  const sanBrucelosis    = form.sanBrucelosis === "si";
  const sanToros         = form.sanToros === "con_control";
  const sanAbortos       = form.sanAbortos === "si";
  const sanPrograma      = form.sanPrograma === "si";
  // Agua
  const aguaTDS          = parseFloat(form.aguaTDS) || 0;
  // Histórico
  const prenezHistorica  = parseFloat(form.prenez) || 0;

  // ── CAPA 3: TODAS las variables del sat ──────────────────────
  const tempHoy    = parseFloat(sat?.temp) || tempMotor || null;
  const ndviHoy    = parseFloat(sat?.ndvi) || ndviN || null;
  const p30Hoy     = parseFloat(sat?.p30)  || p30Motor || null;
  const ensoHoy    = sat?.enso || form.enso || "neutro";
  const hist       = getClima(provincia || "Corrientes");
  const mesHoy     = new Date().getMonth();
  const MESES      = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // ── CAPA 4: INDICADORES CALCULADOS ────────────────────────────
  // CC
  const ccServ       = parseFloat(tray?.ccServ    || 0);
  const ccParto      = parseFloat(tray?.ccParto   || 0);
  const ccMinLact    = parseFloat(tray?.ccMinLact || 0);
  const ccHoy        = parseFloat(tray?.ccHoy     || ccPondVal || 0);
  const ccServAntic  = parseFloat(tray?.ccServAntic || 0);
  const ccServHiper  = parseFloat(tray?.ccServHiper || 0);
  const mesesLact    = parseFloat(tray?.mesesLact || 6);
  const anestro      = tray?.anestro?.dias ?? 0;
  const recDestete   = tray?.recDestete || null;
  const prAntic      = tray?.prAntic || 0;
  const prHiper      = tray?.prHiper || 0;

  // Preñez
  const prenezEst    = tray?.pr ?? 0;
  const META_PRENEZ  = 75;
  const GAP_PRENEZ   = Math.max(0, META_PRENEZ - prenezEst);

  // Balance temporal — análisis mes a mes
  const balJun = balanceMensual[5]?.balance ?? 0;
  const balJul = balanceMensual[6]?.balance ?? 0;
  const balAgo = balanceMensual[7]?.balance ?? 0;
  const balMay = balanceMensual[4]?.balance ?? 0;
  const mesesDeficit = [5,6,7].filter(i => (balanceMensual[i]?.balance ?? 0) < 0).length;
  const deficitAcumInv = Math.abs(Math.min(0,balJun) + Math.min(0,balJul) + Math.min(0,balAgo));
  const peorMes    = [4,5,6,7,8].reduce((mn,i) =>
    (balanceMensual[i]?.balance??0) < (balanceMensual[mn]?.balance??0) ? i : mn, 5);
  const peorDeficit = balanceMensual[peorMes]?.balance ?? 0;

  // PB del pasto por fenología
  const PB_PASTO_HOY = { menor_10:12, "10_25":9, "25_50":6, mayor_50:4 }[fenologia] || 8;
  const esEncañado   = PB_PASTO_HOY < 7;
  const dispMS_ha    = disponMS?.msHa || 0;
  const esBajaCant   = dispMS_ha < 1200;

  // Vaquillona
  const gdpVaq1Real  = vaq1E?.gdpReal  || 0;
  const gdpVaq1Recom = vaq1E?.gdpRecom || 300;
  const pvVaq1Sal    = pvSalidaVaq1    || vaq1E?.pvSal || 0;
  const pvVaq1Obj    = Math.round(pvVaca * 0.65);
  const vaq1Llega    = pvVaq1Sal >= pvVaq1Obj;
  const hayVaq1      = nVaq1 > 0 && vaq1E;
  const pvVaq2Act    = vaq2E?.pvEntore || 0;
  const pvVaq2Min    = vaq2E?.pvMinEntore || Math.round(pvVaca * 0.75);
  const vaq2Llega    = vaq2E?.llegas ?? (pvVaq2Act >= pvVaq2Min);
  const hayVaq2      = nVaq2 > 0 && vaq2E;
  const pvVaq2Falta  = vaq2Llega ? 0 : pvVaq2Min - pvVaq2Act;

  // Impacto cola de preñez
  const kgExtraDestete   = impactoCola?.kgExtraHiperprecoz || 0;
  const kgPerdidosCola   = impactoCola?.kgPerdidosCola     || 0;

  // Carga
  const cargaStr     = cargaEV_ha
    ? cargaEV_ha > 1.2 ? "sobrecargado" : cargaEV_ha > 0.8 ? "carga alta" : "carga moderada"
    : "sin dato";
  const hayCargaAlta = cargaEV_ha && cargaEV_ha > 1.0;

  // Satélite
  const campoSeco      = ndviHoy !== null && ndviHoy < 0.35;
  const campoExcelente = ndviHoy !== null && ndviHoy > 0.65;
  const callorExtremo  = tempHoy !== null && tempHoy > 35;
  const faltaAgua      = p30Hoy  !== null && p30Hoy  < 20;
  const alertaSat      = campoSeco      ? "⚠ NDVI " + ndviHoy?.toFixed(2) + " — campo seco, pasto comprometido"
                       : callorExtremo  ? "⚠ " + tempHoy + "°C — consumo voluntario reducido en C4"
                       : faltaAgua      ? "⚠ Solo " + p30Hoy + "mm/30d — pasturas bajo estrés hídrico"
                       : campoExcelente ? "✓ NDVI " + ndviHoy?.toFixed(2) + " — campo en excelente condición"
                       : null;

  // Agua
  const aguaSal        = (evalAgua?.pctReducDMI || 0) > 10;
  const reduccionDMI   = evalAgua?.pctReducDMI || 0;

  // Fechas clave del ciclo
  const mesParto    = cadena?.partoTemp ? cadena.partoTemp.getMonth() : null;
  const mesServR    = cadena?.ini       ? cadena.ini.getMonth()       : null;
  const mesDestR    = mesParto !== null ? (mesParto + Math.round(mesesLact)) % 12 : null;
  const mesPrepToro = mesServR !== null ? (mesServR - 2 + 12) % 12   : null;
  const mesPreparto = mesParto !== null ? (mesParto - 2 + 12) % 12   : null;
  const diasHastaServ = cadena?.ini
    ? Math.max(0, Math.round((new Date(cadena.ini) - new Date()) / 86400000))
    : null;
  const fmtMes = (m) => m !== null ? MESES[m] : "—";
  const fmtDesde = (dias) => {
    if (!dias) return "próximamente";
    const d = new Date(Date.now() + dias * 86400000);
    return d.toLocaleDateString("es-AR", { month:"short", year:"2-digit" });
  };

  // ── CAPA 5: SCORE DE SUSTENTABILIDAD ─────────────────────────
  // Pregunta: ¿puede este sistema sostener ≥75% preñez ciclo a ciclo?
  // Calcula la preñez real proyectada si no se actúa, y cuántos ciclos
  // hasta que el déficit invernal erosiona la CC al punto de colapso.

  const erosionCCAnual  = mesesDeficit >= 2
    ? (Math.abs(peorDeficit) > 100 ? 0.40 : 0.20)
    : mesesDeficit === 1 ? 0.10 : 0;

  const ciclosAlColapso = erosionCCAnual > 0 && ccServ > 3.5
    ? Math.max(1, Math.ceil((ccServ - 3.5) / erosionCCAnual))
    : null;  // null = sistema estable

  // Preñez sustentable = preñez actual menos el efecto de todos los limitantes activos
  const ppLimCC      = ccServ > 0 && ccServ < 4.5 ? Math.round((4.5 - ccServ) * 18) : 0;
  const ppLimBalance = mesesDeficit >= 2 ? 10 : mesesDeficit === 1 ? 4 : 0;
  const ppLimToros   = (ccToros > 0 && ccToros < 4.5) ? 12 : (ccToros > 0 && ccToros < 5.0) ? 6 : 0;
  const ppLimAgua    = reduccionDMI > 25 ? 8 : reduccionDMI > 10 ? 4 : 0;
  // Usar calcPenalidadSanidad para cuantificar el impacto real
  const penalidadSan = calcPenalidadSanidad(form, motor);
  const ppLimSanidad = penalidadSan.ppPrenezTotal || ((!sanAftosa ? 5 : 0) + (!sanBrucelosis ? 8 : 0));
  const prenezSustentable = Math.max(20, prenezEst - ppLimCC - ppLimBalance - ppLimToros - ppLimAgua - ppLimSanidad);
  const esSustentable     = prenezSustentable >= META_PRENEZ;

  // ── CAPA 6: ANÁLISIS TEMPORAL MES A MES ──────────────────────
  // Para cada mes del año: qué recursos hay, qué pasa en el ciclo, qué riesgos activos
  const cronograma = MESES.map((mes, i) => {
    const bm         = balanceMensual[i] || {};
    const bal        = bm.balance ?? 0;
    const ofPasto    = bm.ofPastoTotal ?? 0;
    const demanda    = bm.demanda ?? 0;
    const pbPas      = bm.pbPas  ?? PB_PASTO_HOY;
    const suplAp     = bm.suplAporte ?? 0;
    const verdeoAp   = bm.verdeoAporte ?? 0;
    const tempMes    = hist[i]?.t || 20;
    const ndviMesI   = ndviHoy ? (ndviHoy * ((ndviHoy > 0.5 ? 1.0 : 0.8) + (i >= 10 || i <= 2 ? 0.2 : i >= 5 && i <= 7 ? -0.3 : 0))) : null;
    const esPasado   = i < mesHoy;
    const esActual   = i === mesHoy;
    const esInv      = [5,6,7].includes(i);
    const esParto    = i === mesParto;
    const esServ     = i === mesServR;
    const esDestete  = i === mesDestR;
    const esSupl     = suplMeses.includes(i);
    const esVerdeo   = tieneVerdeo && i >= verdeoMesIni && i <= verdeoMesIni + 2;
    const esPrepToros = i === mesPrepToro;
    const esPrepParto = i === mesPreparto;

    // Riesgos activos este mes
    const riesgos = [];
    if (bal < -50)   riesgos.push({ tipo:"deficit_severo", label:"Déficit " + Math.round(bal) + "M",   color:"#e05530" });
    else if (bal < 0) riesgos.push({ tipo:"deficit_leve",  label:"Déficit " + Math.round(bal) + "M",   color:"#e8a030" });
    if (esParto)      riesgos.push({ tipo:"hito",           label:"Parición " + fmtMes(i),              color:"#7ec850" });
    if (esServ)       riesgos.push({ tipo:"hito",           label:"Inicio servicio",                     color:"#4a9fd4" });
    if (esDestete)    riesgos.push({ tipo:"hito",           label:"Destete " + fmtMes(i),               color:"#e8a030" });
    if (esPrepToros)  riesgos.push({ tipo:"accion",         label:"Iniciar preparo toros",               color:"#4a9fd4" });
    if (esPrepParto)  riesgos.push({ tipo:"accion",         label:"Supl. preparto",                      color:"#7ec850" });
    if (esSupl && suplRodeoMcal > 0) riesgos.push({ tipo:"recurso", label:"Supl. activo +" + Math.round(suplRodeoMcal) + "M", color:"#7ec850" });
    if (esVerdeo)     riesgos.push({ tipo:"recurso",        label:"Verdeo +" + Math.round(verdeoAp) + "M", color:"#7ec850" });
    if (esInv && pbPas < 7 && !esSupl) riesgos.push({ tipo:"alerta", label:"Sin supl. pasto PB " + pbPas + "%", color:"#e8a030" });
    if (campoSeco && esActual) riesgos.push({ tipo:"sat", label:"NDVI bajo hoy", color:"#e8a030" });

    return {
      mes, i, bal, ofPasto, demanda, pbPas, suplAp, verdeoAp,
      tempMes, esInv, esActual, esPasado, esParto, esServ,
      esDestete, esSupl, esVerdeo, esPrepToros, esPrepParto, riesgos,
    };
  });

  // ── CAPA 7: LIMITANTES EN ORDEN DE IMPACTO ───────────────────
  // Cada limitante tiene: causa raíz → efecto medible → solución con dosis/kg → cuándo
  const limitantes = [];
  let ppGanadosCC = 0; // se calcula al construir el limitante de CC

  const añadir = (l) => limitantes.push(l);

  // ── AGUA — bloquea todo, va primero ──────────────────────────
  if (aguaSal) {
    añadir({
      id: "agua_sal",
      prioridad: reduccionDMI > 25 ? "URGENTE" : "P1",
      icono: "💧",
      titulo: `Agua salada TDS ${evalAgua?.tdsN||"?"} mg/L — −${Math.round(reduccionDMI)}% consumo`,
      impacto: `Pierde ${(reduccionDMI/100*2.8*pvVaca*0.024).toFixed(1)} kg MS/vaca/día. Ningún suplemento compensa esto.`,
      solucion: "Cambiar fuente o instalar filtro. Actuar antes de cualquier otro plan.",
      cuandoActuar: "AHORA — actúa todo el año",
      mesAccion: mesHoy, categoria: "Agua",
      cuantifica: `${nVacasN} vacas × −${(reduccionDMI/100*2.8*pvVaca*0.024).toFixed(1)} kg MS/día`,
    });
  }

  // ── SANIDAD URGENTE ──────────────────────────────────────────
  (sanidad?.tareas || []).filter(t => t.urgencia === "URGENTE").forEach(t => {
    añadir({
      id: `san_${t.vacuna}`, prioridad: "URGENTE", icono: "🔴",
      titulo: t.vacuna, impacto: t.porque || "Riesgo sanitario crítico",
      solucion: t.instruccion, cuandoActuar: t.fecha || "Inmediato",
      mesAccion: mesHoy, categoria: "Sanidad",
    });
  });

  // ── CC AL SERVICIO — limitante reproductivo central ──────────
  // Usar interpretarAmplitudParicion para entender el problema real:
  // vacas tardías con servicio largo no pueden recuperar CC con destete tradicional
  const amplitudCalc = interpretarAmplitudParicion(form, motor, tray);
  const colaConProblema = amplitudCalc?.colaConProblema || false;
  const brechaCola      = amplitudCalc?.brechaCCCabezaCola || 0;

  if (ccServ > 0 && ccServ < 4.5) {
    const urgCC       = ccServ < 4.0 ? "URGENTE" : "P1";
    const mesAccDest  = mesServR !== null ? (mesServR - 3 + 12) % 12 : 3;
    const ppGanados   = recDestete?.tipo === "hiperprecoz" ? (prHiper - prenezEst)
                      : recDestete?.tipo === "anticipado"  ? (prAntic - prenezEst) : 0;
    const ccSiActua    = recDestete?.tipo === "hiperprecoz" ? ccServHiper : ccServAntic;
    const labelDest   = recDestete?.tipo === "hiperprecoz" ? "Hiperprecoz ≤50d" : "Anticipado 90d";
    const ternerosDest = Math.round(nVacasN * ppGanados / 100);
    ppGanadosCC = ppGanados;
    añadir({
      id: "cc_serv", prioridad: urgCC, icono: "🐄",
      titulo: `CC ${ccServ.toFixed(1)} al servicio — preñez ${prenezEst}% (meta ${META_PRENEZ}%)`,
      impacto: colaConProblema
        ? `Servicio ${amplitudCalc?.diasServ||"?"}d → parición extendida: vaca cabeza CC ${amplitudCalc?.ccServCabeza?.toFixed(1)||"?"} (${amplitudCalc?.prenezCabeza||"?"}% preñez) vs vaca tardía CC ${amplitudCalc?.ccServCola?.toFixed(1)||"?"} (${amplitudCalc?.prenezCola||"?"}% preñez) — brecha ${brechaCola} CC · ${brechaCola > 0 ? Math.round(brechaCola*18)+"pp menos en la cola" : ""}`
        : `Brecha: −${GAP_PRENEZ}pp · Con ${labelDest}: CC ${ccSiActua?.toFixed(1)||"?"} → preñez ${(prenezEst+ppGanados)||"?"}% (+${ppGanados||"?"}pp · +${ternerosDest} terneros)`,
      solucion: colaConProblema
        ? `Vacas tardías (últimos ${Math.round((amplitudCalc?.diasServ||90)/2)}d del servicio) → destete anticipado (90d). Vacas cabeza → seguir el plan actual (${labelDest}). Próximo servicio: acortar a ≤75d para concentrar la parición y uniformizar la recuperación de CC.`
        : recDestete?.tipo === "hiperprecoz"
        ? `Destete hiperprecoz (≤50d) en vacas CC <4.0 — libera 6–8 Mcal/día → cicla en 10–14d`
        : `Destete anticipado (90d) en vacas CC 4.0–4.5 — CC sube ${(ccServAntic-ccServ).toFixed(1)} antes del servicio`,
      cuandoActuar: `${fmtMes(mesAccDest)} — ${mesAccDest < mesHoy ? "ventana pasada, actuar igual" : Math.round(Math.abs(mesAccDest-mesHoy)) + " meses para actuar"}`,
      mesAccion: mesAccDest, categoria: "CC",
      cuantifica: `${Math.round(nVacasN*0.6)} vacas estimadas con CC <4.5`,
    });

    // Suplemento preparto si CC parto también baja
    if (ccParto < 4.5 && mesPreparto !== null) {
      const rec = recomendarSuplemento(fenologia, PB_PASTO_HOY, dispMS_ha, 0, pvVaca, form, "vacas");
      const op  = rec.opciones?.[0] || { nombre:"Expeller girasol", dosis:0.5, tipo:"P", freq:"2–3×/sem" };
      const kgPP = Math.round(op.dosis * nVacasN * 60);
      añadir({
        id: "supl_preparto", prioridad: "P1", icono: "🌾",
        titulo: `Supl. preparto [${op.tipo}] — CC parto ${ccParto.toFixed(1)} → objetivo ≥4.5`,
        impacto: `Cada 0.5 CC al parto = 25d menos anestro posparto (Short 1990). Anestro actual: ${anestro}d`,
        solucion: `[${op.tipo}] ${op.dosis} kg ${op.nombre}/vaca/día · ${op.freq} · 60d. Total: ${(kgPP/1000).toFixed(1)} tn para ${nVacasN} vac.${rec.impactoCV ? " " + rec.impactoCV : ""}`,
        cuandoActuar: `${fmtMes(mesPreparto)}–${fmtMes(mesParto)} (sin ternero al pie)`,
        mesAccion: mesPreparto, categoria: "CC", tipoSupl: op.tipo,
        cuantifica: `${nVacasN} vacas · ${(kgPP/1000).toFixed(1)} tn`,
      });
    }
  }

  // ── BALANCE FORRAJERO INVERNAL ────────────────────────────────
  if (mesesDeficit > 0) {
    const mesIni     = suplMeses.length > 0 ? Math.min(...suplMeses) : 5;
    const mesFinBal  = suplMeses.length > 0 ? Math.max(...suplMeses) : 7;
    const diasCamp   = suplMeses.length * 30;
    const fenolInv   = "mayor_50"; // invierno NEA = C4 encañado
    const pbPasInv   = 4; // C4 encañado
    const tipoDefInv = pbPasInv < 7 && esBajaCant ? "EP" : pbPasInv < 7 ? "P" : "E";
    const rec = recomendarSuplemento(fenolInv, pbPasInv, dispMS_ha, Math.abs(peorDeficit), pvVaca, form, "vacas");
    const op  = rec.opciones?.[0] || { nombre:"Expeller girasol", dosis:0.5, tipo:"P", freq:"2–3×/sem" };
    const nTotal = nVacasN + nV2s + nToros;
    const kgCamp = Math.round(op.dosis * nTotal * diasCamp);
    const mesCompra = Math.max(0, mesIni - 1);
    const perdidaCC = mesesDeficit >= 2 ? 0.4 : 0.2;

    añadir({
      id: "balance_inv", prioridad: mesesDeficit >= 2 ? "P1" : "P2", icono: "📉",
      titulo: `Déficit forrajero ${mesesDeficit}/3 meses · peor: ${fmtMes(peorMes)} ${Math.round(peorDeficit)}M/d`,
      impacto: tieneVerdeo && verdeoAporteMes > 0
        ? `Verdeo cubre ${Math.round(verdeoAporteMes)} Mcal/d · déficit neto: ${Math.round(Math.abs(peorDeficit)-verdeoAporteMes)}M/d en peor mes`
        : `Sin corrección: −${perdidaCC.toFixed(1)} CC invernal → preñez siguiente ciclo −${Math.round(perdidaCC*18)}pp`,
      solucion: esEncañado
        ? `[P] Suplemento proteico activa microflora — ${op.dosis} kg ${op.nombre}/cab/día · ${op.freq} · ${fmtMes(mesIni)}–${fmtMes(mesFinBal)}. Total: ${(kgCamp/1000).toFixed(1)} tn para ${nTotal} cab`
        : esBajaCant
        ? `[EP] Déficit mixto — ${op.dosis} kg ${op.nombre}/cab/día · DIARIO · ${fmtMes(mesIni)}–${fmtMes(mesFinBal)}. Total: ${(kgCamp/1000).toFixed(1)} tn`
        : `[E] Déficit energético — ${op.dosis} kg ${op.nombre}/cab/día · DIARIO · Total: ${(kgCamp/1000).toFixed(1)} tn`,
      cuandoActuar: `Comprar en ${fmtMes(mesCompra)} — antes del inicio de la campaña`,
      mesAccion: mesCompra, categoria: "Balance", tipoSupl: tipoDefInv,
      cuantifica: `${(kgCamp/1000).toFixed(1)} tn · ${diasCamp} días · ${nTotal} cab`,
    });
  }

  // ── VAQUILLONA 1° INVIERNO ────────────────────────────────────
  if (hayVaq1) {
    const nVaq1N       = nVaq1 || Math.round(nVacasN * pctRepos / 100);
    const verdeoParaVaq = tieneVerdeo && verdeoDestVaq !== "todo" && verdeoHa > 0;
    const rec = recomendarSuplemento(fenologia, PB_PASTO_HOY, dispMS_ha, 0,
      pvEntVaq1 || Math.round(pvVaca*0.40), form, "vaq1");
    const op  = rec.opciones?.[0] || { nombre:"Expeller girasol", dosis:0.4, tipo:"P", freq:"2–3×/sem" };
    const gdpConSupl  = esEncañado ? Math.round(gdpVaq1Real * 3.5) : Math.round(gdpVaq1Real * 1.8);
    const kgVaq1      = Math.round(op.dosis * nVaq1N * 90);
    const pvAgostoProyectado = pvVaq1Sal + Math.round(gdpConSupl / 1000 * 90);

    if (!vaq1Llega || gdpVaq1Real < 200) {
      añadir({
        id: "vaq1_dev", prioridad: !vaq1Llega ? "P1" : "P2", icono: "🐮",
        titulo: verdeoParaVaq
          ? `Vaq1 → Verdeo ${verdeoTipo} · GDP ${gdpVaq1Real||"?"}→${gdpConSupl} g/d`
          : `Vaq1 [${op.tipo}] · GDP ${gdpVaq1Real||"?"} g/d → ${gdpConSupl} g/d con corrección`,
        impacto: `PV agosto: ${pvVaq1Sal} kg → con corrección: ~${pvAgostoProyectado} kg · objetivo: ${pvVaq1Obj} kg (65% PV adulto)`,
        solucion: verdeoParaVaq
          ? `Destinar a verdeo de invierno (${verdeoHa} ha, ${verdeoTipo}) — PB alto elimina necesidad de supl proteico. GDP en verdeo: ~350 g/d. Pesada en agosto para confirmar.`
          : `[${op.tipo}] ${op.dosis} kg ${op.nombre}/cab/día · ${op.freq} · May–Ago. Sal mineral 30g/d. Pesada mensual. Total: ${(kgVaq1/1000).toFixed(1)} tn para ${nVaq1N} cab.`,
        cuandoActuar: `Mayo — iniciar antes de que el GDP caiga a valores críticos`,
        mesAccion: 4, categoria: "Vaquillona", tipoSupl: op.tipo,
        cuantifica: `${nVaq1N} cab · ${(kgVaq1/1000).toFixed(1)} tn · 90 días`,
      });
    }
  }

  // ── VAQUILLONA 2° INVIERNO ────────────────────────────────────
  if (hayVaq2 && !vaq2Llega && pvVaq2Falta > 0) {
    const rec = recomendarSuplemento(fenologia, PB_PASTO_HOY, dispMS_ha, 0,
      pvEntradaVaq2 || Math.round(pvVaca*0.65), form, "vaq2");
    const op  = rec.opciones?.[0] || { nombre:"Semilla algodón", dosis:0.8, tipo:"EP", freq:"diario" };
    const kgVaq2 = Math.round(op.dosis * nVaq2 * 120);
    añadir({
      id: "vaq2_entore", prioridad: pvVaq2Falta > 20 ? "P1" : "P2", icono: "⏰",
      titulo: `Vaq2 — faltan ${Math.round(pvVaq2Falta)} kg PV para entore · [${op.tipo}]`,
      impacto: `PV actual: ${pvVaq2Act} kg · mínimo entore: ${pvVaq2Min} kg (75% PV adulto = ${Math.round(pvVaca*0.75)} kg)`,
      solucion: `[${op.tipo}] ${op.dosis} kg ${op.nombre}/cab/día · ${op.freq} · 120d. Total: ${(kgVaq2/1000).toFixed(1)} tn para ${nVaq2} cab.`,
      cuandoActuar: `Inmediato — ${fmtMes(4)}–${fmtMes(7)}`,
      mesAccion: 4, categoria: "Vaquillona", tipoSupl: op.tipo,
      cuantifica: `${nVaq2} cab · ${(kgVaq2/1000).toFixed(1)} tn`,
    });
  }

  // ── TOROS ─────────────────────────────────────────────────────
  if (ccToros > 0 && ccToros < 5.0) {
    const diasPrep   = Math.round((5.5 - ccToros) / 0.018);
    const mesPrep    = mesServR !== null ? (mesServR - Math.ceil(diasPrep/30) + 12) % 12 : mesHoy;
    const urgToro    = diasHastaServ !== null && diasHastaServ < diasPrep + 15;
    const recT = recomendarSuplemento(fenologia, PB_PASTO_HOY, dispMS_ha, 0, pvToros, form, "toros");
    const opT  = recT.opciones?.[0] || { nombre:"Maíz grano", dosis:2.0, tipo:"E", freq:"diario" };
    const kgToros = Math.round((suplToros ? dosisToros : opT.dosis) * nToros * diasPrep);
    const suplDesc = suplToros && dosisToros > 0
      ? `[${SUPLEMENTOS[suplToros]?.tipo||opT.tipo}] ${dosisToros} kg ${suplToros}/toro/día`
      : `[${opT.tipo}] ${opT.dosis} kg ${opT.nombre}/toro/día`;
    añadir({
      id: "toros_prep", prioridad: urgToro ? "URGENTE" : ccToros < 4.5 ? "P1" : "P2", icono: "🐂",
      titulo: `Toros CC ${ccToros.toFixed(1)} — preparo ${diasPrep}d · ${suplDesc.split("]")[0]}]`,
      impacto: `CC ${ccToros.toFixed(1)} → objetivo 5.5. ` + (urgToro ? `Solo ${diasHastaServ}d al servicio — no llega a CC 5.5` : `${diasPrep}d de preparo necesario`),
      solucion: `${suplDesc} · ${suplToros && SUPLEMENTOS[suplToros]?.tipo==="E" ? "DIARIO" : opT.freq} · ${diasPrep}d · Total: ${(kgToros/1000).toFixed(1)} tn. Lote separado obligatorio.`,
      cuandoActuar: urgToro ? `⚠ URGENTE — ${diasHastaServ}d al servicio` : `${fmtMes(mesPrep)} — ${diasPrep}d antes del servicio`,
      mesAccion: mesPrep, categoria: "Toros", tipoSupl: opT.tipo,
      cuantifica: `${nToros} toros · relación ${Math.round(nVacasN/Math.max(1,nToros))}:1`,
    });
  }
  if (!sanToros) {
    añadir({
      id: "esan_toros", prioridad: diasHastaServ !== null && diasHastaServ < 50 ? "P1" : "P2", icono: "🔬",
      titulo: "Revisación toros antes del servicio",
      impacto: "Toro con lesión física no detectada = 15–20 vacas vacías sin diagnóstico hasta el tacto",
      solucion: "CC, aplomos, prepucio, libido. 30 min de campo — no requiere laboratorio.",
      cuandoActuar: mesServR !== null ? `${fmtMes((mesServR-1+12)%12)} — 30d antes del servicio` : "35–40d antes del servicio",
      mesAccion: mesServR !== null ? (mesServR-1+12)%12 : mesHoy, categoria: "Toros",
    });
  }

  // ── IMPACTO COLA DE PREÑEZ ────────────────────────────────────
  if (impactoCola && kgPerdidosCola > 5) {
    añadir({
      id: "cola_prenez", prioridad: "P2", icono: "📅",
      titulo: `Cola de parición — pierde ${Math.round(kgPerdidosCola)} kg/ternero por retraso`,
      impacto: `Vacas preñadas tarde → terneros más livianos al destete · ${Math.round(kgPerdidosCola)} kg/cab`,
      solucion: "Acortar el servicio a 60–75 días — fuerza parición concentrada en la cabeza. Retiro de toros en fecha fija.",
      cuandoActuar: `Antes del próximo servicio (${fmtMes(mesServR)})`,
      mesAccion: mesServR, categoria: "Reproducción",
    });
  }

  // ── CARGA GANADERA ────────────────────────────────────────────
  if (hayCargaAlta) {
    añadir({
      id: "carga_alta", prioridad: "P2", icono: "⚖",
      titulo: `Carga ${cargaEV_ha?.toFixed(2)} EV/ha — presión sobre el pasto`,
      impacto: `Alta carga reduce oferta efectiva − ${Math.round((cargaEV_ha-0.8)*100/cargaEV_ha)}% vs carga óptima`,
      solucion: "Ajustar carga antes del invierno — descargar potreros o anticipar destetes. La reducción de carga es la medida de mayor impacto en sistemas extensivos.",
      cuandoActuar: "Abril–Mayo — antes del invierno",
      mesAccion: 4, categoria: "Forraje",
    });
  }

  // ── SAL MINERAL BASE ──────────────────────────────────────────
  añadir({
    id: "sal_mineral", prioridad: "P3", icono: "🧂",
    titulo: "Sal mineral base — todo el año",
    impacto: "Deficiencias subclínicas endémicas en NEA/NOA. Base para que funcionen todos los demás planes.",
    solucion: "30–50 g sal + mineral Ca/P/Mg/Zn/Se a libre acceso. Ininterrumpido.",
    cuandoActuar: "Siempre", mesAccion: mesHoy, categoria: "Nutrición",
  });

  // ── SANIDAD PROGRAMABLE ───────────────────────────────────────
  (sanidad?.tareas || []).filter(t => t.urgencia === "PROGRAMAR").forEach(t => {
    añadir({
      id: `san_prog_${t.vacuna}`, prioridad: "P2", icono: "💉",
      titulo: t.vacuna, impacto: t.porque || "",
      solucion: t.instruccion, cuandoActuar: t.fecha || "Próximo mes",
      mesAccion: mesHoy, categoria: "Sanidad",
    });
  });

  // ── ORDENAR POR PRIORIDAD + MES DE ACCIÓN ─────────────────────
  const priOrd = { URGENTE:0, P1:1, P2:2, P3:3 };
  limitantes.sort((a, b) => {
    const pa = priOrd[a.prioridad] ?? 4, pb = priOrd[b.prioridad] ?? 4;
    if (pa !== pb) return pa - pb;
    const da = ((a.mesAccion ?? 12) - mesHoy + 12) % 12;
    const db = ((b.mesAccion ?? 12) - mesHoy + 12) % 12;
    return da - db;
  });

  // ── DIAGNÓSTICO DE SUSTENTABILIDAD ────────────────────────────
  const puntosP1 = limitantes.filter(l => l.prioridad === "URGENTE" || l.prioridad === "P1");
  const puedeAlcanzarMeta = prenezEst >= META_PRENEZ && mesesDeficit === 0 && puntosP1.length === 0;

  const factoresLimitantes = [];
  if (ppLimCC > 0)      factoresLimitantes.push(`CC serv. ${ccServ.toFixed(1)} — −${ppLimCC}pp preñez`);
  if (ppLimBalance > 0) factoresLimitantes.push(`Déficit ${mesesDeficit}/3 meses inv. — erosiona CC ${erosionCCAnual.toFixed(1)}/año`);
  if (ppLimToros > 0)   factoresLimitantes.push(`Toros CC ${ccToros.toFixed(1)} — −${ppLimToros}pp preñez`);
  if (ppLimAgua > 0)    factoresLimitantes.push(`Agua sal. −${Math.round(reduccionDMI)}% consumo — −${ppLimAgua}pp`);
  if (ppLimSanidad > 0) factoresLimitantes.push(`Sanidad incompleta — −${ppLimSanidad}pp`);
  if (campoSeco)        factoresLimitantes.push(`Campo seco hoy (NDVI ${ndviHoy?.toFixed(2)}) — oferta reducida`);

  const colorDx = puedeAlcanzarMeta ? "#7ec850"
    : factoresLimitantes.length >= 3  ? "#e05530"
    : factoresLimitantes.length >= 1  ? "#e8a030"
    : "#4a9fd4";

  const resumenDx = puedeAlcanzarMeta
    ? `Sistema en condición de sostener ≥${META_PRENEZ}% preñez. Monitorear CC en agosto.`
    : ciclosAlColapso
    ? `Sin corrección: en ${ciclosAlColapso} ciclo${ciclosAlColapso>1?"s":""} la CC cae a 3.5 y la preñez colapsa. ${factoresLimitantes.length} factor${factoresLimitantes.length>1?"es":""}  limitante${factoresLimitantes.length>1?"s":""} activo${factoresLimitantes.length>1?"s":""}.`
    : `Con los recursos actuales, el sistema no puede mantener ≥${META_PRENEZ}% preñez. ${factoresLimitantes.length} limitante${factoresLimitantes.length>1?"s":""} identificado${factoresLimitantes.length>1?"s":""}.`;

  const diagnosticoSustentabilidad = {
    color: colorDx, resumen: resumenDx,
    factoresLimitantes, prenezSustentable, esSustentable,
    ciclosAlColapso, erosionCCAnual,
    puedeAlcanzarMeta,
  };

  // ── PÁRRAFO EJECUTIVO ─────────────────────────────────────────
  const parrafo = (() => {
    if (!ccPondVal && !prenezEst) return "Cargá los datos del rodeo para ver el diagnóstico completo.";
    if (puedeAlcanzarMeta) return `Sistema en condición. CC al servicio ${ccServ.toFixed(1)} → preñez ${prenezEst}%. Sin déficit invernales. Monitorear CC agosto.`;
    const partes = [];
    if (ccServ > 0 && ccServ < 4.5) partes.push(`CC serv. ${ccServ.toFixed(1)} → preñez ${prenezEst}% (gap −${GAP_PRENEZ}pp)`);
    if (mesesDeficit > 0) partes.push(`déficit ${mesesDeficit} mes${mesesDeficit>1?"es":""} invernal erosiona CC`);
    if (hayVaq1 && !vaq1Llega) partes.push(`vaq1 GDP ${gdpVaq1Real} g/d — no llega al entore`);
    if (ciclosAlColapso) partes.push(`${ciclosAlColapso} ciclo${ciclosAlColapso>1?"s":""} al colapso sin corrección`);
    return (partes.join(". ") || "Limitantes identificados") + ". " +
      (puntosP1.length > 0 ? `${puntosP1.length} acción${puntosP1.length>1?"es":""} crítica${puntosP1.length>1?"s":""} requieren atención antes del servicio.` : "");
  })();

  // ── FASE DEL CICLO ─────────────────────────────────────────────
  let faseCiclo = null;
  try { faseCiclo = calcFaseCiclo(cadena, form, { mesHoy, ccServ, prenezEst, mesesDeficit }); } catch(e) {}

  // ── CONTEXTO CLIMÁTICO ─────────────────────────────────────────
  const contextoClima = { ndvi:ndviHoy, temp:tempHoy, p30:p30Hoy, enso:ensoHoy, alertaSat, campoSeco, campoExcelente, callorExtremo, faltaAgua };

  // ── CALENDARIO DE ACCIONES para el cronograma SVG ─────────────
  const cp     = { URGENTE:"#e05530", P1:"#e8a030", P2:"#4a9fd4", P3:"#888" };
  const hitos  = [
    mesParto  !== null && { mes:mesParto,  label:"Parto",    icono:"🐄", color:"#7ec850" },
    mesDestR  !== null && { mes:mesDestR,  label:"Destete",  icono:"🍼", color:"#e8a030" },
    mesServR  !== null && { mes:mesServR,  label:"Servicio", icono:"🐂", color:"#4a9fd4" },
  ].filter(Boolean);
  const eventos = limitantes
    .filter(l => l.mesAccion !== undefined && l.mesAccion !== null)
    .map(l => ({
      id:l.id, label:l.titulo, icono:l.icono,
      mesIni:l.mesAccion, mesFin:l.mesAccion,
      prioridad:l.prioridad, color:cp[l.prioridad]||"#888",
      que:l.solucion, impacto:l.impacto, cuandoActuar:l.cuandoActuar,
    }));

  // ── RESUMEN NUMÉRICO ───────────────────────────────────────────
  const ternerosBase = Math.round(nVacasN * (prenezEst / 100) * 0.95);
  const prenezPot    = Math.min(93, prenezEst + (ppGanadosCC||0));
  const ternerosPot  = Math.round(nVacasN * (prenezPot / 100) * 0.95);
  const ternerosDif  = Math.max(0, ternerosPot - ternerosBase);
  const iniServDate  = cadena?.ini || null;
  const fmtFechaCorta = (d) => d ? new Date(d).toLocaleDateString("es-AR",{day:"2-digit",month:"short"}) : null;

  // ── CAPA 8: ANÁLISIS DE OPTIMIZACIÓN PARA SISTEMAS BUENOS ──────
  // Cuando puedeAlcanzarMeta = true, el análisis no termina — busca el margen
  const optimizacion = puedeAlcanzarMeta || prenezEst >= 70
    ? analizarMargenOptimizacion(form, motor, tray, null)
    : { oportunidades: [], hayOportunidades: false, parrafoOptim: "" };

  return {
    parrafo: optimizacion.hayOportunidades && puedeAlcanzarMeta
      ? optimizacion.parrafoOptim
      : parrafo,
    tarjetas: puedeAlcanzarMeta
      ? optimizacion.oportunidades.map(o => ({
          id: o.id, prioridad: o.potencia === "alta" ? "P1" : o.potencia === "media" ? "P2" : "P3",
          icono: "🎯", titulo: o.titulo, impacto: o.impacto,
          solucion: o.accion, cuandoActuar: "", categoria: "Optimización",
          cuantifica: o.referencia || "",
        }))
      : limitantes,
    tarjetasOptim: optimizacion.oportunidades,
    limitantes,
    contextoClima, alertaSat,
    campoSeco, campoExcelente, callorExtremo, faltaAgua,
    cronograma, diagnosticoSustentabilidad,
    calendarioAcciones: { eventos, hitos, mesServR, mesParto, mesDestR },
    faseCiclo,
    resumen: {
      ternerosBase, ternerosPot, ternerosDif,
      prenez: prenezEst, prenezPot: Math.round(prenezPot),
      ccServ, diasHastaServ,
      iniServDate: iniServDate ? fmtFechaCorta(iniServDate) : null,
      metaPrenez: META_PRENEZ, gapPrenez: GAP_PRENEZ,
      puedeAlcanzarMeta, ciclosAlColapso,
    },
  };
}

const SYS_FULL = `Sos el cerebro de Calf AI, sistema de diagnostico para cria bovina extensiva NEA/NOA/Paraguay.

Recibes datos en 4 secciones: datos cargados, balance y brechas, escenarios con mejoras, sanidad.

REGLAS BIOLOGICAS FIJAS:
- CC parto minima: 5.5 (Peruchena 2003). Debajo: parto comprometido.
- CC servicio minima: 4.5 => 80% prenez. Debajo: anestro profundo.
- Vaquillona 1 inv: GDP minimo 400g/dia. Si no llega es IRREVERSIBLE.
- Vaquillona 2 inv: PV minimo 75% PV adulto al entore. Flushing 25d pre-servicio: SIEMPRE.
- V2S: hiperprecoz si CC < 4.0. Requerimiento +10% vs adulta (NRC 2000).
- Anestro maximo 55d para llegar al servicio.

ORDEN DE PRIORIDADES:
1. Destete ANTES que cualquier suplemento a la vaca adulta. Siempre.
2. V2S es la categoria mas critica: crecimiento + lactacion + gestacion simultaneos.
3. Vaquillona 1 inv: irreversible si no se actua ese invierno.
4. Balance invernal: el deficit erosiona CC ciclo a ciclo.
5. Sanidad: techo del sistema.

ESTRUCTURA TU RESPUESTA USANDO ESTOS MARCADORES EXACTOS (cada marcador en linea propia, seguido del contenido del bloque):

1️⃣ DIAGNÓSTICO INTEGRADO
Una causa raiz con numero. Cadena causal con datos reales: clima/NDVI -> oferta -> balance -> CC -> anestro -> prenez. Por que no se puede llegar al objetivo sin correccion.

2️⃣ PUNTOS CRÍTICOS
Cuantos pp de prenez afecta cada uno. Cuando actuar. Destete primero siempre.

3️⃣ ESCENARIOS DE MEJORA
Balance con mejoras aplicadas. Prenez actual -> prenez con correccion -> terneros adicionales. CUANTIFICAR siempre: terneros ganados con cada intervencion especifica.

4️⃣ PLAN DE ACCIÓN
Que, cuando exactamente, en que orden. Sin insumos especificos salvo que esten en los datos cargados.

BIBLIOTECA BIBLIOGRAFICA ANCLADA (citas con respaldo formal en el sistema):
${bibliotecaParaPrompt()}

REGLAS DE CITACION EN TU RESPUESTA:
- Cita SOLO cuando justificas un numero, un umbral, una relacion causa-efecto. No cites para afirmaciones genericas.
- Formato corto inline: (Autor año). Ejemplo: "CC 4.0 -> 70% prenez (Selk 1988)".
- Cada recomendacion importante debe tener al menos una cita que la fundamente.
- Si la cita esta en la BIBLIOTECA BIBLIOGRAFICA ANCLADA de arriba, usala directamente.
- Si necesitas citar un autor que NO esta en la biblioteca anclada pero es pertinente (ej. Bavera, Chenoweth, Wiltbank, etc.), podes hacerlo, pero marcalo agregando [no anclada] al lado. Ejemplo: "Wiltbank 1990 [no anclada]".
- Si el dato tiene respaldo en Rosello et al. 2025 (paper de los autores del sistema), preferi citarlo porque es la referencia mas especifica para NEA.
- Podes citar varias fuentes juntas cuando se refuerzan: "(Selk 1988; Peruchena 2003)".

BLOQUE OBLIGATORIO AL FINAL DE TU RESPUESTA:
Agrega una seccion titulada "REFERENCIAS BIBLIOGRAFICAS" con este formato exacto:

REFERENCIAS BIBLIOGRAFICAS

🔬 Revistas cientificas con referato:
[listar aqui las citas N1 que usaste, formato: Autor et al. año. Titulo abreviado. Revista volumen:pagina.]

📘 Guias tecnicas internacionales:
[listar las N2 que usaste]

📗 Publicaciones institucionales con ISSN:
[listar las N3 que usaste]

📙 Libros y divulgacion tecnica:
[listar las N4 que usaste]

Referencias complementarias no ancladas en el sistema (usadas por razonamiento tecnico):
[listar las que marcaste con [no anclada]]

Si no usaste citas de un nivel, omiti esa seccion. Si no usaste ninguna cita no anclada, omiti el ultimo bloque.
Parrafos cortos y directos. El tecnico ya sabe ganaderia. Sin listas.
`;


function buildPromptFull(motor, form, sat, cerebro_data, potreros = []) {
  const MC = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const hoy = new Date();
  const mesHoy = hoy.getMonth();
  const bm = motor?.balanceMensual || [];
  const tray = motor?.tray;
  const nVacas = motor?.nVacas || 0;
  const pvAdulto = parseFloat(form?.pvVacaAdulta) || 380;

  const diasAlServ = motor?.cadena?.ini
    ? Math.max(0, Math.round((new Date(motor.cadena.ini) - hoy) / 86400000))
    : null;
  const ventana = diasAlServ === null ? "sin fechas" :
    diasAlServ < 30 ? "CRITICA" : diasAlServ < 60 ? "URGENTE" :
    diasAlServ < 120 ? "IMPORTANTE" : "AMPLIA";

  const defInv = [5,6,7].map(i => bm[i]).filter(m => m?.balance < 0);
  const defAcum = defInv.reduce((s,m) => s + Math.abs(m?.balance||0), 0);

  const ccParto     = tray?.ccParto     || 0;
  const ccServ      = tray?.ccServ      || 0;
  const ccServAntic = tray?.ccServAntic || 0;
  const ccServHiper = tray?.ccServHiper || 0;
  const prenez      = tray?.pr          || 0;
  const prAntic     = tray?.prAntic     || 0;
  const prHiper     = tray?.prHiper     || 0;
  const anestro     = tray?.anestro?.dias || 0;
  const v1gdp   = motor?.vaq1E?.gdpReal || 0;
  const v1pvSal = motor?.pvSalidaVaq1   || 0;
  const v1obj   = Math.round(pvAdulto * 0.40);
  const v2pvEnt = motor?.vaq2E?.pvEntore || 0;
  const v2obj   = Math.round(pvAdulto * 0.75);
  const v2ok    = motor?.vaq2E?.llegas ?? (v2pvEnt >= v2obj);

  const lines = [];

  lines.push("=== PASO 1: DATOS ===");
  lines.push("Estab: " + (form?.nombreProductor||"sin nombre") + " | " + [form?.localidad,form?.provincia,form?.pais].filter(Boolean).join(", "));
  lines.push("Biotipo: " + (form?.biotipo||"ND") + " | Vacas: " + nVacas + " | V2S: " + (motor?.nV2s||0) + " | PV: " + pvAdulto + "kg | Ha: " + (form?.supHa||"ND") + " | Carga: " + (motor?.cargaEV_ha?.toFixed(2)||"ND") + " EV/ha");
  lines.push("Servicio: " + (form?.iniServ||"sin fecha") + " a " + (form?.finServ||"sin fecha") + " | Dias al serv: " + (diasAlServ!==null?diasAlServ+"d":"ND") + " | Ventana: " + ventana);
  lines.push("Destete: Trad " + (form?.destTrad||0) + "% | Antic " + (form?.destAntic||0) + "% | Hiper " + (form?.destHiper||0) + "%");
  lines.push("");

  const dist = form?.distribucionCC || [];
  lines.push("CC RODEO HOY:");
  if (dist.some(d => parseFloat(d.pct) > 0)) {
    dist.filter(d => parseFloat(d.pct) > 0).forEach(d => lines.push("  CC " + d.cc + ": " + d.pct + "%"));
    lines.push("  CC ponderada: " + (motor?.ccPondVal?.toFixed(2)||"0"));
  } else {
    lines.push("  SIN DATOS DE CC — campo critico sin completar");
  }
  if (form?.ccAnterior) lines.push("  CC anterior: " + form.ccAnterior + " (fecha: " + (form.fechaCCAnterior||"ND") + ")");
  lines.push("");

  lines.push("CAMPO Y CLIMA:");
  lines.push("Vegetacion: " + (form?.vegetacion||"ND") + " | Fenologia: " + (form?.fenologia||"ND") + " | PB pasto: " + ({menor_10:"12%","10_25":"9%","25_50":"6%",mayor_50:"4%"}[form?.fenologia]||"ND"));
  if (sat?.ndvi) {
    lines.push("NDVI: " + sat.ndvi + " (" + (sat.condForr||"ND") + ") | Temp: " + sat.temp + "C | Lluvia 30d: " + (sat.p30||"ND") + "mm");
    const pronostico = [];
    if (sat.lluviaProx7 !== undefined) pronostico.push("lluvia 7d: " + sat.lluviaProx7 + "mm");
    if (sat.tempMediaProx7 !== undefined) pronostico.push("temp media 7d: " + sat.tempMediaProx7 + "C");
    if (sat.helada7) pronostico.push("ALERTA HELADA próximos 7 días");
    if (pronostico.length) lines.push("Pronóstico: " + pronostico.join(" | "));
  } else {
    lines.push("NDVI: sin datos satelitales");
  }
  lines.push("ENSO: " + (form?.enso||"neutro"));
  if (form?.aguaTDS) lines.push("Agua: TDS " + form.aguaTDS + "mg/L | tipo: " + (form?.aguaTipoSal||"mixto") + " | impacto DMI: -" + Math.round(motor?.evalAgua?.pctReducDMI||0) + "%");
  lines.push("");

  // Potreros individuales
  const FENOL_NOM = {menor_10:"<10% flor PB>10%", "10_25":"10-25% flor PB 9%", "25_50":"25-50% PB 6%", mayor_50:">50% PB 4%"};
  if (potreros && potreros.filter(p => p.ha || p.veg).length > 0) {
    const haTotal = potreros.reduce((s,p) => s + (parseFloat(p.ha)||0), 0);
    lines.push("POTREROS (" + potreros.length + " lotes | " + haTotal + "ha total):");
    potreros.filter(p => p.ha || p.veg).forEach((p, i) => {
      const fenol = FENOL_NOM[p.fenol] || "";
      const alt   = p.altPasto ? " | " + p.altPasto + "cm altura" : "";
      lines.push("  P" + (i+1) + ": " + (p.ha||"?") + "ha | " + (p.veg||"Pastizal natural") + (fenol?" | "+fenol:"") + alt);
    });
    lines.push("");
  }

  const MC_SUPL = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const suplMesNom = (form?.suplMeses||["5","6","7"]).map(m => MC_SUPL[Number(m)]||m).join("-");
  lines.push("SUPLEMENTACION (meses: " + suplMesNom + "):");
  const supls = [
    ["V2S",    form?.supl_v2s,    form?.dosis_v2s,    form?.supl2_v2s,    form?.dosis2_v2s],
    ["Toros",  form?.supl_toros,  form?.dosis_toros,  form?.supl2_toros,  form?.dosis2_toros],
    ["Vaq1",   form?.supl_vaq1,   form?.dosis_vaq1,   form?.supl2_vaq1,   form?.dosis2_vaq1],
    ["Vaq2",   form?.supl_vaq2,   form?.dosis_vaq2,   form?.supl2_vaq2,   form?.dosis2_vaq2],
    ["Ternero",form?.supl_ternero,form?.dosis_ternero,null,               null],
  ].filter(([,s]) => s);
  if (supls.length > 0) {
    supls.forEach(([cat, s1, d1, s2, d2]) => {
      let line = "  " + cat + ": " + s1 + " " + (parseFloat(d1)||0) + "kg/d";
      if (s2 && parseFloat(d2||0) > 0) line += " + " + s2 + " " + d2 + "kg/d";
      lines.push(line);
    });
  } else {
    lines.push("  SIN SUPLEMENTACION CARGADA — ver impacto en las brechas de vaquillona y CC");
  }
  if (form?.tieneVerdeo==="si") lines.push("  Verdeo: " + (form?.verdeoTipo||"ND") + " " + (form?.verdeoHa||"ND") + "ha -> " + (form?.verdeoDestinoVaq==="si"?"vaquillona 1° inv":"rodeo general"));
  lines.push("");

  lines.push("=== PASO 2: BALANCE Y BRECHAS ===");
  bm.forEach(m => {
    const bal = Math.round(m.balance||0);
    const inv = [5,6,7].includes(m.i)?"[INV]":"";
    const hito = m.esParto?"[PARTO]":m.esServIni?"[SERV]":m.esDestete?"[DEST]":"";
    lines.push(MC[m.i]+": "+(bal>=0?"+":"")+bal+" Mcal | pasto:"+Math.round(m.ofPastoTotal||0)+" cc:"+Math.round(m.ccAporte||0)+" supl:"+Math.round(m.suplAporte||0)+" dem:"+Math.round(m.demanda||0)+" "+inv+" "+hito);
  });
  lines.push("");
  if (defInv.length > 0) {
    lines.push("DEFICIT JUN-AGO: " + defInv.map(m=>MC[m.i]+" "+Math.round(m.balance)+"Mcal").join(" | "));
    lines.push("Acumulado: " + Math.round(defAcum) + " Mcal = " + (nVacas>0?(defAcum/nVacas/5.6).toFixed(1):"ND") + " puntos CC movilizados/vaca sin correccion");
  } else { lines.push("BALANCE INVERNAL: sin deficit OK"); }
  lines.push("");

  lines.push("BRECHAS BIOLOGICAS:");
  if (ccParto>0) lines.push("CC parto: " + ccParto.toFixed(2) + (ccParto<5.5?" BRECHA "+(5.5-ccParto).toFixed(2)+" (min 5.5)":" OK"));
  if (ccServ>0) lines.push("CC serv: " + ccServ.toFixed(2) + " => " + prenez + "%" + (ccServ<4.5?" BRECHA "+(4.5-ccServ).toFixed(2):" OK"));
  if (anestro>0) lines.push("Anestro: " + anestro + "d" + (anestro>55?" BRECHA "+(anestro-55)+"d extra":" OK"));
  if (v1gdp>0) lines.push("Vaq1 GDP: " + v1gdp + "g/d" + (v1gdp<400?" BRECHA "+(400-v1gdp)+"g/d IRREVERSIBLE — ese invierno no se repite":" OK"));
  if (v1pvSal>0) lines.push("Vaq1 PV salida: " + v1pvSal + "kg / obj " + v1obj + "kg" + (v1pvSal<v1obj?" BRECHA "+(v1obj-v1pvSal)+"kg":" OK"));
  if (v2pvEnt>0) lines.push("Vaq2 PV entore: " + v2pvEnt + "kg / min " + v2obj + "kg " + (v2ok?"OK":"NO LLEGA — falta "+(v2obj-v2pvEnt)+"kg") + " | Flushing 25d: siempre sin excepcion");
  // Escenarios de destete precalculados
  if (prAntic > prenez) lines.push("Escenario DESTETE ANTICIPADO (90d): CC serv " + ccServAntic.toFixed(2) + " → preñez " + prAntic + "% (+" + (prAntic - prenez) + "pp sobre actual)");
  if (prHiper > prenez) lines.push("Escenario DESTETE HIPERPRECOZ (50d): CC serv " + ccServHiper.toFixed(2) + " → preñez " + prHiper + "% (+" + (prHiper - prenez) + "pp sobre actual)");
  lines.push("");

  // Vaquillona detalle completo
  if (motor?.vaq1E && !motor.vaq1E.mensaje) {
    lines.push("VAQ 1 INV: entrada " + (motor.pvEntVaq1||"ND") + "kg | GDP pasto " + (motor.vaq1E.gdpPasto||0) + "g/d | con supl " + (motor.vaq1E.gdpReal||0) + "g/d | salida " + v1pvSal + "kg / obj " + v1obj + "kg " + (v1pvSal>=v1obj?"OK":"DEFICIT "+(v1obj-v1pvSal)+"kg IRREVERSIBLE"));
  }
  if (motor?.vaq2E) {
    lines.push("VAQ 2 INV: entrada mayo " + (motor.pvEntradaVaq2||"ND") + "kg | entore " + v2pvEnt + "kg / min " + v2obj + "kg " + (v2ok?"OK":"NO LLEGA") + " | FLUSHING 25d previo al servicio: siempre sin excepcion");
  }
  lines.push("");

  lines.push("SANIDAD: Aftosa " + (form?.sanAftosa==="si"?"OK":"SIN VACUNA") + " | Brucelosis " + (form?.sanBrucelosis==="si"?"OK":"SIN VACUNA") + " | IBR/DVB " + (form?.sanVacunas==="si"?"OK":"SIN") + " | Toros " + (form?.sanToros==="con_control"?"OK":"SIN revision andrologica") + (form?.torosCC?" | CC toros "+form.torosCC:"") + " | Parasitos ext " + (form?.sanParasitoExt||"ND") + " | int " + (form?.sanParasitoInt||"ND"));
  if (form?.sanAbortos==="si") lines.push("ABORTOS REGISTRADOS: requiere diagnostico diferencial urgente");
  lines.push("");

  // Análisis pre-calculado por calcCerebro
  if (cerebro_data) {
    const cx = cerebro_data;
    lines.push("=== ANALISIS PRE-CALCULADO ===");

    // Diagnóstico de sustentabilidad
    if (cx.diagnosticoSustentabilidad?.resumen) lines.push("Diagnostico sustentabilidad: " + cx.diagnosticoSustentabilidad.resumen);
    if (cx.diagnosticoSustentabilidad?.factoresLimitantes?.length > 0) {
      lines.push("Factores limitantes: " + cx.diagnosticoSustentabilidad.factoresLimitantes.join(" | "));
    }

    // Resumen cuantitativo
    if (cx.resumen) {
      const r = cx.resumen;
      lines.push("Terneros base: " + r.ternerosBase + " | Con correcciones: " + r.ternerosPot + " | Ganancia potencial: +" + r.ternerosDif + " terneros");
      if (r.prenezPot > r.prenez) lines.push("Prenez actual: " + r.prenez + "% → potencial con mejoras: " + r.prenezPot + "% | Gap: " + r.gapPrenez + "pp");
      if (r.ciclosAlColapso) lines.push("ALERTA: sin correccion en " + r.ciclosAlColapso + " ciclo" + (r.ciclosAlColapso > 1 ? "s" : "") + " la CC al servicio llega a 3.5 y la prenez colapsa");
      if (r.puedeAlcanzarMeta !== undefined) lines.push("Puede alcanzar meta 75% prenez: " + (r.puedeAlcanzarMeta ? "SI" : "NO con intervencion simple"));
    }

    // Limitantes completos con impacto y solución
    const limitantes = cx.limitantes || [];
    if (limitantes.length > 0) {
      lines.push("LIMITANTES JERARQUIZADOS:");
      limitantes.slice(0, 5).forEach((t, i) => {
        const impact = t.impacto || t.cuantifica || "";
        const sol    = t.solucion || "";
        lines.push("  " + (i+1) + ". [" + (t.prioridad||"") + "] " + t.titulo + (impact ? " — " + impact : "") + (sol ? " → " + sol : ""));
      });
    }

    // Contexto climático
    if (cx.campoSeco)     lines.push("ALERTA CLIMATICA: campo seco — impacto en oferta forrajera y consumo voluntario");
    if (cx.callorExtremo) lines.push("ALERTA CLIMATICA: calor extremo — deprime consumo y fertilidad (NRC 2000)");
    if (cx.faltaAgua)     lines.push("ALERTA AGUA: TDS critico — reduccion DMI confirmada");

    lines.push("");
  }

  // Consulta específica del productor — máxima prioridad de respuesta
  if (form?.consultaEspecifica && form.consultaEspecifica.trim()) {
    lines.push("=== CONSULTA ESPECÍFICA DEL PRODUCTOR ===");
    lines.push(form.consultaEspecifica.trim());
    lines.push("→ Responder esta pregunta puntual en el bloque 4️⃣ PLAN DE ACCIÓN (o en el diagnóstico si es una duda técnica). Usar datos del sistema para fundamentarla.");
    lines.push("");
  }

  lines.push("=== INSTRUCCION ===");
  lines.push("Responder usando los marcadores EXACTOS: 1️⃣ DIAGNÓSTICO INTEGRADO / 2️⃣ PUNTOS CRÍTICOS / 3️⃣ ESCENARIOS DE MEJORA / 4️⃣ PLAN DE ACCIÓN");
  lines.push("Usar TODOS los datos del establecimiento cargados arriba — no inventar datos ausentes.");
  lines.push("En escenarios: cuantificar terneros adicionales con cada intervencion concreta. Usar los escenarios de destete precalculados si aplican.");
  lines.push("Prioridad biologica: destete antes que suplemento. V2S categoria separada. Vaq1 irreversible.");

  return lines.join("\n");
}

// ─── Helper: retorna SYS_FULL con la biblioteca actual inyectada ───
// Se usa desde buildPromptFull() o desde el endpoint de analisis.
function getSysFull() {
  // SYS_FULL es un template literal ya evaluado con la biblioteca embebida.
  // Esta funcion existe para centralizar el acceso si en el futuro queremos
  // inyectar dinamicamente mas contexto (estado del rodeo, alertas P1, etc.).
  return SYS_FULL;
}

export {
  interpretarRecursoForrajero, interpretarCCEnTiempo,
  interpretarSuplementacion, interpretarVerdeo,
  interpretarSanidadReproductiva, interpretarEficienciaReproductiva,
  interpretarAgua, interpretarMomentoOptimo,
  interpretarAmplitudParicion, interpretarSistemaCompleto,
  analizarMargenOptimizacion, calcCerebro,
  SYS_FULL, buildPromptFull, getSysFull,
};
