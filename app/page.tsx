import { HomePage } from "./home-page";
import type { Room } from "./data";
import type { DestinationRecord } from "../db/destinations";
import { withPublicDataTimeout } from "../lib/public-data-timeout";

export const revalidate = 300;
export default async function Page() {
  if (
    process.env.LOCAL_BROWSER_PREVIEW === "1" ||
    process.env.NODE_ENV === "development"
  ) {
    const { rooms } = await import("./data");
    const { staticDestinations } = await import("../db/destinations");
    return <HomePage rooms={rooms} destinations={staticDestinations} />;
  }

  const [{ rooms }, { staticDestinations, listDestinations }, { listProperties, propertyToRoom }] = await Promise.all([
    import("./data"),
    import("../db/destinations"),
    import("../db/properties"),
  ]);
  const pageDestinations = await withPublicDataTimeout(
    listDestinations(true),
    staticDestinations,
    "Public home destinations query",
  );
  const properties = await withPublicDataTimeout(
    listProperties(),
    [],
    "Public home properties query",
  );
  const pageRooms: Room[] = properties.length
    ? properties.filter((item)=>item.status==="published").map((item)=>propertyToRoom(item,pageDestinations))
    : rooms;
  return <HomePage rooms={pageRooms} destinations={pageDestinations} />;
}
