'use client';

import Button from '@/shared/components/button';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import {
  ArrowClockwise,
  DownloadSimple,
  File as FileIcon,
  FileDoc,
  FileImage,
  FilePdf,
  FilePpt,
  FileText,
  FileXls,
  X,
} from '@phosphor-icons/react/ssr';
import { useState } from 'react';
import { toast } from 'sonner';
import * as discussionApi from '../api';
import { formatBytes } from '../files';
import type { DraftFile } from '../hooks';
import type { DiscussionAttachment } from '../types';

const KIND_ICONS: Partial<Record<string, typeof FileIcon>> = {
  image: FileImage,
  pdf: FilePdf,
  document: FileDoc,
  spreadsheet: FileXls,
  presentation: FilePpt,
  text: FileText,
};

function KindIcon({ kind, className }: { kind: string; className?: string }) {
  const Icon = KIND_ICONS[kind] ?? FileIcon;
  return (
    <Icon aria-hidden weight="duotone" className={cn('size-6 shrink-0 text-muted', className)} />
  );
}

/** A file in the composer: its upload's progress, then ready; a failure says why, with retry. */
export function DraftFileChip(
  { draft, onRetry, onRemove }: {
    draft: DraftFile;
    onRetry: () => void;
    onRemove: () => void;
  },
) {
  const failed = draft.status === 'failed';
  return (
    <li
      className={cn(
        'relative flex w-52 items-center gap-2 overflow-hidden rounded-md border bg-surface px-2 py-1.5',
        failed ? 'border-danger/40' : 'border-border',
      )}
    >
      <KindIcon kind={draft.attachment?.kind ?? ''} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-medium">{draft.file.name}</span>
        <span className={cn('truncate text-xs', failed ? 'text-danger' : 'text-muted')}>
          {failed
            ? draft.error
            : draft.status === 'uploading'
            ? `Uploading… ${Math.round(draft.progress * 100)}%`
            : formatBytes(draft.file.size)}
        </span>
      </div>
      {failed && (
        <Tooltip content="Try again">
          <Button
            size="sm"
            variant="tertiary"
            iconOnly
            aria-label={`Retry ${draft.file.name}`}
            onClick={onRetry}
          >
            <ArrowClockwise aria-hidden />
          </Button>
        </Tooltip>
      )}
      <Tooltip content="Remove">
        <Button
          size="sm"
          variant="tertiary"
          iconOnly
          aria-label={`Remove ${draft.file.name}`}
          onClick={onRemove}
        >
          <X aria-hidden />
        </Button>
      </Tooltip>
      {draft.status === 'uploading' && (
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-0.5 bg-primary transition-[width]"
          style={{ width: `${draft.progress * 100}%` }}
        />
      )}
    </li>
  );
}

/** The files a message carries: each downloads under its name, through a fresh short-lived link. */
export function AttachmentList({ attachments }: { attachments: DiscussionAttachment[] }) {
  const [fetching, setFetching] = useState<string | null>(null);
  const download = (attachment: DiscussionAttachment) => {
    setFetching(attachment.id);
    discussionApi.getDownloadLink(attachment.id).then(
      ({ url }) => {
        // the link tells the browser to save the file, so this page stays
        window.location.assign(url);
      },
      (error: Error) => {
        toast.error(error.message);
      },
    ).finally(() => {
      setFetching(null);
    });
  };
  return (
    <ul className="flex flex-col gap-1.5">
      {attachments.map((attachment) => {
        return (
          <li
            key={attachment.id}
            className="flex w-64 max-w-full items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5"
          >
            <KindIcon kind={attachment.kind} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs font-medium">{attachment.filename}</span>
              <span className="text-xs text-muted">{formatBytes(attachment.size)}</span>
            </div>
            <Tooltip content="Download">
              <Button
                size="sm"
                variant="tertiary"
                iconOnly
                aria-label={`Download ${attachment.filename}`}
                loading={fetching === attachment.id}
                onClick={() => {
                  return download(attachment);
                }}
              >
                <DownloadSimple aria-hidden />
              </Button>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
}
