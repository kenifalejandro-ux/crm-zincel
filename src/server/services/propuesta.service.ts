/** src/server/services/propuesta.service.ts */

import { pool } from "../config/database";
import { logger } from "../config/logger";
import type { CrearPropuestaInput, ActualizarPropuestaInput } from "../schemas/propuesta.schema";

export async function crearPropuestaService(input: CrearPropuestaInput, usuarioId: string) {
  const result = await pool.query(
    `INSERT INTO propuestas
       (prospecto_id, servicio, descripcion, monto_propuesto, monto_cerrado,
        moneda, tipo_cambio, estado, fecha_propuesta, fecha_cierre, notas, creado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      input.prospecto_id,
      input.servicio,
      input.descripcion,
      input.monto_propuesto,
      input.monto_cerrado ?? null,
      input.moneda ?? "PEN",
      input.moneda === "USD" ? (input.tipo_cambio ?? 1) : 1,
      input.estado ?? "enviada",
      input.fecha_propuesta,
      input.fecha_cierre ?? null,
      input.notas ?? null,
      usuarioId,
    ]
  );
  logger.info({ id: result.rows[0].id }, "Propuesta creada");
  return result.rows[0];
}

export async function obtenerPropuestasService(prospecto_id: string) {
  const result = await pool.query(
    `SELECT * FROM propuestas WHERE prospecto_id = $1 ORDER BY fecha_propuesta DESC`,
    [prospecto_id]
  );
  return result.rows;
}

export async function actualizarPropuestaService(
  id: string,
  input: ActualizarPropuestaInput,
  usuarioId: string,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Obtener estado anterior
    const prev = await client.query(
      `SELECT estado, prospecto_id, servicio, descripcion, monto_cerrado,
              moneda, tipo_cambio, fecha_cierre
       FROM propuestas WHERE id = $1`,
      [id]
    );
    if (prev.rowCount === 0) throw new Error("Propuesta no encontrada");
    const anterior = prev.rows[0];

    // Actualizar la propuesta
    const campos = Object.keys(input).filter((k) => (input as any)[k] !== undefined);
    if (campos.length === 0) throw new Error("No hay campos para actualizar");
    const sets = campos.map((c, i) => `${c} = $${i + 2}`).join(", ");
    const updated = await client.query(
      `UPDATE propuestas SET ${sets} WHERE id = $1 RETURNING *`,
      [id, ...campos.map((c) => (input as any)[c])]
    );
    const propuesta = updated.rows[0];

    const nuevoEstado  = propuesta.estado;
    const estadoAnt    = anterior.estado;
    const prospectoId  = propuesta.prospecto_id;

    // ── Auto-crear ingreso al cerrar ganada ──────────────────────────────────
    if (nuevoEstado === "cerrada_ganada" && estadoAnt !== "cerrada_ganada") {
      // Verificar que no exista ya un ingreso para esta propuesta
      const ingresoExiste = await client.query(
        `SELECT id FROM ingresos WHERE propuesta_id = $1`,
        [id]
      );
      if (ingresoExiste.rowCount === 0) {
        const prospecto = await client.query(
          `SELECT empresa FROM prospectos WHERE id = $1`,
          [prospectoId]
        );
        const empresa   = prospecto.rows[0]?.empresa ?? "";
        const monto     = propuesta.monto_cerrado ?? propuesta.monto_propuesto;
        const fechaCierre = propuesta.fecha_cierre ?? new Date().toISOString().split("T")[0];

        await client.query(
          `INSERT INTO ingresos
             (prospecto_id, propuesta_id, empresa, descripcion, tipo_servicio,
              monto_total, adelanto, moneda, tipo_cambio, estado,
              fecha, notas, creado_por)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [
            prospectoId,
            id,
            empresa,
            propuesta.descripcion,
            propuesta.servicio,
            monto,
            0,
            propuesta.moneda,
            propuesta.tipo_cambio,
            "por_cobrar",
            fechaCierre,
            `Generado automáticamente desde propuesta #${id.slice(0, 8)}`,
            usuarioId,
          ]
        );
        logger.info({ propuesta_id: id }, "Ingreso generado desde propuesta cerrada_ganada");
      }
    }

    // ── Sincronizar estado_venta y clasificacion del prospecto ───────────────
    if (nuevoEstado !== estadoAnt) {
      if (nuevoEstado === "cerrada_ganada") {
        await client.query(
          `UPDATE prospectos SET estado_venta = 'si', clasificacion = 'cerrado' WHERE id = $1`,
          [prospectoId]
        );
      } else if (nuevoEstado === "cerrada_perdida") {
        await client.query(
          `UPDATE prospectos SET estado_venta = 'no' WHERE id = $1`,
          [prospectoId]
        );
      } else if (nuevoEstado === "en_negociacion" && estadoAnt === "enviada") {
        await client.query(
          `UPDATE prospectos SET estado_venta = 'en_proceso' WHERE id = $1`,
          [prospectoId]
        );
      }
    }

    await client.query("COMMIT");
    return propuesta;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function eliminarPropuestaService(id: string) {
  const result = await pool.query(
    `DELETE FROM propuestas WHERE id = $1 RETURNING id`,
    [id]
  );
  if (result.rowCount === 0) throw new Error("Propuesta no encontrada");
  return { eliminado: true };
}
