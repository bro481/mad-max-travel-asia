"use client";

import { useMemo, useState } from "react";
import { ServiceMenu } from "../service-menu";
import { InquiryModal } from "../components/inquiry-modal";
import type { TravelPackage } from "../../db/packages";

type Lang = "zh" | "en";

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
  return new Intl.NumberFormat("en-MY").format(value);
}

export function PackagesPage({ packages }: { packages: TravelPackage[] }) {
  const [lang, setLang] = useState<Lang>("zh");
  const [menu, setMenu] = useState(false);
  const [activeDays, setActiveDays] = useState(() => {
    const first = packages.find((item) => item.status === "published") || packages[0];
    return first?.days || 4;
  });
  const [selected, setSelected] = useState<TravelPackage | null>(null);
  const [inquiry, setInquiry] = useState<TravelPackage | null>(null);
  const [customInquiry, setCustomInquiry] = useState(false);
  const zh = lang === "zh";
  const visiblePackages = packages.filter((item) => item.status === "published");
  const days = useMemo(() => {
    const current = Array.from(new Set(visiblePackages.map((item) => item.days))).sort((a, b) => a - b);
    return current.length ? current : [4, 5, 6, 7, 8];
  }, [visiblePackages]);
  const current = visiblePackages.filter((item) => item.days === activeDays);

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

      <main className="packages-page">
        <section className="packages-hero">
          <img
            src="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1900&q=90"
            alt="Malaysia island package"
          />
          <div>
            <p className="eyebrow">MALAYSIA TRAVEL PACKAGE</p>
            <h1>{zh ? "省心套餐" : "Travel Packages"}</h1>
            <p>{zh ? "行程已经为你规划好，选个天数，出发更简单。" : "Pick the number of days. We make the rest feel easy."}</p>
          </div>
          <span className="package-script">Less Planning<br />More Exploring</span>
        </section>

        <section className="package-tabs-wrap">
          <div className="package-tabs-heading">
            <span />
            <h2>{zh ? "想玩几天？" : "How many days?"}</h2>
          </div>
          <div className="package-day-tabs" role="tablist" aria-label={zh ? "选择套餐天数" : "Choose package days"}>
            {days.map((day) => (
              <button
                key={day}
                className={activeDays === day ? "active" : ""}
                type="button"
                onClick={() => setActiveDays(day)}
              >
                {day}{zh ? "天" : " Days"}
              </button>
            ))}
          </div>
        </section>

        <section className="package-list-section">
          <div className="package-list-title">
            <h2>{activeDays}{zh ? `天 · ${current.length}个方案` : ` Days · ${current.length} routes`}</h2>
            <p>{zh ? "不含机票 · 价格仅供参考" : "Flights not included · Prices are reference only"}</p>
          </div>
          <div className="package-route-list">
            {current.map((item) => (
              <button className="package-route-row" key={item.id} type="button" onClick={() => setSelected(item)}>
                <img src={item.coverImage} alt={zh ? item.nameZh : item.nameEn} />
                <span className="package-row-copy">
                  <small>{zh ? item.cityComboEn.toUpperCase() : item.cityComboZh}</small>
                  <b>{zh ? item.nameZh : item.nameEn}</b>
                  <em>{zh ? item.summaryZh : item.summaryEn}</em>
                  <i>
                    {item.days}{zh ? "天" : "D"}{item.nights}{zh ? "晚" : "N"}
                    <span />
                    RM <strong>{money(item.startingPrice)}</strong> {zh ? "起" : "from"}
                  </i>
                </span>
                <span className="package-arrow">→</span>
              </button>
            ))}
          </div>
          <aside className="package-longer-card">
            <span className="package-cta-icon">⌖</span>
            <div>
              <b>{zh ? "还没找到合适的？" : "Still not the right fit?"}</b>
              <p>{zh ? "告诉我们你的天数和想去的地方，我们帮你组合。" : "Tell us your days and places. We will shape the route for you."}</p>
            </div>
            <button type="button" onClick={() => setCustomInquiry(true)}>
              {zh ? "帮我推荐" : "Recommend for me"} →
            </button>
          </aside>
        </section>
      </main>

      {selected && (
        <div className="package-detail-layer" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
          <article className="package-detail-card" onClick={(event) => event.stopPropagation()}>
            <button className="package-detail-close" type="button" onClick={() => setSelected(null)}>×</button>
            <div className="package-detail-hero">
              <img src={selected.coverImage} alt={zh ? selected.nameZh : selected.nameEn} />
              <div>
                <p className="eyebrow">MAD MAX · TRAVEL PACKAGE</p>
                <h2>{zh ? selected.nameZh : selected.nameEn}</h2>
                <p>{selected.days}{zh ? "天" : " Days"}{selected.nights}{zh ? "晚" : " Nights"} · {zh ? selected.summaryZh : selected.summaryEn}</p>
                <b>RM {money(selected.startingPrice)} {zh ? "/ 人起" : " / person from"}</b>
              </div>
            </div>
            <section className="package-detail-body">
              <div className="package-dayline">
                <h3>{zh ? "详细行程" : "Day-by-day"}</h3>
                {selected.itinerary.map((day, index) => (
                  <div className="package-dayline-item" key={`${day.titleZh}-${index}`}>
                    <span>DAY {String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <b>{zh ? day.titleZh : day.titleEn}</b>
                      <p>{zh ? day.descriptionZh : day.descriptionEn}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="package-detail-notes">
                <PackageNote title={zh ? "套餐包含" : "Included"} items={selected.includes} />
                <PackageNote title={zh ? "不包含" : "Not included"} items={selected.excludes} />
                <InfoNote title={zh ? "住宿说明" : "Accommodation"} text={zh ? selected.accommodationNoteZh : selected.accommodationNoteEn} />
                <InfoNote title={zh ? "接送安排" : "Transfers"} text={zh ? selected.transferNoteZh : selected.transferNoteEn} />
                <InfoNote title={zh ? "注意事项" : "Notes"} text={zh ? selected.notesZh : selected.notesEn} />
                <InfoNote title={zh ? "价格说明" : "Price note"} text={zh ? selected.priceNoteZh : selected.priceNoteEn} />
              </div>
            </section>
            <footer className="package-detail-footer">
              <button className="button" type="button" onClick={() => setInquiry(selected)}>
                {zh ? "咨询这个套餐" : "Inquire about this package"} →
              </button>
            </footer>
          </article>
        </div>
      )}

      {inquiry && (
        <InquiryModal kind="package" title={zh ? inquiry.nameZh : inquiry.nameEn} onClose={() => setInquiry(null)} />
      )}
      {customInquiry && (
        <InquiryModal kind="package" title={zh ? "省心套餐推荐" : "Package Recommendation"} onClose={() => setCustomInquiry(false)} />
      )}
    </>
  );
}

function PackageNote({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4>{title}</h4>
      <ul>{items.filter(Boolean).map((item) => <li key={item}>{item}</li>)}</ul>
    </div>
  );
}

function InfoNote({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <h4>{title}</h4>
      <p>{text}</p>
    </div>
  );
}
