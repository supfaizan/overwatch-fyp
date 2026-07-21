import type { TrainingStage } from "../types";

export const TRAINING_STAGES: TrainingStage[] = [
  { id: "clone", label: "Cloning repository", detail: "git fetch · full history" },
  { id: "parse", label: "Tree-sitter AST parse", detail: "TypeScript · Python · Go" },
  { id: "resolve", label: "Resolving dependency graph", detail: "imports · calls · HTTP edges" },
  { id: "neo4j", label: "Writing to Neo4j", detail: "nodes · typed relationships" },
  { id: "tgnn-pretrain", label: "Pre-training T-GNN", detail: "cold start on OSS corpus" },
  { id: "tgnn-finetune", label: "Fine-tuning on commit history", detail: "co-change LSTM weighting" },
  { id: "bert", label: "Embedding tickets (BERT)", detail: "Sentence-BERT · semantic map" },
  { id: "finalize", label: "Finalizing operational view", detail: "grounding LLM layers" },
];
