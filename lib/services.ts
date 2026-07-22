/* Centralized API path prefixes. Feature api functions build URLs from these
   instead of scattering literal path strings across the codebase.
   Mirrors the FastAPI routers in the backend's `app/api/routes/`. */

export const SERVICES = {
  AUTH: "/auth",
  GITHUB: "/github",
  JIRA: "/jira",
  ONBOARDING: "/onboarding",
  GRAPH: "/graph",
  TICKETS: "/tickets",
  QUERY: "/query",
} as const;

export type Service = (typeof SERVICES)[keyof typeof SERVICES];
