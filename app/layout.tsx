import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AppProviders } from "@/components/providers/AppProviders";
import { ToastProvider } from "@/components/providers/ToastProvider";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Overwatch — Operational Intelligence for Engineering Teams",
  description:
    "A living system-intelligence platform: a deterministic architecture diagram that updates in real time, grounded AI reasoning, and a T-GNN contract checker that flags broken contracts before they become incidents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider>
          <AppProviders>
            {children}
            <ToastProvider />
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
