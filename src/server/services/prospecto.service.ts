/**src/server/services/prospecto.service.ts */

import { pool } from "../config/database";
import { registrarActividad } from "./activityLog.service";
import { logger } from "../config/logger";
import type { CrearProspectoInput, ActualizarProspectoInput } from "../schemas/prospecto.schema";

// ── Sistema de scoring de prioridad ──────────────────────────────────────────

function calcularTamanoDesdeNro(n: number): string {
  if (n <= 10)  return "1_10";
  if (n <= 50)  return "11_50";
  if (n <= 200) return "51_200";
  if (n <= 500) return "201_500";
  return "mas_500";
}

const SECTOR_SCORE: Record<string, number> = {
  construccion: 15, inmobiliaria: 15, manufactura_industria: 15,
  agroindustria: 15, mineria_energia: 15,
  salud: 12, servicios_profesionales: 12, comercio_mayorista: 12, arquitectura_ingenieria: 12,
  tecnologia: 8, transporte_logistica: 8, seguridad: 8, educacion: 8,
  comercio_retail: 5, gastronomia_turismo: 5, otro: 5,
};

const PERFIL_SCORE: Record<string, number> = {
  construccion: 6, clinica_hospital: 6, importadora_exportadora: 6,
  fabrica_manufactura: 6, drogueria_farmaceutica: 6, estudio_juridico: 6,
  distribuidora_mayorista: 3, hotel_hospedaje: 3, consultoria_empresarial: 3,
  almacen_logistica: 3, agencia_aduanas: 3, inmobiliaria: 3, ingenieria_consultoria: 3,
  arquitectura: 0, laboratorio: 0, contabilidad_auditoria: 0, instituto_academia: 0,
  empresa_transportes: 0, seguridad_cctv: 0, taller_industrial: 0,
  ferreteria_materiales: 0, agencia_viajes: 0, agroindustria: 0,
  consultorio_medico: 0, colegio: 0, tecnologia_ti: 0,
  farmacia_botica: -4, tienda_retail: -4, restaurante: -4,
  ong_asociacion: -4, centro_capacitacion: -4,
};

const TAMANO_FALLBACK_SCORE: Record<string, number> = {
  "1_10": 2, "11_50": 7, "51_200": 9, "201_500": 15, "mas_500": 15,
};

function scoreWorkers(n: number): number {
  if (n === 1)  return -5;
  if (n <= 3)   return -3;
  if (n <= 5)   return 0;
  if (n <= 10)  return 2;
  if (n <= 15)  return 4;
  if (n <= 25)  return 5;
  if (n <= 50)  return 7;
  if (n <= 100) return 9;
  if (n <= 200) return 12;
  return 15;
}

function scoreWeb(webActiva: boolean | undefined, estadoWeb: string | undefined | null): number {
  if (!webActiva) return 8;
  const map: Record<string, number> = {
    vencida: 5, sin_informacion: 4, por_actualizar: 3, en_mantenimiento: 1, actualizada: -10,
  };
  return estadoWeb ? (map[estadoWeb] ?? 0) : 0;
}

function scoreRedes(redes: string[] | undefined | null): number {
  if (!redes || redes.length === 0) return 0;
  const activas = redes.filter(r => r !== "ninguna");
  if (activas.length === 0) return 0;
  let pts = activas.length === 1 ? 1 : 2;
  if (activas.includes("linkedin")) pts += 2;
  return Math.min(pts, 4);
}

function calcularPrioridadPorScore(params: {
  sector?: string | null;
  perfil_empresa?: string | null;
  cantidad_trabajadores?: number | null;
  tamano_empresa?: string | null;
  web_activa?: boolean | null;
  estado_web?: string | null;
  redes_sociales?: string[] | null;
}): "alta" | "media" | "baja" {
  let total = 0;
  total += SECTOR_SCORE[params.sector ?? ""] ?? 0;
  total += PERFIL_SCORE[params.perfil_empresa ?? ""] ?? 0;
  if (params.cantidad_trabajadores != null) {
    total += scoreWorkers(params.cantidad_trabajadores);
  } else if (params.tamano_empresa) {
    total += TAMANO_FALLBACK_SCORE[params.tamano_empresa] ?? 0;
  }
  total += scoreWeb(params.web_activa ?? undefined, params.estado_web);
  total += scoreRedes(params.redes_sociales);
  return total >= 25 ? "alta" : total >= 12 ? "media" : "baja";
}

// ── Crear prospecto ──────────────────────────────────────────────────────────

