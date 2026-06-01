-- ============================================================
-- MIGRACIÓN: OKR Corporativo (v2 — métricas de resultado)
-- Fecha: 2026-05-31
-- ============================================================

DROP TABLE IF EXISTS key_results;
DROP TABLE IF EXISTS okrs;
DROP TYPE  IF EXISTS tipo_metrica_okr;

CREATE TYPE tipo_metrica_okr AS ENUM (
  'nuevos_clientes',
  'ingresos_facturados',
  'propuestas_enviadas',
  'tasa_cierre',
  'prospectos_calificados',
  'reuniones_realizadas',
  'manual'
);

CREATE TABLE IF NOT EXISTS okrs (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo      TEXT    NOT NULL,
  descripcion TEXT,
  trimestre   INT     NOT NULL CHECK (trimestre BETWEEN 1 AND 4),
  anio        INT     NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::int,
  activo      BOOLEAN NOT NULL DEFAULT true,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS key_results (
  id             UUID             PRIMARY KEY DEFAULT uuid_generate_v4(),
  okr_id         UUID             NOT NULL REFERENCES okrs(id) ON DELETE CASCADE,
  titulo         TEXT             NOT NULL,
  tipo_metrica   tipo_metrica_okr NOT NULL DEFAULT 'manual',
  valor_objetivo NUMERIC(12,2)    NOT NULL CHECK (valor_objetivo > 0),
  valor_actual   NUMERIC(12,2)    NOT NULL DEFAULT 0,
  creado_en      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
