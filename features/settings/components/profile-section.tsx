'use client';

import Avatar from '@/shared/components/avatar';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import { displayName, handle } from '@/shared/session/lib';
import { signOut } from '@/shared/session/sign-out';
import { useSession } from '@/shared/session/store';
import { Devices, SignOut } from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { SettingsSection } from './settings-layout';

/** `loginMethods` is the sign-in methods card, composed in from the auth feature. */
export default function ProfileSection({ loginMethods }: { loginMethods: ReactNode }) {
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
      return void signOut({ everywhere }).finally(() => {
        return router.replace('/sign-in');
      });
    };
  };

  return (
    <SettingsSection
      title="Profile"
      description="Your name, username and the accounts you sign in with."
    >
      <Card className="flex flex-wrap items-center gap-4">
        <Avatar src={user.avatar_url} name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{name}</p>
          <p className="truncate text-sm text-muted">
            {handle(user)}
            {user.email && user.username && <>{' · '}{user.email}</>}
          </p>
        </div>
      </Card>
      {loginMethods}
      <Card className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Sessions</p>
          <p className="text-sm text-muted">
            Signing out everywhere ends your sessions on every device and browser.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={leave(false)}>
            <SignOut /> Sign out
          </Button>
          <Button variant="danger" onClick={leave(true)}>
            <Devices /> Sign out everywhere
          </Button>
        </div>
      </Card>
    </SettingsSection>
  );
}
