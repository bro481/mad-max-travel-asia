import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import {
  createTravelPackage,
  listTravelPackages,
  staticTravelPackages,
} from "../../../../db/packages";
import { revalidatePublicContent } from "../../../../lib/revalidate-public-content";

export async function GET() {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await listTravelPackages(true), {
      headers: { "Cache-Control": "no-store", "x-admin-data-source": "database" },
    });
  } catch (error) {
    console.error("Failed to load travel packages", error);
    return NextResponse.json(staticTravelPackages(), {
      headers: { "Cache-Control": "no-store", "x-admin-data-source": "static-fallback" },
    });
  }
}

export async function POST(request: Request) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const item = await createTravelPackage(body);
    revalidatePublicContent("packages");
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Failed to create travel package", error);
    return NextResponse.json(
      { error: "创建套餐失败：数据库暂时连接不上，请稍后再试。" },
      { status: 503 },
    );
  }
}
