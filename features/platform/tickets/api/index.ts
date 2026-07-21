import { api } from "@/lib/axios";
import type { Priority } from "@/types";
import type { Ticket, TicketStatus } from "../types";

interface BackendTicket {
  ticket_key: string;
  project_key: string;
  summary: string | null;
  status: string | null;
  assignee: string | null;
  priority: string | null;
  updated_at: string | null;
}

interface TicketsResponse {
  tickets: BackendTicket[];
  total: number;
  page: number;
  page_size: number;
}

function mapStatus(status: string | null): TicketStatus {
  const value = status?.toLowerCase() ?? "";
  if (/done|closed|resolved|complete/.test(value)) return "done";
  if (/review|testing|quality|\bqa\b/.test(value)) return "in_review";
  if (/progress|doing|development|implement/.test(value)) return "in_progress";
  return "backlog";
}

function mapPriority(priority: string | null): Priority {
  const value = priority?.toLowerCase() ?? "";
  if (/highest|high|critical|blocker/.test(value)) return "critical";
  if (/medium|moderate/.test(value)) return "warning";
  return "informational";
}

function mapTicket(ticket: BackendTicket): Ticket {
  return {
    id: ticket.ticket_key,
    externalId: ticket.ticket_key,
    projectKey: ticket.project_key,
    title: ticket.summary ?? "Untitled Jira issue",
    status: mapStatus(ticket.status),
    priority: mapPriority(ticket.priority),
    assignee: ticket.assignee ?? undefined,
    updatedAt: ticket.updated_at ?? undefined,
  };
}

export async function getTickets(): Promise<Ticket[]> {
  const { data } = await api.get<TicketsResponse>("/tickets", {
    params: { page_size: 100 },
  });
  return data.tickets.map(mapTicket);
}
