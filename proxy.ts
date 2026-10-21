import { WAITLIST_ACTIVE } from '@/shared/lib/env';
import { LEGAL_PATHS } from '@/shared/lib/routes';
import { SESSION_HINT_COOKIE } from '@/shared/session/constants';
import { type NextRequest, NextResponse } from 'next/server';

const LANDING = '/';
// open to everyone, even while only the waitlist is
const ALWAYS_OPEN = new Set([LANDING, ...LEGAL_PATHS]);
const PUBLIC_PATHS = new Set([
  ...ALWAYS_OPEN,
  '/sign-in',
  '/sign-up',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/auth/complete',
  '/invite',
]);
// /invite/<token>: links sent before tokens moved into the fragment
const PUBLIC_PREFIXES = ['/invite/'];

// UX only: sends guests to sign in before the page loads. The API authorizes every request itself.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // while only the waitlist is open, every other page leads back to the landing page that offers it
  if (WAITLIST_ACTIVE && !ALWAYS_OPEN.has(pathname)) {
    return NextResponse.redirect(new URL(LANDING, request.url));
  }

  const isPublic = PUBLIC_PATHS.has(pathname)
    || PUBLIC_PREFIXES.some((prefix) => {
      return pathname.startsWith(prefix);
    });
  if (isPublic || request.cookies.has(SESSION_HINT_COOKIE)) {
    return NextResponse.next();
  }

  const signIn = new URL('/sign-in', request.url);
  signIn.searchParams.set('from', `${pathname}${search}`);
  return NextResponse.redirect(signIn);
}

// skips the internal docs (gated in the page itself) and static files
export const config = { matcher: '/((?!docs(?:/|$)|_next/|.*\\.).*)' };
