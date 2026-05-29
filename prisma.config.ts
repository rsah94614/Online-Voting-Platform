// prisma.config.ts  (project root)
// Prisma 7 — connection URL and seed command live here, NOT in schema.prisma.

import path from "node:path";
import { defineConfig } from "prisma/config";
import { loadEnvFile } from "node:process";

// Load .env file
loadEnvFile();

export default defineConfig({
  // Removed `earlyAccess` — not a valid property on PrismaConfig.
  schema: path.join("prisma", "schema.prisma"),

  // ── Database connection (replaces `url` in schema.prisma) ─────────────────
  datasource: {
    url: process.env.DATABASE_URL,
  },

  // ── Seed command ──────────────────────────────────────────────────────────
  migrations: {
    seed: "ts-node --compiler-options {\"module\":\"CommonJS\"} seed.ts",
  },
});