import { api } from "@/lib/axios";
import { SERVICES } from "@/lib/services";
import { WARNINGS } from "../static";
import type {
  AnswerMode,
  AnswerStatus,
  ChatTurn,
  ContractWarning,
  FlowResult,
  FlowVia,
  QueryResult,
} from "../types";

interface AskResponse {
  answer: string;
  references: {
    number: number;
    node_id: string;
    name: string;
    label: string | null;
    kind: string | null;
    path: string | null;
    containers: string[];
  }[];
  status: AnswerStatus;
  notice: string | null;
  mode: AnswerMode;
  lookups: string[];
}

interface FlowResponse {
  steps: {
    node_id: string;
    name: string;
    label: string | null;
    kind: string | null;
    path: string | null;
    via: FlowVia | null;
    containers: string[];
    parent: number | null;
    depth: number;
    unresolved: string[];
  }[];
  confidence: FlowResult["confidence"];
  target_reached: boolean | null;
  mode: FlowResult["mode"];
}

/** Out of eval-1 scope (contract checker) — the panel is unrouted but kept in
 *  the tree, so this returns the static fixture rather than calling an endpoint
 *  the backend does not implement. */
export async function getWarnings(): Promise<ContractWarning[]> {
  return WARNINGS;
}

export async function sendQuery(input: {
  repoFullName: string;
  question: string;
  focusedNodeId?: string | null;
  history?: ChatTurn[];
  mode?: AnswerMode;
}): Promise<QueryResult> {
  const { data } = await api.post<AskResponse>(`${SERVICES.QUERY}/ask`, {
    repo_full_name: input.repoFullName,
    question: input.question,
    focused_node_id: input.focusedNodeId ?? null,
    history: input.history ?? [],
    mode: input.mode ?? "quick",
  });
  return {
    answer: data.answer,
    references: (data.references ?? []).map((reference) => ({
      number: reference.number,
      nodeId: reference.node_id,
      name: reference.name,
      label: reference.label,
      kind: reference.kind,
      path: reference.path,
      containers: reference.containers,
    })),
    status: data.status,
    notice: data.notice,
    mode: data.mode,
    lookups: data.lookups ?? [],
  };
}

export async function requestFlow(input: {
  repoFullName: string;
  question: string;
  /** A selected node is where the walkthrough starts. */
  focusedNodeId?: string | null;
}): Promise<FlowResult> {
  const { data } = await api.post<FlowResponse>(`${SERVICES.QUERY}/flow`, {
    repo_full_name: input.repoFullName,
    question: input.question,
    focused_node_id: input.focusedNodeId ?? null,
  });
  return {
    steps: data.steps.map((step) => ({
      nodeId: step.node_id,
      name: step.name,
      label: step.label,
      kind: step.kind,
      path: step.path,
      via: step.via,
      containers: step.containers,
      parent: step.parent,
      depth: step.depth,
      unresolved: step.unresolved ?? [],
    })),
    confidence: data.confidence,
    targetReached: data.target_reached,
    mode: data.mode,
  };
}
