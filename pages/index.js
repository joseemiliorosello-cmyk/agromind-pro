import { useState, useEffect } from "react";

const SYS = `Actuás como asesor técnico experto en sistemas de cría bovina extensiva con recría de hembras en Argentina. 20 años de campo en pasturas megatérmicas y ambientes de baja calidad forrajera, NEA y semiárido. ZONA TEMPLADA: si la zona es Pampa Húmeda, Mesopotamia sur, Patagonia o similar con especies templadas, aclarar que varios conceptos de suplementación estratégica y fenología de megatérmicas NO aplican directamente.

═══════════════════════════════════════
EJE CENTRAL: EL DESTETE
═══════════════════════════════════════
Destete en FEBRERO es la palanca principal. NO el expeller, NO la suplementación.
Mecanismo: Destete Feb → caída −6–8 Mcal/día + rebrote otoñal → doble efecto → CC 5.5–6.0 al parto → pérdida 1.5 pts post-parto → CC 4.0 servicio → 75% preñez.
La recuperación de CC depende del pastizal y tamaño del animal, NO del suplemento.
El expeller NO puede compensar lactancia con ternero al pie.
Plan B: destete precoz o hiperprecoz inmediato.

═══════════════════════════════════════
VACA DE 2° SERVICIO — CATEGORÍA MÁS EXIGENTE
═══════════════════════════════════════
Triple demanda: LACTANDO + CRECIENDO + QUEDAR PREÑADA. ~20–22 Mcal/día requeridos.
Pastizal maduro aporta 5–8 Mcal → déficit estructural 12–17 Mcal/día.
REGLA ABSOLUTA: destete precoz es MANEJO ESTÁNDAR independientemente de la CC.
CÁLCULO CC: proyectar pérdida solo HASTA el destete estimado (no hasta el servicio).
Después del destete: proyectar recuperación CC según pastizal y tamaño animal.
CC objetivo al servicio: ≥5.5 (el más exigente del sistema).
Peso mínimo al entore: 0.75 × PV vaca adulta del rodeo.

═══════════════════════════════════════
CURVA CC → PREÑEZ (NEA, datos campo)
═══════════════════════════════════════
Pérdida post-parto: 1.5 puntos sin suplementar. 1 punto CC = 60 Mcal EM.
CC 6.0 parto → 4.5 serv → ~88% | CC 5.5 → 4.0 → ~75% (OBJETIVO) | CC 5.0 → 3.5 → ~55% | CC 4.5 → 3.0 → ~35% | CC 4.0 → 2.5 → ~15%
LA PALANCA ESTÁ EN EL PARTO, NO EN EL SERVICIO.

═══════════════════════════════════════
CONSUMO VOLUNTARIO SEGÚN FENOLOGÍA
═══════════════════════════════════════
El consumo voluntario NO es fijo — depende de la calidad de la pastura (D-value implícito en la fenología):
<10% floración: D-value alto → consumo 2.2–2.5% PV
10–25% floración: D-value medio-alto → consumo 2.0–2.2% PV
25–50% floración: D-value medio → consumo 1.8–2.0% PV (restricción física + metabólica)
>50% floración: D-value bajo, B-value alto → consumo 1.5–1.8% PV (restricción física dominante)
IMPORTANTE: a mayor lignificación, el animal NO puede compensar calidad con más cantidad. La fibra indigestible (B-value) ocupa espacio en el rumen sin aportar energía → restricción física del consumo (Detmann et al., 2014, J. Anim. Sci.).
Cuantificar siempre: déficit proteico en g PB/día y déficit energético en Mcal/día por categoría.

═══════════════════════════════════════
REQUERIMIENTOS POR CATEGORÍA Y ESTADO
═══════════════════════════════════════
Vaca adulta gestación temprana (1–4 m): 12–13 Mcal EM/día, PB 700–800 g/día
Vaca adulta gestación media (5–7 m): 13–15 Mcal EM/día, PB 800–950 g/día
Vaca adulta preparto (último mes): 15–17 Mcal EM/día, PB 950–1100 g/día
Vaca adulta lactando con ternero: 18–22 Mcal EM/día, PB 1100–1400 g/día
Vaca adulta seca sin ternero: 11–12 Mcal EM/día, PB 600–700 g/día
Vaca 2°serv (lactando+creciendo+preñar): 20–22 Mcal EM/día, PB 1200–1500 g/día
Vaquilla 1°Invierno (recría post-destete): 14–16 Mcal EM/día, PB 900–1100 g/día — suplementación proteica SIN DISCUSIÓN en invierno
Vaquilla 2°Invierno (recría pre-entore): 12–14 Mcal EM/día, PB 800–1000 g/día — flushing obligatorio 25–30d pre-entore

═══════════════════════════════════════
SUPLEMENTACIÓN ESTRATÉGICA
═══════════════════════════════════════
Escenario A — mucho pasto, baja calidad (>50% floración): proteico 0.7% PV, 3×/semana.
Escenario B — poco pasto, baja calidad: E+P 1% PV diario.
Escenario C — buena cantidad y calidad (<25% floración): sin suplemento o mineral.
Vaquilla 1°Invierno siempre escenario A o B (nunca sin suplementar en invierno).
Peso mínimo entore: 0.75 × PV vaca adulta. NO 0.65.

═══════════════════════════════════════
RECRÍA (NASSEM, 2010)
═══════════════════════════════════════
Vaquilla 1°Invierno (post-destete, primera etapa crítica):
  Meta: ≥170 kg ingreso, GDP 600 g/d, llegar ≥280 kg al inicio del 2°invierno.
  Período crítico: mayo–agosto. Suplementación proteica sin discusión.
  Objetivo: primer entore a los 24 meses de edad.
Vaquilla 2°Invierno (pre-entore):
  Meta: ≥280 kg ingreso invierno, GDP 300 g/d, ≥320 kg al servicio.
  Peso mínimo entore: 0.75 × PV vaca adulta.
  Flushing: 0.8% PV diario, 25–30d pre-entore.

═══════════════════════════════════════
EMERGENCIA FORRAJERA (Rosello Brajovich et al., INTA 2025)
═══════════════════════════════════════
Prioridades: 1.Recría 2.Preñadas 1°serv 3.Preñadas 2°serv 4.Preñadas flacas 5.Preñadas buena CC 6.Vacías.
Dosis emergencia: ≥8–10 kg heno/vientre/día + proteico si calidad baja.

═══════════════════════════════════════
ESTRUCTURA OBLIGATORIA — 8 SECCIONES
═══════════════════════════════════════
1️⃣ DIAGNÓSTICO AMBIENTAL Y FORRAJERO
2️⃣ DIAGNÓSTICO POR CATEGORÍA
3️⃣ ESTADO DEL DESTETE Y PROYECCIÓN CC
4️⃣ BALANCE OFERTA vs DEMANDA
5️⃣ EVALUACIÓN ESTRATÉGICA
6️⃣ IMPACTO A 1–2 AÑOS
7️⃣ ESTADO DE EMERGENCIA
8️⃣ RECOMENDACIONES FINALES POR CATEGORÍA (SIEMPRE)
   — Aumentar % preñez · Primer entore 24 meses · Reducir mermas · Producción/ha · Emergencia si aplica

Citar: (NASSEM, 2010) · (Balbuena, INTA 2003) · (Peruchena, INTA 2003) · (Detmann et al., 2014) · (Rosello Brajovich et al., INTA 2025)`;

