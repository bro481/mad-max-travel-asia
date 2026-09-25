import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTravelGuide, listTravelGuides, staticTravelGuides } from "../../../db/travel-guides";
import { withPublicDataTimeout } from "../../../lib/public-data-timeout";
import { GuideDetailPage } from "../guide-detail-page";

export const dynamic = "force-dynamic";

async function loadArticle(slug: string) {
  const fallbackArticle = () => staticTravelGuides().find((item) => item.slug === slug) || null;
  return withPublicDataTimeout(
    getTravelGuide(slug),
    fallbackArticle,
    `Public travel guide detail query: ${slug}`,
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadArticle(slug);
  if (!article) return {};
  const title = `${article.titleZh}｜MAD MAX`;
  const description = article.summaryZh || [article.category, article.city].filter(Boolean).join(" · ");
  const image = article.coverImage || "/og.png";
  const url = `/photography/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await loadArticle(slug);
  const articles = await withPublicDataTimeout(
    listTravelGuides(),
    () => staticTravelGuides(),
    "Public related travel guides query",
  );
  if (!article) notFound();
  const related = articles.filter((item) => item.status === "published" && item.city === article.city && item.slug !== article.slug);

  return <GuideDetailPage article={article} related={related} />;
}
