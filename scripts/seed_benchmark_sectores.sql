-- Seed de benchmarks por sector para el CRM Zincel
-- Valores adaptados al mercado peruano en Soles (S/)
-- Fuentes: WordStream Industry Benchmarks, Meta Ads Industry Report, Google Ads LatAm data
-- CTR en %, CPC/CPM/CPL/CPA en S/, ROAS en x (multiplicador), ROI en %
-- Usar: INSERT ... ON CONFLICT DO NOTHING (no sobreescribe sectores ya configurados)

INSERT INTO benchmark_sectores
  (sector, ctr_excelente, ctr_aceptable, cpc_excelente, cpc_aceptable, cpm_excelente, cpm_aceptable,
   cpl_excelente, cpl_aceptable, cpa_excelente, cpa_aceptable, roas_excelente, roas_aceptable,
   roi_excelente, roi_aceptable, fuente)
VALUES

-- Inmobiliaria: CPL alto por ticket grande, ROAS moderado, leads cualificados difíciles de conseguir
('inmobiliaria',
  3.5, 1.5,    -- CTR %
  4.0, 8.0,    -- CPC S/
  55,  90,     -- CPM S/
  80,  180,    -- CPL S/
  200, 500,    -- CPA S/
  5,   3,      -- ROAS x
  200, 100,    -- ROI %
  'WordStream Real Estate 2024, Meta LatAm Benchmarks 2024'),

-- Salud: alta intención de compra, buen CTR, CPL bajo por urgencia del servicio
('salud',
  4.5, 2.0,
  3.0, 6.5,
  45,  75,
  55,  120,
  90,  200,
  6,   3,
  250, 120,
  'WordStream Healthcare 2024, Google Ads Health Industry Report'),

-- Educación: ciclo largo de decisión, CPL moderado, ROAS variable según tipo de curso
('educacion',
  3.5, 1.8,
  2.5, 5.5,
  38,  65,
  45,  110,
  130, 280,
  5,   2.5,
  200, 100,
  'WordStream Education 2024, Meta Education Industry Benchmarks'),

-- Comercio / Retail: alta frecuencia, bajo CPC, ROAS alto por volumen
('comercio_retail',
  5.0, 2.5,
  1.5, 3.5,
  28,  52,
  30,  75,
  55,  120,
  8,   4,
  300, 150,
  'WordStream Retail 2024, Meta Commerce Benchmarks LatAm'),

-- Comercio Mayorista: audiencia B2B más específica, mayor CPC, menor volumen
('comercio_mayorista',
  2.5, 1.2,
  2.5, 5.5,
  38,  68,
  55,  130,
  110, 240,
  6,   3,
  220, 110,
  'Google Ads B2B Benchmarks 2024, WordStream B2B'),

-- Construcción: audiencia B2B/B2C mixta, ticket alto, CPL elevado
('construccion',
  2.5, 1.2,
  5.0, 10.0,
  60,  100,
  95,  210,
  190, 420,
  5,   2.5,
  200, 100,
  'WordStream Construction 2024, Meta B2B LatAm Report'),

-- Arquitectura e Ingeniería: nicho B2B, menor volumen, mayor CPA
('arquitectura_ingenieria',
  2.5, 1.2,
  5.5, 11.0,
  65,  105,
  100, 230,
  200, 440,
  4,   2,
  180, 90,
  'Google Ads Professional Services 2024, Meta B2B Benchmarks'),

-- Manufactura / Industria: B2B puro, bajo CTR esperado, ciclo de venta largo
('manufactura_industria',
  2.0, 1.0,
  4.0, 8.5,
  50,  85,
  85,  190,
  180, 400,
  5,   2.5,
  200, 100,
  'WordStream Industrial 2024, Google Ads Manufacturing'),

-- Gastronomía / Turismo: alta competencia visual, ROAS alto por margen de experiencias
('gastronomia_turismo',
  5.0, 2.5,
  1.5, 3.5,
  28,  52,
  38,  85,
  65,  145,
  7,   3.5,
  250, 120,
  'Meta Travel & Hospitality 2024, WordStream Travel LatAm'),

-- Servicios Profesionales: confianza crítica, CPL medio-alto, ciclo de venta moderado
('servicios_profesionales',
  3.5, 1.8,
  4.0, 8.5,
  55,  90,
  70,  160,
  120, 270,
  5,   2.5,
  200, 100,
  'WordStream Professional Services 2024, Meta B2C LatAm'),

-- Tecnología / TI: B2B dominante, CPC alto por competencia, leads muy cualificados
('tecnologia',
  3.0, 1.5,
  5.5, 11.0,
  65,  105,
  90,  210,
  180, 380,
  5,   2.5,
  200, 100,
  'WordStream Technology 2024, Google Ads Tech Industry Report'),

-- Transporte / Logística: B2B con contratos recurrentes, CPL medio
('transporte_logistica',
  3.0, 1.5,
  3.0, 6.5,
  45,  75,
  65,  150,
  130, 280,
  5,   2.5,
  200, 100,
  'Google Ads B2B LatAm 2024, WordStream Transportation'),

-- Agroindustria / Agro: mercado estacional, bajo CPC, audiencia rural/mixta
('agroindustria',
  2.0, 1.0,
  2.0, 4.5,
  32,  60,
  60,  140,
  140, 310,
  5,   2.5,
  200, 100,
  'Meta LatAm Agriculture 2024, Google Ads Agro Peru'),

-- Minería / Energía: B2B de alto ticket, bajo CTR, CPA muy alto pero margen enorme
('mineria_energia',
  1.5, 0.8,
  6.0, 12.5,
  70,  120,
  130, 280,
  290, 640,
  4,   2,
  180, 80,
  'Google Ads Industrial B2B 2024, Meta Mining & Energy LatAm'),

-- Seguridad / CCTV: B2B+B2C, urgencia media, CPL moderado
('seguridad',
  3.0, 1.5,
  3.5, 7.5,
  50,  85,
  75,  170,
  150, 340,
  5,   2.5,
  200, 100,
  'WordStream Home Services 2024, Meta Security LatAm'),

-- Otro: promedios generales de mercado peruano como referencia base
('otro',
  3.0, 1.5,
  3.0, 7.0,
  48,  82,
  72,  165,
  145, 320,
  5,   2.5,
  200, 100,
  'Promedio general Meta + Google Ads Peru 2024')

ON CONFLICT (sector) DO NOTHING;
