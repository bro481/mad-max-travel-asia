import { env } from "cloudflare:workers";

export type TravelPackageStatus = "draft" | "published";

export type TravelPackageDay = {
  titleZh: string;
  titleEn: string;
  descriptionZh: string;
  descriptionEn: string;
  coverImage?: string;
  schedule?: TravelPackageSchedule[];
};

export type TravelPackageSchedule = {
  time?: string;
  titleZh: string;
  titleEn: string;
  image?: string;
  sortOrder?: number;
};

export type TravelPackage = {
  id: number;
  slug: string;
  nameZh: string;
  nameEn: string;
  days: number;
  nights: number;
  cityComboZh: string;
  cityComboEn: string;
  summaryZh: string;
  summaryEn: string;
  heroTextZh: string;
  heroTextEn: string;
  subtitleZh: string;
  subtitleEn: string;
  tags: string[];
  galleryImages: string[];
  coverImage: string;
  startingPrice: number;
  peakPrice: number | null;
  itinerary: TravelPackageDay[];
  includes: string[];
  excludes: string[];
  accommodationNoteZh: string;
  accommodationNoteEn: string;
  transferNoteZh: string;
  transferNoteEn: string;
  notesZh: string;
  notesEn: string;
  priceNoteZh: string;
  priceNoteEn: string;
  status: TravelPackageStatus;
  sortOrder: number;
  updatedAt: string;
};

