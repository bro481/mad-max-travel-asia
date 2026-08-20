import { env } from "cloudflare:workers";
export type ServiceItem = {
  id: number;
  slug: string;
  type: string;
  city: string;
  category: string;
  nameZh: string;
  nameEn: string;
  subtitleZh: string;
  subtitleEn: string;
  introZh: string;
  introEn: string;
  images: string[];
  tags: string[];
  steps: { title: string; description: string }[];
  routes: {
    name: string;
    image: string;
    duration: string;
    tag: string;
    description: string;
    stops: string;
  }[];
  timeline: { time: string; title: string; description: string }[];
  inquiryFields: string[];
  inquiryRequired: string[];
  inquiryPromptFields: string[];
  maxGuests: number;
  guestNote: string;
  airports: string[];
  directions: string[];
  serviceAreas: string[];
  otherAreaNote: string;
  vehicleDisplayMode: string;
  vehicles: { image:string; nameZh:string; nameEn:string; people:string; luggage:string; description:string; price:number; visible:boolean; internalNote:string }[];
  priceMode: string;
  price: number;
  priceUnit: string;
  priceNote: string;
  status: "draft" | "published" | "hidden";
  updatedAt: string;
};
const sql = `CREATE TABLE IF NOT EXISTS service_items(id INTEGER PRIMARY KEY AUTOINCREMENT,slug TEXT NOT NULL UNIQUE,type TEXT NOT NULL,city TEXT NOT NULL,category TEXT NOT NULL,name_zh TEXT NOT NULL,name_en TEXT NOT NULL DEFAULT '',subtitle_zh TEXT NOT NULL DEFAULT '',subtitle_en TEXT NOT NULL DEFAULT '',intro_zh TEXT NOT NULL DEFAULT '',intro_en TEXT NOT NULL DEFAULT '',images TEXT NOT NULL DEFAULT '[]',tags TEXT NOT NULL DEFAULT '[]',steps TEXT NOT NULL DEFAULT '[]',routes TEXT NOT NULL DEFAULT '[]',timeline TEXT NOT NULL DEFAULT '[]',inquiry_fields TEXT NOT NULL DEFAULT '[]',price_mode TEXT NOT NULL DEFAULT '咨询报价',price REAL NOT NULL DEFAULT 0,price_unit TEXT NOT NULL DEFAULT '每次',price_note TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'draft',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`;
const seeds = [
  [
    "kl-airport-transfer",
    "交通接送",
    "吉隆坡",
    "交通服务",
    "吉隆坡机场接送",
    "Kuala Lumpur Airport Transfer",
    "KLIA ↔ 酒店 / 市区",
    "KLIA ↔ Hotel / City",
  ],
  [
    "kl-private-car",
    "私人包车",
    "吉隆坡",
    "包车服务",
    "吉隆坡私人包车",
    "Kuala Lumpur Private Car",
    "灵活路线 · 中文沟通",
    "Flexible routes",
  ],
  [
    "kk-airport-transfer",
    "交通接送",
    "亚庇",
    "交通服务",
    "亚庇机场接送",
    "Kota Kinabalu Airport Transfer",
    "机场 ↔ 酒店 / 市区",
    "Airport ↔ Hotel / City",
  ],
  [
    "kk-nature",
    "城市体验",
    "亚庇",
    "自然体验",
    "神山自然体验",
    "Mount Kinabalu Nature Experience",
    "约10小时 · 家庭友好",
    "Around 10 hours",
  ],
  [
    "semporna-island",
    "海岛体验",
    "仙本那",
    "海岛体验",
    "仙本那跳岛体验",
    "Semporna Island Experience",
    "海岛、浮潜与接送咨询",
    "Island hopping and transfers",
  ],
] as const;
export async function ensureServiceItems() {
  await env.DB.prepare(sql).run();
  const columns = [["inquiry_required", "TEXT NOT NULL DEFAULT '[]'"],["inquiry_prompt_fields", "TEXT NOT NULL DEFAULT '[]'"],["max_guests", "INTEGER NOT NULL DEFAULT 14"],["guest_note", "TEXT NOT NULL DEFAULT '根据同行人数及行李数量匹配合适车型'"],["airports", "TEXT NOT NULL DEFAULT '[]'"],["directions", "TEXT NOT NULL DEFAULT '[]'"],["service_areas", "TEXT NOT NULL DEFAULT '[]'"],["other_area_note", "TEXT NOT NULL DEFAULT '其他区域可咨询'"],["vehicle_display_mode", "TEXT NOT NULL DEFAULT '车型类别'"],["vehicles", "TEXT NOT NULL DEFAULT '[]'"]] as const;
  const info = await env.DB.prepare("PRAGMA table_info(service_items)").all<{name:string}>();
  const existing = new Set(info.results.map((x) => x.name));
  for (const [name, definition] of columns) if (!existing.has(name)) await env.DB.prepare(`ALTER TABLE service_items ADD COLUMN ${name} ${definition}`).run();
  const c = await env.DB.prepare(
    "SELECT COUNT(*) total FROM service_items",
  ).first<{ total: number }>();
  if ((c?.total || 0) > 0) return;
  for (const s of seeds)
    await env.DB.prepare(
      "INSERT INTO service_items(slug,type,city,category,name_zh,name_en,subtitle_zh,subtitle_en,tags,steps,timeline,inquiry_fields,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
    )
      .bind(
        ...s,
        JSON.stringify(["提前预约", "中文沟通"]),
        JSON.stringify([
          { title: "告诉我们行程", description: "提供日期、地点和人数" },
          { title: "确认安排", description: "确认车辆或行程细节" },
          { title: "轻松出发", description: "按约定时间开始服务" },
        ]),
        JSON.stringify(
          s[1].includes("体验")
            ? [
                { time: "08:00", title: "酒店接送", description: "从住宿出发" },
                {
                  time: "09:30",
                  title: "开始体验",
                  description: "按当天路线游览",
                },
                {
                  time: "17:30",
                  title: "返回酒店",
                  description: "结束轻松的一天",
                },
              ]
            : [],
        ),
        JSON.stringify(["日期", "人数", "出发地点", "特殊需求"]),
        "published",
      )
      .run();
}
const j = (x: unknown) => {
  try {
    return JSON.parse(String(x || "[]"));
  } catch {
    return [];
  }
};
export function mapServiceItem(r: Record<string, unknown>): ServiceItem {
  return {
    id: Number(r.id),
    slug: String(r.slug),
    type: String(r.type),
    city: String(r.city),
    category: String(r.category),
    nameZh: String(r.name_zh),
    nameEn: String(r.name_en),
    subtitleZh: String(r.subtitle_zh),
    subtitleEn: String(r.subtitle_en),
    introZh: String(r.intro_zh),
    introEn: String(r.intro_en),
    images: j(r.images),
    tags: j(r.tags),
    steps: j(r.steps),
    routes: j(r.routes),
    timeline: j(r.timeline),
    inquiryFields: j(r.inquiry_fields),
    inquiryRequired: j(r.inquiry_required),
    inquiryPromptFields: j(r.inquiry_prompt_fields),
    maxGuests: Number(r.max_guests || 14),
    guestNote: String(r.guest_note || "根据同行人数及行李数量匹配合适车型"),
    airports: j(r.airports),
    directions: j(r.directions),
    serviceAreas: j(r.service_areas),
    otherAreaNote: String(r.other_area_note || "其他区域可咨询"),
    vehicleDisplayMode: String(r.vehicle_display_mode || "车型类别"),
    vehicles: j(r.vehicles),
    priceMode: String(r.price_mode),
    price: Number(r.price),
    priceUnit: String(r.price_unit),
    priceNote: String(r.price_note),
    status: r.status as ServiceItem["status"],
    updatedAt: String(r.updated_at),
  };
}
export async function listServiceItems(all = false) {
  await ensureServiceItems();
  const x = await env.DB.prepare(
    `SELECT * FROM service_items ${all ? "" : "WHERE status='published'"} ORDER BY city,category,id`,
  ).all();
  return x.results.map((r) => mapServiceItem(r as Record<string, unknown>));
}
export async function getServiceItem(id: number) {
  await ensureServiceItems();
  const r = await env.DB.prepare("SELECT * FROM service_items WHERE id=?")
    .bind(id)
    .first();
  return r ? mapServiceItem(r as Record<string, unknown>) : null;
}
export async function getServiceItemBySlug(slug: string) {
  await ensureServiceItems();
  const r = await env.DB.prepare(
    "SELECT * FROM service_items WHERE slug=? AND status='published'",
  )
    .bind(slug)
    .first();
  return r ? mapServiceItem(r as Record<string, unknown>) : null;
}