export async function crearProspectoService(input: CrearProspectoInput, usuarioId: string) {
  const webActiva = input.web_activa === true
    ? true
    : String(input.web_activa).toLowerCase() === "true"
      ? true
      : input.web_activa === false || String(input.web_activa).toLowerCase() === "false"
        ? false
        : undefined;

  const tamano = input.cantidad_trabajadores
    ? calcularTamanoDesdeNro(input.cantidad_trabajadores)
    : input.tamano_empresa;

  const prioridad = calcularPrioridadPorScore({
    sector:               input.sector,
    perfil_empresa:       input.perfil_empresa,
    cantidad_trabajadores: input.cantidad_trabajadores,
    tamano_empresa:       tamano,
    web_activa:           webActiva,
    estado_web:           input.estado_web,
    redes_sociales:       input.redes_sociales as string[] | undefined,
  });

  const result = await pool.query(
    `INSERT INTO prospectos (
      empresa, actividad_economica, sector, perfil_empresa, cantidad_trabajadores, redes_sociales,
      tamano_empresa, pagina_web, web_activa, proveedor_web, estado_web,
      nombre_contacto, cargo, telefono, email_contacto,
      ciudad, region, pais,
      prioridad, fuente, estado_lead, clasificacion, estado_venta,
      notas, creado_por
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
    ) RETURNING *`,
    [
      input.empresa, input.actividad_economica ?? null, input.sector ?? null,
      input.perfil_empresa ?? null, input.cantidad_trabajadores ?? null,
      input.redes_sociales ?? null,
      tamano ?? null, input.pagina_web ?? null,
      webActiva ?? null, input.proveedor_web ?? null, input.estado_web ?? null,
      input.nombre_contacto ?? null, input.cargo ?? null,
      input.telefono ?? null, input.email_contacto ?? null,
      input.ciudad ?? null, input.region ?? null,
      input.pais ?? "Perú", prioridad, input.fuente ?? null,
      input.estado_lead ?? "por_gestionar", input.clasificacion ?? "por_gestionar",
      input.estado_venta ?? "no", input.notas ?? null, usuarioId,
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

  if (filtros.estado_lead === "contestada") {
    condiciones.push(`EXISTS (SELECT 1 FROM llamadas ll2 WHERE ll2.prospecto_id = p.id AND ll2.contestada = true)`);
  } else if (filtros.estado_lead === "no_contesta") {
    // Solo leads con llamadas reales donde no contestaron (excluye los que nunca se llamaron)
    condiciones.push(`p.estado_lead = 'no_contesta' AND EXISTS (SELECT 1 FROM llamadas ll2 WHERE ll2.prospecto_id = p.id)`);
  } else if (filtros.estado_lead === "por_gestionar") {
    // Leads sin ninguna actividad: estado_lead::text = 'por_gestionar' (post-migration)
    // O estado_lead = 'no_contesta' sin ninguna llamada (pre-migration)
    condiciones.push(`(p.estado_lead::text = 'por_gestionar' OR (p.estado_lead = 'no_contesta' AND NOT EXISTS (SELECT 1 FROM llamadas ll2 WHERE ll2.prospecto_id = p.id)))`);
  } else if (filtros.estado_lead === "nuevo") {
    condiciones.push(`p.estado_lead::text = 'nuevo'`);
  } else if (filtros.estado_lead) {
    condiciones.push(`p.estado_lead::text = $${idx++}`);
    valores.push(filtros.estado_lead);
  }
  if (filtros.clasificacion) {
    condiciones.push(`p.clasificacion = $${idx++}`);
    valores.push(filtros.clasificacion);
  }
  if (filtros.prioridad) {
    condiciones.push(`p.prioridad = $${idx++}`);
    valores.push(filtros.prioridad);
  }
  if (filtros.fuente) {
    condiciones.push(`p.fuente = $${idx++}`);
    valores.push(filtros.fuente);
  }
  if (filtros.busqueda) {
    condiciones.push(`(
      p.empresa ILIKE $${idx} OR
      p.nombre_contacto ILIKE $${idx} OR
      p.telefono ILIKE $${idx} OR
      p.email_contacto ILIKE $${idx}
    )`);
    valores.push(`%${filtros.busqueda}%`);
    idx++;
  }

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
  const limite = filtros.limite ?? 50;
  const offset = ((filtros.pagina ?? 1) - 1) * limite;

  const [data, total] = await Promise.all([
    pool.query(
      `SELECT p.*,
        json_agg(DISTINCT l.*) FILTER (WHERE l.id IS NOT NULL) AS llamadas,
        json_agg(DISTINCT r.*) FILTER (WHERE r.id IS NOT NULL) AS reuniones,
        json_agg(DISTINCT b.*) FILTER (WHERE b.id IS NOT NULL) AS brochures,
        json_agg(DISTINCT pr.*) FILTER (WHERE pr.id IS NOT NULL) AS propuestas,
        json_agg(DISTINCT c.*) FILTER (WHERE c.id IS NOT NULL) AS contactos
       FROM prospectos p
       LEFT JOIN llamadas l ON l.prospecto_id = p.id
       LEFT JOIN reuniones r ON r.prospecto_id = p.id
       LEFT JOIN brochures b ON b.prospecto_id = p.id
       LEFT JOIN propuestas pr ON pr.prospecto_id = p.id
       LEFT JOIN contactos c ON c.prospecto_id = p.id
       ${where}
       GROUP BY p.id
       ORDER BY p.creado_en DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...valores, limite, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM prospectos p ${where}`,
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
      json_agg(DISTINCT pr.*) FILTER (WHERE pr.id IS NOT NULL) AS propuestas,
      json_agg(DISTINCT c.*) FILTER (WHERE c.id IS NOT NULL) AS contactos
     FROM prospectos p
     LEFT JOIN llamadas l ON l.prospecto_id = p.id
     LEFT JOIN reuniones r ON r.prospecto_id = p.id
     LEFT JOIN brochures b ON b.prospecto_id = p.id
     LEFT JOIN propuestas pr ON pr.prospecto_id = p.id
     LEFT JOIN contactos c ON c.prospecto_id = p.id
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function upsertContactoService(
  prospectoId: string,
  contacto: { id?: string; nombre: string; cargo?: string; telefono?: string; email?: string }
) {
  if (contacto.id) {
    const result = await pool.query(
      `UPDATE contactos SET nombre=$1, cargo=$2, telefono=$3, email=$4
       WHERE id=$5 AND prospecto_id=$6 RETURNING *`,
      [contacto.nombre, contacto.cargo ?? null, contacto.telefono ?? null, contacto.email ?? null, contacto.id, prospectoId]
    );
    return result.rows[0];
  } else {
    const result = await pool.query(
      `INSERT INTO contactos (prospecto_id, nombre, cargo, telefono, email)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [prospectoId, contacto.nombre, contacto.cargo ?? null, contacto.telefono ?? null, contacto.email ?? null]
    );
    return result.rows[0];
  }
}

export async function eliminarContactoService(id: string, prospectoId: string) {
  await pool.query(`DELETE FROM contactos WHERE id=$1 AND prospecto_id=$2`, [id, prospectoId]);
}

export async function actualizarProspectoService(id: string, input: ActualizarProspectoInput) {
  const data: Record<string, any> = { ...input };

  // Auto-calcular tamano_empresa si viene cantidad_trabajadores
  if (data.cantidad_trabajadores !== undefined && data.cantidad_trabajadores !== null) {
    data.tamano_empresa = calcularTamanoDesdeNro(data.cantidad_trabajadores);
  }

  // Recalcular prioridad si cambia algún factor del scoring
  const factoresScoring = ["sector","perfil_empresa","cantidad_trabajadores","tamano_empresa","web_activa","estado_web","redes_sociales"];
  if (factoresScoring.some(f => data[f] !== undefined)) {
    const actual = await pool.query(
      `SELECT sector, perfil_empresa, cantidad_trabajadores, tamano_empresa, web_activa, estado_web, redes_sociales FROM prospectos WHERE id=$1`, [id]
    );
    if (actual.rows[0]) {
      const row = actual.rows[0];
      data.prioridad = calcularPrioridadPorScore({
        sector:               data.sector               ?? row.sector,
        perfil_empresa:       data.perfil_empresa       ?? row.perfil_empresa,
        cantidad_trabajadores: data.cantidad_trabajadores ?? row.cantidad_trabajadores,
        tamano_empresa:       data.tamano_empresa       ?? row.tamano_empresa,
        web_activa:           data.web_activa           ?? row.web_activa,
        estado_web:           data.estado_web           ?? row.estado_web,
        redes_sociales:       data.redes_sociales       ?? row.redes_sociales,
      });
    }
  }

  const campos = Object.keys(data).filter(k => data[k] !== undefined);
  if (campos.length === 0) throw new Error("No hay campos para actualizar");

  const sets    = campos.map((campo, i) => `${campo} = $${i + 2}`).join(", ");
  const valores = campos.map(campo => data[campo]);

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

export async function getPipelineService() {
  // Pre-pipeline columns derived from estado_lead (aligned with ProspectosPage).
  // Pipeline columns (propuesta_enviada → perdido) derived from propuestas.estado.
  const result = await pool.query(`
    SELECT
      p.id, p.empresa, p.nombre_contacto, p.telefono, p.email_contacto,
      p.estado_lead, p.prioridad, p.etapa_pipeline,
      p.ciudad, p.actividad_economica, p.sector, p.perfil_empresa, p.notas,
      p.creado_en, p.actualizado_en,
      -- Computed pipeline column
      CASE
        WHEN EXISTS (
          SELECT 1 FROM propuestas pr WHERE pr.prospecto_id = p.id AND pr.estado = 'cerrada_ganada'
        ) THEN 'cerrado_ganado'
        WHEN EXISTS (
          SELECT 1 FROM propuestas pr WHERE pr.prospecto_id = p.id AND pr.estado = 'en_negociacion'
        ) THEN 'negociacion'
        WHEN EXISTS (
          SELECT 1 FROM propuestas pr WHERE pr.prospecto_id = p.id AND pr.estado = 'enviada'
        ) THEN 'propuesta_enviada'
        WHEN EXISTS (
          SELECT 1 FROM propuestas pr WHERE pr.prospecto_id = p.id
        ) AND NOT EXISTS (
          SELECT 1 FROM propuestas pr WHERE pr.prospecto_id = p.id
            AND pr.estado IN ('enviada','en_negociacion','cerrada_ganada')
        ) THEN 'perdido'
        WHEN p.estado_lead = 'interesado'              THEN 'interesado'
        WHEN p.estado_lead::text = 'solicita_informacion' THEN 'solicita_informacion'
        WHEN p.estado_lead = 'volver_a_llamar'         THEN 'volver_a_llamar'
        ELSE NULL
      END AS columna,
      (SELECT pr.servicio FROM propuestas pr
       WHERE pr.prospecto_id = p.id
         AND pr.estado NOT IN ('cerrada_perdida','vencida')
       ORDER BY pr.creado_en DESC LIMIT 1) AS servicio_propuesta,
      COALESCE((
        SELECT json_agg(json_build_object(
          'id',       pr.id,
          'servicio', pr.servicio,
          'monto',    ROUND((CASE WHEN pr.moneda='USD'
                        THEN COALESCE(pr.monto_cerrado, pr.monto_propuesto) * COALESCE(pr.tipo_cambio,1)
                        ELSE COALESCE(pr.monto_cerrado, pr.monto_propuesto) END)::numeric, 0),
          'moneda',   pr.moneda,
          'estado',   pr.estado
        ) ORDER BY pr.creado_en DESC)
        FROM propuestas pr
        WHERE pr.prospecto_id = p.id
      ), '[]'::json) AS propuestas_list,
      COALESCE((
        SELECT SUM(CASE WHEN pr.moneda='USD'
          THEN pr.monto_propuesto * COALESCE(pr.tipo_cambio,1)
          ELSE pr.monto_propuesto END)
        FROM propuestas pr
        WHERE pr.prospecto_id = p.id
          AND pr.estado NOT IN ('cerrada_perdida','vencida')
      ), 0)::float AS valor_pipeline,
      COALESCE((
        SELECT SUM(pr.monto_propuesto)
        FROM propuestas pr
        WHERE pr.prospecto_id = p.id AND pr.moneda='PEN'
          AND pr.estado NOT IN ('cerrada_perdida','vencida')
      ), 0)::float AS valor_pipeline_pen,
      COALESCE((
        SELECT SUM(pr.monto_propuesto)
        FROM propuestas pr
        WHERE pr.prospecto_id = p.id AND pr.moneda='USD'
          AND pr.estado NOT IN ('cerrada_perdida','vencida')
      ), 0)::float AS valor_pipeline_usd
    FROM prospectos p
    WHERE p.eliminado = false
    ORDER BY p.creado_en DESC
  `);

  const columnas = ["volver_a_llamar","solicita_informacion","interesado","propuesta_enviada","negociacion","cerrado_ganado","perdido"];
  const pipeline: Record<string, { prospectos: any[]; total: number; valor: number; valor_pen: number; valor_usd: number }> = {};
  for (const c of columnas) {
    pipeline[c] = { prospectos: [], total: 0, valor: 0, valor_pen: 0, valor_usd: 0 };
  }
  for (const row of result.rows) {
    const col = row.columna;
    if (!col || !pipeline[col]) continue; // leads without a pipeline column are not shown
    pipeline[col].prospectos.push(row);
    pipeline[col].total++;
    pipeline[col].valor     += Number(row.valor_pipeline     ?? 0);
    pipeline[col].valor_pen += Number(row.valor_pipeline_pen ?? 0);
    pipeline[col].valor_usd += Number(row.valor_pipeline_usd ?? 0);
  }

  // Get total lost value from proposals (cerrada_perdida + vencida)
  const perdidoResult = await pool.query(`
    SELECT
      COALESCE(SUM(
        CASE WHEN moneda='USD'
          THEN monto_propuesto * COALESCE(tipo_cambio,1)
          ELSE monto_propuesto END
      ),0)::float AS valor_perdido
    FROM propuestas
    WHERE estado IN ('cerrada_perdida','vencida')
  `);
  const valorPerdido = Number(perdidoResult.rows[0]?.valor_perdido ?? 0);

  return { pipeline, valorPerdido };
}

export async function actualizarEtapaPipelineService(id: string, etapa: string, usuarioId?: string) {
  // Leer etapa anterior para saber si venimos de un estado finalizado
  const prev = await pool.query(
    `SELECT etapa_pipeline FROM prospectos WHERE id = $1`,
    [id]
  );
  const etapaAnterior = prev.rows[0]?.etapa_pipeline ?? "";

  // Definir estado_venta y clasificacion según la nueva etapa
  const ESTADO_VENTA_MAP: Record<string, string> = {
    nuevo:             "no",
    contactado:        "no",
    interesado:        "en_proceso",
    propuesta_enviada: "en_proceso",
    negociacion:       "en_proceso",
    cerrado_ganado:    "si",
    perdido:           "no",
  };
  const CLASIFICACION_MAP: Record<string, string> = {
    nuevo:             "por_gestionar",
    contactado:        "por_gestionar",
    interesado:        "gestionado",
    propuesta_enviada: "gestionado",
    negociacion:       "gestionado",
    cerrado_ganado:    "cerrado",
    perdido:           "por_gestionar",
  };

  const sets: string[] = [
    "etapa_pipeline = $2",
    "actualizado_en = now()",
    `estado_venta = '${ESTADO_VENTA_MAP[etapa] ?? "en_proceso"}'`,
    `clasificacion = '${CLASIFICACION_MAP[etapa] ?? "activo"}'`,
  ];
  const vals: any[] = [id, etapa];

  if (etapa === "cerrado_ganado") {
    sets.push("fecha_cierre = CURRENT_DATE");
  } else if (["cerrado_ganado", "perdido"].includes(etapaAnterior)) {
    // Revertir: limpiar fecha_cierre si venimos de un estado finalizado
    sets.push("fecha_cierre = NULL");
  }

  const result = await pool.query(
    `UPDATE prospectos SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
    vals
  );
  if (result.rowCount === 0) throw new Error("Prospecto no encontrado");

  // ── Sincronizar propuesta: si venimos de cerrado/perdido, reabrir la última ──
  const PROPUESTA_MAP: Record<string, string> = {
    propuesta_enviada: "enviada",
    negociacion:       "en_negociacion",
    cerrado_ganado:    "cerrada_ganada",
    perdido:           "cerrada_perdida",
  };
  const nuevoPropuestaEstado = PROPUESTA_MAP[etapa];
  if (nuevoPropuestaEstado) {
    const propuestaQuery = ["cerrado_ganado", "perdido"].includes(etapaAnterior)
      ? `SELECT id, monto_cerrado, monto_propuesto, moneda, tipo_cambio, servicio, descripcion
         FROM propuestas WHERE prospecto_id = $1
         ORDER BY fecha_propuesta DESC LIMIT 1`
      : `SELECT id, monto_cerrado, monto_propuesto, moneda, tipo_cambio, servicio, descripcion
         FROM propuestas WHERE prospecto_id = $1
           AND estado NOT IN ('cerrada_ganada', 'cerrada_perdida', 'vencida')
         ORDER BY fecha_propuesta DESC LIMIT 1`;

    const propRow = await pool.query(propuestaQuery, [id]);
    const propuesta = propRow.rows[0];

    if (propuesta) {
      await pool.query(
        `UPDATE propuestas SET estado = $2 WHERE id = $1`,
        [propuesta.id, nuevoPropuestaEstado]
      );

      // Auto-crear ingreso si se cierra como ganada y no existe uno previo
      if (nuevoPropuestaEstado === "cerrada_ganada" && usuarioId) {
        const ingresoExiste = await pool.query(
          `SELECT id FROM ingresos WHERE propuesta_id = $1`, [propuesta.id]
        );
        if (ingresoExiste.rowCount === 0) {
          const monto = propuesta.monto_cerrado ?? propuesta.monto_propuesto;
          if (monto > 0) {
            const empresa = result.rows[0]?.empresa ?? "";
            await pool.query(
              `INSERT INTO ingresos
                 (prospecto_id, propuesta_id, empresa, descripcion, tipo_servicio,
                  monto_total, adelanto, moneda, tipo_cambio, estado, fecha, notas, creado_por)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
              [
                id, propuesta.id, empresa,
                propuesta.descripcion ?? propuesta.servicio ?? "Sin descripción",
                propuesta.servicio ?? "otro",
                monto, 0,
                propuesta.moneda ?? "PEN",
                propuesta.tipo_cambio ?? 1,
                "por_cobrar",
                result.rows[0]?.fecha_cierre ?? new Date().toISOString().slice(0, 10),
                `Generado automáticamente desde propuesta #${propuesta.id.slice(0, 8)}`,
                usuarioId,
              ]
            );
          }
        }
      }
    }
  }

  const ETAPA_LABEL: Record<string, string> = {
    nuevo:              "Nuevo lead",
    contactado:         "Lead contactado",
    interesado:         "Lead interesado",
    propuesta_enviada:  "Propuesta enviada",
    negociacion:        "En negociación",
    cerrado_ganado:     "¡Venta cerrada! 🎉",
    perdido:            "Lead perdido",
  };
  void registrarActividad({
    prospecto_id: id,
    tipo:        "pipeline",
    titulo:      ETAPA_LABEL[etapa] ?? `Movido a ${etapa}`,
    metadata:    { etapa },
  });

  return result.rows[0];
}

export async function resumenProspectosService(fechaDesde?: string, fechaHasta?: string) {
  const whereFecha = fechaDesde && fechaHasta
    ? `AND p.id IN (SELECT DISTINCT prospecto_id FROM llamadas WHERE fecha::date BETWEEN $1::date AND $2::date)`
    : fechaDesde
    ? `AND p.id IN (SELECT DISTINCT prospecto_id FROM llamadas WHERE fecha::date >= $1::date)`
    : "";
  const params = fechaDesde && fechaHasta ? [fechaDesde, fechaHasta] : fechaDesde ? [fechaDesde] : [];

  const [leads, llamadas, cobertura] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*)::int                                                             AS total,
        COUNT(*) FILTER (WHERE estado_lead::text = 'nuevo')::int                 AS nuevo,
        COUNT(*) FILTER (WHERE estado_lead::text = 'por_gestionar')::int         AS por_gestionar,
        COUNT(*) FILTER (WHERE estado_lead = 'interesado')::int                  AS interesado,
        COUNT(*) FILTER (WHERE estado_lead = 'no_contesta')::int                 AS no_contesta,
        COUNT(*) FILTER (WHERE estado_lead = 'volver_a_llamar')::int             AS volver_a_llamar,
        COUNT(*) FILTER (WHERE estado_lead::text = 'ocupado_en_reunion')::int    AS ocupado_en_reunion,
        COUNT(*) FILTER (WHERE estado_lead::text = 'prometio_llamar')::int       AS prometio_llamar,
        COUNT(*) FILTER (WHERE estado_lead = 'no_interesado')::int               AS no_interesado,
        COUNT(*) FILTER (WHERE estado_lead = 'buzon_de_voz')::int                AS buzon_de_voz,
        COUNT(*) FILTER (WHERE estado_lead = 'solicita_informacion')::int        AS solicita_informacion,
        COUNT(*) FILTER (WHERE estado_lead::text = 'fuera_de_servicio')::int     AS fuera_de_servicio,
        COUNT(*) FILTER (WHERE estado_lead::text = 'numero_equivocado')::int     AS numero_equivocado,
        COUNT(*) FILTER (WHERE estado_lead::text = 'baja_de_oficio')::int        AS baja_de_oficio,
        COUNT(*) FILTER (WHERE estado_lead::text = 'suspension_temporal')::int   AS suspension_temporal,
        COUNT(*) FILTER (WHERE estado_lead::text = 'no_habido')::int             AS no_habido,
        COUNT(*) FILTER (WHERE estado_lead::text = 'perdida')::int               AS perdida,
        COUNT(*) FILTER (WHERE estado_lead::text = 'venta_ganada')::int         AS venta_ganada,
        COUNT(*) FILTER (WHERE estado_lead::text IN (
          'interesado','no_interesado','volver_a_llamar','ocupado_en_reunion','prometio_llamar','ya_tiene_proveedor'
        ))::int  AS leads_contactados,
        COUNT(*) FILTER (WHERE estado_lead::text = 'ya_tiene_proveedor')::int    AS ya_tiene_proveedor
      FROM prospectos p
      WHERE 1=1 ${whereFecha}
    `, params),
    pool.query(`
      SELECT
        COUNT(*)::int                                          AS total_llamadas,
        COUNT(*) FILTER (WHERE contestada = true)::int        AS llamadas_contestadas,
        COUNT(*) FILTER (WHERE contestada = false)::int       AS llamadas_no_contestadas,
        COUNT(*) FILTER (WHERE resultado IS NULL)::int        AS sin_resultado,
        COUNT(*) FILTER (WHERE resultado = 'no_interesado')::int    AS resultado_no_interesado,
        COUNT(*) FILTER (WHERE resultado = 'interesado')::int       AS resultado_interesado,
        COUNT(*) FILTER (WHERE resultado = 'no_contesta')::int      AS resultado_no_contesta,
        COUNT(*) FILTER (WHERE resultado = 'volver_a_llamar')::int  AS resultado_volver_llamar,
        COUNT(*) FILTER (WHERE resultado::text = 'solicita_informacion')::int AS resultado_solicita_info,
        COUNT(*) FILTER (WHERE resultado::text = 'numero_equivocado')::int    AS resultado_num_equivocado,
        COUNT(*) FILTER (WHERE resultado::text = 'fuera_de_servicio')::int    AS resultado_fuera_servicio,
        COUNT(*) FILTER (WHERE resultado = 'buzon_de_voz')::int               AS resultado_buzon_voz,
        COUNT(*) FILTER (WHERE resultado = 'ya_tiene_proveedor')::int         AS resultado_tiene_proveedor
      FROM llamadas
    `),
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE EXISTS (
          SELECT 1 FROM llamadas l WHERE l.prospecto_id = p.id
        ))::int AS con_llamadas,
        COUNT(*) FILTER (WHERE NOT EXISTS (
          SELECT 1 FROM llamadas l WHERE l.prospecto_id = p.id
        ))::int AS sin_llamadas
      FROM prospectos p WHERE p.eliminado = false
    `),
  ]);

  const l = llamadas.rows[0];
  const c = cobertura.rows[0];
  return {
    ...leads.rows[0],
    // Actividad de llamadas
    total_llamadas:          l.total_llamadas,
    llamadas_contestadas:    l.llamadas_contestadas,
    llamadas_no_contestadas: l.llamadas_no_contestadas,
    contestadas:             l.llamadas_contestadas,
    // Desglose por resultado
    llamadas_sin_resultado:       l.sin_resultado,
    llamadas_no_interesado:       l.resultado_no_interesado,
    llamadas_interesado:          l.resultado_interesado,
    llamadas_no_contesta:         l.resultado_no_contesta,
    llamadas_volver_llamar:       l.resultado_volver_llamar,
    llamadas_solicita_info:       l.resultado_solicita_info,
    llamadas_num_equivocado:      l.resultado_num_equivocado,
    llamadas_fuera_servicio:      l.resultado_fuera_servicio,
    llamadas_buzon_voz:           l.resultado_buzon_voz,
    llamadas_tiene_proveedor:     l.resultado_tiene_proveedor,
    // Cobertura de prospección
    prospectos_con_llamadas:  c.con_llamadas,
    prospectos_sin_llamadas:  c.sin_llamadas,
  };
}

export async function motivosPerdidaService() {
  const result = await pool.query(`
    SELECT motivo_perdida, COUNT(*)::int AS total
    FROM prospectos
    WHERE motivo_perdida IS NOT NULL
    GROUP BY motivo_perdida
    ORDER BY total DESC
  `);
  return result.rows;
}

const ORDEN_ETAPAS = ["volver_a_llamar","solicita_informacion","interesado","propuesta_enviada","negociacion","cerrado_ganado","perdido"];

export async function funnelPipelineService() {
  // Pre-pipeline stages count prospectos by estado_lead (no proposals yet).
  // Active pipeline stages count individual proposals by their estado,
  // matching exactly what the Oportunidades kanban shows.
  const result = await pool.query(`
    SELECT 'volver_a_llamar'::text AS etapa,
           COUNT(*)::int           AS total,
           0::float                AS valor
    FROM prospectos p
    WHERE p.eliminado = false
      AND NOT EXISTS (SELECT 1 FROM propuestas pr WHERE pr.prospecto_id = p.id)
      AND p.estado_lead = 'volver_a_llamar'

    UNION ALL

    SELECT 'solicita_informacion'::text, COUNT(*)::int, 0::float
    FROM prospectos p
    WHERE p.eliminado = false
      AND NOT EXISTS (SELECT 1 FROM propuestas pr WHERE pr.prospecto_id = p.id)
      AND p.estado_lead::text = 'solicita_informacion'

    UNION ALL

    SELECT 'interesado'::text, COUNT(*)::int, 0::float
    FROM prospectos p
    WHERE p.eliminado = false
      AND NOT EXISTS (SELECT 1 FROM propuestas pr WHERE pr.prospecto_id = p.id)
      AND p.estado_lead = 'interesado'

    UNION ALL

    SELECT 'propuesta_enviada'::text,
           COUNT(*)::int,
           COALESCE(SUM(CASE WHEN moneda = 'USD'
             THEN monto_propuesto * COALESCE(tipo_cambio, 1)
             ELSE monto_propuesto END), 0)::float
    FROM propuestas
    WHERE estado = 'enviada'

    UNION ALL

    SELECT 'negociacion'::text,
           COUNT(*)::int,
           COALESCE(SUM(CASE WHEN moneda = 'USD'
             THEN monto_propuesto * COALESCE(tipo_cambio, 1)
             ELSE monto_propuesto END), 0)::float
    FROM propuestas
    WHERE estado = 'en_negociacion'

    UNION ALL

    SELECT 'cerrado_ganado'::text,
           COUNT(*)::int,
           COALESCE(SUM(CASE WHEN moneda = 'USD'
             THEN COALESCE(monto_cerrado, monto_propuesto) * COALESCE(tipo_cambio, 1)
             ELSE COALESCE(monto_cerrado, monto_propuesto) END), 0)::float
    FROM propuestas
    WHERE estado = 'cerrada_ganada'

    UNION ALL

    SELECT 'perdido'::text,
           COUNT(*)::int,
           COALESCE(SUM(CASE WHEN moneda = 'USD'
             THEN monto_propuesto * COALESCE(tipo_cambio, 1)
             ELSE monto_propuesto END), 0)::float
    FROM propuestas
    WHERE estado IN ('cerrada_perdida', 'vencida')
  `);

  const byEtapa: Record<string, { total: number; valor: number }> = {};
  for (const row of result.rows) {
    byEtapa[row.etapa] = { total: Number(row.total), valor: Number(row.valor) };
  }

  // ganadas/perdidas come directly from the query rows above
  const ganadas  = byEtapa['cerrado_ganado']?.total ?? 0;
  const perdidas = byEtapa['perdido']?.total        ?? 0;

  return ORDEN_ETAPAS.map((etapa, i) => {
    const { total = 0, valor = 0 } = byEtapa[etapa] ?? {};
    const prevTotal = i > 0 ? (byEtapa[ORDEN_ETAPAS[i - 1]]?.total ?? 0) : null;
    const conversion = prevTotal && prevTotal > 0 && etapa !== "perdido"
      ? Math.round((total / prevTotal) * 100)
      : null;

    if (etapa === "cerrado_ganado") {
      return { etapa, total, valor, conversion, ganadas, perdidas };
    }
    return { etapa, total, valor, conversion };
  });
}

export async function analisisRegionService() {
  const result = await pool.query(`
    SELECT
      zona,
      COUNT(*)::int                                                                         AS total,
      COUNT(*) FILTER (WHERE etapa_pipeline = 'cerrado_ganado')::int                       AS cerrados,
      COUNT(*) FILTER (WHERE etapa_pipeline NOT IN ('perdido','cerrado_ganado'))::int       AS activos,
      COALESCE(SUM(llamadas),0)::int                                                       AS llamadas,
      COALESCE(SUM(llamadas_contestadas),0)::int                                           AS llamadas_contestadas,
      COALESCE(SUM(reuniones),0)::int                                                      AS reuniones,
      COALESCE(SUM(brochures),0)::int                                                      AS brochures,
      COALESCE(SUM(propuestas),0)::int                                                     AS propuestas,
      COALESCE(SUM(propuestas_ganadas),0)::int                                             AS propuestas_ganadas,
      COALESCE(SUM(valor),0)::float                                                        AS valor
    FROM (
      SELECT
        COALESCE(NULLIF(TRIM(p.region),''), NULLIF(TRIM(p.ciudad),''), 'Sin región') AS zona,
        p.etapa_pipeline,
        (SELECT COUNT(*)::int FROM llamadas l WHERE l.prospecto_id = p.id)            AS llamadas,
        (SELECT COUNT(*)::int FROM llamadas l WHERE l.prospecto_id = p.id AND l.contestada = true) AS llamadas_contestadas,
        (SELECT COUNT(*)::int FROM reuniones r WHERE r.prospecto_id = p.id)           AS reuniones,
        (SELECT COUNT(*)::int FROM brochures b WHERE b.prospecto_id = p.id)           AS brochures,
        (SELECT COUNT(*)::int FROM propuestas pr WHERE pr.prospecto_id = p.id)        AS propuestas,
        (SELECT COUNT(*)::int FROM propuestas pr WHERE pr.prospecto_id = p.id AND pr.estado = 'cerrada_ganada') AS propuestas_ganadas,
        (SELECT COALESCE(SUM(CASE WHEN pr.moneda='USD' THEN pr.monto_propuesto * COALESCE(pr.tipo_cambio,1) ELSE pr.monto_propuesto END),0)
         FROM propuestas pr WHERE pr.prospecto_id = p.id AND pr.estado NOT IN ('cerrada_perdida','vencida')) AS valor
      FROM prospectos p
    ) sub
    GROUP BY zona
    ORDER BY total DESC
    LIMIT 20
  `);
  return result.rows;
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

    // Leads que eran "nuevo" de la carga anterior → pasan a "por_gestionar"
    await client.query(
      `UPDATE prospectos SET estado_lead = 'por_gestionar' WHERE estado_lead = 'nuevo'`
    );

    const insertados: any[] = [];

    for (const p of prospectos) {
      const webActiva = p.web_activa === true
        ? true
        : String(p.web_activa || "").toLowerCase().trim() === "true"
          ? true
          : p.web_activa === false || String(p.web_activa || "").toLowerCase().trim() === "false"
            ? false
            : undefined;

      const tamanoImport = (p as any).cantidad_trabajadores
        ? calcularTamanoDesdeNro((p as any).cantidad_trabajadores)
        : p.tamano_empresa;

      const result = await client.query(
        `INSERT INTO prospectos (
          empresa, actividad_economica, tamano_empresa, pagina_web, web_activa, proveedor_web, estado_web,
          nombre_contacto, cargo, telefono, email_contacto,
          ciudad, region, pais, prioridad, fuente,
          estado_lead, clasificacion, estado_venta, notas, creado_por
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
        RETURNING id`,
        [
          p.empresa, (p as any).actividad_economica ?? p.rubro ?? null,
          tamanoImport ?? null, p.pagina_web, webActiva,
          p.proveedor_web, p.estado_web ?? null,
          p.nombre_contacto, p.cargo, p.telefono, p.email_contacto,
          p.ciudad, p.region, p.pais ?? "Perú", p.prioridad ?? "media", p.fuente,
          "nuevo", p.clasificacion ?? "por_gestionar",
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

// ─── Score de leads ───────────────────────────────────────────────────────────

export interface ScoreLead {
  id:     string;
  score:  number;
  nivel:  "caliente" | "activo" | "tibio" | "frio";
}

export async function scoreLeadsService(
  periodo: string = "todo",
  mes?: number,
  anio?: number,
  fecha?: string
): Promise<ScoreLead[]> {
  const buildFiltroActividad = () => {
    if (periodo === "dia" && fecha) return `l.fecha::date = '${fecha}'`;
    if (periodo === "mes" && mes && anio)
      return `EXTRACT(MONTH FROM l.fecha) = ${mes} AND EXTRACT(YEAR FROM l.fecha) = ${anio}`;
    switch (periodo) {
      case "hoy":     return `l.fecha::date = CURRENT_DATE`;
      case "semana":  return `l.fecha >= CURRENT_DATE - INTERVAL '7 days'`;
      case "mes":     return `l.fecha >= CURRENT_DATE - INTERVAL '30 days'`;
      case "trimestre": return `l.fecha >= CURRENT_DATE - INTERVAL '90 days'`;
      case "anio":    return `l.fecha >= CURRENT_DATE - INTERVAL '365 days'`;
      default:        return null; // sin filtro = todos los prospectos
    }
  };
  const filtroActividad = buildFiltroActividad();
  const filtroProspectos = filtroActividad
    ? `AND EXISTS (SELECT 1 FROM llamadas l WHERE l.prospecto_id = p.id AND ${filtroActividad})`
    : "";

  const result = await pool.query(`
    WITH act7 AS (
      SELECT prospecto_id, COUNT(*)::int AS cnt
      FROM llamadas WHERE fecha >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY prospecto_id
    ),
    act30 AS (
      SELECT prospecto_id, COUNT(*)::int AS cnt
      FROM llamadas WHERE fecha >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY prospecto_id
    ),
    prop_data AS (
      SELECT prospecto_id,
        MAX(CASE WHEN estado = 'aceptada' THEN 2
                 WHEN estado = 'enviada'  THEN 1
                 ELSE 0 END)::int AS nivel
      FROM propuestas GROUP BY prospecto_id
    )
    SELECT
      p.id,
      LEAST(100, GREATEST(0,
        CASE p.etapa_pipeline
          WHEN 'nuevo'             THEN 5
          WHEN 'contactado'        THEN 15
          WHEN 'interesado'        THEN 40
          WHEN 'propuesta_enviada' THEN 60
          WHEN 'negociacion'       THEN 75
          WHEN 'cerrado_ganado'    THEN 100
          WHEN 'perdido'           THEN 0
          ELSE 5
        END
        + CASE p.estado_lead::text
            WHEN 'interesado'      THEN 10
            WHEN 'volver_a_llamar' THEN 5
            WHEN 'no_contesta'     THEN -10
            WHEN 'no_interesado'   THEN -20
            ELSE 0
          END
        + CASE p.prioridad
            WHEN 'alta'  THEN 10
            WHEN 'media' THEN 5
            ELSE 0
          END
        + LEAST(10, COALESCE(act7.cnt, 0) * 3)
        -- Solo penalizar inactividad si el lead ya fue llamado antes (no castiga base fría)
        - CASE
            WHEN COALESCE(act30.cnt, 0) = 0
             AND EXISTS (SELECT 1 FROM llamadas lh WHERE lh.prospecto_id = p.id)
            THEN 15
            ELSE 0
          END
        + COALESCE(CASE pr.nivel WHEN 2 THEN 15 WHEN 1 THEN 5 ELSE 0 END, 0)
      ))::int AS score,
      p.empresa,
      p.etapa_pipeline,
      p.estado_lead::text AS estado_lead,
      COALESCE((CURRENT_DATE - p.fecha_primer_contacto)::int, 0) AS dias_en_pipeline
    FROM prospectos p
    LEFT JOIN act7     ON act7.prospecto_id = p.id
    LEFT JOIN act30    ON act30.prospecto_id = p.id
    LEFT JOIN prop_data pr ON pr.prospecto_id = p.id
    WHERE p.eliminado = false
      ${filtroProspectos}
    ORDER BY score DESC
  `);

  const leads = result.rows.map(r => ({
    id:              r.id,
    score:           r.score,
    empresa:         r.empresa as string,
    etapa_pipeline:  r.etapa_pipeline as string,
    estado_lead:     r.estado_lead as string,
    dias_en_pipeline: r.dias_en_pipeline as number,
    nivel: (r.score >= 75 ? "caliente"
          : r.score >= 50 ? "activo"
          : r.score >= 25 ? "tibio"
          : "frio") as "caliente" | "activo" | "tibio" | "frio",
  }));

  // Snapshot diario — upsert para no duplicar si se llama varias veces al día
  if (leads.length > 0) {
    const ids    = leads.map(l => l.id);
    const scores = leads.map(l => l.score);
    const niveles = leads.map(l => l.nivel);
    await pool.query(
      `INSERT INTO score_history (prospecto_id, score, nivel, registrado_en)
       SELECT unnest($1::uuid[]), unnest($2::int[]), unnest($3::text[]), CURRENT_DATE
       ON CONFLICT (prospecto_id, registrado_en)
       DO UPDATE SET score = EXCLUDED.score, nivel = EXCLUDED.nivel`,
      [ids, scores, niveles]
    ).catch(() => {}); // tabla puede no existir aún — no rompe la respuesta
  }

  return leads;
}

export interface ScoreHistoryEntry {
  score:         number;
  nivel:         string;
  registrado_en: string;
}

export async function getScoreHistoryService(prospectoId: string): Promise<ScoreHistoryEntry[]> {
  const result = await pool.query(
    `SELECT score, nivel, registrado_en::text
     FROM score_history
     WHERE prospecto_id = $1
     ORDER BY registrado_en DESC
     LIMIT 10`,
    [prospectoId]
  );
  return result.rows;
}

export async function ciclodeVentaService(anio?: number) {
  const anioFiltro = anio ?? null;
  const anioClause = anioFiltro ? `AND EXTRACT(YEAR FROM pr.fecha_cierre) = ${anioFiltro}` : "";

  // KPIs globales — basado en propuestas cerradas_ganadas (no en etapa_pipeline del prospecto)
  const kpis = await pool.query(`
    WITH base AS (
      SELECT
        pr.id AS propuesta_id,
        p.id,
        GREATEST((pr.fecha_cierre - p.fecha_primer_contacto)::int, 0)   AS dias_total,
        GREATEST((pr.fecha_propuesta - p.fecha_primer_contacto)::int, 0) AS dias_contacto_propuesta,
        GREATEST((pr.fecha_cierre - pr.fecha_propuesta)::int, 0)         AS dias_propuesta_cierre
      FROM propuestas pr
      JOIN prospectos p ON p.id = pr.prospecto_id
      WHERE pr.estado = 'cerrada_ganada'
        AND pr.fecha_cierre IS NOT NULL
        AND p.fecha_primer_contacto IS NOT NULL
        AND p.eliminado = false
        ${anioClause}
    )
    SELECT
      COUNT(*)::int                            AS total_cerrados,
      ROUND(AVG(dias_total))::int              AS promedio_dias,
      MIN(dias_total)::int                     AS min_dias,
      MAX(dias_total)::int                     AS max_dias,
      ROUND(AVG(dias_contacto_propuesta))::int AS promedio_contacto_propuesta,
      ROUND(AVG(dias_propuesta_cierre))::int   AS promedio_propuesta_cierre
    FROM base
  `);

  // Por sector/rubro (top 8) — basado en propuestas cerradas
  const porRubro = await pool.query(`
    SELECT
      COALESCE(p.sector, p.actividad_economica, 'Sin sector') AS rubro,
      COUNT(pr.id)::int              AS total,
      ROUND(AVG((pr.fecha_cierre - p.fecha_primer_contacto)))::int AS promedio_dias
    FROM propuestas pr
    JOIN prospectos p ON p.id = pr.prospecto_id
    WHERE pr.estado = 'cerrada_ganada'
      AND pr.fecha_cierre IS NOT NULL
      AND p.fecha_primer_contacto IS NOT NULL
      AND p.eliminado = false
      ${anioClause}
    GROUP BY COALESCE(p.sector, p.actividad_economica, 'Sin sector')
    ORDER BY total DESC
    LIMIT 8
  `);

  // Prospectos activos en riesgo: llevan más días que el promedio sin cerrar
  // (siempre sobre leads activos actuales, sin filtro de año)
  const promedio = kpis.rows[0]?.promedio_dias ?? null;
  const enRiesgo = promedio
    ? await pool.query(
        `SELECT
           id, empresa, nombre_contacto, etapa_pipeline,
           fecha_primer_contacto::text,
           (CURRENT_DATE - fecha_primer_contacto)::int AS dias_en_pipeline
         FROM prospectos
         WHERE etapa_pipeline NOT IN ('cerrado_ganado', 'perdido')
           AND fecha_primer_contacto IS NOT NULL
           AND eliminado = false
           AND (CURRENT_DATE - fecha_primer_contacto) > $1
         ORDER BY dias_en_pipeline DESC
         LIMIT 10`,
        [promedio]
      )
    : { rows: [] };

  // Detalle individual — una fila por propuesta cerrada_ganada
  const detalle = await pool.query(`
    SELECT
      pr.id,
      p.empresa,
      p.nombre_contacto,
      COALESCE(p.sector, p.actividad_economica) AS rubro,
      p.fecha_primer_contacto::text,
      pr.fecha_cierre::text,
      GREATEST((pr.fecha_cierre - p.fecha_primer_contacto)::int, 0)   AS dias_ciclo,
      pr.fecha_propuesta::text                                          AS fecha_primera_propuesta,
      GREATEST((pr.fecha_propuesta - p.fecha_primer_contacto)::int, 0) AS dias_contacto_propuesta,
      GREATEST((pr.fecha_cierre - pr.fecha_propuesta)::int, 0)         AS dias_propuesta_cierre,
      CASE WHEN pr.moneda = 'USD'
        THEN COALESCE(pr.monto_cerrado, pr.monto_propuesto) * pr.tipo_cambio
        ELSE COALESCE(pr.monto_cerrado, pr.monto_propuesto)
      END::float AS valor_cerrado
    FROM propuestas pr
    JOIN prospectos p ON p.id = pr.prospecto_id
    WHERE pr.estado = 'cerrada_ganada'
      AND pr.fecha_cierre IS NOT NULL
      AND p.fecha_primer_contacto IS NOT NULL
      AND p.eliminado = false
      ${anioClause}
    ORDER BY pr.fecha_cierre DESC
  `);

  // Tendencia mensual — meses del año seleccionado o últimos 12 meses si no hay filtro
  const tendenciaWhereExtra = anioFiltro
    ? `AND EXTRACT(YEAR FROM pr.fecha_cierre) = ${anioFiltro}`
    : `AND pr.fecha_cierre >= CURRENT_DATE - INTERVAL '12 months'`;

  const tendencia = await pool.query(`
    SELECT
      TO_CHAR(pr.fecha_cierre, 'YYYY-MM') AS mes,
      COUNT(pr.id)::int                   AS cerrados,
      ROUND(AVG((pr.fecha_cierre - p.fecha_primer_contacto)))::int AS promedio_dias
    FROM propuestas pr
    JOIN prospectos p ON p.id = pr.prospecto_id
    WHERE pr.estado = 'cerrada_ganada'
      AND pr.fecha_cierre IS NOT NULL
      AND p.fecha_primer_contacto IS NOT NULL
      AND p.eliminado = false
      ${tendenciaWhereExtra}
    GROUP BY mes
    ORDER BY mes ASC
  `);

  // Por servicio — agrupado por pr.servicio
  const porServicio = await pool.query(`
    SELECT
      pr.servicio,
      COUNT(pr.id)::int              AS total,
      ROUND(AVG((pr.fecha_cierre - p.fecha_primer_contacto)))::int AS promedio_dias
    FROM propuestas pr
    JOIN prospectos p ON p.id = pr.prospecto_id
    WHERE pr.estado = 'cerrada_ganada'
      AND pr.fecha_cierre IS NOT NULL
      AND p.fecha_primer_contacto IS NOT NULL
      AND p.eliminado = false
      ${anioClause}
    GROUP BY pr.servicio
    ORDER BY total DESC, promedio_dias ASC
  `);

  return {
    kpis: {
      total_cerrados:              kpis.rows[0]?.total_cerrados              ?? 0,
      promedio_dias:               kpis.rows[0]?.promedio_dias               ?? null,
      min_dias:                    kpis.rows[0]?.min_dias                    ?? null,
      max_dias:                    kpis.rows[0]?.max_dias                    ?? null,
      promedio_contacto_propuesta: kpis.rows[0]?.promedio_contacto_propuesta ?? null,
      promedio_propuesta_cierre:   kpis.rows[0]?.promedio_propuesta_cierre   ?? null,
    },
    por_rubro:    porRubro.rows,
    por_servicio: porServicio.rows,
    en_riesgo:    enRiesgo.rows,
    tendencia:    tendencia.rows,
    detalle:      detalle.rows,
  };
}

export async function getEstadoWebDistribucionService() {
  const [distribucion, prospectos] = await Promise.all([
    pool.query(`
      SELECT
        COALESCE(estado_web, 'sin_informacion') AS estado_web,
        COUNT(*)::int AS total
      FROM prospectos
      WHERE web_activa = true
        AND (clasificacion IS NULL OR clasificacion::text NOT IN ('cerrado', 'descartado'))
      GROUP BY COALESCE(estado_web, 'sin_informacion')
      ORDER BY total DESC
    `),
    pool.query(`
      SELECT
        p.id, p.empresa, p.pagina_web, p.proveedor_web,
        COALESCE(p.estado_web, 'sin_informacion') AS estado_web,
        p.region, p.ciudad,
        p.nombre_contacto, p.telefono,
        p.estado_lead, p.clasificacion, p.prioridad,
        l.canal    AS canal_llamada,
        l.contestada AS contesto
      FROM prospectos p
      LEFT JOIN LATERAL (
        SELECT canal, contestada
        FROM llamadas
        WHERE prospecto_id = p.id
        ORDER BY fecha DESC
        LIMIT 1
      ) l ON true
      WHERE p.web_activa = true
        AND (
          p.estado_web IN ('por_actualizar', 'vencida', 'en_mantenimiento', 'sin_informacion')
          OR p.estado_web IS NULL
        )
        AND (p.clasificacion IS NULL OR p.clasificacion::text NOT IN ('cerrado', 'descartado'))
      ORDER BY
        CASE COALESCE(p.estado_web, 'sin_informacion')
          WHEN 'vencida'          THEN 1
          WHEN 'en_mantenimiento' THEN 2
          WHEN 'por_actualizar'   THEN 3
          WHEN 'sin_informacion'  THEN 4
        END,
        CASE p.prioridad
          WHEN 'alta'  THEN 1
          WHEN 'media' THEN 2
          WHEN 'baja'  THEN 3
          ELSE 4
        END,
        p.empresa ASC
    `),
  ]);

  return { distribucion: distribucion.rows, prospectos: prospectos.rows };
}

// ─── Recálculo de score para un solo lead ────────────────────────────────────
export async function recalcularScoreProspecto(id: string): Promise<void> {
  try {
    const result = await pool.query(`
      WITH act7 AS (
        SELECT COUNT(*)::int AS cnt FROM llamadas
        WHERE prospecto_id = $1 AND fecha >= CURRENT_DATE - INTERVAL '7 days'
      ),
      act30 AS (
        SELECT COUNT(*)::int AS cnt FROM llamadas
        WHERE prospecto_id = $1 AND fecha >= CURRENT_DATE - INTERVAL '30 days'
      ),
      prop_data AS (
        SELECT MAX(CASE WHEN estado = 'aceptada' THEN 2 WHEN estado = 'enviada' THEN 1 ELSE 0 END)::int AS nivel
        FROM propuestas WHERE prospecto_id = $1
      )
      SELECT LEAST(100, GREATEST(0,
        CASE p.etapa_pipeline
          WHEN 'nuevo'             THEN 5
          WHEN 'contactado'        THEN 15
          WHEN 'interesado'        THEN 40
          WHEN 'propuesta_enviada' THEN 60
          WHEN 'negociacion'       THEN 75
          WHEN 'cerrado_ganado'    THEN 100
          WHEN 'perdido'           THEN 0
          ELSE 5 END
        + CASE p.estado_lead::text
            WHEN 'interesado'      THEN 10
            WHEN 'volver_a_llamar' THEN 5
            WHEN 'no_contesta'     THEN -10
            WHEN 'no_interesado'   THEN -20
            ELSE 0 END
        + CASE p.prioridad WHEN 'alta' THEN 10 WHEN 'media' THEN 5 ELSE 0 END
        + LEAST(10, COALESCE((SELECT cnt FROM act7),  0) * 3)
        - CASE
            WHEN COALESCE((SELECT cnt FROM act30), 0) = 0
             AND EXISTS (SELECT 1 FROM llamadas lh WHERE lh.prospecto_id = p.id)
            THEN 15 ELSE 0 END
        + COALESCE(CASE (SELECT nivel FROM prop_data) WHEN 2 THEN 15 WHEN 1 THEN 5 ELSE 0 END, 0)
      ))::int AS score
      FROM prospectos p WHERE p.id = $1
    `, [id]);

    if (!result.rows[0]) return;
    const score = result.rows[0].score as number;
    const nivel = score >= 75 ? "caliente" : score >= 50 ? "activo" : score >= 25 ? "tibio" : "frio";

    await pool.query(
      `INSERT INTO score_history (prospecto_id, score, nivel, registrado_en)
       VALUES ($1, $2, $3, CURRENT_DATE)
       ON CONFLICT (prospecto_id, registrado_en)
       DO UPDATE SET score = EXCLUDED.score, nivel = EXCLUDED.nivel`,
      [id, score, nivel]
    ).catch(() => {});
  } catch { /* silencioso — no rompe el flujo principal */ }
}

// ── Análisis Comercial ────────────────────────────────────────────────────────

function calcularScoreComercial(p: any): number {
  let total = 0;
  const SECTOR_S: Record<string, number> = {
    construccion: 15, inmobiliaria: 15, manufactura_industria: 15, agroindustria: 15, mineria_energia: 15,
    salud: 12, servicios_profesionales: 12, comercio_mayorista: 12, arquitectura_ingenieria: 12,
    tecnologia: 8, transporte_logistica: 8, seguridad: 8, educacion: 8,
    comercio_retail: 5, gastronomia_turismo: 5, otro: 5,
  };
  const PERFIL_S: Record<string, number> = {
    construccion: 6, clinica_hospital: 6, importadora_exportadora: 6, fabrica_manufactura: 6,
    drogueria_farmaceutica: 6, estudio_juridico: 6,
    distribuidora_mayorista: 3, hotel_hospedaje: 3, consultoria_empresarial: 3,
    almacen_logistica: 3, agencia_aduanas: 3, inmobiliaria: 3, ingenieria_consultoria: 3,
    arquitectura: 0, laboratorio: 0, contabilidad_auditoria: 0, instituto_academia: 0,
    empresa_transportes: 0, seguridad_cctv: 0, taller_industrial: 0,
    ferreteria_materiales: 0, agencia_viajes: 0, agroindustria: 0,
    consultorio_medico: 0, colegio: 0, tecnologia_ti: 0,
    farmacia_botica: -4, tienda_retail: -4, restaurante: -4, ong_asociacion: -4, centro_capacitacion: -4,
  };
  const TAMANO_F: Record<string, number> = { "1_10": 2, "11_50": 7, "51_200": 9, "201_500": 15, "mas_500": 15 };

  total += SECTOR_S[p.sector ?? ""] ?? 0;
  total += PERFIL_S[p.perfil_empresa ?? ""] ?? 0;

  const n = p.cantidad_trabajadores != null ? parseInt(p.cantidad_trabajadores) : NaN;
  if (!isNaN(n)) {
    if (n === 1) total -= 5; else if (n <= 3) total -= 3; else if (n <= 5) total += 0;
    else if (n <= 10) total += 2; else if (n <= 15) total += 4; else if (n <= 25) total += 5;
    else if (n <= 50) total += 7; else if (n <= 100) total += 9; else if (n <= 200) total += 12;
    else total += 15;
  } else {
    total += TAMANO_F[p.tamano_empresa ?? ""] ?? 0;
  }

  if (!p.web_activa) { total += 8; }
  else {
    const wm: Record<string, number> = { vencida: 5, sin_informacion: 4, por_actualizar: 3, en_mantenimiento: 1, actualizada: -10 };
    total += wm[p.estado_web ?? ""] ?? 0;
  }

  const redes: string[] = Array.isArray(p.redes_sociales) ? p.redes_sociales : [];
  const activas = redes.filter((r: string) => r !== "ninguna");
  if (activas.length > 0) {
    let rp = activas.length === 1 ? 1 : 2;
    if (activas.includes("linkedin")) rp += 2;
    total += Math.min(rp, 4);
  }

  return total;
}

const SECTORES_3D  = new Set(["construccion", "inmobiliaria", "arquitectura_ingenieria"]);
const SECTORES_MKT = new Set(["comercio_retail", "gastronomia_turismo"]);
const TAMANO_GRANDE = new Set(["51_200", "201_500", "mas_500"]);

function clasificarServicios(p: any): string[] {
  const servicios: string[] = [];
  const redes: string[] = Array.isArray(p.redes_sociales) ? p.redes_sociales : [];
  const redesActivas = redes.filter((r: string) => r !== "ninguna");
  const trab = p.cantidad_trabajadores != null ? parseInt(p.cantidad_trabajadores) : null;
  const esGrande = trab != null ? trab >= 51 : TAMANO_GRANDE.has(p.tamano_empresa ?? "");
  const esMicro  = trab != null ? trab <= 15 : p.tamano_empresa === "1_10";

  // Desarrollo Web — sin web o web desactualizada
  if (!p.web_activa || ["vencida", "por_actualizar", "sin_informacion", "en_mantenimiento"].includes(p.estado_web ?? "")) {
    servicios.push("desarrollo_web");
  }

  // Marketing Digital — redes activas o sector consumo masivo
  if (redesActivas.length > 0 || SECTORES_MKT.has(p.sector ?? "")) {
    servicios.push("marketing_digital");
  }

  // Branding — empresas pequeñas/medianas con identidad por construir
  if (esMicro) {
    servicios.push("branding");
  }

  // Modelamiento 3D — sectores con necesidad visual/técnica
  if (SECTORES_3D.has(p.sector ?? "")) {
    servicios.push("modelamiento_3d");
  }

  // ERP / CRM — empresas grandes con estructura
  if (esGrande) {
    servicios.push("erp_crm");
  }

  return servicios;
}

export async function getAnalisisComercialService() {
  const result = await pool.query(`
    SELECT
      id, empresa, nombre_contacto, telefono, ciudad, region,
      sector, perfil_empresa, cantidad_trabajadores, tamano_empresa,
      web_activa, estado_web, redes_sociales,
      prioridad, estado_lead, clasificacion, creado_en
    FROM prospectos
    WHERE eliminado = false
      AND estado_lead::text NOT IN ('no_interesado', 'perdida', 'baja_de_oficio', 'suspension_temporal', 'no_habido')
    ORDER BY empresa ASC
  `);

  const leads = result.rows;

  // Score + clasificación en memoria
  const enriquecidos = leads.map(p => ({
    ...p,
    score:    calcularScoreComercial(p),
    servicios: clasificarServicios(p),
  }));

  // Separar ignorables (score < 5)
  const ignorables = enriquecidos.filter(p => p.score < 5);
  const activos    = enriquecidos.filter(p => p.score >= 5);

  const porServicio = (key: string) =>
    activos.filter(p => p.servicios.includes(key))
           .sort((a, b) => b.score - a.score);

  // Conteo de excluidos para la nota de referencia
  const excluidos = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE estado_lead::text = 'no_interesado')                                                          AS no_interesados,
      COUNT(*) FILTER (WHERE estado_lead::text = 'perdida')                                                                 AS perdidas,
      COUNT(*) FILTER (WHERE estado_lead::text IN ('baja_de_oficio','suspension_temporal','no_habido'))                    AS inactivos,
      COUNT(*) FILTER (WHERE web_activa = false)                                                                            AS total_sin_web_bd,
      COUNT(*) FILTER (WHERE web_activa = false AND estado_lead::text = 'no_interesado')                                   AS sin_web_no_interesados,
      COUNT(*) FILTER (WHERE web_activa = false AND estado_lead::text = 'perdida')                                         AS sin_web_perdidas,
      COUNT(*) FILTER (WHERE web_activa = false AND estado_lead::text IN ('baja_de_oficio','suspension_temporal','no_habido')) AS sin_web_inactivos
    FROM prospectos WHERE eliminado = false
  `);
  const exc = excluidos.rows[0];

  const stats = {
    total:          leads.length,
    alta:           leads.filter(p => p.prioridad === "alta").length,
    media:          leads.filter(p => p.prioridad === "media").length,
    baja:           leads.filter(p => p.prioridad === "baja").length,
    sin_web:        leads.filter(p => !p.web_activa).length,
    ignorables:     ignorables.length,
    excluidos: {
      no_interesados: parseInt(exc.no_interesados ?? "0"),
      perdidas:       parseInt(exc.perdidas ?? "0"),
      inactivos:      parseInt(exc.inactivos ?? "0"),
    },
    sin_web_detalle: {
      total_bd:       parseInt(exc.total_sin_web_bd ?? "0"),
      no_interesados: parseInt(exc.sin_web_no_interesados ?? "0"),
      perdidas:       parseInt(exc.sin_web_perdidas ?? "0"),
      inactivos:      parseInt(exc.sin_web_inactivos ?? "0"),
    },
  };

  // Agrupación por oportunidad web (todos los prospectables)
  const porWeb = {
    sin_web:          enriquecidos.filter(p => !p.web_activa).sort((a,b) => b.score - a.score),
    vencida:          enriquecidos.filter(p => p.web_activa && p.estado_web === "vencida").sort((a,b) => b.score - a.score),
    por_actualizar:   enriquecidos.filter(p => p.web_activa && p.estado_web === "por_actualizar").sort((a,b) => b.score - a.score),
    en_mantenimiento: enriquecidos.filter(p => p.web_activa && p.estado_web === "en_mantenimiento").sort((a,b) => b.score - a.score),
    sin_informacion:  enriquecidos.filter(p => p.web_activa && (!p.estado_web || p.estado_web === "sin_informacion")).sort((a,b) => b.score - a.score),
    actualizada:      enriquecidos.filter(p => p.web_activa && p.estado_web === "actualizada").sort((a,b) => b.score - a.score),
  };

  return {
    stats,
    desarrollo_web:    porServicio("desarrollo_web"),
    marketing_digital: porServicio("marketing_digital"),
    branding:          porServicio("branding"),
    modelamiento_3d:   porServicio("modelamiento_3d"),
    erp_crm:           porServicio("erp_crm"),
    ignorables:        ignorables.sort((a, b) => b.score - a.score),
    por_web:           porWeb,
  };
}
