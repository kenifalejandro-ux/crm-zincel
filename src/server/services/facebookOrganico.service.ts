/** src/server/services/facebookOrganico.service.ts
 *
 *  Sincroniza posts orgánicos de páginas de Facebook via Meta Graph API.
 *  Requiere permiso: pages_read_engagement, pages_show_list
 *  Flujo: token usuario → /me/accounts (páginas) → posts → insights por post
 */

import axios from "axios";
import { pool } from "../config/database";
import { obtenerCuentaPorEmpresaYPlataforma } from "./plataformaCuentas.service";
import { env } from "../config/env";

const GRAPH = "https://graph.facebook.com/v21.0";

async function resolverToken(empresa: string): Promise<string> {
  const cuenta = await obtenerCuentaPorEmpresaYPlataforma(empresa, "meta");
  if (cuenta) return cuenta.access_token;
  if (env.metaAccessToken) return env.metaAccessToken;
  throw new Error("No hay token de Meta configurado para esta empresa");
}

interface FbPage {
  id:           string;
  name:         string;
  access_token: string;
}

async function obtenerPaginas(userToken: string): Promise<FbPage[]> {
  try {
    const { data } = await axios.get(`${GRAPH}/me/accounts`, {
      params: { fields: "id,name,access_token", access_token: userToken },
    });
    return data.data ?? [];
  } catch {
    return [];
  }
}

interface FbPostInsights {
  alcance:      number;
  impresiones:  number;
  interacciones: number;
  clics:        number;
  compartidos:  number;
}

async function fetchPostInsights(postId: string, pageToken: string): Promise<FbPostInsights> {
  try {
    const { data } = await axios.get(`${GRAPH}/${postId}/insights`, {
      params: {
        metric:       "post_impressions,post_reach,post_engaged_users,post_clicks,post_shares",
        access_token: pageToken,
      },
    });
    const map: Record<string, number> = {};
    for (const item of (data.data ?? [])) {
      map[item.name] = item.values?.[0]?.value ?? item.value ?? 0;
    }
    const compartidos = typeof map["post_shares"] === "object"
      ? (map["post_shares"] as any).count ?? 0
      : map["post_shares"] ?? 0;

    return {
      alcance:       map["post_reach"]          ?? 0,
      impresiones:   map["post_impressions"]    ?? 0,
      interacciones: map["post_engaged_users"]  ?? 0,
      clics:         map["post_clicks"]         ?? 0,
      compartidos,
    };
  } catch {
    return { alcance: 0, impresiones: 0, interacciones: 0, clics: 0, compartidos: 0 };
  }
}

export async function syncFacebookOrganicoService(empresa: string, limit = 30) {
  const userToken = await resolverToken(empresa);
  const paginas   = await obtenerPaginas(userToken);

  if (paginas.length === 0) {
    throw new Error("No se encontraron páginas de Facebook asociadas al token de Meta");
  }

  let insertados = 0;
  let actualizados = 0;

  for (const pagina of paginas) {
    // Posts de la página con imagen y reacciones
    let posts: any[] = [];
    try {
      // published_posts: solo posts publicados por la página, sin necesitar pages_read_engagement
      // reactions/comments se omiten porque requieren ese permiso extra
      const { data } = await axios.get(`${GRAPH}/${pagina.id}/published_posts`, {
        params: {
          fields:       "id,message,story,full_picture,permalink_url,created_time",
          access_token: pagina.access_token,
          limit,
        },
      });
      posts = data.data ?? [];
    } catch {
      continue;
    }

    for (const post of posts) {
      const insights    = await fetchPostInsights(post.id, pagina.access_token);
      // reactions/comments no disponibles sin pages_read_engagement — quedan en 0 hasta que se otorgue el permiso
      const me_gusta    = 0;
      const comentarios = 0;
      const tasa_eng    = insights.alcance > 0
        ? parseFloat(((insights.interacciones / insights.alcance) * 100).toFixed(4))
        : 0;

      const result = await pool.query(
        `INSERT INTO metricas_organicas (
          empresa, plataforma, post_id,
          tipo_contenido, descripcion, url_media, permalink, publicado_en,
          alcance, impresiones, me_gusta, comentarios, compartidos,
          guardados, reproducciones, tasa_engagement,
          actualizado_en
        ) VALUES (
          $1,'facebook',$2,
          'IMAGE',$3,$4,$5,$6,
          $7,$8,$9,$10,$11,
          0,0,$12,
          NOW()
        )
        ON CONFLICT (empresa, plataforma, post_id) DO UPDATE SET
          alcance         = EXCLUDED.alcance,
          impresiones     = EXCLUDED.impresiones,
          me_gusta        = EXCLUDED.me_gusta,
          comentarios     = EXCLUDED.comentarios,
          compartidos     = EXCLUDED.compartidos,
          tasa_engagement = EXCLUDED.tasa_engagement,
          actualizado_en  = NOW()
        RETURNING (xmax = 0) AS es_nuevo`,
        [
          empresa, post.id,
          post.message ?? post.story ?? null,
          post.full_picture ?? null,
          post.permalink_url ?? null,
          post.created_time,
          insights.alcance, insights.impresiones, me_gusta, comentarios, insights.compartidos,
          tasa_eng,
        ]
      );

      if (result.rows[0]?.es_nuevo) insertados++;
      else actualizados++;
    }
  }

  return { total: insertados + actualizados, insertados, actualizados, paginas: paginas.map(p => p.name) };
}
