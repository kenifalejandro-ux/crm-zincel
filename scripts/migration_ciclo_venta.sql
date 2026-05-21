-- Migration: ciclo de venta
-- Agrega fecha_primer_contacto y fecha_cierre a prospectos
-- para calcular el tiempo promedio de cierre de ventas

ALTER TABLE prospectos
  ADD COLUMN IF NOT EXISTS fecha_primer_contacto DATE,
  ADD COLUMN IF NOT EXISTS fecha_cierre          DATE;

CREATE INDEX IF NOT EXISTS idx_prospectos_primer_contacto
  ON prospectos (fecha_primer_contacto);

CREATE INDEX IF NOT EXISTS idx_prospectos_fecha_cierre
  ON prospectos (fecha_cierre);

-- Backfill: extraer fecha del campo notas de la primera llamada registrada
UPDATE prospectos p
SET fecha_primer_contacto = sub.fecha
FROM (
  SELECT DISTINCT ON (l.prospecto_id)
    l.prospecto_id,
    TO_DATE(
      (regexp_match(l.notas, 'Primer contacto: (\d{2}/\d{2}/\d{4})'))[1],
      'DD/MM/YYYY'
    ) AS fecha
  FROM llamadas l
  WHERE l.notas ~ 'Primer contacto: \d{2}/\d{2}/\d{4}'
  ORDER BY l.prospecto_id, l.fecha ASC
) sub
WHERE p.id = sub.prospecto_id
  AND p.fecha_primer_contacto IS NULL;
