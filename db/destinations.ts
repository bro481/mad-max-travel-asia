import { env } from "cloudflare:workers";

export type DestinationStatus = "visible" | "hidden";

export type DestinationRecord = {
  id: number;
  slug: string;
  nameZh: string;
  nameEn: string;
  introZh: string;
  introEn: string;
  useForProperties: boolean;
  useForServices: boolean;
  propertySort: number;
  serviceSort: number;
  onlyShowWithContent: boolean;
  status: DestinationStatus;
  updatedAt: string;
};

export type DestinationInput = Partial<Omit<DestinationRecord, "id" | "updatedAt">>;

export const staticDestinations: DestinationRecord[] = [
  {
    id: 1,
    slug: "kuala-lumpur",
    nameZh: "吉隆坡",
    nameEn: "Kuala Lumpur",
    introZh: "城市地标、美食与便捷交通，轻松探索马来西亚首都。",
    introEn: "Landmarks, food and easy transport for exploring Malaysia's capital.",
    useForProperties: true,
    useForServices: true,
    propertySort: 1,
    serviceSort: 1,
    onlyShowWithContent: true,
    status: "visible",
    updatedAt: "",
  },
  {
    id: 2,
    slug: "kota-kinabalu",
    nameZh: "亚庇",
    nameEn: "Kota Kinabalu",
    introZh: "城市、海岛与自然体验结合，探索亚庇的独特魅力。",
    introEn: "A mix of city, islands and nature around Kota Kinabalu.",
    useForProperties: true,
    useForServices: true,
    propertySort: 2,
    serviceSort: 2,
    onlyShowWithContent: true,
    status: "visible",
    updatedAt: "",
  },
  {
    id: 3,
    slug: "semporna",
    nameZh: "仙本那",
    nameEn: "Semporna",
    introZh: "海岛、浮潜与轻松度假体验，适合慢慢安排。",
    introEn: "Island trips, snorkelling and relaxed travel around Semporna.",
    useForProperties: true,
    useForServices: true,
    propertySort: 3,
    serviceSort: 4,
    onlyShowWithContent: true,
    status: "visible",
    updatedAt: "",
  },
  {
    id: 4,
    slug: "melaka",
    nameZh: "马六甲",
    nameEn: "Melaka",
    introZh: "历史街区、娘惹文化与悠闲河岸，适合一日或两日慢游。",
    introEn: "Heritage streets, Peranakan culture and a relaxed riverside escape.",
    useForProperties: false,
    useForServices: true,
    propertySort: 4,
    serviceSort: 3,
    onlyShowWithContent: true,
    status: "visible",
    updatedAt: "",
  },
  {
    id: 5,
    slug: "singapore",
    nameZh: "新加坡",
    nameEn: "Singapore",
    introZh: "跨城接送与周边路线，可提前咨询安排。",
    introEn: "Intercity transfers and nearby routes can be arranged in advance.",
    useForProperties: false,
    useForServices: true,
    propertySort: 5,
    serviceSort: 5,
    onlyShowWithContent: true,
    status: "visible",
    updatedAt: "",
  },
];

const createSql = `CREATE TABLE IF NOT EXISTS destinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  intro_zh TEXT NOT NULL DEFAULT '',
  intro_en TEXT NOT NULL DEFAULT '',
  use_for_properties INTEGER NOT NULL DEFAULT 1,
  use_for_services INTEGER NOT NULL DEFAULT 1,
  property_sort INTEGER NOT NULL DEFAULT 99,
  service_sort INTEGER NOT NULL DEFAULT 99,
  only_show_with_content INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'visible',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export function slugifyDestination(value: string) {
  const text = value.trim().toLowerCase();
  const ascii = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  if (ascii) return ascii;
  return encodeURIComponent(text).replace(/%/g, "").toLowerCase() || "destination";
}

export async function ensureDestinations() {
  await env.DB.prepare(createSql).run();
  const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM destinations").first<{ total: number }>();
  if ((count?.total || 0) > 0) return;
  for (const item of staticDestinations) {
    await env.DB.prepare(
      `INSERT INTO destinations(slug,name_zh,name_en,intro_zh,intro_en,use_for_properties,use_for_services,property_sort,service_sort,only_show_with_content,status)
       VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
    )
      .bind(
        item.slug,
        item.nameZh,
        item.nameEn,
        item.introZh,
        item.introEn,
        item.useForProperties ? 1 : 0,
        item.useForServices ? 1 : 0,
        item.propertySort,
        item.serviceSort,
        item.onlyShowWithContent ? 1 : 0,
        item.status,
      )
      .run();
  }
}

