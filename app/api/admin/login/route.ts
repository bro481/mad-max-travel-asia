import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  LEGACY_ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  isValidAdminPassword,
} from "../../../chatgpt-auth";

function safeReturnPath(value: unknown) {
  const path = typeof value === "string" ? value : "/admin";
  if (!path.startsWith("/") || path.startsWith("//")) return "/admin";
  if (path === "/admin/login") return "/admin";
  return path;
}

function sharedCookieDomain(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "madmaxtravel.asia" || hostname === "www.madmaxtravel.asia"
    ? ".madmaxtravel.asia"
    : undefined;
}

function serializedCookie(
  name: string,
  value: string,
  request: Request,
  maxAge: number,
  httpOnly = true,
) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
  ];
  if (httpOnly) parts.push("HttpOnly");
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  const domain = sharedCookieDomain(request);
  if (domain) parts.push(`Domain=${domain}`);
  return parts.join("; ");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    password?: string;
    returnTo?: string;
  };
  if (!(await isValidAdminPassword(String(body.password || "")))) {
    return NextResponse.json({ error: "密码不正确" }, { status: 401 });
  }

  const token = await createAdminSessionToken();
  const returnTo = safeReturnPath(body.returnTo);
  const response = NextResponse.json({
    ok: true,
    returnTo,
    cookieName: ADMIN_SESSION_COOKIE,
    sessionToken: token,
    cookieMaxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  response.headers.append(
    "Set-Cookie",
    serializedCookie(ADMIN_SESSION_COOKIE, token, request, 60 * 60 * 24 * 7),
  );
  response.headers.append(
    "Set-Cookie",
    serializedCookie(
      ADMIN_SESSION_COOKIE,
      token,
      request,
      60 * 60 * 24 * 7,
      false,
    ),
  );
  response.cookies.set(LEGACY_ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  response.headers.append(
    "Set-Cookie",
    serializedCookie(LEGACY_ADMIN_SESSION_COOKIE, "", request, 0),
  );
  return response;
}
