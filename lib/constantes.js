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



// ─── TEMA DE COLORES ──────────────────────────────────────────────
const T = {
  bg:       "#f0f5ee",
  card:     "#ffffff",
  card2:    "#f5faf3",
  border:   "#cce0c4",
  green:    "#2e7818",
  greenD:   "#1e5810",
  amber:    "#a06810",
  red:      "#b82810",
  blue:     "#1e68a8",
  purple:   "#5838a8",
  text:     "#182c12",
  textDim:  "#486840",
  textFaint:"#7aa070",
  font:     "'IBM Plex Mono', 'Courier New', monospace",
  fontSans: "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
  sans:     "'IBM Plex Sans', 'Helvetica Neue', sans-serif",
  radius:   14,
  r:        14,
  // ── Escalas de diseño ───────────────────────────────────────────
  fs: { xs:11, sm:13, base:15, md:17, lg:21, xl:27, hero:36 },
  sp: { xs:4,  sm:8,  md:12,  base:16, lg:24, xl:32 },
  rd: { sm:6,  base:10, md:14, lg:20 },
  sh: {
    sm:  "0 1px 4px rgba(0,0,0,.08)",
    base:"0 2px 8px rgba(0,0,0,.12)",
    lg:  "0 4px 20px rgba(0,0,0,.16)",
  },
};
const C = T; // alias — el código usa C en algunos lugares

