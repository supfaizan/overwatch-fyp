/** The legal pages, linked from the footer and open to everyone, even while only the waitlist is. */
export const LEGAL_PAGES = [
  { label: 'Privacy policy', href: '/privacy' },
  { label: 'Terms of service', href: '/terms' },
  { label: 'Cookie policy', href: '/cookies' },
] as const;

export const LEGAL_PATHS: readonly string[] = LEGAL_PAGES.map((page) => {
  return page.href;
});
