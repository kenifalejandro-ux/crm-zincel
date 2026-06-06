/**src/server/services/jornada.service.ts */

import { pool }   from "../config/database";
import { logger } from "../config/logger";
import type { CrearRegistroJornadaInput, ActualizarRegistroJornadaInput } from "../schemas/jornada.schema";

export async function crearRegistroJornadaService(input: CrearRegistroJornadaInput, usuarioId: string) {
  const result = await pool.query(
    `INSERT INTO registro_jornada (usuario_id, fecha, servicio, categoria, descripcion, horas, prospecto_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [usuarioId, input.fecha, input.servicio, input.categoria, input.descripcion ?? null, input.horas, input.prospecto_id ?? null]
  );
  logger.info({ id: result.rows[0].id }, "Registro jornada creado");
  return result.rows[0];
}

export async function obtenerRegistrosJornadaService(
  usuarioId: string,
  filtros: { fecha?: string; semana?: string; prospecto_id?: string; categoria?: string; servicio?: string }
) {
  const condiciones: string[] = ["rj.usuario_id = $1"];
  const valores: any[] = [usuarioId];
  let idx = 2;

  if (filtros.fecha) {
    condiciones.push(`rj.fecha = $${idx++}`);
    valores.push(filtros.fecha);
  } else if (filtros.semana) {
    condiciones.push(`rj.fecha >= $${idx++} AND rj.fecha < $${idx++}`);
    const lunes = new Date(filtros.semana);
    const domingo = new Date(lunes);
    domingo.setDate(domingo.getDate() + 7);
    valores.push(lunes.toISOString().split("T")[0]);
    valores.push(domingo.toISOString().split("T")[0]);
  }

  if (filtros.prospecto_id) {
    condiciones.push(`rj.prospecto_id = $${idx++}`);
    valores.push(filtros.prospecto_id);
  }
  if (filtros.categoria) {
    condiciones.push(`rj.categoria = $${idx++}::categoria_jornada`);
    valores.push(filtros.categoria);
  }
  if (filtros.servicio) {
    condiciones.push(`rj.servicio = $${idx++}`);
    valores.push(filtros.servicio);
  }

  const result = await pool.query(
    `SELECT rj.*, p.empresa
     FROM registro_jornada rj
     LEFT JOIN prospectos p ON p.id = rj.prospecto_id
     WHERE ${condiciones.join(" AND ")}
     ORDER BY rj.fecha DESC, rj.created_at DESC`,
    valores
  );
  return result.rows;
}

export async function resumenJornadaService(usuarioId: string) {
  const totales = await pool.query(
    `SELECT
       COALESCE(SUM(horas) FILTER (WHERE fecha = CURRENT_DATE), 0)::float            AS horas_hoy,
       COALESCE(SUM(horas) FILTER (WHERE fecha >= date_trunc('week', CURRENT_DATE)), 0)::float AS horas_semana,
       COALESCE(SUM(horas) FILTER (WHERE fecha >= date_trunc('month', CURRENT_DATE)), 0)::float AS horas_mes
     FROM registro_jornada WHERE usuario_id = $1`,
    [usuarioId]
  );

  const cats = await pool.query(
    `SELECT categoria, SUM(horas)::float AS horas
     FROM registro_jornada
     WHERE usuario_id = $1 AND fecha >= date_trunc('month', CURRENT_DATE)
     GROUP BY categoria ORDER BY horas DESC`,
    [usuarioId]
  );

  const servicios = await pool.query(
    `SELECT servicio, SUM(horas)::float AS horas
     FROM registro_jornada
     WHERE usuario_id = $1 AND fecha >= date_trunc('month', CURRENT_DATE) AND servicio IS NOT NULL
     GROUP BY servicio ORDER BY horas DESC`,
    [usuarioId]
  );

  return {
    ...totales.rows[0],
    por_categoria: cats.rows,
    por_servicio:  servicios.rows,
  };
}

export async function resumenSemanalJornadaService(usuarioId: string) {
  const result = await pool.query(
    `SELECT fecha::text, servicio, categoria, SUM(horas)::float AS horas
     FROM registro_jornada
     WHERE usuario_id = $1
       AND fecha >= date_trunc('week', CURRENT_DATE)
       AND fecha < date_trunc('week', CURRENT_DATE) + interval '7 days'
     GROUP BY fecha, servicio, categoria
     ORDER BY fecha ASC`,
    [usuarioId]
  );
  return result.rows;
}

export async function actualizarRegistroJornadaService(id: string, input: ActualizarRegistroJornadaInput, usuarioId: string) {
  const campos  = Object.keys(input).filter(k => (input as any)[k] !== undefined);
  if (campos.length === 0) throw new Error("Sin campos para actualizar");
  const sets    = campos.map((c, i) => `${c} = $${i + 3}`).join(", ");
  const valores = campos.map(c => (input as any)[c]);
  const result  = await pool.query(
    `UPDATE registro_jornada SET ${sets} WHERE id = $1 AND usuario_id = $2 RETURNING *`,
    [id, usuarioId, ...valores]
  );
  if (result.rowCount === 0) throw new Error("Registro no encontrado");
  return result.rows[0];
}

export async function eliminarRegistroJornadaService(id: string, usuarioId: string) {
  const result = await pool.query(
    `DELETE FROM registro_jornada WHERE id = $1 AND usuario_id = $2`,
    [id, usuarioId]
  );
  if (result.rowCount === 0) throw new Error("Registro no encontrado");
  return { eliminado: true };
}
