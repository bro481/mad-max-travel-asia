import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { ensureProperties, listProperties } from "../../../../db/properties";
import {
  createLocalProperty,
  listLocalProperties,
  useLocalProperties,
} from "./local-dev-store";

export async function GET() {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (useLocalProperties()) return NextResponse.json(listLocalProperties());
  return NextResponse.json(await listProperties());
}
export async function POST(request: Request) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = (await request.json()) as Record<string, unknown>;
  if (useLocalProperties()) {
    const item = createLocalProperty(b);
    return NextResponse.json({ id: item.id, slug: item.slug }, { status: 201 });
  }
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
}