function mapDestination(row: Record<string, unknown>): DestinationRecord {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    nameZh: String(row.name_zh),
    nameEn: String(row.name_en || ""),
    introZh: String(row.intro_zh || ""),
    introEn: String(row.intro_en || ""),
    useForProperties: Boolean(Number(row.use_for_properties)),
    useForServices: Boolean(Number(row.use_for_services)),
    propertySort: Number(row.property_sort || 99),
    serviceSort: Number(row.service_sort || 99),
    onlyShowWithContent: Boolean(Number(row.only_show_with_content)),
    status: row.status === "hidden" ? "hidden" : "visible",
    updatedAt: String(row.updated_at || ""),
  };
}

export async function listDestinations(all = false) {
  const result = await env.DB.prepare(
    `SELECT * FROM destinations ${all ? "" : "WHERE status='visible'"} ORDER BY property_sort, service_sort, id`,
  ).all();
  return result.results.map((row) => mapDestination(row as Record<string, unknown>));
}

export async function createDestination(input: DestinationInput) {
  await ensureDestinations();
  const nameZh = String(input.nameZh || "新目的地").trim();
  const nameEn = String(input.nameEn || nameZh).trim();
  const base = slugifyDestination(String(input.slug || nameEn || nameZh));
  let slug = base;
  let n = 1;
  while (await env.DB.prepare("SELECT id FROM destinations WHERE slug=?").bind(slug).first()) slug = `${base}-${++n}`;
  const result = await env.DB.prepare(
    `INSERT INTO destinations(slug,name_zh,name_en,intro_zh,intro_en,use_for_properties,use_for_services,property_sort,service_sort,only_show_with_content,status)
     VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      slug,
      nameZh,
      nameEn,
      String(input.introZh || ""),
      String(input.introEn || ""),
      input.useForProperties === false ? 0 : 1,
      input.useForServices === false ? 0 : 1,
      Number(input.propertySort || 99),
      Number(input.serviceSort || 99),
      input.onlyShowWithContent === false ? 0 : 1,
      input.status === "hidden" ? "hidden" : "visible",
    )
    .run();
  return { id: Number(result.meta.last_row_id), slug };
}

export async function updateDestination(id: number, input: DestinationInput) {
  await ensureDestinations();
  const current = await env.DB.prepare("SELECT * FROM destinations WHERE id=?").bind(id).first();
  if (!current) return null;
  const old = mapDestination(current as Record<string, unknown>);
  const next = { ...old, ...input };
  const slug = input.slug ? slugifyDestination(input.slug) : old.slug;
  await env.DB.prepare(
    `UPDATE destinations SET slug=?,name_zh=?,name_en=?,intro_zh=?,intro_en=?,use_for_properties=?,use_for_services=?,property_sort=?,service_sort=?,only_show_with_content=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  )
    .bind(
      slug,
      String(next.nameZh || old.nameZh),
      String(next.nameEn || old.nameEn),
      String(next.introZh || ""),
      String(next.introEn || ""),
      next.useForProperties ? 1 : 0,
      next.useForServices ? 1 : 0,
      Number(next.propertySort || 99),
      Number(next.serviceSort || 99),
      next.onlyShowWithContent ? 1 : 0,
      next.status === "hidden" ? "hidden" : "visible",
      id,
    )
    .run();
  return { id, slug };
}

export async function deleteDestination(id: number) {
  await ensureDestinations();
  await env.DB.prepare("DELETE FROM destinations WHERE id=?").bind(id).run();
}
