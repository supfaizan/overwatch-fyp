/* App-wide constants. */

export const APP_NAME = "Overwatch";
export const APP_TAGLINE = "Operational Intelligence for Engineering Teams";

/** Access-token cookie used by the optimistic route guard. */
export const COOKIE_TOKEN = "ow_token";

/** Route guard allowlist (see proxy.ts). */
export const PUBLIC_ROUTES = ["/", "/login", "/register", "/auth/complete"];

/** Where to send users after auth transitions. */
export const AFTER_LOGIN = "/dashboard";
export const AFTER_REGISTER = "/connect";
export const GUEST_REDIRECT = "/login";
