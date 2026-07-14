# Sector 04 — Documentos de resultados: Excel y PDF

[← Volver al índice](README.md)

La app genera **dos documentos exportables**, cada uno con un propósito distinto. Se
descargan desde el botón **EXPORTAR INFORME** (paso 5 o 6).

| Documento | Nombre del archivo | Para quién / para qué |
|-----------|-------------------|------------------------|
| **📄 PDF** | `agromind_{productor}_{fecha}.pdf` | **Para el productor.** Informe visual y narrativo de la consulta. |
| **📊 Excel** | `calfai_historial_{fecha}.xlsx` | **Para el asesor.** Registro de datos e historial de visitas. |

---

## PARTE A — El informe PDF

Es el **entregable de la consulta**: lo que le dejás al productor. Está diseñado para
leerse de arriba a abajo como una historia del sistema. Contiene estas secciones:

### 1. Datos del establecimiento
Identificación (productor, localidad, provincia, zona, coordenadas) y el resumen del
rodeo: biotipo, número de animales, PV, fechas de servicio. Incluye las **métricas
titulares**: **CC al servicio** y **preñez estimada**, con semáforo de color.

### 2. Campo hoy — clima y NDVI estimado
La foto satelital del momento: temperatura, lluvia acumulada, balance hídrico y NDVI
(verdor) comparado con el histórico de la zona. Ubica la consulta en su contexto
climático real.

### 3. Diagnóstico del sistema
El **momento del ciclo** en que está el rodeo y el resumen del diagnóstico: los puntos
fuertes y las limitantes principales. Incluye el diagnóstico de sustentabilidad.

### 4. Balance forrajero anual
La tabla del **balance energético mes a mes** (oferta vs demanda), con foco en el
**balance invernal** (los 3 meses críticos). Muestra dónde el pasto no alcanza.

### 5. Vaquillona — balance y progresión
El seguimiento de la **recría**: PV de entrada y salida del 1er invierno, GDP con y sin
suplemento, progresión hasta el entore, y si **llega o no al peso objetivo** (75 % del
PV adulto). Para vaq1 y vaq2.

### 6. Suplementación actual por categoría
Qué se está suplementando hoy, por categoría (vacas, toros, V2S, vaquillonas, ternero),
con dosis. Es la **línea de base** sobre la que se proponen los cambios.

### 7. Propuestas de mejora — plan de acción
El **plan priorizado**: las tarjetas P1/P2/P3 con el problema, el impacto, la solución
concreta y **cuándo actuar**. Es el corazón accionable del informe.

### 8. Escenarios y resultados esperados
La **proyección**: qué preñez y qué terneros adicionales se esperan si se aplican las
recomendaciones. El "antes y después".

### 9. Sanidad
Estado del plan sanitario: Aftosa, Brucelosis, IBR/DVB, revisión de toros — con las
alertas de lo que falta.

### 10. Calidad del agua
Estado del agua de bebida (TDS, tipo de sal) y su **reducción estimada del consumo (DMI)**,
que impacta en toda la oferta forrajera.

> 💡 **Cómo usarlo:** abrí el PDF en pantalla con el productor en el paso 6, recorré el
> plan de acción juntos, y enviáselo (WhatsApp/mail) ahí mismo. Es su hoja de ruta hasta
> la próxima visita.

---

## PARTE B — El registro Excel

El Excel está pensado como **base de datos de seguimiento y detalle del asesor**. El
archivo contiene **6 hojas**:

| Hoja | Contenido |
|------|-----------|
| **Establecimiento** | Detalle completo de la consulta actual: identificación, rodeo, CC, destete, forraje y campo, clima satelital, suplementación por categoría, agua y sanidad, vaquillonas, V2S y terneros. |
| **Balance mensual** | El balance energético mes a mes: oferta, demanda, balance, déficit, % cobertura, carga ajustada, terneros, y la versión en kg de MS/día. |
| **Diagnostico** | Scores por dimensión, análisis de riesgo, puntos críticos y balance invernal. |
| **Reproduccion** | Servicio (fechas, duración, diagnóstico), preñez, anestro, y el comparativo de CC y preñez según modalidad de destete. |
| **Recomendaciones** | El plan priorizado P1/P2: área, acción, qué hacer y cuándo. |
| **Historial** | Una fila por visita — para el seguimiento en el tiempo (ver abajo). |

Las 5 primeras hojas son el **detalle numérico de la consulta de hoy**; la hoja
**Historial** es el **registro acumulado** de todas las visitas.

### La hoja Historial

Es una **tabla ancha**: **una fila por visita/consulta**, con **una columna por variable**.
La fila superior queda fija (freeze) para poder desplazarse. Incluye la consulta actual
más todas las visitas previas guardadas en el dispositivo.

**Columnas principales (por visita):**

- **Identificación:** fecha, productor, localidad, provincia.
- **Rodeo:** vacas, toros, V2S, vaq2, PV vaca adulta, biotipo, % reposición.
- **Servicio:** inicio, fin, duración (días).
- **Condición corporal:** CC ponderada, CC parto, CC mínima lactación, CC al servicio.
- **Reproducción:** preñez estimada, anestro, meses de lactación.
- **Destete:** % tradicional, % anticipado, % hiperprecoz.
- **Campo:** superficie ganadera, carga (EV/ha), verdeo (si/ha).
- **Suplementación:** V2S, Vaq2, Vaq1 (alimento + dosis), meses de suplementación.
- **Balance y clima:** meses de déficit invernal, nivel de riesgo, ENSO, lluvia 30d,
  NDVI, condición forrajera.
- **Scores:** total, CC, balance, reproducción.
- **Potreros:** por cada potrero (P1, P2, …): hectáreas, vegetación, fenología, altura
  de pasto, tipo de pasto, disponibilidad de MS.

### Para qué sirve

- **Ver la evolución de un campo** entre visitas (¿mejoró la CC?, ¿bajó el déficit?).
- **Comparar establecimientos** de la cartera.
- **Análisis propio:** al ser tabla plana, se filtra y grafica fácil en Excel/Sheets.

> 💡 **Tip:** para el **análisis puntual de una consulta**, usá las 5 primeras hojas.
> Para ver la **evolución del campo** entre visitas, usá la hoja **Historial**.

---

## Resumen: cuál usar cuándo

| Necesito… | Documento |
|-----------|-----------|
| Dejarle algo al productor | **PDF** |
| Ver el plan de acción y los escenarios | **PDF** |
| Registrar la visita para seguimiento | **Excel** |
| Comparar la evolución del campo en el tiempo | **Excel** |
| Analizar datos numéricos / hacer mis propios gráficos | **Excel** |

---

[← Sector 03](03-interpretacion-resultados.md) · [Volver al índice](README.md) · [Sector 05 — Glosario y fundamento →](05-glosario-y-fundamento.md)
