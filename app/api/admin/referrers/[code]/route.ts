import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../../chatgpt-auth";
import {
  getReferrerWithStats,
  normalizeReferrerCode,
  updateReferrer,
} from "../../../../../db/referrers";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { code } = await params;
  const item = await getReferrerWithStats(code);
  return item
    ? NextResponse.json(item)
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { code } = await params;
  const body = (await request.json()) as {
    name?: string;
    status?: "active" | "inactive";
  };
  const item = await updateReferrer(normalizeReferrerCode(code), body);
  return item
    ? NextResponse.json(item)
    : NextResponse.json({ error: "Not found" }, { status: 404 });
}
