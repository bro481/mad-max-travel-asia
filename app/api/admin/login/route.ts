import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  isValidAdminPassword,
} from "../../../chatgpt-auth";

function safeReturnPath(value: unknown) {
  const path = typeof value === "string" ? value : "/admin";
  if (!path.startsWith("/") || path.startsWith("//")) return "/admin";
  if (path === "/admin/login") return "/admin";
  return path;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    password?: string;
    returnTo?: string;
  };
  if (!(await isValidAdminPassword(String(body.password || "")))) {
    return NextResponse.json({ error: "密码不正确" }, { status: 401 });
  }

  const returnTo = safeReturnPath(body.returnTo);
  const response = NextResponse.json({ ok: true, returnTo });
  response.cookies.set(ADMIN_SESSION_COOKIE, await createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}
