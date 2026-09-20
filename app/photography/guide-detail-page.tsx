"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ServiceMenu } from "../service-menu";
import type { TravelGuideArticle, TravelGuideBlock } from "../../db/travel-guide-shared";
import { guideCities, guideDefaultImages } from "../../db/travel-guide-shared";

type GalleryProps = {
  images: string[];
  caption?: string;
};

type PlaceHeading = {
  id: string;
  number: string;
  title: string;
};

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

function hasRealContent(blocks: TravelGuideBlock[]) {
  return blocks.some((block) => {
    if (block.type === "paragraph") return block.text.trim() && !block.text.includes("详情页视觉稿确认后");
    if (block.type === "heading" || block.type === "quote") return Boolean(block.text.trim());
    if (block.type === "image") return Boolean(block.image);
    if (block.type === "gallery") return block.images.some(Boolean);
    if (block.type === "list") return block.items.some(Boolean);
    return block.type === "divider";
  });
}

function guideImage(item: TravelGuideArticle) {
  const defaultImage = guideDefaultImages[item.slug];
  if (defaultImage && item.coverImage.includes("photo-1584515933487-779824d29309")) return defaultImage;
  return item.coverImage || defaultImage || "";
}

function defaultBlocks(article: TravelGuideArticle): TravelGuideBlock[] {
  const cover = guideImage(article);
  if (article.slug === "first-time-kuala-lumpur") {
    return [
      { type: "heading", text: "双子塔 KLCC" },
      { type: "gallery", images: [cover], caption: "KLCC · EVENING" },
      { type: "paragraph", text: "第一次来吉隆坡，建议把 KLCC 留到傍晚。白天看看城市，吃完饭以后等亮灯，晚上氛围会比白天更好。" },
      { type: "list", items: ["建议时间：17:00–21:00", "建议停留：1.5–2小时", "门票：外围免费", "顺路安排：KLCC Park · Pavilion · 武吉免登"] },
      { type: "quote", text: "如果主要想拍照，不用太晚才到。亮灯前后人会变多，提前一点反而更从容。" },
      { type: "heading", text: "茨厂街 Chinatown" },
      { type: "gallery", images: [guideDefaultImages["kl-chinatown-slow-walk"] || cover], caption: "CHINATOWN · EVENING WALK" },
      { type: "paragraph", text: "茨厂街不只适合打卡。附近的鬼仔巷、中央艺术坊和独立广场可以一起安排，下午慢慢过去会比较舒服。" },
      { type: "list", items: ["建议时间：15:00–19:00", "建议停留：1–1.5小时", "门票：街区免费", "顺路安排：鬼仔巷 · 中央艺术坊 · 独立广场"] },
      { type: "heading", text: "武吉免登 Bukit Bintang" },
      { type: "gallery", images: ["https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e2/Bukit_Bintang_in_Kuala_Lumpur%2C_Malaysia_-_03.jpg/1280px-Bukit_Bintang_in_Kuala_Lumpur%2C_Malaysia_-_03.jpg"], caption: "BUKIT BINTANG · NIGHT WALK" },
      { type: "paragraph", text: "如果你喜欢晚上吃饭、逛街方便，武吉免登会比想象中实用。它不是最安静的区域，但第一次来很好上手。" },
      { type: "list", items: ["建议时间：晚餐后", "建议停留：1–2小时", "门票：街区免费", "顺路安排：Pavilion · Jalan Alor · TRX"] },
      { type: "paragraph", text: "吉隆坡不需要一次把所有地方都走完。第一次来，把几个区域串顺，留一点时间吃饭、散步，体验反而会更舒服。" },
    ];
  }
  return [
    { type: "heading", text: article.titleZh.replace(/[，,].*$/, "") },
    { type: "gallery", images: [cover], caption: article.summaryZh },
    { type: "paragraph", text: article.summaryZh || "这篇攻略会用更轻的节奏，帮你判断怎么安排更舒服。" },
    { type: "quote", text: "攻略不是百科介绍，重点是帮你判断值不值得去、什么时候去、怎么顺路安排。" },
  ];
}

function guideTags(article: TravelGuideArticle) {
  if (article.slug === "first-time-kuala-lumpur") return ["第一次去", "半天～1天", "免费景点为主", "适合自由行"];
  if (article.category === "住宿推荐") return ["住宿区域", "自由行", "按预算选择"];
  if (article.category === "行程参考") return ["路线参考", "时间安排", "适合自由行"];
  return ["当地建议", "轻松安排", "适合自由行"];
}

function slugifyHeading(text: string, index: number) {
  const ascii = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return ascii || `place-${index + 1}`;
}

function collectPlaceHeadings(blocks: TravelGuideBlock[]): PlaceHeading[] {
  let count = 0;
  return blocks.flatMap((block, index) => {
    if (block.type !== "heading" || !block.text.trim()) return [];
    count += 1;
    return [{ id: slugifyHeading(block.text, index), number: String(count).padStart(2, "0"), title: block.text.trim() }];
  });
}

