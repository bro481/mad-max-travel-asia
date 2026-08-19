"use client";

import { useMemo, useState } from "react";
import { ServiceMenu } from "../service-menu";

type Lang = "zh" | "en";

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const cities = [
  {
    key: "kl",
    zh: "吉隆坡",
    en: "Kuala Lumpur",
    introZh: "城市天际线、街头生活与夜景都很适合自然记录。",
    introEn: "City skylines, streets and evening lights for effortless portraits.",
    spots: ["双子塔", "TRX", "茨厂街", "城市街头", "夜景"],
    images: [
      img("photo-1596422846543-75c6fc197f07"),
      img("photo-1506744038136-46273834b3fb"),
      img("photo-1518998053901-5348d3961a04"),
    ],
  },
  {
    key: "kk",
    zh: "亚庇",
    en: "Kota Kinabalu",
    introZh: "海边、日落和城市慢生活，适合情侣与家庭旅行。",
    introEn: "Beach sunsets and easy city moments for couples and families.",
    spots: ["丹绒亚路", "海边日落", "城市街头", "码头"],
    images: [
      img("photo-1507525428034-b723cf961d3e"),
      img("photo-1500530855697-b586d89ba3ee"),
      img("photo-1519046904884-53103b34b206"),
    ],
  },
  {
    key: "semporna",
    zh: "仙本那",
    en: "Semporna",
    introZh: "海岛、沙滩、码头与玻璃海，画面干净又有旅行感。",
    introEn: "Islands, beaches and clear-water scenes with a relaxed travel feel.",
    spots: ["海岛", "沙滩", "码头", "海景"],
    images: [
      img("photo-1544550285-f813152fb2fd"),
      img("photo-1510414842594-a61c69b5ae57"),
      img("photo-1500375592092-40eb2168fd21"),
    ],
  },
  {
    key: "melaka",
    zh: "马六甲",
    en: "Melaka",
    introZh: "老城街巷、红屋与河畔，非常适合轻松的人文照片。",
    introEn: "Old streets, heritage corners and riverside scenes for warm portraits.",
    spots: ["荷兰红屋", "老街", "河畔", "咖啡馆"],
    images: [
      img("photo-1518005020951-eccb494ad742"),
      img("photo-1513635269975-59663e0ac1ad"),
      img("photo-1513581166391-887a96ddeafd"),
    ],
  },
];

const copy = {
  zh: {
    rooms: "房源",
    about: "关于我们",
    contact: "联系我们",
    submit: "提交咨询",
    eyebrow: "MAD MAX · TRAVEL PHOTOGRAPHY",
    title: "旅行跟拍",
    subtitle: "记录旅途，也记录你们。",
    desc: "不是影楼式摆拍，而是在旅行途中捕捉自然、舒服、有故事感的瞬间。",
    choose: "选择拍摄城市",
    samples: "拍摄样片",
    ctaTitle: "想安排一次轻松的旅行跟拍？",
    ctaDesc: "告诉我们你的城市、人数和大概时间，我们帮你推荐合适的拍摄路线。",
  },
  en: {
    rooms: "Rooms",
    about: "About",
    contact: "Contact",
    submit: "Submit inquiry",
    eyebrow: "MAD MAX · TRAVEL PHOTOGRAPHY",
    title: "Travel Photography",
    subtitle: "Remember the trip, and everyone in it.",
    desc: "Natural travel photography around Malaysia — relaxed, warm and never too staged.",
    choose: "Choose a city",
    samples: "Photo samples",
    ctaTitle: "Want a relaxed travel photo session?",
    ctaDesc: "Share your city, group size and rough timing. We’ll suggest an easy route.",
  },
};

export default function PhotographyPage() {
  const [lang, setLang] = useState<Lang>("zh");
  const [menu, setMenu] = useState(false);
  const [cityKey, setCityKey] = useState(cities[0].key);
  const t = copy[lang];
  const city = useMemo(
    () => cities.find((item) => item.key === cityKey) || cities[0],
    [cityKey],
  );
  const l = lang === "zh" ? "zh" : "en";

  return (
    <>
      <header>
        <a className="logo" href="/">
          <span className="logo-mark">⌂</span>
          <span>
            <b>MAD MAX</b>
            <small>MALAYSIA STAY</small>
          </span>
        </a>
        <button className="menu-btn" onClick={() => setMenu(!menu)}>
          {menu ? "×" : "☰"}
        </button>
        <nav className={menu ? "open" : ""}>
          <a href="/#stays">{t.rooms}</a>
          <ServiceMenu lang={lang} active />
          <a href="/#about">{t.about}</a>
          <a href="/#contact">{t.contact}</a>
          <div className="language-switch mobile-language">
            <button className={lang === "zh" ? "active" : ""} onClick={() => setLang("zh")}>中文</button>
            <i />
            <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>English</button>
          </div>
        </nav>
        <div className="header-right">
          <div className="language-switch desktop-language">
            <button className={lang === "zh" ? "active" : ""} onClick={() => setLang("zh")}>中文</button>
            <i />
            <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>English</button>
          </div>
          <a className="button header-cta" href="/#contact">{t.submit}</a>
        </div>
      </header>
      <main className="sub-service-page">
        <section className="sub-service-hero photography-hero">
          <img src={img("photo-1529156069898-49953e39b3ac")} alt="" />
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h1>{t.title}</h1>
            <h2>{t.subtitle}</h2>
            <p>{t.desc}</p>
          </div>
        </section>
        <section className="sub-service-section">
          <div className="section-heading compact-heading">
            <p className="eyebrow">{t.choose}</p>
            <h2>{city[l]}</h2>
            <p>{lang === "zh" ? city.introZh : city.introEn}</p>
          </div>
          <div className="sub-city-tabs">
            {cities.map((item) => (
              <button
                className={item.key === cityKey ? "active" : ""}
                key={item.key}
                onClick={() => setCityKey(item.key)}
              >
                {item[l]}
              </button>
            ))}
          </div>
          <div className="photo-location-tags">
            {city.spots.map((spot) => (
              <span key={spot}>{spot}</span>
            ))}
          </div>
          <div className="photo-grid">
            {city.images.map((src, index) => (
              <article key={src}>
                <img src={src} alt={`${city[l]} ${index + 1}`} />
                <span>{city[l]}</span>
              </article>
            ))}
          </div>
        </section>
        <section className="sub-service-cta">
          <h2>{t.ctaTitle}</h2>
          <p>{t.ctaDesc}</p>
          <a className="button" href="/#contact">{t.submit}</a>
        </section>
      </main>
      <footer>
        <a className="logo" href="/">
          <span className="logo-mark">⌂</span>
          <span>
            <b>MAD MAX</b>
            <small>MALAYSIA STAY</small>
          </span>
        </a>
        <div>
          <a href="/#stays">{t.rooms}</a>
          <a href="/services">{lang === "zh" ? "当地服务" : "Local Services"}</a>
          <a href="/#contact">{t.contact}</a>
        </div>
        <small>© 2026 MAD MAX Malaysia Stay</small>
      </footer>
    </>
  );
}