const CC_PRENEZ=[{ccP:6.5,ccS:5.0,pr:95},{ccP:6.0,ccS:4.5,pr:88},{ccP:5.5,ccS:4.0,pr:75},{ccP:5.0,ccS:3.5,pr:55},{ccP:4.5,ccS:3.0,pr:35},{ccP:4.0,ccS:2.5,pr:15},{ccP:3.5,ccS:2.0,pr:5}];

function interpCurva(ccP){const t=CC_PRENEZ;if(ccP>=t[0].ccP)return{ccS:t[0].ccS,pr:t[0].pr};if(ccP<=t[t.length-1].ccP)return{ccS:t[t.length-1].ccS,pr:t[t.length-1].pr};for(let i=0;i<t.length-1;i++){if(ccP<=t[i].ccP&&ccP>=t[i+1].ccP){const r=(ccP-t[i+1].ccP)/(t[i].ccP-t[i+1].ccP);return{ccS:+(t[i+1].ccS+r*(t[i].ccS-t[i+1].ccS)).toFixed(1),pr:Math.round(t[i+1].pr+r*(t[i].pr-t[i+1].pr))};}}return{ccS:2.5,pr:15};}

function calcCCAlParto(cc,dias,estadoDestete,pastoCal,diasDestete){if(!cc||!dias)return null;if(estadoDestete==="no_ternero"){if(diasDestete>0&&diasDestete<dias){const perdida=0.010*diasDestete;const ccPost=Math.max(1.0,cc-perdida);const tasa={excelente:0.022,bueno:0.016,regular:0.009,malo:0.004}[pastoCal]||0.013;return Math.min(9.0,ccPost+tasa*(dias-diasDestete));}return Math.max(1.0,cc-0.010*dias);}if(["ok_feb","ok_mar","precoz","tard_abr"].includes(estadoDestete)){const tasa={excelente:0.022,bueno:0.016,regular:0.009,malo:0.004}[pastoCal]||0.013;return Math.min(9.0,cc+tasa*dias);}return cc;}

function consumoPorFenologia(fen,pvKg){const pct={menor_10:0.235,"10_25":0.210,"25_50":0.190,mayor_50:0.165}[fen]||0.200;return pvKg>0?(pvKg*pct/100).toFixed(1):null;}

function detectZona(lat,lon){if(lat>-24)return"NEA";if(lat>-28&&lon>-58)return"NEA";if(lat>-30&&lon<-64)return"NOA";if(lat>-38&&lat<=-30&&lon>-62)return"Pampa Húmeda";if(lat>-38&&lat<=-30&&lon<=-62&&lon>-67)return"Semiárido Pampeano";if(lon<-67&&lat>-35)return"Cuyo";if(lat<=-38)return"Patagonia";return"Pampa Húmeda";}

function detectProvincia(lat,lon){if(lat>-22&&lon>-60)return"Formosa";if(lat>-22&&lon<=-60)return"Salta";if(lat>-24&&lat<=-22&&lon>-58)return"Chaco";if(lat>-28&&lat<=-24&&lon>-57)return"Corrientes";if(lat>-30&&lat<=-28&&lon>-57)return"Misiones";if(lat>-30&&lat<=-28&&lon<=-57&&lon>-59)return"Corrientes";if(lat>-32&&lat<=-30&&lon>-58)return"Entre Ríos";return"";}

const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const FENOLOGIAS=[{val:"menor_10",label:"<10% Floración",desc:"PB >10% · Dig >65% · Consumo ~2.3% PV",warn:""},{val:"10_25",label:"10–25% Floración",desc:"PB 7–10% · Dig 60–65% · Consumo ~2.1% PV",warn:""},{val:"25_50",label:"25–50% Floración",desc:"PB 5–7% · Lignificación · Consumo ~1.9% PV",warn:"⚠ Déficit proteico — 2°serv y vaquillas"},{val:"mayor_50",label:">50% Floración",desc:"PB <5% · Lignificación avanzada · Consumo ~1.6% PV",warn:"🔴 Déficit severo — restricción física"}];
const ESTADOS_REPROD=["Gestación temprana (1–4 meses)","Gestación media (5–7 meses)","Preparto (último mes)","Lactación con ternero al pie","Vaca seca sin ternero"];

