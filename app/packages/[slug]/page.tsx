import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTravelPackage, staticTravelPackages } from "../../../db/packages";
import { listProperties, staticPropertyRecords } from "../../../db/properties";
import { listServiceItems, staticServiceItemRecords } from "../../../db/service-items";
import { withPublicDataTimeout } from "../../../lib/public-data-timeout";
import { PackageDetailPage } from "./package-detail-page";

export const dynamic = "force-dynamic";

async function loadPackage(slug: string) {
  const fallback = () => staticTravelPackages().find((pkg) => pkg.slug === slug) || null;
  return withPublicDataTimeout(
    getTravelPackage(slug),
    fallback,
    `Public package detail query: ${slug}`,
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await loadPackage(slug);
  if (!item) return {};
  const title = item.nameZh;
  const description = [`${item.days}天${item.nights}晚`, item.cityComboZh, item.summaryZh].filter(Boolean).join(" · ");
  const image = item.coverImage || item.galleryImages[0] || "/og.png";
  const url = `/packages/${slug}`;
  return {
    title: `${title}｜MAD MAX`,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${title}｜MAD MAX`, description, url, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: `${title}｜MAD MAX`, description, images: [image] },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await loadPackage(slug);
  const [properties, services] = await Promise.all([
    withPublicDataTimeout(
      listProperties(),
      () => staticPropertyRecords(),
      "Public package linked properties query",
    ),
    withPublicDataTimeout(
      listServiceItems(),
      () => staticServiceItemRecords(),
      "Public package linked services query",
    ),
  ]);
  if (!item) notFound();
  return (
    <PackageDetailPage
      item={item}
      properties={properties.map((property) => ({ id: property.id, slug: property.slug, nameZh: property.nameZh, nameEn: property.nameEn }))}
      services={services.map((service) => ({ id: service.id, slug: service.slug, nameZh: service.nameZh, nameEn: service.nameEn }))}
    />
  );
}
