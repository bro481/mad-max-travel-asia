"use client";
import { FormEvent, type MouseEvent, type ReactElement, useEffect, useRef, useState } from "react";
import { services, type Lang, type Room } from "./data";
import type { DestinationRecord } from "../db/destinations";
import { roomLayoutKey, roomLayoutLabel } from "../lib/room-layout";
import { ServiceMenu } from "./service-menu";
import { InquiryModal } from "./components/inquiry-modal";
import { MobileScrollHint } from "./components/mobile-scroll-hint";
import { DateInput } from "./components/date-input";

const fallbackDestinations: DestinationRecord[] = [
  { id: 1, slug: "kuala-lumpur", nameZh: "吉隆坡", nameEn: "Kuala Lumpur", introZh: "", introEn: "", useForProperties: true, useForServices: true, propertySort: 1, serviceSort: 1, onlyShowWithContent: true, status: "visible", updatedAt: "" },
  { id: 2, slug: "kota-kinabalu", nameZh: "亚庇", nameEn: "Kota Kinabalu", introZh: "", introEn: "", useForProperties: true, useForServices: true, propertySort: 2, serviceSort: 2, onlyShowWithContent: true, status: "visible", updatedAt: "" },
  { id: 3, slug: "semporna", nameZh: "仙本那", nameEn: "Semporna", introZh: "", introEn: "", useForProperties: true, useForServices: true, propertySort: 3, serviceSort: 3, onlyShowWithContent: true, status: "visible", updatedAt: "" },
];
const serviceOptions = {
  en: [
    "Accommodation",
    "Airport Transfer",
    "Private Car",
    "Island Transfer",
    "Day Trip",
    "Other",
  ],
  zh: ["住宿", "机场接送", "私人包车", "海岛接送", "一日游", "其他"],
};
const timeOptions = {
  en: ["Choose a date", "Approximate month", "Not decided yet"],
  zh: ["选择日期", "大概月份", "还没决定"],
};
const MYR_TO_CNY = 1.7;
type RoomIconName = "layout" | "area" | "floor" | "guests" | "bed" | "sofa" | "pin";

function roomPriceDisplay(room: Room, lang: Lang) {
  const space = room.spaceConfig as (Room["spaceConfig"] & Record<string, any>) | undefined;
  const priceType = space?.priceType || (space?.showPriceFrom === false ? "fixed" : "from");
  if (priceType === "consult" || !room.priceFrom) {
    return { price: lang === "zh" ? "价格咨询" : "Ask for price", suffix: "" };
  }
  const currency = space?.currency;
  const showCny = currency ? currency !== "MYR" : lang === "zh";
  const amount = currency
    ? room.priceFrom
    : showCny
      ? Math.round(room.priceFrom * MYR_TO_CNY)
      : room.priceFrom;
  const unit = space?.priceUnit || (lang === "zh" ? "晚" : "night");
  return {
    price: showCny ? `¥${amount}` : `RM ${amount}`,
    suffix: `${priceType === "from" ? (lang === "zh" ? " 起" : " from") : ""}/${unit}`,
  };
}

