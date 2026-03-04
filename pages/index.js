daily;
      const p7=d.precipitation_sum.slice(-7).reduce((a,b)=>a+(b||0),0);
      const p30=d.precipitation_sum.slice(0,30).reduce((a,b)=>a+(b||0),0);
      const tArr=d.temperature_2m_max.slice(-7).map((t,i)=>(t+(d.temperature_2m_min[d.temperature_2m_min.length-7+i]||t))/2);
      const temp=tArr.reduce((a,b)=>a+b,0)/tArr.length;
      const et=d.et0_fao_evapotranspiration.slice(-7).reduce((a,b)=>a+(b||0),0)/7;
      const deficit=Math.round((p30-et*30)*10)/10;
      const ndvi=estNDVI(p30,temp,zona,mes);
      const cond=ndvi>0.55?"Excelente":ndvi>0.40?"Buena":ndvi>0.25?"Moderada":ndvi>0.15?"Baja":"Muy baja";
      const clima=deficit<-40?"Seco (déficit hídrico)":deficit>40?"Húmedo (exceso)":"Normal";
      setSat({ndvi:ndvi.toFixed(2),temp:temp.toFixed(1),p7:Math.round(p7),p30:Math.round(p30),et:et.toFixed(1),deficit,cond,clima});
      setForm(f=>({...f,clima}));
    } catch(e){console.error("Sat error:",e);}
    finally{setSatLoading(false);}
  };

  const saveProductor = (informe) => {
    if (!form.nombreProductor.trim()) return;
    const registro = {
      nombre:form.nombreProductor,zona:form.zona,provincia:form.provincia,mes:form.mes,
      clima:form.clima,ndvi:sat?.ndvi||"",supHa:form.supHa,vegetacion:form.vegetacion,
      fenologia:form.fenologia,estadoDestete:form.estadoDestete,ccActual:form.ccActual,
      diasParto:form.diasParto,pVacas:form.pVacas,eReprod:form.eReprod,
      vacasN:form.vacasN,ternerosN:form.ternerosN,torosN:form.torosN,
      prenezHist:form.prenezHist,pctDestete:form.pctDestete,
      v2sN:form.v2sN,v2sPV:form.v2sPV,v2sCC:form.v2sCC,v2sTernero:form.v2sTernero,
      vaq1N:form.vaq1N,vaq1PV:form.vaq1PV,vaq1GDP:form.vaq1GDP,
      vaq2N:form.vaq2N,vaq2PV:form.vaq2PV,diasEntore:form.diasEntore,
      suplem:form.suplem,ccParto:ccParto||"",prenezEst:curva?.pr||"",
      informe:informe?.slice(0,300)||"",fechaVisita:new Date().toLocaleDateString("es-AR"),
    };
    const existing = productores.filter(p=>p.nombre!==form.nombreProductor);
    const updated = [registro,...existing];
    setProductores(updated);
    try{localStorage.setItem("agm_productores",JSON.stringify(updated));}catch(e){}
  };

  const exportCSV = () => {
    if (!productores.length){alert("Sin datos guardados aún.");return;}
    const cols=["nombre","zona","provincia","mes","clima","ndvi","supHa","vegetacion","fenologia",
      "estadoDestete","ccActual","diasParto","pVacas","eReprod","vacasN","ternerosN","torosN",
      "prenezHist","pctDestete","v2sN","v2sPV","v2sCC","v2sTernero",
      "vaq1N","vaq1PV","vaq1GDP","vaq2N","vaq2PV","diasEntore","suplem",
      "ccParto","prenezEst","informe","fechaVisita"];
    const header=cols.join(",");
    const rows=productores.map(p=>cols.map(c=>`"${String(p[c]||"").replace(/"/g,'""')}"`).join(","));
    const csv=[header,...rows].join("\n");
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download=`agromind_productores_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const buildPrompt = () => {
    let t="Análisis técnico completo de este sistema ganadero:\n\n";
    if (coords) t+=`UBICACIÓN: ${coords.lat.toFixed(4)}°S ${coords.lon.toFixed(4)}°W · Zona: ${form.zona}${form.provincia?' · '+form.provincia:''}\n`;
    if (sat) t+=`DATOS SATELITALES: NDVI ${sat.ndvi} (${sat.cond}) · Temp ${sat.temp}°C · Precip 7d: ${sat.p7}mm · 30d: ${sat.p30}mm · Balance: ${sat.deficit>0?'+':''}${sat.deficit}mm · Clima: ${sat.clima}\n`;
    t+=`\nDESTETE: ${form.estadoDestete} · Pastizal post-destete: ${form.pastoCal}\n`;
    t+=`CC actual: ${form.ccActual}/9 · Días al parto: ${form.diasParto} · PV vaca: ${form.pVacas} kg · Estado reproductivo: ${form.eReprod}\n`;
    if (ccParto) t+=`CC proyectada al parto: ${ccParto}/9 → CC serv: ${curva?.ccS} → Preñez estimada: ${curva?.pr}%\n`;
    if (form.estadoDestete==="no_ternero") t+="⚠️ TERNERO AÚN AL PIE — déficit activo 6–8 Mcal/día\n";
    t+=`\nVACA 2°SERV: N° ${form.v2sN} · PV ${form.v2sPV} kg · CC ${form.v2sCC}/9 · Ternero: ${form.v2sTernero}\n`;
    if (form.v2sTernero==="si") t+="⚠️ Destete precoz obligatorio — triple demanda imposible\n";
    t+=`\nAMBIENTE: Zona ${form.zona} · Provincia ${form.provincia} · Mes ${form.mes} · Clima ${form.clima}\n`;
    t+=`Vegetación: ${form.vegetacion} · Fenología: ${form.fenologia} · Superficie: ${form.supHa} ha\n`;
    t+=`\nVACAS: N° ${form.vacasN} · Estado reproductivo: ${form.eReprod} · Terneros ${form.ternerosN} · Preñez hist ${form.prenezHist}% · % Destete ${form.pctDestete}%\n`;
    t+=`VAQ REP 1°: N° ${form.vaq1N} · PV ${form.vaq1PV} kg · GDP ${form.vaq1GDP} g/d\n`;
    t+=`VAQ REP 2°: N° ${form.vaq2N} · PV ${form.vaq2PV} kg · Días entore ${form.diasEntore} · Tendencia ${form.tendPeso}\n`;
    if (form.suplem) t+=`Suplementación: ${form.suplem}\n`;
    if (form.consulta) t+=`\nCONSULTA: ${form.consulta}\n`;
    t+="\nEstructura 7 secciones. Destete como eje. Proyectar CC parto → preñez → terneros. Vaca 2°serv: categoría crítica. Dosis exactas con fórmulas.";
    return t;
  };

  const MSGS=["Evaluando estado del destete...","Proyectando CC al parto y servicio...","Calculando impacto en preñez y terneros...","Analizando vaca 2° servicio...","Conectando fenología con requerimiento...","Calculando dosis exactas...","Redactando informe técnico..."];

  const runAnalysis = async () => {
    setLoading(true);setResult("");let mi=0;
    const iv=setInterval(()=>{setLoadMsg(MSGS[mi%MSGS.length]);mi++;},2000);
    try {
      const res=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:buildPrompt(),systemPrompt:SYS})});
      const data=await res.json();
      if (!res.ok) throw new Error(data.error||"Error");
      setResult(data.result);
      saveProductor(data.result);
    } catch(e){setResult("❌ Error: "+e.message);}
    finally{clearInterval(iv);setLoading(false);}
  };

  const renderResult = (t) => t
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")
    .replace(/(1️⃣|2️⃣|3️⃣|4️⃣|5️⃣|6️⃣|7️⃣)\s*([^\n]+)/g,'<div style="font-family:monospace;font-size:.9rem;letter-spacing:1.5px;color:#7ec850;margin:18px 0 7px;border-left:3px solid #7ec850;padding-left:10px">$1 $2</div>')
    .replace(/\n\n/g,"<br/><br/>").replace(/\n/g,"<br/>");

  const I={width:"100%",background:"rgba(0,0,0,.4)",border:"1px solid rgba(126,200,80,.15)",borderRadius:4,color:"#ede8d8",padding:"7px 10px",fontSize:".82rem",fontFamily:"Georgia,serif"};
  const L={fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,display:"block",marginBottom:4};
  const P={background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:8,padding:18,marginBottom:14};

  const prenezColor=!curva?"#7a9668":curva.pr>=75?"#7ec850":curva.pr>=55?"#d4952a":"#c04820";
  const ccPartoColor=!ccParto?"#7a9668":ccParto>=5.5?"#7ec850":ccParto>=5.0?"#d4952a":"#c04820";

  return (
    <div style={{background:"#0c1208",minHeight:"100vh",color:"#ede8d8",fontFamily:"Georgia,serif"}}>
      <div style={{maxWidth:960,margin:"0 auto",padding:"0 16px 80px"}}>

        {/* HEADER */}
        <div style={{borderBottom:"1px solid rgba(126,200,80,.1)",paddingBottom:16,marginBottom:20,paddingTop:24,display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:48,height:48,background:"linear-gradient(145deg,#7ec850,#a3d96e)",clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🐄</div>
            <div>
              <div style={{fontFamily:"Georgia,serif",fontSize:"1.8rem",color:"#7ec850",letterSpacing:4,lineHeight:1}}>AgroMind Pro</div>
              <div style={{fontFamily:"monospace",fontSize:".55rem",color:"#7a9668",letterSpacing:2,marginTop:4}}>SISTEMA EXPERTO · CRÍA BOVINA EXTENSIVA · ARGENTINA</div>
            </div>
          </div>
          <div style={{fontFamily:"monospace",fontSize:".6rem",color:"#7ec850",background:"rgba(126,200,80,.06)",border:"1px solid rgba(126,200,80,.2)",borderRadius:3,padding:"6px 12px"}}>● ACTIVO · Claude Sonnet</div>
        </div>

        {/* KPI BAR */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:7,marginBottom:16}}>
          {[
            ["Zona",form.zona?`${form.zona}${form.provincia?' · '+form.provincia.slice(0,4):''}` :"—",""],
            ["NDVI",sat?sat.ndvi+" ("+sat.cond.slice(0,3)+")":"—",""],
            ["Temp °C",sat?sat.temp+"°C":"—",""],
            ["Precip 30d",sat?sat.p30+" mm":"—",""],
            ["CC Parto",ccParto?ccParto+"/9":"—",ccPartoColor],
            ["Preñez Est.",curva?curva.pr+"%":"—",prenezColor],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:5,padding:"8px 6px",textAlign:"center"}}>
              <div style={{fontFamily:"monospace",fontSize:".48rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,marginBottom:3}}>{l}</div>
              <div style={{fontFamily:"monospace",fontSize:".9rem",color:c||"#7ec850",fontWeight:600}}>{v}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{display:"flex",borderBottom:"1px solid rgba(126,200,80,.09)",marginBottom:18,gap:2,flexWrap:"wrap"}}>
          {[["analisis","⚡ Análisis"],["planilla","📋 Productores"],["marco","🧠 Marco Técnico"]].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)} style={{background:"transparent",border:"none",borderBottom:tab===id?"2px solid #7ec850":"2px solid transparent",color:tab===id?"#7ec850":"#7a9668",fontFamily:"monospace",fontSize:".57rem",letterSpacing:1.5,textTransform:"uppercase",padding:"8px 14px",cursor:"pointer",marginBottom:-1}}>
              {label}
            </button>
          ))}
        </div>

        {tab==="analisis" && (
          <div>
            {/* NOMBRE PRODUCTOR */}
            <div style={P}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#7ec850",marginBottom:12}}>👤 PRODUCTOR</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
                <div><label style={L}>Nombre / Establecimiento</label>
                  <input value={form.nombreProductor} onChange={e=>set("nombreProductor",e.target.value)} placeholder="Ej: Juan Pérez — Campo La Esperanza" style={I}/></div>
              </div>
            </div>

            {/* UBICACIÓN + MAPA */}
            <div style={P}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#7ec850",marginBottom:10}}>📍 UBICACIÓN DEL CAMPO</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                <button onClick={getGPS} disabled={gpsLoading} style={{background:"rgba(126,200,80,.1)",border:"1px solid rgba(126,200,80,.3)",borderRadius:4,color:"#7ec850",padding:"8px 16px",fontFamily:"monospace",fontSize:".62rem",cursor:"pointer"}}>
                  {gpsLoading?"📍 Localizando...":"📍 Usar GPS"}
                </button>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap",marginBottom:12}}>
                <div><label style={L}>Latitud (negativa)</label>
                  <input type="number" value={manualLat} onChange={e=>setManualLat(e.target.value)} placeholder="-27.45" style={{...I,width:140}}/></div>
                <div><label style={L}>Longitud (negativa)</label>
                  <input type="number" value={manualLon} onChange={e=>setManualLon(e.target.value)} placeholder="-59.12" style={{...I,width:140}}/></div>
                <button onClick={setManual} style={{background:"rgba(126,200,80,.1)",border:"1px solid rgba(126,200,80,.3)",borderRadius:4,color:"#7ec850",padding:"8px 14px",fontFamily:"monospace",fontSize:".62rem",cursor:"pointer",marginBottom:1}}>
                  FIJAR
                </button>
              </div>
              {coords && (
                <div>
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon-0.15}%2C${coords.lat-0.15}%2C${coords.lon+0.15}%2C${coords.lat+0.15}&layer=mapnik&marker=${coords.lat}%2C${coords.lon}`}
                    style={{width:"100%",height:220,border:"1px solid rgba(126,200,80,.2)",borderRadius:6,marginBottom:10}}
                    loading="lazy"
                  />
                  <div style={{fontFamily:"monospace",fontSize:".6rem",color:"#7a9668",display:"flex",gap:16,flexWrap:"wrap"}}>
                    <span>📌 {coords.lat.toFixed(4)}°S · {coords.lon.toFixed(4)}°W</span>
                    <span>🗺 {coords.zona}{coords.prov?' · '+coords.prov:''}</span>
                    <span>📡 {coords.src}</span>
                  </div>
                </div>
              )}
              {satLoading && <div style={{fontFamily:"monospace",fontSize:".6rem",color:"#7ec850",marginTop:8}}>🛰 Consultando Open-Meteo...</div>}
              {sat && (
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:6,marginTop:10}}>
                  {[["NDVI Est.",sat.ndvi,"#7ec850"],["Condición",sat.cond,"#7ec850"],["Temp °C",sat.temp,"#d4952a"],["Precip 7d",sat.p7+" mm","#3a8fb5"],["Precip 30d",sat.p30+" mm","#3a8fb5"],["Balance",( sat.deficit>0?"+":"")+sat.deficit+" mm",sat.deficit<-30?"#c04820":sat.deficit>30?"#3a8fb5":"#d4952a"],["ET₀ mm/d",sat.et,"#d4952a"],["Clima",sat.clima,"#7a9668"]].map(([l,v,c])=>(
                    <div key={l} style={{textAlign:"center",background:"rgba(0,0,0,.3)",borderRadius:5,padding:"7px 4px",border:"1px solid rgba(126,200,80,.09)"}}>
                      <div style={{fontFamily:"monospace",fontSize:".48rem",color:"#7a9668",marginBottom:2}}>{l}</div>
                      <div style={{fontFamily:"monospace",fontSize:".72rem",color:c,fontWeight:600}}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DESTETE */}
            <div style={{...P,border:"1px solid rgba(212,149,42,.28)",background:"rgba(212,149,42,.04)"}}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#d4952a",marginBottom:6}}>📅 DESTETE — EJE DEL SISTEMA</div>
              <div style={{fontFamily:"monospace",fontSize:".52rem",color:"rgba(212,149,42,.6)",lineHeight:1.7,marginBottom:14}}>
                Plan A: Destete en febrero → −6–8 Mcal/día + rebrote otoñal → recuperación CC al parto.<br/>
                La recuperación depende del pastizal y tamaño del animal. El expeller no reemplaza el destete.
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:10}}>
                {[["estadoDestete","Estado del Destete",[["","Seleccionar..."],["ok_feb","✅ Realizado en Febrero"],["ok_mar","✅ Realizado en Marzo"],["tard_abr","⚠️ Tardío — Abril"],["no_ternero","🔴 No — ternero al pie"],["precoz","⚡ Destete precoz activo"],["planif","📋 Planificando"]]],
                  ["pastoCal","Pastizal Post-destete",[["","—"],["excelente","Excelente — rebrote abundante"],["bueno","Bueno — rebrote normal"],["regular","Regular — rebrote escaso"],["malo","Malo — sin rebrote"]]],
                  ["eReprod","Estado Reproductivo",[["","—"],...ESTADOS_REPROD.map(e=>[e,e])]]
                ].map(([k,l,opts])=>(
                  <div key={k}><label style={L}>{l}</label>
                    <select value={form[k]} onChange={e=>set(k,e.target.value)} style={I}>
                      {opts.map(([v,t])=><option key={v} value={v}>{t}</option>)}
                    </select></div>
                ))}
                {[["ccActual","CC Actual (1–9)","4.5"],["diasParto","Días al Parto","90"],["pVacas","Peso Vaca (kg)","380"]].map(([k,l,p])=>(
                  <div key={k}><label style={L}>{l}</label>
                    <input type="number" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={`Ej: ${p}`} style={I}/></div>
                ))}
              </div>
              {ccParto && curva && (
                <div style={{marginTop:14,background:"rgba(0,0,0,.25)",border:"1px solid rgba(126,200,80,.2)",borderRadius:6,padding:"12px 14px",fontFamily:"monospace",fontSize:".65rem",lineHeight:2}}>
                  <span style={{color:"#7ec850"}}>▸ PROYECCIÓN: </span>
                  CC parto: <strong style={{color:ccPartoColor}}>{ccParto}/9</strong>
                  {" → "} CC serv: <strong style={{color:prenezColor}}>{curva.ccS}/9</strong>
                  {" → "} Preñez: <strong style={{color:prenezColor}}>{curva.pr}%</strong>
                  {curva.pr<75 && <span style={{color:"#c04820"}}> · ⚠️ {Math.round((75-curva.pr)/100*(parseInt(form.vacasN)||100))} terneros bajo objetivo 75%</span>}
                </div>
              )}
              {form.estadoDestete==="no_ternero" && (
                <div style={{marginTop:10,background:"rgba(192,72,32,.07)",border:"1px solid rgba(192,72,32,.3)",borderRadius:5,padding:"10px 12px",fontFamily:"monospace",fontSize:".63rem",color:"#e09070"}}>
                  🔴 TERNERO AL PIE — 6–8 Mcal/día consumidos en lactancia. <strong style={{color:"#c04820"}}>Destete precoz: única solución.</strong>
                </div>
              )}
            </div>

            {/* VACA 2° SERVICIO */}
            <div style={{...P,border:"1px solid rgba(136,102,204,.28)",background:"rgba(136,102,204,.04)"}}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#8866cc",marginBottom:6}}>⚠️ VACA DE 2° SERVICIO — CATEGORÍA CRÍTICA</div>
              <div style={{fontFamily:"monospace",fontSize:".52rem",color:"rgba(136,102,204,.6)",lineHeight:1.7,marginBottom:14}}>
                Triple demanda: Lactando + Creciendo + Quedar preñada. ~20–22 Mcal/día requeridos.<br/>
                <strong style={{color:"#8866cc"}}>Destete precoz = manejo estándar, independientemente de la CC.</strong>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
                {[["v2sN","N° Cabezas","30"],["v2sPV","Peso Prom (kg)","340"],["v2sCC","CC Actual (1–9)","4.5"]].map(([k,l,p])=>(
                  <div key={k}><label style={L}>{l}</label>
                    <input type="number" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={`Ej: ${p}`} style={I}/></div>
                ))}
                <div><label style={L}>¿Ternero al Pie?</label>
                  <select value={form.v2sTernero} onChange={e=>set("v2sTernero",e.target.value)} style={I}>
                    <option value="">—</option>
                    <option value="si">Sí — ternero al pie</option>
                    <option value="precoz">Destete precoz realizado</option>
                    <option value="no">No — ya destetado</option>
                  </select></div>
              </div>
              {alerta2serv && (
                <div style={{marginTop:10,background:"rgba(192,72,32,.07)",border:"1px solid rgba(192,72,32,.3)",borderRadius:5,padding:"10px 12px",fontFamily:"monospace",fontSize:".63rem",color:"#e09070",whiteSpace:"pre-line"}}>{alerta2serv}</div>
              )}
            </div>

            {/* OFERTA FORRAJERA */}
            <div style={P}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#7ec850",marginBottom:14}}>🌾 OFERTA FORRAJERA</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:10,marginBottom:14}}>
                <div><label style={L}>Zona</label>
                  <select value={form.zona} onChange={e=>set("zona",e.target.value)} style={I}>
                    {["","Pampa Húmeda","NEA","NOA","Semiárido Pampeano","Mesopotamia","Cuyo","Patagonia"].map(o=><option key={o} value={o}>{o||"Seleccionar..."}</option>)}
                  </select></div>
                <div><label style={L}>Provincia</label>
                  <select value={form.provincia} onChange={e=>set("provincia",e.target.value)} style={I}>
                    {["","Corrientes","Chaco","Formosa","Misiones","Entre Ríos","Santiago del Estero","Salta","Buenos Aires","Córdoba","Santa Fe","La Pampa","San Luis","Mendoza","Neuquén","Río Negro"].map(o=><option key={o} value={o}>{o||"Seleccionar..."}</option>)}
                  </select></div>
                <div><label style={L}>Mes</label>
                  <select value={form.mes} onChange={e=>set("mes",e.target.value)} style={I}>
                    {["","...MESES"].concat(MESES).map(o=><option key={o} value={o}>{o||"Seleccionar..."}</option>)}
                  </select></div>
                <div><label style={L}>Condición Climática</label>
                  <select value={form.clima} onChange={e=>set("clima",e.target.value)} style={I}>
                    {["","Seco (déficit hídrico)","Normal","Húmedo (exceso)","Post-sequía","Niña activa","Niño activo"].map(o=><option key={o} value={o}>{o||"Auto satélite..."}</option>)}
                  </select></div>
                <div><label style={L}>Vegetación</label>
                  <select value={form.vegetacion} onChange={e=>set("vegetacion",e.target.value)} style={I}>
                    {["","Pastizal natural NEA/Chaco","Megatérmicas (gatton panic, brachiaria)","Pasturas templadas","Mixta gramíneas+leguminosas","Monte bajo / sabana","Verdeo de invierno"].map(o=><option key={o} value={o}>{o||"Seleccionar..."}</option>)}
                  </select></div>
                <div><label style={L}>Superficie (ha)</label>
                  <input type="number" value={form.supHa} onChange={e=>set("supHa",e.target.value)} placeholder="Ej: 500" style={I}/></div>
              </div>
              <div style={{fontFamily:"monospace",fontSize:".5rem",color:"#7a9668",textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Estado Fenológico</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                {FENOLOGIAS.map(f=>(
                  <div key={f.val} onClick={()=>set("fenologia",f.val)} style={{border:form.fenologia===f.val?"1px solid #7ec850":"1px solid rgba(126,200,80,.12)",borderRadius:6,padding:"10px 12px",cursor:"pointer",background:form.fenologia===f.val?"rgba(126,200,80,.08)":"rgba(0,0,0,.15)"}}>
                    <div style={{fontFamily:"monospace",fontSize:".85rem",color:"#7ec850"}}>{f.label}</div>
                    <div style={{fontSize:".77rem",marginTop:3,color:"#ede8d8"}}>{f.desc}</div>
                    {f.warn&&<div style={{fontFamily:"monospace",fontSize:".52rem",color:"#c04820",marginTop:3}}>{f.warn}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* DEMANDA ANIMAL */}
            <div style={P}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#7ec850",marginBottom:14}}>🐮 DEMANDA ANIMAL</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
                {[["vacasN","N° Vacas Adultas","150"],["ternerosN","N° Terneros al Pie","120"],["torosN","N° Toros","8"],["prenezHist","Preñez Último Año %","72"],["pctDestete","% Destete","68"],["vaq1N","Vaq Rep 1° N°","40"],["vaq1PV","Vaq Rep 1° PV (kg)","185"],["vaq1GDP","Vaq Rep 1° GDP (g/d)","600"],["vaq2N","Vaq Rep 2° N°","35"],["vaq2PV","Vaq Rep 2° PV (kg)","290"],["diasEntore","Días al Entore","45"]].map(([k,l,p])=>(
                  <div key={k}><label style={L}>{l}</label>
                    <input type="number" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={`Ej: ${p}`} style={I}/></div>
                ))}
                <div><label style={L}>Tendencia Vaq Rep 2°</label>
                  <select value={form.tendPeso} onChange={e=>set("tendPeso",e.target.value)} style={I}>
                    <option value="">—</option><option>Ganando peso</option><option>Peso estable</option><option>Perdiendo peso</option>
                  </select></div>
                <div><label style={L}>Suplementación Actual</label>
                  <select value={form.suplem} onChange={e=>set("suplem",e.target.value)} style={I}>
                    <option value="">Sin suplementar</option><option>Expeller proteico</option><option>Grano energético</option><option>Semilla de algodón</option><option>Mixtura E+P</option><option>Núcleo mineral</option>
                  </select></div>
              </div>
            </div>

            {/* CONSULTA */}
            <div style={P}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#7ec850",marginBottom:10}}>💬 CONSULTA ESPECÍFICA</div>
              <textarea value={form.consulta} onChange={e=>set("consulta",e.target.value)} placeholder="Describí la situación o pregunta técnica puntual..." rows={4} style={{...I,lineHeight:1.7,resize:"vertical"}}/>
            </div>

            {/* BOTONES */}
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
              <button onClick={runAnalysis} disabled={loading} style={{background:loading?"#3e5230":"#7ec850",color:"#070d03",border:"none",borderRadius:4,padding:"12px 28px",fontFamily:"monospace",fontSize:"1rem",letterSpacing:2.5,cursor:loading?"not-allowed":"pointer",fontWeight:700}}>
                {loading?"⏳ PROCESANDO...":"⚡ ANALIZAR SISTEMA"}
              </button>
              <button onClick={()=>setForm(f=>({...f,estadoDestete:"",pastoCal:"",pVacas:"",ccActual:"",diasParto:"",eReprod:"",v2sN:"",v2sPV:"",v2sCC:"",v2sTernero:"",zona:"",provincia:"",mes:"",clima:"",vegetacion:"",supHa:"",fenologia:"",vacasN:"",ternerosN:"",torosN:"",prenezHist:"",pctDestete:"",vaq1N:"",vaq1PV:"",vaq1GDP:"",vaq2N:"",vaq2PV:"",diasEntore:"",tendPeso:"",suplem:"",consulta:""}))} style={{background:"transparent",border:"1px solid rgba(122,150,104,.2)",borderRadius:4,color:"#7a9668",padding:"12px 16px",fontFamily:"monospace",fontSize:".62rem",cursor:"pointer"}}>
                LIMPIAR
              </button>
            </div>

            {loading && (
              <div style={{background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:8,padding:18,marginBottom:14,display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontFamily:"monospace",fontSize:".6rem",color:"#7ec850",whiteSpace:"nowrap"}}>PROCESANDO</div>
                <div style={{flex:1,height:2,background:"rgba(126,200,80,.07)",borderRadius:1,overflow:"hidden",position:"relative"}}>
                  <div style={{position:"absolute",top:0,left:0,width:"40%",height:"100%",background:"#7ec850",borderRadius:1,animation:"scan 1.2s ease-in-out infinite"}}/>
                </div>
                <div style={{fontFamily:"monospace",fontSize:".6rem",color:"#7a9668",whiteSpace:"nowrap"}}>{loadMsg}</div>
              </div>
            )}

            {result && (
              <div style={{background:"#141a09",border:"1px solid rgba(126,200,80,.09)",borderRadius:8,padding:22,marginTop:8}}>
                <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:3,color:"#7ec850",marginBottom:14,paddingBottom:10,borderBottom:"1px solid rgba(126,200,80,.09)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                  <span>INFORME TÉCNICO DIAGNÓSTICO</span>
                  <button onClick={()=>navigator.clipboard.writeText(document.getElementById("resBox").innerText)} style={{background:"transparent",border:"1px solid rgba(126,200,80,.2)",borderRadius:3,color:"#7ec850",padding:"4px 10px",fontFamily:"monospace",fontSize:".58rem",cursor:"pointer"}}>COPIAR</button>
                </div>
                <div id="resBox" style={{fontSize:".87rem",lineHeight:1.9}} dangerouslySetInnerHTML={{__html:renderResult(result)}}/>
                {form.nombreProductor && <div style={{marginTop:12,fontFamily:"monospace",fontSize:".58rem",color:"#7a9668"}}>✅ Guardado en planilla: {form.nombreProductor}</div>}
              </div>
            )}
          </div>
        )}

        {/* PLANILLA PRODUCTORES */}
        {tab==="planilla" && (
          <div>
            <div style={P}>
              <div style={{fontFamily:"monospace",fontSize:".85rem",letterSpacing:2,color:"#7ec850",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <span>📋 PLANILLA DE PRODUCTORES</span>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={exportCSV} style={{background:"rgba(58,143,181,.1)",border:"1px solid rgba(58,143,181,.3)",borderRadius:3,color:"#3a8fb5",padding:"6px 12px",fontFamily:"monospace",fontSize:".6rem",cursor:"pointer"}}>⬇ EXPORTAR CSV</button>
                  <button onClick={()=>{if(confirm("¿Borrar todos los registros?")){{setProductores([]);localStorage.removeItem("agm_productores");}}}} style={{background:"rgba(192,72,32,.1)",border:"1px solid rgba(192,72,32,.3)",borderRadius:3,color:"#c04820",padding:"6px 12px",fontFamily:"monospace",fontSize:".6rem",cursor:"pointer"}}>🗑 LIMPIAR</button>
                </div>
              </div>
              <div style={{fontFamily:"monospace",fontSize:".55rem",color:"#7a9668",marginBottom:14}}>
                {productores.length} productor{productores.length!==1?"es":""} registrado{productores.length!==1?"s":""} · Se guarda automáticamente al analizar · 1 fila por productor
              </div>
              {productores.length===0 ? (
                <div style={{textAlign:"center",padding:"40px 20px",fontFamily:"monospace",fontSize:".7rem",color:"#3e5230"}}>
                  Sin registros aún.<br/>Completá el formulario con el nombre del productor y hacé un análisis.
                </div>
              ) : (
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"monospace",fontSize:".6rem"}}>
                    <thead>
                      <tr style={{borderBottom:"1px solid rgba(126,200,80,.2)"}}>
                        {["Productor","Zona","Provincia","Mes","Clima","NDVI","Sup (ha)","Fenología","Destete","CC Act","Días Parto","E.Reprod","Vacas N°","Preñez%","Dest%","CC Parto","Preñez Est","Últ.Visita"].map(h=>(
                          <th key={h} style={{padding:"6px 8px",color:"#7a9668",textAlign:"left",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {productores.map((p,i)=>(
                        <tr key={i} style={{borderBottom:"1px solid rgba(126,200,80,.07)",cursor:"pointer"}} onClick={()=>{setForm(f=>({...f,...p}));setTab("analisis");}}>
                          {[p.nombre,p.zona,p.provincia,p.mes,p.clima,p.ndvi,p.supHa,p.fenologia,p.estadoDestete,p.ccActual,p.diasParto,p.eReprod?.slice(0,12),p.vacasN,p.prenezHist,p.pctDestete,p.ccParto,p.prenezEst?p.prenezEst+"%":"",p.fechaVisita].map((v,j)=>(
                            <td key={j} style={{padding:"6px 8px",color:"#ede8d8",whiteSpace:"nowrap"}}>{v||"—"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{fontFamily:"monospace",fontSize:".55rem",color:"#3e5230",marginTop:8}}>Clic en una fila para cargar ese productor en el formulario</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MARCO TÉCNICO */}
        {tab==="marco" && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
            {[
              ["📅 Destete — La Palanca Central","#d4952a","rgba(212,149,42,.3)","Destete en febrero = caída −6–8 Mcal/día + rebrote otoñal. La velocidad de recuperación CC depende del pastizal y el tamaño del animal. El expeller potencia después del destete, no lo reemplaza.","Balbuena INTA (2003) · Datos campo NEA"],
              ["⚠️ Vaca de 2° Servicio","#8866cc","rgba(136,102,204,.35)","Triple demanda: lactando + creciendo + quedar preñada. ~20–22 Mcal/día requeridos. Pastizal maduro aporta 5–8 Mcal → déficit 12–17 Mcal. El destete precoz es el manejo ESTÁNDAR. Independientemente de la CC.",""],
              ["📊 Curva CC → Preñez","#7ec850","rgba(126,200,80,.2)","CC 5.5 parto → 4.0 serv → 75% (objetivo) · CC 5.0 → 3.5 → 55% · CC 4.5 → 3.0 → 35% · CC 4.0 → 2.5 → 15%. Pérdida post-parto NEA: 1.5 puntos. La palanca está en el parto, no en el servicio.","Datos campo NEA confirmados"],
              ["🌾 Fenología × Categoría","#7ec850","rgba(126,200,80,.15)",">50% floración → PB <5%. Vaq rep 1° necesita PB 900–1100 g/día. Pasto maduro aporta ~200–250 g/día → déficit 650–900 g/día.","Peruchena INTA (2003)"],
              ["📚 Fuentes Técnicas","#3a8fb5","rgba(58,143,181,.25)","NASSEM (2010) · Balbuena INTA Colonia Benítez (2003) · Peruchena INTA Corrientes (2003) · Fernández Mayer INTA Bordenave (2008) · Rosello Brajovich et al. INTA EEA CB (2025) · NRC Beef Cattle (2000)",""],
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
      <style>{`@keyframes scan{0%{left:-40%}100%{left:110%}} select option{background:#1a2210} * { box-sizing: border-box; }`}</style>
    </div>
  );
}
