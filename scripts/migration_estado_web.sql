-- Migration: estado_web en prospectos
-- Run as postgres: sudo -u postgres psql zincel_rp -f /home/kenif/CRM-Zincel/scripts/migration_estado_web.sql

ALTER TABLE prospectos ADD COLUMN IF NOT EXISTS estado_web VARCHAR(30) DEFAULT NULL;
