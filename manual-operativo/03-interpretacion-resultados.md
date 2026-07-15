# Sector 03 — Interpretación de resultados

[← Volver al índice](README.md)

Este sector explica **cómo leer lo que la app muestra**: el balance energético, la
trayectoria de CC, los scores, los cuellos de botella y la cronología. El objetivo es
que puedas **explicárselo al productor con seguridad**.

---

## 1. El balance energético mensual (gráfico de barras)

Es el gráfico central. Muestra, para cada mes del año, la **oferta** de energía del
pasto contra la **demanda** del rodeo.

### Cómo se lee

- **Barra verde / por encima de cero:** el pasto cubre la demanda. La vaca mantiene o
  gana CC.
- **Barra roja / por debajo de cero:** **déficit**. La demanda supera la oferta → la
  vaca **moviliza reservas** (pierde CC).
- El **tooltip** de cada mes muestra el **estado fisiológico real** de las vacas ese mes
  (lactación, gestación, preparto), porque la demanda depende de eso.

### Qué buscar

1. **El invierno (jun-jul-ago).** Es el momento más delicado. Un déficit acá golpea la
   CC justo antes del servicio.
2. **La profundidad del déficit** (cuántas Mcal por debajo de cero). Un déficit de −2
   Mcal/día no es lo mismo que uno de −15.
3. **Cuántos meses seguidos** hay déficit. Uno es manejable; tres es un problema
   estructural de carga u oferta.

### La regla de conversión útil

El déficit está en **Mcal/día**. Para traducirlo a **pérdida de CC**:

> Cada ~**55 Mcal de déficit acumulado ≈ 1 punto de CC perdido** por vaca (aproximado).

Y a **kg de materia seca faltante**: dividí las Mcal por **2,2** (Mcal/kg del pastizal
medio). Eso te dice cuánto pasto o suplemento falta por día.

---

## 2. La trayectoria de CC

Muestra la **película de la condición corporal** a lo largo del año, en 4 puntos:

| Punto | Qué significa | Valor deseable |
|-------|---------------|----------------|
| **CC al parto** | Con cuánta reserva llega la vaca a parir. | **≥ 5,5 (escala 1–9)** |
| **CC mínima en lactación** | El punto más bajo, con el ternero al pie. | No caer por debajo de 3,5–4,0 |
| **CC al servicio** | La que determina la preñez. | **4,5 = umbral crítico (mínimo) · < 3,5 = malo** |
| **Preñez estimada** | Traducción de la CC al servicio en % de preñez. | ≥ 75 % |

> 🔑 **La regla del punto perdido:** la vaca pierde **~1 punto de CC del parto al
> servicio** (lo moviliza en la lactación). Por eso el objetivo al parto es **5,5** —
> para aterrizar en **4,5 al servicio**, que es el mínimo crítico para una buena
> preñez. Si llega al parto con 4,5, al servicio cae a 3,5 (malo). Ese punto es la
> diferencia entre un rodeo que preña y uno que no.

### La cascada causal

La app también muestra **qué pasaría con distinto destete**. Si la CC al servicio da
baja, vas a ver algo como:

> *"Con destete tradicional CC 4,1 → con anticipado CC 4,6 (+8 pp preñez)"*

Eso es oro para la charla con el productor: **le muestra el número concreto de terneros
extra** que gana adelantando el destete.

### Anestro

Los **días de anestro** (período sin ciclar posparto) dependen de la CC y el biotipo.
Más de ~55 días es riesgo: la vaca puede no llegar a ciclar dentro del servicio.

---

## 3. Los scores (5 dimensiones)

Cada dimensión da un puntaje 0–100 con color semáforo:

- 🟢 **Verde (≥75):** dentro de parámetros.
- 🟡 **Ámbar (50–74):** oportunidad de mejora.
- 🔴 **Rojo (<50):** limitante seria.

| Dimensión | Qué te dice si está en rojo |
|-----------|------------------------------|
| **CC al servicio (30 %)** | La vaca llega mal al servicio — la preñez va a ser baja. |
| **Balance invernal (20 %)** | El campo no da el pasto que el rodeo necesita en invierno. |
| **Reproducción (20 %)** | Combinación de preñez baja, anestro largo o toros flacos. |
| **Vaquillona (15 %)** | La reposición no gana lo suficiente / no llega al entore. |
| **Sanidad (15 %)** | Faltan vacunas obligatorias o hay alertas activas. |

El **score total** ponderado es el "titular" del sistema. Pero **lo importante es qué
dimensión lo baja**: dos sistemas con score 60 pueden necesitar cosas opuestas.

---

## 4. Los cuellos de botella (limitantes)

Cada cuello de botella se muestra como una tarjeta con:

- **Prioridad** (P1 urgente / P2 importante / P3).
- **Categoría** (Vaca, Vaquillona, Toros, Agua, Sanidad, Stock…).
- **Título** — el problema.
- **📈 Impacto** — qué se gana si se resuelve (en pp de preñez, kg, terneros).
- **Causas** — las razones raíz identificadas (chips).

> Un cuello de botella no es solo "está mal X". Es **"X está mal PORQUE Y y Z, y
> arreglarlo vale N terneros"**. Esa es la diferencia entre un dato y un diagnóstico.

---

## 5. La cronología del ciclo

Este es el bloque que **ordena los problemas en el tiempo**. En lugar de una lista por
prioridad, muestra una **línea de tiempo del ciclo productivo**:

```
🕐 Parición (ago–oct)      → CC al parto baja, brucelosis
   Pre-servicio (oct–nov)  → toros sin revisar, CC toros
   Servicio (nov–dic)      → CC al servicio, relación toro:vaca, entore vaquillonas
   Verano (ene–mar)        → agua salina
   Tacto (mar–abr)         → aftosa
   Invierno recría (may-ago) → peso vaquillona 1er invierno
   Invierno suplementación → stock insuficiente
```

**Por qué importa:** el sistema de cría es una **cadena secuencial**. Si la vaca llega
flaca al parto (agosto), eso arrastra una CC baja al servicio (noviembre), que arrastra
baja preñez, que arrastra pocos terneros el año siguiente. La cronología te muestra
**dónde se rompe primero** para atacar la causa, no el síntoma.

---

## 6. El momento del ciclo (fase actual)

La app ubica al rodeo en **qué fase del ciclo está hoy** (parición, servicio, gestación,
tacto…) según las fechas cargadas. Esto contextualiza las recomendaciones: no es lo
mismo recomendar suplemento en preparto que en plena lactación.

---

## 7. El plan de acción

Cada plan es **accionable**: dice qué alimento, cuántos kg/día, con qué frecuencia,
en qué mes empezar, y **por qué** (el fundamento). Los planes se ordenan por prioridad.

Al final, la app proyecta la **preñez objetivo** si se aplican los planes — el número
con el que cerrás la consulta.

---

## 8. Cómo interpretar los documentos exportables

El detalle completo de qué contiene cada archivo está en el **[Sector 04](04-documentos-excel-y-pdf.md)**.
En resumen:

- **PDF** — el **informe para el productor**. Narrativo, visual, con el diagnóstico, el
  balance, la vaquillona, la suplementación, el plan y los escenarios. Es lo que le
  dejás en la mano al cerrar la visita.
- **Excel** — el **registro de datos y seguimiento**. Guarda todos los datos numéricos
  y el **historial de visitas** (una fila por consulta), ideal para ver la evolución
  del campo en el tiempo.

---

[← Sector 02](02-calculos-y-datos.md) · [Volver al índice](README.md) · [Sector 04 — Documentos Excel y PDF →](04-documentos-excel-y-pdf.md)
