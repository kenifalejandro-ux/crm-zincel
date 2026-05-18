CREATE TABLE IF NOT EXISTS meta_cuentas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa         VARCHAR(255) NOT NULL UNIQUE,
  ad_account_id   VARCHAR(100) NOT NULL,
  access_token    TEXT NOT NULL,
  activo          BOOLEAN DEFAULT true,
  notas           TEXT,
  creado_en       TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ DEFAULT NOW()
);
