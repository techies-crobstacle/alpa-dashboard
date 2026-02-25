"use client";
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://alpa-be-1.onrender.com";

function LogoutCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const doLogout = async () => {
      // Invalidate the server-side session
      const token =
        localStorage.getItem("alpa_token") ||
        localStorage.getItem("auth_token");
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      } catch (_) {
        // Best-effort — always continue to clear local state
      }

      // Clear ALL Dashboard session keys
      localStorage.removeItem("alpa_token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      localStorage.removeItem("user_data");

      // Clear cookies
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
      document.cookie =
        "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
      document.cookie =
        "alpa_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // Follow the ?redirect param if provided (sent by Webapp logout),
      // otherwise just go to Dashboard login.
      const redirectTo = searchParams.get("redirect");
      const safeRedirect =
        redirectTo && redirectTo.startsWith("https://")
          ? redirectTo
          : "/login";
      window.location.replace(safeRedirect);
    };

    doLogout();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Signing out…</p>
    </div>
  );
}

export default function LogoutCallbackPage() {
  return (
    <Suspense>
      <LogoutCallbackContent />
    </Suspense>
  );
}
