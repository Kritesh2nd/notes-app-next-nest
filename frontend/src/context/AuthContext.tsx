"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { apiFetch, setSessionInvalidHandler } from "@/lib/api-client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  isEmailVerified: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

// How often to re-check that the signed-in user still exists / isn't banned.
const SESSION_CHECK_MS = 30_000;

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

function reasonFromCode(code: string) {
  if (code === "SESSION_USER_DELETED") return "deleted";
  if (code === "SESSION_USER_BANNED") return "banned";
  return "expired";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const endingSession = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const result = await apiFetch<AuthUser>("/auth/me", { cache: "no-store" });
      setUser(result.success ? result.data || null : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  }, []);

  // Backend told us the session is dead (user deleted / banned / token invalid):
  // clear local state + the cookie, and send the visitor to /login if they're
  // somewhere that requires being signed in.
  useEffect(() => {
    setSessionInvalidHandler((code) => {
      if (endingSession.current) return;
      endingSession.current = true;
      setUser(null);
      setLoading(false);

      const onProtectedPage = PROTECTED_PREFIXES.some((p) => window.location.pathname.startsWith(p));
      // Belt and braces: the backend already clears the cookie, but if that Set-Cookie
      // was blocked (e.g. cross-site setup) this makes sure middleware stops seeing a session.
      apiFetch("/auth/logout", { method: "POST" }).finally(() => {
        if (onProtectedPage) {
          window.location.href = `/login?reason=${reasonFromCode(code)}`;
        } else {
          endingSession.current = false;
        }
      });
    });
    return () => setSessionInvalidHandler(null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // While signed in, periodically (and when the tab regains focus) re-validate the
  // session so a user deleted/banned elsewhere is logged out without needing to click.
  useEffect(() => {
    if (!user) return;
    const check = () => {
      if (document.visibilityState === "visible") apiFetch("/auth/me", { cache: "no-store" });
    };
    const id = setInterval(check, SESSION_CHECK_MS);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
