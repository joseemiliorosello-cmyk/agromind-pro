// scripts/test-balance.mjs — Validacion Bug 3 con modulacion NDVI suave
// Vaquillona 1° invierno, 180 kg PV, Octubre (mes 9), NEA, pastizal natural
// node scripts/test-balance.mjs

const NDVI_ESTAC_NEA = [1.00,0.98,0.92,0.80,0.68,0.55,0.48,0.52,0.65,0.80,0.92,0.98];
const DIG_PASTIZAL   = { menor_10: 60, "10_25": 56, "25_50": 52, mayor_50: 48 };

function fenologiaPorMes(mes) {
  const c = { 8:"menor_10",9:"menor_10", 10:"10_25",11:"10_25",0:"10_25",1:"10_25",
               2:"25_50",3:"25_50",4:"25_50", 5:"mayor_50",6:"mayor_50",7:"mayor_50" };
  return c[mes] || "25_50";
}
function factorAccesibilidad(d) {
  return d>=3000?1.00:d>=1500?0.90:d>=800?0.75:d>=400?0.55:0.35;
}
function factorCalidad(d) {
  return d>=65?1.00:d>=60?0.90:d>=55?0.75:d>=50?0.60:0.45;
}
function factorPB(pb, s) {
  if (pb < 7 && s >= 80) return 1.00;
  return pb>=10?1.00:pb>=7?0.95:pb>=5?0.80:0.65;
}
function factorSequia(p) {
  return p>=80?1.00:p>=40?0.95:p>=20?0.85:0.75;
}
function reqEM(pv, cat) {
  const f = { "Vaca seca sin ternero":1.00, vaq1inv:1.30, vaq2inv:1.20,
               "Gestación temprana (1–4 meses)":1.15, "Lactación con ternero al pie":1.90 }[cat]||1.10;
  return +(Math.pow(pv, 0.75) * 0.077 * f).toFixed(1);
}

// ─── Caso de prueba ───
const mes       = 9;
const pv        = 180;
const consPot   = 2.4;   // % PV (calibrado con formula NDVI suave)
const ndviMes   = NDVI_ESTAC_NEA[mes];
const dispMS    = 2000 * ndviMes;
const lluvia30  = 80;

const fenol     = fenologiaPorMes(mes);
const ndviFactor= 0.90 + (ndviMes * 0.2);
const digMes    = (DIG_PASTIZAL[fenol] || 52) * Math.min(1.10, Math.max(0.90, ndviFactor));
const digFinal  = Math.max(40, Math.min(70, digMes));
const pbBase    = 10;
const pbMul     = { mayor_50:0.4,"25_50":0.6,"10_25":0.8,menor_10:1.0 }[fenol] || 1.0;
const pbMes     = pbBase * pbMul;

const F1 = factorAccesibilidad(dispMS);
const F2 = factorCalidad(digFinal);
const F3 = factorPB(pbMes, 0);
const F4 = factorSequia(lluvia30);

const consRealPctPV = consPot * F1 * F2 * F3 * F4;
const kgMS    = pv * consRealPctPV / 100;
const EM_pasto= 4.4 * (digFinal / 100) * 0.82;
const mcalDia = kgMS * EM_pasto;
const demanda = reqEM(pv, "vaq1inv");
const balance = mcalDia - demanda;
const gdp     = Math.round((balance / 5.0) * 1000);

console.log("=== TEST Bug 3 — Vaq1 Octubre NEA pastizal natural ===");
console.log(`Mes: ${mes} (Oct) | fenol: ${fenol}`);
console.log(`NDVI: ${ndviMes} | ndviFactor: ${ndviFactor.toFixed(3)} | dispMS: ${dispMS} kg/ha`);
console.log(`digBase: ${DIG_PASTIZAL[fenol]}% → digFinal: ${digFinal.toFixed(1)}% (mod NDVI suave)`);
console.log(`pbMes: ${pbMes.toFixed(1)}%`);
console.log(`Factores: F1=${F1} F2=${F2} F3=${F3} F4=${F4}`);
console.log(`consPot: ${consPot}% PV | consRealPctPV: ${consRealPctPV.toFixed(3)}%`);
console.log(`kgMS: ${kgMS.toFixed(2)} kg/d`);
console.log(`EM_pasto: ${EM_pasto.toFixed(3)} Mcal/kg`);
console.log(`mcalDia (oferta): ${mcalDia.toFixed(2)} Mcal/d`);
console.log(`reqEM (vaq1inv):  ${demanda} Mcal/d`);
console.log(`balance: ${balance.toFixed(2)} Mcal/d`);
console.log(`GDP: ${gdp} g/d   ← esperado 550-650 g/d`);
const ok = gdp >= 550 && gdp <= 650;
console.log(ok ? "✓ OK — dentro del rango" : `✗ FUERA DE RANGO (esperado 550-650)`);