const createSql = `CREATE TABLE IF NOT EXISTS travel_packages (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 slug TEXT NOT NULL UNIQUE,
 name_zh TEXT NOT NULL,
 name_en TEXT NOT NULL,
 days INTEGER NOT NULL DEFAULT 4,
 nights INTEGER NOT NULL DEFAULT 3,
 city_combo_zh TEXT NOT NULL DEFAULT '',
 city_combo_en TEXT NOT NULL DEFAULT '',
 summary_zh TEXT NOT NULL DEFAULT '',
 summary_en TEXT NOT NULL DEFAULT '',
 hero_text_zh TEXT NOT NULL DEFAULT '',
 hero_text_en TEXT NOT NULL DEFAULT '',
 subtitle_zh TEXT NOT NULL DEFAULT '',
 subtitle_en TEXT NOT NULL DEFAULT '',
 tags TEXT NOT NULL DEFAULT '[]',
 gallery_images TEXT NOT NULL DEFAULT '[]',
 cover_image TEXT NOT NULL DEFAULT '',
 starting_price INTEGER NOT NULL DEFAULT 0,
 peak_price INTEGER,
 itinerary TEXT NOT NULL DEFAULT '[]',
 includes TEXT NOT NULL DEFAULT '[]',
 excludes TEXT NOT NULL DEFAULT '[]',
 accommodation_note_zh TEXT NOT NULL DEFAULT '',
 accommodation_note_en TEXT NOT NULL DEFAULT '',
 transfer_note_zh TEXT NOT NULL DEFAULT '',
 transfer_note_en TEXT NOT NULL DEFAULT '',
 notes_zh TEXT NOT NULL DEFAULT '',
 notes_en TEXT NOT NULL DEFAULT '',
 price_note_zh TEXT NOT NULL DEFAULT '',
 price_note_en TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'draft',
 sort_order INTEGER NOT NULL DEFAULT 0,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const packageMigrationSql = [
  "ALTER TABLE travel_packages ADD COLUMN hero_text_zh TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE travel_packages ADD COLUMN hero_text_en TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE travel_packages ADD COLUMN subtitle_zh TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE travel_packages ADD COLUMN subtitle_en TEXT NOT NULL DEFAULT ''",
  "ALTER TABLE travel_packages ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'",
  "ALTER TABLE travel_packages ADD COLUMN gallery_images TEXT NOT NULL DEFAULT '[]'",
];

async function migrateTravelPackages() {
  for (const sql of packageMigrationSql) {
    try {
      await env.DB.prepare(sql).run();
    } catch {}
  }
}

const packageSeeds = [
  {
    slug: "kuala-lumpur-malacca-4d3n",
    nameZh: "吉隆坡 + 马六甲",
    nameEn: "Kuala Lumpur + Malacca",
    days: 4,
    nights: 3,
    cityComboZh: "吉隆坡 + 马六甲",
    cityComboEn: "Kuala Lumpur + Malacca",
    summaryZh: "城市地标与历史古城，感受多元魅力",
    summaryEn: "City landmarks and a historic old town in one easy route",
    coverImage: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=88",
    startingPrice: 1880,
    peakPrice: null,
    itinerary: [
      ["抵达吉隆坡", "Arrival in Kuala Lumpur", "专车接机，入住市区住宿，晚上自由探索。", "Private airport transfer, check in and free evening."],
      ["吉隆坡经典一日游", "Kuala Lumpur city highlights", "双子塔、国家皇宫、国家清真寺、独立广场与城市画廊。", "Twin Towers, palace, mosque, Merdeka Square and city gallery."],
      ["马六甲一日往返", "Malacca day trip", "鸡场街、荷兰红屋、河畔街区与当地小吃。", "Jonker Street, Dutch Square, riverside lanes and local bites."],
      ["轻松退房送机", "Departure day", "按航班时间安排送机，也可延后加购半日路线。", "Airport transfer by flight time, with optional half-day add-on."],
    ],
  },
  {
    slug: "semporna-island-4d3n",
    nameZh: "仙本那",
    nameEn: "Semporna",
    days: 4,
    nights: 3,
    cityComboZh: "仙本那",
    cityComboEn: "Semporna",
    summaryZh: "把几天时间留给海岛与阳光",
    summaryEn: "Leave a few days for islands, sea and sunshine",
    coverImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=88",
    startingPrice: 1580,
    peakPrice: null,
    itinerary: [
      ["抵达斗湖，前往仙本那", "Arrive in Tawau, transfer to Semporna", "接机后前往仙本那镇，入住休息。", "Transfer to Semporna town and settle in."],
      ["跳岛体验", "Island hopping", "安排适合季节的海岛与浮潜路线。", "Island and snorkelling route based on season and sea condition."],
      ["自由海岛日", "Flexible island day", "可选择浮潜、潜水体验或轻松海边休息。", "Choose snorkelling, intro dive or a slower beach day."],
      ["退房送机", "Departure transfer", "按航班时间送往斗湖机场。", "Transfer to Tawau airport according to flight time."],
    ],
  },
  {
    slug: "kota-kinabalu-4d3n",
    nameZh: "亚庇",
    nameEn: "Kota Kinabalu",
    days: 4,
    nights: 3,
    cityComboZh: "亚庇",
    cityComboEn: "Kota Kinabalu",
    summaryZh: "自然风光与海岛体验的轻松组合",
    summaryEn: "An easy mix of nature, islands and city time",
    coverImage: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1200&q=88",
    startingPrice: 1680,
    peakPrice: null,
    itinerary: [
      ["抵达亚庇", "Arrive in Kota Kinabalu", "专车接机，入住市区住宿。", "Private transfer and city stay check-in."],
      ["神山或红树林", "Kinabalu or mangrove route", "根据季节与体力选择自然路线。", "Choose a nature route based on season and pace."],
      ["海岛轻体验", "Island day", "出海、浮潜或沙滩休闲。", "Boat trip, snorkelling or a relaxed beach day."],
      ["自由活动与送机", "Free time and departure", "自由安排咖啡、美食或商场，随后送机。", "Free time for food, coffee or shopping before airport transfer."],
    ],
  },
  {
    slug: "kuala-lumpur-semporna-5d4n",
    nameZh: "吉隆坡 + 仙本那",
    nameEn: "Kuala Lumpur + Semporna",
    days: 5,
    nights: 4,
    cityComboZh: "吉隆坡 + 仙本那",
    cityComboEn: "Kuala Lumpur + Semporna",
    summaryZh: "城市抵达与海岛假期衔接得更轻松",
    summaryEn: "A smoother city arrival before the island escape",
    coverImage: "https://images.unsplash.com/photo-1544473244-f6895e69ad8b?auto=format&fit=crop&w=1200&q=88",
    startingPrice: 2380,
    peakPrice: null,
    itinerary: [
      ["抵达吉隆坡", "Arrive in Kuala Lumpur", "接机入住，自由适应节奏。", "Airport transfer and an easy first evening."],
      ["吉隆坡轻路线", "Kuala Lumpur highlights", "市区地标、美食与拍照点。", "City landmarks, food and photo spots."],
      ["吉隆坡 → 斗湖 → 仙本那", "Kuala Lumpur to Semporna", "协助衔接航班与当地接送。", "Flight connection and local transfers arranged."],
      ["仙本那跳岛", "Semporna island hopping", "出海浮潜或海岛游。", "Island hopping and snorkelling."],
      ["送机离开", "Departure", "按航班送至斗湖机场。", "Transfer to Tawau airport."],
    ],
  },
  {
    slug: "kuala-lumpur-kota-kinabalu-5d4n",
    nameZh: "吉隆坡 + 亚庇",
    nameEn: "Kuala Lumpur + Kota Kinabalu",
    days: 5,
    nights: 4,
    cityComboZh: "吉隆坡 + 亚庇",
    cityComboEn: "Kuala Lumpur + Kota Kinabalu",
    summaryZh: "城市、美食、自然与落日一次安排",
    summaryEn: "City, food, nature and sunsets in one plan",
    coverImage: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=88",
    startingPrice: 2280,
    peakPrice: null,
    itinerary: [
      ["抵达吉隆坡", "Arrive in Kuala Lumpur", "接机入住。", "Airport transfer and check-in."],
      ["吉隆坡城市体验", "Kuala Lumpur city day", "城市地标和当地美食。", "Landmarks and local food."],
      ["飞往亚庇", "Fly to Kota Kinabalu", "抵达后入住，傍晚看落日。", "Transfer and sunset time after arrival."],
      ["亚庇自然体验", "Kota Kinabalu nature day", "神山、红树林或海岛三选一。", "Choose Kinabalu, mangrove or island route."],
      ["送机离开", "Departure", "按航班送机。", "Airport transfer by flight time."],
    ],
  },
  {
    slug: "kota-kinabalu-semporna-6d5n",
    nameZh: "亚庇 + 仙本那",
    nameEn: "Kota Kinabalu + Semporna",
    days: 6,
    nights: 5,
    cityComboZh: "亚庇 + 仙本那",
    cityComboEn: "Kota Kinabalu + Semporna",
    summaryZh: "把沙巴的自然与海岛串成一条舒适路线",
    summaryEn: "A comfortable Sabah route from nature to islands",
    coverImage: "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=88",
    startingPrice: 2980,
    peakPrice: null,
    itinerary: [
      ["抵达亚庇", "Arrive in Kota Kinabalu", "接机入住。", "Airport transfer and check-in."],
      ["亚庇自然路线", "Kota Kinabalu nature route", "神山或红树林体验。", "Kinabalu or mangrove experience."],
      ["亚庇海岛或自由日", "Island or free day", "根据天气安排轻松出海。", "Easy island route depending on weather."],
      ["亚庇 → 斗湖 → 仙本那", "Kota Kinabalu to Semporna", "衔接航班和地面接送。", "Flight and ground transfer connection."],
      ["仙本那跳岛", "Semporna island hopping", "海岛、浮潜与拍照。", "Islands, snorkelling and photos."],
      ["送机离开", "Departure", "送至斗湖机场。", "Transfer to Tawau airport."],
    ],
  },
  {
    slug: "kuala-lumpur-malacca-penang-6d5n",
    nameZh: "吉隆坡 + 马六甲 + 槟城",
    nameEn: "Kuala Lumpur + Malacca + Penang",
    days: 6,
    nights: 5,
    cityComboZh: "吉隆坡 + 马六甲 + 槟城",
    cityComboEn: "Kuala Lumpur + Malacca + Penang",
    summaryZh: "西马城市文化、美食与古城节奏",
    summaryEn: "West Malaysia cities, food and heritage at a relaxed pace",
    coverImage: "https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?auto=format&fit=crop&w=1200&q=88",
    startingPrice: 2880,
    peakPrice: null,
    itinerary: [
      ["抵达吉隆坡", "Arrive in Kuala Lumpur", "接机入住。", "Airport transfer and check-in."],
      ["吉隆坡经典路线", "Kuala Lumpur city route", "市区地标与美食。", "City landmarks and food."],
      ["马六甲一日", "Malacca day", "古城、河畔与小吃。", "Old town, riverside and local snacks."],
      ["前往槟城", "Travel to Penang", "跨城交通与入住安排。", "Intercity transfer and check-in."],
      ["槟城文化与美食", "Penang culture and food", "乔治市、街头艺术与美食。", "George Town, street art and food."],
      ["送机离开", "Departure", "按航班送机。", "Airport transfer by flight time."],
    ],
  },
  {
    slug: "kuala-lumpur-semporna-kota-kinabalu-7d6n",
    nameZh: "吉隆坡 + 仙本那 + 亚庇",
    nameEn: "Kuala Lumpur + Semporna + Kota Kinabalu",
    days: 7,
    nights: 6,
    cityComboZh: "吉隆坡 + 仙本那 + 亚庇",
    cityComboEn: "Kuala Lumpur + Semporna + Kota Kinabalu",
    summaryZh: "城市抵达、海岛假期与沙巴自然组合",
    summaryEn: "City arrival, islands and Sabah nature in one route",
    coverImage: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=88",
    startingPrice: 3580,
    peakPrice: null,
    itinerary: [
      ["抵达吉隆坡", "Arrive in Kuala Lumpur", "接机入住。", "Airport transfer and check-in."],
      ["吉隆坡经典一日", "Kuala Lumpur city day", "经典地标和美食。", "Classic landmarks and food."],
      ["飞往仙本那", "Fly to Semporna", "衔接航班与地面接送。", "Flight and ground transfer connection."],
      ["仙本那跳岛", "Semporna island hopping", "出海浮潜。", "Island hopping and snorkelling."],
      ["前往亚庇", "Travel to Kota Kinabalu", "抵达后自由活动。", "Arrival and free time."],
      ["亚庇自然体验", "Kota Kinabalu nature", "神山、红树林或海岛路线。", "Kinabalu, mangrove or island route."],
      ["送机离开", "Departure", "按航班送机。", "Airport transfer by flight time."],
    ],
  },
  {
    slug: "malaysia-comfort-loop-8d7n",
    nameZh: "马来西亚舒适环线",
    nameEn: "Malaysia Comfort Loop",
    days: 8,
    nights: 7,
    cityComboZh: "吉隆坡 + 马六甲 + 亚庇 + 仙本那",
    cityComboEn: "Kuala Lumpur + Malacca + Kota Kinabalu + Semporna",
    summaryZh: "适合第一次来马来西亚的完整轻松路线",
    summaryEn: "A complete, relaxed route for a first Malaysia trip",
    coverImage: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=88",
    startingPrice: 4280,
    peakPrice: null,
    itinerary: [
      ["抵达吉隆坡", "Arrive in Kuala Lumpur", "接机入住。", "Airport transfer and check-in."],
      ["吉隆坡经典路线", "Kuala Lumpur city route", "市区地标和美食。", "City landmarks and food."],
      ["马六甲一日", "Malacca day", "历史古城一日往返。", "Historic old town day trip."],
      ["飞往亚庇", "Fly to Kota Kinabalu", "抵达后自由活动。", "Arrival and free time."],
      ["亚庇自然体验", "Kota Kinabalu nature", "神山或红树林。", "Kinabalu or mangrove route."],
      ["前往仙本那", "Travel to Semporna", "航班与地面接送衔接。", "Flight and ground transfer connection."],
      ["仙本那跳岛", "Semporna island hopping", "海岛与浮潜体验。", "Island and snorkelling day."],
      ["送机离开", "Departure", "送至斗湖机场。", "Transfer to Tawau airport."],
    ],
  },
] as const;

const defaultIncludes = ["行程规划", "当地中文沟通协助", "路线内接送安排建议", "住宿与服务组合建议"];
const defaultExcludes = ["国际/国内机票", "个人消费", "景点门票及自费项目", "旺季价格差额"];
const defaultTags = ["城市地标", "历史文化", "美食探索", "适合家庭 / 情侣"];
const dayImages = [
  "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=84",
  "https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?auto=format&fit=crop&w=800&q=84",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=84",
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=84",
];

const parseJson = <T>(value: unknown, fallback: T): T => {
  try {
    return JSON.parse(String(value || "")) as T;
  } catch {
    return fallback;
  }
};

function valueOrEmpty(value: unknown) {
  if (value === undefined || value === null) return "";
  return String(value);
}

function normalizeItinerary(days: TravelPackageDay[], coverImage: string) {
  return days.map((day, index) => ({
    ...day,
    coverImage: day.coverImage || dayImages[index % dayImages.length] || coverImage,
    schedule: (day.schedule && day.schedule.length ? day.schedule : [
      { titleZh: day.descriptionZh || day.titleZh, titleEn: day.descriptionEn || day.titleEn, image: day.coverImage || dayImages[index % dayImages.length], sortOrder: 1 },
      { titleZh: index === days.length - 1 ? "根据航班时间安排送机" : "自由活动或返回酒店", titleEn: index === days.length - 1 ? "Airport transfer by flight time" : "Free time or return to hotel", sortOrder: 2 },
    ]).map((slot, slotIndex) => ({ ...slot, sortOrder: slot.sortOrder ?? slotIndex + 1 })),
  }));
}

export function staticTravelPackages(): TravelPackage[] {
  return packageSeeds.map((seed, index) => ({
    id: index + 1,
    slug: seed.slug,
    nameZh: seed.nameZh,
    nameEn: seed.nameEn,
    days: seed.days,
    nights: seed.nights,
    cityComboZh: seed.cityComboZh,
    cityComboEn: seed.cityComboEn,
    summaryZh: seed.summaryZh,
    summaryEn: seed.summaryEn,
    heroTextZh: "从现代都市到历史古城，遇见不一样的马来西亚。",
    heroTextEn: "From modern skylines to heritage towns, discover a different Malaysia.",
    subtitleZh: `${seed.days}天${seed.nights}晚 · 经典城市之旅`,
    subtitleEn: `${seed.days}D${seed.nights}N · Classic private route`,
    tags: [...defaultTags],
    galleryImages: [seed.coverImage, ...dayImages],
    coverImage: seed.coverImage,
    startingPrice: seed.startingPrice,
    peakPrice: seed.peakPrice,
    itinerary: normalizeItinerary(seed.itinerary.map(([titleZh, titleEn, descriptionZh, descriptionEn]) => ({ titleZh, titleEn, descriptionZh, descriptionEn })), seed.coverImage),
    includes: [...defaultIncludes],
    excludes: [...defaultExcludes],
    accommodationNoteZh: "住宿可按预算与人数调整，最终以咨询确认为准。",
    accommodationNoteEn: "Accommodation can be adjusted by budget and group size.",
    transferNoteZh: "接送与跨城交通会根据航班和当天路线安排。",
    transferNoteEn: "Transfers are arranged around flights and the route of the day.",
    notesZh: "行程可根据季节、天气、同行人数和兴趣微调。",
    notesEn: "The route can be adjusted by season, weather, group size and interests.",
    priceNoteZh: "价格为参考起价，不含机票，旺季和节假日价格可能调整。",
    priceNoteEn: "Prices are starting references, excluding flights. Peak dates may vary.",
    status: "published",
    sortOrder: index + 1,
    updatedAt: "",
  }));
}

export async function ensureTravelPackages() {
  await env.DB.prepare(createSql).run();
  await migrateTravelPackages();
  const row = await env.DB.prepare("SELECT COUNT(*) total FROM travel_packages").first<{ total: number }>();
  if ((row?.total || 0) > 0) return;
  for (let index = 0; index < staticTravelPackages().length; index += 1) {
    const item = staticTravelPackages()[index];
    await env.DB.prepare(
      `INSERT INTO travel_packages (
        slug,name_zh,name_en,days,nights,city_combo_zh,city_combo_en,summary_zh,summary_en,hero_text_zh,hero_text_en,subtitle_zh,subtitle_en,tags,gallery_images,cover_image,
        starting_price,peak_price,itinerary,includes,excludes,accommodation_note_zh,accommodation_note_en,
        transfer_note_zh,transfer_note_en,notes_zh,notes_en,price_note_zh,price_note_en,status,sort_order
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    )
      .bind(
        item.slug,
        item.nameZh,
        item.nameEn,
        item.days,
        item.nights,
        item.cityComboZh,
        item.cityComboEn,
        item.summaryZh,
        item.summaryEn,
        item.heroTextZh,
        item.heroTextEn,
        item.subtitleZh,
        item.subtitleEn,
        JSON.stringify(item.tags),
        JSON.stringify(item.galleryImages),
        item.coverImage,
        item.startingPrice,
        item.peakPrice,
        JSON.stringify(item.itinerary),
        JSON.stringify(item.includes),
        JSON.stringify(item.excludes),
        item.accommodationNoteZh,
        item.accommodationNoteEn,
        item.transferNoteZh,
        item.transferNoteEn,
        item.notesZh,
        item.notesEn,
        item.priceNoteZh,
        item.priceNoteEn,
        item.status,
        item.sortOrder,
      )
      .run();
  }
}

