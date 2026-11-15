'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import Card from '@/shared/components/card';
import Checkbox from '@/shared/components/checkbox';
import ConfirmDialog from '@/shared/components/confirm-dialog';
import { Input } from '@/shared/components/input';
import SegmentedButton from '@/shared/components/segmented-button';
import Skeleton from '@/shared/components/skeleton';
import Switch from '@/shared/components/switch';
import Tag from '@/shared/components/tag';
import Tooltip from '@/shared/components/tooltip';
import { timeAgo } from '@/shared/lib/time';
import { useCurrentWorkspace } from '@/shared/workspaces/hooks';
import { hasRole } from '@/shared/workspaces/lib';
import { ROLE } from '@/shared/workspaces/types';
import { Copy, Key, X } from '@phosphor-icons/react/ssr';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import {
  useAiTools,
  useAiToolSetup,
  useCreateAiToolToken,
  useRevokeAiTool,
  useUpdateAiTool,
} from '../hooks';
import {
  AI_AGENT_RULES,
  AI_CLIENT,
  AI_CLIENT_LABELS,
  AI_SIGN_IN_STEPS,
  type AiClient,
  aiClientSetup,
} from '../lib';
import { AI_TOOL_SCOPE, type AiTool, type AiToolCreated } from '../types';
import AiToolsAdmin from './ai-tools-admin';
import { SettingsSection } from './settings-layout';

const CLIENTS = (Object.values(AI_CLIENT) as AiClient[]).map((value) => {
  return { value, label: AI_CLIENT_LABELS[value] };
});
const LABEL_MAX_LENGTH = 60;

const copy = (text: string, what: string) => {
  return navigator.clipboard.writeText(text).then(
    () => {
      return toast.success(`${what} copied.`);
    },
    () => {
      return toast.error('Could not copy; select the text and copy it instead.');
    },
  );
};

export default function AiToolsSection() {
  const workspace = useCurrentWorkspace();
  if (!workspace) {
    return null;
  }

  return (
    <SettingsSection
      title="AI tools"
      description="Connect your coding agent so it reads your team's decisions before it works, and records new ones for the team to review."
    >
      <SignIn />
      <Connect workspaceName={workspace.name} />
      <Rules />
      <Connected />
      <AiToolsAdmin isAdmin={hasRole(workspace.role, ROLE.admin)} />
    </SettingsSection>
  );
}

