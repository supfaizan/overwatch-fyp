/** How each brand a deployment can present itself as is written. Internal names (cookies, storage keys) never change. */
const PRODUCT_NAMES = { overwatch: 'Overwatch', bearings: 'Bearings' } as const;

type ProductKey = keyof typeof PRODUCT_NAMES;

function isProductKey(value: string): value is ProductKey {
  return Object.hasOwn(PRODUCT_NAMES, value);
}

/** The product name users see, from an env value; unset means Overwatch, anything unknown fails the build. */
export function parseProductName(value: string | undefined): string {
  if (!value) {
    return PRODUCT_NAMES.overwatch;
  }
  if (!isProductKey(value)) {
    throw new Error(
      `NEXT_PUBLIC_PRODUCT_NAME must be one of ${
        Object.keys(PRODUCT_NAMES).join(', ')
      }; got "${value}"`,
    );
  }
  return PRODUCT_NAMES[value];
}

/** A true/false env flag; unset means false, anything else fails the build. */
export function parseFlag(name: string, value: string | undefined): boolean {
  if (!value || value === 'false') {
    return false;
  }
  if (value === 'true') {
    return true;
  }
  throw new Error(`${name} must be true or false; got "${value}"`);
}

// spelled out in full so Next inlines them at build time
export const PRODUCT_NAME = parseProductName(process.env.NEXT_PUBLIC_PRODUCT_NAME);
/** Only the waitlist is open: the landing page offers it, and every other page leads back there. */
export const WAITLIST_ACTIVE = parseFlag(
  'NEXT_PUBLIC_WAITLIST_ACTIVE',
  process.env.NEXT_PUBLIC_WAITLIST_ACTIVE,
);
