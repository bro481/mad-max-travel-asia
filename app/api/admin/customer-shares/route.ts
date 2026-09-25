import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import type { CustomerShareProductType } from "../../../../db/customer-shares";
import { generateCustomerSendCopy, type SendStage, type SendTone } from "../../../../lib/customer-send-assistant";

export async function POST(request: Request) {
  if (!(await getChatGPTUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as {
      productType?: CustomerShareProductType;
      productId?: string;
      customerName?: string;
      startDate?: string;
      endDate?: string;
      useDate?: string;
      people?: string;
      quoteText?: string;
      concerns?: string[];
      stage?: SendStage;
      context?: string;
      tone?: SendTone;
    };
    if (!body.productType || !body.productId) return NextResponse.json({ error: "请选择要发送给客户的内容。" }, { status: 400 });
    const result = await generateCustomerSendCopy({
      productType: body.productType,
      productId: body.productId,
      customerName: body.customerName,
      startDate: body.startDate,
      endDate: body.endDate,
      useDate: body.useDate,
      people: body.people,
      quoteText: body.quoteText,
      concerns: body.concerns || [],
      stage: body.stage || "first",
      context: body.context,
      tone: body.tone || "normal",
    });
    if (!result) return NextResponse.json({ error: "没有找到这个内容，可能还未上线或已隐藏。" }, { status: 404 });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to generate customer send copy", error);
    return NextResponse.json({ error: "生成客户发送内容失败，请稍后再试。" }, { status: 503 });
  }
}
