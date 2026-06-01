/** src/server/routes/crm/propuestas.ts */

import { Router } from "express";
import { validate } from "../../middleware/validate";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { crearPropuestaSchema, actualizarPropuestaSchema } from "../../schemas/propuesta.schema";
import {
  crearPropuestaService,
  obtenerPropuestasService,
  actualizarPropuestaService,
  eliminarPropuestaService,
  resumenEstadosPropuestasService,
} from "../../services/propuesta.service";
import { invalidarCacheCRM } from "../../config/cache";

export const propuestasRouter = Router();

propuestasRouter.use(authMiddleware);

// GET /api/crm/propuestas/kanban — propuestas agrupadas por estado con info de empresa
propuestasRouter.get("/kanban", async (_req, res) => {
  try {
    const { pool } = await import("../../config/database");
    const result = await pool.query(`
      SELECT
        pr.id, pr.servicio, pr.descripcion, pr.estado,
        pr.monto_propuesto, pr.monto_cerrado, pr.moneda, pr.tipo_cambio,
        pr.fecha_propuesta, pr.fecha_negociacion, pr.fecha_cierre,
        pr.notas, pr.motivo_cierre_perdido,
        p.id AS prospecto_id, p.empresa, p.nombre_contacto, p.telefono, p.ciudad
      FROM propuestas pr
      JOIN prospectos p ON p.id = pr.prospecto_id
      WHERE p.eliminado = false
      ORDER BY pr.fecha_propuesta DESC
    `);

    const porEstado: Record<string, any[]> = {
      enviada: [], en_negociacion: [], cerrada_ganada: [], cerrada_perdida: [], vencida: []
    };
    for (const row of result.rows) {
      const key = row.estado in porEstado ? row.estado : "vencida";
      porEstado[key].push(row);
    }

    const monto = (r: any) => Number(r.moneda === "USD"
      ? (r.monto_cerrado ?? r.monto_propuesto) * r.tipo_cambio
      : (r.monto_cerrado ?? r.monto_propuesto));

    const stats = {
      total_activo: result.rows
        .filter((r: any) => ["enviada","en_negociacion"].includes(r.estado))
        .reduce((s: number, r: any) => s + Number(r.moneda === "USD" ? r.monto_propuesto * r.tipo_cambio : r.monto_propuesto), 0),
      total_ganado: result.rows
        .filter((r: any) => r.estado === "cerrada_ganada")
        .reduce((s: number, r: any) => s + monto(r), 0),
    };

    res.json({ ok: true, data: { porEstado, stats } });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/propuestas/paquetes-web
propuestasRouter.get("/paquetes-web", async (_req, res) => {
  try {
    const { pool } = await import("../../config/database");
    const result = await pool.query(`
      SELECT
        descripcion                                                        AS paquete,
        COUNT(*)::int                                                      AS cotizados,
        COUNT(CASE WHEN estado = 'cerrada_ganada' THEN 1 END)::int        AS vendidos,
        ROUND(AVG(monto_propuesto))::int                                  AS precio_promedio
      FROM propuestas
      WHERE servicio = 'desarrollo_web'
        AND descripcion IN (
          'Base — Web Express','Gold — Web Pro','Red — Web Advanced',
          'Blue — Web Expert','Platinum — Elite'
        )
      GROUP BY descripcion
      ORDER BY cotizados DESC
    `);
    res.json({ ok: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/propuestas/analisis-pipeline
propuestasRouter.get("/analisis-pipeline", async (_req, res) => {
  try {
    const { pool } = await import("../../config/database");

    const [rEmpresa, rServicio, rMes] = await Promise.all([
      pool.query(`
        SELECT
          p.id                                                                              AS prospecto_id,
          p.empresa,
          p.telefono,
          p.ciudad,
          COUNT(pr.id)::int                                                                AS total,
          COUNT(pr.id) FILTER (WHERE pr.estado = 'enviada')::int                          AS enviadas,
          COUNT(pr.id) FILTER (WHERE pr.estado = 'en_negociacion')::int                   AS en_negociacion,
          COUNT(pr.id) FILTER (WHERE pr.estado = 'cerrada_ganada')::int                   AS ganadas,
          COUNT(pr.id) FILTER (WHERE pr.estado IN ('cerrada_perdida','vencida'))::int      AS perdidas,
          COALESCE(SUM(CASE WHEN pr.estado IN ('enviada','en_negociacion')
            THEN (CASE WHEN pr.moneda='USD' THEN pr.monto_propuesto*pr.tipo_cambio ELSE pr.monto_propuesto END)
            ELSE 0 END), 0)::float                                                         AS monto_activo,
          COALESCE(SUM(CASE WHEN pr.estado = 'cerrada_ganada'
            THEN (CASE WHEN pr.moneda='USD'
              THEN COALESCE(pr.monto_cerrado, pr.monto_propuesto)*pr.tipo_cambio
              ELSE COALESCE(pr.monto_cerrado, pr.monto_propuesto) END)
            ELSE 0 END), 0)::float                                                         AS monto_ganado
        FROM prospectos p
        JOIN propuestas pr ON pr.prospecto_id = p.id
        WHERE p.eliminado = false
        GROUP BY p.id, p.empresa, p.telefono, p.ciudad
        ORDER BY COUNT(pr.id) DESC
        LIMIT 30
      `),
      pool.query(`
        SELECT
          pr.servicio,
          COUNT(*)::int                                                                    AS total,
          COUNT(*) FILTER (WHERE pr.estado = 'enviada')::int                              AS enviadas,
          COUNT(*) FILTER (WHERE pr.estado = 'en_negociacion')::int                       AS en_negociacion,
          COUNT(*) FILTER (WHERE pr.estado = 'cerrada_ganada')::int                       AS ganadas,
          COUNT(*) FILTER (WHERE pr.estado IN ('cerrada_perdida','vencida'))::int          AS perdidas,
          COALESCE(SUM(CASE WHEN pr.estado IN ('enviada','en_negociacion')
            THEN (CASE WHEN pr.moneda='USD' THEN pr.monto_propuesto*pr.tipo_cambio ELSE pr.monto_propuesto END)
            ELSE 0 END), 0)::float                                                         AS monto_activo,
          COALESCE(SUM(CASE WHEN pr.estado = 'cerrada_ganada'
            THEN (CASE WHEN pr.moneda='USD'
              THEN COALESCE(pr.monto_cerrado, pr.monto_propuesto)*pr.tipo_cambio
              ELSE COALESCE(pr.monto_cerrado, pr.monto_propuesto) END)
            ELSE 0 END), 0)::float                                                         AS monto_ganado
        FROM propuestas pr
        JOIN prospectos p ON p.id = pr.prospecto_id
        WHERE p.eliminado = false
        GROUP BY pr.servicio
        ORDER BY COUNT(*) DESC
      `),
      pool.query(`
        SELECT
          -- Total de propuestas activas en pipeline (enviada + en_negociacion)
          COUNT(*) FILTER (WHERE estado IN ('enviada','en_negociacion'))::int             AS propuestas_activas,
          -- Total de propuestas enviadas este anio (para contexto mensual)
          COUNT(*) FILTER (WHERE DATE_TRUNC('year', fecha_propuesta) = DATE_TRUNC('year', CURRENT_DATE))::int AS propuestas_anio,
          -- Cierres ganados totales
          COUNT(*) FILTER (WHERE estado = 'cerrada_ganada')::int                          AS cierres_total,
          -- Cierres ganados este anio
          COUNT(*) FILTER (WHERE estado = 'cerrada_ganada'
            AND DATE_TRUNC('year', COALESCE(fecha_cierre, fecha_propuesta)) = DATE_TRUNC('year', CURRENT_DATE))::int AS cierres_anio,
          -- Ingresos totales ganados
          COALESCE(SUM(CASE WHEN estado = 'cerrada_ganada'
            THEN (CASE WHEN moneda='USD'
              THEN COALESCE(monto_cerrado, monto_propuesto)*tipo_cambio
              ELSE COALESCE(monto_cerrado, monto_propuesto) END)
            ELSE 0 END), 0)::float                                                         AS ingresos_total,
          -- Valor activo en pipeline (propuestas sin cerrar/perder)
          COALESCE(SUM(CASE WHEN estado IN ('enviada','en_negociacion')
            THEN (CASE WHEN moneda='USD'
              THEN monto_propuesto*tipo_cambio
              ELSE monto_propuesto END)
            ELSE 0 END), 0)::float                                                         AS valor_activo,
          -- Total resueltas (ganadas + perdidas) para tasa de conversion
          COUNT(*) FILTER (WHERE estado IN ('cerrada_ganada','cerrada_perdida','vencida'))::int AS resueltas_total
        FROM propuestas
      `),
    ]);

    // Also fetch detail rows for empresa drill-down
    const rDetalle = await pool.query(`
      SELECT
        pr.id, pr.servicio, pr.estado, pr.fecha_propuesta,
        pr.monto_propuesto, pr.monto_cerrado, pr.moneda, pr.tipo_cambio,
        pr.motivo_cierre_perdido,
        p.id AS prospecto_id, p.empresa
      FROM propuestas pr
      JOIN prospectos p ON p.id = pr.prospecto_id
      WHERE p.eliminado = false
      ORDER BY pr.fecha_propuesta DESC
    `);

    const detalleMap: Record<string, any[]> = {};
    for (const r of rDetalle.rows) {
      if (!detalleMap[r.prospecto_id]) detalleMap[r.prospecto_id] = [];
      detalleMap[r.prospecto_id].push(r);
    }
    const detalleServicio: Record<string, any[]> = {};
    for (const r of rDetalle.rows) {
      if (!detalleServicio[r.servicio]) detalleServicio[r.servicio] = [];
      detalleServicio[r.servicio].push(r);
    }

    res.json({
      ok: true,
      data: {
        por_empresa:       rEmpresa.rows,
        por_servicio:      rServicio.rows,
        mes_actual:        rMes.rows[0] ?? { propuestas_mes: 0, cierres_mes: 0, ingresos_mes: 0, resueltas_mes: 0 },
        detalle_empresa:   detalleMap,
        detalle_servicio:  detalleServicio,
      },
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/propuestas/metas-pipeline
propuestasRouter.get("/metas-pipeline", async (req: any, res) => {
  try {
    const { pool } = await import("../../config/database");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS metas_pipeline (
        usuario_id     UUID PRIMARY KEY,
        propuestas_mes INT  NOT NULL DEFAULT 10,
        cierres_mes    INT  NOT NULL DEFAULT 3,
        ingresos_mes   INT  NOT NULL DEFAULT 15000,
        actualizado_en TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    const result = await pool.query(
      `SELECT propuestas_mes, cierres_mes, ingresos_mes FROM metas_pipeline WHERE usuario_id = $1`,
      [req.usuario.id]
    );
    const row = result.rows[0];
    res.json({ ok: true, data: { propuestas_mes: row?.propuestas_mes ?? 10, cierres_mes: row?.cierres_mes ?? 3, ingresos_mes: row?.ingresos_mes ?? 15000 } });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/propuestas/metas-pipeline
propuestasRouter.put("/metas-pipeline", async (req: any, res) => {
  try {
    const { pool } = await import("../../config/database");
    const { propuestas_mes, cierres_mes, ingresos_mes } = req.body;
    await pool.query(`
      INSERT INTO metas_pipeline (usuario_id, propuestas_mes, cierres_mes, ingresos_mes, actualizado_en)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (usuario_id)
      DO UPDATE SET propuestas_mes = $2, cierres_mes = $3, ingresos_mes = $4, actualizado_en = NOW()
    `, [req.usuario.id, propuestas_mes ?? 10, cierres_mes ?? 3, ingresos_mes ?? 15000]);
    res.json({ ok: true, data: { propuestas_mes: propuestas_mes ?? 10, cierres_mes: cierres_mes ?? 3, ingresos_mes: ingresos_mes ?? 15000 } });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/propuestas/por-mes?anio=2026
propuestasRouter.get("/por-mes", async (req, res) => {
  try {
    const { pool } = await import("../../config/database");
    const anio = req.query.anio ? Number(req.query.anio) : new Date().getFullYear();
    const { rows } = await pool.query(`
      SELECT
        EXTRACT(MONTH FROM fecha_propuesta)::int          AS mes_num,
        COUNT(*)::int                                      AS total,
        COUNT(*) FILTER (WHERE estado = 'enviada')::int            AS enviadas,
        COUNT(*) FILTER (WHERE estado = 'en_negociacion')::int     AS en_negociacion,
        COUNT(*) FILTER (WHERE estado = 'cerrada_ganada')::int     AS ganadas,
        COUNT(*) FILTER (WHERE estado IN ('cerrada_perdida','vencida'))::int AS perdidas
      FROM propuestas
      WHERE EXTRACT(YEAR FROM fecha_propuesta) = $1
      GROUP BY mes_num
      ORDER BY mes_num ASC
    `, [anio]);
    res.json({ ok: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/propuestas/resumen-estados
propuestasRouter.get("/resumen-estados", async (req, res) => {
  try {
    const { periodo, mes, anio, fecha } = req.query as Record<string, string>;
    const data = await resumenEstadosPropuestasService(
      periodo,
      mes  ? Number(mes)  : undefined,
      anio ? Number(anio) : undefined,
      fecha
    );
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// GET /api/crm/propuestas?prospecto_id=xxx
propuestasRouter.get("/", async (req, res) => {
  try {
    const { prospecto_id } = req.query;
    if (!prospecto_id || typeof prospecto_id !== "string") {
      return res.status(400).json({ ok: false, message: "prospecto_id requerido" });
    }
    const data = await obtenerPropuestasService(prospecto_id);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// POST /api/crm/propuestas
propuestasRouter.post("/", validate(crearPropuestaSchema), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await crearPropuestaService(req.body, usuario.id);
    void invalidarCacheCRM();
    res.status(201).json({ ok: true, data });
  } catch (err: any) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

// PUT /api/crm/propuestas/:id
propuestasRouter.put("/:id", validate(actualizarPropuestaSchema), async (req, res) => {
  try {
    const usuario = (req as any).usuario;
    const data = await actualizarPropuestaService(req.params.id, req.body, usuario.id);
    void invalidarCacheCRM();
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    const status = err.message === "Propuesta no encontrada" ? 404 : 500;
    res.status(status).json({ ok: false, message: err.message });
  }
});

// DELETE /api/crm/propuestas/:id
propuestasRouter.delete("/:id", async (req, res) => {
  try {
    const data = await eliminarPropuestaService(req.params.id);
    res.status(200).json({ ok: true, data });
  } catch (err: any) {
    const status = err.message === "Propuesta no encontrada" ? 404 : 500;
    res.status(status).json({ ok: false, message: err.message });
  }
});
