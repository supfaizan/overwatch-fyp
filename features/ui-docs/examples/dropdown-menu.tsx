import { CaretDown, Copy, PushPin, ShareNetwork, Trash } from '@phosphor-icons/react/ssr';
import Button from '@/shared/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/dropdown-menu';

export function Actions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          Actions
          <CaretDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Dashboard</DropdownMenuLabel>
        <DropdownMenuItem>
          <PushPin /> Pin
        </DropdownMenuItem>
        <DropdownMenuItem>
          <ShareNetwork /> Share
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Copy /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem danger>
          <Trash /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
