'use client';

import { Archive, ArrowCounterClockwise, FileText, Folder } from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Skeleton from '@/shared/components/skeleton';
import { useArchived, useRestoreDocument } from '../hooks';
import { DOCUMENT_KIND } from '../types';

const archivedOn = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** Everything archived, newest first; restoring brings an archive back with whatever went with it. */
export default function ArchiveList() {
  const { items, isPending, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = useArchived();
  const restore = useRestoreDocument();
  const router = useRouter();

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <header className="flex items-center gap-3">
        <Archive aria-hidden weight="fill" className="size-7 text-accent-slate" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Archive</h2>
          <p className="text-sm text-muted">Archived pages and folders. Restore one to put it back where it was.</p>
        </div>
      </header>
      {isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : isError ? (
        <Banner type="error" action={<Button size="sm" onClick={() => void refetch()}>Retry</Button>}>{error.message}</Banner>
      ) : items.length ? (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              {item.kind === DOCUMENT_KIND.folder ? <Folder weight="fill" aria-hidden className="size-4 text-accent-amber" /> : <FileText aria-hidden className="size-4 text-muted" />}
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{item.title || 'Untitled'}</span>
                <span className="text-xs text-muted">
                  Archived {archivedOn.format(new Date(item.archived_at))}
                  {item.archived_with > 0 && ` · with ${item.archived_with} ${item.archived_with === 1 ? 'item' : 'items'} inside`}
                </span>
              </div>
              <Button
                size="sm"
                disabled={restore.isPending && restore.variables === item.id}
                onClick={() => restore.mutate(item.id, { onSuccess: (doc) => router.push(`/documents/${doc.id}`) })}
              >
                <ArrowCounterClockwise aria-hidden />
                Restore
              </Button>
            </li>
          ))}
          {hasNextPage && (
            <li className="px-4 py-2">
              <button type="button" disabled={isFetchingNextPage} onClick={() => void fetchNextPage()} className="cursor-pointer text-xs text-primary">Show more</button>
            </li>
          )}
        </ul>
      ) : (
        <p className="text-sm text-muted">Nothing is archived.</p>
      )}
    </section>
  );
}