// ─── FORM_DEF ─────────────────────────────────────────────────────
const FORM_DEF = {
  // ── Ubicación ──────────────────────────────────────────────────
  nombreProductor:"", pais:"Argentina", zona:"NEA", provincia:"Corrientes", localidad:"",
  // ── Rodeo ──────────────────────────────────────────────────────
  biotipo:"Brangus 3/8", primerParto:false,
  vacasN:"", torosN:"", pvVacaAdulta:"",
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
  cc2sDist:[],
  pctReposicion:"20", vaq1PV:"", vaq2N:"", vaq2PV:"",
  // ── CC ─────────────────────────────────────────────────────────
  distribucionCC:[{ cc:"5.5", pct:"15" },{ cc:"5.0", pct:"25" },{ cc:"4.5", pct:"35" },{ cc:"4.0", pct:"20" },{ cc:"3.5", pct:"5" }],
  fechaCC:"",            // fecha en que se midió la CC (nueva v15)
  // ── Destete ────────────────────────────────────────────────────
  destTrad:"100", destAntic:"0", destHiper:"0",
  // ── Toros — diagnóstico preparo de servicio (nuevo v15) ────────
  torosLote:"si",        // ¿están todos en un lote o distribuidos?
  torosLotes:"",         // cantidad de lotes si distribuidos
  torosCC:"",         // CC toros hoy (promedio)
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
  // ── Asignación potreros a categorías ─────────────────────────────────────
  potrerosCateg:[],  // [{ potreroIdx, categorias:["vacas","vaq1","v2s"] }]
  // ── Historial CC para detectar tendencia entre visitas ───────────────────
  ccAnterior:"", fechaCCAnterior:"",
  // ── Creep feeding ─────────────────────────────────────────────────────────
  tieneCreep:"no", creepAlimento:"", creepDosis:"0",
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


// ═══════════════════════════════════════════════════════════════════
// UBICACIONES — País → Zona → Provincia → Localidad (lat, lon)
// Calf AI — Argentina, Paraguay, Brasil (zonas ganaderas)
// ═══════════════════════════════════════════════════════════════════
export const UBICACIONES = {
  "Argentina": {
    "NEA": {
      "Corrientes": {
        "Corrientes Capital": [-27.47, -58.83],
        "Goya": [-29.14, -59.27],
        "Curuzú Cuatiá": [-29.79, -58.05],
        "Mercedes": [-29.18, -58.08],
        "Paso de los Libres": [-29.71, -57.09],
        "Santo Tomé": [-28.56, -56.04],
        "Bella Vista": [-28.50, -59.04],
        "Esquina": [-30.01, -59.53],
        "Sauce": [-30.08, -58.79],
        "Ituzaingó": [-27.59, -56.69],
        "Chavarría": [-28.95, -58.57],
        "Colonia Pellegrini": [-28.52, -57.16],
        "San Martín": [-29.57, -58.13],
        "Perugorría": [-29.35, -58.61],
        "Mocoretá": [-30.62, -57.97],
        "Yapeyú": [-29.96, -56.81],
      },
      "Chaco": {
        "Resistencia": [-27.45, -58.99],
        "Charata": [-27.22, -61.18],
        "Presidencia R. Sáenz Peña": [-26.79, -60.44],
        "Villa Ángela": [-27.57, -60.71],
        "Quitilipi": [-26.86, -60.22],
        "Las Breñas": [-27.09, -61.08],
        "General Pinedo": [-27.32, -61.28],
        "Avia Terai": [-26.68, -60.73],
        "Corzuela": [-26.95, -61.00],
        "El Pintado": [-25.69, -61.09],
        "Miraflores": [-25.39, -61.01],
        "Juan José Castelli": [-25.94, -60.62],
        "Pampa del Indio": [-26.02, -59.94],
        "Colonia Elisa": [-26.93, -60.10],
        "Makallé": [-27.21, -59.28],
        "La Fidelidad": [-24.58, -61.55],
        "Santa Sylvina": [-27.83, -61.13],
        "Tres Isletas": [-26.33, -60.43],
        "Campo Largo": [-26.80, -60.83],
      },
      "Formosa": {
        "Formosa Capital": [-26.18, -58.18],
        "Clorinda": [-25.28, -57.72],
        "Pirané": [-25.73, -59.11],
        "Las Lomitas": [-24.71, -60.59],
        "Ingeniero Juárez": [-23.90, -61.85],
        "El Colorado": [-26.31, -59.37],
        "Ibarreta": [-25.21, -59.87],
        "Pozo del Tigre": [-24.90, -60.33],
        "Mayor L.V. Mansilla": [-25.68, -59.48],
        "Laguna Blanca": [-25.14, -61.99],
        "Fontana": [-25.39, -59.98],
      },
      "Misiones": {
        "Posadas": [-27.37, -55.90],
        "Eldorado": [-26.41, -54.62],
        "Oberá": [-27.49, -55.12],
        "Apóstoles": [-27.92, -55.75],
        "Montecarlo": [-26.57, -54.76],
        "San Vicente": [-26.98, -54.49],
        "Aristóbulo del Valle": [-27.10, -54.89],
        "Bernardo de Irigoyen": [-26.24, -53.65],
        "Santo Pipó": [-27.16, -55.43],
      },
      "Entre Ríos": {
        "Paraná": [-31.74, -60.52],
        "Concordia": [-31.39, -58.02],
        "Concepción del Uruguay": [-32.49, -58.24],
        "Gualeguaychú": [-33.01, -58.52],
        "Villaguay": [-31.86, -59.02],
        "Gualeguay": [-33.15, -59.31],
        "La Paz": [-30.74, -59.64],
        "Federación": [-30.98, -57.92],
        "Colón": [-32.22, -58.14],
        "Victoria": [-32.62, -60.16],
      },
    },
    "NOA": {
      "Salta": {
        "Salta Capital": [-24.79, -65.41],
        "Orán": [-23.13, -64.32],
        "Tartagal": [-22.52, -63.80],
        "Metán": [-25.49, -64.97],
        "Rivadavia": [-24.18, -62.88],
        "Embarcación": [-23.21, -64.10],
        "Aguaray": [-22.26, -63.73],
        "J.V. González": [-25.04, -64.13],
        "Pichanal": [-23.32, -64.22],
        "Rosario de la Frontera": [-25.80, -64.97],
      },
      "Santiago del Estero": {
        "Santiago del Estero Cap.": [-27.79, -64.26],
        "La Banda": [-27.74, -64.24],
        "Termas de Río Hondo": [-27.49, -64.86],
        "Añatuya": [-28.46, -62.84],
        "Frías": [-28.65, -65.15],
        "Quimilí": [-27.63, -62.42],
        "Loreto": [-28.31, -64.19],
        "Bandera": [-28.89, -62.27],
        "Clodomira": [-27.57, -64.14],
        "Suncho Corral": [-28.55, -63.43],
        "Pinto": [-29.15, -62.61],
        "Pampa de los Guanacos": [-26.23, -61.85],
      },
      "Jujuy": {
        "San Salvador de Jujuy": [-24.19, -65.30],
        "Palpalá": [-24.26, -65.21],
        "Perico": [-24.38, -65.12],
        "Libertador Gral. San Martín": [-23.81, -64.79],
        "Calilegua": [-23.78, -64.77],
      },
      "Tucumán": {
        "San Miguel de Tucumán": [-26.82, -65.22],
        "Concepción": [-27.34, -65.59],
        "Banda del Río Salí": [-26.84, -65.17],
        "Aguilares": [-27.43, -65.62],
        "Monteros": [-27.17, -65.50],
      },
    },
    "Pampa Húmeda": {
      "Buenos Aires": {
        "Buenos Aires Cap.": [-34.61, -58.38],
        "Bahía Blanca": [-38.72, -62.27],
        "Mar del Plata": [-38.00, -57.56],
        "La Plata": [-34.92, -57.95],
        "Azul": [-36.78, -59.86],
        "Olavarría": [-36.89, -60.32],
        "Tandil": [-37.32, -59.13],
        "Bolívar": [-36.23, -61.11],
        "Pehuajó": [-35.85, -61.90],
        "Trenque Lauquen": [-35.97, -62.73],
        "Lincoln": [-34.86, -61.53],
        "Carlos Casares": [-35.62, -61.37],
        "Junín": [-34.59, -60.96],
        "Bragado": [-35.12, -60.49],
        "Daireaux": [-36.60, -61.75],
      },
      "Santa Fe": {
        "Rosario": [-32.95, -60.65],
        "Santa Fe Capital": [-31.63, -60.70],
        "Rafaela": [-31.25, -61.49],
        "Reconquista": [-29.15, -59.65],
        "Venado Tuerto": [-33.75, -61.97],
        "Cañada de Gómez": [-32.82, -61.40],
        "Esperanza": [-31.45, -60.93],
        "San Cristóbal": [-30.31, -61.24],
        "Vera": [-29.46, -60.22],
        "Tostado": [-29.23, -61.77],
      },
      "Córdoba": {
        "Córdoba Capital": [-31.42, -64.18],
        "Río Cuarto": [-33.13, -64.35],
        "Villa María": [-32.41, -63.24],
        "San Francisco": [-31.43, -62.08],
        "Marcos Juárez": [-32.70, -62.10],
        "Bell Ville": [-32.63, -62.69],
        "Jesús María": [-30.98, -64.09],
        "Dean Funes": [-30.42, -64.35],
        "Cruz del Eje": [-30.73, -64.81],
        "Villa Dolores": [-31.94, -65.19],
      },
    },
  },
  "Paraguay": {
    "Paraguay Oriental": {
      "Alto Paraná": {
        "Ciudad del Este": [-25.51, -54.61],
        "Presidente Franco": [-25.55, -54.61],
        "Minga Guazú": [-25.48, -54.78],
        "Hernandarias": [-25.40, -54.62],
        "Santa Rita": [-26.05, -55.22],
        "Minga Porã": [-25.98, -55.00],
      },
      "Itapúa": {
        "Encarnación": [-27.33, -55.87],
        "Fram": [-26.65, -55.65],
        "Coronel Bogado": [-27.18, -56.25],
        "Carmen del Paraná": [-27.22, -56.20],
        "Hohenau": [-27.09, -55.65],
        "Trinidad": [-27.35, -55.73],
        "Jesús": [-27.37, -55.68],
        "San Juan del Paraná": [-27.26, -55.98],
      },
      "Canindeyú": {
        "Salto del Guairá": [-24.05, -54.31],
        "Curuguaty": [-24.47, -55.71],
        "Villa Ygatimí": [-24.08, -55.50],
        "Katueté": [-24.22, -55.00],
        "Nueva Esperanza": [-24.11, -55.62],
      },
      "Caaguazú": {
        "Coronel Oviedo": [-25.44, -56.44],
        "Caaguazú": [-25.46, -56.02],
        "Dr. Juan M. Frutos": [-25.56, -56.14],
        "Repatriación": [-25.54, -56.34],
        "Yhú": [-25.02, -55.94],
      },
      "San Pedro": {
        "San Pedro del Ycuamandiyú": [-24.09, -57.08],
        "Choré": [-24.18, -56.54],
        "Guayaibí": [-24.23, -56.89],
        "Gral. Elizardo Aquino": [-24.33, -57.02],
        "Villa del Rosario": [-24.43, -57.13],
      },
      "Concepción": {
        "Concepción": [-23.41, -57.43],
        "Loreto": [-23.27, -57.17],
        "Horqueta": [-23.34, -56.88],
        "Yby Yaú": [-22.96, -56.53],
      },
      "Amambay": {
        "Pedro Juan Caballero": [-22.55, -55.73],
        "Bella Vista Norte": [-22.13, -56.51],
        "Capitán Bado": [-23.27, -55.53],
      },
    },
    "Chaco Paraguayo": {
      "Presidente Hayes": {
        "Villa Hayes": [-25.10, -57.57],
        "Pozo Colorado": [-23.49, -58.80],
        "Benjamín Aceval": [-24.97, -57.57],
        "Puerto Pinasco": [-22.63, -57.83],
      },
      "Boquerón": {
        "Filadelfia": [-22.35, -60.03],
        "Loma Plata": [-22.38, -59.63],
        "Mcal. Estigarribia": [-22.03, -60.63],
        "Neuland": [-22.57, -59.78],
      },
      "Alto Paraguay": {
        "Fuerte Olimpo": [-21.04, -57.87],
        "Puerto Casado": [-22.29, -57.93],
        "Bahía Negra": [-20.22, -58.17],
      },
    },
  },
  "Brasil": {
    "Cerrado / Pantanal": {
      "Mato Grosso do Sul": {
        "Campo Grande": [-20.46, -54.62],
        "Dourados": [-22.22, -54.81],
        "Três Lagoas": [-20.75, -51.69],
        "Corumbá": [-19.01, -57.65],
        "Aquidauana": [-20.47, -55.79],
        "Ponta Porã": [-22.53, -55.73],
        "Coxim": [-18.51, -54.76],
        "Miranda": [-20.24, -56.37],
        "Bonito": [-21.13, -56.48],
        "Naviraí": [-23.06, -54.19],
        "Nova Andradina": [-22.23, -53.34],
      },
      "Mato Grosso": {
        "Cuiabá": [-15.60, -56.10],
        "Rondonópolis": [-16.47, -54.64],
        "Sinop": [-11.86, -55.51],
        "Cáceres": [-16.07, -57.68],
        "Tangará da Serra": [-14.62, -57.50],
        "Barra do Garças": [-15.89, -52.26],
        "Primavera do Leste": [-15.55, -54.28],
        "Sorriso": [-12.54, -55.72],
        "Lucas do Rio Verde": [-13.06, -55.91],
      },
      "Goiás": {
        "Goiânia": [-16.69, -49.25],
        "Rio Verde": [-17.80, -50.93],
        "Jataí": [-17.88, -51.71],
        "Catalão": [-18.17, -47.95],
        "Itumbiara": [-18.42, -49.22],
        "Mineiros": [-17.57, -52.55],
        "Quirinópolis": [-18.45, -50.45],
      },
    },
  },
};

// ─── CLIMA HISTÓRICO por provincia (temperatura y precipitación mensual) ────
const CLIMA_HIST = {
  "Corrientes":                [{t:28,p:130},{t:27,p:120},{t:25,p:110},{t:20,p:90},{t:16,p:70},{t:13,p:60},{t:13,p:55},{t:15,p:50},{t:18,p:80},{t:22,p:110},{t:25,p:120},{t:27,p:130}],
  "Chaco":                     [{t:29,p:120},{t:28,p:110},{t:26,p:110},{t:21,p:80},{t:16,p:60},{t:13,p:50},{t:13,p:45},{t:15,p:45},{t:19,p:70},{t:23,p:100},{t:26,p:110},{t:28,p:120}],
  "Formosa":                   [{t:30,p:120},{t:29,p:110},{t:27,p:110},{t:22,p:80},{t:17,p:55},{t:14,p:45},{t:14,p:40},{t:16,p:45},{t:20,p:70},{t:24,p:100},{t:27,p:110},{t:29,p:120}],
  "Entre Ríos":                [{t:25,p:100},{t:24,p:90},{t:22,p:90},{t:17,p:70},{t:13,p:55},{t:10,p:45},{t:10,p:40},{t:12,p:45},{t:15,p:65},{t:19,p:90},{t:22,p:100},{t:24,p:100}],
  "Santiago del Estero":       [{t:28,p:90},{t:27,p:80},{t:25,p:80},{t:20,p:50},{t:15,p:30},{t:12,p:20},{t:12,p:15},{t:14,p:20},{t:18,p:40},{t:22,p:70},{t:25,p:80},{t:27,p:90}],
  "Salta":                     [{t:24,p:140},{t:23,p:130},{t:22,p:110},{t:17,p:50},{t:13,p:20},{t:10,p:10},{t:10,p:10},{t:12,p:15},{t:16,p:30},{t:20,p:70},{t:22,p:110},{t:23,p:130}],
  "Buenos Aires":              [{t:24,p:90},{t:23,p:80},{t:21,p:90},{t:16,p:70},{t:12,p:55},{t:9,p:45},{t:9,p:40},{t:11,p:50},{t:13,p:65},{t:17,p:85},{t:20,p:90},{t:23,p:90}],
  "Córdoba":                   [{t:25,p:100},{t:24,p:90},{t:22,p:90},{t:17,p:60},{t:13,p:35},{t:10,p:25},{t:10,p:20},{t:12,p:25},{t:15,p:45},{t:19,p:75},{t:22,p:90},{t:24,p:100}],
  "Santa Fe":                  [{t:26,p:110},{t:25,p:100},{t:23,p:100},{t:18,p:70},{t:14,p:50},{t:11,p:40},{t:11,p:35},{t:13,p:40},{t:16,p:60},{t:20,p:90},{t:23,p:100},{t:25,p:110}],
  "La Pampa":                  [{t:24,p:80},{t:23,p:70},{t:21,p:75},{t:15,p:55},{t:11,p:38},{t:8,p:28},{t:8,p:25},{t:10,p:30},{t:13,p:48},{t:17,p:72},{t:20,p:78},{t:22,p:80}],
  "Paraguay Oriental":         [{t:29,p:140},{t:29,p:130},{t:27,p:130},{t:22,p:100},{t:17,p:75},{t:14,p:60},{t:14,p:55},{t:16,p:55},{t:19,p:80},{t:23,p:110},{t:26,p:130},{t:28,p:140}],
  "Chaco Paraguayo":           [{t:31,p:110},{t:30,p:100},{t:28,p:100},{t:23,p:70},{t:18,p:45},{t:15,p:35},{t:15,p:30},{t:17,p:35},{t:21,p:60},{t:25,p:90},{t:28,p:100},{t:30,p:110}],
  "Mato Grosso do Sul (BR)":   [{t:27,p:180},{t:27,p:160},{t:26,p:120},{t:23,p:80},{t:19,p:50},{t:17,p:30},{t:17,p:25},{t:19,p:35},{t:22,p:70},{t:25,p:120},{t:26,p:150},{t:27,p:170}],
  "Mato Grosso / Goiás (BR)":  [{t:26,p:220},{t:26,p:200},{t:25,p:160},{t:24,p:90},{t:22,p:35},{t:20,p:10},{t:20,p:8},{t:22,p:15},{t:24,p:60},{t:26,p:120},{t:26,p:180},{t:26,p:210}],
  "Pantanal (BR)":             [{t:28,p:200},{t:28,p:180},{t:27,p:140},{t:25,p:80},{t:22,p:30},{t:20,p:10},{t:20,p:8},{t:21,p:20},{t:24,p:60},{t:26,p:110},{t:27,p:160},{t:28,p:190}],
};
const CLIMA_DEF = [{t:27,p:120},{t:26,p:110},{t:24,p:100},{t:20,p:80},{t:15,p:60},{t:12,p:50},{t:12,p:45},{t:14,p:50},{t:18,p:70},{t:22,p:95},{t:25,p:110},{t:26,p:120}];
const getClima  = (prov) => CLIMA_HIST[prov] || CLIMA_DEF;

export {
  BIOTIPOS, BIOTIPO_DEF, getBiotipo,
  SUPLEMENTOS,
  PROD_BASE,
  CALIDAD_C4_CALIBRADA,
  ccPond, cc5,
  MESES_NOM,
  T, C,
  FORM_DEF,
  CLIMA_HIST, CLIMA_DEF, getClima,
};
