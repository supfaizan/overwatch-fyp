import { api, API_BASE_URL } from "@/lib/axios";
import type { AuthResponse, User } from "@/types";

export type AuthIntent = "login" | "register";

interface BackendUser {
  id: string;
  github_login: string;
  name: string | null;
  avatar_url: string | null;
}

const AUTH_INTENT_KEY = "ow_auth_intent";

function toUser(user: BackendUser): User {
  return {
    id: user.id,
    name: user.name ?? user.github_login,
    githubHandle: user.github_login,
    avatarUrl: user.avatar_url ?? undefined,
  };
}

export function startGithubAuth(intent: AuthIntent): void {
  sessionStorage.setItem(AUTH_INTENT_KEY, intent);
  window.location.assign(new URL("/auth/github/login", API_BASE_URL).toString());
}

export function consumeAuthIntent(): AuthIntent {
  const intent = sessionStorage.getItem(AUTH_INTENT_KEY);
  sessionStorage.removeItem(AUTH_INTENT_KEY);
  return intent === "register" ? "register" : "login";
}

export async function getCurrentUser(accessToken?: string): Promise<User> {
  const { data } = await api.get<BackendUser>("/me", {
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : undefined,
  });
  return toUser(data);
}

export async function completeGithubAuth(
  accessToken: string,
): Promise<AuthResponse> {
  const user = await getCurrentUser(accessToken);
  return { token: accessToken, user };
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function logoutEverywhere(): Promise<void> {
  await api.post("/auth/logout-all");
}

/* Error codes the backend's OAuth callback sends back to /login?error=. */
const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  oauth_cancelled: "GitHub sign-in was cancelled.",
  oauth_state_mismatch: "Your sign-in link expired. Please try again.",
  github_unavailable: "GitHub is not responding right now. Please try again shortly.",
};

const FALLBACK_LOGIN_ERROR = "Sign-in failed. Please try again.";

export function describeLoginError(code: string | undefined): string | null {
  if (!code) return null;
  return LOGIN_ERROR_MESSAGES[code] ?? FALLBACK_LOGIN_ERROR;
}
