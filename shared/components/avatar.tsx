import { cn } from '@/shared/lib/cn';
import { Avatar as AvatarPrimitive } from 'radix-ui';

const sizes = {
  sm: 'size-6 text-[10px]',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
};

type AvatarProps = {
  /** Image URL. While it loads, or if it fails, the initials show instead. */
  src?: string | null;
  /** Person's name: the image's alt text and the source of the initials. */
  name: string;
  /** @default 'md' */
  size?: keyof typeof sizes;
  className?: string;
};

/**
 * Round profile picture with an initials fallback (Radix Avatar).
 * - Always pass `name`, even with an image: it's the accessible label.
 * - Decorative next to a visible name? It still works; screen readers read the name once.
 */
export default function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .map((part) => {
      return part[0];
    })
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <AvatarPrimitive.Root
      className={cn(
        'inline-flex shrink-0 overflow-hidden rounded-full border border-border bg-fill-hover',
        sizes[size],
        className,
      )}
    >
      {src && <AvatarPrimitive.Image src={src} alt={name} className="size-full object-cover" />}
      <AvatarPrimitive.Fallback className="flex size-full items-center justify-center font-semibold text-muted">
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
