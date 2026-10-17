import Button from '@/shared/components/button';
import {
  CONTEXT_MENU_PARTS,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/shared/components/context-menu';
import {
  DROPDOWN_MENU_PARTS,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  type MenuParts,
} from '@/shared/components/dropdown-menu';
import { Archive, DotsThree, PencilSimple, Plus } from '@phosphor-icons/react/ssr';

export function RightClick() {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="flex h-24 w-64 items-center justify-center rounded-lg border border-dashed border-border-strong text-sm text-muted">
          Right-click here
        </div>
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

// written once, rendered by both menus
function pageActions({ Item, Label, Separator }: MenuParts) {
  return (
    <>
      <Label>Page</Label>
      <Item>
        <PencilSimple /> Rename
      </Item>
      <Separator />
      <Item danger>
        <Archive /> Archive
      </Item>
    </>
  );
}

export function SharedWithADropdown() {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="flex h-24 w-64 items-center justify-between rounded-lg border border-dashed border-border-strong px-4 text-sm text-muted">
          Right-click, or use the button
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="tertiary" size="sm" iconOnly aria-label="Page actions">
                <DotsThree />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>{pageActions(DROPDOWN_MENU_PARTS)}</DropdownMenuContent>
          </DropdownMenu>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>{pageActions(CONTEXT_MENU_PARTS)}</ContextMenuContent>
    </ContextMenu>
  );
}
