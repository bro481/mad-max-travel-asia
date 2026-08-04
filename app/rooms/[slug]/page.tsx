import { rooms } from "../../data";
import { RoomDetail } from "./room-detail";

export default async function RoomPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const room=rooms.find(r=>r.id===slug);
  if(!room)return <main className="not-found"><h1>Room not found</h1><a className="button" href="/#stays">Explore our stays</a></main>;
  return <RoomDetail room={room}/>;
}
