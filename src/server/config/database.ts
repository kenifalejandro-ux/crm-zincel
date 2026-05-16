/** src/server/config/database.ts */

import { Pool } from "pg";
import { env } from "./env";
import { logger } from "./logger";

export const pool = new Pool({
  host: env.dbHost,
  user: env.dbUser,
  password: env.dbPass,
  database: env.dbName,
  port: env.dbPort, // Ya es número, no necesita parseInt

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: env.isProduction ? { rejectUnauthorized: false } : false,
});


// ====================== EVENTOS DEL POOL ======================
pool.on("connect", () => {
  logger.debug("Nueva conexión establecida con PostgreSQL");
});

pool.on("error", (err) => {
  logger.error({ err }, "Error inesperado en el pool de PostgreSQL");
});

pool.on("remove", () => {
  logger.debug("Conexión removida del pool");
});

// ====================== FUNCIÓN DE TEST ======================
export async function testDatabaseConnection(): Promise<boolean> {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query("SELECT NOW() as current_time");
    
    logger.info({
      message: "✅ Conexión a PostgreSQL exitosa",
      timestamp: result.rows[0].current_time,
      database: env.dbName || "zincel_rp"

    });

    return true;
  } catch (error: any) {
    logger.error({
      err: error,
      message: "❌ Error al conectar con PostgreSQL",
      detail: error.message
    });
    return false;
  } finally {
    if (client) client.release();
  }
}

// ====================== FUNCIÓN PARA CERRAR ======================
export async function closeDatabase(): Promise<void> {
  try {
    await pool.end();
    logger.info("Pool de PostgreSQL cerrado correctamente");
  } catch (error) {
    logger.warn({ err: error }, "Error al cerrar el pool de PostgreSQL");
  }
}