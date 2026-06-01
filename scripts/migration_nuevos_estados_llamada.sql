-- Agrega dos nuevos resultados de llamada al enum estado_lead
-- ocupado_en_reunion: atendieron pero dijeron estar ocupados/en reunión y cortaron
-- prometio_llamar: dijeron que llamaban de vuelta y no lo hicieron

ALTER TYPE estado_lead ADD VALUE IF NOT EXISTS 'ocupado_en_reunion';
ALTER TYPE estado_lead ADD VALUE IF NOT EXISTS 'prometio_llamar';
ALTER TYPE estado_lead ADD VALUE IF NOT EXISTS 'no_habido';
