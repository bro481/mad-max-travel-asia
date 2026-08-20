import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import {
  ensureServiceItems,
  getServiceItem,
} from "../../../../../db/service-items";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const x = await getServiceItem(Number(id));
  return x
    ? NextResponse.json(x)
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}
export async function PUT(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureServiceItems();
  const { id } = await params,
    b = await r.json();
  await env.DB.prepare(
    `UPDATE service_items SET slug=?,type=?,city=?,category=?,name_zh=?,name_en=?,subtitle_zh=?,subtitle_en=?,intro_zh=?,intro_en=?,images=?,tags=?,steps=?,routes=?,timeline=?,inquiry_fields=?,inquiry_required=?,inquiry_prompt_fields=?,max_guests=?,guest_note=?,airports=?,directions=?,service_areas=?,other_area_note=?,vehicle_display_mode=?,vehicles=?,price_mode=?,price=?,price_unit=?,price_note=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  )
    .bind(
      b.slug,
      b.type,
      b.city,
      b.category,
      b.nameZh,
      b.nameEn,
      b.subtitleZh,
      b.subtitleEn,
      b.introZh,
      b.introEn,
      JSON.stringify(b.images || []),
      JSON.stringify(b.tags || []),
      JSON.stringify(b.steps || []),
      JSON.stringify(b.routes || []),
      JSON.stringify(b.timeline || []),
      JSON.stringify(b.inquiryFields || []),
      JSON.stringify(b.inquiryRequired || []),
      JSON.stringify(b.inquiryPromptFields || []),
      Number(b.maxGuests || 14), b.guestNote || "", JSON.stringify(b.airports || []), JSON.stringify(b.directions || []), JSON.stringify(b.serviceAreas || []), b.otherAreaNote || "", b.vehicleDisplayMode || "车型类别", JSON.stringify(b.vehicles || []),
      b.priceMode,
      Number(b.price || 0),
      b.priceUnit,
      b.priceNote,
      b.status,
      Number(id),
    )
    .run();
  return NextResponse.json({ ok: true });
}
