"use client";

import { useTicketsStore } from "../stores/tickets-store";
import type { Ticket } from "../types";
import { TicketColumn } from "./TicketColumn";

interface TicketBoardProps {
  /** Resolves the ids held in the board arrangement to full tickets. */
  byId: Map<string, Ticket>;
}

export function TicketBoard({ byId }: TicketBoardProps) {
  const columns = useTicketsStore((s) => s.columns);
  const order = useTicketsStore((s) => s.order);

  return (
    <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-4">
      {columns.map((column) => {
        const tickets = order[column.id]
          .map((id) => byId.get(id))
          .filter((ticket): ticket is Ticket => Boolean(ticket));

        return (
          <TicketColumn key={column.id} column={column} tickets={tickets} />
        );
      })}
    </div>
  );
}
