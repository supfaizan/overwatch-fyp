/** Whether the viewer asked for less motion: animations then jump straight to where they end. */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
