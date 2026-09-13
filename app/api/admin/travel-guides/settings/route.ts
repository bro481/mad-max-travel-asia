import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { getTravelGuideSettings, updateTravelGuideSettings } from "../../../../../db/travel-guides";
import { revalidatePublicContent } from "../../../../../lib/revalidate-public-content";

export async function GET() {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await getTravelGuideSettings(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to load travel guide settings", error);
    return NextResponse.json({ error: "页面设置加载失败" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await updateTravelGuideSettings(await request.json());
    revalidatePublicContent("photography");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update travel guide settings", error);
    return NextResponse.json({ error: "页面设置保存失败" }, { status: 503 });
  }
}
