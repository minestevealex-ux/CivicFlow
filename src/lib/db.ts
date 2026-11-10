import { Pool, PoolClient } from "pg";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}

export type DbRole =
  | "civicflow_citizen"
  | "civicflow_admin"
  | "civicflow_auth"
  | "civicflow_search"
  | "civicflow_embedding";

type DbContext = {
  userId?: number | null;
  loginEmail?: string;
};

export async function withDbRole<T>(
  role: DbRole,
  context: DbContext,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(`SET LOCAL ROLE ${role}`);

    if (context.userId !== undefined && context.userId !== null) {
      await client.query(
        "SELECT set_config('app.citizen_id', $1, true)",
        [String(context.userId)]
      );
    }

    if (context.loginEmail) {
      await client.query(
        "SELECT set_config('app.login_email', $1, true)",
        [context.loginEmail]
      );
    }

    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
