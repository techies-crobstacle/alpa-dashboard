// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// export function middleware(request: NextRequest) {
//   // Middleware doesn't run for dashboard routes
//   // Token validation is handled client-side via localStorage
//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/login", "/register", "/forgot-password", "/verify-email", "/setup-2fa"],
// };

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const userRole = request.cookies.get("userRole")?.value;
  
  const { pathname } = request.nextUrl;

  // Define public routes (auth pages)
  const publicRoutes = ["/login", "/register", "/forgot-password", "/verify-email", "/setup-2fa"];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Define role-based dashboard routes
  const dashboardRoutes = {
    admin: "/dashboard/admin/dashboard",
    seller: "/dashboard",
    customer: "/dashboard/customer/profile",
  };

  // If user is authenticated (has token and role)
  if (token && userRole) {
    // If trying to access public routes (login, register, etc.), redirect to dashboard
    if (isPublicRoute) {
      const roleKey = userRole.toLowerCase() as keyof typeof dashboardRoutes;
      const redirectUrl = dashboardRoutes[roleKey] || "/dashboard";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // If accessing dashboard root, redirect based on role
    if (pathname === "/dashboard") {
      if (userRole.toLowerCase().includes("admin")) {
        return NextResponse.redirect(new URL(dashboardRoutes.admin, request.url));
      } else if (userRole.toLowerCase().includes("customer")) {
        return NextResponse.redirect(new URL(dashboardRoutes.customer, request.url));
      }
      // Seller stays at /dashboard
    }

    // Allow access to role-specific routes
    return NextResponse.next();
  }

  // If not authenticated
  if (!token || !userRole) {
    // Allow access to public routes
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Redirect to login if trying to access protected routes
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/verify-email",
    "/setup-2fa",
    "/dashboard/:path*",
  ],
};