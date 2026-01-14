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
  const token = request.cookies.get("alpa_token")?.value || request.cookies.get("auth_token")?.value;
  const url = request.nextUrl;

  // If accessing dashboard and not logged in, redirect to login
  if (url.pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If token exists, decode and check role for redirections
  if (token) {
    const payload = decodeJWT(token);
    
    if (!payload || !payload.role) {
      // Invalid token, clear and redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("alpa_token");
      response.cookies.delete("auth_token");
      return response;
    }

    const userRole = payload.role;

    // If accessing login and already logged in, redirect based on role
    if (url.pathname === "/login") {
      if (userRole === "admin") {
        return NextResponse.redirect(new URL("/dashboard/admin/dashboard", request.url));
      } else if (userRole === "seller") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } else if (userRole === "customer") {
        return NextResponse.redirect(new URL("/dashboard/customer/profile", request.url));
      }
    }

    // Role-based dashboard access control
    if (url.pathname.startsWith("/dashboard")) {
      if (userRole === "customer") {
        // Customers should ONLY access customer routes
        if (!url.pathname.startsWith("/dashboard/customer/")) {
          return NextResponse.redirect(new URL("/dashboard/customer/profile", request.url));
        }
      } else if (userRole === "admin") {
        // Admins should ONLY access admin routes or general dashboard redirects to admin
        if (url.pathname.startsWith("/dashboard/customer/")) {
          return NextResponse.redirect(new URL("/dashboard/admin/dashboard", request.url));
        }
        if (url.pathname === "/dashboard" || url.pathname === "/dashboard/") {
          return NextResponse.redirect(new URL("/dashboard/admin/dashboard", request.url));
        }
      } else if (userRole === "seller") {
        // Sellers should NOT access customer or admin routes
        if (url.pathname.startsWith("/dashboard/customer/") || url.pathname.startsWith("/dashboard/admin/")) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
