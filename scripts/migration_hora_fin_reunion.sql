-- Agrega hora de fin y duración calculada a la tabla reuniones

ALTER TABLE reuniones
  ADD COLUMN IF NOT EXISTS hora_fin         TIME,
  ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER;
