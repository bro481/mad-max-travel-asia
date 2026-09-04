/* eslint-disable react-hooks/rules-of-hooks */
import { NextResponse } from "next/server";
import { listDestinations, staticDestinations, type DestinationRecord } from "../../../db/destinations";
import { listProperties, staticPropertyRecords } from "../../../db/properties";
import { listServiceItems, staticServiceItemRecords } from "../../../db/service-items";
import { listLocalDestinations, useLocalDestinations } from "../admin/destinations/local-dev-store";
import { listLocalProperties, useLocalProperties } from "../admin/properties/local-dev-store";
import { listLocalServiceItems, useLocalServiceItems } from "../admin/service-items/local-dev-store";

type Surface = "properties" | "services";

function filterDestinations(items: DestinationRecord[], surface: Surface, propertyCities: string[], serviceCities: string[]) {
  return items
    .filter((item) => item.status === "visible")
    .filter((item) => (surface === "properties" ? item.useForProperties : item.useForServices))
    .filter((item) => {
      if (!item.onlyShowWithContent) return true;
      return surface === "properties" ? propertyCities.includes(item.nameZh) : serviceCities.includes(item.nameZh);
    })
    .sort((a, b) => (surface === "properties" ? a.propertySort - b.propertySort : a.serviceSort - b.serviceSort) || a.id - b.id);
}

export async function GET(request: Request) {
  const surface = new URL(request.url).searchParams.get("surface") === "services" ? "services" : "properties";
  if (process.env.LOCAL_BROWSER_PREVIEW === "1") {
    return NextResponse.json(filterDestinations(staticDestinations, surface, ["吉隆坡", "亚庇", "仙本那"], ["吉隆坡", "亚庇", "仙本那", "马六甲", "新加坡"]));
  }
  let destinations: DestinationRecord[];
  let properties: Awaited<ReturnType<typeof listProperties>>;
  let services: Awaited<ReturnType<typeof listServiceItems>>;
  try {
    [destinations, properties, services] = await Promise.all([
      useLocalDestinations() ? Promise.resolve(listLocalDestinations()) : listDestinations(true),
      useLocalProperties() ? Promise.resolve(listLocalProperties()) : listProperties(),
      useLocalServiceItems() ? Promise.resolve(listLocalServiceItems()) : listServiceItems(),
    ]);
  } catch (error) {
    console.error("Failed to load destination filters from database", error);
    destinations = staticDestinations;
    properties = staticPropertyRecords();
    services = staticServiceItemRecords();
  }
  const propertyCities = properties.filter((item) => item.status === "published").map((item) => item.city);
  const serviceCities = services.filter((item) => item.status === "published").map((item) => item.city);
  return NextResponse.json(filterDestinations(destinations, surface, propertyCities, serviceCities), {
    headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400" },
  });
}
