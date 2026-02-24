"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://alpa-be-1.onrender.com";

type Stage = "exchanging" | "success" | "error";

// Helper – same pattern as login page
function setCookie(name: string, value: string, days = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export default function LoginCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stage, setStage] = useState<Stage>("exchanging");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const ticket = searchParams.get("ticket");
    const redirectTo = searchParams.get("redirectTo") || "/dashboard";

    // ── Validate params ──────────────────────────────────────────────────────
    if (!ticket) {
      setErrorMessage("No SSO ticket found in the URL. Please try again.");
      setStage("error");
      return;
    }

    // ── Exchange the ticket for a real token ─────────────────────────────────
    const exchangeTicket = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/exchange-ticket`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ ticket }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.token) {
          throw new Error(
            data.message || "Ticket exchange failed. Please log in again."
          );
        }

        // ── Persist session (mirror login page behaviour) ──────────────────
        localStorage.setItem("alpa_token", data.token);
        setCookie("token", data.token, 7);

        if (data.role) {
          setCookie("userRole", data.role, 7);
        }

        // Optionally cache user data if the backend returns it
        if (data.user) {
          localStorage.setItem("user_data", JSON.stringify(data.user));
        }

        setStage("success");

        toast.success("Signed in successfully!", {
          description: "Redirecting you to your destination…",
        });

        // Small delay so the success state is visible, then navigate
        setTimeout(() => {
          router.replace(redirectTo);
          router.refresh();
        }, 800);
      } catch (err) {
        const error = err as Error;
        console.error("[SSO] Ticket exchange error:", error);
        setErrorMessage(
          error.message || "Something went wrong. Please try logging in again."
        );
        setStage("error");
      }
    };

    exchangeTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Redirect helper shown on error ──────────────────────────────────────────
  const handleManualLogin = () => {
    router.replace("/login");
  };

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      {stage === "exchanging" && (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h2 className="text-xl font-semibold">Signing you in…</h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we securely complete your sign-in.
          </p>
        </>
      )}

      {stage === "success" && (
        <>
          <CheckCircle className="h-12 w-12 text-green-500" />
          <h2 className="text-xl font-semibold">Signed in!</h2>
          <p className="text-sm text-muted-foreground">
            Redirecting you now…
          </p>
        </>
      )}

      {stage === "error" && (
        <>
          <XCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Sign-in failed</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {errorMessage}
          </p>
          <button
            onClick={handleManualLogin}
            className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </button>
        </>
      )}
    </div>
  );
}
