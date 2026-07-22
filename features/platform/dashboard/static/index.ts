/* Fixture data for dashboard surfaces that are out of eval-1 scope.

   The contract checker is listed under "Explicitly out of scope" in the
   eval-1 plan, so WarningsPanel is unrouted — but the component is kept in
   the tree for a later eval, and it needs this fixture to compile.

   The architecture graph and chat answers are NOT here any more: both come
   from the real backend (GET /graph, POST /query/ask). */

import type { ContractWarning } from "../types";

export const WARNINGS: ContractWarning[] = [
  {
    id: "w1",
    priority: "critical",
    title: "Contract mismatch — request timeout",
    source: "PaymentController.ts",
    target: "StripeAdapter.ts:47",
    risk: "StripeAdapter may retry after PaymentController has already timed out — potential duplicate charge attempts.",
    suggestion: "Review StripeAdapter retry logic",
    tgnnConfidence: 90,
    nodeIds: ["payment", "stripe"],
    createdAt: "2m ago",
  },
  {
    id: "w2",
    priority: "warning",
    title: "Payload shape drift",
    source: "AuthService.ts",
    target: "WebApp/session.ts",
    risk: "`token.expiresIn` changed from seconds to ms — client refresh logic assumes seconds.",
    suggestion: "Align expiry units across the session contract",
    tgnnConfidence: 71,
    nodeIds: ["auth", "webapp"],
    createdAt: "14m ago",
  },
  {
    id: "w3",
    priority: "informational",
    title: "Shared config divergence",
    source: "NotificationService",
    target: "Redis connection pool",
    risk: "Pool size differs from the value used by StripeAdapter (10 vs 25).",
    suggestion: "Confirm intended pool sizing",
    tgnnConfidence: 58,
    nodeIds: ["notify", "redis"],
    createdAt: "1h ago",
  },
];
