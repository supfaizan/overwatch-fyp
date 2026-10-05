"use client";

import type { BoardColumn, Ticket } from "../types";
import { TicketCard } from "./TicketCard";

interface TicketColumnProps {
  column: BoardColumn;
  tickets: Ticket[];
}

export function TicketColumn({ column, tickets }: TicketColumnProps) {
  return (
    <section className="flex w-[320px] shrink-0 flex-col overflow-hidden rounded-lg border border-line-1 bg-ink-900">
      <header className="flex shrink-0 items-center justify-between border-b border-line-1 bg-ink-850 px-3 py-2.5">
        <span className="ow-micro text-text-mid">{column.label}</span>
        <span className="rounded-pill border border-line-2 bg-surface-2 px-2 py-0.5 ow-micro text-text-lo">
          {tickets.length}
        </span>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}

        {tickets.length === 0 && (
          <p className="grid h-24 place-items-center rounded-md border border-dashed border-line-1 ow-micro text-text-dim">
            NO TICKETS
          </p>
        )}
      </div>
    </section>
  );
}
