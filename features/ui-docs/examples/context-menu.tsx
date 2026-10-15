import { Archive, PencilSimple, Plus } from '@phosphor-icons/react/ssr';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger } from '@/shared/components/context-menu';

export function RightClick() {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="flex h-24 w-64 items-center justify-center rounded-lg border border-dashed border-border-strong text-sm text-muted">Right-click here</div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Page</ContextMenuLabel>
        <ContextMenuItem>
          <PencilSimple /> Rename
        </ContextMenuItem>
        <ContextMenuItem>
          <Plus /> New page inside
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem danger>
          <Archive /> Archive
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
