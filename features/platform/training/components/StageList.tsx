"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRAINING_STAGES } from "../static";

export function StageList({
  stageIndex,
  done,
}: {
  stageIndex: number;
  done: boolean;
}) {
  return (
    <ul className="space-y-1">
      {TRAINING_STAGES.map((stage, i) => {
        const isDone = done || i < stageIndex;
        const isActive = !done && i === stageIndex;
        return (
          <li
            key={stage.id}
            className={cn(
              "flex items-center gap-3 rounded-sm px-3 py-2 transition-colors",
              isActive && "bg-signal-soft",
            )}
          >
            <span className="flex size-5 items-center justify-center">
              {isDone ? (
                <Check className="size-4 text-signal" />
              ) : isActive ? (
                <Loader2 className="size-4 animate-spin text-signal" />
              ) : (
                <span className="size-1.5 rounded-full bg-text-dim" />
              )}
            </span>
            <span className="flex-1">
              <span
                className={cn(
                  "block ow-mono-data",
                  isDone || isActive ? "text-text-hi" : "text-text-lo",
                )}
              >
                {stage.label}
              </span>
              <span className="ow-micro text-text-dim">{stage.detail}</span>
            </span>
            <span
              className={cn(
                "ow-micro",
                isDone ? "text-success" : isActive ? "text-warn" : "text-text-dim",
              )}
            >
              {isDone ? "DONE" : isActive ? "RUNNING" : "QUEUED"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
