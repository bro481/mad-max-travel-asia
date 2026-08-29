import { ServicesPage } from "./services-page";
import type { DestinationRecord } from "../../db/destinations";
import type { ServiceItem } from "../../db/service-items";
import type { ServiceCategory } from "../../db/services";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (process.env.NODE_ENV === "development") {
    const { listLocalDestinations } = await import("../api/admin/destinations/local-dev-store");
    const { listLocalServiceCategories } = await import("../api/admin/services/local-dev-store");
    const { listLocalServiceItems } = await import("../api/admin/service-items/local-dev-store");
    return <ServicesPage services={listLocalServiceCategories()} managed={listLocalServiceItems()} destinationSettings={listLocalDestinations()} />;
  }
  if (process.env.LOCAL_BROWSER_PREVIEW === "1") {
    const { staticDestinations } = await import("../../db/destinations");
    const { staticServiceCategories } = await import("../../db/services");
    const { staticServiceItemRecords } = await import("../../db/service-items");
    return <ServicesPage services={staticServiceCategories()} managed={staticServiceItemRecords()} destinationSettings={staticDestinations} />;
  }

  let services: ServiceCategory[] = [];
  let managed: ServiceItem[] = [];
  let destinationSettings: DestinationRecord[];
  try {
    const { listServices } = await import("../../db/services");
    const { listDestinations } = await import("../../db/destinations");
    const { listServiceItems } = await import("../../db/service-items");
    services = await listServices();
    managed = await listServiceItems();
    destinationSettings = await listDestinations(true);
  } catch {
    const { staticDestinations } = await import("../../db/destinations");
    const { staticServiceCategories } = await import("../../db/services");
    const { staticServiceItemRecords } = await import("../../db/service-items");
    services = staticServiceCategories();
    managed = staticServiceItemRecords();
    destinationSettings = staticDestinations;
  }
  return <ServicesPage services={services} managed={managed} destinationSettings={destinationSettings} />;
}
