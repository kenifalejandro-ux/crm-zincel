-- Fase 3: Tabla de notificaciones in-app
CREATE TABLE IF NOT EXISTS notificaciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo        VARCHAR(50)  NOT NULL,
  titulo      VARCHAR(255) NOT NULL,
  cuerpo      TEXT,
  url         VARCHAR(500),
  leida       BOOLEAN      NOT NULL DEFAULT FALSE,
  creado_en   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  metadata    JSONB        NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario
  ON notificaciones(usuario_id, leida, creado_en DESC);
