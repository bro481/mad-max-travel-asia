"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ServiceMenu } from "../service-menu";
import { bundles, products, type PickBundle, type PickProduct, type PriceType } from "./data";

type Lang = "zh" | "en";
const categories = [
  { key: "all", zh: "全部", en: "All" },
  { key: "drink", zh: "咖啡茶饮", en: "Coffee & Tea" },
  { key: "snack", zh: "零食", en: "Snacks" },
  { key: "gift", zh: "伴手礼", en: "Souvenirs" },
  { key: "bundle", zh: "精选组合", en: "Curated Sets" },
];

const copy = {
  zh: {
    rooms: "房源", about: "关于我们", contact: "联系我们", submit: "提交咨询",
    eyebrow: "MAD MAX · MALAYSIA PICKS", title: "马来西亚好物", subtitle: "带一点当地味道回家。",
    desc: "我们在当地帮你挑选值得带走、适合送人，也值得再次回购的马来西亚好物。",
    explore: "探索好物", quality: [["当地精选", "帮你筛掉不好选的"], ["价格透明", "商品价格提前确认"], ["旅行可取 · 回国可寄", "根据你的情况安排"]],
    detail: "查看详情", bundleTitle: "懒得挑？我们已经搭配好了", includes: "包含",
    priceNote: "页面价格为参考价，实际价格及库存以咨询确认为准。",
    deliveryTitle: "怎么拿到你的好物？",
    travelBuyer: "还在马来西亚？", travelBuyerDesc: "提前告诉我们想要什么，可以结合住宿、接送或行程一起交给你。", travelBuyerLink: "旅途中领取",
    homeBuyer: "已经回国？", homeBuyerDesc: "也没关系，告诉我们想要的商品和数量，我们再帮你确认寄送方式和费用。", homeBuyerLink: "咨询寄送",
    deliveryNote: "单独购买或其他交付方式，可咨询确认。食品跨境寄送以目的地及承运要求为准。",
    ctaTitle: "不知道买什么？告诉我们送给谁。", ctaDesc: "自己吃、送家人、送朋友还是办公室分享，我们可以直接帮你搭一套。", consult: "帮我挑一套", ctaNote: "人工确认库存与领取 / 寄送方式",
    specs: "规格", audience: "适合", delivery: "怎么拿？", buy: "咨询这个好物", preorder: "可预订", available: "可预订",
  },
  en: {
    rooms: "Rooms", about: "About", contact: "Contact", submit: "Submit inquiry",
    eyebrow: "MAD MAX · MALAYSIA PICKS", title: "Malaysia Picks", subtitle: "Bring a little local flavour home.",
    desc: "We select Malaysian favourites worth taking home, sharing as gifts and ordering again.",
    explore: "Explore our picks", quality: [["Local selection", "We make choosing easier"], ["Clear pricing", "Confirm prices before ordering"], ["Collect or ship", "Arranged around your situation"]],
    detail: "View details", bundleTitle: "Rather not choose? We made the sets", includes: "Includes",
    priceNote: "Prices shown are references; final price and stock are confirmed by inquiry.",
    deliveryTitle: "How would you like to receive your picks?",
    travelBuyer: "Travelling in Malaysia", travelBuyerDesc: "Choose ahead and arrange collection with your stay, transfer or private-car itinerary.", travelBuyerLink: "Collect during your trip",
    homeBuyer: "Already back home", homeBuyerDesc: "Want to reorder? Tell us the products and quantity, and we will confirm shipping options, cost and timing.", homeBuyerLink: "Ask about shipping",
    deliveryNote: "Standalone orders and other arrangements can be discussed. Cross-border food shipping depends on destination and carrier requirements.",
    ctaTitle: "Not sure what to choose? Tell us who it is for.", ctaDesc: "For yourself, parents, friends or the office—we can put together the right set.", consult: "Build me a set", ctaNote: "Stock, collection and shipping are confirmed personally",
    specs: "Specification", audience: "Best for", delivery: "How to get it", buy: "Ask about this pick", preorder: "Available to order", available: "Available to order",
  },
};

