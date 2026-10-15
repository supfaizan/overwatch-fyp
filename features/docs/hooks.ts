'use client';

import type { ApiError } from '@/shared/api/envelope';
import {
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import * as docsApi from './api';
import { type ChildPage, type Document, type DocumentSummary, PUSH_STATE } from './types';

const root = ['docs'] as const;
export const keys = {
  children: (parentId: string | null) => [...root, 'children', parentId ?? 'root'] as const,
  node: (id: string) => [...root, 'node', id] as const,
  archived: [...root, 'archived'] as const,
  linkPreview: (url: string) => [...root, 'link-preview', url] as const,
};

type ChildPages = { pages: ChildPage[]; pageParams: number[] };

const showError = (error: ApiError) => toast.error(error.message);

/** Changes a node wherever the tree has it loaded, without refetching any level. */
function patchSummary(queryClient: QueryClient, id: string, patch: Partial<DocumentSummary>) {
  queryClient.setQueriesData<ChildPages>(
    { queryKey: [...root, 'children'] },
    (data) =>
      data
      && {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          nodes: page.nodes.map((node) => (node.id === id ? { ...node, ...patch } : node)),
        })),
      },
  );
}

/** One level of the tree, a run at a time; `enabled` once its folder is expanded. */
export function useChildren(parentId: string | null, enabled = true) {
  const query = useInfiniteQuery({
    queryKey: keys.children(parentId),
    queryFn: ({ pageParam }) => docsApi.getChildren(parentId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (
      last,
    ) => (last.offset + last.nodes.length < last.total
      ? last.offset + last.nodes.length
      : undefined),
    enabled,
  });
  return { ...query, nodes: query.data?.pages.flatMap((page) => page.nodes) ?? [] };
}

// while a mirrored page's edits are on their way to its source, check how they got on
const PUSH_POLL_MS = 20_000;

export const useDocument = (id: string | undefined) =>
  useQuery({
    queryKey: keys.node(id ?? ''),
    queryFn: () => docsApi.getDocument(id as string),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const state = query.state.data?.push_state;
      return state === PUSH_STATE.pending || state === PUSH_STATE.pushing ? PUSH_POLL_MS : false;
    },
  });

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: docsApi.createDocument,
    onSuccess: (doc) => {
      queryClient.setQueryData(keys.node(doc.id), doc);
      if (doc.parent_id) {
        patchSummary(queryClient, doc.parent_id, { has_children: true });
      }
      void queryClient.invalidateQueries({ queryKey: keys.children(doc.parent_id) });
    },
    onError: showError,
  });
}

/** Renames at once in the tree and the open page; a failure puts the old title back. */
export function useRenameDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: docsApi.renameDocument,
    onMutate: ({ id, title }) => {
      const previous = queryClient.getQueryData<Document>(keys.node(id));
      patchSummary(queryClient, id, { title });
      if (previous) {
        queryClient.setQueryData(keys.node(id), { ...previous, title });
      }
      return { previous };
    },
    onError: (error: ApiError, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(keys.node(id), context.previous);
        patchSummary(queryClient, id, { title: context.previous.title });
      }
      showError(error);
    },
  });
}

/** After a content save: the cache keeps the server's version without re-rendering the editor's text. */
export function useStoreSaved() {
  const queryClient = useQueryClient();
  return (doc: Document) => {
    queryClient.setQueryData(keys.node(doc.id), doc);
    patchSummary(queryClient, doc.id, { updated_at: doc.updated_at });
  };
}

/** Archives a node; the tree refetches the levels it changed (its folder, and where its contents went). */
export function useArchiveDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: docsApi.archiveDocument,
    onSuccess: (_, { id, ...choice }) => {
      queryClient.removeQueries({ queryKey: keys.node(id) });
      void queryClient.invalidateQueries({ queryKey: [...root, 'children'] });
      void queryClient.invalidateQueries({ queryKey: keys.archived });
      if (choice.children === 'move') {
        void queryClient.invalidateQueries({ queryKey: [...root, 'node'] });
      }
    },
    onError: showError,
  });
}

export function useArchived() {
  const query = useInfiniteQuery({
    queryKey: keys.archived,
    queryFn: ({ pageParam }) => docsApi.getArchived(pageParam),
    initialPageParam: 0,
    getNextPageParam: (
      last,
    ) => (last.offset + last.items.length < last.total
      ? last.offset + last.items.length
      : undefined),
  });
  return { ...query, items: query.data?.pages.flatMap((page) => page.items) ?? [] };
}

export function useRestoreDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: docsApi.restoreDocument,
    onSuccess: (doc) => {
      queryClient.setQueryData(keys.node(doc.id), doc);
      void queryClient.invalidateQueries({ queryKey: [...root, 'children'] });
      void queryClient.invalidateQueries({ queryKey: keys.archived });
    },
    onError: showError,
  });
}

export function useDeleteArchived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: docsApi.deleteArchived,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.archived }),
    onError: showError,
  });
}

/** Settles a page edited here and at its source at once; the editor reloads with the result. */
export function useResolveConflict() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: docsApi.resolveConflict,
    onSuccess: (doc) => {
      queryClient.setQueryData(keys.node(doc.id), doc);
      patchSummary(queryClient, doc.id, { title: doc.title, editable: doc.editable });
    },
    onError: showError,
  });
}

// the server caches previews for days; a page's cards needn't ask again while it's open
const PREVIEW_STALE_MS = 60 * 60_000;

/** A link's title, picture and icon, for its card; `enabled` once there's a link to read. */
export function useLinkPreview(url: string, enabled = true) {
  return useQuery({
    queryKey: keys.linkPreview(url),
    queryFn: () => docsApi.getLinkPreview(url),
    enabled: enabled && Boolean(url),
    staleTime: PREVIEW_STALE_MS,
    retry: false,
  });
}
