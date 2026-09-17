"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { rooms } from "../../data";
import { ServiceMenu } from "../../service-menu";
import { InquiryModal } from "../../components/inquiry-modal";
import type { TravelPackage, TravelPackageSchedule } from "../../../db/packages";
import type { PropertyRecord } from "../../../db/properties";
import type { ServiceItem } from "../../../db/service-items";

type Lang = "zh" | "en";
type PackageReferenceProperty = Pick<PropertyRecord, "id" | "slug" | "nameZh" | "nameEn">;
type PackageReferenceService = Pick<ServiceItem, "id" | "slug" | "nameZh" | "nameEn">;

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

function compactFeeItems(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function packageHeroLine(item: TravelPackage, zh: boolean) {
  const text = zh ? item.heroTextZh : item.heroTextEn;
  if (text?.trim()) return text.trim();
  if (!zh) return `${item.days} days, arranged at an easy pace.`;
  return `${item.cityComboZh}，刚刚好的${item.days}天。`;
}

function packageSummary(item: TravelPackage, zh: boolean) {
  const text = zh ? item.summaryZh : item.summaryEn;
  if (text?.trim()) return text.trim();
  return zh ? `${item.cityComboZh}，轻松玩${item.days}天。` : `${item.cityComboEn}, an easy ${item.days}-day route.`;
}

function packageSubtitle(item: TravelPackage, zh: boolean) {
  const text = zh ? item.subtitleZh : item.subtitleEn;
  if (text?.trim()) return text.trim();
  return zh ? `${item.days}天${item.nights}晚 · 住宿 + 行程用车 + 中文协助` : `${item.days}D${item.nights}N · Stay + car + Chinese support`;
}

function linkedCountNote(count = 0, zh: boolean, zhLabel: string, enLabel: string) {
  if (!count) return "";
  return zh ? `已关联 ${count} 个${zhLabel}，可按实际日期和人数确认。` : `${count} linked ${enLabel} option${count > 1 ? "s" : ""} can be confirmed by dates and group size.`;
}

function linkedReferenceNote(names: string[], count = 0, zh: boolean, zhLabel: string, enLabel: string) {
  if (names.length) return zh ? `已关联：${names.join("、")}` : `Linked: ${names.join(", ")}`;
  return linkedCountNote(count, zh, zhLabel, enLabel);
}

function formatPriceTier(tier: NonNullable<TravelPackage["priceTiers"]>[number], zh: boolean) {
  const label = tier.label || (zh ? "人数价格" : "Group price");
  if (!tier.price) return `${label} ${zh ? "询价" : "on request"}`;
  return `${label} ¥${money(tier.price)}${tier.unit || (zh ? "/人" : " / person")}`;
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

function getDisplayOptions(item: TravelPackage) {
  const defaults = { heroGallery: true, tags: true, itinerary: true, arrangements: true, fees: true };
  return Object.assign({}, defaults, item.displayOptions || {});
}

function fillTemplate(template: string, item: TravelPackage, zh: boolean) {
  const name = zh ? item.nameZh : item.nameEn;
  const city = zh ? item.cityComboZh : item.cityComboEn;
  return (template || "")
    .replaceAll("{套餐名称}", name)
    .replaceAll("{Package}", name)
    .replaceAll("{天数}", String(item.days))
    .replaceAll("{晚数}", String(item.nights))
    .replaceAll("{城市}", city)
    .replaceAll("{City}", city)
    .replaceAll("{days}", String(item.days))
    .replaceAll("{nights}", String(item.nights));
}

function packageInquiryTitle(item: TravelPackage, zh: boolean) {
  const template = zh ? item.inquirySettings?.titleTemplateZh : item.inquirySettings?.titleTemplateEn;
  return fillTemplate(template || `${zh ? item.nameZh : item.nameEn} ${item.days}${zh ? "天" : "D"}${item.nights}${zh ? "晚" : "N"}`, item, zh);
}

function dayContent(day: TravelPackage["itinerary"][number], index: number, total: number, zh: boolean) {
  const blocks = (day.contentBlocks || [])
    .slice()
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((block) => ({
      title: (zh ? block.titleZh : block.titleEn) || block.titleZh,
      text: (zh ? block.textZh : block.textEn) || block.textZh,
    }))
    .filter((block) => block.title && block.text);
  if (blocks.length) {
    return {
      sections: blocks,
      meta:
        (zh ? day.galleryCaptionZh : day.galleryCaptionEn) ||
        (day.schedule || []).map((slot) => (zh ? slot.titleZh : slot.titleEn) || slot.titleZh).filter(Boolean).slice(0, 3).join(" · "),
    };
  }
  const scheduleSections = (day.schedule || [])
    .slice()
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((slot) => {
      const nodeTitle = (zh ? slot.titleZh : slot.titleEn) || slot.titleZh || slot.titleEn;
      const nodeText = (zh ? slot.descriptionZh : slot.descriptionEn) || slot.descriptionZh || slot.descriptionEn || "";
      const title = slot.time?.trim() || nodeTitle;
      const text = slot.time?.trim() ? [nodeTitle, nodeText].filter(Boolean).join("：") : nodeText;
      return { title, text };
    })
    .filter((section) => section.title && section.text);
  if (scheduleSections.length) {
    return {
      sections: scheduleSections,
      meta:
        (zh ? day.galleryCaptionZh : day.galleryCaptionEn) ||
        (day.schedule || []).map((slot) => (zh ? slot.titleZh : slot.titleEn) || slot.titleZh).filter(Boolean).slice(0, 3).join(" · "),
    };
  }
  const fallback = dayDetailSections(day, index, total, zh);
  return {
    sections: fallback.sections,
    meta: (zh ? day.galleryCaptionZh : day.galleryCaptionEn) || fallback.meta,
  };
}

function scheduleNodeIcon(type?: TravelPackageSchedule["nodeType"]) {
  if (type === "transport") return "🚗";
  if (type === "stay") return "🏨";
  if (type === "experience") return "🌴";
  if (type === "food") return "🍴";
  if (type === "flight") return "✈";
  if (type === "free") return "☀";
  return "📍";
}

function fallbackScheduleNodes(day: TravelPackage["itinerary"][number], zh: boolean): TravelPackageSchedule[] {
  const title = zh ? day.titleZh : day.titleEn;
  const summary = zh ? day.summaryZh || day.descriptionZh : day.summaryEn || day.descriptionEn;
  const text = `${title} ${summary} ${day.descriptionZh} ${day.descriptionEn}`;
  const nodes: TravelPackageSchedule[] = [];
  if (/(接机|接送|专车|用车|transfer|car|pickup)/i.test(text)) {
    nodes.push({
      nodeType: "transport",
      time: zh ? "抵达后" : "After arrival",
      titleZh: "专车接送",
      titleEn: "Private transfer",
      descriptionZh: "根据抵达时间和当天路线安排接送。",
      descriptionEn: "Transfer is arranged around arrival time and the route of the day.",
      sortOrder: 1,
    });
  }
  if (/(入住|住宿|酒店|公寓|stay|hotel|apartment)/i.test(text)) {
    nodes.push({
      nodeType: "stay",
      time: zh ? "当天" : "This day",
      titleZh: "住宿安排",
      titleEn: "Stay arrangement",
      descriptionZh: summary || "住宿及房型会根据人数、日期和实际库存确认。",
      descriptionEn: summary || "The stay and room type are confirmed by group size, dates and availability.",
      sortOrder: 2,
    });
  }
  return nodes;
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
  const atStart = safeIndex === 0;
  const atEnd = safeIndex === safeImages.length - 1;
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
          <button className={`package-swipe-arrow prev ${atStart ? "muted" : ""}`} type="button" onClick={() => moveTo(safeIndex - 1)} aria-label="上一张">‹</button>
          <button className={`package-swipe-arrow next ${atEnd ? "muted" : ""}`} type="button" onClick={() => moveTo(safeIndex + 1)} aria-label="下一张">›</button>
        </>
      )}
      <span className="package-swipe-count">{safeIndex + 1} / {safeImages.length}</span>
    </div>
  );
}

