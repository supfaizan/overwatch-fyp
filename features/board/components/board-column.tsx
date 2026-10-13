'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef } from 'react';
import Spinner from '@/shared/components/spinner';
import { cn } from '@/shared/lib/cn';
import { COLOR_CLASSES, columnColor, columnSortId } from '../lib';
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
  onMoveTo: (item: WorkItem, columnId: string) => void;
};

/** A board column, about four cards tall: drag its header to reorder columns; its cards load more as it's scrolled. */
export default function BoardColumn({ column, items, columns, total, hasMore, loadingMore, onLoadMore, onOpen, onMoveTo }: BoardColumnProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: column.id });
  const sortable = useSortable({ id: columnSortId(column.id), data: { type: 'column' } });
  const list = useRef<HTMLUListElement | null>(null);
  const sentinel = useRef<HTMLLIElement>(null);
  const color = columnColor(column);

  // the next page loads as the bottom comes into view; rebuilt after each load, so a short page loads another
  useEffect(() => {
    if (!hasMore || loadingMore || !sentinel.current) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && onLoadMore(column.id), {
      root: list.current,
      rootMargin: '0px 0px 200px 0px',
    });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, items.length, column.id, onLoadMore]);

  return (
    <section
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Translate.toString(sortable.transform), transition: sortable.transition }}
      aria-label={column.name}
      className={cn('flex min-h-0 min-w-72 flex-1 basis-0 flex-col gap-2', sortable.isDragging && 'opacity-40')}
    >
      <h2 {...sortable.attributes} {...sortable.listeners} className="flex items-center gap-2 rounded px-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary">
        <span aria-hidden className={cn('size-2 rounded-full', COLOR_CLASSES[color].dot)} />
        {column.name}
        <span className="text-xs text-muted">{total}</span>
      </h2>
      <SortableContext id={column.id} items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul
          ref={(node) => {
            setDropRef(node);
            list.current = node;
          }}
          className={cn('flex max-h-176 min-h-24 flex-col gap-2 overflow-y-auto rounded-lg bg-fill-hover p-2 transition-colors', isOver && 'bg-fill-active')}
        >
          {items.map((item) => (
            <WorkItemCard key={item.id} item={item} columns={columns} color={color} onOpen={onOpen} onMoveTo={onMoveTo} />
          ))}
          {hasMore && (
            <li ref={sentinel} className="flex list-none justify-center py-2" aria-live="polite">
              {loadingMore && <Spinner className="size-4 text-muted" />}
            </li>
          )}
        </ul>
      </SortableContext>
    </section>
  );
}
