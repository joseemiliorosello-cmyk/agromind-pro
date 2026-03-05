import React, { useState, useEffect, useRef } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ═══════════════════════════════════════════════════════
// DATOS BASE
// ═══════════════════════════════════════════════════════
const HELADAS_PROV={"Formosa":{dia:15,mes:5},"Chaco":{dia:1,mes:5},"Corrientes":{dia:1,mes:5},"Misiones":{dia:20,mes:4},"Entre Ríos":{dia:10,mes:4},"Santa Fe":{dia:10,mes:4},"Santiago del Estero":{dia:25,mes:4},"Salta":{dia:15,mes:5},"Buenos Aires":{dia:15,mes:4},"Córdoba":{dia:10,mes:4},"La Pampa":{dia:20,mes:3},"Mendoza":{dia:1,mes:4},"Neuquén":{dia:1,mes:3},"Río Negro":{dia:20,mes:2}};
const CLIMA_HIST={"Corrientes":[{t:28,p:130},{t:27,p:120},{t:25,p:110},{t:20,p:90},{t:16,p:70},{t:13,p:60},{t:13,p:55},{t:15,p:50},{t:18,p:80},{t:22,p:110},{t:25,p:120},{t:27,p:130}],"Chaco":[{t:29,p:120},{t:28,p:110},{t:26,p:110},{t:21,p:80},{t:16,p:60},{t:13,p:50},{t:13,p:45},{t:15,p:45},{t:19,p:70},{t:23,p:100},{t:26,p:110},{t:28,p:120}],"Formosa":[{t:30,p:120},{t:29,p:110},{t:27,p:110},{t:22,p:80},{t:17,p:55},{t:14,p:45},{t:14,p:40},{t:16,p:45},{t:20,p:70},{t:24,p:100},{t:27,p:110},{t:29,p:120}],"Misiones":[{t:26,p:170},{t:26,p:160},{t:24,p:150},{t:19,p:130},{t:15,p:110},{t:13,p:90},{t:13,p:90},{t:14,p:100},{t:17,p:120},{t:21,p:150},{t:23,p:160},{t:25,p:170}],"Entre Ríos":[{t:25,p:100},{t:24,p:90},{t:22,p:90},{t:17,p:70},{t:13,p:55},{t:10,p:45},{t:10,p:40},{t:12,p:45},{t:15,p:65},{t:19,p:90},{t:22,p:100},{t:24,p:100}],"Santiago del Estero":[{t:28,p:90},{t:27,p:80},{t:25,p:80},{t:20,p:50},{t:15,p:30},{t:12,p:20},{t:12,p:15},{t:14,p:20},{t:18,p:40},{t:22,p:70},{t:25,p:80},{t:27,p:90}],"Salta":[{t:24,p:140},{t:23,p:130},{t:22,p:110},{t:17,p:50},{t:13,p:20},{t:10,p:10},{t:10,p:10},{t:12,p:15},{t:16,p:30},{t:20,p:70},{t:22,p:110},{t:23,p:130}],"Buenos Aires":[{t:24,p:90},{t:23,p:80},{t:21,p:90},{t:16,p:70},{t:12,p:55},{t:9,p:45},{t:9,p:40},{t:11,p:50},{t:13,p:65},{t:17,p:85},{t:20,p:90},{t:23,p:90}],"Córdoba":[{t:25,p:100},{t:24,p:90},{t:22,p:90},{t:17,p:60},{t:13,p:35},{t:10,p:25},{t:10,p:20},{t:12,p:25},{t:15,p:45},{t:19,p:75},{t:22,p:90},{t:24,p:100}],"Santa Fe":[{t:26,p:110},{t:25,p:100},{t:23,p:100},{t:18,p:70},{t:14,p:50},{t:11,p:40},{t:11,p:35},{t:13,p:40},{t:16,p:60},{t:20,p:90},{t:23,p:100},{t:25,p:110}]};
const CLIMA_DEF=[{t:27,p:120},{t:26,p:110},{t:24,p:100},{t:20,p:80},{t:15,p:60},{t:12,p:50},{t:12,p:45},{t:14,p:50},{t:18,p:70},{t:22,p:95},{t:25,p:110},{t:26,p:120}];
const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_C=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const FENOLOGIAS=[{val:"menor_10",label:"<10% Floración",emoji:"🌿",desc:"PB >10% · Dig >65% · Consumo máx 2.8%PV",cvMS:0.028,fAprov:1.00},{val:"10_25",label:"10–25% Floración",emoji:"🌾",desc:"PB 7–10% · Dig 60–65% · Consumo máx 2.4%PV",cvMS:0.024,fAprov:0.90},{val:"25_50",label:"25–50% Floración",emoji:"🍂",desc:"PB 5–7% · Dig 55–60% · Consumo máx 2.0%PV",cvMS:0.020,fAprov:0.75,warn:"⚠ Déficit proteico"},{val:"mayor_50",label:">50% Floración",emoji:"🪵",desc:"PB <5% · Dig <55% · Consumo máx 1.6%PV",cvMS:0.016,fAprov:0.55,warn:"⚠ Déficit severo"}];
const ESTADOS_REPROD=["Gestación temprana (1–4 meses)","Gestación media (5–7 meses)","Preparto (último mes)","Lactación con ternero al pie","Vaca seca sin ternero"];
const DISCLAIMER="Las recomendaciones generadas por AgroMind Pro tienen carácter orientativo y se basan en los datos ingresados y parámetros técnicos de referencia. No reemplazan el criterio profesional del ingeniero agrónomo o médico veterinario que asiste al establecimiento, quien deberá validar, ajustar e implementar cualquier decisión de manejo según las condiciones particulares de cada sistema productivo.";

// MODELO OFERTA — Paruelo & Oesterheld (2000); Peruchena INTA (2003); UF/IFAS Sollenberger (2000)
const PROD_BASE={
  "Pastizal natural NEA/Chaco":8,
  "Megatérmicas C4 (gatton panic, brachiaria)":14,
  "Pasturas templadas C3":10,
  "Mixta gramíneas+leguminosas":11,
  "Bosque nativo":1.5,
  "Verdeo de invierno":12,
};
const UTIL=0.40; // eficiencia cosecha extensiva (Oesterheld et al. 1998)

// ═══════════════════════════════════════════════════════
// FUNCIONES TÉCNICAS
// ═══════════════════════════════════════════════════════
const getClima=(prov)=>CLIMA_HIST[prov]||CLIMA_DEF;
const factorT=(t)=>t>=25?1.0:t>=20?0.80:t>=15?0.45:t>=10?0.15:0.05;
const factorP=(p)=>p>=100?1.0:p>=50?0.85:p>=20?0.60:0.30;
const factorN=(ndvi)=>Math.max(0.3,0.5+parseFloat(ndvi||0.45)*1.2);
const mcalKg=(t)=>t>=25?2.10:t>=20?1.90:t>=15?1.50:t>=10?1.00:0.65;
const modENSO=(e)=>e==="nino"?1.25:e==="nina"?0.75:1.0;
// mcalKg ajustado por calidad forrajera (fenología) y temperatura
// Temperatura reduce mcalKg por menor digestibilidad en frío
// Fenología reduce mcalKg por lignificación (Minson 1990; Van Soest 1994)
const mcalKgAdj=(t,fenol)=>{
  const base=t>=25?2.10:t>=20?1.90:t>=15?1.50:t>=10?1.00:0.65;
  const fFenol={menor_10:1.00,"10_25":0.95,"25_50":0.85,mayor_50:0.72}[fenol]||1.00;
  return base*fFenol;
};
// fAprov: fracción aprovechable según estado fenológico
const fAprovFenol=(fenol)=>({menor_10:1.00,"10_25":0.90,"25_50":0.75,mayor_50:0.55}[fenol]||1.00);
// cvMS: consumo voluntario máx (fracción PV) según calidad forrajera
const cvMSFenol=(fenol)=>({menor_10:0.028,"10_25":0.024,"25_50":0.020,mayor_50:0.016}[fenol]||0.025);
// Oferta forrajera completa:
// PPNA (kg MS/ha/día) × factorT × factorP × factorN(NDVI) × ENSO × UTIL × fAprov × mcalKg(t,fenol)
const calcOfPasto=(veg,ndvi,temp,precip,enso,fenol)=>{
  const pb=PROD_BASE[veg]||8;
  const kgMsHa=Math.max(0,pb*factorN(ndvi)*factorT(temp)*factorP(precip*modENSO(enso))*UTIL*fAprovFenol(fenol));
  return kgMsHa*mcalKgAdj(temp,fenol);
};

function fechaHelada(prov,ndvi){const h=HELADAS_PROV[prov];if(!h)return null;const n=parseFloat(ndvi)||0.45;const aj=n>0.55?7:n<0.35?-7:0;const hoy=new Date();const f=new Date(hoy.getFullYear(),h.mes,h.dia);f.setDate(f.getDate()+aj);if(f<hoy)f.setFullYear(hoy.getFullYear()+1);return f;}
function diasHelada(prov,ndvi){const f=fechaHelada(prov,ndvi);if(!f)return 999;return Math.max(0,Math.round((f-new Date())/(1000*60*60*24)));}
function mesBajo15(prov){const c=getClima(prov);for(let i=0;i<12;i++)if(c[i].t<15)return i;return 5;}
function calcDisp(prov,ndvi,bal,sat){const n=parseFloat(ndvi)||0.45,b=parseFloat(bal)||0,dh=diasHelada(prov,ndvi);const mc=new Date().getMonth();const hist=getClima(prov);const tA=sat?parseFloat(sat.temp):hist[mc]?.t||20;let dT=999;if(tA<15)dT=0;else{for(let i=1;i<=6;i++){const mi=(mc+i)%12;if(hist[mi].t<15){dT=i*30;break;}}}let dS=999;if(n<0.35||b<-40)dS=0;else if(n<0.40||b<-20)dS=7;const dias=Math.min(dh,dS,dT);const tipo=dT<=dS&&dT<=dh?"Temp <15°C":dS<=dh?"Sequía":"Helada";return{tipo,dias,fHelada:fechaHelada(prov,ndvi),mb15:mesBajo15(prov)};}
function tasaPD(ndvi,tern){const n=parseFloat(ndvi)||0.45;const b=n>0.40?0.004:n>0.30?0.007:n>0.20?0.010:0.014;return tern?b+0.006:b;}

// ── CADENA REPRODUCTIVA ──────────────────────────────
// Dado inicio y fin de servicio, calcula fechas clave del rodeo
const DEST_TIPOS={trad:{dias:180,label:"Tradicional"},antic:{dias:90,label:"Anticipado"},hiper:{dias:50,label:"Hiperprecoz"}};
function calcCadena(iniServ,finServ){
  if(!iniServ||!finServ)return null;
  const ini=new Date(iniServ),fin=new Date(finServ);
  const partoTemp=new Date(ini);partoTemp.setMonth(partoTemp.getMonth()+9);
  const partoTard=new Date(fin);partoTard.setMonth(partoTard.getMonth()+9);
  const diasServ=Math.round((fin-ini)/(1000*60*60*24));
  const hoy=new Date();
  const diasPartoTemp=Math.round((partoTemp-hoy)/(1000*60*60*24));
  const diasPartoTard=Math.round((partoTard-hoy)/(1000*60*60*24));
  const nacVaq=new Date(partoTemp);
  const mayo1Inv=new Date(nacVaq.getFullYear()+1,4,1);
  const edadMayo=Math.round((mayo1Inv-nacVaq)/(1000*60*60*24)/30);
  const PV_NAC=35;
  const tipos={};
  Object.entries(DEST_TIPOS).forEach(([key,{dias,label}])=>{
    const desteTemp=new Date(partoTemp);desteTemp.setDate(desteTemp.getDate()+dias);
    const desteTard=new Date(partoTard);desteTard.setDate(desteTard.getDate()+dias);
    const mesTard=desteTard.getMonth();
    const terneroOtono=mesTard>=4&&mesTard<=5;
    const pvDest=Math.round(PV_NAC+0.700*dias);
    const diasPostDest=Math.max(0,Math.round((mayo1Inv-desteTemp)/(1000*60*60*24)));
    const pvMayo=Math.round(pvDest+0.400*diasPostDest);
    tipos[key]={dias,label,desteTemp,desteTard,terneroOtono,pvDest,pvMayo};
  });
  return{ini,fin,diasServ,partoTemp,partoTard,diasPartoTemp,diasPartoTard,nacVaq,mayo1Inv,edadMayo,tipos};
}
function calcTerneros(vacasN,prenez,pctDestete,destTrad,destAntic,destHiper,cadena){
  const vN=parseInt(vacasN)||0;
  const prN=parseFloat(prenez)||0;
  const pdN=parseFloat(pctDestete)||0;
  const terneros=Math.round(vN*(prN/100)*(pdN/100));
  const pTrad=Math.max(0,parseFloat(destTrad)||0);
  const pAntic=Math.max(0,parseFloat(destAntic)||0);
  const pHiper=Math.max(0,parseFloat(destHiper)||0);
  const total=pTrad+pAntic+pHiper;
  if(!total||!terneros||!cadena)return{terneros,pvMayoPond:0,detalle:[]};
  const detalle=[
    {key:"trad",label:"Tradicional",pct:pTrad/total,n:Math.round(terneros*pTrad/total),pvDest:cadena.tipos.trad?.pvDest||0,pvMayo:cadena.tipos.trad?.pvMayo||0},
    {key:"antic",label:"Anticipado",pct:pAntic/total,n:Math.round(terneros*pAntic/total),pvDest:cadena.tipos.antic?.pvDest||0,pvMayo:cadena.tipos.antic?.pvMayo||0},
    {key:"hiper",label:"Hiperprecoz",pct:pHiper/total,n:Math.round(terneros*pHiper/total),pvDest:cadena.tipos.hiper?.pvDest||0,pvMayo:cadena.tipos.hiper?.pvMayo||0},
  ].filter(d=>d.pct>0);
  const pvMayoPond=detalle.length?Math.round(detalle.reduce((s,d)=>s+d.pct*d.pvMayo,0)):0;
  return{terneros,pvMayoPond,detalle};
}
function calcVaq1({ndvi,bal,pv}){
  const n=parseFloat(ndvi)||0.45,b=parseFloat(bal)||0,p=parseFloat(pv)||180;
  const PV_OBJ=210,DIAS=120,GDP_MIN=400;
  const gdpNec=Math.max(GDP_MIN,Math.round((PV_OBJ-p)/DIAS*1000));
  const gdpReal=Math.max(GDP_MIN,Math.min(700,gdpNec+(p>200?-50:p<175?50:0)));
  const pvSal=Math.round(p+gdpReal*DIAS/1000);
  const deficit=pvSal<PV_OBJ;
  let prot=0,energ=0,freq="",esc="",desc="";
  if(gdpReal<=450&&n>=0.40&&b>-20){esc="A";prot=+(p*0.004).toFixed(2);energ=0;freq="3×/sem";desc="Proteico 0.4%PV · GDP "+gdpReal+"g/d";}
  else if(gdpReal<=550&&(n>=0.30||b>=-40)){esc="B";prot=+(p*0.007).toFixed(2);energ=0;freq="diario";desc="Proteico 0.7%PV · GDP "+gdpReal+"g/d";}
  else{esc="C";prot=+(p*0.0065).toFixed(2);energ=+(p*0.0035).toFixed(2);freq="diario";desc="0.65%prot+0.35%maíz · GDP "+gdpReal+"g/d";}
  // Post-invierno sep→abr (210 días): campo cubre, GDP ~300 g/d
  const pvAbr2Inv=Math.round(pvSal+0.300*210);
  return{esc,prot,energ,freq,desc,gdpNec,gdpReal,pvSal,pvObj:PV_OBJ,deficit,dias:DIAS,pvAbr2Inv};
}
function escVaq1(ndvi,bal,pv){return calcVaq1({ndvi,bal,pv});}

