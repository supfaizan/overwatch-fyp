import Toaster from '@/shared/components/toaster';
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Overwatch',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // next-themes sets the class before hydration, so the mismatch warning is expected
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" disableTransitionOnChange>
          {/* padding lives here, not on body: Radix's scroll lock overrides body padding while a menu or dialog is open */}
          <div className="px-4 py-2">{children}</div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
