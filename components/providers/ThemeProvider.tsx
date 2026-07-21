"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";

/** Dark-first. The app only ships the dark palette today, but next-themes keeps
 *  the door open for a light theme without touching feature code. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
