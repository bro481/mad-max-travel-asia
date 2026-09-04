/* eslint-disable react-hooks/rules-of-hooks */
import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import {
  getAdminServiceItemBySlug,
  getServiceItem,
  staticServiceItemRecords,
} from "../../../../../db/service-items";
import {
  getLocalServiceItem,
  getLocalServiceItemBySlug,
  updateLocalServiceItem,
  useLocalServiceItems,
} from "../local-dev-store";
import { revalidatePublicContent } from "../../../../../lib/revalidate-public-content";

function dbError(error: unknown) {
  console.error("Admin service item database operation failed", error);
  return NextResponse.json(
    {
      error:
        "数据库暂时连接不上，保存/发布还不能写入。请检查 Vercel 的 DATABASE_URL 是否使用 Supabase 的 Transaction pooler / Session pooler 完整连接串。",
    },
    { status: 503 },
  );
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const numericId = Number(id);
  const isNumericId = Number.isFinite(numericId);
  if (useLocalServiceItems()) {
    const item = isNumericId
      ? getLocalServiceItem(numericId)
      : getLocalServiceItemBySlug(id);
    return item
      ? NextResponse.json(item)
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const x = isNumericId
      ? await getServiceItem(numericId)
      : await getAdminServiceItemBySlug(id);
    return x
      ? NextResponse.json(x)
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("Failed to load service item from database", error);
    const x = staticServiceItemRecords().find((item) =>
      isNumericId ? item.id === numericId : item.slug === id,
    );
    return x
      ? NextResponse.json(x, {
          headers: { "x-admin-data-source": "static-fallback" },
        })
      : NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
export async function PUT(
  r: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params,
    b = await r.json();
  const numericId = Number(id);
  const isNumericId = Number.isFinite(numericId);
  if (useLocalServiceItems()) {
    const current = isNumericId
      ? getLocalServiceItem(numericId)
      : getLocalServiceItemBySlug(id);
    if (!current)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    updateLocalServiceItem(current.id, b);
    revalidatePublicContent("services");
    return NextResponse.json({ ok: true });
  }
  try {
    const current = isNumericId
      ? await getServiceItem(numericId)
      : await getAdminServiceItemBySlug(id);
    if (!current)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    await env.DB.prepare(
      `UPDATE service_items SET slug=?,type=?,destination_id=?,city=?,category=?,category_id=?,template_type=?,display_order=?,name_zh=?,name_en=?,subtitle_zh=?,subtitle_en=?,intro_zh=?,intro_en=?,images=?,tags=?,steps=?,route_section_title_zh=?,route_section_title_en=?,route_section_intro_zh=?,route_section_intro_en=?,routes=?,timeline=?,inquiry_fields=?,inquiry_required=?,inquiry_prompt_fields=?,max_guests=?,guest_note=?,airports=?,directions=?,service_areas=?,other_area_note=?,vehicle_display_mode=?,vehicles=?,price_mode=?,price=?,price_unit=?,price_note=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
    )
      .bind(
        b.slug,
        b.type,
        Number(b.destinationId || 0),
        b.city,
        b.category,
        Number(b.categoryId || 1),
        b.templateType || (b.type === "交通接送" ? "transfer" : b.type === "私人包车" ? "route" : "experience"),
        Number(b.displayOrder || 99),
        b.nameZh,
        b.nameEn,
        b.subtitleZh,
        b.subtitleEn,
        b.introZh,
        b.introEn,
        JSON.stringify(
          Array.isArray(b.images)
            ? b.images.filter(Boolean)
            : [b.coverImage || "", ...(b.gallery || [])].filter(Boolean),
        ),
        JSON.stringify(b.tags || []),
        JSON.stringify(b.steps || []),
        b.routeSectionTitleZh || "",
        b.routeSectionTitleEn || "",
        b.routeSectionIntroZh || "",
        b.routeSectionIntroEn || "",
        JSON.stringify(b.routes || []),
        JSON.stringify(b.timeline || []),
        JSON.stringify(b.inquiryFields || []),
        JSON.stringify(b.inquiryRequired || []),
        JSON.stringify(b.inquiryPromptFields || []),
        Number(b.maxGuests || 14),
        b.guestNote || "",
        JSON.stringify(b.airports || []),
        JSON.stringify(b.directions || []),
        JSON.stringify(b.serviceAreas || []),
        b.otherAreaNote || "",
        b.vehicleDisplayMode || "车型类别",
        JSON.stringify(b.vehicles || []),
        b.priceMode,
        Number(b.price || 0),
        b.priceUnit,
        b.priceNote,
        b.status,
        current.id,
      )
      .run();
    revalidatePublicContent("services");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return dbError(error);
  }
}
