/** src/server/services/metaOAuth.service.ts
 *
 *  OAuth 2.0 para Meta (Facebook + Instagram).
 *  Flujo: auth-url → Facebook login → callback → token largo (60d) → BD.
 */

import axios from "axios";
import { pool } from "../config/database";
import { env } from "../config/env";

const GRAPH = "https://graph.facebook.com/v19.0";

const SCOPES = [
  "ads_read",
  "ads_management",
  "business_management",
  "pages_show_list",
  "pages_read_engagement",
  "pages_read_user_content",
].join(",");

export function obtenerUrlAutorizacionMeta(empresa: string, from = "configuracion"): string {
  const { metaAppId, metaOAuthRedirectUri } = env;
  if (!metaAppId) throw new Error("Falta META_APP_ID en .env");

  const stateStr = `${empresa}|||${from}`;
  const params = new URLSearchParams({
    client_id:     metaAppId,
    redirect_uri:  metaOAuthRedirectUri,
    scope:         SCOPES,
    response_type: "code",
    state:         encodeURIComponent(stateStr),
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
}

export async function intercambiarCodigoMeta(code: string, empresa: string): Promise<void> {
  const { metaAppId, metaAppSecret, metaOAuthRedirectUri } = env;

  // 1. Obtener token de corta duración
  const { data: shortData } = await axios.get(`${GRAPH}/oauth/access_token`, {
    params: {
      client_id:     metaAppId,
      client_secret: metaAppSecret,
      redirect_uri:  metaOAuthRedirectUri,
      code,
    },
  });

  if (shortData.error) {
    throw new Error(`Meta OAuth error: ${shortData.error.message}`);
  }

  // 2. Convertir a token de larga duración (~60 días)
  const { data: longData } = await axios.get(`${GRAPH}/oauth/access_token`, {
    params: {
      grant_type:        "fb_exchange_token",
      client_id:         metaAppId,
      client_secret:     metaAppSecret,
      fb_exchange_token: shortData.access_token,
    },
  });

  const accessToken = longData.access_token ?? shortData.access_token;
  const expiresIn   = longData.expires_in ?? 5184000; // 60 días por defecto
  const expiresAt   = new Date(Date.now() + expiresIn * 1000);

  // 3. Obtener el Ad Account ID de esta cuenta
  let adAccountId: string | null = null;
  try {
    const { data: accs } = await axios.get(`${GRAPH}/me/adaccounts`, {
      params: { fields: "id,name,account_id", access_token: accessToken, limit: 5 },
    });
    if (accs.data?.length) {
      adAccountId = accs.data[0].id; // act_XXXXXXXXXX
    }
  } catch {}

  // 4. Guardar en plataforma_cuentas (upsert por empresa+plataforma)
  await pool.query(
    `INSERT INTO plataforma_cuentas
       (empresa, plataforma, account_id, access_token, token_vence_en, activo, actualizado_en)
     VALUES ($1, 'meta', $2, $3, $4, true, NOW())
     ON CONFLICT (empresa, plataforma) DO UPDATE SET
       access_token   = EXCLUDED.access_token,
       account_id     = COALESCE(EXCLUDED.account_id, plataforma_cuentas.account_id),
       token_vence_en = EXCLUDED.token_vence_en,
       activo         = true,
       actualizado_en = NOW()`,
    [empresa, adAccountId, accessToken, expiresAt]
  );
}

export async function estadoMetaOAuth(empresa: string): Promise<{ conectado: boolean; vence_en?: string }> {
  const { rows } = await pool.query(
    `SELECT token_vence_en FROM plataforma_cuentas
     WHERE empresa ILIKE $1 AND plataforma = 'meta' AND activo = true`,
    [empresa]
  );
  if (!rows[0]) return { conectado: false };
  return { conectado: true, vence_en: rows[0].token_vence_en };
}
