#!/usr/bin/env node
/**
 * Load .env.local (simple KEY=value lines) and run: prisma db execute --file <path>
 * Usage: node scripts/run-sql-file.mjs supabase/migrations/foo.sql
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sqlRel = process.argv[2];
if (!sqlRel) {
  console.error("Usage: node scripts/run-sql-file.mjs <path-to.sql>");
  process.exit(1);
}

const sqlPath = path.isAbsolute(sqlRel) ? sqlRel : path.join(root, sqlRel);
if (!fs.existsSync(sqlPath)) {
  console.error("File not found:", sqlPath);
  process.exit(1);
}

const envPath = path.join(root, ".env.local");
const env = { ...process.env };
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

if (!env.DATABASE_URL) {
  console.error("DATABASE_URL not found in .env.local or environment.");
  process.exit(1);
}

const r = spawnSync(
  "npx",
  ["prisma", "db", "execute", "--file", sqlPath, "--schema", "prisma/schema.prisma"],
  { cwd: root, env, stdio: "inherit" },
);

process.exit(r.status ?? 1);
