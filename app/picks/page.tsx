"use client";

import { useMemo, useState } from "react";
import { ServiceMenu } from "../service-menu";

type Lang = "zh" | "en";

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const categories = [
  { key: "all", zh: "热门推荐", en: "Popular" },
  { key: "drink", zh: "咖啡茶饮", en: "Coffee & Tea" },
  { key: "snack", zh: "零食", en: "Snacks" },
  { key: "gift", zh: "伴手礼", en: "Souvenirs" },
];

const products = [
  {
    category: "drink",
    nameZh: "马来西亚白咖啡",
    nameEn: "Malaysia White Coffee",
    descZh: "香气浓郁，适合作为轻便伴手礼。",
    descEn: "Rich and easy to pack as a classic local gift.",
    price: 68,
    image: img("photo-1495474472287-4d71bcdd2085"),
  },
  {
    category: "drink",
    nameZh: "沙巴茶",
    nameEn: "Sabah Tea",
    descZh: "清爽茶香，适合家庭和长辈。",
    descEn: "Clean, fragrant tea from Sabah.",
    price: 58,
    image: img("photo-1564890369478-c89ca6d9cde9"),
  },
  {
    category: "snack",
    nameZh: "榴莲零食",
    nameEn: "Durian Snacks",
    descZh: "马来西亚特色风味，小包装更方便分享。",
    descEn: "A bold Malaysian flavour in easy-share packs.",
    price: 45,
    image: img("photo-1606787366850-de6330128bfc"),
  },
  {
    category: "gift",
    nameZh: "肉骨茶料包",
    nameEn: "Bak Kut Teh Spice Pack",
    descZh: "回家也能煮出南洋味道。",
    descEn: "Bring a warm local flavour back home.",
    price: 39,
    image: img("photo-1547592180-85f173990554"),
  },
  {
    category: "snack",
    nameZh: "咖椰酱",
    nameEn: "Kaya Spread",
    descZh: "早餐、吐司和甜点都很适合。",
    descEn: "A sweet coconut spread for toast and desserts.",
    price: 42,
    image: img("photo-1488477181946-6428a0291777"),
  },
  {
    category: "gift",
    nameZh: "伴手礼组合",
    nameEn: "Souvenir Gift Set",
    descZh: "适合送朋友、同事或家庭成员。",
    descEn: "A simple curated set for friends and family.",
    price: 128,
    image: img("photo-1549465220-1a8b9238cd48"),
  },
];

const copy = {
  zh: {
    rooms: "房源",
    about: "关于我们",
    contact: "联系我们",
    submit: "提交咨询",
    eyebrow: "MAD MAX · MALAYSIA PICKS",
    title: "马来西亚好物",
    subtitle: "精选当地好物与伴手礼",
    desc: "不做复杂商城，只帮你挑选适合自用、送礼、带回国的马来西亚当地好物。",
    categories: "商品分类",
    button: "咨询购买",
    ctaTitle: "想带点马来西亚好物回去？",
    ctaDesc: "告诉我们你想买什么、预算和数量，我们帮你确认领取或配送方式。",
  },
  en: {
    rooms: "Rooms",
    about: "About",
    contact: "Contact",
    submit: "Submit inquiry",
    eyebrow: "MAD MAX · MALAYSIA PICKS",
    title: "Malaysia Picks",
    subtitle: "Curated local goods and souvenirs",
    desc: "A simple selection of Malaysian favourites for gifts, home and easy travel packing.",
    categories: "Categories",
    button: "Ask to buy",
    ctaTitle: "Want to bring Malaysia picks home?",
    ctaDesc: "Tell us what you need, your budget and quantity. We’ll help confirm pickup or delivery.",
  },
};

export default function PicksPage() {
  const [lang, setLang] = useState<Lang>("zh");
  const [menu, setMenu] = useState(false);
  const [category, setCategory] = useState("all");
  const t = copy[lang];
  const l = lang === "zh" ? "zh" : "en";
  const items = useMemo(
    () =>
      category === "all"
        ? products
        : products.filter((item) => item.category === category),
    [category],
  );

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
        <section className="sub-service-hero picks-hero">
          <img src={img("photo-1513885535751-8b9238bd345a")} alt="" />
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h1>{t.title}</h1>
            <h2>{t.subtitle}</h2>
            <p>{t.desc}</p>
          </div>
        </section>
        <section className="sub-service-section">
          <div className="section-heading compact-heading">
            <p className="eyebrow">{t.categories}</p>
            <h2>{t.title}</h2>
          </div>
          <div className="pick-tabs">
            {categories.map((item) => (
              <button
                className={item.key === category ? "active" : ""}
                key={item.key}
                onClick={() => setCategory(item.key)}
              >
                {item[l]}
              </button>
            ))}
          </div>
          <div className="pick-grid">
            {items.map((item) => (
              <article key={item.nameEn}>
                <img src={item.image} alt={lang === "zh" ? item.nameZh : item.nameEn} />
                <div>
                  <h3>{lang === "zh" ? item.nameZh : item.nameEn}</h3>
                  <p>{lang === "zh" ? item.descZh : item.descEn}</p>
                  <b>¥{item.price}</b>
                  <a href="/#contact">{t.button} →</a>
                </div>
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
