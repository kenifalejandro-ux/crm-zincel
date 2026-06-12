/** src/server/services/googleAds.service.ts */

import axios from "axios";
import { env } from "../config/env";
import { pool } from "../config/database";
import { obtenerCuentaPorEmpresaYPlataforma, registrarSync } from "./plataformaCuentas.service";

const GOOGLE_ADS_API = "https://googleads.googleapis.com/v17";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

export class GoogleAdsTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleAdsTokenError";
  }
}

interface GoogleAdsCredentials {
  accessToken:  string;
  customerId:   string;
  developerToken: string;
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const { data } = await axios.post(OAUTH_TOKEN_URL, {
    client_id:     env.googleClientId,
    client_secret: env.googleClientSecret,
    refresh_token: refreshToken,
    grant_type:    "refresh_token",
  });
  if (!data.access_token) throw new GoogleAdsTokenError("No se pudo renovar el access token de Google Ads");
  return data.access_token;
}

async function resolverCredenciales(empresa: string): Promise<GoogleAdsCredentials> {
  const cuenta = await obtenerCuentaPorEmpresaYPlataforma(empresa, "google");
  if (cuenta) {
    // El access_token guardado es en realidad el refresh_token para Google
    const accessToken = await refreshAccessToken(cuenta.access_token);
    return {
      accessToken,
      customerId:    cuenta.account_id.replace(/-/g, ""),
      developerToken: env.googleDeveloperToken,
    };
  }

  if (!env.googleDeveloperToken || !env.googleRefreshToken || !env.googleCustomerId) {
    throw new Error("No hay credenciales de Google Ads configuradas. Agrega la cuenta en Configuración.");
  }

  const accessToken = await refreshAccessToken(env.googleRefreshToken);
  return {
    accessToken,
    customerId:    env.googleCustomerId.replace(/-/g, ""),
    developerToken: env.googleDeveloperToken,
  };
}

interface GoogleCampaignRow {
  campaign_id:   string;
  campaign_name: string;
  impressions:   number;
  clicks:        number;
  cost_micros:   number;
  conversions:   number;
  start_date:    string;
  end_date:      string;
}

export async function previewGoogleAdsInsights(
  empresa: string, desde: string, hasta: string
): Promise<GoogleCampaignRow[]> {
  const { accessToken, customerId, developerToken } = await resolverCredenciales(empresa);

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      campaign.start_date,
      campaign.end_date
    FROM campaign
    WHERE segments.date BETWEEN '${desde}' AND '${hasta}'
      AND campaign.status != 'REMOVED'
  `;

  const { data } = await axios.post(
    `${GOOGLE_ADS_API}/customers/${customerId}/googleAds:searchStream`,
    { query },
    {
      headers: {
        Authorization:          `Bearer ${accessToken}`,
        "developer-token":      developerToken,
        "login-customer-id":    customerId,
        "Content-Type":         "application/json",
      },
    }
  );

  const rows: GoogleCampaignRow[] = [];
  for (const batch of (Array.isArray(data) ? data : [data])) {
    for (const result of (batch.results ?? [])) {
      rows.push({
        campaign_id:   result.campaign?.id   ?? "",
        campaign_name: result.campaign?.name ?? "Sin nombre",
        impressions:   Number(result.metrics?.impressions   ?? 0),
        clicks:        Number(result.metrics?.clicks        ?? 0),
        cost_micros:   Number(result.metrics?.costMicros    ?? 0),
        conversions:   Number(result.metrics?.conversions   ?? 0),
        start_date:    result.campaign?.startDate ?? desde,
        end_date:      result.campaign?.endDate   ?? hasta,
      });
    }
  }

  return rows;
}

export async function syncGoogleAdsService(empresa: string, desde: string, hasta: string) {
  let insights: GoogleCampaignRow[];
  try {
    insights = await previewGoogleAdsInsights(empresa, desde, hasta);
  } catch (err: any) {
    await registrarSync(empresa, "google", err.message);
    throw err;
  }

  let insertados = 0;
  let duplicados = 0;

  for (const ins of insights) {
    const gasto = ins.cost_micros / 1_000_000;
    const cpc   = ins.clicks > 0  ? parseFloat((gasto / ins.clicks).toFixed(2))       : 0;
    const cpm   = ins.impressions > 0 ? parseFloat((gasto / ins.impressions * 1000).toFixed(2)) : 0;
    const ctr   = ins.impressions > 0 ? parseFloat((ins.clicks / ins.impressions * 100).toFixed(4)) : 0;
    const cpa   = ins.conversions > 0 ? parseFloat((gasto / ins.conversions).toFixed(2)) : 0;

    const result = await pool.query(
      `INSERT INTO campana_metricas (
        empresa, campana_nombre, plataforma, sub_plataforma,
        periodo_inicio, periodo_fin,
        impresiones, clics, ctr,
        gasto, cpc, cpm, cpa,
        conversiones,
        notas
      ) VALUES (
        $1,$2,'google',NULL,
        $3,$4,
        $5,$6,$7,
        $8,$9,$10,$11,
        $12,
        $13
      )
      ON CONFLICT DO NOTHING
      RETURNING id`,
      [
        empresa, ins.campaign_name,
        ins.start_date, ins.end_date,
        ins.impressions, ins.clicks, ctr,
        gasto, cpc, cpm, cpa,
        ins.conversions,
        `Importado Google Ads · ID: ${ins.campaign_id}`,
      ]
    );

    if (result.rowCount && result.rowCount > 0) insertados++;
    else duplicados++;
  }

  await registrarSync(empresa, "google", null);
  return {
    total:    insights.length,
    insertados,
    duplicados,
    campanas: insights.map(i => i.campaign_name),
  };
}

export function obtenerUrlAutorizacionGoogle(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id:     env.googleClientId,
    redirect_uri:  redirectUri,
    response_type: "code",
    scope:         "https://www.googleapis.com/auth/adwords",
    access_type:   "offline",
    prompt:        "consent",
    state:         "zincel_crm_google",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function intercambiarCodigoGoogle(code: string, redirectUri: string): Promise<string> {
  const { data } = await axios.post(OAUTH_TOKEN_URL, {
    code,
    client_id:     env.googleClientId,
    client_secret: env.googleClientSecret,
    redirect_uri:  redirectUri,
    grant_type:    "authorization_code",
  });
  if (!data.refresh_token) throw new Error("Google no devolvió refresh_token. Asegúrate de usar prompt=consent.");
  return data.refresh_token;
}
