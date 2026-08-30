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
  /** Canonical Service-level image fields exposed to the editor/API. */
  coverImage?: string;
  gallery?: string[];
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
  vehicles: { image:string; nameZh:string; nameEn:string; people:string; luggage:string; description:string; price:number; visible:boolean; internalNote:string; halfDayPrice?:number; fullDayPrice?:number; priceMode?:string }[];
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
  type?: string;
  title?: string;
  description?: string;
  time?: string;
};
export type ServiceRoutePlan = {
  sectionEyebrowZh?: string;
  sectionEyebrowEn?: string;
  sectionTitleZh?: string;
  sectionDescriptionZh?: string;
  name?: string;
  nameZh?: string;
  nameEn?: string;
  description?: string;
  descriptionZh?: string;
  descriptionEn?: string;
  image?: string;
  /** Canonical Route-level cover. `image` remains readable for migrated records. */
  coverImage?: string;
  duration?: string;
  tag?: string;
  tags?: string[];
  visible?: boolean;
  recommended?: boolean;
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
const image = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=86`;
const defaultSteps = [
  { title: "告诉我们行程", description: "提供日期、地点和人数" },
  { title: "确认安排", description: "确认车辆或行程细节" },
  { title: "轻松出发", description: "按约定时间开始服务" },
];
const privateCarRoutes: ServiceRoutePlan[] = [
  {
    name: "吉隆坡经典一日游",
    nameZh: "吉隆坡经典一日游",
    nameEn: "Kuala Lumpur Classic Day Tour",
    duration: "约 8 小时",
    tags: ["首次到访", "经典路线"],
    descriptionZh: "双子塔、独立广场与茨厂街",
    descriptionEn: "Twin Towers, Merdeka Square and Chinatown",
    stops: "双子塔 · 独立广场 · 茨厂街",
    visible: true,
    sortOrder: 1,
    image: image("photo-1596422846543-75c6fc197f07"),
    nodes: [
      { nameZh: "酒店接送", nameEn: "Hotel pickup", type: "交通", descriptionZh: "从酒店出发，按当天时间灵活安排。", descriptionEn: "Depart from your hotel with a flexible plan for the day.", image: "", stayTime: "" },
      { nameZh: "双子塔", nameEn: "Petronas Twin Towers", type: "景点", descriptionZh: "吉隆坡城市地标，适合拍照与短暂停留。", descriptionEn: "Kuala Lumpur landmark for photos and a short visit.", image: image("photo-1596422846543-75c6fc197f07"), stayTime: "约45分钟" },
      { nameZh: "独立广场", nameEn: "Merdeka Square", type: "景点", descriptionZh: "历史建筑与城市广场，适合轻松步行。", descriptionEn: "Historic buildings and a city square for an easy walk.", image: image("photo-1590930754517-64d5fffa06ac"), stayTime: "约45分钟" },
      { nameZh: "茨厂街", nameEn: "Petaling Street", type: "街区", descriptionZh: "本地街区、小吃与伴手礼，可自由停留。", descriptionEn: "Local streets, snacks and souvenirs with flexible time.", image: image("photo-1584515933487-779824d29309"), stayTime: "约1小时" },
    ],
  },
];
export const richSeeds = seeds.map((s, index) => {
  const [slug, type, city, category, nameZh, nameEn, subtitleZh, subtitleEn] = s;
  const isCar = type === "私人包车";
  const isJourney = type.includes("体验") || type === "城市体验";
  const images: Record<string, string> = {
    "kl-airport-transfer": image("photo-1549317661-bd32c8ce0db2"),
    "kl-private-car": image("photo-1550355291-bbee04a92027"),
    "kk-airport-transfer": image("photo-1549317661-bd32c8ce0db2"),
    "kk-nature": image("photo-1500530855697-b586d89ba3ee"),
    "semporna-island": image("photo-1507525428034-b723cf961d3e"),
  };
  return {
    slug,
    type,
    city,
    category,
    nameZh,
    nameEn,
    subtitleZh,
    subtitleEn,
    destinationId: defaultDestinationId(city),
    categoryId: defaultCategoryId(category, type),
    templateType: defaultTemplate(type),
    displayOrder: index + 1,
    introZh: "告诉我们你的日期、人数和大概想法，我们会根据实际情况帮你确认合适安排。",
    introEn: "Share your date, group size and rough plan. We will recommend a suitable arrangement.",
    images: [images[slug]],
    tags: ["提前预约", "中文沟通"],
    steps: isCar || isJourney ? [] : defaultSteps,
    routeSectionTitleZh: isCar ? "热门包车方案" : "热门路线方案",
    routeSectionTitleEn: isCar ? "Popular Private Car Routes" : "Popular Route Plans",
    routeSectionIntroZh: "以下路线仅作参考，可根据您的时间与兴趣灵活调整。",
    routeSectionIntroEn: "These routes are examples and can be adjusted around your time and interests.",
    routes: isCar ? privateCarRoutes : [],
    timeline: isJourney
      ? [
          { time: "08:00", title: "酒店接送", description: "从住宿地点轻松出发" },
          { time: "10:00", title: "开始体验", description: "由当地向导带领游览" },
          { time: "17:30", title: "返回酒店", description: "结束充实的一天" },
        ]
      : [],
    inquiryFields: isCar
      ? ["计划日期", "出发地点", "同行人数", "想去的地点", "特殊需求"]
      : ["计划日期", "人数", "出发地点", "特殊需求"],
  };
});
export function staticServiceItemRecords(): ServiceItem[] {
  return richSeeds.map((item, index) => ({
    id: index + 1,
    slug: item.slug,
    type: item.type,
    destinationId: item.destinationId,
    city: item.city,
    category: item.category,
    categoryId: item.categoryId,
    templateType: item.templateType as ServiceItem["templateType"],
    displayOrder: item.displayOrder,
    nameZh: item.nameZh,
    nameEn: item.nameEn,
    subtitleZh: item.subtitleZh,
    subtitleEn: item.subtitleEn,
    introZh: item.introZh,
    introEn: item.introEn,
    coverImage: item.images[0] || "",
    gallery: item.images.slice(1),
    images: item.images,
    tags: item.tags,
    steps: item.steps,
    routeSectionTitleZh: item.routeSectionTitleZh,
    routeSectionTitleEn: item.routeSectionTitleEn,
    routeSectionIntroZh: item.routeSectionIntroZh,
    routeSectionIntroEn: item.routeSectionIntroEn,
    routes: item.routes,
    timeline: item.timeline,
    inquiryFields: item.inquiryFields,
    inquiryRequired: ["计划日期", "人数"],
    inquiryPromptFields: item.inquiryFields,
    maxGuests: 14,
    guestNote: "根据同行人数及行李数量匹配合适车型",
    airports: [],
    directions: [],
    serviceAreas: [],
    otherAreaNote: "其他区域可咨询",
    vehicleDisplayMode: "车型类别",
    vehicles: [],
    priceMode: "咨询报价",
    price: 0,
    priceUnit: "每次",
    priceNote: "",
    status: "published",
    updatedAt: "",
  }));
}
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
  for (const item of richSeeds) {
    const current = await env.DB.prepare(
      "SELECT id,images,routes,intro_zh FROM service_items WHERE slug=?",
    ).bind(item.slug).first<{ id:number; images:string; routes:string; intro_zh:string }>();
    if (!current) {
      await env.DB.prepare(
        `INSERT INTO service_items(slug,type,destination_id,city,category,category_id,template_type,display_order,name_zh,name_en,subtitle_zh,subtitle_en,intro_zh,intro_en,images,tags,steps,route_section_title_zh,route_section_title_en,route_section_intro_zh,route_section_intro_en,routes,timeline,inquiry_fields,inquiry_required,inquiry_prompt_fields,status)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(
        item.slug,
        item.type,
        item.destinationId,
        item.city,
        item.category,
        item.categoryId,
        item.templateType,
        item.displayOrder,
        item.nameZh,
        item.nameEn,
        item.subtitleZh,
        item.subtitleEn,
        item.introZh,
        item.introEn,
        JSON.stringify(item.images),
        JSON.stringify(item.tags),
        JSON.stringify(item.steps),
        item.routeSectionTitleZh,
        item.routeSectionTitleEn,
        item.routeSectionIntroZh,
        item.routeSectionIntroEn,
        JSON.stringify(item.routes),
        JSON.stringify(item.timeline),
        JSON.stringify(item.inquiryFields),
        JSON.stringify(["计划日期", "人数"]),
        JSON.stringify(item.inquiryFields),
        "published",
      ).run();
      continue;
    }
    const missingImages = !j(current.images).length;
    const missingRoutes = item.routes.length && !j(current.routes).length;
    const missingIntro = !String(current.intro_zh || "").trim();
    if (missingImages || missingRoutes || missingIntro) {
      await env.DB.prepare(
        `UPDATE service_items SET images=CASE WHEN images='[]' OR images='' THEN ? ELSE images END,
          routes=CASE WHEN routes='[]' OR routes='' THEN ? ELSE routes END,
          intro_zh=CASE WHEN intro_zh='' THEN ? ELSE intro_zh END,
          intro_en=CASE WHEN intro_en='' THEN ? ELSE intro_en END,
          inquiry_required=CASE WHEN inquiry_required='[]' OR inquiry_required='' THEN ? ELSE inquiry_required END,
          inquiry_prompt_fields=CASE WHEN inquiry_prompt_fields='[]' OR inquiry_prompt_fields='' THEN ? ELSE inquiry_prompt_fields END
          WHERE id=?`,
      ).bind(
        JSON.stringify(item.images),
        JSON.stringify(item.routes),
        item.introZh,
        item.introEn,
        JSON.stringify(["计划日期", "人数"]),
        JSON.stringify(item.inquiryFields),
        current.id,
      ).run();
    }
  }
}
const j = (x: unknown) => {
  try {
    return JSON.parse(String(x || "[]"));
  } catch {
    return [];
  }
};
export function mapServiceItem(r: Record<string, unknown>): ServiceItem {
  const serviceImages = j(r.images) as string[];
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
    coverImage: serviceImages[0] || "",
    gallery: serviceImages.slice(1),
    images: serviceImages,
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
  const x = await env.DB.prepare(
    `SELECT * FROM service_items ${all ? "" : "WHERE status='published'"} ORDER BY destination_id,city,category_id,display_order,id`,
  ).all();
  return x.results.map((r) => mapServiceItem(r as Record<string, unknown>));
}
export async function getServiceItem(id: number) {
  const r = await env.DB.prepare("SELECT * FROM service_items WHERE id=?")
    .bind(id)
    .first();
  return r ? mapServiceItem(r as Record<string, unknown>) : null;
}
export async function getServiceItemBySlug(slug: string) {
  const r = await env.DB.prepare(
    "SELECT * FROM service_items WHERE slug=? AND status='published'",
  )
    .bind(slug)
    .first();
  return r ? mapServiceItem(r as Record<string, unknown>) : null;
}
export async function getAdminServiceItemBySlug(slug: string) {
  const r = await env.DB.prepare("SELECT * FROM service_items WHERE slug=?")
    .bind(slug)
    .first();
  return r ? mapServiceItem(r as Record<string, unknown>) : null;
}
