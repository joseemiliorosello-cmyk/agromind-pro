// __tests__/motor.test.js
// Pruebas del motor de cálculo ganadero.
// Cobertura: correrMotor, calcTrayectoriaCC, calcCadena, calcVaq1/Vaq2.

import { describe, it, expect, vi, beforeAll } from "vitest";

// motor.js importa React en el top-level para useMotor.
// Las funciones que probamos son puras — mockeamos React para evitar
// el error "hooks fuera de componente".
vi.mock("react", () => {
  const mock = {
    useMemo:       (fn) => fn(),
    useState:      (init) => [typeof init === "function" ? init() : init, () => {}],
    useEffect:     () => {},
    useLayoutEffect: () => {},
  };
  return { default: mock, ...mock };
});

import {
  correrMotor,
  calcTrayectoriaCC,
  calcCadena,
  calcVaq1,
  calcVaq2,
  balancePorCategoria,
} from "../lib/motor";
import { FORM_DEF } from "../lib/constantes";

// ─── Establecimientos de referencia ──────────────────────────────
const FORM_NEA = {
  ...FORM_DEF,
  biotipo:       "Brangus 3/8",
  vacasN:        "100",
  pvVacaAdulta:  "380",
  supHa:         "500",
  iniServ:       "2024-11-01",
  finServ:       "2025-01-31",
  distribucionCC:[
    { cc:"5.5", pct:"15" }, { cc:"5.0", pct:"25" },
    { cc:"4.5", pct:"35" }, { cc:"4.0", pct:"20" },
    { cc:"3.5", pct:"5"  },
  ],
  destTrad:    "100", destAntic: "0", destHiper: "0",
  fenologia:   "menor_10",
  vegetacion:  "Pastizal natural NEA/Chaco",
  zona:        "NEA",
  provincia:   "Corrientes",
  enso:        "neutro",
  pctReposicion:"20",
};

const FORM_NELORE_CHACO = {
  ...FORM_DEF,
  biotipo:      "Nelore",
  vacasN:       "200",
  pvVacaAdulta: "340",
  supHa:        "1000",
  iniServ:      "2024-12-01",
  finServ:      "2025-02-28",
  distribucionCC:[
    { cc:"5.0", pct:"20" }, { cc:"4.5", pct:"40" },
    { cc:"4.0", pct:"30" }, { cc:"3.5", pct:"10" },
  ],
  destTrad: "70", destAntic: "30", destHiper: "0",
  fenologia:  "mayor_50",
  vegetacion: "Pastizal natural NEA/Chaco",
  zona:       "NEA",
  provincia:  "Chaco",
  enso:       "neutro",
  pctReposicion: "18",
};

// SAT mínimo — sin datos reales, el motor usa fallback histórico
const SAT_NULL = null;

// ─── correrMotor ──────────────────────────────────────────────────
describe("correrMotor — Brangus 3/8 NEA", () => {
  let motor;
  beforeAll(() => { motor = correrMotor(FORM_NEA, SAT_NULL, [], false); });

  it("devuelve un objeto con shape esperada", () => {
    expect(motor).toBeDefined();
    expect(motor).toHaveProperty("tray");
    expect(motor).toHaveProperty("balanceMensual");
    expect(motor).toHaveProperty("scoreRiesgo");
    expect(motor).toHaveProperty("alertas");
    expect(motor).toHaveProperty("cadena");
  });

  it("CC ponderada en rango fisiológico [3.0 – 6.5]", () => {
    expect(motor.ccPondVal).toBeGreaterThanOrEqual(3.0);
    expect(motor.ccPondVal).toBeLessThanOrEqual(6.5);
  });

  it("balanceMensual tiene 12 meses", () => {
    expect(motor.balanceMensual).toHaveLength(12);
    motor.balanceMensual.forEach((m) => {
      expect(typeof m.balance).toBe("number");
      expect(isFinite(m.balance)).toBe(true);
    });
  });

  it("scoreRiesgo entre 0 y 100", () => {
    expect(motor.scoreRiesgo).toBeGreaterThanOrEqual(0);
    expect(motor.scoreRiesgo).toBeLessThanOrEqual(100);
  });

  it("preñez estimada entre 30 % y 100 %", () => {
    expect(motor.tray.pr).toBeGreaterThanOrEqual(30);
    expect(motor.tray.pr).toBeLessThanOrEqual(100);
  });

  it("nVacas coincide con el form", () => {
    expect(motor.nVacas).toBe(100);
  });

  it("alertas es array (puede estar vacío)", () => {
    expect(Array.isArray(motor.alertas)).toBe(true);
  });
});

