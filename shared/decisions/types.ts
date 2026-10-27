/** Where a decision stands. Only people move it; an AI suggestion starts as `proposed`. */
export const DECISION_STATUS = {
  open: 'open',
  proposed: 'proposed',
  accepted: 'accepted',
  rejected: 'rejected',
  superseded: 'superseded',
} as const;
export type DecisionStatus = (typeof DECISION_STATUS)[keyof typeof DECISION_STATUS];

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
};

export type Evidence = Required<NewEvidence> & {
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
  origin: 'manual' | 'suggested';
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
