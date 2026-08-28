import Link from "next/link";
import { ServiceDetail } from "./service-detail";
import type { ServiceCategory } from "../../../db/services";

export const dynamic = "force-dynamic";

const staticServices: ServiceCategory[] = [
  {
    id: 1,
    slug: "private-car",
    nameZh: "私人包车与接送",
    nameEn: "Private Car & Transfers",
    introZh: "舒适出行，自由安排路线",
    introEn: "Comfortable travel with a flexible route",
    descriptionZh:
      "从机场抵达、城市游览到跨城市接送，我们根据人数和行程安排合适车辆与专业司机。",
    descriptionEn:
      "From airport arrivals and city travel to intercity transfers, we arrange a suitable vehicle and experienced driver.",
    image:
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1400&q=88",
    itemsZh: ["亚庇私人包车", "吉隆坡包车", "机场接送", "跨城市接送"],
    itemsEn: [
      "Kota Kinabalu private car",
      "Kuala Lumpur private car",
      "Airport transfer",
      "Intercity transfer",
    ],
    icon: "•",
    sortOrder: 1,
    visible: true,
    updatedAt: "",
  },
  {
    id: 2,
    slug: "island",
    nameZh: "海岛体验",
    nameEn: "Island Experiences",
    introZh: "探索绝美海岛，畅享海洋乐趣",
    introEn: "Discover beautiful islands and enjoy the sea",
    descriptionZh:
      "从亚庇到仙本那，协助安排适合家庭、朋友或情侣的海岛路线与接送。",
    descriptionEn:
      "From Kota Kinabalu to Semporna, we arrange island routes and transfers for families, friends and couples.",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=88",
    itemsZh: ["亚庇跳岛", "美人鱼岛", "环滩岛", "仙本那出海"],
    itemsEn: [
      "Kota Kinabalu island hopping",
      "Mantanani Island",
      "Mengalum Island",
      "Semporna island trips",
    ],
    icon: "•",
    sortOrder: 2,
    visible: true,
    updatedAt: "",
  },
  {
    id: 3,
    slug: "nature",
    nameZh: "生态体验",
    nameEn: "Nature Experiences",
    introZh: "亲近自然，发现野生世界",
    introEn: "Get closer to nature and wildlife",
    descriptionZh:
      "走进沙巴的红树林、热带雨林与高山环境，以轻松的节奏认识当地自然生态。",
    descriptionEn:
      "Explore Sabah's mangroves, rainforest and mountain landscapes at a relaxed pace.",
    image:
      "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1400&q=88",
    itemsZh: ["红树林探索", "萤火虫之旅", "长鼻猴观察", "神山自然体验"],
    itemsEn: [
      "Mangrove exploration",
      "Firefly tour",
      "Proboscis monkey watching",
      "Mount Kinabalu nature experience",
    ],
    icon: "•",
    sortOrder: 3,
    visible: true,
    updatedAt: "",
  },
  {
    id: 4,
    slug: "custom-trip",
    nameZh: "定制旅行",
    nameEn: "Custom Trips",
    introZh: "专属规划，打造独一无二旅程",
    introEn: "A personal itinerary designed around you",
    descriptionZh:
      "告诉我们同行人数、旅行天数和偏好，我们把住宿、交通与当地体验组合成顺畅的行程。",
    descriptionEn:
      "Tell us your group, travel days and preferences, and we will combine stays, transport and local experiences into one smooth trip.",
    image:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1400&q=88",
    itemsZh: ["多日行程规划", "住宿＋包车组合", "家庭旅行", "蜜月旅行"],
    itemsEn: [
      "Multi-day itinerary",
      "Stay and private car package",
      "Family travel",
      "Honeymoon travel",
    ],
    icon: "•",
    sortOrder: 4,
    visible: true,
    updatedAt: "",
  },
];

export function generateStaticParams() {
  return staticServices.map((service) => ({ slug: service.slug }));
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ city?: string }>;
}) {
  const { slug } = await params;
  const { city } = await searchParams;
  const service =
    process.env.NODE_ENV === "development" ||
    process.env.LOCAL_BROWSER_PREVIEW === "1"
      ? staticServices.find((item) => item.slug === slug)
      : await import("../../../db/services")
          .then(({ getService }) => getService(slug))
          .catch(() => staticServices.find((item) => item.slug === slug));
  if (!service)
    return (
      <main className="not-found">
        <h1>Service not found</h1>
        <Link className="button" href="/services">
          返回当地服务
        </Link>
      </main>
    );
  return <ServiceDetail service={service} city={city || "kk"} />;
}
