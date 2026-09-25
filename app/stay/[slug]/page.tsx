import type { Metadata } from "next";
import { HomePage } from "../../home-page";
import type { Room } from "../../data";
import { withPublicDataTimeout } from "../../../lib/public-data-timeout";

export const revalidate = 300;

async function fallbackRoom(slug: string) {
  const { rooms } = await import("../../data");
  return rooms.find((item) => item.id === slug) || null;
}

async function roomForSlug(slug: string) {
  if (process.env.LOCAL_BROWSER_PREVIEW === "1" || process.env.NODE_ENV === "development") {
    return fallbackRoom(slug);
  }
  try {
    const { getPublishedPropertyBySlug, propertyToRoom } = await import("../../../db/properties");
    const property = await withPublicDataTimeout(
      getPublishedPropertyBySlug(slug),
      null,
      `Stay room metadata query: ${slug}`,
    );
    if (property) return propertyToRoom(property);
  } catch {}
  return fallbackRoom(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const room = await roomForSlug(slug);
  if (!room) return {};
  const title = `${room.name.zh}｜MAD MAX`;
  const description = `${room.bedrooms}房${room.bathrooms}卫 · ${room.location.zh} · ${room.area.zh}`;
  const image = room.images[0] || "/og.png";
  const url = `/stay/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function StayRoomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (process.env.LOCAL_BROWSER_PREVIEW === "1" || process.env.NODE_ENV === "development") {
    const { rooms } = await import("../../data");
    const { staticDestinations } = await import("../../../db/destinations");
    return <HomePage rooms={rooms} destinations={staticDestinations} initialRoomId={slug} />;
  }

  const [{ staticDestinations, listDestinations }, { listProperties, propertyToRoom }] = await Promise.all([
    import("../../../db/destinations"),
    import("../../../db/properties"),
  ]);
  const pageDestinations = await withPublicDataTimeout(
    listDestinations(true),
    staticDestinations,
    "Stay room destinations query",
  );
  const properties = await withPublicDataTimeout(
    listProperties(),
    [],
    "Stay room properties query",
  );
  const pageRooms: Room[] = properties
    .filter((item) => item.status === "published")
    .map((item) => propertyToRoom(item, pageDestinations));
  return <HomePage rooms={pageRooms} destinations={pageDestinations} initialRoomId={slug} />;
}
