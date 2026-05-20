-- Migration: Plantillas de mensaje
-- Run as postgres: sudo -u postgres psql zincel_rp -f /tmp/migration_plantillas.sql

CREATE TABLE IF NOT EXISTS plantillas_mensaje (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo     VARCHAR(100) NOT NULL,
  canal      VARCHAR(20)  NOT NULL DEFAULT 'whatsapp',
  contenido  TEXT         NOT NULL,
  creado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plantillas_canal ON plantillas_mensaje(canal);
