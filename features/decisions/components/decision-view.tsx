'use client';

import Avatar from '@/shared/components/avatar';
import Banner from '@/shared/components/banner';
import Button from '@/shared/components/button';
import { DatePicker } from '@/shared/components/date-picker';
import EditableMarkdown from '@/shared/components/editable-markdown';
import InlineTitleInput from '@/shared/components/inline-title-input';
import { Input } from '@/shared/components/input';
import Markdown, { InlineCode } from '@/shared/components/markdown';
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
  type DecisionFields,
  type DecisionSource,
  type DecisionStatus,
} from '@/shared/decisions/types';
import { cn } from '@/shared/lib/cn';
import { timeAgo } from '@/shared/lib/time';
import { displayName } from '@/shared/session/lib';
import { useWorkspaceMembers } from '@/shared/workspaces/hooks';
import { CaretDown, CaretLeft, Sparkle } from '@phosphor-icons/react/ssr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from 'react';
import DiscussionPane from '../discussion/components/discussion-pane';
import { citationsToCode } from '../lib';
import CitationChip from './citation-chip';
import SourcesEvidence from './sources-evidence';
import SupersedeDialog from './supersede-dialog';

const NO_OWNER = 'none';
// the backend's limits (app/decisions/schemas.py)
const TITLE_MAX = 200;
const STATEMENT_MAX = 2000;
const AREA_MAX = 60;
// the statement's heading: only an accepted decision was decided
const STATEMENT_LABELS: Record<DecisionStatus, string> = {
  proposed: 'Proposed decision',
  open: 'Being discussed',
  accepted: 'What was decided',
  rejected: 'What was rejected',
  superseded: 'What was decided, since replaced',
};
// how long a source's card stays highlighted after its citation is clicked
const JUMP_HIGHLIGHT_MS = 2000;

