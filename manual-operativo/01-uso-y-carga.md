# Sector 01 — Guía de uso y carga de datos

[← Volver al índice](README.md)

Este sector explica **cómo se navega la app y qué se carga en cada paso**. El
formulario está dividido en **6 pasos** que siguen el orden lógico de una consulta
a campo: primero dónde estás, después el rodeo, el pasto, el agua y la sanidad, y
finalmente el diagnóstico y el plan.

---

## 1. Acceso a la app

- La app se abre desde el navegador (celular, tablet o computadora) o instalada como
  **PWA** (ícono en la pantalla de inicio).
- El acceso es **con cuenta de Google**, y está **restringido por lista de correos
  autorizados**. Si tu correo no está habilitado vas a ver *"Acceso no autorizado"*
  — en ese caso, el administrador debe agregarte.
- Los datos se **guardan automáticamente en el dispositivo** mientras cargás. Podés
  cerrar y retomar sin perder la consulta.

---

## 2. Navegación general

En la parte superior hay una **barra con los 6 pasos**. Podés:

- Tocar cualquier paso para saltar a él.
- Usar las **flechas ← →** del teclado para avanzar/retroceder.
- Tocar las teclas **1 a 6** para ir directo a un paso.

No hace falta completar todo para ver resultados: **la app calcula en vivo** con lo
que haya cargado. Cuanto más completo el dato, más preciso el diagnóstico.

> 💡 **Regla de oro:** los tres datos que más mueven el diagnóstico son
> **(1) la distribución de CC del rodeo, (2) las fechas de servicio y (3) el número
> de vacas + hectáreas**. Si cargás solo eso, ya tenés un diagnóstico útil.

---

## Los 6 pasos

### PASO 1 · Datos de la zona

Define **dónde está el campo** — esto ancla todo el modelo climático y forrajero.

| Campo | Qué cargar | Para qué sirve |
|-------|-----------|----------------|
| **📍 GPS** | Tocá el botón para autodetectar. | Trae **latitud/longitud**, autocompleta provincia y localidad, y dispara la consulta satelital (temperatura, lluvias, NDVI). |
| **Zona** | NEA, NOA, Pampa Húmeda, Paraguay, Brasil (Cerrado), Bolivia (Llanos). | Selecciona el set climático regional. Filtra las provincias disponibles. |
| **Provincia / Región** | Se filtra según la zona elegida. | Determina el **clima histórico** (temperatura y lluvia mes a mes) que usa el balance. |
| **ENSO** | Neutro / El Niño / La Niña. | Ajusta la **oferta forrajera anual**: El Niño **+25 %**, La Niña **−25 %**. |
| **Productor / Establecimiento** | Nombre. | Identifica el informe (PDF/Excel). No afecta cálculo. |
| **Paraje / Campo** | Opcional. | Solo para el informe. |

Al detectar GPS, aparecen 4 tarjetas: **Temperatura, NDVI (estimado), Lluvia 30 días,
Balance hídrico**. Son datos satelitales en tiempo real (fuente: Open-Meteo + proxy
NDVI). El NDVI se compara contra un histórico de referencia de la zona.

---

### PASO 2 · Rodeo y CC

El corazón reproductivo del sistema.

**Rodeo general:**

| Campo | Qué cargar |
|-------|-----------|
| **Biotipo** | La raza/cruza predominante (ver lista de 20 biotipos en Sector 05). Define cuánto moviliza y recupera CC. |
| **Vacas (cab)** | Número de vientres en servicio. |
| **Toros (cab)** | Número de toros. Se usa para la relación toro:vaca. |
| **PV vaca adulta (kg)** | Peso vivo promedio del vientre adulto. Base de todos los requerimientos. |
| **Preñez histórica (%)** | Dato del último tacto, si lo hay. |
| **Destete histórico (%)** | Terneros señalados / vacas entoradas. |
| **Estado reproductivo** | Situación general del rodeo. |
| **Incluye 1er parto** | Si hay vaquillonas de primer servicio en el lote (más exigentes). |
| **Inicio / Fin de servicio** | **Fechas clave.** Definen la cadena reproductiva: parición, tacto, ventana destete→servicio. |
| **Edad primer entore** | Meses al primer servicio de las vaquillonas. |

**Condición corporal (CC):**

Se carga la **distribución del rodeo por CC**: qué **porcentaje** de las vacas está
en cada nivel de CC (escala 1–9). Por ejemplo: 20 % en CC 3, 50 % en CC 4, 30 % en
CC 5. La app calcula la **CC ponderada** y, más importante, **proyecta la trayectoria**
de esa CC a lo largo del año (ver Sector 02).

> ⚠️ Sin distribución de CC cargada, la app no puede proyectar preñez. Es el dato
> individual más importante.

