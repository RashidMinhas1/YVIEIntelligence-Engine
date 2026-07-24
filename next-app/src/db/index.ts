import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

let client: postgres.Sql | null = null;
let db: DbInstance | null = null;

export function getDb(): DbInstance {
  if (db) return db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set");
  }

  client = postgres(connectionString, { prepare: false });
  db = drizzle(client, { schema });
  return db;
}

export type DbType = DbInstance;
export * from "./schema";
