/** src/server/services/tiktokOrganico.service.ts
 *
 *  Sincroniza videos orgánicos de TikTok Business via TikTok Business API v1.3.
 *  Requiere: business access token en plataforma_cuentas (plataforma='tiktok')
 *  Endpoint: GET /business/video/list/
 */

import axios from "axios";
import { pool } from "../config/database";
import { obtenerCuentaPorEmpresaYPlataforma } from "./plataformaCuentas.service";
import { env } from "../config/env";

const TIKTOK_API = "https://business-api.tiktok.com/open_api/v1.3";

async function resolverCredenciales(empresa: string): Promise<{ token: string; businessId: string }> {
  const bcId = env.tiktokBcId;
  if (!bcId) throw new Error("Falta TIKTOK_BC_ID en .env");

  // Usar el token de plataforma_cuentas si existe (se renueva desde Configuración)
  const cuenta = await obtenerCuentaPorEmpresaYPlataforma(empresa, "tiktok");
  if (cuenta?.access_token) {
    if (cuenta.token_vence_en && new Date(cuenta.token_vence_en) < new Date()) {
      throw new Error("El token de TikTok ha vencido. Renuévalo en Configuración → cuenta TikTok → Renovar token.");
    }
    return { token: cuenta.access_token, businessId: bcId };
  }

  // Fallback: token del .env
  if (env.tiktokAccessToken) return { token: env.tiktokAccessToken, businessId: bcId };

  throw new Error("No hay token de TikTok configurado. Ve a Configuración y renueva el token.");
}

interface TikTokVideo {
  item_id:        string;
  video_description: string;
  cover_image_url:string;
  share_url:      string;
  create_time:    number;
  statistics: {
    play_count:    number;
    like_count:    number;
    comment_count: number;
    share_count:   number;
    reach:         number;
    impression_count: number;
  };
}

async function fetchVideos(accessToken: string, businessId: string, limit: number): Promise<TikTokVideo[]> {
  try {
    const { data } = await axios.get(`${TIKTOK_API}/business/video/list/`, {
      headers: { "Access-Token": accessToken },
      params:  {
        business_id: businessId,
        fields: "item_id,video_description,cover_image_url,share_url,create_time,statistics",
        max_count: limit,
      },
    });

    if (data?.code !== 0) {
      throw new Error(`TikTok API error ${data?.code}: ${data?.message}`);
    }

    return data?.data?.videos ?? [];
  } catch (err: any) {
    if (err.response?.data) {
      throw new Error(`TikTok API: ${JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
}

export async function syncTikTokOrganicoService(empresa: string, limit = 30) {
  const { token, businessId } = await resolverCredenciales(empresa);
  const videos = await fetchVideos(token, businessId, limit);

  if (videos.length === 0) {
    return { total: 0, insertados: 0, actualizados: 0 };
  }

  let insertados  = 0;
  let actualizados = 0;

  for (const v of videos) {
    const s          = v.statistics ?? {};
    const alcance    = s.reach          ?? 0;
    const repros     = s.play_count     ?? 0;
    const me_gusta   = s.like_count     ?? 0;
    const comentarios = s.comment_count ?? 0;
    const compartidos = s.share_count   ?? 0;
    const impresiones = s.impression_count ?? 0;
    const tasa_eng    = alcance > 0
      ? parseFloat((((me_gusta + comentarios + compartidos) / alcance) * 100).toFixed(4))
      : 0;

    const publicado = new Date(v.create_time * 1000).toISOString();

    const result = await pool.query(
      `INSERT INTO metricas_organicas (
        empresa, plataforma, post_id,
        tipo_contenido, descripcion, url_media, permalink, publicado_en,
        alcance, impresiones, me_gusta, comentarios, compartidos,
        guardados, reproducciones, tasa_engagement,
        actualizado_en
      ) VALUES (
        $1,'tiktok',$2,
        'VIDEO',$3,$4,$5,$6,
        $7,$8,$9,$10,$11,
        0,$12,$13,
        NOW()
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
        empresa, v.item_id,
        v.video_description ?? null,
        v.cover_image_url   ?? null,
        v.share_url         ?? null,
        publicado,
        alcance, impresiones, me_gusta, comentarios, compartidos,
        repros, tasa_eng,
      ]
    );

    if (result.rows[0]?.es_nuevo) insertados++;
    else actualizados++;
  }

  return { total: insertados + actualizados, insertados, actualizados };
}
