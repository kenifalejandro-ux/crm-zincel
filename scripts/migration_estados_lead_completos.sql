-- Agrega valores faltantes al enum estado_lead
ALTER TYPE estado_lead ADD VALUE IF NOT EXISTS 'solicita_informacion';
ALTER TYPE estado_lead ADD VALUE IF NOT EXISTS 'baja_de_oficio';
ALTER TYPE estado_lead ADD VALUE IF NOT EXISTS 'suspension_temporal';
