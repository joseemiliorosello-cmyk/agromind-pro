# Sector 02 — Motor de cálculo y datos utilizados

[← Volver al índice](README.md)

Este sector explica **cómo la app convierte los datos cargados en un diagnóstico**:
qué fórmulas usa cada módulo, de dónde salen los números, y cómo se conectan entre sí.

El motor de cálculo vive en `lib/motor.js` y se ejecuta completo cada vez que cambia
un dato. La función maestra es **`correrMotor(form, sat, potreros)`**.

---

## Mapa general: cómo fluye la información

```
DATOS DE ENTRADA                    MÓDULOS DE CÁLCULO                 RESULTADOS
─────────────────                   ──────────────────                 ──────────
Potreros (ha, recurso, altura) ─┐
Fenología ──────────────────────┼─► OFERTA FORRAJERA ──┐
NDVI (satélite) ────────────────┤   (disponMS)          │
ENSO ───────────────────────────┘                       ├─► BALANCE ─► SCORES
                                                         │   MENSUAL     DIAGNÓSTICO
N° animales × categoría ────────┬─► DEMANDA ENERGÉTICA ──┘   (12 meses)  CUELLOS
PV vaca adulta ─────────────────┘   (requerimientos)                    PLAN
                                                                          
CC del rodeo ──────┐                                                     
Fechas servicio ───┼─► TRAYECTORIA CC ─► PREÑEZ estimada                 
Tipo destete ──────┤   (calcTrayectoriaCC)                              
Biotipo ───────────┘                                                     
Agua (TDS) ────────► factorAgua ─► corrige oferta de TODAS las categorías
```

---

## 1. La oferta forrajera: cuánto pasto hay

### 1.1 Disponibilidad de materia seca (`disponMS`)

Es la base de la oferta. Se calcula de dos maneras:

- **Con potreros cargados:** promedio ponderado por hectárea de la disponibilidad de
  cada potrero. Cada potrero aporta según su altura de pasto y tipo (`calcDisponibilidadMS`).
- **Sin potreros:** se usa la altura y tipo de pasto general del campo.

El resultado se clasifica en un **nivel**:

| Nivel | Disponibilidad | Interpretación |
|-------|---------------|----------------|
| **Alta** | ≥ 2000 kg MS/ha | Pasto abundante |
| **Media** | 1000–2000 kg MS/ha | Suficiente |
| **Baja** | < 1000 kg MS/ha | Escaso |

### 1.2 El efecto del agua (`factorAgua` → `nivelEfectivo`)

Si el agua es salina (TDS alto), el animal **bebe y come menos**. La app calcula un
`factorAgua` (0 a 1) que **reduce la disponibilidad efectiva**:

```
msHaEfectivo = msHa × factorAgua
```

De ahí sale `nivelEfectivo`, que es el que realmente usan todas las categorías
(vacas, vaquillonas, etc.). **Agua mala = menos pasto útil, aunque el potrero esté verde.**

### 1.3 Oferta mensual y estacionalidad

La oferta se distribuye a lo largo de los 12 meses según:

- **Clima histórico** de la provincia (temperatura y lluvia mes a mes).
- **Pastos C4 (megatérmicos):** crecen en verano y **entran en dormancia en invierno**.
  Por eso la oferta cae fuerte en junio–agosto.
- **ENSO:** El Niño +25 %, La Niña −25 %.
- **NDVI:** el verdor real del satélite ajusta la oferta del mes actual.

### 1.4 El efecto de la carga (`factorCarga`)

Demasiados animales por hectárea **degradan la pastura**. La carga se mide en **EV/ha**
(Equivalente Vaca por hectárea):

| Carga | factorCarga | Efecto |
|-------|-------------|--------|
| ≤ 0,5 EV/ha | 1,00 | Sin degradación |
| 0,5–0,8 | 0,97 | Leve |
| 0,8–1,2 | 0,88 | Moderada (alerta P2) |
| > 1,2 EV/ha | 0,70 | **Sobrecarga severa −30 % (alerta P1)** |

Los coeficientes de EV por categoría: vaca 1,0 · toro 1,4 · V2S 1,1 · vaq2 0,7 · vaq1 0,4.

El suplemento **alivia parcialmente** la presión sobre el pasto (sustitución, hasta 35 %).

---

## 2. La demanda energética: cuánto pasto necesitan

