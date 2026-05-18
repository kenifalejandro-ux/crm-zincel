/** src/server/services/tiktokAds.service.ts */

import axios from "axios";
import { env } from "../config/env";
import { pool } from "../config/database";
import { obtenerCuentaPorEmpresaYPlataforma } from "./plataformaCuentas.service";

const TIKTOK_API = "https://business-api.tiktok.com/open_api/v1.3";

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

async function resolverCredenciales(empresa: string): Promise<{ token: string; advertiserId: string }> {
  const cuenta = await obtenerCuentaPorEmpresaYPlataforma(empresa, "tiktok");
  if (cuenta) return { token: cuenta.access_token, advertiserId: cuenta.account_id };

  const token       = env.tiktokAccessToken;
  const advertiserId = env.tiktokAdvertiserId;
  if (!token || !advertiserId) throw new Error("No hay credenciales de TikTok Ads configuradas para esta empresa");
  return { token, advertiserId };
}

export async function previewTikTokInsights(empresa: string, desde: string, hasta: string): Promise<TikTokCampaign[]> {
  const { token, advertiserId } = await resolverCredenciales(empresa);

  const { data } = await axios.get(`${TIKTOK_API}/report/integrated/get/`, {
    headers: { "Access-Token": token },
    params: {
      advertiser_id: advertiserId,
      report_type:   "BASIC",
      data_level:    "AUCTION_CAMPAIGN",
      dimensions:    JSON.stringify(["campaign_id", "campaign_name"]),
      metrics:       JSON.stringify(["spend", "impressions", "clicks", "ctr", "cpc", "cpm", "reach"]),
      start_date:    desde,
      end_date:      hasta,
      page_size:     100,
    },
  });

  if (data.code !== 0) {
    throw new Error(`TikTok API: ${data.message} (código ${data.code})`);
  }

  return (data.data?.list ?? []).map((item: any) => ({
    campaign_id:   item.dimensions?.campaign_id   ?? "",
    campaign_name: item.dimensions?.campaign_name ?? "",
    spend:         item.metrics?.spend            ?? "0",
    impressions:   item.metrics?.impressions      ?? "0",
    clicks:        item.metrics?.clicks           ?? "0",
    ctr:           item.metrics?.ctr              ?? "0",
    cpc:           item.metrics?.cpc              ?? "0",
    cpm:           item.metrics?.cpm              ?? "0",
    reach:         item.metrics?.reach            ?? "0",
  }));
}

export async function syncTikTokAdsService(empresa: string, desde: string, hasta: string) {
  const insights = await previewTikTokInsights(empresa, desde, hasta);

  let insertados = 0;
  let duplicados = 0;

  for (const ins of insights) {
    const gasto      = parseFloat(ins.spend)       || 0;
    const clics      = parseFloat(ins.clicks)      || 0;
    const impresiones = parseFloat(ins.impressions) || 0;
    const alcance    = parseFloat(ins.reach)       || 0;
    const ctr        = parseFloat(ins.ctr)         || 0;
    const cpc        = parseFloat(ins.cpc)         || 0;
    const cpm        = parseFloat(ins.cpm)         || 0;

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
        notas
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
        $12
      )
      ON CONFLICT DO NOTHING
      RETURNING id`,
      [
        empresa, ins.campaign_name,
        desde, hasta,
        impresiones, alcance, clics, ctr,
        gasto, cpc, cpm,
        `Importado TikTok Ads · ID: ${ins.campaign_id}`,
      ]
    );

    if (result.rowCount && result.rowCount > 0) insertados++;
    else duplicados++;
  }

  return { total: insights.length, insertados, duplicados, campanas: insights.map(i => i.campaign_name) };
}