function Price({ price, type, lang }: { price: number; type: PriceType; lang: Lang }) {
  if (type === "hidden") return null;
  if (type === "reference") return <span>{lang === "zh" ? "参考 " : "Approx. "}<strong>¥{price}</strong></span>;
  return <span><strong>¥{price}</strong>{type === "starting" && <small>{lang === "zh" ? " 起" : " from"}</small>}</span>;
}

export default function PicksPage() {
  const [lang, setLang] = useState<Lang>("zh");
  const [menu, setMenu] = useState(false);
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<PickProduct | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<PickBundle | null>(null);
  const [photo, setPhoto] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const lastWheelAt = useRef(0);
  const t = copy[lang];
  const l = lang === "zh" ? "Zh" : "En";
  const items = useMemo(() => products.filter((item) => item.visible && (category === "all" || item.category === category)).sort((a, b) => a.sortOrder - b.sortOrder), [category]);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setSelected(null); setSelectedBundle(null); } };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const openProduct = (item: PickProduct) => { setSelected(item); setPhoto(0); };
  const openBundle = (item: PickBundle) => { setSelectedBundle(item); setPhoto(0); };
  const changePhoto = (direction: number) => {
    const imageCount = selected?.images.length ?? selectedBundle?.images.length ?? 0;
    if (imageCount < 2) return;
    setPhoto((current) => (current + direction + imageCount) % imageCount);
  };
  const audience = selected?.[`audience${l}`].replace(/[、，,]/g, " · ");

  return <>
    <header>
      <a className="logo" href="/"><span className="logo-mark">⌂</span><span><b>MAD MAX</b><small>MALAYSIA STAY</small></span></a>
      <button className="menu-btn" aria-label="Menu" onClick={() => setMenu(!menu)}>{menu ? "×" : "☰"}</button>
      <nav className={menu ? "open" : ""}><a href="/#stays">{t.rooms}</a><ServiceMenu lang={lang} active /><a href="/about">{t.about}</a><a href="/#contact">{t.contact}</a><div className="language-switch mobile-language"><button className={lang === "zh" ? "active" : ""} onClick={() => setLang("zh")}>中文</button><i /><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>English</button></div></nav>
      <div className="header-right"><div className="language-switch desktop-language"><button className={lang === "zh" ? "active" : ""} onClick={() => setLang("zh")}>中文</button><i /><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>English</button></div><a className="button header-cta" href="/#contact">{t.submit}</a></div>
    </header>

    <main className="sub-service-page picks-page">
      <section className="picks-hero">
        <div className="picks-hero-copy">
          <p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><h2>{t.subtitle}</h2><p>{t.desc}</p>
          <div className="picks-hero-benefits">{t.quality.map((item, index) => <article key={item[0]}><i>{["◇", "□", "⌑"][index]}</i><div><b>{item[0]}</b><span>{item[1]}</span></div></article>)}</div>
        </div>
        <div className="picks-hero-visual"><img src="/malaysia-picks-hero-lifestyle-v2.png" alt={t.subtitle} /></div>
      </section>

      <section className="picks-products-section">
        <div className="picks-section-heading"><span /><h2>{category === "bundle" ? t.bundleTitle : t.explore}</h2><span /></div>
        <div className="pick-tabs">{categories.map((item) => <button className={item.key === category ? "active" : ""} key={item.key} onClick={() => setCategory(item.key)}>{item[lang === "zh" ? "zh" : "en"]}</button>)}</div>
        <div className="picks-product-grid picks-catalog-window" key={category}>{category === "bundle" ? bundles.filter((item) => item.visible).sort((a, b) => a.sortOrder - b.sortOrder).map((item) => <button className="picks-product-card picks-combo-card" key={item.id} onClick={() => openBundle(item)}>
          <div className="picks-product-image"><img src={item.bundleImage} alt={item[`bundleName${l}`]} /><span>{item[`scenario${l}`]}</span></div>
          <div className="picks-product-body"><h3>{item[`bundleName${l}`]}</h3><p>{item[`description${l}`]}</p><small>{item[`includedProducts${l}`].join(" · ")}</small><div><span><strong>¥{item.price}</strong><small>{lang === "zh" ? " 起" : " from"}</small></span><b>{lang === "zh" ? "查看组合" : "View set"} →</b></div></div>
        </button>) : items.map((item) => <button className="picks-product-card" key={item.id} onClick={() => openProduct(item)}>
          <div className="picks-product-image"><img src={item.images[0]} alt={item[`name${l}`]} /><span>{item[`tag${l}`]}</span></div>
          <div className="picks-product-body"><h3>{item[`name${l}`]}</h3><p>{item[`description${l}`]}</p><div><Price price={item.price} type={item.priceType} lang={lang} /><b>{t.detail} →</b></div></div>
        </button>)}</div>
        <p className="picks-price-note">{t.priceNote}</p>
      </section>

      <section className="picks-delivery-section">
        <div className="picks-delivery-main">
          <h2>{t.deliveryTitle}</h2>
          <div className="picks-delivery-options">
            <article><i>⌖</i><div><h3>{t.travelBuyer}</h3><p>{t.travelBuyerDesc}</p><a href="/#contact">{t.travelBuyerLink} →</a></div></article>
            <article><i>⌂</i><div><h3>{t.homeBuyer}</h3><p>{t.homeBuyerDesc}</p><small>{lang === "zh" ? "*跨境寄送以目的地及实际承运要求为准。" : "*Cross-border shipping depends on destination and carrier requirements."}</small><a href="/#contact">{t.homeBuyerLink} →</a></div></article>
          </div>
        </div>
        <div className="picks-delivery-footer"><div><b>{t.ctaTitle}</b><span>{t.ctaDesc}</span></div><a href="/#contact">{t.consult} →</a></div>
      </section>
    </main>

    {selected && <div className="picks-modal" role="dialog" aria-modal="true" aria-label={selected[`name${l}`]} onClick={() => setSelected(null)}>
      <div onClick={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={() => setSelected(null)}>×</button>
        <div className="picks-modal-gallery">
          <div className="picks-modal-gallery-main" onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => { if (touchStartX.current === null) return; const distance = event.changedTouches[0].clientX - touchStartX.current; if (Math.abs(distance) > 42) changePhoto(distance < 0 ? 1 : -1); touchStartX.current = null; }} onWheel={(event) => { const now = Date.now(); if (Math.abs(event.deltaX) > 32 && Math.abs(event.deltaX) > Math.abs(event.deltaY) && now - lastWheelAt.current > 350) { lastWheelAt.current = now; changePhoto(event.deltaX > 0 ? 1 : -1); } }}>
            <img key={`${selected.id}-${photo}`} src={selected.images[photo]} alt={`${selected[`name${l}`]} ${photo + 1}`} />
            {selected.images.length > 1 && <><button aria-label={lang === "zh" ? "上一张图片" : "Previous image"} onClick={() => changePhoto(-1)}>‹</button><button aria-label={lang === "zh" ? "下一张图片" : "Next image"} onClick={() => changePhoto(1)}>›</button><span>{photo + 1} / {selected.images.length}</span></>}
          </div>
        </div>
        <div className="picks-modal-info"><span>{selected[`tag${l}`]}</span><h2>{selected[`name${l}`]}</h2><p>{selected[`description${l}`]}</p><div className="picks-modal-price"><Price price={selected.price} type="starting" lang={lang} /><small>{selected.stockStatus === "preorder" ? t.preorder : t.available}</small></div>
          <dl className="picks-modal-summary"><div><dt>{t.specs}</dt><dd>{selected[`quantity${l}`]}</dd></div><div><dt>{t.audience}</dt><dd>{audience}</dd></div><div><dt>{t.delivery}</dt><dd>{lang === "zh" ? "旅途中可结合住宿、接送或行程交付；已经回国也可以咨询寄送。" : "Collect during your stay, transfer or itinerary; shipping can also be discussed after you return home."}</dd></div></dl>
          <p className="picks-modal-gift"><b>🎁 {lang === "zh" ? "需要送人？" : "Giving it as a gift?"}</b>{lang === "zh" ? " 可以提前告诉我们是否需要礼袋。" : " Tell us in advance if you would like a gift bag."}</p>
          <a className="button" href="/#contact">{t.buy} →</a>
          <small className="picks-modal-confirm">{lang === "zh" ? "人工确认库存、实际价格与领取 / 寄送方式" : "Stock, final price, collection and shipping are confirmed personally"}</small>
        </div>
      </div>
    </div>}

    {selectedBundle && <div className="picks-modal" role="dialog" aria-modal="true" aria-label={selectedBundle[`bundleName${l}`]} onClick={() => setSelectedBundle(null)}>
      <div onClick={(event) => event.stopPropagation()}><button className="modal-close" aria-label="Close" onClick={() => setSelectedBundle(null)}>×</button>
        <div className="picks-modal-gallery"><div className="picks-modal-gallery-main" onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => { if (touchStartX.current === null) return; const distance = event.changedTouches[0].clientX - touchStartX.current; if (Math.abs(distance) > 42) changePhoto(distance < 0 ? 1 : -1); touchStartX.current = null; }} onWheel={(event) => { const now = Date.now(); if (Math.abs(event.deltaX) > 32 && Math.abs(event.deltaX) > Math.abs(event.deltaY) && now - lastWheelAt.current > 350) { lastWheelAt.current = now; changePhoto(event.deltaX > 0 ? 1 : -1); } }}>
          <img key={`${selectedBundle.id}-${photo}`} src={selectedBundle.images[photo]} alt={`${selectedBundle[`bundleName${l}`]} ${photo + 1}`} />
          {selectedBundle.images.length > 1 && <><button aria-label={lang === "zh" ? "上一张图片" : "Previous image"} onClick={() => changePhoto(-1)}>‹</button><button aria-label={lang === "zh" ? "下一张图片" : "Next image"} onClick={() => changePhoto(1)}>›</button><span>{photo + 1} / {selectedBundle.images.length}</span></>}
        </div></div>
        <div className="picks-modal-info picks-bundle-modal-info"><span>{selectedBundle[`scenario${l}`]}</span><h2>{selectedBundle[`bundleName${l}`]}</h2><p>{selectedBundle[`description${l}`]}</p><div className="picks-modal-price"><span><strong>¥{selectedBundle.price}</strong><small>{lang === "zh" ? " 起" : " from"}</small></span><small>{t.available}</small></div>
          <section className="picks-bundle-contents"><h3>{lang === "zh" ? "这套有什么" : "What is included"}</h3><ul>{selectedBundle[`includedProducts${l}`].map((item) => <li key={item}><span>{item}</span><b>× 1</b></li>)}</ul></section>
          <dl className="picks-modal-summary"><div><dt>{t.audience}</dt><dd>{selectedBundle[`scenario${l}`]} · {lang === "zh" ? "带回家分享" : "Sharing at home"}</dd></div><div><dt>{t.delivery}</dt><dd>{lang === "zh" ? "马来西亚旅途中可结合住宿、接送或行程领取；回国后可咨询寄送。" : "Collect during your Malaysia trip with a stay, transfer or itinerary; shipping can be discussed after returning home."}</dd></div></dl>
          <p className="picks-bundle-note">{lang === "zh" ? "具体品牌、规格和库存以实际确认为准。" : "Brands, specifications and stock are subject to confirmation."}</p>
          <a className="button" href="/#contact">{lang === "zh" ? "咨询这套" : "Ask about this set"} →</a>
          <small className="picks-modal-confirm">{lang === "zh" ? "人工确认库存、实际价格与领取 / 寄送方式" : "Stock, final price, collection and shipping are confirmed personally"}</small>
        </div>
      </div>
    </div>}

    <footer><a className="logo" href="/"><span className="logo-mark">⌂</span><span><b>MAD MAX</b><small>MALAYSIA STAY</small></span></a><div><a href="/#stays">{t.rooms}</a><a href="/services">{lang === "zh" ? "当地服务" : "Local Services"}</a><a href="/#contact">{t.contact}</a></div><small>© 2026 MAD MAX Malaysia Stay</small></footer>
  </>;
}
