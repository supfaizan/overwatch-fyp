import type { Priority } from "@/types";

export type TicketStatus = "backlog" | "in_progress" | "in_review" | "done";

export interface Ticket {
  id: string;
  externalId: string;
  projectKey: string;
  title: string;
  status: TicketStatus;
  priority: Priority;
  assignee?: string;
  updatedAt?: string;
}

export interface BoardColumn {
  id: TicketStatus;
  label: string;
}
