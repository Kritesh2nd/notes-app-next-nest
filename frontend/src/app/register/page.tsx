"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useContent } from "@/context/ContentContext";
import { registerSchema } from "@/lib/validation";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/Toast";
import { AuthLayout } from "@/components/AuthLayout";
import { Input } from "@/components/FormField";
import { Button } from "@/components/Button";

type Errors = Partial<Record<"name" | "email" | "password", string>>;

export default function RegisterPage() {
  const content = useContent();
  const { push } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse(form);
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
    const result = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(parsed.data),
    });
    setLoading(false);

    if (!result.success) {
      push(result.error || "Registration failed.", "error");
      return;
    }

    setSubmitted(true);
    push("Account created — check your inbox to verify your email.", "success");
  }

  if (submitted) {
    return (
      <AuthLayout title={content.auth.register.title} subtitle={content.auth.register.subtitle}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-[var(--color-ok)] text-[var(--color-ok)]">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M4 6l8 6 8-6M4 6h16v12H4z" />
            </svg>
          </div>
          <h2 className="font-sans-tech text-lg font-semibold text-[var(--color-line)]">Check your email</h2>
          <p className="mt-2 font-sans-tech text-sm leading-6 text-[#8593ad]">
            We sent a verification link to <span className="text-[var(--color-amber-bright)]">{form.email}</span>.
            Click it to activate your account before signing in.
          </p>
          <Link href="/login" className="mt-6 inline-block">
            <Button variant="primary">Go to Sign In</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={content.auth.register.title}
      subtitle={content.auth.register.subtitle}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--color-amber-bright)] hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
        <Input
          label="Full Name"
          htmlFor="name"
          name="name"
          type="text"
          placeholder="Ada Lovelace"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          error={errors.name}
        />
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
        <Input
          label="Password"
          htmlFor="password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          required
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
          error={errors.password}
          hint="Must include an uppercase letter, a lowercase letter, and a number."
        />
        <Button type="submit" variant="primary" loading={loading} fullWidth>
          Create Account
        </Button>
      </form>
    </AuthLayout>
  );
}
