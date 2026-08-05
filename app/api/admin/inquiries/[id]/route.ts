import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { ensureInquiries, getInquiry } from "../../../../../db/inquiries";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const item = await getInquiry(Number(id));
  return item
    ? NextResponse.json(item)
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureInquiries();
  const { id } = await params;
  const b = await request.json();
  await env.DB.prepare(
    `UPDATE inquiry_requests SET name=?,contact=?,destinations=?,services=?,travel_time=?,message=?,status=?,source=?,country=?,language=?,people=?,children=?,rooms=?,budget=?,tags=?,next_follow_up=?,followups=?,quotes=?,financials=?,deal_amount=?,deal_date=?,payment_status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`,
  )
    .bind(
      b.name,
      b.contact,
      JSON.stringify(b.destinations || []),
      JSON.stringify(b.services || []),
      b.travelTime || "",
      b.message || "",
      b.status || "待回复",
      b.source || "网站",
      b.country || "",
      b.language || "中文",
      Number(b.people || 0),
      Number(b.children || 0),
      Number(b.rooms || 0),
      b.budget || "",
      JSON.stringify(b.tags || []),
      b.nextFollowUp || "",
      JSON.stringify(b.followups || []),
      JSON.stringify(b.quotes || []),
      JSON.stringify(b.financials || []),
      Number(b.dealAmount || 0),
      b.dealDate || "",
      b.paymentStatus || "未收款",
      Number(id),
    )
    .run();
  return NextResponse.json({ ok: true });
}
