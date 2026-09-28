export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: unknown;
}

// The separate NestJS backend's base URL, e.g. http://localhost:4000/api
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/**
 * The backend answers 401 with a `code` starting with "SESSION_" when the
 * signed-in user's session is no longer valid (account deleted, banned, token
 * expired/invalid). AuthContext registers a handler here to auto-logout.
 * Other 401s (e.g. wrong password on login / delete-account) carry no such
 * code and are left to the calling form.
 */
type SessionInvalidHandler = (code: string) => void;
let sessionInvalidHandler: SessionInvalidHandler | null = null;

export function setSessionInvalidHandler(handler: SessionInvalidHandler | null) {
  sessionInvalidHandler = handler;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include", // send/receive the httpOnly session cookie cross-origin
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });
    const json = await res.json().catch(() => ({ success: false, error: "Unexpected server response." }));
    if (!res.ok) {
      if (res.status === 401 && typeof json.code === "string" && json.code.startsWith("SESSION_")) {
        sessionInvalidHandler?.(json.code);
      }
      return { success: false, error: json.error || `Request failed (${res.status})`, code: json.code, details: json.details };
    }
    return json;
  } catch {
    return { success: false, error: "Network error. Check that the API server is running." };
  }
}
