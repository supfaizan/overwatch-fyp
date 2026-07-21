import type { Priority } from "@/types";
import type { BoardColumn } from "../types";

export const COLUMNS: BoardColumn[] = [
  { id: "backlog", label: "BACKLOG" },
  { id: "in_progress", label: "IN PROGRESS" },
  { id: "in_review", label: "IN REVIEW" },
  { id: "done", label: "DONE" },
];

export const PRIORITY_DOT: Record<Priority, string> = {
  critical: "bg-critical",
  warning: "bg-warn",
  informational: "bg-idle",
};
