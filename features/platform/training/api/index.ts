import { api } from "@/lib/axios";
import { SERVICES } from "@/lib/services";
import { USE_MOCK } from "@/constants";
import { delay } from "@/lib/mock";
import { TRAINING_STAGES } from "../static";
import type { TrainingStatus } from "../types";

const TOTAL_MS = 9000; // mock training duration
let startedAt: number | null = null;

/** Reset the mock clock so each visit to /training re-runs the pipeline. */
export function resetTrainingMock() {
  startedAt = null;
}

export async function getTrainingStatus(
  repoId: string,
): Promise<TrainingStatus> {
  if (USE_MOCK) {
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
  const { data } = await api.get<TrainingStatus>(
    `${SERVICES.TGNN}/model/${repoId}`,
  );
  return data;
}
