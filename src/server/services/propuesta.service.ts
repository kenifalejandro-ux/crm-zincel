/** src/server/services/propuesta.service.ts */

import { pool } from "../config/database";
import { logger } from "../config/logger";
import type { CrearPropuestaInput, ActualizarPropuestaInput } from "../schemas/propuesta.schema";
import { registrarActividad } from "./activityLog.service";
import { fechaHoy } from "../shared/utils/date.util";

type QueryFn = (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number | null }>;

// Calcula la etapa pipeline más avanzada entre todas las propuestas del prospecto
// y actualiza el prospecto en consecuencia (Opción A: la más avanzada manda).
async function sincronizarEtapaPorPropuestas(prospectoId: string, query: QueryFn) {
  const { rows } = await query(
    `SELECT estado FROM propuestas WHERE prospecto_id = $1`,
    [prospectoId]
  );

  const PRIORITY: Record<string, number> = {
    cerrada_ganada: 4,
    en_negociacion: 3,
    enviada:        2,
  };

  let maxPriority = 0;
  let maxEstado: string | null = null;
  for (const row of rows) {
    const p = PRIORITY[row.estado] ?? 0;
    if (p > maxPriority) { maxPriority = p; maxEstado = row.estado; }
  }

  if (!maxEstado) return; // Todas cerrada_perdida/vencida — no tocar el pipeline

  if (maxEstado === "cerrada_ganada") {
    await query(
      `UPDATE prospectos
       SET etapa_pipeline = 'cerrado_ganado', estado_venta = 'si',
           clasificacion = 'cerrado',
           fecha_cierre = COALESCE(fecha_cierre, CURRENT_DATE)
       WHERE id = $1`,
      [prospectoId]
    );
  } else if (maxEstado === "en_negociacion") {
    await query(
      `UPDATE prospectos
       SET etapa_pipeline = 'negociacion', estado_venta = 'en_proceso',
           clasificacion = 'gestionado', fecha_cierre = NULL
       WHERE id = $1`,
      [prospectoId]
    );
  } else {
    await query(
      `UPDATE prospectos
       SET etapa_pipeline = 'propuesta_enviada', estado_venta = 'en_proceso',
           clasificacion = 'gestionado', fecha_cierre = NULL
       WHERE id = $1`,
      [prospectoId]
    );
  }
}

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

  // Auto-crear ingreso si la propuesta se crea directamente como cerrada_ganada
  if ((input.estado ?? "enviada") === "cerrada_ganada") {
    void (async () => {
      try {
        const prosp = await pool.query(`SELECT empresa FROM prospectos WHERE id = $1`, [input.prospecto_id]);
        const empresa     = prosp.rows[0]?.empresa ?? "";
        const monto       = input.monto_cerrado ?? input.monto_propuesto;
        const descripcion = input.descripcion ?? input.servicio ?? "Sin descripción";
        const fechaCierre = input.fecha_cierre ?? fechaHoy();
        await pool.query(
          `INSERT INTO ingresos
             (prospecto_id, propuesta_id, empresa, descripcion, tipo_servicio,
              monto_total, adelanto, moneda, tipo_cambio, estado,
              fecha, notas, creado_por)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [
            input.prospecto_id,
            result.rows[0].id,
            empresa,
            descripcion,
            input.servicio ?? "otro",
            monto,
            0,
            input.moneda ?? "PEN",
            input.moneda === "USD" ? (input.tipo_cambio ?? 1) : 1,
            "por_cobrar",
            fechaCierre,
            `Generado automáticamente desde propuesta #${result.rows[0].id.slice(0, 8)}`,
            usuarioId,
          ]
        );
        logger.info({ propuesta_id: result.rows[0].id }, "Ingreso generado desde propuesta cerrada_ganada (creación directa)");
      } catch (err) {
        logger.error({ err }, "Error al crear ingreso automático desde crearPropuesta");
      }
    })();
  }

  // Sincronizar pipeline: usar la etapa más avanzada entre todas las propuestas
  void sincronizarEtapaPorPropuestas(
    input.prospecto_id,
    (sql, p) => pool.query(sql, p ?? []) as any
  );

  void registrarActividad({
    prospecto_id: input.prospecto_id,
    tipo:        "propuesta",
    titulo:      `Propuesta enviada: ${input.servicio}`,
    descripcion: input.descripcion ?? undefined,
    metadata:    { monto: input.monto_propuesto, moneda: input.moneda ?? "PEN", estado: input.estado ?? "enviada" },
    usuario_id:  usuarioId,
  });

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

    // ── Si el usuario no proveyó la fecha de transición, usar fecha actual como fallback ──
    if (nuevoEstado !== estadoAnt) {
      if (nuevoEstado === "en_negociacion" && !input.fecha_negociacion) {
        await client.query(
          `UPDATE propuestas SET fecha_negociacion = CURRENT_DATE WHERE id = $1 AND fecha_negociacion IS NULL`,
          [id]
        );
      } else if ((nuevoEstado === "cerrada_ganada" || nuevoEstado === "cerrada_perdida") && !input.fecha_cierre) {
        await client.query(
          `UPDATE propuestas SET fecha_cierre = CURRENT_DATE WHERE id = $1 AND fecha_cierre IS NULL`,
          [id]
        );
      }
    }

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
        const empresa     = prospecto.rows[0]?.empresa ?? "";
        const monto       = propuesta.monto_cerrado ?? propuesta.monto_propuesto;
        const fechaCierre = input.fecha_cierre
          ?? fechaHoy();
        const descripcion = propuesta.descripcion
          ?? propuesta.servicio
          ?? "Sin descripción";

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
            descripcion,
            propuesta.servicio ?? "otro",
            monto,
            0,
            propuesta.moneda ?? "PEN",
            propuesta.tipo_cambio ?? 1,
            "por_cobrar",
            fechaCierre,
            `Generado automáticamente desde propuesta #${id.slice(0, 8)}`,
            usuarioId,
          ]
        );
        logger.info({ propuesta_id: id }, "Ingreso generado desde propuesta cerrada_ganada");
      }
    }

    // ── Sincronizar pipeline: etapa más avanzada entre todas las propuestas ──
    if (nuevoEstado !== estadoAnt) {
      await sincronizarEtapaPorPropuestas(
        prospectoId,
        (sql, p) => client.query(sql, p ?? [])
      );
    }

    await client.query("COMMIT");

    if (input.estado && input.estado !== anterior.estado) {
      const ESTADO_LABEL: Record<string, string> = {
        cerrada_ganada:  "Propuesta aceptada ✅",
        cerrada_perdida: "Propuesta rechazada ❌",
        en_negociacion:  "Propuesta en negociación",
        enviada:         "Propuesta enviada",
      };
      void registrarActividad({
        prospecto_id: propuesta.prospecto_id,
        tipo:        "propuesta",
        titulo:      ESTADO_LABEL[input.estado] ?? `Propuesta: ${input.estado}`,
        metadata:    { estado: input.estado, servicio: propuesta.servicio },
        usuario_id:  usuarioId,
      });
    }

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
    `DELETE FROM propuestas WHERE id = $1 RETURNING id, prospecto_id`,
    [id]
  );
  if (result.rowCount === 0) throw new Error("Propuesta no encontrada");
  // Recalcular etapa con las propuestas restantes
  const prospectoId = result.rows[0].prospecto_id;
  void sincronizarEtapaPorPropuestas(
    prospectoId,
    (sql, p) => pool.query(sql, p ?? []) as any
  );
  return { eliminado: true };
}

export async function resumenEstadosPropuestasService() {
  const result = await pool.query(`
    SELECT
      estado,
      COUNT(*)::int                                                          AS total,
      COALESCE(SUM(
        CASE WHEN moneda = 'USD' THEN monto_propuesto * tipo_cambio ELSE monto_propuesto END
      ), 0)::float                                                           AS monto_total
    FROM propuestas
    GROUP BY estado
    ORDER BY
      CASE estado
        WHEN 'enviada'         THEN 1
        WHEN 'en_negociacion'  THEN 2
        WHEN 'cerrada_ganada'  THEN 3
        WHEN 'cerrada_perdida' THEN 4
        WHEN 'vencida'         THEN 5
        ELSE 6
      END
  `);

  const todos = ["enviada","en_negociacion","cerrada_ganada","cerrada_perdida","vencida"] as const;
  const map = Object.fromEntries(result.rows.map(r => [r.estado, r]));

  return todos.map(e => ({
    estado:      e,
    total:       map[e]?.total       ?? 0,
    monto_total: map[e]?.monto_total ?? 0,
  }));
}
