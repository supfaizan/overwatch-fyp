"use client";

import { Gauge, Loader2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGraphCoverage } from "../hooks";
import type { GraphCoverage } from "../types";

/** What the graph contains, and how much of the code it could resolve.
 *
 * The backend reports resolution rather than implying it: calls it could not
 * resolve are counted, not hidden. This panel shows that plainly — a graph
 * that admits its gaps is more trustworthy than one that looks complete. */
export function CoveragePanel() {
  const { data, isLoading, isError, error } = useGraphCoverage();

  if (isLoading) {
    return (
      <PanelShell>
        <p className="flex items-center gap-2 ow-mono-micro text-text-dim">
          <Loader2 className="size-3.5 animate-spin text-signal" /> READING GRAPH…
        </p>
      </PanelShell>
    );
  }

  if (isError || !data) {
    return (
      <PanelShell>
        <p className="flex items-center gap-2 ow-mono-micro text-critical">
          <TriangleAlert className="size-3.5" /> COVERAGE UNAVAILABLE
        </p>
        <p className="mt-2 ow-body !text-[12px] text-text-mid">
          {error instanceof Error ? error.message : "Connect a repository first."}
        </p>
      </PanelShell>
    );
  }

  return (
    <PanelShell>
      <Contents coverage={data} />
    </PanelShell>
  );
}

function Contents({ coverage }: { coverage: GraphCoverage }) {
  const { resolution } = coverage;
  const skipped = Object.entries(coverage.skipped).filter(([, count]) => count > 0);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line-1 bg-line-1">
        <Stat label="FILES" value={coverage.files ?? sum(coverage.nodesByLabel, "File")} />
        <Stat label="DEFINITIONS" value={coverage.symbols ?? sum(coverage.nodesByLabel, "Symbol")} />
        <Stat label="PACKAGES" value={sum(coverage.nodesByLabel, "Package")} />
        <Stat label="ROUTES" value={sum(coverage.nodesByLabel, "Route")} />
      </section>

      {resolution && (
        <section className="space-y-3">
          <h3 className="ow-mono-micro text-text-lo">RESOLUTION</h3>

          <Meter
            label="Internal imports resolved"
            ratio={resolution.internalImportResolution}
            detail={`${resolution.importsToFiles} to files · ${resolution.importsToPackages} to packages · ${resolution.importsUnresolved} unresolved`}
          />
          <Meter
            label="Calls accounted for"
            ratio={resolution.callsAccounted}
            detail={`${resolution.callsResolved} internal · ${resolution.callsToPackages} into packages · of ${resolution.callsTotal}`}
          />

          <p className="ow-body !text-[11px] text-text-dim">
            The rest are calls on values whose type is not tracked. They are
            counted, never guessed at.
          </p>
        </section>
      )}

      {resolution && resolution.routesTotal > 0 && (
        <section className="space-y-2">
          <h3 className="ow-mono-micro text-text-lo">HTTP</h3>
          <p className="ow-mono-data !text-[11px] text-text-mid">
            {resolution.routesTotal} routes · {resolution.httpCallsMatched} of{" "}
            {resolution.httpCallsTotal} calls matched to one
          </p>
        </section>
      )}

      <section className="space-y-2">
        <h3 className="ow-mono-micro text-text-lo">RELATIONSHIPS</h3>
        <ul className="space-y-1">
          {Object.entries(coverage.edgesByType)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => (
              <li
                key={type}
                className="flex items-center justify-between ow-mono-data !text-[11px]"
              >
                <span className="text-text-mid">{type.toLowerCase()}</span>
                <span className="text-text-lo">{count.toLocaleString()}</span>
              </li>
            ))}
        </ul>
      </section>

      {coverage.symbolLayer === "omitted_over_cap" && (
        <p className="rounded-md border border-warn-border bg-warn-soft p-2 ow-body !text-[11px] text-text-mid">
          This repository is large enough that the definition layer was left
          out. Files and modules are still indexed.
        </p>
      )}

      {skipped.length > 0 && (
        <section className="space-y-2">
          <h3 className="ow-mono-micro text-text-lo">SKIPPED FILES</h3>
          <ul className="space-y-1">
            {skipped.map(([reason, count]) => (
              <li
                key={reason}
                className="flex items-center justify-between ow-mono-data !text-[11px]"
              >
                <span className="text-text-mid">{reason.replaceAll("_", " ")}</span>
                <span className="text-text-lo">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {coverage.graphVersion && (
        <p className="ow-mono-micro text-text-dim">
          COMMIT {coverage.graphVersion.slice(0, 10)}
        </p>
      )}
    </div>
  );
}

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-line-1 px-4 py-3">
        <Gauge className="size-3.5 text-signal" />
        <span className="ow-mono-micro text-text-mid">COVERAGE</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-ink-850 px-3 py-2.5">
      <p className="ow-mono-data !text-[16px] text-text-hi">
        {value.toLocaleString()}
      </p>
      <p className="mt-0.5 ow-mono-micro text-text-dim">{label}</p>
    </div>
  );
}

function Meter({
  label,
  ratio,
  detail,
}: {
  label: string;
  ratio: number;
  detail: string;
}) {
  const percent = Math.round(clamp(ratio) * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="ow-body !text-[12px] text-text-mid">{label}</span>
        <span
          className={cn(
            "ow-mono-data !text-[12px]",
            percent >= 90 ? "text-signal" : percent >= 50 ? "text-warn" : "text-text-lo",
          )}
        >
          {percent}%
        </span>
      </div>
      <div
        role="meter"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-1.5 overflow-hidden rounded-pill bg-surface-3"
      >
        <div
          className={cn(
            "h-full rounded-pill transition-[width] duration-500",
            percent >= 90 ? "bg-signal" : percent >= 50 ? "bg-warn" : "bg-line-2",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="ow-mono-micro text-text-dim">{detail}</p>
    </div>
  );
}

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

const sum = (counts: Record<string, number>, label: string) => counts[label] ?? 0;
