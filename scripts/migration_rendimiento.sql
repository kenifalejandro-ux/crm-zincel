-- Migration: hora_fin en llamadas + motivo_perdida en prospectos
-- Ejecutar como superusuario de PostgreSQL

ALTER TABLE llamadas ADD COLUMN IF NOT EXISTS hora_fin TIME;
ALTER TABLE prospectos ADD COLUMN IF NOT EXISTS motivo_perdida VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_llamadas_hora ON llamadas (EXTRACT(HOUR FROM fecha));
CREATE INDEX IF NOT EXISTS idx_prospectos_motivo ON prospectos (motivo_perdida) WHERE motivo_perdida IS NOT NULL;
