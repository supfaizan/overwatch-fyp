'use client';

import Button from '@/shared/components/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/components/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/dropdown-menu';
import Skeleton from '@/shared/components/skeleton';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import type { Icon } from '@phosphor-icons/react';
import {
  Archive,
  CaretRight,
  DotsThree,
  FilePlus,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  PencilSimple,
  Plus,
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fragment, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useChildren, useCreateDocument, useDocument, useRenameDocument } from '../hooks';
import { sourceName } from '../lib';
import { DOCUMENT_KIND, type DocumentKind, type DocumentSummary, NATIVE_SOURCE } from '../types';
import ArchiveDialog from './archive-dialog';

const INDENT = 14;

type TreeProps = { activeId: string | undefined };

/** The workspace's docs, one level loaded at a time as folders open; the open page's folders open by themselves. */
export default function DocTree({ activeId }: TreeProps) {
  const active = useDocument(activeId);
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [closed, setClosed] = useState<Set<string>>(new Set());
  // the open page's ancestors show unless the user closed them
  const ancestors = active.data?.breadcrumbs.map((crumb) => crumb.id) ?? [];
  const isOpen = (id: string) => opened.has(id) || (ancestors.includes(id) && !closed.has(id));
  const toggle = (id: string) => {
    const open = !isOpen(id);
    setOpened((previous) => withMember(previous, id, open));
    setClosed((previous) => withMember(previous, id, !open));
  };
  const open = (id: string) => {
    setOpened((previous) => withMember(previous, id, true));
    setClosed((previous) => withMember(previous, id, false));
  };

  return (
    <nav aria-label="Docs" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <ul role="tree" className="flex flex-col gap-px">
        <Level
          parentId={null}
          depth={0}
          activeId={activeId}
          activeAncestors={ancestors}
          isOpen={isOpen}
          toggle={toggle}
          open={open}
        />
      </ul>
    </nav>
  );
}

function withMember(set: Set<string>, id: string, member: boolean) {
  if (set.has(id) === member) {
    return set;
  }
  const next = new Set(set);
  if (member) {
    next.add(id);
  } else {
    next.delete(id);
  }
  return next;
}

type LevelProps = TreeProps & {
  parentId: string | null;
  depth: number;
  activeAncestors: string[];
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
  open: (id: string) => void;
};

function Level({ parentId, depth, ...props }: LevelProps) {
  const { nodes, isPending, isError, hasNextPage, fetchNextPage, isFetchingNextPage, refetch } =
    useChildren(parentId);
  const padding = { paddingLeft: 8 + depth * INDENT };

  if (isPending) {
    return (
      <li style={padding}>
        <Skeleton className="my-1 h-5 w-32" />
      </li>
    );
  }
  if (isError) {
    return (
      <li style={padding} className="py-1 text-xs text-muted">
        Couldn&apos;t load.{' '}
        <button
          type="button"
          className="cursor-pointer text-primary"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </li>
    );
  }
  if (!nodes.length && depth === 0) {
    return <li className="px-2 py-1 text-sm text-muted">No docs yet.</li>;
  }
  if (!nodes.length) {
    return <li style={padding} className="py-1 text-xs text-muted">Empty</li>;
  }
  return (
    <>
      {nodes.map((node) => <Row key={node.id} node={node} depth={depth} {...props} />)}
      {hasNextPage && (
        <li style={padding}>
          <button
            type="button"
            disabled={isFetchingNextPage}
            onClick={() => void fetchNextPage()}
            className="cursor-pointer py-1 text-xs text-primary"
          >
            {isFetchingNextPage ? 'Loading…' : 'Show more'}
          </button>
        </li>
      )}
    </>
  );
}

