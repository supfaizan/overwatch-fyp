'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowSquareOut, DotsThree, Lock } from '@phosphor-icons/react/ssr';
import Avatar from '@/shared/components/avatar';
import Button from '@/shared/components/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/shared/components/dropdown-menu';
import Tag from '@/shared/components/tag';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import { COLUMNS } from '../lib';
import { NATIVE_SOURCE, type StatusCategory, type WorkItem } from '../types';

type WorkItemCardProps = {
  item: WorkItem;
  onOpen: (item: WorkItem) => void;
  /** Keyboard- and screen-reader-friendly alternative to dragging. */
  onMoveTo: (item: WorkItem, category: StatusCategory) => void;
};

export default function WorkItemCard({ item, onOpen, onMoveTo }: WorkItemCardProps) {
  const sortable = useSortable({ id: item.id, disabled: !item.editable });

  return (
    <li
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition }}
      className={cn('list-none', sortable.isDragging && 'opacity-40')}
    >
      <CardBody item={item} onOpen={onOpen} onMoveTo={onMoveTo} dragHandle={{ ...sortable.attributes, ...sortable.listeners }} />
    </li>
  );
}

/** The card itself, also rendered in the drag overlay. */
export function CardBody({ item, onOpen, onMoveTo, dragHandle }: WorkItemCardProps & { dragHandle?: object }) {
  const tracker = item.source !== NATIVE_SOURCE;

  return (
    <article
      {...dragHandle}
      className={cn(
        'group flex flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-sm shadow-chrome',
        item.editable && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <span className="font-medium">{item.key}</span>
        {!item.editable && (
          <Tooltip content="Read-only: reconnect the tracker in Settings → Integrations to edit it here">
            <Lock className="size-3.5" aria-label="Read-only" />
          </Tooltip>
        )}
        <span className="flex-1" />
        {tracker && item.external_url && (
          <a
            href={item.external_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${item.key} in ${item.source}`}
            className="rounded p-0.5 hover:text-foreground"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <ArrowSquareOut className="size-3.5" />
          </a>
        )}
        {item.editable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="tertiary" size="sm" iconOnly aria-label={`Actions for ${item.key}`} className="size-6" onPointerDown={(event) => event.stopPropagation()}>
                <DotsThree />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Move to</DropdownMenuLabel>
              {COLUMNS.filter((column) => column.id !== item.status_category).map((column) => (
                <DropdownMenuItem key={column.id} onSelect={() => onMoveTo(item, column.id)}>
                  {column.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <button type="button" className="text-left font-medium hover:underline focus-visible:underline" onClick={() => onOpen(item)}>
        {item.title}
      </button>
      {(item.status || item.assignee?.name) && (
        <div className="flex items-center gap-2">
          {item.status && <Tag>{item.status}</Tag>}
          <span className="flex-1" />
          {item.assignee?.name && (
            <Tooltip content={item.assignee.name}>
              <Avatar name={item.assignee.name} size="sm" />
            </Tooltip>
          )}
        </div>
      )}
    </article>
  );
}