/** For tools that sign in: they only need the address, and ask for the workspace on the way. */
function SignIn() {
  const setup = useAiToolSetup();

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium">Connect by signing in</p>
        <p className="text-sm text-muted">
          Give the tool this address. It sends you back here to choose a workspace and approve.
          Whether a plan allows custom connectors is up to each assistant.
        </p>
      </div>
      {setup.data
        ? <Snippet text={setup.data.url} what="Address" />
        : <Skeleton className="h-10 w-full" />}
      <ul className="flex flex-col gap-1 text-sm">
        {AI_SIGN_IN_STEPS.map(({ name, steps }) => {
          return (
            <li key={name}>
              <span className="font-medium">{name}:</span>{' '}
              <span className="text-muted">{steps}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Connect({ workspaceName }: { workspaceName: string }) {
  const create = useCreateAiToolToken();
  const [client, setClient] = useState<AiClient>(AI_CLIENT.claudeCode);
  const [label, setLabel] = useState('');
  const [askFirst, setAskFirst] = useState(true);
  const [readOnly, setReadOnly] = useState(false);
  const [created, setCreated] = useState<{ tool: AiToolCreated; client: AiClient } | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(
      { label: label.trim() || AI_CLIENT_LABELS[client], readOnly, askFirst },
      {
        onSuccess: (tool) => {
          setCreated({ tool, client });
          setLabel('');
        },
      },
    );
  };

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium">Or connect with a token, to {workspaceName}</p>
        <p className="text-sm text-muted">
          A token works in this workspace only. To use another workspace, switch to it and create
          another.
        </p>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <SegmentedButton
          aria-label="Tool to connect"
          options={CLIENTS}
          value={client}
          onValueChange={setClient}
        />
        <Input
          className="max-w-sm"
          aria-label="Name for this connection"
          placeholder={`Name, e.g. ${AI_CLIENT_LABELS[client]} on my laptop`}
          maxLength={LABEL_MAX_LENGTH}
          value={label}
          onChange={(event) => {
            return setLabel(event.target.value);
          }}
        />
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            className="mt-0.5"
            checked={askFirst}
            disabled={readOnly}
            onCheckedChange={(on) => {
              return setAskFirst(on === true);
            }}
          />
          <span>
            Ask me before recording
            <span className="block text-xs text-muted">
              The tool asks whether to post a decision or question, unless you told it to.
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            className="mt-0.5"
            checked={readOnly}
            onCheckedChange={(on) => {
              return setReadOnly(on === true);
            }}
          />
          <span>
            Read only
            <span className="block text-xs text-muted">
              The tool can read decisions, tickets and pages, but can't record anything.
            </span>
          </span>
        </label>
        <Button type="submit" variant="primary" className="self-start" loading={create.isPending}>
          <Key /> Create connection
        </Button>
      </form>
      {created && <Setup tool={created.tool} client={created.client} />}
    </Card>
  );
}

function Setup({ tool, client }: { tool: AiToolCreated; client: AiClient }) {
  const setup = aiClientSetup(client, tool.url, tool.token);

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4">
      <Banner type="warning">
        Copy this now. It holds the connection's token, which isn't shown again.
      </Banner>
      <p className="text-sm font-medium">{setup.where}</p>
      <Snippet text={setup.text} what="Setup" />
    </div>
  );
}

function Snippet({ text, what }: { text: string; what: string }) {
  return (
    <div className="flex items-start gap-2">
      <pre className="min-w-0 flex-1 overflow-x-auto rounded-md border border-border bg-background p-3 text-xs">
        {text}
      </pre>
      <Button
        onClick={() => {
          return void copy(text, what);
        }}
      >
        <Copy /> Copy
      </Button>
    </div>
  );
}

function Rules() {
  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium">Make it a habit</p>
        <p className="text-sm text-muted">
          A tool records when it recognises a decision, so it can miss one. Add these rules to your
          agent's instructions file (CLAUDE.md, AGENTS.md or GEMINI.md) so it checks decisions first
          and offers to record new ones.
        </p>
      </div>
      <Snippet text={AI_AGENT_RULES} what="Rules" />
    </Card>
  );
}

function Connected() {
  const tools = useAiTools();

  if (tools.isPending) {
    return <Skeleton className="h-24 w-full" />;
  }
  if (tools.isError) {
    return (
      <Banner
        type="error"
        action={
          <Button
            size="sm"
            onClick={() => {
              return tools.refetch();
            }}
          >
            Retry
          </Button>
        }
      >
        {tools.error.message}
      </Banner>
    );
  }
  if (tools.data.length === 0) {
    return <p className="text-sm text-muted">No AI tools connected yet.</p>;
  }
  return (
    <Card className="p-0">
      <ul className="divide-y divide-border">
        {tools.data.map((tool) => {
          return <ToolRow key={tool.id} tool={tool} />;
        })}
      </ul>
    </Card>
  );
}

function ToolRow({ tool }: { tool: AiTool }) {
  const update = useUpdateAiTool();
  const revoke = useRevokeAiTool();
  const canRecord = tool.scopes.includes(AI_TOOL_SCOPE.record);
  const expired = tool.expires_at !== null && new Date(tool.expires_at).getTime() < Date.now();

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <span className="truncate">{tool.label}</span>
          {!canRecord && <Tag>Read only</Tag>}
          {expired && <Tag variant="warning">Expired</Tag>}
        </p>
        <p className="truncate text-xs text-muted">
          {tool.workspace_name} ·{' '}
          {tool.last_used_at ? `used ${timeAgo(tool.last_used_at)}` : 'never used'}
          {canRecord && ` · ${tool.records_count} recorded`}
          {tool.expires_at && !expired
            && ` · expires ${new Date(tool.expires_at).toLocaleDateString()}`}
        </p>
      </div>
      {canRecord && (
        <label className="flex items-center gap-2 text-xs text-muted">
          Ask before recording
          <Switch
            checked={tool.ask_first}
            disabled={update.isPending}
            onCheckedChange={(on) => {
              return update.mutate({ id: tool.id, askFirst: on });
            }}
          />
        </label>
      )}
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
        description="It stops working right away. What it recorded stays in Decisions."
        confirmLabel="Disconnect"
        pending={revoke.isPending}
        onConfirm={(close) => {
          return revoke.mutate(tool.id, { onSuccess: close });
        }}
      />
    </li>
  );
}
