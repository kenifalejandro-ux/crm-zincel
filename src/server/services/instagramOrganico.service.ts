/** src/server/services/instagramOrganico.service.ts
 *
 *  Sincroniza posts orgánicos de Instagram via Meta Graph API.
 *  Requiere que la cuenta tenga permisos: instagram_basic + instagram_manage_insights
 *  Flujo: token Meta (Page) → Instagram Business Account → media + insights por post
 */

import axios from "axios";
import { pool } from "../config/database";
import { obtenerCuentaPorEmpresaYPlataforma, registrarSync } from "./plataformaCuentas.service";
import { env } from "../config/env";

const GRAPH = "https://graph.facebook.com/v21.0";

export interface PostOrganico {
  post_id:          string;
  tipo_contenido:   string;
  descripcion:      string | null;
  url_media:        string | null;
  permalink:        string | null;
  publicado_en:     string;
  alcance:          number;
  impresiones:      number;
  me_gusta:         number;
  comentarios:      number;
  compartidos:      number;
  guardados:        number;
  reproducciones:   number;
  watch_time_seg:   number;
  tasa_engagement:  number;
}

async function resolverToken(empresa: string): Promise<string> {
  const cuenta = await obtenerCuentaPorEmpresaYPlataforma(empresa, "meta");
  if (cuenta) return cuenta.access_token;
  if (env.metaAccessToken) return env.metaAccessToken;
  throw new Error("No hay token de Meta configurado para esta empresa");
}

async function obtenerIgUserId(token: string): Promise<string | null> {
  try {
    const { data } = await axios.get(`${GRAPH}/me/accounts`, {
      params: { fields: "id,name,instagram_business_account", access_token: token },
    });
    for (const page of (data.data ?? [])) {
      if (page.instagram_business_account?.id) {
        return page.instagram_business_account.id as string;
      }
    }

    // Fallback: intentar directamente con /me?fields=instagram_business_account
    const { data: meData } = await axios.get(`${GRAPH}/me`, {
      params: { fields: "instagram_business_account", access_token: token },
    });
    if (meData.instagram_business_account?.id) {
      return meData.instagram_business_account.id;
    }
  } catch {}
  return null;
}

async function fetchInsightPost(postId: string, token: string, mediaType: string): Promise<Partial<PostOrganico>> {
  const isVideo = mediaType === "VIDEO" || mediaType === "REELS";

  // video_views deprecado en v18+ para reels; usamos total_interactions como engagement
  const metrics = isVideo
    ? ["reach", "impressions", "saved", "total_interactions", "video_views"]
    : ["reach", "impressions", "saved", "total_interactions"];

  try {
    const { data } = await axios.get(`${GRAPH}/${postId}/insights`, {
      params: { metric: metrics.join(","), access_token: token },
    });

    const map: Record<string, number> = {};
    for (const item of (data.data ?? [])) {
      map[item.name] = item.values?.[0]?.value ?? item.value ?? 0;
    }

    return {
      alcance:         map["reach"]               ?? 0,
      impresiones:     map["impressions"]         ?? 0,
      guardados:       map["saved"]               ?? 0,
      reproducciones:  map["video_views"]         ?? 0,
      tasa_engagement: map["total_interactions"]  ?? 0,
    };
  } catch {
    // Si insights falla (post antiguo o tipo no soportado), retornar vacío sin fallar todo el sync
    return {};
  }
}

export async function previewInstagramOrganico(empresa: string, limit = 50): Promise<PostOrganico[]> {
  const token    = await resolverToken(empresa);
  const igUserId = await obtenerIgUserId(token);
  if (!igUserId) throw new Error(
    "No se encontró cuenta de Instagram Business. Verifica que: " +
    "1) La página de Facebook tiene una cuenta de Instagram Business vinculada, " +
    "2) El token tiene permiso instagram_manage_insights."
  );

  const { data } = await axios.get(`${GRAPH}/${igUserId}/media`, {
    params: {
      fields:       "id,media_type,caption,media_url,permalink,timestamp,like_count,comments_count",
      access_token: token,
      limit,
    },
  });

  const posts: PostOrganico[] = [];
  for (const post of (data.data ?? [])) {
    const insights = await fetchInsightPost(post.id, token, post.media_type ?? "IMAGE");
    posts.push({
      post_id:         post.id,
      tipo_contenido:  post.media_type ?? "IMAGE",
      descripcion:     post.caption    ?? null,
      url_media:       post.media_url  ?? null,
      permalink:       post.permalink  ?? null,
      publicado_en:    post.timestamp,
      alcance:         insights.alcance      ?? 0,
      impresiones:     insights.impresiones  ?? 0,
      me_gusta:        post.like_count       ?? 0,
      comentarios:     post.comments_count   ?? 0,
      compartidos:     0,
      guardados:       insights.guardados    ?? 0,
      reproducciones:  insights.reproducciones ?? 0,
      watch_time_seg:  insights.watch_time_seg ?? 0,
      tasa_engagement: insights.tasa_engagement ?? 0,
    });
  }

  return posts;
}

export async function syncInstagramOrganicoService(empresa: string, limit = 50) {
  let posts: PostOrganico[];
  try {
    posts = await previewInstagramOrganico(empresa, limit);
  } catch (err: any) {
    await registrarSync(empresa, "meta", err.message).catch(() => {});
    throw err;
  }

  let insertados = 0;
  let actualizados = 0;

  for (const p of posts) {
    const result = await pool.query(
      `INSERT INTO metricas_organicas (
        empresa, plataforma, post_id,
        tipo_contenido, descripcion, url_media, permalink, publicado_en,
        alcance, impresiones, me_gusta, comentarios, compartidos,
        guardados, reproducciones, watch_time_seg, tasa_engagement,
        actualizado_en
      ) VALUES (
        $1,'instagram',$2,
        $3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,
        $13,$14,$15,$16,
        NOW()
      )
      ON CONFLICT (empresa, plataforma, post_id) DO UPDATE SET
        alcance          = EXCLUDED.alcance,
        impresiones      = EXCLUDED.impresiones,
        me_gusta         = EXCLUDED.me_gusta,
        comentarios      = EXCLUDED.comentarios,
        guardados        = EXCLUDED.guardados,
        reproducciones   = EXCLUDED.reproducciones,
        tasa_engagement  = EXCLUDED.tasa_engagement,
        actualizado_en   = NOW()
      RETURNING (xmax = 0) AS es_nuevo`,
      [
        empresa, p.post_id,
        p.tipo_contenido, p.descripcion, p.url_media, p.permalink, p.publicado_en,
        p.alcance, p.impresiones, p.me_gusta, p.comentarios, p.compartidos,
        p.guardados, p.reproducciones, p.watch_time_seg, p.tasa_engagement,
      ]
    );

    if (result.rows[0]?.es_nuevo) insertados++;
    else actualizados++;
  }

  return { total: posts.length, insertados, actualizados };
}
