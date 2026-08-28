import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "../../../chatgpt-auth";

function sharedCookieDomain(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "madmaxtravel.asia" || hostname === "www.madmaxtravel.asia"
    ? ".madmaxtravel.asia"
    : undefined;
}

export async function GET(request: Request) {
  const returnTo = new URL(request.url).searchParams.get("return_to") || "/";
  const response = NextResponse.redirect(new URL(returnTo, request.url));
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    domain: sharedCookieDomain(request),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return response;
}
