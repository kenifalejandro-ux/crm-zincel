-- scripts/migration_objetivos_diarios.sql
-- Tabla de objetivos diarios por usuario

CREATE TABLE IF NOT EXISTS objetivos_diarios (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id     UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  llamadas_meta  INT NOT NULL DEFAULT 10,
  reuniones_meta INT NOT NULL DEFAULT 2,
  brochures_meta INT NOT NULL DEFAULT 5,
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (usuario_id)
);
