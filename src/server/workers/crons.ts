/** src/server/workers/crons.ts — Tareas programadas con node-cron */

import cron from "node-cron";
import { pool } from "../config/database";
import { crearNotificacion, yaNotificadoHoy } from "../services/notificaciones.service";
import { listarCuentasAutoSync, registrarSync } from "../services/plataformaCuentas.service";
import { syncMetaAdsService } from "../services/metaAds.service";
import { syncTikTokAdsService } from "../services/tiktokAds.service";
import { syncGoogleAdsService } from "../services/googleAds.service";
import { syncInstagramOrganicoService } from "../services/instagramOrganico.service";
import { syncFacebookOrganicoService }  from "../services/facebookOrganico.service";
import { syncTikTokOrganicoService }    from "../services/tiktokOrganico.service";
import { logger } from "../config/logger";

// ── Cron 1: Recordatorio de reuniones próximas ────────────────────────────────
// Cada 15 minutos: avisa si hay una reunión programada en los próximos 60 min.
function cronRecordatorioReuniones() {
  cron.schedule("*/15 * * * *", async () => {
    try {
      const { rows } = await pool.query<{
        id: string; titulo: string; fecha_hora: Date;
        empresa: string; creado_por: string | null;
      }>(`
        SELECT r.id, r.titulo, r.fecha_hora, p.empresa, r.creado_por
        FROM reuniones r
        JOIN prospectos p ON p.id = r.prospecto_id
        WHERE r.estado = 'programada'
          AND r.fecha_hora BETWEEN NOW() AND NOW() + INTERVAL '60 minutes'
      `);

      for (const r of rows) {
        if (!r.creado_por) continue;

        const clave = `reunion:${r.id}`;
        const yaEnviado = await yaNotificadoHoy(r.creado_por, "reunion_proxima", clave);
        if (yaEnviado) continue;

        const mins = Math.round((new Date(r.fecha_hora).getTime() - Date.now()) / 60000);
        await crearNotificacion({
          usuario_id: r.creado_por,
          tipo:       "reunion_proxima",
          titulo:     `Reunión en ${mins} min — ${r.empresa}`,
          cuerpo:     r.titulo,
          url:        "/reuniones",
          metadata:   { clave, reunion_id: r.id },
        });
        logger.info({ reunion_id: r.id }, "Notificación reunión próxima creada");
      }
    } catch (err) {
      logger.error({ err }, "Error en cron recordatorio reuniones");
    }
  });
}

// ── Cron 2: Leads sin actividad (+14 días) ────────────────────────────────────
// Cada día a las 9:00 am: un único aviso por usuario con el total de leads dormidos.
function cronLeadsSinActividad() {
  cron.schedule("0 9 * * *", async () => {
    try {
      // Prospectos no cerrados/descartados donde la última actividad fue hace 14+ días (o nunca)
      const { rows } = await pool.query<{
        creado_por: string; total: number;
      }>(`
        SELECT p.creado_por, COUNT(*)::int AS total
        FROM prospectos p
        WHERE p.clasificacion NOT IN ('cerrado', 'descartado')
          AND p.creado_por IS NOT NULL
          AND (
            (SELECT MAX(al.creado_en) FROM activity_logs al WHERE al.prospecto_id = p.id)
              < NOW() - INTERVAL '14 days'
            OR NOT EXISTS (SELECT 1 FROM activity_logs al WHERE al.prospecto_id = p.id)
          )
        GROUP BY p.creado_por
      `);

      for (const row of rows) {
        const clave = `leads_sin_actividad:${row.creado_por}`;
        const yaEnviado = await yaNotificadoHoy(row.creado_por, "lead_sin_actividad", clave);
        if (yaEnviado) continue;

        await crearNotificacion({
          usuario_id: row.creado_por,
          tipo:       "lead_sin_actividad",
          titulo:     `${row.total} lead${row.total > 1 ? "s" : ""} sin actividad (+14 días)`,
          cuerpo:     "Revísalos antes de que se enfríen.",
          url:        "/inteligencia",
          metadata:   { clave, total: row.total },
        });
        logger.info({ usuario_id: row.creado_por, total: row.total }, "Notificación leads sin actividad creada");
      }
    } catch (err) {
      logger.error({ err }, "Error en cron leads sin actividad");
    }
  });
}

// ── Cron 3: Auto-sync plataformas de ads (2:00 am diario) ────────────────────
// Sincroniza los últimos 30 días de campañas para todas las cuentas activas.
// También sincroniza Instagram orgánico para cuentas Meta.
function cronAutoSyncAds() {
  cron.schedule("0 2 * * *", async () => {
    logger.info("Auto-sync ads iniciado");

    const hasta = new Date().toISOString().split("T")[0];
    const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    let cuentas: { id: string; empresa: string; plataforma: string }[] = [];
    try {
      cuentas = await listarCuentasAutoSync();
    } catch (err) {
      logger.error({ err }, "Auto-sync: no se pudo obtener cuentas");
      return;
    }

    for (const cuenta of cuentas) {
      try {
        if (cuenta.plataforma === "meta") {
          await syncMetaAdsService(cuenta.empresa, desde, hasta);
          await syncInstagramOrganicoService(cuenta.empresa, 50);
          await syncFacebookOrganicoService(cuenta.empresa, 30).catch(() => {});
          logger.info({ empresa: cuenta.empresa }, "Auto-sync meta + instagram + facebook ok");
        } else if (cuenta.plataforma === "tiktok") {
          await syncTikTokAdsService(cuenta.empresa, desde, hasta);
          await syncTikTokOrganicoService(cuenta.empresa, 30).catch(() => {});
          logger.info({ empresa: cuenta.empresa }, "Auto-sync tiktok + tiktok-organico ok");
        } else if (cuenta.plataforma === "google") {
          await syncGoogleAdsService(cuenta.empresa, desde, hasta);
          logger.info({ empresa: cuenta.empresa }, "Auto-sync google ok");
        }
      } catch (err: any) {
        await registrarSync(cuenta.empresa, cuenta.plataforma, err.message).catch(() => {});
        logger.error({ empresa: cuenta.empresa, plataforma: cuenta.plataforma, err: err.message }, "Auto-sync falló");
      }
    }

    logger.info({ cuentas: cuentas.length }, "Auto-sync ads completado");
  });
}

export function startCrons() {
  cronRecordatorioReuniones();
  cronLeadsSinActividad();
  cronAutoSyncAds();
  logger.info("⏰ Crons iniciados: reuniones (*/15 min) · leads sin actividad (9:00 am) · auto-sync ads (2:00 am)");
}
