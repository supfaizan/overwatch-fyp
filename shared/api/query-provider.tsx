'use client';

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { ApiError } from './envelope';
import { ERROR_CODE } from './error-codes';
import { queryKeys } from './query-keys';

/** One React Query cache per browser session. */
export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    // removed from the workspace, or it was deleted: refetch the list so WorkspaceGate picks another
    const onError = (error: Error) => {
      if (error instanceof ApiError && error.errorCode === ERROR_CODE.workspaceNotFound) {
        void client.invalidateQueries({ queryKey: queryKeys.workspaces });
      }
    };
    const client = new QueryClient({
      queryCache: new QueryCache({ onError }),
      mutationCache: new MutationCache({ onError }),
      defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
    });
    return client;
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
