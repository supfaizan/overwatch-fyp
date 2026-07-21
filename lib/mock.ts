/* Generic mock helpers used by feature api/ layers while USE_MOCK is true.
   Feature-specific mock datasets live in each feature's static/ folder. */

import type { User } from "@/types";

export const delay = (ms = 700) => new Promise((r) => setTimeout(r, ms));

function base64url(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Hand-craft a JWT-shaped token (decodable by jose's decodeJwt in the proxy).
 *  Not cryptographically signed — purely to drive the mock auth flow. */
export function makeMockToken(user: Pick<User, "id" | "email" | "name">): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      iat: now,
      exp: now + 60 * 60 * 24 * 7, // 7 days
    }),
  );
  return `${header}.${payload}.mock-signature`;
}
