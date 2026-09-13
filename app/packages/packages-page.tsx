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
            src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1900&q=90"
            alt=""
            aria-hidden="true"
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
            <h2>{zh ? "选择行程天数" : "Choose trip length"}</h2>
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
          <div className="package-route-list">
            {current.map((item) => (
              <a className="package-route-row" key={item.id} href={`/packages/${item.slug}`}>
                <img src={item.coverImage} alt={zh ? item.nameZh : item.nameEn} />
                <span className="package-row-copy">
                  <small>{zh ? item.cityComboEn.toUpperCase() : item.cityComboZh}</small>
                  <b>{zh ? item.nameZh : item.nameEn}</b>
                  <em>{zh ? item.summaryZh : item.summaryEn}</em>
                  <i>
                    {item.days}{zh ? "天" : "D"}{item.nights}{zh ? "晚" : "N"}
                    <span />
                    {zh ? "¥" : "RMB"} <strong>{money(item.startingPrice)}</strong> {zh ? "起" : "from"}
                  </i>
                </span>
                <span className="package-arrow">→</span>
              </a>
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

      {customInquiry && (
        <InquiryModal kind="package" title={zh ? "省心套餐推荐" : "Package Recommendation"} onClose={() => setCustomInquiry(false)} />
      )}
    </>
  );
}
