import { listTravelPackages, staticTravelPackages } from "../../db/packages";
import { PackagesPage } from "./packages-page";

export const dynamic = "force-dynamic";

export default async function Page() {
  let packages = staticTravelPackages();
  try {
    packages = await listTravelPackages();
  } catch (error) {
    console.error("Failed to load travel packages for public page", error);
  }
  return <PackagesPage packages={packages} />;
}
