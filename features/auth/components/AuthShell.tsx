import Link from "next/link";

interface AuthShellProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/** Split console layout shared by the login & register screens. */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* brand / console side */}
      <aside className="relative hidden overflow-hidden border-r border-line-1 bg-ink-900 lg:flex lg:flex-col lg:justify-between lg:px-6 lg:py-12">
        <div className="ow-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="ow-scanline" aria-hidden />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="ow-live-dot" aria-hidden />
          <span className="ow-label !text-[14px] text-text-hi">OVERWATCH</span>
          <span className="ow-mono-micro text-text-dim">{"// OPINT"}</span>
        </Link>

        <div className="relative max-w-md">
          <p className="ow-mono-micro text-signal">{eyebrow}</p>
          <h2 className="ow-display mt-4 !text-[40px] leading-[1.05] text-text-hi">
            System knowledge,
            <br />
            <span className="text-signal">no longer tribal.</span>
          </h2>
          <p className="ow-body mt-5 text-text-mid">
            Connect a repository and watch the architecture come alive.
          </p>

          <div className="mt-8 space-y-2">
            {[
              "› indexing pipeline ......... READY",
              "› neo4j graph store ......... ONLINE",
              "› t-gnn inference ........... STANDBY",
            ].map((line) => (
              <p key={line} className="ow-mono-data text-text-lo">
                {line}
              </p>
            ))}
          </div>
        </div>

        <p className="relative ow-mono-micro text-text-dim">
          OPERATIONAL INTELLIGENCE FOR ENGINEERING TEAMS
        </p>
      </aside>

      {/* form side */}
      <main className="relative flex items-center justify-center px-3 py-12">
        <div className="ow-grid pointer-events-none absolute inset-x-0 top-0 h-64 opacity-40 lg:hidden" aria-hidden />
        <div className="relative w-full max-w-sm">
          <Link
            href="/"
            className="mb-10 flex items-center gap-2.5 lg:hidden"
          >
            <span className="ow-live-dot" aria-hidden />
            <span className="ow-label !text-[13px] text-text-hi">OVERWATCH</span>
          </Link>

          <p className="ow-mono-micro text-text-dim">{eyebrow}</p>
          <h1 className="ow-heading mt-3 text-text-hi">{title}</h1>
          <p className="ow-body mt-2 text-text-mid">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <p className="mt-8 text-center ow-mono-micro text-text-lo">{footer}</p>
        </div>
      </main>
    </div>
  );
}
