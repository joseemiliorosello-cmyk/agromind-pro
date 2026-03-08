// ═══════════════════════════════════════════════════════════════════
// AGROMIND PRO v13 — MOTOR DEL MODELO
// Reescritura completa con biotipo, anestro posparto,
// suplementación endógena, sincronía ruminal
// ═══════════════════════════════════════════════════════════════════

// ─── BIOTIPOS ────────────────────────────────────────────────────
// Coeficientes por biotipo: movilización CC, recuperación, umbral anestro
// Fuentes: Peruchena INTA 2003; Selk 1988; Neel et al. 2007 (Bos indicus)
const BIOTIPOS = {
  "Brahman":           { movCC:0.70, recCC:0.85, umbralAnestro:2.8, factReq:0.90, nombre:"Brahman puro" },
  "Nelore":            { movCC:0.72, recCC:0.83, umbralAnestro:2.9, factReq:0.89, nombre:"Nelore" },
  "Brangus 3/8":       { movCC:0.82, recCC:0.92, umbralAnestro:3.2, factReq:0.95, nombre:"Brangus 3/8 Cebú" },
  "Brangus 5/8":       { movCC:0.88, recCC:0.96, umbralAnestro:3.4, factReq:0.98, nombre:"Brangus 5/8 Cebú" },
  "Aberdeen Angus":    { movCC:1.00, recCC:1.00, umbralAnestro:3.8, factReq:1.00, nombre:"Aberdeen Angus" },
  "Hereford":          { movCC:0.98, recCC:0.98, umbralAnestro:3.7, factReq:1.00, nombre:"Hereford" },
  "Cruza comercial":   { movCC:0.88, recCC:0.93, umbralAnestro:3.3, factReq:0.96, nombre:"Cruza comercial" },
  "Bonsmara/Simbrah":  { movCC:0.80, recCC:0.90, umbralAnestro:3.1, factReq:0.93, nombre:"Bonsmara/Simbrah" },
};
const BIOTIPO_DEF = BIOTIPOS["Brangus 3/8"];
const getBiotipo = (k) => BIOTIPOS[k] || BIOTIPO_DEF;

// ─── SUPLEMENTOS ─────────────────────────────────────────────────
// PB%, EM Mcal/kg MS, DegRum% proteína, DegRum% energía (para sincronía)
// Fuentes: Detmann et al. 2014 NASSEM; NRC 2000; Lana et al. 2005
const SUPLEMENTOS = {
  "Expeller soja":      { pb:44, em:2.80, degProt:65, degEner:75, precio:1.0, label:"Expeller soja" },
  "Expeller girasol":   { pb:36, em:2.60, degProt:60, degEner:72, precio:0.7, label:"Expeller girasol" },
  "Semilla algodón":    { pb:23, em:2.95, degProt:55, degEner:78, label:"Semilla de algodón (proteína bypass + grasa)" },
  "Urea tamponada":     { pb:280,em:0.00, degProt:100,degEner:0,  precio:1.2, label:"Urea tamponada" },
  "Maíz grano":         { pb:9,  em:3.30, degProt:50, degEner:82, precio:0.6, label:"Maíz grano" },
  "Sorgo grano":        { pb:10, em:3.10, degProt:52, degEner:80, precio:0.5, label:"Sorgo grano" },
  "Rollo silaje maíz":  { pb:8,  em:2.50, degProt:58, degEner:68, precio:0.3, label:"Rollo/Silaje maíz" },
  "Pellet trigo":       { pb:16, em:3.00, degProt:62, degEner:78, precio:0.8, label:"Pellet de trigo" },
  "Mix proteico-energ": { pb:28, em:2.90, degProt:65, degEner:76, precio:0.9, label:"Mix proteico-energético" },
};
const getSupl = (k) => SUPLEMENTOS[k] || SUPLEMENTOS["Expeller girasol"];

// ─── MODELO FORRAJERO ─────────────────────────────────────────────
const PROD_BASE = {
  "Pastizal natural NEA/Chaco":14,
  "Megatérmicas C4 (gatton panic, brachiaria)":22,
  "Pasturas templadas C3":16,
  "Mixta gramíneas+leguminosas":18,
  "Bosque nativo":2.5,
  "Verdeo de invierno":20,
};
const UTIL = 0.40;
const factorT   = (t) => t>=25?1.0:t>=20?0.80:t>=15?0.45:t>=10?0.15:0.05;
const factorP   = (p) => p>=100?1.0:p>=50?0.85:p>=20?0.60:0.30;
const factorN   = (ndvi) => Math.min(1.5,Math.max(0.5,0.5+parseFloat(ndvi||0.45)*1.2));
const modENSO   = (e) => e==="nino"?1.25:e==="nina"?0.75:1.0;
const mcalKgAdj = (t,fenol) => {
  const base = t>=25?2.10:t>=20?1.90:t>=15?1.50:t>=10?1.00:0.65;
  return base*({menor_10:1.00,"10_25":0.95,"25_50":0.85,mayor_50:0.72}[fenol]||1.00);
};
const fAprovFenol = (fenol) => ({menor_10:1.00,"10_25":0.90,"25_50":0.75,mayor_50:0.55}[fenol]||1.00);
const cvMSFenol  = (fenol) => ({menor_10:0.028,"10_25":0.024,"25_50":0.020,mayor_50:0.016}[fenol]||0.025);

// ─── PB% del pasto según fenología ───────────────────────────────
const pbPasto = (fenol) => ({menor_10:12,"10_25":9,"25_50":6,mayor_50:4}[fenol]||10);

function calcOfPasto(veg,ndvi,temp,precip,enso,fenol) {
  const pb = PROD_BASE[veg]||8;
  const kgMs = Math.max(0,pb*factorN(ndvi)*factorT(temp)*factorP(precip*modENSO(enso))*UTIL*fAprovFenol(fenol));
  return kgMs*mcalKgAdj(temp,fenol);
}

// ─── REQUERIMIENTOS EM ───────────────────────────────────────────
function reqEM(pv,cat,biotipo) {
  const p=parseFloat(pv)||0; if(!p) return null;
  const bFact = biotipo ? getBiotipo(biotipo).factReq : 1.0;
  const f={
    "Gestación temprana (1–4 meses)":1.15,
    "Gestación media (5–7 meses)":1.20,
    "Preparto (último mes)":1.35,
    "Lactación con ternero al pie":1.90,
    "Vaca seca sin ternero":1.00,
    "Vaca 1° parto lactando":2.10,  // +~10% sobre multipara
    vaq1inv:1.30, vaq2inv:1.20,
  }[cat]||1.10;
  return +(Math.pow(p,0.75)*0.077*f*bFact).toFixed(1);
}

// ─── SINCRONÍA RUMINAL ───────────────────────────────────────────
// Evalúa si el suplemento es eficiente con el pasto disponible
// Ideal: ratio PB_total / EM_total entre 10–14% PB en la dieta total
// Si pasto muy degradado + urea pura → riesgo ineficiencia/toxicidad
function evaluarSincronia(fenolPasto, supl, dosisKg) {
  if (!supl || !dosisKg) return null;
  const s = getSupl(supl);
  const pbP = pbPasto(fenolPasto);  // % PB del pasto
  const emP = mcalKgAdj(20, fenolPasto); // Mcal/kg pasto estimado
  // Consumo pasto aprox 10 kg MS/vaca/día (simplificado)
  const pbTotal = (pbP * 10 + s.pb * dosisKg) / (10 + dosisKg);
  const emSuplTotal = s.em * dosisKg;
  // Degradable rumen: energía fermentable disponible
  const degEnerTotal = (emSuplTotal * s.degEner / 100) + (emP * 10 * 0.72);
  const ureaEquiv = supl === "Urea tamponada" ? dosisKg : 0;
  const n_disponible = ureaEquiv * 0.46 * 6.25; // kg proteína equiv de urea
  const warnings = [];
  // Riesgo: urea con pasto de baja digestibilidad
  if (supl === "Urea tamponada" && fenolPasto === "mayor_50") {
    warnings.push({ nivel:"rojo", msg:"⚠️ RIESGO: Urea con pasto >50% floración — digestibilidad <55%. Energía fermentable insuficiente para microorganismos. Eficiencia muy baja y riesgo de intoxicación." });
  }
  if (supl === "Urea tamponada" && fenolPasto === "25_50") {
    warnings.push({ nivel:"ambar", msg:"Urea con pasto 25–50% floración — monitorear consumo. Mejor combinada con fuente energética (maíz/sorgo)." });
  }
  // Déficit proteico severo → fuente nitrogenada insuficiente
  if (pbTotal < 8 && s.pb < 20) {
    warnings.push({ nivel:"ambar", msg:`Proteína dietaria total estimada: ${pbTotal.toFixed(1)}% — por debajo del mínimo ruminal (8%). Considerar aumentar dosis o cambiar a fuente de mayor PB.` });
  }
  // Exceso proteico con buena oferta forrajera
  if (pbTotal > 18 && pbP > 10) {
    warnings.push({ nivel:"info", msg:`PB total estimada: ${pbTotal.toFixed(1)}% — posible exceso. Evaluar reducir dosis o cambiar a fuente energética.` });
  }
  return { pbTotal:+pbTotal.toFixed(1), emSupl:+emSuplTotal.toFixed(1), warnings, eficiente: warnings.filter(w=>w.nivel==="rojo").length===0 };
}

// ─── APORTE SUPLEMENTO EN MCAL/DÍA ──────────────────────────────
function mcalSuplemento(supl, dosisKg) {
  if (!supl || !dosisKg) return 0;
  return getSupl(supl).em * dosisKg;
}

// ─── ANESTRO POSPARTO MODELADO ───────────────────────────────────
// Basado en Short et al. 1990; Williams 1990; Neel et al. 2007
// Duración anestro (días) = f(CC al parto, CC mínima alcanzada, biotipo, primer parto)
function calcAnestro(ccParto, ccMinLact, biotipo, primerParto) {
  const bt = getBiotipo(biotipo||"Brangus 3/8");
  const umbral = primerParto ? bt.umbralAnestro + 0.3 : bt.umbralAnestro;
  // Base: vaca bien nutrida (CC parto ≥5) tarda ~45–60 días en retomar celo
  // Cada 0.5 unidades de CC por debajo del umbral → +15 días anestro
  const defCC = Math.max(0, umbral - ccParto);
  const defMin = Math.max(0, 2.0 - ccMinLact); // penalidad por caída severa
  const baseDias = primerParto ? 70 : 50;
  const diasAnestro = Math.round(baseDias + defCC*30 + defMin*25);
  // Si días anestro > días a inicio servicio → no llega ovulando
  return { dias: diasAnestro, riesgo: diasAnestro > 55 };
}

// ─── CC→PREÑEZ (Peruchena INTA 2003 + Selk 1988 Bos indicus) ────
const CC_PR = [
  {ccP:7.0,pr:97},{ccP:6.5,pr:95},{ccP:6.0,pr:88},{ccP:5.5,pr:75},
  {ccP:5.0,pr:55},{ccP:4.5,pr:35},{ccP:4.0,pr:20},{ccP:3.5,pr:8},{ccP:3.0,pr:3},
];
function interpCC(ccP) {
  if(ccP>=CC_PR[0].ccP) return {pr:CC_PR[0].pr};
  if(ccP<=CC_PR[CC_PR.length-1].ccP) return {pr:CC_PR[CC_PR.length-1].pr};
  for(let i=0;i<CC_PR.length-1;i++){
    if(ccP<=CC_PR[i].ccP&&ccP>=CC_PR[i+1].ccP){
      const r=(ccP-CC_PR[i+1].ccP)/(CC_PR[i].ccP-CC_PR[i+1].ccP);
      return {pr:Math.round(CC_PR[i+1].pr+r*(CC_PR[i].pr-CC_PR[i+1].pr))};
    }
  }
  return {pr:20};
}

// ─── TRAYECTORIA CC CON SUPLEMENTO + BIOTIPO ─────────────────────
function calcTrayectoriaCCv2(params) {
  const {
    dist, cadena, destTrad, destAntic, destHiper, dDisp, supHa, vacasN,
    biotipo, primerParto,
    // Suplementación
    supl1, dosis1,   // suplemento invierno gestación
    supl2, dosis2,   // suplemento lactancia
    supl3, dosis3,   // suplemento preparto
  } = params;

  const ccH = ccPond(dist);
  if(!ccH||!cadena) return null;
  const bt = getBiotipo(biotipo);
  const ha = parseFloat(supHa)||100;
  const vN = parseFloat(vacasN)||50;
  const cargaEV = vN/ha;
  const ajCarga = cargaEV>0.8?-0.004:cargaEV>0.5?-0.002:0;
  const tR = Math.max(0.006,(0.013+(0.45-0.35)*0.04+ajCarga)*bt.recCC);
  const tP = 0.007;
  const dD = Math.max(0,dDisp||90);

  const diasHastaParto = Math.max(0,cadena.diasPartoTemp||0);
  const diasRecupPreParto = Math.min(diasHastaParto,dD);
  const diasPerdPreParto  = Math.max(0,diasHastaParto-dD);

  // Mcal suplemento preparto → mejora recuperación pre-parto
  const mcalSuplPreP = mcalSuplemento(supl3,parseFloat(dosis3)||0);
  const boostPreParto = mcalSuplPreP>0 ? Math.min(0.3, mcalSuplPreP*0.04) : 0;

  const ccParto = parseFloat(Math.min(9,Math.max(1,
    ccH + tR*diasRecupPreParto - tP*diasPerdPreParto + boostPreParto
  )).toFixed(2));

  const pT=parseFloat(destTrad)||0,pA=parseFloat(destAntic)||0,pH=parseFloat(destHiper)||0;
  const tot=pT+pA+pH||100;
  const mesesLact=(pT*(180/30)+pA*(90/30)+pH*(50/30))/tot;

  // Tasa de caída: biotipo modifica el coeficiente base
  const tasaCaidaBase = ccParto>=6?0.40:ccParto>=5?0.50:0.60;
  const tasaCaida = tasaCaidaBase * bt.movCC;

  // Suplemento lactancia reduce caída de CC
  const mcalSuplLact = mcalSuplemento(supl2,parseFloat(dosis2)||0);
  const reducCaida = mcalSuplLact>0 ? Math.min(0.35, mcalSuplLact*0.035) : 0;

  const caídaLact = Math.min(2.5,mesesLact*(tasaCaida-reducCaida));
  const ccMinLact = Math.max(1,ccParto-caídaLact);

  // Anestro posparto
  const anestro = calcAnestro(ccParto,ccMinLact,biotipo,primerParto);

  const ccDestete = parseFloat(Math.max(1,ccMinLact).toFixed(2));
  const diasRecupServicio = Math.min(90,dD);

  // Suplemento invierno gestación → acelera recuperación post-destete
  const mcalSuplInv = mcalSuplemento(supl1,parseFloat(dosis1)||0);
  const boostPostDest = mcalSuplInv>0 ? Math.min(0.25, mcalSuplInv*0.03) : 0;

  const ccServ = parseFloat(Math.min(9,Math.max(1,
    ccDestete + (tR+boostPostDest)*diasRecupServicio
  )).toFixed(2));

  const pr = interpCC(ccServ).pr;
  const mesesLactStr = mesesLact.toFixed(1);

  return {
    ccHoy:ccH, ccParto, ccMinLact, ccDestete, ccServ, pr,
    mesesLact:mesesLactStr, caídaLact:caídaLact.toFixed(2),
    anestro, tasaCaida:tasaCaida.toFixed(3),
    diasRecupPreParto, diasPerdPreParto, diasRecupServicio,
    boostPreParto:boostPreParto.toFixed(2),
    reducCaida:reducCaida.toFixed(3),
    boostPostDest:boostPostDest.toFixed(3),
  };
}

// ─── DISTRIBUCIÓN CC POR GRUPO ───────────────────────────────────
function calcDistCCv2(params) {
  const {dist, cadena, ndvi, prov, destTrad, destAntic, destHiper,
         supHa, vacasN, dDisp, biotipo,
         supl1, dosis1, supl2, dosis2, supl3, dosis3} = params;
  if(!dist||!cadena) return {grupos:[],caídaLact:"0",mesesLact:"0",diasLactPond:0};
  const ndviN=parseFloat(ndvi)||0.45;
  const ha=parseFloat(supHa)||100;
  const vN2=parseFloat(vacasN)||50;
  const cargaEV=vN2/ha;
  const ajCarga=cargaEV>0.8?-0.004:cargaEV>0.5?-0.002:0;
  const bt=getBiotipo(biotipo);
  const tR=Math.max(0.006,(0.013+(ndviN-0.35)*0.04+ajCarga)*bt.recCC);
  const tP=0.007;
  const dD=Math.max(0,dDisp||90);
  const pTrad=parseFloat(destTrad)||0,pAntic=parseFloat(destAntic)||0,pHiper=parseFloat(destHiper)||0;
  const totalD=pTrad+pAntic+pHiper||100;
  const diasLactPond=(pTrad/totalD)*180+(pAntic/totalD)*90+(pHiper/totalD)*50;
  const mesesLact=diasLactPond/30;
  const diasRecupPostDest=Math.min(90,dD);
  const diasHastaParto=Math.max(0,cadena.diasPartoTemp||0);
  const diasRecupPreParto=Math.min(diasHastaParto,dD);
  const diasPerdPreParto=Math.max(0,diasHastaParto-dD);
  const mcalSuplLact=mcalSuplemento(supl2,parseFloat(dosis2)||0);
  const mcalSuplInv=mcalSuplemento(supl1,parseFloat(dosis1)||0);
  const mcalSuplPreP=mcalSuplemento(supl3,parseFloat(dosis3)||0);
  const boostPostDest=mcalSuplInv>0?Math.min(0.25,mcalSuplInv*0.03):0;
  const boostPreParto=mcalSuplPreP>0?Math.min(0.3,mcalSuplPreP*0.04):0;

  const grupos=(dist||[]).map(d=>{
    const ccH=parseFloat(d.cc)||0,pct=parseFloat(d.pct)||0;
    if(!ccH||!pct) return null;
    const ccParto=parseFloat(Math.min(9,Math.max(1,ccH+tR*diasRecupPreParto-tP*diasPerdPreParto+boostPreParto)).toFixed(2));
    const tasaCaidaBase=ccParto>=6?0.40:ccParto>=5?0.50:0.60;
    const tasaCaida=tasaCaidaBase*bt.movCC;
    const reducCaida=mcalSuplLact>0?Math.min(0.35,mcalSuplLact*0.035):0;
    const caida=Math.min(2.5,mesesLact*(tasaCaida-reducCaida));
    const ccMinLact=Math.max(1,ccParto-caida);
    const anestro=calcAnestro(ccParto,ccMinLact,biotipo,false);
    const ccDestete=parseFloat(Math.max(1,ccMinLact).toFixed(2));
    const ccServ=parseFloat(Math.min(9,Math.max(1,ccDestete+(tR+boostPostDest)*diasRecupPostDest)).toFixed(2));
    const pr=interpCC(ccServ).pr;
    const recDestete=ccServ<4.5?"⚡ Hiperprecoz (50d)":ccServ<5.0?"🔶 Anticipado (90d)":"🟢 Tradicional (180d)";
    const urgencia=ccServ<4.5?"urgente":ccServ<5.0?"importante":"preventivo";
    return {ccHoy:ccH,pct,ccParto,ccMinLact,ccDestete,ccServ,pr,recDestete,urgencia,anestro,caida:+caida.toFixed(2)};
  }).filter(Boolean);
  return {grupos,caídaLact:(mesesLact*0.50).toFixed(2),mesesLact:mesesLact.toFixed(1),diasLactPond:Math.round(diasLactPond)};
}

