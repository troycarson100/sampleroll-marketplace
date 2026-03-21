#!/usr/bin/env node
/**
 * Finds a working Supabase *session pooler* DATABASE_URL (IPv4-friendly) when
 * direct `db.<ref>.supabase.co` fails with Prisma P1001 on IPv4-only networks.
 *
 * Reads `.env.local` for:
 * - NEXT_PUBLIC_SUPABASE_URL → project ref
 * - DATABASE_URL → postgres user password (must be URL-encoded in file, e.g. ! → %21)
 *
 * Usage: node scripts/supabase-pooler-probe.mjs
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");

function parseEnvLocal(text) {
  const out = {};
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function projectRefFromSupabaseUrl(url) {
  try {
    const host = new URL(url).hostname;
    const m = host.match(/^([^.]+)\.supabase\.co$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function passwordFromDatabaseUrl(databaseUrl) {
  try {
    const u = new URL(databaseUrl);
    return decodeURIComponent(u.password || "");
  } catch {
    return "";
  }
}

const regions = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "ca-central-1",
  "sa-east-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "eu-central-2",
  "eu-north-1",
  "eu-south-1",
  "ap-south-1",
  "ap-south-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-southeast-3",
  "ap-southeast-4",
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-northeast-3",
  "me-central-1",
  "me-south-1",
  "il-central-1",
  "af-south-1",
];

// Prefer aws-1 — many East US (N. Virginia) projects use aws-1-us-east-1 (see `npm run db:pooler-host`).
const prefixes = [
  "aws-1",
  "aws-0",
  "aws-2",
  "fly-0",
  "fly-1",
  "gcp-0",
  "azure-0",
];

let envText;
try {
  envText = readFileSync(envPath, "utf8");
} catch {
  console.error("Missing .env.local at project root.");
  process.exit(1);
}

const env = parseEnvLocal(envText);
const ref =
  projectRefFromSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL || "") ||
  process.env.SUPABASE_PROJECT_REF;
const plainPassword =
  passwordFromDatabaseUrl(env.DATABASE_URL || "") ||
  process.env.SUPABASE_DB_PASSWORD;

if (!ref || !plainPassword) {
  console.error(
    "Need NEXT_PUBLIC_SUPABASE_URL and a DATABASE_URL with postgres password in .env.local\n" +
      "(or set SUPABASE_PROJECT_REF and SUPABASE_DB_PASSWORD).",
  );
  process.exit(1);
}

const encPw = encodeURIComponent(plainPassword);
let tried = 0;

for (const p of prefixes) {
  for (const r of regions) {
    const host = `${p}-${r}.pooler.supabase.com`;
    const databaseUrl = `postgresql://postgres.${ref}:${encPw}@${host}:5432/postgres?sslmode=require`;
    tried += 1;
    try {
      execFileSync(
        "npx",
        ["prisma", "db", "execute", "--stdin"],
        {
          cwd: root,
          input: "SELECT 1;\n",
          env: { ...process.env, DATABASE_URL: databaseUrl },
          stdio: ["pipe", "pipe", "pipe"],
          timeout: 4000,
        },
      );
      console.log("\n✅ Working session pooler host:", host);
      console.log("\nSet in .env.local:\n");
      console.log(`DATABASE_URL="${databaseUrl}"`);
      console.log("\nThen: npm run db:ping && restart npm run dev\n");
      process.exit(0);
    } catch (e) {
      const err = Buffer.concat(
        [e.stderr, e.stdout].filter(Boolean),
      ).toString();
      if (err.includes("Script executed successfully")) {
        console.log("\n✅ Working session pooler host:", host);
        console.log(`DATABASE_URL="${databaseUrl}"`);
        process.exit(0);
      }
    }
  }
}

console.error(
  `No session pooler match after ${tried} tries.\n` +
    "Copy the **Session pooler** URI from Supabase → **Connect** (session mode, port 5432) and paste it as DATABASE_URL.",
);
process.exit(1);
