/**src/server/services/prospecto.service.ts */

import { pool } from "../config/database";
import { logger } from "../config/logger";
import type { CrearProspectoInput, ActualizarProspectoInput } from "../schemas/prospecto.schema";

export async function crearProspectoService(input: CrearProspectoInput, usuarioId: string) {
  const webActiva = input.web_activa === true
    ? true
    : String(input.web_activa).toLowerCase() === "true"
      ? true
      : input.web_activa === false || String(input.web_activa).toLowerCase() === "false"
        ? false
        : undefined;

  const result = await pool.query(
    `INSERT INTO prospectos (
      empresa, rubro, tamano_empresa, pagina_web, web_activa, proveedor_web,
      nombre_contacto, cargo, telefono, email_contacto,
      ciudad, region, pais,
      prioridad, fuente, estado_lead, clasificacion, estado_venta,
      notas, creado_por
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
    ) RETURNING *`,
    [
      input.empresa, input.rubro, input.tamano_empresa, input.pagina_web,
      input.web_activa, input.proveedor_web, input.nombre_contacto, input.cargo,
      input.telefono, input.email_contacto, input.ciudad, input.region,
      input.pais ?? "Perú", input.prioridad ?? "media", input.fuente,
      input.estado_lead ?? "no_contesta", input.clasificacion ?? "por_gestionar",
      input.estado_venta ?? "no", input.notas, usuarioId,
    ]
  );
  logger.info({ id: result.rows[0].id }, "Prospecto creado");
  return result.rows[0];
}

export async function obtenerProspectosService(filtros: {
  estado_lead?: string;
  clasificacion?: string;
  prioridad?: string;
  fuente?: string;
  busqueda?: string;
  pagina?: number;
  limite?: number;
}) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;

  if (filtros.estado_lead) {
    condiciones.push(`estado_lead = $${idx++}`);
    valores.push(filtros.estado_lead);
  }
  if (filtros.clasificacion) {
    condiciones.push(`clasificacion = $${idx++}`);
    valores.push(filtros.clasificacion);
  }
  if (filtros.prioridad) {
    condiciones.push(`prioridad = $${idx++}`);
    valores.push(filtros.prioridad);
  }
  if (filtros.fuente) {
    condiciones.push(`fuente = $${idx++}`);
    valores.push(filtros.fuente);
  }
  if (filtros.busqueda) {
    condiciones.push(`(
      empresa ILIKE $${idx} OR
      nombre_contacto ILIKE $${idx} OR
      telefono ILIKE $${idx} OR
      email_contacto ILIKE $${idx}
    )`);
    valores.push(`%${filtros.busqueda}%`);
    idx++;
  }

  {/**paginacion */}
  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
  const limite = filtros.limite ?? 50;
  const offset = ((filtros.pagina ?? 1) - 1) * limite;

  const [data, total] = await Promise.all([
    pool.query(
      `SELECT p.*,
        json_agg(DISTINCT l.*) FILTER (WHERE l.id IS NOT NULL) AS llamadas,
        json_agg(DISTINCT r.*) FILTER (WHERE r.id IS NOT NULL) AS reuniones,
        json_agg(DISTINCT b.*) FILTER (WHERE b.id IS NOT NULL) AS brochures,
        json_agg(DISTINCT pr.*) FILTER (WHERE pr.id IS NOT NULL) AS propuestas
       FROM prospectos p
       LEFT JOIN llamadas l ON l.prospecto_id = p.id
       LEFT JOIN reuniones r ON r.prospecto_id = p.id
       LEFT JOIN brochures b ON b.prospecto_id = p.id
       LEFT JOIN propuestas pr ON pr.prospecto_id = p.id
       ${where ? where.replace(/WHERE/g, 'WHERE p.') : ''}
       GROUP BY p.id
       ORDER BY p.creado_en DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...valores, limite, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM prospectos p ${where ? where.replace(/WHERE/g, 'WHERE p.') : ''}`,
      valores
    ),
  ]);

  return {
    data: data.rows,
    total: parseInt(total.rows[0].count),
    pagina: filtros.pagina ?? 1,
    limite,
  };
}

export async function obtenerProspectoPorIdService(id: string) {
  const result = await pool.query(
    `SELECT p.*,
      json_agg(DISTINCT l.*) FILTER (WHERE l.id IS NOT NULL) AS llamadas,
      json_agg(DISTINCT r.*) FILTER (WHERE r.id IS NOT NULL) AS reuniones,
      json_agg(DISTINCT b.*) FILTER (WHERE b.id IS NOT NULL) AS brochures,
      json_agg(DISTINCT pr.*) FILTER (WHERE pr.id IS NOT NULL) AS propuestas
     FROM prospectos p
     LEFT JOIN llamadas l ON l.prospecto_id = p.id
     LEFT JOIN reuniones r ON r.prospecto_id = p.id
     LEFT JOIN brochures b ON b.prospecto_id = p.id
     LEFT JOIN propuestas pr ON pr.prospecto_id = p.id
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function actualizarProspectoService(id: string, input: ActualizarProspectoInput) {
  const campos = Object.keys(input).filter(k => (input as any)[k] !== undefined);
  if (campos.length === 0) throw new Error("No hay campos para actualizar");

  const sets = campos.map((campo, i) => `${campo} = $${i + 2}`).join(", ");
  const valores = campos.map(campo => (input as any)[campo]);

  const result = await pool.query(
    `UPDATE prospectos SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...valores]
  );
  if (result.rowCount === 0) throw new Error("Prospecto no encontrado");
  logger.info({ id }, "Prospecto actualizado");
  return result.rows[0];
}
{/**eliminar masivo  */}
export async function eliminarProspectoService(id: string) {
  const result = await pool.query(
    `DELETE FROM prospectos WHERE id = $1 RETURNING id`,
    [id]
  );
  if (result.rowCount === 0) throw new Error("Prospecto no encontrado");
  logger.info({ id }, "Prospecto eliminado");
  return { eliminado: true };
}

