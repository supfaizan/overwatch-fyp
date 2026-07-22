/* Route auth guard (Next.js 16 proxy — the renamed `middleware`).
   Reads the auth cookie set by the Zustand store, decodes the JWT `exp`, and
   redirects unauthenticated users to /login. PUBLIC_ROUTES is the allowlist.
   This runs before any JS — which is why the token is stored in a cookie. */

import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_TOKEN, PUBLIC_ROUTES, GUEST_REDIRECT } from "@/constants";
import { isValidAccessToken } from "@/lib/auth-token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_TOKEN)?.value;
  const hasSession = Boolean(token);
  const isFresh = Boolean(token && isValidAccessToken(token));
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Only bounce away from the auth pages on a token that is actually still
  // valid. Doing this on a stale token would ping-pong a genuinely expired
  // session between /login and /dashboard.
  if (isFresh && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Guests cannot reach protected routes. Note this checks for the *presence*
  // of a session, not a live access token: the access token lasts 15 minutes
  // while the refresh cookie lasts 30 days, so demanding a fresh one here sent
  // every returning user to /login even though their session was recoverable.
  // The page loads optimistically and AuthBootstrap silently refreshes; the
  // real enforcement is the backend rejecting any request without a valid JWT.
  if (!hasSession && !isPublic) {
    const url = new URL(GUEST_REDIRECT, request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API, Next internals, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
