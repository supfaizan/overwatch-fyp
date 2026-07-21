import { AppBar } from "@/features/platform/components/AppBar";

/** Chrome for the authenticated app. Route protection is handled upstream by
 *  proxy.ts, so this layout only owns the shared shell. */
export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-ink-850">
      <AppBar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
