/** src/server/services/tiktokAds.service.ts */

import axios from "axios";
import { env } from "../config/env";
import { pool } from "../config/database";
import { obtenerCuentaPorEmpresaYPlataforma, registrarSync } from "./plataformaCuentas.service";

const TIKTOK_API = "https://business-api.tiktok.com/open_api/v1.3";

export class TikTokTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TikTokTokenError";
  }
}

interface TikTokCampaign {
  campaign_id:   string;
  campaign_name: string;
  spend:         string;
  impressions:   string;
  clicks:        string;
  ctr:           string;
  cpc:           string;
  cpm:           string;
  reach:         string;
}

async function resolverCredenciales(empresa: string): Promise<{ token: string; advertiserId: string; cuentaId?: string }> {
  const cuenta = await obtenerCuentaPorEmpresaYPlataforma(empresa, "tiktok");
  if (cuenta) {
    if (cuenta.token_vence_en) {
      const vence = new Date(cuenta.token_vence_en);
      if (vence < new Date()) {
        throw new TikTokTokenError(`El token de TikTok para ${empresa} ha vencido. Renuévalo en Configuración.`);
      }
    }
    return { token: cuenta.access_token, advertiserId: cuenta.account_id, cuentaId: cuenta.id };
  }

  const token        = env.tiktokAccessToken;
  const advertiserId = env.tiktokAdvertiserId;
  if (!token || !advertiserId) throw new Error("No hay credenciales de TikTok Ads configuradas para esta empresa");
  return { token, advertiserId };
}

function detectarErrorToken(code: number): boolean {
  // TikTok error codes relacionados con tokens inválidos/vencidos
  return [40001, 40004, 40103, 40105].includes(code);
}

async function fetchNombresCampanas(token: string, advertiserId: string, ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  try {
    const { data } = await axios.get(`${TIKTOK_API}/campaign/get/`, {
      headers: { "Access-Token": token },
      params: { advertiser_id: advertiserId, campaign_ids: JSON.stringify(ids), page_size: 100 },
    });
    for (const c of (data.data?.list ?? [])) {
      map.set(String(c.campaign_id), c.campaign_name ?? `Campaña ${c.campaign_id}`);
    }
  } catch {}
  return map;
}

export async function previewTikTokInsights(empresa: string, desde: string, hasta: string): Promise<TikTokCampaign[]> {
  const { token, advertiserId } = await resolverCredenciales(empresa);

  const { data } = await axios.get(`${TIKTOK_API}/report/integrated/get/`, {
    headers: { "Access-Token": token },
    params: {
      advertiser_id: advertiserId,
      report_type:   "BASIC",
      data_level:    "AUCTION_CAMPAIGN",
      dimensions:    JSON.stringify(["campaign_id"]),
      metrics:       JSON.stringify(["spend", "impressions", "clicks", "ctr", "cpc", "cpm", "reach"]),
      start_date:    desde,
      end_date:      hasta,
      page_size:     100,
    },
  });

  if (data.code !== 0) {
    if (detectarErrorToken(data.code)) {
      throw new TikTokTokenError(`TikTok API (${data.code}): ${data.message}`);
    }
    throw new Error(`TikTok API: ${data.message} (código ${data.code})`);
  }

  const lista: any[] = data.data?.list ?? [];
  const ids = lista.map((i: any) => String(i.dimensions?.campaign_id ?? "")).filter(Boolean);
  const nombres = await fetchNombresCampanas(token, advertiserId, ids);

  return lista.map((item: any) => {
    const id = String(item.dimensions?.campaign_id ?? "");
    return {
      campaign_id:   id,
      campaign_name: nombres.get(id) ?? `Campaña ${id}`,
      spend:         item.metrics?.spend       ?? "0",
      impressions:   item.metrics?.impressions ?? "0",
      clicks:        item.metrics?.clicks      ?? "0",
      ctr:           item.metrics?.ctr         ?? "0",
      cpc:           item.metrics?.cpc         ?? "0",
      cpm:           item.metrics?.cpm         ?? "0",
      reach:         item.metrics?.reach       ?? "0",
    };
  });
}

