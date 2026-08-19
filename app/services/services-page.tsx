"use client";
import { useState } from "react";
import type { ServiceCategory } from "../../db/services";
import type { ServiceItem } from "../../db/service-items";
import { ServiceMenu } from "../service-menu";
type Lang = "zh" | "en";
type Offer = {
  title: [string, string];
  desc: [string, string];
  tags: [[string, string], [string, string]];
  image: string;
  detail: string;
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
            detail: "private-car",
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
            title: ["马六甲专车接送", "Melaka Private Transfer"],
            desc: [
              "吉隆坡 ↔ 马六甲点对点接送",
              "Door-to-door transfer from Kuala Lumpur",
            ],
            tags: [
              ["酒店接送", "Hotel pickup"],
              ["舒适专车", "Private vehicle"],
            ],
            image: img("photo-1550355291-bbee04a92027"),
            detail: "private-car",
          },
          {
            title: ["马六甲一日包车", "Melaka Day Car"],
            desc: ["经典景点与餐饮自由组合", "Flexible sightseeing and dining"],
            tags: [
              ["行程灵活", "Flexible"],
              ["中文沟通", "Chinese support"],
            ],
            image: img("photo-1596422846543-75c6fc197f07"),
            detail: "private-car",
          },
        ],
      },
      {
        name: ["文化体验", "Culture"],
        icon: "◇",
        items: [
          {
            title: ["古城文化漫游", "Heritage Walk"],
            desc: [
              "荷兰红屋、鸡场街与河岸风光",
              "Dutch Square, Jonker Street and riverside",
            ],
            tags: [
              ["历史文化", "Heritage"],
              ["轻松步行", "Easy walk"],
            ],
            image: img("photo-1582883049036-dfe40c02521b"),
            detail: "custom-trip",
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
            detail: "private-car",
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
            detail: "private-car",
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
          <a href="/#about">{t.about}</a>
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
                          onClick={() =>
                            hasFullPage
                              ? (window.location.href = `/services/private-car?city=${place.key}`)
                              : setSelectedOffer(item)
                          }
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
      {selectedOffer && (
        <div
          className="service-quick-modal"
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
            <div className="quick-modal-visual">
              <img src={selectedOffer.image} alt={selectedOffer.title[l]} />
              <div>
                <span>{lang === "zh" ? "专属安排" : "PERSONAL SERVICE"}</span>
                <b>
                  {lang === "zh"
                    ? "轻松出发，安心抵达"
                    : "An easy journey, thoughtfully arranged"}
                </b>
              </div>
            </div>
            <section>
              <p className="eyebrow">MAD MAX · LOCAL SERVICE</p>
              <h2>{selectedOffer.title[l]}</h2>
              <p className="quick-modal-desc">{selectedOffer.desc[l]}</p>
              <div className="quick-modal-tags">
                {selectedOffer.tags.map((tag) => (
                  <span key={tag[0]}>✓ {tag[l]}</span>
                ))}
              </div>
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
              <div className="quick-modal-info">
                <h3>
                  {lang === "zh" ? "咨询时告诉我们" : "What to share with us"}
                </h3>
                <ul>
                  {modalQuestions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
              <p className="quick-modal-note">
                {lang === "zh"
                  ? "无需立即预订，我们会先为您确认安排。"
                  : "No booking commitment—we will confirm the arrangement first."}
              </p>
              <a className="button" href="/#contact">
                {lang === "zh" ? "咨询这项服务" : "Ask about this service"}
              </a>
            </section>
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
