import api from "./api";

export async function previewTikTokAds(empresa: string, desde: string, hasta: string) {
  const { data } = await api.get("/tiktok-ads/preview", { params: { empresa, desde, hasta } });
  return data as { total: number; campanas: { campaign_name: string; spend: string }[] };
}

export async function syncTikTokAds(empresa: string, desde: string, hasta: string) {
  const { data } = await api.post("/tiktok-ads/sync", { empresa, desde, hasta });
  return data as { ok: boolean; total: number; insertados: number; duplicados: number; campanas: string[] };
}
