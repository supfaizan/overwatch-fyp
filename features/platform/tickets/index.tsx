"use client";

import { Loader2 } from "lucide-react";
import { TicketBoard } from "./components/TicketBoard";
import { useTickets } from "./hooks";

export function Tickets() {
  const { data, byId, isLoading } = useTickets();

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-3 border-b border-line-1 bg-ink-900 px-4 py-3">
        <span className="ow-mono-micro text-text-mid">TICKETS</span>
        <span className="ow-mono-micro text-text-dim">
          {data?.length ?? 0} MAPPED TO SERVICES
        </span>
      </header>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-2 ow-mono-micro text-text-dim">
          <Loader2 className="size-4 animate-spin" /> LOADING TICKETS…
        </div>
      ) : (
        <TicketBoard byId={byId} />
      )}
    </div>
  );
}
