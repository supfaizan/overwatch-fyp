"use client";

import { useEffect, useMemo } from "react";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActiveRepoFullName } from "@/stores/repo-store";
import { useDashboardStore } from "../../stores/dashboard-store";
import { getGraphView, getViewOptions } from "../api";
import { graphViewKeys } from "../api/query-keys";
import { useViewQuery, useViewStore } from "../stores/view-store";
import { flowMarks, flowMoves, projectSteps, unlinkedMoves } from "../lib/flow";
import type { CanvasNode, Granularity, ViewFlowEdge } from "../types";

/** The filter vocabulary. It only changes when the backend does, so it is
 *  fetched once and kept — a new relationship type then appears in the UI
 *  without a frontend release. */
export function useViewOptions() {
  return useQuery({
    queryKey: graphViewKeys.options(),
    queryFn: getViewOptions,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useGraphView() {
  const repoFullName = useActiveRepoFullName();
  const query = useViewQuery();
  const adopt = useViewStore((state) => state.adopt);

  const result = useQuery({
    queryKey: graphViewKeys.view(repoFullName ?? "", query),
    queryFn: () => getGraphView(repoFullName!, query),
    enabled: Boolean(repoFullName),
    // Opening a folder is a different query, not a refresh of this one.
    // Holding the previous view keeps the canvas from blanking mid-click.
    placeholderData: keepPreviousData,
    // The first index runs as a background job, so an empty graph means "not
    // yet" rather than "none" — keep polling until it lands.
    refetchInterval: (entry) => {
      const status = entry.state.data?.parseStatus;
      return status === "pending" || status === "in_progress" ? 4_000 : false;
    },
  });

  // The server is the authority on what is open: an id whose parent turned
  // out to be shut is never opened, and is dropped here rather than resent on
  // every request. `adopt` ignores an unchanged set, so this settles at once.
  const expanded = result.data?.expanded;
  useEffect(() => {
    if (expanded) adopt(expanded.map((container) => container.id));
  }, [expanded, adopt]);

  return result;
}

/** Open one folder down to a level, in one step.
 *
 * Scoped on purpose. Applied to the whole repository this opens every folder
 * at once — hundreds of boxes, a stalled browser, and no question answered.
 * Applied to the folder you picked it is the useful version of the same idea.
 *
 * A one-shot request rather than a stored setting: it resolves to a concrete
 * set of open folders, which is then what the trail lists and what can be
 * closed again one at a time. */
export function useExpandTo() {
  const repoFullName = useActiveRepoFullName();
  const adopt = useViewStore((state) => state.adopt);
  const expanded = useViewStore((state) => state.expanded);

  const mutation = useMutation({
    mutationFn: ({ level, from }: { level: Granularity; from: string }) =>
      getGraphView(repoFullName!, {
        // Whatever is already open stays open; this adds one subtree to it.
        expanded,
        revealed: [],
        expandTo: level,
        expandFrom: from,
        nodeLabels: null,
        edgeTypes: null,
      }),
    onSuccess: (view) => adopt(view.expanded.map((container) => container.id)),
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    expandTo: (level: Granularity, from: string) => {
      if (repoFullName && !mutation.isPending) mutation.mutate({ level, from });
    },
    isPending: mutation.isPending,
    disabled: !repoFullName,
  };
}

/** What the spotlight (a chat answer's references, a clicked node) lights in
 *  the current view: each node's own box if drawn, else the folder or marker
 *  that stands for it — so a cited method lights its folder until opened,
 *  never the whole top-level module. Published per box for the cards. */
export function useSpotlightProjection(nodes: readonly CanvasNode[] | undefined): Set<string> {
  const spotlight = useDashboardStore((state) => state.spotlight);
  const setSpotlightMarks = useDashboardStore((state) => state.setSpotlightMarks);

  const lit = useMemo(
    () =>
      new Set(
        (spotlight.length && nodes ? projectSteps(spotlight, nodes) : []).filter(
          (id): id is string => id !== null,
        ),
      ),
    [spotlight, nodes],
  );

  useEffect(() => {
    setSpotlightMarks(Object.fromEntries([...lit].map((id) => [id, true as const])));
  }, [lit, setSpotlightMarks]);

  return lit;
}

/** A node the map was asked to centre on, as the box that stands for it now. */
export function useMapFocusTarget(nodes: readonly CanvasNode[] | undefined): string | null {
  const mapFocus = useDashboardStore((state) => state.mapFocus);
  return useMemo(
    () => (mapFocus && nodes ? projectSteps([mapFocus], nodes)[0] : null),
    [mapFocus, nodes],
  );
}

/** The walkthrough as the canvas can currently draw it.
 *
 * Projects every step onto the box that stands for it in this view, and
 * publishes the per-box step badges for the cards to read. Recomputed only
 * when the view or the walkthrough changes — moving the cursor only
 * re-derives the badges. */
export function useFlowProjection(
  nodes: readonly CanvasNode[] | undefined,
  edges: readonly ViewFlowEdge[] | undefined,
) {
  const flow = useDashboardStore((state) => state.flow);
  const cursor = useDashboardStore((state) => state.flowCursor);
  const setFlowMarks = useDashboardStore((state) => state.setFlowMarks);

  const projected = useMemo(
    () => (flow && nodes ? projectSteps(flow.steps, nodes) : []),
    [flow, nodes],
  );
  const moves = useMemo(
    () => flowMoves(projected, flow?.steps.map((step) => step.parent) ?? []),
    [projected, flow],
  );
  const unlinked = useMemo(() => unlinkedMoves(moves, edges ?? []), [moves, edges]);
  const onPath = useMemo(
    () => new Set(projected.filter((id): id is string => id !== null)),
    [projected],
  );

  useEffect(() => {
    setFlowMarks(flowMarks(projected, cursor));
  }, [projected, cursor, setFlowMarks]);

  return {
    isActive: flow !== null,
    moves,
    unlinked,
    onPath,
    activeId: projected[cursor] ?? null,
  };
}