export async function syncTikTokAdsService(empresa: string, desde: string, hasta: string) {
  const insights = await previewTikTokInsights(empresa, desde, hasta);

  let insertados = 0;
  let duplicados = 0;

  for (const ins of insights) {
    const gasto       = parseFloat(ins.spend)       || 0;
    const clics       = parseFloat(ins.clicks)      || 0;
    const impresiones = parseFloat(ins.impressions) || 0;
    const alcance     = parseFloat(ins.reach)       || 0;
    const ctr         = parseFloat(ins.ctr)         || 0;
    const cpc         = parseFloat(ins.cpc)         || 0;
    const cpm         = parseFloat(ins.cpm)         || 0;

    const result = await pool.query(
      `INSERT INTO campana_metricas (
        empresa, campana_nombre, plataforma, sub_plataforma,
        periodo_inicio, periodo_fin,
        impresiones, alcance, clics, ctr,
        gasto, cpc, cpm, cpa,
        conversiones, leads, mensajes, roas, roi, costo_por_lead,
        seguidores_ganados, perfil_visitas, frecuencia,
        interacciones,
        me_gusta, comentarios, compartidos, guardados, tasa_engagement,
        costo_por_mensaje, reproducciones, tasa_reproduccion,
        moneda_gasto, notas, platform_campaign_id
      ) VALUES (
        $1,$2,'tiktok',NULL,
        $3,$4,
        $5,$6,$7,$8,
        $9,$10,$11,0,
        0,0,0,0,0,0,
        0,0,0,
        0,
        0,0,0,0,0,
        0,0,0,
        'USD',$12,$13
      )
      ON CONFLICT (empresa, plataforma, platform_campaign_id, periodo_inicio, periodo_fin)
        WHERE platform_campaign_id IS NOT NULL
      DO UPDATE SET
        impresiones  = EXCLUDED.impresiones,
        alcance      = EXCLUDED.alcance,
        clics        = EXCLUDED.clics,
        ctr          = EXCLUDED.ctr,
        gasto        = EXCLUDED.gasto,
        cpc          = EXCLUDED.cpc,
        cpm          = EXCLUDED.cpm,
        actualizado_en = NOW()
      RETURNING id, (xmax = 0) AS es_nuevo`,
      [
        empresa, ins.campaign_name,
        desde, hasta,
        impresiones, alcance, clics, ctr,
        gasto, cpc, cpm,
        `Importado TikTok Ads · ID: ${ins.campaign_id}`,
        ins.campaign_id,
      ]
    );

    if (result.rows[0]?.es_nuevo) insertados++;
    else duplicados++;
  }

  await registrarSync(empresa, "tiktok", null);
  return { total: insights.length, insertados, duplicados, campanas: insights.map(i => i.campaign_name) };
}

export async function renovarTokenTikTok(empresa: string, authCode: string): Promise<string> {
  const appId     = env.tiktokAppId;
  const appSecret = env.tiktokAppSecret;
  if (!appId || !appSecret) throw new Error("No hay App ID o Secret de TikTok en el servidor");

  const { data } = await axios.post(`${TIKTOK_API}/oauth2/access_token/`, {
    app_id:    appId,
    secret:    appSecret,
    auth_code: authCode,
  });

  if (data.code !== 0) throw new Error(`TikTok OAuth: ${data.message} (${data.code})`);

  const nuevoToken = data.data?.access_token as string;

  // Actualizar en plataforma_cuentas
  await pool.query(
    `UPDATE plataforma_cuentas
     SET access_token = $1, token_vence_en = CURRENT_DATE + 1, activo = true, actualizado_en = NOW()
     WHERE empresa ILIKE $2 AND plataforma = 'tiktok'`,
    [nuevoToken, empresa]
  );

  return nuevoToken;
}

export function obtenerUrlAutorizacionTikTok(): string {
  const appId       = env.tiktokAppId;
  const redirectUri = encodeURIComponent("https://www.zincelideas.com/");
  return `https://business-api.tiktok.com/portal/auth?app_id=${appId}&state=zincel_crm&redirect_uri=${redirectUri}`;
}
