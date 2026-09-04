/* eslint-disable react-hooks/rules-of-hooks */
import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import {
  ensureProperties,
  listProperties,
} from "../../../../db/properties";
import {
  createLocalProperty,
  listLocalProperties,
  useLocalProperties,
} from "./local-dev-store";
import { listDestinations, staticDestinations } from "../../../../db/destinations";
import { listLocalDestinations, useLocalDestinations } from "../destinations/local-dev-store";
import { revalidatePublicContent } from "../../../../lib/revalidate-public-content";

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
    withTimeout(listProperties(), 9000, "properties query"),
    includeDestinations
      ? withTimeout(listDestinations(true), 9000, "destinations query")
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
  if (propertyResult.status === "rejected")
    return NextResponse.json(
      { error: "房源数据库暂时连接不上，请稍后重试。已有房源数据不会被覆盖。" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store", "Retry-After": "1" },
      },
    );
  const properties = propertyResult.value;
  if (!includeDestinations)
    return NextResponse.json(properties, {
      headers: { "Cache-Control": "no-store", "x-admin-data-source": "database" },
    });
  const destinations =
    destinationResult.status === "fulfilled"
      ? destinationResult.value
      : staticDestinations;
  const usedFallback = destinationResult.status === "rejected";
  return NextResponse.json(
    { properties, destinations },
    {
      headers: {
        "Cache-Control": "no-store",
        "x-admin-data-source": usedFallback ? "database-with-destination-fallback" : "database",
      },
    },
  );
}
export async function POST(request: Request) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = (await request.json()) as Record<string, unknown>;
  if (useLocalProperties()) {
    const item = createLocalProperty(b);
    revalidatePublicContent("properties");
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
    revalidatePublicContent("properties");
    return NextResponse.json(
      { id: result.meta.last_row_id, slug },
      { status: 201 },
    );
  } catch (error) {
    return databaseWriteError(error);
  }
}
