import { NextResponse } from "next/server";
import { getChatGPTUser } from "../../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  return NextResponse.json({ authenticated: Boolean(user), user });
}
