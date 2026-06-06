-- Agrega el campo intentos a la tabla llamadas
-- Representa cuántas veces se intentó contactar en un mismo registro de interacción

ALTER TABLE llamadas
  ADD COLUMN IF NOT EXISTS intentos SMALLINT NOT NULL DEFAULT 1
    CHECK (intentos >= 1 AND intentos <= 20);
