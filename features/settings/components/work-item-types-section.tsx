'use client';

import { PencilSimple, Plus, Trash } from '@phosphor-icons/react/ssr';
import { useState, type FormEvent } from 'react';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import { Dialog, DialogClose, DialogContent } from '@/shared/components/dialog';
import { Input } from '@/shared/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import Skeleton from '@/shared/components/skeleton';
import Tag from '@/shared/components/tag';
import { cn } from '@/shared/lib/cn';
import { useCurrentWorkspace } from '@/shared/workspaces/hooks';
import { hasRole } from '@/shared/workspaces/lib';
import { ROLE } from '@/shared/workspaces/types';
import { useCreateType, useDeleteType, useUpdateType, useWorkItemTypes } from '@/shared/work-item-types/hooks';
import TypeIcon, { ICONS, TYPE_COLOR_CLASSES } from '@/shared/work-item-types/type-icon';
import { TYPE_COLORS, TYPE_ICONS, type TypeColor, type TypeIcon as TypeIconName, type WorkItemType } from '@/shared/work-item-types/types';
import { SettingsSection } from './settings-layout';

const NATIVE = 'native';
const trackerName = (source: string) => source.charAt(0).toUpperCase() + source.slice(1);

/** The workspace's work item types (Task, Bug, ...): admins add and style them; everyone picks from them. */
export default function WorkItemTypesSection() {
  const types = useWorkItemTypes();
  const isAdmin = hasRole(useCurrentWorkspace()?.role, ROLE.admin);
  const [editing, setEditing] = useState<WorkItemType | 'new' | null>(null);
  const [removing, setRemoving] = useState<WorkItemType | null>(null);

  return (
    <SettingsSection
      title="Work item types"
      description="What kind of work each item is, shown as an icon on cards and in the backlog. A tracker's types appear here once synced."
    >
      {types.isPending && <Skeleton className="h-40 w-full" />}
      {types.isError && (
        <Banner type="error" action={<Button size="sm" onClick={() => types.refetch()}>Retry</Button>}>
          {types.error.message}
        </Banner>
      )}
      {types.isSuccess && (
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {types.data.map((type) => (
              <li key={type.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <TypeIcon type={type} className="size-5" />
                <span className="font-medium">{type.name}</span>
                {type.source !== NATIVE && <Tag>From {trackerName(type.source)}</Tag>}
                <span className="flex-1" />
                {isAdmin && (
                  <>
                    <Button size="sm" variant="tertiary" iconOnly aria-label={`Edit ${type.name}`} onClick={() => setEditing(type)}>
                      <PencilSimple />
                    </Button>
                    <Button size="sm" variant="tertiary" iconOnly aria-label={`Remove ${type.name}`} disabled={types.data.length <= 1} onClick={() => setRemoving(type)}>
                      <Trash />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
      {isAdmin && (
        <Button className="self-start" onClick={() => setEditing('new')}>
          <Plus /> Add type
        </Button>
      )}
      {editing && <TypeDialog type={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {removing && types.data && <RemoveDialog type={removing} others={types.data.filter((t) => t.id !== removing.id)} onClose={() => setRemoving(null)} />}
    </SettingsSection>
  );
}

/** Add a type, or edit one; a tracker's type keeps the name its tracker gives it. */
function TypeDialog({ type, onClose }: { type: WorkItemType | null; onClose: () => void }) {
  const [name, setName] = useState(type?.name ?? '');
  const [icon, setIcon] = useState<TypeIconName>(type?.icon ?? 'CheckSquare');
  const [color, setColor] = useState<TypeColor>(type?.color ?? 'blue');
  const create = useCreateType();
  const update = useUpdateType();
  const fromTracker = Boolean(type && type.source !== NATIVE);
  const pending = create.isPending || update.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const fields = { name: name.trim(), icon, color };
    if (type) update.mutate({ id: type.id, ...(fromTracker ? { icon, color } : fields) }, { onSuccess: onClose });
    else create.mutate(fields, { onSuccess: onClose });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        title={type ? `Edit ${type.name}` : 'Add a type'}
        description={fromTracker ? `Its name comes from ${trackerName(type?.source ?? '')}; its icon and color are yours.` : undefined}
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button variant="primary" type="submit" form="work-item-type" loading={pending} disabled={!name.trim()}>
              {type ? 'Save' : 'Add type'}
            </Button>
          </>
        }
      >
        <form id="work-item-type" onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <TypeIcon type={{ icon, color, name: name || 'New type' }} className="size-6" />
            <Input aria-label="Name" placeholder="e.g. Chore" maxLength={40} value={name} disabled={fromTracker} onChange={(e) => setName(e.target.value)} autoFocus={!fromTracker} />
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-xs font-medium text-muted">Icon</legend>
            <div role="radiogroup" aria-label="Icon" className="grid grid-cols-7 gap-1">
              {TYPE_ICONS.map((option) => {
                const Glyph = ICONS[option];
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={icon === option}
                    aria-label={option}
                    onClick={() => setIcon(option)}
                    className={cn(
                      'flex size-9 cursor-pointer items-center justify-center rounded-md border border-transparent hover:bg-fill-hover focus-visible:outline-2 focus-visible:outline-primary',
                      icon === option && 'border-primary bg-fill-active',
                    )}
                  >
                    <Glyph weight="bold" className={cn('size-4', TYPE_COLOR_CLASSES[color].text)} />
                  </button>
                );
              })}
            </div>
          </fieldset>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-xs font-medium text-muted">Color</legend>
            <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2">
              {TYPE_COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={color === option}
                  aria-label={option}
                  onClick={() => setColor(option)}
                  className={cn(
                    'size-7 cursor-pointer rounded-full border-2 border-transparent focus-visible:outline-2 focus-visible:outline-primary',
                    TYPE_COLOR_CLASSES[option].swatch,
                    color === option && 'border-foreground',
                  )}
                />
              ))}
            </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Remove a type; its items take another one first. */
function RemoveDialog({ type, others, onClose }: { type: WorkItemType; others: WorkItemType[]; onClose: () => void }) {
  const [reassignTo, setReassignTo] = useState(others[0]?.id ?? '');
  const remove = useDeleteType();
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        title={`Remove ${type.name}?`}
        description="Items of this type change to the type you pick."
        footer={
          <>
            <DialogClose asChild>
              <Button>Cancel</Button>
            </DialogClose>
            <Button variant="danger" loading={remove.isPending} disabled={!reassignTo} onClick={() => remove.mutate({ id: type.id, reassignTo }, { onSuccess: onClose })}>
              Remove {type.name}
            </Button>
          </>
        }
      >
        <Select value={reassignTo} onValueChange={setReassignTo}>
          <SelectTrigger aria-label="Change its items to" />
          <SelectContent>
            {others.map((other) => (
              <SelectItem key={other.id} value={other.id}>
                <span className="flex items-center gap-2"><TypeIcon type={other} />{other.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </DialogContent>
    </Dialog>
  );
}
