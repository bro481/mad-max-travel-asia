"use client";

import { useMemo, useState } from "react";
import { ServiceMenu } from "../../service-menu";
import { InquiryModal } from "../../components/inquiry-modal";
import type { TravelPackage } from "../../../db/packages";

type Lang = "zh" | "en";

const fallbackHero =
  "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1800&q=90";

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

function money(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value || 0);
}

function splitHero(text: string) {
  return text
    .replace(/，/g, "，\n")
    .replace(/,/g, ",\n")
    .split("\n")
    .filter(Boolean)
    .slice(0, 3);
}

export function PackageDetailPage({ item }: { item: TravelPackage }) {
  const [lang, setLang] = useState<Lang>("zh");
  const [menu, setMenu] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const zh = lang === "zh";

  const gallery = useMemo(() => {
    const images = [item.coverImage, ...(item.galleryImages || []), ...item.itinerary.map((day) => day.coverImage || ""), ...item.itinerary.flatMap((day) => (day.schedule || []).map((slot) => slot.image || ""))]
      .filter(Boolean);
    return Array.from(new Set(images.length ? images : [fallbackHero]));
  }, [item]);

  const heroImage = gallery[0] || fallbackHero;
  const title = zh ? item.nameZh : item.nameEn;
  const inquiryTitle = `${item.nameZh.replace(/\s+/g, "")}${item.days}天${item.nights}晚`;

  return (
    <>
      <header>
        <Logo />
        <button className="menu-btn" onClick={() => setMenu(!menu)} aria-label={menu ? "关闭菜单" : "打开菜单"}>
          {menu ? "关闭" : "☰ 菜单"}
        </button>
        <nav className={menu ? "open" : ""}>
          <a href="/#stays">{zh ? "房源" : "Stays"}</a>
          <ServiceMenu lang={lang} />
          <a className="active-nav" href="/packages">{zh ? "省心套餐" : "Packages"}</a>
          <a href="/picks">{zh ? "大马特产" : "Malaysia Picks"}</a>
          <a href="/photography">{zh ? "旅行攻略" : "Travel Guide"}</a>
          <a href="/about">{zh ? "关于我们" : "About"}</a>
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
          <a className="button header-cta" href="/#contact">{zh ? "提交咨询" : "Inquire"}</a>
        </div>
      </header>

      <main className="package-full-page">
        <section className="package-full-hero" onClick={() => setGalleryOpen(true)}>
          <img src={heroImage} alt={title} />
          <div className="package-full-hero-copy">
            {(zh ? splitHero(item.heroTextZh) : splitHero(item.heroTextEn)).map((line) => <span key={line}>{line}</span>)}
          </div>
          <span className="package-full-script">Same Places<br />A Deeper Journey</span>
          <button className="package-gallery-pill" type="button" onClick={(event) => { event.stopPropagation(); setGalleryOpen(true); }}>
            ▧ 1 / {gallery.length}
          </button>
        </section>

        <section className="package-full-summary">
          <div>
            <p className="package-full-eyebrow">{zh ? item.cityComboEn.toUpperCase() : item.cityComboZh}</p>
            <h1>{title}</h1>
            <p>{zh ? item.summaryZh : item.summaryEn}</p>
            <div className="package-full-tags">
              {(item.tags || []).filter(Boolean).slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          </div>
          <aside>
            <b>¥{money(item.startingPrice)}</b><span>{zh ? "起/人" : " / person from"}</span>
            <p>{zh ? item.subtitleZh : item.subtitleEn}</p>
          </aside>
        </section>

        <section className="package-full-itinerary">
          <header>
            <h2>{zh ? "行程安排" : "Itinerary"}</h2>
            <p>{item.days}{zh ? "天" : "D"}{item.nights}{zh ? "晚 · 轻松不赶路" : "N · Easy pace"}</p>
          </header>
          <div className="package-timeline">
            {item.itinerary.map((day, index) => {
              const open = openDay === index;
              const cover = day.coverImage || gallery[(index + 1) % gallery.length] || heroImage;
              return (
                <article className={open ? "open" : ""} key={`${day.titleZh}-${index}`}>
                  <button className="package-day-toggle" type="button" onClick={() => setOpenDay(open ? null : index)}>
                    <span className="package-day-no">DAY {String(index + 1).padStart(2, "0")}</span>
                    <span className="package-day-copy">
                      <b>{zh ? day.titleZh : day.titleEn}</b>
                      <small>{zh ? day.descriptionZh : day.descriptionEn}</small>
                    </span>
                    {cover && <img src={cover} alt="" />}
                    <i>{open ? "⌃" : "⌄"}</i>
                  </button>
                  <div className="package-day-panel" aria-hidden={!open}>
                    {(day.schedule || []).map((slot, slotIndex) => (
                      <div className="package-schedule-row" key={`${slot.time}-${slotIndex}`}>
                        <time>{slot.time}</time>
                        <span />
                        <p>{zh ? slot.titleZh : slot.titleEn}</p>
                        {slot.image && <img src={slot.image} alt="" />}
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="package-fee-line">
          <b>ⓘ {zh ? "费用说明" : "Price notes"}</b>
          <p><span>{zh ? "包含" : "Included"}</span>{(item.includes || []).filter(Boolean).join(" · ")}</p>
          <p><span>{zh ? "不含" : "Not included"}</span>{(item.excludes || []).filter(Boolean).join(" · ")}</p>
        </section>
      </main>

      <footer className="package-fixed-consult">
        <div>
          <b>¥{money(item.startingPrice)} <span>{zh ? "起/人" : "from"}</span></b>
          <small>{item.days}天{item.nights}晚 · {zh ? item.cityComboZh : item.cityComboEn}</small>
        </div>
        <button type="button" onClick={() => setInquiryOpen(true)}>💬 {zh ? "咨询这个套餐" : "Inquire"} →</button>
      </footer>

      {galleryOpen && (
        <div className="package-gallery-layer" role="dialog" aria-modal="true" onClick={() => setGalleryOpen(false)}>
          <section className="package-gallery-view" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setGalleryOpen(false)}>×</button>
            <img src={gallery[activeImage]} alt="" />
            <p>{activeImage + 1} / {gallery.length}</p>
            <div>
              {gallery.map((image, index) => (
                <button className={activeImage === index ? "active" : ""} key={image} type="button" onClick={() => setActiveImage(index)}>
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {inquiryOpen && (
        <InquiryModal kind="package" title={inquiryTitle} onClose={() => setInquiryOpen(false)} />
      )}
    </>
  );
}
