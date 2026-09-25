import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCustomerShare, markCustomerShareViewed } from "../../../db/customer-shares";
import { formatDateRange, quoteLabel, shareUrl, totalQuoteLabel } from "../../../lib/customer-share-materials";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const item = await getCustomerShare(code);
  if (!item) return {};
  const description = [item.subtitle, formatDateRange(item), quoteLabel(item)].filter(Boolean).join(" · ");
  return {
    title: `${item.title} | MAD MAX`,
    description,
    openGraph: {
      title: item.title,
      description,
      url: shareUrl(item.code),
      images: [{ url: item.image || item.content.image || "/og.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: item.title,
      description,
      images: [item.image || item.content.image || "/og.png"],
    },
  };
}

function contextMessage(item: Awaited<ReturnType<typeof getCustomerShare>>) {
  if (!item) return "";
  const date = formatDateRange(item);
  return encodeURIComponent(
    [
      `我想咨询「${item.title}」`,
      date ? `日期：${date}` : "",
      item.payload.people ? `人数：${item.payload.people}` : "",
      item.payload.quoteAmount ? `报价：${quoteLabel(item)}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

export default async function CustomerSharePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const item = await getCustomerShare(code);
  if (!item) notFound();
  await markCustomerShareViewed(code);
  const date = formatDateRange(item);
  const total = totalQuoteLabel(item);
  const message = contextMessage(item);
  const whatsapp = `https://wa.me/?text=${message}`;
  return (
    <main className="customer-share-page">
      <section className="customer-share-shell">
        <header className="customer-share-brand">
          <a href="/">
            <b>MAD MAX</b>
            <span>MALAYSIA STAY</span>
          </a>
          <small>为你推荐</small>
        </header>

        <article className="customer-share-card">
          {item.content.image && <img src={item.content.image} alt={item.title} />}
          <div className="customer-share-main">
            <p>{item.content.type === "stay" ? "住宿推荐" : item.content.type === "route" ? "路线推荐" : item.content.type === "package" ? "套餐推荐" : "服务推荐"}</p>
            <h1>{item.title}</h1>
            <h2>{item.subtitle}</h2>
            <div className="customer-share-facts">
              {date && <span>{date}</span>}
              {item.payload.people && <span>{item.payload.people} 位</span>}
              {item.payload.validUntil && <span>有效至 {item.payload.validUntil}</span>}
            </div>
            <div className="customer-share-quote">
              <span>本次报价</span>
              <b>{quoteLabel(item)}</b>
              {total && <small>{total}</small>}
            </div>
            {item.payload.note && <p className="customer-share-note">{item.payload.note}</p>}
          </div>
        </article>

        <section className="customer-share-section">
          <h2>{item.content.type === "stay" ? "房型信息" : item.content.type === "route" ? "路线信息" : "内容信息"}</h2>
          <div className="customer-share-detail-grid">
            {item.content.details.map((detail) => (
              <div key={detail.label}>
                <span>{detail.label}</span>
                <b>{detail.value}</b>
              </div>
            ))}
          </div>
          <div className="customer-share-tags">
            {item.content.highlights.map((highlight) => (
              <span key={highlight}>{highlight}</span>
            ))}
          </div>
        </section>

        {item.content.gallery.length > 1 && (
          <section className="customer-share-section">
            <h2>更多照片</h2>
            <div className="customer-share-gallery">
              {item.content.gallery.slice(0, 6).map((image) => (
                <img src={image} alt="" key={image} />
              ))}
            </div>
          </section>
        )}

        <section className="customer-share-contact">
          <h2>有问题？</h2>
          <p>点击时会自动带上当前内容、日期、人数和报价，方便直接继续沟通。</p>
          <a className="button" href={whatsapp} target="_blank">
            {item.content.ctaLabel} →
          </a>
          <a href={item.content.url}>查看原始详情页</a>
        </section>
      </section>
    </main>
  );
}
