import { ServicesPage } from "./services-page";
import { unstable_cache } from "next/cache";
import type { DestinationRecord } from "../../db/destinations";
import type { ServiceCategory } from "../../db/services";
import type { ServiceItem } from "../../db/service-items";

export const dynamic = "force-dynamic";

function withTimeout<T>(promise: Promise<T>, timeoutMs = 8000) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Public services query timed out")), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

const loadPublicServices = unstable_cache(
  async () => {
    const { listServices, staticServiceCategories } = await import("../../db/services");
    const { listDestinations, staticDestinations } = await import("../../db/destinations");
    const { listServiceItems } = await import("../../db/service-items");
    const [servicesResult, destinationsResult, managedResult] = await Promise.allSettled([
      withTimeout(listServices()),
      withTimeout(listDestinations(true)),
      withTimeout(listServiceItems()),
    ]);
    return {
      services:
        servicesResult.status === "fulfilled"
          ? servicesResult.value
          : staticServiceCategories(),
      destinationSettings:
        destinationsResult.status === "fulfilled"
          ? destinationsResult.value
          : staticDestinations,
      managed:
        managedResult.status === "fulfilled" ? managedResult.value : [],
    } satisfies {
      services: ServiceCategory[];
      destinationSettings: DestinationRecord[];
      managed: ServiceItem[];
    };
  },
  ["public-services-page-data"],
  { revalidate: 300 },
);

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
