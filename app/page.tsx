import { HomePage } from "./home-page";
import {listProperties,propertyToRoom} from "../db/properties";

export const dynamic="force-dynamic";
export default async function Page() {
  const rooms=(await listProperties()).filter(x=>x.status==="published").map(propertyToRoom);
  return <HomePage rooms={rooms}/>;
}
