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
      { type: "gallery", images: [cover], caption: "傍晚到晚上，是第一次看吉隆坡城市感最舒服的时间。" },
      { type: "paragraph", text: "第一次来吉隆坡，可以把 KLCC 放在傍晚。白天看看城市，吃完饭以后等亮灯，晚上氛围会比白天更好。" },
      { type: "list", items: ["适合时间：17:00–21:00", "可以顺路：KLCC Park · Pavilion · 武吉免登"] },
      { type: "quote", text: "如果主要想拍照，不用太晚才到。亮灯前后人会变多，提前一点反而更从容。" },
      { type: "heading", text: "茨厂街 Chinatown" },
      { type: "gallery", images: [guideDefaultImages["kl-chinatown-slow-walk"] || cover], caption: "老街区适合傍晚慢慢走，不需要把行程排得太满。" },
      { type: "paragraph", text: "茨厂街不只适合打卡。附近的鬼仔巷、中央艺术坊和独立广场可以一起安排，下午慢慢过去会比较舒服。" },
      { type: "list", items: ["适合时间：15:00–19:00", "可以顺路：鬼仔巷 · 中央艺术坊 · 独立广场"] },
      { type: "heading", text: "武吉免登 Bukit Bintang" },
      { type: "paragraph", text: "如果你喜欢晚上吃饭、逛街方便，武吉免登会比想象中实用。它不是最安静的区域，但第一次来很好上手。" },
      { type: "list", items: ["适合时间：晚餐后", "可以顺路：Pavilion · Jalan Alor · TRX"] },
    ];
  }
  return [
    { type: "heading", text: article.titleZh.replace(/[，,].*$/, "") },
    { type: "gallery", images: [cover], caption: article.summaryZh },
    { type: "paragraph", text: article.summaryZh || "这篇攻略会用更轻的节奏，帮你判断怎么安排更舒服。" },
    { type: "quote", text: "攻略不是百科介绍，重点是帮你判断值不值得去、什么时候去、怎么顺路安排。" },
  ];
}

function Gallery({ images, caption }: GalleryProps) {
  const clean = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const startX = useRef(0);
  if (!clean.length) return null;
  const next = (dir: -1 | 1) => setIndex((current) => (current + dir + clean.length) % clean.length);

  return (
    <figure
      className="guide-detail-gallery"
      onTouchStart={(event) => { startX.current = event.touches[0]?.clientX || 0; }}
      onTouchEnd={(event) => {
        const delta = (event.changedTouches[0]?.clientX || 0) - startX.current;
        if (Math.abs(delta) > 36) next(delta > 0 ? -1 : 1);
      }}
    >
      <img src={clean[index]} alt="" />
      {clean.length > 1 && (
        <>
          <button className="prev" type="button" onClick={() => next(-1)} aria-label="上一张">‹</button>
          <button className="next" type="button" onClick={() => next(1)} aria-label="下一张">›</button>
        </>
      )}
      <span>{index + 1} / {clean.length}</span>
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

export function GuideDetailPage({ article, related }: { article: TravelGuideArticle; related: TravelGuideArticle[] }) {
  const [menu, setMenu] = useState(false);
  const city = guideCities.find((item) => item.key === article.city);
  const blocks = useMemo(() => (hasRealContent(article.contentBlocks) ? article.contentBlocks : defaultBlocks(article)), [article]);
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
          <Link className="button header-cta" href="/#contact">提交咨询</Link>
        </div>
      </header>

      <main className="guide-detail-page">
        <section className="guide-detail-head">
          <Link href="/photography">← 返回旅行攻略</Link>
          <p>{article.category}</p>
          <h1>{article.titleZh}</h1>
          <h2>{article.summaryZh}</h2>
          <span>约 {article.readMinutes || 4} 分钟阅读{city ? ` · ${city.zh}` : ""}</span>
          <Gallery images={[guideImage(article)]} caption={article.imageLabel || city?.en?.toUpperCase()} />
        </section>

        <article className="guide-detail-body">
          {blocks.map((block, index) => {
            if (block.type === "heading") {
              return (
                <section className="guide-place-heading" key={index}>
                  <small>{headingNumbers[index]}</small>
                  <h2>{block.text}</h2>
                </section>
              );
            }
            if (block.type === "paragraph") return <p key={index}>{block.text}</p>;
            if (block.type === "image") return <Gallery key={index} images={[block.image]} caption={block.caption} />;
            if (block.type === "gallery") return <Gallery key={index} images={block.images} caption={block.caption} />;
            if (block.type === "quote") return <aside className="guide-local-note" key={index}><b>MAD MAX · 当地提醒</b><p>{block.text}</p></aside>;
            if (block.type === "list") return <ul className="guide-info-list" key={index}>{block.items.filter(Boolean).map((item) => <li key={item}>{item}</li>)}</ul>;
            return <hr key={index} />;
          })}
        </article>

        <section className="guide-soft-link">
          <h2>还在安排马来西亚行程？</h2>
          <p>住宿、接送机、包车和当地行程，都可以一起告诉我们。</p>
          <Link href="/#contact">咨询行程 →</Link>
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