export default function AgroMind(){
  const[form,setForm]=useState({nombreProductor:"",estadoDestete:"",pastoCal:"",pVacas:"",ccActual:"",diasParto:"",diasDesteteEst:"",eReprod:"",v2sN:"",v2sPV:"",v2sCC:"",v2sTernero:"",v2sDiasDestete:"",zona:"",provincia:"",mes:"",clima:"",vegetacion:"",supHa:"",fenologia:"",vacasN:"",ternerosN:"",torosN:"",prenezHist:"",pctDestete:"",vaq1N:"",vaq1PV:"",vaq1GDP:"",vaq2N:"",vaq2PV:"",diasEntore:"",tendPeso:"",pvVacaAdulta:"",suplem:"",consulta:""});
  const[sat,setSat]=useState(null);
  const[satLoading,setSatLoading]=useState(false);
  const[coords,setCoords]=useState(null);
  const[manualLat,setManualLat]=useState("");
  const[manualLon,setManualLon]=useState("");
  const[loading,setLoading]=useState(false);
  const[loadMsg,setLoadMsg]=useState("");
  const[result,setResult]=useState("");
  const[ccParto,setCcParto]=useState(null);
  const[curva,setCurva]=useState(null);
  const[alerta2serv,setAlerta2serv]=useState("");
  const[tab,setTab]=useState("analisis");
  const[gpsLoading,setGpsLoading]=useState(false);
  const[productores,setProductores]=useState([]);

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  useEffect(()=>{try{const p=JSON.parse(localStorage.getItem("agm_prod")||"[]");setProductores(p);}catch(e){}},[]);

  useEffect(()=>{
    const cc=parseFloat(form.ccActual),dias=parseInt(form.diasParto),diasD=parseInt(form.diasDesteteEst)||0;
    if(!isNaN(cc)&&cc>0&&dias>0){const p=calcCCAlParto(cc,dias,form.estadoDestete,form.pastoCal,diasD);setCcParto(p?parseFloat(p.toFixed(2)):null);setCurva(p?interpCurva(p):null);}
    else{setCcParto(null);setCurva(null);}
  },[form.ccActual,form.diasParto,form.estadoDestete,form.pastoCal,form.diasDesteteEst]);

  useEffect(()=>{
    if(form.v2sTernero==="si"){
      const pv=parseFloat(form.v2sPV);
      let msg="🔴 VACA 2°SERV + TERNERO AL PIE — Destete precoz obligatorio.\nTriple demanda: ~20–22 Mcal/día vs 5–8 Mcal del pastizal maduro.";
      if(pv>0&&pv<380)msg+=`\n⚠️ Peso ${pv} kg <380 kg — riesgo máximo. Destete hiperprecoz inmediato.`;
      if(form.v2sDiasDestete){const dd=parseInt(form.v2sDiasDestete),ccV=parseFloat(form.v2sCC);if(!isNaN(dd)&&!isNaN(ccV)&&dd>0){const perdida=Math.min(ccV-1.0,0.010*dd).toFixed(1);msg+=`\nCon destete en ${dd} días: pérdida estimada = ${perdida} pts CC. Luego recuperación post-destete.`;}}
      setAlerta2serv(msg);
    }else setAlerta2serv("");
  },[form.v2sTernero,form.v2sPV,form.v2sCC,form.v2sDiasDestete]);

  const applyLocation=async(lat,lon,src)=>{const zona=detectZona(lat,lon);const prov=detectProvincia(lat,lon);const mes=MESES[new Date().getMonth()];setCoords({lat,lon,src,zona,prov});setForm(f=>({...f,zona,provincia:prov,mes}));await fetchSat(lat,lon,zona,mes);};

  const getGPS=()=>{if(!navigator.geolocation){alert("GPS no disponible");return;}setGpsLoading(true);navigator.geolocation.getCurrentPosition(p=>{setGpsLoading(false);applyLocation(p.coords.latitude,p.coords.longitude,"GPS");},e=>{setGpsLoading(false);alert("Error GPS: "+e.message);},{enableHighAccuracy:true,timeout:15000});};

  const setManual=()=>{const lat=parseFloat(manualLat),lon=parseFloat(manualLon);if(isNaN(lat)||isNaN(lon)||lat>-20||lat<-56||lon>-52||lon<-74){alert("Coordenadas inválidas.\nNEA ejemplo: Lat -27.45 / Lon -59.12");return;}applyLocation(lat,lon,"Manual");};

  const fetchSat=async(lat,lon,zona,mes)=>{
    setSatLoading(true);setSat(null);
    try{
      const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration&timezone=auto&past_days=30&forecast_days=1`;
      const d=(await(await fetch(url)).json()).daily;
      const p7=d.precipitation_sum.slice(-7).reduce((a,b)=>a+(b||0),0);
      const p30=d.precipitation_sum.slice(0,30).reduce((a,b)=>a+(b||0),0);
      const tMax7=d.temperature_2m_max.slice(-7);
      const tMin7=d.temperature_2m_min.slice(-7);
      const tempArr=tMax7.map((t,i)=>(t+(tMin7[i]||t))/2);
      const temp=tempArr.reduce((a,b)=>a+b,0)/tempArr.length;
      const tMaxR=Math.max(...tMax7).toFixed(1);
      const tMinR=Math.min(...tMin7).toFixed(1);
      const et=d.et0_fao_evapotranspiration.slice(-7).reduce((a,b)=>a+(b||0),0)/7;
      const deficit=Math.round((p30-et*30)*10)/10;
      const clima=deficit<-40?"Seco (déficit hídrico)":deficit>40?"Húmedo (exceso)":"Normal";
      const ndviBase={NEA:0.55,Mesopotamia:0.52,"Pampa Húmeda":0.50,NOA:0.42,"Semiárido Pampeano":0.38,Cuyo:0.30,Patagonia:0.28}[zona]||0.45;
      const pf=Math.min(Math.max((p30-20)/180,-0.15),0.25);
      const mi=MESES.indexOf(mes);
      const mf=[0.05,0.03,0.00,-0.03,-0.08,-0.12,-0.12,-0.08,-0.02,0.03,0.05,0.06];
      const ndvi=Math.min(Math.max(ndviBase+pf+(mi>=0?mf[mi]:0),0.05),0.95);
      const cond=ndvi>0.55?"Excelente":ndvi>0.40?"Buena":ndvi>0.25?"Moderada":ndvi>0.15?"Baja":"Muy baja";
      setSat({ndvi:ndvi.toFixed(2),temp:temp.toFixed(1),tMax:tMaxR,tMin:tMinR,p7:Math.round(p7),p30:Math.round(p30),et:et.toFixed(1),deficit,cond,clima});
      setForm(f=>({...f,clima}));
    }catch(e){console.error(e);}finally{setSatLoading(false);}
  };

  const saveProductor=(informe)=>{if(!form.nombreProductor.trim())return;const r={nombre:form.nombreProductor,zona:form.zona,provincia:form.provincia,mes:form.mes,clima:form.clima,ndvi:sat?.ndvi||"",supHa:form.supHa,vegetacion:form.vegetacion,fenologia:form.fenologia,estadoDestete:form.estadoDestete,ccActual:form.ccActual,diasParto:form.diasParto,diasDesteteEst:form.diasDesteteEst,pVacas:form.pVacas,eReprod:form.eReprod,vacasN:form.vacasN,ternerosN:form.ternerosN,torosN:form.torosN,prenezHist:form.prenezHist,pctDestete:form.pctDestete,v2sN:form.v2sN,v2sPV:form.v2sPV,v2sCC:form.v2sCC,v2sTernero:form.v2sTernero,v2sDiasDestete:form.v2sDiasDestete,pvVacaAdulta:form.pvVacaAdulta,vaq1N:form.vaq1N,vaq1PV:form.vaq1PV,vaq1GDP:form.vaq1GDP,vaq2N:form.vaq2N,vaq2PV:form.vaq2PV,diasEntore:form.diasEntore,suplem:form.suplem,ccParto:ccParto||"",prenezEst:curva?.pr||"",informe:(informe||"").slice(0,400),fechaVisita:new Date().toLocaleDateString("es-AR")};const upd=[r,...productores.filter(p=>p.nombre!==form.nombreProductor)];setProductores(upd);try{localStorage.setItem("agm_prod",JSON.stringify(upd));}catch(e){}};

  const exportCSV=()=>{if(!productores.length){alert("Sin datos aún.");return;}const cols=["nombre","zona","provincia","mes","clima","ndvi","supHa","vegetacion","fenologia","estadoDestete","ccActual","diasParto","diasDesteteEst","pVacas","eReprod","vacasN","ternerosN","torosN","prenezHist","pctDestete","v2sN","v2sPV","v2sCC","v2sTernero","v2sDiasDestete","pvVacaAdulta","vaq1N","vaq1PV","vaq1GDP","vaq2N","vaq2PV","diasEntore","suplem","ccParto","prenezEst","informe","fechaVisita"];const csv=[cols.join(","),...productores.map(p=>cols.map(c=>`"${String(p[c]||"").replace(/"/g,'""')}"`).join(","))].join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`agromind_${new Date().toISOString().slice(0,10)}.csv`;a.click();};

  const buildPrompt=()=>{
    let t="ANÁLISIS TÉCNICO COMPLETO:\n\n";
    if(coords)t+=`UBICACIÓN: ${coords.lat.toFixed(4)}°S ${coords.lon.toFixed(4)}°W · Zona: ${form.zona}${form.provincia?' · '+form.provincia:''}\n`;
    if(sat)t+=`DATOS METEOROLÓGICOS REALES (Open-Meteo): Temp promedio 7d: ${sat.temp}°C · Tmax: ${sat.tMax}°C · Tmin: ${sat.tMin}°C · Precip 7d: ${sat.p7}mm · 30d: ${sat.p30}mm · Balance: ${sat.deficit>0?'+':''}${sat.deficit}mm · ET₀: ${sat.et}mm/d · NDVI est: ${sat.ndvi} (${sat.cond}) · Clima: ${sat.clima}\n`;
    t+=`\nDESTETE: ${form.estadoDestete||'No indicado'} · Pastizal post-destete: ${form.pastoCal||'—'}\n`;
    t+=`CC actual: ${form.ccActual||'—'}/9 · Días al parto: ${form.diasParto||'—'} · PV vaca: ${form.pVacas||'—'} kg · Estado reproductivo: ${form.eReprod||'—'}\n`;
    if(form.diasDesteteEst)t+=`Días estimados al destete (rodeo gral): ${form.diasDesteteEst}\n`;
    if(ccParto)t+=`CC proyectada al parto: ${ccParto}/9 → CC serv: ${curva?.ccS} → Preñez estimada: ${curva?.pr}%\n`;
    if(form.estadoDestete==="no_ternero")t+="⚠️ TERNERO AÚN AL PIE — déficit activo 6–8 Mcal/día\n";
    t+=`\nVACA 2°SERV: N° ${form.v2sN||'—'} · PV ${form.v2sPV||'—'} kg · CC ${form.v2sCC||'—'}/9 · Ternero: ${form.v2sTernero||'—'}\n`;
    if(form.v2sDiasDestete)t+=`Días estimados al destete 2°serv: ${form.v2sDiasDestete} — CALCULAR PÉRDIDA CC SOLO HASTA ESTE PUNTO\n`;
    if(form.v2sTernero==="si")t+="⚠️ DESTETE PRECOZ OBLIGATORIO\n";
    t+=`\nAMBIENTE: Zona ${form.zona||'—'} · Provincia ${form.provincia||'—'} · Mes ${form.mes||'—'} · Clima ${form.clima||'—'}\n`;
    t+=`Vegetación: ${form.vegetacion||'—'} · Fenología: ${form.fenologia||'—'} · Superficie: ${form.supHa||'—'} ha\n`;
    if(form.fenologia&&form.pVacas){const cons=consumoPorFenologia(form.fenologia,parseFloat(form.pVacas));if(cons)t+=`Consumo voluntario estimado vaca: ~${cons} kg MS/día (fenología: ${form.fenologia})\n`;}
    t+=`\nVACAS: N° ${form.vacasN||'—'} · Terneros ${form.ternerosN||'—'} · Toros ${form.torosN||'—'} · Preñez hist ${form.prenezHist||'—'}% · Destete ${form.pctDestete||'—'}% · PV adulta rodeo ${form.pvVacaAdulta||'—'} kg\n`;
    t+=`VAQ 1°INVIERNO: N° ${form.vaq1N||'—'} · PV ${form.vaq1PV||'—'} kg · GDP obs ${form.vaq1GDP||'—'} g/d (objetivo 600 g/d)\n`;
    t+=`VAQ 2°INVIERNO: N° ${form.vaq2N||'—'} · PV ${form.vaq2PV||'—'} kg · Días entore ${form.diasEntore||'—'} · Tendencia ${form.tendPeso||'—'}\n`;
    if(form.pvVacaAdulta){const pm=(parseFloat(form.pvVacaAdulta)*0.75).toFixed(0);t+=`Peso mínimo entore (0.75 × ${form.pvVacaAdulta} kg): ${pm} kg\n`;}
    if(form.suplem)t+=`Suplementación actual: ${form.suplem}\n`;
    if(form.consulta)t+=`\nCONSULTA: ${form.consulta}\n`;
    t+="\n→ 8 secciones obligatorias. Temperatura REAL de campo. CC 2°serv proyectar SOLO hasta destete estimado. Consumo según fenología. Sección 8 recomendaciones por categoría siempre.";
    return t;
  };

  const MSGS=["Evaluando datos meteorológicos reales...","Calculando consumo según fenología...","Proyectando CC al parto y servicio...","Analizando vaca 2° servicio...","Cuantificando déficit por categoría...","Calculando dosis exactas...","Redactando informe técnico...","Generando recomendaciones finales..."];

  const runAnalysis=async()=>{setLoading(true);setResult("");let mi=0;const iv=setInterval(()=>{setLoadMsg(MSGS[mi%MSGS.length]);mi++;},2000);try{const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:buildPrompt(),systemPrompt:SYS})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Error");setResult(data.result);saveProductor(data.result);}catch(e){setResult("❌ Error: "+e.message);}finally{clearInterval(iv);setLoading(false);}};

  const renderResult=(t)=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/(1️⃣|2️⃣|3️⃣|4️⃣|5️⃣|6️⃣|7️⃣|8️⃣)\s*([^\n]+)/g,'<div style="font-family:monospace;font-size:.88rem;color:#7ec850;margin:18px 0 7px;border-left:3px solid #7ec850;padding-left:10px">$1 $2</div>').replace(/\n\n/g,"<br/><br/>").replace(/\n/g,"<br/>");

  const I={width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.15)",borderRadius:4,color:"#ede8d8",padding:"7px 10px",fontSize:".82rem",fontFamily:"Georgia,serif"};
  const L={fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:4};
  const P={background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:8,padding:18,marginBottom:14};
  const prenezColor=!curva?"#7a9668":curva.pr>=75?"#7ec850":curva.pr>=55?"#d4952a":"#c04820";
  const ccPartoColor=!ccParto?"#7a9668":ccParto>=5.5?"#7ec850":ccParto>=5.0?"#d4952a":"#c04820";

  return(
    <div style={{background:"#0c1208",minHeight:"100vh",color:"#ede8d8",fontFamily:"Georgia,serif"}}>
      <div style={{maxWidth:960,margin:"0 auto",padding:"0 16px 80px"}}>
        <div style={{borderBottom:"1px solid rgba(126,200,80,.1)",paddingBottom:16,marginBottom:20,paddingTop:24,display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:48,height:48,background:"linear-gradient(145deg,#7ec850,#a3d96e)",clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🐄</div>
            <div>
              <div style={{fontSize:"1.8rem",color:"#7ec850",letterSpacing:4,lineHeight:1}}>AgroMind Pro</div>
              <div style={{fontFamily:"monospace",fontSize:".55rem",color:"#7a9668",letterSpacing:2,marginTop:4}}>SISTEMA EXPERTO · CRÍA BOVINA EXTENSIVA · ARGENTINA</div>
            </div>
          </div>
          <div style={{fontFamily:"monospace",fontSize:".6rem",color:"#7ec850",background:"rgba(126,200,80,.06)",border:"1px solid rgba(126,200,80,.2)",borderRadius:3,padding:"6px 12px"}}>● ACTIVO · Claude Sonnet</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:7,marginBottom:16}}>
          {[["Zona",form.zona?(form.zona+(form.provincia?' · '+form.provincia.slice(0,4):'')):"—",""],["Temp °C",sat?(sat.tMin+"–"+sat.tMax+"°C"):"—","#d4952a"],["Precip 30d",sat?(sat.p30+" mm"):"—","#3a8fb5"],["NDVI",sat?(sat.ndvi+" "+sat.cond.slice(0,3)):"—",""],["CC Parto",ccParto?(ccParto+"/9"):"—",ccPartoColor],["Preñez Est.",curva?(curva.pr+"%"):"—",prenezColor]].map(([l,v,c])=>(
            <div key={l} style={{background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:5,padding:"8px 6px",textAlign:"center"}}>
              <div style={{fontFamily:"monospace",fontSize:".48rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,marginBottom:3}}>{l}</div>
              <div style={{fontFamily:"monospace",fontSize:".88rem",color:c||"#7ec850",fontWeight:600}}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{display:"flex",borderBottom:"1px solid rgba(126,200,80,.09)",marginBottom:18,gap:2,flexWrap:"wrap"}}>
          {[["analisis","⚡ Análisis"],["planilla","📋 Productores"],["marco","🧠 Marco Técnico"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{background:"transparent",border:"none",borderBottom:tab===id?"2px solid #7ec850":"2px solid transparent",color:tab===id?"#7ec850":"#7a9668",fontFamily:"monospace",fontSize:".57rem",letterSpacing:1.5,textTransform:"uppercase",padding:"8px 14px",cursor:"pointer",marginBottom:-1}}>{label}</button>
          ))}
        </div>

        {tab==="analisis"&&(
          <div>
            <div style={P}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#7ec850",marginBottom:12}}>👤 PRODUCTOR / ESTABLECIMIENTO</div>
              <input value={form.nombreProductor} onChange={e=>set("nombreProductor",e.target.value)} placeholder="Nombre del productor o establecimiento" style={I}/>
            </div>

            <div style={P}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#7ec850",marginBottom:10}}>📍 UBICACIÓN + DATOS METEOROLÓGICOS</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                <button onClick={getGPS} disabled={gpsLoading} style={{background:"rgba(126,200,80,.1)",border:"1px solid rgba(126,200,80,.3)",borderRadius:4,color:"#7ec850",padding:"8px 16px",fontFamily:"monospace",fontSize:".62rem",cursor:"pointer"}}>{gpsLoading?"📍 Localizando...":"📍 Usar GPS"}</button>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap",marginBottom:12}}>
                <div><label style={L}>Latitud (ej: -27.45)</label><input type="number" value={manualLat} onChange={e=>setManualLat(e.target.value)} placeholder="-27.45" style={{...I,width:140}}/></div>
                <div><label style={L}>Longitud (ej: -59.12)</label><input type="number" value={manualLon} onChange={e=>setManualLon(e.target.value)} placeholder="-59.12" style={{...I,width:140}}/></div>
                <button onClick={setManual} style={{background:"rgba(126,200,80,.1)",border:"1px solid rgba(126,200,80,.3)",borderRadius:4,color:"#7ec850",padding:"8px 14px",fontFamily:"monospace",fontSize:".62rem",cursor:"pointer",marginBottom:1}}>FIJAR</button>
              </div>
              {coords&&(<div>
                <iframe src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon-0.15}%2C${coords.lat-0.15}%2C${coords.lon+0.15}%2C${coords.lat+0.15}&layer=mapnik&marker=${coords.lat}%2C${coords.lon}`} style={{width:"100%",height:220,border:"1px solid rgba(126,200,80,.2)",borderRadius:6,marginBottom:10}} loading="lazy"/>
                <div style={{fontFamily:"monospace",fontSize:".6rem",color:"#7a9668",display:"flex",gap:16,flexWrap:"wrap"}}><span>📌 {coords.lat.toFixed(4)}°S · {coords.lon.toFixed(4)}°W</span><span>🗺 {coords.zona}{coords.prov?' · '+coords.prov:''}</span><span>📡 {coords.src}</span></div>
              </div>)}
              {satLoading&&<div style={{fontFamily:"monospace",fontSize:".6rem",color:"#7ec850",marginTop:8}}>🛰 Consultando datos meteorológicos reales...</div>}
              {sat&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:6,marginTop:10}}>
                  {[["Temp Prom",sat.temp+"°C","#d4952a"],["T.Max 7d",sat.tMax+"°C","#c04820"],["T.Min 7d",sat.tMin+"°C","#3a8fb5"],["Precip 7d",sat.p7+" mm","#3a8fb5"],["Precip 30d",sat.p30+" mm","#3a8fb5"],["Balance",(sat.deficit>0?"+":"")+sat.deficit+" mm",sat.deficit<-30?"#c04820":sat.deficit>30?"#3a8fb5":"#d4952a"],["ET₀ mm/d",sat.et,"#d4952a"],["NDVI Est.",sat.ndvi+" ("+sat.cond.slice(0,3)+")","#7ec850"]].map(([l,v,c])=>(
                    <div key={l} style={{textAlign:"center",background:"rgba(0,0,0,.3)",borderRadius:5,padding:"7px 4px",border:"1px solid rgba(126,200,80,.09)"}}>
                      <div style={{fontFamily:"monospace",fontSize:".48rem",color:"#7a9668",marginBottom:2}}>{l}</div>
                      <div style={{fontFamily:"monospace",fontSize:".72rem",color:c,fontWeight:600}}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{...P,border:"1px solid rgba(212,149,42,.28)",background:"rgba(212,149,42,.03)"}}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#d4952a",marginBottom:6}}>📅 DESTETE — EJE DEL SISTEMA</div>
              <div style={{fontFamily:"monospace",fontSize:".52rem",color:"rgba(212,149,42,.55)",lineHeight:1.7,marginBottom:14}}>Destete Feb → −6–8 Mcal/día + rebrote otoñal → recuperación CC al parto. El expeller no reemplaza el destete.</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
                <div><label style={L}>Estado del Destete</label>
                  <select value={form.estadoDestete} onChange={e=>set("estadoDestete",e.target.value)} style={I}>
                    <option value="">Seleccionar...</option><option value="ok_feb">✅ Realizado en Febrero</option><option value="ok_mar">✅ Realizado en Marzo</option><option value="tard_abr">⚠️ Tardío — Abril</option><option value="no_ternero">🔴 No — ternero al pie</option><option value="precoz">⚡ Destete precoz activo</option><option value="planif">📋 Planificando</option>
                  </select></div>
                <div><label style={L}>Pastizal Post-destete</label>
                  <select value={form.pastoCal} onChange={e=>set("pastoCal",e.target.value)} style={I}>
                    <option value="">—</option><option value="excelente">Excelente — rebrote abundante</option><option value="bueno">Bueno — rebrote normal</option><option value="regular">Regular — rebrote escaso</option><option value="malo">Malo — sin rebrote</option>
                  </select></div>
                <div><label style={L}>Estado Reproductivo</label>
                  <select value={form.eReprod} onChange={e=>set("eReprod",e.target.value)} style={I}>
                    <option value="">—</option>{ESTADOS_REPROD.map(e=><option key={e} value={e}>{e}</option>)}
                  </select></div>
                {[["ccActual","CC Actual (1–9)","4.5"],["diasParto","Días al Parto","90"],["pVacas","Peso Vaca (kg)","380"]].map(([k,l,p])=>(
                  <div key={k}><label style={L}>{l}</label><input type="number" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={"Ej: "+p} style={I}/></div>
                ))}
                {form.estadoDestete==="no_ternero"&&(
                  <div><label style={L}>Días estimados al destete</label><input type="number" value={form.diasDesteteEst} onChange={e=>set("diasDesteteEst",e.target.value)} placeholder="Ej: 30" style={I}/></div>
                )}
              </div>
              {ccParto&&curva&&(
                <div style={{marginTop:14,background:"rgba(0,0,0,.25)",border:"1px solid rgba(126,200,80,.2)",borderRadius:6,padding:"12px 14px",fontFamily:"monospace",fontSize:".65rem",lineHeight:2}}>
                  <span style={{color:"#7ec850"}}>▸ PROYECCIÓN: </span>
                  CC parto: <strong style={{color:ccPartoColor}}>{ccParto}/9</strong>{" → "}CC serv: <strong style={{color:prenezColor}}>{curva.ccS}/9</strong>{" → "}Preñez: <strong style={{color:prenezColor}}>{curva.pr}%</strong>
                  {curva.pr<75&&<span style={{color:"#c04820"}}> · ⚠️ {Math.round((75-curva.pr)/100*(parseInt(form.vacasN)||100))} terneros bajo objetivo</span>}
                  {form.diasDesteteEst&&<><br/><span style={{color:"#d4952a"}}>2 tramos: pérdida hasta destete ({form.diasDesteteEst}d) → recuperación post-destete hasta parto</span></>}
                </div>
              )}
              {form.estadoDestete==="no_ternero"&&<div style={{marginTop:10,background:"rgba(192,72,32,.07)",border:"1px solid rgba(192,72,32,.3)",borderRadius:5,padding:"10px 12px",fontFamily:"monospace",fontSize:".63rem",color:"#e09070"}}>🔴 TERNERO AL PIE — 6–8 Mcal/día en lactancia. <strong style={{color:"#c04820"}}>Destete precoz: única solución.</strong></div>}
            </div>

            <div style={{...P,border:"1px solid rgba(136,102,204,.28)",background:"rgba(136,102,204,.03)"}}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#8866cc",marginBottom:6}}>⚠️ VACA DE 2° SERVICIO — CATEGORÍA CRÍTICA</div>
              <div style={{fontFamily:"monospace",fontSize:".52rem",color:"rgba(136,102,204,.55)",lineHeight:1.7,marginBottom:14}}>Triple demanda: Lactando + Creciendo + Quedar preñada. ~20–22 Mcal/día.<br/><strong style={{color:"#8866cc"}}>Destete precoz = estándar. CC proyecta solo hasta destete, luego recuperación.</strong></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
                {[["v2sN","N° Cabezas","30"],["v2sPV","Peso Prom (kg)","340"],["v2sCC","CC Actual (1–9)","4.5"]].map(([k,l,p])=>(
                  <div key={k}><label style={L}>{l}</label><input type="number" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={"Ej: "+p} style={I}/></div>
                ))}
                <div><label style={L}>¿Ternero al Pie?</label>
                  <select value={form.v2sTernero} onChange={e=>set("v2sTernero",e.target.value)} style={I}>
                    <option value="">—</option><option value="si">Sí — ternero al pie</option><option value="precoz">Destete precoz realizado</option><option value="no">No — ya destetado</option>
                  </select></div>
                {form.v2sTernero==="si"&&<div><label style={L}>Días estimados al destete</label><input type="number" value={form.v2sDiasDestete} onChange={e=>set("v2sDiasDestete",e.target.value)} placeholder="Ej: 20" style={I}/></div>}
              </div>
              {alerta2serv&&<div style={{marginTop:10,background:"rgba(192,72,32,.07)",border:"1px solid rgba(192,72,32,.3)",borderRadius:5,padding:"10px 12px",fontFamily:"monospace",fontSize:".63rem",color:"#e09070",whiteSpace:"pre-line"}}>{alerta2serv}</div>}
            </div>

            <div style={P}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#7ec850",marginBottom:14}}>🌾 OFERTA FORRAJERA</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(165px,1fr))",gap:10,marginBottom:14}}>
                <div><label style={L}>Zona</label><select value={form.zona} onChange={e=>set("zona",e.target.value)} style={I}>{["","Pampa Húmeda","NEA","NOA","Semiárido Pampeano","Mesopotamia","Cuyo","Patagonia"].map(o=><option key={o} value={o}>{o||"Seleccionar..."}</option>)}</select></div>
                <div><label style={L}>Provincia</label><select value={form.provincia} onChange={e=>set("provincia",e.target.value)} style={I}>{["","Corrientes","Chaco","Formosa","Misiones","Entre Ríos","Santiago del Estero","Salta","Buenos Aires","Córdoba","Santa Fe","La Pampa","San Luis","Mendoza","Neuquén","Río Negro"].map(o=><option key={o} value={o}>{o||"Seleccionar..."}</option>)}</select></div>
                <div><label style={L}>Mes</label><select value={form.mes} onChange={e=>set("mes",e.target.value)} style={I}>{[""].concat(MESES).map(o=><option key={o} value={o}>{o||"Seleccionar..."}</option>)}</select></div>
                <div><label style={L}>Vegetación</label><select value={form.vegetacion} onChange={e=>set("vegetacion",e.target.value)} style={I}>{["","Pastizal natural NEA/Chaco","Megatérmicas (gatton panic, brachiaria)","Pasturas templadas","Mixta gramíneas+leguminosas","Monte bajo / sabana","Verdeo de invierno"].map(o=><option key={o} value={o}>{o||"Seleccionar..."}</option>)}</select></div>
                <div><label style={L}>Superficie (ha)</label><input type="number" value={form.supHa} onChange={e=>set("supHa",e.target.value)} placeholder="Ej: 500" style={I}/></div>
                <div><label style={L}>PV Vaca Adulta Rodeo (kg)</label><input type="number" value={form.pvVacaAdulta} onChange={e=>set("pvVacaAdulta",e.target.value)} placeholder="Ej: 420" style={I}/></div>
              </div>
              <div style={{fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Estado Fenológico — Consumo voluntario estimado</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                {FENOLOGIAS.map(f=>(
                  <div key={f.val} onClick={()=>set("fenologia",f.val)} style={{border:form.fenologia===f.val?"1px solid #7ec850":"1px solid rgba(126,200,80,.12)",borderRadius:6,padding:"10px 12px",cursor:"pointer",background:form.fenologia===f.val?"rgba(126,200,80,.08)":"rgba(0,0,0,.15)"}}>
                    <div style={{fontFamily:"monospace",fontSize:".85rem",color:"#7ec850"}}>{f.label}</div>
                    <div style={{fontSize:".77rem",marginTop:3}}>{f.desc}</div>
                    {f.warn&&<div style={{fontFamily:"monospace",fontSize:".52rem",color:"#c04820",marginTop:3}}>{f.warn}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div style={P}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#7ec850",marginBottom:14}}>🐮 DEMANDA ANIMAL</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
                {[["vacasN","N° Vacas Adultas","150"],["ternerosN","N° Terneros al Pie","120"],["torosN","N° Toros","8"],["prenezHist","Preñez Último Año %","72"],["pctDestete","% Destete","68"]].map(([k,l,p])=>(
                  <div key={k}><label style={L}>{l}</label><input type="number" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={"Ej: "+p} style={I}/></div>
                ))}
              </div>
              <div style={{fontFamily:"monospace",fontSize:".75rem",color:"#d4952a",marginTop:14,marginBottom:4}}>Vaquilla 1° Invierno — Recría post-destete (primera etapa crítica)</div>
              <div style={{fontFamily:"monospace",fontSize:".52rem",color:"rgba(212,149,42,.5)",marginBottom:10}}>Supl. proteica sin discusión en invierno · GDP objetivo: 600 g/d · Primer entore 24 meses</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10,marginBottom:14}}>
                {[["vaq1N","N° Cabezas","40"],["vaq1PV","Peso Promedio (kg)","185"],["vaq1GDP","GDP Observado (g/d)","—"]].map(([k,l,p])=>(
                  <div key={k}><label style={L}>{l}</label><input type="number" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={"Ej: "+p} style={I}/></div>
                ))}
              </div>
              <div style={{fontFamily:"monospace",fontSize:".75rem",color:"#d4952a",marginBottom:4}}>Vaquilla 2° Invierno — Recría pre-entore (flushing)</div>
              <div style={{fontFamily:"monospace",fontSize:".52rem",color:"rgba(212,149,42,.5)",marginBottom:10}}>Peso mínimo entore: 0.75 × PV vaca adulta · Flushing: 0.8% PV, 25–30d pre-entore</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
                {[["vaq2N","N° Cabezas","35"],["vaq2PV","Peso Promedio (kg)","290"],["diasEntore","Días al Entore","45"]].map(([k,l,p])=>(
                  <div key={k}><label style={L}>{l}</label><input type="number" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={"Ej: "+p} style={I}/></div>
                ))}
                <div><label style={L}>Tendencia de Peso</label><select value={form.tendPeso} onChange={e=>set("tendPeso",e.target.value)} style={I}><option value="">—</option><option>Ganando peso</option><option>Peso estable</option><option>Perdiendo peso</option></select></div>
                <div><label style={L}>Suplementación Actual</label><select value={form.suplem} onChange={e=>set("suplem",e.target.value)} style={I}><option value="">Sin suplementar</option><option>Expeller proteico</option><option>Grano energético</option><option>Semilla de algodón</option><option>Mixtura E+P</option><option>Núcleo mineral</option></select></div>
              </div>
              {form.pvVacaAdulta&&(
                <div style={{marginTop:10,fontFamily:"monospace",fontSize:".62rem",color:"#d4952a",background:"rgba(212,149,42,.05)",border:"1px solid rgba(212,149,42,.2)",borderRadius:4,padding:"8px 12px"}}>
                  Peso mínimo entore (0.75 × {form.pvVacaAdulta} kg): <strong>{(parseFloat(form.pvVacaAdulta)*0.75).toFixed(0)} kg</strong>
                  {form.vaq2PV&&parseFloat(form.vaq2PV)<parseFloat(form.pvVacaAdulta)*0.75&&<span style={{color:"#c04820"}}> · ⚠️ Vaq 2°inv ({form.vaq2PV} kg) NO alcanza el mínimo</span>}
                </div>
              )}
            </div>

            <div style={P}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#7ec850",marginBottom:10}}>💬 CONSULTA ESPECÍFICA</div>
              <textarea value={form.consulta} onChange={e=>set("consulta",e.target.value)} placeholder="Describí la situación o pregunta técnica puntual..." rows={4} style={{...I,lineHeight:1.7,resize:"vertical"}}/>
            </div>

            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
              <button onClick={runAnalysis} disabled={loading} style={{background:loading?"#3e5230":"#7ec850",color:"#070d03",border:"none",borderRadius:4,padding:"12px 28px",fontFamily:"monospace",fontSize:"1rem",letterSpacing:2.5,cursor:loading?"not-allowed":"pointer",fontWeight:700}}>{loading?"⏳ PROCESANDO...":"⚡ ANALIZAR SISTEMA"}</button>
              <button onClick={()=>setForm(f=>({...f,estadoDestete:"",pastoCal:"",pVacas:"",ccActual:"",diasParto:"",diasDesteteEst:"",eReprod:"",v2sN:"",v2sPV:"",v2sCC:"",v2sTernero:"",v2sDiasDestete:"",zona:"",provincia:"",mes:"",clima:"",vegetacion:"",supHa:"",fenologia:"",vacasN:"",ternerosN:"",torosN:"",prenezHist:"",pctDestete:"",vaq1N:"",vaq1PV:"",vaq1GDP:"",vaq2N:"",vaq2PV:"",diasEntore:"",tendPeso:"",suplem:"",consulta:""}))} style={{background:"transparent",border:"1px solid rgba(122,150,104,.2)",borderRadius:4,color:"#7a9668",padding:"12px 16px",fontFamily:"monospace",fontSize:".62rem",cursor:"pointer"}}>LIMPIAR</button>
            </div>

            {loading&&(
              <div style={{background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:8,padding:18,marginBottom:14,display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontFamily:"monospace",fontSize:".6rem",color:"#7ec850",whiteSpace:"nowrap"}}>PROCESANDO</div>
                <div style={{flex:1,height:2,background:"rgba(126,200,80,.07)",borderRadius:1,overflow:"hidden",position:"relative"}}><div style={{position:"absolute",top:0,left:0,width:"40%",height:"100%",background:"#7ec850",borderRadius:1,animation:"scan 1.2s ease-in-out infinite"}}/></div>
                <div style={{fontFamily:"monospace",fontSize:".6rem",color:"#7a9668",whiteSpace:"nowrap"}}>{loadMsg}</div>
              </div>
            )}

            {result&&(
              <div style={{background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:8,padding:22,marginTop:8}}>
                <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:3,color:"#7ec850",marginBottom:14,paddingBottom:10,borderBottom:"1px solid rgba(126,200,80,.09)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                  <span>INFORME TÉCNICO — 8 SECCIONES</span>
                  <button onClick={()=>navigator.clipboard?.writeText(result)} style={{background:"transparent",border:"1px solid rgba(126,200,80,.2)",borderRadius:3,color:"#7ec850",padding:"4px 10px",fontFamily:"monospace",fontSize:".58rem",cursor:"pointer"}}>COPIAR</button>
                </div>
                <div style={{fontSize:".87rem",lineHeight:1.9}} dangerouslySetInnerHTML={{__html:renderResult(result)}}/>
                {form.nombreProductor&&<div style={{marginTop:12,fontFamily:"monospace",fontSize:".58rem",color:"#7a9668"}}>✅ Guardado: {form.nombreProductor} — {new Date().toLocaleDateString("es-AR")}</div>}
              </div>
            )}
          </div>
        )}

        {tab==="planilla"&&(
          <div style={P}>
            <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#7ec850",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
              <span>📋 PLANILLA DE PRODUCTORES</span>
              <div style={{display:"flex",gap:8}}>
                <button onClick={exportCSV} style={{background:"rgba(58,143,181,.1)",border:"1px solid rgba(58,143,181,.3)",borderRadius:3,color:"#3a8fb5",padding:"6px 12px",fontFamily:"monospace",fontSize:".6rem",cursor:"pointer"}}>⬇ CSV</button>
                <button onClick={()=>{if(confirm("¿Borrar todos los registros?")){setProductores([]);localStorage.removeItem("agm_prod");}}} style={{background:"rgba(192,72,32,.1)",border:"1px solid rgba(192,72,32,.3)",borderRadius:3,color:"#c04820",padding:"6px 12px",fontFamily:"monospace",fontSize:".6rem",cursor:"pointer"}}>🗑 LIMPIAR</button>
              </div>
            </div>
            <div style={{fontFamily:"monospace",fontSize:".55rem",color:"#7a9668",marginBottom:14}}>{productores.length} productor{productores.length!==1?"es":""} · 1 fila por productor</div>
            {productores.length===0?(
              <div style={{textAlign:"center",padding:"40px 20px",fontFamily:"monospace",fontSize:".7rem",color:"#3e5230"}}>Sin registros. Completá el formulario con nombre del productor y analizá.</div>
            ):(
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"monospace",fontSize:".6rem"}}>
                  <thead><tr style={{borderBottom:"1px solid rgba(126,200,80,.2)"}}>
                    {["Productor","Zona","Prov","Mes","Clima","NDVI","ha","Fenología","Destete","CC","D.Parto","Vacas","Preñez%","V2s","Vaq1","Vaq2","CC Parto","Preñez Est","Visita"].map(h=>(
                      <th key={h} style={{padding:"6px 8px",color:"#7a9668",textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {productores.map((p,i)=>(
                      <tr key={i} style={{borderBottom:"1px solid rgba(126,200,80,.07)",cursor:"pointer"}} onClick={()=>{setForm(f=>({...f,...p}));setTab("analisis");}}>
                        {[p.nombre,p.zona,p.provincia,p.mes,p.clima,p.ndvi,p.supHa,p.fenologia,p.estadoDestete,p.ccActual,p.diasParto,p.vacasN,p.prenezHist,p.v2sN,p.vaq1N,p.vaq2N,p.ccParto,p.prenezEst?p.prenezEst+"%":"",p.fechaVisita].map((v,j)=>(
                          <td key={j} style={{padding:"6px 8px",color:"#ede8d8",whiteSpace:"nowrap"}}>{v||"—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{fontFamily:"monospace",fontSize:".55rem",color:"#3e5230",marginTop:8}}>Clic en fila para cargar ese productor</div>
              </div>
            )}
          </div>
        )}

        {tab==="marco"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
            {[
              ["📅 Destete — La Palanca Central","#d4952a","rgba(212,149,42,.3)","Destete en febrero = caída −6–8 Mcal/día + rebrote otoñal. La velocidad de recuperación depende del pastizal y tamaño del animal. El expeller potencia después del destete, no lo reemplaza.","Balbuena INTA (2003)"],
              ["⚠️ Vaca 2° Servicio","#8866cc","rgba(136,102,204,.35)","Triple demanda: lactando + creciendo + quedar preñada. ~20–22 Mcal/día. Déficit 12–17 Mcal. Destete precoz = ESTÁNDAR. Proyectar pérdida CC SOLO hasta destete, luego recuperación post-destete.",""],
              ["📊 Curva CC → Preñez","#7ec850","rgba(126,200,80,.2)","CC 5.5 parto → 4.0 serv → 75% · CC 5.0 → 3.5 → 55% · CC 4.5 → 3.0 → 35%. Pérdida post-parto NEA: 1.5 pts. La palanca está en el parto.","Datos campo NEA"],
              ["🌾 Consumo × Fenología","#7ec850","rgba(126,200,80,.15)","<10% flor: ~2.3% PV · 10–25%: ~2.1% · 25–50%: ~1.9% · >50%: ~1.6%. A mayor lignificación el B-value sube y el animal no puede compensar con cantidad. Restricción física dominante.","Detmann et al. (2014) J.Anim.Sci."],
              ["🐄 Vaquilla 1° Invierno","#d4952a","rgba(212,149,42,.25)","Recría post-destete, primera etapa crítica. GDP objetivo: 600 g/d. Meta: ≥280 kg al 2°invierno. Suplementación proteica sin discusión en invierno. Primer entore: 24 meses.","NASSEM (2010)"],
              ["📚 Fuentes Técnicas","#3a8fb5","rgba(58,143,181,.25)","NASSEM (2010) · Balbuena INTA CB (2003) · Peruchena INTA Ctes (2003) · Detmann et al. J.Anim.Sci. (2014) · Rosello Brajovich et al. INTA (2025) · NRC Beef (2000)",""],
            ].map(([title,color,border,body,src])=>(
              <div key={title} style={{background:"#141a09",border:`1px solid ${border}`,borderRadius:8,padding:16}}>
                <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color,marginBottom:8}}>{title}</div>
                <p style={{fontSize:".8rem",color:"#7a9668",lineHeight:1.7}}>{body}</p>
                {src&&<div style={{fontFamily:"monospace",fontSize:".52rem",color:"#3a8fb5",marginTop:8}}>{src}</div>}
              </div>
            ))}
          </div>
        )}

      </div>
      <style>{`@keyframes scan{0%{left:-40%}100%{left:110%}} select option{background:#1a2210} *{box-sizing:border-box}`}</style>
    </div>
  );
}
