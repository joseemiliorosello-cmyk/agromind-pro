# Manual Operativo — AgroMind Pro (CALFAI)

**Aplicación de consulta ganadera para asesores técnicos de cría bovina — NEA / Chaco**

Versión del manual: 1.0 · Julio 2026
App: Next.js 14 · React · Vercel

---

## ¿Qué es esta app?

AgroMind Pro (marca comercial **CALFAI** en los informes) es una herramienta de
diagnóstico para el **asesor veterinario** que trabaja en sistemas de **cría bovina
extensiva** del NEA argentino, Chaco y regiones tropicales limítrofes.

Se usa **en la consulta, junto al productor**: se cargan los datos del establecimiento
(rodeo, condición corporal, potreros, servicio, sanidad) y la app construye un
**diagnóstico integral del sistema** identificando los puntos críticos —los "cuellos
de botella"— que limitan la preñez y la producción de terneros, y propone un
**plan de acción priorizado y cronológico**.

El motor no es una calculadora aislada: **cruza todas las variables entre sí**. La
condición corporal se conecta con la época de servicio, el tipo de destete, la oferta
de pasto de cada potrero, la calidad del agua, el NDVI satelital y el clima. Ese
cruzamiento es lo que permite detectar **dónde se rompe primero la cadena**.

---

## Índice del manual

| # | Sector | Contenido |
|---|--------|-----------|
| **[01](01-uso-y-carga.md)** | **Guía de uso y carga de datos** | Cómo se navega la app, los 6 pasos del formulario, campo por campo qué cargar y cómo |
| **[02](02-calculos-y-datos.md)** | **Motor de cálculo y datos utilizados** | Cómo hace los cálculos, qué fórmulas y qué datos usa cada módulo, de dónde salen los números |
| **[03](03-interpretacion-resultados.md)** | **Interpretación de resultados** | Cómo leer el balance energético, la trayectoria de CC, los scores, los cuellos de botella y la cronología |
| **[04](04-documentos-excel-y-pdf.md)** | **Documentos de resultados: Excel y PDF** | Qué contiene cada documento exportable, sección por sección, y cómo usarlo con el productor |
| **[05](05-glosario-y-fundamento.md)** | **Glosario técnico y fundamento científico** | Definiciones, unidades, y la bibliografía en la que se apoya cada cálculo |
| **[06](06-preguntas-frecuentes.md)** | **Preguntas frecuentes y resolución de problemas** | Dudas comunes, errores típicos de carga, y cómo interpretarlos |

---

## Cómo leer este manual

- Si es tu **primera vez**: leé el **Sector 01** completo y hacé una carga de prueba.
- Si querés **entender los números** que salen: **Sector 02** y **03**.
- Si vas a **entregar el informe al productor**: **Sector 04**.
- Si un colega te pregunta **"¿de dónde sacaron esto?"**: **Sector 05**.

---

## Convenciones

- **CC** = Condición Corporal, escala **1 a 9 (INTA)**.
- **PV** = Peso Vivo (kg).
- **Mcal** = Megacalorías de Energía Metabolizable (EM).
- **GDP** = Ganancia Diaria de Peso (g/día).
- **EV** = Equivalente Vaca (unidad de carga animal).
- **MS** = Materia Seca (del forraje).
- **NDVI** = Índice de vegetación satelital (verdor del campo).
- **NEA** = Noreste Argentino.

> ⚠️ **Importante:** la app es una **herramienta de apoyo a la decisión del profesional**.
> Todos los resultados son estimaciones basadas en modelos y en los datos cargados.
> El criterio final es siempre del veterinario asesor.
