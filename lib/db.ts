// lib/db.ts
// Prisma 7 runtime client — uses pg adapter.
// The CLI gets its URL from prisma.config.ts → datasource.url
// The runtime client gets it here via PrismaPg adapter.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // Prevent multiple instances during Next.js Hot Module Replacement
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set.\n" +
      "Create a .env file with: DATABASE_URL=\"postgresql://user:pass@host:5432/votex_db\""
    );
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Reduced max from 10 → 5 in production.
    // In serverless environments each function instance creates its own pool,
    // so many concurrent cold-starts could exhaust PostgreSQL's connection limit.
    // Use a database-level connection pooler (PgBouncer / Neon pooler) for
    // true serverless scale; this just prevents runaway local exhaustion.
    max: process.env.NODE_ENV === "production" ? 5 : 3,
    // Release idle connections within 30 s so they don't linger after traffic spikes.
    idleTimeoutMillis: 30_000,
    // Fail fast (2 s) rather than letting the request hang if the DB is unreachable.
    connectionTimeoutMillis: 2_000,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

export const prisma: PrismaClient =
  global.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

export default prisma;