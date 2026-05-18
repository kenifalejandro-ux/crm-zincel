-- Tabla unificada para credenciales de API por empresa y plataforma
CREATE TABLE IF NOT EXISTS plataforma_cuentas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa        VARCHAR(255) NOT NULL,
  plataforma     VARCHAR(50)  NOT NULL CHECK (plataforma IN ('meta', 'tiktok', 'google')),
  account_id     VARCHAR(200) NOT NULL,
  access_token   TEXT         NOT NULL,
  activo         BOOLEAN      DEFAULT true,
  notas          TEXT,
  creado_en      TIMESTAMPTZ  DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (empresa, plataforma)
);

-- Si ya creaste meta_cuentas, migra los datos y borra la tabla
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'meta_cuentas') THEN
    INSERT INTO plataforma_cuentas (empresa, plataforma, account_id, access_token, activo, notas, creado_en)
    SELECT empresa, 'meta', ad_account_id, access_token, activo, notas, creado_en
    FROM meta_cuentas
    ON CONFLICT (empresa, plataforma) DO NOTHING;
    DROP TABLE meta_cuentas;
  END IF;
END $$;