/** One decision: what was decided, the passages it rests on, and how it got here. */
export default function DecisionView({ id }: { id: string }) {
  const decision = useDecision(id);

  // wide screens: the decision and its discussion side by side, each scrolling on its own;
  // narrow ones: one column, the discussion last
  return (
    <div className="h-full overflow-y-auto lg:overflow-hidden">
      <div className="mx-auto grid w-full max-w-6xl gap-6 pt-4 lg:h-full lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 pb-6 lg:col-span-2 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
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
        {decision.data && (
          <div className="h-[70dvh] pb-6 lg:h-full lg:min-h-0">
            <DiscussionPane decisionId={decision.data.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function DecisionDetails({ decision }: { decision: Decision }) {
  const members = useWorkspaceMembers();
  const update = useUpdateDecision();
  // the source a citation in the background points at: its card is highlighted
  const [pointed, setPointed] = useState<string | null>(null);
  // the source last jumped to from a citation: highlighted for a moment, once the pointer has left
  const [jumped, setJumped] = useState<string | null>(null);
  const jumpTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    return () => {
      return clearTimeout(jumpTimer.current);
    };
  }, []);
  const jump = (sourceId: string) => {
    clearTimeout(jumpTimer.current);
    setJumped(sourceId);
    jumpTimer.current = setTimeout(() => {
      return setJumped(null);
    }, JUMP_HIGHLIGHT_MS);
  };
  const save = (changes: Partial<DecisionFields>) => {
    return update.mutate({ id: decision.id, ...changes });
  };
  const nameOf = (userId: string) => {
    const member = members.data?.find((m) => {
      return m.user_id === userId;
    });
    return member ? displayName(member) : 'Former member';
  };

  return (
    <div className="flex flex-col gap-6">
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
        {/* keyed by the saved text, so a change saved elsewhere replaces the draft */}
        <InlineTitleInput
          key={decision.title}
          aria-label="Decision"
          value={decision.title}
          maxLength={TITLE_MAX}
          className="-mx-2"
          onSave={(title) => {
            return save({ title });
          }}
        />
        <StatementField
          key={decision.statement}
          value={decision.statement}
          status={decision.status}
          onSave={(statement) => {
            return save({ statement });
          }}
        />
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

      <details open className="group rounded-lg border border-border">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg p-4 text-sm font-semibold hover:bg-fill-hover focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
          Details
          <CaretDown
            aria-hidden
            className="size-4 shrink-0 text-muted transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="grid gap-3 px-4 pb-4 md:grid-cols-2 md:gap-x-8">
          <Detail label="Owner">
            <Select
              value={decision.owner_id ?? NO_OWNER}
              onValueChange={(ownerId) => {
                return save({ owner_id: ownerId === NO_OWNER ? null : ownerId });
              }}
            >
              <SelectTrigger size="sm" aria-label="Owner" />
              <SelectContent>
                <SelectItem value={NO_OWNER}>No owner</SelectItem>
                {members.data?.map((member) => {
                  return (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      <span className="flex items-center gap-2">
                        <Avatar src={member.avatar_url} name={displayName(member)} size="sm" />
                        {displayName(member)}
                      </span>
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
                return save({ review_by: value });
              }}
            />
          </Detail>
          <Detail label="Area">
            <AreaField
              key={decision.area ?? ''}
              value={decision.area}
              onSave={(area) => {
                return save({ area });
              }}
            />
          </Detail>
          <Detail label="Recorded">
            <span className="flex min-w-0 items-center gap-2 text-sm">
              <Avatar
                src={members.data?.find((m) => {
                  return m.user_id === decision.created_by;
                })?.avatar_url}
                name={nameOf(decision.created_by)}
                size="sm"
              />
              <span className="truncate">{nameOf(decision.created_by)}</span>
              <span className="shrink-0 text-muted">· {timeAgo(decision.created_at)}</span>
            </span>
          </Detail>
          <Detail label="Updated">
            <span className="text-sm text-muted">{timeAgo(decision.updated_at)}</span>
          </Detail>
        </div>
      </details>

      <EditableMarkdown
        label="Background"
        value={decision.context_md}
        saving={update.isPending}
        fullHeight
        placeholder="Why it was decided, what was weighed… Markdown shortcuts work."
        onSave={(context_md) => {
          return save({ context_md });
        }}
        renderValue={(value) => {
          return (
            <CitedMarkdown
              value={value}
              sources={decision.sources}
              onPoint={setPointed}
              onJump={jump}
            />
          );
        }}
      />
      <SourcesEvidence decision={decision} pointed={pointed ?? jumped} />
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
  );
}

/** The background with its citations ([S1]) as chips that point at their sources. */
function CitedMarkdown(
  { value, sources, onPoint, onJump }: {
    value: string;
    sources: DecisionSource[];
    onPoint: (sourceId: string | null) => void;
    onJump: (sourceId: string) => void;
  },
) {
  const byId = new Map(sources.map((source) => {
    return [source.id, source];
  }));
  const components = {
    inlineCode: ({ children, ...props }: ComponentProps<'code'>) => {
      const source = byId.get(String(children));
      return source
        ? <CitationChip source={source} onPoint={onPoint} onJump={onJump} />
        : <InlineCode {...props}>{children}</InlineCode>;
    },
  };
  return (
    <Markdown components={components}>
      {citationsToCode(value, new Set(byId.keys()))}
    </Markdown>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-5 items-center gap-2">
      <span className="col-span-2 text-xs text-muted">{label}</span>
      <div className="col-span-3 min-w-0">{children}</div>
    </div>
  );
}

/** The decision's statement, edited where it's shown: saves on blur or ⌘/Ctrl+Enter; Esc puts it back. */
function StatementField(
  { value, status, onSave }: {
    value: string;
    status: DecisionStatus;
    onSave: (value: string) => void;
  },
) {
  const decided = status === DECISION_STATUS.accepted;
  const label = STATEMENT_LABELS[status];
  const [draft, setDraft] = useState(value);
  const commit = () => {
    const statement = draft.trim();
    if (statement && statement !== value) {
      onSave(statement);
    } else {
      setDraft(value);
    }
  };
  return (
    // a button's raised look, standing still: primary once decided, secondary until then
    <div
      className={cn(
        'flex flex-col gap-1 rounded-lg border px-4 py-3 shadow-chrome',
        decided
          ? 'border-primary-strong bg-primary/5 shadow-primary-strong'
          : 'border-border-strong bg-fill-hover shadow-border-strong',
      )}
    >
      <span
        className={cn(
          'text-xs font-semibold tracking-wide uppercase',
          decided ? 'text-primary-strong dark:text-primary' : 'text-muted',
        )}
      >
        {label}
      </span>
      <textarea
        aria-label={label}
        className="field-sizing-content min-h-12 w-full resize-none rounded-md border border-transparent bg-transparent text-base leading-relaxed font-medium outline-none hover:border-primary/30 focus:border-primary"
        maxLength={STATEMENT_MAX}
        value={draft}
        onChange={(e) => {
          return setDraft(e.target.value);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.currentTarget.blur();
          } else if (e.key === 'Escape') {
            const field = e.currentTarget;
            setDraft(value);
            // after the re-render, so the blur sees the reverted draft and saves nothing
            requestAnimationFrame(() => {
              return field.blur();
            });
          }
        }}
      />
    </div>
  );
}

/** The decision's area, a short free-text label: saves on blur or Enter; empty clears it. */
function AreaField(
  { value, onSave }: { value: string | null; onSave: (value: string | null) => void },
) {
  const [draft, setDraft] = useState(value ?? '');
  return (
    <Input
      size="sm"
      aria-label="Area"
      placeholder="None"
      maxLength={AREA_MAX}
      value={draft}
      onChange={(e) => {
        return setDraft(e.target.value);
      }}
      onBlur={() => {
        const area = draft.trim() || null;
        if (area !== value) {
          onSave(area);
        }
      }}
      onKeyDown={(e) => {
        return e.key === 'Enter' && e.currentTarget.blur();
      }}
    />
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

  const cited = decision.sources.map((source) => {
    return source.id;
  });
  return (
    <section
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3',
        reviewing ? 'border-primary/30 bg-primary/5' : 'border-border',
      )}
    >
      {reviewing && (
        <p className="flex items-start gap-2 text-sm">
          <Sparkle aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            Drafted by AI{cited.length > 0 && ` from ${cited.join(', ')}`}. The pros, cons and
            example are its reading of the sources: check them before accepting.
          </span>
        </p>
      )}
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
