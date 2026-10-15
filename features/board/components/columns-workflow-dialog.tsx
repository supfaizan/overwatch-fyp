'use client';

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowRight, Check, DotsSixVertical, Plus, Trash, X } from '@phosphor-icons/react/ssr';
import { useState } from 'react';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import { Dialog, DialogClose, DialogContent } from '@/shared/components/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/components/dropdown-menu';
import { Input } from '@/shared/components/input';
import SegmentedButton from '@/shared/components/segmented-button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import { cn } from '@/shared/lib/cn';
import { useSetNativeColumns } from '../hooks';
import {
  COLOR_CLASSES,
  WORKFLOW_PRESET,
  columnColor,
  deadEndColumns,
  presetNext,
  presetOf,
  unreachableColumns,
  type DraftColumn,
  type WorkflowPreset,
} from '../lib';
import { COLUMN_COLOR, STATUS_CATEGORY, type Board, type ColumnColor } from '../types';

const MAX_COLUMNS = 12;
const TAB = { columns: 'columns', workflow: 'workflow' } as const;
type Tab = (typeof TAB)[keyof typeof TAB];
const CATEGORY_LABELS = { [STATUS_CATEGORY.todo]: 'To do', [STATUS_CATEGORY.inProgress]: 'In progress', [STATUS_CATEGORY.done]: 'Done' } as const;
const PRESETS: { value: WorkflowPreset; label: string }[] = [
  { value: WORKFLOW_PRESET.open, label: 'Open' },
  { value: WORKFLOW_PRESET.step, label: 'Step by step' },
  { value: WORKFLOW_PRESET.custom, label: 'Custom' },
];

const newId = () => `col-${crypto.randomUUID().slice(0, 8)}`;

/**
 * A native board's columns and workflow, edited together and saved at once (admins). Moves are open
 * unless a column says where cards can go from it: "Can move to" chips, or a preset for the whole board.
 */
