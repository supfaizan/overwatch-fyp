'use client';

import Button from '@/shared/components/button';
import Link from 'next/link';
import type { MouseEvent } from 'react';
import { REDUCED_MOTION } from '../constants';

/** The main call to action: scrolls to a section on this page (`#id`) or opens another page. */
export default function HeroCta({ href, label }: { href: string; label: string }) {
  if (!href.startsWith('#')) {
    return (
      <Button asChild variant="primary" size="lg" className="px-8">
        <Link href={href}>{label}</Link>
      </Button>
    );
  }

  const scroll = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(href.slice(1));
    if (!target) {
      return;
    }
    event.preventDefault();
    const smooth = !window.matchMedia(REDUCED_MOTION).matches;
    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    // the first field, without a second jump
    target.querySelector('input')?.focus({ preventScroll: true });
    window.history.replaceState(null, '', href);
  };

  return (
    <Button asChild variant="primary" size="lg" className="px-8">
      <a href={href} onClick={scroll}>
        {label}
      </a>
    </Button>
  );
}
