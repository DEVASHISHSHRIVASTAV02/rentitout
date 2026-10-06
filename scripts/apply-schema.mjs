import fs from "fs/promises";
import path from "path";
import process from "process";
import pg from "pg";

const { Pool } = pg;

function parseEnvFile(content) {
  const parsed = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const equalsIndex = line.indexOf("=");
    if (equalsIndex <= 0) {
      continue;
    }
    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

async function loadDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) {
    return process.env.DATABASE_URL.trim();
  }

  for (const relativeFile of [".env.local"]) {
    try {
      const content = await fs.readFile(path.join(process.cwd(), relativeFile), "utf8");
      const parsed = parseEnvFile(content);
      if (parsed.DATABASE_URL?.trim()) {
        return parsed.DATABASE_URL.trim();
      }
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }
  }

  throw new Error("DATABASE_URL is not set. Add it to .env.local first.");
}

function useSsl(connectionString) {
  const url = new URL(connectionString);
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return host !== "localhost" && host !== "127.0.0.1" && host !== "::1";
}

async function main() {
  const connectionString = await loadDatabaseUrl();
  const schemaPath = path.join(process.cwd(), "db", "schema.sql");
  const schemaSql = await fs.readFile(schemaPath, "utf8");
  const pool = new Pool({
    connectionString,
    ...(useSsl(connectionString) ? { ssl: { rejectUnauthorized: false } } : {}),
  });

  try {
    await pool.query(schemaSql);
    const { rows } = await pool.query(
      "select tablename from pg_tables where schemaname = 'public' order by tablename",
    );
    console.log(`Schema applied. Public tables: ${rows.map((row) => row.tablename).join(", ")}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
