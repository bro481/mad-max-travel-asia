import { notFound } from "next/navigation";
import { getTravelGuide, listTravelGuides, staticTravelGuides } from "../../../db/travel-guides";
import { GuideDetailPage } from "../guide-detail-page";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let article = staticTravelGuides().find((item) => item.slug === slug) || null;
  let articles = staticTravelGuides();
  try {
    [article, articles] = await Promise.all([getTravelGuide(slug), listTravelGuides()]);
  } catch (error) {
    console.error("Failed to load travel guide detail", error);
  }
  if (!article) notFound();
  const related = articles.filter((item) => item.status === "published" && item.city === article.city && item.slug !== article.slug);

  return <GuideDetailPage article={article} related={related} />;
}
