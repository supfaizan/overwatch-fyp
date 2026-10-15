import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// teach twMerge our custom shadow tokens, otherwise it treats `shadow-chrome` as a color and drops it
const twMerge = extendTailwindMerge({
  extend: { theme: { shadow: ['chrome', 'chrome-hover', 'chrome-press'] } },
});

// merge class lists; later Tailwind classes win over conflicting earlier ones
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};
