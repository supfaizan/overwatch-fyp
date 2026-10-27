'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/dropdown-menu';
import SegmentedButton from '@/shared/components/segmented-button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import Skeleton from '@/shared/components/skeleton';
import Tooltip from '@/shared/components/tooltip';
import { PRODUCT_NAME } from '@/shared/lib/env';
import { JOB_STATUS } from '@/shared/lib/job-status';
import { timeAgo } from '@/shared/lib/time';
import { useSession } from '@/shared/session/store';
import { useCurrentWorkspace } from '@/shared/workspaces/hooks';
import { hasRole } from '@/shared/workspaces/lib';
import { ROLE } from '@/shared/workspaces/types';
import {
  closestCenter,
  closestCorners,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  ArrowsClockwise,
  DotsThree,
  Kanban,
  Plus,
  SlidersHorizontal,
} from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import BacklogView from './components/backlog-view';
import BoardColumn from './components/board-column';
import BoardSettingsSheet from './components/board-settings-sheet';
import ItemDetailsDialog from './components/item-details-dialog';
import SwimlaneBoard from './components/swimlane-board';
import { CardBody } from './components/work-item-card';
import WorkItemDialog from './components/work-item-dialog';
import {
  syncTargetOf,
  useBoardItems,
  useBoards,
  useBoardSync,
  useColumnChoice,
  useColumnSettings,
  useDropHints,
  useMoveWorkItem,
  usePriorities,
  useSprints,
  useSwimlaneItems,
  useTrackers,
  useWorkItemByKey,
} from './hooks';
import {
  BLOCKED_MESSAGE,
  BOARD_PARAM,
  COLOR_CLASSES,
  columnColor,
  columnFromSortId,
  columnSortId,
  dropTarget,
  groupByColumn,
  hiddenByDefault,
  ITEM_PARAM,
  itemLink,
  laneOf,
  moveItem,
  NO_LANE,
  orderLanes,
  parseZoneId,
  placement,
} from './lib';
import { GROUP_BY, GROUP_BY_OPTIONS, type GroupBy, useBoardViews, viewOf } from './store';
import {
  type Board as BoardType,
  BOARD_KIND,
  type Column,
  COLUMN_PROMPT,
  CURRENT_SPRINT,
  NATIVE_SOURCE,
  type Sprint,
  SPRINT_STATE,
  type Tracker,
  type WorkItem,
} from './types';

const VIEW_PARAM = 'view';
const SPRINT_PARAM = 'sprint';
const VIEW = { board: 'board', backlog: 'backlog' } as const;
type View = (typeof VIEW)[keyof typeof VIEW];

const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

/** `?board=<id>`, else the first tracker board, else the Overwatch board. */
function pickBoard(boards: BoardType[], requested: string | null) {
  return boards.find((board) => {
    return board.id === requested;
  })
    ?? boards.find((board) => {
      return board.source !== NATIVE_SOURCE;
    }) ?? boards[0];
}

/** A column drag only lands on columns, a card drag only on cards and column bodies. */
const collisions: CollisionDetection = (args) => {
  const draggingColumn = columnFromSortId(String(args.active.id)) !== null;
  const droppableContainers = args.droppableContainers.filter((container) => {
    return (columnFromSortId(String(container.id)) !== null) === draggingColumn;
  });
  if (draggingColumn) {
    return closestCenter({ ...args, droppableContainers });
  }
  // a column split into status zones takes the drop in the zone under the pointer
  const zones = pointerWithin({
    ...args,
    droppableContainers: droppableContainers.filter((container) => {
      return parseZoneId(String(container.id));
    }),
  });
  return zones.length
    ? zones
    : closestCorners({
      ...args,
      droppableContainers: droppableContainers.filter((container) => {
        return !parseZoneId(String(container.id));
      }),
    });
};

