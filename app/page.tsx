import { HomePage } from "./home-page";

export const dynamic="force-dynamic";
export default async function Page() {
  if (
    process.env.LOCAL_BROWSER_PREVIEW === "1" ||
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "development"
  ) {
    const { rooms } = await import("./data");
    const { staticDestinations } = await import("../db/destinations");
    return <HomePage rooms={rooms} destinations={staticDestinations} />;
  }

  try {
    const { listProperties, propertyToRoom } = await import("../db/properties");
    const { listDestinations } = await import("../db/destinations");
    const destinations = await listDestinations(true);
    const rooms=(await listProperties()).filter(x=>x.status==="published").map((item)=>propertyToRoom(item,destinations));
    return <HomePage rooms={rooms} destinations={destinations}/>;
  } catch {
    const { rooms } = await import("./data");
    const { staticDestinations } = await import("../db/destinations");
    return <HomePage rooms={rooms} destinations={staticDestinations} />;
  }
}
