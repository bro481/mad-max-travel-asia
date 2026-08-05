import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { listInquiries } from "../../../../db/inquiries";
export async function GET() {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await listInquiries());
}
