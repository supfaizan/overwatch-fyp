import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Overwatch",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background px-4 py-2">{children}</body>
    </html>
  );
}
