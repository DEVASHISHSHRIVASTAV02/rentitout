import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

declare global {
  var __RentItOutPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL");
  }

  return new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === "production"
        ? {
            rejectUnauthorized: false,
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
