-- Permite monto_propuesto = 0 en propuestas (ej: servicios gratuitos para cartera)
ALTER TABLE propuestas DROP CONSTRAINT IF EXISTS propuestas_monto_propuesto_check;
ALTER TABLE propuestas ADD CONSTRAINT propuestas_monto_propuesto_check CHECK (monto_propuesto >= 0);
