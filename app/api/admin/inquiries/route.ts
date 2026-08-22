import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { listInquiries } from "../../../../db/inquiries";
export async function GET() {
  if (!(await getChatGPTUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await listInquiries());
  } catch {
    if (process.env.NODE_ENV === "development") return NextResponse.json([]);
    return NextResponse.json({ error: "Failed to load inquiries" }, { status: 500 });
  }
}
