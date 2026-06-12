-- Benchmark Competidores: rastrear seguidores de páginas públicas de Facebook
-- Ejecutar como zincel_user: psql -U zincel_user -d zincel_rp -h localhost -f scripts/migration_competidores.sql

CREATE TABLE IF NOT EXISTS competidores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa       VARCHAR(200) NOT NULL,
  plataforma    VARCHAR(20)  NOT NULL DEFAULT 'facebook' CHECK (plataforma IN ('facebook')),
  pagina_id     VARCHAR(100) NOT NULL,
  nombre        VARCHAR(200) NOT NULL,
  url_pagina    TEXT,
  imagen_url    TEXT,
  categoria     VARCHAR(200),
  descripcion   TEXT,
  activo        BOOLEAN NOT NULL DEFAULT true,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(empresa, plataforma, pagina_id)
);

CREATE TABLE IF NOT EXISTS competidores_snapshots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competidor_id  UUID NOT NULL REFERENCES competidores(id) ON DELETE CASCADE,
  fecha          DATE NOT NULL DEFAULT CURRENT_DATE,
  seguidores     INTEGER NOT NULL DEFAULT 0,
  fan_count      INTEGER NOT NULL DEFAULT 0,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(competidor_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_competidores_empresa   ON competidores(empresa);
CREATE INDEX IF NOT EXISTS idx_snapshots_competidor   ON competidores_snapshots(competidor_id, fecha DESC);
