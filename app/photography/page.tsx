"use client";

import { useMemo, useState } from "react";
import { ServiceMenu } from "../service-menu";

type Lang = "zh" | "en";
const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=84`;

const cities = [
  { key: "kl", zh: "吉隆坡", en: "Kuala Lumpur", introZh: "城市天际线、街头生活与夜景都很适合自然记录。", introEn: "City skylines, street life and evening lights for natural portraits.", spots: ["双子塔", "TRX", "茨厂街", "城市街头", "夜景"], images: ["photo-1496440737103-cd596325d314", "photo-1524504388940-b1c1722653e1", "photo-1517841905240-472988babdf9", "photo-1529156069898-49953e39b3ac", "photo-1516589178581-6cd7833ae3b2", "photo-1504593811423-6dd665756598"].map(img) },
  { key: "kk", zh: "亚庇", en: "Kota Kinabalu", introZh: "海边、日落和城市慢生活，适合轻松自然的旅行记录。", introEn: "Beach sunsets and easy city moments for relaxed travel portraits.", spots: ["丹绒亚路", "海边日落", "城市街头", "码头"], images: ["photo-1529156069898-49953e39b3ac", "photo-1524250502761-1ac6f2e30d43", "photo-1524504388940-b1c1722653e1", "photo-1517841905240-472988babdf9", "photo-1496440737103-cd596325d314", "photo-1516589178581-6cd7833ae3b2"].map(img) },
  { key: "semporna", zh: "仙本那", en: "Semporna", introZh: "海岛、沙滩、码头与玻璃海，画面干净又有旅行感。", introEn: "Islands, beaches and clear water with an effortless travel mood.", spots: ["海岛", "沙滩", "码头", "玻璃海"], images: ["photo-1524504388940-b1c1722653e1", "photo-1529156069898-49953e39b3ac", "photo-1517841905240-472988babdf9", "photo-1516589178581-6cd7833ae3b2", "photo-1496440737103-cd596325d314", "photo-1524250502761-1ac6f2e30d43"].map(img) },
  { key: "melaka", zh: "马六甲", en: "Melaka", introZh: "老城街巷、红屋与河畔，非常适合温暖松弛的人文照片。", introEn: "Old streets, heritage corners and riverside scenes for warm portraits.", spots: ["荷兰红屋", "鸡场街", "河畔", "老城咖啡馆"], images: ["photo-1516589178581-6cd7833ae3b2", "photo-1517841905240-472988babdf9", "photo-1524504388940-b1c1722653e1", "photo-1496440737103-cd596325d314", "photo-1529156069898-49953e39b3ac", "photo-1504593811423-6dd665756598"].map(img) },
];

const plans = [
  { zh: "轻跟拍", en: "Quick Session", timeZh: "约 1 小时", timeEn: "About 1 hour", descZh: "适合一个主要拍摄区域", descEn: "One main shooting area", price: "¥680", featured: false },
  { zh: "城市跟拍", en: "City Session", timeZh: "约 2 小时", timeEn: "About 2 hours", descZh: "可安排 2–3 个附近拍摄点", descEn: "Two or three nearby locations", price: "¥1080", featured: true },
  { zh: "半日旅拍", en: "Half-day Story", timeZh: "约 4 小时", timeEn: "About 4 hours", descZh: "适合多场景旅行记录", descEn: "A multi-scene travel story", price: "¥1680", featured: false },
];

const routes = [
  { zh: "吉隆坡经典一日游", en: "Kuala Lumpur day tour", image: img("photo-1596422846543-75c6fc197f07"), href: "/services/private-car?city=kl" },
  { zh: "亚庇日落行程", en: "Kota Kinabalu sunset", image: img("photo-1507525428034-b723cf961d3e"), href: "/services" },
  { zh: "仙本那海岛之旅", en: "Semporna island trip", image: img("photo-1544550285-f813152fb2fd"), href: "/services" },
];

const copy = {
  zh: { rooms: "房源", about: "关于我们", contact: "联系我们", submit: "提交咨询", eyebrow: "MAD MAX · TRAVEL PHOTOGRAPHY", title: "旅行跟拍", subtitle: "记录旅途，也记录你们。", desc: "不刻意摆拍，记录旅行中自然、舒服、有故事感的瞬间。", choose: "选择拍摄城市", spots: "推荐拍摄地", momentsPrefix: "镜头里的", plans: "选择适合你的记录方式", from: "起", popular: "最受欢迎", included: "跟拍包含", includedItems: "拍摄引导 · 精选成片 · 基础调色 · 线上交付", travelTitle: "已有行程？可以一起安排跟拍", travelDesc: "跟拍可以加入当天的包车或游玩路线，边走边拍，不需要另外安排一天。", consultTitle: "想把这趟旅行记录下来？", consultDesc: "告诉我们城市、日期和人数，我们会帮你看看适合哪种跟拍方式。", consult: "咨询跟拍", note: "拍摄地点和时间可根据当天行程灵活安排" },
  en: { rooms: "Rooms", about: "About", contact: "Contact", submit: "Submit inquiry", eyebrow: "MAD MAX · TRAVEL PHOTOGRAPHY", title: "Travel Photography", subtitle: "Remember the trip, and everyone in it.", desc: "No forced posing — just natural, relaxed moments with a story to tell.", choose: "Choose a shooting city", spots: "Recommended locations", momentsPrefix: "Through the lens:", plans: "Choose how you would like to remember it", from: "from", popular: "Most popular", included: "Every session includes", includedItems: "Gentle direction · selected images · basic colour editing · online delivery", travelTitle: "Already have an itinerary? Add photography", travelDesc: "Photography can join your private-car or day-trip route, so there is no need to set aside another day.", consultTitle: "Want to remember this trip?", consultDesc: "Tell us your city, date and group size, and we will suggest a suitable session.", consult: "Ask about photography", note: "Locations and timing can flex with your travel day" },
};

export default function PhotographyPage() {
  const [lang, setLang] = useState<Lang>("zh");
  const [menu, setMenu] = useState(false);
  const [cityKey, setCityKey] = useState(cities[0].key);
  const t = copy[lang];
  const city = useMemo(() => cities.find((item) => item.key === cityKey) || cities[0], [cityKey]);
  const l = lang === "zh" ? "zh" : "en";

  return <>
    <header>
      <a className="logo" href="/"><span className="logo-mark">⌂</span><span><b>MAD MAX</b><small>MALAYSIA STAY</small></span></a>
      <button className="menu-btn" aria-label="Menu" onClick={() => setMenu(!menu)}>{menu ? "关闭" : "☰ 菜单"}</button>
      <nav className={menu ? "open" : ""}><a href="/#stays">{t.rooms}</a><ServiceMenu lang={lang} active /><a href="/about">{t.about}</a><a href="/#contact">{t.contact}</a><div className="language-switch mobile-language"><button className={lang === "zh" ? "active" : ""} onClick={() => setLang("zh")}>中文</button><i /><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>English</button></div></nav>
      <div className="header-right"><div className="language-switch desktop-language"><button className={lang === "zh" ? "active" : ""} onClick={() => setLang("zh")}>中文</button><i /><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>English</button></div><a className="button header-cta" href="/#contact">{t.submit}</a></div>
    </header>
    <main className="sub-service-page photography-page">
      <section className="sub-service-hero photography-hero"><img src={img("photo-1529156069898-49953e39b3ac")} alt="" /><div><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><h2>{t.subtitle}</h2><p>{t.desc}</p></div></section>
      <section className="photo-city-section">
        <p className="photo-section-kicker">⌖ {t.choose}</p>
        <div className="sub-city-tabs photo-city-tabs">{cities.map((item) => <button className={item.key === cityKey ? "active" : ""} key={item.key} onClick={() => setCityKey(item.key)}>{item[l]}</button>)}</div>
        <div className="photo-city-intro"><h2>{city[l]} <em>{city.en}</em></h2><p>{lang === "zh" ? city.introZh : city.introEn}</p></div>
        <div className="photo-spots"><b>{t.spots}</b><p>{city.spots.join(" · ")}</p></div>
      </section>
      <section className="photo-portfolio-section">
        <div className="photo-section-heading"><span /><h2>{t.momentsPrefix}{lang === "zh" ? city.zh : ` ${city.en}`}</h2><span /></div>
        <div className="photo-mosaic" key={city.key}>{city.images.map((src, index) => <figure key={src}><img src={src} alt={`${city[l]} ${t.momentsPrefix} ${index + 1}`} /></figure>)}</div>
      </section>
      <section className="photo-plans-section">
        <div className="photo-section-heading"><span /><h2>{t.plans}</h2><span /></div>
        <div className="photo-plan-grid">{plans.map((plan) => <article className={plan.featured ? "featured" : ""} key={plan.zh}><i>◉</i><div><div className="photo-plan-title"><h3>{plan[l]}</h3>{plan.featured && <small>{t.popular}</small>}</div><b>{lang === "zh" ? plan.timeZh : plan.timeEn}</b><p>{lang === "zh" ? plan.descZh : plan.descEn}</p><strong>{plan.price}<em>{t.from}</em></strong></div></article>)}</div>
        <div className="photo-included"><b>{t.included}</b><span>{t.includedItems}</span></div>
      </section>
      <section className="photo-travel-section"><div className="photo-travel-copy"><i>⌁</i><div><h2>{t.travelTitle}</h2><p>{t.travelDesc}</p></div></div><div className="photo-route-links">{routes.map((route) => <a href={route.href} key={route.zh}><img src={route.image} alt="" /><span>{route[l]}</span></a>)}</div></section>
      <section className="photo-consult"><h2>{t.consultTitle}</h2><p className="photo-consult-desc">{t.consultDesc}</p><a className="button" href="/#contact">{t.consult} →</a><p>{t.note}</p></section>
    </main>
    <footer><a className="logo" href="/"><span className="logo-mark">⌂</span><span><b>MAD MAX</b><small>MALAYSIA STAY</small></span></a><div><a href="/#stays">{t.rooms}</a><a href="/services">{lang === "zh" ? "当地服务" : "Local Services"}</a><a href="/#contact">{t.contact}</a></div><small>© 2026 MAD MAX Malaysia Stay</small></footer>
  </>;
}
