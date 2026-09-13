import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { createTravelGuideArticle, listTravelGuides, staticTravelGuides } from "../../../../db/travel-guides";
import { revalidatePublicContent } from "../../../../lib/revalidate-public-content";

export async function GET() {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await listTravelGuides(true), {
      headers: { "Cache-Control": "no-store", "x-admin-data-source": "database" },
    });
  } catch (error) {
    console.error("Failed to load travel guides", error);
    return NextResponse.json(staticTravelGuides(), {
      headers: { "Cache-Control": "no-store", "x-admin-data-source": "static-fallback" },
    });
  }
}

export async function POST(request: Request) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const item = await createTravelGuideArticle(await request.json());
    revalidatePublicContent("photography");
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create travel guide", error);
    return NextResponse.json({ error: "创建攻略失败：数据库暂时连接不上，请稍后再试。" }, { status: 503 });
  }
}
