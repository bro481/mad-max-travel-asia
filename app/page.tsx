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

  let pageRooms: Room[];
  let pageDestinations: DestinationRecord[];
  try {
    const { listProperties, propertyToRoom } = await import("../db/properties");
    const { listDestinations } = await import("../db/destinations");
    pageDestinations = await listDestinations(true);
    pageRooms=(await listProperties()).filter(x=>x.status==="published").map((item)=>propertyToRoom(item,pageDestinations));
  } catch {
    const { rooms } = await import("./data");
    const { staticDestinations } = await import("../db/destinations");
    pageRooms = rooms;
    pageDestinations = staticDestinations;
  }
  return <HomePage rooms={pageRooms} destinations={pageDestinations} />;
}
