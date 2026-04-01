"use client";

// ═══════════════════════════════════════════════════════════════════
// lib/constantes.js
// Datos puros — sin lógica de negocio, sin efectos secundarios
// Importar: import { BIOTIPOS, getBiotipo, SUPLEMENTOS, T, FORM_DEF,
//            MESES_NOM, CALIDAD_C4_CALIBRADA, ccPond } from "./constantes"
// ═══════════════════════════════════════════════════════════════════

// ─── BIOTIPOS ─────────────────────────────────────────────────────
const BIOTIPOS = {
  // ── Cebú puro ──────────────────────────────────────────────────
  "Brahman":              { movCC:0.70, recCC:0.85, umbralAnestro:2.8, factReq:0.90, nombre:"Brahman puro" },
  "Nelore":               { movCC:0.72, recCC:0.83, umbralAnestro:2.9, factReq:0.89, nombre:"Nelore" },
  "Indobrasil":           { movCC:0.71, recCC:0.84, umbralAnestro:2.8, factReq:0.90, nombre:"Indobrasil" },

  // ── Aberdeen Angus y cruces ─────────────────────────────────────
  "Aberdeen Angus":       { movCC:1.00, recCC:1.00, umbralAnestro:3.8, factReq:1.00, nombre:"Aberdeen Angus" },
  "Brangus 3/8":          { movCC:0.82, recCC:0.92, umbralAnestro:3.2, factReq:0.95, nombre:"Brangus 3/8 Cebú (Angus×Brahman)" },
  "Brangus 5/8":          { movCC:0.88, recCC:0.96, umbralAnestro:3.4, factReq:0.98, nombre:"Brangus 5/8 Cebú (Angus×Brahman)" },

  // ── Hereford y cruces ──────────────────────────────────────────
  "Hereford":             { movCC:0.98, recCC:0.98, umbralAnestro:3.7, factReq:1.00, nombre:"Hereford" },
  // Bradford = Hereford × Brahman
  // 3/8 Cebú: heterosis máxima — mejor adaptación al calor que Hereford puro,
  // menor sensibilidad a fotoperíodo, umbral anestro intermedio.
  // Fuente: Short et al. 1990; Neel et al. 2007; Peruchena INTA 2003
  "Bradford 3/8":         { movCC:0.83, recCC:0.91, umbralAnestro:3.1, factReq:0.94, nombre:"Bradford 3/8 Cebú (Hereford×Brahman)" },
  "Bradford 5/8":         { movCC:0.87, recCC:0.95, umbralAnestro:3.3, factReq:0.97, nombre:"Bradford 5/8 Cebú (Hereford×Brahman)" },
  // Braford (mismo fenotipo pero denominación uruguaya/brasileña — parámetros idénticos)
  "Braford 3/8":          { movCC:0.83, recCC:0.91, umbralAnestro:3.1, factReq:0.94, nombre:"Braford 3/8 Cebú (Hereford×Cebú)" },
  "Braford 5/8":          { movCC:0.87, recCC:0.95, umbralAnestro:3.3, factReq:0.97, nombre:"Braford 5/8 Cebú (Hereford×Cebú)" },

  // ── Otras razas europeas ────────────────────────────────────────
  "Limousin":             { movCC:1.02, recCC:1.01, umbralAnestro:3.9, factReq:1.02, nombre:"Limousin" },
  "Charolais":            { movCC:1.01, recCC:1.00, umbralAnestro:3.8, factReq:1.02, nombre:"Charolais" },
  "Simmental":            { movCC:0.99, recCC:0.99, umbralAnestro:3.7, factReq:1.01, nombre:"Simmental" },

  // ── Razas adaptadas tropicales ──────────────────────────────────
  "Bonsmara":             { movCC:0.80, recCC:0.90, umbralAnestro:3.1, factReq:0.93, nombre:"Bonsmara (5/8 Afrikaner × Hereford/Shorthorn)" },
  "Simbrah":              { movCC:0.81, recCC:0.90, umbralAnestro:3.0, factReq:0.93, nombre:"Simbrah (Simmental×Brahman)" },
  "Senepol":              { movCC:0.84, recCC:0.92, umbralAnestro:3.2, factReq:0.94, nombre:"Senepol" },
  "Beefmaster":           { movCC:0.80, recCC:0.89, umbralAnestro:3.0, factReq:0.92, nombre:"Beefmaster" },

  // ── Cruza comercial ─────────────────────────────────────────────
  "Cruza comercial":      { movCC:0.88, recCC:0.93, umbralAnestro:3.3, factReq:0.96, nombre:"Cruza comercial (promedio)" },
};
const BIOTIPO_DEF = BIOTIPOS["Brangus 3/8"];
const getBiotipo = (k) => BIOTIPOS[k] || BIOTIPO_DEF;

