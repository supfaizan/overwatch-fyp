/* Feature-local board state: section order, the ticket ids inside each section,
   and the drag currently in flight. Kept out of react-query so a drag never
   fights a refetch — `hydrate` seeds the arrangement from server data. */

import { create } from "zustand";
import { COLUMNS } from "../static";
import type { BoardColumn, Ticket, TicketStatus } from "../types";

/** Both board levels are draggable; the kind decides what a target accepts. */
export type DragKind = "ticket" | "column";

export interface DragPayload {
  kind: DragKind;
  id: string;
  /** Owning column, for ticket drags. */
  from?: TicketStatus;
}

type TicketOrder = Record<TicketStatus, string[]>;

interface TicketsState {
  columns: BoardColumn[];
  order: TicketOrder;
  /** Signature of the last hydrated ticket set, so refetches are idempotent. */
  hydratedFrom: string;
  active: DragPayload | null;
  hydrate: (tickets: Ticket[]) => void;
  setActive: (payload: DragPayload | null) => void;
  /** Move a ticket into `to` at `index` (-1 appends). */
  moveTicket: (ticketId: string, to: TicketStatus, index?: number) => void;
  /** Reorder sections by dropping the dragged one onto `overId`. */
  moveColumn: (dragId: TicketStatus, overId: TicketStatus) => void;
}

const emptyOrder = (): TicketOrder => ({
  backlog: [],
  in_progress: [],
  in_review: [],
  done: [],
});

/** Move `id` to `index` within `list` (also used to insert from another list). */
function insertAt(list: string[], id: string, index: number): string[] {
  const next = list.filter((item) => item !== id);
  const at = index < 0 || index > next.length ? next.length : index;
  next.splice(at, 0, id);
  return next;
}

function signature(tickets: Ticket[]): string {
  return tickets
    .map((t) => t.id)
    .sort()
    .join("|");
}

export const useTicketsStore = create<TicketsState>((set, get) => ({
  columns: [...COLUMNS],
  order: emptyOrder(),
  hydratedFrom: "",
  active: null,

  hydrate: (tickets) => {
    const next = signature(tickets);
    if (next === get().hydratedFrom) return;
    const order = emptyOrder();
    for (const ticket of tickets) order[ticket.status].push(ticket.id);
    set({ order, hydratedFrom: next });
  },

  setActive: (active) => set({ active }),

  moveTicket: (ticketId, to, index = -1) =>
    set((state) => {
      const order = { ...state.order };
      for (const key of Object.keys(order) as TicketStatus[]) {
        if (key !== to) order[key] = order[key].filter((id) => id !== ticketId);
      }
      order[to] = insertAt(order[to], ticketId, index);
      return { order };
    }),

  moveColumn: (dragId, overId) =>
    set((state) => {
      if (dragId === overId) return state;
      const ids = state.columns.map((c) => c.id);
      const overIndex = ids.indexOf(overId);
      if (overIndex < 0) return state;
      const nextIds = insertAt(ids, dragId, overIndex);
      const byId = new Map(state.columns.map((c) => [c.id, c]));
      return {
        columns: nextIds
          .map((id) => byId.get(id as TicketStatus))
          .filter((c): c is BoardColumn => Boolean(c)),
      };
    }),
}));
