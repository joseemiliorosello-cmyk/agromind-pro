# Auditoria de citas bibliograficas — motor.js

_Generado: 2026-04-21 10:04_

Este archivo lista cada UMBRAL NUMERICO critico del motor y su cita actual.
Marca con [OK] si la cita es suficiente, [FALTA] si hay que agregar, [VERIFICAR] si dudas.

---

## 1. Tabla CC al servicio -> Prenez (CC_PR)

**Uso:** Relacion CC al servicio con probabilidad de prenez. Nucleo del diagnostico reproductivo.

**Citas detectadas en comentarios:**

[FALTA CITA] — no se detectaron referencias bibliograficas en comentarios.

**Codigo:**
```js
CC_PR = [
  {ccP:7.0,pr:98},{ccP:6.5,pr:97},{ccP:6.0,pr:96},{ccP:5.5,pr:93},
  {ccP:5.0,pr:88},{ccP:4.5,pr:80},{ccP:4.0,pr:70},{ccP:3.5,pr:50},{ccP:3.0,pr:28},{ccP:2.5,pr:10},
]
```

**Mi decision:** [ ] OK como esta  [ ] Fortalecer cita  [ ] Falta cita  [ ] No aplica

---

## 2. Umbrales de anestro posparto (calcAnestro)

**Uso:** Dias de anestro segun CC parto, CC minima lactacion, biotipo, 1er parto.

**Citas detectadas en comentarios:**

```
// Short et al. 1990; Neel et al. 2007 — relación CC-anestro no lineal
// Déficit severo (>0.5 CC bajo umbral): respuesta exponencial (Short 1990)
// CC mínima en lactación: si cae <2.0 → bloqueo LH prolongado (Short 1990)
const baseDias = primerParto ? 68 : 50; // Short 1990: base 50d adulta, 68d 1°parto
```

**Codigo:**
```js
function calcAnestro(ccParto, ccMinLact, biotipo, primerParto) {
  // Short et al. 1990; Neel et al. 2007 — relación CC-anestro no lineal
  // Por encima del umbral: anestro basal
  // Déficit leve (0–0.5 CC bajo umbral): anestro moderado, respuesta acelerada
  // Déficit severo (>0.5 CC bajo umbral): respuesta exponencial (Short 1990)
  // CC mínima en lactación: si cae <2.0 → bloqueo LH prolongado (Short 1990)
  const bt      = getBiotipo(biotipo || "Brangus 3/8");
  const umbral  = primerParto ? bt.umbralAnestro + 0.3 : bt.umbralAnestro;
  const defCC   = Math.max(0, umbral - ccParto); // déficit vs umbral al parto
  const defMin  = Math.max(0, 2.0 - ccMinLact);  // déficit vs piso fisiológico
  const baseDias = primerParto ? 68 : 50; // Short 1990: base 50d adulta, 68d 1°parto

  // Componente preparto (CC al parto vs umbral): no lineal — se acelera con déficit severo
  // 0–0.3 CC déficit: +12d/punto (respuesta moderada)
  // 0.3–0.7 CC déficit: +28d/punto (respuesta acelerada — umbral superado)
  // >0.7 CC déficit: +55d/punto (severo — bloqueo LH persistente)
  let compParto = 0;
  const tramos = [
    { limite:0.3, tasa:12 },
    { limite:0.7, tasa:28 },
...(truncado)
```

**Mi decision:** [ ] OK como esta  [ ] Fortalecer cita  [ ] Falta cita  [ ] No aplica

---

## 3. Tasas de caida CC en lactacion (calcTrayectoriaCC)

**Uso:** CC/mes de caida segun nivel de CC al parto. Base Peruchena 2003.

**Citas detectadas en comentarios:**

[FALTA CITA] — no se detectaron referencias bibliograficas en comentarios.

