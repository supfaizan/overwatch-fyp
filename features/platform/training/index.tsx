"use client";

import { useRepoStore } from "@/stores/repo-store";
import { Progress } from "@/components/ui/progress";
import { OnboardSteps } from "@/features/platform/components/OnboardSteps";
import { useTraining } from "./hooks";
import { StageList } from "./components/StageList";
import { TRAINING_STAGES } from "./static";

export function Training() {
  const activeRepo = useRepoStore((s) => s.activeRepo);
  const { data } = useTraining();

  const progress = data?.progress ?? 0;
  const stageIndex = data?.stageIndex ?? 0;
  const done = data?.done ?? false;
  const currentLabel = done
    ? "Operational view ready"
    : TRAINING_STAGES[stageIndex]?.label ?? "Starting";

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-2xl flex-col justify-center px-6 py-6">
      <OnboardSteps current={done ? 3 : 2} />

      <div className="mt-10 overflow-hidden rounded-lg border border-line-1 bg-surface-1 shadow-[var(--ow-shadow-card)]">
        <div className="flex items-center justify-between border-b border-line-1 bg-ink-900 px-5 py-3">
          <span className="ow-mono-micro text-text-mid">
            TRAINING // T-GNN + EMBEDDINGS
          </span>
          <span className="ow-mono-micro text-text-dim">
            {activeRepo?.fullName ?? "repository"}
          </span>
        </div>

        <div className="flex flex-col items-center gap-5 px-6 py-8">
          {/* radar */}
          <div className="relative grid size-32 place-items-center">
            <div className="absolute inset-0 rounded-full border border-line-2" />
            <div className="absolute inset-4 rounded-full border border-line-1" />
            <div className="absolute inset-8 rounded-full border border-line-1" />
            {!done && (
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0deg, var(--ow-signal-soft) 40deg, transparent 60deg)",
                  animation: "ow-sweep 2.2s linear infinite",
                }}
                aria-hidden
              />
            )}
            <div className="relative text-center">
              <div className="ow-mono-data !text-[26px] text-signal">
                {progress}%
              </div>
              <div className="ow-mono-micro text-text-dim">
                {done ? "READY" : "TRAINING"}
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="flex items-center justify-between">
              <p className="ow-mono-data text-text-hi">{currentLabel}</p>
              <p className="ow-mono-micro text-text-dim">
                {stageIndex + (done ? 0 : 1)}/{TRAINING_STAGES.length}
              </p>
            </div>
            <Progress value={progress} className="mt-2 h-1.5 bg-surface-3" />
          </div>
        </div>

        <div className="border-t border-line-1 bg-ink-850 p-4">
          <StageList stageIndex={stageIndex} done={done} />
        </div>
      </div>

      <p className="mt-6 text-center ow-mono-micro text-text-dim">
        DETERMINISTIC STRUCTURE FIRST · THEN THE INTELLIGENCE LAYERS ATTACH
      </p>
    </div>
  );
}
