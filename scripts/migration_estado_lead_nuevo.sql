-- Migration: Nuevos estados de lead — "nuevo" y "por_gestionar"
-- Run as postgres: sudo -u postgres psql zincel_rp -f /home/kenif/CRM-Zincel/scripts/migration_estado_lead_nuevo.sql

-- 1. Agregar los nuevos valores al enum
ALTER TYPE estado_lead ADD VALUE IF NOT EXISTS 'nuevo';
ALTER TYPE estado_lead ADD VALUE IF NOT EXISTS 'por_gestionar';

-- 2. Cambiar el default de la columna
ALTER TABLE prospectos ALTER COLUMN estado_lead SET DEFAULT 'por_gestionar';

-- 3. Corregir datos existentes:
--    Leads con estado "no_contesta" pero SIN ninguna llamada registrada
--    → pasarlos a "por_gestionar" porque nunca se les llamó
UPDATE prospectos
SET estado_lead = 'por_gestionar'
WHERE estado_lead = 'no_contesta'
  AND NOT EXISTS (
    SELECT 1 FROM llamadas WHERE llamadas.prospecto_id = prospectos.id
  );
