"use client";

// ═══════════════════════════════════════════════════════════════════
// lib/persistencia.js
// Hook y panel para persistencia local de establecimientos
// ═══════════════════════════════════════════════════════════════════

import React from "react";
import { FORM_DEF, T as C } from "./constantes";

const STORAGE_KEY_FORM    = "calfai_form_draft";
const STORAGE_KEY_HIST    = "calfai_historial";
const MAX_HISTORIAL       = 20;

function usePersistencia(form, setForm) {
  // Guardar borrador automáticamente
  const guardarBorrador = React.useCallback(() => {
    try {
      const draft = { ...form, _guardadoEn: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY_FORM, JSON.stringify(draft));
    } catch(e) {}
  }, [form]);

  // Restaurar borrador al cargar
  const restaurarBorrador = React.useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FORM);
      if (!raw) return false;
      const draft = JSON.parse(raw);
      if (!draft || !draft.vacasN) return false;
      setForm(f => ({ ...f, ...draft }));
      return draft;
    } catch(e) { return false; }
  }, [setForm]);

  // Guardar en historial (visita completa)
  const guardarEnHistorial = React.useCallback((formData, motor, resultado) => {
    try {
      const raw  = localStorage.getItem(STORAGE_KEY_HIST);
      const hist = raw ? JSON.parse(raw) : [];
      const entrada = {
        id:           Date.now(),
        fecha:        new Date().toISOString(),
        productor:    formData.nombreProductor || "Sin nombre",
        localidad:    formData.localidad || formData.provincia || "",
        vacasN:       formData.vacasN,
        prenezEst:    motor?.tray?.pr || 0,
        ccServ:       motor?.tray?.ccServ || 0,
        mesesDeficit: [5,6,7].filter(i => (motor?.balanceMensual?.[i]?.balance ?? 0) < 0).length,
        nivelRiesgo:  motor?.nivelRiesgo || "—",
        colorRiesgo:  motor?.colorRiesgo || "#888",
        tieneResultado: !!resultado,
        form:         formData,  // snapshot completo del form
      };
      // Deduplicar por productor + fecha (mismo día = actualizar)
      const mismoProductor = hist.findIndex(h =>
        h.productor === entrada.productor &&
        h.fecha.slice(0,10) === entrada.fecha.slice(0,10)
      );
      if (mismoProductor >= 0) hist[mismoProductor] = entrada;
      else hist.unshift(entrada);
      // Limitar
      if (hist.length > MAX_HISTORIAL) hist.splice(MAX_HISTORIAL);
      localStorage.setItem(STORAGE_KEY_HIST, JSON.stringify(hist));
      return entrada.id;
    } catch(e) { return null; }
  }, []);

  // Leer historial
  const leerHistorial = React.useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HIST);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }, []);

  // Cargar visita anterior
  const cargarVisita = React.useCallback((entrada) => {
    try {
      if (entrada?.form) {
        setForm({ ...FORM_DEF, ...entrada.form });
        return true;
      }
      return false;
    } catch(e) { return false; }
  }, [setForm]);

  // Limpiar borrador
  const limpiarBorrador = React.useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY_FORM); } catch(e) {}
  }, []);

  return { guardarBorrador, restaurarBorrador, guardarEnHistorial,
           leerHistorial, cargarVisita, limpiarBorrador };
}

