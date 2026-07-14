# Sector 05 — Glosario técnico y fundamento científico

[← Volver al índice](README.md)

---

## Parte A — Glosario de términos y unidades

| Término | Definición |
|---------|-----------|
| **CC** | **Condición Corporal.** Estimación visual/táctil de la reserva de grasa. Escala **1 a 9 (INTA subtropical)**: 1 = emaciada, 9 = obesa. En cría, el objetivo al servicio es **≥ 5**. |
| **PV** | **Peso Vivo** del animal, en kg. |
| **EM** | **Energía Metabolizable** del alimento, en **Mcal** (megacalorías). Es la energía que el animal realmente aprovecha. |
| **Mcal** | Megacaloría. Unidad de energía. Base del balance forrajero. |
| **MS** | **Materia Seca.** El forraje descontando el agua. La disponibilidad se mide en **kg MS/ha**. Valor energético medio del pastizal NEA: ~**2,2 Mcal/kg MS**. |
| **GDP** | **Ganancia Diaria de Peso**, en **g/día**. Mide el crecimiento (clave en recría de vaquillonas). |
| **EV** | **Equivalente Vaca.** Unidad para medir la carga animal. Una vaca de cría = 1,0 EV; un toro = 1,4; una vaquillona = 0,4–0,7. La **carga** se mide en **EV/ha**. |
| **NDVI** | Índice satelital de verdor de la vegetación (0 a 1). Proxy de la biomasa verde activa. |
| **DMI** | **Dry Matter Intake** — consumo de materia seca. El agua salina lo reduce. |
| **PB** | **Proteína Bruta** del pasto o suplemento (%). Por debajo de ~7 % el rumen se limita. |
| **Fenología** | Estado de madurez del pasto: rebrote → crecimiento → maduración → encañado. A más maduro, menor calidad. |
| **Anestro** | Período posparto en que la vaca no cicla (no ovula). CC baja lo prolonga. |
| **V2S** | Vaca de **segundo servicio** (o "vaca de invernada de segundo"). Categoría propia. |
| **Vaq1 / Vaq2** | Vaquillona en su **1er** y **2do invierno** de recría, respectivamente. |
| **Entore** | Primer servicio de la vaquillona. Objetivo de peso: **65–75 % del PV adulto**. |
| **Cadena reproductiva** | La secuencia de fechas: servicio → parición → tacto → destete. |
| **Cabeza / cuerpo / cola** | Distribución de la parición en el tiempo. "Cabeza" = las que paren primero (mejor); "cola" = las tardías. |
| **ENSO** | El Niño / La Niña / Neutro. Fenómeno climático que altera la lluvia y la oferta forrajera. |
| **C4 (megatérmicas)** | Pastos tropicales que crecen en verano y **entran en dormancia en invierno**. Base forrajera del NEA. |
| **factorAgua** | Multiplicador (0–1) que reduce la oferta efectiva según la calidad del agua. |
| **factorCarga** | Multiplicador (0–1) que reduce la oferta según la sobrecarga animal. |
| **factorForrajero** | Multiplicador (0,45–1,25) que pondera la recuperación de CC combinando cantidad de pasto, calidad y NDVI. |

---

## Parte B — Cuellos de botella: la lógica de prioridades

| Prioridad | Significado | Ejemplos |
|-----------|-------------|----------|
| **P1** 🔴 | **Urgente / crítico.** Compromete la preñez o es obligación legal. | CC al servicio <4,0 · déficit invernal los 3 meses · sin Aftosa/Brucelosis · toros sin revisar |
| **P2** 🟡 | **Importante.** Mejora significativa disponible. | Carga moderada · un mes de déficit · vaquillona ajustada · stock corto |
| **P3** 🔵 | **Observación / optimización.** | Ajustes finos de manejo |

---

## Parte C — Fundamento científico

Los cálculos de la app se apoyan en bibliografía técnica revisada. Las principales
referencias por módulo:

### Condición corporal y reproducción
- **Selk, G.E. et al.** *Relationships among weight change, body condition and
  reproductive performance of range beef cows.* Journal of Animal Science.
  → Base de la tabla **CC–preñez** (`CC_PR`).
- **Short, R.E. et al.** *Physiological mechanisms controlling anestrus and infertility
  in postpartum beef cattle.* Journal of Animal Science.
  → Base del cálculo de **anestro** y del efecto de la CC.
