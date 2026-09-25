import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { createCustomerShare, listCustomerShares, type CustomerSharePayload, type CustomerShareProductType } from "../../../../db/customer-shares";
import { resolveCustomerShareContent } from "../../../../lib/customer-share-content";

export async function GET() {
  if (!(await getChatGPTUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await listCustomerShares(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to load customer shares", error);
    return NextResponse.json({ error: "客户分享记录暂时无法加载。" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await getChatGPTUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as {
      productType?: CustomerShareProductType;
      productId?: string;
      payload?: CustomerSharePayload;
      status?: "draft" | "shared";
    };
    if (!body.productType || !body.productId) return NextResponse.json({ error: "请选择要分享的内容。" }, { status: 400 });
    const content = await resolveCustomerShareContent(body.productType, body.productId);
    if (!content) return NextResponse.json({ error: "没有找到这个内容，可能还未上线或已隐藏。" }, { status: 404 });
    const item = await createCustomerShare({
      content,
      payload: {
        quoteCurrency: "RM",
        quoteUnit: content.type === "stay" ? "晚" : "次",
        showQuote: true,
        showDates: true,
        showDetails: true,
        ...body.payload,
      },
      status: body.status || "shared",
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create customer share", error);
    return NextResponse.json({ error: "创建客户分享失败，请稍后再试。" }, { status: 503 });
  }
}
