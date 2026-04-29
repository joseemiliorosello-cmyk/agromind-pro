// ═══════════════════════════════════════════════════════════════════
// lib/types.ts — Interfaces core de agromind-pro
// Adoption incremental: los .js existentes importan con JSDoc @type
// ═══════════════════════════════════════════════════════════════════

// ─── Potrero ────────────────────────────────────────────────────────
export interface Potrero {
  nombre: string;
  ha: number | string;
  altPasto?: string;
  tipoPasto?: string;
  vegetacion?: string;
  fenologia?: string;
  pctMonte?: string | number;
}

// ─── Form ───────────────────────────────────────────────────────────
export interface Form {
  // Ubicación
  nombreProductor: string;
  pais: string;
  zona: string;
  provincia: string;
  localidad: string;
  // Rodeo
  biotipo: string;
  primerParto: boolean;
  vacasN: string | number;
  torosN: string | number;
  pvVacaAdulta: string | number;
  eReprod: string;
  prenez: string | number;
  pctDestete: string | number;
  iniServ: string;
  finServ: string;
  edadPrimerEntore: string | number;
  // Vaquillonas
  edadVaqMayo: string | number;
  tipoDesteteVaq: string;
  // Forraje
  altPasto: string | number;
  tipoPasto: string;
  tieneVerdeo: string;
  verdeoHa: string | number;
  verdeoTipo: string;
  verdeoDisp: string;
  verdeoDestinoVaq: string;
  // Categorías
  v2sN: string | number;
  v2sPV: string | number;
  v2sTernero: string | number;
  cc2sDist: Array<{ cc: string; pct: string }>;
  pctReposicion: string | number;
  vaq1PV: string | number;
  vaq2N: string | number;
  vaq2PV: string | number;
  // CC
  distribucionCC: Array<{ cc: string; pct: string }>;
  fechaCC: string;
  // Destete
  destTrad: string | number;
  destAntic: string | number;
  destHiper: string | number;
  // Toros
  torosLote: string;
  torosLotes: string | number;
  torosCC: string | number;
  torosBCS_ok: string | number;
  // Forraje general
  vegetacion: string;
  fenologia: string;
  supHa: string | number;
  pctMonte: string | number;
  pctNGan: string | number;
  // Suplementación
  supl1: string; dosis1: string | number;
  supl2: string; dosis2: string | number;
  supl3: string; dosis3: string | number;
  supl_vacas: string;  dosis_vacas: string | number;
  supl_v2s: string;    dosis_v2s: string | number;
  supl_toros: string;  dosis_toros: string | number;
  supl_vaq2: string;   dosis_vaq2: string | number;
  supl_vaq1: string;   dosis_vaq1: string | number;
  supl_ternero: string;dosis_ternero: string | number;
  // Otros
  stockAlim: Array<{ alimento: string; toneladas: number | string }>;
  potrerosCateg: Array<{ potreroIdx: number; categorias: string[] }>;
  ccAnterior: string | number;
  fechaCCAnterior: string;
  tieneCreep: string;
  creepAlimento: string;
  creepDosis: string | number;
  // Sanidad
  sanVacunas: string;
  sanBrucelosis: string;
  sanAftosa: string;
  sanToros: string;
  sanAbortos: string;
  sanPrograma: string;
  sanParasitoExt: string;
  sanParasitoInt: string;
  // ENSO / Agua
  enso: string;
  aguaTDS: string | number;
  aguaTipoSal: string;
  aguaFuente: string;
  // Visitas y consulta
  visitasCampo: Array<{ fecha: string; ccObservada: string | number; observacion: string }>;
  consultaEspecifica: string;
  // Potreros (modo avanzado)
  usaPotreros?: boolean;
  potreros?: Potrero[];
}

// ─── Sat ────────────────────────────────────────────────────────────
export interface Sat {
  temp: number;
  tMax: number;
  tMin: number;
  p7: number;
  p30: number;
  deficit: number;
  ndvi: number;
  condForr: string;
  et07: number;
  pronostico: Array<{ fecha: string; dia: string; tMax: number; tMin: number; lluvia: number; desc: string }>;
  lluviaProx7: number;
  tempMediaProx7: number;
  helada7: boolean;
  prov: string;
  enso: string;
  zona: string;
  error?: string;
}

// ─── VaqE — resultado de calcVaq1 / calcVaq2 ────────────────────────
export interface VaqE {
  pvMayo2Inv: number;
  pvEntore: number;
  pvMinEntore: number;
  llegas: boolean;
}

// ─── BalanceMes — un mes de balancePorCategoria ──────────────────────
export interface BalanceMes {
  oferta: {
    pasto: number;
    suplemento: number;
    verdeo: number;
    movilizacionCC: number;
    total: number;
  };
  demanda: number;
  balance: number;
  gdp: number;
  ndvi: number;
  p30: number | null;
  consRealPctPV: number;
  boostProteico: boolean;
  factoresConsumo: { F1: number; F2: number; F3: number; F4: number };
}

// ─── BalancePorCategoria ─────────────────────────────────────────────
export interface BalancePorCategoria {
  categoria: string;
  label: string;
  nAnimales: number;
  pv: number;
  meses: BalanceMes[];
}

// ─── Motor — resultado de correrMotor ───────────────────────────────
export interface Motor {
  // Clima y oferta base
  disponMS: number;
  ndviN: number;
  tempHoy: number;
  p30: number;
  enso: string;
  ofertaMensual: number[];
  verdeoAporteMcalMes: number[];
  verdeoMesInicio: number;
  factorAgua: number;
  factorCarga: number;
  cargaEV_ha: number;
  // Agua
  evalAgua: { nivel: string; tds: number; ok: boolean } | null;
  // Cadena reproductiva
  cadena: {
    iniServ: Date;
    finServ: Date;
    diasServ: number;
    parto: Date;
    destete: Date;
  } | null;
  // Animales
  nVacas: number;
  nToros: number;
  nV2s: number;
  nVaq2: number;
  nVaq1: number;
  totalEV: number;
  // Vaquillonas
  pvEntVaq1: number;
  vaq1E: VaqE | null;
  pvSalidaVaq1: number;
  pvEntradaVaq2: number;
  vaq2E: VaqE | null;
  // CC
  tray: Record<string, number> | null;
  dist: number[] | null;
  ccPondVal: number;
  ccPondValOk: boolean;
  ccDesvio: number;
  // Balance
  balanceMensual: BalanceMes[];
  suplRodeoMcalDia: number;
  ofertaPorCateg: Record<string, number[]>;
  // Diagnósticos
  sanidad: Record<string, unknown>;
  toroDxn: Record<string, unknown>;
  stockStatus: Record<string, unknown>;
  demandaAlim: Record<string, unknown>;
  impactoCola: Record<string, unknown>;
  tcSave: Record<string, unknown>;
  baseParams: Record<string, unknown>;
  visitasCampo: unknown[];
  // Alertas y score
  alertas: string[];
  alertasP1: string[];
  alertasP2: string[];
  alertasP3: string[];
  scoreRiesgo: number;
  nivelRiesgo: string;
  colorRiesgo: string;
  trazas: Record<string, unknown>;
}
