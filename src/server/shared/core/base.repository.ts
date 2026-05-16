/**src/server/shared/core/base.repository.ts */

import { pool } from "../../config/database";
import type { Pool, PoolClient } from "pg";

export class BaseRepository {
  protected pool: Pool;

  constructor() {
    this.pool = pool;
  }

  protected async query<T = any>(sql: string, values?: any[]): Promise<T[]> {
    const result = await this.pool.query(sql, values);
    return result.rows;
  }

  protected async queryOne<T = any>(sql: string, values?: any[]): Promise<T | null> {
    const result = await this.pool.query(sql, values);
    return result.rows[0] ?? null;
  }

  protected async execute(sql: string, values?: any[]): Promise<number> {
    const result = await this.pool.query(sql, values);
    return result.rowCount ?? 0;
  }

  protected async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}