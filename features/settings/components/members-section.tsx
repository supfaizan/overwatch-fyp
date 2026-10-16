'use client';

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
import { timeAgo } from '@/shared/lib/time';
import { displayName, handle } from '@/shared/session/lib';
import { useSession } from '@/shared/session/store';
import { useCurrentWorkspace } from '@/shared/workspaces/hooks';
import { hasRole } from '@/shared/workspaces/lib';
import { ROLE, type Role, type Workspace } from '@/shared/workspaces/types';
import { Copy, EnvelopeSimple, LinkSimple, UserMinus, X } from '@phosphor-icons/react/ssr';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import {
  useCreateInvite,
  useInvites,
  useMembers,
  useRemoveMember,
  useResendInvite,
  useRevokeInvite,
  useUpdateMember,
} from '../hooks';
import { type Invite, INVITE_KIND, type InviteKind, type InviteRole, type Member } from '../types';
import { SettingsSection } from './settings-layout';

const ROLE_LABELS: Record<Role, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' };

export default function MembersSection() {
  const workspace = useCurrentWorkspace();
  if (!workspace) {
    return null;
  }
  const isAdmin = hasRole(workspace.role, ROLE.admin);

  return (
    <SettingsSection
      title="Members"
      description="Admins connect repositories and integrations and manage people; members can view and re-index."
    >
      <MemberList workspace={workspace} />
      {isAdmin && <Invites workspace={workspace} />}
    </SettingsSection>
  );
}

function MemberList({ workspace }: { workspace: Workspace }) {
  const members = useMembers(workspace.id);

  if (members.isPending) {
    return <Skeleton className="h-32 w-full" />;
  }
  if (members.isError) {
    return (
      <Banner
        type="error"
        action={
          <Button
            size="sm"
            onClick={() => {
              return members.refetch();
            }}
          >
            Retry
          </Button>
        }
      >
        {members.error.message}
      </Banner>
    );
  }
  return (
    <Card className="p-0">
      <ul className="divide-y divide-border">
        {members.data.map((member) => {
          return <MemberRow key={member.user_id} workspace={workspace} member={member} />;
        })}
      </ul>
    </Card>
  );
}

