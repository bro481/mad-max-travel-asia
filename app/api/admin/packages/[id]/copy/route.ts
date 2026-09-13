import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../../chatgpt-auth";
import { duplicateTravelPackage } from "../../../../../../db/packages";
import { revalidatePublicContent } from "../../../../../../lib/revalidate-public-content";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const item = await duplicateTravelPackage(Number(id));
    revalidatePublicContent("packages");
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to copy travel package", error);
    return NextResponse.json(
      { error: "复制套餐失败：数据库暂时连接不上，请稍后再试。" },
      { status: 503 },
    );
  }
}
