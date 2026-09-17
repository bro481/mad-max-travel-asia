import { notFound } from "next/navigation";
import { getTravelGuide, listTravelGuides, staticTravelGuides } from "../../../db/travel-guides";
import { withPublicDataTimeout } from "../../../lib/public-data-timeout";
import { GuideDetailPage } from "../guide-detail-page";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fallbackArticle = () => staticTravelGuides().find((item) => item.slug === slug) || null;
  const [article, articles] = await Promise.all([
    withPublicDataTimeout(getTravelGuide(slug), fallbackArticle, `Public travel guide detail query: ${slug}`),
    withPublicDataTimeout(listTravelGuides(), () => staticTravelGuides(), "Public related travel guides query"),
  ]);
  if (!article) notFound();
  const related = articles.filter((item) => item.status === "published" && item.city === article.city && item.slug !== article.slug);

  return <GuideDetailPage article={article} related={related} />;
}
