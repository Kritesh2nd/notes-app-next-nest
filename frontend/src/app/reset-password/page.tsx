"use client";

import { useState, FormEvent, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useContent } from "@/context/ContentContext";
import { resetPasswordSchema } from "@/lib/validation";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/Toast";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/FormField";
import { Button } from "@/components/Button";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const content = useContent();
  const { push } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (password !== confirm) {
      setErrors((prev) => ({ ...prev, confirm: "Passwords do not match." }));
      return;
    }

    const parsed = resetPasswordSchema.safeParse({ token, password });
    if (!parsed.success) {
      setErrors({ password: parsed.error.issues[0].message });
      return;
    }

    setErrors({});
    setLoading(true);
    const result = await apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setLoading(false);

    if (!result.success) {
      push(result.error || "Could not reset password.", "error");
      return;
    }

    push("Password updated. Please sign in.", "success");
    router.push("/login");
  }

  if (!token) {
    return (
      <AuthLayout title={content.auth.reset.title} subtitle={content.auth.reset.subtitle}>
        <p className="text-center font-sans-tech text-sm text-[#c7d0e0]">
          This link is missing a reset token.{" "}
          <Link href="/forgot-password" className="text-[var(--color-amber-bright)] hover:underline">
            Request a new one
          </Link>
          .
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={content.auth.reset.title} subtitle={content.auth.reset.subtitle}>
      <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
        <Input
          label="New Password"
          htmlFor="password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password}
          hint="Must include an uppercase letter, a lowercase letter, and a number."
        />
        <Input
          label="Confirm Password"
          htmlFor="confirm"
          name="confirm"
          type="password"
          placeholder="Repeat password"
          required
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setErrors((prev) => ({ ...prev, confirm: undefined }));
          }}
          error={errors.confirm}
        />
        <Button type="submit" variant="primary" loading={loading} fullWidth>
          Update Password
        </Button>
      </form>
    </AuthLayout>
  );
}