// ─── CADENA REPRODUCTIVA ──────────────────────────────────────────
function calcCadena(iniServ,finServ){
  if(!iniServ||!finServ) return null;
  const ini=new Date(iniServ+"T12:00:00");
  const fin=new Date(finServ+"T12:00:00");
  if(isNaN(ini)||isNaN(fin)||fin<=ini) return null;
  const diasServ=Math.round((fin-ini)/(1000*60*60*24));
  const partoTemp=new Date(ini); partoTemp.setDate(partoTemp.getDate()+280);
  const partoTard=new Date(fin); partoTard.setDate(partoTard.getDate()+280);
  const hoy=new Date();
  const diasPartoTemp=Math.round((partoTemp-hoy)/(1000*60*60*24));
  const diasPartoTard=Math.round((partoTard-hoy)/(1000*60*60*24));
  const GDP={trad:0.400,antic:0.350,hiper:0.250};
  const calcTipo=(refParto,diasLact,gdpPost)=>{
    const pvDest=Math.round(35+0.700*diasLact);
    const desteT=new Date(refParto); desteT.setDate(desteT.getDate()+diasLact);
    const anoRef=desteT.getFullYear();
    const mayo1candidato=new Date(anoRef,4,1);
    const mayo1=mayo1candidato>desteT?mayo1candidato:new Date(anoRef+1,4,1);
    const diasPost=Math.max(0,Math.round((mayo1-desteT)/(1000*60*60*24)));
    const pvMayo=Math.round(pvDest+gdpPost*diasPost);
    const mesDeste=desteT.getMonth();
    const terneroOtono=mesDeste>=4&&mesDeste<=5;
    return {desteT,pvDest,pvMayo,terneroOtono,diasLact};
  };
  const tiposTrad=calcTipo(partoTemp,180,GDP.trad);
  const tiposAntic=calcTipo(partoTemp,90,GDP.antic);
  const tiposHiper=calcTipo(partoTemp,50,GDP.hiper);
  const tipoTardTrad=calcTipo(partoTard,180,GDP.trad);
  const tipos={
    trad:{desteTemp:tiposTrad.desteT,desteTard:tipoTardTrad.desteT,pvDest:tiposTrad.pvDest,pvMayo:tiposTrad.pvMayo,terneroOtono:tiposTrad.terneroOtono,diasLact:180},
    antic:{desteTemp:tiposAntic.desteT,desteTard:tipoTardTrad.desteT,pvDest:tiposAntic.pvDest,pvMayo:tiposAntic.pvMayo,terneroOtono:tiposAntic.terneroOtono,diasLact:90},
    hiper:{desteTemp:tiposHiper.desteT,desteTard:tipoTardTrad.desteT,pvDest:tiposHiper.pvDest,pvMayo:tiposHiper.pvMayo,terneroOtono:tiposHiper.terneroOtono,diasLact:50},
  };
  const nacVaq=new Date(partoTemp); nacVaq.setDate(nacVaq.getDate()+45);
  const anoNacVaq=nacVaq.getFullYear();
  const mayo1Inv=new Date(anoNacVaq,4,1)>nacVaq?new Date(anoNacVaq,4,1):new Date(anoNacVaq+1,4,1);
  const edadMayo=Math.round((mayo1Inv-nacVaq)/(1000*60*60*24*30));
  const pvMayo1Inv=Math.round(35+0.700*(mayo1Inv-nacVaq)/(1000*60*60*24));
  return {ini,fin,diasServ,partoTemp,partoTard,diasPartoTemp,diasPartoTard,tipos,
    terneroOtono:tiposTrad.terneroOtono,desteTemp:tiposTrad.desteT,desteTard:tipoTardTrad.desteT,
    nacVaq,mayo1Inv,edadMayo,pvMayo1Inv};
}

// ─── HELPERS ──────────────────────────────────────────────────────
const ccPond=(dist)=>{let s=0,t=0;(dist||[]).forEach(d=>{const p=parseFloat(d.pct)||0,c=parseFloat(d.cc)||0;s+=p*c;t+=p;});return t>0?s/t:0;};
const fmtFecha=(d)=>{if(!d||isNaN(new Date(d)))return"—";return new Date(d).toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"2-digit"});};
const semaforo=(v,bajo,alto)=>v>=alto?"#7ec850":v>=bajo?"#d4952a":"#c04820";

