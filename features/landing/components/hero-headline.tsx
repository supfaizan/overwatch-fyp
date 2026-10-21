import type { CSSProperties } from 'react';
import { SCATTERED_LETTERS } from '../constants';

// seconds before the first letter leaves its place, and between letters
const SCATTER_DELAY = 0.3;
const SCATTER_STAGGER = 0.05;

/** "scattered", knocked out of line as the page loads; hovering puts every letter back. */
function Scattered() {
  return (
    <span className="group inline-flex gap-[0.04em]">
      <span className="sr-only">scattered</span>
      {SCATTERED_LETTERS.map(({ char, y, rotate }, i) => {
        return (
          <span
            // the letters repeat, so their place in the word is their identity
            key={i}
            aria-hidden
            className="inline-block translate-y-(--y) rotate-(--rotate) transition-[translate,rotate] duration-300 ease-out group-hover:translate-y-0 group-hover:rotate-0 motion-safe:animate-scatter-in"
            style={{
              '--y': `${y}em`,
              '--rotate': `${rotate}deg`,
              animationDelay: `${SCATTER_DELAY + i * SCATTER_STAGGER}s`,
            } as CSSProperties}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
}

export default function HeroHeadline() {
  return (
    <h1 className="text-center text-4xl font-semibold tracking-tight text-balance md:text-5xl lg:text-6xl">
      Tired of <Scattered /> decisions?
      <br />
      No way, us too!
    </h1>
  );
}
