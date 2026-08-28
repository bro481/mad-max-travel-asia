import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  LEGACY_ADMIN_SESSION_COOKIE,
  getChatGPTUser,
} from "../../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  const cookieStore = await cookies();
  return NextResponse.json({
    authenticated: Boolean(user),
    user,
    cookieNames: cookieStore.getAll().map((item) => item.name),
    expectedCookie: ADMIN_SESSION_COOKIE,
    legacyCookie: LEGACY_ADMIN_SESSION_COOKIE,
  });
}
