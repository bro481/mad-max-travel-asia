"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ServiceMenu } from "../service-menu";
import type { TravelGuideArticle, TravelGuideSettings } from "../../db/travel-guide-shared";
import { guideCities, guideDefaultImages } from "../../db/travel-guide-shared";

type Lang = "zh" | "en";

function coverImage(item: TravelGuideArticle) {
  const defaultImage = guideDefaultImages[item.slug];
  if (defaultImage && item.coverImage.includes("photo-1584515933487-779824d29309")) return defaultImage;
  return item.coverImage || defaultImage || "";
}

function Logo() {
  return (
    <Link className="logo" href="/">
      <span className="logo-mark">⌂</span>
      <span>
        <b>MAD MAX</b>
        <small>MALAYSIA STAY</small>
      </span>
    </Link>
  );
}

export function TravelGuidePage({ articles, settings }: { articles: TravelGuideArticle[]; settings: TravelGuideSettings }) {
  const [lang, setLang] = useState<Lang>("zh");
  const [menu, setMenu] = useState(false);
  const [cityKey, setCityKey] = useState<(typeof guideCities)[number]["key"]>(guideCities[0].key);
  const zh = lang === "zh";
  const current = useMemo(
    () => articles.filter((item) => item.status === "published" && item.city === cityKey),
    [articles, cityKey],
  );

  return (
    <>
      <header>
        <Logo />
        <button className="menu-btn" onClick={() => setMenu(!menu)} aria-label={menu ? "关闭菜单" : "打开菜单"}>
          {menu ? "关闭" : "☰ 菜单"}
        </button>
        <nav className={menu ? "open" : ""}>
          <Link href="/#stays">{zh ? "房源" : "Stays"}</Link>
          <ServiceMenu lang={lang} />
          <Link href="/packages">{zh ? "省心套餐" : "Packages"}</Link>
          <Link href="/picks">{zh ? "大马特产" : "Malaysia Picks"}</Link>
          <Link className="active-nav" href="/photography">{zh ? "旅行攻略" : "Travel Guide"}</Link>
          <Link href="/about">{zh ? "关于我们" : "About"}</Link>
          <div className="language-switch mobile-language">
            <button className={zh ? "active" : ""} onClick={() => setLang("zh")}>中文</button>
            <i />
            <button className={!zh ? "active" : ""} onClick={() => setLang("en")}>English</button>
          </div>
        </nav>
        <div className="header-right">
          <div className="language-switch desktop-language">
            <button className={zh ? "active" : ""} onClick={() => setLang("zh")}>中文</button>
            <i />
            <button className={!zh ? "active" : ""} onClick={() => setLang("en")}>English</button>
          </div>
          <Link className="button header-cta" href="/#contact">{zh ? "提交咨询" : "Inquire"}</Link>
        </div>
      </header>

      <main className="travel-guide-page">
        <section className="guide-hero">
          <img src={settings.heroImage} alt="" aria-hidden="true" />
          <div className="guide-hero-copy">
            <p>{settings.heroTitleEn}</p>
            <h1>{zh ? settings.heroTitleZh : "Travel Guide"}</h1>
            <h2>{zh ? settings.heroDescriptionZh : settings.heroDescriptionEn}</h2>
            <span />
          </div>
          <i>{settings.heroScript}</i>
        </section>

        <section className="guide-city-tabs" aria-label={zh ? "切换攻略城市" : "Choose city"}>
          {guideCities.map((city) => (
            <button key={city.key} className={city.key === cityKey ? "active" : ""} type="button" onClick={() => setCityKey(city.key)}>
              {zh ? city.zh : city.en}
            </button>
          ))}
        </section>

        <section className="guide-list" aria-label={zh ? "攻略文章列表" : "Travel guide articles"}>
          {current.map((item, index) => (
            <Link className={index === 0 ? "guide-row guide-row-featured" : "guide-row"} href={`/photography/${item.slug}`} key={item.id}>
              <figure>
                <img src={coverImage(item)} alt={zh ? item.titleZh : item.titleEn || item.titleZh} />
                {item.imageLabel && <figcaption>{item.imageLabel}</figcaption>}
              </figure>
              <span className="guide-row-copy">
                <small>{item.category}</small>
                <b>{zh ? item.titleZh : item.titleEn || item.titleZh}</b>
                <em>{zh ? item.summaryZh : item.summaryEn || item.summaryZh}</em>
                <span>约 {item.readMinutes || 4} 分钟阅读</span>
              </span>
              <i>→</i>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}
