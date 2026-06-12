/** src/server/services/tiktokLoginKit.service.ts
 *
 *  TikTok Login Kit — acceso a contenido orgánico del perfil TikTok.
 *  OAuth 2.0 via developers.tiktok.com (diferente al Business API de Ads).
 *  Endpoints: open.tiktokapis.com/v2/
 */

import axios from "axios";
import { pool } from "../config/database";
import { env } from "../config/env";

const TIKTOK_AUTH  = "https://www.tiktok.com/v2/auth/authorize/";
const TIKTOK_TOKEN = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_API   = "https://open.tiktokapis.com/v2";

export function obtenerUrlAutorizacionLoginKit(empresa: string): string {
  const { tiktokLoginClientKey, tiktokLoginRedirectUri } = env;
  if (!tiktokLoginClientKey) throw new Error("Falta TIKTOK_LOGIN_CLIENT_KEY en .env");

  const params = new URLSearchParams({
    client_key:    tiktokLoginClientKey,
    scope:         "user.info.basic,video.list",
    response_type: "code",
    redirect_uri:  tiktokLoginRedirectUri,
    state:         encodeURIComponent(empresa),
  });
  return `${TIKTOK_AUTH}?${params.toString()}`;
}

export async function intercambiarCodigo(code: string, empresa: string): Promise<void> {
  const { tiktokLoginClientKey, tiktokLoginClientSecret, tiktokLoginRedirectUri } = env;

  const params = new URLSearchParams({
    client_key:    tiktokLoginClientKey,
    client_secret: tiktokLoginClientSecret,
    code,
    grant_type:    "authorization_code",
    redirect_uri:  tiktokLoginRedirectUri,
  });

  const { data } = await axios.post(TIKTOK_TOKEN, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (data.error) {
    throw new Error(`TikTok OAuth error: ${data.error_description ?? data.error}`);
  }

  const { access_token, refresh_token, open_id, expires_in } = data;
  const expires_at = new Date(Date.now() + (expires_in ?? 86400) * 1000);

  await pool.query(
    `INSERT INTO tiktok_login_tokens (empresa, access_token, refresh_token, open_id, expires_at, actualizado_en)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (empresa) DO UPDATE SET
       access_token   = EXCLUDED.access_token,
       refresh_token  = EXCLUDED.refresh_token,
       open_id        = EXCLUDED.open_id,
       expires_at     = EXCLUDED.expires_at,
       actualizado_en = NOW()`,
    [empresa, access_token, refresh_token ?? null, open_id ?? null, expires_at]
  );
}

export async function refreshLoginKitToken(empresa: string): Promise<void> {
  const { tiktokLoginClientKey, tiktokLoginClientSecret } = env;

  const { rows } = await pool.query(
    `SELECT * FROM tiktok_login_tokens WHERE empresa ILIKE $1`, [empresa]
  );
  if (!rows[0]?.refresh_token) throw new Error("No hay refresh_token para renovar");

  const params = new URLSearchParams({
    client_key:    tiktokLoginClientKey,
    client_secret: tiktokLoginClientSecret,
    grant_type:    "refresh_token",
    refresh_token: rows[0].refresh_token,
  });

  const { data } = await axios.post(TIKTOK_TOKEN, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (data.error) throw new Error(`TikTok refresh error: ${data.error_description ?? data.error}`);

  const expires_at = new Date(Date.now() + (data.expires_in ?? 86400) * 1000);
  await pool.query(
    `UPDATE tiktok_login_tokens
     SET access_token = $1, refresh_token = $2, expires_at = $3, actualizado_en = NOW()
     WHERE empresa ILIKE $4`,
    [data.access_token, data.refresh_token ?? rows[0].refresh_token, expires_at, empresa]
  );
}

async function resolverToken(empresa: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT * FROM tiktok_login_tokens WHERE empresa ILIKE $1`, [empresa]
  );
  if (!rows[0]) throw new Error("TikTok no conectado. Usa el botón 'Conectar TikTok' en la pestaña Orgánico.");

  const token = rows[0];
  // Si vence en menos de 5 minutos, refrescar
  if (token.expires_at && new Date(token.expires_at).getTime() - Date.now() < 300_000) {
    try { await refreshLoginKitToken(empresa); }
    catch { throw new Error("Token de TikTok expirado. Reconecta desde Orgánico."); }
    const { rows: r2 } = await pool.query(
      `SELECT access_token FROM tiktok_login_tokens WHERE empresa ILIKE $1`, [empresa]
    );
    return r2[0].access_token;
  }

  return token.access_token;
}

export async function estadoLoginKit(empresa: string): Promise<{ conectado: boolean; expires_at?: string }> {
  const { rows } = await pool.query(
    `SELECT expires_at FROM tiktok_login_tokens WHERE empresa ILIKE $1`, [empresa]
  );
  if (!rows[0]) return { conectado: false };
  return { conectado: true, expires_at: rows[0].expires_at };
}

export async function syncTikTokLoginKitService(empresa: string, limit = 30) {
  const accessToken = await resolverToken(empresa);

  const fields = "id,video_description,duration,cover_image_url,embed_link,like_count,comment_count,share_count,view_count,create_time";

  const { data } = await axios.post(
    `${TIKTOK_API}/video/list/?fields=${fields}`,
    { cursor: 0, max_count: Math.min(limit, 20) },
    { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
  );

  if (data.error?.code && data.error.code !== "ok") {
    throw new Error(`TikTok API: ${data.error.message} (${data.error.code})`);
  }

  const videos: any[] = data.data?.videos ?? [];
  if (videos.length === 0) return { total: 0, insertados: 0, actualizados: 0 };

  let insertados = 0, actualizados = 0;

  for (const v of videos) {
    const me_gusta    = v.like_count    ?? 0;
    const comentarios = v.comment_count ?? 0;
    const compartidos = v.share_count   ?? 0;
    const repros      = v.view_count    ?? 0;
    const alcance     = repros; // view_count es el alcance más cercano en TikTok
    const tasa_eng    = alcance > 0
      ? parseFloat((((me_gusta + comentarios + compartidos) / alcance) * 100).toFixed(4))
      : 0;

    const publicado = v.create_time
      ? new Date(v.create_time * 1000).toISOString()
      : new Date().toISOString();

    const result = await pool.query(
      `INSERT INTO metricas_organicas (
         empresa, plataforma, post_id,
         tipo_contenido, descripcion, url_media, permalink, publicado_en,
         alcance, impresiones, me_gusta, comentarios, compartidos,
         guardados, reproducciones, tasa_engagement, actualizado_en
       ) VALUES (
         $1,'tiktok',$2,
         'VIDEO',$3,$4,$5,$6,
         $7,$7,$8,$9,$10,
         0,$11,$12,NOW()
       )
       ON CONFLICT (empresa, plataforma, post_id) DO UPDATE SET
         alcance         = EXCLUDED.alcance,
         impresiones     = EXCLUDED.impresiones,
         me_gusta        = EXCLUDED.me_gusta,
         comentarios     = EXCLUDED.comentarios,
         compartidos     = EXCLUDED.compartidos,
         reproducciones  = EXCLUDED.reproducciones,
         tasa_engagement = EXCLUDED.tasa_engagement,
         actualizado_en  = NOW()
       RETURNING (xmax = 0) AS es_nuevo`,
      [
        empresa, v.id,
        v.video_description ?? null,
        v.cover_image_url   ?? null,
        v.embed_link        ?? null,
        publicado,
        alcance, me_gusta, comentarios, compartidos,
        repros, tasa_eng,
      ]
    );

    if (result.rows[0]?.es_nuevo) insertados++;
    else actualizados++;
  }

  return { total: insertados + actualizados, insertados, actualizados };
}
