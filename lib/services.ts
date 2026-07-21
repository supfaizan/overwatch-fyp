/* Centralized API path prefixes. Feature api functions build URLs from these
   instead of scattering literal /api/... strings across the codebase.
   Mirrors the NestJS endpoints documented in guide.md §8. */

export const SERVICES = {
  AUTH: "/auth",
  REPOS: "/api/repos",
  GRAPH: "/api/graph",
  TICKETS: "/api/tickets",
  CONTRACTS: "/api/contracts",
  TGNN: "/api/tgnn",
  WEBHOOKS: "/api/webhooks",
} as const;

export type Service = (typeof SERVICES)[keyof typeof SERVICES];
