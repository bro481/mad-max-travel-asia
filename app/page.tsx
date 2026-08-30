import { HomePage } from "./home-page";
import type { Room } from "./data";
import type { DestinationRecord } from "../db/destinations";

export const dynamic="force-dynamic";
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
  const [destinationResult, propertyResult] = await Promise.allSettled([
    listDestinations(true),
    listProperties(),
  ]);
  const pageDestinations: DestinationRecord[] = destinationResult.status === "fulfilled" ? destinationResult.value : staticDestinations;
  const pageRooms: Room[] = propertyResult.status === "fulfilled"
    ? propertyResult.value.filter((item)=>item.status==="published").map((item)=>propertyToRoom(item,pageDestinations))
    : rooms;
  return <HomePage rooms={pageRooms} destinations={pageDestinations} />;
}
