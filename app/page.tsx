import { HomePage } from "./home-page";

export const dynamic="force-dynamic";
export default async function Page() {
  if (process.env.LOCAL_BROWSER_PREVIEW === "1") {
    const { rooms } = await import("./data");
    return <HomePage rooms={rooms} />;
  }

  const { listProperties, propertyToRoom } = await import("../db/properties");
  const rooms=(await listProperties()).filter(x=>x.status==="published").map(propertyToRoom);
  return <HomePage rooms={rooms}/>;
}