function MemberRow({ workspace, member }: { workspace: Workspace; member: Member }) {
  const userId = useSession((state) => {
    return state.user?.id;
  });
  const update = useUpdateMember();
  const remove = useRemoveMember();
  const name = displayName(member);
  const isSelf = member.user_id === userId;
  // nobody changes a role above their own; the backend also keeps one owner
  const canManage = !isSelf && hasRole(workspace.role, ROLE.admin)
    && hasRole(workspace.role, member.role);
  const roles = (Object.keys(ROLE_LABELS) as Role[]).filter((role) => {
    return hasRole(workspace.role, role);
  });

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <Avatar src={member.avatar_url} name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {name} {isSelf && <span className="text-muted">(you)</span>}
        </p>
        <p className="truncate text-xs text-muted">
          {handle(member)}
          {member.email && member.username && <>{' · '}{member.email}</>}
        </p>
      </div>
      {canManage
        ? (
          <Select
            value={member.role}
            onValueChange={(role) => {
              return update.mutate({
                id: workspace.id,
                userId: member.user_id,
                role: role as Role,
              });
            }}
          >
            <SelectTrigger size="sm" className="w-28" aria-label={`Role for ${name}`} />
            <SelectContent>
              {roles.map((role) => {
                return (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )
        : <Tag>{ROLE_LABELS[member.role]}</Tag>}
      {canManage && (
        <ConfirmDialog
          trigger={
            <Tooltip content="Remove">
              <Button
                size="sm"
                variant="tertiary"
                iconOnly
                aria-label={`Remove ${name}`}
                className="hover:text-danger"
              >
                <UserMinus />
              </Button>
            </Tooltip>
          }
          title={`Remove ${name}?`}
          description="They lose access to this workspace until they're invited again."
          confirmLabel="Remove member"
          pending={remove.isPending}
          onConfirm={(close) => {
            return remove.mutate({ id: workspace.id, userId: member.user_id }, {
              onSuccess: close,
            });
          }}
        />
      )}
    </li>
  );
}

const RESTRICTIONS: { kind: InviteKind; label: string; placeholder: string }[] = [
  { kind: INVITE_KIND.email, label: 'Email', placeholder: 'name@company.com' },
  { kind: INVITE_KIND.github, label: 'GitHub user', placeholder: 'GitHub username' },
  { kind: INVITE_KIND.link, label: 'Anyone with the link', placeholder: '' },
];
const RESEND_COOLDOWN_MS = 60_000;
const EMAIL_MAX_LENGTH = 254;
const GITHUB_LOGIN_MAX_LENGTH = 39;

function inviteFor(invite: Invite): string {
  if (invite.kind === INVITE_KIND.email) {
    return ` for ${invite.email}`;
  }
  return invite.github_login ? ` for @${invite.github_login}` : ' link';
}

function Invites({ workspace }: { workspace: Workspace }) {
  const invites = useInvites(workspace.id, true);
  const create = useCreateInvite();
  const revoke = useRevokeInvite();
  const resend = useResendInvite();
  const [role, setRole] = useState<InviteRole>(ROLE.member);
  const [kind, setKind] = useState<InviteKind>(INVITE_KIND.email);
  const [target, setTarget] = useState('');
  const [url, setUrl] = useState<string | null>(null);
  const restriction = RESTRICTIONS.find((option) => {
    return option.kind === kind;
  }) ?? RESTRICTIONS[0];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = target.trim();
    create.mutate(
      {
        id: workspace.id,
        role,
        email: kind === INVITE_KIND.email ? value : undefined,
        githubLogin: kind === INVITE_KIND.github ? value : undefined,
      },
      {
        onSuccess: (invite) => {
          setUrl(invite.url);
          setTarget('');
          if (invite.kind === INVITE_KIND.email) {
            toast.success(`Invite sent to ${invite.email}.`);
          }
        },
      },
    );
  };

  const copy = (link: string) => {
    return navigator.clipboard.writeText(link).then(
      () => {
        return toast.success('Invite link copied.');
      },
      () => {
        return toast.error('Could not copy; select the link and copy it instead.');
      },
    );
  };

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium">Invite people</p>
        <p className="text-sm text-muted">
          Invites work once and expire in 7 days. Email invites go straight to that inbox; links can
          be locked to a GitHub username.
        </p>
      </div>
      <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
        <Select
          value={role}
          onValueChange={(value) => {
            return setRole(value as InviteRole);
          }}
        >
          <SelectTrigger className="w-28" aria-label="Invite as" />
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={kind}
          onValueChange={(value) => {
            setKind(value as InviteKind);
            setTarget('');
          }}
        >
          <SelectTrigger className="w-48" aria-label="Who can accept" />
          <SelectContent>
            {RESTRICTIONS.map((option) => {
              return (
                <SelectItem key={option.kind} value={option.kind}>
                  {option.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {kind !== INVITE_KIND.link && (
          <Input
            className="max-w-sm min-w-48 flex-1"
            type={kind === INVITE_KIND.email ? 'email' : 'text'}
            aria-label={restriction.placeholder}
            placeholder={restriction.placeholder}
            maxLength={kind === INVITE_KIND.email ? EMAIL_MAX_LENGTH : GITHUB_LOGIN_MAX_LENGTH}
            required
            value={target}
            onChange={(event) => {
              return setTarget(event.target.value);
            }}
          />
        )}
        <Button type="submit" variant="primary" className="ml-auto" loading={create.isPending}>
          {kind === INVITE_KIND.email
            ? (
              <>
                <EnvelopeSimple /> Send invite
              </>
            )
            : (
              <>
                <LinkSimple /> Create link
              </>
            )}
        </Button>
      </form>
      {url && (
        <div className="flex gap-2">
          <Input
            readOnly
            aria-label="Invite link"
            value={url}
            onFocus={(event) => {
              return event.currentTarget.select();
            }}
          />
          <Button
            onClick={() => {
              return void copy(url);
            }}
          >
            <Copy /> Copy
          </Button>
        </div>
      )}
      {invites.data && invites.data.length > 0 && (
        <ul className="divide-y divide-border border-t border-border">
          {invites.data.map((invite) => {
            const sentRecently = invite.last_sent_at !== null
              && Date.now() - new Date(invite.last_sent_at).getTime() < RESEND_COOLDOWN_MS;
            return (
              <li key={invite.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate">
                  {ROLE_LABELS[invite.role]} invite{inviteFor(invite)}
                  <span className="text-muted">
                    {invite.last_sent_at && ` · sent ${timeAgo(invite.last_sent_at)}`} · expires
                    {' '}
                    {new Date(invite.expires_at).toLocaleDateString()}
                  </span>
                </span>
                {invite.kind === INVITE_KIND.email && (
                  <Button
                    size="sm"
                    variant="tertiary"
                    disabled={sentRecently}
                    loading={resend.isPending && resend.variables?.inviteId === invite.id}
                    onClick={() => {
                      return resend.mutate({ id: workspace.id, inviteId: invite.id });
                    }}
                  >
                    Resend
                  </Button>
                )}
                <Tooltip content="Revoke">
                  <Button
                    size="sm"
                    variant="tertiary"
                    iconOnly
                    aria-label="Revoke invite"
                    loading={revoke.isPending && revoke.variables?.inviteId === invite.id}
                    onClick={() => {
                      return revoke.mutate({ id: workspace.id, inviteId: invite.id });
                    }}
                  >
                    <X />
                  </Button>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
