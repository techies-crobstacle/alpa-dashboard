"use client";
// Tell Next.js to render this route with no layout wrapper —
// it runs inside a hidden iframe so no chrome is needed.
export const dynamic = "force-dynamic";

import { useEffect } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://alpa-be-1.onrender.com";

export default function LogoutCallbackPage() {
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

      // Clear ALL keys the Dashboard stores
      localStorage.removeItem("alpa_token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      localStorage.removeItem("user_data");

      // Clear cookies
      document.cookie =
        "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
      document.cookie =
        "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
      document.cookie = "alpa_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      if (window.parent !== window) {
        // We're inside a hidden iframe — tell the Webapp we're done
        window.parent.postMessage("alpa-logout-done", "https://apla-fe.vercel.app");
      } else {
        // Someone navigated here directly — just go to login
        window.location.replace("/login");
      }
    };

    doLogout();
  }, []);

  return null;
}