function RoomIcon({ name }: { name: RoomIconName }) {
  const paths: Record<RoomIconName, ReactElement> = {
    layout: <path d="M4 11.5 12 5l8 6.5v7a1 1 0 0 1-1 1h-5v-5h-4v5H5a1 1 0 0 1-1-1z" />,
    area: <path d="M5 8V5h3M16 5h3v3M19 16v3h-3M8 19H5v-3M8 5h8M19 8v8M16 19H8M5 16V8" />,
    floor: <path d="M6 20V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v15M9 8h2M13 8h2M9 12h2M13 12h2M10 20v-4h4v4" />,
    guests: <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 20a5.5 5.5 0 0 1 11 0M16 11a2.5 2.5 0 1 0 0-5M15.5 14.5A4.7 4.7 0 0 1 20.5 20" />,
    bed: <path d="M4 19V8M20 19v-5a3 3 0 0 0-3-3H4v8M4 14h16M7 11V8h5v3" />,
    sofa: <path d="M5 12V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M4 12h16a1.5 1.5 0 0 1 1.5 1.5V19H2.5v-5.5A1.5 1.5 0 0 1 4 12ZM5 19v2M19 19v2" />,
    pin: <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function formatGuestPhrase(spaceConfig: Room["spaceConfig"], lang: Lang) {
  const max = spaceConfig?.maxGuests;
  if (lang === "zh") {
    return max ? `最多 ${max} 人` : "";
  }
  return max ? `Up to ${max} guests` : "";
}

function modalLocationLabel(room: Room, lang: Lang) {
  if (lang === "zh" && room.location.zh === "吉隆坡") {
    if (room.area.zh === "市中心" || room.area.zh === "武吉免登") return "武吉免登 · 市中心";
    if (room.area.zh.includes("KLCC")) return `${room.area.zh} · 市中心`;
    return room.area.zh;
  }
  if (lang === "en" && room.location.en === "Kuala Lumpur") {
    if (room.area.en === "City Centre" || room.area.en === "Bukit Bintang") return "Bukit Bintang · City Centre";
    if (room.area.en.includes("KLCC")) return `${room.area.en} · City Centre`;
    return room.area.en;
  }
  return `${room.area[lang]} · ${room.location[lang]}`;
}

const c = {
  en: {
    rooms: "Rooms",
    services: "Services",
    about: "About",
    contact: "Contact",
    submit: "Submit inquiry",
    heroTag: "Malaysia, made easy",
    hero: (
      <>
        Stay Comfortably,
        <br />
        Travel Easily.
      </>
    ),
    heroText:
      "Comfortable stays and private travel services in Kuala Lumpur, Kota Kinabalu & Semporna.",
    explore: "Explore rooms",
    viewServices: "View services",
    find: "Find your place",
    stays: "Our Stays",
    selected: "Carefully selected homes in the best locations.",
    stayCount: "stays",
    guests: "Guests",
    bedrooms: "Bedrooms",
    beds: "Beds",
    viewRoom: "View room",
    travel: "Travel with a local",
    local: "Local Services",
    localSub: "Make your Malaysia trip easier with our local services.",
    start: "Start planning",
    plan: "Start Planning Your Malaysia Trip",
    planSub:
      "Share your travel plan with us. We will recommend suitable stays and local services.",
    steps: [
      ["Tell us your ideas", "Choose destinations and services you need."],
      [
        "We help you plan",
        "Get suggestions based on your trip and preferences.",
      ],
      [
        "Travel with ease",
        "Stays, transport and local experiences in one place.",
      ],
    ],
    advantages: [
      "Chinese-speaking support",
      "Real local stays",
      "Private cars and transfers",
    ],
    name: "How should we call you?",
    namePh: "Your name or nickname",
    contactLabel: "WeChat / WhatsApp",
    contactPh: "The easiest way to reach you",
    destination: "Where are you planning to go?",
    need: "Which services do you need?",
    needHint: "Select all that apply",
    time: "When are you leaving? (optional)",
    dateLabel: "Choose a date",
    monthLabel: "Choose a month",
    message: "Anything else you’d like us to know?",
    messagePh:
      "For example: 2 adults and 1 child, prefer somewhere near the sea, or need a private car…",
    advice: "Get Travel Advice",
    sending: "Sending…",
    thanks: "We’ve received your travel plan!",
    thanksSub:
      "We’ll contact you soon. You can also reach us directly on WeChat or WhatsApp.",
    again: "Send another request",
    error: "Something went wrong. Please try again.",
    footer:
      "Comfortable stays and private local travel services across Malaysia.",
  },
  zh: {
    rooms: "房源",
    services: "当地服务",
    about: "关于我们",
    contact: "联系我们",
    submit: "提交咨询",
    heroTag: "轻松畅游马来西亚",
    hero: (
      <>
        舒适入住，
        <br />
        自在旅行。
      </>
    ),
    heroText: "为你提供吉隆坡、亚庇与仙本那的舒适住宿及私人当地旅行服务。",
    explore: "浏览房源",
    viewServices: "查看服务",
    find: "寻找理想住处",
    stays: "精选住宿",
    selected: "用心挑选位置便利、舒适温暖的当地住处。",
    stayCount: "间房源",
    guests: "位客人",
    bedrooms: "间卧室",
    beds: "张床",
    viewRoom: "查看房源",
    travel: "与当地人一起旅行",
    local: "当地服务",
    localSub: "让我们的当地服务为你的马来西亚旅程带来更多便利。",
    start: "开始规划",
    plan: "开始规划你的马来西亚之旅",
    planSub:
      "简单告诉我们你想去哪里、需要什么就好，其他细节可以之后慢慢确认。",
    steps: [
      ["告诉我们你的想法", "选择目的地和需要的服务。"],
      ["我们帮你安排", "根据行程和需求提供合适建议。"],
      ["轻松开始旅程", "住宿、交通和当地体验可以一起安排。"],
    ],
    advantages: ["中文沟通", "当地真实房源", "可安排包车和接送"],
    name: "怎么称呼您？",
    namePh: "请输入您的名字或昵称",
    contactLabel: "微信 / WhatsApp",
    contactPh: "方便我们联系您的方式",
    destination: "您计划去哪里？",
    need: "您需要哪些服务？",
    needHint: "可多选",
    time: "什么时候出发？（选填）",
    dateLabel: "选择具体日期",
    monthLabel: "选择大概月份",
    message: "还有什么想告诉我们？",
    messagePh: "例如：2位成人+1个孩子，希望靠近海边，或者想安排包车……",
    advice: "获取旅行建议",
    sending: "正在发送…",
    thanks: "收到您的需求啦！",
    thanksSub: "我们会尽快联系您。您也可以直接添加微信或通过 WhatsApp 咨询。",
    again: "再次填写",
    error: "提交失败，请稍后再试。",
    footer: "马来西亚舒适住宿与私人当地旅行服务。",
  },
};
function Logo() {
  return (
    <a className="logo" href="#top">
      <span className="logo-mark">⌂</span>
      <span>
        <b>MAD MAX</b>
        <small>MALAYSIA STAY</small>
      </span>
    </a>
  );
}

function RoomCarousel({
  room,
  lang,
  onOpen,
}: {
  room: Room;
  lang: Lang;
  onOpen: () => void;
}) {
  const [index, setIndex] = useState(0);
  const images = room.images?.length ? room.images : [room.image];
  const move = (direction: number) =>
    setIndex(
      (current) => (current + direction + images.length) % images.length,
    );
  return (
    <div className="card-carousel">
      <button
        type="button"
        className="card-carousel-open"
        onClick={onOpen}
        aria-label={room.name[lang]}
      >
        <img src={images[index]} alt={`${room.name[lang]} ${index + 1}`} loading="lazy" decoding="async" />
      </button>
      <span className="location-pill">{room.location[lang]}</span>
      {images.length > 1 && (
        <>
          <button
            className="carousel-arrow prev"
            onClick={() => move(-1)}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            className="carousel-arrow next"
            onClick={() => move(1)}
            aria-label="Next photo"
          >
            ›
          </button>
          <div className="carousel-dots">
            {images.map((_, i) => (
              <button
                key={i}
                className={i === index ? "active" : ""}
                onClick={() => setIndex(i)}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
          <span className="carousel-count">
            {index + 1}/{images.length}
          </span>
        </>
      )}
    </div>
  );
}

type RoomModalTab = "intro" | "amenities" | "stay" | "nearby";

export function RoomDetailModal({
  room,
  lang,
  onClose,
  initialTab = "intro",
}: {
  room: Room;
  lang: Lang;
  onClose: () => void;
  initialTab?: RoomModalTab;
}) {
  const [photo, setPhoto] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [photoZoomed, setPhotoZoomed] = useState(false);
  const [tab, setTab] = useState<RoomModalTab>(initialTab);
  const touchStartX = useRef<number | null>(null);
  const images = room.images?.length ? room.images : [room.image];
  const space = room.spaceConfig as (Room["spaceConfig"] & Record<string, any>) | undefined;
  const displayedPrice = roomPriceDisplay(room, lang);
  const priceNote = room.description[lang] ? space?.priceNote || (lang === "zh" ? "价格随入住日期调整" : "Price varies by stay date") : "";
  const coreAmenityKeys = ["High-speed WiFi", "Air Conditioning", "Fully Equipped Kitchen", "Washer"];
  const coreAmenities = coreAmenityKeys
    .map((key) => room.amenities.find((item) => item.name.en === key))
    .filter((item): item is Room["amenities"][number] => Boolean(item));
  const amenityName = (name: Room["amenities"][number]["name"]) => {
    if (lang === "zh" && name.zh === "设备齐全的厨房") return "厨房";
    if (lang === "en" && name.en === "Fully Equipped Kitchen") return "Kitchen";
    return name[lang];
  };
  const move = (direction: number) =>
    setPhoto((current) => (current + direction + images.length) % images.length);
  const openGallery = (index = photo) => {
    setPhoto(index);
    setPhotoZoomed(false);
    setGalleryOpen(true);
  };
  const openGalleryFromEvent = (event: MouseEvent, index = photo) => {
    event.preventDefault();
    event.stopPropagation();
    openGallery(index);
  };
  const closeGallery = () => {
    setPhotoZoomed(false);
    setGalleryOpen(false);
  };
  useEffect(() => {
    if (!galleryOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" && event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.key === "Escape") {
        if (photoZoomed) setPhotoZoomed(false);
        else closeGallery();
      }
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [galleryOpen, photoZoomed, images.length]);
  const tabs: { key: RoomModalTab; zh: string; en: string }[] = [
    { key: "intro", zh: "房型信息", en: "Room info" },
    { key: "amenities", zh: "设施", en: "Amenities" },
    { key: "stay", zh: "入住须知", en: "Stay info" },
    { key: "nearby", zh: "周边", en: "Nearby" },
  ];
  useEffect(() => setTab(initialTab), [initialTab]);

  return (
    <div className="room-detail-modal" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <div className="room-modal-shell" onMouseDown={(event) => event.stopPropagation()}>
        <button className="room-modal-close" type="button" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className={`room-modal-gallery${images.length > 1 ? "" : " single"}`}>
          <div className="room-modal-main-photo">
            <img key={images[photo]} src={images[photo]} alt={`${room.name[lang]} ${photo + 1}`} />
            {images.length > 1 && (
              <>
                <button type="button" className="prev" onClick={() => move(-1)} aria-label="Previous photo">‹</button>
                <button type="button" className="next" onClick={() => move(1)} aria-label="Next photo">›</button>
                <button type="button" className="room-modal-count" onMouseDown={(event) => openGalleryFromEvent(event)} onClick={(event) => openGalleryFromEvent(event)} aria-label={lang === "zh" ? `查看全部 ${images.length} 张图片` : `View all ${images.length} photos`}>
                  <span>▦</span>{lang === "zh" ? "查看全部" : "View all"}
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="room-modal-thumbs">
              {images.slice(0, 5).map((image, index) => (
                <button
                  type="button"
                  key={image}
                  className={photo === index ? "active" : ""}
                  onMouseDown={(event) => index === 4 && images.length > 5 ? openGalleryFromEvent(event, index) : undefined}
                  onClick={(event) => index === 4 && images.length > 5 ? openGalleryFromEvent(event, index) : setPhoto(index)}
                  aria-label={index === 4 && images.length > 5 ? (lang === "zh" ? `查看全部 ${images.length} 张图片` : `View all ${images.length} photos`) : `Photo ${index + 1}`}
                >
                  <img src={image} alt="" />
                  {index === 4 && images.length > 5 && <span><b>+{images.length - 5}</b><small>{lang === "zh" ? "全部照片" : "All photos"}</small></span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <section className="room-modal-info">
          <p className="eyebrow">MAD MAX · MALAYSIA STAY</p>
          <h2>{room.name[lang]}</h2>
          <div className="room-modal-area room-modal-title-location"><RoomIcon name="pin" /><b>{modalLocationLabel(room, lang)}</b></div>
          <div className="room-modal-price">
            {displayedPrice.suffix ? (
              <>
                <strong>{displayedPrice.price}</strong>
                <b>{displayedPrice.suffix}</b>
                {priceNote ? <small>{priceNote}</small> : null}
              </>
            ) : (
              <strong>{displayedPrice.price}</strong>
            )}
          </div>
          <div className="room-modal-tabs" role="tablist">
            {tabs.map((item) => (
              <button
                type="button"
                key={item.key}
                className={tab === item.key ? "active" : ""}
                onClick={() => setTab(item.key)}
              >
                {item[lang]}
              </button>
            ))}
          </div>
          <div className="room-modal-tab-content">
            {tab === "intro" && (
              <>
                <div className="room-modal-space"><h3>{lang === "zh" ? "空间配置" : "Space configuration"}</h3><div className="room-modal-space-grid">
                  {room.spaceConfig?.layout ? <div><i><RoomIcon name="layout" /></i><b>{lang === "zh" ? "户型" : "Layout"}</b><strong>{room.spaceConfig.layout}</strong></div> : null}
                  {room.spaceConfig?.area ? <div><i><RoomIcon name="area" /></i><b>{lang === "zh" ? "房屋面积" : "Area"}</b><strong>{room.spaceConfig.area}</strong></div> : null}
                  {(room.spaceConfig?.recommendedGuests || room.spaceConfig?.maxGuests) ? <div><i><RoomIcon name="guests" /></i><b>{lang === "zh" ? "入住人数" : "Guests"}</b><strong>{formatGuestPhrase(room.spaceConfig, lang)}</strong></div> : null}
                  {room.spaceConfig?.floor ? <div><i><RoomIcon name="floor" /></i><b>{lang === "zh" ? "所在楼层" : "Floor"}</b><strong>{room.spaceConfig.floor}</strong></div> : null}
                </div></div>
                {room.sleepingArrangements?.length ? <div className="room-modal-sleeping"><h3>{lang === "zh" ? "睡眠安排" : "Sleeping arrangements"}</h3>{room.sleepingArrangements.map((item, i) => <div className="room-modal-sleep-row" key={`${item.space}-${i}`}><i><RoomIcon name={item.space.includes("客厅") ? "sofa" : "bed"} /></i><p><b>{item.space}</b><strong>{item.width}m × {item.length}m {item.bedType} × {item.quantity}</strong></p><span>{lang === "zh" ? `可睡 ${item.sleeps} 人` : `Sleeps ${item.sleeps}`}</span></div>)}</div> : null}
              </>
            )}
            {tab === "amenities" && (
              <div className="room-modal-all-amenities">
                {room.amenities.map((item) => <span key={item.name.en}><i>{item.icon}</i>{amenityName(item.name)}</span>)}
              </div>
            )}
            {tab === "stay" && (
              <div className="room-modal-stay">
                <div className="room-modal-stay-info">
                  <div><b>{lang === "zh" ? "入住时间" : "Check-in"}</b><span>{space?.checkInTime || (lang === "zh" ? "15:00 后" : "After 15:00")}</span></div>
                  <div><b>{lang === "zh" ? "退房时间" : "Check-out"}</b><span>{space?.checkOutTime || (lang === "zh" ? "11:00 前" : "Before 11:00")}</span></div>
                  <div><b>{lang === "zh" ? "最多入住" : "Guests"}</b><span>{space?.guestRule || (lang === "zh" ? `${room.guests} 位` : `Up to ${room.guests}`)}</span></div>
                  <div><b>{lang === "zh" ? "入住方式" : "Arrival"}</b><span>{space?.checkInMethod || (lang === "zh" ? "确认后发送入住说明" : "Instructions sent after confirmation")}</span></div>
                </div>
                <div className="room-modal-reminders">
                  <b>{lang === "zh" ? "入住提醒" : "A few reminders"}</b>
                  {(space?.reminders?.length ? space.reminders : [
                    { icon: "🚭", text: lang === "zh" ? "室内请勿吸烟" : "No smoking indoors" },
                    { icon: "🎉", text: lang === "zh" ? "请勿举办聚会" : "No parties" },
                    { icon: "🧹", text: lang === "zh" ? "请保持室内整洁" : "Please keep the home tidy" },
                  ]).map((item: { icon?: string; text: string }, index: number) => <span key={`${item.text}-${index}`}>{item.icon || "○"} {item.text}</span>)}
                </div>
              </div>
            )}
            {tab === "nearby" && (
              <>
                <div className="room-modal-nearby">
                  {room.nearbyPlaces.slice(0, 5).map((place) => (
                    <div key={place.name.en}><i>{place.icon}</i><p><b>{place.name[lang]}</b><small>{place.distance[lang]}</small></p></div>
                  ))}
                </div>
                {space?.nearbyNote ? <p className="room-modal-nearby-note">{space.nearbyNote}</p> : null}
              </>
            )}
          </div>
          <button className="button room-modal-cta" type="button" onClick={() => setInquiryOpen(true)}>{lang === "zh" ? "咨询入住" : "Ask about this stay"} →</button>
        </section>
      </div>
      {inquiryOpen && <InquiryModal kind="accommodation" title={room.name[lang]} maxGuests={room.guests} onClose={() => setInquiryOpen(false)} />}
      {galleryOpen && (
        <div className={`room-photo-viewer${photoZoomed ? " zoomed" : ""}`} role="dialog" aria-modal="true" onMouseDown={closeGallery}>
          <div onMouseDown={(event) => event.stopPropagation()}>
            <div className="room-photo-viewer-head">
              <button type="button" className="room-photo-viewer-back" onClick={closeGallery}>{lang === "zh" ? "← 返回房源" : "← Back to room"}</button>
              <div><span>{photo + 1} / {images.length}</span><button type="button" onClick={closeGallery} aria-label="Close gallery">×</button></div>
            </div>
            <div
              className="room-photo-viewer-main"
              onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
              onTouchEnd={(event) => {
                if (touchStartX.current === null) return;
                const delta = event.changedTouches[0].clientX - touchStartX.current;
                touchStartX.current = null;
                if (Math.abs(delta) > 42) move(delta > 0 ? -1 : 1);
              }}
            >
              <button type="button" className="prev" onClick={() => move(-1)} aria-label="Previous photo">‹</button>
              <img key={images[photo]} src={images[photo]} alt={`${room.name[lang]} ${photo + 1}`} onClick={() => setPhotoZoomed((value) => !value)} />
              <button type="button" className="next" onClick={() => move(1)} aria-label="Next photo">›</button>
            </div>
            <div className="room-photo-viewer-thumbs">
              {images.map((image, index) => (
                <button type="button" key={image} className={photo === index ? "active" : ""} onClick={() => setPhoto(index)} aria-label={`Photo ${index + 1}`}>
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function HomePage({ rooms, destinations = fallbackDestinations }: { rooms: Room[]; destinations?: DestinationRecord[] }) {
  const [lang, setLang] = useState<Lang>("zh"),
    [status, setStatus] = useState(""),
    [sent, setSent] = useState(false),
    [menu, setMenu] = useState(false),
    [layout, setLayout] = useState("all"),
    [selectedLocation, setSelectedLocation] = useState("all"),
    [timeMode, setTimeMode] = useState(""),
    [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  useEffect(() => {
    if (!selectedRoom) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setSelectedRoom(null);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", close);
    };
  }, [selectedRoom]);
  const t = c[lang];
  const configuredDestinationOptions = destinations
    .filter((destination) => destination.useForProperties && destination.status !== "hidden")
    .filter((destination) => !destination.onlyShowWithContent || rooms.some((room) => room.location.zh === destination.nameZh || room.location.en === destination.nameEn))
    .sort((a, b) => a.propertySort - b.propertySort || a.id - b.id);
  const configuredNames = new Set(configuredDestinationOptions.flatMap((destination) => [destination.nameZh, destination.nameEn].filter(Boolean)));
  const roomDerivedDestinations = [...new Map(rooms
    .filter((room) => !configuredNames.has(room.location.zh) && !configuredNames.has(room.location.en))
    .map((room) => [room.location.zh, room.location])).values()]
    .map((location, index): DestinationRecord => ({
      id: -(index + 1),
      slug: `room-destination-${index + 1}`,
      nameZh: location.zh,
      nameEn: location.en || location.zh,
      introZh: "",
      introEn: "",
      useForProperties: true,
      useForServices: false,
      propertySort: 1000 + index,
      serviceSort: 1000 + index,
      onlyShowWithContent: true,
      status: "visible",
      updatedAt: "",
    }));
  // A newly published room must remain discoverable even if destination settings
  // temporarily fail to load; never silently hide real inventory behind stale fallback data.
  const destinationOptions = [...configuredDestinationOptions, ...roomDerivedDestinations];
  const roomLayouts = [
    ...new Map(
      rooms.map((room) => [
        roomLayoutKey(room.bedrooms, room.bathrooms),
        {
          key: roomLayoutKey(room.bedrooms, room.bathrooms),
          bedrooms: room.bedrooms,
          bathrooms: room.bathrooms,
        },
      ]),
    ).values(),
  ].sort((a, b) => a.bedrooms - b.bedrooms || a.bathrooms - b.bathrooms);
  const destinationRooms =
    selectedLocation === "all"
      ? rooms
      : rooms.filter((room) => room.location.en === selectedLocation || room.location.zh === selectedLocation);
  const visibleRooms =
    layout === "all"
      ? destinationRooms
      : destinationRooms.filter(
          (room) => roomLayoutKey(room.bedrooms, room.bathrooms) === layout,
        );
  const availableLayouts = roomLayouts.filter((type) =>
    destinationRooms.some(
      (room) => roomLayoutKey(room.bedrooms, room.bathrooms) === type.key,
    ),
  );
  const selectLocation = (location: string) => {
    setSelectedLocation(location);
    setLayout("all");
  };
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(t.sending);
    const form = e.currentTarget,
      fd = new FormData(form);
    const body = {
      name: fd.get("name"),
      contact: fd.get("contact"),
      destinations: fd.getAll("destinations"),
      services: fd.getAll("services"),
      travelTime: fd.get("travelTime"),
      message: fd.get("message"),
    };
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      form.reset();
      setTimeMode("");
      setStatus("");
      setSent(true);
    } else setStatus(t.error);
  }
  return (
    <>
      <header id="top">
        <Logo />
        <button className="menu-btn" onClick={() => setMenu(!menu)} aria-label={menu ? "关闭菜单" : "打开菜单"}>
          {menu ? "关闭" : "☰ 菜单"}
        </button>
        <nav className={menu ? "open" : ""}>
          <a href="#stays">{t.rooms}</a>
          <ServiceMenu lang={lang} />
          <a href="/about">{t.about}</a>
          <a href="#contact">{t.contact}</a>
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
          <a className="button header-cta" href="#contact">
            {t.submit}
          </a>
        </div>
      </header>
      <main>
        <section className="hero">
          <img
            src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1800&q=90"
            srcSet="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=760&q=76 760w, https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=82 1200w, https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1800&q=88 1800w"
            sizes="100vw"
            alt="Warm Malaysian apartment"
          />
          <div className="hero-copy">
            <p className="eyebrow">{t.heroTag}</p>
            <h1>{t.hero}</h1>
            <p>{t.heroText}</p>
            <div className="hero-actions">
              <a className="button" href="#stays">
                {t.explore}
              </a>
              <a className="button outline" href="/services">
                {t.viewServices}
              </a>
            </div>
          </div>
        </section>
        <section id="stays" className="section stays">
          <div className="section-heading">
            <p className="eyebrow">{t.find}</p>
            <h2>{t.stays}</h2>
            <p>{t.selected}</p>
          </div>
          <div className="stay-filters">
            <div className="filter-row">
              <strong>{lang === "zh" ? "目的地" : "Destination"}</strong>
              <MobileScrollHint className="destination-filter-scroll">
              <div className="filter-options">
                {[
                  {
                    key: "all",
                    label: lang === "zh" ? "全部" : "All",
                    count: rooms.length,
                  },
                  ...destinationOptions.map((destination) => ({
                    key: destination.nameEn || destination.nameZh,
                    label: lang === "zh" ? destination.nameZh : destination.nameEn || destination.nameZh,
                    count: rooms.filter((r) => r.location.en === destination.nameEn || r.location.zh === destination.nameZh)
                      .length,
                  })),
                ].map((option) => (
                  <button
                    className={selectedLocation === option.key ? "active" : ""}
                    onClick={() => selectLocation(option.key)}
                    key={option.key}
                  >
                    {option.label} <small>{option.count}</small>
                  </button>
                ))}
              </div>
              </MobileScrollHint>
            </div>
            <div className="filter-row">
              <strong>{lang === "zh" ? "房型" : "Room type"}</strong>
              <div className="filter-options">
                {[
                  {
                    key: "all",
                    label: lang === "zh" ? "全部房型" : "All room types",
                    count: destinationRooms.length,
                  },
                  ...availableLayouts.map((type) => ({
                    key: type.key,
                    label: roomLayoutLabel(type.bedrooms, type.bathrooms, lang),
                    count: destinationRooms.filter(
                      (room) =>
                        roomLayoutKey(room.bedrooms, room.bathrooms) ===
                        type.key,
                    ).length,
                  })),
                ].map((option) => (
                  <button
                    className={layout === option.key ? "active" : ""}
                    onClick={() => setLayout(option.key)}
                    key={option.key}
                  >
                    {option.label} <small>{option.count}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="stay-results-heading">
            <h3>
              {selectedLocation === "all"
                ? lang === "zh"
                  ? "全部房源"
                  : "All stays"
                : `${rooms.find((r) => r.location.en === selectedLocation || r.location.zh === selectedLocation)?.location[lang] || selectedLocation} · ${destinationRooms.length} ${t.stayCount}`}
            </h3>
            <span>{lang === "zh" ? "默认排序 ▾" : "Default order ▾"}</span>
          </div>
          <div className="room-grid stay-results-grid">
            {visibleRooms.map((room) => (
              <article className="room-card" key={room.id}>
                <RoomCarousel room={room} lang={lang} onOpen={() => setSelectedRoom(room)} />
                <div className="card-body">
                  <h4>{room.name[lang]}</h4>
                  <div className="room-info-row">
                    <div className="room-meta">
                      <span>
                        {room.guests} {t.guests}
                      </span>
                      <span>
                        {room.bedrooms} {t.bedrooms}
                      </span>
                      <span>
                        {room.beds} {t.beds}
                      </span>
                    </div>
                  </div>
                  <div className="room-price">{(() => {
                    const displayed = roomPriceDisplay(room, lang);
                    return `${displayed.price}${displayed.suffix}`;
                  })()}</div>
                  <button className="text-link" type="button" onClick={() => setSelectedRoom(room)}>
                    {t.viewRoom}
                    <span>↗</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section id="services" className="section services">
          <div className="section-heading">
            <p className="eyebrow">{t.travel}</p>
            <h2>{t.local}</h2>
            <p>{t.localSub}</p>
          </div>
          <div className="service-grid">
            {services.map((s, i) => (
              <article className="service-card" key={s.name.en}>
                <div className="service-image">
                  <img src={s.image} alt={s.name[lang]} />
                  <span>{["✈", "↗", "≈", "◎"][i]}</span>
                </div>
                <div>
                  <h3>{s.name[lang]}</h3>
                  <p>{s.description[lang]}</p>
                  <a href="#contact">→</a>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section id="about" className="section about-section">
          <div className="section-heading">
            <p className="eyebrow">
              {lang === "zh" ? "关于 MAD MAX" : "About MAD MAX"}
            </p>
            <h2>
              {lang === "zh"
                ? "像当地朋友一样帮你安排"
                : "Hosted like a local friend"}
            </h2>
            <p>
              {lang === "zh"
                ? "我们专注马来西亚住宿、出行与当地体验，用简单可靠的方式帮你把旅程安排顺。"
                : "We focus on stays, transport and local experiences across Malaysia, keeping planning personal and easy."}
            </p>
          </div>
        </section>
        <section id="contact" className="inquiry inquiry-light">
          <div className="inquiry-intro">
            <p className="eyebrow">{t.start}</p>
            <h2>{t.plan}</h2>
            <p>{t.planSub}</p>
            <div className="planning-welcome">
              <b>{lang === "zh" ? "先聊聊你的想法" : "Start with the basics"}</b>
              <p>
                {lang === "zh"
                  ? "不用一次准备完整行程，我们会根据你的需求继续和你确认。"
                  : "You do not need a complete itinerary. We can confirm the details together afterwards."}
              </p>
            </div>
            <div className="trust-list">
              {t.advantages.map((a) => (
                <span key={a}>✓ {a}</span>
              ))}
            </div>
          </div>
          {sent ? (
            <div className="inquiry-success">
              <span className="success-mark">✓</span>
              <h3>{t.thanks}</h3>
              <p>{t.thanksSub}</p>
              <div className="direct-contact">
                <div className="qr-placeholder">
                  <b>微信</b>
                  <small>二维码</small>
                </div>
                <div>
                  <a className="button" href="#contact">
                    微信咨询
                  </a>
                  <a className="button outline" href="#contact">
                    WhatsApp
                  </a>
                </div>
              </div>
              <button className="text-reset" onClick={() => setSent(false)}>
                {t.again}
              </button>
            </div>
          ) : (
            <form className="light-form" onSubmit={submit}>
              <div className="form-grid">
                <label>
                  {t.name}
                  <input required name="name" placeholder={t.namePh} />
                </label>
                <label>
                  {t.contactLabel}
                  <input required name="contact" placeholder={t.contactPh} />
                </label>
              </div>
              <fieldset>
                <legend>{t.destination}</legend>
                <div className="choice-grid destinations">
                  {[...destinationOptions.map((destination) => ({label: lang==="zh"?`${destination.nameZh} ${destination.nameEn}`:destination.nameEn||destination.nameZh,value: destination.nameEn||destination.nameZh})),{label: lang==="zh"?"还没决定":"Not decided yet",value:"Not decided yet"}].map((destination) => (
                    <label key={destination.value}>
                      <input
                        type="checkbox"
                        name="destinations"
                        value={destination.value}
                      />
                      <span>{destination.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>
                  {t.need} <small>{t.needHint}</small>
                </legend>
                <div className="choice-grid">
                  {serviceOptions[lang].map((n, i) => (
                    <label key={n}>
                      <input
                        type="checkbox"
                        name="services"
                        value={serviceOptions.en[i]}
                      />
                      <span>{n}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="optional-time">
                <legend>{t.time}</legend>
                <div className="choice-grid time-options">
                  {timeOptions[lang].map((n, i) => (
                    <label key={n}>
                      <input
                        type="radio"
                        name="travelTimeMode"
                        value={timeOptions.en[i]}
                        checked={timeMode === timeOptions.en[i]}
                        onChange={() => setTimeMode(timeOptions.en[i])}
                      />
                      <span>{n}</span>
                    </label>
                  ))}
                </div>
                {timeMode === timeOptions.en[0] && (
                  <label className="time-detail">
                    {t.dateLabel}
                    <DateInput name="travelTime" label={t.dateLabel} placeholder={t.dateLabel} />
                  </label>
                )}
                {timeMode === timeOptions.en[1] && (
                  <label className="time-detail">
                    {t.monthLabel}
                    <input type="month" name="travelTime" />
                  </label>
                )}
                {timeMode === timeOptions.en[2] && (
                  <input type="hidden" name="travelTime" value={timeOptions.en[2]} />
                )}
              </fieldset>
              <label>
                {t.message}
                <textarea name="message" rows={4} placeholder={t.messagePh} />
              </label>
              <button className="button submit" type="submit">
                {t.advice}
                <span>↗</span>
              </button>
              <p className="form-status">{status}</p>
            </form>
          )}
        </section>
      </main>
      {selectedRoom && (
        <RoomDetailModal key={selectedRoom.id} room={selectedRoom} lang={lang} onClose={() => setSelectedRoom(null)} />
      )}
      <footer>
        <Logo />
        <p>{t.footer}</p>
        <div>
          <a href="#stays">{t.rooms}</a>
          <a href="/services">{t.services}</a>
          <a href="/about">{t.about}</a>
          <a href="#contact">{t.contact}</a>
        </div>
        <small>© 2026 MAD MAX Malaysia Stay</small>
      </footer>
    </>
  );
}
