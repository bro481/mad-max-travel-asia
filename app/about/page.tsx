"use client";

import { useEffect, useMemo, useState } from "react";
import type { DestinationRecord } from "../../db/destinations";
import {
  defaultAboutSettings,
  type AboutSettings,
} from "../../db/site-settings";
import { ServiceMenu } from "../service-menu";

type Lang = "zh" | "en";
const image = (id: string, width = 1400) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=86`;
const cityCoverage = [
  { zh: "吉隆坡", en: "Kuala Lumpur", zhServices: "住宿 · 接送机 · 私人包车", enServices: "Stays · airport transfers · private cars" },
  { zh: "亚庇", en: "Kota Kinabalu", zhServices: "住宿 · 接送机 · 包车 · 海岛及当地体验", enServices: "Stays · transfers · private cars · islands & local experiences" },
  { zh: "仙本那", en: "Semporna", zhServices: "住宿 · 接送 · 海岛行程", enServices: "Stays · transfers · island trips" },
  { zh: "槟城", en: "Penang", zhServices: "度假住宿 · 接送 · 包车 · 城市体验", enServices: "Stays · transfers · private cars · city experiences" },
  { zh: "兰卡威", en: "Langkawi", zhServices: "度假住宿 · 接送 · 包车 · 海岛体验", enServices: "Resort stays · transfers · private cars · island experiences" },
  { zh: "马尔代夫", en: "Maldives", zhServices: "度假住宿 · 接送 · 行程咨询", enServices: "Resort stays · transfers · itinerary planning" },
];
const ways = [
  { no: "01", zh: "帮客人选住宿", en: "Find the right stay", zhText: "根据人数、位置和行程，从现有房源里帮你找到更合适的一间。", enText: "We match your group, location and itinerary with a more suitable place to stay." },
  { no: "02", zh: "把交通接起来", en: "Connect the transport", zhText: "机场接送、包车和跨城行程可以一起安排，不需要自己分别找车。", enText: "Airport transfers, private cars and intercity journeys can be arranged together." },
  { no: "03", zh: "安排当地体验", en: "Add local experiences", zhText: "海岛、一日游、跟拍等项目，根据你的时间一起搭配。", enText: "Island trips, day tours and photography can be fitted around your time." },
  { no: "04", zh: "旅途中也找得到我们", en: "Reach us during the trip", zhText: "入住、车辆或行程临时有问题，也可以直接联系我们继续处理。", enText: "If something changes with your stay, vehicle or itinerary, you can contact us directly." },
];
const moments = [
  ["photo-1600566753190-17f0baa2a6c3", "准备客人入住", "Preparing a guest stay"],
  ["photo-1549317661-bd32c8ce0db2", "确认接机车辆", "Confirming an airport transfer"],
  ["photo-1544550285-f813152fb2fd", "出发去码头", "Leaving for the jetty"],
  ["photo-1596422846543-75c6fc197f07", "吉隆坡的一天", "A day in Kuala Lumpur"],
  ["photo-1507525428034-b723cf961d3e", "安排海岛行程", "Planning an island day"],
];
const copy = {
  zh: {
    rooms: "房源", services: "当地服务", about: "关于我们", contact: "联系我们", submit: "提交咨询",
    eyebrow: "MAD MAX · MALAYSIA LOCAL STAY", title: <>在马来西亚，<br />像当地朋友一样帮你安排。</>,
    intro: "我们专注马来西亚住宿、出行与当地体验。从选房、接送、包车到旅途中的小事，都由熟悉当地的人帮你衔接安排。",
    tags: ["中文沟通", "当地服务"], here: "我们服务的目的地", hereText: "这些是我们目前重点提供服务和衔接安排的地方。", coverage: "服务范围也覆盖马六甲、新加坡及其他周边路线，具体安排可提前咨询。",
    how: "我们平时，就是这样帮客人安排旅行", howText: "不是把订单交给系统之后就结束，而是把住宿、交通和行程一点点接起来。",
    why: "为什么这里不是一个自动订房平台？", whyTitle: "我们更愿意先了解你的旅行。",
    whyText: ["每个人的行程都不一样。有人带孩子，有人第一次来马来西亚，有人凌晨抵达，也有人想把住宿、包车和海岛行程一次安排好。", "所以这里不是一个下单后就结束的平台。你可以先告诉我们什么时候来、几个人、想怎么玩，我们再帮你把合适的住宿和当地服务安排到一起。"],
    daily: "一些真实的日常", dailyText: "房间、车辆、码头和行程确认——这些普通的小事，就是我们每天在做的事情。",
    people: "屏幕另一边，是我们。", peopleTag: "MAD MAX Malaysia Stay", peopleSub: "马来西亚当地住宿与旅行服务",
    peopleText: "我们每天做的事情其实很简单：帮客人找合适的住宿、确认入住、安排车辆，再把想去的地方一点点接起来。如果你第一次来马来西亚，不知道住哪里、怎么走、哪些项目适合自己，都可以直接来问我们。",
    ready: "准备来马来西亚了吗？", readyText: "告诉我们什么时候来、几个人、想去哪里，剩下的我们一起慢慢安排。", consult: "开始咨询", seeRooms: "看看我们的房源",
  },
  en: {
    rooms: "Rooms", services: "Local Services", about: "About", contact: "Contact", submit: "Submit inquiry",
    eyebrow: "MAD MAX · MALAYSIA LOCAL STAY", title: <>In Malaysia,<br />helping like a local friend.</>,
    intro: "We help with stays, transport and local experiences across Malaysia — connecting the details with people who know the places on the ground.",
    tags: ["Chinese-speaking support", "Local service"], here: "Destinations we serve", hereText: "These are the places where we currently focus our service and trip coordination.", coverage: "Our coverage also extends to Melaka, Singapore and other nearby routes. Ask us about specific arrangements.",
    how: "How we help guests every day", howText: "Your order does not disappear into a system. We help connect the stay, transport and itinerary.",
    why: "Why are we not an automated booking platform?", whyTitle: "We would rather understand your trip first.",
    whyText: ["Every journey is different. Some guests travel with children, arrive after midnight or want to arrange their stay, private car and island trip together.", "Tell us when you are coming, who is travelling and what you would like to do. We will help connect a suitable stay with the local services around it."],
    daily: "Some everyday moments", dailyText: "Rooms, vehicles, jetties and itinerary checks — the ordinary details are the work we do each day.",
    people: "There are real people on the other side.", peopleTag: "MAD MAX Malaysia Stay", peopleSub: "Local stays and travel services in Malaysia",
    peopleText: "Our work is simple: find a suitable stay, confirm check-in, arrange the vehicle and connect the places you want to visit. If this is your first time in Malaysia, you can always ask us where to stay, how to travel or what might suit you.",
    ready: "Coming to Malaysia?", readyText: "Tell us when, who is travelling and where you would like to go. We can work out the rest together.", consult: "Start a conversation", seeRooms: "See our stays",
  },
};

export default function AboutPage() {
  const [lang, setLang] = useState<Lang>("zh");
  const [menu, setMenu] = useState(false);
  const [about, setAbout] = useState<AboutSettings>(defaultAboutSettings);
  const [managedDestinations, setManagedDestinations] = useState<DestinationRecord[]>([]);
  useEffect(() => {
    Promise.all([
      fetch("/api/site-settings?key=about").then((response) => response.ok ? response.json() : defaultAboutSettings),
      fetch("/api/destinations?surface=services").then((response) => response.ok ? response.json() : []),
    ]).then(([settings, destinationItems]) => {
      setAbout(settings);
      setManagedDestinations(destinationItems);
    }).catch(() => undefined);
  }, []);
  const configuredDestinations = useMemo(() => {
    if (!managedDestinations.length) return cityCoverage;
    return managedDestinations.map((destination, index) => {
      const setting = about.destinations.items.find((item) => item.destinationId === destination.id);
      return {
        zh: destination.nameZh,
        en: destination.nameEn,
        zhServices: setting?.serviceSummaryZh || destination.introZh,
        enServices: setting?.serviceSummaryEn || destination.introEn,
        visible: setting?.visible !== false,
        sortOrder: setting?.sortOrder ?? index,
      };
    }).filter((item) => item.visible).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [about.destinations.items, managedDestinations]);
  const t = copy[lang];
  return <>
    <header>
      <a className="logo" href="/"><span className="logo-mark">⌂</span><span><b>MAD MAX</b><small>MALAYSIA STAY</small></span></a>
      <button className="menu-btn" aria-label="Menu" onClick={() => setMenu(!menu)}>{menu ? "关闭" : "☰ 菜单"}</button>
      <nav className={menu ? "open" : ""}><a href="/#stays">{t.rooms}</a><ServiceMenu lang={lang} /><a className="active-nav" href="/about">{t.about}</a><a href="/#contact">{t.contact}</a><div className="language-switch mobile-language"><button className={lang === "zh" ? "active" : ""} onClick={() => setLang("zh")}>中文</button><i /><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>English</button></div></nav>
      <div className="header-right"><div className="language-switch desktop-language"><button className={lang === "zh" ? "active" : ""} onClick={() => setLang("zh")}>中文</button><i /><button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>English</button></div><a className="button header-cta" href="/#contact">{t.submit}</a></div>
    </header>
    <main className="about-page">
      <section className="about-hero">
        <div className="about-hero-copy"><p className="eyebrow">{about.hero.eyebrow}</p><h1>{(lang === "zh" ? about.hero.titleZh : about.hero.titleEn).split("\n").map((line, index) => <span key={line}>{index ? <br /> : null}{line}</span>)}</h1><p>{lang === "zh" ? about.hero.introZh : about.hero.introEn}</p><div>{(lang === "zh" ? about.hero.tagsZh : about.hero.tagsEn).map(tag => <span key={tag}>{tag}</span>)}</div></div>
        <div className="about-hero-scenes">{about.hero.images.map((src) => <figure key={src}><img src={src} alt="" /></figure>)}<small>{lang === "zh" ? about.hero.imageBadgeZh : about.hero.imageBadgeEn}</small></div>
      </section>
      {about.destinations.visible && <section className="about-here about-container"><div className="about-heading"><p className="eyebrow">{about.destinations.eyebrow}</p><h2>{lang === "zh" ? about.destinations.titleZh : about.destinations.titleEn}</h2><p>{lang === "zh" ? about.destinations.introZh : about.destinations.introEn}</p></div><div className="about-city-grid">{configuredDestinations.map(city => <article key={city.en}><h3>{city.zh}<small>{city.en}</small></h3><p>{lang === "zh" ? city.zhServices : city.enServices}</p></article>)}</div><p className="about-coverage">{lang === "zh" ? about.destinations.footerZh : about.destinations.footerEn}</p></section>}
      {about.ways.visible && <section className="about-how"><div className="about-container"><div className="about-heading left"><p className="eyebrow">{about.ways.eyebrow}</p><h2>{lang === "zh" ? about.ways.titleZh : about.ways.titleEn}</h2><p>{lang === "zh" ? about.ways.introZh : about.ways.introEn}</p></div><div className="about-way-grid">{about.ways.items.map((item, index) => <article key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><h3>{lang === "zh" ? item.titleZh : item.titleEn}</h3><p>{lang === "zh" ? item.descriptionZh : item.descriptionEn}</p></article>)}</div></div></section>}
      {about.philosophy.visible && <section className="about-why about-container"><p className="eyebrow">{about.philosophy.eyebrow}</p><div><h2>{lang === "zh" ? about.philosophy.titleZh : about.philosophy.titleEn}</h2><article><h3>{lang === "zh" ? about.philosophy.sideTitleZh : about.philosophy.sideTitleEn}</h3>{(lang === "zh" ? about.philosophy.paragraphsZh : about.philosophy.paragraphsEn).map(text => <p key={text}>{text}</p>)}</article></div></section>}
      {about.moments.visible && <section className="about-daily about-container"><div className="about-heading"><p className="eyebrow">{about.moments.eyebrow}</p><h2>{lang === "zh" ? about.moments.titleZh : about.moments.titleEn}</h2><p>{lang === "zh" ? about.moments.introZh : about.moments.introEn}</p></div><div className="about-mosaic">{about.moments.items.map((item, index) => <figure key={item.id} className={`moment-${index + 1}`}><img src={item.image} alt={lang === "zh" ? item.captionZh : item.captionEn} /><figcaption>{lang === "zh" ? item.captionZh : item.captionEn}</figcaption></figure>)}</div></section>}
      {about.team.visible && <section className="about-people about-container"><div className="about-people-image"><img src={about.team.image} alt="" /><span>{lang === "zh" ? about.team.imageBadgeZh : about.team.imageBadgeEn}</span></div><div><p className="eyebrow">{about.team.eyebrow}</p><h2>{lang === "zh" ? about.team.titleZh : about.team.titleEn}</h2><b>{about.team.brandName}</b><small>{lang === "zh" ? about.team.brandSubtitleZh : about.team.brandSubtitleEn}</small><p>{lang === "zh" ? about.team.bodyZh : about.team.bodyEn}</p><div className="about-contact-links">{about.team.showWechat && <a href="/#contact">微信咨询 →</a>}{about.team.showWhatsapp && <a href="/#contact">WhatsApp →</a>}</div></div></section>}
      {about.cta.visible && <section className="about-final"><div><h2>{lang === "zh" ? about.cta.titleZh : about.cta.titleEn}</h2><p>{lang === "zh" ? about.cta.descriptionZh : about.cta.descriptionEn}</p></div><div><a className="button" href="/#contact">{lang === "zh" ? about.cta.primaryTextZh : about.cta.primaryTextEn} →</a><a className="button outline" href={about.cta.secondaryLink}>{lang === "zh" ? about.cta.secondaryTextZh : about.cta.secondaryTextEn}</a></div></section>}
    </main>
    <footer><a className="logo" href="/"><span className="logo-mark">⌂</span><span><b>MAD MAX</b><small>MALAYSIA STAY</small></span></a><div><a href="/#stays">{t.rooms}</a><a href="/services">{t.services}</a><a href="/about">{t.about}</a><a href="/#contact">{t.contact}</a></div><small>© 2026 MAD MAX Malaysia Stay</small></footer>
  </>;
}
