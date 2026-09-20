"use client";

import { useState } from "react";

/** True from the first render where `value` is true, and stays true. */
export function useLatch(value: boolean): boolean {
  const [latched, setLatched] = useState(value);
  if (value && !latched) setLatched(true);
  return latched || value;
}
