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
import { ensureProperties, staticPropertyRecords } from "../../../../db/properties";
import { ensureServiceItems, staticServiceItemRecords } from "../../../../db/service-items";
import { listLocalProperties, useLocalProperties } from "../properties/local-dev-store";
import { listLocalServiceItems, useLocalServiceItems } from "../service-items/local-dev-store";
import {
  createLocalDestination,
  listLocalDestinations,
  useLocalDestinations,
} from "./local-dev-store";

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
  await ensureProperties();
  await ensureServiceItems();
  return Promise.all(
    items.map(async (item) => {
      const [properties, publishedProperties, services, publishedServices] = await Promise.all([
        env.DB.prepare("SELECT COUNT(*) AS total FROM properties WHERE city=?").bind(item.nameZh).first<{ total: number }>(),
        env.DB.prepare("SELECT COUNT(*) AS total FROM properties WHERE city=? AND status='published'").bind(item.nameZh).first<{ total: number }>(),
        env.DB.prepare("SELECT COUNT(*) AS total FROM service_items WHERE city=?").bind(item.nameZh).first<{ total: number }>(),
        env.DB.prepare("SELECT COUNT(*) AS total FROM service_items WHERE city=? AND status='published'").bind(item.nameZh).first<{ total: number }>(),
      ]);
      return {
        ...item,
        propertyCount: Number(properties?.total || 0),
        publishedPropertyCount: Number(publishedProperties?.total || 0),
        serviceCount: Number(services?.total || 0),
        publishedServiceCount: Number(publishedServices?.total || 0),
      };
    }),
  );
}

export async function GET() {
  if (!(await getChatGPTUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (useLocalDestinations()) return NextResponse.json(withLocalCounts(listLocalDestinations()));
  try {
    await ensureDestinations();
    return NextResponse.json(await withDbCounts(await listDestinations(true)));
  } catch (error) {
    console.error("Failed to load destinations from database", error);
    return NextResponse.json(withStaticCounts(staticDestinations), {
      headers: { "x-admin-data-source": "static-fallback" },
    });
  }
}

export async function POST(request: Request) {
  if (!(await getChatGPTUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  if (useLocalDestinations()) {
    const item = createLocalDestination(body);
    return NextResponse.json(item, { status: 201 });
  }
  const result = await createDestination(body);
  return NextResponse.json(result, { status: 201 });
}
