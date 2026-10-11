'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/shared/lib/cn';
import type { StatusCategory, WorkItem } from '../types';
import WorkItemCard from './work-item-card';

type BoardColumnProps = {
  id: StatusCategory;
  title: string;
  items: WorkItem[];
  onOpen: (item: WorkItem) => void;
  onMoveTo: (item: WorkItem, category: StatusCategory) => void;
};

export default function BoardColumn({ id, title, items, onOpen, onMoveTo }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section aria-label={title} className="flex min-h-0 w-72 shrink-0 flex-col gap-2 md:w-auto md:flex-1">
      <h2 className="flex items-center gap-2 px-1 text-sm font-medium">
        {title}
        <span className="text-xs text-muted">{items.length}</span>
      </h2>
      <SortableContext id={id} items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={cn(
            'flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto rounded-lg bg-fill-hover p-2 transition-colors',
            isOver && 'bg-fill-active',
          )}
        >
          {items.map((item) => (
            <WorkItemCard key={item.id} item={item} onOpen={onOpen} onMoveTo={onMoveTo} />
          ))}
        </ul>
      </SortableContext>
    </section>
  );
}
