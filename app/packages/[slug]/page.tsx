import { notFound } from "next/navigation";
import { getTravelPackage, staticTravelPackages } from "../../../db/packages";
import { listProperties, staticPropertyRecords } from "../../../db/properties";
import { listServiceItems, staticServiceItemRecords } from "../../../db/service-items";
import { withPublicDataTimeout } from "../../../lib/public-data-timeout";
import { PackageDetailPage } from "./package-detail-page";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fallback = () => staticTravelPackages().find((pkg) => pkg.slug === slug) || null;
  const item = await withPublicDataTimeout(
    getTravelPackage(slug),
    fallback,
    `Public package detail query: ${slug}`,
  );
  const properties = await withPublicDataTimeout(
    listProperties(),
    () => staticPropertyRecords(),
    "Public package linked properties query",
  );
  const services = await withPublicDataTimeout(
    listServiceItems(),
    () => staticServiceItemRecords(),
    "Public package linked services query",
  );
  if (!item) notFound();
  return (
    <PackageDetailPage
      item={item}
      properties={properties.map((property) => ({ id: property.id, slug: property.slug, nameZh: property.nameZh, nameEn: property.nameEn }))}
      services={services.map((service) => ({ id: service.id, slug: service.slug, nameZh: service.nameZh, nameEn: service.nameEn }))}
    />
  );
}
