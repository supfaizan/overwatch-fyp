import { SESSION_HINT_COOKIE } from '@/shared/session/constants';
import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = new Set([
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

  // TODO: to be removed once waitlist has ended
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/waitlist', request.url));
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

// skips the waitlist (else infinite redirect loop), the internal docs (gated in the page itself) and static files
export const config = { matcher: '/((?!waitlist(?:/|$)|docs(?:/|$)|_next/|.*\\.).*)' };
