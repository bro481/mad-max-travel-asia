import { RoomDetail } from "./room-detail";
import {getPublishedPropertyBySlug,propertyToRoom} from "../../../db/properties";

export default async function RoomPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const property=await getPublishedPropertyBySlug(slug);
  if(!property)return <main className="not-found"><h1>Room not found</h1><a className="button" href="/#stays">Explore our stays</a></main>;
  return <RoomDetail room={propertyToRoom(property)}/>;
}
