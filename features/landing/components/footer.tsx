import { PRODUCT_NAME, WAITLIST_ACTIVE } from '@/shared/lib/env';
import { LEGAL_PAGES } from '@/shared/lib/routes';
import Image from 'next/image';
import Link from 'next/link';
import { SECTION_IDS } from '../constants';

const PRODUCT_LINKS = [
  { label: `Why ${PRODUCT_NAME}`, href: `/#${SECTION_IDS.why}` },
  { label: 'FAQ', href: `/#${SECTION_IDS.faq}` },
  ...(WAITLIST_ACTIVE
    ? [{ label: 'Join the waitlist', href: `/#${SECTION_IDS.waitlist}` }]
    : [{ label: 'Get started', href: '/sign-up' }, { label: 'Log in', href: '/sign-in' }]),
];

// the name already fills the bottom of the footer, so the top carries only the mark
const MARK_SIZE = 44;

const COLUMNS = [
  { title: 'Product', links: PRODUCT_LINKS },
  { title: 'Legal', links: LEGAL_PAGES },
];

/** The site footer: links, the small print, and the name, large, sinking off the bottom edge. */
export default function Footer() {
  return (
    <footer className="-mx-4 -mb-2 px-2 pb-2">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface px-6 pt-14 md:px-12">
        <div className="relative z-10 grid gap-12 md:grid-cols-[1fr_auto_auto] md:gap-24">
          <div className="flex max-w-sm flex-col gap-5">
            <Link href="/" aria-label={PRODUCT_NAME} className="w-fit">
              <Image src="/logo.svg" alt="" width={MARK_SIZE} height={MARK_SIZE} />
            </Link>
            <p className="text-lg text-muted">
              Every decision, traced back to where it was made.
            </p>
          </div>
          {COLUMNS.map((column) => {
            return (
              <nav key={column.title} aria-label={column.title} className="flex flex-col gap-4">
                <p className="text-xs font-medium tracking-widest text-muted uppercase">
                  {column.title}
                </p>
                <ul className="flex flex-col gap-3">
                  {column.links.map((link) => {
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm transition-colors hover:text-primary"
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            );
          })}
        </div>
        <div className="relative z-10 mt-16 flex flex-wrap justify-between gap-4 border-t border-border pt-6 text-xs text-muted">
          <p>© {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.</p>
          <p>Made for teams who decide things.</p>
        </div>
        {/* the name, large, sinking off the bottom edge on the canvas grid */}
        <p
          aria-hidden
          className="pointer-events-none -mx-6 -mb-[0.22em] bg-dot-grid pt-6 md:-mx-12 text-center text-[clamp(4rem,19vw,18rem)] leading-none font-bold tracking-tighter select-none"
        >
          <span className="bg-linear-to-b from-primary/35 to-primary/0 bg-clip-text text-transparent">
            {PRODUCT_NAME}
          </span>
        </p>
      </div>
    </footer>
  );
}