export function PackageDetailPage({
  item,
  properties = [],
  services = [],
}: {
  item: TravelPackage;
  properties?: PackageReferenceProperty[];
  services?: PackageReferenceService[];
}) {
  const [lang, setLang] = useState<Lang>("zh");
  const [menu, setMenu] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [dayImageIndex, setDayImageIndex] = useState<Record<number, number>>({});
  const [arrangementImageIndex, setArrangementImageIndex] = useState<Record<string, number>>({});
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [feeOpen, setFeeOpen] = useState(false);
  const zh = lang === "zh";
  const displayOptions = getDisplayOptions(item);
  const stayImages = useMemo(() => uniqueImages(rooms.filter((room) => room.location.zh === "吉隆坡").flatMap((room) => room.images).slice(0, 4)), []);

  const gallery = useMemo(() => {
    const topImages = displayOptions.heroGallery ? [item.coverImage, ...(item.galleryImages || [])] : [item.coverImage];
    const images = topImages.filter(Boolean);
    return uniqueImages(images.length ? images : [fallbackHero]);
  }, [displayOptions.heroGallery, item]);

  const heroImage = gallery[heroIndex] || gallery[0] || fallbackHero;
  const title = zh ? item.nameZh : item.nameEn;
  const inquiryTitle = packageInquiryTitle(item, zh);
  const heroLine = packageHeroLine(item, zh);
  const includeItems = compactFeeItems(item.includes || []);
  const excludeItems = compactFeeItems(item.excludes || []);
  const includeText = includeItems.join(" · ") || (zh ? "住宿 · 行程用车 · 中文沟通协助" : "Stay · Route vehicle · Chinese support");
  const excludeText = excludeItems.join(" · ") || (zh ? "机票 · 餐食 · 门票 · 个人消费" : "Flights · Meals · Tickets · Personal expenses");
  const visiblePriceTiers = (item.priceTiers || []).filter((tier) => tier.visible !== false && (tier.label || tier.price));
  const visibleTags = (item.tags || []).filter(Boolean).slice(0, 4);
  const stay = item.arrangements?.stay;
  const vehicle = item.arrangements?.vehicle;
  const support = item.arrangements?.support;
  const stayPropertyNames = (stay?.propertyIds || [])
    .map((id) => properties.find((property) => property.id === id))
    .filter((property): property is PackageReferenceProperty => Boolean(property))
    .map((property) => (zh ? property.nameZh : property.nameEn) || property.nameZh);
  const vehicleServiceNames = (vehicle?.serviceIds || [])
    .map((id) => services.find((service) => service.id === id))
    .filter((service): service is PackageReferenceService => Boolean(service))
    .map((service) => (zh ? service.nameZh : service.nameEn) || service.nameZh);
  const stayGallery = uniqueImages([...(stay?.images || []), ...stayImages]);
  const vehicleGallery = uniqueImages([...(vehicle?.images || []), ...vehicleImages]);
  const arrangementRows = [
    stay?.visible !== false && {
      key: "stay",
      eyebrow: zh ? "住宿" : "Stay",
      title: (zh ? stay?.titleZh : stay?.titleEn) || (zh ? "吉隆坡市区舒适住宿" : "Comfortable Kuala Lumpur city stay"),
      description: [
        (zh ? stay?.nights || `${item.nights}晚` : `${item.nights} nights`),
        (zh ? stay?.descriptionZh : stay?.descriptionEn) || (zh ? "根据人数安排合适房型" : "Room type matched to group size"),
      ].filter(Boolean).join(" · "),
      note: [(zh ? stay?.noteZh : stay?.noteEn), linkedReferenceNote(stayPropertyNames, stay?.propertyIds?.length, zh, "住宿选择", "stay")].filter(Boolean).join(" "),
      images: stayGallery,
      link: true,
    },
    vehicle?.visible !== false && {
      key: "vehicle",
      eyebrow: zh ? "行程用车" : "Private car",
      title: (zh ? vehicle?.titleZh : vehicle?.titleEn) || (zh ? "按人数安排合适车型" : "Vehicle matched to your group"),
      description: [(zh ? vehicle?.scopeZh : vehicle?.scopeEn), (zh ? vehicle?.descriptionZh : vehicle?.descriptionEn)].filter(Boolean).join(" · "),
      note: linkedReferenceNote(vehicleServiceNames, vehicle?.serviceIds?.length, zh, "当地服务", "local service"),
      images: vehicleGallery,
      link: false,
    },
    support?.visible !== false && {
      key: "support",
      eyebrow: zh ? "中文协助" : "Chinese support",
      title: (zh ? support?.titleZh : support?.titleEn) || (zh ? "全程中文协助" : "Chinese support throughout"),
      description: (zh ? support?.descriptionZh : support?.descriptionEn) || (zh ? "从抵达到返程，住宿、用车及行程问题均可沟通。" : "From arrival to departure, we can help with stay, vehicle and itinerary questions."),
      note: "",
      images: [] as string[],
      link: false,
    },
  ].filter(Boolean) as Array<{ key: string; eyebrow: string; title: string; description: string; note: string; images: string[]; link: boolean }>;

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
            {displayOptions.tags && visibleTags.length > 0 && <p className="package-full-fit">{visibleTags.join(" · ")}</p>}
          </div>
          <aside>
            <b>¥{money(item.startingPrice)}</b><span>{zh ? "起/人" : " / person from"}</span>
            <small>{packageSubtitle(item, zh)}</small>
            <p>{zh ? "按人数与日期确认最终价格" : "Final price confirmed by dates and group size"}</p>
          </aside>
        </section>

        {displayOptions.itinerary && (
        <section className="package-full-itinerary">
          <p className="package-itinerary-note">{zh ? "行程安排" : "Itinerary"}</p>
          <div className="package-timeline">
            {item.itinerary.map((day, index) => {
              const open = openDay === index;
              const fallbackImages = fallbackDayImages(day, index);
              const cover = day.coverImage && !isDefaultPackageDayImage(day.coverImage) ? day.coverImage : fallbackImages[0] || gallery[(index + 1) % gallery.length] || heroImage;
              const dayTitle = displayDayTitle(zh ? day.titleZh : day.titleEn, index, item.itinerary.length, zh);
              const daySummary = compactDaySummary((zh ? day.summaryZh : day.summaryEn) || (zh ? day.descriptionZh : day.descriptionEn));
              const dayDetails = dayContent(day, index, item.itinerary.length, zh);
              const savedScheduleNodes = (day.schedule || [])
                .slice()
                .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                .filter((slot) => slot.titleZh || slot.titleEn || slot.descriptionZh || slot.descriptionEn || slot.time || slot.image || slot.sourceLabel);
              const scheduleNodes = savedScheduleNodes.length ? savedScheduleNodes : fallbackScheduleNodes(day, zh);
              const scheduleImages = (day.schedule || []).map((slot) => slot.image || "").filter((image) => image && !isDefaultPackageDayImage(image));
              const dayImages = uniqueImages([cover, ...(day.galleryImages || []), ...scheduleImages, ...fallbackImages]);
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
                    {scheduleNodes.length > 0 && (
                      <div className="package-day-node-list">
                        {scheduleNodes.map((slot, slotIndex) => {
                          const nodeTitle = (zh ? slot.titleZh : slot.titleEn) || slot.titleZh || slot.titleEn;
                          const nodeDescription = (zh ? slot.descriptionZh : slot.descriptionEn) || slot.descriptionZh || slot.descriptionEn;
                          return (
                            <article key={`${nodeTitle}-${slotIndex}`}>
                              <span>{scheduleNodeIcon(slot.nodeType)}</span>
                              <div>
                                <small>{slot.time || (zh ? "时间灵活" : "Flexible time")}</small>
                                <b>{nodeTitle}</b>
                                {nodeDescription && <p>{nodeDescription}</p>}
                                {slot.sourceLabel && <em>{zh ? "引用" : "Linked"}：{slot.sourceLabel}</em>}
                              </div>
                              {slot.image && !isDefaultPackageDayImage(slot.image) && <img src={slot.image} alt="" />}
                            </article>
                          );
                        })}
                      </div>
                    )}
                    <InlineSwipeGallery
                      images={dayImages}
                      index={activeDayImage}
                      onIndexChange={(next) => setDayImageIndex((current) => ({ ...current, [index]: next }))}
                      alt={dayTitle}
                      className="package-day-gallery"
                      arrows
                    />
                    <p className="package-day-meta">{dayDetails.meta}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        )}

        {displayOptions.arrangements && arrangementRows.length > 0 && (
        <section className="package-value-section">
          <p className="package-value-kicker">{zh ? "这趟已经帮你安排好" : "Already arranged"}</p>
          {arrangementRows.map((row, index) => {
            const activeIndex = arrangementImageIndex[row.key] || 0;
            return (
              <article className={`package-value-row ${row.key === "support" ? "support" : ""}`} key={row.key}>
                <span className="package-value-no">{String(index + 1).padStart(2, "0")}</span>
                <div className="package-value-copy">
                  <small>{row.eyebrow}</small>
                  <h2>{row.title}</h2>
                  <p>{row.description}</p>
                  {row.note && <p>{row.note}</p>}
                  {row.link && <Link href="/#stays">{zh ? "查看住宿 ›" : "View stays ›"}</Link>}
                </div>
                {row.images.length > 0 ? (
                  <InlineSwipeGallery
                    images={row.images}
                    index={activeIndex}
                    onIndexChange={(next) => setArrangementImageIndex((current) => ({ ...current, [row.key]: next }))}
                    alt={row.title}
                    className="package-value-gallery"
                  />
                ) : <span className="package-value-mark">✓</span>}
              </article>
            );
          })}
        </section>
        )}

        {displayOptions.fees && (
        <section className="package-fee-line">
          <b>ⓘ {zh ? "费用与预订说明" : "Price and booking notes"}</b>
          <p><span>{zh ? "包含" : "Included"}</span>{includeText}</p>
          <p><span>{zh ? "不含" : "Not included"}</span>{excludeText}</p>
          <button type="button" onClick={() => setFeeOpen(true)}>{zh ? "查看详细说明" : "Full details"} ›</button>
        </section>
        )}
      </main>

      <footer className="package-fixed-consult">
        <div>
          <b>{zh ? item.cityComboZh : item.cityComboEn}</b>
          <small>{zh ? `${item.days}天${item.nights}晚` : `${item.days}D${item.nights}N`}</small>
        </div>
        <button type="button" onClick={() => setInquiryOpen(true)}>{(zh ? item.inquirySettings?.buttonTextZh : item.inquirySettings?.buttonTextEn) || (zh ? "咨询这个行程" : "Inquire")} →</button>
      </footer>

      {inquiryOpen && (
        <InquiryModal kind="package" title={inquiryTitle} promptFields={item.inquirySettings?.promptFields || []} onClose={() => setInquiryOpen(false)} />
      )}

      {feeOpen && (
        <div className="package-sheet-layer" role="dialog" aria-modal="true" onClick={() => setFeeOpen(false)}>
          <section className="package-bottom-sheet" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setFeeOpen(false)}>×</button>
            <h2>{zh ? "预订与费用说明" : "Booking and price notes"}</h2>
            <dl>
              <div><dt>{zh ? "包含" : "Included"}</dt><dd>{includeText}</dd></div>
              <div><dt>{zh ? "不含" : "Not included"}</dt><dd>{excludeText}</dd></div>
              {visiblePriceTiers.length > 0 && <div><dt>{zh ? "人数价格" : "Group prices"}</dt><dd>{visiblePriceTiers.map((tier) => formatPriceTier(tier, zh)).join("；")}</dd></div>}
              <div><dt>{zh ? "住宿" : "Stay"}</dt><dd>{(zh ? item.accommodationNoteZh || stay?.noteZh : item.accommodationNoteEn || stay?.noteEn) || (zh ? "实际住宿及房型会根据人数与日期确认。" : "Final stay and room type are confirmed by group size and dates.")}</dd></div>
              <div><dt>{zh ? "用车" : "Car"}</dt><dd>{(zh ? item.transferNoteZh || vehicle?.descriptionZh : item.transferNoteEn || vehicle?.descriptionEn) || (zh ? "根据人数安排合适车型，行程内用车统一协调。" : "Vehicle arranged by group size for the planned route.")}</dd></div>
              <div><dt>{zh ? "价格说明" : "Price note"}</dt><dd>{(zh ? item.priceNoteZh : item.priceNoteEn) || (zh ? "价格为参考起价，最终按人数、日期和实际安排确认。" : "The shown price is a starting reference and is confirmed by dates, group size and route.")}</dd></div>
              <div><dt>{zh ? "注意事项" : "Notes"}</dt><dd>{(zh ? item.notesZh : item.notesEn) || (zh ? "行程可能根据天气、交通及当地实际情况调整。" : "The itinerary may be adjusted around weather, traffic and local conditions.")}</dd></div>
            </dl>
          </section>
        </div>
      )}
    </>
  );
}
