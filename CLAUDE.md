# AgroMind Pro

App de consulta ganadera para asesores técnicos NEA/Chaco.
Next.js 14 · React · Vercel · Repo: https://github.com/joseemiliorosello-cmyk/agromind-pro

## Workflow

1. Editar los archivos en este repo (ver estructura abajo)
2. Verificar brace balance en motor.js: `python3 -c "s=open('lib/motor.js',encoding='utf-8').read(); print(s.count('{') - s.count('}'))"`
3. `git add . && git commit -m "descripción" && git push` → Vercel despliega automáticamente

## Estructura del proyecto (refactorizado mayo 2026)

| Archivo | Líneas | Contenido |
|---------|--------|-----------|
| `pages/index.js` | ~3.284 | Componente raíz, routing de tabs, orquestación UI |
| `lib/motor.js` | ~4.148 | Motor de cálculo: balanceMensual, calcTrayectoriaCC, calcVaq, calcCadena |
| `lib/cerebro.js` | ~1.931 | calcCerebro, calcFaseCiclo, diagnosticarSistema |
| `lib/gei.js` | calcGEI — emisiones IPCC Tier 2 |
| `lib/constantes.js` | BIOTIPOS, SUPLEMENTOS, INTERPCC, CLIMA_HIST |
| `lib/useMotor.js` | Hook React que corre el motor |
| `components/GraficosBalance.js` | ~959 | Gráfico de barras balance energético |
| `components/cerebro.js` | TabCerebro, PanelFaseCiclo |
| `components/pasos.js` | renderUbicacion … renderAnalisis |
| `components/tabs.js` | Navegación de tabs |
| `components/ui.js` | Componentes UI base |

## Reglas técnicas críticas

- **Template literals anidados PROHIBIDOS** — backtick dentro de `${}` rompe el build SWC. Usar concatenación.
- **SelectF formato options:** `[[val, label], ...]` — nunca `{value, label}`
- **`renderSanidad` definida ANTES del array `RENDERS`** en `pages/index.js`
- **Balance de llaves = 0** antes de cada commit
- **`calcCerebro(motor, form, sat)`** — `sat` obligatorio como tercer argumento
- **`calcFaseCiclo(cadena, form, ctx)`** — `ctx` con variables del rodeo como tercer argumento

## Contexto de dominio

- Escala CC: 1–9 INTA · Biotipos: 8 razas tropicales NEA
- Parición: ago–oct · Servicio: nov–dic · Tacto: mar–abr
- Usuario: veterinario asesor, usa la app en consulta con el productor

## Trabajo pendiente

Sin pendientes abiertos al cierre de esta sesión (junio 2026). Última tanda completada:

- ✅ Fix gestación temprana: edad gestacional desde concepción, no desde parto (`lib/motor.js`)
- ✅ Fix demanda por grupos: `reqVacaI` pondera mes a mes por `fracLact` y grupo de destete (`lib/motor.js`)
- ✅ Gráfico de barras: tooltip muestra `estadoVaca` (estado fisiológico real) por mes (`components/GraficosBalance.js`)
- ✅ Capa 2: alertas P1/P2 contextuales en pasos Rodeo y Sanidad (`components/pasos.js`)
- ✅ Capa 3: `calcCalidadPrenez` — % cabeza/cuerpo/cola por ciclos de servicio de 21d (`lib/motor.js`, panel en `components/GraficosBalance.js`)
- ✅ Fix `calcMovilizacionCC`: umbral `CC_MINIMA_MOVILIZACION` invertido anulaba la movilización en escenarios normales (`lib/motor.js`)
- ✅ Fix `balancePorCategoria`: slot "complemento" (`supl2_*`) de suplementos no se sumaba al Mcal — solo se leía el principal (`lib/motor.js`)
- ✅ Fix verdeo "rodeo general": divisor per-animal de `vacas_v2s` usaba solo `v2sN` en vez de `C.n` (`lib/motor.js`)
- ✅ Panel suplementación: agrega oferta de pasto NDVI/GPS + consumo posible total (`components/pasos.js`)
- ✅ Gráfico trayectoria PV vaquillona: agrega GDP (g/d) por tramo (`components/GraficosBalance.js`)
- ✅ Fix `dZona`: el fallback `lat>-32 → "NEA"` clasificaba mal Pampa Húmeda/NOA — ahora la zona se deriva de `PROV_A_ZONA[provincia]` (misma provincia que ya calcula `nearestProv`) (`pages/index.js`)
