import { cn } from '@/shared/lib/cn';
import { PRODUCT_NAME } from '@/shared/lib/env';
import Image from 'next/image';
import Link from 'next/link';

const LOGO_SIZE = 23;

/**
 * The logo and product name, linking home. The name follows `NEXT_PUBLIC_PRODUCT_NAME`.
 * - Use it once per page, top left, on pages outside the app (landing, sign-in, errors).
 * - Size the name with `className` (`text-xl` by default); the mark keeps its size.
 */
export default function Brand({ href = '/', className }: {
  /**
   * Where it links.
   * @default '/'
   */
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn('flex items-center gap-2 text-xl', className)}>
      <Image src="/logo.svg" alt="" width={LOGO_SIZE} height={LOGO_SIZE} priority />
      {PRODUCT_NAME}
    </Link>
  );
}
