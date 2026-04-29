// ═══════════════════════════════════════════════════════════════════
// lib/schema.ts — Schema zod del Form
// Propósito: sanitizar datos de localStorage y validar boundaries.
// No reemplaza tipos de types.ts — los complementa.
// ═══════════════════════════════════════════════════════════════════

import { z } from "zod";

// Helpers reutilizables
const strNum = z.union([z.string(), z.number()]).default("");

const ccDistItem  = z.object({ cc: z.string(), pct: z.string() });
const stockItem   = z.object({ alimento: z.string(), toneladas: strNum });
const visitaItem  = z.object({ fecha: z.string(), ccObservada: strNum, observacion: z.string() });
const categItem   = z.object({ potreroIdx: z.number(), categorias: z.array(z.string()) });
const cc2sItem    = z.object({ cc: z.string(), pct: z.string() });

export const FormSchema = z.object({
  // Ubicación
  nombreProductor: z.string().default(""),
  pais:            z.string().default("Argentina"),
  zona:            z.string().default("NEA"),
  provincia:       z.string().default("Corrientes"),
  localidad:       z.string().default(""),
  // Rodeo
  biotipo:         z.string().default("Brangus 3/8"),
  primerParto:     z.boolean().default(false),
  vacasN:          strNum,
  torosN:          strNum,
  pvVacaAdulta:    strNum,
  eReprod:         z.string().default("Gestación media (5–7 meses)"),
  prenez:          strNum,
  pctDestete:      strNum.default("88"),
  iniServ:         z.string().default(""),
  finServ:         z.string().default(""),
  edadPrimerEntore:strNum.default("24"),
  // Vaquillonas
  edadVaqMayo:     strNum,
  tipoDesteteVaq:  z.string().default("hiper"),
  // Forraje
  altPasto:        strNum.default("20"),
  tipoPasto:       z.string().default("alto_denso"),
  tieneVerdeo:     z.string().default("no"),
  verdeoHa:        strNum,
  verdeoTipo:      z.string().default("Avena/Cebadilla"),
  verdeoDisp:      z.string().default("agosto"),
  verdeoDestinoVaq:z.string().default("si"),
  // Categorías
  v2sN:            strNum,
  v2sPV:           strNum,
  v2sTernero:      strNum,
  cc2sDist:        z.array(cc2sItem).default([]),
  pctReposicion:   strNum.default("20"),
  vaq1PV:          strNum,
  vaq2N:           strNum,
  vaq2PV:          strNum,
  // CC
  distribucionCC:  z.array(ccDistItem).default([
    { cc:"5.5", pct:"15" }, { cc:"5.0", pct:"25" }, { cc:"4.5", pct:"35" },
    { cc:"4.0", pct:"20" }, { cc:"3.5", pct:"5" },
  ]),
  fechaCC:         z.string().default(""),
  // Destete
  destTrad:        strNum.default("100"),
  destAntic:       strNum.default("0"),
  destHiper:       strNum.default("0"),
  // Toros
  torosLote:       z.string().default("si"),
  torosLotes:      strNum,
  torosCC:         strNum,
  torosBCS_ok:     strNum,
  // Forraje general
  vegetacion:      z.string().default("Pastizal natural NEA/Chaco"),
  fenologia:       z.string().default("menor_10"),
  supHa:           strNum,
  pctMonte:        strNum.default("10"),
  pctNGan:         strNum.default("5"),
  // Suplementación
  supl1: z.string().default(""),  dosis1: strNum.default("0"),
  supl2: z.string().default(""),  dosis2: strNum.default("0"),
  supl3: z.string().default(""),  dosis3: strNum.default("0"),
  supl_vacas:  z.string().default(""),  dosis_vacas:  strNum.default("0"),
  supl_v2s:    z.string().default(""),  dosis_v2s:    strNum.default("0"),
  supl_toros:  z.string().default(""),  dosis_toros:  strNum.default("0"),
  supl_vaq2:   z.string().default(""),  dosis_vaq2:   strNum.default("0"),
  supl_vaq1:   z.string().default(""),  dosis_vaq1:   strNum.default("0"),
  supl_ternero:z.string().default(""),  dosis_ternero:strNum.default("0"),
  // Otros arrays
  stockAlim:     z.array(stockItem).default([]),
  potrerosCateg: z.array(categItem).default([]),
  visitasCampo:  z.array(visitaItem).default([]),
  // Misc
  ccAnterior:      strNum,
  fechaCCAnterior: z.string().default(""),
  tieneCreep:      z.string().default("no"),
  creepAlimento:   z.string().default(""),
  creepDosis:      strNum.default("0"),
  // Sanidad
  sanVacunas:      z.string().default("si"),
  sanBrucelosis:   z.string().default("si"),
  sanAftosa:       z.string().default("si"),
  sanToros:        z.string().default("con_control"),
  sanAbortos:      z.string().default("no"),
  sanPrograma:     z.string().default("si"),
  sanParasitoExt:  z.string().default(""),
  sanParasitoInt:  z.string().default(""),
  // ENSO / Agua
  enso:            z.string().default("neutro"),
  aguaTDS:         strNum,
  aguaTipoSal:     z.string().default("Mixta/Desconocida"),
  aguaFuente:      z.string().default(""),
  // Consulta
  consultaEspecifica: z.string().default(""),
}).passthrough(); // tolera campos extra (p.ej. _v, _guardadoEn)

export type FormInput = z.input<typeof FormSchema>;
export type FormOutput = z.output<typeof FormSchema>;

/** Sanitiza datos no confiables (localStorage, JSON importado) en un Form válido. */
export function sanitizeForm(raw: unknown): FormOutput {
  const result = FormSchema.safeParse(raw);
  if (result.success) return result.data;
  // Si hay errores de parsing, hacer parse con fallback: campos inválidos → defaults
  return FormSchema.parse({});
}
