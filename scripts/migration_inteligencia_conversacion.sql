-- Enriquece la tabla llamadas para inteligencia de conversación
-- Run: sudo -u postgres psql zincel_rp -f /home/kenif/CRM-Zincel/scripts/migration_inteligencia_conversacion.sql

-- Nuevo enum: acción acordada al cierre de la llamada contestada
CREATE TYPE accion_acordada_enum AS ENUM (
  'enviar_brochure',
  'agendar_reunion',
  'cotizar',
  'volver_llamar',
  'ninguna'
);

-- Nueva columna en llamadas
ALTER TABLE llamadas ADD COLUMN IF NOT EXISTS accion_acordada accion_acordada_enum;
