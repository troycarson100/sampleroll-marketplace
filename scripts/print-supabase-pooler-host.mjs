#!/usr/bin/env node
/**
 * Prints the session pooler host Supabase CLI uses for the linked project.
 * Run from project root (requires `supabase link` and `supabase login`):
 *
 *   node scripts/print-supabase-pooler-host.mjs
 *
 * Then set DATABASE_URL using the Session pooler URI from the dashboard Connect
 * panel, or build:
 *   postgresql://postgres.<PROJECT_REF>:<DB_PASSWORD>@<HOST>:5432/postgres?sslmode=require
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const cwd = join(root, "..");

const r = spawnSync(
  "supabase",
  ["inspect", "db", "table-stats", "--linked", "--debug"],
  { cwd, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
);

const out = `${r.stderr || ""}\n${r.stdout || ""}`;
const m = out.match(
  /Using connection pooler:\s*(postgresql:\/\/[^\s]+)/,
);
if (!m) {
  console.error(
    "Could not find pooler URL. Is the project linked?\n" +
      "  supabase link --project-ref <ref>\n" +
      "Also ensure you are logged in: supabase login",
  );
  if (r.status !== 0) console.error(r.stderr || r.stdout);
  process.exit(1);
}

const poolerBase = m[1];
console.log("Supabase CLI pooler (no password shown):");
console.log(poolerBase);
console.log(
  "\nCopy the full Session pooler URI from Dashboard → Connect, or append your DB password to the URI above.",
);