function placeDisplayName(text: string) {
  return text.replace(/\s+[A-Za-z][A-Za-z\s&.'-]+$/, "").trim() || text;
}

function splitInfoItem(item: string) {
  const [label, ...rest] = item.split(/[:：]/);
  return { label: (label || "").trim(), value: rest.join("：").trim() || item };
}

function Gallery({ images, caption }: GalleryProps) {
  const clean = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const startX = useRef(0);
  const available = clean.filter((image) => !failed[image]);
  if (!available.length) return null;
  const safeIndex = Math.min(index, available.length - 1);
  const next = (dir: -1 | 1) => setIndex((current) => (current + dir + available.length) % available.length);

  return (
    <figure
      className="guide-detail-gallery"
      onTouchStart={(event) => { startX.current = event.touches[0]?.clientX || 0; }}
      onTouchEnd={(event) => {
        const delta = (event.changedTouches[0]?.clientX || 0) - startX.current;
        if (Math.abs(delta) > 36) next(delta > 0 ? -1 : 1);
      }}
    >
      <div>
        <img src={available[safeIndex]} alt="" onError={() => setFailed((current) => ({ ...current, [available[safeIndex]]: true }))} />
        {available.length > 1 && (
          <>
            <button className="prev" type="button" onClick={() => next(-1)} aria-label="上一张">‹</button>
            <button className="next" type="button" onClick={() => next(1)} aria-label="下一张">›</button>
            <span>{safeIndex + 1} / {available.length}</span>
          </>
        )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function RelatedGuide({ item }: { item: TravelGuideArticle }) {
  return (
    <Link href={`/photography/${item.slug}`}>
      <img src={guideImage(item)} alt="" />
      <span>
        <small>{item.category}</small>
        <b>{item.titleZh}</b>
      </span>
      <i>›</i>
    </Link>
  );
}

function PlaceTitle({ text }: { text: string }) {
  const match = text.match(/^(.*?)(\s+[A-Za-z][A-Za-z\s&.'-]+)$/);
  const english = match?.[2]?.trim() || "";
  if (!match || !english) return <>{text}</>;
  return (
    <>
      <span>{match[1].trim()}</span>
      <em>{english}</em>
    </>
  );
}

export function GuideDetailPage({ article, related }: { article: TravelGuideArticle; related: TravelGuideArticle[] }) {
  const [menu, setMenu] = useState(false);
  const city = guideCities.find((item) => item.key === article.city);
  const blocks = useMemo(() => (hasRealContent(article.contentBlocks) ? article.contentBlocks : defaultBlocks(article)), [article]);
  const placeHeadings = useMemo(() => collectPlaceHeadings(blocks), [blocks]);
  const headingNumbers = useMemo(
    () => blocks.map((block, index) => (block.type === "heading" ? String(blocks.slice(0, index + 1).filter((item) => item.type === "heading").length).padStart(2, "0") : "")),
    [blocks],
  );

  return (
    <>
      <header>
        <Logo />
        <button className="menu-btn" onClick={() => setMenu(!menu)} aria-label={menu ? "关闭菜单" : "打开菜单"}>
          {menu ? "关闭" : "☰ 菜单"}
        </button>
        <nav className={menu ? "open" : ""}>
          <Link href="/#stays">房源</Link>
          <ServiceMenu lang="zh" />
          <Link href="/packages">省心套餐</Link>
          <Link href="/picks">大马特产</Link>
          <Link className="active-nav" href="/photography">旅行攻略</Link>
          <Link href="/about">关于我们</Link>
        </nav>
        <div className="header-right">
          <Link className="button header-cta" href="/#contact">咨询</Link>
        </div>
      </header>

      <main className="guide-detail-page">
        <section className="guide-detail-head">
          <Link href="/photography">← 返回旅行攻略</Link>
          <p>{article.category}</p>
          <h1>{article.titleZh}</h1>
          <h2>{article.summaryZh}</h2>
          <div className="guide-detail-tags">
            {guideTags(article).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <span>约 {article.readMinutes || 4} 分钟阅读{city ? ` · ${city.zh}` : ""}</span>
          <Gallery images={[guideImage(article)]} caption={article.imageLabel || city?.en?.toUpperCase()} />
          {placeHeadings.length > 1 && (
            <nav className="guide-route-overview" aria-label="这篇攻略">
              <b>路线一览</b>
              <p>{placeHeadings.map((item) => placeDisplayName(item.title)).join(" → ")}</p>
              <div>
                {placeHeadings.map((item) => <a href={`#${item.id}`} key={item.id}>{item.number} {placeDisplayName(item.title)}</a>)}
              </div>
            </nav>
          )}
        </section>

        <article className="guide-detail-body">
          {blocks.map((block, index) => {
            if (block.type === "heading") {
              return (
                <section className="guide-place-heading" id={slugifyHeading(block.text, index)} key={index}>
                  <small>{headingNumbers[index]}</small>
                  <h2><PlaceTitle text={block.text} /></h2>
                </section>
              );
            }
            if (block.type === "paragraph") return <p key={index}>{block.text}</p>;
            if (block.type === "image") return <Gallery key={index} images={[block.image]} caption={block.caption} />;
            if (block.type === "gallery") return <Gallery key={index} images={block.images} caption={block.caption} />;
            if (block.type === "quote") return <aside className="guide-local-note" key={index}><b>MAD MAX · 当地提醒</b><p>{block.text}</p></aside>;
            if (block.type === "list") return (
              <ul className="guide-info-list" key={index}>
                {block.items.filter(Boolean).map((item) => {
                  const info = splitInfoItem(item);
                  return <li key={item}><b>{info.label}</b><span>{info.value}</span></li>;
                })}
              </ul>
            );
            return <hr key={index} />;
          })}
        </article>

        <section className="guide-soft-link">
          <small>Malaysia local travel support</small>
          <h2>还没安排好马来西亚行程？</h2>
          <p><b>住宿 · 接送机 · 包车 · 一日游</b><br />告诉我们日期和人数，我们帮你一起看看。</p>
          <Link href="/#contact">提交行程需求 →</Link>
        </section>

        {related.length > 0 && (
          <section className="guide-related">
            <h2>继续看看</h2>
            <div>
              {related.slice(0, 2).map((item) => <RelatedGuide item={item} key={item.id} />)}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
