import { ChevronDown, Copy, Pin, Share2, Trash2 } from 'lucide-react';
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
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Dashboard</DropdownMenuLabel>
        <DropdownMenuItem>
          <Pin /> Pin
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Share2 /> Share
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Copy /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem danger>
          <Trash2 /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
