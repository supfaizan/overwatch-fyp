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
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from '@phosphor-icons/react/ssr';
import { memo, useState, type ReactNode } from 'react';
import Avatar from '@/shared/components/avatar';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Skeleton from '@/shared/components/skeleton';
import Tag from '@/shared/components/tag';
import { cn } from '@/shared/lib/cn';
import { usePlanned, useSetItemSprint, useStartSprint } from '../hooks';
import { BACKLOG_SECTION, placement, sectionDrop, sortByRank } from '../lib';
import { SPRINT_STATE, STATUS_CATEGORY, type Board, type Sprint, type WorkItem } from '../types';
import CompleteSprintDialog from './complete-sprint-dialog';
import SprintDialog from './sprint-dialog';

type BacklogViewProps = {
  board: Board;
  sprints: Sprint[];
  isAdmin: boolean;
  trackerName: string | null;
  onOpen: (item: WorkItem) => void;
};

const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const span = (sprint: Sprint) =>
  sprint.start_at && sprint.end_at ? `${dateFormat.format(new Date(sprint.start_at))} – ${dateFormat.format(new Date(sprint.end_at))}` : null;

/** Open sprints and the backlog, Jira-style: drag items between them to plan the next sprint. */
export default function BacklogView({ board, sprints, isAdmin, trackerName, onOpen }: BacklogViewProps) {
  const sectionIds = [...sprints.map((sprint) => sprint.id), null];
  const results = usePlanned(board.id, sectionIds);
  const setSprint = useSetItemSprint();
  const start = useStartSprint();
  const [creating, setCreating] = useState(false);
  const [completing, setCompleting] = useState<Sprint | null>(null);
  const [dragging, setDragging] = useState<WorkItem | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (results.some((result) => result.isPending)) return <Skeleton className="h-64 w-full" />;
  const failed = results.find((result) => result.isError);
  if (failed) {
    return (
      <Banner type="error" action={<Button size="sm" onClick={() => results.forEach((result) => void result.refetch())}>Retry</Button>}>
        {failed.error?.message}
      </Banner>
    );
  }

  const sections: Record<string, WorkItem[]> = Object.fromEntries(
    sectionIds.map((id, index) => [id ?? BACKLOG_SECTION, sortByRank(results[index].data?.items ?? [])]),
  );
  const totals: Record<string, number> = Object.fromEntries(
    sectionIds.map((id, index) => [id ?? BACKLOG_SECTION, results[index].data?.total ?? 0]),
  );
  const all = Object.values(sections).flat();
  const active = sprints.find((sprint) => sprint.state === SPRINT_STATE.active);

  const onDragEnd = ({ active: dragged, over }: DragEndEvent) => {
    setDragging(null);
    const item = all.find((candidate) => candidate.id === dragged.id);
    const target = over && item && sectionDrop(sections, item.id, String(over.id));
    if (!item || !target) return;
    const into = sections[target.section].filter((candidate) => candidate.id !== item.id);
    const { rank, ...neighbours } = placement(into, target.index);
    setSprint.mutate({ boardId: board.id, item, to: target.section === BACKLOG_SECTION ? null : target.section, rank, ...neighbours });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active: dragged }) => setDragging(all.find((item) => item.id === dragged.id) ?? null)}
        onDragCancel={() => setDragging(null)}
        onDragEnd={onDragEnd}
      >
        {sprints.map((sprint) => {
          const items = sections[sprint.id];
          const unfinished = items.filter((item) => item.status_category !== STATUS_CATEGORY.done).length;
          return (
            <Section
              key={sprint.id}
              id={sprint.id}
              title={sprint.name}
              detail={[span(sprint), sprint.goal].filter(Boolean).join(' · ') || null}
              badge={sprint.state === SPRINT_STATE.active ? 'Active' : null}
              items={items}
              total={totals[sprint.id]}
              editable={board.editable}
              onOpen={onOpen}
              action={
                isAdmin && sprint.state === SPRINT_STATE.active ? (
                  <Button size="sm" onClick={() => setCompleting(sprint)}>Complete sprint</Button>
                ) : isAdmin && !active ? (
                  <Button size="sm" variant="primary" loading={start.isPending} onClick={() => start.mutate(sprint.id)} disabled={unfinished === 0}>
                    Start sprint
                  </Button>
                ) : null
              }
            />
          );
        })}
        <Section
          id={BACKLOG_SECTION}
          title="Backlog"
          detail="Unfinished work in no sprint"
          items={sections[BACKLOG_SECTION]}
          total={totals[BACKLOG_SECTION]}
          editable={board.editable}
          onOpen={onOpen}
          action={
            board.editable && (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus /> Create sprint
              </Button>
            )
          }
        />
        <DragOverlay>{dragging && <RowBody item={dragging} onOpen={() => {}} />}</DragOverlay>
      </DndContext>

      {creating && <SprintDialog open onOpenChange={setCreating} boardId={board.id} trackerName={trackerName} />}
      {completing && (
        <CompleteSprintDialog
          open
          onOpenChange={(open) => !open && setCompleting(null)}
          sprint={completing}
          others={sprints.filter((sprint) => sprint.id !== completing.id)}
          unfinished={sections[completing.id].filter((item) => item.status_category !== STATUS_CATEGORY.done).length}
        />
      )}
    </div>
  );
}

