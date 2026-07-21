"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTickets } from "../api";
import { ticketKeys } from "../api/query-keys";
import { useTicketsStore } from "../stores/tickets-store";

export function useTickets(enabled: boolean) {
  const hydrate = useTicketsStore((state) => state.hydrate);
  const query = useQuery({
    queryKey: ticketKeys.list(),
    queryFn: getTickets,
    enabled,
  });

  const { data } = query;
  useEffect(() => {
    if (data) hydrate(data);
  }, [data, hydrate]);

  const byId = useMemo(
    () => new Map((data ?? []).map((ticket) => [ticket.id, ticket])),
    [data],
  );

  return { ...query, byId };
}
