import { notFound } from "next/navigation";
import { getTravelPackage, staticTravelPackages } from "../../../db/packages";
import { PackageDetailPage } from "./package-detail-page";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let item = null;
  try {
    item = await getTravelPackage(slug);
  } catch (error) {
    console.error("Failed to load travel package detail", error);
    item = staticTravelPackages().find((pkg) => pkg.slug === slug) || null;
  }
  if (!item) notFound();
  return <PackageDetailPage item={item} />;
}
