'use client';

import { FileText, Folder } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import Skeleton from '@/shared/components/skeleton';
import { useChildren } from '../hooks';
import { DOCUMENT_KIND, type Document } from '../types';
import { NewMenu } from './doc-tree';
import TitleInput from './title-input';

const updated = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });

/** A folder: its title and what's inside it. */
export default function FolderView({ doc }: { doc: Document }) {
  const { nodes, isPending, hasNextPage, fetchNextPage, isFetchingNextPage } = useChildren(doc.id);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center gap-3">
        <Folder weight="fill" aria-hidden className="size-7 shrink-0 text-accent-amber" />
        <TitleInput doc={doc} />
        {doc.editable && <NewMenu parentId={doc.id} />}
      </div>
      {isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : nodes.length ? (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {nodes.map((node) => (
            <li key={node.id}>
              <Link href={`/documents/${node.id}`} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-fill-hover">
                {node.kind === DOCUMENT_KIND.folder ? <Folder weight="fill" aria-hidden className="size-4 text-accent-amber" /> : <FileText aria-hidden className="size-4 text-muted" />}
                <span className="flex-1 truncate">{node.title || 'Untitled'}</span>
                <span className="text-xs text-muted">{updated.format(new Date(node.updated_at))}</span>
              </Link>
            </li>
          ))}
          {hasNextPage && (
            <li className="px-4 py-2">
              <button type="button" disabled={isFetchingNextPage} onClick={() => void fetchNextPage()} className="cursor-pointer text-xs text-primary">Show more</button>
            </li>
          )}
        </ul>
      ) : (
        <p className="text-sm text-muted">This folder is empty.</p>
      )}
    </section>
  );
}
