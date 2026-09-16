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

function compactFeeItems(items: string[], type: "include" | "exclude") {
  const aliases: Record<string, string> =
    type === "include"
      ? {
          行程规划: "行程规划",
          当地中文沟通协助: "中文沟通",
          路线内接送安排建议: "行程内接送安排",
        }
      : {
          "国际/国内机票": "机票",
          个人消费: "个人消费",
          景点门票及自费项目: "门票及自费项目",
        };
  const mapped = items
    .filter(Boolean)
    .map((item) => aliases[item] || item)
    .filter((item) => !/(住宿与服务组合建议|旺季价格差额)/.test(item));
  return Array.from(new Set(mapped)).slice(0, 3);
}

function shouldShowScheduleImage(title: string) {
  return !/(接机|送机|机场|航班|酒店|入住|退房|返回|自由活动)/.test(title);
}

function packageHeroLine(item: TravelPackage, zh: boolean) {
  if (!zh) return `${item.days} days, arranged at an easy pace.`;
  if (item.cityComboZh.includes("吉隆坡") && item.cityComboZh.includes("马六甲")) return "城市与古城，刚刚好的四天。";
  return `${item.cityComboZh}，刚刚好的${item.days}天。`;
}

function packageSummary(item: TravelPackage, zh: boolean) {
  if (!zh) return item.summaryEn;
  if (item.cityComboZh.includes("吉隆坡") && item.cityComboZh.includes("马六甲")) return "城市与古城之间，轻松玩四天。";
  return item.summaryZh;
}

function displayDayTitle(title: string, index: number, total: number, zh: boolean) {
  if (zh && index === total - 1 && /(退房|送机|返程|离开)/.test(title)) return "返程";
  return title;
}

function compactDaySummary(text: string) {
  return text
    .replace(/[，,、]/g, " · ")
    .replace(/[。.!！]/g, "")
    .replace(/\s*·\s*/g, " · ")
    .replace(/与/g, " · ")
    .trim();
}

function dayDetailText(day: TravelPackage["itinerary"][number], index: number, total: number, zh: boolean) {
  const title = zh ? day.titleZh : day.titleEn;
  const description = zh ? day.descriptionZh : day.descriptionEn;
  if (!zh) return description;
  if (index === 0 && /(抵达|到达|接机)/.test(title + description)) {
    return "抵达机场后，由司机接机前往市区住宿。办理入住后不再安排固定行程，晚上可以根据抵达时间自行逛街、吃饭或休息。";
  }
  if (index === total - 1 && /(退房|送机|返程|离开)/.test(title + description)) {
    return "当天按航班时间安排退房与送机。如果航班较晚，也可以预留轻松用餐、购物或补充半日路线。";
  }
  return description;
}

function isDuplicateScheduleText(text: string, daySummary: string) {
  return compactDaySummary(text) === daySummary || /自由活动或返回酒店/.test(text);
}

