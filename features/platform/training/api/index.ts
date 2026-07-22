/* OUT OF EVAL-1 SCOPE — T-GNN and BERT embeddings are listed under
   "Explicitly out of scope" in the eval-1 plan, which also says not to stub
   them with fake data. The /training route is therefore unrouted; this module
   is kept only so the feature still compiles for a later eval.

   There is no backend endpoint behind this: the progress is a local timer. */

import { delay } from "@/lib/mock";
import { TRAINING_STAGES } from "../static";
import type { TrainingStatus } from "../types";

const TOTAL_MS = 9000; // simulated pipeline duration
let startedAt: number | null = null;

/** Reset the clock so each visit re-runs the simulated pipeline. */
export function resetTrainingMock() {
  startedAt = null;
}

export async function getTrainingStatus(): Promise<TrainingStatus> {
  if (startedAt === null) startedAt = Date.now();
  await delay(150);
  const elapsed = Date.now() - startedAt;
  const progress = Math.min(100, Math.round((elapsed / TOTAL_MS) * 100));
  const stageIndex = Math.min(
    TRAINING_STAGES.length - 1,
    Math.floor((progress / 100) * TRAINING_STAGES.length),
  );
  return { progress, stageIndex, done: progress >= 100 };
}
