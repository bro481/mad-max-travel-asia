import type { PropertyRecord } from "../../../../db/properties";

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=84`;

let items: PropertyRecord[] = [
  {
    id: 1,
    slug: "local-kl-stay",
    nameZh: "吉隆坡市中心双卧公寓",
    nameEn: "KL City Centre Two-bedroom Stay",
    city: "吉隆坡",
    areaZh: "KLCC / 武吉免登",
    areaEn: "KLCC / Bukit Bintang",
    tags: ["市中心", "适合家庭", "近商圈"],
    images: [
      img("photo-1505693416388-ac5ce068fe85"),
      img("photo-1522708323590-d24dbb6b0267"),
    ],
    imageCategories: {},
    imageOriginals: {},
    guests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    descriptionZh: "本地预览用房源，方便在没有 Cloudflare 数据库时打开后台。",
    descriptionEn: "Local preview stay for opening the admin without Cloudflare bindings.",
    amenities: ["高速 WiFi", "空调", "设备齐全的厨房", "洗衣机"],
    highlights: [
      { title: "市中心位置", description: "出行方便" },
      { title: "适合家庭", description: "两间卧室" },
    ],
    suitableFor: ["家庭", "朋友出行", "短住"],
    guestQuote: "",
    guestQuoteAuthor: "",
    nearby: [
      { name: "KLCC", type: "地标", distance: "约 8 分钟车程" },
      { name: "Bukit Bintang", type: "商圈", distance: "约 10 分钟车程" },
    ],
    priceFrom: 380,
    priceNote: "价格请咨询",
    status: "published",
    updatedAt: new Date().toISOString(),
  },
];

export function useLocalProperties() {
  return process.env.NODE_ENV === "development";
}

export function listLocalProperties() {
  return items;
}

export function getLocalProperty(id: number) {
  return items.find((item) => item.id === id) || null;
}

export function createLocalProperty(item: Partial<PropertyRecord>) {
  const id = Math.max(0, ...items.map((current) => current.id)) + 1;
  const next = {
    ...items[0],
    ...item,
    id,
    slug: item.slug || `local-property-${id}`,
    status: "draft",
    updatedAt: new Date().toISOString(),
  } as PropertyRecord;
  items = [...items, next];
  return next;
}

export function updateLocalProperty(id: number, item: PropertyRecord) {
  const next = { ...item, id, updatedAt: new Date().toISOString() };
  items = items.map((current) => (current.id === id ? next : current));
  return next;
}

export function deleteLocalProperty(id: number) {
  items = items.filter((item) => item.id !== id);
}
