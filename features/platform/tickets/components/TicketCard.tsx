"use client";

import { cn } from "@/lib/utils";
import { PRIORITY_DOT } from "../static";
import type { Ticket } from "../types";

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const assigneeInitials = ticket.assignee
    ?.split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="ow-panel p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 ow-micro text-text-lo">
          <span
            className={cn("size-1.5 rounded-pill", PRIORITY_DOT[ticket.priority])}
            aria-hidden
          />
          {ticket.externalId}
        </span>
        <span className="ow-micro text-text-dim">{ticket.projectKey}</span>
      </div>

      <p className="mt-2 ow-body !text-[13px] text-text-hi">{ticket.title}</p>

      <div className="mt-3 flex items-center justify-between border-t border-line-1 pt-2">
        <span className="ow-micro text-text-dim">
          {ticket.updatedAt?.slice(0, 10) ?? "No update date"}
        </span>
        {assigneeInitials && (
          <span
            title={ticket.assignee}
            className="grid size-6 place-items-center rounded-pill border border-line-2 bg-surface-2 ow-micro text-text-mid"
          >
            {assigneeInitials}
          </span>
        )}
      </div>
    </article>
  );
}
