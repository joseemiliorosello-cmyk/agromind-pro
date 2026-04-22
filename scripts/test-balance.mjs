// scripts/test-balance.mjs
// Validacion numerica del caso de prueba Bug 3
// Vaquillona 1° invierno, 180 kg PV, Octubre (mes 9), NEA, pastizal natural
// Ejecutar: node scripts/test-balance.mjs

// ─── Replica local de las funciones relevantes de motor.js ───

const NDVI_ESTAC_NEA = [1.00,0.98,0.92,0.80,0.68,0.55,0.48,0.52,0.65,0.80,0.92,0.98];

const DIG_PASTIZAL = { menor_10: 60, "10_25": 56, "25_50": 52, mayor_50: 48 };

function fenologiaPorMes(mes) {
  const ciclo = {
    8:"menor_10", 9:"menor_10",
    10:"10_25", 11:"10_25", 0:"10_25", 1:"10_25",
    2:"25_50", 3:"25_50", 4:"25_50",
    5:"mayor_50", 6:"mayor_50", 7:"mayor_50",
  };
  return ciclo[mes] || "25_50";
}

function factorAccesibilidad(d) {
  if (d >= 3000) return 1.00;
  if (d >= 1500) return 0.90;
  if (d >= 800)  return 0.75;
  if (d >= 400)  return 0.55;
  return 0.35;
}

function factorCalidad(d) {
  if (d >= 65) return 1.00;
  if (d >= 60) return 0.90;
  if (d >= 55) return 0.75;
  if (d >= 50) return 0.60;
  return 0.45;
}

function factorPB(pb, suplPB) {
  if (pb < 7 && suplPB >= 80) return 1.00;
  if (pb >= 10) return 1.00;
  if (pb >= 7)  return 0.95;
  if (pb >= 5)  return 0.80;
  return 0.65;
}

function factorSequia(p) {
  if (p >= 80) return 1.00;
  if (p >= 40) return 0.95;
  if (p >= 20) return 0.85;
  return 0.75;
}

function reqEM(pv, cat) {
  const factores = {
    "Gestación temprana (1–4 meses)": 1.15,
    "Gestación media (5–7 meses)": 1.20,
    "Preparto (último mes)": 1.35,
    "Lactación con ternero al pie": 1.90,
    "Vaca seca sin ternero": 1.00,
    "Vaca 1° parto lactando": 2.10,
    vaq1inv: 1.30,
    vaq2inv: 1.20,
  };
  const f = factores[cat] || 1.10;
  return +(Math.pow(pv, 0.75) * 0.077 * f).toFixed(1);
}

// ─── Caso de prueba ───
const mes = 9;           // Octubre
const pv = 180;          // kg PV vaquillona
const consPot = 2.5;     // % PV (post-fix)
const ndvi = NDVI_ESTAC_NEA[mes]; // 0.80
const dispMS = 2000 * ndvi;       // 1600 kg MS/ha
const lluvia30 = 80;

// Fenologia dinamica (post-fix Bug 1)
const fenol = fenologiaPorMes(mes);
// Digestibilidad sin amplificacion NDVI (post-fix Bug 3)
const digFinal = Math.max(40, Math.min(70, DIG_PASTIZAL[fenol] || 52));
// PB del pasto (multiplicador fenologico)
const pbBase = 10; // fallback FORRAJE["Pastizal natural"].pb
const pbMul = { mayor_50: 0.4, "25_50": 0.6, "10_25": 0.8, menor_10: 1.0 }[fenol] || 1.0;
const pbMes = pbBase * pbMul;

// 4 factores de consumo
const F1 = factorAccesibilidad(dispMS);
const F2 = factorCalidad(digFinal);
const F3 = factorPB(pbMes, 0);
const F4 = factorSequia(lluvia30);

const consRealPctPV = consPot * F1 * F2 * F3 * F4;
const kgMS = pv * consRealPctPV / 100;
const EM_pasto = 4.4 * (digFinal / 100) * 0.82;
const mcalDia = kgMS * EM_pasto;

// Demanda (post-fix Bug 3: usa vaq1inv en vez de estado de vaca)
const demanda = reqEM(pv, "vaq1inv");

const balance = mcalDia - demanda;
const gdp = Math.round((balance / 5.0) * 1000);

console.log("=== TEST BUG 3 — Vaq1 Octubre NEA pastizal natural ===");
console.log(`Mes: ${mes} (Oct) | fenol esperada: ${fenol}`);
console.log(`NDVI: ${ndvi} | dispMS: ${dispMS} kg/ha`);
console.log(`digFinal: ${digFinal}% (sin amplif NDVI)`);
console.log(`pbMes: ${pbMes.toFixed(1)}%`);
console.log(`Factores: F1=${F1} F2=${F2} F3=${F3} F4=${F4}`);
console.log(`consRealPctPV: ${consRealPctPV.toFixed(3)}%`);
console.log(`kgMS: ${kgMS.toFixed(2)} kg/d`);
console.log(`EM_pasto: ${EM_pasto.toFixed(3)} Mcal/kg`);
console.log(`mcalDia (oferta): ${mcalDia.toFixed(2)} Mcal/d`);
console.log(`reqEM (vaq1inv): ${demanda} Mcal/d`);
console.log(`balance: ${balance.toFixed(2)} Mcal/d`);
console.log(`GDP: ${gdp} g/d  ← esperado ~600 g/d`);
console.log(gdp >= 550 && gdp <= 650 ? "✓ OK — dentro del rango ±50 g/d" : `✗ FUERA DE RANGO (esperado 550-650)`);

// ─── Comparacion: codigo ANTES de los fixes ───
console.log("\n=== COMPARACION: codigo antes de fixes ===");
const fenolAntes = "25_50"; // estatico, el que el usuario cargaria en julio
const digAntes = Math.max(40, Math.min(70, DIG_PASTIZAL[fenolAntes] * (ndvi / 0.7)));
const F2antes = factorCalidad(digAntes);
const kgMSantas = pv * (3.0 * F1 * F2antes * F3 * F4) / 100;
const EMantes = 4.4 * (digAntes / 100) * 0.82;
const mcalAntes = kgMSantas * EMantes;
const demandaAntes = reqEM(pv, "Vaca seca sin ternero"); // bug: usaba estado de vaca
const gdpAntes = Math.round(((mcalAntes - demandaAntes) / 5.0) * 1000);
console.log(`fenol estatica: ${fenolAntes} | digAntes: ${digAntes.toFixed(1)}% (con amplif NDVI)`);
console.log(`GDP antes de fixes: ${gdpAntes} g/d`);
