"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { rooms } from "../../data";
import { ServiceMenu } from "../../service-menu";
import { InquiryModal } from "../../components/inquiry-modal";
import type { TravelPackage } from "../../../db/packages";

type Lang = "zh" | "en";

const fallbackHero =
  "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1800&q=90";
const photo = (id: string, w = 1400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=86`;
const vehicleImages = [
  photo("photo-1550355291-bbee04a92027"),
  photo("photo-1504215680853-026ed2a45def"),
  photo("photo-1469854523086-cc02fe5d8800"),
];
const defaultPackageDayImageIds = [
  "photo-1596422846543-75c6fc197f07",
  "photo-1580537659466-0a9bfa916a54",
  "photo-1542314831-068cd1dbfeeb",
  "photo-1436491865332-7a61a109cc05",
];

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

function money(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value || 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function uniqueImages(images: string[]) {
  return Array.from(new Set(images.filter(Boolean)));
}

function isDefaultPackageDayImage(image = "") {
  return defaultPackageDayImageIds.some((id) => image.includes(id));
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

function dayDetailSections(day: TravelPackage["itinerary"][number], index: number, total: number, zh: boolean) {
  const title = zh ? day.titleZh : day.titleEn;
  const description = zh ? day.descriptionZh : day.descriptionEn;
  if (!zh) {
    return {
      sections: [
        { title: "Plan", text: description },
        { title: "Pace", text: index === total - 1 ? "Check-out and airport transfer are arranged around your flight time." : "The exact order can be adjusted around weather, traffic and your pace." },
      ],
      meta: index === total - 1 ? "Airport transfer · Flexible timing" : "Private car · Chinese support · Flexible order",
    };
  }
  if (index === 0 && /(抵达|到达|接机)/.test(title + description)) {
    return {
      sections: [
        { title: "抵达后", text: "司机在机场接机，前往吉隆坡市区住宿，先把行李和入住安排处理好。" },
        { title: "晚上", text: "不安排固定行程，可以根据抵达时间自行吃饭、逛街或回住宿休息。" },
      ],
      meta: "接机安排 · 市区住宿 · 晚上自由活动",
    };
  }
  if (index === total - 1 && /(退房|送机|返程|离开)/.test(title + description)) {
    return {
      sections: [
        { title: "退房前", text: "根据航班时间保留轻松节奏，可安排简单用餐、购物或在住宿附近休息。" },
        { title: "送机", text: "司机按约定时间送往机场；如果航班较晚，也可以再加购半日路线。" },
      ],
      meta: "按航班送机 · 时间灵活 · 可补充半日路线",
    };
  }
  if (/马六甲|Malacca|Melaka/.test(title + description)) {
    return {
      sections: [
        { title: "上午", text: "从吉隆坡出发前往马六甲，路上预留休息时间，到达后先游览荷兰红屋一带。" },
        { title: "下午", text: "慢走鸡场街、河畔街区和古城老街，中间保留自由活动与用餐时间。" },
        { title: "结束后", text: "傍晚按当天节奏返回吉隆坡住宿，不把行程排得太赶。" },
      ],
      meta: "专车往返 · 时间灵活 · 可按需求调整",
    };
  }
  return {
    sections: [
      { title: "上午", text: "住宿出发，前往双子塔、国家皇宫及国家清真寺等城市地标。" },
      { title: "下午", text: "继续前往独立广场、城市画廊与老城区，根据当天路线灵活调整顺序。" },
      { title: "结束后", text: "专车送回住宿，晚上自由安排用餐、购物或休息。" },
    ],
    meta: "约 8 小时 · 专车出行 · 行程顺序可调整",
  };
}

function fallbackDayImages(day: TravelPackage["itinerary"][number], index: number) {
  const text = `${day.titleZh} ${day.descriptionZh} ${day.titleEn} ${day.descriptionEn}`;
  if (/马六甲|Malacca|Melaka/.test(text)) {
    return [photo("photo-1565967511849-76a60a516170"), photo("photo-1500534314209-a25ddb2bd429"), photo("photo-1525625293386-3f8f99389edd")];
  }
  if (/(退房|送机|返程|离开|Departure|Airport)/.test(text)) {
    return [photo("photo-1436491865332-7a61a109cc05"), photo("photo-1549317661-bd32c8ce0db2")];
  }
  if (index === 0 || /(抵达|到达|接机|Arrival)/.test(text)) {
    return [photo("photo-1596422846543-75c6fc197f07"), photo("photo-1549317661-bd32c8ce0db2")];
  }
  return [photo("photo-1580193769210-b8d1c049a7d9"), photo("photo-1564507592333-c60657eea523"), photo("photo-1528127269322-539801943592")];
}

function InlineSwipeGallery({
  images,
  index,
  onIndexChange,
  alt,
  className,
  arrows = false,
}: {
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  alt: string;
  className: string;
  arrows?: boolean;
}) {
  const startX = useRef(0);
  const activePointer = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const safeImages = images.length ? images : [fallbackHero];
  const safeIndex = clamp(index, 0, safeImages.length - 1);
  const moveTo = (next: number) => onIndexChange(clamp(next, 0, safeImages.length - 1));
  const finishDrag = (width: number) => {
    const threshold = Math.max(42, width * 0.16);
    if (dragX < -threshold) moveTo(safeIndex + 1);
    if (dragX > threshold) moveTo(safeIndex - 1);
    setDragX(0);
    activePointer.current = null;
  };
  return (
    <div
      className={`${className} package-swipe-gallery`}
      onPointerDown={(event) => {
        activePointer.current = event.pointerId;
        startX.current = event.clientX;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (activePointer.current !== event.pointerId) return;
        setDragX(event.clientX - startX.current);
      }}
      onPointerUp={(event) => finishDrag(event.currentTarget.clientWidth)}
      onPointerCancel={() => {
        activePointer.current = null;
        setDragX(0);
      }}
    >
      <div className="package-swipe-track" style={{ transform: `translate3d(calc(${-safeIndex * 100}% + ${dragX}px),0,0)` }}>
        {safeImages.map((image, imageIndex) => (
          <img src={image} alt={imageIndex === safeIndex ? alt : ""} key={`${image}-${imageIndex}`} draggable={false} />
        ))}
      </div>
      {arrows && safeImages.length > 1 && (
        <>
          <button className="package-swipe-arrow prev" type="button" onClick={() => moveTo(safeIndex - 1)} aria-label="上一张">‹</button>
          <button className="package-swipe-arrow next" type="button" onClick={() => moveTo(safeIndex + 1)} aria-label="下一张">›</button>
        </>
      )}
      <span className="package-swipe-count">{safeIndex + 1} / {safeImages.length}</span>
    </div>
  );
}

export function PackageDetailPage({ item }: { item: TravelPackage }) {
  const [lang, setLang] = useState<Lang>("zh");
  const [menu, setMenu] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [dayImageIndex, setDayImageIndex] = useState<Record<number, number>>({});
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [feeOpen, setFeeOpen] = useState(false);
  const zh = lang === "zh";
  const stayImages = useMemo(() => uniqueImages(rooms.filter((room) => room.location.zh === "吉隆坡").flatMap((room) => room.images).slice(0, 4)), []);

  const gallery = useMemo(() => {
    const themedImages = item.itinerary.flatMap((day, index) => fallbackDayImages(day, index));
    const uploadedDayImages = [
      ...item.itinerary.map((day) => day.coverImage || ""),
      ...item.itinerary.flatMap((day) => (day.schedule || []).map((slot) => slot.image || "")),
    ].filter((image) => image && !isDefaultPackageDayImage(image));
    const images = [item.coverImage, ...(item.galleryImages || []), ...uploadedDayImages, ...themedImages, ...stayImages.slice(0, 1), ...vehicleImages.slice(0, 1)]
      .filter(Boolean);
    return uniqueImages(images.length ? images : [fallbackHero]);
  }, [item, stayImages]);

  const heroImage = gallery[heroIndex] || gallery[0] || fallbackHero;
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
          <Link href="/#stays">{zh ? "房源" : "Stays"}</Link>
          <ServiceMenu lang={lang} />
          <Link className="active-nav" href="/packages">{zh ? "省心套餐" : "Packages"}</Link>
          <Link href="/picks">{zh ? "大马特产" : "Malaysia Picks"}</Link>
          <Link href="/photography">{zh ? "旅行攻略" : "Travel Guide"}</Link>
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

      <main className="package-full-page">
        <section className="package-full-hero">
          <InlineSwipeGallery images={gallery} index={heroIndex} onIndexChange={setHeroIndex} alt={title} className="package-hero-carousel" arrows />
          <div className="package-full-hero-copy">
            {heroLine && <span>{heroLine}</span>}
          </div>
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
              const fallbackImages = fallbackDayImages(day, index);
              const cover = day.coverImage && !isDefaultPackageDayImage(day.coverImage) ? day.coverImage : fallbackImages[0] || gallery[(index + 1) % gallery.length] || heroImage;
              const dayTitle = displayDayTitle(zh ? day.titleZh : day.titleEn, index, item.itinerary.length, zh);
              const daySummary = compactDaySummary(zh ? day.descriptionZh : day.descriptionEn);
              const dayDetails = dayDetailSections(day, index, item.itinerary.length, zh);
              const scheduleImages = (day.schedule || []).map((slot) => slot.image || "").filter((image) => image && !isDefaultPackageDayImage(image));
              const dayImages = uniqueImages([cover, ...scheduleImages, ...fallbackImages]);
              const activeDayImage = dayImageIndex[index] || 0;
              return (
                <article className={open ? "open" : ""} key={`${day.titleZh}-${index}`}>
                  <button className="package-day-toggle" type="button" onClick={() => setOpenDay(open ? null : index)}>
                    <span className="package-day-no">DAY {String(index + 1).padStart(2, "0")}</span>
                    <span className="package-day-copy">
                      <b>{dayTitle}</b>
                      <small>{daySummary}</small>
                    </span>
                    {cover && <img src={cover} alt="" />}
                    <i>{open ? "⌃" : "⌄"}</i>
                  </button>
                  <div className="package-day-panel" aria-hidden={!open}>
                    <div className="package-day-detail-block">
                      {dayDetails.sections.map((section) => (
                        <div key={section.title}>
                          <b>{section.title}</b>
                          <p>{section.text}</p>
                        </div>
                      ))}
                    </div>
                    <InlineSwipeGallery
                      images={dayImages}
                      index={activeDayImage}
                      onIndexChange={(next) => setDayImageIndex((current) => ({ ...current, [index]: next }))}
                      alt={dayTitle}
                      className="package-day-gallery"
                    />
                    <p className="package-day-meta">{dayDetails.meta}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="package-value-section">
          <p className="package-value-kicker">{zh ? "这趟已经帮你安排好" : "Already arranged"}</p>
          <article className="package-value-row">
            <span className="package-value-no">01</span>
            <div className="package-value-copy">
              <small>{zh ? "住宿" : "Stay"}</small>
              <h2>{zh ? "吉隆坡市区舒适住宿" : "Comfortable Kuala Lumpur city stay"}</h2>
              <p>{zh ? `${item.nights}晚 · 根据人数安排合适房型` : `${item.nights} nights · Room type matched to group size`}</p>
              <Link href="/#stays">{zh ? "查看住宿 ›" : "View stays ›"}</Link>
            </div>
            {stayImages[0] && <img className="package-value-thumb" src={stayImages[0]} alt="" />}
          </article>
          <article className="package-value-row">
            <span className="package-value-no">02</span>
            <div className="package-value-copy">
              <small>{zh ? "行程用车" : "Private car"}</small>
              <h2>{zh ? "接机 · 市区行程 · 马六甲往返" : "Airport pickup · City route · Malacca return"}</h2>
              <p>{zh ? "1–14人 · 按人数与行李安排车型" : "1–14 guests · Vehicle matched to group size and luggage"}</p>
            </div>
            {vehicleImages[0] && <img className="package-value-thumb" src={vehicleImages[0]} alt="" />}
          </article>
          <article className="package-value-row support">
            <span className="package-value-no">03</span>
            <div className="package-value-copy">
              <small>{zh ? "中文协助" : "Chinese support"}</small>
              <h2>{zh ? "住宿、用车及行程问题均可沟通" : "Help with stays, vehicles and route questions"}</h2>
              <p>{zh ? "从抵达到返程，有需要都可以联系我们。" : "From arrival to departure, you can reach us when needed."}</p>
            </div>
            <span className="package-value-mark">✓</span>
          </article>
        </section>

        <section className="package-fee-line">
          <b>ⓘ {zh ? "费用与预订说明" : "Price and booking notes"}</b>
          <p><span>{zh ? "包含" : "Included"}</span>{zh ? "住宿 · 行程用车 · 中文沟通协助" : includeItems.join(" · ")}</p>
          <p><span>{zh ? "不含" : "Not included"}</span>{zh ? "机票 · 餐食 · 门票 · 个人消费" : excludeItems.join(" · ")}</p>
          <button type="button" onClick={() => setFeeOpen(true)}>{zh ? "查看详细说明" : "Full details"} ›</button>
        </section>
      </main>

      <footer className="package-fixed-consult">
        <div>
          <b>{zh ? item.cityComboZh : item.cityComboEn}</b>
          <small>{zh ? `${item.days}天${item.nights}晚` : `${item.days}D${item.nights}N`}</small>
        </div>
        <button type="button" onClick={() => setInquiryOpen(true)}>{zh ? "咨询这个行程" : "Inquire"} →</button>
      </footer>

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
