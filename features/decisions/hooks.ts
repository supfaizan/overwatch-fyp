'use client';

import type { ApiError } from '@/shared/api/envelope';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as decisionsApi from './api';

/** Update the product overview, then open it in Docs. */
export const useUpdateOverview = () => {
  const router = useRouter();
  return useMutation({
    mutationFn: decisionsApi.updateOverview,
    onSuccess: ({ page_id: pageId }) => {
      toast.success('Product overview updated.');
      router.push(`/documents/${pageId}`);
    },
    onError: (error: ApiError) => {
      return toast.error(error.message);
    },
  });
};
