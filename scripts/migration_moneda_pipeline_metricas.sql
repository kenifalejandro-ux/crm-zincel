-- Migration: moneda y tipo_cambio en pipeline + moneda_gasto en campana_metricas

-- Prospectos: valor_estimado ahora puede ser PEN o USD
ALTER TABLE prospectos
  ADD COLUMN IF NOT EXISTS moneda_pipeline    VARCHAR(3)   NOT NULL DEFAULT 'PEN'
    CHECK (moneda_pipeline IN ('PEN', 'USD')),
  ADD COLUMN IF NOT EXISTS tipo_cambio_pipeline NUMERIC(6,3) NOT NULL DEFAULT 1;

-- campana_metricas: marcar moneda del gasto (Meta/TikTok/Google facturan en USD)
ALTER TABLE campana_metricas
  ADD COLUMN IF NOT EXISTS moneda_gasto VARCHAR(3) NOT NULL DEFAULT 'USD'
    CHECK (moneda_gasto IN ('PEN', 'USD'));
