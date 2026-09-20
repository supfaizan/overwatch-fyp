"use client";

import { useEffect, useState } from "react";

/** Extra ticks spent resting on the last step before the sequence loops. */
const HOLD_TICKS = 2;

interface AutoStepOptions {
  enabled: boolean;
  intervalMs: number;
}

/**
 * Steps through 0…count-1 on a timer, rests on the last step, then loops.
 * Starts again from 0 every time it is re-enabled.
 */
export function useAutoStep(
  count: number,
  { enabled, intervalMs }: AutoStepOptions,
): number {
  const [tick, setTick] = useState(0);
  const [wasEnabled, setWasEnabled] = useState(enabled);

  // Reset while rendering rather than in an effect, so a restarted sequence
  // never flashes the step it stopped on.
  if (enabled !== wasEnabled) {
    setWasEnabled(enabled);
    setTick(0);
  }

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(
      () => setTick((t) => (t + 1) % (count + HOLD_TICKS)),
      intervalMs,
    );
    return () => window.clearInterval(timer);
  }, [enabled, count, intervalMs]);

  return Math.min(tick, count - 1);
}