**Codigo:**
```js
tasaCaidaBase = ccParto >= 6.0 ? 0.28
    : ccParto >= 5.5 ? 0.32
    : ccParto >= 5.0 ? 0.36
    : ccParto >= 4.5 ? 0.40
    : 0.44;
```

**Mi decision:** [ ] OK como esta  [ ] Fortalecer cita  [ ] Falta cita  [ ] No aplica

---

## 4. Tasas de recuperacion CC post-destete

**Uso:** CC/dia de recuperacion segun temperatura.

**Citas detectadas en comentarios:**

[FALTA CITA] — no se detectaron referencias bibliograficas en comentarios.

**Codigo:**
```js
tasaRecup = t >= 25 ? 0.013 : t >= 20 ? 0.009 : t >= 15 ? 0.005 : 0.003;
```

**Mi decision:** [ ] OK como esta  [ ] Fortalecer cita  [ ] Falta cita  [ ] No aplica

---

## 5. GDP vaquillona con suplemento (calcVaq1)

**Uso:** Mcal/kg ganancia. NRC 2000 Tabla 1.

**Citas detectadas en comentarios:**

[FALTA CITA] — no se detectaron referencias bibliograficas en comentarios.

**Codigo:**
```js
COSTO_KG_VAQ = 5.0;
```

**Mi decision:** [ ] OK como esta  [ ] Fortalecer cita  [ ] Falta cita  [ ] No aplica

---

## 6. GDP minimo vaq2 invierno

**Uso:** g/dia minimo para llegar al entore.

**Citas detectadas en comentarios:**

[FALTA CITA] — no se detectaron referencias bibliograficas en comentarios.

**Codigo:**
```js
GDP_MIN_VAQ2 = 330;
```

**Mi decision:** [ ] OK como esta  [ ] Fortalecer cita  [ ] Falta cita  [ ] No aplica

---

## 7. Metano CH4 - IPCC 2019 (calcYm, calcCH4_kgMS)

**Uso:** Factores Ym por digestibilidad. IPCC 2019 Tier 2 + Gere 2019/2024.

**Citas detectadas en comentarios:**

```
// Ym (fracción de pérdida de energía bruta como CH₄) — IPCC 2019 Tier 2, Ec.10.21
// Calibrado para forrajeras C4 NEA-Chaco (Gere et al. 2019, NZ J. Agric. Res. 62(3):346;
// Gere et al. 2024, Anim. Feed Sci. Technol. 310:115929)
// Relación inversa dig↑ → Ym↓ (r = −0.69, p<0.001 en Gere et al. 2019)
//   dig >74%:   5.5% — piso IPCC 2019 Tier 2 para Bos indicus
// El efecto del suplemento proteico (Beauchemin et al. 2009; Benchaar 2020)
return 5.5 / 100; // ≥69% — rango verdeo/suplementado; piso IPCC
```

**Codigo:**
```js
function calcYm(dig) {
  // Ym (fracción de pérdida de energía bruta como CH₄) — IPCC 2019 Tier 2, Ec.10.21
  // Calibrado para forrajeras C4 NEA-Chaco (Gere et al. 2019, NZ J. Agric. Res. 62(3):346;
  // Gere et al. 2024, Anim. Feed Sci. Technol. 310:115929)
  // Relación inversa dig↑ → Ym↓ (r = −0.69, p<0.001 en Gere et al. 2019)
  // Valores por rango de digestibilidad (% MS):
  //   dig ≤50%: 7.8% — C4 degradado/sequía
  //   dig 51-56%: 7.2% — C4 invierno NEA (pastizal nativo, encañado)
  //   dig 57-62%: 6.5% — C4 transición primavera temprana
  //   dig 63-68%: 6.2% — C4 primavera/verano activo
  //   dig 69-74%: 5.5% — Verdeo avena/raigrás o C4 +suplemento
  //   dig >74%:   5.5% — piso IPCC 2019 Tier 2 para Bos indicus
  // El efecto del suplemento proteico (Beauchemin et al. 2009; Benchaar 2020)
  // se captura a través de digConSupl(): mejora la digestibilidad total → Ym baja
  if (dig <= 50) return 7.8 / 100;
  if (dig <= 56) return 7.2 / 100;
  if (dig <= 62) return 6.5 / 100;
  if (dig <= 68) return 6.2 / 100;
  return 5.5 / 100; // ≥69% — rango verdeo/suplementado; piso IPCC
}
```

