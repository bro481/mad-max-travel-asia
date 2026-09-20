import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { createReferrer, listReferrers } from "../../../../db/referrers";

export async function GET() {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await listReferrers());
  } catch {
    if (process.env.NODE_ENV === "development") return NextResponse.json([]);
    return NextResponse.json({ error: "Failed to load referrers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as { name?: string };
    const item = await createReferrer(body.name || "");
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create referrer" },
      { status: 400 },
    );
  }
}
