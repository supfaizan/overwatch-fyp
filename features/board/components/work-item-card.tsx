'use client';

import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowSquareOut, DotsThree, Lock } from '@phosphor-icons/react/ssr';
import { memo } from 'react';
import Avatar from '@/shared/components/avatar';
import Button from '@/shared/components/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/shared/components/dropdown-menu';
import Tag from '@/shared/components/tag';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import { COLOR_CLASSES } from '../lib';
import { COLUMN_COLOR, NATIVE_SOURCE, type Column, type ColumnColor, type WorkItem } from '../types';
import PriorityIcon from './priority-icon';

type WorkItemCardProps = {
  item: WorkItem;
  columns: Column[];
  /** its column's color, for the card's bottom edge */
  color?: ColumnColor;
  onOpen: (item: WorkItem) => void;
  /** Keyboard- and screen-reader-friendly alternative to dragging. */
  onMoveTo: (item: WorkItem, columnId: string) => void;
};

export default function WorkItemCard({ item, columns, color, onOpen, onMoveTo }: WorkItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !item.editable });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('list-none', isDragging && 'opacity-40')}
    >
      <CardBody item={item} columns={columns} color={color} onOpen={onOpen} onMoveTo={onMoveTo} attributes={attributes} listeners={listeners} />
    </li>
  );
}

type CardBodyProps = WorkItemCardProps & { attributes?: DraggableAttributes; listeners?: DraggableSyntheticListeners };

/**
 * The card itself, also rendered in the drag overlay. Memoised: every sortable re-renders on each
 * pointer move of a drag, and with hundreds of cards that would stall the drag itself.
 */
export const CardBody = memo(function CardBody({ item, columns, color = COLUMN_COLOR.gray, onOpen, onMoveTo, attributes, listeners }: CardBodyProps) {
  const tracker = item.source !== NATIVE_SOURCE;

  return (
    // the whole card opens it; a drag only starts after a few pixels of travel, so a click stays a click
    <article
      {...attributes}
      {...listeners}
      onClick={() => onOpen(item)}
      className={cn('group flex cursor-pointer flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-sm shadow-chrome', COLOR_CLASSES[color].edge)}
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
            onClick={(event) => event.stopPropagation()}
          >
            <ArrowSquareOut className="size-3.5" />
          </a>
        )}
        {item.editable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="tertiary" size="sm" iconOnly aria-label={`Actions for ${item.key}`} className="size-6" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
                <DotsThree />
              </Button>
            </DropdownMenuTrigger>
            {/* React events bubble through portals: a pick here mustn't also open the card */}
            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
              <DropdownMenuLabel>Move to</DropdownMenuLabel>
              {columns.filter((column) => column.id !== item.column_id).map((column) => (
                <DropdownMenuItem key={column.id} onSelect={() => onMoveTo(item, column.id)}>
                  {column.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {/* a real button for keyboards: Enter on it clicks, and the click reaches the card */}
      <button type="button" className="text-left font-medium hover:underline focus-visible:underline">
        {item.title}
      </button>
      {(item.status || item.priority || item.assignee?.name) && (
        <div className="flex items-center gap-2">
          {item.priority && (
            <Tooltip content={`${item.priority} priority`}>
              <span className="inline-flex"><PriorityIcon priority={item.priority} /></span>
            </Tooltip>
          )}
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
});
