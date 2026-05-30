-- Agrega el valor 'suspension_temporal' al enum estado_lead
-- Run: sudo -u postgres psql zincel_rp -f /home/kenif/CRM-Zincel/scripts/migration_suspension_temporal.sql

ALTER TYPE estado_lead ADD VALUE IF NOT EXISTS 'suspension_temporal';
