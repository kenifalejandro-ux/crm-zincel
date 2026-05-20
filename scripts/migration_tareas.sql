-- Migration: tabla de tareas / recordatorios de seguimiento

CREATE TABLE IF NOT EXISTS tareas (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospecto_id     UUID REFERENCES prospectos(id) ON DELETE CASCADE,
  titulo           VARCHAR(200) NOT NULL,
  descripcion      TEXT,
  fecha_vencimiento DATE NOT NULL,
  completada       BOOLEAN NOT NULL DEFAULT false,
  completada_en    TIMESTAMPTZ,
  creado_por       UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tareas_prospecto   ON tareas (prospecto_id);
CREATE INDEX IF NOT EXISTS idx_tareas_vencimiento ON tareas (fecha_vencimiento) WHERE completada = false;
CREATE INDEX IF NOT EXISTS idx_tareas_pendientes  ON tareas (creado_por, completada, fecha_vencimiento);