- **Wiltbank, J.N. et al.** *Effect of energy level on reproductive phenomena of mature
  Hereford cows.* Journal of Animal Science.
- **Kunkle, W.E. et al.** *Effect of body condition on productivity in beef cattle.*
- **Neel, J.B. et al.** *Body condition scoring systems and their application to beef cows.*

### Escala de CC subtropical (1–9)
- **Stahringer, R.C.** *Escala de condición corporal 1–9 para ganado de cría en sistemas
  subtropicales.* INTA EEA Colonia Benítez.

### Nutrición y requerimientos
- **NRC (National Research Council).** *Nutrient Requirements of Beef Cattle*, 7ª ed.
  → Base de los **requerimientos energéticos** y del costo de ganancia.
- **Peruchena, C.O.** *Nutrición de vacunos para carne en condiciones tropicales y
  subtropicales.* INTA EEA Mercedes.
  → Base de las **tasas de caída y recuperación de CC**.
- **Wagner, J.J. et al.** *Carcass composition in mature Hereford cows… metabolizable
  energy requirement during winter.* Journal of Animal Science.
- **Detmann, E. et al.** *Predição do consumo voluntário por bovinos em pastejo.*
  Revista Brasileira de Zootecnia. → Consumo y respuesta al suplemento proteico.
- **Moore, J.E. et al.** *Effects of supplementation on voluntary forage intake…*

### Manejo en épocas críticas y suplementación NEA
- **Rosello Brajovich, J.; Pamies, M.E.; Pellerano, L.; Rossner, M.V.** *Manejo del
  ganado en épocas críticas.* Serie Estudios Agropecuarios INTA.
- **Balbuena, O.** *Suplementación estratégica en sistemas de cría del NEA.* INTA.

### Sanidad reproductiva
- **Giraudo, C.G. et al.** *Plan sanitario reproductivo en rodeos de cría.* INTA Rafaela.
- **Moreno, D. et al.** *Enfermedades venéreas en rodeos de cría del NEA.* INTA Mercedes.
- **Moriena, R.A. et al.** *Leptospirosis bovina en el NEA.* INTA Corrientes.
- **Suárez, V.H. et al.** *Neospora caninum en rodeos bovinos.* INTA.

### Calidad de agua
- **Patterson, H.H. et al.** *Performance of beef cattle consuming water with high sulfate
  concentrations.* Journal of Animal Science. → Base del **factorAgua** (reducción de DMI).

### Emisiones (huella de carbono)
- **Gere, J.I. et al.** *Enteric methane emissions from zebu cattle grazing subtropical
  pastures* y *Methane emission factors for Argentinean beef cattle systems.*
  → Base de `calcGEI` (metano entérico, IPCC Tier 2).

> El detalle completo de qué tabla del motor cubre cada cita está en `lib/citas.js` y en
> el documento `AUDITORIA_CITAS.md` del repositorio.

---

## Parte D — Los 20 biotipos y sus parámetros

Cada biotipo tiene 4 parámetros que modulan el cálculo:

- **movCC** — cuánto **moviliza** CC en lactación (Bos indicus < Bos taurus).
- **recCC** — cuánto **recupera** CC post-destete.
- **umbralAnestro** — CC por debajo de la cual entra en anestro.
- **factReq** — factor de requerimiento energético (adaptación al calor).

**Grupos:** Cebú puro (Brahman, Nelore, Indobrasil) · Angus y cruces (Angus, Brangus
3/8 y 5/8) · Hereford y cruces (Hereford, Bradford/Braford 3/8 y 5/8) · Europeas
(Limousin, Charolais, Simmental) · Adaptadas tropicales (Bonsmara, Simbrah, Senepol,
Beefmaster) · Cruza comercial.

> Los cruzas **3/8 y 5/8 Cebú** logran la **heterosis** (vigor híbrido): combinan la
> adaptación al calor del Cebú con la fertilidad y precocidad de las razas británicas.
> Por eso son la base de la cría del NEA.

---

[← Sector 04](04-documentos-excel-y-pdf.md) · [Volver al índice](README.md) · [Sector 06 — Preguntas frecuentes →](06-preguntas-frecuentes.md)