export default function ColumnsWorkflowDialog({ board, onClose }: { board: Board; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>(TAB.columns);
  const [columns, setColumns] = useState<DraftColumn[]>(() =>
    board.columns.map((column) => ({ id: column.id, name: column.name, status_category: column.status_category, color: column.color ?? null, next: column.next ?? null })),
  );
  // removed columns' items go to the column picked here (the first, until picked)
  const [reassign, setReassign] = useState<Record<string, string>>({});
  const save = useSetNativeColumns();
  const removed = board.columns.filter((column) => !columns.some((draft) => draft.id === column.id));
  const names = columns.map((column) => column.name.trim().toLowerCase());
  const invalid = names.some((name) => !name) || new Set(names).size !== names.length;

  const update = (id: string, changes: Partial<DraftColumn>) => setColumns((all) => all.map((column) => (column.id === id ? { ...column, ...changes } : column)));
  const remove = (id: string) =>
    setColumns((all) => all.filter((column) => column.id !== id).map((column) => ({ ...column, next: column.next && column.next.filter((target) => target !== id) })));
  const add = () =>
    setColumns((all) => [...all, { id: newId(), name: `Column ${all.length + 1}`, status_category: STATUS_CATEGORY.inProgress, color: null, next: null }]);

  const submit = () =>
    save.mutate(
      {
        boardId: board.id,
        columns: columns.map((column) => ({ ...column, name: column.name.trim() })),
        reassign: Object.fromEntries(removed.map((column) => [column.id, reassign[column.id] ?? columns[0].id])),
      },
      { onSuccess: onClose },
    );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        title="Columns & workflow"
        description="The board's columns for everyone, and where cards can move from each."
        className="max-w-2xl"
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button variant="primary" loading={save.isPending} disabled={invalid} onClick={submit}>
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <SegmentedButton
            size="sm"
            aria-label="Edit"
            value={tab}
            onValueChange={setTab}
            options={[{ value: TAB.columns, label: 'Columns' }, { value: TAB.workflow, label: 'Workflow' }]}
          />
          {tab === TAB.columns ? (
            <ColumnsTab columns={columns} setColumns={setColumns} update={update} remove={remove} add={add} invalid={invalid} />
          ) : (
            <WorkflowTab columns={columns} setColumns={setColumns} update={update} />
          )}
          {removed.length > 0 && (
            <section className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <h3 className="text-sm font-medium">Removed columns</h3>
              {removed.map((column) => (
                <div key={column.id} className="flex items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">Move items in {column.name} to</span>
                  <Select value={reassign[column.id] ?? columns[0].id} onValueChange={(value) => setReassign((all) => ({ ...all, [column.id]: value }))}>
                    <SelectTrigger size="sm" className="w-44" aria-label={`Where ${column.name}'s items go`} />
                    <SelectContent>
                      {columns.map((target) => <SelectItem key={target.id} value={target.id}>{target.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type EditProps = {
  columns: DraftColumn[];
  setColumns: (change: (all: DraftColumn[]) => DraftColumn[]) => void;
  update: (id: string, changes: Partial<DraftColumn>) => void;
};

function ColumnsTab({ columns, setColumns, update, remove, add, invalid }: EditProps & { remove: (id: string) => void; add: () => void; invalid: boolean }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setColumns((all) => arrayMove(all, all.findIndex((c) => c.id === active.id), all.findIndex((c) => c.id === over.id)));
  };
  return (
    <div className="flex flex-col gap-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={columns.map((column) => column.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-1">
            {columns.map((column) => (
              <ColumnRow key={column.id} column={column} update={update} onRemove={columns.length > 1 ? () => remove(column.id) : undefined} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {invalid && <p className="text-xs text-danger">Every column needs a name of its own.</p>}
      <Button size="sm" className="self-start" disabled={columns.length >= MAX_COLUMNS} onClick={add}>
        <Plus /> Add column
      </Button>
    </div>
  );
}

function ColumnRow({ column, update, onRemove }: { column: DraftColumn; update: EditProps['update']; onRemove?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.id });
  const color = columnColor({ ...column, color: column.color });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('flex list-none items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5', isDragging && 'opacity-60')}
    >
      <button type="button" {...attributes} {...listeners} aria-label={`Reorder ${column.name}`} className="cursor-grab rounded p-0.5 text-muted hover:text-foreground active:cursor-grabbing">
        <DotsSixVertical className="size-4" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={`Color of ${column.name}`} className="rounded-full p-1 hover:bg-fill-hover">
            <span className={cn('block size-3 rounded-full', COLOR_CLASSES[color].dot)} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => update(column.id, { color: null })}>Default</DropdownMenuItem>
          {Object.values(COLUMN_COLOR).map((option: ColumnColor) => (
            <DropdownMenuItem key={option} onSelect={() => update(column.id, { color: option })}>
              <span className={cn('size-3 rounded-full', COLOR_CLASSES[option].dot)} />
              <span className="capitalize">{option}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Input size="sm" aria-label="Column name" maxLength={40} value={column.name} onChange={(e) => update(column.id, { name: e.target.value })} className="flex-1" />
      <Select value={column.status_category} onValueChange={(value) => update(column.id, { status_category: value as DraftColumn['status_category'] })}>
        <SelectTrigger size="sm" className="w-36" aria-label={`Category of ${column.name}`} />
        <SelectContent>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button size="sm" variant="tertiary" iconOnly aria-label={`Remove ${column.name}`} disabled={!onRemove} onClick={onRemove}>
        <Trash />
      </Button>
    </li>
  );
}

function WorkflowTab({ columns, setColumns, update }: EditProps) {
  const preset = presetOf(columns);
  const unreachable = unreachableColumns(columns);
  const deadEnds = deadEndColumns(columns);
  const nameOf = (id: string) => columns.find((column) => column.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-3">
      <SegmentedButton
        size="sm"
        aria-label="Preset"
        value={preset}
        onValueChange={(value) => value !== WORKFLOW_PRESET.custom && setColumns((all) => presetNext(all, value))}
        options={PRESETS}
      />
      {preset === WORKFLOW_PRESET.open && <p className="text-xs text-muted">Cards can move anywhere. Restrict a column to guide your process.</p>}
      <ul className="flex flex-col gap-1">
        {columns.map((column) => (
          <li key={column.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <span className={cn('size-2 rounded-full', COLOR_CLASSES[columnColor(column)].dot)} aria-hidden />
            <span className="w-32 truncate font-medium">{column.name}</span>
            <span className="text-xs text-muted">Can move to</span>
            {column.next === null ? (
              <Chip label="Any column" />
            ) : column.next.length === 0 ? (
              <span className="text-xs text-muted">nowhere</span>
            ) : (
              column.next.map((target) => (
                <Chip key={target} label={nameOf(target)} onRemove={() => update(column.id, { next: column.next?.filter((id) => id !== target) ?? null })} />
              ))
            )}
            <TargetsMenu column={column} columns={columns} onChange={(next) => update(column.id, { next })} />
          </li>
        ))}
      </ul>
      <Preview columns={columns} />
      {unreachable.length > 0 && (
        <Banner type="warning">No column moves cards to {unreachable.map((column) => column.name).join(', ')}, so cards only get there when they're created there.</Banner>
      )}
      {deadEnds.length > 0 && <Banner type="info">Cards in {deadEnds.map((column) => column.name).join(', ')} can't move anywhere else.</Banner>}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-fill-hover px-2 py-0.5 text-xs">
      {label}
      {onRemove && (
        <button type="button" aria-label={`Remove ${label}`} onClick={onRemove} className="rounded-full text-muted hover:text-foreground">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

/** Pick where a column's cards can go: any column, or some of them. */
function TargetsMenu({ column, columns, onChange }: { column: DraftColumn; columns: DraftColumn[]; onChange: (next: string[] | null) => void }) {
  const others = columns.filter((other) => other.id !== column.id);
  const toggle = (id: string) => {
    const current = column.next ?? others.map((other) => other.id);
    onChange(current.includes(id) ? current.filter((target) => target !== id) : [...current, id]);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="tertiary" aria-label={`Where ${column.name}'s cards can move`}>
          <Plus /> Edit
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={() => onChange(null)}>
          <Check aria-hidden className={cn('size-4', column.next !== null && 'invisible')} />
          Any column
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {others.map((other) => (
          // stays open, so several columns can be picked
          <DropdownMenuItem key={other.id} onSelect={(event) => { event.preventDefault(); toggle(other.id); }}>
            <Check aria-hidden className={cn('size-4', !(column.next === null || column.next.includes(other.id)) && 'invisible')} />
            {other.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The columns in order with the moves between them, to see the flow at a glance. */
function Preview({ columns }: { columns: DraftColumn[] }) {
  return (
    <div aria-label="Workflow preview" className="flex flex-wrap items-center gap-1.5 rounded-lg bg-fill-hover p-3 text-xs">
      {columns.map((column, index) => {
        const next = columns[index + 1];
        const forward = next && (column.next === null || column.next.includes(next.id));
        return (
          <span key={column.id} className="flex items-center gap-1.5">
            <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-medium">{column.name}</span>
            {next && <ArrowRight aria-label={forward ? `to ${next.name}` : `not to ${next.name}`} className={cn('size-3.5', forward ? 'text-foreground' : 'text-muted opacity-30')} />}
          </span>
        );
      })}
    </div>
  );
}
