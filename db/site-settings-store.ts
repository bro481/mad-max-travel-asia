/* eslint-disable react-hooks/rules-of-hooks */
import { env } from "cloudflare:workers";

const createSql = `CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export async function ensureSiteSettings() {
  await env.DB.prepare(createSql).run();
}

export async function readSiteSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    await ensureSiteSettings();
    const row = await env.DB.prepare("SELECT value FROM site_settings WHERE key=?")
      .bind(key)
      .first<{ value: string }>();
    return row?.value ? ({ ...fallback, ...JSON.parse(row.value) } as T) : fallback;
  } catch (error) {
    console.error(`Failed to read site setting ${key}`, error);
    return fallback;
  }
}

export async function writeSiteSetting(key: string, value: unknown) {
  await ensureSiteSettings();
  await env.DB.prepare(
    "INSERT INTO site_settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP",
  )
    .bind(key, JSON.stringify(value))
    .run();
}

