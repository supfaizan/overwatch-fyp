"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActiveRepoId } from "@/stores/repo-store";
import { getTickets, updateTicketStatus } from "../api";
import { ticketKeys } from "../api/query-keys";
import { useTicketsStore } from "../stores/tickets-store";
import type { Ticket, TicketStatus } from "../types";

/** Tickets for the active repo, with the board arrangement seeded from them. */
export function useTickets() {
  const repoId = useActiveRepoId();
  const hydrate = useTicketsStore((s) => s.hydrate);

  const query = useQuery({
    queryKey: ticketKeys.list(repoId),
    queryFn: () => getTickets(repoId),
  });

  const { data } = query;
  useEffect(() => {
    if (data) hydrate(data);
  }, [data, hydrate]);

  /** Id lookup so columns can render from the store's ordering. */
  const byId = useMemo(
    () => new Map((data ?? []).map((t) => [t.id, t])),
    [data],
  );

  return { ...query, byId };
}

/** Optimistic board move: reorder locally, then persist the new status. */
export function useMoveTicket() {
  const moveTicket = useTicketsStore((s) => s.moveTicket);

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      updateTicketStatus(id, status),
    onError: (error: Error) => toast.error(error.message),
  });

  return (ticket: Pick<Ticket, "id">, to: TicketStatus, index = -1) => {
    moveTicket(ticket.id, to, index);
    mutation.mutate({ id: ticket.id, status: to });
  };
}
