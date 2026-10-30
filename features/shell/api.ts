import { api } from '@/shared/api/client';
import type { SearchResult } from './types';

/** Board items and docs pages matching `q` by key, title or text, best match first. */
export const search = (q: string) => {
  return api.get<SearchResult[]>('/search', { params: { q } });
};
