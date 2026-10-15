'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Skeleton from '@/shared/components/skeleton';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import { Archive, CaretLeft, CaretRight, Files } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import ArchiveList from './components/archive-list';
import DocPage from './components/doc-page';
import DocTree, { NewMenu } from './components/doc-tree';
import FolderView from './components/folder-view';
import { useDocument } from './hooks';
import { readTreeCollapsed, saveTreeCollapsed } from './lib';
import { DOCUMENT_KIND } from './types';

/** Docs: the tree beside whichever page or folder is open; the tree stays mounted as pages change. */
export default function DocsLayout({ children }: { children: ReactNode }) {
  const { nodeId } = useParams<{ nodeId?: string }>();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(readTreeCollapsed);
  const toggle = () => {
    setCollapsed(!collapsed);
    saveTreeCollapsed(!collapsed);
  };

  return (
    <div className="flex h-full min-h-0">
      {collapsed
        ? (
          <aside className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-border py-3">
            <Tooltip content="Show docs" side="right">
              <Button
                variant="tertiary"
                size="sm"
                iconOnly
                aria-label="Show docs"
                aria-expanded={false}
                onClick={toggle}
              >
                <CaretRight aria-hidden />
              </Button>
            </Tooltip>
            <NewMenu parentId={null} iconOnly />
          </aside>
        )
        : (
          <aside className="flex w-64 shrink-0 flex-col gap-3 border-r border-border p-3">
            <div className="flex items-center gap-1 px-1">
              <h1 className="flex-1 text-sm font-semibold">Docs</h1>
              <NewMenu parentId={null} />
              <Tooltip content="Hide docs">
                <Button
                  variant="tertiary"
                  size="sm"
                  iconOnly
                  aria-label="Hide docs"
                  aria-expanded
                  onClick={toggle}
                >
                  <CaretLeft aria-hidden />
                </Button>
              </Tooltip>
            </div>
            <DocTree activeId={nodeId} />
            <Link
              href="/documents/archive"
              className={cn(
                'flex h-8 items-center gap-2 rounded-md px-2 text-sm text-muted hover:bg-fill-hover hover:text-foreground',
                pathname === '/documents/archive' && 'bg-fill-active text-foreground',
              )}
            >
              <Archive aria-hidden className="size-4" />
              Archive
            </Link>
          </aside>
        )}
      {/* a size container, so a wide table can spread to the page's width */}
      <main className="@container min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

export function DocsArchive() {
  return <ArchiveList />;
}

export function DocsHome() {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
      <Files aria-hidden weight="fill" className="size-10 text-accent-blue" />
      <h2 className="text-lg font-semibold">Your team&apos;s docs</h2>
      <p className="text-sm text-muted">
        Specs, decisions and notes, beside the code and the board. Pick a page on the left, or start
        one.
      </p>
      <NewMenu parentId={null} />
    </section>
  );
}

export function DocView({ id }: { id: string }) {
  const doc = useDocument(id);
  if (doc.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-8">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (doc.isError) {
    return (
      <div className="p-6">
        <Banner
          type="error"
          action={
            <Button
              size="sm"
              onClick={() => void doc.refetch()}
            >
              Retry
            </Button>
          }
        >
          {doc.error.message}
        </Banner>
      </div>
    );
  }
  // a fresh page component per document, so one page's unsaved state never leaks into the next
  return doc.data.kind === DOCUMENT_KIND.folder
    ? <FolderView key={doc.data.id} doc={doc.data} />
    : <DocPage key={doc.data.id} doc={doc.data} />;
}
