/**src/server/services/reuniones.service.ts */

import { pool } from "../config/database";
import { logger } from "../config/logger";
import type { CrearReunionInput, ActualizarReunionInput } from "../schemas/reunion.schema";
import { registrarActividad } from "./activityLog.service";

export async function crearReunionService(input: CrearReunionInput, usuarioId: string) {
  let duracion_minutos: number | null = null;
  if (input.hora_fin && input.fecha_hora) {
    const inicio = new Date(input.fecha_hora);
    const [hFin, mFin] = input.hora_fin.split(":").map(Number);
    const fin = new Date(inicio);
    fin.setHours(hFin, mFin, 0, 0);
    const diff = Math.round((fin.getTime() - inicio.getTime()) / 60000);
    if (diff > 0 && diff < 720) duracion_minutos = diff;
  }

  const result = await pool.query(
    `INSERT INTO reuniones (prospecto_id, titulo, fecha_hora, hora_fin, duracion_minutos, modalidad, enlace, estado, notas, creado_por)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      input.prospecto_id, input.titulo, input.fecha_hora,
      input.hora_fin ?? null, duracion_minutos,
      input.modalidad ?? "google_meet", input.enlace,
      input.estado ?? "programada", input.notas, usuarioId,
    ]
  );
  logger.info({ id: result.rows[0].id }, "Reunión creada");

  void registrarActividad({
    prospecto_id: input.prospecto_id,
    tipo:        "reunion",
    titulo:      `Reunión programada: ${input.titulo}`,
    descripcion: input.notas ?? undefined,
    metadata:    { modalidad: input.modalidad, estado: input.estado ?? "programada", fecha_hora: input.fecha_hora },
    usuario_id:  usuarioId,
  });

  return result.rows[0];
}

export async function obtenerReunionesService(filtros: {
  estado?: string;
  prospecto_id?: string;
  desde?: string;
  hasta?: string;
}) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;

  if (filtros.estado) {
    condiciones.push(`r.estado = $${idx++}`);
    valores.push(filtros.estado);
  }
  if (filtros.prospecto_id) {
    condiciones.push(`r.prospecto_id = $${idx++}`);
    valores.push(filtros.prospecto_id);
  }
  if (filtros.desde) {
    condiciones.push(`r.fecha_hora >= $${idx++}`);
    valores.push(filtros.desde);
  }
  if (filtros.hasta) {
    condiciones.push(`r.fecha_hora <= $${idx++}`);
    valores.push(filtros.hasta);
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT r.*, p.empresa, p.nombre_contacto, p.email_contacto
     FROM reuniones r
     LEFT JOIN prospectos p ON p.id = r.prospecto_id
     ${where}
     ORDER BY r.fecha_hora ASC`,
    valores
  );
  return result.rows;
}

export async function actualizarReunionService(id: string, input: ActualizarReunionInput & { hora_fin?: string }) {
  // Normalizar hora_fin: string vacío → null explícito
  const horaFinValida = input.hora_fin && /^\d{2}:\d{2}$/.test(input.hora_fin) ? input.hora_fin : null;
  if ("hora_fin" in input) {
    (input as any).hora_fin = horaFinValida;
  }

  // Recalcular duración si hay hora_fin válida
  if (horaFinValida) {
    const fechaRow = await pool.query(`SELECT fecha_hora FROM reuniones WHERE id = $1`, [id]);
    if (fechaRow.rows[0]) {
      const fechaBase = input.fecha_hora ? new Date(input.fecha_hora) : new Date(fechaRow.rows[0].fecha_hora);
      const [hFin, mFin] = horaFinValida.split(":").map(Number);
      const fin = new Date(fechaBase);
      fin.setHours(hFin, mFin, 0, 0);
      const diff = Math.round((fin.getTime() - fechaBase.getTime()) / 60000);
      (input as any).duracion_minutos = diff > 0 && diff < 720 ? diff : null;
    }
  } else if ("hora_fin" in input) {
    (input as any).duracion_minutos = null;
  }

  const CAMPOS_PERMITIDOS = ["titulo", "fecha_hora", "hora_fin", "duracion_minutos", "modalidad", "enlace", "estado", "notas"];
  const campos = Object.keys(input).filter(k => CAMPOS_PERMITIDOS.includes(k) && (input as any)[k] !== undefined);
  if (campos.length === 0) throw new Error("No hay campos para actualizar");

  const sets = campos.map((campo, i) => `${campo} = $${i + 2}`).join(", ");
  const valores = campos.map(campo => (input as any)[campo]);

  const result = await pool.query(
    `UPDATE reuniones SET ${sets} WHERE id = $1 RETURNING *`,
    [id, ...valores]
  );
  if (result.rowCount === 0) throw new Error("Reunión no encontrada");
  logger.info({ id }, "Reunión actualizada");

  const reunion = result.rows[0];
  if (input.estado) {
    void registrarActividad({
      prospecto_id: reunion.prospecto_id,
      tipo:        "reunion",
      titulo:      `Reunión ${input.estado}: ${reunion.titulo}`,
      metadata:    { estado: input.estado },
    });
  }

  return reunion;
}

