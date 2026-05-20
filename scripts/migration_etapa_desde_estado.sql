-- Mapear etapa_pipeline desde el estado_lead y llamadas existentes
-- Solo actualiza los que están en 'nuevo' (no sobreescribe asignaciones manuales)

-- 1. Leads con al menos una llamada contestada → contactado
UPDATE prospectos
SET etapa_pipeline = 'contactado'
WHERE etapa_pipeline = 'nuevo'
  AND EXISTS (
    SELECT 1 FROM llamadas
    WHERE prospecto_id = prospectos.id
      AND contestada = true
  );

-- 2. Leads con resultado 'interesado' en alguna llamada → interesado
UPDATE prospectos
SET etapa_pipeline = 'interesado'
WHERE etapa_pipeline IN ('nuevo','contactado')
  AND EXISTS (
    SELECT 1 FROM llamadas
    WHERE prospecto_id = prospectos.id
      AND resultado = 'interesado'
  );

-- 3. Leads con propuesta enviada → propuesta_enviada
UPDATE prospectos
SET etapa_pipeline = 'propuesta_enviada'
WHERE etapa_pipeline IN ('nuevo','contactado','interesado')
  AND EXISTS (
    SELECT 1 FROM propuestas
    WHERE prospecto_id = prospectos.id
  );

-- 4. Leads con propuesta aceptada → negociacion
UPDATE prospectos
SET etapa_pipeline = 'negociacion'
WHERE etapa_pipeline IN ('nuevo','contactado','interesado','propuesta_enviada')
  AND EXISTS (
    SELECT 1 FROM propuestas
    WHERE prospecto_id = prospectos.id
      AND estado = 'aceptada'
  );

-- Verificar resultado
SELECT etapa_pipeline, COUNT(*) as total
FROM prospectos
GROUP BY etapa_pipeline
ORDER BY CASE etapa_pipeline
  WHEN 'nuevo'             THEN 1
  WHEN 'contactado'        THEN 2
  WHEN 'interesado'        THEN 3
  WHEN 'propuesta_enviada' THEN 4
  WHEN 'negociacion'       THEN 5
  WHEN 'cerrado_ganado'    THEN 6
  WHEN 'perdido'           THEN 7
END;
