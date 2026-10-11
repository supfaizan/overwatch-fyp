'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Kanban, Plus } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { useState } from 'react';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import SegmentedButton from '@/shared/components/segmented-button';
import Skeleton from '@/shared/components/skeleton';
import { CONNECTION_STATUS } from '@/shared/connections/constants';
import { COLUMN_LIMIT } from './api';
import BoardColumn from './components/board-column';
import { CardBody } from './components/work-item-card';
import WorkItemDialog from './components/work-item-dialog';
import { useMoveWorkItem, useTrackers, useWorkItems } from './hooks';
import { COLUMNS, dropTarget, groupByColumn, moveItem } from './lib';
import { NATIVE_SOURCE, type StatusCategory, type WorkItem } from './types';

const ALL = 'all';

export default function Board() {
  const items = useWorkItems();
  const trackers = useTrackers();
  const move = useMoveWorkItem();
  const [source, setSource] = useState(ALL);
  const [dragging, setDragging] = useState<WorkItem | null>(null);
  // a fresh key per open, so the dialog's form starts from the item every time
  const [dialog, setDialog] = useState<{ key: number; item?: WorkItem } | null>(null);
  const sensors = useSensors(
    // a few pixels of travel before a drag starts, so clicks still open the card
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (items.isPending || trackers.isPending) {
    return (
      <main className="flex h-full gap-4 p-6">
        {COLUMNS.map((column) => <Skeleton key={column.id} className="h-full flex-1" />)}
      </main>
    );
  }
  if (items.isError || trackers.isError) {
    const error = items.error ?? trackers.error;
    return (
      <main className="p-6">
        <Banner type="error" action={<Button size="sm" onClick={() => { void items.refetch(); void trackers.refetch(); }}>Retry</Button>}>
          {error?.message}
        </Banner>
      </main>
    );
  }

  const connected = trackers.data.filter((tracker) => tracker.status !== CONNECTION_STATUS.disconnected);
  const visible = source === ALL ? items.data : items.data.filter((item) => item.source === source);
  const columns = groupByColumn(visible);
  const openDialog = (item?: WorkItem) => setDialog({ key: Date.now(), item });

  // computed on the visible cards, so the neighbours sent are ones the user actually dropped between
  const moveTo = (item: WorkItem, category: StatusCategory, index = columns[category].length) => {
    const { move: body, rank } = moveItem(visible, item.id, category, index);
    move.mutate({ id: item.id, move: body, rank });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    const item = visible.find((candidate) => candidate.id === active.id);
    const target = over && item && dropTarget(visible, item.id, String(over.id));
    if (item && target) moveTo(item, target.category, target.index);
  };

  return (
    <main className="flex h-full min-h-0 flex-col gap-4 p-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-bold">Board</h1>
        {connected.length > 0 && (
          <SegmentedButton
            aria-label="Show items from"
            value={source}
            onValueChange={setSource}
            options={[{ value: ALL, label: 'All' }, ...connected.map((t) => ({ value: t.provider, label: t.name })), { value: NATIVE_SOURCE, label: 'Overwatch' }]}
          />
        )}
        <span className="flex-1" />
        <Button variant="primary" onClick={() => openDialog()}>
          <Plus /> New item
        </Button>
      </header>

      {connected.length === 0 && (
        <Banner
          type="info"
          action={<Button size="sm" asChild><Link href="/settings/integrations">Connect a tracker</Link></Button>}
        >
          Connect Jira to see its tickets here alongside the items you create in Overwatch.
        </Banner>
      )}
      {COLUMNS.some((column) => columns[column.id].length >= COLUMN_LIMIT) && (
        <p className="text-xs text-muted">Long columns show their latest {COLUMN_LIMIT} items.</p>
      )}

      {items.data.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <Kanban className="size-6 text-muted" aria-hidden />
          <p className="max-w-sm text-sm text-muted">Nothing here yet. Create an item, or connect a tracker to bring its tickets in.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={({ active }) => setDragging(visible.find((item) => item.id === active.id) ?? null)}
          onDragCancel={() => setDragging(null)}
          onDragEnd={onDragEnd}
        >
          <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto">
            {COLUMNS.map((column) => (
              <BoardColumn key={column.id} {...column} items={columns[column.id]} onOpen={openDialog} onMoveTo={moveTo} />
            ))}
          </div>
          <DragOverlay>
            {dragging && <CardBody item={dragging} onOpen={() => {}} onMoveTo={() => {}} />}
          </DragOverlay>
        </DndContext>
      )}

      {dialog && (
        <WorkItemDialog
          key={dialog.key}
          open
          onOpenChange={(open) => !open && setDialog(null)}
          item={dialog.item}
          trackers={trackers.data}
        />
      )}
    </main>
  );
}
