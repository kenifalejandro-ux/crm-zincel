/** client/src/services/metaAds.api.ts */

import api from "./api";

export async function getMetaEmpresa(): Promise<string | null> {
  try {
    const { data } = await api.get("/meta-ads/empresa");
    return data.empresa;
  } catch {
    return null;
  }
}

export async function previewMetaAds(empresa: string, desde: string, hasta: string) {
  const { data } = await api.get("/meta-ads/preview", { params: { empresa, desde, hasta } });
  return data as { total: number; campanas: { campaign_name: string; spend: string; impressions: string }[] };
}

export async function syncMetaAds(empresa: string, desde: string, hasta: string) {
  const { data } = await api.post("/meta-ads/sync", { empresa, desde, hasta });
  return data as { ok: boolean; total: number; insertados: number; duplicados: number; campanas: string[] };
}
