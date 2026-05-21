-- Migration: tabla activity_logs — historia completa por prospecto

CREATE TABLE IF NOT EXISTS activity_logs (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospecto_id UUID        NOT NULL REFERENCES prospectos(id) ON DELETE CASCADE,
  tipo         VARCHAR(30) NOT NULL CHECK (tipo IN (
                 'llamada','reunion','propuesta','brochure','tarea',
                 'pipeline','score','automatizacion','nota'
               )),
  titulo       VARCHAR(200) NOT NULL,
  descripcion  TEXT,
  metadata     JSONB        DEFAULT '{}',
  usuario_id   UUID         REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_prospecto ON activity_logs (prospecto_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_tipo      ON activity_logs (tipo);
