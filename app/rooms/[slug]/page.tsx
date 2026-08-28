import Link from "next/link";
import { RoomDetail } from "./room-detail";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const { rooms } = await import("../../data");
  return rooms.map((room) => ({ slug: room.id }));
}

export default async function RoomPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  if (process.env.LOCAL_BROWSER_PREVIEW === "1" || process.env.NODE_ENV === "development") {
    const { rooms } = await import("../../data");
    const room = rooms.find((item) => item.id === slug);
    if (!room)return <main className="not-found"><h1>Room not found</h1><Link className="button" href="/#stays">Explore our stays</Link></main>;
    return <RoomDetail room={room}/>;
  }

  let dbRoom = null;
  try {
    const { getPublishedPropertyBySlug, propertyToRoom } = await import("../../../db/properties");
    const property=await getPublishedPropertyBySlug(slug);
    dbRoom = property ? propertyToRoom(property) : null;
  } catch {}
  if(dbRoom)return <RoomDetail room={dbRoom}/>;
  const { rooms } = await import("../../data");
  const room = rooms.find((item) => item.id === slug);
  if(!room)return <main className="not-found"><h1>Room not found</h1><Link className="button" href="/#stays">Explore our stays</Link></main>;
  return <RoomDetail room={room}/>;
}
