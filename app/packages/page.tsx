import { listTravelPackages, staticTravelPackages } from "../../db/packages";
import { withPublicDataTimeout } from "../../lib/public-data-timeout";
import { PackagesPage } from "./packages-page";

export const dynamic = "force-dynamic";

export default async function Page() {
  const packages = await withPublicDataTimeout(
    listTravelPackages(),
    () => staticTravelPackages(),
    "Public packages list query",
  );
  return <PackagesPage packages={packages} />;
}
