import type { Metadata } from "next";
import { IBM_Plex_Sans, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AppProviders } from "@/components/providers/AppProviders";
import { ToastProvider } from "@/components/providers/ToastProvider";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      className={`${ibmPlexSans.variable} ${sourceCodePro.variable} h-full antialiased`}
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
