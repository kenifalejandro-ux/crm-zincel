-- ─── Fase 1: Sync automático + métricas orgánicas ────────────────────────────

-- 1. Columnas de tracking de sync en plataforma_cuentas
ALTER TABLE plataforma_cuentas
  ADD COLUMN IF NOT EXISTS ultimo_sync     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_error      TEXT,
  ADD COLUMN IF NOT EXISTS sync_automatico BOOLEAN DEFAULT true;

-- 2. Tabla de métricas orgánicas (posts, stories, reels individuales)
CREATE TABLE IF NOT EXISTS metricas_organicas (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa           VARCHAR(255) NOT NULL,
  plataforma        VARCHAR(50)  NOT NULL CHECK (plataforma IN ('instagram', 'tiktok')),
  post_id           VARCHAR(255) NOT NULL,
  tipo_contenido    VARCHAR(50),               -- IMAGE, VIDEO, CAROUSEL_ALBUM, REELS
  descripcion       TEXT,
  url_media         TEXT,
  permalink         TEXT,
  publicado_en      TIMESTAMPTZ,
  alcance           INTEGER      DEFAULT 0,
  impresiones       INTEGER      DEFAULT 0,
  me_gusta          INTEGER      DEFAULT 0,
  comentarios       INTEGER      DEFAULT 0,
  compartidos       INTEGER      DEFAULT 0,
  guardados         INTEGER      DEFAULT 0,
  reproducciones    INTEGER      DEFAULT 0,
  watch_time_seg    NUMERIC(10,2) DEFAULT 0,
  tasa_reproduccion NUMERIC(8,4)  DEFAULT 0,
  tasa_engagement   NUMERIC(8,4)  DEFAULT 0,
  creado_en         TIMESTAMPTZ  DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (empresa, plataforma, post_id)
);

CREATE INDEX IF NOT EXISTS idx_metricas_organicas_empresa      ON metricas_organicas(empresa);
CREATE INDEX IF NOT EXISTS idx_metricas_organicas_plataforma   ON metricas_organicas(plataforma);
CREATE INDEX IF NOT EXISTS idx_metricas_organicas_publicado_en ON metricas_organicas(publicado_en DESC);