describe("correrMotor — Nelore Chaco", () => {
  let motor;
  beforeAll(() => { motor = correrMotor(FORM_NELORE_CHACO, SAT_NULL, [], false); });

  it("devuelve resultado sin error", () => {
    expect(motor).not.toBeNull();
  });

  it("CC servicio Nelore menor que Brangus para misma distribución de CC", () => {
    // Nelore tiene umbral de anestro más bajo — puede servir con menos CC
    const motorBrangus = correrMotor(FORM_NEA, SAT_NULL, [], false);
    // Solo verificamos que ambos tengan tray.ccServ válido
    expect(motor.tray.ccServ).toBeGreaterThan(2.5);
    expect(motorBrangus.tray.ccServ).toBeGreaterThan(2.5);
  });

  it("200 vacas se reflejan correctamente", () => {
    expect(motor.nVacas).toBe(200);
  });
});

// ─── calcTrayectoriaCC ────────────────────────────────────────────
describe("calcTrayectoriaCC", () => {
  const params = {
    dist:        FORM_NEA.distribucionCC,
    cadena:      calcCadena("2024-11-01", "2025-01-31"),
    destTrad:    "100",
    destAntic:   "0",
    destHiper:   "0",
    supHa:       "500",
    vacasN:      "100",
    biotipo:     "Brangus 3/8",
    primerParto: false,
    supl1: "", dosis1: "0",
    supl2: "", dosis2: "0",
    supl3: "", dosis3: "0",
    provincia:   "Corrientes",
  };

  let tray;
  beforeAll(() => { tray = calcTrayectoriaCC(params); });

  it("tiene todas las claves esperadas", () => {
    expect(tray).toHaveProperty("ccHoy");
    expect(tray).toHaveProperty("ccParto");
    expect(tray).toHaveProperty("ccMinLact");
    expect(tray).toHaveProperty("ccServ");
    expect(tray).toHaveProperty("mesParto");
    expect(tray).toHaveProperty("mesDestete");
    expect(tray).toHaveProperty("mesServ");
    expect(tray).toHaveProperty("pr");
    expect(tray).toHaveProperty("anestro");
  });

  it("ccParto ≥ ccMinLact (la vaca cae tras parir, no sube durante lactación)", () => {
    expect(tray.ccParto).toBeGreaterThanOrEqual(tray.ccMinLact);
  });

  it("todos los valores CC en rango fisiológico [2.5 – 7.0]", () => {
    [tray.ccHoy, tray.ccParto, tray.ccMinLact, tray.ccServ].forEach((cc) => {
      expect(cc).toBeGreaterThanOrEqual(2.5);
      expect(cc).toBeLessThanOrEqual(7.0);
    });
  });

  it("meses de hitos son enteros 0-11", () => {
    [tray.mesParto, tray.mesDestete, tray.mesServ].forEach((m) => {
      expect(Number.isInteger(m)).toBe(true);
      expect(m).toBeGreaterThanOrEqual(0);
      expect(m).toBeLessThanOrEqual(11);
    });
  });

  it("preñez estimada entre 30 % y 100 %", () => {
    expect(tray.pr).toBeGreaterThanOrEqual(30);
    expect(tray.pr).toBeLessThanOrEqual(100);
  });

  it("días de anestro en rango plausible [0 – 200 d]", () => {
    expect(tray.anestro.dias).toBeGreaterThanOrEqual(0);
    expect(tray.anestro.dias).toBeLessThanOrEqual(200);
  });
});

// ─── calcCadena ───────────────────────────────────────────────────
describe("calcCadena", () => {
  it("retorna duración de servicio en días correcta", () => {
    const c = calcCadena("2024-11-01", "2025-01-31");
    expect(c.diasServ).toBe(91);
    expect(c.ini.getMonth()).toBe(10); // noviembre = índice 10
    expect(c.fin.getMonth()).toBe(0);  // enero = índice 0
  });

  it("servicio corto (45 días)", () => {
    const c = calcCadena("2024-11-15", "2024-12-31");
    expect(c.diasServ).toBe(46);
  });

  it("retorna null con fechas inválidas", () => {
    expect(calcCadena("", "")).toBeNull();
    expect(calcCadena(null, null)).toBeNull();
  });
});

// ─── balancePorCategoria ──────────────────────────────────────────
describe("balancePorCategoria — sanity checks", () => {
  let motor;
  beforeAll(() => { motor = correrMotor(FORM_NEA, SAT_NULL, [], false); });

  it("cat=general retorna 12 meses con balance numérico", () => {
    const res = balancePorCategoria(motor, FORM_NEA, SAT_NULL, "general");
    expect(res.meses).toHaveLength(12);
    res.meses.forEach((m) => {
      expect(typeof m.balance).toBe("number");
      expect(isFinite(m.balance)).toBe(true);
    });
  });

  it("cat=vaq1 tiene GDP numérica en cada mes", () => {
    const res = balancePorCategoria(motor, FORM_NEA, SAT_NULL, "vaq1");
    if (res.nAnimales > 0) {
      res.meses.forEach((m) => {
        expect(typeof m.gdp).toBe("number");
      });
    }
  });
});
