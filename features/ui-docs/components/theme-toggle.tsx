'use client';

import { Moon, Sun } from '@phosphor-icons/react/ssr';
import { useTheme } from 'next-themes';
import Button from '@/shared/components/button';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // icons swap via CSS so SSR markup matches; resolvedTheme is only read on click
  return (
    <Button
      variant="tertiary"
      iconOnly
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </Button>
  );
}
