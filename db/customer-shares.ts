import { env } from "cloudflare:workers";

export type CustomerShareStatus = "draft" | "shared" | "viewed" | "confirmed" | "expired";
export type CustomerShareProductType = "stay" | "service" | "route" | "package";

export type CustomerShareContent = {
  type: CustomerShareProductType;
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  url: string;
  priceLabel?: string;
  highlights: string[];
  gallery: string[];
  details: { label: string; value: string }[];
  ctaLabel: string;
};

export type CustomerSharePayload = {
  customerName?: string;
  startDate?: string;
  endDate?: string;
  useDate?: string;
  people?: string;
  quoteAmount?: string;
  quoteUnit?: string;
  quoteCurrency?: string;
  validUntil?: string;
  note?: string;
  showPublicPrice?: boolean;
  showQuote?: boolean;
  showDates?: boolean;
  showDetails?: boolean;
};

export type CustomerShareRecord = {
  id: number;
  code: string;
  status: CustomerShareStatus;
  productType: CustomerShareProductType;
  productId: string;
  productSlug: string;
  title: string;
  subtitle: string;
  image: string;
  targetUrl: string;
  content: CustomerShareContent;
  payload: CustomerSharePayload;
  viewedAt: string;
  createdAt: string;
  updatedAt: string;
};

const createSql = `CREATE TABLE IF NOT EXISTS customer_shares (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 code TEXT NOT NULL UNIQUE,
 status TEXT NOT NULL DEFAULT 'draft',
 product_type TEXT NOT NULL,
 product_id TEXT NOT NULL,
 product_slug TEXT NOT NULL,
 title TEXT NOT NULL,
 subtitle TEXT NOT NULL DEFAULT '',
 image TEXT NOT NULL DEFAULT '',
 target_url TEXT NOT NULL DEFAULT '',
 content TEXT NOT NULL DEFAULT '{}',
 payload TEXT NOT NULL DEFAULT '{}',
 viewed_at TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

function parseJson<T>(value: unknown, fallback: T): T {
  try {
    return value ? (JSON.parse(String(value)) as T) : fallback;
  } catch {
    return fallback;
  }
}

function mapRow(row: Record<string, unknown>): CustomerShareRecord {
  return {
    id: Number(row.id),
    code: String(row.code),
    status: String(row.status || "draft") as CustomerShareStatus,
    productType: String(row.product_type) as CustomerShareProductType,
    productId: String(row.product_id),
    productSlug: String(row.product_slug),
    title: String(row.title || ""),
    subtitle: String(row.subtitle || ""),
    image: String(row.image || ""),
    targetUrl: String(row.target_url || ""),
    content: parseJson<CustomerShareContent>(row.content, {
      type: "stay",
      id: "",
      slug: "",
      title: "",
      subtitle: "",
      description: "",
      image: "",
      url: "",
      highlights: [],
      gallery: [],
      details: [],
      ctaLabel: "咨询这个内容",
    }),
    payload: parseJson<CustomerSharePayload>(row.payload, {}),
    viewedAt: String(row.viewed_at || ""),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
  };
}

export async function ensureCustomerShares() {
  await env.DB.prepare(createSql).run();
}

export function makeShareCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function listCustomerShares() {
  await ensureCustomerShares();
  const result = await env.DB.prepare("SELECT * FROM customer_shares ORDER BY id DESC LIMIT 200").all();
  return result.results.map((row) => mapRow(row as Record<string, unknown>));
}

export async function getCustomerShare(code: string) {
  await ensureCustomerShares();
  const row = await env.DB.prepare("SELECT * FROM customer_shares WHERE code=?").bind(code).first();
  return row ? mapRow(row as Record<string, unknown>) : null;
}

export async function createCustomerShare(input: {
  content: CustomerShareContent;
  payload: CustomerSharePayload;
  status?: CustomerShareStatus;
}) {
  await ensureCustomerShares();
  let code = makeShareCode();
  while (await env.DB.prepare("SELECT id FROM customer_shares WHERE code=?").bind(code).first()) code = makeShareCode();
  const content = input.content;
  const result = await env.DB.prepare(
    `INSERT INTO customer_shares (code,status,product_type,product_id,product_slug,title,subtitle,image,target_url,content,payload)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      code,
      input.status || "draft",
      content.type,
      content.id,
      content.slug,
      content.title,
      content.subtitle,
      content.image,
      content.url,
      JSON.stringify(content),
      JSON.stringify(input.payload),
    )
    .run();
  return { ...(await getCustomerShare(code)), id: Number(result.meta.last_row_id) } as CustomerShareRecord;
}

export async function updateCustomerShare(code: string, input: Partial<Pick<CustomerShareRecord, "status" | "payload">>) {
  await ensureCustomerShares();
  const current = await getCustomerShare(code);
  if (!current) return null;
  await env.DB.prepare("UPDATE customer_shares SET status=?, payload=?, updated_at=CURRENT_TIMESTAMP WHERE code=?")
    .bind(input.status || current.status, JSON.stringify(input.payload || current.payload), code)
    .run();
  return getCustomerShare(code);
}

export async function markCustomerShareViewed(code: string) {
  await ensureCustomerShares();
  await env.DB.prepare(
    "UPDATE customer_shares SET status=CASE WHEN status='draft' THEN 'viewed' WHEN status='shared' THEN 'viewed' ELSE status END, viewed_at=CASE WHEN viewed_at='' THEN CURRENT_TIMESTAMP ELSE viewed_at END, updated_at=CURRENT_TIMESTAMP WHERE code=?",
  )
    .bind(code)
    .run();
}
