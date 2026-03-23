#!/usr/bin/env node
/**
 * Seed mock published packs from local audio files.
 *
 * Usage:
 *   node scripts/seed-mock-packs.mjs --creator-email you@site.com --source SamplePacks
 * Optional:
 *   --limit-per-pack 30
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnvFile(path.join(root, ".env.local"));

const args = process.argv.slice(2);
function arg(name, fallback = "") {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  return args[i + 1] ?? fallback;
}

const creatorEmail = arg("--creator-email", "").trim().toLowerCase();
const sourceRel = arg("--source", "SamplePacks");
const limitPerPack = Number(arg("--limit-per-pack", "30")) || 30;

if (!creatorEmail) {
  console.error("Missing required --creator-email");
  process.exit(1);
}

const sourceDir = path.isAbsolute(sourceRel) ? sourceRel : path.join(root, sourceRel);
if (!fs.existsSync(sourceDir)) {
  console.error("Source folder not found:", sourceDir);
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const prisma = new PrismaClient();
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function slugify(v) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function walkAudioFiles(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkAudioFiles(abs, out);
      continue;
    }
    const lower = e.name.toLowerCase();
    if (lower.endsWith(".wav") || lower.endsWith(".mp3") || lower.endsWith(".aiff") || lower.endsWith(".aif")) {
      out.push(abs);
    }
  }
  return out;
}

function mimeByExt(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".aiff") || lower.endsWith(".aif")) return "audio/aiff";
  return "audio/wav";
}

function publicUrl(bucket, objectPath) {
  const p = objectPath.replace(/^\/+/, "");
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${p}`;
}

async function main() {
  const creator = await prisma.user.findFirst({
    where: { email: { equals: creatorEmail, mode: "insensitive" } },
    select: { id: true, email: true },
  });
  if (!creator) {
    throw new Error(`Creator user not found for email: ${creatorEmail}`);
  }

  await prisma.profileMarketplace.upsert({
    where: { id: creator.id },
    create: {
      id: creator.id,
      isCreator: true,
      creatorDisplayName: creator.email.split("@")[0] || "Creator",
    },
    update: { isCreator: true },
  });

  const topLevel = fs
    .readdirSync(sourceDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  if (topLevel.length === 0) {
    throw new Error(`No folders found in ${sourceDir}`);
  }

  let createdPacks = 0;
  let createdSamples = 0;

  for (const folderName of topLevel) {
    const folderPath = path.join(sourceDir, folderName);
    const files = walkAudioFiles(folderPath).slice(0, limitPerPack);
    if (files.length === 0) continue;

    const title = folderName.replace(/[_-]+/g, " ").trim();
    const existing = await prisma.samplePack.findFirst({
      where: { creatorId: creator.id, title },
      select: { id: true },
    });
    if (existing) {
      console.log(`Skipping existing pack: ${title}`);
      continue;
    }

    const pack = await prisma.samplePack.create({
      data: {
        creatorId: creator.id,
        title,
        description: `Mock imported from ${sourceRel}/${folderName}`,
        genre: "Ambient",
        tags: ["mock", "test"],
        isPublished: true,
        priceCents: 1499,
      },
      select: { id: true },
    });

    let sortOrder = 0;
    for (const abs of files) {
      const id = crypto.randomUUID();
      const ext = path.extname(abs).replace(/^\./, "").toLowerCase() || "wav";
      const masterPath = `${pack.id}/${id}.${ext}`;
      const previewPath = `${pack.id}/${id}_preview.${ext}`;
      const file = fs.readFileSync(abs);
      const contentType = mimeByExt(abs);

      const upMaster = await supabase.storage
        .from("sample-files")
        .upload(masterPath, file, { contentType, upsert: false });
      if (upMaster.error) throw new Error(`master upload failed: ${upMaster.error.message}`);

      const upPreview = await supabase.storage
        .from("sample-previews")
        .upload(previewPath, file, { contentType, upsert: false });
      if (upPreview.error) throw new Error(`preview upload failed: ${upPreview.error.message}`);

      const fileName = path.basename(abs).replace(/[/\\]/g, "").slice(0, 220);
      await prisma.individualSample.create({
        data: {
          id,
          packId: pack.id,
          filename: fileName,
          originalFilename: fileName,
          fileUrl: masterPath,
          previewUrl: publicUrl("sample-previews", previewPath),
          sortOrder,
        },
      });
      sortOrder += 1;
      createdSamples += 1;
    }

    await prisma.samplePack.update({
      where: { id: pack.id },
      data: { sampleCount: sortOrder },
    });

    createdPacks += 1;
    console.log(`Created pack "${title}" (${sortOrder} samples)`);
  }

  console.log(`Done. Created packs: ${createdPacks}, samples: ${createdSamples}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
