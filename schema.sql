-- ============================================================
-- CRM SCHEMA - PostgreSQL
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE estado_lead AS ENUM (
  'interesado',
  'no_interesado',
  'no_contesta',
  'volver_a_llamar',
  'buzon_de_voz',
  'fuera_de_servicio',
  'numero_equivocado',
  'ya_tiene_proveedor'
);

CREATE TYPE canal_contacto AS ENUM (
  'llamada',
  'whatsapp',
  'correo',
  'linkedin',
  'instagram',
  'facebook'
);

CREATE TYPE fuente_lead AS ENUM (
  'facebook',
  'instagram',
  'tiktok',
  'linkedin',
  'referido',
  'web',
  'llamada_fria',
  'otro'
);

CREATE TYPE tamano_empresa AS ENUM (
  '1_10',
  '11_50',
  '51_200',
  '201_500',
  'mas_500'
);

CREATE TYPE prioridad AS ENUM (
  'alta',
  'media',
  'baja'
);

CREATE TYPE clasificacion_lead AS ENUM (
  'gestionado',
  'por_gestionar',
  'cerrado',
  'descartado'
);

CREATE TYPE estado_reunion AS ENUM (
  'programada',
  'realizada',
  'cancelada',
  'reprogramada',
  'en_proceso'
);

CREATE TYPE modalidad_reunion AS ENUM (
  'zoom',
  'google_meet',
  'presencial',
  'teams',
  'whatsapp_video'
);

CREATE TYPE estado_venta AS ENUM (
  'si',
  'no',
  'en_proceso'
);

CREATE TYPE canal_brochure AS ENUM (
  'correo',
  'whatsapp',
  'linkedin',
  'instagram',
  'facebook'
);

CREATE TYPE canal_campana AS ENUM (
  'facebook',
  'instagram',
  'linkedin',
  'tiktok',
  'google',
  'otro'
);

CREATE TYPE rol_usuario AS ENUM (
  'admin',
  'vendedor'
);

CREATE TYPE accion_acordada_enum AS ENUM (
  'enviar_brochure',
  'agendar_reunion',
  'cotizar',
  'volver_llamar',
  'ninguna'
);

-- ============================================================
-- TABLA: usuarios
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol           rol_usuario NOT NULL DEFAULT 'vendedor',
  activo        BOOLEAN NOT NULL DEFAULT true,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: prospectos
-- ============================================================

CREATE TABLE IF NOT EXISTS prospectos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Datos de la empresa
  empresa             VARCHAR(200) NOT NULL,
  rubro               VARCHAR(100),
  tamano_empresa      tamano_empresa,
  pagina_web          VARCHAR(300),
  web_activa          BOOLEAN DEFAULT NULL,
  proveedor_web       VARCHAR(150),

  -- Datos del contacto
  nombre_contacto     VARCHAR(150),
  cargo               VARCHAR(100),
  telefono            VARCHAR(30),
  email_contacto      VARCHAR(150),

  -- Ubicación
  ciudad              VARCHAR(100),
  region              VARCHAR(100),
  pais                VARCHAR(100) DEFAULT 'Perú',

  -- Clasificación
  prioridad           prioridad DEFAULT 'media',
  fuente              fuente_lead,
  estado_lead         estado_lead DEFAULT 'no_contesta',
  clasificacion       clasificacion_lead DEFAULT 'por_gestionar',

  -- Venta
  estado_venta        estado_venta DEFAULT 'no',

  -- Notas
  notas               TEXT,

  -- Auditoría
  creado_por          UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: llamadas
-- ============================================================

CREATE TABLE IF NOT EXISTS llamadas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospecto_id      UUID NOT NULL REFERENCES prospectos(id) ON DELETE CASCADE,

  fecha             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  canal             canal_contacto NOT NULL DEFAULT 'llamada',
  contestada        BOOLEAN NOT NULL DEFAULT false,
  duracion_minutos  INTEGER DEFAULT 0,
  resultado         estado_lead,
  accion_acordada   accion_acordada_enum,
  notas             TEXT,

  -- Auditoría
  creado_por        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: reuniones
-- ============================================================

