import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { withPublicDataTimeout } from "../../../../lib/public-data-timeout";
import { getServiceItemBySlug, staticServiceItemRecords } from "../../../../db/service-items";
import { ServiceProductDetail } from "./service-product-detail";

export const dynamic = "force-dynamic";

async function loadService(slug: string) {
  return withPublicDataTimeout(
    getServiceItemBySlug(slug),
    () => staticServiceItemRecords().find((item) => item.slug === slug && item.status === "published") || null,
    `Public service item detail query: ${slug}`,
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await loadService(slug);
  if (!item) return {};
  const routeImage = item.routes.map((route) => route.coverImage || route.image || route.nodes?.find((node) => node.image)?.image || "").find(Boolean);
  const image = item.coverImage || item.images[0] || item.gallery?.[0] || routeImage || "/og.png";
  const title = item.nameZh;
  const description = [item.subtitleZh, item.city, item.tags.slice(0, 2).join(" · ")].filter(Boolean).join(" · ");
  const url = `/services/item/${slug}`;
  return {
    title: `${title} | MAD MAX`,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await loadService(slug);
  if (!service) notFound();
  return <ServiceProductDetail service={service} />;
}
