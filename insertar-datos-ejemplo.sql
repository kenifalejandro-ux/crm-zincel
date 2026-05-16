-- Script de inserción de datos de ejemplo para CRM Zincel
-- Para insertarlos: psql -h localhost -U usuario -d crm_zincel -f insertar-datos-ejemplo.sql

BEGIN;

-- Insertar usuarios si no existen
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES 
  ('Admin CRM', 'admin@zincel.com', 'hash_simulado', 'admin'),
  ('Vendedor 1', 'vendedor1@zincel.com', 'hash_simulado', 'vendedor')
ON CONFLICT (email) DO NOTHING;

-- Obtener IDs de usuarios
WITH usuarios_ids AS (
  SELECT id FROM usuarios LIMIT 2
)

-- Insertar prospectos de ejemplo
INSERT INTO prospectos (
  empresa, rubro, tamano_empresa, nombre_contacto, cargo, 
  telefono, email_contacto, ciudad, estado_lead, prioridad, creado_por
) 
SELECT
  'Empresa Ejemplo ' || seq,
  'Tecnología',
  '11_50',
  'Contacto ' || seq,
  'Gerente de Ventas',
  '+51' || (9000000 + seq)::text,
  'contacto' || seq || '@empresa.com',
  'Lima',
  CASE WHEN seq % 3 = 0 THEN 'interesado' ELSE 'no_interesado' END,
  CASE WHEN seq % 2 = 0 THEN 'alta' ELSE 'media' END,
  (SELECT id FROM usuarios LIMIT 1)
FROM generate_series(1, 150) as seq;

-- Insertar llamadas de ejemplo (128 realizadas + 50 no realizadas)
WITH prospectos_ids AS (
  SELECT id FROM prospectos LIMIT 200
)
INSERT INTO llamadas (
  prospecto_id, fecha, canal, contestada, duracion_minutos, 
  resultado, creado_por
)
SELECT
  (ARRAY(SELECT id FROM prospectos_ids))[((seq-1) % 200) + 1],
  CURRENT_TIMESTAMP - ((seq * 7)::text || ' hours')::interval,
  'llamada',
  seq <= 128, -- Primeras 128 están contestadas
  CASE WHEN seq <= 128 THEN 5 + (seq % 10) ELSE 0 END,
  CASE WHEN seq <= 128 THEN 'interesado' ELSE 'no_contesta' END,
  (SELECT id FROM usuarios LIMIT 1)
FROM generate_series(1, 178) as seq;

-- Insertar reuniones de ejemplo
WITH prospectos_ids AS (
  SELECT id FROM prospectos LIMIT 100
)
INSERT INTO reuniones (
  prospecto_id, titulo, fecha_hora, modalidad, estado, creado_por
)
SELECT
  (ARRAY(SELECT id FROM prospectos_ids))[((seq-1) % 100) + 1],
  'Reunión de cierre #' || seq,
  CURRENT_TIMESTAMP + ((seq * 2)::text || ' days')::interval,
  CASE WHEN seq % 3 = 0 THEN 'zoom' WHEN seq % 3 = 1 THEN 'google_meet' ELSE 'presencial' END,
  CASE 
    WHEN seq % 4 = 0 THEN 'programada'
    WHEN seq % 4 = 1 THEN 'realizada'
    WHEN seq % 4 = 2 THEN 'cancelada'
    ELSE 'reprogramada'
  END,
  (SELECT id FROM usuarios LIMIT 1)
FROM generate_series(1, 85) as seq;

-- Insertar brochures de ejemplo
WITH prospectos_ids AS (
  SELECT id FROM prospectos LIMIT 80
)
INSERT INTO brochures (
  prospecto_id, canal, fecha_envio, creado_por
)
SELECT
  (ARRAY(SELECT id FROM prospectos_ids))[((seq-1) % 80) + 1],
  CASE WHEN seq % 3 = 0 THEN 'correo' WHEN seq % 3 = 1 THEN 'whatsapp' ELSE 'linkedin' END,
  CURRENT_TIMESTAMP - ((seq * 1)::text || ' days')::interval,
  (SELECT id FROM usuarios LIMIT 1)
FROM generate_series(1, 60) as seq;

-- Insertar ingresos de ejemplo
WITH prospectos_ids AS (
  SELECT id FROM prospectos LIMIT 50
)
INSERT INTO ingresos (
  prospecto_id, monto, concepto, fecha, creado_por
)
SELECT
  (ARRAY(SELECT id FROM prospectos_ids))[((seq-1) % 50) + 1],
  (1000 + (seq * 100))::numeric,
  'Venta de servicios',
  CURRENT_DATE - ((seq * 1)::text || ' days')::interval,
  (SELECT id FROM usuarios LIMIT 1)
FROM generate_series(1, 40) as seq;

COMMIT;

\echo 'Datos de ejemplo insertados exitosamente!'
\echo 'Total prospectos: ~150'
\echo 'Total llamadas: 178 (128 contestadas + 50 no contestadas)'
\echo 'Total reuniones: 85'
\echo 'Total brochures: 60'
\echo 'Total ingresos: 40'
