import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import { deleteTravelGuideArticle, updateTravelGuideArticle } from "../../../../../db/travel-guides";
import { revalidatePublicContent } from "../../../../../lib/revalidate-public-content";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await updateTravelGuideArticle(Number(id), await request.json());
    revalidatePublicContent("photography");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update travel guide", error);
    return NextResponse.json({ error: "保存攻略失败：数据库暂时连接不上，请稍后再试。" }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await deleteTravelGuideArticle(Number(id));
    revalidatePublicContent("photography");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete travel guide", error);
    return NextResponse.json({ error: "删除攻略失败：数据库暂时连接不上，请稍后再试。" }, { status: 503 });
  }
}
