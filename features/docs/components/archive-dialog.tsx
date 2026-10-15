'use client';

import Button from '@/shared/components/button';
import { Dialog, DialogContent } from '@/shared/components/dialog';
import Skeleton from '@/shared/components/skeleton';
import { cn } from '@/shared/lib/cn';
import { CaretRight, Folder, FolderOpen, House } from '@phosphor-icons/react/ssr';
import { useState } from 'react';
import type { ArchiveChoice } from '../api';
import { useArchiveDocument, useChildren } from '../hooks';
import { sourceName } from '../lib';
import { DOCUMENT_KIND, type DocumentSummary, NATIVE_SOURCE } from '../types';

const CHOICE = { archive: 'archive', top: 'top', folder: 'folder' } as const;
type Choice = (typeof CHOICE)[keyof typeof CHOICE];

type ArchiveDialogProps = {
  node: DocumentSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** After it's archived, e.g. to leave a page that's gone. */
  onArchived: () => void;
};

/**
 * Archives a page or folder. One with nothing inside just confirms; otherwise what's inside can go
 * with it, or move to the top level or another folder first. Archived docs can be restored.
 * A page from a source (Confluence) is archived there too, with what's under it.
 */
export default function ArchiveDialog(
  { node, open, onOpenChange, onArchived }: ArchiveDialogProps,
) {
  const [choice, setChoice] = useState<Choice>(CHOICE.archive);
  const [target, setTarget] = useState<DocumentSummary | null>(null);
  const archive = useArchiveDocument();
  const name = node.title || 'Untitled';
  const noun = node.kind === DOCUMENT_KIND.folder ? 'folder' : 'page';
  const source = node.source === NATIVE_SOURCE ? null : sourceName(node.source);

  const submit = () => {
    const request: ArchiveChoice = choice === CHOICE.archive
      ? { children: 'archive' }
      : { children: 'move', move_to: choice === CHOICE.folder ? (target?.id ?? null) : null };
    archive.mutate({ id: node.id, ...request }, {
      onSuccess: () => {
        onOpenChange(false);
        onArchived();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Archive “${name}”?`}
        description={source
          ? `It's archived in ${source} too${
            node.has_children ? ', with the pages under it' : ''
          }. To bring it back, restore it in ${source}.`
          : node.has_children
          ? `This ${noun} has pages inside it. Choose what happens to them. You can restore anything archived from Archive.`
          : `It moves to Archive, where you can restore it.`}
        footer={
          <>
            <Button onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={archive.isPending || (choice === CHOICE.folder && !target)}
              onClick={submit}
            >
              {archive.isPending ? 'Archiving…' : 'Archive'}
            </Button>
          </>
        }
      >
        {node.has_children && !source && (
          <div
            role="radiogroup"
            aria-label="What happens to what's inside"
            className="flex flex-col gap-2"
          >
            <Option
              checked={choice === CHOICE.archive}
              onSelect={() => setChoice(CHOICE.archive)}
              title="Archive everything inside too"
              detail="They go to Archive with it and come back together on restore."
            />
            <Option
              checked={choice === CHOICE.top}
              onSelect={() => setChoice(CHOICE.top)}
              title="Move what's inside to the top level"
              detail="They stay in Docs, at the top of the sidebar."
            />
            <Option
              checked={choice === CHOICE.folder}
              onSelect={() => setChoice(CHOICE.folder)}
              title="Move what's inside to another folder"
              detail={target ? `Into “${target.title || 'Untitled'}”` : 'Pick the folder below.'}
            />
            {choice === CHOICE.folder && (
              <FolderPicker exclude={node.id} selected={target?.id} onSelect={setTarget} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Option(
  { checked, onSelect, title, detail }: {
    checked: boolean;
    onSelect: () => void;
    title: string;
    detail: string;
  },
) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors',
        checked ? 'border-primary bg-primary/5' : 'border-border hover:border-border-hover',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
          checked ? 'border-primary' : 'border-border-strong',
        )}
      >
        {checked && <span className="size-2 rounded-full bg-primary" />}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted">{detail}</span>
      </span>
    </button>
  );
}

type PickerProps = {
  exclude: string;
  selected: string | undefined;
  onSelect: (folder: DocumentSummary) => void;
};

/** The folders, opened one level at a time; the one being archived (and so everything in it) is left out. */
function FolderPicker(props: PickerProps) {
  return (
    <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-surface p-1">
      <p className="flex items-center gap-2 px-2 py-1 text-xs text-muted">
        <House aria-hidden className="size-3.5" />Docs
      </p>
      <ul role="tree" aria-label="Folders">
        <FolderLevel parentId={null} depth={0} {...props} />
      </ul>
    </div>
  );
}

function FolderLevel(
  { parentId, depth, ...props }: PickerProps & { parentId: string | null; depth: number },
) {
  const { nodes, isPending, hasNextPage, fetchNextPage } = useChildren(parentId);
  const folders = nodes.filter((node) =>
    node.kind === DOCUMENT_KIND.folder && node.id !== props.exclude && node.editable
  );
  if (isPending) {
    return (
      <li>
        <Skeleton className="m-1 h-5 w-32" />
      </li>
    );
  }
  if (!folders.length && depth === 0) {
    return <li className="px-2 py-1 text-xs text-muted">No other folders yet.</li>;
  }
  return (
    <>
      {folders.map((folder) => (
        <FolderRow key={folder.id} folder={folder} depth={depth} {...props} />
      ))}
      {hasNextPage && (
        <li style={{ paddingLeft: 8 + depth * 14 }}>
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            className="cursor-pointer py-1 text-xs text-primary"
          >
            Show more
          </button>
        </li>
      )}
    </>
  );
}

function FolderRow(
  { folder, depth, ...props }: PickerProps & { folder: DocumentSummary; depth: number },
) {
  const [open, setOpen] = useState(false);
  const Icon = open ? FolderOpen : Folder;
  return (
    <li
      role="treeitem"
      aria-expanded={folder.has_children ? open : undefined}
      aria-selected={props.selected === folder.id}
    >
      <div
        style={{ paddingLeft: depth * 14 }}
        className={cn(
          'flex h-8 items-center gap-1 rounded-md pr-2 text-sm',
          props.selected === folder.id ? 'bg-primary/10 text-primary' : 'hover:bg-fill-hover',
        )}
      >
        <button
          type="button"
          aria-label={open ? 'Collapse' : 'Expand'}
          onClick={() => setOpen(!open)}
          className={cn(
            'flex size-5 cursor-pointer items-center justify-center text-muted',
            !folder.has_children && 'invisible',
          )}
        >
          <CaretRight
            aria-hidden
            className={cn('size-3 transition-transform', open && 'rotate-90')}
          />
        </button>
        <button
          type="button"
          onClick={() => props.onSelect(folder)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        >
          <Icon weight="fill" aria-hidden className="size-4 shrink-0 text-accent-amber" />
          <span className="truncate">{folder.title || 'Untitled'}</span>
        </button>
      </div>
      {open && (
        <ul role="group">
          <FolderLevel parentId={folder.id} depth={depth + 1} {...props} />
        </ul>
      )}
    </li>
  );
}
