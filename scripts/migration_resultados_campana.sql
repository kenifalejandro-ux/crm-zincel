-- Tabla: resultados_campana
-- Ventas atribuidas a campañas publicitarias

CREATE TABLE IF NOT EXISTS resultados_campana (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa        TEXT NOT NULL,
  metrica_id     UUID NOT NULL REFERENCES campana_metricas(id) ON DELETE CASCADE,
  campana_nombre TEXT NOT NULL,
  proyecto       TEXT,
  monto          NUMERIC(12,2) NOT NULL DEFAULT 0,
  fecha_venta    DATE NOT NULL,
  prospecto_id   UUID REFERENCES prospectos(id) ON DELETE SET NULL,
  notas          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resultados_empresa    ON resultados_campana(empresa);
CREATE INDEX IF NOT EXISTS idx_resultados_metrica_id ON resultados_campana(metrica_id);
CREATE INDEX IF NOT EXISTS idx_resultados_fecha_venta ON resultados_campana(fecha_venta);
