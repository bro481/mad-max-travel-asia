import { RoomDetail } from "./room-detail";

export default async function RoomPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  if (process.env.LOCAL_BROWSER_PREVIEW === "1" || process.env.VERCEL === "1") {
    const { rooms } = await import("../../data");
    const room = rooms.find((item) => item.id === slug);
    if (!room)return <main className="not-found"><h1>Room not found</h1><a className="button" href="/#stays">Explore our stays</a></main>;
    return <RoomDetail room={room}/>;
  }

  const { getPublishedPropertyBySlug, propertyToRoom } = await import("../../../db/properties");
  const property=await getPublishedPropertyBySlug(slug);
  if(!property)return <main className="not-found"><h1>Room not found</h1><a className="button" href="/#stays">Explore our stays</a></main>;
  return <RoomDetail room={propertyToRoom(property)}/>;
}