export function mapTravelPackage(row: Record<string, unknown>): TravelPackage {
  const coverImage = String(row.cover_image || "");
  const itinerary = normalizeItinerary(parseJson<TravelPackageDay[]>(row.itinerary, []), coverImage);
  const galleryImages = parseJson<string[]>(row.gallery_images, []);
  return {
    id: Number(row.id),
    slug: String(row.slug),
    nameZh: String(row.name_zh),
    nameEn: String(row.name_en),
    days: Number(row.days),
    nights: Number(row.nights),
    cityComboZh: String(row.city_combo_zh),
    cityComboEn: String(row.city_combo_en),
    summaryZh: String(row.summary_zh),
    summaryEn: String(row.summary_en),
    heroTextZh: valueOrEmpty(row.hero_text_zh) || "从现代都市到历史古城，遇见不一样的马来西亚。",
    heroTextEn: valueOrEmpty(row.hero_text_en) || "From modern skylines to heritage towns, discover a different Malaysia.",
    subtitleZh: valueOrEmpty(row.subtitle_zh) || `${Number(row.days)}天${Number(row.nights)}晚 · 经典城市之旅`,
    subtitleEn: valueOrEmpty(row.subtitle_en) || `${Number(row.days)}D${Number(row.nights)}N · Classic private route`,
    tags: parseJson<string[]>(row.tags, defaultTags),
    galleryImages: galleryImages.length ? galleryImages : [coverImage, ...itinerary.map((day) => day.coverImage).filter((x): x is string => Boolean(x))],
    coverImage,
    startingPrice: Number(row.starting_price),
    peakPrice: row.peak_price === null || row.peak_price === undefined ? null : Number(row.peak_price),
    itinerary,
    includes: parseJson<string[]>(row.includes, []),
    excludes: parseJson<string[]>(row.excludes, []),
    accommodationNoteZh: String(row.accommodation_note_zh),
    accommodationNoteEn: String(row.accommodation_note_en),
    transferNoteZh: String(row.transfer_note_zh),
    transferNoteEn: String(row.transfer_note_en),
    notesZh: String(row.notes_zh),
    notesEn: String(row.notes_en),
    priceNoteZh: String(row.price_note_zh),
    priceNoteEn: String(row.price_note_en),
    status: String(row.status) === "published" ? "published" : "draft",
    sortOrder: Number(row.sort_order),
    updatedAt: String(row.updated_at),
  };
}

