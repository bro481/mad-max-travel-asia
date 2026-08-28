import { NextResponse, type NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE = "madmax_admin_session";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-admin-pathname", pathname);
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  if (request.cookies.get(ADMIN_SESSION_COOKIE)?.value) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = `?return_to=${encodeURIComponent(`${pathname}${search}`)}`;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
