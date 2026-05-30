-- Migration: meta de ingresos mensual en objetivos_diarios
-- Agrega la columna meta_ingresos_mensual para el forecast tipo quota (Zoho-style)

ALTER TABLE objetivos_diarios
  ADD COLUMN IF NOT EXISTS meta_ingresos_mensual NUMERIC(12,2) NOT NULL DEFAULT 5000;
