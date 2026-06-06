-- Migración: tabla registro_jornada
-- Registra bloques de tiempo productivo no comercial (propuestas, dev, diseño, etc.)

CREATE TYPE categoria_jornada AS ENUM (
  'propuesta_cotizacion',
  'desarrollo_web',
  'diseno_wireframe',
  'mejoras_crm',
  'reunion_interna',
  'administracion',
  'capacitacion',
  'marketing_contenido',
  'otro'
);

CREATE TABLE IF NOT EXISTS registro_jornada (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha       DATE        NOT NULL DEFAULT CURRENT_DATE,
  categoria   categoria_jornada NOT NULL,
  descripcion TEXT,
  horas       NUMERIC(4,2) NOT NULL CHECK (horas > 0 AND horas <= 24),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registro_jornada_usuario_fecha
  ON registro_jornada (usuario_id, fecha DESC);
