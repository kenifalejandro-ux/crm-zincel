-- Agrega campo motivo_cierre_perdido a propuestas
-- Captura el motivo cuando una propuesta se marca como cerrada_perdida o vencida

ALTER TABLE propuestas
  ADD COLUMN IF NOT EXISTS motivo_cierre_perdido TEXT DEFAULT NULL;