CREATE TABLE IF NOT EXISTS reuniones (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospecto_id      UUID NOT NULL REFERENCES prospectos(id) ON DELETE CASCADE,

  titulo            VARCHAR(200) NOT NULL,
  fecha_hora        TIMESTAMPTZ NOT NULL,
  modalidad         modalidad_reunion NOT NULL DEFAULT 'google_meet',
  enlace            VARCHAR(500),
  estado            estado_reunion NOT NULL DEFAULT 'programada',
  notas             TEXT,
  email_enviado     BOOLEAN NOT NULL DEFAULT false,

  -- Auditoría
  creado_por        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: brochures
-- ============================================================

CREATE TABLE IF NOT EXISTS brochures (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospecto_id      UUID NOT NULL REFERENCES prospectos(id) ON DELETE CASCADE,

  canal             canal_brochure NOT NULL,
  fecha_envio       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  enviado           BOOLEAN NOT NULL DEFAULT true,
  notas             TEXT,

  -- Auditoría
  creado_por        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: propuestas
-- ============================================================

CREATE TABLE IF NOT EXISTS propuestas (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospecto_id     UUID          NOT NULL REFERENCES prospectos(id) ON DELETE CASCADE,

  servicio         VARCHAR(50)   NOT NULL
                   CHECK (servicio IN (
                     'desarrollo_web',
                     'wordpress',
                     'diseño_marketing',
                     'redes_sociales',
                     'publicidad_digital',
                     'erp',
                     'crm',
                     'otro'
                   )),
  descripcion      VARCHAR(300)  NOT NULL,
  monto_propuesto  NUMERIC(10,2) NOT NULL CHECK (monto_propuesto > 0),
  monto_cerrado    NUMERIC(10,2) DEFAULT NULL,
  moneda           VARCHAR(3)    NOT NULL DEFAULT 'PEN'
                   CHECK (moneda IN ('PEN', 'USD')),
  tipo_cambio      NUMERIC(6,3)  NOT NULL DEFAULT 1,

  estado           VARCHAR(20)   NOT NULL DEFAULT 'enviada'
                   CHECK (estado IN (
                     'enviada',
                     'en_negociacion',
                     'cerrada_ganada',
                     'cerrada_perdida',
                     'vencida'
                   )),

  fecha_propuesta  DATE          NOT NULL DEFAULT CURRENT_DATE,
  fecha_cierre     DATE          DEFAULT NULL,
  notas            TEXT,

  -- Auditoría
  creado_por       UUID          REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: ingresos
-- ============================================================

CREATE TABLE IF NOT EXISTS ingresos (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospecto_id      UUID          REFERENCES prospectos(id) ON DELETE SET NULL,
  propuesta_id      UUID          REFERENCES propuestas(id) ON DELETE SET NULL,

  empresa           VARCHAR(200)  NOT NULL DEFAULT '',
  descripcion       VARCHAR(300)  NOT NULL,
  tipo_servicio     VARCHAR(50)   NOT NULL DEFAULT 'otro'
                    CHECK (tipo_servicio IN (
                      'desarrollo_web',
                      'wordpress',
                      'diseño_marketing',
                      'redes_sociales',
                      'publicidad_digital',
                      'erp',
                      'crm',
                      'otro'
                    )),
  monto_total       NUMERIC(10,2) NOT NULL,
  adelanto          NUMERIC(10,2) NOT NULL DEFAULT 0,
  saldo_pendiente   NUMERIC(10,2) GENERATED ALWAYS AS (monto_total - adelanto) STORED,
  moneda            VARCHAR(3)    NOT NULL DEFAULT 'PEN'
                    CHECK (moneda IN ('PEN', 'USD')),
  tipo_cambio       NUMERIC(6,3)  NOT NULL DEFAULT 1,
  estado            VARCHAR(20)   NOT NULL DEFAULT 'por_cobrar'
                    CHECK (estado IN ('por_cobrar', 'cobrado_parcial', 'cobrado', 'vencido')),
  fecha             DATE          NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  notas             TEXT,

  -- Auditoría
  creado_por        UUID          REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: campanas (gastos de campaña)
-- ============================================================

CREATE TABLE IF NOT EXISTS campanas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  nombre            VARCHAR(200) NOT NULL,
  canal             canal_campana NOT NULL,
  presupuesto       NUMERIC(10,2) NOT NULL,
  gastado           NUMERIC(10,2) DEFAULT 0,
  fecha_inicio      DATE NOT NULL,
  fecha_fin         DATE,
  activa            BOOLEAN NOT NULL DEFAULT true,
  notas             TEXT,

  -- Auditoría
  creado_por        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: metricas (métricas de campañas publicitarias)
-- ============================================================

CREATE TABLE IF NOT EXISTS metricas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  empresa         VARCHAR(200) NOT NULL,
  campana_nombre  VARCHAR(200) NOT NULL,
  plataforma      VARCHAR(20)  NOT NULL CHECK (plataforma IN ('meta', 'google', 'tiktok')),

  periodo_inicio  DATE NOT NULL,
  periodo_fin     DATE NOT NULL,

  impresiones     NUMERIC(15,2) NOT NULL DEFAULT 0,
  alcance         NUMERIC(15,2) NOT NULL DEFAULT 0,
  clics           NUMERIC(15,2) NOT NULL DEFAULT 0,
  ctr             NUMERIC(10,4) NOT NULL DEFAULT 0,
  gasto           NUMERIC(12,2) NOT NULL DEFAULT 0,
  cpc             NUMERIC(10,4) NOT NULL DEFAULT 0,
  cpm             NUMERIC(10,4) NOT NULL DEFAULT 0,
  cpa             NUMERIC(10,4) NOT NULL DEFAULT 0,
  conversiones    NUMERIC(12,2) NOT NULL DEFAULT 0,
  leads           NUMERIC(12,2) NOT NULL DEFAULT 0,
  roas            NUMERIC(10,4) NOT NULL DEFAULT 0,
  roi             NUMERIC(10,4) NOT NULL DEFAULT 0,

  notas           TEXT,

  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_prospectos_empresa       ON prospectos(empresa);
CREATE INDEX IF NOT EXISTS idx_prospectos_estado_lead   ON prospectos(estado_lead);
CREATE INDEX IF NOT EXISTS idx_prospectos_clasificacion ON prospectos(clasificacion);
CREATE INDEX IF NOT EXISTS idx_prospectos_prioridad     ON prospectos(prioridad);
CREATE INDEX IF NOT EXISTS idx_prospectos_creado_en     ON prospectos(creado_en);
CREATE INDEX IF NOT EXISTS idx_prospectos_fuente        ON prospectos(fuente);

CREATE INDEX IF NOT EXISTS idx_llamadas_prospecto_id    ON llamadas(prospecto_id);
CREATE INDEX IF NOT EXISTS idx_llamadas_fecha           ON llamadas(fecha);

CREATE INDEX IF NOT EXISTS idx_reuniones_prospecto_id   ON reuniones(prospecto_id);
CREATE INDEX IF NOT EXISTS idx_reuniones_fecha_hora     ON reuniones(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_reuniones_estado         ON reuniones(estado);

CREATE INDEX IF NOT EXISTS idx_brochures_prospecto_id   ON brochures(prospecto_id);
CREATE INDEX IF NOT EXISTS idx_propuestas_prospecto_id ON propuestas(prospecto_id);
CREATE INDEX IF NOT EXISTS idx_propuestas_estado        ON propuestas(estado);
CREATE INDEX IF NOT EXISTS idx_propuestas_fecha         ON propuestas(fecha_propuesta);

CREATE INDEX IF NOT EXISTS idx_ingresos_prospecto_id   ON ingresos(prospecto_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_propuesta_id   ON ingresos(propuesta_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_fecha          ON ingresos(fecha);
CREATE INDEX IF NOT EXISTS idx_ingresos_estado         ON ingresos(estado);
CREATE INDEX IF NOT EXISTS idx_ingresos_tipo           ON ingresos(tipo_servicio);
CREATE INDEX IF NOT EXISTS idx_campanas_canal           ON campanas(canal);
CREATE INDEX IF NOT EXISTS idx_campanas_activa          ON campanas(activa);

CREATE INDEX IF NOT EXISTS idx_metricas_plataforma      ON metricas(plataforma);
CREATE INDEX IF NOT EXISTS idx_metricas_empresa         ON metricas(empresa);
CREATE INDEX IF NOT EXISTS idx_metricas_periodo_inicio  ON metricas(periodo_inicio);

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

CREATE TRIGGER trg_prospectos_updated
  BEFORE UPDATE ON prospectos
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_propuestas_updated
  BEFORE UPDATE ON propuestas
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_reuniones_updated
  BEFORE UPDATE ON reuniones
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_ingresos_updated
  BEFORE UPDATE ON ingresos
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_campanas_updated
  BEFORE UPDATE ON campanas
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_usuarios_updated
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- ============================================================
-- USUARIO ADMIN POR DEFECTO
-- (password: Admin1234! — cámbialo después del primer login)
-- ============================================================

INSERT INTO usuarios (nombre, email, password_hash, rol)
VALUES (
  'Administrador',
  'admin@crm.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBpj2qmN8LcB6y',
  'admin'
) ON CONFLICT (email) DO NOTHING;