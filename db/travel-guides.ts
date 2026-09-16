import { env } from "cloudflare:workers";
import {
  defaultGuideSettings,
  guideDefaultImages,
  guideCategories,
  guideCities,
  type TravelGuideArticle,
  type TravelGuideBlock,
  type TravelGuideCategory,
  type TravelGuideCity,
  type TravelGuideSettings,
} from "./travel-guide-shared";

export { defaultGuideSettings, guideCategories, guideCities };
export type { TravelGuideArticle, TravelGuideBlock, TravelGuideCategory, TravelGuideCity, TravelGuideSettings };

const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=86`;

const staticGuideSeeds: Omit<TravelGuideArticle, "id" | "updatedAt">[] = [
  {
    slug: "first-time-kuala-lumpur",
    titleZh: "第一次去吉隆坡，这几个地方值得慢慢逛",
    titleEn: "Where to slow down on a first Kuala Lumpur trip",
    city: "kuala-lumpur",
    category: "城市漫游",
    summaryZh: "从现代城市地标到老街巷弄，感受吉隆坡的多元与活力。",
    summaryEn: "From modern landmarks to old lanes, feel the city's layered rhythm.",
    coverImage: image("photo-1596422846543-75c6fc197f07"),
    imageLabel: "KUALA LUMPUR",
    readMinutes: 4,
    sortOrder: 1,
    featured: true,
    status: "published",
    contentBlocks: [{ type: "paragraph", text: "详情页视觉稿确认后，这里会承载完整攻略正文。" }],
  },
  {
    slug: "kl-chinatown-slow-walk",
    titleZh: "茨厂街不只适合打卡，傍晚去会更舒服",
    titleEn: "A slower evening walk around Chinatown",
    city: "kuala-lumpur",
    category: "城市漫游",
    summaryZh: "老店、咖啡馆、街边小吃和夜色，是吉隆坡很有生活感的一面。",
    summaryEn: "Old shops, cafes, street snacks and evening light in one easy walk.",
    coverImage: guideDefaultImages["kl-chinatown-slow-walk"] || image("photo-1584515933487-779824d29309"),
    imageLabel: "CHINATOWN",
    readMinutes: 3,
    sortOrder: 2,
    featured: false,
    status: "published",
    contentBlocks: [],
  },
  {
    slug: "kota-kinabalu-sunset",
    titleZh: "亚庇看落日，时间比地点更重要",
    titleEn: "For Kota Kinabalu sunsets, timing matters most",
    city: "kota-kinabalu",
    category: "行程参考",
    summaryZh: "把海边、晚餐和回程顺好，日落这件事就会变得很轻松。",
    summaryEn: "Line up the beach, dinner and return ride for an easier sunset.",
    coverImage: image("photo-1507525428034-b723cf961d3e"),
    imageLabel: "SUNSET",
    readMinutes: 4,
    sortOrder: 1,
    featured: true,
    status: "published",
    contentBlocks: [],
  },
  {
    slug: "semporna-island-notes",
    titleZh: "去仙本那跳岛前，先确认这几件小事",
    titleEn: "Small checks before island hopping in Semporna",
    city: "semporna",
    category: "行程参考",
    summaryZh: "船班、天气、浮潜装备和接送时间，会直接影响当天体验。",
    summaryEn: "Boats, weather, gear and transfers shape how the sea day feels.",
    coverImage: image("photo-1544550285-f813152fb2fd"),
    imageLabel: "ISLAND DAY",
    readMinutes: 5,
    sortOrder: 1,
    featured: true,
    status: "published",
    contentBlocks: [],
  },
  {
    slug: "melaka-one-day-walk",
    titleZh: "马六甲一日慢走，别把行程排得太满",
    titleEn: "Keep a Melaka day trip pleasantly light",
    city: "melaka",
    category: "城市漫游",
    summaryZh: "红屋、河畔和鸡场街之间留一点空白，古城才会好逛。",
    summaryEn: "Leave space between Dutch Square, the river and Jonker Street.",
    coverImage: image("photo-1580537659466-0a9bfa916a54"),
    imageLabel: "MELAKA",
    readMinutes: 4,
    sortOrder: 1,
    featured: true,
    status: "published",
    contentBlocks: [],
  },
];

const createArticlesSql = `CREATE TABLE IF NOT EXISTS travel_guide_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title_zh TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT 'kuala-lumpur',
  category TEXT NOT NULL DEFAULT '城市漫游',
  summary_zh TEXT NOT NULL DEFAULT '',
  summary_en TEXT NOT NULL DEFAULT '',
  cover_image TEXT NOT NULL DEFAULT '',
  image_label TEXT NOT NULL DEFAULT '',
  read_minutes INTEGER NOT NULL DEFAULT 4,
  sort_order INTEGER NOT NULL DEFAULT 99,
  featured INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  content_blocks TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const createSettingsSql = `CREATE TABLE IF NOT EXISTS travel_guide_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  hero_image TEXT NOT NULL DEFAULT '',
  hero_title_zh TEXT NOT NULL DEFAULT '',
  hero_title_en TEXT NOT NULL DEFAULT '',
  hero_description_zh TEXT NOT NULL DEFAULT '',
  hero_description_en TEXT NOT NULL DEFAULT '',
  hero_script TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const parseJson = <T>(value: unknown, fallback: T): T => {
  try {
    return JSON.parse(String(value || "")) as T;
  } catch {
    return fallback;
  }
};

function normalizeCity(value: unknown): TravelGuideCity {
  return guideCities.some((city) => city.key === value) ? (value as TravelGuideCity) : "kuala-lumpur";
}

function normalizeCategory(value: unknown): TravelGuideCategory {
  return guideCategories.includes(value as TravelGuideCategory) ? (value as TravelGuideCategory) : "城市漫游";
}

function slugify(value: string) {
  const base = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return base || `guide-${Date.now()}`;
}

function mapArticle(row: Record<string, unknown>): TravelGuideArticle {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    titleZh: String(row.title_zh || ""),
    titleEn: String(row.title_en || ""),
    city: normalizeCity(row.city),
    category: normalizeCategory(row.category),
    summaryZh: String(row.summary_zh || ""),
    summaryEn: String(row.summary_en || ""),
    coverImage: String(row.cover_image || ""),
    imageLabel: String(row.image_label || ""),
    readMinutes: Number(row.read_minutes || 4),
    sortOrder: Number(row.sort_order || 99),
    featured: Boolean(Number(row.featured || 0)),
    status: row.status === "published" ? "published" : "draft",
    contentBlocks: parseJson<TravelGuideBlock[]>(row.content_blocks, []),
    updatedAt: String(row.updated_at || ""),
  };
}

function mapSettings(row: Record<string, unknown> | null | undefined): TravelGuideSettings {
  if (!row) return defaultGuideSettings;
  return {
    heroImage: String(row.hero_image || defaultGuideSettings.heroImage),
    heroTitleZh: String(row.hero_title_zh || defaultGuideSettings.heroTitleZh),
    heroTitleEn: String(row.hero_title_en || defaultGuideSettings.heroTitleEn),
    heroDescriptionZh: String(row.hero_description_zh || defaultGuideSettings.heroDescriptionZh),
    heroDescriptionEn: String(row.hero_description_en || defaultGuideSettings.heroDescriptionEn),
    heroScript: String(row.hero_script || defaultGuideSettings.heroScript),
  };
}

export function staticTravelGuides(): TravelGuideArticle[] {
  return staticGuideSeeds.map((item, index) => ({ ...item, id: index + 1, updatedAt: "" }));
}

export async function ensureTravelGuides() {
  await env.DB.prepare(createArticlesSql).run();
  await env.DB.prepare(createSettingsSql).run();
  await env.DB.prepare(
    `INSERT OR IGNORE INTO travel_guide_settings(id, hero_image, hero_title_zh, hero_title_en, hero_description_zh, hero_description_en, hero_script)
     VALUES(1,?,?,?,?,?,?)`,
  )
    .bind(
      defaultGuideSettings.heroImage,
      defaultGuideSettings.heroTitleZh,
      defaultGuideSettings.heroTitleEn,
      defaultGuideSettings.heroDescriptionZh,
      defaultGuideSettings.heroDescriptionEn,
      defaultGuideSettings.heroScript,
    )
    .run();
  const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM travel_guide_articles").first<{ total: number }>();
  if ((count?.total || 0) > 0) return;
  for (const item of staticTravelGuides()) {
    await createTravelGuideArticle(item);
  }
}

export async function listTravelGuides(all = false) {
  await ensureTravelGuides();
  const result = await env.DB.prepare(
    `SELECT * FROM travel_guide_articles ${all ? "" : "WHERE status='published'"} ORDER BY city, featured DESC, sort_order, id`,
  ).all();
  return result.results.map((row) => mapArticle(row as Record<string, unknown>));
}

export async function getTravelGuide(slug: string, all = false) {
  await ensureTravelGuides();
  const row = await env.DB.prepare(
    `SELECT * FROM travel_guide_articles WHERE slug=? ${all ? "" : "AND status='published'"} LIMIT 1`,
  )
    .bind(slug)
    .first();
  return row ? mapArticle(row as Record<string, unknown>) : null;
}

export async function getTravelGuideSettings() {
  await ensureTravelGuides();
  const row = await env.DB.prepare("SELECT * FROM travel_guide_settings WHERE id=1").first();
  return mapSettings(row as Record<string, unknown> | null);
}

export async function updateTravelGuideSettings(input: Partial<TravelGuideSettings>) {
  await ensureTravelGuides();
  const next = { ...defaultGuideSettings, ...input };
  await env.DB.prepare(
    `UPDATE travel_guide_settings SET hero_image=?,hero_title_zh=?,hero_title_en=?,hero_description_zh=?,hero_description_en=?,hero_script=?,updated_at=CURRENT_TIMESTAMP WHERE id=1`,
  )
    .bind(next.heroImage, next.heroTitleZh, next.heroTitleEn, next.heroDescriptionZh, next.heroDescriptionEn, next.heroScript)
    .run();
}

export async function createTravelGuideArticle(input: Partial<TravelGuideArticle>) {
  await env.DB.prepare(createArticlesSql).run();
  let slug = slugify(String(input.slug || input.titleEn || input.titleZh || ""));
  let n = 1;
  while (await env.DB.prepare("SELECT id FROM travel_guide_articles WHERE slug=?").bind(slug).first()) {
    slug = `${slugify(String(input.slug || input.titleEn || input.titleZh || ""))}-${++n}`;
  }
  const result = await env.DB.prepare(
    `INSERT INTO travel_guide_articles(slug,title_zh,title_en,city,category,summary_zh,summary_en,cover_image,image_label,read_minutes,sort_order,featured,status,content_blocks)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      slug,
      input.titleZh || "未命名攻略",
      input.titleEn || "",
      normalizeCity(input.city),
      normalizeCategory(input.category),
      input.summaryZh || "",
      input.summaryEn || "",
      input.coverImage || "",
      input.imageLabel || "",
      Number(input.readMinutes || 4),
      Number(input.sortOrder || 99),
      input.featured ? 1 : 0,
      input.status === "published" ? "published" : "draft",
      JSON.stringify(input.contentBlocks || []),
    )
    .run();
  return { id: Number(result.meta.last_row_id), slug };
}

export async function updateTravelGuideArticle(id: number, input: Partial<TravelGuideArticle>) {
  await ensureTravelGuides();
  await env.DB.prepare(
    `UPDATE travel_guide_articles SET slug=?,title_zh=?,title_en=?,city=?,category=?,summary_zh=?,summary_en=?,cover_image=?,image_label=?,read_minutes=?,sort_order=?,featured=?,status=?,content_blocks=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  )
    .bind(
      slugify(String(input.slug || input.titleEn || input.titleZh || `guide-${id}`)),
      input.titleZh || "",
      input.titleEn || "",
      normalizeCity(input.city),
      normalizeCategory(input.category),
      input.summaryZh || "",
      input.summaryEn || "",
      input.coverImage || "",
      input.imageLabel || "",
      Number(input.readMinutes || 4),
      Number(input.sortOrder || 99),
      input.featured ? 1 : 0,
      input.status === "published" ? "published" : "draft",
      JSON.stringify(input.contentBlocks || []),
      id,
    )
    .run();
}

export async function deleteTravelGuideArticle(id: number) {
  await ensureTravelGuides();
  await env.DB.prepare("DELETE FROM travel_guide_articles WHERE id=?").bind(id).run();
}
