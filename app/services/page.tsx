import { ServicesPage } from "./services-page";
import type { DestinationRecord } from "../../db/destinations";
import type { ServiceCategory } from "../../db/services";
import type { ServiceItem } from "../../db/service-items";
import { withPublicDataTimeout } from "../../lib/public-data-timeout";

export const dynamic = "force-dynamic";

async function loadPublicServices() {
  const { listServices, staticServiceCategories } = await import("../../db/services");
  const { listDestinations, staticDestinations } = await import("../../db/destinations");
  const { listServiceItems } = await import("../../db/service-items");
  const [services, destinationSettings, managed] = await Promise.all([
    withPublicDataTimeout(
      listServices(),
      () => staticServiceCategories(),
      "Public services categories query",
    ),
    withPublicDataTimeout(
      listDestinations(true),
      staticDestinations,
      "Public services destinations query",
    ),
    withPublicDataTimeout(
      listServiceItems(),
      [],
      "Public service items query",
    ),
  ]);
  return {
    services,
    destinationSettings,
    managed,
  } satisfies {
    services: ServiceCategory[];
    destinationSettings: DestinationRecord[];
    managed: ServiceItem[];
  };
}

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

  const { services, managed, destinationSettings } = await loadPublicServices();
  return <ServicesPage services={services} managed={managed} destinationSettings={destinationSettings} />;
}
