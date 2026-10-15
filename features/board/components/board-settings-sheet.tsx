'use client';

import Button from '@/shared/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/dropdown-menu';
import SegmentedButton from '@/shared/components/segmented-button';
import Switch from '@/shared/components/switch';
import { cn } from '@/shared/lib/cn';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DotsSixVertical, X } from '@phosphor-icons/react/ssr';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { useState } from 'react';
import { useColumnSettings } from '../hooks';
import { COLOR_CLASSES, columnColor, hiddenByDefault } from '../lib';
import { type BoardView, GROUP_BY_OPTIONS, type GroupBy } from '../store';
import { type Board, type Column, COLUMN_COLOR, type ColumnColor } from '../types';
import ColumnsWorkflowDialog from './columns-workflow-dialog';

type BoardSettingsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: Board;
  view: BoardView;
  onHiddenChange: (columnId: string, hidden: boolean) => void;
  onGroupByChange: (groupBy: GroupBy) => void;
  /** Admins of a native board edit its columns and workflow; a tracker's board follows the tracker. */
  canEditColumns: boolean;
};

/**
 * The board's view settings, in a panel from the right: grouping and hidden columns are this person's;
 * column order and colors are the board's, for everyone.
 */
export default function BoardSettingsSheet(
  { open, onOpenChange, board, view, onHiddenChange, onGroupByChange, canEditColumns }:
    BoardSettingsSheetProps,
) {
  const settings = useColumnSettings();
  const [editing, setEditing] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = board.columns.map((column) => {
    return column.id;
  });

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }
    const order = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    settings.mutate({ boardId: board.id, column_order: order });
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col gap-6 overflow-y-auto border-l border-border bg-surface p-5 outline-none animate-in slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right">
          <header className="flex items-start gap-3">
            <div className="flex-1">
              <DialogPrimitive.Title className="text-base font-semibold">
                View settings
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-xs text-muted">
                Grouping and hidden columns are just for you. Column order and colors change the
                board for everyone.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="tertiary" size="sm" iconOnly aria-label="Close">
                <X />
              </Button>
            </DialogPrimitive.Close>
          </header>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Group by</h3>
            <SegmentedButton
              size="sm"
              aria-label="Group by"
              value={view.groupBy}
              onValueChange={onGroupByChange}
              options={GROUP_BY_OPTIONS}
            />
          </section>

          <section className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="flex-1 text-sm font-medium">Columns</h3>
              {canEditColumns && (
                <Button
                  size="sm"
                  onClick={() => {
                    return setEditing(true);
                  }}
                >
                  Columns &amp; workflow
                </Button>
              )}
            </div>
            <p className="text-xs text-muted">Drag to reorder. Hidden columns aren’t loaded.</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                <ul className="flex flex-col gap-1">
                  {board.columns.map((column) => {
                    return (
                      <ColumnRow
                        key={column.id}
                        column={column}
                        visible={!(view.hidden[column.id] ?? hiddenByDefault(column))}
                        onVisibleChange={(visible) => {
                          return onHiddenChange(column.id, !visible);
                        }}
                        onColorChange={(color) => {
                          return settings.mutate({
                            boardId: board.id,
                            column_colors: { [column.id]: color },
                          });
                        }}
                      />
                    );
                  })}
                </ul>
              </SortableContext>
            </DndContext>
          </section>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
      {editing && (
        <ColumnsWorkflowDialog
          board={board}
          onClose={() => {
            return setEditing(false);
          }}
        />
      )}
    </DialogPrimitive.Root>
  );
}

type ColumnRowProps = {
  column: Column;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onColorChange: (color: ColumnColor | null) => void;
};

function ColumnRow({ column, visible, onVisibleChange, onColorChange }: ColumnRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });
  const color = columnColor(column);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'flex list-none items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5',
        isDragging && 'opacity-60',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${column.name}`}
        className="cursor-grab rounded p-0.5 text-muted hover:text-foreground active:cursor-grabbing"
      >
        <DotsSixVertical className="size-4" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Color of ${column.name}`}
            className="rounded-full p-1 hover:bg-fill-hover"
          >
            <span className={cn('block size-3 rounded-full', COLOR_CLASSES[color].dot)} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onSelect={() => {
              return onColorChange(null);
            }}
          >
            Default
          </DropdownMenuItem>
          {Object.values(COLUMN_COLOR).map((option) => {
            return (
              <DropdownMenuItem
                key={option}
                onSelect={() => {
                  return onColorChange(option);
                }}
              >
                <span className={cn('size-3 rounded-full', COLOR_CLASSES[option].dot)} />
                <span className="capitalize">{option}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <span className={cn('min-w-0 flex-1 truncate text-sm', !visible && 'text-muted')}>
        {column.name}
      </span>
      <Switch
        checked={visible}
        onCheckedChange={onVisibleChange}
        aria-label={`Show ${column.name}`}
      />
    </li>
  );
}
