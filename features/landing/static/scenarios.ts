/* Illustrative content for each chapter's scene. It is sample data about the
   sample system in ./system.ts, not output from a real repository. */

import type { NodeId } from "../types";

export const STALE_DIAGRAM = {
  file: "architecture-final-v3.png",
  age: "edited 14 months ago",
} as const;

export const PARSED_FILE = {
  path: "billing/invoice.ts",
  imports: [
    { statement: 'import { db } from "@/db"', resolvesTo: "db" },
    { statement: 'import Stripe from "stripe"', resolvesTo: "packages" },
  ],
} as const satisfies {
  path: string;
  imports: readonly { statement: string; resolvesTo: NodeId }[];
};

export const QUESTION = {
  ask: "What depends on auth?",
  answer: "api calls it directly. web reaches it through api.",
  nodeIds: ["web", "api", "auth"],
} as const satisfies { ask: string; answer: string; nodeIds: readonly NodeId[] };

export const LOGIN_FLOW = {
  name: "login flow",
  steps: [
    { nodeId: "web", call: "LoginForm.submit()", payload: "{ email, password }" },
    { nodeId: "api", call: "POST /auth/login", payload: "{ email, password }" },
    { nodeId: "auth", call: "verifyCredentials()", payload: "{ email, hash }" },
    { nodeId: "db", call: "users.findByEmail()", payload: "{ email }" },
  ],
} as const satisfies {
  name: string;
  steps: readonly { nodeId: NodeId; call: string; payload: string }[];
};

export const TICKETS = [
  { key: "OW-231", title: "Login times out on slow networks", nodeId: "auth" },
  { key: "OW-198", title: "Invoice total off by one cent", nodeId: "billing" },
] as const satisfies readonly { key: string; title: string; nodeId: NodeId }[];

export const CONTRACT_BREAK = {
  source: "api",
  target: "billing",
  field: "amount",
  sent: "cents",
  expected: "dollars",
} as const satisfies {
  source: NodeId;
  target: NodeId;
  field: string;
  sent: string;
  expected: string;
};

export const PUSH = {
  sha: "3f9a1c2",
  branch: "main",
  file: "billing/invoice.ts",
  nodeId: "billing",
} as const satisfies { sha: string; branch: string; file: string; nodeId: NodeId };

/** How long the flow walkthrough rests on each step. */
export const FLOW_STEP_MS = 1_400;
