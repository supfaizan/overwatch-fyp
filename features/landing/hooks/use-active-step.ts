"use client";

import { useEffect, useState, type RefObject } from "react";
import {
  READING_BAND,
  STORY_SELECTORS,
  readStepIndex,
} from "../lib/story-dom";

/**
 * Index of the story step currently crossing the reading line. While the line
 * sits between steps, or past the last one, the previous step stays active.
 */
export function useActiveStep(
  containerRef: RefObject<HTMLElement | null>,
): number {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveStep(readStepIndex(entry.target));
        }
      },
      { rootMargin: READING_BAND },
    );

    container
      .querySelectorAll(STORY_SELECTORS.step)
      .forEach((step) => observer.observe(step));

    return () => observer.disconnect();
  }, [containerRef]);

  return activeStep;
}
