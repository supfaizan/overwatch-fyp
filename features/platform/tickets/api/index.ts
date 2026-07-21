import { api } from "@/lib/axios";
import { SERVICES } from "@/lib/services";
import { USE_MOCK } from "@/constants";
import { delay } from "@/lib/mock";
import { TICKETS } from "../static";
import type { Ticket, TicketStatus } from "../types";

export async function getTickets(repoId: string): Promise<Ticket[]> {
  if (USE_MOCK) {
    await delay(450);
    return TICKETS;
  }
  const { data } = await api.get<Ticket[]>(`${SERVICES.TICKETS}/${repoId}`);
  return data;
}

/** Persist a board drag. The optimistic move already happened in the store. */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
): Promise<void> {
  if (USE_MOCK) {
    await delay(200);
    return;
  }
  await api.patch(`${SERVICES.TICKETS}/${ticketId}`, { status });
}
