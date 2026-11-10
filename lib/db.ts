import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não está configurada.");
}

const useSsl = process.env.POSTGRES_SSL === "true";

declare global {
  var __postgresPool: Pool | undefined;
}

export const pool =
  global.__postgresPool ??
  new Pool({
    connectionString,
    ssl: useSsl
      ? {
          rejectUnauthorized: false,
        }
      : false,
    max: 10,
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== "production") {
  global.__postgresPool = pool;
}

export async function query<
  T extends Record<string, unknown> = Record<string, unknown>,
>(text: string, params?: unknown[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const res = await client.query<T>(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}
