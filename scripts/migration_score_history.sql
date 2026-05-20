-- Historial de score por prospecto (snapshot diario)
CREATE TABLE IF NOT EXISTS score_history (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  prospecto_id  UUID        NOT NULL REFERENCES prospectos(id) ON DELETE CASCADE,
  score         INT         NOT NULL,
  nivel         VARCHAR(20) NOT NULL,
  registrado_en DATE        NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (prospecto_id, registrado_en)
);

CREATE INDEX IF NOT EXISTS idx_score_history_prospecto
  ON score_history(prospecto_id, registrado_en DESC);