type SectionProps = {
  id: string;
  title: string;
  detail: string | null;
  badge?: string | null;
  items: WorkItem[];
  /** items in the section, loaded or not; a section loads at most a few hundred */
  total: number;
  editable: boolean;
  action?: ReactNode;
  onOpen: (item: WorkItem) => void;
};

function Section({ id, title, detail, badge, items, total, editable, action, onOpen }: SectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <header className="flex flex-wrap items-center gap-2 px-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        {badge && <Tag>{badge}</Tag>}
        <span className="text-xs text-muted">{total} {total === 1 ? 'item' : 'items'}</span>
        {detail && <span className="truncate text-xs text-muted">{detail}</span>}
        <span className="flex-1" />
        {action}
      </header>
      <SortableContext id={id} items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className={cn('flex min-h-12 flex-col gap-1 rounded-lg bg-fill-hover p-1.5 transition-colors', isOver && 'bg-fill-active')}>
          {items.length === 0 && <li className="list-none px-2 py-2 text-xs text-muted">Drag items here to plan them.</li>}
          {items.map((item) => (
            <Row key={item.id} item={item} editable={editable} onOpen={onOpen} />
          ))}
        </ul>
      </SortableContext>
      {total > items.length && <p className="px-1 text-xs text-muted">Showing the first {items.length} of {total}.</p>}
    </section>
  );
}

function Row({ item, editable, onOpen }: { item: WorkItem; editable: boolean; onOpen: (item: WorkItem) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: !editable });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cn('list-none', isDragging && 'opacity-40')}>
      <RowBody item={item} onOpen={onOpen} attributes={attributes} listeners={listeners} />
    </li>
  );
}

/** One backlog row; memoised for the same reason as the board's cards. */
type RowBodyProps = { item: WorkItem; onOpen: (item: WorkItem) => void; attributes?: DraggableAttributes; listeners?: DraggableSyntheticListeners };

const RowBody = memo(function RowBody({ item, onOpen, attributes, listeners }: RowBodyProps) {
  return (
    <div {...attributes} {...listeners} className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 text-sm">
      <span className="w-20 shrink-0 text-xs font-medium text-muted">{item.key}</span>
      <button type="button" className={cn('min-w-0 flex-1 truncate text-left hover:underline', item.status_category === STATUS_CATEGORY.done && 'text-muted line-through')} onClick={() => onOpen(item)}>
        {item.title}
      </button>
      {item.status && <Tag>{item.status}</Tag>}
      {item.assignee?.name && <Avatar name={item.assignee.name} size="sm" />}
    </div>
  );
});
