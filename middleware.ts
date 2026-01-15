

// function decodeJWT(token: string): { role?: string } | null {
//   if (!token) return null;
//   try {
//     const payload = token.split('.')[1];
//     if (!payload) return null;
//     const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
//     return JSON.parse(decoded);
//   } catch {
//     return null;
//   }
// }


// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";


// export function middleware(request: NextRequest) {
//   const token = request.cookies.get("alpa_token")?.value || request.cookies.get("auth_token")?.value;
//   const url = request.nextUrl;

//   // If user is logged in (has token) and trying to access login/auth pages, redirect to their dashboard
//   if ((url.pathname === "/login" || url.pathname === "/register" || url.pathname === "/forgot-password" || url.pathname === "/verify-email" || url.pathname === "/setup-2fa") && token) {
//     const payload = decodeJWT(token);

//     if (payload?.role) {
//       const userRole = payload.role.toLowerCase();
//       console.log(`[Middleware] User logged in with role: ${userRole}, redirecting from auth page`);

//       if (userRole.includes("admin")) {
//         return NextResponse.redirect(new URL("/dashboard/admin/dashboard", request.url));
//       } else if (userRole.includes("seller")) {
//         return NextResponse.redirect(new URL("/dashboard", request.url));
//       } else if (userRole.includes("customer")) {
//         return NextResponse.redirect(new URL("/dashboard/customer/profile", request.url));
//       }
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/login", "/register", "/forgot-password", "/verify-email", "/setup-2fa"],
// };


import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Middleware doesn't run for dashboard routes
  // Token validation is handled client-side via localStorage
  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/register", "/forgot-password", "/verify-email", "/setup-2fa"],
};
