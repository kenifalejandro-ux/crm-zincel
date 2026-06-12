/** src/server/routes/crm/instagramOrganico.ts
 *  Registrado en /organico — sirve Instagram, Facebook y TikTok orgánico.
 */

import { Router } from "express";
import { authMiddleware } from "../../shared/middlewares/auth.middleware";
import { pool } from "../../config/database";
import {
  previewInstagramOrganico,
  syncInstagramOrganicoService,
} from "../../services/instagramOrganico.service";
import { syncFacebookOrganicoService } from "../../services/facebookOrganico.service";
import { syncTikTokOrganicoService }   from "../../services/tiktokOrganico.service";
import {
  obtenerUrlAutorizacionLoginKit,
  intercambiarCodigo,
  syncTikTokLoginKitService,
  estadoLoginKit,
} from "../../services/tiktokLoginKit.service";
import { env } from "../../config/env";

export const instagramOrganicoRouter = Router();

// ── Callback de TikTok OAuth — SIN authMiddleware (TikTok redirige aquí) ──────
instagramOrganicoRouter.get("/tiktok-callback", async (req, res) => {
  const { code, state, error, error_description } = req.query as Record<string, string>;

  if (error) {
    return res.redirect(`http://localhost:5173/metricas?tiktok_error=${encodeURIComponent(error_description ?? error)}`);
  }
  if (!code || !state) {
    return res.redirect("http://localhost:5173/metricas?tiktok_error=Parámetros+inválidos");
  }

  const empresa = decodeURIComponent(state);
  try {
    await intercambiarCodigo(code, empresa);
    res.redirect(`http://localhost:5173/metricas?tiktok_conectado=1&empresa=${encodeURIComponent(empresa)}`);
  } catch (err: any) {
    res.redirect(`http://localhost:5173/metricas?tiktok_error=${encodeURIComponent(err.message)}`);
  }
});

instagramOrganicoRouter.use(authMiddleware);

// GET /api/crm/organico?empresa=X&plataforma=instagram|facebook|tiktok
instagramOrganicoRouter.get("/", async (req, res) => {
  const { empresa, plataforma } = req.query as { empresa?: string; plataforma?: string };

  const conditions: string[] = [];
  const values: any[]        = [];
  let idx = 1;

  if (empresa)    { conditions.push(`empresa ILIKE $${idx++}`);  values.push(empresa); }
  if (plataforma) { conditions.push(`plataforma = $${idx++}`);   values.push(plataforma); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT * FROM metricas_organicas ${where}
     ORDER BY publicado_en DESC LIMIT 200`,
    values
  );
  res.json({ data: rows });
});

// GET /api/crm/instagram-organico/preview?empresa=X&limit=N
instagramOrganicoRouter.get("/preview", async (req, res) => {
  const { empresa, limit } = req.query as { empresa: string; limit?: string };
  if (!empresa) return res.status(400).json({ message: "empresa requerido" });
  try {
    const posts = await previewInstagramOrganico(empresa, limit ? parseInt(limit) : 50);
    res.json({ total: posts.length, posts });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/crm/organico/sync/instagram
instagramOrganicoRouter.post("/sync/instagram", async (req, res) => {
  const { empresa, limit } = req.body;
  if (!empresa) return res.status(400).json({ message: "empresa requerido" });
  try {
    const resultado = await syncInstagramOrganicoService(empresa, limit ?? 50);
    res.json({ ok: true, ...resultado });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/crm/organico/sync (backward compat → instagram)
instagramOrganicoRouter.post("/sync", async (req, res) => {
  const { empresa, limit } = req.body;
  if (!empresa) return res.status(400).json({ message: "empresa requerido" });
  try {
    const resultado = await syncInstagramOrganicoService(empresa, limit ?? 50);
    res.json({ ok: true, ...resultado });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/crm/organico/sync/facebook
instagramOrganicoRouter.post("/sync/facebook", async (req, res) => {
  const { empresa, limit } = req.body;
  if (!empresa) return res.status(400).json({ message: "empresa requerido" });
  try {
    const resultado = await syncFacebookOrganicoService(empresa, limit ?? 30);
    res.json({ ok: true, ...resultado });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/crm/organico/tiktok-auth-url?empresa=X
instagramOrganicoRouter.get("/tiktok-auth-url", (req, res) => {
  const { empresa } = req.query as { empresa: string };
  if (!empresa) return res.status(400).json({ message: "empresa requerido" });
  try {
    const url = obtenerUrlAutorizacionLoginKit(empresa);
    res.json({ url });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/crm/organico/tiktok-estado?empresa=X
instagramOrganicoRouter.get("/tiktok-estado", async (req, res) => {
  const { empresa } = req.query as { empresa: string };
  if (!empresa) return res.json({ conectado: false });
  try {
    const estado = await estadoLoginKit(empresa);
    res.json(estado);
  } catch {
    res.json({ conectado: false });
  }
});

// POST /api/crm/organico/sync/tiktok
instagramOrganicoRouter.post("/sync/tiktok", async (req, res) => {
  const { empresa, limit } = req.body;
  if (!empresa) return res.status(400).json({ message: "empresa requerido" });
  try {
    const resultado = await syncTikTokLoginKitService(empresa, limit ?? 30);
    res.json({ ok: true, ...resultado });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/crm/organico/mejores-horas?empresa=X&plataforma=instagram
instagramOrganicoRouter.get("/mejores-horas", async (req, res) => {
  const { empresa, plataforma } = req.query as { empresa?: string; plataforma?: string };

  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (empresa)    { conditions.push(`empresa ILIKE $${idx++}`);  values.push(empresa); }
  if (plataforma) { conditions.push(`plataforma = $${idx++}`);   values.push(plataforma); }

  const cond   = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT
       EXTRACT(DOW  FROM publicado_en AT TIME ZONE 'America/Bogota')::int  AS dia_semana,
       EXTRACT(HOUR FROM publicado_en AT TIME ZONE 'America/Bogota')::int  AS hora,
       COUNT(*)                                                             AS total_posts,
       ROUND(AVG(tasa_engagement)::numeric, 2)                            AS engagement_promedio,
       ROUND(AVG(alcance)::numeric, 0)                                    AS alcance_promedio,
       ROUND(AVG(me_gusta)::numeric, 0)                                   AS likes_promedio
     FROM metricas_organicas
     ${cond}
     GROUP BY dia_semana, hora
     ORDER BY engagement_promedio DESC`,
    values
  );
  res.json({ data: rows });
});

// GET /api/crm/organico/top-posts?empresa=X&limit=10&plataforma=instagram
instagramOrganicoRouter.get("/top-posts", async (req, res) => {
  const { empresa, limit, plataforma } = req.query as { empresa?: string; limit?: string; plataforma?: string };

  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;
  if (empresa)    { conditions.push(`empresa ILIKE $${idx++}`); values.push(empresa); }
  if (plataforma) { conditions.push(`plataforma = $${idx++}`);  values.push(plataforma); }

  const cond   = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT * FROM metricas_organicas
     ${cond}
     ORDER BY tasa_engagement DESC, alcance DESC
     LIMIT ${parseInt(limit ?? "10")}`,
    values
  );
  res.json({ data: rows });
});
