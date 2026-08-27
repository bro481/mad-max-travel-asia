/* eslint-disable react-hooks/rules-of-hooks */
import { NextResponse } from "next/server";
import { listDestinations, staticDestinations, type DestinationRecord } from "../../../db/destinations";
import { listProperties } from "../../../db/properties";
import { listServiceItems } from "../../../db/service-items";
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
  const destinations = useLocalDestinations() ? listLocalDestinations() : await listDestinations(true);
  const properties = useLocalProperties() ? listLocalProperties() : await listProperties();
  const services = useLocalServiceItems() ? listLocalServiceItems() : await listServiceItems();
  const propertyCities = properties.filter((item) => item.status === "published").map((item) => item.city);
  const serviceCities = services.filter((item) => item.status === "published").map((item) => item.city);
  return NextResponse.json(filterDestinations(destinations, surface, propertyCities, serviceCities));
}
