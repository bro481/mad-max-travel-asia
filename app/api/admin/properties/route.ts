/* eslint-disable react-hooks/rules-of-hooks */
import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import {
  ensureProperties,
  listProperties,
  staticPropertyRecords,
} from "../../../../db/properties";
import {
  createLocalProperty,
  listLocalProperties,
  useLocalProperties,
} from "./local-dev-store";
import { listDestinations, staticDestinations } from "../../../../db/destinations";
import { listLocalDestinations, useLocalDestinations } from "../destinations/local-dev-store";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function databaseWriteError(error: unknown) {
  console.error("Failed to write property to database", error);
  return NextResponse.json(
    {
      error:
        "创建房源失败：数据库暂时连接不上。请检查 Vercel 的 DATABASE_URL 是否使用 Supabase 的 Transaction pooler / Session pooler 完整连接串。",
    },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const includeDestinations =
    new URL(request.url).searchParams.get("include") === "destinations";
  if (useLocalProperties()) {
    const properties = listLocalProperties();
    if (!includeDestinations) return NextResponse.json(properties);
    const destinations = useLocalDestinations()
      ? listLocalDestinations()
      : staticDestinations;
    return NextResponse.json({ properties, destinations });
  }
  const [propertyResult, destinationResult] = await Promise.allSettled([
    withTimeout(listProperties(), 6500, "properties query"),
    includeDestinations
      ? withTimeout(listDestinations(true), 6500, "destinations query")
      : Promise.resolve([]),
  ]);
  if (propertyResult.status === "rejected")
    console.error(
      "Failed to load properties from database",
      propertyResult.reason,
    );
  if (destinationResult.status === "rejected")
    console.error(
      "Failed to load destination options",
      destinationResult.reason,
    );
  const properties =
    propertyResult.status === "fulfilled"
      ? propertyResult.value
      : staticPropertyRecords();
  if (!includeDestinations)
    return NextResponse.json(
      properties,
      propertyResult.status === "rejected"
        ? { headers: { "x-admin-data-source": "static-fallback" } }
        : undefined,
    );
  const destinations =
    destinationResult.status === "fulfilled"
      ? destinationResult.value
      : staticDestinations;
  const usedFallback =
    propertyResult.status === "rejected" ||
    destinationResult.status === "rejected";
  return NextResponse.json(
    { properties, destinations },
    usedFallback
      ? { headers: { "x-admin-data-source": "partial-fallback" } }
      : undefined,
  );
}
export async function POST(request: Request) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = (await request.json()) as Record<string, unknown>;
  if (useLocalProperties()) {
    const item = createLocalProperty(b);
    return NextResponse.json({ id: item.id, slug: item.slug }, { status: 201 });
  }
  try {
    await ensureProperties();
    const base =
      String(b.slug || b.nameEn || "new-stay")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "new-stay";
    let slug = base,
      n = 1;
    while (
      await env.DB.prepare("SELECT id FROM properties WHERE slug=?")
        .bind(slug)
        .first()
    )
      slug = `${base}-${++n}`;
    const result = await env.DB.prepare(
      "INSERT INTO properties (slug,name_zh,name_en,city,status) VALUES (?,?,?,?,?)",
    )
      .bind(
        slug,
        String(b.nameZh || "未命名房源"),
        String(b.nameEn || "Untitled stay"),
        String(b.city || "吉隆坡"),
        "draft",
      )
      .run();
    return NextResponse.json(
      { id: result.meta.last_row_id, slug },
      { status: 201 },
    );
  } catch (error) {
    return databaseWriteError(error);
  }
}
