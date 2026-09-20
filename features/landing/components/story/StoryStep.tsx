"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLatch } from "../../hooks";
import { storyStepAttrs } from "../../lib/story-dom";
import type { SceneMode } from "../../types";
import { Stage } from "../stage/Stage";

interface StoryStepProps {
  index: number;
  active: boolean;
  mode: SceneMode;
  /** Scene the small-screen stage shows until the step is first reached, so
   *  it can animate into its own scene just as the large-screen stage does. */
  entryMode: SceneMode;
  className?: string;
  children: ReactNode;
}

/** One beat of the story. On large screens the shared sticky stage shows its
 *  scene; on small screens the step carries its own stage below the text. */
export function StoryStep({
  index,
  active,
  mode,
  entryMode,
  className,
  children,
}: StoryStepProps) {
  const reached = useLatch(active);

  return (
    <section
      {...storyStepAttrs(index)}
      className={cn(
        "relative flex flex-col justify-center py-20 lg:min-h-[85svh]",
        className,
      )}
    >
      {children}
      <div className="mt-14 lg:hidden">
        <Stage mode={reached ? mode : entryMode} playing={active} />
      </div>
    </section>
  );
}
