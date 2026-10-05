"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";

/** Light-first (PostHog-style). The app only ships the light palette today, but
 *  next-themes keeps the door open for a dark theme without touching feature code. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
