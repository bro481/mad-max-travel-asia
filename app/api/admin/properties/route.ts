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

export async function GET() {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (useLocalProperties()) return NextResponse.json(listLocalProperties());
  try {
    return NextResponse.json(await listProperties());
  } catch (error) {
    console.error("Failed to load properties from database", error);
    return NextResponse.json(staticPropertyRecords(), {
      headers: { "x-admin-data-source": "static-fallback" },
    });
  }
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
