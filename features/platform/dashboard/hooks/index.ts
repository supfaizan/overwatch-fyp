"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useActiveRepoId } from "@/stores/repo-store";
import { getGraph, getWarnings, sendQuery } from "../api";
import { dashboardKeys } from "../api/query-keys";
import { useDashboardStore } from "../stores/dashboard-store";
import type { ChatMessage } from "../types";

export function useGraph() {
  const repoId = useActiveRepoId();
  return useQuery({
    queryKey: dashboardKeys.graph(repoId),
    queryFn: () => getGraph(repoId),
  });
}

export function useWarnings() {
  const repoId = useActiveRepoId();
  return useQuery({
    queryKey: dashboardKeys.warnings(repoId),
    queryFn: () => getWarnings(repoId),
  });
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Ask me anything about this system — grounded only in the confirmed graph. e.g. \"What depends on PaymentService?\"",
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const setHighlighted = useDashboardStore((s) => s.setHighlighted);

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
  });

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || mutation.isPending) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
    ]);
    mutation.mutate(trimmed);
  };

  return { messages, send, isPending: mutation.isPending };
}
