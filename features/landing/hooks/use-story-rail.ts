"use client";

import { useEffect, type RefObject } from "react";
import { READING_LINE, STORY_SELECTORS } from "../lib/story-dom";

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/**
 * Draws the story rail down to the reading line as the page scrolls.
 *
 * Writes `--rail-progress` (0–1) on the rail line and sets
 * `data-reached="true"` on every rail dot the line has passed. It touches the
 * DOM directly, once per animation frame, so scrolling never re-renders React.
 */
export function useStoryRail(scopeRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const scope = scopeRef.current;
    const line = scope?.querySelector<HTMLElement>(STORY_SELECTORS.railLine);
    if (!scope || !line) return;

    const dots = Array.from(
      scope.querySelectorAll<HTMLElement>(STORY_SELECTORS.railDot),
    );
    let frame = 0;

    const update = () => {
      frame = 0;
      const readingY = window.innerHeight * READING_LINE;
      const { top, height } = line.getBoundingClientRect();
      const progress = height > 0 ? clamp01((readingY - top) / height) : 0;

      line.style.setProperty("--rail-progress", progress.toFixed(4));
      for (const dot of dots) {
        dot.dataset.reached = String(dot.getBoundingClientRect().top <= readingY);
      }
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [scopeRef]);
}
