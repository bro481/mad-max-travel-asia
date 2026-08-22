import type { ServiceItem } from "../../../../db/service-items";

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=84`;

let items: ServiceItem[] = [
  {
    id: 1,
    slug: "kk-airport-transfer",
    type: "交通接送",
    city: "亚庇",
    category: "交通服务",
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

export function useLocalServiceItems() {
  return process.env.NODE_ENV === "development";
}

export function listLocalServiceItems() {
  return items;
}

export function getLocalServiceItem(id: number) {
  return items.find((item) => item.id === id) || null;
}

export function updateLocalServiceItem(id: number, item: ServiceItem) {
  const next = { ...item, id, updatedAt: new Date().toISOString() };
  items = items.map((current) => (current.id === id ? next : current));
  return next;
}

export function createLocalServiceItem(item: Partial<ServiceItem>) {
  const id = Math.max(0, ...items.map((current) => current.id)) + 1;
  const base = items[0];
  const next = {
    ...base,
    ...item,
    id,
    slug: item.slug || `local-service-${id}`,
    status: "draft",
    updatedAt: new Date().toISOString(),
  } as ServiceItem;
  items = [...items, next];
  return next;
}
