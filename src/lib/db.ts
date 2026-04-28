import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

declare global {
  var __RentItOutPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL");
  }

  const readPositiveInt = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(value ?? "", 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return parsed;
  };

  const readNonNegativeInt = (value: string | undefined, fallback: number) => {
    const parsed = Number.parseInt(value ?? "", 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return fallback;
    }
    return parsed;
  };

  const readBoolean = (value: string | undefined, fallback: boolean) => {
    if (!value) {
      return fallback;
    }
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }
    return fallback;
  };

  const defaultPoolMax = 10;
  const poolMax = readPositiveInt(process.env.DB_POOL_MAX, defaultPoolMax);
  const poolMin = Math.min(readNonNegativeInt(process.env.DB_POOL_MIN, 0), poolMax);
  const idleTimeoutMillis = readNonNegativeInt(process.env.DB_POOL_IDLE_TIMEOUT_MS, 10000);
  const connectionTimeoutMillis = readNonNegativeInt(process.env.DB_POOL_CONNECT_TIMEOUT_MS, 5000);
  const maxUses = readPositiveInt(process.env.DB_POOL_MAX_USES, 0);
  const sslRejectUnauthorized = readBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false);

  return new Pool({
    connectionString,
    max: poolMax,
    min: poolMin,
    idleTimeoutMillis,
    connectionTimeoutMillis,
    ...(maxUses > 0 ? { maxUses } : {}),
    ssl:
      process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: sslRejectUnauthorized,
          }
        : undefined,
  });
}

export function getPool() {
  if (!global.__RentItOutPool) {
    global.__RentItOutPool = createPool();
  }
  return global.__RentItOutPool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<DbQueryResult<T>> {
  return getPool().query<T>(text, values);
}

export async function withTransaction<T>(handler: (client: PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await handler(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function queryWithClient<T extends QueryResultRow>(
  client: PoolClient,
  text: string,
  values: unknown[] = [],
): Promise<DbQueryResult<T>> {
  return client.query<T>(text, values);
}

export type DbQueryResult<T extends QueryResultRow> = QueryResult<T>;
