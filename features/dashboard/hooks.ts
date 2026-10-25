'use client';

import { isRunning, JOB_POLL_MS } from '@/shared/lib/job-status';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import * as dashboardApi from './api';
import { ancestorsOf } from './lib/ancestors';
import { useViewStore } from './store';

const keys = {
  viewOptions: ['graph', 'view-options'] as const,
  view: (repo: string, expand: string[], reveal: string[]) => {
    return ['graph', 'view', repo, { expand, reveal }] as const;
  },
};

/** The backend's cap on open folders (MAX_EXPANDED), until the view options say otherwise. */
const MAX_OPEN_FALLBACK = 64;

/** The filter vocabulary and page size; only changes with the backend. */
export function useViewOptions() {
  return useQuery({
    queryKey: keys.viewOptions,
    queryFn: dashboardApi.getViewOptions,
    staleTime: Infinity,
  });
}

export function useGraphView(repo: string) {
  const expanded = useViewStore((state) => {
    return state.expanded;
  });
  const revealed = useViewStore((state) => {
    return state.revealed;
  });
  const adopt = useViewStore((state) => {
    return state.adopt;
  });

  const result = useQuery({
    queryKey: keys.view(repo, expanded, revealed),
    queryFn: () => {
      return dashboardApi.getGraphView(repo, { expand: expanded, reveal: revealed });
    },
    // opening a folder is a new query; keep the old view on screen meanwhile, but never another repo's
    placeholderData: (previous) => {
      return (previous?.repo_full_name === repo ? previous : undefined);
    },
    // a repo being re-indexed is worth polling until its new graph lands
    refetchInterval: ({ state }) => {
      return isRunning(state.data?.parse_status) ? JOB_POLL_MS : false;
    },
  });

  // the server decides what is actually open; adopt ignores an unchanged set, so this settles at once
  const open = result.data?.expanded;
  useEffect(() => {
    if (open) {
      adopt(open.map((container) => {
        return container.id;
      }));
    }
  }, [open, adopt]);

  return result;
}

/**
 * Walkthroughs of the flows chat answers describe. `play` shows an answer's steps from the first,
 * playing, or paused at `cursor`; nothing for an answer without steps.
 */
export function useWalkthrough(repo: string) {
  const { data: options } = useViewOptions();

  const play = useCallback((answerId: string, nodeIds: string[], cursor?: number) => {
    useViewStore.getState().startWalk(
      nodeIds.map((nodeId) => {
        return { nodeId, ancestors: ancestorsOf(nodeId, repo) };
      }),
      options?.max_expanded ?? MAX_OPEN_FALLBACK,
      answerId,
      cursor,
    );
  }, [repo, options]);

  return { play };
}
