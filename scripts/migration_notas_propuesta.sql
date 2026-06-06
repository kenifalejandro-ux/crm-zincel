-- Agrega campos de notas por etapa en propuestas
ALTER TABLE propuestas
  ADD COLUMN IF NOT EXISTS notas_negociacion TEXT,
  ADD COLUMN IF NOT EXISTS notas_cierre      TEXT;
