import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import {
  deleteTravelPackage,
  updateTravelPackage,
} from "../../../../../db/packages";
import { revalidatePublicContent } from "../../../../../lib/revalidate-public-content";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    const body = await request.json();
    await updateTravelPackage(Number(id), body);
    revalidatePublicContent("packages");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update travel package", error);
    return NextResponse.json(
      { error: "保存套餐失败：数据库暂时连接不上，请稍后再试。" },
      { status: 503 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await deleteTravelPackage(Number(id));
    revalidatePublicContent("packages");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete travel package", error);
    return NextResponse.json(
      { error: "删除套餐失败：数据库暂时连接不上，请稍后再试。" },
      { status: 503 },
    );
  }
}
