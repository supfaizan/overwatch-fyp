'use client';

import Avatar from '@/shared/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/dropdown-menu';
import { displayName, handle } from '@/shared/session/lib';
import { signOut } from '@/shared/session/sign-out';
import { useSession } from '@/shared/session/store';
import { Devices, SignOut } from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';

export default function UserMenu() {
  const user = useSession((state) => {
    return state.user;
  });
  const router = useRouter();
  if (!user) {
    return null;
  }

  const name = displayName(user);
  const leave = (everywhere: boolean) => {
    return () => {
      void signOut({ everywhere }).finally(() => {
        return router.replace('/sign-in');
      });
    };
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Account menu"
      >
        <Avatar src={user.avatar_url} name={name} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="normal-case">
          <span className="block text-sm text-foreground">{name}</span>
          <span className="block font-normal">{handle(user)}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={leave(false)}>
          <SignOut /> Sign out
        </DropdownMenuItem>
        <DropdownMenuItem danger onSelect={leave(true)}>
          <Devices /> Sign out everywhere
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
