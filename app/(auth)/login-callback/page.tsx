"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://alpa-be-1.onrender.com";

type Stage = "exchanging" | "success";

// Helper – same pattern as login page
function setCookie(name: string, value: string, days = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

// Inner component that reads search params (must be inside Suspense)
function LoginCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stage, setStage] = useState<Stage>("exchanging");

  useEffect(() => {
    const ticket = searchParams.get("ticket");
    const redirectTo = searchParams.get("redirectTo") || "/dashboard";

    // ── Validate params ──────────────────────────────────────────────────────
    if (!ticket) {
      router.replace("/login");
      return;
    }

    // Only allow internal paths — block open redirects
    const safePath = redirectTo.startsWith("/") ? redirectTo : "/dashboard";

    // ── Exchange the ticket for a real token ─────────────────────────────────
    const exchangeTicket = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/exchange-ticket`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ ticketId: ticket }),
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

        // Cache user data if the backend returns it
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }

        setStage("success");

        toast.success("Signed in successfully!", {
          description: "Redirecting you to your destination…",
        });

        // Small delay so the success state is visible, then navigate
        setTimeout(() => {
          router.replace(safePath);
          router.refresh();
        }, 800);
      } catch (err) {
        const error = err as Error;
        console.error("[SSO] Ticket exchange error:", error);
        // Fallback — send to normal login
        router.replace("/login");
      }
    };

    exchangeTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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
    </div>
  );
}

// Suspense wrapper required because useSearchParams() causes
// a CSR bailout during static generation without it.
export default function LoginCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h2 className="text-xl font-semibold">Signing you in…</h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we securely complete your sign-in.
          </p>
        </div>
      }
    >
      <LoginCallbackContent />
    </Suspense>
  );
}
