import { env } from "cloudflare:workers";

export type InquiryRecord = {
  id: number;
  name: string;
  contact: string;
  destinations: string[];
  services: string[];
  travelTime: string;
  message: string;
  status: string;
  source: string;
  country: string;
  language: string;
  people: number;
  children: number;
  rooms: number;
  budget: string;
  tags: string[];
  nextFollowUp: string;
  followups: Record<string, unknown>[];
  quotes: Record<string, unknown>[];
  financials: Record<string, unknown>[];
  dealAmount: number;
  dealDate: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
};

const createSql = `CREATE TABLE IF NOT EXISTS inquiry_requests (
 id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, contact TEXT NOT NULL,
 destinations TEXT NOT NULL DEFAULT '[]', services TEXT NOT NULL DEFAULT '[]',
 travel_time TEXT, message TEXT, status TEXT NOT NULL DEFAULT '待回复',
 source TEXT NOT NULL DEFAULT '网站', country TEXT NOT NULL DEFAULT '',
 language TEXT NOT NULL DEFAULT '中文', people INTEGER NOT NULL DEFAULT 0,
 children INTEGER NOT NULL DEFAULT 0, rooms INTEGER NOT NULL DEFAULT 0,
 budget TEXT NOT NULL DEFAULT '', tags TEXT NOT NULL DEFAULT '[]',
 next_follow_up TEXT NOT NULL DEFAULT '', followups TEXT NOT NULL DEFAULT '[]',
 quotes TEXT NOT NULL DEFAULT '[]', financials TEXT NOT NULL DEFAULT '[]',
 deal_amount REAL NOT NULL DEFAULT 0, deal_date TEXT NOT NULL DEFAULT '',
 payment_status TEXT NOT NULL DEFAULT '未收款',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;
const columns = [
  ["status", "TEXT NOT NULL DEFAULT '待回复'"],
  ["source", "TEXT NOT NULL DEFAULT '网站'"],
  ["country", "TEXT NOT NULL DEFAULT ''"],
  ["language", "TEXT NOT NULL DEFAULT '中文'"],
  ["people", "INTEGER NOT NULL DEFAULT 0"],
  ["children", "INTEGER NOT NULL DEFAULT 0"],
  ["rooms", "INTEGER NOT NULL DEFAULT 0"],
  ["budget", "TEXT NOT NULL DEFAULT ''"],
  ["tags", "TEXT NOT NULL DEFAULT '[]'"],
  ["next_follow_up", "TEXT NOT NULL DEFAULT ''"],
  ["followups", "TEXT NOT NULL DEFAULT '[]'"],
  ["quotes", "TEXT NOT NULL DEFAULT '[]'"],
  ["financials", "TEXT NOT NULL DEFAULT '[]'"],
  ["deal_amount", "REAL NOT NULL DEFAULT 0"],
  ["deal_date", "TEXT NOT NULL DEFAULT ''"],
  ["payment_status", "TEXT NOT NULL DEFAULT '未收款'"],
  ["updated_at", "TEXT NOT NULL DEFAULT ''"],
] as const;

export async function ensureInquiries() {
  await env.DB.prepare(createSql).run();
  const info = await env.DB.prepare("PRAGMA table_info(inquiry_requests)").all<{
    name: string;
  }>();
  const existing = new Set(info.results.map((x) => x.name));
  for (const [name, definition] of columns) {
    if (!existing.has(name))
      await env.DB.prepare(
        `ALTER TABLE inquiry_requests ADD COLUMN ${name} ${definition}`,
      ).run();
  }
  await env.DB.prepare(
    "UPDATE inquiry_requests SET updated_at=created_at WHERE updated_at=''",
  ).run();
}
const json = (value: unknown) => {
  try {
    return JSON.parse(String(value || "[]"));
  } catch {
    return [];
  }
};
export function mapInquiry(row: Record<string, unknown>): InquiryRecord {
  return {
    id: Number(row.id),
    name: String(row.name),
    contact: String(row.contact),
    destinations: json(row.destinations),
    services: json(row.services),
    travelTime: String(row.travel_time || ""),
    message: String(row.message || ""),
    status: String(row.status || "待回复"),
    source: String(row.source || "网站"),
    country: String(row.country || ""),
    language: String(row.language || "中文"),
    people: Number(row.people || 0),
    children: Number(row.children || 0),
    rooms: Number(row.rooms || 0),
    budget: String(row.budget || ""),
    tags: json(row.tags),
    nextFollowUp: String(row.next_follow_up || ""),
    followups: json(row.followups),
    quotes: json(row.quotes),
    financials: json(row.financials),
    dealAmount: Number(row.deal_amount || 0),
    dealDate: String(row.deal_date || ""),
    paymentStatus: String(row.payment_status || "未收款"),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at || row.created_at),
  };
}
export async function listInquiries() {
  await ensureInquiries();
  const x = await env.DB.prepare(
    "SELECT * FROM inquiry_requests ORDER BY updated_at DESC,id DESC",
  ).all();
  return x.results.map((r) => mapInquiry(r as Record<string, unknown>));
}
export async function getInquiry(id: number) {
  await ensureInquiries();
  const r = await env.DB.prepare("SELECT * FROM inquiry_requests WHERE id=?")
    .bind(id)
    .first();
  return r ? mapInquiry(r as Record<string, unknown>) : null;
}
