import type { Priority } from "@/types";

export type TicketProvider = "jira" | "clickup";

/** Board columns are ticket statuses (Jira/ClickUp board semantics). */
export type TicketStatus = "backlog" | "in_progress" | "in_review" | "done";

export type TicketCategory = "bug" | "feature" | "chore" | "incident";

/** One `AFFECTS` edge from the graph — a service this ticket touches, scored
 *  by the Sentence-BERT ticket classifier (guide.md §7). */
export interface TicketImpact {
  nodeId: string;
  label: string;
  confidence: number; // 0-1 BERT similarity
}

export interface Ticket {
  id: string;
  externalId: string; // provider key, e.g. PAY-1420
  title: string;
  provider: TicketProvider;
  status: TicketStatus;
  category: TicketCategory;
  priority: Priority;
  assignee: string;
  updatedAt: string;
  impact: TicketImpact[];
}

/** A draggable board section. */
export interface BoardColumn {
  id: TicketStatus;
  label: string;
}
