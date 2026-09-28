"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useContent } from "@/context/ContentContext";
import { apiFetch } from "@/lib/api-client";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/Button";
import { PageLoader } from "@/components/Spinner";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading…" />}>
      <VerifyEmailInner />
    </Suspense>
  );
}

function VerifyEmailInner() {
  const content = useContent();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing a token.");
      return;
    }
    apiFetch<{ message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }).then((result) => {
      if (result.success) {
        setStatus("success");
        setMessage(result.data?.message || "Email verified.");
      } else {
        setStatus("error");
        setMessage(result.error || "Verification failed.");
      }
    });
  }, [token]);

  return (
    <AuthLayout title={content.auth.verify.title} subtitle={content.auth.verify.subtitle}>
      <div className="flex flex-col items-center text-center">
        {status === "loading" && (
          <>
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-[var(--color-linefaint)] border-t-[var(--color-amber)]" />
            <p className="font-sans-tech text-sm text-[#8593ad]">Confirming your address…</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center border border-[var(--color-ok)] text-[var(--color-ok)]">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-sans-tech text-sm leading-6 text-[#c7d0e0]">{message}</p>
            <Link href="/login" className="mt-6">
              <Button variant="primary">Sign In</Button>
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center border border-[var(--color-danger)] text-[var(--color-danger)]">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </div>
            <p className="font-sans-tech text-sm leading-6 text-[#c7d0e0]">{message}</p>
            <Link href="/login" className="mt-6">
              <Button variant="secondary">Back to Sign In</Button>
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
