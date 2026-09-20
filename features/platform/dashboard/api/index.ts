import { api } from "@/lib/axios";
import { SERVICES } from "@/lib/services";
import { WARNINGS } from "../static";
import type { ContractWarning, QueryResult } from "../types";

interface AskResponse {
  answer: string;
  highlighted_node_ids: string[];
  references?: string[];
}

interface FlowResponse {
  step_node_ids: string[];
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
}): Promise<QueryResult> {
  const { data } = await api.post<AskResponse>(`${SERVICES.QUERY}/ask`, {
    repo_full_name: input.repoFullName,
    question: input.question,
    focused_node_id: input.focusedNodeId ?? null,
  });
  return {
    answer: data.answer,
    highlight: data.highlighted_node_ids,
    references: data.references ?? [],
  };
}

export async function requestFlow(input: {
  repoFullName: string;
  question: string;
}): Promise<string[]> {
  const { data } = await api.post<FlowResponse>(`${SERVICES.QUERY}/flow`, {
    repo_full_name: input.repoFullName,
    question: input.question,
  });
  return data.step_node_ids;
}
