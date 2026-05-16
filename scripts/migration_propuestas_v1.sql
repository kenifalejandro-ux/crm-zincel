-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN: Propuestas v1
-- Fecha: 2026-05-15
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. CREAR TABLA propuestas
-- ─────────────────────────────────────────────────────────────

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

-- Trigger actualizado_en
CREATE TRIGGER trg_propuestas_updated
  BEFORE UPDATE ON propuestas
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- Índices
CREATE INDEX IF NOT EXISTS idx_propuestas_prospecto_id ON propuestas(prospecto_id);
CREATE INDEX IF NOT EXISTS idx_propuestas_estado        ON propuestas(estado);
CREATE INDEX IF NOT EXISTS idx_propuestas_fecha         ON propuestas(fecha_propuesta);

-- ─────────────────────────────────────────────────────────────
-- 2. AGREGAR propuesta_id A ingresos
-- ─────────────────────────────────────────────────────────────

ALTER TABLE ingresos
  ADD COLUMN IF NOT EXISTS propuesta_id UUID REFERENCES propuestas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_ingresos_propuesta_id ON ingresos(propuesta_id);

-- ─────────────────────────────────────────────────────────────
-- 3. AGREGAR empresa A ingresos (si no existe)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE ingresos
  ADD COLUMN IF NOT EXISTS empresa VARCHAR(200) NOT NULL DEFAULT '';

ALTER TABLE ingresos
  ADD COLUMN IF NOT EXISTS tipo_cambio NUMERIC(6,3) NOT NULL DEFAULT 1;

COMMIT;