export function PackageDetailPage({ item }: { item: TravelPackage }) {
  const [lang, setLang] = useState<Lang>("zh");
  const [menu, setMenu] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [feeOpen, setFeeOpen] = useState(false);
  const zh = lang === "zh";

  const gallery = useMemo(() => {
    const images = [item.coverImage, ...(item.galleryImages || []), ...item.itinerary.map((day) => day.coverImage || ""), ...item.itinerary.flatMap((day) => (day.schedule || []).map((slot) => slot.image || ""))]
      .filter(Boolean);
    return Array.from(new Set(images.length ? images : [fallbackHero]));
  }, [item]);

  const heroImage = gallery[0] || fallbackHero;
  const title = zh ? item.nameZh : item.nameEn;
  const inquiryTitle = `${item.nameZh.replace(/\s+/g, "")}${item.days}天${item.nights}晚`;
  const heroLine = packageHeroLine(item, zh);
  const includeItems = compactFeeItems(item.includes || [], "include");
  const excludeItems = compactFeeItems(item.excludes || [], "exclude");

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
            {heroLine && <span>{heroLine}</span>}
          </div>
          <button className="package-gallery-pill" type="button" onClick={(event) => { event.stopPropagation(); setGalleryOpen(true); }}>
            ▧ 1 / {gallery.length}
          </button>
        </section>

        <section className="package-full-summary">
          <div>
            <p className="package-full-eyebrow">{zh ? item.cityComboEn.toUpperCase() : item.cityComboZh}</p>
            <h1>{title}</h1>
            <p>{packageSummary(item, zh)}</p>
            <p className="package-full-fit">{zh ? "初次到访 · 情侣 / 朋友 · 不赶行程" : "First visit · Couples / friends · Easy pace"}</p>
          </div>
          <aside>
            <b>¥{money(item.startingPrice)}</b><span>{zh ? "起/人" : " / person from"}</span>
            <small>{zh ? `${item.days}天${item.nights}晚 · 住宿 + 行程用车 + 中文协助` : `${item.days}D${item.nights}N · Stay + car + Chinese support`}</small>
            <p>{zh ? "按人数与日期确认最终价格" : "Final price confirmed by dates and group size"}</p>
          </aside>
        </section>

        <section className="package-full-itinerary">
          <p className="package-itinerary-note">{zh ? "行程安排" : "Itinerary"}</p>
          <div className="package-timeline">
            {item.itinerary.map((day, index) => {
              const open = openDay === index;
              const cover = day.coverImage || gallery[(index + 1) % gallery.length] || heroImage;
              let shownScheduleImages = 0;
              const dayTitle = displayDayTitle(zh ? day.titleZh : day.titleEn, index, item.itinerary.length, zh);
              const daySummary = compactDaySummary(zh ? day.descriptionZh : day.descriptionEn);
              const detailText = dayDetailText(day, index, item.itinerary.length, zh);
              const scheduleRows = (day.schedule || []).filter((slot) => {
                const text = zh ? slot.titleZh : slot.titleEn;
                const description = zh ? slot.descriptionZh : slot.descriptionEn;
                return Boolean(description || !isDuplicateScheduleText(text, daySummary));
              });
              const hasDetailText = compactDaySummary(detailText) !== daySummary;
              const canExpand = hasDetailText || scheduleRows.length > 0;
              return (
                <article className={`${open && canExpand ? "open" : ""} ${canExpand ? "" : "no-expand"}`} key={`${day.titleZh}-${index}`}>
                  <button className="package-day-toggle" type="button" onClick={() => canExpand && setOpenDay(open ? null : index)}>
                    <span className="package-day-no">DAY {String(index + 1).padStart(2, "0")}</span>
                    <span className="package-day-copy">
                      <b>{dayTitle}</b>
                      <small>{daySummary}</small>
                    </span>
                    {cover && <img src={cover} alt="" />}
                    {canExpand && <i>{open ? "⌃" : "⌄"}</i>}
                  </button>
                  {canExpand && (
                    <div className="package-day-panel" aria-hidden={!open}>
                      {hasDetailText && <p className="package-day-detail">{detailText}</p>}
                      {scheduleRows.map((slot, slotIndex) => (
                        (() => {
                          const text = zh ? slot.titleZh : slot.titleEn;
                          const description = zh ? slot.descriptionZh : slot.descriptionEn;
                          const showImage = Boolean(slot.image && shouldShowScheduleImage(text) && shownScheduleImages < 2);
                          if (showImage) shownScheduleImages += 1;
                          return (
                            <div className={slot.time ? "package-schedule-row" : "package-schedule-row no-time"} key={`${slot.time || ""}-${slotIndex}`}>
                              {slot.time && <time>{slot.time}</time>}
                              <span />
                              <p>{text}{description ? <small>{description}</small> : null}</p>
                              {showImage && <img src={slot.image} alt="" />}
                            </div>
                          );
                        })()
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="package-fee-line">
          <b>ⓘ {zh ? "费用说明" : "Price notes"}</b>
          <p><span>{zh ? "包含" : "Included"}</span>{zh ? "住宿 · 行程用车 · 中文沟通协助" : includeItems.join(" · ")}</p>
          <p><span>{zh ? "不含" : "Not included"}</span>{zh ? "机票 · 餐食 · 门票 · 个人消费" : excludeItems.join(" · ")}</p>
          <button type="button" onClick={() => setFeeOpen(true)}>{zh ? "详细费用说明" : "Full details"} ›</button>
        </section>
      </main>

      <footer className="package-fixed-consult">
        <div>
          <b>{zh ? item.cityComboZh : item.cityComboEn}</b>
          <small>{zh ? `${item.days}天${item.nights}晚` : `${item.days}D${item.nights}N`}</small>
        </div>
        <button type="button" onClick={() => setInquiryOpen(true)}>{zh ? "咨询行程" : "Inquire"} →</button>
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

      {feeOpen && (
        <div className="package-sheet-layer" role="dialog" aria-modal="true" onClick={() => setFeeOpen(false)}>
          <section className="package-bottom-sheet" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setFeeOpen(false)}>×</button>
            <h2>{zh ? "预订与费用说明" : "Booking and price notes"}</h2>
            <dl>
              <div><dt>{zh ? "住宿" : "Stay"}</dt><dd>{zh ? "市区舒适住宿，实际房型会根据人数与日期确认。" : "Comfortable city stay, confirmed by dates and group size."}</dd></div>
              <div><dt>{zh ? "用车" : "Car"}</dt><dd>{zh ? "根据人数安排合适车型，行程内用车统一协调。" : "Vehicle arranged by group size for the planned route."}</dd></div>
              <div><dt>{zh ? "门票" : "Tickets"}</dt><dd>{zh ? "景点门票及自费项目会在咨询时按实际路线确认。" : "Tickets and optional activities are confirmed with the route."}</dd></div>
              <div><dt>{zh ? "儿童 / 旺季" : "Kids / peak dates"}</dt><dd>{zh ? "儿童、节假日、旺季和额外路线会单独核算。" : "Kids, peak dates and extra routes are quoted separately."}</dd></div>
            </dl>
          </section>
        </div>
      )}
    </>
  );
}
