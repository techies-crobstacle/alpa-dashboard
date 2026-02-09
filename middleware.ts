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

  // If user is authenticated (has token and role)
  if (token && userRole) {
    // If trying to access public routes (login, register, etc.), redirect to dashboard
    if (isPublicRoute) {
      return NextResponse.redirect(new URL(`/dashboard/role`, request.url));
    }
    // Allow access to all other routes when authenticated
    return NextResponse.next();
  }

  // If not authenticated
  if (!token || !userRole) {
    // Allow access to public routes
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Redirect to login for dashboard routes only
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
