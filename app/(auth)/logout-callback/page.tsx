"use client";

import { useEffect } from "react";

export default function LogoutCallbackPage() {
  useEffect(() => {
    // Clear ALL keys the Dashboard stores
    localStorage.removeItem("alpa_token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    localStorage.removeItem("user_data");

    // Clear cookies
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
    document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
    document.cookie = "alpa_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    if (window.parent !== window) {
      // We're inside a hidden iframe — tell the Website we're done
      window.parent.postMessage("alpa-logout-done", "https://alpa-fe.vercel.app");
    } else {
      // Someone navigated here directly — just go to login
      window.location.replace("/login");
    }
  }, []);

  return null;
}
