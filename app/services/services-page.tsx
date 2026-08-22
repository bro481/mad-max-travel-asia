"use client";
import { useState } from "react";
import type { ServiceCategory } from "../../db/services";
import type { ServiceItem } from "../../db/service-items";
import { GalleryCarousel } from "../components/gallery-carousel";
import { ServiceMenu } from "../service-menu";
import { AirportTransferModal } from "./airport-transfer-modal";
type Lang = "zh" | "en";
type Offer = {
  title: [string, string];
  desc: [string, string];
  tags: [[string, string], [string, string]];
  image: string;
  detail: string;
};
type AirportVehicle = {
  name: [string, string];
  people: [string, string];
  note: [string, string];
  image: string;
};
type IntercityRequest = {
  date: string;
  time: string;
  pickup: string;
  destination: string;
  people: number;
  luggage: number;
};
type ExperienceStop = {
  title: [string, string];
  note: [string, string];
  image: string;
  featured?: boolean;
  compact?: boolean;
};
type ExperienceDetail = {
  title: [string, string];
  desc: [string, string];
  tags: Array<[string, string]>;
  timelineTitle: [string, string];
  visualLabel: [string, string];
  visualTitle: [string, string];
  visualNote: [string, string];
  note: [string, string];
  includes: [string, string][];
  cta: [string, string];
  stops: ExperienceStop[];
};
type Group = { name: [string, string]; icon: string; items: Offer[] };
type Destination = {
  key: string;
  name: [string, string];
  intro: [string, string];
  groups: Group[];
};
const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=84`;
const airportTransferGalleryImages = [
  img("photo-1549317661-bd32c8ce0db2"),
  img("photo-1550355291-bbee04a92027"),
  img("photo-1515569067071-ec3b51335dd0"),
  img("photo-1544620347-c4fd4a3d5957"),
];
const intercityGalleryImages = [
  img("photo-1515569067071-ec3b51335dd0"),
  img("photo-1500530855697-b586d89ba3ee"),
  img("photo-1549317661-bd32c8ce0db2"),
  img("photo-1494526585095-c41746248156"),
];
const WECHAT_ID = "MADMAX_STAY";
const getExperienceDetail = (offer: Offer): ExperienceDetail => {
  if (offer.title[0].includes("美人鱼岛")) {
    return {
      title: offer.title,
      desc: ["浮潜、沙滩、午餐与接送", "Snorkelling, beach, lunch and transfer"],
      tags: [
        ["约8小时", "About 8 hours"],
        ["海岛一日游", "Island day trip"],
        ["含接送", "Transfer included"],
      ],
      timelineTitle: ["建议行程 · 约8小时", "Suggested itinerary · about 8 hours"],
      visualLabel: ["海岛体验", "ISLAND EXPERIENCE"],
      visualTitle: ["从酒店出发，一天看完整个海岛体验", "A full island day from hotel pickup"],
      visualNote: ["酒店接送 · 乘船 · 浮潜 · 午餐", "Pickup · boat ride · snorkelling · lunch"],
      note: [
        "实际出海时间及体验顺序可能根据天气、海况及当天安排调整。",
        "Departure time and activity order may change with weather, sea conditions and local arrangements.",
      ],
      includes: [
        ["往返接送", "Return transfer"],
        ["船程", "Boat ride"],
        ["浮潜装备", "Snorkelling gear"],
        ["午餐", "Lunch"],
      ],
      cta: ["咨询这个体验", "Ask about this experience"],
      stops: [
        {
          title: ["酒店接送", "Hotel pickup"],
          note: ["前往码头", "Head to the jetty"],
          image: img("photo-1549317661-bd32c8ce0db2"),
          compact: true,
        },
        {
          title: ["码头乘船", "Jetty & boat"],
          note: ["抵达码头后乘船前往美人鱼岛", "Board the boat from the jetty to Mantanani"],
          image: img("photo-1500530855697-b586d89ba3ee"),
        },
        {
          title: ["美人鱼岛", "Mantanani Island"],
          note: ["抵达海岛，欣赏清澈海水与沙滩", "Arrive at the island for clear water and beach time"],
          image: img("photo-1544550285-f813152fb2fd"),
          featured: true,
        },
        {
          title: ["浮潜体验", "Snorkelling"],
          note: ["体验清澈海域与珊瑚生态", "Explore clear waters and coral life"],
          image: img("photo-1544551763-46a013bb70d5"),
          featured: true,
        },
        {
          title: ["午餐 / 自由活动", "Lunch & free time"],
          note: ["午餐、沙滩休息、拍照", "Lunch, beach rest and photo time"],
          image: img("photo-1507525428034-b723cf961d3e"),
          featured: true,
        },
        {
          title: ["返程", "Return"],
          note: ["送回酒店", "Transfer back to your hotel"],
          image: img("photo-1510414842594-a61c69b5ae57"),
          compact: true,
        },
      ],
    };
  }

  if (offer.title[0].includes("神山")) {
    return {
      title: offer.title,
      desc: offer.desc,
      tags: [
        ["约10小时", "About 10 hours"],
        ["私人包车", "Private car"],
        ["行程可调整", "Flexible route"],
      ],
      timelineTitle: ["建议行程 · 约10小时", "Suggested itinerary · about 10 hours"],
      visualLabel: ["自然体验", "NATURE EXPERIENCE"],
      visualTitle: ["高山风光，轻松安排一天路线", "Mountain scenery in an easy day route"],
      visualNote: ["酒店接送 · 神山公园 · 吊桥 · 牧场", "Pickup · park · canopy walk · dairy farm"],
      note: [
        "行程顺序及停留时间可根据当天情况与个人喜好灵活调整。",
        "Route order and time at each stop can be adjusted around the day and your preferences.",
      ],
      includes: [
        ["往返接送", "Return transfer"],
        ["司机服务", "Driver service"],
        ["路线建议", "Route planning"],
        ["时间灵活", "Flexible timing"],
      ],
      cta: ["咨询这个体验", "Ask about this experience"],
      stops: [
        {
          title: ["酒店接送", "Hotel pickup"],
          note: ["前往神山", "Head to Kinabalu"],
          image: img("photo-1549317661-bd32c8ce0db2"),
          compact: true,
        },
        {
          title: ["神山公园", "Kinabalu Park"],
          note: ["欣赏神山壮丽景色，拍照打卡", "Enjoy Mount Kinabalu scenery and photo stops"],
          image: img("photo-1500530855697-b586d89ba3ee"),
          featured: true,
        },
        {
          title: ["吊桥体验", "Canopy walk"],
          note: ["体验雨林吊桥，感受热带森林", "Walk the canopy bridge through tropical forest"],
          image: img("photo-1448375240586-882707db888b"),
          featured: true,
        },
        {
          title: ["奶牛牧场", "Dairy farm"],
          note: ["与奶牛互动，享受自然风光", "Meet the cows and enjoy pastoral views"],
          image: img("photo-1500595046743-cd271d694d30"),
          featured: true,
        },
        {
          title: ["返回酒店", "Return to hotel"],
          note: ["送回酒店", "Transfer back to your hotel"],
          image: img("photo-1500530855697-b586d89ba3ee"),
          compact: true,
        },
      ],
    };
  }

  const isIsland = offer.detail === "island";
  return {
    title: offer.title,
    desc: offer.desc,
    tags: isIsland
      ? [
          ["约8小时", "About 8 hours"],
          ["海岛体验", "Island experience"],
          ["可安排接送", "Pickup available"],
        ]
      : [
          ["半日 / 一日", "Half / full day"],
          ["自然体验", "Nature experience"],
          ["可安排接送", "Pickup available"],
        ],
    timelineTitle: isIsland
      ? ["建议行程 · 海岛体验", "Suggested itinerary · island experience"]
      : ["建议行程 · 自然体验", "Suggested itinerary · nature experience"],
    visualLabel: isIsland ? ["海岛体验", "ISLAND EXPERIENCE"] : ["自然体验", "NATURE EXPERIENCE"],
    visualTitle: isIsland ? ["看海、浮潜与轻松出行", "Sea, snorkelling and easy travel"] : ["亲近自然，轻松安排", "Nature made easy"],
    visualNote: isIsland ? ["接送 · 出海 · 体验 · 返程", "Pickup · boat · experience · return"] : ["接送 · 景点 · 体验 · 返程", "Pickup · stops · experience · return"],
    note: [
      "实际体验顺序可能根据天气、交通及当天安排调整。",
      "The final order may change with weather, traffic and local arrangements.",
    ],
    includes: isIsland
      ? [
          ["接送安排", "Transfer arrangement"],
          ["出海行程", "Boat arrangement"],
          ["体验建议", "Experience planning"],
          ["人工确认", "Manual confirmation"],
        ]
      : [
          ["接送安排", "Transfer arrangement"],
          ["路线建议", "Route planning"],
          ["时间灵活", "Flexible timing"],
          ["人工确认", "Manual confirmation"],
        ],
    cta: ["咨询这个体验", "Ask about this experience"],
    stops: isIsland
      ? [
          { title: ["酒店接送", "Hotel pickup"], note: ["前往码头", "Head to the jetty"], image: img("photo-1549317661-bd32c8ce0db2"), compact: true },
          { title: ["出发登船", "Boat departure"], note: ["前往码头，准备出海", "Head to the jetty and get ready for the sea"], image: img("photo-1500530855697-b586d89ba3ee") },
          { title: [offer.title[0], offer.title[1]], note: [offer.desc[0], offer.desc[1]], image: offer.image, featured: true },
          { title: ["自由活动", "Free time"], note: ["拍照、休息或体验当天项目", "Photo time, rest or scheduled activities"], image: img("photo-1507525428034-b723cf961d3e"), featured: true },
          { title: ["返程", "Return"], note: ["送回酒店", "Transfer back to your hotel"], image: img("photo-1510414842594-a61c69b5ae57"), compact: true },
        ]
      : [
          { title: ["酒店接送", "Hotel pickup"], note: ["前往体验点", "Head to the experience"], image: img("photo-1549317661-bd32c8ce0db2"), compact: true },
          { title: [offer.title[0], offer.title[1]], note: [offer.desc[0], offer.desc[1]], image: offer.image, featured: true },
          { title: ["自由体验", "Free time"], note: ["按当天安排体验与停留", "Enjoy the experience at a comfortable pace"], image: img("photo-1500530855697-b586d89ba3ee"), featured: true },
          { title: ["返回酒店", "Return to hotel"], note: ["送回酒店", "Transfer back to your hotel"], image: img("photo-1549317661-bd32c8ce0db2"), compact: true },
        ],
  };
};
const airportVehicles: AirportVehicle[] = [
  {
    name: ["舒适轿车", "Comfort sedan"],
    people: ["建议 1–3 人", "Suggested for 1–3"],
    note: ["少人数出行", "Small groups"],
    image: img("photo-1549317661-bd32c8ce0db2"),
  },
  {
    name: ["多人车型", "People carrier"],
    people: ["建议 4–6 人", "Suggested for 4–6"],
    note: ["家庭出行", "Families"],
    image: img("photo-1550355291-bbee04a92027"),
  },
  {
    name: ["商务 Van", "Business van"],
    people: ["建议 7–10 人", "Suggested for 7–10"],
    note: ["多人 / 多行李", "Groups / luggage"],
    image: img("photo-1515569067071-ec3b51335dd0"),
  },
  {
    name: ["更多车型", "More vehicles"],
    people: ["最高可安排 14 人", "Up to 14 guests"],
    note: ["按人数与行李匹配", "Matched to your needs"],
    image: img("photo-1544620347-c4fd4a3d5957"),
  },
];
const destinations: Destination[] = [
  {
    key: "kl",
    name: ["吉隆坡", "Kuala Lumpur"],
    intro: [
      "城市地标、美食与便捷交通，轻松探索马来西亚首都。",
      "Landmarks, food and easy transport for exploring Malaysia's capital.",
    ],
    groups: [
      {
        name: ["交通服务", "Transport"],
        icon: "▱",
        items: [
          {
            title: ["吉隆坡机场接送", "KL Airport Transfer"],
            desc: ["KLIA ↔ 酒店 / 市区", "KLIA ↔ hotel / city"],
            tags: [
              ["舒适便捷", "Comfortable"],
              ["提前预约", "Pre-booked"],
            ],
            image: img("photo-1549317661-bd32c8ce0db2"),
            detail: "airport-transfer",
          },
          {
            title: ["吉隆坡私人包车", "KL Private Car"],
            desc: [
              "半日 / 全天包车，自由安排路线",
              "Half-day or full-day flexible routes",
            ],
            tags: [
              ["中文沟通", "Chinese support"],
              ["行程灵活", "Flexible"],
            ],
            image: img("photo-1550355291-bbee04a92027"),
            detail: "private-car",
          },
          {
            title: ["跨城接送", "Intercity Transfer"],
            desc: ["吉隆坡 ↔ 马六甲 / 新加坡", "KL ↔ Melaka / Singapore"],
            tags: [
              ["安全舒适", "Safe & easy"],
              ["长途包车", "Long-distance"],
            ],
            image: img("photo-1515569067071-ec3b51335dd0"),
            detail: "private-car",
          },
        ],
      },
    ],
  },
  {
    key: "melaka",
    name: ["马六甲", "Melaka"],
    intro: [
      "历史街区、娘惹文化与悠闲河岸，适合一日或两日慢游。",
      "Heritage streets, Peranakan culture and a relaxed riverside escape.",
    ],
    groups: [
      {
        name: ["交通服务", "Transport"],
        icon: "▱",
        items: [
          {
            title: ["马六甲私人包车", "Melaka Private Car"],
            desc: [
              "半日 / 全日包车，自由安排路线",
              "Half-day or full-day flexible routes",
            ],
            tags: [
              ["中文沟通", "Chinese support"],
              ["行程灵活", "Flexible"],
            ],
            image: img("photo-1596422846543-75c6fc197f07"),
            detail: "private-car",
          },
        ],
      },
    ],
  },
  {
    key: "kk",
    name: ["亚庇", "Kota Kinabalu"],
    intro: [
      "城市、海岛与自然体验结合，探索亚庇的独特魅力。",
      "City, island and nature experiences come together in Kota Kinabalu.",
    ],
    groups: [
      {
        name: ["交通服务", "Transport"],
        icon: "▱",
        items: [
          {
            title: ["亚庇机场接送", "KK Airport Transfer"],
            desc: ["机场 ↔ 酒店 / 市区", "Airport ↔ hotel / city"],
            tags: [
              ["舒适便捷", "Comfortable"],
              ["提前预约", "Pre-booked"],
            ],
            image: img("photo-1549317661-bd32c8ce0db2"),
            detail: "airport-transfer",
          },
          {
            title: ["亚庇私人包车", "KK Private Car"],
            desc: [
              "半日 / 全天包车，自由安排路线",
              "Half-day or full-day flexible routes",
            ],
            tags: [
              ["中文司机", "Chinese driver"],
              ["行程灵活", "Flexible"],
            ],
            image: img("photo-1550355291-bbee04a92027"),
            detail: "private-car",
          },
          {
            title: ["跨城接送", "Intercity Transfer"],
            desc: [
              "亚庇 ↔ 斗湖 / 神山等地区",
              "KK ↔ Tawau / Kundasang and more",
            ],
            tags: [
              ["安全舒适", "Safe & easy"],
              ["长途包车", "Long-distance"],
            ],
            image: img("photo-1515569067071-ec3b51335dd0"),
            detail: "private-car",
          },
        ],
      },
      {
        name: ["海岛体验", "Island Experiences"],
        icon: "≈",
        items: [
          {
            title: ["美人鱼岛一日体验", "Mantanani Island Day Trip"],
            desc: [
              "浮潜、沙滩、午餐与接送",
              "Snorkelling, beach, lunch and transfer",
            ],
            tags: [
              ["人气海岛", "Popular island"],
              ["浮潜体验", "Snorkelling"],
            ],
            image: img("photo-1544550285-f813152fb2fd"),
            detail: "island",
          },
          {
            title: ["环滩岛一日体验", "Mengalum Island Day Trip"],
            desc: [
              "白沙滩、清澈海水与海岛午餐",
              "White sand, clear water and island lunch",
            ],
            tags: [
              ["清澈海水", "Clear water"],
              ["拍照圣地", "Photo spot"],
            ],
            image: img("photo-1507525428034-b723cf961d3e"),
            detail: "island",
          },
          {
            title: ["东姑阿都拉曼海岛", "Tunku Abdul Rahman Islands"],
            desc: [
              "多岛选择，自由组合行程",
              "Choose and combine several islands",
            ],
            tags: [
              ["多岛选择", "Island choice"],
              ["码头便利", "Easy access"],
            ],
            image: img("photo-1510414842594-a61c69b5ae57"),
            detail: "island",
          },
          {
            title: ["双岛浮潜体验", "Two-Island Snorkelling"],
            desc: [
              "浮潜双岛，探索海洋世界",
              "Two islands and an underwater adventure",
            ],
            tags: [
              ["浮潜天堂", "Snorkelling"],
              ["海岛度假", "Island escape"],
            ],
            image: img("photo-1544551763-46a013bb70d5"),
            detail: "island",
          },
        ],
      },
      {
        name: ["生态体验", "Nature Experiences"],
        icon: "♧",
        items: [
          {
            title: ["红树林探索", "Mangrove Discovery"],
            desc: [
              "寻找长鼻猴，欣赏河岸日落",
              "Proboscis monkeys and riverside sunset",
            ],
            tags: [
              ["生态自然", "Nature"],
              ["落日景观", "Sunset"],
            ],
            image: img("photo-1516690561799-46d8f74f9abf"),
            detail: "nature",
          },
          {
            title: ["萤火虫之旅", "Firefly Experience"],
            desc: [
              "夜游河道，邂逅萤火虫奇观",
              "An evening river cruise with fireflies",
            ],
            tags: [
              ["夜间体验", "Evening"],
              ["浪漫推荐", "Romantic"],
            ],
            image: img("photo-1511497584788-876760111969"),
            detail: "nature",
          },
          {
            title: ["神山自然体验", "Kinabalu Nature Experience"],
            desc: [
              "高山风光、牧场与清新空气",
              "Mountain views, farms and fresh air",
            ],
            tags: [
              ["高山景观", "Mountain"],
              ["清凉避暑", "Cool escape"],
            ],
            image: img("photo-1500530855697-b586d89ba3ee"),
            detail: "nature",
          },
          {
            title: ["奶牛牧场半日游", "Dairy Farm Half Day"],
            desc: ["草原风光与轻松亲子体验", "Pastoral scenery and family fun"],
            tags: [
              ["亲子推荐", "Family"],
              ["自然风光", "Scenery"],
            ],
            image: img("photo-1500595046743-cd271d694d30"),
            detail: "nature",
          },
        ],
      },
    ],
  },
  {
    key: "semporna",
    name: ["仙本那", "Semporna"],
    intro: [
      "清澈海水、潜水胜地与多样跳岛路线，尽情亲近海洋。",
      "Clear seas, celebrated dive sites and memorable island routes.",
    ],
    groups: [
      {
        name: ["交通服务", "Transport"],
        icon: "▱",
        items: [
          {
            title: ["斗湖机场接送", "Tawau Airport Transfer"],
            desc: [
              "斗湖机场 ↔ 仙本那酒店 / 码头",
              "Tawau Airport ↔ Semporna hotel / jetty",
            ],
            tags: [
              ["定点接送", "Door-to-door"],
              ["提前预约", "Pre-booked"],
            ],
            image: img("photo-1549317661-bd32c8ce0db2"),
            detail: "airport-transfer",
          },
        ],
      },
      {
        name: ["海岛体验", "Island Experiences"],
        icon: "≈",
        items: [
          {
            title: ["马布岛与卡帕莱", "Mabul & Kapalai"],
            desc: ["经典跳岛与浮潜体验", "A classic island-hopping route"],
            tags: [
              ["浮潜体验", "Snorkelling"],
              ["经典路线", "Classic route"],
            ],
            image: img("photo-1507525428034-b723cf961d3e"),
            detail: "island",
          },
          {
            title: ["敦沙卡兰海洋公园", "Tun Sakaran Marine Park"],
            desc: ["海岛、山景与玻璃海", "Islands, viewpoints and clear seas"],
            tags: [
              ["海岛景观", "Island views"],
              ["摄影推荐", "Photography"],
            ],
            image: img("photo-1544550285-f813152fb2fd"),
            detail: "island",
          },
        ],
      },
    ],
  },
  {
    key: "singapore",
    name: ["新加坡", "Singapore"],
    intro: [
      "连接马来西亚与新加坡的舒适交通，并可协助规划城市短游。",
      "Comfortable Malaysia–Singapore connections and short city planning.",
    ],
    groups: [
      {
        name: ["交通服务", "Transport"],
        icon: "▱",
        items: [
          {
            title: ["新加坡跨境接送", "Singapore Cross-border Transfer"],
            desc: [
              "马来西亚 ↔ 新加坡点对点接送",
              "Malaysia ↔ Singapore door-to-door",
            ],
            tags: [
              ["跨境接送", "Cross-border"],
              ["舒适专车", "Private vehicle"],
            ],
            image: img("photo-1515569067071-ec3b51335dd0"),
            detail: "private-car",
          },
        ],
      },
      {
        name: ["城市体验", "City Experiences"],
        icon: "⌂",
        items: [
          {
            title: ["新加坡城市短游", "Singapore City Stopover"],
            desc: [
              "地标、美食与城市精华路线",
              "Landmarks, food and city highlights",
            ],
            tags: [
              ["城市地标", "Landmarks"],
              ["灵活安排", "Flexible"],
            ],
            image: img("photo-1525625293386-3f8f99389edd"),
            detail: "custom-trip",
          },
        ],
      },
    ],
  },
];
const copy = {
  zh: {
    rooms: "房源",
    services: "当地服务",
    about: "关于我们",
    contact: "联系我们",
    submit: "提交咨询",
    eyebrow: "当地服务",
    hero: "探索马来西亚的精彩体验",
    heroText:
      "从舒适的私人包车接送，到迷人的海岛体验，以及贴近自然的生态探索，我们为你安排轻松自在的马来西亚旅程。",
    choose: "选择目的地",
    all: "全部",
    custom: "定制你的马来西亚旅程",
    customText:
      "不知道怎么玩？告诉我们你的时间、人数和兴趣，我们帮你组合住宿、交通与体验。",
    why: "为什么选择我们",
    cta: "有任何需求？联系我们。",
    ctaText: "告诉我们你的计划，我们帮你安排适合的马来西亚之旅。",
    wechat: "微信联系",
    trust: [
      ["专业司机", "经验丰富，安全可靠"],
      ["中文沟通", "无需担心语言问题"],
      ["安全保障", "正规车辆，安心出行"],
      ["行程灵活", "根据需求调整"],
      ["7×24 支持", "及时响应需求"],
    ],
    cases: [
      ["家庭旅行", ["舒适住宿", "私人包车", "亲子体验"]],
      ["情侣度假", ["海岛体验", "日落安排", "特色住宿"]],
      ["深度探索", ["自然体验", "当地文化", "私人路线"]],
    ],
  },
  en: {
    rooms: "Stays",
    services: "Local Services",
    about: "About",
    contact: "Contact",
    submit: "Submit inquiry",
    eyebrow: "Local services",
    hero: "Explore the Best of Malaysia",
    heroText:
      "From comfortable private transfers to island escapes and nature experiences, we make your Malaysia journey feel easy.",
    choose: "Choose a destination",
    all: "All",
    custom: "Design Your Malaysia Journey",
    customText:
      "Not sure where to begin? Tell us your dates, group and interests, and we will combine stays, transport and experiences.",
    why: "Why Choose Us",
    cta: "Need help? Get in touch.",
    ctaText:
      "Share your plans and we will help arrange a Malaysia journey that suits you.",
    wechat: "WeChat",
    trust: [
      ["Professional drivers", "Experienced, safe and reliable"],
      ["Chinese support", "Easy, clear communication"],
      ["Travel with confidence", "Reliable vehicles and support"],
      ["Flexible itinerary", "Adjusted around your needs"],
      ["7×24 support", "Timely help when needed"],
    ],
    cases: [
      [
        "Family Travel",
        ["Comfortable stays", "Private car", "Family experiences"],
      ],
      [
        "Couples' Escape",
        ["Island experiences", "Sunset plans", "Special stays"],
      ],
      ["In-depth Discovery", ["Nature", "Local culture", "Private routes"]],
    ],
  },
};
function Logo() {
  return (
    <a className="logo" href="/">
      <span className="logo-mark">⌂</span>
      <span>
        <b>MAD MAX</b>
        <small>MALAYSIA STAY</small>
      </span>
    </a>
  );
}
export function ServicesPage({
  services,
  managed,
}: {
  services: ServiceCategory[];
  managed: ServiceItem[];
}) {
  const [lang, setLang] = useState<Lang>("zh"),
    [menu, setMenu] = useState(false),
    [destination, setDestination] = useState("all"),
    [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [experienceIndex, setExperienceIndex] = useState(0);
  const [intercityRequestOpen, setIntercityRequestOpen] = useState(false);
  const [intercityGenerated, setIntercityGenerated] = useState(false);
  const [intercityCopied, setIntercityCopied] = useState(false);
  const [intercityWechatCopied, setIntercityWechatCopied] = useState(false);
  const [intercityRequest, setIntercityRequest] = useState<IntercityRequest>({
    date: "",
    time: "",
    pickup: "",
    destination: "",
    people: 2,
    luggage: 2,
  });
  const t = copy[lang],
    l = lang === "zh" ? 0 : 1,
    shown =
      destination === "all"
        ? destinations
        : destinations.filter((x) => x.key === destination);
  const modalQuestions = selectedOffer
    ? selectedOffer.detail === "private-car"
      ? lang === "zh"
        ? ["计划日期和大概时间", "出发地点与目的地", "同行人数及行李数量"]
        : [
            "Your preferred date and time",
            "Pickup point and destination",
            "Group size and luggage",
          ]
      : selectedOffer.detail === "island" || selectedOffer.detail === "nature"
        ? lang === "zh"
          ? ["计划体验的日期", "成人与儿童人数", "入住酒店或接送地点"]
          : [
              "Preferred experience date",
              "Adults and children",
              "Hotel or pickup point",
            ]
        : lang === "zh"
          ? ["大概出行时间", "同行人数", "感兴趣的地点和体验"]
          : [
              "Approximate travel dates",
              "Group size",
            "Places and experiences you like",
          ]
    : [];
  const isAirportTransfer = selectedOffer?.detail === "airport-transfer";
  const isIntercityTransfer =
    selectedOffer?.detail === "private-car" &&
    /跨城|跨境|接送|⇄|↔/.test(`${selectedOffer.title[0]} ${selectedOffer.desc[0]}`);
  const isExperienceOffer =
    selectedOffer?.detail === "island" || selectedOffer?.detail === "nature";
  const experienceDetail =
    selectedOffer && isExperienceOffer ? getExperienceDetail(selectedOffer) : null;
  const experienceStops = experienceDetail?.stops ?? [];
  const activeExperienceStop =
    experienceStops[experienceIndex] || experienceStops[0];
  const moveExperienceImage = (step: number) => {
    if (!experienceStops.length) return;
    setExperienceIndex(
      (current) => (current + step + experienceStops.length) % experienceStops.length,
    );
  };
  const intercityRoutes = selectedOffer
    ? selectedOffer.desc[0].includes("斗湖") || selectedOffer.desc[0].includes("神山")
      ? ["亚庇 ⇄ 神山", "亚庇 ⇄ 斗湖"]
      : selectedOffer.title[0].includes("马六甲") && !selectedOffer.desc[0].includes("新加坡")
        ? ["吉隆坡 ⇄ 马六甲"]
        : selectedOffer.title[0].includes("新加坡") || selectedOffer.desc[0].includes("新加坡")
          ? ["吉隆坡 ⇄ 新加坡", "马来西亚 ⇄ 新加坡"]
          : ["吉隆坡 ⇄ 马六甲", "吉隆坡 ⇄ 新加坡"]
    : [];
  const intercityRequestText = selectedOffer
    ? [
        `【官网咨询｜${selectedOffer.title[0]}】`,
        `出发日期：${intercityRequest.date || "待补充"}`,
        `大概时间：${intercityRequest.time || "待补充"}`,
        `出发地点：${intercityRequest.pickup || "待补充"}`,
        `目的地：${intercityRequest.destination || "待补充"}`,
        `同行人数：${intercityRequest.people} 人`,
        `行李数量：${intercityRequest.luggage} 件`,
      ].join("\n")
    : "";
  const updateIntercityRequest = <K extends keyof IntercityRequest>(
    key: K,
    value: IntercityRequest[K],
  ) => {
    setIntercityCopied(false);
    setIntercityWechatCopied(false);
    setIntercityRequest((current) => ({ ...current, [key]: value }));
  };
  const copyIntercityText = async (text: string, type: "request" | "wechat") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    if (type === "request") setIntercityCopied(true);
    else setIntercityWechatCopied(true);
  };
  const managedAirport = selectedOffer
    ? managed.find(
        (item) =>
          item.type === "交通接送" && item.nameZh === selectedOffer.title[0],
      )
    : undefined;
  const displayedAirportVehicles: AirportVehicle[] =
    managedAirport?.routes.length
      ? managedAirport.routes.slice(0, 4).map((vehicle) => ({
          name: [vehicle.name, vehicle.name],
          people: [vehicle.duration, vehicle.duration],
          note: [vehicle.description || vehicle.tag, vehicle.description || vehicle.tag],
          image: vehicle.image,
        }))
      : airportVehicles;
  return (
    <>
      <header id="top">
        <Logo />
        <button className="menu-btn" onClick={() => setMenu(!menu)}>
          {menu ? "×" : "☰"}
        </button>
        <nav className={menu ? "open" : ""}>
          <a href="/#stays">{t.rooms}</a>
          <ServiceMenu lang={lang} active />
          <a href="/about">{t.about}</a>
          <a href="/#contact">{t.contact}</a>
          <div className="language-switch mobile-language">
            <button
              className={lang === "zh" ? "active" : ""}
              onClick={() => setLang("zh")}
            >
              中文
            </button>
            <i />
            <button
              className={lang === "en" ? "active" : ""}
              onClick={() => setLang("en")}
            >
              English
            </button>
          </div>
        </nav>
        <div className="header-right">
          <div className="language-switch desktop-language">
            <button
              className={lang === "zh" ? "active" : ""}
              onClick={() => setLang("zh")}
            >
              中文
            </button>
            <i />
            <button
              className={lang === "en" ? "active" : ""}
              onClick={() => setLang("en")}
            >
              English
            </button>
          </div>
          <a className="button header-cta" href="/#contact">
            {t.submit}
          </a>
        </div>
      </header>
      <main className="services-page">
        <section className="services-hero">
          <img
            src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1900&q=90"
            alt="Malaysia coastal journey"
          />
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h1>{t.hero}</h1>
            <p>{t.heroText}</p>
          </div>
        </section>
        <section className="destination-section">
          <h2>{t.choose}</h2>
          <div className="destination-tabs">
            <button
              className={destination === "all" ? "active" : ""}
              onClick={() => setDestination("all")}
            >
              <b>{t.all}</b>
            </button>
            {destinations.map((d) => (
              <button
                className={destination === d.key ? "active" : ""}
                onClick={() => setDestination(d.key)}
                key={d.key}
              >
                <b>{d.name[0]}</b>
                <small>{d.name[1]}</small>
              </button>
            ))}
          </div>
        </section>
        <section className="destination-services">
          {shown.map((place) => (
            <div className="destination-block" key={place.key}>
              <div className="destination-heading">
                <h2>
                  {place.name[0]} <span>{place.name[1]}</span>
                </h2>
                <p>{place.intro[l]}</p>
              </div>
              {place.groups.map((group) => (
                <section className="offer-group" key={group.name[0]}>
                  <h3>
                    <span>{group.icon}</span>
                    {group.name[l]}
                  </h3>
                  <div className="offer-grid">
                    {group.items.map((item) => {
                      const hasFullPage =
                        item.title[0].includes("私人包车") ||
                        item.title[0].includes("一日包车");
                      return (
                        <button
                          className="offer-card"
                          onClick={() => {
                            if (hasFullPage) {
                              window.location.href = `/services/private-car?city=${place.key}`;
                              return;
                            }
                            setExperienceIndex(0);
                            setIntercityRequestOpen(false);
                            setSelectedOffer(item);
                          }}
                          key={item.title[0]}
                        >
                          <img src={item.image} alt={item.title[l]} />
                          <div>
                            <h4>{item.title[l]}</h4>
                            <p>{item.desc[l]}</p>
                            <div>
                              {item.tags.map((tag) => (
                                <span key={tag[0]}>{tag[l]}</span>
                              ))}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ))}
        </section>
        {managed.length > 0 && (
          <section className="managed-services">
            <div className="section-heading">
              <p className="eyebrow">MAD MAX · CURATED</p>
              <h2>
                {lang === "zh"
                  ? "可咨询的当地服务"
                  : "Local services to explore"}
              </h2>
              <p>
                {lang === "zh"
                  ? "从接送、包车到当地体验，告诉我们日期和人数即可确认安排。"
                  : "Transfers, private cars and experiences arranged around your dates."}
              </p>
            </div>
            <div className="managed-service-grid">
              {managed.map((x) => (
                <a href={`/services/item/${x.slug}`} key={x.id}>
                  {x.images[0] ? (
                    <img src={x.images[0]} alt="" />
                  ) : (
                    <div className="managed-placeholder">
                      {x.type === "交通接送"
                        ? "🚗"
                        : x.type === "私人包车"
                          ? "🚙"
                          : x.type === "海岛体验"
                            ? "🏝"
                            : "🌆"}
                    </div>
                  )}
                  <small>
                    {x.city} · {x.category}
                  </small>
                  <h3>{lang === "zh" ? x.nameZh : x.nameEn || x.nameZh}</h3>
                  <p>
                    {lang === "zh"
                      ? x.subtitleZh
                      : x.subtitleEn || x.subtitleZh}
                  </p>
                  <span>{lang === "zh" ? "查看详情 →" : "View details →"}</span>
                </a>
              ))}
            </div>
          </section>
        )}
        <section className="custom-travel">
          <div className="custom-intro">
            <p className="eyebrow">MAD MAX · PRIVATE TRAVEL</p>
            <h2>{t.custom}</h2>
            <p>{t.customText}</p>
            <div className="custom-points">
              <span>⌂ {lang === "zh" ? "住宿规划" : "Stay planning"}</span>
              <span>▱ {lang === "zh" ? "省心包车" : "Private transport"}</span>
              <span>⌖ {lang === "zh" ? "灵活自由" : "Flexible itinerary"}</span>
            </div>
            <a className="button" href="/#contact">
              {t.submit} →
            </a>
          </div>
          <div className="custom-cases">
            {t.cases.map((item, i) => (
              <article key={String(item[0])}>
                <img
                  src={
                    [
                      img("photo-1504150558240-0b4fd8946624"),
                      img("photo-1500534314209-a25ddb2bd429"),
                      img("photo-1528127269322-539801943592"),
                    ][i]
                  }
                  alt=""
                />
                <div>
                  <h3>{item[0]}</h3>
                  <ul>
                    {(Array.isArray(item[1]) ? item[1] : []).map((x) => (
                      <li key={x}>✓ {x}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="trust-section compact">
          <h2>{t.why}</h2>
          <div>
            {t.trust.map((item, i) => (
              <article key={item[0]}>
                <span>{["♙", "◌", "♢", "▦", "☏"][i]}</span>
                <b>{item[0]}</b>
                <small>{item[1]}</small>
              </article>
            ))}
          </div>
        </section>
        <section className="service-cta">
          <img
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=82"
            alt="Malaysia coast"
          />
          <div>
            <h2>{t.cta}</h2>
            <p>{t.ctaText}</p>
            <div>
              <a className="button" href="/#contact">
                {t.submit} →
              </a>
              <a href="/#contact">WhatsApp / {t.wechat}</a>
            </div>
          </div>
        </section>
      </main>
      {selectedOffer && isAirportTransfer && <AirportTransferModal onClose={()=>setSelectedOffer(null)} data={{title:managedAirport?.nameZh||selectedOffer.title[l],subtitle:managedAirport?.subtitleZh||selectedOffer.desc[l],tags:managedAirport?.tags||["私人接送","中文沟通","提前预约"],images:managedAirport?.images?.length?managedAirport.images:airportTransferGalleryImages,maxGuests:managedAirport?.maxGuests||14,guestNote:managedAirport?.guestNote||"根据同行人数及行李数量匹配合适车型",vehicles:managedAirport?.vehicles?.filter(x=>x.visible).map(x=>({image:x.image,name:x.nameZh,people:x.people,luggage:x.luggage,note:x.description}))||displayedAirportVehicles.map(x=>({image:x.image,name:x.name[l],people:x.people[l],note:x.note[l]})),questions:managedAirport?.inquiryPromptFields?.length?managedAirport.inquiryPromptFields:["接送日期 & 航班号","接送地址（酒店 / 市区）","同行人数","行李数量"]}}/>}
      {selectedOffer && experienceDetail && (
        <div
          className="route-modal experience-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-label={experienceDetail.title[l]}
          onClick={() => setSelectedOffer(null)}
        >
          <div onClick={(event) => event.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedOffer(null)}
              aria-label={lang === "zh" ? "关闭" : "Close"}
            >
              ×
            </button>
            <div className="modal-gallery experience-gallery">
              <div className="modal-gallery-main">
                <img
                  src={activeExperienceStop?.image || selectedOffer.image}
                  alt={activeExperienceStop?.title[l] || experienceDetail.title[l]}
                />
                <button
                  type="button"
                  onClick={() => moveExperienceImage(-1)}
                  disabled={experienceStops.length <= 1}
                  aria-label={lang === "zh" ? "上一张图片" : "Previous photo"}
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => moveExperienceImage(1)}
                  disabled={experienceStops.length <= 1}
                  aria-label={lang === "zh" ? "下一张图片" : "Next photo"}
                >
                  ›
                </button>
                <span>
                  {experienceIndex + 1}/{experienceStops.length}
                </span>
              </div>
              <div className="modal-gallery-thumbs experience-gallery-thumbs">
                {experienceStops.map((stop, i) => (
                  <button
                    type="button"
                    className={i === experienceIndex ? "active" : ""}
                    onClick={() => setExperienceIndex(i)}
                    key={`${stop.title[0]}-${i}`}
                  >
                    <img src={stop.image} alt="" />
                    <span>{stop.title[l]}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-route experience-modal-route">
              <p className="eyebrow">MAD MAX · LOCAL EXPERIENCE</p>
              <h2>{experienceDetail.title[l]}</h2>
              <p className="quick-modal-desc experience-route-lead">
                {experienceDetail.desc[l]}
              </p>
              <div className="modal-tags">
                {experienceDetail.tags.map((tag) => (
                  <span key={tag[0]}>{tag[l]}</span>
                ))}
              </div>
              <p className="modal-itinerary-title">
                {experienceDetail.timelineTitle[l]}
              </p>
              <div className="timeline experience-timeline">
                {experienceStops.map((stop, i) => (
                  <button
                    type="button"
                    className={[
                      i === experienceIndex ? "active" : "",
                      stop.featured ? "featured" : "",
                      stop.compact ? "compact" : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => setExperienceIndex(i)}
                    key={`${stop.title[0]}-${i}`}
                  >
                    <time>{String(i + 1).padStart(2, "0")}</time>
                    <i />
                    <p>
                      <b>{stop.title[l]}</b>
                      <small>{stop.note[l]}</small>
                    </p>
                  </button>
                ))}
              </div>
              <p className="modal-flex-note">{experienceDetail.note[l]}</p>
              <a className="button" href="/#contact">
                {experienceDetail.cta[l]}
              </a>
            </div>
          </div>
        </div>
      )}
      {selectedOffer && !isAirportTransfer && !experienceDetail && (
        <div
          className={`service-quick-modal${isIntercityTransfer ? " intercity-transfer-modal" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={selectedOffer.title[l]}
          onClick={() => setSelectedOffer(null)}
        >
          <div onClick={(event) => event.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedOffer(null)}
              aria-label={lang === "zh" ? "关闭" : "Close"}
            >
              ×
            </button>
            <div className={`quick-modal-visual${isIntercityTransfer ? " intercity-visual has-gallery" : ""}`}>
              {isIntercityTransfer ? (
                <GalleryCarousel
                  images={intercityGalleryImages}
                  alt={selectedOffer.title[l]}
                  compact
                />
              ) : (
                <img src={selectedOffer.image} alt={selectedOffer.title[l]} />
              )}
              {isIntercityTransfer && (
                <p className="intercity-visual-eyebrow">MAD MAX · LOCAL SERVICE</p>
              )}
              <div>
                <span>{isIntercityTransfer ? "跨城出行" : lang === "zh" ? "专属安排" : "PERSONAL SERVICE"}</span>
                <b>
                  {isIntercityTransfer
                    ? "一路舒适，安心抵达"
                    : lang === "zh"
                      ? "轻松出发，安心抵达"
                      : "An easy journey, thoughtfully arranged"}
                </b>
                {isIntercityTransfer && (
                  <small>
                    {intercityRoutes.join(" · ")}
                  </small>
                )}
              </div>
            </div>
            <section>
              <p className="eyebrow">MAD MAX · LOCAL SERVICE</p>
              <h2>{selectedOffer.title[l]}</h2>
              <p className={isIntercityTransfer ? "quick-modal-desc intercity-route-lead" : "quick-modal-desc"}>
                {isIntercityTransfer ? selectedOffer.desc[0].replace("↔", "⇄") : selectedOffer.desc[l]}
              </p>
              <div className="quick-modal-tags">
                {(isIntercityTransfer
                  ? [["私人包车", "Private car"], ["点对点接送", "Door-to-door"], ["长途出行", "Long-distance"]] as [[string, string], [string, string], [string, string]]
                  : selectedOffer.tags
                ).map((tag) => (
                  <span key={tag[0]}>✓ {tag[l]}</span>
                ))}
              </div>
              {isIntercityTransfer ? (
                <div className="intercity-route-box">
                  <h3>常见接送路线</h3>
                  <div>
                    {intercityRoutes.map((route) => (
                      <span key={route}>{route}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="quick-modal-flow">
                  <div>
                    <b>01</b>
                    <span>
                      {lang === "zh" ? "告诉我们行程" : "Share your plan"}
                    </span>
                  </div>
                  <i />
                  <div>
                    <b>02</b>
                    <span>
                      {lang === "zh" ? "确认合适安排" : "Confirm details"}
                    </span>
                  </div>
                  <i />
                  <div>
                    <b>03</b>
                    <span>{lang === "zh" ? "轻松出发" : "Travel with ease"}</span>
                  </div>
                </div>
              )}
              <div className={`quick-modal-info${isIntercityTransfer ? " intercity-modal-info" : ""}`}>
                <h3>
                  {lang === "zh" ? "咨询时告诉我们" : "What to share with us"}
                </h3>
                <ul>
                  {(isIntercityTransfer
                    ? ["日期 & 时间", "出发地点", "目的地", "人数 & 行李"]
                    : modalQuestions
                  ).map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
              <p className="quick-modal-note">
                {isIntercityTransfer
                  ? "先确认路线与车型，无需立即预订。"
                  : lang === "zh"
                    ? "无需立即预订，我们会先为您确认安排。"
                    : "No booking commitment—we will confirm the arrangement first."}
              </p>
              {isIntercityTransfer ? (
                <button
                  className="button"
                  type="button"
                  onClick={() => {
                    setIntercityRequestOpen(true);
                    setIntercityGenerated(false);
                    setIntercityCopied(false);
                    setIntercityWechatCopied(false);
                  }}
                >
                  告诉我你的行程 →
                </button>
              ) : (
                <a className="button" href="/#contact">
                  {lang === "zh" ? "咨询这项服务" : "Ask about this service"}
                </a>
              )}
            </section>
            {isIntercityTransfer && intercityRequestOpen && (
              <div
                className="airport-request-layer"
                role="dialog"
                aria-modal="true"
                aria-label="填写跨城接送需求"
                onClick={() => setIntercityRequestOpen(false)}
              >
                <div className="airport-request-card" onClick={(event) => event.stopPropagation()}>
                  <button
                    className="airport-request-close"
                    type="button"
                    onClick={() => setIntercityRequestOpen(false)}
                    aria-label="关闭需求卡"
                  >
                    ×
                  </button>
                  {intercityGenerated ? (
                    <div className="airport-request-result">
                      <p className="eyebrow">REQUEST READY</p>
                      <h3>跨城接送需求已整理好</h3>
                      <p>复制后添加微信发送给我们，我们会根据路线、人数和行李确认车型和价格。</p>
                      <pre>{intercityRequestText}</pre>
                      <div className="airport-request-actions">
                        <button type="button" onClick={() => copyIntercityText(intercityRequestText, "request")}>
                          {intercityCopied ? "已复制" : "复制需求"}
                        </button>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            setIntercityCopied(false);
                            setIntercityWechatCopied(false);
                            setIntercityGenerated(false);
                          }}
                        >
                          返回修改
                        </button>
                        <button type="button" className="primary" onClick={() => copyIntercityText(WECHAT_ID, "wechat")}>
                          {intercityWechatCopied ? "微信号已复制" : "添加微信"}
                        </button>
                      </div>
                      <div className="airport-wechat">
                        <div className="airport-wechat-qr">
                          <b>微信</b>
                          <small>二维码</small>
                        </div>
                        <div>
                          <span>微信号</span>
                          <b>{WECHAT_ID}</b>
                          <small>复制需求后扫码或搜索微信号添加</small>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form
                      className="airport-request-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        setIntercityGenerated(true);
                        setIntercityCopied(false);
                      }}
                    >
                      <p className="eyebrow">INTERCITY REQUEST</p>
                      <h3>告诉我你的跨城行程</h3>
                      <p>填好后自动整理需求 → 添加微信发送 → 更快确认路线、车型和价格。</p>
                      <div className="airport-request-grid">
                        <label>
                          <span>出发日期</span>
                          <input type="date" value={intercityRequest.date} onChange={(event) => updateIntercityRequest("date", event.target.value)} />
                        </label>
                        <label>
                          <span>大概时间</span>
                          <input type="time" value={intercityRequest.time} onChange={(event) => updateIntercityRequest("time", event.target.value)} />
                        </label>
                      </div>
                      <label>
                        <span>出发地点</span>
                        <input value={intercityRequest.pickup} placeholder="酒店 / 地址 / 城市" onChange={(event) => updateIntercityRequest("pickup", event.target.value)} />
                      </label>
                      <label>
                        <span>目的地</span>
                        <input value={intercityRequest.destination} placeholder="例如 马六甲 / 新加坡酒店" onChange={(event) => updateIntercityRequest("destination", event.target.value)} />
                      </label>
                      <div className="airport-stepper-grid">
                        <div>
                          <span>人数</span>
                          <div className="airport-stepper">
                            <button type="button" onClick={() => updateIntercityRequest("people", Math.max(1, intercityRequest.people - 1))}>−</button>
                            <b>{intercityRequest.people} 人</b>
                            <button type="button" onClick={() => updateIntercityRequest("people", intercityRequest.people + 1)}>+</button>
                          </div>
                        </div>
                        <div>
                          <span>行李</span>
                          <div className="airport-stepper">
                            <button type="button" onClick={() => updateIntercityRequest("luggage", Math.max(0, intercityRequest.luggage - 1))}>−</button>
                            <b>{intercityRequest.luggage} 件</b>
                            <button type="button" onClick={() => updateIntercityRequest("luggage", intercityRequest.luggage + 1)}>+</button>
                          </div>
                        </div>
                      </div>
                      <button className="button airport-generate-request" type="submit">
                        生成跨城接送需求 →
                      </button>
                      <small className="airport-request-next">
                        下一步：添加微信并发送需求
                      </small>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <footer>
        <Logo />
        <p>MAD MAX Malaysia Stay · Local travel services</p>
        <div>
          <a href="/#stays">{t.rooms}</a>
          <a href="/services">{t.services}</a>
          <a href="/#contact">{t.contact}</a>
        </div>
        <small>
          © 2026 MAD MAX Malaysia Stay · {services.length} service categories
        </small>
      </footer>
    </>
  );
}
