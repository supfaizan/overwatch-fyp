'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import Skeleton from '@/shared/components/skeleton';
import { Archive, ArrowCounterClockwise, FileText, Folder, Trash } from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';
import { useArchived, useDeleteArchived, useRestoreDocument } from '../hooks';
import { sourceName } from '../lib';
import { DOCUMENT_KIND, NATIVE_SOURCE } from '../types';

// mirrors the backend's DOC_ARCHIVE_RETENTION_DAYS
const RETENTION_DAYS = 30;

const archivedOn = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Everything archived, newest first; restoring brings an archive back with whatever went with it.
 * Archives are deleted for good after a while, or now with Delete. One from a source (Confluence) is
 * restored there; deleting one archived from here deletes it there too.
 */
export default function ArchiveList() {
  const {
    items,
    isPending,
    isError,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useArchived();
  const restore = useRestoreDocument();
  const remove = useDeleteArchived();
  const router = useRouter();

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <header className="flex items-center gap-3">
        <Archive aria-hidden weight="fill" className="size-7 text-accent-slate" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Archive</h2>
          <p className="text-sm text-muted">
            Archived pages and folders. Restore one to put it back where it was. Archives are
            deleted for good after {RETENTION_DAYS} days.
          </p>
        </div>
      </header>
      {isPending
        ? <Skeleton className="h-32 w-full" />
        : isError
        ? (
          <Banner
            type="error"
            action={
              <Button
                size="sm"
                onClick={() => void refetch()}
              >
                Retry
              </Button>
            }
          >
            {error.message}
          </Banner>
        )
        : items.length
        ? (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                {item.kind === DOCUMENT_KIND.folder
                  ? <Folder weight="fill" aria-hidden className="size-4 text-accent-amber" />
                  : <FileText aria-hidden className="size-4 text-muted" />}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{item.title || 'Untitled'}</span>
                  <span className="text-xs text-muted">
                    Archived {archivedOn.format(new Date(item.archived_at))}
                    {item.archived_with > 0
                      && ` · with ${item.archived_with} ${
                        item.archived_with === 1 ? 'item' : 'items'
                      } inside`}
                  </span>
                </div>
                {item.source === NATIVE_SOURCE
                  ? (
                    <Button
                      size="sm"
                      disabled={restore.isPending && restore.variables === item.id}
                      onClick={() =>
                        restore.mutate(item.id, {
                          onSuccess: (doc) => router.push(`/documents/${doc.id}`),
                        })}
                    >
                      <ArrowCounterClockwise aria-hidden />
                      Restore
                    </Button>
                  )
                  : (
                    <span className="text-xs text-muted">
                      Restore it in {sourceName(item.source)}
                    </span>
                  )}
                <ConfirmDialog
                  trigger={
                    <Button size="sm" iconOnly variant="tertiary" aria-label="Delete for good">
                      <Trash aria-hidden />
                    </Button>
                  }
                  title={`Delete “${item.title || 'Untitled'}” for good?`}
                  description={item.source === NATIVE_SOURCE
                    ? "It and everything archived with it are deleted, with their images. This can't be undone."
                    : `It and everything archived with it are deleted, here and, for pages archived from Overwatch, in ${
                      sourceName(item.source)
                    }. This can't be undone.`}
                  confirmLabel="Delete for good"
                  pending={remove.isPending && remove.variables === item.id}
                  onConfirm={(close) =>
                    remove.mutate(item.id, { onSuccess: close })}
                />
              </li>
            ))}
            {hasNextPage && (
              <li className="px-4 py-2">
                <button
                  type="button"
                  disabled={isFetchingNextPage}
                  onClick={() => void fetchNextPage()}
                  className="cursor-pointer text-xs text-primary"
                >
                  Show more
                </button>
              </li>
            )}
          </ul>
        )
        : <p className="text-sm text-muted">Nothing is archived.</p>}
    </section>
  );
}
