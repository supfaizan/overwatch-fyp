"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, Loader2, PanelsTopLeft } from "lucide-react";
import { useOnboardingStatus } from "@/features/platform/ingestion/hooks";
import { TicketBoard } from "./components/TicketBoard";
import { useTickets } from "./hooks";

function ConnectJiraPrompt({ projectOnly = false }: { projectOnly?: boolean }) {
  return (
    <div className="grid flex-1 place-items-center p-6">
      <div className="max-w-md text-center">
        <PanelsTopLeft className="mx-auto size-10 text-signal" />
        <h1 className="ow-heading mt-5 text-text-hi">
          {projectOnly ? "Select a Jira project" : "Connect Jira to view your project board"}
        </h1>
        <p className="ow-body mt-3 text-text-mid">
          {projectOnly
            ? "Choose the Jira project whose issues should appear on this board."
            : "Link a Jira account and project to synchronize its issues alongside your architecture."}
        </p>
        <Link
          href="/connect"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-signal px-4 font-mono text-[12px] font-medium tracking-wide text-signal-ink"
        >
          {projectOnly ? "SELECT PROJECT" : "CONNECT JIRA"}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

export function Tickets() {
  const onboarding = useOnboardingStatus();
  const syncDone =
    onboarding.data?.jira.projectConnected &&
    onboarding.data.jira.syncStatus === "done";
  const tickets = useTickets(Boolean(syncDone));

  const count = tickets.data?.length ?? 0;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-3 border-b border-line-1 bg-ink-900 px-4 py-3">
        <span className="ow-mono-micro text-text-mid">TICKETS</span>
        <span className="ow-mono-micro text-text-dim">{count} JIRA ISSUES</span>
      </header>

      {onboarding.isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 ow-mono-micro text-text-dim">
          <Loader2 className="size-4 animate-spin" /> CHECKING JIRA CONNECTION…
        </div>
      ) : onboarding.isError ? (
        <div className="grid flex-1 place-items-center p-6 text-center">
          <p className="ow-body text-critical">{onboarding.error.message}</p>
        </div>
      ) : !onboarding.data?.jira.connected ? (
        <ConnectJiraPrompt />
      ) : !onboarding.data.jira.projectConnected ? (
        <ConnectJiraPrompt projectOnly />
      ) : onboarding.data.jira.syncStatus === "failed" ? (
        <div className="grid flex-1 place-items-center p-6 text-center">
          <div>
            <AlertCircle className="mx-auto size-9 text-critical" />
            <h1 className="ow-heading mt-4 text-text-hi">Jira sync needs attention</h1>
            <p className="ow-body mt-2 text-text-mid">
              Return to integrations to reconnect Jira or retry the project setup.
            </p>
            <Link href="/connect" className="mt-4 inline-block text-signal hover:underline">
              MANAGE INTEGRATIONS
            </Link>
          </div>
        </div>
      ) : !syncDone || tickets.isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 ow-mono-micro text-text-dim">
          <Loader2 className="size-4 animate-spin" /> SYNCHRONIZING JIRA ISSUES…
        </div>
      ) : tickets.isError ? (
        <div className="grid flex-1 place-items-center p-6 text-center">
          <p className="ow-body text-critical">{tickets.error.message}</p>
        </div>
      ) : count === 0 ? (
        <div className="grid flex-1 place-items-center p-6 text-center">
          <div>
            <PanelsTopLeft className="mx-auto size-9 text-text-lo" />
            <h1 className="ow-heading mt-4 text-text-hi">No Jira issues found</h1>
            <p className="ow-body mt-2 text-text-mid">
              The connected project currently has no synchronized issues.
            </p>
          </div>
        </div>
      ) : (
        <TicketBoard byId={tickets.byId} />
      )}
    </div>
  );
}
