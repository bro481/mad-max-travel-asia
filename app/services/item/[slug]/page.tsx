import { ServiceProductDetail } from "./service-product-detail";
import type { ServiceItem } from "../../../../db/service-items";

const image = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=86`;

const baseItem = (
  slug: string,
  type: string,
  city: string,
  category: string,
  nameZh: string,
  nameEn: string,
  subtitleZh: string,
  subtitleEn: string,
  img: string,
): ServiceItem => ({
  id: 0,
  slug,
  type,
  city,
  category,
  nameZh,
  nameEn,
  subtitleZh,
  subtitleEn,
  introZh:
    "告诉我们你的日期、人数和大概想法，我们会根据实际情况帮你确认合适安排。",
  introEn:
    "Share your date, group size and rough plan. We will recommend a suitable arrangement.",
  images: [img],
  tags: ["提前预约", "中文沟通"],
  steps: [
    { title: "告诉我们行程", description: "提供日期、地点和人数" },
    { title: "确认安排", description: "确认车辆、路线或体验细节" },
    { title: "轻松出发", description: "按约定时间开始服务" },
  ],
  routes: [],
  timeline: type.includes("体验")
    ? [
        { time: "08:00", title: "酒店接送", description: "从住宿出发" },
        { time: "09:30", title: "开始体验", description: "按当天路线游览" },
        { time: "17:30", title: "返回酒店", description: "结束轻松的一天" },
      ]
    : [],
  inquiryFields: ["日期", "人数", "出发地点", "特殊需求"],
  priceMode: "咨询报价",
  price: 0,
  priceUnit: "每次",
  priceNote: "",
  status: "published",
  updatedAt: "",
});

const staticItems: ServiceItem[] = [
  baseItem(
    "kl-airport-transfer",
    "交通接送",
    "吉隆坡",
    "交通服务",
    "吉隆坡机场接送",
    "Kuala Lumpur Airport Transfer",
    "KLIA ↔ 酒店 / 市区",
    "KLIA ↔ Hotel / City",
    image("photo-1549317661-bd32c8ce0db2"),
  ),
  baseItem(
    "kl-private-car",
    "私人包车",
    "吉隆坡",
    "包车服务",
    "吉隆坡私人包车",
    "Kuala Lumpur Private Car",
    "灵活路线 · 中文沟通",
    "Flexible routes",
    image("photo-1550355291-bbee04a92027"),
  ),
  baseItem(
    "kk-airport-transfer",
    "交通接送",
    "亚庇",
    "交通服务",
    "亚庇机场接送",
    "Kota Kinabalu Airport Transfer",
    "机场 ↔ 酒店 / 市区",
    "Airport ↔ Hotel / City",
    image("photo-1549317661-bd32c8ce0db2"),
  ),
  baseItem(
    "kk-nature",
    "城市体验",
    "亚庇",
    "自然体验",
    "神山自然体验",
    "Mount Kinabalu Nature Experience",
    "约10小时 · 家庭友好",
    "Around 10 hours",
    image("photo-1500530855697-b586d89ba3ee"),
  ),
  baseItem(
    "semporna-island",
    "海岛体验",
    "仙本那",
    "海岛体验",
    "仙本那跳岛体验",
    "Semporna Island Experience",
    "海岛、浮潜与接送咨询",
    "Island hopping and transfers",
    image("photo-1507525428034-b723cf961d3e"),
  ),
];

export function generateStaticParams() {
  return staticItems.map((service) => ({ slug: service.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const x =
    process.env.LOCAL_BROWSER_PREVIEW === "1" || process.env.VERCEL === "1"
      ? staticItems.find((item) => item.slug === slug)
      : await import("../../../../db/service-items").then(
          ({ getServiceItemBySlug }) => getServiceItemBySlug(slug),
        );
  if (!x)
    return (
      <main className="not-found">
        <h1>Service not found</h1>
        <a href="/services">返回当地服务</a>
      </main>
    );
  return <ServiceProductDetail service={x} />;
}
