"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/features/auth/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const initials = (user?.name ?? "OW")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-8 border border-line-2">
          <AvatarImage src={user?.avatarUrl} alt={user?.name ?? "user"} />
          <AvatarFallback className="bg-surface-2 font-mono text-[11px] text-text-mid">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="ow-mono-data text-text-hi">{user?.name ?? "Signed in"}</p>
          <p className="ow-mono-micro text-text-dim">
            {user?.githubHandle ? `@${user.githubHandle}` : "GitHub account"}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="font-mono text-[12px]">
          <UserIcon className="size-4" /> Account
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="font-mono text-[12px] text-critical focus:text-critical"
        >
          <LogOut className="size-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
