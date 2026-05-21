/** src/server/workers/metaAds.worker.ts — processor del job de sync Meta Ads */

import type { Job } from "bullmq";
import type { MetaAdsSyncJob } from "../config/queue";
import { syncMetaAdsService } from "../services/metaAds.service";

export async function metaAdsSyncProcessor(job: Job<MetaAdsSyncJob>) {
  const { empresa, desde, hasta } = job.data;
  await job.updateProgress(10);
  const result = await syncMetaAdsService(empresa, desde, hasta);
  await job.updateProgress(100);
  return result;
}
