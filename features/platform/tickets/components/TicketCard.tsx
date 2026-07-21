"use client";

import { cn } from "@/lib/utils";
import { useDraggable, useDroppable } from "../hooks/use-dnd";
import { CATEGORY_META, PRIORITY_DOT } from "../static";
import type { Ticket, TicketStatus } from "../types";

interface TicketCardProps {
  ticket: Ticket;
  column: TicketStatus;
  index: number;
  /** Drop the dragged ticket into this card's slot. */
  onDropAt: (ticketId: string, index: number) => void;
}

export function TicketCard({
  ticket,
  column,
  index,
  onDropAt,
}: TicketCardProps) {
  const { isDragging, dragProps } = useDraggable({
    kind: "ticket",
    id: ticket.id,
    from: column,
  });

  const { isOver, dropProps } = useDroppable({
    accept: "ticket",
    disabled: isDragging,
    onDrop: (payload) => onDropAt(payload.id, index),
  });

  const category = CATEGORY_META[ticket.category];

  return (
    <article
      {...dragProps}
      {...dropProps}
      aria-roledescription="Draggable ticket"
      className={cn(
        "ow-panel cursor-grab p-3 active:cursor-grabbing",
        isDragging && "opacity-40",
        isOver && "border-signal-border",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 ow-mono-micro text-text-lo">
          <span
            className={cn("size-1.5 rounded-pill", PRIORITY_DOT[ticket.priority])}
            aria-hidden
          />
          {ticket.externalId}
        </span>
        <span
          className={cn(
            "rounded-sm border px-1.5 py-0.5 ow-mono-micro",
            category.cls,
          )}
        >
          {category.label}
        </span>
      </div>

      <p className="mt-2 ow-body !text-[13px] text-text-hi">{ticket.title}</p>

      {/* AFFECTS edges — services this ticket touches, with the BERT score */}
      {ticket.impact.length > 0 && (
        <ul className="mt-2.5 flex flex-wrap gap-1">
          {ticket.impact.map((edge) => (
            <li
              key={edge.nodeId}
              className="rounded-sm border border-line-2 bg-surface-2 px-1.5 py-0.5 ow-mono-micro text-text-mid"
            >
              {edge.label}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex items-center justify-end border-t border-line-1 pt-2">
        <span className="flex items-center gap-2 ow-mono-micro text-text-dim">
          {ticket.updatedAt}
          <span className="grid size-5 place-items-center rounded-pill border border-line-2 bg-surface-2 text-text-mid">
            {ticket.assignee}
          </span>
        </span>
      </div>
    </article>
  );
}
