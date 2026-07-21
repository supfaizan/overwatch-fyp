import type { ContractWarning, GraphData } from "../types";

/** Deterministic architecture graph (mock). Layered FE → BE → Infra, with
 *  solid (high-confidence) and dashed (probabilistic co-change) edges. */
export const GRAPH: GraphData = {
  nodes: [
    // Frontend
    { id: "webapp", type: "service", position: { x: 60, y: 20 }, data: { label: "WebApp", layer: "frontend", language: "TypeScript", risk: 0.12, tickets: 1 } },
    { id: "dashboard", type: "service", position: { x: 340, y: 20 }, data: { label: "Dashboard", layer: "frontend", language: "TypeScript", risk: 0.18 } },

    // Backend
    { id: "payment", type: "service", position: { x: 20, y: 200 }, data: { label: "PaymentService", layer: "backend", language: "TypeScript", risk: 0.9, tickets: 3 } },
    { id: "auth", type: "service", position: { x: 250, y: 200 }, data: { label: "AuthService", layer: "backend", language: "TypeScript", risk: 0.42 } },
    { id: "stripe", type: "service", position: { x: 470, y: 200 }, data: { label: "StripeAdapter", layer: "backend", language: "TypeScript", risk: 0.86, tickets: 2 } },
    { id: "notify", type: "service", position: { x: 690, y: 200 }, data: { label: "NotificationService", layer: "backend", language: "Go", risk: 0.24 } },

    // Infra
    { id: "neo4j", type: "service", position: { x: 150, y: 400 }, data: { label: "Neo4j", layer: "infra", language: "Database", risk: 0.08 } },
    { id: "postgres", type: "service", position: { x: 390, y: 400 }, data: { label: "Postgres", layer: "infra", language: "Database", risk: 0.3 } },
    { id: "redis", type: "service", position: { x: 630, y: 400 }, data: { label: "Redis", layer: "infra", language: "Cache", risk: 0.15 } },
  ],
  edges: [
    { id: "e1", source: "webapp", target: "payment", data: { confidence: "high" } },
    { id: "e2", source: "webapp", target: "auth", data: { confidence: "high" } },
    { id: "e3", source: "dashboard", target: "payment", data: { confidence: "high" } },
    { id: "e4", source: "dashboard", target: "notify", data: { confidence: "high" } },
    { id: "e5", source: "payment", target: "stripe", data: { confidence: "high" } },
    { id: "e6", source: "payment", target: "postgres", data: { confidence: "high" } },
    { id: "e7", source: "auth", target: "postgres", data: { confidence: "high" } },
    { id: "e8", source: "stripe", target: "redis", data: { confidence: "high" } },
    { id: "e9", source: "notify", target: "redis", data: { confidence: "high" } },
    // probabilistic co-change edges (T-GNN)
    { id: "c1", source: "payment", target: "auth", data: { confidence: "probabilistic", note: "CO_CHANGES 47/52" } },
    { id: "c2", source: "stripe", target: "notify", data: { confidence: "probabilistic", note: "CO_CHANGES 31/52" } },
  ],
};

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

/** Canned grounded answers for the chat panel (mock). */
export const QUERY_RESPONSES: {
  match: RegExp;
  answer: string;
  highlight: string[];
}[] = [
  {
    match: /payment|stripe|charge/i,
    answer:
      "PaymentService is called by WebApp and Dashboard, and connects to StripeAdapter (HTTP) and Postgres. The T-GNN also flags a probabilistic co-change link to AuthService (47/52 commits). There is 1 critical contract warning on the PaymentService → StripeAdapter edge.",
    highlight: ["payment", "stripe", "postgres", "auth"],
  },
  {
    match: /auth|login|session|token/i,
    answer:
      "AuthService depends on Postgres and is consumed by WebApp. A payload-shape warning exists on the session token contract (expiresIn units). Co-change history couples it to PaymentService.",
    highlight: ["auth", "postgres", "webapp"],
  },
  {
    match: /notif|email|redis|queue/i,
    answer:
      "NotificationService (Go) is invoked by Dashboard and uses Redis as a queue. It shares a probabilistic co-change link with StripeAdapter.",
    highlight: ["notify", "redis", "stripe"],
  },
  {
    match: /infra|database|neo4j|postgres|storage/i,
    answer:
      "Infrastructure layer: Neo4j stores the architecture graph, Postgres backs PaymentService and AuthService, and Redis serves StripeAdapter and NotificationService.",
    highlight: ["neo4j", "postgres", "redis"],
  },
];
