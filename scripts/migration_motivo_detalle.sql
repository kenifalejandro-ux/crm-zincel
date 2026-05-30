-- Agrega columna para detalle de motivo de descarte cuando es "otro"
-- Run: sudo -u postgres psql zincel_rp -f /home/kenif/CRM-Zincel/scripts/migration_motivo_detalle.sql

ALTER TABLE prospectos ADD COLUMN IF NOT EXISTS motivo_perdida_detalle text;
ALTER TYPE estado_lead ADD VALUE IF NOT EXISTS 'suspension_temporal';