**Mi decision:** [ ] OK como esta  [ ] Fortalecer cita  [ ] Falta cita  [ ] No aplica

---

## 8. Umbrales agua (AGUA_CATEGORIAS)

**Uso:** Categorias TDS. NRC 2000 / Lopez 2021 / Patterson 2003.

**Citas detectadas en comentarios:**

[FALTA CITA] — no se detectaron referencias bibliograficas en comentarios.

**Codigo:**
```js
AGUA_CATEGORIAS = [
  { min:0,     max:1000,      label:"Excelente",     color:"#7ec850", riesgo:0, desc:"Sin restricción. Sin impacto en consumo ni performance." },
  { min:1000,  max:3000,      label:"Satisfactoria", color:"#a8d870", riesgo:1, desc:"Aceptable para todas las categorías. Impacto mínimo en DMI (<2%)." },
  { min:3000,  max:5000,      label:"Moderada",      color:"#e8a030", riesgo:2, desc:"Puede reducir DMI 2–5% y WI hasta 8%. Monitorear en lactación y gestación tardía." },
  { min:5000,  max:7000,      label:"Alta salinidad",color:"#d46820", riesgo:3, desc:"Reducción DMI 5–12%, WI 10–20%. Evitar en vaquillonas y lactación." },
  { min:7000,  max:10000,     label:"Problemática",  color:"#e05530", riesgo:4, desc:"Reducción severa DMI >12%. Contraindicada en categorías productivas." },
  { min:10000, max:Infinity,  label:"No apta",       color:"#c02010", riesgo:5, desc:"No usar en bovinos. Riesgo de intoxicación salina, diarrea, muerte." },
];
```

**Mi decision:** [ ] OK como esta  [ ] Fortalecer cita  [ ] Falta cita  [ ] No aplica

---

## 9. Calendario sanitario (evaluarSanidad)

**Uso:** Dias antes de servicio para cada vacuna.

**Citas detectadas en comentarios:**

[FALTA CITA] — no se detectaron referencias bibliograficas en comentarios.

**Codigo:**
```js
function evaluarSanidad(vacunas, brucelosis, aftosa, toros, historiaAbortos, programaSanit, cadena
```

**Mi decision:** [ ] OK como esta  [ ] Fortalecer cita  [ ] Falta cita  [ ] No aplica

---

## 10. Tabla supervivencia por CC (TABLA_SUPERV)

**Uso:** % supervivencia segun estado reproductivo y CC.

**Citas detectadas en comentarios:**

[FALTA CITA] — no se detectaron referencias bibliograficas en comentarios.

**Codigo:**
```js
TABLA_SUPERV = {
  // estado: [MuyFlaca, Flaca, Regular, Buena]
  "Vacía":               [45, 50, 79, 99],
  "Preñez chica (cola)": [36, 41, 70, 90],
  "Preñez media (cuerpo)":[23, 28, 57, 77],
  "Preñez grande (cabeza)":[10, 14, 44, 64],
};
```

**Mi decision:** [ ] OK como esta  [ ] Fortalecer cita  [ ] Falta cita  [ ] No aplica

---

## 11. Requerimiento EM por categoria (reqEM)

**Uso:** Factor de requerimiento segun estado fisiologico.

**Citas detectadas en comentarios:**

[FALTA CITA] — no se detectaron referencias bibliograficas en comentarios.

