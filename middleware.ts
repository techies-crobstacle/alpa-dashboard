import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("alpa_token")?.value || request.cookies.get("auth_token")?.value;
  const url = request.nextUrl;

  // If accessing dashboard and not logged in, redirect to login
  if (url.pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If accessing login and already logged in, redirect to dashboard
  if (url.pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
