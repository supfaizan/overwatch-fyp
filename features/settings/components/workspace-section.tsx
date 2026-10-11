'use client';

import { SignOut, Trash } from '@phosphor-icons/react/ssr';
import { useState, type FormEvent } from 'react';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import { Input } from '@/shared/components/input';
import { useSession } from '@/shared/session/store';
import { useCurrentWorkspace, useSwitchWorkspace, useWorkspaces } from '@/shared/workspaces/hooks';
import { hasRole } from '@/shared/workspaces/lib';
import { ROLE, type Workspace } from '@/shared/workspaces/types';
import { useDeleteWorkspace, useRemoveMember, useRenameWorkspace } from '../hooks';
import { SettingsSection } from './settings-layout';

export default function WorkspaceSection() {
  const workspace = useCurrentWorkspace();
  if (!workspace) return null;

  return (
    <SettingsSection title="Workspace" description="Everyone in a workspace shares its repositories and integrations.">
      {/* keyed so the name field resets when the workspace changes */}
      <NameCard key={workspace.id} workspace={workspace} />
      {!workspace.personal && <DangerCard workspace={workspace} />}
    </SettingsSection>
  );
}

function NameCard({ workspace }: { workspace: Workspace }) {
  const [name, setName] = useState(workspace.name);
  const rename = useRenameWorkspace();
  const canEdit = hasRole(workspace.role, ROLE.admin);
  const trimmed = name.trim();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    rename.mutate({ id: workspace.id, name: trimmed });
  };

  return (
    <Card>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="workspace-name" className="text-sm font-medium">
            Name
          </label>
          <p className="text-sm text-muted">{canEdit ? 'Shown in the sidebar and on invites.' : 'Only admins can rename the workspace.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input id="workspace-name" className="max-w-xs" maxLength={60} value={name} disabled={!canEdit} onChange={(event) => setName(event.target.value)} />
          {canEdit && (
            <Button type="submit" variant="primary" loading={rename.isPending} disabled={!trimmed || trimmed === workspace.name}>
              Save
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

function DangerCard({ workspace }: { workspace: Workspace }) {
  const userId = useSession((state) => state.user?.id ?? '');
  const personal = useWorkspaces().data?.find((candidate) => candidate.personal);
  const switchTo = useSwitchWorkspace();
  const leave = useRemoveMember();
  const remove = useDeleteWorkspace();
  // both take the workspace away, so the personal one opens instead
  const leaveFor = (close: () => void) => {
    close();
    if (personal) switchTo(personal.id);
  };

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium">Leave or delete</p>
        <p className="text-sm text-muted">Deleting hides the workspace from everyone. Its repositories, tickets and graphs are kept, not erased.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <ConfirmDialog
          trigger={
            <Button>
              <SignOut /> Leave workspace
            </Button>
          }
          title={`Leave ${workspace.name}?`}
          description="You lose access until someone invites you again."
          confirmLabel="Leave workspace"
          pending={leave.isPending}
          onConfirm={(close) => leave.mutate({ id: workspace.id, userId }, { onSuccess: () => leaveFor(close) })}
        />
        {hasRole(workspace.role, ROLE.owner) && (
          <ConfirmDialog
            trigger={
              <Button variant="danger">
                <Trash /> Delete workspace
              </Button>
            }
            title={`Delete ${workspace.name}?`}
            description="Every member loses access to it. Its data is kept, so it can be restored on request."
            confirmLabel="Delete workspace"
            pending={remove.isPending}
            onConfirm={(close) => remove.mutate(workspace.id, { onSuccess: () => leaveFor(close) })}
          />
        )}
      </div>
    </Card>
  );
}
