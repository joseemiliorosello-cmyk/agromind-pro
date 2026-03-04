import { useState, useEffect } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

// ═══════════════════════════════════════
// DATOS BASE — CLIMA HISTÓRICO + HELADAS
// ═══════════════════════════════════════
const HELADAS_PROV={"Formosa":{dia:15,mes:5},"Chaco":{dia:1,mes:5},"Corrientes":{dia:1,mes:5},"Misiones":{dia:20,mes:4},"Entre Ríos":{dia:10,mes:4},"Santa Fe":{dia:10,mes:4},"Santiago del Estero":{dia:25,mes:4},"Salta":{dia:15,mes:5},"Buenos Aires":{dia:15,mes:4},"Córdoba":{dia:10,mes:4},"La Pampa":{dia:20,mes:3},"Mendoza":{dia:1,mes:4},"Neuquén":{dia:1,mes:3},"Río Negro":{dia:20,mes:2}};
const CLIMA_HIST={"Corrientes":[{t:28,p:130},{t:27,p:120},{t:25,p:110},{t:20,p:90},{t:16,p:70},{t:13,p:60},{t:13,p:55},{t:15,p:50},{t:18,p:80},{t:22,p:110},{t:25,p:120},{t:27,p:130}],"Chaco":[{t:29,p:120},{t:28,p:110},{t:26,p:110},{t:21,p:80},{t:16,p:60},{t:13,p:50},{t:13,p:45},{t:15,p:45},{t:19,p:70},{t:23,p:100},{t:26,p:110},{t:28,p:120}],"Formosa":[{t:30,p:120},{t:29,p:110},{t:27,p:110},{t:22,p:80},{t:17,p:55},{t:14,p:45},{t:14,p:40},{t:16,p:45},{t:20,p:70},{t:24,p:100},{t:27,p:110},{t:29,p:120}],"Misiones":[{t:26,p:170},{t:26,p:160},{t:24,p:150},{t:19,p:130},{t:15,p:110},{t:13,p:90},{t:13,p:90},{t:14,p:100},{t:17,p:120},{t:21,p:150},{t:23,p:160},{t:25,p:170}],"Entre Ríos":[{t:25,p:100},{t:24,p:90},{t:22,p:90},{t:17,p:70},{t:13,p:55},{t:10,p:45},{t:10,p:40},{t:12,p:45},{t:15,p:65},{t:19,p:90},{t:22,p:100},{t:24,p:100}],"Santiago del Estero":[{t:28,p:90},{t:27,p:80},{t:25,p:80},{t:20,p:50},{t:15,p:30},{t:12,p:20},{t:12,p:15},{t:14,p:20},{t:18,p:40},{t:22,p:70},{t:25,p:80},{t:27,p:90}],"Salta":[{t:24,p:140},{t:23,p:130},{t:22,p:110},{t:17,p:50},{t:13,p:20},{t:10,p:10},{t:10,p:10},{t:12,p:15},{t:16,p:30},{t:20,p:70},{t:22,p:110},{t:23,p:130}],"Buenos Aires":[{t:24,p:90},{t:23,p:80},{t:21,p:90},{t:16,p:70},{t:12,p:55},{t:9,p:45},{t:9,p:40},{t:11,p:50},{t:13,p:65},{t:17,p:85},{t:20,p:90},{t:23,p:90}],"Córdoba":[{t:25,p:100},{t:24,p:90},{t:22,p:90},{t:17,p:60},{t:13,p:35},{t:10,p:25},{t:10,p:20},{t:12,p:25},{t:15,p:45},{t:19,p:75},{t:22,p:90},{t:24,p:100}],"Santa Fe":[{t:26,p:110},{t:25,p:100},{t:23,p:100},{t:18,p:70},{t:14,p:50},{t:11,p:40},{t:11,p:35},{t:13,p:40},{t:16,p:60},{t:20,p:90},{t:23,p:100},{t:25,p:110}]};
const CLIMA_DEF=[{t:27,p:120},{t:26,p:110},{t:24,p:100},{t:20,p:80},{t:15,p:60},{t:12,p:50},{t:12,p:45},{t:14,p:50},{t:18,p:70},{t:22,p:95},{t:25,p:110},{t:26,p:120}];
const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_C=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const FENOLOGIAS=[{val:"menor_10",label:"<10% Floración",emoji:"🟢",desc:"PB >10% · Dig >65%",warn:""},{val:"10_25",label:"10–25% Floración",emoji:"🟡",desc:"PB 7–10% · Dig 60–65%",warn:""},{val:"25_50",label:"25–50% Floración",emoji:"🟠",desc:"PB 5–7% · Lignificación",warn:"⚠ Déficit proteico"},{val:"mayor_50",label:">50% Floración",emoji:"🔴",desc:"PB <5% · Lignif. avanzada",warn:"🔴 Déficit severo"}];
const ESTADOS_REPROD=["Gestación temprana (1–4 meses)","Gestación media (5–7 meses)","Preparto (último mes)","Lactación con ternero al pie","Vaca seca sin ternero"];
const DISCLAIMER="Las recomendaciones generadas por AgroMind Pro tienen carácter orientativo y se basan en los datos ingresados y parámetros técnicos de referencia. No reemplazan el criterio profesional del ingeniero agrónomo o médico veterinario que asiste al establecimiento, quien deberá validar, ajustar e implementar cualquier decisión de manejo según las condiciones particulares de cada sistema productivo.";

// ═══════════════════════════════════════
// FUNCIONES TÉCNICAS
// ═══════════════════════════════════════
function getClima(prov){return CLIMA_HIST[prov]||CLIMA_DEF;}
function factorT(t){return t>=25?1.0:t>=20?0.80:t>=15?0.45:t>=10?0.15:0.05;}
function factorP(p){return p>=100?1.0:p>=50?0.85:p>=20?0.60:0.30;}
function factorN(ndvi){return 0.6+parseFloat(ndvi||0.45)*0.8;}
function mcalKg(t){return t>=25?2.10:t>=20?1.90:t>=15?1.50:t>=10?1.00:0.65;}
function modENSO(e){return e==="nino"?1.25:e==="nina"?0.75:1.0;}
function fechaHelada(prov,ndvi){const h=HELADAS_PROV[prov];if(!h)return null;const n=parseFloat(ndvi)||0.45;const aj=n>0.55?7:n<0.35?-7:0;const hoy=new Date();const f=new Date(hoy.getFullYear(),h.mes,h.dia);f.setDate(f.getDate()+aj);if(f<hoy)f.setFullYear(hoy.getFullYear()+1);return f;}
function diasHelada(prov,ndvi){const f=fechaHelada(prov,ndvi);if(!f)return 999;return Math.max(0,Math.round((f-new Date())/(1000*60*60*24)));}
function mesBajo15(prov){const c=getClima(prov);for(let i=0;i<12;i++)if(c[i].t<15)return i;return 5;}
function calcDisp(prov,ndvi,bal,sat){const n=parseFloat(ndvi)||0.45,b=parseFloat(bal)||0,dh=diasHelada(prov,ndvi);const mc=new Date().getMonth();const hist=getClima(prov);const tA=sat?parseFloat(sat.temp):hist[mc]?.t||20;let dT=999;if(tA<15)dT=0;else{for(let i=1;i<=6;i++){const mi=(mc+i)%12;if(hist[mi].t<15){dT=i*30;break;}}}let dS=999;if(n<0.35||b<-40)dS=0;else if(n<0.40||b<-20)dS=7;const dias=Math.min(dh,dS,dT);const tipo=dT<=dS&&dT<=dh?"Temp <15°C":dS<=dh?"Sequía":"Helada";return{tipo,dias,fHelada:fechaHelada(prov,ndvi),mb15:mesBajo15(prov)};}
function tasaPD(ndvi,tern){const n=parseFloat(ndvi)||0.45;const b=n>0.40?0.004:n>0.30?0.007:n>0.20?0.010:0.014;return tern?b+0.006:b;}
function escVaq1(ndvi,bal,pv){const n=parseFloat(ndvi)||0.45,b=parseFloat(bal)||0,p=parseFloat(pv)||180;if(n>=0.40&&b>-20)return{esc:"A",prot:+(p*0.004).toFixed(2),energ:0,freq:"3×/sem",desc:"Proteico 0.4% PV"};if(n>=0.30||b>=-40)return{esc:"B",prot:+(p*0.007).toFixed(2),energ:0,freq:"diario",desc:"Proteico 0.7% PV"};return{esc:"C",prot:+(p*0.0065).toFixed(2),energ:+(p*0.0035).toFixed(2),freq:"diario",desc:"0.65% prot+0.35% maíz"};}
function reqEM(pv,cat){const p=parseFloat(pv)||0;if(!p)return null;const pm=Math.pow(p,0.75);const f={"Gestación temprana (1–4 meses)":1.15,"Gestación media (5–7 meses)":1.20,"Preparto (último mes)":1.35,"Lactación con ternero al pie":1.90,"Vaca seca sin ternero":1.00,"vaca2serv":2.00,"vaq1inv":1.30,"vaq2inv":1.20}[cat]||1.10;return+(pm*0.077*f).toFixed(1);}
const CC_PR=[{ccP:6.5,ccS:5.0,pr:95},{ccP:6.0,ccS:4.5,pr:88},{ccP:5.5,ccS:4.0,pr:75},{ccP:5.0,ccS:3.5,pr:55},{ccP:4.5,ccS:3.0,pr:35},{ccP:4.0,ccS:2.5,pr:15},{ccP:3.5,ccS:2.0,pr:5}];
function interpCC(ccP){const t=CC_PR;if(ccP>=t[0].ccP)return{ccS:t[0].ccS,pr:t[0].pr};if(ccP<=t[t.length-1].ccP)return{ccS:t[t.length-1].ccS,pr:t[t.length-1].pr};for(let i=0;i<t.length-1;i++){if(ccP<=t[i].ccP&&ccP>=t[i+1].ccP){const r=(ccP-t[i+1].ccP)/(t[i].ccP-t[i+1].ccP);return{ccS:+(t[i+1].ccS+r*(t[i].ccS-t[i+1].ccS)).toFixed(1),pr:Math.round(t[i+1].pr+r*(t[i].pr-t[i+1].pr))};}}return{ccS:2.5,pr:15};}
function ccPond(dist){let tot=0,sum=0;(dist||[]).forEach(d=>{const p=parseFloat(d.pct)||0,c=parseFloat(d.cc)||0;sum+=p*c;tot+=p;});return tot>0?sum/tot:0;}
function calcCCParto(dist,diasP,estD,pastoCal,diasD,ndvi,prov){const cc=ccPond(dist);if(!cc||!diasP)return null;const dp=parseInt(diasP),dd=parseInt(diasD)||0;const tR={excelente:0.022,bueno:0.016,regular:0.009,malo:0.004}[pastoCal]||0.013;const dDisp=diasHelada(prov,ndvi);const tP=tasaPD(ndvi,false);if(estD==="no_ternero"){const dT=Math.min(dd>0?dd:dp,dp);const ccPD=Math.max(1,cc-0.010*dT);const dR=dp-dT;const dB=Math.min(dR,Math.max(0,dDisp-dT));const ccPH=Math.min(9,ccPD+tR*dB);return parseFloat(Math.max(1,ccPH-tP*Math.max(0,dR-dB)).toFixed(2));}if(["ok_feb","ok_mar","precoz","tard_abr"].includes(estD)){const dB=Math.min(dp,dDisp);const ccPH=Math.min(9,cc+tR*dB);return parseFloat(Math.max(1,ccPH-tP*Math.max(0,dp-dDisp)).toFixed(2));}return cc;}
function dZona(lat,lon){if(lat>-24)return"NEA";if(lat>-28&&lon>-58)return"NEA";if(lat>-30&&lon<-64)return"NOA";if(lat>-38&&lat<=-30&&lon>-62)return"Pampa Húmeda";if(lat>-38&&lat<=-30&&lon<=-62&&lon>-67)return"Semiárido";if(lon<-67&&lat>-35)return"Cuyo";if(lat<=-38)return"Patagonia";return"Pampa Húmeda";}
function dProv(lat,lon){if(lat>-22&&lon>-60)return"Formosa";if(lat>-22&&lon<=-60)return"Salta";if(lat>-24&&lat<=-22&&lon>-58)return"Chaco";if(lat>-28&&lat<=-24&&lon>-57)return"Corrientes";if(lat>-30&&lat<=-28&&lon>-57)return"Misiones";if(lat>-30&&lat<=-28&&lon<=-57&&lon>-59)return"Corrientes";if(lat>-32&&lat<=-30&&lon>-58)return"Entre Ríos";return"";}

