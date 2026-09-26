import { HomePage } from "./home-page";
import type { Metadata } from "next";
import type { Room } from "./data";
import type { DestinationRecord } from "../db/destinations";
import { withPublicDataTimeout } from "../lib/public-data-timeout";

export const revalidate = 300;

async function roomForSlug(slug?: string) {
  if (!slug) return null;
  const fallback = async () => {
    const { rooms } = await import("./data");
    return rooms.find((item) => item.id === slug) || null;
  };
  if (process.env.LOCAL_BROWSER_PREVIEW === "1" || process.env.NODE_ENV === "development") {
    return fallback();
  }
  try {
    const { getPublishedPropertyBySlug, propertyToRoom } = await import("../db/properties");
    const property = await withPublicDataTimeout(
      getPublishedPropertyBySlug(slug),
      null,
      `Home room metadata query: ${slug}`,
    );
    if (property) return propertyToRoom(property);
  } catch {}
  return fallback();
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}): Promise<Metadata> {
  const { room: roomSlug } = await searchParams;
  const room = await roomForSlug(roomSlug);
  if (!room) return {};
  const title = `${room.name.zh}｜MAD MAX`;
  const description = `${room.bedrooms}房${room.bathrooms}卫 · ${room.location.zh} · ${room.area.zh}`;
  const image = room.images[0] || "/og.png";
  const url = `/?room=${encodeURIComponent(room.id)}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const { room: initialRoomId } = await searchParams;
  if (
    process.env.LOCAL_BROWSER_PREVIEW === "1" ||
    process.env.NODE_ENV === "development"
  ) {
    const { rooms } = await import("./data");
    const { staticDestinations } = await import("../db/destinations");
    return <HomePage rooms={rooms} destinations={staticDestinations} initialRoomId={initialRoomId} />;
  }

  const [{ staticDestinations, listDestinations }, { listProperties, propertyToRoom }] = await Promise.all([
    import("../db/destinations"),
    import("../db/properties"),
  ]);
  const [pageDestinations, properties] = await Promise.all([
    withPublicDataTimeout(
      listDestinations(true),
      staticDestinations,
      "Public home destinations query",
    ),
    withPublicDataTimeout(
      listProperties(),
      [],
      "Public home properties query",
    ),
  ]);
  const pageRooms: Room[] = properties
    .filter((item) => item.status === "published")
    .map((item) => propertyToRoom(item, pageDestinations));
  return <HomePage rooms={pageRooms} destinations={pageDestinations} initialRoomId={initialRoomId} />;
}
