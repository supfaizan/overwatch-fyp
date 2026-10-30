/** Where a decision stands. Only people move it; an AI suggestion starts as `proposed`. */
export const DECISION_STATUS = {
  open: 'open',
  proposed: 'proposed',
  accepted: 'accepted',
  rejected: 'rejected',
  superseded: 'superseded',
} as const;
export type DecisionStatus = (typeof DECISION_STATUS)[keyof typeof DECISION_STATUS];

/** Who drafted a decision: a person, or the AI (then it waits as `proposed` until someone settles it). */
export const DECISION_ORIGIN = { manual: 'manual', suggested: 'suggested' } as const;
export type DecisionOrigin = (typeof DECISION_ORIGIN)[keyof typeof DECISION_ORIGIN];

export const EVIDENCE_KIND = { workItem: 'work_item', document: 'document' } as const;
export type EvidenceKind = (typeof EVIDENCE_KIND)[keyof typeof EVIDENCE_KIND];

export const EVIDENCE_STANCE = { supports: 'supports', contradicts: 'contradicts' } as const;
export type EvidenceStance = (typeof EVIDENCE_STANCE)[keyof typeof EVIDENCE_STANCE];

/** How a quote compares with its source now. */
export const EVIDENCE_STATE = {
  current: 'current',
  changed: 'changed',
  quoteMissing: 'quote_missing',
  sourceGone: 'source_gone',
} as const;
export type EvidenceState = (typeof EVIDENCE_STATE)[keyof typeof EVIDENCE_STATE];

/** Why an automatic check read a source against a decision, strongest first. */
export const CHECK_MATCH = {
  quoted: 'quoted',
  linked: 'linked',
  mentioned: 'mentioned',
  similar: 'similar',
} as const;
export type CheckMatch = (typeof CHECK_MATCH)[keyof typeof CHECK_MATCH];

/** A passage from a board item or docs page; it must appear in that source as written. */
export type NewEvidence = {
  kind: EvidenceKind;
  ref_id: string;
  quote: string;
  stance?: EvidenceStance;
  /** why it supports or contradicts the decision, e.g. what an automatic check found */
  note?: string | null;
};

/** A source a decision rests on; `kind` and `ref_id` are null for one it cites without quoting that no longer links. */
export type DecisionSource = {
  id: string;
  kind: EvidenceKind | null;
  ref_id: string | null;
  title: string;
};

export type Evidence = Required<NewEvidence> & {
  note: string | null;
  id: string;
  title: string;
  external_url: string | null;
  /** a board item's board and key, to open it there; null for pages */
  board_id: string | null;
  item_key: string | null;
  added_by: string;
  added_at: string;
  state: EvidenceState;
  /** when the tracker or docs source it's mirrored from was last read, so `state` is as of then; null when written here */
  source_synced_at: string | null;
  /** set on evidence an automatic check added: why it read the source, and what it matched on (a key, a page, a 0..1 score) */
  match: { reason: CheckMatch; detail: string | null } | null;
};

export type HistoryEntry = { status: DecisionStatus; by: string; at: string; note: string | null };

export type Decision = {
  id: string;
  title: string;
  statement: string;
  context_md: string | null;
  area: string | null;
  status: DecisionStatus;
  origin: DecisionOrigin;
  owner_id: string | null;
  /** ISO date an open decision should be looked at again */
  review_by: string | null;
  superseded_by: string | null;
  evidence: Evidence[];
  /** the items and pages it rests on, numbered so its background can cite them as [S1]; S1 first */
  sources: DecisionSource[];
  history: HistoryEntry[];
  /** accepted, but its evidence broke or was contradicted since it was settled: it's in Needs you */
  needs_attention: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type DecisionFields = {
  title: string;
  statement: string;
  context_md?: string | null;
  area?: string | null;
  owner_id?: string | null;
  review_by?: string | null;
};

export type CreateDecision = DecisionFields & { status?: DecisionStatus; evidence?: NewEvidence[] };

/** Where a decision sits in the inbox, for the member looking at it (worked out by the backend). */
export const INBOX_TAB = { needsYou: 'needs_you', open: 'open', decided: 'decided' } as const;
export type InboxTab = (typeof INBOX_TAB)[keyof typeof INBOX_TAB];

export type InboxCounts = Record<InboxTab, number>;

/** `today` is the viewer's ISO date, which review dates are compared with. */
export type DecisionFilters = { tab?: InboxTab; today?: string; q?: string; ref_id?: string };

export type DecisionPage = { decisions: Decision[]; total: number; offset: number };

/** Who automatic decision checks act as, on the evidence they add and in usage. */
export const SYSTEM_USER = 'system';

/** How often a workspace's accepted decisions are checked against what changed, in minutes. */
export const CHECK_INTERVAL = { halfHour: 30, hour: 60, halfDay: 720, day: 1440 } as const;
export type CheckInterval = (typeof CHECK_INTERVAL)[keyof typeof CHECK_INTERVAL];

export type CheckResult = {
  /** changed items and pages read */
  checked: number;
  /** contradicting passages added to decisions */
  conflicts: number;
  /** the day's checks ran out before everything changed was read */
  capped: boolean;
};

/** The workspace's automatic decision checks: on every half hour unless it changed that. */
export type CheckSettings = {
  enabled: boolean;
  interval_minutes: CheckInterval;
  last_run_at: string | null;
  last_result: CheckResult | null;
};