// ═══════════════════════════════════════
// GRÁFICO BALANCE ENERGÉTICO
// ═══════════════════════════════════════
function GraficoBalance({form,sat,dispar,vaq1E}){
  const mc=new Date().getMonth();
  const supHa=parseFloat(form.supHa)||100;
  const enso=form.enso||"neutro";
  const prov=form.provincia||"Corrientes";
  const ndvi=sat?.ndvi||"0.45";
  const hist=getClima(prov);
  const mesD=form.estadoDestete==="ok_feb"?1:form.estadoDestete==="ok_mar"?2:form.estadoDestete==="tard_abr"?3:mc;
  const diasP=parseInt(form.diasParto)||90;
  const mesP=Math.min(11,(mesD+Math.round(diasP/30))%12);
  const mb15=dispar?.mb15||4;
  const tR={excelente:0.022,bueno:0.016,regular:0.009,malo:0.004}[form.pastoCal]||0.013;

  const datos=MESES_C.map((mes,i)=>{
    const h=i===mc&&sat?{t:parseFloat(sat.temp)||hist[i].t,p:parseFloat(sat.p30)||hist[i].p}:hist[i];
    const ndviI=i===mc?parseFloat(ndvi):0.45;
    const prod=35*factorT(h.t)*factorP(h.p*(i===mc?1:modENSO(enso)))*factorN(ndviI)*modENSO(i===mc?enso:enso);
    const ofPasto=Math.round(Math.max(0,prod)*mcalKg(h.t)*supHa);
    const bajo15=h.t<15;

    const vN=parseInt(form.vacasN)||0;
    const v2N=parseInt(form.v2sN)||0;
    const q1N=parseInt(form.vaq1N)||0;
    const q2N=parseInt(form.vaq2N)||0;

    const eRep=i>=mesP&&i<mesP+2?"Preparto (último mes)":i>=mesP+2&&i<mesP+5?"Lactación con ternero al pie":"Gestación media (5–7 meses)";
    const dVacas=vN>0?Math.round((reqEM(form.pVacas,eRep)||13)*vN):0;
    const dV2s=v2N>0?Math.round((reqEM(form.v2sPV,"vaca2serv")||18)*v2N):0;
    const dQ1=q1N>0&&i>=mesD?Math.round((reqEM(form.vaq1PV,"vaq1inv")||12)*q1N):0;
    const dQ2=q2N>0?Math.round((reqEM(form.vaq2PV,"vaq2inv")||10)*q2N):0;
    const demanda=dVacas+dV2s+dQ1+dQ2;

    let ccEndog=0;
    if(vN>0){
      if(i>=mesD&&i<mb15)ccEndog=Math.round(tR*60*vN*0.5);
      else if(i>=mesP&&i<mesP+3)ccEndog=-Math.round(1.5*vN*0.5);
    }
    const ofTotal=ofPasto+Math.max(0,ccEndog);
    const deficit=Math.max(0,demanda-ofTotal);

    return{mes,i,dVacas,dV2s,dQ1,dQ2,demanda,ofPasto,ccEndog,ofTotal,deficit,bajo15,esActual:i===mc,temp:h.t};
  });

  const defMeses=datos.filter(d=>d.deficit>0);

  return(
    <div>
      <div style={{fontFamily:"monospace",fontSize:13,color:"#7ec850",marginBottom:6,letterSpacing:2}}>📊 BALANCE ENERGÉTICO ANUAL</div>
      <div style={{fontFamily:"monospace",fontSize:10,color:"#7a9668",marginBottom:12,display:"flex",gap:12,flexWrap:"wrap"}}>
        <span>{supHa}ha · {(parseInt(form.vacasN)||0)+(parseInt(form.v2sN)||0)+(parseInt(form.vaq1N)||0)+(parseInt(form.vaq2N)||0)} cab</span>
        <span style={{color:enso==="nino"?"#3a8fb5":enso==="nina"?"#c04820":"#7a9668"}}>{enso==="nino"?"🌊 El Niño +25%":enso==="nina"?"🔴 La Niña −25%":"⚪ ENSO Neutro"}</span>
        <span style={{color:"#d4952a"}}>NDVI = actividad fotosintética estimada</span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={datos} margin={{top:8,right:8,left:0,bottom:4}}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(126,200,80,.07)"/>
          <XAxis dataKey="mes" tick={{fontFamily:"monospace",fontSize:9,fill:"#7a9668"}}/>
          <YAxis tick={{fontFamily:"monospace",fontSize:9,fill:"#7a9668"}} width={50}/>
          <Tooltip contentStyle={{background:"#141a09",border:"1px solid rgba(126,200,80,.2)",fontFamily:"monospace",fontSize:10}} formatter={(v,n)=>[Math.round(v).toLocaleString()+" Mcal/d",n]}/>
          <Legend wrapperStyle={{fontFamily:"monospace",fontSize:9,paddingTop:4}}/>
          <Bar dataKey="dVacas" name="Vacas" stackId="d" fill="rgba(126,200,80,.7)"/>
          <Bar dataKey="dV2s" name="2°Serv" stackId="d" fill="rgba(136,102,204,.7)"/>
          <Bar dataKey="dQ1" name="Vaq1°inv" stackId="d" fill="rgba(212,149,42,.8)"/>
          <Bar dataKey="dQ2" name="Vaq2°inv" stackId="d" fill="rgba(58,143,181,.7)"/>
          <Bar dataKey="deficit" name="Déficit" stackId="def" fill="rgba(192,72,32,.4)" radius={[3,3,0,0]}/>
          <Line type="monotone" dataKey="ofPasto" name="Oferta pasto" stroke="#7ec850" strokeWidth={2.5} dot={{r:2,fill:"#7ec850"}}/>
          <Line type="monotone" dataKey="ofTotal" name="Oferta total" stroke="#a3d96e" strokeWidth={1.5} dot={false} strokeDasharray="4 3"/>
        </ComposedChart>
      </ResponsiveContainer>

      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:8}}>
        {datos.map((d,i)=>(
          <div key={i} style={{fontFamily:"monospace",fontSize:9,textAlign:"center",padding:"2px 5px",borderRadius:3,background:d.bajo15?"rgba(192,72,32,.15)":d.esActual?"rgba(126,200,80,.15)":"transparent",border:d.bajo15?"1px solid rgba(192,72,32,.3)":d.esActual?"1px solid rgba(126,200,80,.3)":"1px solid transparent",color:d.bajo15?"#c04820":d.esActual?"#7ec850":"#7a9668"}}>
            {d.mes}<br/>{d.temp}°
          </div>
        ))}
      </div>
      <div style={{fontFamily:"monospace",fontSize:9,color:"#7a9668",marginTop:4,marginBottom:12,display:"flex",gap:10,flexWrap:"wrap"}}>
        <span style={{color:"#c04820"}}>🔴 &lt;15°C — C4 frena</span>
        <span style={{color:"#7ec850"}}>● Mes actual</span>
        <span style={{color:"#a3d96e"}}>-- Oferta total (pasto+CC)</span>
      </div>

      {defMeses.length>0?(
        <div style={{background:"rgba(192,72,32,.05)",border:"1px solid rgba(192,72,32,.2)",borderRadius:8,padding:12}}>
          <div style={{fontFamily:"monospace",fontSize:11,color:"#c04820",marginBottom:8,letterSpacing:1}}>⚠️ DÉFICITS — PLAN DE ACCIÓN</div>
          {defMeses.map((d,i)=>{
            const sol=[];
            if(d.dQ1>0&&parseInt(form.vaq1N)>0&&vaq1E)sol.push(`Vaq1°inv: ${vaq1E.prot}kg prot${vaq1E.energ?'+'+vaq1E.energ+'kg maíz':''}/día × ${form.vaq1N} cab`);
            if(d.dV2s>0&&parseInt(form.v2sN)>0)sol.push(`2°Serv: destete precoz (${form.v2sN} cab)`);
            if(d.dVacas>0&&parseInt(form.vacasN)>0&&d.bajo15)sol.push(`Vacas CC baja: prot 0.5% PV × ~${Math.round((parseInt(form.vacasN)||0)*0.3)} cab`);
            return(
              <div key={i} style={{marginBottom:10,paddingBottom:10,borderBottom:i<defMeses.length-1?"1px solid rgba(192,72,32,.1)":"none"}}>
                <div style={{fontFamily:"monospace",fontSize:10,color:"#e09070",marginBottom:4}}>
                  <strong>{d.mes}:</strong> {Math.round(d.deficit).toLocaleString()} Mcal/día déficit
                  {d.dVacas>0&&<span style={{color:"#7ec850",marginLeft:6}}>· Vacas</span>}
                  {d.dV2s>0&&<span style={{color:"#8866cc",marginLeft:6}}>· 2°Serv</span>}
                  {d.dQ1>0&&<span style={{color:"#d4952a",marginLeft:6}}>· Vaq1</span>}
                  {d.dQ2>0&&<span style={{color:"#3a8fb5",marginLeft:6}}>· Vaq2</span>}
                </div>
                {sol.map((s,j)=><div key={j} style={{fontFamily:"monospace",fontSize:10,color:"#7ec850",paddingLeft:8}}>→ {s}</div>)}
              </div>
            );
          })}
        </div>
      ):(
        <div style={{background:"rgba(126,200,80,.05)",border:"1px solid rgba(126,200,80,.15)",borderRadius:6,padding:10,fontFamily:"monospace",fontSize:10,color:"#7ec850",textAlign:"center"}}>✅ Sin déficits detectados con los parámetros actuales</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// COMPONENTE DIST CC
// ═══════════════════════════════════════
function DistCC({label,dist,onChange,color}){
  const total=dist.reduce((s,d)=>s+(parseFloat(d.pct)||0),0);
  const ok=Math.abs(total-100)<1;
  return(
    <div style={{marginTop:12}}>
      <div style={{fontFamily:"monospace",fontSize:10,color:color||"#7a9668",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>{label}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {dist.map((d,i)=>(
          <div key={i} style={{background:"rgba(0,0,0,.25)",border:"1px solid rgba(126,200,80,.1)",borderRadius:8,padding:10,textAlign:"center"}}>
            <div style={{fontFamily:"monospace",fontSize:9,color:"#7a9668",marginBottom:6}}>GRUPO {i+1}</div>
            <div style={{fontFamily:"monospace",fontSize:9,color:"#7a9668",marginBottom:3}}>CC (1–9)</div>
            <input type="number" inputMode="decimal" value={d.cc} min="1" max="9" step="0.5" onChange={e=>onChange(i,"cc",e.target.value)} style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.2)",borderRadius:4,color:"#ede8d8",padding:"8px 6px",fontSize:16,fontFamily:"monospace",textAlign:"center",marginBottom:6}}/>
            <div style={{fontFamily:"monospace",fontSize:9,color:"#7a9668",marginBottom:3}}>% Vacas</div>
            <input type="number" inputMode="numeric" value={d.pct} min="0" max="100" onChange={e=>onChange(i,"pct",e.target.value)} style={{width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.2)",borderRadius:4,color:"#ede8d8",padding:"8px 6px",fontSize:16,fontFamily:"monospace",textAlign:"center"}}/>
          </div>
        ))}
      </div>
      <div style={{fontFamily:"monospace",fontSize:10,marginTop:6,display:"flex",justifyContent:"space-between"}}>
        <span style={{color:ok?"#7ec850":"#c04820"}}>Total: {total}% {ok?"✅":"⚠️ debe ser 100%"}</span>
        {ok&&<span style={{color:"#7ec850"}}>CC pond: <strong>{ccPond(dist).toFixed(1)}/9</strong></span>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SYSTEM PROMPT
// ═══════════════════════════════════════
const SYS=`Actuás como asesor técnico experto en sistemas de cría bovina extensiva con recría de hembras en Argentina. 20 años de campo en pasturas megatérmicas C4, NEA y semiárido. ZONA TEMPLADA: aclarar cuando conceptos de C4 no aplican.

EJE CENTRAL: DESTETE
Destete Feb = palanca principal. Recuperación CC válida HASTA disparador (temp <15°C para C4, helada o sequía). Post-disparador: pérdida según NDVI.

NDVI: proxy de actividad fotosintética estimada — NO mide PPNA ni calidad directamente. La fenología elegida por el usuario es el dato primario de calidad HOY. NDVI proyecta hacia adelante.

DISPARADOR PRINCIPAL: temp <15°C — megatérmicas C4 frenan crecimiento y calidad cae abruptamente. Helada confirma. Sequía (NDVI<0.35 o balance<−40mm) puede anticiparlo.

PROYECCIÓN CC 3 TRAMOS (USAR VALORES DEL SISTEMA):
Post-destete → disparador: recuperación según pastizal
Post-disparador → parto: pérdida NDVI>0.40=−0.004/d|0.30–0.40=−0.007/d|<0.30=−0.010/d
Con lactancia: +0.006/d hasta destete

CURVA CC→PREÑEZ: CC 6.0→88%|5.5→75%|5.0→55%|4.5→35%|4.0→15%
USAR CC PONDERADA del rodeo (distribución % × CC por grupo).

REQUERIMIENTOS: PV^0.75 × 0.077 × factor. PROTEÍNA: tablas fijas.
ENSO: Niño=+25% precip|Niña=−25%|Neutro=histórico.

ESCENARIO VAQ1 (USAR DEL SISTEMA):
Esc A: prot 0.4% PV 3×/sem|B: 0.7% PV diario|C: 0.65% prot+0.35% maíz. 120d desde disparador.

ESTRUCTURA 8 SECCIONES:
1️⃣ DIAGNÓSTICO AMBIENTAL: fecha, zona, NDVI (actividad fotosintética estimada), temp REAL, disparador, ENSO
2️⃣ DIAGNÓSTICO POR CATEGORÍA: Mcal(PV^0.75)+PB vs oferta. CC ponderada por distribución.
3️⃣ DESTETE Y PROYECCIÓN CC: 3 tramos con números del sistema.
4️⃣ BALANCE OFERTA vs DEMANDA
5️⃣ ESTRATEGIA: destete→suplementación→ajuste carga
6️⃣ IMPACTO 1–2 AÑOS
7️⃣ EMERGENCIA
8️⃣ RESUMEN: tabla CATEGORÍA|ACCIÓN|FECHA|KG/DÍA|RESULTADO

AL FINAL siempre el disclaimer textual completo.
Citar: (NASSEM,2010)·(Balbuena,INTA 2003)·(Peruchena,INTA 2003)·(Detmann et al.,2014)·(Rosello Brajovich et al.,INTA 2025)`;

// ═══════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════
export default function AgroMind(){
  const[step,setStep]=useState(0);
  const[form,setForm]=useState({
    nombreProductor:"",estadoDestete:"",pastoCal:"",pVacas:"",diasParto:"",diasDesteteEst:"",eReprod:"",
    v2sN:"",v2sPV:"",v2sTernero:"",v2sDiasDestete:"",
    zona:"",provincia:"",mes:"",clima:"",vegetacion:"",supHa:"",fenologia:"",
    vacasN:"",ternerosN:"",torosN:"",prenezHist:"",pctDestete:"",
    vaq1N:"",vaq1PV:"",vaq1GDP:"",vaq2N:"",vaq2PV:"",diasEntore:"",tendPeso:"",
    pvVacaAdulta:"",suplem:"",consulta:"",enso:"neutro",
    ccDist:[{cc:6,pct:50},{cc:5,pct:30},{cc:4,pct:20}],
    cc2sDist:[{cc:5,pct:50},{cc:4,pct:30},{cc:3,pct:20}],
  });
  const[sat,setSat]=useState(null);const[satLoading,setSatLoading]=useState(false);
  const[coords,setCoords]=useState(null);const[manualLat,setManualLat]=useState("");const[manualLon,setManualLon]=useState("");
  const[loading,setLoading]=useState(false);const[loadMsg,setLoadMsg]=useState("");const[result,setResult]=useState("");
  const[ccParto,setCcParto]=useState(null);const[curva,setCurva]=useState(null);
  const[tab,setTab]=useState("analisis");const[gpsLoading,setGpsLoading]=useState(false);
  const[productores,setProductores]=useState([]);const[dispar,setDispar]=useState(null);const[vaq1E,setVaq1E]=useState(null);

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const setCCD=(i,c,v)=>{const d=[...form.ccDist];d[i]={...d[i],[c]:v};set("ccDist",d);};
  const setCC2D=(i,c,v)=>{const d=[...form.cc2sDist];d[i]={...d[i],[c]:v};set("cc2sDist",d);};

  useEffect(()=>{try{const p=JSON.parse(localStorage.getItem("agm_prod")||"[]");setProductores(p);}catch(e){}});

  useEffect(()=>{
    const dp=parseInt(form.diasParto);const cc=ccPond(form.ccDist);
    if(cc>0&&dp>0){const p=calcCCParto(form.ccDist,dp,form.estadoDestete,form.pastoCal,form.diasDesteteEst,sat?.ndvi||"0.45",form.provincia);setCcParto(p);setCurva(p?interpCC(p):null);}
    else{setCcParto(null);setCurva(null);}
  },[form.ccDist,form.diasParto,form.estadoDestete,form.pastoCal,form.diasDesteteEst,form.provincia,sat]);

  useEffect(()=>{if(form.provincia&&sat)setDispar(calcDisp(form.provincia,sat.ndvi,sat.deficit,sat));else setDispar(null);},[form.provincia,sat]);
  useEffect(()=>{if(form.vaq1PV&&sat)setVaq1E(escVaq1(sat.ndvi,sat.deficit,form.vaq1PV));else setVaq1E(null);},[form.vaq1PV,sat]);

  const applyLoc=async(lat,lon,src)=>{const zona=dZona(lat,lon),prov=dProv(lat,lon),mes=MESES[new Date().getMonth()];setCoords({lat,lon,src});setForm(f=>({...f,zona,provincia:prov,mes}));await fetchSat(lat,lon,zona,mes);};
  const getGPS=()=>{if(!navigator.geolocation){alert("GPS no disponible");return;}setGpsLoading(true);navigator.geolocation.getCurrentPosition(p=>{setGpsLoading(false);applyLoc(p.coords.latitude,p.coords.longitude,"GPS");},e=>{setGpsLoading(false);alert("Error: "+e.message);},{enableHighAccuracy:true,timeout:15000});};
  const setManual=()=>{const lat=parseFloat(manualLat),lon=parseFloat(manualLon);if(isNaN(lat)||isNaN(lon)||lat>-20||lat<-56||lon>-52||lon<-74){alert("Coordenadas inválidas.\nEj: Lat -27.45 / Lon -59.12");return;}applyLoc(lat,lon,"Manual");};

  const fetchSat=async(lat,lon,zona,mes)=>{
    setSatLoading(true);setSat(null);
    try{
      const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration&timezone=auto&past_days=30&forecast_days=1`;
      const d=(await(await fetch(url)).json()).daily;
      const p7=d.precipitation_sum.slice(-7).reduce((a,b)=>a+(b||0),0);
      const p30=d.precipitation_sum.slice(0,30).reduce((a,b)=>a+(b||0),0);
      const tMax7=d.temperature_2m_max.slice(-7),tMin7=d.temperature_2m_min.slice(-7);
      const temp=tMax7.map((t,i)=>(t+(tMin7[i]||t))/2).reduce((a,b)=>a+b,0)/tMax7.length;
      const et=d.et0_fao_evapotranspiration.slice(-7).reduce((a,b)=>a+(b||0),0)/7;
      const deficit=Math.round((p30-et*30)*10)/10;
      const clima=deficit<-40?"Seco":deficit>40?"Húmedo":"Normal";
      const ndviBase={NEA:0.55,"Pampa Húmeda":0.50,NOA:0.42,"Semiárido":0.38,Cuyo:0.30,Patagonia:0.28}[zona]||0.45;
      const pf=Math.min(Math.max((p30-20)/180,-0.15),0.25);
      const mi=MESES.indexOf(mes);const mf=[0.05,0.03,0,-0.03,-0.08,-0.12,-0.12,-0.08,-0.02,0.03,0.05,0.06];
      const ndvi=Math.min(Math.max(ndviBase+pf+(mi>=0?mf[mi]:0),0.05),0.95);
      const cond=ndvi>0.55?"Excelente":ndvi>0.40?"Buena":ndvi>0.25?"Moderada":ndvi>0.15?"Baja":"Muy baja";
      setSat({ndvi:ndvi.toFixed(2),temp:temp.toFixed(1),tMax:Math.max(...tMax7).toFixed(1),tMin:Math.min(...tMin7).toFixed(1),p7:Math.round(p7),p30:Math.round(p30),et:et.toFixed(1),deficit,cond,clima});
      setForm(f=>({...f,clima}));
    }catch(e){console.error(e);}finally{setSatLoading(false);}
  };

  const saveProductor=(informe)=>{
    if(!form.nombreProductor.trim())return;
    const hoy=new Date().toLocaleDateString("es-AR");
    const fh=form.provincia&&sat?fechaHelada(form.provincia,sat.ndvi)?.toLocaleDateString("es-AR")||"":"";
    const r={nombre:form.nombreProductor,fechaConsulta:hoy,zona:form.zona,provincia:form.provincia,mes:form.mes,clima:form.clima,enso:form.enso,ndvi:sat?.ndvi||"",ndviCond:sat?.cond||"",supHa:form.supHa,vegetacion:form.vegetacion,fenologia:form.fenologia,disparador:dispar?.tipo||"",diasDisparador:dispar?.dias<999?dispar?.dias:"",fechaHelada:fh,estadoDestete:form.estadoDestete,ccDistribucion:form.ccDist.map(d=>`${d.pct}%→CC${d.cc}`).join("|"),ccPonderada:ccPond(form.ccDist).toFixed(1),diasParto:form.diasParto,diasDesteteEst:form.diasDesteteEst,pVacas:form.pVacas,eReprod:form.eReprod,reqEnergetico:form.pVacas&&form.eReprod?(reqEM(form.pVacas,form.eReprod)||"")+"Mcal/día":"",vacasN:form.vacasN,ternerosN:form.ternerosN,torosN:form.torosN,prenezHist:form.prenezHist,pctDestete:form.pctDestete,v2sN:form.v2sN,v2sPV:form.v2sPV,cc2sDistribucion:form.cc2sDist.map(d=>`${d.pct}%→CC${d.cc}`).join("|"),cc2sPonderada:ccPond(form.cc2sDist).toFixed(1),v2sTernero:form.v2sTernero,pvVacaAdulta:form.pvVacaAdulta,vaq1N:form.vaq1N,vaq1PV:form.vaq1PV,vaq1GDP:form.vaq1GDP,vaq1Escenario:vaq1E?`Esc ${vaq1E.esc}: ${vaq1E.prot}kg${vaq1E.energ?'+'+vaq1E.energ+'kg maíz':''}/día`:"",vaq2N:form.vaq2N,vaq2PV:form.vaq2PV,diasEntore:form.diasEntore,suplem:form.suplem,ccParto:ccParto||"",prenezEst:curva?.pr||"",informe:(informe||"").slice(0,400),fechaVisita:hoy};
    const upd=[r,...productores.filter(p=>p.nombre!==form.nombreProductor)];
    setProductores(upd);try{localStorage.setItem("agm_prod",JSON.stringify(upd));}catch(e){}
  };

  const exportCSV=()=>{
    if(!productores.length){alert("Sin datos.");return;}
    const cols=["nombre","fechaConsulta","zona","provincia","mes","clima","enso","ndvi","ndviCond","supHa","vegetacion","fenologia","disparador","diasDisparador","fechaHelada","estadoDestete","ccDistribucion","ccPonderada","diasParto","diasDesteteEst","pVacas","eReprod","reqEnergetico","vacasN","ternerosN","torosN","prenezHist","pctDestete","v2sN","v2sPV","cc2sDistribucion","cc2sPonderada","v2sTernero","pvVacaAdulta","vaq1N","vaq1PV","vaq1GDP","vaq1Escenario","vaq2N","vaq2PV","diasEntore","suplem","ccParto","prenezEst","informe","fechaVisita"];
    const csv=[cols.join(","),...productores.map(p=>cols.map(c=>`"${String(p[c]||"").replace(/"/g,'""')}"`).join(","))].join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`agromind_${new Date().toISOString().slice(0,10)}.csv`;a.click();
  };

  const buildPrompt=()=>{
    const fechaC=new Date().toLocaleDateString("es-AR",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
    let t=`ANÁLISIS — FECHA: ${fechaC}\n`;
    if(coords)t+=`UBICACIÓN: ${coords.lat?.toFixed(4)}°S ${coords.lon?.toFixed(4)}°W · ${form.zona} · ${form.provincia}\n`;
    if(sat)t+=`MET REAL: T${sat.temp}°C (Mx${sat.tMax}/Mn${sat.tMin}) · P7d:${sat.p7}mm P30d:${sat.p30}mm · Bal:${sat.deficit>0?'+':''}${sat.deficit}mm · NDVI:${sat.ndvi}(${sat.cond}) · ${sat.clima}\n`;
    t+=`ENSO: ${form.enso==="nino"?"El Niño +25%":form.enso==="nina"?"La Niña −25%":"Neutro"}\n`;
    if(dispar)t+=`DISPARADOR: ${dispar.tipo} ~${dispar.dias<999?dispar.dias+"d":"sin disparador"}\n`;
    t+=`\nDESTETE: ${form.estadoDestete||'—'} · Pasto: ${form.pastoCal||'—'}\n`;
    t+=`DIST CC RODEO: ${form.ccDist.map(d=>`${d.pct}%→CC${d.cc}`).join(" | ")} · Pond: ${ccPond(form.ccDist).toFixed(1)}/9\n`;
    t+=`Días parto: ${form.diasParto||'—'} · PV vaca: ${form.pVacas||'—'}kg · Reprod: ${form.eReprod||'—'}\n`;
    if(form.pVacas&&form.eReprod){const r=reqEM(form.pVacas,form.eReprod);if(r)t+=`Req EM (PV^0.75): ${r} Mcal/día\n`;}
    if(form.diasDesteteEst)t+=`Días al destete: ${form.diasDesteteEst}\n`;
    if(ccParto)t+=`CC PARTO (sistema 3 tramos): ${ccParto}/9 → CC serv: ${curva?.ccS} → Preñez: ${curva?.pr}% — USAR ESTE VALOR\n`;
    t+=`\n2°SERV: N°${form.v2sN||'—'} · PV ${form.v2sPV||'—'}kg · Ternero: ${form.v2sTernero||'—'}\n`;
    t+=`DIST CC 2°SERV: ${form.cc2sDist.map(d=>`${d.pct}%→CC${d.cc}`).join(" | ")} · Pond: ${ccPond(form.cc2sDist).toFixed(1)}/9\n`;
    if(form.v2sPV){const r=reqEM(form.v2sPV,"vaca2serv");if(r)t+=`Req EM 2°serv: ${r} Mcal/día\n`;}
    t+=`\nFORRAJE: Fenol: ${form.fenologia||'—'} · Veg: ${form.vegetacion||'—'} · ${form.supHa||'—'}ha\n`;
    t+=`RODEO: ${form.vacasN||'—'} vacas · ${form.ternerosN||'—'} terneros · ${form.torosN||'—'} toros · Preñez hist ${form.prenezHist||'—'}%\n`;
    t+=`VAQ1: N°${form.vaq1N||'—'} · ${form.vaq1PV||'—'}kg · GDP ${form.vaq1GDP||'—'}g/d\n`;
    if(vaq1E)t+=`ESC VAQ1 (USAR): Esc ${vaq1E.esc} — ${vaq1E.desc} · ${vaq1E.prot}kg prot${vaq1E.energ?'+'+vaq1E.energ+'kg maíz':''}/día · ${vaq1E.freq} · 120d\n`;
    t+=`VAQ2: N°${form.vaq2N||'—'} · ${form.vaq2PV||'—'}kg · Entore ${form.diasEntore||'—'}d\n`;
    if(form.pvVacaAdulta)t+=`PV mín entore: ${(parseFloat(form.pvVacaAdulta)*0.75).toFixed(0)}kg\n`;
    if(form.suplem)t+=`Supl: ${form.suplem}\n`;
    if(form.consulta)t+=`\nCONSULTA: ${form.consulta}\n`;
    t+="\n→ Usar CC calculada. Escenario vaq1 del sistema. Tabla resumen sección 8. Disclaimer al final.";
    return t;
  };

  const MSGS=["Calculando disparador <15°C...","Proyectando CC 3 tramos...","Evaluando escenario vaq1...","Calculando por peso metabólico...","Ajustando ENSO...","Calculando dosis...","Redactando informe...","Tabla resumen..."];
  const runAnalysis=async()=>{setLoading(true);setResult("");let mi=0;const iv=setInterval(()=>{setLoadMsg(MSGS[mi%MSGS.length]);mi++;},2000);try{const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:buildPrompt(),systemPrompt:SYS})});const data=await res.json();if(!res.ok)throw new Error(data.error||"Error");setResult(data.result);saveProductor(data.result);setStep(4);}catch(e){setResult("❌ Error: "+e.message);}finally{clearInterval(iv);setLoading(false);}};

  const rr=(t)=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/(1️⃣|2️⃣|3️⃣|4️⃣|5️⃣|6️⃣|7️⃣|8️⃣)\s*([^\n]+)/g,'<div style="font-family:monospace;font-size:13px;color:#7ec850;margin:16px 0 6px;border-left:3px solid #7ec850;padding-left:10px">$1 $2</div>').replace(/Las recomendaciones generadas(.*?)sistema productivo\./s,'<div style="margin-top:20px;padding:12px;border:1px solid rgba(212,149,42,.4);border-radius:6px;background:rgba(212,149,42,.04);font-family:monospace;font-size:11px;color:#d4952a;line-height:1.8">⚠️ AVISO PROFESIONAL<br/>Las recomendaciones generadas$1sistema productivo.</div>').replace(/\n\n/g,"<br/><br/>").replace(/\n/g,"<br/>");

  // ── ESTILOS ──
  const BG="#0c1208";
  const btn=(active,color="#7ec850")=>({background:active?`${color}22`:"rgba(0,0,0,.3)",border:`1px solid ${active?color:"rgba(126,200,80,.15)"}`,borderRadius:12,color:active?color:"#7a9668",padding:"14px 10px",fontFamily:"monospace",fontSize:13,cursor:"pointer",textAlign:"center",width:"100%",display:"block"});
  const inp={width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.2)",borderRadius:8,color:"#ede8d8",padding:"14px 12px",fontSize:16,fontFamily:"Georgia,serif",boxSizing:"border-box"};
  const lbl={fontFamily:"monospace",fontSize:10,color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:6};
  const card={background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:12,padding:16,marginBottom:12};
  const pC=!curva?"#7a9668":curva.pr>=75?"#7ec850":curva.pr>=55?"#d4952a":"#c04820";
  const ccC=!ccParto?"#7a9668":ccParto>=5.5?"#7ec850":ccParto>=5.0?"#d4952a":"#c04820";
  const dC=!dispar?"#7a9668":dispar.dias<30?"#c04820":dispar.dias<60?"#d4952a":"#7ec850";

  const PASOS=["📍 Ubicación","🐄 Rodeo","⚠️ Categorías","🌾 Forraje","⚡ Analizar"];

  // ── WIZARD PASOS ──
  const renderPaso=()=>{
    if(step===0) return(
      <div>
        <div style={{...card,border:"1px solid rgba(126,200,80,.2)"}}>
          <div style={{fontFamily:"monospace",fontSize:11,color:"#7a9668",marginBottom:6}}>ESTABLECIMIENTO</div>
          <input value={form.nombreProductor} onChange={e=>set("nombreProductor",e.target.value)} placeholder="Nombre del productor o establecimiento" style={inp}/>
        </div>
        <div style={card}>
          <div style={{fontFamily:"monospace",fontSize:13,color:"#7ec850",marginBottom:12,letterSpacing:1}}>📍 UBICACIÓN GPS</div>
          <button onClick={getGPS} disabled={gpsLoading} style={{width:"100%",background:gpsLoading?"rgba(126,200,80,.1)":"#7ec850",color:gpsLoading?"#7ec850":"#070d03",border:"none",borderRadius:12,padding:"18px",fontFamily:"monospace",fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:12}}>{gpsLoading?"📍 Localizando...":"📍 OBTENER MI UBICACIÓN"}</button>
          <div style={{fontFamily:"monospace",fontSize:11,color:"#7a9668",textAlign:"center",marginBottom:12}}>— o ingresar coordenadas —</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            <div><label style={lbl}>Latitud</label><input type="number" inputMode="decimal" value={manualLat} onChange={e=>setManualLat(e.target.value)} placeholder="-27.45" style={inp}/></div>
            <div><label style={lbl}>Longitud</label><input type="number" inputMode="decimal" value={manualLon} onChange={e=>setManualLon(e.target.value)} placeholder="-59.12" style={inp}/></div>
          </div>
          <button onClick={setManual} style={{width:"100%",background:"rgba(126,200,80,.1)",border:"1px solid rgba(126,200,80,.3)",borderRadius:12,color:"#7ec850",padding:"14px",fontFamily:"monospace",fontSize:14,cursor:"pointer"}}>FIJAR COORDENADAS</button>
          {coords&&<div style={{marginTop:12}}>
            <iframe src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon-0.08}%2C${coords.lat-0.08}%2C${coords.lon+0.08}%2C${coords.lat+0.08}&layer=mapnik&marker=${coords.lat}%2C${coords.lon}`} style={{width:"100%",height:200,border:"1px solid rgba(126,200,80,.2)",borderRadius:8}} loading="lazy"/>
            <div style={{fontFamily:"monospace",fontSize:10,color:"#7ec850",marginTop:6,textAlign:"center"}}>✅ {coords.lat?.toFixed(4)}°S {coords.lon?.toFixed(4)}°W · {form.zona} · {form.provincia}</div>
          </div>}
          {satLoading&&<div style={{fontFamily:"monospace",fontSize:11,color:"#7ec850",textAlign:"center",marginTop:12}}>🛰 Descargando datos meteorológicos reales...</div>}
          {sat&&(<div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:12}}>
              {[["Temp",sat.temp+"°C","#d4952a"],["Precip 30d",sat.p30+"mm","#3a8fb5"],["Balance",(sat.deficit>0?"+":"")+sat.deficit,"sat.deficit<-30"?"#c04820":"#d4952a"],["NDVI*",sat.ndvi+" "+sat.cond.slice(0,3),"#7ec850"]].map(([l,v,c])=>(
                <div key={l} style={{textAlign:"center",background:"rgba(0,0,0,.3)",borderRadius:8,padding:"10px 4px",border:"1px solid rgba(126,200,80,.1)"}}>
                  <div style={{fontFamily:"monospace",fontSize:9,color:"#7a9668",marginBottom:3}}>{l}</div>
                  <div style={{fontFamily:"monospace",fontSize:13,color:c,fontWeight:700}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{fontFamily:"monospace",fontSize:9,color:"rgba(126,200,80,.4)",marginTop:6,textAlign:"center"}}>* NDVI = proxy de actividad fotosintética estimada, no mide PPNA directamente</div>
            {dispar&&dispar.dias<60&&<div style={{marginTop:10,background:"rgba(192,72,32,.08)",border:"1px solid rgba(192,72,32,.3)",borderRadius:8,padding:10,fontFamily:"monospace",fontSize:11,color:"#e09070",textAlign:"center"}}>⚠️ {dispar.tipo} en ~{dispar.dias} días — calidad C4 caerá</div>}
          </div>)}
        </div>
        <div style={card}>
          <div style={{fontFamily:"monospace",fontSize:11,color:"#7a9668",marginBottom:8,letterSpacing:1}}>CONDICIÓN ENSO</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[["neutro","⚪ Neutro","#7a9668"],["nino","🌊 El Niño","#3a8fb5"],["nina","🔴 La Niña","#c04820"]].map(([v,l,c])=>(
              <button key={v} onClick={()=>set("enso",v)} style={btn(form.enso===v,c)}>{l}</button>
            ))}
          </div>
          <div style={{fontFamily:"monospace",fontSize:9,color:"#7a9668",marginTop:6,textAlign:"center"}}>Niño: +25% precip · Niña: −25% precip (modifica oferta proyectada)</div>
        </div>
      </div>
    );

    if(step===1) return(
      <div>
        <div style={card}>
          <div style={{fontFamily:"monospace",fontSize:13,color:"#d4952a",marginBottom:12,letterSpacing:1}}>📅 DESTETE</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            {[["ok_feb","✅ Feb"],["ok_mar","✅ Mar"],["tard_abr","⚠️ Abr"],["no_ternero","🔴 Con ternero"],["precoz","⚡ Precoz"],["planif","📋 Planifico"]].map(([v,l])=>(
              <button key={v} onClick={()=>set("estadoDestete",v)} style={btn(form.estadoDestete===v,v==="no_ternero"?"#c04820":"#d4952a")}>{l}</button>
            ))}
          </div>
          {form.estadoDestete==="no_ternero"&&<div style={{marginBottom:8}}><label style={lbl}>Días estimados al destete</label><input type="number" inputMode="numeric" value={form.diasDesteteEst} onChange={e=>set("diasDesteteEst",e.target.value)} placeholder="Ej: 30" style={inp}/></div>}
          <label style={lbl}>Calidad pastizal post-destete</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {[["excelente","🟢 Excelente"],["bueno","🟡 Bueno"],["regular","🟠 Regular"],["malo","🔴 Malo"]].map(([v,l])=>(
              <button key={v} onClick={()=>set("pastoCal",v)} style={btn(form.pastoCal===v)}>{l}</button>
            ))}
          </div>
        </div>
        <div style={card}>
          <div style={{fontFamily:"monospace",fontSize:13,color:"#7ec850",marginBottom:12,letterSpacing:1}}>🐄 RODEO GENERAL</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            {[["vacasN","N° Vacas","150"],["pVacas","Peso vaca (kg)","380"],["diasParto","Días al parto","90"],["pvVacaAdulta","PV adulta rodeo (kg)","420"]].map(([k,l,p])=>(
              <div key={k}><label style={lbl}>{l}</label><input type="number" inputMode="numeric" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={"Ej: "+p} style={inp}/></div>
            ))}
          </div>
          <label style={lbl}>Estado Reproductivo</label>
          <select value={form.eReprod} onChange={e=>set("eReprod",e.target.value)} style={{...inp,marginBottom:10}}>
            <option value="">Seleccionar...</option>{ESTADOS_REPROD.map(e=><option key={e} value={e}>{e}</option>)}
          </select>
          {form.pVacas&&form.eReprod&&reqEM(form.pVacas,form.eReprod)&&<div style={{background:"rgba(58,143,181,.08)",border:"1px solid rgba(58,143,181,.2)",borderRadius:8,padding:10,fontFamily:"monospace",fontSize:11,color:"#3a8fb5",textAlign:"center",marginBottom:10}}>Req energético (PV^0.75): <strong>{reqEM(form.pVacas,form.eReprod)} Mcal EM/día</strong></div>}
          <DistCC label="Distribución CC — Vacas Rodeo" dist={form.ccDist} onChange={setCCD} color="#7ec850"/>
          {ccParto&&curva&&<div style={{marginTop:10,background:"rgba(0,0,0,.25)",border:`1px solid ${ccC}44`,borderRadius:8,padding:12,fontFamily:"monospace",fontSize:12,textAlign:"center"}}>
            CC parto: <strong style={{color:ccC,fontSize:16}}>{ccParto}/9</strong>{"  →  "}CC serv: <strong style={{color:pC}}>{curva.ccS}</strong>{"  →  "}Preñez: <strong style={{color:pC,fontSize:16}}>{curva.pr}%</strong>
          </div>}
        </div>
        <div style={card}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[["ternerosN","N° Terneros","120"],["torosN","N° Toros","8"],["prenezHist","Preñez hist %","72"],["pctDestete","% Destete","68"]].map(([k,l,p])=>(
              <div key={k}><label style={lbl}>{l}</label><input type="number" inputMode="numeric" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={"Ej: "+p} style={inp}/></div>
            ))}
          </div>
        </div>
      </div>
    );

    if(step===2) return(
      <div>
        <div style={{...card,border:"1px solid rgba(136,102,204,.3)"}}>
          <div style={{fontFamily:"monospace",fontSize:13,color:"#8866cc",marginBottom:6,letterSpacing:1}}>⚠️ VACA 2° SERVICIO</div>
          <div style={{fontFamily:"monospace",fontSize:10,color:"rgba(136,102,204,.6)",marginBottom:12}}>Triple demanda: lactando + creciendo + preñar</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            {[["v2sN","N° Cabezas","30"],["v2sPV","Peso prom (kg)","340"]].map(([k,l,p])=>(
              <div key={k}><label style={lbl}>{l}</label><input type="number" inputMode="numeric" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={"Ej: "+p} style={inp}/></div>
            ))}
          </div>
          <label style={lbl}>¿Ternero al pie?</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
            {[["si","🔴 Sí","#c04820"],["precoz","⚡ Precoz","#d4952a"],["no","✅ No","#7ec850"]].map(([v,l,c])=>(
              <button key={v} onClick={()=>set("v2sTernero",v)} style={btn(form.v2sTernero===v,c)}>{l}</button>
            ))}
          </div>
          {form.v2sTernero==="si"&&<div style={{marginBottom:10}}><label style={lbl}>Días estimados al destete</label><input type="number" inputMode="numeric" value={form.v2sDiasDestete} onChange={e=>set("v2sDiasDestete",e.target.value)} placeholder="Ej: 20" style={inp}/></div>}
          {form.v2sPV&&<div style={{background:"rgba(58,143,181,.08)",border:"1px solid rgba(58,143,181,.2)",borderRadius:8,padding:10,fontFamily:"monospace",fontSize:11,color:"#3a8fb5",textAlign:"center",marginBottom:10}}>Req energético 2°serv (PV^0.75): <strong>{reqEM(form.v2sPV,"vaca2serv")} Mcal/día</strong></div>}
          <DistCC label="Distribución CC — 2° Servicio" dist={form.cc2sDist} onChange={setCC2D} color="#8866cc"/>
        </div>
        <div style={{...card,border:"1px solid rgba(212,149,42,.3)"}}>
          <div style={{fontFamily:"monospace",fontSize:13,color:"#d4952a",marginBottom:6,letterSpacing:1}}>🐄 VAQUILLA 1° INVIERNO</div>
          <div style={{fontFamily:"monospace",fontSize:10,color:"rgba(212,149,42,.6)",marginBottom:12}}>Post-destete · GDP 600g/d · Supl. proteica sin discusión</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            {[["vaq1N","N° Cabezas","40"],["vaq1PV","Peso prom (kg)","185"],["vaq1GDP","GDP obs (g/d)","500"]].map(([k,l,p])=>(
              <div key={k}><label style={lbl}>{l}</label><input type="number" inputMode="numeric" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={"Ej: "+p} style={inp}/></div>
            ))}
          </div>
          {vaq1E&&<div style={{background:"rgba(212,149,42,.08)",border:"1px solid rgba(212,149,42,.3)",borderRadius:8,padding:10,fontFamily:"monospace",fontSize:11,color:"#d4952a",textAlign:"center"}}>
            Escenario <strong>{vaq1E.esc}</strong> — {vaq1E.desc}<br/>
            <strong>{vaq1E.prot}kg prot/día{vaq1E.energ>0?` + ${vaq1E.energ}kg maíz/día`:""}</strong> · {vaq1E.freq} · 120 días
          </div>}
        </div>
        <div style={{...card,border:"1px solid rgba(58,143,181,.25)"}}>
          <div style={{fontFamily:"monospace",fontSize:13,color:"#3a8fb5",marginBottom:6,letterSpacing:1}}>🐄 VAQUILLA 2° INVIERNO</div>
          <div style={{fontFamily:"monospace",fontSize:10,color:"rgba(58,143,181,.6)",marginBottom:12}}>Pre-entore · Flushing · 0.75×PV adulta</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            {[["vaq2N","N° Cabezas","35"],["vaq2PV","Peso prom (kg)","290"],["diasEntore","Días al entore","45"]].map(([k,l,p])=>(
              <div key={k}><label style={lbl}>{l}</label><input type="number" inputMode="numeric" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={"Ej: "+p} style={inp}/></div>
            ))}
          </div>
          {form.pvVacaAdulta&&<div style={{background:"rgba(212,149,42,.06)",border:"1px solid rgba(212,149,42,.2)",borderRadius:8,padding:10,fontFamily:"monospace",fontSize:11,color:"#d4952a",textAlign:"center"}}>
            PV mínimo entore: <strong>{(parseFloat(form.pvVacaAdulta)*0.75).toFixed(0)} kg</strong>
            {form.vaq2PV&&parseFloat(form.vaq2PV)<parseFloat(form.pvVacaAdulta)*0.75&&<span style={{color:"#c04820"}}> · ⚠️ No alcanza</span>}
          </div>}
        </div>
      </div>
    );

    if(step===3) return(
      <div>
        <div style={card}>
          <div style={{fontFamily:"monospace",fontSize:13,color:"#7ec850",marginBottom:12,letterSpacing:1}}>🌾 ESTADO FENOLÓGICO HOY</div>
          <div style={{fontFamily:"monospace",fontSize:9,color:"rgba(126,200,80,.45)",marginBottom:12}}>Dato primario de calidad en campo. NDVI estima actividad fotosintética, no reemplaza la observación.</div>
          {FENOLOGIAS.map(f=>(
            <button key={f.val} onClick={()=>set("fenologia",f.val)} style={{...btn(form.fenologia===f.val),marginBottom:8,display:"flex",alignItems:"center",gap:12,textAlign:"left",padding:"14px 16px"}}>
              <span style={{fontSize:20}}>{f.emoji}</span>
              <div>
                <div style={{fontFamily:"monospace",fontSize:13,fontWeight:700}}>{f.label}</div>
                <div style={{fontFamily:"monospace",fontSize:10,marginTop:2,opacity:.8}}>{f.desc}</div>
                {f.warn&&<div style={{fontFamily:"monospace",fontSize:10,color:"#c04820",marginTop:2}}>{f.warn}</div>}
              </div>
            </button>
          ))}
        </div>
        <div style={card}>
          <div style={{fontFamily:"monospace",fontSize:13,color:"#7ec850",marginBottom:12,letterSpacing:1}}>🌿 CAMPO</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><label style={lbl}>Superficie (ha)</label><input type="number" inputMode="numeric" value={form.supHa} onChange={e=>set("supHa",e.target.value)} placeholder="Ej: 500" style={inp}/></div>
          </div>
          <label style={lbl}>Tipo de vegetación</label>
          <select value={form.vegetacion} onChange={e=>set("vegetacion",e.target.value)} style={{...inp,marginBottom:10}}>
            <option value="">Seleccionar...</option>
            {["Pastizal natural NEA/Chaco","Megatérmicas C4 (gatton panic, brachiaria)","Pasturas templadas C3","Mixta gramíneas+leguminosas","Monte bajo / sabana","Verdeo de invierno"].map(o=><option key={o} value={o}>{o}</option>)}
          </select>
          <label style={lbl}>Suplementación actual</label>
          <select value={form.suplem} onChange={e=>set("suplem",e.target.value)} style={{...inp,marginBottom:10}}>
            <option value="">Sin suplementar</option>
            {["Expeller proteico","Grano energético","Semilla de algodón","Mixtura E+P","Núcleo mineral"].map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={card}>
          <div style={{fontFamily:"monospace",fontSize:13,color:"#7ec850",marginBottom:10,letterSpacing:1}}>💬 CONSULTA</div>
          <textarea value={form.consulta} onChange={e=>set("consulta",e.target.value)} placeholder="Describí la situación o pregunta puntual (opcional)..." rows={4} style={{...inp,resize:"vertical",lineHeight:1.6}}/>
        </div>
      </div>
    );

    if(step===4) return(
      <div>
        {/* RESUMEN KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:12}}>
          {[
            ["📍 Zona",form.zona+(form.provincia?' · '+form.provincia:''),"#7ec850"],
            ["🌡️ Temp actual",sat?(sat.tMin+"–"+sat.tMax+"°C"):"—","#d4952a"],
            ["🛰 NDVI",sat?(sat.ndvi+" ("+sat.cond+")"):"—","#7ec850"],
            ["⚡ Disparador",dispar?(dispar.dias<999?"~"+dispar.dias+"d — "+dispar.tipo:"Sin disparador"):"—",dC],
            ["🐄 CC Parto",ccParto?(ccParto+"/9"):"—",ccC],
            ["📊 Preñez Est.",curva?(curva.pr+"%"):"—",pC],
            ["🌾 Vaq1 Esc",vaq1E?("Esc "+vaq1E.esc+" — "+vaq1E.desc):"—",vaq1E?.esc==="C"?"#c04820":vaq1E?.esc==="B"?"#d4952a":"#7ec850"],
            ["🌊 ENSO",form.enso==="nino"?"El Niño +25%":form.enso==="nina"?"La Niña −25%":"Neutro",form.enso==="nino"?"#3a8fb5":form.enso==="nina"?"#c04820":"#7a9668"],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:10,padding:"10px 12px"}}>
              <div style={{fontFamily:"monospace",fontSize:9,color:"#7a9668",marginBottom:3}}>{l}</div>
              <div style={{fontFamily:"monospace",fontSize:11,color:c,fontWeight:600,lineHeight:1.3}}>{v||"—"}</div>
            </div>
          ))}
        </div>

        <button onClick={runAnalysis} disabled={loading} style={{width:"100%",background:loading?"#3e5230":"#7ec850",color:"#070d03",border:"none",borderRadius:14,padding:"20px",fontFamily:"monospace",fontSize:18,fontWeight:700,cursor:loading?"not-allowed":"pointer",marginBottom:16,letterSpacing:2}}>
          {loading?"⏳ PROCESANDO...":"⚡ GENERAR INFORME"}
        </button>

        {loading&&<div style={{background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:10,padding:16,marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
          <div style={{flex:1,height:3,background:"rgba(126,200,80,.1)",borderRadius:2,overflow:"hidden",position:"relative"}}><div style={{position:"absolute",top:0,left:0,width:"40%",height:"100%",background:"#7ec850",borderRadius:2,animation:"scan 1.2s ease-in-out infinite"}}/></div>
          <div style={{fontFamily:"monospace",fontSize:10,color:"#7a9668",whiteSpace:"nowrap"}}>{loadMsg}</div>
        </div>}

        {result&&<div style={{...card,border:"1px solid rgba(126,200,80,.15)"}}>
          <div style={{fontFamily:"monospace",fontSize:11,letterSpacing:2,color:"#7ec850",marginBottom:12,paddingBottom:10,borderBottom:"1px solid rgba(126,200,80,.09)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>INFORME TÉCNICO</span>
            <button onClick={()=>navigator.clipboard?.writeText(result)} style={{background:"transparent",border:"1px solid rgba(126,200,80,.2)",borderRadius:6,color:"#7ec850",padding:"4px 10px",fontFamily:"monospace",fontSize:10,cursor:"pointer"}}>COPIAR</button>
          </div>
          <div style={{fontSize:14,lineHeight:1.9}} dangerouslySetInnerHTML={{__html:rr(result)}}/>
          {form.nombreProductor&&<div style={{marginTop:10,fontFamily:"monospace",fontSize:10,color:"#7a9668"}}>✅ Guardado: {form.nombreProductor}</div>}

          <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid rgba(126,200,80,.09)"}}>
            <GraficoBalance form={form} sat={sat} dispar={dispar} vaq1E={vaq1E}/>
          </div>

          <div style={{marginTop:16,padding:12,border:"1px solid rgba(212,149,42,.35)",borderRadius:8,background:"rgba(212,149,42,.04)"}}>
            <div style={{fontFamily:"monospace",fontSize:10,color:"#d4952a",marginBottom:4,letterSpacing:1}}>⚠️ AVISO PROFESIONAL</div>
            <div style={{fontFamily:"monospace",fontSize:11,color:"rgba(212,149,42,.8)",lineHeight:1.8}}>{DISCLAIMER}</div>
          </div>
        </div>}
      </div>
    );
  };

  // ── PLANILLA TAB ──
  const renderPlanilla=()=>(
    <div style={{...card}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
        <span style={{fontFamily:"monospace",fontSize:13,color:"#7ec850"}}>📋 {productores.length} productor{productores.length!==1?"es":""}</span>
        <div style={{display:"flex",gap:8}}>
          <button onClick={exportCSV} style={{background:"rgba(58,143,181,.1)",border:"1px solid rgba(58,143,181,.3)",borderRadius:8,color:"#3a8fb5",padding:"8px 14px",fontFamily:"monospace",fontSize:11,cursor:"pointer"}}>⬇ CSV</button>
          <button onClick={()=>{if(confirm("¿Borrar todos?")){setProductores([]);localStorage.removeItem("agm_prod");}}} style={{background:"rgba(192,72,32,.1)",border:"1px solid rgba(192,72,32,.3)",borderRadius:8,color:"#c04820",padding:"8px 14px",fontFamily:"monospace",fontSize:11,cursor:"pointer"}}>🗑</button>
        </div>
      </div>
      <div style={{fontFamily:"monospace",fontSize:9,color:"#7a9668",marginBottom:10}}>CSV incluye: fecha · ENSO · disparador · helada · dist CC · escenario vaq1 · req energético</div>
      {productores.length===0?<div style={{textAlign:"center",padding:30,fontFamily:"monospace",fontSize:12,color:"#3e5230"}}>Sin registros aún.</div>:(
        productores.map((p,i)=>(
          <div key={i} onClick={()=>{setForm(f=>({...f,...p}));setTab("analisis");setStep(4);}} style={{background:"rgba(0,0,0,.2)",border:"1px solid rgba(126,200,80,.08)",borderRadius:10,padding:12,marginBottom:8,cursor:"pointer"}}>
            <div style={{fontFamily:"monospace",fontSize:13,color:"#7ec850",marginBottom:4}}>{p.nombre}</div>
            <div style={{fontFamily:"monospace",fontSize:10,color:"#7a9668",display:"flex",gap:10,flexWrap:"wrap"}}>
              <span>{p.fechaConsulta}</span><span>{p.zona}</span><span>CC:{p.ccPonderada}/9</span><span style={{color:parseFloat(p.prenezEst)>=75?"#7ec850":parseFloat(p.prenezEst)>=55?"#d4952a":"#c04820"}}>{p.prenezEst?p.prenezEst+"%":"—"}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // ── RENDER PRINCIPAL ──
  return(
    <div style={{background:BG,minHeight:"100vh",color:"#ede8d8",fontFamily:"Georgia,serif",maxWidth:480,margin:"0 auto"}}>
      <div style={{padding:"0 16px 100px"}}>

        {/* HEADER */}
        <div style={{paddingTop:16,paddingBottom:14,marginBottom:4,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(126,200,80,.1)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,background:"linear-gradient(145deg,#7ec850,#a3d96e)",clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🐄</div>
            <div>
              <div style={{fontSize:20,color:"#7ec850",letterSpacing:3,lineHeight:1}}>AgroMind Pro</div>
              <div style={{fontFamily:"monospace",fontSize:9,color:"#7a9668",letterSpacing:1.5}}>SISTEMA EXPERTO · CRÍA BOVINA</div>
            </div>
          </div>
          <div style={{fontFamily:"monospace",fontSize:9,color:"#7ec850",background:"rgba(126,200,80,.06)",border:"1px solid rgba(126,200,80,.2)",borderRadius:4,padding:"4px 8px"}}>● ACTIVO</div>
        </div>

        {/* TABS */}
        <div style={{display:"flex",borderBottom:"1px solid rgba(126,200,80,.09)",marginBottom:16,gap:0}}>
          {[["analisis","⚡ Análisis"],["planilla","📋 Productores"],["marco","🧠 Marco"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,background:"transparent",border:"none",borderBottom:tab===id?"2px solid #7ec850":"2px solid transparent",color:tab===id?"#7ec850":"#7a9668",fontFamily:"monospace",fontSize:11,letterSpacing:1,textTransform:"uppercase",padding:"10px 4px",cursor:"pointer",marginBottom:-1}}>{label}</button>
          ))}
        </div>

        {tab==="analisis"&&(<div>
          {/* BARRA DE PROGRESO */}
          <div style={{display:"flex",gap:4,marginBottom:16}}>
            {PASOS.map((p,i)=>(
              <button key={i} onClick={()=>setStep(i)} style={{flex:1,background:i===step?"rgba(126,200,80,.15)":i<step?"rgba(126,200,80,.08)":"transparent",border:i===step?"1px solid rgba(126,200,80,.4)":"1px solid rgba(126,200,80,.08)",borderRadius:8,color:i===step?"#7ec850":i<step?"rgba(126,200,80,.6)":"#3e5230",fontFamily:"monospace",fontSize:9,padding:"8px 2px",cursor:"pointer",textAlign:"center",lineHeight:1.3}}>
                {p.split(" ")[0]}<br/><span style={{fontSize:8}}>{p.split(" ").slice(1).join(" ")}</span>
              </button>
            ))}
          </div>

          <div style={{fontFamily:"monospace",fontSize:13,color:"#7ec850",marginBottom:14,letterSpacing:1}}>{PASOS[step]}</div>

          {renderPaso()}

          {/* NAVEGACIÓN */}
          <div style={{display:"flex",gap:10,marginTop:16}}>
            {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,background:"transparent",border:"1px solid rgba(126,200,80,.2)",borderRadius:12,color:"#7ec850",padding:"16px",fontFamily:"monospace",fontSize:14,cursor:"pointer"}}>← Anterior</button>}
            {step<4&&<button onClick={()=>setStep(s=>s+1)} style={{flex:2,background:"#7ec850",color:"#070d03",border:"none",borderRadius:12,padding:"16px",fontFamily:"monospace",fontSize:14,fontWeight:700,cursor:"pointer"}}>Siguiente →</button>}
          </div>
        </div>)}

        {tab==="planilla"&&renderPlanilla()}

        {tab==="marco"&&<div>
          {[
            ["📅 Destete","#d4952a","rgba(212,149,42,.3)","Destete Feb = palanca principal. Recuperación CC válida HASTA disparador (temp <15°C para C4). Post-disparador: pérdida según NDVI. El expeller NO compensa lactancia con ternero."],
            ["🌡️ Disparador <15°C","#c04820","rgba(192,72,32,.2)","Para megatérmicas C4, temperatura <15°C es el disparador principal. Crecimiento y calidad caen abruptamente. Helada confirma. Sequía puede anticiparlo."],
            ["🛰 NDVI — Actividad Fotosintética","#7ec850","rgba(126,200,80,.15)","NDVI = proxy de actividad fotosintética estimada. NO mide PPNA ni calidad directamente. La fenología observada en campo es el dato primario de calidad HOY. NDVI ayuda a proyectar hacia adelante."],
            ["🌊 ENSO","#3a8fb5","rgba(58,143,181,.2)","El Niño → +25% precipitaciones NEA → mayor oferta. La Niña → −25% → déficits anticipados. Modifica la curva de oferta anual del sistema."],
            ["📊 Balance Sistema","#7ec850","rgba(126,200,80,.15)","Gráfico: Mcal/día totales. Demanda = categorías × N° cabezas. Oferta pasto = ha × prod C4 × factores (temp, precip, NDVI, ENSO). CC endógena en Mcal/día."],
          ].map(([t,c,b,d])=>(
            <div key={t} style={{background:"#141a09",border:`1px solid ${b}`,borderRadius:12,padding:14,marginBottom:10}}>
              <div style={{fontFamily:"monospace",fontSize:12,color:c,marginBottom:6,letterSpacing:1}}>{t}</div>
              <div style={{fontSize:13,color:"#7a9668",lineHeight:1.7}}>{d}</div>
            </div>
          ))}
        </div>}

      </div>

      {/* BOTTOM NAV fija */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#0c1208",borderTop:"1px solid rgba(126,200,80,.1)",display:"flex",zIndex:100}}>
        {[["analisis","⚡","Análisis"],["planilla","📋","Datos"],["marco","🧠","Marco"]].map(([id,ic,lb])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,background:"transparent",border:"none",color:tab===id?"#7ec850":"#3e5230",padding:"12px 4px 16px",fontFamily:"monospace",fontSize:10,cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:2}}>{ic}</div>{lb}
          </button>
        ))}
      </div>

      <style>{`@keyframes scan{0%{left:-40%}100%{left:110%}} select option{background:#1a2210} *{box-sizing:border-box} input[type=number]{-moz-appearance:textfield} input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}`}</style>
    </div>
  );
}