export async function listTravelPackages(all = false) {
  await ensureTravelPackages();
  const result = await env.DB.prepare(
    `SELECT * FROM travel_packages ${all ? "" : "WHERE status='published'"} ORDER BY days, sort_order, id`,
  ).all();
  return result.results.map((item) => mapTravelPackage(item as Record<string, unknown>));
}

export async function getTravelPackage(slug: string, all = false) {
  await ensureTravelPackages();
  const row = await env.DB.prepare(
    `SELECT * FROM travel_packages WHERE slug=? ${all ? "" : "AND status='published'"} LIMIT 1`,
  )
    .bind(slug)
    .first();
  return row ? mapTravelPackage(row as Record<string, unknown>) : null;
}

export async function createTravelPackage(input: Partial<TravelPackage>) {
  await ensureTravelPackages();
  const base =
    String(input.slug || input.nameEn || input.nameZh || `package-${Date.now()}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `package-${Date.now()}`;
  let slug = base;
  let n = 1;
  while (await env.DB.prepare("SELECT id FROM travel_packages WHERE slug=?").bind(slug).first()) {
    slug = `${base}-${++n}`;
  }
  const result = await env.DB.prepare(
    `INSERT INTO travel_packages (
      slug,name_zh,name_en,days,nights,city_combo_zh,city_combo_en,summary_zh,summary_en,
      hero_text_zh,hero_text_en,subtitle_zh,subtitle_en,tags,gallery_images,cover_image,starting_price,peak_price,
      itinerary,includes,excludes,accommodation_note_zh,accommodation_note_en,transfer_note_zh,transfer_note_en,
      notes_zh,notes_en,price_note_zh,price_note_en,status,sort_order
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      slug,
      input.nameZh || "未命名套餐",
      input.nameEn || "Untitled Package",
      input.days || 4,
      input.nights || Math.max(0, Number(input.days || 4) - 1),
      input.cityComboZh || "",
      input.cityComboEn || "",
      input.summaryZh || "",
      input.summaryEn || "",
      input.heroTextZh || "",
      input.heroTextEn || "",
      input.subtitleZh || "",
      input.subtitleEn || "",
      JSON.stringify(input.tags || []),
      JSON.stringify(input.galleryImages || []),
      input.coverImage || "",
      input.startingPrice || 0,
      input.peakPrice ?? null,
      JSON.stringify(input.itinerary || []),
      JSON.stringify(input.includes || defaultIncludes),
      JSON.stringify(input.excludes || defaultExcludes),
      input.accommodationNoteZh || "",
      input.accommodationNoteEn || "",
      input.transferNoteZh || "",
      input.transferNoteEn || "",
      input.notesZh || "",
      input.notesEn || "",
      input.priceNoteZh || "",
      input.priceNoteEn || "",
      input.status || "draft",
      input.sortOrder || 99,
    )
    .run();
  return { id: result.meta.last_row_id, slug };
}

export async function updateTravelPackage(id: number, input: Partial<TravelPackage>) {
  await ensureTravelPackages();
  await env.DB.prepare(
    `UPDATE travel_packages SET
      slug=?,name_zh=?,name_en=?,days=?,nights=?,city_combo_zh=?,city_combo_en=?,summary_zh=?,summary_en=?,
      hero_text_zh=?,hero_text_en=?,subtitle_zh=?,subtitle_en=?,tags=?,gallery_images=?,cover_image=?,
      starting_price=?,peak_price=?,itinerary=?,includes=?,excludes=?,accommodation_note_zh=?,accommodation_note_en=?,
      transfer_note_zh=?,transfer_note_en=?,notes_zh=?,notes_en=?,price_note_zh=?,price_note_en=?,status=?,sort_order=?,updated_at=CURRENT_TIMESTAMP
     WHERE id=?`,
  )
    .bind(
      input.slug || `package-${id}`,
      input.nameZh || "",
      input.nameEn || "",
      input.days || 4,
      input.nights ?? Math.max(0, Number(input.days || 4) - 1),
      input.cityComboZh || "",
      input.cityComboEn || "",
      input.summaryZh || "",
      input.summaryEn || "",
      input.heroTextZh || "",
      input.heroTextEn || "",
      input.subtitleZh || "",
      input.subtitleEn || "",
      JSON.stringify(input.tags || []),
      JSON.stringify(input.galleryImages || []),
      input.coverImage || "",
      input.startingPrice || 0,
      input.peakPrice ?? null,
      JSON.stringify(input.itinerary || []),
      JSON.stringify(input.includes || []),
      JSON.stringify(input.excludes || []),
      input.accommodationNoteZh || "",
      input.accommodationNoteEn || "",
      input.transferNoteZh || "",
      input.transferNoteEn || "",
      input.notesZh || "",
      input.notesEn || "",
      input.priceNoteZh || "",
      input.priceNoteEn || "",
      input.status === "published" ? "published" : "draft",
      input.sortOrder || 0,
      id,
    )
    .run();
}

export async function getTravelPackageById(id: number, all = false) {
  await ensureTravelPackages();
  const row = await env.DB.prepare(
    `SELECT * FROM travel_packages WHERE id=? ${all ? "" : "AND status='published'"} LIMIT 1`,
  )
    .bind(id)
    .first();
  return row ? mapTravelPackage(row as Record<string, unknown>) : null;
}

export async function duplicateTravelPackage(id: number) {
  const source = await getTravelPackageById(id, true);
  if (!source) throw new Error("Package not found");
  const copy = await createTravelPackage({
    ...source,
    id: 0,
    slug: `${source.slug}-copy-${Date.now().toString(36)}`,
    nameZh: `${source.nameZh} 副本`,
    nameEn: `${source.nameEn} Copy`,
    status: "draft",
    sortOrder: source.sortOrder + 1,
  });
  return copy;
}

export async function deleteTravelPackage(id: number) {
  await ensureTravelPackages();
  await env.DB.prepare("DELETE FROM travel_packages WHERE id=?").bind(id).run();
}
