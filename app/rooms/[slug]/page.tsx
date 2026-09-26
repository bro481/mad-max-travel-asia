import Link from "next/link";
import type { Metadata } from "next";
import { withPublicDataTimeout } from "../../../lib/public-data-timeout";
import { RoomDetail } from "./room-detail";

export const revalidate = 300;

export async function generateStaticParams() {
  const { rooms } = await import("../../data");
  return rooms.map((room) => ({ slug: room.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const fallback = async () => {
    const { rooms } = await import("../../data");
    return rooms.find((item) => item.id === slug) || null;
  };
  let room = await fallback();
  if (process.env.NODE_ENV !== "development") {
    try {
      const { getPublishedPropertyBySlug, propertyToRoom } = await import("../../../db/properties");
      const property = await withPublicDataTimeout(getPublishedPropertyBySlug(slug), null, `Room metadata query: ${slug}`);
      if (property) room = propertyToRoom(property);
    } catch {}
  }
  if (!room) return {};
  const title = room.name.zh;
  const description = `${room.bedrooms}房${room.bathrooms}卫 · ${room.location.zh} · ${room.area.zh}`;
  const image = room.images[0] || "/og.png";
  const url = `/rooms/${slug}`;
  return {
    title: `${title}｜MAD MAX`,
    description,
    alternates: { canonical: url },
    openGraph: { title: `${title}｜MAD MAX`, description, url, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: `${title}｜MAD MAX`, description, images: [image] },
  };
}

export default async function RoomPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const { rooms } = await import("../../data");
  const fallbackRoom = rooms.find((item) => item.id === slug);
  if (process.env.LOCAL_BROWSER_PREVIEW === "1" || process.env.NODE_ENV === "development") {
    if (!fallbackRoom)return <main className="not-found"><h1>Room not found</h1><Link className="button" href="/#stays">Explore our stays</Link></main>;
    return <RoomDetail room={fallbackRoom}/>;
  }

  let dbRoom = null;
  try {
    const { getPublishedPropertyBySlug, propertyToRoom } = await import("../../../db/properties");
    const property = await withPublicDataTimeout(
      getPublishedPropertyBySlug(slug),
      null,
      `Public room detail query: ${slug}`,
    );
    dbRoom = property ? propertyToRoom(property) : null;
  } catch {}
  if(dbRoom)return <RoomDetail room={dbRoom}/>;
  if(fallbackRoom)return <RoomDetail room={fallbackRoom}/>;
  return (
    <main className="not-found">
      <h1>Room temporarily unavailable</h1>
      <p>房源数据暂时无法加载，请稍后再试。</p>
      <Link className="button" href="/#stays">Explore our stays</Link>
    </main>
  );
}