// ── VAQ 2° INVIERNO ──────────────────────────────────
// Entra con pvAbr2Inv, debe llegar al entore (agosto ~24 meses) con:
// 1. PV ≥ 0.75 × PV adulta
// 2. Ganando peso al momento del entore
function calcVaq2({pvEntrada,pvAdulta,ndvi,bal}){
  const p=parseFloat(pvEntrada)||280,pA=parseFloat(pvAdulta)||420;
  const pvMinEntore=Math.round(pA*0.75);
  const DIAS_INV=90; // may-jul (3 meses)
  const DIAS_TOTAL=120; // may-ago hasta entore
  const GDP_MIN=300;
  // GDP necesario para llegar al peso mínimo
  const gdpNec=Math.max(GDP_MIN,Math.round((pvMinEntore-p)/DIAS_TOTAL*1000));
  const gdpReal=Math.max(GDP_MIN,Math.min(600,gdpNec));
  const pvEntore=Math.round(p+gdpReal*DIAS_TOTAL/1000);
  const llegas=pvEntore>=pvMinEntore;
  const ganando=gdpReal>=GDP_MIN; // siempre en positivo
  // Suplementación
  let prot=0,energ=0,freq="",esc="",desc="";
  const n=parseFloat(ndvi)||0.45,b=parseFloat(bal)||0;
  if(gdpReal<=400&&n>=0.40&&b>-20){esc="A";prot=+(p*0.004).toFixed(2);energ=0;freq="3×/sem";desc="Proteico 0.4%PV · GDP "+gdpReal+"g/d";}
  else if(gdpReal<=500&&(n>=0.30||b>=-40)){esc="B";prot=+(p*0.007).toFixed(2);energ=0;freq="diario";desc="Proteico 0.7%PV · GDP "+gdpReal+"g/d";}
  else{esc="C";prot=+(p*0.0065).toFixed(2);energ=+(p*0.0035).toFixed(2);freq="diario";desc="0.65%prot+0.35%maíz · GDP "+gdpReal+"g/d";}
  return{esc,prot,energ,freq,desc,gdpNec,gdpReal,pvEntore,pvMinEntore,llegas,ganando,dias:DIAS_TOTAL};
}

function reqEM(pv,cat){const p=parseFloat(pv)||0;if(!p)return null;const pm=Math.pow(p,0.75);const f={"Gestación temprana (1–4 meses)":1.15,"Gestación media (5–7 meses)":1.20,"Preparto (último mes)":1.35,"Lactación con ternero al pie":1.90,"Vaca seca sin ternero":1.00,"vaca2serv":2.00,"vaq1inv":1.30,"vaq2inv":1.20}[cat]||1.10;return+(pm*0.077*f).toFixed(1);}
const CC_PR=[{ccP:6.5,ccS:5.0,pr:95},{ccP:6.0,ccS:4.5,pr:88},{ccP:5.5,ccS:4.0,pr:75},{ccP:5.0,ccS:3.5,pr:55},{ccP:4.5,ccS:3.0,pr:35},{ccP:4.0,ccS:2.5,pr:15},{ccP:3.5,ccS:2.0,pr:5}];
function interpCC(ccP){const t=CC_PR;if(ccP>=t[0].ccP)return{ccS:t[0].ccS,pr:t[0].pr};if(ccP<=t[t.length-1].ccP)return{ccS:t[t.length-1].ccS,pr:t[t.length-1].pr};for(let i=0;i<t.length-1;i++){if(ccP<=t[i].ccP&&ccP>=t[i+1].ccP){const r=(ccP-t[i+1].ccP)/(t[i].ccP-t[i+1].ccP);return{ccS:+(t[i+1].ccS+r*(t[i].ccS-t[i+1].ccS)).toFixed(1),pr:Math.round(t[i+1].pr+r*(t[i].pr-t[i+1].pr))};}}return{ccS:2.5,pr:15};}
function ccPond(dist){let tot=0,sum=0;(dist||[]).forEach(d=>{const p=parseFloat(d.pct)||0,c=parseFloat(d.cc)||0;sum+=p*c;tot+=p;});return tot>0?sum/tot:0;}
function calcCCParto(dist,diasP,estD,pastoCal,diasD,ndvi,prov){const cc=ccPond(dist);if(!cc||!diasP)return null;const dp=parseInt(diasP),dd=parseInt(diasD)||0;const tR={excelente:0.022,bueno:0.016,regular:0.009,malo:0.004}[pastoCal]||0.013;const dDisp=diasHelada(prov,ndvi);const tP=tasaPD(ndvi,false);if(estD==="no_ternero"){const dT=Math.min(dd>0?dd:dp,dp);const ccPD=Math.max(1,cc-0.010*dT);const dR=dp-dT;const dB=Math.min(dR,Math.max(0,dDisp-dT));const ccPH=Math.min(9,ccPD+tR*dB);return parseFloat(Math.max(1,ccPH-tP*Math.max(0,dR-dB)).toFixed(2));}if(["ok_feb","ok_mar","precoz","tard_abr"].includes(estD)){const dB=Math.min(dp,dDisp);const ccPH=Math.min(9,cc+tR*dB);return parseFloat(Math.max(1,ccPH-tP*Math.max(0,dp-dDisp)).toFixed(2));}return cc;}
function dZona(lat,lon){if(lat>-24)return"NEA";if(lat>-28&&lon>-58)return"NEA";if(lat>-30&&lon<-64)return"NOA";if(lat>-38&&lat<=-30&&lon>-62)return"Pampa Húmeda";if(lat>-38&&lat<=-30&&lon<=-62&&lon>-67)return"Semiárido";if(lon<-67&&lat>-35)return"Cuyo";if(lat<=-38)return"Patagonia";return"Pampa Húmeda";}
function dProv(lat,lon){if(lat>-22&&lon>-60)return"Formosa";if(lat>-22&&lon<=-60)return"Salta";if(lat>-24&&lat<=-22&&lon>-58)return"Chaco";if(lat>-28&&lat<=-24&&lon>-57)return"Corrientes";if(lat>-30&&lat<=-28&&lon>-57)return"Misiones";if(lat>-30&&lat<=-28&&lon<=-57&&lon>-59)return"Corrientes";if(lat>-32&&lat<=-30&&lon>-58)return"Entre Ríos";return"";}
const fmtFecha=(d)=>d?new Date(d).toLocaleDateString("es-AR",{day:"numeric",month:"short",year:"numeric"}):"—";
const diffDias=(a,b)=>Math.round((new Date(b)-new Date(a))/(1000*60*60*24));

// ═══════════════════════════════════════════════════════
// COLORES
// ═══════════════════════════════════════════════════════
const C={bg:"#09100a",surface:"#111a0f",card:"#141f11",border:"rgba(126,200,80,.10)",borderAct:"rgba(126,200,80,.35)",green:"#7ec850",amber:"#d4952a",red:"#c04820",blue:"#3a8fb5",purple:"#8866cc",text:"#e8e3d5",textDim:"#7a9668",textFaint:"#3e5230"};
const semaforo=(v,lo,hi)=>v>=hi?C.green:v>=lo?C.amber:C.red;