// ─── SUPLEMENTOS
const SUPLEMENTOS = {
  // ── PROTEICOS PUROS (PB ≥30%) ───────────────────────────────────
  // Indicación: pasto con PB <7% (C4 encañado >25% floración) — activan microflora ruminal
  // Efecto Detmann/NASSEM 2010: +0.4–1.0 kg MS pasto consumida por kg de suplemento proteico
  "Expeller soja":      { pb:44,  em:2.80, tipo:"P",  degProt:65, degEner:75, label:"Expeller soja" },
  "Expeller girasol":   { pb:36,  em:2.60, tipo:"P",  degProt:60, degEner:72, label:"Expeller girasol" },
  "Expeller algodón":   { pb:36,  em:2.70, tipo:"P",  degProt:60, degEner:72, label:"Expeller algodón" },
  "Semilla algodón":    { pb:23,  em:2.95, tipo:"EP", degProt:55, degEner:78, label:"Semilla algodón (bypass + grasa)" },
  "Urea tamponada":     { pb:280, em:0.00, tipo:"P",  degProt:100,degEner:0,  label:"Urea tamponada (+ azufre siempre)" },
  "Pellet girasol":     { pb:34,  em:2.55, tipo:"P",  degProt:60, degEner:70, label:"Pellet girasol" },
  "Harina sangre":      { pb:80,  em:2.20, tipo:"P",  degProt:80, degEner:60, label:"Harina de sangre (PB alta)" },
  // ── ENERGÉTICOS PUROS (PB <12%) ─────────────────────────────────
  // Indicación: pasto con PB ≥8% pero déficit energético — carga alta, alta producción
  // Frecuencia: DIARIO obligatorio (almidón — riesgo acidosis si intermitente)
  "Maíz grano":         { pb:9,   em:3.30, tipo:"E",  degProt:50, degEner:82, label:"Maíz grano (diario - acidosis si bolo)" },
  "Sorgo grano":        { pb:10,  em:3.10, tipo:"E",  degProt:52, degEner:80, label:"Sorgo grano (diario)" },
  "Afrechillo trigo":   { pb:15,  em:2.85, tipo:"E",  degProt:60, degEner:76, label:"Afrechillo de trigo" },
  "Burlanda húmeda":    { pb:26,  em:2.40, tipo:"EP", degProt:58, degEner:68, label:"Burlanda húmeda (EP - usar fresca)" },
  "Rollo silaje maíz":  { pb:8,   em:2.50, tipo:"E",  degProt:58, degEner:68, label:"Rollo/Silaje maíz" },
  // ── ENERGÉTICO-PROTEICOS (PB 12–30%) ───────────────────────────
  // Indicación: déficit mixto — pasto de baja calidad y baja cantidad simultáneamente
  "Pellet trigo":       { pb:16,  em:3.00, tipo:"EP", degProt:62, degEner:78, label:"Pellet trigo (EP - 2-3x/sem)" },
  "Mix proteico-energ": { pb:28,  em:2.90, tipo:"EP", degProt:65, degEner:76, label:"Mix proteico-energético" },
  "Núcleo proteico":    { pb:35,  em:2.70, tipo:"EP", degProt:68, degEner:72, label:"Núcleo proteico-mineral" },
  "Heno alfalfa":       { pb:18,  em:2.20, tipo:"EP", degProt:55, degEner:60, label:"Heno de alfalfa (EP)" },
};

