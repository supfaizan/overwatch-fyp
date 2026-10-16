'use client';

import { LEGAL_PATHS } from '@/shared/lib/routes';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

// the marketing pages are designed light only
const LIGHT_ONLY_PATHS = new Set(['/', ...LEGAL_PATHS]);

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <NextThemesProvider
      attribute="class"
      disableTransitionOnChange
      forcedTheme={LIGHT_ONLY_PATHS.has(pathname) ? 'light' : undefined}
    >
      {children}
    </NextThemesProvider>
  );
}
