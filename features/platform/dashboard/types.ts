import type { Priority } from "@/types";

/* The canvas types live in ./graph/types — the diagram is a level-of-detail
   view of the graph, not a fixed module picture. */

/** Out of eval-1 scope (contract checker). The panel is unrouted but kept in
 *  the tree, so the type stays. See the eval-1 plan, "Explicitly out of scope". */
export interface ContractWarning {
  id: string;
  priority: Priority;
  title: string;
  source: string;
  target: string;
  risk: string;
  suggestion: string;
  tgnnConfidence: number;
  nodeIds: string[];
  createdAt: string;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  highlight?: string[]; // module ids to spotlight on the diagram
  /** Exact files and definitions the answer drew on, for drill-down. */
  references?: string[];
}

export interface QueryResult {
  answer: string;
  /** Module ids: what the diagram can highlight. */
  highlight: string[];
  /** File and definition ids: what the explorer can open. */
  references: string[];
}
