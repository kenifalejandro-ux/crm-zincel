/** scripts/poblar-datos.ts */

import { pool } from '../src/server/config/database';

async function poblarDatos() {
  try {
    console.log('Poblando datos de ejemplo...');

    // Crear un usuario de ejemplo primero
    await pool.query(`
      INSERT INTO usuarios (id, nombre, email, password_hash, rol)
      VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Usuario Demo', 'demo@example.com', '$2b$10$dummy.hash', 'vendedor')
      ON CONFLICT (id) DO NOTHING
    `);

    // Insertar algunos prospectos de ejemplo
    await pool.query(`
      INSERT INTO prospectos (empresa, nombre_contacto, email_contacto, telefono, estado_lead, fuente, tamano_empresa, creado_por)
      VALUES
        ('Empresa A', 'Juan Pérez', 'juan@empresa.com', '999888777', 'interesado', 'web', '11_50', '550e8400-e29b-41d4-a716-446655440000'),
        ('Empresa B', 'María García', 'maria@empresa.com', '999777666', 'no_interesado', 'linkedin', '51_200', '550e8400-e29b-41d4-a716-446655440000'),
        ('Empresa C', 'Carlos López', 'carlos@empresa.com', '999666555', 'interesado', 'referido', '1_10', '550e8400-e29b-41d4-a716-446655440000'),
        ('Empresa D', 'Ana Rodríguez', 'ana@empresa.com', '999555444', 'interesado', 'facebook', '201_500', '550e8400-e29b-41d4-a716-446655440000'),
        ('Empresa E', 'Pedro Sánchez', 'pedro@empresa.com', '999444333', 'no_interesado', 'instagram', 'mas_500', '550e8400-e29b-41d4-a716-446655440000')
      ON CONFLICT DO NOTHING
    `);

    // Insertar algunas llamadas
    await pool.query(`
      INSERT INTO llamadas (prospecto_id, fecha, canal, contestada, duracion_minutos, resultado, notas, creado_por)
      SELECT
        p.id,
        NOW() - INTERVAL '1 day' * (random() * 30)::int,
        'llamada',
        random() > 0.3,
        (random() * 15)::int,
        'interesado'::estado_lead,
        'Llamada de seguimiento',
        '550e8400-e29b-41d4-a716-446655440000'
      FROM prospectos p
      LIMIT 15
    `);

    // Insertar algunos brochures
    await pool.query(`
      INSERT INTO brochures (prospecto_id, canal, fecha_envio, enviado, notas, creado_por)
      SELECT
        p.id,
        'correo'::canal_brochure,
        NOW() - INTERVAL '1 day' * (random() * 30)::int,
        true,
        'Brochure enviado',
        '550e8400-e29b-41d4-a716-446655440000'
      FROM prospectos p
      LIMIT 8
    `);

    // Insertar algunas reuniones
    await pool.query(`
      INSERT INTO reuniones (prospecto_id, titulo, fecha_hora, modalidad, enlace, estado, notas, creado_por)
      SELECT
        p.id,
        'Reunión de presentación',
        NOW() + INTERVAL '1 day' * (random() * 7)::int,
        'google_meet'::modalidad_reunion,
        'https://meet.google.com/abc-defg-hij',
        CASE
          WHEN random() > 0.7 THEN 'realizada'::estado_reunion
          WHEN random() > 0.4 THEN 'programada'::estado_reunion
          ELSE 'cancelada'::estado_reunion
        END,
        'Reunión para presentar servicios',
        '550e8400-e29b-41d4-a716-446655440000'
      FROM prospectos p
      LIMIT 8
    `);

    // Insertar algunos ingresos
    await pool.query(`
      INSERT INTO ingresos (prospecto_id, monto, fecha, descripcion, creado_por)
      SELECT
        p.id,
        (random() * 50000 + 10000)::int,
        NOW() - INTERVAL '1 month' * (random() * 12)::int,
        'Venta de servicios',
        '550e8400-e29b-41d4-a716-446655440000'
      FROM prospectos p
      LIMIT 3
    `);

    console.log('✅ Datos de ejemplo insertados correctamente');
  } catch (error) {
    console.error('❌ Error insertando datos:', error);
  } finally {
    process.exit();
  }
}

poblarDatos();