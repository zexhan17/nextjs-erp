import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
    max: 20,
    idle_timeout: 10,
    connect_timeout: 30, // Neon serverless can take 20s+ to cold-start
    max_lifetime: 60 * 5,
    prepare: false, // Required for Neon's pooler (PgBouncer in transaction mode)
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
