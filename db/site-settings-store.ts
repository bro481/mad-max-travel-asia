/* eslint-disable react-hooks/rules-of-hooks */
import { env } from "cloudflare:workers";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const localDirectory = path.join(process.cwd(), ".local-preview");
const localFile = path.join(localDirectory, "site-settings.json");

async function readLocalSettings() {
  try {
    return JSON.parse(await readFile(localFile, "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function writeLocalSetting(key: string, value: unknown) {
  await mkdir(localDirectory, { recursive: true });
  const current = await readLocalSettings();
  current[key] = value;
  await writeFile(localFile, JSON.stringify(current, null, 2), "utf8");
}

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
    if (process.env.NODE_ENV === "development") {
      const local = (await readLocalSettings())[key];
      return local ? ({ ...fallback, ...(local as object) } as T) : fallback;
    }
    return fallback;
  }
}

export async function writeSiteSetting(key: string, value: unknown) {
  try {
    await ensureSiteSettings();
    await env.DB.prepare(
      "INSERT INTO site_settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP",
    )
      .bind(key, JSON.stringify(value))
      .run();
  } catch (error) {
    if (process.env.NODE_ENV !== "development") throw error;
    console.warn(`Using local preview storage for site setting ${key}`);
    await writeLocalSetting(key, value);
  }
}
