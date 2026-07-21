import { decodeJwt } from "jose";

export function getTokenExpiration(token: string): number | null {
  try {
    const { exp } = decodeJwt(token);
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isValidAccessToken(token: string): boolean {
  const expiresAt = getTokenExpiration(token);
  return expiresAt !== null && expiresAt > Date.now();
}
