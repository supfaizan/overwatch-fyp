'use client';

import Avatar from '@/shared/components/avatar';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Skeleton from '@/shared/components/skeleton';
import Tag from '@/shared/components/tag';
import { cn } from '@/shared/lib/cn';
import { useWorkItemTypes } from '@/shared/work-item-types/hooks';
import TypeIcon, { typeOf } from '@/shared/work-item-types/type-icon';
import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CaretRight, Plus } from '@phosphor-icons/react/ssr';
import { memo, type ReactNode, useState } from 'react';
import { usePlanned, useSetItemSprint, useStartSprint } from '../hooks';
import { BACKLOG_SECTION, placement, sectionDrop, sortByRank } from '../lib';
import { type Board, type Sprint, SPRINT_STATE, STATUS_CATEGORY, type WorkItem } from '../types';
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
const span = (sprint: Sprint) => {
  return sprint.start_at && sprint.end_at
    ? `${dateFormat.format(new Date(sprint.start_at))} – ${
      dateFormat.format(new Date(sprint.end_at))
    }`
    : null;
};

/** Open sprints and the backlog, Jira-style: drag items between them to plan the next sprint. */
export default function BacklogView(
  { board, sprints, isAdmin, trackerName, onOpen }: BacklogViewProps,
) {
  const sectionIds = [
    ...sprints.map((sprint) => {
      return sprint.id;
    }),
    null,
  ];
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

  if (
    results.some((result) => {
      return result.isPending;
    })
  ) {
    return <Skeleton className="h-64 w-full" />;
  }
  const failed = results.find((result) => {
    return result.isError;
  });
  if (failed) {
    return (
      <Banner
        type="error"
        action={
          <Button
            size="sm"
            onClick={() => {
              return results.forEach((result) => {
                return void result.refetch();
              });
            }}
          >
            Retry
          </Button>
        }
      >
        {failed.error?.message}
      </Banner>
    );
  }

  const sections: Record<string, WorkItem[]> = Object.fromEntries(
    sectionIds.map((
      id,
      index,
    ) => {
      return [id ?? BACKLOG_SECTION, sortByRank(results[index].data?.items ?? [])];
    }),
  );
  const totals: Record<string, number> = Object.fromEntries(
    sectionIds.map((id, index) => {
      return [id ?? BACKLOG_SECTION, results[index].data?.total ?? 0];
    }),
  );
  const all = Object.values(sections).flat();
  const active = sprints.find((sprint) => {
    return sprint.state === SPRINT_STATE.active;
  });

  const onDragEnd = ({ active: dragged, over }: DragEndEvent) => {
    setDragging(null);
    const item = all.find((candidate) => {
      return candidate.id === dragged.id;
    });
    const target = over && item && sectionDrop(sections, item.id, String(over.id));
    if (!item || !target) {
      return;
    }
    const into = sections[target.section].filter((candidate) => {
      return candidate.id !== item.id;
    });
    const { rank, ...neighbours } = placement(into, target.index);
    setSprint.mutate({
      boardId: board.id,
      item,
      to: target.section === BACKLOG_SECTION ? null : target.section,
      rank,
      ...neighbours,
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active: dragged }) => {
          return setDragging(
            all.find((item) => {
              return item.id === dragged.id;
            }) ?? null,
          );
        }}
        onDragCancel={() => {
          return setDragging(null);
        }}
        onDragEnd={onDragEnd}
      >
        {sprints.map((sprint) => {
          const items = sections[sprint.id];
          const unfinished = items.filter((item) => {
            return item.status_category !== STATUS_CATEGORY.done;
          }).length;
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
              action={isAdmin && sprint.state === SPRINT_STATE.active
                ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      return setCompleting(sprint);
                    }}
                  >
                    Complete sprint
                  </Button>
                )
                : isAdmin && !active
                ? (
                  <Button
                    size="sm"
                    variant="primary"
                    loading={start.isPending}
                    onClick={() => {
                      return start.mutate(sprint.id);
                    }}
                    disabled={unfinished === 0}
                  >
                    Start sprint
                  </Button>
                )
                : null}
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
          action={board.editable && (
            <Button
              size="sm"
              onClick={() => {
                return setCreating(true);
              }}
            >
              <Plus /> Create sprint
            </Button>
          )}
        />
        <DragOverlay>{dragging && <RowBody item={dragging} onOpen={() => {}} />}</DragOverlay>
      </DndContext>

      {creating && (
        <SprintDialog
          open
          onOpenChange={setCreating}
          boardId={board.id}
          trackerName={trackerName}
        />
      )}
      {completing && (
        <CompleteSprintDialog
          open
          onOpenChange={(open) => {
            return !open && setCompleting(null);
          }}
          sprint={completing}
          others={sprints.filter((sprint) => {
            return sprint.id !== completing.id;
          })}
          unfinished={sections[completing.id].filter((item) => {
            return item.status_category !== STATUS_CATEGORY.done;
          }).length}
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

/**
 * A sprint or the backlog: collapsible, with its done items folded away at the bottom (Jira keeps them
 * in the active sprint until it's completed, so they're there, just out of the way).
 */
function Section(
  { id, title, detail, badge, items, total, editable, action, onOpen }: SectionProps,
) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [open, setOpen] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const doneItems = items.filter((item) => {
    return item.status_category === STATUS_CATEGORY.done;
  });
  const shown = showDone
    ? items
    : items.filter((item) => {
      return item.status_category !== STATUS_CATEGORY.done;
    });

  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <header className="flex flex-wrap items-center gap-2 px-1">
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          onClick={() => {
            return setOpen((value) => {
              return !value;
            });
          }}
          className="flex size-5 cursor-pointer items-center justify-center rounded text-muted hover:text-foreground"
        >
          <CaretRight
            aria-hidden
            className={cn('size-3 transition-transform', open && 'rotate-90')}
          />
        </button>
        <h2 className="text-sm font-semibold">{title}</h2>
        {badge && <Tag>{badge}</Tag>}
        <span className="text-xs text-muted">{total} {total === 1 ? 'item' : 'items'}</span>
        {detail && <span className="truncate text-xs text-muted">{detail}</span>}
        <span className="flex-1" />
        {action}
      </header>
      {open && (
        <SortableContext
          id={id}
          items={shown.map((item) => {
            return item.id;
          })}
          strategy={verticalListSortingStrategy}
        >
          <ul
            ref={setNodeRef}
            className={cn(
              'flex min-h-12 flex-col gap-1 rounded-lg bg-fill-hover p-1.5 transition-colors',
              isOver && 'bg-fill-active',
            )}
          >
            {shown.length === 0 && (
              <li className="list-none px-2 py-2 text-xs text-muted">
                Drag items here to plan them.
              </li>
            )}
            {shown.map((item) => {
              return <Row key={item.id} item={item} editable={editable} onOpen={onOpen} />;
            })}
            {doneItems.length > 0 && (
              <li className="list-none">
                <button
                  type="button"
                  onClick={() => {
                    return setShowDone((value) => {
                      return !value;
                    });
                  }}
                  className="cursor-pointer px-2 py-1 text-xs text-muted hover:text-foreground"
                >
                  {showDone
                    ? 'Hide done items'
                    : `${doneItems.length} done ${doneItems.length === 1 ? 'item' : 'items'}`}
                </button>
              </li>
            )}
          </ul>
        </SortableContext>
      )}
      {open && total > items.length && (
        <p className="px-1 text-xs text-muted">Showing the first {items.length} of {total}.</p>
      )}
    </section>
  );
}

function Row(
  { item, editable, onOpen }: {
    item: WorkItem;
    editable: boolean;
    onOpen: (item: WorkItem) => void;
  },
) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !editable,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('list-none', isDragging && 'opacity-40')}
    >
      <RowBody item={item} onOpen={onOpen} attributes={attributes} listeners={listeners} />
    </li>
  );
}

/** One backlog row; memoised for the same reason as the board's cards. */
type RowBodyProps = {
  item: WorkItem;
  onOpen: (item: WorkItem) => void;
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
};

const RowBody = memo(function RowBody({ item, onOpen, attributes, listeners }: RowBodyProps) {
  const type = typeOf(useWorkItemTypes().data, item.type_id);
  return (
    <div
      {...attributes}
      {...listeners}
      className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 text-sm"
    >
      {type ? <TypeIcon type={type} /> : <span aria-hidden className="size-4 shrink-0" />}
      <span className="w-20 shrink-0 text-xs font-medium text-muted">{item.key}</span>
      <button
        type="button"
        className={cn(
          'min-w-0 flex-1 truncate text-left hover:underline',
          item.status_category === STATUS_CATEGORY.done && 'text-muted line-through',
        )}
        onClick={() => {
          return onOpen(item);
        }}
      >
        {item.title}
      </button>
      {item.status && <Tag>{item.status}</Tag>}
      {item.assignee?.name && <Avatar name={item.assignee.name} size="sm" />}
    </div>
  );
});
