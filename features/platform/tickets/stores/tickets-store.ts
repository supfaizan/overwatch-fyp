import { create } from "zustand";
import { COLUMNS } from "../static";
import type { BoardColumn, Ticket, TicketStatus } from "../types";

type TicketOrder = Record<TicketStatus, string[]>;

interface TicketsState {
  columns: BoardColumn[];
  order: TicketOrder;
  hydrate: (tickets: Ticket[]) => void;
}

function emptyOrder(): TicketOrder {
  return { backlog: [], in_progress: [], in_review: [], done: [] };
}

export const useTicketsStore = create<TicketsState>((set) => ({
  columns: COLUMNS,
  order: emptyOrder(),
  hydrate: (tickets) => {
    const order = emptyOrder();
    for (const ticket of tickets) order[ticket.status].push(ticket.id);
    set({ order });
  },
}));
