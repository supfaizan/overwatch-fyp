/* App-wide constants. */

export const APP_NAME = "Overwatch";
export const APP_TAGLINE = "Operational Intelligence for Engineering Teams";

/** Flip to false once the NestJS backend is live; the feature `api/` layer
 *  branches on this to return mock data so the app is demoable standalone. */
export const USE_MOCK = true;

/** Auth cookies — read by the `proxy.ts` route guard before any JS runs. */
export const COOKIE_TOKEN = "ow_token";
export const COOKIE_USER = "ow_user";

/** Route guard allowlist (see proxy.ts). */
export const PUBLIC_ROUTES = ["/", "/login", "/register"];

/** Where to send users after auth transitions. */
export const AFTER_LOGIN = "/dashboard";
export const AFTER_REGISTER = "/connect";
export const GUEST_REDIRECT = "/login";
