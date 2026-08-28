import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  LEGACY_ADMIN_SESSION_COOKIE,
} from "../../../chatgpt-auth";

function sharedCookieDomain(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "madmaxtravel.asia" || hostname === "www.madmaxtravel.asia"
    ? ".madmaxtravel.asia"
    : undefined;
}

function serializedExpiredCookie(name: string, request: Request) {
  const parts = [
    `${name}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  const domain = sharedCookieDomain(request);
  if (domain) parts.push(`Domain=${domain}`);
  return parts.join("; ");
}

export async function GET(request: Request) {
  const returnTo = new URL(request.url).searchParams.get("return_to") || "/";
  const response = NextResponse.redirect(new URL(returnTo, request.url));
  for (const name of [ADMIN_SESSION_COOKIE, LEGACY_ADMIN_SESSION_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/",
    });
    response.headers.append("Set-Cookie", serializedExpiredCookie(name, request));
  }
  return response;
}
