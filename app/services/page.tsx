import { ServicesPage } from "./services-page";
import type { DestinationRecord } from "../../db/destinations";
import type { ServiceCategory } from "../../db/services";
import type { ServiceItem } from "../../db/service-items";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (process.env.NODE_ENV === "development") {
    const { listLocalDestinations } = await import("../api/admin/destinations/local-dev-store");
    const { listLocalServiceCategories } = await import("../api/admin/services/local-dev-store");
    const { listLocalServiceItems } = await import("../api/admin/service-items/local-dev-store");
    return <ServicesPage services={listLocalServiceCategories()} managed={listLocalServiceItems().filter((item) => item.status === "published")} destinationSettings={listLocalDestinations()} />;
  }
  if (process.env.LOCAL_BROWSER_PREVIEW === "1") {
    const { staticDestinations } = await import("../../db/destinations");
    const { staticServiceCategories } = await import("../../db/services");
    return <ServicesPage services={staticServiceCategories()} managed={[]} destinationSettings={staticDestinations} />;
  }

  let services: ServiceCategory[] = [];
  let managed: ServiceItem[] = [];
  const { listServices, staticServiceCategories } = await import("../../db/services");
  const { listDestinations, staticDestinations } = await import("../../db/destinations");
  const { listServiceItems } = await import("../../db/service-items");
  const [servicesResult, destinationsResult, managedResult] = await Promise.allSettled([
    listServices(),
    listDestinations(true),
    listServiceItems(),
  ]);
  services = servicesResult.status === "fulfilled" ? servicesResult.value : staticServiceCategories();
  const destinationSettings: DestinationRecord[] = destinationsResult.status === "fulfilled" ? destinationsResult.value : staticDestinations;
  managed = managedResult.status === "fulfilled" ? managedResult.value : [];
  return <ServicesPage services={services} managed={managed} destinationSettings={destinationSettings} />;
}
