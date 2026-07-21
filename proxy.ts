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
  const authed = Boolean(token && isValidAccessToken(token));
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Signed-in users should not see the auth pages.
  if (authed && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Guests cannot reach protected routes.
  if (!authed && !isPublic) {
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
