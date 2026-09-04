import { env } from "cloudflare:workers";

const mediaTableSql = `CREATE TABLE IF NOT EXISTS media_objects (
  key TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  body_base64 TEXT NOT NULL,
  original_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export async function putDatabaseMedia(key: string, body: ArrayBuffer, contentType: string, originalName = "") {
  await env.DB.prepare(mediaTableSql).run();
  await env.DB.prepare(
    `INSERT INTO media_objects (key, content_type, body_base64, original_name)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (key) DO UPDATE SET
       content_type = excluded.content_type,
       body_base64 = excluded.body_base64,
       original_name = excluded.original_name`,
  )
    .bind(key, contentType, arrayBufferToBase64(body), originalName)
    .run();
}

export async function getDatabaseMedia(key: string) {
  await env.DB.prepare(mediaTableSql).run();
  const row = await env.DB.prepare(
    "SELECT content_type, body_base64 FROM media_objects WHERE key=?",
  )
    .bind(key)
    .first<{ content_type: string; body_base64: string }>();
  if (!row) return null;
  return { body: base64ToBytes(row.body_base64), contentType: row.content_type };
}
