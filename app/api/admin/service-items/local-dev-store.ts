import type { ServiceItem, ServiceRoutePlan } from "../../../../db/service-items";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=84`;

const storePath = join(process.cwd(), ".local-preview", "service-items.json");

function defaultRoutePlans(city = "吉隆坡"): ServiceRoutePlan[] {
  const cityName = city || "吉隆坡";
  const klRoutes =
    cityName.includes("吉隆坡") || cityName.toLowerCase().includes("kuala");
  if (klRoutes) {
    return [
      {
        name: "吉隆坡经典一日游",
        nameZh: "吉隆坡经典一日游",
        nameEn: "Kuala Lumpur Classic Day Tour",
        duration: "约 8 小时",
        tag: "首次到访",
        tags: ["约8小时", "首次到访"],
        description: "双子塔、独立广场与茨厂街",
        descriptionZh: "双子塔、独立广场与茨厂街",
        descriptionEn: "Twin Towers, Merdeka Square and Chinatown",
        stops: "双子塔 · 独立广场 · 茨厂街",
        visible: true,
        sortOrder: 1,
        image: img("photo-1596422846543-75c6fc197f07"),
        nodes: [
          { nameZh: "酒店接送", nameEn: "Hotel pickup", descriptionZh: "从酒店出发，按当天时间灵活安排。", descriptionEn: "Depart from your hotel with a flexible schedule.", image: img("photo-1549317661-bd32c8ce0db2"), stayTime: "" },
          { nameZh: "双子塔", nameEn: "Petronas Twin Towers", descriptionZh: "吉隆坡城市地标，适合拍照与短暂停留。", descriptionEn: "KL landmark for photos and a short stop.", image: img("photo-1596422846543-75c6fc197f07"), stayTime: "约45分钟" },
          { nameZh: "独立广场", nameEn: "Merdeka Square", descriptionZh: "历史建筑与城市广场，了解吉隆坡旧城风貌。", descriptionEn: "Historic buildings and old city atmosphere.", image: img("photo-1580193769210-b8d1c049a7d9"), stayTime: "约45分钟" },
          { nameZh: "茨厂街", nameEn: "Petaling Street", descriptionZh: "本地街区、小吃与伴手礼，可自由停留。", descriptionEn: "Local street, snacks and souvenir stops.", image: img("photo-1528127269322-539801943592"), stayTime: "约1小时" },
        ],
      },
      {
        name: "黑风洞文化路线",
        nameZh: "黑风洞文化路线",
        nameEn: "Batu Caves Cultural Route",
        duration: "约 10 小时",
        tag: "家庭友好",
        tags: ["约10小时", "家庭友好"],
        description: "黑风洞、国家皇宫与城市地标",
        descriptionZh: "黑风洞、国家皇宫与城市地标",
        descriptionEn: "Batu Caves, National Palace and city landmarks",
        stops: "黑风洞 · 国家皇宫 · 城市地标",
        visible: true,
        sortOrder: 2,
        image: img("photo-1585411017318-3f9952a9bfb2"),
        nodes: [
          { nameZh: "酒店接送", nameEn: "Hotel pickup", descriptionZh: "从酒店出发前往黑风洞。", descriptionEn: "Depart from your hotel to Batu Caves.", image: img("photo-1549317661-bd32c8ce0db2"), stayTime: "" },
          { nameZh: "黑风洞", nameEn: "Batu Caves", descriptionZh: "彩虹阶梯与印度教文化地标。", descriptionEn: "Rainbow stairs and Hindu cultural landmark.", image: img("photo-1585411017318-3f9952a9bfb2"), stayTime: "约1.5小时" },
          { nameZh: "国家皇宫", nameEn: "National Palace", descriptionZh: "外观拍照，轻松停留。", descriptionEn: "Photo stop outside the palace.", image: img("photo-1564507592333-c60657eea523"), stayTime: "约30分钟" },
          { nameZh: "返回酒店", nameEn: "Return", descriptionZh: "按约定时间返回酒店。", descriptionEn: "Return to your hotel at the agreed time.", image: img("photo-1515569067071-ec3b51335dd0"), stayTime: "" },
        ],
      },
      {
        name: "美食购物休闲路线",
        nameZh: "美食购物休闲路线",
        nameEn: "Food, Shopping & Leisure Route",
        duration: "约 6 小时",
        tag: "适合购物",
        tags: ["约6小时", "适合购物"],
        description: "武吉免登、Pavilion与当地美食",
        descriptionZh: "武吉免登、Pavilion与当地美食",
        descriptionEn: "Bukit Bintang, Pavilion and local food",
        stops: "武吉免登 · Pavilion · 本地美食",
        visible: true,
        sortOrder: 3,
        image: img("photo-1514933651103-005eec06c04b"),
        nodes: [
          { nameZh: "酒店接送", nameEn: "Hotel pickup", descriptionZh: "从酒店出发，安排轻松购物路线。", descriptionEn: "Depart from your hotel for a relaxed shopping route.", image: img("photo-1549317661-bd32c8ce0db2"), stayTime: "" },
          { nameZh: "武吉免登", nameEn: "Bukit Bintang", descriptionZh: "吉隆坡核心商圈，适合购物和逛街。", descriptionEn: "Central shopping district in Kuala Lumpur.", image: img("photo-1508009603885-50cf7c579365"), stayTime: "约2小时" },
          { nameZh: "Pavilion", nameEn: "Pavilion", descriptionZh: "商场休闲与品牌购物。", descriptionEn: "Mall leisure and brand shopping.", image: img("photo-1519566335946-e6f65f0f4fdf"), stayTime: "约1.5小时" },
          { nameZh: "本地美食", nameEn: "Local food", descriptionZh: "可按口味安排夜市、餐厅或咖啡馆。", descriptionEn: "Night market, restaurant or cafe based on your taste.", image: img("photo-1514933651103-005eec06c04b"), stayTime: "约1小时" },
        ],
      },
    ];
  }
  return [
    {
      name: `${cityName}经典一日游`,
      nameZh: `${cityName}经典一日游`,
      nameEn: `${cityName} Classic Day Tour`,
      duration: "约 8 小时",
      tag: "首次到访",
      tags: ["首次到访", "经典路线"],
      description: "城市地标、文化街区与本地美食",
      descriptionZh: "城市地标、文化街区与本地美食",
      descriptionEn: "City landmarks, cultural streets and local food",
      stops: "酒店接送 · 城市地标 · 文化街区 · 返回酒店",
      visible: true,
      sortOrder: 1,
      image: img("photo-1500530855697-b586d89ba3ee"),
      nodes: [
        { nameZh: "酒店接送", nameEn: "Hotel pickup", descriptionZh: "从酒店出发", descriptionEn: "Depart from your hotel", image: img("photo-1549317661-bd32c8ce0db2"), stayTime: "" },
        { nameZh: "城市地标", nameEn: "City landmark", descriptionZh: "经典拍照点与城市风景", descriptionEn: "Classic photo stop and city view", image: img("photo-1500530855697-b586d89ba3ee"), stayTime: "约45分钟" },
        { nameZh: "文化街区", nameEn: "Cultural street", descriptionZh: "轻松散步与本地小吃", descriptionEn: "Easy walk and local snacks", image: img("photo-1528127269322-539801943592"), stayTime: "约1小时" },
        { nameZh: "返回酒店", nameEn: "Return", descriptionZh: "按约定时间返回酒店", descriptionEn: "Return to your hotel at the agreed time", image: img("photo-1515569067071-ec3b51335dd0"), stayTime: "" },
      ],
    },
  ];
}

const seedItems: ServiceItem[] = [
  {
    id: 1,
    slug: "kk-airport-transfer",
    type: "交通接送",
    destinationId: 2,
    city: "亚庇",
    category: "交通服务",
    categoryId: 1,
    templateType: "transfer",
    displayOrder: 1,
    nameZh: "亚庇机场接送",
    nameEn: "Kota Kinabalu Airport Transfer",
    subtitleZh: "机场 ↔ 酒店 / 市区",
    subtitleEn: "Airport ↔ Hotel / City",
    introZh: "",
    introEn: "",
    images: [
      img("photo-1549317661-bd32c8ce0db2"),
      img("photo-1550355291-bbee04a92027"),
      img("photo-1515569067071-ec3b51335dd0"),
    ],
    tags: ["提前预约", "中文沟通"],
    steps: [],
    routeSectionTitleZh: "热门包车方案",
    routeSectionTitleEn: "Popular Private Car Routes",
    routeSectionIntroZh: "以下路线仅作参考，可根据您的时间与兴趣灵活调整。",
    routeSectionIntroEn: "These routes are examples and can be adjusted around your time and interests.",
    routes: [],
    timeline: [],
    inquiryFields: ["接送日期", "接机 / 送机", "航班号", "酒店 / 接送地址", "同行人数", "行李数量"],
    inquiryRequired: ["接送日期", "航班号", "同行人数", "行李数量"],
    inquiryPromptFields: ["接送日期", "航班号", "同行人数", "行李数量"],
    maxGuests: 14,
    guestNote: "根据同行人数及行李数量匹配合适车型",
    airports: ["BKI"],
    directions: ["机场 → 酒店 / 市区", "酒店 / 市区 → 机场"],
    serviceAreas: ["亚庇市区", "丹绒亚路", "郊区可咨询"],
    otherAreaNote: "其他区域可咨询",
    vehicleDisplayMode: "车型类别",
    vehicles: [
      {
        image: img("photo-1549317661-bd32c8ce0db2"),
        nameZh: "舒适轿车",
        nameEn: "Sedan",
        people: "1–3 人",
        luggage: "2–3 件",
        description: "少人数出行",
        price: 0,
        visible: true,
        internalNote: "",
      },
      {
        image: img("photo-1550355291-bbee04a92027"),
        nameZh: "多人车型",
        nameEn: "MPV",
        people: "4–6 人",
        luggage: "4–5 件",
        description: "家庭 / 小团体",
        price: 0,
        visible: true,
        internalNote: "",
      },
      {
        image: img("photo-1515569067071-ec3b51335dd0"),
        nameZh: "商务 Van",
        nameEn: "Van",
        people: "7–14 人",
        luggage: "按需",
        description: "多人 / 多行李",
        price: 0,
        visible: true,
        internalNote: "",
      },
    ],
    priceMode: "咨询报价",
    price: 0,
    priceUnit: "每次",
    priceNote: "",
    status: "published",
    updatedAt: new Date().toISOString(),
  },
];

function normalize(item: Partial<ServiceItem>, fallbackId = 1): ServiceItem {
  const base = seedItems[0];
  const type = String(item.type || base.type);
  return {
    ...base,
    ...item,
    id: Number(item.id || fallbackId),
    slug: String(item.slug || `local-service-${fallbackId}`),
    type,
    destinationId: Number(item.destinationId || (String(item.city || base.city) === "吉隆坡" ? 1 : String(item.city || base.city) === "亚庇" ? 2 : String(item.city || base.city) === "仙本那" ? 3 : String(item.city || base.city) === "马六甲" ? 4 : String(item.city || base.city) === "新加坡" ? 5 : 0)),
    city: String(item.city || base.city),
    category: String(item.category || base.category),
    categoryId: Number(item.categoryId || 1),
    templateType: (item.templateType || (type === "交通接送" ? "transfer" : type === "私人包车" ? "route" : "experience")) as ServiceItem["templateType"],
    displayOrder: Number(item.displayOrder || fallbackId),
    images: Array.isArray(item.images) ? item.images : [],
    tags: Array.isArray(item.tags) ? item.tags : [],
    steps: Array.isArray(item.steps) ? item.steps : [],
    routeSectionTitleZh: String(item.routeSectionTitleZh || base.routeSectionTitleZh || "热门包车方案"),
    routeSectionTitleEn: String(item.routeSectionTitleEn || base.routeSectionTitleEn || "Popular Private Car Routes"),
    routeSectionIntroZh: String(item.routeSectionIntroZh || base.routeSectionIntroZh || "以下路线仅作参考，可根据您的时间与兴趣灵活调整。"),
    routeSectionIntroEn: String(item.routeSectionIntroEn || base.routeSectionIntroEn || "These routes are examples and can be adjusted around your time and interests."),
    routes: Array.isArray(item.routes) && item.routes.length ? item.routes : ((item.templateType === "route" || type === "私人包车") ? defaultRoutePlans(String(item.city || base.city)) : []),
    timeline: Array.isArray(item.timeline) ? item.timeline : [],
    inquiryFields: Array.isArray(item.inquiryFields) ? item.inquiryFields : [],
    inquiryRequired: Array.isArray(item.inquiryRequired) ? item.inquiryRequired : [],
    inquiryPromptFields: Array.isArray(item.inquiryPromptFields) ? item.inquiryPromptFields : [],
    vehicles: Array.isArray(item.vehicles) ? item.vehicles : [],
    status: item.status || "draft",
    updatedAt: String(item.updatedAt || new Date().toISOString()),
  };
}

function loadItems(): ServiceItem[] {
  if (!existsSync(storePath)) return seedItems;
  try {
    const parsed = JSON.parse(readFileSync(storePath, "utf8"));
    if (!Array.isArray(parsed)) return seedItems;
    return parsed.map((item, index) => normalize(item, index + 1));
  } catch {
    return seedItems;
  }
}

function saveItems() {
  mkdirSync(dirname(storePath), { recursive: true });
  writeFileSync(storePath, JSON.stringify(items, null, 2));
}

let items: ServiceItem[] = loadItems();

export function useLocalServiceItems() {
  return process.env.NODE_ENV === "development";
}

export function listLocalServiceItems() {
  items = loadItems();
  return items;
}

export function getLocalServiceItem(id: number) {
  items = loadItems();
  return items.find((item) => item.id === id) || null;
}

export function getLocalServiceItemBySlug(slug: string) {
  items = loadItems();
  return items.find((item) => item.slug === slug) || null;
}

export function updateLocalServiceItem(id: number, item: ServiceItem) {
  const next = { ...item, id, updatedAt: new Date().toISOString() };
  items = items.map((current) => (current.id === id ? next : current));
  saveItems();
  return next;
}

export function createLocalServiceItem(item: Partial<ServiceItem>) {
  const id = Math.max(0, ...items.map((current) => current.id)) + 1;
  const base = items[0];
  const templateType = item.templateType || (item.type === "私人包车" ? "route" : item.type === "交通接送" ? "transfer" : "experience");
  const isRoute = templateType === "route" || item.type === "私人包车";
  const next = {
    ...base,
    ...item,
    id,
    slug: item.slug || `local-service-${id}`,
    templateType,
    routeSectionTitleZh: item.routeSectionTitleZh || (isRoute ? "热门包车方案" : ""),
    routeSectionTitleEn: item.routeSectionTitleEn || (isRoute ? "Popular Private Car Routes" : ""),
    routeSectionIntroZh: item.routeSectionIntroZh || (isRoute ? "以下路线仅作参考，可根据您的时间与兴趣灵活调整。" : ""),
    routeSectionIntroEn: item.routeSectionIntroEn || (isRoute ? "These routes are examples and can be adjusted around your time and interests." : ""),
    routes: Array.isArray(item.routes) && item.routes.length ? item.routes : isRoute ? defaultRoutePlans(item.city || base.city) : [],
    status: "draft",
    updatedAt: new Date().toISOString(),
  } as ServiceItem;
  items = [...items, next];
  saveItems();
  return next;
}