// ─── PRODUCCIÓN BASE FORRAJERA ────────────────────────────────────
const PROD_BASE = {
  "Pastizal natural NEA/Chaco":                   14,
  "Megatérmicas C4 (gatton panic, brachiaria)":   22,
  "Pasturas templadas C3":                         16,
  "Mixta gramíneas+leguminosas":                   18,
  "Bosque nativo":                                  2.5,
  "Verdeo de invierno":                            20,
};

// ─── FACTORES AMBIENTALES ─────────────────────────────────────────
const UTIL        = 0.40;
const factorT     = (t) => t>=25?1.0 : t>=20?0.80 : t>=15?0.45 : t>=10?0.15 : 0.05;
const factorP     = (p) => p>=100?1.0 : p>=50?0.85 : p>=20?0.60 : 0.30;
const factorN     = (ndvi) => Math.min(1.5, Math.max(0.5, 0.5 + parseFloat(ndvi||0.45)*1.2));
const modENSO     = (e) => e==="nino"?1.25 : e==="nina"?0.75 : 1.0;

// ─── CLIMA HISTÓRICO POR PROVINCIA (T°C media, Precip mm/mes) ────
// ─── OFERTA MENSUAL CON VARIACIÓN ESTACIONAL ──────────────────────
// La oferta NO es plana: colapsa en invierno (T<15°C en gramíneas C4)

// ─── CALIDAD C4 CALIBRADA ─────────────────────────────────────────
// Digestibilidad por fenología — meta-análisis PMC 9311783 + Minson 1990
const CALIDAD_C4_CALIBRADA = {
  menor_10: { dig: 0.62, pb: 12, mcalKg: 2.15, label: "rebrote activo" },
  "10_25":  { dig: 0.58, pb: 9,  mcalKg: 2.05, label: "macollaje–elongación" },
  "25_50":  { dig: 0.52, pb: 6,  mcalKg: 1.85, label: "floración parcial" },
  mayor_50: { dig: 0.45, pb: 4,  mcalKg: 1.62, label: "encañado–lignificado" },
};


// ─── HELPERS CC ───────────────────────────────────────────────────
const ccPond = (dist) => {
  let s = 0, t = 0;
  (dist || []).forEach(d => { const p = parseFloat(d.pct)||0, c = parseFloat(d.cc)||0; s += p*c; t += p; });
  // Retornar promedio aunque no sume 100% — el motor debe funcionar con datos parciales
  // Si no hay ningún dato cargado, retorna 0 (fallback 4.5 en calcTrayectoriaCC)
  return t > 0 ? s / t : 0;
};
// ccPondConDatos: retorna true si hay al menos una fila con CC y % válidos
const ccPondConDatos = (dist) => (dist||[]).some(d => parseFloat(d.cc)>0 && parseFloat(d.pct)>0);
// ─── CONVERSIÓN DE ESCALA CC ──────────────────────────────────────
// escala "5" → "9": multiplica por 1.8 (Lowman→Wagner/Selk)
// escala "9" → interna: sin cambio
// Referencias: Lowman (1976) escala 1-5 · Wagner & Selk (1995) escala 1-9
// Equivalencias clínicas: CC3.0(1-5) = CC5.4(1-9) · CC2.5(1-5) = CC4.5(1-9)
const cc9 = (val, escala) => {
  const v = parseFloat(val);
  if (!v || isNaN(v)) return v;
  if (escala === "5") return Math.min(9, Math.round(v * 1.8 * 10) / 10);
  return v; // ya en escala 1-9
};
const cc5 = (val9) => {
  const v = parseFloat(val9);
  if (!v || isNaN(v)) return "—";
  return (Math.round(v / 1.8 * 10) / 10).toFixed(1);
};



const MESES_NOM = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const hist = getClima(form.provincia || "Corrientes");


const cc5 = (v9) => Math.round(parseFloat(v9) / 1.8 * 10) / 10;

// ─── TEMA DE COLORES ──────────────────────────────────────────────
const T = {
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
  sans:     "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
  radius:   14,
  r:        14,
};
const C = T; // alias — el código usa C en algunos lugares

