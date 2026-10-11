'use client';

import { CaretUpDown, Check, GearSix, Plus, UserPlus } from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/components/dropdown-menu';
import Tooltip from '@/shared/components/tooltip';
import { cn } from '@/shared/lib/cn';
import { useCurrentWorkspace, useSwitchWorkspace, useWorkspaces } from '@/shared/workspaces/hooks';
import { hasRole } from '@/shared/workspaces/lib';
import { ROLE } from '@/shared/workspaces/types';

function Initial({ name }: { name: string }) {
  return (
    <span aria-hidden className="flex size-5 shrink-0 items-center justify-center rounded bg-accent-purple text-xs font-bold text-white">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/** Which workspace the app is in; switching reloads everything for it and opens its dashboard. */
export default function WorkspaceSwitcher({ collapsed, onCreate }: { collapsed: boolean; onCreate: () => void }) {
  const router = useRouter();
  const workspaces = useWorkspaces();
  const current = useCurrentWorkspace();
  const switchTo = useSwitchWorkspace();
  if (!current) return null;

  const trigger = (
    <DropdownMenuTrigger
      aria-label={`Workspace: ${current.name}`}
      className={cn(
        'flex h-8 min-w-0 shrink-0 cursor-pointer items-center gap-2 rounded-md text-sm transition-colors hover:bg-fill-hover focus-visible:outline-2 focus-visible:outline-primary data-[state=open]:bg-fill-hover',
        collapsed ? 'w-8 justify-center' : 'flex-1 px-1.5',
      )}
    >
      <Initial name={current.name} />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate text-left font-bold">{current.name}</span>
          <CaretUpDown className="size-4 shrink-0 text-muted" />
        </>
      )}
    </DropdownMenuTrigger>
  );

  return (
    // non-modal, so opening the create dialog from it doesn't leave the page's pointer lock behind
    <DropdownMenu modal={false}>
      {collapsed ? (
        <Tooltip content={current.name} side="right">
          {trigger}
        </Tooltip>
      ) : (
        trigger
      )}
      <DropdownMenuContent side={collapsed ? 'right' : 'bottom'} align="start" className="w-64">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {workspaces.data?.map((workspace) => (
          <DropdownMenuItem key={workspace.id} onSelect={() => workspace.id !== current.id && switchTo(workspace.id)}>
            <Check className={cn(workspace.id !== current.id && 'invisible')} />
            <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
            {workspace.personal && <span className="text-xs text-muted">Personal</span>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onCreate}>
          <Plus /> Create workspace…
        </DropdownMenuItem>
        {hasRole(current.role, ROLE.admin) && (
          <DropdownMenuItem onSelect={() => router.push('/settings/members')}>
            <UserPlus /> Invite people
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => router.push('/settings/workspace')}>
          <GearSix /> Workspace settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