export async function marcarEmailEnviadoService(id: string) {
  const result = await pool.query(
    `UPDATE reuniones SET email_enviado = true WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
}

export async function resumenReunionesService() {
  const result = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE estado = 'programada') as programadas,
      COUNT(*) FILTER (WHERE estado = 'realizada') as realizadas,
      COUNT(*) FILTER (WHERE estado = 'cancelada') as canceladas,
      COUNT(*) FILTER (WHERE estado = 'descartado') as descartadas,
      COUNT(*) FILTER (WHERE fecha_hora::date = CURRENT_DATE) as hoy,
      COUNT(*) FILTER (WHERE fecha_hora >= date_trunc('month', CURRENT_DATE)) as este_mes,
      modalidad,
      COUNT(*) as por_modalidad
    FROM reuniones
    GROUP BY modalidad
    ORDER BY total DESC
  `);
  return result.rows;
}
export async function estadisticasReunionesPorPeriodoService(
  fecha_inicio?: string,
  fecha_fin?: string,
  granularidad: "dia" | "hora" | "mes" = "dia"
) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;

  if (fecha_inicio) { condiciones.push(`fecha_hora >= $${idx++}::timestamptz`); valores.push(fecha_inicio); }
  if (fecha_fin)    { condiciones.push(`fecha_hora <  $${idx++}::timestamptz`); valores.push(fecha_fin); }

  const where   = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "WHERE fecha_hora >= CURRENT_DATE - INTERVAL '90 days'";
  const groupBy = granularidad === "hora"
    ? "EXTRACT(HOUR FROM fecha_hora)::int"
    : granularidad === "mes"
    ? "EXTRACT(MONTH FROM fecha_hora)::int"
    : "fecha_hora::date";

  const result = await pool.query(`
    SELECT
      ${groupBy}                                                      AS periodo,
      COUNT(*)::int                                                   AS total,
      COUNT(*) FILTER (WHERE estado = 'realizada')::int              AS realizadas,
      COUNT(*) FILTER (WHERE estado = 'programada')::int             AS programadas,
      COUNT(*) FILTER (WHERE estado = 'cancelada')::int              AS canceladas
    FROM reuniones
    ${where}
    GROUP BY ${groupBy}
    ORDER BY ${groupBy} ASC
  `, valores);

  return result.rows;
}

export async function kpisReunionesFiltradoService(filters?: { fecha_inicio?: string; fecha_fin?: string }) {
  const condiciones: string[] = [];
  const valores: any[] = [];
  let idx = 1;

  if (filters?.fecha_inicio) { condiciones.push(`fecha_hora >= $${idx++}`); valores.push(filters.fecha_inicio); }
  if (filters?.fecha_fin)    { condiciones.push(`fecha_hora <  $${idx++}`); valores.push(filters.fecha_fin); }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

  const [kpisResult, modalidadResult] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::int                                                AS total,
        COUNT(*) FILTER (WHERE estado = 'programada')::int          AS programadas,
        COUNT(*) FILTER (WHERE estado = 'realizada')::int           AS realizadas,
        COUNT(*) FILTER (WHERE estado = 'cancelada')::int           AS canceladas,
        COUNT(*) FILTER (WHERE estado = 'reprogramada')::int        AS reprogramadas
      FROM reuniones ${where}
    `, valores),
    pool.query(`
      SELECT modalidad, COUNT(*)::int AS total
      FROM reuniones ${where}
      GROUP BY modalidad ORDER BY total DESC
    `, valores),
  ]);

  return {
    kpis:      kpisResult.rows[0] ?? { total: 0, programadas: 0, realizadas: 0, canceladas: 0, reprogramadas: 0 },
    modalidad: modalidadResult.rows,
  };
}

export async function eliminarReunionesMasivoService(ids: string[]) {
  if (!ids.length) return 0;

  const result = await pool.query(
    `DELETE FROM reuniones WHERE id = ANY($1::uuid[])`,
    [ids]
  );

  logger.info({ eliminados: result.rowCount }, "reuniones eliminados masivamente");
  return result.rowCount;
}