"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/Toast";
import { Input } from "@/components/FormField";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { PageLoader } from "@/components/Spinner";

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const { push } = useToast();
  const router = useRouter();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (loading) return <PageLoader label="Loading account…" />;
  if (!user) return null;

  async function handleDelete() {
    if (!password) {
      setError("Enter your password to confirm.");
      return;
    }
    setDeleting(true);
    const result = await apiFetch("/account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
    setDeleting(false);

    if (!result.success) {
      setError(result.error || "Could not delete account.");
      return;
    }
    push("Account deleted. Goodbye for now.", "success");
    router.push("/");
  }

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="tech-label">ACCOUNT PANEL</p>
        <h1 className="mt-1 font-sans-tech text-3xl font-bold text-[var(--color-line)]">Account Settings</h1>

        <div className="blueprint-card corner-ticks mt-8 p-6 sm:p-8">
          <h2 className="font-sans-tech text-lg font-semibold text-[var(--color-line)]">Profile</h2>
          <dl className="mt-4 divide-y divide-dashed divide-[var(--color-linefaint)] font-mono-tech text-sm">
            <div className="flex items-center justify-between py-3">
              <dt className="text-[#5c6b85]">Name</dt>
              <dd className="text-[#c7d0e0]">{user.name}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-[#5c6b85]">Email</dt>
              <dd className="text-[#c7d0e0]">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-[#5c6b85]">Role</dt>
              <dd>
                <Badge tone={user.role === "ADMIN" ? "amber" : "neutral"}>{user.role}</Badge>
              </dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-[#5c6b85]">Email Verified</dt>
              <dd>
                <Badge tone={user.isEmailVerified ? "ok" : "danger"}>
                  {user.isEmailVerified ? "Verified" : "Unverified"}
                </Badge>
              </dd>
            </div>
          </dl>
          <div className="mt-6">
            <Button variant="secondary" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>

        <div className="mt-8 border border-[var(--color-danger)]/40 bg-[rgba(255,107,94,0.04)] p-6 sm:p-8">
          <h2 className="font-sans-tech text-lg font-semibold text-[var(--color-danger)]">Danger Zone</h2>
          <p className="mt-2 font-sans-tech text-sm leading-6 text-[#b9c2d0]">
            Deleting your account permanently removes your profile and every note you&apos;ve written. This cannot
            be undone.
          </p>
          <Button variant="danger" className="mt-5" onClick={() => setConfirmOpen(true)}>
            Delete My Account
          </Button>
        </div>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm Account Deletion">
        <p className="mb-4 font-sans-tech text-sm leading-6 text-[#b9c2d0]">
          Enter your password to permanently delete your account and all notes.
        </p>
        <Input
          label="Password"
          htmlFor="confirm-password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          error={error}
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Permanently Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
