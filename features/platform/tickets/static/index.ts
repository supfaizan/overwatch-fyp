import type { Priority } from "@/types";
import type { BoardColumn, Ticket, TicketCategory } from "../types";

/** Default section order. The store clones this so drags never mutate it. */
export const COLUMNS: BoardColumn[] = [
  { id: "backlog", label: "BACKLOG" },
  { id: "in_progress", label: "IN PROGRESS" },
  { id: "in_review", label: "IN REVIEW" },
  { id: "done", label: "DONE" },
];

export const CATEGORY_META: Record<TicketCategory, { label: string; cls: string }> =
  {
    bug: {
      label: "BUG",
      cls: "border-critical-border bg-critical-soft text-critical",
    },
    incident: {
      label: "INCIDENT",
      cls: "border-critical-border bg-critical-soft text-critical",
    },
    feature: {
      label: "FEATURE",
      cls: "border-signal-border bg-signal-soft text-signal",
    },
    chore: { label: "CHORE", cls: "border-line-2 bg-surface-2 text-text-lo" },
  };

/** Priority reads as a single dot on a card (the dashboard's warning panel
 *  renders the same scale as an icon + panel tint). */
export const PRIORITY_DOT: Record<Priority, string> = {
  critical: "bg-critical",
  warning: "bg-warn",
  informational: "bg-idle",
};

/** Mock ticket set (mirrors the graph node ids in the dashboard feature so the
 *  AFFECTS edges line up with real services). */
export const TICKETS: Ticket[] = [
  {
    id: "t1",
    externalId: "PAY-1420",
    title: "Duplicate charge when Stripe retries after timeout",
    provider: "jira",
    status: "in_progress",
    category: "incident",
    priority: "critical",
    assignee: "AR",
    updatedAt: "2h ago",
    impact: [
      { nodeId: "payment", label: "PaymentService", confidence: 0.94 },
      { nodeId: "stripe", label: "StripeAdapter", confidence: 0.91 },
    ],
  },
  {
    id: "t2",
    externalId: "PAY-1417",
    title: "Align retry budget between controller and adapter",
    provider: "jira",
    status: "in_review",
    category: "bug",
    priority: "critical",
    assignee: "MK",
    updatedAt: "5h ago",
    impact: [{ nodeId: "stripe", label: "StripeAdapter", confidence: 0.88 }],
  },
  {
    id: "t3",
    externalId: "AUTH-302",
    title: "Refresh tokens rotate on every request",
    provider: "jira",
    status: "in_progress",
    category: "bug",
    priority: "warning",
    assignee: "SB",
    updatedAt: "1d ago",
    impact: [
      { nodeId: "auth", label: "AuthService", confidence: 0.9 },
      { nodeId: "postgres", label: "Postgres", confidence: 0.61 },
    ],
  },
  {
    id: "t4",
    externalId: "CU-88",
    title: "Add webhook replay for missed push events",
    provider: "clickup",
    status: "backlog",
    category: "feature",
    priority: "warning",
    assignee: "FJ",
    updatedAt: "2d ago",
    impact: [{ nodeId: "notify", label: "NotificationService", confidence: 0.72 }],
  },
  {
    id: "t5",
    externalId: "CU-91",
    title: "Cache graph queries in Redis for large repos",
    provider: "clickup",
    status: "backlog",
    category: "feature",
    priority: "informational",
    assignee: "AR",
    updatedAt: "2d ago",
    impact: [
      { nodeId: "redis", label: "Redis", confidence: 0.83 },
      { nodeId: "neo4j", label: "Neo4j", confidence: 0.67 },
    ],
  },
  {
    id: "t6",
    externalId: "WEB-210",
    title: "Diagram flickers on incremental update",
    provider: "jira",
    status: "in_review",
    category: "bug",
    priority: "warning",
    assignee: "MK",
    updatedAt: "3d ago",
    impact: [{ nodeId: "webapp", label: "WebApp", confidence: 0.79 }],
  },
  {
    id: "t7",
    externalId: "WEB-204",
    title: "Ticket badges on service nodes",
    provider: "jira",
    status: "done",
    category: "feature",
    priority: "informational",
    assignee: "SB",
    updatedAt: "4d ago",
    impact: [{ nodeId: "dashboard", label: "Dashboard", confidence: 0.86 }],
  },
  {
    id: "t8",
    externalId: "CU-76",
    title: "Drop unused co-change indexes",
    provider: "clickup",
    status: "done",
    category: "chore",
    priority: "informational",
    assignee: "FJ",
    updatedAt: "5d ago",
    impact: [{ nodeId: "neo4j", label: "Neo4j", confidence: 0.58 }],
  },
  {
    id: "t9",
    externalId: "PAY-1401",
    title: "Backfill payment audit log",
    provider: "jira",
    status: "backlog",
    category: "chore",
    priority: "informational",
    assignee: "AR",
    updatedAt: "6d ago",
    impact: [
      { nodeId: "payment", label: "PaymentService", confidence: 0.75 },
      { nodeId: "postgres", label: "Postgres", confidence: 0.7 },
    ],
  },
];
