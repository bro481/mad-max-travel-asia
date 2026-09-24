"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ServiceMenu } from "../service-menu";
import type { TravelGuideArticle, TravelGuideBlock } from "../../db/travel-guide-shared";
import { guideCities, guideDefaultImages } from "../../db/travel-guide-shared";

type GalleryProps = {
  images: string[];
  caption?: string;
  captions?: string[];
  alts?: string[];
};

type PlaceHeading = {
  id: string;
  number: string;
  title: string;
  blockIndex: number;
};

const placeSubtitleMap: Record<string, string> = {
  双子塔: "Petronas Twin Towers · KLCC",
  茨厂街: "Petaling Street · Chinatown",
  武吉免登: "Bukit Bintang",
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
      { type: "list", items: ["适合时间：17:00–21:00", "建议停留：1.5–2小时", "顺路安排：KLCC Park · Pavilion"] },
      { type: "quote", text: "如果主要想拍照，不用太晚才到。亮灯前后人会变多，提前一点反而更从容。" },
      { type: "heading", text: "茨厂街 Chinatown" },
      { type: "gallery", images: [guideDefaultImages["kl-chinatown-slow-walk"] || cover], caption: "CHINATOWN · EVENING WALK" },
      { type: "paragraph", text: "茨厂街不只适合打卡。附近的鬼仔巷、中央艺术坊和独立广场可以一起安排，下午慢慢过去会比较舒服。" },
      { type: "list", items: ["适合时间：15:00–19:00", "建议停留：1–2小时", "顺路安排：鬼仔巷 · 中央艺术坊 · 独立广场"] },
      { type: "heading", text: "武吉免登 Bukit Bintang" },
      { type: "gallery", images: ["https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e2/Bukit_Bintang_in_Kuala_Lumpur%2C_Malaysia_-_03.jpg/1280px-Bukit_Bintang_in_Kuala_Lumpur%2C_Malaysia_-_03.jpg"], caption: "BUKIT BINTANG · NIGHT WALK" },
      { type: "paragraph", text: "如果你喜欢晚上吃饭、逛街方便，武吉免登会比想象中实用。它不是最安静的区域，但第一次来很好上手。" },
      { type: "list", items: ["适合时间：晚餐后", "建议停留：2–3小时", "顺路安排：Pavilion · Jalan Alor · TRX"] },
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

function headingAnchorId(text: string, index: number) {
  const name = placeDisplayName(text);
  if (name === "双子塔") return "spot-klcc";
  if (name === "茨厂街") return "spot-chinatown";
  if (name === "武吉免登") return "spot-bukit-bintang";
  return `spot-${slugifyHeading(text, index)}`;
}

function collectPlaceHeadings(blocks: TravelGuideBlock[]): PlaceHeading[] {
  let count = 0;
  const seen: Record<string, number> = {};
  return blocks.flatMap((block, index) => {
    if (block.type !== "heading" || !block.text.trim()) return [];
    count += 1;
    const baseId = headingAnchorId(block.text, index);
    seen[baseId] = (seen[baseId] || 0) + 1;
    const id = seen[baseId] > 1 ? `${baseId}-${seen[baseId]}` : baseId;
    return [{ id, number: String(count).padStart(2, "0"), title: block.text.trim(), blockIndex: index }];
  });
}

function placeDisplayName(text: string) {
  return text.replace(/\s+[A-Za-z][A-Za-z\s&.'-]+$/, "").trim() || text;
}

function placeSubtitle(text: string) {
  const name = placeDisplayName(text);
  return placeSubtitleMap[name] || text.replace(name, "").trim();
}

function splitInfoItem(item: string) {
  const colonIndex = item.search(/[:：]/);
  const rawLabel = colonIndex >= 0 ? item.slice(0, colonIndex) : item;
  const value = colonIndex >= 0 ? item.slice(colonIndex + 1).trim() : item;
  const normalizedLabel = rawLabel.trim()
    .replace(/^建议时间$/, "适合时间")
    .replace(/^可以顺路$/, "顺路安排");
  return { label: normalizedLabel, value: value || item };
}

function formatGalleryCount(current: number, total: number) {
  return `${String(current).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}

function galleryCaptionAt(captions: string[] | undefined, fallback: string | undefined, index: number) {
  return captions?.[index]?.trim() || fallback || "";
}

function Gallery({ images, caption, captions, alts }: GalleryProps) {
  const clean = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const startX = useRef(0);
  const available = clean
    .map((image, originalIndex) => ({
      src: image,
      caption: galleryCaptionAt(captions, caption, originalIndex),
      alt: alts?.[originalIndex]?.trim() || galleryCaptionAt(captions, caption, originalIndex),
    }))
    .filter((image) => !failed[image.src]);
  if (!available.length) return null;
  const safeIndex = Math.min(index, available.length - 1);
  const current = available[safeIndex];
  const next = (dir: -1 | 1) => setIndex((current) => (current + dir + available.length) % available.length);
  const handleSwipeStart = (clientX: number) => {
    startX.current = clientX;
  };
  const handleSwipeEnd = (clientX: number) => {
    const delta = clientX - startX.current;
    if (Math.abs(delta) > 36 && available.length > 1) next(delta > 0 ? -1 : 1);
  };

  return (
    <>
      <figure
        className={`guide-detail-gallery${available.length > 1 ? " has-multiple" : ""}`}
        onTouchStart={(event) => handleSwipeStart(event.touches[0]?.clientX || 0)}
        onTouchEnd={(event) => handleSwipeEnd(event.changedTouches[0]?.clientX || 0)}
      >
        <div>
          <button className="guide-gallery-image-button" type="button" onClick={() => setViewerOpen(true)} aria-label="查看大图">
            <img src={current.src} alt={current.alt} onError={() => setFailed((latest) => ({ ...latest, [current.src]: true }))} />
          </button>
          {available.length > 1 && (
            <>
              <button className="prev" type="button" onClick={() => next(-1)} aria-label="上一张">‹</button>
              <button className="next" type="button" onClick={() => next(1)} aria-label="下一张">›</button>
              <span>{formatGalleryCount(safeIndex + 1, available.length)}</span>
            </>
          )}
        </div>
        {(current.caption || available.length > 1) && (
          <figcaption>
            <span>{current.caption}</span>
            {available.length > 1 && <b>{formatGalleryCount(safeIndex + 1, available.length)}</b>}
          </figcaption>
        )}
      </figure>
      {viewerOpen && (
        <div
          className="guide-photo-viewer"
          role="dialog"
          aria-modal="true"
          onClick={() => setViewerOpen(false)}
          onTouchStart={(event) => handleSwipeStart(event.touches[0]?.clientX || 0)}
          onTouchEnd={(event) => handleSwipeEnd(event.changedTouches[0]?.clientX || 0)}
        >
          <button className="guide-photo-close" type="button" aria-label="关闭图片" onClick={() => setViewerOpen(false)}>×</button>
          {available.length > 1 && <button className="guide-photo-prev" type="button" aria-label="上一张" onClick={(event) => { event.stopPropagation(); next(-1); }}>‹</button>}
          <img src={current.src} alt={current.alt} onClick={(event) => event.stopPropagation()} />
          {available.length > 1 && <button className="guide-photo-next" type="button" aria-label="下一张" onClick={(event) => { event.stopPropagation(); next(1); }}>›</button>}
          <p onClick={(event) => event.stopPropagation()}>
            <b>{formatGalleryCount(safeIndex + 1, available.length)}</b>
            {current.caption && <span>{current.caption}</span>}
          </p>
        </div>
      )}
    </>
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
  const name = placeDisplayName(text);
  const subtitle = placeSubtitle(text);
  return (
    <>
      <span>{name}</span>
      {subtitle && <em>{subtitle}</em>}
    </>
  );
}

function ChapterNav({
  headings,
  activeId,
  sticky = false,
  navRef,
  onJump,
}: {
  headings: PlaceHeading[];
  activeId: string;
  sticky?: boolean;
  navRef?: (node: HTMLElement | null) => void;
  onJump: (id: string) => void;
}) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!activeId) return;
    buttonRefs.current[activeId]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeId]);

  return (
    <section className={`guide-chapter-nav${sticky ? " sticky" : ""}`} ref={navRef}>
      {!sticky && <p>快速浏览</p>}
      <div>
        {headings.map((heading) => (
          <button
            className={activeId === heading.id ? "active" : ""}
            type="button"
            key={heading.id}
            ref={(node) => { buttonRefs.current[heading.id] = node; }}
            onClick={() => onJump(heading.id)}
          >
            <span>{heading.number}</span>
            {placeDisplayName(heading.title)}
          </button>
        ))}
      </div>
    </section>
  );
}

export function GuideDetailPage({ article, related }: { article: TravelGuideArticle; related: TravelGuideArticle[] }) {
  const [menu, setMenu] = useState(false);
  const [compactHeader, setCompactHeader] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState("");
  const [showStickyChapters, setShowStickyChapters] = useState(false);
  const chapterNavRef = useRef<HTMLElement | null>(null);
  const suppressSpyUntil = useRef(0);
  const releaseSpyTimer = useRef<number | null>(null);
  const city = guideCities.find((item) => item.key === article.city);
  const blocks = useMemo(() => (hasRealContent(article.contentBlocks) ? article.contentBlocks : defaultBlocks(article)), [article]);
  const placeHeadings = useMemo(() => collectPlaceHeadings(blocks), [blocks]);
  const showChapterNav = placeHeadings.length >= 3;
  const headingByBlockIndex = useMemo(() => new Map(placeHeadings.map((heading) => [heading.blockIndex, heading])), [placeHeadings]);
  const headingNumbers = useMemo(
    () => blocks.map((block, index) => (block.type === "heading" ? String(blocks.slice(0, index + 1).filter((item) => item.type === "heading").length).padStart(2, "0") : "")),
    [blocks],
  );

  const chapterOffset = () => {
    if (typeof window === "undefined") return 132;
    const mobile = window.innerWidth <= 700;
    const headerHeight = mobile ? 56 : 78;
    const stickyNav = document.querySelector<HTMLElement>(".guide-chapter-nav.sticky");
    const navHeight = stickyNav?.getBoundingClientRect().height || (showChapterNav ? (mobile ? 44 : 48) : 0);
    return headerHeight + navHeight + (mobile ? 18 : 20);
  };

  useEffect(() => {
    const onScroll = () => setCompactHeader(window.scrollY > 180);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!showChapterNav) return;

    const updateChapterNav = () => {
      const stickyTop = window.innerWidth <= 700 ? 56 : 78;
      const navRect = chapterNavRef.current?.getBoundingClientRect();
      setShowStickyChapters(Boolean(navRect && navRect.bottom <= stickyTop));
      if (Date.now() < suppressSpyUntil.current) return;

      let current = placeHeadings[0]?.id || "";
      const readingLine = chapterOffset() + Math.min(window.innerHeight * 0.28, 190);
      for (const heading of placeHeadings) {
        const element = document.getElementById(heading.id);
        if (element && element.getBoundingClientRect().top <= readingLine) current = heading.id;
      }
      setActiveHeadingId(current);
    };

    updateChapterNav();
    window.addEventListener("scroll", updateChapterNav, { passive: true });
    window.addEventListener("resize", updateChapterNav);
    return () => {
      window.removeEventListener("scroll", updateChapterNav);
      window.removeEventListener("resize", updateChapterNav);
      if (releaseSpyTimer.current) window.clearTimeout(releaseSpyTimer.current);
    };
  }, [placeHeadings, showChapterNav]);

  const jumpToChapter = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    setActiveHeadingId(id);
    suppressSpyUntil.current = Date.now() + 850;
    if (releaseSpyTimer.current) window.clearTimeout(releaseSpyTimer.current);
    const top = window.scrollY + element.getBoundingClientRect().top - chapterOffset();
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    releaseSpyTimer.current = window.setTimeout(() => {
      suppressSpyUntil.current = 0;
      window.dispatchEvent(new Event("scroll"));
    }, 900);
  };

  return (
    <>
      <header className={compactHeader ? "compact-guide-header" : ""}>
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
          <p>{article.category}{city?.zh ? ` · ${city.zh}` : ""}</p>
          <h1>{article.titleZh}</h1>
          <h2>{article.summaryZh}</h2>
          <div className="guide-detail-tags">
            {guideTags(article).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </section>

        {showChapterNav && (
          <>
            <ChapterNav
              headings={placeHeadings}
              activeId={activeHeadingId || placeHeadings[0]?.id || ""}
              navRef={(node) => { chapterNavRef.current = node; }}
              onJump={jumpToChapter}
            />
            {showStickyChapters && (
              <ChapterNav
                headings={placeHeadings}
                activeId={activeHeadingId || placeHeadings[0]?.id || ""}
                sticky
                onJump={jumpToChapter}
              />
            )}
          </>
        )}

        <article className="guide-detail-body">
          {blocks.map((block, index) => {
            if (block.type === "heading") {
              const heading = headingByBlockIndex.get(index);
              return (
                <section className="guide-place-heading" id={heading?.id || headingAnchorId(block.text, index)} key={index}>
                  <small>{headingNumbers[index]}</small>
                  <h2><PlaceTitle text={block.text} /></h2>
                </section>
              );
            }
            if (block.type === "paragraph") return <p key={index}>{block.text}</p>;
            if (block.type === "image") return <Gallery key={index} images={[block.image]} caption={block.caption} />;
            if (block.type === "gallery") return <Gallery key={index} images={block.images} caption={block.caption} captions={block.captions} alts={block.alts} />;
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
          <h2>还在安排马来西亚行程？</h2>
          <p>告诉我们日期、人数和想去的地方，我们帮你一起看看怎么安排。</p>
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
