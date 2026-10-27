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

/** A passage from a board item or docs page; it must appear in that source as written. */
export type NewEvidence = {
  kind: EvidenceKind;
  ref_id: string;
  quote: string;
  stance?: EvidenceStance;
  /** why it supports or contradicts the decision, e.g. what an automatic check found */
  note?: string | null;
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
  history: HistoryEntry[];
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

export type DecisionFilters = { status?: DecisionStatus; q?: string; ref_id?: string };

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
