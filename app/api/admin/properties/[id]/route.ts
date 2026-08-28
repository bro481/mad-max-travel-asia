/* eslint-disable react-hooks/rules-of-hooks */
import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import {
  ensureProperties,
  getProperty,
  staticPropertyRecords,
  type PropertyRecord,
} from "../../../../../db/properties";
import {
  deleteLocalProperty,
  getLocalProperty,
  updateLocalProperty,
  useLocalProperties,
} from "../local-dev-store";

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
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (useLocalProperties()) {
    const item = getLocalProperty(Number(id));
    return item
      ? NextResponse.json(item)
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const item = await getProperty(Number(id));
    return item
      ? NextResponse.json(item)
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("Failed to load property from database", error);
    const item = staticPropertyRecords().find(
      (x) => x.id === Number(id) || x.slug === id,
    );
    return item
      ? NextResponse.json(item, {
          headers: { "x-admin-data-source": "static-fallback" },
        })
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  }
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
