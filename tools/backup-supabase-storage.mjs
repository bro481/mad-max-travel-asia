import { createWriteStream, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const root = process.cwd();
const envPath = join(root, ".env.local");

function loadDotEnv(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

loadDotEnv(envPath);

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_BUCKET || "madmax-images";
const outputDir =
  process.env.SUPABASE_STORAGE_BACKUP_DIR ||
  join(root, "backups", `supabase-storage-${bucket}-${new Date().toISOString().slice(0, 10)}`);

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    [
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
      "Add them to .env.local, then run this command again.",
    ].join("\n"),
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${serviceRoleKey}`,
  apikey: serviceRoleKey,
  "Content-Type": "application/json",
};

async function list(prefix = "", offset = 0) {
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/list/${encodeURIComponent(bucket)}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        limit: 1000,
        offset,
        prefix,
        sortBy: { column: "name", order: "asc" },
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to list ${prefix || bucket}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function walk(prefix = "") {
  const entries = [];
  for (let offset = 0; ; offset += 1000) {
    const batch = await list(prefix, offset);
    entries.push(...batch);
    if (batch.length < 1000) break;
  }
  const files = [];
  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null && entry.metadata === null) {
      files.push(...(await walk(path)));
    } else {
      files.push(path);
    }
  }
  return files;
}

async function download(path) {
  const target = join(outputDir, path);
  if (existsSync(target)) return "skipped";
  const urlPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${urlPath}`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to download ${path}: ${response.status} ${await response.text()}`);
  }
  mkdirSync(dirname(target), { recursive: true });
  await pipeline(Readable.fromWeb(response.body), createWriteStream(target));
  return "downloaded";
}

mkdirSync(outputDir, { recursive: true });

console.log(`Backing up bucket "${bucket}" to ${outputDir}`);
const files = await walk();
console.log(`Found ${files.length} file(s).`);

let completed = 0;
let skipped = 0;
let downloaded = 0;
const concurrency = Number(process.env.SUPABASE_BACKUP_CONCURRENCY || 10);
let index = 0;

async function worker() {
  while (index < files.length) {
    const file = files[index++];
    const result = await download(file);
    completed += 1;
    if (result === "skipped") skipped += 1;
    else downloaded += 1;
    if (completed % 100 === 0 || completed === files.length) {
      console.log(
        `Processed ${completed}/${files.length} (downloaded ${downloaded}, skipped ${skipped})`,
      );
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));

console.log("Backup complete.");
