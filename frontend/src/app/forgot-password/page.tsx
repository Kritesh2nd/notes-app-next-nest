"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useContent } from "@/context/ContentContext";
import { forgotPasswordSchema } from "@/lib/validation";
import { apiFetch } from "@/lib/api-client";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/FormField";
import { Button } from "@/components/Button";

export default function ForgotPasswordPage() {
  const content = useContent();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError("");
    setLoading(true);
    await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
    setLoading(false);
    setDone(true);
  }

  return (
    <AuthLayout
      title={content.auth.forgot.title}
      subtitle={content.auth.forgot.subtitle}
      footer={
        <Link href="/login" className="text-[var(--color-amber-bright)] hover:underline">
          Back to sign in
        </Link>
      }
    >
      {done ? (
        <div className="text-center">
          <p className="font-sans-tech text-sm leading-6 text-[#c7d0e0]">
            If an account exists for <span className="text-[var(--color-amber-bright)]">{email}</span>, we&apos;ve
            sent reset instructions. The link expires in 1 hour.
          </p>
        </div>
      ) : (
        <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
          <Input
            label="Email Address"
            htmlFor="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            error={error}
          />
          <Button type="submit" variant="primary" loading={loading} fullWidth>
            Send Reset Link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
