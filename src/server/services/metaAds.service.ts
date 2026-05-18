/** src/server/services/metaAds.service.ts */

import axios from "axios";
import { env } from "../config/env";
import { pool } from "../config/database";
import { obtenerCuentaPorEmpresaYPlataforma } from "./plataformaCuentas.service";

const GRAPH = "https://graph.facebook.com/v21.0";

interface MetaAction {
  action_type: string;
  value:       string;
}

interface MetaInsight {
  campaign_id:   string;
  campaign_name: string;
  impressions:   string;
  clicks:        string;
  reach:         string;
  spend:         string;
  cpm:           string;
  cpc:           string;
  ctr:           string;
  frequency:     string;
  date_start:    string;
  date_stop:     string;
  actions?:      MetaAction[];
  action_values?: MetaAction[];
}

interface MetaCampaignDate {
  id:         string;
  start_time: string;
  stop_time?: string;
}

function n(val?: string): number {
  return parseFloat(val ?? "0") || 0;
}

function extraerAccion(actions: MetaAction[] | undefined, tipos: string[]): number {
  if (!actions) return 0;
  return actions
    .filter(a => tipos.includes(a.action_type))
    .reduce((sum, a) => sum + parseFloat(a.value), 0);
}

async function fetchPaginas(url: string, params: Record<string, string>): Promise<MetaInsight[]> {
  const resultados: MetaInsight[] = [];
  let nextUrl: string | null = null;

  try {
    const { data } = await axios.get(url, { params });

    if (data.error) {
      throw new Error(`Meta API: ${data.error.message} (código ${data.error.code})`);
    }

    resultados.push(...(data.data ?? []));
    nextUrl = data.paging?.next ?? null;

    while (nextUrl) {
      const { data: page } = await axios.get(nextUrl);
      resultados.push(...(page.data ?? []));
      nextUrl = page.paging?.next ?? null;
    }
  } catch (err: any) {
    const metaMsg = err.response?.data?.error?.message;
    const metaCod = err.response?.data?.error?.code;
    if (metaMsg) {
      throw new Error(`Meta API (${metaCod}): ${metaMsg}`);
    }
    throw err;
  }

  return resultados;
}


async function resolverCredenciales(empresa?: string): Promise<{ token: string; acct: string }> {
  if (empresa) {
    const cuenta = await obtenerCuentaPorEmpresaYPlataforma(empresa, "meta");
    if (cuenta) return { token: cuenta.access_token, acct: cuenta.account_id };
  }
  const token = env.metaAccessToken;
  const acct  = env.metaAdAccountId;
  if (!token || !acct) throw new Error("No hay credenciales de Meta configuradas para esta empresa");
  return { token, acct };
}

export async function previewMetaInsights(empresa: string, desde: string, hasta: string): Promise<MetaInsight[]> {
  const { token, acct } = await resolverCredenciales(empresa);

  return fetchPaginas(`${GRAPH}/act_${acct}/insights`, {
    fields:       "campaign_id,campaign_name,impressions,clicks,reach,spend,cpm,cpc,ctr,frequency,actions,action_values",
    time_range:   JSON.stringify({ since: desde, until: hasta }),
    level:        "campaign",
    access_token: token,
    limit:        "100",
  });
}

async function fetchCampaignDates(acct: string, token: string, hasta: string): Promise<Map<string, { start: string; stop: string }>> {
  const map = new Map<string, { start: string; stop: string }>();
  try {
    const { data } = await axios.get(`${GRAPH}/act_${acct}/campaigns`, {
      params: {
        fields:       "id,start_time,stop_time",
        access_token: token,
        limit:        "100",
      },
    });
    for (const c of (data.data ?? [])) {
      const start = c.start_time ? c.start_time.split("T")[0] : null;
      const stop  = c.stop_time  ? c.stop_time.split("T")[0]  : hasta;
      if (start) map.set(c.id, { start, stop: stop ?? hasta });
    }
  } catch {}
  return map;
}

export async function syncMetaAdsService(empresa: string, desde: string, hasta: string) {
  const { token, acct } = await resolverCredenciales(empresa);
  const insights = await previewMetaInsights(empresa, desde, hasta);

  const campaignDates = await fetchCampaignDates(acct, token, hasta);

  let insertados = 0;
  let duplicados = 0;

  for (const ins of insights) {
    const LEAD_TYPES         = ["lead", "offsite_conversion.fb_pixel_lead", "onsite_conversion.lead_grouped"];
    const MSG_TYPES          = ["onsite_conversion.messaging_conversation_started_7d"];
    const CONV_TYPES         = ["offsite_conversion.fb_pixel_purchase", "purchase"];
    const INGRESO_TYPES      = ["offsite_conversion.fb_pixel_purchase"];
    const INTERACCION_TYPES  = ["post_engagement"];

    const leads          = extraerAccion(ins.actions,       LEAD_TYPES);
    const mensajes       = extraerAccion(ins.actions,       MSG_TYPES);
    const conversiones   = extraerAccion(ins.actions,       CONV_TYPES);
    const ingresos       = extraerAccion(ins.action_values, INGRESO_TYPES);
    const interacciones  = extraerAccion(ins.actions,       INTERACCION_TYPES);

    const gasto      = n(ins.spend);
    const clics      = n(ins.clicks);
    const impresiones = n(ins.impressions);
    const alcance    = n(ins.reach);
    const cpm        = n(ins.cpm);
    const cpc        = n(ins.cpc);
    const ctr        = n(ins.ctr);
    const frecuencia = n(ins.frequency);
    const cpa        = leads > 0 ? parseFloat((gasto / leads).toFixed(2)) : 0;
    const roas       = gasto > 0 ? parseFloat((ingresos / gasto).toFixed(2)) : 0;
    const costo_por_lead    = leads > 0     ? parseFloat((gasto / leads).toFixed(2))    : 0;
    const costo_por_mensaje = mensajes > 0  ? parseFloat((gasto / mensajes).toFixed(2)) : 0;

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
        $1,$2,'meta',NULL,
        $3,$4,
        $5,$6,$7,$8,
        $9,$10,$11,$12,
        $13,$14,$15,$16,0,$17,
        0,0,$18,
        $19,
        0,0,0,0,0,
        $20,0,0,
        $21
      )
      ON CONFLICT DO NOTHING
      RETURNING id`,
      [
        empresa, ins.campaign_name,
        campaignDates.get(ins.campaign_id)?.start ?? ins.date_start,
        campaignDates.get(ins.campaign_id)?.stop  ?? ins.date_stop,
        impresiones, alcance, clics, ctr,
        gasto, cpc, cpm, cpa,
        conversiones, leads, mensajes, roas, costo_por_lead,
        frecuencia,
        interacciones,
        costo_por_mensaje,
        `Importado Meta Ads · ID: ${ins.campaign_id}`,
      ]
    );

    if (result.rowCount && result.rowCount > 0) insertados++;
    else duplicados++;
  }

  return {
    total:     insights.length,
    insertados,
    duplicados,
    campanas:  insights.map(i => i.campaign_name),
  };
}
