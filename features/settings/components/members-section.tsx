'use client';

import { Copy, LinkSimple, UserMinus, X } from '@phosphor-icons/react/ssr';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import Avatar from '@/shared/components/avatar';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import { Input } from '@/shared/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import Skeleton from '@/shared/components/skeleton';
import Tag from '@/shared/components/tag';
import Tooltip from '@/shared/components/tooltip';
import { useSession } from '@/shared/session/store';
import { useCurrentWorkspace } from '@/shared/workspaces/hooks';
import { hasRole } from '@/shared/workspaces/lib';
import type { Role, Workspace } from '@/shared/workspaces/types';
import { useCreateInvite, useInvites, useMembers, useRemoveMember, useRevokeInvite, useUpdateMember } from '../hooks';
import type { InviteRole, Member } from '../types';
import { SettingsSection } from './settings-layout';

const ROLE_LABELS: Record<Role, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' };

export default function MembersSection() {
  const workspace = useCurrentWorkspace();
  if (!workspace) return null;
  const isAdmin = hasRole(workspace.role, 'admin');

  return (
    <SettingsSection title="Members" description="Admins connect repositories and integrations and manage people; members can view and re-index.">
      <MemberList workspace={workspace} />
      {isAdmin && <Invites workspace={workspace} />}
    </SettingsSection>
  );
}

function MemberList({ workspace }: { workspace: Workspace }) {
  const members = useMembers(workspace.id);

  if (members.isPending) return <Skeleton className="h-32 w-full" />;
  if (members.isError) {
    return (
      <Banner type="error" action={<Button size="sm" onClick={() => members.refetch()}>Retry</Button>}>
        {members.error.message}
      </Banner>
    );
  }
  return (
    <Card className="p-0">
      <ul className="divide-y divide-border">
        {members.data.map((member) => (
          <MemberRow key={member.user_id} workspace={workspace} member={member} />
        ))}
      </ul>
    </Card>
  );
}

function MemberRow({ workspace, member }: { workspace: Workspace; member: Member }) {
  const userId = useSession((state) => state.user?.id);
  const update = useUpdateMember();
  const remove = useRemoveMember();
  const name = member.name ?? member.github_login;
  const isSelf = member.user_id === userId;
  // nobody changes a role above their own; the backend also keeps one owner
  const canManage = !isSelf && hasRole(workspace.role, 'admin') && hasRole(workspace.role, member.role);
  const roles = (Object.keys(ROLE_LABELS) as Role[]).filter((role) => hasRole(workspace.role, role));

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <Avatar src={member.avatar_url} name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {name} {isSelf && <span className="text-muted">(you)</span>}
        </p>
        <p className="truncate text-xs text-muted">@{member.github_login}</p>
      </div>
      {canManage ? (
        <Select value={member.role} onValueChange={(role) => update.mutate({ id: workspace.id, userId: member.user_id, role: role as Role })}>
          <SelectTrigger size="sm" className="w-28" aria-label={`Role for ${name}`} />
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Tag>{ROLE_LABELS[member.role]}</Tag>
      )}
      {canManage && (
        <ConfirmDialog
          trigger={
            <Tooltip content="Remove">
              <Button size="sm" variant="tertiary" iconOnly aria-label={`Remove ${name}`} className="hover:text-danger">
                <UserMinus />
              </Button>
            </Tooltip>
          }
          title={`Remove ${name}?`}
          description="They lose access to this workspace until they're invited again."
          confirmLabel="Remove member"
          pending={remove.isPending}
          onConfirm={(close) => remove.mutate({ id: workspace.id, userId: member.user_id }, { onSuccess: close })}
        />
      )}
    </li>
  );
}

function Invites({ workspace }: { workspace: Workspace }) {
  const invites = useInvites(workspace.id, true);
  const create = useCreateInvite();
  const revoke = useRevokeInvite();
  const [role, setRole] = useState<InviteRole>('member');
  const [githubLogin, setGithubLogin] = useState('');
  const [url, setUrl] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(
      { id: workspace.id, role, githubLogin: githubLogin.trim() || null },
      {
        onSuccess: (invite) => {
          setUrl(invite.url);
          setGithubLogin('');
        },
      },
    );
  };

  const copy = (link: string) =>
    navigator.clipboard.writeText(link).then(
      () => toast.success('Invite link copied.'),
      () => toast.error('Could not copy; select the link and copy it instead.'),
    );

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium">Invite people</p>
        <p className="text-sm text-muted">Each link works once and expires in 7 days. Lock it to a GitHub username so only that account can use it.</p>
      </div>
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <Select value={role} onValueChange={(value) => setRole(value as InviteRole)}>
          <SelectTrigger className="w-28" aria-label="Invite as" />
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Input
          className="max-w-56"
          aria-label="GitHub username (optional)"
          placeholder="GitHub username (optional)"
          maxLength={39}
          value={githubLogin}
          onChange={(event) => setGithubLogin(event.target.value)}
        />
        <Button type="submit" variant="primary" loading={create.isPending}>
          <LinkSimple /> Create link
        </Button>
      </form>
      {url && (
        <div className="flex gap-2">
          <Input readOnly aria-label="Invite link" value={url} onFocus={(event) => event.currentTarget.select()} />
          <Button onClick={() => void copy(url)}>
            <Copy /> Copy
          </Button>
        </div>
      )}
      {invites.data && invites.data.length > 0 && (
        <ul className="divide-y divide-border border-t border-border">
          {invites.data.map((invite) => (
            <li key={invite.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">
                {ROLE_LABELS[invite.role]} invite{invite.github_login && ` for @${invite.github_login}`}
                <span className="text-muted"> · expires {new Date(invite.expires_at).toLocaleDateString()}</span>
              </span>
              <Tooltip content="Revoke">
                <Button
                  size="sm"
                  variant="tertiary"
                  iconOnly
                  aria-label="Revoke invite"
                  loading={revoke.isPending && revoke.variables?.inviteId === invite.id}
                  onClick={() => revoke.mutate({ id: workspace.id, inviteId: invite.id })}
                >
                  <X />
                </Button>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
