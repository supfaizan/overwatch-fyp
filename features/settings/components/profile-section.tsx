'use client';

import { Devices, SignOut } from '@phosphor-icons/react/ssr';
import { useRouter } from 'next/navigation';
import Avatar from '@/shared/components/avatar';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import GithubMark from '@/shared/components/github-mark';
import ConnectGithubButton from '@/shared/repos/connect-github-button';
import { displayName, handle } from '@/shared/session/lib';
import { signOut } from '@/shared/session/sign-out';
import { useSession } from '@/shared/session/store';
import { SettingsSection } from './settings-layout';

export default function ProfileSection() {
  const user = useSession((state) => state.user);
  const router = useRouter();
  if (!user) return null;

  const name = displayName(user);
  const leave = (everywhere: boolean) => () => void signOut({ everywhere }).finally(() => router.replace('/sign-in'));

  return (
    <SettingsSection title="Profile" description="Your name, username and the accounts you sign in with.">
      <Card className="flex flex-wrap items-center gap-4">
        <Avatar src={user.avatar_url} name={name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{name}</p>
          <p className="truncate text-sm text-muted">
            {handle(user)}
            {user.email && user.username && <> · {user.email}</>}
          </p>
        </div>
        {user.github_login ? (
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <GithubMark /> GitHub: @{user.github_login}
          </span>
        ) : (
          <ConnectGithubButton returnTo="settings" />
        )}
      </Card>
      <Card className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Sessions</p>
          <p className="text-sm text-muted">Signing out everywhere ends your sessions on every device and browser.</p>
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
