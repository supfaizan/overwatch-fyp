import { NextResponse } from 'next/server';

export function proxy(request: Request) {
// TODO: to be removed once waitlist has ended
  return NextResponse.redirect(new URL('/waitlist', request.url));
}

// skips waitlist (else infinite redirect loop) and the internal docs (gated in the page itself)
export const config = { matcher: '/((?!waitlist(?:/|$)|docs(?:/|$)|_next/|.*\\.).*)' };
