'use client';

import Spinner from '@/shared/components/spinner';
import { cn } from '@/shared/lib/cn';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lock } from '@phosphor-icons/react/ssr';
import { useEffect, useRef } from 'react';
import { useCardOver } from '../hooks';
import {
  BLOCKED_MESSAGE,
  COLOR_CLASSES,
  columnColor,
  columnSortId,
  type DropHint,
  zoneId,
} from '../lib';
import type { Column, WorkItem } from '../types';
import WorkItemCard from './work-item-card';

type BoardColumnProps = {
  column: Column;
  items: WorkItem[];
  /** every column of the board, for the cards' "Move to" menu */
  columns: Column[];
  /** cards in the column, loaded or not */
  total: number;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: (columnId: string) => void;
  onOpen: (item: WorkItem) => void;
  onMoveTo: (item: WorkItem, columnId: string, index?: number, statusId?: string | null) => void;
  /** The address that opens the item, for "Copy link". */
  linkOf: (item: WorkItem) => string;
  /** While a card is dragged: where it may land in this column, or that it can't. */
  hint?: DropHint;
};

/** A board column, about four cards tall: drag its header to reorder columns; its cards load more as it's scrolled. */
export default function BoardColumn(
  {
    column,
    items,
    columns,
    total,
    hasMore,
    loadingMore,
    onLoadMore,
    onOpen,
    onMoveTo,
    linkOf,
    hint,
  }: BoardColumnProps,
) {
  const { setNodeRef: setDropRef } = useDroppable({ id: column.id });
  const isOver = useCardOver(column.id) && hint?.allowed !== false;
  const sortable = useSortable({ id: columnSortId(column.id), data: { type: 'column' } });
  const list = useRef<HTMLUListElement | null>(null);
  const sentinel = useRef<HTMLLIElement>(null);
  const color = columnColor(column);

  // the next page loads as the bottom comes into view; rebuilt after each load, so a short page loads another
  useEffect(() => {
    if (!hasMore || loadingMore || !sentinel.current) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        return entry.isIntersecting && onLoadMore(column.id);
      },
      {
        root: list.current,
        rootMargin: '0px 0px 200px 0px',
      },
    );
    observer.observe(sentinel.current);
    return () => {
      return observer.disconnect();
    };
  }, [hasMore, loadingMore, items.length, column.id, onLoadMore]);

  return (
    <section
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Translate.toString(sortable.transform),
        transition: sortable.transition,
      }}
      aria-label={column.name}
      className={cn(
        'flex min-h-0 w-72 shrink-0 flex-col gap-2',
        sortable.isDragging && 'opacity-40',
      )}
    >
      <h2
        {...sortable.attributes}
        {...sortable.listeners}
        className="flex items-center gap-2 rounded px-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span aria-hidden className={cn('size-2 rounded-full', COLOR_CLASSES[color].dot)} />
        {column.name}
        <span className="text-xs text-muted">{total}</span>
      </h2>
      <SortableContext
        id={column.id}
        items={items.map((item) => {
          return item.id;
        })}
        strategy={verticalListSortingStrategy}
      >
        <div className="relative flex min-h-0 flex-col">
          {hint?.allowed && hint.zones.length === 1 && (
            <ZoneLabel zone={hint.zones[0]} className="mb-2" />
          )}
          <ul
            ref={(node) => {
              setDropRef(node);
              list.current = node;
            }}
            className={cn(
              'flex max-h-176 min-h-24 flex-col gap-2 overflow-y-auto rounded-lg bg-fill-hover p-2 transition-colors',
              isOver && 'bg-fill-active ring-2 ring-primary',
              hint?.allowed === false && 'opacity-40',
            )}
          >
            {items.map((item) => {
              return (
                <WorkItemCard
                  key={item.id}
                  item={item}
                  columns={columns}
                  color={color}
                  onOpen={onOpen}
                  onMoveTo={onMoveTo}
                  linkOf={linkOf}
                />
              );
            })}
            {hasMore && (
              <li ref={sentinel} className="flex list-none justify-center py-2" aria-live="polite">
                {loadingMore && <Spinner className="size-4 text-muted" />}
              </li>
            )}
          </ul>
          {hint && !hint.allowed && <Blocked />}
          {hint?.allowed && hint.zones.length > 1 && (
            // a column it can enter in several statuses: one landing spot each, as Jira shows them
            <div className="absolute inset-0 flex flex-col gap-2 rounded-lg bg-background/90 p-2">
              {hint.zones.map((zone) => {
                return (
                  <DropZone key={zone.statusId ?? zone.label} columnId={column.id} zone={zone} />
                );
              })}
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
}

type Zone = Extract<DropHint, { allowed: true }>['zones'][number];

/** Where a drop here takes the card: "In Review → In Progress", and the move's name when it's different. */
function ZoneLabel({ zone, className }: { zone: Zone; className?: string }) {
  return (
    <p
      className={cn(
        'rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs font-medium text-foreground',
        className,
      )}
    >
      {zone.label}
      {zone.detail && <span className="block font-normal text-muted">{zone.detail}</span>}
    </p>
  );
}

/** One of several statuses a column can take the card into, each its own drop target. */
function DropZone({ columnId, zone }: { columnId: string; zone: Zone }) {
  const { setNodeRef, isOver } = useDroppable({ id: zoneId(columnId, zone.statusId) });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-border p-2 transition-colors',
        isOver && 'border-primary bg-primary/10',
      )}
    >
      <ZoneLabel zone={zone} className="border-0 bg-transparent text-center" />
    </div>
  );
}

/** A column the card can't go to, and why, in Jira's words. */
function Blocked() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-lg bg-background/80 p-4 text-center">
      <Lock aria-hidden className="size-5 text-muted" />
      <p className="text-sm font-semibold">Can&apos;t move here</p>
      <p className="text-xs text-muted">{BLOCKED_MESSAGE}</p>
    </div>
  );
}
