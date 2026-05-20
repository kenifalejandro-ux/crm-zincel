-- Migration: Pipeline Kanban + Valor estimado
-- Run as postgres: sudo -u postgres psql zincel_rp -f /tmp/migration_pipeline.sql

ALTER TABLE prospectos
  ADD COLUMN IF NOT EXISTS etapa_pipeline VARCHAR(30) NOT NULL DEFAULT 'nuevo',
  ADD COLUMN IF NOT EXISTS valor_estimado DECIMAL(12,2);

-- Index for pipeline queries (group by stage)
CREATE INDEX IF NOT EXISTS idx_prospectos_etapa ON prospectos(etapa_pipeline);
