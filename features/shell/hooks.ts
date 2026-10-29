'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as shellApi from './api';
import { MIN_SEARCH_LENGTH } from './lib';

const keys = {
  search: (q: string) => {
    return ['shell', 'search', q] as const;
  },
};

/** ⌘K search results for `q`; nothing is fetched until it's long enough. */
export function useSearch(q: string) {
  return useQuery({
    queryKey: keys.search(q),
    queryFn: () => {
      return shellApi.search(q);
    },
    enabled: q.length >= MIN_SEARCH_LENGTH,
    // the last results stay while the next ones load, so the list doesn't flicker as you type
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
