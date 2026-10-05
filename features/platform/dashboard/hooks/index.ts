"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActiveRepoFullName, useRepoStore } from "@/stores/repo-store";
import { getWarnings, requestFlow, sendQuery } from "../api";
import { useExplorerStore } from "../explorer/stores/explorer-store";
import { useViewOptions } from "../graph/hooks";
import { containersToOpen, type ProjectableStep } from "../graph/lib/flow";
import { useViewStore } from "../graph/stores/view-store";
import { dashboardKeys } from "../api/query-keys";
import { useChatStore, useChatThread } from "../stores/chat-store";
import { useDashboardStore } from "../stores/dashboard-store";
import type { ChatMessage, ChatTurn } from "../types";

/** Out of eval-1 scope (contract checker); the panel is unrouted. */
export function useWarnings() {
  const repoFullName = useActiveRepoFullName();
  return useQuery({
    queryKey: dashboardKeys.warnings(repoFullName ?? ""),
    queryFn: getWarnings,
    enabled: Boolean(repoFullName),
  });
}

/** Select a node and open it in the explorer, as one action.
 *
 *  An event rather than an effect that mirrors the selection: an effect
 *  re-fires whenever the explorer mounts, which reset the reader's drill-down
 *  every time they came back to the tab. `null` clears the selection. */
export function useSelectNode() {
  const selectNode = useDashboardStore((s) => s.selectNode);
  const openInExplorer = useExplorerStore((s) => s.open);

  return useCallback(
    (nodeId: string | null) => {
      selectNode(nodeId);
      if (nodeId) openInExplorer(nodeId);
    },
    [selectNode, openInExplorer],
  );
}

/** Keep every piece of dashboard state about the active repository.
 *
 *  Selections, open folders, filters and the explorer trail are all node ids
 *  of one repository; carried into another they point at nothing. Chat is
 *  not reset — it keeps a thread per repository. Checked against the store's
 *  own record rather than the previous render, so a switch made on another
 *  page is caught when the dashboard next mounts. */
export function useScopeToActiveRepo() {
  const repoFullName = useActiveRepoFullName();
  const scopedRepo = useDashboardStore((s) => s.repo);

  useEffect(() => {
    if (scopedRepo === repoFullName) return;
    useViewStore.getState().reset();
    useExplorerStore.getState().reset();
    useDashboardStore.getState().resetFor(repoFullName);
  }, [repoFullName, scopedRepo]);
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Ask me anything about this repository's architecture — answers are grounded in the parsed graph, and any module the model names that isn't in the graph is dropped before it reaches you. Follow-up questions keep the context of the conversation.",
};

/* Mirror the backend's caps on `POST /query/ask` (app/api/routes/query.py):
   a longer history or turn is rejected there, not trimmed. */
export const MAX_QUESTION_CHARS = 2_000;
const HISTORY_TURNS = 6;
const HISTORY_TURN_CHARS = 4_000;

/** The recent, answered part of a thread, in the shape the backend takes. */
function toHistory(thread: readonly ChatMessage[]): ChatTurn[] {
  return thread
    .filter((message) => !message.failed)
    .slice(-HISTORY_TURNS)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, HISTORY_TURN_CHARS),
    }));
}

export function useChat() {
  const repoFullName = useActiveRepoFullName();
  const thread = useChatThread(repoFullName);
  const append = useChatStore((s) => s.append);
  const markFailed = useChatStore((s) => s.markFailed);
  const remove = useChatStore((s) => s.remove);
  const clear = useChatStore((s) => s.clear);
  const mode = useChatStore((s) => s.mode);
  const setMode = useChatStore((s) => s.setMode);
  const setSpotlight = useDashboardStore((s) => s.setSpotlight);
  const setCanvas = useDashboardStore((s) => s.setCanvas);
  const focusedNodeId = useDashboardStore((s) => s.selectedNodeId);

  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof sendQuery>[0] & { messageId: string }) =>
      sendQuery(input),
    onSuccess: (result, { repoFullName: repo }) => {
      append(repo, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: result.answer,
        references: result.references,
        notice: result.notice,
        lookups: result.lookups,
      });
      // The answer may land after a repository switch; it belongs to its own
      // thread, but must not spotlight nodes on another repository's canvas.
      if (useRepoStore.getState().activeRepo?.fullName !== repo) return;
      setSpotlight(result.references);
      // What an answer cites is on the map; the flow view would hide it.
      if (result.references.length > 0) setCanvas("map");
    },
    onError: (error: Error, { repoFullName: repo, messageId }) => {
      markFailed(repo, messageId);
      toast.error(error.message);
    },
  });

  const ask = (question: string, history: ChatTurn[]) => {
    if (!repoFullName) return;
    const messageId = crypto.randomUUID();
    append(repoFullName, { id: messageId, role: "user", content: question });
    // A selected node scopes the answer to its 2-hop neighbourhood server-side.
    mutation.mutate({ repoFullName, question, focusedNodeId, history, mode, messageId });
  };

  const canSend = Boolean(repoFullName) && !mutation.isPending;
  // Stable between renders, so effects keyed on it (auto-scroll) run only
  // when the thread actually changes.
  const messages = useMemo(() => [WELCOME, ...thread], [thread]);

  return {
    messages,
    isPending: mutation.isPending,
    disabled: !repoFullName,
    mode,
    setMode,
    /** The mode of the question in flight, for its progress line. */
    pendingMode: mutation.variables?.mode ?? mode,
    /** Returns whether the question was sent, so the input is only cleared
     *  when it was — pressing Enter mid-answer must not lose what was typed. */
    send: (text: string): boolean => {
      const question = text.trim().slice(0, MAX_QUESTION_CHARS);
      if (!question || !canSend) return false;
      ask(question, toHistory(thread));
      return true;
    },
    retry: (message: ChatMessage) => {
      if (!repoFullName || !canSend) return;
      remove(repoFullName, message.id);
      ask(message.content, toHistory(thread.filter((m) => m.id !== message.id)));
    },
    clear: () => {
      if (!repoFullName) return;
      clear(repoFullName);
      setSpotlight([]);
    },
  };
}

