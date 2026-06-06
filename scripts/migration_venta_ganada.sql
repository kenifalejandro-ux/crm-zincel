-- Agrega el estado 'venta_ganada' al enum estado_lead
-- Ejecutar en producción antes de desplegar el código

ALTER TYPE estado_lead ADD VALUE IF NOT EXISTS 'venta_ganada';
