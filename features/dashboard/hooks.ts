'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { isRunning, JOB_POLL_MS } from '@/shared/lib/job-status';
import * as dashboardApi from './api';
import { toCanvas } from './lib/canvas';
import { useViewStore } from './store';

const keys = {
  viewOptions: ['graph', 'view-options'] as const,
  view: (repo: string, expand: string[], reveal: string[]) => ['graph', 'view', repo, { expand, reveal }] as const,
};

/** The filter vocabulary and page size; only changes with the backend. */
export function useViewOptions() {
  return useQuery({ queryKey: keys.viewOptions, queryFn: dashboardApi.getViewOptions, staleTime: Infinity });
}

export function useGraphView(repo: string) {
  const expanded = useViewStore((state) => state.expanded);
  const revealed = useViewStore((state) => state.revealed);
  const adopt = useViewStore((state) => state.adopt);

  const result = useQuery({
    queryKey: keys.view(repo, expanded, revealed),
    queryFn: async () => toCanvas(await dashboardApi.getGraphView(repo, { expand: expanded, reveal: revealed })),
    // opening a folder is a new query; keep the old view on screen meanwhile, but never another repo's
    placeholderData: (previous) => (previous?.view.repo_full_name === repo ? previous : undefined),
    // a repo being re-indexed is worth polling until its new graph lands
    refetchInterval: ({ state }) => {
      return isRunning(state.data?.view.parse_status) ? JOB_POLL_MS : false;
    },
  });

  // the server decides what is actually open; adopt ignores an unchanged set, so this settles at once
  const open = result.data?.view.expanded;
  useEffect(() => {
    if (open) adopt(open.map((container) => container.id));
  }, [open, adopt]);

  return result;
}
