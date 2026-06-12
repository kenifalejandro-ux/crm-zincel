-- Agrega ID de campaña de la plataforma para poder hacer refresh individual
ALTER TABLE campana_metricas
  ADD COLUMN IF NOT EXISTS platform_campaign_id VARCHAR(100);

-- Índice único: permite ON CONFLICT al hacer refresh/upsert por campaña
CREATE UNIQUE INDEX IF NOT EXISTS idx_campana_platform_id
  ON campana_metricas(empresa, plataforma, platform_campaign_id, periodo_inicio, periodo_fin)
  WHERE platform_campaign_id IS NOT NULL;

-- Retroactivamente poblar platform_campaign_id desde el campo notas
-- (los syncs anteriores guardan "Importado Meta Ads · ID: 12345")
UPDATE campana_metricas
SET platform_campaign_id = (regexp_match(notas, 'ID:\s*(\S+)$'))[1]
WHERE platform_campaign_id IS NULL
  AND notas ~ 'ID:\s*\S+$';
