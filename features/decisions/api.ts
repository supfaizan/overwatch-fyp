import { api } from '@/shared/api/client';

/** Write the product overview page from the accepted decisions, creating it the first time. */
export const updateOverview = () => {
  return api.post<{ page_id: string }>('/decisions/overview');
};
