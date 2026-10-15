'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CaretDown, CaretRight, Lock } from '@phosphor-icons/react/ssr';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import Spinner from '@/shared/components/spinner';
import { cn } from '@/shared/lib/cn';
import { useCardOver, useDropHints } from '../hooks';
import { BLOCKED_MESSAGE, COLOR_CLASSES, type DropHint, cellId, columnColor, groupByColumn, laneDropTarget, laneOf, type Lane } from '../lib';
import type { Board, Column, ColumnColor, WorkItem } from '../types';
import WorkItemCard, { CardBody } from './work-item-card';

type CellState = { hasMore: boolean; loadingMore: boolean };

type SwimlaneBoardProps = {
  columns: Column[];
  /** in board order, with their totals */
  lanes: Lane[];
  /** every loaded card, of every lane */
  items: WorkItem[];
  by: 'assignee' | 'priority';
  /** per cell (see `cellId`): whether more cards can load, and whether some are loading */
  cells: Record<string, CellState>;
  onLoadMore: (cell: string) => void;
  onOpen: (item: WorkItem) => void;
  onMoveTo: (item: WorkItem, columnId: string) => void;
  /** a card dropped at `index` of a lane's column; a different lane means a different assignee (or priority) */
  onDrop: (item: WorkItem, lane: string, columnId: string, index: number) => void;
  /** the board, for where a dragged card may go */
  board: Board;
};

/** The board in rows, Jira-style: one lane per assignee or priority, the columns across. */
export default function SwimlaneBoard({ columns, lanes, items, by, cells, onLoadMore, onOpen, onMoveTo, onDrop, board }: SwimlaneBoardProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dragging, setDragging] = useState<WorkItem | null>(null);
  const hintFor = useDropHints(board, dragging, columns);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const colors = Object.fromEntries(columns.map((column) => [column.id, columnColor(column)]));
  // one grid for header and lanes, so every lane's cells line up under their column
  const grid = { gridTemplateColumns: `repeat(${columns.length}, minmax(18rem, 1fr))` };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    const item = items.find((candidate) => candidate.id === active.id);
    const target = over && item && laneDropTarget(items, columns, by, item.id, String(over.id));
    if (!item || !target) return;
    const column = columns.find((candidate) => candidate.id === target.columnId);
    if (column && hintFor(column)?.allowed === false) {
      toast.error(BLOCKED_MESSAGE);
      return;
    }
    onDrop(item, target.lane, target.columnId, target.index);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setDragging(items.find((item) => item.id === active.id) ?? null)}
      onDragCancel={() => setDragging(null)}
      onDragEnd={onDragEnd}
    >
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="sticky top-0 z-10 grid gap-4 bg-background pb-2" style={grid}>
          {columns.map((column) => (
            <h2 key={column.id} className="flex flex-col gap-1 px-1 text-sm font-medium">
              <span className="flex items-center gap-2">
                <span aria-hidden className={cn('size-2 rounded-full', COLOR_CLASSES[colors[column.id]].dot)} />
                {column.name}
              </span>
              <HintLabel hint={hintFor(column)} />
            </h2>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {lanes.map((lane) => {
            // cards are placed by what they say now, so a reassigned card shows in its new lane at once
            const cellsOfLane = groupByColumn(items.filter((item) => laneOf(item, by) === lane.key), columns);
            const open = !collapsed[lane.key];
            return (
              <section key={lane.key} aria-label={lane.label} className="flex flex-col gap-2">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setCollapsed((state) => ({ ...state, [lane.key]: open }))}
                  className="flex items-center gap-2 self-start rounded px-1 text-sm font-semibold hover:bg-fill-hover"
                >
                  {open ? <CaretDown className="size-3.5" /> : <CaretRight className="size-3.5" />}
                  {lane.label}
                  <span className="text-xs font-normal text-muted">{lane.total}</span>
                </button>
                {open && (
                  <div className="grid gap-4" style={grid}>
                    {columns.map((column) => {
                      const id = cellId(lane.key, column.id);
                      return (
                        <Cell
                          key={column.id}
                          id={id}
                          hasMore={cells[id]?.hasMore ?? false}
                          loadingMore={cells[id]?.loadingMore ?? false}
                          onLoadMore={onLoadMore}
                          items={cellsOfLane[column.id]}
                          columns={columns}
                          color={colors[column.id]}
                          onOpen={onOpen}
                          onMoveTo={onMoveTo}
                          blocked={hintFor(column)?.allowed === false}
                        />
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
      <DragOverlay className="cursor-grabbing">
        {dragging && dragging.column_id && (
          <CardBody item={dragging} columns={columns} color={colors[dragging.column_id]} onOpen={() => {}} onMoveTo={() => {}} />
        )}
      </DragOverlay>
    </DndContext>
  );
}

type CellProps = {
  id: string;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: (cell: string) => void;
  items: WorkItem[];
  columns: Column[];
  color: ColumnColor;
  onOpen: (item: WorkItem) => void;
  onMoveTo: (item: WorkItem, columnId: string) => void;
  /** a card being dragged can't go to this column */
  blocked: boolean;
};

/** A column's hint while a card is dragged: where it lands ("In Review → In Progress"), or that it can't. */
function HintLabel({ hint }: { hint: DropHint | undefined }) {
  if (!hint) return null;
  if (!hint.allowed) return <span className="flex items-center gap-1 text-xs font-normal text-muted"><Lock aria-hidden className="size-3" />Can&apos;t move here</span>;
  return <span className="text-xs font-normal text-primary">{hint.zones.map((zone) => zone.label).join(' · ')}</span>;
}

/** One lane's cards in one column: its own first batch, about four cards tall, loading more as it's scrolled. */
function Cell({ id, hasMore, loadingMore, onLoadMore, items, columns, color, onOpen, onMoveTo, blocked }: CellProps) {
  const { setNodeRef } = useDroppable({ id });
  const isOver = useCardOver(id) && !blocked;
  const list = useRef<HTMLUListElement | null>(null);
  const sentinel = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!hasMore || loadingMore || !sentinel.current) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && onLoadMore(id), { root: list.current, rootMargin: '0px 0px 120px 0px' });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, items.length, id, onLoadMore]);

  return (
    <SortableContext id={id} items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
      <ul
        ref={(node) => {
          setNodeRef(node);
          list.current = node;
        }}
        className={cn('flex max-h-176 min-h-16 flex-col gap-2 overflow-y-auto rounded-lg bg-fill-hover p-2 transition-colors', isOver && 'bg-fill-active ring-2 ring-primary', blocked && 'opacity-40')}
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
  );
}
