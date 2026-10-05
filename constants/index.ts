/* App-wide constants. */

export const APP_NAME = "Overwatch";
export const APP_TAGLINE = "Operational Intelligence for Engineering Teams";

/** Access-token cookie used by the optimistic route guard. */
export const COOKIE_TOKEN = "ow_token";

/** localStorage key for the persisted public profile of the signed-in user. */
export const USER_STORAGE_KEY = "ow_user";

/** Route guard allowlist (see proxy.ts). */
export const PUBLIC_ROUTES = ["/", "/login", "/register", "/auth/complete"];

/** Where to send users after auth transitions. */
export const AFTER_LOGIN = "/dashboard";
export const AFTER_REGISTER = "/connect";
export const GUEST_REDIRECT = "/login";
