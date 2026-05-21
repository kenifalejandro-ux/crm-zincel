/** src/server/config/queue.ts — BullMQ queue definitions */

import { Queue, Worker, type Job, type ConnectionOptions } from "bullmq";
import { env } from "./env";
import { logger } from "./logger";

function getConnection(): ConnectionOptions | null {
  if (env.redisUrl) return { url: env.redisUrl };
  if (env.redisHost) return {
    host:     env.redisHost,
    port:     env.redisPort,
    password: env.redisPassword || undefined,
  };
  return null;
}

export const connection = getConnection();

export interface MetaAdsSyncJob {
  empresa: string;
  desde:   string;
  hasta:   string;
}

let metaAdsQueue: Queue<MetaAdsSyncJob> | null = null;

export function getMetaAdsQueue(): Queue<MetaAdsSyncJob> | null {
  if (!connection) return null;
  if (!metaAdsQueue) {
    metaAdsQueue = new Queue<MetaAdsSyncJob>("meta-ads-sync", {
      connection,
      defaultJobOptions: {
        attempts:    3,
        backoff:     { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 50 },
        removeOnFail:     { count: 20 },
      },
    });
    logger.info("Queue meta-ads-sync iniciada");
  }
  return metaAdsQueue;
}

let workerInstance: Worker | null = null;

export function startMetaAdsWorker(
  processor: (job: Job<MetaAdsSyncJob>) => Promise<unknown>
): void {
  if (!connection) {
    logger.warn("BullMQ desactivado — Redis no configurado");
    return;
  }
  if (workerInstance) return;

  workerInstance = new Worker<MetaAdsSyncJob>(
    "meta-ads-sync",
    processor,
    { connection, concurrency: 1 }
  );

  workerInstance.on("completed", (job) => {
    logger.info({ jobId: job.id, empresa: job.data.empresa }, "Meta Ads sync completado");
  });
  workerInstance.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "Meta Ads sync falló");
  });
}
