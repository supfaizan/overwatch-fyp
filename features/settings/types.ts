// mirrors the backend schemas (app/onboarding, app/connectors, app/workspaces, app/slack)

import type {
  ConnectionStatus as TrackerStatus,
  ConnectorCategory,
} from '@/shared/connections/constants';
import type { JobStatus } from '@/shared/lib/job-status';
import type { ROLE, Role } from '@/shared/workspaces/types';

/** Only the GitHub state settings shows; the full shape lives in the backend's onboarding schema. */
export type ConnectionStatus = {
  github: { authorized: boolean; needs_reauth: boolean };
};

export type SyncTarget = {
  key: string;
  name: string | null;
  sync_status: JobStatus;
  sync_error: string | null;
  last_synced_at: string | null;
};

/** A project (list, board) or docs space an account can sync; `id` is the key people know it by. */
/** `hint` says why it can't be added yet, e.g. a Slack channel the app hasn't been invited to. */
export type Target = { key: string; name: string | null; id: string | null; hint?: string | null };

/** A connector (Jira, Confluence, ...) and this workspace's state for it. */
export type Connection = {
  provider: string;
  name: string;
  category: ConnectorCategory;
  status: TrackerStatus;
  /** False when the grant can't write back (made before edits were): reconnect to edit. */
  can_write: boolean;
  /** True when the grant lacks a scope the connector now asks for (a board's columns): reconnect. */
  outdated: boolean;
  external_account: { id: string; name: string | null; url: string | null } | null;
  connected_at: string | null;
  targets: SyncTarget[];
};

export type InviteRole = Exclude<Role, typeof ROLE.owner>;

/** Who may accept: anyone with the link, one GitHub account, or one email address (mailed the link). */
export const INVITE_KIND = { link: 'link', github: 'github', email: 'email' } as const;
export type InviteKind = (typeof INVITE_KIND)[keyof typeof INVITE_KIND];

export type Invite = {
  id: string;
  kind: InviteKind;
  role: InviteRole;
  github_login: string | null;
  email: string | null;
  created_at: string;
  expires_at: string;
  last_sent_at: string | null;
};

/** `url` carries the token and is shown once; email invites have none, the link only goes to that inbox. */
export type InviteCreated = Invite & { url: string | null };

export type UsageTotals = {
  /** What was taken from the monthly allowance: chat questions, suggestion runs, sources checked. */
  actions: number;
  /** Model calls, embeddings included; one action may make several. */
  calls: number;
  prompt_tokens: number;
  completion_tokens: number;
  cached_tokens: number;
  cost_usd: number;
};

export type DailyUsage = UsageTotals & {
  /** `YYYY-MM-DD` in `UsageSummary.time_zone`. */
  day: string;
};

/** The current workspace's AI usage over the last `days` (today included), in total and by day and member. */
export type UsageSummary = {
  days: number;
  /** The IANA time zone the days are counted in. */
  time_zone: string;
  total: UsageTotals;
  /** Days with usage only, newest first. */
  by_day: DailyUsage[];
  by_member: (UsageTotals & { user_id: string })[];
};

/** A limit on how much the AI may be used; each counts in its own unit (questions, runs, sources). */
export const USAGE_LIMIT_KIND = {
  aiActions: 'ai_actions',
  chatQuestions: 'chat_questions',
  memberChatQuestions: 'member_chat_questions',
  decisionSuggestions: 'decision_suggestions',
  decisionChecks: 'decision_checks',
} as const;
export type UsageLimitKind = (typeof USAGE_LIMIT_KIND)[keyof typeof USAGE_LIMIT_KIND];

export type UsageLimit = { kind: UsageLimitKind; used: number; limit: number; resets_at: string };

/** When the Slack bot posts its daily digest of unsettled questions and decisions found. */
export type SlackDigestSettings = {
  enabled: boolean;
  /** 24-hour time of day, e.g. "10:00" */
  time: string;
  /** IANA zone; null until an admin saves one, and the digest runs in UTC meanwhile */
  time_zone: string | null;
};
