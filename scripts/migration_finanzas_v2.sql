-- ═══════════════════════════════════════════════════════════════
-- MIGRACIÓN: FinanzasPage v2 — Sistema contable digital
-- Fecha: 2026-05-15
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────
-- 1. ACTUALIZAR TABLA ingresos
-- ─────────────────────────────────────────────────────────────

-- Renombrar monto → monto_total (el monto acordado total)
ALTER TABLE ingresos RENAME COLUMN monto TO monto_total;

-- Nuevos campos
ALTER TABLE ingresos
  ADD COLUMN tipo_servicio     VARCHAR(50)   NOT NULL DEFAULT 'otro'
                               CHECK (tipo_servicio IN (
                                 'desarrollo_web',
                                 'diseño_marketing',
                                 'redes_sociales',
                                 'publicidad_digital',
                                 'erp',
                                 'crm',
                                 'otro'
                               )),
  ADD COLUMN adelanto          NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN saldo_pendiente   NUMERIC(10,2) GENERATED ALWAYS AS (monto_total - adelanto) STORED,
  ADD COLUMN estado            VARCHAR(20)   NOT NULL DEFAULT 'por_cobrar'
                               CHECK (estado IN (
                                 'por_cobrar',
                                 'cobrado_parcial',
                                 'cobrado',
                                 'vencido'
                               )),
  ADD COLUMN moneda            VARCHAR(3)    NOT NULL DEFAULT 'PEN'
                               CHECK (moneda IN ('PEN', 'USD')),
  ADD COLUMN fecha_vencimiento DATE;

-- Índices
CREATE INDEX IF NOT EXISTS idx_ingresos_estado    ON ingresos(estado);
CREATE INDEX IF NOT EXISTS idx_ingresos_moneda    ON ingresos(moneda);
CREATE INDEX IF NOT EXISTS idx_ingresos_tipo      ON ingresos(tipo_servicio);

-- ─────────────────────────────────────────────────────────────
-- 2. CREAR TABLA egresos
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS egresos (
  id             UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria      VARCHAR(30)   NOT NULL
                 CHECK (categoria IN (
                   'publicidad_digital',
                   'herramientas_saas',
                   'infraestructura_digital',
                   'subcontratos'
                 )),
  descripcion    VARCHAR(300)  NOT NULL,
  proveedor      VARCHAR(200),
  monto          NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  moneda         VARCHAR(3)    NOT NULL DEFAULT 'PEN'
                 CHECK (moneda IN ('PEN', 'USD')),
  frecuencia     VARCHAR(10)   NOT NULL DEFAULT 'unico'
                 CHECK (frecuencia IN ('mensual', 'anual', 'unico')),
  estado         VARCHAR(10)   NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente', 'pagado')),
  fecha          DATE          NOT NULL DEFAULT CURRENT_DATE,
  notas          TEXT,
  creado_por     UUID          REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_egresos_categoria ON egresos(categoria);
CREATE INDEX IF NOT EXISTS idx_egresos_estado    ON egresos(estado);
CREATE INDEX IF NOT EXISTS idx_egresos_fecha     ON egresos(fecha);
CREATE INDEX IF NOT EXISTS idx_egresos_moneda    ON egresos(moneda);

-- Trigger para actualizar actualizado_en automáticamente
CREATE TRIGGER trg_egresos_updated
  BEFORE UPDATE ON egresos
  FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

COMMIT;
