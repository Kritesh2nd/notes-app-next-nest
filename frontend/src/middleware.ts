import { NextRequest, NextResponse } from "next/server";

// Must match the cookie name set by the backend (see backend/src/common/token.util.ts)
const AUTH_COOKIE = "bp_session";

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];
const AUTH_PAGES = ["/login", "/register"];

// This middleware only checks whether a session cookie is present, as a fast
// redirect for obviously-unauthenticated requests. It cannot verify the JWT's
// signature or read the user's role (that would require re-implementing JWT
// verification here, or an extra network round-trip on every request). Real
// authorization — signature checks, expiry, banned/role checks — is enforced
// by the NestJS backend on every API call. Pages that need a role check
// (e.g. /admin) also verify client-side via useAuth() after data loads.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = !!req.cookies.get(AUTH_COOKIE)?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isProtected && !hasSession) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