// ─── FETCH SAT ────────────────────────────────────────────────────
const ndviBase={"NEA":0.55,"Pampa Húmeda":0.50,"NOA":0.42,"Cuyo":0.30,"Patagonia":0.28,"Patagonia Sur":0.25,"Neuquén / Río Negro":0.30,"Paraguay Oriental":0.58,"Chaco Paraguayo":0.48,"Mato Grosso / Goiás (BR)":0.55,"Mato Grosso do Sul (BR)":0.56,"Rio Grande do Sul (BR)":0.52,"Pantanal (BR)":0.50,"Santa Cruz / Beni (BO)":0.50,"Tarija / Chaco (BO)":0.44};
async function fetchSat(lat,lon,zona,prov,enso,cb){
  try{
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=precipitation_sum,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration&past_days=30&forecast_days=1&timezone=auto`;
    const d=await(await fetch(url)).json();
    if(!d?.daily?.precipitation_sum) throw new Error("Sin datos");
    const prec=d.daily.precipitation_sum||[];
    const tMax=d.daily.temperature_2m_max||[];
    const tMin=d.daily.temperature_2m_min||[];
    const et0=d.daily.et0_fao_evapotranspiration||[];
    const p7=Math.round(prec.slice(-7).reduce((a,b)=>a+(b||0),0));
    const p30=Math.round(prec.reduce((a,b)=>a+(b||0),0));
    const et07=Math.round(et0.slice(-7).reduce((a,b)=>a+(b||0),0));
    const temp=parseFloat(((tMax.slice(-7).reduce((a,b)=>a+(b||0),0)+tMin.slice(-7).reduce((a,b)=>a+(b||0),0))/(tMax.slice(-7).length*2)).toFixed(1));
    const m=modENSO(enso);
    const nb=ndviBase[zona]||0.48;
    const ndviAdj=Math.min(0.95,Math.max(0.15,nb*(0.6+p30/300)*m)).toFixed(2);
    const cond=ndviAdj>0.60?"Excelente":ndviAdj>0.45?"Buena":ndviAdj>0.30?"Regular":"Crítica";
    cb({temp,tMax:Math.round(Math.max(...tMax.slice(-7))),tMin:Math.round(Math.min(...tMin.slice(-7))),p7,p30,deficit:Math.round(p30-et07*4.3),ndvi:ndviAdj,condForr:cond,et07});
  }catch(e){cb({error:"No se pudieron obtener datos satelitales: "+e.message});}
}

// ─── GEOGRAFÍA ────────────────────────────────────────────────────
const HELADAS_PROV={"Formosa":{dia:15,mes:5},"Chaco":{dia:1,mes:5},"Corrientes":{dia:1,mes:5},"Misiones":{dia:20,mes:4},"Entre Ríos":{dia:10,mes:4},"Santa Fe":{dia:10,mes:4},"Santiago del Estero":{dia:25,mes:4},"Salta":{dia:15,mes:5},"Buenos Aires":{dia:15,mes:4},"Córdoba":{dia:10,mes:4},"La Pampa":{dia:20,mes:3},"Mendoza":{dia:1,mes:4},"Neuquén / Río Negro":{dia:1,mes:3},"Patagonia Sur":{dia:1,mes:2},"Paraguay Oriental":{dia:15,mes:5},"Chaco Paraguayo":{dia:10,mes:5},"Santa Cruz / Beni (BO)":{dia:1,mes:5},"Tarija / Chaco (BO)":{dia:20,mes:4},"Mato Grosso do Sul (BR)":{dia:15,mes:5},"Mato Grosso / Goiás (BR)":{dia:10,mes:5},"Rio Grande do Sul (BR)":{dia:1,mes:4},"Pantanal (BR)":{dia:20,mes:5}};
const CLIMA_HIST={"Corrientes":[{t:28,p:130},{t:27,p:120},{t:25,p:110},{t:20,p:90},{t:16,p:70},{t:13,p:60},{t:13,p:55},{t:15,p:50},{t:18,p:80},{t:22,p:110},{t:25,p:120},{t:27,p:130}],"Chaco":[{t:29,p:120},{t:28,p:110},{t:26,p:110},{t:21,p:80},{t:16,p:60},{t:13,p:50},{t:13,p:45},{t:15,p:45},{t:19,p:70},{t:23,p:100},{t:26,p:110},{t:28,p:120}],"Formosa":[{t:30,p:120},{t:29,p:110},{t:27,p:110},{t:22,p:80},{t:17,p:55},{t:14,p:45},{t:14,p:40},{t:16,p:45},{t:20,p:70},{t:24,p:100},{t:27,p:110},{t:29,p:120}],"Entre Ríos":[{t:25,p:100},{t:24,p:90},{t:22,p:90},{t:17,p:70},{t:13,p:55},{t:10,p:45},{t:10,p:40},{t:12,p:45},{t:15,p:65},{t:19,p:90},{t:22,p:100},{t:24,p:100}],"Santiago del Estero":[{t:28,p:90},{t:27,p:80},{t:25,p:80},{t:20,p:50},{t:15,p:30},{t:12,p:20},{t:12,p:15},{t:14,p:20},{t:18,p:40},{t:22,p:70},{t:25,p:80},{t:27,p:90}],"Salta":[{t:24,p:140},{t:23,p:130},{t:22,p:110},{t:17,p:50},{t:13,p:20},{t:10,p:10},{t:10,p:10},{t:12,p:15},{t:16,p:30},{t:20,p:70},{t:22,p:110},{t:23,p:130}],"Buenos Aires":[{t:24,p:90},{t:23,p:80},{t:21,p:90},{t:16,p:70},{t:12,p:55},{t:9,p:45},{t:9,p:40},{t:11,p:50},{t:13,p:65},{t:17,p:85},{t:20,p:90},{t:23,p:90}],"Córdoba":[{t:25,p:100},{t:24,p:90},{t:22,p:90},{t:17,p:60},{t:13,p:35},{t:10,p:25},{t:10,p:20},{t:12,p:25},{t:15,p:45},{t:19,p:75},{t:22,p:90},{t:24,p:100}],"Santa Fe":[{t:26,p:110},{t:25,p:100},{t:23,p:100},{t:18,p:70},{t:14,p:50},{t:11,p:40},{t:11,p:35},{t:13,p:40},{t:16,p:60},{t:20,p:90},{t:23,p:100},{t:25,p:110}],"La Pampa":[{t:24,p:80},{t:23,p:70},{t:21,p:75},{t:15,p:55},{t:11,p:38},{t:8,p:28},{t:8,p:25},{t:10,p:30},{t:13,p:48},{t:17,p:72},{t:20,p:78},{t:22,p:80}],"Paraguay Oriental":[{t:29,p:140},{t:29,p:130},{t:27,p:130},{t:22,p:100},{t:17,p:75},{t:14,p:60},{t:14,p:55},{t:16,p:55},{t:19,p:80},{t:23,p:110},{t:26,p:130},{t:28,p:140}],"Chaco Paraguayo":[{t:31,p:110},{t:30,p:100},{t:28,p:100},{t:23,p:70},{t:18,p:45},{t:15,p:35},{t:15,p:30},{t:17,p:35},{t:21,p:60},{t:25,p:90},{t:28,p:100},{t:30,p:110}],"Mato Grosso do Sul (BR)":[{t:27,p:180},{t:27,p:160},{t:26,p:120},{t:23,p:80},{t:19,p:50},{t:17,p:30},{t:17,p:25},{t:19,p:35},{t:22,p:70},{t:25,p:120},{t:26,p:150},{t:27,p:170}],"Mato Grosso / Goiás (BR)":[{t:26,p:220},{t:26,p:200},{t:25,p:160},{t:24,p:90},{t:22,p:35},{t:20,p:10},{t:20,p:8},{t:22,p:15},{t:24,p:60},{t:26,p:120},{t:26,p:180},{t:26,p:210}],"Pantanal (BR)":[{t:28,p:200},{t:28,p:180},{t:27,p:140},{t:25,p:80},{t:22,p:30},{t:20,p:10},{t:20,p:8},{t:21,p:20},{t:24,p:60},{t:26,p:110},{t:27,p:160},{t:28,p:190}]};
const CLIMA_DEF=[{t:27,p:120},{t:26,p:110},{t:24,p:100},{t:20,p:80},{t:15,p:60},{t:12,p:50},{t:12,p:45},{t:14,p:50},{t:18,p:70},{t:22,p:95},{t:25,p:110},{t:26,p:120}];
const getClima=(prov)=>CLIMA_HIST[prov]||CLIMA_DEF;
const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_C=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function diasHelada(prov,ndvi,tempActual){
  const h=HELADAS_PROV[prov];if(!h) return 999;
  const n=parseFloat(ndvi)||0.45;
  const aj=n>0.55?7:n<0.35?-7:0;
  const hoy=new Date();
  let fd=new Date(hoy.getFullYear(),h.mes,h.dia+aj);
  if(fd<hoy){if(tempActual!==undefined&&parseFloat(tempActual)<15)return 0;fd=new Date(hoy.getFullYear()+1,h.mes,h.dia+aj);}
  return Math.round((fd-hoy)/(1000*60*60*24));
}
function calcDisp(prov,ndvi,temp){
  const dH=diasHelada(prov,ndvi,temp);
  const tN=parseFloat(temp)||20;
  if(dH===0||tN<15) return{tipo:"Invierno activo — C4 restringido",dias:0};
  const mc=new Date().getMonth();
  const hist=getClima(prov);
  let dT=999;
  for(let i=1;i<=6;i++){if(hist[(mc+i)%12].t<15){dT=i*30;break;}}
  return{tipo:"Disparador C4",dias:Math.min(dH,dT)};
}
function dZona(lat,lon){if(lat>-28&&lat<=-25&&lon>-56&&lon<=-53)return"NEA";if(lat>-27&&lat<=-20&&lon>-58&&lon<=-54)return"Paraguay Oriental";if(lat>-25&&lat<=-20&&lon>-63&&lon<=-58)return"Chaco Paraguayo";if(lat>-25&&lat<=-10&&lon>-54&&lon<=-44)return"Brasil (Cerrado)";if(lat>-32)return"NEA";if(lat>-38&&lat<=-32&&lon>-62)return"Pampa Húmeda";return"NEA";}
function dProv(lat,lon){if(lat>-27&&lat<=-20&&lon>-58&&lon<=-54)return"Paraguay Oriental";if(lat>-25&&lat<=-20&&lon>-63&&lon<=-58)return"Chaco Paraguayo";if(lat>-24&&lat<=-15&&lon>-58&&lon<=-54)return"Mato Grosso do Sul (BR)";if(lat>-22&&lat<=-15&&lon>-65&&lon<=-63)return"Santa Cruz / Beni (BO)";if(lat>-23&&lat<=-20&&lon>-66&&lon<=-63)return"Tarija / Chaco (BO)";if(lat>-23&&lon<=-62)return"Salta";if(lat>-23&&lon>-62)return"Formosa";if(lat>-32&&lat<=-26&&lon>-59&&lon<=-53)return"Corrientes";if(lat>-29&&lat<=-22&&lon>-66&&lon<=-58)return"Chaco";if(lat>-34&&lat<=-30&&lon>-60.5&&lon<=-57)return"Entre Ríos";if(lat>-34&&lat<=-28&&lon>-64&&lon<=-59)return"Santa Fe";if(lat>-36&&lat<=-29&&lon>-66&&lon<=-62)return"Córdoba";if(lat>-40&&lat<=-34&&lon>-63&&lon<=-56)return"Buenos Aires";if(lat>-40&&lat<=-34&&lon>-68&&lon<=-63)return"La Pampa";return"Chaco";}

const DISCLAIMER="Las recomendaciones generadas por AgroMind Pro tienen carácter orientativo. No reemplazan el criterio profesional del ingeniero agrónomo o médico veterinario que asiste al establecimiento, quien deberá validar, ajustar e implementar cualquier decisión de manejo según las condiciones particulares de cada sistema productivo.";
// ═══════════════════════════════════════════════════════════════════
// AGROMIND PRO v13 — UI MOBILE-FIRST
// ═══════════════════════════════════════════════════════════════════
import React,{useState,useEffect,useRef,useMemo,useCallback}from"react";
import{useSession,signOut,signIn}from"next-auth/react";
import{LineChart,Line,BarChart,Bar,AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip,Legend,ResponsiveContainer,ReferenceLine,RadarChart,PolarGrid,PolarAngleAxis,Radar}from"recharts";

// ─── DESIGN TOKENS ───────────────────────────────────────────────
const T={
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
  radius:   14,
};

// ─── PALETA DE ESCENARIOS ────────────────────────────────────────
const ESC_COLORS=["#7ec850","#e8a030","#4a9fd4"];
const ESC_NAMES=["Base","Esc. A","Esc. B"];

// ─── MICRO-COMPONENTES ────────────────────────────────────────────
const Pill=({children,color=T.green,bg})=>(
  <span style={{display:"inline-block",padding:"2px 9px",borderRadius:20,fontSize:11,fontFamily:T.font,
    color,background:bg||color+"22",border:`1px solid ${color}44`,letterSpacing:.5}}>
    {children}
  </span>
);

const Kpi=({label,value,unit="",color=T.green,sub})=>(
  <div style={{background:T.card2,borderRadius:T.radius,padding:"12px 14px",border:`1px solid ${T.border}`}}>
    <div style={{fontFamily:T.font,fontSize:9,color:T.textDim,letterSpacing:1.5,marginBottom:4}}>{label}</div>
    <div style={{fontFamily:T.font,fontSize:22,fontWeight:700,color,lineHeight:1}}>{value}<span style={{fontSize:12,color:T.textDim,marginLeft:3}}>{unit}</span></div>
    {sub&&<div style={{fontFamily:T.fontSans,fontSize:10,color:T.textFaint,marginTop:3}}>{sub}</div>}
  </div>
);

const Semaforo=({valor,bajo,alto,label,unit=""})=>{
  const c=valor>=alto?T.green:valor>=bajo?T.amber:T.red;
  return <Kpi label={label} value={valor} unit={unit} color={c}/>;
};

const AlertBox=({nivel,children})=>{
  const cfg={rojo:{bg:"rgba(224,85,48,.08)",border:"rgba(224,85,48,.35)",icon:"🔴",color:T.red},
    ambar:{bg:"rgba(232,160,48,.08)",border:"rgba(232,160,48,.35)",icon:"⚠️",color:T.amber},
    verde:{bg:"rgba(126,200,80,.08)",border:"rgba(126,200,80,.35)",icon:"✅",color:T.green},
    info:{bg:"rgba(74,159,212,.08)",border:"rgba(74,159,212,.25)",icon:"ℹ️",color:T.blue}};
  const s=cfg[nivel]||cfg.info;
  return(
    <div style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:10,padding:"10px 12px",marginBottom:8}}>
      <span style={{fontFamily:T.fontSans,fontSize:12,color:s.color}}>{s.icon} {children}</span>
    </div>
  );
};

const Slider=({label,value,min,max,step=0.1,onChange,unit="",color=T.green})=>(
  <div style={{marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
      <span style={{fontFamily:T.fontSans,fontSize:12,color:T.textDim}}>{label}</span>
      <span style={{fontFamily:T.font,fontSize:13,color,fontWeight:700}}>{value}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e=>onChange(parseFloat(e.target.value))}
      style={{width:"100%",accentColor:color,cursor:"pointer",height:4}}/>
    <div style={{display:"flex",justifyContent:"space-between"}}>
      <span style={{fontFamily:T.font,fontSize:9,color:T.textFaint}}>{min}{unit}</span>
      <span style={{fontFamily:T.font,fontSize:9,color:T.textFaint}}>{max}{unit}</span>
    </div>
  </div>
);

const Toggle=({label,value,onChange})=>(
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
    <span style={{fontFamily:T.fontSans,fontSize:13,color:T.text}}>{label}</span>
    <div onClick={()=>onChange(!value)} style={{width:44,height:24,borderRadius:12,background:value?T.green:"rgba(255,255,255,.1)",cursor:"pointer",position:"relative",transition:"all .2s"}}>
      <div style={{position:"absolute",top:3,left:value?22:3,width:18,height:18,borderRadius:9,background:"white",transition:"all .2s"}}/>
    </div>
  </div>
);

// ─── SUPLEMENTO SELECTOR ──────────────────────────────────────────
function SuplSelector({label,supl,dosis,onSuplChange,onDosisChange,fenolPasto,color=T.green}){
  const s=SUPLEMENTOS[supl];
  const sinc=supl&&dosis>0?evaluarSincronia(fenolPasto,supl,dosis):null;
  const mcal=mcalSuplemento(supl,dosis);
  return(
    <div style={{background:T.card2,borderRadius:T.radius,padding:14,border:`1px solid ${T.border}`,marginBottom:12}}>
      <div style={{fontFamily:T.font,fontSize:10,color,letterSpacing:1,marginBottom:10}}>{label}</div>
      <select value={supl||""} onChange={e=>onSuplChange(e.target.value)}
        style={{width:"100%",background:T.card,border:`1px solid ${T.border}`,borderRadius:8,
          color:T.text,padding:"10px 12px",fontFamily:T.fontSans,fontSize:13,marginBottom:10}}>
        <option value="">— Sin suplemento —</option>
        {Object.keys(SUPLEMENTOS).map(k=><option key={k} value={k}>{SUPLEMENTOS[k].label} (PB {SUPLEMENTOS[k].pb}% | {SUPLEMENTOS[k].em} Mcal/kg)</option>)}
      </select>
      {supl&&(
        <Slider label="Dosis kg/vaca/día" value={dosis} min={0.1} max={5} step={0.1}
          onChange={onDosisChange} unit=" kg" color={color}/>
      )}
      {supl&&dosis>0&&(
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
          <Pill color={T.blue}>+{mcal.toFixed(1)} Mcal/v/d</Pill>
          <Pill color={color}>PB {s.pb}%</Pill>
          {sinc&&<Pill color={sinc.eficiente?T.green:T.red}>{sinc.eficiente?"✓ Sincronía OK":"⚠ Riesgo sincronía"}</Pill>}
        </div>
      )}
      {sinc&&sinc.warnings.map((w,i)=><AlertBox key={i} nivel={w.nivel}>{w.msg}</AlertBox>)}
    </div>
  );
}

// ─── GRÁFICO CC TRAYECTORIA POR ESCENARIO ─────────────────────────
function GraficoCCEscenarios({escenarios,cadena,mesesLact}){
  const mesP=cadena?.partoTemp?cadena.partoTemp.getMonth():10;
  const mesServ=(mesP-9+12)%12;
  // Construir curvas mes a mes para cada escenario
  const dataMeses=MESES_C.map((mes,mi)=>{
    const obj={mes};
    escenarios.forEach((esc,ei)=>{
      if(!esc.tray) return;
      // Interpolación simple entre los 4 puntos clave
      const {ccHoy,ccParto,ccMinLact,ccServ}=esc.tray;
      let cc;
      const mesPartoN=mesP;
      const mesDestN=(mesP+Math.ceil(parseFloat(mesesLact)||6))%12;
      if(mi<mesPartoN) cc=ccHoy+(ccParto-ccHoy)*(mi/Math.max(1,mesPartoN));
      else if(mi<mesDestN) cc=ccParto+(ccMinLact-ccParto)*((mi-mesPartoN)/Math.max(1,mesDestN-mesPartoN));
      else cc=ccMinLact+(ccServ-ccMinLact)*((mi-mesDestN)/Math.max(1,12-mesDestN));
      obj[ESC_NAMES[ei]]=+Math.max(1,Math.min(9,cc)).toFixed(2);
    });
    obj.refCC5=5.0;
    obj.refCC45=4.5;
    return obj;
  });

  const CustomDot=(props)=>{
    const{cx,cy,index,dataKey}=props;
    if(index===mesServ) return<circle cx={cx} cy={cy} r={5} fill={ESC_COLORS[ESC_NAMES.indexOf(dataKey)]} stroke={T.bg} strokeWidth={1.5}/>;
    return null;
  };

  return(
    <div>
      <div style={{fontFamily:T.font,fontSize:9,color:T.textFaint,marginBottom:6,letterSpacing:1}}>
        TRAYECTORIA CC — punto ● = inicio servicio
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={dataMeses} margin={{top:4,right:4,left:-28,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(126,200,80,.06)"/>
          <XAxis dataKey="mes" tick={{fill:T.textDim,fontSize:9,fontFamily:T.font}}/>
          <YAxis domain={[1,8]} ticks={[2,3,4,5,6,7]} tick={{fill:T.textDim,fontSize:9,fontFamily:T.font}}/>
          <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:11}}
            formatter={(v,n)=>[`CC ${v}`,n]}/>
          <ReferenceLine y={5.0} stroke="rgba(126,200,80,.25)" strokeDasharray="4 2"/>
          <ReferenceLine y={4.5} stroke="rgba(224,85,48,.25)" strokeDasharray="4 2"/>
          {escenarios.map((esc,ei)=>esc.tray&&(
            <Line key={ei} type="monotone" dataKey={ESC_NAMES[ei]}
              stroke={ESC_COLORS[ei]} strokeWidth={2.5}
              dot={<CustomDot/>} activeDot={{r:4,fill:ESC_COLORS[ei]}}/>
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div style={{display:"flex",gap:6,justifyContent:"center",marginTop:6,flexWrap:"wrap"}}>
        <span style={{fontFamily:T.font,fontSize:8,color:"rgba(126,200,80,.4)"}}>── CC 5.0 (55% preñez)</span>
        <span style={{fontFamily:T.font,fontSize:8,color:"rgba(224,85,48,.4)"}}>── CC 4.5 (35% preñez)</span>
      </div>
    </div>
  );
}

// ─── GRÁFICO BALANCE ENERGÉTICO ───────────────────────────────────
function GraficoBalance({form,sat,cadena,tray,usaPotreros,potreros}){
  if(!sat||sat.error||!cadena) return null;
  const prov=form.provincia||"Corrientes";
  const hist=getClima(prov);
  const mc=new Date().getMonth();
  const mesP=cadena.partoTemp?cadena.partoTemp.getMonth():10;
  const enso=form.enso||"neutro";
  const pT=parseFloat(form.destTrad)||0,pA=parseFloat(form.destAntic)||0,pH=parseFloat(form.destHiper)||0;
  const totD=pT+pA+pH||100;
  const mesesLactGraf=Math.max(1.5,(pT*(180/30)+pA*(90/30)+pH*(50/30))/totD);
  const pvVaca=parseFloat(form.pvVacaAdulta)||320;
  const vN=parseInt(form.vacasN)||0;
  const nTotal=Math.max(1,vN);
  const ndviN=parseFloat(sat.ndvi||0.45);
  // Mcal suplemento
  const mcalSuplDia=(mcalSuplemento(form.supl2,parseFloat(form.dosis2)||0));

  const datos=MESES_C.map((mes,i)=>{
    const h=i===mc&&sat?{t:parseFloat(sat.temp)||hist[i].t,p:parseFloat(sat.p30)||hist[i].p}:hist[i];
    const ndviI=i===mc?ndviN:0.45;
    const fenolMs=i===mc?(form.fenologia||"menor_10"):(h.t<15?"mayor_50":h.t<20?"25_50":h.t<25?"10_25":"menor_10");
    const sup=parseFloat(form.supHa)||100,pctM=parseFloat(form.pctMonte)||0,pctN=parseFloat(form.pctNGan)||0;
    const ofTotal=calcOfPasto(form.vegetacion||"Pastizal natural NEA/Chaco",ndviI,h.t,h.p,enso,fenolMs)*sup*Math.max(0,100-pctM-pctN)/100;
    const ofVaca=ofTotal/nTotal;
    const enLact=i>=mesP&&i<mesP+Math.ceil(mesesLactGraf);
    const eRep=enLact?"Lactación con ternero al pie":i===((mesP-1+12)%12)?"Preparto (último mes)":"Gestación media (5–7 meses)";
    const demVaca=reqEM(pvVaca,eRep,form.biotipo)||13;
    const ccMcal=enLact&&tray?Math.min(5,parseFloat(tray.caídaLact||0)*5.6/mesesLactGraf):0;
    const suplMcal=enLact?mcalSuplDia:0;
    const ofTotalV=ofVaca+ccMcal+suplMcal;
    const deficit=Math.max(0,demVaca-ofTotalV);
    return{mes,oferta:+ofVaca.toFixed(1),ccComp:+ccMcal.toFixed(1),supl:+suplMcal.toFixed(1),
      demanda:+demVaca.toFixed(1),deficit:+deficit.toFixed(1),bajo15:h.t<15,esActual:i===mc};
  });
  const defMeses=datos.filter(d=>d.deficit>0);

  return(
    <div>
      <div style={{fontFamily:T.font,fontSize:9,color:T.textFaint,marginBottom:8,letterSpacing:1}}>
        BALANCE ENERGÉTICO Mcal/vaca/día · {MESES[mc]}: Open-Meteo real
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <AreaChart data={datos} margin={{top:4,right:4,left:-28,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(126,200,80,.06)"/>
          <XAxis dataKey="mes" tick={{fill:T.textDim,fontSize:9,fontFamily:T.font}}/>
          <YAxis tick={{fill:T.textDim,fontSize:9,fontFamily:T.font}} domain={[0,"auto"]}/>
          <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,borderRadius:8,fontFamily:T.font,fontSize:11}}
            formatter={(v,n)=>[v.toFixed(1)+" Mcal",n]}/>
          <Area type="monotone" dataKey="oferta" name="Pasto" stackId="of"
            fill="rgba(126,200,80,.18)" stroke={T.green} strokeWidth={1.5} dot={false}/>
          <Area type="monotone" dataKey="ccComp" name="CC movilizada" stackId="of"
            fill="rgba(232,160,48,.20)" stroke={T.amber} strokeWidth={1} dot={false} strokeDasharray="4 2"/>
          <Area type="monotone" dataKey="supl" name="Suplemento" stackId="of"
            fill="rgba(74,159,212,.22)" stroke={T.blue} strokeWidth={1.5} dot={false}/>
          <Line type="monotone" dataKey="demanda" name="Demanda" stroke={T.red} strokeWidth={2} strokeDasharray="6 3" dot={false}/>
        </AreaChart>
      </ResponsiveContainer>
      {defMeses.length>0?(
        <div style={{marginTop:8,background:"rgba(224,85,48,.05)",border:"1px solid rgba(224,85,48,.18)",borderRadius:10,padding:10}}>
          <div style={{fontFamily:T.font,fontSize:10,color:T.red,marginBottom:6}}>
            ⚠️ {defMeses.length} mes{defMeses.length>1?"es":""} con déficit energético
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {defMeses.map((d,i)=>(
              <div key={i} style={{background:"rgba(224,85,48,.08)",borderRadius:8,padding:"5px 10px",fontFamily:T.font,fontSize:10}}>
                <span style={{color:T.red,fontWeight:700}}>{d.mes}</span>
                <span style={{color:"#e09070",marginLeft:6}}>−{d.deficit.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      ):(
        <div style={{marginTop:6,background:"rgba(126,200,80,.05)",border:`1px solid rgba(126,200,80,.15)`,borderRadius:8,padding:"8px 12px",fontFamily:T.font,fontSize:10,color:T.green}}>
          ✅ Balance positivo todo el año
        </div>
      )}
    </div>
  );
}

// ─── TARJETA DE ESCENARIO ─────────────────────────────────────────
function TarjetaEscenario({idx,esc,color,activo,onToggle}){
  if(!esc?.tray) return null;
  const{ccServ,pr,ccParto,ccMinLact,anestro}=esc.tray;
  const prenezColor=pr>=55?T.green:pr>=35?T.amber:T.red;
  return(
    <div onClick={onToggle} style={{background:activo?`${color}12`:T.card2,border:`2px solid ${activo?color:T.border}`,
      borderRadius:T.radius,padding:14,cursor:"pointer",transition:"all .2s",flex:1,minWidth:0}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontFamily:T.font,fontSize:10,color,fontWeight:700,letterSpacing:.5}}>{ESC_NAMES[idx]}</div>
        <div style={{width:8,height:8,borderRadius:4,background:activo?color:T.textFaint}}/>
      </div>
      <div style={{fontFamily:T.font,fontSize:24,color:prenezColor,fontWeight:700,lineHeight:1}}>{pr}%</div>
      <div style={{fontFamily:T.fontSans,fontSize:10,color:T.textDim,marginTop:2}}>preñez est.</div>
      <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:3}}>
        <div style={{fontFamily:T.font,fontSize:9,color:T.textDim}}>CC parto <span style={{color:T.text}}>{ccParto}</span></div>
        <div style={{fontFamily:T.font,fontSize:9,color:T.textDim}}>CC serv <span style={{color:prenezColor,fontWeight:700}}>{ccServ}</span></div>
        <div style={{fontFamily:T.font,fontSize:9,color:T.textDim}}>Anestro <span style={{color:anestro?.riesgo?T.red:T.green}}>{anestro?.dias}d</span></div>
      </div>
      {esc.supl2&&<div style={{marginTop:6}}><Pill color={color} bg={`${color}15`}>+{esc.supl2} {esc.dosis2}kg</Pill></div>}
    </div>
  );
}

// ─── SIMULADOR PRINCIPAL ──────────────────────────────────────────
function SimuladorEscenarios({form,sat,cadena,dispar,dist,baseParams}){
  const [escActivo,setEscActivo]=useState([true,true,false]);

  // Escenario base: sin cambios
  const escBase=useMemo(()=>({
    supl1:form.supl1,dosis1:parseFloat(form.dosis1)||0,
    supl2:form.supl2,dosis2:parseFloat(form.dosis2)||0,
    supl3:form.supl3,dosis3:parseFloat(form.dosis3)||0,
  }),[form.supl1,form.supl2,form.supl3,form.dosis1,form.dosis2,form.dosis3]);

  // Escenario A y B: sliders independientes
  const [escA,setEscA]=useState({
    supl1:form.supl1||"Expeller girasol",dosis1:parseFloat(form.dosis1)||0.3,
    supl2:"Expeller girasol",dosis2:0.5,
    supl3:"",dosis3:0,
    destTrad:parseFloat(form.destTrad)||0,destAntic:parseFloat(form.destAntic)||0,destHiper:parseFloat(form.destHiper)||100,
  });
  const [escB,setEscB]=useState({
    supl1:"Expeller soja",dosis1:0.5,
    supl2:"Expeller soja",dosis2:0.8,
    supl3:"",dosis3:0,
    destTrad:0,destAntic:0,destHiper:100,
  });

  const calcEsc=(extra)=>calcTrayectoriaCCv2({...baseParams,...extra});

  const esc0={...escBase,tray:calcEsc(escBase)};
  const esc1={...escA,tray:calcEsc(escA)};
  const esc2={...escB,tray:calcEsc(escB)};
  const escenarios=[esc0,esc1,esc2];
  const mesesLact=esc0.tray?.mesesLact||"6";

  const updA=(k,v)=>setEscA(e=>({...e,[k]:v}));
  const updB=(k,v)=>setEscB(e=>({...e,[k]:v}));

  const fenol=form.fenologia||"menor_10";

  return(
    <div>
      {/* Tarjetas resumen */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {escenarios.map((e,i)=>(
          <TarjetaEscenario key={i} idx={i} esc={e} color={ESC_COLORS[i]}
            activo={escActivo[i]} onToggle={()=>setEscActivo(a=>a.map((v,j)=>j===i?!v:v))}/>
        ))}
      </div>

      {/* Gráfico CC */}
      <div style={{background:T.card2,borderRadius:T.radius,padding:14,border:`1px solid ${T.border}`,marginBottom:12}}>
        <GraficoCCEscenarios escenarios={escenarios.filter((_,i)=>escActivo[i]?escenarios[i]:null)} cadena={cadena} mesesLact={mesesLact}/>
      </div>

      {/* Comparación tabla */}
      <div style={{background:T.card2,borderRadius:T.radius,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:16}}>
        <div style={{padding:"10px 14px",background:"rgba(0,0,0,.2)",fontFamily:T.font,fontSize:9,color:T.textDim,letterSpacing:1}}>
          COMPARACIÓN DE RESULTADOS
        </div>
        {[["CC al servicio","ccServ",""],[" % Preñez estimada","pr","%"],["Anestro posparto","anestro.dias","d"],["CC mín lactancia","ccMinLact",""]].map(([lbl,key,u])=>(
          <div key={lbl} style={{display:"flex",borderBottom:`1px solid ${T.border}`}}>
            <div style={{flex:2,padding:"10px 14px",fontFamily:T.fontSans,fontSize:11,color:T.textDim}}>{lbl}</div>
            {escenarios.map((e,i)=>{
              const val=key.includes(".")?e.tray?.[key.split(".")[0]]?.[key.split(".")[1]]:"—":e.tray?.[key]||"—";
              const isPreñez=key==="pr";
              const c=isPreñez?(val>=55?T.green:val>=35?T.amber:T.red):ESC_COLORS[i];
              return<div key={i} style={{flex:1,padding:"10px 8px",fontFamily:T.font,fontSize:12,color:c,fontWeight:700,textAlign:"center"}}>{val}{u}</div>;
            })}
          </div>
        ))}
      </div>

      {/* Configuración Escenario A */}
      <details style={{marginBottom:12}}>
        <summary style={{fontFamily:T.font,fontSize:11,color:ESC_COLORS[1],padding:"12px 14px",background:T.card2,borderRadius:T.radius,border:`1px solid ${T.border}`,cursor:"pointer",listStyle:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>⚙️ Configurar {ESC_NAMES[1]}</span>
          <span style={{fontSize:9,color:T.textDim}}>Preñez: {esc1.tray?.pr||"—"}%</span>
        </summary>
        <div style={{background:T.card2,borderRadius:`0 0 ${T.radius}px ${T.radius}px`,padding:14,border:`1px solid ${T.border}`,borderTop:"none"}}>
          <SuplSelector label="SUPL. GESTACIÓN/INVIERNO" supl={escA.supl1} dosis={escA.dosis1}
            onSuplChange={v=>updA("supl1",v)} onDosisChange={v=>updA("dosis1",v)}
            fenolPasto={fenol} color={ESC_COLORS[1]}/>
          <SuplSelector label="SUPL. LACTANCIA" supl={escA.supl2} dosis={escA.dosis2}
            onSuplChange={v=>updA("supl2",v)} onDosisChange={v=>updA("dosis2",v)}
            fenolPasto={fenol} color={ESC_COLORS[1]}/>
          <div style={{fontFamily:T.font,fontSize:9,color:T.textDim,letterSpacing:1,marginBottom:8}}>MANEJO DESTETE</div>
          <Slider label="Hiperprecoz (50d) %" value={escA.destHiper} min={0} max={100} step={10}
            onChange={v=>updA("destHiper",v)} unit="%" color={ESC_COLORS[1]}/>
          <Slider label="Anticipado (90d) %" value={escA.destAntic} min={0} max={100} step={10}
            onChange={v=>updA("destAntic",v)} unit="%" color={ESC_COLORS[1]}/>
        </div>
      </details>

      {/* Configuración Escenario B */}
      <details style={{marginBottom:12}}>
        <summary style={{fontFamily:T.font,fontSize:11,color:ESC_COLORS[2],padding:"12px 14px",background:T.card2,borderRadius:T.radius,border:`1px solid ${T.border}`,cursor:"pointer",listStyle:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>⚙️ Configurar {ESC_NAMES[2]}</span>
          <span style={{fontSize:9,color:T.textDim}}>Preñez: {esc2.tray?.pr||"—"}%</span>
        </summary>
        <div style={{background:T.card2,borderRadius:`0 0 ${T.radius}px ${T.radius}px`,padding:14,border:`1px solid ${T.border}`,borderTop:"none"}}>
          <SuplSelector label="SUPL. GESTACIÓN/INVIERNO" supl={escB.supl1} dosis={escB.dosis1}
            onSuplChange={v=>updB("supl1",v)} onDosisChange={v=>updB("dosis1",v)}
            fenolPasto={fenol} color={ESC_COLORS[2]}/>
          <SuplSelector label="SUPL. LACTANCIA" supl={escB.supl2} dosis={escB.dosis2}
            onSuplChange={v=>updB("supl2",v)} onDosisChange={v=>updB("dosis2",v)}
            fenolPasto={fenol} color={ESC_COLORS[2]}/>
          <Slider label="Hiperprecoz (50d) %" value={escB.destHiper} min={0} max={100} step={10}
            onChange={v=>updB("destHiper",v)} unit="%" color={ESC_COLORS[2]}/>
          <Slider label="Anticipado (90d) %" value={escB.destAntic} min={0} max={100} step={10}
            onChange={v=>updB("destAntic",v)} unit="%" color={ESC_COLORS[2]}/>
        </div>
      </details>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════
// AGROMIND PRO v13 — APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

const FENOLOGIAS=[
  {val:"menor_10",label:"<10% Flor.",emoji:"🌿",desc:"PB >10% · Dig >65%"},
  {val:"10_25",label:"10–25%",emoji:"🌾",desc:"PB 7–10% · Dig 60–65%"},
  {val:"25_50",label:"25–50%",emoji:"🍂",desc:"PB 5–7% · Dig 55–60%",warn:"⚠ Déficit proteico"},
  {val:"mayor_50",label:">50%",emoji:"🪵",desc:"PB <5% · Dig <55%",warn:"⚠ Déficit severo"},
];
const ESTADOS_REPROD=["Gestación temprana (1–4 meses)","Gestación media (5–7 meses)","Preparto (último mes)","Lactación con ternero al pie","Vaca seca sin ternero"];
const VEGETACIONES=Object.keys(PROD_BASE);
const MSGS=["Analizando condición forrajera…","Evaluando trayectoria CC…","Calculando cadena reproductiva…","Modelando anestro posparto…","Simulando escenarios de suplementación…","Generando recomendaciones…"];

const SYS=`Actuás como asesor técnico experto en sistemas de cría bovina extensiva — NEA, NOA, Paraguay, Brasil, Bolivia. 20 años de campo en pasturas megatérmicas C4. Bos indicus-cruzado como biotipo dominante.

MODELO TÉCNICO ACTUALIZADO:
- Biotipo modifica: tasa movilización CC, tasa recuperación, umbral anestro posparto (Short et al. 1990; Neel et al. 2007)
- Anestro posparto = f(CC al parto, CC mínima alcanzada, biotipo, primer parto) — NO solo CC al servicio
- Suplementación: aporte Mcal/día directo al balance. Sincronía ruminal proteína-energía crítica con pasto degradado
- Urea + pasto >50% floración = RIESGO real. Siempre señalar
- Selk 1988 + Peruchena INTA 2003: zona crítica CC 4.0→6.0 (mayor impacto por unidad)
- Vaca 1° parto: requerimientos 10% superiores, umbral anestro +0.3 unidades CC

5 SECCIONES OBLIGATORIAS — usar EXACTAMENTE estos emojis:
1️⃣ DIAGNÓSTICO AMBIENTAL · 2️⃣ DIAGNÓSTICO POR CATEGORÍA · 3️⃣ DESTETE Y PROYECCIÓN CC · 4️⃣ BALANCE OFERTA vs DEMANDA · 5️⃣ RECOMENDACIONES

5️⃣ RECOMENDACIONES: siempre incluir:
- Suplementación con fuente, dosis exacta kg/día, frecuencia y advertencia sincronía si corresponde
- Comparar escenarios si se calcularon
- Prioridad 🔴🟡🟢

Citar: Peruchena INTA 2003 · Selk 1988 · Detmann/NASSEM 2010 · Paruelo & Oesterheld 2000 · Short et al. 1990 · Neel et al. 2007`;

function buildPrompt(form,coords,sat,dispar,cadena,tray,dist){
  const hoy=new Date().toLocaleDateString("es-AR",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  let t=`ANÁLISIS — ${hoy}\n`;
  if(coords) t+=`UBICACIÓN: ${coords.lat?.toFixed(4)}°S ${coords.lon?.toFixed(4)}°W · ${form.zona} · ${form.provincia}\n`;
  if(sat?.temp) t+=`MET REAL: T${sat.temp}°C (Mx${sat.tMax}/Mn${sat.tMin}) · P7d:${sat.p7}mm P30d:${sat.p30}mm · Bal:${sat.deficit>0?"+":""}${sat.deficit}mm · NDVI:${sat.ndvi}(${sat.condForr})\n`;
  t+=`ENSO: ${form.enso==="nino"?"El Niño +25%":form.enso==="nina"?"La Niña −25%":"Neutro"}\n`;
  t+=`BIOTIPO: ${form.biotipo||"Brangus 3/8"}\n`;
  if(dispar) t+=`DISPARADOR C4: ${dispar.dias===0?"Invierno activo — C4 restringido":dispar.dias+" días"}\n`;
  if(cadena){
    t+=`SERVICIO: ${fmtFecha(form.iniServ)} → ${fmtFecha(form.finServ)} (${cadena.diasServ}d)\n`;
    t+=`PARTO: temp ${fmtFecha(cadena.partoTemp)} · tard ${fmtFecha(cadena.partoTard)}\n`;
  }
  t+=`RODEO: ${form.vacasN||"—"} vacas · ${form.torosN||"—"} toros · PV ${form.pvVacaAdulta||"—"}kg · Preñez hist ${form.prenez||"—"}%\n`;
  t+=`SUPERFICIE: ${form.supHa||"—"} ha · Carga ${form.vacasN&&form.supHa?(parseFloat(form.vacasN)/parseFloat(form.supHa)).toFixed(2):"—"} EV/ha\n`;
  t+=`VEGETACIÓN: ${form.vegetacion||"—"} · Fenología: ${form.fenologia||"—"}\n`;
  t+=`E.REPROD: ${form.eReprod||"—"}\n`;
  if(tray){
    t+=`TRAY CC: Hoy:${tray.ccHoy} → Parto:${tray.ccParto} → CcMin:${tray.ccMinLact} → Destete:${tray.ccDestete} → Serv:${tray.ccServ} → Preñez:${tray.pr}%\n`;
    t+=`Anestro posparto estimado: ${tray.anestro?.dias}d (${tray.anestro?.riesgo?"🔴 riesgo falta servicio":"✅ dentro del período de servicio"})\n`;
    t+=`Caída CC lactancia: ${tray.caídaLact} unidades en ${tray.mesesLact} meses\n`;
  }
  // Suplementación cargada
  if(form.supl1) t+=`SUPL. GESTACIÓN/INV: ${form.supl1} ${form.dosis1||0}kg/día\n`;
  if(form.supl2) t+=`SUPL. LACTANCIA: ${form.supl2} ${form.dosis2||0}kg/día\n`;
  if(form.supl3) t+=`SUPL. PREPARTO: ${form.supl3} ${form.dosis3||0}kg/día\n`;
  // Distribución CC grupos
  if(dist?.grupos?.length){
    t+=`DIST CC AL SERVICIO:\n`;
    dist.grupos.forEach(g=>{
      t+=`  CC${g.ccHoy} (${g.pct}%): parto→${g.ccParto} minLact→${g.ccMinLact} serv→${g.ccServ} preñez→${g.pr}% anestro→${g.anestro?.dias}d [${g.urgencia}]\n`;
    });
  }
  if(form.consultaEspecifica) t+=`CONSULTA ESPECÍFICA: ${form.consultaEspecifica}\n`;
  return t;
}

// ─── INFORME RENDER ───────────────────────────────────────────────
const SEC_EMOJIS=["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣"];
const SEC_TITLES=["Diagnóstico Ambiental","Diagnóstico por Categoría","Destete y Proyección CC","Balance Oferta vs Demanda","Recomendaciones"];

function RenderInforme({texto}){
  if(!texto) return null;
  const partes=texto.split(/(?=\d️⃣)/);
  const secciones=SEC_EMOJIS.map(em=>{const p=partes.find(x=>x.startsWith(em));return p?p.replace(em,"").trim():"";});
  const getStatus=(s)=>{const l=s.toLowerCase();if(l.includes("🔴")||l.includes("urgente"))return"rojo";if(l.includes("⚠")||l.includes("déficit"))return"ambar";if(l.includes("✅"))return"verde";return"info";};
  const rr=t=>t.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>");
  return(
    <div>
      {secciones.map((sec,i)=>{
        if(!sec) return null;
        const st=getStatus(sec);
        const cfg={rojo:{bg:"rgba(224,85,48,.06)",border:"rgba(224,85,48,.20)",dot:T.red},ambar:{bg:"rgba(232,160,48,.06)",border:"rgba(232,160,48,.20)",dot:T.amber},verde:{bg:"rgba(126,200,80,.06)",border:"rgba(126,200,80,.20)",dot:T.green},info:{bg:"rgba(255,255,255,.02)",border:T.border,dot:T.textDim}};
        const s=cfg[st];
        return(
          <details key={i} open={i===0||i===4} style={{marginBottom:8}}>
            <summary style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,userSelect:"none",listStyle:"none"}}>
              <span style={{fontSize:18}}>{SEC_EMOJIS[i]}</span>
              <span style={{fontFamily:T.fontSans,fontSize:13,color:T.text,fontWeight:600,flex:1}}>{SEC_TITLES[i]}</span>
              <div style={{width:8,height:8,borderRadius:"50%",background:s.dot}}/>
            </summary>
            <div style={{background:"rgba(0,0,0,.25)",border:`1px solid ${T.border}`,borderTop:"none",borderRadius:"0 0 12px 12px",padding:14,fontFamily:T.fontSans,fontSize:13,color:T.text,lineHeight:1.75}}
              dangerouslySetInnerHTML={{__html:rr(sec)}}/>
          </details>
        );
      })}
      <div style={{background:"rgba(232,160,48,.04)",border:"1px solid rgba(232,160,48,.12)",borderRadius:10,padding:10,marginTop:8}}>
        <div style={{fontFamily:T.fontSans,fontSize:10,color:T.textDim,lineHeight:1.6}}>{DISCLAIMER}</div>
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════
// MÓDULO AGUA DE BEBIDA
// Fuente: López et al. 2021, JAS 99(8):skab215
// INTA Santiago del Estero + DiLorenzo UF/IFAS
// NRC 2000 Nutrient Requirements of Beef Cattle
// ═══════════════════════════════════════════════════════

// Categorías de calidad de agua por TDS (mg/L)
// López et al. 2021: efectos cuadráticos sobre DMI y consumo de agua
const AGUA_CATEGORIAS = [
  { min:0,    max:1000,  label:"Excelente",  color:"#7ec850", riesgo:0,
    desc:"Sin restricción. Agua dulce. Sin impacto en consumo ni performance." },
  { min:1000, max:3000,  label:"Satisfactoria", color:"#a8d870", riesgo:1,
    desc:"Aceptable para todas las categorías. Impacto mínimo en DMI (<2%)." },
  { min:3000, max:5000,  label:"Moderada",   color:"#e8a030", riesgo:2,
    desc:"Puede reducir DMI 2–5% y WI hasta 8%. Monitorear en lactación y gestación tardía." },
  { min:5000, max:7000,  label:"Alta salinidad", color:"#d46820", riesgo:3,
    desc:"Reducción DMI 5–12%, WI 10–20%. Impacto en ADG. Evitar en vaquillonas y lactación." },
  { min:7000, max:10000, label:"Problemática", color:"#e05530", riesgo:4,
    desc:"Reducción severa DMI >12%. Problemas digestivos. Contraindicada en categorías productivas." },
  { min:10000,max:Infinity,label:"No apta",  color:"#c02010", riesgo:5,
    desc:"No usar en bovinos. Riesgo de intoxicación salina, diarrea, muerte." },
];

// Tipo de sal dominante — modifica el efecto (López et al. 2021)
// Efecto SO4 > NaCl a igual TDS (efecto lineal SO4 vs cuadrático NaCl)
const TIPOS_SAL = {
  "NaCl dominante":  { factor: 1.0, nota: "Efecto cuadrático. Tolerancia relativamente mayor." },
  "SO4 dominante":   { factor: 1.35, nota: "⚠️ ATENCIÓN: Efecto lineal y más severo. Sulfatos reducen más DMI y WI que cloruros a igual TDS (López et al. 2021). Diarrea y problemas digestivos frecuentes." },
  "Mixta/Desconocida":{ factor: 1.15, nota: "Asumir efecto intermedio. Analizar muestra para caracterizar." },
};

// Consumo de agua esperado (L/vaca/día) según temperatura y PV
// Modelo Winchester & Morris 1956 — referencia NRC 2000
// Ajuste temperatura: duplica consumo de 10°C a 35°C
function calcConsumoAgua(pvVaca, tempC, lactando) {
  const pv = parseFloat(pvVaca) || 320;
  const t = parseFloat(tempC) || 25;
  const base = 0.038 * pv * Math.pow(t / 20, 0.8); // L/día
  const factLact = lactando ? 1.4 : 1.0; // lactación +40% (NRC 2000)
  return Math.round(base * factLact);
}

// Evaluación de calidad de agua
function evaluarAgua(tds, tipoSal, pvVaca, tempC, lactando, enso) {
  if (!tds || tds <= 0) return null;
  const tdsN = parseFloat(tds);
  const cat = AGUA_CATEGORIAS.find(c => tdsN >= c.min && tdsN < c.max) || AGUA_CATEGORIAS[AGUA_CATEGORIAS.length-1];
  const ts = TIPOS_SAL[tipoSal] || TIPOS_SAL["Mixta/Desconocida"];
  const tdsEfectivo = tdsN * ts.factor;
  const catEfect = AGUA_CATEGORIAS.find(c => tdsEfectivo >= c.min && tdsEfectivo < c.max) || AGUA_CATEGORIAS[AGUA_CATEGORIAS.length-1];

  // Impacto en DMI según López et al. 2021 (modelo cuadrático TDS)
  // Basado en ecuaciones del metaanálisis (25 estudios 1960–2020)
  let pctReducDMI = 0;
  let pctReducWI  = 0;
  if (tdsN > 3000) {
    pctReducDMI = Math.min(25, ((tdsN - 3000) / 1000) * 2.5 * ts.factor);
    pctReducWI  = Math.min(30, ((tdsN - 3000) / 1000) * 3.0 * ts.factor);
  }

  const consumoEsperado = calcConsumoAgua(pvVaca, tempC, lactando);
  // En La Niña → menor lluvia → aguadas más concentradas (TDS puede subir 20-40%)
  const alertaEnso = enso === "nina" ? "⚠️ La Niña: mayor concentración de sales esperada en aguadas superficiales. Revisar TDS periódicamente." : null;

  const warnings = [];
  if (cat.riesgo >= 3) warnings.push({ nivel:"rojo", msg:`TDS ${tdsN} mg/L (${cat.label}): reducción estimada DMI ${pctReducDMI.toFixed(0)}%, consumo agua −${pctReducWI.toFixed(0)}%. Impacto directo en ingesta de forraje y CC. (López et al. 2021)` });
  else if (cat.riesgo === 2) warnings.push({ nivel:"ambar", msg:`TDS ${tdsN} mg/L (${cat.label}): monitoreo recomendado en lactación y preparto. Impacto DMI ≤5%. Asegurar disponibilidad ad libitum.` });
  else warnings.push({ nivel:"verde", msg:`TDS ${tdsN} mg/L (${cat.label}): calidad adecuada para todas las categorías.` });
  if (ts.factor > 1.1) warnings.push({ nivel:"ambar", msg: ts.nota });
  if (alertaEnso) warnings.push({ nivel:"ambar", msg: alertaEnso });

  // Alerta temperatura: >32°C el consumo se dispara
  if (parseFloat(tempC) > 32) {
    warnings.push({ nivel:"ambar", msg:`Temperatura ${tempC}°C: consumo de agua estimado ${consumoEsperado}L/vaca/día. Asegurar caudal y acceso (mín. 5–6 cm lineal de bebedero por vaca).` });
  }

  return { cat, catEfect, tdsN, tdsEfectivo, pctReducDMI, pctReducWI, consumoEsperado, warnings, tipoSal, ts };
}

// ═══════════════════════════════════════════════════════
// MÓDULO SANIDAD — referencias básicas
// Fuente: Radostits et al. 2007 Veterinary Medicine;
// Estudio INTA Rafaela (enf. reproductivas NEA/NOA)
// ═══════════════════════════════════════════════════════
const ENFERMEDADES_REPROD = [
  { nombre:"IBR/DVB", impacto:"Abortos 5–30%, anovulación, repetición de celos. Reducción preñez hasta −15 pp.", alerta:"alta" },
  { nombre:"Leptospirosis", impacto:"Abortos tardíos, mortalidad neonatal, agalaxia. Frecuente en inundaciones NEA.", alerta:"alta" },
  { nombre:"Brucelosis", impacto:"Aborto masivo al 7° mes. Zoonosis. Control oficial obligatorio (Argentina).", alerta:"alta" },
  { nombre:"Tricomoniasis/Campylobacteriosis", impacto:"Repetición de celos, abortos tempanos, infertilidad. Toro = vector principal.", alerta:"media" },
  { nombre:"Neospora caninum", impacto:"Abortos 5–20%, mortalidad neonatal. Perros como huéspedes definitivos.", alerta:"media" },
];

// Evaluación básica de estado sanitario
function evaluarSanidad(vacunas, toros, historiaAbortos, programaSanit) {
  const alerts = [];
  if (!vacunas || vacunas === "no") {
    alerts.push({ nivel:"rojo", msg:"⚠️ Sin vacunación IBR/DVB declarada: riesgo de reducción de preñez hasta −15 pp. Consultar médico veterinario." });
  }
  if (toros === "sin_control") {
    alerts.push({ nivel:"rojo", msg:"Toros sin evaluación reproductiva (ESAN): tricomoniasis/campylobacteriosis no detectadas. El toro en CC 4.0 es tan crítico como vaca en CC 3.5." });
  }
  if (historiaAbortos === "si") {
    alerts.push({ nivel:"ambar", msg:"Historia de abortos: diagnóstico diferencial IBR/DVB/Leptospira/Neospora prioritario antes del próximo servicio." });
  }
  if (programaSanit === "no" || !programaSanit) {
    alerts.push({ nivel:"ambar", msg:"Sin programa sanitario estructurado declarado. La sanidad es el techo del sistema: sin ella, cualquier mejora nutricional tiene rendimiento marginal." });
  }
  return { alerts };
}
// ═══════════════════════════════════════════════════════
// FORM_DEF COMPLETO v13
// ═══════════════════════════════════════════════════════
const FORM_DEF={
  // Ubicación
  nombreProductor:"",zona:"NEA",provincia:"Corrientes",
  // Rodeo
  biotipo:"Brangus 3/8",primerParto:false,
  vacasN:"",torosN:"",pvVacaAdulta:"320",
  eReprod:"Gestación media (5–7 meses)",prenez:"",pctDestete:"88",
  // Servicio + vaquillonas
  iniServ:"",finServ:"",
  edadVaqMayo:"",          // NUEVO: edad vaquillona al 1° mayo (meses)
  tipoDesteteVaq:"hiper",  // NUEVO: tipo de destete de origen de las vaquillonas
  v2sN:"",v2sPV:"",v2sTernero:"",
  cc2sDist:[{cc:"5.0",pct:"50"},{cc:"4.5",pct:"50"}],
  pctReposicion:"20",vaq1PV:"",vaq2N:"",vaq2PV:"",
  // CC distribución vacas
  distribucionCC:[{cc:"5.5",pct:"20"},{cc:"5.0",pct:"50"},{cc:"4.5",pct:"30"}],
  // Destete
  destTrad:"0",destAntic:"0",destHiper:"100",
  // Forraje
  vegetacion:"Pastizal natural NEA/Chaco",fenologia:"menor_10",
  supHa:"",pctMonte:"10",pctNGan:"5",
  // Suplementación
  supl1:"",dosis1:"0",
  supl2:"",dosis2:"0",
  supl3:"",dosis3:"0",
  // ENSO
  enso:"neutro",
  // AGUA DE BEBIDA (López et al. 2021, JAS)
  aguaTDS:"",            // TDS mg/L
  aguaTipoSal:"Mixta/Desconocida",
  aguaFuente:"",         // pozo, laguna, arroyo, etc.
  // SANIDAD
  sanVacunas:"si",       // si/no
  sanToros:"con_control",// con_control / sin_control
  sanAbortos:"no",       // historia abortos si/no
  sanPrograma:"si",      // programa sanitario si/no
  // Consulta
  consultaEspecifica:"",
};

const PASOS=[
  {id:"ubicacion",icon:"📍",label:"Ubicación"},
  {id:"rodeo",icon:"🐄",label:"Rodeo"},
  {id:"cc",icon:"📊",label:"CC"},
  {id:"categorias",icon:"🐮",label:"Categ."},
  {id:"forraje",icon:"🌾",label:"Forraje"},
  {id:"agua",icon:"💧",label:"Agua"},
  {id:"supl",icon:"💊",label:"Suplemento"},
  {id:"analisis",icon:"⚡",label:"Análisis"},
];

const SUPUESTOS=[
  {icon:"🛰",tit:"NDVI estimado",desc:"Calculado desde precipitación + zona + mes. Fenología de campo tiene prioridad."},
  {icon:"📊",tit:"Clima histórico",desc:"Fuera del mes actual se usan promedios provinciales (INTA/SMN)."},
  {icon:"💧",tit:"Agua de bebida",desc:"Si no se carga TDS, se asume calidad aceptable. Analizar agua periódicamente."},
  {icon:"🐄",tit:"Biotipo",desc:"Coeficientes de biotipo son aproximaciones de literatura. Verificar con datos propios."},
];

// ─── MICRO COMPONENTES APP ────────────────────────────────────────
function Input({label,value,onChange,placeholder,type="text",sub,warn}){
  return<div style={{marginBottom:14}}>
    {label&&<div style={{fontFamily:C.font,fontSize:10,color:C.textDim,letterSpacing:1,marginBottom:5}}>{label}</div>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{width:"100%",background:C.card2,border:`1px solid ${warn?"rgba(232,160,48,.5)":C.border}`,borderRadius:10,
        color:C.text,padding:"12px 14px",fontFamily:C.sans,fontSize:14,boxSizing:"border-box"}}/>
    {sub&&<div style={{fontFamily:C.sans,fontSize:10,color:C.textFaint,marginTop:4}}>{sub}</div>}
    {warn&&<div style={{fontFamily:C.sans,fontSize:10,color:C.amber,marginTop:4}}>⚠ {warn}</div>}
  </div>;
}

function SelectF({label,value,onChange,options}){
  return<div style={{marginBottom:14}}>
    {label&&<div style={{fontFamily:C.font,fontSize:10,color:C.textDim,letterSpacing:1,marginBottom:5}}>{label}</div>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{width:"100%",background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,
        color:C.text,padding:"12px 14px",fontFamily:C.sans,fontSize:14}}>
      {options.map(([v,l])=><option key={v} value={v}>{l}</option>)}
    </select>
  </div>;
}

// ─── COMPONENTE AGUA ─────────────────────────────────────────────
function PanelAgua({form,set,sat,cadena}){
  const enLact=form.eReprod==="Lactación con ternero al pie";
  const evalAgua=form.aguaTDS?evaluarAgua(form.aguaTDS,form.aguaTipoSal,form.pvVacaAdulta,sat?.temp||25,enLact,form.enso):null;
  const consumoBase=calcConsumoAgua(form.pvVacaAdulta,sat?.temp||25,enLact);

  return<div>
    <div style={{background:`${C.blue}10`,border:`1px solid ${C.blue}30`,borderRadius:12,padding:12,marginBottom:14}}>
      <div style={{fontFamily:C.font,fontSize:10,color:C.blue,letterSpacing:1,marginBottom:4}}>💧 AGUA DE BEBIDA</div>
      <div style={{fontFamily:C.sans,fontSize:12,color:C.textDim,lineHeight:1.6}}>
        Fuente: López et al. 2021, JAS 99(8). Meta-análisis 25 estudios. TDS ({'>'} 3.000 mg/L) reduce DMI y consumo de agua significativamente.
      </div>
    </div>
    <Input label="TDS TOTAL — SÓLIDOS DISUELTOS (mg/L)" value={form.aguaTDS} onChange={v=>set("aguaTDS",v)}
      placeholder="Ej: 1500" type="number"
      sub="Análisis de agua: laboratorio INTA/SENASA o tiras reactivas de campo"/>
    {!form.aguaTDS&&<div style={{background:"rgba(74,159,212,.06)",border:"1px solid rgba(74,159,212,.2)",borderRadius:8,padding:10,marginBottom:12}}>
      <div style={{fontFamily:C.sans,fontSize:11,color:C.blue}}>
        Sin TDS cargado — se asume calidad aceptable (TDS {'<'}1.000 mg/L). Si hay dudas sobre el agua, solicitá análisis.
      </div>
    </div>}
    <SelectF label="TIPO DE SAL DOMINANTE" value={form.aguaTipoSal} onChange={v=>set("aguaTipoSal",v)}
      options={[["NaCl dominante","NaCl (cloruros) — agua costera/subterránea"],["SO4 dominante","SO4 (sulfatos) — Chaco/Santiago del Estero"],["Mixta/Desconocida","Mixta / Sin analizar (usar factor conservador)"]]}/>
    <Input label="FUENTE DE AGUA" value={form.aguaFuente} onChange={v=>set("aguaFuente",v)}
      placeholder="Pozo, laguna, arroyo, represa…"/>

    {/* Consumo esperado según temperatura */}
    <div style={{background:C.card2,borderRadius:12,padding:12,border:`1px solid ${C.border}`,marginBottom:12}}>
      <div style={{fontFamily:C.font,fontSize:9,color:C.textDim,letterSpacing:1,marginBottom:8}}>CONSUMO DE AGUA ESTIMADO</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <MetricCard label="HOY (T actual)" value={consumoBase+"L"} color={C.blue}
          sub={`${sat?.temp||"—"}°C · ${enLact?"Lactando":"Gestación"}`}/>
        <MetricCard label="EN VERANO (35°C)" value={calcConsumoAgua(form.pvVacaAdulta,35,enLact)+"L"} color={C.amber}
          sub="Pico de demanda anual"/>
      </div>
      <div style={{fontFamily:C.sans,fontSize:10,color:C.textFaint,marginTop:8}}>
        Referencia: NRC 2000 / Winchester & Morris 1956. Asegurar caudal suficiente y acceso (mín. 5 cm lineal de bebedero/vaca).
      </div>
    </div>

    {/* Evaluación de calidad */}
    {evalAgua&&<div>
      <div style={{background:`${evalAgua.cat.color}15`,border:`1px solid ${evalAgua.cat.color}50`,borderRadius:12,padding:12,marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontFamily:C.font,fontSize:14,fontWeight:700,color:evalAgua.cat.color}}>{evalAgua.cat.label}</span>
          <span style={{fontFamily:C.font,fontSize:11,color:C.text}}>{evalAgua.tdsN.toLocaleString()} mg/L</span>
        </div>
        <div style={{fontFamily:C.sans,fontSize:11,color:C.textDim,marginTop:4,lineHeight:1.5}}>{evalAgua.cat.desc}</div>
        {evalAgua.pctReducDMI>0&&<div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}>
          <Pill color={C.red}>DMI −{evalAgua.pctReducDMI.toFixed(0)}%</Pill>
          <Pill color={C.amber}>Consumo agua −{evalAgua.pctReducWI.toFixed(0)}%</Pill>
          {evalAgua.ts.factor>1.1&&<Pill color={C.red}>SO4: efecto ×{evalAgua.ts.factor}</Pill>}
        </div>}
      </div>
      {evalAgua.warnings.map((w,i)=><Alerta key={i} tipo={w.nivel==="rojo"?"error":w.nivel==="ambar"?"warn":"ok"}>{w.msg}</Alerta>)}
      <div style={{fontFamily:C.font,fontSize:9,color:C.textFaint,marginTop:4}}>Fuente: López et al. 2021, JAS 99(8):skab215</div>
    </div>}

    {/* Sanidad */}
    <div style={{marginTop:20}}>
      <div style={{fontFamily:C.font,fontSize:10,color:C.amber,letterSpacing:1,marginBottom:12}}>🩺 SANIDAD — ASPECTOS REPRODUCTIVOS</div>
      <div style={{fontFamily:C.sans,fontSize:11,color:C.textDim,marginBottom:12,lineHeight:1.6}}>
        La sanidad es el techo del sistema. Sin ella, cualquier mejora nutricional tiene rendimiento marginal.
      </div>
      <Toggle label="¿Vacunación IBR/DVB al día?" value={form.sanVacunas==="si"} onChange={v=>set("sanVacunas",v?"si":"no")}/>
      {form.sanVacunas==="no"&&<Alerta tipo="error">IBR/DVB sin vacunar: riesgo de reducción de preñez hasta −15 pp. Abortos, anovulación. Consultar veterinario urgente.</Alerta>}
      <Toggle label="¿Toros con evaluación ESAN?" value={form.sanToros==="con_control"} onChange={v=>set("sanToros",v?"con_control":"sin_control")}/>
      {form.sanToros==="sin_control"&&<Alerta tipo="error">Toros sin ESAN: tricomoniasis/campylobacteriosis no detectadas. Un toro con CC 4.0 o enfermedad es tan limitante como vacas con CC 3.5.</Alerta>}
      <Toggle label="¿Historia de abortos en el rodeo?" value={form.sanAbortos==="si"} onChange={v=>set("sanAbortos",v?"si":"no")}/>
      {form.sanAbortos==="si"&&<Alerta tipo="warn">Historia de abortos: diagnóstico diferencial (IBR/DVB/Leptospira/Neospora) prioritario antes del próximo servicio.</Alerta>}
      <Toggle label="¿Programa sanitario estructurado?" value={form.sanPrograma==="si"} onChange={v=>set("sanPrograma",v?"si":"no")}/>
      {/* Enfermedades de referencia */}
      <div style={{background:C.card2,borderRadius:12,padding:12,border:`1px solid ${C.border}`,marginTop:12}}>
        <div style={{fontFamily:C.font,fontSize:9,color:C.textDim,letterSpacing:1,marginBottom:8}}>ENFERMEDADES REPRODUCTIVAS — REFERENCIA</div>
        {ENFERMEDADES_REPROD.map((e,i)=><div key={i} style={{borderBottom:i<ENFERMEDADES_REPROD.length-1?`1px solid ${C.border}`:"none",padding:"8px 0"}}>
          <div style={{fontFamily:C.sans,fontSize:12,color:e.alerta==="alta"?C.red:C.amber,fontWeight:600}}>{e.nombre}</div>
          <div style={{fontFamily:C.sans,fontSize:11,color:C.textDim,marginTop:2}}>{e.impacto}</div>
        </div>)}
      </div>
    </div>
  </div>;
}

// ─── MAIN APP ─────────────────────────────────────────────────────
export default function AgroMindPro(){
  const{data:session}=useSession();
  const[form,setForm]=useState(FORM_DEF);
  const[step,setStep]=useState(0);
  const[sat,setSat]=useState(null);
  const[coords,setCoords]=useState(null);
  const[loading,setLoading]=useState(false);
  const[loadMsg,setLoadMsg]=useState("");
  const[result,setResult]=useState("");
  const[tab,setTab]=useState("diagnostico");
  const[modoForraje,setModoForraje]=useState("general");
  const[usaPotreros,setUsaPotreros]=useState(false);
  const[potreros,setPotreros]=useState([{ha:"",veg:"Pastizal natural NEA/Chaco",fenol:"menor_10"}]);

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const setDist=(k,v)=>setForm(f=>({...f,[k]:v}));

  const cadena=useMemo(()=>calcCadena(form.iniServ,form.finServ),[form.iniServ,form.finServ]);
  const dispar=useMemo(()=>sat&&form.provincia?calcDisp(form.provincia,sat.ndvi,sat.temp):null,[sat,form.provincia]);
  const ccPondVal=useMemo(()=>ccPond(form.distribucionCC),[form.distribucionCC]);
  const nVaqRepos=Math.round((parseInt(form.vacasN)||0)*(parseFloat(form.pctReposicion)||20)/100);
  const tcSave=useMemo(()=>calcTerneros(form.vacasN,form.prenez,form.pctDestete,form.destTrad,form.destAntic,form.destHiper,cadena),[form,cadena]);
  const pvEntradaVaq2=form.vaq2PV||tcSave?.pvMayoPond&&Math.round(tcSave.pvMayoPond*0.85+tcSave.pvMayoPond*0.40)||"";
  const ndviN=sat?.ndvi||0.45;
  const vaq1E=useMemo(()=>calcVaq1(tcSave?.pvMayoPond||form.vaq1PV,form.pvVacaAdulta,ndviN,form.edadVaqMayo,form.tipoDesteteVaq),[tcSave,form,ndviN]);
  const vaq2E=useMemo(()=>calcVaq2(pvEntradaVaq2||form.vaq2PV,form.pvVacaAdulta,ndviN),[pvEntradaVaq2,form.vaq2PV,form.pvVacaAdulta,ndviN]);
  const evalAgua=useMemo(()=>form.aguaTDS?evaluarAgua(form.aguaTDS,form.aguaTipoSal,form.pvVacaAdulta,sat?.temp||25,form.eReprod==="Lactación con ternero al pie",form.enso):null,[form,sat]);
  const sanidad=useMemo(()=>evaluarSanidad(form.sanVacunas,form.sanToros,form.sanAbortos,form.sanPrograma),[form.sanVacunas,form.sanToros,form.sanAbortos,form.sanPrograma]);

  const baseParams=useMemo(()=>({
    dist:form.distribucionCC,cadena,
    destTrad:form.destTrad,destAntic:form.destAntic,destHiper:form.destHiper,
    dDisp:dispar?.dias,supHa:form.supHa,vacasN:form.vacasN,
    biotipo:form.biotipo,primerParto:form.primerParto,
    supl1:form.supl1,dosis1:form.dosis1,
    supl2:form.supl2,dosis2:form.dosis2,
    supl3:form.supl3,dosis3:form.dosis3,
  }),[form,cadena,dispar]);

  const tray=useMemo(()=>calcTrayectoriaCC(baseParams),[baseParams]);
  const dist=useMemo(()=>calcDistCC({...baseParams,ndvi:ndviN,prov:form.provincia}),[baseParams,ndviN,form.provincia]);

  useEffect(()=>{
    if(!coords)return;
    setSat(null);
    fetchSat(coords.lat,coords.lon,form.zona,form.provincia,form.enso,setSat);
  },[coords,form.enso]);

  async function gpsClick(){
    if(!navigator.geolocation){setSat({error:"GPS no disponible"});return;}
    navigator.geolocation.getCurrentPosition(pos=>{
      const la=+pos.coords.latitude.toFixed(5),lo=+pos.coords.longitude.toFixed(5);
      setCoords({lat:la,lon:lo});
      set("zona",dZona(la,lo));set("provincia",dProv(la,lo));
    },()=>setSat({error:"No se pudo obtener ubicación"}),{timeout:8000});
  }

  async function latLonManual(lat,lon){
    const la=parseFloat(lat),lo=parseFloat(lon);
    const err=validarManual(la,lo);
    if(err){setSat({error:err});return;}
    setCoords({lat:la,lon:lo});
    set("zona",dZona(la,lo));set("provincia",dProv(la,lo));
  }

  function buildPromptFull(){
    const hoy=new Date().toLocaleDateString("es-AR",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
    let t=`ANÁLISIS — ${hoy}\n`;
    if(coords)t+=`UBICACIÓN: ${coords.lat?.toFixed(4)}°S ${coords.lon?.toFixed(4)}°W · ${form.zona} · ${form.provincia}\n`;
    if(sat?.temp)t+=`MET REAL: T${sat.temp}°C (Mx${sat.tMax}/Mn${sat.tMin}) · P7d:${sat.p7}mm P30d:${sat.p30}mm · Bal:${sat.deficit>0?"+":""}${sat.deficit}mm · NDVI:${sat.ndvi}(${sat.condForr})\n`;
    t+=`ENSO: ${form.enso==="nino"?"El Niño +25%":form.enso==="nina"?"La Niña −25%":"Neutro"} · BIOTIPO: ${form.biotipo||"Brangus 3/8"}\n`;
    if(dispar)t+=`DISPARADOR C4: ${dispar.dias===0?"⛔ Invierno activo — C4 restringido":dispar.dias+" días hasta temp <15°C"}\n`;
    if(cadena){
      t+=`\nCRONOLOGÍA MOMENTOS CRÍTICOS:\n`;
      t+=`  Disparador C4: ${dispar?.dias||"—"} días\n  Parto temp: ${fmtFecha(cadena.partoTemp)} (en ${cadena.diasPartoTemp}d)\n`;
      t+=`  Parto tard: ${fmtFecha(cadena.partoTard)} · Destete temp: ${fmtFecha(cadena.desteTemp)} · Destete tard: ${fmtFecha(cadena.desteTard)}\n`;
      if(cadena.terneroOtono)t+=`  ⚠️ ALERTA CRÍTICA: Ternero al pie en otoño\n`;
    }
    if(sat&&form.pvVacaAdulta&&form.fenologia){
      const cons=calcConsumoPasto(form.pvVacaAdulta,form.fenologia,sat.temp);
      t+=`\nCONSUMO VOLUNTARIO: Fenología ${form.fenologia} → CV ${cons.cv}%PV → ${cons.kgMs}kg MS/d · Dig ${cons.dig}% · PB pasto ${cons.pb}% · EM pasto: ${cons.emTotal} Mcal/v/d\n`;
    }
    t+=`\nRODEO: ${form.vacasN||"—"} vacas · ${form.torosN||"—"} toros · PV ${form.pvVacaAdulta||"—"}kg · Preñez hist ${form.prenez||"—"}% · Dest ${form.pctDestete||"—"}%\n`;
    t+=`Estado reprod: ${form.eReprod||"—"}${form.primerParto?" · ⚠️ Incluye vacas 1° parto":""}\n`;
    t+=`Superficie: ${form.supHa||"—"} ha · Carga: ${form.vacasN&&form.supHa?(parseFloat(form.vacasN)/parseFloat(form.supHa)).toFixed(2):"—"} EV/ha\n`;
    if(usaPotreros&&potreros?.length){t+=`POTREROS: ${potreros.length} · ${potreros.reduce((s,p)=>s+(parseFloat(p.ha)||0),0)}ha\n`;potreros.forEach((p,i)=>t+=`  P${i+1}: ${p.ha||"—"}ha · ${p.veg} · ${p.fenol||"—"}\n`);}
    else t+=`Vegetación: ${form.vegetacion||"—"} · Fenología: ${form.fenologia||"—"}\n`;
    // Agua de bebida
    if(evalAgua){
      t+=`\nAGUA DE BEBIDA (López et al. 2021, JAS):\n`;
      t+=`  TDS: ${evalAgua.tdsN} mg/L (${evalAgua.cat.label}) · Tipo sal: ${form.aguaTipoSal} · Factor efecto: ×${evalAgua.ts.factor}\n`;
      if(evalAgua.pctReducDMI>0)t+=`  ⚠️ Impacto estimado: DMI −${evalAgua.pctReducDMI.toFixed(0)}% · Consumo agua −${evalAgua.pctReducWI.toFixed(0)}%\n`;
      t+=`  Consumo agua esperado hoy: ${evalAgua.consumoEsperado}L/vaca/día\n`;
    }else{t+=`AGUA: Sin análisis TDS cargado — asumir calidad aceptable\n`;}
    // Sanidad
    t+=`\nSANIDAD:\n  Vacunación IBR/DVB: ${form.sanVacunas==="si"?"✅ Al día":"⚠️ Sin vacunar"}\n`;
    t+=`  Toros ESAN: ${form.sanToros==="con_control"?"✅ Evaluados":"⚠️ Sin evaluación"}\n`;
    t+=`  Historia abortos: ${form.sanAbortos==="si"?"⚠️ Sí":"No"}\n`;
    t+=`  Programa sanitario: ${form.sanPrograma==="si"?"✅ Sí":"⚠️ No declarado"}\n`;
    if(sanidad.alerts.length>0)t+=`  ALERTAS SANITARIAS:\n`+sanidad.alerts.map(a=>`    ${a.msg}`).join("\n")+"\n";
    if(tray){
      t+=`\nTRAYECTORIA CC (${form.biotipo||"Brangus 3/8"}):\n`;
      t+=`  ${tray.ccHoy}→${tray.ccParto}→${tray.ccMinLact}→${tray.ccDestete}→${tray.ccServ} · Preñez: ${tray.pr}% · Anestro: ${tray.anestro?.dias}d ${tray.anestro?.riesgo?"⚠️":"✅"}\n`;
      t+=`  Caída: −${tray.caídaLact} en ${tray.mesesLact}m · Tasa: ${tray.tasaCaida}pts/mes\n`;
    }
    if(form.supl1)t+=`SUPL.Gestación: ${form.supl1} ${form.dosis1}kg/d (${mcalSuplemento(form.supl1,parseFloat(form.dosis1)).toFixed(1)} Mcal)\n`;
    if(form.supl2)t+=`SUPL.Lactancia: ${form.supl2} ${form.dosis2}kg/d (${mcalSuplemento(form.supl2,parseFloat(form.dosis2)).toFixed(1)} Mcal)\n`;
    if(form.supl3)t+=`SUPL.Preparto: ${form.supl3} ${form.dosis3}kg/d (${mcalSuplemento(form.supl3,parseFloat(form.dosis3)).toFixed(1)} Mcal)\n`;
    if(dist?.grupos?.length){t+=`\nCC POR GRUPO:\n`;dist.grupos.forEach(g=>t+=`  CC${g.ccHoy}(${g.pct}%):→parto${g.ccParto}→mín${g.ccMinLact}→serv${g.ccServ}→${g.pr}%p·anestro${g.anestro?.dias}d·${g.urgencia}·${g.recDestete}\n`);}
    if(tcSave){t+=`TERNEROS: ${tcSave.terneros}cab·PV mayo:${tcSave.pvMayoPond}kg\n`;if(tcSave.alertaHiper)t+=`  ⚡ Hiperprecoz >30% — supl.proteica inmediata\n`;}
    t+=`VAQ1: ${nVaqRepos}cab (${form.pctReposicion||20}% repos)`;
    if(form.edadVaqMayo)t+=` · Edad mayo:${form.edadVaqMayo}m · Destete origen:${form.tipoDesteteVaq}`;
    if(vaq1E&&vaq1E.esc!=="—")t+=`\n  Esc${vaq1E.esc}: P${vaq1E.prot}kg E${vaq1E.energ||0}kg ${vaq1E.freq} GDP${vaq1E.gdpReal}g/d→PV${vaq1E.pvSal}kg${vaq1E.nota?" · "+vaq1E.nota:""}\n`;
    else t+="\n";
    if(form.vaq2N){t+=`VAQ2: ${form.vaq2N}cab`;if(vaq2E&&vaq2E.esc!=="—")t+=` · Esc${vaq2E.esc}: GDP${vaq2E.gdpReal}g/d→${vaq2E.pvEntore}kg(mín${vaq2E.pvMinEntore}kg)${vaq2E.llegas?"✅":"⚠️ NO LLEGA"}`;t+="\n";}
    if(form.v2sN)t+=`V2S: ${form.v2sN}cab·PV${form.v2sPV||"—"}kg·${form.v2sTernero==="si"?"con ternero":"sin ternero"}\n`;
    if(form.consultaEspecifica)t+=`\nCONSULTA: ${form.consultaEspecifica}\n`;
    return t;
  }

  const SYS_FULL=`Actuás como asesor técnico experto en sistemas de cría bovina extensiva — NEA, NOA, Paraguay, Brasil, Bolivia. 20 años de campo en pasturas megatérmicas C4.

MODELO TÉCNICO v13 — INTEGRACIÓN COMPLETA:
- CLIMA: T, precipitación, NDVI, ENSO modulan oferta forrajera. Disparador C4 <15°C es el momento crítico central
- CONSUMO VOLUNTARIO: fenología del pasto define kg MS/vaca/día (Lippke 1980; Minson 1990): <10%→2.8%PV · 10-25%→2.4% · 25-50%→2.0% · >50%→1.6%PV. Siempre citar consumo en Mcal/v/d
- AGUA DE BEBIDA (López et al. 2021, JAS 99:skab215): TDS >3.000mg/L reduce DMI y consumo de agua significativamente. SO4 tiene efecto lineal y más severo que NaCl. Siempre incluir en diagnóstico si se cargó TDS. Calcular consumo esperado por temperatura
- BIOTIPO: modifica movilización CC, recuperación y umbral anestro posparto (Short et al. 1990; Neel et al. 2007)
- ANESTRO: modelado explícito — duración depende CC al parto, CC mínima, biotipo, primípara
- SINCRONÍA RUMINAL: Urea + pasto >50% floración = riesgo real. Siempre advertir
- SANIDAD: es el TECHO del sistema. Sin vacunación IBR/DVB y toros sin ESAN → reducción preñez −15 pp. Señalarlo SIEMPRE en recomendaciones
- CRONOLOGÍA: el informe debe mostrar la línea temporal mes a mes: hoy → disparador C4 → parto → CC mín lactancia → destete → recuperación → servicio. En cada momento señalar qué hacer
- VAQUILLONA: ajustar GDP según tipo de destete origen (hiperprecoz = mayor compensatorio), edad en mayo, umbral entore

5 SECCIONES OBLIGATORIAS — emojis exactos:
1️⃣ DIAGNÓSTICO AMBIENTAL (clima real, NDVI, disparador C4, ENSO, agua de bebida, cronología fechas)
2️⃣ DIAGNÓSTICO POR CATEGORÍA (consumo kg MS/d estimado, PB pasto, Mcal requeridas vs oferta, balance)
3️⃣ DESTETE Y PROYECCIÓN CC (trayectoria mes a mes, CC mínima, anestro, CC al servicio, preñez)
4️⃣ BALANCE ENERGÉTICO (oferta pasto + suplemento + CC movilizada vs demanda · meses deficitarios · impacto agua si aplica)
5️⃣ RECOMENDACIONES (🔴🟡🟢 · suplementación con fuente/dosis/frecuencia/advertencia sincronía · sanidad · agua · cronograma por mes)

Citar: Peruchena INTA 2003 · Selk 1988 · Detmann/NASSEM 2010 · Paruelo & Oesterheld 2000 · Short et al. 1990 · Neel et al. 2007 · Lippke 1980 · Minson 1990 · López et al. 2021 JAS · NRC 2000`;

  async function runAnalysis(){
    setLoading(true);setResult("");setTab("diagnostico");
    let mi=0;const iv=setInterval(()=>{setLoadMsg(MSGS[mi%MSGS.length]);mi++;},2200);
    try{
      const prompt=buildPromptFull();
      const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt,systemPrompt:SYS_FULL})});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Error del servidor");
      setResult(data.result);
      fetch("/api/notify-owner",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({productor:form.nombreProductor||"Sin nombre",fecha:new Date().toLocaleDateString("es-AR"),zona:form.zona,vacas:form.vacasN,ccPond:ccPondVal?.toFixed(2),ccServ:tray?.ccServ,prenezEst:(tray?.pr||"—")+"%",condForr:sat?.condForr,aguaTDS:form.aguaTDS||"ND",resumenInforme:(data.result||"").slice(0,600)})
      }).catch(()=>{});
    }catch(e){setResult("❌ Error: "+e.message);}
    finally{clearInterval(iv);setLoading(false);}
  }

  function descargarPDF(){
    const gen=(jsPDF)=>{
      const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
      const W=210,ML=15,MR=15,AU=W-ML-MR;let y=15;
      const salto=(n=5)=>{y+=n;};const chk=(n=15)=>{if(y+n>285){doc.addPage();y=15;}};
      doc.setFillColor(45,106,31);doc.roundedRect(ML,y,AU,14,3,3,"F");
      doc.setFontSize(11);doc.setFont("helvetica","bold");doc.setTextColor(255,255,255);
      doc.text("🌾 AGROMIND PRO v13 — Informe Técnico Ganadero",ML+4,y+9);salto(18);
      doc.setFontSize(8);doc.setFont("helvetica","normal");doc.setTextColor(80,80,80);
      doc.text(`${form.nombreProductor||"—"} · ${form.zona||form.provincia||"—"} · ${new Date().toLocaleDateString("es-AR")} · Biotipo: ${form.biotipo||"—"}`,ML,y);salto(4);
      doc.setDrawColor(45,106,31);doc.setLineWidth(0.5);doc.line(ML,y,ML+AU,y);salto(7);
      const kpis=[["CC hoy",ccPondVal?.toFixed(1)||"—"],["CC serv.",tray?.ccServ||"—"],["Preñez est.",(tray?.pr||"—")+"%"],["Anestro",(tray?.anestro?.dias||"—")+"d"],["Agua",form.aguaTDS?(form.aguaTDS+"mg/L"):"ND"]];
      const kW=AU/kpis.length;
      kpis.forEach(([l,v],ki)=>{const kx=ML+ki*kW;doc.setFillColor(240,248,235);doc.roundedRect(kx,y,kW-2,14,2,2,"F");doc.setFontSize(7);doc.setFont("helvetica","normal");doc.setTextColor(100,100,100);doc.text(l,kx+kW/2-1,y+5,{align:"center"});doc.setFontSize(11);doc.setFont("helvetica","bold");doc.setTextColor(45,106,31);doc.text(String(v),kx+kW/2-1,y+11,{align:"center"});});salto(20);
      const partes=result.split(/(?=\d️⃣)/);
      SEC_EMOJIS.forEach((em,si)=>{
        const parte=partes.find(p=>p.startsWith(em));if(!parte)return;
        chk(20);const SEC_C=["#2d6a1f","#2d6a1f","#d4952a","#d4952a","#c04820"];
        const [r,g,b]=SEC_C[si].match(/\w\w/g).map(h=>parseInt(h,16));
        doc.setFillColor(r,g,b);doc.roundedRect(ML,y,AU,9,2,2,"F");
        doc.setFontSize(9);doc.setFont("helvetica","bold");doc.setTextColor(255,255,255);
        doc.text(`${si+1}. ${SEC_TITLES[si]}`,ML+4,y+6);salto(12);
        const txt=parte.replace(em,"").trim().replace(/\*\*(.*?)\*\*/g,"$1").replace(/[🔴🟡🟢⚡⚠️✅📊🌡🛰📉⚖️💧🩺]/gu,"");
        doc.setFontSize(8.5);doc.setFont("helvetica","normal");doc.setTextColor(44,62,45);
        doc.splitTextToSize(txt,AU).forEach(l=>{chk(5);doc.text(l,ML,y);salto(4.5);});salto(3);
      });
      chk(20);doc.setDrawColor(200,180,100);doc.setLineWidth(0.3);doc.line(ML,y,ML+AU,y);salto(5);
      doc.setFontSize(7);doc.setFont("helvetica","italic");doc.setTextColor(150,130,60);
      doc.splitTextToSize("AVISO LEGAL: "+DISCLAIMER,AU).forEach(l=>{chk(4);doc.text(l,ML,y);salto(3.5);});
      const tot=doc.getNumberOfPages();
      for(let p=1;p<=tot;p++){doc.setPage(p);doc.setFontSize(6);doc.setFont("helvetica","normal");doc.setTextColor(180,180,180);doc.text(`AgroMind Pro v13 · López et al. 2021 JAS · Peruchena INTA 2003 · Selk 1988 · Short et al. 1990 · Neel et al. 2007 · NASSEM 2010`,ML,292);doc.text(`${p}/${tot}`,W-MR,292,{align:"right"});}
      doc.save(`agromind_${(form.nombreProductor||"informe").replace(/\s/g,"_")}_${new Date().toISOString().slice(0,10)}.pdf`);
    };
    if(window.jspdf?.jsPDF)gen(window.jspdf.jsPDF);
    else{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";s.onload=()=>gen(window.jspdf.jsPDF);document.head.appendChild(s);}
  }

  if(!session)return<div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
    <div style={{fontFamily:C.font,fontSize:28,color:C.green,marginBottom:8,letterSpacing:2}}>🌾 AGROMIND</div>
    <div style={{fontFamily:C.sans,fontSize:13,color:C.textDim,marginBottom:32}}>PRO · v13</div>
    <button onClick={()=>signIn("google")} style={{background:C.green,color:"#0b1a0c",padding:"14px 28px",borderRadius:12,border:"none",fontFamily:C.sans,fontSize:15,fontWeight:700,cursor:"pointer"}}>Iniciar sesión con Google</button>
  </div>;

  // ── PASO 0: UBICACIÓN ─────────────────────────────────────────
  const renderUbicacion=()=><div>
    <button onClick={gpsClick} style={{width:"100%",background:C.green,color:"#0b1a0c",padding:14,borderRadius:12,border:"none",fontFamily:C.sans,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:12}}>📍 Usar mi ubicación GPS</button>
    {coords&&<Alerta tipo="ok">{form.zona} · {form.provincia} ({coords.lat.toFixed(3)}°, {coords.lon.toFixed(3)}°)</Alerta>}
    {sat&&!sat.error&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,margin:"10px 0"}}>
      <MetricCard label="TEMPERATURA" value={sat.temp+"°C"} color={C.amber}/>
      <MetricCard label="NDVI" value={sat.ndvi} color={C.green} sub={sat.condForr}/>
      <MetricCard label="LLUVIA 30D" value={sat.p30+"mm"} color={C.blue}/>
      <MetricCard label="BALANCE" value={(sat.deficit>0?"+":"")+sat.deficit+"mm"} color={sat.deficit>0?C.green:C.red}/>
    </div>}
    {sat?.error&&<Alerta tipo="warn">{sat.error}</Alerta>}
    <SelectF label="ZONA" value={form.zona} onChange={v=>set("zona",v)} options={[["NEA","NEA"],["Pampa Húmeda","Pampa Húmeda"],["NOA","NOA"],["Paraguay Oriental","Paraguay Oriental"],["Chaco Paraguayo","Chaco Paraguayo"],["Brasil (Cerrado)","Brasil (Cerrado)"],["Bolivia (Llanos)","Bolivia (Llanos)"]]}/>
    <SelectF label="PROVINCIA / REGIÓN" value={form.provincia} onChange={v=>set("provincia",v)} options={[["Corrientes","Corrientes"],["Chaco","Chaco"],["Formosa","Formosa"],["Entre Ríos","Entre Ríos"],["Santa Fe","Santa Fe"],["Santiago del Estero","Santiago del Estero"],["Salta","Salta"],["Buenos Aires","Buenos Aires"],["Córdoba","Córdoba"],["La Pampa","La Pampa"],["Paraguay Oriental","Paraguay Oriental"],["Chaco Paraguayo","Chaco Paraguayo"],["Mato Grosso do Sul (BR)","Mato Grosso do Sul (BR)"],["Santa Cruz / Beni (BO)","Santa Cruz / Beni (BO)"]]}/>
    <SelectF label="ENSO" value={form.enso} onChange={v=>set("enso",v)} options={[["neutro","Neutro"],["nino","El Niño (+25% oferta)"],["nina","La Niña (−25% oferta)"]]}/>
    <Input label="PRODUCTOR / ESTABLECIMIENTO" value={form.nombreProductor} onChange={v=>set("nombreProductor",v)} placeholder="Nombre del establecimiento"/>
  </div>;

  // ── PASO 1: RODEO ─────────────────────────────────────────────
  const renderRodeo=()=><div>
    <SelectF label="BIOTIPO" value={form.biotipo} onChange={v=>set("biotipo",v)} options={Object.keys(BIOTIPOS).map(k=>[k,BIOTIPOS[k].nombre])}/>
    {form.biotipo&&<div style={{background:C.card2,borderRadius:10,padding:10,marginBottom:12,border:`1px solid ${C.border}`}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <Pill color={C.green}>Mov CC ×{getBiotipo(form.biotipo).movCC}</Pill>
        <Pill color={C.blue}>Rec CC ×{getBiotipo(form.biotipo).recCC}</Pill>
        <Pill color={C.amber}>Anestro umbral CC{getBiotipo(form.biotipo).umbralAnestro}</Pill>
      </div>
    </div>}
    <Toggle label="¿Incluye vacas de 1° parto?" value={form.primerParto} onChange={v=>set("primerParto",v)}/>
    {form.primerParto&&<Alerta tipo="warn">1° parto: requerimientos +10% · Umbral anestro +0.3 CC · Monitorear de cerca</Alerta>}
    <div style={{height:12}}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Input label="VACAS" value={form.vacasN} onChange={v=>set("vacasN",v)} placeholder="200" type="number"/>
      <Input label="TOROS" value={form.torosN} onChange={v=>set("torosN",v)} placeholder="8" type="number"/>
    </div>
    <Input label="PV VACA ADULTA (kg)" value={form.pvVacaAdulta} onChange={v=>set("pvVacaAdulta",v)} placeholder="320" type="number"/>
    <Input label="PREÑEZ HISTÓRICA (%)" value={form.prenez} onChange={v=>set("prenez",v)} placeholder="75" type="number"/>
    <Input label="% DESTETE HISTÓRICO" value={form.pctDestete} onChange={v=>set("pctDestete",v)} placeholder="88" type="number"/>
    <SelectF label="ESTADO REPRODUCTIVO ACTUAL" value={form.eReprod} onChange={v=>set("eReprod",v)} options={["Gestación temprana (1–4 meses)","Gestación media (5–7 meses)","Preparto (último mes)","Lactación con ternero al pie","Vaca seca sin ternero"].map(e=>[e,e])}/>
    <Input label="SERVICIO — INICIO" value={form.iniServ} onChange={v=>set("iniServ",v)} type="date"/>
    <Input label="SERVICIO — FIN" value={form.finServ} onChange={v=>set("finServ",v)} type="date"/>
    {cadena&&<div style={{background:C.card2,borderRadius:10,padding:12,border:`1px solid ${C.border}`,marginBottom:12}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {[["Parto temprano",fmtFecha(cadena.partoTemp)],["Parto tardío",fmtFecha(cadena.partoTard)],["Destete temp.",fmtFecha(cadena.desteTemp)],["Destete tard.",fmtFecha(cadena.desteTard)]].map(([l,v])=><div key={l}>
          <div style={{fontFamily:C.font,fontSize:8,color:C.textDim}}>{l}</div>
          <div style={{fontFamily:C.sans,fontSize:12,color:C.text,fontWeight:600}}>{v}</div>
        </div>)}
      </div>
      {cadena.terneroOtono&&<Alerta tipo="error" style={{marginTop:8}}>⚠️ Ternero al pie en otoño — destete anticipado URGENTE</Alerta>}
    </div>}
    {/* NUEVO: Vaquillona — datos clave para cálculo */}
    <div style={{background:`${C.amber}08`,border:`1px solid ${C.amber}30`,borderRadius:12,padding:14,marginTop:4}}>
      <div style={{fontFamily:C.font,fontSize:10,color:C.amber,letterSpacing:1,marginBottom:10}}>🐄 VAQUILLONA — DATOS PARA SUPLEMENTACIÓN</div>
      <Input label="EDAD VAQUILLONA AL 1° MAYO (meses)" value={form.edadVaqMayo} onChange={v=>set("edadVaqMayo",v)} placeholder="8" type="number"
        sub="Define el PV esperado y el GDP necesario. Ej: parto oct = 7m al mayo"/>
      <SelectF label="TIPO DESTETE DE ORIGEN" value={form.tipoDesteteVaq} onChange={v=>set("tipoDesteteVaq",v)}
        options={[["hiper","⚡ Hiperprecoz (50d) — mayor GDP compensatorio"],["antic","🔶 Anticipado (90d)"],["trad","🟢 Tradicional (180d) — GDP estándar"]]}/>
      <div style={{fontFamily:C.sans,fontSize:10,color:C.textDim,lineHeight:1.6}}>
        {form.tipoDesteteVaq==="hiper"&&"Hiperprecoz: GDP compensatorio +50g/d esperado. Proteína crítica en primeros 30d post-destete."}
        {form.tipoDesteteVaq==="antic"&&"Anticipado: GDP compensatorio +25g/d. Proteína como palanca principal."}
        {form.tipoDesteteVaq==="trad"&&"Tradicional: GDP estándar. Suplementar si NDVI < 0.40."}
      </div>
    </div>
  </div>;

  // ── PASO 2: CC ────────────────────────────────────────────────
  const renderCC=()=><div>
    <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,letterSpacing:1,marginBottom:12}}>DISTRIBUCIÓN CC DEL RODEO</div>
    <DistCC dist={form.distribucionCC} onChange={v=>setDist("distribucionCC",v)} label=""/>
    {ccPondVal>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:12}}>
      <MetricCard label="CC POND." value={ccPondVal.toFixed(2)} color={smf(ccPondVal,4.5,5.5)}/>
      <MetricCard label="CC SERV." value={tray?.ccServ||"—"} color={tray?smf(parseFloat(tray.ccServ),4.5,5.5):C.textDim}/>
      <MetricCard label="PREÑEZ" value={(tray?.pr||"—")+"%"} color={tray?smf(tray.pr,35,55):C.textDim}/>
    </div>}
    {tray?.anestro&&<div style={{marginTop:10}}>
      <Alerta tipo={tray.anestro.riesgo?"error":"ok"}>
        Anestro posparto: <strong>{tray.anestro.dias} días</strong> — {tray.anestro.riesgo?"⚠️ RIESGO: puede no ovular durante el servicio":"OK dentro del período de servicio"}
      </Alerta>
    </div>}
  </div>;

  // ── PASO 3: CATEGORÍAS (vaca 2°, vaquillona 1° y 2°) ─────────
  const renderCategorias=()=><div>
    {/* Destete — acá para ver impacto inmediato en terneros y vaq */}
    <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,letterSpacing:1,marginBottom:12}}>MODALIDAD DE DESTETE</div>
    <Slider label="🟢 Tradicional (180d)" value={parseFloat(form.destTrad)||0} min={0} max={100} step={10} onChange={v=>set("destTrad",v)} unit="%" color={C.green}/>
    <Slider label="🔶 Anticipado (90d)" value={parseFloat(form.destAntic)||0} min={0} max={100} step={10} onChange={v=>set("destAntic",v)} unit="%" color={C.amber}/>
    <Slider label="⚡ Hiperprecoz (50d)" value={parseFloat(form.destHiper)||0} min={0} max={100} step={10} onChange={v=>set("destHiper",v)} unit="%" color={C.red}/>
    {(parseFloat(form.destTrad)||0)+(parseFloat(form.destAntic)||0)+(parseFloat(form.destHiper)||0)!==100&&
      <Alerta tipo="warn">La suma debe ser 100% (actual: {(parseFloat(form.destTrad)||0)+(parseFloat(form.destAntic)||0)+(parseFloat(form.destHiper)||0)}%)</Alerta>}
    {tcSave&&<div style={{background:C.card2,borderRadius:12,padding:12,border:`1px solid ${C.border}`,marginBottom:14}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <MetricCard label="TERNEROS DESTETADOS" value={tcSave.terneros} color={C.green}/>
        <MetricCard label="PV POND. MAYO (kg)" value={tcSave.pvMayoPond} color={C.amber} sub="Entrada 1°inv"/>
      </div>
      {tcSave.alertaHiper&&<Alerta tipo="warn" style={{marginTop:10}}>Hiperprecoz {">"}30% rodeo — suplementación proteica inmediata post-destete. GDP sin supl.: ~250g/d.</Alerta>}
      {tcSave.detalle?.map((d,i)=>d.pct>0&&<div key={i} style={{marginTop:6,display:"flex",justifyContent:"space-between",fontFamily:C.font,fontSize:11,borderTop:`1px solid ${C.border}`,paddingTop:6}}>
        <span style={{color:C.textDim}}>{d.label} ({Math.round(d.pct*100)}%)</span>
        <span><span style={{color:C.amber}}>{d.pvDest}kg</span><span style={{color:C.textFaint}}> → mayo </span><span style={{color:C.green}}>{d.pvMayo}kg</span></span>
      </div>)}
    </div>}
    {/* Vaca 2° servicio */}
    <details style={{marginBottom:10}}>
      <summary style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",listStyle:"none",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontFamily:C.font,fontSize:11,color:C.green,fontWeight:600}}>🔁 VACA 2° SERVICIO {form.v2sN?`· ${form.v2sN} cab.`:"· (opcional)"}</span>
      </summary>
      <div style={{background:C.card2,borderRadius:"0 0 12px 12px",padding:14,border:`1px solid ${C.border}`,borderTop:"none"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <Input label="Cantidad" value={form.v2sN} onChange={v=>set("v2sN",v)} placeholder="—" type="number"/>
          <Input label="PV (kg)" value={form.v2sPV} onChange={v=>set("v2sPV",v)} placeholder="300" type="number"/>
        </div>
        <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,marginBottom:8}}>Ternero al pie</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          {[["si","Con ternero"],["no","Sin ternero"]].map(([v,l])=><BtnSel key={v} active={form.v2sTernero===v} onClick={()=>set("v2sTernero",v)}>{l}</BtnSel>)}
        </div>
        <DistCC dist={form.cc2sDist} onChange={v=>setDist("cc2sDist",v)} label="Distribución CC 2° servicio"/>
      </div>
    </details>
    {/* Vaquillona 1° invierno */}
    <details open style={{marginBottom:10}}>
      <summary style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",listStyle:"none",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontFamily:C.font,fontSize:11,color:C.green,fontWeight:600}}>🐄 VAQ. 1° INVIERNO · {nVaqRepos} vaquillas</span>
      </summary>
      <div style={{background:C.card2,borderRadius:"0 0 12px 12px",padding:14,border:`1px solid ${C.border}`,borderTop:"none"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <Input label="% REPOSICIÓN" value={form.pctReposicion} onChange={v=>set("pctReposicion",v)} placeholder="20" type="number"/>
          <MetricCard label="VAQUILLAS" value={nVaqRepos} color={C.green}/>
        </div>
        {tcSave?.pvMayoPond>0&&<div style={{background:`${C.green}08`,border:`1px solid ${C.green}25`,borderRadius:10,padding:10,marginBottom:10}}>
          <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,marginBottom:3}}>PV entrada mayo 1°inv (ponderado de terneros)</div>
          <div style={{fontFamily:C.font,fontSize:22,color:C.green,fontWeight:700}}>{tcSave.pvMayoPond} kg</div>
          <div style={{fontFamily:C.sans,fontSize:10,color:C.textFaint}}>Tipo destete: {form.tipoDesteteVaq==="hiper"?"⚡ Hiperprecoz":form.tipoDesteteVaq==="antic"?"🔶 Anticipado":"🟢 Tradicional"} · Edad: {form.edadVaqMayo||"—"}m</div>
        </div>}
        {vaq1E&&(vaq1E.mensaje
          ?<Alerta tipo="ok">{vaq1E.mensaje}</Alerta>
          :<div style={{background:`${C.amber}08`,border:`1px solid ${C.amber}30`,borderRadius:10,padding:12}}>
            <div style={{fontFamily:C.font,fontSize:10,color:C.amber,marginBottom:8}}>ESC {vaq1E.esc} — SUPLEMENTACIÓN VAQ1</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <MetricCard label="PROTEÍNA" value={vaq1E.prot+"kg/d"} color={C.amber}/>
              <MetricCard label="ENERGÍA" value={vaq1E.energ>0?vaq1E.energ+"kg/d":"—"} color={C.blue}/>
              <MetricCard label="FRECUENCIA" value={vaq1E.freq} color={C.textDim} style={{gridColumn:"1/-1"}}/>
              <MetricCard label="GDP" value={vaq1E.gdpReal+"g/d"} color={C.green}/>
              <MetricCard label="PV AGOSTO" value={vaq1E.pvSal+"kg"} color={vaq1E.deficit?C.red:C.green} sub={vaq1E.deficit?`⚠ Falta ${vaq1E.objetivo-vaq1E.pvSal}kg`:"✓ Alcanza objetivo"}/>
            </div>
            {vaq1E.nota&&<Alerta tipo="info" style={{marginTop:8}}>{vaq1E.nota}</Alerta>}
            {vaq1E.pvAbr2Inv&&<div style={{marginTop:8,fontFamily:C.font,fontSize:11,color:C.textDim}}>PV entrada 2°inv (abril): <span style={{color:C.green,fontWeight:600}}>{vaq1E.pvAbr2Inv} kg</span></div>}
          </div>
        )}
      </div>
    </details>
    {/* Vaquillona 2° invierno */}
    <details open style={{marginBottom:10}}>
      <summary style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",listStyle:"none",display:"flex",alignItems:"center",gap:8,justifyContent:"space-between"}}>
        <span style={{fontFamily:C.font,fontSize:11,color:C.green,fontWeight:600}}>🐂 VAQ. 2° INVIERNO · {form.vaq2N?`${form.vaq2N} cab.`:"Ingresar cantidad"}</span>
        {!form.vaq2N&&<span style={{fontFamily:C.font,fontSize:9,color:C.amber,background:`${C.amber}15`,border:`1px solid ${C.amber}40`,borderRadius:4,padding:"2px 6px"}}>requerido</span>}
      </summary>
      <div style={{background:C.card2,borderRadius:"0 0 12px 12px",padding:14,border:`1px solid ${C.border}`,borderTop:"none"}}>
        {vaq2E?._aviso&&<Alerta tipo="warn">{vaq2E._aviso}</Alerta>}
        <div style={{fontFamily:C.sans,fontSize:11,color:C.textDim,marginBottom:10,lineHeight:1.6}}>Objetivo: PV ≥ 0.75 × PV adulta al entore. PV entrada calculado desde Vaq1.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
          <Input label="CANTIDAD" value={form.vaq2N} onChange={v=>set("vaq2N",v)} placeholder="30" type="number" warn={!form.vaq2N?"Campo requerido":null}/>
          <div>
            <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,marginBottom:5}}>PV ENTRADA (kg)</div>
            <div style={{background:`${C.green}08`,border:`1px solid ${C.green}25`,borderRadius:10,padding:"12px 14px",fontFamily:C.font,fontSize:16,color:C.green,fontWeight:700}}>
              {pvEntradaVaq2||"—"}{vaq1E?.pvAbr2Inv&&<span style={{fontFamily:C.font,fontSize:9,color:C.textDim,marginLeft:6}}>(de vaq1)</span>}
            </div>
          </div>
        </div>
        {vaq2E&&!vaq2E._aviso&&(vaq2E.esc==="—"
          ?<Alerta tipo="ok">Sin suplementación — ya supera el peso mínimo de entore ({vaq2E.pvMinEntore}kg)</Alerta>
          :<div style={{background:`${C.amber}08`,border:`1px solid ${C.amber}30`,borderRadius:10,padding:12}}>
            <div style={{fontFamily:C.font,fontSize:10,color:C.amber,marginBottom:8}}>ESC {vaq2E.esc} — HACIA ENTORE</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              <MetricCard label="GDP" value={vaq2E.gdpReal+"g/d"} color={C.green}/>
              <MetricCard label="PV ENTORE" value={vaq2E.pvEntore+"kg"} color={vaq2E.llegas?C.green:C.red}/>
              <MetricCard label="PV MÍN." value={vaq2E.pvMinEntore+"kg"} color={C.textDim}/>
            </div>
            {!vaq2E.llegas&&<Alerta tipo="error" style={{marginTop:8}}>⚠️ No alcanza el peso mínimo de entore ({vaq2E.pvMinEntore}kg) — revisar suplementación urgente</Alerta>}
          </div>
        )}
      </div>
    </details>
  </div>;

  // ── PASO 4: FORRAJE ───────────────────────────────────────────
  const renderForraje=()=><div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
      <BtnSel active={modoForraje==="general"} onClick={()=>{setModoForraje("general");setUsaPotreros(false);}} style={{padding:"12px 10px"}}>
        <div style={{fontSize:18,marginBottom:4}}>🏠</div>
        <div style={{fontFamily:C.font,fontSize:11,fontWeight:600,marginBottom:2}}>Campo completo</div>
        <div style={{fontFamily:C.font,fontSize:9,color:C.textFaint}}>Simple y rápido</div>
      </BtnSel>
      <BtnSel active={modoForraje==="potreros"} onClick={()=>{setModoForraje("potreros");setUsaPotreros(true);}} style={{padding:"12px 10px"}}>
        <div style={{fontSize:18,marginBottom:4}}>🗺️</div>
        <div style={{fontFamily:C.font,fontSize:11,fontWeight:600,marginBottom:2}}>Por potreros</div>
        <div style={{fontFamily:C.font,fontSize:9,color:C.textFaint}}>Más detallado</div>
      </BtnSel>
    </div>
    {modoForraje==="general"&&<>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <Input label="SUPERFICIE TOTAL (ha)" value={form.supHa} onChange={v=>set("supHa",v)} placeholder="500" type="number"/>
        <div>
          <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,letterSpacing:1,marginBottom:5}}>CARGA EV/HA</div>
          <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",fontFamily:C.font,fontSize:16,
            color:form.supHa&&form.vacasN?smf(2-(parseInt(form.vacasN)||0)/(parseFloat(form.supHa)||1),0.5,1.5):C.textDim}}>
            {form.supHa&&form.vacasN&&parseFloat(form.supHa)>0?((parseInt(form.vacasN)||0)/parseFloat(form.supHa)).toFixed(2):"—"}
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <Input label="% MONTE / PALMAR" value={form.pctMonte} onChange={v=>set("pctMonte",v)} placeholder="10" type="number"/>
        <Input label="% NO GANADERO" value={form.pctNGan} onChange={v=>set("pctNGan",v)} placeholder="5" type="number"/>
      </div>
      <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,letterSpacing:1,marginBottom:8}}>VEGETACIÓN PRINCIPAL</div>
      <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
        {Object.keys(PROD_BASE).map(v=><BtnSel key={v} active={form.vegetacion===v} onClick={()=>set("vegetacion",v)} style={{padding:"10px 14px"}}>{v}</BtnSel>)}
      </div>
      <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,letterSpacing:1,marginBottom:8}}>FENOLOGÍA ACTUAL</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {FENOLOGIAS.map(f=><button key={f.val} onClick={()=>set("fenologia",f.val)} style={{padding:"10px 8px",borderRadius:10,cursor:"pointer",textAlign:"left",background:form.fenologia===f.val?`${C.green}15`:C.card2,border:`1px solid ${form.fenologia===f.val?C.green:C.border}`}}>
          <div style={{fontSize:16,marginBottom:2}}>{f.emoji}</div>
          <div style={{fontFamily:C.sans,fontSize:11,color:C.text,fontWeight:600}}>{f.label}</div>
          <div style={{fontFamily:C.sans,fontSize:9,color:C.textDim}}>{f.desc}</div>
          {f.warn&&<div style={{fontFamily:C.sans,fontSize:9,color:C.amber,marginTop:2}}>{f.warn}</div>}
        </button>)}
      </div>
      {/* Consumo voluntario en tiempo real */}
      {form.fenologia&&form.pvVacaAdulta&&sat&&<div style={{background:`${C.green}06`,border:`1px solid ${C.green}20`,borderRadius:10,padding:10}}>
        {(()=>{const cons=calcConsumoPasto(form.pvVacaAdulta,form.fenologia,sat.temp);return<>
          <div style={{fontFamily:C.font,fontSize:9,color:C.green,letterSpacing:1,marginBottom:6}}>CONSUMO VOLUNTARIO (T={sat.temp}°C)</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Pill color={C.green}>{cons.kgMs}kg MS/vaca/d</Pill>
            <Pill color={C.green}>{cons.emTotal} Mcal/v/d</Pill>
            <Pill color={C.amber}>Dig {cons.dig}%</Pill>
            <Pill color={C.red}>PB pasto {cons.pb}%</Pill>
          </div>
          {cons.pb<8&&<Alerta tipo="warn" style={{marginTop:8}}>PB pasto {cons.pb}% — por debajo del mínimo ruminal (8%). Suplementación proteica crítica.</Alerta>}
        </>})()}
      </div>}
    </>}
    {modoForraje==="potreros"&&<>
      {potreros.map((p,i)=><div key={i} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontFamily:C.font,fontSize:12,color:C.green,fontWeight:600}}>Potrero {i+1}</span>
          <button onClick={()=>setPotreros(ps=>ps.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontFamily:C.font,fontSize:12}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <Input label="Hectáreas" value={p.ha} onChange={v=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],ha:v};return n;})} placeholder="100" type="number"/>
          <div>
            <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,marginBottom:5}}>Fenología</div>
            <select value={p.fenol} onChange={e=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],fenol:e.target.value};return n;})} style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"10px",fontFamily:C.sans,fontSize:13}}>
              {FENOLOGIAS.map(f=><option key={f.val} value={f.val}>{f.emoji} {f.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <div style={{fontFamily:C.font,fontSize:10,color:C.textDim,marginBottom:5}}>Vegetación</div>
          <select value={p.veg} onChange={e=>setPotreros(ps=>{const n=[...ps];n[i]={...n[i],veg:e.target.value};return n;})} style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,padding:"10px",fontFamily:C.sans,fontSize:13}}>
            {Object.keys(PROD_BASE).map(v=><option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>)}
      <button onClick={()=>setPotreros(ps=>[...ps,{ha:"",veg:"Pastizal natural NEA/Chaco",fenol:"menor_10"}])} style={{width:"100%",background:`${C.green}06`,border:`1px solid ${C.border}`,borderRadius:10,color:C.green,padding:12,fontFamily:C.sans,fontSize:12,cursor:"pointer",marginBottom:10}}>+ Agregar potrero</button>
      {potreros.some(p=>p.ha)&&<div style={{background:`${C.green}05`,border:`1px solid ${C.green}20`,borderRadius:8,padding:"8px 12px",fontFamily:C.font,fontSize:10,color:C.textDim}}>
        Total: <strong style={{color:C.green}}>{potreros.reduce((s,p)=>s+(parseFloat(p.ha)||0),0)} ha</strong> · {potreros.filter(p=>p.ha).length} potrero{potreros.filter(p=>p.ha).length>1?"s":""}
      </div>}
    </>}
  </div>;

  // ── PASO 5: AGUA + SANIDAD ─────────────────────────────────────
  const renderAgua=()=><PanelAgua form={form} set={set} sat={sat} cadena={cadena}/>;

  // ── PASO 6: SUPLEMENTACIÓN ────────────────────────────────────
  const renderSuplementacion=()=><div>
    <div style={{fontFamily:C.sans,fontSize:12,color:C.textDim,marginBottom:14,lineHeight:1.6}}>Cargá el suplemento. El modelo recalcula CC y preñez en tiempo real considerando sincronía ruminal y calidad del pasto.</div>
    <SuplSelector label="GESTACIÓN / INVIERNO" supl={form.supl1} dosis={parseFloat(form.dosis1)||0} onSuplChange={v=>set("supl1",v)} onDosisChange={v=>set("dosis1",v)} fenolPasto={form.fenologia} pvVaca={form.pvVacaAdulta} temp={sat?.temp} color={C.green}/>
    <SuplSelector label="LACTANCIA (mayor impacto CC)" supl={form.supl2} dosis={parseFloat(form.dosis2)||0} onSuplChange={v=>set("supl2",v)} onDosisChange={v=>set("dosis2",v)} fenolPasto={form.fenologia} pvVaca={form.pvVacaAdulta} temp={sat?.temp} color={C.amber}/>
    <SuplSelector label="PREPARTO (último mes)" supl={form.supl3} dosis={parseFloat(form.dosis3)||0} onSuplChange={v=>set("supl3",v)} onDosisChange={v=>set("dosis3",v)} fenolPasto={form.fenologia} pvVaca={form.pvVacaAdulta} temp={sat?.temp} color={C.blue}/>
    {tray&&(form.supl1||form.supl2||form.supl3)&&<div style={{background:`${C.green}10`,border:`1px solid ${C.green}30`,borderRadius:12,padding:14,marginTop:8}}>
      <div style={{fontFamily:C.font,fontSize:9,color:C.green,letterSpacing:1,marginBottom:8}}>IMPACTO SUPLEMENTACIÓN EN CC</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <MetricCard label="CC SERV. C/SUPL." value={tray.ccServ} color={smf(parseFloat(tray.ccServ),4.5,5.5)}/>
        <MetricCard label="PREÑEZ EST." value={tray.pr+"%"} color={smf(tray.pr,35,55)}/>
      </div>
      <div style={{fontFamily:C.sans,fontSize:10,color:C.textDim,marginTop:8}}>Boost preparto: +{tray.boostPreParto}CC · Reducción caída: ×{tray.reducCaida} · Boost post-destete: +{tray.boostPostDest}CC</div>
    </div>}
    <div style={{marginTop:16}}>
      <Input label="CONSULTA ESPECÍFICA (opcional)" value={form.consultaEspecifica} onChange={v=>set("consultaEspecifica",v)} placeholder="¿Qué querés analizar en detalle?"/>
    </div>
  </div>;

  // ── PASO 7: ANÁLISIS ─────────────────────────────────────────
  const renderAnalisis=()=><div>
    {!result&&!loading&&<button onClick={runAnalysis} style={{width:"100%",background:C.green,color:"#0b1a0c",padding:16,borderRadius:14,border:"none",fontFamily:C.font,fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:1,marginBottom:16}}>⚡ GENERAR ANÁLISIS TÉCNICO</button>}
    {loading&&<LoadingPanel msg={loadMsg}/>}
    {result&&!loading&&<div>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
        {[["diagnostico","📋 Diagnóstico"],["simulador","🔬 Simulador"],["balance","⚡ Balance"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flexShrink:0,padding:"8px 14px",borderRadius:20,cursor:"pointer",background:tab===k?C.green:"rgba(255,255,255,.04)",border:tab===k?`1px solid ${C.green}`:`1px solid ${C.border}`,color:tab===k?"#0b1a0c":C.textDim,fontFamily:C.sans,fontSize:12,fontWeight:tab===k?700:400}}>{l}</button>
        ))}
      </div>
      {tab==="diagnostico"&&<div>
        <RenderInforme texto={result}/>
        <button onClick={descargarPDF} style={{width:"100%",background:`${C.blue}12`,border:`1px solid ${C.blue}35`,borderRadius:10,color:C.blue,padding:13,fontFamily:C.sans,fontSize:13,cursor:"pointer",marginTop:10}}>⬇ Descargar PDF</button>
        <button onClick={runAnalysis} style={{width:"100%",background:`${C.green}06`,border:`1px solid ${C.border}`,borderRadius:10,color:C.textDim,padding:11,fontFamily:C.sans,fontSize:12,cursor:"pointer",marginTop:8}}>🔄 Regenerar análisis</button>
      </div>}
      {tab==="simulador"&&<SimuladorEscenarios form={form} cadena={cadena} dispar={dispar} baseParams={baseParams}/>}
      {tab==="balance"&&<div>
        <GraficoBalance form={form} sat={sat} cadena={cadena} tray={tray} usaPotreros={usaPotreros} potreros={potreros}/>
        <div style={{marginTop:14}}>
          <div style={{fontFamily:C.font,fontSize:9,color:C.textDim,letterSpacing:1,marginBottom:8}}>CC POR GRUPO AL SERVICIO</div>
          {dist?.grupos?.map((g,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,background:C.card2,borderRadius:10,padding:"10px 14px",marginBottom:6,border:`1px solid ${C.border}`}}>
            <span style={{fontFamily:C.font,fontSize:12,color:C.text,minWidth:36}}>CC{g.ccHoy}</span>
            <span style={{flex:1,fontFamily:C.font,fontSize:9,color:C.textDim}}>{g.pct}% · →parto{g.ccParto}→serv{g.ccServ}</span>
            <span style={{fontFamily:C.font,fontSize:14,fontWeight:700,color:smf(g.pr,35,55)}}>{g.pr}%</span>
            <span style={{fontFamily:C.sans,fontSize:10,color:g.urgencia==="urgente"?C.red:g.urgencia==="importante"?C.amber:C.green}}>{g.recDestete}</span>
          </div>)}
        </div>
      </div>}
    </div>}
  </div>;

  const RENDERS=[renderUbicacion,renderRodeo,renderCC,renderCategorias,renderForraje,renderAgua,renderSuplementacion,renderAnalisis];

  return<div style={{minHeight:"100vh",background:C.bg,paddingBottom:80}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=IBM+Plex+Sans:wght@400;600;700&display=swap');
      *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
      select,input,button{outline:none;}
      input[type=range]::-webkit-slider-thumb{width:18px;height:18px;}
      details>summary::-webkit-details-marker{display:none;}
      @keyframes pulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}
    `}</style>
    {/* Header */}
    <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"12px 16px",position:"sticky",top:0,zIndex:50,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{fontFamily:C.font,fontSize:14,color:C.green,letterSpacing:2,fontWeight:700}}>🌾 AGROMIND<span style={{color:C.textDim,fontSize:10,marginLeft:6}}>v13</span></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {ccPondVal>0&&<Pill color={smf(ccPondVal,4.5,5.5)}>CC {ccPondVal.toFixed(1)}</Pill>}
        {evalAgua&&evalAgua.cat.riesgo>=2&&<Pill color={C.red}>💧{evalAgua.cat.label}</Pill>}
        {sanidad.alerts.length>0&&<Pill color={C.red}>🩺{sanidad.alerts.length}</Pill>}
        <button onClick={()=>signOut()} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,color:C.textDim,padding:"5px 10px",fontFamily:C.font,fontSize:10,cursor:"pointer"}}>salir</button>
      </div>
    </div>
    {/* Paso label */}
    <div style={{padding:"14px 16px 6px"}}>
      <div style={{fontFamily:C.font,fontSize:11,color:C.green,letterSpacing:2,marginBottom:2}}>{PASOS[step].icon} {PASOS[step].label.toUpperCase()}</div>
      {form.nombreProductor&&<div style={{fontFamily:C.sans,fontSize:12,color:C.textDim}}>{form.nombreProductor}</div>}
    </div>
    {/* Contenido */}
    <div style={{padding:"0 16px"}}>{RENDERS[step]?.()}</div>
    {/* Nav bottom */}
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.card,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100,padding:"6px 0 env(safe-area-inset-bottom)"}}>
      {PASOS.map((p,i)=><button key={i} onClick={()=>setStep(i)} style={{flex:1,background:"none",border:"none",cursor:"pointer",padding:"6px 0",display:"flex",flexDirection:"column",alignItems:"center",gap:2,opacity:step===i?1:0.45}}>
        <span style={{fontSize:17}}>{p.icon}</span>
        <span style={{fontFamily:C.font,fontSize:7,color:step===i?C.green:C.textDim,letterSpacing:.5}}>{p.label}</span>
        {step===i&&<div style={{width:16,height:2,borderRadius:1,background:C.green}}/>}
      </button>)}
    </div>
  </div>;
}