// Panel de historial — modal liviano
function PanelHistorial({ onCargar, onCerrar, C }) {
  const [hist, setHist] = React.useState([]);
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HIST);
      setHist(raw ? JSON.parse(raw) : []);
    } catch(e) { setHist([]); }
  }, []);

  const MESES_CORTO = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const fmtFecha = (iso) => {
    const d = new Date(iso);
    return `${d.getDate()} ${MESES_CORTO[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
      zIndex:999, display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onCerrar}>
      <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:16,
        padding:"20px 20px 16px", width:"min(420px,94vw)", maxHeight:"80vh",
        overflowY:"auto", boxShadow:"0 8px 32px rgba(0,0,0,0.18)" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          marginBottom:14 }}>
          <div style={{ fontFamily:C.font, fontSize:11, color:C.textFaint,
            letterSpacing:1 }}>ESTABLECIMIENTOS RECIENTES</div>
          <button onClick={onCerrar}
            style={{ background:"none", border:"none", color:C.textDim,
              fontSize:16, cursor:"pointer", padding:"2px 6px" }}>✕</button>
        </div>
        {hist.length === 0 ? (
          <div style={{ fontFamily:C.sans, fontSize:12, color:C.textDim,
            textAlign:"center", padding:"20px 0" }}>
            Sin establecimientos guardados aún
          </div>
        ) : hist.map((h,i) => (
          <div key={h.id} onClick={() => { onCargar(h); onCerrar(); }}
            style={{ padding:"10px 12px", borderRadius:10, marginBottom:6,
              background:C.card2, border:"1px solid "+C.border,
              cursor:"pointer", transition:"border-color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor=C.blue}
            onMouseLeave={e => e.currentTarget.style.borderColor=C.border}>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"flex-start" }}>
              <div>
                <div style={{ fontFamily:C.sans, fontSize:13, fontWeight:500,
                  color:C.text, marginBottom:2 }}>
                  {h.productor || "Sin nombre"}
                </div>
                <div style={{ fontFamily:C.font, fontSize:9, color:C.textDim }}>
                  {h.localidad && h.localidad + " · "}{fmtFecha(h.fecha)}
                </div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontFamily:C.font, fontSize:18, fontWeight:700,
                  color: h.prenezEst >= 75 ? C.green : h.prenezEst >= 60 ? C.amber : C.red,
                  lineHeight:1 }}>{h.prenezEst || "—"}%</div>
                <div style={{ fontFamily:C.font, fontSize:8, color:C.textFaint }}>
                  preñez · {h.vacasN || "?"} vac
                </div>
              </div>
            </div>
            {h.mesesDeficit > 0 && (
              <div style={{ marginTop:4, fontFamily:C.font, fontSize:8,
                color:C.amber }}>
                ⚡ déficit {h.mesesDeficit}/3 meses inv · CC serv {h.ccServ?.toFixed?.(1)||"—"}
              </div>
            )}
          </div>
        ))}
        <div style={{ marginTop:10, fontFamily:C.font, fontSize:8,
          color:C.textFaint, textAlign:"center" }}>
          Guardado localmente en este dispositivo
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// INDICADOR REAL vs ESTIMADO
// Calcula un score de confianza del diagnóstico según cuántos datos
// críticos fueron cargados vs cuántos son valores por defecto.
// ═══════════════════════════════════════════════════════════════════
function calcConfianzaDiagnostico(form, motor) {
  const checks = [
    // Datos críticos — peso 3
    { campo:"vacasN",      peso:3, label:"N° vacas",       ok: !!form.vacasN && parseFloat(form.vacasN) > 0 },
    { campo:"distribucionCC", peso:3, label:"CC del rodeo", ok: (form.distribucionCC||[]).some(d => parseFloat(d.pct)>0) },
    { campo:"iniServ",     peso:3, label:"Fechas servicio", ok: !!form.iniServ && !!form.finServ },
    { campo:"biotipo",     peso:2, label:"Biotipo",         ok: !!form.biotipo },
    // Datos importantes — peso 2
    { campo:"supHa",       peso:2, label:"Hectáreas",       ok: !!form.supHa && parseFloat(form.supHa) > 0 },
    { campo:"fenologia",   peso:2, label:"Fenología pasto", ok: !!form.fenologia },
    { campo:"destTrad",    peso:2, label:"Modalidad destete", ok: (parseFloat(form.destTrad)||0)+(parseFloat(form.destAntic)||0)+(parseFloat(form.destHiper)||0) === 100 },
    { campo:"pvVacaAdulta",peso:2, label:"PV vaca",         ok: !!form.pvVacaAdulta && parseFloat(form.pvVacaAdulta) > 0 },
    // Datos útiles — peso 1
    { campo:"sanVacunas",  peso:1, label:"Sanidad",         ok: !!form.sanVacunas },
    { campo:"aguaTDS",     peso:1, label:"Calidad agua",    ok: !!form.aguaTDS && parseFloat(form.aguaTDS) > 0 },
    { campo:"torosCC",     peso:1, label:"CC toros",        ok: !!form.torosCC && parseFloat(form.torosCC) > 0 },
    { campo:"vegetacion",  peso:1, label:"Tipo vegetación", ok: !!form.vegetacion },
    { campo:"enso",        peso:1, label:"ENSO/Clima",      ok: !!form.enso },
    { campo:"prenez",      peso:1, label:"Preñez histórica",ok: !!form.prenez && parseFloat(form.prenez) > 0 },
  ];

  const total    = checks.reduce((s,c) => s + c.peso, 0);
  const cargados = checks.reduce((s,c) => s + (c.ok ? c.peso : 0), 0);
  const score    = Math.round(cargados / total * 100);

  const faltantes = checks.filter(c => !c.ok && c.peso >= 2).map(c => c.label);

  const nivel = score >= 85 ? "alto" : score >= 60 ? "medio" : "bajo";
  const color = score >= 85 ? "#639922" : score >= 60 ? "#BA7517" : "#A32D2D";
  const label = score >= 85 ? "Alta confianza" : score >= 60 ? "Confianza media" : "Datos incompletos";

  return { score, nivel, color, label, faltantes, checks };
}

export { usePersistencia, PanelHistorial,
         STORAGE_KEY_FORM, STORAGE_KEY_HIST };
