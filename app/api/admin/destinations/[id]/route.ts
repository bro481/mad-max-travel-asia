import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { deleteDestination, updateDestination } from "../../../../../db/destinations";
import { ensureProperties } from "../../../../../db/properties";
import { ensureServiceItems } from "../../../../../db/service-items";
import { listLocalProperties, useLocalProperties } from "../../properties/local-dev-store";
import { listLocalServiceItems, useLocalServiceItems } from "../../service-items/local-dev-store";
import {
  deleteLocalDestination,
  listLocalDestinations,
  updateLocalDestination,
  useLocalDestinations,
} from "../local-dev-store";

async function associationCounts(nameZh: string) {
  if (useLocalProperties() || useLocalServiceItems()) {
    const propertyCount = useLocalProperties() ? listLocalProperties().filter((x) => x.city === nameZh).length : 0;
    const serviceCount = useLocalServiceItems() ? listLocalServiceItems().filter((x) => x.city === nameZh).length : 0;
    return { propertyCount, serviceCount };
  }
  await ensureProperties();
  await ensureServiceItems();
  const [properties, services] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS total FROM properties WHERE city=?").bind(nameZh).first<{ total: number }>(),
    env.DB.prepare("SELECT COUNT(*) AS total FROM service_items WHERE city=?").bind(nameZh).first<{ total: number }>(),
  ]);
  return { propertyCount: Number(properties?.total || 0), serviceCount: Number(services?.total || 0) };
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getChatGPTUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  if (useLocalDestinations()) {
    const item = updateLocalDestination(Number(id), body);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  }
  const item = await updateDestination(Number(id), body);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getChatGPTUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const current = useLocalDestinations()
    ? listLocalDestinations().find((item) => item.id === Number(id))
    : ((await env.DB.prepare("SELECT name_zh FROM destinations WHERE id=?").bind(Number(id)).first()) as { name_zh?: string } | null);
  const nameZh = useLocalDestinations() ? current?.nameZh : current?.name_zh;
  if (!nameZh) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const counts = await associationCounts(String(nameZh));
  if (counts.propertyCount || counts.serviceCount) {
    return NextResponse.json(
      {
        error: `该目的地当前关联 ${counts.propertyCount} 个房源和 ${counts.serviceCount} 个服务，请先移动关联内容或改为隐藏。`,
      },
      { status: 409 },
    );
  }
  if (useLocalDestinations()) deleteLocalDestination(Number(id));
  else await deleteDestination(Number(id));
  return NextResponse.json({ ok: true });
}