Cada categoría tiene un **requerimiento de energía metabolizable (Mcal/día)** que
depende de su peso, estado fisiológico y biotipo (`reqEM`). Los estados clave:

- **Vaca en lactación** — el requerimiento más alto (mantiene ternero al pie).
- **Vaca en gestación** (temprana, media, preparto) — crece hacia el final.
- **Vaca seca** — el más bajo.

### La clave: demanda ponderada mes a mes

El motor **no usa un requerimiento fijo**. Para cada mes calcula, según la cadena
reproductiva y el mix de destete, **qué fracción de las vacas está en lactación**
(`fracLact`) y cuáles ya están secas o en preparto. Así, una vaca con destete
hiperprecoz "sale" de lactación a los ~2 meses y su demanda cae; una con destete
tradicional sigue demandando 6 meses.

También suma la **demanda del ternero al pie** (consumo de pasto propio, que crece
con la edad).

---

## 3. El balance energético mensual

Para cada uno de los 12 meses:

```
BALANCE (Mcal/día) = OFERTA total − DEMANDA total
```

- **Oferta total** = oferta forrajera del mes × factorCarga × factorAgua + verdeos + suplementos.
- **Demanda total** = suma de todas las categorías × su requerimiento del mes + terneros.

Cada mes devuelve: **oferta, demanda, balance, déficit (sí/no), % de cobertura**
(oferta/demanda), carga ajustada, y demanda del ternero.

El **invierno (junio-julio-agosto)** es el período crítico: es cuando el pasto C4
está dormante y la vaca suele estar en gestación avanzada. Si hay déficit acá, la
vaca **pierde CC justo antes del servicio**.

> El balance también se puede leer en **kg de MS/día** (dividiendo por 2,2 Mcal/kg,
> el valor energético medio del pastizal NEA).

---

## 4. La trayectoria de condición corporal (CC)

`calcTrayectoriaCC` es el módulo que **conecta la CC con la reproducción**. Proyecta
cómo evoluciona la CC del rodeo a lo largo del año en **4 fases**:

1. **CC al tacto = CC al parto.** La vaca gestante sin ternero no moviliza reservas.
   El suplemento preparto puede sumar +0,1 a +0,2 CC.
2. **Parto → destete (caída):** el ternero al pie hace que la vaca movilice reservas.
   Cuanto más larga la lactación, más cae la CC. El **biotipo** modula cuánto
   (Bos indicus moviliza menos: `movCC`).
3. **Destete → servicio (recuperación):** sin ternero, la vaca recupera. La tasa
   depende de la **temperatura del mes** (proxy estacional del pasto C4) y ahora
   también del **factor forrajero** (ver 4.1). Máximo 120 días de recuperación.
4. **CC al servicio → preñez:** la CC final se traduce a **% de preñez** mediante la
   tabla `CC_PR` (relación validada CC-preñez, base Selk 1988 / Short 1990).

### 4.1 El factor forrajero unificado (`calcFactorForrajero`)

Este es el nexo que conecta **el pasto real con la vaca adulta**. Combina tres fuentes
en un solo factor (0,45 a 1,25) que **pondera la recuperación de CC**:

```
factorForrajero = f(cantidad MS de potreros × calidad fenológica × NDVI)
```

- **Cantidad** (nivelEfectivo): baja 0,60 · media 0,85 · alta 1,10.
- **Calidad** (fenología): rebrote 1,15 · … · encañado 0,65.
- **NDVI:** verdor real, referencia 0,45.

Además, tras calcular el balance, la app compara este factor con el **balance energético
real** del período destete→servicio y **toma el más limitante de los dos**. Es decir:
si el pasto está escaso *o* el balance es deficitario, la recuperación de CC baja — y
gana siempre la peor condición. Con esto, **pasto escaso → menos CC al servicio → menos
preñez proyectada.**

---

## 5. Las vaquillonas de reposición

La recría se modela en dos inviernos:

### `calcVaq1` — 1er invierno (recría)

- Parte del **PV de entrada** (medido o estimado desde la edad/tipo de destete).
- Calcula el **GDP invernal**: sin suplemento, el pastizal C4 dormante da **pérdida o
  mantenimiento** (−80 a 0 g/d según disponibilidad). El **suplemento proteico** es lo
  que genera ganancia positiva.
