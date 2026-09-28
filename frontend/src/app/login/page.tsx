"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContent } from "@/context/ContentContext";
import { useAuth } from "@/context/AuthContext";
import { loginSchema } from "@/lib/validation";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/Toast";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/FormField";
import { Button } from "@/components/Button";

type Errors = Partial<Record<"email" | "password", string>>;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const content = useContent();
  const { push } = useToast();
  const { refresh } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Shown after the app auto-logged the user out (see AuthContext).
  const reason = searchParams.get("reason");
  useEffect(() => {
    if (!reason) return;
    const messages: Record<string, string> = {
      deleted: "You were signed out because your account no longer exists.",
      banned: "You were signed out because your account has been suspended.",
      expired: "Your session has expired. Please sign in again.",
    };
    push(messages[reason] || messages.expired, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reason]);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    setUnverifiedEmail(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const result = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setLoading(false);

    if (!result.success) {
      if ((result.details as { unverified?: boolean } | undefined)?.unverified) {
        setUnverifiedEmail(form.email);
      }
      push(result.error || "Sign in failed.", "error");
      return;
    }

    push("Welcome back.", "success");
    await refresh();
    router.push(searchParams.get("next") || "/dashboard");
  }

  async function resendVerification() {
    if (!unverifiedEmail) return;
    setResending(true);
    const result = await apiFetch("/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email: unverifiedEmail }),
    });
    setResending(false);
    push(result.data && (result.data as { message: string }).message ? (result.data as { message: string }).message : "Verification email sent.", "info");
  }

  return (
    <AuthLayout
      title={content.auth.login.title}
      subtitle={content.auth.login.subtitle}
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[var(--color-amber-bright)] hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
        <Input
          label="Email Address"
          htmlFor="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          error={errors.email}
        />
        <div>
          <Input
            label="Password"
            htmlFor="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            error={errors.password}
          />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="tech-label hover:text-[var(--color-amber-bright)]">
              Forgot password?
            </Link>
          </div>
        </div>

        {unverifiedEmail && (
          <div className="border border-[var(--color-amber)]/50 bg-[rgba(224,165,44,0.06)] p-3">
            <p className="font-mono-tech text-xs text-[#c7d0e0]">
              Your email isn&apos;t verified yet.{" "}
              <button
                type="button"
                onClick={resendVerification}
                disabled={resending}
                className="text-[var(--color-amber-bright)] underline disabled:opacity-50"
              >
                {resending ? "Sending…" : "Resend verification email"}
              </button>
            </p>
          </div>
        )}

        <Button type="submit" variant="primary" loading={loading} fullWidth>
          Sign In
        </Button>
      </form>
    </AuthLayout>
  );
}