// ─── FORM_DEF ─────────────────────────────────────────────────────
const FORM_DEF = {
  // ── Ubicación ──────────────────────────────────────────────────
  nombreProductor:"", zona:"NEA", provincia:"Corrientes", localidad:"",
  // ── Rodeo ──────────────────────────────────────────────────────
  biotipo:"Brangus 3/8", primerParto:false,
  vacasN:"", torosN:"", pvVacaAdulta:"320",
  eReprod:"Gestación media (5–7 meses)", prenez:"", pctDestete:"88",
  iniServ:"", finServ:"",
  edadPrimerEntore:"24",
  // ── Vaquillona ─────────────────────────────────────────────────
  edadVaqMayo:"", tipoDesteteVaq:"hiper",
  // ── Disponibilidad forrajera ───────────────────────────────────
  altPasto:"20", tipoPasto:"alto_denso",
  // Verdeos de invierno (nuevo v15)
  tieneVerdeo:"no", verdeoHa:"", verdeoTipo:"Avena/Cebadilla", verdeoDisp:"agosto",
  verdeoDestinoVaq:"si",   // ¿se reserva para vaquillona?
  // ── Categorías ─────────────────────────────────────────────────
  v2sN:"", v2sPV:"", v2sTernero:"",
  cc2sDist:[{ cc:"5.0", pct:"50" },{ cc:"4.5", pct:"50" }],
  pctReposicion:"20", vaq1PV:"", vaq2N:"", vaq2PV:"",
  // ── CC ─────────────────────────────────────────────────────────
  distribucionCC:[{ cc:"5.5", pct:"20" },{ cc:"5.0", pct:"50" },{ cc:"4.5", pct:"30" }],
  fechaCC:"",            // fecha en que se midió la CC (nueva v15)
  // ── Destete ────────────────────────────────────────────────────
  destTrad:"0", destAntic:"0", destHiper:"100",
  // ── Toros — diagnóstico preparo de servicio (nuevo v15) ────────
  torosLote:"si",        // ¿están todos en un lote o distribuidos?
  torosLotes:"",         // cantidad de lotes si distribuidos
  torosCC:"4.5",         // CC toros hoy (promedio)
  torosBCS_ok:"",        // % con CC ≥ 5.0 (condición óptima de servicio)
  // ── Forraje ────────────────────────────────────────────────────
  vegetacion:"Pastizal natural NEA/Chaco", fenologia:"menor_10",
  supHa:"", pctMonte:"10", pctNGan:"5",
  // ── Suplementación por categoría (sin duplicados) ──────────────
  supl1:"", dosis1:"0", supl2:"", dosis2:"0", supl3:"", dosis3:"0",
  supl_vacas:"",  dosis_vacas:"0",
  supl_v2s:"",    dosis_v2s:"0",
  supl_toros:"",  dosis_toros:"0",
  supl_vaq2:"",   dosis_vaq2:"0",
  supl_vaq1:"",   dosis_vaq1:"0",
  supl_ternero:"",dosis_ternero:"0",
  // ── Stock de alimentos (nuevo v15) ─────────────────────────────
  stockAlim:[],  // [{ alimento, toneladas }]
  // ── Sanidad ────────────────────────────────────────────────────
  sanVacunas:"si", sanBrucelosis:"si", sanAftosa:"si",
  sanToros:"con_control", sanAbortos:"no", sanPrograma:"si",
  sanParasitoExt:"", sanParasitoInt:"",
  // ── ENSO ───────────────────────────────────────────────────────
  enso:"neutro",
  // ── Agua ───────────────────────────────────────────────────────
  aguaTDS:"", aguaTipoSal:"Mixta/Desconocida", aguaFuente:"",
  // ── Visitas de campo (seguimiento temporal — nuevo v15) ────────
  visitasCampo:[],  // [{ fecha, ccObservada, observacion }]
  // ── Consulta ───────────────────────────────────────────────────
  consultaEspecifica:"",
};

export {
  BIOTIPOS, BIOTIPO_DEF, getBiotipo,
  SUPLEMENTOS,
  PROD_BASE,
  CALIDAD_C4_CALIBRADA,
  ccPond, cc5,
  MESES_NOM,
  T, C,
  FORM_DEF,
};
