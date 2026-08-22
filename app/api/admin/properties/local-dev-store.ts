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
    spaceConfig: {
      layout: "2室1厅1卫",
      area: "约78㎡",
      floor: "18楼",
      livingRooms: 1,
      recommendedGuests: "2–4人",
      maxGuests: 4,
      locationDisplayZh: "KLCC附近 · 市中心",
      locationDisplayEn: "Near KLCC · City Centre",
      internalNote: "本地开发预览数据，可直接编辑测试。",
      checkInTime: "15:00后",
      checkOutTime: "11:00前",
      checkInMethod: "确认后发送入住说明",
      guestRule: "最多4位客人",
      useDefaultReminders: true,
      reminders: [
        { icon: "🚭", text: "室内请勿吸烟" },
        { icon: "🎉", text: "请勿举办聚会" },
        { icon: "🧹", text: "请保持室内整洁" },
        { icon: "🐾", text: "不允许携带宠物" },
      ],
      nearbyNote: "位于吉隆坡核心区域，周边购物、餐饮和交通方便。",
      currency: "CNY / 人民币",
      priceUnit: "/晚",
      showPriceFrom: true,
      sortOrder: 1,
      visible: true,
    },
    sleepingArrangements: [
      { space: "主卧", bedType: "Queen Bed", width: "1.5", length: "2.0", quantity: 1, sleeps: 2 },
      { space: "次卧", bedType: "单人床", width: "0.9", length: "2.0", quantity: 2, sleeps: 2 },
    ],
    nearby: [
      { name: "吉隆坡双子塔", nameEn: "Petronas Twin Towers", type: "景点", transport: "驾车", duration: "8分钟", distance: "驾车约8分钟", icon: "🏙" },
      { name: "武吉免登", nameEn: "Bukit Bintang", type: "购物", transport: "驾车", duration: "10分钟", distance: "驾车约10分钟", icon: "🛍" },
    ],
    priceFrom: 425,
    priceNote: "价格随入住日期调整",
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
