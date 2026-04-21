// ─────────────────────────────────────────────────────────────────
// lib/citas.js — Biblioteca bibliográfica estructurada
// Base de referencia para el motor y el cerebro de AgroMind Pro
//
// Niveles de evidencia:
//   N1 · 🔬 Revista científica internacional con referato (JAS, AFST, etc.)
//   N2 · 📘 Guía técnica internacional (NRC, IPCC, NASEM, FAO)
//   N3 · 📗 Publicación institucional con ISSN (INTA, universidades)
//   N4 · 📙 Libro de texto / divulgación técnica
//
// Cada cita declara qué sección del motor respalda (tablasCubiertas)
// para que el motor y el cerebro puedan trazarla de vuelta.
// ─────────────────────────────────────────────────────────────────

export const NIVELES_EVIDENCIA = {
  N1: { icono: "🔬", nombre: "Revista científica con referato" },
  N2: { icono: "📘", nombre: "Guía técnica internacional" },
  N3: { icono: "📗", nombre: "Publicación institucional con ISSN" },
  N4: { icono: "📙", nombre: "Libro / divulgación técnica" },
};

export const CITAS = {

  // ═══════════════════════════════════════════════════════════════
  // N3 · Publicaciones institucionales INTA (ISSN)
  // ═══════════════════════════════════════════════════════════════

  "rosello2025": {
    id: "rosello2025",
    nivel: "N3",
    autores: "Rosello Brajovich, J.; Pamies, M.E.; Pellerano, L.; Rossner, M.V.",
    anio: 2025,
    titulo: "Manejo del ganado en épocas críticas",
    revista: "Serie Estudios Agropecuarios INTA",
    volumen: "Nº 5 Año 2",
    paginas: "1-20",
    issn: "3008-8631",
    institucion: "INTA EEA Colonia Benítez",
    url: "https://repositorio.inta.gob.ar",
    citaCorta: "Rosello et al. 2025",
    resumen: "Manejo práctico del rodeo de cría en épocas críticas NEA: evaluación oferta forrajera, raciones de emergencia por categoría, plan sanitario con costos.",
    tablasCubiertas: ["TABLA_DISP_MS", "TABLA_SUPERV", "reqEM", "evaluarSanidad", "raciones_emergencia"]
  },

  "peruchena2003": {
    id: "peruchena2003",
    nivel: "N3",
    autores: "Peruchena, C.O.",
    anio: 2003,
    titulo: "Nutrición de vacunos para carne en condiciones tropicales y subtropicales",
    revista: "Publicación técnica INTA EEA Mercedes",
    paginas: null,
    issn: null,
    institucion: "INTA EEA Mercedes",
    citaCorta: "Peruchena 2003",
    resumen: "Trayectoria CC y requerimientos en biotipos subtropicales NEA. Base de las tasas de caída y recuperación de CC.",
    tablasCubiertas: ["calcTrayectoriaCC", "CC_PR", "tasaCaidaBase", "tasaRecup"]
  },

  "stahringer2003": {
    id: "stahringer2003",
    nivel: "N3",
    autores: "Stahringer, R.C.",
    anio: 2003,
    titulo: "Escala de condición corporal 1-9 para ganado de cría en sistemas subtropicales",
    revista: "Publicación técnica INTA EEA Colonia Benítez",
    institucion: "INTA EEA Colonia Benítez",
    citaCorta: "Stahringer 2003",
    resumen: "Adaptación de la escala Wagner-Selk 1-9 a biotipos Bos indicus y cruzas del NEA argentino.",
    tablasCubiertas: ["escala_CC_1_9", "distribucionCC"]
  },

  "balbuena2003": {
    id: "balbuena2003",
    nivel: "N3",
    autores: "Balbuena, O.",
    anio: 2003,
    titulo: "Suplementación estratégica en sistemas de cría del NEA",
    revista: "Publicación técnica INTA",
    institucion: "INTA EEA Colonia Benítez",
    citaCorta: "Balbuena 2003",
    resumen: "Límites prácticos de semilla de algodón (0.3-0.4% PV) y estrategias de suplementación invernal en NEA.",
    tablasCubiertas: ["limite_semilla_algodon", "suplementacion_invernal"]
  },

  "giraudo2003": {
    id: "giraudo2003",
    nivel: "N3",
    autores: "Giraudo, C.G. et al.",
    anio: 2003,
    titulo: "Plan sanitario reproductivo en rodeos de cría",
    revista: "Publicación técnica INTA Rafaela",
    institucion: "INTA EEA Rafaela",
    citaCorta: "Giraudo 2003",
    resumen: "Calendario de vacunación IBR/DVB pre-servicio, reducción de pérdidas reproductivas.",
    tablasCubiertas: ["evaluarSanidad", "vacunacion_reproductiva"]
  },

  "moreno2006": {
    id: "moreno2006",
    nivel: "N3",
    autores: "Moreno, D. et al.",
    anio: 2006,
    titulo: "Enfermedades venéreas en rodeos de cría del NEA",
    revista: "Publicación técnica INTA Mercedes",
    institucion: "INTA EEA Mercedes",
    citaCorta: "Moreno et al. 2006",
    resumen: "Control pre-servicio de Trichomoniasis y Campylobacteriosis. Impacto en preñez.",
    tablasCubiertas: ["evaluarSanidad", "control_toros"]
  },

  "moriena2008": {
    id: "moriena2008",
    nivel: "N3",
    autores: "Moriena, R.A. et al.",
    anio: 2008,
    titulo: "Leptospirosis bovina en el NEA",
    revista: "Publicación técnica INTA Corrientes",
    institucion: "INTA EEA Corrientes",
    citaCorta: "Moriena et al. 2008",
    resumen: "Prevalencia y control de leptospirosis en rodeos NEA.",
    tablasCubiertas: ["evaluarSanidad", "leptospirosis"]
  },

  "suarez2012": {
    id: "suarez2012",
    nivel: "N3",
    autores: "Suárez, V.H. et al.",
    anio: 2012,
    titulo: "Neospora caninum en rodeos bovinos",
    revista: "Publicación técnica INTA",
    institucion: "INTA",
    citaCorta: "Suárez et al. 2012",
    resumen: "Neospora como causa de abortos en rodeos de cría argentinos.",
    tablasCubiertas: ["evaluarSanidad", "abortos"]
  },

  // ═══════════════════════════════════════════════════════════════
  // N1 · Revistas científicas con referato
  // ═══════════════════════════════════════════════════════════════

  "short1990": {
    id: "short1990",
    nivel: "N1",
    autores: "Short, R.E.; Bellows, R.A.; Staigmiller, R.B.; Berardinelli, J.G.; Custer, E.E.",
    anio: 1990,
    titulo: "Physiological mechanisms controlling anestrus and infertility in postpartum beef cattle",
    revista: "Journal of Animal Science",
    volumen: "68",
    paginas: "799-816",
    doi: "10.2527/1990.683799x",
    citaCorta: "Short et al. 1990",
    resumen: "Base mecánica del anestro posparto según CC al parto y CC mínima en lactación. Respuesta exponencial con déficit severo.",
    tablasCubiertas: ["calcAnestro", "bloqueo_LH"]
  },

  "selk1988": {
    id: "selk1988",
    nivel: "N1",
    autores: "Selk, G.E.; Wettemann, R.P.; Lusby, K.S.; Oltjen, J.W.; Mobley, S.L.; Rasby, R.J.; Garmendia, J.C.",
    anio: 1988,
    titulo: "Relationships among weight change, body condition and reproductive performance of range beef cows",
    revista: "Journal of Animal Science",
    volumen: "66",
    paginas: "3153-3159",
    doi: "10.2527/jas1988.66123153x",
    citaCorta: "Selk et al. 1988",
    resumen: "Relación CC al servicio vs % de preñez. Base de la tabla CC_PR.",
    tablasCubiertas: ["CC_PR", "prenez_por_CC"]
  },

  "wagner1988": {
    id: "wagner1988",
    nivel: "N1",
    autores: "Wagner, J.J.; Lusby, K.S.; Oltjen, J.W.; Rakestraw, J.; Wettemann, R.P.; Walters, L.E.",
    anio: 1988,
    titulo: "Carcass composition in mature Hereford cows: estimation and effect on daily metabolizable energy requirement during winter",
    revista: "Journal of Animal Science",
    volumen: "66",
    paginas: "603-612",
    doi: "10.2527/jas1988.663603x",
    citaCorta: "Wagner et al. 1988",
    resumen: "Define la escala CC 1-9 de uso estándar en ganado de cría.",
    tablasCubiertas: ["escala_CC_1_9"]
  },

  "neel2007": {
    id: "neel2007",
    nivel: "N1",
    autores: "Neel, J.B.; Freund, D.G.; Edwards, R.B.; Kornegay, J.N.; Fox, D.G.",
    anio: 2007,
    titulo: "Body condition scoring systems and their application to beef cows",
    revista: "Veterinary Clinics of North America: Food Animal Practice",
    volumen: "23",
    paginas: "343-352",
    citaCorta: "Neel et al. 2007",
    resumen: "Revisión de sistemas de evaluación CC y su correlación con performance reproductiva.",
    tablasCubiertas: ["calcAnestro", "escala_CC"]
  },

  "detmann2010": {
    id: "detmann2010",
    nivel: "N1",
    autores: "Detmann, E.; Valadares Filho, S.C.; Paulino, M.F.",
    anio: 2010,
    titulo: "Predição do consumo voluntário por bovinos em pastejo",
    revista: "Revista Brasileira de Zootecnia",
    volumen: "39 (supl. esp.)",
    paginas: "195-212",
    citaCorta: "Detmann et al. 2010",
    resumen: "Boost de consumo voluntario con suplementación proteica cuando PB del pasto <7%. Base técnica de la suplementación estratégica en C4.",
    tablasCubiertas: ["calcVaq1", "suplementacion_proteica", "umbral_PB_7"]
  },

  "gere2019": {
    id: "gere2019",
    nivel: "N1",
    autores: "Gere, J.I.; Feldkamp, C.R.; Ramos, F.; Posse, G.; Bualó, R.A.",
    anio: 2019,
    titulo: "Enteric methane emissions from zebu cattle grazing subtropical pastures",
    revista: "New Zealand Journal of Agricultural Research",
    volumen: "62(3)",
    paginas: "346-357",
    doi: "10.1080/00288233.2018.1474775",
    citaCorta: "Gere et al. 2019",
    resumen: "Factor Ym calibrado para ganado Bos indicus en pastos C4 NEA-Chaco. Correlación inversa digestibilidad-Ym (r = -0.69).",
    tablasCubiertas: ["calcYm", "CH4_C4"]
  },

  "gere2024": {
    id: "gere2024",
    nivel: "N1",
    autores: "Gere, J.I. et al.",
    anio: 2024,
    titulo: "Methane emission factors for Argentinean beef cattle systems",
    revista: "Animal Feed Science and Technology",
    volumen: "310",
    paginas: "115929",
    citaCorta: "Gere et al. 2024",
    resumen: "Actualización de factores Ym para sistemas de cría argentinos con calibración local.",
    tablasCubiertas: ["calcYm", "CH4_kgMS"]
  },

  "patterson2003": {
    id: "patterson2003",
    nivel: "N1",
    autores: "Patterson, H.H.; Whittier, J.C.; Rittenhouse, L.R.; Schutz, D.N.",
    anio: 2003,
    titulo: "Performance of beef cattle consuming water with high sulfate concentrations",
    revista: "Journal of Animal Science",
    volumen: "81",
    paginas: "2941-2948",
    citaCorta: "Patterson et al. 2003",
    resumen: "Efecto de sulfatos en agua sobre consumo de materia seca y riesgo de polioencefalomalacia.",
    tablasCubiertas: ["AGUA_CATEGORIAS", "calcImpactoAgua"]
  },

  // ═══════════════════════════════════════════════════════════════
  // N2 · Guías técnicas internacionales
  // ═══════════════════════════════════════════════════════════════

  "nrc2000": {
    id: "nrc2000",
    nivel: "N2",
    autores: "National Research Council (NRC)",
    anio: 2000,
    titulo: "Nutrient Requirements of Beef Cattle",
    revista: "7th revised edition",
    editorial: "National Academy Press, Washington DC",
    citaCorta: "NRC 2000",
    resumen: "Referencia internacional de requerimientos energéticos y proteicos para bovinos de carne. Base de los cálculos de EM y costos de ganancia.",
    tablasCubiertas: ["reqEM", "COSTO_KG_VAQ", "calcVaq1", "calcVaq2", "consumo_agua"]
  },

  "ipcc2019": {
    id: "ipcc2019",
    nivel: "N2",
    autores: "Intergovernmental Panel on Climate Change (IPCC)",
    anio: 2019,
    titulo: "2019 Refinement to the 2006 IPCC Guidelines for National Greenhouse Gas Inventories, Vol. 4, Ch. 10: Emissions from Livestock and Manure Management",
    revista: "IPCC",
    ecuacion: "Ec. 10.21",
    citaCorta: "IPCC 2019",
    resumen: "Metodología Tier 2 para estimación de emisiones de CH4 entérico. Factor Ym por rango de digestibilidad.",
    tablasCubiertas: ["calcYm", "calcCH4_kgMS", "GEI"]
  },

  // ═══════════════════════════════════════════════════════════════
  // N4 · Libros / divulgación técnica
  // ═══════════════════════════════════════════════════════════════

  "bavera2005": {
    id: "bavera2005",
    nivel: "N4",
    autores: "Bavera, G.A.",
    anio: 2005,
    titulo: "Producción Bovina de Carne",
    editorial: "Editorial Hemisferio Sur, Buenos Aires",
    edicion: "2ª edición",
    citaCorta: "Bavera 2005",
    resumen: "Manual de referencia para producción bovina en Argentina. Umbrales de entore (65% PV adulto), manejo de categorías.",
    tablasCubiertas: ["GDP_MIN_VAQ2", "umbral_entore", "calcVaq2"]
  },

};

