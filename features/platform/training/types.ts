export interface TrainingStage {
  id: string;
  label: string;
  detail: string;
}

export interface TrainingStatus {
  progress: number; // 0-100
  stageIndex: number;
  done: boolean;
}
