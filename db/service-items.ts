import { env } from "cloudflare:workers";
import { staticDestinations } from "./destinations";
export type ServiceItem = {
  id: number;
  slug: string;
  type: string;
  destinationId: number;
  city: string;
  category: string;
  categoryId: number;
  templateType: "transfer" | "route" | "experience";
  displayOrder: number;
  nameZh: string;
  nameEn: string;
  subtitleZh: string;
  subtitleEn: string;
  introZh: string;
  introEn: string;
  images: string[];
  tags: string[];
  steps: { title: string; description: string }[];
  routeSectionTitleZh: string;
  routeSectionTitleEn: string;
  routeSectionIntroZh: string;
  routeSectionIntroEn: string;
  routes: ServiceRoutePlan[];
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
export type ServiceRouteNode = {
  nameZh?: string;
  nameEn?: string;
  descriptionZh?: string;
  descriptionEn?: string;
  image?: string;
  stayTime?: string;
  title?: string;
  description?: string;
  time?: string;
};
export type ServiceRoutePlan = {
  name?: string;
  nameZh?: string;
  nameEn?: string;
  description?: string;
  descriptionZh?: string;
  descriptionEn?: string;
  image?: string;
  duration?: string;
  tag?: string;
  tags?: string[];
  visible?: boolean;
  sortOrder?: number;
  stops?: string;
  nodes?: ServiceRouteNode[];
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
function defaultTemplate(type: string) {
  if (type === "交通接送") return "transfer";
  if (type === "私人包车") return "route";
  return "experience";
}
function defaultCategoryId(category: string, type = "") {
  if (category.includes("海岛")) return 2;
  if (category.includes("自然") || category.includes("生态")) return 3;
  if (category.includes("城市")) return 4;
  if (type === "私人包车" || type === "交通接送" || category.includes("包车") || category.includes("交通")) return 1;
  return 4;
}
function defaultDestinationId(city: string) {
  return staticDestinations.find((destination) => destination.nameZh === city)?.id || 0;
}
export async function ensureServiceItems() {
  await env.DB.prepare(sql).run();
  const columns = [["destination_id", "INTEGER NOT NULL DEFAULT 0"],["category_id", "INTEGER NOT NULL DEFAULT 0"],["template_type", "TEXT NOT NULL DEFAULT ''"],["display_order", "INTEGER NOT NULL DEFAULT 99"],["route_section_title_zh", "TEXT NOT NULL DEFAULT '热门包车方案'"],["route_section_title_en", "TEXT NOT NULL DEFAULT 'Popular Private Car Routes'"],["route_section_intro_zh", "TEXT NOT NULL DEFAULT '以下路线仅作参考，可根据您的时间与兴趣灵活调整。'"],["route_section_intro_en", "TEXT NOT NULL DEFAULT 'These routes are examples and can be adjusted around your time and interests.'"],["inquiry_required", "TEXT NOT NULL DEFAULT '[]'"],["inquiry_prompt_fields", "TEXT NOT NULL DEFAULT '[]'"],["max_guests", "INTEGER NOT NULL DEFAULT 14"],["guest_note", "TEXT NOT NULL DEFAULT '根据同行人数及行李数量匹配合适车型'"],["airports", "TEXT NOT NULL DEFAULT '[]'"],["directions", "TEXT NOT NULL DEFAULT '[]'"],["service_areas", "TEXT NOT NULL DEFAULT '[]'"],["other_area_note", "TEXT NOT NULL DEFAULT '其他区域可咨询'"],["vehicle_display_mode", "TEXT NOT NULL DEFAULT '车型类别'"],["vehicles", "TEXT NOT NULL DEFAULT '[]'"]] as const;
  const info = await env.DB.prepare("PRAGMA table_info(service_items)").all<{name:string}>();
  const existing = new Set(info.results.map((x) => x.name));
  for (const [name, definition] of columns) if (!existing.has(name)) await env.DB.prepare(`ALTER TABLE service_items ADD COLUMN ${name} ${definition}`).run();
  await env.DB.prepare("UPDATE service_items SET template_type=CASE WHEN type='交通接送' THEN 'transfer' WHEN type='私人包车' THEN 'route' ELSE 'experience' END WHERE template_type='' OR template_type IS NULL").run();
  await env.DB.prepare("UPDATE service_items SET category_id=CASE WHEN category LIKE '%海岛%' THEN 2 WHEN category LIKE '%自然%' OR category LIKE '%生态%' THEN 3 WHEN category LIKE '%城市%' THEN 4 ELSE 1 END WHERE category_id=0 OR category_id IS NULL").run();
  await env.DB.prepare("UPDATE service_items SET destination_id=CASE WHEN city='吉隆坡' THEN 1 WHEN city='亚庇' THEN 2 WHEN city='仙本那' THEN 3 WHEN city='马六甲' THEN 4 WHEN city='新加坡' THEN 5 ELSE destination_id END WHERE destination_id=0 OR destination_id IS NULL").run();
  await env.DB.prepare("UPDATE service_items SET display_order=id WHERE display_order=99 OR display_order IS NULL").run();
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
    destinationId: Number(r.destination_id || defaultDestinationId(String(r.city))),
    city: String(r.city),
    category: String(r.category),
    categoryId: Number(r.category_id || defaultCategoryId(String(r.category), String(r.type))),
    templateType: (["transfer", "route", "experience"].includes(String(r.template_type)) ? String(r.template_type) : defaultTemplate(String(r.type))) as ServiceItem["templateType"],
    displayOrder: Number(r.display_order || r.id || 99),
    nameZh: String(r.name_zh),
    nameEn: String(r.name_en),
    subtitleZh: String(r.subtitle_zh),
    subtitleEn: String(r.subtitle_en),
    introZh: String(r.intro_zh),
    introEn: String(r.intro_en),
    images: j(r.images),
    tags: j(r.tags),
    steps: j(r.steps),
    routeSectionTitleZh: String(r.route_section_title_zh || "热门包车方案"),
    routeSectionTitleEn: String(r.route_section_title_en || "Popular Private Car Routes"),
    routeSectionIntroZh: String(r.route_section_intro_zh || "以下路线仅作参考，可根据您的时间与兴趣灵活调整。"),
    routeSectionIntroEn: String(r.route_section_intro_en || "These routes are examples and can be adjusted around your time and interests."),
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
    `SELECT * FROM service_items ${all ? "" : "WHERE status='published'"} ORDER BY destination_id,city,category_id,display_order,id`,
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
export async function getAdminServiceItemBySlug(slug: string) {
  await ensureServiceItems();
  const r = await env.DB.prepare("SELECT * FROM service_items WHERE slug=?")
    .bind(slug)
    .first();
  return r ? mapServiceItem(r as Record<string, unknown>) : null;
}
