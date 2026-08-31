/* eslint-disable react-hooks/rules-of-hooks */
import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import {
  ensureProperties,
  getProperty,
  type PropertyRecord,
} from "../../../../../db/properties";
import {
  deleteLocalProperty,
  getLocalProperty,
  updateLocalProperty,
  useLocalProperties,
} from "../local-dev-store";
import {
  listDestinations,
  staticDestinations,
} from "../../../../../db/destinations";
import {
  listLocalDestinations,
  useLocalDestinations,
} from "../../destinations/local-dev-store";

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

function dbError(error: unknown) {
  console.error("Admin property database operation failed", error);
  return NextResponse.json(
    {
      error:
        "数据库暂时连接不上，保存/发布还不能写入。请检查 Vercel 的 DATABASE_URL 是否使用 Supabase 的 Transaction pooler / Session pooler 完整连接串。",
    },
    { status: 503 },
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const includeDestinations =
    new URL(request.url).searchParams.get("include") === "destinations";
  if (useLocalProperties()) {
    const item = getLocalProperty(Number(id));
    if (!item)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!includeDestinations) return NextResponse.json(item);
    const destinations = useLocalDestinations()
      ? listLocalDestinations()
      : staticDestinations;
    return NextResponse.json({ property: item, destinations });
  }
  const [propertyResult, destinationResult] = await Promise.allSettled([
    withTimeout(getProperty(Number(id)), 9000, "property query"),
    includeDestinations
      ? withTimeout(listDestinations(true), 9000, "destinations query")
      : Promise.resolve([]),
  ]);
  if (propertyResult.status === "rejected")
    console.error("Failed to load property from database", propertyResult.reason);
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
  const item = propertyResult.value;
  if (!item)
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  const options = {
    headers: {
      "Cache-Control": "no-store",
      "x-admin-data-source": destinationResult.status === "rejected" ? "database-with-destination-fallback" : "database",
    },
  };
  if (!includeDestinations) return NextResponse.json(item, options);
  const destinations =
    destinationResult.status === "fulfilled"
      ? destinationResult.value
      : staticDestinations;
  return NextResponse.json({ property: item, destinations }, options);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = (await request.json()) as Record<string, unknown>;
  if (useLocalProperties()) {
    updateLocalProperty(Number(id), b as PropertyRecord);
    return NextResponse.json({ ok: true });
  }

  try {
    await ensureProperties();
    const json = (key: string) => JSON.stringify(b[key] || []);
    await env.DB.prepare(
      `UPDATE properties SET name_zh=?,name_en=?,city=?,area_zh=?,area_en=?,tags=?,images=?,image_categories=?,image_originals=?,guests=?,bedrooms=?,beds=?,bathrooms=?,description_zh=?,description_en=?,amenities=?,highlights=?,nearby=?,suitable_for=?,guest_quote=?,guest_quote_author=?,space_config=?,sleeping_arrangements=?,price_from=?,price_note=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    )
      .bind(
        String(b.nameZh),
        String(b.nameEn),
        String(b.city),
        String(b.areaZh || ""),
        String(b.areaEn || ""),
        json("tags"),
        json("images"),
        JSON.stringify(b.imageCategories || {}),
        JSON.stringify(b.imageOriginals || {}),
        Number(b.guests),
        Number(b.bedrooms || 1),
        Number(b.beds),
        Number(b.bathrooms || 1),
        String(b.descriptionZh || ""),
        String(b.descriptionEn || ""),
        json("amenities"),
        json("highlights"),
        json("nearby"),
        json("suitableFor"),
        String(b.guestQuote || ""),
        String(b.guestQuoteAuthor || ""),
        JSON.stringify(b.spaceConfig || {}),
        json("sleepingArrangements"),
        Number(b.priceFrom),
        String(b.priceNote || ""),
        String(b.status || "draft"),
        Number(id),
      )
      .run();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (useLocalProperties()) {
    deleteLocalProperty(Number(id));
    return NextResponse.json({ ok: true });
  }
  try {
    await env.DB.prepare("DELETE FROM properties WHERE id=?")
      .bind(Number(id))
      .run();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbError(error);
  }
}
