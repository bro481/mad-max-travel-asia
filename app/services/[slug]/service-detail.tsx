"use client";
import { useState } from "react";
import type { ServiceCategory } from "../../../db/services";
type Lang = "zh" | "en";
type Route = {
  title: [string, string];
  duration: [string, string];
  summary: [string, string];
  tags: [[string, string], [string, string]];
  image: string;
  stops: {
    time: string;
    title: [string, string];
    note: [string, string];
    image?: string;
  }[];
};
const photo = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=86`;
const routes: Route[] = [
  {
    title: ["亚庇经典一日游", "Kota Kinabalu Classic Day"],
    duration: ["约8小时", "About 8 hours"],
    summary: [
      "水上清真寺、文化村与市区精华",
      "Mosque, cultural village and city highlights",
    ],
    tags: [
      ["首次到访", "First visit"],
      ["轻松体验", "Easy pace"],
    ],
    image: photo("photo-1596422846543-75c6fc197f07"),
    stops: [
      {
        time: "09:00",
        title: ["酒店接送", "Hotel pickup"],
        note: ["从亚庇市区酒店出发", "Depart from your Kota Kinabalu hotel"],
      },
      {
        time: "10:00",
        title: ["水上清真寺", "Floating Mosque"],
        note: ["欣赏湖畔建筑与城市风光", "Enjoy the lakeside architecture"],
      },
      {
        time: "12:00",
        title: ["当地午餐", "Local lunch"],
        note: ["按口味推荐当地餐厅", "A local restaurant suited to your taste"],
      },
      {
        time: "14:00",
        title: ["文化村体验", "Cultural village"],
        note: ["认识沙巴多元文化", "Discover Sabah's diverse culture"],
      },
      {
        time: "17:00",
        title: ["返回酒店", "Return to hotel"],
        note: ["结束轻松的一日行程", "A relaxed end to the day"],
      },
    ],
  },
  {
    title: ["神山自然体验", "Kinabalu Nature Experience"],
    duration: ["约10小时", "About 10 hours"],
    summary: [
      "神山公园、吊桥与奶牛牧场",
      "Kinabalu Park, canopy walk and dairy farm",
    ],
    tags: [
      ["家庭友好", "Family friendly"],
      ["自然景观", "Nature"],
    ],
    image: photo("photo-1500530855697-b586d89ba3ee"),
    stops: [
      {
        time: "08:00",
        title: ["酒店接送", "Hotel pickup"],
        note: ["司机在酒店大堂接您出发", "Meet your driver in the hotel lobby"],
      },
      {
        time: "09:30",
        title: ["神山公园", "Kinabalu Park"],
        note: [
          "欣赏神山壮丽景色，拍照打卡",
          "Mountain views and a relaxed walk",
        ],
        image: photo("photo-1500530855697-b586d89ba3ee", 500),
      },
      {
        time: "12:00",
        title: ["吊桥体验", "Canopy walk"],
        note: [
          "体验雨林吊桥，感受热带森林",
          "Experience the rainforest canopy",
        ],
        image: photo("photo-1441974231531-c6227db76b6e", 500),
      },
      {
        time: "14:00",
        title: ["奶牛牧场", "Dairy farm"],
        note: ["与奶牛互动，享受自然风光", "Farm visit and pastoral scenery"],
        image: photo("photo-1500595046743-cd271d694d30", 500),
      },
      {
        time: "17:30",
        title: ["返回酒店", "Return to hotel"],
        note: ["轻松愉快地结束行程", "Relax on the journey back"],
      },
    ],
  },
  {
    title: ["市区休闲包车", "Relaxed City Tour"],
    duration: ["约6小时", "About 6 hours"],
    summary: [
      "双子塔、加雅街与当地美食",
      "City sights, Gaya Street and local food",
    ],
    tags: [
      ["适合购物", "Shopping"],
      ["美食探索", "Food discovery"],
    ],
    image: photo("photo-1596422846543-75c6fc197f07"),
    stops: [
      {
        time: "10:00",
        title: ["酒店接送", "Hotel pickup"],
        note: ["按您的时间轻松出发", "Leave at a time that suits you"],
      },
      {
        time: "10:30",
        title: ["城市地标", "City landmarks"],
        note: ["参观亚庇市区热门景点", "Visit Kota Kinabalu highlights"],
      },
      {
        time: "12:30",
        title: ["当地美食", "Local food"],
        note: ["品尝沙巴特色风味", "Taste flavours from Sabah"],
      },
      {
        time: "14:00",
        title: ["购物时间", "Shopping time"],
        note: ["自由选购当地特产", "Browse local products at your pace"],
      },
      {
        time: "16:00",
        title: ["返回酒店", "Return to hotel"],
        note: ["送回酒店或市区指定地点", "Hotel or preferred city drop-off"],
      },
    ],
  },
  {
    title: ["海边日落体验", "Sunset by the Sea"],
    duration: ["约5小时", "About 5 hours"],
    summary: [
      "海滩漫步、日落景观与海鲜晚餐",
      "Beach walk, sunset and seafood dinner",
    ],
    tags: [
      ["情侣推荐", "For couples"],
      ["放松体验", "Relaxed"],
    ],
    image: photo("photo-1500534314209-a25ddb2bd429"),
    stops: [
      {
        time: "15:00",
        title: ["酒店接送", "Hotel pickup"],
        note: ["下午从酒店轻松出发", "An easy afternoon departure"],
      },
      {
        time: "15:30",
        title: ["海边漫步", "Beach walk"],
        note: ["在海边享受悠闲时光", "Relax by the sea"],
      },
      {
        time: "17:30",
        title: ["日落观赏", "Sunset viewing"],
        note: ["等待沙巴迷人的海上日落", "Watch Sabah's beautiful sunset"],
        image: photo("photo-1500534314209-a25ddb2bd429", 500),
      },
      {
        time: "19:00",
        title: ["海鲜晚餐", "Seafood dinner"],
        note: [
          "根据喜好推荐餐厅",
          "A restaurant recommendation for your group",
        ],
      },
      {
        time: "20:00",
        title: ["返回酒店", "Return to hotel"],
        note: ["安全送回住宿地点", "Safe transfer back to your stay"],
      },
    ],
  },
];
const vehicles = [
  {
    name: "Alphard",
    people: "4–6",
    image: photo("photo-1549317661-bd32c8ce0db2", 600),
  },
  {
    name: "MPV · Innova",
    people: "3–5",
    image: photo("photo-1504215680853-026ed2a45def", 600),
  },
  {
    name: "Van",
    people: "7–10",
    image: photo("photo-1469854523086-cc02fe5d8800", 600),
  },
  {
    name: "Sedan",
    people: "1–3",
    image: photo("photo-1503376780353-7e6692767b70", 600),
  },
];
const footage = [
  "photo-1596422846543-75c6fc197f07",
  "photo-1500595046743-cd271d694d30",
  "photo-1507525428034-b723cf961d3e",
  "photo-1500534314209-a25ddb2bd429",
  "photo-1544551763-46a013bb70d5",
  "photo-1549317661-bd32c8ce0db2",
];
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
export function ServiceDetail({
  service,
  city,
}: {
  service: ServiceCategory;
  city: string;
}) {
  const [lang, setLang] = useState<Lang>("zh"),
    [selected, setSelected] = useState<Route | null>(null),
    [photoIndex, setPhotoIndex] = useState(0),
    [menu, setMenu] = useState(false);
  const zh = lang === "zh",
    l = zh ? 0 : 1;
  const cityInfo =
    city === "kl"
      ? {
          name: ["吉隆坡", "Kuala Lumpur"],
          hero: ["吉隆坡私人包车", "Kuala Lumpur Private Car"],
          intro: [
            "自由安排路线，舒适探索吉隆坡市区与周边景点。",
            "Explore Kuala Lumpur and nearby highlights with a flexible private itinerary.",
          ],
        }
      : city === "melaka"
        ? {
            name: ["马六甲", "Melaka"],
            hero: ["马六甲一日包车", "Melaka Private Car"],
            intro: [
              "专车往返，轻松探索古城、美食与河岸风光。",
              "Discover Melaka's heritage, food and riverside at an easy pace.",
            ],
          }
        : {
            name: ["亚庇", "Kota Kinabalu"],
            hero: ["亚庇私人包车", "Kota Kinabalu Private Car"],
            intro: [
              "自由安排路线，舒适探索亚庇热门景点。",
              "Explore Kota Kinabalu comfortably with a flexible private itinerary.",
            ],
          };
  const cityImages = [
    photo("photo-1596422846543-75c6fc197f07"),
    photo("photo-1536599018102-9f803c140fc1"),
    photo("photo-1525625293386-3f8f99389edd"),
    photo("photo-1500534314209-a25ddb2bd429"),
  ];
  const routeVariants: Record<
    string,
    Array<Pick<Route, "title" | "summary" | "stops">>
  > = {
    kl: [
      {
        title: ["吉隆坡经典一日游", "Kuala Lumpur Classic Day"],
        summary: [
          "双子塔、独立广场与茨厂街",
          "Twin Towers, Merdeka Square and Petaling Street",
        ],
        stops: [
          {
            time: "09:00",
            title: ["酒店接送", "Hotel pickup"],
            note: [
              "从吉隆坡市区酒店出发",
              "Depart from your Kuala Lumpur hotel",
            ],
          },
          {
            time: "10:00",
            title: ["吉隆坡双子塔", "Petronas Twin Towers"],
            note: [
              "城市地标拍照与周边漫步",
              "Photos and an easy walk around KLCC",
            ],
          },
          {
            time: "12:00",
            title: ["当地午餐", "Local lunch"],
            note: [
              "按口味推荐马来西亚美食",
              "Malaysian food selected to your taste",
            ],
          },
          {
            time: "14:00",
            title: ["独立广场与茨厂街", "Merdeka Square & Petaling Street"],
            note: [
              "探索历史建筑与城市街区",
              "Explore heritage architecture and local streets",
            ],
          },
          {
            time: "17:00",
            title: ["返回酒店", "Return to hotel"],
            note: ["轻松结束一日行程", "A relaxed end to your city day"],
          },
        ],
      },
      {
        title: ["黑风洞文化路线", "Batu Caves & Culture"],
        summary: [
          "黑风洞、国家皇宫与城市地标",
          "Batu Caves, National Palace and city landmarks",
        ],
        stops: [
          {
            time: "08:30",
            title: ["酒店接送", "Hotel pickup"],
            note: [
              "避开高峰时段轻松出发",
              "An early start to avoid the crowds",
            ],
          },
          {
            time: "09:30",
            title: ["黑风洞", "Batu Caves"],
            note: [
              "参观彩色阶梯与印度教圣地",
              "Visit the colourful steps and temple complex",
            ],
          },
          {
            time: "12:00",
            title: ["当地午餐", "Local lunch"],
            note: [
              "司机按喜好推荐餐厅",
              "A restaurant recommendation from your driver",
            ],
          },
          {
            time: "14:00",
            title: ["国家皇宫与清真寺", "Palace & National Mosque"],
            note: [
              "了解吉隆坡历史与多元文化",
              "Discover Kuala Lumpur's history and cultures",
            ],
          },
          {
            time: "17:00",
            title: ["返回酒店", "Return to hotel"],
            note: ["可按需要调整下车地点", "Flexible city drop-off"],
          },
        ],
      },
      {
        title: ["美食购物休闲路线", "Food & Shopping Day"],
        summary: [
          "武吉免登、Pavilion与当地美食",
          "Bukit Bintang, Pavilion and local food",
        ],
        stops: [
          {
            time: "10:00",
            title: ["酒店接送", "Hotel pickup"],
            note: ["按照您的节奏出发", "Start the day at your preferred time"],
          },
          {
            time: "10:30",
            title: ["武吉免登", "Bukit Bintang"],
            note: [
              "漫步市中心热门商圈",
              "Explore the city's lively shopping district",
            ],
          },
          {
            time: "12:30",
            title: ["当地美食", "Local food"],
            note: [
              "品尝特色餐厅或街头美食",
              "Choose between local restaurants and street food",
            ],
          },
          {
            time: "14:30",
            title: ["Pavilion购物中心", "Pavilion Kuala Lumpur"],
            note: [
              "自由购物与下午茶时间",
              "Shopping and an easy afternoon break",
            ],
          },
          {
            time: "18:00",
            title: ["返回酒店", "Return to hotel"],
            note: ["结束轻松市区行程", "Return after a relaxed city day"],
          },
        ],
      },
      {
        title: ["马六甲跨城一日游", "Melaka Day Trip"],
        summary: [
          "古城文化、鸡场街与河岸风光",
          "Heritage sites, Jonker Street and the riverside",
        ],
        stops: [
          {
            time: "08:00",
            title: ["吉隆坡酒店接送", "Kuala Lumpur pickup"],
            note: ["专车前往马六甲古城", "Private transfer to historic Melaka"],
          },
          {
            time: "10:00",
            title: ["荷兰红屋", "Dutch Square"],
            note: [
              "探索马六甲代表性历史建筑",
              "Discover Melaka's best-known heritage sites",
            ],
          },
          {
            time: "12:00",
            title: ["娘惹午餐", "Peranakan lunch"],
            note: ["品尝当地娘惹风味", "Taste traditional Peranakan flavours"],
          },
          {
            time: "14:00",
            title: ["鸡场街与河岸", "Jonker Street & riverside"],
            note: [
              "自由漫步、购物和拍照",
              "Free time for walking, shopping and photos",
            ],
          },
          {
            time: "18:00",
            title: ["返回吉隆坡", "Return to Kuala Lumpur"],
            note: ["专车送回入住酒店", "Private transfer back to your hotel"],
          },
        ],
      },
    ],
    melaka: [
      {
        title: ["马六甲古城经典游", "Classic Heritage Melaka"],
        summary: [
          "红屋、圣保罗山与鸡场街",
          "Dutch Square, St Paul's Hill and Jonker Street",
        ],
        stops: [
          {
            time: "09:00",
            title: ["酒店接送", "Hotel pickup"],
            note: ["从马六甲酒店轻松出发", "Depart from your Melaka hotel"],
          },
          {
            time: "09:30",
            title: ["荷兰红屋", "Dutch Square"],
            note: [
              "参观古城代表性建筑",
              "See the city's iconic heritage architecture",
            ],
          },
          {
            time: "11:00",
            title: ["圣保罗山", "St Paul's Hill"],
            note: ["俯瞰古城并了解历史", "City views and local history"],
          },
          {
            time: "13:30",
            title: ["鸡场街", "Jonker Street"],
            note: [
              "自由品尝美食与选购手信",
              "Food, shopping and free exploration",
            ],
          },
          {
            time: "17:00",
            title: ["返回酒店", "Return to hotel"],
            note: ["结束悠闲古城行程", "A relaxed end to the heritage day"],
          },
        ],
      },
      {
        title: ["娘惹文化与美食", "Peranakan Culture & Food"],
        summary: [
          "娘惹博物馆、老街与特色餐饮",
          "Peranakan museum, old streets and local dining",
        ],
        stops: [
          {
            time: "10:00",
            title: ["酒店接送", "Hotel pickup"],
            note: ["按您的时间出发", "Start at a time that suits you"],
          },
          {
            time: "10:30",
            title: ["娘惹文化馆", "Peranakan museum"],
            note: [
              "了解峇峇娘惹生活与文化",
              "Discover Peranakan heritage and traditions",
            ],
          },
          {
            time: "12:30",
            title: ["娘惹午餐", "Peranakan lunch"],
            note: ["品尝地道娘惹菜", "Enjoy authentic Peranakan cuisine"],
          },
          {
            time: "14:30",
            title: ["老街漫游", "Old town walk"],
            note: [
              "咖啡馆、手作小店与拍照",
              "Cafes, local shops and photo stops",
            ],
          },
          {
            time: "17:00",
            title: ["返回酒店", "Return to hotel"],
            note: ["可按需要调整行程", "Flexible return and drop-off"],
          },
        ],
      },
      {
        title: ["河岸休闲半日游", "Relaxed Riverside Half Day"],
        summary: [
          "河岸漫步、咖啡馆与古城夜景",
          "Riverside walks, cafes and heritage views",
        ],
        stops: [
          {
            time: "14:00",
            title: ["酒店接送", "Hotel pickup"],
            note: ["下午轻松出发", "An easy afternoon departure"],
          },
          {
            time: "14:30",
            title: ["马六甲河岸", "Melaka riverside"],
            note: [
              "沿河散步并欣赏壁画",
              "Walk by the river and discover local murals",
            ],
          },
          {
            time: "16:00",
            title: ["老城咖啡时间", "Old town cafe"],
            note: ["自由选择特色咖啡馆", "Choose a characterful local cafe"],
          },
          {
            time: "18:00",
            title: ["古城晚餐", "Old town dinner"],
            note: ["按口味推荐当地餐厅", "A local dinner recommendation"],
          },
          {
            time: "20:00",
            title: ["返回酒店", "Return to hotel"],
            note: [
              "欣赏夜景后返回住宿",
              "Return after enjoying the evening views",
            ],
          },
        ],
      },
      {
        title: ["马六甲日落夜游", "Melaka Sunset & Evening"],
        summary: [
          "海峡清真寺、日落与鸡场街夜市",
          "Straits Mosque, sunset and Jonker night market",
        ],
        stops: [
          {
            time: "15:30",
            title: ["酒店接送", "Hotel pickup"],
            note: ["下午从酒店出发", "Afternoon hotel departure"],
          },
          {
            time: "16:00",
            title: ["海峡清真寺", "Melaka Straits Mosque"],
            note: [
              "欣赏海边建筑与海峡景色",
              "Coastal architecture and sea views",
            ],
          },
          {
            time: "18:00",
            title: ["海边日落", "Sunset by the sea"],
            note: [
              "等待马六甲海峡日落",
              "Watch sunset over the Strait of Melaka",
            ],
          },
          {
            time: "19:30",
            title: ["鸡场街夜游", "Jonker Street evening"],
            note: [
              "夜市、美食与自由逛街",
              "Night market, food and free exploration",
            ],
          },
          {
            time: "21:30",
            title: ["返回酒店", "Return to hotel"],
            note: ["专车安全送回住宿", "Private transfer back to your stay"],
          },
        ],
      },
    ],
  };
  const displayRoutes = routeVariants[city]
    ? routes.map((route, index) => ({
        ...route,
        ...routeVariants[city][index],
        image: cityImages[index],
      }))
    : routes;
  const displayGalleryPools = displayRoutes.map((route, index) => [
    route.image,
    cityImages[(index + 1) % 4],
    cityImages[(index + 2) % 4],
    cityImages[(index + 3) % 4],
  ]);
  const selectedRouteIndex = selected
    ? Math.max(
        0,
        displayRoutes.findIndex(
          (route) => route.title[0] === selected.title[0],
        ),
      )
    : 0;
  const modalImages = selected ? displayGalleryPools[selectedRouteIndex] : [];
  return (
    <>
      <header>
        <Logo />
        <button className="menu-btn" onClick={() => setMenu(!menu)}>
          {menu ? "×" : "☰"}
        </button>
        <nav className={menu ? "open" : ""}>
          <a href="/#stays">{zh ? "房源" : "Stays"}</a>
          <a className="active-nav" href="/services">
            {zh ? "当地服务" : "Local Services"}
          </a>
          <a href="/#contact">{zh ? "联系我们" : "Contact"}</a>
        </nav>
        <div className="header-right">
          <div className="language-switch desktop-language">
            <button
              className={zh ? "active" : ""}
              onClick={() => setLang("zh")}
            >
              中文
            </button>
            <i />
            <button
              className={!zh ? "active" : ""}
              onClick={() => setLang("en")}
            >
              English
            </button>
          </div>
          <a className="button header-cta" href="/#contact">
            {zh ? "提交咨询" : "Submit inquiry"}
          </a>
        </div>
      </header>
      <main className="car-detail">
        <section className="car-hero">
          <img
            src={service.image || photo("photo-1549317661-bd32c8ce0db2")}
            alt={zh ? service.nameZh : service.nameEn}
          />
          <div className="car-hero-copy">
            <a href="/services">← {zh ? "返回当地服务" : "Back to services"}</a>
            <p className="eyebrow">MAD MAX · PRIVATE DRIVER</p>
            <h1>{cityInfo.hero[l]}</h1>
            <p>{cityInfo.intro[l]}</p>
            <div>
              <span>{zh ? "中文沟通" : "Chinese support"}</span>
              <span>{zh ? "路线灵活" : "Flexible route"}</span>
              <span>{zh ? "舒适安全" : "Safe & comfortable"}</span>
            </div>
          </div>
        </section>
        <section className="route-section">
          <div className="detail-heading">
            <p className="eyebrow">{zh ? "轻松选择" : "EASY TO CHOOSE"}</p>
            <h2>{zh ? "热门包车方案" : "Popular Private Car Routes"}</h2>
            <p>
              {zh
                ? "以下路线仅作参考，可根据您的时间与兴趣灵活调整。"
                : "These routes are examples and can be adjusted around your time and interests."}
            </p>
          </div>
          <div className="route-grid">
            {displayRoutes.map((route) => (
              <button
                className="route-card"
                onClick={() => {
                  setPhotoIndex(0);
                  setSelected(route);
                }}
                key={route.title[0]}
              >
                <img src={route.image} alt={route.title[l]} />
                <div>
                  <h3>{route.title[l]}</h3>
                  <p>
                    <span>{route.duration[l]}</span>
                    <span>{route.tags[0][l]}</span>
                  </p>
                  <small>{route.summary[l]}</small>
                  <b>{zh ? "查看路线" : "View route"} →</b>
                </div>
              </button>
            ))}
          </div>
        </section>
        <section className="vehicle-section">
          <div className="detail-heading left">
            <p className="eyebrow">{zh ? "舒适出行" : "TRAVEL IN COMFORT"}</p>
            <h2>{zh ? "车型选择" : "Vehicle Options"}</h2>
          </div>
          <div className="vehicle-grid">
            {vehicles.map((v) => (
              <article key={v.name}>
                <img src={v.image} alt={v.name} />
                <div>
                  <h3>{v.name}</h3>
                  <p>
                    {v.people} {zh ? "位乘客" : "passengers"}
                  </p>
                  <small>
                    {zh
                      ? "具体车型以当天安排为准"
                      : "Vehicle subject to availability"}
                  </small>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="footage-section">
          <div className="detail-heading">
            <p className="eyebrow">FOOTAGE</p>
            <h2>
              {cityInfo.name[l]} {zh ? "旅行实拍" : "Travel Moments"}
            </h2>
          </div>
          <div>
            {footage.map((id, i) => (
              <img
                key={id}
                src={photo(id, 700)}
                alt={`${cityInfo.name[l]} ${zh ? "旅行实拍" : "travel"} ${i + 1}`}
              />
            ))}
          </div>
        </section>
        <section className="detail-final-cta">
          <div>
            <p className="eyebrow">MAD MAX · LOCAL HOST</p>
            <h2>
              {zh
                ? "想安排适合自己的路线？"
                : "Would you like a route made for you?"}
            </h2>
            <p>
              {zh
                ? "告诉我们日期、人数和感兴趣的地方，我们会尽快回复。"
                : "Share your dates, group size and interests, and we will reply soon."}
            </p>
          </div>
          <a className="button" href="/#contact">
            {zh ? "提交咨询" : "Submit inquiry"} →
          </a>
        </section>
      </main>
      {selected && (
        <div
          className="route-modal"
          role="dialog"
          aria-modal="true"
          aria-label={selected.title[l]}
          onClick={() => setSelected(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>
              ×
            </button>
            <div className="modal-gallery">
              <div className="modal-gallery-main">
                <img
                  src={modalImages[photoIndex]}
                  alt={`${selected.title[l]} ${photoIndex + 1}`}
                />
                <button
                  onClick={() =>
                    setPhotoIndex(
                      (photoIndex - 1 + modalImages.length) %
                        modalImages.length,
                    )
                  }
                  aria-label={zh ? "上一张图片" : "Previous photo"}
                >
                  ‹
                </button>
                <button
                  onClick={() =>
                    setPhotoIndex((photoIndex + 1) % modalImages.length)
                  }
                  aria-label={zh ? "下一张图片" : "Next photo"}
                >
                  ›
                </button>
                <span>
                  {photoIndex + 1}/{modalImages.length}
                </span>
              </div>
              <div className="modal-gallery-thumbs">
                {modalImages.map((image, i) => (
                  <button
                    className={i === photoIndex ? "active" : ""}
                    onClick={() => setPhotoIndex(i)}
                    key={image}
                  >
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-route">
              <p className="eyebrow">MAD MAX · PRIVATE ROUTE</p>
              <h2>{selected.title[l]}</h2>
              <div className="modal-tags">
                <span>{selected.duration[l]}</span>
                {selected.tags.map((x) => (
                  <span key={x[0]}>{x[l]}</span>
                ))}
              </div>
              <div className="timeline">
                {selected.stops.map((stop) => (
                  <div key={stop.time}>
                    <time>{stop.time}</time>
                    <i />
                    <p>
                      <b>{stop.title[l]}</b>
                      <small>{stop.note[l]}</small>
                    </p>
                    {stop.image && <img src={stop.image} alt="" />}
                  </div>
                ))}
              </div>
              <a className="button" href="/#contact">
                {zh ? "咨询这条路线" : "Ask about this route"}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
