import { notFound } from "next/navigation";
import Link from "next/link";
import { getTravelGuide, staticTravelGuides } from "../../../db/travel-guides";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let article = staticTravelGuides().find((item) => item.slug === slug) || null;
  try {
    article = await getTravelGuide(slug);
  } catch (error) {
    console.error("Failed to load travel guide detail", error);
  }
  if (!article) notFound();

  return (
    <main className="guide-detail-placeholder">
      <Link href="/photography">← 返回旅行攻略</Link>
      <p>{article.category}</p>
      <h1>{article.titleZh}</h1>
      <span>约 {article.readMinutes} 分钟阅读</span>
    </main>
  );
}
