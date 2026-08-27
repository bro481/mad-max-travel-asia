import { ServicesPage } from "./services-page";
import type { DestinationRecord } from "../../db/destinations";
import type { ServiceCategory } from "../../db/services";

export default async function Page() {
  if (process.env.NODE_ENV === "development") {
    const { listLocalDestinations } = await import("../api/admin/destinations/local-dev-store");
    const { listLocalServiceCategories } = await import("../api/admin/services/local-dev-store");
    return <ServicesPage services={listLocalServiceCategories()} managed={[]} destinationSettings={listLocalDestinations()} />;
  }
  if (process.env.LOCAL_BROWSER_PREVIEW === "1") {
    const { staticDestinations } = await import("../../db/destinations");
    return <ServicesPage services={[]} managed={[]} destinationSettings={staticDestinations} />;
  }

  let services: ServiceCategory[] = [];
  let destinationSettings: DestinationRecord[];
  try {
    const { listServices } = await import("../../db/services");
    const { listDestinations } = await import("../../db/destinations");
    services = await listServices();
    destinationSettings = await listDestinations(true);
  } catch {
    const { staticDestinations } = await import("../../db/destinations");
    destinationSettings = staticDestinations;
  }
  return <ServicesPage services={services} managed={[]} destinationSettings={destinationSettings} />;
}
