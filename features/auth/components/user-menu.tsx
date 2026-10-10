'use client';

import { LogOut, MonitorX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Avatar from '@/shared/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/dropdown-menu';
import { useSession } from '@/shared/session/store';
import { signOut } from '../api';

export default function UserMenu() {
  const user = useSession((state) => state.user);
  const router = useRouter();
  if (!user) return null;

  const name = user.name ?? user.github_login;
  const leave = (everywhere: boolean) => () => {
    void signOut({ everywhere }).finally(() => router.replace('/sign-in'));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" aria-label="Account menu">
        <Avatar src={user.avatar_url} name={name} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="normal-case">
          <span className="block text-sm text-foreground">{name}</span>
          <span className="block font-normal">@{user.github_login}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={leave(false)}>
          <LogOut /> Sign out
        </DropdownMenuItem>
        <DropdownMenuItem danger onSelect={leave(true)}>
          <MonitorX /> Sign out everywhere
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
