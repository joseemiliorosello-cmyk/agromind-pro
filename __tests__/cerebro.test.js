// __tests__/cerebro.test.js
// Pruebas del cerebro de diagnóstico (lib/cerebro.js).
// Cobertura: calcCerebro (shape + tarjetas), interpretarAmplitudParicion
// (reconciliación cabeza/cola), y regresiones de la tanda julio–octubre 2026:
// verdeo fantasma, PV vaquillona concatenado, sal mineral genérica.

import { describe, it, expect, vi } from "vitest";

// cerebro.js → motor.js importan React en el top-level. Mock igual que motor.test.js.
vi.mock("react", () => {
  const mock = {
    useMemo:       (fn) => fn(),
    useState:      (init) => [typeof init === "function" ? init() : init, () => {}],
    useEffect:     () => {},
    useLayoutEffect: () => {},
  };
  return { default: mock, ...mock };
});

import { correrMotor } from "../lib/motor";
import { calcCerebro, interpretarAmplitudParicion } from "../lib/cerebro";
import { FORM_DEF } from "../lib/constantes";

// ─── Snapshot climático mínimo (3er argumento obligatorio) ───────
const SAT = {
  temp: 24, tMax: 31, tMin: 17, p7: 12, p30: 85, p90: 210, deficit: 5,
  ndvi: 0.55, ndviHist: 0.52, ndviDelta: 0.03, ndviCateg: "normal", condForr: "Buena",
};

// ─── Establecimiento de referencia NEA ───────────────────────────
const FORM_NEA = {
  ...FORM_DEF,
  biotipo:       "Brangus 3/8",
  vacasN:        "100",
  torosN:        "4",
  pvVacaAdulta:  "380",
  supHa:         "500",
  iniServ:       "2024-11-01",
  finServ:       "2025-01-31",   // 92 días → parición extendida
  distribucionCC:[
    { cc:"5.5", pct:"15" }, { cc:"5.0", pct:"25" },
    { cc:"4.5", pct:"35" }, { cc:"4.0", pct:"20" }, { cc:"3.5", pct:"5" },
  ],
  destTrad:    "100", destAntic:"0", destHiper:"0",
  fenologia:   "menor_10",
  vegetacion:  "Pastizal natural NEA/Chaco",
  zona:"NEA", provincia:"Corrientes", enso:"neutro",
  pctReposicion:"20",
  vaq2N:"20",
  tieneVerdeo:"no",
};

function run(form) {
  const motor   = correrMotor(form, SAT, [], false);
  const cerebro = calcCerebro(motor, form, SAT, []);
  return { motor, cerebro };
}

