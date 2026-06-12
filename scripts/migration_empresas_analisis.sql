-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN: Empresas Análisis Financiero
-- Fecha: 2026-06-09
-- Tablas: empresas_analisis, periodos_financieros
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. EMPRESAS (fichas de empresa para análisis externo)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS empresas_analisis (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre         VARCHAR(200)  NOT NULL,
  sector         VARCHAR(100),
  moneda         CHAR(3)       NOT NULL DEFAULT 'PEN' CHECK (moneda IN ('PEN','USD')),
  notas          TEXT,
  creado_por     UUID          REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_empresas_analisis_nombre ON empresas_analisis(nombre);

CREATE TRIGGER trg_empresas_analisis_updated
  BEFORE UPDATE ON empresas_analisis
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- ─────────────────────────────────────────────────────────────
-- 2. PERÍODOS FINANCIEROS (snapshots de balance por empresa)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS periodos_financieros (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id     UUID          NOT NULL REFERENCES empresas_analisis(id) ON DELETE CASCADE,
  periodo        VARCHAR(60)   NOT NULL,           -- "Q1 2026", "Abril 2026", "FY2025", etc.
  fecha_periodo  DATE          NOT NULL,            -- para ordenar cronológicamente

  -- ── Activos corrientes ──────────────────────────────────────
  caja_bancos               NUMERIC(15,2) NOT NULL DEFAULT 0,
  cuentas_por_cobrar        NUMERIC(15,2) NOT NULL DEFAULT 0,
  otros_activos_corrientes  NUMERIC(15,2) NOT NULL DEFAULT 0,

  -- ── Activos no corrientes ───────────────────────────────────
  activo_fijo                   NUMERIC(15,2) NOT NULL DEFAULT 0,
  otros_activos_no_corrientes   NUMERIC(15,2) NOT NULL DEFAULT 0,

  -- ── Pasivos ─────────────────────────────────────────────────
  pasivos_corrientes            NUMERIC(15,2) NOT NULL DEFAULT 0,
  pasivos_no_corrientes         NUMERIC(15,2) NOT NULL DEFAULT 0,

  -- ── Resultados ──────────────────────────────────────────────
  patrimonio                    NUMERIC(15,2) NOT NULL DEFAULT 0,
  utilidad_ejercicio            NUMERIC(15,2) NOT NULL DEFAULT 0,
  ventas_netas                  NUMERIC(15,2) NOT NULL DEFAULT 0,

  notas          TEXT,
  creado_en      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_periodos_empresa  ON periodos_financieros(empresa_id);
CREATE INDEX IF NOT EXISTS idx_periodos_fecha    ON periodos_financieros(fecha_periodo);

CREATE TRIGGER trg_periodos_financieros_updated
  BEFORE UPDATE ON periodos_financieros
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

COMMIT;
