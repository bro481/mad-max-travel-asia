import { env } from "cloudflare:workers";
import { ensureInquiries } from "./inquiries";

export type ReferrerStatus = "active" | "inactive";

export type ReferrerRecord = {
  id: number;
  code: string;
  name: string;
  status: ReferrerStatus;
  visits: number;
  inquiries: number;
  createdAt: string;
  updatedAt: string;
};

type ReferrerRow = Record<string, unknown> & { inquiry_count?: number };

const createSql = `CREATE TABLE IF NOT EXISTS referrers (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 code TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'active',
 visits INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export async function ensureReferrers() {
  await env.DB.prepare(createSql).run();
}

function mapReferrer(row: Record<string, unknown>, inquiries = 0): ReferrerRecord {
  return {
    id: Number(row.id),
    code: String(row.code),
    name: String(row.name),
    status: String(row.status || "active") === "inactive" ? "inactive" : "active",
    visits: Number(row.visits || 0),
    inquiries,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at || row.created_at),
  };
}

export async function listReferrers() {
  await ensureReferrers();
  await ensureInquiries();
  const rows = await env.DB.prepare(
    `SELECT r.*,
      COALESCE((
        SELECT COUNT(*) FROM inquiry_requests i WHERE i.referrer_id = r.code
      ), 0) AS inquiry_count
     FROM referrers r
     ORDER BY CAST(SUBSTR(r.code, 2) AS INTEGER), r.id`,
  ).all();
  return rows.results.map((row) => {
    const item = row as ReferrerRow;
    return mapReferrer(item, Number(item.inquiry_count || 0));
  });
}

export async function getReferrerByCode(code: string) {
  await ensureReferrers();
  const row = await env.DB.prepare("SELECT * FROM referrers WHERE code=?")
    .bind(normalizeReferrerCode(code))
    .first();
  return row ? mapReferrer(row as Record<string, unknown>) : null;
}

export async function getActiveReferrer(code: string) {
  const referrer = await getReferrerByCode(code);
  return referrer?.status === "active" ? referrer : null;
}

export async function getReferrerWithStats(code: string) {
  await ensureReferrers();
  await ensureInquiries();
  const row = await env.DB.prepare(
    `SELECT r.*,
      COALESCE((
        SELECT COUNT(*) FROM inquiry_requests i WHERE i.referrer_id = r.code
      ), 0) AS inquiry_count
     FROM referrers r
     WHERE r.code=?`,
  )
    .bind(normalizeReferrerCode(code))
    .first();
  return row
    ? mapReferrer(row as ReferrerRow, Number((row as ReferrerRow).inquiry_count || 0))
    : null;
}

export async function createReferrer(name: string) {
  await ensureReferrers();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Driver name is required");
  const code = await nextReferrerCode();
  await env.DB.prepare("INSERT INTO referrers (code,name,status) VALUES (?,?,'active')")
    .bind(code, trimmed)
    .run();
  return getReferrerWithStats(code);
}

export async function updateReferrer(
  code: string,
  input: { name?: string; status?: ReferrerStatus },
) {
  await ensureReferrers();
  const current = await getReferrerByCode(code);
  if (!current) return null;
  const name = input.name?.trim() || current.name;
  const status = input.status === "inactive" ? "inactive" : "active";
  await env.DB.prepare(
    "UPDATE referrers SET name=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE code=?",
  )
    .bind(name, status, current.code)
    .run();
  return getReferrerWithStats(current.code);
}

export async function incrementReferrerVisit(code: string) {
  const referrer = await getActiveReferrer(code);
  if (!referrer) return null;
  await env.DB.prepare(
    "UPDATE referrers SET visits=visits+1,updated_at=CURRENT_TIMESTAMP WHERE code=?",
  )
    .bind(referrer.code)
    .run();
  return getReferrerWithStats(referrer.code);
}

export async function validateReferrerForInquiry(code?: string) {
  if (!code) return null;
  return getActiveReferrer(code);
}

export function normalizeReferrerCode(code: string) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
}

async function nextReferrerCode() {
  const row = await env.DB.prepare(
    "SELECT code FROM referrers WHERE code LIKE 'A%' ORDER BY CAST(SUBSTR(code, 2) AS INTEGER) DESC LIMIT 1",
  ).first<{ code: string }>();
  const last = row?.code?.match(/^A(\d+)$/);
  const next = last ? Number(last[1]) + 1 : 1;
  return `A${String(next).padStart(2, "0")}`;
}