export default function Board() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const boards = useBoards();
  const board = boards.data ? pickBoard(boards.data, searchParams.get(BOARD_PARAM)) : undefined;
  const scrum = board?.kind === BOARD_KIND.scrum;
  const view: View = searchParams.get(VIEW_PARAM) === VIEW.backlog ? VIEW.backlog : VIEW.board;
  const sprint = searchParams.get(SPRINT_PARAM) ?? CURRENT_SPRINT;
  const itemKey = searchParams.get(ITEM_PARAM);

  // this person's view of the board: hidden columns and grouping, kept in the browser
  const userId = useSession((state) => {
    return state.user?.id ?? '';
  });
  const viewKey = `${userId}:${board?.id ?? ''}`;
  const boardView = viewOf(
    useBoardViews((state) => {
      return state.views;
    }),
    viewKey,
  );
  const { setHidden, setGroupBy } = useBoardViews.getState();
  const shownColumns = board
    ? board.columns.filter((column) => {
      return !(boardView.hidden[column.id] ?? hiddenByDefault(column));
    })
    : [];
  const groupBy: GroupBy = boardView.groupBy;

  const sprints = useSprints(board?.id);
  // only the active layout fetches: whole columns, or each swimlane's cells
  const lanesBy = groupBy === GROUP_BY.none ? null : groupBy;
  const items = useBoardItems(board, lanesBy ? [] : shownColumns, sprint);
  const swimlanes = useSwimlaneItems(board, lanesBy ? shownColumns : [], lanesBy, sprint);
  const priorities = usePriorities(board?.id ?? '', groupBy === GROUP_BY.priority);
  const trackers = useTrackers();
  const syncTarget = syncTargetOf(trackers.data, board);
  const boardSync = useBoardSync(board, syncTarget);
  const move = useMoveWorkItem();
  const columnSettings = useColumnSettings();
  const currentRole = useCurrentWorkspace()?.role;
  const [dragging, setDragging] = useState<{ card?: WorkItem; column?: Column } | null>(null);
  const hintFor = useDropHints(board, dragging?.card, shownColumns);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // a fresh key per open, so the new-item form starts empty every time
  const [creating, setCreating] = useState<number | null>(null);
  // the item last opened from a card, kept so its dialog stays put if the card leaves the loaded pages
  const [opened, setOpened] = useState<WorkItem | null>(null);
  // whether the open item's address was pushed here, so closing it goes back instead of adding history
  const pushed = useRef(false);
  // closed, but still in the address until going back lands
  const closedKey = useRef<string | null>(null);

  // the cards are memoised, so their handlers must stay the same between renders; they read the latest board here
  const latest = useRef<
    { boardId: string; visible: WorkItem[]; columns: Column[]; grouped: Record<string, WorkItem[]> }
  >({
    boardId: '',
    visible: [],
    columns: [],
    grouped: {},
  });
  // a history entry per opened item, so Back closes it
  const openItem = useCallback(
    (item: WorkItem) => {
      const params = new URLSearchParams(window.location.search);
      params.set(BOARD_PARAM, latest.current.boardId);
      params.set(ITEM_PARAM, item.key);
      setOpened(item);
      pushed.current = true;
      closedKey.current = null;
      router.push(`${pathname}?${params}`, { scroll: false });
    },
    [router, pathname],
  );
  const linkOf = useCallback(
    (item: WorkItem) => {
      return itemLink(`${window.location.origin}${pathname}`, latest.current.boardId, item.key);
    },
    [pathname],
  );
  // computed on the loaded cards, so the neighbours sent are ones the user actually dropped between
  const moveTo = useCallback(
    (item: WorkItem, columnId: string, index?: number, statusId?: string | null) => {
      const { boardId, visible, columns, grouped } = latest.current;
      const { move: body, rank } = moveItem(
        visible,
        columns,
        item.id,
        columnId,
        index ?? grouped[columnId]?.length ?? 0,
      );
      move.mutate({
        boardId,
        id: item.id,
        move: { ...body, ...(statusId ? { status_id: statusId } : {}) },
        rank,
      });
    },
    [move],
  );
  const sensors = useSensors(
    // a few pixels of travel before a drag starts, so clicks still open the card
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const loading = lanesBy ? swimlanes.isPending : items.isPending;
  // the item in the address: the one just opened, else a loaded card, else looked up (a link to one not loaded)
  const activeKey = itemKey !== closedKey.current ? itemKey : null;
  const loadedItem = activeKey
    ? (opened?.key === activeKey
      ? opened
      : (lanesBy ? swimlanes.items : items.items).find((candidate) => {
        return candidate.key === activeKey;
      }))
    : undefined;
  const linked = useWorkItemByKey(
    board?.id,
    activeKey && !loadedItem && !loading ? activeKey : null,
  );
  const shownItem = activeKey ? (loadedItem ?? linked.data ?? null) : null;
  const missing = Boolean(activeKey && !loadedItem && (linked.data === null || linked.isError));
  useEffect(() => {
    // Back (or Forward) moved off the pushed entry
    if (itemKey) {
      return;
    }
    pushed.current = false;
    closedKey.current = null;
  }, [itemKey]);
  useEffect(() => {
    if (!missing) {
      return;
    }
    toast.error(`${activeKey} isn't on this board.`);
    const params = new URLSearchParams(window.location.search);
    params.delete(ITEM_PARAM);
    router.replace(`${pathname}?${params}`, { scroll: false });
  }, [missing, activeKey, router, pathname]);

  // a tracker board that has never synced has nothing to show until its first sync lands
  const firstSync = Boolean(syncTarget && !syncTarget.last_synced_at && boardSync.syncing);
  if (
    boards.isPending || (board && (loading || sprints.isPending)) || trackers.isPending || firstSync
  ) {
    return (
      <main className="flex h-full gap-4 p-6">
        {[0, 1, 2].map((index) => {
          return <Skeleton key={index} className="h-full w-72 shrink-0" />;
        })}
      </main>
    );
  }
  const itemsError = lanesBy ? swimlanes.error : items.error;
  if (boards.isError || itemsError || sprints.isError || trackers.isError || !board) {
    const error = boards.error ?? itemsError ?? sprints.error ?? trackers.error;
    return (
      <main className="p-6">
        <Banner
          type="error"
          action={
            <Button
              size="sm"
              onClick={() => {
                void boards.refetch();
                (lanesBy ? swimlanes : items).refetch();
                void sprints.refetch();
                void trackers.refetch();
              }}
            >
              Retry
            </Button>
          }
        >
          {error?.message ?? 'No board to show.'}
        </Banner>
      </main>
    );
  }

  const visible = lanesBy ? swimlanes.items : items.items;
  const grouped = groupByColumn(visible, shownColumns);
  latest.current = { boardId: board.id, visible, columns: shownColumns, grouped };
  const hasTrackerBoard = boards.data.some((candidate) => {
    return candidate.source !== NATIVE_SOURCE;
  });
  const boardLabel = (candidate: BoardType) => {
    return candidate.source === NATIVE_SOURCE
      ? PRODUCT_NAME
      : `${trackerName(trackers.data, candidate.source)} · ${candidate.name}`;
  };

  const openSprints = sprints.data ?? [];
  const shownSprint: Sprint | undefined = sprint === CURRENT_SPRINT
    ? openSprints.find((candidate) => {
      return candidate.state === SPRINT_STATE.active;
    })
    : openSprints.find((candidate) => {
      return candidate.id === sprint;
    });
  const isAdmin = hasRole(currentRole, ROLE.admin);
  const name = board.source === NATIVE_SOURCE ? null : trackerName(trackers.data, board.source);
  const anyMore = lanesBy
    ? swimlanes.lanes.length > 0
    : shownColumns.some((column) => {
      return items.columns[column.id]?.hasMore;
    });

  const setParams = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.replace(`${pathname}?${params}`, { scroll: false });
  };
  // a different board has different sprints and items
  const selectBoard = (id: string) => {
    return setParams({ [BOARD_PARAM]: id, [SPRINT_PARAM]: null, [ITEM_PARAM]: null });
  };
  const closeItem = () => {
    closedKey.current = itemKey;
    setOpened(null);
    if (!pushed.current) {
      return setParams({ [ITEM_PARAM]: null });
    }
    pushed.current = false;
    router.back();
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    const columnId = columnFromSortId(String(active.id));
    setDragging(
      columnId
        ? {
          column: shownColumns.find((column) => {
            return column.id === columnId;
          }),
        }
        : {
          card: visible.find((item) => {
            return item.id === active.id;
          }),
        },
    );
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    const columnId = columnFromSortId(String(active.id));
    if (columnId) {
      const overId = over && columnFromSortId(String(over.id));
      if (!overId || overId === columnId) {
        return;
      }
      // the full order, hidden columns included, so hiding one never loses its place
      const ids = board.columns.map((column) => {
        return column.id;
      });
      columnSettings.mutate({
        boardId: board.id,
        column_order: arrayMove(ids, ids.indexOf(columnId), ids.indexOf(overId)),
      });
      return;
    }
    const item = visible.find((candidate) => {
      return candidate.id === active.id;
    });
    if (!item || !over) {
      return;
    }
    const zone = parseZoneId(String(over.id));
    const target = zone
      ? { columnId: zone.columnId, index: grouped[zone.columnId]?.length ?? 0 }
      : dropTarget(visible, shownColumns, item.id, String(over.id));
    if (!target) {
      return;
    }
    const column = shownColumns.find((candidate) => {
      return candidate.id === target.columnId;
    });
    const hint = column && hintFor(column);
    if (hint && !hint.allowed) {
      toast.error(BLOCKED_MESSAGE);
      return;
    }
    moveTo(
      item,
      target.columnId,
      target.index,
      zone?.statusId ?? (hint?.allowed && hint.zones.length === 1 ? hint.zones[0].statusId : null),
    );
  };

  /** A swimlane drop: the card's column and place, and its assignee (or priority) when it changed lane. */
  const onLaneDrop = (item: WorkItem, lane: string, columnId: string, index: number) => {
    if (groupBy === GROUP_BY.none) {
      return;
    }
    const cell = groupByColumn(
      visible.filter((candidate) => {
        return candidate.id !== item.id && laneOf(candidate, groupBy) === lane;
      }),
      shownColumns,
    )[columnId] ?? [];
    const { rank, ...neighbours } = placement(cell, index);
    const value = lane === NO_LANE ? null : lane;
    const changed = laneOf(item, groupBy) !== lane;
    const changes = !changed
      ? undefined
      : groupBy === GROUP_BY.assignee
      ? { assignee_id: value }
      : { priority: value };
    const laneName = swimlanes.lanes.find((candidate) => {
      return candidate.key === lane;
    })?.label ?? null;
    const patch = !changed
      ? undefined
      : groupBy === GROUP_BY.assignee
      ? { assignee: value ? { id: value, name: laneName } : null }
      : { priority: value };
    move.mutate({
      boardId: board.id,
      id: item.id,
      move: { column_id: columnId, ...neighbours },
      rank,
      changes,
      patch,
    });
  };

  return (
    <main className="flex h-full min-h-0 flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start gap-3">
        <div className="flex flex-col items-start gap-1.5">
          <h1 className="text-lg font-bold">Board</h1>
          {scrum && (
            <SegmentedButton
              size="sm"
              aria-label="View"
              value={view}
              onValueChange={(value) => {
                return setParams({ [VIEW_PARAM]: value === VIEW.board ? null : value });
              }}
              options={[{ value: VIEW.board, label: 'Board' }, {
                value: VIEW.backlog,
                label: 'Backlog',
              }]}
            />
          )}
        </div>
        {boards.data.length > 1 && (
          <Select value={board.id} onValueChange={selectBoard}>
            <SelectTrigger aria-label="Board" className="w-56" />
            <SelectContent>
              {boards.data.map((candidate) => {
                return (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {boardLabel(candidate)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
        {scrum && view === VIEW.board && openSprints.length > 0 && (
          <Select
            value={sprint}
            onValueChange={(value) => {
              return setParams({ [SPRINT_PARAM]: value === CURRENT_SPRINT ? null : value });
            }}
          >
            <SelectTrigger aria-label="Sprint" className="w-56" />
            <SelectContent>
              <SelectItem value={CURRENT_SPRINT}>Active sprint</SelectItem>
              {openSprints.map((candidate) => {
                return (
                  <SelectItem key={candidate.id} value={candidate.id}>{candidate.name}</SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
        <span className="flex-1" />
        {name && syncTarget && (
          <span className="flex items-center gap-2">
            {syncTarget.sync_status === JOB_STATUS.failed
              ? (
                <Tooltip content={syncTarget.sync_error ?? 'The last sync failed'}>
                  <span className="text-xs text-warning-strong">Sync failed</span>
                </Tooltip>
              )
              : (
                syncTarget.last_synced_at && (
                  <span className="text-xs text-muted">
                    Synced {timeAgo(syncTarget.last_synced_at)}
                  </span>
                )
              )}
            <Tooltip content={`Sync with ${name}`}>
              <Button
                iconOnly
                aria-label={`Sync with ${name}`}
                loading={boardSync.syncing}
                onClick={boardSync.sync}
              >
                <ArrowsClockwise />
              </Button>
            </Tooltip>
          </span>
        )}
        <Button
          variant="primary"
          onClick={() => {
            return setCreating(Date.now());
          }}
          disabled={!board.editable}
        >
          <Plus /> New item
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button iconOnly aria-label="Board options">
              <DotsThree />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                return setSettingsOpen(true);
              }}
            >
              <SlidersHorizontal /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Group by</DropdownMenuLabel>
            {GROUP_BY_OPTIONS.map((option) => {
              return (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => {
                    return setGroupBy(viewKey, option.value);
                  }}
                >
                  <span className={groupBy === option.value ? 'font-semibold' : undefined}>
                    {option.label}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {!hasTrackerBoard && (
        <Banner
          type="info"
          action={
            <Button size="sm" asChild>
              <Link href="/settings/integrations">Connect a tracker</Link>
            </Button>
          }
        >
          Connect Jira to see its tickets here alongside the items you create here.
        </Banner>
      )}
      <ReconnectNotice board={board} trackers={trackers.data} />
      <ColumnOffer board={board} trackerName={trackerName(trackers.data, board.source)} />
      {scrum && view === VIEW.board && shownSprint && (
        <p className="-mt-2 text-xs text-muted">
          <span className="font-medium text-foreground">{shownSprint.name}</span>
          {shownSprint.start_at && shownSprint.end_at
            && ` · ${dateFormat.format(new Date(shownSprint.start_at))} – ${
              dateFormat.format(new Date(shownSprint.end_at))
            }`}
          {shownSprint.goal && ` · ${shownSprint.goal}`}
        </p>
      )}

      {scrum && view === VIEW.backlog
        ? (
          <BacklogView
            board={board}
            sprints={openSprints}
            isAdmin={isAdmin}
            trackerName={name}
            onOpen={openItem}
          />
        )
        : scrum && !shownSprint
        ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <Kanban className="size-6 text-muted" aria-hidden />
            <p className="max-w-sm text-sm text-muted">
              No sprint is active. Plan one in the backlog, then start it.
            </p>
            <Button
              size="sm"
              onClick={() => {
                return setParams({ [VIEW_PARAM]: VIEW.backlog });
              }}
            >
              Open the backlog
            </Button>
          </div>
        )
        : shownColumns.length === 0
        ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="max-w-sm text-sm text-muted">Every column is hidden.</p>
            <Button
              size="sm"
              onClick={() => {
                return setSettingsOpen(true);
              }}
            >
              Show columns
            </Button>
          </div>
        )
        : visible.length === 0 && !anyMore
        ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <Kanban className="size-6 text-muted" aria-hidden />
            <p className="max-w-sm text-sm text-muted">
              Nothing here yet. Create an item, or connect a tracker to bring its tickets in.
            </p>
          </div>
        )
        : groupBy !== GROUP_BY.none
        ? (
          <SwimlaneBoard
            columns={shownColumns}
            lanes={orderLanes(swimlanes.lanes, groupBy, priorities.data ?? [])}
            items={visible}
            by={groupBy}
            cells={swimlanes.cells}
            onLoadMore={swimlanes.loadMore}
            onOpen={openItem}
            onMoveTo={moveTo}
            linkOf={linkOf}
            onDrop={onLaneDrop}
            board={board}
          />
        )
        : (
          <DndContext
            sensors={sensors}
            collisionDetection={collisions}
            onDragStart={onDragStart}
            onDragCancel={() => {
              return setDragging(null);
            }}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={shownColumns.map((column) => {
                return columnSortId(column.id);
              })}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto">
                {shownColumns.map((column) => {
                  return (
                    <BoardColumn
                      key={column.id}
                      column={column}
                      items={grouped[column.id]}
                      columns={shownColumns}
                      total={items.columns[column.id]?.total ?? grouped[column.id].length}
                      hasMore={items.columns[column.id]?.hasMore ?? false}
                      loadingMore={items.columns[column.id]?.loadingMore ?? false}
                      onLoadMore={items.loadMore}
                      onOpen={openItem}
                      onMoveTo={moveTo}
                      linkOf={linkOf}
                      hint={hintFor(column)}
                    />
                  );
                })}
              </div>
            </SortableContext>
            {/* the pointer is always over the dragged copy, so only a drag shows the grabbing hand */}
            <DragOverlay className="cursor-grabbing">
              {dragging?.card?.column_id && (
                <CardBody
                  item={dragging.card}
                  columns={shownColumns}
                  color={columnColor(
                    shownColumns.find((column) => {
                      return column.id === dragging.card?.column_id;
                    })
                      ?? shownColumns[0],
                  )}
                  onOpen={() => {}}
                  onMoveTo={() => {}}
                  linkOf={() => {
                    return '';
                  }}
                />
              )}
              {dragging?.column && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium shadow-chrome shadow-border-strong">
                  <span
                    aria-hidden
                    className={`size-2 rounded-full ${
                      COLOR_CLASSES[columnColor(dragging.column)].dot
                    }`}
                  />
                  {dragging.column.name}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

      <BoardSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        board={board}
        view={boardView}
        onHiddenChange={(columnId, hidden) => {
          return setHidden(viewKey, columnId, hidden);
        }}
        onGroupByChange={(value) => {
          return setGroupBy(viewKey, value);
        }}
        canEditColumns={isAdmin && board.source === NATIVE_SOURCE}
      />
      {shownItem
        ? (
          <ItemDetailsDialog
            key={shownItem.id}
            open
            onOpenChange={(open) => {
              return !open && closeItem();
            }}
            item={shownItem}
            board={board}
            sprints={openSprints}
            trackerName={name}
            onMove={moveTo}
          />
        )
        : creating
        ? (
          <WorkItemDialog
            key={creating}
            open
            onOpenChange={(open) => {
              return !open && setCreating(null);
            }}
            board={board}
            trackerName={name}
            sprintId={scrum && view === VIEW.board ? (shownSprint?.id ?? null) : null}
          />
        )
        : null}
    </main>
  );
}

function trackerName(trackers: { provider: string; name: string }[], source: string) {
  return trackers.find((tracker) => {
    return tracker.provider === source;
  })?.name ?? source;
}

/** Tells an admin when the tracker's grant is too old to read this board's columns and sprints. */
function ReconnectNotice({ board, trackers }: { board: BoardType; trackers: Tracker[] }) {
  const isAdmin = hasRole(useCurrentWorkspace()?.role, ROLE.admin);
  const tracker = trackers.find((each) => {
    return each.provider === board.source;
  });
  if (!isAdmin || !board.target_key || !tracker?.outdated) {
    return null;
  }

  return (
    <Banner
      type="warning"
      action={
        <Button size="sm" asChild>
          <Link href="/settings/integrations">Reconnect</Link>
        </Button>
      }
    >
      Reconnect {tracker.name} to import its columns and sprints for {board.name}.
    </Banner>
  );
}

/** Asks an admin, once per set of tracker columns, whether this board should use them. */
function ColumnOffer({ board, trackerName }: { board: BoardType; trackerName: string }) {
  const isAdmin = hasRole(useCurrentWorkspace()?.role, ROLE.admin);
  const choose = useColumnChoice();
  const offered = board.column_prompt.columns;
  if (!isAdmin || board.column_prompt.status !== COLUMN_PROMPT.pending) {
    return null;
  }

  return (
    <Banner
      type="info"
      action={
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              return choose.mutate({ boardId: board.id, tracker: false });
            }}
            disabled={choose.isPending}
          >
            Keep To do / In progress / Done
          </Button>
          <Button
            size="sm"
            variant="primary"
            loading={choose.isPending}
            onClick={() => {
              return choose.mutate({ boardId: board.id, tracker: true });
            }}
          >
            Use {trackerName}’s columns
          </Button>
        </div>
      }
    >
      {trackerName} has {offered.length} columns for {board.name}{' '}
      ({offered.join(', ')}). Use the same columns here, so tickets sit where they do in{' '}
      {trackerName}?
    </Banner>
  );
}