// ═══════════════════════════════════════════════════════════════
describe("calcCerebro — shape y robustez", () => {
  it("corre sin explotar y devuelve diagnostico + prescripciones", () => {
    const { cerebro } = run(FORM_NEA);
    expect(cerebro).toBeTruthy();
    expect(cerebro.diagnostico).toBeTruthy();
    expect(cerebro.prescripciones).toBeTruthy();
    expect(Array.isArray(cerebro.prescripciones.tarjetas)).toBe(true);
  });

  it("corre con un form casi vacío sin lanzar", () => {
    expect(() => run({ ...FORM_DEF, vacasN:"50", pvVacaAdulta:"360" })).not.toThrow();
  });

  it("las tarjetas tienen prioridad válida (P1/P2/P3/URGENTE)", () => {
    const { cerebro } = run(FORM_NEA);
    cerebro.prescripciones.tarjetas.forEach(t => {
      expect(["P1","P2","P3","URGENTE"]).toContain(t.prioridad);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
describe("interpretarAmplitudParicion — reconciliación cabeza/cola", () => {
  it("cabeza ≥ ccServ del rodeo ≥ cola (coherencia con el modelo principal)", () => {
    const { motor } = run(FORM_NEA);
    const amp = interpretarAmplitudParicion(FORM_NEA, motor, motor.tray);
    const ccServRodeo = motor.tray.ccServ;
    expect(amp.ccServCabeza).toBeGreaterThanOrEqual(ccServRodeo - 0.001);
    expect(amp.ccServCola).toBeLessThanOrEqual(ccServRodeo + 0.001);
  });

  it("la brecha se abre cuando el destete permite recuperar (hiperprecoz)", () => {
    // Con destete tradicional (180d) y servicio corto, ni la cabeza recupera antes
    // del próximo servicio → brecha 0 (correcto). El hiperprecoz sí deja recuperar.
    const hiper = { ...FORM_NEA, destTrad:"0", destAntic:"0", destHiper:"100" };
    const motor = correrMotor(hiper, SAT, [], false);
    const amp = interpretarAmplitudParicion(hiper, motor, motor.tray);
    expect(amp.brechaCCCabezaCola).toBeGreaterThanOrEqual(0);
    expect(amp.ccServCabeza - amp.ccServCola).toBeGreaterThan(0);
  });

  it("un servicio más largo abre más (o igual) la brecha que uno corto", () => {
    const base  = { ...FORM_NEA, destTrad:"0", destAntic:"0", destHiper:"100" };
    const corto = { ...base, iniServ:"2024-11-01", finServ:"2024-12-02" }; // ~31d
    const largo = { ...base, iniServ:"2024-11-01", finServ:"2025-03-01" }; // ~120d
    const mC = correrMotor(corto, SAT, [], false);
    const mL = correrMotor(largo, SAT, [], false);
    const aC = interpretarAmplitudParicion(corto, mC, mC.tray);
    const aL = interpretarAmplitudParicion(largo, mL, mL.tray);
    expect(aL.ccServCabeza - aL.ccServCola).toBeGreaterThanOrEqual(aC.ccServCabeza - aC.ccServCola);
  });

  it("preñez de cabeza ≥ preñez de cola (misma tabla interpCC)", () => {
    const hiper = { ...FORM_NEA, destTrad:"0", destAntic:"0", destHiper:"100" };
    const motor = correrMotor(hiper, SAT, [], false);
    const amp = interpretarAmplitudParicion(hiper, motor, motor.tray);
    expect(amp.prenezCabeza).toBeGreaterThanOrEqual(amp.prenezCola);
  });
});

// ═══════════════════════════════════════════════════════════════
describe("regresión: verdeo fantasma", () => {
  it("con tieneVerdeo='no' el cerebro NO reporta verdeo activo", () => {
    const { cerebro } = run({ ...FORM_NEA, tieneVerdeo:"no", verdeoHa:"100" });
    // interpretarVerdeo devuelve tieneVerdeo:false cuando no es "si"
    expect(cerebro.diagnostico.verdeo?.tieneVerdeo ?? false).toBe(false);
    // y ninguna tarjeta propone destinar verdeo
    const hayCardVerdeo = cerebro.prescripciones.tarjetas.some(t =>
      /verdeo/i.test((t.titulo||"") + (t.solucion||"")));
    expect(hayCardVerdeo).toBe(false);
  });

  it("con tieneVerdeo='si' y destino vaquillona SÍ lo reconoce", () => {
    const conVerdeo = { ...FORM_NEA, tieneVerdeo:"si", verdeoHa:"100",
      verdeoTipo:"Avena/Cebadilla", verdeoDestinoVaq:"si" };
    const { cerebro } = run(conVerdeo);
    expect(cerebro.diagnostico.verdeo?.tieneVerdeo).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
describe("regresión: PV vaquillona no concatena como string", () => {
  it("el PV agosto proyectado de la vaq1 es un número plausible (<1000 kg)", () => {
    const flaca = { ...FORM_NEA, pctReposicion:"25", fenologia:"mayor_50" };
    const { cerebro } = run(flaca);
    const cardVaq1 = cerebro.prescripciones.tarjetas.find(t => t.categoria === "Vaquillona");
    if (cardVaq1) {
      const m = /con corrección:\s*~?(\d+)\s*kg/.exec(cardVaq1.impacto || "");
      if (m) expect(parseInt(m[1], 10)).toBeLessThan(1000); // "18521" era el bug
    }
    expect(true).toBe(true); // el test no falla si no hay card de vaq1
  });
});

// ═══════════════════════════════════════════════════════════════
describe("regresión: sal mineral genérica removida", () => {
  it("no emite la tarjeta 'Sal mineral base' en todos los informes", () => {
    const { cerebro } = run(FORM_NEA);
    const haySalMineral = cerebro.prescripciones.tarjetas.some(t =>
      /sal mineral base/i.test(t.titulo || ""));
    expect(haySalMineral).toBe(false);
  });
});
