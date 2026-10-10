import { NextResponse } from 'next/server';

export function proxy(request: Request) {
// TODO: to be removed once waitlist has ended
  return NextResponse.redirect(new URL('/waitlist', request.url));
}

// makes sure that the proxy is not applied to the waitlist route – otherwise infinite redirect loop
export const config = { matcher: '/((?!waitlist(?:/|$)|_next/|.*\\.).*)' };
