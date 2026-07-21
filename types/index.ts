/* Cross-cutting types shared across features. Domain-specific types live in
   features/<area>/types.ts. */

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  githubHandle: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type Layer = "frontend" | "backend" | "infra";

export type Confidence = "high" | "probabilistic";

export type Priority = "critical" | "warning" | "informational";

export type Nullable<T> = T | null;
