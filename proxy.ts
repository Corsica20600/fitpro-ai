import { NextResponse } from "next/server";
import { auth } from "@/auth";

const apiRoutes = ["/api/account", "/api/health", "/api/programs", "/api/workout"];

function isApiRoute(pathname: string) {
  return apiRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function getLoginUrl(requestUrl: string, pathname: string, search: string) {
  const url = new URL("/login", requestUrl);
  url.searchParams.set("callbackUrl", `${pathname}${search}`);
  return url;
}

export default auth((request) => {
  const isConnected = Boolean(request.auth?.user?.email);
  const { pathname, search } = request.nextUrl;

  if (isConnected) {
    return NextResponse.next();
  }

  if (isApiRoute(pathname)) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  return NextResponse.redirect(getLoginUrl(request.url, pathname, search));
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/exercises/:path*",
    "/history/:path*",
    "/programs/:path*",
    "/progress/:path*",
    "/settings/:path*",
    "/workout/:path*",
    "/api/account/:path*",
    "/api/health/:path*",
    "/api/programs/:path*",
    "/api/workout/:path*",
  ],
};
