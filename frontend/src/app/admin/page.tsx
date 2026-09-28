"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/Toast";
import { Badge } from "@/components/Badge";
import { SkeletonCard } from "@/components/Spinner";
import { ConfirmDialog } from "@/components/Modal";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  isBanned: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  _count: { notes: number };
}

export default function AdminPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [search, setSearch] = useState("");
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const result = await apiFetch<AdminUser[]>("/admin/users");
    if (result.success) setUsers(result.data || []);
    else push(result.error || "Could not load users.", "error");
  }

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser || currentUser.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, currentUser]);

  if (authLoading || !currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 py-10 sm:px-6 lg:px-8">
        <SkeletonCard />
      </div>
    );
  }

  const filtered =
    users?.filter(
      (u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    ) || [];

  async function toggleBan() {
    if (!banTarget) return;
    setBusy(true);
    const result = await apiFetch<AdminUser>(`/admin/users/${banTarget.id}/ban`, {
      method: "PATCH",
      body: JSON.stringify({ isBanned: !banTarget.isBanned }),
    });
    setBusy(false);
    setBanTarget(null);
    if (result.success) {
      setUsers((prev) => prev?.map((u) => (u.id === banTarget.id ? { ...u, isBanned: !banTarget.isBanned } : u)) || prev);
      push(`${banTarget.name} has been ${!banTarget.isBanned ? "banned" : "unbanned"}.`, "success");
    } else {
      push(result.error || "Action failed.", "error");
    }
  }

  async function deleteUser() {
    if (!deleteTarget) return;
    setBusy(true);
    const result = await apiFetch(`/admin/users/${deleteTarget.id}`, { method: "DELETE" });
    setBusy(false);
    setDeleteTarget(null);
    if (result.success) {
      setUsers((prev) => prev?.filter((u) => u.id !== deleteTarget.id) || prev);
      push(`${deleteTarget.name} was deleted.`, "success");
    } else {
      push(result.error || "Action failed.", "error");
    }
  }

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="tech-label">CONTROL ROOM</p>
        <h1 className="mt-1 font-sans-tech text-3xl font-bold text-[var(--color-line)]">User Administration</h1>
        <p className="mt-2 max-w-2xl font-sans-tech text-sm text-[#8593ad]">
          Audit registered accounts, suspend accounts that violate policy, or permanently remove them.
        </p>

        <div className="mt-8">
          <input
            className="field-input max-w-sm"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mt-6">
          {users === null ? (
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto border border-[var(--color-linefaint)]">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-linefaint)] bg-[rgba(16,42,92,0.4)]">
                    <th className="px-4 py-3 text-left tech-label">Name</th>
                    <th className="px-4 py-3 text-left tech-label">Email</th>
                    <th className="px-4 py-3 text-left tech-label">Role</th>
                    <th className="px-4 py-3 text-left tech-label">Notes</th>
                    <th className="px-4 py-3 text-left tech-label">Status</th>
                    <th className="px-4 py-3 text-left tech-label">Joined</th>
                    <th className="px-4 py-3 text-right tech-label">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-[var(--color-linefaint)] last:border-0 hover:bg-[rgba(16,42,92,0.2)]">
                      <td className="px-4 py-3 font-sans-tech text-[var(--color-line)]">{u.name}</td>
                      <td className="px-4 py-3 font-mono-tech text-xs text-[#8593ad]">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge tone={u.role === "ADMIN" ? "amber" : "neutral"}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono-tech text-xs text-[#8593ad]">{u._count.notes}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <Badge tone={u.isBanned ? "danger" : "ok"}>{u.isBanned ? "Banned" : "Active"}</Badge>
                          {!u.isEmailVerified && <Badge tone="neutral">Unverified</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono-tech text-xs text-[#5c6b85]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.id === currentUser?.id ? (
                          <span className="font-mono-tech text-xs text-[#5c6b85]">— you —</span>
                        ) : u.role === "ADMIN" ? (
                          <span className="font-mono-tech text-xs text-[#5c6b85]">protected</span>
                        ) : (
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setBanTarget(u)}
                              className="tech-label text-[var(--color-amber-bright)] hover:underline"
                            >
                              {u.isBanned ? "Unban" : "Ban"}
                            </button>
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="tech-label text-[var(--color-danger)] hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center font-sans-tech text-sm text-[#8593ad]">
                        No users match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!banTarget}
        onClose={() => setBanTarget(null)}
        onConfirm={toggleBan}
        title={banTarget?.isBanned ? "Unban User" : "Ban User"}
        description={`${banTarget?.isBanned ? "Restore access for" : "Suspend access for"} ${banTarget?.name}?`}
        confirmLabel={banTarget?.isBanned ? "Unban" : "Ban"}
        danger={!banTarget?.isBanned}
        loading={busy}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteUser}
        title="Delete User"
        description={`Permanently delete ${deleteTarget?.name} and all of their notes? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={busy}
      />
    </div>
  );
}