**Codigo:**
```js
function reqEM(pv, cat, biotipo) {
  const p = parseFloat(pv) || 0;
  if (!p) return null;
  const bFact = biotipo ? getBiotipo(biotipo).factReq : 1.0;
  const f = {
    "Gestación temprana (1–4 meses)":  1.15,
    "Gestación media (5–7 meses)":     1.20,
    "Preparto (último mes)":           1.35,
    "Lactación con ternero al pie":    1.90,
    "Vaca seca sin ternero":           1.00,
    "Vaca 1° parto lactando":          2.10,
    vaq1inv: 1.30,
    vaq2inv: 1.20,
  }[cat] || 1.10;
  return +(Math.pow(p, 0.75) * 0.077 * f * bFact).toFixed(1);
}
```

**Mi decision:** [ ] OK como esta  [ ] Fortalecer cita  [ ] Falta cita  [ ] No aplica

---

## 12. Disponibilidad MS por altura (TABLA_DISP_MS)

**Uso:** kgMS/ha segun altura y tipo de pasto. Metodo INTA.

**Citas detectadas en comentarios:**

[FALTA CITA] — no se detectaron referencias bibliograficas en comentarios.

**Codigo:**
```js
TABLA_DISP_MS = {
  // [altCm]: { corto_denso:[min,max], alto_ralo:[min,max], alto_denso:[min,max] }
  10: { corto_denso:[1000,1200], alto_ralo:[600,800],   alto_denso:[800,1000]  },
  20: { corto_denso:[1800,2400], alto_ralo:[1000,1200], alto_denso:[1800,2400] },
  30: { corto_denso:[2700,3200], alto_ralo:[2000,3000], alto_denso:[3300,3700] },
  40: { corto_denso:[3000,5000], alto_ralo:[3000,5000], alto_denso:[4500,5000] },
};
```

**Mi decision:** [ ] OK como esta  [ ] Fortalecer cita  [ ] Falta cita  [ ] No aplica

---

## 13. NDVI estacional por zona (NDVI_ESTAC)

**Uso:** Curva NDVI por zona y mes.

**Citas detectadas en comentarios:**

[FALTA CITA] — no se detectaron referencias bibliograficas en comentarios.

**Codigo:**
```js
NDVI_ESTAC = {
  "NEA":           [1.00,0.98,0.92,0.80,0.68,0.55,0.48,0.52,0.65,0.80,0.92,0.98],
  "NOA":           [0.95,0.98,1.00,0.88,0.72,0.58,0.50,0.55,0.68,0.82,0.90,0.93],
  "Pampa Húmeda":  [1.00,0.97,0.90,0.82,0.78,0.72,0.70,0.75,0.82,0.90,0.96,1.00],
  "Paraguay Oriental": [1.00,0.98,0.93,0.82,0.70,0.58,0.50,0.55,0.67,0.80,0.92,0.98],
  "Chaco Paraguayo":   [1.00,0.97,0.90,0.78,0.65,0.52,0.45,0.50,0.63,0.78,0.90,0.97],
  "Brasil (Cerrado)":  [0.85,0.82,0.80,0.75,0.68,0.58,0.52,0.55,0.65,0.78,0.85,0.87],
  "Bolivia (Llanos)":  [0.90,0.92,0.95,0.88,0.75,0.60,0.52,0.55,0.65,0.78,0.86,0.90],
};
```

**Mi decision:** [ ] OK como esta  [ ] Fortalecer cita  [ ] Falta cita  [ ] No aplica

---

## 14. Produccion base por vegetacion (PROD_BASE)

**Uso:** kgMS/ha base por tipo forraje. Buscar en lib/constantes.js.

**Citas detectadas en comentarios:**

[FALTA CITA] — no se detectaron referencias bibliograficas en comentarios.

**Codigo:**
```js
PROD_BASE
```

**Mi decision:** [ ] OK como esta  [ ] Fortalecer cita  [ ] Falta cita  [ ] No aplica

---
