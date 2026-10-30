// mirrors the backend schemas (app/onboarding, app/connectors, app/workspaces)

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
export type Target = { key: string; name: string | null; id: string | null };

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

/** What a model call was made for, as AI usage is split by. */
export const USAGE_FEATURE = {
  chat: 'chat',
  decisionSuggest: 'decision_suggest',
  decisionCheck: 'decision_check',
  embeddings: 'embeddings',
} as const;
export type UsageFeature = (typeof USAGE_FEATURE)[keyof typeof USAGE_FEATURE];

export type UsageTotals = {
  calls: number;
  prompt_tokens: number;
  completion_tokens: number;
  cached_tokens: number;
  cost_usd: number;
};

/** One day's usage, with its calls per feature and per member for charting either way. */
export type DailyUsage = UsageTotals & {
  /** `YYYY-MM-DD` in `UsageSummary.time_zone`. */
  day: string;
  calls_by_feature: Partial<Record<UsageFeature, number>>;
  calls_by_member: Record<string, number>;
};

/** The current workspace's AI usage over the last `days` (today included), in total and by day, feature and member. */
export type UsageSummary = {
  days: number;
  /** The IANA time zone the days are counted in. */
  time_zone: string;
  total: UsageTotals;
  /** Days with usage only, newest first. */
  by_day: DailyUsage[];
  by_feature: (UsageTotals & { feature: UsageFeature })[];
  by_member: (UsageTotals & { user_id: string })[];
};

/** A limit on how much the AI may be used; each counts in its own unit (questions, runs, sources). */
export const USAGE_LIMIT_KIND = {
  chatQuestions: 'chat_questions',
  memberChatQuestions: 'member_chat_questions',
  decisionSuggestions: 'decision_suggestions',
  decisionChecks: 'decision_checks',
} as const;
export type UsageLimitKind = (typeof USAGE_LIMIT_KIND)[keyof typeof USAGE_LIMIT_KIND];

export type UsageLimit = { kind: UsageLimitKind; used: number; limit: number; resets_at: string };
