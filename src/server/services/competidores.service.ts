/** src/server/services/competidores.service.ts
 *
 *  Benchmark de competidores vía Facebook Graph API.
 *  Lee métricas públicas de páginas de Facebook (seguidores, fan_count, info básica).
 *  No requiere Page Public Content Access — solo datos de perfil público.
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

export interface PageInfo {
  pagina_id:   string;
  nombre:      string;
  seguidores:  number;
  fan_count:   number;
  categoria:   string | null;
  descripcion: string | null;
  imagen_url:  string | null;
  url_pagina:  string | null;
}

/** Extrae el slug o ID de una URL de Facebook o lo usa tal cual */
function extraerSlug(input: string): string {
  try {
    const url = new URL(input.startsWith("http") ? input : `https://facebook.com/${input}`);
    // https://facebook.com/profile.php?id=123456
    const profileId = url.searchParams.get("id");
    if (profileId) return profileId;
    // https://facebook.com/PageName o /pages/PageName/123456
    const parts = url.pathname.replace(/^\//, "").split("/").filter(Boolean);
    return parts[parts.length - 1] || input;
  } catch {
    return input.trim();
  }
}

export async function lookupPaginaFacebook(urlOrId: string, empresa: string): Promise<PageInfo> {
  const token = await resolverToken(empresa);
  const slug  = extraerSlug(urlOrId);
  try {
    return await fetchPageInfo(slug, token);
  } catch (err: any) {
    throw new Error(`No se pudo obtener la página: ${err.response?.data?.error?.message ?? err.message}`);
  }
}

export async function fetchPageInfo(pageId: string, token: string): Promise<PageInfo> {
  const { data } = await axios.get(`${GRAPH}/${pageId}`, {
    params: {
      fields:       "id,name,followers_count,fan_count,category,about,picture.type(large),link",
      access_token: token,
    },
  });
  return {
    pagina_id:   data.id,
    nombre:      data.name,
    seguidores:  data.followers_count ?? 0,
    fan_count:   data.fan_count       ?? 0,
    categoria:   data.category        ?? null,
    descripcion: data.about           ?? null,
    imagen_url:  data.picture?.data?.url ?? null,
    url_pagina:  data.link            ?? `https://facebook.com/${data.id}`,
  };
}

export async function agregarCompetidor(empresa: string, pageId: string): Promise<any> {
  const token = await resolverToken(empresa);
  const info  = await fetchPageInfo(pageId, token);

  const { rows } = await pool.query(
    `INSERT INTO competidores (empresa, plataforma, pagina_id, nombre, url_pagina, imagen_url, categoria, descripcion)
     VALUES ($1, 'facebook', $2, $3, $4, $5, $6, $7)
     ON CONFLICT (empresa, plataforma, pagina_id) DO UPDATE SET
       nombre      = EXCLUDED.nombre,
       imagen_url  = EXCLUDED.imagen_url,
       categoria   = EXCLUDED.categoria,
       descripcion = EXCLUDED.descripcion,
       activo      = true
     RETURNING *`,
    [empresa, info.pagina_id, info.nombre, info.url_pagina, info.imagen_url, info.categoria, info.descripcion]
  );

  await pool.query(
    `INSERT INTO competidores_snapshots (competidor_id, fecha, seguidores, fan_count)
     VALUES ($1, CURRENT_DATE, $2, $3)
     ON CONFLICT (competidor_id, fecha) DO UPDATE SET seguidores = EXCLUDED.seguidores, fan_count = EXCLUDED.fan_count`,
    [rows[0].id, info.seguidores, info.fan_count]
  );

  return { ...rows[0], seguidores: info.seguidores, fan_count: info.fan_count };
}

/** Agrega un competidor con datos ingresados manualmente (sin llamada a Meta API) */
export async function agregarCompetidorManual(
  empresa: string,
  nombre: string,
  seguidores: number,
  urlPagina?: string
): Promise<any> {
  const slug = `manual_${nombre.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 60)}`;

  const { rows } = await pool.query(
    `INSERT INTO competidores (empresa, plataforma, pagina_id, nombre, url_pagina)
     VALUES ($1, 'facebook', $2, $3, $4)
     ON CONFLICT (empresa, plataforma, pagina_id) DO UPDATE SET
       nombre     = EXCLUDED.nombre,
       url_pagina = EXCLUDED.url_pagina,
       activo     = true
     RETURNING *`,
    [empresa, slug, nombre, urlPagina || null]
  );

  await pool.query(
    `INSERT INTO competidores_snapshots (competidor_id, fecha, seguidores, fan_count)
     VALUES ($1, CURRENT_DATE, $2, $2)
     ON CONFLICT (competidor_id, fecha) DO UPDATE SET
       seguidores = EXCLUDED.seguidores, fan_count = EXCLUDED.fan_count`,
    [rows[0].id, seguidores]
  );

  return { ...rows[0], seguidores };
}

/** Registra un nuevo snapshot de seguidores para un competidor existente */
export async function actualizarSeguidores(id: string, seguidores: number): Promise<void> {
  await pool.query(
    `INSERT INTO competidores_snapshots (competidor_id, fecha, seguidores, fan_count)
     VALUES ($1, CURRENT_DATE, $2, $2)
     ON CONFLICT (competidor_id, fecha) DO UPDATE SET
       seguidores = EXCLUDED.seguidores, fan_count = EXCLUDED.fan_count`,
    [id, seguidores]
  );
}

export async function syncCompetidores(empresa: string) {
  const token = await resolverToken(empresa);

  const { rows: competidores } = await pool.query(
    `SELECT * FROM competidores WHERE empresa ILIKE $1 AND activo = true`,
    [empresa]
  );

  let ok = 0; let errores = 0;
  for (const c of competidores) {
    try {
      const info = await fetchPageInfo(c.pagina_id, token);

      // Actualizar info base
      await pool.query(
        `UPDATE competidores SET nombre = $1, imagen_url = $2, categoria = $3 WHERE id = $4`,
        [info.nombre, info.imagen_url, info.categoria, c.id]
      );

      // Upsert snapshot de hoy
      await pool.query(
        `INSERT INTO competidores_snapshots (competidor_id, fecha, seguidores, fan_count)
         VALUES ($1, CURRENT_DATE, $2, $3)
         ON CONFLICT (competidor_id, fecha) DO UPDATE SET
           seguidores = EXCLUDED.seguidores, fan_count = EXCLUDED.fan_count`,
        [c.id, info.seguidores, info.fan_count]
      );
      ok++;
    } catch {
      errores++;
    }
  }
  return { total: competidores.length, ok, errores };
}

export async function listarCompetidores(empresa: string) {
  const { rows } = await pool.query(
    `SELECT c.*,
       s.seguidores,
       s.fan_count,
       s.fecha AS ultimo_snapshot,
       -- crecimiento 30 días
       s.seguidores - COALESCE(s30.seguidores, s.seguidores) AS crecimiento_30d,
       -- crecimiento 7 días
       s.seguidores - COALESCE(s7.seguidores, s.seguidores)  AS crecimiento_7d
     FROM competidores c
     LEFT JOIN LATERAL (
       SELECT * FROM competidores_snapshots WHERE competidor_id = c.id ORDER BY fecha DESC LIMIT 1
     ) s ON true
     LEFT JOIN LATERAL (
       SELECT * FROM competidores_snapshots WHERE competidor_id = c.id AND fecha <= CURRENT_DATE - 30 ORDER BY fecha DESC LIMIT 1
     ) s30 ON true
     LEFT JOIN LATERAL (
       SELECT * FROM competidores_snapshots WHERE competidor_id = c.id AND fecha <= CURRENT_DATE - 7 ORDER BY fecha DESC LIMIT 1
     ) s7 ON true
     WHERE c.empresa ILIKE $1
     ORDER BY s.seguidores DESC NULLS LAST`,
    [empresa]
  );
  return rows;
}

export async function historiaCompetidor(id: string, dias = 90) {
  const { rows } = await pool.query(
    `SELECT fecha, seguidores, fan_count
     FROM competidores_snapshots
     WHERE competidor_id = $1 AND fecha >= CURRENT_DATE - $2
     ORDER BY fecha ASC`,
    [id, dias]
  );
  return rows;
}