export async function eliminarProspectosMasivoService(ids: string[]) {
  if (!ids.length) return 0;

  const result = await pool.query(
    `
    DELETE FROM prospectos
    WHERE id = ANY($1)
    RETURNING id
    `,
    [ids]
  );

  return result.rowCount;
}

export async function importarProspectosService(prospectos: any[], usuarioId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const insertados: any[] = [];

    for (const p of prospectos) {
      const webActiva = p.web_activa === true
        ? true
        : String(p.web_activa || "").toLowerCase().trim() === "true"
          ? true
          : p.web_activa === false || String(p.web_activa || "").toLowerCase().trim() === "false"
            ? false
            : undefined;

      const result = await client.query(
        `INSERT INTO prospectos (
          empresa, rubro, tamano_empresa, pagina_web, web_activa, proveedor_web,
          nombre_contacto, cargo, telefono, email_contacto,
          ciudad, region, pais, prioridad, fuente,
          estado_lead, clasificacion, estado_venta, notas, creado_por
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
        RETURNING id`,
        [
          p.empresa, p.rubro, p.tamano_empresa, p.pagina_web, webActiva,
          p.proveedor_web, p.nombre_contacto, p.cargo, p.telefono, p.email_contacto,
          p.ciudad, p.region, p.pais ?? "Perú", p.prioridad ?? "media", p.fuente,
          p.estado_lead ?? "no_contesta", p.clasificacion ?? "por_gestionar",
          p.estado_venta ?? "no", p.notas, usuarioId,
        ]
      );
      const prospectoId = result.rows[0]?.id;
      if (!prospectoId) continue;

      if (Array.isArray(p.llamadas)) {
        for (const llamada of p.llamadas) {
          // Validar fecha
          const fechaLlamada = llamada.fecha;
          if (fechaLlamada) {
            const date = new Date(fechaLlamada);
            if (isNaN(date.getTime()) || date.getFullYear() < 2000 || date.getFullYear() > 2030) {
              continue; // Saltar llamada con fecha inválida
            }
          }

          await client.query(
            `INSERT INTO llamadas (prospecto_id, fecha, canal, contestada, duracion_minutos, resultado, notas, creado_por)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              prospectoId,
              fechaLlamada || new Date().toISOString(),
              llamada.canal ?? "llamada",
              llamada.contestada ?? false,
              llamada.duracion_minutos ?? 0,
              llamada.resultado,
              llamada.notas,
              usuarioId,
            ]
          );
        }
      }

      if (Array.isArray(p.brochures)) {
        for (const brochure of p.brochures) {
          // Validar fecha si existe
          const fechaEnvio = brochure.fecha_envio;
          if (fechaEnvio) {
            const date = new Date(fechaEnvio);
            if (isNaN(date.getTime()) || date.getFullYear() < 2000 || date.getFullYear() > 2030) {
              continue; // Saltar brochure con fecha inválida
            }
          }

          await client.query(
            `INSERT INTO brochures (prospecto_id, canal, fecha_envio, enviado, notas, creado_por)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [
              prospectoId,
              brochure.canal ?? "correo",
              fechaEnvio || new Date().toISOString(),
              brochure.enviado ?? true,
              brochure.notas,
              usuarioId,
            ]
          );
        }
      }

      if (Array.isArray(p.reuniones)) {
        for (const reunion of p.reuniones) {
          // Validar fecha_hora
          const fechaHora = reunion.fecha_hora;
          if (fechaHora) {
            const date = new Date(fechaHora);
            if (isNaN(date.getTime()) || date.getFullYear() < 2000 || date.getFullYear() > 2030) {
              continue; // Saltar reunión con fecha inválida
            }
          }

          await client.query(
            `INSERT INTO reuniones (prospecto_id, titulo, fecha_hora, modalidad, enlace, estado, notas, creado_por)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              prospectoId,
              reunion.titulo ?? "Reunión importada",
              fechaHora || new Date().toISOString(),
              reunion.modalidad ?? "google_meet",
              reunion.enlace,
              reunion.estado ?? "programada",
              reunion.notas,
              usuarioId,
            ]
          );
        }
      }

      insertados.push(prospectoId);
    }

    await client.query("COMMIT");
    logger.info({ total: insertados.length }, "Importación masiva completada");
    return { insertados: insertados.length, total: prospectos.length };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}