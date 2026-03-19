09:52:59.597 Running build in Washington, D.C., USA (East) – iad1
09:52:59.598 Build machine configuration: 2 cores, 8 GB
09:52:59.722 Cloning github.com/joseemiliorosello-cmyk/agromind-pro (Branch: main, Commit: 9e8a2f8)
09:53:01.295 Cloning completed: 1.573s
09:53:01.470 Restored build cache from previous deployment (HYNXvTd3U2DNZKccjJztvRWUeKZu)
09:53:01.801 Running "vercel build"
09:53:02.432 Vercel CLI 50.32.4
09:53:02.766 Installing dependencies...
09:53:05.424 
09:53:05.425 up to date in 2s
09:53:05.426 
09:53:05.426 7 packages are looking for funding
09:53:05.427   run `npm fund` for details
09:53:05.455 Detected Next.js version: 14.0.0
09:53:05.458 Running "npm run build"
09:53:05.558 
09:53:05.559 > agromind-pro@1.0.0 build
09:53:05.559 > next build
09:53:05.559 
09:53:06.183    Linting and checking validity of types ...
09:53:06.301    ▲ Next.js 14.0.0
09:53:06.301 
09:53:06.301    Creating an optimized production build ...
09:53:08.904 Failed to compile.
09:53:08.905 
09:53:08.906 ./lib/motor.js
09:53:08.906 Error: 
09:53:08.906   [31mx[0m the name `PROD_BASE` is defined multiple times
09:53:08.906     ,-[[36;1;4m/vercel/path0/lib/motor.js[0m:8:1]
09:53:08.907  [2m 8[0m | //           from "../lib/motor"
09:53:08.907  [2m 9[0m | // ═══════════════════════════════════════════════════════════════════
09:53:08.907  [2m10[0m | 
09:53:08.908  [2m11[0m | import { BIOTIPOS, getBiotipo, SUPLEMENTOS, PROD_BASE,
09:53:08.908     : [31;1m                                            ^^^^|^^^^[0m
09:53:08.908     :                                                 [31;1m`-- [31;1mprevious definition of `PROD_BASE` here[0m[0m
09:53:08.909  [2m12[0m |          CALIDAD_C4_CALIBRADA, ccPond, MESES_NOM, FORM_DEF } from "./constantes";
09:53:08.909  [2m13[0m | import React, { useState, useEffect } from "react";
09:53:08.909  [2m14[0m | 
09:53:08.909  [2m15[0m | // ─── HELPERS DE MOTOR (getSupl, factores, clima) ─────────────────
09:53:08.910  [2m16[0m | const getSupl = (k) => SUPLEMENTOS[k] || SUPLEMENTOS["Expeller girasol"];
09:53:08.910  [2m17[0m | 
09:53:08.910  [2m18[0m | // ─── PRODUCCIÓN BASE FORRAJERA ────────────────────────────────────
09:53:08.910  [2m19[0m | const PROD_BASE = {
09:53:08.911     : [33;1m      ^^^^|^^^^[0m
09:53:08.911     :           [33;1m`-- [33;1m`PROD_BASE` redefined here[0m[0m
09:53:08.911  [2m20[0m |   "Pastizal natural NEA/Chaco":                   14,
09:53:08.911  [2m21[0m |   "Megatérmicas C4 (gatton panic, brachiaria)":   22,
09:53:08.912  [2m22[0m |   "Pasturas templadas C3":                         16,
09:53:08.912     `----
09:53:08.912 
09:53:08.912   [31mx[0m the name `HELADAS_PROV` is defined multiple times
09:53:08.912       ,-[[36;1;4m/vercel/path0/lib/motor.js[0m:36:1]
09:53:08.913  [2m  36[0m | // ─── OFERTA MENSUAL CON VARIACIÓN ESTACIONAL ──────────────────────
09:53:08.913  [2m  37[0m | // La oferta NO es plana: colapsa en invierno (T<15°C en gramíneas C4)
09:53:08.913  [2m  38[0m | 
09:53:08.913  [2m  39[0m | const HELADAS_PROV = {
09:53:08.914       : [31;1m      ^^^^^^|^^^^^[0m
09:53:08.914       :             [31;1m`-- [31;1mprevious definition of `HELADAS_PROV` here[0m[0m
09:53:08.914  [2m  40[0m |   "Formosa":{dia:15,mes:5},"Chaco":{dia:1,mes:5},"Corrientes":{dia:1,mes:5},
09:53:08.915  [2m  41[0m |   "Misiones":{dia:20,mes:4},"Entre Ríos":{dia:10,mes:4},"Santa Fe":{dia:10,mes:4},
09:53:08.915  [2m  42[0m |   "Santiago del Estero":{dia:25,mes:4},"Salta":{dia:15,mes:5},
09:53:08.915  [2m  43[0m |   "Buenos Aires":{dia:15,mes:4},"Córdoba":{dia:10,mes:4},"La Pampa":{dia:20,mes:3},
09:53:08.916  [2m  44[0m |   "Mendoza":{dia:1,mes:4},"Neuquén / Río Negro":{dia:1,mes:3},"Patagonia Sur":{dia:1,mes:2},
09:53:08.916  [2m  45[0m |   "Paraguay Oriental":{dia:15,mes:5},"Chaco Paraguayo":{dia:10,mes:5},
09:53:08.916  [2m  46[0m |   "Santa Cruz / Beni (BO)":{dia:1,mes:5},"Tarija / Chaco (BO)":{dia:20,mes:4},
09:53:08.916  [2m  47[0m |   "Mato Grosso do Sul (BR)":{dia:15,mes:5},"Mato Grosso / Goiás (BR)":{dia:10,mes:5},
09:53:08.917  [2m  48[0m |   "Rio Grande do Sul (BR)":{dia:1,mes:4},"Pantanal (BR)":{dia:20,mes:5},
09:53:08.917  [2m  49[0m | };
09:53:08.917  [2m  50[0m | 
09:53:08.918  [2m  51[0m | const CLIMA_HIST = {
09:53:08.918  [2m  52[0m |   "Corrientes":          [{t:28,p:130},{t:27,p:120},{t:25,p:110},{t:20,p:90},{t:16,p:70},{t:13,p:60},{t:13,p:55},{t:15,p:50},{t:18,p:80},{t:22,p:110},{t:25,p:120},{t:27,p:130}],
09:53:08.923  [2m  53[0m |   "Chaco":               [{t:29,p:120},{t:28,p:110},{t:26,p:110},{t:21,p:80},{t:16,p:60},{t:13,p:50},{t:13,p:45},{t:15,p:45},{t:19,p:70},{t:23,p:100},{t:26,p:110},{t:28,p:120}],
09:53:08.923  [2m  54[0m |   "Formosa":             [{t:30,p:120},{t:29,p:110},{t:27,p:110},{t:22,p:80},{t:17,p:55},{t:14,p:45},{t:14,p:40},{t:16,p:45},{t:20,p:70},{t:24,p:100},{t:27,p:110},{t:29,p:120}],
09:53:08.924  [2m  55[0m |   "Entre Ríos":          [{t:25,p:100},{t:24,p:90},{t:22,p:90},{t:17,p:70},{t:13,p:55},{t:10,p:45},{t:10,p:40},{t:12,p:45},{t:15,p:65},{t:19,p:90},{t:22,p:100},{t:24,p:100}],
09:53:08.924  [2m  56[0m |   "Santiago del Estero": [{t:28,p:90},{t:27,p:80},{t:25,p:80},{t:20,p:50},{t:15,p:30},{t:12,p:20},{t:12,p:15},{t:14,p:20},{t:18,p:40},{t:22,p:70},{t:25,p:80},{t:27,p:90}],
09:53:08.925  [2m  57[0m |   "Salta":               [{t:24,p:140},{t:23,p:130},{t:22,p:110},{t:17,p:50},{t:13,p:20},{t:10,p:10},{t:10,p:10},{t:12,p:15},{t:16,p:30},{t:20,p:70},{t:22,p:110},{t:23,p:130}],
09:53:08.925  [2m  58[0m |   "Buenos Aires":        [{t:24,p:90},{t:23,p:80},{t:21,p:90},{t:16,p:70},{t:12,p:55},{t:9,p:45},{t:9,p:40},{t:11,p:50},{t:13,p:65},{t:17,p:85},{t:20,p:90},{t:23,p:90}],
09:53:08.925  [2m  59[0m |   "Córdoba":             [{t:25,p:100},{t:24,p:90},{t:22,p:90},{t:17,p:60},{t:13,p:35},{t:10,p:25},{t:10,p:20},{t:12,p:25},{t:15,p:45},{t:19,p:75},{t:22,p:90},{t:24,p:100}],
09:53:08.926  [2m  60[0m |   "Santa Fe":            [{t:26,p:110},{t:25,p:100},{t:23,p:100},{t:18,p:70},{t:14,p:50},{t:11,p:40},{t:11,p:35},{t:13,p:40},{t:16,p:60},{t:20,p:90},{t:23,p:100},{t:25,p:110}],
09:53:08.926  [2m  61[0m |   "La Pampa":            [{t:24,p:80},{t:23,p:70},{t:21,p:75},{t:15,p:55},{t:11,p:38},{t:8,p:28},{t:8,p:25},{t:10,p:30},{t:13,p:48},{t:17,p:72},{t:20,p:78},{t:22,p:80}],
09:53:08.926  [2m  62[0m |   "Paraguay Oriental":   [{t:29,p:140},{t:29,p:130},{t:27,p:130},{t:22,p:100},{t:17,p:75},{t:14,p:60},{t:14,p:55},{t:16,p:55},{t:19,p:80},{t:23,p:110},{t:26,p:130},{t:28,p:140}],
09:53:08.927  [2m  63[0m |   "Chaco Paraguayo":     [{t:31,p:110},{t:30,p:100},{t:28,p:100},{t:23,p:70},{t:18,p:45},{t:15,p:35},{t:15,p:30},{t:17,p:35},{t:21,p:60},{t:25,p:90},{t:28,p:100},{t:30,p:110}],
09:53:08.927  [2m  64[0m |   "Mato Grosso do Sul (BR)":   [{t:27,p:180},{t:27,p:160},{t:26,p:120},{t:23,p:80},{t:19,p:50},{t:17,p:30},{t:17,p:25},{t:19,p:35},{t:22,p:70},{t:25,p:120},{t:26,p:150},{t:27,p:170}],
09:53:08.928  [2m  65[0m |   "Mato Grosso / Goiás (BR)":  [{t:26,p:220},{t:26,p:200},{t:25,p:160},{t:24,p:90},{t:22,p:35},{t:20,p:10},{t:20,p:8},{t:22,p:15},{t:24,p:60},{t:26,p:120},{t:26,p:180},{t:26,p:210}],
09:53:08.928  [2m  66[0m |   "Pantanal (BR)":             [{t:28,p:200},{t:28,p:180},{t:27,p:140},{t:25,p:80},{t:22,p:30},{t:20,p:10},{t:20,p:8},{t:21,p:20},{t:24,p:60},{t:26,p:110},{t:27,p:160},{t:28,p:190}],
09:53:08.928  [2m  67[0m | };
09:53:08.928  [2m  68[0m | const CLIMA_DEF = [{t:27,p:120},{t:26,p:110},{t:24,p:100},{t:20,p:80},{t:15,p:60},{t:12,p:50},{t:12,p:45},{t:14,p:50},{t:18,p:70},{t:22,p:95},{t:25,p:110},{t:26,p:120}];
09:53:08.928  [2m  69[0m | const getClima  = (prov) => CLIMA_HIST[prov] || CLIMA_DEF;
09:53:08.929  [2m  70[0m | 
09:53:08.929  [2m  71[0m | 
09:53:08.929  [2m  72[0m | function calcOfertaMensualArray(veg, ndvi, provincia, enso, fenolActual) {
09:53:08.929  [2m  73[0m |   const hist  = getClima(provincia || "Corrientes");
09:53:08.929  [2m  74[0m |   const pb    = PROD_BASE[veg] || 8;
09:53:08.929  [2m  75[0m |   const ndviN = parseFloat(ndvi) || 0.45;
09:53:08.929  [2m  76[0m |   const modE  = modENSO(enso);
09:53:08.929  [2m  77[0m |   const fenolMes = [
09:53:08.929  [2m  78[0m |     "menor_10","menor_10","10_25","10_25",
09:53:08.929  [2m  79[0m |     "25_50","mayor_50","mayor_50","mayor_50",
09:53:08.929  [2m  80[0m |     "25_50","10_25","menor_10","menor_10"
09:53:08.929  [2m  81[0m |   ];
09:53:08.929  [2m  82[0m |   return hist.map((m, i) => {
09:53:08.929  [2m  83[0m |     const t    = m.t || 20;
09:53:08.929  [2m  84[0m |     const p    = (m.p || 60) * modE;
09:53:08.929  [2m  85[0m |     const fenol= fenolMes[i];
09:53:08.929  [2m  86[0m |     const kgMs = Math.max(0,
09:53:08.929  [2m  87[0m |       pb * factorN(ndviN) * factorT(t) * factorP(p) * UTIL * fAprovFenol(fenol)
09:53:08.929  [2m  88[0m |     );
09:53:08.931  [2m  89[0m |     return +(kgMs * mcalKgAdj(t, fenol)).toFixed(2);
09:53:08.931  [2m  90[0m |   });
09:53:08.931  [2m  91[0m | }
09:53:08.931  [2m  92[0m | 
09:53:08.931  [2m  93[0m | const mcalKgAdj = (t, fenol) => {
09:53:08.931  [2m  94[0m |   const base = t>=25?2.10 : t>=20?1.90 : t>=15?1.50 : t>=10?1.00 : 0.65;
09:53:08.931  [2m  95[0m |   return base * ({menor_10:1.00,"10_25":0.95,"25_50":0.85,mayor_50:0.72}[fenol] || 1.00);
09:53:08.931  [2m  96[0m | };
09:53:08.931  [2m  97[0m | const fAprovFenol = (fenol) => ({menor_10:1.00,"10_25":0.90,"25_50":0.75,mayor_50:0.55}[fenol] || 1.00);
09:53:08.931  [2m  98[0m | const pbPasto     = (fenol) => ({menor_10:12, "10_25":9, "25_50":6, mayor_50:4}[fenol] || 10);
09:53:08.931  [2m  99[0m | 
09:53:08.931  [2m 100[0m | // ─── OFERTA FORRAJERA ─────────────────────────────────────────────
09:53:08.931  [2m 101[0m | function calcOfPasto(veg, ndvi, temp, precip, enso, fenol) {
09:53:08.931  [2m 102[0m |   const pb   = PROD_BASE[veg] || 8;
09:53:08.931  [2m 103[0m |   const kgMs = Math.max(0,
09:53:08.931  [2m 104[0m |     pb * factorN(ndvi) * factorT(temp) * factorP(precip * modENSO(enso)) * UTIL * fAprovFenol(fenol)
09:53:08.931  [2m 105[0m |   );
09:53:08.931  [2m 106[0m |   return kgMs * mcalKgAdj(temp, fenol);
09:53:08.932  [2m 107[0m | }
09:53:08.932  [2m 108[0m | 
09:53:08.932  [2m 109[0m | // ─── REQUERIMIENTOS ENERGÉTICOS ───────────────────────────────────
09:53:08.932  [2m 110[0m | // NRC 2000; Detmann/NASSEM 2010
09:53:08.932  [2m 111[0m | function reqEM(pv, cat, biotipo) {
09:53:08.932  [2m 112[0m |   const p = parseFloat(pv) || 0;
09:53:08.932  [2m 113[0m |   if (!p) return null;
09:53:08.932  [2m 114[0m |   const bFact = biotipo ? getBiotipo(biotipo).factReq : 1.0;
09:53:08.932  [2m 115[0m |   const f = {
09:53:08.932  [2m 116[0m |     "Gestación temprana (1–4 meses)":  1.15,
09:53:08.932  [2m 117[0m |     "Gestación media (5–7 meses)":     1.20,
09:53:08.932  [2m 118[0m |     "Preparto (último mes)":           1.35,
09:53:08.932  [2m 119[0m |     "Lactación con ternero al pie":    1.90,
09:53:08.932  [2m 120[0m |     "Vaca seca sin ternero":           1.00,
09:53:08.932  [2m 121[0m |     "Vaca 1° parto lactando":          2.10,
09:53:08.932  [2m 122[0m |     vaq1inv: 1.30,
09:53:08.932  [2m 123[0m |     vaq2inv: 1.20,
09:53:08.932  [2m 124[0m |   }[cat] || 1.10;
09:53:08.932  [2m 125[0m |   return +(Math.pow(p, 0.75) * 0.077 * f * bFact).toFixed(1);
09:53:08.932  [2m 126[0m | }
09:53:08.932  [2m 127[0m | 
09:53:08.932  [2m 128[0m | // ─── SINCRONÍA RUMINAL ────────────────────────────────────────────
09:53:08.932  [2m 129[0m | // Detmann/NASSEM 2010 — proteína degradable × energía fermentable
09:53:08.932  [2m 130[0m | function evaluarSincronia(fenolPasto, supl, dosisKg) {
09:53:08.932  [2m 131[0m |   if (!supl || !dosisKg) return null;
09:53:08.932  [2m 132[0m |   const s       = getSupl(supl);
09:53:08.932  [2m 133[0m |   const pbP     = pbPasto(fenolPasto);
09:53:08.932  [2m 134[0m |   const pbTotal = (pbP * 10 + s.pb * dosisKg) / (10 + dosisKg);
09:53:08.934  [2m 135[0m |   const emSuplTotal = s.em * dosisKg;
09:53:08.934  [2m 136[0m |   const warnings = [];
09:53:08.934  [2m 137[0m | 
09:53:08.934  [2m 138[0m |   if (supl === "Urea tamponada" && fenolPasto === "mayor_50") {
09:53:08.934  [2m 139[0m |     warnings.push({ nivel:"rojo", msg:"⚠️ RIESGO: Urea con pasto >50% floración — digestibilidad <55%. Energía fermentable insuficiente. Riesgo de intoxicación." });
09:53:08.934  [2m 140[0m |   }
09:53:08.934  [2m 141[0m |   if (supl === "Urea tamponada" && fenolPasto === "25_50") {
09:53:08.934  [2m 142[0m |     warnings.push({ nivel:"ambar", msg:"Urea con pasto 25–50% floración — monitorear consumo. Combinar con fuente energética (maíz/sorgo)." });
09:53:08.934  [2m 143[0m |   }
09:53:08.934  [2m 144[0m |   if (pbTotal < 8 && s.pb < 20) {
09:53:08.934  [2m 145[0m |     warnings.push({ nivel:"ambar", msg:`Proteína dietaria total estimada: ${pbTotal.toFixed(1)}% — por debajo del mínimo ruminal (8%). Aumentar dosis o cambiar fuente.` });
09:53:08.936  [2m 146[0m |   }
09:53:08.936  [2m 147[0m |   if (pbTotal > 18 && pbP > 10) {
09:53:08.936  [2m 148[0m |     warnings.push({ nivel:"info", msg:`PB total estimada: ${pbTotal.toFixed(1)}% — posible exceso. Evaluar reducir dosis o cambiar a fuente energética.` });
09:53:08.936  [2m 149[0m |   }
09:53:08.936  [2m 150[0m |   return {
09:53:08.936  [2m 151[0m |     pbTotal:    +pbTotal.toFixed(1),
09:53:08.943  [2m 152[0m |     emSupl:     +emSuplTotal.toFixed(1),
09:53:08.943  [2m 153[0m |     warnings,
09:53:08.943  [2m 154[0m |     eficiente:  warnings.filter(w => w.nivel === "rojo").length === 0,
09:53:08.943  [2m 155[0m |   };
09:53:08.944  [2m 156[0m | }
09:53:08.944  [2m 157[0m | 
09:53:08.944  [2m 158[0m | // ─── APORTE ENERGÉTICO SUPLEMENTO ────────────────────────────────
09:53:08.944  [2m 159[0m | function mcalSuplemento(supl, dosisKg) {
09:53:08.945  [2m 160[0m |   if (!supl || !dosisKg) return 0;
09:53:08.945  [2m 161[0m |   return getSupl(supl).em * dosisKg;
09:53:08.945  [2m 162[0m | }
09:53:08.945  [2m 163[0m | 
09:53:08.945  [2m 164[0m | // ─── CONSUMO VOLUNTARIO DE PASTO ─────────────────────────────────
09:53:08.945  [2m 165[0m | // Fuentes: Lippke 1980; Minson 1990
09:53:08.945  [2m 166[0m | // CV: <10%flor→2.8%PV · 10-25%→2.4% · 25-50%→2.0% · >50%→1.6%PV
09:53:08.945  [2m 167[0m | function calcConsumoPasto(pvVaca, fenol, temp) {
09:53:08.945  [2m 168[0m |   const pv    = parseFloat(pvVaca) || 320;
09:53:08.945  [2m 169[0m |   const t     = parseFloat(temp)   || 25;
09:53:08.945  [2m 170[0m |   const cvPct = { menor_10:2.8, "10_25":2.4, "25_50":2.0, mayor_50:1.6 }[fenol] || 2.4;
09:53:08.945  [2m 171[0m |   const dig   = { menor_10:68,  "10_25":63,  "25_50":58,  mayor_50:52  }[fenol] || 63;
09:53:08.945  [2m 172[0m |   const pb    = pbPasto(fenol);
09:53:08.945  [2m 173[0m |   // Ajuste temperatura: C4 se restringe con T<15°C
09:53:08.945  [2m 174[0m |   const factT = t>=25?1.0 : t>=20?0.90 : t>=15?0.75 : 0.50;
09:53:08.945  [2m 175[0m |   const kgMs  = +((pv * cvPct / 100) * factT).toFixed(1);
09:53:08.945  [2m 176[0m |   const emKg  = mcalKgAdj(t, fenol);
09:53:08.945  [2m 177[0m |   const emTotal = +(kgMs * emKg).toFixed(1);
09:53:08.945  [2m 178[0m |   return { cv:cvPct, kgMs, dig, pb, emTotal };
09:53:08.945  [2m 179[0m | }
09:53:08.945  [2m 180[0m | 
09:53:08.945  [2m 181[0m | // ─── ANESTRO POSPARTO ────────────────────────────────────────────
09:53:08.945  [2m 182[0m | // Short et al. 1990; Neel et al. 2007
09:53:08.945  [2m 183[0m | function calcAnestro(ccParto, ccMinLact, biotipo, primerParto) {
09:53:08.945  [2m 184[0m |   const bt      = getBiotipo(biotipo || "Brangus 3/8");
09:53:08.945  [2m 185[0m |   const umbral  = primerParto ? bt.umbralAnestro + 0.3 : bt.umbralAnestro;
09:53:08.945  [2m 186[0m |   const defCC   = Math.max(0, umbral - ccParto);
09:53:08.945  [2m 187[0m |   const defMin  = Math.max(0, 2.0 - ccMinLact);
09:53:08.945  [2m 188[0m |   const baseDias = primerParto ? 70 : 50;
09:53:08.946  [2m 189[0m |   const diasAnestro = Math.round(baseDias + defCC * 30 + defMin * 25);
09:53:08.946  [2m 190[0m |   return { dias: diasAnestro, riesgo: diasAnestro > 55 };
09:53:08.946  [2m 191[0m | }
09:53:08.946  [2m 192[0m | 
09:53:08.946  [2m 193[0m | // ─── INTERPOLACIÓN CC → PREÑEZ ────────────────────────────────────
09:53:08.946  [2m 194[0m | // Peruchena INTA 2003; Selk 1988
09:53:08.947  [2m 195[0m | // Tabla preñez vs CC al servicio — Peruchena INTA 2003, validada Balbuena INTA 2001-2009
09:53:08.949  [2m 196[0m | // CC escala 1–9 / Rodeo cruza NEA/NOA (Brangus/Bradford base)
09:53:08.949  [2m 197[0m | // CC 4.0 al servicio → ~70% preñez (referencia campo Bermejo, n=470 vientres)
09:53:08.950  [2m 198[0m | // CC 5.0 → ~88% · CC 5.5 → ~93% · CC 6.0 → ~96%
09:53:08.950  [2m 199[0m | const CC_PR = [
09:53:08.950  [2m 200[0m |   {ccP:7.0,pr:98},{ccP:6.5,pr:97},{ccP:6.0,pr:96},{ccP:5.5,pr:93},
09:53:08.950  [2m 201[0m |   {ccP:5.0,pr:88},{ccP:4.5,pr:80},{ccP:4.0,pr:70},{ccP:3.5,pr:50},{ccP:3.0,pr:28},{ccP:2.5,pr:10},
09:53:08.951  [2m 202[0m | ];
09:53:08.951  [2m 203[0m | function interpCC(ccP) {
09:53:08.951  [2m 204[0m |   if (ccP >= CC_PR[0].ccP)                    return { pr: CC_PR[0].pr };
09:53:08.951  [2m 205[0m |   if (ccP <= CC_PR[CC_PR.length-1].ccP)       return { pr: CC_PR[CC_PR.length-1].pr };
09:53:08.951  [2m 206[0m |   for (let i = 0; i < CC_PR.length-1; i++) {
09:53:08.951  [2m 207[0m |     if (ccP <= CC_PR[i].ccP && ccP >= CC_PR[i+1].ccP) {
09:53:08.952  [2m 208[0m |       const r = (ccP - CC_PR[i+1].ccP) / (CC_PR[i].ccP - CC_PR[i+1].ccP);
09:53:08.952  [2m 209[0m |       return { pr: Math.round(CC_PR[i+1].pr + r * (CC_PR[i].pr - CC_PR[i+1].pr)) };
09:53:08.952  [2m 210[0m |     }
09:53:08.952  [2m 211[0m |   }
09:53:08.952  [2m 212[0m |   return { pr: 20 };
09:53:08.952  [2m 213[0m | }
09:53:08.953  [2m 214[0m | 
09:53:08.953  [2m 215[0m | // ─── TRAYECTORIA CC — MOTOR REAL (Peruchena INTA 2003 / Selk 1988) ──────
09:53:08.953  [2m 216[0m | // FASE 1: HOY → PARTO
09:53:08.953  [2m 217[0m | //   En invierno (C4 detenido): la vaca PIERDE CC — gestación avanzada con
09:53:08.953  [2m 218[0m | //   pasto escaso consume reservas propias. Pérdida típica: −0.5 a −1.0 CC
09:53:08.954  [2m 219[0m | //   En verano/otoño (C4 activo): puede mantenerse o subir ligeramente.
09:53:08.954  [2m 220[0m | //   El suplemento preparto (supl3) modera la pérdida.
09:53:08.954  [2m 221[0m | //
09:53:08.954  [2m 222[0m | // FASE 2: PARTO → DESTETE (lactación)
09:53:08.954  [2m 223[0m | //   Caída energética máxima: 0.5–0.8 CC/mes (nadir a los 45–60d posparto).
09:53:08.954  [2m 224[0m | //   Bos indicus moviliza menos (movCC < 1) pero recupera más lento.
09:53:08.954  [2m 225[0m | //   Suplemento en lactación (supl2) reduce la caída.
09:53:08.955  [2m 226[0m | //
09:53:08.955  [2m 227[0m | // FASE 3: DESTETE → PRÓXIMO SERVICIO
09:53:08.955  [2m 228[0m | //   Verano-otoño post-destete: recuperación 0.3–0.5 CC/mes con buen pasto.
09:53:08.955  [2m 229[0m | //   Invierno: recuperación lenta 0.1–0.2 CC/mes (requiere suplemento, supl1).
09:53:08.955  [2m 230[0m | //   Objetivo mínimo servicio: CC 4.0 → 75% preñez (Peruchena 2003)
09:53:08.955  [2m 231[0m | //
09:53:08.955  [2m 232[0m | // La tasa de pérdida preparto depende del mes (temperatura / C4):
09:53:08.955  [2m 233[0m | //   Mes con T > 20°C (C4 activo): CC baja 0.003/día (pasto disponible)
09:53:08.955  [2m 234[0m | //   Mes con T < 15°C (C4 detenido): CC baja 0.006/día (sin pasto megatérmico)
09:53:08.955  [2m 235[0m | //
09:53:08.955  [2m 236[0m | function calcTrayectoriaCC(params) {
09:53:08.955  [2m 237[0m |   const {
09:53:08.955  [2m 238[0m |     dist, cadena, destTrad, destAntic, destHiper, supHa, vacasN,
09:53:08.955  [2m 239[0m |     biotipo, primerParto,
09:53:08.955  [2m 240[0m |     supl1, dosis1, supl2, dosis2, supl3, dosis3,
09:53:08.955  [2m 241[0m |     provincia,
09:53:08.955  [2m 242[0m |   } = params;
09:53:08.955  [2m 243[0m | 
09:53:08.955  [2m 244[0m |   const ccH = ccPond(dist);
09:53:08.955  [2m 245[0m |   if (!ccH || !cadena) return null;
09:53:08.955  [2m 246[0m | 
09:53:08.955  [2m 247[0m |   const bt       = getBiotipo(biotipo);
09:53:08.955  [2m 248[0m |   const ha       = parseFloat(supHa) || 100;
09:53:08.955  [2m 249[0m |   const vN       = parseFloat(vacasN) || 50;
09:53:08.955  [2m 250[0m |   const cargaEV  = vN / ha;
09:53:08.956  [2m 251[0m |   const ajCarga  = cargaEV > 0.8 ? -0.05 : cargaEV > 0.5 ? -0.02 : 0;
09:53:08.957  [2m 252[0m | 
09:53:08.958  [2m 253[0m |   const hist = getClima(provincia || "Corrientes");
09:53:08.958  [2m 254[0m | 
09:53:08.958  [2m 255[0m |   // ── FASE 1: HOY → PARTO ──
09:53:08.958  [2m 256[0m |   // Determinar la tasa de pérdida/ganancia por mes según temperatura
09:53:08.958  [2m 257[0m |   // La vaca en gestación avanzada e invierno PIERDE CC, no gana
09:53:08.959  [2m 258[0m |   const diasHastaParto = Math.max(0, cadena.diasPartoTemp || 0);
09:53:08.959  [2m 259[0m |   const mcalSuplPreP   = mcalSuplemento(supl3, parseFloat(dosis3) || 0);
09:53:08.959  [2m 260[0m |   // Suplemento preparto reduce pérdida: 0.5 Mcal/d ≈ −0.15 CC menos de pérdida
09:53:08.959  [2m 261[0m |   const reducPerdPreP  = mcalSuplPreP > 0 ? Math.min(0.5, mcalSuplPreP * 0.08) : 0;
09:53:08.959  [2m 262[0m | 
09:53:08.959  [2m 263[0m |   // Simular mes a mes de hoy al parto
09:53:08.960  [2m 264[0m |   const hoyMes = new Date().getMonth();
09:53:08.960  [2m 265[0m |   let ccParto  = ccH;
09:53:08.960  [2m 266[0m |   for (let d = 0; d < diasHastaParto; d++) {
09:53:08.960  [2m 267[0m |     const mes = (hoyMes + Math.floor(d / 30)) % 12;
09:53:08.960  [2m 268[0m |     const t   = hist[mes]?.t || 20;
09:53:08.960  [2m 269[0m |     // Tasa diaria: invierno (C4 off) = pierde más; verano = pierde menos o se mantiene
09:53:08.961  [2m 270[0m |     const tasaDia = t < 15 ? -0.007 : t < 20 ? -0.004 : -0.001;
09:53:08.961  [2m 271[0m |     // Suplemento modera la pérdida (convierte pérdida en menor pérdida)
09:53:08.961  [2m 272[0m |     ccParto += tasaDia + reducPerdPreP / Math.max(1, diasHastaParto);
09:53:08.961  [2m 273[0m |   }
09:53:08.961  [2m 274[0m |   ccParto = parseFloat(Math.min(9, Math.max(1, ccParto)).toFixed(2));
09:53:08.961  [2m 275[0m | 
09:53:08.961  [2m 276[0m |   // ── FASE 2: PARTO → DESTETE ──
09:53:08.962  [2m 277[0m |   const pT = parseFloat(destTrad)  || 0;
09:53:08.962  [2m 278[0m |   const pA = parseFloat(destAntic) || 0;
09:53:08.962  [2m 279[0m |   const pH = parseFloat(destHiper) || 0;
09:53:08.962  [2m 280[0m |   const tot = pT + pA + pH || 100;
09:53:08.962  [2m 281[0m |   const mesesLact = (pT*(180/30) + pA*(90/30) + pH*(50/30)) / tot;
09:53:08.962  [2m 282[0m | 
09:53:08.962  [2m 283[0m |   // Caída CC en lactación: más intensa cuanto menor es la CC al parto
09:53:08.963  [2m 284[0m |   // (la vaca que entra con CC alta tiene más reservas para movilizar)
09:53:08.963  [2m 285[0m |   // Peruchena 2003: 0.5 CC/mes con CC parto ≥ 5.0; 0.4 con CC < 4.5
09:53:08.963  [2m 286[0m |   // Caída CC por mes en lactación (Peruchena INTA 2003; calibrado campo NEA)
09:53:08.963  [2m 287[0m |   // Bos indicus moviliza menos grasa que Bos taurus → tasaCaidaBase reducida
09:53:08.963  [2m 288[0m |   // CC 5.5+ al parto: buen estado, pierde menos por mes
09:53:08.963  [2m 289[0m |   // CC < 4.5 al parto: ya comprometida, pierde lo poco que tiene
09:53:08.964  [2m 290[0m |   const tasaCaidaBase = ccParto >= 6.0 ? 0.28
09:53:08.964  [2m 291[0m |     : ccParto >= 5.5 ? 0.32
09:53:08.964  [2m 292[0m |     : ccParto >= 5.0 ? 0.36
09:53:08.964  [2m 293[0m |     : ccParto >= 4.5 ? 0.40
09:53:08.964  [2m 294[0m |     : 0.44;
09:53:08.964  [2m 295[0m |   const tasaCaida  = tasaCaidaBase * bt.movCC;
09:53:08.964  [2m 296[0m |   const mcalSuplLact = mcalSuplemento(supl2, parseFloat(dosis2) || 0);
09:53:08.964  [2m 297[0m |   // En la práctica supl2 llega vacío (vacas no se suplementan con ternero al pie)
09:53:08.964  [2m 298[0m |   // Se mantiene para simulación comparativa. La reducción real es por destete precoz.
09:53:08.964  [2m 299[0m |   const reducCaida = mcalSuplLact > 0 ? Math.min(0.10, mcalSuplLact * 0.015) : 0;
09:53:08.964  [2m 300[0m |   const caidaLact  = Math.min(2.5, mesesLact * (tasaCaida - reducCaida));
09:53:08.965  [2m 301[0m |   const ccMinLact  = parseFloat(Math.max(1.0, ccParto - caidaLact).toFixed(2));
09:53:08.965  [2m 302[0m |   const anestro    = calcAnestro(ccParto, ccMinLact, biotipo, primerParto);
09:53:08.965  [2m 303[0m |   const ccDestete  = ccMinLact;
09:53:08.965  [2m 304[0m | 
09:53:08.965  [2m 305[0m |   // ── FASE 3: DESTETE → PRÓXIMO SERVICIO ──
09:53:08.965  [2m 306[0m |   // Recuperación post-destete: depende del mes de destete y del pasto disponible
09:53:08.965  [2m 307[0m |   // En verano: 0.4–0.5 CC/mes; en invierno: 0.1–0.2 CC/mes (requiere supl)
09:53:08.965  [2m 308[0m |   const mesParto   = cadena.partoTemp ? cadena.partoTemp.getMonth() : 10;
09:53:08.965  [2m 309[0m |   const mesDestete = (mesParto + Math.round(mesesLact)) % 12;
09:53:08.965  [2m 310[0m |   const mesServ    = cadena.ini ? cadena.ini.getMonth() : (mesParto + 3) % 12;
09:53:08.966  [2m 311[0m |   const diasRecup  = Math.max(0, ((mesServ - mesDestete + 12) % 12) * 30);
09:53:08.966  [2m 312[0m | 
09:53:08.966  [2m 313[0m |   const mcalSuplInv   = mcalSuplemento(supl1, parseFloat(dosis1) || 0);
09:53:08.966  [2m 314[0m |   let   ccServ        = ccDestete;
09:53:08.966  [2m 315[0m |   for (let d = 0; d < diasRecup; d++) {
09:53:08.966  [2m 316[0m |     const mes = (mesDestete + Math.floor(d / 30)) % 12;
09:53:08.966  [2m 317[0m |     const t   = hist[mes]?.t || 20;
09:53:08.966  [2m 318[0m |     // Tasa de recuperación: verano con buen pasto C4 = 0.015/día; invierno = 0.004/día
09:53:08.966  [2m 319[0m |     const tasaRecup = t >= 25 ? 0.016 : t >= 20 ? 0.012 : t >= 15 ? 0.006 : 0.003;
09:53:08.966  [2m 320[0m |     // Boost por suplemento invernal
09:53:08.966  [2m 321[0m |     const boostSupl = mcalSuplInv > 0 ? Math.min(0.005, mcalSuplInv * 0.0015) : 0;
09:53:08.967  [2m 322[0m |     ccServ += (tasaRecup + boostSupl + ajCarga / Math.max(1, diasRecup));
09:53:08.967  [2m 323[0m |   }
09:53:08.967  [2m 324[0m |   ccServ = parseFloat(Math.min(9, Math.max(1, ccServ)).toFixed(2));
09:53:08.967  [2m 325[0m | 
09:53:08.967  [2m 326[0m |   const pr = interpCC(ccServ).pr;
09:53:08.967  [2m 327[0m | 
09:53:08.967  [2m 328[0m |   return {
09:53:08.967  [2m 329[0m |     ccHoy:    ccH,
09:53:08.968  [2m 330[0m |     ccParto,
09:53:08.968  [2m 331[0m |     ccMinLact,
09:53:08.968  [2m 332[0m |     ccDestete,
09:53:08.968  [2m 333[0m |     ccServ,
09:53:08.968  [2m 334[0m |     pr,
09:53:08.968  [2m 335[0m |     mesesLact:    mesesLact.toFixed(1),
09:53:08.968  [2m 336[0m |     caidaLact:    caidaLact.toFixed(2),
09:53:08.968  [2m 337[0m |     anestro,
09:53:08.968  [2m 338[0m |     tasaCaida:    tasaCaida.toFixed(3),
09:53:08.968  [2m 339[0m |     reducCaida:   reducCaida.toFixed(3),
09:53:08.968  [2m 340[0m |     diasHastaParto,
09:53:08.968  [2m 341[0m |     diasRecup,
09:53:08.968  [2m 342[0m |     mesParto, mesDestete, mesServ,
09:53:08.968  [2m 343[0m |   };
09:53:08.968  [2m 344[0m | }
09:53:08.968  [2m 345[0m | 
09:53:08.968  [2m 346[0m | // ─── DISTRIBUCIÓN CC POR GRUPO ───────────────────────────────────
09:53:08.968  [2m 347[0m | // Calcula trayectoria individual para cada grupo de CC del rodeo
09:53:08.968  [2m 348[0m | // y recomienda el tipo de destete óptimo para cada uno
09:53:08.968  [2m 349[0m | // basado en Peruchena INTA 2003 y el motor de trayectoria real
09:53:08.968  [2m 350[0m | function calcDistCC(params) {
09:53:08.968  [2m 351[0m |   const {
09:53:08.968  [2m 352[0m |     dist, cadena, destTrad, destAntic, destHiper,
09:53:08.968  [2m 353[0m |     supHa, vacasN, biotipo, provincia,
09:53:08.968  [2m 354[0m |     supl1, dosis1, supl2, dosis2, supl3, dosis3,
09:53:08.968  [2m 355[0m |   } = params;
09:53:08.968  [2m 356[0m | 
09:53:08.968  [2m 357[0m |   if (!dist || !cadena) return { grupos:[], caidaLact:"0", mesesLact:"0", diasLactPond:0 };
09:53:08.968  [2m 358[0m | 
09:53:08.968  [2m 359[0m |   const bt      = getBiotipo(biotipo);
09:53:08.968  [2m 360[0m |   const ha      = parseFloat(supHa) || 100;
09:53:08.968  [2m 361[0m |   const vN      = parseFloat(vacasN) || 50;
09:53:08.968  [2m 362[0m |   const cargaEV = vN / ha;
09:53:08.968  [2m 363[0m |   const ajCarga = cargaEV > 0.8 ? -0.05 : cargaEV > 0.5 ? -0.02 : 0;
09:53:08.969  [2m 364[0m |   const hist    = getClima(provincia || "Corrientes");
09:53:08.969  [2m 365[0m | 
09:53:08.969  [2m 366[0m |   const pTrad  = parseFloat(destTrad)  || 0;
09:53:08.969  [2m 367[0m |   const pAntic = parseFloat(destAntic) || 0;
09:53:08.969  [2m 368[0m |   const pHiper = parseFloat(destHiper) || 0;
09:53:08.970  [2m 369[0m |   const totalD = pTrad + pAntic + pHiper || 100;
09:53:08.970  [2m 370[0m |   const diasLactPond = (pTrad/totalD)*180 + (pAntic/totalD)*90 + (pHiper/totalD)*50;
09:53:08.970  [2m 371[0m |   const mesesLact    = diasLactPond / 30;
09:53:08.970  [2m 372[0m | 
09:53:08.970  [2m 373[0m |   // Parámetros suplementación
09:53:08.970  [2m 374[0m |   const mcalSuplLact = mcalSuplemento(supl2, parseFloat(dosis2) || 0);
09:53:08.971  [2m 375[0m |   const mcalSuplInv  = mcalSuplemento(supl1, parseFloat(dosis1) || 0);
09:53:08.971  [2m 376[0m |   const mcalSuplPreP = mcalSuplemento(supl3, parseFloat(dosis3) || 0);
09:53:08.971  [2m 377[0m |   const reducPerdPreP = mcalSuplPreP > 0 ? Math.min(0.5, mcalSuplPreP * 0.08) : 0;
09:53:08.971  [2m 378[0m |   const reducCaida    = mcalSuplLact > 0 ? Math.min(0.30, mcalSuplLact * 0.030) : 0;
09:53:08.971  [2m 379[0m | 
09:53:08.971  [2m 380[0m |   // Fechas clave
09:53:08.972  [2m 381[0m |   const hoyMes    = new Date().getMonth();
09:53:08.972  [2m 382[0m |   const mesParto  = cadena.partoTemp ? cadena.partoTemp.getMonth() : 10;
09:53:08.972  [2m 383[0m |   const mesServ   = cadena.ini ? cadena.ini.getMonth() : (mesParto + 3) % 12;
09:53:08.972  [2m 384[0m |   const diasHastaParto = Math.max(0, cadena.diasPartoTemp || 0);
09:53:08.972  [2m 385[0m | 
09:53:08.972  [2m 386[0m |   // Función: calcular CC al parto para un grupo dado su CC actual
09:53:08.973  [2m 387[0m |   const calcCcParto = (ccHoy) => {
09:53:08.973  [2m 388[0m |     let cc = ccHoy;
09:53:08.973  [2m 389[0m |     for (let d = 0; d < diasHastaParto; d++) {
09:53:08.973  [2m 390[0m |       const mes = (hoyMes + Math.floor(d / 30)) % 12;
09:53:08.973  [2m 391[0m |       const t   = hist[mes]?.t || 20;
09:53:08.974  [2m 392[0m |       const tasaDia = t < 15 ? -0.007 : t < 20 ? -0.004 : -0.001;
09:53:08.974  [2m 393[0m |       cc += tasaDia + reducPerdPreP / Math.max(1, diasHastaParto);
09:53:08.974  [2m 394[0m |     }
09:53:08.974  [2m 395[0m |     return parseFloat(Math.min(9, Math.max(1, cc)).toFixed(2));
09:53:08.974  [2m 396[0m |   };
09:53:08.974  [2m 397[0m | 
09:53:08.975  [2m 398[0m |   // Función: calcular CC al servicio dado ccDestete y mes de destete
09:53:08.975  [2m 399[0m |   const calcCcServ = (ccDestete, mesDestete) => {
09:53:08.975  [2m 400[0m |     const diasRecup = Math.max(0, ((mesServ - mesDestete + 12) % 12) * 30);
09:53:08.975  [2m 401[0m |     let cc = ccDestete;
09:53:08.975  [2m 402[0m |     for (let d = 0; d < diasRecup; d++) {
09:53:08.975  [2m 403[0m |       const mes = (mesDestete + Math.floor(d / 30)) % 12;
09:53:08.975  [2m 404[0m |       const t   = hist[mes]?.t || 20;
09:53:08.975  [2m 405[0m |       const tasaRecup = t >= 25 ? 0.016 : t >= 20 ? 0.012 : t >= 15 ? 0.006 : 0.003;
09:53:08.975  [2m 406[0m |       const boostSupl = mcalSuplInv > 0 ? Math.min(0.005, mcalSuplInv * 0.0015) : 0;
09:53:08.975  [2m 407[0m |       cc += tasaRecup + boostSupl + ajCarga / Math.max(1, diasRecup);
09:53:08.975  [2m 408[0m |     }
09:53:08.976  [2m 409[0m |     return parseFloat(Math.min(9, Math.max(1, cc)).toFixed(2));
09:53:08.976  [2m 410[0m |   };
09:53:08.976  [2m 411[0m | 
09:53:08.976  [2m 412[0m |   const grupos = (dist || []).map(d => {
09:53:08.976  [2m 413[0m |     const ccHoy = parseFloat(d.cc) || 0;
09:53:08.976  [2m 414[0m |     const pct   = parseFloat(d.pct) || 0;
09:53:08.976  [2m 415[0m |     if (!ccHoy || !pct) return null;
09:53:08.976  [2m 416[0m | 
09:53:08.976  [2m 417[0m |     const ccParto = calcCcParto(ccHoy);
09:53:08.976  [2m 418[0m |     const tasaCaidaBase = ccParto >= 6.0 ? 0.38 : ccParto >= 5.0 ? 0.45 : ccParto >= 4.5 ? 0.52 : 0.58;
09:53:08.976  [2m 419[0m |     const tasaCaida  = tasaCaidaBase * bt.movCC;
09:53:08.976  [2m 420[0m |     const caida      = Math.min(2.5, mesesLact * (tasaCaida - reducCaida));
09:53:08.977  [2m 421[0m |     const ccMinLact  = parseFloat(Math.max(1.0, ccParto - caida).toFixed(2));
09:53:08.977  [2m 422[0m |     const ccDestete  = ccMinLact;
09:53:08.977  [2m 423[0m |     const anestro    = calcAnestro(ccParto, ccMinLact, biotipo, false);
09:53:08.977  [2m 424[0m |     const mesDestete = (mesParto + Math.round(mesesLact)) % 12;
09:53:08.977  [2m 425[0m |     const ccServ     = calcCcServ(ccDestete, mesDestete);
09:53:08.977  [2m 426[0m |     const pr         = interpCC(ccServ).pr;
09:53:08.977  [2m 427[0m | 
09:53:08.977  [2m 428[0m |     // Recomendación de destete: qué modalidad necesita este grupo para llegar a CC 4.0 mínimo al servicio
09:53:08.977  [2m 429[0m |     // Calcular ccServ con cada modalidad de destete
09:53:08.977  [2m 430[0m |     const calcCcServModal = (diasLactModal) => {
09:53:08.977  [2m 431[0m |       const caidaModal = Math.min(2.5, (diasLactModal/30) * (tasaCaida - reducCaida));
09:53:08.978  [2m 432[0m |       const ccMinModal = Math.max(1.0, ccParto - caidaModal);
09:53:08.978  [2m 433[0m |       const mesDestModal = (mesParto + Math.round(diasLactModal/30)) % 12;
09:53:08.978  [2m 434[0m |       return calcCcServ(ccMinModal, mesDestModal);
09:53:08.978  [2m 435[0m |     };
09:53:08.978  [2m 436[0m |     const ccServHiper = calcCcServModal(50);
09:53:08.978  [2m 437[0m |     const ccServAntic = calcCcServModal(90);
09:53:08.978  [2m 438[0m |     const ccServTrad  = calcCcServModal(180);
09:53:08.979  [2m 439[0m | 
09:53:08.979  [2m 440[0m |     // Recomendación: el destete más tardío que igual llegue a CC ≥ 4.0 al servicio
09:53:08.979  [2m 441[0m |     // (priorizar el bienestar del ternero — no destetarlos antes de lo necesario)
09:53:08.981  [2m 442[0m |     let recDestete, urgencia, motivoDestete;
09:53:08.981  [2m 443[0m |     if (ccServTrad >= 4.0) {
09:53:08.981  [2m 444[0m |       recDestete = "🟢 Tradicional (180d)"; urgencia = "preventivo";
09:53:08.981  [2m 445[0m |       motivoDestete = `CC serv. ${ccServTrad} con destete tradicional — OK`;
09:53:08.981  [2m 446[0m |     } else if (ccServAntic >= 4.0) {
09:53:08.981  [2m 447[0m |       recDestete = "🔶 Anticipado (90d)"; urgencia = "importante";
09:53:08.981  [2m 448[0m |       motivoDestete = `Trad. daría CC ${ccServTrad} — Anticipado alcanza CC ${ccServAntic}`;
09:53:08.981  [2m 449[0m |     } else {
09:53:08.981  [2m 450[0m |       recDestete = "⚡ Hiperprecoz (50d)"; urgencia = "urgente";
09:53:08.981  [2m 451[0m |       motivoDestete = `Solo hiperprecoz logra CC ${ccServHiper} al servicio (mín. 4.0)`;
09:53:08.981  [2m 452[0m |     }
09:53:08.981  [2m 453[0m | 
09:53:08.981  [2m 454[0m |     return {
09:53:08.982  [2m 455[0m |       ccHoy, pct, ccParto, ccMinLact, ccDestete, ccServ, pr,
09:53:08.982  [2m 456[0m |       ccServHiper, ccServAntic, ccServTrad,
09:53:08.982  [2m 457[0m |       recDestete, urgencia, motivoDestete, anestro,
09:53:08.982  [2m 458[0m |       caida: +caida.toFixed(2),
09:53:08.982  [2m 459[0m |       mesParto, mesDestete, mesServ,
09:53:08.982  [2m 460[0m |     };
09:53:08.986  [2m 461[0m |   }).filter(Boolean);
09:53:08.986  [2m 462[0m | 
09:53:08.986  [2m 463[0m |   return {
09:53:08.986  [2m 464[0m |     grupos,
09:53:08.986  [2m 465[0m |     caidaLact:    (mesesLact * 0.50).toFixed(2),
09:53:08.986  [2m 466[0m |     mesesLact:    mesesLact.toFixed(1),
09:53:08.986  [2m 467[0m |     diasLactPond: Math.round(diasLactPond),
09:53:08.986  [2m 468[0m |   };
09:53:08.986  [2m 469[0m | }
09:53:08.986  [2m 470[0m | 
09:53:08.986  [2m 471[0m | // ─── TERNEROS ─────────────────────────────────────────────────────
09:53:08.986  [2m 472[0m | // PV al parto: 35 kg (promedio NEA/NOA, biotipo intermedio)
09:53:08.986  [2m 473[0m | // GDP al pie de la madre: 700 g/d (Hereford/Angus cruzado · NEA)
09:53:08.987  [2m 474[0m | //   Bos indicus puro puede ser 600 g/d, taurino puro 750–800 g/d
09:53:08.987  [2m 475[0m | //   700 g/d es el estándar de campo para cruza comercial NEA
09:53:08.987  [2m 476[0m | // GDP post-destete en pastizal hasta mayo: 400 g/d mínimo
09:53:08.987  [2m 477[0m | //   (pastizal natural seco, sin suplementación)
09:53:08.987  [2m 478[0m | //   Con mejora forrajera o suplementación puede llegar a 500–550 g/d
09:53:08.987  [2m 479[0m | // Fuente: INTA EEA Mercedes · Peruchena 2003 · Bavera 2005
09:53:08.987  [2m 480[0m | function calcTerneros(vacasN, prenez, pctDestete, destTrad, destAntic, destHiper, cadena) {
09:53:08.987  [2m 481[0m |   const vN = parseInt(vacasN)        || 0;
09:53:08.987  [2m 482[0m |   const pr = parseFloat(prenez)      || 0;
09:53:08.987  [2m 483[0m |   const pd = parseFloat(pctDestete)  || 88;
09:53:08.987  [2m 484[0m |   if (!vN || !pr) return null;
09:53:08.987  [2m 485[0m | 
09:53:08.987  [2m 486[0m |   const terneros = Math.round(vN * pr / 100 * pd / 100);
09:53:08.987  [2m 487[0m |   const pT  = parseFloat(destTrad)  || 0;
09:53:08.987  [2m 488[0m |   const pA  = parseFloat(destAntic) || 0;
09:53:08.987  [2m 489[0m |   const pH  = parseFloat(destHiper) || 0;
09:53:08.987  [2m 490[0m |   const tot = pT + pA + pH || 100;
09:53:08.988  [2m 491[0m | 
09:53:08.988  [2m 492[0m |   // GDP AL PIE DE LA MADRE (g/d) — los días que van con la vaca
09:53:08.988  [2m 493[0m |   const GDP_MADRE = { trad:0.700, antic:0.700, hiper:0.700 };
09:53:08.988  [2m 494[0m |   // GDP POST-DESTETE en pastizal (g/d) — desde destete hasta mayo
09:53:08.988  [2m 495[0m |   const GDP_POST  = { trad:0.400, antic:0.400, hiper:0.400 };
09:53:08.988  [2m 496[0m | 
09:53:08.988  [2m 497[0m |   const partoRef = cadena?.partoTemp || new Date(new Date().getFullYear(), 9, 1);
09:53:08.988  [2m 498[0m | 
09:53:08.988  [2m 499[0m |   const calcMayo = (diasLact, gdpMadre, gdpPost) => {
09:53:08.988  [2m 500[0m |     const dest = new Date(partoRef);
09:53:08.988  [2m 501[0m |     dest.setDate(dest.getDate() + diasLact);
09:53:08.988  [2m 502[0m |     const anoRef  = dest.getFullYear();
09:53:08.988  [2m 503[0m |     let mayo1     = new Date(anoRef, 4, 1);
09:53:08.988  [2m 504[0m |     if (mayo1 <= dest) mayo1 = new Date(anoRef + 1, 4, 1);
09:53:08.988  [2m 505[0m |     const diasPost = Math.max(0, Math.round((mayo1 - dest) / (1000*60*60*24)));
09:53:08.988  [2m 506[0m |     const pvDest   = Math.round(35 + gdpMadre * diasLact);
09:53:08.988  [2m 507[0m |     return { pvDest, pvMayo: Math.round(pvDest + gdpPost * diasPost) };
09:53:08.989  [2m 508[0m |   };
09:53:08.989  [2m 509[0m | 
09:53:08.989  [2m 510[0m |   const resTrad  = calcMayo(180, GDP_MADRE.trad,  GDP_POST.trad);
09:53:08.989  [2m 511[0m |   const resAntic = calcMayo(90,  GDP_MADRE.antic, GDP_POST.antic);
09:53:08.989  [2m 512[0m |   const resHiper = calcMayo(50,  GDP_MADRE.hiper, GDP_POST.hiper);
09:53:08.989  [2m 513[0m | 
09:53:08.989  [2m 514[0m |   const pvMayoPond = Math.round(
09:53:08.989  [2m 515[0m |     (pT/tot)*resTrad.pvMayo + (pA/tot)*resAntic.pvMayo + (pH/tot)*resHiper.pvMayo
09:53:08.992  [2m 516[0m |   );
09:53:08.992  [2m 517[0m |   const alertaHiper = (pH / tot) > 0.30;
09:53:08.993  [2m 518[0m |   const detalle = [
09:53:08.993  [2m 519[0m |     { label:"Tradicional (180d)", pct:pT/tot, pvDest:resTrad.pvDest,  pvMayo:resTrad.pvMayo  },
09:53:08.993  [2m 520[0m |     { label:"Anticipado (90d)",   pct:pA/tot, pvDest:resAntic.pvDest, pvMayo:resAntic.pvMayo },
09:53:08.993  [2m 521[0m |     { label:"Hiperprecoz (50d)",  pct:pH/tot, pvDest:resHiper.pvDest, pvMayo:resHiper.pvMayo },
09:53:08.993  [2m 522[0m |   ];
09:53:08.993  [2m 523[0m |   return { terneros, pvMayoPond, alertaHiper, detalle };
09:53:08.993  [2m 524[0m | }
09:53:08.993  [2m 525[0m | 
09:53:08.993  [2m 526[0m | // ─── VAQUILLONA 1° INVIERNO ───────────────────────────────────────
09:53:08.993  [2m 527[0m | // Objetivo: 60% PV adulta en agosto (~90d mayo→agosto)
09:53:08.993  [2m 528[0m | // NRC 2000; INTA Rafaela; Lippke 1980; Detmann 2010
09:53:08.993  [2m 529[0m | // ─── DISPONIBILIDAD FORRAJERA (kgMS/ha) ──────────────────────────
09:53:08.993  [2m 530[0m | // Tabla INTA EEA Colonia Benítez — Rosello Brajovich et al. 2025
09:53:08.993  [2m 531[0m | // Cuadro 1: Estimación cantidad de pasto según altura × tipo
09:53:08.993  [2m 532[0m | const TABLA_DISP_MS = {
09:53:08.993  [2m 533[0m |   // [altCm]: { corto_denso:[min,max], alto_ralo:[min,max], alto_denso:[min,max] }
09:53:08.993  [2m 534[0m |   10: { corto_denso:[1000,1200], alto_ralo:[600,800],   alto_denso:[800,1000]  },
09:53:08.993  [2m 535[0m |   20: { corto_denso:[1800,2400], alto_ralo:[1000,1200], alto_denso:[1800,2400] },
09:53:08.994  [2m 536[0m |   30: { corto_denso:[2700,3200], alto_ralo:[2000,3000], alto_denso:[3300,3700] },
09:53:08.994  [2m 537[0m |   40: { corto_denso:[3000,5000], alto_ralo:[3000,5000], alto_denso:[4500,5000] },
09:53:08.994  [2m 538[0m | };
09:53:08.994  [2m 539[0m | function calcDisponibilidadMS(altPasto, tipoPasto) {
09:53:08.994  [2m 540[0m |   const alt  = parseFloat(altPasto) || 20;
09:53:08.994  [2m 541[0m |   const tipo = tipoPasto || "alto_denso";
09:53:08.994  [2m 542[0m |   // Buscar la clave más cercana
09:53:08.994  [2m 543[0m |   const claves = [10, 20, 30, 40];
09:53:08.994  [2m 544[0m |   const clave  = claves.reduce((a, b) => Math.abs(b - alt) < Math.abs(a - alt) ? b : a);
09:53:08.994  [2m 545[0m |   const rango  = TABLA_DISP_MS[clave]?.[tipo] || [1000, 2000];
09:53:08.994  [2m 546[0m |   const msHa   = Math.round((rango[0] + rango[1]) / 2);
09:53:08.994  [2m 547[0m |   // Clasificación por cantidad
09:53:08.994  [2m 548[0m |   const nivel = msHa >= 2000 ? "alta" : msHa >= 1000 ? "media" : "baja";
09:53:08.994  [2m 549[0m |   return { msHa, nivel, rango, alt, tipo };
09:53:08.994  [2m 550[0m | }
09:53:08.994  [2m 551[0m | 
09:53:08.994  [2m 552[0m | // ─── VAQUILLONA 1° INVIERNO — motor completo ─────────────────────
09:53:08.994  [2m 553[0m | // Reglas (Balbuena INTA 2003; Rosello Brajovich 2025; Detmann/NASSEM 2010):
09:53:08.994  [2m 554[0m | //
09:53:08.994  [2m 555[0m | // CANTIDAD alta (>2000 kgMS/ha) + CALIDAD baja (fenología >25% floración):
09:53:08.995  [2m 556[0m | //   → Solo proteína: 0.5–0.7% PV · frecuencia 2–3x/semana (no diario)
09:53:08.995  [2m 557[0m | //   → Fuente: expeller girasol/algodón/soja
09:53:08.995  [2m 558[0m | //
09:53:08.995  [2m 559[0m | // CANTIDAD baja (<1000 kgMS/ha):
09:53:08.995  [2m 560[0m | //   → Proteína 0.7% PV + Energía 0.4% PV (sorgo/maíz molido) · DIARIO OBLIGATORIO
09:53:08.995  [2m 561[0m | //   → Energía con almidón (maíz/sorgo) SIEMPRE diario — riesgo acidosis si intermitente
09:53:08.995  [2m 562[0m | //
09:53:08.995  [2m 563[0m | // Semilla de algodón como energía en Vaq1: máx 0.4% PV/día
09:53:08.995  [2m 564[0m | //   → Si se supera: reduce digestibilidad fibra (Balbuena 2003)
09:53:08.996  [2m 565[0m | //   → Ad libitum válido SOLO para Vaq2 (>280 kg PV)
09:53:08.996  [2m 566[0m | //
09:53:08.996  [2m 567[0m | // Urea: SIEMPRE diario — pico amonio si se da en bolo cada 2–3 días
09:53:08.996  [2m 568[0m | function calcVaq1(pvEntrada, pvAdulta, ndvi, edadMayo, tipoDestete, disponMS, fenologia) {
09:53:08.996  [2m 569[0m |   const pv   = parseFloat(pvEntrada) || 0;
09:53:08.996  [2m 570[0m |   const pva  = parseFloat(pvAdulta)  || 320;
09:53:08.996  [2m 571[0m |   if (!pv) return { mensaje:"Ingresá el PV de entrada para calcular suplementación." };
09:53:08.996  [2m 572[0m | 
09:53:08.996  [2m 573[0m |   // Objetivo Vaq1: ganar MÍNIMO 65 kg entre mayo e inicio de septiembre (122 días)
09:53:08.996  [2m 574[0m |   // GDP mínimo = 65000g / 122d = 532 g/d
09:53:08.996  [2m 575[0m |   // Este animal tiene TODO UN AÑO más hasta el entore (agosto → entore próximo año)
09:53:08.996  [2m 576[0m |   // El invierno es crítico para evitar que quede retrasada en PV
09:53:08.997  [2m 577[0m |   const DIAS_INV_VAQ1 = 122; // mayo (día 1) → inicio septiembre
09:53:08.997  [2m 578[0m |   const gdpMinInv    = Math.round(65000 / DIAS_INV_VAQ1); // ≈ 533 g/d
09:53:08.997  [2m 579[0m |   const objetivo     = Math.round(pv + 65); // PV objetivo al salir del invierno
09:53:08.997  [2m 580[0m |   const diasInv      = DIAS_INV_VAQ1;
09:53:08.997  [2m 581[0m |   const gdpNecesario = gdpMinInv;
09:53:08.997  [2m 582[0m | 
09:53:08.997  [2m 583[0m |   // Disponibilidad: cantidad (kgMS/ha) y calidad (fenología)
09:53:08.997  [2m 584[0m |   const nivelMS    = disponMS?.nivel || "media";      // alta | media | baja
09:53:08.997  [2m 585[0m |   const msHa       = disponMS?.msHa  || 1500;
09:53:08.997  [2m 586[0m |   const fenol      = fenologia || "25_50";
09:53:08.997  [2m 587[0m |   const calidadBaja = ["25_50","mayor_50"].includes(fenol);  // pasto encañado/maduro
09:53:08.997  [2m 588[0m | 
09:53:08.997  [2m 589[0m |   // GDP base en pastizal según CANTIDAD disponible y NDVI
09:53:08.997  [2m 590[0m |   const ndviN    = parseFloat(ndvi) || 0.45;
09:53:08.997  [2m 591[0m |   // CANTIDAD baja → GDP reducido independientemente del NDVI
09:53:08.997  [2m 592[0m |   // GDP real en pastizal natural en invierno NEA (junio-agosto)
09:53:08.997  [2m 593[0m |   // Aunque haya cantidad, el pasto viejo (lignina alta, dig <45%) + frío limita mucho
09:53:08.997  [2m 594[0m |   // Valores calibrados con datos INTA EEA Colonia Benítez y Salta
09:53:08.997  [2m 595[0m |   const gdpPasto = nivelMS === "baja"  ? 60   // <1000 kgMS/ha — hambre real
09:53:08.997  [2m 596[0m |                  : nivelMS === "media" ? (ndviN > 0.45 ? 130 : 90)  // 1000–2000, muy limitado en frío
09:53:08.998  [2m 597[0m |                  :                      (ndviN > 0.50 ? 180 : 140); // >2000, techo por temperatura
09:53:08.998  [2m 598[0m | 
09:53:08.998  [2m 599[0m |   const boostComp = tipoDestete === "hiper" ? 50 : tipoDestete === "antic" ? 25 : 0;
09:53:08.998  [2m 600[0m |   const gdpBase   = gdpPasto + boostComp;
09:53:08.998  [2m 601[0m | 
09:53:08.998  [2m 602[0m |   // Vaq1 SIEMPRE necesita al menos proteína en invierno NEA
09:53:08.998  [2m 603[0m |   // (pastizal natural <8% PB en invierno — por debajo del mínimo ruminal)
09:53:08.998  [2m 604[0m |   // Solo si GDP pasto ya supera 722 g/d (raro) se puede omitir suplementación
09:53:08.998  [2m 605[0m |   if (gdpBase >= gdpNecesario && nivelMS !== "baja" && !calidadBaja) {
09:53:08.998  [2m 606[0m |     return {
09:53:08.998  [2m 607[0m |       esc:"—",
09:53:08.998  [2m 608[0m |       mensaje:`GDP pasto (${gdpBase}g/d) ≥ mínimo requerido (${gdpMinInv}g/d). Monitorear CC y PV mensualmente.`,
09:53:08.998  [2m 609[0m |       nivelMS, msHa, gdpPasto,
09:53:08.998  [2m 610[0m |     };
09:53:08.998  [2m 611[0m |   }
09:53:08.998  [2m 612[0m | 
09:53:08.999  [2m 613[0m |   const gdpFaltante = gdpNecesario - gdpBase;
09:53:08.999  [2m 614[0m | 
09:53:08.999  [2m 615[0m |   // ── ESCENARIO A: Cantidad alta + calidad baja → solo proteína, intermitente
09:53:08.999  [2m 616[0m |   // ── ESCENARIO B: Cantidad media + calidad baja → proteína, puede ser 2–3x/sem
09:53:08.999  [2m 617[0m |   // ── ESCENARIO C: Cantidad baja → proteína + energía, DIARIO obligatorio
09:53:08.999  [2m 618[0m |   let protKg, energKg, freq, freqDetalle, fuenteEnerg, advertencia;
09:53:08.999  [2m 619[0m | 
09:53:08.999  [2m 620[0m |   if (nivelMS === "baja") {
09:53:08.999  [2m 621[0m |     // Pasto escaso: proteína + energía obligatorio
09:53:08.999  [2m 622[0m |     protKg      = Math.round(pv * 0.007 * 10) / 10;  // 0.7% PV
09:53:08.999  [2m 623[0m |     energKg     = Math.round(pv * 0.004 * 10) / 10;  // 0.4% PV
09:53:08.999  [2m 624[0m |     freq        = "Diario";
09:53:08.999  [2m 625[0m |     freqDetalle = "⚠️ DIARIO OBLIGATORIO — almidón (sorgo/maíz) provoca acidosis ruminal si se da en días alternos";
09:53:08.999  [2m 626[0m |     fuenteEnerg = "Sorgo molido o maíz molido (NO semilla de algodón en Vaq1)";
09:53:08.999  [2m 627[0m |     advertencia = nivelMS === "baja" ? `Disponibilidad crítica (${msHa} kgMS/ha). Evaluar rollo como fibra base.` : null;
09:53:08.999  [2m 628[0m |   } else if (calidadBaja) {
09:53:08.999  [2m 629[0m |     // Cantidad media/alta + calidad baja → solo proteína, puede ser intermitente
09:53:09.001  [2m 630[0m |     protKg      = Math.round(pv * (gdpFaltante > 150 ? 0.007 : 0.005) * 10) / 10;
09:53:09.001  [2m 631[0m |     energKg     = 0;
09:53:09.001  [2m 632[0m |     freq        = "2–3 veces/semana";
09:53:09.002  [2m 633[0m |     freqDetalle = "Proteína sola (sin almidón) puede darse 2–3x/semana. Balbuena INTA 2003";
09:53:09.002  [2m 634[0m |     fuenteEnerg = null;
09:53:09.002  [2m 635[0m |     advertencia = `Pasto encañado/maduro: cantidad disponible (${msHa} kgMS/ha) pero baja digestibilidad. Proteína activa la microbiota ruminal.`;
09:53:09.002  [2m 636[0m |   } else {
09:53:09.002  [2m 637[0m |     // Cantidad media, calidad normal
09:53:09.002  [2m 638[0m |     protKg      = gdpFaltante <= 100 ? Math.round(pv*0.003*10)/10 : gdpFaltante <= 200 ? Math.round(pv*0.005*10)/10 : Math.round(pv*0.007*10)/10;
09:53:09.002  [2m 639[0m |     energKg     = gdpFaltante > 200 ? Math.round(pv*0.003*10)/10 : 0;
09:53:09.002  [2m 640[0m |     freq        = energKg > 0 ? "Diario" : "2–3 veces/semana";
09:53:09.002  [2m 641[0m |     freqDetalle = energKg > 0 ? "Incluye energía con almidón → diario obligatorio" : "Solo proteína → puede ser 2–3x/semana";
09:53:09.002  [2m 642[0m |     fuenteEnerg = energKg > 0 ? "Sorgo molido o maíz molido" : null;
09:53:09.002  [2m 643[0m |     advertencia = null;
09:53:09.002  [2m 644[0m |   }
09:53:09.002  [2m 645[0m | 
09:53:09.002  [2m 646[0m |   // Límite semilla de algodón Vaq1: máx 0.4% PV (Balbuena 2003)
09:53:09.002  [2m 647[0m |   const limAlgVaq1 = Math.round(pv * 0.004 * 10) / 10;
09:53:09.002  [2m 648[0m |   const alertaAlgodon = protKg > limAlgVaq1
09:53:09.002  [2m 649[0m |     ? `⚠️ Si usás semilla de algodón: máx ${limAlgVaq1} kg/día (0.4% PV=${pv}kg) — superar reduce digestibilidad de fibra. Ad libitum solo en Vaq2° invierno.`
09:53:09.002  [2m 650[0m |     : null;
09:53:09.002  [2m 651[0m | 
09:53:09.002  [2m 652[0m |   // GDP real con suplementación
09:53:09.002  [2m 653[0m |   const gdpReal = Math.round(gdpBase + (protKg/(pv*0.003))*70 + (energKg > 0 ? 60 : 0));
09:53:09.002  [2m 654[0m |   const pvSal   = Math.round(pv + gdpReal * diasInv / 1000);
09:53:09.002  [2m 655[0m |   const pvAbr2Inv = Math.round(pvSal + 300 * 60 / 1000); // +60d a 300g/d hasta entrada 2°inv
09:53:09.002  [2m 656[0m |   const esc     = nivelMS === "baja" ? "C" : gdpFaltante > 150 ? "B" : "A";
09:53:09.002  [2m 657[0m |   const deficit = pvSal < objetivo;
09:53:09.002  [2m 658[0m | 
09:53:09.002  [2m 659[0m |   const nota = tipoDestete === "hiper"
09:53:09.002  [2m 660[0m |     ? "⚡ Hiperprecoz: proteína crítica en primeros 30d. Iniciar suplementación inmediata al destete."
09:53:09.002  [2m 661[0m |     : edadMayo && parseFloat(edadMayo) < 6
09:53:09.002  [2m 662[0m |     ? "⚠️ Ternero muy joven al inicio del invierno. Aumentar dosis proteica."
09:53:09.002  [2m 663[0m |     : null;
09:53:09.002  [2m 664[0m | 
09:53:09.002  [2m 665[0m |   return {
09:53:09.002  [2m 666[0m |     esc, protKg, energKg, freq, freqDetalle, fuenteEnerg,
09:53:09.002  [2m 667[0m |     gdpReal, pvSal, pvAbr2Inv, objetivo, deficit, nota,
09:53:09.003  [2m 668[0m |     advertencia, alertaAlgodon,
09:53:09.003  [2m 669[0m |     nivelMS, msHa, gdpPasto, calidadBaja,
09:53:09.003  [2m 670[0m |   };
09:53:09.003  [2m 671[0m | }
09:53:09.003  [2m 672[0m | 
09:53:09.003  [2m 673[0m | // ─── VAQUILLONA 2° INVIERNO ───────────────────────────────────────
09:53:09.003  [2m 674[0m | // PV entrada 2°inv = PV salida Vaq1 (agosto) + GDP primavera-verano
09:53:09.003  [2m 675[0m | // agosto → mayo siguiente = ~270d con GDP promedio 300g/d (campo)
09:53:09.003  [2m 676[0m | // Objetivo: 75% PV adulta al entore (noviembre, ~180d desde mayo 2°inv)
09:53:09.003  [2m 677[0m | // NRC 2000; INTA Rafaela
09:53:09.003  [2m 678[0m | function calcPvEntradaVaq2(pvSalidaVaq1) {
09:53:09.003  [2m 679[0m |   // agosto → mayo próximo = ~270 días
09:53:09.003  [2m 680[0m |   const GDP_PRIMVERA = 300; // g/d promedio campo libre (gramíneas C4)
09:53:09.003  [2m 681[0m |   const diasPrimVer  = 270;
09:53:09.003  [2m 682[0m |   return Math.round((parseFloat(pvSalidaVaq1) || 0) + GDP_PRIMVERA * diasPrimVer / 1000);
09:53:09.003  [2m 683[0m | }
09:53:09.003  [2m 684[0m | 
09:53:09.003  [2m 685[0m | // ─── VAQUILLONA 2° INVIERNO — GDP mínimo 300 g/d obligatorio ────
09:53:09.003  [2m 686[0m | // Regla: Vaq2 SIEMPRE necesita suplementación en invierno NEA
09:53:09.003  [2m 687[0m | // GDP mínimo invierno: 300 g/d (pastizal solo da 200-250 g/d sin suplemento)
09:53:09.003  [2m 688[0m | // Objetivo entore (noviembre): 75% PV adulto
09:53:09.003  [2m 689[0m | // Suplementación estratégica: semilla algodón ad libitum viable (>280 kg PV)
09:53:09.003  [2m 690[0m | // Fuente: Balbuena INTA 2003; Rosello Brajovich 2025
09:53:09.003  [2m 691[0m | // Vaq2° invierno: mínimo 330 g/d → garantiza 40 kg en 122 días
09:53:09.003  [2m 692[0m | // SIEMPRE requiere suplementación — pasto solo da <200 g/d en invierno NEA
09:53:09.003  [2m 693[0m | const GDP_MIN_VAQ2 = 330; // g/d — mínimo invierno, nunca sin suplementar
09:53:09.003  [2m 694[0m | 
09:53:09.003  [2m 695[0m | function calcVaq2(pvEntradaVaq1Sal, pvAdulta, ndvi, disponMS, fenologia) {
09:53:09.003  [2m 696[0m |   const pvSal1 = parseFloat(pvEntradaVaq1Sal) || 0;
09:53:09.003  [2m 697[0m |   const pva    = parseFloat(pvAdulta) || 320;
09:53:09.003  [2m 698[0m |   if (!pvSal1) return { _aviso:"PV se calcula automáticamente desde la salida del 1° invierno." };
09:53:09.003  [2m 699[0m |   // Vaq2 SIEMPRE necesita suplementación — pasto solo da 120-250 g/d en invierno NEA
09:53:09.003  [2m 700[0m |   // Sin suplemento llega a destino con déficit de PV irrecuperable antes del entore
09:53:09.003  [2m 701[0m | 
09:53:09.003  [2m 702[0m |   const pvMayo2Inv      = calcPvEntradaVaq2(pvSal1);
09:53:09.003  [2m 703[0m |   const pvMinEntore     = Math.round(pva * 0.75);
09:53:09.003  [2m 704[0m |   const diasInv         = 90;  // mayo → agosto (período suplementación invernal)
09:53:09.003  [2m 705[0m |   const diasHastaEntore = 180; // mayo → noviembre
09:53:09.003  [2m 706[0m |   const ndviN    = parseFloat(ndvi) || 0.45;
09:53:09.003  [2m 707[0m |   const nivelMS  = disponMS?.nivel || "media";
09:53:09.004  [2m 708[0m |   const calidadBaja = ["25_50","mayor_50"].includes(fenologia||"");
09:53:09.004  [2m 709[0m | 
09:53:09.004  [2m 710[0m |   // GDP del pasto en invierno (base sin suplemento)
09:53:09.004  [2m 711[0m |   const gdpPastoInv = nivelMS === "baja" ? 120 : nivelMS === "media" ? (ndviN > 0.45 ? 200 : 160) : 250;
09:53:09.004  [2m 712[0m | 
09:53:09.004  [2m 713[0m |   // Vaq2 SIEMPRE necesita suplementar — NO existe escenario "sin suplemento" en Vaq2
09:53:09.004  [2m 714[0m |   // El faltante mínimo es GDP_MIN_VAQ2 independientemente del pasto
09:53:09.004  [2m 715[0m |   const gdpFaltante   = Math.max(50, GDP_MIN_VAQ2 - gdpPastoInv);
09:53:09.004  [2m 716[0m |   const pvV2Agosto    = Math.round(pvMayo2Inv + GDP_MIN_VAQ2 * diasInv / 1000);
09:53:09.004  [2m 717[0m |   const gdpPrimavera  = 450; // g/d post-agosto con pasto disponible
09:53:09.004  [2m 718[0m |   const pvEntore      = Math.round(pvV2Agosto + gdpPrimavera * (diasHastaEntore - diasInv) / 1000);
09:53:09.004  [2m 719[0m |   const llegas        = pvEntore >= pvMinEntore;
09:53:09.004  [2m 720[0m | 
09:53:09.004  [2m 721[0m |   // Suplementación necesaria para lograr GDP_MIN_VAQ2
09:53:09.004  [2m 722[0m |   // Si hay poca cantidad → proteína + energía (no semilla algodón en Vaq1, SÍ en Vaq2)
09:53:09.004  [2m 723[0m |   let protKg, energKg, fuenteEnerg, freq, freqDetalle, alertaAlgodon;
09:53:09.004  [2m 724[0m |   if (gdpFaltante > 0) {
09:53:09.004  [2m 725[0m |     protKg  = Math.round(pvMayo2Inv * 0.005 * 10) / 10; // 0.5% PV como base
09:53:09.004  [2m 726[0m |     // Semilla de algodón es viable ad libitum en Vaq2 (>280 kg PV)
09:53:09.004  [2m 727[0m |     const usaSemAlg = pvMayo2Inv >= 280;
09:53:09.004  [2m 728[0m |     if (usaSemAlg) {
09:53:09.004  [2m 729[0m |       energKg      = Math.round(pvMayo2Inv * 0.004 * 10) / 10; // hasta consumo voluntario
09:53:09.004  [2m 730[0m |       fuenteEnerg  = "Semilla de algodón (ad libitum — apta Vaq2° invierno >280 kg)";
09:53:09.004  [2m 731[0m |       freq         = calidadBaja ? "Diario" : "2–3 veces/semana";
09:53:09.004  [2m 732[0m |       freqDetalle  = calidadBaja ? "Calidad pasto baja → diario" : "Solo proteína/grasa → 2–3×/semana";
09:53:09.004  [2m 733[0m |       alertaAlgodon = null; // ad libitum permitido en Vaq2
09:53:09.004  [2m 734[0m |     } else {
09:53:09.004  [2m 735[0m |       energKg     = nivelMS === "baja" ? Math.round(pvMayo2Inv * 0.003 * 10) / 10 : 0;
09:53:09.004  [2m 736[0m |       fuenteEnerg = energKg > 0 ? "Sorgo molido o maíz molido (DIARIO — no intermitente)" : null;
09:53:09.004  [2m 737[0m |       freq        = energKg > 0 ? "Diario" : "2–3 veces/semana";
09:53:09.004  [2m 738[0m |       freqDetalle = energKg > 0 ? "Incluye almidón → diario obligatorio" : "Solo proteína → 2–3×/semana";
09:53:09.004  [2m 739[0m |       alertaAlgodon = `Semilla algodón disponible a partir de ${280}kg PV — este animal tiene ${Math.round(pvMayo2Inv)}kg`;
09:53:09.004  [2m 740[0m |     }
09:53:09.004  [2m 741[0m |   } else {
09:53:09.004  [2m 742[0m |     protKg = 0.3; energKg = 0;
09:53:09.004  [2m 743[0m |     freq = "2–3 veces/semana"; freqDetalle = "Proteína mínima de mantenimiento";
09:53:09.004  [2m 744[0m |     fuenteEnerg = null; alertaAlgodon = null;
09:53:09.005  [2m 745[0m |   }
09:53:09.005  [2m 746[0m | 
09:53:09.005  [2m 747[0m |   const gdpConSupl = GDP_MIN_VAQ2;
09:53:09.005  [2m 748[0m |   const esc = gdpFaltante > 150 ? "C" : gdpFaltante > 80 ? "B" : "A";
09:53:09.005  [2m 749[0m | 
09:53:09.005  [2m 750[0m |   return {
09:53:09.005  [2m 751[0m |     esc, pvMayo2Inv, pvV2Agosto, pvEntore, pvMinEntore,
09:53:09.005  [2m 752[0m |     gdpInv: gdpConSupl, gdpPrimavera, llegas,
09:53:09.005  [2m 753[0m |     protKg, energKg, fuenteEnerg, freq, freqDetalle, alertaAlgodon,
09:53:09.005  [2m 754[0m |     nivelMS, gdpPastoInv, gdpFaltante,
09:53:09.005  [2m 755[0m |     mensajeBase: `Vaq2° requiere mínimo ${GDP_MIN_VAQ2}g/d en invierno — sin suplemento solo logra ${gdpPastoInv}g/d`,
09:53:09.005  [2m 756[0m |   };
09:53:09.005  [2m 757[0m | }
09:53:09.005  [2m 758[0m | 
09:53:09.005  [2m 759[0m | // ─── VACAS 2° SERVICIO — MOTOR COMPLETO ─────────────────────────
09:53:09.005  [2m 760[0m | // Categoría crítica: crecimiento + lactación + gestación simultáneos
09:53:09.005  [2m 761[0m | // Requerimientos NRC 2000: +10-15% sobre vaca adulta en lactación
09:53:09.005  [2m 762[0m | // Umbral anestro: entre 1° parto (mayor) y adulta
09:53:09.005  [2m 763[0m | function calcV2S(pvV2s, pvAdulta, ccActual, conTernero, biotipo, cadena) {
09:53:09.005  [2m 764[0m |   const pv   = parseFloat(pvV2s)   || 0;
09:53:09.005  [2m 765[0m |   const pva  = parseFloat(pvAdulta) || 320;
09:53:09.005  [2m 766[0m |   const ccA  = parseFloat(ccActual) || 0;
09:53:09.005  [2m 767[0m |   if (!pv || !ccA) return null;
09:53:09.005  [2m 768[0m | 
09:53:09.005  [2m 769[0m |   const bt       = getBiotipo(biotipo);
09:53:09.006  [2m 770[0m |   // Tasa de movilización/recuperación ligeramente mayor que adulta (aún crecen)
09:53:09.006  [2m 771[0m |   const tR = Math.max(0.007, 0.013 * bt.recCC * 0.95);
09:53:09.006  [2m 772[0m |   const tP = 0.008; // pierden CC más rápido que adulta en lactación
09:53:09.006  [2m 773[0m | 
09:53:09.006  [2m 774[0m |   // Umbral anestro: entre 1°parto y adulta
09:53:09.006  [2m 775[0m |   const umbralAnestro = bt.umbralAnestro + 0.15;
09:53:09.006  [2m 776[0m | 
09:53:09.006  [2m 777[0m |   // Días hasta próximo parto (desde cadena reproductiva principal)
09:53:09.006  [2m 778[0m |   const diasHastaParto = cadena ? Math.max(0, cadena.diasPartoTemp || 90) : 90;
09:53:09.007  [2m 779[0m | 
09:53:09.007  [2m 780[0m |   // CC al 2° parto
09:53:09.007  [2m 781[0m |   const ccParto2 = parseFloat(Math.min(8, Math.max(1.5,
09:53:09.007  [2m 782[0m |     ccA + tR * Math.min(diasHastaParto, 90) - tP * Math.max(0, diasHastaParto - 90)
09:53:09.007  [2m 783[0m |   )).toFixed(2));
09:53:09.007  [2m 784[0m | 
09:53:09.007  [2m 785[0m |   // Lactación: 2° parto → típicamente destete anticipado o hiperprecoz en V2S
09:53:09.007  [2m 786[0m |   const mesesLact2 = conTernero ? 3.0 : 1.5; // con ternero al pie = 3 meses prom.
09:53:09.008  [2m 787[0m |   const tasaCaida  = (ccParto2 >= 5 ? 0.55 : 0.65) * bt.movCC * 1.10; // +10% vs adulta
09:53:09.008  [2m 788[0m |   const caidaLact2 = Math.min(2.5, mesesLact2 * tasaCaida);
09:53:09.008  [2m 789[0m |   const ccMin2     = Math.max(1.5, ccParto2 - caidaLact2);
09:53:09.008  [2m 790[0m | 
09:53:09.008  [2m 791[0m |   // Días de anestro (más prolongado que adulta, menos que 1° parto)
09:53:09.008  [2m 792[0m |   const defCC = Math.max(0, umbralAnestro - ccParto2);
09:53:09.008  [2m 793[0m |   const defMin = Math.max(0, 2.2 - ccMin2);
09:53:09.008  [2m 794[0m |   const diasAnestro = Math.round(60 + defCC * 32 + defMin * 28); // base 60d (entre 50d adulta y 70d 1°parto)
09:53:09.008  [2m 795[0m |   const riesgoAnestro = diasAnestro > 60;
09:53:09.008  [2m 796[0m | 
09:53:09.009  [2m 797[0m |   // CC al servicio
09:53:09.009  [2m 798[0m |   const ccServ2 = parseFloat(Math.min(8, Math.max(1.5,
09:53:09.009  [2m 799[0m |     ccMin2 + tR * 75
09:53:09.009  [2m 800[0m |   )).toFixed(2));
09:53:09.009  [2m 801[0m | 
09:53:09.009  [2m 802[0m |   // Preñez en 2° servicio
09:53:09.009  [2m 803[0m |   const prenez2 = interpCC(ccServ2).pr;
09:53:09.009  [2m 804[0m | 
09:53:09.015  [2m 805[0m |   // Requerimiento energético propio (NRC 2000: vaca 2° parto lactando = f*1.10 vs adulta)
09:53:09.015  [2m 806[0m |   const reqV2s = reqEM(pv, "Vaca 1° parto lactando", biotipo); // usa factor 2.10 — el más alto
09:53:09.015  [2m 807[0m | 
09:53:09.016  [2m 808[0m |   // Déficit estimado con pasto actual
09:53:09.016  [2m 809[0m |   return {
09:53:09.016  [2m 810[0m |     ccActual: ccA,
09:53:09.016  [2m 811[0m |     ccParto:  ccParto2,
09:53:09.016  [2m 812[0m |     ccMin:    ccMin2,
09:53:09.017  [2m 813[0m |     ccServ:   ccServ2,
09:53:09.017  [2m 814[0m |     prenez:   prenez2,
09:53:09.017  [2m 815[0m |     diasAnestro,
09:53:09.017  [2m 816[0m |     riesgoAnestro,
09:53:09.017  [2m 817[0m |     mesesLact: mesesLact2.toFixed(1),
09:53:09.017  [2m 818[0m |     caidaLact: caidaLact2.toFixed(2),
09:53:09.017  [2m 819[0m |     reqMcal:  reqV2s,
09:53:09.017  [2m 820[0m |     conTernero,
09:53:09.017  [2m 821[0m |     critico: ccParto2 < 4.5 || diasAnestro > 70 || prenez2 < 35,
09:53:09.017  [2m 822[0m |   };
09:53:09.018  [2m 823[0m | }
09:53:09.018  [2m 824[0m | 
09:53:09.018  [2m 825[0m | // ─── TABLA SUPERVIVENCIA (Rosello Brajovich et al. 2025 — INTA Colonia Benítez) ──
09:53:09.018  [2m 826[0m | // Cuadro 2: Probabilidad supervivencia (%) × CC × estado preñez
09:53:09.018  [2m 827[0m | // CC mapeada a escala 1–9: MuyFlaca≤3, Flaca=4, Regular=5, Buena≥6
09:53:09.018  [2m 828[0m | const TABLA_SUPERV = {
09:53:09.018  [2m 829[0m |   // estado: [MuyFlaca, Flaca, Regular, Buena]
09:53:09.018  [2m 830[0m |   "Vacía":               [45, 50, 79, 99],
09:53:09.018  [2m 831[0m |   "Preñez chica (cola)": [36, 41, 70, 90],
09:53:09.018  [2m 832[0m |   "Preñez media (cuerpo)":[23, 28, 57, 77],
09:53:09.018  [2m 833[0m |   "Preñez grande (cabeza)":[10, 14, 44, 64],
09:53:09.018  [2m 834[0m | };
09:53:09.018  [2m 835[0m | function ccACategSuperv(cc) {
09:53:09.018  [2m 836[0m |   const c = parseFloat(cc) || 0;
09:53:09.018  [2m 837[0m |   if (c <= 3.0) return 0; // Muy flaca
09:53:09.018  [2m 838[0m |   if (c <= 4.0) return 1; // Flaca
09:53:09.018  [2m 839[0m |   if (c <= 5.0) return 2; // Regular
09:53:09.018  [2m 840[0m |   return 3;               // Buena (≥6 escala INTA, ≥5.5 escala 1–9)
09:53:09.018  [2m 841[0m | }
09:53:09.018  [2m 842[0m | function calcSupervivencia(cc, eReprod) {
09:53:09.018  [2m 843[0m |   // Mapear estado reproductivo al índice de la tabla
09:53:09.018  [2m 844[0m |   const estadoMap = {
09:53:09.018  [2m 845[0m |     "Vaca seca sin ternero":           "Vacía",
09:53:09.018  [2m 846[0m |     "Gestación temprana (1–4 meses)":  "Preñez chica (cola)",
09:53:09.018  [2m 847[0m |     "Gestación media (5–7 meses)":     "Preñez media (cuerpo)",
09:53:09.018  [2m 848[0m |     "Preparto (último mes)":           "Preñez grande (cabeza)",
09:53:09.018  [2m 849[0m |     "Lactación con ternero al pie":    "Preñez media (cuerpo)",
09:53:09.019  [2m 850[0m |     "Vaca 1° parto lactando":          "Preñez media (cuerpo)",
09:53:09.019  [2m 851[0m |   };
09:53:09.019  [2m 852[0m |   const estado = estadoMap[eReprod] || "Preñez media (cuerpo)";
09:53:09.019  [2m 853[0m |   const fila   = TABLA_SUPERV[estado] || TABLA_SUPERV["Preñez media (cuerpo)"];
09:53:09.019  [2m 854[0m |   const colIdx = ccACategSuperv(cc);
09:53:09.019  [2m 855[0m |   const pct    = fila[colIdx];
09:53:09.019  [2m 856[0m |   const riesgo = pct < 50 ? "critico" : pct < 70 ? "alto" : pct < 85 ? "medio" : "bajo";
09:53:09.019  [2m 857[0m |   return { pct, estado, riesgo, colIdx };
09:53:09.019  [2m 858[0m | }
09:53:09.019  [2m 859[0m | 
09:53:09.019  [2m 860[0m | // ─── CADENA REPRODUCTIVA ──────────────────────────────────────────
09:53:09.019  [2m 861[0m | function calcCadena(iniServ, finServ) {
09:53:09.019  [2m 862[0m |   if (!iniServ || !finServ) return null;
09:53:09.019  [2m 863[0m |   const ini = new Date(iniServ + "T12:00:00");
09:53:09.019  [2m 864[0m |   const fin = new Date(finServ + "T12:00:00");
09:53:09.019  [2m 865[0m |   if (isNaN(ini) || isNaN(fin) || fin <= ini) return null;
09:53:09.019  [2m 866[0m | 
09:53:09.019  [2m 867[0m |   const diasServ    = Math.round((fin - ini) / (1000*60*60*24));
09:53:09.019  [2m 868[0m |   const partoTemp   = new Date(ini); partoTemp.setDate(partoTemp.getDate() + 280);
09:53:09.019  [2m 869[0m |   const partoTard   = new Date(fin); partoTard.setDate(partoTard.getDate() + 280);
09:53:09.019  [2m 870[0m |   const hoy         = new Date();
09:53:09.019  [2m 871[0m |   const diasPartoTemp = Math.round((partoTemp - hoy) / (1000*60*60*24));
09:53:09.019  [2m 872[0m |   const diasPartoTard = Math.round((partoTard - hoy) / (1000*60*60*24));
09:53:09.019  [2m 873[0m | 
09:53:09.019  [2m 874[0m |   const GDP = { trad:0.400, antic:0.350, hiper:0.250 };
09:53:09.019  [2m 875[0m |   const calcTipo = (refParto, diasLact, gdpPost) => {
09:53:09.019  [2m 876[0m |     const pvDest  = Math.round(35 + 0.700 * diasLact);
09:53:09.020  [2m 877[0m |     const desteT  = new Date(refParto); desteT.setDate(desteT.getDate() + diasLact);
09:53:09.020  [2m 878[0m |     const anoRef  = desteT.getFullYear();
09:53:09.020  [2m 879[0m |     const mayo1c  = new Date(anoRef, 4, 1);
09:53:09.020  [2m 880[0m |     const mayo1   = mayo1c > desteT ? mayo1c : new Date(anoRef+1, 4, 1);
09:53:09.020  [2m 881[0m |     const diasPost = Math.max(0, Math.round((mayo1 - desteT) / (1000*60*60*24)));
09:53:09.020  [2m 882[0m |     const pvMayo  = Math.round(pvDest + gdpPost * diasPost);
09:53:09.020  [2m 883[0m |     const mesDeste = desteT.getMonth();
09:53:09.020  [2m 884[0m |     return { desteT, pvDest, pvMayo, terneroOtono: mesDeste >= 4 && mesDeste <= 5, diasLact };
09:53:09.020  [2m 885[0m |   };
09:53:09.021  [2m 886[0m | 
09:53:09.021  [2m 887[0m |   const tiposTrad     = calcTipo(partoTemp, 180, GDP.trad);
09:53:09.021  [2m 888[0m |   const tiposAntic    = calcTipo(partoTemp, 90,  GDP.antic);
09:53:09.021  [2m 889[0m |   const tiposHiper    = calcTipo(partoTemp, 50,  GDP.hiper);
09:53:09.021  [2m 890[0m |   const tipoTardTrad  = calcTipo(partoTard, 180, GDP.trad);
09:53:09.021  [2m 891[0m | 
09:53:09.021  [2m 892[0m |   const nacVaq    = new Date(partoTemp); nacVaq.setDate(nacVaq.getDate() + 45);
09:53:09.021  [2m 893[0m |   const anoNacVaq = nacVaq.getFullYear();
09:53:09.021  [2m 894[0m |   const mayo1Inv  = new Date(anoNacVaq, 4, 1) > nacVaq
09:53:09.022  [2m 895[0m |     ? new Date(anoNacVaq, 4, 1)
09:53:09.022  [2m 896[0m |     : new Date(anoNacVaq+1, 4, 1);
09:53:09.022  [2m 897[0m |   const edadMayo   = Math.round((mayo1Inv - nacVaq) / (1000*60*60*24*30));
09:53:09.022  [2m 898[0m |   const pvMayo1Inv = Math.round(35 + 0.700 * (mayo1Inv - nacVaq) / (1000*60*60*24));
09:53:09.022  [2m 899[0m | 
09:53:09.022  [2m 900[0m |   return {
09:53:09.022  [2m 901[0m |     ini, fin, diasServ, partoTemp, partoTard, diasPartoTemp, diasPartoTard,
09:53:09.022  [2m 902[0m |     terneroOtono: tiposTrad.terneroOtono,
09:53:09.022  [2m 903[0m |     desteTemp:    tiposTrad.desteT,
09:53:09.022  [2m 904[0m |     desteTard:    tipoTardTrad.desteT,
09:53:09.023  [2m 905[0m |     tipos: {
09:53:09.023  [2m 906[0m |       trad:  { desteTemp:tiposTrad.desteT,  desteTard:tipoTardTrad.desteT, pvDest:tiposTrad.pvDest,  pvMayo:tiposTrad.pvMayo,  terneroOtono:tiposTrad.terneroOtono,  diasLact:180 },
09:53:09.023  [2m 907[0m |       antic: { desteTemp:tiposAntic.desteT, desteTard:tipoTardTrad.desteT, pvDest:tiposAntic.pvDest, pvMayo:tiposAntic.pvMayo, terneroOtono:tiposAntic.terneroOtono, diasLact:90  },
09:53:09.023  [2m 908[0m |       hiper: { desteTemp:tiposHiper.desteT, desteTard:tipoTardTrad.desteT, pvDest:tiposHiper.pvDest, pvMayo:tiposHiper.pvMayo, terneroOtono:tiposHiper.terneroOtono, diasLact:50  },
09:53:09.023  [2m 909[0m |     },
09:53:09.024  [2m 910[0m |     nacVaq, mayo1Inv, edadMayo, pvMayo1Inv,
09:53:09.024  [2m 911[0m |   };
09:53:09.024  [2m 912[0m | }
09:53:09.024  [2m 913[0m | 
09:53:09.024  [2m 914[0m | // ═══════════════════════════════════════════════════════
09:53:09.024  [2m 915[0m | // MÓDULO AGUA DE BEBIDA
09:53:09.024  [2m 916[0m | // López et al. 2021, JAS 99(8):skab215
09:53:09.024  [2m 917[0m | // Winchester & Morris 1956 / NRC 2000
09:53:09.025  [2m 918[0m | // ═══════════════════════════════════════════════════════
09:53:09.025  [2m 919[0m | const AGUA_CATEGORIAS = [
09:53:09.025  [2m 920[0m |   { min:0,     max:1000,      label:"Excelente",     color:"#7ec850", riesgo:0, desc:"Sin restricción. Sin impacto en consumo ni performance." },
09:53:09.025  [2m 921[0m |   { min:1000,  max:3000,      label:"Satisfactoria", color:"#a8d870", riesgo:1, desc:"Aceptable para todas las categorías. Impacto mínimo en DMI (<2%)." },
09:53:09.025  [2m 922[0m |   { min:3000,  max:5000,      label:"Moderada",      color:"#e8a030", riesgo:2, desc:"Puede reducir DMI 2–5% y WI hasta 8%. Monitorear en lactación y gestación tardía." },
09:53:09.025  [2m 923[0m |   { min:5000,  max:7000,      label:"Alta salinidad",color:"#d46820", riesgo:3, desc:"Reducción DMI 5–12%, WI 10–20%. Evitar en vaquillonas y lactación." },
09:53:09.025  [2m 924[0m |   { min:7000,  max:10000,     label:"Problemática",  color:"#e05530", riesgo:4, desc:"Reducción severa DMI >12%. Contraindicada en categorías productivas." },
09:53:09.025  [2m 925[0m |   { min:10000, max:Infinity,  label:"No apta",       color:"#c02010", riesgo:5, desc:"No usar en bovinos. Riesgo de intoxicación salina, diarrea, muerte." },
09:53:09.026  [2m 926[0m | ];
09:53:09.026  [2m 927[0m | const TIPOS_SAL = {
09:53:09.026  [2m 928[0m |   "NaCl dominante":    { factor:1.00, nota:"Efecto cuadrático. Tolerancia relativamente mayor." },
09:53:09.026  [2m 929[0m |   "SO4 dominante":     { factor:1.35, nota:"⚠️ ATENCIÓN: Efecto lineal y más severo. Sulfatos reducen más DMI y WI que cloruros a igual TDS (López et al. 2021)." },
09:53:09.026  [2m 930[0m |   "Mixta/Desconocida": { factor:1.15, nota:"Asumir efecto intermedio. Analizar muestra para caracterizar." },
09:53:09.026  [2m 931[0m | };
09:53:09.026  [2m 932[0m | 
09:53:09.026  [2m 933[0m | function calcConsumoAgua(pvVaca, tempC, lactando) {
09:53:09.026  [2m 934[0m |   // Winchester & Morris 1956 / NRC 2000 / Beede 1992
09:53:09.026  [2m 935[0m |   // Base: ~0.066 L/kg PV/día a 25°C; ajuste exponencial por temperatura
09:53:09.027  [2m 936[0m |   // Ajuste por categoría: lactando +50–60%, gestación tardía +20%
09:53:09.027  [2m 937[0m |   const pv   = parseFloat(pvVaca) || 320;
09:53:09.027  [2m 938[0m |   const t    = parseFloat(tempC)  || 25;
09:53:09.027  [2m 939[0m |   // Consumo base a temperatura dada: aumenta marcadamente >25°C
09:53:09.027  [2m 940[0m |   const base = pv * 0.066 * Math.pow(Math.max(10, t) / 20, 1.1);
09:53:09.027  [2m 941[0m |   const mult = lactando ? 1.55 : 1.0; // lactación eleva consumo 50–60% (NRC 2000)
09:53:09.027  [2m 942[0m |   return Math.round(base * mult);
09:53:09.027  [2m 943[0m | }
09:53:09.027  [2m 944[0m | 
09:53:09.028  [2m 945[0m | function evaluarAgua(tds, tipoSal, pvVaca, tempC, lactando, enso) {
09:53:09.028  [2m 946[0m |   if (!tds || tds <= 0) return null;
09:53:09.028  [2m 947[0m |   const tdsN = parseFloat(tds);
09:53:09.028  [2m 948[0m |   const cat  = AGUA_CATEGORIAS.find(c => tdsN >= c.min && tdsN < c.max) || AGUA_CATEGORIAS[AGUA_CATEGORIAS.length-1];
09:53:09.028  [2m 949[0m |   const ts   = TIPOS_SAL[tipoSal] || TIPOS_SAL["Mixta/Desconocida"];
09:53:09.028  [2m 950[0m |   const tdsEfectivo = tdsN * ts.factor;
09:53:09.028  [2m 951[0m |   const catEfect    = AGUA_CATEGORIAS.find(c => tdsEfectivo >= c.min && tdsEfectivo < c.max) || AGUA_CATEGORIAS[AGUA_CATEGORIAS.length-1];
09:53:09.028  [2m 952[0m | 
09:53:09.028  [2m 953[0m |   // Reducción DMI (consumo de MS total: pasto + suplemento) y consumo de agua
09:53:09.029  [2m 954[0m |   // López et al. 2021, JAS 99(8):skab215; Beede 1992
09:53:09.029  [2m 955[0m |   let pctReducDMI = 0, pctReducWI = 0;
09:53:09.029  [2m 956[0m |   if (tdsN > 3000) {
09:53:09.029  [2m 957[0m |     pctReducDMI = Math.min(30, ((tdsN-3000)/1000) * 2.5 * ts.factor);
09:53:09.029  [2m 958[0m |     pctReducWI  = Math.min(40, ((tdsN-3000)/1000) * 3.5 * ts.factor);
09:53:09.029  [2m 959[0m |   }
09:53:09.029  [2m 960[0m |   // La reducción de DMI se refleja directamente en consumo de pasto:
09:53:09.029  [2m 961[0m |   // cuando el animal toma menos agua, reduce ingesta voluntaria de MS
09:53:09.029  [2m 962[0m |   const pctReducPasto = pctReducDMI; // equivalente — 1:1 (López et al. 2021)
09:53:09.030  [2m 963[0m |   const consumoEsperado = calcConsumoAgua(pvVaca, tempC, lactando);
09:53:09.030  [2m 964[0m |   const alertaEnso = enso === "nina"
09:53:09.031  [2m 965[0m |     ? "⚠️ La Niña: mayor concentración de sales esperada en aguadas superficiales. Revisar TDS periódicamente."
09:53:09.031  [2m 966[0m |     : null;
09:53:09.031  [2m 967[0m | 
09:53:09.031  [2m 968[0m |   const warnings = [];
09:53:09.031  [2m 969[0m |   if (cat.riesgo >= 3) {
09:53:09.031  [2m 970[0m |     warnings.push({ nivel:"rojo",  msg:`TDS ${tdsN} mg/L (${cat.label}): ↓DMI −${pctReducDMI.toFixed(0)}% · ↓Pasto consumido −${pctReducPasto.toFixed(0)}% · ↓Agua −${pctReducWI.toFixed(0)}%. (López et al. 2021)` });
09:53:09.031  [2m 971[0m |   } else if (cat.riesgo === 2) {
09:53:09.031  [2m 972[0m |     warnings.push({ nivel:"ambar", msg:`TDS ${tdsN} mg/L (${cat.label}): reducción DMI y pasto consumido ≤5%. Monitorear en lactación y preparto.` });
09:53:09.031  [2m 973[0m |   } else {
09:53:09.031  [2m 974[0m |     warnings.push({ nivel:"verde", msg:`TDS ${tdsN} mg/L (${cat.label}): calidad adecuada para todas las categorías.` });
09:53:09.031  [2m 975[0m |   }
09:53:09.031  [2m 976[0m |   if (ts.factor > 1.1)  warnings.push({ nivel:"ambar", msg:ts.nota });
09:53:09.031  [2m 977[0m |   if (alertaEnso)        warnings.push({ nivel:"ambar", msg:alertaEnso });
09:53:09.031  [2m 978[0m |   if (parseFloat(tempC) > 32) {
09:53:09.031  [2m 979[0m |     warnings.push({ nivel:"ambar", msg:`Temperatura ${tempC}°C: consumo estimado ${consumoEsperado}L/vaca/día. Asegurar caudal y acceso (mín. 5 cm lineal/vaca).` });
09:53:09.031  [2m 980[0m |   }
09:53:09.031  [2m 981[0m |   return { cat, catEfect, tdsN, tdsEfectivo, pctReducDMI, pctReducWI, pctReducPasto, consumoEsperado, warnings, tipoSal, ts };
09:53:09.031  [2m 982[0m | }
09:53:09.031  [2m 983[0m | 
09:53:09.031  [2m 984[0m | // ═══════════════════════════════════════════════════════
09:53:09.031  [2m 985[0m | // MÓDULO SANIDAD
09:53:09.031  [2m 986[0m | // ═══════════════════════════════════════════════════════
09:53:09.032  [2m 987[0m | const ENFERMEDADES_REPROD = [
09:53:09.032  [2m 988[0m |   { nombre:"Aftosa (FMD)",                     impacto:"Caída producción láctea, cojeras, anorexia, reducción condición corporal. Erradicación obligatoria (SENASA). Puede causar abortos por fiebre.",           alerta:"alta"  },
09:53:09.032  [2m 989[0m |   { nombre:"Brucelosis",                        impacto:"Aborto masivo al 7° mes. Zoonosis. Control oficial obligatorio — vacunación obligatoria en terneras 3–8 meses (Argentina).",                             alerta:"alta"  },
09:53:09.032  [2m 990[0m |   { nombre:"IBR/DVB",                           impacto:"Abortos 5–30%, anovulación, repetición de celos. Reducción preñez hasta −15 pp. Vacunación recomendada pre-servicio.",                                   alerta:"alta"  },
09:53:09.033  [2m 991[0m |   { nombre:"Leptospirosis",                     impacto:"Abortos tardíos, mortalidad neonatal, agalaxia. Frecuente en inundaciones NEA/Pantanal. Zoonosis.",                                                       alerta:"alta"  },
09:53:09.033  [2m 992[0m |   { nombre:"Tricomoniasis/Campylobacteriosis",  impacto:"Repetición de celos, abortos tempranos, infertilidad persistente. El toro es el vector principal — ESAN obligatorio.",                                    alerta:"media" },
09:53:09.033  [2m 993[0m |   { nombre:"Neospora caninum",                  impacto:"Abortos 5–20%, mortalidad neonatal. Perros como huéspedes definitivos. Sin vacuna disponible — control canino.",                                           alerta:"media" },
09:53:09.033  [2m 994[0m | ];
09:53:09.033  [2m 995[0m | 
09:53:09.033  [2m 996[0m | function evaluarSanidad(vacunas, brucelosis, aftosa, toros, historiaAbortos, programaSanit) {
09:53:09.033  [2m 997[0m |   const alerts = [];
09:53:09.033  [2m 998[0m |   if (!vacunas || vacunas === "no")
09:53:09.033  [2m 999[0m |     alerts.push({ nivel:"rojo",  msg:"⚠️ Sin vacunación IBR/DVB: riesgo de reducción de preñez hasta −15 pp. Consultar médico veterinario." });
09:53:09.033  [2m1000[0m |   if (brucelosis === "no")
09:53:09.033  [2m1001[0m |     alerts.push({ nivel:"rojo",  msg:"⚠️ Sin vacunación Brucelosis: obligatoria en terneras 3–8 meses (SENASA RES.114/21). Riesgo de aborto masivo al 7° mes. Zoonosis." });
09:53:09.034  [2m1002[0m |   if (aftosa === "no")
09:53:09.034  [2m1003[0m |     alerts.push({ nivel:"rojo",  msg:"⚠️ Sin vacunación Aftosa: obligatoria en Argentina — Plan Nacional SENASA. Dos dosis anuales mínimo. Riesgo de brote y restricción de mercado." });
09:53:09.035  [2m1004[0m |   if (toros === "sin_control")
09:53:09.035  [2m1005[0m |     alerts.push({ nivel:"rojo",  msg:"Toros sin evaluación ESAN: tricomoniasis/campylobacteriosis no detectadas. El toro en CC 4.0 es tan crítico como la vaca en CC 3.5." });
09:53:09.035  [2m1006[0m |   if (historiaAbortos === "si")
09:53:09.035  [2m1007[0m |     alerts.push({ nivel:"ambar", msg:"Historia de abortos: diagnóstico diferencial IBR/DVB/Leptospira/Neospora/Brucelosis prioritario antes del próximo servicio." });
09:53:09.035  [2m1008[0m |   if (programaSanit === "no" || !programaSanit)
09:53:09.035  [2m1009[0m |     alerts.push({ nivel:"ambar", msg:"Sin programa sanitario estructurado. La sanidad es el techo del sistema." });
09:53:09.035  [2m1010[0m |   return { alerts };
09:53:09.037  [2m1011[0m | }
09:53:09.037  [2m1012[0m | 
09:53:09.037  [2m1013[0m | // ═══════════════════════════════════════════════════════
09:53:09.037  [2m1014[0m | // HELPERS + GEOGRAFÍA
09:53:09.037  [2m1015[0m | // ═══════════════════════════════════════════════════════
09:53:09.037  [2m1016[0m | const fmtFecha = (d) => {
09:53:09.037  [2m1017[0m |   if (!d || isNaN(new Date(d))) return "—";
09:53:09.037  [2m1018[0m |   return new Date(d).toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit", year:"2-digit" });
09:53:09.037  [2m1019[0m | };
09:53:09.037  [2m1020[0m | const semaforo = (v, bajo, alto) => v >= alto ? "#7ec850" : v >= bajo ? "#d4952a" : "#c04820";
09:53:09.037  [2m1021[0m | const smf      = (v, bajo, alto) => v >= alto ? "#7ec850" : v >= bajo ? "#e8a030" : "#e05530";
09:53:09.037  [2m1022[0m | 
09:53:09.039  [2m1023[0m | function validarManual(lat, lon) {
09:53:09.039  [2m1024[0m |   if (isNaN(lat) || isNaN(lon))  return "Coordenadas inválidas — ingresá números.";
09:53:09.039  [2m1025[0m |   if (lat < -60 || lat > 15)     return "Latitud fuera del rango de Sudamérica (-60 a +15).";
09:53:09.039  [2m1026[0m |   if (lon < -85 || lon > -30)    return "Longitud fuera del rango de Sudamérica (-85 a -30).";
09:53:09.039  [2m1027[0m |   return null;
09:53:09.039  [2m1028[0m | }
09:53:09.039  [2m1029[0m | 
09:53:09.039  [2m1030[0m | // NDVI base por zona
09:53:09.039  [2m1031[0m | const ndviBase = {
09:53:09.039  [2m1032[0m |   "NEA":0.55,"Pampa Húmeda":0.50,"NOA":0.42,"Cuyo":0.30,
09:53:09.039  [2m1033[0m |   "Patagonia":0.28,"Patagonia Sur":0.25,"Neuquén / Río Negro":0.30,
09:53:09.039  [2m1034[0m |   "Paraguay Oriental":0.58,"Chaco Paraguayo":0.48,
09:53:09.039  [2m1035[0m |   "Mato Grosso / Goiás (BR)":0.55,"Mato Grosso do Sul (BR)":0.56,
09:53:09.039  [2m1036[0m |   "Rio Grande do Sul (BR)":0.52,"Pantanal (BR)":0.50,
09:53:09.039  [2m1037[0m |   "Santa Cruz / Beni (BO)":0.50,"Tarija / Chaco (BO)":0.44,
09:53:09.039  [2m1038[0m | };
09:53:09.039  [2m1039[0m | 
09:53:09.039  [2m1040[0m | async function fetchSat(lat, lon, zona, prov, enso, cb) {
09:53:09.039  [2m1041[0m |   try {
09:53:09.039  [2m1042[0m |     const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration&past_days=30&forecast_days=1&timezone=auto`;
09:53:09.039  [2m1043[0m |     const d   = await (await fetch(url)).json();
09:53:09.039  [2m1044[0m |     if (!d?.daily?.precipitation_sum) throw new Error("Sin datos");
09:53:09.039  [2m1045[0m | 
09:53:09.039  [2m1046[0m |     const prec = d.daily.precipitation_sum || [];
09:53:09.039  [2m1047[0m |     const tMax = d.daily.temperature_2m_max || [];
09:53:09.040  [2m1048[0m |     const tMin = d.daily.temperature_2m_min || [];
09:53:09.040  [2m1049[0m |     const et0  = d.daily.et0_fao_evapotranspiration || [];
09:53:09.040  [2m1050[0m | 
09:53:09.041  [2m1051[0m |     const p7   = Math.round(prec.slice(-7).reduce((a,b)=>a+(b||0),0));
09:53:09.041  [2m1052[0m |     const p30  = Math.round(prec.reduce((a,b)=>a+(b||0),0));
09:53:09.041  [2m1053[0m |     const et07 = Math.round(et0.slice(-7).reduce((a,b)=>a+(b||0),0));
09:53:09.041  [2m1054[0m |     const temp = parseFloat((
09:53:09.041  [2m1055[0m |       (tMax.slice(-7).reduce((a,b)=>a+(b||0),0) + tMin.slice(-7).reduce((a,b)=>a+(b||0),0))
09:53:09.041  [2m1056[0m |       / (Math.max(1, tMax.slice(-7).length) * 2)
09:53:09.041  [2m1057[0m |     ).toFixed(1));
09:53:09.041  [2m1058[0m | 
09:53:09.041  [2m1059[0m |     const m       = modENSO(enso);
09:53:09.041  [2m1060[0m |     const nb      = ndviBase[zona] || 0.48;
09:53:09.041  [2m1061[0m |     const ndviAdj = Math.min(0.95, Math.max(0.15, nb * (0.6 + p30/300) * m)).toFixed(2);
09:53:09.041  [2m1062[0m |     const cond    = ndviAdj > 0.60 ? "Excelente" : ndviAdj > 0.45 ? "Buena" : ndviAdj > 0.30 ? "Regular" : "Crítica";
09:53:09.041  [2m1063[0m | 
09:53:09.041  [2m1064[0m |     cb({ temp, tMax:Math.round(Math.max(...tMax.slice(-7))), tMin:Math.round(Math.min(...tMin.slice(-7))),
09:53:09.041  [2m1065[0m |          p7, p30, deficit:Math.round(p30 - et07*4.3), ndvi:ndviAdj, condForr:cond, et07 });
09:53:09.041  [2m1066[0m |   } catch (e) {
09:53:09.041  [2m1067[0m |     cb({ error:"No se pudieron obtener datos satelitales: " + e.message });
09:53:09.042  [2m1068[0m |   }
09:53:09.042  [2m1069[0m | }
09:53:09.042  [2m1070[0m | 
09:53:09.042  [2m1071[0m | const HELADAS_PROV = {
09:53:09.042       : [33;1m      ^^^^^^|^^^^^[0m
09:53:09.042       :             [33;1m`-- [33;1m`HELADAS_PROV` redefined here[0m[0m
09:53:09.042  [2m1072[0m |   "Formosa":{dia:15,mes:5},"Chaco":{dia:1,mes:5},"Corrientes":{dia:1,mes:5},
09:53:09.042  [2m1073[0m |   "Misiones":{dia:20,mes:4},"Entre Ríos":{dia:10,mes:4},"Santa Fe":{dia:10,mes:4},
09:53:09.042  [2m1074[0m |   "Santiago del Estero":{dia:25,mes:4},"Salta":{dia:15,mes:5},
09:53:09.042       `----
09:53:09.042 
09:53:09.042 Import trace for requested module:
09:53:09.042 ./lib/motor.js
09:53:09.042 ./pages/index.js
09:53:09.042 
09:53:09.042 
09:53:09.042 > Build failed because of webpack errors
09:53:09.042 Error: Command "npm run build" exited with 1
