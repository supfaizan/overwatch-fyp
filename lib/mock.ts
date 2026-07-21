/* Generic mock helper used by feature API layers while USE_MOCK is true. */

export const delay = (ms = 700) =>
  new Promise((resolve) => setTimeout(resolve, ms));