function Row({ node, depth, ...props }: Omit<LevelProps, 'parentId'> & { node: DocumentSummary }) {
  const { activeId, activeAncestors, isOpen, toggle, open } = props;
  const [renaming, setRenaming] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const { add } = useAddDocument(node.id, () => open(node.id));
  const router = useRouter();
  const folder = node.kind === DOCUMENT_KIND.folder;
  const expandable = folder || node.has_children;
  const expanded = expandable && isOpen(node.id);
  const FolderIcon = expanded ? FolderOpen : Folder;

  const native = node.source === NATIVE_SOURCE;
  // a mirrored node takes new pages (made at its source) but not folders, and only its pages change here
  const actions = [
    node.editable && { label: 'Rename', icon: PencilSimple, onSelect: () => setRenaming(true) },
    node.can_add_pages
    && { label: 'New page inside', icon: FilePlus, onSelect: () => add(DOCUMENT_KIND.page) },
    native
    && { label: 'New folder inside', icon: FolderPlus, onSelect: () => add(DOCUMENT_KIND.folder) },
    node.editable
    && { label: 'Archive', icon: Archive, onSelect: () => setArchiving(true), danger: true },
  ].filter((action): action is NodeAction => Boolean(action));
  // the open page goes away with what's archived around it
  const leaveIfGone = () =>
    (node.id === activeId || activeAncestors.includes(node.id)) && router.push('/documents');

  const row = (
    <div
      style={{ paddingLeft: 4 + depth * INDENT }}
      className={cn(
        'group flex h-8 items-center gap-1 rounded-md pr-1 text-sm hover:bg-fill-hover data-[state=open]:bg-fill-hover',
        node.id === activeId && 'bg-fill-active font-medium',
      )}
    >
      <button
        type="button"
        aria-label={expanded ? 'Collapse' : 'Expand'}
        onClick={() => toggle(node.id)}
        className={cn(
          'flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-muted hover:text-foreground',
          !expandable && 'invisible',
        )}
      >
        <CaretRight
          aria-hidden
          className={cn('size-3 transition-transform', expanded && 'rotate-90')}
        />
      </button>
      {renaming
        ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <NodeIcon folder={folder} Icon={FolderIcon} />
            <InlineRename node={node} onDone={() => setRenaming(false)} />
          </div>
        )
        : (
          <Link href={`/documents/${node.id}`} className="flex min-w-0 flex-1 items-center gap-2">
            <NodeIcon folder={folder} Icon={FolderIcon} />
            <span className={cn('truncate', !node.title && 'text-muted')}>
              {node.title || 'Untitled'}
            </span>
            {!native && !node.parent_id && (
              <span className="shrink-0 text-xs text-muted">{sourceName(node.source)}</span>
            )}
          </Link>
        )}
      {actions.length > 0 && !renaming && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="tertiary"
              size="sm"
              iconOnly
              aria-label="More actions"
              className="size-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
            >
              <DotsThree aria-hidden weight="bold" className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" onCloseAutoFocus={(event) => event.preventDefault()}>
            {actions.map((action, index) => (
              <Fragment key={action.label}>
                {action.danger && index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem danger={action.danger} onSelect={action.onSelect}>
                  <action.icon aria-hidden />
                  {action.label}
                </DropdownMenuItem>
              </Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );

  return (
    <li
      role="treeitem"
      aria-expanded={expandable ? expanded : undefined}
      aria-selected={node.id === activeId}
    >
      {actions.length > 0
        ? (
          <ContextMenu modal={false}>
            <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
            <ContextMenuContent onCloseAutoFocus={(event) => event.preventDefault()}>
              {actions.map((action, index) => (
                <Fragment key={action.label}>
                  {action.danger && index > 0 && <ContextMenuSeparator />}
                  <ContextMenuItem danger={action.danger} onSelect={action.onSelect}>
                    <action.icon aria-hidden />
                    {action.label}
                  </ContextMenuItem>
                </Fragment>
              ))}
            </ContextMenuContent>
          </ContextMenu>
        )
        : row}
      {archiving && (
        <ArchiveDialog node={node} open onOpenChange={setArchiving} onArchived={leaveIfGone} />
      )}
      {expanded && (
        <ul role="group" className="flex flex-col gap-px">
          <Level parentId={node.id} depth={depth + 1} {...props} />
        </ul>
      )}
    </li>
  );
}

type NodeAction = { label: string; icon: Icon; onSelect: () => void; danger?: boolean };

function NodeIcon({ folder, Icon }: { folder: boolean; Icon: Icon }) {
  return folder
    ? <Icon weight="fill" aria-hidden className="size-4 shrink-0 text-accent-amber" />
    : <FileText aria-hidden className="size-4 shrink-0 text-muted" />;
}

/** The title as a field, in place in the tree: Enter or leaving saves, Esc cancels. */
function InlineRename({ node, onDone }: { node: DocumentSummary; onDone: () => void }) {
  const [title, setTitle] = useState(node.title);
  const rename = useRenameDocument();
  const done = useRef(false);
  const finish = (save: boolean) => {
    if (done.current) {
      return;
    }
    done.current = true;
    const next = title.trim();
    if (save && next !== node.title) {
      rename.mutate({ id: node.id, title: next });
    }
    onDone();
  };
  return (
    <input
      // eslint-disable-next-line jsx-a11y/no-autofocus -- opened on purpose from Rename
      autoFocus
      value={title}
      maxLength={255}
      aria-label="Rename"
      onFocus={(event) => event.target.select()}
      onChange={(event) => setTitle(event.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          finish(true);
        }
        if (event.key === 'Escape') {
          finish(false);
        }
      }}
      className="h-6 min-w-0 flex-1 rounded border border-primary bg-surface px-1.5 text-sm outline-none ring-2 ring-primary/25"
    />
  );
}

/** Opens a new page at once; a new folder is announced, with a way to open it. */
function useAddDocument(parentId: string | null, onCreated?: () => void) {
  const create = useCreateDocument();
  const router = useRouter();
  const add = (kind: DocumentKind) =>
    create.mutate({ kind, parent_id: parentId }, {
      onSuccess: (doc) => {
        onCreated?.();
        if (kind === DOCUMENT_KIND.page) {
          return router.push(`/documents/${doc.id}`);
        }
        toast.success('Folder created', {
          action: { label: 'Open', onClick: () => router.push(`/documents/${doc.id}`) },
        });
      },
    });
  return { add, pending: create.isPending };
}

/**
 * "New page / New folder", at the top of the tree or in a folder; `iconOnly` for the collapsed sidebar,
 * `pagesOnly` inside a mirrored folder (its source makes the page; folders stay the source's own).
 */
export function NewMenu(
  { parentId, iconOnly = false, pagesOnly = false }: {
    parentId: string | null;
    iconOnly?: boolean;
    pagesOnly?: boolean;
  },
) {
  const { add, pending } = useAddDocument(parentId);
  const button = iconOnly
    ? (
      <Button
        variant="tertiary"
        size="sm"
        iconOnly
        aria-label="New page or folder"
        disabled={pending}
      >
        <Plus aria-hidden />
      </Button>
    )
    : (
      <Button size="sm" variant="primary" disabled={pending}>
        <Plus aria-hidden weight="bold" />
        New
      </Button>
    );

  return (
    <DropdownMenu modal={false}>
      {iconOnly
        ? (
          <Tooltip content="New page or folder" side="right">
            <DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
          </Tooltip>
        )
        : <DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>}
      <DropdownMenuContent align={iconOnly ? 'start' : 'end'} side={iconOnly ? 'right' : 'bottom'}>
        <DropdownMenuItem onSelect={() => add(DOCUMENT_KIND.page)}>
          <FileText aria-hidden />Page
        </DropdownMenuItem>
        {!pagesOnly && (
          <DropdownMenuItem onSelect={() => add(DOCUMENT_KIND.folder)}>
            <Folder aria-hidden />Folder
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