**Destete:**

Se carga el **mix de modalidad de destete** (deben sumar 100 %):

- **Tradicional (180 días)** — ternero al pie ~6 meses.
- **Anticipado (90 días)** — ~3 meses.
- **Hiperprecoz (50 días)** — ~1,7 meses.

El destete es la **principal herramienta de manejo de CC**: cuanto antes se desteta,
menos moviliza la vaca y mejor llega al servicio.

---

### PASO 3 · Potreros

Permite cargar **cada potrero por separado** (número, hectáreas, recurso, estado).
Esto alimenta la oferta forrajera con **precisión espacial**.

Por cada potrero:

| Campo | Qué cargar |
|-------|-----------|
| **Hectáreas** | Superficie del potrero. |
| **Vegetación / Recurso** | Pastizal natural, megatérmicas implantadas, mixta, monte/bosque, etc. |
| **Fenología** | Estado del pasto: rebrote, crecimiento, maduración, encañado. |
| **Altura de pasto (cm)** | Si es pastizal — estima la disponibilidad de MS. |
| **Tipo de pasto** | Corto/denso, alto/laxo, etc. |
| **Categorías asignadas** | Qué categoría de animal usa ese potrero (ej: vaquillonas). |

Si **no cargás potreros**, la app usa los datos generales del campo (superficie,
vegetación y fenología cargadas en el paso de forraje). Si **sí los cargás**, calcula
la disponibilidad de MS como **promedio ponderado por hectárea** de todos los potreros
— mucho más real.

> 💡 La **asignación de categorías** al potrero afecta el cálculo de las vaquillonas:
> el GDP de verano se pondera por el tipo de recurso de los potreros que ellas pastorean.

---

### PASO 4 · Agua y sanidad

**Agua:**

| Campo | Qué cargar | Efecto |
|-------|-----------|--------|
| **TDS (mg/L)** | Sales totales disueltas del agua de bebida. | Agua salina **reduce el consumo (DMI)** → menos energía ingerida → menos pasto aprovechado. |
| **Tipo de sal** | Sulfatos, cloruros, etc. | Ajusta el umbral de tolerancia. |
| **Fuente** | Perforación, represa, río, etc. | Contexto. |

La calidad del agua es un **multiplicador oculto**: si el agua es mala, la disponibilidad
efectiva de pasto baja para **todas las categorías** (ver `factorAgua` en Sector 02).

**Sanidad:**

- **Aftosa**, **Brucelosis**, **IBR/DVB** — estado de vacunación.
- **Revisión de toros** pre-servicio.
- **Historia de abortos**, **programa sanitario**.
- **Parásitos** externos e internos.
- **CC de toros** — determina su capacidad de servicio.

Las obligatorias (Aftosa, Brucelosis) sin cumplir generan **alertas P1 (críticas)**.

---

### PASO 5 · Balance y CC (Diagnóstico)

Este paso **no se carga: se lee**. Muestra los resultados calculados:

- **Balance energético mensual** (gráfico de barras oferta vs demanda).
- **Trayectoria de CC** a lo largo del año.
- **Scores** por dimensión (CC, balance, reproducción, vaquillona, sanidad).
- **Momento del ciclo** en el que está el rodeo hoy.

En este paso también se cargan/ajustan los **suplementos por categoría** (vacas, toros,
V2S, vaquillona 1° y 2° invierno, ternero), con dosis en kg/día. La app recalcula el
balance con el suplemento incluido.

Ver Sector 03 para la interpretación completa.

---

### PASO 6 · Plan de acción (Recomendaciones)

El **diagnóstico final**:

- **Limitantes identificados** (cuellos de botella) con causa raíz.
- **Cronología del ciclo** — en qué momento del año se rompe primero el sistema.
- **Planes de acción** concretos por categoría, con dosis y fundamento.
- **Proyección de preñez** si se aplican las recomendaciones.

Desde acá (y desde el paso 5) se **exportan el PDF y el Excel** (ver Sector 04).

---

## 3. Flujo de trabajo recomendado en la consulta

1. **Llegás al campo** → Paso 1: GPS, provincia, ENSO.
2. **Con el productor** → Paso 2: vacas, toros, PV, fechas de servicio, y **recorren
   juntos la CC del rodeo** (lo más honesto posible).
3. **Recorriendo los potreros** → Paso 3: cargás cada uno.
4. **Aguadas y libreta sanitaria** → Paso 4.
5. **Mostrás el diagnóstico en pantalla** → Paso 5, con el productor mirando el balance.
6. **Cerrás con el plan** → Paso 6, y **le entregás el PDF** ahí mismo.

---

[← Volver al índice](README.md) · [Sector 02 — Motor de cálculo →](02-calculos-y-datos.md)