// ─────────────────────────────────────────────────────────────────
// Helpers para usar la biblioteca
// ─────────────────────────────────────────────────────────────────

// Obtener una cita por id
export function getCita(id) {
  return CITAS[id] || null;
}

// Buscar todas las citas que cubren una tabla/función del motor
export function citasParaTabla(nombreTabla) {
  return Object.values(CITAS).filter(c =>
    c.tablasCubiertas && c.tablasCubiertas.includes(nombreTabla)
  );
}

// Formato corto para usar en el cuerpo del informe: "(Autor año)"
export function citaCorta(id) {
  const c = getCita(id);
  return c ? "(" + c.citaCorta + ")" : "";
}

// Formato completo para la bibliografía final del PDF
export function citaCompleta(id) {
  const c = getCita(id);
  if (!c) return "";
  let s = c.autores + " " + c.anio + ". " + c.titulo + ". ";
  if (c.revista) s += c.revista;
  if (c.volumen) s += " " + c.volumen;
  if (c.paginas) s += ":" + c.paginas;
  if (c.editorial) s += ". " + c.editorial;
  if (c.issn) s += ". ISSN " + c.issn;
  if (c.doi) s += ". DOI: " + c.doi;
  return s + ".";
}

// Agrupar citas por nivel de evidencia (para la bibliografía final)
export function agruparPorNivel(listaIds) {
  const grupos = { N1: [], N2: [], N3: [], N4: [] };
  const vistos = new Set();
  listaIds.forEach(id => {
    if (vistos.has(id)) return;
    vistos.add(id);
    const c = getCita(id);
    if (c && grupos[c.nivel]) grupos[c.nivel].push(c);
  });
  return grupos;
}

// Construir la biblioteca en texto plano para enviar al modelo de IA
// (formato compacto: el cerebro necesita ver qué puede citar)
export function bibliotecaParaPrompt() {
  const lista = Object.values(CITAS).map(c => {
    const niv = NIVELES_EVIDENCIA[c.nivel]?.icono || "";
    return "- " + niv + " " + c.citaCorta + " [" + c.id + "]: " + c.titulo + ". " +
           (c.revista || c.editorial || c.institucion || "") +
           ". Respalda: " + (c.tablasCubiertas || []).join(", ");
  });
  return "BIBLIOTECA BIBLIOGRÁFICA DISPONIBLE (con nivel de evidencia):\n" + lista.join("\n");
}