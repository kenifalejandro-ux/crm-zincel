-- Migración: Multi-campaña por venta + campo objetivo en campañas
-- Fecha: 2026-06-08

-- 1. Agrega campo "objetivo" a campana_metricas para separar ventas de branding
ALTER TABLE campana_metricas
  ADD COLUMN IF NOT EXISTS objetivo VARCHAR(20) NOT NULL DEFAULT 'venta';

-- Clasificación automática de campañas conocidas como branding/comunidad
UPDATE campana_metricas SET objetivo = 'branding'
WHERE LOWER(campana_nombre) ILIKE '%dia del padre%'
   OR LOWER(campana_nombre) ILIKE '%día del padre%'
   OR LOWER(campana_nombre) ILIKE '%oferta laboral%'
   OR LOWER(campana_nombre) ILIKE '%pauta duo%'
   OR LOWER(campana_nombre) ILIKE '%pauta dúo%'
   OR LOWER(campana_nombre) ILIKE '%villa & san fer%'
   OR LOWER(campana_nombre) ILIKE '%dia.papa%'
   OR LOWER(campana_nombre) ILIKE '%día.papá%'
   OR LOWER(campana_nombre) ILIKE '%dia papa%';

-- 2. Tabla de relación muchos-a-muchos: una venta puede atribuirse a varias campañas
CREATE TABLE IF NOT EXISTS resultado_campana_rel (
  resultado_id UUID NOT NULL,
  metrica_id   UUID NOT NULL,
  PRIMARY KEY (resultado_id, metrica_id),
  FOREIGN KEY (resultado_id) REFERENCES resultados_campana(id) ON DELETE CASCADE,
  FOREIGN KEY (metrica_id)   REFERENCES campana_metricas(id)   ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rcrel_resultado ON resultado_campana_rel(resultado_id);
CREATE INDEX IF NOT EXISTS idx_rcrel_metrica   ON resultado_campana_rel(metrica_id);

-- 3. Migrar datos existentes al junction table
INSERT INTO resultado_campana_rel (resultado_id, metrica_id)
SELECT id, metrica_id FROM resultados_campana WHERE metrica_id IS NOT NULL
ON CONFLICT DO NOTHING;
