/* eslint-disable react-hooks/rules-of-hooks */
import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import {
  createDestination,
  ensureDestinations,
  listDestinations,
  staticDestinations,
  type DestinationRecord,
} from "../../../../db/destinations";
import { staticPropertyRecords } from "../../../../db/properties";
import { staticServiceItemRecords } from "../../../../db/service-items";
import { listLocalProperties, useLocalProperties } from "../properties/local-dev-store";
import { listLocalServiceItems, useLocalServiceItems } from "../service-items/local-dev-store";
import {
  createLocalDestination,
  listLocalDestinations,
  useLocalDestinations,
} from "./local-dev-store";
import { revalidatePublicContent } from "../../../../lib/revalidate-public-content";

export type DestinationWithCounts = DestinationRecord & {
  propertyCount: number;
  publishedPropertyCount: number;
  serviceCount: number;
  publishedServiceCount: number;
};

function withLocalCounts(items: DestinationRecord[]): DestinationWithCounts[] {
  const properties = useLocalProperties() ? listLocalProperties() : [];
  const services = useLocalServiceItems() ? listLocalServiceItems() : [];
  return items.map((item) => ({
    ...item,
    propertyCount: properties.filter((x) => x.city === item.nameZh).length,
    publishedPropertyCount: properties.filter((x) => x.city === item.nameZh && x.status === "published").length,
    serviceCount: services.filter((x) => x.city === item.nameZh).length,
    publishedServiceCount: services.filter((x) => x.city === item.nameZh && x.status === "published").length,
  }));
}

function withStaticCounts(items: DestinationRecord[]): DestinationWithCounts[] {
  const properties = staticPropertyRecords();
  const services = staticServiceItemRecords();
  return items.map((item) => ({
    ...item,
    propertyCount: properties.filter((x) => x.city === item.nameZh).length,
    publishedPropertyCount: properties.filter((x) => x.city === item.nameZh && x.status === "published").length,
    serviceCount: services.filter((x) => x.city === item.nameZh).length,
    publishedServiceCount: services.filter((x) => x.city === item.nameZh && x.status === "published").length,
  }));
}

async function withDbCounts(items: DestinationRecord[]): Promise<DestinationWithCounts[]> {
  type CountRow = { city: string; total: number; published: number };
  const [propertyResult, serviceResult] = await Promise.all([
    env.DB.prepare(
      "SELECT city, COUNT(*) AS total, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) AS published FROM properties GROUP BY city",
    ).all<CountRow>(),
    env.DB.prepare(
      "SELECT city, COUNT(*) AS total, SUM(CASE WHEN status='published' THEN 1 ELSE 0 END) AS published FROM service_items GROUP BY city",
    ).all<CountRow>(),
  ]);
  const properties = new Map(propertyResult.results.map((row) => [row.city, row]));
  const services = new Map(serviceResult.results.map((row) => [row.city, row]));
  return items.map((item) => ({
    ...item,
    propertyCount: Number(properties.get(item.nameZh)?.total || 0),
    publishedPropertyCount: Number(properties.get(item.nameZh)?.published || 0),
    serviceCount: Number(services.get(item.nameZh)?.total || 0),
    publishedServiceCount: Number(services.get(item.nameZh)?.published || 0),
  }));
}

export async function GET(request: Request) {
  if (!(await getChatGPTUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const optionsOnly = new URL(request.url).searchParams.get("view") === "options";
  if (useLocalDestinations()) {
    const items = listLocalDestinations();
    return NextResponse.json(optionsOnly ? items : withLocalCounts(items));
  }
  try {
    // Editors only need destination labels and ids. Avoid the schema check and
    // four COUNT queries per destination that are required by the management page.
    if (optionsOnly) return NextResponse.json(await listDestinations(true));
    await ensureDestinations();
    return NextResponse.json(await withDbCounts(await listDestinations(true)));
  } catch (error) {
    console.error("Failed to load destinations from database", error);
    return NextResponse.json(optionsOnly ? staticDestinations : withStaticCounts(staticDestinations), {
      headers: { "x-admin-data-source": "static-fallback" },
    });
  }
}

export async function POST(request: Request) {
  if (!(await getChatGPTUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (useLocalDestinations()) {
    const item = createLocalDestination(body);
    revalidatePublicContent("destinations");
    return NextResponse.json(item, { status: 201 });
  }
  const result = await createDestination(body);
  revalidatePublicContent("destinations");
  return NextResponse.json(result, { status: 201 });
}
