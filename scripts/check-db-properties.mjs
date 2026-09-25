import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const root = process.cwd();
for (const file of [".env.local", ".env.production", ".env"]) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) continue;
  const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is missing. Real property data cannot load.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
  ssl: "require",
  max: 1,
  idle_timeout: 5,
  connect_timeout: 10,
});

try {
  const rows = await sql`
    select slug, name_zh, status, images
    from properties
    order by id asc
  `;
  const published = rows.filter((row) => row.status === "published");
  const withImages = published.filter((row) => {
    try {
      const images = JSON.parse(row.images || "[]");
      return Array.isArray(images) && images.length > 0;
    } catch {
      return false;
    }
  });

  console.log(`properties: ${rows.length} total, ${published.length} published, ${withImages.length} published with images`);
  for (const row of published.slice(0, 8)) {
    let count = 0;
    let sample = "";
    try {
      const images = JSON.parse(row.images || "[]");
      count = Array.isArray(images) ? images.length : 0;
      sample = count ? String(images[0]).slice(0, 90) : "";
    } catch {}
    console.log(`- ${row.slug} | ${row.name_zh} | images=${count}${sample ? ` | ${sample}` : ""}`);
  }

  if (!published.length) {
    console.error("ERROR: No published properties found. Homepage would have no real rooms.");
    process.exit(1);
  }
  if (!withImages.length) {
    console.error("ERROR: Published properties exist, but none have images.");
    process.exit(1);
  }
} finally {
  await sql.end({ timeout: 5 });
}
