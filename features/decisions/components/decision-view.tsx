'use client';

import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import { DatePicker } from '@/shared/components/date-picker';
import { Input } from '@/shared/components/input';
import Markdown from '@/shared/components/markdown';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/shared/components/select';
import Skeleton from '@/shared/components/skeleton';
import Tag from '@/shared/components/tag';
import {
  useChangeStatus,
  useDecision,
  useDismissSuggestion,
  useUpdateDecision,
} from '@/shared/decisions/hooks';
import { STATUS_LABELS, STATUS_TAGS } from '@/shared/decisions/lib';
import {
  type Decision,
  DECISION_ORIGIN,
  DECISION_STATUS,
  type DecisionStatus,
} from '@/shared/decisions/types';
import { timeAgo } from '@/shared/lib/time';
import { displayName } from '@/shared/session/lib';
import { useWorkspaceMembers } from '@/shared/workspaces/hooks';
import { CaretLeft, PencilSimple, Sparkle } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import EditDecisionDialog from './edit-decision-dialog';
import EvidenceList from './evidence-list';
import SupersedeDialog from './supersede-dialog';

const NO_OWNER = 'none';

/** One decision: what was decided, the passages it rests on, and how it got here. */
export default function DecisionView({ id }: { id: string }) {
  const decision = useDecision(id);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 pb-6">
        <Link
          href="/decisions"
          className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
        >
          <CaretLeft aria-hidden />
          Decisions
        </Link>
        {decision.isPending && <Skeleton className="h-64 w-full" />}
        {decision.isError && <Banner type="error">{decision.error.message}</Banner>}
        {decision.data && <DecisionDetails decision={decision.data} />}
      </div>
    </div>
  );
}

function DecisionDetails({ decision }: { decision: Decision }) {
  const members = useWorkspaceMembers();
  const update = useUpdateDecision();
  const [editing, setEditing] = useState(false);
  const nameOf = (userId: string) => {
    const member = members.data?.find((m) => {
      return m.user_id === userId;
    });
    return member ? displayName(member) : 'Former member';
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-4 md:col-span-2">
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Tag variant={STATUS_TAGS[decision.status]}>{STATUS_LABELS[decision.status]}</Tag>
            {decision.area && <Tag>{decision.area}</Tag>}
            {decision.origin === DECISION_ORIGIN.suggested && (
              <Tag variant="primary">
                <Sparkle aria-hidden />
                Suggested by AI
              </Tag>
            )}
          </div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-lg font-bold">{decision.title}</h1>
            <Button
              size="sm"
              variant="tertiary"
              onClick={() => {
                return setEditing(true);
              }}
            >
              <PencilSimple aria-hidden />
              Edit
            </Button>
          </div>
          <p className="text-sm whitespace-pre-wrap">{decision.statement}</p>
          {decision.context_md && <Markdown className="text-sm">{decision.context_md}</Markdown>}
        </header>
        {decision.superseded_by && (
          <Banner type="info">
            Replaced by{' '}
            <Link href={`/decisions/${decision.superseded_by}`} className="underline">
              a newer decision
            </Link>
            .
          </Banner>
        )}
        <StatusActions decision={decision} />
        <EvidenceList decision={decision} />
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold">History</h2>
          <ol className="flex flex-col gap-2 border-l border-border pl-4">
            {decision.history.map((entry) => {
              return (
                <li key={`${entry.at}-${entry.status}`} className="text-sm">
                  <span className="font-medium">{STATUS_LABELS[entry.status]}</span>
                  <span className="text-muted">
                    {' · '}
                    {nameOf(entry.by)} · {timeAgo(entry.at)}
                  </span>
                  {entry.note && <p className="text-muted">{entry.note}</p>}
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <aside className="flex flex-col gap-3 rounded-lg border border-border p-4 md:self-start">
        <Detail label="Owner">
          <Select
            value={decision.owner_id ?? NO_OWNER}
            onValueChange={(ownerId) => {
              return update.mutate({
                id: decision.id,
                owner_id: ownerId === NO_OWNER ? null : ownerId,
              });
            }}
          >
            <SelectTrigger size="sm" aria-label="Owner" />
            <SelectContent>
              <SelectItem value={NO_OWNER}>No owner</SelectItem>
              {members.data?.map((member) => {
                return (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {displayName(member)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </Detail>
        <Detail label="Review by">
          <DatePicker
            size="sm"
            aria-label="Review by"
            placeholder="None"
            value={decision.review_by}
            onChange={(value) => {
              return update.mutate({ id: decision.id, review_by: value });
            }}
          />
        </Detail>
        <Detail label="Recorded">
          <span className="text-sm">
            {nameOf(decision.created_by)} · {timeAgo(decision.created_at)}
          </span>
        </Detail>
      </aside>

      {editing && <EditDecisionDialog decision={decision} onOpenChange={setEditing} />}
    </div>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      {children}
    </div>
  );
}

const ACTIONS: { status: DecisionStatus; label: string }[] = [
  { status: DECISION_STATUS.accepted, label: 'Accept' },
  { status: DECISION_STATUS.open, label: 'Still discussing' },
  { status: DECISION_STATUS.rejected, label: 'Reject' },
];

/** Settling the decision: people move it, with an optional note on why. */
function StatusActions({ decision }: { decision: Decision }) {
  const router = useRouter();
  const change = useChangeStatus();
  const dismiss = useDismissSuggestion();
  // an AI suggestion waiting for review is dismissed rather than rejected, so it isn't kept
  const reviewing = decision.origin === DECISION_ORIGIN.suggested
    && decision.status === DECISION_STATUS.proposed;
  const [note, setNote] = useState('');
  const [superseding, setSuperseding] = useState(false);

  const move = (status: DecisionStatus) => {
    change.mutate(
      { id: decision.id, status, ...(note.trim() && { note: note.trim() }) },
      {
        onSuccess: () => {
          return setNote('');
        },
      },
    );
  };

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <Input
        size="sm"
        aria-label="Note"
        placeholder="Note on why (optional)"
        maxLength={500}
        value={note}
        onChange={(e) => {
          return setNote(e.target.value);
        }}
      />
      <div className="flex flex-wrap gap-2">
        {ACTIONS.filter((action) => {
          return action.status !== decision.status
            && !(reviewing && action.status === DECISION_STATUS.rejected);
        }).map((action) => {
          return (
            <Button
              key={action.status}
              size="sm"
              variant={action.status === DECISION_STATUS.accepted ? 'primary' : 'secondary'}
              disabled={change.isPending}
              onClick={() => {
                return move(action.status);
              }}
            >
              {action.label}
            </Button>
          );
        })}
        {reviewing && (
          <Button
            size="sm"
            variant="tertiary"
            loading={dismiss.isPending}
            onClick={() => {
              return dismiss.mutate(decision.id, {
                onSuccess: () => {
                  return router.push('/decisions');
                },
              });
            }}
          >
            Not a decision
          </Button>
        )}
        {decision.status === DECISION_STATUS.accepted && (
          <Button
            size="sm"
            variant="tertiary"
            onClick={() => {
              return setSuperseding(true);
            }}
          >
            Replace with…
          </Button>
        )}
      </div>
      {superseding && (
        <SupersedeDialog decision={decision} note={note.trim()} onOpenChange={setSuperseding} />
      )}
    </section>
  );
}
