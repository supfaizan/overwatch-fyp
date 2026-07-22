"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActiveRepoFullName } from "@/stores/repo-store";
import { getGraph, getWarnings, requestFlow, sendQuery } from "../api";
import { dashboardKeys } from "../api/query-keys";
import { useDashboardStore } from "../stores/dashboard-store";
import type { ChatMessage } from "../types";

export function useGraph() {
  const repoFullName = useActiveRepoFullName();
  return useQuery({
    queryKey: dashboardKeys.graph(repoFullName ?? ""),
    queryFn: () => getGraph(repoFullName!),
    enabled: Boolean(repoFullName),
    // The initial parse runs as a background job, so an empty graph is a
    // "not yet" rather than a "none" — keep polling until it lands.
    refetchInterval: (query) => {
      const status = query.state.data?.parseStatus;
      return status === "pending" || status === "in_progress" ? 4_000 : false;
    },
  });
}

/** Out of eval-1 scope (contract checker); the panel is unrouted. */
export function useWarnings() {
  const repoFullName = useActiveRepoFullName();
  return useQuery({
    queryKey: dashboardKeys.warnings(repoFullName ?? ""),
    queryFn: getWarnings,
    enabled: Boolean(repoFullName),
  });
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Ask me anything about this repository's architecture — answers are grounded in the parsed graph, and any module the model names that isn't in the graph is dropped before it reaches you.",
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const repoFullName = useActiveRepoFullName();
  const setHighlighted = useDashboardStore((s) => s.setHighlighted);
  const focusedNodeId = useDashboardStore((s) => s.selectedNodeId);

  const mutation = useMutation({
    mutationFn: sendQuery,
    onSuccess: (result) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.answer,
          highlight: result.highlight,
        },
      ]);
      setHighlighted(result.highlight);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || mutation.isPending || !repoFullName) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
    ]);
    // A selected node scopes the answer to its 2-hop neighbourhood server-side.
    mutation.mutate({ repoFullName, question: trimmed, focusedNodeId });
  };

  return {
    messages,
    send,
    isPending: mutation.isPending,
    disabled: !repoFullName,
  };
}

/** Step interval for the walkthrough animation. Slow enough to read a node
 *  label before the spotlight moves on. */
const FLOW_STEP_MS = 1_600;

export function useFlow() {
  const repoFullName = useActiveRepoFullName();
  const { data: graph } = useGraph();
  const [playing, setPlaying] = useState(false);

  const stepIds = useDashboardStore((s) => s.flowStepIds);
  const cursor = useDashboardStore((s) => s.flowCursor);
  const startFlow = useDashboardStore((s) => s.startFlow);
  const setFlowCursor = useDashboardStore((s) => s.setFlowCursor);
  const clearFlow = useDashboardStore((s) => s.clearFlow);

  const mutation = useMutation({
    mutationFn: requestFlow,
    onSuccess: (ids) => {
      if (ids.length === 0) {
        // Every step the model named was dropped by the server-side graph
        // check, so there is nothing truthful left to animate.
        toast.error("No part of that flow could be matched to the graph.");
        return;
      }
      startFlow(ids);
      setPlaying(true);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Reaching the last step ends playback implicitly, so the effect never has to
  // write state back — it only schedules the next tick when one is due.
  const atEnd = stepIds.length === 0 || cursor >= stepIds.length - 1;

  useEffect(() => {
    if (!playing || atEnd) return;
    const timer = setTimeout(() => setFlowCursor(cursor + 1), FLOW_STEP_MS);
    return () => clearTimeout(timer);
  }, [playing, atEnd, cursor, setFlowCursor]);

  const steps = stepIds.map((id) => ({
    id,
    label: graph?.nodes.find((n) => n.id === id)?.data.label ?? id,
  }));

  return {
    steps,
    cursor,
    playing: playing && !atEnd,
    isPending: mutation.isPending,
    disabled: !repoFullName,
    request: (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || mutation.isPending || !repoFullName) return;
      mutation.mutate({ repoFullName, question: trimmed });
    },
    play: () => {
      // Replay from the top once the walkthrough has finished.
      if (atEnd) setFlowCursor(0);
      setPlaying(true);
    },
    pause: () => setPlaying(false),
    seek: (index: number) => {
      setPlaying(false);
      setFlowCursor(index);
    },
    reset: () => {
      setPlaying(false);
      clearFlow();
    },
  };
}