/** Step interval for the walkthrough animation. Slow enough to read a step
 *  before the spotlight moves on. */
const FLOW_STEP_MS = 1_600;

/** Advances a playing walkthrough. Mounted by the dashboard itself rather
 *  than the flow panel, so playback carries on while another tab is open. */
export function useFlowPlayback() {
  const stepCount = useDashboardStore((s) => s.flow?.steps.length ?? 0);
  const cursor = useDashboardStore((s) => s.flowCursor);
  const playing = useDashboardStore((s) => s.flowPlaying);
  const setFlowCursor = useDashboardStore((s) => s.setFlowCursor);
  const setFlowPlaying = useDashboardStore((s) => s.setFlowPlaying);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (cursor >= stepCount - 1) setFlowPlaying(false);
      else setFlowCursor(cursor + 1);
    }, FLOW_STEP_MS);
    return () => clearTimeout(timer);
  }, [playing, cursor, stepCount, setFlowCursor, setFlowPlaying]);
}

/** Open just the folders holding a node, so it is drawn as itself — one
 *  node's worth of folders keeps the map legible where opening everything a
 *  flow or answer touches would not. */
function useOpenContainersOf() {
  const openMany = useViewStore((s) => s.openMany);
  const { data: options } = useViewOptions();
  return useCallback(
    (node: ProjectableStep) => {
      if (options) openMany(containersToOpen([node], options.maxExpanded), options.maxExpanded);
    },
    [options, openMany],
  );
}

/** Show one step of the walkthrough in its real surroundings on the map. */
export function useShowInMap() {
  const flow = useDashboardStore((s) => s.flow);
  const showStepOnMap = useDashboardStore((s) => s.showStepOnMap);
  const openContainersOf = useOpenContainersOf();

  return useCallback(
    (index: number) => {
      const step = flow?.steps[index];
      if (!step) return;
      openContainersOf(step);
      showStepOnMap(index, step);
    },
    [flow, openContainersOf, showStepOnMap],
  );
}

/** Show any node — a chat citation, say — lit and centred on the map. */
export function useShowNodeOnMap() {
  const showOnMap = useDashboardStore((s) => s.showOnMap);
  const openContainersOf = useOpenContainersOf();

  return useCallback(
    (node: ProjectableStep) => {
      openContainersOf(node);
      showOnMap({ nodeId: node.nodeId, containers: node.containers });
    },
    [openContainersOf, showOnMap],
  );
}

export function useFlow() {
  const repoFullName = useActiveRepoFullName();
  const flow = useDashboardStore((s) => s.flow);
  const cursor = useDashboardStore((s) => s.flowCursor);
  const playing = useDashboardStore((s) => s.flowPlaying);
  const selectedNodeId = useDashboardStore((s) => s.selectedNodeId);
  const startFlow = useDashboardStore((s) => s.startFlow);
  const setFlowCursor = useDashboardStore((s) => s.setFlowCursor);
  const setFlowPlaying = useDashboardStore((s) => s.setFlowPlaying);
  const clearFlow = useDashboardStore((s) => s.clearFlow);
  const canvas = useDashboardStore((s) => s.canvas);
  const setCanvas = useDashboardStore((s) => s.setCanvas);
  const showInMap = useShowInMap();

  const mutation = useMutation({
    mutationFn: requestFlow,
    onSuccess: (result, { repoFullName: repo }) => {
      // A walkthrough for a repository no longer on screen has nowhere to go.
      if (useRepoStore.getState().activeRepo?.fullName !== repo) return;
      if (result.steps.length === 0) {
        toast.error("Nothing in the graph matched that — try naming a page, route or function.");
        return;
      }
      startFlow(result);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const steps = flow?.steps ?? [];
  const atEnd = cursor >= steps.length - 1;

  return {
    flow,
    cursor,
    playing,
    canvas,
    isPending: mutation.isPending,
    disabled: !repoFullName,
    /** The selected node a new walkthrough would start from. */
    startsFrom: selectedNodeId,
    request: (question: string): boolean => {
      const trimmed = question.trim().slice(0, MAX_QUESTION_CHARS);
      if (!trimmed || mutation.isPending || !repoFullName) return false;
      mutation.mutate({ repoFullName, question: trimmed, focusedNodeId: selectedNodeId });
      return true;
    },
    play: () => {
      // Replay from the top once the walkthrough has finished.
      if (atEnd) setFlowCursor(0);
      setFlowPlaying(true);
    },
    pause: () => setFlowPlaying(false),
    seek: (index: number) => {
      setFlowPlaying(false);
      setFlowCursor(index);
    },
    reset: clearFlow,
    viewFlow: () => setCanvas("flow"),
    viewMap: () => setCanvas("map"),
    showInMap,
  };
}
