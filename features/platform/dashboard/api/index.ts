import { api } from "@/lib/axios";
import { SERVICES } from "@/lib/services";
import { USE_MOCK } from "@/constants";
import { delay } from "@/lib/mock";
import { GRAPH, QUERY_RESPONSES, WARNINGS } from "../static";
import type { ContractWarning, GraphData, QueryResult } from "../types";

export async function getGraph(repoId: string): Promise<GraphData> {
  if (USE_MOCK) {
    await delay(500);
    return GRAPH;
  }
  const { data } = await api.get<GraphData>(`${SERVICES.GRAPH}/${repoId}`);
  return data;
}

export async function getWarnings(repoId: string): Promise<ContractWarning[]> {
  if (USE_MOCK) {
    await delay(450);
    return WARNINGS;
  }
  const { data } = await api.get<ContractWarning[]>(
    `${SERVICES.CONTRACTS}/${repoId}`,
  );
  return data;
}

export async function sendQuery(message: string): Promise<QueryResult> {
  if (USE_MOCK) {
    await delay(750);
    const hit = QUERY_RESPONSES.find((r) => r.match.test(message));
    if (hit) return { answer: hit.answer, highlight: hit.highlight };
    return {
      answer:
        "I can only reason over the confirmed graph. Try asking about a service — e.g. PaymentService, AuthService, NotificationService, or the infrastructure layer.",
      highlight: [],
    };
  }
  const { data } = await api.post<QueryResult>(`${SERVICES.GRAPH}/query`, {
    query: message,
  });
  return data;
}
