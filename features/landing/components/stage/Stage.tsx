"use client";

import { useAutoStep, usePrefersReducedMotion } from "../../hooks";
import { buildScene } from "../../lib/scene";
import { FLOW_STEP_MS, LOGIN_FLOW } from "../../static/scenarios";
import type { SceneMode } from "../../types";
import { SceneCard } from "./SceneCard";
import { SystemGraph } from "./SystemGraph";

const FLOW_LENGTH = LOGIN_FLOW.steps.length;

interface StageProps {
  mode: SceneMode;
  /** Whether time-based animation (the flow walkthrough) may run. */
  playing?: boolean;
}

/** The illustration for a scene: the sample graph plus a caption card.
 *  Decorative only; the story text beside it carries the meaning. */
export function Stage({ mode, playing = true }: StageProps) {
  const reducedMotion = usePrefersReducedMotion();
  const autoStep = useAutoStep(FLOW_LENGTH, {
    enabled: playing && mode === "flow" && !reducedMotion,
    intervalMs: FLOW_STEP_MS,
  });
  // Without motion, show the whole flow at once instead of playing it.
  const flowStep = reducedMotion ? FLOW_LENGTH - 1 : autoStep;
  const scene = buildScene(mode, flowStep);

  return (
    <div aria-hidden className="w-full select-none">
      <SystemGraph scene={scene} />
      <div className="mx-auto mt-6 h-28 w-full max-w-md sm:mt-8">
        <div
          key={mode}
          className="animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none"
        >
          <SceneCard mode={mode} flowStep={flowStep} />
        </div>
      </div>
    </div>
  );
}
