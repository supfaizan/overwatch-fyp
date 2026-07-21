"use client";

import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMoveTicket } from "../hooks";
import { useDraggable, useDroppable } from "../hooks/use-dnd";
import { useTicketsStore } from "../stores/tickets-store";
import type { BoardColumn, Ticket, TicketStatus } from "../types";
import { TicketCard } from "./TicketCard";

interface TicketColumnProps {
  column: BoardColumn;
  tickets: Ticket[];
}

export function TicketColumn({ column, tickets }: TicketColumnProps) {
  const moveTicket = useMoveTicket();
  const moveColumn = useTicketsStore((s) => s.moveColumn);

  const { isDragging, dragProps } = useDraggable({
    kind: "column",
    id: column.id,
  });

  /** The section itself reorders against other sections. */
  const section = useDroppable({
    accept: "column",
    onDrop: (payload) => moveColumn(payload.id as TicketStatus, column.id),
  });

  /** The list accepts tickets — dropping on empty space appends. */
  const list = useDroppable({
    accept: "ticket",
    onDrop: (payload) => moveTicket({ id: payload.id }, column.id),
  });

  return (
    <section
      {...section.dropProps}
      className={cn(
        "flex w-[320px] shrink-0 flex-col overflow-hidden rounded-lg border border-line-1 bg-ink-900",
        isDragging && "opacity-50",
        section.isOver && "border-signal-border",
      )}
    >
      <header
        {...dragProps}
        aria-roledescription="Draggable section"
        className="flex shrink-0 cursor-grab items-center justify-between border-b border-line-1 bg-ink-850 px-3 py-2.5 active:cursor-grabbing"
      >
        <span className="flex items-center gap-1.5 ow-mono-micro text-text-mid">
          <GripVertical className="size-3.5 text-text-dim" aria-hidden />
          {column.label}
        </span>
        <span className="rounded-pill border border-line-2 bg-surface-2 px-2 py-0.5 ow-mono-micro text-text-lo">
          {tickets.length}
        </span>
      </header>

      <div
        {...list.dropProps}
        className={cn(
          "min-h-0 flex-1 space-y-2 overflow-y-auto p-2 transition-colors",
          list.isOver && "bg-signal-soft",
        )}
      >
        {tickets.map((ticket, index) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            column={column.id}
            index={index}
            onDropAt={(ticketId, at) => moveTicket({ id: ticketId }, column.id, at)}
          />
        ))}

        {tickets.length === 0 && (
          <p className="grid h-24 place-items-center rounded-md border border-dashed border-line-1 ow-mono-micro text-text-dim">
            NO TICKETS
          </p>
        )}
      </div>
    </section>
  );
}