- Acepta **dos slots de suplemento** (principal + complemento) y suma su aporte de Mcal.
- Objetivo: ganar ~65 kg en el invierno (GDP mínimo ~533 g/d).

### `calcVaq2` — verano + 2do invierno → entore

- **Verano** (`gdpVeranoPotreros`): la ganancia primavera-verano se calcula **potrero
  por potrero**, ponderada por hectárea, tipo de recurso y NDVI, en 4 fases estacionales.
- **O**, si el veterinario cargó el **PV medido al inicio del 2do invierno** (`vaq2PV`),
  se usa ese dato directo (sin volver a sumar el verano — evita el doble conteo).
- Calcula el **PV al entore** y lo compara con el **mínimo (75 % del PV adulto)**.

> El objetivo biológico del entore es que la vaquillona llegue al **65–75 % de su peso
> adulto**. Por debajo: menor fertilidad, más anestro, riesgo de no gestación.

---

## 6. El sistema de scores (`calcScore`)

Resume la salud del sistema en **5 dimensiones ponderadas** (total sobre 100):

| Dimensión | Peso | Qué mide |
|-----------|------|----------|
| **CC al servicio** | **30 %** | Óptimo ≥5,0 · aceptable ≥4,5 · crítico <4,0 |
| **Balance invernal** | **20 %** | Cuántos de los 3 meses críticos tienen déficit |
| **Reproducción** | **20 %** | Preñez (50 %) + anestro (30 %) + CC toros (20 %) |
| **Vaquillona** | **15 %** | GDP vaq1 + si vaq2 llega al entore |
| **Sanidad** | **15 %** | Alertas rojas/ámbar + vacunas obligatorias |

Score total → etiqueta: ≥80 "bien manejado" · ≥65 "con oportunidades" · ≥50 "con
limitantes importantes" · <50 "situación crítica".

---

## 7. El diagnóstico integrado (`diagnosticarSistema` / `calcCerebro`)

Es la capa que **cruza todo** y arma el diagnóstico causal. Recorre cada categoría
buscando **cuellos de botella** (limitantes con causa raíz) y arma:

- **`cuellos`** — limitantes ordenados por prioridad (P1 urgente / P2 importante / P3).
- **`cronologia`** — los mismos cuellos ordenados por **el momento del ciclo** en que
  impactan: parición → pre-servicio → servicio → verano → tacto → invierno recría →
  invierno suplementación. Permite leer **dónde se rompe primero** la cadena.
- **`planes`** — acciones concretas por categoría, con alimento, dosis, momento y el
  fundamento técnico.
- **`proyeccion`** — la preñez esperada si se aplican los planes.

La lógica clave que aplica el cerebro: **con ternero al pie, la herramienta es el
destete, no el suplemento** (suplementar una vaca en lactación es caro e ineficiente).
El suplemento rinde en el **preparto** (sin ternero) y en la **recría**.

---

## 8. Módulos complementarios

- **`calcGEI`** — emisiones de gases de efecto invernadero (metano entérico) según
  IPCC Tier 2, para la huella de carbono del sistema.
- **`calcCalidadPrenez`** — distribución de la preñez en cabeza / cuerpo / cola, por
  ciclos de servicio de 21 días. Predice la concentración de la parición.
- **`calcAnestro`** — días de anestro posparto según CC y biotipo.
- **`calcCadena`** — deriva las fechas de parición y tacto a partir del servicio.

---

## 9. Fuentes de datos

| Dato | Origen |
|------|--------|
| Temperatura, lluvia, balance hídrico | **Open-Meteo** (satelital, tiempo real, por GPS) |
| NDVI | Proxy satelital comparado con histórico de zona |
| Clima histórico mensual | Tabla `CLIMA_HIST` por provincia |
| Biotipos (20) | Tabla `BIOTIPOS` — parámetros de movilización/recuperación CC |
| Suplementos | Tabla `SUPLEMENTOS` — EM y PB de cada alimento |
| Relación CC-preñez | Tabla `CC_PR` (bibliografía, ver Sector 05) |
| Requerimientos | Ecuaciones tipo NRC 2000 / NASSEM adaptadas |

---

[← Sector 01](01-uso-y-carga.md) · [Volver al índice](README.md) · [Sector 03 — Interpretación →](03-interpretacion-resultados.md)
