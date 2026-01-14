import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeJWT(token: string): { role?: string } | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  // Check cookies for token
  let token = request.cookies.get("alpa_token")?.value || request.cookies.get("auth_token")?.value;
  
  const url = request.nextUrl;

  // If accessing login and already logged in, redirect based on role
  if (url.pathname === "/login" && token) {
    const payload = decodeJWT(token);
    
    if (payload?.role) {
      const userRole = payload.role?.toLowerCase();
      console.log(`[Middleware] User already logged in (${userRole}), redirecting from login`);
      
      if (userRole?.includes("admin")) {
        return NextResponse.redirect(new URL("/dashboard/admin/dashboard", request.url));
      } else if (userRole?.includes("seller")) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } else if (userRole?.includes("customer")) {
        return NextResponse.redirect(new URL("/dashboard/customer/profile", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/forgot-password", "/verify-email", "/setup-2fa"],
};
