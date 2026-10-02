import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

declare global {
  var __RentItOutPool: Pool | undefined;
}

function shouldUseSsl(
  connectionString: string,
  readBoolean: (value: string | undefined, fallback: boolean) => boolean,
) {
  if (process.env.DB_SSL !== undefined && process.env.DB_SSL.trim() !== "") {
    return readBoolean(process.env.DB_SSL, false);
  }

  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get("sslmode")?.toLowerCase();
    if (sslmode === "require" || sslmode === "verify-ca" || sslmode === "verify-full") {
      return true;
    }
    if (sslmode === "disable") {
      return false;
    }

    const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    return host !== "localhost" && host !== "127.0.0.1" && host !== "::1";
  } catch {
    return false;
  }
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

  const isProduction = process.env.NODE_ENV === "production";
  const defaultPoolMax = isProduction ? 20 : 10;
  const poolMax = readPositiveInt(process.env.DB_POOL_MAX, defaultPoolMax);
  const defaultPoolMin = isProduction ? 2 : 0;
  const poolMin = Math.min(readNonNegativeInt(process.env.DB_POOL_MIN, defaultPoolMin), poolMax);
  const idleTimeoutMillis = readNonNegativeInt(process.env.DB_POOL_IDLE_TIMEOUT_MS, 10000);
  const connectionTimeoutMillis = readNonNegativeInt(process.env.DB_POOL_CONNECT_TIMEOUT_MS, 5000);
  const maxUses = readPositiveInt(process.env.DB_POOL_MAX_USES, 0);
  const useSsl = shouldUseSsl(connectionString, readBoolean);
  const sslRejectUnauthorized = readBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, true);

  const pool = new Pool({
    connectionString,
    max: poolMax,
    min: poolMin,
    idleTimeoutMillis,
    connectionTimeoutMillis,
    ...(maxUses > 0 ? { maxUses } : {}),
    ...(useSsl ? { ssl: { rejectUnauthorized: sslRejectUnauthorized } } : {}),
  });

  // Required for node-postgres pools in long-running processes.
  // Without this, idle client disconnects can surface as uncaught exceptions
  // and crash the worker process.
  pool.on("error", (error) => {
    console.error("[db] Unexpected idle client error", error);
  });

  return pool;
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