// ═══════════════════════════════════════════════════════
// GRÁFICO BALANCE
// ═══════════════════════════════════════════════════════
function GraficoBalance({form,sat,dispar,vaq1E,potreros}){
  const mc=new Date().getMonth();
  const enso=form.enso||"neutro";
  const prov=form.provincia||"Corrientes";
  const ndvi=sat?.ndvi||"0.45";
  const hist=getClima(prov);
  const mesD=mc;
  const diasP=parseInt(form.diasParto)||90;
  const mesP=Math.min(11,(mesD+Math.round(diasP/30))%12);
  const mb15=dispar?.mb15||4;
  const tR={excelente:0.022,bueno:0.016,regular:0.009,malo:0.004}[form.pastoCal]||0.013;
  // fenología actual — para consumo voluntario y mcalKg
  const fenolAct=form.fenologia||"menor_10";
  // PV promedio rodeo para techo consumo voluntario
  const pvPromRodeo=parseFloat(form.pvVacaAdulta)||380;
  const vN=parseInt(form.vacasN)||0,v2N=parseInt(form.v2sN)||0,q1N=parseInt(form.vaq1N)||0,q2N=parseInt(form.vaq2N)||0;
  const nTotal=Math.max(1,vN+v2N+q1N+q2N);
  const usaPotreros=potreros&&potreros.length>0&&potreros.some(p=>p.ha&&p.veg);

  const datos=MESES_C.map((mes,i)=>{
    const h=i===mc&&sat?{t:parseFloat(sat.temp)||hist[i].t,p:parseFloat(sat.p30)||hist[i].p}:hist[i];
    const ndviI=i===mc?parseFloat(ndvi):0.45;
    const bajo15=h.t<15;
    // Fenología: mes actual usa fenol real, resto usa proxy estacional
    // En verano/primavera <25% flor, en invierno >50% flor para C4
    const fenolMes=i===mc?fenolAct:(h.t<15?"mayor_50":h.t<20?"25_50":h.t<25?"10_25":"menor_10");
    // Oferta desde potreros individuales o global
    let ofPasto=0;
    if(usaPotreros){
      potreros.forEach(pot=>{
        const ha=parseFloat(pot.ha)||0;
        if(!ha||!pot.veg)return;
        const fenolPot=i===mc?(pot.fenol||"menor_10"):fenolMes;
        ofPasto+=Math.round(calcOfPasto(pot.veg,ndviI,h.t,h.p,enso,fenolPot)*ha);
      });
    } else {
      const supHa=parseFloat(form.supHa)||100;
      const pctM=Math.min(100,parseFloat(form.pctMonte)||0);
      const pctN=Math.min(100,parseFloat(form.pctNGan)||0);
      const haPast=supHa*Math.max(0,100-pctM-pctN)/100;
      const haMonte=supHa*pctM/100;
      ofPasto=Math.round(calcOfPasto(form.vegetacion||"Pastizal natural NEA/Chaco",ndviI,h.t,h.p,enso,fenolMes)*haPast);
      ofPasto+=Math.round(haMonte*0.55*0.65*0.55); // bosque nativo: calidad muy baja
    }
    // Techo consumo voluntario del sistema (Mcal/día máx disponible)
    // cvMS(fenol) × pvPromRodeo × nTotal animales × mcalKg(t,fenol)
    const cvMaxMcal=Math.round(cvMSFenol(fenolMes)*pvPromRodeo*nTotal*mcalKgAdj(h.t,fenolMes));
    // Oferta efectiva = mínimo entre lo producido y lo que puede consumir el rodeo
    ofPasto=Math.min(ofPasto,cvMaxMcal);
    const eRep=i>=mesP&&i<mesP+2?"Preparto (último mes)":i>=mesP+2&&i<mesP+5?"Lactación con ternero al pie":"Gestación media (5–7 meses)";
    const dVacas=vN>0?Math.round((reqEM(form.pvVacaAdulta,eRep)||13)*vN):0;
    const dV2s=v2N>0?Math.round((reqEM(form.v2sPV,"vaca2serv")||18)*v2N):0;
    const dQ1=q1N>0&&i>=mesD?Math.round((reqEM(form.vaq1PV,"vaq1inv")||12)*q1N):0;
    const dQ2=q2N>0?Math.round((reqEM(form.vaq2PV,"vaq2inv")||10)*q2N):0;
    const demanda=dVacas+dV2s+dQ1+dQ2;
    let ccEndog=0;
    if(vN>0){if(i>=mesD&&i<mb15)ccEndog=Math.round(tR*60*vN*0.5);else if(i>=mesP&&i<mesP+3)ccEndog=-Math.round(1.5*vN*0.5);}
    const ofTotal=ofPasto+Math.max(0,ccEndog);
    const deficit=Math.max(0,demanda-ofTotal);
    return{mes,i,dVacas,dV2s,dQ1,dQ2,demanda,ofPasto,ofTotal,deficit,bajo15,esActual:i===mc,temp:h.t};
  });
  const defMeses=datos.filter(d=>d.deficit>0);

  return(
    <div>
      <div style={{fontFamily:"monospace",fontSize:12,color:C.green,marginBottom:4,letterSpacing:2}}>📊 BALANCE ENERGÉTICO ANUAL</div>
      <div style={{fontFamily:"monospace",fontSize:8,color:"rgba(126,200,80,.35)",marginBottom:8}}>
        Paruelo &amp; Oesterheld (2000) · Peruchena INTA (2003) · Util 0.40: Oesterheld et al. (1998)
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={datos} margin={{top:4,right:4,left:0,bottom:0}}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(126,200,80,.06)"/>
          <XAxis dataKey="mes" tick={{fontFamily:"monospace",fontSize:9,fill:C.textDim}}/>
          <YAxis tick={{fontFamily:"monospace",fontSize:9,fill:C.textDim}} width={48}/>
          <Tooltip contentStyle={{background:C.surface,border:`1px solid ${C.border}`,fontFamily:"monospace",fontSize:10,borderRadius:8}} formatter={(v,n)=>[Math.round(v).toLocaleString()+" Mcal/d",n]}/>
          <Legend wrapperStyle={{fontFamily:"monospace",fontSize:9,paddingTop:4}}/>
          <Bar dataKey="dVacas" name="Vacas" stackId="d" fill="rgba(126,200,80,.65)"/>
          <Bar dataKey="dV2s" name="2°Serv" stackId="d" fill="rgba(136,102,204,.70)"/>
          <Bar dataKey="dQ1" name="Vaq1" stackId="d" fill="rgba(212,149,42,.75)"/>
          <Bar dataKey="dQ2" name="Vaq2" stackId="d" fill="rgba(58,143,181,.65)"/>
          <Bar dataKey="deficit" name="Déficit" stackId="def" fill="rgba(192,72,32,.45)" radius={[3,3,0,0]}/>
          <Line type="monotone" dataKey="ofPasto" name="Oferta pasto" stroke={C.green} strokeWidth={2} dot={{r:2,fill:C.green}}/>
          <Line type="monotone" dataKey="ofTotal" name="Oferta+CC" stroke="#a3d96e" strokeWidth={1.5} dot={false} strokeDasharray="5 3"/>
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:6}}>
        {datos.map((d,i)=>(
          <div key={i} style={{fontFamily:"monospace",fontSize:8,textAlign:"center",padding:"2px 4px",borderRadius:3,
            background:d.bajo15?"rgba(192,72,32,.12)":d.esActual?"rgba(126,200,80,.12)":"transparent",
            border:d.bajo15?"1px solid rgba(192,72,32,.25)":d.esActual?"1px solid rgba(126,200,80,.25)":"1px solid transparent",
            color:d.bajo15?C.red:d.esActual?C.green:C.textDim}}>
            {d.mes}<br/>{d.temp}°
          </div>
        ))}
      </div>
      {defMeses.length>0&&(
        <div style={{marginTop:10,background:"rgba(192,72,32,.05)",border:"1px solid rgba(192,72,32,.18)",borderRadius:10,padding:12}}>
          <div style={{fontFamily:"monospace",fontSize:11,color:C.red,marginBottom:6}}>⚠️ MESES CON DÉFICIT</div>
          {defMeses.map((d,i)=>(
            <div key={i} style={{fontFamily:"monospace",fontSize:10,color:"#e09070",marginBottom:4}}>
              <strong>{d.mes}:</strong> {Math.round(d.deficit).toLocaleString()} Mcal/día
              {d.dV2s>0&&<span style={{color:C.purple,marginLeft:6}}>· 2°S</span>}
              {d.dQ1>0&&<span style={{color:C.amber,marginLeft:6}}>· V1</span>}
              {d.dVacas>0&&<span style={{color:C.green,marginLeft:6}}>· Vac</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DIST CC
// ═══════════════════════════════════════════════════════
function DistCC({label,dist,onChange,color}){
  const total=dist.reduce((s,d)=>s+(parseFloat(d.pct)||0),0);
  const ok=Math.abs(total-100)<1;
  return(
    <div style={{marginTop:12}}>
      <div style={{fontFamily:"monospace",fontSize:10,color:color||C.textDim,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>{label}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {dist.map((d,i)=>(
          <div key={i} style={{background:"rgba(0,0,0,.3)",border:`1px solid ${C.border}`,borderRadius:10,padding:10,textAlign:"center"}}>
            <div style={{fontFamily:"monospace",fontSize:9,color:C.textDim,marginBottom:5}}>GRUPO {i+1}</div>
            <div style={{fontFamily:"monospace",fontSize:9,color:C.textDim,marginBottom:3}}>CC (1–9)</div>
            <input type="number" inputMode="decimal" value={d.cc} min="1" max="9" step="0.5" onChange={e=>onChange(i,"cc",e.target.value)}
              style={{width:"100%",background:"rgba(0,0,0,.5)",border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"8px 4px",fontSize:16,fontFamily:"monospace",textAlign:"center",marginBottom:6}}/>
            <div style={{fontFamily:"monospace",fontSize:9,color:C.textDim,marginBottom:3}}>% Vacas</div>
            <input type="number" inputMode="numeric" value={d.pct} min="0" max="100" onChange={e=>onChange(i,"pct",e.target.value)}
              style={{width:"100%",background:"rgba(0,0,0,.5)",border:`1px solid ${C.border}`,borderRadius:6,color:C.text,padding:"8px 4px",fontSize:16,fontFamily:"monospace",textAlign:"center"}}/>
          </div>
        ))}
      </div>
      <div style={{fontFamily:"monospace",fontSize:10,marginTop:6,display:"flex",justifyContent:"space-between"}}>
        <span style={{color:ok?C.green:C.red}}>Total: {total}% {ok?"✅":"⚠️ debe ser 100%"}</span>
        {ok&&<span style={{color:C.green}}>CC pond: <strong>{ccPond(dist).toFixed(1)}/9</strong></span>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CARD COLAPSABLE
// ═══════════════════════════════════════════════════════
function InfoCard({num,title,icon,status,children,defaultOpen=false,cite}){
  const[open,setOpen]=useState(defaultOpen);
  const sc=status==="ok"?C.green:status==="warn"?C.amber:status==="crit"?C.red:C.textDim;
  const si=status==="ok"?"🟢":status==="warn"?"🟡":status==="crit"?"🔴":"⚪";
  return(
    <div style={{background:C.card,border:`1px solid ${open?C.borderAct:C.border}`,borderRadius:14,marginBottom:10,overflow:"hidden"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",background:"transparent",border:"none",padding:"14px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left"}}>
        <div style={{width:28,height:28,borderRadius:8,background:`${sc}18`,border:`1px solid ${sc}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:"monospace",fontSize:9,color:C.textDim,letterSpacing:1.5,marginBottom:2}}>SECCIÓN {num}</div>
          <div style={{fontFamily:"monospace",fontSize:12,color:C.text,fontWeight:600}}>{title}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          <span>{si}</span>
          <span style={{fontFamily:"monospace",fontSize:14,color:C.textDim,display:"inline-block",transform:open?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
        </div>
      </button>
      {open&&(
        <div style={{padding:"0 16px 16px"}}>
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12,fontSize:13,color:C.text,lineHeight:1.8}}>{children}</div>
          {cite&&<div style={{marginTop:8,fontFamily:"monospace",fontSize:9,color:C.textFaint,borderTop:`1px solid ${C.border}`,paddingTop:6}}>{cite}</div>}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TABLA RECOMENDACIONES
// ═══════════════════════════════════════════════════════
function TablaRecom({rows}){
  if(!rows?.length)return<div style={{textAlign:"center",padding:16,fontFamily:"monospace",fontSize:11,color:C.green,background:"rgba(126,200,80,.05)",borderRadius:10,border:`1px solid rgba(126,200,80,.15)`}}>✅ Sin acciones urgentes detectadas</div>;
  const pm={urgente:{color:C.red,icon:"🔴",label:"URGENTE"},importante:{color:C.amber,icon:"🟡",label:"IMPORTANTE"},preventivo:{color:C.green,icon:"🟢",label:"PREVENTIVO"}};
  return(
    <div style={{borderRadius:10,overflow:"hidden",border:`1px solid ${C.border}`}}>
      <div style={{display:"grid",gridTemplateColumns:"88px 1fr 76px 80px",background:"rgba(0,0,0,.4)",padding:"8px 10px"}}>
        {["Prioridad","Categoría / Acción","Fecha","Resultado"].map(h=>(
          <div key={h} style={{fontFamily:"monospace",fontSize:8,color:C.textDim,textTransform:"uppercase",letterSpacing:1}}>{h}</div>
        ))}
      </div>
      {rows.map((r,i)=>{
        const p=pm[r.prioridad]||pm.preventivo;
        return(
          <div key={i} style={{display:"grid",gridTemplateColumns:"88px 1fr 76px 80px",padding:"10px 10px",borderTop:i>0?`1px solid ${C.border}`:"none",background:i%2===0?"transparent":"rgba(0,0,0,.15)",alignItems:"start"}}>
            <div style={{fontFamily:"monospace",fontSize:8,color:p.color,letterSpacing:.5}}>{p.icon} {p.label}</div>
            <div>
              <div style={{fontFamily:"monospace",fontSize:11,color:C.text,fontWeight:600,marginBottom:2}}>{r.categoria}</div>
              <div style={{fontFamily:"monospace",fontSize:10,color:C.textDim,lineHeight:1.4}}>{r.accion}</div>
            </div>
            <div style={{fontFamily:"monospace",fontSize:10,color:C.amber}}>{r.fecha}</div>
            <div style={{fontFamily:"monospace",fontSize:10,color:p.color,lineHeight:1.4}}>{r.resultado}</div>
          </div>
        );
      })}
    </div>
  );
}

function buildRecomRows(form,vaq1E,vaq2E,ccParto,curva,dispar,cadena){
  const rows=[];
  const hoy=new Date();
  const mesAct=MESES[hoy.getMonth()];
  const mesSig=MESES[(hoy.getMonth()+1)%12];
  if(form.v2sN&&parseInt(form.v2sN)>0&&form.v2sTernero==="si")
    rows.push({prioridad:"urgente",categoria:`Vaca 2°Serv (${form.v2sN} cab)`,accion:"Destete precoz inmediato — triple demanda insostenible",fecha:mesAct,resultado:"-4 Mcal/día · +preñez"});
  if(ccParto&&ccParto<5.0)
    rows.push({prioridad:ccParto<4.5?"urgente":"importante",categoria:"Vacas CC baja",accion:`CC parto ${ccParto}/9 → preñez ${curva?.pr||"—"}%. Proteico 0.5%PV vacas críticas`,fecha:mesAct+" → parto",resultado:`CC +${(5.0-ccParto).toFixed(1)} pts`});
  if(vaq1E&&form.vaq1N&&parseInt(form.vaq1N)>0)
    rows.push({prioridad:vaq1E.esc==="C"?"urgente":vaq1E.esc==="B"?"importante":"preventivo",categoria:`Vaq 1°inv (${form.vaq1N} cab)`,accion:`Esc ${vaq1E.esc}: ${vaq1E.prot}kg prot/día${vaq1E.energ>0?" + "+vaq1E.energ+"kg maíz/día":""} · ${vaq1E.freq}`,fecha:"May → Ago (120d)",resultado:`GDP ${vaq1E.gdpReal}g/d → ${vaq1E.pvSal}kg sep${vaq1E.deficit?" ⚠️":""}`});
  if(vaq2E&&form.vaq2N&&parseInt(form.vaq2N)>0)
    rows.push({prioridad:!vaq2E.llegas?"urgente":"importante",categoria:`Vaq 2°inv (${form.vaq2N} cab)`,accion:`Esc ${vaq2E.esc}: ${vaq2E.prot}kg prot/día${vaq2E.energ>0?" + "+vaq2E.energ+"kg maíz/día":""} · ${vaq2E.freq}`,fecha:"May → Ago",resultado:`GDP ${vaq2E.gdpReal}g/d → ${vaq2E.pvEntore}kg entore${!vaq2E.llegas?" ⚠️":""}`});
  if(dispar&&dispar.dias<45&&dispar.dias<999)
    rows.push({prioridad:"importante",categoria:"Alerta forrajera",accion:`${dispar.tipo} en ~${dispar.dias} días — iniciar suplementación proteica antes`,fecha:`~${dispar.dias}d`,resultado:"Evitar pérdida CC"});
  if(cadena?.terneroOtono)
    rows.push({prioridad:"urgente",categoria:"Vaca tardía (fin serv.)",accion:"Ternero al pie en otoño → CC comprometida. Destete anticipado o hiperprecoz",fecha:fmtFecha(cadena.desteTemp),resultado:"Recuperación CC otoñal"});
  return rows;
}

// ═══════════════════════════════════════════════════════
// RENDER INFORME
// ═══════════════════════════════════════════════════════
function RenderInforme({text,form,sat,dispar,vaq1E,vaq2E,ccParto,curva,cadena,potreros}){
  if(!text)return null;
  const EMOJIS=["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣"];
  const TITLES=["Diagnóstico Ambiental","Diagnóstico por Categoría","Destete y Proyección CC","Balance Oferta vs Demanda","Estrategia","Recomendaciones"];
  const ICONS=["🌡️","🐄","📅","⚖️","🎯","✅"];
  const CITES=["Open-Meteo API · NDVI: Paruelo & Oesterheld (2000)","NASSEM (2010) · Detmann et al. (2014) · Balbuena INTA (2003)","Peruchena INTA (2003) · Rosello Brajovich et al. INTA (2025)","Paruelo & Oesterheld (2000) · Peruchena INTA (2003) · Oesterheld et al. (1998) · UF/IFAS Sollenberger (2000)","NASSEM (2010) · Balbuena INTA (2003)","NASSEM (2010) · Peruchena INTA (2003) · Rosello Brajovich et al. INTA (2025)"];
  const pC=curva?.pr||0;
  const STATUSES=[dispar&&dispar.dias<30?"crit":dispar&&dispar.dias<60?"warn":"ok",pC>=75?"ok":pC>=55?"warn":"crit",ccParto&&ccParto>=5.5?"ok":ccParto&&ccParto>=5.0?"warn":"crit","warn","ok","ok"];
  let sections=[];let remaining=text;
  for(let i=0;i<6;i++){const em=EMOJIS[i];const nxt=i<6?EMOJIS[i+1]:null;const st=remaining.indexOf(em);if(st===-1){sections.push("");continue;}const en=nxt?remaining.indexOf(nxt,st+1):-1;const chunk=en>-1?remaining.slice(st,en):remaining.slice(st);sections.push(chunk.split("\n").slice(1).join("\n").trim());if(en>-1)remaining=remaining.slice(en);}
  const recomRows=buildRecomRows(form,vaq1E,vaq2E,ccParto,curva,dispar,cadena);
  const rr=(t)=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n\n/g,"<br/><br/>").replace(/\n/g,"<br/>");
  return(
    <div>
      {TITLES.map((title,i)=>(
        <InfoCard key={i} num={i+1} title={title} icon={ICONS[i]} status={STATUSES[i]} defaultOpen={i===0||i===6} cite={CITES[i]}>
          {i===6?(
            <div>{sections[i]&&<div style={{marginBottom:12}} dangerouslySetInnerHTML={{__html:rr(sections[i])}}/>}<TablaRecom rows={recomRows}/></div>
          ):(
            sections[i]?<div dangerouslySetInnerHTML={{__html:rr(sections[i])}}/>:<div style={{color:C.textDim,fontFamily:"monospace",fontSize:11}}>— sin datos —</div>
          )}
        </InfoCard>
      ))}
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16,marginBottom:10}}>
        <GraficoBalance form={form} sat={sat} dispar={dispar} vaq1E={vaq1E} potreros={potreros}/>
      </div>
      <div style={{background:"rgba(212,149,42,.04)",border:`1px solid rgba(212,149,42,.25)`,borderRadius:12,padding:14,marginBottom:20}}>
        <div style={{fontFamily:"monospace",fontSize:10,color:C.amber,marginBottom:6,letterSpacing:1}}>⚠️ AVISO PROFESIONAL</div>
        <div style={{fontFamily:"monospace",fontSize:10,color:"rgba(212,149,42,.75)",lineHeight:1.8}}>{DISCLAIMER}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════════════════════
const SYS=`Actuás como asesor técnico experto en sistemas de cría bovina extensiva en Argentina. 20 años de campo en pasturas megatérmicas C4, NEA y semiárido.

EJE CENTRAL: FECHA DE SERVICIO → CADENA REPRODUCTIVA
El inicio y fin de servicio determinan: fecha de parto, fecha de destete, CC disponible para recuperación, situación de la vaquillona en cada etapa.
Vaca que se preña al FINAL del servicio → parto tardío → destete en otoño → riesgo de ternero al pie en época crítica → necesita destete anticipado o hiperprecoz.

DESTETE: Feb = palanca principal para recuperación CC. Recuperación válida HASTA disparador (<15°C C4). Post-disparador: pérdida según NDVI.

NDVI: proxy actividad fotosintética estimada (Paruelo & Oesterheld 2000). La fenología de campo es el dato primario HOY.

DISPARADOR: temp <15°C — C4 frena crecimiento y calidad abruptamente.

PROYECCIÓN CC 3 TRAMOS: Post-destete→disparador (recuperación) · Post-disparador→parto (pérdida NDVI) · Con lactancia (+0.006/d)

CURVA CC→PREÑEZ (Peruchena INTA 2003): 6.0→88%|5.5→75%|5.0→55%|4.5→35%|4.0→15%

REQUERIMIENTOS (NASSEM 2010; Detmann et al. 2014): PV^0.75 × 0.077 × factor categoría.

MODELO OFERTA (Paruelo & Oesterheld 2000; Peruchena INTA 2003; UF/IFAS Sollenberger 2000; Minson 1990):
PPNA = prodBase × factorN(NDVI) × factorT(temp) × factorP(precip × ENSO) × UTIL × fAprov(fenol)
Oferta Mcal = PPNA × mcalKg(temp, fenol)
Limitada por consumo voluntario: cvMS(fenol) × PV_promedio × n_animales

factorN(NDVI): 0.5 + NDVI×1.2 — Paruelo & Oesterheld (2000): r²=0.71
factorT: <10°C→0.05 | 10-15°C→0.15 | 15-20°C→0.45 | 20-25°C→0.80 | >25°C→1.00
factorP×ENSO: Niño+25%/Niña-25% sobre precipitación mensual
fAprov(fenol): <10%flor→1.00 | 10-25%→0.90 | 25-50%→0.75 | >50%→0.55
mcalKg(fenol): <10%flor→2.10 | 10-25%→1.90×0.95 | 25-50%→1.90×0.85 | >50%→1.90×0.72
cvMS(fenol): <10%flor→2.8%PV | 10-25%→2.4%PV | 25-50%→2.0%PV | >50%→1.6%PV
Pastizal natural NEA: 8 kg MS/ha/día base | Megatérmicas C4: 14 | UTIL: 0.40
Si hay potreros: calcular por potrero separado con su fenología individual.

VAQ 1°INV (NEA: mayo-agosto, 120 días):
Cadena de peso: nace (35kg) → lactancia 700g/d → destete → otoñal 400g/d → mayo → 1°inv 400g/d mínimo → objetivo 210kg septiembre.
El pastizal NO cubre los requerimientos de esta categoría en invierno — siempre requiere suplementación.
Esc A (NDVI≥0.40, balance>-20): proteico 0.4%PV · 3×/sem
Esc B (NDVI 0.30-0.40 o balance≥-40): proteico 0.7%PV · diario
Esc C (NDVI<0.30 o balance<-40): 0.65%prot + 0.35%maíz · diario
NO mencionar creep feeding. Dar dosis en kg/día únicamente. NO mencionar ventana de recuperación ni entore.

VAQ 2°INV (mayo-agosto año siguiente):
Debe llegar al entore (24 meses, agosto) con PV ≥ 0.75×PV adulta Y ganando peso.
GDP mínimo 300 g/día. Dar dosis en kg/día.

7 SECCIONES OBLIGATORIAS:
1️⃣ DIAGNÓSTICO AMBIENTAL: fecha, zona, NDVI, temp REAL, disparador, ENSO, fechas servicio/parto/destete
2️⃣ DIAGNÓSTICO POR CATEGORÍA: Mcal(PV^0.75) vs oferta. CC ponderada.
3️⃣ DESTETE Y PROYECCIÓN CC: 3 tramos con números del sistema. Alerta vaca tardía si aplica.
4️⃣ BALANCE OFERTA vs DEMANDA: por potrero si aplica. Citar fuentes.
5️⃣ ESTRATEGIA: destete→suplementación→ajuste carga. Kg/día sin precios.
6️⃣ RECOMENDACIONES: tabla CATEGORÍA|ACCIÓN|FECHA|KG/DÍA|RESULTADO con semáforo 🔴🟡🟢

NO incluir sección de emergencia ni impacto 1-2 años.
AL FINAL siempre el disclaimer completo.
Citar: (NASSEM,2010)·(Balbuena,INTA 2003)·(Peruchena,INTA 2003)·(Detmann et al.,2014)·(Paruelo & Oesterheld,2000)·(Oesterheld et al.,1998)·(Rosello Brajovich et al.,INTA 2025)·(UF/IFAS Sollenberger,2000)`;


// ═══════════════════════════════════════════════════════
// MAPA LEAFLET INTERACTIVO
// ═══════════════════════════════════════════════════════
function MapaLeaflet({initLat,initLon,onMove}){
  const divRef=useRef(null);
  const mapRef=useRef(null);
  const markerRef=useRef(null);
  // Ref para onMove — siempre apunta a la versión actual sin re-montar el mapa
  const onMoveRef=useRef(onMove);
  useEffect(()=>{onMoveRef.current=onMove;},[onMove]);

  useEffect(()=>{
    // Cargar Leaflet CSS
    if(!document.getElementById("leaflet-css")){
      const lk=document.createElement("link");
      lk.id="leaflet-css";lk.rel="stylesheet";
      lk.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(lk);
    }
    // Cargar Leaflet JS
    const loadL=()=>new Promise((res,rej)=>{
      if(window.L){res(window.L);return;}
      const s=document.createElement("script");
      s.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.onload=()=>res(window.L);
      s.onerror=rej;
      document.head.appendChild(s);
    });
    loadL().then(L=>{
      if(!divRef.current||mapRef.current)return;
      const la=initLat||(-27.5),lo=initLon||(-59.0);
      const zoom=initLat?10:4;
      const m=L.map(divRef.current,{attributionControl:false,zoomControl:true});
      m.setView([la,lo],zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18}).addTo(m);
      const ico=L.divIcon({
        html:'<div style="width:26px;height:26px;background:#7ec850;border:3px solid #050d02;border-radius:50%;box-shadow:0 2px 10px rgba(0,0,0,.7)"></div>',
        iconSize:[26,26],iconAnchor:[13,13],className:""
      });
      let mk=initLat?L.marker([la,lo],{draggable:true,icon:ico}).addTo(m):null;
      if(mk){
        mk.on("dragend",e=>{
          const p=e.target.getLatLng();
          onMoveRef.current(p.lat,p.lng);
        });
      }
      m.on("click",e=>{
        const {lat,lng}=e.latlng;
        if(!mk){
          mk=L.marker([lat,lng],{draggable:true,icon:ico}).addTo(m);
          mk.on("dragend",ev=>{
            const p=ev.target.getLatLng();
            onMoveRef.current(p.lat,p.lng);
          });
          markerRef.current=mk;
        } else {
          mk.setLatLng([lat,lng]);
        }
        onMoveRef.current(lat,lng);
      });
      mapRef.current=m;
      if(mk)markerRef.current=mk;
    }).catch(e=>console.error("Leaflet:",e));
    return()=>{
      if(mapRef.current){mapRef.current.remove();mapRef.current=null;markerRef.current=null;}
    };
  },[]);// eslint-disable-line — solo monta una vez

  return(
    <div ref={divRef} style={{
      width:"100%",height:260,borderRadius:12,marginTop:8,
      border:"1px solid rgba(126,200,80,.25)",
      overflow:"hidden",background:"#1a2a18"
    }}/>
  );
}

// ═══════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════
export default function AgroMind(){
  const[step,setStep]=useState(0);
  const[form,setForm]=useState({
    nombreProductor:"",eReprod:"",diasParto:"",
    iniServ:"",finServ:"",
    destTrad:"100",destAntic:"0",destHiper:"0",
    v2sN:"",v2sPV:"",
    zona:"",provincia:"",mes:"",clima:"",vegetacion:"",supHa:"",pctMonte:"0",pctNGan:"0",fenologia:"",
    vacasN:"",torosN:"",prenez:"",pctDestete:"",
    vaq1N:"",vaq1PV:"",vaq2N:"",vaq2PV:"",
    pvVacaAdulta:"",suplem:"",enso:"neutro",
    ccDist:[{cc:6,pct:50},{cc:5,pct:30},{cc:4,pct:20}],
    cc2sDist:[{cc:5,pct:50},{cc:4,pct:30},{cc:3,pct:20}],
  });
  // Potreros
  const[potreros,setPotreros]=useState([]);
  const[usaPotreros,setUsaPotreros]=useState(false);

  const[sat,setSat]=useState(null);const[satLoading,setSatLoading]=useState(false);
  const[coords,setCoords]=useState(()=>{try{const s=localStorage.getItem("agm_coords");return s?JSON.parse(s):null;}catch(e){return null;}});
  const[manualLat,setManualLat]=useState("");const[manualLon,setManualLon]=useState("");
  const[loading,setLoading]=useState(false);const[loadMsg,setLoadMsg]=useState("");const[result,setResult]=useState("");
  const[ccParto,setCcParto]=useState(null);const[curva,setCurva]=useState(null);
  const[tab,setTab]=useState("analisis");const[gpsLoading,setGpsLoading]=useState(false);
  const[productores,setProductores]=useState([]);const[dispar,setDispar]=useState(null);
  const[vaq1E,setVaq1E]=useState(null);const[vaq2E,setVaq2E]=useState(null);
  const[cadena,setCadena]=useState(null);

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const setCCD=(i,c,v)=>{const d=[...form.ccDist];d[i]={...d[i],[c]:v};set("ccDist",d);};
  const setCC2D=(i,c,v)=>{const d=[...form.cc2sDist];d[i]={...d[i],[c]:v};set("cc2sDist",d);};
  const updPotrero=(i,k,v)=>{const p=[...potreros];p[i]={...p[i],[k]:v};setPotreros(p);};
  const addPotrero=()=>setPotreros(p=>[...p,{ha:"",veg:"Pastizal natural NEA/Chaco",fenol:"menor_10"}]);
  const delPotrero=(i)=>setPotreros(p=>p.filter((_,j)=>j!==i));

  useEffect(()=>{try{const p=JSON.parse(localStorage.getItem("agm_prod")||"[]");setProductores(p);}catch(e){}});
  useEffect(()=>{
    if(coords&&!sat){
      const z=dZona(coords.lat,coords.lon),pv=dProv(coords.lat,coords.lon),ms=MESES[new Date().getMonth()];
      setForm(f=>({...f,zona:z,provincia:pv,mes:ms}));
      fetchSat(coords.lat,coords.lon,z,ms);
    }
  },[]);

  // Cadena reproductiva
  useEffect(()=>{
    if(form.iniServ&&form.finServ){
      const c=calcCadena(form.iniServ,form.finServ);
      setCadena(c);
      if(c&&c.diasPartoTemp>0)set("diasParto",String(Math.max(0,c.diasPartoTemp)));
    } else setCadena(null);
  },[form.iniServ,form.finServ]);

  // CC parto
  useEffect(()=>{
    const dp=parseInt(form.diasParto);const cc=ccPond(form.ccDist);
    if(cc>0&&dp>0){const p=calcCCParto(form.ccDist,dp,"ok_feb","bueno","",sat?.ndvi||"0.45",form.provincia);setCcParto(p);setCurva(p?interpCC(p):null);}
    else{setCcParto(null);setCurva(null);}
  },[form.ccDist,form.diasParto,form.provincia,sat]);

  useEffect(()=>{if(form.provincia&&sat)setDispar(calcDisp(form.provincia,sat.ndvi,sat.deficit,sat));else setDispar(null);},[form.provincia,sat]);

  // Vaq1 desde cadena o manual
  useEffect(()=>{
    const pvMayoEst=form.pvDestVaq?Math.round(parseFloat(form.pvDestVaq)+0.400*Math.max(0,cadena?(cadena.mayo1Inv-cadena.desteTemp)/(1000*60*60*24):90)):cadena?.pvMayo1InvCalc||parseFloat(form.vaq1PV)||0;
    if(pvMayoEst&&sat)setVaq1E(calcVaq1({ndvi:sat.ndvi,bal:sat.deficit,pv:pvMayoEst}));
    else setVaq1E(null);
  },[form.vaq1PV,sat,cadena]);

  // Vaq2 desde salida vaq1
  useEffect(()=>{
    const pvEnt=vaq1E?.pvAbr2Inv?String(vaq1E.pvAbr2Inv):form.vaq2PV;
    if(pvEnt&&form.pvVacaAdulta&&sat)setVaq2E(calcVaq2({pvEntrada:pvEnt,pvAdulta:form.pvVacaAdulta,ndvi:sat.ndvi,bal:sat.deficit}));
    else setVaq2E(null);
  },[vaq1E,form.vaq2PV,form.pvVacaAdulta,sat]);

  const applyLoc=async(lat,lon,src)=>{const zona=dZona(lat,lon),prov=dProv(lat,lon),mes=MESES[new Date().getMonth()];const nc={lat,lon,src};setCoords(nc);try{localStorage.setItem("agm_coords",JSON.stringify(nc));}catch(e){}setForm(f=>({...f,zona,provincia:prov,mes}));await fetchSat(lat,lon,zona,mes);};
  const getGPS=()=>{if(!navigator.geolocation){alert("GPS no disponible");return;}setGpsLoading(true);navigator.geolocation.getCurrentPosition(p=>{setGpsLoading(false);applyLoc(p.coords.latitude,p.coords.longitude,"GPS");},e=>{setGpsLoading(false);alert("Error: "+e.message);},{enableHighAccuracy:true,timeout:15000});};
  const setManual=()=>{const lat=parseFloat(manualLat),lon=parseFloat(manualLon);if(isNaN(lat)||isNaN(lon)||lat>-20||lat<-56||lon>-52||lon<-74){alert("Coordenadas inválidas.\nEj: Lat -27.45 / Lon -59.12");return;}applyLoc(lat,lon,"Manual");};

  const fetchSat=async(lat,lon,zona,mes)=>{
    setSatLoading(true);setSat(null);
    try{
      const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration&timezone=auto&past_days=30&forecast_days=1`;
      const resp=await fetch(url);
      if(!resp.ok)throw new Error("Open-Meteo HTTP "+resp.status);
      const json=await resp.json();
      const d=json.daily;
      if(!d)throw new Error("Sin datos daily");
      const p30=d.precipitation_sum.slice(0,30).reduce((a,b)=>a+(b||0),0);
      const p7=d.precipitation_sum.slice(-7).reduce((a,b)=>a+(b||0),0);
      const tMax7=d.temperature_2m_max.slice(-7);
      const tMin7=d.temperature_2m_min.slice(-7);
      const temp=tMax7.map((t,i)=>(t+(tMin7[i]||t))/2).reduce((a,b)=>a+b,0)/tMax7.length;
      const et=d.et0_fao_evapotranspiration.slice(-7).reduce((a,b)=>a+(b||0),0)/7;
      const deficit=Math.round((p30-et*30)*10)/10;
      const clima=deficit<-40?"Seco":deficit>40?"Húmedo":"Normal";
      const ndviBase={NEA:0.55,"Pampa Húmeda":0.50,NOA:0.42,"Semiárido":0.38,Cuyo:0.30,Patagonia:0.28}[zona]||0.45;
      const pf=Math.min(Math.max((p30-20)/180,-0.15),0.25);
      const mi=MESES.indexOf(mes);
      const mf=[0.05,0.03,0,-0.03,-0.08,-0.12,-0.12,-0.08,-0.02,0.03,0.05,0.06];
      const ndvi=Math.min(Math.max(ndviBase+pf+(mi>=0?mf[mi]:0),0.05),0.95);
      const cond=ndvi>0.55?"Excelente":ndvi>0.40?"Buena":ndvi>0.25?"Moderada":ndvi>0.15?"Baja":"Muy baja";
      setSat({ndvi:ndvi.toFixed(2),temp:temp.toFixed(1),
        tMax:Math.max(...tMax7).toFixed(1),tMin:Math.min(...tMin7).toFixed(1),
        p7:Math.round(p7),p30:Math.round(p30),et:et.toFixed(1),
        deficit,cond,clima,lat:lat.toFixed(4),lon:lon.toFixed(4)});
      setForm(f=>({...f,clima}));
    }catch(e){
      console.error("fetchSat error:",e);
      setSat({error:e.message});
    }finally{setSatLoading(false);}
  };

  const saveProductor=(informe)=>{
    if(!form.nombreProductor.trim())return;
    const hoy=new Date().toLocaleDateString("es-AR");
    const tcSave=cadena?calcTerneros(form.vacasN,form.prenez,form.pctDestete,form.destTrad,form.destAntic,form.destHiper,cadena):null;
    const r={
      nombre_productor:form.nombreProductor,fecha_consulta:hoy,zona_productiva:form.zona,provincia:form.provincia,
      latitud:coords?.lat||"",longitud:coords?.lon||"",
      fecha_inicio_servicio:form.iniServ,fecha_fin_servicio:form.finServ,dias_servicio:cadena?.diasServ||"",
      fecha_parto_temprano_estimado:cadena?fmtFecha(cadena.partoTemp):"",fecha_parto_tardio_estimado:cadena?fmtFecha(cadena.partoTard):"",
      mes_consulta:form.mes,condicion_climatica:form.clima,condicion_enso:form.enso,
      ndvi_estimado:sat?.ndvi||"",temperatura_media_7d_C:sat?.temp||"",precipitacion_30d_mm:sat?.p30||"",balance_hidrico_mm:sat?.deficit||"",
      superficie_total_ha:usaPotreros?potreros.reduce((s,p)=>s+(parseFloat(p.ha)||0),0):form.supHa,
      tipo_vegetacion_principal:usaPotreros?potreros.map(p=>p.veg).join("|"):form.vegetacion,
      fenologia_actual:form.fenologia,disparador_tipo:dispar?.tipo||"",dias_al_disparador:dispar?.dias<999?dispar.dias:"",
      numero_vacas:form.vacasN,peso_vivo_vaca_adulta_kg:form.pvVacaAdulta,estado_reproductivo:form.eReprod,
      prenez_pct:form.prenez,destete_pct:form.pctDestete,
      destete_tradicional_pct:form.destTrad||"0",destete_anticipado_pct:form.destAntic||"0",destete_hiperprecoz_pct:form.destHiper||"0",
      terneros_destetados_total:tcSave?.terneros||"",
      pv_destete_tradicional_kg:cadena?.tipos?.trad?.pvDest||"",pv_entrada_mayo_tradicional_kg:cadena?.tipos?.trad?.pvMayo||"",
      pv_destete_anticipado_kg:cadena?.tipos?.antic?.pvDest||"",pv_entrada_mayo_anticipado_kg:cadena?.tipos?.antic?.pvMayo||"",
      pv_destete_hiperprecoz_kg:cadena?.tipos?.hiper?.pvDest||"",pv_entrada_mayo_hiperprecoz_kg:cadena?.tipos?.hiper?.pvMayo||"",
      pv_ponderado_entrada_1er_invierno_kg:tcSave?.pvMayoPond||"",
      numero_toros:form.torosN,cc_distribucion_vacas:form.ccDist.map(d=>`${d.pct}%→CC${d.cc}`).join("|"),
      cc_ponderada:ccPond(form.ccDist).toFixed(1),cc_parto_estimada:ccParto||"",cc_servicio_estimada:curva?.ccS||"",prenez_estimada_pct:curva?.pr||"",
      vacas_2do_servicio_numero:form.v2sN,pv_2do_servicio_kg:form.v2sPV,cc_distribucion_2do_servicio:form.cc2sDist.map(d=>`${d.pct}%→CC${d.cc}`).join("|"),
      vaquillas_1er_invierno_numero:form.vaq1N,pv_entrada_mayo_1er_invierno_kg:tcSave?.pvMayoPond||form.vaq1PV||"",
      escenario_suplementacion_1er_invierno:vaq1E?`Esc ${vaq1E.esc}: ${vaq1E.prot}kg prot/dia GDP ${vaq1E.gdpReal}g/d -> ${vaq1E.pvSal}kg sep`:"",
      vaquillas_2do_invierno_numero:form.vaq2N,pv_entrada_mayo_2do_invierno_kg:vaq1E?.pvAbr2Inv||form.vaq2PV||"",
      escenario_suplementacion_2do_invierno:vaq2E?`Esc ${vaq2E.esc}: ${vaq2E.prot}kg prot/dia GDP ${vaq2E.gdpReal}g/d -> ${vaq2E.pvEntore}kg entore`:"",
      fecha_visita:hoy,informe_resumen:(informe||"").slice(0,500),
      nPotreros:usaPotreros?potreros.length:0,potreros:usaPotreros?JSON.stringify(potreros.map(p=>({ha:p.ha,veg:p.veg,fenol:p.fenol}))):"[]"};
    const upd=[r,...productores.filter(p=>p.nombre_productor!==form.nombreProductor)];
    setProductores(upd);try{localStorage.setItem("agm_prod",JSON.stringify(upd));}catch(e){}
  };

  const exportCSV=()=>{
    if(!productores.length){alert("Sin datos.");return;}
    // CSV dinámico con columnas de potreros
    const baseCols=[
      "nombre_productor","fecha_consulta","zona_productiva","provincia","latitud","longitud",
      "fecha_inicio_servicio","fecha_fin_servicio","dias_servicio",
      "fecha_parto_temprano_estimado","fecha_parto_tardio_estimado",
      "mes_consulta","condicion_climatica","condicion_enso",
      "ndvi_estimado","temperatura_media_7d_C","precipitacion_30d_mm","balance_hidrico_mm",
      "superficie_total_ha","tipo_vegetacion_principal","fenologia_actual",
      "disparador_tipo","dias_al_disparador",
      "numero_vacas","peso_vivo_vaca_adulta_kg","estado_reproductivo",
      "prenez_pct","destete_pct",
      "destete_tradicional_pct","destete_anticipado_pct","destete_hiperprecoz_pct",
      "terneros_destetados_total",
      "pv_destete_tradicional_kg","pv_entrada_mayo_tradicional_kg",
      "pv_destete_anticipado_kg","pv_entrada_mayo_anticipado_kg",
      "pv_destete_hiperprecoz_kg","pv_entrada_mayo_hiperprecoz_kg",
      "pv_ponderado_entrada_1er_invierno_kg",
      "numero_toros","cc_distribucion_vacas","cc_ponderada",
      "cc_parto_estimada","cc_servicio_estimada","prenez_estimada_pct",
      "vacas_2do_servicio_numero","pv_2do_servicio_kg","cc_distribucion_2do_servicio",
      "vaquillas_1er_invierno_numero","pv_entrada_mayo_1er_invierno_kg","escenario_suplementacion_1er_invierno",
      "vaquillas_2do_invierno_numero","pv_entrada_mayo_2do_invierno_kg","escenario_suplementacion_2do_invierno",
      "fecha_visita","informe_resumen"
    ];
    // Máximo de potreros en los registros
    const maxPot=Math.max(0,...productores.map(p=>parseInt(p.nPotreros)||0));
    const potCols=[];
    for(let i=1;i<=maxPot;i++){potCols.push(`P${i}_ha`,`P${i}_veg`,`P${i}_fenol`);}
    const cols=[...baseCols,...potCols];
    const csv=[cols.join(","),...productores.map(p=>{
      return cols.map(col=>{
        if(col.match(/^P(\d+)_(ha|veg|fenol)$/)){
          const [,idx,field]=col.match(/^P(\d+)_(ha|veg|fenol)$/);
          const pots=JSON.parse(p.potreros||"[]");
          const pot=pots[parseInt(idx)-1];
          return `"${pot?String(pot[field]||"").replace(/"/g,'""'): ""}"`;
        }
        return `"${String(p[col]||"").replace(/"/g,'""')}"`; 
      }).join(",");
    })].join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`agromind_${new Date().toISOString().slice(0,10)}.csv`;a.click();
  };

  const buildPrompt=()=>{
    const fechaC=new Date().toLocaleDateString("es-AR",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
    let t=`ANÁLISIS — FECHA: ${fechaC}\n`;
    if(coords)t+=`UBICACIÓN: ${coords.lat?.toFixed(4)}°S ${coords.lon?.toFixed(4)}°W · ${form.zona} · ${form.provincia}\n`;
    if(sat)t+=`MET REAL: T${sat.temp}°C (Mx${sat.tMax}/Mn${sat.tMin}) · P7d:${sat.p7}mm P30d:${sat.p30}mm · Bal:${sat.deficit>0?"+":""}${sat.deficit}mm · NDVI:${sat.ndvi}(${sat.cond})\n`;
    t+=`ENSO: ${form.enso==="nino"?"El Niño +25%":form.enso==="nina"?"La Niña −25%":"Neutro"}\n`;
    if(dispar)t+=`DISPARADOR: ${dispar.tipo} ~${dispar.dias<999?dispar.dias+"d":"sin disparador próximo"}\n`;
    if(cadena){
      t+=`\nSERVICIO: ${fmtFecha(cadena.ini)} → ${fmtFecha(cadena.fin)} (${cadena.diasServ} días)\n`;
      t+=`PARTO TEMPRANO: ${fmtFecha(cadena.partoTemp)} · PARTO TARDÍO: ${fmtFecha(cadena.partoTard)}\n`;
      t+=`DESTETE (${form.destTrad}): Temprano ${fmtFecha(cadena.desteTemp)} · Tardío ${fmtFecha(cadena.desteTard)}\n`;
      if(cadena.terneroOtono)t+=`⚠️ ALERTA: VACA TARDÍA con ternero al pie en otoño — destete anticipado o hiperprecoz\n`;
      t+=`Vaquillona: nace ~${fmtFecha(cadena.nacVaq)} · entra 1°inv ${fmtFecha(cadena.mayo1Inv)} (${cadena.edadMayo} meses) · PV entrada estimado: ${cadena.pvMayo1Inv}kg\n`;
    }
    t+=`\nDESTETE RODEO: ${"—"} · Pasto: ${"—"}\n`;
    t+=`DIST CC: ${form.ccDist.map(d=>`${d.pct}%→CC${d.cc}`).join(" | ")} · Pond: ${ccPond(form.ccDist).toFixed(1)}/9\n`;
    t+=`PV vaca adulta: ${form.pvVacaAdulta||"—"}kg\n`;
    if(form.pvVacaAdulta&&form.eReprod){const r=reqEM(form.pvVacaAdulta,form.eReprod);if(r)t+=`Req EM (PV^0.75): ${r} Mcal/día\n`;}
    if(ccParto)t+=`CC PARTO: ${ccParto}/9 → CC serv: ${curva?.ccS} → Preñez: ${curva?.pr}% — USAR ESTE VALOR\n`;
    // Potreros
    if(usaPotreros&&potreros.length){
      t+=`\nPOTREROS (${potreros.length}):\n`;
      potreros.forEach((p,i)=>t+=`  Potrero ${i+1}: ${p.ha||"—"}ha · ${p.veg} · Fenol: ${p.fenol||"—"}\n`);
      const totHa=potreros.reduce((s,p)=>s+(parseFloat(p.ha)||0),0);
      t+=`  Total: ${totHa}ha\n`;
    } else {
      const sT=parseFloat(form.supHa)||0,sM=parseFloat(form.pctMonte)||0,sN=parseFloat(form.pctNGan)||0,sP=Math.max(0,100-sM-sN);
      t+=`\nCAMPO: ${sT}ha total · Pastizal ${Math.round(sT*sP/100)}ha (${sP.toFixed(0)}%) · Monte ${Math.round(sT*sM/100)}ha (${sM}%) · No gan ${Math.round(sT*sN/100)}ha (${sN}%)\n`;
    }
    t+=`FORRAJE: Fenol: ${form.fenologia||"—"} · Veg: ${form.vegetacion||"—"}\n`;
    t+=`2°SERV: N°${form.v2sN||"—"} · PV ${form.v2sPV||"—"}kg · Ternero: ${form.v2sTernero||"—"}\n`;
    t+=`DIST CC 2°SERV: ${form.cc2sDist.map(d=>`${d.pct}%→CC${d.cc}`).join(" | ")} · Pond: ${ccPond(form.cc2sDist).toFixed(1)}/9\n`;
    t+=`RODEO: ${form.vacasN||"—"} vacas · ${form.vacasN||"—"} terneros · Preñez hist ${form.prenez||"—"}%\n`;
    t+=(()=>{
      const pvD=parseFloat(form.pvDestVaq)||cadena?.pvDestCalc||0;
      const pvM=pvD>0&&cadena?Math.round(pvD+0.400*Math.max(0,(cadena.mayo1Inv-cadena.desteTemp)/(1000*60*60*24))):cadena?.pvMayo1InvCalc||parseFloat(form.vaq1PV)||0;
      return `VAQ1: N°${form.vaq1N||"—"} · PV destete: ${pvD||"—"}kg · PV entrada mayo: ${pvM||"—"}kg\n`;
    })();
    if(vaq1E)t+=`ESC VAQ1 (USAR): Esc ${vaq1E.esc} · ${vaq1E.prot}kg prot/día${vaq1E.energ>0?" + "+vaq1E.energ+"kg maíz/día":""} · ${vaq1E.freq} · GDP ${vaq1E.gdpReal}g/d → ${vaq1E.pvSal}kg sep · Post-inv: ${vaq1E.pvAbr2Inv}kg abr\n`;
    t+=`VAQ2: N°${form.vaq2N||"—"} · PV entrada mayo: ${vaq1E?.pvAbr2Inv||form.vaq2PV||"—"}kg · PV adulta: ${form.pvVacaAdulta||"—"}kg\n`;
    if(vaq2E)t+=`ESC VAQ2 (USAR): Esc ${vaq2E.esc} · ${vaq2E.prot}kg prot/día${vaq2E.energ>0?" + "+vaq2E.energ+"kg maíz/día":""} · GDP ${vaq2E.gdpReal}g/d → ${vaq2E.pvEntore}kg entore (min ${vaq2E.pvMinEntore}kg)${!vaq2E.llegas?" ⚠️NO LLEGA":""}\n`;
    if(form.pvVacaAdulta)t+=`PV mín entore: ${(parseFloat(form.pvVacaAdulta)*0.75).toFixed(0)}kg\n`;
    if(form.suplem)t+=`Supl actual: ${form.suplem}\n`;
    if(form.consulta)t+=`\nCONSULTA: ${form.consulta}\n`;
    t+="\n→ 7 secciones numeradas. Tabla recomendaciones sección 7 con semáforo. Suplementación en kg/día sin precios. NO mencionar creep feeding. Citar todas las fuentes. Disclaimer al final.";
    return t;
  };

  const MSGS=["Procesando fechas de servicio...","Calculando cadena reproductiva...","Proyectando CC 3 tramos...","Evaluando escenario vaq1°inv...","Calculando vaq2°inv hacia entore...","Calibrando oferta por potrero...","Redactando informe...","Tabla recomendaciones..."];
  const runAnalysis=async()=>{setLoading(true);setResult("");let mi=0;const iv=setInterval(()=>{setLoadMsg(MSGS[mi%MSGS.length]);mi++;},2000);try{const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:buildPrompt(),systemPrompt:SYS})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Error");setResult(data.result);saveProductor(data.result);setStep(4);}catch(e){setResult("❌ Error: "+e.message);}finally{clearInterval(iv);setLoading(false);}};

  // ── ESTILOS ──
  const inp={width:"100%",background:"rgba(0,0,0,.45)",border:`1px solid ${C.border}`,borderRadius:10,color:C.text,padding:"14px 12px",fontSize:16,fontFamily:"Georgia,serif",boxSizing:"border-box"};
  const lbl={fontFamily:"monospace",fontSize:10,color:C.textDim,textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:6};
  const cardS={background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16,marginBottom:12};
  const btnSel=(active,color=C.green)=>({background:active?`${color}20`:"rgba(0,0,0,.25)",border:`1px solid ${active?color:C.border}`,borderRadius:12,color:active?color:C.textDim,padding:"14px 10px",fontFamily:"monospace",fontSize:13,cursor:"pointer",textAlign:"center",width:"100%",display:"block"});
  const pC=!curva?C.textDim:semaforo(curva.pr,55,75);
  const ccC=!ccParto?C.textDim:semaforo(ccParto,5.0,5.5);
  const dC=!dispar?C.textDim:dispar.dias<30?C.red:dispar.dias<60?C.amber:C.green;
  const PASOS=["📍 Ubicación","📅 Servicio","🐄 Rodeo","⚠️ Categorías","🌾 Forraje","⚡ Analizar"];

  const renderPaso=()=>{

    // PASO 0 — UBICACIÓN
    if(step===0)return(
      <div>
        <div style={cardS}>
          <label style={lbl}>Establecimiento</label>
          <input value={form.nombreProductor} onChange={e=>set("nombreProductor",e.target.value)} placeholder="Nombre del productor o establecimiento" style={inp}/>
        </div>
        <div style={cardS}>
          <div style={{fontFamily:"monospace",fontSize:13,color:C.green,marginBottom:10,letterSpacing:1}}>📍 UBICACIÓN</div>
          {/* Mapa principal — tocá cualquier punto o arrastrá el pin */}
          <div style={{fontFamily:"monospace",fontSize:10,color:C.textDim,marginBottom:6,textAlign:"center"}}>
            Tocá el mapa para fijar la ubicación, o arrastrá el pin 📍
          </div>
          <MapaLeaflet
            initLat={coords?.lat||null}
            initLon={coords?.lon||null}
            onMove={(la,lo)=>applyLoc(la,lo,"Mapa")}
          />
          {/* Confirma ubicación actual */}
          {coords?(
            <div style={{fontFamily:"monospace",fontSize:11,color:C.green,marginTop:8,textAlign:"center",background:"rgba(126,200,80,.06)",border:"1px solid rgba(126,200,80,.15)",borderRadius:10,padding:"8px 12px"}}>
              ✅ {coords.lat?.toFixed(4)}°S · {coords.lon?.toFixed(4)}°W
              <br/><strong>{form.zona}</strong> · {form.provincia}
              {sat&&!sat.error&&<span style={{color:C.textDim,fontSize:10}}> · T{sat.temp}°C · NDVI {sat.ndvi}</span>}
            </div>
          ):(
            <div style={{fontFamily:"monospace",fontSize:10,color:C.textDim,marginTop:6,textAlign:"center"}}>
              Aún no hay ubicación fijada
            </div>
          )}
          {/* GPS como alternativa rápida */}
          <button onClick={getGPS} disabled={gpsLoading} style={{width:"100%",background:"rgba(126,200,80,.06)",border:`1px solid rgba(126,200,80,.2)`,color:C.green,borderRadius:10,padding:"12px",fontFamily:"monospace",fontSize:13,cursor:"pointer",marginTop:10,marginBottom:8}}>
            {gpsLoading?"📍 Localizando...":"📍 Usar mi ubicación actual (GPS)"}
          </button>
          {/* Entrada manual de coordenadas — opción avanzada */}
          <details style={{marginTop:4}}>
            <summary style={{fontFamily:"monospace",fontSize:10,color:C.textDim,cursor:"pointer",marginBottom:6}}>
              Ingresar coordenadas manualmente
            </summary>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:8}}>
              <div><label style={lbl}>Latitud</label><input type="number" inputMode="decimal" value={manualLat} onChange={e=>setManualLat(e.target.value)} placeholder="-27.45" style={inp}/></div>
              <div><label style={lbl}>Longitud</label><input type="number" inputMode="decimal" value={manualLon} onChange={e=>setManualLon(e.target.value)} placeholder="-59.12" style={inp}/></div>
              <div style={{display:"flex",alignItems:"flex-end"}}>
                <button onClick={()=>{
                  const la=parseFloat(manualLat),lo=parseFloat(manualLon);
                  if(!isNaN(la)&&!isNaN(lo))applyLoc(la,lo,"Manual");
                }} style={{width:"100%",background:"rgba(126,200,80,.1)",border:`1px solid rgba(126,200,80,.25)`,borderRadius:10,color:C.green,padding:"12px 6px",fontFamily:"monospace",fontSize:12,cursor:"pointer"}}>
                  Fijar
                </button>
              </div>
            </div>
          </details>
          {satLoading&&<div style={{fontFamily:"monospace",fontSize:11,color:C.green,textAlign:"center",marginTop:10}}>🛰 Cargando datos meteorológicos...</div>}
          {sat?.error&&<div style={{fontFamily:"monospace",fontSize:10,color:C.red,textAlign:"center",marginTop:8}}>⚠️ Error cargando datos: {sat.error}</div>}
          {sat&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:12}}>
              {[["🌡️",sat.temp+"°C",C.amber],["🌧",sat.p30+"mm",C.blue],["⚖️",(sat.deficit>0?"+":"")+sat.deficit,sat.deficit<-30?C.red:C.amber],["🛰",sat.ndvi,C.green]].map(([l,v,cl])=>(
                <div key={l} style={{textAlign:"center",background:"rgba(0,0,0,.35)",borderRadius:10,padding:"10px 4px",border:`1px solid ${C.border}`}}>
                  <div style={{fontFamily:"monospace",fontSize:9,color:C.textDim,marginBottom:3}}>{l}</div>
                  <div style={{fontFamily:"monospace",fontSize:13,color:cl,fontWeight:700}}>{v}</div>
                </div>
              ))}
            </div>
          )}
          {dispar&&dispar.dias<60&&sat&&<div style={{marginTop:10,background:"rgba(192,72,32,.08)",border:"1px solid rgba(192,72,32,.25)",borderRadius:10,padding:10,fontFamily:"monospace",fontSize:11,color:"#e09070",textAlign:"center"}}>⚠️ {dispar.tipo} en ~{dispar.dias} días — C4 frena</div>}
        </div>
        <div style={cardS}>
          <div style={{fontFamily:"monospace",fontSize:11,color:C.textDim,marginBottom:8}}>CONDICIÓN ENSO</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[["neutro","⚪ Neutro",C.textDim],["nino","🌊 El Niño",C.blue],["nina","🔴 La Niña",C.red]].map(([v,l,c])=>(
              <button key={v} onClick={()=>set("enso",v)} style={btnSel(form.enso===v,c)}>{l}</button>
            ))}
          </div>
        </div>
      </div>
    );

    // PASO 1 — FECHAS DE SERVICIO
    if(step===1){
      const sumDest=(parseFloat(form.destTrad)||0)+(parseFloat(form.destAntic)||0)+(parseFloat(form.destHiper)||0);
      const sumOk=Math.abs(sumDest-100)<1;
      return(
      <div>
        <div style={cardS}>
          <div style={{fontFamily:"monospace",fontSize:13,color:C.amber,marginBottom:6,letterSpacing:1}}>📅 FECHA DE SERVICIO</div>
          <div style={{fontFamily:"monospace",fontSize:10,color:"rgba(212,149,42,.55)",marginBottom:14}}>NEA estándar: noviembre → enero/febrero (3,5 meses)</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div><label style={lbl}>Inicio de servicio</label><input type="date" value={form.iniServ} onChange={e=>set("iniServ",e.target.value)} style={inp}/></div>
            <div><label style={lbl}>Fin de servicio</label><input type="date" value={form.finServ} onChange={e=>set("finServ",e.target.value)} style={inp}/></div>
          </div>
        </div>
        <div style={cardS}>
          <div style={{fontFamily:"monospace",fontSize:13,color:C.green,marginBottom:4,letterSpacing:1}}>🐄 MODALIDAD DE DESTETE</div>
          <div style={{fontFamily:"monospace",fontSize:10,color:"rgba(126,200,80,.4)",marginBottom:12}}>% de terneros por modalidad — deben sumar 100%</div>
          {[["destTrad","⏳ Tradicional","180 días de lactancia · PV dest ~161kg",C.green],
            ["destAntic","🔶 Anticipado","90 días de lactancia · PV dest ~98kg",C.amber],
            ["destHiper","⚡ Hiperprecoz","50 días de lactancia · PV dest ~70kg",C.blue]
          ].map(([k,label,sub,col])=>(
            <div key={k} style={{background:"rgba(0,0,0,.25)",border:`1px solid ${C.border}`,borderRadius:12,padding:12,marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontFamily:"monospace",fontSize:12,color:col,fontWeight:600}}>{label}</div>
                  <div style={{fontFamily:"monospace",fontSize:9,color:C.textDim,marginTop:2}}>{sub}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <input type="number" inputMode="numeric" min="0" max="100" value={form[k]}
                    onChange={e=>set(k,e.target.value)}
                    style={{...inp,width:70,textAlign:"center",padding:"10px 6px",fontSize:20,fontWeight:700,color:col}}/>
                  <span style={{fontFamily:"monospace",fontSize:14,color:C.textDim}}>%</span>
                </div>
              </div>
              {cadena&&parseFloat(form[k]||0)>0&&(()=>{
                const key={destTrad:"trad",destAntic:"antic",destHiper:"hiper"}[k];
                const t=cadena.tipos[key];
                if(!t)return null;
                return(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginTop:8}}>
                    {[["Días lact.",t.dias+"d",C.textDim],["PV destete",t.pvDest+"kg",col],["PV mayo",t.pvMayo+"kg",C.amber]].map(([l,v,cl])=>(
                      <div key={l} style={{textAlign:"center",background:"rgba(0,0,0,.2)",borderRadius:6,padding:"4px 2px"}}>
                        <div style={{fontFamily:"monospace",fontSize:8,color:C.textDim}}>{l}</div>
                        <div style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:cl}}>{v}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ))}
          <div style={{textAlign:"center",fontFamily:"monospace",fontSize:12,marginTop:4,
            color:sumOk?C.green:sumDest>0?C.red:C.textDim,fontWeight:700}}>
            {sumDest>0?(sumOk?"✅ "+sumDest+"%":"⚠️ "+sumDest+"% — deben sumar 100%"):"Ingresá los porcentajes"}
          </div>
        </div>
        {cadena&&(
          <div style={{...cardS,marginTop:0}}>
            <div style={{fontFamily:"monospace",fontSize:11,color:C.green,marginBottom:10,letterSpacing:1}}>📋 CADENA REPRODUCTIVA</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
              {[["Servicio",cadena.diasServ+" días",C.textDim],
                ["Parto temprano",fmtFecha(cadena.partoTemp),C.green],
                ["Parto tardío",fmtFecha(cadena.partoTard),C.amber],
                ["Días al parto",cadena.diasPartoTemp>0?cadena.diasPartoTemp+"d":"pasado",C.textDim],
              ].map(([l,v,cl])=>(
                <div key={l} style={{background:"rgba(0,0,0,.2)",borderRadius:8,padding:"8px 10px"}}>
                  <div style={{fontFamily:"monospace",fontSize:9,color:C.textDim,marginBottom:2}}>{l}</div>
                  <div style={{fontFamily:"monospace",fontSize:12,color:cl,fontWeight:600}}>{v}</div>
                </div>
              ))}
            </div>
            {(()=>{
              const tc=calcTerneros(form.vacasN,form.prenez,form.pctDestete,form.destTrad,form.destAntic,form.destHiper,cadena);
              if(!tc||!tc.terneros)return null;
              return(
                <div style={{background:"rgba(126,200,80,.06)",border:"1px solid rgba(126,200,80,.15)",borderRadius:10,padding:10}}>
                  <div style={{fontFamily:"monospace",fontSize:10,color:C.green,marginBottom:6}}>🐄 TERNEROS DESTETADOS</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:6}}>
                    <div style={{textAlign:"center",background:"rgba(0,0,0,.2)",borderRadius:8,padding:"8px 4px"}}>
                      <div style={{fontFamily:"monospace",fontSize:9,color:C.textDim}}>Total terneros</div>
                      <div style={{fontFamily:"monospace",fontSize:18,fontWeight:700,color:C.green}}>{tc.terneros}</div>
                    </div>
                    <div style={{textAlign:"center",background:"rgba(0,0,0,.2)",borderRadius:8,padding:"8px 4px"}}>
                      <div style={{fontFamily:"monospace",fontSize:9,color:C.textDim}}>PV pond. mayo</div>
                      <div style={{fontFamily:"monospace",fontSize:18,fontWeight:700,color:C.amber}}>{tc.pvMayoPond} kg</div>
                    </div>
                  </div>
                  {tc.detalle.map(d=>(
                    <div key={d.key} style={{fontFamily:"monospace",fontSize:10,color:C.textDim,marginTop:3}}>
                      {d.label}: <strong style={{color:C.text}}>{d.n} terneros</strong> · dest {d.pvDest}kg → mayo {d.pvMayo}kg
                    </div>
                  ))}
                </div>
              );
            })()}
            {cadena.tipos?.trad?.terneroOtono&&(
              <div style={{marginTop:8,background:"rgba(192,72,32,.08)",border:"1px solid rgba(192,72,32,.3)",borderRadius:8,padding:10,fontFamily:"monospace",fontSize:11,color:C.red}}>
                🚨 VACA TARDÍA con ternero al pie en otoño — considerar destete anticipado o hiperprecoz
              </div>
            )}
          </div>
        )}
      </div>
      );
    }

    // PASO 2 — RODEO GENERAL
    if(step===2)return(
      <div>

        <div style={cardS}>
          <div style={{fontFamily:"monospace",fontSize:13,color:C.green,marginBottom:12,letterSpacing:1}}>🐄 RODEO GENERAL</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            {[["vacasN","N° Vacas","150"],["pvVacaAdulta","PV vaca adulta (kg)","400"]].map(([k,l,p])=>(
              <div key={k}><label style={lbl}>{l}</label><input type="number" inputMode="numeric" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={"Ej: "+p} style={inp}/></div>
            ))}
          </div>
          {cadena&&cadena.diasPartoTemp>0&&(
            <div style={{background:"rgba(126,200,80,.06)",border:`1px solid rgba(126,200,80,.15)`,borderRadius:10,padding:"8px 12px",marginBottom:10,fontFamily:"monospace",fontSize:11,color:C.green}}>
              📅 Días al parto (parto temprano): <strong>{cadena.diasPartoTemp} días</strong>
              {cadena.diasPartoTard>0&&<span style={{color:C.amber}}> · Parto tardío: {cadena.diasPartoTard}d</span>}
            </div>
          )}
          <label style={lbl}>Estado Reproductivo</label>
          <select value={form.eReprod} onChange={e=>set("eReprod",e.target.value)} style={{...inp,marginBottom:10}}>
            <option value="">Seleccionar...</option>{ESTADOS_REPROD.map(e=><option key={e} value={e}>{e}</option>)}
          </select>
          {form.pvVacaAdulta&&form.eReprod&&reqEM(form.pvVacaAdulta,form.eReprod)&&(
            <div style={{background:"rgba(58,143,181,.07)",border:"1px solid rgba(58,143,181,.18)",borderRadius:10,padding:10,fontFamily:"monospace",fontSize:11,color:C.blue,textAlign:"center",marginBottom:10}}>
              Req EM (PV^0.75): <strong>{reqEM(form.pvVacaAdulta,form.eReprod)} Mcal/día</strong>
              <div style={{fontSize:8,color:"rgba(58,143,181,.45)",marginTop:2}}>NASSEM (2010) · Detmann et al. (2014)</div>
            </div>
          )}
          <DistCC label="Distribución CC — Vacas Rodeo" dist={form.ccDist} onChange={setCCD} color={C.green}/>
          {ccParto&&curva&&(
            <div style={{marginTop:12,background:"rgba(0,0,0,.3)",border:`1px solid ${ccC}44`,borderRadius:10,padding:14,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
              {[["CC Parto",ccParto+"/9",ccC],["CC Serv",curva.ccS+"/9",pC],["Preñez Est",curva.pr+"%",pC]].map(([l,v,c])=>(
                <div key={l}><div style={{fontFamily:"monospace",fontSize:9,color:C.textDim,marginBottom:3}}>{l}</div><div style={{fontFamily:"monospace",fontSize:18,fontWeight:700,color:c}}>{v}</div></div>
              ))}
            </div>
          )}
        </div>
        <div style={cardS}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[["torosN","N° Toros","8"],["prenez","Preñez %","85"],["pctDestete","% Destete","75"]].map(([k,l,p])=>(
              <div key={k}><label style={lbl}>{l}</label><input type="number" inputMode="numeric" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={"Ej: "+p} style={inp}/></div>
            ))}
          </div>
        </div>
      </div>
    );

    // PASO 3 — CATEGORÍAS ESPECIALES
    if(step===3)return(
      <div>
        {/* VACA 2°SERV */}
        <div style={{...cardS,border:"1px solid rgba(136,102,204,.25)"}}>
          <div style={{fontFamily:"monospace",fontSize:13,color:C.purple,marginBottom:4,letterSpacing:1}}>⚠️ VACA 2° SERVICIO</div>
          <div style={{fontFamily:"monospace",fontSize:10,color:"rgba(136,102,204,.55)",marginBottom:12}}>Triple demanda: lactando + creciendo + preñar (~20–22 Mcal/día)</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            {[["v2sN","N° Cabezas","30"],["v2sPV","Peso prom (kg)","340"]].map(([k,l,p])=>(
              <div key={k}><label style={lbl}>{l}</label><input type="number" inputMode="numeric" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={"Ej: "+p} style={inp}/></div>
            ))}
          </div>
          <label style={lbl}>¿Ternero al pie?</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
            {[["si","🔴 Sí",C.red],["precoz","⚡ Precoz",C.amber],["no","✅ No",C.green]].map(([v,l,c])=>(
              <button key={v} onClick={()=>set("v2sTernero",v)} style={btnSel(form.v2sTernero===v,c)}>{l}</button>
            ))}
          </div>
          {form.v2sPV&&<div style={{background:"rgba(58,143,181,.07)",border:"1px solid rgba(58,143,181,.18)",borderRadius:10,padding:10,fontFamily:"monospace",fontSize:11,color:C.blue,textAlign:"center",marginBottom:10}}>Req EM 2°serv (PV^0.75): <strong>{reqEM(form.v2sPV,"vaca2serv")} Mcal/día</strong></div>}
          <DistCC label="Distribución CC — 2° Servicio" dist={form.cc2sDist} onChange={setCC2D} color={C.purple}/>
        </div>

        {/* VAQ 1° INV */}
        <div style={{...cardS,border:"1px solid rgba(212,149,42,.25)"}}>
          <div style={{fontFamily:"monospace",fontSize:13,color:C.amber,marginBottom:4,letterSpacing:1}}>🐄 VAQUILLONA 1° INVIERNO</div>
          <div style={{fontFamily:"monospace",fontSize:10,color:"rgba(212,149,42,.55)",marginBottom:12}}>Mayo–agosto · 120 días · Objetivo: 210 kg en septiembre · GDP mín 400 g/d</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><label style={lbl}>N° Cabezas</label><input type="number" inputMode="numeric" value={form.vaq1N} onChange={e=>set("vaq1N",e.target.value)} placeholder="Ej: 40" style={inp}/></div>
            <div><label style={lbl}>N° Cabezas 2°inv</label><input type="number" inputMode="numeric" value={form.vaq2N} onChange={e=>set("vaq2N",e.target.value)} placeholder="Ej: 35" style={inp}/></div>
          </div>
          {(()=>{
            const pvDestUser=parseFloat(form.pvDestVaq)||cadena?.pvDestCalc||0;
            const pvMayoEst=pvDestUser>0&&cadena?Math.round(pvDestUser+0.400*Math.max(0,(cadena.mayo1Inv-cadena.desteTemp)/(1000*60*60*24))):cadena?.pvMayo1InvCalc||0;
            const pvSepEst=pvMayoEst>0?Math.round(pvMayoEst+0.400*120):0;
            const llegaraOk=pvSepEst>=210;
            if(!pvMayoEst&&!pvDestUser)return null;
            return(
              <div style={{background:"rgba(0,0,0,.2)",border:`1px solid ${C.border}`,borderRadius:10,padding:10,marginBottom:10}}>
                <div style={{fontFamily:"monospace",fontSize:9,color:C.textDim,marginBottom:6,letterSpacing:1}}>CADENA DE PESO — VAQ 1° INV</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
                  {[
                    ["Destete",pvDestUser||cadena?.pvDestCalc,"kg",C.textDim],
                    ["Mayo (entrada)",pvMayoEst,"kg",C.amber],
                    ["Sep (400g/d)",pvSepEst||"—","kg",llegaraOk?C.green:C.red],
                    ["Objetivo","210","kg",C.green],
                  ].map(([l,v,u,col])=>(
                    <div key={l} style={{textAlign:"center",background:"rgba(0,0,0,.2)",borderRadius:8,padding:"6px 2px"}}>
                      <div style={{fontFamily:"monospace",fontSize:8,color:C.textDim,marginBottom:2}}>{l}</div>
                      <div style={{fontFamily:"monospace",fontSize:13,fontWeight:700,color:col}}>{v}{v?u:""}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontFamily:"monospace",fontSize:8,color:C.textDim,marginTop:6,textAlign:"center"}}>
                  Lactancia: 700g/d · Post-destete otoñal: 400g/d · 1°inv: 400g/d mínimo
                </div>
                {pvSepEst>0&&!llegaraOk&&<div style={{marginTop:6,color:C.red,fontFamily:"monospace",fontSize:9,textAlign:"center"}}>⚠️ No llega a 210kg en septiembre — revisar suplementación</div>}
              </div>
            );
          })()}
          {vaq1E&&(
            <div style={{background:"rgba(212,149,42,.07)",border:"1px solid rgba(212,149,42,.25)",borderRadius:10,padding:12}}>
              <div style={{fontFamily:"monospace",fontSize:11,color:C.amber,textAlign:"center",marginBottom:8}}>Escenario <strong style={{fontSize:14}}>{vaq1E.esc}</strong> — {vaq1E.desc}</div>
              <div style={{fontFamily:"monospace",fontSize:11,color:C.amber,textAlign:"center",marginBottom:10}}>
                <strong>{vaq1E.prot} kg prot/día{vaq1E.energ>0?` + ${vaq1E.energ} kg maíz/día`:""}</strong> · {vaq1E.freq} · {vaq1E.dias} días
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:8}}>
                {[["GDP necesario",vaq1E.gdpReal+"g/d",vaq1E.gdpReal>=500?C.green:C.amber],["PV sep.",vaq1E.pvSal+"kg",vaq1E.deficit?C.red:C.green],["Obj. mínimo","210 kg",C.green]].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:"center",background:"rgba(0,0,0,.3)",borderRadius:8,padding:"8px 4px"}}>
                    <div style={{fontSize:9,color:C.textDim,marginBottom:2,fontFamily:"monospace"}}>{l}</div>
                    <div style={{fontSize:15,fontWeight:700,color:c,fontFamily:"monospace"}}>{v}</div>
                  </div>
                ))}
              </div>
              {vaq1E.deficit&&<div style={{textAlign:"center",color:C.red,fontFamily:"monospace",fontSize:10,marginBottom:6}}>⚠️ No llega a 210kg — revisar suplementación</div>}
              <div style={{background:"rgba(0,0,0,.2)",borderRadius:8,padding:"8px 12px",fontFamily:"monospace",fontSize:10,color:C.textDim}}>
                Post-invierno (sep→abr, 300g/d): <strong style={{color:C.text}}>{vaq1E.pvAbr2Inv} kg</strong> — ingresa como Vaq 2°inv
              </div>
            </div>
          )}
        </div>

        {/* VAQ 2° INV */}
        <div style={{...cardS,border:"1px solid rgba(58,143,181,.2)"}}>
          <div style={{fontFamily:"monospace",fontSize:13,color:C.blue,marginBottom:4,letterSpacing:1}}>🐄 VAQUILLONA 2° INVIERNO</div>
          <div style={{fontFamily:"monospace",fontSize:10,color:"rgba(58,143,181,.55)",marginBottom:12}}>Mayo–agosto · Entore agosto (24 meses) · PV mín 0.75×adulta · Siempre ganando peso</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><label style={lbl}>N° Cabezas</label><input type="number" inputMode="numeric" value={form.vaq2N} onChange={e=>set("vaq2N",e.target.value)} placeholder="Ej: 35" style={inp}/></div>
            <div>
              <label style={lbl}>PV entrada mayo (kg)</label>
              <input type="number" inputMode="numeric" value={form.vaq2PV||vaq1E?.pvAbr2Inv||""} onChange={e=>set("vaq2PV",e.target.value)} placeholder={vaq1E?.pvAbr2Inv?"Est: "+vaq1E.pvAbr2Inv+"kg":"Ej: 280"} style={inp}/>
              {vaq1E?.pvAbr2Inv&&!form.vaq2PV&&<div style={{fontFamily:"monospace",fontSize:9,color:C.textDim,marginTop:3}}>Proyectado desde 1°inv</div>}
            </div>
          </div>
          {vaq2E&&(
            <div style={{background:"rgba(58,143,181,.07)",border:"1px solid rgba(58,143,181,.25)",borderRadius:10,padding:12}}>
              <div style={{fontFamily:"monospace",fontSize:11,color:C.blue,textAlign:"center",marginBottom:8}}>Escenario <strong style={{fontSize:14}}>{vaq2E.esc}</strong> — {vaq2E.desc}</div>
              <div style={{fontFamily:"monospace",fontSize:11,color:C.blue,textAlign:"center",marginBottom:10}}>
                <strong>{vaq2E.prot} kg prot/día{vaq2E.energ>0?` + ${vaq2E.energ} kg maíz/día`:""}</strong> · {vaq2E.freq}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                {[["GDP",vaq2E.gdpReal+"g/d",vaq2E.gdpReal>=300?C.green:C.amber],["PV entore",vaq2E.pvEntore+"kg",vaq2E.llegas?C.green:C.red],["PV mínimo",vaq2E.pvMinEntore+"kg",C.textDim]].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:"center",background:"rgba(0,0,0,.3)",borderRadius:8,padding:"8px 4px"}}>
                    <div style={{fontSize:9,color:C.textDim,marginBottom:2,fontFamily:"monospace"}}>{l}</div>
                    <div style={{fontSize:15,fontWeight:700,color:c,fontFamily:"monospace"}}>{v}</div>
                  </div>
                ))}
              </div>
              {!vaq2E.llegas&&<div style={{marginTop:8,textAlign:"center",color:C.red,fontFamily:"monospace",fontSize:10}}>⚠️ No alcanza peso mínimo de entore</div>}
              <div style={{marginTop:8,background:"rgba(126,200,80,.06)",borderRadius:8,padding:"6px 10px",fontFamily:"monospace",fontSize:10,color:C.green,textAlign:"center"}}>✅ Siempre ganando peso al entore ({vaq2E.gdpReal}g/d)</div>
            </div>
          )}
        </div>
      </div>
    );

    // PASO 4 — FORRAJE / POTREROS
    if(step===4)return(
      <div>
        {/* POTREROS vs GLOBAL — primero */}
        <div style={cardS}>
          <div style={{fontFamily:"monospace",fontSize:13,color:C.green,marginBottom:10,letterSpacing:1}}>🌿 ESTRUCTURA DEL CAMPO</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            <button onClick={()=>setUsaPotreros(false)} style={btnSel(!usaPotreros)}>📐 Análisis global</button>
            <button onClick={()=>{setUsaPotreros(true);if(!potreros.length)addPotrero();}} style={btnSel(usaPotreros,C.blue)}>🗂 Análisis por potrero</button>
          </div>

          {!usaPotreros&&(
            <div>
              <div style={{fontFamily:"monospace",fontSize:9,color:"rgba(126,200,80,.4)",marginBottom:10}}>Oferta calibrada por tipo de vegetación — Paruelo &amp; Oesterheld (2000)</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><label style={lbl}>Superficie total (ha)</label><input type="number" inputMode="numeric" value={form.supHa} onChange={e=>set("supHa",e.target.value)} placeholder="Ej: 1000" style={inp}/></div>
                <div><label style={lbl}>% Monte</label><input type="number" inputMode="numeric" value={form.pctMonte} min="0" max="100" onChange={e=>set("pctMonte",e.target.value)} placeholder="Ej: 30" style={inp}/></div>
                <div><label style={lbl}>% No ganadero</label><input type="number" inputMode="numeric" value={form.pctNGan} min="0" max="100" onChange={e=>set("pctNGan",e.target.value)} placeholder="Ej: 5" style={inp}/></div>
              </div>
              {form.supHa&&(()=>{const t=parseFloat(form.supHa)||0,m=Math.min(100,parseFloat(form.pctMonte)||0),n=Math.min(100,parseFloat(form.pctNGan)||0),p=Math.max(0,100-m-n);return(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
                  {[["Pastizal",Math.round(t*p/100)+"ha",C.green],["Monte",Math.round(t*m/100)+"ha",C.amber],["No gan.",Math.round(t*n/100)+"ha",C.textDim]].map(([l,v,c])=>(
                    <div key={l} style={{textAlign:"center",background:"rgba(0,0,0,.3)",borderRadius:8,padding:"8px 4px",border:`1px solid ${C.border}`}}>
                      <div style={{fontFamily:"monospace",fontSize:9,color:C.textDim,marginBottom:2}}>{l}</div>
                      <div style={{fontFamily:"monospace",fontSize:13,fontWeight:700,color:c}}>{v}</div>
                    </div>
                  ))}
                </div>
              );})()}
              <label style={lbl}>Tipo de vegetación</label>
              <select value={form.vegetacion} onChange={e=>set("vegetacion",e.target.value)} style={{...inp,marginBottom:6}}>
                <option value="">Seleccionar...</option>
                {Object.keys(PROD_BASE).map(o=><option key={o} value={o}>{o} — {PROD_BASE[o]} kg MS/ha/día</option>)}
              </select>
              {form.vegetacion&&<div style={{fontFamily:"monospace",fontSize:9,color:"rgba(126,200,80,.4)",marginBottom:10}}>Base: {PROD_BASE[form.vegetacion]} kg MS/ha/día · ~{Math.round(PROD_BASE[form.vegetacion]*365*UTIL)} kg MS/ha/año efectivos</div>}
              <label style={lbl}>Estado fenológico HOY</label>
              <div style={{fontFamily:"monospace",fontSize:9,color:"rgba(126,200,80,.4)",marginBottom:8}}>Dato primario de calidad. NDVI proyecta hacia adelante.</div>
              {FENOLOGIAS.map(f=>(
                <button key={f.val} onClick={()=>set("fenologia",f.val)} style={{...btnSel(form.fenologia===f.val),marginBottom:6,display:"flex",alignItems:"center",gap:10,textAlign:"left",padding:"12px 14px"}}>
                  <span style={{fontSize:20}}>{f.emoji}</span>
                  <div>
                    <div style={{fontFamily:"monospace",fontSize:12,fontWeight:700}}>{f.label}</div>
                    <div style={{fontFamily:"monospace",fontSize:9,marginTop:1,opacity:.8}}>{f.desc}</div>
                    {f.warn&&<div style={{fontFamily:"monospace",fontSize:9,color:C.red,marginTop:1}}>{f.warn}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {usaPotreros&&(
            <div>
              <div style={{fontFamily:"monospace",fontSize:9,color:"rgba(58,143,181,.5)",marginBottom:12}}>Oferta calculada individualmente por potrero según vegetación + NDVI + temperatura</div>
              {potreros.map((pot,i)=>(
                <div key={i} style={{background:"rgba(0,0,0,.25)",border:`1px solid ${C.border}`,borderRadius:12,padding:12,marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{fontFamily:"monospace",fontSize:11,color:C.blue,fontWeight:600}}>POTRERO {i+1}</div>
                    <button onClick={()=>delPotrero(i)} style={{background:"transparent",border:"none",color:C.red,cursor:"pointer",fontSize:16,padding:"0 4px"}}>✕</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                    <div><label style={lbl}>Superficie (ha)</label><input type="number" inputMode="numeric" value={pot.ha} onChange={e=>updPotrero(i,"ha",e.target.value)} placeholder="Ej: 200" style={inp}/></div>
                    <div>
                      <label style={lbl}>Tipo vegetación</label>
                      <select value={pot.veg} onChange={e=>updPotrero(i,"veg",e.target.value)} style={inp}>
                        {Object.keys(PROD_BASE).map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <label style={lbl}>Estado fenológico</label>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
                    {FENOLOGIAS.map(f=>(
                      <button key={f.val} onClick={()=>updPotrero(i,"fenol",f.val)} style={{...btnSel(pot.fenol===f.val),padding:"8px 4px",fontSize:10}}>{f.emoji} {f.label.split("%")[0]}%</button>
                    ))}
                  </div>
                  {pot.ha&&pot.veg&&<div style={{marginTop:8,fontFamily:"monospace",fontSize:9,color:C.textDim}}>
                    Base: {PROD_BASE[pot.veg]||8} kg MS/ha/día · {pot.ha}ha → ~{Math.round((PROD_BASE[pot.veg]||8)*parseFloat(pot.ha)*UTIL)} kg MS/día efectivos
                  </div>}
                </div>
              ))}
              <button onClick={addPotrero} style={{width:"100%",background:"rgba(58,143,181,.08)",border:"1px solid rgba(58,143,181,.25)",borderRadius:12,color:C.blue,padding:"14px",fontFamily:"monospace",fontSize:13,cursor:"pointer",marginBottom:10}}>+ Agregar potrero</button>
              {potreros.length>0&&<div style={{fontFamily:"monospace",fontSize:10,color:C.textDim,textAlign:"right"}}>
                Total: <strong style={{color:C.green}}>{potreros.reduce((s,p)=>s+(parseFloat(p.ha)||0),0)} ha</strong>
              </div>}
            </div>
          )}

          <div style={{marginTop:12}}>
            <label style={lbl}>Suplementación actual</label>
            <select value={form.suplem} onChange={e=>set("suplem",e.target.value)} style={inp}>
              <option value="">Sin suplementar</option>
              {["Expeller proteico","Grano energético","Semilla de algodón","Mixtura E+P","Núcleo mineral"].map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div style={cardS}>
          <div style={{fontFamily:"monospace",fontSize:13,color:C.green,marginBottom:10,letterSpacing:1}}>💬 CONSULTA</div>
          <textarea value={form.consulta} onChange={e=>set("consulta",e.target.value)} placeholder="Describí la situación o pregunta puntual (opcional)..." rows={4} style={{...inp,resize:"vertical",lineHeight:1.6}}/>
        </div>
      </div>
    );

    // PASO 5 — ANALIZAR
    if(step===5)return(
      <div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {[
            ["📍 Zona",form.zona+(form.provincia?" · "+form.provincia:""),C.green],
            ["📅 Servicio",cadena?`${fmtFecha(cadena.ini).slice(0,6)} → ${fmtFecha(cadena.fin).slice(0,6)}`:"—",C.amber],
            ["🌡️ Temp / NDVI",sat?(sat.tMin+"–"+sat.tMax+"°C · "+sat.ndvi):"—",C.amber],
            ["⚡ Disparador",dispar?(dispar.dias<999?"~"+dispar.dias+"d":"-"):"—",dC],
            ["🐄 CC Parto",ccParto?(ccParto+"/9"):"—",ccC],
            ["📊 Preñez Est.",curva?(curva.pr+"%"):"—",pC],
            ["🌾 Vaq1°inv",vaq1E?("Esc "+vaq1E.esc+" · "+vaq1E.pvSal+"kg sep"):"—",vaq1E?.deficit?C.red:vaq1E?.esc==="C"?C.amber:C.green],
            ["🐄 Vaq2°inv",vaq2E?(vaq2E.pvEntore+"kg entore"+(vaq2E.llegas?" ✅":" ⚠️")):"—",vaq2E?.llegas?C.green:C.red],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"10px 12px"}}>
              <div style={{fontFamily:"monospace",fontSize:9,color:C.textDim,marginBottom:3}}>{l}</div>
              <div style={{fontFamily:"monospace",fontSize:11,color:c,fontWeight:600,lineHeight:1.3}}>{v||"—"}</div>
            </div>
          ))}
        </div>
        {cadena?.terneroOtono&&(
          <div style={{background:"rgba(192,72,32,.08)",border:"1px solid rgba(192,72,32,.3)",borderRadius:12,padding:12,marginBottom:14,fontFamily:"monospace",fontSize:11,color:C.red,textAlign:"center"}}>
            🚨 Vaca tardía detectada — ternero al pie en otoño. El informe incluirá alerta específica.
          </div>
        )}
        <button onClick={runAnalysis} disabled={loading} style={{width:"100%",background:loading?"#2a3a1a":C.green,color:"#050d02",border:"none",borderRadius:14,padding:"20px",fontFamily:"monospace",fontSize:18,fontWeight:700,cursor:loading?"not-allowed":"pointer",marginBottom:14,letterSpacing:2}}>
          {loading?"⏳ PROCESANDO...":"⚡ GENERAR INFORME"}
        </button>
        {loading&&<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,marginBottom:14}}>
          <div style={{height:3,background:"rgba(126,200,80,.08)",borderRadius:2,overflow:"hidden",position:"relative",marginBottom:8}}>
            <div style={{position:"absolute",top:0,left:0,width:"40%",height:"100%",background:C.green,borderRadius:2,animation:"scan 1.2s ease-in-out infinite"}}/>
          </div>
          <div style={{fontFamily:"monospace",fontSize:10,color:C.textDim,textAlign:"center"}}>{loadMsg}</div>
        </div>}
        {result&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontFamily:"monospace",fontSize:11,color:C.green,letterSpacing:2}}>INFORME TÉCNICO</div>
              <button onClick={()=>navigator.clipboard?.writeText(result)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,color:C.green,padding:"6px 12px",fontFamily:"monospace",fontSize:10,cursor:"pointer"}}>COPIAR</button>
            </div>
            <RenderInforme text={result} form={form} sat={sat} dispar={dispar} vaq1E={vaq1E} vaq2E={vaq2E} ccParto={ccParto} curva={curva} cadena={cadena} potreros={usaPotreros?potreros:[]}/>
            {form.nombreProductor&&<div style={{fontFamily:"monospace",fontSize:10,color:C.textDim,textAlign:"center",marginTop:4}}>✅ Guardado: {form.nombreProductor}</div>}
          </div>
        )}
      </div>
    );
  };

  // PLANILLA
  const renderPlanilla=()=>(
    <div style={cardS}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:8}}>
        <span style={{fontFamily:"monospace",fontSize:13,color:C.green}}>📋 {productores.length} productor{productores.length!==1?"es":""}</span>
        <div style={{display:"flex",gap:8}}>
          <button onClick={exportCSV} style={{background:"rgba(58,143,181,.08)",border:"1px solid rgba(58,143,181,.25)",borderRadius:8,color:C.blue,padding:"8px 14px",fontFamily:"monospace",fontSize:11,cursor:"pointer"}}>⬇ CSV</button>
          <button onClick={()=>{if(confirm("¿Borrar todos?")){setProductores([]);localStorage.removeItem("agm_prod");}}} style={{background:"rgba(192,72,32,.08)",border:"1px solid rgba(192,72,32,.25)",borderRadius:8,color:C.red,padding:"8px 14px",fontFamily:"monospace",fontSize:11,cursor:"pointer"}}>🗑</button>
        </div>
      </div>
      {productores.length===0?<div style={{textAlign:"center",padding:30,fontFamily:"monospace",fontSize:12,color:C.textFaint}}>Sin registros aún.</div>:(
        productores.map((p,i)=>(
          <div key={i} style={{background:"rgba(0,0,0,.2)",border:`1px solid ${C.border}`,borderRadius:12,padding:12,marginBottom:8,cursor:"pointer"}} onClick={()=>{setForm(f=>({...f,...p}));setTab("analisis");setStep(5);}}>
            <div style={{fontFamily:"monospace",fontSize:13,color:C.green,marginBottom:4}}>{p.nombre}</div>
            <div style={{fontFamily:"monospace",fontSize:10,color:C.textDim,display:"flex",gap:10,flexWrap:"wrap"}}>
              <span>{p.fecha_consulta}</span><span>{p.zona_productiva}</span>
              <span>CC:{p.ccPonderada}/9</span>
              <span style={{color:parseFloat(p.prenezEst)>=75?C.green:parseFloat(p.prenezEst)>=55?C.amber:C.red}}>{p.prenezEst?p.prenezEst+"%":"—"}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // RENDER PRINCIPAL
  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"Georgia,serif",maxWidth:480,margin:"0 auto"}}>
      <div style={{padding:"0 16px 100px"}}>
        {/* HEADER */}
        <div style={{paddingTop:18,paddingBottom:14,marginBottom:4,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:38,height:38,background:`linear-gradient(145deg,${C.green},#a3d96e)`,clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🐄</div>
            <div>
              <div style={{fontSize:22,color:C.green,letterSpacing:3,lineHeight:1,fontFamily:"monospace"}}>AgroMind Pro</div>
              <div style={{fontFamily:"monospace",fontSize:9,color:C.textDim,letterSpacing:2}}>SISTEMA EXPERTO · CRÍA BOVINA · v8</div>
            </div>
          </div>
          <div style={{fontFamily:"monospace",fontSize:9,color:C.green,background:"rgba(126,200,80,.04)",border:`1px solid rgba(126,200,80,.18)`,borderRadius:6,padding:"4px 8px"}}>● ACTIVO</div>
        </div>
        {/* TABS */}
        <div style={{display:"flex",borderBottom:`1px solid ${C.border}`,marginBottom:16}}>
          {[["analisis","⚡ Análisis"],["planilla","📋 Datos"],["marco","🧠 Marco"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,background:"transparent",border:"none",borderBottom:tab===id?`2px solid ${C.green}`:"2px solid transparent",color:tab===id?C.green:C.textDim,fontFamily:"monospace",fontSize:11,letterSpacing:1,textTransform:"uppercase",padding:"10px 4px",cursor:"pointer",marginBottom:-1}}>{label}</button>
          ))}
        </div>

        {tab==="analisis"&&(
          <div>
            {/* PROGRESO */}
            <div style={{display:"flex",gap:3,marginBottom:16}}>
              {PASOS.map((p,i)=>(
                <button key={i} onClick={()=>setStep(i)} style={{flex:1,background:i===step?"rgba(126,200,80,.12)":i<step?"rgba(126,200,80,.06)":"transparent",border:`1px solid ${i===step?C.borderAct:i<step?"rgba(126,200,80,.12)":C.border}`,borderRadius:8,color:i===step?C.green:i<step?"rgba(126,200,80,.5)":C.textFaint,fontFamily:"monospace",fontSize:8,padding:"7px 2px",cursor:"pointer",textAlign:"center",lineHeight:1.3}}>
                  {p.split(" ")[0]}<br/><span style={{fontSize:7}}>{p.split(" ").slice(1).join(" ")}</span>
                </button>
              ))}
            </div>
            <div style={{fontFamily:"monospace",fontSize:13,color:C.green,marginBottom:14,letterSpacing:1}}>{PASOS[step]}</div>
            {renderPaso()}
            <div style={{display:"flex",gap:10,marginTop:16}}>
              {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,borderRadius:12,color:C.green,padding:"16px",fontFamily:"monospace",fontSize:14,cursor:"pointer"}}>← Anterior</button>}
              {step<5&&<button onClick={()=>setStep(s=>s+1)} style={{flex:2,background:C.green,color:"#050d02",border:"none",borderRadius:12,padding:"16px",fontFamily:"monospace",fontSize:14,fontWeight:700,cursor:"pointer"}}>Siguiente →</button>}
            </div>
          </div>
        )}
        {tab==="planilla"&&renderPlanilla()}
        {tab==="marco"&&(
          <div>
            {[
              ["📅 Cadena reproductiva",C.amber,"rgba(212,149,42,.25)","La fecha de servicio determina todo: parto, destete, CC disponible para recuperación y estado de la vaquillona en cada etapa. Vaca preñada al final del servicio → parto tardío → riesgo ternero en otoño.","Peruchena INTA (2003)"],
              ["🌡️ Disparador <15°C",C.red,"rgba(192,72,32,.2)","Para C4, temperatura <15°C es el disparador principal. Crecimiento y calidad caen abruptamente. La recuperación CC solo es válida antes de este umbral.","Peruchena INTA (2003)"],
              ["🛰 NDVI",C.green,"rgba(126,200,80,.15)","NDVI = proxy actividad fotosintética estimada. Relación lineal NDVI–PPNA con r²=0.71. La fenología de campo es el dato primario de calidad HOY. NDVI proyecta hacia adelante.","Paruelo & Oesterheld (2000) Applied Vegetation Science"],
              ["🌾 Modelo oferta",C.green,"rgba(126,200,80,.15)","Pastizal natural NEA: 8 kg MS/ha/día base. Megatérmicas C4: 14 kg MS/ha/día. Monte: máx 200 kg MS/ha/año. Eficiencia cosecha extensiva: 0.40.","Paruelo & Oesterheld (2000) · Peruchena INTA (2003) · UF/IFAS Sollenberger (2000) · Oesterheld et al. (1998)"],
              ["🐄 Vaquillona — cadena de inviernos",C.amber,"rgba(212,149,42,.2)","1°inv (mayo-ago): objetivo 210kg en septiembre, GDP mín 400g/d. Post-inv (sep-abr): 300g/d, campo cubre. 2°inv (mayo-ago): GDP mín 300g/d, siempre ganando, entore agosto a 24 meses.","NASSEM (2010) · Balbuena INTA (2003)"],
              ["📊 Requerimientos",C.textDim,"rgba(126,200,80,.06)","PV^0.75 × 0.077 × factor categoría (Mcal EM/día). Curva CC→preñez: 5.5→75% | 5.0→55% | 4.5→35%.","NASSEM (2010) · Detmann et al. (2014) · Peruchena INTA (2003)"],
            ].map(([t,c,b,d,ref])=>(
              <div key={t} style={{background:C.card,border:`1px solid ${b}`,borderRadius:14,padding:14,marginBottom:10}}>
                <div style={{fontFamily:"monospace",fontSize:12,color:c,marginBottom:6,letterSpacing:1}}>{t}</div>
                <div style={{fontSize:13,color:C.textDim,lineHeight:1.7,marginBottom:6}}>{d}</div>
                <div style={{fontFamily:"monospace",fontSize:9,color:C.textFaint,borderTop:`1px solid ${C.border}`,paddingTop:6}}>{ref}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.bg,borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100}}>
        {[["analisis","⚡","Análisis"],["planilla","📋","Datos"],["marco","🧠","Marco"]].map(([id,ic,lb])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,background:"transparent",border:"none",color:tab===id?C.green:C.textFaint,padding:"12px 4px 16px",fontFamily:"monospace",fontSize:10,cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:2}}>{ic}</div>{lb}
          </button>
        ))}
      </div>
      <style>{`@keyframes scan{0%{left:-40%}100%{left:110%}} select option{background:#141f11} *{box-sizing:border-box} input[type=number]{-moz-appearance:textfield} input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none} input:focus,select:focus,textarea:focus{border-color:rgba(126,200,80,.45)!important;box-shadow:0 0 0 3px rgba(126,200,80,.08)}`}</style>
    </div>
  );
}
