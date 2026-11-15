'use client';

import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import Skeleton from '@/shared/components/skeleton';
import Switch from '@/shared/components/switch';
import Tooltip from '@/shared/components/tooltip';
import { timeAgo } from '@/shared/lib/time';
import { displayName } from '@/shared/session/lib';
import { useWorkspaceMembers } from '@/shared/workspaces/hooks';
import { X } from '@phosphor-icons/react/ssr';
import {
  useAiRecording,
  useRevokeWorkspaceAiTool,
  useSetAiRecording,
  useWorkspaceAiTools,
} from '../hooks';

/** The workspace's side of AI tools: whether they may record at all, and (for admins) who connected what. */
export default function AiToolsAdmin({ isAdmin }: { isAdmin: boolean }) {
  const recording = useAiRecording();
  const setRecording = useSetAiRecording();
  const tools = useWorkspaceAiTools(isAdmin);
  const members = useWorkspaceMembers();
  const revoke = useRevokeWorkspaceAiTool();

  if (!recording.data) {
    return <Skeleton className="h-16 w-full" />;
  }
  const nameOf = (userId: string) => {
    const member = members.data?.find((m) => {
      return m.user_id === userId;
    });
    return member ? displayName(member) : 'Former member';
  };

  return (
    <Card className="flex flex-col gap-4">
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>
          <span className="block font-medium">AI tools can record in this workspace</span>
          <span className="text-xs text-muted">
            {isAdmin
              ? 'When off, connected tools can still read decisions, tickets and pages, but record nothing.'
              : 'Set by an admin. When off, connected tools can still read, but record nothing.'}
          </span>
        </span>
        <Switch
          checked={recording.data.recording_enabled}
          disabled={!isAdmin || setRecording.isPending}
          onCheckedChange={(on) => {
            return setRecording.mutate(on);
          }}
        />
      </label>
      {isAdmin && tools.data && tools.data.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-sm font-medium">Everyone's connections here</p>
          <ul className="divide-y divide-border">
            {tools.data.map((tool) => {
              return (
                <li key={tool.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    {tool.label}
                    <span className="text-muted">
                      {' · '}
                      {nameOf(tool.user_id)} ·{' '}
                      {tool.last_used_at ? `used ${timeAgo(tool.last_used_at)}` : 'never used'} ·
                      {' '}
                      {tool.records_count} recorded
                    </span>
                  </span>
                  <ConfirmDialog
                    trigger={
                      <Tooltip content="Disconnect">
                        <Button
                          size="sm"
                          variant="tertiary"
                          iconOnly
                          aria-label={`Disconnect ${tool.label}`}
                          className="hover:text-danger"
                        >
                          <X />
                        </Button>
                      </Tooltip>
                    }
                    title={`Disconnect ${tool.label}?`}
                    description={`${
                      nameOf(tool.user_id)
                    }'s tool stops working in this workspace right away. What it recorded stays.`}
                    confirmLabel="Disconnect"
                    pending={revoke.isPending}
                    onConfirm={(close) => {
                      return revoke.mutate(tool.id, { onSuccess: close });
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
